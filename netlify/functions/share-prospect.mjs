import { db, FieldValue, verifyBearer } from './_firebase-admin.mjs';

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
  let queries;
  if(isEmail){
    const normalized=value.toLowerCase();
    queries=[users.where('email','==',normalized).limit(3)];
    if(value!==normalized)queries.push(users.where('email','==',value).limit(3));
  }else{
    const variants=[...new Set([value,value.toLowerCase(),value.toUpperCase()])];
    queries=variants.map(v=>users.where('jifuId','==',v).limit(3));
  }
  const snaps=await Promise.all(queries.map(q=>q.get()));
  const matches=new Map();
  for(const snap of snaps)for(const doc of snap.docs)matches.set(doc.id,doc);
  if(matches.size===0)return{error:isEmail?'Nessun account trovato con questa email.':'Nessun account trovato con questo ID JIFU.'};
  if(matches.size>1)return{error:isEmail?'Questa email corrisponde a più account. Usa l’ID JIFU della persona.':'Questo ID JIFU corrisponde a più account: contatta l’amministratore per correggere il profilo.'};
  return{uid:[...matches.keys()][0]};
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
    const index=sharedWith.indexOf(recipient.uid);
    const shared=index<0;
    if(shared)sharedWith.push(recipient.uid);else sharedWith.splice(index,1);
    await prospectRef.update({sharedWith,lastCheckAt:FieldValue.serverTimestamp()});
    return json({shared},200,origin);
  }catch(error){
    const status=error?.message==='Missing Bearer token'?401:400;
    return json({error:status===401?'Accedi di nuovo al Prospect Manager.':'Impossibile aggiornare la condivisione.'},status,origin);
  }
}

export const config={path:'/.netlify/functions/share-prospect'};
