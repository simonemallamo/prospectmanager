
import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged }
                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, updateDoc, deleteDoc, writeBatch,
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

const LEADER_CODE = "retiredyoung";
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

// ── BINARY LEG HELPERS ──
// Leg assignments are stored per-upline in legMap.<uplineUid>.
// Older records may still have a legacy `leg` field, so use it only
// when the user is a direct child of the requested upline.
function getLegFor(user, refUid) {
  if(!user || !refUid || user.id === refUid) return null;
  const map = user.legMap;
  if(map && Object.prototype.hasOwnProperty.call(map, refUid)) {
    const leg = map[refUid];
    return leg === 'left' || leg === 'right' ? leg : null;
  }
  if(user.uplineUid === refUid && (user.leg === 'left' || user.leg === 'right')) {
    return user.leg;
  }
  return null;
}

function getLegForUser(user, refUid, allUsers) {
  if(!user || !refUid || user.id === refUid) return null;
  const users = allUsers || window._cachedUs || window._treeUs || [];
  if(user.uplineUid === refUid) return getLegFor(user, refUid);

  // Walk upward using uplineUid, which is the source of truth for the tree.
  // The first child below refUid determines the whole descendant's leg.
  let current = user;
  let guard = 0;
  while(current && current.uplineUid && guard++ < 500) {
    const parentUid = current.uplineUid;
    if(parentUid === refUid) return getLegFor(current, refUid);
    current = users.find(u => u.id === parentUid);
  }
  return null;
}

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


// ── PERSONAL TEAM PLACEMENT (PER VIEWER) ──
// The real upline relationship remains immutable. Team Dashboard positioning is
// stored only inside the current viewer's own `personalLayout` field.
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
  // Compatibility with the previous per-upline legMap format.
  const target=all.find(u=>u.id===memberId); if(!target)return null;
  if(target.legMap && target.legMap[viewerUid]) return {parentUid:viewerUid,leg:target.legMap[viewerUid],order:target.legOrder};
  const direct=getDirectChildForViewer(memberId,viewerUid,all);
  if(direct && direct.legMap && direct.legMap[viewerUid]) return {parentUid:viewerUid,leg:direct.legMap[viewerUid],order:direct.legOrder};
  return null;
}
function getLegForPersonal(u, viewerUid, users){
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
  const allowed=new Set(); const q=[viewerUid]; let guard=0;
  while(q.length && guard++<1000){
    const pid=q.shift();
    all.filter(u=>u.uplineUid===pid).forEach(ch=>{if(!allowed.has(ch.id)){allowed.add(ch.id);q.push(ch.id);}});
  }
  if(!allowed.has(memberId)) throw new Error('Puoi posizionare solo persone della tua downline.');
  const layout=viewer.personalLayout && typeof viewer.personalLayout==='object' ? {...viewer.personalLayout} : {};
  layout[memberId]={parentUid:placement.parentUid,leg:placement.leg||null,order:placement.order??9999};
  await updateDoc(doc(db,'users',viewerUid),{personalLayout:layout});
  viewer.personalLayout=layout;
  const cached=(users||[]).find(u=>u.id===viewerUid); if(cached) cached.personalLayout=layout;
}

