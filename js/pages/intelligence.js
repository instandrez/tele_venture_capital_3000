/* Pagina 190 - Taccuino investigativo.
   Registra soltanto le connessioni gia' scoperte. Non dice al giocatore
   dove cercare: propone domande e teorie da verificare navigando. */
(function (global) {

  function meter(r, intel) {
    const filled = Math.min(5, Math.floor(intel.evidenceScore));
    return r.color(intel.level >= 2 ? "c-green" : (filled ? "c-yellow" : "c-red"),
      "[" + "#".repeat(filled) + ".".repeat(5 - filled) + "] " + intel.label);
  }

  function clippingLine(intel) {
    if (!intel.read.length) return "RITAGLI: nessuno";
    const pages = intel.read.slice(0, 3).map(x =>
      "p" + x.news.page + " " + x.kind + (x.weight >= 2 ? "*" : "")
    );
    return "RITAGLI: " + pages.join(" + ");
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }

    const deals = TVDealflow.currentYearDealflow(s);
    s._dealflowMap = {};
    deals.forEach((st, i) => { s._dealflowMap[301 + i] = st.id; });
    const lines = [];
    lines.push(r.bg("bg-yellow", "  " + r.pad("TACCUINO DEL GP - ANNO " + s.year, r.COLS - 2)));
    lines.push(" " + r.color("c-white", "COME FUNZIONA: leggi il Televideo. Le pagine utili"));
    lines.push(" " + r.color("c-white", "diventano RITAGLI qui dentro, ma non dicono per quale caso."));
    lines.push(" " + r.color("c-yellow", "Le fonti dirette (*) valgono 2, il contesto vale meno."));
    lines.push(" " + r.color("c-green", "3 punti = TEORIA") +
      r.color("c-white", " (domanda armata + DD scontata)"));
    lines.push(r.color("c-blue", " " + "-".repeat(r.COLS - 2)));

    deals.forEach((st, i) => {
      const intel = TVIntel.forStartup(s, st);
      lines.push(" " + r.color("c-yellow", String(301 + i)) + " " +
        r.color("c-white", r.pad(st.name.slice(0, 23), 24)) + meter(r, intel));
      lines.push("   " + r.color("c-magenta", "? ") +
        r.color("c-white", intel.question));
      lines.push("   " + r.color("c-cyan", clippingLine(intel)) + "   " +
        r.color(intel.level >= 2 ? "c-green" : "c-yellow",
          "IPOTESI: " + intel.theory));
      if (intel.chain.contacted) {
        lines.push("   " + r.color("c-green", "FONTE " + intel.chain.page +
          " VERIFICATA: " + intel.privateClue.slice(0, 29)));
      } else if (intel.chain.unlocked) {
        lines.push("   " + r.color("c-magenta", "CATENA APERTA: INTERNO " +
          intel.chain.page + " - NAVIGA E ASCOLTA"));
      } else {
        lines.push("   " + (intel.lead
          ? r.color("c-green", "LEVA " + intel.lead.move + " " + intel.lead.label +
            ": " + intel.lead.reason)
          : r.color("c-white", intel.sidekick)));
      }
    });

    lines.push(r.bg("bg-blue", "  REGOLA D'UFFICIO: NON FIDARTI DELLA SLIDE 12"));
    lines.push(" " + r.color("c-white", "MARTA e' la tua analista. Non e' assicurata."));
    lines.push(r.color("c-white", " 110 NEWS   190 TACCUINO   200 DEALFLOW   400 PORTFOLIO"));

    r.show(pageNum, lines.join("\n"), { title: "TACCUINO DEL GP" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[190] = { render };
})(window);
