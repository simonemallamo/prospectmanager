
import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc,
         onSnapshot, query, where, serverTimestamp, getDocs }
                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ════════════════════════════════════
// 🔧 FIREBASE CONFIG
// ════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyA5_Bqs8MBsMT-MT_dcAc9I3MEeQa04XEA",
  authDomain: "prospectmanager-simonemallamo.firebaseapp.com",
  projectId: "prospectmanager-simonemallamo",
  storageBucket: "prospectmanager-simonemallamo.firebasestorage.app",
  messagingSenderId: "85066394723",
  appId: "1:85066394723:web:1687432bb2c1c07eae9c56"
};
// ════════════════════════════════════

const COUNTRIES = {
  'Italia': ['AG','AL','AN','AO','AR','AP','AT','AV','BA','BT','BL','BN','BG','BI','BO','BZ','BS','BR','CA','CL','CB','CE','CT','CZ','CH','CO','CS','CR','KR','CN','EN','FM','FE','FI','FG','FC','FR','GE','GO','GR','IM','IS','SP','AQ','LT','LE','LC','LI','LO','LU','MC','MN','MS','MT','ME','MI','MO','MB','NA','NO','NU','OR','PD','PA','PR','PV','PG','PU','PE','PC','PI','PT','PN','PZ','PO','RG','RA','RC','RE','RI','RN','RO','RM','SA','SS','SV','SI','SR','SO','SU','TA','TE','TR','TO','TP','TN','TV','TS','UD','VA','VE','VB','VC','VR','VV','VI','VT'],
  'Albania': ['Berat','Durrës','Elbasan','Fier','Gjirokastër','Korçë','Kukës','Lezhë','Dibër','Shkodër','Tiranë','Vlorë'],
  'Algeria': ['Adrar','Aïn Defla','Aïn Témouchent','Alger','Annaba','Batna','Béchar','Béjaïa','Biskra','Blida','Bordj Bou Arréridj','Bouira','Boumerdès','Chlef','Constantine','Djelfa','El Bayadh','El Oued','El Tarf','Ghardaïa','Guelma','Illizi','Jijel','Khenchela','Laghouat','M\'Sila','Mascara','Médéa','Mila','Mostaganem','Naâma','Oran','Ouargla','Oum el Bouaghi','Relizane','Saïda','Sétif','Sidi Bel Abbès','Skikda','Souk Ahras','Tamanrasset','Tébessa','Tiaret','Tindouf','Tipaza','Tissemsilt','Tizi Ouzou','Tlemcen'],
  'Argentina': ['Buenos Aires','Catamarca','Chaco','Chubut','Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy','La Pampa','La Rioja','Mendoza','Misiones','Neuquén','Río Negro','Salta','San Juan','San Luis','Santa Cruz','Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'],
  'Austria': ['Burgenland','Kärnten','Niederösterreich','Oberösterreich','Salzburg','Steiermark','Tirol','Vorarlberg','Wien'],
  'Belgio': ['Anversa','Brabante Vallone','Brabante Fiammingo','Brussel','Est','Fiandre Occidentali','Fiandre Orientali','Hainaut','Liegi','Limburgo','Lussemburgo','Namur'],
  'Bosnia': ['Federazione BiH','Repubblica Srpska','Distretto di Brčko'],
  'Brasile': ['Acre','Alagoas','Amapá','Amazonas','Bahia','Ceará','Distrito Federal','Espírito Santo','Goiás','Maranhão','Mato Grosso','Mato Grosso do Sul','Minas Gerais','Pará','Paraíba','Paraná','Pernambuco','Piauí','Rio de Janeiro','Rio Grande do Norte','Rio Grande do Sul','Rondônia','Roraima','Santa Catarina','São Paulo','Sergipe','Tocantins'],
  'Bulgaria': ['Blagoevgrad','Burgas','Dobrich','Gabrovo','Haskovo','Kardzhali','Kyustendil','Lovech','Montana','Pazardzhik','Pernik','Pleven','Plovdiv','Razgrad','Ruse','Shumen','Silistra','Sliven','Smolyan','Sofia','Stara Zagora','Targovishte','Varna','Veliko Tarnovo','Vidin','Vratsa','Yambol'],
  'Canada': ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland','Nova Scotia','Ontario','PEI','Quebec','Saskatchewan','Yukon','NWT','Nunavut'],
  'Capo Verde': ['Boa Vista','Brava','Fogo','Maio','Sal','Santiago','Santo Antão','São Nicolau','São Vicente'],
  'Croazia': ['Bjelovar-Bilogora','Brod-Posavina','Dubrovnik-Neretva','Istria','Karlovac','Koprivnica-Križevci','Krapina-Zagorje','Lika-Senj','Međimurje','Osijek-Baranja','Požega-Slavonia','Primorje-Gorski Kotar','Šibenik-Knin','Sisak-Moslavina','Split-Dalmazia','Varaždin','Virovitica-Podravina','Vukovar-Syrmia','Zadar','Zagabria'],
  'Emirati Arabi': ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'],
  'Egitto': ['Alessandria','Assiut','Assuan','Beheira','Beni Suef','Cairo','Dakahlia','Damietta','Fayoum','Gharbia','Giza','Ismailia','Kafr el-Sheikh','Luxor','Matruh','Minya','Minufiyya','North Sinai','Nuova Valle','Port Said','Qalyubia','Qena','Red Sea','Sharqia','Sohag','South Sinai','Suez'],
  'Francia': ['Auvergne-Rhône-Alpes','Bourgogne-Franche-Comté','Bretagne','Centre-Val de Loire','Corse','Grand Est','Hauts-de-France','Île-de-France','Normandie','Nouvelle-Aquitaine','Occitanie','Pays de la Loire','Provence-Alpes-Côte d\'Azur'],
  'Germania': ['Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen'],
  'Gran Bretagna': ['East Midlands','East of England','London','North East','North West','Northern Ireland','Scotland','South East','South West','Wales','West Midlands','Yorkshire'],
  'Grecia': ['Attica','Crete','Eastern Macedonia','Epirus','Ionian Islands','North Aegean','Peloponnese','South Aegean','Thessaly','Western Greece','Western Macedonia','Central Greece','Central Macedonia'],
  'Kosovo': ['Ferizaj','Gjakova','Gjilan','Istog','Mitrovica','Peja','Pristina','Prizren'],
  'Lussemburgo': ['Capellen','Clervaux','Diekirch','Echternach','Esch-sur-Alzette','Grevenmacher','Lussemburgo','Mersch','Redange','Remich','Vianden','Wiltz'],
  'Malta': ['Gozo','Malta del Nord','Malta del Sud','Malta Centrale','Valletta'],
  'Marocco': ['Agadir-Ida Ou Tanane','Al Haouz','Al Hoceïma','Aousserd','Assa-Zag','Azilal','Benslimane','Berkane','Béni Mellal','Boulemane','Casablanca','Chefchaouen','Chichaoua','El Hajeb','El Jadida','Errachidia','Essaouira','Fahs-Anjra','Figuig','Fès','Guelmim','Ifrane','Inezgane-Ait Melloul','Jerada','Kénitra','Khémisset','Khénifra','Khouribga','Laâyoune','Larache','Marrakech','Meknès','Midelt','Mohammedia','Moulay Yacoub','Nador','Ouarzazate','Oued Ed-Dahab','Oujda-Angad','Rabat','Safi','Salé','Settat','Sidi Bennour','Sidi Ifni','Sidi Kacem','Tanger-Assilah','Tan-Tan','Taounate','Taourirt','Taroudannt','Tata','Taza','Tétouan','Tinghir','Tiznit','Zagora'],
  'Montenegro': ['Bar','Berane','Bijelo Polje','Budva','Cetinje','Danilovgrad','Herceg Novi','Kolašin','Kotor','Mojkovac','Nikšić','Petnjica','Plav','Pljevlja','Plužine','Podgorica','Rožaje','Šavnik','Tivat','Ulcinj','Žabljak'],
  'Olanda': ['Drenthe','Flevoland','Friesland','Gelderland','Groningen','Limburg','Noord-Brabant','Noord-Holland','Overijssel','Utrecht','Zeeland','Zuid-Holland'],
  'Polonia': ['Dolnośląskie','Kujawsko-Pomorskie','Lubelskie','Lubuskie','Łódź','Małopolskie','Mazowieckie','Opolskie','Podkarpackie','Podlaskie','Pomorskie','Śląskie','Świętokrzyskie','Warmińsko-Mazurskie','Wielkopolskie','Zachodniopomorskie'],
  'Portogallo': ['Alentejo','Algarve','Açores','Centro','Lisboa','Madeira','Norte'],
  'Repubblica Ceca': ['Boemia Meridionale','Boemia Settentrionale','Boemia Orientale','Boemia Occidentale','Boemia Centrale','Moravia Meridionale','Moravia Settentrionale','Praga'],
  'Romania': ['Alba','Arad','Argeș','Bacău','Bihor','Bistrița-Năsăud','Botoșani','Brăila','Brașov','Bucharest','Buzău','Călărași','Caraș-Severin','Cluj','Constanța','Covasna','Dâmbovița','Dolj','Galați','Giurgiu','Gorj','Harghita','Hunedoara','Ialomița','Iași','Ilfov','Maramureș','Mehedinți','Mureș','Neamț','Olt','Prahova','Sălaj','Satu Mare','Sibiu','Suceava','Teleorman','Timiș','Tulcea','Vâlcea','Vaslui','Vrancea'],
  'Serbia': ['Bačka Settentrionale','Bačka Meridionale','Banat Centrale','Banat Settentrionale','Banat Meridionale','Belgrado','Bor','Braničevo','Jablanica','Kolubara','Mačva','Moravica','Nišava','Pčinja','Pirot','Podunavlje','Pomoravlje','Rasina','Raška','Šumadija','Toplica','Zaječar','Zlatibor'],
  'Slovacchia': ['Banská Bystrica','Bratislava','Košice','Nitra','Prešov','Trenčín','Trnava','Žilina'],
  'Slovenia': ['Gorenjska','Goriška','Jugovzhodna Slovenija','Koroška','Littoral-Inner Carniola','Osrednjeslovenska','Podravska','Pomurska','Posavska','Primorsko-notranjska','Savinjska','Zasavska'],
  'Spagna': ['Andalucía','Aragón','Asturias','Baleares','Canarias','Cantabria','Castilla-La Mancha','Castilla y León','Cataluña','Ceuta','Comunitat Valenciana','Extremadura','Galicia','La Rioja','Madrid','Melilla','Murcia','Navarra','País Vasco'],
  'Svizzera': ['Argovia','Appenzello Esterno','Appenzello Interno','Basilea Campagna','Basilea Città','Berna','Friburgo','Ginevra','Glarona','Grigioni','Lucerna','Nidvaldo','Obvaldo','San Gallo','Sciaffusa','Soletta','Svitto','Ticino','Turgovia','Uri','Vallese','Vaud','Zugo','Zurigo'],
  'Tunisia': ['Ariana','Béja','Ben Arous','Bizerte','Gabès','Gafsa','Jendouba','Kairouan','Kasserine','Kébili','Le Kef','Mahdia','La Manouba','Medenine','Monastir','Nabeul','Sfax','Sidi Bouzid','Siliana','Sousse','Tataouine','Tozeur','Tunisi','Zaghouan'],
  'Turchia': ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale','Kırklareli','Kırşehir','Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Şanlıurfa','Siirt','Sinop','Sivas','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'],
  'Ucraina': ['Cherkasy','Chernihiv','Chernivtsi','Crimea','Dnipropetrovsk','Donetsk','Ivano-Frankivsk','Kharkiv','Kherson','Khmelnytskyi','Kiev','Kirovohrad','Luhansk','Lviv','Mykolaiv','Odessa','Poltava','Rivne','Sumy','Ternopil','Vinnytsia','Volyn','Zakarpattia','Zaporizhzhia','Zhytomyr'],
  'Ungheria': ['Bács-Kiskun','Baranya','Békés','Borsod-Abaúj-Zemplén','Budapest','Csongrád-Csanád','Fejér','Győr-Moson-Sopron','Hajdú-Bihar','Heves','Jász-Nagykun-Szolnok','Komárom-Esztergom','Nógrád','Pest','Somogy','Szabolcs-Szatmár-Bereg','Tolna','Vas','Veszprém','Zala'],
  'USA': ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'],
  'Venezuela': ['Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo','Cojedes','Delta Amacuro','Falcón','Guárico','Lara','Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre','Táchira','Trujillo','Vargas','Yaracuy','Zulia'],
};
const COUNTRY_LIST = Object.keys(COUNTRIES).sort();

const LEADER_CODE = "RYOUNG";
const ADMIN_CODE  = "Giftedbird609";
// ════════════════════════════════════

const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);
const db    = getFirestore(fbApp);

// ── STATE ──
let cUser = null, cData = null;
let prospects = [];
let pFilter = 'tutti';
let sortCol = 'date';
let sortDir = 'desc';
let editingPid = null;
let adminUnlocked = false;
let allUsers = [], allProspects = [];
let editingUid = null;
let aFilter = 'tutti';
let unsub = null;

// ── THEME ──
window.toggleTheme = () => {
  const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('pm_theme', t);
};
document.documentElement.setAttribute('data-theme', localStorage.getItem('pm_theme') || 'dark');

// ── AUTH STATE ──
onAuthStateChanged(auth, async user => {
  if (user) {
    cUser = user;
    const snap = await getDoc(doc(db, 'users', user.uid));
    // If user doc exists in 'users', they are ALWAYS valid — never block them
    if (snap.exists()) {
      cData = snap.data();
      // If member, check if there's a leader doc with same email (UID mismatch fix)
      if((cData.role||'member')==='member' && user.email) {
        try {
          const eq = await getDocs(query(collection(db,'users'),where('email','==',user.email.toLowerCase())));
          const ld = eq.docs.find(d=>d.data().role==='leader' && d.id!==user.uid);
          if(ld) {
            await setDoc(doc(db,'users',user.uid),{...ld.data(),uplineUid:cData.uplineUid||ld.data().uplineUid||null,uplinePath:cData.uplinePath||ld.data().uplinePath||[]},{merge:true});
            const rs = await getDoc(doc(db,'users',user.uid));
            if(rs.exists()) cData = rs.data();
          }
        } catch(e){}
      }
      showApp();
      return;
    }
    // User doc missing from 'users' — check deleted_users
    // Only block if in deleted_users AND no 'users' doc exists
    try {
      const deletedSnap = await getDoc(doc(db, 'deleted_users', user.uid));
      if (deletedSnap.exists()) {
        // Double-check: try to re-read 'users' doc (might be a race condition)
        const recheck = await getDoc(doc(db, 'users', user.uid));
        if (recheck.exists()) {
          cData = recheck.data();
          showApp();
          return;
        }
        await signOut(auth);
        showAuth();
        showErr('Account non trovato. Contatta Simone indicando la tua email.');
        return;
      }
    } catch(e) {}
    // No doc anywhere — create a basic profile so they can access the app
    cData = { email: user.email, role: 'member' };
    showApp();
  } else {
    cUser = null; cData = null;
    showAuth();
  }
});

