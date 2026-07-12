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

    r.showScene(pageNum, reportSceneHtml(s, m, title), {
      title: "REPORT FINALE",
      className: "endgame-cinematic",
      directAction: true
    });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        saveWithNames(s, m, title);
      } else if (num === 2) {
        TVRouter.goto(701);
      } else if (num === 3) {
        copyShareCard(s, m, title);
      } else if (num === 9) {
        TVState.clear();
        TVState.newGame({ runMode: s.runMode || "quick" });
        TVRouter.goto(100);
      }
    });
    return;

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
    lines.push(r.bg("bg-blue", "  SHARE CARD                            "));
    lines.push(" " + r.color("c-white", shareText(s, m, title).slice(0, 52)));
    lines.push("");
    lines.push(r.color("c-yellow", " 1 SALVA IN CLASSIFICA"));
    lines.push(r.color("c-yellow", " 2 POST-MORTEM DEL FONDO"));
    lines.push(r.color("c-yellow", " 3 COPIA SHARE CARD"));
    lines.push(r.color("c-yellow", " 9 NUOVA PARTITA"));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 800 CLASSIFICA   100 HOME   900 CREDITI"));

    r.show(pageNum, lines.join("\n"), { title: "REPORT FINALE" });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        saveWithNames(s, m, title);
      } else if (num === 2) {
        TVRouter.goto(701);
      } else if (num === 3) {
        copyShareCard(s, m, title);
      } else if (num === 9) {
        TVState.clear();
        TVState.newGame({ runMode: s.runMode || "quick" });
        TVRouter.goto(100);
      }
    });
  }

  function shareText(s, m, title) {
    const fund = s.fundName || "Anonymous Capital";
    const mode = s.runMode === "partner" ? "Partner Mode" : "Quick Run";
    return "VC3000 // " + fund + " // " + title +
      " // Score " + m.score + "/100 // MOIC " + m.moic.toFixed(2) +
      "x // DPI " + m.dpi.toFixed(2) + "x // " + mode;
  }

  function esc(value) {
    return TVRender.escape(value);
  }

  function money(value) {
    const sign = value < 0 ? "-" : "";
    const abs = Math.abs(value || 0);
    if (abs >= 1_000_000) {
      const millions = abs / 1_000_000;
      return sign + millions.toFixed(abs % 1_000_000 === 0 ? 0 : 1) + "M";
    }
    if (abs >= 1_000) return sign + Math.round(abs / 1_000) + "k";
    return sign + String(abs);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function scoreClass(score) {
    if (score >= 75) return "legend";
    if (score >= 55) return "alive";
    if (score >= 35) return "messy";
    return "wrecked";
  }

  function scoreLabel(score) {
    if (score >= 75) return "CARRY UNLOCKED";
    if (score >= 55) return "IC APPROVED";
    if (score >= 35) return "MEMO DIFENDIBILE";
    return "WRITE-OFF CORE";
  }

  function metricCard(label, value, sub, tone) {
    return '<div class="end-metric ' + (tone || "") + '">' +
      '<span>' + esc(label) + '</span><b>' + esc(value) + '</b><em>' + esc(sub || "") + '</em></div>';
  }

  function meter(label, value, tone) {
    const pct = clamp(Math.round(value || 0), 0, 100);
    return '<div class="end-meter ' + (tone || "") + '"><span>' + esc(label) +
      '</span><b>' + pct + '</b><i><em style="width:' + pct + '%"></em></i></div>';
  }

  function topPositions(state, limit) {
    return (state.portfolio || []).slice().sort((a, b) =>
      positionOutcome(b) - positionOutcome(a)
    ).slice(0, limit || 3);
  }

  function reportSceneHtml(s, m, title) {
    const fund = s.fundName || "Anonymous Capital";
    const nick = s.nickname || "GP";
    const mode = s.runMode === "partner" ? "PARTNER MODE" : "QUICK RUN";
    const deployment = Math.round((m.deploymentRate || 0) * 100);
    const lpAvg = Math.round(m.lpSatAvg || 0);
    const cls = scoreClass(m.score);
    const positions = topPositions(s, 3);
    const holdings = positions.length ? positions.map((p, i) =>
      '<div class="end-holding"><span>#' + (i + 1) + '</span><b>' + esc(p.name) +
      '</b><em>' + positionOutcome(p).toFixed(2) + 'x</em></div>'
    ).join("") : '<div class="end-holding is-empty"><b>NO HOLDINGS</b><em>deck only</em></div>';
    const quote = shareText(s, m, title);
    return (
      '<section class="console-scene endgame-scene is-' + cls + '">' +
        '<div class="end-bg" aria-hidden="true"></div>' +
        '<div class="end-grid" aria-hidden="true"></div>' +
        '<div class="end-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
        '<div class="end-poster">' +
          '<header class="end-header">' +
            '<span>VC3000 FUND CLOSE</span><b>' + esc(mode) + '</b><em>SEASON 1</em>' +
          '</header>' +
          '<div class="end-score-block">' +
            '<div class="end-score-label">' + esc(scoreLabel(m.score)) + '</div>' +
            '<div class="end-score">' + esc(String(m.score).padStart(2, "0")) + '<span>/100</span></div>' +
            '<div class="end-title">"' + esc(title) + '"</div>' +
          '</div>' +
          '<div class="end-fund-card">' +
            '<span>FUND</span><b>' + esc(fund) + '</b><em>GP ' + esc(nick) + '</em>' +
          '</div>' +
          '<div class="end-metrics">' +
            metricCard("MOIC", m.moic.toFixed(2) + "x", "paper + cash", m.moic >= 1 ? "up" : "down") +
            metricCard("DPI", m.dpi.toFixed(2) + "x", "cash back", m.dpi >= 0.5 ? "up" : "") +
            metricCard("INVESTED", money(s.invested), "dry powder deployed", deployment >= 80 ? "up" : "warn") +
            metricCard("REALIZED", money(s.realized), "distribuzioni", s.realized > 0 ? "up" : "") +
          '</div>' +
          '<div class="end-bars">' +
            meter("DEPLOYMENT", deployment, deployment >= 80 ? "up" : "warn") +
            meter("LP AVG", lpAvg, lpAvg >= 60 ? "up" : (lpAvg < 40 ? "down" : "")) +
            meter("REPUTATION", s.reputation || 0, (s.reputation || 0) >= 60 ? "up" : "") +
            meter("IMPACT", s.innovationImpact || 0, (s.innovationImpact || 0) >= 60 ? "up" : "") +
          '</div>' +
          '<section class="end-holdings"><h2>TOP HOLDINGS</h2>' + holdings + '</section>' +
          '<div class="end-share"><span>SHARE CARD</span><p>' + esc(quote) + '</p></div>' +
          '<div class="end-actions">' +
            '<button type="button" data-action="1"><b>1</b>SALVA</button>' +
            '<button type="button" data-action="2"><b>2</b>POST-MORTEM</button>' +
            '<button type="button" data-action="3"><b>3</b>COPIA</button>' +
            '<button type="button" data-action="9"><b>9</b>NUOVA RUN</button>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  function saveEntry(s, m, title, fund, nick) {
    saveToLeaderboard({
      fundName: (fund || "Anonymous Capital").slice(0, 20),
      nickname: (nick || "GP").slice(0, 14),
      score: m.score,
      moic: m.moic,
      dpi: m.dpi,
      title: title,
      runMode: s.runMode || "quick",
      date: new Date().toISOString().slice(0, 10)
    });
    TVRouter.flash("SALVATO IN CLASSIFICA");
    setTimeout(() => TVRouter.goto(800), 400);
  }

  function saveWithNames(s, m, title) {
    if (s.fundName && s.nickname) {
      saveEntry(s, m, title, s.fundName, s.nickname);
      return;
    }
    TVRender.askText({
      title: "CLASSIFICA",
      message: "Nome del fondo da mostrare nella classifica locale.",
      label: "FONDO",
      value: s.fundName || "Anonymous Capital",
      maxLength: 24
    }).then(fund => {
      if (fund == null) return;
      TVRender.askText({
        title: "CLASSIFICA",
        message: "Nickname del GP. Evita nomi veri se vuoi restare nel personaggio.",
        label: "GP",
        value: s.nickname || "GP",
        maxLength: 16
      }).then(nick => {
        if (nick == null) return;
        s.fundName = String(fund || "Anonymous Capital").slice(0, 24);
        s.nickname = String(nick || "GP").slice(0, 16);
        TVState.save();
        saveEntry(s, m, title, s.fundName, s.nickname);
      });
    });
  }

  function copyShareCard(s, m, title) {
    const text = shareText(s, m, title);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        TVRouter.flash("SHARE CARD COPIATA");
      }).catch(() => showShareModal(text));
    } else {
      showShareModal(text);
    }
  }

  function showShareModal(text) {
    TVRender.askText({
      title: "SHARE CARD",
      message: "Testo pronto da incollare dove vuoi.",
      label: "COPY",
      value: text,
      multiline: true,
      readonly: true,
      confirmLabel: "CHIUDI"
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

  function debriefRow(label, value, tone) {
    return '<div class="debrief-row ' + (tone || "") + '"><span>' + esc(label) +
      '</span><b>' + esc(value || "-") + '</b></div>';
  }

  function postMortemSceneHtml(s, data) {
    const best = data.best;
    const worst = data.worst;
    const missed = data.missed;
    const ignored = data.ignored;
    const bestText = best ? best.name + " // " + positionOutcome(best).toFixed(2) + "x" : "nessun deal";
    const worstText = worst ? worst.name + " // " + positionOutcome(worst).toFixed(2) + "x" : "nessun disastro";
    const missedText = missed ? missed.startup.name + " // exit anno " + missed.ev.year : "nessuna exit mancata";
    const ignoredText = ignored ? "P." + ignored.page + " // " + ignored.headline : "hai letto abbastanza, miracolo";
    return (
      '<section class="console-scene debrief-scene">' +
        '<div class="end-bg" aria-hidden="true"></div>' +
        '<div class="end-grid" aria-hidden="true"></div>' +
        '<div class="debrief-panel">' +
          '<header class="end-header"><span>VC3000 DEBRIEF</span><b>POST-MORTEM</b><em>NO REFUND</em></header>' +
          '<h1>IL TELETEXT AVEVA LE PROVE</h1>' +
          '<p class="debrief-sub">Il fondo e\' chiuso. Ora resta la parte piu\' VC: spiegare perche\' era tutto intenzionale.</p>' +
          '<div class="debrief-grid">' +
            debriefRow("MIGLIOR COLPO", bestText, "up") +
            debriefRow("PEGGIOR MEMO", worstText, "down") +
            debriefRow("OCCASIONE PERSA", missedText, missed ? "warn" : "") +
            debriefRow("NEWS IGNORATA", ignoredText, ignored ? "warn" : "up") +
          '</div>' +
          '<div class="debrief-stats">' +
            metricCard("NEWS LETTE", String(data.newsRead), "pagine aperte", data.newsRead >= 6 ? "up" : "warn") +
            metricCard("RICERCA", money(s.researchSpent || 0), "DD/ref/costi", "") +
            metricCard("EXIT", String(data.exitCount), "realizzate", data.exitCount ? "up" : "") +
            metricCard("CASH LEFT", money(s.cash), "non investito", "") +
          '</div>' +
          '<div class="end-actions">' +
            '<button type="button" data-action="1"><b>1</b>REPORT</button>' +
            '<button type="button" data-action="2"><b>2</b>CLASSIFICA</button>' +
            '<button type="button" data-action="0"><b>0</b>HOME</button>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
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

    r.showScene(pageNum, postMortemSceneHtml(s, {
      best: best,
      worst: worstPos,
      missed: missed,
      ignored: ignored,
      newsRead: newsRead,
      exitCount: exitCount
    }), {
      title: "POST-MORTEM",
      className: "endgame-cinematic postmortem-cinematic",
      directAction: true
    });
    TVRouter.setActionHandler(num => {
      if (num === 1) TVRouter.goto(700);
      else if (num === 2) TVRouter.goto(800);
      else if (num === 0) TVRouter.goto(100);
    });
    return;

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
