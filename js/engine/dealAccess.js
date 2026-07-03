/* Deal access: non tutti i founder firmano solo perche' mandi un term sheet.
   Il risultato dipende da heat del round e leverage costruito in battle. */
(function (global) {

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function heatFor(startup) {
    const stage = String((startup && startup.stage) || "").toLowerCase();
    let heat = 0;
    if (stage.includes("series")) heat += 2;
    if (stage.includes("seed ext")) heat += 1;
    if ((startup.hype || 0) >= 8) heat += 2;
    if ((startup.traction || 0) >= 6) heat += 2;
    if ((startup.valuation || 0) >= 50_000_000) heat += 1;
    if (startup.founderProfile === "ego") heat += 2;
    if (startup.founderProfile === "competent") heat += 1;
    if (startup.corporateFitTag) heat += 1;
    return clamp(heat, 0, 8);
  }

  function leverageFor(state, startup, ctx) {
    ctx = ctx || {};
    const rv = ctx.rv || {};
    const intel = ctx.intel || {};
    const battle = ctx.battle || {};
    let score = 0;
    if (rv.pitchWon) score += 3;
    if (rv.dd) score += 1;
    if (rv.refCall) score += 1;
    if (rv.coInvest) score += 2;
    if (rv.negotiatedValuation) score += 1;
    if (intel.level >= 2) score += 1;
    if (intel.level >= 3) score += 1;
    if (intel.chain && intel.chain.contacted) score += 2;
    if (battle.won) score += 1;
    if ((state.reputation || 0) >= 60) score += 1;
    if ((state.reputation || 0) >= 75) score += 1;
    return clamp(score, 0, 12);
  }

  function requiredLeverage(startup) {
    return clamp(3 + Math.floor(heatFor(startup) / 2), 3, 7);
  }

  function termSheetVerdict(state, startup, ctx) {
    ctx = ctx || {};
    const heat = heatFor(startup);
    const leverage = leverageFor(state, startup, ctx);
    const required = requiredLeverage(startup);
    const gap = required - leverage;
    if (gap <= 0) {
      return {
        accepted: true,
        heat,
        leverage,
        required,
        reason: "leverage sufficiente"
      };
    }

    const baseChance = 0.18 + leverage * 0.06 - heat * 0.035;
    const chance = clamp(baseChance, 0.05, 0.65);
    const roll = TVState.roll("termsheet|" + startup.id + "|" +
      ((state && state.year) || 1) + "|" + Math.round((ctx.valuation || 0) / 100000));
    const accepted = roll < chance;
    return {
      accepted,
      heat,
      leverage,
      required,
      chance,
      reason: accepted
        ? "il founder lascia uno spiraglio"
        : (heat >= 6 ? "round troppo competitivo" : "leverage insufficiente")
    };
  }

  global.TVDealAccess = {
    heatFor,
    leverageFor,
    requiredLeverage,
    termSheetVerdict
  };
})(typeof window !== "undefined" ? window : global);