// ── LOGIN / SIGNUP ──
window.doLogin = async () => {
  const email = id('l-email').value.trim();
  const pass  = id('l-pass').value;
  if (!email || !pass) { showErr('Inserisci email e password'); return; }
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch(e) { showErr(errMsg(e.code)); }
};

window.doSignup = async () => {
  const name   = id('s-name').value.trim();
  const email  = id('s-email').value.trim();
  const pass   = id('s-pass').value;
  const lcode  = id('s-lcode').value;
  if (!name || !email || !pass) { showErr('Compila tutti i campi'); return; }
  if (lcode && lcode !== LEADER_CODE) { showErr('Codice Leader non valido'); return; }
  const role = lcode === LEADER_CODE ? 'leader' : 'member';

  // Read invite token
  const token = new URLSearchParams(window.location.search).get('invite');
  let uplineUid = null, uplinePath = [];
  if (token) {
    try {
      const inv = await getDoc(doc(db, 'invites', token));
      if (inv.exists()) { uplineUid = inv.data().uid; uplinePath = inv.data().uplinePath || []; }
    } catch(e) {}
  }
  const myPath = uplineUid ? [...uplinePath, uplineUid] : [];

  try {
    // Step 1: check if email already has a Firestore document (orphan Auth account)
    // This catches cases where Auth was created but Firestore doc was not saved
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Step 2: Generate progressive user number
    let userNumber = 1;
    try {
      const allUsersSnap = await getDocs(collection(db, 'users'));
      userNumber = allUsersSnap.size + 1;
    } catch(e) { userNumber = Date.now() % 10000; } // fallback if read fails

    // Step 3: Save Firestore document — retry once if it fails
    const userData = {
      name, email, role,
      userNumber,
      uplineUid: uplineUid || null,
      uplinePath: myPath,
      createdAt: serverTimestamp()
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), userData);
    } catch(firestoreErr) {
      // Retry once after short delay
      await new Promise(r => setTimeout(r, 1000));
      try {
        await setDoc(doc(db, 'users', cred.user.uid), userData);
      } catch(retryErr) {
        // Auth account created but Firestore failed — user can still login
        // and will appear as empty account. Log the error.
        console.error('Firestore save failed after retry:', retryErr);
        showErr('Account creato ma profilo non salvato. Contatta Simone con il tuo ID: ' + cred.user.uid.slice(0,8));
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }
    }

    window.history.replaceState({}, '', window.location.pathname);
  } catch(e) {
    // If auth/email-already-in-use, check if they have a Firestore doc
    if(e.code === 'auth/email-already-in-use') {
      showErr('⚠️ Email già registrata. Usa la funzione Accedi con questa email.');
    } else {
      showErr(errMsg(e.code));
    }
  }
};

window.doLogout = async () => { if (unsub) unsub(); await signOut(auth); };

window.authTab = t => {
  id('form-login').classList.toggle('hidden', t !== 'login');
  id('form-signup').classList.toggle('hidden', t !== 'signup');
  id('atab-login').classList.toggle('on', t === 'login');
  id('atab-signup').classList.toggle('on', t === 'signup');
};

window.toggleLeaderField = () => {
  id('leader-code-wrap').classList.toggle('hidden');
  if (!id('leader-code-wrap').classList.contains('hidden')) id('s-lcode').focus();
};

// ── SHOW AUTH / APP ──
function showAuth() {
  id('auth-screen').style.display = 'flex';
  id('app-screen').style.display  = 'none';
  checkInviteBanner();
}
function showApp() {
  id('auth-screen').style.display = 'none';
  id('app-screen').style.display  = 'block';
  const ini = (cData?.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  id('u-av').textContent = ini;
  id('u-nm').textContent = cData?.name || cUser.email;
  if (cData?.role === 'leader') id('tab-team').classList.remove('hidden');
  id('tab-tree').classList.remove('hidden');
  id('tab-admin').classList.remove('hidden'); // always visible, protected by code
  loadProspects();
}

async function checkInviteBanner() {
  const token = new URLSearchParams(window.location.search).get('invite');
  if (!token) return;
  try {
    const inv = await getDoc(doc(db, 'invites', token));
    if (inv.exists()) {
      id('inviter-nm').textContent = inv.data().name || '—';
      id('invite-banner').style.display = 'block';
      authTab('signup');
    }
  } catch(e) {}
}

// ── PROSPECTS ──
function loadProspects() {
  if (unsub) unsub();
  const q = query(collection(db, 'prospects'), where('uid','==', cUser.uid));
  unsub = onSnapshot(q, snap => {
    prospects = snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
    // Populate provincia filter with used provinces
    const provSel = id('p-prov-filter');
    if (provSel) {
      const used = [...new Set(prospects.map(p=>p.country||p.provincia).filter(Boolean))].sort();
      const cur = provSel.value;
      provSel.innerHTML = '<option value="">Provincia</option>' + used.map(p=>`<option${p===cur?' selected':''}>${p}</option>`).join('');
    }
    renderStats(); renderTable();
  });
}

function renderStats() {
  const wk = Date.now()-7*86400000;
  const nw = prospects.filter(p=>(p.createdAt?.toMillis()||0)>=wk).length;
  const pr = prospects.filter(p=>p.presentation).length;
  const pa = prospects.filter(p=>p.payment).length;
  const fu = prospects.filter(p=>(p.followUps||[]).filter(Boolean).length===4).length;
  const iscr = prospects.filter(p=>p.iscritto).length;
  const cont = prospects.filter(p=>p.contattato).length;
  id('my-stats').innerHTML =
    sc('Nuovi (7gg)',nw,'g')+sc('Totale',prospects.length,'ac')+
    sc('Contattati',cont,'b')+sc('Presentazioni',pr,'b')+sc('Attesa pag.',pa,'a')+sc('Iscritti',iscr,'g');
}

window.renderTable = () => {
  const q = (id('p-search')?.value||'').toLowerCase();
  const provF = (id('prov-filter')?.value||'');
  let rows = prospects.filter(p=>{
    const m=(p.name||'').toLowerCase().includes(q)||(p.note||'').toLowerCase().includes(q)||(p.channel||'').toLowerCase().includes(q);
    const st=status(p);
    const pv=!provF||(p.provincia||'')=== provF;
    return m&&(pFilter==='tutti'||st===pFilter)&&pv;
  });
  // Apply sorting
  rows.sort((a,b) => {
    let va, vb;
    switch(sortCol) {
      case 'name':   va=(a.name||'').toLowerCase(); vb=(b.name||'').toLowerCase(); break;
      case 'days':   va=days(a); vb=days(b); break;
      case 'prov':   va=(a.country||a.provincia||'').toLowerCase(); vb=(b.country||b.provincia||'').toLowerCase(); break;
      case 'fu': va=(a.followUps||[]).filter(Boolean).length; vb=(b.followUps||[]).filter(Boolean).length; break;
      case 'iscritto': va=a.iscritto?1:0; vb=b.iscritto?1:0; break;
      case 'contattato': va=a.contattato?1:0; vb=b.contattato?1:0; break;
      case 'pres':   va=a.presentation?1:0; vb=b.presentation?1:0; break;
      case 'pay':    va=a.payment?1:0; vb=b.payment?1:0; break;
      case 'provincia': va=(a.provincia||''); vb=(b.provincia||''); break;
      case 'status': va=status(a); vb=status(b); break;
      default: // date — most recent first
        va=(a.createdAt?.toMillis()||a._insertedAt||0);
        vb=(b.createdAt?.toMillis()||b._insertedAt||0);
        return vb-va;
    }
    if (va < vb) return sortDir==='asc' ? -1 : 1;
    if (va > vb) return sortDir==='asc' ? 1 : -1;
    return 0;
  });
  const tb = id('p-tbody');
  if (!rows.length){tb.innerHTML=`<tr><td colspan="12"><div class="empty">📋 Nessun prospect. Aggiungine uno!</div></td></tr>`;return;}
  tb.innerHTML = rows.map(p=>{
    const d=days(p), dc=d<=3?'ok':d<=7?'warn':'bad';
    const fu=p.followUps||[false,false,false,false];
    const st=status(p);
    const pt={nuovo:'Nuovo',attivo:'Attivo',paga:'In attesa pag.',done:'Follow-up ✓'}[st];
    return `<tr data-id="${p.id}">
      <td style="padding:9px 8px;"><input type="checkbox" class="row-check" value="${p.id}" onchange="updateBulkBar()" style="cursor:pointer;width:15px;height:15px;accent-color:var(--accent);"></td>
      <td><div class="nm">${x(p.name)}</div>${p.channel||p.note?`<div class="note">${x(p.channel||'')}${p.channel&&p.note?' · ':''}${x(p.note||'')}</div>`:''}</td>
      <td style="white-space:nowrap;font-size:12px;color:var(--text2);">${p.phone?x(p.phone):'—'}</td>
      <td><span class="dbadge ${dc}">${d}g</span></td>
      <td><button class="chk${p.presentation?' on':''}" onclick="tField('${p.id}','presentation',${!p.presentation})">${p.presentation?'✓':''}</button></td>
      <td><div class="fu-row">${[0,1,2,3].map(i=>`<button class="chk fu${fu[i]?' on':''}" onclick="tFu('${p.id}',${i},${!fu[i]})">${fu[i]?'✓':(i+1)}</button>`).join('')}</div></td>
      <td><div class="pay-row" onclick="tField('${p.id}','payment',${!p.payment})"><div class="pay-dot${p.payment?' on':''}"></div><span class="pay-lbl${p.payment?' on':''}">${p.payment?'In attesa':'—'}</span></div></td>
      <td><span class="pill ${st}">${pt}</span></td>
      <td style="white-space:nowrap;">${p.country?`<div style="font-size:12px;font-weight:500;">${x(p.country)}</div>`:''} ${p.provincia?`<div style="font-family:monospace;font-size:10px;color:var(--text3);">${x(p.provincia)}</div>`:''}${!p.country&&!p.provincia?'<span style="color:var(--text3)">—</span>':''}</td>
      <td><button class="chk${p.iscritto?' on':''}" onclick="tField('${p.id}','iscritto',${!p.iscritto})" title="Segna come iscritto">${p.iscritto?'✓':''}</button></td>
      <td><button class="chk${p.contattato?' on':''}" style="${p.contattato?'background:var(--green);border-color:var(--green);color:#0f0f0f;':''}" onclick="tField('${p.id}','contattato',${!p.contattato})" title="Segna come contattato">${p.contattato?'✓':''}</button></td>
      <td><div class="act-btns"><button class="act-btn" onclick="editProspect('${p.id}')">Modifica</button><button class="act-btn del" onclick="delProspect('${p.id}','${x(p.name)}')">Elimina</button></div></td>
    </tr>`;
  }).join('');
};

window.tField = async (id_,f,v) => await updateDoc(doc(db,'prospects',id_),{[f]:v,lastCheckAt:serverTimestamp()});
window.tFu = async (id_,i,v) => {
  const p=prospects.find(x=>x.id===id_); if(!p) return;
  const fu=[...(p.followUps||[false,false,false,false])]; fu[i]=v;
  await updateDoc(doc(db,'prospects',id_),{followUps:fu,lastCheckAt:serverTimestamp()});
};
window.delProspect = async (id_,name) => { if(confirm(`Eliminare ${name}?`)) await deleteDoc(doc(db,'prospects',id_)); };
window.editProspect = pid => {
  const p=prospects.find(x=>x.id===pid); if(!p) return;
  editingPid=pid;
  id('p-modal-title').textContent='Modifica prospect';
  id('p-name').value=p.name||''; id('p-channel').value=p.channel||''; id('p-phone').value=p.phone||'';
  if(typeof COUNTRY_LIST !== 'undefined') populateCountries('p-country');
  id('p-country').value=p.country||'';
  if(p.country && typeof updateRegions !== 'undefined') { updateRegions('p-country','p-provincia'); setTimeout(()=>{ id('p-provincia').value=p.provincia||''; }, 50); } else { id('p-provincia').value=p.provincia||''; }
  id('p-note').value=p.note||'';
  id('p-overlay').classList.remove('hidden');
};
window.populateCountries = function(selId) {
  const sel = id(selId);
  if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">— Seleziona paese —</option>' +
    COUNTRY_LIST.map(c=>`<option value="${c}"${c===cur?' selected':''}>${c}</option>`).join('');
};

window.updateRegions = function(countrySelId, regionSelId) {
  const country = id(countrySelId)?.value;
  const regionSel = id(regionSelId);
  if(!regionSel) return;
  if(!country || !COUNTRIES[country]) {
    regionSel.innerHTML = '<option value="">— Seleziona prima il paese —</option>';
    regionSel.disabled = true;
    return;
  }
  const regions = COUNTRIES[country];
  regionSel.innerHTML = '<option value="">— Seleziona regione —</option>' +
    regions.map(r=>`<option value="${r}">${r}</option>`).join('');
  regionSel.disabled = false;
};


window.openProspectModal = () => {
  editingPid=null;
  id('p-modal-title').textContent='Nuovo prospect';
  ['p-name','p-channel','p-phone','p-note'].forEach(k=>id(k).value='');
  id('p-country').value='';
  id('p-provincia').value=''; id('p-provincia').disabled=true;
  id('p-overlay').classList.remove('hidden');
  // Populate countries after modal is visible
  if(typeof COUNTRY_LIST !== 'undefined') populateCountries('p-country');
};
window.closeProspectModal = () => id('p-overlay').classList.add('hidden');
window.saveProspect = async () => {
  const name=id('p-name').value.trim();
  if(!name){id('p-name').style.borderColor='var(--red)';return;}
  const data={name,channel:id('p-channel').value.trim(),phone:id('p-phone').value.trim(),country:id('p-country').value,provincia:id('p-provincia').value,note:id('p-note').value.trim(),uid:cUser.uid,userName:cData?.name||cUser.email};
  if(editingPid) await updateDoc(doc(db,'prospects',editingPid),data);
  else await addDoc(collection(db,'prospects'),{...data,presentation:false,followUps:[false,false,false,false],payment:false,createdAt:serverTimestamp(),lastCheckAt:null,_insertedAt:Date.now()});
  closeProspectModal();
};


window.sortBy = col => {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = col === 'days' ? 'desc' : 'asc';
  }
  // Update header styles
  ['name','days','prov','pres','pay','status'].forEach(k => {
    const th = id('th-'+k);
    if (!th) return;
    th.classList.toggle('active', k === col);
    const arrow = th.querySelector('.sort-arrow');
    if (arrow) arrow.textContent = k === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕';
  });
  renderTable();
};

