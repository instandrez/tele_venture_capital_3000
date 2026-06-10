/* gameState — singolo oggetto stato + save/load LocalStorage.
   Le metriche LP sono tracciate separatamente per i 4 archetipi. */
(function (global) {
  const SAVE_KEY = "tvc3000.save";

  function makeNewState() {
    return {
      version: 2,
      year: 1,
      maxYear: 5,
      gameSeed: Math.floor(Math.random() * 1e9),
      gameStarted: false,
      fundSize: 100_000_000,
      cash: 100_000_000,
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
      portfolio: [],
      seenStartups: [],
      readPages: [],          // pagine news visitate → edge informativo su DD
      dealDecisions: {},      // { yN: { startupId: "invested"|"passed" } }
      followOnCache: {},      // { yN: [offerte follow-on] }
      usedLPCalls: [],
      history: [],            // log decisioni/exit per il report finale
      currentPage: 100,
      previousPage: null,
      fundName: null,
      nickname: null,
      gameOver: false
    };
  }

  /* Porta i save di versioni precedenti al formato corrente. */
  function migrateState(s) {
    if (!s.gameSeed) s.gameSeed = Math.floor(Math.random() * 1e9);
    if (!s.dealDecisions) s.dealDecisions = {};
    if (!s.followOnCache) s.followOnCache = {};
    if (!s.usedLPCalls) s.usedLPCalls = [];
    if (!s.readPages) s.readPages = [];
    if (!s.history) s.history = [];
    (s.portfolio || []).forEach(p => {
      if (!p.status) p.status = "active";
      if (typeof p.realizedAmount !== "number") p.realizedAmount = 0;
    });
    s.version = 2;
    return s;
  }

  const TVState = {
    current: null,

    init() {
      this.current = makeNewState();
    },

    newGame() {
      this.current = makeNewState();
      this.current.gameStarted = true;
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
