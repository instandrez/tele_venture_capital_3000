/* Engine dealflow: pesca 3 startup per l'anno corrente, coerenti
   con le news pubblicate (Markstrat-style: chi legge nota i pattern).

   Algoritmo:
   1. Filtra startup non ancora viste.
   2. Bias verso settori che hanno news (positive o negative).
   3. Mix di "buona" (sectorTag in trend +), "trappola" (in trend -),
      e "neutra" per ogni anno.
   4. Seeded random per anno → partita riproducibile da save.
*/
(function (global) {

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
    news.filter(n => n.year <= year && n.signal).forEach(n => {
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
      title: "SERIES A WINDOW",
      memo: "arrivano deal piu' costosi: meno errori, piu' ownership da difendere",
      focus: "Seed Ext. / Series A"
    },
    4: {
      title: "HOT ROUNDS",
      memo: "i winner corrono, le valuation salgono e gli LP guardano il DPI",
      focus: "Series A / hype"
    },
    5: {
      title: "FINAL SPRINT",
      memo: "late-stage, exit narrative e scelte da leaderboard",
      focus: "maturi / famosi / costosi"
    }
  };

  function yearTheme(year) {
    const y = Math.max(1, Math.min(5, year || 1));
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
    } else if (year === 3) {
      if (stage.includes("seed ext")) score += 6;
      if (stage.includes("series")) score += 4;
      if (stage === "seed") score += 2;
      if (val >= 18_000_000 && val <= 70_000_000) score += 2;
      if (traction >= 5) score += 1;
    } else if (year === 4) {
      if (stage.includes("series")) score += 6;
      if (stage.includes("seed ext")) score += 3;
      if (val >= 35_000_000) score += 2;
      if (hype >= 8) score += 2;
      if (val < 10_000_000) score -= 2;
    } else {
      if (stage.includes("series")) score += 6;
      if (stage.includes("seed ext")) score += 3;
      if (val >= 50_000_000) score += 3;
      if (traction >= 6) score += 2;
      if (unit > 0) score += 1;
      if (hype >= 8) score += 1;
    }

    return score;
  }

  function rankedForYear(bucket, year, rand) {
    return bucket.map(s => ({
      startup: s,
      score: stageScore(s, year) + rand() * 6
    })).sort((a, b) => b.score - a.score).map(item => item.startup);
  }

  function pickThree(state) {
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
    pool.forEach(s => buckets[classify(s)].push(s));

    const rand = rng(seedFor(state) + state.year);
    const picks = [];

    // 1 HOT + 1 TRAP + 1 NEUTRAL quando possibile
    function take(bucket) {
      if (bucket.length === 0) return null;
      const list = rankedForYear(bucket, state.year, rand);
      const s = list[0];
      const idx = bucket.indexOf(s);
      bucket.splice(idx, 1);
      return s;
    }

    const order = ["HOT", "TRAP", "NEUTRAL"];
    order.forEach(b => { const p = take(buckets[b]); if (p) picks.push(p); });

    // se mancano slot, riempi con pool generale
    const rest = rankedForYear([...buckets.HOT, ...buckets.TRAP, ...buckets.NEUTRAL], state.year, rand);
    while (picks.length < 3 && rest.length > 0) picks.push(rest.shift());

    return picks;
  }

  function currentYearDealflow(state) {
    // memoizza nello state per coerenza durante l'anno
    if (!state.dealflowCache) state.dealflowCache = {};
    const key = "y" + state.year;
    if (!state.dealflowCache[key]) {
      const picks = pickThree(state);
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
    yearTheme
  };
})(window);