var hiddenMembers = new Set();
try { hiddenMembers = new Set(JSON.parse(localStorage.getItem('pm_hidden')||'[]')); } catch(e){}


// ── PERSONAL PLACEMENT (per-viewer) ──
// The real upline relationship is immutable. Each viewer stores a private layout
// on their own user document, so changing a position never changes another leader's view.
function getViewerLayout(viewerUid, users){
  const me=(users||[]).find(u=>u.id===viewerUid);
  return (me && me.personalLayout && typeof me.personalLayout==='object') ? me.personalLayout : {};
}
function getDirectChildForViewer(memberId, viewerUid, users){
  const all=users||[]; const target=all.find(u=>u.id===memberId); if(!target)return null;
  let cur=target, guard=0;
  while(cur && guard++<500){
    if(cur.uplineUid===viewerUid) return cur;
    cur=all.find(u=>u.id===cur.uplineUid);
  }
  return null;
}
function getPersonalPlacement(memberId, viewerUid, users){
  const all=users||[]; const layout=getViewerLayout(viewerUid,all);
  if(layout[memberId]) return layout[memberId];
  const target=all.find(u=>u.id===memberId); if(!target)return null;
  // Legacy compatibility: direct-child legMap entries remain readable until migrated.
  if(target.legMap && target.legMap[viewerUid]) return {parentUid:viewerUid,leg:target.legMap[viewerUid],order:target.legOrder};
  const direct=getDirectChildForViewer(memberId,viewerUid,all);
  if(direct){
    if(layout[direct.id]) return {parentUid:viewerUid,leg:layout[direct.id].leg,order:layout[direct.id].order};
    if(direct.legMap && direct.legMap[viewerUid]) return {parentUid:viewerUid,leg:direct.legMap[viewerUid],order:direct.legOrder};
  }
  return null;
}
function getLegFor(u, viewerUid, users){
  const all=users||window._cachedUs||window._treeUs||[];
  const p=getPersonalPlacement(u.id,viewerUid,all);
  if(p && p.leg) return p.leg;
  const direct=getDirectChildForViewer(u.id,viewerUid,all);
  if(direct){
    const dp=getPersonalPlacement(direct.id,viewerUid,all);
    if(dp && dp.leg) return dp.leg;
    if(direct.legMap && direct.legMap[viewerUid]) return direct.legMap[viewerUid];
  }
  return null;
}
function getPersonalParent(memberId, viewerUid, users){
  const all=users||[]; const p=getPersonalPlacement(memberId,viewerUid,all);
  return p?.parentUid || (all.find(u=>u.id===memberId)?.uplineUid || null);
}
async function savePersonalPlacement(memberId, viewerUid, placement, users){
  if(memberId===viewerUid) throw new Error('Non puoi posizionare te stesso.');
  const all=users||[]; const viewer=all.find(u=>u.id===viewerUid);
  if(!viewer) throw new Error('Utente non trovato.');
  const allowed=new Set();
  const q=[viewerUid]; let guard=0;
  while(q.length && guard++<1000){ const pid=q.shift(); all.filter(u=>u.uplineUid===pid).forEach(ch=>{if(!allowed.has(ch.id)){allowed.add(ch.id);q.push(ch.id);}}); }
  if(!allowed.has(memberId)) throw new Error('Puoi posizionare solo persone della tua downline.');
  const layout=viewer.personalLayout && typeof viewer.personalLayout==='object' ? {...viewer.personalLayout} : {};
  layout[memberId]={parentUid:placement.parentUid,leg:placement.leg||null,order:placement.order??9999};
  await updateDoc(doc(db,'users',viewerUid),{personalLayout:layout});
  viewer.personalLayout=layout;
  const cached=(users||[]).find(u=>u.id===viewerUid); if(cached) cached.personalLayout=layout;
}

// ── MEMBER ORDERING ──
window.moveMember = async function(uid, dir) {
  var allUs=window._cachedUs||[]; var viewer=cUser.uid;
  var u=allUs.find(x=>x.id===uid); if(!u)return;
  var leg=getLegFor(u,viewer,allUs)||'';
  var siblings=allUs.filter(function(x){return getLegFor(x,viewer,allUs)===leg&&!hiddenMembers.has(x.id);})
    .sort(function(a,b){var pa=getPersonalPlacement(a.id,viewer,allUs)||{},pb=getPersonalPlacement(b.id,viewer,allUs)||{};return (pa.order??9999)-(pb.order??9999)||(a.name||'').localeCompare(b.name||'');});
  var idx=siblings.findIndex(x=>x.id===uid); if(idx<0)return;
  var swapIdx=dir==='up'?idx-1:idx+1; if(swapIdx<0||swapIdx>=siblings.length)return;
  var other=siblings[swapIdx];
  try{
    var a=getPersonalPlacement(uid,viewer,allUs)||{parentUid:getPersonalParent(uid,viewer,allUs),leg};
    var b=getPersonalPlacement(other.id,viewer,allUs)||{parentUid:getPersonalParent(other.id,viewer,allUs),leg};
    await savePersonalPlacement(uid,viewer,{parentUid:a.parentUid,leg:a.leg,order:b.order??swapIdx},allUs);
    await savePersonalPlacement(other.id,viewer,{parentUid:b.parentUid,leg:b.leg,order:a.order??idx},allUs);
    renderTeamDashboard();
  }catch(e){console.warn('moveMember error',e);alert(e.message||'Errore');}
};

window.handleDrop = async function(draggedUid,targetUid,fromGrid,toGrid){
  var allUs=window._cachedUs||[], viewer=cUser.uid;
  var dragged=allUs.find(x=>x.id===draggedUid), target=allUs.find(x=>x.id===targetUid); if(!dragged||!target)return;
  var targetLeg=getLegFor(target,viewer,allUs)||'right';
  try{
    var dp=getPersonalPlacement(draggedUid,viewer,allUs)||{parentUid:getPersonalParent(draggedUid,viewer,allUs),leg:getLegFor(dragged,viewer,allUs)};
    var tp=getPersonalPlacement(targetUid,viewer,allUs)||{parentUid:getPersonalParent(targetUid,viewer,allUs),leg:targetLeg};
    // In the Team Dashboard, dropping on another member swaps their personal positions.
    if(fromGrid===toGrid){
      await savePersonalPlacement(draggedUid,viewer,{parentUid:dp.parentUid,leg:dp.leg,order:tp.order??9999},allUs);
      await savePersonalPlacement(targetUid,viewer,{parentUid:tp.parentUid,leg:tp.leg,order:dp.order??9999},allUs);
    }else{
      var siblings=allUs.filter(x=>getLegFor(x,viewer,allUs)===targetLeg&&!hiddenMembers.has(x.id));
      var max=siblings.reduce((m,x)=>Math.max(m,(getPersonalPlacement(x.id,viewer,allUs)||{}).order??0),0);
      await savePersonalPlacement(draggedUid,viewer,{parentUid:dp.parentUid||viewer,leg:targetLeg,order:max+1},allUs);
    }
    renderTeamDashboard();
  }catch(e){console.warn('handleDrop error',e);alert(e.message||'Errore');}
};

window.openMemberDetail = function(uid) {
  var allUs = window._cachedUs || [];
  var allPs = window._cachedPs || [];
  var wk = window._cachedWk || (Date.now()-7*86400000);
  var m = allUs.find(function(u){return u.id===uid;});
  if(!m) return;
  var mp   = allPs.filter(function(p){return p.uid===uid;});
  var mpWk = mp.filter(function(p){
    var t = p.createdAt&&p.createdAt.toMillis ? p.createdAt.toMillis() : (p._insertedAt||0);
    return t >= wk;
  });
  var ini = (m.name||'?').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
  var colors = [
    {bg:'rgba(201,168,76,.18)',c:'var(--accent)'},
    {bg:'rgba(74,156,240,.18)',c:'var(--blue)'},
    {bg:'rgba(74,240,154,.18)',c:'var(--green)'},
    {bg:'rgba(180,74,240,.18)',c:'#b44af0'},
    {bg:'rgba(240,90,74,.18)',c:'var(--red)'},
  ];
  var col = colors[uid.charCodeAt(0)%colors.length];
  var avEl = id('md-av');
  avEl.textContent = ini;
  avEl.style.background = col.bg;
  avEl.style.color = col.c;
  id('md-name').textContent = m.name||'—';
  id('md-meta').textContent =
    (m.role==='leader'?'👑 Team Leader':'Membro')+
    (m.userNumber?' · #'+m.userNumber:'')+
    (m.leg?' · '+(_mLeg==='right'?'👉 Destra':'👈 Sinistra'):'');
  id('md-wk-new').textContent   = mpWk.length;
  id('md-wk-pres').textContent  = mpWk.filter(function(p){return p.presentation;}).length;
  id('md-wk-pay').textContent   = mp.filter(function(p){return p.payment;}).length;
  id('md-tot-pros').textContent = mp.length;
  id('md-tot-pres').textContent = mp.filter(function(p){return p.presentation;}).length;
  id('md-tot-fu').textContent   = mp.filter(function(p){return (p.followUps||[]).filter(Boolean).length===4;}).length;
  var listEl = id('md-list');
  if(!mpWk.length){
    listEl.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:.5rem 0;">Nessun prospect aggiunto questa settimana.</div>';
  } else {
    listEl.innerHTML = mpWk.slice(0,10).map(function(p){
      var t = p._insertedAt||(p.createdAt&&p.createdAt.toMillis?p.createdAt.toMillis():0);
      var days = Math.floor((Date.now()-t)/86400000);
      var badges = [
        p.presentation?'<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(74,156,240,.15);color:var(--blue);">pres.</span>':'',
        p.payment?'<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(240,180,74,.15);color:var(--amber);">pag.</span>':'',
        p.iscritto?'<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:rgba(201,168,76,.15);color:var(--gold);">iscritto</span>':'',
      ].filter(Boolean).join(' ');
      return '<div class="md-prospect-row">'+
        '<span style="font-weight:500;color:var(--text);">'+x(p.name||'—')+'</span>'+
        '<span style="display:flex;gap:4px;align-items:center;">'+
          badges+
          '<span style="font-size:11px;color:var(--text3);">'+(days===0?'oggi':days+'g fa')+'</span>'+
        '</span>'+
      '</div>';
    }).join('')+(mpWk.length>10?'<div style="font-size:11px;color:var(--text3);padding:.5rem 0;text-align:center;">+ altri '+(mpWk.length-10)+'</div>':'');
  }
  // Scroll to card and open it
  var card = id('member-detail');
  card.classList.add('open');
  card.scrollIntoView({behavior:'smooth', block:'start'});
};

window.closeMemberDetail = function() {
  id('member-detail').classList.remove('open');
};

window.toggleHideMember = function(uid) {
  if(hiddenMembers.has(uid)) hiddenMembers.delete(uid);
  else hiddenMembers.add(uid);
  try { localStorage.setItem('pm_hidden', JSON.stringify(Array.from(hiddenMembers))); } catch(e){}
  renderTeamDashboard();
};


// ══ NETWORK TREE ══
async function loadNetworkTree(){
  const ct=id('network-tree-root');
  if(ct)ct.innerHTML='<div class="loader"><div class="ld"></div><div class="ld"></div><div class="ld"></div></div>';
  const[us,ps]=await Promise.all([
    getDocs(collection(db,'users')).then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),
    getDocs(collection(db,'prospects')).then(s=>s.docs.map(d=>({id:d.id,...d.data()})))
  ]);
  window._treeUs=us; window._treePs=ps;
  const myUid=cUser.uid;
  function gd(root,all){const r=new Set();const q=[root];let s=0;while(q.length&&s<500){const c=q.shift();all.filter(u=>u.uplineUid===c).forEach(ch=>{if(!r.has(ch.id)){r.add(ch.id);q.push(ch.id);}});s++;}return r;}
  const ds=gd(myUid,us);
  const sel=id('tree-root-select');
  if(sel){const cv=sel.value;sel.innerHTML='<option value="">La mia struttura</option>'+us.filter(u=>ds.has(u.id)&&u.role==='leader').map(l=>`<option value="${l.id}"${l.id===cv?' selected':''}>${x(l.name||l.email)}</option>`).join('');}
  initTreeCanvas();
  renderNetworkTree();
}
window.reloadTree=function(){renderNetworkTree();};

var _tScale=1,_tX=0,_tY=0,_tDrag=false,_tDx=0,_tDy=0;
function applyT(){const cv=id('tree-canvas');if(cv)cv.style.transform=`translate(${_tX}px,${_tY}px) scale(${_tScale})`;}
window.treeZoom=function(f){_tScale=Math.min(Math.max(_tScale*f,.2),3);applyT();};
window.treeFit=function(){_tScale=1;_tX=0;_tY=0;applyT();};
function initTreeCanvas(){
  const w=id('tree-canvas-wrap');if(!w||w._i)return;w._i=true;_tScale=1;_tX=0;_tY=0;
  w.addEventListener('mousedown',e=>{if(e.target.closest('.nt-card'))return;_tDrag=true;_tDx=e.clientX-_tX;_tDy=e.clientY-_tY;w.style.cursor='grabbing';});
  window.addEventListener('mousemove',e=>{if(!_tDrag)return;_tX=e.clientX-_tDx;_tY=e.clientY-_tDy;applyT();});
  window.addEventListener('mouseup',()=>{_tDrag=false;if(w)w.style.cursor='grab';});
  w.addEventListener('wheel',e=>{e.preventDefault();_tScale=Math.min(Math.max(_tScale*(e.deltaY<0?1.12:.89),.2),3);applyT();},{passive:false});
}

