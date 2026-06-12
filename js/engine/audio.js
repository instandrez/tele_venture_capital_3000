/* Beep al cambio pagina — Web Audio API, niente file esterni.
   Toggle mute via localStorage["tvc3000.muted"]. */
(function (global) {
  let ctx = null;
  let muted = localStorage.getItem("tvc3000.muted") === "1";

  function ensureCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { ctx = null; }
    }
    return ctx;
  }

  function beep(freq, durMs, type) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "square";
    osc.frequency.value = freq || 880;
    gain.gain.setValueAtTime(0.08, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durMs / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + durMs / 1000);
  }

  /* Sigla d'apertura: melodia originale di 8 note, onda triangolare,
     vagamente da annuncio teletext anni '90. */
  function jingle() {
    if (muted) return;
    const notes = [523, 659, 784, 659, 784, 988, 784, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => beep(freq, i === notes.length - 1 ? 360 : 140, "triangle"),
                 i * 160);
    });
  }

  /* ---------- musica da PITCH BATTLE ----------
     Loop chiptune originale: melodia square + basso triangle,
     ~150 bpm, volume basso per non coprire i beep dei colpi.
     0 nelle sequenze = pausa. */
  const BATTLE_MELODY = [659, 0, 659, 587, 659, 0, 784, 0,
                         659, 0, 587, 523, 587, 0, 494, 0];
  const BATTLE_BASS   = [165, 0, 165, 0, 196, 0, 196, 0,
                         147, 0, 147, 0, 131, 0, 165, 0];
  const STEP_MS = 200;
  let battleTimer = null;
  let battleStep = 0;

  function battleNote(freq, durMs, type, vol) {
    if (muted) return;
    const c = ensureCtx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durMs / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + durMs / 1000);
  }

  function startBattleMusic() {
    if (battleTimer) return;
    battleStep = 0;
    battleTimer = setInterval(() => {
      const m = BATTLE_MELODY[battleStep % BATTLE_MELODY.length];
      const b = BATTLE_BASS[battleStep % BATTLE_BASS.length];
      if (m) battleNote(m, 160, "square", 0.025);
      if (b) battleNote(b, 190, "triangle", 0.05);
      battleStep++;
    }, STEP_MS);
  }

  function stopBattleMusic() {
    if (battleTimer) { clearInterval(battleTimer); battleTimer = null; }
  }

  /* fanfara di vittoria (guardia crollata / deal firmato) */
  function fanfare() {
    if (muted) return;
    const seq = [523, 659, 784, 1046, 784, 1046];
    seq.forEach((f, i) =>
      setTimeout(() => beep(f, i >= 4 ? 320 : 110, "triangle"), i * 120));
  }

  /* marcetta funebre (hai perso la sala) */
  function dirge() {
    if (muted) return;
    const seq = [392, 370, 349, 330];
    seq.forEach((f, i) =>
      setTimeout(() => beep(f, i === 3 ? 500 : 200, "sawtooth"), i * 240));
  }

  global.TVAudio = {
    pageChange: () => beep(1200, 70, "square"),
    keyPress:   () => beep(2000, 25, "square"),
    error:      () => beep(220, 180, "sawtooth"),
    success:    () => beep(1600, 120, "triangle"),
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
