/* Interni 910-941 - fonti riservate delle indagini.
   Si sbloccano incrociando almeno due ritagli indipendenti. */
(function (global) {

  function esc(value) {
    return TVRender.escape(value);
  }

  function sourceAccessible(state, startup) {
    if (!state || !startup) return false;
    if (TVIntel.currentDealStartup && TVIntel.currentDealStartup(state, startup)) return true;
    return (state.portfolio || []).some(p =>
      p.id === startup.id && (!p.status || p.status === "active")
    );
  }

  function sourceAccent(persona) {
    const byFace = {
      shadow: "#ff4030",
      visor: "#ffe200",
      corpdev: "#18e0ff",
      client: "#ff9320",
      operator: "#33ff66"
    };
    return byFace[persona.face] || "#18e0ff";
  }

  function codecPortrait(opts) {
    opts = opts || {};
    return (
      '<div class="codec-portrait-wrap">' +
        '<div class="lp-portrait codec-portrait face-' + esc(opts.face || "shadow") + '">' +
          '<div class="lp-pixel-head"><i class="hair"></i><i class="ear"></i>' +
            '<i class="eye eye-l"></i><i class="eye eye-r"></i><i class="nose"></i>' +
            '<i class="mouth"></i><i class="glasses"></i></div>' +
          '<div class="lp-pixel-body"></div>' +
          '<div class="lp-id-card"><b>' + esc(opts.code || "SRC") + '</b><span>' +
            esc(opts.badge || "BACKCHANNEL") + '</span></div>' +
        '</div>' +
        '<div class="lp-caller-name">' + esc(opts.name || "FONTE") + '</div>' +
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

  function sourceKicker(pageNum, persona) {
    return "INTERNO " + pageNum + " // " + persona.location.toUpperCase();
  }

  function forecastToneClass(forecast) {
    const tone = (forecast && forecast.tone) || "mixed";
    if (tone === "positive") return "is-positive";
    if (tone === "negative") return "is-negative";
    return "is-mixed";
  }

  function pendingScene(pageNum, st, chain) {
    const persona = chain.persona;
    const accent = sourceAccent(persona);
    return (
      '<section class="console-scene codec-scene codec-source" ' +
        'style="--lp-accent:' + accent + ';--codec-accent:' + accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL BACKCHANNEL</span>' +
          '<strong class="lp-live">FREQ 9.' + pageNum + ' OPEN</strong></header>' +
        '<div class="codec-layout">' +
          '<aside class="codec-card codec-self">' +
            codecPortrait({ face: "marta", code: "MRT", badge: "ANALYST", name: "MARTA" }) +
            waveform("is-calm") +
          '</aside>' +
          '<main class="codec-console">' +
            '<div class="lp-kicker">' + esc(sourceKicker(pageNum, persona)) + '</div>' +
            '<h1>' + esc(st.name) + '</h1>' +
            signalBars() +
            '<div class="codec-copy source-brief">' +
              '<p>Due ritagli indipendenti puntano alla stessa anomalia.</p>' +
              '<p>Marta apre una linea codec con ' +
                '<span class="c-cyan">' + esc(persona.role) + '</span>.</p>' +
              '<p class="c-magenta">La fonte non fa consulenza: manda un segnale operativo.</p>' +
            '</div>' +
            '<div class="codec-choices">' +
              '<button type="button" class="codec-choice" data-action="1"><b>1</b><span>ASCOLTA LA FONTE</span></button>' +
              '<button type="button" class="codec-choice" data-action="0"><b>0</b><span>TACCUINO</span></button>' +
              '<button type="button" class="codec-choice" data-action="9"><b>9</b><span>DEALFLOW</span></button>' +
            '</div>' +
          '</main>' +
          '<aside class="codec-card codec-remote">' +
            codecPortrait({ face: persona.face, code: persona.code, badge: persona.role, name: "FONTE RISERVATA" }) +
            waveform("is-hot") +
          '</aside>' +
        '</div>' +
        '<footer class="codec-footer"><span><b>1</b> ASCOLTA</span>' +
          '<span>SOFFIATA = DD PIU FORTE + BATTLE EDGE</span></footer>' +
      '</section>'
    );
  }

  function contactedScene(pageNum, st, chain) {
    const persona = chain.persona;
    const forecast = chain.forecast || persona.forecast || {};
    const accent = sourceAccent(persona);
    return (
      '<section class="console-scene codec-scene codec-source is-contacted" ' +
        'style="--lp-accent:' + accent + ';--codec-accent:' + accent + '">' +
        '<div class="codec-bg"></div><div class="codec-grid-bg"></div><div class="codec-scan"></div>' +
        '<header class="codec-header"><span>VC3000 TACTICAL BACKCHANNEL LOG</span>' +
          '<strong>FONTE VERIFICATA</strong></header>' +
        '<div class="codec-result-layout source-result-layout">' +
          '<main class="codec-console codec-source-report">' +
            '<div class="lp-kicker">' + esc(sourceKicker(pageNum, persona)) + '</div>' +
            '<h1>' + esc(st.name) + '</h1>' +
            signalBars() +
            '<div class="source-single-message ' + forecastToneClass(forecast) + '">' +
              '<div class="source-tag">MESSAGGIO FONTE // ' + esc(persona.code) + '</div>' +
              '<p class="source-main">"' + esc(forecast.message || persona.verdict) + '"</p>' +
              '<p><b>SEGNALE GREZZO</b> ' + esc(persona.risk || forecast.code || "non verificato") + '</p>' +
            '</div>' +
            '<div class="source-effects">' +
              '<span>+1 copertura battle</span>' +
              '<span>Dossier Strike potenziato</span>' +
              '<span>Segnale salvato nel taccuino</span>' +
            '</div>' +
          '</main>' +
          '<aside class="codec-card codec-remote codec-reaction-card">' +
            codecPortrait({ face: persona.face, code: persona.code, badge: persona.role, name: "FONTE RISERVATA" }) +
            '<div class="lp-reaction"><b>' + esc(persona.code) + ':</b> "Non citarmi nel memo. Decidi sul prezzo."</div>' +
          '</aside>' +
        '</div>' +
        '<footer class="codec-footer"><span><b>1</b> DEALFLOW</span>' +
          '<span><b>0</b> TACCUINO</span></footer>' +
      '</section>'
    );
  }

  function showDenied(pageNum) {
    const r = TVRender;
    const denied = [
      r.bg("bg-red", "  " + r.pad("FONTE RISERVATA " + pageNum, r.COLS - 2)),
      "",
      "",
      r.center(r.color("c-red", "ACCESSO NEGATO")),
      "",
      r.center(r.color("c-white", "una sola notizia non basta per chiamare.")),
      r.center(r.color("c-yellow", "incrocia due ritagli indipendenti.")),
    ];
    while (denied.length < 20) denied.push("");
    denied.push(r.color("c-white", " 190 TACCUINO    110 NEWS    100 HOME"));
    r.show(pageNum, denied.join("\n"), { title: "FONTE RISERVATA" });
  }

  function showSource(pageNum, s, st, chain) {
    TVRender.showScene(pageNum,
      chain.contacted ? contactedScene(pageNum, st, chain) : pendingScene(pageNum, st, chain),
      { title: "FONTE RISERVATA", className: "codec-cinematic source-cinematic" }
    );

    if (!chain.contacted) {
      if (TVAudio.codecRing) TVAudio.codecRing("source");
      TVRouter.setActionHandler(num => {
        if (num === 0) { TVRouter.goto(190, { skipLoading: true }); return; }
        if (num === 9) { TVRouter.goto(200, { skipLoading: true }); return; }
        if (num !== 1) return;
        const updated = TVIntel.contactSource(s, st);
        TVState.save();
        if (TVAudio.codecConfirm) TVAudio.codecConfirm("source");
        TVRouter.flash("FONTE VERIFICATA");
        showSource(pageNum, s, st, updated);
      });
      return;
    }

    TVRouter.setActionHandler(num => {
      if (num === 1 || num === 9) TVRouter.goto(200, { skipLoading: true });
      else if (num === 0) TVRouter.goto(190, { skipLoading: true });
    });
  }

  function render(pageNum) {
    const s = TVState.current;
    const st = TVIntel.sourceStartupByPage(pageNum);
    if (!s || !s.gameStarted || !st || !sourceAccessible(s, st)) {
      TVRouter.goto(190, { skipLoading: true });
      return;
    }

    const chain = TVIntel.chainFor(s, st);
    if (!chain.unlocked) {
      showDenied(pageNum);
      return;
    }

    showSource(pageNum, s, st, chain);
  }

  const P = global.TVPages = global.TVPages || {};
  TVStartups.STARTUPS.forEach((st, index) => {
    P[910 + index] = { render };
  });
})(window);
