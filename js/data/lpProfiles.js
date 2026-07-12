/* I 4 archetipi di Limited Partner del fondo.
   Ogni LP ha pesi sulle metriche e settori che ama / odia. */
(function (global) {

  const LP_PROFILES = {
    pensione: {
      id: "pensione",
      name: "Fondo Pensione Padano",
      caller: "Dott.ssa Ferrari, Direzione Investimenti",
      personality: "sobria, conservativa, parla di duration anche al caffe'",
      loves:   { metrics: ["DPI", "diversificazione"], sectors: ["SAAS", "LEGALTECH", "CYBER"] },
      hates:   { metrics: ["concentrazione", "burn alto"], sectors: ["CRYPTO", "SPACE"] },
      catchphrase: "I nostri iscritti non capiscono i pivot. E nemmeno noi dopo il terzo."
    },
    family: {
      id: "family",
      name: "Famiglia Industriale Veneta",
      caller: "Sig.ra Marchetti, Family Office",
      personality: "pragmatica, vuole impatto industriale e un plant visitabile",
      loves:   { metrics: ["Innovation Impact", "B2B"], sectors: ["ROBOTICS", "BATTERY", "MOBILITY", "SAAS"] },
      hates:   { metrics: ["vaporware"], sectors: ["CRYPTO", "CONSUMER"] },
      catchphrase: "Avete pensato al nostro stabilimento? Ha anche una sala riunioni."
    },
    sovereign: {
      id: "sovereign",
      name: "Sovereign Fund del Golfo",
      caller: "Sheikh Al-Mansour",
      personality: "ambizioso, think big, ama gli zeri e le foto con skyline",
      loves:   { metrics: ["MOIC", "valuation alte"], sectors: ["AI", "SPACE", "ROBOTICS"] },
      hates:   { metrics: ["DPI basso non lo disturba", "prudenza eccessiva"], sectors: ["CLIMATE", "LEGALTECH"] },
      catchphrase: "We don't talk DPI here. We talk impact and unicorns."
    },
    endowment: {
      id: "endowment",
      name: "Endowment Università di Bologna",
      caller: "Prof. Bianchi, Comitato Investimenti",
      personality: "progressista, ESG, accademico, chiede bibliografia",
      loves:   { metrics: ["impact reale", "ESG"], sectors: ["CLIMATE", "BATTERY", "LEGALTECH"] },
      hates:   { metrics: ["greenwashing"], sectors: ["CRYPTO", "FINTECH"] },
      catchphrase: "Avete una thesis sull'antropocene?"
    }
  };

  global.TVLPProfiles = LP_PROFILES;
})(window);
