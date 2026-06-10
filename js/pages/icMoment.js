/* Pagina 500 — Investment Committee / Chiusura Anno.
   Sprint 3: scheletro funzionale.
   - Applica un calcolo semplificato dei moltiplicatori in base
     a sector momentum delle news pubblicate.
   - Avanza l'anno.
   Sprint 4 sostituirà la logica con il marketEngine + materializzazione
   eventi previsti (regulation, founder_risk, corporate_opp).
*/
(function (global) {

  function applyYearEnd(state) {
    // Delega al marketEngine: applica signal granulari + baseline.
    return TVMarket.runYearEnd(state);
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    // applica chiusura anno una sola volta per anno
    if (!s.icCache) s.icCache = {};
    const key = "y" + s.year;
    if (!s.icCache[key]) {
      const events = applyYearEnd(s);
      s.icCache[key] = events;
      TVState.save();
    }
    const events = s.icCache[key];

    const lines = [];
    lines.push(r.bg("bg-red", "  " + r.pad("CHIUSURA ANNO " + s.year + " — IC MOMENT", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " Le news di quest'anno si materializzano:"));
    lines.push("");

    if (events.length === 0) {
      lines.push(r.color("c-white", " nessuna posizione in portfolio."));
    } else {
      events.slice(0, 12).forEach(e => {
        const cls = e.pct >= 0 ? "c-green" : "c-red";
        const sign = e.pct >= 0 ? "+" : "";
        lines.push(" " +
          r.color("c-white", r.pad(e.startup.slice(0, 16), 17)) +
          r.color(cls, r.pad(sign + Math.round(e.pct * 100) + "%", 6)) +
          r.color("c-white", e.before.toFixed(2) + " → " + e.after.toFixed(2) + "x"));
      });
    }

    // segnala LP call pendenti
    let pendingLPCount = 0;
    try {
      pendingLPCount = TVLPCalls.pickCallsForYear(s).length;
    } catch (e) {}
    if (pendingLPCount > 0) {
      lines.push("");
      lines.push(" " + r.color("c-red", '<span class="blink">[!]</span>') + " " +
                 r.color("c-yellow", pendingLPCount + " LP call pendenti — 600"));
    }

    while (lines.length < 19) lines.push("");
    if (s.year >= s.maxYear) {
      lines.push(r.color("c-yellow", " 1 GENERA REPORT FINALE"));
    } else {
      lines.push(r.color("c-yellow", " 1 AVANZA ALL'ANNO " + (s.year + 1)));
    }
    lines.push(r.color("c-white", " 400 PORTFOLIO    600 LP CALL    100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "IC MOMENT" });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        if (s.year >= s.maxYear) {
          s.gameOver = true;
          TVState.save();
          TVRouter.goto(700);
        } else {
          s.year += 1;
          TVState.save();
          TVRouter.goto(200);
        }
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[500] = { render };
})(window);
