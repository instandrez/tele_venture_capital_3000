/* Interni 910-941 - fonti private delle catene investigative.
   Si sbloccano incrociando almeno due firme diverse nel Taccuino. */
(function (global) {

  function currentDeal(state, startup) {
    return TVDealflow.currentYearDealflow(state).some(st => st.id === startup.id);
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    const st = TVIntel.sourceStartupByPage(pageNum);
    if (!s || !s.gameStarted || !st || !currentDeal(s, st)) {
      TVRouter.goto(190, { skipLoading: true });
      return;
    }

    const chain = TVIntel.chainFor(s, st);
    if (!chain.unlocked) {
      const denied = [
        r.bg("bg-red", "  " + r.pad("INTERNO RISERVATO " + pageNum, r.COLS - 2)),
        "",
        "",
        r.center(r.color("c-red", "ACCESSO NEGATO")),
        "",
        r.center(r.color("c-white", "la fonte non risponde a una sola voce.")),
        r.center(r.color("c-yellow", "incrocia due firme diverse nel Taccuino.")),
      ];
      while (denied.length < 20) denied.push("");
      denied.push(r.color("c-white", " 190 TACCUINO    110 NEWS    100 HOME"));
      r.show(pageNum, denied.join("\n"), { title: "FONTE RISERVATA" });
      return;
    }

    const lines = [];
    lines.push(r.bg(chain.contacted ? "bg-green" : "bg-magenta",
      "  " + r.pad("INTERNO " + pageNum + " - LINEA NON REGISTRATA", r.COLS - 2)));
    lines.push("");
    lines.push(" " + r.color("c-yellow", "CASO: ") + r.color("c-white", st.name));
    lines.push(" " + r.color("c-yellow", "FONTE: ") + r.color("c-cyan", chain.source));
    lines.push(r.color("c-blue", " " + "-".repeat(r.COLS - 2)));
    lines.push("");

    if (!chain.contacted) {
      lines.push(" " + r.color("c-white", "\"Non posso parlare a lungo.\""));
      lines.push(" " + r.color("c-white", "\"E non voglio comparire in una slide.\""));
      lines.push("");
      lines.push(" " + r.color("c-magenta", "La linea resta aperta. Per ora."));
      while (lines.length < 18) lines.push("");
      lines.push(r.color("c-yellow", " 1 ASCOLTA LA FONTE"));
      lines.push(r.color("c-white", " 190 TACCUINO    200 DEALFLOW"));
    } else {
      lines.push(" " + r.color("c-green", "FONTE VERIFICATA"));
      lines.push("");
      lines.push(" " + r.color("c-white", "\"" + chain.clue + ".\""));
      lines.push("");
      lines.push(" " + r.color("c-cyan", "EFFETTI SUL CASO"));
      lines.push(" " + r.color("c-green", "+1 copertura battle"));
      lines.push(" " + r.color("c-green", "Dossier Strike potenziato"));
      lines.push(" " + r.color("c-green", "DD 25k + negoziazione migliorata"));
      while (lines.length < 18) lines.push("");
      lines.push(r.color("c-yellow", " 301-303 TORNA AL CASO"));
      lines.push(r.color("c-white", " 190 TACCUINO    200 DEALFLOW"));
    }

    r.show(pageNum, lines.join("\n"), { title: "FONTE RISERVATA" });
    TVRouter.setActionHandler(num => {
      if (num !== 1 || chain.contacted) return;
      TVIntel.contactSource(s, st);
      TVState.save();
      TVAudio.success();
      TVRouter.flash("FONTE VERIFICATA");
      render(pageNum);
    });
  }

  const P = global.TVPages = global.TVPages || {};
  TVStartups.STARTUPS.forEach((st, index) => {
    P[910 + index] = { render };
  });
})(window);
