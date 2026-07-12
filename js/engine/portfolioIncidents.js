/* Portfolio company incidents.
   Chiamate operative delle partecipate: una crisi/anno, se il fondo ha
   posizioni attive e il dealflow annuale e' stato deliberato. */
(function (global) {

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function keyFor(state) {
    return "y" + ((state && state.year) || 1);
  }

  function pendingQueue(state) {
    if (!state.portfolioIncidentQueue) state.portfolioIncidentQueue = [];
    return state.portfolioIncidentQueue.find(i => i && i.status === "pending") || null;
  }

  function usedKeys(state) {
    if (!state.usedPortfolioIncidentKeys) state.usedPortfolioIncidentKeys = [];
    return state.usedPortfolioIncidentKeys;
  }

  function proposedKeys(state) {
    if (!state.proposedPortfolioIncidentKeys) state.proposedPortfolioIncidentKeys = [];
    return state.proposedPortfolioIncidentKeys;
  }

  function incidentKind(incident) {
    return String((incident && incident.id) || "").split("|")[0] || "incident";
  }

  function uniqueIncidentKey(incident) {
    return incidentKind(incident);
  }

  function wasAlreadyProposed(state, incident) {
    const key = uniqueIncidentKey(incident);
    return usedKeys(state).includes(key) || proposedKeys(state).includes(key);
  }

  function markProposed(state, incident) {
    const key = uniqueIncidentKey(incident);
    const proposed = proposedKeys(state);
    if (!proposed.includes(key)) proposed.push(key);
    return incident;
  }

  function hasBattleCallThisYear(state) {
    const key = keyFor(state);
    return (state.portfolioIncidentQueue || []).some(i =>
      i && i.source === "after_battle" && i.year === state.year &&
      (String(i.triggerKey || "").indexOf(key + "|") >= 0 || i.year === state.year)
    );
  }

  function activePositions(state) {
    return (state.portfolio || []).filter(p =>
      (!p.status || p.status === "active") && p.investedAmount > 0
    );
  }

  function canTrigger(state) {
    if (!state || !state.gameStarted || state.gameOver) return false;
    if (!activePositions(state).length) return false;
    const key = keyFor(state);
    if (!state.dealflowCache || !state.dealflowCache[key]) return false;
    return true;
  }

  function riskScore(pos, state) {
    const st = TVStartups.byId(pos.id) || {};
    let score = 0;
    if (pos.currentValueMultiplier < 1) score += 3;
    if (st.unitEconomics < 0) score += Math.abs(st.unitEconomics) * 4;
    if (st.regulatoryExposure < 0) score += Math.abs(st.regulatoryExposure) * 3;
    if (st.founderProfile === "red_flag") score += 4;
    if (st.founderProfile === "ego") score += 2;
    if (st.hype >= 8) score += 1.5;
    return score + TVState.roll("incident-risk|" + pos.id + "|" + keyFor(state));
  }

  function pickPosition(state, opts) {
    opts = opts || {};
    const ranked = activePositions(state).map(pos => {
      const incident = freshIncidentForPosition(state, pos, opts);
      const repeated = !incident;
      return {
        pos: pos,
        incident: incident,
        repeated: repeated,
        score: riskScore(pos, state) - (repeated ? 100 : 0)
      };
    }).filter(item => !item.repeated).sort((a, b) => b.score - a.score);
    return ranked[0] || null;
  }

  function baseCost(pos, ratio) {
    return Math.max(300_000, Math.round((pos.investedAmount || 1_000_000) * ratio));
  }

  function moneyLabel(value) {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value || 0);
    if (abs >= 1_000_000) {
      const exact = abs % 1_000_000 === 0;
      return sign + (abs / 1_000_000).toFixed(exact ? 0 : 1) + "M";
    }
    if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "k";
    return sign + abs;
  }

  function choice(label, detail, effects) {
    return {
      label: label,
      detail: detail,
      cost: Math.max(0, -(effects.cash || 0)),
      effects: effects
    };
  }

  function hasTag(tag, parts) {
    tag = String(tag || "");
    return parts.some(p => tag.indexOf(p) >= 0);
  }

  function italianAnchorQuestion() {
    return "Il comitato chiede: \"ma l'anchor pubblico c'e'?\" Nessun nome reale, solo panico.";
  }

  function buildIncident(state, pos, opts) {
    opts = opts || {};
    const st = TVStartups.byId(pos.id) || {};
    const year = state.year || 1;
    const suffix = opts.contextKey || ("y" + year);
    const common = {
      year: year,
      startupId: pos.id,
      startupName: pos.name,
      sectorTag: pos.sectorTag,
      status: "pending",
      source: opts.source || "annual",
      triggerKey: opts.triggerKey || null,
      afterResolvePage: opts.afterResolvePage || null
    };

    const tag = String(st.sectorTag || pos.sectorTag || "");
    const industrial = hasTag(tag, ["BATTERY", "ROBOTICS", "MOBILITY_INFRA", "CLIMATE_HARD"]);
    const enterprise = hasTag(tag, ["CYBER", "SAAS", "LEGALTECH", "FINTECH_INSURTECH", "AI_INFRA"]);
    const policyHeavy = hasTag(tag, ["CLIMATE", "SPACE", "DEFENSE", "MOBILITY_INFRA"]);
    const highHypeLowProof = (st.hype || 0) >= 8 && (st.traction || 0) <= 3;

    if (highHypeLowProof) {
      return Object.assign(common, {
        id: "round|" + pos.id + "|" + suffix,
        tone: "round",
        caller: "SYNDICATE CHAT",
        face: "shadow",
        headline: "ROUND QUASI CHIUSO DA SEI MESI",
        context: [
          pos.name + " annuncia un round \"oversubscribed\" per la terza volta.",
          "Il lead esiste, ma solo in una call calendarizzata dopo Ferragosto.",
          italianAnchorQuestion()
        ],
        choices: [
          choice("Lead check brutale", "Chiami davvero il presunto lead. Se balbetta, tagli narrativa e burn.",
            { cash: -baseCost(pos, 0.05), multiplierPct: 0.10, reputation: 3, impact: 0 }),
          choice("Bridge con milestone", "Metti poco cash, ma solo se arriva LOI firmata e cap table pulita.",
            { cash: -baseCost(pos, 0.12), multiplierPct: 0.08, reputation: 1, impact: 1 }),
          choice("Credi al FOMO deck", "Forwardi il deck al comitato e chiami questa cosa momentum.",
            { cash: 0, multiplierPct: -0.24, reputation: -4, impact: -1, lp: -2 })
        ]
      });
    }

    if (st.founderProfile === "red_flag" || st.founderProfile === "ego") {
      return Object.assign(common, {
        id: "founder|" + pos.id + "|" + suffix,
        tone: "founder",
        caller: "BOARD OBSERVER",
        face: "shadow",
        headline: "GOVERNANCE DA APERITIVO",
        context: [
          pos.name + " chiama fuori agenda, poi aggiunge il cofounder in mute.",
          "Il team segnala churn interno e decisioni prodotto prese in treno.",
          "Rischio nascosto: " + (st.hiddenRisk || "governance fragile") + "."
        ],
        choices: [
          choice("Operating partner weekly", "Metti un adulto nella stanza e blocchi spese non core.",
            { cash: -baseCost(pos, 0.10), multiplierPct: 0.14, reputation: 3, impact: 1 }),
          choice("Milestone o taglio", "Due KPI entro 60 giorni. Sembra cattivo, quindi forse e' lavoro.",
            { cash: 0, multiplierPct: 0.04, reputation: 1, impact: -1 }),
          choice("Lascia fare al founder", "Non tocchi il genio. Il genio intanto licenzia via chat.",
            { cash: 0, multiplierPct: -0.24, reputation: -4, impact: -2, lp: -2 })
        ]
      });
    }

    if ((st.regulatoryExposure || 0) < -0.35) {
      return Object.assign(common, {
        id: "reg|" + pos.id + "|" + suffix,
        tone: "regulatory",
        caller: "STUDIO LEGALE",
        face: "visor",
        headline: "PORTALE COMPLIANCE IN FIAMME",
        context: [
          pos.name + " riceve una richiesta chiarimenti scritta in burocratese puro.",
          "Il founder dice \"e' solo forma\". Lo dice sempre chi non ha letto l'allegato.",
          "Rischio nascosto: " + (st.hiddenRisk || "licenza non chiara") + "."
        ],
        choices: [
          choice("War room compliance", "Paghi legali seri e ripulisci go-to-market, contratti e promesse.",
            { cash: -baseCost(pos, 0.16), multiplierPct: 0.12, reputation: 3, impact: 0 }),
          choice("Pivot regulated-lite", "Riduci TAM, ma salvi il round successivo e il sonno.",
            { cash: -baseCost(pos, 0.06), multiplierPct: -0.02, reputation: 1, impact: 1 }),
          choice("Ignora il portale", "Aspetti che passi. Il portale ha memoria migliore del founder.",
            { cash: 0, multiplierPct: -0.28, reputation: -5, impact: -1, lp: -3 })
        ]
      });
    }

    if (enterprise && (st.corporateFitTag || (st.traction || 0) >= 4)) {
      return Object.assign(common, {
        id: "procurement|" + pos.id + "|" + suffix,
        tone: "enterprise",
        caller: "HEAD OF SALES",
        face: "operator",
        headline: "PROCUREMENT ETERNO",
        context: [
          pos.name + " ha un logo enterprise \"in firma\" da 94 giorni.",
          "Corporate innovation applaude, procurement chiede un portale fornitori del 2007.",
          "Upside nascosto: " + (st.hiddenUpside || "contratto enterprise vero") + "."
        ],
        choices: [
          choice("Procurement SWAT team", "Paghi supporto legale/sales ops e trasformi il pilot in ordine.",
            { cash: -baseCost(pos, 0.13), multiplierPct: 0.17, reputation: 2, impact: 2 }),
          choice("Paid pilot o niente", "Niente POC gratis: se il budget non esiste, non e' pipeline.",
            { cash: 0, multiplierPct: 0.06, reputation: 2, impact: 0 }),
          choice("Aspetta il Q4", "Credi al forecast. Anche il forecast crede in Babbo Natale.",
            { cash: 0, multiplierPct: -0.16, reputation: -2, impact: -1, lp: -1 })
        ]
      });
    }

    if (industrial) {
      return Object.assign(common, {
        id: "plant|" + pos.id + "|" + suffix,
        tone: "industrial",
        caller: "PLANT MANAGER",
        face: "client",
        headline: "PLANT VISIT DEL NORDEST",
        context: [
          pos.name + " deve fare demo in stabilimento venerdi' alle 7:40.",
          "Il family office del Nordest vuole vedere ferro, casco e fattura.",
          "Rischio nascosto: " + (st.hiddenRisk || "delivery fisica piu' lenta del deck") + "."
        ],
        choices: [
          choice("Casco + delivery squad", "Finanzi la demo vera: pezzi, installazione e qualcuno che risponde al telefono.",
            { cash: -baseCost(pos, 0.18), multiplierPct: 0.18, reputation: 2, impact: 3 }),
          choice("Pilot pagato in fabbrica", "La demo si fa solo con ordine pilota e KPI scritti.",
            { cash: 0, multiplierPct: 0.07, reputation: 1, impact: 1 }),
          choice("Rimanda al deck", "Mandi un PDF bellissimo. In fabbrica lo usano per appoggiare il caffe'.",
            { cash: 0, multiplierPct: -0.18, reputation: -2, impact: -2 })
        ]
      });
    }

    if (policyHeavy) {
      return Object.assign(common, {
        id: "grant|" + pos.id + "|" + suffix,
        tone: "policy",
        caller: "GRANT ADVISOR",
        face: "visor",
        headline: "BANDO MINUSCOLO, RENDICONTO ENORME",
        context: [
          pos.name + " puo' vincere un bando pubblico da importo quasi simbolico.",
          "Il founder lo chiama non dilutive. L'admin lo chiama tre mesi di dolore.",
          italianAnchorQuestion()
        ],
        choices: [
          choice("Usalo come segnale", "Prendi il bando come validazione, ma non costruisci il business plan sopra.",
            { cash: -baseCost(pos, 0.04), multiplierPct: 0.09, reputation: 2, impact: 2 }),
          choice("Match con cliente vero", "Accetti solo se sblocca un pilot pagato o un offtake.",
            { cash: 0, multiplierPct: 0.05, reputation: 1, impact: 2 }),
          choice("Fai grant theater", "Tre mesi di rendiconto per una cifra che non paga il CFO frazionale.",
            { cash: 0, multiplierPct: -0.12, reputation: -1, impact: -1, lp: -1 })
        ]
      });
    }

    if ((st.unitEconomics || 0) < -0.2) {
      return Object.assign(common, {
        id: "burn|" + pos.id + "|" + suffix,
        tone: "burn",
        caller: "CFO",
        face: "client",
        headline: "BRIDGE O TAGLIO DEL GROWTH HACKER",
        context: [
          pos.name + " cresce, ma ogni cliente aggiunge margine negativo e una call di supporto.",
          "Il founder chiede bridge per non rovinare la narrativa di round.",
          "Rischio nascosto: " + (st.hiddenRisk || "unit economics deboli") + "."
        ],
        choices: [
          choice("Bridge + finance ops", "Metti cash, ma pretendi pricing, churn dashboard e stop ai canali tossici.",
            { cash: -baseCost(pos, 0.22), multiplierPct: 0.16, reputation: 2, impact: 1 }),
          choice("Taglia growth spend", "Meno vanity metric, piu' sopravvivenza. Il founder soffre su LinkedIn.",
            { cash: 0, multiplierPct: 0.05, reputation: 1, impact: -1 }),
          choice("Niente bridge", "Li lasci tornare sul mercato deboli e con una story troppo creativa.",
            { cash: 0, multiplierPct: -0.26, reputation: -3, impact: -2, lp: -2 })
        ]
      });
    }

    return Object.assign(common, {
      id: "growth|" + pos.id + "|" + suffix,
      tone: "growth",
      caller: "CEO",
      face: "operator",
      headline: "GROWTH BREAKPOINT",
      context: [
        pos.name + " ha un cliente strategico in due diligence.",
        "Serve decidere se finanziare delivery e supporto ora.",
        "Upside nascosto: " + (st.hiddenUpside || "round interno piu' credibile") + "."
      ],
      choices: [
        choice("Fund the pilot", "Paghi delivery e trasformi il logo in prova di mercato.",
          { cash: -baseCost(pos, 0.18), multiplierPct: 0.20, reputation: 2, impact: 3 }),
        choice("Paid pilot only", "Niente soldi gratis: il cliente deve validare con budget.",
          { cash: 0, multiplierPct: 0.07, reputation: 1, impact: 1 }),
        choice("Stay passive", "Non rischi altro capitale, ma perdi momentum.",
          { cash: 0, multiplierPct: -0.12, reputation: -1, impact: -1 })
      ]
    });
  }

  function fallbackIncidentCandidates(state, pos, opts) {
    opts = opts || {};
    const st = TVStartups.byId(pos.id) || {};
    const year = state.year || 1;
    const suffix = opts.contextKey || ("y" + year);
    const common = {
      year: year,
      startupId: pos.id,
      startupName: pos.name,
      sectorTag: pos.sectorTag,
      status: "pending",
      source: opts.source || "annual",
      triggerKey: opts.triggerKey || null,
      afterResolvePage: opts.afterResolvePage || null
    };
    return [
      Object.assign({}, common, {
        id: "runway|" + pos.id + "|" + suffix,
        tone: "burn",
        caller: "CFO",
        face: "client",
        headline: "RUNWAY MATH NON TORNA",
        context: [
          pos.name + " ha aggiornato il piano cassa dopo una settimana creativa.",
          "La burn chart ora sembra un term sheet scritto al contrario.",
          "Rischio nascosto: " + (st.hiddenRisk || "il prossimo round arriva piu' tardi del deck") + "."
        ],
        choices: [
          choice("Taglia burn adesso", "Blocchi hiring non core e allunghi runway senza romanticismo.",
            { cash: 0, multiplierPct: 0.08, reputation: 2, impact: -1 }),
          choice("Bridge controllato", "Metti cash con covenant operativo e weekly KPI.",
            { cash: -baseCost(pos, 0.16), multiplierPct: 0.13, reputation: 1, impact: 1 }),
          choice("Aspetta il round", "Confondi ottimismo e runway. Succede nei fondi educati.",
            { cash: 0, multiplierPct: -0.22, reputation: -3, lp: -2 })
        ]
      }),
      Object.assign({}, common, {
        id: "hiring|" + pos.id + "|" + suffix,
        tone: "founder",
        caller: "TALENT LEAD",
        face: "operator",
        headline: "HIRING PLAN DA SCALEUP IMMAGINARIA",
        context: [
          pos.name + " vuole assumere VP, Chief of Staff e tre advisor prima del product-market fit.",
          "La job description dice ownership. Il budget dice teatro.",
          "Il founder chiama il tutto 'prepararsi alla Series A'."
        ],
        choices: [
          choice("Blocca senior hiring", "Assumi solo chi spedisce prodotto o fatture.",
            { cash: 0, multiplierPct: 0.07, reputation: 2, impact: 0 }),
          choice("Fractional operator", "Paghi supporto part-time invece di una corte permanente.",
            { cash: -baseCost(pos, 0.07), multiplierPct: 0.10, reputation: 1, impact: 1 }),
          choice("Approva organigramma", "L'org chart cresce piu' veloce del fatturato.",
            { cash: 0, multiplierPct: -0.18, reputation: -2, lp: -1 })
        ]
      }),
      Object.assign({}, common, {
        id: "kpi|" + pos.id + "|" + suffix,
        tone: "enterprise",
        caller: "DATA ROOM",
        face: "visor",
        headline: "KPI RESTATEMENT",
        context: [
          pos.name + " manda un update: alcuni KPI erano 'interpretati'.",
          "Il grafico resta bello, ma il denominatore ha cambiato cittadinanza.",
          "Upside nascosto: " + (st.hiddenUpside || "la sostanza forse c'e', ma va misurata") + "."
        ],
        choices: [
          choice("Metriche audited", "Rendi i numeri noiosi, comparabili e finalmente utili.",
            { cash: -baseCost(pos, 0.06), multiplierPct: 0.11, reputation: 3, impact: 0 }),
          choice("Nuovo board pack", "Cambi formato: meno vanity, piu' cohort e cash.",
            { cash: 0, multiplierPct: 0.05, reputation: 1, impact: 0 }),
          choice("Lascia la narrativa", "Se la linea sale, qualcuno applaudira'. Poi arrivano gli LP.",
            { cash: 0, multiplierPct: -0.20, reputation: -3, lp: -2 })
        ]
      }),
      Object.assign({}, common, {
        id: "pricing|" + pos.id + "|" + suffix,
        tone: "growth",
        caller: "SALES OPS",
        face: "operator",
        headline: "PRICING DA PAURA DI VENDERE",
        context: [
          pos.name + " chiude clienti, ma sconta come se ogni logo fosse terapia.",
          "Il founder dice land-and-expand. Il margine dice land-and-apologize.",
          "Il comitato vuole sapere se il prodotto ha pricing power o solo gentilezza."
        ],
        choices: [
          choice("Alza prezzi sui nuovi clienti", "Meno loghi vanity, piu' margine difendibile.",
            { cash: 0, multiplierPct: 0.12, reputation: 1, impact: 1 }),
          choice("Segmenta enterprise", "Tieni entry cheap, ma fai pagare chi vuole compliance e SLA.",
            { cash: -baseCost(pos, 0.05), multiplierPct: 0.10, reputation: 1, impact: 1 }),
          choice("Sconta ancora", "Il grafico ARR cresce. Il conto economico trattiene una lacrima.",
            { cash: 0, multiplierPct: -0.16, reputation: -2, lp: -1 })
        ]
      }),
      Object.assign({}, common, {
        id: "audit|" + pos.id + "|" + suffix,
        tone: "regulatory",
        caller: "ADMIN",
        face: "visor",
        headline: "AUDIT MINI, PANICO MAXI",
        context: [
          pos.name + " riceve una richiesta documentale minuscola e fastidiosa.",
          "Non e' una crisi legale, ma puo' diventare una crisi di credibilita'.",
          "La differenza tra startup e azienda e' una cartella condivisa ordinata."
        ],
        choices: [
          choice("Sistema data room", "Metti ordine prima che l'ordine lo chieda qualcun altro.",
            { cash: -baseCost(pos, 0.04), multiplierPct: 0.08, reputation: 2, impact: 0 }),
          choice("Risposta essenziale", "Fai il minimo giusto, ma senza costruire un processo.",
            { cash: 0, multiplierPct: 0.02, reputation: 0, impact: 0 }),
          choice("Rimanda all'admin", "Il founder scopre che l'admin era un foglio Google.",
            { cash: 0, multiplierPct: -0.14, reputation: -2, lp: -1 })
        ]
      }),
      Object.assign({}, common, {
        id: "secondary|" + pos.id + "|" + suffix,
        tone: "round",
        caller: "SECONDARY DESK",
        face: "shadow",
        headline: "SECONDARY A SCONTO STRANO",
        context: [
          "Qualcuno offre liquidita' su " + pos.name + ", ma il prezzo racconta un romanzo.",
          "Non e' exit, non e' follow-on: e' un termometro per la fiducia.",
          "La domanda vera: vendi un pezzo, compri piu' informazione o fai finta di niente?"
        ],
        choices: [
          choice("Vendi una piccola quota", "Porti DPI simbolico e riduci rischio, ma limiti upside.",
            { cash: baseCost(pos, 0.10), multiplierPct: -0.04, reputation: 1, lp: 2 }),
          choice("Usa il bid per DD", "Non vendi, ma chiedi perche' lo sconto esiste.",
            { cash: 0, multiplierPct: 0.06, reputation: 1, impact: 0 }),
          choice("Ignora il segnale", "La liquidita' bussa piano. Tu alzi la musica.",
            { cash: 0, multiplierPct: -0.15, reputation: -2, lp: -1 })
        ]
      })
    ];
  }

  function buildFallbackIncident(state, pos, opts) {
    const candidates = fallbackIncidentCandidates(state, pos, opts);
    if (!candidates.length) return null;
    const start = Math.floor(TVState.roll("incident-fallback|" + pos.id + "|" +
      keyFor(state) + "|" + ((opts && opts.triggerKey) || "")) * candidates.length);
    for (let i = 0; i < candidates.length; i++) {
      const incident = candidates[(start + i) % candidates.length];
      if (!wasAlreadyProposed(state, incident)) return incident;
    }
    return null;
  }

  function freshIncidentForPosition(state, pos, opts) {
    const base = buildIncident(state, pos, opts);
    if (!wasAlreadyProposed(state, base)) return base;
    return buildFallbackIncident(state, pos, opts);
  }

  function activeIncident(state) {
    if (!state.portfolioIncidentCache) state.portfolioIncidentCache = {};
    const queued = pendingQueue(state);
    if (queued) return queued;
    if (hasBattleCallThisYear(state)) return null;
    const key = keyFor(state);
    const cached = state.portfolioIncidentCache[key];
    if (cached) return cached.status === "pending" ? cached : null;
    if (!canTrigger(state)) return null;
    const picked = pickPosition(state);
    if (!picked) return null;
    const incident = picked.incident;
    if (wasAlreadyProposed(state, incident)) return null;
    markProposed(state, incident);
    state.portfolioIncidentCache[key] = incident;
    TVState.save();
    return incident;
  }

  function queueAfterBattle(state, startup, ctx) {
    ctx = ctx || {};
    if (!state || !state.gameStarted || state.gameOver) return null;
    if (!activePositions(state).length) return null;
    if (!state.portfolioIncidentQueue) state.portfolioIncidentQueue = [];
    const triggerKey = keyFor(state) + "|battle|" +
      ((startup && startup.id) || "unknown") + "|" +
      (ctx.decision || "memo") + "|" + ((state.history || []).length);
    const existing = state.portfolioIncidentQueue.find(i => i && i.triggerKey === triggerKey);
    if (existing) return existing.status === "pending" ? existing : null;
    const picked = pickPosition(state, {
      source: "after_battle",
      contextKey: triggerKey,
      triggerKey: triggerKey
    });
    if (!picked) return null;
    const incident = picked.incident;
    incident.afterResolvePage = 200;
    if (wasAlreadyProposed(state, incident)) return null;
    markProposed(state, incident);
    incident.context = [
      "Chiamata post-battle: il portfolio non aspetta la fine dell'anno."
    ].concat(incident.context || []);
    state.portfolioIncidentQueue.push(incident);
    TVState.save();
    return incident;
  }

  function applyChoice(state, incident, choice) {
    const pos = (state.portfolio || []).find(p => p.id === incident.startupId);
    if (!pos || !choice) return null;
    const e = choice.effects || {};
    const metrics = [];
    const notes = [];

    function pushMetric(label, before, after, delta) {
      metrics.push({ label: label, before: before, after: after, delta: delta });
    }

    if (e.cash) {
      const before = state.cash || 0;
      state.cash = Math.max(0, before + e.cash);
      pushMetric("Cash", moneyLabel(before),
        moneyLabel(state.cash), moneyLabel(e.cash));
      if (e.cash < 0) {
        const spent = Math.min(before, -e.cash);
        state.invested = (state.invested || 0) + spent;
        pos.investedAmount = (pos.investedAmount || 0) + spent;
        pushMetric("Capitale supporto", "0",
          moneyLabel(spent), "+" + moneyLabel(spent));
      }
    }

    if (e.multiplierPct) {
      const before = pos.currentValueMultiplier || 1;
      const eventWeight = incident.source === "after_battle" ? 1.35 : 1;
      const weightedPct = e.multiplierPct * eventWeight;
      pos.currentValueMultiplier = Math.max(0.03, before * (1 + weightedPct));
      pushMetric("Multiplo " + pos.name, before.toFixed(2) + "x",
        pos.currentValueMultiplier.toFixed(2) + "x",
        (weightedPct > 0 ? "+" : "") + Math.round(weightedPct * 100) + "%");
      if (incident.source === "after_battle" && weightedPct <= -0.24) {
        notes.push({ text: "La call entra subito nel mark: questa partecipata ora pesa davvero sul destino del fondo." });
      }
    }

    if (e.reputation) {
      const before = state.reputation || 0;
      state.reputation = clamp(before + e.reputation, 0, 100);
      pushMetric("Reputation", before, state.reputation, e.reputation);
    }

    if (e.impact) {
      const before = state.innovationImpact || 0;
      state.innovationImpact = clamp(before + e.impact, 0, 100);
      pushMetric("Impact", before, state.innovationImpact, e.impact);
    }

    if (e.lp) {
      Object.keys(state.lpSat || {}).forEach(k => {
        state.lpSat[k] = clamp((state.lpSat[k] || 50) + e.lp, 0, 100);
      });
      notes.push({ text: "Gli LP leggono la crisi: satisfaction " + (e.lp > 0 ? "+" : "") + e.lp + " su tutti." });
    }

    incident.status = "resolved";
    incident.choice = choice.label;
    incident.resolvedYear = state.year;
    if (!state.usedPortfolioIncidents) state.usedPortfolioIncidents = [];
    if (!state.usedPortfolioIncidents.includes(incident.id)) {
      state.usedPortfolioIncidents.push(incident.id);
    }
    if (!usedKeys(state).includes(uniqueIncidentKey(incident))) {
      usedKeys(state).push(uniqueIncidentKey(incident));
    }
    if (!state.history) state.history = [];
    state.history.push({
      year: state.year,
      type: "portfolio_call",
      startup: pos.name,
      incident: incident.headline,
      choice: choice.label
    });
    TVState.save();

    const tone = metrics.some(m => String(m.delta).charAt(0) === "-")
      ? (metrics.some(m => String(m.delta).charAt(0) !== "-") ? "mixed" : "negative")
      : "positive";
    return { tone: tone, metrics: metrics, notes: notes, incident: incident, choice: choice };
  }

  global.TVPortfolioIncidents = {
    activeIncident,
    queueAfterBattle,
    applyChoice,
    buildIncident
  };
})(typeof window !== "undefined" ? window : global);
