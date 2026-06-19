/* PITCH LIVE — battaglia a turni col founder, stile anni '90.

   MECCANICA (Markstrat dell'anima + Pokemon del portafoglio):
   - Il founder ha una GUARDIA (10). Tu hai una CREDIBILITA' (6).
   - 4 mosse fisse. Ogni founderProfile ha una DEBOLEZZA (la mossa
     che lo fa crollare, -4 guardia) e una PARATA (la mossa che ti
     si ritorce contro, -2 credibilità). Le altre valgono -2 guardia.
   - Ogni turno il founder "contrattacca" (flavor) e ti lima
     1 credibilità: il tempo gioca per lui, come in ogni pitch vero.
   - Guardia a 0 → il founder si scopre e ti dice una VERITA'
     (unit economics reali, che nessuna DD ti dà).
   - Credibilità a 0 → hai perso la sala. -2 reputazione.

   La debolezza si DEDUCE leggendo il pitch della startup
   (js/data/pitches.js) o pagando la ref call. Chi conosce i founder
   archetipo del VC vince al terzo turno; chi tira a caso muore
   di buzzword.

   Modulo puro: niente DOM, testabile in node. */
(function (global) {

  const GUARD_MAX = 10;
  const CRED_MAX = 6;

  const MOVES = [
    { id: 1, label: "I NUMERI, PREGO" },
    { id: 2, label: "E I COMPETITOR?" },
    { id: 3, label: "PARLAMI DEL TEAM" },
    { id: 4, label: "SILENZIO IMBARAZZANTE" }
  ];

  /* weak: mossa super-efficace. resist: mossa che ti si ritorce contro.
     open: battute di apertura (ruotano per turno).
     react[moveId]: reazione del founder a quella mossa.
     attack/attackLine: il "contrattacco" di flavor a ogni turno.
     crack: cosa succede quando la guardia crolla.
     winLine/loseLine: chiusura della sessione. */
  /* face: lo "sprite" del founder — un tell visivo che si impara
     partita dopo partita, come i tipi dei Pokemon.
     hint: il suggerimento che compri con la ref call. */
  const PROFILES = {
    ego: {
      weak: 4, resist: 3,
      face: "( B-)", faceDown: "(x_x)",
      hint: "il silenzio lo uccide",
      open: [
        "Questa non e' una startup.",
        "E' un movimento.",
        "Ho rifiutato un term sheet ieri.",
        "Forse due. Ho perso il conto.",
        "Il mio TED talk ha 2M di views."
      ],
      react: {
        1: "Sciorina una dashboard piena di vanity metrics. Lucidissime.",
        2: "'Competitor? Semmai discepoli.'",
        3: "'Il team sono io.' Sorriso a 32 denti: hai solo lucidato l'ego.",
        4: "Il silenzio lo divora. Parla. Troppo. Dice cose vere."
      },
      attack: "NAME DROPPING",
      attackLine: "cita tre unicorni 'amici suoi'.",
      crack: "Crolla: confessa i numeri veri pur di riavere l'attenzione."
    },
    hustle: {
      weak: 1, resist: 2,
      face: "\\(^o^)/", faceDown: "(x_x)",
      hint: "incalzalo sui numeri",
      open: [
        "Siamo in hypergrowth. Tipo, tanto.",
        "Questo e' il momento. IL momento.",
        "Ho gia' lo slot per il Series A.",
        "Vi faccio entrare. Per stima."
      ],
      react: {
        1: "Glissa. Insisti. Glissa. Insisti. Il CFO ombra suda.",
        2: "'Siamo category creator.' La sala annuisce. Tu sembri il boomer.",
        3: "'Team stellare.' Tre stagisti e un cugino.",
        4: "Riempie il silenzio con una demo. Pronta. Sospettosamente pronta."
      },
      attack: "BUZZWORD STORM",
      attackLine: "synergy, flywheel, AI-native.",
      crack: "Ammette: i numeri 'aspirazionali' erano... aspirazioni."
    },
    red_flag: {
      weak: 3, resist: 1,
      face: "(o_O;)", faceDown: "(x_x)",
      hint: "chiedi del team. Fidati.",
      open: [
        "Il passato e' passato.",
        "Parliamo di futuro.",
        "La stampa ingigantisce tutto.",
        "Round competitivo. Decidete in fretta."
      ],
      react: {
        1: "Dashboard pronta da mesi. Troppo pronta. Ti annega nei dettagli.",
        2: "Parla male di tutti. Con nomi e cognomi.",
        3: "'Il co-founder? Ehm. Non ne facciamo piu' parte... cioe', lui.'",
        4: "Controlla il telefono. Due volte."
      },
      attack: "CAMBIO DISCORSO",
      attackLine: "improvvisamente parla di vision.",
      crack: "Tra le righe: meta' del team se n'e' andata. E capisci perche'."
    },
    competent: {
      weak: 1, resist: 4,
      face: "[o_o]", faceDown: "(x_x)",
      hint: "i numeri: li ha davvero",
      open: [
        "Vi ho mandato il data room ieri.",
        "Partiamo dai numeri, se vi va.",
        "Fate pure domande dure.",
        "Preferiamo quelle."
      ],
      react: {
        1: "Risponde con cohort veri. Sai esattamente cosa stai comprando.",
        2: "Mappa competitiva onesta. Perfino troppo.",
        3: "Track record solido, zero teatro.",
        4: "Ti guarda. Aspetta. Educato. Il silenzio era tuo, ora e' suo."
      },
      attack: "RISPOSTA PUNTUALE",
      attackLine: "annoia, ma convince.",
      crack: "Apre il foglio dei numeri interni. Senza filtri."
    },
    grit: {
      weak: 2, resist: 3,
      face: "(o_o)9", faceDown: "(x_x)",
      hint: "parlagli di mercato e rivali",
      open: [
        "Settimo anno. Le mode passano.",
        "Noi no.",
        "Niente slide. Vi mostro il prodotto.",
        "Il mercato e' difficile. Per gli altri."
      ],
      react: {
        1: "Numeri veri, crescita lenta. 'Lenta ma vera', precisa.",
        2: "Si accende: conosce ogni rivale a memoria. E sa dove perdono.",
        3: "'Il team parla coi fatti.' Fine. Domanda sprecata.",
        4: "Regge il silenzio. Da veterano."
      },
      attack: "DATO DI FATTO",
      attackLine: "cita un cliente che paga dal 2019.",
      crack: "Si sbottona: ti dice dove il settore sta DAVVERO andando."
    },
    first_time: {
      weak: 4, resist: 1,
      face: "(^_^;)", faceDown: "(x_x)",
      hint: "lascia un silenzio: parlera'",
      open: [
        "Ok wow, grazie per il tempo. Davvero.",
        "Allora, la slide 1... no aspetta.",
        "La 3. Ecco.",
        "E' il nostro primo round. Si vede?"
      ],
      react: {
        1: "Panico. Snocciola numeri a caso. Perdi tempo a decifrarli.",
        2: "'C'e' un player americano... grosso.' Almeno e' onesto.",
        3: "Parla del team con affetto vero. Tenero. Poco utile.",
        4: "Il silenzio lo travolge: vuota il sacco. Tutto il sacco."
      },
      attack: "ENTUSIASMO NERVOSO",
      attackLine: "ride nel momento sbagliato.",
      crack: "Ti dice tutto: il buono, il cattivo, il CAC."
    }
  };

  function newBattle(profileKey, options) {
    options = options || {};
    const profile = PROFILES[profileKey] ? profileKey : "competent";
    return {
      profile: profile,
      guard: GUARD_MAX,
      cred: CRED_MAX,
      credMax: CRED_MAX,
      intelShield: Math.max(0, options.intelShield || 0),
      intelMove: options.intelMove || null,
      intelPower: Math.max(2, options.intelPower || 2),
      intelStrikeAvailable: !!options.intelMove,
      intelTriggered: false,
      counterBlockSource: null,
      turn: 0,
      over: false,
      won: false,
      lastMove: null,
      lastOutcome: null,  // "weak" | "neutral" | "resist"
      counterBlocked: false
    };
  }

  /* Applica una mossa. Muta e ritorna la battle. */
  function applyMove(b, moveId) {
    if (b.over) return b;
    const p = PROFILES[b.profile];
    let outcome;
    b.counterBlocked = false;
    b.counterBlockSource = null;
    b.intelTriggered = false;
    if (moveId === p.weak) { b.guard -= 4; outcome = "weak"; }
    else if (moveId === p.resist) { b.cred -= 2; outcome = "resist"; }
    else { b.guard -= 2; outcome = "neutral"; }
    if (b.intelStrikeAvailable && moveId === b.intelMove) {
      b.guard -= b.intelPower;
      b.intelStrikeAvailable = false;
      b.intelTriggered = true;
    }
    b.turn += 1;
    b.lastMove = moveId;
    b.lastOutcome = outcome;

    if (b.guard <= 0) {
      b.guard = 0;
      b.over = true;
      b.won = true;
      return b;
    }
    // Ogni domanda consuma controllo della sala. Un dossier preparato
    // assorbe i primi contrattacchi: la navigazione crea tempo reale.
    if (b.intelTriggered) {
      b.counterBlocked = true;
      b.counterBlockSource = "lead";
    } else if (b.intelShield > 0) {
      b.intelShield -= 1;
      b.counterBlocked = true;
      b.counterBlockSource = "shield";
    } else {
      b.cred -= 1;
    }
    if (b.cred <= 0) {
      b.cred = 0;
      b.over = true;
      b.won = false;
    }
    return b;
  }

  /* Etichette per la ref call: cosa dicono gli ex colleghi. */
  const FOUNDER_LABELS = {
    grit:        "grit, esecuzione solida",
    competent:   "competente, lucido",
    hustle:      "hustler, vendita forte",
    ego:         "ego pronunciato",
    red_flag:    "red flag: gestione problematica",
    first_time:  "first-time founder, in apprendimento"
  };
  function founderLabel(key) { return FOUNDER_LABELS[key] || "profilo non chiaro"; }

  /* Il segnale co-investitori: chi altro è nel round. */
  function coInvestSignal(st) {
    if (["AI_FOUNDATION", "ROBOTICS_FRONTIER"].includes(st.sectorTag))
      return "due top fund già dentro";
    if (["BATTERY_INDUSTRIAL", "SPACE_DUAL_USE"].includes(st.sectorTag))
      return "lead industriale già committed";
    if (st.founderProfile === "red_flag") return "ex-investor sta uscendo";
    return "round senza lead, in costruzione";
  }

  /* La verità che il founder rivela quando crolla: gli unit economics
     reali. E' l'unica fonte di gioco per questo dato (la DD rivela
     rischio/upside, non i margini). */
  function truthFor(startup) {
    const ue = (startup && typeof startup.unitEconomics === "number")
      ? startup.unitEconomics : 0;
    if (ue >= 0.3)  return "i margini veri sono solidi. Raro.";
    if (ue >= 0)    return "unit economics in pari. Onesto.";
    if (ue >= -0.4) return "perde soldi su ogni cliente.";
    return "brucia cassa a ritmo industriale.";
  }

  global.TVPitchBattle = {
    GUARD_MAX, CRED_MAX, MOVES, PROFILES,
    newBattle, applyMove, truthFor, founderLabel, coInvestSignal
  };
})(typeof window !== "undefined" ? window : global);
