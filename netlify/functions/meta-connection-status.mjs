import { db, verifyBearer } from './_firebase-admin.mjs';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://simonemallamo.github.io',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin'
};
function json(data, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' } });
}
export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  try {
    const { uid } = await verifyBearer(request);
    const snap = await db.collection('meta_connections').doc(uid).get();
    if (!snap.exists || snap.data()?.connected !== true) return json({ connected: false, pageCount: 0 });
    const data = snap.data();
    return json({ connected: true, pageCount: Array.isArray(data.pages) ? data.pages.length : 0, connectedAt: data.connectedAt?.toDate?.()?.toISOString?.() || null });
  } catch (e) {
    const message = e?.message || 'Unable to check Meta connection';
    return json({ error: message }, message === 'Missing Bearer token' ? 401 : 401);
  }
}
export const config = { path: '/.netlify/functions/meta-connection-status' };
