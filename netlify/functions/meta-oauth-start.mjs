import crypto from 'node:crypto';
import { db, verifyBearer, json } from './_firebase-admin.mjs';

export default async function handler(request) {
  if (!['GET','POST'].includes(request.method)) return json({error:'Method not allowed'},405);
  try {
    const { uid } = await verifyBearer(request);
    const appId = process.env.META_APP_ID;
    const configId = process.env.META_BUSINESS_LOGIN_CONFIG_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    if (!appId || !configId || !redirectUri) return json({error:'Missing Meta configuration'},500);
    const state = crypto.randomBytes(32).toString('hex');
    await db.collection('meta_oauth_states').doc(state).set({uid, createdAt:new Date(), expiresAt:new Date(Date.now()+10*60*1000)});
    const params = new URLSearchParams({client_id:appId, redirect_uri:redirectUri, state, config_id:configId, response_type:'code'});
    return Response.redirect(`https://www.facebook.com/dialog/oauth?${params}`,302);
  } catch(e) { console.error(e); return json({error:e.message||'OAuth start failed'},401); }
}
export const config={path:'/.netlify/functions/meta-oauth-start'};
