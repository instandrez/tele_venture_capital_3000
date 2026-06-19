/* Risoluzione delle chiamate LP.
   Applica gli effetti di gameplay e restituisce un report strutturato
   usato dalla cinematic per rendere visibili tutte le conseguenze. */
(function (global) {

  const METRICS = {
    reputation: "REPUTAZIONE",
    innovationImpact: "IMPATTO"
  };

  function clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  function metric(label, before, after, kind) {
    return {
      label,
      before,
      after,
      delta: after - before,
      kind: kind || "global"
    };
  }

  function lpLabel(id) {
    const profile = global.TVLPProfiles && global.TVLPProfiles[id];
    return profile ? profile.name.toUpperCase() : ("LP " + id.toUpperCase());
  }

  function applySpecial(state, special) {
    const notes = [];
    if (special !== "writeoff_crypto") return notes;

    let count = 0;
    let value = 0;
    state.portfolio.forEach(p => {
      const root = (p.sectorTag || "").split("_")[0];
      if (root !== "CRYPTO" || (p.status && p.status !== "active")) return;

      p.status = "writeoff";
      p.exitYear = state.year;
      p.exitKind = "writeoff";
      p.realizedAmount = 0;
      count += 1;
      value += p.investedAmount || 0;
      state.history.push({
        year: state.year,
        type: "writeoff",
        startup: p.name,
        proceeds: 0,
        invested: p.investedAmount,
        note: "write-off etico"
      });
    });

    if (count) {
      notes.push({
        tone: "negative",
        text: count + " posizione" + (count === 1 ? "" : "i") +
          " crypto azzerata" + (count === 1 ? "" : "e") +
          " (" + formatEur(value) + ")"
      });
    }
    return notes;
  }

  function formatEur(value) {
    if (value >= 1_000_000) {
      const millions = value / 1_000_000;
      return millions.toFixed(Number.isInteger(millions) ? 0 : 1) + "MEUR";
    }
    if (value >= 1_000) return Math.round(value / 1_000) + "kEUR";
    return value + "EUR";
  }

  function toneFor(metrics, callerId) {
    const caller = metrics.find(m => m.kind === "lp" && m.id === callerId);
    const callerDelta = caller ? caller.delta : 0;
    const globalDelta = metrics
      .filter(m => m.kind === "global")
      .reduce((sum, m) => sum + m.delta, 0);
    const score = callerDelta + globalDelta * 0.6;
    if (score >= 5) return "positive";
    if (score <= -5) return "negative";
    return "mixed";
  }

  function applyChoice(state, call, choice) {
    const eff = choice.effects || {};
    const metrics = [];

    Object.keys(eff.lpSat || {}).forEach(id => {
      const before = state.lpSat[id] == null ? 50 : state.lpSat[id];
      const after = clamp(before + eff.lpSat[id]);
      state.lpSat[id] = after;
      const item = metric(lpLabel(id), before, after, "lp");
      item.id = id;
      metrics.push(item);
    });

    Object.keys(METRICS).forEach(key => {
      if (typeof eff[key] !== "number") return;
      const before = state[key] == null ? 50 : state[key];
      const after = clamp(before + eff[key]);
      state[key] = after;
      metrics.push(metric(METRICS[key], before, after, "global"));
    });

    if (!state.history) state.history = [];
    const notes = applySpecial(state, eff.special);

    if (!state.usedLPCalls) state.usedLPCalls = [];
    if (!state.usedLPCalls.includes(call.id)) state.usedLPCalls.push(call.id);

    const report = {
      callId: call.id,
      callerId: call.lp,
      answer: choice.label,
      metrics,
      notes
    };
    report.tone = toneFor(metrics, call.lp);

    state.history.push({
      year: state.year,
      type: "lp_call",
      lp: call.lp,
      call: call.id,
      answer: choice.label,
      outcome: metrics.map(m => ({
        label: m.label,
        before: m.before,
        after: m.after,
        delta: m.delta
      }))
    });

    return report;
  }

  global.TVLPRelations = { applyChoice, toneFor };
})(window);
