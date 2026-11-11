import crypto from 'node:crypto';
import { db, json, adminAuth, getMetaIntegrationConfig, getConfiguredMetaIntegrationConfigs } from './_firebase-admin.mjs';
import { graph, describeGraphError } from './_meta-graph.mjs';
import { LEAD_FIELDS, lower, saveLead, withAdNames, ensureFieldData } from './_meta-leads.mjs';
function validSignature(raw, signature, secret){
  if(!secret||!signature?.startsWith('sha256='))return false;
  const actual=Buffer.from(signature.slice(7),'hex');
  const expected=crypto.createHmac('sha256',secret).update(raw,'utf8').digest();
  return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
async function processLead(leadId,pageId,signedOwnerEmail){
  const ps=await db.collection('meta_pages').doc(String(pageId)).get(); if(!ps.exists)return{ignored:true,reason:'page_not_connected'};
  const page=ps.data(); if(!page.uid||!page.pageAccessToken)return{ignored:true,reason:'invalid_page_mapping'};
  const pageOwnerEmail=String(page.ownerEmail||page.appOwnerEmail||'').trim().toLowerCase()||(await adminAuth.getUser(page.uid)).email?.toLowerCase();
  if(!pageOwnerEmail||pageOwnerEmail!==signedOwnerEmail)return{ignored:true,reason:'app_page_owner_mismatch'};
  if((await db.collection('meta_leads').doc(String(leadId)).get()).exists)return{duplicate:true};
  // Single lead lookup: Page token (leads_retrieval + pages_manage_ads).
  let lead;
  try{lead=await graph(String(leadId),{token:page.pageAccessToken,tokenKind:'page',params:{fields:LEAD_FIELDS}});}
  catch(error){
    if(!page.userAccessToken)throw error;
    console.warn('meta-webhook page token rejected for lead, retrying with user token',describeGraphError(error));
    lead=await graph(String(leadId),{token:page.userAccessToken,tokenKind:'user',params:{fields:LEAD_FIELDS}});
  }
  const ownerConfig=getMetaIntegrationConfig(pageOwnerEmail),target=lower(ownerConfig?.campaignName);
  // The configured label may be the campaign, ad set or ad name. Simone's
  // value is the ad "UGC simone" inside campaign "UGC Ads"; names missing from
  // the Page-token response are resolved from the ad with the user token.
  const {lead:full,fieldSource}=await ensureFieldData(lead,{pageToken:page.pageAccessToken,userToken:page.userAccessToken||''});
  if(fieldSource==='none')console.warn('meta-webhook lead without field_data',{pageId:String(pageId)});
  const enriched=await withAdNames(full,{userToken:page.userAccessToken||''});
  const result=await saveLead({...enriched,id:lead.id||String(leadId)},{...page,pageId:String(pageId)},target);
  if(result==='imported')return{created:true,uid:page.uid};
  if(result==='duplicate'||result==='repaired')return{duplicate:true};
  return{ignored:true,reason:result==='filtered'?'campaign_or_ad_not_allowed':'ignored'};
}
export default async function handler(request){
  if(request.method==='GET'){
    const u=new URL(request.url),mode=u.searchParams.get('hub.mode'),token=u.searchParams.get('hub.verify_token'),challenge=u.searchParams.get('hub.challenge');
    if(mode==='subscribe'&&token&&process.env.META_WEBHOOK_VERIFY_TOKEN&&token===process.env.META_WEBHOOK_VERIFY_TOKEN&&challenge)return new Response(challenge,{status:200,headers:{'content-type':'text/plain'}});
    return new Response('Forbidden',{status:403});
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const raw=await request.text();
    const signature=request.headers.get('x-hub-signature-256');
    const signedOwner=getConfiguredMetaIntegrationConfigs().find(config=>validSignature(raw,signature,config.appSecret));
    if(!signedOwner){console.warn('meta-webhook rejected: invalid signature',{hasSignature:Boolean(signature)});return json({error:'Invalid signature'},401);}
    const body=JSON.parse(raw); if(body.object!=='page')return json({received:true,ignored:true}); const results=[];
    for(const entry of body.entry||[])for(const change of entry.changes||[])if(change.field==='leadgen'){const leadId=change.value?.leadgen_id;if(!leadId||!entry.id)continue;try{results.push({pageId:entry.id,leadId,...await processLead(leadId,entry.id,signedOwner.email)});}catch(e){console.warn('meta-webhook lead processing failed',{integration:signedOwner.key,pageId:String(entry.id),...describeGraphError(e)});results.push({error:true});}}
    const outcome={integration:signedOwner.key,events:results.length,imported:0,duplicates:0,ignored:{},errors:0};
    for(const result of results){
      if(result.created)outcome.imported++;
      else if(result.duplicate)outcome.duplicates++;
      else if(result.ignored)outcome.ignored[result.reason||'unspecified']=(outcome.ignored[result.reason||'unspecified']||0)+1;
      else if(result.error)outcome.errors++;
    }
    console.info('meta-webhook outcome',outcome);
    // Let Meta retry failed lead retrievals or Firestore writes. Returning 200
    // here used to acknowledge transient failures and silently lose the lead.
    if(outcome.errors)return json({received:false,retry:true},503);
    return json({received:true,imported:outcome.imported,duplicates:outcome.duplicates,ignored:outcome.ignored});
  }catch(e){console.warn('meta-webhook request processing failed',describeGraphError(e));return json({received:false,retry:true},503);}
}
export const config={path:'/.netlify/functions/meta-webhook'};
