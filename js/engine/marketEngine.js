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

  function sourceRealityEffect(startup, currentYear) {
    if (!global.TVIntel || !TVIntel.sourceForecast) return 0;
    const forecast = TVIntel.sourceForecast(startup);
    if (!forecast) return 0;
    if (forecast.materializeYear && forecast.materializeYear !== currentYear) {
      return 0;
    }
    return forecast.effectPct || 0;
  }

  function contactedForecast(state, pos, currentYear) {
    const record = state.investigationSources && state.investigationSources[pos.id];
    const forecast = record && record.contacted && record.forecast;
    if (!forecast) return null;
    if (forecast.materializeYear && forecast.materializeYear !== currentYear) return null;
    return forecast;
  }

  function enforceContactedForecast(effect, forecast) {
    if (!forecast) return effect;
    if (forecast.tone === "positive") return Math.max(effect, 0.06);
    if (forecast.tone === "negative") return Math.min(effect, -0.08);
    return effect;
  }

  function pendingCatalystsFor(state, pos, currentYear) {
    return (state.portfolioCatalysts || []).filter(c =>
      !c.applied &&
      c.startupId === pos.id &&
      (c.materializeYear || c.year || currentYear) <= currentYear
    );
  }

  // Applica gli effetti di un singolo anno a una posizione del portfolio
  function applyYearToPosition(state, pos, currentYear, allNews, startup) {
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

    const sourceReality = sourceRealityEffect(startup, currentYear);
    effect += sourceReality;

    const catalysts = pendingCatalystsFor(state, pos, currentYear);
    catalysts.forEach(c => {
      effect += c.multiplierPct || 0;
      c.applied = true;
      c.appliedYear = currentYear;
    });

    // rumore deterministico piccolo (non distrugge la modellazione)
    const noiseSeed = (pos.id.charCodeAt(0) + currentYear * 17) % 100 / 100;
    const noise = (noiseSeed - 0.5) * 0.06;
    effect += noise;

    const forecast = contactedForecast(state, pos, currentYear);
    const effectBeforeForecastRail = effect;
    effect = enforceContactedForecast(effect, forecast);

    const before = pos.currentValueMultiplier;
    pos.currentValueMultiplier = Math.max(0.05, before * (1 + effect));

    return {
      before: before,
      after: pos.currentValueMultiplier,
      effect: effect,
      matchedNews: matchedNews,
      baseline: baseline,
      sourceReality: sourceReality,
      noise: noise,
      forecastRail: effect - effectBeforeForecastRail,
      catalysts: catalysts
    };
  }

  function pctLabel(value) {
    const pct = Math.round((value || 0) * 100);
    return (pct > 0 ? "+" : "") + pct + "%";
  }

  function operatingTriggers(state, pos, startup, result) {
    const triggers = [];
    const sourceRecord = state.investigationSources && state.investigationSources[pos.id];
    if (Math.abs(result.sourceReality || 0) >= 0.01) {
      if (sourceRecord && sourceRecord.contacted && sourceRecord.forecast) {
        triggers.push("FONTE: " + sourceRecord.forecast.message);
      } else {
        triggers.push("OPERATING: fondamentali nascosti " + pctLabel(result.sourceReality));
      }
    }
    if (Math.abs(result.baseline || 0) >= 0.015) {
      triggers.push("FONDAMENTALI: team/traction/unit economics " + pctLabel(result.baseline));
    }
    if (Math.abs(result.forecastRail || 0) >= 0.01) {
      triggers.push("FONTE: mark riallineato alla soffiata " + pctLabel(result.forecastRail));
    }
    return triggers;
  }

  function runYearEnd(state) {
    const allNews = TVNews.NEWS;
    const events = [];
    // 1) rivalutazione annuale delle posizioni attive
    state.portfolio.forEach(pos => {
      if (pos.status && pos.status !== "active") return;
      const startup = TVStartups.byId(pos.id);
      if (!startup) return;
      const result = applyYearToPosition(state, pos, state.year, allNews, startup);
      const operating = operatingTriggers(state, pos, startup, result);
      events.push({
        startup: pos.name,
        before: result.before,
        after: result.after,
        pct: result.effect,
        triggers: result.matchedNews.map(m => m.news.headline).concat(
          operating,
          (result.catalysts || []).map(c => "CATALYST: " + c.headline + " / " + c.label)
        ),
        intel: result.matchedNews.map(m => ({
          page: m.news.page,
          headline: m.news.headline,
          read: (state.readPages || []).includes(m.news.page)
        }))
      });
    });

    // 2) eventi di liquidità scriptati (exit, IPO, acqui-hire, write-off)
    const exits = [];
    state.portfolio.forEach(pos => {
      if (pos.status && pos.status !== "active") return;
      const ev = (typeof TVExits !== "undefined") ? TVExits.forYear(pos.id, state.year) : null;
      if (!ev) return;

      if (ev.kind === "writedown") {
        const before = pos.currentValueMultiplier;
        pos.currentValueMultiplier = Math.max(0.01, before * ev.factor);
        exits.push({ startup: pos.name, kind: "writedown", note: ev.note,
                     proceeds: 0, before: before, after: pos.currentValueMultiplier });
        return;
      }

      const proceeds = Math.round(pos.investedAmount * pos.currentValueMultiplier * ev.premium);
      state.realized += proceeds;
      pos.realizedAmount = proceeds;
      pos.status = (ev.kind === "writeoff") ? "writeoff" : "exited";
      pos.exitYear = state.year;
      pos.exitKind = ev.kind;
      exits.push({ startup: pos.name, kind: ev.kind, note: ev.note,
                   proceeds: proceeds, invested: pos.investedAmount });

      // gli LP reagiscono: exit vere piacciono a tutti, i write-off no
      const dir = (ev.kind === "exit" || ev.kind === "ipo") ? +3 :
                  (ev.kind === "acquihire") ? 0 : -2;
      Object.keys(state.lpSat || {}).forEach(k => {
        state.lpSat[k] = Math.max(0, Math.min(100, state.lpSat[k] + dir));
      });

      state.history.push({
        year: state.year, type: ev.kind, startup: pos.name,
        proceeds: proceeds, invested: pos.investedAmount
      });
    });

    return { events: events, exits: exits };
  }

  // Indice settore "live": base + signal accumulati dello stesso anno
  function liveSectorIndex(sectorKey, year) {
    const idx = TVSectors.SECTOR_INDICES[sectorKey];
    if (!idx) return 0;
    const yearIdx = Math.min(year, 3) - 1;
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
