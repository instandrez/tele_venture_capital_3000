/* Pagina 200 — Dealflow.
   Mostra le 3 startup dell'anno con lo stato della decisione:
   pending (da deliberare), invested, passed.
   L'anno si chiude solo quando tutto è deliberato, oppure con
   doppia conferma (le startup rimaste vengono passate d'ufficio). */
(function (global) {

  let confirmCloseArmed = false; // transiente, si resetta a ogni render

  function statusBadge(r, decision) {
    switch (decision) {
      case "invested": return r.color("c-green", "[INVESTITO]");
      case "passed":   return r.color("c-magenta", "[PASSATO]");
      default:          return r.color("c-yellow", "[DA DECIDERE]");
    }
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }
    confirmCloseArmed = false;

    const picks = TVDealflow.currentYearDealflow(s);
    const pending = TVDealflow.pendingDeals(s);

    const lines = [];
    lines.push(r.bg("bg-green", "  " + r.pad("DEALFLOW — ANNO " + s.year + "/" + s.maxYear, 38)));
    lines.push(" " +
      r.color("c-yellow", "Cash:") + " " + r.color("c-green", r.eur(s.cash)) +
      "   " +
      r.color("c-yellow", "Inv:") + "  " + r.color("c-cyan", r.eur(s.invested)) +
      "   " +
      r.color("c-yellow", "N:") + " " + r.color("c-white", String(s.portfolio.filter(p => !p.status || p.status === "active").length))
    );
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    if (picks.length === 0) {
      lines.push("");
      lines.push(" " + r.color("c-magenta", "nessun deal disponibile quest'anno."));
      lines.push(" " + r.color("c-white", "premi 9 per chiudere l'anno."));
    } else {
      // mapping stabile per indice: 301, 302, 303 (anche per i deliberati,
      // così la scheda resta consultabile in sola lettura)
      s._dealflowMap = {};
      picks.forEach((st, i) => {
        const pageId = 301 + i;
        s._dealflowMap[pageId] = st.id;
        const decision = TVDealflow.getDecision(s, st.id);
        const teaser = TVPitches.forStartup(st.id);
        lines.push(" " + r.color("c-yellow", String(pageId)) + " " +
                   r.color("c-white", r.pad(st.name, 20)) + statusBadge(r, decision));
        lines.push("     " + r.color("c-cyan", st.sector) + r.color("c-white", "  " + st.stage) +
                   r.color("c-white", "  val. " + r.eur(st.valuation)));
        if (teaser && teaser[0]) {
          lines.push("     " + r.color("c-cyan", "» ") + r.color("c-white", teaser[0]));
        }
        lines.push("");
      });
    }

    if (pending.length > 0) {
      lines.push(" " + r.color("c-yellow", pending.length + " deal da deliberare") +
                 r.color("c-white", " prima di chiudere l'anno"));
    } else {
      lines.push(" " + r.color("c-green", "tutto deliberato — puoi chiudere l'anno"));
    }

    const alert = r.lpAlert(s);
    if (alert) lines.push(alert);

    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 9 CHIUDI ANNO     100 HOME"));
    lines.push(r.color("c-white", " 110 ULTIM'ORA  140 BORSA  160 CRONACA"));

    r.show(pageNum, lines.join("\n"), { title: "DEALFLOW" });

    TVRouter.setActionHandler(num => {
      if (num !== 9) return;
      const stillPending = TVDealflow.pendingDeals(s);
      if (stillPending.length === 0) {
        // LP al telefono? chiudere l'anno senza rispondere costa caro:
        // chiedi conferma esplicita (ignorare resta una scelta legittima)
        let lpPending = [];
        try { lpPending = TVLPCalls.pickCallsForYear(s); } catch (e) {}
        if (lpPending.length > 0 && !confirmCloseArmed) {
          confirmCloseArmed = true;
          TVAudio.error();
          TVRouter.flash("LP IN LINEA (600) - 9 PER IGNORARLI");
          return;
        }
        // la chiusura passa per il follow-on (450): se non ci sono
        // offerte, la pagina reindirizza da sola all'IC (500)
        TVRouter.goto(450);
        return;
      }
      if (!confirmCloseArmed) {
        confirmCloseArmed = true;
        TVAudio.error();
        TVRouter.flash(stillPending.length + " DEAL PENDENTI - 9 PER CONFERMARE");
        return;
      }
      // conferma: i deal rimasti vengono passati d'ufficio
      stillPending.forEach(st => TVDealflow.setDecision(s, st.id, "passed"));
      TVState.save();
      TVRouter.goto(450);
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[200] = { render };
})(window);
