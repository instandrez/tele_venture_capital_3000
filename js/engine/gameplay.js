/* Regole di leggibilita' e decisione. Nessun DOM, nessuna previsione delle exit.
   Il dossier compra informazione; non compra un risultato di mercato. */
(function (global) {
  const RESEARCH_LIMIT = 2;
  const RESEARCH = {
    dd: { cost: 100_000, label: "DD" },
    refCall: { cost: 50_000, label: "REF CALL" },
    coInvest: { cost: 30_000, label: "CO-INVEST" }
  };

  function researchRemaining(rv) {
    return Math.max(0, RESEARCH_LIMIT - Object.keys(RESEARCH)
      .filter(key => rv && rv[key]).length);
  }

  function researchOffer(state, rv, kind, intel) {
    const item = RESEARCH[kind];
    const remaining = researchRemaining(rv);
    if (!item) return { allowed: false, remaining, reason: "Controllo non disponibile." };
    const cost = kind === "dd" && intel ? intel.ddCost : item.cost;
    const reason = rv && rv[kind] ? "Controllo gia' completato." :
      (!remaining ? "Agenda piena: due controlli per deal. Le news restano gratuite." :
      ((state.cash || 0) < cost ? "Cash insufficiente." : null));
    return { allowed: !reason && !state.gameOver, cost, remaining, reason };
  }

  function takeResearch(state, rv, kind, intel) {
    const offer = researchOffer(state, rv, kind, intel);
    if (!offer.allowed) return offer;
    state.cash -= offer.cost;
    state.researchSpent = (state.researchSpent || 0) + offer.cost;
    rv[kind] = true;
    return offer;
  }

  function allocation(state, startup, amount) {
    const invested = state.invested || 0;
    const sector = String(startup.sectorTag || "").split("_")[0];
    const sectorCost = (state.portfolio || []).filter(p =>
      (!p.status || p.status === "active") &&
      String(p.sectorTag || "").split("_")[0] === sector
    ).reduce((sum, p) => sum + p.investedAmount, 0);
    const capital = state.investableCapital || 90_000_000;
    return {
      cashAfter: state.cash - amount,
      fundShare: amount / capital,
      sectorShare: invested + amount > 0 ? (sectorCost + amount) / (invested + amount) : 0,
      concentrated: amount / capital > 0.25,
      thinReserve: state.year < state.maxYear && state.cash - amount < capital * 0.12
    };
  }

  function decisionRead(state, startup, rv, intel, decision, summary) {
    rv = rv || {};
    intel = intel || {};
    summary = summary || {};
    const evidence = intel.level >= 2 || rv.dd || rv.pitchWon;
    const negative = (intel.read || []).some(x => x.polarity === "negative");
    const positive = (intel.read || []).some(x => x.polarity === "positive");
    if (decision === "lost") return {
      tone: "c-red", stamp: "SALA PERSA, NON IL FONDO",
      line: "Il founder ha vinto la call. Non significa che abbia un business.",
      lesson: "Puoi fermarti e decidere prima di azzerare il controllo sala."
    };
    if (decision === "passed") return {
      tone: evidence ? "c-cyan" : "c-yellow", stamp: evidence ? "PASS CON TESI" : "PASS AL BUIO",
      line: evidence ? "Hai lasciato il tavolo con un motivo, non con un 'ci aggiorniamo'." :
        "Capitale salvo. Opportunita' persa? Non lo sappiamo ancora.",
      lesson: "Il verdetto lo da' il mercato, non questo memo."
    };
    const amount = summary.amount || 0;
    const paid = summary.valuation || startup.valuation;
    const oversized = amount > (state.investableCapital || 90_000_000) * 0.25;
    if (oversized) return {
      tone: "c-yellow", stamp: "CONVICTION O ALL-IN?",
      line: "Oltre un quarto del fondo in un solo nome. Il comitato deglutisce.",
      lesson: "Una bella tesi non diversifica il rischio."
    };
    if (paid > startup.valuation) return {
      tone: "c-yellow", stamp: "TASSA FOMO",
      line: "Allocation conquistata. Hai pagato piu' dell'ask: il rendimento parte in salita.",
      lesson: "Il logo sul cap table non rimborsa il sovrapprezzo."
    };
    if (negative && (!positive || (intel.momentum || 0) < 0)) return {
      tone: "c-yellow", stamp: "TESI CONTROVENTO",
      line: "Le prove includono segnali contrari. Lo sconto non li cancella.",
      lesson: "Hai comprato rischio consapevole, non certezza."
    };
    return {
      tone: evidence ? "c-cyan" : "c-yellow", stamp: evidence ? "TESI, NON PROFEZIA" : "DECK-DRIVEN INVESTING",
      line: evidence ? "Hai comprato con informazioni. Adesso il mondo puo' comunque contraddirti." :
        "Il deck era convincente. Anche quello del Titanic aveva una slide sul TAM.",
      lesson: "Vincere la battle migliora le condizioni. Non certifica il deal."
    };
  }

  function nextStep(state) {
    if (!state || !state.gameStarted) return { page: 101, label: "APRI IL FONDO" };
    if (state.lastYearOutcome && !state.lastYearOutcome.acknowledged)
      return { page: 460, label: "LEGGI IL PORTFOLIO UPDATE" };
    if (state.gameOver) return { page: 700, label: "LEGGI IL VERDETTO" };
    const unreadMemo = TVDealflow.currentYearDealflow(state).some(st => {
      const receipt = state.startupReveals && state.startupReveals[st.id] && state.startupReveals[st.id].decisionReceipt;
      return receipt && !receipt.acknowledged;
    });
    if (unreadMemo) return { page: 200, label: "LEGGI IL DEAL MEMO" };
    const pending = TVDealflow.pendingDeals(state);
    if (pending.length) return { page: 200, label: "PREPARA IL PROSSIMO DEAL" };
    if (global.TVPortfolioIncidents && TVPortfolioIncidents.activeIncident(state))
      return { page: 620, label: "RISPONDI ALLA PARTECIPATA" };
    if (global.TVLPCalls && TVLPCalls.pickCallsForYear(state).length)
      return { page: 600, label: "RISPONDI AGLI LP" };
    return { page: 450, label: "FOLLOW-ON E CHIUSURA ANNO" };
  }

  global.TVGameplay = { RESEARCH_LIMIT, researchRemaining, researchOffer,
    takeResearch, allocation, decisionRead, nextStep };
})(typeof window !== "undefined" ? window : global);
