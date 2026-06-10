/* Pagina 100 — Home / Indice principale stile Televideo. */
(function (global) {
  function render() {
    const r = TVRender;
    const s = TVState.current;
    // Controlla anche il save su disco, non solo lo stato in memoria
    let savedYear = null, savedMax = 5;
    if (TVState.hasSave()) {
      try {
        const raw = JSON.parse(localStorage.getItem("tvc3000.save"));
        if (raw && raw.gameStarted && !raw.gameOver) {
          savedYear = raw.year;
          savedMax = raw.maxYear || 5;
        }
      } catch (e) {}
    }
    const hasSave = savedYear !== null;

    const lines = [];
    lines.push(r.color("c-yellow", r.center("« il televideo che ti rovina il fondo »")));
    lines.push("");
    lines.push(r.bg("bg-cyan", "  INDICE                                "));
    lines.push("  " + r.color("c-yellow", "101") + "  NUOVO FONDO");
    if (hasSave) {
      lines.push("  " + r.color("c-yellow", "102") + "  RIPRENDI PARTITA  " +
                 r.color("c-green", "(Anno " + savedYear + "/" + savedMax + ")"));
    } else {
      lines.push("  " + r.color("c-white", "102") + "  RIPRENDI PARTITA  " +
                 r.color("c-magenta", "(nessun save)"));
    }
    lines.push("  " + r.color("c-yellow", "103") + "  REGOLE DEL GIOCO");
    lines.push("  " + r.color("c-yellow", "109") + "  GESTIONE PARTITA");
    lines.push("");
    lines.push(r.bg("bg-yellow", "  TELEVIDEO INFORMATIVO                 "));
    lines.push("  " + r.color("c-cyan", "110") + "  ULTIM'ORA   " +
               r.color("c-cyan", "140") + "  BORSA & INDICI");
    lines.push("  " + r.color("c-cyan", "120") + "  POLITICA    " +
               r.color("c-cyan", "160") + "  CRONACA STARTUP");
    lines.push("  " + r.color("c-cyan", "180") + "  CORPORATE WATCH");
    lines.push("");
    lines.push(r.bg("bg-magenta", "  GIOCO                                  "));
    lines.push("  " + r.color("c-green", "200") + "  DEALFLOW       " +
               r.color("c-green", "400") + "  PORTFOLIO");
    lines.push("  " + r.color("c-green", "600") + "  LP CALL        " +
               r.color("c-green", "800") + "  CLASSIFICA");
    lines.push("");
    // notifica LP call attiva se partita in corso
    if (hasSave && typeof TVLPCalls !== "undefined" && TVState.current && TVState.current.gameStarted) {
      try {
        const pending = TVLPCalls.pickCallsForYear(TVState.current);
        if (pending && pending.length > 0) {
          lines.push(r.color("c-red", " " + '<span class="blink">[!]</span>') +
                     r.color("c-yellow", " hai " + pending.length + " LP call attive — vai a 600"));
        }
      } catch (e) {}
    }
    lines.push(r.color("c-white", r.center("digita il numero pagina + INVIO  •  M=audio")));

    r.show(100, lines.join("\n"));
    TVState.current.currentPage = 100;
  }

  global.TVPages = global.TVPages || {};
  global.TVPages[100] = { render };
})(window);
