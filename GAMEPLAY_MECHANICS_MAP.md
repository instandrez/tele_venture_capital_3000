# VC3000 - Guida Completa Modificabile Alle Meccaniche

Questo file e' il documento di controllo del gioco.

Non e' codice eseguito dal browser: il gioco non legge questo Markdown.
Serve a te per controllare, correggere, tagliare, riscrivere o commentare
ogni singola scelta di design senza dover cercare nei file JS/CSS.

Uso consigliato:
- modifica direttamente questo file;
- scrivi `CAMBIA:` sotto la regola/copy/valore che non ti convince;
- scrivi `TENERE:` se una cosa funziona;
- scrivi `TAGLIARE:` se una parte va eliminata;
- poi dimmi "applica la guida" e io porto le modifiche nei file veri.

Regola pratica:
- se vuoi cambiare regole, valori, probabilita', flussi o copy, parti da qui;
- se vuoi solo cambiare estetica, usa `css/visual-overrides.css`;
- se una cosa "non cambia a schermo", controllare sempre il cache-buster
  `?v=` in `index.html`.

---

## 0. Indice Delle Leve Principali

| Area | Valore attuale | Dove vive davvero | Se vuoi cambiarla |
|---|---:|---|---|
| Commitments fondo | 100M | `js/engine/fundMath.js`, `js/state.js` | cambia `COMMITMENTS` e stato iniziale |
| Fee/struttura | 10M | `js/engine/fundMath.js`, `js/state.js` | cambia `MANAGEMENT_FEES` e `managementFeeBudget` |
| Capitale investibile | 90M | derivato | se cambi fee, cambia anche stato/migrazioni |
| Quick Run | 2 anni, 3 deal/anno | `js/state.js` | `RUN_MODES.quick` |
| Partner Mode | 3 anni, 5 deal/anno | `js/state.js` | `RUN_MODES.partner` |
| News utili Quick Run | max 3 per deal | `js/engine/intelligence.js` | cap in `relevantNews()` |
| News utili Partner | max 6 per deal | `js/engine/intelligence.js` | cap in `relevantNews()` |
| Pitch guardia founder | 12 | `js/engine/pitchBattle.js` | `GUARD_MAX` |
| Credibilita GP | 6 | `js/engine/pitchBattle.js` | `CRED_MAX` |
| Weak move danno | -6 guardia | `js/engine/pitchBattle.js` | `applyMove()` |
| Neutral move danno | -3 guardia | `js/engine/pitchBattle.js` | `applyMove()` |
| Resist move danno | -2 credibilita | `js/engine/pitchBattle.js` | `applyMove()` |
| Dossier Strike | -2 o -3 guardia | `js/engine/intelligence.js`, `pitchBattle.js` | `leadPower` |
| DD costo base | 100k | `js/engine/intelligence.js` | `ddCost` |
| DD con teoria | 50k | `js/engine/intelligence.js` | `ddCost` |
| DD con fonte/caso solido | 25k | `js/engine/intelligence.js` | `ddCost` |
| Ref call | 50k | `js/pages/pitchLive.js` | `doRefCall()` |
| Co-invest | 100k | `js/pages/pitchLive.js` | `doCoInvest()` |
| Max ownership | 50% | `js/engine/fundMath.js` | `MAX_OWNERSHIP` |
| Follow-on trigger | mark >= 1.15x, 60% roll | `js/pages/followOn.js` | `offersForYear()` |
| Follow-on rinuncia | -15% posizione | `js/pages/followOn.js` | scelta `9` |
| Score finale MOIC | peso 35% | `js/engine/scoring.js` | formula `score` |
| Score finale DPI | peso 15% | `js/engine/scoring.js` | formula `score` |
| Score finale LP | peso 15% | `js/engine/scoring.js` | formula `score` |
| Score deployment | peso 15% | `js/engine/scoring.js` | formula `score` |

COMMENTI / CAMBIA:

---

## 1. Architettura Mentale Del Gioco

Pitch sintetico attuale:
- il giocatore gestisce un fondo VC satirico da 100M;
- legge news stile Televideo;
- incrocia segnali nascosti;
- incontra founder in Pitch Battle;
- investe, passa o perde allocation;
- gestisce portafoglio, LP e follow-on;
- chiude con score, titolo e report memabile.

Fantasy desiderata:
- "sono un GP italiano in un mercato assurdo, pieno di comitati, FOMO,
  bandi minuscoli, family office, procurement eterno e round quasi chiusi";
- il gioco deve far ridere per riconoscimento, non per spiegone;
- la bravura deve essere leggere segnali, non cliccare il numero giusto a caso.

Durata desiderata:
- Quick Run: breve, leggibile, social, 2 anni;
- Partner Mode: piu' lunga, piu' rumorosa, quasi director's cut.

Tono desiderato:
- dissacrante;
- allusivo, senza nomi reali;
- satira VC italiana;
- mai troppo didascalico;
- mai "manuale di investimento".

ANTI-PATTERN:
- spiegare al giocatore cosa pensare;
- ripetere portfolio call tutte uguali;
- schermate che sembrano moduli amministrativi veri;
- prompt nativi del browser;
- copy troppo lungo quando serve una battuta secca;
- UI "carina" ma non screenshottabile.

COMMENTI / CAMBIA:

---

## 2. File E Responsabilita'

### Entry e routing

| File | Responsabilita |
|---|---|
| `index.html` | carica CSS e script in ordine, cache-buster `?v=` |
| `js/main.js` | router, input numerico, click/tap, fast nav |
| `js/state.js` | stato partita, save/load, run mode, RNG deterministico |
| `js/ui/render.js` | render Televideo, render console mode, modali custom |

### Dati

| File | Responsabilita |
|---|---|
| `js/data/startups.js` | startup, attributi visibili/nascosti |
| `js/data/newsCalendar.js` | news e signal |
| `js/data/pitches.js` | pitch qualitativo per startup |
| `js/data/founderSprites.js` | sprite founder/player |
| `js/data/sectorIndices.js` | indici di borsa settoriali |
| `js/data/exitEvents.js` | exit, IPO, write-off, writedown scriptati |
| `js/data/lpProfiles.js` | archetipi LP |
| `js/data/lpCalls.js` | trigger e scelte LP call |
| `js/data/titles.js` | titoli finali satirici |

