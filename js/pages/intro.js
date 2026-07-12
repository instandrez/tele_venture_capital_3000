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
      body: 'Hai appena chiuso Fund I: <span class="hot">100M EUR</span> raccolti, 90M investibili e tre anni per costruire un track record.',
      hold: 4600,
      logo: true,
      setpiece: "arrival"
    },
    {
      shot: "shot-teletext",
      accent: "#ffe200",
      eyebrow: "COME SI GIOCA // PAGINE 110-190",
      title: "LE NEWS SONO ALPHA",
      body: "Ogni anno le news parlano del dealflow di quell'anno. Leggerle prima della battle crea prove, dubbi e segnali da usare.",
      hold: 4900,
      setpiece: "teletext"
    },
    {
      shot: "shot-office",
      accent: "#33ff66",
      eyebrow: "DEALFLOW // PAGINA 200",
      title: "SCEGLI I DEAL DELL'ANNO",
      body: "Ogni anno arrivano cinque startup. Aprile, confrontale con 110/120/140/160/180, poi entra nelle schede 301-305.",
      hold: 5400,
      setpiece: "terminal"
    },
    {
      shot: "shot-teletext",
      accent: "#18e0ff",
      eyebrow: "TACCUINO // PAGINA 190",
      title: "COSTRUISCI IL CASO",
      body: "Due ritagli indipendenti possono aprire una fonte riservata. Piu' prove hai, meno costa la DD e piu' forti sono le domande.",
      hold: 5600,
      setpiece: "teletext"
    },
    {
      shot: "shot-office",
      accent: "#ffe200",
      eyebrow: "BATTLE // DOMANDE = LEVE",
      title: "NON E' UN QUIZ",
      body: "NUMERI, COMPETITOR, TEAM e SILENZIO servono a estrarre informazioni business, non a indovinare la risposta giusta.",
      hold: 5600,
      setpiece: "terminal"
    },
    {
      shot: "shot-office",
      accent: "#ff4030",
      eyebrow: "CONTROLLO SALA // RESISTENZA FOUNDER",
      title: "OGNI MOSSA HA UN COSTO",
      body: "Domande deboli o parate fanno perdere controllo sala. Domande preparate abbassano ask valuation e possono rivelare red flag.",
      hold: 5600,
      setpiece: "terminal"
    },
    {
      shot: "shot-teletext",
      accent: "#33ff66",
      eyebrow: "TERM SHEET // VALUATION // OWNERSHIP",
      title: "INVESTI SOLO QUANDO SAI PERCHE'",
      body: "DD, ref call, co-invest e pressione determinano leverage. Alcuni founder non firmano senza condizioni o accesso al round.",
      hold: 5600,
      setpiece: "teletext"
    },
    {
      shot: "shot-office",
      accent: "#ff3df0",
      eyebrow: "FUND OPS // LP // PORTFOLIO",
      title: "TRA UNA BATTLE E L'ALTRA SUCCEDE ROBA",
      body: "LP call, portfolio company call e catalyst possono comparire mentre torni a news e dealflow. Ignorarli costa punteggio.",
      hold: 5600,
      setpiece: "terminal"
    },
    {
      shot: "shot-fund",
      accent: "#ff3df0",
      eyebrow: "PORTFOLIO // LP // FINE ANNO",
      title: "VINCI LA RUN",
      body: "A fine anno il portfolio viene marcato. Score finale: MOIC, DPI, deployment, reputazione, impact e LP satisfaction.",
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
        '<button type="button" class="start-option is-primary" data-action="1"><b>1</b><span>NEW GAME</span></button>' +
        '<button type="button" class="start-option' + continueClass + '" data-action="2"><b>2</b><span>LOAD GAME</span></button>' +
        '<button type="button" class="start-option" data-action="3"><b>3</b><span>TELETEXT INDEX</span></button>' +
        '<button type="button" class="start-option" data-action="9"><b>9</b><span>OPTIONS</span></button>' +
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
        '<div class="start-notice">SET YOUR FUND IDENTITY</div>' +
      '</form>'
    );
  }

  function startScreenHtml() {
    const hasSave = hasPlayableSave();
    const saveLine = hasSave
      ? '<span class="c-green">SAVE DATA FOUND</span>'
      : '<span class="c-magenta">NO SAVE DATA</span>';
    return (
      '<section class="console-scene start-scene">' +
        '<div class="start-cabinet-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
        '<div class="start-grid"></div>' +
        '<div class="start-retro-sun" aria-hidden="true"></div>' +
        '<div class="start-skyline" aria-hidden="true">' +
          '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
        '</div>' +
        '<div class="start-monorail" aria-hidden="true"><span></span></div>' +
        '<div class="start-gp-sprite" aria-hidden="true"><i></i><b></b><span></span></div>' +
        '<div class="start-coin-door" aria-hidden="true"><i></i><i></i><span></span></div>' +
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
