// Shared lead import used by the manual sync and the leadgen webhook, so both
// paths apply the same filter, mapping and deduplication.
import { db, FieldValue } from './_firebase-admin.mjs';
import { graph, describeGraphError } from './_meta-graph.mjs';

export const LEAD_FIELDS = 'id,created_time,field_data,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id';
const clean = value => typeof value === 'string' ? value.trim() : '';
export const lower = value => clean(value).toLocaleLowerCase();
// "Numero di telefono" / "numero_di_telefono" / "Téléphone" → "numero_di_telefono" / "telephone"
const normKey = value => clean(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
function fieldMap(fields = []) { const result = {}; for (const field of fields) { const key = normKey(field.name); if (key) result[key] = clean(field.values?.[0] ?? ''); } return result; }
const pick = (fields, names) => { for (const name of names) if (fields[name]) return fields[name]; return ''; };
const pickBy = (fields, test) => { for (const [key, item] of Object.entries(fields)) if (item && test(key, item)) return item; return ''; };

// Maps Meta instant-form answers to prospect contact fields. Handles standard
// keys (full_name, phone_number, email), split first/last name and custom
// Italian questions such as "Nome e cognome" or "Numero di telefono".
export function extractContact(fieldData = []) {
  const f = fieldMap(fieldData);
  const first = pick(f, ['first_name', 'nome']), last = pick(f, ['last_name', 'cognome']);
  const name = pick(f, ['full_name', 'name', 'nome_e_cognome', 'nome_cognome', 'nome_completo'])
    || [first, last].filter(Boolean).join(' ')
    || pickBy(f, key => /(^|_)(name|nome|nominativo)(_|$)/.test(key) && !/(company|azienda|societa|business)/.test(key));
  const phone = pick(f, ['phone_number', 'phone', 'telefono', 'cellulare', 'mobile', 'numero_di_telefono', 'whatsapp'])
    || pickBy(f, key => /(phone|telefono|cellulare|mobile|whatsapp|numero)/.test(key))
    || pickBy(f, (key, item) => /^\+?[\d\s().-]{7,}$/.test(item));
  const email = pick(f, ['email', 'e_mail']) || pickBy(f, key => /mail/.test(key)) || pickBy(f, (key, item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  return {
    name, phone, email,
    country: pick(f, ['country', 'paese', 'nazione']),
    provincia: pick(f, ['province', 'provincia', 'state', 'region', 'regione', 'city', 'citta']),
    fieldKeys: Object.keys(f)
  };
}

// The leads edge sometimes returns leads without field_data. Re-read the
// single lead: Page token first, then the user token. Returns the token kind
// that produced answers so logs show which one Meta honours.
export async function ensureFieldData(lead, { pageToken, userToken }) {
  if (Array.isArray(lead.field_data) && lead.field_data.length) return { lead, fieldSource: 'edge' };
  for (const [token, tokenKind] of [[pageToken, 'page'], [userToken, 'user']]) {
    if (!token || !lead.id) continue;
    try {
      const full = await graph(String(lead.id), { token, tokenKind, params: { fields: LEAD_FIELDS } });
      if (Array.isArray(full.field_data) && full.field_data.length) return { lead: { ...full, ...Object.fromEntries(Object.entries(lead).filter(([k, v]) => k !== 'field_data' && v)) , field_data: full.field_data }, fieldSource: tokenKind };
    } catch (error) {
      console.warn('meta single lead lookup failed', describeGraphError(error));
    }
  }
  return { lead, fieldSource: 'none' };
}

// Lead objects read with a Page token often omit ad/campaign names. Resolve
// them from the ad with the user token (ads_read) so the name filter works.
export async function withAdNames(lead, { userToken, cache = new Map() }) {
  if (!lead.ad_id || (lead.ad_name && lead.campaign_name) || !userToken) return lead;
  let names = cache.get(lead.ad_id);
  if (!names) {
    try {
      const ad = await graph(String(lead.ad_id), { token: userToken, tokenKind: 'user', params: { fields: 'name,adset{id,name},campaign{id,name}' } });
      names = { ad_name: ad.name || '', adset_id: ad.adset?.id || '', adset_name: ad.adset?.name || '', campaign_id: ad.campaign?.id || '', campaign_name: ad.campaign?.name || '' };
    } catch (error) {
      console.warn('meta ad name lookup failed', describeGraphError(error));
      names = {};
    }
    cache.set(lead.ad_id, names);
  }
  const merged = { ...lead };
  for (const [key, item] of Object.entries(names)) if (!merged[key] && item) merged[key] = item;
  return merged;
}

export function matchesTarget(lead, target) {
  if (!target) return true;
  return [lead.campaign_name, lead.adset_name, lead.ad_name].some(name => lower(name) === target);
}

const PLACEHOLDER = /^Meta Lead \d+$/;

// Returns 'imported' | 'repaired' | 'duplicate' | 'filtered' | 'ignored'.
// The meta_leads/{leadId} document is created atomically together with the
// prospect: if the lead already exists (sync and webhook racing, or a repeat
// webhook delivery) the whole batch fails and nothing is written, so a lead is
// never duplicated nor reassigned to another member. An existing prospect of
// the same owner that still has the placeholder name is completed in place
// (only empty contact fields are filled).
export async function saveLead(lead, page, target) {
  const leadId = String(lead.id || '');
  if (!leadId) return 'ignored';
  const leadRef = db.collection('meta_leads').doc(leadId);
  const existing = await leadRef.get();
  const contact = extractContact(lead.field_data || []);
  if (existing.exists) {
    const { prospectId, uid } = existing.data() || {};
    if (!prospectId || uid !== page.uid || !(contact.name || contact.phone || contact.email)) return 'duplicate';
    const prospectRef = db.collection('prospects').doc(prospectId);
    const snap = await prospectRef.get();
    const current = snap.exists ? snap.data() : null;
    if (!current || current.uid !== page.uid || !PLACEHOLDER.test(current.name || '')) return 'duplicate';
    const patch = { name: contact.name || contact.email || contact.phone || current.name };
    for (const key of ['phone', 'email', 'country', 'provincia']) if (!current[key] && contact[key]) patch[key] = contact[key];
    await prospectRef.update(patch);
    return 'repaired';
  }
  if (!matchesTarget(lead, target)) return 'filtered';
  const prospect = {
    name: contact.name || contact.email || contact.phone || `Meta Lead ${leadId}`,
    channel: 'Facebook Ads', source: 'Meta Lead Ads', sourceDetail: 'leadgen',
    phone: contact.phone, email: contact.email, country: contact.country, provincia: contact.provincia, uid: page.uid,
    presentation: false, followUps: [false, false, false, false], payment: false, iscritto: false, contattato: false,
    metaLeadId: leadId, metaPageId: String(page.pageId), metaPageName: page.pageName || '',
    campaignId: lead.campaign_id || '', campaignName: lead.campaign_name || '', adSetId: lead.adset_id || '',
    adSetName: lead.adset_name || '', adId: lead.ad_id || '', adName: lead.ad_name || '', formId: lead.form_id || '',
    metaCreatedTime: lead.created_time || '',
    createdAt: FieldValue.serverTimestamp(), lastCheckAt: null, _insertedAt: Date.now()
  };
  const prospectRef = db.collection('prospects').doc(), batch = db.batch();
  batch.create(leadRef, { leadId, prospectId: prospectRef.id, uid: page.uid, pageId: String(page.pageId), receivedAt: FieldValue.serverTimestamp() });
  batch.set(prospectRef, prospect);
  try {
    await batch.commit();
  } catch (error) {
    if (error?.code === 6 || /already exists/i.test(error?.message || '')) return 'duplicate';
    throw error;
  }
  return 'imported';
}
