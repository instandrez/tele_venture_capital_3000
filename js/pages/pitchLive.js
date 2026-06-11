/* PITCH LIVE — la UI della battaglia col founder.

   Non è una pagina del router: vive dentro la scheda startup
   (3XX) come sotto-stato. Il pitch si consuma all'avvio
   (rv.pitchPlayed): ricaricare il save a metà sessione non
   regala un secondo tentativo. L'esito persiste in rv.pitchWon /
   rv.pitchLost / rv.pitchTruth e incide sulla negoziazione. */
(function (global) {

  let battle = null;      // stato transiente della sessione
  let currentStartup = null;
  let exitFn = null;      // come tornare alla scheda

  function bar(value, max, cls) {
    const r = TVRender;
    return r.color(cls, "█".repeat(value)) +
           r.color("c-blue", "░".repeat(max - value));
  }

  function openLine(p, turn) {
    return p.open[turn % p.open.length];
  }

  function outcomeLine(outcome) {
    const r = TVRender;
    switch (outcome) {
      case "weak":    return r.color("c-green", " » COLPITO. La guardia cede di brutto.");
      case "resist":  return r.color("c-red",   " » PARATA. La sala ti guarda male.");
      default:        return r.color("c-cyan",  " » Segni qualcosa sul taccuino.");
    }
  }

  function start(st, pageNum, onExit) {
    currentStartup = st;
    exitFn = onExit;
    battle = TVPitchBattle.newBattle(st.founderProfile);
    TVAudio.success();
    render(pageNum);
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    const st = currentStartup;
    const b = battle;
    const p = TVPitchBattle.PROFILES[b.profile];

    if (b.over) { renderEnd(pageNum); return; }

    const lines = [];
    lines.push(r.bg("bg-magenta", "  " + r.pad("PITCH LIVE — " + st.name, 38)));
    lines.push(" FOUNDER " + bar(b.guard, TVPitchBattle.GUARD_MAX, "c-yellow") +
               r.color("c-white", "  guardia"));
    lines.push(" TU      " + bar(b.cred, TVPitchBattle.CRED_MAX, "c-green") +
               r.color("c-white", "  credibilita'"));
    lines.push(r.color("c-blue", " " + "─".repeat(38)));

    if (b.turn === 0) {
      // apertura: il founder pitcha
      lines.push(" " + r.color("c-white", "Il founder attacca il pitch:"));
      lines.push(" " + r.color("c-yellow", '"' + openLine(p, 0) + '"'));
      if (p.open[1]) lines.push(" " + r.color("c-yellow", '"' + p.open[1] + '"'));
    } else {
      // esito dell'ultima mossa
      const reaction = p.react[b.lastMove] || "";
      lines.push(outcomeLine(b.lastOutcome));
      wrap(reaction, 37).forEach(l => lines.push(" " + r.color("c-white", l)));
      lines.push("");
      lines.push(" " + r.color("c-magenta", "FOUNDER usa " + p.attack + "!"));
      lines.push(" " + r.color("c-white", p.attackLine));
    }

    // hint dalla ref call, se pagata: sinergia tra meccaniche
    const rv = (s.startupReveals || {})[st.id] || {};
    if (rv.refCall) {
      lines.push("");
      lines.push(" " + r.color("c-cyan", "ref call: profilo '" + profileLabel(b.profile) + "'"));
    }

    while (lines.length < 15) lines.push("");
    lines.push(r.bg("bg-blue", "  " + r.pad("LE TUE MOSSE", 38)));
    lines.push(" " + r.color("c-yellow", "1") + " I NUMERI, PREGO");
    lines.push(" " + r.color("c-yellow", "2") + " E I COMPETITOR?");
    lines.push(" " + r.color("c-yellow", "3") + " PARLAMI DEL TEAM");
    lines.push(" " + r.color("c-yellow", "4") + " SILENZIO IMBARAZZANTE");
    lines.push(" " + r.color("c-white", "0 alzati e vattene (niente verita')"));

    r.show(pageNum, lines.join("\n"), { title: "PITCH LIVE" });

    TVRouter.setActionHandler(num => {
      if (num === 0) { abort(); return; }
      if (num >= 1 && num <= 4) {
        TVPitchBattle.applyMove(battle, num);
        TVAudio.keyPress();
        render(pageNum);
      }
    });
  }

  function renderEnd(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    const st = currentStartup;
    const b = battle;
    const p = TVPitchBattle.PROFILES[b.profile];
    const rv = reveals(s, st.id);

    const lines = [];
    if (b.won) {
      rv.pitchWon = true;
      rv.pitchTruth = TVPitchBattle.truthFor(st);
      s.reputation = Math.min(100, s.reputation + 1);
      TVAudio.success();

      lines.push(r.bg("bg-green", "  " + r.pad("LA GUARDIA E' CROLLATA", 38)));
      lines.push("");
      wrap(p.crack, 37).forEach(l => lines.push(" " + r.color("c-yellow", l)));
      lines.push("");
      lines.push(" " + r.color("c-white", "LA VERITA':"));
      lines.push(" " + r.color("c-green", rv.pitchTruth));
      lines.push("");
      lines.push(" " + r.color("c-cyan", "la sala ha apprezzato: +1 reputazione"));
      lines.push(" " + r.color("c-cyan", "il founder ora negozia peggio: a te"));
      lines.push(" " + r.color("c-cyan", "la valuation costera' meno (forse)."));
    } else {
      rv.pitchLost = true;
      s.reputation = Math.max(0, s.reputation - 2);
      TVAudio.error();

      lines.push(r.bg("bg-red", "  " + r.pad("HAI PERSO LA SALA", 38)));
      lines.push("");
      lines.push(" " + r.color("c-white", "Il founder chiude il laptop."));
      lines.push(" " + r.color("c-yellow", '"Vi faccio sapere io. Anzi no."'));
      lines.push("");
      lines.push(" " + r.color("c-red", "-2 reputazione"));
      lines.push(" " + r.color("c-white", "le tue domande hanno colpito solo"));
      lines.push(" " + r.color("c-white", "i punti dove il founder era pronto."));
    }
    TVState.save();

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 0 TORNA ALLA SCHEDA"));

    r.show(pageNum, lines.join("\n"), { title: "PITCH LIVE" });

    TVRouter.setActionHandler(num => {
      if (num === 0) finish();
    });
  }

  function abort() {
    // ti alzi e te ne vai: pitch consumato, nessuna verita', nessuna penale
    TVAudio.pageChange();
    finish();
  }

  function finish() {
    battle = null;
    const fn = exitFn;
    exitFn = null;
    currentStartup = null;
    if (fn) fn();
  }

  // ----- helpers -----
  function reveals(state, id) {
    if (!state.startupReveals) state.startupReveals = {};
    if (!state.startupReveals[id]) state.startupReveals[id] = {};
    return state.startupReveals[id];
  }

  function profileLabel(key) {
    const map = {
      grit: "grit", competent: "competente", hustle: "hustler",
      ego: "ego", red_flag: "red flag", first_time: "first-time"
    };
    return map[key] || key;
  }

  function wrap(text, width) {
    const words = String(text).split(" ");
    const out = [];
    let cur = "";
    words.forEach(w => {
      if ((cur + " " + w).trim().length > width) { out.push(cur.trim()); cur = w; }
      else cur += " " + w;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  global.TVPitchLive = { start };
})(window);
