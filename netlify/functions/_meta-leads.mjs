// Shared lead import used by the manual sync and the leadgen webhook, so both
// paths apply the same filter, mapping and deduplication.
import { db, FieldValue } from './_firebase-admin.mjs';
import { graph, describeGraphError } from './_meta-graph.mjs';

export const LEAD_FIELDS = 'id,created_time,field_data,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id';
const clean = value => typeof value === 'string' ? value.trim() : '';
export const lower = value => clean(value).toLocaleLowerCase();
function fieldMap(fields = []) { const result = {}; for (const field of fields) { const key = lower(field.name); if (key) result[key] = clean(field.values?.[0] ?? ''); } return result; }
function pick(fields, names) { for (const name of names) if (fields[name]) return fields[name]; return ''; }

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

// Returns 'imported' | 'duplicate' | 'filtered' | 'ignored'.
// The meta_leads/{leadId} document is created atomically together with the
// prospect: if the lead already exists (sync and webhook racing, or a repeat
// webhook delivery) the whole batch fails and nothing is written, so a lead is
// never duplicated nor reassigned to another member.
export async function saveLead(lead, page, target) {
  const leadId = String(lead.id || '');
  if (!leadId) return 'ignored';
  const leadRef = db.collection('meta_leads').doc(leadId);
  if ((await leadRef.get()).exists) return 'duplicate';
  if (!matchesTarget(lead, target)) return 'filtered';
  const fields = fieldMap(lead.field_data || []);
  const prospect = {
    name: pick(fields, ['full_name', 'name', 'nome', 'nome completo']) || pick(fields, ['email']) || pick(fields, ['phone_number', 'phone', 'telefono', 'cellulare']) || `Meta Lead ${leadId}`,
    channel: 'Facebook Ads', source: 'Meta Lead Ads', sourceDetail: 'leadgen',
    phone: pick(fields, ['phone_number', 'phone', 'telefono', 'cellulare', 'mobile']),
    email: pick(fields, ['email', 'e-mail']), country: pick(fields, ['country', 'paese']),
    provincia: pick(fields, ['province', 'provincia', 'state', 'region']), uid: page.uid,
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
