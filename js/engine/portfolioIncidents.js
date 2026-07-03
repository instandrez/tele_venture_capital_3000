/* Portfolio company incidents.
   Chiamate operative delle partecipate: una crisi/anno, se il fondo ha
   posizioni attive e il dealflow annuale e' stato deliberato. */
(function (global) {

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function keyFor(state) {
    return "y" + ((state && state.year) || 1);
  }

  function activePositions(state) {
    return (state.portfolio || []).filter(p =>
      (!p.status || p.status === "active") && p.investedAmount > 0
    );
  }

  function canTrigger(state) {
    if (!state || !state.gameStarted || state.gameOver) return false;
    if (!activePositions(state).length) return false;
    const key = keyFor(state);
    if (!state.dealflowCache || !state.dealflowCache[key]) return false;
    return true;
  }

  function riskScore(pos, state) {
    const st = TVStartups.byId(pos.id) || {};
    let score = 0;
    if (pos.currentValueMultiplier < 1) score += 3;
    if (st.unitEconomics < 0) score += Math.abs(st.unitEconomics) * 4;
    if (st.regulatoryExposure < 0) score += Math.abs(st.regulatoryExposure) * 3;
    if (st.founderProfile === "red_flag") score += 4;
    if (st.founderProfile === "ego") score += 2;
    if (st.hype >= 8) score += 1.5;
    return score + TVState.roll("incident-risk|" + pos.id + "|" + keyFor(state));
  }

  function pickPosition(state) {
    return activePositions(state).slice().sort((a, b) =>
      riskScore(b, state) - riskScore(a, state)
    )[0] || null;
  }

  function baseCost(pos, ratio) {
    return Math.max(300_000, Math.round((pos.investedAmount || 1_000_000) * ratio));
  }

  function moneyLabel(value) {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value || 0);
    if (abs >= 1_000_000) {
      const exact = abs % 1_000_000 === 0;
      return sign + (abs / 1_000_000).toFixed(exact ? 0 : 1) + "M";
    }
    if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "k";
    return sign + abs;
  }

  function choice(label, detail, effects) {
    return {
      label: label,
      detail: detail,
      cost: Math.max(0, -(effects.cash || 0)),
      effects: effects
    };
  }

  function buildIncident(state, pos) {
    const st = TVStartups.byId(pos.id) || {};
    const year = state.year || 1;
    const common = {
      year: year,
      startupId: pos.id,
      startupName: pos.name,
      sectorTag: pos.sectorTag,
      status: "pending"
    };

    if (st.founderProfile === "red_flag" || st.founderProfile === "ego") {
      return Object.assign(common, {
        id: "founder|" + pos.id + "|y" + year,
        tone: "founder",
        caller: "BOARD OBSERVER",
        face: "shadow",
        headline: "FOUNDER DRAMA",
        context: [
          pos.name + " chiama fuori agenda.",
          "Il team segnala churn interno e decisioni prodotto incoerenti.",
          "Rischio nascosto: " + (st.hiddenRisk || "governance fragile") + "."
        ],
        choices: [
          choice("Board intervention", "Metti un operating partner nel weekly e blocchi spese non core.",
            { cash: -baseCost(pos, 0.10), multiplierPct: 0.14, reputation: 3, impact: 1 }),
          choice("Founder ultimatum", "Term sheet emotivo: milestone entro 60 giorni o taglio del runway.",
            { cash: 0, multiplierPct: 0.04, reputation: 1, impact: -1 }),
          choice("Let it run", "Non tocchi il founder. Velocissimo, finche' non lo e' piu'.",
            { cash: 0, multiplierPct: -0.24, reputation: -4, impact: -2, lp: -2 })
        ]
      });
    }

    if ((st.regulatoryExposure || 0) < -0.35) {
      return Object.assign(common, {
        id: "reg|" + pos.id + "|y" + year,
        tone: "regulatory",
        caller: "LEGAL COUNSEL",
        face: "visor",
        headline: "REGULATORY NOTICE",
        context: [
          pos.name + " riceve una richiesta chiarimenti dal regolatore.",
          "Il founder minimizza, ma il go-to-market si puo' fermare.",
          "Rischio nascosto: " + (st.hiddenRisk || "licenza non chiara") + "."
        ],
        choices: [
          choice("War room compliance", "Paghi legali seri e ripulisci il piano enterprise.",
            { cash: -baseCost(pos, 0.16), multiplierPct: 0.12, reputation: 3, impact: 0 }),
          choice("Pivot regulated-lite", "Riduci TAM, ma salvi il round successivo.",
            { cash: -baseCost(pos, 0.06), multiplierPct: -0.02, reputation: 1, impact: 1 }),
          choice("Ignore notice", "Aspetti che passi. Non passa.",
            { cash: 0, multiplierPct: -0.28, reputation: -5, impact: -1, lp: -3 })
        ]
      });
    }

    if ((st.unitEconomics || 0) < -0.2) {
      return Object.assign(common, {
        id: "burn|" + pos.id + "|y" + year,
        tone: "burn",
        caller: "CFO",
        face: "client",
        headline: "BURN ALERT",
        context: [
          pos.name + " sta crescendo, ma ogni nuovo cliente brucia margine.",
          "Il founder chiede bridge per non perdere narrativa di round.",
          "Rischio nascosto: " + (st.hiddenRisk || "unit economics deboli") + "."
        ],
        choices: [
          choice("Bridge + finance ops", "Metti cash, ma pretendi pricing e churn dashboard settimanale.",
            { cash: -baseCost(pos, 0.22), multiplierPct: 0.16, reputation: 2, impact: 1 }),
          choice("Cut growth spend", "Tagli canali sporchi. Meno hype, piu' sopravvivenza.",
            { cash: 0, multiplierPct: 0.05, reputation: 1, impact: -1 }),
          choice("No bridge", "Li lasci tornare sul mercato deboli.",
            { cash: 0, multiplierPct: -0.26, reputation: -3, impact: -2, lp: -2 })
        ]
      });
    }

    return Object.assign(common, {
      id: "growth|" + pos.id + "|y" + year,
      tone: "growth",
      caller: "CEO",
      face: "operator",
      headline: "GROWTH BREAKPOINT",
      context: [
        pos.name + " ha un cliente strategico in due diligence.",
        "Serve decidere se finanziare delivery e supporto ora.",
        "Upside nascosto: " + (st.hiddenUpside || "round interno piu' credibile") + "."
      ],
      choices: [
        choice("Fund the pilot", "Paghi delivery e trasformi il logo in prova di mercato.",
          { cash: -baseCost(pos, 0.18), multiplierPct: 0.20, reputation: 2, impact: 3 }),
        choice("Paid pilot only", "Niente soldi gratis: il cliente deve validare con budget.",
          { cash: 0, multiplierPct: 0.07, reputation: 1, impact: 1 }),
        choice("Stay passive", "Non rischi altro capitale, ma perdi momentum.",
          { cash: 0, multiplierPct: -0.12, reputation: -1, impact: -1 })
      ]
    });
  }

  function activeIncident(state) {
    if (!state.portfolioIncidentCache) state.portfolioIncidentCache = {};
    const key = keyFor(state);
    const cached = state.portfolioIncidentCache[key];
    if (cached) return cached.status === "pending" ? cached : null;
    if (!canTrigger(state)) return null;
    const pos = pickPosition(state);
    if (!pos) return null;
    const incident = buildIncident(state, pos);
    state.portfolioIncidentCache[key] = incident;
    TVState.save();
    return incident;
  }

  function applyChoice(state, incident, choice) {
    const pos = (state.portfolio || []).find(p => p.id === incident.startupId);
    if (!pos || !choice) return null;
    const e = choice.effects || {};
    const metrics = [];
    const notes = [];

    function pushMetric(label, before, after, delta) {
      metrics.push({ label: label, before: before, after: after, delta: delta });
    }

    if (e.cash) {
      const before = state.cash || 0;
      state.cash = Math.max(0, before + e.cash);
      pushMetric("Cash", moneyLabel(before),
        moneyLabel(state.cash), moneyLabel(e.cash));
      if (e.cash < 0) {
        const spent = Math.min(before, -e.cash);
        state.invested = (state.invested || 0) + spent;
        pos.investedAmount = (pos.investedAmount || 0) + spent;
        pushMetric("Capitale supporto", "0",
          moneyLabel(spent), "+" + moneyLabel(spent));
      }
    }

    if (e.multiplierPct) {
      const before = pos.currentValueMultiplier || 1;
      pos.currentValueMultiplier = Math.max(0.03, before * (1 + e.multiplierPct));
      pushMetric("Multiplo " + pos.name, before.toFixed(2) + "x",
        pos.currentValueMultiplier.toFixed(2) + "x",
        (e.multiplierPct > 0 ? "+" : "") + Math.round(e.multiplierPct * 100) + "%");
    }

    if (e.reputation) {
      const before = state.reputation || 0;
      state.reputation = clamp(before + e.reputation, 0, 100);
      pushMetric("Reputation", before, state.reputation, e.reputation);
    }

    if (e.impact) {
      const before = state.innovationImpact || 0;
      state.innovationImpact = clamp(before + e.impact, 0, 100);
      pushMetric("Impact", before, state.innovationImpact, e.impact);
    }

    if (e.lp) {
      Object.keys(state.lpSat || {}).forEach(k => {
        state.lpSat[k] = clamp((state.lpSat[k] || 50) + e.lp, 0, 100);
      });
      notes.push({ text: "Gli LP leggono la crisi: satisfaction " + (e.lp > 0 ? "+" : "") + e.lp + " su tutti." });
    }

    incident.status = "resolved";
    incident.choice = choice.label;
    incident.resolvedYear = state.year;
    if (!state.usedPortfolioIncidents) state.usedPortfolioIncidents = [];
    if (!state.usedPortfolioIncidents.includes(incident.id)) {
      state.usedPortfolioIncidents.push(incident.id);
    }
    if (!state.history) state.history = [];
    state.history.push({
      year: state.year,
      type: "portfolio_call",
      startup: pos.name,
      incident: incident.headline,
      choice: choice.label
    });
    TVState.save();

    const tone = metrics.some(m => String(m.delta).charAt(0) === "-")
      ? (metrics.some(m => String(m.delta).charAt(0) !== "-") ? "mixed" : "negative")
      : "positive";
    return { tone: tone, metrics: metrics, notes: notes, incident: incident, choice: choice };
  }

  global.TVPortfolioIncidents = {
    activeIncident,
    applyChoice,
    buildIncident
  };
})(typeof window !== "undefined" ? window : global);
