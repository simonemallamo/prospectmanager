import { db, FieldValue, adminAuth, getMetaIntegrationConfig, isMetaIntegrationOwner } from './_firebase-admin.mjs';
import { graph as metaGraph, graphVersion as gv, describeGraphError, graphErrorSummary } from './_meta-graph.mjs';
const graph=(path,params={})=>{const {access_token,...rest}=params;return metaGraph(path,{token:access_token,tokenKind:'user',params:rest});};
const graphPost=(path,params={},tokenKind='page')=>{const {access_token,...rest}=params;return metaGraph(path,{token:access_token,tokenKind,params:rest,method:'POST'});};
export default async function handler(request) {
  if(request.method!=='GET') return new Response('Method not allowed',{status:405});
  const u=new URL(request.url), code=u.searchParams.get('code'), state=u.searchParams.get('state');
  if(u.searchParams.get('error')) return new Response(`Meta authorization failed: ${u.searchParams.get('error_description')||u.searchParams.get('error')}`,{status:400});
  if(!code||!state) return new Response('Missing code/state',{status:400});
  try {
    const stateRef=db.collection('meta_oauth_states').doc(state), snap=await stateRef.get();
    if(!snap.exists) return new Response('Invalid or expired OAuth state',{status:400});
    const s=snap.data();
    if(!s.uid || !s.expiresAt || s.expiresAt.toDate().getTime()<Date.now()){await stateRef.delete();return new Response('Expired OAuth state',{status:400});}
    const identity=await adminAuth.getUser(s.uid);
    if(!identity.emailVerified || !isMetaIntegrationOwner({email:identity.email,email_verified:identity.emailVerified}) || s.ownerEmail!==String(identity.email||'').trim().toLowerCase()) return new Response('Meta integration is restricted to the authorized account.',{status:403});
    const metaConfig=getMetaIntegrationConfig(identity.email);
    const {appId,appSecret,pageId:configuredPageId,adAccountId:configuredAdAccountId}=metaConfig||{};
    const redirectUri=process.env.META_REDIRECT_URI;
    if(!appId||!appSecret||!configuredPageId||!redirectUri) throw new Error('Meta configuration is incomplete for this account.');
    const tokenUrl=new URL(`https://graph.facebook.com/${gv()}/oauth/access_token`);
    for(const [k,v] of Object.entries({client_id:appId,client_secret:appSecret,redirect_uri:redirectUri,code})) tokenUrl.searchParams.set(k,v);
    const tr=await fetch(tokenUrl), td=await tr.json();
    if(!tr.ok||td.error||!td.access_token) throw new Error(td?.error?.message||'Could not exchange Meta authorization code');
    // Exchange for a long-lived user token. Page tokens derived from a
    // short-lived user token expire after ~1 hour, which silently broke the
    // webhook lead lookup; derived from a long-lived token they do not expire.
    const longUrl=new URL(`https://graph.facebook.com/${gv()}/oauth/access_token`);
    for(const [k,v] of Object.entries({grant_type:'fb_exchange_token',client_id:appId,client_secret:appSecret,fb_exchange_token:td.access_token})) longUrl.searchParams.set(k,v);
    const lr=await fetch(longUrl), ld=await lr.json();
    if(!lr.ok||ld.error||!ld.access_token) throw new Error(`Meta non ha rilasciato il token a lunga durata (codice ${ld?.error?.code??lr.status}): ${ld?.error?.message||'errore sconosciuto'}`);
    td.access_token=ld.access_token;
    const userTokenExpiresAt=ld.expires_in?new Date(Date.now()+Number(ld.expires_in)*1000):null;
    const grantedPermissions=((await graph('me/permissions',{access_token:td.access_token})).data||[]).filter(item=>item.status==='granted').map(item=>item.permission);
    const availablePages=[];
    let after='',pageRequests=0;
    do {
      const pageBatch=await graph('me/accounts',{access_token:td.access_token,fields:'id,name,access_token,tasks',limit:100,after:after||undefined});
      availablePages.push(...(pageBatch.data||[]));
      after=pageBatch.paging?.cursors?.after||'';
      pageRequests++;
      if(!(pageBatch.paging?.next)||pageRequests>=10) after='';
    } while(after);
    let page=availablePages.find(p=>String(p.id)===configuredPageId);
    // Some Business Login grants can access the assigned Page by ID even when
    // the user's /me/accounts edge does not enumerate it. Query only the Page
    // configured for this integration; never broaden the permission request.
    if(!page?.access_token){
      try{
        const configuredPage=await graph(configuredPageId,{access_token:td.access_token,fields:'id,name,access_token'});
        if(String(configuredPage?.id)===configuredPageId&&configuredPage.access_token)page=configuredPage;
      }catch(error){
        console.warn('Meta configured Page direct lookup failed',{appKey:metaConfig.key,error:error?.message||'Graph API error'});
      }
    }
    if(!page?.access_token){
      const requiredPermissions=['pages_show_list','pages_read_engagement','pages_manage_metadata','pages_manage_ads','leads_retrieval'];
      const missingPermissions=requiredPermissions.filter(permission=>!grantedPermissions.includes(permission));
      // Diagnostics intentionally exclude access tokens, lead data and OAuth codes.
      console.error('Meta Page lookup failed',{
        appKey:metaConfig.key,
        configuredPageReturned:Boolean(page),
        configuredPageTokenReturned:Boolean(page?.access_token),
        accessiblePageCount:availablePages.length,
        grantedPermissions,
        missingPermissions
      });
      if(missingPermissions.length){
        throw new Error(`Meta non ha concesso i permessi necessari (${missingPermissions.join(', ')}). Riprova il collegamento e approva l’accesso richiesto.`);
      }
      if(page){
        throw new Error('Meta ha restituito la Pagina ma non il relativo token di accesso. Verifica che il tuo profilo abbia accesso completo alla Pagina e ripeti l’autorizzazione.');
      }
      throw new Error('Meta non ha restituito la Pagina Facebook configurata tra quelle accessibili a questo account. Verifica i permessi della Pagina e ripeti l’autorizzazione.');
    }
    let adAccount=null;
    if(configuredAdAccountId){
      const availableAccounts=[];
      let accountCursor='',accountRequests=0;
      do{
        const accountBatch=await graph('me/adaccounts',{access_token:td.access_token,fields:'id,account_id,name',limit:100,after:accountCursor||undefined});
        availableAccounts.push(...(accountBatch.data||[]));
        accountCursor=accountBatch.paging?.cursors?.after||'';
        accountRequests++;
        if(!accountBatch.paging?.next||accountRequests>=10)accountCursor='';
      }while(accountCursor);
      adAccount=availableAccounts.find(account=>String(account.account_id||account.id||'').replace(/^act_/,'')===String(configuredAdAccountId).replace(/^act_/,''));
      if(!adAccount){
        throw new Error(`Meta non ha restituito l’account pubblicitario personale ${configuredAdAccountId}. Durante il collegamento seleziona “Il tuo account” > Simone Mallamo e autorizza l’account ${configuredAdAccountId}; non è necessario aggiungerlo a un portfolio.`);
      }
    }
    const uid=s.uid;
    const pageRef=db.collection('meta_pages').doc(String(page.id)),existingPage=await pageRef.get();
    if(existingPage.exists&&existingPage.data()?.uid&&existingPage.data().uid!==uid) throw new Error('Questa Pagina Facebook è già collegata a un altro profilo Prospect Manager.');
    const missingAdsPermissions=['ads_read','leads_retrieval','pages_manage_ads'].filter(permission=>!grantedPermissions.includes(permission));
    if(configuredAdAccountId&&missingAdsPermissions.length) throw new Error(`Meta non ha concesso i permessi necessari (${missingAdsPermissions.join(', ')}). Riprova il collegamento e approva l’accesso richiesto.`);
    await graphPost(`${configuredPageId}/subscribed_apps`,{access_token:page.access_token,subscribed_fields:'leadgen'});
    // Confirm the leadgen subscription really exists on the Page.
    let webhookSubscribed=false;
    try{
      const subs=await graph(`${configuredPageId}/subscribed_apps`,{access_token:page.access_token});
      webhookSubscribed=(subs.data||[]).some(app=>String(app.id)===String(appId)&&(app.subscribed_fields||[]).includes('leadgen'));
    }catch(error){console.warn('Meta subscribed_apps check failed',describeGraphError(error));}
    console.info('meta-oauth-callback connected',{appKey:metaConfig.key,pageId:String(page.id),adAccountLinked:Boolean(adAccount),webhookSubscribed,grantedPermissions,userTokenExpiresAt:userTokenExpiresAt?.toISOString?.()||'never'});
    await db.collection('meta_connections').doc(uid).set({uid,ownerEmail:metaConfig.email,appKey:metaConfig.key,connected:true,connectedAt:FieldValue.serverTimestamp(),pages:[{id:page.id,name:page.name||'',tasks:page.tasks||[]}],...(adAccount?{adAccounts:[{id:String(adAccount.account_id||adAccount.id).replace(/^act_/,''),name:adAccount.name||''}]}:{})},{merge:true});
    const batch=db.batch();
    batch.set(pageRef,{uid,ownerEmail:metaConfig.email,appKey:metaConfig.key,pageId:String(page.id),pageName:page.name||'',pageAccessToken:page.access_token,userAccessToken:td.access_token,userTokenExpiresAt,grantedPermissions,webhookSubscribed,...(adAccount?{adAccountId:String(adAccount.account_id||adAccount.id).replace(/^act_/,'')}:{}) ,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.delete(stateRef); await batch.commit();
    const appUrl=(process.env.FRONTEND_URL||'https://pm.retiredyoung.it/').replace(/\/$/,'');
    return Response.redirect(`${appUrl}/?meta=connected&pages=1`,302);
  } catch(e){console.error('meta-oauth-callback failed',describeGraphError(e));return new Response(`Meta connection failed: ${graphErrorSummary(e)||'unknown error'}`,{status:500});}
}
export const config={path:'/.netlify/functions/meta-oauth-callback'};
