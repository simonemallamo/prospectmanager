import { db, FieldValue } from './_firebase-admin.mjs';
const gv=()=>process.env.META_GRAPH_VERSION||'v24.0';
async function graph(path, params={}) {
  const u=new URL(`https://graph.facebook.com/${gv()}/${path}`);
  for(const [k,v] of Object.entries(params)) if(v!=null) u.searchParams.set(k,String(v));
  const r=await fetch(u); const d=await r.json();
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
    const appId=process.env.META_APP_ID, appSecret=process.env.META_APP_SECRET, redirectUri=process.env.META_REDIRECT_URI;
    if(!appId||!appSecret||!redirectUri) throw new Error('Missing META_APP_ID, META_APP_SECRET or META_REDIRECT_URI');
    const tokenUrl=new URL(`https://graph.facebook.com/${gv()}/oauth/access_token`);
    for(const [k,v] of Object.entries({client_id:appId,client_secret:appSecret,redirect_uri:redirectUri,code})) tokenUrl.searchParams.set(k,v);
    const tr=await fetch(tokenUrl), td=await tr.json();
    if(!tr.ok||td.error||!td.access_token) throw new Error(td?.error?.message||'Could not exchange Meta authorization code');
    const pages=await graph('me/accounts',{access_token:td.access_token,fields:'id,name,access_token,tasks'});
    const uid=s.uid;
    await db.collection('meta_connections').doc(uid).set({uid,connected:true,connectedAt:FieldValue.serverTimestamp(),pages:(pages.data||[]).map(p=>({id:p.id,name:p.name||'',tasks:p.tasks||[]}))},{merge:true});
    const batch=db.batch();
    for(const p of pages.data||[]) if(p.id&&p.access_token) batch.set(db.collection('meta_pages').doc(String(p.id)),{uid,pageId:String(p.id),pageName:p.name||'',pageAccessToken:p.access_token,updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.delete(stateRef); await batch.commit();
    const appUrl=process.env.APP_URL||'https://rymanager.netlify.app';
    return Response.redirect(`${appUrl}/?meta=connected&pages=${encodeURIComponent((pages.data||[]).length)}`,302);
  } catch(e){console.error('meta-oauth-callback:',e);return new Response(`Meta connection failed: ${e.message||'unknown error'}`,{status:500});}
}
export const config={path:'/.netlify/functions/meta-oauth-callback'};
