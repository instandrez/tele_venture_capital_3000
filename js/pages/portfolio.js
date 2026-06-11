/* Pagina 400 — Portfolio.
   Mostra le posizioni attive con valore corrente (calcolato dal motore
   in modo semplificato per Sprint 3; Sprint 4 ricalcola con news engine). */
(function (global) {

  function portfolioValue(state) {
    return state.portfolio
      .filter(p => !p.status || p.status === "active")
      .reduce((sum, p) => sum + p.investedAmount * p.currentValueMultiplier, 0);
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("PORTFOLIO — ANNO " + s.year, 38)));
    lines.push("");

    const active = s.portfolio.filter(p => !p.status || p.status === "active");
    const closed = s.portfolio.filter(p => p.status && p.status !== "active");

    if (s.portfolio.length === 0) {
      lines.push("");
      lines.push(r.center(r.color("c-white", "nessun investimento ancora.")));
      lines.push(r.center(r.color("c-magenta", "vai in 200 DEALFLOW.")));
    } else {
      if (active.length > 0) {
        lines.push(" " + r.color("c-yellow",
          r.pad("ATTIVE", 18) + r.pad("INV.", 8) + r.pad("VAL.", 8) + "MoM"));
        lines.push(r.color("c-blue", " " + "─".repeat(38)));
        active.forEach(p => {
          const curVal = p.investedAmount * p.currentValueMultiplier;
          const mom = p.currentValueMultiplier.toFixed(2) + "x";
          const cls = p.currentValueMultiplier >= 1 ? "c-green" : "c-red";
          lines.push(" " +
            r.color("c-white", r.pad(p.name.slice(0, 17), 18)) +
            r.color("c-cyan",  r.pad(r.eur(p.investedAmount), 8)) +
            r.color(cls,       r.pad(r.eur(curVal), 8)) +
            r.color(cls,       mom));
        });
      }
      if (closed.length > 0) {
        lines.push("");
        lines.push(" " + r.color("c-yellow",
          r.pad("CHIUSE", 18) + r.pad("INV.", 8) + r.pad("REAL.", 8) + "ESITO"));
        lines.push(r.color("c-blue", " " + "─".repeat(38)));
        closed.forEach(p => {
          const isWin = (p.realizedAmount || 0) >= p.investedAmount;
          const cls = p.status === "writeoff" ? "c-red" : (isWin ? "c-green" : "c-magenta");
          const esito = p.status === "writeoff" ? "W/OFF" :
                        (p.exitKind === "ipo" ? "IPO" :
                         p.exitKind === "acquihire" ? "ACQ-H" : "EXIT");
          lines.push(" " +
            r.color("c-white", r.pad(p.name.slice(0, 17), 18)) +
            r.color("c-cyan",  r.pad(r.eur(p.investedAmount), 8)) +
            r.color(cls,       r.pad(r.eur(p.realizedAmount || 0), 8)) +
            r.color(cls,       esito));
        });
      }
    }

    const totalCurrentValue = portfolioValue(s);
    const moic = s.invested > 0 ? ((totalCurrentValue + s.realized) / s.invested) : 0;
    const dpi  = s.invested > 0 ? (s.realized / s.invested) : 0;

    const alert = r.lpAlert(s);
    if (alert) lines.push(alert);

    while (lines.length < 17) lines.push("");
    lines.push(r.color("c-blue", " " + "─".repeat(38)));
    lines.push(" " +
      r.color("c-yellow", "Val: ") + r.color("c-green", r.eur(totalCurrentValue)) + " " +
      r.color("c-yellow", "Real: ") + r.color("c-green", r.eur(s.realized)) + " " +
      r.color("c-yellow", "MOIC ") + r.color("c-white", moic.toFixed(2)) + " " +
      r.color("c-yellow", "DPI ") + r.color("c-white", dpi.toFixed(2))
    );
    lines.push(r.color("c-white", " 200 DEALFLOW    500 IC MOMENT    100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "PORTFOLIO" });
  }

  global.TVPortfolio = { portfolioValue };

  const P = global.TVPages = global.TVPages || {};
  P[400] = { render };
})(window);
