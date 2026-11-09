import { db, verifyBearer } from './_firebase-admin.mjs';

const allowedOrigins = new Set(['https://simonemallamo.github.io', 'https://pm.retiredyoung.it']);
const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin',
  'Cache-Control': 'no-store'
});
const json = (data, status=200, origin='') => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' }
});
const chunk = (items, size) => Array.from({length: Math.ceil(items.length / size)}, (_, i) => items.slice(i * size, (i + 1) * size));

function metrics() {
  const stages = { new: 0, active: 0, done: 0, payment: 0 };
  return { total: 0, new7: 0, presentations: 0, presentations7: 0, payment: 0, payment7: 0, fu4: 0,
    stages, stageMetrics: Object.fromEntries(Object.keys(stages).map(key=>[key,{presentations:0,fu4:0}])) };
}
function createdMillis(p) {
  return p.createdAt?.toMillis?.() || (Number(p._insertedAt) || 0);
}
function addProspect(m, p, weekStart) {
  const created = createdMillis(p), followUps = Array.isArray(p.followUps) ? p.followUps : [];
  const done = followUps.filter(Boolean).length === 4;
  m.total++;
  if (created >= weekStart) m.new7++;
  if (p.presentation) { m.presentations++; if (created >= weekStart) m.presentations7++; }
  if (p.payment) { m.payment++; if (created >= weekStart) m.payment7++; }
  if (done) m.fu4++;
  const stage = p.payment ? 'payment' : done ? 'done' : (p.presentation || followUps.some(Boolean)) ? 'active' : 'new';
  m.stages[stage]++;
  if (p.presentation) m.stageMetrics[stage].presentations++;
  if (done) m.stageMetrics[stage].fu4++;
}

export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, {status:204, headers:corsHeaders(origin)});
  if (request.method !== 'GET') return json({error:'Method not allowed'},405,origin);
  try {
    const {uid} = await verifyBearer(request);
    const requester = await db.collection('users').doc(uid).get();
    if (!requester.exists || requester.data()?.role !== 'leader') return json({error:'Leader access required'},403,origin);

    // Only IDs are used to aggregate. Prospect documents and contact fields never leave this function.
    const descendants = await db.collection('users').where('uplinePath','array-contains',uid).get();
    const candidates = descendants.docs.map(d => ({id:d.id, data:d.data()}));
    const ids = [], visited = new Set([uid]), queue = [uid];
    while (queue.length && visited.size < 10001) {
      const parent = queue.shift();
      for (const child of candidates) {
        if (child.data.uplineUid === parent && !visited.has(child.id)) {
          visited.add(child.id); ids.push(child.id); queue.push(child.id);
        }
      }
    }
    const byUid = Object.fromEntries(ids.map(id => [id, metrics()]));
    const weekStart = Date.now() - 7 * 86400000;
    for (const group of chunk(ids, 30)) {
      const prospects = await db.collection('prospects').where('uid','in',group).get();
      for (const doc of prospects.docs) {
        const p = doc.data(), target = byUid[p.uid];
        if (target) addProspect(target, p, weekStart);
      }
    }
    const totals = metrics();
    for (const value of Object.values(byUid)) {
      totals.total += value.total; totals.new7 += value.new7;
      totals.presentations += value.presentations; totals.presentations7 += value.presentations7;
      totals.payment += value.payment; totals.payment7 += value.payment7; totals.fu4 += value.fu4;
      for (const key of Object.keys(totals.stages)) {
        totals.stages[key] += value.stages[key];
        totals.stageMetrics[key].presentations += value.stageMetrics[key].presentations;
        totals.stageMetrics[key].fu4 += value.stageMetrics[key].fu4;
      }
    }
    return json({byUid, totals},200,origin);
  } catch (error) {
    console.error('team-dashboard-stats:', error?.message || 'request failed');
    return json({error:'Unable to load team statistics'},401,origin);
  }
}
export const config = { path: '/.netlify/functions/team-dashboard-stats' };
