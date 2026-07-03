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
    lines.push(" " + r.color("c-yellow", "10M€") + " coprono fee e struttura.");
    lines.push(" Dry powder investibile: " + r.color("c-green", "90M€") + ".");
    lines.push(" Gli LP si aspettano:");
    lines.push("");
    lines.push(r.color("c-cyan", "  · rendimenti a doppia cifra"));
    lines.push(r.color("c-cyan", "  · disciplina nei ticket"));
    lines.push(r.color("c-cyan", "  · slide trimestrali"));
    lines.push(r.color("c-cyan", "    con frecce verso l'alto"));
    lines.push("");
    lines.push(" Hai " + r.color("c-yellow", "3 anni") + " per dimostrare di non essere");
    lines.push(" l'ennesimo VC che parla di " + r.color("c-magenta", "tesi") + ".");
    lines.push("");
    lines.push(r.bg("bg-yellow", " 1 AVVIA FONDO    9 INDIETRO            "));

    r.show(pageNum, lines.join("\n"), { title: "NUOVO FONDO" });

    // input contestuale
    TVRouter.setActionHandler(num => {
      if (num === 1) {
        TVState.newGame();
        TVRouter.goto(105); // sigla d'apertura, poi indice del terminale
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
  function renderRules(pageNum) {
    const r = TVRender;
    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("REGOLE", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " OBIETTIVO"));
    lines.push(" Gestire un fondo VC da 100M€ per 3 anni.");
    lines.push(" Alla fine: punteggio e classifica.");
    lines.push("");
    lines.push(r.color("c-yellow", " COMANDI"));
    lines.push(" Pagina + INVIO · ESC home · M audio");
    lines.push("");
    lines.push(r.color("c-yellow", " IL TACCUINO - PAG 190"));
    lines.push(" Il Televideo e' il tuo vantaggio.");
    lines.push(" Alcune pagine diventano ritagli.");
    lines.push(" Il taccuino conserva le coincidenze,");
    lines.push(" ma non spiega dove cercare o perche'.");
    lines.push(" Due ritagli indipendenti aprono");
    lines.push(" una FONTE RISERVATA 9xx.");
    lines.push(" Ascoltarla migliora DD e battle.");
    lines.push("");
    lines.push(r.color("c-yellow", " GLI LP TI CHIAMANO"));
    lines.push(" Quando il portfolio li innervosisce");
    lines.push(" (o li esalta) parte la chiamata:");
    lines.push(" \"((( LP IN LINEA )))\" lampeggia.");
    lines.push(" Rispondi a pag 600 prima di chiudere");
    lines.push(" l'anno: ignorarli ha un costo.");
    lines.push("");
    lines.push(r.color("c-yellow", " PORTFOLIO COMPANY CALL"));
    lines.push(" Le partecipate possono chiamarti con");
    lines.push(" crisi operative: bridge, tagli, pivot.");
    lines.push(" Quelle scelte pesano su multipli e score.");
    lines.push("");
    lines.push(r.color("c-yellow", " PITCH BATTLE"));
    lines.push(" Guardia founder a 0: si scopre.");
    lines.push(" Controllo sala a 0: perdi il deal.");
    lines.push(" Ogni domanda costa 1 controllo.");
    lines.push(" I ticket cambiano con lo stage.");
    lines.push(" Il target di deployment cresce ogni anno.");
    lines.push(r.color("c-white", " 100 HOME   190 INTEL   105 SIGLA"));

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
