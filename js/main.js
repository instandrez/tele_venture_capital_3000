/* main.js — bootstrap, router pagine, input handler.
   Naviga digitando un numero e premendo Enter. */
(function (global) {

  let actionHandler = null;

  const router = {
    setActionHandler(fn) { actionHandler = fn; },
    flash(msg) { flashFooter(msg); },
    goto(pageNum, opts) {
      opts = opts || {};
      pageNum = parseInt(pageNum, 10);
      if (isNaN(pageNum)) return;

      // se non esiste una pagina specifica, prova fallback per range
      const page = resolvePage(pageNum);
      if (!page) {
        TVAudio.error();
        showNotFound(pageNum);
        return;
      }

      const doRender = () => {
        actionHandler = null; // resetta su ogni cambio pagina
        // Stato PRIMA del render: se la pagina fa redirect durante il
        // render (goto annidato), il suo currentPage deve restare quello
        // finale e non essere sovrascritto da questo goto esterno.
        if (TVState.current) {
          TVState.current.previousPage = TVState.current.currentPage;
          TVState.current.currentPage = pageNum;
          // log lettura news per "edge informativo": qualsiasi pagina
          // che corrisponde a una news del calendario (tutti gli anni)
          if (typeof TVNews !== "undefined" && TVNews.byPage(pageNum)) {
            const rp = TVState.current.readPages;
            if (rp && !rp.includes(pageNum)) rp.push(pageNum);
          }
        }
        try { page.render(pageNum); }
        catch (e) {
          console.error("page render error", e);
          showError(pageNum, e.message);
        }
        // Salva SOLO se è una partita realmente avviata
        if (TVState.current && TVState.current.gameStarted) TVState.save();
      };

      if (opts.skipLoading) doRender();
      else TVLoading.play(pageNum, doRender);
    }
  };

  function resolvePage(pageNum) {
    const P = global.TVPages || {};
    if (P[pageNum]) return P[pageNum];
    // fallback per range (sotto-pagine es. 301, 302... → 300)
    const base = Math.floor(pageNum / 100) * 100;
    if (P[base]) return P[base];
    return null;
  }

  function showNotFound(pageNum) {
    const r = TVRender;
    const html = [
      "",
      "",
      "",
      r.center(r.color("c-red", "PAGINA " + pageNum + " NON DISPONIBILE")),
      "",
      r.center(r.color("c-white", "il servizio sarà disponibile")),
      r.center(r.color("c-white", "non appena ci ricorderemo di scriverla")),
      "",
      "",
      r.center(r.color("c-yellow", "premi 100 per tornare alla home"))
    ].join("\n");
    TVRender.show(pageNum, html);
  }

  function showError(pageNum, msg) {
    const r = TVRender;
    const html = [
      "",
      r.center(r.color("c-red", "ERRORE DI SISTEMA")),
      "",
      r.center(r.color("c-yellow", msg || "errore sconosciuto")),
      "",
      r.center(r.color("c-white", "torna alla home digitando 100"))
    ].join("\n");
    TVRender.show(pageNum, html);
  }

  // ---------- input handler ----------
  let buffer = "";

  function updateInputDisplay() {
    const el = document.getElementById("tv-input");
    if (el) el.textContent = buffer;
  }

  function handleKey(e) {
    const key = e.key;
    if (key >= "0" && key <= "9") {
      if (buffer.length < 3) {
        buffer += key;
        TVAudio.keyPress();
        updateInputDisplay();
      }
      e.preventDefault();
    } else if (key === "Enter") {
      if (buffer.length > 0) {
        const target = parseInt(buffer, 10);
        const len = buffer.length;
        buffer = "";
        updateInputDisplay();
        // 1 cifra + actionHandler attivo → azione contestuale
        if (len === 1 && actionHandler) {
          try { actionHandler(target); }
          catch (err) { console.error("action handler", err); }
        } else {
          router.goto(target);
        }
      }
      e.preventDefault();
    } else if (key === "Backspace") {
      buffer = buffer.slice(0, -1);
      updateInputDisplay();
      e.preventDefault();
    } else if (key === "Escape") {
      buffer = "";
      updateInputDisplay();
      router.goto(100);
      e.preventDefault();
    } else if (key === "m" || key === "M") {
      const muted = TVAudio.toggleMute();
      flashFooter(muted ? "AUDIO: OFF" : "AUDIO: ON");
    }
  }

  function flashFooter(msg) {
    const el = document.getElementById("tv-input");
    if (!el) return;
    const old = el.textContent;
    el.textContent = msg;
    setTimeout(() => { el.textContent = old; }, 900);
  }

  // ---------- bootstrap ----------
  function boot() {
    TVState.init();
    TVHeader.start();
    document.addEventListener("keydown", handleKey);
    router.goto(100, { skipLoading: true });
  }

  global.TVRouter = router;
  document.addEventListener("DOMContentLoaded", boot);
})(window);
