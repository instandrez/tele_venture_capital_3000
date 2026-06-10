/* Engine scoring: calcola le metriche finali e lo score finale.
   Score pesato 40/20/20/10/10 come da brief originale. */
(function (global) {

  function computeMetrics(state) {
    const portfolioValue = state.portfolio.reduce(
      (sum, p) => sum + p.investedAmount * p.currentValueMultiplier, 0);
    const moic = state.invested > 0
      ? (portfolioValue + state.realized) / state.invested : 0;
    const dpi  = state.invested > 0
      ? state.realized / state.invested : 0;

    // LP Sat aggregate = media dei 4
    const lps = state.lpSat || { pensione: 50, family: 50, sovereign: 50, endowment: 50 };
    const lpSatAvg = (lps.pensione + lps.family + lps.sovereign + lps.endowment) / 4;

    // Scoring components 0-100
    const moicScore = Math.min(100, Math.max(0, moic * 30)); // 3.33x → 100
    const dpiScore  = Math.min(100, Math.max(0, dpi * 50));  // 2x → 100
    const lpScore   = Math.min(100, Math.max(0, lpSatAvg));
    const repScore  = Math.min(100, Math.max(0, state.reputation || 0));
    const impScore  = Math.min(100, Math.max(0, state.innovationImpact || 0));

    const score = Math.round(
      0.40 * moicScore +
      0.20 * dpiScore +
      0.20 * lpScore +
      0.10 * repScore +
      0.10 * impScore
    );

    return {
      portfolioValue, moic, dpi,
      lpSat: lps, lpSatAvg,
      reputation: state.reputation,
      impact: state.innovationImpact,
      score
    };
  }

  global.TVScoring = { computeMetrics };
})(window);
