/* Pagine 000 e 105: title screen + opening cinematic in-engine.
   Non sono video preregistrati: fondali, camera, copy e timing sono
   HTML/CSS, quindi restano nitidi e adattabili. */
(function (global) {
  let gen = 0;
  let timers = [];
  let frameIdx = 0;
  let startNotice = "";
  let startMode = "menu";

  const FRAMES = [
    {
      shot: "shot-arrival",
      accent: "#18e0ff",
      eyebrow: "NEW MILAN // LINEA MAGLEV 3000 // 06:12",
      title: "SEI IL GENERAL PARTNER",
      body: 'Hai appena chiuso Fund I: <span class="hot">100M EUR</span> raccolti, 90M investibili e cinque anni per scalare la classifica.',
      hold: 4600,
      logo: true,
      setpiece: "arrival"
    },
    {
      shot: "shot-teletext",
      accent: "#ffe200",
      eyebrow: "COME SI GIOCA // PAGINE 110-190",
      title: "LE NEWS SONO ALPHA",
      body: "Il Televideo non e' decorazione: ogni pagina letta puo' diventare indizio, tesi o rischio prima che il mercato se ne accorga.",
      hold: 4900,
      setpiece: "teletext"
    },
    {
      shot: "shot-office",
      accent: "#33ff66",
      eyebrow: "DEALFLOW // PAGINA 200",
      title: "SCEGLI I DEAL DELL'ANNO",
      body: "Ogni anno arrivano tre startup. Aprile, confrontale con le news, poi decidi se passare o entrare in Pitch Battle.",
      hold: 5000,
      setpiece: "terminal"
    },
    {
      shot: "shot-teletext",
      accent: "#18e0ff",
      eyebrow: "TACCUINO // PITCH BATTLE // 301-303",
      title: "CREA PRESSIONE",
      body: "La pagina 190 trasforma ritagli in dossier. Un dossier forte ti protegge dai contrattacchi e sblocca domande armate.",
      hold: 5000,
      setpiece: "teletext"
    },
    {
      shot: "shot-office",
      accent: "#ffe200",
      eyebrow: "BATTLE // DOMANDE = LEVE",
      title: "NON E' UN QUIZ",
      body: "Le domande servono a rompere il pitch-script: abbassi la resistenza del founder, ottieni informazioni e migliori la trattativa.",
      hold: 5200,
      setpiece: "terminal"
    },
    {
      shot: "shot-teletext",
      accent: "#33ff66",
      eyebrow: "TERM SHEET // VALUATION // OWNERSHIP",
      title: "INVESTI SOLO QUANDO SAI PERCHE'",
      body: "DD, ref call, co-invest e pressione ti dicono se il deal vale. Domande buone abbassano ASK VAL e aumentano la tua quota.",
      hold: 5200,
      setpiece: "teletext"
    },
    {
      shot: "shot-fund",
      accent: "#ff3df0",
      eyebrow: "PORTFOLIO // LP // FINE ANNO",
      title: "VINCI LA RUN",
      body: "Scala la leaderboard con MOIC, DPI, deployment, reputazione e LP satisfaction. Chi legge meglio, investe meglio.",
      hold: 0,
      final: true,
      setpiece: "fund"
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

  function hasPlayableSave() {
    if (!TVState.hasSave()) return false;
    try {
      const raw = JSON.parse(localStorage.getItem("tvc3000.save"));
      return !!(raw && raw.gameStarted && !raw.gameOver);
    } catch (e) {
      return false;
    }
  }

  function startMenuHtml(hasSave) {
    const continueClass = hasSave ? "" : " is-disabled";
    const notice = startNotice
      ? '<div class="start-notice">' + TVRender.escape(startNotice) + '</div>'
      : '<div class="start-notice is-muted">WELCOME TO NEW MILAN</div>';
    return (
      '<div class="start-menu" role="menu">' +
        '<div class="start-option is-primary" data-action="1"><b>1</b><span>NEW GAME</span></div>' +
        '<div class="start-option' + continueClass + '" data-action="2"><b>2</b><span>LOAD GAME</span></div>' +
        '<div class="start-option" data-action="3"><b>3</b><span>TELETEXT INDEX</span></div>' +
        '<div class="start-option" data-action="9"><b>9</b><span>OPTIONS</span></div>' +
      '</div>' +
      notice
    );
  }

  function startNameHtml() {
    return (
      '<form class="start-name-form" id="start-name-form">' +
        '<label><span>GP NAME</span><input id="start-nickname" maxlength="16" autocomplete="off" value="GP"></label>' +
        '<label><span>FUND NAME</span><input id="start-fund" maxlength="24" autocomplete="off" value="New Milan Capital"></label>' +
        '<div class="start-name-actions">' +
          '<button type="submit">START FUND</button>' +
          '<button type="button" id="start-name-back">BACK</button>' +
        '</div>' +
      '</form>' +
      '<div class="start-notice">SET YOUR FUND IDENTITY</div>'
    );
  }

  function startScreenHtml() {
    const hasSave = hasPlayableSave();
    const saveLine = hasSave
      ? '<span class="c-green">SAVE DATA FOUND</span>'
      : '<span class="c-magenta">NO SAVE DATA</span>';
    return (
      '<section class="console-scene start-scene">' +
        '<div class="start-grid"></div>' +
        '<div class="start-skyline" aria-hidden="true">' +
          '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
        '</div>' +
        '<div class="start-monorail" aria-hidden="true"><span></span></div>' +
        '<div class="start-logo" aria-label="Tele Venture Capital 3000">' +
          '<div class="start-kicker">TELEVIDEO ARCADE SYSTEM</div>' +
          '<h1><span>TELE</span><span>VENTURE</span><span>CAPITAL</span><em>3000</em></h1>' +
          '<p>FUND MANAGER CARTRIDGE</p>' +
        '</div>' +
        (startMode === "naming" ? startNameHtml() : startMenuHtml(hasSave)) +
        '<div class="start-ticker"><span>VC3000 // ' + saveLine +
          ' // NEW GAME STARTS FUND I // LOAD GAME RESUMES SAVE // NEWS IS ALPHA</span></div>' +
      '</section>'
    );
  }

  function cleanPromptValue(value, fallback, maxLen) {
    value = String(value || "").trim();
    if (!value) value = fallback;
    return value.slice(0, maxLen);
  }

  function collectPlayerNames(nickValue, fundValue) {
    const nick = cleanPromptValue(nickValue, "GP", 16);
    const fund = cleanPromptValue(fundValue, nick + " Capital", 24);
    return { nickname: nick, fundName: fund };
  }

  function bindNameForm() {
    const form = document.getElementById("start-name-form");
    if (!form) return;
    const nick = document.getElementById("start-nickname");
    const fund = document.getElementById("start-fund");
    const back = document.getElementById("start-name-back");

    function begin() {
      startMode = "menu";
      startNotice = "";
      TVState.newGame(collectPlayerNames(nick && nick.value, fund && fund.value));
      TVRouter.goto(105);
    }

    form.addEventListener("keydown", e => {
      e.stopPropagation();
      if (e.key === "Escape") {
        e.preventDefault();
        startMode = "menu";
        renderStart();
      }
    });
    form.addEventListener("submit", e => {
      e.preventDefault();
      e.stopPropagation();
      begin();
    });
    if (back) {
      back.addEventListener("click", e => {
        e.preventDefault();
        startMode = "menu";
        renderStart();
      });
    }
    setTimeout(() => {
      if (nick && nick.focus) {
        nick.focus();
        if (nick.select) nick.select();
      }
    }, 0);
  }

  function renderStart() {
    gen += 1;
    clearTimers();
    TVRender.showScene(0, startScreenHtml(), {
      title: "START GAME",
      className: "start-cinematic"
    });
    if (startMode === "naming") bindNameForm();

    TVRouter.setActionHandler(num => {
      const hasSave = hasPlayableSave();
      if (num === 1) {
        startNotice = "";
        startMode = "naming";
        renderStart();
      } else if (num === 2) {
        if (hasSave) {
          startNotice = "";
          TVRouter.goto(102);
        } else {
          startNotice = "NESSUN SAVE DA CARICARE";
          TVAudio.error();
          renderStart();
        }
      } else if (num === 3) {
        startNotice = "";
        TVRouter.goto(100);
      } else if (num === 9) {
        startNotice = "";
        TVRouter.goto(109);
      }
    });
  }

  function setpieceHtml(kind) {
    if (kind === "arrival") {
      return (
        '<div class="intro-setpiece intro-arrival" aria-hidden="true">' +
          '<div class="intro-train"><span></span><span></span><span></span></div>' +
          '<div class="intro-platform"></div>' +
          '<div class="intro-manager"><i></i></div>' +
        '</div>'
      );
    }
    if (kind === "teletext") {
      return (
        '<div class="intro-setpiece intro-broadcast" aria-hidden="true">' +
          '<div class="intro-tower"><i></i><i></i><i></i></div>' +
          '<div class="intro-news-wall">' +
            '<span>P110 MARKET SHOCK</span><span>P140 AI INDEX +4.2</span>' +
            '<span>P160 FOUNDER RISK</span><span>P180 CORPORATE WATCH</span>' +
          '</div>' +
        '</div>'
      );
    }
    if (kind === "terminal") {
      return (
        '<div class="intro-setpiece intro-terminal" aria-hidden="true">' +
          '<span>TV/VC OS</span><b>100M EUR</b><i></i>' +
        '</div>'
      );
    }
    if (kind === "fund") {
      return (
        '<div class="intro-setpiece intro-fund-seal" aria-hidden="true">' +
          '<strong>VC3000</strong><span>FUND I</span><em>LIVE</em>' +
        '</div>'
      );
    }
    return "";
  }

  function sceneHtml(frame, idx) {
    const logo = frame.logo
      ? '<div class="intro-logo"><strong><span class="mark-vc">VC</span><span class="mark-3000">3000</span></strong><small>VENTURE CAPITAL SIMULATOR</small></div>'
      : "";
    const action = frame.final ? "PAGINA 100" : "AVANTI";
    return (
      '<section class="console-scene intro-scene ' + frame.shot + '" style="--intro-accent:' + frame.accent +
        ';--intro-progress:' + (((idx + 1) / FRAMES.length) * 100) + '%">' +
        '<div class="intro-bg"></div>' +
        '<div class="intro-city-lights"></div>' +
        '<div class="intro-grade"></div>' +
        '<div class="intro-progress"></div>' +
        logo +
        setpieceHtml(frame.setpiece) +
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
  P[0] = { render: renderStart };
  P[105] = { render };
})(window);
