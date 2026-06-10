/* Pool LP Call. Ogni call è triggerata da una CONDIZIONE di portfolio
   e parla dal punto di vista di uno specifico LP (vedi lpProfiles).

   Struttura:
   - id
   - lp: chiave LP (pensione|family|sovereign|endowment)
   - trigger: function(state) → bool
   - headline (mostrato sulla scheda call)
   - question (testo principale)
   - choices: [{ label, effects: { lpSat: {lp_id: delta}, reputation, innovationImpact } }]

   Note: gli effetti agiscono SOLO sul lp specifico (lpSat di quel LP),
   ma reputation e innovationImpact sono globali. Una risposta "compiacente"
   con un LP può far perdere stima con un altro nel medio termine — Sprint 6
   estende con dynamic crossover. Per ora effetti diretti.
*/
(function (global) {

  function pctInSector(state, sectorRoot) {
    if (!state.portfolio.length) return 0;
    const total = state.portfolio.reduce((sum, p) => sum + p.investedAmount, 0);
    if (total === 0) return 0;
    const inSector = state.portfolio
      .filter(p => (p.sectorTag || "").split("_")[0] === sectorRoot)
      .reduce((sum, p) => sum + p.investedAmount, 0);
    return inSector / total;
  }

  function hasInvestmentIn(state, sectorRoot) {
    return state.portfolio.some(p =>
      (p.sectorTag || "").split("_")[0] === sectorRoot);
  }

  const CALLS = [
    {
      id: "pensione-concentration-ai",
      lp: "pensione",
      trigger: s => pctInSector(s, "AI") > 0.5,
      headline: "CONCENTRAZIONE AI",
      question: [
        "\"Buongiorno. Abbiamo notato che oltre",
        "la metà del vostro fondo è esposta",
        "all'intelligenza artificiale.\"",
        "",
        "\"Come gestite il rischio di concentrazione?\""
      ],
      choices: [
        { label: "Piano di riequilibrio nei prossimi 18 mesi",
          effects: { lpSat: { pensione: +12, sovereign: -4 }, reputation: +2 } },
        { label: "\"AI is the new electricity\"",
          effects: { lpSat: { pensione: -18, sovereign: +8 }, reputation: -3 } },
        { label: "DD più severa sui prossimi round AI",
          effects: { lpSat: { pensione: +6, sovereign: -2, endowment: +3 } } }
      ]
    },
    {
      id: "sovereign-dpi-low",
      lp: "sovereign",
      trigger: s => s.year >= 3 && s.realized < s.invested * 0.2,
      headline: "VOGLIAMO ZERI",
      question: [
        "\"Anno 3. DPI ancora basso. Cosa state",
        "facendo per i nostri ritorni?\"",
        "",
        "\"E quando vedremo il prossimo unicorno?\""
      ],
      choices: [
        { label: "Disciplina e selettività: meglio MOIC a 5 anni",
          effects: { lpSat: { sovereign: -10, pensione: +4 } } },
        { label: "Aumento ticket su scaleup ad alto hype",
          effects: { lpSat: { sovereign: +10, pensione: -8, endowment: -4 },
                     reputation: -2 } },
        { label: "Considereremo un secondary market sale",
          effects: { lpSat: { sovereign: +4, pensione: +2 }, reputation: -2 } }
      ]
    },
    {
      id: "family-no-industrial",
      lp: "family",
      trigger: s => s.year >= 2 && !hasInvestmentIn(s, "ROBOTICS") && !hasInvestmentIn(s, "BATTERY"),
      headline: "DOV'È L'INDUSTRIA?",
      question: [
        "\"Notiamo che il vostro portfolio non ha",
        "esposizione a robotica industriale né a",
        "batterie.\"",
        "",
        "\"Avete pensato al nostro stabilimento di",
        "Schio?\""
      ],
      choices: [
        { label: "Aggiungeremo deal industriale nei prossimi 6 mesi",
          effects: { lpSat: { family: +12 }, innovationImpact: +3 } },
        { label: "La nostra tesi privilegia capital-light",
          effects: { lpSat: { family: -12 }, reputation: +1 } },
        { label: "Possiamo organizzare visita al vostro plant",
          effects: { lpSat: { family: +8 }, reputation: 0 } }
      ]
    },
    {
      id: "endowment-esg-fossil",
      lp: "endowment",
      trigger: s => hasInvestmentIn(s, "CRYPTO"),
      headline: "QUESTIONI ETICHE",
      question: [
        "\"Abbiamo notato un investimento crypto",
        "nel vostro portfolio.\"",
        "",
        "\"Le nostre policy ESG sono incompatibili.",
        "Vorremmo capire la vostra position.\""
      ],
      choices: [
        { label: "Era opportunistic, non strategico",
          effects: { lpSat: { endowment: -4, sovereign: -2 } } },
        { label: "Faremo write-off etico nell'anno corrente",
          effects: { lpSat: { endowment: +14, sovereign: -6 },
                     reputation: -3, special: "writeoff_crypto" } },
        { label: "Stiamo applicando una thesis dual-track",
          effects: { lpSat: { endowment: -10 }, reputation: -1 } }
      ]
    },
    {
      id: "endowment-climate-praise",
      lp: "endowment",
      trigger: s => s.year >= 2 && (pctInSector(s, "CLIMATE") > 0.2 || pctInSector(s, "BATTERY") > 0.2),
      headline: "OTTIMA TESI CLIMATE",
      question: [
        "\"Apprezziamo la vostra esposizione climate.",
        "Volevamo chiedervi: avete un piano",
        "di reporting impact strutturato?\""
      ],
      choices: [
        { label: "Sì, allineato a standard internazionali",
          effects: { lpSat: { endowment: +14 }, innovationImpact: +5,
                     reputation: +2 } },
        { label: "In fase di costruzione, vi coinvolgiamo",
          effects: { lpSat: { endowment: +6 }, innovationImpact: +2 } },
        { label: "Preferiamo focus su returns",
          effects: { lpSat: { endowment: -10, sovereign: +4 } } }
      ]
    },
    {
      id: "pensione-burn",
      lp: "pensione",
      trigger: s => s.cash < 30_000_000 && s.year <= 3,
      headline: "RUNWAY DEL FONDO",
      question: [
        "\"Abbiamo notato che avete deployato",
        "la maggior parte del committed in poco",
        "tempo.\"",
        "",
        "\"Restano riserve per follow-on?\""
      ],
      choices: [
        { label: "Sì, abbiamo modellato i follow-on round",
          effects: { lpSat: { pensione: +8, family: +4 } } },
        { label: "Faremo capital call aggiuntivo",
          effects: { lpSat: { pensione: -14, family: -8 }, reputation: -3 } },
        { label: "Considereremo selettivamente",
          effects: { lpSat: { pensione: -2 } } }
      ]
    },
    {
      id: "sovereign-go-big",
      lp: "sovereign",
      trigger: s => s.year >= 2 && s.portfolio.length >= 3 &&
                    s.portfolio.every(p => p.investedAmount < 5_000_000),
      headline: "PERCHÉ TICKET PICCOLI",
      question: [
        "\"Ticket medi sotto i 3M. Per noi,",
        "questo è poco interessante.\"",
        "",
        "\"Quando vedremo concentration bet?\""
      ],
      choices: [
        { label: "Quando troviamo conviction estrema",
          effects: { lpSat: { sovereign: +4, pensione: +6 } } },
        { label: "Aumenteremo ticket su prossimo deal",
          effects: { lpSat: { sovereign: +12, pensione: -4 } } },
        { label: "Disciplina di portfolio prima di tutto",
          effects: { lpSat: { sovereign: -10, pensione: +8 } } }
      ]
    },
    {
      id: "family-too-consumer",
      lp: "family",
      trigger: s => pctInSector(s, "CONSUMER") > 0.3,
      headline: "TROPPO CONSUMER",
      question: [
        "\"Vediamo molta esposizione consumer.",
        "Non era questo il nostro accordo iniziale.\"",
        "",
        "\"Possiamo capire la rationale?\""
      ],
      choices: [
        { label: "Opportunità ciclica, ribilanceremo",
          effects: { lpSat: { family: +6 }, reputation: 0 } },
        { label: "Il consumer è dove sta lo scale",
          effects: { lpSat: { family: -12, sovereign: +2 } } },
        { label: "Faremo una nota strategica per il prossimo IC",
          effects: { lpSat: { family: +4 } } }
      ]
    }
  ];

  function pickCallsForYear(state) {
    // Triggera tutte le call valide non ancora gestite quest'anno.
    if (!state.usedLPCalls) state.usedLPCalls = [];
    const candidates = CALLS.filter(c =>
      !state.usedLPCalls.includes(c.id) && c.trigger(state)
    );
    return candidates.slice(0, 2); // max 2 per anno per non sommergere
  }

  global.TVLPCalls = { CALLS, pickCallsForYear };
})(window);
