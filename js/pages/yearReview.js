/* Pagina 460 - Portfolio update di fine anno. */
(function (global) {

  function wrapText(text, width) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const out = [];
    let cur = "";
    words.forEach(word => {
      const next = cur ? cur + " " + word : word;
      if (next.length > width && cur) {
        out.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    });
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }

  function statusLine(r, event) {
    const before = event.before || 0;
    const after = event.after || 0;
    const delta = after - before;
    const cls = delta >= 0 ? "c-green" : "c-red";
    return " " + r.color("c-yellow", r.pad(event.startup, 18)) +
      r.color(cls, before.toFixed(2) + "x -> " + after.toFixed(2) + "x");
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }
    const outcome = s.lastYearOutcome;
    if (!outcome || !outcome.result) {
      TVRouter.goto(s.gameOver ? 700 : 100, { skipLoading: true });
      return;
    }

    const result = outcome.result;
    const metrics = TVScoring.computeMetrics(s);
    const width = r.COLS - 2;
    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("PORTFOLIO UPDATE - ANNO " + outcome.closedYear, width)));
    lines.push("");
    lines.push(" " + r.color("c-yellow", "NAV: ") +
      r.color("c-white", "il mercato ha marcato il tuo portfolio."));
    lines.push(" " + r.color("c-white", "Portfolio " + r.eur(metrics.portfolioValue) +
      " // Realizzato " + r.eur(s.realized) +
      " // MOIC " + metrics.moic.toFixed(2) + "x"));
    lines.push(r.color("c-blue", " " + "-".repeat(width)));

    if (result.events && result.events.length) {
      lines.push(" " + r.color("c-yellow", "RIVALUTAZIONI"));
      result.events.slice(0, 6).forEach(ev => {
        lines.push(statusLine(r, ev));
        const trigger = ev.triggers && ev.triggers[0];
        if (trigger) {
          const prefix = /^FONTE:|^CATALYST:|^FONDAMENTALI:|^OPERATING:/.test(trigger)
            ? ""
            : "news: ";
          wrapText(prefix + trigger, 48).slice(0, 1).forEach(line => {
            lines.push("   " + r.color("c-cyan", line));
          });
        }
      });
    } else {
      lines.push(" " + r.color("c-magenta", "Nessuna posizione attiva da rivalutare."));
    }

    if (result.exits && result.exits.length) {
      lines.push("");
      lines.push(" " + r.color("c-yellow", "EVENTI DI LIQUIDITA"));
      result.exits.slice(0, 3).forEach(ev => {
        lines.push(" " + r.color("c-green", ev.startup + " // " + ev.kind) +
          r.color("c-white", ev.proceeds ? " // " + r.eur(ev.proceeds) : ""));
      });
    }

    if (result.ignoredLPs && result.ignoredLPs.length) {
      lines.push("");
      lines.push(" " + r.color("c-red", "LP ignorati: " + result.ignoredLPs.join(", ")));
    }

    while (lines.length < 21) lines.push("");
    if (outcome.final) {
      lines.push(r.color("c-white", " 1 REPORT FINALE    400 PORTFOLIO"));
    } else {
      lines.push(r.color("c-white", " 1 ANNO " + outcome.nextYear + " / HOME    400 PORTFOLIO"));
    }
    r.show(pageNum, lines.join("\n"), { title: "PORTFOLIO UPDATE", directAction: true });

    TVRouter.setActionHandler(num => {
      if (num === 1) TVRouter.goto(outcome.final ? 700 : 100, { skipLoading: true });
      else if (num === 4) TVRouter.goto(400, { skipLoading: true });
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[460] = { render };
})(window);
