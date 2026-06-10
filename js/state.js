/* gameState — singolo oggetto stato + save/load LocalStorage.
   Le metriche LP sono tracciate separatamente per i 4 archetipi. */
(function (global) {
  const SAVE_KEY = "tvc3000.save";

  function makeNewState() {
    return {
      version: 1,
      year: 1,
      maxYear: 5,
      quarter: 1,
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
      readPages: [],          // pagine news che l'utente ha effettivamente visitato (per "edge informativo")
      publishedNews: [],      // id news pubblicate nel corso del gioco
      pendingLPCalls: [],
      pendingICEvents: [],
      history: [],            // log eventi/IC per il report finale
      currentPage: 100,
      previousPage: null,
      fundName: null,
      nickname: null,
      gameOver: false
    };
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
        this.current = Object.assign(makeNewState(), data);
        return true;
      } catch (e) { return false; }
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
        JSON.parse(json); // validate
        localStorage.setItem(SAVE_KEY, json);
        return this.load();
      } catch (e) { return false; }
    }
  };

  global.TVState = TVState;
})(window);
