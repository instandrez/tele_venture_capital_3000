/* Pitch qualitativi delle startup — il materiale su cui il giocatore
   si forma la PROPRIA opinione.

   REGOLE EDITORIALI:
   - Niente punteggi: il giocatore deduce team/traction/hype/fit
     leggendo tra le righe, come un vero investitore.
   - Sarcastico ma "scientifico": ogni riga codifica un attributo
     reale del modello. Chi sa leggere un pitch capisce; chi si fa
     incantare dall'hype paga.
   - Max 38 caratteri per riga, max 4 righe.
   - Mai rivelare hiddenRisk/hiddenUpside: quelli si pagano (DD). */
(function (global) {

  const PITCHES = {
    // ---------- AI ----------
    neurodrive: [
      "Guida autonoma 'foundation-first'.",
      "Team ex top-lab, demo da brividi.",
      "Clienti paganti: un PoC. In firma.",
      "Il founder apre i pitch col TED talk."
    ],
    foundergpt: [
      "Scrive update agli investitori con AI",
      "così il founder non deve sapere nulla.",
      "Utenti attivi: 'community-first'.",
      "Deck: 60 slide, 0 numeri."
    ],
    ragtag: [
      "Infrastruttura RAG per enterprise.",
      "Team tecnico solido, poco scenico.",
      "Primi contratti veri, ARR piccolo.",
      "Il founder parla di churn. Spontaneo."
    ],
    agiordie: [
      "Missione: AGI. Tempistica: 'presto'.",
      "Due PhD ex top-lab, paper ovunque.",
      "Revenue: zero, per scelta filosofica.",
      "Valuation 30M. Perché? 'Perché sì.'"
    ],
    neuronote: [
      "AI verticale per studi legali.",
      "240 studi paganti, churn da manuale.",
      "La founder è ex magistratura.",
      "Niente hype: solo fatture."
    ],
    promptlayer: [
      "Observability per prompt engineer.",
      "Adozione virale tra sviluppatori.",
      "Monetizzazione: 'ci pensiamo dopo'.",
      "Il founder vende benissimo. Tutto."
    ],
    agentforge: [
      "Agenti AI che orchestrano agenti AI.",
      "Demo perfetta. In produzione: boh.",
      "Team senior, ego compreso nel prezzo.",
      "Keynote prenotati a 3 conference."
    ],

    // ---------- CLIMATE / ENERGY ----------
    saltcore: [
      "Batterie al sodio, fabbrica vera.",
      "Team industriale, zero storytelling.",
      "Pilot con OEM in corso, capex serio.",
      "Time-to-market: anni. Plurale."
    ],
    carbonhug: [
      "Misura la CO2 'con AI proprietaria'.",
      "Deck bellissimo, premiato due volte.",
      "Clienti: 3 PoC gratuiti 'strategici'.",
      "Metodologia: in revisione. Da sempre."
    ],
    deepforge: [
      "Geotermia profonda per industria.",
      "Ingegneri veri, brevetto originale.",
      "Revenue tra 4 anni. Se va bene.",
      "Il founder non sa cosa sia LinkedIn."
    ],
    bluehydro: [
      "Idrogeno per industria pesante.",
      "Tre offtake firmati con utility.",
      "Costi: 'scenderanno con la scala'.",
      "Tutto giusto. Manca solo l'economia."
    ],
    greenrinse: [
      "Certificazioni green per corporate.",
      "Prodotto: un report. Colorato.",
      "Vende a chi non vuole guardare.",
      "Il team tecnico è il cugino del CEO."
    ],

    // ---------- ROBOTICS ----------
    humanoidops: [
      "Robot umanoidi per le fabbriche.",
      "Video virale: 40M visualizzazioni.",
      "Robot consegnati: 2. Ai musei.",
      "Costo unitario: 'in discesa'. Da 200k."
    ],
    strongarm: [
      "Bracci robotici industriali.",
      "Order book pieno per 18 mesi.",
      "Competono coi tedeschi. A testa alta.",
      "Noiosa come un buon bilancio."
    ],
    humanlessops: [
      "Automazione di fabbrica con AI.",
      "Due pilot veri al Nord, sales lunghi.",
      "Burn rate: 'investiamo in crescita'.",
      "Il CEO chiude bene. Anche troppo."
    ],

    // ---------- MOBILITY ----------
    yachtbrain: [
      "Autopilota per yacht da diporto.",
      "Mercato: ricco, piccolo, stagionale.",
      "Il founder? 'In transizione.'",
      "Il CTO guida anche la barca demo."
    ],
    evcharge24: [
      "Ricarica EV, 300 stazioni attive.",
      "Revenue vere, margini sottili.",
      "Guerra dei prezzi in corso.",
      "Solido. Ma il biglietto costa 60M."
    ],
    scootflow: [
      "Monopattini in sharing. Di nuovo.",
      "Brand forte, unit economics deboli.",
      "Tre città minacciano il ban.",
      "'Consolidamento' è la parola chiave."
    ],

    // ---------- SPACE / DEFENSE ----------
    starvista: [
      "Costellazione smallsat dual-use.",
      "Team aerospace di prima fascia.",
      "Contratti gov in pipeline, capex su.",
      "Dipendono dai lanci. Di altri."
    ],
    dovesofwar: [
      "Droni 'pacificamente letali'.",
      "Team militare, esecuzione rapida.",
      "Tender pubblici in arrivo. Forse.",
      "Export: dipende da 3 ministeri."
    ],

    // ---------- CYBER ----------
    fortresslab: [
      "Sicurezza enterprise, ARR 8M.",
      "Net retention 130%, sales lenti.",
      "Il CEO è noioso e preciso.",
      "I clienti rinnovano. Tutti."
    ],
    ghostlog: [
      "SIEM open core, 3.2k stelle GitHub.",
      "Developer love, revenue acerbe.",
      "Spazio affollato di giganti.",
      "Community vera. Il moat: vediamo."
    ],

    // ---------- SAAS / LEGALTECH ----------
    invoicequick: [
      "Fatturazione B2B. Profittevole.",
      "Sì, profittevole. Davvero.",
      "Crescita noiosa, churn minimo.",
      "Mai chiamati da un giornalista."
    ],
    notarygpt: [
      "Automazione atti per notai.",
      "Mercato ricco, lobby robusta.",
      "Due ordini regionali interessati.",
      "Vendere ai notai: sport estremo."
    ],
    legalcopilot: [
      "Copilot per piccoli studi legali.",
      "Crescita organica, founder al primo",
      "giro: impara in fretta, sbaglia pure.",
      "Prezzi: ancora 'in esplorazione'."
    ],

    // ---------- FINTECH ----------
    smartpolicy: [
      "Polizze parametriche per PMI.",
      "Pilot bancario in corso.",
      "Distribuzione: il vero problema.",
      "Team assicurativo, zero glamour."
    ],
    madbank: [
      "Neobank per la Gen Z.",
      "300k utenti, brand fortissimo.",
      "CAC alti, ricavi 'in arrivo'.",
      "Il founder è ovunque. L'EBITDA no."
    ],

    // ---------- CRYPTO ----------
    crookedtoken: [
      "NFT di formaggi. Ora 'AI agent'.",
      "Terzo pivot in 14 mesi.",
      "Community: 40k wallet, 12 attivi.",
      "Il whitepaper cita Platone."
    ],

    // ---------- CONSUMER ----------
    spinall: [
      "Gig economy per turni in farmacia.",
      "GMV in crescita, margini negativi.",
      "Governance: 'informale'.",
      "CTO licenziato via WhatsApp. Pubblico."
    ],

    // ---------- ARCHETIPI ----------
    stealthmode: [
      "Settore: riservato. Team: riservato.",
      "Metriche: riservate. Round: 60M.",
      "Tre fondi top sono già dentro.",
      "Tu puoi entrare. Domande: vietate."
    ],
    exgoogler: [
      "Infra AI 'come la facevamo noi'.",
      "Team: 9 ex BigTech, 14 brevetti.",
      "Clienti: nessuno. Discovery: zero.",
      "'Il prodotto siamo noi.'"
    ],
    pivotking: [
      "Oggi: AI agent per... qualcosa.",
      "Terzo pivot, stesso founder.",
      "Il deck ricicla slide del 2021.",
      "Cash per un altro pivot. Uno solo."
    ]
  };

  function forStartup(id) { return PITCHES[id] || null; }

  global.TVPitches = { PITCHES, forStartup };
})(window);
