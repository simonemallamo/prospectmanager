# ProTracker — aggiornamento architettura pulita

## Regola definitiva della struttura
- `users/{uid}.uplineUid` è la fonte di verità della struttura reale.
- Un nuovo iscritto tramite link referral viene collegato all'utente che ha generato quel link.
- `uplinePath` resta solo come campo di supporto/compatibilità e non decide la gamba personale.
- Admin modifica ruolo e Upline reale; non assegna più Sinistra/Destra.

## Posizionamento personale Dashboard Team
- Ogni utente/Leader organizza **solo i propri membri diretti**.
- La posizione personale è salvata in `users/{viewerUid}.teamLayout`.
- `teamLayout[directUid] = { leg: 'left'|'right', order }`.
- Spostare un Leader nella Dashboard del suo upline sposta solo quel ramo nella vista di quell'upline; non modifica la struttura reale e non modifica le posizioni personali degli altri Leader.
- I discendenti ereditano visivamente il ramo del loro diretto nella vista dell'upline.
- I vecchi campi `leg`, `legMap` e `legOrder` non vengono più usati per la Dashboard Team.

## Network Tree
- Rimane separato e personale tramite `networkLayout`.
- Non modifica mai `uplineUid`, `uplinePath`, `leg` o `legMap`.

## Dati esistenti
- Non è necessario modificare gli Upline esistenti.
- Non è necessario cancellare manualmente le vecchie posizioni prima dell'aggiornamento.
- Le vecchie `leg/legMap/legOrder` vengono ignorate dalla nuova Dashboard.
- Le vecchie chiavi `teamLayout` di utenti non direttamente gestibili vengono ignorate; il nuovo codice considera come posizionabili solo i diretti del viewer.
