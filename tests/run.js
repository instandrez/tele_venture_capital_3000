/* Test runner minimale per il motore di Tele Venture Capital 3000.
   Esecuzione:  node tests/run.js
   Nessuna dipendenza: stub di window/localStorage e assert artigianali.

   Copre i criteri MVP di VERIFICHE_CODEX.md:
   - nuova partita e valori iniziali
   - dealflow: 5 startup distinte, riproducibile a parità di seed,
     diverso tra seed diversi
   - decisioni annuali (pending/invested/passed)
   - MOIC e DPI senza NaN (anche con invested = 0)
   - exit e write-off che alimentano realized
   - roll deterministico (anti save-scumming)
*/
"use strict";

// ---------- stub ambiente browser ----------
const storage = {};
global.localStorage = {
  getItem: k => (k in storage ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: k => { delete storage[k]; }
};
global.window = global;

// ---------- carica i moduli del motore (ordine = index.html) ----------
const path = require("path");
const load = f => require(path.join(__dirname, "..", "js", f));
load("state.js");
load("data/sectorIndices.js");
load("data/lpProfiles.js");
load("data/newsCalendar.js");
load("data/startups.js");
load("data/pitches.js");
load("data/founderSprites.js");
load("data/exitEvents.js");
load("data/lpCalls.js");
load("data/titles.js");
load("engine/scoring.js");
load("engine/marketEngine.js");
load("engine/yearEnd.js");
load("engine/dealflow.js");
load("engine/fundMath.js");
load("engine/intelligence.js");
load("engine/lpRelations.js");
load("engine/dealAccess.js");
load("engine/portfolioIncidents.js");
load("engine/postBattleEvents.js");
load("engine/pitchBattle.js");
load("ui/render.js");

// DOM minimo per verificare il routing tastiera di main.js.
let directActionMode = false;
const inputDisplay = { textContent: "" };
const teletextContent = { dataset: {} };
const consoleStage = { dataset: {} };
global.document = {
  getElementById(id) {
    if (id === "tv-input") return inputDisplay;
    if (id === "tv-content") return teletextContent;
    if (id === "console-stage") return consoleStage;
    if (id === "screen") {
      return { classList: { contains: cls => cls === "console-mode" && directActionMode } };
    }
    return null;
  },
  addEventListener() {}
};
global.TVAudio = {
  keyPress() {}, error() {}, stopBattleMusic() {},
  toggleMute() { return false; }
};
load("main.js");

// ---------- micro harness ----------
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ok  " + name); }
  catch (e) { failed++; console.error("FAIL  " + name + "\n      " + e.message); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || "assertion failed"); }
function eq(a, b, msg) {
  if (a !== b) throw new Error((msg || "eq") + ": atteso " + b + ", ottenuto " + a);
}
function approx(a, b, tol, msg) {
  if (Math.abs(a - b) > (tol || 1e-9))
    throw new Error((msg || "approx") + ": atteso ~" + b + ", ottenuto " + a);
}

const TVState = global.TVState, TVDealflow = global.TVDealflow,
      TVScoring = global.TVScoring, TVMarket = global.TVMarket,
      TVStartups = global.TVStartups, TVExits = global.TVExits,
      TVIntel = global.TVIntel, TVFundMath = global.TVFundMath,
      TVDealAccess = global.TVDealAccess,
      TVPostBattleEvents = global.TVPostBattleEvents;

// ---------- test ----------
console.log("\n== Render ==");
test("center misura il testo visibile, non i tag HTML", () => {
  const centered = global.TVRender.center('<span class="c-red">CIAO</span>', 10);
  eq(centered.indexOf("<span"), 3, "padding centro");
  eq(global.TVRender.visibleLength(centered), 7, "lunghezza visibile con padding");
});
test("la griglia Televideo larga espone 56 colonne", () => {
  eq(global.TVRender.COLS, 56, "colonne");
  eq(global.TVRender.line("-").length, 56, "riga completa");
});
test("navigatore FastText evidenzia l'area principale corretta", () => {
  eq(global.TVRender.navTargetFor(100), 100, "home");
  eq(global.TVRender.navTargetFor(161), 110, "news detail");
  eq(global.TVRender.navTargetFor(190), 190, "taccuino");
  eq(global.TVRender.navTargetFor(301), 200, "deal battle");
  eq(global.TVRender.navTargetFor(450), 400, "portfolio/follow-on");
  eq(global.TVRender.navTargetFor(600), 600, "LP");
});

console.log("\n== Input ==");
test("console mode esegue il tasto numerico senza Invio", () => {
  let action = null;
  directActionMode = true;
  global.TVRouter.setActionHandler(num => { action = num; });
  global.TVInput.handleKey({ key: "7", preventDefault() {} });
  eq(action, 7, "azione diretta");
});
test("touch/click riusa lo stesso input della tastiera", () => {
  let action = null;
  directActionMode = true;
  global.TVRouter.setActionHandler(num => { action = num; });
  global.TVInput.pressKey("6");
  eq(action, 6, "azione touch");
});
test("click inline esegue azione contestuale anche fuori console mode", () => {
  let action = null;
  directActionMode = false;
  delete teletextContent.dataset.directAction;
  global.TVRouter.setActionHandler(num => { action = num; });
  global.TVInput.pressAction("1");
  eq(action, 1, "azione inline");
});
test("pagina televideo directAction esegue il numero senza Invio", () => {
  let action = null;
  directActionMode = false;
  teletextContent.dataset.directAction = "1";
  global.TVRouter.setActionHandler(num => { action = num; });
  global.TVInput.handleKey({ key: "1", preventDefault() {} });
  eq(action, 1, "azione directAction");
  delete teletextContent.dataset.directAction;
});
test("hub Televideo continua a richiedere Invio", () => {
  let action = null;
  directActionMode = false;
  delete teletextContent.dataset.directAction;
  global.TVRouter.setActionHandler(num => { action = num; });
  global.TVInput.handleKey({ key: "4", preventDefault() {} });
  eq(action, null, "nessuna azione prima di Invio");
  global.TVInput.handleKey({ key: "Enter", preventDefault() {} });
  eq(action, 4, "azione dopo Invio");
});

console.log("\n== Stato iniziale ==");
test("nuova partita: valori iniziali corretti", () => {
  const s = TVState.newGame();
  eq(s.year, 1, "year");
  eq(s.runMode, "quick", "runMode");
  eq(s.maxYear, 3, "maxYear");
  eq(s.dealsPerYear, 3, "dealsPerYear");
  eq(s.fundSize, 100_000_000, "commitments");
  eq(s.managementFeeBudget, 10_000_000, "fee budget");
  eq(s.investableCapital, 90_000_000, "capitale investibile");
  eq(s.cash, 90_000_000, "cash investibile");
  eq(s.invested, 0, "invested");
  eq(s.realized, 0, "realized");
  eq(s.portfolio.length, 0, "portfolio");
  assert(s.gameSeed > 0, "gameSeed presente");
  assert(s.gameStarted, "gameStarted");
});

