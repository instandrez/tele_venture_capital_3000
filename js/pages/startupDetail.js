/* Pagine 301-303 — Scheda startup.
   8 azioni a costo variabile + investimento. I reveal sono persistiti
   sullo stato in state.startupReveals[id]. */
(function (global) {

  function reveals(state, id) {
    if (!state.startupReveals) state.startupReveals = {};
    if (!state.startupReveals[id]) state.startupReveals[id] = {};
    return state.startupReveals[id];
  }

  function fmtScore(n) {
    return n + "/10";
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    const id = (s._dealflowMap || {})[pageNum];
    const st = id ? TVStartups.byId(id) : null;
    if (!st) {
      // pagina non valida → torna al dealflow
      TVRouter.goto(200, { skipLoading: true });
      return;
    }
    const rv = reveals(s, id);

    const lines = [];
    lines.push(r.bg("bg-yellow", "  " + r.pad(st.name + " — " + st.stage, 38)));
    lines.push(" " + r.color("c-cyan", st.sector) +
               r.color("c-white", "   val. " + r.eur(st.valuation)));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    lines.push(" " +
      r.color("c-white", "Team " + fmtScore(st.team)) + "  " +
      r.color("c-white", "Tract " + fmtScore(st.traction)) + "  " +
      r.color("c-white", "Hype " + fmtScore(st.hype)) + "  " +
      r.color("c-white", "Fit " + fmtScore(st.strategicFit))
    );

    // reveal area (compatta)
    const revealLines = [];
    if (rv.dd)         revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "DD: " + (rv.ddText || "")));
    if (rv.refCall)    revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Founder: " + revealFounder(st)));
    if (rv.coInvest)   revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Co-invest: " + revealCoInvest(st)));
    if (rv.sector)     revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "Settore: " + revealSector(st)));

    if (revealLines.length) {
      lines.push("");
      revealLines.forEach(l => lines.push(l));
    }

    lines.push("");
    lines.push(r.bg("bg-magenta", "  AZIONI                                "));
    lines.push(" " + r.color("c-yellow", "1") + " investi 1M€      " +
               r.color("c-yellow", "4") + " DD tecnica  -100k");
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
    const root = (st.sectorTag || "").split("_")[0];
    // legge momentum delle news pubblicate
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

    function flashAndRefresh(msg, errSound) {
      if (errSound) TVAudio.error(); else TVAudio.success();
      TVRouter.flash(msg);
      setTimeout(() => render(pageNum), 100);
    }

    function tryInvest(amount) {
      if (s.cash < amount) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
      // negotiated valuation se applicato
      const val = rv.negotiatedValuation || st.valuation;
      const equityPct = amount / val;
      s.cash -= amount;
      s.invested += amount;
      const pos = {
        id: st.id,
        name: st.name,
        sector: st.sector,
        sectorTag: st.sectorTag,
        investedAmount: amount,
        entryValuation: val,
        equityPct: equityPct,
        entryYear: s.year,
        currentValueMultiplier: 1.0,
        revealed: Object.assign({}, rv)
      };
      s.portfolio.push(pos);
      s._dealflowMap = s._dealflowMap || {};
      // rimuovi dal dealflow map così il dealflow si rigenera senza lei
      Object.keys(s._dealflowMap).forEach(k => {
        if (s._dealflowMap[k] === st.id) delete s._dealflowMap[k];
      });
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
        if (s.cash < 100_000) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
        s.cash -= 100_000;
        rv.dd = true;
        rv.ddText = Math.random() < 0.5 ?
          ("rischio - " + st.hiddenRisk) :
          ("upside + " + st.hiddenUpside);
        TVState.save();
        flashAndRefresh("DD COMPLETATA");
        break;
      }
      case 5: {
        if (rv.refCall) { flashAndRefresh("REF. CALL FATTA", true); return; }
        if (s.cash < 50_000) { flashAndRefresh("CASH INSUFFICIENTE", true); return; }
        s.cash -= 50_000;
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
        const successProb = rv.dd ? 0.7 : 0.4;
        const ok = Math.random() < successProb;
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
        rv.coInvest = true;
        TVState.save();
        flashAndRefresh("SIGNAL OTTENUTO");
        break;
      }
      case 9: {
        // passa: rimuovi dal dealflow map
        s._dealflowMap = s._dealflowMap || {};
        Object.keys(s._dealflowMap).forEach(k => {
          if (s._dealflowMap[k] === st.id) delete s._dealflowMap[k];
        });
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
