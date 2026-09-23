# Tele Venture Capital 3000

Browser game ironico-didattico in stile Televideo RAI anni '90: gestisci un
fondo VC da 100M€ in una **Quick Run** da 3 anni, 3 deal/anno, oppure in
**Partner Mode** da 3 anni, 5 deal/anno, con 90M€ investibili dopo le fee,
navigando
**solo per numeri di pagina**, come nel
teletext originale. Puoi digitare i numeri o cliccare/tappare i controlli
numerici: la tastiera resta il ritmo principale, il touch non deve tradire.

**[Gioca online](https://instandrez.github.io/tele_venture_capital_3000/)**

Assessment, modifiche di gameplay e risultati dei test:
[`GAMEPLAY_ASSESSMENT.md`](GAMEPLAY_ASSESSMENT.md).

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
| 105 | Sigla in quattro scene: al termine porta al prossimo passo della run |
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
| 910–944 | Fonti private sbloccate dalle catene investigative |

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
tests/gameplay.js     regressioni di router, pagine e partite complete con DOM simulato
tests/balance.js      confronto riproducibile di strategie economiche
GAMEPLAY_ASSESSMENT.md
                      assessment della giocabilita', revisione e limiti verificati
GAMEPLAY_MECHANICS_MAP.md
                      guida di design storica con le leve da commentare
```

## Come funziona il motore (per chi scrive contenuti)

- Ogni news in `newsCalendar.js` può avere un `signal`:
  `{ sector, delta, materializeYear, type, scope }`. Il giocatore vede solo il
  testo; il motore applica il delta a fine `materializeYear`.
- I `type` granulari (`regulation`, `founder_risk`, `corporate_opp`...)
  colpiscono solo le startup il cui `sectorTag` / `corporateFitTag` matcha lo
  `scope` (es. la regolazione AI colpisce `AI_FOUNDATION`, non `AI_INFRA`).
- Gli eventi di liquidità sono scriptati in `exitEvents.js` e allineati alle
  news di Cronaca. Fonti e domande aiutano a interpretare il rischio senza
  rivelare la tabella delle exit. Leggere non cambia il risultato di mercato.
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
  9xx, raggiungibile anche dal dealflow. Verificare la
  fonte rivela un rischio privato, aggiunge una copertura, porta il Dossier
  Strike a 3 danni extra e riduce la DD a 25k.
- **Matematica del fondo**: i 100M sono commitments; 10M coprono fee e
  struttura, 90M sono dry powder. I ticket dipendono dallo stage
  (Pre-seed 2/4/6M, Seed 3/6/9M, Series A 5/8/12M), la quota è calcolata
  post-money e il gioco mostra un target di deployment crescente ogni anno.
  Il deployment pesa anche nel punteggio finale.
- **Decisioni leggibili**: il term sheet mostra disponibilita' residua,
  concentrazione del ticket e accesso al round; la negoziazione espone chance
  e costo del rifiuto prima della proposta. DD, reference e co-invest condividono
  due slot per deal. Le news restano gratuite.
- **Mercato e rendimento**: i margini contano piu' dell'hype, il contesto non
  somma all'infinito titoli sullo stesso ciclo, pagare sopra l'ask penalizza
  il mark. La parte extra del premio exit matura con gli anni detenuti.
  Un'incertezza di esecuzione di circa ±10 punti e' fissata dal seed.
  Il report distingue MOIC dei ticket e valore dell'intero fondo, inclusi
  cassa, realizzato, NAV e fee. Entrambi contribuiscono al punteggio.
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
- **Sigla in-engine**: quattro scene introducono il mondo e la prima scelta,
  con fondale pixel-art, titoli e avanzamento automatico. `1` avanza e `0`
  salta. Entrambe portano al prossimo passo della run, direttamente al
  dealflow per una nuova partita. Le regole si imparano al tavolo.
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
  call. Ogni domanda produce un breve scambio: la risposta resta leggibile
  mentre tornano disponibili i comandi. Pitch e note sono riapribili.
  Le animazioni si possono accelerare senza accodare mosse. Lo stato e le
  conseguenze si salvano prima dell'animazione (`rv.snap`): niente retry da save.
- **Deal memo post-battle**: dopo invest/pass/deal perso il memo commenta
  prove, prezzo e rischio della scelta, lasciando il verdetto al mercato. La schermata genera
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
  Quick Run propone al massimo una nuova call per anno; Partner Mode due.
- **Ritmo della run**: «Riprendi il filo» indica il prossimo gesto; dal
  dealflow si apre una pista o il founder. La chiusura anno e' esplicita e
  mostra il costo delle LP call ignorate. Il recap non taglia le ultime exit.
  Dal finale si puo' rigiocare lo stesso mercato con scelte diverse.

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
node tests/gameplay.js
node tests/balance.js 300
```

92 test del motore e 24 regressioni gameplay su render, input, stato iniziale, migrazioni, relazioni LP, fund math,
dealflow, Intelligence Network, deal access, eventi post-battle,
decisioni, scoring, exit/write-off, pitch battle, sprite e integrità dei dati
(inclusi: exit raggiungibili nei 3 anni, signal senza orfani e mark
d'ingresso dallo sconto negoziato).
Vanno eseguiti prima di ogni
commit che tocca il motore. La stessa suite gira in CI su ogni push/PR
verso `master` (`.github/workflows/ci.yml`), insieme al benchmark economico.
Il benchmark confronta 1.800 scenari di strategie automatiche, senza follow-on
o telefonate: non rappresenta i tassi di vittoria di giocatori reali.
Le regressioni usano un DOM simulato, non sostituiscono il playtest visivo.

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