var _dragUid=null,_popT=null;
function showPop(card,uid){
  const us=window._treeUs||[],ps=window._treePs||[];
  const u=us.find(u2=>u2.id===uid);if(!u)return;
  const mp=ps.filter(p=>p.uid===uid);
  const wk=Date.now()-7*86400000;
  if(card.querySelector('.nt-popover'))return;
  const pop=document.createElement('div');pop.className='nt-popover';
  pop.innerHTML=`<div style="font-size:12px;font-weight:600;margin-bottom:3px;">${x(u.name||u.email)}</div>
    <div style="font-size:10px;color:var(--text3);margin-bottom:.5rem;">${u.role==='leader'?'👑 Leader':'Membro'}${u.userNumber?' · #'+u.userNumber:''}</div>
    <div class="nt-popover-stats">
      <div class="nt-popover-stat"><div class="nt-popover-val" style="color:var(--gold)">${mp.length}</div><div class="nt-popover-lbl">Prospect</div></div>
      <div class="nt-popover-stat"><div class="nt-popover-val" style="color:var(--green)">${mp.filter(p=>(p.createdAt?.toMillis()||0)>=wk).length}</div><div class="nt-popover-lbl">Sett.</div></div>
      <div class="nt-popover-stat"><div class="nt-popover-val" style="color:var(--blue)">${mp.filter(p=>p.presentation).length}</div><div class="nt-popover-lbl">Pres.</div></div>
      <div class="nt-popover-stat"><div class="nt-popover-val" style="color:var(--amber)">${mp.filter(p=>p.payment).length}</div><div class="nt-popover-lbl">Pag.</div></div>
    </div>`;
  card.style.overflow='visible';card.appendChild(pop);
}
function hidePop(card){const p=card.querySelector('.nt-popover');if(p)p.remove();card.style.overflow='hidden';}

window.renderNetworkTree=function(){
  const us=window._treeUs||[],ps=window._treePs||[],viewer=cUser.uid;
  const rootUid=id('tree-root-select')?.value||viewer;
  const ct=id('network-tree-root');if(!ct)return;ct.innerHTML='';
  const hint=id('tree-drag-hint');
  const down=new Set(); const q=[viewer]; let guard=0;
  while(q.length&&guard++<1000){const p=q.shift();us.filter(u=>u.uplineUid===p).forEach(ch=>{if(!down.has(ch.id)){down.add(ch.id);q.push(ch.id);}});}
  const allowed=new Set([viewer,...down]);
  const childrenOf=(pid)=>us.filter(u=>allowed.has(u.id)&&getPersonalParent(u.id,viewer,us)===pid);
  function kids(pid,leg){return childrenOf(pid).filter(u=>getLegFor(u,viewer,us)===leg);}
  function mkCard(u,pid){
    const isL=u.role==='leader',ini=(u.name||'?').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase(),parts=(u.name||u.email||'').split(' '),fn=parts[0],ln=parts.slice(1).join('');
    const cols=[{bg:'rgba(201,168,76,.18)',c:'var(--gold)'},{bg:'rgba(91,156,246,.18)',c:'var(--blue)'},{bg:'rgba(74,222,160,.18)',c:'var(--green)'},{bg:'rgba(180,74,240,.18)',c:'#b44af0'}],col=cols[u.id.charCodeAt(0)%cols.length];
    const el=document.createElement('div');el.className='nt-card '+(isL?'leader-node':'member-node');
    el.innerHTML=`<div class="nt-av" style="background:${col.bg};color:${col.c};">${ini}</div><div class="nt-name">${x(fn)}</div>${ln?`<div class="nt-name" style="font-weight:400;color:var(--text2);font-size:10px;">${x(ln)}</div>`:''}<div class="nt-role">${isL?'👑':''} ${u.userNumber?'#'+u.userNumber:u.role==='leader'?'Leader':'Membro'}</div>`;
    el.addEventListener('mouseenter',()=>{_popT=setTimeout(()=>showPop(el,u.id),300);});el.addEventListener('mouseleave',()=>{clearTimeout(_popT);hidePop(el);});
    el.setAttribute('draggable',u.id===viewer?'false':'true');
    el.addEventListener('dragstart',e=>{if(u.id===viewer)return;_dragUid=u.id;e.dataTransfer.effectAllowed='move';setTimeout(()=>el.classList.add('dragging'),0);if(hint)hint.style.display='block';});
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');_dragUid=null;if(hint)hint.style.display='none';document.querySelectorAll('.drag-over,.drop-ready').forEach(n=>n.classList.remove('drag-over','drop-ready'));});
    el.addEventListener('dragover',e=>{if(u.id===viewer)return;e.preventDefault();el.classList.add('drag-over');});
    el.addEventListener('dragleave',()=>el.classList.remove('drag-over'));
    el.addEventListener('drop',async e=>{
      e.preventDefault();el.classList.remove('drag-over');if(!_dragUid||_dragUid===u.id)return;
      const dr=us.find(z=>z.id===_dragUid);if(!dr||!allowed.has(dr.id)||u.id===viewer)return;
      const oldP=getPersonalPlacement(dr.id,viewer,us)||{parentUid:getPersonalParent(dr.id,viewer,us),leg:getLegFor(dr,viewer,us)};
      const targetP=getPersonalPlacement(u.id,viewer,us)||{parentUid:getPersonalParent(u.id,viewer,us),leg:getLegFor(u,viewer,us)};
      try{
        await savePersonalPlacement(dr.id,viewer,{parentUid:targetP.parentUid||viewer,leg:targetP.leg,order:targetP.order??9999},us);
        await savePersonalPlacement(u.id,viewer,{parentUid:oldP.parentUid||viewer,leg:oldP.leg,order:oldP.order??9999},us);
        renderNetworkTree();
      }catch(err){alert(err.message||'Errore');}
    });
    return el;
  }
  function mkSlot(pid,leg){
    const el=document.createElement('div');el.className='nt-card open-slot';el.innerHTML=`<div style="text-align:center;"><div style="font-size:22px;opacity:.2;margin-bottom:4px;">+</div><div style="font-size:10px;color:var(--text3);">Open</div><div style="font-size:9px;color:var(--text3);margin-top:1px;">${leg==='left'?'👈':'👉'}</div></div>`;
    el.addEventListener('dragover',e=>{e.preventDefault();el.classList.add('drop-ready');});el.addEventListener('dragleave',()=>el.classList.remove('drop-ready'));
    el.addEventListener('drop',async e=>{e.preventDefault();el.classList.remove('drop-ready');if(!_dragUid)return;const dr=us.find(u=>u.id===_dragUid);if(!dr||!allowed.has(dr.id))return;try{const old=getPersonalPlacement(dr.id,viewer,us)||{};await savePersonalPlacement(dr.id,viewer,{parentUid:pid,leg,order:9999},us);renderNetworkTree();}catch(err){alert(err.message||'Errore');}});
    return el;
  }
  function vl(h){const d=document.createElement('div');d.className='nt-vline';d.style.height=(h||24)+'px';return d;}
  function build(uid,pid,depth){
    const u=us.find(z=>z.id===uid);if(!u)return null;const wrap=document.createElement('div');wrap.className='nt-wrap';wrap.appendChild(mkCard(u,pid||uid));
    if(depth>=20){const m=document.createElement('div');m.style.cssText='font-size:9px;color:var(--text3);padding:4px;text-align:center;';m.textContent='···';wrap.appendChild(m);return wrap;}
    wrap.appendChild(vl(20));const lk=kids(uid,'left'),rk=kids(uid,'right'),row=document.createElement('div');row.className='nt-row';
    const hb=document.createElement('div');hb.style.cssText='position:absolute;top:0;left:calc(60px + 1px);right:calc(60px + 1px);height:1.5px;background:var(--border2);pointer-events:none;';row.appendChild(hb);
    const lb=document.createElement('div');lb.className='nt-branch';lb.appendChild(vl(20));const ll=document.createElement('div');ll.className='nt-leg-label left';ll.textContent='👈 Sinistra';lb.appendChild(ll);if(lk.length){lk.forEach(ch=>{const s=build(ch.id,uid,depth+1);if(s)lb.appendChild(s);});}else lb.appendChild(mkSlot(uid,'left'));row.appendChild(lb);
    const rb=document.createElement('div');rb.className='nt-branch';rb.appendChild(vl(20));const rl=document.createElement('div');rl.className='nt-leg-label right';rl.textContent='👉 Destra';rb.appendChild(rl);if(rk.length){rk.forEach(ch=>{const s=build(ch.id,uid,depth+1);if(s)rb.appendChild(s);});}else rb.appendChild(mkSlot(uid,'right'));row.appendChild(rb);
    wrap.appendChild(row);return wrap;
  }
  const tree=build(rootUid,null,0);if(tree)ct.appendChild(tree);else ct.innerHTML='<div class="empty">Struttura non trovata.</div>';
  setTimeout(()=>{const w=id('tree-canvas-wrap'),cv=id('tree-canvas');if(!w||!cv)return;_tX=Math.max(40,(w.offsetWidth-cv.offsetWidth)/2);_tY=32;applyT();},150);
};

window.setLeg = async (uid, leg, btn) => {
  try {
    const viewer=cUser.uid, all=window._cachedUs||[];
    const target=all.find(u=>u.id===uid); if(!target) return;
    const direct=getDirectChildForViewer(uid,viewer,all);
    const memberId=direct?direct.id:uid;
    const current=getPersonalPlacement(memberId,viewer,all)||{parentUid:direct?.uplineUid||target.uplineUid||viewer,leg:getLegFor(target,viewer,all),order:9999};
    await savePersonalPlacement(memberId,viewer,{parentUid:current.parentUid||viewer,leg:leg||null,order:current.order??9999},all);
    renderTeamDashboard();
  } catch(e) { alert('Errore: '+e.message); }
};



