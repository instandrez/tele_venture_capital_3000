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
    const activeGame = !!(s && s.gameStarted && !s.gameOver);

    const lines = [];
    lines.push('<span class="home-logo"><span class="logo-vc">VC</span><span class="logo-3000">3000</span></span>');
    lines.push(r.color("c-magenta", r.center("VENTURE CAPITAL SIMULATOR")));
    lines.push(r.color("c-yellow", r.center("« il teletext che ti rovina il fondo »")));
    lines.push("");
    if (activeGame) {
      lines.push(r.bg("bg-cyan", "  FONDO ATTIVO                           "));
      lines.push("  " + r.color("c-yellow", (s.fundName || "Fund I").slice(0, 22)) +
                 "  " + r.color("c-white", "GP " + (s.nickname || "GP").slice(0, 12)));
      lines.push("  " + r.color("c-green", "200") + "  DEALFLOW DELL'ANNO    " +
                 r.color("c-yellow", "190") + "  TACCUINO");
      lines.push("  " + r.color("c-green", "400") + "  PORTFOLIO             " +
                 r.color("c-green", "600") + "  LP CALL");
      lines.push("  " + r.color("c-orange", "450") + "  FOLLOW-ON/FINE ANNO   " +
                 r.color("c-yellow", "105") + "  TUTORIAL");
      lines.push("  " + r.color("c-yellow", "109") + "  GESTIONE PARTITA      " +
                 r.color("c-white", "Anno " + s.year + "/" + s.maxYear));
    } else {
      lines.push(r.bg("bg-cyan", "  START / SYSTEM                         "));
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
    }
    lines.push(r.bg("bg-yellow", "  INTELLIGENCE NETWORK                   "));
    lines.push("  " + r.color("c-cyan", "110") + "  ULTIM'ORA   " +
               r.color("c-cyan", "140") + "  BORSA & INDICI");
    lines.push("  " + r.color("c-cyan", "120") + "  POLITICA    " +
               r.color("c-cyan", "160") + "  CRONACA STARTUP");
    lines.push("  " + r.color("c-cyan", "180") + "  CORPORATE WATCH");
    lines.push("  " + r.color("c-yellow", "190") + "  TACCUINO DEL GP " +
               r.color("c-white", "(CASI APERTI)"));
    lines.push(r.bg("bg-magenta", "  FUND OPERATIONS                        "));
    lines.push("  " + r.color("c-green", "200") + "  DEALFLOW       " +
               r.color("c-green", "400") + "  PORTFOLIO");
    lines.push("  " + r.color("c-green", "600") + "  LP CALL        " +
               r.color("c-green", "800") + "  CLASSIFICA");
    // notifica LP call attiva se partita in corso
    const alert = r.lpAlert(TVState.current);
    if (alert) lines.push(alert);
    lines.push(r.color("c-white", r.center("PAGINA + INVIO  •  ESC HOME  •  M AUDIO")));

    r.show(100, lines.join("\n"), { title: activeGame ? "FONDO ATTIVO" : "MAIN MENU" });
    TVState.current.currentPage = 100;
  }

  global.TVPages = global.TVPages || {};
  global.TVPages[100] = { render };
})(window);
