/* Engine dealflow: pesca le startup per l'anno corrente, coerenti
   con le news pubblicate (Markstrat-style: chi legge nota i pattern).

   Algoritmo:
   1. Filtra startup non ancora viste.
   2. Bias verso settori che hanno news (positive o negative).
   3. Mix di "buona" (sectorTag in trend +), "trappola" (in trend -),
      e "neutra" per ogni anno.
   4. Seeded random per anno → partita riproducibile da save.
*/
(function (global) {
  const QUICK_DEALS_PER_YEAR = 3;
  const PARTNER_DEALS_PER_YEAR = 5;

  function dealsPerYear(state) {
    if (state && typeof state.dealsPerYear === "number") {
      return Math.max(3, Math.min(PARTNER_DEALS_PER_YEAR, state.dealsPerYear));
    }
    return (state && state.runMode === "partner")
      ? PARTNER_DEALS_PER_YEAR
      : QUICK_DEALS_PER_YEAR;
  }

  function seedFor(state) {
    // gameSeed varia tra partite, year varia dentro la partita:
    // stessa partita → stesso dealflow (save-compatibile),
    // nuova partita → percorso diverso.
    return ((state.gameSeed || 0) + state.year * 9301 + 49297) % 233280;
  }
  function rng(seed) {
    let s = seed;
    return function() {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }
  function shuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sectorMomentum(news, year) {
    // somma delta news del settore già pubblicate fino all'anno corrente
    const map = {};
    news.filter(n => n.year === year && n.signal).forEach(n => {
      const k = n.signal.sector;
      map[k] = (map[k] || 0) + n.signal.delta;
    });
    return map;
  }

  const YEAR_THEMES = {
    1: {
      title: "SEED CHAOS",
      memo: "ticket piccoli, tante promesse, impari a leggere il mercato",
      focus: "Pre-seed / Seed"
    },
    2: {
      title: "PROOF HUNT",
      memo: "i primi segnali delle news diventano round piu' leggibili",
      focus: "Seed con trazione"
    },
    3: {
      title: "UNICORN WEATHER",
      memo: "late stage, secondarie, follow-up pesanti e DPI da spiegare agli LP",
      focus: "Series A / unicorn / exit narrative"
    }
  };

  function yearTheme(year) {
    const y = Math.max(1, Math.min(3, year || 1));
    return YEAR_THEMES[y] || YEAR_THEMES[1];
  }

  function stageScore(startup, year) {
    const stage = String(startup.stage || "").toLowerCase();
    const val = startup.valuation || 0;
    const hype = startup.hype || 0;
    const traction = startup.traction || 0;
    const unit = startup.unitEconomics || 0;
    let score = 0;

    if (year <= 1) {
      if (stage.includes("pre-seed")) score += 6;
      if (stage === "seed") score += 4;
      if (stage.includes("seed ext")) score -= 2;
      if (stage.includes("series")) score -= 5;
      if (val <= 15_000_000) score += 2;
      if (val > 50_000_000) score -= 4;
    } else if (year === 2) {
      if (stage === "seed") score += 5;
      if (stage.includes("pre-seed")) score += 2;
      if (stage.includes("seed ext")) score += 2;
      if (stage.includes("series")) score -= 1;
      if (val >= 8_000_000 && val <= 35_000_000) score += 2;
      if (traction >= 4) score += 1;
    } else {
      if (stage.includes("seed ext")) score += 6;
      if (stage.includes("series")) score += 7;
      if (stage === "seed") score += 2;
      if (val >= 18_000_000 && val <= 90_000_000) score += 2;
      if (val >= 50_000_000) score += 2;
      if (traction >= 6) score += 2;
      if (traction >= 5) score += 1;
      if (unit > 0) score += 1;
      if (hype >= 8) score += 2;
    }

    return score;
  }

  function stageBand(startup) {
    const stage = String(startup.stage || "").toLowerCase();
    const val = startup.valuation || 0;
    const traction = startup.traction || 0;
    if (val >= 500_000_000 || stage.includes("growth") || stage.includes("unicorn")) {
      return "UNICORN";
    }
    if (stage.includes("series") || val >= 50_000_000) return "LATE";
    if (stage.includes("seed ext") || traction >= 4 || val >= 18_000_000) return "MID";
    return "EARLY";
  }

  function targetBands(state, count) {
    const year = state.year || 1;
    const partner = state.runMode === "partner";
    if (year <= 1) {
      return (partner
        ? ["EARLY", "EARLY", "MID", "EARLY", "MID"]
        : ["EARLY", "EARLY", "MID"]).slice(0, count);
    }
    if (year === 2) {
      return (partner
        ? ["EARLY", "MID", "MID", "LATE", "LATE"]
        : ["EARLY", "MID", "LATE"]).slice(0, count);
    }
    return (partner
      ? ["MID", "LATE", "UNICORN", "LATE", "EARLY"]
      : ["MID", "LATE", "UNICORN"]).slice(0, count);
  }

  function liquidityEvent(startup, state) {
    const exits = global.TVExits && TVExits.EXIT_EVENTS;
    if (!exits) return null;
    const maxYear = (state && state.maxYear) || 3;
    return exits.find(e =>
      e.startupId === startup.id &&
      e.year >= ((state && state.year) || 1) &&
      e.year <= maxYear
    ) || null;
  }

  function heavyValuation(startup) {
    return (startup && startup.valuation || 0) >= 80_000_000 ||
      stageBand(startup) === "UNICORN";
  }

  function rankedForYear(bucket, year, rand, momentum, state) {
    return bucket.map(s => ({
      startup: s,
      score: stageScore(s, year) +
        (Math.abs(momentum[((s.sectorTag || "").split("_")[0])] || 0) / 4) +
        (liquidityEvent(s, state) && year >= 2 ? 4 : 0) +
        (stageBand(s) === "UNICORN" && year >= 3 ? 4 : 0) +
        rand() * 6
    })).sort((a, b) => b.score - a.score).map(item => item.startup);
  }

  function pickDeals(state) {
    const seen = new Set(state.seenStartups || []);
    const portfolioIds = new Set((state.portfolio || []).map(p => p.id));
    const pool = TVStartups.all().filter(s => !seen.has(s.id) && !portfolioIds.has(s.id));
    if (pool.length === 0) return [];

    const news = TVNews.NEWS;
    const momentum = sectorMomentum(news, state.year);

    // classifica le startup in: HOT (momentum > +5), TRAP (< -5), NEUTRAL
    function classify(s) {
      const rootSector = (s.sectorTag || "").split("_")[0];
      const mom = momentum[rootSector] || 0;
      if (mom > 5)  return "HOT";
      if (mom < -5) return "TRAP";
      return "NEUTRAL";
    }

    const buckets = { HOT: [], TRAP: [], NEUTRAL: [] };
    const bands = { EARLY: [], MID: [], LATE: [], UNICORN: [] };
    pool.forEach(s => {
      buckets[classify(s)].push(s);
      bands[stageBand(s)].push(s);
    });

    const rand = rng(seedFor(state) + state.year);
    const picks = [];
    const selected = new Set();

    function addPick(startup) {
      if (!startup || selected.has(startup.id)) return false;
      selected.add(startup.id);
      picks.push(startup);
      return true;
    }

    const count = dealsPerYear(state);
    targetBands(state, count).forEach(band => {
      const candidates = bands[band].filter(s => !selected.has(s.id));
      const ranked = rankedForYear(candidates, state.year, rand, momentum, state);
      addPick(ranked[0]);
    });

    // Dall'anno 2 mettiamo sul tavolo almeno una societa' con possibile
    // evento di liquidita' entro l'orizzonte della run, se il pool lo offre.
    if (state.year >= 2 && !picks.some(s => liquidityEvent(s, state))) {
      const liquid = rankedForYear(pool.filter(s =>
        !selected.has(s.id) && liquidityEvent(s, state)
      ), state.year, rand, momentum, state)[0];
      if (liquid) {
        if (picks.length >= count) {
          selected.delete(picks[picks.length - 1].id);
          picks[picks.length - 1] = liquid;
          selected.add(liquid.id);
        } else {
          addPick(liquid);
        }
      }
    }

    // Dall'anno 2 deve arrivare almeno un deal a prezzo pesante: e' il
    // momento in cui il giocatore smette di comprare solo seed option.
    if (state.year >= 2 && !picks.some(heavyValuation)) {
      const heavy = rankedForYear(pool.filter(s =>
        !selected.has(s.id) && heavyValuation(s)
      ), state.year, rand, momentum, state)[0];
      if (heavy) {
        if (picks.length >= count) {
          selected.delete(picks[picks.length - 1].id);
          picks[picks.length - 1] = heavy;
          selected.add(heavy.id);
        } else {
          addPick(heavy);
        }
      }
    }

    // se mancano slot, riempi con pool generale
    const rest = rankedForYear(pool.filter(s => !selected.has(s.id)),
      state.year, rand, momentum, state);
    while (picks.length < count && rest.length > 0) addPick(rest.shift());

    return picks;
  }

  function currentYearDealflow(state) {
    // memoizza nello state per coerenza durante l'anno
    if (!state.dealflowCache) state.dealflowCache = {};
    const key = "y" + state.year;
    if (!state.dealflowCache[key]) {
      const picks = pickDeals(state);
      state.dealflowCache[key] = picks.map(s => s.id);
      // marca come viste
      picks.forEach(s => {
        if (!state.seenStartups.includes(s.id)) state.seenStartups.push(s.id);
      });
      TVState.save();
    }
    return state.dealflowCache[key].map(id => TVStartups.byId(id)).filter(Boolean);
  }

  // ---- Stato delle decisioni annuali (pending / invested / passed) ----
  // Una startup deliberata non può essere rideliberata nello stesso anno
  // e il dealflow riflette sempre lo stato reale.
  function decisionsForYear(state) {
    if (!state.dealDecisions) state.dealDecisions = {};
    const key = "y" + state.year;
    if (!state.dealDecisions[key]) state.dealDecisions[key] = {};
    return state.dealDecisions[key];
  }

  function getDecision(state, startupId) {
    return decisionsForYear(state)[startupId] || "pending";
  }

  function setDecision(state, startupId, decision) {
    decisionsForYear(state)[startupId] = decision;
    TVState.save();
  }

  function pendingDeals(state) {
    return currentYearDealflow(state)
      .filter(s => getDecision(state, s.id) === "pending");
  }

  global.TVDealflow = {
    currentYearDealflow, decisionsForYear, getDecision, setDecision, pendingDeals,
    yearTheme, dealsPerYear, stageBand,
    DEALS_PER_YEAR: PARTNER_DEALS_PER_YEAR,
    QUICK_DEALS_PER_YEAR,
    PARTNER_DEALS_PER_YEAR
  };
})(window);
