/* Pagina 700 — Report finale a fine partita.
   Mostra metriche, titolo ironico, e permette salvataggio in leaderboard. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s) { TVRouter.goto(100, { skipLoading: true }); return; }
    // il report esiste solo a partita conclusa
    if (!s.gameOver) {
      TVRouter.flash("LA PARTITA NON E' FINITA");
      TVRouter.goto(s.gameStarted ? 200 : 100, { skipLoading: true });
      return;
    }

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
    lines.push(" " + r.color("c-yellow", "Deployment: ") +
      r.color(m.deploymentRate >= 0.8 ? "c-green" : "c-magenta",
        Math.round(m.deploymentRate * 100) + "% di 90M"));
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
    lines.push(r.color("c-yellow", " 2 POST-MORTEM DEL FONDO"));
    lines.push(r.color("c-yellow", " 9 NUOVA PARTITA"));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 800 CLASSIFICA   100 HOME   900 CREDITI"));

    r.show(pageNum, lines.join("\n"), { title: "REPORT FINALE" });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        const fund = s.fundName || prompt("Nome del fondo:") || "Anonymous Capital";
        const nick = s.nickname || prompt("Nickname GP:") || "GP";
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
      } else if (num === 2) {
        TVRouter.goto(701);
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

  /* ---------- Pagina 701 — Post-mortem del fondo ----------
     Il momento didattico: cosa è andato bene, cosa male, cosa
     il Televideo aveva detto e il GP non ha letto. */
  function positionOutcome(p) {
    // multiplo complessivo della posizione (realizzato o attuale)
    if (p.status === "exited" || p.status === "writeoff") {
      return p.investedAmount > 0 ? (p.realizedAmount || 0) / p.investedAmount : 0;
    }
    return p.currentValueMultiplier;
  }

  function findMissedOpportunity(s) {
    // startup passate che avevano una exit positiva scriptata
    const passedIds = [];
    Object.values(s.dealDecisions || {}).forEach(yearMap => {
      Object.keys(yearMap).forEach(id => {
        if (yearMap[id] === "passed") passedIds.push(id);
      });
    });
    let best = null;
    passedIds.forEach(id => {
      const ev = (TVExits.EXIT_EVENTS || []).find(e =>
        e.startupId === id && (e.kind === "exit" || e.kind === "ipo"));
      if (ev && (!best || ev.premium > best.ev.premium)) {
        best = { startup: TVStartups.byId(id), ev: ev };
      }
    });
    return best;
  }

  function findIgnoredNews(s) {
    // la news con il signal più pesante, mai letta, che ha colpito
    // un settore in cui il fondo era investito
    const heldRoots = new Set(s.portfolio.map(p => (p.sectorTag || "").split("_")[0]));
    let worst = null;
    TVNews.NEWS.forEach(n => {
      if (!n.signal) return;
      if (!heldRoots.has(n.signal.sector)) return;
      if ((s.readPages || []).includes(n.page)) return;
      if (!worst || Math.abs(n.signal.delta) > Math.abs(worst.signal.delta)) worst = n;
    });
    return worst;
  }

  function renderPostMortem(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameOver) {
      TVRouter.goto(s && s.gameStarted ? 200 : 100, { skipLoading: true });
      return;
    }

    const positions = s.portfolio.slice();
    positions.sort((a, b) => positionOutcome(b) - positionOutcome(a));
    const best = positions[0];
    const worstPos = positions[positions.length - 1];
    const missed = findMissedOpportunity(s);
    const ignored = findIgnoredNews(s);
    const newsRead = (s.readPages || []).length;
    const exitCount = positions.filter(p => p.status === "exited").length;

    const lines = [];
    lines.push(r.bg("bg-magenta", "  " + r.pad("POST-MORTEM DEL FONDO", 38)));
    lines.push("");
    if (best) {
      lines.push(r.color("c-yellow", " MIGLIOR INVESTIMENTO"));
      lines.push(" " + r.color("c-green", best.name + "  " + positionOutcome(best).toFixed(2) + "x"));
    }
    if (worstPos && worstPos !== best) {
      lines.push(r.color("c-yellow", " PEGGIOR INVESTIMENTO"));
      lines.push(" " + r.color("c-red", worstPos.name + "  " + positionOutcome(worstPos).toFixed(2) + "x"));
    }
    if (missed) {
      lines.push(r.color("c-yellow", " OCCASIONE PERSA"));
      lines.push(" " + r.color("c-magenta", missed.startup.name +
                 " — uscita bene all'anno " + missed.ev.year));
    }
    if (ignored) {
      lines.push(r.color("c-yellow", " IL TELEVIDEO TE LO AVEVA DETTO"));
      lines.push(" " + r.color("c-cyan", "pag " + ignored.page + ": " + ignored.headline.slice(0, 34)));
      lines.push(" " + r.color("c-white", "non l'hai mai aperta."));
    }
    lines.push("");
    lines.push(r.color("c-yellow", " NUMERI DELLA GESTIONE"));
    lines.push(" " + r.color("c-white", "news lette:        " + newsRead));
    lines.push(" " + r.color("c-white", "speso in ricerca:  " + r.eur(s.researchSpent || 0)));
    lines.push(" " + r.color("c-white", "exit realizzate:   " + exitCount));
    lines.push(" " + r.color("c-white", "cash mai investito: " + r.eur(s.cash)));
    lines.push(" " + r.color("c-white", "deployment finale: " +
      Math.round(TVFundMath.deployment(s).rate * 100) + "%"));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 700 REPORT    800 CLASSIFICA    100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "POST-MORTEM" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[700] = { render };
  P[701] = { render: renderPostMortem };
})(window);
