"use strict";
const assert = require("node:assert/strict");
const { harness } = require("./harness");
let passed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log("  ok  " + name); }
  catch (error) { console.error("FAIL  " + name); throw error; }
}
function setup(seed = 42, mode = "quick") {
  const h = harness();
  const s = h.ctx.TVState.newGame({ gameSeed: seed, runMode: mode });
  h.go(200); h.flush();
  const st = h.ctx.TVDealflow.currentYearDealflow(s)[0];
  return { ...h, s, st };
}
function battle(h) { h.go(301); h.flush(); return h.s.startupReveals[h.st.id]; }
function win(h) {
  const profile = h.ctx.TVPitchBattle.PROFILES[h.st.founderProfile];
  h.act(profile.weak);
  for (const move of [1, 2, 3, 4]) {
    if (move !== profile.weak && move !== profile.resist) h.act(move);
  }
}

console.log("\n== Gameplay: regressioni e flussi con DOM simulato ==");
test("una domanda salva PRIMA dell'animazione e non richiede conferme", () => {
  const h = setup(); battle(h);
  const weak = h.ctx.TVPitchBattle.PROFILES[h.st.founderProfile].weak;
  h.act(weak, false);
  const saved = JSON.parse(h.storage["tvc3000.save"]);
  assert.equal(saved.startupReveals[h.st.id].snap.turn, 1);
  h.flush();
  assert.ok(!h.scene().includes("CONTINUA QUANDO"));
  assert.match(h.scene(), /DOMANDA SUPER EFFICACE/);
  h.go(100); h.flush(); h.ctx.TVState.load(); h.s = h.ctx.TVState.current;
  h.go(301); h.flush();
  h.act(weak);
  assert.equal(h.s.startupReveals[h.st.id].snap.turn, 1);
});
test("lasciare una battle ferma i timer; non contaminano il founder successivo", () => {
  const h = setup(); battle(h);
  h.act(1, false); h.go(302); h.flush();
  const second = h.ctx.TVDealflow.currentYearDealflow(h.s)[1];
  assert.equal(h.s.startupReveals[second.id].snap.turn, 0);
  assert.equal(h.s.currentPage, 302);
  assert.match(h.scene(), new RegExp(second.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
test("ricerca: due scelte, nessun terzo acquisto ne' doppio addebito", () => {
  const h = setup(); const rv = battle(h);
  h.act(6); h.act(5);
  const cash = h.s.cash;
  h.act(8); h.act(5);
  assert.equal(h.s.cash, cash);
  assert.equal(h.ctx.TVGameplay.researchRemaining(rv), 0);
  assert.equal(rv.coInvest, undefined);
  assert.match(h.scene(), /Agenda piena|completato/);
  assert.match(h.scene(), /disabled aria-disabled="true"/);
});
test("vittoria e premio una sola volta anche con reload durante il colpo finale", () => {
  const h = setup(); const rv = battle(h);
  const p = h.ctx.TVPitchBattle.PROFILES[h.st.founderProfile];
  h.act(p.weak);
  const neutral = [1,2,3,4].filter(n => n !== p.weak && n !== p.resist);
  h.act(neutral[0]); h.act(neutral[1], false);
  assert.equal(rv.pitchWon, true);
  assert.equal(h.s.reputation, 51);
  h.go(100); h.ctx.TVState.load(); h.s = h.ctx.TVState.current; h.go(301); h.flush();
  assert.equal(h.s.reputation, 51);
  assert.match(h.scene(), /TERM SHEET/);
});
test("KO irrevocabile prima della sequenza, senza ripescaggio o doppio evento", () => {
  const h = setup(); const rv = battle(h);
  const p = h.ctx.TVPitchBattle.PROFILES[h.st.founderProfile];
  const neutral = [1,2,3,4].filter(n => n !== p.weak && n !== p.resist);
  h.act(p.resist); h.act(neutral[0]); h.act(neutral[1], false);
  assert.equal(rv.pitchLost, true);
  assert.equal(h.ctx.TVDealflow.getDecision(h.s, h.st.id), "passed");
  const rep = h.s.reputation;
  const count = h.s.history.filter(x => x.type === "post_battle_event").length;
  h.go(100); h.go(200); h.flush();
  assert.equal(h.s.currentPage, 301);
  assert.equal(h.s.reputation, rep);
  assert.equal(h.s.history.filter(x => x.type === "post_battle_event").length, count);
  assert.match(h.scene(), /SALA PERSA, NON IL FONDO/);
  h.act(1);
  assert.equal(h.s.currentPage, 200);
});
test("memo dopo pass: una conferma, evento persistente, ripresa idempotente", () => {
  const h = setup(); const rv = battle(h);
  h.act(9, false);
  assert.equal(rv.decisionReceipt.decision, "passed");
  const count = h.s.history.length;
  h.go(200); h.flush();
  assert.equal(h.s.history.length, count);
  assert.match(h.scene(), /CONTINUA AL DEALFLOW/);
  assert.ok(!h.scene().includes("CONTINUA QUANDO"));
  h.act(8);
  assert.equal(rv.decisionReceipt.acknowledged, false);
  h.act(1);
  assert.equal(rv.decisionReceipt.acknowledged, true);
  assert.equal(h.s.currentPage, 200);
});
test("il dossier supera la parata: la mossa consigliata non punisce il giocatore", () => {
  const { ctx } = setup();
  for (const [key, p] of Object.entries(ctx.TVPitchBattle.PROFILES)) {
    const b = ctx.TVPitchBattle.newBattle(key, { intelMove: p.resist, intelPower: 3 });
    ctx.TVPitchBattle.applyMove(b, p.resist);
    assert.equal(b.cred, 6);
    assert.equal(b.guard, 6);
    assert.equal(b.intelTriggered, true);
  }
});
test("negoziazione espone la probabilita' prima dell'invio", () => {
  const h = setup(); battle(h); h.act(7);
  assert.match(h.scene(), /Probabilita'/);
  assert.match(h.scene(), /Un solo tentativo/);
  assert.equal(h.s.startupReveals[h.st.id].negotiated, undefined);
});
test("notizie future bloccate prima di archiviare il ritaglio", () => {
  const h = setup();
  const future = h.ctx.TVNews.NEWS.find(n => n.year === 3 && n.section === 160);
  const pageBefore = h.s.currentPage;
  h.go(future.page);
  assert.equal(h.s.currentPage, pageBefore);
  assert.ok(!h.s.readPages.includes(future.page));
});
test("leggere una fonte non cambia il rendimento della stessa posizione", () => {
  const h = setup();
  for (const st of h.ctx.TVStartups.STARTUPS) {
    const a = h.ctx.TVState.newGame({ gameSeed: 93 });
    a.year = 3;
    a.portfolio = [{ id: st.id, name: st.name, entryYear: 1, investedAmount: 3e6,
      currentValueMultiplier: 1, status: "active" }];
    const b = JSON.parse(JSON.stringify(a));
    b.investigationSources[st.id] = { contacted: true, forecast: { tone: "positive", materializeYear: 3 } };
    h.ctx.TVMarket.runYearEnd(a); h.ctx.TVMarket.runYearEnd(b);
    assert.equal(a.realized, b.realized, st.id);
    assert.equal(a.portfolio[0].currentValueMultiplier, b.portfolio[0].currentValueMultiplier, st.id);
  }
});
test("il memo valuta le prove e il prezzo, non anticipa exit scriptate", () => {
  const { ctx, s } = setup();
  const good = ctx.TVStartups.byId("deepforge");
  const bad = ctx.TVStartups.byId("agiordie");
  const intel = { level: 2, read: [], momentum: 0 };
  assert.deepEqual(ctx.TVGameplay.decisionRead(s, good, {}, intel, "passed"),
    ctx.TVGameplay.decisionRead(s, bad, {}, intel, "passed"));
  for (const st of ctx.TVStartups.STARTUPS) {
    const forecast = ctx.TVIntel.sourceForecast(st);
    assert.ok(!/anno \d|finisce in|write-off|IPO oversubscribed/.test(forecast.message), st.id);
  }
});
test("sovrapprezzo penalizzato, sconto post-money, target coerente con scoring", () => {
  const { ctx, s } = setup();
  assert.equal(ctx.TVFundMath.entryMultiplier(20e6, 30e6, 10e6), 0.75);
  assert.equal(ctx.TVFundMath.entryMultiplier(20e6, 10e6, 10e6), 1.5);
  s.year = 3;
  assert.equal(ctx.TVFundMath.targetForYear(s), 54e6);
  s.runMode = "partner";
  assert.equal(ctx.TVFundMath.targetForYear(s), 72e6);
  assert.equal(ctx.TVScoring.computeMetrics(s).fundMultiple, 0.9);
});
test("riaprire la home non aggiunge telefonate a ogni battle", () => {
  const { ctx, s } = setup();
  s.portfolio = [{ id: "neuronote", name: "NeuroNote", sectorTag: "LEGALTECH_VERTICAL",
    investedAmount: 6e6, currentValueMultiplier: 1, entryYear: 1, status: "active" }];
  const first = ctx.TVPortfolioIncidents.queueAfterBattle(s, ctx.TVStartups.byId("neuronote"), { decision: "invested" });
  assert.ok(first);
  first.status = "resolved";
  assert.equal(ctx.TVPortfolioIncidents.queueAfterBattle(s, ctx.TVStartups.byId("ragtag"), { decision: "passed" }), null);
});
test("chiusura anno esplicita: mostra il costo delle LP call, niente autoplay", () => {
  const h = setup();
  h.ctx.TVDealflow.currentYearDealflow(h.s).forEach(st => h.ctx.TVDealflow.setDecision(h.s, st.id, "passed"));
  h.go(450); h.flush();
  assert.equal(h.s.year, 1);
  assert.match(h.page(), /CHIUDI ANNO E SCOPRI/);
  h.act(1);
  assert.equal(h.s.year, 2);
  assert.equal(h.s.currentPage, 460);
  assert.equal(h.ctx.TVGameplay.nextStep(h.s).page, 460);
  h.act(1);
  assert.equal(h.s.lastYearOutcome.acknowledged, true);
  assert.equal(h.s.currentPage, 100);
});
test("le pagine lunghe non perdono testo e una scena non ha link numerici automatici", () => {
  const h = setup();
  h.ctx.TVRender.show(103, Array.from({length: 60}, (_, i) => "riga " + i).join("\n"));
  assert.match(h.page(), /riga 59/);
  assert.ok(!h.page().includes("righe nascoste"));
  battle(h);
  assert.match(h.scene(), /PITCH E APPUNTI/);
  assert.equal(h.timers.size, 0, "nessun repaint idle che chiuda gli appunti");
});
test("riprova lo stesso seed e migra i save precedenti senza perdere il fondo", () => {
  const h = setup(0);
  const ids = h.ctx.TVDealflow.currentYearDealflow(h.s).map(st => st.id).join();
  h.ctx.TVState.save(); h.ctx.TVState.load();
  assert.equal(h.ctx.TVState.current.gameSeed, 0);
  h.ctx.TVState.newGame({ gameSeed: 0 });
  assert.equal(h.ctx.TVDealflow.currentYearDealflow(h.ctx.TVState.current).map(st => st.id).join(), ids);
  h.storage["tvc3000.save"] = JSON.stringify({ ...h.s, version: 7, lastYearOutcome: { closedYear: 1 } });
  h.ctx.TVState.load();
  assert.equal(h.ctx.TVState.current.version, 8);
  assert.equal(h.ctx.TVState.current.lastYearOutcome.acknowledged, true);
});

test("investimento atomico: ESC durante il lancio salva ticket, evento e memo una sola volta", () => {
  const h = setup(); const rv = battle(h);
  win(h); h.act(6); h.act(8); h.act(0); h.act(2, false);
  assert.equal(h.s.portfolio.length, 1);
  assert.equal(rv.decisionReceipt.decision, "invested");
  const cash = h.s.cash;
  const invested = h.s.invested;
  h.go(100); h.ctx.TVState.load(); h.s = h.ctx.TVState.current;
  h.go(200); h.flush();
  assert.match(h.scene(), /DEAL MEMO/);
  h.act(3);
  assert.equal(h.s.cash, cash);
  assert.equal(h.s.invested, invested);
  assert.equal(h.s.portfolio.length, 1);
  h.act(1);
  assert.equal(h.s.currentPage, 200);
});

test("partite complete Quick e Partner: investimenti, call, follow-on, LP, fine e rivincita", () => {
  for (const mode of ["quick", "partner"]) {
    const h = setup(1701, mode);
    let actions = 0;
    while (!h.s.gameOver && actions++ < 300) {
      const current = h.s.currentPage;
      if (current === 100) { h.go(h.ctx.TVGameplay.nextStep(h.s).page); h.flush(); }
      else if (current === 200) {
        const all = h.ctx.TVDealflow.currentYearDealflow(h.s);
        const idx = all.findIndex(st => h.ctx.TVDealflow.getDecision(h.s, st.id) === "pending");
        if (idx >= 0) { h.st = all[idx]; h.go(301 + idx); h.flush(); }
        else { h.go(450); h.flush(); }
      } else if (current >= 301 && current <= 305) {
        if (h.scene().includes("CONTINUA QUANDO")) { h.act(1); continue; }
        if (h.scene().includes("CONTINUA AL DEALFLOW")) { h.act(1); continue; }
        if (h.scene().includes("ALZA VALUATION +12%")) { h.act(1); continue; }
        const rv = h.s.startupReveals[h.st.id];
        if (!rv.pitchWon) win(h);
        if (h.scene().includes("CONTINUA AL DEALFLOW")) continue;
        if (h.s.cash < 3e6) { h.act(9); continue; }
        h.act(0); h.act(1);
      } else if (current === 620) { h.act(1); h.act(1); }
      else if (current === 600) {
        if (h.ctx.TVLPCalls.pickCallsForYear(h.s).length) { h.act(1); h.act(1); }
        else { h.go(450); h.flush(); }
      } else if (current === 450) {
        if (h.page().includes("CHIUDI ANNO E SCOPRI")) {
          if (h.ctx.TVLPCalls.pickCallsForYear(h.s).length) h.act(2);
          else h.act(1);
        } else h.act(9);
      } else if (current === 460) h.act(1);
      else throw new Error("Pagina inattesa " + current);
      assert.ok(h.s.cash >= 0, "cash negativo");
      assert.equal(new Set(h.s.portfolio.map(p => p.id)).size, h.s.portfolio.length);
    }
    assert.ok(h.s.gameOver, mode + " non termina");
    assert.equal(h.s.year, 3);
    h.go(700); h.flush();
    assert.match(h.scene(), /RIVINCITA: STESSO MERCATO/);
    const seed = h.s.gameSeed;
    h.act(4);
    assert.equal(h.ctx.TVState.current.year, 1);
    assert.equal(h.ctx.TVState.current.gameSeed, seed);
    assert.equal(h.ctx.TVState.current.portfolio.length, 0);
  }
});

test("indizi trovati a battle iniziata aiutano senza ricaricare gli scudi consumati", () => {
  const h = setup(); const rv = battle(h);
  assert.equal(rv.snap.intelShield, 0);
  h.go(100);
  h.ctx.TVIntel.forStartup(h.s, h.st).relevant.forEach(item => h.s.readPages.push(item.news.page));
  h.go(301); h.flush();
  assert.ok(rv.snap.intelShield > 0);
  const p = h.ctx.TVPitchBattle.PROFILES[h.st.founderProfile];
  const neutral = [1,2,3,4].find(n => n !== p.weak && n !== p.resist && n !== rv.snap.intelMove);
  h.act(neutral);
  const remaining = rv.snap.intelShield;
  h.go(100); h.go(301); h.flush();
  assert.equal(rv.snap.intelShield, remaining);
});
test("sigla breve: quattro scene, skip al dealflow, nessun timer che riporti indietro", () => {
  const h = setup();
  h.go(105);
  assert.match(h.scene(), /MISSION 01\/04/);
  h.act(0);
  assert.equal(h.s.currentPage, 200);
  h.go(105); h.flush();
  assert.match(h.scene(), /MISSION 04\/04/);
  h.act(1);
  assert.equal(h.s.currentPage, 200);
});
test("il mercato distingue hype senza clienti, margini e contesto duplicato", () => {
  const { ctx } = setup();
  const st = ctx.TVStartups.byId("ragtag");
  const base = { ...st, hype: 10, traction: 0, hypeDecay: 0.8, unitEconomics: -0.6 };
  const proved = { ...base, traction: 8, unitEconomics: 0.4 };
  assert.ok(ctx.TVMarket.baselineModulation(base, 0) < -0.25);
  assert.ok(ctx.TVMarket.baselineModulation(proved, 0) > 0);
  assert.ok(ctx.TVMarket.getSignalEffect({ type: "corporate_opp", scope: st.corporateFitTag,
    sector: "AI", delta: -10 }, st) < 0);
  function mark(news) {
    const s = ctx.TVState.newGame({ gameSeed: 128 });
    s.portfolio = [{ id: st.id, name: st.name, entryYear: 1, investedAmount: 3e6, currentValueMultiplier: 1 }];
    const original = ctx.TVNews.NEWS;
    try { ctx.TVNews.NEWS = news; ctx.TVMarket.runYearEnd(s); }
    finally { ctx.TVNews.NEWS = original; }
    return s.portfolio[0].currentValueMultiplier;
  }
  const article = { year: 1, headline: "Ciclo AI", signal: {
    type: "trend", sector: "AI", delta: 40, materializeYear: 1 } };
  assert.equal(mark([article]), mark([article, article, article]));
  assert.equal(mark([]), mark([{ ...article, year: 2 }]));
});
test("il premio di exit ricompensa il rischio tenuto, non la secondaria dell'ultimo minuto", () => {
  const { ctx } = setup();
  function close(entryYear) {
    const s = ctx.TVState.newGame({ gameSeed: 3456 });
    s.year = 3;
    s.portfolio = [{ id: "deepforge", name: "DeepForge", entryYear,
      investedAmount: 6e6, currentValueMultiplier: 1, status: "active" }];
    ctx.TVMarket.runYearEnd(s);
    return s.realized;
  }
  assert.ok(close(1) > close(3) * 2);
  assert.equal(close(1), close(1));
});
test("cambiare anno non riapre il founder della vecchia mappa", () => {
  const h = setup();
  const oldId = h.st.id;
  h.s.year = 2;
  const current = h.ctx.TVDealflow.currentYearDealflow(h.s)[0];
  assert.notEqual(current.id, oldId);
  h.go(301); h.flush();
  assert.ok(h.s.startupReveals[current.id].snap);
  assert.equal(h.s.startupReveals[oldId], undefined);
});
test("il report dell'ultimo anno resta il prossimo passo e non nasconde le ultime exit", () => {
  const h = setup();
  h.s.gameOver = true;
  h.s.lastYearOutcome = { closedYear: 3, final: true, acknowledged: false, result: {
    events: [], exits: Array.from({length: 8}, (_, i) => ({
      startup: "Company " + i, kind: "exit", note: "Motivo " + i, proceeds: 1e6 })) } };
  assert.equal(h.ctx.TVGameplay.nextStep(h.s).page, 460);
  h.go(460);
  assert.match(h.page(), /Company 7/);
  assert.match(h.page(), /Motivo 7/);
  h.act(1);
  assert.equal(h.ctx.TVGameplay.nextStep(h.s).page, 700);
});

console.log("\n" + passed + " regressioni gameplay passate.");
