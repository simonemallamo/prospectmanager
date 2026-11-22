// Push notifications through Firebase Cloud Messaging. Device tokens live in
// push_tokens/{sha256(token)} and are written only by push-subscribe.mjs
// (Admin SDK), so no client Firestore rule is needed.
import crypto from 'node:crypto';
import { db } from './_firebase-admin.mjs';
import { getMessaging } from 'firebase-admin/messaging';

export const tokenDocId = token => crypto.createHash('sha256').update(String(token)).digest('hex');

const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument'
]);

// Sends a data-only web push to every device of `uid`. The service worker
// (sw.js) turns { title, body, url, tag } into the visible notification.
// Never throws: a failed notification must not break the calling action.
// Keep personal data of prospects out of title/body (lock-screen visible).
export async function sendPushToUser(uid, { title, body, url = './', tag = '' }) {
  try {
    if (!uid) return { sent: 0 };
    const snap = await db.collection('push_tokens').where('uid', '==', String(uid)).get();
    const docs = snap.docs.filter(doc => doc.data()?.token);
    if (!docs.length) return { sent: 0, devices: 0 };
    const response = await getMessaging().sendEachForMulticast({
      tokens: docs.map(doc => doc.data().token),
      data: { title: String(title || ''), body: String(body || ''), url: String(url || './'), tag: String(tag || '') },
      webpush: { headers: { Urgency: 'high', TTL: '86400' } }
    });
    const stale = [];
    response.responses.forEach((result, index) => {
      if (!result.success && INVALID_TOKEN_CODES.has(result.error?.code)) stale.push(docs[index].ref);
    });
    if (stale.length) { const batch = db.batch(); for (const ref of stale) batch.delete(ref); await batch.commit(); }
    const outcome = { devices: docs.length, sent: response.successCount, failed: response.failureCount, removed: stale.length };
    console.info('push sent', { tag: tag ? String(tag).split('-')[0] : '', ...outcome });
    return outcome;
  } catch (error) {
    console.warn('push send failed', { code: error?.code || '', message: error?.message || 'unknown' });
    return { sent: 0, error: true };
  }
}