### Engine

| File | Responsabilita |
|---|---|
| `js/engine/dealflow.js` | selezione deal annuali |
| `js/engine/intelligence.js` | news rilevanti, taccuino, fonti 9xx |
| `js/engine/pitchBattle.js` | motore puro della battle |
| `js/engine/fundMath.js` | ticket, ownership, deployment |
| `js/engine/dealAccess.js` | accettazione term sheet |
| `js/engine/postBattleEvents.js` | evento automatico post battle |
| `js/engine/portfolioIncidents.js` | portfolio company call |
| `js/engine/lpRelations.js` | effetti scelte LP |
| `js/engine/marketEngine.js` | mark annuali, news, baseline, catalyst |
| `js/engine/yearEnd.js` | chiusura anno |
| `js/engine/scoring.js` | score finale |
| `js/engine/audio.js` | audio e mute |

### Pagine

| File | Pagine |
|---|---|
| `js/pages/intro.js` | 000, 105 |
| `js/pages/home.js` | 100 |
| `js/pages/fund.js` | 101-109 |
| `js/pages/newsSection.js` | 110, 120, 160, 180 e dettagli |
| `js/pages/borsa.js` | 140 e dettagli borsa |
| `js/pages/intelligence.js` | 190 |
| `js/pages/dealflow.js` | 200 |
| `js/pages/startupDetail.js` | 301-305 consultazione |
| `js/pages/pitchLive.js` | 301-305 battle live |
| `js/pages/portfolio.js` | 400 |
| `js/pages/followOn.js` | 450 |
| `js/pages/yearReview.js` | 460 |
| `js/pages/lpCall.js` | 600 |
| `js/pages/portfolioCall.js` | 620 |
| `js/pages/finalReport.js` | 700, 701 |
| `js/pages/leaderboard.js` | 800 |
| `js/pages/credits.js` | 900 |
| `js/pages/sourceDesk.js` | 910-941 |

COMMENTI / CAMBIA:

---

## 3. Stato Partita

Stato iniziale in `js/state.js`.

| Campo | Valore iniziale | Cosa significa | Modificato da |
|---|---:|---|---|
| `version` | 6 | versione save | migrazioni |
| `year` | 1 | anno corrente | year-end |
| `runMode` | quick | quick/partner | start screen |
| `maxYear` | 2 quick / 3 partner | durata run | run mode |
| `dealsPerYear` | 3 quick / 5 partner | deal annui | run mode |
| `gameSeed` | random | seed RNG deterministico | nuova partita |
| `gameStarted` | false | abilita salvataggio | new game |
| `fundSize` | 100M | commitments | iniziale |
| `investableCapital` | 90M | dry powder | iniziale |
| `managementFeeBudget` | 10M | fee/struttura | iniziale |
| `cash` | 90M | cassa investibile | investimenti, call |
| `invested` | 0 | capitale investito | investimenti/follow-on |
| `realized` | 0 | cash distribuito da exit | year-end |
| `reputation` | 50 | reputazione GP | scelte |
| `innovationImpact` | 50 | impatto/innovazione | scelte |
| `lpSat` | 50 ciascuno | soddisfazione LP | LP/call/exit |
| `researchSpent` | 0 | DD/ref/costi extra | DD, ref, events |
| `portfolio` | [] | posizioni | invest/follow-on/year-end |
| `portfolioCatalysts` | [] | mark futuri da eventi | post-battle |
| `seenStartups` | [] | startup gia viste | dealflow |
| `readPages` | [] | news lette | router |
| `investigationSources` | {} | fonti contattate | sourceDesk |
| `dealDecisions` | {} | pending/invest/pass | battle |
| `followOnCache` | {} | offerte follow-on anno | followOn |
| `portfolioIncidentCache` | {} | call portfolio anno | portfolioIncidents |
| `usedLPCalls` | [] | LP call gia usate | lpCall/yearEnd |
| `history` | [] | log per report | tutti gli eventi |
| `currentPage` | 100 | pagina corrente | router |
| `gameOver` | false | fondo chiuso | yearEnd |

RNG:
- `TVState.roll(key)` combina `gameSeed + key`;
- stesso save + stessa key = stesso esito;
- impedisce save-scumming su DD, term sheet, follow-on, eventi.

COMMENTI / CAMBIA:

---

## 4. Mappa Pagine E Flusso Navigazione

| Pagina | Nome | Scopo | Azioni principali |
|---:|---|---|---|
| 000 | Start screen | scelta Quick/Partner, nomi | start run |
| 100 | Home | indice canonico | news, taccuino, dealflow |
| 101 | Nuovo fondo | nuova run | quick/partner |
| 102 | Riprendi | load save | ripresa |
| 103 | Regole | istruzioni | lettura |
| 105 | Sigla/tutorial | intro cinematica | `1` avanti, `0` skip |
| 109 | Save/import | gestione save | modali custom |
| 110 | Ultim'Ora | lista news | dettagli |
| 120 | Politica/Regole | lista news | dettagli |
| 140 | Borsa | indici + news | dettagli |
| 160 | Cronaca Startup | lista news | dettagli |
| 180 | Corporate Watch | lista news | dettagli |
| 190 | Taccuino GP | prove, casi, fonti | leggi, vai a fonti |
| 200 | Dealflow | startup anno | 301-305 |
| 301-305 | Startup/Battle | pitch live o scheda | battle, invest/pass |
| 400 | Portfolio | posizioni attive/chiuse | consultazione |
| 450 | Follow-on | offerte anno | pro-rata/raddoppia/rinuncia |
| 460 | Portfolio Update | mark/exits | continua/finale |
| 600 | LP Call | call LP | 1/2/3 risposta |
| 620 | Portfolio Call | crisi/opportunita portco | 1/2/3 risposta |
| 700 | Report finale | score | save leaderboard/share |
| 701 | Post-mortem | cosa non hai letto | analisi |
| 800 | Classifica | leaderboard locale | consultazione |
| 900 | Crediti | crediti/easter egg | consultazione |
| 910-941 | Fonte riservata | linea interna | contatta fonte |

