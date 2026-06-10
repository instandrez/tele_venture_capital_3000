/* Pagina 600 — LP Call.
   Visualizza la prima call pendente dell'anno (se esiste).
   3 scelte → applicano effetti differenziati per LP.
   Le call sono triggerate dalla condizione del portfolio. */
(function (global) {

  function activeCall(state) {
    const calls = TVLPCalls.pickCallsForYear(state);
    return calls[0] || null;
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }

    const call = activeCall(s);
    if (!call) {
      const lines = [
        r.bg("bg-blue", "  " + r.pad("LP CALL", 38)),
        "",
        "",
        r.center(r.color("c-white", "nessuna call attiva al momento.")),
        "",
        r.center(r.color("c-magenta", "gli LP sono silenziosi.")),
        r.center(r.color("c-magenta", "approfittane.")),
      ];
      while (lines.length < 21) lines.push("");
      lines.push(r.color("c-white", " 100 HOME    400 PORTFOLIO"));
      r.show(pageNum, lines.join("\n"), { title: "LP CALL" });
      return;
    }

    const lp = TVLPProfiles[call.lp];

    const lines = [];
    lines.push(r.bg("bg-blue", "  " + r.pad("LP CALL — " + call.headline, 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " IN LINEA: " + lp.name));
    lines.push(r.color("c-cyan",   " (" + lp.caller + ")"));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));
    call.question.forEach(line => lines.push(" " + r.color("c-white", line)));
    lines.push("");

    call.choices.forEach((ch, i) => {
      const label = ch.label.length > 35 ? ch.label.slice(0, 35) + "…" : ch.label;
      lines.push(" " + r.color("c-yellow", String(i + 1)) + " " + r.color("c-white", label));
    });

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " digita 1, 2 o 3 per rispondere"));

    r.show(pageNum, lines.join("\n"), { title: "LP CALL" });

    TVRouter.setActionHandler(num => {
      if (num >= 1 && num <= call.choices.length) {
        applyChoice(s, call, call.choices[num - 1]);
        TVState.save();
        TVAudio.success();
        TVRouter.flash("RISPOSTA INVIATA");
        setTimeout(() => render(pageNum), 600);
      }
    });
  }

  function applyChoice(state, call, choice) {
    const eff = choice.effects || {};
    if (eff.lpSat) {
      Object.keys(eff.lpSat).forEach(lp => {
        state.lpSat[lp] = Math.max(0, Math.min(100, (state.lpSat[lp] || 50) + eff.lpSat[lp]));
      });
    }
    if (typeof eff.reputation === "number")
      state.reputation = Math.max(0, Math.min(100, (state.reputation || 50) + eff.reputation));
    if (typeof eff.innovationImpact === "number")
      state.innovationImpact = Math.max(0, Math.min(100, (state.innovationImpact || 50) + eff.innovationImpact));

    if (!state.usedLPCalls) state.usedLPCalls = [];
    state.usedLPCalls.push(call.id);

    if (!state.history) state.history = [];
    state.history.push({ year: state.year, lp: call.lp, call: call.id, answer: choice.label });
  }

  const P = global.TVPages = global.TVPages || {};
  P[600] = { render };
})(window);
