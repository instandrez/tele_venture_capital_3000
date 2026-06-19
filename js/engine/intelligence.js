/* Intelligence Network.
   Collega le pagine news ai deal dell'anno e traduce la navigazione
   Televideo in vantaggi leggibili durante la Pitch Battle. */
(function (global) {

  function publishedNews(state) {
    const year = (state && state.year) || 1;
    return TVNews.NEWS.filter(n => n.year <= year && n.signal);
  }

  function effectFor(news, startup) {
    if (!news || !news.signal || !startup) return 0;
    return TVMarket.getSignalEffect(news.signal, startup);
  }

  function rootSector(startup) {
    return String((startup && startup.sectorTag) || "").split("_")[0];
  }

  const EVIDENCE = {
    trend:         { kind: "MERCATO",  move: 2, moveLabel: "COMPETITOR" },
    macro:         { kind: "CONTESTO", move: 1, moveLabel: "NUMERI" },
    regulation:    { kind: "REGOLE",   move: 1, moveLabel: "NUMERI" },
    founder_risk:  { kind: "PERSONE",  move: 3, moveLabel: "TEAM" },
    corporate_opp: { kind: "EXIT",     move: 2, moveLabel: "COMPETITOR" }
  };

  function evidenceMeta(news) {
    const signal = (news && news.signal) || {};
    if (signal.type !== "macro") return EVIDENCE[signal.type] || EVIDENCE.macro;
    if (news.section === 120) return { kind: "REGOLE", move: 1, moveLabel: "NUMERI" };
    if (news.section === 140) return { kind: "MERCATO", move: 2, moveLabel: "COMPETITOR" };
    if (news.section === 160) return { kind: "PERSONE", move: 3, moveLabel: "TEAM" };
    if (news.section === 180) return { kind: "EXIT", move: 2, moveLabel: "COMPETITOR" };
    return EVIDENCE.macro;
  }

  function evidenceFor(news, startup, effect) {
    const signal = news.signal || {};
    const meta = evidenceMeta(news);
    const sameSector = signal.sector === rootSector(startup);
    const direct = Math.abs(effect) > 0.0001;
    const weight = direct ? 2 : (sameSector ? 1 : 0.5);
    return {
      kind: meta.kind,
      move: meta.move,
      moveLabel: meta.moveLabel,
      weight: weight,
      direct: direct,
      polarity: effect > 0.001 ? "positive" : (effect < -0.001 ? "negative" : "neutral")
    };
  }

  function relevantNews(state, startup) {
    const root = rootSector(startup);
    const sorted = publishedNews(state)
      .map(n => {
        const effect = effectFor(n, startup);
        const sameSector = n.signal.sector === root;
        const sectorContext = sameSector &&
          ["trend", "macro", "regulation"].includes(n.signal.type);
        const priority = effect !== 0 ? 3 :
          (sectorContext ? 2 : (n.signal.type === "macro" ? 1 : 0));
        const evidence = evidenceFor(n, startup, effect);
        return {
          news: n,
          effect: effect,
          priority: priority,
          kind: evidence.kind,
          move: evidence.move,
          moveLabel: evidence.moveLabel,
          weight: evidence.weight,
          direct: evidence.direct,
          polarity: evidence.polarity
        };
      })
      .filter(x => x.priority > 0)
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        if (b.news.year !== a.news.year) return b.news.year - a.news.year;
        const strength = Math.abs(b.effect) - Math.abs(a.effect);
        return strength || a.news.page - b.news.page;
      });

    const selected = sorted.slice(0, 6);
    const selectedKinds = new Set(selected.map(x => x.kind));
    if (selected.length === 6 && selectedKinds.size < 2) {
      const secondSignature = sorted.slice(6).find(x => !selectedKinds.has(x.kind));
      if (secondSignature) selected[5] = secondSignature;
    }
    return selected;
  }

  function levelFor(evidenceScore) {
    if (evidenceScore >= 5) return 3;
    if (evidenceScore >= 3) return 2;
    if (evidenceScore >= 1) return 1;
    return 0;
  }

  function labelFor(level) {
    return ["CASO FREDDO", "APPUNTI", "TEORIA", "CASO SOLIDO"][level] || "CASO FREDDO";
  }

  const CASE_QUESTIONS = {
    AI: "La tecnologia regge senza hype?",
    CLIMATE: "Chi paga senza sussidi?",
    ROBOTICS: "Il video vende o il robot lavora?",
    MOBILITY: "La strada supera il runway?",
    BATTERY: "Fabbrica, filiera o powerpoint?",
    CYBER: "La paura cresce piu' del budget?",
    LEGALTECH: "Moat paziente o adozione eterna?",
    SPACE: "Contratto orbitale o miraggio?",
    FINTECH: "Margine vero o finestra breve?",
    SAAS: "Retention o demo infinita?",
    CRYPTO: "Protocollo o roulette in giacca?",
    CONSUMER: "Abitudine o moda da trimestre?",
    UNKNOWN: "Cosa stanno evitando di dire?"
  };

  function caseQuestion(startup) {
    return CASE_QUESTIONS[rootSector(startup)] || CASE_QUESTIONS.UNKNOWN;
  }

  function theoryFor(read, evidenceScore) {
    if (!read.length) return "Solo brochure. Zero ritagli.";
    if (evidenceScore < 3) return "Appunti fragili. Serve corroborare.";
    const positive = read.some(x => x.effect > 0.01);
    const negative = read.some(x => x.effect < -0.01);
    if (positive && negative) return "Le fonti litigano. Ottimo.";
    const balance = read.reduce((sum, x) => sum + x.effect, 0);
    if (balance > 0.04) return "Vento a favore. Sospetto.";
    if (balance < -0.04) return "Vento contrario. Deck muto.";
    return "Il contesto non confessa.";
  }

  function leadFor(read, level) {
    if (level < 2) return null;
    const positive = read.some(x => x.polarity === "positive");
    const negative = read.some(x => x.polarity === "negative");
    if (positive && negative) {
      return {
        move: 4,
        label: "SILENZIO",
        reason: "le fonti si contraddicono"
      };
    }

    const strongest = read.slice().sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      return Math.abs(b.effect) - Math.abs(a.effect);
    })[0];
    if (!strongest) return null;
    const reasons = {
      PERSONE: "la governance lascia impronte",
      REGOLE: "la norma non torna col deck",
      EXIT: "un compratore cambia la partita",
      MERCATO: "il posizionamento va contestato",
      CONTESTO: "i numeri devono reggere il contesto"
    };
    return {
      move: strongest.move,
      label: strongest.moveLabel,
      reason: reasons[strongest.kind] || "due fonti puntano allo stesso buco"
    };
  }

  function newsFingerprint(news) {
    if (!news || !news.signal) return null;
    const meta = evidenceMeta(news);
    const descriptions = {
      MERCATO: "sentiment, domanda e posizionamento",
      CONTESTO: "costi, liquidita' e condizioni operative",
      REGOLE: "vincoli e vantaggi regolatori",
      PERSONE: "governance e rischio founder",
      EXIT: "partner industriali e possibili acquirenti"
    };
    return { kind: meta.kind, description: descriptions[meta.kind] };
  }

  function sourcePageFor(startup) {
    const all = (global.TVStartups && global.TVStartups.STARTUPS) || [];
    const index = all.findIndex(st => st.id === startup.id);
    return index < 0 ? null : 910 + index;
  }

  function sourceLabel(startup) {
    if (startup.founderProfile === "red_flag" || startup.founderProfile === "ego")
      return "EX DIPENDENTE";
    if (startup.regulatoryExposure <= -0.5) return "CONSULENTE REGOLATORIO";
    if (startup.corporateFitTag) return "CORPORATE DEVELOPMENT";
    if (startup.unitEconomics < 0) return "EX CLIENTE";
    return "OPERATORE DI SETTORE";
  }

  function chainFor(state, startup, relevant) {
    relevant = relevant || relevantNews(state, startup);
    const readSet = new Set((state && state.readPages) || []);
    const read = relevant.filter(x => readSet.has(x.news.page));
    const kinds = Array.from(new Set(read.map(x => x.kind)));
    const score = read.reduce((sum, x) => sum + x.weight, 0);
    const page = sourcePageFor(startup);
    const record = state && state.investigationSources &&
      state.investigationSources[startup.id];
    return {
      fragments: kinds.length,
      kinds,
      unlocked: score >= 3 && kinds.length >= 2,
      contacted: !!(record && record.contacted),
      page,
      source: sourceLabel(startup),
      clue: startup.hiddenRisk
    };
  }

  function contactSource(state, startup) {
    if (!state.investigationSources) state.investigationSources = {};
    const chain = chainFor(state, startup);
    if (!chain.unlocked) return null;
    state.investigationSources[startup.id] = {
      contacted: true,
      page: chain.page,
      year: state.year
    };
    return chainFor(state, startup);
  }

  function sourceStartupByPage(pageNum) {
    const all = (global.TVStartups && global.TVStartups.STARTUPS) || [];
    return all[pageNum - 910] || null;
  }

  function sidekickLine(intel) {
    if (intel.level === 0) return "MARTA: \"Per ora abbiamo il deck. Quindi niente.\"";
    if (intel.level === 1) return "MARTA: \"Appunti. Non ancora prove. Non montarti la testa.\"";
    if (intel.level === 2) return "MARTA: \"Teoria corroborata. Ho armato una domanda.\"";
    return "MARTA: \"Caso solido. Ora roviniamolo con una decisione.\"";
  }

  function forStartup(state, startup) {
    const relevant = relevantNews(state, startup);
    const readSet = new Set((state && state.readPages) || []);
    const read = relevant.filter(x => readSet.has(x.news.page));
    const unread = relevant.filter(x => !readSet.has(x.news.page));
    const evidenceScore = read.reduce((sum, x) => sum + x.weight, 0);
    const level = levelFor(evidenceScore);
    const momentum = read.reduce((sum, x) => sum + x.effect, 0);
    const lead = leadFor(read, level);
    const chain = chainFor(state, startup, relevant);
    const sourceBonus = chain.contacted;
    return {
      relevant: relevant,
      read: read,
      unread: unread,
      total: relevant.length,
      readCount: read.length,
      evidenceScore: evidenceScore,
      evidenceMax: 5,
      level: level,
      label: labelFor(level),
      shield: Math.min(3, (level >= 3 ? 2 : (level >= 2 ? 1 : 0)) +
        (sourceBonus ? 1 : 0)),
      ddCost: sourceBonus || level >= 3 ? 25_000 : (level >= 2 ? 50_000 : 100_000),
      negotiationBonus: Math.min(0.25, evidenceScore * 0.04 + (sourceBonus ? 0.08 : 0)),
      momentum: momentum,
      question: caseQuestion(startup),
      theory: theoryFor(read, evidenceScore),
      lead: lead,
      leadPower: sourceBonus ? 3 : 2,
      chain: chain,
      privateClue: sourceBonus ? chain.clue : null,
      sidekick: sidekickLine({ level: level }),
      sections: Array.from(new Set(unread.map(x => x.news.section)))
    };
  }

  function linkedDeals(state, pageNum) {
    if (!state || !state.gameStarted || typeof TVDealflow === "undefined") return [];
    return TVDealflow.currentYearDealflow(state).filter(st =>
      relevantNews(state, st).some(x => x.news.page === pageNum)
    );
  }

  function pageStatus(state, pageNum) {
    const read = !!(state && (state.readPages || []).includes(pageNum));
    const deals = linkedDeals(state, pageNum);
    return { read: read, deals: deals };
  }

  function unlockedSourcesForPage(state, pageNum) {
    if (!state || !state.gameStarted || typeof TVDealflow === "undefined") return [];
    return TVDealflow.currentYearDealflow(state)
      .filter(st => relevantNews(state, st).some(x => x.news.page === pageNum))
      .map(st => ({ startup: st, chain: chainFor(state, st) }))
      .filter(x => x.chain.unlocked && !x.chain.contacted);
  }

  global.TVIntel = {
    relevantNews, forStartup, linkedDeals, pageStatus,
    levelFor, labelFor, caseQuestion, theoryFor, sidekickLine,
    leadFor, newsFingerprint, chainFor, contactSource,
    sourcePageFor, sourceStartupByPage, unlockedSourcesForPage
  };
})(typeof window !== "undefined" ? window : global);