Regola canonica attuale:
- fine sigla o skip porta sempre alla pagina `100`;
- Quick Run non deve saltare direttamente a `200`;
- `100` e' il primo vero schermo pubblico dopo l'intro.

COMMENTI / CAMBIA:

---

## 5. Modalita Run

File veri:
- `js/state.js`
- `js/engine/dealflow.js`
- `js/engine/intelligence.js`
- `js/pages/intro.js`
- `js/pages/fund.js`

### Quick Run

Valori:
- `runMode`: `quick`
- `maxYear`: 2
- `dealsPerYear`: 3
- news rilevanti per deal: 3
- promessa: partita breve, satirica, leggibile, pubblicabile.

Effetto:
- meno deal;
- meno news;
- meno rumore;
- piu' importante che ogni call/evento sia diverso e memorabile.

### Partner Mode

Valori:
- `runMode`: `partner`
- `maxYear`: 3
- `dealsPerYear`: 5
- news rilevanti per deal: 6
- promessa: director's cut, piu' rumore, piu' portafoglio.

COMMENTI / CAMBIA:

---

## 6. Startup

File vero:
- `js/data/startups.js`

Ogni startup contiene campi visibili e nascosti.

### Campi visibili

| Campo | Esempio | Uso |
|---|---|---|
| `id` | `neurodrive` | chiave unica, usata ovunque |
| `name` | `NeuroDrive.ai` | nome mostrato |
| `sector` | `AI Mobility` | label pubblica |
| `stage` | `Seed` | influenza ticket/dealflow/heat |
| `valuation` | 12000000 | pre-money ask iniziale |
| `team` | 8 | mostrato/sapore |
| `traction` | 3 | dealflow, heat |
| `hype` | 9 | dealflow, heat, hype decay |
| `strategicFit` | 7 | mostrato/sapore |

### Campi nascosti

| Campo | Uso |
|---|---|
| `sectorTag` | granularita vera per news/portfolio call |
| `regulatoryExposure` | baseline e incident regolatori |
| `hypeDecay` | penalita dopo 2 anni se hype alto |
| `unitEconomics` | baseline mark e truth founder |
| `founderProfile` | profilo battle, incident, heat |
| `corporateFitTag` | corporate opportunity news |
| `hiddenRisk` | DD, source, portfolio call |
| `hiddenUpside` | DD, source, portfolio call |
| `era` | cluster contenutistico |

### Startup attuali

| ID | Nome | Tag | Stage | Profilo | Note di design |
|---|---|---|---|---|---|
| `neurodrive` | NeuroDrive.ai | AI_FOUNDATION | Seed | ego | AI hype + regulation risk |
| `foundergpt` | FounderGPT | AI_FOUNDATION | Pre-seed | red_flag | pivot/founder risk |
| `ragtag` | RagTag.ai | AI_INFRA | Seed | competent | infra piu solida |
| `agiordie` | AGIorDie | AI_FOUNDATION | Pre-seed | ego | valuation folle |
| `neuronote` | NeuroNote | LEGALTECH_VERTICAL | Seed | competent | winner legaltech |
| `promptlayer` | PromptLayer.io | AI_INFRA | Seed | hustle | devtools hype |
| `agentforge` | AgentForge | AI_FOUNDATION | Seed | ego | hype massimo |
| `saltcore` | SaltCore Energy | BATTERY_INDUSTRIAL | Series A | competent | industriale vero |
| `carbonhug` | CarbonHug | CLIMATE_SOFT | Seed | ego | climate soft/fuffa |
| `deepforge` | DeepForge Geothermal | CLIMATE_HARD | Seed | grit | hardtech paziente |
| `bluehydro` | BlueHydro | CLIMATE_HARD | Series A | competent | capital intensive |
| `greenrinse` | GreenRinse | CLIMATE_SOFT | Seed | red_flag | greenwashing |
| `humanoidops` | HumanoidOps | ROBOTICS_FRONTIER | Seed | ego | robot demo hype |
| `strongarm` | StrongArm Robotics | ROBOTICS_INDUSTRIAL | Series A | grit | fabbrica vera |
| `humanlessops` | HumanLessOps | ROBOTICS_INDUSTRIAL | Seed | hustle | industrial automation |
| `yachtbrain` | YachtBrain | MOBILITY_NICHE | Seed | red_flag | founder gossip |
| `evcharge24` | EVCharge24 | MOBILITY_INFRA | Series A | competent | infra mobility |
| `scootflow` | ScootFlow | MOBILITY_NICHE | Series A | hustle | consumer mobility |
| `starvista` | StarVista | SPACE_DUAL_USE | Series A | competent | space/defense |
| `dovesofwar` | DovesOfWar | SPACE_DEFENSE | Seed | grit | dual use satirico |
| `fortresslab` | FortressLab | CYBER_ENTERPRISE | Series A | competent | cyber winner |
| `ghostlog` | GhostLog | CYBER_INFRA | Seed | hustle | cyber infra |
| `invoicequick` | InvoiceQuick | SAAS_VERTICAL | Series A | grit | SaaS solido |
| `notarygpt` | NotaryGPT | LEGALTECH_VERTICAL | Seed | competent | legal AI |
| `legalcopilot` | LegalCopilot | LEGALTECH_HORIZONTAL | Pre-seed | first_time | early legal |
| `smartpolicy` | SmartPolicy | FINTECH_INSURTECH | Seed | competent | insurtech |
| `madbank` | MadBank | FINTECH_CONSUMER | Series A | hustle | fintech consumer |
| `crookedtoken` | CrookedToken | CRYPTO_RETAIL | Seed | red_flag | crypto trap |
| `spinall` | SpinAll | CONSUMER_GIG | Series A | red_flag | consumer/gig trap |
| `stealthmode` | StealthMode | UNKNOWN | Seed Ext. | ego | meme valuation |
| `exgoogler` | ExGoogler.ai | AI_INFRA | Seed | ego | credential hype |
| `pivotking` | PivotKing | UNKNOWN | Seed | red_flag | pivot joke |

### Come valutare una startup

Domande da farsi:
- ha un ruolo chiaro nella run?
- e' winner, trappola, meme o caso ambiguo?
- ha news collegate abbastanza leggibili?
- il founder profile si capisce dal pitch?
- il hiddenRisk e' scoperto in modo divertente?
- il hiddenUpside e' abbastanza specifico?