test("partner mode conserva il formato esteso", () => {
  const s = TVState.newGame({ runMode: "partner" });
  eq(s.runMode, "partner", "runMode");
  eq(s.maxYear, 3, "maxYear");
  eq(s.dealsPerYear, 5, "dealsPerYear");
});

test("un save v2 migra fee e ownership post-money una sola volta", () => {
  localStorage.setItem("tvc3000.save", JSON.stringify({
    version: 2,
    year: 2,
    cash: 100_000_000,
    portfolio: [{
      id: "legacy", investedAmount: 5_000_000,
      entryValuation: 20_000_000,
      equityPct: 0.25
    }]
  }));
  assert(TVState.load(), "save caricato");
  eq(TVState.current.cash, 90_000_000, "fee sottratte");
  approx(TVState.current.portfolio[0].equityPct, 0.20, 1e-9, "quota migrata");
  TVState.save();
  assert(TVState.load(), "save ricaricato");
  eq(TVState.current.cash, 90_000_000, "fee non sottratte due volte");
});

test("un save v4 resetta il mark iniziale se non c'e' stato evento esplicito", () => {
  localStorage.setItem("tvc3000.save", JSON.stringify({
    version: 4,
    year: 1,
    cash: 87_000_000,
    history: [{ year: 1, type: "invest", startup: "AGIorDie" }],
    portfolio: [{
      id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
      investedAmount: 3_000_000, entryValuation: 25_000_000,
      currentValueMultiplier: 1.2, entryYear: 1, status: "active"
    }]
  }));
  assert(TVState.load(), "save v4 caricato");
  eq(TVState.current.portfolio[0].currentValueMultiplier, 1, "mark iniziale normalizzato");
});

console.log("\n== Roll deterministico ==");
test("stesso key → stesso esito; key diversi → esiti diversi", () => {
  TVState.newGame();
  const a1 = TVState.roll("dd|x|1");
  const a2 = TVState.roll("dd|x|1");
  eq(a1, a2, "stesso key deve dare stesso roll");
  const b = TVState.roll("dd|y|1");
  assert(a1 !== b, "key diversi dovrebbero differire (quasi sempre)");
  assert(a1 >= 0 && a1 < 1, "range [0,1)");
});

console.log("\n== Relazione LP ==");
test("la risposta LP restituisce tutte le variazioni applicate", () => {
  const s = TVState.newGame();
  const call = global.TVLPCalls.CALLS.find(c => c.id === "pensione-concentration-ai");
  const report = global.TVLPRelations.applyChoice(s, call, call.choices[1]);
  eq(s.lpSat.pensione, 32, "soddisfazione pensione");
  eq(s.lpSat.sovereign, 58, "soddisfazione sovereign");
  eq(s.reputation, 47, "reputazione");
  eq(report.metrics.length, 3, "metriche nel report");
  eq(report.tone, "negative", "tono esito");
  assert(s.usedLPCalls.includes(call.id), "call marcata come gestita");
});

test("il write-off promesso all'LP viene mostrato come conseguenza", () => {
  const s = TVState.newGame();
  s.portfolio = [{
    id: "coin", name: "Coin", sectorTag: "CRYPTO_WEB3",
    investedAmount: 2_000_000, status: "active"
  }];
  const call = global.TVLPCalls.CALLS.find(c => c.id === "endowment-esg-fossil");
  const report = global.TVLPRelations.applyChoice(s, call, call.choices[1]);
  eq(s.portfolio[0].status, "writeoff", "posizione azzerata");
  eq(report.notes.length, 1, "conseguenza speciale nel report");
  assert(report.notes[0].text.includes("2MEUR"), "valore del write-off visibile");
});

console.log("\n== Dealflow ==");
test("3 startup distinte per anno in Quick Run", () => {
  const s = TVState.newGame();
  const picks = TVDealflow.currentYearDealflow(s);
  eq(picks.length, 3, "numero deal");
  const ids = new Set(picks.map(p => p.id));
  eq(ids.size, 3, "id univoci");
});

test("5 startup distinte per anno in Partner Mode", () => {
  const s = TVState.newGame({ runMode: "partner" });
  const picks = TVDealflow.currentYearDealflow(s);
  eq(picks.length, 5, "numero deal partner");
  const ids = new Set(picks.map(p => p.id));
  eq(ids.size, 5, "id univoci partner");
});

test("anno 3 quick porta late stage, unicorni e liquidity narrative", () => {
  const s = TVState.newGame();
  s.gameSeed = 424242;
  s.year = 3;
  const picks = TVDealflow.currentYearDealflow(s);
  assert(picks.some(st => TVDealflow.stageBand(st) === "UNICORN"),
    "nessun unicorno nel dealflow anno 3");
  assert(picks.some(st => TVExits.EXIT_EVENTS.some(e =>
    e.startupId === st.id && e.year <= s.maxYear)),
    "nessun candidato liquidity nel dealflow anno 3");
});

test("anno 2 quick include almeno un deal a valuation pesante", () => {
  const s = TVState.newGame();
  s.gameSeed = 123321;
  s.year = 2;
  const picks = TVDealflow.currentYearDealflow(s);
  assert(picks.some(st => st.valuation >= 80_000_000 ||
    TVDealflow.stageBand(st) === "UNICORN"),
    "nessun deal pesante anno 2");
});

test("dealflow riproducibile a parità di partita", () => {
  const s = TVState.newGame();
  const first = TVDealflow.currentYearDealflow(s).map(p => p.id).join(",");
  const second = TVDealflow.currentYearDealflow(s).map(p => p.id).join(",");
  eq(first, second, "stessa partita stesso dealflow");
});

test("seed diversi → percorsi diversi (su 5 tentativi)", () => {
  const runs = new Set();
  for (let i = 0; i < 5; i++) {
    const s = TVState.newGame();
    runs.add(TVDealflow.currentYearDealflow(s).map(p => p.id).join(","));
  }
  assert(runs.size > 1, "almeno due partite su 5 dovrebbero differire");
});

test("decisioni: pending → invested/passed, niente ri-delibera implicita", () => {
  const s = TVState.newGame();
  const picks = TVDealflow.currentYearDealflow(s);
  eq(TVDealflow.pendingDeals(s).length, 3, "tutti pending all'inizio");
  TVDealflow.setDecision(s, picks[0].id, "invested");
  TVDealflow.setDecision(s, picks[1].id, "passed");
  eq(TVDealflow.getDecision(s, picks[0].id), "invested");
  eq(TVDealflow.getDecision(s, picks[1].id), "passed");
  eq(TVDealflow.pendingDeals(s).length, 1, "resta 1 pending");
});

