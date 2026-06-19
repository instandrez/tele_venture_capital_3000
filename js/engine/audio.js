/* Audio PSG/chiptune via Web Audio API, senza file esterni.
   Firma sonora: due canali pulse, basso triangle e noise percussivo.
   Toggle mute via localStorage["tvc3000.muted"]. */
(function (global) {
  let ctx = null;
  let master = null;
  let musicBus = null;
  let sfxBus = null;
  let noiseBuffer = null;
  let muted = localStorage.getItem("tvc3000.muted") === "1";

  let battleTimer = null;
  let battleStep = 0;
  let nextBattleAt = 0;
  let battleWanted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      master = ctx.createGain();
      master.gain.value = muted ? 0.0001 : 0.62;

      musicBus = ctx.createGain();
      musicBus.gain.value = 0.42;

      sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.78;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 10;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.16;

      musicBus.connect(master);
      sfxBus.connect(master);
      master.connect(compressor).connect(ctx.destination);

      noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.35), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  function wake() {
    const c = ensureCtx();
    if (c && c.state === "suspended") c.resume().catch(() => {});
    return c;
  }

  function now(delay) {
    const c = wake();
    return c ? c.currentTime + (delay || 0) : 0;
  }

  function note(freq, dur, opts) {
    opts = opts || {};
    if (muted || !freq) return;
    const c = wake();
    if (!c) return;

    const at = Math.max(opts.at != null ? opts.at : c.currentTime, c.currentTime);
    const attack = opts.attack != null ? opts.attack : 0.004;
    const release = opts.release != null ? opts.release : 0.035;
    const volume = opts.volume != null ? opts.volume : 0.08;
    const end = at + dur;

    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = opts.wave || "square";
    osc.frequency.setValueAtTime(Math.max(20, freq), at);
    if (opts.slide) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), end);
    }

    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(volume, at + attack);
    gain.gain.setValueAtTime(volume, Math.max(at + attack, end - release));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(opts.bus === "music" ? musicBus : sfxBus);
    osc.start(at);
    osc.stop(end + 0.02);
  }

  function noise(dur, opts) {
    opts = opts || {};
    if (muted) return;
    const c = wake();
    if (!c || !noiseBuffer) return;

    const at = Math.max(opts.at != null ? opts.at : c.currentTime, c.currentTime);
    const source = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const gain = c.createGain();

    source.buffer = noiseBuffer;
    filter.type = opts.filterType || "highpass";
    filter.frequency.setValueAtTime(opts.frequency || 1800, at);
    gain.gain.setValueAtTime(opts.volume != null ? opts.volume : 0.035, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);

    source.connect(filter).connect(gain).connect(opts.bus === "music" ? musicBus : sfxBus);
    source.start(at);
    source.stop(at + dur + 0.02);
  }

  function sequence(items, opts) {
    opts = opts || {};
    if (muted) return;
    const start = now(opts.delay || 0);
    items.forEach(item => {
      const freq = item[0];
      const offset = item[1];
      const dur = item[2];
      note(freq, dur, {
        at: start + offset,
        wave: item[3] || opts.wave || "square",
        volume: item[4] != null ? item[4] : opts.volume,
        bus: opts.bus,
        attack: opts.attack,
        release: opts.release
      });
    });
  }

  function duckMusic(seconds) {
    if (!ctx || !musicBus) return;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(Math.max(0.08, musicBus.gain.value), t);
    musicBus.gain.exponentialRampToValueAtTime(0.12, t + 0.025);
    musicBus.gain.exponentialRampToValueAtTime(0.42, t + (seconds || 0.7));
  }

  // ---------- SFX ----------
  function keyPress() {
    const t = now();
    note(1175, 0.025, { at: t, wave: "square", volume: 0.035, release: 0.012 });
  }

  function pageChange() {
    const t = now();
    note(784, 0.055, { at: t, wave: "square", volume: 0.052, release: 0.02 });
    note(1175, 0.075, { at: t + 0.045, wave: "square", volume: 0.046, release: 0.025 });
    noise(0.035, { at: t, frequency: 3000, volume: 0.018 });
  }

  function error() {
    const t = now();
    note(196, 0.16, { at: t, wave: "sawtooth", volume: 0.07, slide: 110 });
    noise(0.08, { at: t + 0.02, frequency: 620, volume: 0.025, filterType: "lowpass" });
  }

  function success() {
    sequence([
      [659, 0.00, 0.07],
      [880, 0.07, 0.07],
      [1319, 0.14, 0.14]
    ], { wave: "square", volume: 0.052 });
  }

  function phoneRing() {
    if (muted) return;
    const t = now(0.02);
    [0, 0.52].forEach(offset => {
      note(440, 0.16, { at: t + offset, wave: "square", volume: 0.055 });
      note(554, 0.16, { at: t + offset + 0.17, wave: "square", volume: 0.05 });
      noise(0.025, { at: t + offset, frequency: 2600, volume: 0.012 });
    });
  }

  function lpOutcome(tone) {
    if (tone === "positive") {
      success();
      return;
    }
    if (tone === "negative") {
      dirge();
      return;
    }
    sequence([
      [392, 0.00, 0.09],
      [494, 0.10, 0.09],
      [440, 0.20, 0.16]
    ], { wave: "triangle", volume: 0.062 });
  }

  // ---------- Sigla ----------
  function jingle() {
    if (muted) return;
    const t = now(0.02);
    const lead = [
      [220, 0.00, 0.10], [330, 0.10, 0.10], [440, 0.20, 0.10],
      [523, 0.30, 0.12], [659, 0.43, 0.12], [784, 0.56, 0.12],
      [659, 0.69, 0.11], [880, 0.82, 0.34]
    ];
    lead.forEach(item =>
      note(item[0], item[2], { at: t + item[1], wave: "square", volume: 0.055 }));

    [110, 87, 131, 82].forEach((freq, i) =>
      note(freq, 0.23, {
        at: t + i * 0.24, wave: "triangle", volume: 0.095, release: 0.05
      }));

    [0, 0.24, 0.48, 0.72].forEach(offset =>
      noise(0.035, { at: t + offset, frequency: 4200, volume: 0.018 }));
  }

  // ---------- Pitch Battle ----------
  const BATTLE_LEAD = [
    440, 0, 523, 0, 659, 0, 523, 494,
    392, 0, 440, 0, 523, 0, 440, 392,
    523, 0, 659, 0, 784, 659, 587, 523,
    494, 0, 587, 0, 659, 587, 523, 494
  ];
  const BATTLE_BASS = [
    110, 0, 0, 165, 110, 0, 0, 165,
     87, 0, 0, 131,  87, 0, 0, 131,
    131, 0, 0, 196, 131, 0, 0, 196,
     82, 0, 0, 123,  82, 0, 0, 123
  ];
  const BATTLE_STEP = 60 / 132 / 4;

  function scheduleBattleStep(step, at) {
    const i = step % BATTLE_LEAD.length;
    const lead = BATTLE_LEAD[i];
    const bass = BATTLE_BASS[i];

    if (lead) {
      note(lead, BATTLE_STEP * 0.78, {
        at: at, wave: "square", volume: 0.052, bus: "music", release: 0.025
      });
    }
    if (bass) {
      note(bass, BATTLE_STEP * 1.7, {
        at: at, wave: "triangle", volume: 0.12, bus: "music", release: 0.04
      });
    }

    if (i % 8 === 0) {
      note(74, 0.07, {
        at: at, wave: "sine", volume: 0.13, bus: "music", slide: 42
      });
    }
    if (i % 8 === 4) {
      noise(0.075, {
        at: at, frequency: 1050, volume: 0.055, bus: "music", filterType: "bandpass"
      });
    } else if (i % 2 === 0) {
      noise(0.022, {
        at: at, frequency: 5200, volume: 0.015, bus: "music"
      });
    }
  }

  function pumpBattle() {
    if (!ctx || muted) return;
    while (nextBattleAt < ctx.currentTime + 0.14) {
      scheduleBattleStep(battleStep, nextBattleAt);
      battleStep += 1;
      nextBattleAt += BATTLE_STEP;
    }
  }

  function beginBattleScheduler() {
    const c = wake();
    if (!c || battleTimer || muted) return;
    battleStep = 0;
    nextBattleAt = c.currentTime + 0.06;
    pumpBattle();
    battleTimer = setInterval(pumpBattle, 30);
  }

  function haltBattleScheduler() {
    if (battleTimer) clearInterval(battleTimer);
    battleTimer = null;
  }

  function startBattleMusic() {
    battleWanted = true;
    beginBattleScheduler();
  }

  function stopBattleMusic() {
    battleWanted = false;
    haltBattleScheduler();
  }

  function fanfare() {
    if (muted) return;
    const t = now();
    duckMusic(1.05);
    const notes = [
      [523, 0.00, 0.11], [659, 0.11, 0.11], [784, 0.22, 0.11],
      [1047, 0.34, 0.18], [1319, 0.53, 0.38]
    ];
    notes.forEach(item =>
      note(item[0], item[2], { at: t + item[1], wave: "square", volume: 0.07 }));
    note(262, 0.88, { at: t, wave: "triangle", volume: 0.11, release: 0.1 });
    [0, 0.22, 0.53].forEach(offset =>
      noise(0.045, { at: t + offset, frequency: 3600, volume: 0.022 }));
  }

  function dirge() {
    if (muted) return;
    const t = now();
    duckMusic(1.45);
    [
      [440, 0.00, 0.23], [415, 0.26, 0.23],
      [349, 0.52, 0.28], [294, 0.84, 0.62]
    ].forEach(item =>
      note(item[0], item[2], {
        at: t + item[1], wave: "triangle", volume: 0.085, release: 0.08
      }));
    note(110, 1.38, {
      at: t, wave: "square", volume: 0.038, release: 0.12
    });
  }

  global.TVAudio = {
    pageChange,
    keyPress,
    error,
    success,
    phoneRing,
    lpOutcome,
    jingle,
    startBattleMusic,
    stopBattleMusic,
    fanfare,
    dirge,
    toggleMute() {
      muted = !muted;
      localStorage.setItem("tvc3000.muted", muted ? "1" : "0");
      const c = ensureCtx();
      if (c && master) {
        const t = c.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
        master.gain.exponentialRampToValueAtTime(muted ? 0.0001 : 0.62, t + 0.04);
      }
      if (muted) {
        haltBattleScheduler();
      } else {
        wake();
        if (battleWanted) beginBattleScheduler();
        setTimeout(success, 50);
      }
      return muted;
    },
    isMuted: () => muted
  };
})(window);
