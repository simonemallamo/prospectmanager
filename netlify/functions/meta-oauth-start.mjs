import crypto from 'node:crypto';
import { db, verifyBearer, json, getMetaIntegrationConfig, isMetaIntegrationEmail, isMetaIntegrationOwner } from './_firebase-admin.mjs';

const allowedOrigins = new Set(['https://simonemallamo.github.io', 'https://pm.retiredyoung.it']);
const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin'
});
function corsJson(data, status=200, origin='') {
  return new Response(JSON.stringify(data), {status, headers:{...corsHeaders(origin), 'Content-Type':'application/json; charset=utf-8'}});
}
export default async function handler(request) {
  // Safari sends a CORS preflight before the authenticated cross-origin POST.
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:corsHeaders(origin)});
  if (request.method !== 'POST') return corsJson({error:'Method not allowed'},405,origin);
  try {
    const identity = await verifyBearer(request);
    if(!isMetaIntegrationEmail(identity))return corsJson({error:'Meta Ads non è abilitato per questo account.'},403,origin);
    if(!isMetaIntegrationOwner(identity))return corsJson({error:'Verifica prima l’indirizzo email del tuo account Prospect Manager.',code:'EMAIL_NOT_VERIFIED'},403,origin);
    const { uid } = identity;
    const metaConfig=getMetaIntegrationConfig(identity);
    const appId = metaConfig?.appId;
    const configId = metaConfig?.configId;
    const redirectUri = process.env.META_REDIRECT_URI;
    if (!appId || !configId || !redirectUri) return corsJson({error:'La configurazione Meta per questo account non è ancora completa.'},500,origin);
    const state = crypto.randomBytes(32).toString('hex');
    await db.collection('meta_oauth_states').doc(state).set({uid,ownerEmail:metaConfig.email,createdAt:new Date(),expiresAt:new Date(Date.now()+10*60*1000)});
    const params = new URLSearchParams({client_id:appId, redirect_uri:redirectUri, state, response_type:'code'});
    if(metaConfig.key==='SIMONE'){
      // Simone's ad account is a personal account, not a Business Portfolio
      // asset. Use standard Facebook Login so /me/adaccounts can return it.
      // Request only read access to ads/leads and the Page permissions required
      // to enumerate the configured Page and subscribe its leadgen webhook.
      // Do not request portfolio-wide management or Page ad-management access.
      params.set('scope','ads_read,leads_retrieval,pages_manage_metadata,pages_read_engagement,pages_show_list');
      params.set('auth_type','rerequest');
    }else{
      params.set('config_id',configId);
    }
    const authUrl = `https://www.facebook.com/dialog/oauth?${params}`;
    return corsJson({authUrl},200,origin);
  } catch(e) {
    console.error('meta-oauth-start:', e);
    const message = e?.message || 'OAuth start failed';
    const status = message === 'Missing Bearer token' ? 401 : 401;
    return corsJson({error:message}, status, origin);
  }
}
export const config={path:'/.netlify/functions/meta-oauth-start'};
