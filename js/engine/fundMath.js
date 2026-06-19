/* Matematica del fondo.
   100M di commitments non sono 100M di dry powder: 10M finanziano
   fee e struttura, 90M sono investibili tra initial e follow-on. */
(function (global) {
  const COMMITMENTS = 100_000_000;
  const MANAGEMENT_FEES = 10_000_000;
  const INVESTABLE = COMMITMENTS - MANAGEMENT_FEES;

  function ticketOptions(startup) {
    const stage = String((startup && startup.stage) || "").toLowerCase();
    if (stage.includes("pre-seed")) return [2_000_000, 4_000_000, 6_000_000];
    if (stage.includes("series a")) return [5_000_000, 8_000_000, 12_000_000];
    if (stage.includes("seed ext")) return [3_000_000, 6_000_000, 10_000_000];
    return [3_000_000, 6_000_000, 9_000_000];
  }

  function ownershipPct(amount, preMoneyValuation) {
    const postMoney = Math.max(1, preMoneyValuation || 0) + amount;
    return amount / postMoney;
  }

  function targetForYear(state) {
    const investable = state.investableCapital || INVESTABLE;
    const maxYear = state.maxYear || 5;
    return Math.round(investable * Math.min(maxYear, state.year || 1) / maxYear);
  }

  function deployment(state) {
    const investable = state.investableCapital || INVESTABLE;
    const invested = state.invested || 0;
    const target = targetForYear(state);
    return {
      investable,
      invested,
      target,
      gap: target - invested,
      rate: investable > 0 ? invested / investable : 0
    };
  }

  global.TVFundMath = {
    COMMITMENTS,
    MANAGEMENT_FEES,
    INVESTABLE,
    ticketOptions,
    ownershipPct,
    targetForYear,
    deployment
  };
})(typeof window !== "undefined" ? window : global);