COMMENTI / CAMBIA:

---

## 7. News, Signal E Televideo

File veri:
- `js/data/newsCalendar.js`
- `js/pages/newsSection.js`
- `js/pages/borsa.js`
- `js/engine/intelligence.js`
- `js/engine/marketEngine.js`

Sezioni:

| Root | Sezione | Uso |
|---:|---|---|
| 110 | Ultim'Ora | macro, gossip, trend ampi |
| 120 | Politica & Regolazione | regulation, bandi, policy |
| 140 | Borsa | indici settoriali |
| 160 | Cronaca Startup | founder risk, startup news |
| 180 | Corporate Watch | corporate opportunity |

Schema news:

```js
{
  id: "y1-pol-01",
  year: 1,
  section: 120,
  page: 121,
  tone: "serious",
  headline: "...",
  body: ["...", "..."],
  signal: {
    sector: "AI",
    delta: -22,
    materializeYear: 2,
    type: "regulation",
    scope: "foundation_model"
  }
}
```

### Tipi di signal

| Type | Effetto |
|---|---|
| `trend` | effetto broad sul root sector |
| `macro` | effetto broad sul root sector |
| `regulation` | match preciso su sectorTag/scope, oppure effetto attenuato |
| `founder_risk` | solo startup specifica se `scope === startup.id` |
| `corporate_opp` | solo se `scope === corporateFitTag` |

### Conversione delta in mark

In `TVMarket.getSignalEffect()`:
- `trend` / `macro`: `delta / 100`;
- `regulation` match preciso: `delta / 100`;
- `regulation` non match + esposizione negativa: `delta * 0.5 / 100`;
- `regulation` non match + esposizione positiva: effetto inverso `-delta * 0.3 / 100`;
- `founder_risk`: `delta * 3 / 100` se startup specifica;
- `corporate_opp`: `abs(delta) * 2 / 100` se tag matcha.

### News visibili in lista

La lista non mostra tutte le 108 news.
Mostra news legate al dealflow corrente:
1. prende i deal dell'anno;
2. calcola news rilevanti per ogni deal;
3. deduplica pagine;
4. se non trova nulla, fa fallback su sector root;
5. se ancora niente, mostra 2 news della sezione.

### Lettura

Quando il router apre una pagina news:
- aggiunge `pageNum` a `state.readPages`;
- la pagina puo' diventare prova per uno o piu' deal;
- non serve premere "salva".

COMMENTI / CAMBIA:

---

## 8. Taccuino, Prove E Intelligence

File vero:
- `js/engine/intelligence.js`
- `js/pages/intelligence.js`

### Rilevanza news

`TVIntel.relevantNews(state, startup)`:
- considera solo news dell'anno corrente;
- se la startup e' in portfolio, usa l'anno di ingresso;
- ordina per priorita;
- limita il numero di news:
  - Quick Run: 3;
  - Partner Mode: 6;
- prova a garantire almeno 2 firme diverse.

### Firme investigative

| Firma | Fonti tipiche | Mossa battle suggerita |
|---|---|---|
| MERCATO | borsa/trend/corporate | 2 Competitor |
| CONTESTO | macro generica | 1 Numeri |
| REGOLE | politica/regolazione | 1 Numeri |
| PERSONE | founder risk/cronaca | 3 Team |
| EXIT | corporate watch | 2 Competitor |

### Peso prove

| Caso | Peso |
|---|---:|
| Effetto diretto su startup | 2 |
| Stesso root sector | 1 |
| Macro generica | 0.5 |

### Livelli taccuino

| Evidence score | Livello | Label | Effetto |
|---:|---:|---|---|
| 0 | 0 | CASO FREDDO | nessun vantaggio |
| >= 1 | 1 | APPUNTI | leggi ancora |
| >= 3 | 2 | TEORIA | DD scontata, shield, lead |
| >= 5 | 3 | CASO SOLIDO | piu shield, DD 25k |

### Bonus da taccuino

| Vantaggio | Formula |
|---|---|
| Shield battle | livello 2 = 1, livello 3 = 2, fonte +1 |
| DD cost | 100k base, 50k teoria, 25k caso solido/fonte |
| Negotiation bonus | min 25%, evidenceScore * 4% + fonte 8% |
| Dossier Strike | mossa lead, danno +2; con fonte +3 |

### Fonti riservate 9xx

Sblocco:
- score prove >= 3;
- almeno 2 firme diverse;
- startup nel dealflow corrente o portfolio attivo.

Pagina:
- `sourcePageFor(startup)` = `910 + index startup`;
- `sourceStartupByPage(9xx)` fa mapping inverso.

Effetto fonte contattata:
- salva `investigationSources[startup.id]`;
- DD costa 25k;
- Dossier Strike sale a 3;
- aggiunge shield;
- source forecast puo' vincolare il mark annuale.

Decisione di design:
- la fonte deve dare segnale grezzo;
- non deve scrivere "implicazione VC";
- non deve dire "investi/pass";
- il player deve inferire.

COMMENTI / CAMBIA:

---

## 9. Dealflow

File vero:
- `js/engine/dealflow.js`
- `js/pages/dealflow.js`

### Algoritmo attuale

1. Esclude startup gia viste (`seenStartups`).
2. Esclude startup gia in portfolio.
3. Calcola momentum settoriale dalle news dell'anno.
4. Divide pool in:
   - HOT: momentum > +5;
   - TRAP: momentum < -5;
   - NEUTRAL: tutto il resto.
5. Ordina ogni bucket con `stageScore + random seed`.
6. Pesca in ordine:
   - Quick Run: HOT, TRAP, NEUTRAL;
   - Partner Mode: HOT, TRAP, NEUTRAL, HOT, TRAP.
7. Riempie eventuali buchi con pool generale.

### Stage score anno 1

Premia:
- Pre-seed +6;
- Seed +4;
- valuation <= 15M +2.

Penalizza:
- Seed Ext -2;
- Series -5;
- valuation > 50M -4.

### Stage score anno 2

Premia:
- Seed +5;
- Pre-seed +2;
- Seed Ext +2;
- valuation 8-35M +2;
- traction >= 4 +1.

