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

  global.TVAudio = {
    pageChange: () => beep(1200, 70, "square"),
    keyPress:   () => beep(2000, 25, "square"),
    error:      () => beep(220, 180, "sawtooth"),
    success:    () => beep(1600, 120, "triangle"),
    toggleMute() {
      muted = !muted;
      localStorage.setItem("tvc3000.muted", muted ? "1" : "0");
      return muted;
    },
    isMuted: () => muted
  };
})(window);
