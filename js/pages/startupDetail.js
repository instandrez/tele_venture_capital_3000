/* Pagine 301-303 — Scheda startup.

   REGOLE:
   - Ogni startup dell'anno è pending / invested / passed (TVDealflow).
     Una volta deliberata, la scheda diventa di sola consultazione.
   - La valuation negoziata incide sul ritorno: pagare il 20% in meno
     significa partire con un multiplo iniziale di 1.25x (val/negoziata).
   - EDGE INFORMATIVO: se il giocatore ha letto almeno una news di
     settore rilevante dell'anno (readPages), la DD costa la metà e
     rivela SIA il rischio SIA l'upside. Il Televideo ripaga chi legge.
   - DD e negoziazione usano TVState.roll(): esiti deterministici per
     partita, niente save-scumming. */
(function (global) {

  function reveals(state, id) {
    if (!state.startupReveals) state.startupReveals = {};
    if (!state.startupReveals[id]) state.startupReveals[id] = {};
    return state.startupReveals[id];
  }

  function fmtScore(n) { return n + "/10"; }

  function rootOf(st) { return (st.sectorTag || "").split("_")[0]; }

  // Il giocatore ha letto una news di quest'anno il cui signal riguarda
  // il settore della startup? Allora il suo team "ha il dossier".
  function hasSectorDossier(state, st) {
    const root = rootOf(st);
    if (!root || root === "UNKNOWN") return false;
    return TVNews.NEWS.some(n =>
      n.year === state.year &&
      n.signal && n.signal.sector === root &&
      (state.readPages || []).includes(n.page)
    );
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    const id = (s._dealflowMap || {})[pageNum];
    const st = id ? TVStartups.byId(id) : null;
    if (!st) {
      TVRouter.goto(200, { skipLoading: true });
      return;
    }
    const rv = reveals(s, id);
    const decision = TVDealflow.getDecision(s, id);
    const dossier = hasSectorDossier(s, st);

    const lines = [];
    lines.push(r.bg("bg-yellow", "  " + r.pad(st.name + " — " + st.stage, 38)));
    lines.push(" " + r.color("c-cyan", st.sector) +
               r.color("c-white", "   val. " + r.eur(rv.negotiatedValuation || st.valuation)) +
               (rv.negotiatedValuation ? r.color("c-green", " (-20%)") : ""));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    lines.push(" " +
      r.color("c-white", "Team " + fmtScore(st.team)) + "  " +
      r.color("c-white", "Tract " + fmtScore(st.traction)) + "  " +
      r.color("c-white", "Hype " + fmtScore(st.hype)) + "  " +
      r.color("c-white", "Fit " + fmtScore(st.strategicFit))
    );

    if (dossier) {
      lines.push(" " + r.color("c-green", "» dossier settore: news incrociate"));
    }

    // reveal area
    const revealLines = [];
    if (rv.dd) {
      (rv.ddTexts || [rv.ddText]).filter(Boolean).forEach(t =>
        revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "DD: " + t)));
    }
    if (rv.refCall)  revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Founder: " + revealFounder(st)));
    if (rv.coInvest) revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Co-invest: " + revealCoInvest(st)));
    if (rv.sector)   revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Settore: " + revealSector(st)));
    if (revealLines.length) {
      lines.push("");
      revealLines.forEach(l => lines.push(l));
    }

    lines.push("");

    if (decision !== "pending") {
      // sola consultazione: la decisione è presa
      const badge = decision === "invested"
        ? r.color("c-green", "HAI INVESTITO IN QUESTA STARTUP")
        : r.color("c-magenta", "HAI PASSATO QUESTO DEAL");
      lines.push(r.bg("bg-blue", "  DECISIONE PRESA                       "));
      lines.push(" " + badge);
      if (decision === "invested") {
        const pos = s.portfolio.find(p => p.id === id);
        if (pos) {
          lines.push(" " + r.color("c-white", "ticket " + r.eur(pos.investedAmount) +
                     "  multiplo " + pos.currentValueMultiplier.toFixed(2) + "x"));
        }
      }
      while (lines.length < 21) lines.push("");
      lines.push(r.color("c-white", " 0 TORNA AL DEALFLOW    200 DEALFLOW"));
      r.show(pageNum, lines.join("\n"), { title: "STARTUP" });
      TVRouter.setActionHandler(num => {
        if (num === 0) TVRouter.goto(200, { skipLoading: true });
      });
      return;
    }

    const ddCost = dossier ? 50_000 : 100_000;
    lines.push(r.bg("bg-magenta", "  AZIONI                                "));
    lines.push(" " + r.color("c-yellow", "1") + " investi 1M€      " +
               r.color("c-yellow", "4") + " DD tecnica  -" + (ddCost / 1000) + "k");
    lines.push(" " + r.color("c-yellow", "2") + " investi 3M€      " +
               r.color("c-yellow", "5") + " ref. call    -50k");
    lines.push(" " + r.color("c-yellow", "3") + " investi 5M€      " +
               r.color("c-yellow", "6") + " trend settore  -");
    lines.push(" " + r.color("c-yellow", "7") + " negozia valuation");
    lines.push(" " + r.color("c-yellow", "8") + " co-invest sig.  -30k");
    lines.push(" " + r.color("c-yellow", "9") + " passa            " +
               r.color("c-yellow", "0") + " torna dealflow");

    while (lines.length < 21) lines.push("");
    lines.push(" " +
      r.color("c-green", "Cash " + r.eur(s.cash)) + "  " +
      r.color("c-white", "Reput " + s.reputation + "  Inn " + s.innovationImpact));

    r.show(pageNum, lines.join("\n"), { title: "STARTUP" });

    TVRouter.setActionHandler(num => handleAction(num, st, pageNum));
  }

  // ----- helpers reveal -----
  function revealFounder(st) {
    const map = {
      grit:        "grit, esecuzione solida",
      competent:   "competente, lucido",
      hustle:      "hustler, vendita forte",
      ego:         "ego pronunciato",
      red_flag:    "red flag: gestione problematica",
      first_time:  "first-time founder, in apprendimento"
    };
    return map[st.founderProfile] || "profilo non chiaro";
  }
  function revealCoInvest(st) {
    if (["AI_FOUNDATION", "ROBOTICS_FRONTIER"].includes(st.sectorTag))
      return "due top fund già dentro";
    if (["BATTERY_INDUSTRIAL", "SPACE_DUAL_USE"].includes(st.sectorTag))
      return "lead industriale già committed";
    if (st.founderProfile === "red_flag") return "ex-investor sta uscendo";
    return "round senza lead, in costruzione";
  }
  function revealSector(st) {
    const root = rootOf(st);
    let mom = 0;
    TVNews.NEWS.filter(n => n.year <= TVState.current.year && n.signal && n.signal.sector === root)
      .forEach(n => { mom += n.signal.delta; });
    if (mom > 10)  return "settore caldo (signal +" + mom + ")";
    if (mom > 0)   return "settore positivo (+" + mom + ")";
    if (mom < -10) return "settore sotto pressione (" + mom + ")";
    if (mom < 0)   return "settore debole (" + mom + ")";
    return "settore in equilibrio";
  }

  // ----- handle action -----
  function handleAction(num, st, pageNum) {
    const s = TVState.current;
    const rv = reveals(s, st.id);
    const dossier = hasSectorDossier(s, st);

    function flashAndRefresh(msg, errSound) {
      if (errSound) TVAudio.error(); else TVAudio.success();
      TVRouter.flash(msg);
      setTimeout(() => render(pageNum), 100);
    }

    function tryInvest(amount) {
      if (s.cash < amount) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
      const baseVal = st.valuation;
      const payVal = rv.negotiatedValuation || baseVal;
      s.cash -= amount;
      s.invested += amount;
      const pos = {
        id: st.id,
        name: st.name,
        sector: st.sector,
        sectorTag: st.sectorTag,
        investedAmount: amount,
        entryValuation: payVal,
        equityPct: amount / payVal,
        entryYear: s.year,
        // lo sconto negoziato parte come vantaggio reale sul multiplo:
        // stessa quota pagata meno = multiplo iniziale > 1
        currentValueMultiplier: baseVal / payVal,
        status: "active",
        realizedAmount: 0,
        revealed: Object.assign({}, rv)
      };
      s.portfolio.push(pos);
      TVDealflow.setDecision(s, st.id, "invested");
      s.history.push({ year: s.year, type: "invest", startup: st.name, amount: amount });
      TVState.save();
      TVAudio.success();
      TVRouter.flash("INVESTITO " + TVRender.eur(amount));
      setTimeout(() => TVRouter.goto(200, { skipLoading: true }), 400);
    }

    switch (num) {
      case 1: tryInvest(1_000_000); break;
      case 2: tryInvest(3_000_000); break;
      case 3: tryInvest(5_000_000); break;
      case 4: {
        if (rv.dd) { flashAndRefresh("DD GIA' FATTA", true); return; }
        const cost = dossier ? 50_000 : 100_000;
        if (s.cash < cost) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
        s.cash -= cost;
        s.researchSpent += cost;
        rv.dd = true;
        if (dossier) {
          // chi ha letto le news ottiene il quadro completo
          rv.ddTexts = ["rischio - " + st.hiddenRisk,
                        "upside + " + st.hiddenUpside];
        } else {
          const showRisk = TVState.roll("dd|" + st.id + "|" + s.year) < 0.5;
          rv.ddTexts = [showRisk
            ? "rischio - " + st.hiddenRisk
            : "upside + " + st.hiddenUpside];
        }
        TVState.save();
        flashAndRefresh(dossier ? "DD COMPLETA (DOSSIER)" : "DD COMPLETATA");
        break;
      }
      case 5: {
        if (rv.refCall) { flashAndRefresh("REF. CALL FATTA", true); return; }
        if (s.cash < 50_000) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
        s.cash -= 50_000;
        s.researchSpent += 50_000;
        rv.refCall = true;
        TVState.save();
        flashAndRefresh("REF. CALL OK");
        break;
      }
      case 6: {
        if (rv.sector) { flashAndRefresh("GIA' CONSULTATO", true); return; }
        rv.sector = true;
        TVState.save();
        flashAndRefresh("TREND CONSULTATO");
        break;
      }
      case 7: {
        if (rv.negotiated) { flashAndRefresh("NEGOZIATA", true); return; }
        let prob = rv.dd ? 0.7 : 0.4;
        if (dossier) prob += 0.1;
        const ok = TVState.roll("nego|" + st.id + "|" + s.year) < prob;
        rv.negotiated = true;
        if (ok) {
          rv.negotiatedValuation = Math.round(st.valuation * 0.8);
          flashAndRefresh("VAL. -20% OK");
        } else {
          s.reputation = Math.max(0, s.reputation - 3);
          flashAndRefresh("RIFIUTATA -3 REP", true);
        }
        TVState.save();
        break;
      }
      case 8: {
        if (rv.coInvest) { flashAndRefresh("GIA' VERIFICATO", true); return; }
        if (s.cash < 30_000) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
        s.cash -= 30_000;
        s.researchSpent += 30_000;
        rv.coInvest = true;
        TVState.save();
        flashAndRefresh("SIGNAL OTTENUTO");
        break;
      }
      case 9: {
        TVDealflow.setDecision(s, st.id, "passed");
        s.history.push({ year: s.year, type: "pass", startup: st.name });
        TVState.save();
        TVAudio.pageChange();
        TVRouter.goto(200, { skipLoading: true });
        break;
      }
      case 0:
        TVRouter.goto(200, { skipLoading: true });
        break;
    }
  }

  const P = global.TVPages = global.TVPages || {};
  P[301] = { render };
  P[302] = { render };
  P[303] = { render };
})(window);
