/* Pagine 101 (Nuovo Fondo), 102 (Riprendi), 103 (Regole), 109 (Gestione Partita). */
(function (global) {

  // ---------- 101 Nuovo Fondo ----------
  function renderNewFund(pageNum) {
    const r = TVRender;
    const lines = [];
    lines.push(r.bg("bg-blue", "  " + r.pad("NUOVO FONDO", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " BENVENUTO, GP."));
    lines.push("");
    lines.push(" Hai chiuso un fundraising da " + r.color("c-green", "100M€") + ".");
    lines.push(" Gli LP si aspettano:");
    lines.push("");
    lines.push(r.color("c-cyan", "  · rendimenti a doppia cifra"));
    lines.push(r.color("c-cyan", "  · disciplina nei ticket"));
    lines.push(r.color("c-cyan", "  · slide trimestrali"));
    lines.push(r.color("c-cyan", "    con frecce verso l'alto"));
    lines.push("");
    lines.push(" Hai " + r.color("c-yellow", "5 anni") + " per dimostrare di non essere");
    lines.push(" l'ennesimo VC che parla di " + r.color("c-magenta", "tesi") + ".");
    lines.push("");
    lines.push(r.bg("bg-yellow", " 1 AVVIA FONDO    9 INDIETRO            "));

    r.show(pageNum, lines.join("\n"), { title: "NUOVO FONDO" });

    // input contestuale
    TVRouter.setActionHandler(num => {
      if (num === 1) {
        TVState.newGame();
        TVRouter.goto(200);
      } else if (num === 9) {
        TVRouter.goto(100);
      }
    });
  }

  // ---------- 102 Riprendi ----------
  function renderResume(pageNum) {
    const r = TVRender;
    const loaded = TVState.load();
    if (!loaded || !TVState.current.gameStarted) {
      const lines = [
        "",
        "",
        r.center(r.color("c-red", "NESSUNA PARTITA SALVATA")),
        "",
        r.center(r.color("c-white", "torna alla home con 100")),
        r.center(r.color("c-white", "e avvia un nuovo fondo con 101"))
      ];
      r.show(pageNum, lines.join("\n"), { title: "RIPRENDI" });
      return;
    }
    // Vai direttamente al dealflow corrente
    TVRouter.goto(200, { skipLoading: true });
  }

  // ---------- 103 Regole ----------
  // Nessuno spoiler sul motore: il giocatore deve scoprire da solo
  // che ogni informazione del Televideo entra nel modello.
  function renderRules(pageNum) {
    const r = TVRender;
    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("REGOLE", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " OBIETTIVO"));
    lines.push(" Gestire un fondo VC da 100M€ per 5 anni.");
    lines.push(" Alla fine: punteggio e classifica.");
    lines.push("");
    lines.push(r.color("c-yellow", " COMANDI"));
    lines.push(" Digita un numero di pagina e INVIO.");
    lines.push(" ESC torna alla home.  M muta l'audio.");
    lines.push("");
    lines.push(r.color("c-yellow", " METRICHE"));
    lines.push(" MOIC  rapporto valore/capitale investito");
    lines.push(" DPI   ritorni distribuiti / investito");
    lines.push(" LP    soddisfazione dei tuoi investitori");
    lines.push(" REP   reputazione nell'ecosistema");
    lines.push(" IMP   impatto innovazione");
    lines.push("");
    lines.push(r.color("c-magenta", " UN CONSIGLIO"));
    lines.push(" Il Televideo è pieno di pagine.");
    lines.push(" Nessuna è lì per caso.");
    lines.push("");
    lines.push(r.color("c-white", " 100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "REGOLE" });
  }

  // ---------- 109 Gestione Partita ----------
  function renderManage(pageNum) {
    const r = TVRender;
    const hasSave = TVState.hasSave();
    const lines = [];
    lines.push(r.bg("bg-magenta", "  " + r.pad("GESTIONE PARTITA", 38)));
    lines.push("");
    lines.push(" Save attuale: " + (hasSave ? r.color("c-green", "presente") : r.color("c-magenta", "assente")));
    lines.push("");
    lines.push(" " + r.color("c-yellow", "1") + "  Cancella salvataggio");
    lines.push(" " + r.color("c-yellow", "2") + "  Esporta save (in clipboard)");
    lines.push(" " + r.color("c-yellow", "3") + "  Importa save (incolla in prompt)");
    lines.push(" " + r.color("c-yellow", "M") + "  Toggle audio (anche da altre pagine)");
    lines.push("");
    lines.push(" Audio attuale: " + (TVAudio.isMuted() ? r.color("c-red", "OFF") : r.color("c-green", "ON")));
    lines.push("");
    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "GESTIONE PARTITA" });

    TVRouter.setActionHandler(num => {
      if (num === 1) {
        TVState.clear();
        TVRouter.flash("SAVE CANCELLATO");
        renderManage(pageNum);
      } else if (num === 2) {
        const exp = TVState.exportSave();
        if (exp && navigator.clipboard) {
          navigator.clipboard.writeText(exp).then(() => TVRouter.flash("COPIATO IN CLIPBOARD"));
        } else {
          prompt("Save export:", exp);
        }
      } else if (num === 3) {
        const v = prompt("Incolla save export:");
        if (v && TVState.importSave(v.trim())) {
          TVRouter.flash("SAVE IMPORTATO");
          renderManage(pageNum);
        } else if (v) {
          TVRouter.flash("SAVE NON VALIDO");
        }
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[101] = { render: renderNewFund };
  P[102] = { render: renderResume };
  P[103] = { render: renderRules };
  P[109] = { render: renderManage };
})(window);
