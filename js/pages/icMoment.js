/* Pagina 500 — Investment Committee / Chiusura Anno.

   - Accessibile solo a dealflow interamente deliberato.
   - Applica (una sola volta per anno) gli effetti del marketEngine:
     rivalutazioni guidate dalle news + eventi di liquidità scriptati.
   - Le LP call rimaste senza risposta penalizzano il rispettivo LP.
   - Mostra QUALI news hanno mosso ogni posizione: il giocatore impara
     a collegare ciò che ha letto (o ignorato) ai risultati. */
(function (global) {

  function applyYearEnd(state) {
    const result = TVMarket.runYearEnd(state);

    // LP call ignorate: il telefono che squilla a vuoto ha un costo
    const ignored = [];
    try {
      TVLPCalls.pickCallsForYear(state).forEach(call => {
        state.lpSat[call.lp] = Math.max(0, (state.lpSat[call.lp] || 50) - 6);
        state.usedLPCalls.push(call.id);
        state.history.push({ year: state.year, type: "lp_ignored", lp: call.lp, call: call.id });
        ignored.push(call.lp);
      });
    } catch (e) {}

    return { events: result.events, exits: result.exits, ignoredLPs: ignored };
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    // gate: niente IC con deal ancora da deliberare
    if (!s.icCache) s.icCache = {};
    const key = "y" + s.year;
    if (!s.icCache[key] && TVDealflow.pendingDeals(s).length > 0) {
      TVRouter.flash("PRIMA DELIBERA IL DEALFLOW");
      TVRouter.goto(200, { skipLoading: true });
      return;
    }

    if (!s.icCache[key]) {
      s.icCache[key] = applyYearEnd(s);
      TVState.save();
    }
    const ic = s.icCache[key];

    const lines = [];
    lines.push(r.bg("bg-red", "  " + r.pad("CHIUSURA ANNO " + s.year + " — IC MOMENT", 38)));

    // exit ed eventi di liquidità (la parte più importante)
    if (ic.exits && ic.exits.length > 0) {
      lines.push(r.color("c-yellow", " EVENTI DI LIQUIDITA':"));
      ic.exits.forEach(e => {
        const kindLabel = { exit: "EXIT", ipo: "IPO", acquihire: "ACQ-HIRE",
                            writeoff: "WRITE-OFF", writedown: "WRITEDOWN" }[e.kind] || e.kind;
        const cls = (e.kind === "exit" || e.kind === "ipo") ? "c-green" :
                    (e.kind === "acquihire") ? "c-yellow" : "c-red";
        lines.push(" " + r.color(cls, r.pad(kindLabel, 10)) +
                   r.color("c-white", r.pad(e.startup.slice(0, 16), 17)) +
                   r.color(cls, e.proceeds > 0 ? "+" + r.eur(e.proceeds) : "0€"));
        if (e.note) lines.push("   " + r.color("c-cyan", e.note.slice(0, 36)));
      });
      lines.push("");
    }

    // rivalutazioni con trigger (trasparenza del motore)
    const moved = (ic.events || []).filter(e => Math.abs(e.pct) > 0.02);
    if (moved.length > 0) {
      lines.push(r.color("c-yellow", " RIVALUTAZIONI:"));
      moved.slice(0, 6).forEach(e => {
        const cls = e.pct >= 0 ? "c-green" : "c-red";
        const sign = e.pct >= 0 ? "+" : "";
        lines.push(" " +
          r.color("c-white", r.pad(e.startup.slice(0, 16), 17)) +
          r.color(cls, r.pad(sign + Math.round(e.pct * 100) + "%", 6)) +
          r.color("c-white", e.before.toFixed(2) + "→" + e.after.toFixed(2) + "x"));
        if (e.intel && e.intel.length) {
          const clue = e.intel[0];
          lines.push("   " + r.color(clue.read ? "c-green" : "c-red",
            (clue.read ? "[LETTA " : "[IGNORATA ") + clue.page + "] ") +
            r.color("c-cyan", clue.headline.slice(0, 24)));
        } else if (e.triggers && e.triggers.length) {
          lines.push("   " + r.color("c-cyan", "» " + e.triggers[0].slice(0, 34)));
        }
      });
    } else if ((!ic.exits || !ic.exits.length)) {
      lines.push(r.color("c-white", " nessuna posizione in portfolio."));
    }

    if (ic.ignoredLPs && ic.ignoredLPs.length > 0) {
      lines.push("");
      lines.push(" " + r.color("c-red", "LP ignorati al telefono: -6 sat (" +
                 ic.ignoredLPs.join(", ") + ")"));
    }

    while (lines.length < 19) lines.push("");
    if (s.year >= s.maxYear) {
      lines.push(r.color("c-yellow", " 1 GENERA REPORT FINALE"));
    } else {
      lines.push(r.color("c-yellow", " 1 AVANZA ALL'ANNO " + (s.year + 1)));
    }
    lines.push(r.color("c-white", " 400 PORTFOLIO    100 HOME"));

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
