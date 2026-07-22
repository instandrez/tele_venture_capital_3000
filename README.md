# Tele Venture Capital 3000

Browser game ironico-didattico in stile Televideo RAI anni '90: gestisci un
fondo VC da 100M€ in una **Quick Run** da 3 anni, 3 deal/anno, oppure in
**Partner Mode** da 3 anni, 5 deal/anno, con 90M€ investibili dopo le fee,
navigando
**solo per numeri di pagina**, come nel
teletext originale. Puoi digitare i numeri o cliccare/tappare i controlli
numerici: la tastiera resta il ritmo principale, il touch non deve tradire.

**[Gioca online](https://instandrez.github.io/tele_venture_capital_3000/)**

Il cuore del gioco è il **motore di news**: il Televideo è pieno di pagine
(ultim'ora, politica, borsa, cronaca startup, corporate watch) e nessuna è lì
per caso. Chi legge e incrocia le informazioni costruisce il portfolio
migliore; chi investe alla cieca scopre a fine anno cosa diceva la pagina che
non ha mai aperto. La dinamica è ispirata a Markstrat: l'edge è informativo.

## Avvio locale

Serve un qualsiasi server statico (i moduli sono `<script>` semplici, nessuna
build):

```
python -m http.server 5173
# poi apri http://localhost:5173
```

## Comandi di gioco

| Tasto | Azione |
|---|---|
| `0-9` + INVIO | naviga a pagina / esegue azione contestuale |
| `0-9` in Pitch Battle | esegue subito la mossa, senza INVIO |
| click/tap su un numero | stessa azione del tasto numerico |
| un tasto durante una scena Battle | accelera oppure continua dopo la lettura |
| ESC | torna alla home (pag 100) |
| M | toggle audio |

## Mappa delle pagine

| Pagina | Contenuto |
|---|---|
| 000 | Start Game / schermata titolo arcade |
| 100 | Home / indice |
| 101–109 | Nuovo fondo, riprendi, regole, gestione save |
| 105 | Tutorial / sigla d'apertura: al termine torna alla home 100 |
| 110–119 | Ultim'Ora (+ dettagli anni 2-3 su 211+, 311+) |
| 120–139 | Politica & Regolazione |
| 140–159 | Borsa & indici settoriali (live, signal inclusi) |
| 160–179 | Cronaca Startup |
| 180–189 | Corporate Watch |
| 190 | Taccuino del GP: casi, ritagli trovati e ipotesi |
| 200 | Dealflow dell'anno (3 startup in Quick Run, 5 in Partner Mode) |
| 301–305 | PITCH BATTLE (deal pendente) / scheda consultazione (deliberato) |
| 400 | Portfolio (attive + chiuse) |
| 450 | Follow-on round + chiusura anno (pro-rata / raddoppio / diluizione) |
| 460 | Portfolio Update di fine anno (effetti news + exit) |
| 500 | redirect legacy alla chiusura anno |
| 600 | LP Call (4 archetipi di LP) |
| 620 | Portfolio Call (crisi/opportunità di una partecipata) |
| 700 / 701 | Report finale / post-mortem |
| 800 | Classifica locale |
| 900 | Crediti & easter egg |
| 910–941 | Fonti private sbloccate dalle catene investigative |

## Struttura del progetto

```
index.html            entry unico, carica gli script in ordine
css/televideo.css     palette teletext, griglia wide 56 colonne, console mode
css/visual-overrides.css
                      solo interventi grafici caricati per ultimi
js/main.js            router pagine + input tastiera
js/state.js           gameState, save/load LocalStorage, seed, migrazioni
js/data/              contenuti: startups, newsCalendar (signal inclusi),
                      exitEvents, lpProfiles, lpCalls, sectorIndices, titles,
                      pitches (copy qualitativo), founderSprites (pixel art)
js/engine/            marketEngine (signal→effetti), intelligence (prove/
                      teorie), lpRelations, dealflow, scoring e audio
js/pages/             una funzione render per pagina
js/ui/                render monospace, header, effetto loading
tests/run.js          test del motore (node, zero dipendenze)
GAMEPLAY_MECHANICS_MAP.md
                      mappa passo-passo di flussi, script e leve di design
```

## Come funziona il motore (per chi scrive contenuti)

- Ogni news in `newsCalendar.js` può avere un `signal`:
  `{ sector, delta, materializeYear, type, scope }`. Il giocatore vede solo il
  testo; il motore applica il delta a fine `materializeYear`.
- I `type` granulari (`regulation`, `founder_risk`, `corporate_opp`...)
  colpiscono solo le startup il cui `sectorTag` / `corporateFitTag` matcha lo
  `scope` (es. la regolazione AI colpisce `AI_FOUNDATION`, non `AI_INFRA`).
- Gli eventi di liquidità sono scriptati in `exitEvents.js` e allineati alle
  news di Cronaca: chi legge sa in anticipo chi esce bene e chi muore.
  La run pubblica di default e la Partner Mode usano entrambe la timeline
  completa a 3 anni, con un numero diverso di deal per anno.
  La timeline è compressa sul fondo a 3 anni: l'anno 2 porta il primo
  assaggio di liquidità, l'anno 3 è la stagione del raccolto (exit, IPO
  e write-off arrivano tutti prima del report finale).
- **Stagione pubblica**: la Quick Run mostra al massimo 3 ritagli utili per
  deal. Le news anno 4+ restano nel calendario come materiale espansione, ma
  non sono registrate come pagine navigabili nella build pubblica attuale.
- **Taccuino investigativo**: pagina 190 non indica più sezioni o news da
  leggere. Pone una domanda ambigua per ogni deal e registra soltanto i
  ritagli già scoperti. Ogni ritaglio ha una firma investigativa
  (Mercato, Contesto, Regole, Persone, Exit): le prove dirette valgono più
  del contesto generico. A 3 punti nasce una teoria, con DD scontata,
  coperture e una domanda armata nella Pitch Battle. La domanda armata
  infligge un `DOSSIER STRIKE` una tantum e blocca la replica del founder.
  Le letture danno anche un bonus progressivo alla negoziazione.
  In Quick Run MARTA, l'analista, suggerisce una prossima pista utile senza
  risolvere il caso: serve a tenere la run breve e leggibile.
- **Catene investigative**: una teoria con almeno due firme diverse
  (Mercato, Regole, Persone, Exit o Contesto) può aprire una pagina interna
  9xx. Il giocatore deve annotarla e navigarci manualmente. Verificare la
  fonte rivela un rischio privato, aggiunge una copertura, porta il Dossier
  Strike a 3 danni extra e riduce la DD a 25k.
- **Matematica del fondo**: i 100M sono commitments; 10M coprono fee e
  struttura, 90M sono dry powder. I ticket dipendono dallo stage
  (Pre-seed 2/4/6M, Seed 3/6/9M, Series A 5/8/12M), la quota è calcolata
  post-money e il gioco mostra un target di deployment crescente ogni anno.
  Il deployment pesa anche nel punteggio finale.
- DD e negoziazioni usano un RNG deterministico legato al `gameSeed`
  (`TVState.roll`): ricaricare il save non cambia gli esiti.
- **Scocca CRT responsive**: il televisore occupa quasi tutto il viewport;
  scanline, maschera RGB, vignettatura e LED restano un trattamento visivo,
  senza imporre al contenuto i limiti fisici di un vero Televideo.
- **Televideo wide**: le pagine informative usano una griglia da 56 colonne
  e un'area di lettura più ampia. Titoli, nomi e tabelle respirano senza
  perdere font, palette e ritmo del teletext.
- **Doppia modalità visiva**: le pagine informative restano un hub
  Televideo ampio e leggibile; sigla e Pitch Battle passano a una
  `console mode` 16:9 che usa quasi tutto il viewport.
- **Tutorial cinematic in-engine**: pagina 105 con fondale pixel-art,
  camera lenta, titoli e avanzamento automatico. Introduce news, dealflow,
  taccuino, pitch battle come leva negoziale, term sheet, portfolio,
  classifica e LP. Non è un MP4: resta nitida,
  adattabile e controllabile con `1` / `0`.
  Fine sigla e skip portano alla pagina 100, che resta l'ingresso canonico
  della Quick Run.
- **Start screen a due modalità**: la schermata 000 propone Quick Run come
  default pubblico e Partner Mode come versione completa per chi vuole più
  deal, più news e più occasioni di farsi male.
- **Navigatore FastText**: la banda colorata porta a Home, News, Taccuino,
  Dealflow, Portfolio e LP Call. Evidenzia l'area corrente ed è cliccabile;
  la navigazione numerica resta il controllo principale.
- **Logo VC3000** a blocchi pixel (sigla 105), stile copertina cartuccia.
- **PITCH BATTLE**: aprire una startup pendente (301-303 in Quick Run,
  301-305 in Partner Mode) fa partire la
  battaglia a turni col founder — boardroom panoramica stile SNES,
  personaggi DOM pixel-art scalabili, HUD separati, camera arcade,
  idle bob e dialog box bordata. L'HUD distingue
  **Resistenza founder** (a zero rivela la verità e porta il leverage al massimo) e **Controllo sala**
  (a zero perdi il deal — succede davvero). Il contrattacco del founder
  cresce col passare dei turni (-1, poi -2, poi -3) e colpisce anche
  sulla parata: chi tira a caso rischia la sala, chi ha letto il
  Televideo entra con scudi e domanda armata e chiude in tre turni. Gli sprite
  (`js/data/founderSprites.js`) sono il tipo del founder: si imparano
  a riconoscere partita dopo partita. Tutte le azioni vivono nella
  battle: domande (1-4, con debolezza/parata per `founderProfile`),
  DD, ref call, negoziazione (più leverage hai più funziona),
  co-invest, passa, investi (tre ticket coerenti con lo stage). Controllo sala a zero =
  fuori dal round, deal perso (e il tuo sprite crolla). La debolezza
  si deduce dal pitch qualitativo (`js/data/pitches.js`) o dalla ref
  call. Colpi, parate, reazioni e contrattacchi importanti restano fermi
  finché il giocatore non preme un tasto: le animazioni brevi si possono
  accelerare, ma il comando non viene accodato come mossa successiva.
  Lo stato della battaglia si salva a ogni turno (`rv.snap`): niente retry
  da save.
- **Deal memo post-battle**: dopo invest/pass/deal perso il memo spiega in due
  righe se la decisione era alpha, disciplina o FOMO. La schermata genera
  anche una memo-card visuale pensata per screenshot social.
- **LP Call**: triggerate dalle condizioni di portfolio
  (`js/data/lpCalls.js`). Quando una call è attiva, le pagine principali
  mostrano il banner lampeggiante "((( LP IN LINEA )))"; chiudere l'anno
  senza rispondere chiede conferma e costa satisfaction.

- **Portfolio Call**: cambiano per archetipo, non solo per startup:
  round quasi chiuso da sei mesi, governance da aperitivo, procurement eterno,
  plant visit del Nordest, bando minuscolo e bridge/burn alert. Il bersaglio
  è il VC italiano allusivo: family office, corporate innovation, anchor
  pubblico, comitati e portali, senza nomi reali.

### Aggiungere una startup

Aggiungi un oggetto a `js/data/startups.js` (vedi i campi commentati in
testa al file). I nomi sono in inglese, allusivi, mai brand reali.

### Aggiungere una news

Aggiungi un oggetto a `js/data/newsCalendar.js` con `page` univoca e corpo di
max ~36 caratteri per riga. Se ha un `signal`, verifica che `sector` esista in
`sectorIndices.js`.

## Test

```
node tests/run.js
```

92 test su render, input, stato iniziale, migrazioni, relazioni LP, fund math,
dealflow, Intelligence Network, deal access, eventi post-battle,
decisioni, scoring, exit/write-off, pitch battle, sprite e integrità dei dati
(inclusi: exit raggiungibili nei 3 anni, signal senza orfani e mark
d'ingresso dallo sconto negoziato).
Vanno eseguiti prima di ogni
commit che tocca il motore. La stessa suite gira in CI su ogni push/PR
verso `master` (`.github/workflows/ci.yml`).

La direzione grafica e sonora corrente è descritta in
[`ART_DIRECTION_BRIEF.md`](ART_DIRECTION_BRIEF.md): "VC3000: Teletext Cartridge",
una sintesi tra Televideo, NES e Sega Master System.

## Deploy su GitHub Pages

1. Push del repo su GitHub.
2. Settings → Pages → Source: branch `master`, cartella `/ (root)`.
3. Il gioco è completamente statico: nessuna configurazione ulteriore.

Nota: il font VT323 è caricato da Google Fonts con fallback monospace; offline
l'estetica degrada con grazia ma il gioco funziona.

## Licenza

Rilasciato con licenza [MIT](LICENSE).
