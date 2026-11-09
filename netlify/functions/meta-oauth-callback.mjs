import { db, FieldValue, adminAuth, isMetaIntegrationOwner } from './_firebase-admin.mjs';
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
    if(!identity.emailVerified || !isMetaIntegrationOwner({email:identity.email,email_verified:identity.emailVerified})) return new Response('Meta integration is restricted to the authorized owner account.',{status:403});
    const appId=process.env.META_APP_ID, appSecret=process.env.META_APP_SECRET, redirectUri=process.env.META_REDIRECT_URI;
    if(!appId||!appSecret||!redirectUri) throw new Error('Missing META_APP_ID, META_APP_SECRET or META_REDIRECT_URI');
    const tokenUrl=new URL(`https://graph.facebook.com/${gv()}/oauth/access_token`);
    for(const [k,v] of Object.entries({client_id:appId,client_secret:appSecret,redirect_uri:redirectUri,code})) tokenUrl.searchParams.set(k,v);
    const tr=await fetch(tokenUrl), td=await tr.json();
    if(!tr.ok||td.error||!td.access_token) throw new Error(td?.error?.message||'Could not exchange Meta authorization code');
    const pages=await graph('me/accounts',{access_token:td.access_token,fields:'id,name,access_token,tasks'});
    const configuredPageId=String(process.env.META_PAGE_ID||'105505198156981');
    const page=(pages.data||[]).find(p=>String(p.id)===configuredPageId);
    if(!page?.access_token) throw new Error('La pagina Facebook autorizzata non è disponibile per questo account.');
    await graphPost(`${configuredPageId}/subscribed_apps`,{access_token:page.access_token,subscribed_fields:'leadgen'});
    const uid=s.uid;
    await db.collection('meta_connections').doc(uid).set({uid,connected:true,connectedAt:FieldValue.serverTimestamp(),pages:[{id:page.id,name:page.name||'',tasks:page.tasks||[]}]},{merge:true});
    const batch=db.batch();
    batch.set(db.collection('meta_pages').doc(String(page.id)),{uid,pageId:String(page.id),pageName:page.name||'',pageAccessToken:page.access_token,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.delete(stateRef); await batch.commit();
    const appUrl=(process.env.FRONTEND_URL||'https://pm.retiredyoung.it/').replace(/\/$/,'');
    return Response.redirect(`${appUrl}/?meta=connected&pages=1`,302);
  } catch(e){console.error('meta-oauth-callback:',e);return new Response(`Meta connection failed: ${e.message||'unknown error'}`,{status:500});}
}
export const config={path:'/.netlify/functions/meta-oauth-callback'};
