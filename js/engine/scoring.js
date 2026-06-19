/* Engine scoring: rendimento, relazione LP, reputazione, impatto
   e disciplina nel deployment del capitale investibile. */
(function (global) {

  function computeMetrics(state) {
    // contano solo le posizioni ancora attive: le altre sono già
    // confluite in state.realized al momento dell'exit/write-off
    const portfolioValue = state.portfolio
      .filter(p => !p.status || p.status === "active")
      .reduce((sum, p) => sum + p.investedAmount * p.currentValueMultiplier, 0);
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
    const investable = state.investableCapital || 90_000_000;
    const deploymentRate = investable > 0 ? state.invested / investable : 0;
    const deploymentScore = Math.min(100, Math.max(0, deploymentRate / 0.80 * 100));

    const score = Math.round(
      0.35 * moicScore +
      0.15 * dpiScore +
      0.15 * lpScore +
      0.10 * repScore +
      0.10 * impScore +
      0.15 * deploymentScore
    );

    return {
      portfolioValue, moic, dpi,
      lpSat: lps, lpSatAvg,
      reputation: state.reputation,
      impact: state.innovationImpact,
      deploymentRate, deploymentScore,
      score
    };
  }

  global.TVScoring = { computeMetrics };
})(window);
