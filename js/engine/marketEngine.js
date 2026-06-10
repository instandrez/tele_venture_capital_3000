/* MarketEngine — il cuore del Tele Venture Capital 3000.

   Filosofia (Markstrat):
   - Le news pubblicate emettono SIGNAL.
   - Il motore applica i signal alle startup in portfolio con LOGICA
     GRANULARE: signal.type, signal.scope, sectorTag completo della
     startup (es. AI_FOUNDATION vs AI_INFRA), founderProfile,
     corporateFitTag.
   - Più una startup matcha precisamente uno scope, più subisce
     l'effetto pieno; un match generico (solo root sector) attenua.

   TIPI DI SIGNAL:
   - "trend"          : effetto broad sul root sector (×1.0)
   - "macro"          : effetto broad sul root sector (×1.0)
   - "regulation"     : se scope match sectorTag specifico → ×1.0;
                        se non match e regulatoryExposure < 0 → ×0.5;
                        se regulatoryExposure > 0 → effetto inverso ×0.3
                        (benefici da regolazione)
   - "founder_risk"   : se scope === startup.id → ×3 sulla startup
                        specifica; altrimenti ignorato
   - "corporate_opp"  : se scope === startup.corporateFitTag → ×2
                        (boost localizzato); altrimenti ignorato

   ULTERIORI MODULAZIONI applicate ogni anno:
   - hypeDecay: se hype era ≥8 a entry, dopo 2 anni dall'entry decade
   - unitEconomics: contribuisce a baseline (-15% .. +15% per anno)
   - founderProfile.red_flag: -8% baseline persistente
   - founderProfile.competent: +5% baseline persistente
*/
(function (global) {

  function rootSector(sectorTag) {
    if (!sectorTag) return null;
    return sectorTag.split("_")[0];
  }

  function getSignalEffect(signal, startup) {
    if (!signal) return 0;
    const root = rootSector(startup.sectorTag);
    if (signal.sector !== root && signal.type !== "founder_risk" && signal.type !== "corporate_opp")
      return 0;

    const delta = signal.delta;

    switch (signal.type) {
      case "trend":
      case "macro":
        return delta / 100;

      case "regulation": {
        // scope può essere "foundation_model", "health_data", ecc.
        if (signal.scope && startup.sectorTag.toLowerCase().includes(signal.scope.split("_")[0])) {
          // match preciso → effetto pieno
          return delta / 100;
        }
        // non match: dipende dall'esposizione
        if (startup.regulatoryExposure < 0) return (delta / 100) * 0.5;
        if (startup.regulatoryExposure > 0) return -(delta / 100) * 0.3;
        return 0;
      }

      case "founder_risk":
        if (signal.scope === startup.id) return delta * 3 / 100;
        return 0;

      case "corporate_opp":
        if (signal.scope && startup.corporateFitTag === signal.scope) {
          return Math.abs(delta) * 2 / 100;
        }
        return 0;
    }
    return 0;
  }

  function baselineModulation(startup, yearsHeld) {
    let mod = 0;
    // unit economics: cumula nel tempo
    mod += startup.unitEconomics * 0.06;
    // founder profile
    if (startup.founderProfile === "red_flag")  mod -= 0.08;
    if (startup.founderProfile === "ego")       mod -= 0.03;
    if (startup.founderProfile === "competent") mod += 0.05;
    if (startup.founderProfile === "grit")      mod += 0.07;
    if (startup.founderProfile === "hustle")    mod += 0.02;
    // hype decay dopo 2 anni dall'entry
    if (yearsHeld >= 2 && startup.hype >= 8) {
      mod -= startup.hypeDecay * 0.15;
    }
    return mod;
  }

  // Applica gli effetti di un singolo anno a una posizione del portfolio
  function applyYearToPosition(pos, currentYear, allNews, startup) {
    let effect = 0;
    const newsToApply = allNews.filter(n =>
      n.signal && n.signal.materializeYear === currentYear
    );
    const matchedNews = [];
    newsToApply.forEach(n => {
      const e = getSignalEffect(n.signal, startup);
      if (e !== 0) {
        effect += e;
        matchedNews.push({ news: n, effect: e });
      }
    });
    const yearsHeld = currentYear - pos.entryYear;
    const baseline = baselineModulation(startup, yearsHeld);
    effect += baseline;

    // rumore deterministico piccolo (non distrugge la modellazione)
    const noiseSeed = (pos.id.charCodeAt(0) + currentYear * 17) % 100 / 100;
    const noise = (noiseSeed - 0.5) * 0.06;
    effect += noise;

    const before = pos.currentValueMultiplier;
    pos.currentValueMultiplier = Math.max(0.05, before * (1 + effect));

    return {
      before: before,
      after: pos.currentValueMultiplier,
      effect: effect,
      matchedNews: matchedNews,
      baseline: baseline
    };
  }

  function runYearEnd(state) {
    const allNews = TVNews.NEWS;
    const events = [];
    state.portfolio.forEach(pos => {
      const startup = TVStartups.byId(pos.id);
      if (!startup) return;
      const result = applyYearToPosition(pos, state.year, allNews, startup);
      events.push({
        startup: pos.name,
        before: result.before,
        after: result.after,
        pct: result.effect,
        triggers: result.matchedNews.map(m => m.news.headline)
      });
    });
    return events;
  }

  // Indice settore "live": base + signal accumulati dello stesso anno
  function liveSectorIndex(sectorKey, year) {
    const idx = TVSectors.SECTOR_INDICES[sectorKey];
    if (!idx) return 0;
    const yearIdx = Math.min(year, 5) - 1;
    let val = idx.base[yearIdx] || 0;
    TVNews.NEWS.forEach(n => {
      if (n.signal && n.signal.sector === sectorKey && n.signal.materializeYear === year) {
        val += n.signal.delta;
      }
    });
    return val;
  }

  global.TVMarket = {
    getSignalEffect,
    baselineModulation,
    runYearEnd,
    liveSectorIndex
  };
})(window);
