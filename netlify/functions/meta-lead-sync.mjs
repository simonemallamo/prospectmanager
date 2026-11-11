import { db, FieldValue, verifyBearer, getMetaIntegrationConfig, isMetaIntegrationOwner } from './_firebase-admin.mjs';
import { graph, describeGraphError, graphErrorSummary, isTokenError } from './_meta-graph.mjs';
import { LEAD_FIELDS, lower, saveLead, withAdNames, ensureFieldData, extractContact } from './_meta-leads.mjs';

const ALLOWED_ORIGINS=new Set(['https://simonemallamo.github.io','https://pm.retiredyoung.it']);
const cors=origin=>({
  'Access-Control-Allow-Origin':ALLOWED_ORIGINS.has(origin)?origin:'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Vary':'Origin'
});
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
    if(config.adAccountId&&String(page.adAccountId||'').replace(/^act_/,'')!==String(config.adAccountId).replace(/^act_/,''))return reply({error:'L’account pubblicitario personale non risulta collegato. Ricollega Meta scegliendo “Il tuo account” > Simone Mallamo e autorizzando l’account pubblicitario corretto.'},409);
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
    // Token split required by Meta:
    //  - user token (ads_read): ad account and ad objects (act_<id>/ads, <ad_id>)
    //  - Page token (leads_retrieval + pages_manage_ads): lead forms and leads
    // Calling act_<id>/ads with the Page token is what returned
    // "(#100) Unsupported get request": a Page token cannot load a personal ad account.
    const userToken=page.userAccessToken||'';
    if(config.adAccountId&&!userToken)return reply({error:'Il collegamento Meta è precedente alla correzione e non contiene il token utente per l’account pubblicitario. Premi “Ricollega account Meta” e autorizza di nuovo.',needsReconnect:true},409);
    const target=lower(config.campaignName),cutoff=Date.now()-30*24*60*60*1000,nameCache=new Map();
    const fieldKeys=new Set(),formCache=new Map();
    const stats={imported:0,repaired:0,withoutContact:0,fieldSources:{},duplicates:0,filtered:0,scanned:0,formsScanned:0,outsideLookback:0,adsScanned:0,adsMatched:[],adLeadsScanned:0,lookbackDays:30};
    const errors=[];
    const recordError=(phase,error)=>{const detail={phase,...describeGraphError(error)};errors.push(detail);console.error('meta-lead-sync graph error',detail);};
    const handleLead=async lead=>{
      if(lead.created_time&&Date.parse(lead.created_time)<cutoff){stats.outsideLookback++;return;}
      const {lead:full,fieldSource}=await ensureFieldData(lead,{pageToken:page.pageAccessToken,userToken});
      stats.fieldSources[fieldSource]=(stats.fieldSources[fieldSource]||0)+1;
      // Field keys only (never values) to diagnose unmapped form questions.
      const contact=extractContact(full.field_data||[]);
      for(const key of contact.fieldKeys)fieldKeys.add(key);
      if(!contact.name&&!contact.phone&&!contact.email)stats.withoutContact++;
      const result=await saveLead(await withAdNames(full,{userToken,cache:nameCache}),page,target,{pageToken:page.pageAccessToken,userToken,formCache});
      if(result==='imported')stats.imported++;else if(result==='repaired')stats.repaired++;else if(result==='duplicate')stats.duplicates++;else stats.filtered++;
    };
    const readLeads=async(objectId,label,onLead)=>{
      // Page token first; fall back to the user token if Meta rejects it for this object.
      let token=page.pageAccessToken,tokenKind='page',url=`${objectId}/leads`;
      for(let p=0;p<10&&url;p++){
        let data;
        try{data=await graph(url,{token,tokenKind,params:{fields:LEAD_FIELDS,limit:100}});}
        catch(error){
          if(p===0&&tokenKind==='page'&&userToken&&!isTokenError(error)){
            console.warn('meta-lead-sync page token rejected, retrying with user token',describeGraphError(error));
            token=userToken;tokenKind='user';p--;continue;
          }
          throw error;
        }
        for(const lead of data.data||[])await onLead(lead);
        url=data.paging?.next||'';
      }
    };
    // 1. Ads in the personal ad account whose ad, ad set or campaign name matches.
    if(config.adAccountId){
      try{
        let adsUrl=`act_${String(config.adAccountId).replace(/^act_/,'')}/ads`;
        for(let p=0;p<10&&adsUrl;p++){
          const adsData=await graph(adsUrl,{token:userToken,tokenKind:'user',params:{fields:'id,name,effective_status,adset{id,name},campaign{id,name}',limit:100}});
          for(const ad of adsData.data||[]){
            stats.adsScanned++;
            const names={ad_name:ad.name||'',adset_id:ad.adset?.id||'',adset_name:ad.adset?.name||'',campaign_id:ad.campaign?.id||'',campaign_name:ad.campaign?.name||''};
            if(![names.ad_name,names.adset_name,names.campaign_name].some(name=>lower(name)===target))continue;
            stats.adsMatched.push({id:ad.id,name:ad.name||'',status:ad.effective_status||''});
            nameCache.set(ad.id,names);
            try{await readLeads(ad.id,'ad',async lead=>{stats.adLeadsScanned++;await handleLead({...lead,ad_id:lead.ad_id||ad.id});});}
            catch(error){recordError(`leads of ad ${ad.id}`,error);}
          }
          adsUrl=adsData.paging?.next||'';
        }
      }catch(error){recordError('ad account ads',error);}
    }
    // 2. Every lead form on the Page (catches leads not reachable from the ad edge).
    try{
      let formsUrl=`${config.pageId}/leadgen_forms`;
      for(let p=0;p<5&&formsUrl;p++){
        const formData=await graph(formsUrl,{token:page.pageAccessToken,tokenKind:'page',params:{fields:'id,name,status,leads_count',limit:100}});
        for(const form of formData.data||[]){
          stats.formsScanned++;
          try{await readLeads(form.id,'form',async lead=>{stats.scanned++;await handleLead({...lead,form_id:lead.form_id||form.id});});}
          catch(error){recordError(`leads of form ${form.id}`,error);}
        }
        formsUrl=formData.paging?.next||'';
      }
    }catch(error){recordError('page lead forms',error);}
    const summary={...stats,adsMatched:stats.adsMatched.length,matchedAds:stats.adsMatched,fieldKeys:[...fieldKeys],errors};
    console.info('meta-lead-sync outcome',{...summary,errors:errors.length});
    if(errors.length){
      const reconnect=errors.some(item=>item.code===190||item.code===102);
      return reply({...summary,ok:false,needsReconnect:reconnect,error:`${errors.length} richieste Meta non riuscite. Prima: ${errors[0].phase} · ${errors[0].method||'GET'} ${errors[0].endpoint||''} (token ${errors[0].tokenKind||'?'}) → codice ${errors[0].code??'?'}${errors[0].subcode?'/'+errors[0].subcode:''}: ${errors[0].message}${reconnect?' · Ricollega l’account Meta.':''}`},502);
    }
    return reply({...summary,ok:true});
  }catch(error){
    console.error('meta-lead-sync failed',describeGraphError(error));
    const status=error?.message==='Missing Bearer token'?401:500;
    return reply({error:graphErrorSummary(error)||'Sincronizzazione non riuscita.'},status);
  }
}
export const config={path:'/.netlify/functions/meta-lead-sync'};