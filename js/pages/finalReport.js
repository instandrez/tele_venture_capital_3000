/* Pagina 700 — Report finale a fine partita.
   Mostra metriche, titolo ironico, e permette salvataggio in leaderboard. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s) { TVRouter.goto(100, { skipLoading: true }); return; }

    const m = TVScoring.computeMetrics(s);
    const title = TVTitles.pickTitle(m);

    const lines = [];
    lines.push(r.bg("bg-red", "  " + r.pad("REPORT FINALE — FINE PARTITA", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", r.center("TITOLO ASSEGNATO")));
    lines.push(r.color("c-magenta", r.center("« " + title + " »")));
    lines.push("");
    lines.push(r.color("c-blue", " " + "─".repeat(38)));
    lines.push(" " + r.color("c-yellow", "Investito:  ") + r.color("c-white", r.eur(s.invested)));
    lines.push(" " + r.color("c-yellow", "Portfolio:  ") + r.color("c-green", r.eur(m.portfolioValue)));
    lines.push(" " + r.color("c-yellow", "Realizzato: ") + r.color("c-green", r.eur(s.realized)));
    lines.push(" " + r.color("c-yellow", "MOIC: ") + r.color("c-cyan", m.moic.toFixed(2) + "x") +
               "    " + r.color("c-yellow", "DPI: ") + r.color("c-cyan", m.dpi.toFixed(2) + "x"));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));
    lines.push(" " + r.color("c-yellow", "LP SAT  ") +
               r.color("c-white", "Pen ") + s.lpSat.pensione +
               r.color("c-white", " Fam ") + s.lpSat.family +
               r.color("c-white", " Sov ") + s.lpSat.sovereign +
               r.color("c-white", " End ") + s.lpSat.endowment);
    lines.push(" " + r.color("c-yellow", "Reputation: ") + r.color("c-white", s.reputation) +
               "   " + r.color("c-yellow", "Impact: ") + r.color("c-white", s.innovationImpact));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));
    lines.push(" " + r.color("c-yellow", r.pad("SCORE FINALE", 16)) +
               r.color("c-green", String(m.score) + " / 100"));
    lines.push("");
    lines.push(r.color("c-yellow", " 1 SALVA IN CLASSIFICA"));
    lines.push(r.color("c-yellow", " 9 NUOVA PARTITA"));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 800 CLASSIFICA   100 HOME   900 CREDITI"));

    r.show(pageNum, lines.join("\n"), { title: "REPORT FINALE" });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        const fund = prompt("Nome del fondo:") || "Anonymous Capital";
        const nick = prompt("Nickname GP:") || "GP";
        saveToLeaderboard({
          fundName: fund.slice(0, 20),
          nickname: nick.slice(0, 14),
          score: m.score,
          moic: m.moic,
          dpi: m.dpi,
          title: title,
          date: new Date().toISOString().slice(0, 10)
        });
        TVRouter.flash("SALVATO IN CLASSIFICA");
        setTimeout(() => TVRouter.goto(800), 400);
      } else if (num === 9) {
        TVState.clear();
        TVState.newGame();
        TVRouter.goto(100);
      }
    });
  }

  function saveToLeaderboard(entry) {
    let lb = [];
    try { lb = JSON.parse(localStorage.getItem("tvc3000.leaderboard") || "[]"); } catch (e) {}
    lb.push(entry);
    lb.sort((a, b) => b.score - a.score);
    lb = lb.slice(0, 50);
    try { localStorage.setItem("tvc3000.leaderboard", JSON.stringify(lb)); } catch (e) {}
  }

  const P = global.TVPages = global.TVPages || {};
  P[700] = { render };
})(window);
