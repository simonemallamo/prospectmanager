# V16 — Posizionamento indipendente per utente

- Il posizionamento visualizzato da Dashboard Team e Network Tree viene salvato nel campo `personalLayout` del documento dell'utente che sta effettuando la modifica.
- Il Network Tree non modifica più `legMap`, `uplineUid` o `uplinePath`.
- Dashboard Team: Sinistra/Destra, riordino e drag & drop modificano solo il `personalLayout` dell'utente corrente.
- Network Tree: drag & drop e Open modificano solo il `personalLayout` dell'utente corrente.
- La relazione reale di downline (`uplineUid`) resta invariata.
- Compatibilità con i vecchi `legMap[viewerUid]`: viene letto come fallback per non perdere le posizioni già esistenti.
- I membri selezionabili restano limitati alla downline reale dell'utente corrente.
- Sintassi JavaScript verificata con `node --check`.
