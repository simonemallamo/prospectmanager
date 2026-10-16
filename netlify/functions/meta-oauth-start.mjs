import crypto from 'node:crypto';
import { db, verifyBearer, json } from './_firebase-admin.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://simonemallamo.github.io',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin'
};
function corsJson(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{...corsHeaders, 'Content-Type':'application/json; charset=utf-8'}});
}
export default async function handler(request) {
  // Safari sends a CORS preflight before the authenticated cross-origin POST.
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:corsHeaders});
  if (request.method !== 'POST') return corsJson({error:'Method not allowed'},405);
  try {
    const { uid } = await verifyBearer(request);
    const appId = process.env.META_APP_ID;
    const configId = process.env.META_BUSINESS_LOGIN_CONFIG_ID;
    const redirectUri = process.env.META_REDIRECT_URI;
    if (!appId || !configId || !redirectUri) return corsJson({error:'Missing Meta configuration'},500);
    const state = crypto.randomBytes(32).toString('hex');
    await db.collection('meta_oauth_states').doc(state).set({uid, createdAt:new Date(), expiresAt:new Date(Date.now()+10*60*1000)});
    const params = new URLSearchParams({client_id:appId, redirect_uri:redirectUri, state, config_id:configId, response_type:'code'});
    const authUrl = `https://www.facebook.com/dialog/oauth?${params}`;
    return corsJson({authUrl});
  } catch(e) {
    console.error('meta-oauth-start:', e);
    const message = e?.message || 'OAuth start failed';
    const status = message === 'Missing Bearer token' ? 401 : 401;
    return corsJson({error:message}, status);
  }
}
export const config={path:'/.netlify/functions/meta-oauth-start'};
