/* Audio chiptune — Web Audio API, niente file esterni.
   Toggle mute via localStorage["tvc3000.muted"].

   Ogni nota ha un inviluppo (attacco morbido + rilascio) così non
   "clicca": è la differenza tra un beep da sveglia e un suono da
   console. La musica della battaglia è un loop melodico in LA
   minore (i–VI–III–V), tenuto basso per non coprire i colpi. */
(function (global) {
  let ctx = null;
  let muted = localStorage.getItem("tvc3000.muted") === "1";
  let master = null;

  function ensureCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    return ctx;
  }

  /* nota con inviluppo: attacco lineare (no click) + decay esponenziale.
     opts: { type, vol, attack, delay, sweep } */
  function tone(freq, durMs, opts) {
    opts = opts || {};
    if (muted || !freq) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + (opts.delay || 0);
    const dur = durMs / 1000;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = opts.type || "square";
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.sweep) osc.frequency.exponentialRampToValueAtTime(opts.sweep, t0 + dur);
    const vol = opts.vol != null ? opts.vol : 0.06;
    const atk = opts.attack != null ? opts.attack : 0.008;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(dur, atk + 0.02));
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + Math.max(dur, atk + 0.02) + 0.02);
  }

  /* due oscillatori leggermente scordati = lead più "ricco" (detune) */
  function lead(freq, durMs, vol) {
    tone(freq, durMs, { type: "square", vol: vol, attack: 0.006 });
    tone(freq * 1.005, durMs, { type: "square", vol: vol * 0.6, attack: 0.006 });
  }

  // ---------- SFX ----------
  // tick morbido (usato durante le animazioni: dev'essere discreto)
  function tick() { tone(880, 30, { type: "triangle", vol: 0.03, attack: 0.004 }); }

  // ---------- sigla d'apertura ----------
  // arpeggio LA minore che sale e si apre: invito, non sveglia.
  function jingle() {
    if (muted) return;
    const seq = [
      [220, 0.00], [330, 0.10], [440, 0.20], [523, 0.30],
      [659, 0.42], [523, 0.54], [659, 0.66], [880, 0.80]
    ];
    seq.forEach(([f, t], i) =>
      tone(f, i === seq.length - 1 ? 700 : 200, {
        type: "triangle", vol: 0.07, delay: t
      }));
    // basso che sostiene
    tone(110, 1100, { type: "square", vol: 0.05, delay: 0 });
  }

  /* ---------- musica da PITCH BATTLE ----------
     Loop di 4 battute in LA minore (Am–F–C–E). Lead square con
     detune, basso pulsato. STEP = croma. Volume tenuto basso. */
  const MELODY = [
    // Am
    659, 0, 440, 523, 659, 0, 587, 523,
    // F
    523, 0, 440, 0, 349, 440, 523, 0,
    // C
    659, 0, 784, 659, 523, 0, 587, 659,
    // E
    494, 0, 659, 0, 587, 523, 494, 0
  ];
  const BASS = [
    110, 0, 165, 0, 110, 0, 165, 0,   // A
     87, 0, 131, 0,  87, 0, 131, 0,   // F
    131, 0, 196, 0, 131, 0, 196, 0,   // C
     82, 0, 123, 0,  82, 0, 123, 0    // E
  ];
  const STEP_MS = 150;
  let battleTimer = null;
  let battleStep = 0;

  function startBattleMusic() {
    if (battleTimer) return;
    ensureCtx();
    battleStep = 0;
    battleTimer = setInterval(() => {
      const i = battleStep % MELODY.length;
      const m = MELODY[i];
      const b = BASS[i];
      if (m) lead(m, 135, 0.045);
      if (b) tone(b, 145, { type: "square", vol: 0.05, attack: 0.004 });
      // accento ritmico leggero a inizio battuta
      if (i % 8 === 0) tone(1320, 40, { type: "square", vol: 0.02 });
      battleStep++;
    }, STEP_MS);
  }

  function stopBattleMusic() {
    if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
  }

  /* fanfara di vittoria (guardia crollata / deal firmato) */
  function fanfare() {
    if (muted) return;
    const seq = [[523, 0], [659, 0.10], [784, 0.20], [1046, 0.32], [784, 0.46], [1046, 0.56]];
    seq.forEach(([f, t], i) => lead(f, i >= 3 ? 360 : 130, 0.08));
    seq.forEach(([f, t], i) =>
      tone(f, i >= 3 ? 360 : 130, { type: "triangle", vol: 0.07, delay: t }));
    tone(262, 700, { type: "square", vol: 0.05, delay: 0 });
  }

  /* marcetta funebre (hai perso la sala): scende, in minore */
  function dirge() {
    if (muted) return;
    const seq = [[440, 0], [415, 0.26], [392, 0.52], [311, 0.84]];
    seq.forEach(([f, t], i) =>
      tone(f, i === 3 ? 800 : 240, { type: "sawtooth", vol: 0.06, delay: t }));
    tone(110, 1300, { type: "square", vol: 0.05, delay: 0.84 });
  }

  global.TVAudio = {
    pageChange: () => tone(740, 70, { type: "triangle", vol: 0.05, sweep: 980 }),
    keyPress:   tick,
    error:      () => tone(200, 220, { type: "sawtooth", vol: 0.06, sweep: 140 }),
    success:    () => { tone(880, 90, { type: "triangle", vol: 0.06 });
                        tone(1320, 140, { type: "triangle", vol: 0.06, delay: 0.09 }); },
    jingle:     jingle,
    startBattleMusic: startBattleMusic,
    stopBattleMusic:  stopBattleMusic,
    fanfare:    fanfare,
    dirge:      dirge,
    toggleMute() {
      muted = !muted;
      localStorage.setItem("tvc3000.muted", muted ? "1" : "0");
      if (muted) stopBattleMusic();
      return muted;
    },
    isMuted: () => muted
  };
})(window);
