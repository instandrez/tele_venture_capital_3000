/* Pagina 200 — Dealflow.
   Mostra le 3 startup dell'anno e lo stato fondo (cash, invested,
   portfolio). Nessuna info "spoiler" sulle startup: solo nome,
   settore, stage, valuation. I dettagli si vedono sulla scheda 3XX. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      // partita non avviata → reindirizza
      TVRouter.goto(101, { skipLoading: true });
      return;
    }

    const picks = TVDealflow.currentYearDealflow(s);

    const lines = [];
    lines.push(r.bg("bg-green", "  " + r.pad("DEALFLOW — ANNO " + s.year + "/" + s.maxYear, 38)));
    lines.push(" " +
      r.color("c-yellow", "Cash:") + " " + r.color("c-green", r.eur(s.cash)) +
      "   " +
      r.color("c-yellow", "Inv:") + "  " + r.color("c-cyan", r.eur(s.invested)) +
      "   " +
      r.color("c-yellow", "N:") + " " + r.color("c-white", String(s.portfolio.length))
    );
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    if (picks.length === 0) {
      lines.push("");
      lines.push(" " + r.color("c-magenta", "nessun deal disponibile quest'anno."));
      lines.push(" " + r.color("c-white", "premi 9 per chiudere l'anno."));
    } else {
      picks.forEach((st, i) => {
        const pageId = 300 + i + 1; // 301, 302, 303
        lines.push(" " + r.color("c-yellow", String(pageId)) + " " +
                   r.color("c-white", r.pad(st.name, 22)));
        lines.push("     " + r.color("c-cyan", st.sector) + r.color("c-white", "  " + st.stage));
        lines.push("     " + r.color("c-white", "val. " + r.eur(st.valuation)));
        lines.push("");
      });
      // memorizza mapping per pagina dettaglio
      s._dealflowMap = {};
      picks.forEach((st, i) => { s._dealflowMap[301 + i] = st.id; });
    }

    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 9 CHIUDI ANNO     100 HOME"));
    lines.push(r.color("c-white", " 110 ULTIM'ORA  140 BORSA  160 CRONACA"));

    r.show(pageNum, lines.join("\n"), { title: "DEALFLOW" });

    TVRouter.setActionHandler(num => {
      if (num === 9) {
        // chiusura anno → IC moment (Sprint 4 lo implementa pienamente)
        TVRouter.goto(500);
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[200] = { render };
})(window);