Penalizza:
- Series -1.

### Stage score anno 3

Premia:
- Seed Ext +6;
- Series +7;
- Seed +2;
- valuation 18-90M +2;
- valuation >= 50M +2;
- traction >= 6 +2;
- traction >= 5 +1;
- unit economics > 0 +1;
- hype >= 8 +2.

### Stato decisioni

`dealDecisions["y" + year][startupId]`:
- `pending`
- `invested`
- `passed`
- `lost`

COMMENTI / CAMBIA:

---

## 10. Pitch Battle

File veri:
- `js/engine/pitchBattle.js`
- `js/pages/pitchLive.js`
- `js/data/pitches.js`
- `js/data/founderSprites.js`

### Obiettivo battle

La battle non deve essere solo mini-gioco.
Serve a:
- capire il tipo di founder;
- trasformare news lette in leva;
- ottenere condizioni migliori;
- non perdere controllo sala;
- creare una schermata memorabile.

### Risorse

| Risorsa | Valore | Se arriva a 0 |
|---|---:|---|
| Guardia founder | 12 | founder rivela verita, leverage massimo |
| Credibilita GP | 6 | perdi la sala, deal perso |

### Mosse

| Tasto | Mossa | Uso |
|---:|---|---|
| 1 | I numeri, prego | metriche, regulation, economics |
| 2 | E i competitor? | mercato, corporate, moat |
| 3 | Parlami del team | persone, founder risk |
| 4 | Silenzio imbarazzante | ego/first-time tell |
| 5 | DD | paga per rischio/upside |
| 6 | Ref call | paga per hint profilo founder |
| 7 | Negozia valuation | propone numero |
| 8 | Co-invest | paga per lead/allocation |
| 9 | Passa | chiude senza investire |
| 0 | Term sheet | apre investimento |

### Profilo founder

| Profilo | Weak | Resist | Hint ref call |
|---|---:|---:|---|
| ego | 4 | 3 | il silenzio lo uccide |
| hustle | 1 | 2 | incalzalo sui numeri |
| red_flag | 3 | 1 | chiedi del team |
| competent | 1 | 4 | i numeri li ha davvero |
| grit | 2 | 3 | parla di mercato/rivali |
| first_time | 4 | 1 | lascia un silenzio |

### Danni

| Esito mossa | Effetto |
|---|---|
| Weak | -6 guardia, blocca counter |
| Neutral | -3 guardia, subisce counter |
| Resist | -2 credibilita, subisce counter |
| Repeat | nessun nuovo danno |
| Dossier Strike | danno extra -2 o -3 |

### Counter founder

| Turno | Danno credibilita |
|---:|---:|
| 1-2 | -1 |
| 3-4 | -2 |
| 5+ | -3 |

Il counter puo' essere bloccato da:
- weak move;
- Dossier Strike;
- shield taccuino.

### Truth founder

Quando la guardia arriva a 0:
- se unit economics >= 0.3: "margini veri solidi";
- se >= 0: "unit economics in pari";
- se >= -0.4: "perde soldi su ogni cliente";
- sotto -0.4: "brucia cassa".

COMMENTI / CAMBIA:

---

## 11. DD, Ref Call, Co-invest

### DD

File:
- `js/pages/pitchLive.js`
- `js/engine/intelligence.js`

Costo:
- 100k se taccuino debole;
- 50k con teoria;
- 25k con caso solido o fonte.

Esito:
- rivela un rischio o upside;
- usa RNG deterministico;
- conta per leverage term sheet;
- aumenta qualita decisione.

### Ref call

File:
- `js/pages/pitchLive.js`
- `js/engine/pitchBattle.js`

Costo:
- 50k.

Esito:
- rivela hint founder profile;
- conta per leverage term sheet;
- aiuta evento post-battle automatico.

### Co-invest

File:
- `js/pages/pitchLive.js`
- `js/engine/pitchBattle.js`

Costo:
- 100k.

Esito:
- mostra segnale round;
- conta +2 leverage;
- puo' servire nei deal caldi.

COMMENTI / CAMBIA:

---

## 12. Negoziazione Valuation

File:
- `js/pages/pitchLive.js`

Flusso:
1. tasto `7`;
2. modale custom `NEGOZIA VALUATION`;
3. il player inserisce proposta;
4. input accettati:
   - `12M`;
   - `12.5M`;
   - `12.5`;
   - `12500000`;
   - `12500k`.
5. proposta deve essere:
   - >= 1M;
   - sotto ASK corrente.

Formula attuale:

```text
discount = 1 - proposta / ask
leverage =
  0.35
  + (1 - guardia / GUARD_MAX) * 0.35
  + 0.10 se DD fatta
  + negotiationBonus da taccuino

discountPenalty = max(0, discount - 0.08) * 1.7
probabilita = clamp(leverage - discountPenalty, 0.03, 0.95)
```

Interpretazione:
- sconto fino a 8% quasi normale;
- oltre 8% diventa molto piu' difficile;
- se hai rotto la guardia hai piu pressione;
- se hai letto news hai piu credibilita;
- se hai fatto DD sei meno ridicolo;
- se chiedi troppo, il founder rifiuta.

Effetto se accettata:
- `rv.negotiatedValuation = proposedVal`;
- ownership aumenta a parita di ticket;
- compare nel memo come "VALUATION NEGOZIATA".

Effetto se rifiutata:
- `reputation -3`;
- negoziazione consumata;
- puoi ancora investire ad ASK.

COMMENTI / CAMBIA:

---

## 13. Term Sheet E Investimento

File:
- `js/pages/pitchLive.js`
- `js/engine/fundMath.js`
- `js/engine/dealAccess.js`

### Ticket preset

| Stage | Ticket |
|---|---|
| Pre-seed | 2M / 4M / 6M |
| Seed | 3M / 6M / 9M |
| Seed Ext. | 3M / 6M / 10M |
| Series A | 5M / 8M / 12M |

### Ownership

Formula:

```text
ownership = amount / (preMoneyValuation + amount)
ownership cap = 50%
```

Se il ticket supera il cap ownership:
- viene tagliato automaticamente;
- il gioco mostra ticket capped.

### Ticket custom