window.doResetPassword = async function() {
  var email = id('l-email').value.trim();
  if(!email) {
    showErr('Inserisci prima la tua email nel campo sopra, poi clicca "Hai dimenticato la password?"');
    return;
  }
  try {
    var { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    await sendPasswordResetEmail(auth, email);
    var el = id('auth-err');
    el.style.background = 'var(--green-dim)';
    el.style.borderColor = 'var(--green)';
    el.style.color = 'var(--green)';
    el.textContent = 'Email di recupero inviata a ' + email + '. Controlla la casella di posta (anche spam).';
    el.style.display = 'block';
    setTimeout(function(){
      el.style.display='none';
      el.style.background='';
      el.style.borderColor='';
      el.style.color='';
    }, 8000);
  } catch(e) {
    showErr(errMsg(e.code) || 'Errore invio email. Verifica che l\'email sia corretta.');
  }
};

var csvHeaders = [];
var csvRows = [];
var lastImportIds = [];

function parseCSVText(text) {
  var lines = text.split('\n').filter(function(l){return l.trim();});
  function parseLine(line){
    var result=[],inQ=false,field='';
    for(var i=0;i<line.length;i++){
      var ch=line[i];
      if(ch==='"'&&!inQ){inQ=true;}
      else if(ch==='"'&&inQ){inQ=false;}
      else if(ch===','&&!inQ){result.push(field.trim().replace(/^"|"$/g,''));field='';}
      else{field+=ch;}
    }
    result.push(field.trim().replace(/^"|"$/g,''));
    return result;
  }
  var headers=parseLine(lines[0]);
  var rows=[];
  for(var i=1;i<lines.length;i++){
    var cols=parseLine(lines[i]);
    if(cols.some(function(v){return v.trim();})) rows.push(cols);
  }
  return {headers:headers,rows:rows};
}

function buildMapOptions(selId, preferredKeys) {
  var sel=id(selId);
  sel.innerHTML='<option value="-1">— Non importare —</option>';
  csvHeaders.forEach(function(h,i){
    var example=csvRows.length&&csvRows[0][i]?(' — es: '+csvRows[0][i].slice(0,25)):'';
    var opt=document.createElement('option');
    opt.value=i;
    opt.textContent=h+example;
    sel.appendChild(opt);
  });
  var best=-1;
  for(var k=0;k<preferredKeys.length;k++){
    var idx=csvHeaders.findIndex(function(h){return h.toLowerCase().indexOf(preferredKeys[k].toLowerCase())>=0;});
    if(idx>=0){best=idx;break;}
  }
  sel.value=best>=0?best:-1;
}

window.openImportModal = async function(input) {
  var file=input.files[0];
  if(!file) return;
  input.value='';
  var text=await file.text();
  var parsed=parseCSVText(text);
  csvHeaders=parsed.headers;
  csvRows=parsed.rows;
  if(!csvRows.length){alert('File CSV vuoto o non valido.');return;}
  buildMapOptions('map-name',     ['full name','full_name','nome','name']);
  buildMapOptions('map-phone',    ['phone','telefono','tel','mobile','cellulare']);
  buildMapOptions('map-location', ['isola','island','in_che','luogo','location','city']);
  buildMapOptions('map-note',     ['interest','interesse','messaggio','message','other']);
  id('import-step1').classList.remove('hidden');
  id('import-step2').classList.add('hidden');
  id('import-overlay').classList.remove('hidden');
};

window.previewImport = function() {
  var iN=parseInt(id('map-name').value);
  var iP=parseInt(id('map-phone').value);
  var iL=parseInt(id('map-location').value);
  var iNt=parseInt(id('map-note').value);
  if(iN<0){alert('Seleziona la colonna del Nome per continuare.');return;}
  var existing=new Set(prospects.map(function(p){return(p.name||'').toLowerCase().trim();}));
  var toImport=[]; var dups=0;
  csvRows.forEach(function(row){
    var name=(row[iN]||'').trim();
    if(!name) return;
    if(existing.has(name.toLowerCase())){dups++;return;}
    toImport.push({
      name:name,
      phone:iP>=0?(row[iP]||'').trim():'',
      location:iL>=0?(row[iL]||'').trim():'',
      note:iNt>=0?(row[iNt]||'').trim():''
    });
  });
  id('import-summary').innerHTML=
    '<strong>'+csvRows.length+'</strong> lead nel CSV &nbsp;&middot;&nbsp; '+
    '<strong style="color:var(--green)">'+toImport.length+'</strong> nuovi &nbsp;&middot;&nbsp; '+
    '<strong style="color:var(--text3)">'+dups+'</strong> gia presenti (saltati)';
  var thead=id('import-preview-head');
  thead.innerHTML='';
  ['Nome','Telefono','Luogo','Note'].forEach(function(h){
    var th=document.createElement('th');
    th.textContent=h;
    th.style.cssText='padding:6px 10px;text-align:left;font-size:10px;color:var(--text3);text-transform:uppercase;border-bottom:.5px solid var(--border);white-space:nowrap;';
    thead.appendChild(th);
  });
  var tbody=id('import-preview-body');
  tbody.innerHTML='';
  var preview=toImport.slice(0,15);
  preview.forEach(function(lead){
    var tr=document.createElement('tr');
    [lead.name,lead.phone,lead.location,lead.note].forEach(function(v){
      var td=document.createElement('td');
      td.textContent=v||'—';
      td.style.cssText='padding:5px 10px;border-bottom:.5px solid var(--border);color:var(--text2);font-size:12px;';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  if(toImport.length>15){
    var tr=document.createElement('tr');var td=document.createElement('td');
    td.colSpan=4;td.style.cssText='padding:6px 10px;color:var(--text3);font-size:11px;';
    td.textContent='... e altri '+(toImport.length-15)+' prospect';
    tr.appendChild(td);tbody.appendChild(tr);
  }
  if(!toImport.length){
    tbody.innerHTML='<tr><td colspan="4" style="padding:1rem;text-align:center;color:var(--text3);">Nessun nuovo prospect da importare.</td></tr>';
  }
  window._importQueue=toImport;
  id('import-step1').classList.add('hidden');
  id('import-step2').classList.remove('hidden');
};

window.backImport=function(){
  id('import-step1').classList.remove('hidden');
  id('import-step2').classList.add('hidden');
};

window.confirmImport=async function(){
  var q=window._importQueue||[];
  if(!q.length){closeImportModal();return;}
  lastImportIds=[];
  var imported=0;
  for(var j=0;j<q.length;j++){
    var lead=q[j];
    try{
      var ref=await addDoc(collection(db,'prospects'),{
        name:lead.name, phone:lead.phone, channel:'Facebook Ads',
        note:lead.location?(lead.note?lead.location+' — '+lead.note:lead.location):(lead.note||''),
        country:'',provincia:'',uid:cUser.uid,
        userName:cData?cData.name||cUser.email:cUser.email,
        presentation:false,followUps:[false,false,false,false],
        payment:false,iscritto:false,contattato:false,
        createdAt:serverTimestamp(),lastCheckAt:null,_insertedAt:Date.now()
      });
      lastImportIds.push(ref.id);
      imported++;
    }catch(e){console.warn('Import error:',lead.name,e);}
  }
  closeImportModal();
  alert(imported+' prospect importati da Facebook Ads!');
};

window.undoLastImport=async function(){
  if(!lastImportIds.length){alert('Nessuna importazione recente da annullare. Funziona solo nella stessa sessione.');return;}
  if(!confirm('Eliminare '+lastImportIds.length+' prospect dell\'ultima importazione?')) return;
  var deleted=0;
  for(var i=0;i<lastImportIds.length;i++){
    try{await deleteDoc(doc(db,'prospects',lastImportIds[i]));deleted++;}
    catch(e){console.warn(e);}
  }
  lastImportIds=[];
  alert('Eliminati '+deleted+' prospect.');
};

window.closeImportModal=function(){
  id('import-overlay').classList.add('hidden');
  window._importQueue=[];
};


// ── CSV IMPORT SYSTEM ──
var csvData = []; // parsed rows
var csvHeaders = []; // header row
var lastImportBatch = null; // for undo

window.openImportModal = function(input) {
  var file = input.files[0];
  if(!file) return;
  input.value = '';

  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    // Parse CSV
    var lines = text.split('\n').filter(function(l){return l.trim();});
    if(lines.length < 2){alert('File CSV vuoto o non valido.');return;}

    // Parse with quote handling
    function parseLine(line) {
      var res=[],inQ=false,f='';
      for(var i=0;i<line.length;i++){
        var ch=line[i];
        if(ch==='"'){inQ=!inQ;}
        else if(ch===','&&!inQ){res.push(f.trim());f='';}
        else{f+=ch;}
      }
      res.push(f.trim());
      return res;
    }

    csvHeaders = parseLine(lines[0]).map(function(h){return h.replace(/"/g,'').trim();});
    csvData = [];
    for(var i=1;i<lines.length;i++){
      var row = parseLine(lines[i]);
      if(row.every(function(c){return !c.trim();})) continue;
      csvData.push(row);
    }

    // Populate column selects
    var selects = ['col-name','col-phone','col-isola','col-note'];
    selects.forEach(function(selId){
      var sel = id(selId);
      var firstOpt = sel.options[0].outerHTML;
      sel.innerHTML = firstOpt;
      csvHeaders.forEach(function(h,i){
        var opt = document.createElement('option');
        opt.value = i;
        opt.textContent = h || ('Colonna '+i);
        sel.appendChild(opt);
      });
    });

    // Auto-detect common column names
    function autoDetect(sel, keywords) {
      for(var k=0;k<keywords.length;k++){
        for(var i=0;i<csvHeaders.length;i++){
          if(csvHeaders[i].toLowerCase().indexOf(keywords[k].toLowerCase())>=0){
            id(sel).value = i;
            return;
          }
        }
      }
    }
    autoDetect('col-name', ['full name','full_name','nome','name','nominativo']);
    autoDetect('col-phone', ['phone','telefono','tel','mobile','cell']);
    autoDetect('col-isola', ['isola','in_che_isola','island','luogo','location','city','citt']);
    autoDetect('col-note', ['note','message','messaggio','commento']);

    // Update file info
    id('csv-filename').textContent = file.name;
    id('csv-rows').textContent = csvData.length;

    // Show step 1
    id('csv-step1').classList.remove('hidden');
    id('csv-step2').classList.add('hidden');
    id('csv-back-btn').style.display = 'none';
    id('csv-import-btn').style.display = 'none';
    id('csv-overlay').classList.remove('hidden');
  };
  reader.readAsText(file, 'UTF-8');
};

window.showImportPreview = function() {
  var iName  = id('col-name').value;
  var iPhone = id('col-phone').value;
  var iIsola = id('col-isola').value;
  var iNote  = id('col-note').value;

  if(iName === ''){alert('Seleziona la colonna Nome.');return;}

  // Build preview leads
  var leads = csvData.map(function(row){
    return {
      name:  (row[iName]||'').replace(/"/g,'').trim(),
      phone: iPhone!=='' ? (row[iPhone]||'').replace(/"/g,'').trim() : '',
      isola: iIsola!=='' ? (row[iIsola]||'').replace(/"/g,'').trim() : '',
      note:  iNote!==''  ? (row[iNote]||'').replace(/"/g,'').trim() : '',
    };
  }).filter(function(l){return l.name;});

  if(!leads.length){alert('Nessun lead con nome trovato. Controlla la colonna selezionata.');return;}

  // Check duplicates
  var existingNames = new Set(prospects.map(function(p){return(p.name||'').toLowerCase();}));
  var newLeads  = leads.filter(function(l){return !existingNames.has(l.name.toLowerCase());});
  var dupLeads  = leads.filter(function(l){return  existingNames.has(l.name.toLowerCase());});

  // Build preview table (first 10 rows)
  var preview = leads.slice(0,10);
  var tableHTML = '<thead><tr><th>#</th><th>Nome</th><th>Telefono</th><th>Isola / Luogo</th><th>Note</th><th>Stato</th></tr></thead><tbody>';
  preview.forEach(function(l,i){
    var isDup = existingNames.has(l.name.toLowerCase());
    tableHTML += '<tr>' +
      '<td style="color:var(--text3);">'+(i+1)+'</td>' +
      '<td style="font-weight:500;'+(isDup?'color:var(--amber)':'')+'">'+x(l.name)+'</td>' +
      '<td>'+x(l.phone||'—')+'</td>' +
      '<td>'+x(l.isola||'—')+'</td>' +
      '<td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+x(l.note||'—')+'</td>' +
      '<td>'+(isDup?'<span style="color:var(--amber);font-size:10px;">GIA PRESENTE</span>':'<span style="color:var(--green);font-size:10px;">NUOVO</span>')+'</td>' +
    '</tr>';
  });
  if(leads.length > 10) tableHTML += '<tr><td colspan="6" style="text-align:center;color:var(--text3);font-size:11px;">... e altri '+(leads.length-10)+' lead</td></tr>';
  tableHTML += '</tbody>';
  id('csv-preview-table').innerHTML = tableHTML;

  // Summary
  id('csv-preview-info').innerHTML =
    '<strong>'+leads.length+'</strong> lead totali &nbsp;·&nbsp; '+
    '<span style="color:var(--green)"><strong>'+newLeads.length+'</strong> nuovi</span> &nbsp;·&nbsp; '+
    '<span style="color:var(--amber)"><strong>'+dupLeads.length+'</strong> già presenti (verranno saltati)</span>';

  // Dup warning
  if(dupLeads.length > 0) {
    id('csv-dup-warn').textContent = '⚠️ '+dupLeads.length+' prospect sono già presenti nella lista e verranno saltati automaticamente.';
    id('csv-dup-warn').classList.remove('hidden');
  } else {
    id('csv-dup-warn').classList.add('hidden');
  }

  // Store leads for import
  window._pendingLeads = newLeads;

  id('csv-step2').classList.remove('hidden');
  id('csv-back-btn').style.display = 'inline-flex';
  id('csv-import-btn').style.display = 'inline-flex';
};

window.backToMapping = function() {
  id('csv-step2').classList.add('hidden');
  id('csv-back-btn').style.display = 'none';
  id('csv-import-btn').style.display = 'none';
};

window.closeImportModal = function() {
  id('csv-overlay').classList.add('hidden');
  csvData = []; csvHeaders = [];
  window._pendingLeads = null;
};

window.executeImport = async function() {
  var leads = window._pendingLeads;
  if(!leads || !leads.length){alert('Nessun nuovo lead da importare.');return;}

  var btn = id('csv-import-btn');
  btn.textContent = 'Importazione...';
  btn.disabled = true;

  var batchId = 'import_'+Date.now();
  var imported = 0;
  var importedIds = [];

  for(var j=0;j<leads.length;j++){
    var lead = leads[j];
    try{
      var ref = await addDoc(collection(db,'prospects'),{
        name:lead.name, phone:lead.phone||'',
        channel:'Facebook Ads',
        note: [lead.isola?'Isola: '+lead.isola:'', lead.note].filter(Boolean).join(' — '),
        country:'', provincia:'',
        uid:cUser.uid,
        userName:cData?cData.name||cUser.email:cUser.email,
        presentation:false, followUps:[false,false,false,false],
        payment:false, iscritto:false, contattato:false,
        createdAt:serverTimestamp(), lastCheckAt:null,
        _insertedAt:Date.now(),
        _importBatch:batchId
      });
      importedIds.push(ref.id);
      imported++;
    }catch(e){console.warn('Error importing:',lead.name,e);}
  }

  lastImportBatch = {batchId:batchId, ids:importedIds, count:imported};
  closeImportModal();

  // Show undo option
  var undoDiv = document.createElement('div');
  undoDiv.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;background:var(--surface);border:.5px solid var(--border2);border-radius:10px;padding:.875rem 1.25rem;font-size:13px;display:flex;align-items:center;gap:12px;z-index:200;box-shadow:var(--shadow);';
  undoDiv.innerHTML = '✅ Importati <strong>'+imported+'</strong> prospect da Facebook Ads &nbsp;'+
    '<button onclick="undoImport()" style="padding:5px 12px;background:var(--red-dim);color:var(--red);border:.5px solid var(--red);border-radius:6px;font-size:12px;cursor:pointer;font-family:var(--font);">↩ Annulla importazione</button>';
  document.body.appendChild(undoDiv);
  setTimeout(function(){if(undoDiv.parentNode)undoDiv.parentNode.removeChild(undoDiv);}, 12000);

  btn.textContent = '✅ Importa prospect';
  btn.disabled = false;
};

window.undoImport = async function() {
  if(!lastImportBatch){alert('Nessuna importazione recente da annullare.');return;}
  if(!confirm('Eliminare i '+lastImportBatch.count+' prospect importati ora?')) return;
  var deleted = 0;
  for(var i=0;i<lastImportBatch.ids.length;i++){
    try{
      await deleteDoc(doc(db,'prospects',lastImportBatch.ids[i]));
      deleted++;
    }catch(e){console.warn('Could not delete',lastImportBatch.ids[i]);}
  }
  lastImportBatch = null;
  alert('Annullata importazione: eliminati '+deleted+' prospect.');
};


// ── BULK SELECTION ──
window.toggleSelectAll = function(cb) {
  document.querySelectorAll('.row-check').forEach(function(c){c.checked=cb.checked;});
  updateBulkBar();
};

window.updateBulkBar = function() {
  var checked = document.querySelectorAll('.row-check:checked');
  var bar = id('bulk-bar');
  var countEl = id('bulk-count');
  if(checked.length > 0) {
    bar.style.display = 'flex';
    countEl.textContent = checked.length + ' selezionat'+(checked.length===1?'o':'i');
  } else {
    bar.style.display = 'none';
  }
  // Update select-all state
  var all = document.querySelectorAll('.row-check');
  var selAll = id('select-all');
  if(selAll) {
    selAll.indeterminate = checked.length>0 && checked.length<all.length;
    selAll.checked = checked.length>0 && checked.length===all.length;
  }
};

window.clearSelection = function() {
  document.querySelectorAll('.row-check').forEach(function(c){c.checked=false;});
  var selAll = id('select-all');
  if(selAll){selAll.checked=false;selAll.indeterminate=false;}
  updateBulkBar();
};

window.selectByChannel = function(channel) {
  document.querySelectorAll('.row-check').forEach(function(cb){
    var pid = cb.value;
    var p = prospects.find(function(p){return p.id===pid;});
    if(!p) return;
    if(channel==='') {
      cb.checked = true; // select all visible
    } else {
      cb.checked = (p.channel||'')=== channel;
    }
  });
  updateBulkBar();
};

window.deleteSelected = async function() {
  var checked = Array.from(document.querySelectorAll('.row-check:checked')).map(function(c){return c.value;});
  if(!checked.length) return;
  if(!confirm('Eliminare definitivamente '+checked.length+' prospect selezionati? Azione non reversibile.')) return;
  var deleted = 0;
  for(var i=0;i<checked.length;i++){
    try{
      await deleteDoc(doc(db,'prospects',checked[i]));
      deleted++;
    }catch(e){console.warn('Could not delete',checked[i],e);}
  }
  clearSelection();
  // prospects list updates via onSnapshot automatically
  if(deleted < checked.length) {
    alert('Eliminati '+deleted+' su '+checked.length+'. Alcuni potrebbero non essere stati rimossi.');
  }
};

window.setFilter = (btn,f) => {
  pFilter=f;
  document.querySelectorAll('#view-lista .f-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on'); renderTable();
};

// ── TEAM DASHBOARD ──
async function loadTeamDashboard() {
  if(id('team-grid-left')) id('team-grid-left').innerHTML=loader();
  if(id('team-grid-right')) id('team-grid-right').innerHTML=loader();
  if(id('binary-view')) id('binary-view').innerHTML=loader();
  const [ps,us] = await Promise.all([
    getDocs(collection(db,'prospects')).then(s=>s.docs.map(d=>({id:d.id,...d.data()}))),
    getDocs(collection(db,'users')).then(s=>s.docs.map(d=>({id:d.id,...d.data()})))
  ]);
  const wk=Date.now()-7*86400000, myUid=cUser.uid;

  // Build downline by walking DOWN the tree using uplineUid links only
  // This is the only reliable method — does NOT depend on uplinePath
  function buildDownlineSet(rootUid, allUsers) {
    const result = new Set();
    const queue = [rootUid];
    let safety = 0;
    while(queue.length > 0 && safety < 500) {
      const current = queue.shift();
      const children = allUsers.filter(u => u.uplineUid === current);
      children.forEach(child => {
        if(!result.has(child.id)) {
          result.add(child.id);
          queue.push(child.id);
        }
      });
      safety++;
    }
    return result;
  }

  const downlineIds = buildDownlineSet(myUid, us);
  const allDownline = us.filter(u => downlineIds.has(u.id));
  const show = allDownline;
  const uids = new Set(show.map(m=>m.id));
  const tPs = ps.filter(p=>uids.has(p.uid));

  // Populate leader filter
  const leaders = show.filter(u=>u.role==='leader');
  const legSel = id('leg-leader-filter');
  if(legSel){
    const curVal = legSel.value;
    legSel.innerHTML='<option value="">Tutta la struttura</option>'+
      leaders.map(l=>`<option value="${l.id}"${l.id===curVal?' selected':''}>${x(l.name||l.email)}</option>`).join('');
  }

  // Global stats
  const hiddenCount = show.filter(function(u){return hiddenMembers.has(u.id);}).length;
  id('team-stats').innerHTML =
    sc('Diretti',show.filter(u=>(u.uplinePath||[]).slice(-1)[0]===myUid&&!hiddenMembers.has(u.id)).length,'ac')+
    sc('Struttura attiva',show.length-hiddenCount,'b')+
    sc('Nuovi (7gg)',tPs.filter(p=>(p.createdAt?.toMillis()||0)>=wk).length,'g')+
    sc('Presentazioni sett.',tPs.filter(p=>p.presentation&&(p.createdAt?.toMillis()||0)>=wk).length,'b')+
    sc('Attesa pag.',tPs.filter(p=>p.payment).length,'a')+
    sc('Prospect totali',tPs.length,'ac');

  renderTeamDashboard(us, ps, show, wk);
}

// ── Separate render function so filter can re-run it ──
window.renderTeamDashboard = function(usArg, psArg, showArg, wkArg) {
  // Allow calling from filter change using cached data
  const us = usArg || window._cachedUs;
  const ps = psArg || window._cachedPs;
  const show = showArg || window._cachedShow;
  const wk = wkArg || window._cachedWk;
  if(!us||!ps||!show) return;
  // Cache for filter re-render
  window._cachedUs=us; window._cachedPs=ps; window._cachedShow=show; window._cachedWk=wk;

  const myUid = cUser.uid;
  const filterLeaderId = id('leg-leader-filter')?.value || '';

  // Determine reference node for binary split
  const refUid = filterLeaderId || myUid;
  const refUser = filterLeaderId ? us.find(u=>u.id===filterLeaderId) : {id:myUid, name:'La mia struttura'};

  // Get users in each leg relative to refUid
  // A user is in "right" leg of refUid if their leg===right and refUid is their direct upline,
  // OR if any ancestor between them and refUid has leg===right from refUid
  function getLegForUser(u) {
    const path = u.uplinePath||[];
    const refIdx = path.indexOf(refUid);
    if(refIdx === -1 && u.uplineUid !== refUid) return null;
    // Get the direct child of refUid in this user's ancestry chain
    if(u.uplineUid === refUid) return getLegFor(u, refUid);
    const directChildIdx = refIdx + 1;
    if(directChildIdx >= path.length) return getLegFor(u, refUid);
    const directChildId = path[directChildIdx];
    const directChild = (window._cachedUs||[]).find(a=>a.id===directChildId);
    return directChild ? getLegFor(directChild, refUid) : null;
  }

  const rightMembers = show.filter(u=>getLegForUser(u)==='right');
  const leftMembers  = show.filter(u=>getLegForUser(u)==='left');
  const noLeg        = show.filter(u=>!getLegForUser(u));

  function legStats(members) {
    const mUids = new Set(members.map(m=>m.id));
    const mPs = ps.filter(p=>mUids.has(p.uid));
    return {
      members: members.length,
      prospects: mPs.length,
      presentations: mPs.filter(p=>p.presentation).length,
      payment: mPs.filter(p=>p.payment).length,
      fu4: mPs.filter(p=>(p.followUps||[]).filter(Boolean).length===4).length,
      newWk: mPs.filter(p=>(p.createdAt?.toMillis()||0)>=(wk||Date.now()-7*86400000)).length,
    };
  }

  const rStats = legStats(rightMembers);
  const lStats = legStats(leftMembers);
  const total = Math.max(rStats.prospects + lStats.prospects, 1);

  function legCard(side, stats, members) {
    const isRight = side==='right';
    const color = isRight ? 'var(--accent)' : 'var(--blue)';
    const colorDim = isRight ? 'var(--accent-dim)' : 'var(--blue-dim)';
    const label = isRight ? '👉 GAMBA DESTRA' : '👈 GAMBA SINISTRA';
    const pct = Math.round((stats.prospects/total)*100);
    const leaders = members.filter(m=>m.role==='leader');
    const topMembers = members.slice(0,8);
    return `<div class="leg-card ${side}">
      <div class="leg-title" style="color:${color}">${label}</div>
      <div class="leg-sub">${stats.members} persone · ${pct}% dei prospect totali</div>
      <div class="leg-stats">
        <div class="leg-stat"><div class="leg-stat-val" style="color:${color}">${stats.prospects}</div><div class="leg-stat-lbl">Prospect totali</div></div>
        <div class="leg-stat"><div class="leg-stat-val" style="color:var(--green)">${stats.newWk}</div><div class="leg-stat-lbl">Nuovi (7gg)</div></div>
        <div class="leg-stat"><div class="leg-stat-val" style="color:var(--blue)">${stats.presentations}</div><div class="leg-stat-lbl">Presentazioni</div></div>
        <div class="leg-stat"><div class="leg-stat-val" style="color:var(--amber)">${stats.payment}</div><div class="leg-stat-lbl">Attesa pag.</div></div>
      </div>
      <div class="leg-bar-wrap"><div class="leg-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      <div style="font-size:11px;color:var(--text3);margin-top:8px;margin-bottom:4px;">Leader in questa gamba (${leaders.length})</div>
      <div class="leg-members">
        ${leaders.map(m=>`<span class="leg-member-tag leader-tag">👑 ${x(m.name||m.email)}${m.userNumber?` #${m.userNumber}`:''}</span>`).join('')||'<span style="font-size:11px;color:var(--text3);">Nessun leader</span>'}
      </div>
      <div style="font-size:11px;color:var(--text3);margin-top:8px;margin-bottom:4px;">Membri (${stats.members})</div>
      <div class="leg-members">
        ${topMembers.map(m=>{const num=m.userNumber?' #'+m.userNumber:'';return '<span class="leg-member-tag">'+x(m.name||m.email)+num+'</span>';}).join('')}
        ${members.length>8?`<span class="leg-member-tag" style="color:var(--text3)">+${members.length-8} altri</span>`:''}
        ${members.length===0?'<span style="font-size:11px;color:var(--text3);">Nessun membro assegnato</span>':''}
      </div>
    </div>`;
  }

  // Render left leg first (left column), right leg second (right column)
  id('binary-view').innerHTML =
    legCard('left',  lStats, leftMembers) +
    legCard('right', rStats, rightMembers);

  // If there are unassigned members show a note
  const existingNote = id('no-leg-note');
  if(noLeg.length>0){
    const note = existingNote || document.createElement('div');
    note.id='no-leg-note';
    note.style.cssText='font-size:12px;color:var(--amber);background:var(--amber-dim);border:.5px solid var(--amber-dim);border-radius:8px;padding:8px 12px;margin-bottom:1rem;';
    note.textContent=`⚠️ ${noLeg.length} ${noLeg.length===1?'membro non ha':'membri non hanno'} ancora una gamba assegnata. Vai nel pannello Admin per assegnarla.`;
    if(!existingNote) id('binary-view').insertAdjacentElement('afterend', note);
  } else if(existingNote) existingNote.remove();

  // Members grid
  const COLS=[{bg:'rgba(201,168,76,.12)',c:'#c9a84c'},{bg:'rgba(74,156,240,.12)',c:'#4a9cf0'},{bg:'rgba(74,240,154,.12)',c:'#4af09a'},{bg:'rgba(240,180,74,.12)',c:'#f0b44a'},{bg:'rgba(240,90,74,.12)',c:'#f05a4a'},{bg:'rgba(180,74,240,.12)',c:'#b44af0'}];
  const directUids=new Set(show.filter(u=>(u.uplinePath||[]).slice(-1)[0]===myUid).map(u=>u.id));
  const getLevel=u=>{const path=u.uplinePath||[];const myIdx=path.indexOf(myUid);return myIdx===-1?99:path.length-myIdx;};
  const sorted_show=[...show].sort((a,b)=>{const la=getLevel(a),lb=getLevel(b);if(la!==lb)return la-lb;return(a.name||'').localeCompare(b.name||'');});
  // Exclude hidden members from grid — they appear only in "Membri disattivati" section
  const visibleForGrid = sorted_show.filter(function(u){ return !hiddenMembers.has(u.id); });
  const mdata=visibleForGrid.map((m,i)=>({m,level:getLevel(m),mp:ps.filter(p=>p.uid===m.id),mpWk:ps.filter(p=>p.uid===m.id&&(p.createdAt?.toMillis()||0)>=(wk||Date.now()-7*86400000)),c:COLS[i%COLS.length]}));
  // Split mdata by leg
  const _myUid = cUser.uid;
  const mdLeft  = mdata.filter(d => getLegFor(d.m, _myUid) === 'left');
  const mdRight = mdata.filter(d => getLegFor(d.m, _myUid) === 'right');
  const mdNone  = mdata.filter(d => !getLegFor(d.m, _myUid));

  // Update counts




  function renderGrid(gridId, data, emptyMsg) {
    const grid = id(gridId);
    if(!grid) return;
    grid.innerHTML = '';
    if(!data.length) {
      grid.innerHTML = '<div style="padding:.75rem 0;font-size:12px;color:var(--text3);">'+(emptyMsg||'Nessun membro.')+'</div>';
      return;
    }
    // Sort by legOrder if set, then by name
    const sorted = [...data].sort((a,b)=>{
      const oa = a.m.legOrder ?? 9999, ob = b.m.legOrder ?? 9999;
      if(oa !== ob) return oa - ob;
      return (a.m.name||'').localeCompare(b.m.name||'');
    });
    sorted.forEach(({m,level,mp,mpWk,c})=>{
    const ini=m.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const levelLabel=level===1?'Diretto':level===2?'Livello 2':`Livello ${level}`;
    const levelColor=level===1?'var(--accent)':level===2?'var(--blue)':'var(--text3)';
    const roleIcon=m.role==='leader'?'👑 ':'';
    const _mLeg = getLegFor(m, cUser.uid);
    const legTag=_mLeg?`<span style="font-size:10px;padding:1px 5px;border-radius:8px;margin-left:4px;background:${_mLeg==='right'?'var(--accent-dim)':'var(--blue-dim)'};color:${_mLeg==='right'?'var(--accent)':'var(--blue)'};">${_mLeg==='right'?'👉':'👈'}</span>`:'';
    const el=document.createElement('div'); el.className='tc';
    el.innerHTML=`<div class="tc-head" style="cursor:pointer;" onclick="openMemberDetail('${m.id}')"><div class="tc-av" style="background:${c.bg};color:${c.c}">${ini}</div><div><div class="tc-name">${roleIcon}${x(m.name)}${legTag}</div><div class="tc-role">${mp.length} prospect · <span style="color:${levelColor}">${levelLabel}</span></div></div>${mpWk.length?`<div class="wk-tag">+${mpWk.length} sett.</div>`:''}</div><div class="tc-nums"><div class="tc-num"><div class="tc-num-val" style="color:${c.c}">${mp.filter(p=>p.presentation).length}</div><div class="tc-num-lbl">Presentazioni</div></div><div class="tc-num"><div class="tc-num-val" style="color:var(--amber)">${mp.filter(p=>p.payment).length}</div><div class="tc-num-lbl">Attesa pag.</div></div><div class="tc-num"><div class="tc-num-val" style="color:var(--green)">${mp.filter(p=>(p.followUps||[]).filter(Boolean).length===4).length}</div><div class="tc-num-lbl">FU completi</div></div></div><div style="margin-top:10px;padding-top:10px;border-top:.5px solid var(--border);display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><span style="font-size:11px;color:var(--text3);">Gamba:</span><button onclick="event.stopPropagation();setLeg('${m.id}','right',this)" style="padding:3px 10px;border-radius:20px;border:.5px solid ${_mLeg==='right'?'var(--accent)':'var(--border2)'};background:${_mLeg==='right'?'var(--accent-dim)':'transparent'};color:${_mLeg==='right'?'var(--accent)':'var(--text2)'};font-size:11px;cursor:pointer;font-family:var(--font);">👉 Destra</button><button onclick="event.stopPropagation();setLeg('${m.id}','left',this)" style="padding:3px 10px;border-radius:20px;border:.5px solid ${_mLeg==='left'?'var(--blue)':'var(--border2)'};background:${_mLeg==='left'?'var(--blue-dim)':'transparent'};color:${_mLeg==='left'?'var(--blue)':'var(--text2)'};font-size:11px;cursor:pointer;font-family:var(--font);">👈 Sinistra</button>${_mLeg?`<button onclick="event.stopPropagation();setLeg('${m.id}','',this)" style="padding:3px 8px;border-radius:20px;border:.5px solid var(--border);background:transparent;color:var(--text3);font-size:10px;cursor:pointer;font-family:var(--font);">✕</button>`:''}<span class="tc-drag-handle" draggable="false" title="Trascina per riordinare">⠿</span><div class="tc-move-btns"><button class="tc-move-btn" onclick="event.stopPropagation();moveMember('${m.id}','up')" title="Sposta su">↑</button><button class="tc-move-btn" onclick="event.stopPropagation();moveMember('${m.id}','down')" title="Sposta giù">↓</button></div><button onclick="event.stopPropagation();toggleHideMember('${m.id}')" style="padding:3px 10px;border-radius:20px;border:.5px solid var(--border2);background:transparent;color:var(--text3);font-size:10px;cursor:pointer;font-family:var(--font);">🙈 Nascondi</button></div>`;
      // Drag & drop
      el.setAttribute('draggable','true');
      el.dataset.uid = m.id;
      el.dataset.gridId = gridId;
      el.addEventListener('dragstart', function(e){
        e.dataTransfer.setData('text/plain', m.id+'|'+gridId);
        e.dataTransfer.effectAllowed='move';
        setTimeout(()=>el.classList.add('dragging'),0);
      });
      el.addEventListener('dragend', function(){el.classList.remove('dragging');});
      el.addEventListener('dragover', function(e){
        e.preventDefault(); e.dataTransfer.dropEffect='move';
        el.classList.add('drag-over');
      });
      el.addEventListener('dragleave', function(){el.classList.remove('drag-over');});
      el.addEventListener('drop', function(e){
        e.preventDefault(); el.classList.remove('drag-over');
        var payload = e.dataTransfer.getData('text/plain').split('|');
        var draggedUid = payload[0], fromGridId = payload[1];
        var targetUid = m.id;
        if(draggedUid === targetUid) return;
        handleDrop(draggedUid, targetUid, fromGridId, gridId);
      });
      grid.appendChild(el);
    });
  }

  renderGrid('team-grid-left',  mdLeft,  'Nessun membro nella gamba sinistra.');
  renderGrid('team-grid-right', mdRight, 'Nessun membro nella gamba destra.');
  renderGrid('team-grid-none',  mdNone);
  // Show/hide unassigned + update counts
  var noneSection = id('grid-none-section');
  if(noneSection) noneSection.style.display = mdNone.length ? 'block' : 'none';
  var noneCount = id('grid-none-count');
  if(noneCount) noneCount.textContent = mdNone.length + (mdNone.length===1?' membro':' membri');
  var lc = id('grid-left-count');  if(lc) lc.textContent = mdLeft.length + (mdLeft.length===1?' membro':' membri');
  var rc = id('grid-right-count'); if(rc) rc.textContent = mdRight.length + (mdRight.length===1?' membro':' membri');

  const rankSorted=[...mdata].sort((a,b)=>b.mpWk.length-a.mpWk.length);
  const max=Math.max(...rankSorted.map(s=>s.mpWk.length),1);
  id('rank-table').innerHTML=rankSorted.length?rankSorted.map(({m,mpWk},i)=>`<div class="rank-row"><div class="rank-pos ${i===0?'top':''}">${i===0?'★':i+1}</div><div class="rank-name">${x(m.name)}</div><div class="rank-bar-wrap"><div class="rank-bar" style="width:${(mpWk.length/max)*100}%"></div></div><div class="rank-val">${mpWk.length}</div></div>`).join(''):'';
  // Hidden members panel
  var hiddenList = show.filter(function(u){return hiddenMembers.has(u.id);});
  var hSection = id('hidden-members-section');
  if(hSection) {
    if(hiddenList.length > 0) {
      hSection.style.display = 'block';
      id('hidden-count-badge').textContent = hiddenList.length + (hiddenList.length===1?' membro':' membri');
      id('hidden-members-grid').innerHTML = hiddenList.map(function(m){
        var mp = ps.filter(function(p){return p.uid===m.id;});
        return '<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border:.5px solid var(--border);border-radius:10px;padding:.75rem 1rem;">'+
          '<div style="width:32px;height:32px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:var(--text3);flex-shrink:0;">'+
            (m.name||'?').split(' ').map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase()+
          '</div>'+
          '<div style="flex:1;min-width:0;">'+
            '<div style="font-size:13px;font-weight:500;color:var(--text2);">'+x(m.name||'—')+'</div>'+
            '<div style="font-size:11px;color:var(--text3);">'+(m.role==='leader'?'Leader':'Membro')+(m.userNumber?' · #'+m.userNumber:'')+' · '+mp.length+' prospect</div>'+
          '</div>'+
          '<button onclick="toggleHideMember(\'"+m.id+"\')" style="padding:5px 12px;border-radius:6px;background:var(--green-dim);border:.5px solid var(--green);color:var(--green);font-size:12px;font-weight:500;cursor:pointer;font-family:var(--font);">Riattiva</button>'+
        '</div>';
      }).join('');
    } else {
      hSection.style.display = 'none';
    }
  }
}



// ── ADMIN ──
window.verifyAdmin = () => {
  const code=id('al-code').value;
  if(code!==ADMIN_CODE){id('al-err').textContent='Codice non valido.';id('al-err').style.display='block';return;}
  adminUnlocked=true;
  id('al-overlay').classList.add('hidden');
  doSwitchTab('admin');
  loadAdminPanel();
};
window.closeAdminLogin = () => id('al-overlay').classList.add('hidden');

async function loadAdminPanel() {
  const [uSnap,pSnap]=await Promise.all([getDocs(collection(db,'users')),getDocs(collection(db,'prospects'))]);
  allUsers=uSnap.docs.map(d=>({id:d.id,...d.data()}));
  allProspects=pSnap.docs.map(d=>({id:d.id,...d.data()}));
  const leaders=allUsers.filter(u=>u.role==='leader').length;
  const members=allUsers.filter(u=>u.role==='member'||!u.role).length;
  const orphans=allUsers.filter(u=>!u.uplineUid).length;
  id('admin-stats').innerHTML=
    sc('Utenti totali',allUsers.length,'ac')+sc('Leader',leaders,'g')+
    sc('Membri',members,'b')+sc('Senza upline',orphans,'a')+sc('Prospect totali',allProspects.length,'ac');
  renderAdminTable();
  renderTree();
  runDiagnostics();
}

function runDiagnostics() {
  var diag = id('admin-diag');
  if(!diag) return;
  var issues = [];

  var emailMap = {};
  allUsers.forEach(function(u) {
    var em = (u.email||'').toLowerCase().trim();
    if(!em) return;
    if(!emailMap[em]) emailMap[em] = [];
    emailMap[em].push(u);
  });
  var dupEmails = Object.entries(emailMap).filter(function(e){return e[1].length > 1;});

  if(dupEmails.length > 0) {
    var rows = dupEmails.map(function(entry) {
      var email = entry[0]; var us = entry[1];
      return '<span style="color:var(--red);font-size:11px;">'+email+'</span> &mdash; '+
        us.map(function(u){
          return '<span style="background:var(--surface2);padding:1px 6px;border-radius:4px;font-size:11px;">'+
            (u.name||'?')+' #'+(u.userNumber||'?')+
            ' <span style="color:var(--text3);font-size:9px;">['+u.id.slice(0,8)+']</span></span>';
        }).join(' + ');
    }).join('<br>');
    issues.push(
      '<strong style="color:var(--red)">Email duplicate in Firestore ('+dupEmails.length+'):</strong><br>'+rows+
      '<br><div style="margin-top:8px;">'+
      '<button onclick="autoFixDuplicates()" style="padding:6px 14px;background:var(--red);border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">'+
      '&#128295; Risolvi automaticamente</button>'+
      ' <span style="font-size:11px;color:var(--text3);">Mantiene il profilo piu completo</span></div>'
    );
  }

  var ghosts = allUsers.filter(function(u){return !u.role && !u.userNumber;});
  if(ghosts.length > 0) {
    issues.push('<strong style="color:var(--amber)">Account senza ruolo ne ID ('+ghosts.length+'):</strong><br>'+
      ghosts.map(function(u){
        return '<span style="font-size:11px;">'+(u.name||'?')+' &mdash; '+(u.email||'?')+
          ' <span style="color:var(--text3);font-size:9px;">['+u.id+']</span></span>';
      }).join('<br>')
    );
  }

  if(issues.length > 0) {
    diag.innerHTML = issues.join('<br><br>')+
      '<br><br><span style="font-size:11px;color:var(--text3);">La pulizia automatica rimuove i documenti Firestore duplicati. Gli account Firebase Auth vanno eliminati da Firebase Console.</span>';
    diag.style.display = 'block';
  } else {
    diag.innerHTML = '<span style="color:var(--green);">&#10003; Nessun problema rilevato.</span>';
    diag.style.display = 'block';
    setTimeout(function(){if(diag)diag.style.display='none';}, 3000);
  }
}

window.autoFixDuplicates = async function() {
  var emailMap = {};
  allUsers.forEach(function(u){
    var em = (u.email||'').toLowerCase().trim();
    if(!em) return;
    if(!emailMap[em]) emailMap[em] = [];
    emailMap[em].push(u);
  });
  var dupGroups = Object.entries(emailMap).filter(function(e){return e[1].length>1;});
  if(!dupGroups.length){alert('Nessun duplicato trovato.');return;}
  var totalDups = dupGroups.reduce(function(acc,e){return acc+e[1].length-1;},0);
  if(!confirm('Verranno rimossi '+totalDups+' profili duplicati da Firestore. Continuare?')) return;
  var deleted = 0;
  for(var gi=0;gi<dupGroups.length;gi++){
    var users = dupGroups[gi][1];
    var scored = users.map(function(u){return {u:u,score:
      (u.role==='leader'?1000:0)+
      (u.userNumber?500:0)+
      (u.uplineUid?100:0)+
      ((u.uplinePath||[]).length*10)+
      (u.role==='member'?50:0)
    };});
    scored.sort(function(a,b){return b.score-a.score;});
    var toRemove = scored.slice(1).map(function(s){return s.u;});
    for(var ri=0;ri<toRemove.length;ri++){
      var dup = toRemove[ri];
      try{
        await deleteDoc(doc(db,'users',dup.id));
        await setDoc(doc(db,'deleted_users',dup.id),{deletedAt:serverTimestamp(),deletedBy:cUser.uid,email:dup.email||'',name:dup.name||'',reason:'auto-fix'});
        allUsers = allUsers.filter(function(u){return u.id!==dup.id;});
        deleted++;
      }catch(e){console.warn('Could not delete',dup.id,e);}
    }
  }
  renderAdminTable();renderTree();runDiagnostics();
  alert('Rimossi '+deleted+' duplicati Firestore. Vai su Firebase Console > Authentication > Users per eliminare gli account Auth orfani.');
};

window.setAdminFilter=(btn,f)=>{
  aFilter=f;
  document.querySelectorAll('#view-admin .f-btn').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on'); renderAdminTable();
};

window.renderAdminTable=()=>{
  const q=(id('a-search')?.value||'').toLowerCase();
  const users=allUsers.filter(u=>{
    const m=(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q);
    if(aFilter==='leader') return m&&u.role==='leader';
    if(aFilter==='member') return m&&(u.role==='member'||!u.role);
    if(aFilter==='orphan') return m&&!u.uplineUid;
    return m;
  });
  const tb=id('a-tbody');
  if(!users.length){tb.innerHTML='<tr><td colspan="6"><div class="empty">Nessun utente trovato</div></td></tr>';return;}
  tb.innerHTML=users.map(u=>{
    const up=u.uplineUid?allUsers.find(a=>a.id===u.uplineUid):null;
    const pCount=allProspects.filter(p=>p.uid===u.id).length;
    const reg=u.createdAt?.toDate?u.createdAt.toDate().toLocaleDateString('it-IT'):'—';
    const role=u.role||'member';
    const ini=(u.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const idBadge=u.userNumber
      ? `<span style="font-family:monospace;font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:4px;border:.5px solid var(--accent);margin-left:5px;">#${u.userNumber}</span>`
      : '<span style="font-size:10px;color:var(--text3);margin-left:4px;">no ID</span>';
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px;">
        <div style="width:26px;height:26px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;">${ini}</div>
        <div><div class="nm" style="display:flex;align-items:center;">${x(u.name||'—')}${idBadge}</div><div class="note">${x(u.email||'')}</div></div></div></td>
      <td><span class="admin-badge ${role}">${role==='leader'?'Leader':'Membro'}</span>${u.leg?`<span style="font-size:10px;margin-left:4px;padding:2px 6px;border-radius:10px;background:${u.leg==='right'?'var(--accent-dim)':'var(--blue-dim)'};color:${u.leg==='right'?'var(--accent)':'var(--blue)'};border:.5px solid ${u.leg==='right'?'var(--accent)':'var(--blue)'};">${u.leg==='right'?'👉 Destra':'👈 Sinistra'}</span>`:''}</td>
      <td><span style="font-size:12px;color:var(--text2);">${up?x(up.name):'<span style="color:var(--text3)">—</span>'}</span></td>
      <td><span style="font-family:\'DM Mono\',monospace;font-size:12px;">${pCount}</span></td>
      <td><span style="font-size:12px;color:var(--text2);">${reg}</span></td>
      <td><button class="act-btn" onclick="openEditUser('${u.id}')">Modifica</button></td>
    </tr>`;
  }).join('');
};

function renderTree() {
  const roots=allUsers.filter(u=>!u.uplineUid);
  function node(u,depth){
    const ch=allUsers.filter(a=>a.uplineUid===u.id);
    const pc=allProspects.filter(p=>p.uid===u.id).length;
    const icon=depth===0?'🌐':ch.length?'📂':'👤';
    const roleIcon=u.role==='leader'?'👑 Leader':'Membro';
    const idTag=u.userNumber
      ? `<span style="font-family:monospace;font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 5px;border-radius:4px;border:.5px solid var(--accent);margin-left:4px;">#${u.userNumber}</span>`
      : `<span style="font-family:monospace;font-size:10px;color:var(--text3);padding:1px 5px;">no ID</span>`;
    const legTag=u.leg?`<span style="font-size:10px;padding:1px 5px;border-radius:10px;margin-left:3px;background:${u.leg==='right'?'var(--accent-dim)':'var(--blue-dim)'};color:${u.leg==='right'?'var(--accent)':'var(--blue)'};">${u.leg==='right'?'👉':'👈'}</span>`:'';
    let h=`<div class="tree-item"><span>${icon}</span><span class="tree-lbl">${x(u.name||'—')}</span>${idTag}${legTag}<span class="tree-meta">${roleIcon} · ${pc} prospect</span></div>`;
    if(ch.length) h+=`<div class="tree-node">${ch.map(c=>node(c,depth+1)).join('')}</div>`;
    return h;
  }
  id('net-tree').innerHTML=roots.length?roots.map(r=>node(r,0)).join(''):'<div class="empty">Nessun utente registrato</div>';
}

window.openEditUser=async uid=>{
  const u=allUsers.find(a=>a.id===uid); if(!u) return;
  editingUid=uid;
  id('eu-name').textContent=u.name||'—';
  id('eu-email').textContent=u.email||'—';
  id('eu-role').value=u.role||'member';
  id('eu-err').style.display='none';
  id('eu-uid').textContent = 'Firebase UID: ' + u.id;
  id('eu-leg').value = u.leg||'';
  const sel=id('eu-upline');
  sel.innerHTML='<option value="">— Nessun upline (top level) —</option>';
  allUsers.filter(a=>a.id!==uid&&!(a.uplinePath||[]).includes(uid))
    .sort((a,b)=>(a.name||'').localeCompare(b.name||''))
    .forEach(a=>{
      const o=document.createElement('option');
      o.value=a.id; o.textContent=`${a.name||a.email} (${a.role==='leader'?'Leader':'Membro'})`;
      if(a.id===u.uplineUid) o.selected=true;
      sel.appendChild(o);
    });
  id('eu-overlay').classList.remove('hidden');
};
window.closeEditUser=()=>{id('eu-overlay').classList.add('hidden');editingUid=null;};

window.assignAllIds=async()=>{
  const usersWithoutId=allUsers.filter(u=>!u.userNumber);
  if(!usersWithoutId.length){alert('Tutti gli utenti hanno già un ID assegnato.');return;}
  if(!confirm('Assegnare un ID numerico a '+usersWithoutId.length+' utenti che ne sono privi?')) return;
  const maxNum=Math.max(0,...allUsers.map(u=>u.userNumber||0));
  let counter=maxNum;
  let updated=0;
  for(const u of usersWithoutId){
    counter++;
    try{
      await updateDoc(doc(db,'users',u.id),{userNumber:counter});
      updated++;
    }catch(e){console.warn('Could not update',u.id,e);}
  }
  // Reload all users fresh from Firestore to show updated IDs
  const uSnap=await getDocs(collection(db,'users'));
  allUsers=uSnap.docs.map(d=>({id:d.id,...d.data()}));
  renderAdminTable();
  renderTree();
  alert('ID assegnati a '+updated+' utenti. Tabella aggiornata.');
};
window.saveEditUser=async()=>{
  if(!editingUid) return;
  const role=id('eu-role').value, uplineUid=id('eu-upline').value||null, leg=id('eu-leg').value||null;
  try{
    let uplinePath=[];
    if(uplineUid){const up=allUsers.find(a=>a.id===uplineUid);uplinePath=[...(up?.uplinePath||[]),uplineUid];}
    await updateDoc(doc(db,'users',editingUid),{role,uplineUid,uplinePath,leg:leg||null});
    const i=allUsers.findIndex(a=>a.id===editingUid);
    if(i>=0) allUsers[i]={...allUsers[i],role,uplineUid,uplinePath,leg:leg||null};
    closeEditUser(); renderAdminTable(); renderTree();
    id('admin-stats').innerHTML=
      sc('Utenti totali',allUsers.length,'ac')+sc('Leader',allUsers.filter(u=>u.role==='leader').length,'g')+
      sc('Membri',allUsers.filter(u=>u.role==='member'||!u.role).length,'b')+sc('Senza upline',allUsers.filter(u=>!u.uplineUid).length,'a')+sc('Prospect totali',allProspects.length,'ac');
  }catch(e){id('eu-err').textContent='Errore: '+e.message;id('eu-err').style.display='block';}
};
window.deleteUser=async()=>{
  if(!editingUid) return;
  const u=allUsers.find(a=>a.id===editingUid);
  if(!confirm(`Eliminare definitivamente ${u?.name||'questo utente'}?\n\nQuesto eliminerà:\n- Il profilo utente\n- L'account di accesso\n\nI prospect rimarranno nel database.`)) return;
  const errEl=id('eu-err');
  errEl.style.display='none';
  try{
    // 1. Delete Firestore user doc
    await deleteDoc(doc(db,'users',editingUid));
    // 2. Delete Firebase Auth account using current user's token + Firebase REST API
    // Note: Firebase only allows deleting own account client-side.
    // We delete the Firestore record (blocks access) and mark as deleted.
    // For full Auth deletion, mark in Firestore and handle on next login attempt.
    await setDoc(doc(db,'deleted_users',editingUid),{
      deletedAt: serverTimestamp(),
      deletedBy: cUser.uid,
      email: u?.email||'',
      name: u?.name||''
    });
    allUsers=allUsers.filter(a=>a.id!==editingUid);
    closeEditUser(); renderAdminTable(); renderTree();
    id('admin-stats').innerHTML=
      sc('Utenti totali',allUsers.length,'ac')+
      sc('Leader',allUsers.filter(u=>u.role==='leader').length,'g')+
      sc('Membri',allUsers.filter(u=>u.role==='member'||!u.role).length,'b')+
      sc('Senza upline',allUsers.filter(u=>!u.uplineUid).length,'a')+
      sc('Prospect totali',allProspects.length,'ac');
    alert('Utente eliminato. L\'account non potrà più accedere all\'app.');
  }catch(e){
    errEl.textContent='Errore: '+e.message;
    errEl.style.display='block';
  }
};

// ── SETTINGS ──
window.openSettings=async()=>{
  // Step 1: Re-fetch fresh data by UID
  try {
    const freshSnap = await getDoc(doc(db,'users',cUser.uid));
    if(freshSnap.exists()) cData = freshSnap.data();
  } catch(e) { console.warn('Could not refresh user data:', e); }

  // Step 2: If still showing as member, search ALL users by email
  // This handles the case where admin updated a different UID document
  if((cData?.role||'member') === 'member' && cUser?.email) {
    try {
      const emailQuery = await getDocs(query(
        collection(db,'users'),
        where('email','==',cUser.email.toLowerCase())
      ));
      const leaderDoc = emailQuery.docs.find(d => d.data().role === 'leader');
      if(leaderDoc && leaderDoc.id !== cUser.uid) {
        // Found a leader doc with same email but different UID
        // Copy the leader role to the current UID's doc
        const leaderData = leaderDoc.data();
        await setDoc(doc(db,'users',cUser.uid), {
          ...leaderData,
          // Keep current UID's connection data if it exists
          uplineUid: cData?.uplineUid || leaderData.uplineUid || null,
          uplinePath: cData?.uplinePath || leaderData.uplinePath || [],
        }, {merge:true});
        const recheckSnap = await getDoc(doc(db,'users',cUser.uid));
        if(recheckSnap.exists()) cData = recheckSnap.data();
        console.log('Synced leader role from email match');
      }
    } catch(e) { console.warn('Email sync check failed:', e); }
  }

  const role=cData?.role||'member';
  id('s-name').textContent=cData?.name||'—';
  id('s-email').textContent=cUser?.email||'—';
  const myNum=cData?.userNumber?` <span style="font-family:monospace;font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:4px;">#${cData.userNumber}</span>`:'';
  id('s-role-badge').innerHTML=(role==='leader'?'<span class="pill done">Team Leader</span>':'<span class="pill nuovo">Membro</span>')+myNum;
  // Update tab visibility based on fresh data
  if(role==='leader') id('tab-team').classList.remove('hidden');
  id('tab-tree').classList.remove('hidden');
  id('s-upgrade').classList.toggle('hidden',role==='leader');
  id('s-already-leader').classList.toggle('hidden',role!=='leader');
  id('s-invite').classList.toggle('hidden',role!=='leader');
  id('s-upgrade-err').style.display='none';
  id('s-lcode').value='';
  if(role==='leader') await genInviteLink();
  id('s-overlay').classList.remove('hidden');
};
window.closeSettings=()=>id('s-overlay').classList.add('hidden');

window.reloadSession=async()=>{
  try{
    const snap=await getDoc(doc(db,'users',cUser.uid));
    if(snap.exists()){
      cData=snap.data();
      // Update UI based on fresh data
      const ini=(cData.name||'?').split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase();
      id('u-av').textContent=ini;
      id('u-nm').textContent=cData.name||cUser.email;
      if(cData.role==='leader') id('tab-team').classList.remove('hidden');
  id('tab-tree').classList.remove('hidden');
      closeSettings();
      // Re-open settings with fresh data
      await openSettings();
    }
  }catch(e){alert('Errore ricarica: '+e.message);}
};

window.doUpgrade=async()=>{
  const code=id('s-lcode').value.trim(), errEl=id('s-upgrade-err');
  if(!code){errEl.textContent='Inserisci il codice';errEl.style.display='block';return;}
  if(code!==LEADER_CODE){
    errEl.textContent='Codice errato. Assicurati di scrivere: RYOUNG';
    errEl.style.display='block';return;
  }
  errEl.style.display='none';
  const saveBtn = document.querySelector('#s-upgrade .btn-primary');
  if(saveBtn) saveBtn.textContent='Aggiornamento...';
  try{
    // Update Firestore
    await setDoc(doc(db,'users',cUser.uid),{role:'leader'},{merge:true});
    // Re-fetch to confirm
    const snap = await getDoc(doc(db,'users',cUser.uid));
    if(snap.exists()) cData = snap.data();
    // Update UI
    id('tab-team').classList.remove('hidden');
  id('tab-tree').classList.remove('hidden');
    id('s-upgrade').classList.add('hidden');
    id('s-already-leader').classList.remove('hidden');
    id('s-invite').classList.remove('hidden');
    const myNum = cData?.userNumber
      ? ' <span style="font-family:monospace;font-size:10px;color:var(--accent);background:var(--accent-dim);padding:1px 6px;border-radius:4px;">#'+cData.userNumber+'</span>'
      : '';
    id('s-role-badge').innerHTML='<span class="pill done">Team Leader</span>'+myNum;
    await genInviteLink();
  }catch(e){
    errEl.textContent='Errore: '+e.message;
    errEl.style.display='block';
    if(saveBtn) saveBtn.textContent='Attiva accesso Leader →';
  }
};

async function genInviteLink(){
  const existing=await getDocs(query(collection(db,'invites'),where('uid','==',cUser.uid)));
  let token;
  if(!existing.empty) token=existing.docs[0].id;
  else{
    const ref=await addDoc(collection(db,'invites'),{uid:cUser.uid,name:cData?.name||cUser.email,uplinePath:cData?.uplinePath||[],createdAt:serverTimestamp()});
    token=ref.id;
  }
  const link=window.location.origin+window.location.pathname+'?invite='+token;
  id('invite-input').value=link;
}

window.copyInvite=()=>{
  navigator.clipboard.writeText(id('invite-input').value).then(()=>{
    id('copy-btn').textContent='Copiato ✓';
    setTimeout(()=>id('copy-btn').textContent='Copia',2000);
  }).catch(()=>{id('invite-input').select();document.execCommand('copy');});
};

// ── TAB SWITCHING ──
function doSwitchTab(t){
  ['lista','team','tree','admin'].forEach(v=>{
    id('view-'+v)?.classList.toggle('hidden',v!==t);
    id('tab-'+v)?.classList.toggle('on',v===t);
  });
}
window.switchTab=t=>{
  if(t==='admin'&&!adminUnlocked){
    id('al-code').value=''; id('al-err').style.display='none';
    id('al-overlay').classList.remove('hidden'); return;
  }
  doSwitchTab(t);
  if(t==='team') loadTeamDashboard();
  if(t==='tree') loadNetworkTree();
  if(t==='admin') loadAdminPanel();
};

// ── UTILS ──
const id = k => document.getElementById(k);
const x  = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const sc = (l,v,c) => `<div class="sc"><div class="sc-lbl">${l}</div><div class="sc-val ${c}">${v}</div></div>`;
const loader = () => '<div class="loader"><div class="ld"></div><div class="ld"></div><div class="ld"></div></div>';
const days = p => {
  // Use lastCheckAt if set (means a check was done after insertion), else createdAt
  // createdAt from Firestore may be a Timestamp or null if not yet synced — handle both
  const base = p.lastCheckAt?.toMillis
    ? p.lastCheckAt.toMillis()
    : p.createdAt?.toMillis
      ? p.createdAt.toMillis()
      : p._insertedAt || Date.now();
  return Math.floor((Date.now() - base) / 86400000);
};
const status = p => { if(p.payment)return'paga'; const n=(p.followUps||[]).filter(Boolean).length; if(n===4)return'done'; if(p.presentation||n>0)return'attivo'; return'nuovo'; };

function showErr(msg){
  const el=id('auth-err');
  el.style.display='block';
  if(msg.includes('già registrata')){
    el.innerHTML='';
    el.textContent=msg;
    const btn=document.createElement('button');
    btn.textContent='→ Vai al login';
    btn.style.cssText='background:none;border:none;color:var(--accent);cursor:pointer;font-size:12px;font-weight:600;padding:0 0 0 6px;text-decoration:underline;';
    btn.onclick=()=>authTab('login');
    el.appendChild(btn);
  } else {
    el.textContent=msg;
  }
  setTimeout(()=>el.style.display='none',6000);
}
function errMsg(code){
  const msgs={
    'auth/user-not-found':'Utente non trovato. Controlla email e password.',
    'auth/wrong-password':'Password errata.',
    'auth/email-already-in-use':'⚠️ Email già registrata. Usa la funzione Accedi.',
    'auth/weak-password':'Password troppo corta (minimo 6 caratteri).',
    'auth/invalid-email':'Formato email non valido.',
    'auth/invalid-credential':'Email o password non corretti.',
    'auth/too-many-requests':'Troppi tentativi. Attendi qualche minuto e riprova.'
  };
  return msgs[code]||('Errore: '+code);
}
