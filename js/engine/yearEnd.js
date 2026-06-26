/* Year-end engine: chiusura automatica dell'anno senza pagina IC.
   Mantiene icCache per compatibilita' con i save esistenti. */
(function (global) {

  function applyYearEnd(state) {
    if (!state.icCache) state.icCache = {};
    const key = "y" + state.year;
    if (state.icCache[key]) return state.icCache[key];

    const result = TVMarket.runYearEnd(state);
    const ignored = [];
    try {
      TVLPCalls.pickCallsForYear(state).forEach(call => {
        state.lpSat[call.lp] = Math.max(0, (state.lpSat[call.lp] || 50) - 6);
        state.usedLPCalls.push(call.id);
        state.history.push({ year: state.year, type: "lp_ignored", lp: call.lp, call: call.id });
        ignored.push(call.lp);
      });
    } catch (e) {}

    state.icCache[key] = {
      events: result.events,
      exits: result.exits,
      ignoredLPs: ignored
    };
    TVState.save();
    return state.icCache[key];
  }

  function closeCurrentYear(state) {
    const closingYear = state.year;
    const result = applyYearEnd(state);
    if (closingYear >= (state.maxYear || 5)) {
      state.gameOver = true;
      TVState.save();
      return { final: true, page: 700, closedYear: closingYear, result: result };
    }

    state.year = closingYear + 1;
    TVState.save();
    return {
      final: false,
      page: 100,
      closedYear: closingYear,
      nextYear: state.year,
      result: result
    };
  }

  function routeAfterClose(state) {
    const outcome = closeCurrentYear(state);
    if (global.TVRouter) {
      if (global.TVAudio && TVAudio.success) TVAudio.success();
      TVRouter.flash(outcome.final
        ? "FONDO CHIUSO - REPORT FINALE"
        : "ANNO " + outcome.closedYear + " CHIUSO - HOME");
      TVRouter.goto(outcome.page, { skipLoading: true });
    }
    return outcome;
  }

  global.TVYearEnd = { applyYearEnd, closeCurrentYear, routeAfterClose };
})(typeof window !== "undefined" ? window : global);
