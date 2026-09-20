# ProTracker V22

Fix posizionamento Destra/Sinistra nella Dashboard Team.

- Risolto il bug per cui il root/utente loggato non è presente nella cache della downline e quindi i membri diretti non venivano riconosciuti come appartenenti alla sua struttura.
- La risoluzione della gamba usa `uplineUid` anche quando il genitore non è presente nella cache locale.
- Il posizionamento resta personale: viene salvato nel `teamLayout` dell'utente loggato.
- Valido per qualsiasi membro/leader, non solo Nicola.
