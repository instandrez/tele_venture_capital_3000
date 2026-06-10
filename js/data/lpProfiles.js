/* I 4 archetipi di Limited Partner del fondo.
   Ogni LP ha pesi sulle metriche e settori che ama / odia. */
(function (global) {

  const LP_PROFILES = {
    pensione: {
      id: "pensione",
      name: "Fondo Pensione Lombardia",
      caller: "Dr. Ferrari, Direttore Investimenti",
      personality: "sobrio, conservativo, parla di rendimenti stabili",
      loves:   { metrics: ["DPI", "diversificazione"], sectors: ["SAAS", "LEGALTECH", "CYBER"] },
      hates:   { metrics: ["concentrazione", "burn alto"], sectors: ["CRYPTO", "SPACE"] },
      catchphrase: "I nostri pensionati non capiscono i pivot."
    },
    family: {
      id: "family",
      name: "Famiglia Industriale Veneta",
      caller: "Sig.ra Marchetti, Family Office",
      personality: "pragmatica, vuole impatto industriale italiano",
      loves:   { metrics: ["Innovation Impact", "B2B"], sectors: ["ROBOTICS", "BATTERY", "MOBILITY", "SAAS"] },
      hates:   { metrics: ["vaporware"], sectors: ["CRYPTO", "CONSUMER"] },
      catchphrase: "Avete pensato al nostro stabilimento di Schio?"
    },
    sovereign: {
      id: "sovereign",
      name: "Sovereign Fund del Golfo",
      caller: "Sheikh Al-Mansour",
      personality: "ambizioso, think big, ama gli zeri",
      loves:   { metrics: ["MOIC", "valuation alte"], sectors: ["AI", "SPACE", "ROBOTICS"] },
      hates:   { metrics: ["DPI basso non lo disturba", "prudenza eccessiva"], sectors: ["CLIMATE", "LEGALTECH"] },
      catchphrase: "We don't talk DPI here. We talk impact and unicorns."
    },
    endowment: {
      id: "endowment",
      name: "Endowment Università di Bologna",
      caller: "Prof. Bianchi, Investment Committee",
      personality: "progressista, ESG, accademico",
      loves:   { metrics: ["impact reale", "ESG"], sectors: ["CLIMATE", "BATTERY", "LEGALTECH"] },
      hates:   { metrics: ["greenwashing"], sectors: ["CRYPTO", "FINTECH"] },
      catchphrase: "Avete una thesis sull'antropocene?"
    }
  };

  global.TVLPProfiles = LP_PROFILES;
})(window);
