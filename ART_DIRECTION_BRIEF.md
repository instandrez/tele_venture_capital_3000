# VC3000 - Art Direction Brief

## Stato attuale

Il gioco ha gia un loop completo con Quick Run da 2 anni e Partner Mode da
3 anni: dealflow, news con segnali,
Pitch Battle, due diligence, negoziazione, portfolio, follow-on, LP call,
eventi di liquidita, report finale e leaderboard locale.

La base tecnica e solida:

- HTML, CSS e JavaScript vanilla, senza build
- navigazione solo da tastiera e salvataggio LocalStorage
- 80 test automatici verdi
- sprite founder, animazioni a turni e audio Web Audio generato in tempo reale

## Problema percepito

La UI comunica bene "Televideo", ma non ancora una console precisa. CRT
realistico, teletext, Game Boy e colori arcade convivono senza una gerarchia
unica. Anche l'audio usa timbri retro, ma manca una firma sonora riconoscibile:
il loop e brillante, fitto e poco separato dagli effetti.

## Direzione scelta

**VC3000: Teletext Cartridge**

Una cartuccia gestionale europea dei primi anni '90, a meta tra NES e Sega
Master System, trasmessa attraverso un terminale Televideo.

Principi:

- nero e navy come base, con ciano, giallo e magenta come colori identitari
- cornici nette, profili rettangolari e ombre a scatto, non UI moderna
- una palette limitata e coerente tra schermate, sprite e feedback
- logo VC3000 sempre riconoscibile
- animazioni brevi a step: wipe, reveal, shake, flash
- audio PSG: due canali pulse, basso triangle e noise percussivo
- testo sempre leggibile; CRT e scanline devono aggiungere atmosfera, non blur

## Priorita

1. Consolidare la cornice console e la gerarchia di header, pagina e comandi.
2. Dare a home e sigla l'impatto di una schermata titolo da cartuccia.
3. Rendere Pitch Battle il picco visivo e sonoro dell'esperienza.
4. Differenziare i suoni di input, pagina, successo, errore e battaglia.
5. In una passata successiva, ampliare sprite e scene senza perdere la griglia
   Televideo da 40 colonne.

## Prima passata

Questa iterazione introduce:

- fix del centraggio del testo colorato
- identita di sezione e transizione pagina a step
- scocca console piu netta con skyline pixel sullo sfondo
- nuova schermata home e sigla piu vicine alle reference
- sound engine chiptune riscritto con bus separati e timing schedulato

## Evoluzione console mode

La seconda passata rimuove il vincolo Televideo dalle scene che hanno bisogno
di regia:

- hub Televideo ampliato fino a quasi tutto il viewport
- contenuti centrati ma non piu compressi in un piccolo CRT 40x22
- opening cinematic 16:9 con fondale `assets/scenes/intro-office.png`
- Pitch Battle 16:9 con fondale `assets/scenes/pitch-boardroom.png`
- personaggi DOM a pixel reali, scalabili senza dipendere dai glifi del font
- HUD, dialoghi e menu indipendenti dalla vecchia griglia testuale

I fondali sono asset originali generati con il tool built-in di image
generation e poi integrati nel progetto; UI, personaggi, animazioni e logica
restano deterministici e controllati dal codice.

## Intelligence pass

La navigazione Televideo ora e' parte esplicita del gameplay:

- pagina 190 come taccuino dei tre casi dell'anno
- domande ambigue, ritagli scoperti e ipotesi imperfette
- nessuna indicazione esplicita su sezione, pagina o deal collegato
- news marcate come lette, con feedback generico "ritaglio archiviato"
- due tracce sbloccano DD scontata e una copertura in battle
- tre tracce danno due coperture
- i ritagli hanno firme e peso diversi: una macro generica non vale quanto
  una prova diretta su founder, regole o possibile exit
- una teoria corroborata arma una domanda contestuale in Pitch Battle
- il Dossier Strike infligge danno extra e impedisce la replica del founder
- report annuale distingue segnali letti e ignorati
- HUD battle rinominato in Guardia founder e Controllo sala
- flash ciano dedicato quando il dossier blocca un contrattacco
- banda FastText trasformata in navigatore principale cliccabile
- griglia informativa ampliata da 40 a 56 colonne
- taccuino chiarito con tutorial diegetico e MARTA, analista non assicurata
- colpi, parate e reazioni battle restano in pausa finche' il giocatore
  non conferma di aver finito di leggere

## Investigative chains e fund math

La terza passata rende l'esplorazione piu' simile a una piccola indagine:

- due firme diverse e almeno 3 punti di prova aprono un numero interno 9xx
- il numero va letto nel taccuino e digitato manualmente
- la fonte privata rivela un rischio, potenzia battle, DD e negoziazione
- ogni startup ha una catena raggiungibile senza indicare in anticipo le news
- 100M di commitments diventano 90M investibili dopo 10M di fee
- ticket stage-based e ownership post-money sostituiscono il vecchio 1/3/5M
- target annuale e deployment finale rendono visibile la disciplina di fondo

## Public demo pass

La quarta passata rende il gioco piu' breve, condivisibile e leggibile per
una nicchia VC italiana:

- Quick Run come default pubblico: 2 anni, 3 deal/anno
- Partner Mode opzionale: 3 anni, 5 deal/anno
- start screen canonico con scelta modalita' e naming del fondo; fine sigla e
  skip portano alla home 100, ingresso canonico della Quick Run
- Quick Run limitata a 3 ritagli utili per deal; anni 4+ tenuti come
  espansione non navigabile nella build pubblica
- MARTA guida la Quick Run con una pista utile senza risolvere il caso
- deal memo post-battle con verdetto secco e memo-card visuale da screenshot
- modali in-cartridge per import/export save e classifica
- share card finale copiabile per chat e social
- portfolio call differenziate: round quasi chiuso, procurement eterno,
  plant visit del Nordest, bando minuscolo, governance e burn
- piu' archetipi LP e battute vicine al VC italiano, senza nomi reali
