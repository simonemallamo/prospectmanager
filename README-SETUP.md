# RY Manager — Meta Lead Ads backend

Questi file sono aggiuntivi: non sostituiscono `index.html` e non toccano la V2 di backup.

## Files
- `netlify/functions/_firebase-admin.mjs`
- `netlify/functions/meta-oauth-start.mjs`
- `netlify/functions/meta-oauth-callback.mjs`
- `netlify/functions/meta-connection-status.mjs`
- `netlify/functions/meta-webhook.mjs`
- `package.json`

## Netlify Environment Variables
Ogni account collega la propria Meta App e la propria Pagina. Non condividere App Secret tra i due account.

Per Simone (`mallamo.simone@gmail.com`) impostare:
- `META_APP_ID_SIMONE` = App ID della sua app
- `META_APP_SECRET_SIMONE` = App Secret, contrassegnato come segreto Netlify
- `META_BUSINESS_LOGIN_CONFIG_ID_SIMONE` = Business Login Configuration ID
- `META_PAGE_ID_SIMONE` = ID della Pagina Facebook autorizzata
- `META_CAMPAIGN_NAME_SIMONE` = facoltativo; vuoto importa tutti i lead delle pagine collegate

Per Alessia (`veglia.alessia@gmail.com`) il codice accetta i nomi dedicati `META_APP_ID_ALESSIA`, `META_APP_SECRET_ALESSIA`, `META_BUSINESS_LOGIN_CONFIG_ID_ALESSIA`, `META_PAGE_ID_ALESSIA`, oppure le variabili legacy:
- `META_APP_ID` = `4396741380543813`
- `META_APP_SECRET` = App Secret, contrassegnato come segreto Netlify
- `META_BUSINESS_LOGIN_CONFIG_ID` = `1154907010348786`
- `META_PAGE_ID` = `105505198156981`
- `META_CAMPAIGN_NAME_ALESSIA` (o `META_CAMPAIGN_NAME`) = `UGC moduli`

Comuni ai due account:
- `META_REDIRECT_URI` = `https://rymanager.netlify.app/.netlify/functions/meta-oauth-callback`
- `META_WEBHOOK_VERIFY_TOKEN` = stringa casuale scelta da te
- `META_GRAPH_VERSION` = `v27.0` (allineata alla versione dei webhook configurata)
- `FRONTEND_URL` = `https://pm.retiredyoung.it/` (destinazione dopo il callback OAuth; il callback Meta resta su Netlify)
- `FIREBASE_SERVICE_ACCOUNT_JSON_B64` = service-account JSON Firebase codificato Base64

Le Functions leggono le variabili con `process.env`. Dopo aver cambiato una variabile, fare un nuovo deploy.

## Firebase service account
Firebase Console → Project settings → Service accounts → Generate new private key.
NON mettere il JSON nel repository o nel frontend. Convertire il file JSON in Base64 e usare il risultato come `FIREBASE_SERVICE_ACCOUNT_JSON_B64`.

## Meta
Redirect URI:
`https://rymanager.netlify.app/.netlify/functions/meta-oauth-callback`

Entrambe le Meta App usano questo callback Netlify come redirect URI; dopo l'autorizzazione, l'utente torna a `FRONTEND_URL`.

Webhook:
`https://rymanager.netlify.app/.netlify/functions/meta-webhook`

Object: `Page`
Field: `leadgen`

Il valore di `META_WEBHOOK_VERIFY_TOKEN` deve coincidere con il Verify Token usato da Meta quando la configurazione del webhook sarà sbloccata.

## Firestore collections usate
- `meta_oauth_states/{state}`
- `meta_connections/{uid}`
- `meta_pages/{pageId}`
- `meta_leads/{leadId}`
- `prospects/{prospectId}`

`meta_pages/{pageId}` associa una Page Meta al corretto UID Prospect Manager e all’account proprietario dell’app che ha firmato il webhook. Ogni lead viene salvato nell’account Firebase che ha autorizzato quella pagina.

## Importante
Questo è il backend di integrazione. Prima di produzione bisogna testare OAuth, Page discovery, webhook verification, test lead, mapping Page→UID e deduplicazione.