// ── MEMBER ORDERING ──
window.moveMember = async function(uid, dir) {
  var allUs=window._cachedUs||[], viewer=cUser.uid;
  var u=allUs.find(x=>x.id===uid); if(!u)return;
  var leg=getLegForPersonal(u,viewer,allUs)||'';
  var siblings=allUs.filter(function(x){return getLegForPersonal(x,viewer,allUs)===leg&&!hiddenMembers.has(x.id);})
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

window.handleDrop = async function(draggedUid,targetUid,fromGrid,toGrid) {
  var allUs=window._cachedUs||[], viewer=cUser.uid;
  var dragged=allUs.find(x=>x.id===draggedUid),target=allUs.find(x=>x.id===targetUid);
  if(!dragged||!target)return;
  var sameLeg=fromGrid===toGrid;
  try{
    if(sameLeg){
      var leg=getLegForPersonal(dragged,viewer,allUs)||'';
      var siblings=allUs.filter(function(x){return getLegForPersonal(x,viewer,allUs)===leg&&!hiddenMembers.has(x.id);})
        .sort(function(a,b){var pa=getPersonalPlacement(a.id,viewer,allUs)||{},pb=getPersonalPlacement(b.id,viewer,allUs)||{};return (pa.order??9999)-(pb.order??9999)||(a.name||'').localeCompare(b.name||'');});
      var fromIdx=siblings.findIndex(x=>x.id===draggedUid),toIdx=siblings.findIndex(x=>x.id===targetUid);
      if(fromIdx<0||toIdx<0||fromIdx===toIdx)return;
      siblings.splice(fromIdx,1); siblings.splice(toIdx,0,dragged);
      for(var i=0;i<siblings.length;i++){
        var u=siblings[i], pos=getPersonalPlacement(u.id,viewer,allUs)||{parentUid:getPersonalParent(u.id,viewer,allUs),leg};
        await savePersonalPlacement(u.id,viewer,{parentUid:pos.parentUid,leg:pos.leg||leg,order:i},allUs);
      }
    }else{
      var newLeg=getLegForPersonal(target,viewer,allUs)||'';
      var newSiblings=allUs.filter(function(x){return getLegForPersonal(x,viewer,allUs)===newLeg&&!hiddenMembers.has(x.id)&&x.id!==draggedUid;});
      var maxOrder=newSiblings.reduce(function(m,x){var p=getPersonalPlacement(x.id,viewer,allUs)||{};return Math.max(m,p.order??0);},-1);
      var old=getPersonalPlacement(draggedUid,viewer,allUs)||{parentUid:getPersonalParent(draggedUid,viewer,allUs),leg:getLegForPersonal(dragged,viewer,allUs)};
      await savePersonalPlacement(draggedUid,viewer,{parentUid:old.parentUid,leg:newLeg,order:maxOrder+1},allUs);
    }
    renderTeamDashboard();
  }catch(e){console.warn('handleDrop error',e);alert(e.message||'Errore');}
};

window.backupTeamStructure = async function(){
  const us=window._cachedUs||[];
  if(!us.length){alert('Carica prima la Dashboard Team.');return;}
  const myUid=cUser.uid;
  const direct=us.filter(u=>u.uplineUid===myUid || ((u.uplinePath||[]).length && u.uplinePath[u.uplinePath.length-1]===myUid));
  const children={};
  direct.forEach(u=>{const p=getPersonalPlacement(u.id,myUid,us)||{};children[u.id]={parentUid:p.parentUid||myUid,leg:p.leg||null,order:p.order??9999};});
  try{
    await updateDoc(doc(db,'users',myUid),{teamStructureBackup:{savedAt:Date.now(),children}});
    if(cData)cData.teamStructureBackup={savedAt:Date.now(),children};
    alert('Backup della struttura Team salvato.');
  }catch(e){alert('Errore nel backup: '+(e.message||e));}
};
window.restoreTeamStructure = async function(){
  try{
    const snap=await getDoc(doc(db,'users',cUser.uid));
    const data=snap.exists()?snap.data():null, backup=data?.teamStructureBackup;
    if(!backup||!backup.children||!Object.keys(backup.children).length){alert('Nessun backup della struttura disponibile.');return;}
    if(!confirm('Ripristinare l’ultimo backup della Dashboard Team? Il Network Tree personale non verrà modificato.'))return;
    const layout={...(data?.personalLayout||{})};
    Object.entries(backup.children).forEach(([uid,v])=>{layout[uid]={parentUid:v.parentUid||cUser.uid,leg:v.leg||null,order:v.order??9999};});
    await updateDoc(doc(db,'users',cUser.uid),{personalLayout:layout});
    if(window._teamCache){window._teamCache=null;} window._cachedUs=null;window._cachedPs=null;
    await loadTeamDashboard(true); alert('Struttura Team ripristinata dal backup.');
  }catch(e){console.error('restoreTeamStructure',e);alert('Errore nel ripristino: '+(e.message||e));}
};

window.setLeg=async(uid,leg,btn)=>{
  try{
    const myUid=cUser.uid, allUs=window._cachedUs||[]; if(!myUid||!uid)return;
    const branchRoot=getDirectChildForViewer(uid,myUid,allUs);
    if(!branchRoot){alert('Questa persona non appartiene alla tua downline.');return;}
    const current=getPersonalPlacement(branchRoot.id,myUid,allUs)||{};
    const order=current.order??9999;
    await savePersonalPlacement(branchRoot.id,myUid,{parentUid:myUid,leg:leg||null,order},allUs);
    renderTeamDashboard();
  }catch(e){console.error('setLeg error',e);alert('Errore: '+(e.message||e));}
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
async function ensureInitialTeamBackup(us){
  if(!us || !us.length || !cUser) return;
  try{
    const meSnap=await getDoc(doc(db,'users',cUser.uid));
    const existing=meSnap.exists()?meSnap.data().teamStructureBackup:null;
    if(existing && existing.children && Object.keys(existing.children).length) return;
    const direct=us.filter(u=>u.uplineUid===cUser.uid || ((u.uplinePath||[]).length && u.uplinePath[u.uplinePath.length-1]===cUser.uid));
    const children={};
    direct.forEach(u=>{children[u.id]={leg:getLegFor(u,cUser.uid)||null,order:u.legOrder??9999};});
    if(Object.keys(children).length){
      await updateDoc(doc(db,'users',cUser.uid),{teamStructureBackup:{savedAt:Date.now(),children}});
      if(cData)cData.teamStructureBackup={savedAt:Date.now(),children};
    }
  }catch(e){console.warn('Initial Team backup skipped:',e);}
}

async function loadTeamDashboard(force=false) {
  if(id('team-grid-left')) id('team-grid-left').innerHTML=loader();
  if(id('team-grid-right')) id('team-grid-right').innerHTML=loader();
  if(id('binary-view')) id('binary-view').innerHTML=loader();

  // Fast path: reuse data already loaded during this session.
  if(!force && window._teamCache && window._teamCache.uid===cUser.uid){
    const c=window._teamCache;
    window._cachedUs=c.us; window._cachedPs=c.ps; window._cachedShow=c.show; window._cachedWk=c.wk;
    renderTeamDashboard(c.us,c.ps,c.show,c.wk);
    return;
  }

  try {
    const rootUid=cUser.uid;
    const chunk=(arr,n=30)=>{const out=[];for(let i=0;i<arr.length;i+=n)out.push(arr.slice(i,i+n));return out;};
    // Load this leader's downline using BOTH hierarchy fields.
    // Some older records may have a valid uplinePath but a missing/stale uplineUid.
    // If we query only uplineUid, those people disappear from Team Dashboard and
    // from the Network Tree picker. We therefore merge direct-upline and path hits.
    const snapUsers = async parentIds => {
      if(!parentIds.length) return [];
      const batches=chunk(parentIds,30);
      const results=[];
      for(const ids of batches){
        const [byUid, byPath] = await Promise.all([
          getDocs(query(collection(db,'users'),where('uplineUid','in',ids))),
          // Firestore array-contains accepts one parent id per query.
          Promise.all(ids.map(pid=>getDocs(query(collection(db,'users'),where('uplinePath','array-contains',pid)))))
        ]);
        const seenDocs=new Set();
        byUid.docs.forEach(d=>{if(!seenDocs.has(d.id)){seenDocs.add(d.id);results.push({id:d.id,...d.data()});}});
        byPath.flatMap(s=>s.docs).forEach(d=>{if(!seenDocs.has(d.id)){seenDocs.add(d.id);results.push({id:d.id,...d.data()});}});
      }
      return results;
    };

    // Load only this leader's downline, not every user in the database.
    // A path hit may contain deeper descendants, so we still validate the final
    // parent relation below and add every reachable descendant exactly once.
    const collected=[];
    let frontier=[rootUid];
    const seen=new Set([rootUid]);
    while(frontier.length){
      const hits=await snapUsers(frontier);
      const next=[];
      for(const child of hits){
        if(seen.has(child.id)) continue;
        // A user is part of this structure if either the explicit upline is one
        // of the current parents OR the current parent appears in uplinePath.
        const path=Array.isArray(child.uplinePath)?child.uplinePath:[];
        const validParent=frontier.some(pid=>child.uplineUid===pid || path.includes(pid));
        if(!validParent) continue;
        seen.add(child.id);collected.push(child);next.push(child.id);
      }
      frontier=next;
      if(seen.size>5000) break;
    }
    const us=collected;
    ensureInitialTeamBackup(us);
    const wk=Date.now()-7*86400000;
    const uids=us.map(u=>u.id);

    // Fetch prospects only for members actually inside this structure.
    // `in` batches keep this to a handful of Firestore reads instead of one read per member.
    const ps=[];
    for(const ids of chunk(uids,30)){
      const snap=await getDocs(query(collection(db,'prospects'),where('uid','in',ids)));
      snap.docs.forEach(d=>ps.push({id:d.id,...d.data()}));
    }

    const show=us;
    window._teamCache={uid:rootUid,us,ps,show,wk,at:Date.now()};
    window._cachedUs=us; window._cachedPs=ps; window._cachedShow=show; window._cachedWk=wk;

    // Small performance diagnostics, visible only in DevTools.
    console.debug('[Team Dashboard] loaded', {members:us.length, prospects:ps.length, ms:Date.now()-(window._teamLoadStarted||Date.now())});
    renderTeamDashboard(us,ps,show,wk);
  } catch(e) {
    console.error('Team Dashboard load failed:', e);
    const msg = e?.message || 'Errore sconosciuto durante il caricamento.';
    const html = `<div style=\"padding:1rem;color:var(--red);font-size:12px;background:var(--red-dim);border:.5px solid var(--red);border-radius:8px;\">⚠️ Impossibile caricare la Dashboard Team.<br><span style=\"color:var(--text2);\">${x(msg)}</span></div>`;
    if(id('team-grid-left')) id('team-grid-left').innerHTML=html;
    if(id('team-grid-right')) id('team-grid-right').innerHTML='';
    if(id('binary-view')) id('binary-view').innerHTML='';
    if(id('rank-table')) id('rank-table').innerHTML='';
  }
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
  const refUid = filterLeaderId || myUid;
  const refUser = filterLeaderId ? us.find(u=>u.id===filterLeaderId) : {id:myUid,name:'La mia struttura'};

  // Populate the structure filter with both leaders and members.
  const leaders = show.filter(u=>u.role==='leader').sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const members = show.filter(u=>u.role!=='leader').sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  const legSel = id('leg-leader-filter');
  if(legSel){
    const curVal = legSel.value;
    const leaderOptions = leaders.map(l=>`<option value="${l.id}"${l.id===curVal?' selected':''}>👑 ${x(l.name||l.email)}${l.userNumber?` #${l.userNumber}`:''}</option>`).join('');
    const memberOptions = members.map(m=>`<option value="${m.id}"${m.id===curVal?' selected':''}>${x(m.name||m.email)}${m.userNumber?` #${m.userNumber}`:''}</option>`).join('');
    legSel.innerHTML='<option value="">Tutta la struttura</option>'+
      (leaders.length?`<optgroup label="Leader">${leaderOptions}</optgroup>`:'')+
      (members.length?`<optgroup label="Membri">${memberOptions}</optgroup>`:'');
    if(curVal && !us.some(u=>u.id===curVal)) legSel.value='';
  }
  const filterHint=id('leg-filter-hint');
  if(filterHint){
    filterHint.textContent=filterLeaderId && refUser
      ? `Diagrammi delle gambe di ${refUser.name||refUser.email}`
      : 'Filtra per leader o membro per vedere le sue gambe';
  }

  // Build O(1) lookup maps once. This avoids repeated .find/.filter scans while rendering.
  const userById = Object.fromEntries(us.map(u=>[u.id,u]));
  const prospectsByUid = Object.create(null);
  for(const p of ps){(prospectsByUid[p.uid] ||= []).push(p);}
  const legMemo = new Map();
  const effectiveLeg = (u,ref=refUid) => {
    const key=ref+'|'+u.id;
    if(legMemo.has(key)) return legMemo.get(key);
    if(u.id===ref){legMemo.set(key,null);return null;}
    let cur=u, guard=0, result=null;
    while(cur && guard++<500){
      const parent = cur.uplineUid && userById[cur.uplineUid]
        ? cur.uplineUid
        : ((cur.uplinePath||[]).length ? cur.uplinePath[cur.uplinePath.length-1] : null);
      if(parent===ref){result=getLegForPersonal(cur,ref);break;}
      cur=parent ? userById[parent] : null;
    }
    legMemo.set(key,result);
    return result;
  };

  const rightMembers = show.filter(u=>effectiveLeg(u)==='right');
  const leftMembers  = show.filter(u=>effectiveLeg(u)==='left');
  const noLeg        = show.filter(u=>!effectiveLeg(u));

  function legStats(members) {
    const mPs = [];
    for(const m of members) (prospectsByUid[m.id]||[]).forEach(p=>mPs.push(p));
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
    const refLabel = filterLeaderId && refUser ? (refUser.name||refUser.email) : 'tutta la struttura';
    return `<div class="leg-card ${side}" data-ref="${x(refLabel)}">
      <div class="leg-title" style="color:${color}">${label}</div>
      <div class="leg-sub">${stats.members} persone · ${pct}% dei prospect totali</div>
      ${(()=>{
        const all=members.flatMap(m=>prospectsByUid[m.id]||[]);
        const stage=p=>{const n=(p.followUps||[]).filter(Boolean).length;if(p.payment)return'payment';if(n===4)return'done';if(p.presentation||n>0)return'active';return'new';};
        const vals={new:0,active:0,done:0,payment:0}; all.forEach(p=>vals[stage(p)]++);
        const totalStage=Math.max(all.length,1);
        const colors={new:'var(--green)',active:'var(--blue)',done:'var(--accent)',payment:'var(--amber)'};
        const labels={new:'Nuovi',active:'Attivi',done:'FU completi',payment:'Attesa pagamento'};
        let cursor=0; const stops=Object.keys(vals).map(k=>{const a=cursor/totalStage*100;cursor+=vals[k];const b=cursor/totalStage*100;return `${colors[k]} ${a}% ${b}%`;}).join(',');
        return `<div class=\"leg-visual\" data-chart-ref=\"${x(refLabel)}\"><div class=\"leg-donut\" role=\"img\" aria-label=\"Distribuzione prospect ${side==='right'?'gamba destra':'gamba sinistra'} per ${x(refLabel)}\" style=\"background:conic-gradient(${stops})\"><div class=\"leg-donut-center\"><div class=\"leg-donut-total\">${stats.prospects}</div><div class=\"leg-donut-label\">Prospect</div></div></div><div class=\"leg-legend\">${Object.keys(vals).map(k=>`<div class=\"leg-legend-row\"><span class=\"leg-legend-dot\" style=\"background:${colors[k]}\"></span><span class=\"leg-legend-name\">${labels[k]}</span><span class=\"leg-legend-value\">${vals[k]} <span class=\"leg-legend-pct\">${Math.round(vals[k]/totalStage*100)}%</span></span></div>`).join('')}</div></div><div class=\"leg-mini-metrics\"><div class=\"leg-mini-metric\"><div class=\"leg-mini-value\" style=\"color:var(--green)\">${stats.newWk}</div><div class=\"leg-mini-label\">Nuovi ultimi 7 giorni</div></div><div class=\"leg-mini-metric\"><div class=\"leg-mini-value\" style=\"color:var(--blue)\">${stats.presentations}</div><div class=\"leg-mini-label\">Presentazioni</div></div></div>`;
      })()}
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
  const directUids=new Set(show.filter(u=>u.uplineUid===myUid || ((u.uplinePath||[]).length && u.uplinePath[u.uplinePath.length-1]===myUid)).map(u=>u.id));
  const getLevel=u=>{const path=u.uplinePath||[];const myIdx=path.indexOf(myUid);return myIdx===-1?99:path.length-myIdx;};
  const sorted_show=[...show].sort((a,b)=>{const la=getLevel(a),lb=getLevel(b);if(la!==lb)return la-lb;return(a.name||'').localeCompare(b.name||'');});
  // Exclude hidden members from grid — they appear only in "Membri disattivati" section
  const visibleForGrid = sorted_show.filter(function(u){ return !hiddenMembers.has(u.id); });
  const mdata=visibleForGrid.map((m,i)=>{const mp=prospectsByUid[m.id]||[];return {m,level:getLevel(m),mp,mpWk:mp.filter(p=>(p.createdAt?.toMillis()||0)>=(wk||Date.now()-7*86400000)),c:COLS[i%COLS.length]};});
  const _myUid = cUser.uid;
  const mdLeft  = mdata.filter(d => effectiveLeg(d.m,_myUid) === 'left');
  const mdRight = mdata.filter(d => effectiveLeg(d.m,_myUid) === 'right');
  const mdNone  = mdata.filter(d => !effectiveLeg(d.m,_myUid));

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
    const _mLeg = effectiveLeg(m, cUser.uid);
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
    errEl.textContent='Codice errato. Assicurati di scrivere: retiredyoung';
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

function showGuideRole(role){
  const leader=role==='leader';
  id('guide-member')?.classList.toggle('hidden',leader);
  id('guide-leader')?.classList.toggle('hidden',!leader);
  const b=id('guide-role-badge'); if(b)b.textContent=leader?'👑 Team Leader':'👤 Membro';
}

// ── TAB SWITCHING ──
function doSwitchTab(t){
  ['lista','team','tree','guide','admin'].forEach(v=>{
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
  if(t==='team'){ window._teamLoadStarted=Date.now(); loadTeamDashboard(); }
  if(t==='tree') loadNetworkTree();
  if(t==='guide') showGuideRole(cData?.role||'member');
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


/* RY Manager bilingual interface: Italian / Spanish */
const RY_I18N={
  'Accedi':'Iniciar sesión','Registrati':'Registrarse','Bentornato':'Bienvenido de nuevo','Gestisci i tuoi prospect e monitora il team':'Gestiona tus prospectos y supervisa el equipo',
  'Nome completo':'Nombre completo','Password':'Contraseña','Email':'Correo electrónico','Min. 6 caratteri':'Mín. 6 caracteres','Codice Leader':'Código de Líder','Codice riservato ai Leader':'Código reservado para Líderes','Hai un codice Leader? Clicca qui':'¿Tienes un código de Líder? Haz clic aquí','Crea account →':'Crear cuenta →','Hai dimenticato la password?':'¿Has olvidado tu contraseña?','Stai per unirti al team di':'Estás a punto de unirte al equipo de',
  'Lista Prospect':'Lista de prospectos','Dashboard Team':'Panel del equipo','🌳 Albero':'🌳 Árbol','📘 Guide':'📘 Guías','⚙ Admin':'⚙ Admin','Impostazioni':'Configuración','Esci':'Salir','Cerca prospect...':'Buscar prospectos...','Tutti':'Todos','Nuovo':'Nuevo','Attivo':'Activo','In attesa pag.':'Pago pendiente','FU completo':'FU completo','FU 1+':'FU 1+','FU 2+':'FU 2+','FU 3+':'FU 3+','Prov.':'Prov.','Provincia':'Provincia','Importa CSV':'Importar CSV','＋ Nuovo prospect':'＋ Nuevo prospecto','0 selezionati':'0 seleccionados','🗑 Elimina selezionati':'🗑 Eliminar seleccionados','✕ Deseleziona tutto':'✕ Deseleccionar todo','Seleziona tutti visibili':'Seleccionar todos los visibles','Seleziona tutti "Facebook Ads"':'Seleccionar todos "Facebook Ads"','Nome / Note':'Nombre / Notas','Telefono':'Teléfono','Giorni':'Días','Presentazione':'Presentación','Follow-up 1→4':'Seguimiento 1→4','Pagamento':'Pago','Stato':'Estado','Paese / Reg.':'País / Reg.','Iscritto':'Registrado','Contattato':'Contactado',
  '💾 Backup struttura':'💾 Copia de seguridad','↩ Ripristina':'↩ Restaurar','Albero Network':'Árbol de red','↻ Reset':'↻ Restablecer','Impossibile caricare la Dashboard Team.':'No se puede cargar el Panel del equipo.','Carica prima la Dashboard Team.':'Carga primero el Panel del equipo.','Ripristinare l’ultimo backup della Dashboard Team? Il Network Tree personale non verrà modificato.':'¿Restaurar la última copia de seguridad del Panel del equipo? El Árbol de red personal no se modificará.',
  'Membro':'Miembro','Team Leader':'Líder de equipo','👑 Team Leader':'👑 Líder de equipo','👤 Membro':'👤 Miembro','Guide':'Guías','Regole fondamentali':'Reglas fundamentales','Sinistra':'Izquierda','Destra':'Derecha','Gamba Sinistra':'Pierna izquierda','Gamba Destra':'Pierna derecha','Open':'Abierto','Posizione Open':'Posición abierta','Reset':'Restablecer','Dashboard Team':'Panel del equipo','Network Tree':'Árbol de red','downline':'downline','Upline':'Upline',
  'Copia di sicurezza':'Copia de seguridad','Ripristina':'Restaurar','Salva una copia del posizionamento reale della Dashboard Team':'Guardar una copia de la posición real del Panel del equipo','Ripristina l’ultimo backup della Dashboard Team':'Restaurar la última copia de seguridad del Panel del equipo',
  'Sostituisci':'Sustituir','Conferma':'Confirmar','Annulla':'Cancelar','Chiudi':'Cerrar','Clicca per scegliere chi inserire qui':'Haz clic para elegir quién colocar aquí','Clicca per sostituire o spostare questa persona':'Haz clic para sustituir o mover a esta persona',
  'Lista Prospect':'Lista de prospectos','Nuovo prospect':'Nuevo prospecto','Cerca prospect':'Buscar prospectos','Inserisci e gestisci i tuoi prospect, aggiorna gli stati e completa i follow-up.':'Añade y gestiona tus prospectos, actualiza los estados y completa los seguimientos.',
  'Dashboard Team':'Panel del equipo','Albero personale':'Árbol personal','Open, scambi e Reset':'Abiertos, intercambios y restablecimiento','Drag & Drop':'Arrastrar y soltar','Posizionamento personale: non modifica la Dashboard Team':'Posición personal: no modifica el Panel del equipo','Seleziona Leader o Membri':'Selecciona Líderes o Miembros',
  'Nuovi (7gg)':'Nuevos (7 días)','Totale':'Total','Contattati':'Contactados','Presentazioni':'Presentaciones','Attesa pag.':'Pago pendiente','Iscritti':'Registrados','Presentaz.':'Presentaciones','FU completi':'Seguimientos completos','Nuovi':'Nuevos','Attivi':'Activos','Attesa pagamento':'Pago pendiente','Prospect':'Prospectos','Nuovi ultimi 7 giorni':'Nuevos últimos 7 días','Confronto gambe':'Comparación de piernas','Tutta la struttura':'Toda la estructura','Filtra per leader o membro per vedere le sue gambe':'Filtra por líder o miembro para ver sus piernas','Salva una copia del posizionamento reale della Dashboard Team':'Guardar una copia de la posición real del Panel del equipo','Ripristina l’ultimo backup della Dashboard Team':'Restaurar la última copia de seguridad del Panel del equipo','Ultimi 7 giorni':'Últimos 7 días','Membri disattivati':'Miembros desactivados','Questi membri non appaiono nelle statistiche né nella griglia. Clicca "Riattiva" per includerli di nuovo.':'Estos miembros no aparecen en las estadísticas ni en la cuadrícula. Haz clic en «Reactivar» para incluirlos de nuevo.','Riattiva':'Reactivar','Ranking nuovi prospect (settimana)':'Ranking de nuevos prospectos (semana)','Gamba:':'Pierna:','Nessun leader':'Ningún líder','Nessun membro assegnato':'Ningún miembro asignado','Nessun membro nella gamba sinistra.':'Ningún miembro en la pierna izquierda.','Nessun membro nella gamba destra.':'Ningún miembro en la pierna derecha.','Gamba non assegnata':'Pierna no asignada','Assegna la gamba cliccando i pulsanti sulla scheda':'Asigna la pierna haciendo clic en los botones de la tarjeta','Diretto':'Directo','Livello 2':'Nivel 2','Livello':'Nivel','sett.':'sem.','Sposta su':'Mover arriba','Sposta giù':'Mover abajo','Trascina per riordinare':'Arrastra para reordenar','Nascondi':'Ocultar','Membri':'Miembros','Leader':'Líderes','Sinistra':'Izquierda','Destra':'Derecha','Gamba Sinistra':'Pierna izquierda','Gamba Destra':'Pierna derecha','Diagrammi delle gambe di':'Diagramas de las piernas de','Filtra per leader o membro per vedere le sue gambe':'Filtra por líder o miembro para ver sus piernas','Nessun membro.':'Ningún miembro.','membro':'miembro','membri':'miembros','persone':'personas','prospect':'prospectos','Tutta la struttura':'Toda la estructura',
  'Sei pronto?':'¿Listo?','Errore':'Error','Utente non trovato. Controlla email e password.':'Usuario no encontrado. Comprueba el correo y la contraseña.','Password errata.':'Contraseña incorrecta.','Email già registrata. Usa la funzione Accedi.':'El correo ya está registrado. Usa la función Iniciar sesión.','Password troppo corta (minimo 6 caratteri).':'Contraseña demasiado corta (mínimo 6 caracteres).','Formato email non valido.':'Formato de correo no válido.','Email o password non corretti.':'Correo o contraseña incorrectos.','Troppi tentativi. Attendi qualche minuto e riprova.':'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.'
};
const RY_I18N_EXTRA={
  'Gestisci i tuoi prospect e monitora il team':'Gestiona tus prospectos y supervisa el equipo',
  'Stai per unirti al team di':'Estás a punto de unirte al equipo de',
  'Codice riservato ai Leader':'Código reservado para Líderes',
  'Filtra per provincia':'Filtrar por provincia',
  '📥 Importa lead da Facebook Ads CSV':'📥 Importar leads de Facebook Ads CSV',
  'Bulk action bar':'Barra de acciones masivas',
  'Nome / Note':'Nombre / Notas','Paese / Reg.':'País / Reg.','Follow-up 1→4':'Seguimiento 1→4',
  'Seleziona tutti':'Seleccionar todos','Seleziona tutti "Facebook Ads"':'Seleccionar todos "Facebook Ads"',
  'Seleziona tutti visibili':'Seleccionar todos los visibles',
  'Confronto gambe':'Comparación de piernas','Tutta la struttura':'Toda la estructura',
  'Filtra per leader o membro per vedere le sue gambe':'Filtra por líder o miembro para ver sus piernas',
  'Salva una copia del posizionamento reale della Dashboard Team':'Guardar una copia de la posición real del Panel del equipo',
  'Filtra per leader o membro per vedere le sue gambe':'Filtra por líder o miembro para ver sus piernas',
  'Nuovi ultimi 7 giorni':'Nuevos últimos 7 días','Ultimi 7 giorni':'Últimos 7 días',
  'Nuovi (7gg)':'Nuevos (7 días)','Nuovi':'Nuevos','Totale':'Total','Contattati':'Contactados',
  'Presentazioni':'Presentaciones','Presentaz.':'Presentaciones','Attesa pag.':'Pago pendiente','Attesa pagamento':'Pago pendiente',
  'Iscritti':'Registrados','Prospect':'Prospectos','FU completi':'Seguimientos completos','Attivi':'Activos',
  'Prospect aggiunti questa settimana':'Prospectos añadidos esta semana','Prospect aggiunti':'Prospectos añadidos',
  '📋 Prospect aggiunti questa settimana':'📋 Prospectos añadidos esta semana',
  '👈 Gamba Sinistra':'👈 Pierna izquierda','👉 Gamba Destra':'👉 Pierna derecha','Gamba Sinistra':'Pierna izquierda','Gamba Destra':'Pierna derecha',
  '⚠️ Gamba non assegnata':'⚠️ Pierna no asignada','Gamba non assegnata':'Pierna no asignada',
  '— Assegna la gamba cliccando i pulsanti sulla scheda':'— Asigna la pierna haciendo clic en los botones de la tarjeta',
  'Assegna la gamba cliccando i pulsanti sulla scheda':'Asigna la pierna haciendo clic en los botones de la tarjeta',
  'Ranking nuovi prospect (settimana)':'Ranking de nuevos prospectos (semana)',
  'Membri disattivati':'Miembros desactivados',
  'Questi membri non appaiono nelle statistiche né nella griglia. Clicca "Riattiva" per includerli di nuovo.':'Estos miembros no aparecen en las estadísticas ni en la cuadrícula. Haz clic en «Reactivar» para incluirlos de nuevo.',
  'Riattiva':'Reactivar','Nessun leader':'Ningún líder','Nessun membro assegnato':'Ningún miembro asignado',
  'Nessun membro nella gamba sinistra.':'Ningún miembro en la pierna izquierda.',
  'Nessun membro nella gamba destra.':'Ningún miembro en la pierna derecha.',
  'Nessun membro.':'Ningún miembro.','Nessun membro':'Ningún miembro','Nessun prospect aggiunto questa settimana.':'Ningún prospecto añadido esta semana.',
  'Nessun nuovo lead da importare.':'No hay nuevos leads para importar.','membro':'miembro','membri':'miembros','persone':'personas','prospect':'prospectos',
  'Diretto':'Directo','Livello':'Nivel','Livello 2':'Nivel 2','sett.':'sem.','Sposta su':'Mover arriba','Sposta giù':'Mover abajo','Nascondi':'Ocultar',
  'Trascina per riordinare':'Arrastra para reordenar','Diagrammi delle gambe di':'Diagramas de las piernas de',
  'La mia struttura':'Mi estructura','Leader':'Líderes','Membri':'Miembros','Membro':'Miembro','Team Leader':'Líder de equipo',
  'Posizione Open':'Posición abierta','Open':'Abierto','Reset':'Restablecer','Network Tree':'Árbol de red','Albero Network':'Árbol de red',
  'Posizionamento personale: non modifica la Dashboard Team':'Posición personal: no modifica el Panel del equipo',
  'Seleziona Leader o Membri':'Selecciona Líderes o Miembros',
  'Trascina una persona su Open o su un\'altra persona per spostarla / sostituirla':'Arrastra una persona a Abierto o sobre otra persona para moverla / sustituirla',
  '💡 Trascina una persona su Open o su un\'altra persona per spostarla / sostituirla':'💡 Arrastra una persona a Abierto o sobre otra persona para moverla / sustituirla',
  'Trascina una persona su Open oppure su un\'altra persona per spostare o scambiare la posizione.':'Arrastra una persona a Abierto o sobre otra persona para mover o intercambiar la posición.',
  'Clicca per scegliere chi inserire qui':'Haz clic para elegir a quién colocar aquí',
  'Clicca per sostituire o spostare questa persona':'Haz clic para sustituir o mover a esta persona',
  '📍 Gestisci posizione':'📍 Gestionar posición','Posizione':'Posición','Persona da inserire':'Persona a colocar',
  'Conferma':'Confirmar','Annulla':'Cancelar','Chiudi':'Cerrar','Salva':'Guardar','Elimina':'Eliminar','Modifica':'Editar',
  'Modifica prospect':'Editar prospect','Nuovo prospect':'Nuevo prospecto','Nome e cognome *':'Nombre y apellidos *','Canale di contatto':'Canal de contacto',
  'Paese':'País','Provincia / Regione':'Provincia / Región','Telefono':'Teléfono','Note':'Notas','Note aggiuntive':'Notas adicionales',
  '— Seleziona paese —':'— Selecciona país —','— Seleziona prima il paese —':'— Selecciona primero el país —','— seleziona colonna —':'— selecciona columna —','— Seleziona colonna —':'— Selecciona columna —',
  '— nessuna —':'— ninguna —','— Nessuna —':'— Ninguna —','— Ignora —':'— Ignorar —','— Non assegnata —':'— No asignada —',
  'Destra 👉':'Derecha 👉','Sinistra 👈':'Izquierda 👈','👈 Sinistra':'👈 Izquierda','👉 Destra':'👉 Derecha',
  'Impostazioni account':'Configuración de la cuenta','Upgrade a Team Leader':'Convertirse en Líder de equipo',
  'Inserisci il codice Leader per sbloccare la Dashboard Team. Se il tuo leader ha già cambiato il tuo ruolo, chiudi e riapri le impostazioni.':'Introduce el código de Líder para desbloquear el Panel del equipo. Si tu líder ya ha cambiado tu rol, cierra y vuelve a abrir la configuración.',
  'Attiva accesso Leader →':'Activar acceso de Líder →','✅ Sei già Team Leader':'✅ Ya eres Líder de equipo','🔗 Il tuo link di invito':'🔗 Tu enlace de invitación',
  'Condividi con i tuoi diretti. Chi si registra tramite questo link viene collegato automaticamente al tuo team.':'Compártelo con tus miembros directos. Quien se registre mediante este enlace quedará conectado automáticamente a tu equipo.',
  'Copia':'Copiar','Il tuo ruolo è stato aggiornato dall\'admin? Ricarica.':'¿El administrador ha actualizado tu rol? Recarga.','🔄 Ricarica sessione':'🔄 Recargar sesión',
  '🔐 Accesso Admin':'🔐 Acceso de administrador','Inserisci il codice Admin per gestire utenti e network.':'Introduce el código de administrador para gestionar usuarios y la red.',
  'Codice Admin':'Código de administrador','✏️ Modifica utente':'✏️ Editar usuario','Ruolo':'Rol','Sposta upline diretto':'Mover upline directo','Gamba nel team dell\'upline':'Pierna en el equipo del upline',
  'Elimina':'Eliminar','Salva':'Guardar','Annulla':'Cancelar',
  '📥 Importa lead da Facebook Ads':'📥 Importar leads de Facebook Ads','Seleziona quale colonna del CSV corrisponde a ciascun campo.':'Selecciona qué columna del CSV corresponde a cada campo.',
  'Seleziona quale colonna del CSV corrisponde a ciascun campo.':'Selecciona qué columna del CSV corresponde a cada campo.',
  'righe trovate':'filas encontradas','Mostra anteprima →':'Mostrar vista previa →','← Torna al mapping':'← Volver al mapeo','✅ Importa prospect':'✅ Importar prospectos',
  'Step 1: Column mapping':'Paso 1: Mapeo de columnas','Step 2: Preview':'Paso 2: Vista previa','Step 1: column mapping':'Paso 1: mapeo de columnas','Step 2: preview before import':'Paso 2: vista previa antes de importar',
  'Il sistema prova a indovinare automaticamente — correggilo se necessario.':'El sistema intenta detectarlo automáticamente — corrígelo si es necesario.',
  '← Modifica':'← Editar','↩ Annulla ultima':'↩ Deshacer última','✓ Importa':'✓ Importar',
  'Errore':'Error','Account non trovato. Contatta Simone indicando la tua email.':'Cuenta no encontrada. Contacta con Simone indicando tu correo electrónico.',
  'Inserisci email e password':'Introduce correo electrónico y contraseña','Compila tutti i campi':'Completa todos los campos','Codice Leader non valido':'Código de Líder no válido',
  'Account creato ma profilo non salvato. Contatta Simone con il tuo ID:':'Cuenta creada pero el perfil no se ha guardado. Contacta con Simone con tu ID:',
  'Errore nel reset:':'Error al restablecer:','Puoi gestire solo la tua downline.':'Solo puedes gestionar tu downline.',
  'Errore nello spostamento:':'Error al mover:','Posizione non valida.':'Posición no válida.','Puoi posizionare solo persone appartenenti alla tua downline.':'Solo puedes colocar personas que pertenezcan a tu downline.',
  'Non puoi inserire un upline o un suo discendente sotto questa posizione.':'No puedes colocar a un upline ni a uno de sus descendientes debajo de esta posición.',
  'Conferma':'Confirmar','Backup della struttura Team salvato.':'Copia de seguridad de la estructura del equipo guardada.','Errore nel backup:':'Error en la copia de seguridad:',
  'Nessun backup della struttura disponibile.':'No hay ninguna copia de seguridad de la estructura disponible.',
  'Ripristinare l’ultimo backup della Dashboard Team? Il Network Tree personale non verrà modificato.':'¿Restaurar la última copia de seguridad del Panel del equipo? El Árbol de red personal no se modificará.',
  'Struttura Team ripristinata dal backup.':'Estructura del equipo restaurada desde la copia de seguridad.','Errore nel ripristino:':'Error al restaurar:',
  'Seleziona la colonna del Nome per continuare.':'Selecciona la columna del Nombre para continuar.','Nessuna importazione recente da annullare. Funziona solo nella stessa sessione.':'No hay ninguna importación reciente que deshacer. Solo funciona durante la misma sesión.',
  'Eliminati':'Eliminados','prospect importati da Facebook Ads!':'prospectos importados desde Facebook Ads!','Nessun nuovo lead da importare.':'No hay nuevos leads para importar.',
  'Eliminare definitivamente':'Eliminar definitivamente','Azione non reversibile.':'Esta acción no se puede deshacer.','Verranno rimossi':'Se eliminarán','Tutti gli utenti hanno già un ID assegnato.':'Todos los usuarios ya tienen un ID asignado.',
  'Assegnare un ID numerico a':'Asignar un ID numérico a','utenti che ne sono privi?':'usuarios que no lo tienen?',
  'Clicca per riordinare':'Haz clic para reordenar','Trascina per spostare/sostituire · clicca per gestire':'Arrastra para mover/sustituir · haz clic para gestionar',
  'Trascina per riordinare':'Arrastra para reordenar','Sposta su':'Mover arriba','Sposta giù':'Mover abajo','Nascondi':'Ocultar',
  'membri non hanno':'miembros no tienen','ancora una gamba assegnata. Vai nel pannello Admin per assegnarla.':'todavía una pierna asignada. Ve al panel de administración para asignarla.',
  'Struttura non trovata.':'Estructura no encontrada.','tutta la struttura':'toda la estructura','gamba destra':'pierna derecha','gamba sinistra':'pierna izquierda',
  'Distribuzione prospect':'Distribución de prospectos','per':'para','oggi':'hoy','fa':'hace','giorni':'días',
  'Nessun duplicato trovato.':'No se encontraron duplicados.','Synced leader role from email match':'Rol de líder sincronizado mediante coincidencia de correo electrónico',
  'già registrata':'ya está registrado','Utente non trovato. Controlla email e password.':'Usuario no encontrado. Comprueba el correo y la contraseña.',
  'Password errata.':'Contraseña incorrecta.','Email o password non corretti.':'Correo o contraseña incorrectos.',
  'Email già registrata. Usa la funzione Accedi.':'El correo ya está registrado. Usa la función Iniciar sesión.',
  'Password troppo corta (minimo 6 caratteri).':'Contraseña demasiado corta (mínimo 6 caracteres).','Formato email non valido.':'Formato de correo no válido.',
  'Troppi tentativi. Attendi qualche minuto e riprova.':'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.',
  'La mia struttura':'Mi estructura','Impara a usare la piattaforma':'Aprende a usar la plataforma',
  'Guida pratica integrata direttamente nell\'app. I contenuti si adattano automaticamente al tuo ruolo.':'Guía práctica integrada directamente en la aplicación. El contenido se adapta automáticamente a tu rol.',
  'Guida Membro':'Guía para miembros','Inserisci e gestisci i tuoi prospect, aggiorna gli stati e completa i follow-up.':'Añade y gestiona tus prospectos, actualiza los estados y completa los seguimientos.',
  'Visualizza la tua struttura e gestisci esclusivamente la tua':'Visualiza tu estructura y gestiona exclusivamente tu','downline':'downline',
  'Posizione Open':'Posición abierta','Clicca su':'Haz clic en','per scegliere una persona. La lista mostra solo la tua downline ed è alfabetica.':'para elegir una persona. La lista muestra solo tu downline y está ordenada alfabéticamente.',
  'Drag & Drop':'Arrastrar y soltar','Trascina una persona su Open oppure su un\'altra persona per spostare o scambiare la posizione.':'Arrastra una persona a Abierto o sobre otra persona para mover o intercambiar la posición.',
  'Guida Team Leader':'Guía para líderes de equipo','È il riferimento per il':'Es la referencia para el','posizionamento reale':'posicionamiento real','della tua struttura. Seleziona Leader o Membri della tua downline.':'de tu estructura. Selecciona Líderes o Miembros de tu downline.',
  'Backup e Ripristino':'Copia de seguridad y restauración','Fai un backup prima di modifiche importanti. Ripristina recupera l\'ultimo backup disponibile.':'Haz una copia de seguridad antes de realizar cambios importantes. Restaurar recupera la última copia disponible.',
  'Albero personale':'Árbol personal','Il Network Tree è indipendente dalla Dashboard Team. Ogni Leader ha la propria visualizzazione personale.':'El Árbol de red es independiente del Panel del equipo. Cada Líder tiene su propia visualización personal.',
  'Open, scambi e Reset':'Abierto, intercambios y restablecimiento','per scegliere una persona,':'para elegir una persona,','per spostare/scambiare,':'para mover/intercambiar,','per riallineare la vista alla Dashboard Team.':'para volver a alinear la vista con el Panel del equipo.',
  'Regole fondamentali':'Reglas fundamentales','Gestisce la struttura reale.':'Gestiona la estructura real.','Gestisce la visualizzazione personale.':'Gestiona la visualización personal.',
  'Puoi gestire solo la struttura verso il basso.':'Solo puedes gestionar la estructura hacia abajo.','Lista limitata alla tua downline e ordinata alfabeticamente.':'Lista limitada a tu downline y ordenada alfabéticamente.',
  '💡 Usa la Dashboard Team per il posizionamento ufficiale e l\'Albero per la tua visualizzazione personale.':'💡 Usa el Panel del equipo para el posicionamiento oficial y el Árbol para tu visualización personal.',
  'Assegna ID mancanti':'Asignar ID faltantes','Senza upline':'Sin upline','Albero del network':'Árbol de la red','Upline diretto':'Upline directo','Registrato':'Registrado',
  'Nessun membro.':'Ningún miembro.','Nessun membro nella gamba sinistra.':'Ningún miembro en la pierna izquierda.','Nessun membro nella gamba destra.':'Ningún miembro en la pierna derecha.',
  'Non assegnati':'Sin asignar','Posizione non valida.':'Posición no válida.'
};
// Extend the original dictionary without changing the app's data/logic.
Object.assign(RY_I18N,RY_I18N_EXTRA);

function ryTranslateText(root=document){
  if(localStorage.getItem('ryLang')!=='es') return;
  const target=root===document?document.body:root;
  if(!target) return;
  const entries=Object.entries(RY_I18N).filter(([a,b])=>a&&b).sort((a,b)=>b[0].length-a[0].length);
  const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
  const nodes=[]; let n; while(n=walker.nextNode()) nodes.push(n);
  nodes.forEach(node=>{
    if(!node.nodeValue.trim()) return;
    let v=node.nodeValue;
    for(const [it,es] of entries){
      if(v.includes(it)) v=v.split(it).join(es);
    }
    if(v!==node.nodeValue) node.nodeValue=v;
  });
  const attrs=['placeholder','title','aria-label','data-label'];
  (target===document.body?document.querySelectorAll('*'):target.querySelectorAll('*')).forEach(el=>attrs.forEach(a=>{
    const v=el.getAttribute(a); if(!v) return;
    let nv=v; for(const [it,es] of entries){ if(nv.includes(it)) nv=nv.split(it).join(es); }
    if(nv!==v) el.setAttribute(a,nv);
  }));
}
function ryRestoreItalian(){ location.reload(); }
window.setLanguage=function(lang){ localStorage.setItem('ryLang',lang); document.documentElement.lang=lang; if(lang==='it'){ location.reload(); return; } ryTranslateText(); document.querySelectorAll('.lang-switch button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang)); };
function ryUpdateLangButtons(){ const lang=localStorage.getItem('ryLang')||'it'; document.querySelectorAll('.lang-switch button').forEach(b=>b.classList.toggle('on',b.dataset.lang===lang)); document.documentElement.lang=lang; if(lang==='es') ryTranslateText(); }
const ryObserver=new MutationObserver(muts=>{ if(localStorage.getItem('ryLang')!=='es') return; muts.forEach(m=>m.addedNodes.forEach(n=>{if(n.nodeType===1) ryTranslateText(n);})); });
document.addEventListener('DOMContentLoaded',()=>{ ryUpdateLangButtons(); ryObserver.observe(document.body,{childList:true,subtree:true}); });


/* ProTracker modern micro-interactions — no data/model changes */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('pointerdown',()=>btn.classList.add('pressing'));
    btn.addEventListener('pointerup',()=>btn.classList.remove('pressing'));
    btn.addEventListener('pointerleave',()=>btn.classList.remove('pressing'));
  });
});
