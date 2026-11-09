import { db, verifyBearer, isMetaIntegrationOwner } from './_firebase-admin.mjs';

const allowedOrigins = new Set(['https://simonemallamo.github.io', 'https://pm.retiredyoung.it']);
const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin'
});
function json(data, status=200, origin='') {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' } });
}
export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, origin);
  try {
    const identity = await verifyBearer(request);
    if (!isMetaIntegrationOwner(identity)) return json({ error: 'Meta Ads è disponibile solo per l’account proprietario autorizzato.' }, 403, origin);
    const { uid } = identity;
    const snap = await db.collection('meta_connections').doc(uid).get();
    if (!snap.exists || snap.data()?.connected !== true) return json({ connected: false, pageCount: 0 },200,origin);
    const data = snap.data();
    return json({ connected: true, pageCount: Array.isArray(data.pages) ? data.pages.length : 0, connectedAt: data.connectedAt?.toDate?.()?.toISOString?.() || null },200,origin);
  } catch (e) {
    const message = e?.message || 'Unable to check Meta connection';
    return json({ error: message }, message === 'Missing Bearer token' ? 401 : 401, origin);
  }
}
export const config = { path: '/.netlify/functions/meta-connection-status' };
