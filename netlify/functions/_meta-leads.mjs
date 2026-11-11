// Shared lead import used by the manual sync and the leadgen webhook, so both
// paths apply the same filter, mapping and deduplication.
import { db, FieldValue } from './_firebase-admin.mjs';
import { graph, describeGraphError } from './_meta-graph.mjs';

export const LEAD_FIELDS = 'id,created_time,field_data,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform';
const clean = value => typeof value === 'string' ? value.trim() : '';
export const lower = value => clean(value).toLocaleLowerCase();
// "Numero di telefono" / "numero_di_telefono" / "Téléphone" → "numero_di_telefono" / "telephone"
const normKey = value => clean(value).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
function fieldMap(fields = []) { const result = {}; for (const field of fields) { const key = normKey(field.name); if (key) result[key] = clean((field.values || []).join(', ')); } return result; }

// Maps Meta instant-form answers to prospect contact fields. Handles standard
// keys (full_name, phone_number, email), split first/last name and custom
// Italian questions such as "Nome e cognome" or "Numero di telefono".
// usedKeys lists the keys consumed as contact data, so the remaining answers
// can be stored as questionnaire responses.
export function extractContact(fieldData = []) {
  const f = fieldMap(fieldData), used = new Set();
  const pick = names => { for (const name of names) if (f[name]) { used.add(name); return f[name]; } return ''; };
  const pickBy = test => { for (const [key, item] of Object.entries(f)) if (item && !used.has(key) && test(key, item)) { used.add(key); return item; } return ''; };
  let name = pick(['full_name', 'name', 'nome_e_cognome', 'nome_cognome', 'nome_completo']);
  if (!name) { const first = pick(['first_name', 'nome']), last = pick(['last_name', 'cognome']); name = [first, last].filter(Boolean).join(' '); }
  if (!name) name = pickBy(key => /(^|_)(name|nome|nominativo)(_|$)/.test(key) && !/(company|azienda|societa|business)/.test(key));
  const email = pick(['email', 'e_mail']) || pickBy(key => /mail/.test(key)) || pickBy((key, item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item));
  const phone = pick(['phone_number', 'phone', 'telefono', 'cellulare', 'mobile', 'numero_di_telefono', 'whatsapp'])
    || pickBy(key => /(phone|telefono|cellulare|mobile|whatsapp)/.test(key))
    || pickBy((key, item) => /^\+?[\d\s().-]{7,}$/.test(item));
  const country = pick(['country', 'paese', 'nazione']);
  const provincia = pick(['province', 'provincia', 'state', 'region', 'regione', 'city', 'citta']);
  return { name, phone, email, country, provincia, fieldKeys: Object.keys(f), usedKeys: used };
}

const prettyKey = key => { const text = key.replace(/_/g, ' ').trim(); return text.charAt(0).toUpperCase() + text.slice(1); };

// Question labels as written in the form ("Quanto saresti dispost@ ad
// investire…"), keyed by the normalized field key. Cached per form.
async function questionLabels(formId, { pageToken, userToken, cache }) {
  if (!formId) return {};
  if (cache?.has(formId)) return cache.get(formId);
  let labels = {};
  for (const [token, tokenKind] of [[pageToken, 'page'], [userToken, 'user']]) {
    if (!token) continue;
    try {
      const form = await graph(String(formId), { token, tokenKind, params: { fields: 'questions{key,label,type,options}' } });
      for (const q of form.questions || []) {
        const key = normKey(q.key);
        if (!key) continue;
        const choices = {};
        for (const option of q.options || []) if (option?.key != null && option.value) choices[String(option.key)] = clean(option.value);
        labels[key] = { label: clean(q.label), choices };
      }
      break;
    } catch (error) {
      console.warn('meta form questions lookup failed', describeGraphError(error));
    }
  }
  cache?.set(formId, labels);
  return labels;
}

