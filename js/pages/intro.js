/* Pagina 105 — SIGLA D'APERTURA.

   "Video" in formato Televideo: i frame si rivelano riga per riga
   (come il teletext vero che decodificava le pagine) e avanzano
   da soli. 1 = frame successivo, 0 = salta tutto.

   Parte automaticamente su "AVVIA FONDO" (101); rivedibile in
   qualsiasi momento digitando 105. */
(function (global) {

  let gen = 0;        // invalida i timer quando si ri-renderizza o si esce
  let timers = [];

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

  // ---------- frames ----------
  /* logo a blocchi VC3000, stile copertina cartuccia: "VC" giallo,
     "3000" arancione, con riga d'ombra sotto per dare volume. */
  function frameLogo() {
    const r = TVRender;
    const V  = ["█   █", "█   █", "█   █", " █ █ ", "  █  "];
    const C  = [" ███ ", "█   █", "█    ", "█   █", " ███ "];
    const N3 = ["████ ", "   ██", " ███ ", "   ██", "████ "];
    const O0 = [" ███ ", "██ ██", "██ ██", "██ ██", " ███ "];

    const lines = ["", ""];
    for (let i = 0; i < 5; i++) {
      const vc   = V[i] + " " + C[i];
      const nums = N3[i] + " " + O0[i] + " " + O0[i] + " " + O0[i];
      lines.push("  " + r.color("c-yellow", vc) + " " + r.color("c-orange", nums));
    }
    // riga d'ombra: la base delle lettere ripetuta in blu scuro
    lines.push("  " + r.color("c-blue", "▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀ ▀▀▀▀▀"));
    lines.push("");
    lines.push(r.center(r.color("c-white", "VENTURE CAPITAL SIMULATOR")));
    lines.push(r.center(r.color("c-magenta", "~ il teletext del capitale di rischio ~")));
    lines.push("");
    lines.push(r.center(r.color("c-green", "IL TELEVIDEO PRESENTA")));
    return lines;
  }

  function frameStory() {
    const r = TVRender;
    return [
      "",
      " " + r.color("c-yellow", "ANNO UNO. SETTEMBRE."),
      "",
      " " + r.color("c-white", "Hai appena chiuso il primo closing:"),
      " " + r.color("c-green", "100 MILIONI DI EURO."),
      "",
      " " + r.color("c-white", "Quattro investitori ci hanno messo"),
      " " + r.color("c-white", "la firma. E il numero di telefono."),
      " " + r.color("c-white", "Lo useranno."),
      "",
      " " + r.color("c-magenta", "Nessuno sa perche' te li abbiano"),
      " " + r.color("c-magenta", "dati. Nemmeno tu.")
    ];
  }

  function frameLPs() {
    const r = TVRender;
    return [
      r.bg("bg-cyan", "  " + r.pad("I TUOI LP", 38)),
      "",
      " " + r.color("c-yellow", "FONDO PENSIONE LOMBARDIA"),
      " " + r.color("c-white", '"i pensionati non capiscono i pivot"'),
      "",
      " " + r.color("c-yellow", "FAMIGLIA INDUSTRIALE VENETA"),
      " " + r.color("c-white", '"avete pensato al nostro'),
      " " + r.color("c-white", ' stabilimento di Schio?"'),
      "",
      " " + r.color("c-yellow", "SOVEREIGN FUND DEL GOLFO"),
      " " + r.color("c-white", '"we talk unicorns."'),
      "",
      " " + r.color("c-yellow", "ENDOWMENT UNIV. DI BOLOGNA"),
      " " + r.color("c-white", '"e\' ESG, questo?"')
    ];
  }

  function frameSecret() {
    const r = TVRender;
    return [
      r.bg("bg-yellow", "  " + r.pad("IL TUO UFFICIO HA", 38)),
      "",
      " " + r.color("c-white", "· una scrivania"),
      " " + r.color("c-white", "· un telefono che squilla") +
            r.color("c-cyan", "  (gli LP)"),
      " " + r.color("c-white", "· un televisore sintonizzato sul") +
            " " + r.color("c-cyan", "TELEVIDEO"),
      "",
      " " + r.color("c-white", "Gli altri fondi leggono i deck."),
      " " + r.color("c-green", "Tu puoi leggere TUTTO."),
      "",
      " " + r.color("c-white", "Ultim'ora. Borsa. Cronaca startup."),
      " " + r.color("c-white", "Politica. Corporate watch."),
      "",
      " " + r.color("c-magenta", "Nessuna pagina e' li' per caso.")
    ];
  }

  function frameMission() {
    const r = TVRender;
    return [
      r.bg("bg-red", "  " + r.pad("LA MISSIONE", 38)),
      "",
      r.center(r.color("c-yellow", "5 ANNI. 100 MILIONI.")),
      r.center(r.color("c-yellow", "UNA REPUTAZIONE DA COSTRUIRE.")),
      "",
      r.center(r.color("c-green", "Investi bene: leggenda.")),
      r.center(r.color("c-red", 'Investi male: "advisor".')),
      "",
      "",
      r.center('<span class="blink c-white">PREMI 1 PER COMINCIARE</span>')
    ];
  }

  const FRAMES = [
    { build: frameLogo,    hold: 2800 },
    { build: frameStory,   hold: 3400 },
    { build: frameLPs,     hold: 4200 },
    { build: frameSecret,  hold: 4200 },
    { build: frameMission, hold: 0, final: true }
  ];

  // ---------- riproduzione ----------
  function showFrame(idx) {
    const r = TVRender;
    const frame = FRAMES[idx];
    const lines = frame.build();
    const footer = frame.final ? " 1 COMINCIA" : " 1 AVANTI    0 SALTA SIGLA";

    // reveal riga per riga, come il teletext che decodifica
    const LINE_MS = 95;
    lines.forEach((_, k) => {
      schedule(() => {
        const partial = lines.slice(0, k + 1);
        const padded = partial.concat(
          new Array(Math.max(0, 21 - partial.length)).fill(""));
        padded.push(r.color("c-white", footer));
        r.show(105, padded.join("\n"), { title: "SIGLA" });
        if (k % 2 === 0) TVAudio.keyPress();
      }, k * LINE_MS);
    });

    if (!frame.final) {
      schedule(() => showFrame(idx + 1), lines.length * LINE_MS + frame.hold);
    }
  }

  function begin() {
    gen++;
    clearTimers();
    const s = TVState.current;
    TVRouter.goto(s && s.gameStarted ? 200 : 100);
  }

  let frameIdx = 0;

  function render() {
    gen++;
    clearTimers();
    frameIdx = 0;
    if (TVAudio.jingle) TVAudio.jingle();
    showFrame(0);

    TVRouter.setActionHandler(num => {
      if (num === 0) { begin(); return; }
      if (num === 1) {
        if (frameIdx >= FRAMES.length - 1) { begin(); return; }
        gen++;
        clearTimers();
        frameIdx += 1;
        showFrame(frameIdx);
      }
    });
  }

  // showFrame deve aggiornare frameIdx anche in auto-avanzamento
  const _showFrame = showFrame;
  showFrame = function (idx) { frameIdx = idx; _showFrame(idx); };

  const P = global.TVPages = global.TVPages || {};
  P[105] = { render };
})(window);