File:
- `js/engine/fundMath.js`
- `js/pages/pitchLive.js`

Regole:
- step 1M;
- min Series: 2M;
- min altri stage: 1M;
- max = min(cash, cap ownership).

### Accettazione term sheet

Non basta avere cash.
`TVDealAccess.termSheetVerdict()` calcola se il founder accetta.

Heat:
- Series +2;
- Seed Ext +1;
- hype >= 8 +2;
- traction >= 6 +2;
- valuation >= 50M +1;
- founder ego +2;
- founder competent +1;
- corporateFitTag +1.

Required leverage:

```text
required = clamp(3 + floor(heat / 2), 3, 7)
```

Leverage player:
- pitch won +3;
- DD +1;
- ref call +1;
- co-invest +2;
- valuation negoziata +1;
- intel level >= 2 +1;
- intel level >= 3 +1;
- fonte contattata +2;
- battle won +1;
- reputation >= 60 +1;
- reputation >= 75 +1;

Se leverage >= required:
- accetta.

Se leverage < required:
- chance residua:

```text
chance = clamp(0.18 + leverage * 0.06 - heat * 0.035, 0.05, 0.65)
```

COMMENTI / CAMBIA:

---

## 14. Pass, Deal Perso E Memo

File:
- `js/pages/pitchLive.js`
- `js/engine/postBattleEvents.js`

### Pass

Effetto:
- non investi;
- resta cash;
- decisione registrata;
- puo' partire evento post-battle tipo `LATE SOURCE`.

### Deal perso

Trigger:
- credibilita a 0;
- sala persa;
- term sheet respinto in rescue se non riesci a recuperare.

Effetto:
- decisione `lost`;
- reputazione puo' scendere;
- evento post-battle allocation/call puo' comparire.

### Memo post-battle

Deve fare:
- dire in 2 righe perche' la scelta era buona/stupida/mista;
- creare schermata/poster screenshottabile;
- non spiegare dettagli interni del motore;
- non diventare tutorial.

Etichetta attuale:
- `VERDETTO ANALISTA`;
- memo card: `NOTA ANALISTA`.

COMMENTI / CAMBIA:

---

## 15. Eventi Post-Battle Automatici

File:
- `js/engine/postBattleEvents.js`

Regola:
- dopo ogni battle puo' esserci un colpo di scena automatico;
- il player non sceglie manualmente;
- la scelta automatica dipende dalla preparazione.

Tipi:

| Evento | Quando | Auto choice migliore se |
|---|---|---|
| PORTFOLIO PING | passi/non investi e hai portco attiva | intel >= 2 |
| FOUNDER DRAMA | investi in ego/red_flag | DD o ref call |
| CUSTOMER PANIC | investi in unit economics negativi | DD o cash |
| FIRST 72H | investimento generico | DD/ref/co-invest |
| LATE SOURCE | pass | intel >= 2 |
| ALLOCATION CUT | deal perso | intel >= 1 |

Effetti possibili:
- cash;
- reputation;
- impact;
- LP satisfaction;
- catalyst di portafoglio.

Nota importante:
- i catalyst non cambiano subito il multiplo;
- vengono registrati e applicati dal market engine al portfolio update;
- non bisogna spiegarlo in modo tecnico al giocatore.

COMMENTI / CAMBIA:

---

## 16. Portfolio

File:
- `js/pages/portfolio.js`
- `js/engine/marketEngine.js`

Ogni posizione contiene:
- `id`
- `name`
- `sectorTag`
- `entryYear`
- `entryValuation`
- `investedAmount`
- `equityPct`
- `currentValueMultiplier`
- `status`
- eventuale `exitYear`, `exitKind`, `realizedAmount`.

Portfolio value:

```text
somma investedAmount * currentValueMultiplier
solo posizioni active
```

MOIC:

```text
(portfolioValue + realized) / invested
```

DPI:

```text
realized / invested
```

COMMENTI / CAMBIA:

---

## 17. Portfolio Company Call

File:
- `js/engine/portfolioIncidents.js`
- `js/pages/portfolioCall.js`

Trigger generale:
- partita iniziata;
- non game over;
- almeno una posizione attiva;
- dealflow annuale gia generato;
- una call massima per anno.

Scelta posizione:
- prende posizione attiva con risk score piu alto.

Risk score:
- multiplo < 1: +3;
- unit economics negativi: `abs(unitEconomics) * 4`;
- regulatory exposure negativa: `abs(regulatoryExposure) * 3`;
- founder red_flag: +4;
- founder ego: +2;
- hype >= 8: +1.5;
- piccolo roll deterministico.

### Archetipi

| Archetipo | Trigger | Tema |
|---|---|---|
| ROUND QUASI CHIUSO DA SEI MESI | hype >= 8 e traction <= 3 | FOMO/lead fantasma |
| GOVERNANCE DA APERITIVO | founder red_flag/ego | board/founder chaos |
| PORTALE COMPLIANCE IN FIAMME | regulatoryExposure < -0.35 | legale/burocrazia |
| PROCUREMENT ETERNO | enterprise/corporate/traction | corporate innovation |
| PLANT VISIT DEL NORDEST | industrial tag | family office/fabbrica |
| BANDO MINUSCOLO | policy-heavy | grant theater |
| BRIDGE O TAGLIO | unitEconomics < -0.2 | burn/unit economics |
| GROWTH BREAKPOINT | fallback | pilot/cliente |

### Struttura scelte

Ogni call ha 3 scelte:
- scelta 1: intervento forte/costo cash/alto upside;
- scelta 2: disciplina/milestone/moderata;
- scelta 3: passivita/FOMO/negativa.

Effetti possibili:
- `cash` negativo;
- `multiplierPct`;
- `reputation`;
- `impact`;
- `lp` su tutti gli LP.

Problema da controllare:
- se sembrano tutte uguali, differenziare:
  - posta in gioco;
  - tipo interlocutore;
  - metrica colpita;
  - rischio narrativo;
  - output schermata.

COMMENTI / CAMBIA:

---

## 18. Follow-on

File:
- `js/pages/followOn.js`

Quando appare:
- dopo dealflow deliberato;
- dopo eventuale portfolio call;
- prima della chiusura anno.

