/* Matematica del fondo.
   100M di commitments non sono 100M di dry powder: 10M finanziano
   fee e struttura, 90M sono investibili tra initial e follow-on. */
(function (global) {
  const COMMITMENTS = 100_000_000;
  const MANAGEMENT_FEES = 10_000_000;
  const INVESTABLE = COMMITMENTS - MANAGEMENT_FEES;
  const MAX_OWNERSHIP = 0.50;
  const TICKET_STEP = 1_000_000;

  function ticketOptions(startup) {
    const stage = String((startup && startup.stage) || "").toLowerCase();
    if (stage.includes("pre-seed")) return [2_000_000, 4_000_000, 6_000_000];
    if (stage.includes("series a")) return [5_000_000, 8_000_000, 12_000_000];
    if (stage.includes("seed ext")) return [3_000_000, 6_000_000, 10_000_000];
    return [3_000_000, 6_000_000, 9_000_000];
  }

  function ownershipPct(amount, preMoneyValuation) {
    const postMoney = Math.max(1, preMoneyValuation || 0) + amount;
    return Math.min(MAX_OWNERSHIP, amount / postMoney);
  }

  // Il mark d'ingresso premia lo sconto strappato in trattativa: chi entra
  // sotto il prezzo pieno parte già sopra 1x (modello a multiplo). Il tetto
  // a 1.5x tiene la leva dentro un range sano (pressione + negoziazione
  // valgono al massimo ~1.39x).
  function entryMultiplier(fullValuation, paidValuation) {
    const full = Math.max(1, fullValuation || 0);
    const paid = Math.max(1, paidValuation || 0);
    return Math.max(1, Math.min(1.5, full / paid));
  }

  function maxTicketForOwnership(preMoneyValuation, cap) {
    cap = Math.max(0.01, Math.min(0.95, cap || MAX_OWNERSHIP));
    const pre = Math.max(1, preMoneyValuation || 0);
    return Math.floor(pre * cap / (1 - cap));
  }

  function capTicketAmount(amount, preMoneyValuation) {
    return Math.max(1, Math.min(amount, maxTicketForOwnership(preMoneyValuation, MAX_OWNERSHIP)));
  }

  function customTicketBounds(startup, preMoneyValuation, cash) {
    const stage = String((startup && startup.stage) || "").toLowerCase();
    const preferredMin = stage.includes("series") ? 2_000_000 : 1_000_000;
    const maxByOwnership = maxTicketForOwnership(preMoneyValuation, MAX_OWNERSHIP);
    const maxByCash = typeof cash === "number" ? Math.max(0, cash) : maxByOwnership;
    const max = Math.max(1, Math.min(maxByOwnership, maxByCash));
    const min = Math.max(1, Math.min(preferredMin, max));
    return { min, max, step: TICKET_STEP };
  }

  function roundTicketAmount(amount, step) {
    step = step || TICKET_STEP;
    return Math.max(1, Math.round((amount || 0) / step) * step);
  }

  function customTicketAmount(startup, preMoneyValuation, cash, amount) {
    const bounds = customTicketBounds(startup, preMoneyValuation, cash);
    const rounded = roundTicketAmount(amount, bounds.step);
    return Math.max(bounds.min, Math.min(bounds.max, rounded));
  }

  function termSheetOptions(startup, preMoneyValuation) {
    return ticketOptions(startup).map(amount => {
      const cappedAmount = capTicketAmount(amount, preMoneyValuation);
      return {
        amount: cappedAmount,
        requestedAmount: amount,
        capped: cappedAmount < amount,
        ownership: ownershipPct(cappedAmount, preMoneyValuation)
      };
    });
  }

  function targetForYear(state) {
    const investable = state.investableCapital || INVESTABLE;
    const maxYear = state.maxYear || 3;
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
    MAX_OWNERSHIP,
    TICKET_STEP,
    ticketOptions,
    termSheetOptions,
    capTicketAmount,
    maxTicketForOwnership,
    customTicketBounds,
    customTicketAmount,
    ownershipPct,
    entryMultiplier,
    targetForYear,
    deployment
  };
})(typeof window !== "undefined" ? window : global);
