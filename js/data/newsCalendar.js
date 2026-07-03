/* Calendario news del Tele Venture Capital 3000.

   FILOSOFIA (Markstrat-style):
   - Il giocatore deve sentirsi sommerso da informazioni.
   - Mix volontario di: SEGNALI VERI (modificano il mercato),
     RUMORE (flavor, satira, nulla di azionabile), DEPISTAGGI
     (sembrano segnali, non lo sono).
   - Chi legge e incrocia → vince. Chi non legge → ricava
     ~1x MOIC se è fortunato, sotto 1x se è sfortunato.

   VINCOLI EDITORIALI:
   - Zero nomi reali (aziende, persone, città).
   - Tono allusivo: chi lavora nel VC ride, gli altri non
     capiscono ma percepiscono che qualcosa non torna.

   STRUTTURA SIGNAL (visto solo dal motore, mai dal giocatore):
   { sector: <KEY>, delta: <pct>, materializeYear: <n>,
     type: "trend"|"regulation"|"founder_risk"|"corporate_opp"|"macro",
     scope: opzionale (tag specifico per filtraggio fine) }
*/
(function (global) {

  const NEWS = [

    // =====================================================
    // ANNO 1 — info abbondanti, segnali deboli ma presenti
    // =====================================================

    // ---------- ULTIM'ORA (110) — 8 news ----------
    {
      id: "y1-uo-01", year: 1, section: 110, page: 111, tone: "ironic",
      headline: "MEGAROUND PER STARTUP CHE NON ESISTE",
      body: [
        "Una startup di cui non si conoscono né",
        "il nome né il settore né il team ha chiuso",
        "un seed extension da 60M€ a valutazione",
        "1,2 miliardi.",
        "",
        "Il deck è una singola slide nera con",
        "scritto SOTTO NDA.",
        "",
        "Quattro fondi sono dentro. Uno è dentro",
        "due volte ma se ne è accorto solo ieri."
      ],
      signal: { sector: "AI", delta: +6, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-uo-02", year: 1, section: 110, page: 112, tone: "serious",
      headline: "BANCA CENTRALE: TASSI FERMI",
      body: [
        "La Banca Centrale Continentale ha lasciato",
        "i tassi invariati.",
        "",
        "Il governatore parla di \"prudente vigilanza",
        "in un contesto multidimensionale\".",
        "",
        "Liquidità nel sistema: abbondante.",
        "Effetto sui fondi growth: neutrale.",
        "Effetto sul fintech consumer: leggero +."
      ],
      signal: { sector: "FINTECH", delta: +3, materializeYear: 1, type: "macro" }
    },
    {
      id: "y1-uo-03", year: 1, section: 110, page: 113, tone: "ironic",
      headline: "FONDO LANCIA TESI \"AI EVERYTHING\"",
      body: [
        "Un fondo di rilievo ha pubblicato la nuova",
        "tesi: \"AI Everything, ovunque, sempre, anche",
        "se non serve, soprattutto se non serve\".",
        "",
        "La tesi è di 48 pagine. Le prime 47 sono",
        "una citazione di un saggio del 1948 su",
        "Turing. L'ultima dice \"investiremo\".",
        "",
        "Il fondo ha già investito in 11 startup",
        "del settore, di cui 3 chiamate AGENT."
      ],
      signal: { sector: "AI", delta: +8, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-uo-04", year: 1, section: 110, page: 114, tone: "serious",
      headline: "TRASPORTI: CRISI ROTTE COMMERCIALI",
      body: [
        "Due rotte commerciali primarie restano",
        "interrotte. Aumento costi logistici stimato",
        "tra +18% e +24% sul prossimo trimestre.",
        "",
        "Impatto su:",
        "- robotica industriale: lieve negativo",
        "- batterie: filiera celle a rischio",
        "- consumer hardware: contrazione marginalita'",
        "",
        "Outlook: 3-6 mesi se non risolto."
      ],
      signal: { sector: "BATTERY", delta: -6, materializeYear: 1, type: "macro" }
    },
    {
      id: "y1-uo-05", year: 1, section: 110, page: 115, tone: "gossip",
      headline: "GUERRA TRA PARTNER IN UN MEGA FONDO",
      body: [
        "Due managing partner di un grande fondo",
        "si stanno scrivendo email solo in copia",
        "conoscenza l'uno all'altro tramite il",
        "junior che li odia entrambi.",
        "",
        "Le decisioni sono ferme.",
        "Il dealflow rallenta.",
        "",
        "I founder lo hanno notato.",
        "Stanno pitchando altrove."
      ],
      signal: null
    },
    {
      id: "y1-uo-06", year: 1, section: 110, page: 116, tone: "serious",
      headline: "DOMANDA CHIP: SHORTAGE SU NODI AVANZATI",
      body: [
        "Carenza globale di chip a nodo avanzato",
        "(sotto 5nm). Backlog stimato: 9 mesi.",
        "",
        "Effetti collaterali:",
        "- training modelli grandi: rallentato",
        "- robotica precision: costi su",
        "- automotive ADAS: ritardi",
        "",
        "Beneficiari: chi disegna ASIC efficienti",
        "e chi fa software che gira su chip vecchi."
      ],
      signal: { sector: "AI", delta: -4, materializeYear: 1, type: "macro" }
    },
    {
      id: "y1-uo-07", year: 1, section: 110, page: 117, tone: "ironic",
      headline: "NUOVA CATEGORIA: VERTICAL AI PER NICCHIE",
      body: [
        "Un fondo ha coniato la categoria",
        "\"vertical AI per nicchie ignote\".",
        "",
        "Esempi citati:",
        "- AI per cordai (cordami nautici)",
        "- AI per saldatori subacquei",
        "- AI per traduttori di insegne in pietra",
        "",
        "Il fondo ha già fatto 3 investimenti.",
        "Tutti chiamati CO-PILOT."
      ],
      signal: { sector: "SAAS", delta: +4, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-uo-08", year: 1, section: 110, page: 118, tone: "serious",
      headline: "IPO RIAPERTE? PRIMI SEGNALI",
      body: [
        "Dopo 18 mesi di mercato IPO chiuso, due",
        "operazioni minori hanno avuto buona",
        "accoglienza in collocamento.",
        "",
        "Banker dichiarano \"finestra prudente\".",
        "",
        "Settori candidati per H2 ANNO 2:",
        "- enterprise software profittevole",
        "- cybersecurity con ARR stabile",
        "- selettivamente: industrial tech."
      ],
      signal: { sector: "CYBER", delta: +5, materializeYear: 2, type: "macro" }
    },

    // ---------- POLITICA & REGOLAZIONE (120) — 7 news ----------
    {
      id: "y1-pol-01", year: 1, section: 120, page: 121, tone: "serious",
      headline: "REGOLAMENTO IA: TRIALOGO IN CORSO",
      body: [
        "Le istituzioni continentali stanno",
        "negoziando il pacchetto sull'intelligenza",
        "artificiale. Tre punti aperti:",
        "",
        "- soglia di calcolo per modelli generali",
        "- identificazione biometrica in tempo reale",
        "- sanzioni fino al 6% del fatturato",
        "",
        "Voto plenaria atteso entro fine ANNO 2.",
        "Settori esposti: chi addestra modelli",
        "generali grandi. Chi fa applicazioni",
        "verticali è meno colpito."
      ],
      signal: { sector: "AI", delta: -22, materializeYear: 2, type: "regulation",
                scope: "foundation_model" }
    },
    {
      id: "y1-pol-02", year: 1, section: 120, page: 122, tone: "serious",
      headline: "FONDI STRAORDINARI PER LA TRANSIZIONE",
      body: [
        "Approvato un piano da 47 mld per industria",
        "verde: batterie, idrogeno, geotermia,",
        "cattura CO2, accumulo a lungo termine.",
        "",
        "Le startup qualificate potranno accedere",
        "a co-investimento pubblico fino al 35%",
        "del round.",
        "",
        "I bandi apriranno tra 8-14 mesi.",
        "Documenti richiesti: \"in via di definizione\"."
      ],
      signal: { sector: "CLIMATE", delta: +12, materializeYear: 1, type: "macro" }
    },
    {
      id: "y1-pol-03", year: 1, section: 120, page: 123, tone: "ironic",
      headline: "NUOVO BANDO MINISTERIALE DA 14k€",
      body: [
        "Il Ministero per l'Innovazione Futura ha",
        "lanciato il bando GENIO ITALICO PLUS.",
        "",
        "Contributo: 14.000€.",
        "Requisiti: una donna nel board, sede al Sud,",
        "settore deep tech, almeno un PhD.",
        "Documenti: 84. Termine: 11 giorni.",
        "",
        "Il bando è cumulabile con sé stesso ma",
        "non con sé stesso dell'anno precedente.",
        "",
        "Reazione ecosistema: \"Tutto utile.\""
      ],
      signal: null
    },
    {
      id: "y1-pol-04", year: 1, section: 120, page: 124, tone: "serious",
      headline: "NUOVA DIRETTIVA SU DATI SANITARI",
      body: [
        "Approvata direttiva sulla portabilità dei",
        "dati sanitari e sull'interoperabilità tra",
        "sistemi ospedalieri.",
        "",
        "Vincolo: integrazione obbligatoria entro",
        "fine ANNO 3.",
        "",
        "Effetti:",
        "- AI clinica con dati strutturati: +",
        "- legaltech sanitario: +",
        "- consumer health app generaliste: -"
      ],
      signal: { sector: "LEGALTECH", delta: +6, materializeYear: 1, type: "regulation",
                scope: "health_data" }
    },
    {
      id: "y1-pol-05", year: 1, section: 120, page: 125, tone: "serious",
      headline: "REGOLE PIU' STRETTE SUI CRIPTO-ASSET",
      body: [
        "Approvata estensione delle norme antiriciclaggio",
        "ai prestatori di servizi cripto.",
        "",
        "Requisiti operativi:",
        "- KYC rafforzato",
        "- limiti su mixer e privacy coin",
        "- segnalazione transazioni > soglia",
        "",
        "Outflow di operatori non conformi.",
        "Settore sotto pressione regolatoria."
      ],
      signal: { sector: "CRYPTO", delta: -14, materializeYear: 1, type: "regulation" }
    },
    {
      id: "y1-pol-06", year: 1, section: 120, page: 126, tone: "ironic",
      headline: "TAVOLO INTERMINISTERIALE SULLE STARTUP",
      body: [
        "Convocato il 17° tavolo interministeriale",
        "sulle startup. Argomento: \"come fare in modo",
        "che ci siano più startup\".",
        "",
        "Partecipanti: 38.",
        "Imprenditori effettivi presenti: 1.",
        "Era lì per sbaglio.",
        "",
        "Conclusioni: nuovo tavolo il prossimo mese."
      ],
      signal: null
    },
    {
      id: "y1-pol-07", year: 1, section: 120, page: 127, tone: "serious",
      headline: "PIANO DIFESA E SPAZIO: SPESA RADDOPPIATA",
      body: [
        "Approvato piano pluriennale per difesa e",
        "spazio. Spesa quasi raddoppiata sui prossimi",
        "5 anni, con focus su:",
        "",
        "- dual-use deep tech",
        "- propulsione",
        "- osservazione terra",
        "- cybersecurity governativa",
        "",
        "Sono attesi grandi bandi a partire da Q2 ANNO 2."
      ],
      signal: { sector: "SPACE", delta: +18, materializeYear: 2, type: "macro" }
    },

    // ---------- BORSA & INDICI — news (140) — 6 news ----------
    {
      id: "y1-bor-01", year: 1, section: 140, page: 145, tone: "serious",
      headline: "INDICE AI +25% YTD, VOLATILITA' ALTA",
      body: [
        "L'indice AI chiude il primo anno in",
        "crescita robusta, trainato da megaround",
        "su modelli generali.",
        "",
        "Volatilità implicita: 38% (vs 22% media).",
        "Spread tra winner e loser: ampliato.",
        "",
        "Analisti divisi.",
        "Bolla? Forse. Ma non oggi."
      ],
      signal: { sector: "AI", delta: +4, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-bor-02", year: 1, section: 140, page: 146, tone: "serious",
      headline: "INDICE CRYPTO -22%: INVERNO CONTINUA",
      body: [
        "L'indice Crypto chiude in profondo rosso.",
        "Liquidazioni in cascata su prodotti DeFi",
        "esposti a leveraged staking.",
        "",
        "Capitali in deflusso dal settore.",
        "Talenti in deflusso verso AI.",
        "",
        "Fondi tradizionali: \"Crypto chi?\""
      ],
      signal: { sector: "CRYPTO", delta: -8, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-bor-03", year: 1, section: 140, page: 147, tone: "ironic",
      headline: "INDICE CONSUMER FLAT, DELIVERY GIU'",
      body: [
        "Il consumer tech resta laterale.",
        "",
        "Il segmento delivery food ha registrato",
        "un calo del 6% YoY.",
        "",
        "Cinque app diverse continuano a competere",
        "per consegnare la stessa pizza alla stessa",
        "persona con tre sconti incrociati."
      ],
      signal: { sector: "CONSUMER", delta: -3, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-bor-04", year: 1, section: 140, page: 148, tone: "serious",
      headline: "INDICE BATTERY: +10% TRAINATO DA NORDICI",
      body: [
        "L'indice Battery chiude positivo.",
        "Driver principali:",
        "- piloti industriali nordici a regime",
        "- sussidi pubblici accelerati",
        "- domanda EV mid-market sostenuta",
        "",
        "Outlook: positivo se filiera celle regge.",
        "Rischio: shortage chip e tariffe in import."
      ],
      signal: { sector: "BATTERY", delta: +5, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-bor-05", year: 1, section: 140, page: 149, tone: "serious",
      headline: "SAAS B2B: ARR STABILE, CHURN IN AUMENTO",
      body: [
        "Il segmento SaaS B2B mostra ARR aggregato",
        "stabile, ma con churn enterprise in lieve",
        "aumento.",
        "",
        "Tema: razionalizzazione tool stack post",
        "anni di sovraccoperto. Vincono i player",
        "con bundling o profilo \"system of record\"."
      ],
      signal: { sector: "SAAS", delta: +2, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-bor-06", year: 1, section: 140, page: 150, tone: "ironic",
      headline: "ANALISTI: \"VOLATILITA' E' UNA SCELTA\"",
      body: [
        "Un report di una banca ha dichiarato:",
        "\"La volatilità non esiste, è una scelta\".",
        "",
        "Il report è di 124 pagine.",
        "Le ultime 3 sono disclaimer.",
        "Le altre 121 sono grafici.",
        "",
        "Gli analisti citati hanno previsto 7 delle",
        "ultime 2 recessioni."
      ],
      signal: null
    },

    // ---------- CRONACA STARTUP (160) — 8 news ----------
    {
      id: "y1-cro-01", year: 1, section: 160, page: 161, tone: "gossip",
      headline: "FONDATORE DI YACHTBRAIN LASCIA",
      body: [
        "Il fondatore di YachtBrain, la startup",
        "che fa pilotaggio autonomo per imbarcazioni",
        "da diporto, si è dimesso \"per dedicarsi",
        "a una nuova avventura imprenditoriale\".",
        "",
        "La nuova avventura si chiama YachtBrain 2",
        "e ha sede dall'altra parte del corridoio.",
        "",
        "Il board sta valutando le opzioni."
      ],
      signal: { sector: "MOBILITY", delta: -3, materializeYear: 1,
                type: "founder_risk", scope: "yachtbrain" }
    },
    {
      id: "y1-cro-02", year: 1, section: 160, page: 162, tone: "serious",
      headline: "SALTCORE CHIUDE SERIE A DA 18M",
      body: [
        "SaltCore Energy, la startup di accumulo",
        "elettrico a base di sale comune,",
        "ha chiuso il round Serie A.",
        "",
        "Lead: fondo industriale del Nord Europa.",
        "Pilota con un OEM automotive non dichiarato.",
        "Produzione attesa entro ANNO 4.",
        "",
        "Post-money: 95M€.",
        "",
        "Segnale per il settore: positivo."
      ],
      signal: { sector: "BATTERY", delta: +6, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-cro-03", year: 1, section: 160, page: 163, tone: "gossip",
      headline: "PITCH SU YACHT: 4 ROUND CHIUSI",
      body: [
        "Una founder ha pitchato il suo Series A",
        "durante una crociera di due giorni,",
        "chiudendo round con quattro fondi diversi",
        "che non si parlavano tra loro.",
        "",
        "Il cap table è ora un sudoku.",
        "",
        "La startup non ha ancora un prodotto",
        "ma ha già un Head of Brand."
      ],
      signal: null
    },
    {
      id: "y1-cro-04", year: 1, section: 160, page: 164, tone: "ironic",
      headline: "PIVOT DEL TRIMESTRE: VOLTAFACCIA",
      body: [
        "CrookedToken, la startup che vendeva NFT",
        "di formaggi stagionati, ha annunciato il",
        "terzo pivot in 14 mesi:",
        "",
        "1. NFT formaggi (2 mesi)",
        "2. DeFi per casari (5 mesi)",
        "3. AI agent per casari (corso)",
        "",
        "Il founder è lo stesso. Il logo no."
      ],
      signal: { sector: "CRYPTO", delta: -4, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-cro-05", year: 1, section: 160, page: 165, tone: "serious",
      headline: "NEURONOTE: TRACTION SOLIDA IN AVVOCATURA",
      body: [
        "NeuroNote, la startup di riassunti automatici",
        "di pratiche legali con AI verticale,",
        "ha raggiunto 240 studi paganti.",
        "",
        "ARR: 4.2M€. Churn: 3.1%.",
        "",
        "La founder è ex-magistratura. Conosce il",
        "mestiere. Non ha mai partecipato a un pitch",
        "competition. Non ne sente la mancanza."
      ],
      signal: { sector: "LEGALTECH", delta: +5, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-cro-06", year: 1, section: 160, page: 166, tone: "gossip",
      headline: "FOUNDER LICENZIA IL CTO PER WHATSAPP",
      body: [
        "Il founder di SpinAll, gig economy",
        "verticale per cassieri di farmacia, ha",
        "licenziato il CTO via WhatsApp alle 23:47",
        "di domenica.",
        "",
        "Messaggio testuale: \"non funziona\".",
        "",
        "L'azienda ha sospeso il deploy.",
        "Gli investitori scoprono ora che esisteva.",
        "Si chiama tipico \"founder risk\"."
      ],
      signal: { sector: "CONSUMER", delta: -4, materializeYear: 1,
                type: "founder_risk", scope: "spinall" }
    },
    {
      id: "y1-cro-07", year: 1, section: 160, page: 167, tone: "serious",
      headline: "DUE EXIT NEL CYBERSECURITY",
      body: [
        "Due startup di cybersecurity B2B sono state",
        "acquisite da gruppi maggiori del settore.",
        "",
        "Multipli stimati: 7-9x ARR.",
        "Buyer: stranieri.",
        "",
        "Effetto sentiment: positivo per le cyber",
        "early stage con ARR ricorrente."
      ],
      signal: { sector: "CYBER", delta: +6, materializeYear: 1, type: "trend" }
    },
    {
      id: "y1-cro-08", year: 1, section: 160, page: 168, tone: "ironic",
      headline: "PITCH DECK GENERATO DA AI, INVESTITO",
      body: [
        "Un fondo ha investito 2M€ in una startup",
        "il cui deck era stato generato da un agent",
        "AI senza intervento umano.",
        "",
        "La startup non esiste. È un esperimento",
        "del PhD di un'università del Nord.",
        "",
        "Il fondo ha twittato che era una mossa",
        "consapevole e \"parte della tesi\"."
      ],
      signal: null
    },

    // ---------- CORPORATE WATCH (180) — 6 news ----------
    {
      id: "y1-cor-01", year: 1, section: 180, page: 181, tone: "serious",
      headline: "ITALMOTOR APRE SCOUTING SDV",
      body: [
        "Il gruppo automotive ItalMotor ha aperto",
        "un programma di scouting per partner",
        "Software Defined Vehicle.",
        "",
        "Focus:",
        "- middleware automotive",
        "- AI percezione e pianificazione",
        "- sicurezza funzionale certificata",
        "",
        "Budget: 200M in 3 anni.",
        "Target: pre-Serie B, prodotto in produzione."
      ],
      signal: { sector: "MOBILITY", delta: +10, materializeYear: 1,
                type: "corporate_opp", scope: "sdv_partnership" }
    },
    {
      id: "y1-cor-02", year: 1, section: 180, page: 182, tone: "ironic",
      headline: "ENERGIPETROL LANCIA SESTA UNIT INNOVAZIONE",
      body: [
        "Il gruppo EnergiPetrol ha annunciato",
        "\"NextFutureLab Studio Hub\", nuova business",
        "unit per investire in deep tech.",
        "",
        "È la sesta unit di innovazione in 4 anni.",
        "Le precedenti sono state \"integrate\".",
        "",
        "Procurement promette di usare un NDA",
        "aggiornato.",
        "",
        "PoC stimato: 7 trimestri."
      ],
      signal: null
    },
    {
      id: "y1-cor-03", year: 1, section: 180, page: 183, tone: "serious",
      headline: "BANCO PRIMA CERCA INSURTECH B2B",
      body: [
        "Il gruppo Banco Prima ha avviato call",
        "per partner insurtech B2B.",
        "",
        "Target: polizze parametriche per PMI,",
        "anti-frode con AI, claim automation.",
        "",
        "Fast track: integrazione in 9 mesi.",
        "Pilot: 4 filiali pilota nel Nord Ovest."
      ],
      signal: { sector: "FINTECH", delta: +5, materializeYear: 1,
                type: "corporate_opp", scope: "insurtech_b2b" }
    },
    {
      id: "y1-cor-04", year: 1, section: 180, page: 184, tone: "serious",
      headline: "AEROSTAR SCOUTING SU PROPULSIONE ELETTRICA",
      body: [
        "Il gruppo AeroStar (aerospazio) ha aperto",
        "scouting per startup di propulsione",
        "elettrica per velivoli leggeri e droni",
        "cargo medio raggio.",
        "",
        "Linea di finanziamento: 80M fino a Serie B.",
        "Pilot: due basi militari.",
        "",
        "Target preferenziale: TRL 5-7."
      ],
      signal: { sector: "SPACE", delta: +6, materializeYear: 1,
                type: "corporate_opp", scope: "epropulsion" }
    },
    {
      id: "y1-cor-05", year: 1, section: 180, page: 185, tone: "ironic",
      headline: "MAXIMARKET COMPRA STARTUP, LA CHIUDE",
      body: [
        "Il gruppo retail MaxiMarket ha acquisito",
        "PesaFrutta, startup di bilance smart per",
        "ortofrutta, per 14M€.",
        "",
        "Sei mesi dopo, ha chiuso la business unit",
        "\"per ricollocazione strategica risorse\".",
        "",
        "Il founder è ora VP Innovation del gruppo.",
        "Riporta a un VP Innovation che riporta a",
        "un Direttore Innovation."
      ],
      signal: null
    },
    {
      id: "y1-cor-06", year: 1, section: 180, page: 186, tone: "serious",
      headline: "GRUPPO TELCO APRE API A PARTNER AI",
      body: [
        "Un grande operatore TLC ha annunciato un",
        "programma di apertura API per partner AI",
        "verticali (customer care, fraud, network).",
        "",
        "Revenue share: 70/30 a favore dello startup",
        "i primi 18 mesi.",
        "",
        "Onboarding: rapido.",
        "Procurement: \"contenuto\"."
      ],
      signal: { sector: "AI", delta: +5, materializeYear: 1,
                type: "corporate_opp", scope: "telco_ai_api" }
    },
    {
      id: "y1-pol-06", year: 1, section: 120, page: 128, tone: "ironic",
      headline: "FONDO SOVRANO SCALEUP: ECCO IL MILIARDO",
      body: [
        "Annunciato il veicolo pubblico da 1 mld",
        "per le scaleup nazionali.",
        "",
        "Deployment previsto: \"entro il decennio\".",
        "Il comitato investimenti si insedia",
        "dopo la nomina del comitato che nomina",
        "il comitato.",
        "",
        "Il software nostrano ringrazia. In anticipo."
      ],
      signal: { sector: "SAAS", delta: +4, materializeYear: 2, type: "macro" }
    },
    {
      id: "y1-cro-09", year: 1, section: 160, page: 169, tone: "gossip",
      headline: "ANGEL DI PROVINCIA: 50K PER IL 30%",
      body: [
        "Un noto imprenditore locale offre 50k",
        "a una pre-seed AI. In cambio chiede:",
        "",
        "- il 30% della societa'",
        "- la sede nel suo capannone",
        "- il nipote come CTO",
        "",
        "Il founder \"ci sta pensando\".",
        "Il mercato del capitale early stage",
        "gode di ottima salute."
      ],
      signal: null
    },

    // =====================================================
    // ANNO 2 — si materializzano i signal dell'anno 1
    // =====================================================

    // ---------- ULTIM'ORA (110) ----------
    {
      id: "y2-uo-01", year: 2, section: 110, page: 211, tone: "serious",
      headline: "REGOLAMENTO IA APPROVATO IN PLENARIA",
      body: [
        "Approvato il pacchetto sull'intelligenza",
        "artificiale. Sanzioni fino al 6% del fatturato",
        "per i modelli generali sopra soglia.",
        "",
        "Operatori soggetti a obblighi:",
        "- documentazione training data",
        "- valutazione rischi sistemici",
        "- divieto pratiche manipolative",
        "",
        "Conformità entro 18 mesi.",
        "Settore foundation: shock prevedibile."
      ],
      signal: { sector: "AI", delta: -8, materializeYear: 2, type: "regulation",
                scope: "foundation" }
    },
    {
      id: "y2-uo-02", year: 2, section: 110, page: 212, tone: "serious",
      headline: "TASSI BCC: PRIMA LIMATA DELLA SERIE",
      body: [
        "La Banca Centrale Continentale ha tagliato",
        "i tassi di 25 basis point.",
        "",
        "Effetto su VC growth: positivo.",
        "Effetto su consumer fintech: positivo.",
        "Effetto su climate hard: positivo (capex)."
      ],
      signal: { sector: "FINTECH", delta: +6, materializeYear: 2, type: "macro" }
    },
    {
      id: "y2-uo-03", year: 2, section: 110, page: 213, tone: "ironic",
      headline: "STARTUP CHIUDE ROUND PRIMA DI ESISTERE",
      body: [
        "Una startup ha chiuso un round di pre-seed",
        "da 8M€ prima di:",
        "- avere un MVP",
        "- avere un nome legale",
        "- avere un'idea coerente",
        "",
        "Il deck era un meme.",
        "Il founder è un'influencer.",
        "Il fondo lead ha tweetato che è",
        "\"il futuro del thesis-driven investing\"."
      ],
      signal: null
    },
    {
      id: "y2-uo-04", year: 2, section: 110, page: 214, tone: "serious",
      headline: "TENSIONI GEOPOLITICHE: CHIP IN ESPORTAZIONE",
      body: [
        "Nuove restrizioni all'esportazione di chip",
        "ad alte prestazioni verso paesi terzi.",
        "",
        "Effetti:",
        "- foundry capacity ridistribuita",
        "- robotica industriale: lievi ritardi",
        "- AI infra locale: opportunità",
        "- defense: aumento commesse"
      ],
      signal: { sector: "SPACE", delta: +8, materializeYear: 2, type: "macro" }
    },
    {
      id: "y2-uo-05", year: 2, section: 110, page: 215, tone: "gossip",
      headline: "LP MAGGIORE TIRA INDIETRO 200M COMMIT",
      body: [
        "Un fondo pensione di grandi dimensioni ha",
        "rinegoziato un commitment da 200M€ verso",
        "un noto fondo VC.",
        "",
        "Motivazione ufficiale: \"riallineamento",
        "del piano di allocazione strategica\".",
        "",
        "Motivazione reale: hanno notato che il DPI",
        "del fondo è ancora a tre cifre dopo la virgola."
      ],
      signal: null
    },
    {
      id: "y2-uo-06", year: 2, section: 110, page: 216, tone: "serious",
      headline: "MEGAEXIT NEL CYBERSECURITY",
      body: [
        "Acquisita una scaleup cyber B2B da un",
        "incumbent globale per 1.2 mld.",
        "",
        "Multiple: 11x ARR.",
        "Settore di colpo riprezzato.",
        "Founder ora business angel attivissimo."
      ],
      signal: { sector: "CYBER", delta: +14, materializeYear: 2, type: "trend" }
    },
    {
      id: "y2-uo-07", year: 2, section: 110, page: 217, tone: "ironic",
      headline: "FOUNDER FONDA UN FONDO, POI UNA STARTUP",
      body: [
        "Un noto founder ha annunciato:",
        "1. il lancio di un suo fondo VC",
        "2. il lancio della sua nuova startup",
        "3. il fatto che il suo fondo investirà",
        "   in lead nella sua nuova startup",
        "",
        "Il post ha 14k like.",
        "La compliance ne parlerà domani."
      ],
      signal: null
    },

    // ---------- POLITICA (120) ----------
    {
      id: "y2-pol-01", year: 2, section: 120, page: 221, tone: "serious",
      headline: "DIRETTIVA DATI SANITARI: APPLICAZIONE PARTE",
      body: [
        "Inizia la fase 1 di applicazione della",
        "direttiva sui dati sanitari interoperabili.",
        "",
        "Ospedali pilota: 47.",
        "Effetti:",
        "- legaltech sanitario: nuovi tender",
        "- AI clinica strutturata: tailwind",
        "- consumer health generaliste: pressione"
      ],
      signal: { sector: "LEGALTECH", delta: +10, materializeYear: 2,
                type: "regulation", scope: "health_data" }
    },
    {
      id: "y2-pol-02", year: 2, section: 120, page: 222, tone: "serious",
      headline: "PRIMO TENDER DIFESA: APERTI 600M",
      body: [
        "Aperti i primi tender pluriennali del",
        "piano difesa-spazio. Lotti:",
        "",
        "- propulsione elettrica velivoli (200M)",
        "- osservazione terra real-time (180M)",
        "- cybersecurity governativa (140M)",
        "- comunicazioni sicure (80M)",
        "",
        "Scadenza candidature: 14 settimane."
      ],
      signal: { sector: "SPACE", delta: +12, materializeYear: 2,
                type: "corporate_opp", scope: "epropulsion" }
    },
    {
      id: "y2-pol-03", year: 2, section: 120, page: 223, tone: "ironic",
      headline: "BANDO CLIMATE TECH: 47 DOC, 0 BENEFICIARI",
      body: [
        "Il primo bando del piano transizione si",
        "è chiuso con 47 documenti richiesti per",
        "candidato.",
        "",
        "Candidati: 8.",
        "Approvati: 0.",
        "Motivazione: \"documentazione incompleta\".",
        "",
        "Il bando verrà riaperto con 51 documenti."
      ],
      signal: null
    },
    {
      id: "y2-pol-04", year: 2, section: 120, page: 224, tone: "serious",
      headline: "PIANO INDUSTRIALE BATTERIE",
      body: [
        "Approvato piano per filiera batterie:",
        "- gigafactory pubblica nel Centro Italia",
        "- co-investimento startup pre-Serie B",
        "- export tariffe protezionistiche",
        "",
        "Effetti:",
        "- battery industrial domestico: tailwind",
        "- battery import-dipendente: headwind"
      ],
      signal: { sector: "BATTERY", delta: +10, materializeYear: 2,
                type: "macro", scope: "industrial" }
    },
    {
      id: "y2-pol-05", year: 2, section: 120, page: 225, tone: "serious",
      headline: "STRETTA SU GIG ECONOMY: RIDER E NON SOLO",
      body: [
        "Sentenza pilota equipara i collaboratori",
        "delle piattaforme gig al rapporto subordinato.",
        "",
        "Estensione attesa ad altre verticals:",
        "- delivery food",
        "- micro-mobility",
        "- gig domestico",
        "",
        "Effetto: revisione UE di tutta la categoria."
      ],
      signal: { sector: "CONSUMER", delta: -12, materializeYear: 2,
                type: "regulation", scope: "consumer" }
    },

    // ---------- BORSA (140) ----------
    {
      id: "y2-bor-01", year: 2, section: 140, page: 245, tone: "serious",
      headline: "INDICE AI: SPLIT TRA FOUNDATION E INFRA",
      body: [
        "L'indice AI mostra divergenza profonda:",
        "",
        "- AI Foundation: -22% YTD",
        "- AI Infra:      +18% YTD",
        "",
        "Driver: regolazione che colpisce solo i",
        "modelli generali grandi.",
        "Capitale ruota verso i \"picks and shovels\"."
      ],
      signal: { sector: "AI", delta: +2, materializeYear: 2, type: "trend" }
    },
    {
      id: "y2-bor-02", year: 2, section: 140, page: 246, tone: "serious",
      headline: "INDICE CYBER: +30%, MULTIPLI ESPANSI",
      body: [
        "Il cybersecurity B2B chiude con multipli",
        "espansi a 9-12x ARR.",
        "",
        "Driver:",
        "- megaexit di settore",
        "- normative push (NIS2 e simili)",
        "- IPO window socchiusa per ARR ricorrente."
      ],
      signal: { sector: "CYBER", delta: +6, materializeYear: 2, type: "trend" }
    },
    {
      id: "y2-bor-03", year: 2, section: 140, page: 247, tone: "ironic",
      headline: "NUOVO INDICE: \"FOUNDERS-IN-RECOVERY\"",
      body: [
        "Una banca ha lanciato l'indice \"FIR\"",
        "(Founders-In-Recovery), che traccia",
        "founder che hanno chiuso startup negli",
        "ultimi 18 mesi e ne stanno per aprire",
        "un'altra.",
        "",
        "Componenti iniziali: 247.",
        "Performance: imprevedibile.",
        "Sentiment: \"questa volta è diverso\"."
      ],
      signal: null
    },
    {
      id: "y2-bor-04", year: 2, section: 140, page: 248, tone: "serious",
      headline: "INDICE CONSUMER: -18% SU STRETTA GIG",
      body: [
        "La sentenza sul gig riprezza tutto il",
        "consumer tech che dipende da lavoratori",
        "non subordinati.",
        "",
        "Loss-leader business model sotto stress.",
        "Marketplace puri: resilienti."
      ],
      signal: { sector: "CONSUMER", delta: -8, materializeYear: 2, type: "trend" }
    },

    // ---------- CRONACA (160) ----------
    {
      id: "y2-cro-01", year: 2, section: 160, page: 261, tone: "serious",
      headline: "FORTRESSLAB: ARR DOPPIATO, ROUND IN ARRIVO",
      body: [
        "FortressLab ha doppiato l'ARR negli ultimi",
        "12 mesi (8 → 17M).",
        "",
        "Net retention: 138%.",
        "Round Series B atteso a valuation 200M+.",
        "",
        "Lead in lizza: 3 top fund USA."
      ],
      signal: { sector: "CYBER", delta: +4, materializeYear: 2, type: "trend" }
    },
    {
      id: "y2-cro-02", year: 2, section: 160, page: 262, tone: "gossip",
      headline: "FOUNDER DI AGIORDIE SU PALCO TEDX",
      body: [
        "Il founder di AGIorDie ha tenuto un TEDx",
        "sul tema \"l'AGI è già qui, lo sappiamo solo",
        "noi tre\".",
        "",
        "Tre slide, 18 minuti.",
        "La startup ha 0 revenue.",
        "Il founder ora vende un corso online",
        "su \"come costruire AGI da soli\"."
      ],
      signal: null
    },
    {
      id: "y2-cro-03", year: 2, section: 160, page: 263, tone: "serious",
      headline: "SALTCORE: PILOT INDUSTRIALE CONFERMATO",
      body: [
        "SaltCore Energy ha annunciato la firma",
        "del pilot industriale con un OEM continentale.",
        "",
        "Volume: 2 GWh annui prima fase.",
        "Avvio produzione: ANNO 4.",
        "Round Serie B aperto a valutazione 240M."
      ],
      signal: { sector: "BATTERY", delta: +8, materializeYear: 2, type: "trend" }
    },
    {
      id: "y2-cro-04", year: 2, section: 160, page: 264, tone: "gossip",
      headline: "WAR ROOM A 4: BURN OUT COLLETTIVO",
      body: [
        "Una startup AI in fase di crescita rapida",
        "ha messo i quattro co-founder a dormire",
        "in ufficio per 6 settimane di seguito.",
        "",
        "Risultato:",
        "- 2 sono in clinica",
        "- 1 ha lasciato",
        "- 1 ha aperto la sua società di consulenza",
        "",
        "L'azienda funziona ancora. Per ora."
      ],
      signal: null
    },
    {
      id: "y2-cro-05", year: 2, section: 160, page: 265, tone: "ironic",
      headline: "EXIT VIA FALLIMENTO RIBRANDIZZATO",
      body: [
        "Una startup ha annunciato \"exit strategica\"",
        "che il deck definisce \"riallocazione del",
        "capitale umano\".",
        "",
        "In realtà: insolvenza.",
        "Il founder è già su un nuovo deck.",
        "Lo stesso identico, ma in inglese."
      ],
      signal: null
    },
    {
      id: "y2-cro-06", year: 2, section: 160, page: 266, tone: "serious",
      headline: "INVOICEQUICK ACQUISISCE COMPETITOR",
      body: [
        "InvoiceQuick ha annunciato l'acquisizione",
        "di un competitor verticale del Sud Europa.",
        "",
        "Multiplo: 5x ARR (cash + carta).",
        "Synergie attese: cross-sell e roadmap unica.",
        "",
        "Founder: \"primo deal di una serie\"."
      ],
      signal: { sector: "SAAS", delta: +4, materializeYear: 2, type: "trend" }
    },

    // ---------- CORPORATE (180) ----------
    {
      id: "y2-cor-01", year: 2, section: 180, page: 281, tone: "serious",
      headline: "ITALMOTOR FIRMA CON DUE STARTUP SDV",
      body: [
        "ItalMotor ha chiuso due accordi con startup",
        "Software Defined Vehicle, dopo un anno di",
        "scouting.",
        "",
        "Importo combinato: 35M.",
        "Pilot avviati su 2 modelli.",
        "Il programma scouting continua: si cerca",
        "ancora un terzo partner verticale."
      ],
      signal: { sector: "MOBILITY", delta: +12, materializeYear: 2,
                type: "corporate_opp", scope: "sdv_partnership" }
    },
    {
      id: "y2-cor-02", year: 2, section: 180, page: 282, tone: "ironic",
      headline: "ENERGIPETROL CHIUDE LA SESTA UNIT",
      body: [
        "Il gruppo EnergiPetrol ha chiuso",
        "\"NextFutureLab Studio Hub\", appena 14 mesi",
        "dopo l'inaugurazione.",
        "",
        "Motivazione: \"riallineamento delle ambizioni",
        "di innovazione\".",
        "",
        "Stanno preparando la settima.",
        "Si chiamerà \"NextFutureLab Studio Hub Plus\"."
      ],
      signal: null
    },
    {
      id: "y2-cor-03", year: 2, section: 180, page: 283, tone: "serious",
      headline: "GRANDE BANCA ACQUISISCE SMARTPOLICY",
      body: [
        "Banco Prima ha portato a termine l'acquisizione",
        "di SmartPolicy per 95M€.",
        "",
        "Multiplo: 6x ARR.",
        "I founder restano per 3 anni di vesting.",
        "Tutte le startup insurtech B2B con pilot",
        "bancari sono ora più riprezzate."
      ],
      signal: { sector: "FINTECH", delta: +14, materializeYear: 2,
                type: "corporate_opp", scope: "insurtech_b2b" }
    },
    {
      id: "y2-cor-04", year: 2, section: 180, page: 284, tone: "serious",
      headline: "AEROSTAR CHIUDE LOI CON 5 STARTUP",
      body: [
        "AeroStar ha firmato 5 LOI con startup di",
        "propulsione elettrica e droni cargo.",
        "",
        "Importi 5-12M ciascuna.",
        "Conversione attesa in equity stake."
      ],
      signal: { sector: "SPACE", delta: +10, materializeYear: 2,
                type: "corporate_opp", scope: "epropulsion" }
    },
    {
      id: "y2-uo-08", year: 2, section: 110, page: 218, tone: "ironic",
      headline: "FONDAZIONI: \"IL VENTURE? MEGLIO I BTP\"",
      body: [
        "Convegno annuale degli investitori",
        "istituzionali. Dal palco:",
        "",
        "\"Il venture capital e' affascinante,",
        "ma il BTP non ti manda mai un pitch",
        "deck alle 23:40.\"",
        "",
        "Applauso lungo. Troppo lungo.",
        "I GP in sala ordinano un altro caffe'."
      ],
      signal: null
    },
    {
      id: "y2-pol-06", year: 2, section: 120, page: 226, tone: "serious",
      headline: "GOLDEN POWER SULL'ACQUISIZIONE ROBOTICA",
      body: [
        "Il governo esercita il golden power e",
        "blocca la vendita di una scaleup robotica",
        "a un compratore extra-UE.",
        "",
        "\"Asset strategico nazionale.\"",
        "",
        "Effetto collaterale: ogni buyer estero",
        "ora sconta il rischio veto sul prezzo.",
        "Le exit robotiche si raffreddano."
      ],
      signal: { sector: "ROBOTICS", delta: -6, materializeYear: 2,
                type: "regulation", scope: "robotics_export" }
    },

    // =====================================================
    // ANNO 3 — capitali ruotano, primi big winner / loser
    // =====================================================

    // ULTIM'ORA
    {
      id: "y3-uo-01", year: 3, section: 110, page: 311, tone: "serious",
      headline: "BCC TAGLIA ANCORA: -50 BPS",
      body: [
        "Secondo taglio dei tassi. La discesa è",
        "data per probabile fino a fine anno.",
        "",
        "Effetti VC: positivi su growth equity.",
        "Effetti consumer: positivi (CAC più gestibili).",
        "Effetti climate hard: positivi (capex)."
      ],
      signal: { sector: "FINTECH", delta: +8, materializeYear: 3, type: "macro" }
    },
    {
      id: "y3-uo-02", year: 3, section: 110, page: 312, tone: "serious",
      headline: "IPO TECH RIAPERTA: 4 NEL TRIMESTRE",
      body: [
        "Quattro IPO tech andate a buon fine nel",
        "trimestre. Reception: positiva.",
        "",
        "Settori protagonisti:",
        "- cybersecurity B2B",
        "- enterprise software profittevole",
        "- industrial tech selezionato",
        "",
        "Effetto: rivalutazione tardo-stage."
      ],
      signal: { sector: "CYBER", delta: +8, materializeYear: 3, type: "macro" }
    },
    {
      id: "y3-uo-03", year: 3, section: 110, page: 313, tone: "gossip",
      headline: "FONDO ENTRA IN STALLO: NESSUN DEAL DA 6 MESI",
      body: [
        "Un noto fondo VC continentale non chiude",
        "un nuovo deal da 6 mesi.",
        "",
        "Off the record: i partner non si parlano.",
        "Off the recorder ancora: i deal restano",
        "fermi al penultimo step di IC.",
        "",
        "Tre founder ottimi hanno scelto altri lead."
      ],
      signal: null
    },
    {
      id: "y3-uo-04", year: 3, section: 110, page: 314, tone: "serious",
      headline: "IDROGENO BLU: PRIMA DELUSIONE OPERATIVA",
      body: [
        "Un grande progetto idrogeno blu nel Nord",
        "Europa ha registrato i primi delay.",
        "",
        "LCOH effettivo: superiore alle previsioni.",
        "Capacità a regime: rimandata di 18 mesi.",
        "",
        "Settore in revisione cauta."
      ],
      signal: { sector: "CLIMATE", delta: -8, materializeYear: 3, type: "trend",
                scope: "hard" }
    },

    // POLITICA
    {
      id: "y3-pol-01", year: 3, section: 120, page: 321, tone: "serious",
      headline: "REGOLAMENTO IA: PRIMI PROVVEDIMENTI",
      body: [
        "Aperte tre istruttorie contro foundation",
        "labs continentali.",
        "",
        "Sanzioni potenziali nell'ordine di centinaia",
        "di milioni.",
        "",
        "Settore foundation reagisce: -15% in due",
        "settimane."
      ],
      signal: { sector: "AI", delta: -12, materializeYear: 3, type: "regulation",
                scope: "foundation" }
    },
    {
      id: "y3-pol-02", year: 3, section: 120, page: 322, tone: "serious",
      headline: "PIANO DIFESA: SECONDA TRANCHE 1.4 MLD",
      body: [
        "Sbloccata la seconda tranche del piano",
        "difesa, valore 1.4 mld.",
        "",
        "Tender 18 mesi.",
        "Focus: dual-use, AI per ISR, prop. elettrica."
      ],
      signal: { sector: "SPACE", delta: +14, materializeYear: 3,
                type: "macro" }
    },
    {
      id: "y3-pol-03", year: 3, section: 120, page: 323, tone: "ironic",
      headline: "CRYPTO: NUOVA TASSA SU PLUSVALENZE",
      body: [
        "Approvata addizionale del 12% sulle",
        "plusvalenze crypto sopra soglia.",
        "",
        "Effetto immediato:",
        "- volumi -34%",
        "- emigrazione ufficiale di 6 piattaforme",
        "- lobbisti: \"freno all'innovazione\"",
        "- pubblico: \"ah, c'erano ancora?\""
      ],
      signal: { sector: "CRYPTO", delta: -18, materializeYear: 3,
                type: "regulation" }
    },

    // BORSA
    {
      id: "y3-bor-01", year: 3, section: 140, page: 345, tone: "serious",
      headline: "INDICE BATTERY: +18% IN ESPANSIONE",
      body: [
        "Il battery industrial domestico beneficia",
        "del piano industriale e dei tagli tassi.",
        "",
        "Indice: +18% YTD.",
        "Multipli espansi su pre-Series B."
      ],
      signal: { sector: "BATTERY", delta: +4, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-bor-02", year: 3, section: 140, page: 346, tone: "serious",
      headline: "INDICE SPACE: BOOM DA 32% YTD",
      body: [
        "Lo space dual-use vola sul piano difesa.",
        "",
        "Le startup early che si sono qualificate",
        "ai tender stanno chiudendo round growth.",
        "",
        "Multipli: 8-14x ARR per chi ha contratti."
      ],
      signal: { sector: "SPACE", delta: +6, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-bor-03", year: 3, section: 140, page: 347, tone: "ironic",
      headline: "INDICE MEMECOIN: NUOVA SOTTO-CATEGORIA",
      body: [
        "Lanciato l'indice ufficiale dei memecoin",
        "ufficialmente memecoin.",
        "",
        "Volatilità: ovunque.",
        "Capitalizzazione: opinabile.",
        "Sponsor: un wallet della Sardegna."
      ],
      signal: null
    },

    // CRONACA
    {
      id: "y3-cro-01", year: 3, section: 160, page: 361, tone: "serious",
      headline: "DOVESOFWAR FIRMA TENDER GOVERNATIVO",
      body: [
        "DovesOfWar ha chiuso il primo contratto",
        "pluriennale con un ministero.",
        "",
        "Valore: 22M€ in 4 anni.",
        "Il founder definisce l'azienda \"pacificamente",
        "letale\".",
        "Round Serie B in chiusura."
      ],
      signal: { sector: "SPACE", delta: +10, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-cro-02", year: 3, section: 160, page: 362, tone: "gossip",
      headline: "FOUNDER DI MADBANK SCOMPARE 3 SETTIMANE",
      body: [
        "Il founder di MadBank è risultato",
        "irraggiungibile per 3 settimane.",
        "",
        "Era ad un retreat \"di trasformazione\".",
        "",
        "Nel frattempo l'azienda ha:",
        "- chiuso una linea di prodotto",
        "- licenziato 8 persone",
        "- aumentato i fee per i clienti.",
        "",
        "Non sa nulla di nulla. Pubblicherà un post."
      ],
      signal: { sector: "FINTECH", delta: -6, materializeYear: 3,
                type: "founder_risk", scope: "madbank" }
    },
    {
      id: "y3-cro-03", year: 3, section: 160, page: 363, tone: "serious",
      headline: "STRONGARM: MAXI-COMMESSA AUTOMOTIVE",
      body: [
        "StrongArm Robotics ha annunciato una",
        "maxi-commessa pluriennale con un OEM.",
        "",
        "Valore stimato: 80M€.",
        "Pipeline operativa: pieno carico per 24 mesi."
      ],
      signal: { sector: "ROBOTICS", delta: +10, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-cro-04", year: 3, section: 160, page: 364, tone: "ironic",
      headline: "GREENRINSE PUBBLICA REPORT DI IMPATTO",
      body: [
        "GreenRinse ha pubblicato il proprio",
        "Annual Impact Report.",
        "",
        "Pagine: 184.",
        "Dati verificati: 0.",
        "Foto di alberi: 47.",
        "Bandi vinti: 8.",
        "",
        "Il NGO partner ha rilasciato dichiarazione",
        "definita \"sfumata\"."
      ],
      signal: null
    },

    // CORPORATE
    {
      id: "y3-cor-01", year: 3, section: 180, page: 381, tone: "serious",
      headline: "GRANDE TLC ATTIVA PARTNERSHIP AI",
      body: [
        "Il gruppo TLC ha attivato a regime il",
        "programma API per partner AI verticali.",
        "",
        "Primi 6 partner sotto contratto.",
        "Revenue share confermato 70/30.",
        "",
        "Effetto a cascata su altri operatori."
      ],
      signal: { sector: "AI", delta: +10, materializeYear: 3,
                type: "corporate_opp", scope: "telco_ai_api" }
    },
    {
      id: "y3-cor-02", year: 3, section: 180, page: 382, tone: "serious",
      headline: "OEM CINESE ENTRA NEL MERCATO BATTERIE",
      body: [
        "Un OEM cinese ha annunciato investimento",
        "industriale da 1.8 mld in capacity batterie",
        "in Europa.",
        "",
        "Effetto:",
        "- competizione su prezzi celle",
        "- battery sodium-ion meno esposta",
        "- battery lithium import: prezzi compressi"
      ],
      signal: { sector: "BATTERY", delta: -4, materializeYear: 3, type: "macro" }
    },
    {
      id: "y3-uo-06", year: 3, section: 110, page: 316, tone: "gossip",
      headline: "\"CI COMPRANO TUTTI\": POLEMICA SULLE EXIT",
      body: [
        "Editoriale al vetriolo: le migliori",
        "startup nazionali vendute a corporate",
        "estere \"per un piatto di lenticchie\".",
        "",
        "Un parlamentare propone una commissione",
        "d'inchiesta sul venture capital.",
        "",
        "I founder esaminati chiedono se la",
        "commissione paghi in equity."
      ],
      signal: null
    },
    {
      id: "y3-cor-04", year: 3, section: 180, page: 384, tone: "serious",
      headline: "CAMPIONE NAZIONALE CERCASI: CORDATA PUBBLICA",
      body: [
        "Nasce la cordata pubblico-privata per",
        "il \"campione nazionale\" delle batterie.",
        "",
        "Dentro: due banche, un'utility, tre",
        "ministeri e un fondo sovrano del Golfo",
        "\"a titolo osservativo\".",
        "",
        "La gigafactory si fara'. La governance",
        "e' gia' al terzo comitato."
      ],
      signal: null
    },

    // =====================================================
    // ANNO 4 — winners scappano, losers si scoprono
    // =====================================================

    {
      id: "y4-uo-01", year: 4, section: 110, page: 411, tone: "serious",
      headline: "AI INFRA: PRIMO UNICORN EUROPEO",
      body: [
        "Una startup europea AI infrastructure ha",
        "chiuso round growth a 1.4 mld di valutazione.",
        "",
        "Driver: capitale ruota da foundation a infra.",
        "Categoria adottata da fondi blue chip."
      ],
      signal: { sector: "AI", delta: +14, materializeYear: 4, type: "trend",
                scope: "infra" }
    },
    {
      id: "y4-uo-02", year: 4, section: 110, page: 412, tone: "serious",
      headline: "BCC: PRIMO RIALZO DOPO 3 ANNI",
      body: [
        "Sorpresa: la Banca Centrale Continentale",
        "ha rialzato i tassi di 25 bps su pressioni",
        "inflattive.",
        "",
        "Effetto: rallentamento risk appetite,",
        "compressione multipli growth."
      ],
      signal: { sector: "FINTECH", delta: -6, materializeYear: 4, type: "macro" }
    },
    {
      id: "y4-uo-03", year: 4, section: 110, page: 413, tone: "ironic",
      headline: "FOUNDER VENDE A SE STESSO, DUE VOLTE",
      body: [
        "Un founder ha venduto la sua startup al",
        "suo fondo, che era anche il suo lead",
        "investor.",
        "",
        "Il fondo aveva uno SPV.",
        "Lo SPV ha rivenduto alla nuova entity",
        "controllata dallo stesso founder.",
        "",
        "Tutti hanno fatto il carry."
      ],
      signal: null
    },
    {
      id: "y4-uo-04", year: 4, section: 110, page: 414, tone: "serious",
      headline: "SUPPLY CHAIN CHIP: RIENTRO PARZIALE",
      body: [
        "Le tensioni sulla supply chain chip si",
        "stanno parzialmente normalizzando.",
        "",
        "Effetti:",
        "- robotica industriale: ripresa",
        "- AI training: capacity più disponibile",
        "- defense: spinta confermata"
      ],
      signal: { sector: "ROBOTICS", delta: +8, materializeYear: 4, type: "macro" }
    },

    {
      id: "y4-pol-01", year: 4, section: 120, page: 421, tone: "serious",
      headline: "REGOLAMENTO IA: PRIME CONDANNE",
      body: [
        "Comminate le prime sanzioni a foundation",
        "lab continentali.",
        "",
        "Importi cumulati: 480M€.",
        "Tre lab in fase di ristrutturazione.",
        "Settore foundation in pressione persistente."
      ],
      signal: { sector: "AI", delta: -16, materializeYear: 4, type: "regulation",
                scope: "foundation" }
    },
    {
      id: "y4-pol-02", year: 4, section: 120, page: 422, tone: "serious",
      headline: "NUOVO PIANO CYBER GOVERNATIVO",
      body: [
        "Approvato piano cyber continentale da",
        "640M su 4 anni.",
        "",
        "Focus:",
        "- protezione infrastrutture critiche",
        "- threat intelligence",
        "- formazione operator",
        "- partnership con scaleup."
      ],
      signal: { sector: "CYBER", delta: +12, materializeYear: 4, type: "macro" }
    },
    {
      id: "y4-pol-03", year: 4, section: 120, page: 423, tone: "ironic",
      headline: "BANDO INNOVAZIONE: NUOVA CATEGORIA \"GENAI\"",
      body: [
        "Aperto bando per progetti \"GenAI etici",
        "e sostenibili rivolti alla PA\".",
        "",
        "Budget: 22.000€.",
        "Documenti: 92.",
        "Termine: 9 giorni lavorativi.",
        "",
        "Reazione ecosistema: \"Tutto utile.\""
      ],
      signal: null
    },

    {
      id: "y4-bor-01", year: 4, section: 140, page: 445, tone: "serious",
      headline: "INDICE LEGALTECH: BREAKOUT +28%",
      body: [
        "Il legaltech verticale chiude il trimestre",
        "in rialzo del 28% YTD.",
        "",
        "Driver: applicazione direttiva dati sanitari",
        "+ vendite enterprise consolidate.",
        "",
        "Multipli: 9-11x ARR per net retention >120%."
      ],
      signal: { sector: "LEGALTECH", delta: +8, materializeYear: 4, type: "trend" }
    },
    {
      id: "y4-bor-02", year: 4, section: 140, page: 446, tone: "serious",
      headline: "INDICE CLIMATE: SCONFITTA HARD, VITTORIA SOFT",
      body: [
        "Climate hard: -12% YTD (delay operativi).",
        "Climate soft (MRV, certificazione): +8%.",
        "",
        "Logica: il mercato premia l'intermediazione,",
        "punisce chi costruisce davvero impianti."
      ],
      signal: { sector: "CLIMATE", delta: 0, materializeYear: 4, type: "trend" }
    },

    {
      id: "y4-cro-01", year: 4, section: 160, page: 461, tone: "serious",
      headline: "RAGTAG.AI ANNUNCIA PARTNERSHIP TLC",
      body: [
        "RagTag.ai ha annunciato partnership",
        "industriale con un grande operatore TLC.",
        "",
        "Revenue share confermato.",
        "Pilot pluriennale.",
        "Valuation post-round: 95M."
      ],
      signal: { sector: "AI", delta: +6, materializeYear: 4, type: "trend",
                scope: "infra" }
    },
    {
      id: "y3-cro-05", year: 3, section: 160, page: 365, tone: "gossip",
      headline: "EXGOOGLER.AI VENDUTA, NESSUNO LA USAVA",
      body: [
        "ExGoogler.ai è stata acquisita da un",
        "incumbent per 18M.",
        "",
        "Dei 9 founder ne restano 3.",
        "Il prodotto non sarà integrato.",
        "Il team verrà disperso in 3 BU diverse.",
        "Si chiama acqui-hire. È nobile."
      ],
      signal: { sector: "AI", delta: -2, materializeYear: 3, type: "trend" }
    },
    {
      id: "y2-cro-07", year: 2, section: 160, page: 267, tone: "serious",
      headline: "STARVISTA: IPO PROGRAMMATA",
      body: [
        "StarVista ha mandatato banker per IPO",
        "su listino growth.",
        "",
        "Valutazione target: 850M-1.1 mld.",
        "Tempistica: H2 ANNO 3."
      ],
      signal: { sector: "SPACE", delta: +12, materializeYear: 2, type: "trend" }
    },
    {
      id: "y3-cro-06", year: 3, section: 160, page: 366, tone: "ironic",
      headline: "PIVOTKING ANNUNCIA QUARTO PIVOT",
      body: [
        "PivotKing ha annunciato il quarto pivot.",
        "",
        "Nuovo nome: PivotEmperor.",
        "Nuovo settore: \"AI agent per pivot di",
        "altre startup\".",
        "",
        "Il TAM è quasi infinito."
      ],
      signal: null
    },

    {
      id: "y3-cor-03", year: 3, section: 180, page: 383, tone: "serious",
      headline: "ITALMOTOR ACQUISISCE STARTUP SDV",
      body: [
        "ItalMotor ha acquisito una scaleup SDV",
        "per 320M.",
        "",
        "I founder restano per vesting.",
        "Settore SDV ora consolidato attorno a 2",
        "incumbent grandi."
      ],
      signal: { sector: "MOBILITY", delta: +14, materializeYear: 3,
                type: "corporate_opp", scope: "sdv_partnership" }
    },

    // =====================================================
    // ANNO 5 — esiti finali, exit, write-off
    // =====================================================

    {
      id: "y3-uo-05", year: 3, section: 110, page: 315, tone: "serious",
      headline: "IPO STARVISTA SUL LISTINO",
      body: [
        "StarVista debutta in IPO a 920M.",
        "Reception: positiva, oversubscribed 3.4x.",
        "",
        "Effetto a cascata sull'intero space dual-use."
      ],
      signal: { sector: "SPACE", delta: +14, materializeYear: 3, type: "trend" }
    },
    {
      id: "y5-uo-02", year: 5, section: 110, page: 512, tone: "serious",
      headline: "CONSOLIDATION WAVE: 4 EXIT IN 6 MESI",
      body: [
        "Trimestre da record: 4 exit tech",
        "continentali in 6 mesi.",
        "",
        "Settori protagonisti:",
        "- legaltech vertical",
        "- cyber B2B",
        "- battery industrial",
        "- enterprise software profittevole."
      ],
      signal: { sector: "LEGALTECH", delta: +12, materializeYear: 5, type: "trend" }
    },
    {
      id: "y5-uo-03", year: 5, section: 110, page: 513, tone: "ironic",
      headline: "FONDO CHIUDE FUNDRAISE A 1.4 MLD",
      body: [
        "Un nuovo fondo VC ha chiuso il fundraising",
        "a 1.4 mld con tesi \"AI for vertical industries\".",
        "",
        "I partner sono gli stessi del precedente",
        "fondo, che aveva chiuso a 280M con tesi",
        "\"AI for horizontal industries\".",
        "",
        "Gli LP non se ne sono accorti.",
        "Dicono."
      ],
      signal: null
    },

    {
      id: "y5-pol-01", year: 5, section: 120, page: 521, tone: "serious",
      headline: "REGOLAMENTO IA: ULTIME RAFFICHE",
      body: [
        "Quarto ciclo di sanzioni applicato.",
        "Foundation labs continentali ridotti a 3.",
        "",
        "Effetto: capitale concentrato in pochi player.",
        "Pressione persistente fino alla revisione",
        "del regolamento (ANNO 7+)."
      ],
      signal: { sector: "AI", delta: -10, materializeYear: 5, type: "regulation",
                scope: "foundation" }
    },
    {
      id: "y5-pol-02", year: 5, section: 120, page: 522, tone: "serious",
      headline: "PIANO CLIMATE: NUOVA INIEZIONE 12 MLD",
      body: [
        "Approvata nuova tranche del piano climate",
        "da 12 mld su 3 anni.",
        "",
        "Focus: gigafactory batterie domestiche,",
        "geotermia profonda, accumulo elettrico.",
        "",
        "Climate hard finalmente premiato dal mercato."
      ],
      signal: { sector: "CLIMATE", delta: +18, materializeYear: 5,
                type: "macro", scope: "hard" }
    },

    {
      id: "y5-bor-01", year: 5, section: 140, page: 545, tone: "serious",
      headline: "ANNO RECORD PER CYBER: +42% YTD",
      body: [
        "Indice Cyber chiude in territorio storico.",
        "",
        "Multipli espansi su tutte le scaleup",
        "con net retention >120%.",
        "",
        "IPO window aperta per la categoria."
      ],
      signal: { sector: "CYBER", delta: +12, materializeYear: 5, type: "trend" }
    },
    {
      id: "y5-bor-02", year: 5, section: 140, page: 546, tone: "serious",
      headline: "INDICE AI FOUNDATION: -38% A FINE PERIODO",
      body: [
        "Foundation labs chiudono il quinquennio",
        "in profondo rosso.",
        "",
        "Pochi vincitori, molti zombie.",
        "Talenti tornano su infra e vertical AI."
      ],
      signal: { sector: "AI", delta: -8, materializeYear: 5, type: "trend",
                scope: "foundation" }
    },

    {
      id: "y3-cro-07", year: 3, section: 160, page: 367, tone: "serious",
      headline: "NEURONOTE ACQUISITA DA INCUMBENT",
      body: [
        "NeuroNote è stata acquisita da un",
        "incumbent legaltech per 220M€.",
        "",
        "Multiplo: 10x ARR.",
        "Tutti gli investitori realizzano DPI",
        "significativo."
      ],
      signal: { sector: "LEGALTECH", delta: +10, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-cro-08", year: 3, section: 160, page: 368, tone: "gossip",
      headline: "AGIORDIE CHIUDE: \"AVEVAMO RAGIONE\"",
      body: [
        "AGIorDie ha cessato le attività.",
        "",
        "Lettera del founder: \"avevamo ragione,",
        "ma il mercato non era pronto. Non ci",
        "siamo capiti. Vi rimborseremo in",
        "pubblicazioni accademiche.\"",
        "",
        "Investitori: write-off totale."
      ],
      signal: { sector: "AI", delta: -4, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-cro-09", year: 3, section: 160, page: 369, tone: "serious",
      headline: "SALTCORE: ANNUNCIATA GIGAFACTORY",
      body: [
        "SaltCore Energy ha annunciato la gigafactory",
        "domestica da 6 GWh in partnership pubblica.",
        "",
        "Valuation salita a 480M.",
        "Settore battery industrial: vetta del ciclo."
      ],
      signal: { sector: "BATTERY", delta: +14, materializeYear: 3, type: "trend" }
    },
    {
      id: "y3-cro-10", year: 3, section: 160, page: 370, tone: "ironic",
      headline: "STEALTHMODE FINALMENTE RIVELA",
      body: [
        "Dopo 3 anni, StealthMode ha rivelato cosa",
        "fa: una piattaforma SaaS per condividere",
        "calendari.",
        "",
        "La valuation è stata ridimensionata",
        "da 800M a 14M.",
        "",
        "Quattro fondi hanno ringraziato per",
        "l'esperienza formativa."
      ],
      signal: null
    }
  ];

  function byYear(year)            { return NEWS.filter(n => n.year === year); }
  function bySection(section)      { return NEWS.filter(n => n.section === section); }
  function byPage(page)            { return NEWS.find(n => n.page === page); }
  function publishedAt(currentYear){ return NEWS.filter(n => n.year <= currentYear); }
  // Lista di sezione: mostra le news dell'anno corrente (sintesi tipica
  // di un Televideo che si aggiorna). Archivio anni precedenti in roadmap.
  function listSection(section, currentYear) {
    return NEWS.filter(n => n.section === section && n.year === currentYear);
  }

  global.TVNews = { NEWS, byYear, bySection, byPage, publishedAt, listSection };
})(window);
