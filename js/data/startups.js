/* Pool startup del Tele Venture Capital 3000.

   NOMI: tutti in inglese, allusivi, satirici. Riferimenti riconoscibili
   per chi vive il VC ma nessun brand reale.

   ATTRIBUTI VISIBILI: sector, valuation, team/traction/hype/fit.
   ATTRIBUTI NASCOSTI: sectorTag granulare (es. AI_FOUNDATION vs AI_INFRA),
   regulatoryExposure, hypeDecay, unitEconomics, founderProfile,
   corporateFitTag, hiddenRisk, hiddenUpside.

   Il motore (marketEngine) usa gli attributi nascosti + le news pubblicate
   per calcolare currentValueMultiplier. Il giocatore scopre gli attributi
   via DD / Ref Call / Co-invest / Trend — o leggendo bene il Televideo.
*/
(function (global) {

  const STARTUPS = [
    // ===================== AI / GENERATIVA =====================
    {
      id: "neurodrive",
      name: "NeuroDrive.ai",
      sector: "AI Mobility",
      stage: "Seed", valuation: 12_000_000,
      team: 8, traction: 3, hype: 9, strategicFit: 7,
      sectorTag: "AI_FOUNDATION", regulatoryExposure: -0.7,
      hypeDecay: 0.4, unitEconomics: -0.3,
      founderProfile: "ego", corporateFitTag: "sdv_partnership",
      hiddenRisk: "Esposizione regolatoria alta sui modelli generali",
      hiddenUpside: "Possibile partnership SDV con OEM industriale",
      era: "ai_hype"
    },
    {
      id: "foundergpt",
      name: "FounderGPT",
      sector: "AI / Productivity",
      stage: "Pre-seed", valuation: 6_000_000,
      team: 6, traction: 2, hype: 9, strategicFit: 4,
      sectorTag: "AI_FOUNDATION", regulatoryExposure: -0.5,
      hypeDecay: 0.7, unitEconomics: -0.5,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "Il founder ha già pivotato due volte in 9 mesi",
      hiddenUpside: "Lista d'attesa di 14k utenti che pagano $9/mo",
      era: "ai_hype"
    },
    {
      id: "ragtag",
      name: "RagTag.ai",
      sector: "AI / RAG Infra",
      stage: "Seed", valuation: 9_000_000,
      team: 7, traction: 4, hype: 7, strategicFit: 6,
      sectorTag: "AI_INFRA", regulatoryExposure: +0.4,
      hypeDecay: 0.3, unitEconomics: +0.2,
      founderProfile: "competent", corporateFitTag: "telco_ai_api",
      hiddenRisk: "Mercato RAG verrà commoditizzato in 18 mesi",
      hiddenUpside: "Pilot concluso con grande TLC, contratto in revisione",
      era: "ai_hype"
    },
    {
      id: "agiordie",
      name: "AGIorDie",
      sector: "AI Research",
      stage: "Pre-seed", valuation: 30_000_000,
      team: 9, traction: 0, hype: 10, strategicFit: 2,
      sectorTag: "AI_FOUNDATION", regulatoryExposure: -0.9,
      hypeDecay: 0.8, unitEconomics: -0.9,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Valuation indifendibile, runway 8 mesi",
      hiddenUpside: "Due PhD ex-top lab; possibile acqui-hire",
      era: "ai_hype"
    },
    {
      id: "neuronote",
      name: "NeuroNote",
      sector: "LegalTech AI",
      stage: "Seed", valuation: 14_000_000,
      team: 8, traction: 7, hype: 5, strategicFit: 8,
      sectorTag: "LEGALTECH_VERTICAL", regulatoryExposure: +0.5,
      hypeDecay: 0.2, unitEconomics: +0.5,
      founderProfile: "competent", corporateFitTag: "health_data",
      hiddenRisk: "Mercato avvocati lento ad adottare",
      hiddenUpside: "240 studi paganti, churn 3.1%, ARR 4.2M",
      era: "legaltech"
    },
    {
      id: "promptlayer",
      name: "PromptLayer.io",
      sector: "AI Devtools",
      stage: "Seed", valuation: 11_000_000,
      team: 7, traction: 5, hype: 8, strategicFit: 5,
      sectorTag: "AI_INFRA", regulatoryExposure: +0.2,
      hypeDecay: 0.5, unitEconomics: 0.0,
      founderProfile: "hustle", corporateFitTag: null,
      hiddenRisk: "Open source compete sullo stesso layer",
      hiddenUpside: "Adoption virale tra ML engineer",
      era: "ai_hype"
    },
    {
      id: "agentforge",
      name: "AgentForge",
      sector: "AI / Multi-agent",
      stage: "Seed", valuation: 22_000_000,
      team: 8, traction: 1, hype: 10, strategicFit: 4,
      sectorTag: "AI_FOUNDATION", regulatoryExposure: -0.6,
      hypeDecay: 0.7, unitEconomics: -0.6,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Demo perfette in slide, niente in produzione",
      hiddenUpside: "Founder ex-CTO di un noto incumbent",
      era: "ai_hype"
    },

    // ===================== CLIMATE / ENERGY =====================
    {
      id: "saltcore",
      name: "SaltCore Energy",
      sector: "Battery / Sodium-ion",
      stage: "Series A", valuation: 95_000_000,
      team: 9, traction: 4, hype: 6, strategicFit: 9,
      sectorTag: "BATTERY_INDUSTRIAL", regulatoryExposure: +0.8,
      hypeDecay: 0.1, unitEconomics: +0.3,
      founderProfile: "competent", corporateFitTag: "sdv_partnership",
      hiddenRisk: "Filiera celle esposta a shortage chip",
      hiddenUpside: "Pilot industriale già avviato con OEM",
      era: "battery"
    },
    {
      id: "carbonhug",
      name: "CarbonHug",
      sector: "Climate / MRV",
      stage: "Seed", valuation: 18_000_000,
      team: 5, traction: 2, hype: 8, strategicFit: 4,
      sectorTag: "CLIMATE_SOFT", regulatoryExposure: +0.3,
      hypeDecay: 0.6, unitEconomics: -0.4,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Metriche di impact controverse",
      hiddenUpside: "Deck molto fotogenico, attrae attenzione media",
      era: "climate"
    },
    {
      id: "deepforge",
      name: "DeepForge Geothermal",
      sector: "Climate / Geothermal",
      stage: "Seed", valuation: 22_000_000,
      team: 8, traction: 1, hype: 4, strategicFit: 7,
      sectorTag: "CLIMATE_HARD", regulatoryExposure: +0.7,
      hypeDecay: 0.1, unitEconomics: +0.4,
      founderProfile: "grit", corporateFitTag: null,
      hiddenRisk: "Capex pesante, time-to-revenue 4 anni",
      hiddenUpside: "Brevetto su scambiatore termico originale",
      era: "climate"
    },
    {
      id: "bluehydro",
      name: "BlueHydro",
      sector: "Climate / Hydrogen",
      stage: "Series A", valuation: 80_000_000,
      team: 7, traction: 2, hype: 7, strategicFit: 6,
      sectorTag: "CLIMATE_HARD", regulatoryExposure: +0.6,
      hypeDecay: 0.4, unitEconomics: -0.2,
      founderProfile: "competent", corporateFitTag: null,
      hiddenRisk: "LCOH ancora non competitivo",
      hiddenUpside: "Tre offtake firmati con utility",
      era: "climate"
    },
    {
      id: "greenrinse",
      name: "GreenRinse",
      sector: "Climate / Greenwash-as-a-service",
      stage: "Seed", valuation: 14_000_000,
      team: 4, traction: 2, hype: 6, strategicFit: 2,
      sectorTag: "CLIMATE_SOFT", regulatoryExposure: -0.3,
      hypeDecay: 0.8, unitEconomics: -0.6,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "Il prodotto è un report PDF colorato",
      hiddenUpside: "Vende a grandi corporate che ne hanno bisogno",
      era: "climate"
    },

    // ===================== ROBOTICS / INDUSTRIAL =====================
    {
      id: "humanoidops",
      name: "HumanoidOps",
      sector: "Robotics / Humanoid",
      stage: "Seed", valuation: 45_000_000,
      team: 9, traction: 1, hype: 10, strategicFit: 5,
      sectorTag: "ROBOTICS_FRONTIER", regulatoryExposure: -0.2,
      hypeDecay: 0.7, unitEconomics: -0.6,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Time-to-market 5+ anni, costi BOM enormi",
      hiddenUpside: "Team ex-top lab; possibile acquisizione",
      era: "ai_hype"
    },
    {
      id: "strongarm",
      name: "StrongArm Robotics",
      sector: "Robotics / Industrial",
      stage: "Series A", valuation: 35_000_000,
      team: 8, traction: 6, hype: 5, strategicFit: 9,
      sectorTag: "ROBOTICS_INDUSTRIAL", regulatoryExposure: +0.1,
      hypeDecay: 0.2, unitEconomics: +0.5,
      founderProfile: "grit", corporateFitTag: "sdv_partnership",
      hiddenRisk: "Concorrenza tedesca consolidata",
      hiddenUpside: "Order book riempito per 18 mesi",
      era: "evergreen"
    },
    {
      id: "humanlessops",
      name: "HumanLessOps",
      sector: "Robotics / Factory AI",
      stage: "Seed", valuation: 20_000_000,
      team: 7, traction: 3, hype: 7, strategicFit: 7,
      sectorTag: "ROBOTICS_INDUSTRIAL", regulatoryExposure: 0.0,
      hypeDecay: 0.3, unitEconomics: +0.1,
      founderProfile: "hustle", corporateFitTag: null,
      hiddenRisk: "Sales cycle 9 mesi, cash burn aggressivo",
      hiddenUpside: "Pilot conclusi in 2 plant del Nord",
      era: "evergreen"
    },

    // ===================== MOBILITY =====================
    {
      id: "yachtbrain",
      name: "YachtBrain",
      sector: "Mobility / Marine Autonomy",
      stage: "Seed", valuation: 8_000_000,
      team: 5, traction: 2, hype: 6, strategicFit: 4,
      sectorTag: "MOBILITY_NICHE", regulatoryExposure: -0.3,
      hypeDecay: 0.6, unitEconomics: -0.4,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "Il founder ha appena lasciato; transizione caotica",
      hiddenUpside: "Tecnologia certificabile per droni cargo",
      era: "mobility"
    },
    {
      id: "evcharge24",
      name: "EVCharge24",
      sector: "Mobility / Charging",
      stage: "Series A", valuation: 60_000_000,
      team: 7, traction: 5, hype: 6, strategicFit: 8,
      sectorTag: "MOBILITY_INFRA", regulatoryExposure: +0.5,
      hypeDecay: 0.3, unitEconomics: +0.2,
      founderProfile: "competent", corporateFitTag: "sdv_partnership",
      hiddenRisk: "Margini compressi dalla guerra dei prezzi",
      hiddenUpside: "300 stazioni installate, contratto utility in firma",
      era: "mobility"
    },
    {
      id: "scootflow",
      name: "ScootFlow",
      sector: "Mobility / Micro-mobility",
      stage: "Series A", valuation: 40_000_000,
      team: 5, traction: 5, hype: 4, strategicFit: 3,
      sectorTag: "MOBILITY_NICHE", regulatoryExposure: -0.5,
      hypeDecay: 0.7, unitEconomics: -0.6,
      founderProfile: "hustle", corporateFitTag: null,
      hiddenRisk: "Regolazione comunale ostile in 3 grandi città",
      hiddenUpside: "Brand forte, possibile consolidamento",
      era: "consumer"
    },

    // ===================== SPACE / DEFENSE =====================
    {
      id: "starvista",
      name: "StarVista",
      sector: "Space / SmallSat",
      stage: "Series A", valuation: 70_000_000,
      team: 9, traction: 3, hype: 8, strategicFit: 7,
      sectorTag: "SPACE_DUAL_USE", regulatoryExposure: +0.6,
      hypeDecay: 0.3, unitEconomics: -0.1,
      founderProfile: "competent", corporateFitTag: "epropulsion",
      hiddenRisk: "Dipendenza da launcher esterni",
      hiddenUpside: "Contratto governativo in advanced negotiation",
      era: "space"
    },
    {
      id: "dovesofwar",
      name: "DovesOfWar",
      sector: "Defense / Drones",
      stage: "Seed", valuation: 25_000_000,
      team: 8, traction: 2, hype: 9, strategicFit: 6,
      sectorTag: "SPACE_DEFENSE", regulatoryExposure: +0.4,
      hypeDecay: 0.4, unitEconomics: 0.0,
      founderProfile: "grit", corporateFitTag: "epropulsion",
      hiddenRisk: "Export control restrittivi",
      hiddenUpside: "Due ministeri interessati a tender pluriennale",
      era: "space"
    },

    // ===================== CYBERSECURITY =====================
    {
      id: "fortresslab",
      name: "FortressLab",
      sector: "Cyber / B2B",
      stage: "Series A", valuation: 40_000_000,
      team: 8, traction: 7, hype: 5, strategicFit: 8,
      sectorTag: "CYBER_ENTERPRISE", regulatoryExposure: +0.5,
      hypeDecay: 0.2, unitEconomics: +0.6,
      founderProfile: "competent", corporateFitTag: null,
      hiddenRisk: "Sales cycle 6+ mesi enterprise",
      hiddenUpside: "ARR 8M, net retention 130%",
      era: "cyber"
    },
    {
      id: "ghostlog",
      name: "GhostLog",
      sector: "Cyber / SIEM",
      stage: "Seed", valuation: 15_000_000,
      team: 7, traction: 4, hype: 6, strategicFit: 6,
      sectorTag: "CYBER_INFRA", regulatoryExposure: +0.3,
      hypeDecay: 0.3, unitEconomics: +0.3,
      founderProfile: "hustle", corporateFitTag: null,
      hiddenRisk: "Spazio crowded, differenziazione debole",
      hiddenUpside: "Open core con 3.2k stelle GitHub",
      era: "cyber"
    },

    // ===================== LEGALTECH / SAAS =====================
    {
      id: "invoicequick",
      name: "InvoiceQuick",
      sector: "B2B SaaS / Fintech-adjacent",
      stage: "Series A", valuation: 50_000_000,
      team: 7, traction: 8, hype: 4, strategicFit: 8,
      sectorTag: "SAAS_VERTICAL", regulatoryExposure: +0.3,
      hypeDecay: 0.2, unitEconomics: +0.7,
      founderProfile: "grit", corporateFitTag: null,
      hiddenRisk: "Concentrazione clienti su 3 verticals",
      hiddenUpside: "Profittevole. Sì, esiste.",
      era: "saas"
    },
    {
      id: "notarygpt",
      name: "NotaryGPT",
      sector: "LegalTech",
      stage: "Seed", valuation: 12_000_000,
      team: 6, traction: 3, hype: 7, strategicFit: 6,
      sectorTag: "LEGALTECH_VERTICAL", regulatoryExposure: +0.4,
      hypeDecay: 0.4, unitEconomics: +0.1,
      founderProfile: "competent", corporateFitTag: "health_data",
      hiddenRisk: "Lobby ordini professionali resistente",
      hiddenUpside: "Partnership con 2 ordini regionali in trattativa",
      era: "legaltech"
    },
    {
      id: "legalcopilot",
      name: "LegalCopilot",
      sector: "LegalTech",
      stage: "Pre-seed", valuation: 7_000_000,
      team: 5, traction: 4, hype: 5, strategicFit: 5,
      sectorTag: "LEGALTECH_HORIZONTAL", regulatoryExposure: +0.2,
      hypeDecay: 0.5, unitEconomics: 0.0,
      founderProfile: "first_time", corporateFitTag: null,
      hiddenRisk: "Founder al primo round, manca esperienza enterprise",
      hiddenUpside: "Crescita organica solida",
      era: "legaltech"
    },

    // ===================== FINTECH / INSURTECH =====================
    {
      id: "smartpolicy",
      name: "SmartPolicy",
      sector: "Insurtech B2B",
      stage: "Seed", valuation: 16_000_000,
      team: 6, traction: 4, hype: 5, strategicFit: 7,
      sectorTag: "FINTECH_INSURTECH", regulatoryExposure: +0.3,
      hypeDecay: 0.3, unitEconomics: +0.2,
      founderProfile: "competent", corporateFitTag: "insurtech_b2b",
      hiddenRisk: "Distribuzione difficile senza partner bancario",
      hiddenUpside: "Pilot in corso con grande banca",
      era: "saas"
    },
    {
      id: "madbank",
      name: "MadBank",
      sector: "Fintech Consumer",
      stage: "Series A", valuation: 100_000_000,
      team: 7, traction: 5, hype: 8, strategicFit: 4,
      sectorTag: "FINTECH_CONSUMER", regulatoryExposure: -0.2,
      hypeDecay: 0.6, unitEconomics: -0.4,
      founderProfile: "hustle", corporateFitTag: null,
      hiddenRisk: "CAC alti, monetizzazione debole",
      hiddenUpside: "300k utenti attivi, brand giovani",
      era: "saas"
    },

    // ===================== CRYPTO =====================
    {
      id: "crookedtoken",
      name: "CrookedToken",
      sector: "Crypto / NFT",
      stage: "Seed", valuation: 30_000_000,
      team: 4, traction: 1, hype: 9, strategicFit: 1,
      sectorTag: "CRYPTO_RETAIL", regulatoryExposure: -0.9,
      hypeDecay: 0.9, unitEconomics: -0.8,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "Founder già pivotato 3 volte, regolazione sfavorevole",
      hiddenUpside: "Sì, qualche degen ancora ci crede",
      era: "crypto_winter"
    },

    // ===================== CONSUMER / MARKETPLACE =====================
    {
      id: "spinall",
      name: "SpinAll",
      sector: "Consumer / Gig",
      stage: "Series A", valuation: 55_000_000,
      team: 6, traction: 5, hype: 6, strategicFit: 3,
      sectorTag: "CONSUMER_GIG", regulatoryExposure: -0.4,
      hypeDecay: 0.5, unitEconomics: -0.5,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "Founder licenzia via WhatsApp, governance fragile",
      hiddenUpside: "Marketplace ha network effect locale",
      era: "consumer"
    },

    // ===================== EVERGREEN / ARCHETIPI =====================
    {
      id: "stealthmode",
      name: "StealthMode",
      sector: "??? (Stealth)",
      stage: "Seed Ext.", valuation: 800_000_000,
      team: 0, traction: 0, hype: 10, strategicFit: 0,
      sectorTag: "UNKNOWN", regulatoryExposure: 0,
      hypeDecay: 0.5, unitEconomics: 0,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Nessuno sa cosa fa. Forse nessuno lo sa lì dentro.",
      hiddenUpside: "Se è quello che pensi, è un unicorno. Forse.",
      era: "evergreen"
    },
    {
      id: "exgoogler",
      name: "ExGoogler.ai",
      sector: "AI / Infra",
      stage: "Seed", valuation: 60_000_000,
      team: 9, traction: 0, hype: 10, strategicFit: 3,
      sectorTag: "AI_INFRA", regulatoryExposure: 0.0,
      hypeDecay: 0.7, unitEconomics: -0.5,
      founderProfile: "ego", corporateFitTag: null,
      hiddenRisk: "Team forte ma zero customer discovery",
      hiddenUpside: "Possibile acqui-hire da incumbent",
      era: "ai_hype"
    },
    {
      id: "pivotking",
      name: "PivotKing",
      sector: "??? (3° pivot)",
      stage: "Seed", valuation: 9_000_000,
      team: 5, traction: 2, hype: 4, strategicFit: 3,
      sectorTag: "UNKNOWN", regulatoryExposure: 0,
      hypeDecay: 0.8, unitEconomics: -0.6,
      founderProfile: "red_flag", corporateFitTag: null,
      hiddenRisk: "3 pivot in 18 mesi. Probabile zombie.",
      hiddenUpside: "Cash residuo permette un altro pivot",
      era: "evergreen"
    }
  ];

  function byId(id)   { return STARTUPS.find(s => s.id === id); }
  function all()      { return STARTUPS.slice(); }
  function byEra(era) { return STARTUPS.filter(s => s.era === era); }

  global.TVStartups = { STARTUPS, byId, all, byEra };
})(window);
