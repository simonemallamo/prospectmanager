import { db, FieldValue, adminAuth, verifyBearer } from './_firebase-admin.mjs';

const allowedOrigins=new Set([
  'https://simonemallamo.github.io',
  'https://pm.retiredyoung.it',
  'https://rymanager-staging.netlify.app'
]);
const corsHeaders=origin=>({
  'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://pm.retiredyoung.it',
  'Access-Control-Allow-Methods':'POST, OPTIONS',
  'Access-Control-Allow-Headers':'Authorization, Content-Type',
  'Vary':'Origin'
});
const json=(data,status,origin)=>new Response(JSON.stringify(data),{
  status,
  headers:{...corsHeaders(origin),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});

async function findRecipient(raw){
  const value=String(raw||'').trim();
  if(!value)return{error:'Inserisci un’email o un ID JIFU.'};
  const users=db.collection('users');
  const isEmail=value.includes('@');
  let profileMatches=[];
  if(isEmail){
    const normalized=value.toLowerCase();
    try{
      const authUser=await adminAuth.getUserByEmail(normalized);
      if(authUser.disabled)return{error:'L’account destinatario è disattivato.'};
      const activeProfile=await users.doc(authUser.uid).get();
      if(!activeProfile.exists)return{error:'L’email è registrata, ma il profilo Prospect Manager attivo non è completo.'};
      const activeEmail=String(activeProfile.data()?.email||'').trim().toLowerCase();
      if(activeEmail&&activeEmail!==normalized)return{error:'Il profilo attivo non corrisponde a questa email.'};
      const aliases=await users.where('email','==',normalized).get();
      profileMatches=aliases.docs;
      if(!profileMatches.some(doc=>doc.id===authUser.uid))profileMatches.push(activeProfile);
      return{uid:authUser.uid,aliasUids:profileMatches.map(doc=>doc.id)};
    }catch(error){
      if(error?.code==='auth/user-not-found')return{error:'Nessun account trovato con questa email.'};
      throw error;
    }
  }else{
    const variants=[...new Set([value,value.toLowerCase(),value.toUpperCase()])];
    const snaps=await Promise.all(variants.map(v=>users.where('jifuId','==',v).limit(5).get()));
    const matches=new Map();
    for(const snap of snaps)for(const doc of snap.docs)matches.set(doc.id,doc);
    if(matches.size===0)return{error:'Nessun account trovato con questo ID JIFU.'};
    const profileEmails=[...new Set([...matches.values()].map(doc=>String(doc.data()?.email||'').trim().toLowerCase()).filter(Boolean))];
    if(profileEmails.length!==1)return{error:'Questo ID JIFU corrisponde a profili ambigui. Contatta l’amministratore per correggerli.'};
    try{
      const authUser=await adminAuth.getUserByEmail(profileEmails[0]);
      if(authUser.disabled)return{error:'L’account destinatario è disattivato.'};
      const activeProfile=await users.doc(authUser.uid).get();
      if(!activeProfile.exists)return{error:'Il profilo JIFU trovato non corrisponde a un profilo Prospect Manager attivo.'};
      const activeJifu=String(activeProfile.data()?.jifuId||'').trim().toLowerCase();
      if(activeJifu!==value.toLowerCase())return{error:'L’ID JIFU non corrisponde al profilo Prospect Manager attivo.'};
      const aliases=await users.where('email','==',profileEmails[0]).get();
      profileMatches=aliases.docs;
      if(!profileMatches.some(doc=>doc.id===authUser.uid))profileMatches.push(activeProfile);
      return{uid:authUser.uid,aliasUids:profileMatches.map(doc=>doc.id)};
    }catch(error){
      if(error?.code==='auth/user-not-found')return{error:'L’account Firebase associato a questo ID JIFU non è attivo.'};
      throw error;
    }
  }
}

export default async function handler(request){
  const origin=request.headers.get('origin')||'';
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:corsHeaders(origin)});
  if(request.method!=='POST')return json({error:'Metodo non consentito.'},405,origin);
  try{
    const identity=await verifyBearer(request);
    const body=await request.json();
    const prospectId=String(body?.prospectId||'').trim();
    if(!prospectId||prospectId.length>200)return json({error:'Prospect non valido.'},400,origin);
    const recipient=await findRecipient(body?.recipient);
    if(recipient.error)return json({error:recipient.error},404,origin);
    if(recipient.uid===identity.uid)return json({error:'Non puoi condividere un prospect con il tuo stesso account.'},400,origin);

    const prospectRef=db.collection('prospects').doc(prospectId);
    const prospectSnap=await prospectRef.get();
    if(!prospectSnap.exists)return json({error:'Prospect non trovato.'},404,origin);
    const prospect=prospectSnap.data();
    if(prospect.uid!==identity.uid)return json({error:'Puoi condividere solo i prospect che appartengono al tuo account.'},403,origin);

    const sharedWith=Array.isArray(prospect.sharedWith)?[...prospect.sharedWith]:[];
    const aliases=new Set(recipient.aliasUids||[]);
    aliases.add(recipient.uid);
    const activeAlreadyShared=sharedWith.includes(recipient.uid);
    const staleAliasAlreadyShared=sharedWith.some(uid=>uid!==recipient.uid&&aliases.has(uid));
    let shared;
    if(activeAlreadyShared&&staleAliasAlreadyShared){
      for(let i=sharedWith.length-1;i>=0;i--)if(sharedWith[i]!==recipient.uid&&aliases.has(sharedWith[i]))sharedWith.splice(i,1);
      shared=true;
    }else if(activeAlreadyShared){
      for(let i=sharedWith.length-1;i>=0;i--)if(aliases.has(sharedWith[i]))sharedWith.splice(i,1);
      shared=false;
    }else{
      for(let i=sharedWith.length-1;i>=0;i--)if(aliases.has(sharedWith[i]))sharedWith.splice(i,1);
      sharedWith.push(recipient.uid);
      shared=true;
    }
    await prospectRef.update({sharedWith,lastCheckAt:FieldValue.serverTimestamp()});
    return json({shared},200,origin);
  }catch(error){
    const status=error?.message==='Missing Bearer token'?401:400;
    return json({error:status===401?'Accedi di nuovo al Prospect Manager.':'Impossibile aggiornare la condivisione.'},status,origin);
  }
}

export const config={path:'/.netlify/functions/share-prospect'};
