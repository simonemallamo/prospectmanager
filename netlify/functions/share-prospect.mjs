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
    // Resolve exact Firebase Auth UIDs before treating other non-email input
    // as a JIFU ID. This supports users whose UID differs from a legacy profile
    // document and avoids silently looking up the UID as a JIFU code.
    try{
      const authUser=await adminAuth.getUser(value);
      if(authUser.disabled)return{error:'L’account destinatario è disattivato.'};
      return{uid:authUser.uid,aliasUids:[authUser.uid]};
    }catch(error){
      if(error?.code!=='auth/user-not-found')throw error;
    }
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
    const action=String(body?.action||'');
    // Read only prospects explicitly shared with the authenticated account.
    // This endpoint is also a fallback for clients whose Firestore listener is
    // rejected by browser-side rules; the Admin query remains scoped by UID.
    if(action==='list-shared'){
      const snap=await db.collection('prospects')
        .where('sharedWith','array-contains',identity.uid)
        .get();
      const toMillis=value=>typeof value?.toMillis==='function'?value.toMillis():null;
      const prospects=snap.docs.map(doc=>{
        const p=doc.data()||{};
        return {
          id:doc.id,
          uid:typeof p.uid==='string'?p.uid:'',
          userName:typeof p.userName==='string'?p.userName:'',
          name:typeof p.name==='string'?p.name:'',
          phone:typeof p.phone==='string'?p.phone:'',
          country:typeof p.country==='string'?p.country:'',
          provincia:typeof p.provincia==='string'?p.provincia:'',
          contacted:p.contacted===true,
          contattato:p.contattato===true,
          conoscitiva:p.conoscitiva===true,
          presentation:p.presentation===true,
          followUps:Array.isArray(p.followUps)?p.followUps.slice(0,4).map(Boolean):[false,false,false,false],
          payment:p.payment===true,
          iscritto:p.iscritto===true,
          note:typeof p.note==='string'?p.note:'',
          channel:typeof p.channel==='string'?p.channel:'',
          _insertedAt:Number(p._insertedAt)||0,
          createdAtMillis:toMillis(p.createdAt),
          lastCheckAtMillis:toMillis(p.lastCheckAt)
        };
      });
      return json({prospects},200,origin);
    }
    const prospectId=String(body?.prospectId||'').trim();
    if(!prospectId||prospectId.length>200)return json({error:'Prospect non valido.'},400,origin);
    if(!['share','revoke'].includes(action))return json({error:'Azione di condivisione non valida.'},400,origin);
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
    const normalizedShared=sharedWith.filter(uid=>!aliases.has(uid));
    const shared=action==='share';
    if(shared)normalizedShared.push(recipient.uid);
    await prospectRef.update({sharedWith:normalizedShared,lastCheckAt:FieldValue.serverTimestamp()});
    return json({shared},200,origin);
  }catch(error){
    const status=error?.message==='Missing Bearer token'?401:400;
    return json({error:status===401?'Accedi di nuovo al Prospect Manager.':'Impossibile aggiornare la condivisione.'},status,origin);
  }
}

export const config={path:'/.netlify/functions/share-prospect'};
