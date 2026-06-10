/* Effetto finto caricamento pagina, stile Televideo anni '90.
   Mostra "CARICAMENTO PAGINA XXX" con barra che si riempie. */
(function (global) {
  const R = () => global.TVRender;

  function loadingHtml(pageNum, progress) {
    const W = 30;
    const filled = Math.round(progress * W);
    const bar = "█".repeat(filled) + "░".repeat(W - filled);
    const r = R();
    return [
      "",
      "",
      "",
      "",
      "",
      r.center(r.color("c-cyan", "CARICAMENTO PAGINA " + pageNum)),
      "",
      r.center('<span class="loading-bar">' + bar + "</span>"),
      "",
      r.center(r.color("c-white", Math.round(progress * 100) + "%"))
    ].join("\n");
  }

  global.TVLoading = {
    play(pageNum, then) {
      const content = document.getElementById("tv-content");
      if (!content) { then(); return; }
      const steps = 5;
      let i = 0;
      const tick = () => {
        i++;
        const p = i / steps;
        content.innerHTML = loadingHtml(pageNum, p);
        if (i < steps) {
          setTimeout(tick, 60);
        } else {
          TVAudio.pageChange();
          setTimeout(then, 80);
        }
      };
      tick();
    }
  };
})(window);
