/* Pagina 600 - LP Call.
   Le telefonate sono brevi scene console: il giocatore vede chi chiama,
   risponde con 1-3 e riceve un report esplicito su ogni conseguenza. */
(function (global) {

  const LP_VISUALS = {
    pensione:  { code: "PEN", accent: "#18e0ff", badge: "RISK DESK", face: "glasses" },
    family:    { code: "FO",  accent: "#ff9320", badge: "FAMILY OFFICE", face: "bob" },
    sovereign: { code: "SWF", accent: "#ffe200", badge: "SOVEREIGN", face: "keffiyeh" },
    endowment: { code: "END", accent: "#ff3df0", badge: "ENDOWMENT", face: "prof" }
  };

  function activeCall(state) {
    const calls = TVLPCalls.pickCallsForYear(state);
    return calls[0] || null;
  }

  function esc(value) {
    return TVRender.escape(value);
  }

  function callerPortrait(call, lp) {
    const visual = LP_VISUALS[call.lp] || LP_VISUALS.pensione;
    return (
      '<div class="lp-portrait-wrap">' +
        '<div class="lp-portrait face-' + visual.face + '">' +
          '<div class="lp-pixel-head"><i class="hair"></i><i class="ear"></i>' +
            '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="nose"></i>' +
            '<i class="mouth"></i><i class="glasses"></i></div>' +
          '<div class="lp-pixel-body"></div>' +
          '<div class="lp-id-card"><b>' + visual.code + '</b><span>' +
            esc(visual.badge) + '</span></div>' +
        '</div>' +
        '<div class="lp-caller-name">' + esc(lp.caller) + '</div>' +
      '</div>'
    );
  }

  function waveform() {
    let bars = "";
    for (let i = 0; i < 18; i++) bars += "<i></i>";
    return '<div class="lp-wave" aria-hidden="true">' + bars + "</div>";
  }

  function questionHtml(call) {
    return call.question
      .map(line => line ? '<p>' + esc(line) + '</p>' : '<br>')
      .join("");
  }

  function choicesHtml(call) {
    return call.choices.map((choice, i) =>
      '<div class="lp-choice"><b>' + (i + 1) + '</b><span>' +
        esc(choice.label) + '</span></div>'
    ).join("");
  }

  function callScene(call, lp) {
    const visual = LP_VISUALS[call.lp] || LP_VISUALS.pensione;
    return (
      '<section class="console-scene lp-scene lp-' + call.lp +
        '" style="--lp-accent:' + visual.accent + '">' +
        '<div class="lp-office-bg"></div><div class="lp-night-grid"></div>' +
        '<header class="lp-scene-header"><span>VC3000 // LINEA RISERVATA</span>' +
          '<strong class="lp-live">● IN DIRETTA</strong></header>' +
        '<div class="lp-caller-panel">' + callerPortrait(call, lp) + waveform() + '</div>' +
        '<div class="lp-dialogue-panel">' +
          '<div class="lp-kicker">CHIAMATA LP // ' + esc(lp.name) + '</div>' +
          '<h1>' + esc(call.headline) + '</h1>' +
          '<div class="lp-question">' + questionHtml(call) + '</div>' +
          '<div class="lp-choices">' + choicesHtml(call) + '</div>' +
        '</div>' +
        '<footer class="lp-scene-controls"><span>PREMI <b>1</b>, <b>2</b> O <b>3</b></span>' +
          '<span>OGNI RISPOSTA LASCIA UN VERBALE</span></footer>' +
      '</section>'
    );
  }

  function deltaText(delta) {
    if (delta > 0) return "+" + delta;
    return String(delta);
  }

  function metricHtml(item, index) {
    const tone = item.delta > 0 ? "up" : (item.delta < 0 ? "down" : "flat");
    const width = Math.max(4, item.after);
    return (
      '<div class="lp-result-row ' + tone + '" style="--row-delay:' + (index * 90) + 'ms">' +
        '<div class="lp-result-label">' + esc(item.label) + '</div>' +
        '<div class="lp-result-values"><span>' + item.before + '</span>' +
          '<b>→</b><strong>' + item.after + '</strong>' +
          '<em>' + deltaText(item.delta) + '</em></div>' +
        '<div class="lp-result-track"><i style="width:' + width + '%"></i></div>' +
      '</div>'
    );
  }

  function reaction(call, report) {
    const callerMetric = report.metrics.find(m => m.kind === "lp" && m.id === call.lp);
    const delta = callerMetric ? callerMetric.delta : 0;
    if (report.notes.length) return "La policy ringrazia. Il portfolio ha chiesto un avvocato.";
    if (delta >= 8) return "Finalmente una risposta con un verbo e una scadenza.";
    if (delta > 0) return "Bene. Lo scriveremo nel verbale senza punti esclamativi.";
    if (delta === 0) return "Prendiamo nota. Con una matita molto piccola.";
    if (delta > -8) return "Non era la risposta che speravamo di riportare al comitato.";
    return "Il comitato ne parlera'. A lungo. E senza di voi.";
  }

  function resultScene(call, lp, choice, report) {
    const visual = LP_VISUALS[call.lp] || LP_VISUALS.pensione;
    const toneLabel = {
      positive: "ESITO POSITIVO",
      negative: "ESITO NEGATIVO",
      mixed: "ESITO MISTO"
    }[report.tone] || "ESITO";
    const metrics = report.metrics.length
      ? report.metrics.map(metricHtml).join("")
      : '<div class="lp-no-change">NESSUNA METRICA DIRETTA MODIFICATA</div>';
    const notes = report.notes.map(note =>
      '<div class="lp-special-note">' + esc(note.text) + '</div>'
    ).join("");

    return (
      '<section class="console-scene lp-scene lp-result-scene is-' + report.tone +
        '" style="--lp-accent:' + visual.accent + '">' +
        '<div class="lp-office-bg"></div><div class="lp-night-grid"></div>' +
        '<header class="lp-scene-header"><span>VC3000 // VERBALE AUTOMATICO</span>' +
          '<strong>CHIAMATA CONCLUSA</strong></header>' +
        '<div class="lp-result-card">' +
          '<div class="lp-result-stamp">' + toneLabel + '</div>' +
          '<div class="lp-kicker">' + esc(lp.name) + '</div>' +
          '<h1>EFFETTI DELLA RISPOSTA</h1>' +
          '<div class="lp-answer-quote">“' + esc(choice.label) + '”</div>' +
          '<div class="lp-result-grid">' + metrics + '</div>' +
          notes +
          '<div class="lp-reaction"><b>' + esc(lp.caller) + ':</b> “' +
            esc(reaction(call, report)) + '”</div>' +
        '</div>' +
        '<footer class="lp-scene-controls"><span><b>1</b> CONTINUA</span>' +
          '<span><b>0</b> TORNA ALLA HOME</span></footer>' +
      '</section>'
    );
  }

  function renderNoCall(pageNum) {
    const r = TVRender;
    TVRouter.setActionHandler(null);
    const lines = [
      r.bg("bg-blue", "  " + r.pad("LP CALL", r.COLS - 2)),
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
  }

  function showCall(pageNum, state, call) {
    const lp = TVLPProfiles[call.lp];
    TVRender.showScene(pageNum, callScene(call, lp), {
      title: "LP CALL",
      className: "lp-cinematic"
    });
    if (TVAudio.phoneRing) TVAudio.phoneRing();

    TVRouter.setActionHandler(num => {
      if (num < 1 || num > call.choices.length) return;
      const choice = call.choices[num - 1];
      const report = TVLPRelations.applyChoice(state, call, choice);
      TVState.save();
      if (TVAudio.lpOutcome) TVAudio.lpOutcome(report.tone);
      TVRender.showScene(pageNum, resultScene(call, lp, choice, report), {
        title: "ESITO LP",
        className: "lp-cinematic"
      });

      TVRouter.setActionHandler(next => {
        if (next === 1) render(pageNum);
        else if (next === 0) TVRouter.goto(100);
      });
    });
  }

  function render(pageNum) {
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }

    const call = activeCall(s);
    if (!call) {
      renderNoCall(pageNum);
      return;
    }
    showCall(pageNum, s, call);
  }

  const P = global.TVPages = global.TVPages || {};
  P[600] = { render };
})(window);