// Every non-contact answer, in form order, as [{key, question, answer}].
export async function questionnaireAnswers(lead, contact, options = {}) {
  const rest = [];
  for (const field of lead.field_data || []) {
    const key = normKey(field.name);
    if (!key || contact.usedKeys.has(key)) continue;
    const raw = (field.values || []).map(clean).filter(Boolean);
    if (raw.length) rest.push({ key, raw });
  }
  if (!rest.length) return [];
  const labels = await questionLabels(lead.form_id, options);
  // Multiple-choice answers arrive as option keys ("100_-_300€"); show the
  // option text from the form, or at least turn underscores into spaces.
  const readable = (key, raw) => labels[key]?.choices?.[raw] || (/\s/.test(raw) ? raw : raw.replace(/_/g, ' '));
  return rest.map(({ key, raw }) => ({ key, question: labels[key]?.label || prettyKey(key), answer: raw.map(item => readable(key, item)).join(', ') }));
}

const platformLabel = value => ({ ig: 'Instagram', fb: 'Facebook', msg: 'Messenger', wa: 'WhatsApp', an: 'Audience Network' })[lower(value)] || clean(value);

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
// the same owner is completed in place: only empty fields are filled (name
// only while it is still the "Meta Lead <id>" placeholder); stage, checkboxes
// and owner are never touched.
// options: { pageToken, userToken, formCache } to read the form question labels.
export async function saveLead(lead, page, target, options = {}) {
  const leadId = String(lead.id || '');
  if (!leadId) return 'ignored';
  const leadRef = db.collection('meta_leads').doc(leadId);
  const existing = await leadRef.get();
  const contact = extractContact(lead.field_data || []);
  if (existing.exists) {
    const { prospectId, uid } = existing.data() || {};
    if (!prospectId || uid !== page.uid || !(lead.field_data || []).length) return 'duplicate';
    const prospectRef = db.collection('prospects').doc(prospectId);
    const snap = await prospectRef.get();
    const current = snap.exists ? snap.data() : null;
    if (!current || current.uid !== page.uid) return 'duplicate';
    const patch = {};
    if (PLACEHOLDER.test(current.name || '') && (contact.name || contact.email || contact.phone)) patch.name = contact.name || contact.email || contact.phone;
    for (const key of ['phone', 'email', 'country', 'provincia']) if (!current[key] && contact[key]) patch[key] = contact[key];
    if (!(Array.isArray(current.metaAnswers) && current.metaAnswers.length)) {
      const answers = await questionnaireAnswers(lead, contact, { pageToken: options.pageToken, userToken: options.userToken, cache: options.formCache });
      if (answers.length) patch.metaAnswers = answers;
    }
    if (!current.metaPlatform && lead.platform) patch.metaPlatform = platformLabel(lead.platform);
    if (!current.metaCreatedTime && lead.created_time) patch.metaCreatedTime = lead.created_time;
    if (!current.formId && lead.form_id) patch.formId = lead.form_id;
    if (!Object.keys(patch).length) return 'duplicate';
    await prospectRef.update(patch);
    return 'repaired';
  }
  if (!matchesTarget(lead, target)) return 'filtered';
  const metaAnswers = await questionnaireAnswers(lead, contact, { pageToken: options.pageToken, userToken: options.userToken, cache: options.formCache });
  const prospect = {
    name: contact.name || contact.email || contact.phone || `Meta Lead ${leadId}`,
    channel: 'Facebook Ads', source: 'Meta Lead Ads', sourceDetail: 'leadgen',
    phone: contact.phone, email: contact.email, country: contact.country, provincia: contact.provincia, uid: page.uid,
    presentation: false, followUps: [false, false, false, false], payment: false, iscritto: false, contattato: false,
    metaLeadId: leadId, metaPageId: String(page.pageId), metaPageName: page.pageName || '',
    campaignId: lead.campaign_id || '', campaignName: lead.campaign_name || '', adSetId: lead.adset_id || '',
    adSetName: lead.adset_name || '', adId: lead.ad_id || '', adName: lead.ad_name || '', formId: lead.form_id || '',
    metaCreatedTime: lead.created_time || '', metaPlatform: platformLabel(lead.platform), metaAnswers,
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
