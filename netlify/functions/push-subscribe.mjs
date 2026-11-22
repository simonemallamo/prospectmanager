// Registers or removes this device's FCM token for the signed-in user.
import { db, FieldValue, verifyBearer } from './_firebase-admin.mjs';
import { tokenDocId, sendPushToUser } from './_push.mjs';

const allowedOrigins = new Set(['https://simonemallamo.github.io', 'https://pm.retiredyoung.it', 'https://rymanager.netlify.app', 'https://rymanager-staging.netlify.app']);
const corsHeaders = origin => ({
  'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Vary': 'Origin'
});
const json = (data, status, origin) => new Response(JSON.stringify(data), {
  status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
});

export default async function handler(request) {
  const origin = request.headers.get('origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json({ error: 'Metodo non consentito.' }, 405, origin);
  try {
    const identity = await verifyBearer(request);
    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '');
    const token = String(body?.token || '').trim();
    if (!['add', 'remove', 'test'].includes(action)) return json({ error: 'Azione non valida.' }, 400, origin);
    if (action === 'test') {
      const result = await sendPushToUser(identity.uid, { title: 'Notifiche attive ✅', body: 'Riceverai qui gli avvisi del Prospect Manager.', tag: 'test' });
      return json({ ok: true, ...result }, 200, origin);
    }
    if (!token || token.length > 4096) return json({ error: 'Token non valido.' }, 400, origin);
    const ref = db.collection('push_tokens').doc(tokenDocId(token));
    if (action === 'remove') {
      const snap = await ref.get();
      if (snap.exists && snap.data()?.uid === identity.uid) await ref.delete();
      return json({ ok: true }, 200, origin);
    }
    const platform = ['ios', 'android', 'desktop'].includes(body?.platform) ? body.platform : 'other';
    // A device token belongs to whoever is signed in on that device now.
    await ref.set({ uid: identity.uid, token, platform, standalone: body?.standalone === true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return json({ ok: true }, 200, origin);
  } catch (error) {
    const unauth = error?.message === 'Missing Bearer token' || /id token|auth\//i.test(error?.message || '');
    return json({ error: unauth ? 'Accedi di nuovo al Prospect Manager.' : 'Impossibile aggiornare le notifiche.' }, unauth ? 401 : 500, origin);
  }
}

export const config = { path: '/.netlify/functions/push-subscribe' };
