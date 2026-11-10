import { db, FieldValue, adminAuth, getMetaIntegrationConfig, isMetaIntegrationOwner } from './_firebase-admin.mjs';
const gv=()=>process.env.META_GRAPH_VERSION||'v27.0';
async function graph(path, params={}) {
  const u=new URL(`https://graph.facebook.com/${gv()}/${path}`);
  for(const [k,v] of Object.entries(params)) if(v!=null) u.searchParams.set(k,String(v));
  const r=await fetch(u); const d=await r.json();
  if(!r.ok || d.error) throw new Error(d?.error?.message||`Graph API error (${r.status})`);
  return d;
}
async function graphPost(path, params={}) {
  const u=new URL(`https://graph.facebook.com/${gv()}/${path}`);
  const body=new URLSearchParams();
  for(const [k,v] of Object.entries(params)) if(v!=null) body.set(k,String(v));
  const r=await fetch(u,{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
  const d=await r.json();
  if(!r.ok || d.error) throw new Error(d?.error?.message||`Graph API error (${r.status})`);
  return d;
}
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
    const {appId,appSecret,pageId:configuredPageId}=metaConfig||{};
    const redirectUri=process.env.META_REDIRECT_URI;
    if(!appId||!appSecret||!configuredPageId||!redirectUri) throw new Error('Meta configuration is incomplete for this account.');
    const tokenUrl=new URL(`https://graph.facebook.com/${gv()}/oauth/access_token`);
    for(const [k,v] of Object.entries({client_id:appId,client_secret:appSecret,redirect_uri:redirectUri,code})) tokenUrl.searchParams.set(k,v);
    const tr=await fetch(tokenUrl), td=await tr.json();
    if(!tr.ok||td.error||!td.access_token) throw new Error(td?.error?.message||'Could not exchange Meta authorization code');
    const availablePages=[];
    let after='',pageRequests=0;
    do {
      const pageBatch=await graph('me/accounts',{access_token:td.access_token,fields:'id,name,access_token,tasks',limit:100,after:after||undefined});
      availablePages.push(...(pageBatch.data||[]));
      after=pageBatch.paging?.cursors?.after||'';
      pageRequests++;
      if(!(pageBatch.paging?.next)||pageRequests>=10) after='';
    } while(after);
    const page=availablePages.find(p=>String(p.id)===configuredPageId);
    if(!page?.access_token){
      const permissionData=await graph('me/permissions',{access_token:td.access_token});
      const requiredPermissions=['pages_show_list','pages_read_engagement','pages_manage_metadata','leads_retrieval'];
      const grantedPermissions=(permissionData.data||[])
        .filter(item=>item.status==='granted')
        .map(item=>item.permission);
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
    const uid=s.uid;
    const pageRef=db.collection('meta_pages').doc(String(page.id)),existingPage=await pageRef.get();
    if(existingPage.exists&&existingPage.data()?.uid&&existingPage.data().uid!==uid) throw new Error('Questa Pagina Facebook è già collegata a un altro profilo Prospect Manager.');
    await graphPost(`${configuredPageId}/subscribed_apps`,{access_token:page.access_token,subscribed_fields:'leadgen'});
    await db.collection('meta_connections').doc(uid).set({uid,ownerEmail:metaConfig.email,appKey:metaConfig.key,connected:true,connectedAt:FieldValue.serverTimestamp(),pages:[{id:page.id,name:page.name||'',tasks:page.tasks||[]}]},{merge:true});
    const batch=db.batch();
    batch.set(pageRef,{uid,ownerEmail:metaConfig.email,appKey:metaConfig.key,pageId:String(page.id),pageName:page.name||'',pageAccessToken:page.access_token,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.delete(stateRef); await batch.commit();
    const appUrl=(process.env.FRONTEND_URL||'https://pm.retiredyoung.it/').replace(/\/$/,'');
    return Response.redirect(`${appUrl}/?meta=connected&pages=1`,302);
  } catch(e){console.error('meta-oauth-callback:',e);return new Response(`Meta connection failed: ${e.message||'unknown error'}`,{status:500});}
}
export const config={path:'/.netlify/functions/meta-oauth-callback'};
