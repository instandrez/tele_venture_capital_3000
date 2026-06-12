/* Test runner minimale per il motore di Tele Venture Capital 3000.
   Esecuzione:  node tests/run.js
   Nessuna dipendenza: stub di window/localStorage e assert artigianali.

   Copre i criteri MVP di VERIFICHE_CODEX.md:
   - nuova partita e valori iniziali
   - dealflow: 3 startup distinte, riproducibile a parità di seed,
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
load("data/exitEvents.js");
load("data/lpCalls.js");
load("data/titles.js");
load("engine/scoring.js");
load("engine/marketEngine.js");
load("engine/dealflow.js");
load("engine/pitchBattle.js");

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
      TVStartups = global.TVStartups, TVExits = global.TVExits;

// ---------- test ----------
console.log("\n== Stato iniziale ==");
test("nuova partita: valori iniziali corretti", () => {
  const s = TVState.newGame();
  eq(s.year, 1, "year");
  eq(s.cash, 100_000_000, "cash");
  eq(s.invested, 0, "invested");
  eq(s.realized, 0, "realized");
  eq(s.portfolio.length, 0, "portfolio");
  assert(s.gameSeed > 0, "gameSeed presente");
  assert(s.gameStarted, "gameStarted");
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

console.log("\n== Dealflow ==");
test("3 startup distinte per anno", () => {
  const s = TVState.newGame();
  const picks = TVDealflow.currentYearDealflow(s);
  eq(picks.length, 3, "numero deal");
  const ids = new Set(picks.map(p => p.id));
  eq(ids.size, 3, "id univoci");
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

console.log("\n== Exit e write-off ==");
test("exit scriptata genera realized e chiude la posizione", () => {
  const s = TVState.newGame();
  s.year = 4;
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
  s.year = 5;
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
  s.year = 5;
  s.invested = 5_000_000;
  s.portfolio = [{ id: "stealthmode", name: "StealthMode",
    sectorTag: "UNKNOWN", investedAmount: 5_000_000,
    currentValueMultiplier: 1.0, entryYear: 3, status: "active", realizedAmount: 0 }];
  TVMarket.runYearEnd(s);
  const pos = s.portfolio[0];
  assert(!pos.status || pos.status === "active", "resta attiva");
  assert(pos.currentValueMultiplier < 0.1, "multiplo schiacciato");
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

test("giocare la debolezza vince sempre (skill premiata)", () => {
  Object.keys(TVPitchBattle.PROFILES).forEach(fp => {
    const b = TVPitchBattle.newBattle(fp);
    const weak = TVPitchBattle.PROFILES[fp].weak;
    let guard = 0;
    while (!b.over && guard++ < 20) TVPitchBattle.applyMove(b, weak);
    assert(b.over && b.won, "weak spam dovrebbe vincere: " + fp);
    assert(b.turn === 3, fp + ": atteso 3 turni, ottenuto " + b.turn);
  });
});

test("la mossa parata non scalfisce e costa credibilita'", () => {
  const b = TVPitchBattle.newBattle("ego");
  const resist = TVPitchBattle.PROFILES.ego.resist;
  TVPitchBattle.applyMove(b, resist);
  eq(b.guard, TVPitchBattle.GUARD_MAX, "guardia intatta");
  eq(b.cred, TVPitchBattle.CRED_MAX - 3, "-2 parata -1 contrattacco");
});

test("spammare la parata fa perdere la sala", () => {
  const b = TVPitchBattle.newBattle("hustle");
  const resist = TVPitchBattle.PROFILES.hustle.resist;
  let guard = 0;
  while (!b.over && guard++ < 20) TVPitchBattle.applyMove(b, resist);
  assert(b.over && !b.won, "resist spam deve perdere");
});

test("truthFor da' una verita' per ogni startup", () => {
  TVStartups.STARTUPS.forEach(st => {
    const t = TVPitchBattle.truthFor(st);
    assert(typeof t === "string" && t.length > 5, "truth vuota: " + st.id);
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

// ---------- esito ----------
console.log("\n" + passed + " passati, " + failed + " falliti");
process.exit(failed > 0 ? 1 : 0);
