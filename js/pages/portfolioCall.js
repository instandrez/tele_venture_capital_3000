/* Pagina 620 - Portfolio company call. */
(function (global) {

  function esc(value) {
    return TVRender.escape(value);
  }

  function portrait(opts) {
    opts = opts || {};
    return (
      '<div class="codec-portrait-wrap">' +
        '<div class="lp-portrait codec-portrait face-' + esc(opts.face || "operator") + '">' +
          '<div class="lp-pixel-head"><i class="hair"></i><i class="ear"></i>' +
            '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="nose"></i>' +
            '<i class="mouth"></i><i class="glasses"></i></div>' +
          '<div class="lp-pixel-body"></div>' +
          '<div class="lp-id-card"><b>' + esc(opts.code || "CO") + '</b><span>' +
            esc(opts.badge || "PORTCO") + '</span></div>' +
        '</div>' +
        '<div class="lp-caller-name">' + esc(opts.name || "PORTFOLIO") + '</div>' +
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

  function toneAccent(tone) {
    return {
      round: "#ff3df0",
      founder: "#ff4030",
      regulatory: "#ffe200",
      enterprise: "#18e0ff",
      industrial: "#33ff66",
      policy: "#ff9320",
      burn: "#ff4030",
      growth: "#33ff66"
    }[tone] || "#33ff66";
  }

  function choicesHtml(incident) {
    return incident.choices.map((choice, i) =>
      '<button type="button" class="codec-choice" data-action="' + (i + 1) +
        '"><b>' + (i + 1) + '</b><span>' + esc(choice.label) + '</span></button>'
    ).join("");
  }

  function contextHtml(incident) {
    return incident.context.map(line => '<p>' + esc(line) + '</p>').join("");
  }

  function effectTone(delta) {
    return String(delta).charAt(0) === "-" ? "down" : "up";
  }

  function tacticalMessage(report) {
    const headline = (report.incident && report.incident.headline) || "";
    const choice = report.choice || {};
    if (headline === "GOVERNANCE DA APERITIVO") {
      return "La governance e' il prodotto, almeno finche' il founder smette di fare roadmap al bar.";
    }
    if (headline === "ROUND QUASI CHIUSO DA SEI MESI") {
      return "Il round quasi chiuso e' un asset illiquido: vale solo se qualcuno risponde al telefono.";
    }
    if (headline === "PORTALE COMPLIANCE IN FIAMME") {
      return "Il mercato non premia chi ignora il regolatore. Devi comprare tempo credibile.";
    }
    if (headline === "PROCUREMENT ETERNO") {
      return "Corporate innovation applaude; procurement converte gli applausi in allegati Excel.";
    }
    if (headline === "PLANT VISIT DEL NORDEST") {
      return "Se il prodotto regge in stabilimento, il memo pesa piu' di qualunque demo in ufficio.";
    }
    if (headline === "BANDO MINUSCOLO, RENDICONTO ENORME") {
      return "Il bando e' segnale, non strategia. Se diventa strategia hai appena assunto burocrazia.";
    }
    if (headline === "BRIDGE O TAGLIO DEL GROWTH HACKER") {
      return "La crescita senza margine e' debito mascherato. O correggi il modello o il mark scende.";
    }
    if (headline === "GROWTH BREAKPOINT") {
      return "Il cliente strategico puo' cambiare il destino della societa', ma non e' gratis.";
    }
    return choice.detail || "La chiamata entra nel prossimo mark del portfolio.";
  }

  function consequenceLine(report) {
    if (report.notes && report.notes.length) return report.notes[0].text;
    if (!report.metrics || !report.metrics.length) return "Nessuna metrica diretta modificata.";
    return report.metrics.map(m => m.label + " " + m.delta).join(" // ");
  }

  function effectsTape(report) {
    if (!report.metrics.length && !report.notes.length) {
      return '<div class="codec-effect-tape"><span>NESSUN DELTA DIRETTO</span></div>';
    }
    const metrics = report.metrics.map(item =>
      '<span class="' + effectTone(item.delta) + '">' +
        esc(item.label + " " + item.delta) + '</span>'
    ).join("");
    const notes = report.notes.map(note =>
      '<span class="down">' + esc(note.text) + '</span>'
    ).join("");
    return '<div class="codec-effect-tape">' + metrics + notes + '</div>';
  }

  function callScene(incident) {
    const accent = toneAccent(incident.tone);
    return (
      '<section class="console-scene codec-scene codec-lp portfolio-codec" ' +
        'style="--lp-accent:' + accent + ';--codec-accent:' + accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL PORTFOLIO CODEC</span>' +
          '<strong class="lp-live">FREQ 620 LIVE</strong></header>' +
        '<div class="codec-layout">' +
          '<aside class="codec-card codec-self">' +
            portrait({ face: "gp", code: "GP", badge: "FUND I", name: "GENERAL PARTNER" }) +
            waveform("is-calm") +
          '</aside>' +
          '<main class="codec-console">' +
            '<div class="lp-kicker">PORTFOLIO CALL // ' + esc(incident.startupName) + '</div>' +
            '<h1>' + esc(incident.headline) + '</h1>' +
            signalBars() +
            '<div class="lp-question codec-copy codec-transmission">' + contextHtml(incident) + '</div>' +
            '<div class="lp-choices codec-choices">' + choicesHtml(incident) + '</div>' +
          '</main>' +
          '<aside class="codec-card codec-remote">' +
            portrait({ face: incident.face, code: "620", badge: incident.caller, name: incident.caller }) +
            waveform("is-hot") +
          '</aside>' +
        '</div>' +
        '<footer class="codec-footer"><span>PREMI <b>1</b>, <b>2</b> O <b>3</b></span>' +
          '<span>LA SCELTA MODIFICA IL PORTFOLIO</span></footer>' +
      '</section>'
    );
  }

  function metricHtml(item, index) {
    const delta = String(item.delta);
    const tone = delta.charAt(0) === "-" ? "down" : "up";
    return (
      '<div class="lp-result-row ' + tone + '" style="--row-delay:' + (index * 90) + 'ms">' +
        '<div class="lp-result-label">' + esc(item.label) + '</div>' +
        '<div class="lp-result-values"><span>' + esc(item.before) + '</span>' +
          '<b>-></b><strong>' + esc(item.after) + '</strong>' +
          '<em>' + esc(delta) + '</em></div>' +
        '<div class="lp-result-track"><i style="width:72%"></i></div>' +
      '</div>'
    );
  }

  function resultScene(report) {
    const accent = toneAccent(report.incident && report.incident.tone);
    const metrics = report.metrics.length
      ? report.metrics.map(metricHtml).join("")
      : '<div class="lp-no-change">NESSUNA METRICA MODIFICATA</div>';
    const notes = report.notes.map(note =>
      '<div class="lp-special-note">' + esc(note.text) + '</div>'
    ).join("");
    return (
      '<section class="console-scene codec-scene codec-result-scene is-' + report.tone +
        ' portfolio-codec" style="--lp-accent:' + accent + ';--codec-accent:' + accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL PORTFOLIO LOG</span>' +
          '<strong>CHIAMATA CONCLUSA</strong></header>' +
        '<div class="codec-result-layout">' +
          '<main class="codec-console codec-result-console">' +
            '<div class="lp-result-stamp">PORTFOLIO IMPACT</div>' +
            '<div class="lp-kicker">' + esc(report.incident.startupName) + '</div>' +
            '<h1>MESSAGGIO RICEVUTO</h1>' +
            '<div class="lp-answer-quote">"' + esc(report.choice.label) + '"</div>' +
            signalBars() +
            '<div class="codec-brief is-' + report.tone + '">' +
              '<div class="source-tag">PORTCO TRANSMISSION</div>' +
              '<p class="source-main">"' + esc(tacticalMessage(report)) + '"</p>' +
              '<p><b>CONSEGUENZA</b> ' + esc(consequenceLine(report)) + '</p>' +
            '</div>' +
            effectsTape(report) +
            '<details class="codec-details"><summary>LOG NUMERICO</summary>' +
            '<div class="lp-result-grid">' + metrics + '</div>' +
            notes +
            '</details>' +
          '</main>' +
          '<aside class="codec-card codec-remote codec-reaction-card">' +
            portrait({ face: report.incident.face, code: "620", badge: report.incident.caller, name: report.incident.caller }) +
            '<div class="lp-reaction"><b>NAV desk:</b> "' +
              esc(report.choice.detail) + '"</div>' +
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
      r.bg("bg-green", "  " + r.pad("PORTFOLIO CALL", r.COLS - 2)),
      "",
      "",
      r.center(r.color("c-white", "nessuna portfolio company in linea.")),
      "",
      r.center(r.color("c-cyan", "per ora il portfolio respira."))
    ];
    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 100 HOME    450 FOLLOW-ON"));
    r.show(pageNum, lines.join("\n"), { title: "PORTFOLIO CALL" });
  }

  function render(pageNum) {
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }
    const incident = TVPortfolioIncidents.activeIncident(s);
    if (!incident) {
      renderNoCall(pageNum);
      return;
    }

    TVRender.showScene(pageNum, callScene(incident), {
      title: "PORTFOLIO CALL",
      className: "lp-cinematic codec-cinematic"
    });
    if (TVAudio.codecRing) TVAudio.codecRing("source");
    else if (TVAudio.phoneRing) TVAudio.phoneRing();

    TVRouter.setActionHandler(num => {
      if (num < 1 || num > incident.choices.length) return;
      const choice = incident.choices[num - 1];
      if (choice.cost && s.cash < choice.cost) {
        TVAudio.error();
        TVRouter.flash("CASH INSUFFICIENTE");
        return;
      }
      const report = TVPortfolioIncidents.applyChoice(s, incident, choice);
      if (TVAudio.lpOutcome) TVAudio.lpOutcome(report.tone);
      TVRender.showScene(pageNum, resultScene(report), {
        title: "ESITO PORTFOLIO",
        className: "lp-cinematic codec-cinematic"
      });
      TVRouter.setActionHandler(next => {
        if (next === 1) TVRouter.goto(report.incident.afterResolvePage || 450, { skipLoading: true });
        else if (next === 0) TVRouter.goto(100, { skipLoading: true });
      });
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[620] = { render };
})(window);
