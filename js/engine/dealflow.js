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
    // hash semplice da fundSize + year per riproducibilità
    return (state.year * 9301 + 49297) % 233280;
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
      const list = shuffle(bucket, rand);
      const s = list[0];
      const idx = bucket.indexOf(s);
      bucket.splice(idx, 1);
      return s;
    }

    const order = ["HOT", "TRAP", "NEUTRAL"];
    order.forEach(b => { const p = take(buckets[b]); if (p) picks.push(p); });

    // se mancano slot, riempi con pool generale
    const rest = shuffle([...buckets.HOT, ...buckets.TRAP, ...buckets.NEUTRAL], rand);
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

  global.TVDealflow = { currentYearDealflow };
})(window);