console.log("\n== Fund Math ==");
test("i ticket cambiano con lo stage", () => {
  eq(TVFundMath.ticketOptions({ stage: "Pre-seed" }).join(","), "2000000,4000000,6000000");
  eq(TVFundMath.ticketOptions({ stage: "Seed" }).join(","), "3000000,6000000,9000000");
  eq(TVFundMath.ticketOptions({ stage: "Series A" }).join(","), "5000000,8000000,12000000");
});

test("ownership calcolata post-money", () => {
  approx(TVFundMath.ownershipPct(5_000_000, 20_000_000), 0.20, 1e-9);
});

test("ownership e term sheet non superano mai il 50%", () => {
  eq(TVFundMath.MAX_OWNERSHIP, 0.5, "cap ownership");
  approx(TVFundMath.ownershipPct(10_000_000, 1_000_000), 0.5, 1e-9);
  const options = TVFundMath.termSheetOptions({ stage: "Series A" }, 4_000_000);
  options.forEach(o => assert(o.ownership <= 0.5, "ownership sopra cap"));
  assert(options.some(o => o.capped), "almeno un ticket deve essere cappato");
});

test("il ticket custom rispetta cash disponibile e cap ownership", () => {
  const st = { stage: "Pre-seed" };
  const amount = TVFundMath.customTicketAmount(st, 4_000_000, 3_500_000, 20_000_000);
  assert(amount <= 3_500_000, "ticket sopra cash");
  assert(TVFundMath.ownershipPct(amount, 4_000_000) <= 0.5, "ownership sopra 50%");
  const low = TVFundMath.customTicketAmount(st, 20_000_000, 90_000_000, 100_000);
  assert(low >= 1_000_000, "ticket sotto minimo operativo");
});

test("lo sconto negoziato produce un mark d'ingresso sopra 1x", () => {
  approx(TVFundMath.entryMultiplier(20_000_000, 20_000_000), 1, 1e-9, "full price");
  const m = TVFundMath.entryMultiplier(20_000_000, 14_400_000);
  approx(m, 20 / 14.4, 1e-6, "mark = full/paid");
  assert(m > 1, "lo sconto deve pagare");
  assert(TVFundMath.entryMultiplier(100_000_000, 1_000_000) <= 1.5, "cap a 1.5x");
  assert(TVFundMath.entryMultiplier(0, 0) === 1, "input nulli → 1x");
});

test("la strategia media puo' distribuire il fondo, la massima deve selezionare", () => {
  let middle = 0, maximum = 0;
  TVStartups.STARTUPS.slice(0, 15).forEach(st => {
    const tickets = TVFundMath.ticketOptions(st);
    middle += tickets[1];
    maximum += tickets[2];
  });
  assert(middle >= 75_000_000, "ticket medi troppo piccoli");
  assert(maximum > TVFundMath.INVESTABLE, "il massimo deve superare il fondo");
});

console.log("\n== Intelligence Network ==");
test("ogni startup ha almeno 3 piste navigabili fin dall'anno 1", () => {
  const s = TVState.newGame();
  s.year = 1;
  TVStartups.STARTUPS.forEach(st => {
    assert(TVIntel.relevantNews(s, st).length >= 3,
      "piste insufficienti: " + st.id);
  });
});

test("Quick Run limita ogni deal a 3 ritagli utili", () => {
  const s = TVState.newGame();
  s.year = 1;
  TVStartups.STARTUPS.forEach(st => {
    eq(TVIntel.relevantNews(s, st).length, 3,
      "cap ritagli quick: " + st.id);
  });
});

test("due pagine lette costruiscono il dossier e scontano la DD", () => {
  const s = TVState.newGame();
  const st = TVStartups.STARTUPS[0];
  const clues = TVIntel.relevantNews(s, st);
  s.readPages = [clues[0].news.page, clues[1].news.page];
  const intel = TVIntel.forStartup(s, st);
  eq(intel.level, 2, "livello dossier");
  eq(intel.shield, 1, "una copertura");
  eq(intel.ddCost, 50_000, "DD scontata");
  assert(intel.negotiationBonus >= 0.10, "bonus negoziazione");
  assert(intel.lead && intel.lead.move >= 1, "domanda armata");
});

test("tre pagine lette attivano due coperture battle", () => {
  const s = TVState.newGame();
  const st = TVStartups.STARTUPS[0];
  const clues = TVIntel.relevantNews(s, st);
  s.readPages = clues.slice(0, 3).map(x => x.news.page);
  const intel = TVIntel.forStartup(s, st);
  eq(intel.level, 3, "rete completa");
  eq(intel.shield, 2, "due coperture");
  eq(intel.ddCost, 25_000, "DD molto scontata");
});

test("le macro generiche valgono meno di una prova diretta", () => {
  const s = TVState.newGame();
  const st = TVStartups.byId("humanoidops");
  const clues = TVIntel.relevantNews(s, st);
  s.readPages = clues.slice(0, 2).map(x => x.news.page);
  const intel = TVIntel.forStartup(s, st);
  assert(intel.evidenceScore < 3, "due ritagli deboli non bastano");
  assert(!intel.lead, "nessuna domanda armata senza corroborazione");
});

test("una news founder-specific non diventa pista per un altro deal del settore", () => {
  const s = TVState.newGame();
  const clues = TVIntel.relevantNews(s, TVStartups.byId("scootflow"));
  assert(!clues.some(x => x.news.page === 161),
    "la vicenda YachtBrain non deve accusare ScootFlow");
});

test("le liste news mostrano solo ritagli collegati al dealflow corrente", () => {
  const s = TVState.newGame();
  TVDealflow.currentYearDealflow(s);
  const items = TVIntel.newsForCurrentDealflow(s, 110);
  assert(items.length > 0, "nessuna news filtrata");
  items.forEach(n => {
    assert(TVIntel.linkedDeals(s, n.page).length > 0,
      "news non collegata al dealflow: " + n.page);
    eq(n.year, s.year, "news di anno diverso: " + n.page);
  });
});

test("le news anno 2 non riusano ritagli di anni precedenti o futuri", () => {
  const s = TVState.newGame();
  s.year = 2;
  TVDealflow.currentYearDealflow(s);
  [110, 120, 140, 160, 180].forEach(section => {
    TVIntel.newsForCurrentDealflow(s, section).forEach(n =>
      eq(n.year, 2, "pagina fuori anno: " + n.page)
    );
  });
});

