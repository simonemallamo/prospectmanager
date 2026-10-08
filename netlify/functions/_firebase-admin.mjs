import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_B64;
  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON_B64');
  return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
}
if (!getApps().length) initializeApp({ credential: cert(getServiceAccount()) });
export const adminAuth = getAuth();
export const db = getFirestore();
export { FieldValue };
export async function verifyBearer(request) {
  const h = request.headers.get('authorization') || '';
  if (!h.startsWith('Bearer ')) throw new Error('Missing Bearer token');
  return adminAuth.verifyIdToken(h.slice(7));
}
export function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8'}});
}
