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

  function codecPortrait(opts) {
    opts = opts || {};
    return (
      '<div class="codec-portrait-wrap">' +
        '<div class="lp-portrait codec-portrait face-' + esc(opts.face || "glasses") + '">' +
          '<div class="lp-pixel-head"><i class="hair"></i><i class="ear"></i>' +
            '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="nose"></i>' +
            '<i class="mouth"></i><i class="glasses"></i></div>' +
          '<div class="lp-pixel-body"></div>' +
          '<div class="lp-id-card"><b>' + esc(opts.code || "VC") + '</b><span>' +
            esc(opts.badge || "SECURE") + '</span></div>' +
        '</div>' +
        '<div class="lp-caller-name">' + esc(opts.name || "UNKNOWN") + '</div>' +
      '</div>'
    );
  }

  function waveform(className) {
    let bars = "";
    for (let i = 0; i < 22; i++) bars += "<i></i>";
    return '<div class="lp-wave codec-wave ' + (className || "") +
      '" aria-hidden="true">' + bars + "</div>";
  }

  function signalBars() {
    let bars = "";
    for (let i = 0; i < 12; i++) bars += "<i></i>";
    return '<div class="codec-signal-bars" aria-hidden="true">' + bars + "</div>";
  }

  function questionHtml(call) {
    return call.question
      .map(line => line ? '<p>' + esc(line) + '</p>' : '<br>')
      .join("");
  }

  function choicesHtml(call) {
    return call.choices.map((choice, i) =>
      '<button type="button" class="codec-choice" data-action="' + (i + 1) +
        '"><b>' + (i + 1) + '</b><span>' + esc(choice.label) + '</span></button>'
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

  function codecCallScene(call, lp) {
    const visual = LP_VISUALS[call.lp] || LP_VISUALS.pensione;
    return (
      '<section class="console-scene codec-scene codec-lp lp-' + call.lp +
        '" style="--lp-accent:' + visual.accent + ';--codec-accent:' + visual.accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL CODEC</span>' +
          '<strong class="lp-live">FREQ ' + esc(visual.code) + '-600 LIVE</strong></header>' +
        '<div class="codec-layout">' +
          '<aside class="codec-card codec-self">' +
            codecPortrait({ face: "gp", code: "GP", badge: "FUND I", name: "GENERAL PARTNER" }) +
            waveform("is-calm") +
          '</aside>' +
          '<main class="codec-console">' +
            '<div class="lp-kicker">LP CODEC // ' + esc(lp.name) + '</div>' +
            '<h1>' + esc(call.headline) + '</h1>' +
            signalBars() +
            '<div class="lp-question codec-copy codec-transmission">' + questionHtml(call) + '</div>' +
            '<div class="lp-choices codec-choices">' + choicesHtml(call) + '</div>' +
          '</main>' +
          '<aside class="codec-card codec-remote">' +
            codecPortrait({ face: visual.face, code: visual.code, badge: visual.badge, name: lp.caller }) +
            waveform("is-hot") +
          '</aside>' +
        '</div>' +
        '<footer class="codec-footer"><span>PREMI <b>1</b>, <b>2</b> O <b>3</b></span>' +
          '<span>LINEA REGISTRATA DAL VERBALE LP</span></footer>' +
      '</section>'
    );
  }

  function deltaText(delta) {
    if (delta > 0) return "+" + delta;
    return String(delta);
  }

  function metricText(item) {
    return item.label + " " + deltaText(item.delta);
  }

  function consequenceLine(report) {
    if (report.notes.length) return report.notes[0].text;
    if (!report.metrics.length) return "Nessuna metrica diretta modificata.";
    return report.metrics.map(metricText).join(" // ");
  }

  function tacticalMessage(call, lp, choice, report) {
    const callerMetric = report.metrics.find(m => m.kind === "lp" && m.id === call.lp);
    const delta = callerMetric ? callerMetric.delta : 0;
    if (report.notes.length) return "Hai promesso una scelta irreversibile. Gli LP ora guardano se la esegui.";
    if (delta >= 8) return "L'LP compra la narrativa: disciplina, scadenza, ownership del problema.";
    if (delta > 0) return "La risposta basta a tenere la linea aperta. Non hai ancora vinto fiducia, ma hai evitato rumore.";
    if (delta === 0) return "La chiamata si chiude neutra. Nessun danno, nessun credito politico.";
    if (delta > -8) return "L'LP registra una crepa. Da qui in poi ogni scelta simile pesera' di piu'.";
    return "La fiducia scende. Il prossimo errore sullo stesso tema diventera' un problema di fundraising.";
  }

  function effectsTape(report) {
    if (!report.metrics.length && !report.notes.length) {
      return '<div class="codec-effect-tape"><span>NESSUN DELTA DIRETTO</span></div>';
    }
    const metrics = report.metrics.map(item =>
      '<span class="' + (item.delta >= 0 ? "up" : "down") + '">' +
        esc(metricText(item)) + '</span>'
    ).join("");
    const notes = report.notes.map(note =>
      '<span class="' + (note.tone === "negative" ? "down" : "up") + '">' +
        esc(note.text) + '</span>'
    ).join("");
    return '<div class="codec-effect-tape">' + metrics + notes + '</div>';
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

  function codecResultScene(call, lp, choice, report) {
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
      '<section class="console-scene codec-scene codec-result-scene is-' + report.tone +
        '" style="--lp-accent:' + visual.accent + ';--codec-accent:' + visual.accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL CODEC LOG</span>' +
          '<strong>CHIAMATA CONCLUSA</strong></header>' +
        '<div class="codec-result-layout">' +
          '<main class="codec-console codec-result-console">' +
            '<div class="lp-result-stamp">' + toneLabel + '</div>' +
            '<div class="lp-kicker">' + esc(lp.name) + '</div>' +
            '<h1>MESSAGGIO RICEVUTO</h1>' +
            '<div class="lp-answer-quote">"' + esc(choice.label) + '"</div>' +
            signalBars() +
            '<div class="codec-brief is-' + report.tone + '">' +
              '<div class="source-tag">LP TRANSMISSION</div>' +
              '<p class="source-main">"' + esc(tacticalMessage(call, lp, choice, report)) + '"</p>' +
              '<p><b>CONSEGUENZA</b> ' + esc(consequenceLine(report)) + '</p>' +
            '</div>' +
            effectsTape(report) +
            '<details class="codec-details"><summary>LOG NUMERICO</summary>' +
            '<div class="lp-result-grid">' + metrics + '</div>' +
            notes +
            '</details>' +
          '</main>' +
          '<aside class="codec-card codec-remote codec-reaction-card">' +
            codecPortrait({ face: visual.face, code: visual.code, badge: visual.badge, name: lp.caller }) +
            '<div class="lp-reaction"><b>' + esc(lp.caller) + ':</b> "' +
              esc(reaction(call, report)) + '"</div>' +
          '</aside>' +
        '</div>' +
        '<footer class="codec-footer"><span><b>1</b> CONTINUA</span>' +
          '<span><b>0</b> HOME</span></footer>' +
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
    TVRender.showScene(pageNum, codecCallScene(call, lp), {
      title: "LP CALL",
      className: "lp-cinematic codec-cinematic"
    });
    if (TVAudio.codecRing) TVAudio.codecRing("lp");
    else if (TVAudio.phoneRing) TVAudio.phoneRing();

    TVRouter.setActionHandler(num => {
      if (num < 1 || num > call.choices.length) return;
      const choice = call.choices[num - 1];
      const report = TVLPRelations.applyChoice(state, call, choice);
      TVState.save();
      if (TVAudio.lpOutcome) TVAudio.lpOutcome(report.tone);
      TVRender.showScene(pageNum, codecResultScene(call, lp, choice, report), {
        title: "ESITO LP",
        className: "lp-cinematic codec-cinematic"
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
