/* Post-battle events: piccoli colpi di scena subito dopo una battle.
   Sono selettivi e deterministici: danno vita ai deal senza allungare
   ogni singolo round. */
(function (global) {

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function rootSector(st) {
    return String((st && st.sectorTag) || "").split("_")[0];
  }

  function activePositions(state, excludeId) {
    return (state.portfolio || []).filter(p =>
      (!p.status || p.status === "active") &&
      p.id !== excludeId &&
      p.investedAmount > 0
    );
  }

  function pickPortfolioPosition(state, startup) {
    const positions = activePositions(state, startup && startup.id);
    if (!positions.length) return null;
    return positions.slice().sort((a, b) => {
      const ar = TVState.roll("post-portfolio|" + a.id + "|" + ((state && state.year) || 1));
      const br = TVState.roll("post-portfolio|" + b.id + "|" + ((state && state.year) || 1));
      return br - ar;
    })[0];
  }

  function choice(label, detail, effects) {
    return { label: label, detail: detail, effects: effects || {} };
  }

  function shouldTrigger(state, startup, decision) {
    return !!(state && startup && decision);
  }

  function withAuto(event, choiceIndex) {
    event.autoChoiceIndex = Math.max(0, Math.min(event.choices.length - 1, choiceIndex || 0));
    return event;
  }

  function eventFor(state, startup, ctx) {
    ctx = ctx || {};
    const decision = ctx.decision || "passed";
    if (!state || !startup || !shouldTrigger(state, startup, decision)) return null;
    const portco = decision !== "invested" ? pickPortfolioPosition(state, startup) : null;
    if (portco) {
      const prepared = !!(ctx.intel && ctx.intel.level >= 2);
      return withAuto({
        id: "pb|portco|" + portco.id + "|y" + ((state && state.year) || 1) + "|" + startup.id,
        startupId: portco.id,
        startupName: portco.name,
        decision: decision,
        tone: "portfolio",
        headline: "PORTFOLIO PING",
        context: [
          "Mentre esci dalla battle, arriva un update da " + portco.name + ".",
          "Non e' ancora una rivalutazione: e' un segnale operativo da portare al prossimo portfolio update.",
          "Il fondo continua a muoversi anche quando passi un deal."
        ],
        choices: [
          choice("Signal captured", "Il team aggiorna KPI e board memo prima del prossimo mark.",
            { multiplierPct: 0.05, reputation: 1 }),
          choice("Watchlist opened", "Serve follow-up: niente panico, ma il memo resta giallo.",
            { multiplierPct: -0.03 }),
          choice("Ignored update", "Il segnale si perde nella inbox del fondo.",
            { multiplierPct: -0.08, reputation: -1 })
        ]
      }, prepared ? 0 : 1);
    }

    const base = {
      id: "pb|" + startup.id + "|y" + ((state && state.year) || 1) + "|" + decision,
      startupId: startup.id,
      startupName: startup.name,
      decision: decision
    };

    if (decision === "invested" &&
        (startup.founderProfile === "ego" || startup.founderProfile === "red_flag")) {
      return withAuto(Object.assign(base, {
        tone: "founder",
        headline: "FOUNDER DRAMA",
        context: [
          startup.name + " firma, poi il board observer ti chiama.",
          "Il founder vuole cambiare piano assunzioni prima del primo wire.",
          "La qualita' del tuo intervento pesera' sul markup."
        ],
        choices: [
          choice("Operating partner", "Metti supporto adulto nel weekly.",
            { cash: -120_000, multiplierPct: 0.08, reputation: 1 }),
          choice("Governance clause", "Blocchi assunzioni senior senza board approval.",
            { multiplierPct: 0.02, reputation: 2, impact: -1 }),
          choice("Trust the founder", "Lasci correre: velocita' sopra controllo.",
            { multiplierPct: -0.12, reputation: -2, lp: -1 })
        ]
      }), (ctx.rv && (ctx.rv.dd || ctx.rv.refCall)) ? 0 : 2);
    }

    if (decision === "invested" && (startup.unitEconomics || 0) < -0.2) {
      return withAuto(Object.assign(base, {
        tone: "customer",
        headline: "CUSTOMER PANIC",
        context: [
          "Un cliente pilota minaccia churn a 48 ore dal closing.",
          "Il deck dice traction, la telefonata dice supporto fragile.",
          "Puoi salvare logo e narrativa, ma costa attenzione."
        ],
        choices: [
          choice("Customer SWAT", "Paghi un intervento rapido e salvi il logo.",
            { cash: -90_000, multiplierPct: 0.06, reputation: 1 }),
          choice("Force paid scope", "Il cliente resta solo se paga davvero.",
            { multiplierPct: 0.02, impact: 1 }),
          choice("Ignore churn", "Se ne occupera' il founder. Forse.",
            { multiplierPct: -0.10, reputation: -1 })
        ]
      }), (ctx.rv && ctx.rv.dd) ? 1 : ((state.cash || 0) > 1_000_000 ? 0 : 2));
    }

    if (decision === "invested") {
      const goodPrep = !!(ctx.rv && (ctx.rv.dd || ctx.rv.refCall || ctx.rv.coInvest));
      return withAuto(Object.assign(base, {
        tone: "board",
        headline: "FIRST 72H",
        context: [
          "A term sheet firmato arrivano i primi update veri.",
          "Una metrica fuori deck decide se il deal parte pulito o nervoso.",
          "Qui si vede se hai investito con tesi o con FOMO."
        ],
        choices: [
          choice("Clean onboarding", "La tesi regge e il founder manda dati coerenti.",
            { multiplierPct: 0.04, reputation: 1 }),
          choice("Messy onboarding", "Cap table e KPI non sono rotti, ma chiedono follow-up.",
            { multiplierPct: -0.03 }),
          choice("Silent onboarding", "Dopo la firma cala il silenzio operativo.",
            { multiplierPct: -0.08, reputation: -1 })
        ]
      }), goodPrep ? 0 : 1);
    }

    if (decision === "passed") {
      return withAuto(Object.assign(base, {
        tone: "source",
        headline: "LATE SOURCE",
        context: [
          "Dopo il pass, una fonte richiama sul deal.",
          "Non cambia la decisione, ma puo' cambiare reputazione e memoria.",
          "Root sector: " + rootSector(startup) + "."
        ],
        choices: [
          choice("Archive lesson", "Annoti il pattern per il post-mortem.",
            { reputation: 1 }),
          choice("Send to friendly fund", "Aiuti un co-investitore e compri goodwill.",
            { reputation: 2, lp: -1 }),
          choice("Delete thread", "Passi oltre senza imparare nulla.",
            { reputation: -1 })
        ]
      }), (ctx.intel && ctx.intel.level >= 2) ? 0 : 2);
    }

    return withAuto(Object.assign(base, {
      tone: "allocation",
      headline: "ALLOCATION CUT",
      context: [
        "Sei fuori dalla sala, ma il founder lascia una finestra laterale.",
        "Entrare ora significa condizioni peggiori e reputazione a rischio.",
        "A volte il miglior deal e' quello che non insegui."
      ],
      choices: [
        choice("Chase allocation", "Ti rimetti in fila con condizioni peggiori.",
          { reputation: -2, lp: -1 }),
        choice("Ask for data room", "Non entri, ma salvi una lezione.",
          { reputation: 1 }),
        choice("Walk away clean", "Nessun effetto. Nessun rimpianto scritto.",
          {})
      ]
    }), (ctx.intel && ctx.intel.level >= 1) ? 1 : 2);
  }

  function queueCatalyst(state, event, choice, multiplierPct) {
    if (!multiplierPct) return null;
    const pos = (state.portfolio || []).find(p => p.id === event.startupId &&
      (!p.status || p.status === "active"));
    if (!pos) return null;
    if (!state.portfolioCatalysts) state.portfolioCatalysts = [];
    const catalyst = {
      id: event.id + "|" + choice.label,
      year: state.year,
      materializeYear: state.year,
      startupId: event.startupId,
      startupName: event.startupName,
      headline: event.headline,
      label: choice.label,
      detail: choice.detail,
      multiplierPct: multiplierPct,
      applied: false
    };
    if (!state.portfolioCatalysts.some(c => c.id === catalyst.id)) {
      state.portfolioCatalysts.push(catalyst);
    }
    return catalyst;
  }

  function applyChoice(state, event, choice) {
    if (!event || !choice) return { metrics: [], notes: [] };
    const e = choice.effects || {};
    const metrics = [];
    const notes = [];

    function metric(label, before, after, delta) {
      metrics.push({ label: label, before: before, after: after, delta: delta });
    }

    if (e.cash) {
      const before = state.cash || 0;
      state.cash = Math.max(0, before + e.cash);
      state.researchSpent = (state.researchSpent || 0) + Math.max(0, -e.cash);
      metric("Cash", Math.round(before / 1000000) + "M",
        Math.round(state.cash / 1000000) + "M", Math.round(e.cash / 1000) + "k");
    }
    if (e.multiplierPct) {
      const catalyst = queueCatalyst(state, event, choice, e.multiplierPct);
      if (catalyst) {
        const sign = e.multiplierPct > 0 ? "+" : "";
        metric("Portfolio catalyst", "memo", "prossimo update",
          sign + Math.round(e.multiplierPct * 100) + "%");
        notes.push({ text: "Il multiplo non cambia ora: il catalyst verra' applicato al prossimo portfolio update." });
      }
    }
    if (e.reputation) {
      const before = state.reputation || 0;
      state.reputation = clamp(before + e.reputation, 0, 100);
      metric("Reputation", before, state.reputation, e.reputation);
    }
    if (e.impact) {
      const before = state.innovationImpact || 0;
      state.innovationImpact = clamp(before + e.impact, 0, 100);
      metric("Impact", before, state.innovationImpact, e.impact);
    }
    if (e.lp) {
      Object.keys(state.lpSat || {}).forEach(k => {
        state.lpSat[k] = clamp((state.lpSat[k] || 50) + e.lp, 0, 100);
      });
      notes.push({ text: "LP satisfaction " + (e.lp > 0 ? "+" : "") + e.lp + " su tutti." });
    }

    if (!state.history) state.history = [];
    state.history.push({
      year: state.year,
      type: "post_battle_event",
      startup: event.startupName,
      event: event.headline,
      choice: choice.label
    });
    TVState.save();
    return { metrics: metrics, notes: notes };
  }

  function applyAuto(state, event) {
    if (!event || !event.choices || !event.choices.length) {
      return { choice: null, report: { metrics: [], notes: [] } };
    }
    const choice = event.choices[event.autoChoiceIndex || 0] || event.choices[0];
    return { choice: choice, report: applyChoice(state, event, choice) };
  }

  /* L'evento post-battle si risolve subito con la scelta automatica
     (guidata dalla preparazione: DD/ref call/taccuino scelgono meglio).
     Gli effetti su cash/reputation/LP sono applicati DAVVERO; il
     multiplo resta un catalyst per il prossimo portfolio update. */
  function recordAfterBattle(state, startup, ctx) {
    const event = eventFor(state, startup, ctx);
    if (!event || !event.choices || !event.choices.length) return null;
    const applied = applyAuto(state, event);
    return { event: event, choice: applied.choice, report: applied.report };
  }

  global.TVPostBattleEvents = {
    eventFor,
    applyChoice,
    applyAuto,
    recordAfterBattle
  };
})(typeof window !== "undefined" ? window : global);
