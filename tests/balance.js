/* Benchmark riproducibile del motore economico, NON una stima dei giocatori.
   Confronta politiche dichiarate sugli stessi seed. Non legge la tabella exit.
   Esclude follow-on e LP/portfolio call: isola selezione, prezzo e mercato.
   Eseguire: node tests/balance.js [numero seed, default 300] */
"use strict";
const assert = require("node:assert/strict");
const { harness } = require("./harness");
const { ctx } = harness();
const samples = Math.max(10, Math.min(2000, Number(process.argv[2]) || 300));

function run(seed, policy, mode) {
  const s = ctx.TVState.newGame({ gameSeed: seed, runMode: mode });
  while (!s.gameOver) {
    const deals = ctx.TVDealflow.currentYearDealflow(s);
    for (const st of deals) {
      const rv = {};
      let intel = ctx.TVIntel.forStartup(s, st);
      let battle = ctx.TVPitchBattle.newBattle(st.founderProfile);
      let invest = policy === "spray" || (policy === "fomo" && st.hype >= 7);
      if (policy === "informed") {
        for (const item of intel.relevant) {
          if (!s.readPages.includes(item.news.page)) s.readPages.push(item.news.page);
        }
        intel = ctx.TVIntel.forStartup(s, st);
        ctx.TVGameplay.takeResearch(s, rv, "refCall", intel);
        ctx.TVGameplay.takeResearch(s, rv, "dd", intel);
        battle = ctx.TVPitchBattle.newBattle(st.founderProfile, {
          intelShield: intel.shield, intelMove: intel.lead && intel.lead.move, intelPower: intel.leadPower
        });
        const profile = ctx.TVPitchBattle.PROFILES[st.founderProfile];
        for (const move of [profile.weak, ...[1,2,3,4].filter(n => n !== profile.weak && n !== profile.resist)]) {
          ctx.TVPitchBattle.applyMove(battle, move);
        }
        rv.pitchWon = battle.won;
        // Dato accessibile vincendo la battle, non onniscienza sulle exit.
        invest = battle.won && st.unitEconomics >= -0.2 &&
          (st.traction >= 3 || st.strategicFit >= 8 || intel.momentum >= 0.15) &&
          intel.momentum > -0.20;
      }
      let valuation = Math.round(st.valuation * (battle.won ? 0.82 : 1));
      const amount = Math.min(ctx.TVFundMath.ticketOptions(st)[2], Math.max(0, s.cash - 200_000));
      const capped = ctx.TVFundMath.capTicketAmount(amount, valuation);
      if (invest && amount >= 1e6) {
        const verdict = ctx.TVDealAccess.termSheetVerdict(s, st, { rv, intel, battle, valuation, amount: capped });
        if (!verdict.accepted) valuation = Math.round(valuation * 1.12);
        s.cash -= capped;
        s.invested += capped;
        s.portfolio.push({ id: st.id, name: st.name, sectorTag: st.sectorTag,
          investedAmount: capped, entryValuation: valuation, entryYear: s.year,
          currentValueMultiplier: ctx.TVFundMath.entryMultiplier(st.valuation, valuation, capped),
          status: "active", realizedAmount: 0 });
        ctx.TVDealflow.setDecision(s, st.id, "invested");
      } else ctx.TVDealflow.setDecision(s, st.id, "passed");
    }
    ctx.TVMarket.runYearEnd(s);
    if (s.year === s.maxYear) s.gameOver = true;
    else s.year++;
    assert.ok(s.cash >= 0);
  }
  const metrics = ctx.TVScoring.computeMetrics(s);
  assert.ok(Number.isFinite(metrics.moic) && Number.isFinite(metrics.fundMultiple));
  return metrics;
}

function median(xs) { const sorted = xs.slice().sort((a,b) => a-b); return sorted[Math.floor(sorted.length / 2)]; }
const summary = [];
for (const mode of ["quick", "partner"]) {
  for (const policy of ["spray", "fomo", "informed"]) {
    const runs = Array.from({length: samples}, (_, i) => run(1000 + i, policy, mode));
    summary.push({ mode, policy, runs: samples,
      medianMOIC: +median(runs.map(x => x.moic)).toFixed(2),
      medianFund: +median(runs.map(x => x.fundMultiple)).toFixed(2),
      lossPct: +(100 * runs.filter(x => x.fundMultiple < 1).length / samples).toFixed(1),
      fundAbove2xPct: +(100 * runs.filter(x => x.fundMultiple >= 2).length / samples).toFixed(1),
      medianDeploymentPct: +median(runs.map(x => x.deploymentRate * 100)).toFixed(1)
    });
  }
}
console.table(summary);
for (const mode of ["quick", "partner"]) {
  const informed = summary.find(x => x.mode === mode && x.policy === "informed");
  const fomo = summary.find(x => x.mode === mode && x.policy === "fomo");
  assert.ok(informed.medianFund > fomo.medianFund, "L'informazione deve migliorare il caso mediano");
  assert.ok(fomo.lossPct > 20, "La FOMO non puo' essere una strategia sicura");
}
