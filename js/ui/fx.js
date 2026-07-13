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
