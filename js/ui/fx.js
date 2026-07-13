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
