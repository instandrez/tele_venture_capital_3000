/* PITCH BATTLE — la trattativa È la battaglia.

   Appena apri una startup pendente dal dealflow parte lo scontro,
   stile battaglia a turni anni '90: musica in loop, animazioni a
   frame, barre che si svuotano colpo su colpo.

   TUTTE le azioni vivono qui dentro:
   - 1-4  le domande (attacchi): debolezza/parata per founderProfile
   - 5    DD tecnica   (-100k, -50k col dossier settore)
   - 6    ref call     (-50k: rivela profilo + trucco)
   - 7    negozia      (più la guardia è bassa, più funziona)
   - 8    co-invest    (-30k)
   - 9    passa        (fuga)
   - 0    INVESTI      (ticket per stage oppure custom)

   DD, ref e co-invest condividono due slot per deal; le news sono gratuite.

   POSTA IN GIOCO: credibilità a zero = il founder ti butta fuori
   dal round. Deal perso, -2 reputazione. La guardia a zero = la
   verità sugli unit economics + negoziazione in discesa.

   Anti save-scumming: lo stato della battaglia (rv.snap) si salva a
   ogni turno; ricaricare riprende ESATTAMENTE da dov'eri. */
(function (global) {

  let B = null; // { st, pageNum, battle, rv, phase, log, dispGuard, dispCred, fx, busy }

  // ---------- entry ----------
  function start(st, pageNum) {
    stop();
    const s = TVState.current;
    const rv = reveals(s, st.id);
    const intel = TVIntel.forStartup(s, st);

    let battle;
    let resumed = false;
    if (rv.snap) {
      battle = Object.assign(
        TVPitchBattle.newBattle(st.founderProfile, {
          intelShield: intel.shield,
          intelMove: intel.lead && intel.lead.move,
          intelPower: intel.leadPower
        }),
        rv.snap
      );
      // Puoi uscire a cercare una prova e rientrare. Accreditiamo solo
      // le nuove coperture, senza ricaricare quelle gia' consumate.
      const granted = typeof rv.snap.intelShieldGranted === "number"
        ? rv.snap.intelShieldGranted : intel.shield;
      battle.intelShield += Math.max(0, intel.shield - granted);
      battle.intelShieldGranted = Math.max(granted, intel.shield);
      if (!battle.intelMove && intel.lead) {
        battle.intelMove = intel.lead.move;
        battle.intelStrikeAvailable = true;
      }
      if (battle.intelStrikeAvailable) battle.intelPower = intel.leadPower;
      resumed = true;
    } else {
      battle = TVPitchBattle.newBattle(st.founderProfile, {
        intelShield: intel.shield,
        intelMove: intel.lead && intel.lead.move,
        intelPower: intel.leadPower
      });
    }
    if (typeof battle.intelShieldGranted !== "number") battle.intelShieldGranted = intel.shield;
    if (!battle.usedMoves) battle.usedMoves = {};
    const stage = battleStage(st);
    const musicTheme = battleMusicTheme(st, battle.profile);

    B = {
      st: st, pageNum: pageNum, battle: battle, rv: rv, intel: intel,
      stage: stage,
      musicTheme: musicTheme,
      phase: battle.over && battle.won ? "broken" : "menu",
      log: [],
      dispGuard: battle.guard,
      dispCred: battle.cred,
      /* fx sprite: enemyReveal = righe materializzate dall'alto,
         enemyDrop/playerDrop = caduta stile svenimento,
         bob = ondeggiamento idle (0/1) */
      fx: {
        enemyReveal: resumed ? 9 : 0,
        enemyDrop: (battle.over && battle.won) ? 9 : 0,
        playerDrop: 0,
        bob: 0,
        /* overlay arcade: vs = splash iniziale (0/1/2),
           cutin = banda DOSSIER STRIKE, rank = timbro S/A/B/C/KO */
        vs: 0,
        cutin: 0,
        rank: (resumed && battle.over) ? battleRank(battle.won, battle) : null
      },
      busy: false,
      awaitingAdvance: false,
      advance: null,
      seqTimer: null
    };

    TVAudio.startBattleMusic(B.musicTheme);
    arm();

    if (rv.decisionReceipt && !rv.decisionReceipt.acknowledged) {
      B.lastDecisionSummary = rv.decisionReceipt.summary;
      startPostBattleEvent(rv.decisionReceipt.decision);
      return;
    }

    // Recupero dei vecchi save salvati a fine scontro prima del premio.
    if (battle.over && battle.won && !rv.pitchWon) {
      rv.pitchWon = true;
      rv.pitchTruth = TVPitchBattle.truthFor(st);
      s.reputation = Math.min(100, s.reputation + 1);
      snap();
    }
    if (battle.over && !battle.won && !rv.pitchLost) {
      rv.pitchLost = true;
      s.reputation = Math.max(0, s.reputation - 2);
      TVDealflow.setDecision(s, st.id, "passed");
      B.lastDecisionSummary = { decision: "lost" };
      startPostBattleEvent("lost");
      return;
    }

    if (resumed) {
      snap();
      B.log = battle.over && battle.won
        ? [c("c-yellow", "Il founder e' gia' crollato."), c("c-white", "Resta solo da decidere.")]
        : [c("c-yellow", "Riprendi la trattativa"), c("c-yellow", "dove l'avevi lasciata.")];
      draw();
    } else {
      playIntro();
    }
  }

  // ---------- helpers ----------
  function c(cls, text) { return TVRender.color(cls, text); }

  function reveals(state, id) {
    if (!state.startupReveals) state.startupReveals = {};
    if (!state.startupReveals[id]) state.startupReveals[id] = {};
    return state.startupReveals[id];
  }

  function alive() {
    return B && TVState.current && TVState.current.currentPage === B.pageNum;
  }

  function snap() {
    const b = B.battle;
    B.rv.snap = {
      guard: b.guard, cred: b.cred, credMax: b.credMax,
      intelShield: b.intelShield, turn: b.turn,
      intelShieldGranted: b.intelShieldGranted,
      intelMove: b.intelMove,
      intelPower: b.intelPower,
      intelStrikeAvailable: b.intelStrikeAvailable,
      usedMoves: Object.assign({}, b.usedMoves || {}),
      over: b.over, won: b.won
    };
    TVState.save();
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

  function fxScreen(cls) {
    const el = document.getElementById("console-stage") ||
               document.getElementById("tv-content");
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // restart animation
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 400);
  }

  function scoreLabel(value, goodAt, badAt) {
    if (value >= goodAt) return "forte";
    if (value <= badAt) return "debole";
    return "misto";
  }

  const DEAL_CONTEXT = {
    neurodrive: "demo in garage OEM: auto ferma, slide velocissima",
    foundergpt: "waitlist viva, roadmap riscritta dopo ogni trend",
    ragtag: "data room ordinata, procurement TLC gia' in copia",
    agiordie: "lavagna piena di formule, pipeline clienti vuota",
    neuronote: "studi legali pagano davvero, non solo pilot gratis",
    promptlayer: "dev community rumorosa, open source alle calcagna",
    agentforge: "demo perfetta in video, produzione ancora fantasma",
    saltcore: "plant pilota acceso, supply chain fragile sullo sfondo",
    carbonhug: "impact deck bellissimo, misurazione ancora elastica",
    deepforge: "capex da industria pesante, brevetto difficile da copiare",
    bluehydro: "offtake firmati, ma costo idrogeno ancora testardo",
    greenrinse: "PDF verde venduto come software, corporate entusiaste",
    humanoidops: "robot che saluta, BOM che urla vendetta",
    strongarm: "robot noioso, clienti veri, ordini che non fanno rumore",
    humanlessops: "due plant usano il prodotto, sales cycle lungo",
    yachtbrain: "barca demo lucida, cap table con assenze strane",
    evcharge24: "colonnine installate, margine stretto come parcheggio",
    scootflow: "brand urbano forte, assessori gia' nervosi",
    starvista: "satellite piccolo, contratto pubblico molto grande",
    dovesofwar: "drone pragmatico, tender pubblici nel mirino",
    fortresslab: "ARR vero e clienti paranoici: ottimo mix cyber",
    ghostlog: "repo vivo, mercato SIEM affollato come metro",
    invoicequick: "software brutto, profittevole, clienti appiccicosi",
    notarygpt: "notai curiosi, lobby pronta a frenare",
    legalcopilot: "founder acerbo, crescita organica sorprendente",
    smartpolicy: "pilot banca vivo, distribuzione ancora collo di bottiglia",
    madbank: "utenti tanti, monetizzazione ancora promessa",
    crookedtoken: "wallet activity sospetta, rebrand AI troppo comodo",
    spinall: "marketplace locale forte, governance fragile",
    stealthmode: "NDA ovunque, nessuno nomina il prodotto due volte",
    exgoogler: "team stellare, customer discovery sotto zero",
    pivotking: "slide numero quattro, pivot numero tre"
  };

  function rootSector(st) {
    return String((st && st.sectorTag) || "UNKNOWN").split("_")[0];
  }


  function competitionRead(st) {
    const root = rootSector(st);
    if (root === "AI") return "COMPETITION: open source e incumbent possono comprimere il moat.";
    if (root === "CLIMATE" || root === "BATTERY") return "COMPETITION: execution industriale batte narrativa e grant.";
    if (root === "ROBOTICS") return "COMPETITION: chi consegna in plant vince sul demo da fiera.";
    if (root === "FINTECH" || root === "CRYPTO") return "COMPETITION: trust, compliance e distribuzione valgono piu' del token.";
    if (root === "LEGALTECH") return "COMPETITION: canale professionale lento, ma sticky se entra nel workflow.";
    if (root === "CYBER") return "COMPETITION: buyer paranoico, ma paga se riduci incident response.";
    return "COMPETITION: differenziazione da provare con clienti paganti.";
  }

  function meetingNoteForMove(st, moveId, outcome) {
    // Le domande danno osservazioni, non accesso alla tabella delle exit.
    const business = DEAL_CONTEXT[st.id] || st.sector;
    if (outcome === "resist") return "RISPOSTA EVASIVA: il pitch non ha aggiunto prove. Cambia angolo.";
    if (moveId === 1) return "TRACTION: " + st.traction + "/10. " +
      (B.rv.pitchTruth || "I margini reali restano da verificare.");
    if (moveId === 2) return competitionRead(st);
    if (moveId === 3) return "TEAM: " + scoreLabel(st.team || 0, 8, 4) +
      ". " + (B.rv.refCall ? TVPitchBattle.founderLabel(st.founderProfile) : "Il CV non sostituisce una reference.");
    return "DAL TAVOLO: " + business + ".";
  }

  function addMeetingNote(moveId, text) {
    if (!text) return;
    if (!B.rv.meetingNotes) B.rv.meetingNotes = [];
    const key = "m" + moveId;
    const existing = B.rv.meetingNotes.find(n => n.key === key);
    if (existing) existing.text = text;
    else B.rv.meetingNotes.push({ key: key, move: moveId, text: text });
  }

  // ---------- rendering ----------
  function pct(value, max) {
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  function pressurePoints(guard) {
    return Math.max(0, TVPitchBattle.GUARD_MAX - guard);
  }

  function pressureDiscountForGuard(guard) {
    return Math.min(0.18, pressurePoints(guard) * 0.018);
  }

  function dealValuationForGuard(guard) {
    if (B.rv.negotiatedValuation) return B.rv.negotiatedValuation;
    return Math.round(B.st.valuation * (1 - pressureDiscountForGuard(guard)));
  }

  function currentDealValuation() {
    return dealValuationForGuard(B.battle.guard);
  }

  function currentCustomTicket() {
    const payVal = currentDealValuation();
    const s = TVState.current;
    if (!B.customTicketAmount) {
      const defaults = TVFundMath.ticketOptions(B.st);
      B.customTicketAmount = defaults[Math.min(1, defaults.length - 1)] || 1_000_000;
    }
    B.customTicketAmount = TVFundMath.customTicketAmount(
      B.st, payVal, s.cash, B.customTicketAmount
    );
    return B.customTicketAmount;
  }

  function openInvestPhase() {
    const payVal = currentDealValuation();
    const defaults = TVFundMath.ticketOptions(B.st);
    B.customTicketAmount = TVFundMath.customTicketAmount(
      B.st, payVal, TVState.current.cash, defaults[Math.min(1, defaults.length - 1)] || 1_000_000
    );
    B.phase = "invest";
    B.log = [
      c("c-yellow", "TERM SHEET // scegli il ticket"),
      c("c-white", "1-3 sono preset. 4/5 regolano il ticket custom."),
      c("c-cyan", "6 invia il ticket custom alla valuation corrente.")
    ];
    draw();
  }

  function adjustCustomTicket(delta) {
    const payVal = currentDealValuation();
    const s = TVState.current;
    const current = currentCustomTicket();
    B.customTicketAmount = TVFundMath.customTicketAmount(
      B.st, payVal, s.cash, current + delta
    );
    B.log = [
      c("c-yellow", "TERM SHEET CUSTOM"),
      c("c-white", "Ticket selezionato: " + TVRender.eur(B.customTicketAmount)),
      c("c-white", "Ownership stimata: " +
        (TVFundMath.ownershipPct(B.customTicketAmount, payVal) * 100).toFixed(1) + "%"),
      c("c-cyan", "Ask valuation: " + TVRender.eur(payVal))
    ];
    draw();
  }

  function takeResearch(kind) {
    const offer = TVGameplay.takeResearch(TVState.current, B.rv, kind, B.intel);
    if (!offer.allowed) {
      miniLog(c("c-yellow", offer.reason || "Controllo non disponibile."));
      TVAudio.error();
      return false;
    }
    TVState.save();
    return true;
  }

  function archiveHtml() {
    if (B.phase === "postEvent") return "";
    const r = TVRender;
    const rows = (TVPitches.forStartup(B.st.id) || []).map(r.escape);
    (B.rv.meetingNotes || []).forEach(note => rows.push(r.escape(note.text)));
    (B.rv.ddTexts || []).forEach(note => rows.push(r.escape("DD: " + note)));
    if (B.rv.refCall) rows.push(r.escape("REFERENCE: " + TVPitchBattle.PROFILES[B.battle.profile].hint));
    if (B.rv.coInvest) rows.push(r.escape("CO-INVEST: " + TVPitchBattle.coInvestSignal(B.st)));
    return '<details class="battle-archive"><summary>PITCH E APPUNTI // RIAPRI</summary><div>' +
      rows.map(row => '<p>' + row + '</p>').join("") + '</div></details>';
  }

  function decisionContextHtml() {
    if (B.busy || B.phase === "postEvent") return "";
    if (B.phase === "invest") {
      const s = TVState.current;
      const amount = currentCustomTicket();
      const a = TVGameplay.allocation(s, B.st, amount);
      const leverage = TVDealAccess.leverageFor(s, B.st, {
        rv: B.rv, intel: B.intel, battle: B.battle
      });
      const required = TVDealAccess.requiredLeverage(B.st);
      return '<div class="battle-decision-context">' +
        TVRender.escape("Custom: cash dopo " + TVRender.eur(a.cashAfter) +
          " // " + Math.round(a.fundShare * 100) + "% del fondo. ") +
        (a.concentrated ? "CONCENTRAZIONE ALTA. " : "") +
        (a.thinReserve ? "RISERVA SOTTILE PER I PROSSIMI ROUND. " : "") +
        TVRender.escape("Accesso " + leverage + "/" + required +
          (leverage >= required ? ": leva sufficiente." : ": il founder puo' rifiutare.")) +
        '</div>';
    }
    return '<div class="battle-decision-context">' +
      TVRender.escape("Agenda: " + TVGameplay.researchRemaining(B.rv) +
        "/2 controlli. DD = rischio; REF = punto debole; CO-INVEST = accesso. News gratuite.") + '</div>';
  }

  function battleMusicTheme(st, profile) {
    return {
      ego: "ego",
      hustle: "hustle",
      red_flag: "red_flag",
      competent: "competent",
      grit: "grit",
      first_time: "first_time"
    }[profile || st.founderProfile] || "default";
  }

  function battleStage(st) {
    const tag = String(st.sectorTag || "UNKNOWN");
    const root = tag.split("_")[0];
    if (st.founderProfile === "red_flag" || root === "UNKNOWN") {
      return { key: "backroom", label: "BACKROOM DD", accent: "#ff4030" };
    }
    if (root === "FINTECH" || root === "CRYPTO") {
      return { key: "trading", label: "MARKET FLOOR", accent: "#ffe200" };
    }
    if (root === "CLIMATE" || root === "BATTERY") {
      return { key: "factory", label: "INDUSTRIAL PLANT", accent: "#33ff66" };
    }
    if (root === "ROBOTICS" || root === "MOBILITY" || root === "SPACE") {
      return { key: "hangar", label: "ORBIT HANGAR", accent: "#18e0ff" };
    }
    if (root === "AI" || root === "CYBER" || root === "LEGALTECH" || root === "SAAS") {
      return { key: "datacenter", label: "DATA ROOM", accent: "#18e0ff" };
    }
    return { key: "arcade", label: "NEON ARCADE", accent: "#ff3df0" };
  }

  function stageSetdressHtml() {
    return '<div class="battle-setdress" aria-hidden="true">' +
      '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' +
      '<span></span><span></span><span></span><span></span>' +
      '</div>';
  }

  /* ---------- overlay arcade: VS screen, cut-in, rank ---------- */

  /* Rank di fine battle, stile sala giochi: premia chi chiude in
     fretta senza perdere la sala. KO = buttato fuori dal round. */
  function battleRank(won, battle) {
    if (!won) return "KO";
    const credLost = (battle.credMax || TVPitchBattle.CRED_MAX) - battle.cred;
    if (battle.turn <= 3 && credLost <= 1) return "S";
    if (battle.turn <= 4 && credLost <= 2) return "A";
    if (battle.turn <= 6) return "B";
    return "C";
  }

  const RANK_LINES = {
    S: "sala espugnata, chirurgico.",
    A: "pressione da manuale.",
    B: "vinta ai punti.",
    C: "vinta, ma la sala se la ricorda.",
    KO: "il comitato manda i fiori."
  };

  function vsOverlayHtml() {
    const r = TVRender;
    const fund = (TVState.current.fundName || "FUND I").toUpperCase();
    return '<div class="battle-vs' + (B.fx.vs === 2 ? " is-hold" : "") +
      '" aria-hidden="true">' +
      '<div class="vs-side vs-player">' +
        '<div class="vs-art vs-art-gp"><span>GP</span></div>' +
        '<b>GENERAL PARTNER</b><span>' + r.escape(fund.slice(0, 22)) + '</span>' +
      '</div>' +
      '<div class="vs-core"><em>VS</em>' +
        '<span>' + r.escape(B.stage.label) + '</span>' +
        '<i>ROUND 1 — FIGHT!</i></div>' +
      '<div class="vs-side vs-founder">' +
        '<div class="vs-art is-mystery">' + TVSprites.gridHtml(B.battle.profile) + '</div>' +
        '<b>' + r.escape(B.st.name.toUpperCase().slice(0, 22)) + '</b>' +
        '<span>SFIDANTE MISTERIOSO</span>' +
      '</div>' +
    '</div>';
  }

  function cutinOverlayHtml() {
    return '<div class="battle-cutin" aria-hidden="true"><div class="cutin-band">' +
      '<b>★ DOSSIER STRIKE ★</b>' +
      '<span>la prova entra nel verbale</span>' +
    '</div></div>';
  }

  function rankStampHtml() {
    return '<div class="battle-rank is-rank-' + String(B.fx.rank).toLowerCase() +
      '" aria-hidden="true"><span>RANK</span><b>' + B.fx.rank + '</b></div>';
  }

  function fighterHtml(role) {
    const r = TVRender;
    const s = TVState.current;
    const founder = role === "founder";
    const key = founder ? B.battle.profile : "player";
    const hp = founder ? B.dispGuard : B.dispCred;
    const hpMax = founder ? TVPitchBattle.GUARD_MAX : (B.battle.credMax || TVPitchBattle.CRED_MAX);
    const name = founder ? B.st.name : "GENERAL PARTNER";
    const meterName = founder ? "RESISTENZA FOUNDER" : "CONTROLLO SALA";
    const consequence = founder
      ? "A ZERO: VERITA' + PRESSIONE MASSIMA"
      : "A ZERO: PERDI IL DEAL";
    const sub = founder
      ? B.st.stage + " // ASK VAL. " + r.eur(currentDealValuation())
      : "CASH " + r.eur(s.cash) + " // REP " + s.reputation;
    const reveal = founder ? B.fx.enemyReveal / 9 : 1;
    const defeated = founder ? B.fx.enemyDrop >= 9 : B.fx.playerDrop >= 5;
    const bobbing = founder && !B.battle.over && B.fx.enemyReveal >= 9;
    const artClass = "fighter-art" +
      (bobbing ? " is-bobbing" : "") +
      (defeated ? " is-defeated" : "");

    return (
      '<section class="fighter fighter-' + role + (hp <= hpMax / 3 ? " is-critical" : "") +
        '" data-profile="' + key + '">' +
        '<div class="fighter-hud">' +
          '<div class="hud-name"><span>' + TVRender.escape(name) + '</span><span>' + hp + "/" + hpMax + "</span></div>" +
          '<div class="hud-meter"><span>' + meterName + '</span><span>' + consequence + "</span></div>" +
          '<div class="hud-sub">' + TVRender.escape(sub) + '</div>' +
          '<div class="hp-track"><i style="--hp:' + pct(hp, hpMax) + '%"></i></div>' +
        '</div>' +
        '<div class="' + artClass + '" style="--sprite-mask:' + ((1 - reveal) * 100) + '%">' +
          TVSprites.gridHtml(key) +
          '<span class="fighter-torso"></span>' +
        '</div>' +
      '</section>'
    );
  }

  function command(num, label, cls, done) {
    return '<button type="button" data-action="' + num + '" class="battle-command ' +
      (cls || "") + (done ? ' is-done" disabled aria-disabled="true' : '') + '">' +
      '<span class="keycap">' + num + '</span><span>' + label + "</span></button>";
  }

  function commandsHtml() {
    const rv = B.rv;
    if (B.busy) {
      if (B.awaitingAdvance) {
        return '<button type="button" data-action="1" class="battle-command battle-wait battle-continue wide">' +
          '<span class="keycap">1</span><span>CONTINUA QUANDO HAI FINITO DI LEGGERE</span></button>';
      }
      return '<button type="button" data-action="1" class="battle-command battle-wait wide">' +
        '<span class="keycap">...</span><span>ANIMAZIONE // UN TASTO ACCELERA</span></button>';
    }
    if (B.phase === "invest") {
      const payVal = currentDealValuation();
      const custom = currentCustomTicket();
      const customOwnership = TVFundMath.ownershipPct(custom, payVal) * 100;
      const fixed = TVFundMath.termSheetOptions(B.st, payVal).map((option, index) => {
        const ownership = option.ownership * 100;
        return command(index + 1,
          (option.capped ? "MAX TS " : "TS ") +
            TVRender.eur(option.amount) + " // " + ownership.toFixed(1) + "%",
          "is-invest", option.amount > TVState.current.cash);
      });
      return fixed.concat([
        command(4, "-1M TICKET", "is-research"),
        command(5, "+1M TICKET", "is-research"),
        command(6, "INVIA " + TVRender.eur(custom) + " // " + customOwnership.toFixed(1) + "%", "is-invest", custom > TVState.current.cash),
        command(0, "ANNULLA", "is-danger")
      ]).join("");
    }
    if (B.phase === "rescue") {
      return [
        command(1, "ALZA VALUATION +12%", "is-invest"),
        command(2, B.rv.coInvest ? "ATTIVA IL LEAD" : "PORTA LEAD 100k", "is-research",
          !B.rv.coInvest && TVGameplay.researchRemaining(B.rv) === 0),
        command(9, "WALK AWAY", "is-danger"),
        command(0, "ANNULLA", "is-danger")
      ].join("");
    }
    if (B.phase === "negotiate") {
      const currentVal = currentDealValuation();
      const proposed = B.negotiationValuation || Math.round(currentVal * 0.88);
      const discount = Math.max(0, 1 - proposed / currentVal);
      return [
        command(1, "-5M VAL", "is-research"),
        command(2, "-1M VAL", "is-research"),
        command(3, "+1M VAL", "is-research"),
        command(4, "+5M VAL", "is-research"),
        command(6, "PROPONI " + TVRender.eur(proposed) + " -" +
          Math.round(discount * 100) + "%", "is-invest wide"),
        command(0, "ANNULLA", "is-danger")
      ].join("");
    }
    if (B.phase === "postEvent" && B.postBattleEvent) {
      return command(1, "CONTINUA AL DEALFLOW", "is-invest wide");
    }

    const broken = B.phase === "broken";
    const leadMove = B.battle.intelStrikeAvailable ? B.battle.intelMove : null;
    const usedMoves = B.battle.usedMoves || {};
    const canResearch = kind => TVGameplay.researchOffer(TVState.current, rv, kind, B.intel).allowed;
    function moveDone(id) {
      return broken || !!usedMoves[id];
    }
    return (broken ? [] : [
      command(1, (leadMove === 1 ? "★ " : "") + "NUMERI",
        leadMove === 1 ? "is-intel" : "", moveDone(1)),
      command(2, (leadMove === 2 ? "★ " : "") + "COMPETITOR",
        leadMove === 2 ? "is-intel" : "", moveDone(2)),
      command(3, (leadMove === 3 ? "★ " : "") + "TEAM",
        leadMove === 3 ? "is-intel" : "", moveDone(3)),
      command(4, (leadMove === 4 ? "★ " : "") + "SILENZIO",
        leadMove === 4 ? "is-intel" : "", moveDone(4))
    ]).concat([
      command(5, rv.dd ? "DD COMPLETA" : "DD " + TVRender.eur(B.intel.ddCost), "is-research", !canResearch("dd")),
      command(6, rv.refCall ? "REF COMPLETA" : "REF CALL 50k", "is-research", !canResearch("refCall")),
      command(7, rv.negotiated
        ? (rv.negotiatedValuation ? "VALUATION LOCK" : "NEGOZIA FALLITA")
        : "NEGOZIA VAL.", "is-research", rv.negotiated),
      command(8, rv.coInvest ? "CO-INVEST OK" : "CO-INVEST 30k", "is-research", !canResearch("coInvest")),
      command(9, "PASSA", "is-danger"),
      command(0, "TERM SHEET", "is-invest")
    ]).join("");
  }

  function hintHtml() {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    if (rv.pitchTruth) return c("c-green", "VERITA' DEAL: " + rv.pitchTruth);
    if (rv.refCall) {
      return c("c-cyan", "REF: " + TVPitchBattle.founderLabel(B.battle.profile) +
        " — " + TVPitchBattle.PROFILES[B.battle.profile].hint);
    }
    if (rv.ddTexts && rv.ddTexts[0]) return c("c-white", "DD: " + rv.ddTexts[0]);
    if (rv.coInvest) return c("c-cyan", "CO-INVEST: " + TVPitchBattle.coInvestSignal(st));
    if (B.intel.level >= 2) {
      if (B.battle.intelStrikeAvailable && B.intel.lead) {
        return c("c-green", "DOMANDA ARMATA " + B.intel.lead.move +
          ": +" + B.battle.intelPower + " pressione e replica bloccata.");
      }
      return c("c-green", "TACCUINO " + B.intel.label + ": " + B.battle.intelShield +
        " coperture rimaste.");
    }
    if (B.intel.level === 1) {
      return c("c-yellow", "TACCUINO " + B.intel.evidenceScore.toFixed(1) +
        "/3: serve una prova che corrobori.");
    }
    return c("c-red", "TACCUINO VUOTO: sei entrato con il solo deck.");
  }

  function intelStatusHtml() {
    const filled = Math.min(5, Math.floor(B.intel.evidenceScore));
    const cls = B.intel.level >= 2 ? "is-ready" : (filled ? "is-partial" : "is-blind");
    const pressure = pressurePoints(B.battle.guard);
    const valuation = currentDealValuation();
    return '<div class="battle-intel ' + cls + '">' +
      '<span>PROVE ' + "#".repeat(filled) + ".".repeat(5 - filled) + '</span>' +
      '<span>PRESSIONE ' + pressure + "/" + TVPitchBattle.GUARD_MAX + '</span>' +
      '<span>CONTROLLI ' + TVGameplay.researchRemaining(B.rv) + '/2</span>' +
    '</div>';
  }

  function martaAdviceText() {
    if (B.phase === "postEvent") {
      const decision = (B.lastDecisionSummary && B.lastDecisionSummary.decision) || "memo";
      if (decision === "invested") return "Screenshot pronto: se hai pagato FOMO, almeno il memo e' bello.";
      if (decision === "passed") return "Passare e' una decisione. Il non-memo e' codardia.";
      return "Fuori dal round. La prossima volta entra con prove, non con vibe.";
    }
    if (B.busy) {
      return B.awaitingAdvance
        ? "Leggi la reazione, poi premi 1. Non e' un tap perso: e' teatro."
        : "Input ricevuto. L'animazione si puo' accelerare con un altro tap.";
    }
    if (B.phase === "invest") {
      return "Term sheet: compra ownership, non una story. Controlla valuation e cash.";
    }
    if (B.phase === "negotiate") {
      return "Valuation: usa +/- per trovare il taglio. Troppo sconto e il founder ti lancia fuori.";
    }
    if (B.phase === "rescue") {
      return "Il round e' caldo: alza prezzo, porta lead o scappa prima del FOMO.";
    }
    if (B.phase === "broken") {
      return "Guardia a zero. Puoi inviare TS con piu' leverage o passare con dignita'.";
    }
    if (B.battle.intelStrikeAvailable && B.intel && B.intel.lead) {
      return "Usa " + B.intel.lead.move + " " + MOVE_NAMES[B.intel.lead.move] +
        ": e' la domanda armata dal taccuino.";
    }
    if (B.intel && B.intel.level >= 2) {
      return "Hai prove: fai una domanda forte, poi negozia prima del term sheet.";
    }
    if (B.intel && B.intel.level === 1) {
      return "Hai appunti, non una tesi. DD/ref call o una pista news in piu'.";
    }
    return "Stai pitchando al buio. DD o ref call prima di pagare la narrativa.";
  }

  function memoTone(decision) {
    return TVGameplay.decisionRead(TVState.current, B.st, B.rv, B.intel,
      decision, B.lastDecisionSummary).stamp;
  }

  function memoPosterHtml() {
    if (B.phase !== "postEvent") return "";
    const s = TVState.current;
    const summary = B.lastDecisionSummary || {};
    const decision = summary.decision || "memo";
    const tag = decision === "invested" ? "INVEST" : (decision === "passed" ? "PASS" : "LOST");
    const metric = decision === "invested"
      ? "TICKET " + TVRender.eur(summary.amount || 0)
      : (decision === "passed" ? "CASH " + TVRender.eur(s.cash || 0) : "REP " + s.reputation);
    const ownership = summary.equityPct
      ? "OWN " + (summary.equityPct * 100).toFixed(1) + "%"
      : "NO CAP TABLE";
    const intel = B.intel && B.intel.level >= 2 ? "TACCUINO " + B.intel.label : "DECK ONLY";
    return (
      '<div class="battle-meme-card is-' + TVRender.escape(decision) + '">' +
        '<div class="meme-kicker">VC3000 DEAL MEMO</div>' +
        '<div class="meme-stamp">' + TVRender.escape(memoTone(decision)) + '</div>' +
        '<div class="meme-startup">' + TVRender.escape(B.st.name) + '</div>' +
        '<div class="meme-metrics"><span>' + TVRender.escape(tag) + '</span>' +
          '<span>' + TVRender.escape(metric) + '</span>' +
          '<span>' + TVRender.escape(ownership) + '</span>' +
          '<span>' + TVRender.escape(intel) + '</span></div>' +
        '<div class="meme-line">NOTA ANALISTA: "' + TVRender.escape(martaAdviceText()) + '"</div>' +
      '</div>'
    );
  }

  function battleSceneHtml() {
    const r = TVRender;
    const s = TVState.current;
    const isMeetingNote = B.log.some(line => String(line).includes("MEETING NOTE"));
    const allLogLines = B.log.filter(line => line !== "");
    let logZone = allLogLines;
    if (isMeetingNote) {
      let noteStart = 0;
      for (let i = allLogLines.length - 1; i >= 0; i--) {
        if (String(allLogLines[i]).includes("MEETING NOTE")) {
          noteStart = i;
          break;
        }
      }
      logZone = allLogLines.slice(noteStart);
    }
    const dialogue = logZone.length
      ? logZone.join("<br>")
      : c("c-yellow", "Il founder ti osserva. Tocca a te.");
    const phase = B.phase === "invest" ? "TERM SHEET" :
      (B.phase === "rescue" ? "ACCESSO AL ROUND" :
      (B.phase === "postEvent" ? "DEAL MEMO" :
      (B.phase === "broken" ? "PRESSIONE MASSIMA" : "PITCH BATTLE")));

    const decision = (B.lastDecisionSummary && B.lastDecisionSummary.decision) || "memo";
    return (
      '<section class="console-scene battle-scene battle-stage-' + B.stage.key +
        (isMeetingNote ? " is-note-mode" : "") +
        (B.phase === "postEvent" ? " is-deal-memo is-memo-" + decision : "") +
        '" style="--battle-accent:' + B.stage.accent + '">' +
        '<div class="battle-bg"></div>' + stageSetdressHtml() + '<div class="battle-flash"></div>' +
        '<header class="battle-topbar">' +
          '<span class="battle-round">ANNO ' + s.year + " // ROUND " + (B.battle.turn + 1) + '</span>' +
          '<span class="stage-name"><b>' + phase + '</b><small>' +
            TVRender.escape(B.stage.label) + '</small></span>' +
          '<span class="battle-cash">FONDO ' + r.eur(s.cash) + '</span>' +
        '</header>' +
        intelStatusHtml() +
        fighterHtml("player") +
        fighterHtml("founder") +
        '<div class="battle-bottom">' +
          '<section class="battle-dialogue' + (isMeetingNote ? " is-note" : "") + '">' +
            '<div class="dialogue-speaker">' + TVRender.escape(B.st.name) + '</div>' +
            memoPosterHtml() +
            '<div class="dialogue-lines">' + dialogue + '</div>' +
            archiveHtml() +
            '<div class="battle-hint">' + hintHtml() + '</div>' +
            decisionContextHtml() +
          '</section>' +
          '<section class="battle-commands">' + commandsHtml() + '</section>' +
        '</div>' +
        (B.fx.rank ? rankStampHtml() : "") +
        (B.fx.cutin ? cutinOverlayHtml() : "") +
        (B.fx.vs ? vsOverlayHtml() : "") +
      '</section>'
    );
  }

  function draw() {
    if (!alive()) return;
    TVRender.showScene(B.pageNum, battleSceneHtml(), {
      title: "PITCH BATTLE",
      className: "battle-console"
    });
  }

  /* Gli step importanti possono avere waitForInput: il testo resta
     fermo finche' il giocatore non preme un tasto. Gli altri step
     sono accelerabili, ma il tasto non viene accodato come mossa. */
  function seq(steps, done) {
    const scene = B;
    B.busy = true;
    B.awaitingAdvance = false;
    let i = 0;
    const finish = () => {
      if (B !== scene || !alive()) return;
      B.busy = false;
      B.awaitingAdvance = false;
      B.advance = null;
      B.seqTimer = null;
      if (done) done();
    };
    const next = () => {
      if (B !== scene || !alive()) return;
      B.advance = null;
      B.seqTimer = null;
      if (i >= steps.length) { finish(); return; }
      const stp = steps[i++];
      if (stp.fn) stp.fn();
      if (stp.log) B.log = stp.log;
      if (stp.push) B.log = B.log.concat(stp.push);
      B.awaitingAdvance = !!stp.waitForInput;
      draw();
      if (stp.sound) stp.sound();
      if (stp.shake) fxScreen("shake");
      if (stp.flash) fxScreen("crt-flash");
      if (stp.shield) fxScreen("intel-burst");
      if (stp.waitForInput) {
        B.advance = () => {
          if (!B || !B.awaitingAdvance) return;
          B.awaitingAdvance = false;
          next();
        };
      } else {
        const reduced = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
        B.seqTimer = setTimeout(next, reduced ? 0 : Math.min(stp.ms || 450, 450));
        B.advance = () => {
          if (!B || B.awaitingAdvance) return;
          clearTimeout(B.seqTimer);
          B.seqTimer = null;
          next();
        };
      }
    };
    next();
  }

  // ---------- intro ----------
  function playIntro() {
    const s = TVState.current;
    const pitch = TVPitches.forStartup(B.st.id) || [];
    const first = !s.tutorialFlags.pitchBattle;
    s.tutorialFlags.pitchBattle = true;
    snap();
    const lines = pitch.map(line => c("c-cyan", line));
    if (first) lines.push(c("c-yellow",
      "Domande 1-4: scopri il punto debole. Due controlli extra a scelta. Puoi investire o passare senza vincere."));
    lines.push(c("c-white", "Il founder attende. Il suo 'ultimo slot' esiste da marzo."));
    seq([
      { fn: () => { B.fx.vs = 1; }, ms: 600, sound: () => TVAudio.fanfare() },
      { fn: () => { B.fx.vs = 0; B.fx.enemyReveal = 9; }, log: lines, ms: 180 }
    ], () => arm());
  }

  // ---------- mosse: domande (1-4) ----------
  const MOVE_NAMES = { 1: "I NUMERI, PREGO", 2: "E I COMPETITOR?",
                       3: "PARLAMI DEL TEAM", 4: "SILENZIO IMBARAZZANTE" };

  function doQuestion(moveId) {
    const b = B.battle;
    const p = TVPitchBattle.PROFILES[b.profile];
    const guardBefore = b.guard;
    const credBefore = b.cred;
    TVPitchBattle.applyMove(b, moveId);
    if (b.lastOutcome === "repeat") return;
    if (!B.rv.moveOutcomes) B.rv.moveOutcomes = {};
    B.rv.moveOutcomes[moveId] = b.lastOutcome;

    // Le conseguenze precedono l'animazione: ESC/reload non annullano il turno.
    if (b.over && b.won && !B.rv.pitchWon) {
      B.rv.pitchWon = true;
      B.rv.pitchTruth = TVPitchBattle.truthFor(B.st);
      TVState.current.reputation = Math.min(100, TVState.current.reputation + 1);
      B.phase = "broken";
      B.fx.rank = battleRank(true, b);
    } else if (b.over && !b.won && !B.rv.pitchLost) {
      B.rv.pitchLost = true;
      TVState.current.reputation = Math.max(0, TVState.current.reputation - 2);
      TVDealflow.setDecision(TVState.current, B.st.id, "passed");
      TVState.current.history.push({ year: TVState.current.year, type: "pass",
        startup: B.st.name, note: "buttato fuori dal pitch" });
      B.lastDecisionSummary = { decision: "lost" };
      recordDecision("lost");
    }
    const note = meetingNoteForMove(B.st, moveId, b.lastOutcome);
    addMeetingNote(moveId, note);
    snap();

    const hit = guardBefore - b.guard;
    const loss = credBefore - b.cred;
    const outcome = b.intelTriggered ? "DOSSIER STRIKE" :
      (b.lastOutcome === "weak" ? "DOMANDA SUPER EFFICACE" :
      (b.lastOutcome === "resist" ? "PARATA DEL FOUNDER" : "IL PITCH CEDE"));
    const lines = [
      c(b.lastOutcome === "resist" ? "c-red" : "c-green", outcome),
      c("c-white", p.react[moveId]),
      c("c-cyan", "Resistenza -" + hit + " // Controllo -" + loss +
        " // Ask " + TVRender.eur(currentDealValuation()))
    ];
    if (b.intelTriggered && moveId === p.resist)
      lines[1] = c("c-white", "Prova sul tavolo. Stavolta la battuta pronta non basta.");
    if (b.counterBlocked) lines.push(c("c-green", "Replica bloccata. La sala resta tua."));
    else if (!b.over) lines.push(c("c-magenta", p.attack + ": " +
      p.attackLines[(b.turn - 1) % p.attackLines.length]));
    if (b.won) lines.push(c("c-yellow", "VERITA': " + B.rv.pitchTruth),
      c("c-white", "Battle vinta. Investimento buono? E' un'altra domanda."));
    else if (!b.over) lines.push(c("c-yellow", "Prossima replica: fino a -" +
      TVPitchBattle.counterCostFor(b.turn + 1) + " controllo. Puoi gia' decidere."));
    seq([
      { log: [c("c-yellow", MOVE_NAMES[moveId])], ms: 160,
        sound: () => TVAudio.keyPress() },
      { log: lines, ms: 240, fn: () => {
          B.dispGuard = b.guard; B.dispCred = b.cred;
          if (b.won) B.fx.enemyDrop = 9;
          if (b.over && !b.won) { B.fx.playerDrop = 5; B.fx.rank = "KO"; }
        }, shake: b.lastOutcome === "resist", shield: b.intelTriggered,
        sound: () => b.lastOutcome === "resist" ? TVAudio.error() : TVAudio.success() }
    ], () => b.over && !b.won ? startPostBattleEvent("lost") : arm());
  }

  // ---------- azioni di ricerca (5/6/8) e negoziazione (7) ----------
  function doDD() {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    const dossier = B.intel.level >= 2;
    if (!takeResearch("dd")) return;
    if (dossier) {
      rv.ddTexts = ["rischio - " + st.hiddenRisk, "upside + " + st.hiddenUpside];
    } else {
      const showRisk = TVState.roll("dd|" + st.id + "|" + s.year) < 0.5;
      rv.ddTexts = [showRisk ? "rischio - " + st.hiddenRisk
                             : "upside + " + st.hiddenUpside];
    }
    TVState.save();

    const result = [];
    rv.ddTexts.forEach(t => {
      wrap("SEGNALE DEAL: " + t, 40).forEach((line, idx) => {
        result.push(idx === 0 ? c("c-yellow", line) : c("c-white", "  " + line));
      });
    });
    seq([
      { log: [c("c-white", "Mandi gli analisti nel data room...")], ms: 800,
        sound: () => TVAudio.keyPress() },
      { push: [c("c-cyan", dossier ? "(le pagine lette hanno gia' meta' lavoro)"
                                   : "(fruscio di fogli excel)")], ms: 800 },
      { push: result.concat([c("c-cyan", "Usalo per decidere: passare, negoziare o investire.")]),
        ms: 600, sound: () => TVAudio.success() }
    ], () => arm());
  }

  function doRefCall() {
    const s = TVState.current;
    const rv = B.rv;
    if (!takeResearch("refCall")) return;
    TVState.save();

    const p = TVPitchBattle.PROFILES[B.battle.profile];
    seq([
      { log: [c("c-white", "Chiami tre ex colleghi del founder...")], ms: 900,
        sound: () => TVAudio.keyPress() },
      { push: [c("c-white", "Uno risponde.")], ms: 700 },
      { push: [c("c-yellow", '"' + TVPitchBattle.founderLabel(B.battle.profile) + '"'),
               c("c-green", "trucco: " + p.hint)], ms: 700,
        sound: () => TVAudio.success() }
    ], () => arm());
  }

  function doNegotiate() {
    if (B.rv.negotiated) { miniLog(c("c-blue", "Gia' negoziata.")); return; }
    B.negotiationValuation = Math.max(1_000_000, Math.round(currentDealValuation() * 0.88));
    B.phase = "negotiate";
    B.log = negotiationLog();
    arm();
  }

  function negotiationLeverage() {
    return 0.35 +
      (1 - B.battle.guard / TVPitchBattle.GUARD_MAX) * 0.35 +
      (B.rv.dd ? 0.10 : 0) +
      B.intel.negotiationBonus;
  }

  function negotiationChance(proposedVal) {
    const currentVal = currentDealValuation();
    const discount = Math.max(0, 1 - proposedVal / currentVal);
    const discountPenalty = Math.max(0, discount - 0.08) * 1.7;
    return Math.max(0.03, Math.min(0.95, negotiationLeverage() - discountPenalty));
  }

  function negotiationLog() {
    const currentVal = currentDealValuation();
    const proposed = B.negotiationValuation || Math.round(currentVal * 0.88);
    const discount = Math.max(0, 1 - proposed / currentVal);
    return [
      c("c-yellow", "NEGOZIA VALUATION // USA +/-"),
      c("c-cyan", "ASK attuale: " + TVRender.eur(currentVal)),
      c("c-white", "Proposta: " + TVRender.eur(proposed) +
        " (-" + Math.round(discount * 100) + "%)"),
      c("c-white", "Pressione negoziale: " +
        pressurePoints(B.battle.guard) + "/" + TVPitchBattle.GUARD_MAX),
      c("c-yellow", "Probabilita': " + Math.round(negotiationChance(proposed) * 100) +
        "% // rifiuto: -3 reputazione. Un solo tentativo.")
    ];
  }

  function adjustNegotiationValuation(delta) {
    const currentVal = currentDealValuation();
    const maxVal = Math.max(1_000_000, currentVal - 1_000_000);
    const base = B.negotiationValuation || Math.round(currentVal * 0.88);
    B.negotiationValuation = Math.round(
      Math.max(1_000_000, Math.min(maxVal, base + delta)) / 100_000
    ) * 100_000;
    B.log = negotiationLog();
    draw();
  }

  function submitNegotiation() {
    const proposedVal = B.negotiationValuation;
    if (!proposedVal || proposedVal < 1_000_000 || proposedVal >= currentDealValuation()) {
      miniLog(c("c-red", "Valuation non valida: deve essere sotto ASK e sopra 1M."));
      TVAudio.error();
      return;
    }
    resolveNegotiation(proposedVal);
  }

  function resolveNegotiation(proposedVal) {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    const b = B.battle;
    const currentVal = currentDealValuation();
    const pressure = pressurePoints(b.guard);
    const discount = Math.max(0, 1 - proposedVal / currentVal);
    const prob = negotiationChance(proposedVal);
    const chance = Math.round(prob * 100);
    const ok = TVState.roll("nego|" + st.id + "|" + s.year + "|" + proposedVal) < prob;
    rv.negotiated = true;

    const steps = [
      { log: [c("c-white", "Butti li':"),
              c("c-cyan", "Pressione negoziale: " + pressure + "/" + TVPitchBattle.GUARD_MAX),
              c("c-cyan", "ASK VAL attuale: " + TVRender.eur(currentVal)),
              c("c-cyan", "TUA PROPOSTA: " + TVRender.eur(proposedVal) +
                " (-" + Math.round(discount * 100) + "%)"),
              c("c-yellow", "Chance stimata: " + chance + "%")], ms: 900 },
      { push: [c("c-yellow", "\"Quella valuation... e' un'opinione.\"")], ms: 1100,
        sound: () => TVAudio.keyPress() }
    ];
    if (ok) {
      rv.negotiatedValuation = proposedVal;
      steps.push({ push: ["", c("c-white", "Il founder espira. A lungo."),
                          c("c-green", "ACCETTA. Odiandoti."),
                          c("c-green", "VALUATION " + TVRender.eur(currentVal) +
                            " -> " + TVRender.eur(rv.negotiatedValuation)),
                          c("c-cyan", "A parita' di ticket compri piu' ownership.")], ms: 900,
                   sound: () => TVAudio.fanfare() });
    } else {
      s.reputation = Math.max(0, s.reputation - 3);
      steps.push({ push: ["", c("c-yellow", '"La porta e\' quella."'),
                          c("c-red", "Rifiutata. -3 reputazione.")], ms: 900,
                   shake: true, sound: () => TVAudio.error() });
    }
    TVState.save();
    seq(steps, () => {
      if (ok) {
        openInvestPhase();
        arm();
      } else {
        B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
        arm();
      }
    });
  }

  function doCoInvest() {
    const s = TVState.current;
    const rv = B.rv;
    if (!takeResearch("coInvest")) return;
    TVState.save();

    seq([
      { log: [c("c-white", "Scrivi 'ci sei anche tu?' a un amico"),
              c("c-white", "di un altro fondo...")], ms: 900,
        sound: () => TVAudio.keyPress() },
      { push: ["", c("c-cyan", "\"" + TVPitchBattle.coInvestSignal(B.st) + "\"")], ms: 700,
        sound: () => TVAudio.success() }
    ], () => arm());
  }

  // ---------- investi (0) e passa (9) ----------
  function finalizeInvestment(amount, payVal, label) {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    if (TVDealflow.getDecision(s, st.id) !== "pending") return;
    amount = TVFundMath.capTicketAmount(amount, payVal);
    if (s.cash < amount) {
      miniLog(c("c-red", "CASH INSUFFICIENTE."));
      TVAudio.error();
      B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
      draw(); arm();
      return;
    }
    const equityPct = TVFundMath.ownershipPct(amount, payVal);
    s.cash -= amount;
    s.invested += amount;
    s.portfolio.push({
      id: st.id, name: st.name, sector: st.sector, sectorTag: st.sectorTag,
      investedAmount: amount, entryValuation: payVal, equityPct: equityPct,
      entryYear: s.year,
      currentValueMultiplier: TVFundMath.entryMultiplier(st.valuation, payVal, amount),
      status: "active", realizedAmount: 0,
      revealed: Object.assign({}, rv)
    });
    TVDealflow.setDecision(s, st.id, "invested");
    s.history.push({
      year: s.year, type: "invest", startup: st.name,
      amount: amount, valuation: payVal, note: label || "term sheet accepted"
    });
    B.lastDecisionSummary = {
      decision: "invested",
      amount: amount,
      valuation: payVal,
      equityPct: equityPct,
      note: label || "term sheet accepted"
    };
    recordDecision("invested");
    TVState.save();

    const eur = TVRender.eur(amount);
    const entryMult = TVFundMath.entryMultiplier(st.valuation, payVal, amount);
    const closeLines = ["", c("c-green", "HA GIA' FIRMATO."),
      c("c-green", "AFFARE FATTO: " + eur + " // " +
        (equityPct * 100).toFixed(1) + "%"),
      c("c-cyan", "VALUATION: " + TVRender.eur(payVal))];
    if (entryMult > 1.001) {
      closeLines.push(c("c-yellow", "SCONTO STRAPPATO: mark d'ingresso " +
        entryMult.toFixed(2) + "x"));
    }
    seq([
      { log: [c("c-white", "Prepari il term sheet da " + eur + "...")], ms: 800,
        sound: () => TVAudio.keyPress() },
      { log: [c("c-white", "LO LANCI!"), c("c-yellow", "   [TS]►")], ms: 160 },
      { log: [c("c-white", "LO LANCI!"), c("c-yellow", "        [TS]►►")], ms: 160 },
      { log: [c("c-white", "LO LANCI!"), c("c-yellow", "              [TS]►►►")], ms: 200,
        sound: () => TVAudio.pageChange() },
      { push: ["", c("c-white", "Il founder lo guarda.")], ms: 800 },
      { push: [c("c-white", ". . .")], ms: 800, sound: () => TVAudio.keyPress() },
      { push: [c("c-white", "Finge di pensarci.")], ms: 900, sound: () => TVAudio.keyPress() },
      { push: closeLines, ms: 1500,
        flash: true, sound: () => TVAudio.fanfare() }
    ], () => startPostBattleEvent("invested"));
  }

  function doInvest(amount) {
    const s = TVState.current;
    const st = B.st;
    const payVal = currentDealValuation();
    amount = TVFundMath.capTicketAmount(amount, payVal);
    if (s.cash < amount) { miniLog(c("c-red", "CASH INSUFFICIENTE.")); TVAudio.error(); return; }
    const verdict = global.TVDealAccess
      ? TVDealAccess.termSheetVerdict(s, st, {
          rv: B.rv, intel: B.intel, battle: B.battle,
          amount: amount, valuation: payVal
        })
      : { accepted: true, reason: "legacy access" };

    if (verdict.accepted) {
      finalizeInvestment(amount, payVal, verdict.reason);
      return;
    }

    B.pendingTermSheet = { amount: amount, payVal: payVal, verdict: verdict };
    B.phase = "rescue";
    B.log = [c("c-red", "IL FOUNDER NON FIRMA."),
      c("c-yellow", "Motivo: " + verdict.reason),
      c("c-cyan", "Leverage " + verdict.leverage + "/" + verdict.required +
        " // heat " + verdict.heat + "/8"),
      c("c-white", "Ultimo slot? Curioso: il prezzo ha appena trovato spazio."),
      c("c-white", "Scegli: paghi di piu', porti un lead o lasci il tavolo.")];
    TVAudio.error();
    draw();
  }

  function doRescue(num) {
    const s = TVState.current;
    const pending = B.pendingTermSheet;
    if (!pending) { B.phase = "menu"; draw(); arm(); return; }
    if (num === 0) {
      B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
      draw(); arm();
      return;
    }
    if (num === 9) {
      B.pendingTermSheet = null;
      doPass();
      return;
    }
    if (num === 1) {
      const richVal = Math.round(pending.payVal * 1.12);
      const amount = TVFundMath.capTicketAmount(pending.amount, richVal);
      if (s.cash < amount) {
        miniLog(c("c-red", "CASH INSUFFICIENTE PER QUESTO TERM SHEET."));
        TVAudio.error();
        return;
      }
      s.reputation = Math.max(0, s.reputation - 1);
      B.pendingTermSheet = null;
      finalizeInvestment(amount, richVal, "founder-friendly valuation");
      return;
    }
    if (num === 2) {
      if (!B.rv.coInvest && TVGameplay.researchRemaining(B.rv) === 0) {
        miniLog(c("c-yellow", "Agenda esaurita. Senza lead gia' contattato: alza il prezzo o passa."));
        return;
      }
      const cost = B.rv.coInvest ? 0 : 100_000;
      const amount = TVFundMath.capTicketAmount(pending.amount, pending.payVal);
      if (s.cash < cost + amount) {
        miniLog(c("c-red", "CASH INSUFFICIENTE PER LEAD + TERM SHEET."));
        TVAudio.error();
        return;
      }
      s.cash -= cost;
      s.researchSpent += cost;
      B.rv.coInvest = true;
      B.pendingTermSheet = null;
      finalizeInvestment(amount, pending.payVal, "lead investor unlocked allocation");
    }
  }

  function decisionFeedback(decision, summary) {
    const read = TVGameplay.decisionRead(TVState.current, B.st, B.rv, B.intel, decision, summary);
    return [c(read.tone, read.line), c("c-white", read.lesson)];
  }

  function recordDecision(decision) {
    if (B.rv.decisionReceipt) return B.rv.decisionReceipt;
    const s = TVState.current;
    const context = { decision, rv: B.rv, intel: B.intel, battle: B.battle };
    const ops = TVPostBattleEvents.recordAfterBattle(s, B.st, context);
    TVPortfolioIncidents.queueAfterBattle(s, B.st, context);
    B.rv.decisionReceipt = {
      decision, summary: B.lastDecisionSummary || { decision }, ops, acknowledged: false
    };
    TVState.save();
    return B.rv.decisionReceipt;
  }

  function startPostBattleEvent(decision) {
    const s = TVState.current;
    const ops = recordDecision(decision).ops;
    const summary = B.lastDecisionSummary || { decision: decision };
    B.postBattleEvent = { summary: true, decision: decision };
    B.phase = "postEvent";

    const lines = [c("c-yellow", "DEAL MEMO // " + B.st.name)];
    if (decision === "invested") {
      lines.push(c("c-green", "DECISIONE: INVESTITO"));
      lines.push(c("c-white", "Ticket: " + TVRender.eur(summary.amount || 0)));
      lines.push(c("c-white", "Entry valuation: " + TVRender.eur(summary.valuation || currentDealValuation())));
      lines.push(c("c-white", "Ownership: " + (((summary.equityPct || 0) * 100).toFixed(1)) + "%"));
      lines.push(c("c-cyan", "Cash residuo: " + TVRender.eur(s.cash)));
    } else if (decision === "lost") {
      lines.push(c("c-red", "DECISIONE: DEAL PERSO"));
      lines.push(c("c-white", "Il founder ti ha chiuso fuori dal round."));
      lines.push(c("c-cyan", "Reputation: " + s.reputation));
    } else {
      lines.push(c("c-magenta", "DECISIONE: PASS"));
      lines.push(c("c-white", "Nessun capitale impegnato."));
      lines.push(c("c-cyan", "Cash invariato: " + TVRender.eur(s.cash)));
    }
    lines.push("");
    lines.push(c("c-yellow", "AZIONI FATTE"));
    const actions = [];
    if (B.rv.dd) actions.push("DD");
    if (B.rv.refCall) actions.push("REF CALL");
    if (B.rv.coInvest) actions.push("CO-INVEST");
    if (B.rv.negotiated) actions.push(B.rv.negotiatedValuation ? "VALUATION NEGOZIATA" : "NEGOZIAZIONE FALLITA");
    if (B.rv.pitchWon) actions.push("FOUNDER ROTTO");
    if (B.intel && B.intel.level >= 2) actions.push("TACCUINO " + B.intel.label);
    if (!actions.length) actions.push("solo pitch meeting");
    wrap(actions.join(" // "), 42).forEach(line => lines.push(c("c-white", line)));
    if (B.rv.pitchTruth) {
      lines.push("");
      lines.push(c("c-green", "VERITA':"));
      wrap(B.rv.pitchTruth, 42).forEach(line => lines.push(c("c-white", line)));
    }
    decisionFeedback(decision, summary).forEach(line => lines.push(line));
    // l'evento operativo post-battle: cosa e' successo davvero al fondo
    if (ops && ops.event) {
      lines.push("");
      lines.push(c("c-yellow", "DAL CAMPO // " + ops.event.headline));
      wrap(ops.event.startupName + ": " + (ops.choice.detail || ops.choice.label), 42)
        .forEach(line => lines.push(c("c-white", line)));
      ((ops.report && ops.report.metrics) || []).forEach(m => {
        lines.push(c("c-cyan", m.label + ": " + m.before + " -> " + m.after +
          " (" + m.delta + ")"));
      });
      ((ops.report && ops.report.notes) || []).forEach(n => {
        wrap(n.text, 42).forEach(line => lines.push(c("c-magenta", line)));
      });
    }
    B.log = lines;
    B.busy = false;
    arm();
  }

  function finishPostBattleEvent() {
    if (B.rv.decisionReceipt) B.rv.decisionReceipt.acknowledged = true;
    TVState.save();
    B.postBattleEvent = null;
    exitToDealflow();
  }

  function doPass() {
    const s = TVState.current;
    if (TVDealflow.getDecision(s, B.st.id) !== "pending") return;
    TVDealflow.setDecision(s, B.st.id, "passed");
    s.history.push({ year: s.year, type: "pass", startup: B.st.name });
    B.lastDecisionSummary = { decision: "passed" };
    recordDecision("passed");
    seq([{ log: [c("c-yellow", "'Vi teniamo nel radar.' Il radar era spento."),
      c("c-magenta", "Il founder aggiorna la lista dei fondi che 'non capiscono il mercato'.")],
      ms: 300, sound: () => TVAudio.pageChange() }], () => startPostBattleEvent("passed"));
  }

  // ---------- routing input ----------
  function miniLog(line) {
    B.log = B.log.concat(["", line]);
    draw();
  }

  function arm() {
    draw();
    TVRouter.setActionHandler(handleAction);
  }

  function handleAction(num) {
    if (!B) return;
    if (B.busy) {
      const advance = B.advance;
      if (advance) {
        B.advance = null;
        advance();
      }
      return;
    }
    if (B.phase === "postEvent") {
      if (num === 1) finishPostBattleEvent();
      return;
    }
    if (B.phase === "rescue") {
      doRescue(num);
      return;
    }
    if (B.phase === "negotiate") {
      if (num === 1) adjustNegotiationValuation(-5_000_000);
      else if (num === 2) adjustNegotiationValuation(-1_000_000);
      else if (num === 3) adjustNegotiationValuation(1_000_000);
      else if (num === 4) adjustNegotiationValuation(5_000_000);
      else if (num === 6) submitNegotiation();
      else if (num === 0) {
        B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
        B.log = B.log.concat(["", c("c-blue", "Negoziazione annullata.")]);
        draw();
      }
      return;
    }
    if (B.phase === "invest") {
      const options = TVFundMath.termSheetOptions(B.st, currentDealValuation());
      if (num >= 1 && num <= 3) doInvest(options[num - 1].amount);
      else if (num === 4) adjustCustomTicket(-TVFundMath.TICKET_STEP);
      else if (num === 5) adjustCustomTicket(TVFundMath.TICKET_STEP);
      else if (num === 6) doInvest(currentCustomTicket());
      else if (num === 0) {
        B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
        draw();
      }
      return;
    }
    switch (num) {
      case 1: case 2: case 3: case 4:
        if (B.phase === "broken") { miniLog(c("c-magenta", "E' gia' crollato. Decidi.")); return; }
        if (B.battle.usedMoves && B.battle.usedMoves[num]) {
          miniLog(c("c-yellow", "Domanda gia' fatta. Cambia angolo."));
          TVAudio.error();
          return;
        }
        doQuestion(num);
        break;
      case 5: doDD(); break;
      case 6: doRefCall(); break;
      case 7: doNegotiate(); break;
      case 8: doCoInvest(); break;
      case 9: doPass(); break;
      case 0: openInvestPhase(); break;
    }
  }

  function exitToDealflow() {
    stop();
    TVRouter.goto(200, { skipLoading: true });
  }

  function stop() {
    if (B) {
      clearTimeout(B.seqTimer);
      B.advance = null;
    }
    B = null;
    if (TVAudio.stopBattleMusic) TVAudio.stopBattleMusic();
  }

  global.TVPitchLive = { start, stop };
})(window);