test("ogni sezione news dell'anno corrente mostra almeno un contenuto", () => {
  for (let year = 1; year <= 3; year++) {
    const s = TVState.newGame();
    s.year = year;
    TVDealflow.currentYearDealflow(s);
    [110, 120, 140, 160, 180].forEach(section => {
      const items = TVIntel.newsForCurrentDealflow(s, section);
      assert(items.length > 0, "sezione vuota anno " + year + ": " + section);
      items.forEach(n => eq(n.year, year, "news fuori anno: " + n.page));
    });
  }
});

test("quando una fonte si apre usa solo ritagli dello stesso anno", () => {
  let opened = 0;
  for (let year = 1; year <= 3; year++) {
    const s = TVState.newGame();
    s.year = year;
    TVDealflow.currentYearDealflow(s).forEach(st => {
      const clues = TVIntel.relevantNews(s, st);
      const pages = [];
      const kinds = new Set();
      let score = 0;
      clues.forEach(clue => {
        if (score >= 3 && kinds.size >= 2) return;
        pages.push(clue.news.page);
        kinds.add(clue.kind);
        score += clue.weight;
      });
      if (score < 3 || kinds.size < 2) return;
      s.readPages = pages;
      assert(TVIntel.chainFor(s, st).unlocked, "fonte non aperta: " + st.id);
      pages.forEach(page => {
        const news = global.TVNews.NEWS.find(n => n.page === page);
        eq(news.year, year, "fonte con ritaglio fuori anno: " + page);
      });
      opened++;
    });
  }
  assert(opened >= 3, "nessuna fonte privata testata nei 3 anni");
});

test("contattare la fonte privata potenzia battle e due diligence", () => {
  const s = TVState.newGame();
  const st = TVStartups.STARTUPS[0];
  const clues = TVIntel.relevantNews(s, st);
  const first = clues[0];
  const second = clues.find(x => x.kind !== first.kind);
  assert(second, "serve un secondo ritaglio indipendente");
  s.readPages = [first.news.page, second.news.page];
  if (first.weight + second.weight < 3) {
    const extra = clues.find(x => !s.readPages.includes(x.news.page));
    s.readPages.push(extra.news.page);
  }
  const opened = TVIntel.chainFor(s, st);
  assert(opened.unlocked, "fonte non aperta");
  TVIntel.contactSource(s, st);
  const intel = TVIntel.forStartup(s, st);
  assert(intel.chain.contacted, "fonte non registrata");
  eq(intel.leadPower, 3, "Dossier Strike potenziato");
  eq(intel.ddCost, 25_000, "DD ridotta");
  assert(intel.privateClue === st.hiddenRisk, "rischio privato rivelato");
});