Trigger offerta:
- posizione attiva;
- entryYear < current year;
- currentValueMultiplier >= 1.15;
- roll deterministico < 0.6;
- massimo 2 offerte anno.

Scelte:

| Tasto | Scelta | Effetto |
|---:|---|---|
| 1 | Pro-rata | investe 50% ticket originale |
| 2 | Raddoppia | investe 100% ticket originale |
| 9 | Rinuncia | diluizione -15% |

Formula blended multiple:

```text
oldValue = investedAmount * currentValueMultiplier
newMultiplier = (oldValue + amount) / (investedAmount + amount)
```

COMMENTI / CAMBIA:

---

## 19. LP Call

File:
- `js/data/lpProfiles.js`
- `js/data/lpCalls.js`
- `js/pages/lpCall.js`
- `js/engine/lpRelations.js`

LP attuali:
- `pensione`
- `family`
- `sovereign`
- `endowment`

Ogni call:
- ha `id`;
- ha `lp`;
- ha `trigger(state)`;
- ha `question`;
- ha 3 scelte;
- ogni scelta modifica `lpSat`, reputation, impact o special.

### Call attuali

| ID | LP | Trigger | Tema |
|---|---|---|---|
| `pensione-concentration-ai` | pensione | >50% in AI | concentrazione AI |
| `sovereign-dpi-low` | sovereign | anno >=3 e realized basso | DPI |
| `family-no-industrial` | family | anno >=2 senza robotics/battery | industriale Nordest |
| `endowment-esg-fossil` | endowment | investimento crypto | ethics/writeoff |
| `endowment-climate-praise` | endowment | climate/battery >20% | ESG positivo |
| `pensione-burn` | pensione | cash <30M | follow-on reserve |
| `sovereign-go-big` | sovereign | tante posizioni piccole | go big |
| `family-too-consumer` | family | consumer >30% | consumer skepticism |
| `family-quando-distribuite` | family | anno >=2 e realized 0 | distribuzioni |
| `pensione-giustificate-le-spese` | pensione | researchSpent >400k | costi DD |

Special:
- `writeoff_crypto`: azzera posizioni crypto attive.

Se una call sembra debole:
- riscrivere `question`;
- cambiare trigger;
- cambiare delta LP;
- renderla piu italiana/allusiva;
- evitare nomi reali.

COMMENTI / CAMBIA:

---

## 20. Chiusura Anno E Market Engine

File:
- `js/engine/yearEnd.js`
- `js/engine/marketEngine.js`
- `js/pages/yearReview.js`
- `js/data/exitEvents.js`

Chiusura anno:
1. applica mark a ogni posizione attiva;
2. applica news materializzate nell'anno;
3. applica baseline startup;
4. applica source reality;
5. applica catalyst post-battle;
6. applica noise deterministico;
7. applica rail da fonte contattata;
8. applica exit/write-off/writedown scriptati;
9. penalizza LP call ignorate;
10. se anno finale: game over.

### Baseline mark

Formula:
- `unitEconomics * 0.06`;
- founder red_flag: -8%;
- founder ego: -3%;
- founder competent: +5%;
- founder grit: +7%;
- founder hustle: +2%;
- se yearsHeld >= 2 e hype >= 8: `-hypeDecay * 0.15`.

### Noise

Piccolo rumore deterministico:

```text
noise = (noiseSeed - 0.5) * 0.06
```

### Exit events

File:
- `js/data/exitEvents.js`

Tipi:
- `exit`;
- `ipo`;
- `acquihire`;
- `writeoff`;
- `writedown`.

Effetto LP:
- exit/IPO: +3 a tutti;
- acquihire: 0;
- writeoff: -2 a tutti.

COMMENTI / CAMBIA:

---

## 21. Scoring Finale

File:
- `js/engine/scoring.js`
- `js/pages/finalReport.js`
- `js/data/titles.js`

Metriche:
- portfolio value;
- MOIC;
- DPI;
- LP satisfaction media;
- reputation;
- innovationImpact;
- deploymentRate.

Score components:

```text
moicScore = clamp(moic * 30, 0, 100)
dpiScore = clamp(dpi * 50, 0, 100)
lpScore = lpSatAvg
repScore = reputation
impScore = innovationImpact
deploymentScore = clamp(deploymentRate / 0.80 * 100, 0, 100)
```

Score finale:

```text
score =
  35% MOIC
  15% DPI
  15% LP
  10% Reputation
  10% Impact
  15% Deployment
```

Design question:
- il gioco deve premiare rendimento puro?
- deve premiare disciplina?
- deve punire troppo chi non deploya?
- deve premiare "aver letto" direttamente o solo tramite risultati?

COMMENTI / CAMBIA:

---

## 22. Report Finale, Leaderboard, Social

File:
- `js/pages/finalReport.js`
- `js/pages/leaderboard.js`
- `js/data/titles.js`

Output:
- score;
- titolo satirico;
- MOIC;
- DPI;
- deployment;
- LP sat;
- reputazione;
- impatto;
- classifica locale;
- post-mortem delle news mancate.

Leaderboard:
- localStorage;
- non online;
- puo' essere esportata/cancellata via modali custom.

Share/social:
- deve creare schermate memorabili;
- al momento e' testuale/visuale in-game;
- migliorabile lato grafica senza toccare regole.

COMMENTI / CAMBIA:

---

## 23. Grafica, UX E Interventi Solo Visuali

File:
- `css/televideo.css`
- `css/visual-overrides.css`
- `index.html`

Regola nuova:
- interventi solo grafici vanno prima in `css/visual-overrides.css`;
- e' caricato dopo `televideo.css`;
- se non si vede, aggiornare `css/visual-overrides.css?v=...` in `index.html`.

Grafica attuale:
- scocca CRT;
- header Televideo;
- nav FastText;
- console mode 16:9 per intro/battle/call;
- sprite pixel DOM;
- memo-card post-battle;
- codec cinematic per LP/source/portfolio call.

UX critiche:
- click/tap sui numeri deve sempre equivalere al tasto;
- battle usa direct action: tasto singolo senza INVIO;
- hub Televideo usa pagina + INVIO;
- modali custom sostituiscono prompt nativi.

