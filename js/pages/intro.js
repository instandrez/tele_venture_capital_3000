/* Pagina 105 — opening cinematic in-engine.
   Non e' un video preregistrato: fondale pixel-art, camera, copy e
   timing sono HTML/CSS, quindi restano nitidi e adattabili. */
(function (global) {
  let gen = 0;
  let timers = [];
  let frameIdx = 0;

  const FRAMES = [
    {
      shot: "shot-wide",
      accent: "#18e0ff",
      eyebrow: "MILANO // SETTEMBRE // 23:47",
      title: "IL PRIMO CLOSING",
      body: 'Hai appena raccolto <span class="hot">100 milioni</span>. Quattro LP hanno firmato. E conservato il tuo numero.',
      hold: 4300,
      logo: true
    },
    {
      shot: "shot-city",
      accent: "#ffe200",
      eyebrow: "FUORI, IL MERCATO NON DORME",
      title: "LE NOTIZIE SONO ALPHA",
      body: "Regolazione, hype, crisi e corporate deal. Ogni pagina puo' cambiare il valore del tuo portfolio.",
      hold: 4700
    },
    {
      shot: "shot-crt",
      accent: "#33ff66",
      eyebrow: "IL TERMINALE CONOSCE COSE",
      title: "LEGGI. INCROCIA. DECIDI.",
      body: "Gli altri fondi guardano i deck. Tu hai una rete informativa, una tastiera numerica e pochissimo buon senso.",
      hold: 4800
    },
    {
      shot: "shot-desk",
      accent: "#ff3df0",
      eyebrow: "CINQUE ANNI // UNA SOLA REPUTAZIONE",
      title: "COSTRUISCI IL FONDO",
      body: "Combatti i pitch. Gestisci gli LP. Trova le exit. Evita di diventare un advisor.",
      hold: 0,
      final: true
    }
  ];

  function clearTimers() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
  }

  function schedule(fn, ms) {
    const g = gen;
    timers.push(setTimeout(() => {
      if (g !== gen) return;
      const s = TVState.current;
      if (!s || s.currentPage !== 105) return;
      fn();
    }, ms));
  }

  function sceneHtml(frame, idx) {
    const logo = frame.logo
      ? '<div class="intro-logo"><strong><span class="mark-vc">VC</span><span class="mark-3000">3000</span></strong><small>VENTURE CAPITAL SIMULATOR</small></div>'
      : "";
    const action = frame.final ? "COMINCIA" : "AVANTI";
    return (
      '<section class="console-scene intro-scene ' + frame.shot + '" style="--intro-accent:' + frame.accent +
        ';--intro-progress:' + (((idx + 1) / FRAMES.length) * 100) + '%">' +
        '<div class="intro-bg"></div>' +
        '<div class="intro-grade"></div>' +
        '<div class="intro-progress"></div>' +
        logo +
        '<div class="intro-copy">' +
          '<div class="eyebrow">' + frame.eyebrow + '</div>' +
          '<h1>' + frame.title + '</h1>' +
          '<p>' + frame.body + '</p>' +
        '</div>' +
        '<div class="intro-controls">' +
          '<span><b>1</b> ' + action + '</span>' +
          '<span><b>0</b> SALTA SIGLA</span>' +
        '</div>' +
      '</section>'
    );
  }

  function showFrame(idx) {
    frameIdx = idx;
    const frame = FRAMES[idx];
    TVRender.showScene(105, sceneHtml(frame, idx), {
      title: "OPENING CINEMATIC",
      className: "intro-cinematic"
    });
    if (idx > 0) TVAudio.pageChange();
    if (!frame.final) schedule(() => showFrame(idx + 1), frame.hold);
  }

  function begin() {
    gen += 1;
    clearTimers();
    TVRouter.goto(100, { skipLoading: true });
  }

  function render() {
    gen += 1;
    clearTimers();
    frameIdx = 0;
    TVAudio.jingle();
    showFrame(0);

    TVRouter.setActionHandler(num => {
      if (num === 0) {
        begin();
      } else if (num === 1) {
        if (frameIdx >= FRAMES.length - 1) {
          begin();
          return;
        }
        gen += 1;
        clearTimers();
        showFrame(frameIdx + 1);
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[105] = { render };
})(window);
