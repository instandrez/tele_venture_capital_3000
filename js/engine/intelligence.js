/* Intelligence Network.
   Collega le pagine news ai deal dell'anno e traduce la navigazione
   Televideo in vantaggi leggibili durante la Pitch Battle. */
(function (global) {

  function publishedNews(state) {
    const year = (state && state.year) || 1;
    return TVNews.NEWS.filter(n => n.year === year && n.signal);
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
          ["trend", "macro", "regulation", "corporate_opp"].includes(n.signal.type);
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

  function newsForCurrentDealflow(state, sectionRoot) {
    if (!state || !state.gameStarted || typeof TVDealflow === "undefined") {
      return TVNews.listSection(sectionRoot, (state && state.year) || 1);
    }
    const seen = new Set();
    const items = [];
    const deals = TVDealflow.currentYearDealflow(state);
    deals.forEach(st => {
      relevantNews(state, st).forEach(item => {
        const n = item.news;
        if (!n || n.section !== sectionRoot || seen.has(n.page)) return;
        seen.add(n.page);
        items.push(n);
      });
    });
    if (!items.length) {
      const roots = new Set(deals.map(st => rootSector(st)));
      TVNews.listSection(sectionRoot, state.year).forEach(n => {
        if (seen.has(n.page)) return;
        if (n.signal && roots.has(n.signal.sector)) {
          seen.add(n.page);
          items.push(n);
        }
      });
    }
    if (!items.length) {
      TVNews.listSection(sectionRoot, state.year).slice(0, 2).forEach(n => {
        if (seen.has(n.page)) return;
        seen.add(n.page);
        items.push(n);
      });
    }
    return items.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return a.page - b.page;
    });
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
      reason: reasons[strongest.kind] || "due ritagli puntano allo stesso buco"
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

  function sourceFace(startup) {
    if (startup.founderProfile === "red_flag" || startup.founderProfile === "ego") return "shadow";
    if (startup.regulatoryExposure <= -0.5) return "visor";
    if (startup.corporateFitTag) return "corpdev";
    if (startup.unitEconomics < 0) return "client";
    return "operator";
  }

  function sourceCodename(startup) {
    const root = String(startup.sectorTag || "CASE").split("_")[0];
    const names = {
      AI: "ORACLE",
      BATTERY: "ANODE",
      CLIMATE: "WINDTUNNEL",
      ROBOTICS: "CALIPER",
      MOBILITY: "ASPHALT",
      SPACE: "ORBIT",
      CYBER: "ROOT",
      LEGALTECH: "SEAL",
      SAAS: "LEDGER",
      FINTECH: "VAULT",
      CRYPTO: "COLDWALLET",
      CONSUMER: "CART"
    };
    return names[root] || "BACKCHANNEL";
  }

  function sourceLocation(startup) {
    const root = String(startup.sectorTag || "CASE").split("_")[0];
    const places = {
      AI: "slack di ex engineer",
      BATTERY: "plant pilota",
      CLIMATE: "corridoio procurement",
      ROBOTICS: "magazzino cliente",
      MOBILITY: "gara comunale",
      SPACE: "ufficio export control",
      CYBER: "canale security buyer",
      LEGALTECH: "ordine professionale",
      SAAS: "revops dashboard",
      FINTECH: "risk office",
      CRYPTO: "chat OTC",
      CONSUMER: "gruppo operatori"
    };
    return places[root] || "canale non ufficiale";
  }

  function qualityScore(startup) {
    return (
      (startup.team || 0) * 0.20 +
      (startup.traction || 0) * 0.28 +
      (startup.strategicFit || 0) * 0.18 +
      ((startup.unitEconomics || 0) + 1) * 1.9 -
      (startup.hype || 0) * 0.09 -
      (startup.hypeDecay || 0) * 1.2 -
      (startup.founderProfile === "red_flag" ? 1.5 : 0) -
      (startup.founderProfile === "ego" ? 0.7 : 0)
    );
  }

  function scriptedOutcome(startup) {
    const exits = global.TVExits && TVExits.EXIT_EVENTS;
    if (!exits) return null;
    return exits.find(e => e.startupId === startup.id) || null;
  }

  function sourceForecast(startup) {
    const horizon = 3;
    const ev = scriptedOutcome(startup);
    if (ev && ev.year <= horizon) {
      if (ev.kind === "exit" || ev.kind === "ipo") {
        return {
          code: "liquidity",
          tone: "positive",
          materializeYear: ev.year,
          effectPct: 0.18,
          message: "La linea vera e' liquidita' anno " + ev.year + ": " + ev.note + ".",
          implication: "Se entri, il punto non e' il mark: e' arrivare vivo all'evento.",
          check: "Controlla ownership, clausole e concentrazione del cliente che compra."
        };
      }
      if (ev.kind === "acquihire") {
        return {
          code: "acquihire",
          tone: "mixed",
          materializeYear: ev.year,
          effectPct: -0.06,
          message: "Il prodotto non regge il piano: anno " + ev.year + " finisce in acqui-hire.",
          implication: "Puoi salvare parte del capitale, ma non pagare multipli software.",
          check: "Valuta team quality e prezzo di entrata, non il TAM del deck."
        };
      }
      return {
        code: "writeoff",
        tone: "negative",
        materializeYear: ev.year,
        effectPct: -0.22,
        message: "Il downside e' gia' nel sistema: anno " + ev.year + " " + ev.note + ".",
        implication: "Entra solo se il prezzo compensa davvero il rischio di zero.",
        check: "Cerca burn, governance e segnali legali prima del term sheet."
      };
    }

    const score = qualityScore(startup);
    if (score >= 6.6) {
      return {
        code: "markup",
        tone: "positive",
        materializeYear: null,
        effectPct: 0.10,
        message: "Il dato sporco e' migliore del deck: clienti e margine stanno tenendo.",
        implication: "La startup dovrebbe rivalutarsi, ma solo se non strapaghi l'entry.",
        check: "Verifica retention, pricing power e qualita' dei ricavi."
      };
    }
    if (score <= 3.9 || ((startup.hype || 0) >= 8 && (startup.traction || 0) <= 2)) {
      return {
        code: "downmark",
        tone: "negative",
        materializeYear: null,
        effectPct: -0.14,
        message: "Il growth e' piu' narrativo che operativo: il prossimo mark e' fragile.",
        implication: "La valuation deve scendere o il deal diventa una trappola.",
        check: "Chiedi revenue quality, burn per cliente e prove non autoprodotte."
      };
    }
    return {
      code: "volatile",
      tone: "mixed",
      materializeYear: null,
      effectPct: -0.02,
      message: "Il deal puo' funzionare, ma non c'e' ancora una prova dominante.",
      implication: "Il prezzo decide tutto: bene con sconto, mediocre se insegui FOMO.",
      check: "Incrocia team, competitor e dati di traction prima di firmare."
    };
  }

  function sourceVerdict(startup) {
    const ue = typeof startup.unitEconomics === "number" ? startup.unitEconomics : 0;
    if (startup.founderProfile === "red_flag") {
      return "governance fragile: entra solo con prezzo molto piu' basso.";
    }
    if (ue <= -0.45) {
      return "la crescita costa troppo: serve prova durissima prima del term sheet.";
    }
    if (ue >= 0.3 && startup.traction >= 5) {
      return "rischio reale, ma il motore economico sembra difendibile.";
    }
    if (startup.strategicFit >= 8) {
      return "puo' valere se compri l'accesso strategico, non solo il fatturato.";
    }
    if (startup.hype >= 8 && startup.traction <= 2) {
      return "sembra piu' narrativa che business: negozia o lascia.";
    }
    return "caso aperto: il rischio va prezzato, non ignorato.";
  }

  function sourcePersona(startup) {
    const label = sourceLabel(startup);
    return {
      role: label,
      code: sourceCodename(startup),
      face: sourceFace(startup),
      location: sourceLocation(startup),
      risk: startup.hiddenRisk,
      upside: startup.hiddenUpside,
      verdict: sourceVerdict(startup),
      forecast: sourceForecast(startup)
    };
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
    const persona = sourcePersona(startup);
    const forecast = record && record.forecast ? record.forecast : persona.forecast;
    return {
      fragments: kinds.length,
      kinds,
      unlocked: score >= 3 && kinds.length >= 2,
      contacted: !!(record && record.contacted),
      page,
      source: persona.role,
      persona,
      forecast,
      clue: persona.risk
    };
  }

  function contactSource(state, startup) {
    if (!state.investigationSources) state.investigationSources = {};
    const chain = chainFor(state, startup);
    if (!chain.unlocked) return null;
    state.investigationSources[startup.id] = {
      contacted: true,
      page: chain.page,
      year: state.year,
      forecast: chain.forecast
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
    relevantNews, newsForCurrentDealflow, forStartup, linkedDeals, pageStatus,
    levelFor, labelFor, caseQuestion, theoryFor, sidekickLine,
    leadFor, newsFingerprint, chainFor, contactSource, sourceForecast,
    sourcePageFor, sourceStartupByPage, unlockedSourcesForPage
  };
})(typeof window !== "undefined" ? window : global);