Se vuoi "piu figo":
- lavorare su battle stage;
- poster post-battle;
- report finale;
- LP/portfolio/source call cinematic;
- palette e contrasto;
- motion/flash/shake senza perdere leggibilita mobile.

COMMENTI / CAMBIA:

---

## 24. Audio

File:
- `js/engine/audio.js`

Elementi:
- keypress;
- page change;
- battle music;
- success/error;
- codec ring;
- LP outcome;
- mute in localStorage `tvc3000.muted`.

Possibili interventi:
- rendere audio piu arcade;
- tagliare se invadente;
- diversificare battle/call/source;
- aggiungere feedback su negoziazione accettata/rifiutata.

COMMENTI / CAMBIA:

---

## 25. Copy E Tono

Regole copy:
- corto;
- allusivo;
- mai nomi reali;
- piu VC italiano, meno startup generic;
- lascia implicazioni al giocatore;
- se spiega una meccanica, farlo con una battuta breve.

Archetipi italiani utili:
- fondazione bancaria;
- family office del Nordest;
- corporate innovation;
- procurement eterno;
- bando minuscolo;
- comitato investimenti;
- "ma l'anchor pubblico c'e'?";
- round quasi chiuso da sei mesi;
- portale fornitori;
- rendiconto piu grande del grant;
- advisor che chiama il figlio "startup";
- cap table con angel di provincia;
- bridge "ponte tibetano";
- LOI non firmata;
- pilot gratuito venduto come pipeline.

No:
- nomi reali di fondi, persone, corporate, istituzioni;
- diffamazione riconoscibile;
- battute troppo interne se bloccano comprensione;
- spiegoni tipo "questa scelta e' corretta perche'...".

COMMENTI / CAMBIA:

---

## 26. Come Cambiare Ogni Tipo Di Contenuto

### Aggiungere/modificare startup

File:
- `js/data/startups.js`
- eventualmente `js/data/pitches.js`
- eventualmente `js/data/founderSprites.js`
- eventualmente `js/data/exitEvents.js`
- eventualmente `js/data/newsCalendar.js`

Checklist:
- id unico;
- nome satirico ma non reale;
- sectorTag coerente;
- founderProfile esistente;
- hiddenRisk concreto;
- hiddenUpside concreto;
- almeno 2-3 news rilevanti nella stagione;
- pitch qualitativo con indizi sul profilo;
- se exit scriptata, news di preavviso.

### Aggiungere/modificare news

File:
- `js/data/newsCalendar.js`

Checklist:
- page unica;
- year corretto;
- section corretta;
- headline corta;
- body leggibile Televideo;
- signal se deve influenzare gameplay;
- materializeYear dentro durata run se serve nella build pubblica;
- scope coerente.

### Cambiare battle/founder

File:
- `js/engine/pitchBattle.js`
- `js/data/pitches.js`
- `js/data/founderSprites.js`
- `js/pages/pitchLive.js`

Checklist:
- weak/resist leggibili dal pitch;
- ref call non deve dire troppo ma deve aiutare;
- sprite riconoscibile;
- reazioni diverse per mossa;
- truth coerente con startup.

### Cambiare LP call

File:
- `js/data/lpCalls.js`
- `js/data/lpProfiles.js`
- `js/pages/lpCall.js`

Checklist:
- trigger non troppo raro;
- question satirica ma chiara;
- 3 scelte davvero diverse;
- effetti bilanciati;
- outcome visibile.

### Cambiare portfolio call

File:
- `js/engine/portfolioIncidents.js`
- `js/pages/portfolioCall.js`

Checklist:
- trigger chiaro;
- interlocutore diverso;
- payoff diverso;
- rischio specifico;
- scelta 3 non sempre "non fare niente" uguale.

### Cambiare grafica

File:
- `css/visual-overrides.css`;
- se serve struttura: `css/televideo.css` o HTML nelle pagine.

Checklist:
- aggiornare cache-buster;
- provare desktop e mobile;
- controllare overflow testo;
- screenshot battle e report;
- non rompere direct action.

COMMENTI / CAMBIA:

---

## 27. Test E QA

Comandi:

```powershell
& 'C:\Program Files\nodejs\node.exe' tests\run.js
Get-ChildItem -Path js -Recurse -Filter *.js | ForEach-Object {
  & 'C:\Program Files\nodejs\node.exe' --check $_.FullName
  if ($LASTEXITCODE -ne 0) { throw "syntax check failed: $($_.FullName)" }
}
python -m http.server 5175 --bind 127.0.0.1
```

QA manuale minimo:
1. nuova Quick Run;
2. skip intro;
3. verificare pagina `100`;
4. andare a `200`;
5. aprire `301`;
6. cliccare numeri battle;
7. provare `7` negozia valuation con `8M`;
8. investire/passare;
9. verificare memo;
10. leggere news fino a sblocco fonte;
11. aprire fonte 9xx;
12. investire portco;
13. anno successivo verificare fonte ancora accessibile;
14. chiudere anno;
15. provare portfolio/LP call;
16. verificare mobile.

Test automatici attuali:
- render;
- input;
- stato;
- dealflow;
- fund math;
- intelligence;
- scoring;
- portfolio call;
- post-battle;
- exit/write-off;
- pitch live;
- sprite;
- dati.

COMMENTI / CAMBIA:

---

## 28. Backlog Di Decisioni Aperte

Scrivi qui le decisioni di prodotto da prendere.

### Durata

CAMBIA / TENERE:

### Difficolta battle

CAMBIA / TENERE:

### News troppo lunghe / troppe

CAMBIA / TENERE:

### Portfolio call banali

CAMBIA / TENERE:

### LP call

CAMBIA / TENERE:

### Grafica battle

CAMBIA / TENERE:

### Report finale / social screenshot

CAMBIA / TENERE:

### Satira VC italiana

CAMBIA / TENERE:

---

## 29. Registro Commenti Utente

Usa questo spazio liberamente.

Esempio:

```text
SEZIONE 17 - Portfolio Call
CAMBIA: "PROCUREMENT ETERNO" sembra uguale a "GROWTH BREAKPOINT".
Voglio che procurement abbia piu burocrazia, tempi lunghi, legal, portale
fornitori, e meno effetto diretto sul multiplo.
```

COMMENTI:

