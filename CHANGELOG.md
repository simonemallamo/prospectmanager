# V17 — Base corretta: ultima versione bilingue + posizionamento indipendente

Questa versione parte dalla **V15**, cioè dalla versione bilingue italiano/spagnolo con la grafica e il tema Light/Dark già presenti.

## Preservato dalla V15
- Selettore lingua **IT / ES**.
- Traduzione italiana/spagnola esistente.
- Grafica originale.
- Tema **Light / Dark**, compresa la barra superiore chiara nella modalità White.
- Network Tree personale, modal “Gestisci posizione”, reset e funzioni già presenti.
- Firebase config e resto dell'applicazione.

## Correzione richiesta
- La Dashboard Team ora salva il posizionamento nel campo `personalLayout` del documento dell'utente che sta effettuando la modifica.
- Non vengono più scritti da Dashboard Team `legMap`, `legOrder`, `uplineUid` o `uplinePath` per cambiare la posizione personale.
- Il posizionamento di Simone, di un altro Leader e di un altro membro è indipendente.
- Il Network Tree continua a usare il proprio layout personale separato (`networkLayout`).
- Compatibilità: i vecchi `legMap` vengono letti come fallback, senza sovrascriverli.
- Backup/Ripristino Dashboard salvano/ripristinano il `personalLayout` dell'utente corrente.

JavaScript verificato con `node --check`.
