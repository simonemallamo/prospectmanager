# RY Manager — Meta Lead Ads backend

Questi file sono aggiuntivi: non sostituiscono `index.html` e non toccano la V2 di backup.

## Files
- `netlify/functions/_firebase-admin.mjs`
- `netlify/functions/meta-oauth-start.mjs`
- `netlify/functions/meta-oauth-callback.mjs`
- `netlify/functions/meta-webhook.mjs`
- `package.json`

## Netlify Environment Variables
Impostare:
- `META_APP_ID` = App ID della Meta App RY Manager
- `META_APP_SECRET` = App Secret
- `META_BUSINESS_LOGIN_CONFIG_ID` = Business Login Configuration ID
- `META_REDIRECT_URI` = `https://rymanager.netlify.app/.netlify/functions/meta-oauth-callback`
- `META_WEBHOOK_VERIFY_TOKEN` = stringa casuale scelta da te
- `META_GRAPH_VERSION` = versione Graph API attiva/supportata dalla tua app
- `APP_URL` = `https://rymanager.netlify.app`
- `FIREBASE_SERVICE_ACCOUNT_JSON_B64` = service-account JSON Firebase codificato Base64

Le Functions leggono le variabili con `process.env`. Dopo aver cambiato una variabile, fare un nuovo deploy.

## Firebase service account
Firebase Console → Project settings → Service accounts → Generate new private key.
NON mettere il JSON nel repository o nel frontend. Convertire il file JSON in Base64 e usare il risultato come `FIREBASE_SERVICE_ACCOUNT_JSON_B64`.

## Meta
Redirect URI:
`https://rymanager.netlify.app/.netlify/functions/meta-oauth-callback`

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

`meta_pages/{pageId}` associa una Page Meta al corretto UID RY Manager. Questo evita di legare i lead al Business Manager di Simone.

## Importante
Questo è il backend di integrazione. Prima di produzione bisogna testare OAuth, Page discovery, webhook verification, test lead, mapping Page→UID e deduplicazione.
