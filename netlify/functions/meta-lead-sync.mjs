import { db, FieldValue, verifyBearer, getMetaIntegrationConfig, isMetaIntegrationOwner } from './_firebase-admin.mjs';

const GRAPH_VERSION=process.env.META_GRAPH_VERSION||'v27.0';
const ALLOWED_ORIGINS=new Set(['https://simonemallamo.github.io','https://pm.retiredyoung.it']);
const cors=origin=>({
  'Access-Control-Allow-Origin':ALLOWED_ORIGINS.has(origin)?origin:'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Vary':'Origin'
});
const clean=value=>typeof value==='string'?value.trim():'';
const lower=value=>clean(value).toLocaleLowerCase();
function fieldMap(fields=[]){const result={};for(const field of fields){const key=lower(field.name);if(key)result[key]=clean(field.values?.[0]??'');}return result;}
function value(fields,names){for(const name of names)if(fields[name])return fields[name];return '';}
async function graph(path,params={}){
  const url=/^https?:\/\//.test(path)?new URL(path):new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${path}`);
  for(const [key,item] of Object.entries(params))if(item!=null)url.searchParams.set(key,String(item));
  const response=await fetch(url),data=await response.json();
  if(!response.ok||data.error)throw new Error(data?.error?.message||`Meta Graph API error (${response.status})`);
  return data;
}
async function saveLead(lead,page,allowedName){
  const leadId=String(lead.id||'');
  if(!leadId)return 'ignored';
  const existing=await db.collection('meta_leads').doc(leadId).get();
  if(existing.exists)return 'duplicate';
  if(allowedName&&![lead.campaign_name,lead.ad_name].some(name=>lower(name)===allowedName))return 'filtered';
  const fields=fieldMap(lead.field_data||{});
  const prospect={
    name:value(fields,['full_name','name','nome','nome completo'])||value(fields,['email'])||value(fields,['phone_number','phone','telefono','cellulare'])||`Meta Lead ${leadId}`,
    channel:'Facebook Ads',source:'Meta Lead Ads',sourceDetail:'leadgen',
    phone:value(fields,['phone_number','phone','telefono','cellulare','mobile']),
    email:value(fields,['email','e-mail']),country:value(fields,['country','paese']),
    provincia:value(fields,['province','provincia','state','region']),uid:page.uid,
    presentation:false,followUps:[false,false,false,false],payment:false,iscritto:false,contattato:false,
    metaLeadId:leadId,metaPageId:String(page.pageId),metaPageName:page.pageName||'',
    campaignId:lead.campaign_id||'',campaignName:lead.campaign_name||'',adSetId:lead.adset_id||'',
    adSetName:lead.adset_name||'',adId:lead.ad_id||'',adName:lead.ad_name||'',formId:lead.form_id||'',
    createdAt:FieldValue.serverTimestamp(),lastCheckAt:null,_insertedAt:Date.now()
  };
  const prospectRef=db.collection('prospects').doc(),batch=db.batch();
  batch.set(prospectRef,prospect);
  batch.set(db.collection('meta_leads').doc(leadId),{leadId,prospectId:prospectRef.id,uid:page.uid,pageId:String(page.pageId),receivedAt:FieldValue.serverTimestamp()});
  await batch.commit();
  return 'imported';
}
export default async function handler(request){
  const origin=request.headers.get('origin')||'';
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors(origin),'Content-Type':'application/json; charset=utf-8'}});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=='POST')return reply({error:'Method not allowed'},405);
  try{
    const identity=await verifyBearer(request);
    if(!isMetaIntegrationOwner(identity))return reply({error:'Accesso non autorizzato. Verifica l’email del tuo account.'},403);
    const config=getMetaIntegrationConfig(identity);
    if(!config?.campaignName)return reply({error:'Campagna o inserzione Meta non configurata.'},409);
    const pageRef=db.collection('meta_pages').doc(String(config.pageId));
    const pageSnap=await pageRef.get();
    if(!pageSnap.exists)return reply({error:'Pagina Meta non collegata.'},409);
    let page=pageSnap.data();
    // The signed-in owner connection is the authoritative mapping. A prior
    // relink can leave meta_pages with a stale UID/email; repair only when this
    // verified account's connection explicitly lists the configured Page.
    const currentConnectionSnap=await db.collection('meta_connections').doc(identity.uid).get();
    const currentConnection=currentConnectionSnap.data();
    const connectionOwnsPage=currentConnection?.connected===true&&Array.isArray(currentConnection.pages)&&currentConnection.pages.some(item=>String(item.id)===String(config.pageId));
    if(!connectionOwnsPage)return reply({error:'Il collegamento Meta del tuo account non include la Pagina configurata. Ricollega il tuo account Meta.'},409);
    if(page.uid&&page.uid!==identity.uid){
      const priorConnectionSnap=await db.collection('meta_connections').doc(page.uid).get();
      const priorConnection=priorConnectionSnap.data();
      const priorStillOwnsPage=priorConnection?.connected===true&&Array.isArray(priorConnection.pages)&&priorConnection.pages.some(item=>String(item.id)===String(config.pageId));
      if(priorStillOwnsPage)return reply({error:'La Pagina risulta ancora collegata a un altro profilo Meta. Ricollega la Pagina dal profilo corretto.'},409);
    }
    if(page.uid!==identity.uid||String(page.ownerEmail||'').trim().toLowerCase()!==String(identity.email||'').trim().toLowerCase()||page.appKey!==config.key){
      await pageRef.set({uid:identity.uid,ownerEmail:String(identity.email||'').trim().toLowerCase(),appKey:config.key,updatedAt:FieldValue.serverTimestamp()},{merge:true});
      page={...page,uid:identity.uid,ownerEmail:String(identity.email||'').trim().toLowerCase(),appKey:config.key};
    }
    if(!page.pageAccessToken)return reply({error:'Il collegamento della Pagina non contiene più un token valido. Ricollega il tuo account Meta.'},409);
    const target=lower(config.campaignName),cutoff=Date.now()-30*24*60*60*1000;
    let imported=0,duplicates=0,filtered=0,scanned=0,formsScanned=0,outsideLookback=0;
    let formsUrl=`${config.pageId}/leadgen_forms`;
    for(let formPage=0;formPage<5&&formsUrl;formPage++){
      const formData=await graph(formsUrl,{access_token:page.pageAccessToken,fields:'id,name',limit:100});
      for(const form of formData.data||[]){
        formsScanned++;
        let leadsUrl=`${form.id}/leads`;
        for(let leadPage=0;leadPage<3&&leadsUrl;leadPage++){
          const leadData=await graph(leadsUrl,{access_token:page.pageAccessToken,fields:'id,created_time,field_data,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id',limit:100});
          for(const lead of leadData.data||[]){
            scanned++;
            if(lead.created_time&&Date.parse(lead.created_time)<cutoff){outsideLookback++;continue;}
            const result=await saveLead({...lead,form_id:lead.form_id||form.id},page,target);
            if(result==='imported')imported++;
            else if(result==='duplicate')duplicates++;
            else filtered++;
          }
          leadsUrl=leadData.paging?.next||'';
        }
      }
      formsUrl=formData.paging?.next||'';
    }
    return reply({ok:true,imported,duplicates,filtered,scanned,formsScanned,outsideLookback,lookbackDays:30});
  }catch(error){
    console.error('meta-lead-sync:',error?.message||'Meta lead sync failed');
    const status=error?.message==='Missing Bearer token'?401:500;
    return reply({error:error?.message||'Sincronizzazione non riuscita.'},status);
  }
}
export const config={path:'/.netlify/functions/meta-lead-sync'};
