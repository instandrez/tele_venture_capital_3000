/* Eventi di liquidità scriptati, allineati al calendario news.
   Se il giocatore ha in portfolio la startup nell'anno indicato,
   l'evento si applica a fine anno durante la chiusura automatica.

   MODELLO: proceeds = investedAmount × currentValueMultiplier × premium
   Il multiplo accumulato (news, baseline, negoziazione) resta quindi
   determinante: la stessa exit ripaga di più chi è entrato bene.

   kind:
   - "exit"      premium 1.3-1.6  (acquisizione/secondary a markup)
   - "ipo"       premium ~1.5     (quotazione)
   - "acquihire" premium ~0.5     (salvataggio del team)
   - "writeoff"  premium 0-0.15   (azzeramento, talvolta asset sale)
   - "writedown" factor           (nessuna exit: taglio secco del multiplo)

   Le news corrispondenti sono già nel calendario: chi legge la
   Cronaca sa in anticipo chi esce bene e chi muore. */
(function (global) {

  const EXIT_EVENTS = [
    // ---- ANNO 2 ----
    { startupId: "yachtbrain", year: 2, kind: "writeoff", premium: 0.15,
      note: "post-uscita founder: asset sale ai concorrenti" },

    // ---- ANNO 3 ----
    { startupId: "crookedtoken", year: 3, kind: "writeoff", premium: 0,
      note: "tassa crypto + terzo pivot: liquidazione" },
    { startupId: "foundergpt", year: 3, kind: "acquihire", premium: 0.5,
      note: "team assorbito da un incumbent productivity" },
    { startupId: "spinall", year: 3, kind: "writeoff", premium: 0.25,
      note: "stretta gig economy: vendita distressed" },

    // ---- ANNO 4 ----
    { startupId: "fortresslab", year: 4, kind: "exit", premium: 1.5,
      note: "acquisita nella consolidation wave cyber" },
    { startupId: "dovesofwar", year: 4, kind: "exit", premium: 1.4,
      note: "secondary dopo il tender governativo" },
    { startupId: "exgoogler", year: 4, kind: "acquihire", premium: 0.5,
      note: "acqui-hire: il prodotto non sarà integrato" },
    { startupId: "pivotking", year: 4, kind: "writeoff", premium: 0,
      note: "il quarto pivot non è arrivato in tempo" },

    // ---- ANNO 5 ----
    { startupId: "neuronote", year: 5, kind: "exit", premium: 1.5,
      note: "acquisita da incumbent legaltech a 10x ARR" },
    { startupId: "starvista", year: 5, kind: "ipo", premium: 1.5,
      note: "IPO oversubscribed 3.4x" },
    { startupId: "agiordie", year: 5, kind: "writeoff", premium: 0,
      note: "\"avevamo ragione\": write-off totale" },
    { startupId: "invoicequick", year: 5, kind: "exit", premium: 1.4,
      note: "acquisita nella wave enterprise software" },
    { startupId: "humanoidops", year: 5, kind: "exit", premium: 1.3,
      note: "acquisizione del team e dei brevetti" },
    { startupId: "stealthmode", year: 5, kind: "writedown", factor: 0.02,
      note: "rivelato: condivisione calendari. Val. 800M → 14M" }
    // SaltCore resta in portfolio: grande markup ma non realizzata.
    // MOIC alto, DPI zero — un classico.
  ];

  function forYear(startupId, year) {
    return EXIT_EVENTS.find(e => e.startupId === startupId && e.year === year) || null;
  }

  global.TVExits = { EXIT_EVENTS, forYear };
})(window);
