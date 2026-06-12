# Tele Venture Capital 3000

Browser game ironico-didattico in stile Televideo RAI anni '90: gestisci un
fondo VC da 100M€ per 5 anni navigando **solo per numeri di pagina**, come nel
teletext originale. Niente mouse: digiti un numero, premi INVIO.

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
| ESC | torna alla home (pag 100) |
| M | toggle audio |

## Mappa delle pagine

| Pagina | Contenuto |
|---|---|
| 100 | Home / indice |
| 101–109 | Nuovo fondo, riprendi, regole, gestione save |
| 105 | Sigla d'apertura (parte su nuovo fondo, rivedibile) |
| 110–119 | Ultim'Ora (+ dettagli anni 2-5 su 211+, 311+, 411+, 511+) |
| 120–139 | Politica & Regolazione |
| 140–159 | Borsa & indici settoriali (live, signal inclusi) |
| 160–179 | Cronaca Startup |
| 180–189 | Corporate Watch |
| 200 | Dealflow dell'anno (3 startup, stato delibera) |
| 301–303 | PITCH BATTLE (deal pendente) / scheda consultazione (deliberato) |
| 400 | Portfolio (attive + chiuse) |
| 450 | Follow-on round (pro-rata / raddoppio / diluizione) |
| 500 | IC Moment / chiusura anno (effetti news + exit) |
| 600 | LP Call (4 archetipi di LP) |
| 700 / 701 | Report finale / post-mortem |
| 800 | Classifica locale |
| 900 | Crediti & easter egg |

## Struttura del progetto

```
index.html            entry unico, carica gli script in ordine
css/televideo.css     palette teletext, griglia 40×24, header/footer
js/main.js            router pagine + input tastiera
js/state.js           gameState, save/load LocalStorage, seed, migrazioni
js/data/              contenuti: startups, newsCalendar (signal inclusi),
                      exitEvents, lpProfiles, lpCalls, sectorIndices, titles,
                      pitches (copy qualitativo), founderSprites (pixel art)
js/engine/            marketEngine (signal→effetti), dealflow (pesca HOT/
                      TRAP/NEUTRAL), scoring (MOIC/DPI/score), audio
js/pages/             una funzione render per pagina
js/ui/                render monospace, header, effetto loading
tests/run.js          test del motore (node, zero dipendenze)
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
- **Edge informativo**: se il giocatore ha letto una news di settore
  dell'anno, sulla scheda startup compare il "dossier" e la DD costa metà
  rivelando sia il rischio sia l'upside.
- DD e negoziazioni usano un RNG deterministico legato al `gameSeed`
  (`TVState.roll`): ricaricare il save non cambia gli esiti.
- **Resa CRT 4:3**: come sui TV veri, le 40 colonne del teletext sono
  stirate in orizzontale fino al 4:3 (`--stretch` in `televideo.css`):
  caratteri larghi, vetro bombato, scanline e griglia RGB.
- **PITCH BATTLE**: aprire una startup pendente (301-303) fa partire la
  battaglia a turni col founder — arena stile console portatile anni
  '90: sprite pixel-art 18×9 del founder (palette estesa con tono
  pelle) sulla sua pedana in alto a destra, targhetta incorniciata
  `Stage Lv.<valuation>`, tu di spalle in basso a sinistra, idle bob,
  dialog box bordata, musica in loop. Gli sprite
  (`js/data/founderSprites.js`) sono il tipo del founder: si imparano
  a riconoscere partita dopo partita. Tutte le azioni vivono nella
  battle: domande (1-4, con debolezza/parata per `founderProfile`),
  DD, ref call, negoziazione (più la guardia è bassa più funziona),
  co-invest, passa, investi (term sheet 1/3/5M). Credibilità a zero =
  fuori dal round, deal perso (e il tuo sprite crolla). La debolezza
  si deduce dal pitch qualitativo (`js/data/pitches.js`) o dalla ref
  call. Lo stato della battaglia si salva a ogni turno (`rv.snap`):
  niente retry da save.
- **LP Call**: triggerate dalle condizioni di portfolio
  (`js/data/lpCalls.js`). Quando una call è attiva, le pagine principali
  mostrano il banner lampeggiante "((( LP IN LINEA )))"; chiudere l'anno
  senza rispondere chiede conferma e costa satisfaction.

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

24 test su stato iniziale, dealflow, decisioni, scoring, exit/write-off,
pitch battle, sprite e integrità dei dati. Vanno eseguiti prima di ogni
commit che tocca il motore.

## Deploy su GitHub Pages

1. Push del repo su GitHub.
2. Settings → Pages → Source: branch `master`, cartella `/ (root)`.
3. Il gioco è completamente statico: nessuna configurazione ulteriore.

Nota: il font VT323 è caricato da Google Fonts con fallback monospace; offline
l'estetica degrada con grazia ma il gioco funziona.
