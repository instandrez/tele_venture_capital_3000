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

    TVAudio.startBattleMusic(B.musicTheme);
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

  function unitShortLabel(value) {
    if (value >= 0.35) return "UE solidi";
    if (value >= 0.05) return "UE quasi pari";
    if (value >= -0.35) return "CAC non ripaga";
    return "burn cliente pesante";
  }

  function valuationMultiple(st) {
    const traction = Math.max(1, st.traction || 0);
    return st.valuation / traction;
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

  function scriptedFate(st) {
    const exits = global.TVExits && TVExits.EXIT_EVENTS;
    return exits && exits.find(e => e.startupId === st.id);
  }

  function fateLine(st) {
    const ev = scriptedFate(st);
    const horizon = (TVState.current && TVState.current.maxYear) || 3;
    if (!ev) {
      if (st.id === "saltcore") {
        return "OUTCOME: markup probabile ma DPI lontano; carta ricca, exit lenta.";
      }
      return "OUTCOME: nessuna exit facile in calendario; deve crescere sul serio.";
    }
    if (ev.year > horizon) {
      if (ev.kind === "exit" || ev.kind === "ipo") {
        return "OUTCOME: upside oltre i 3 anni; non aspettarti DPI rapido.";
      }
      if (ev.kind === "writeoff" || ev.kind === "writedown") {
        return "OUTCOME: rischio lungo in coda; serve prezzo basso e disciplina.";
      }
      return "OUTCOME: liquidita' fuori orizzonte; conta il mark, non il cash.";
    }
    if (ev.kind === "exit" || ev.kind === "ipo") {
      return "OUTCOME: finestra positiva anno " + ev.year + " - " + ev.note + ".";
    }
    if (ev.kind === "acquihire") {
      return "OUTCOME: salva il team, non il prodotto - " + ev.note + ".";
    }
    if (ev.kind === "writedown") {
      return "OUTCOME: valuation trap - " + ev.note + ".";
    }
    return "OUTCOME: downside reale anno " + ev.year + " - " + ev.note + ".";
  }

  function investorRead(st, outcome) {
    const score =
      (st.team || 0) * 0.23 +
      (st.traction || 0) * 0.25 +
      (st.strategicFit || 0) * 0.14 +
      ((st.unitEconomics || 0) + 1) * 2.1 -
      (st.hype || 0) * 0.07 -
      (st.hypeDecay || 0) * 1.4;
    const prefix = outcome === "resist" ? "VC READ: risposta bella, prova debole. " : "VC READ: ";
    if (score >= 6.6) return prefix + "sostanza sopra teatro, prezzo da negoziare.";
    if (score >= 4.8) return prefix + "opzione vera, ma serve sconto o prova esterna.";
    return prefix + "rischio narrativo alto: paghi molto futuro non verificato.";
  }

  function marketRead(st) {
    const reg = (st.regulatoryExposure || 0) < -0.35
      ? "regolazione contro"
      : ((st.regulatoryExposure || 0) > 0.35 ? "regolazione a favore" : "regolazione neutra");
    const heat = (st.hype || 0) >= 8 || (st.hypeDecay || 0) >= 0.6
      ? "mercato caldo ma fragile"
      : "mercato meno rumoroso";
    return "MARKET: " + rootSector(st) + ", " + heat + ", " + reg + ".";
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

  function technologyRead(st) {
    const fit = st.strategicFit || 0;
    if (fit >= 8) return "TECHNOLOGY: asset strategico credibile, serve verifica IP/integrazione.";
    if ((st.traction || 0) >= 6) return "TECHNOLOGY: prodotto abbastanza maturo da reggere clienti veri.";
    if ((st.hype || 0) >= 8 && (st.traction || 0) <= 2) {
      return "TECHNOLOGY: demo forte, produzione ancora da dimostrare.";
    }
    return "TECHNOLOGY: vantaggio possibile, ma non ancora evidente nel dato.";
  }

  function priceRead(st) {
    const traction = Math.max(1, st.traction || 0);
    const valPerTraction = Math.round((st.valuation || 0) / traction);
    const heat = valPerTraction > 9_000_000 || (st.hype || 0) >= 8
      ? "prezzo da narrative round"
      : "prezzo non folle se i dati tengono";
    return "VALUATION: ask " + TVRender.eur(st.valuation) + ", " + heat + ".";
  }

  function meetingNoteForMove(st, moveId, outcome) {
    const business = DEAL_CONTEXT[st.id] || (st.name + ": segnali da interpretare.");
    if (moveId === 1) {
      return [
        "BUSINESS: " + business + ".",
        "TRACTION: " + (st.traction || 0) + "/10, " + unitShortLabel(st.unitEconomics || 0) + ".",
        "UPSIDE: " + st.hiddenUpside + ".",
        investorRead(st, outcome)
      ].join("\n");
    }
    if (moveId === 2) {
      return [
        "BUSINESS: " + business + ".",
        marketRead(st),
        competitionRead(st),
        "RED FLAG: " + st.hiddenRisk + ".",
        fateLine(st)
      ].join("\n");
    }
    if (moveId === 3) {
      return [
        "BUSINESS: " + business + ".",
        "TEAM: " + scoreLabel(st.team || 0, 8, 4) +
          ", founder " + TVPitchBattle.founderLabel(st.founderProfile) + ".",
        "EXECUTION: strategic fit " + (st.strategicFit || 0) + "/10.",
        "GOVERNANCE: " + st.hiddenRisk + ".",
        investorRead(st, outcome)
      ].join("\n");
    }
    if (moveId === 4) {
      return [
        "BUSINESS: " + business + ".",
        priceRead(st),
        technologyRead(st),
        "FOUNDER SIGNAL: " + (outcome === "resist"
          ? "regge il vuoto; forse controlla davvero il round."
          : "nel silenzio lascia cadere il dettaglio che conta."),
        fateLine(st)
      ].join("\n");
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
    const out = [c("c-yellow", "MEETING NOTE // " + B.st.name)];
    String(text || "").split(/\n+/).filter(Boolean).forEach(part => {
      wrap(part, 42).forEach((line, idx) => {
        out.push(c("c-white", idx ? "  " + line : line));
      });
    });
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
      const custom = currentCustomTicket();
      const customOwnership = TVFundMath.ownershipPct(custom, payVal) * 100;
      const fixed = TVFundMath.termSheetOptions(B.st, payVal).map((option, index) => {
        const ownership = option.ownership * 100;
        return command(index + 1,
          (option.capped ? "MAX TS " : "TS ") +
            TVRender.eur(option.amount) + " // " + ownership.toFixed(1) + "%",
          "is-invest");
      });
      return fixed.concat([
        command(4, "-1M TICKET", "is-research"),
        command(5, "+1M TICKET", "is-research"),
        command(6, "INVIA " + TVRender.eur(custom) + " // " + customOwnership.toFixed(1) + "%", "is-invest"),
        command(0, "ANNULLA", "is-danger")
      ]).join("");
    }
    if (B.phase === "rescue") {
      return [
        command(1, "ALZA VALUATION", "is-invest"),
        command(2, "PORTA LEAD", "is-research"),
        command(9, "WALK AWAY", "is-danger"),
        command(0, "ANNULLA", "is-danger")
      ].join("");
    }
    if (B.phase === "postEvent" && B.postBattleEvent) {
      return command(1, "CONTINUA AL DEALFLOW", "is-invest wide");
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
      '<span>PRESSIONE ' + pressure + "/" + TVPitchBattle.GUARD_MAX + '</span>' +
      '<span>ASK VAL ' + TVRender.eur(valuation) + '</span>' +
    '</div>';
  }

  function battleSceneHtml() {
    const r = TVRender;
    const s = TVState.current;
    const isMeetingNote = B.log.some(line => String(line).includes("MEETING NOTE"));
    const allLogLines = B.log.filter(line => line !== "");
    let logZone = allLogLines.slice(-4);
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

    return (
      '<section class="console-scene battle-scene battle-stage-' + B.stage.key +
        (isMeetingNote ? " is-note-mode" : "") +
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
      steps.push({ log: noteLines(noteText),
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
    } else {
      // il contrattacco cresce col turno: -1, poi -2, poi -3
      const counterCost = b.lastCounterCost || 1;
      const mood = counterCost >= 3 ? "La sala ormai pende dalle sue labbra."
        : (counterCost >= 2 ? "La sala comincia a spazientirsi." : null);
      const counterLines = ["",
        c("c-magenta", b.lastOutcome === "resist"
          ? "FOUNDER ribalta " + p.attack + "."
          : "FOUNDER usa " + p.attack + "!"),
        c("c-yellow", "CONTRATTACCO: -" + counterCost + " CONTROLLO SALA"),
        c("c-white", p.attackLine)];
      if (mood) counterLines.push(c("c-red", mood));
      steps.push({ push: counterLines,
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
          B.lastDecisionSummary = { decision: "lost" };
          snap();
        },
        push: ["", c("c-red", "SEI FUORI DAL DEAL. -2 reputazione.")],
        waitForInput: true, sound: () => TVAudio.error()
      });
      seq(steps, () => startPostBattleEvent("lost"));
      return;
    }

    steps.push({ push: ["",
                        c("c-cyan", "STATO: PRESSIONE " + pressureAfter + "/" +
                          TVPitchBattle.GUARD_MAX + " | ASK VAL " +
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
                pressurePoints(b.guard) + "/" + TVPitchBattle.GUARD_MAX),
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
  function finalizeInvestment(amount, payVal, label) {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
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
      currentValueMultiplier: TVFundMath.entryMultiplier(st.valuation, payVal),
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
    TVState.save();

    const eur = TVRender.eur(amount);
    const entryMult = TVFundMath.entryMultiplier(st.valuation, payVal);
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
    seq([
      { log: [c("c-white", "Prepari il term sheet da " + TVRender.eur(amount) + "...")], ms: 800,
        sound: () => TVAudio.keyPress() },
      { push: ["", c("c-red", "IL FOUNDER NON FIRMA."),
               c("c-yellow", "Motivo: " + verdict.reason),
               c("c-cyan", "Leverage " + verdict.leverage + "/" + verdict.required +
                 " // heat " + verdict.heat + "/8")],
        waitForInput: true, sound: () => TVAudio.error() },
      { push: [c("c-white", "Puoi migliorare le condizioni, portare un lead"),
               c("c-white", "o camminare via prima di inseguire FOMO.")],
        waitForInput: true }
    ], () => arm());
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

  function startPostBattleEvent(decision) {
    const s = TVState.current;
    let ops = null;
    if (global.TVPostBattleEvents && TVPostBattleEvents.recordAfterBattle) {
      ops = TVPostBattleEvents.recordAfterBattle(s, B.st, {
          decision: decision,
          rv: B.rv,
          intel: B.intel,
          battle: B.battle
      });
    }
    const summary = B.lastDecisionSummary || { decision: decision };
    B.postBattleEvent = { summary: true };
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
    lines.push("", c("c-white", "PREMI 1: TORNA AL DEALFLOW E RILEGGI LE NEWS."));
    seq([{ log: lines, waitForInput: true, sound: () => TVAudio.pageChange() }], () => arm());
  }

  function finishPostBattleEvent() {
    B.postBattleEvent = null;
    exitToDealflow();
  }

  function doPass() {
    const s = TVState.current;
    TVDealflow.setDecision(s, B.st.id, "passed");
    s.history.push({ year: s.year, type: "pass", startup: B.st.name });
    B.lastDecisionSummary = { decision: "passed" };
    TVState.save();

    seq([
      { log: [c("c-white", "Ti alzi con eleganza.")], ms: 800 },
      { push: [c("c-yellow", "\"Vi terremo aggiornati\", menti.")], ms: 1000,
        sound: () => TVAudio.keyPress() },
      { push: ["", c("c-magenta", "Il founder ti rimuove da LinkedIn.")], ms: 1200,
        sound: () => TVAudio.pageChange() }
    ], () => startPostBattleEvent("passed"));
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
      finishPostBattleEvent();
      return;
    }
    if (B.phase === "rescue") {
      doRescue(num);
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
    TVAudio.stopBattleMusic();
    if (B && B.bobTimer) clearInterval(B.bobTimer);
    B = null;
    TVRouter.goto(200, { skipLoading: true });
  }

  global.TVPitchLive = { start };
})(window);
