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
   - hypeDecay: promesse senza traction si sgonfiano gia' al primo mark
   - unitEconomics: contribuisce a baseline (-30% .. +30% per anno)
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
          return delta * 2 / 100;
        }
        return 0;
    }
    return 0;
  }

  function baselineModulation(startup, yearsHeld) {
    let mod = 0;
    // unit economics: cumula nel tempo
    mod += startup.unitEconomics * 0.30;
    // founder profile
    if (startup.founderProfile === "red_flag")  mod -= 0.08;
    if (startup.founderProfile === "ego")       mod -= 0.03;
    if (startup.founderProfile === "competent") mod += 0.05;
    if (startup.founderProfile === "grit")      mod += 0.07;
    if (startup.founderProfile === "hustle")    mod += 0.02;
    // L'hype non e' automaticamente una condanna: la traction lo sostiene.
    // Aspettare due anni rendeva immuni tutti i deal dell'ultimo anno.
    if (startup.hype >= 8) {
      const unproven = 1 - Math.min(10, startup.traction || 0) / 10;
      mod -= startup.hypeDecay * ((startup.hype - 7) / 3) * unproven *
        (0.25 + Math.min(2, yearsHeld) * 0.10);
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

  function pendingCatalystsFor(state, pos, currentYear) {
    return (state.portfolioCatalysts || []).filter(c =>
      !c.applied &&
      c.startupId === pos.id &&
      (c.materializeYear || c.year || currentYear) <= currentYear
    );
  }

  // Applica gli effetti di un singolo anno a una posizione del portfolio
  function applyYearToPosition(state, pos, currentYear, allNews, startup) {
    let contextEffect = 0;
    let companyEffect = 0;
    const newsToApply = allNews.filter(n =>
      n.signal && n.year <= currentYear && n.signal.materializeYear === currentYear
    );
    const matchedNews = [];
    newsToApply.forEach(n => {
      const e = getSignalEffect(n.signal, startup);
      if (e !== 0) {
        if (n.signal.type === "founder_risk") companyEffect += e;
        else contextEffect += e;
        matchedNews.push({ news: n, effect: e });
      }
    });
    // Titoli sullo stesso ciclo non sono rendimenti indipendenti. Evita
    // che tre news sullo spazio regalino +80% a ogni startup del settore.
    const marketContext = Math.max(-0.45, Math.min(0.40, contextEffect));
    let effect = marketContext + companyEffect;
    const yearsHeld = Math.max(0, currentYear - pos.entryYear);
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

    // Esecuzione incerta, riproducibile: stesso seed, stessa impresa,
    // stesso anno. Leggere una pagina o ricaricare non cambia la realta'.
    const key = (state.gameSeed || 0) + "|execution|" + pos.id + "|" + currentYear;
    let hash = 2166136261;
    for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
    const noise = (((hash >>> 0) % 10000) / 10000 - 0.5) * 0.20;
    effect += noise;

    const before = pos.currentValueMultiplier;
    pos.currentValueMultiplier = Math.max(0.05, before * (1 + effect));

    return {
      before: before,
      after: pos.currentValueMultiplier,
      effect: effect,
      matchedNews: matchedNews,
      baseline: baseline,
      marketContext: marketContext,
      sourceReality: sourceReality,
      noise: noise,
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
    triggers.push("ESECUZIONE: " + pctLabel(result.noise));
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

      // Una secondaria appena prima dell'IPO non paga il premio pieno
      // di chi ha finanziato tre anni di rischio industriale.
      const holdingShare = Math.min(1, Math.max(1, state.year - pos.entryYear + 1) / 3);
      const premium = ev.premium > 1 ? 1 + (ev.premium - 1) * holdingShare : ev.premium;
      const proceeds = Math.round(pos.investedAmount * pos.currentValueMultiplier * premium);
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
