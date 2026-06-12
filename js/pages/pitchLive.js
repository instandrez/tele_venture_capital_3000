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

    let battle;
    let resumed = false;
    if (rv.snap) {
      battle = Object.assign(TVPitchBattle.newBattle(st.founderProfile), rv.snap);
      resumed = true;
    } else {
      battle = TVPitchBattle.newBattle(st.founderProfile);
    }

    B = {
      st: st, pageNum: pageNum, battle: battle, rv: rv,
      phase: battle.over && battle.won ? "broken" : "menu",
      log: [],
      dispGuard: battle.guard,
      dispCred: battle.cred,
      /* fx sprite: enemyReveal = righe materializzate dall'alto,
         enemyDrop/playerDrop = caduta stile svenimento */
      fx: {
        enemyReveal: resumed ? 8 : 0,
        enemyDrop: (battle.over && battle.won) ? 8 : 0,
        playerDrop: 0
      },
      busy: false
    };

    TVAudio.startBattleMusic();

    if (resumed) {
      B.log = battle.over && battle.won
        ? [c("c-yellow", "Il founder e' gia' crollato."), c("c-white", "Resta solo da decidere.")]
        : [c("c-yellow", "Riprendi la trattativa"), c("c-yellow", "dove l'avevi lasciata.")];
      draw();
      arm();
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

  function rootOf(st) { return (st.sectorTag || "").split("_")[0]; }

  function hasSectorDossier(state, st) {
    const root = rootOf(st);
    if (!root || root === "UNKNOWN") return false;
    return TVNews.NEWS.some(n =>
      n.year === state.year &&
      n.signal && n.signal.sector === root &&
      (state.readPages || []).includes(n.page)
    );
  }

  function alive() {
    return B && TVState.current && TVState.current.currentPage === B.pageNum;
  }

  function snap() {
    const b = B.battle;
    B.rv.snap = { guard: b.guard, cred: b.cred, turn: b.turn, over: b.over, won: b.won };
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
    const el = document.getElementById("tv-content");
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth; // restart animation
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 400);
  }

  // ---------- rendering ----------
  function bar(value, max, cls) {
    return c(cls, "█".repeat(Math.max(0, value))) +
           c("c-blue", "░".repeat(Math.max(0, max - value)));
  }

  /* lunghezza visibile di una riga HTML (ignora i tag span) */
  function visLen(html) { return String(html).replace(/<[^>]*>/g, "").length; }
  function padVis(html, w) {
    const d = w - visLen(html);
    return d > 0 ? html + " ".repeat(d) : html;
  }
  /* taglia a w caratteri visibili richiudendo gli span aperti:
     rete di sicurezza perche' nessuna riga sfondi la dialog box */
  function clipVis(html, w) {
    const s = String(html);
    if (visLen(s) <= w) return s;
    let out = "", vis = 0, i = 0, depth = 0;
    while (i < s.length && vis < w) {
      if (s[i] === "<") {
        const j = s.indexOf(">", i);
        const tag = s.slice(i, j + 1);
        out += tag;
        depth += tag[1] === "/" ? -1 : 1;
        i = j + 1;
      } else { out += s[i++]; vis++; }
    }
    while (depth-- > 0) out += "</span>";
    return out;
  }

  /* ARENA stile battaglia portatile anni '90 (11 righe × 40 col):
     founder in alto a destra con targhetta a sinistra (il livello
     E' la valuation), tu di spalle in basso a sinistra con la tua
     targhetta a destra. */
  function arenaLines() {
    const r = TVRender;
    const s = TVState.current;
    const st = B.st;
    const b = B.battle;
    const p = TVPitchBattle.PROFILES[b.profile];
    const fx = B.fx;

    const eRows = TVSprites.spriteRows(b.profile); // 8 righe × 20 col
    const pRows = TVSprites.spriteRows("player");  // 6 righe × 20 col

    // colonna destra: sprite founder (righe 0-7) + targhetta tua (8-10)
    const right = [];
    for (let i = 0; i < 8; i++) {
      let cell = "";
      const idx = i - (fx.enemyDrop || 0);          // cade verso il basso
      if (idx >= 0 && idx < Math.min(8, fx.enemyReveal)) cell = eRows[idx];
      right.push(cell);
    }
    if (b.over && b.won && (fx.enemyDrop || 0) >= 8) {
      right[3] = "      " + c("c-yellow", p.faceDown);
      right[4] = "      " + c("c-magenta", "crollato");
    }
    right.push(c("c-white", "TU — GENERAL PARTNER"));
    right.push("  " + c("c-cyan", "CRED ") + bar(B.dispCred, TVPitchBattle.CRED_MAX, "c-green"));
    right.push("  " + c("c-white", "CASH " + r.eur(s.cash)));

    // colonna sinistra: targhetta founder (1-4) + tuo sprite (5-10)
    const left = ["", "", "", "", "", "", "", "", "", "", ""];
    left[1] = " " + c("c-yellow", st.name.slice(0, 18));
    left[2] = " " + c("c-white", (st.stage + " Lv." + r.eur(st.valuation)).slice(0, 18));
    left[3] = " " + c("c-cyan", "GUARDIA");
    left[4] = " " + bar(B.dispGuard, TVPitchBattle.GUARD_MAX, "c-yellow");
    for (let i = 0; i < 6; i++) {
      const idx = i - (fx.playerDrop || 0);
      left[5 + i] = (idx >= 0 && idx < 6 && (fx.playerDrop || 0) < 6) ? pRows[idx] : "";
    }

    const out = [];
    for (let i = 0; i < 11; i++) out.push(padVis(left[i], 20) + (right[i] || ""));
    return out;
  }

  function draw() {
    if (!alive()) return;
    const r = TVRender;
    const s = TVState.current;
    const st = B.st;
    const b = B.battle;
    const rv = B.rv;

    const lines = [];
    lines.push(r.bg("bg-magenta", "  " + r.pad("PITCH BATTLE ─ " + st.name.toUpperCase(), 38)));
    arenaLines().forEach(l => lines.push(l));

    // dialog box bordata (4 righe di log)
    lines.push(c("c-white", "┌" + "─".repeat(38) + "┐"));
    const logZone = B.log.slice(-4);
    for (let i = 0; i < 4; i++) {
      const inner = logZone[i] !== undefined ? clipVis(logZone[i], 36) : "";
      lines.push(c("c-white", "│ ") + padVis(inner, 36) + c("c-white", " │"));
    }
    lines.push(c("c-white", "└" + "─".repeat(38) + "┘"));

    // menu (3 righe)
    if (B.phase === "invest") {
      lines.push(r.bg("bg-yellow", "  " + r.pad("LANCIA IL TERM SHEET", 38)));
      lines.push(" " + c("c-yellow", "1") + "► 1M€    " + c("c-yellow", "2") + "► 3M€    " +
                 c("c-yellow", "3") + "► 5M€    " + c("c-yellow", "0") + " no");
      lines.push(" " + c("c-white", "valuation: " + r.eur(rv.negotiatedValuation || st.valuation)) +
                 (rv.negotiatedValuation ? c("c-green", " (-20% strappato)") : ""));
    } else {
      const broken = B.phase === "broken";
      if (broken) {
        lines.push(r.bg("bg-blue", "  " + r.pad("E' CROLLATO. SI FIRMA O SI SALUTA.", 38)));
      } else {
        lines.push(" " + c("c-yellow", "1") + " NUMERI " + c("c-yellow", "2") + " COMPET. " +
                   c("c-yellow", "3") + " TEAM " + c("c-yellow", "4") + " SILENZIO");
      }
      const ddLbl  = rv.dd ? c("c-blue", "5 DD ok") :
        c("c-yellow", "5") + " DD" + c("c-cyan", "-" + (hasSectorDossier(s, st) ? "50k" : "100k"));
      const refLbl = rv.refCall ? c("c-blue", "6 REF ok") :
        c("c-yellow", "6") + " REF" + c("c-cyan", "-50k");
      const negLbl = rv.negotiated ? c("c-blue", "7 negoz.") :
        c("c-yellow", "7") + " NEGOZIA";
      const coLbl  = rv.coInvest ? c("c-blue", "8 COINV ok") :
        c("c-yellow", "8") + " COINV";
      lines.push(" " + ddLbl + " " + refLbl + " " + negLbl + " " + coLbl);
      lines.push(" " + c("c-yellow", "9") + " PASSA        " +
                 c("c-yellow", "0") + " LANCIA IL TERM SHEET");
    }

    // riga finale: il fatto più utile che conosci adesso
    let hint;
    if (rv.pitchTruth) hint = c("c-green", "★ " + rv.pitchTruth.slice(0, 37));
    else if (rv.refCall) hint = c("c-cyan", ("ref: " + TVPitchBattle.founderLabel(b.profile) +
      " — " + (TVPitchBattle.PROFILES[b.profile].hint || "")).slice(0, 38));
    else if (rv.ddTexts && rv.ddTexts[0]) hint = c("c-white", "★ " + rv.ddTexts[0].slice(0, 36));
    else if (rv.coInvest) hint = c("c-cyan", "★ " + TVPitchBattle.coInvestSignal(st).slice(0, 36));
    else if (hasSectorDossier(s, st)) hint = c("c-green", "» dossier settore: news incrociate");
    else hint = c("c-white", "leggi il pitch: la debolezza e' li'.");
    lines.push(" " + hint);

    r.show(B.pageNum, lines.join("\n"), { title: "PITCH BATTLE" });
  }

  /* animazione: lista di step { log, ms, sound, shake, flash, fn } */
  function seq(steps, done) {
    B.busy = true;
    let i = 0;
    const next = () => {
      if (!alive()) { if (B) B.busy = false; return; }
      if (i >= steps.length) { B.busy = false; if (done) done(); return; }
      const stp = steps[i++];
      if (stp.fn) stp.fn();
      if (stp.log) B.log = stp.log;
      if (stp.push) B.log = B.log.concat(stp.push);
      draw();
      if (stp.sound) stp.sound();
      if (stp.shake) fxScreen("shake");
      if (stp.flash) fxScreen("crt-flash");
      setTimeout(next, stp.ms || 450);
    };
    next();
  }

  /* drena una barra un blocco alla volta (tick sonoro per blocco) */
  function drainSteps(prop, target) {
    const steps = [];
    const from = B[prop];
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

    const steps = [
      { log: [c("c-white", "Sala riunioni. Neon. Acqua frizzante.")], ms: 800 },
      { push: [c("c-white", "IL FOUNDER ENTRA IN SALA...")], ms: 700,
        sound: () => TVAudio.pageChange() }
    ];
    // lo sprite si materializza riga per riga (decode teletext)
    for (let i = 1; i <= 8; i++) {
      steps.push({
        fn: (v => () => { B.fx.enemyReveal = v; })(i),
        ms: 110, sound: () => TVAudio.keyPress()
      });
    }
    steps.push({ log: [c("c-yellow", "Un FOUNDER selvaggio ti pitcha:")], ms: 650,
                 sound: () => TVAudio.success() });
    // niente virgolette e niente riga "COSA FAI?": le 4 righe del
    // pitch devono restare TUTTE nel box — e' li' che si legge la
    // debolezza. Il menu sotto e' gia' la domanda.
    pitch.forEach(line => {
      steps.push({ push: [c("c-cyan", String(line).slice(0, 36))], ms: 520,
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
    const credBefore = b.cred;

    TVPitchBattle.applyMove(b, moveId);

    const youLine = c("c-white", "TU usi ") + c("c-yellow", MOVE_NAMES[moveId]) + c("c-white", "!");
    const steps = [
      { log: [youLine], ms: 550, sound: () => TVAudio.keyPress() },
      { log: [youLine, c("c-cyan", "      ►►►")], ms: 130 },
      { log: [youLine, c("c-cyan", "            ►►►")], ms: 130 },
      { log: [youLine, c("c-cyan", "                  ►►►")], ms: 130 }
    ];

    // impatto
    if (b.lastOutcome === "weak") {
      steps.push({ log: [youLine, c("c-green", "COLPITO! E' super efficace!")],
                   ms: 500, shake: true, sound: () => TVAudio.success() });
      steps.push.apply(steps, drainSteps("dispGuard", b.guard));
    } else if (b.lastOutcome === "resist") {
      steps.push({ log: [youLine, c("c-red", "PARATA! Ti si ritorce contro!")],
                   ms: 500, shake: true, sound: () => TVAudio.error() });
    } else {
      steps.push({ log: [youLine, c("c-cyan", "Colpo messo a segno.")],
                   ms: 450, sound: () => TVAudio.pageChange() });
      steps.push.apply(steps, drainSteps("dispGuard", b.guard));
    }

    // reazione del founder
    const reaction = wrap(p.react[moveId] || "", 36).map(l => c("c-white", l));
    steps.push({ push: reaction, ms: 1000 });

    if (b.over && b.won) {
      // vittoria!
      steps.push({ log: [c("c-yellow", "LA GUARDIA E' CROLLATA!")],
                   ms: 600, flash: true, sound: () => TVAudio.fanfare() });
      steps.push.apply(steps, drainSteps("dispGuard", 0));
      // lo sprite del founder cade fuori scena, riga dopo riga
      for (let d = 1; d <= 8; d++) {
        steps.push({ fn: (v => () => { B.fx.enemyDrop = v; })(d),
                     ms: 80, sound: () => TVAudio.keyPress() });
      }
      const crack = wrap(p.crack, 36).map(l => c("c-yellow", l));
      steps.push({ push: crack, ms: 1100 });
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
          .concat([c("c-cyan", "+1 reputazione. Ora decidi.")]),
        ms: 700
      });
      seq(steps, () => arm());
      return;
    }

    // contrattacco del founder
    steps.push({ push: ["", c("c-magenta", "FOUNDER usa " + p.attack + "!"),
                        c("c-white", p.attackLine)],
                 ms: 800, sound: () => TVAudio.error() });
    steps.push.apply(steps, drainSteps("dispCred", b.cred));

    if (b.over && !b.won) {
      // sconfitta: fuori dal round — stavolta cadi tu
      steps.push({ log: [c("c-red", "LA TUA CREDIBILITA' E' A ZERO.")],
                   ms: 900, shake: true, sound: () => TVAudio.dirge() });
      for (let d = 1; d <= 6; d++) {
        steps.push({ fn: (v => () => { B.fx.playerDrop = v; })(d),
                     ms: 90, sound: () => TVAudio.keyPress() });
      }
      steps.push({ push: [c("c-white", "Il founder guarda l'orologio."),
                          c("c-yellow", '"Abbiamo altri 12 fondi in coda."')], ms: 1300 });
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
        ms: 1600, sound: () => TVAudio.error()
      });
      seq(steps, () => exitToDealflow());
      return;
    }

    steps.push({ push: ["", c("c-white", "COSA FAI?")], ms: 200,
                 fn: () => snap() });
    seq(steps, () => arm());
  }

  // ---------- azioni di ricerca (5/6/8) e negoziazione (7) ----------
  function doDD() {
    const s = TVState.current;
    const st = B.st;
    const rv = B.rv;
    if (rv.dd) { miniLog(c("c-blue", "DD gia' fatta.")); return; }
    const dossier = hasSectorDossier(s, st);
    const cost = dossier ? 50_000 : 100_000;
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

    const result = rv.ddTexts.map(t => c("c-yellow", "! ") + c("c-white", t.slice(0, 34)));
    seq([
      { log: [c("c-white", "Mandi gli analisti nel data room...")], ms: 800,
        sound: () => TVAudio.keyPress() },
      { push: [c("c-cyan", dossier ? "(il dossier stampa ha gia' meta' lavoro)"
                                   : "(fruscio di fogli excel)")], ms: 800 },
      { push: result, ms: 600, sound: () => TVAudio.success() }
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
      (hasSectorDossier(s, st) ? 0.10 : 0);
    const ok = TVState.roll("nego|" + st.id + "|" + s.year) < prob;
    rv.negotiated = true;

    const steps = [
      { log: [c("c-white", "Butti li':")], ms: 600 },
      { push: [c("c-yellow", "\"Quella valuation... e' un'opinione.\"")], ms: 1100,
        sound: () => TVAudio.keyPress() }
    ];
    if (ok) {
      rv.negotiatedValuation = Math.round(st.valuation * 0.8);
      steps.push({ push: ["", c("c-white", "Il founder espira. A lungo."),
                          c("c-green", "ACCETTA. Odiandoti."),
                          c("c-green", "-20% sulla valuation!")], ms: 900,
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
    const payVal = rv.negotiatedValuation || baseVal;
    s.cash -= amount;
    s.invested += amount;
    s.portfolio.push({
      id: st.id, name: st.name, sector: st.sector, sectorTag: st.sectorTag,
      investedAmount: amount, entryValuation: payVal, equityPct: amount / payVal,
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
               c("c-green", "AFFARE FATTO: " + eur + " investiti!")], ms: 1500,
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
    TVRouter.setActionHandler(num => {
      if (!B || B.busy) return;
      if (B.phase === "invest") {
        if (num === 1) doInvest(1_000_000);
        else if (num === 2) doInvest(3_000_000);
        else if (num === 3) doInvest(5_000_000);
        else if (num === 0) {
          B.phase = B.battle.over && B.battle.won ? "broken" : "menu";
          draw();
        }
        return;
      }
      switch (num) {
        case 1: case 2: case 3: case 4:
          if (B.phase === "broken") { miniLog(c("c-magenta", "E' gia' crollato. Decidi.")); return; }
          doQuestion(num);
          break;
        case 5: doDD(); break;
        case 6: doRefCall(); break;
        case 7: doNegotiate(); break;
        case 8: doCoInvest(); break;
        case 9: doPass(); break;
        case 0: B.phase = "invest"; draw(); break;
      }
    });
  }

  function exitToDealflow() {
    TVAudio.stopBattleMusic();
    B = null;
    TVRouter.goto(200, { skipLoading: true });
  }

  global.TVPitchLive = { start };
})(window);
