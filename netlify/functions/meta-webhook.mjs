import { db, FieldValue, json } from './_firebase-admin.mjs';
const gv=()=>process.env.META_GRAPH_VERSION||'v24.0';
async function graph(path, params={}) { const u=new URL(`https://graph.facebook.com/${gv()}/${path}`); for(const[k,v]of Object.entries(params))if(v!=null)u.searchParams.set(k,String(v)); const r=await fetch(u);const d=await r.json();if(!r.ok||d.error)throw new Error(d?.error?.message||`Graph API error (${r.status})`);return d; }
const clean=v=>typeof v==='string'?v.trim():'';
function fieldMap(fd=[]){const o={};for(const x of fd){const k=clean(x.name).toLowerCase();if(k)o[k]=clean(x.values?.[0]??'');}return o;}
function val(f,names){for(const n of names){if(f[n.toLowerCase()])return f[n.toLowerCase()];}return '';}
async function saveLead(leadId,pageId){
  const ps=await db.collection('meta_pages').doc(String(pageId)).get(); if(!ps.exists)return{ignored:true,reason:'page_not_connected'};
  const page=ps.data(); if(!page.uid||!page.pageAccessToken)return{ignored:true,reason:'invalid_page_mapping'};
  const lr=db.collection('meta_leads').doc(String(leadId)); if((await lr.get()).exists)return{duplicate:true};
  const lead=await graph(String(leadId),{access_token:page.pageAccessToken,fields:'id,created_time,field_data,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id'});
  const f=fieldMap(lead.field_data||{});
  const prospect={
    name:val(f,['full_name','name','nome','nome completo'])||val(f,['email'])||val(f,['phone_number','phone','telefono','cellulare'])||`Meta Lead ${leadId}`,
    channel:'Facebook Ads',source:'Meta Lead Ads',sourceDetail:'leadgen',
    phone:val(f,['phone_number','phone','telefono','cellulare','mobile']),
    email:val(f,['email','e-mail']),country:val(f,['country','paese']),provincia:val(f,['province','provincia','state','region']),
    uid:page.uid,presentation:false,followUps:[false,false,false,false],payment:false,iscritto:false,contattato:false,
    metaLeadId:String(leadId),metaPageId:String(pageId),metaPageName:page.pageName||'',campaignId:lead.campaign_id||'',campaignName:lead.campaign_name||'',adSetId:lead.adset_id||'',adSetName:lead.adset_name||'',adId:lead.ad_id||'',adName:lead.ad_name||'',formId:lead.form_id||'',
    createdAt:FieldValue.serverTimestamp(),lastCheckAt:null,_insertedAt:Date.now()
  };
  const pr=db.collection('prospects').doc(); const b=db.batch(); b.set(pr,prospect); b.set(lr,{leadId:String(leadId),prospectId:pr.id,uid:page.uid,pageId:String(pageId),receivedAt:FieldValue.serverTimestamp()}); await b.commit(); return{created:true,prospectId:pr.id,uid:page.uid};
}
export default async function handler(request){
  if(request.method==='GET'){
    const u=new URL(request.url),mode=u.searchParams.get('hub.mode'),token=u.searchParams.get('hub.verify_token'),challenge=u.searchParams.get('hub.challenge');
    if(mode==='subscribe'&&token&&process.env.META_WEBHOOK_VERIFY_TOKEN&&token===process.env.META_WEBHOOK_VERIFY_TOKEN&&challenge)return new Response(challenge,{status:200,headers:{'content-type':'text/plain'}});
    return new Response('Forbidden',{status:403});
  }
  if(request.method!=='POST')return json({error:'Method not allowed'},405);
  try{
    const body=await request.json(); if(body.object!=='page')return json({received:true,ignored:true}); const results=[];
    for(const entry of body.entry||[])for(const change of entry.changes||[])if(change.field==='leadgen'){const leadId=change.value?.leadgen_id;if(!leadId||!entry.id)continue;try{results.push({pageId:entry.id,leadId,...await saveLead(leadId,entry.id)});}catch(e){console.error(e);results.push({pageId:entry.id,leadId,error:e.message});}}
    return json({received:true,results});
  }catch(e){console.error('meta-webhook:',e);return json({received:true,error:'processing_error'});}
}
export const config={path:'/.netlify/functions/meta-webhook'};
