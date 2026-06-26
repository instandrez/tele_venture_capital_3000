/* Pagine 301-303 — Startup.

   FLUSSO: se il deal è ancora pendente, entrare nella pagina fa
   partire direttamente la PITCH BATTLE (vedi pitchLive.js): la
   trattativa È la battaglia, e tutte le azioni (DD, ref call,
   negoziazione, investimento, passa) vivono lì dentro.

   Se il deal è già deliberato (invested/passed), la pagina mostra
   la scheda di sola consultazione con tutto ciò che hai scoperto. */
(function (global) {

  function reveals(state, id) {
    if (!state.startupReveals) state.startupReveals = {};
    if (!state.startupReveals[id]) state.startupReveals[id] = {};
    return state.startupReveals[id];
  }

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

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    const fallbackDeal = TVDealflow.currentYearDealflow(s)[pageNum - 301];
    const id = (s._dealflowMap || {})[pageNum] || (fallbackDeal && fallbackDeal.id);
    const st = id ? TVStartups.byId(id) : null;
    if (!st) {
      TVRouter.goto(200, { skipLoading: true });
      return;
    }
    const decision = TVDealflow.getDecision(s, id);

    // deal pendente → si combatte
    if (decision === "pending") {
      TVPitchLive.start(st, pageNum);
      return;
    }

    // deal deliberato → scheda di sola consultazione
    const rv = reveals(s, id);
    const intel = TVIntel.forStartup(s, st);
    const lines = [];
    lines.push(r.bg("bg-yellow", "  " + r.pad(st.name + " — " + st.stage, 38)));
    lines.push(" " + r.color("c-cyan", st.sector) +
               r.color("c-white", "   val. " + r.eur(rv.negotiatedValuation || st.valuation)) +
               (rv.negotiatedValuation ? r.color("c-green", " (-20%)") : ""));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    const pitch = TVPitches.forStartup(st.id);
    if (pitch) pitch.forEach(line => lines.push(" " + r.color("c-white", line)));

    // tutto ciò che hai scoperto durante la battaglia
    const revealLines = [];
    if (rv.dd) {
      (rv.ddTexts || []).filter(Boolean).forEach(t =>
        revealLines.push(r.color("c-yellow", " ! ") + r.color("c-white", "DD: " + t.slice(0, 33))));
    }
    if (rv.refCall) {
      revealLines.push(r.color("c-yellow", " ! ") +
        r.color("c-white", "Founder: " + TVPitchBattle.founderLabel(st.founderProfile)));
    }
    if (rv.coInvest) {
      revealLines.push(r.color("c-yellow", " ! ") +
        r.color("c-white", "Co-invest: " + TVPitchBattle.coInvestSignal(st)));
    }
    if (rv.meetingNotes && rv.meetingNotes.length) {
      rv.meetingNotes.forEach(note => {
        wrapText("Meeting: " + note.text, 38).forEach((line, idx) => {
          revealLines.push(r.color("c-yellow", idx ? "   " : " ! ") +
            r.color("c-white", line));
        });
      });
    }
    if (rv.pitchTruth) {
      revealLines.push(r.color("c-yellow", " ! ") + r.color("c-green", "Pitch: " + rv.pitchTruth));
    } else if (rv.pitchLost) {
      revealLines.push(r.color("c-yellow", " ! ") + r.color("c-red", "Pitch: ti hanno buttato fuori."));
    }
    if (intel.privateClue) {
      revealLines.push(r.color("c-yellow", " ! ") +
        r.color("c-magenta", "Fonte: " + intel.privateClue.slice(0, 32)));
    }
    if (revealLines.length) {
      lines.push("");
      revealLines.forEach(l => lines.push(l));
    }
    if (intel.read.length) {
      lines.push("");
      lines.push(r.color("c-cyan", " DOSSIER: ") +
        r.color(intel.level >= 2 ? "c-green" : "c-yellow",
          intel.label + " - " + intel.evidenceScore.toFixed(1) + "/5"));
      if (intel.lead) {
        lines.push(" " + r.color("c-green", "Leva usata: " + intel.lead.label +
          " (" + intel.lead.reason + ")"));
      }
    }

    lines.push("");
    const badge = decision === "invested"
      ? r.color("c-green", "HAI INVESTITO IN QUESTA STARTUP")
      : r.color("c-magenta", "HAI PASSATO QUESTO DEAL");
    lines.push(r.bg("bg-blue", "  DECISIONE PRESA                       "));
    lines.push(" " + badge);
    if (decision === "invested") {
      const pos = s.portfolio.find(p => p.id === id);
      if (pos) {
        lines.push(" " + r.color("c-white", "ticket " + r.eur(pos.investedAmount) +
                   "  quota " + (pos.equityPct * 100).toFixed(1) + "%" +
                   "  multiplo " + pos.currentValueMultiplier.toFixed(2) + "x"));
      }
    }
    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 0 TORNA AL DEALFLOW    200 DEALFLOW"));
    r.show(pageNum, lines.join("\n"), { title: "STARTUP" });
    TVRouter.setActionHandler(num => {
      if (num === 0) TVRouter.goto(200, { skipLoading: true });
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[301] = { render };
  P[302] = { render };
  P[303] = { render };
})(window);
