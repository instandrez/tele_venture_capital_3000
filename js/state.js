/* gameState — singolo oggetto stato + save/load LocalStorage.
   Le metriche LP sono tracciate separatamente per i 4 archetipi. */
(function (global) {
  const SAVE_KEY = "tvc3000.save";

  function makeNewState() {
    return {
      version: 5,
      year: 1,
      maxYear: 3,
      gameSeed: Math.floor(Math.random() * 1e9),
      gameStarted: false,
      fundSize: 100_000_000,
      investableCapital: 90_000_000,
      managementFeeBudget: 10_000_000,
      cash: 90_000_000,
      invested: 0,
      realized: 0,
      reputation: 50,
      innovationImpact: 50,
      lpSat: {
        pensione: 50,
        family: 50,
        sovereign: 50,
        endowment: 50
      },
      researchSpent: 0,       // totale speso in DD / ref call / co-invest
      portfolio: [],
      portfolioCatalysts: [], // eventi post-battle che impattano ai portfolio update
      seenStartups: [],
      readPages: [],          // pagine news visitate → edge informativo su DD
      investigationSources: {}, // { startupId: { contacted, page, year } }
      dealDecisions: {},      // { yN: { startupId: "invested"|"passed" } }
      followOnCache: {},      // { yN: [offerte follow-on] }
      portfolioIncidentCache: {}, // { yN: chiamata portfolio company }
      usedPortfolioIncidents: [],
      lastYearOutcome: null,
      usedLPCalls: [],
      history: [],            // log decisioni/exit per il report finale
      tutorialFlags: {
        pitchBattle: false
      },
      currentPage: 100,
      previousPage: null,
      fundName: null,
      nickname: null,
      gameOver: false
    };
  }

  /* Porta i save di versioni precedenti al formato corrente. */
  function migrateState(s) {
    const previousVersion = Number(s.version) || 1;
    if (previousVersion < 3 && typeof s.cash === "number") {
      s.cash = Math.max(0, s.cash - 10_000_000);
    }
    if (!s.gameSeed) s.gameSeed = Math.floor(Math.random() * 1e9);
    if (!s.dealDecisions) s.dealDecisions = {};
    if (!s.followOnCache) s.followOnCache = {};
    if (!s.portfolioIncidentCache) s.portfolioIncidentCache = {};
    if (!s.portfolioCatalysts) s.portfolioCatalysts = [];
    if (!s.usedPortfolioIncidents) s.usedPortfolioIncidents = [];
    if (typeof s.lastYearOutcome === "undefined") s.lastYearOutcome = null;
    if (!s.usedLPCalls) s.usedLPCalls = [];
    if (!s.readPages) s.readPages = [];
    if (!s.investigationSources) s.investigationSources = {};
    if (!s.history) s.history = [];
    if (!s.tutorialFlags) s.tutorialFlags = {};
    if (typeof s.tutorialFlags.pitchBattle !== "boolean") s.tutorialFlags.pitchBattle = false;
    if (typeof s.researchSpent !== "number") s.researchSpent = 0;
    if (typeof s.investableCapital !== "number") s.investableCapital = 90_000_000;
    if (typeof s.managementFeeBudget !== "number") s.managementFeeBudget = 10_000_000;
    (s.portfolio || []).forEach(p => {
      if (!p.status) p.status = "active";
      if (typeof p.realizedAmount !== "number") p.realizedAmount = 0;
      if ((previousVersion < 3 || typeof p.equityPct !== "number") &&
          p.entryValuation) {
        p.equityPct = p.investedAmount / (p.entryValuation + p.investedAmount);
      }
      if (typeof p.equityPct === "number" && p.equityPct > 0.5) p.equityPct = 0.5;
      if (previousVersion < 5 && (!p.status || p.status === "active") &&
          p.entryYear === s.year && typeof p.currentValueMultiplier === "number") {
        const hasExplicitMark = (s.history || []).some(h =>
          h && h.year === p.entryYear && h.startup === p.name &&
          ["portfolio_call", "followon", "exit", "ipo", "writeoff", "writedown"].includes(h.type)
        );
        if (!hasExplicitMark) p.currentValueMultiplier = 1;
      }
    });
    s.maxYear = 3;
    if (!s.gameOver && s.year > s.maxYear) s.year = s.maxYear;
    s.version = 5;
    return s;
  }

  const TVState = {
    current: null,

    init() {
      this.current = makeNewState();
    },

    newGame(options) {
      options = options || {};
      this.current = makeNewState();
      this.current.gameStarted = true;
      if (options.fundName) this.current.fundName = String(options.fundName).slice(0, 24);
      if (options.nickname) this.current.nickname = String(options.nickname).slice(0, 16);
      this.save();
      return this.current;
    },

    hasSave() {
      return localStorage.getItem(SAVE_KEY) !== null;
    },

    save() {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(this.current));
      } catch (e) { /* quota o privacy mode: ignora */ }
    },

    load() {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      try {
        const data = JSON.parse(raw);
        this.current = migrateState(Object.assign(makeNewState(), data));
        return true;
      } catch (e) { return false; }
    },

    /* RNG deterministico legato al seed di partita.
       Stessa chiave → stesso esito: impedisce il save-scumming
       su DD e negoziazioni. Ritorna un numero in [0, 1). */
    roll(key) {
      const src = String((this.current && this.current.gameSeed) || 0) + "|" + key;
      let h = 2166136261;
      for (let i = 0; i < src.length; i++) {
        h ^= src.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return ((h >>> 0) % 10000) / 10000;
    },

    clear() {
      localStorage.removeItem(SAVE_KEY);
    },

    exportSave() {
      try { return btoa(localStorage.getItem(SAVE_KEY) || ""); }
      catch (e) { return ""; }
    },

    importSave(str) {
      try {
        const json = atob(str);
        const data = JSON.parse(json);
        // validazione strutturale minima prima di accettare il save
        if (!data || typeof data !== "object" ||
            typeof data.year !== "number" ||
            typeof data.cash !== "number" ||
            !Array.isArray(data.portfolio)) return false;
        localStorage.setItem(SAVE_KEY, json);
        return this.load();
      } catch (e) { return false; }
    }
  };

  global.TVState = TVState;
})(window);
