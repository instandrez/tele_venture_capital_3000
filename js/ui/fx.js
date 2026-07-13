/* =========================================================
   VC3000 — FX LAYER (solo grafica)

   Effetti presentazionali che si agganciano DALL'ESTERNO ai
   moduli esistenti (wrap di TVRender/TVLoading + observer sul
   DOM). Nessuna logica di gioco vive qui e nessun altro file
   dipende da questo.

   ROLLBACK: per spegnere TUTTO basta rimuovere il tag <script>
   di questo file da index.html. Ogni effetto e' un blocco
   IIFE indipendente in fondo al file: si puo' cancellare un
   singolo blocco senza toccare gli altri.
   ========================================================= */
(function (global) {
  "use strict";

  const FX = {
    reduced: false,
    // sostituisce obj[key] con makeWrapper(fnOriginale), se esiste
    wrap(obj, key, makeWrapper) {
      if (!obj || typeof obj[key] !== "function") return;
      const orig = obj[key];
      obj[key] = makeWrapper(orig);
    },
    screen() { return document.getElementById("screen"); },
    stage() { return document.getElementById("console-stage"); }
  };

  try {
    FX.reduced = !!(global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  } catch (e) {}

  global.TVFX = FX;
})(window);

/* ---------- FX: cambio canale (burst di statico) ----------
   Neve TV di ~200ms quando si salta a un'altra sezione o si
   digita una pagina inesistente. */
(function (global) {
  const FX = global.TVFX;
  if (!FX || !global.TVRender) return;

  function section() {
    const s = FX.screen();
    if (!s) return null;
    return s.classList.contains("console-mode") ? "console" : s.dataset.section;
  }

  function staticBurst(long) {
    if (FX.reduced) return;
    const s = FX.screen();
    if (!s) return;
    const prev = s.querySelector(".fx-static");
    if (prev) prev.remove();
    const el = document.createElement("div");
    el.className = "fx-static" + (long ? " is-long" : "");
    el.setAttribute("aria-hidden", "true");
    s.appendChild(el);
    setTimeout(() => el.remove(), long ? 380 : 240);
  }
  FX.staticBurst = staticBurst;

  function withBurst(orig) {
    return function (pageNum, html, opts) {
      const before = section();
      orig(pageNum, html, opts);
      const after = section();
      if (typeof html === "string" && html.indexOf("NON DISPONIBILE") !== -1) {
        staticBurst(true);
      } else if (before && after && before !== after) {
        staticBurst(false);
      }
    };
  }
  FX.wrap(global.TVRender, "show", withBurst);
  FX.wrap(global.TVRender, "showScene", withBurst);
})(window);

/* ---------- FX: il numero di pagina "cerca" durante il caricamento ----------
   Come il Televideo vero: mentre la pagina carica, P.xxx cicla
   numeri a caso e converge su quello richiesto. */
(function (global) {
  const FX = global.TVFX;
  if (!FX || !global.TVLoading) return;

  FX.wrap(global.TVLoading, "play", orig => function (pageNum, then) {
    const hdr = document.getElementById("hdr-page");
    if (FX.reduced || !hdr) { orig(pageNum, then); return; }
    const timer = setInterval(() => {
      hdr.textContent = "P." + (100 + Math.floor(Math.random() * 799));
    }, 55);
    orig(pageNum, function () {
      clearInterval(timer);
      hdr.textContent = "P." + pageNum;
      then();
    });
  });
})(window);

/* ---------- FX: battle juice ----------
   Legge lo stato dei fighter dal DOM (nessun accesso alla logica):
   - barra "fantasma" che mostra il danno appena subito
   - contatore di danno fluttuante stile JRPG
   - hit-stop: impact frame congelato ~85ms su shake/flash */
(function (global) {
  const FX = global.TVFX;
  if (!FX) return;

  const roles = ["player", "founder"];
  const S = {
    hp: { player: null, founder: null },
    pct: { player: null, founder: null },
    ghost: { player: null, founder: null },
    hold: { player: 0, founder: 0 },
    counter: { player: null, founder: null },
    raf: null,
    last: 0
  };

  function fighterEl(role) {
    const stage = FX.stage();
    return stage ? stage.querySelector(".fighter-" + role) : null;
  }

  function readHp(el) {
    const label = el.querySelector(".hud-name span:last-child");
    const m = label && label.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { hp: +m[1], max: Math.max(1, +m[2]) } : null;
  }

  function applyGhost(role) {
    const el = fighterEl(role);
    const track = el && el.querySelector(".hp-track");
    if (track && S.ghost[role] != null) {
      track.style.setProperty("--hp-ghost", S.ghost[role].toFixed(2) + "%");
    }
  }

  function decayLoop(ts) {
    S.raf = null;
    const dt = Math.min(0.1, (ts - S.last) / 1000 || 0);
    S.last = ts;
    let busy = false;
    roles.forEach(role => {
      if (S.ghost[role] == null || S.pct[role] == null) return;
      if (S.ghost[role] > S.pct[role]) {
        if (ts >= S.hold[role]) {
          S.ghost[role] = Math.max(S.pct[role], S.ghost[role] - 55 * dt);
        }
        applyGhost(role);
        if (S.ghost[role] > S.pct[role]) busy = true;
      }
    });
    if (busy) S.raf = requestAnimationFrame(decayLoop);
  }

  function kickDecay() {
    if (S.raf) return;
    S.last = performance.now();
    S.raf = requestAnimationFrame(decayLoop);
  }

  function killCounter(role, instant) {
    const c = S.counter[role];
    if (!c) return;
    S.counter[role] = null;
    clearTimeout(c.settle);
    if (instant) { c.el.remove(); return; }
    c.el.classList.add("is-done");
    setTimeout(() => c.el.remove(), 650);
  }

  function positionCounter(role, el) {
    const screen = FX.screen();
    const fighter = fighterEl(role);
    const art = fighter && fighter.querySelector(".fighter-art");
    if (!screen || !art) return false;
    const sr = screen.getBoundingClientRect();
    const ar = art.getBoundingClientRect();
    el.style.left = (ar.left - sr.left + ar.width / 2) + "px";
    el.style.top = Math.max(4, ar.top - sr.top - 8) + "px";
    return true;
  }

  function bumpCounter(role, delta) {
    if (FX.reduced || !delta) return;
    const dir = delta > 0 ? 1 : -1; // 1 = danno, -1 = recupero
    let c = S.counter[role];
    if (c && c.dir !== dir) { killCounter(role); c = null; }
    if (!c) {
      const el = document.createElement("div");
      el.className = "fx-dmg" +
        (dir > 0 ? (role === "player" ? " is-hurt" : "") : " is-heal");
      el.setAttribute("aria-hidden", "true");
      if (!positionCounter(role, el)) return;
      FX.screen().appendChild(el);
      c = S.counter[role] = { el, total: 0, dir, settle: null };
    }
    c.total += Math.abs(delta);
    c.el.textContent = (dir > 0 ? "-" : "+") + c.total;
    c.el.classList.remove("is-tick");
    void c.el.offsetWidth;
    c.el.classList.add("is-tick");
    clearTimeout(c.settle);
    c.settle = setTimeout(() => killCounter(role), 480);
  }

  function reset() {
    roles.forEach(role => {
      S.hp[role] = S.pct[role] = S.ghost[role] = null;
      killCounter(role, true);
    });
  }

  function sync() {
    const stage = FX.stage();
    if (!stage || !stage.querySelector(".battle-scene")) { reset(); return; }
    roles.forEach(role => {
      const el = fighterEl(role);
      const v = el && readHp(el);
      if (!v) return;
      const pct = (v.hp / v.max) * 100;
      S.pct[role] = pct;
      if (S.hp[role] == null) {
        S.ghost[role] = pct; // ingresso in battle: nessun effetto
      } else if (v.hp !== S.hp[role]) {
        const oldPct = (S.hp[role] / v.max) * 100;
        bumpCounter(role, S.hp[role] - v.hp);
        if (v.hp < S.hp[role]) {
          if (S.ghost[role] == null || S.ghost[role] < oldPct) S.ghost[role] = oldPct;
          S.hold[role] = performance.now() + 320;
          kickDecay();
        } else {
          S.ghost[role] = pct;
        }
      }
      S.hp[role] = v.hp;
      applyGhost(role);
    });
  }

  let lastStop = 0;
  function hitStop() {
    if (FX.reduced) return;
    const now = performance.now();
    if (now - lastStop < 200) return;
    lastStop = now;
    const stage = FX.stage();
    if (!stage) return;
    stage.classList.add("fx-hitstop");
    setTimeout(() => stage.classList.remove("fx-hitstop"), 85);
  }

  const stage = FX.stage();
  if (!stage) return;
  new MutationObserver(sync).observe(stage, { childList: true });
  new MutationObserver(muts => {
    muts.forEach(m => {
      const old = m.oldValue || "";
      const had = old.indexOf("shake") !== -1 || old.indexOf("crt-flash") !== -1;
      const has = stage.classList.contains("shake") ||
                  stage.classList.contains("crt-flash");
      if (!had && has) hitStop();
    });
  }).observe(stage, {
    attributes: true, attributeFilter: ["class"], attributeOldValue: true
  });
})(window);

/* ---------- FX: score finale con count-up ----------
   Il punteggio del report finale sale a scatti da 0, stile
   contatore da flipper. */
(function (global) {
  const FX = global.TVFX;
  if (!FX) return;
  let lastRun = 0;

  function animate(el) {
    const node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    const raw = node.nodeValue.trim();
    const target = parseInt(raw, 10);
    if (isNaN(target)) return;
    const pad = raw.length;
    const t0 = performance.now();
    const DUR = 1150;
    const timer = setInterval(() => {
      if (!node.parentNode) { clearInterval(timer); return; }
      const t = Math.min(1, (performance.now() - t0) / DUR);
      const eased = 1 - Math.pow(1 - t, 3);
      node.nodeValue = String(Math.round(target * eased)).padStart(pad, "0");
      if (t >= 1) clearInterval(timer);
    }, 55);
  }

  const stage = FX.stage();
  if (!stage) return;
  new MutationObserver(() => {
    const el = stage.querySelector(".end-score");
    if (!el || el.dataset.fxCount) return;
    el.dataset.fxCount = "1";
    if (FX.reduced) return;
    const now = Date.now();
    if (now - lastRun < 4000) return; // ridisegni ravvicinati: niente replay
    lastRun = now;
    animate(el);
  }).observe(stage, { childList: true });
})(window);

/* ---------- FX: ticker ULTIM'ORA in home 100 ----------
   Striscia scorrevole con i titoli dell'anno in corso, per dare
   vita alla home e spingere verso le pagine news. Solo desktop. */
(function (global) {
  const FX = global.TVFX;
  if (!FX || !global.TVRender) return;

  function headlines() {
    try {
      const news = global.TVNews;
      if (!news || !news.byYear) return [];
      const st = global.TVState && global.TVState.current;
      const year = st && st.gameStarted && !st.gameOver ? st.year : 1;
      const pool = news.byYear(year).slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
      }
      return pool.slice(0, 6).map(n => n.headline + " · pag." + n.section);
    } catch (e) { return []; }
  }

  function inject() {
    if (FX.reduced) return;
    try {
      if (global.matchMedia("(max-width: 700px)").matches) return;
    } catch (e) {}
    const content = document.getElementById("tv-content");
    if (!content) return;
    const heads = headlines();
    if (!heads.length) return;
    const el = document.createElement("div");
    el.className = "fx-ticker";
    el.setAttribute("aria-hidden", "true");
    const span = document.createElement("span");
    span.textContent = "+++ " + heads.join(" +++ ") + " +++";
    el.appendChild(span);
    content.appendChild(el);
  }

  FX.wrap(global.TVRender, "show", orig => function (pageNum, html, opts) {
    orig(pageNum, html, opts);
    if (pageNum === 100) inject();
  });
})(window);
