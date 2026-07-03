/* Pagina 200 - Dealflow.
   Mostra le startup dell'anno con lo stato della decisione:
   pending (da deliberare), invested, passed. */
(function (global) {

  let confirmCloseArmed = false;

  function statusBadge(r, decision) {
    switch (decision) {
      case "invested": return r.color("c-green", "[INVESTITO]");
      case "passed":   return r.color("c-magenta", "[PASSATO]");
      default:          return r.color("c-yellow", "[DA DECIDERE]");
    }
  }

  function routeAfterDealflow(s) {
    const incident = global.TVPortfolioIncidents &&
      TVPortfolioIncidents.activeIncident(s);
    if (incident) {
      TVRouter.flash("PORTFOLIO COMPANY IN LINEA");
      TVRouter.goto(620, { skipLoading: true });
      return;
    }
    TVRouter.goto(450, { skipLoading: true });
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
    if (pending.length === 0) {
      TVRouter.flash("ANNO DELIBERATO");
      routeAfterDealflow(s);
      return;
    }

    const deployment = TVFundMath.deployment(s);
    const theme = TVDealflow.yearTheme ? TVDealflow.yearTheme(s.year) : null;
    const width = r.COLS - 2;
    const lines = [];

    lines.push(r.bg("bg-green", "  " + r.pad("DEALFLOW - ANNO " + s.year + "/" + s.maxYear, width)));
    if (theme) {
      lines.push(" " + r.color("c-cyan", "FOCUS " + theme.title) +
                 r.color("c-white", " // " + theme.focus));
      lines.push(" " + r.color("c-yellow", "MEMO: ") +
                 r.color("c-white", theme.memo));
    }
    lines.push(" " +
      r.color("c-yellow", "Cash:") + " " + r.color("c-green", r.eur(s.cash)) +
      "   " +
      r.color("c-yellow", "Inv:") + "  " + r.color("c-cyan", r.eur(s.invested)) +
      "   " +
      r.color("c-yellow", "Target:") + " " +
      r.color(deployment.gap > 0 ? "c-magenta" : "c-green", r.eur(deployment.target))
    );
    lines.push(r.color("c-blue", " " + "-".repeat(width)));

    if (picks.length === 0) {
      lines.push("");
      lines.push(" " + r.color("c-magenta", "nessun deal disponibile quest'anno."));
      lines.push(" " + r.color("c-white", "premi 9 per chiudere l'anno."));
    } else {
      s._dealflowMap = {};
      picks.forEach((st, i) => {
        const pageId = 301 + i;
        s._dealflowMap[pageId] = st.id;
        const decision = TVDealflow.getDecision(s, st.id);
        const intel = TVIntel.forStartup(s, st);
        const intelCls = intel.level >= 2 ? "c-green" : (intel.level ? "c-yellow" : "c-red");
        const chainTag = intel.chain.contacted
          ? " FONTE OK"
          : (intel.chain.unlocked ? " INT." + intel.chain.page : "");
        lines.push(" " + r.color("c-yellow", String(pageId)) + " " +
          r.color("c-white", r.pad(st.name, 19)) +
          statusBadge(r, decision) + " " +
          r.color("c-cyan", st.stage));
        lines.push("     " + r.color("c-cyan", st.sector.slice(0, 20)) +
          r.color("c-white", "  val. " + r.eur(st.valuation) + "  ") +
          r.color(intelCls,
            "TACCUINO " + intel.label +
            (intel.lead ? " LEVA " + intel.lead.move : "") + chainTag));
      });
    }

    lines.push(" " + r.color("c-yellow", pending.length + " deal da deliberare") +
               r.color("c-white", " prima della chiusura auto"));

    const alert = r.lpAlert(s);
    if (alert) lines.push(alert);
    const portfolioAlert = r.portfolioAlert && r.portfolioAlert(s);
    if (portfolioAlert) lines.push(portfolioAlert);

    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 9 PASSA RESTANTI     100 HOME"));
    lines.push(r.color("c-white", " 190 TACCUINO   110 NEWS   400 PORTFOLIO"));

    r.show(pageNum, lines.join("\n"), { title: "DEALFLOW" });

    TVRouter.setActionHandler(num => {
      if (num !== 9) return;
      const stillPending = TVDealflow.pendingDeals(s);
      if (stillPending.length === 0) {
        routeAfterDealflow(s);
        return;
      }
      if (!confirmCloseArmed) {
        confirmCloseArmed = true;
        TVAudio.error();
        TVRouter.flash(stillPending.length + " DEAL PENDENTI - 9 PASSA TUTTI");
        return;
      }
      stillPending.forEach(st => TVDealflow.setDecision(s, st.id, "passed"));
      TVState.save();
      routeAfterDealflow(s);
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[200] = { render };
})(window);
