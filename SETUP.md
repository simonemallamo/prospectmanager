# 🚀 SETUP GUIDE — ProTracker Networker CRM

Segui questi passi nell'ordine. Ci vogliono circa 20-30 minuti.
Non servono competenze tecniche.

---

## PASSO 1 — Crea il progetto Firebase (gratis)

1. Vai su **https://console.firebase.google.com**
2. Accedi con il tuo account Google
3. Clicca **"Aggiungi progetto"**
4. Nome progetto: `protracker-networker` (o quello che vuoi)
5. Disattiva Google Analytics (non serve) → **Crea progetto**
6. Attendi 30 secondi → **Continua**

---

## PASSO 2 — Abilita l'autenticazione email

1. Nel menu a sinistra clicca **Authentication**
2. Clicca **"Inizia"**
3. Clicca su **Email/password**
4. Attiva il primo toggle → **Salva**

---

## PASSO 3 — Crea il database Firestore

1. Nel menu a sinistra clicca **Firestore Database**
2. Clicca **"Crea database"**
3. Seleziona **"Inizia in modalità di produzione"** → Avanti
4. Scegli la regione **eur3 (Europe)** → Abilita
5. Attendi la creazione (1 minuto)

---

## PASSO 4 — Applica le regole di sicurezza

1. In Firestore, clicca la scheda **"Regole"**
2. Cancella tutto il testo presente
3. Apri il file `firestore.rules` (nella cartella del progetto)
4. Copia tutto il contenuto e incollalo nella casella delle regole
5. Clicca **"Pubblica"**

---

## PASSO 5 — Ottieni le credenziali Firebase

1. Clicca l'**icona ⚙️ (ingranaggio)** in alto a sinistra → **Impostazioni progetto**
2. Scorri fino a **"Le tue app"**
3. Clicca l'icona **</>** (Web)
4. Nome app: `ProTracker` → **Registra app**
5. Vedrai un blocco di codice tipo:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "protracker-xxx.firebaseapp.com",
  projectId: "protracker-xxx",
  storageBucket: "protracker-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. **Copia questi valori** — ti servono al passo successivo

---

## PASSO 6 — Inserisci i dati nel file index.html

1. Apri `index.html` con un editor di testo (anche il Blocco Note su Windows)
2. Cerca la sezione con scritto:
   ```
   🔧 SOSTITUISCI CON I TUOI DATI FIREBASE
   ```
3. Sostituisci i valori uno per uno:
   - `"INSERISCI_QUI_LA_TUA_API_KEY"` → il tuo `apiKey`
   - `"INSERISCI_QUI.firebaseapp.com"` → il tuo `authDomain`
   - `"INSERISCI_QUI_IL_PROJECT_ID"` → il tuo `projectId`
   - ecc.
4. **Salva il file**

---

## PASSO 7 — Pubblica online con Netlify (gratis)

1. Vai su **https://netlify.com** → crea account gratuito
2. Nella dashboard clicca **"Add new site"** → **"Deploy manually"**
3. Trascina la cartella `networker-app` nella zona tratteggiata
4. Attendi 30 secondi → il sito è online!
5. Trovi il link tipo: `https://random-name-123.netlify.app`

### Per avere un link personalizzato:
- In Netlify: **Site configuration** → **Change site name**
- Puoi usare qualcosa tipo: `protracker-mioname.netlify.app`

---

## PASSO 8 — Aggiungi il tuo dominio Firebase alla whitelist

1. Torna su Firebase Console → **Authentication** → **Settings**
2. Scheda **"Authorized domains"**
3. Clicca **"Add domain"**
4. Inserisci il tuo link Netlify (es. `protracker-mioname.netlify.app`)
5. **Aggiungi**

---

## PASSO 9 — Prima registrazione (il tuo account Leader)

1. Apri il link Netlify nel browser
2. Clicca **"Registrati"**
3. Inserisci i tuoi dati
4. **Importante:** Scegli il ruolo **"Team Leader"** — solo tu vedrai la Dashboard Team
5. Crea l'account

---

## PASSO 10 — Condividi con i tuoi diretti

1. Invia il link Netlify ai tuoi diretti
2. Digli di registrarsi con il ruolo **"Membro del team"**
3. Ogni membro inserisce i suoi prospect
4. Tu vedi tutto nella **Dashboard Team** (tab in alto)

---

## 💡 CONSIGLI UTILI

**Aggiornamenti automatici:**
La dashboard team si aggiorna ogni volta che la apri.

**Sicurezza:**
Ogni membro vede SOLO i propri prospect. Tu come leader vedi tutti.

**Backup:**
In Firebase Console → Firestore puoi esportare i dati in qualsiasi momento.

**Dominio personalizzato:**
Se vuoi usare `protracker.tuodominio.it`, puoi configurarlo in Netlify gratuitamente se hai già un dominio.

---

## ❓ PROBLEMI COMUNI

**"Firebase: Error (auth/configuration-not-found)"**
→ Controlla di aver copiato correttamente i valori nel firebaseConfig

**"Missing or insufficient permissions"**
→ Controlla di aver pubblicato le regole Firestore dal file `firestore.rules`

**La dashboard team non mostra i dati**
→ Verifica di essere registrato come "Team Leader"

---

## 📞 SUPPORTO

Per qualsiasi problema con il setup, chiedi supporto a Claude con screenshot dell'errore.

---

*ProTracker v1.0 — Creato con Claude AI*