test("una portco mantiene la fonte riservata legata all'anno di ingresso", () => {
  const s = TVState.newGame();
  const st = TVStartups.STARTUPS[0];
  s.year = 1;
  const clues = TVIntel.relevantNews(s, st);
  const first = clues[0];
  const second = clues.find(x => x.kind !== first.kind);
  assert(second, "serve un secondo ritaglio indipendente");
  s.readPages = [first.news.page, second.news.page];
  if (first.weight + second.weight < 3) {
    const extra = clues.find(x => !s.readPages.includes(x.news.page));
    s.readPages.push(extra.news.page);
  }
  s.portfolio = [{
    id: st.id, name: st.name, sectorTag: st.sectorTag,
    investedAmount: 3_000_000, currentValueMultiplier: 1,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  s.year = 2;
  const chain = TVIntel.chainFor(s, st);
  assert(chain.unlocked, "fonte portco non aperta fuori dal dealflow");
  assert(TVIntel.linkedDeals(s, s.readPages[0]).some(x => x.id === st.id),
    "pagina letta non collega la portco");
});

test("la soffiata della fonte guida il mark nella stessa direzione", () => {
  const s = TVState.newGame();
  const st = TVStartups.byId("agiordie");
  const forecast = TVIntel.sourceForecast(st);
  eq(forecast.tone, "negative", "AGIorDie deve essere segnale negativo");
  // la previsione scriptata materializza nell'anno dell'evento
  s.year = forecast.materializeYear || 1;
  s.investigationSources[st.id] = { contacted: true, page: TVIntel.sourcePageFor(st), year: 1, forecast };
  s.portfolio = [{
    id: st.id, name: st.name, sectorTag: st.sectorTag,
    investedAmount: 3_000_000, currentValueMultiplier: 1,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  TVMarket.runYearEnd(s);
  assert(s.portfolio[0].currentValueMultiplier < 1, "mark non coerente con fonte negativa");
});

test("le pagine fonte privata sono univoche", () => {
  const pages = TVStartups.STARTUPS.map(st => TVIntel.sourcePageFor(st));
  eq(new Set(pages).size, TVStartups.STARTUPS.length, "pagine fonte");
});

console.log("\n== Scoring ==");
test("invested=0 → MOIC e DPI a 0, niente NaN", () => {
  const s = TVState.newGame();
  const m = TVScoring.computeMetrics(s);
  eq(m.moic, 0, "moic");
  eq(m.dpi, 0, "dpi");
  assert(!Number.isNaN(m.score), "score non NaN");
});

test("MOIC e DPI con posizioni note", () => {
  const s = TVState.newGame();
  s.invested = 10_000_000;
  s.realized = 5_000_000;
  s.portfolio = [{ id: "x", name: "X", sectorTag: "SAAS_VERTICAL",
    investedAmount: 10_000_000, currentValueMultiplier: 2.0,
    entryYear: 1, status: "active", realizedAmount: 0 }];
  const m = TVScoring.computeMetrics(s);
  approx(m.moic, 2.5, 1e-9, "(20M + 5M) / 10M");
  approx(m.dpi, 0.5, 1e-9, "5M / 10M");
});

test("posizioni chiuse escluse dal portfolio value", () => {
  const s = TVState.newGame();
  s.invested = 10_000_000;
  s.realized = 12_000_000;
  s.portfolio = [{ id: "x", name: "X", sectorTag: "CYBER_ENTERPRISE",
    investedAmount: 10_000_000, currentValueMultiplier: 3.0,
    entryYear: 1, status: "exited", realizedAmount: 12_000_000 }];
  const m = TVScoring.computeMetrics(s);
  eq(m.portfolioValue, 0, "posizione exited non conta nel value");
  approx(m.moic, 1.2, 1e-9, "solo realized");
});

test("lo scoring premia un deployment disciplinato", () => {
  const low = TVState.newGame();
  low.invested = 18_000_000;
  const high = TVState.newGame();
  high.invested = 72_000_000;
  const lowMetrics = TVScoring.computeMetrics(low);
  const highMetrics = TVScoring.computeMetrics(high);
  assert(highMetrics.deploymentScore > lowMetrics.deploymentScore,
    "deployment score non crescente");
  approx(highMetrics.deploymentRate, 0.8, 1e-9);
});

console.log("\n== Portfolio company call ==");
test("una crisi portfolio si genera dopo il dealflow e modifica la posizione", () => {
  const s = TVState.newGame();
  const picks = TVDealflow.currentYearDealflow(s);
  picks.forEach(st => TVDealflow.setDecision(s, st.id, "passed"));
  s.portfolio = [{
    id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  s.invested = 3_000_000;
  const incident = global.TVPortfolioIncidents.activeIncident(s);
  assert(incident, "incident non generato");
  const before = s.portfolio[0].currentValueMultiplier;
  const report = global.TVPortfolioIncidents.applyChoice(s, incident, incident.choices[0]);
  assert(report.metrics.length >= 2, "metriche mancanti");
  assert(s.portfolio[0].currentValueMultiplier !== before, "multiplo invariato");
  eq(global.TVPortfolioIncidents.activeIncident(s), null, "incident risolto");
});

test("una portfolio call puo' squillare anche prima di chiudere tutti i deal", () => {
  const s = TVState.newGame();
  TVDealflow.currentYearDealflow(s);
  s.portfolio = [{
    id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  assert(TVDealflow.pendingDeals(s).length > 0, "serve dealflow ancora aperto");
  const incident = global.TVPortfolioIncidents.activeIncident(s);
  assert(incident, "portfolio call non generata durante l'anno");
});

test("dopo una battle viene accodata una portfolio call post-battle", () => {
  const s = TVState.newGame();
  TVDealflow.currentYearDealflow(s);
  s.portfolio = [{
    id: "neuronote", name: "NeuroNote", sectorTag: "LEGALTECH_VERTICAL",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const queued = global.TVPortfolioIncidents.queueAfterBattle(s,
    TVStartups.byId("ragtag"), { decision: "passed" });
  assert(queued, "call post-battle non accodata");
  eq(queued.source, "after_battle", "source");
  eq(global.TVPortfolioIncidents.activeIncident(s).id, queued.id, "active dalla coda");
  const before = s.portfolio[0].currentValueMultiplier;
  global.TVPortfolioIncidents.applyChoice(s, queued, queued.choices[2]);
  assert(s.portfolio[0].currentValueMultiplier !== before, "call non determinante");
  eq(global.TVPortfolioIncidents.activeIncident(s), null, "niente annuale extra dopo post-battle");
});

test("una portfolio call gia' proposta non viene ripresentata", () => {
  const s = TVState.newGame();
  TVDealflow.currentYearDealflow(s);
  s.portfolio = [{
    id: "neuronote", name: "NeuroNote", sectorTag: "LEGALTECH_VERTICAL",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }, {
    id: "ragtag", name: "RagTag.ai", sectorTag: "AI_INFRA",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const first = global.TVPortfolioIncidents.queueAfterBattle(s,
    TVStartups.byId("agentforge"), { decision: "passed" });
  assert(first, "prima call non accodata");
  first.status = "resolved";
  const second = global.TVPortfolioIncidents.queueAfterBattle(s,
    TVStartups.byId("foundergpt"), { decision: "passed" });
  assert(!second || String(second.id).split("|")[0] !== String(first.id).split("|")[0],
    "stessa call ripresentata");
});

test("se la call base e' gia' vista, anno avanzato genera una call diversa", () => {
  const s = TVState.newGame();
  TVDealflow.currentYearDealflow(s);
  s.year = 3;
  s.portfolio = [{
    id: "neuronote", name: "NeuroNote", sectorTag: "LEGALTECH_VERTICAL",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  s.proposedPortfolioIncidentKeys = ["procurement"];
  const incident = global.TVPortfolioIncidents.queueAfterBattle(s,
    TVStartups.byId("ledgernova"), { decision: "passed" });
  assert(incident, "nessuna call alternativa generata");
  assert(String(incident.id).split("|")[0] !== "procurement",
    "call base ripresentata invece di alternativa");
});

test("procurement eterno scala cash e mostra un delta sotto il milione", () => {
  const s = TVState.newGame();
  const st = TVStartups.byId("neuronote");
  s.portfolio = [{
    id: st.id, name: st.name, sectorTag: st.sectorTag,
    investedAmount: 3_000_000, currentValueMultiplier: 1,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const incident = global.TVPortfolioIncidents.buildIncident(s, s.portfolio[0]);
  eq(incident.headline, "PROCUREMENT ETERNO", "serve incidente enterprise");
  const beforeCash = s.cash;
  const report = global.TVPortfolioIncidents.applyChoice(s, incident, incident.choices[0]);
  assert(s.cash < beforeCash, "cash non scalato");
  assert(report.metrics.some(m => m.label === "Cash" && /k|M/.test(String(m.delta))),
    "delta cash non leggibile");
  assert(!report.metrics.some(m => m.label === "Cash" && m.delta === "0M"),
    "delta cash arrotondato a zero");
});

test("portfolio call copre archetipi italiani distinti", () => {
  const s = TVState.newGame();
  const strongarm = TVStartups.byId("strongarm");
  const agi = TVStartups.byId("agiordie");
  const plant = global.TVPortfolioIncidents.buildIncident(s, {
    id: strongarm.id, name: strongarm.name, sectorTag: strongarm.sectorTag,
    investedAmount: 3_000_000, currentValueMultiplier: 1, status: "active"
  });
  const round = global.TVPortfolioIncidents.buildIncident(s, {
    id: agi.id, name: agi.name, sectorTag: agi.sectorTag,
    investedAmount: 3_000_000, currentValueMultiplier: 1, status: "active"
  });
  const grant = global.TVPortfolioIncidents.buildIncident(s, {
    id: "policy-test", name: "PolicyTest", sectorTag: "SPACE_DUAL_USE",
    investedAmount: 3_000_000, currentValueMultiplier: 1, status: "active"
  });
  eq(plant.headline, "PLANT VISIT DEL NORDEST", "archetipo industriale");
  eq(round.headline, "ROUND QUASI CHIUSO DA SEI MESI", "archetipo FOMO round");
  eq(grant.headline, "BANDO MINUSCOLO, RENDICONTO ENORME", "archetipo bando");
  assert(grant.context.join(" ").includes("anchor pubblico"), "allusione anchor mancante");
});

console.log("\n== Deal Access & Post Battle ==");
test("i round caldi richiedono piu' leverage e possono respingere un TS debole", () => {
  const s = TVState.newGame();
  const hot = {
    id: "hot-test", name: "HotTest", stage: "Series A",
    hype: 9, traction: 7, valuation: 80_000_000,
    founderProfile: "ego", corporateFitTag: "corp"
  };
  const cold = {
    id: "cold-test", name: "ColdTest", stage: "Pre-seed",
    hype: 1, traction: 1, valuation: 6_000_000,
    founderProfile: "first_time"
  };
  assert(TVDealAccess.requiredLeverage(hot) > TVDealAccess.requiredLeverage(cold),
    "il round caldo deve chiedere piu' leverage");
  const weak = TVDealAccess.termSheetVerdict(s, hot, { valuation: 80_000_000 });
  assert(!weak.accepted || weak.leverage < weak.required,
    "un TS debole non deve sembrare leverage sufficiente");
  const strong = TVDealAccess.termSheetVerdict(s, hot, {
    rv: { pitchWon: true, dd: true, refCall: true, coInvest: true, negotiatedValuation: 70_000_000 },
    intel: { level: 3, chain: { contacted: true } },
    battle: { won: true },
    valuation: 70_000_000
  });
  assert(strong.accepted, "leverage alto deve chiudere il round");
});

test("un evento post-battle non marca subito il multiplo ma crea un catalyst", () => {
  const s = TVState.newGame();
  s.year = 1;
  s.portfolio = [{
    id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const event = {
    id: "pb-test",
    startupId: "agiordie", startupName: "AGIorDie", headline: "FOUNDER DRAMA",
    choices: [{ label: "Operating partner", detail: "supporto",
      effects: { cash: -120_000, multiplierPct: 0.08, reputation: 1 } }]
  };
  const beforeCash = s.cash;
  const beforeMult = s.portfolio[0].currentValueMultiplier;
  const report = TVPostBattleEvents.applyChoice(s, event, event.choices[0]);
  assert(report.metrics.length >= 2, "metriche mancanti");
  assert(s.cash < beforeCash, "cash non scalato");
  eq(s.portfolio[0].currentValueMultiplier, beforeMult, "multiplo cambiato subito");
  assert(s.portfolioCatalysts && s.portfolioCatalysts.length === 1, "catalyst non registrato");
  TVMarket.runYearEnd(s);
  assert(s.portfolioCatalysts[0].applied, "catalyst non applicato a year-end");
  assert(s.portfolio[0].currentValueMultiplier !== beforeMult, "portfolio update non ha marcato");
});

test("dopo ogni battle c'e' un evento automatico, senza scelta manuale", () => {
  const s = TVState.newGame();
  const st = {
    id: "auto-event", name: "AutoEvent", sectorTag: "SAAS_VERTICAL",
    stage: "Seed", founderProfile: "competent", unitEconomics: 0.1,
    hype: 4
  };
  ["invested", "passed", "lost"].forEach(decision => {
    const event = TVPostBattleEvents.eventFor(s, st, {
      decision: decision,
      rv: { dd: true },
      intel: { level: 2 }
    });
    assert(event, "evento mancante: " + decision);
    assert(typeof event.autoChoiceIndex === "number", "autoChoiceIndex mancante");
    const applied = TVPostBattleEvents.applyAuto(s, event);
    assert(applied.choice, "scelta automatica mancante: " + decision);
  });
});

test("dopo una battle passata puo' arrivare un ping su una portco esistente", () => {
  const s = TVState.newGame();
  s.portfolio = [{
    id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const st = {
    id: "cold-new", name: "ColdNew", sectorTag: "SAAS_VERTICAL",
    stage: "Seed", founderProfile: "first_time", unitEconomics: 0.1,
    hype: 2
  };
  const event = TVPostBattleEvents.eventFor(s, st, {
    decision: "passed",
    intel: { level: 2 }
  });
  eq(event.headline, "PORTFOLIO PING", "evento portfolio atteso");
  eq(event.startupId, "agiordie", "target portco");
});

test("recordAfterBattle applica gli effetti veri ma lascia il multiplo al catalyst", () => {
  const s = TVState.newGame();
  s.portfolio = [{
    id: "agiordie", name: "AGIorDie", sectorTag: "AI_FOUNDATION",
    investedAmount: 3_000_000, currentValueMultiplier: 1.0,
    entryYear: 1, status: "active", realizedAmount: 0
  }];
  const beforeRep = s.reputation;
  const beforeMult = s.portfolio[0].currentValueMultiplier;
  const ops = TVPostBattleEvents.recordAfterBattle(s, {
    id: "cold-new", name: "ColdNew", sectorTag: "SAAS_VERTICAL",
    stage: "Seed", founderProfile: "first_time", unitEconomics: 0.1,
    hype: 2
  }, { decision: "passed", intel: { level: 2 } });
  assert(ops && ops.event && ops.choice, "evento operativo mancante");
  assert(ops.report && ops.report.metrics.length >= 1, "report senza metriche");
  // il PORTFOLIO PING preparato (intel>=2) sceglie "Signal captured": +1 rep
  assert(s.reputation > beforeRep, "gli effetti della scelta non sono applicati");
  eq(s.portfolio[0].currentValueMultiplier, beforeMult,
    "il multiplo non deve cambiare subito (catalyst)");
  assert((s.portfolioCatalysts || []).length === 1, "catalyst non accodato");
  const last = s.history[s.history.length - 1];
  eq(last.type, "post_battle_event", "history coerente con gli effetti");
});

console.log("\n== Exit e write-off ==");
test("exit scriptata genera realized e chiude la posizione", () => {
  const s = TVState.newGame();
  s.year = 2;
  s.invested = 5_000_000;
  s.portfolio = [{ id: "fortresslab", name: "FortressLab",
    sectorTag: "CYBER_ENTERPRISE", investedAmount: 5_000_000,
    currentValueMultiplier: 2.0, entryYear: 1, status: "active", realizedAmount: 0 }];
  const before = s.realized;
  const result = TVMarket.runYearEnd(s);
  const pos = s.portfolio[0];
  eq(pos.status, "exited", "posizione chiusa");
  assert(s.realized > before, "realized incrementato");
  assert(result.exits.length === 1, "exit riportata nei risultati");
  // proceeds = inv * mult(post rivalutazione) * premium 1.5 → > inv
  assert(pos.realizedAmount > pos.investedAmount, "exit in profitto");
});

test("write-off azzera e non genera proceeds", () => {
  const s = TVState.newGame();
  s.year = 3;
  s.invested = 3_000_000;
  s.portfolio = [{ id: "agiordie", name: "AGIorDie",
    sectorTag: "AI_FOUNDATION", investedAmount: 3_000_000,
    currentValueMultiplier: 0.6, entryYear: 2, status: "active", realizedAmount: 0 }];
  TVMarket.runYearEnd(s);
  const pos = s.portfolio[0];
  eq(pos.status, "writeoff", "status writeoff");
  eq(pos.realizedAmount, 0, "zero proceeds");
  eq(s.realized, 0, "realized invariato");
});

test("writedown taglia il multiplo ma non chiude", () => {
  const s = TVState.newGame();
  s.year = 3;
  s.invested = 5_000_000;
  s.portfolio = [{ id: "stealthmode", name: "StealthMode",
    sectorTag: "UNKNOWN", investedAmount: 5_000_000,
    currentValueMultiplier: 1.0, entryYear: 3, status: "active", realizedAmount: 0 }];
  TVMarket.runYearEnd(s);
  const pos = s.portfolio[0];
  assert(!pos.status || pos.status === "active", "resta attiva");
  assert(pos.currentValueMultiplier < 0.1, "multiplo schiacciato");
});

test("chiusura automatica anno applica year-end e apre recap portfolio", () => {
  const s = TVState.newGame();
  s.year = 1;
  const outcome = global.TVYearEnd.closeCurrentYear(s);
  eq(outcome.final, false, "non finale");
  eq(outcome.page, 460, "pagina recap");
  eq(s.year, 2, "anno avanzato");
  eq(s.lastYearOutcome.closedYear, 1, "ultimo anno chiuso");
  assert(s.icCache && s.icCache.y1, "year-end cache anno 1");
});

test("chiusura automatica anno 2 continua la Quick Run", () => {
  const s = TVState.newGame();
  s.year = 2;
  const outcome = global.TVYearEnd.closeCurrentYear(s);
  eq(outcome.final, false, "quick ancora aperta");
  eq(s.year, 3, "anno avanzato");
  assert(!s.gameOver, "quick non chiusa");
  assert(s.icCache && s.icCache.y2, "year-end cache anno 2");
});

test("chiusura automatica anno 3 chiude la Quick Run", () => {
  const s = TVState.newGame();
  s.year = 3;
  const outcome = global.TVYearEnd.closeCurrentYear(s);
  eq(outcome.final, true, "finale quick");
  eq(outcome.page, 460, "pagina recap finale");
  assert(s.gameOver, "game over quick");
  assert(s.icCache && s.icCache.y3, "year-end cache anno 3");
});

test("chiusura automatica anno 3 chiude la Partner Mode", () => {
  const s = TVState.newGame({ runMode: "partner" });
  s.year = 3;
  const outcome = global.TVYearEnd.closeCurrentYear(s);
  eq(outcome.final, true, "finale partner");
  eq(outcome.page, 460, "pagina recap finale");
  assert(s.gameOver, "game over");
  assert(s.icCache && s.icCache.y3, "year-end cache anno 3");
});

console.log("\n== Pitch Live ==");
const TVPitchBattle = global.TVPitchBattle, TVPitches = global.TVPitches;

test("ogni startup ha il pitch qualitativo (4 righe)", () => {
  TVStartups.STARTUPS.forEach(st => {
    const p = TVPitches.forStartup(st.id);
    assert(p && p.length >= 3, "pitch mancante o corto: " + st.id);
  });
});

test("ogni founderProfile ha un profilo di battaglia completo", () => {
  const used = new Set(TVStartups.STARTUPS.map(st => st.founderProfile));
  used.forEach(fp => {
    const p = TVPitchBattle.PROFILES[fp];
    assert(p, "profilo battaglia mancante: " + fp);
    assert(p.weak >= 1 && p.weak <= 4, "weak fuori range: " + fp);
    assert(p.resist >= 1 && p.resist <= 4, "resist fuori range: " + fp);
    assert(p.weak !== p.resist, "weak == resist: " + fp);
    for (let m = 1; m <= 4; m++)
      assert(p.react[m], "reazione mancante " + fp + " mossa " + m);
    assert(p.open.length > 0 && p.crack, "open/crack mancanti: " + fp);
    assert(p.face && p.faceDown && p.hint, "face/hint mancanti: " + fp);
    assert(TVPitchBattle.founderLabel(fp).length > 3, "label mancante: " + fp);
  });
});

test("giocare debolezza e cambiare angolo vince (skill premiata)", () => {
  Object.keys(TVPitchBattle.PROFILES).forEach(fp => {
    const b = TVPitchBattle.newBattle(fp);
    const p = TVPitchBattle.PROFILES[fp];
    const moves = [p.weak].concat([1, 2, 3, 4].filter(m => m !== p.weak && m !== p.resist));
    moves.forEach(m => { if (!b.over) TVPitchBattle.applyMove(b, m); });
    assert(b.over && b.won, "weak + due domande nuove dovrebbe vincere: " + fp);
    assert(b.turn === 3, fp + ": atteso 3 turni, ottenuto " + b.turn);
    eq(b.cred, TVPitchBattle.CRED_MAX - 1, fp + ": solo il turno non conclusivo costa sala");
  });
});

test("ripetere una domanda non produce nuovo danno", () => {
  const b = TVPitchBattle.newBattle("ego");
  TVPitchBattle.applyMove(b, TVPitchBattle.PROFILES.ego.weak);
  const guard = b.guard;
  const cred = b.cred;
  const turn = b.turn;
  TVPitchBattle.applyMove(b, TVPitchBattle.PROFILES.ego.weak);
  eq(b.guard, guard, "guardia invariata");
  eq(b.cred, cred, "controllo invariato");
  eq(b.turn, turn, "turno invariato");
  eq(b.lastOutcome, "repeat", "repeat tracciato");
});

test("la mossa parata non scalfisce, costa -2 e subisce il contrattacco", () => {
  const b = TVPitchBattle.newBattle("ego");
  const resist = TVPitchBattle.PROFILES.ego.resist;
  TVPitchBattle.applyMove(b, resist);
  eq(b.guard, TVPitchBattle.GUARD_MAX, "guardia intatta");
  eq(b.cred, TVPitchBattle.CRED_MAX - 3, "-2 parata e -1 contrattacco");
  eq(b.lastCounterCost, 1, "contrattacco tracciato");
});

test("la domanda neutra costa un punto controllo sala", () => {
  const b = TVPitchBattle.newBattle("ego");
  TVPitchBattle.applyMove(b, 1);
  eq(b.guard, TVPitchBattle.GUARD_MAX - 3, "guardia scalfita");
  eq(b.cred, TVPitchBattle.CRED_MAX - 1, "-1 contrattacco");
});

test("il dossier blocca il primo costo di controllo sala", () => {
  const b = TVPitchBattle.newBattle("ego", { intelShield: 1 });
  TVPitchBattle.applyMove(b, 1);
  eq(b.cred, TVPitchBattle.CRED_MAX, "controllo invariato");
  eq(b.intelShield, 0, "copertura consumata");
  assert(b.counterBlocked, "contrattacco marcato come bloccato");
});

test("la domanda armata dal dossier infligge danno extra e blocca la replica", () => {
  const b = TVPitchBattle.newBattle("ego", { intelMove: 1 });
  TVPitchBattle.applyMove(b, 1);
  eq(b.guard, TVPitchBattle.GUARD_MAX - 5, "3 danno neutro + 2 dossier");
  assert(b.intelTriggered, "colpo dossier attivato");
  assert(b.counterBlocked, "replica bloccata");
  assert(!b.intelStrikeAvailable, "bonus consumato");
});

test("la fonte privata porta il Dossier Strike a 3 danni extra", () => {
  const b = TVPitchBattle.newBattle("ego", { intelMove: 1, intelPower: 3 });
  TVPitchBattle.applyMove(b, 1);
  eq(b.guard, TVPitchBattle.GUARD_MAX - 6, "3 neutro + 3 fonte");
  assert(b.counterBlocked, "replica bloccata");
});

test("ripetere la parata non costa sala due volte", () => {
  const b = TVPitchBattle.newBattle("hustle");
  const resist = TVPitchBattle.PROFILES.hustle.resist;
  TVPitchBattle.applyMove(b, resist);
  TVPitchBattle.applyMove(b, resist);
  eq(b.cred, TVPitchBattle.CRED_MAX - 3, "solo primo errore costa");
  eq(b.turn, 1, "repeat non consuma turno");
  eq(b.lastOutcome, "repeat", "repeat tracciato");
});

test("il contrattacco cresce col passare dei turni", () => {
  eq(TVPitchBattle.counterCostFor(1), 1, "turno 1");
  eq(TVPitchBattle.counterCostFor(2), 1, "turno 2");
  eq(TVPitchBattle.counterCostFor(3), 2, "turno 3");
  eq(TVPitchBattle.counterCostFor(4), 2, "turno 4");
  eq(TVPitchBattle.counterCostFor(5), 3, "turno 5+");
});

test("tirare a caso puo' far perdere la sala (parata al primo turno)", () => {
  const b = TVPitchBattle.newBattle("ego");
  const p = TVPitchBattle.PROFILES.ego;
  const neutrals = [1, 2, 3, 4].filter(m => m !== p.weak && m !== p.resist);
  TVPitchBattle.applyMove(b, p.resist);      // -2 parata -1 contrattacco
  TVPitchBattle.applyMove(b, neutrals[0]);   // -1 contrattacco
  TVPitchBattle.applyMove(b, neutrals[1]);   // -2 contrattacco (turno 3)
  assert(b.over && !b.won, "sala persa prima di trovare la debolezza");
  eq(b.cred, 0, "controllo sala a zero");
  assert(b.guard > 0, "il founder e' ancora in piedi");
});

test("gli scudi del taccuino salvano chi ha letto il Televideo", () => {
  const b = TVPitchBattle.newBattle("ego", { intelShield: 2 });
  const p = TVPitchBattle.PROFILES.ego;
  const neutrals = [1, 2, 3, 4].filter(m => m !== p.weak && m !== p.resist);
  TVPitchBattle.applyMove(b, p.resist);      // scudo assorbe il contrattacco
  TVPitchBattle.applyMove(b, neutrals[0]);   // scudo assorbe il contrattacco
  TVPitchBattle.applyMove(b, neutrals[1]);   // -2 contrattacco (turno 3)
  assert(!b.over, "con gli scudi la sala regge");
  TVPitchBattle.applyMove(b, p.weak);        // 6 danni: crolla
  assert(b.over && b.won, "stesso ordine cieco, ma preparato: vittoria");
});

test("truthFor da' una verita' per ogni startup", () => {
  TVStartups.STARTUPS.forEach(st => {
    const t = TVPitchBattle.truthFor(st);
    assert(typeof t === "string" && t.length > 5, "truth vuota: " + st.id);
  });
});

console.log("\n== Sprite battaglia ==");
const TVSprites = global.TVSprites;

test("ogni founderProfile usato ha uno sprite (e c'e' il player)", () => {
  const used = new Set(TVStartups.STARTUPS.map(st => st.founderProfile));
  used.add("player");
  used.forEach(key => {
    assert(TVSprites.SPRITES[key], "sprite mancante: " + key);
  });
});

test("gli sprite sono griglie valide (18 col, solo palette)", () => {
  Object.keys(TVSprites.SPRITES).forEach(key => {
    const rows = TVSprites.SPRITES[key];
    assert(rows.length >= 5, "sprite troppo basso: " + key);
    rows.forEach((row, i) => {
      eq(row.length, 18, key + " riga " + i + " larghezza");
      assert(/^[.WYCGMRBSLDAKO]+$/.test(row),
        key + " riga " + i + ": carattere fuori palette");
    });
  });
});

test("spriteRows rende 18 colonne visibili per riga", () => {
  const strip = h => String(h).replace(/<[^>]*>/g, "");
  Object.keys(TVSprites.SPRITES).forEach(key => {
    TVSprites.spriteRows(key).forEach((html, i) => {
      eq(strip(html).length, 18, key + " riga html " + i);
    });
  });
});
test("gridHtml rende un pixel DOM per cella sprite", () => {
  Object.keys(global.TVSprites.SPRITES).forEach(key => {
    const sprite = global.TVSprites.SPRITES[key];
    const html = global.TVSprites.gridHtml(key);
    const pixels = (html.match(/class="px /g) || []).length;
    eq(pixels, sprite.length * 18, key + " pixel DOM");
  });
});

console.log("\n== Dati ==");
test("tutti gli exit event puntano a startup esistenti", () => {
  TVExits.EXIT_EVENTS.forEach(e => {
    assert(TVStartups.byId(e.startupId), "startup mancante: " + e.startupId);
  });
});

test("nessuna pagina news duplicata", () => {
  const pages = global.TVNews.NEWS.map(n => n.page);
  eq(new Set(pages).size, pages.length, "pagine news univoche");
});

test("i settori dei signal esistono negli indici", () => {
  const valid = new Set(Object.keys(global.TVSectors.SECTOR_INDICES));
  global.TVNews.NEWS.forEach(n => {
    if (n.signal) assert(valid.has(n.signal.sector),
      "settore signal sconosciuto: " + n.signal.sector + " (" + n.id + ")");
  });
});

test("tutti gli exit event sono raggiungibili nel fondo a 3 anni", () => {
  TVExits.EXIT_EVENTS.forEach(e => {
    assert(e.year >= 2 && e.year <= 3,
      "exit fuori orizzonte (y" + e.year + "): " + e.startupId);
  });
  const positive = TVExits.EXIT_EVENTS.filter(e =>
    e.kind === "exit" || e.kind === "ipo");
  assert(positive.length >= 4,
    "servono exit positive giocabili: trovate " + positive.length);
});

test("ogni signal pubblicato entro l'anno 3 materializza entro l'anno 3", () => {
  global.TVNews.NEWS.filter(n => n.year <= 3 && n.signal).forEach(n => {
    assert(n.signal.materializeYear <= 3,
      "signal orfano (materializza y" + n.signal.materializeYear + "): " + n.id);
  });
});

// ---------- esito ----------
console.log("\n" + passed + " passati, " + failed + " falliti");
process.exit(failed > 0 ? 1 : 0);
