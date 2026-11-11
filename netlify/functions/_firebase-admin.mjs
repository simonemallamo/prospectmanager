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
const META_OWNERS = Object.freeze({
  'mallamo.simone@gmail.com': 'SIMONE',
  'veglia.alessia@gmail.com': 'ALESSIA'
});
const emailOf = value => String(typeof value === 'string' ? value : value?.email || '').trim().toLowerCase();
export function isMetaIntegrationEmail(decodedToken) {
  return Boolean(META_OWNERS[emailOf(decodedToken)]);
}
export function isMetaIntegrationOwner(decodedToken) {
  return decodedToken?.email_verified === true && isMetaIntegrationEmail(decodedToken);
}
export function getMetaIntegrationConfig(emailOrToken) {
  const email=emailOf(emailOrToken), key=META_OWNERS[email];
  if(!key)return null;
  const suffix=key;
  const legacy=key==='ALESSIA';
  return {
    key, email,
    appId: process.env[`META_APP_ID_${suffix}`] || (legacy ? process.env.META_APP_ID : ''),
    appSecret: process.env[`META_APP_SECRET_${suffix}`] || (legacy ? process.env.META_APP_SECRET : ''),
    configId: process.env[`META_BUSINESS_LOGIN_CONFIG_ID_${suffix}`] || (legacy ? process.env.META_BUSINESS_LOGIN_CONFIG_ID : ''),
    pageId: process.env[`META_PAGE_ID_${suffix}`] || (legacy ? process.env.META_PAGE_ID : ''),
    adAccountId: process.env[`META_AD_ACCOUNT_ID_${suffix}`] || '',
    campaignName: process.env[`META_CAMPAIGN_NAME_${suffix}`] || (legacy ? (process.env.META_CAMPAIGN_NAME || 'ugc moduli') : '')
  };
}
export function getConfiguredMetaIntegrationConfigs() {
  return Object.keys(META_OWNERS).map(email=>getMetaIntegrationConfig(email)).filter(config=>config?.appId&&config?.appSecret);
}
export function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8'}});
}
