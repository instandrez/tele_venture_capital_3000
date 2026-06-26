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
   - 0    INVESTI      (lanci il term sheet: 1M/3M/5M)

   POSTA IN GIOCO: credibilità a zero = il founder ti butta fuori
   dal round. Deal perso, -2 reputazione. La guardia a zero = la
   verità sugli unit economics + negoziazione in discesa.

   Anti save-scumming: lo stato della battaglia (rv.snap) si salva a
   ogni turno; ricaricare riprende ESATTAMENTE da dov'eri. */
(function (global) {

  let B = null; // { st, pageNum, battle, rv, phase, log, dispGuard, dispCred, fx, busy }

  // ---------- entry ----------
  function start(st, pageNum) {
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
      resumed = true;
    } else {
      battle = TVPitchBattle.newBattle(st.founderProfile, {
        intelShield: intel.shield,
        intelMove: intel.lead && intel.lead.move,
        intelPower: intel.leadPower
      });
    }
    if (!battle.usedMoves) battle.usedMoves = {};

    B = {
      st: st, pageNum: pageNum, battle: battle, rv: rv, intel: intel,
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
        bob: 0
      },
      busy: false,
      awaitingAdvance: false,
      advance: null,
      seqTimer: null
    };

    // idle bob: il founder ondeggia in attesa, come su console
    const t = setInterval(function () {
      if (!B || B.bobTimer !== t || !alive()) { clearInterval(t); return; }
      if (!B.busy && !B.battle.over && B.fx.enemyReveal >= 9) {
        B.fx.bob = B.fx.bob ? 0 : 1;
        draw();
      }
    }, 680);
    B.bobTimer = t;

    TVAudio.startBattleMusic();
    arm();

    if (resumed) {
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

  function unitLabel(value) {
    if (value >= 0.35) return "margini veri, non solo crescita";
    if (value >= 0.05) return "unit economics quasi in equilibrio";
    if (value >= -0.35) return "ogni cliente costa ancora capitale";
    return "burn per cliente molto pesante";
  }

  function valuationMultiple(st) {
    const traction = Math.max(1, st.traction || 0);
    return st.valuation / traction;
  }

  function meetingNoteForMove(st, moveId, outcome) {
    const val = TVRender.eur(st.valuation);
    if (moveId === 1) {
      const traction = scoreLabel(st.traction || 0, 6, 2);
      const unit = unitLabel(st.unitEconomics || 0);
      if (outcome === "resist") {
        return "Numeri provati a memoria: traction " + traction +
          ", ma il founder evita coorti e payback.";
      }
      return "Numeri: traction " + traction + ", " + unit +
        ". Valuation in ingresso " + val + ".";
    }
    if (moveId === 2) {
      const crowded = (st.hype || 0) >= 8 || (st.hypeDecay || 0) >= 0.6;
      const reg = (st.regulatoryExposure || 0) < -0.3
        ? "vento regolatorio contrario"
        : ((st.regulatoryExposure || 0) > 0.3
          ? "regolazione potenzialmente favorevole"
          : "regolazione neutra");
      if (outcome === "resist") {
        return "Competitor: risponde con category design, non con moat. " +
          (crowded ? "Mercato affollato/hype." : reg + ".");
      }
      return "Competitor: " + (crowded
        ? "mercato rumoroso, serve moat reale"
        : "spazio meno affollato") + "; " + reg + ".";
    }
    if (moveId === 3) {
      const team = scoreLabel(st.team || 0, 8, 4);
      const fit = scoreLabel(st.strategicFit || 0, 7, 3);
      if (outcome === "resist") {
        return "Team: risposta difensiva. Team " + team +
          ", founder risk da verificare con reference.";
      }
      return "Team: qualita' " + team + ", strategic fit " + fit +
        ". Qui conta execution risk.";
    }
    if (moveId === 4) {
      const premium = valuationMultiple(st) > 8_000_000 || (st.hype || 0) >= 8;
      if (outcome === "resist") {
        return "Silenzio: non si scompone. Segnale di controllo, ma chiede ancora " + val + ".";
      }
      return "Founder tell: " + (premium
        ? "molta narrativa nel prezzo, chiedi sconto"
        : "prezzo meno gonfio dal racconto") + "; upside da verificare con DD.";
    }
    return "";
  }

  function addMeetingNote(moveId, text) {
    if (!text) return;
    if (!B.rv.meetingNotes) B.rv.meetingNotes = [];
    const key = "m" + moveId;
    const existing = B.rv.meetingNotes.find(n => n.key === key);
    if (existing) existing.text = text;
    else B.rv.meetingNotes.push({ key: key, move: moveId, text: text });
  }

  function noteLines(text) {
    const out = [c("c-yellow", "MEETING NOTE")];
    wrap(text, 38).slice(0, 3).forEach(line => out.push(c("c-white", line)));
    return out;
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
    const bobbing = founder && !B.battle.over && B.fx.enemyReveal >= 9 && B.fx.bob;
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
      (cls || "") + (done ? " is-done" : "") + '">' +
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
      return TVFundMath.ticketOptions(B.st).map((amount, index) => {
        const ownership = TVFundMath.ownershipPct(amount, payVal) * 100;
        return command(index + 1,
          "TS " + TVRender.eur(amount) + " // " + ownership.toFixed(1) + "%",
          "is-invest");
      }).concat([
        command(0, "ANNULLA", "is-danger")
      ]).join("");
    }

    const broken = B.phase === "broken";
    const leadMove = B.battle.intelStrikeAvailable ? B.battle.intelMove : null;
    const usedMoves = B.battle.usedMoves || {};
    function moveDone(id) {
      return broken || !!usedMoves[id];
    }
    return [
      command(1, (leadMove === 1 ? "★ " : "") + "NUMERI",
        leadMove === 1 ? "is-intel" : "", moveDone(1)),
      command(2, (leadMove === 2 ? "★ " : "") + "COMPETITOR",
        leadMove === 2 ? "is-intel" : "", moveDone(2)),
      command(3, (leadMove === 3 ? "★ " : "") + "TEAM",
        leadMove === 3 ? "is-intel" : "", moveDone(3)),
      command(4, (leadMove === 4 ? "★ " : "") + "SILENZIO",
        leadMove === 4 ? "is-intel" : "", moveDone(4)),
      command(5, rv.dd ? "DD COMPLETA" : "DD " + TVRender.eur(B.intel.ddCost), "is-research", rv.dd),
      command(6, rv.refCall ? "REF COMPLETA" : "REF CALL 50k", "is-research", rv.refCall),
      command(7, rv.negotiated
        ? (rv.negotiatedValuation ? "VALUATION LOCK" : "NEGOZIA FALLITA")
        : "NEGOZIA VAL.", "is-research", rv.negotiated),
      command(8, rv.coInvest ? "CO-INVEST OK" : "CO-INVEST", "is-research", rv.coInvest),
      command(9, "PASSA", "is-danger"),
      command(0, "TERM SHEET", "is-invest")
    ].join("");
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
      '<span>PRESSIONE ' + pressure + "/10" + '</span>' +
      '<span>ASK VAL ' + TVRender.eur(valuation) + '</span>' +
    '</div>';
  }

  function battleSceneHtml() {
    const r = TVRender;
    const s = TVState.current;
    const logZone = B.log.filter(line => line !== "").slice(-4);
    const dialogue = logZone.length
      ? logZone.join("<br>")
      : c("c-yellow", "Il founder ti osserva. Tocca a te.");
    const phase = B.phase === "invest" ? "TERM SHEET" :
      (B.phase === "broken" ? "PRESSIONE MASSIMA" : "PITCH BATTLE");

    return (
      '<section class="console-scene battle-scene">' +
        '<div class="battle-bg"></div><div class="battle-flash"></div>' +
        '<header class="battle-topbar">' +
          '<span class="battle-round">ANNO ' + s.year + " // ROUND " + (B.battle.turn + 1) + '</span>' +
          '<span class="stage-name">' + phase + '</span>' +
          '<span class="battle-cash">FONDO ' + r.eur(s.cash) + '</span>' +
        '</header>' +
        intelStatusHtml() +
        fighterHtml("player") +
        fighterHtml("founder") +
        '<div class="battle-bottom">' +
          '<section class="battle-dialogue">' +
            '<div class="dialogue-speaker">' + TVRender.escape(B.st.name) + '</div>' +
            '<div class="dialogue-lines">' + dialogue + '</div>' +
            '<div class="battle-hint">' + hintHtml() + '</div>' +
          '</section>' +
          '<section class="battle-commands">' + commandsHtml() + '</section>' +
        '</div>' +
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
    B.busy = true;
    B.awaitingAdvance = false;
    let i = 0;
    const finish = () => {
      if (!B) return;
      B.busy = false;
      B.awaitingAdvance = false;
      B.advance = null;
      B.seqTimer = null;
      if (done) done();
    };
    const next = () => {
      if (!alive()) { if (B) B.busy = false; return; }
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
        B.seqTimer = setTimeout(next, stp.ms || 450);
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

  /* drena una barra un blocco alla volta (tick sonoro per blocco) */
  function drainSteps(prop, target, fromValue) {
    const steps = [];
    const from = typeof fromValue === "number" ? fromValue : B[prop];
    for (let v = from - 1; v >= target; v--) {
      steps.push({
        fn: (val => () => { B[prop] = val; })(v),
        ms: 90,
        sound: () => TVAudio.keyPress()
      });
    }
    return steps;
  }

  // ---------- intro ----------
  function playIntro() {
    const st = B.st;
    const pitch = (TVPitches.forStartup(st.id) || []).slice(0, 4);
    const s = TVState.current;

    const steps = [];
    if (!s.tutorialFlags) s.tutorialFlags = {};
    if (!s.tutorialFlags.pitchBattle) {
      s.tutorialFlags.pitchBattle = true;
      TVState.save();
      steps.push(
        { log: [c("c-yellow", "PITCH BATTLE = DUE OBIETTIVI"),
                c("c-white", "1 capire se il deal vale"),
                c("c-white", "2 ottenere condizioni migliori")],
          waitForInput: true },
        { log: [c("c-cyan", "DOMANDE 1-4"),
                c("c-white", "abbassano la resistenza founder."),
                c("c-white", "Resistenza giu' = ASK VAL giu'."),
                c("c-white", "Meno valuation = piu' ownership.")],
          waitForInput: true },
        { log: [c("c-green", "INFORMAZIONI"),
                c("c-white", "DD scopre rischio/upside."),
                c("c-white", "Ref call rivela il tipo founder."),
                c("c-white", "Co-invest dice chi c'e' nel round.")],
          waitForInput: true },
        { log: [c("c-magenta", "TERM SHEET"),
                c("c-white", "Premi 7 per provare l'affondo."),
                c("c-white", "Premi 0 solo quando sai"),
                c("c-white", "se il prezzo ha senso.")],
          waitForInput: true }
      );
    }

    steps.push.apply(steps, [
      { log: [c("c-white", "Sala riunioni. Neon. Acqua frizzante.")], ms: 800 },
      { push: [
          c(B.intel.level >= 2 ? "c-green" : "c-red",
            "TACCUINO: " + B.intel.label + " (" +
              B.intel.evidenceScore.toFixed(1) + "/5 prove)"),
          c("c-white", B.intel.shield
            ? B.intel.shield + " contrattacchi saranno assorbiti."
            : "Nessuna copertura: ogni domanda costa controllo.")
        ].concat(B.intel.lead
          ? [c("c-green", "DOMANDA ARMATA: " + B.intel.lead.move + " " +
              B.intel.lead.label)]
          : []).concat(B.intel.privateClue
          ? [c("c-magenta", "FONTE INTERNA: " + B.intel.privateClue)]
          : []), waitForInput: true },
      { push: [c("c-white", "IL FOUNDER ENTRA IN SALA...")], ms: 700,
        sound: () => TVAudio.pageChange() }
    ]);
    // lo sprite si materializza riga per riga (decode teletext)
    for (let i = 1; i <= 9; i++) {
      steps.push({
        fn: (v => () => { B.fx.enemyReveal = v; })(i),
        ms: 100, sound: () => TVAudio.keyPress()
      });
    }
    steps.push({ log: [c("c-yellow", "Un FOUNDER selvaggio ti pitcha:")], ms: 650,
                 sound: () => TVAudio.success() });
    // niente virgolette e niente riga "COSA FAI?": le 4 righe del
    // pitch devono restare TUTTE nel box — e' li' che si legge la
    // debolezza. Il menu sotto e' gia' la domanda.
    pitch.forEach(line => {
      const pitchLines = wrap(line, 36).slice(0, 2).map(l => c("c-cyan", l));
      steps.push({ push: pitchLines, ms: 520,
                   sound: () => TVAudio.keyPress() });
    });

    seq(steps, () => arm());
  }

  // ---------- mosse: domande (1-4) ----------
  const MOVE_NAMES = { 1: "I NUMERI, PREGO", 2: "E I COMPETITOR?",
                       3: "PARLAMI DEL TEAM", 4: "SILENZIO IMBARAZZANTE" };

  function doQuestion(moveId) {
    const b = B.battle;
    const p = TVPitchBattle.PROFILES[b.profile];
    const guardBefore = b.guard;
    const credBefore = b.cred;
    const pressureBefore = pressurePoints(guardBefore);
    const valuationBefore = dealValuationForGuard(guardBefore);

    TVPitchBattle.applyMove(b, moveId);
    const guardHit = guardBefore - b.guard;   // PV tolti al founder
    const pressureAfter = pressurePoints(b.guard);
    const pressureGain = pressureAfter - pressureBefore;
    const valuationAfter = dealValuationForGuard(b.guard);
    const valuationLine = valuationAfter < valuationBefore
      ? c("c-cyan", "ASK VAL " + TVRender.eur(valuationBefore) +
          " -> " + TVRender.eur(valuationAfter))
      : null;
    const noteText = meetingNoteForMove(B.st, moveId, b.lastOutcome);
    addMeetingNote(moveId, noteText);

    const youLine = c("c-white", "TU usi ") + c("c-yellow", MOVE_NAMES[moveId]) + c("c-white", "!");
    const steps = [
      { log: [youLine], ms: 550, sound: () => TVAudio.keyPress() },
      { log: [youLine, c("c-cyan", "      ►►►")], ms: 130 },
      { log: [youLine, c("c-cyan", "            ►►►")], ms: 130 },
      { log: [youLine, c("c-cyan", "                  ►►►")], ms: 130 }
    ];

    // impatto — col numero di danno, gusto Pokemon
    if (b.lastOutcome === "weak") {
      steps.push({ log: [youLine, c("c-green", "DOMANDA FORTE!  ") +
                         c("c-yellow", "PRESSIONE +" + pressureGain)]
                         .concat(b.intelTriggered
                           ? [c("c-green", "★ DOSSIER STRIKE: la prova entra nel verbale.")]
                           : []),
                   ms: 700, shake: true, shield: b.intelTriggered,
                   sound: () => TVAudio.success() });
      steps.push.apply(steps, drainSteps("dispGuard", b.guard));
    } else if (b.lastOutcome === "resist") {
      const parryLog = [youLine, c("c-red", "PARATA! Perdi controllo della sala  ") +
                        c("c-yellow", "-2")];
      if (b.intelTriggered) {
        parryLog.push(c("c-green", "★ MA LA PROVA LO INCASTRA: -" +
          b.intelPower + " pressione"));
      }
      steps.push({ log: parryLog, ms: 700, shake: true,
                   shield: b.intelTriggered, sound: () => TVAudio.error() });
      steps.push.apply(steps, drainSteps("dispCred", Math.max(0, credBefore - 2)));
      if (b.intelTriggered) steps.push.apply(steps, drainSteps("dispGuard", b.guard));
    } else {
      steps.push({ log: [youLine, c("c-cyan", "Il pitch-script cede.  ") +
                         c("c-yellow", "PRESSIONE +" + pressureGain)]
                         .concat(b.intelTriggered
                           ? [c("c-green", "★ DOSSIER STRIKE: +" +
                               b.intelPower + " pressione, replica negata.")]
                           : []),
                   ms: 700, shield: b.intelTriggered,
                   sound: () => TVAudio.pageChange() });
      steps.push.apply(steps, drainSteps("dispGuard", b.guard));
    }

    if (valuationLine) {
      steps.push({ push: [valuationLine], ms: 520,
                   sound: () => TVAudio.pageChange() });
    }

    // reazione del founder
    const reaction = wrap(p.react[moveId] || "", 36).map(l => c("c-white", l));
    steps.push({ push: reaction, waitForInput: true });
    if (noteText) {
      steps.push({ push: [""].concat(noteLines(noteText)),
                   waitForInput: true, sound: () => TVAudio.success() });
    }

    if (b.over && b.won) {
      // vittoria!
      steps.push({ log: [c("c-yellow", "RESISTENZA FOUNDER A ZERO!")],
                   ms: 600, flash: true, sound: () => TVAudio.fanfare() });
      steps.push.apply(steps, drainSteps("dispGuard", 0));
      // lo sprite del founder cade dietro la pedana, riga per riga
      for (let d = 1; d <= 9; d++) {
        steps.push({ fn: (v => () => { B.fx.enemyDrop = v; })(d),
                     ms: 75, sound: () => TVAudio.keyPress() });
      }
      const crack = wrap(p.crack, 36).map(l => c("c-yellow", l));
      steps.push({ push: crack, waitForInput: true });
      steps.push({
        fn: () => {
          B.rv.pitchWon = true;
          B.rv.pitchTruth = TVPitchBattle.truthFor(B.st);
          TVState.current.reputation = Math.min(100, TVState.current.reputation + 1);
          B.phase = "broken";
          snap();
        },
        push: [c("c-white", "LA VERITA':")]
          .concat(wrap(TVPitchBattle.truthFor(B.st), 34).map(l => c("c-green", l)))
          .concat([c("c-cyan", "ASK VAL: " + TVRender.eur(currentDealValuation())),
                   c("c-cyan", "+1 reputazione. Ora decidi.")]),
        waitForInput: true
      });
      seq(steps, () => arm());
      return;
    }

    // Ogni domanda cede tempo al founder. Il dossier puo' assorbire
    // i primi contrattacchi e rende tangibile il valore delle news lette.
    if (b.counterBlocked) {
      const blockTitle = b.counterBlockSource === "strong"
        ? "DOMANDA PERFETTA: IL FOUNDER NON RILANCIA."
        : (b.counterBlockSource === "lead"
          ? "IL DOSSIER SMONTA " + p.attack + "!"
          : "LA TEORIA ANTICIPA " + p.attack + "!");
      const blockDetail = b.counterBlockSource === "strong"
        ? "Hai guadagnato pressione senza perdere controllo sala."
        : (b.counterBlockSource === "lead"
          ? "Prova citata. Il founder non puo' cambiare discorso."
          : "Contrattacco bloccato. Controllo invariato.");
      steps.push({ push: ["", c("c-green", blockTitle),
                          c("c-cyan", blockDetail)],
                   waitForInput: true, shield: true, sound: () => TVAudio.success() });
    } else if (b.lastOutcome === "resist") {
      steps.push({ push: ["", c("c-magenta", "FOUNDER ribalta " + p.attack + "."),
                          c("c-yellow", "COSTO ERRORE: -2 CONTROLLO SALA"),
                          c("c-white", p.attackLine)],
                   waitForInput: true, sound: () => TVAudio.error() });
    } else {
      steps.push({ push: ["", c("c-magenta", "FOUNDER usa " + p.attack + "!"),
                          c("c-yellow", "COSTO DEL TURNO: -1 CONTROLLO SALA"),
                          c("c-white", p.attackLine)],
                   waitForInput: true, sound: () => TVAudio.error() });
      const counterFrom = b.lastOutcome === "resist" ? Math.max(0, credBefore - 2) : undefined;
      steps.push.apply(steps, drainSteps("dispCred", b.cred, counterFrom));
    }

    if (b.over && !b.won) {
      // sconfitta: fuori dal round — stavolta cadi tu
      steps.push({ log: [c("c-red", "HAI PERSO IL CONTROLLO DELLA SALA.")],
                   ms: 900, shake: true, sound: () => TVAudio.dirge() });
      for (let d = 1; d <= 5; d++) {
        steps.push({ fn: (v => () => { B.fx.playerDrop = v; })(d),
                     ms: 90, sound: () => TVAudio.keyPress() });
      }
      steps.push({ push: [c("c-white", "Il founder guarda l'orologio."),
                          c("c-yellow", '"Abbiamo altri 12 fondi in coda."')],
                   waitForInput: true });
      steps.push({
        fn: () => {
          const s = TVState.current;
          B.rv.pitchLost = true;
          s.reputation = Math.max(0, s.reputation - 2);
          TVDealflow.setDecision(s, B.st.id, "passed");
          s.history.push({ year: s.year, type: "pass", startup: B.st.name,
                           note: "buttato fuori dal pitch" });
          snap();
        },
        push: ["", c("c-red", "SEI FUORI DAL DEAL. -2 reputazione.")],
        waitForInput: true, sound: () => TVAudio.error()
      });
      seq(steps, () => exitToDealflow());
      return;
    }

    steps.push({ push: ["",
                        c("c-cyan", "STATO: PRESSIONE " + pressureAfter + "/10 | ASK VAL " +
                          TVRender.eur(valuationAfter)),
                        c("c-cyan", "SALA " + b.cred + "/" +
                          (b.credMax || TVPitchBattle.CRED_MAX)),
                        c("c-white", "COSA FAI?")], ms: 260,
                 fn: () => snap() });
    seq(steps, () => arm());
  }

  // ---------- azioni di ricerca (5/6/8) e negoziazione (7) ----------
  function doDD() {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    if (rv.dd) { miniLog(c("c-blue", "DD gia' fatta.")); return; }
    const dossier = B.intel.level >= 2;
    const cost = B.intel.ddCost;
    if (s.cash < cost) { miniLog(c("c-red", "CASH INSUFFICIENTE.")); TVAudio.error(); return; }
    s.cash -= cost;
    s.researchSpent += cost;
    rv.dd = true;
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
    if (rv.refCall) { miniLog(c("c-blue", "Ref call gia' fatta.")); return; }
    if (s.cash < 50_000) { miniLog(c("c-red", "CASH INSUFFICIENTE.")); TVAudio.error(); return; }
    s.cash -= 50_000;
    s.researchSpent += 50_000;
    rv.refCall = true;
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
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    const b = B.battle;
    if (rv.negotiated) { miniLog(c("c-blue", "Gia' negoziata.")); return; }

    // più hai scalfito la guardia, più il founder cede al tavolo
    let prob = 0.35 +
      (1 - b.guard / TVPitchBattle.GUARD_MAX) * 0.35 +
      (rv.dd ? 0.10 : 0) +
      B.intel.negotiationBonus;
    const chance = Math.round(Math.max(0, Math.min(0.95, prob)) * 100);
    const ok = TVState.roll("nego|" + st.id + "|" + s.year) < prob;
    const currentVal = currentDealValuation();
    rv.negotiated = true;

    const steps = [
      { log: [c("c-white", "Butti li':"),
              c("c-cyan", "Pressione negoziale: " +
                pressurePoints(b.guard) + "/10"),
              c("c-cyan", "ASK VAL attuale: " + TVRender.eur(currentVal)),
              c("c-yellow", "Chance stimata: " + chance + "%")], ms: 900 },
      { push: [c("c-yellow", "\"Quella valuation... e' un'opinione.\"")], ms: 1100,
        sound: () => TVAudio.keyPress() }
    ];
    if (ok) {
      rv.negotiatedValuation = Math.round(currentVal * 0.88);
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
    seq(steps, () => arm());
  }

  function doCoInvest() {
    const s = TVState.current;
    const rv = B.rv;
    if (rv.coInvest) { miniLog(c("c-blue", "Gia' verificato.")); return; }
    if (s.cash < 30_000) { miniLog(c("c-red", "CASH INSUFFICIENTE.")); TVAudio.error(); return; }
    s.cash -= 30_000;
    s.researchSpent += 30_000;
    rv.coInvest = true;
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
  function doInvest(amount) {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    if (s.cash < amount) {
      miniLog(c("c-red", "CASH INSUFFICIENTE."));
      TVAudio.error();
      B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
      draw(); arm();
      return;
    }
    const baseVal = st.valuation;
    const payVal = currentDealValuation();
    const equityPct = TVFundMath.ownershipPct(amount, payVal);
    s.cash -= amount;
    s.invested += amount;
    s.portfolio.push({
      id: st.id, name: st.name, sector: st.sector, sectorTag: st.sectorTag,
      investedAmount: amount, entryValuation: payVal, equityPct: equityPct,
      entryYear: s.year,
      currentValueMultiplier: baseVal / payVal,
      status: "active", realizedAmount: 0,
      revealed: Object.assign({}, rv)
    });
    TVDealflow.setDecision(s, st.id, "invested");
    s.history.push({ year: s.year, type: "invest", startup: st.name, amount: amount });
    TVState.save();

    const eur = TVRender.eur(amount);
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
      { push: ["", c("c-green", "HA GIA' FIRMATO."),
               c("c-green", "AFFARE FATTO: " + eur + " // " +
                 (equityPct * 100).toFixed(1) + "%"),
               c("c-cyan", "VALUATION: " + TVRender.eur(payVal))], ms: 1500,
        flash: true, sound: () => TVAudio.fanfare() }
    ], () => exitToDealflow());
  }

  function doPass() {
    const s = TVState.current;
    TVDealflow.setDecision(s, B.st.id, "passed");
    s.history.push({ year: s.year, type: "pass", startup: B.st.name });
    TVState.save();

    seq([
      { log: [c("c-white", "Ti alzi con eleganza.")], ms: 800 },
      { push: [c("c-yellow", "\"Vi terremo aggiornati\", menti.")], ms: 1000,
        sound: () => TVAudio.keyPress() },
      { push: ["", c("c-magenta", "Il founder ti rimuove da LinkedIn.")], ms: 1200,
        sound: () => TVAudio.pageChange() }
    ], () => exitToDealflow());
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
    if (B.phase === "invest") {
      const tickets = TVFundMath.ticketOptions(B.st);
      if (num >= 1 && num <= 3) doInvest(tickets[num - 1]);
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
      case 0: B.phase = "invest"; draw(); break;
    }
  }

  function exitToDealflow() {
    TVAudio.stopBattleMusic();
    if (B && B.bobTimer) clearInterval(B.bobTimer);
    B = null;
    TVRouter.goto(200, { skipLoading: true });
  }

  global.TVPitchLive = { start };
})(window);
