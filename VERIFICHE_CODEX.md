# VERIFICHE CODEX

## Stato del documento

- Data verifica: 10 giugno 2026
- Progetto: Tele Venture Capital 3000
- Tipo di analisi: sola lettura del codice, validazione dati e smoke test isolato
- Codice applicativo modificato durante l'analisi: no

## Valutazione sintetica

Il progetto ha una buona base e puo essere portato avanti senza riscriverlo.

L'identita del gioco e gia forte: interfaccia Televideo, navigazione numerica,
copywriting, startup, news, profili LP e motore settoriale formano un prototipo
riconoscibile e interessante.

Prima di pubblicarlo come MVP bisogna pero completare e correggere il ciclo
economico del gioco. I problemi principali riguardano dealflow, exit, DPI,
valutazione delle partecipazioni e regole di avanzamento.

## Cosa e gia presente

- Applicazione statica in HTML, CSS e JavaScript vanilla.
- Navigazione tramite numeri di pagina e tastiera.
- Salvataggio della partita tramite LocalStorage.
- Effetto di caricamento Televideo e audio opzionale.
- Fondo iniziale da 100M EUR e partita su cinque anni.
- Dealflow annuale con schede startup e attivita di due diligence.
- Portfolio con rivalutazione annuale.
- News di mercato collegate a segnali settoriali.
- Profili LP e chiamate condizionate dalle scelte di portafoglio.
- Report finale, punteggio e leaderboard locale.
- 32 startup predefinite.
- 102 news distribuite sui cinque anni.
- 12 indici settoriali.

## Verifiche eseguite

### Struttura e sintassi

- Analizzati 27 file JavaScript.
- Tutti i file JavaScript superano `node --check`.
- Non sono stati trovati ID startup duplicati.
- Non sono stati trovati ID o numeri di pagina news duplicati.
- Tutte le startup contengono i campi richiesti dal motore.
- I segnali news hanno settore, tipo, delta e anno di materializzazione validi.
- I settori dei segnali trovano corrispondenza nei settori delle startup.

### Smoke test del flusso principale

E stato simulato questo percorso:

1. Apertura della home.
2. Creazione di una nuova partita.
3. Apertura del dealflow.
4. Investimento in una startup.
5. Chiusura dell'anno.
6. Avanzamento all'anno successivo.

Il percorso viene completato senza errori JavaScript. Lo stesso test ha pero
confermato che una startup appena investita rimane visibile nel dealflow
dell'anno corrente.

### Limite della verifica

Il browser integrato non e riuscito ad avviarsi per un problema dell'ambiente
locale. La verifica visuale completa e l'esperienza reale da tastiera dovranno
quindi essere ripetute in un browser normale.

## Problemi bloccanti

### P0 - Startup investite o scartate ricompaiono nel dealflow

**Evidenza**

- `js/engine/dealflow.js` conserva tre ID nella cache annuale.
- `js/pages/startupDetail.js` rimuove la startup solo da `_dealflowMap`.
- `js/pages/dealflow.js` ricostruisce `_dealflowMap` partendo nuovamente dalla
  cache annuale completa.

**Effetto**

Una startup investita o passata puo ricomparire tornando a pagina 200. Questo
permette decisioni ripetute sullo stesso deal e rende il ciclo annuale ambiguo.

**Direzione consigliata**

Memorizzare nello stato anche lo stato della decisione annuale:

- `pending`
- `invested`
- `passed`

La pagina dealflow deve mostrare soltanto le startup ancora `pending`. L'anno
puo essere chiuso quando tutte le opportunita sono state deliberate, oppure
quando il giocatore conferma esplicitamente di voler abbandonare quelle rimaste.

### P0 - Non esistono exit o capitale realizzato

**Evidenza**

`state.realized` viene inizializzato e letto dal portfolio e dallo scoring, ma
non viene mai incrementato.

**Effetto**

- DPI sempre uguale a zero.
- Il 20% dello score finale dedicato al DPI non e realmente giocabile.
- Nessuna posizione viene venduta o distribuita agli LP.
- Le LP call relative alla liquidita non possono essere soddisfatte tramite una
  vera scelta di gioco.

**Direzione consigliata**

Introdurre eventi di liquidita semplici:

- exit totale;
- vendita secondaria parziale;
- acquihire;
- write-off;
- posizione ancora non realizzata a fine fondo.

Ogni evento dovrebbe aggiornare almeno:

- `realized`;
- stato della posizione;
- valore residuo;
- history;
- soddisfazione degli LP, quando rilevante.

### P0 - La valuation negoziata non migliora il ritorno

**Evidenza**

La scheda startup calcola `equityPct = amount / valuation`, ma portfolio e
scoring calcolano il valore come:

```text
investedAmount * currentValueMultiplier
```

`equityPct` ed `entryValuation` non partecipano al rendimento.

**Effetto**

Ottenere uno sconto del 20% sulla valuation non porta alcun vantaggio economico.
La scelta ha quindi un esito visuale ma non strategico.

**Direzione consigliata**

Scegliere un modello unico:

1. **Modello equity:** valore posizione = equity posseduta x valore corrente
   della startup.
2. **Modello multiplo:** lo sconto sulla valuation aumenta il moltiplicatore
   iniziale della posizione.

Per il progetto attuale il secondo modello e piu semplice, ma il primo e piu
chiaro dal punto di vista didattico.

### P0 - Gli anni possono essere saltati senza giocare

**Evidenza**

Da pagina 200 e possibile chiudere subito l'anno. Le LP call possono essere
ignorate e non esiste una condizione che richieda di deliberare le tre startup.

**Effetto**

Il giocatore puo arrivare al report finale senza affrontare il ciclo previsto.

**Direzione consigliata**

Prima della chiusura annuale controllare:

- deal ancora pendenti;
- LP call obbligatorie;
- eventuali decisioni IC;
- presenza di capitale sufficiente o altre condizioni speciali.

In alternativa, consentire di ignorarli applicando conseguenze esplicite.

## Problemi ad alta priorita

### P1 - Report finale accessibile prima della fine

La pagina 700 non verifica `gameOver` o `year >= maxYear`. Un utente che conosce
il numero puo aprire direttamente il report finale.

**Suggerimento:** proteggere tutte le pagine di fase con prerequisiti di stato.

### P1 - Le news lette non producono un vero vantaggio informativo

`readPages` registra alcune pagine visitate, ma il dato non viene utilizzato nel
motore o nello scoring. Inoltre `publishedNews` e presente nello stato ma non
viene alimentato.

**Effetto:** il gioco suggerisce che leggere il Televideo dia un edge, ma oggi
le informazioni sono utili solo alla comprensione umana del giocatore.

**Spunto:** premiare la lettura pertinente con:

- probabilita DD migliore;
- riduzione del costo DD;
- segnale esplicito nella scheda startup;
- bonus reputazione;
- scelta aggiuntiva durante l'IC.

Il vantaggio non dovrebbe essere automatico per ogni news aperta: serve un
collegamento tra pagina letta e startup o evento interessato.

### P1 - Dealflow deterministico fra nuove partite

Il seed dipende sostanzialmente dall'anno e dalla dimensione del fondo, che sono
uguali in ogni nuova partita.

**Effetto:** le nuove partite tendono a proporre lo stesso percorso.

**Suggerimento:** generare un `gameSeed` quando nasce il fondo e salvarlo nello
stato. Questo mantiene la riproducibilita del save, ma varia le partite.

### P1 - Random non riproducibile per DD e negoziazione

Due diligence e negoziazione usano `Math.random()`, mentre il dealflow usa un
generatore deterministico.

**Effetto:** ricaricamenti o percorsi equivalenti possono avere risultati non
riproducibili.

**Suggerimento:** usare il `gameSeed` anche per queste decisioni e registrare
immediatamente gli esiti nello stato.

### P1 - Mancano follow-on e riserve

Il copy e alcune LP call parlano di follow-on, ma il giocatore non puo farli.

**Spunto:** a partire dall'anno successivo all'investimento, mostrare una pagina
di follow-on con tre opzioni:

- pro-rata;
- raddoppio della posizione;
- nessun follow-on con diluizione.

Questo renderebbe reale il tema della gestione delle riserve.

### P1 - Write-off citati ma non implementati

Alcune scelte LP dichiarano un possibile write-off etico, ma nessun effetto
finanziario viene applicato.

**Suggerimento:** centralizzare gli effetti in funzioni del motore, evitando
testi che promettono azioni non eseguite.

## Problemi di qualita e manutenzione

### P2 - Nessun repository Git

La cartella non e un repository Git.

**Conseguenze**

- nessuna cronologia;
- nessun rollback semplice;
- difficile confrontare esperimenti di bilanciamento;
- impossibile collegare modifiche e verifiche.

**Primo passo consigliato:** inizializzare Git prima di modificare il gameplay.

### P2 - Nessun test automatico

Non esiste una suite di test o un `package.json`.

**Test minimi consigliati**

- nuova partita e valori iniziali;
- tre startup diverse per anno;
- investimento e riduzione cash;
- impossibilita di investire oltre il cash disponibile;
- deal investito o passato non piu visibile;
- chiusura anno applicata una sola volta;
- calcolo MOIC e DPI;
- exit e write-off;
- trigger e consumo delle LP call;
- salvataggio e caricamento compatibili;
- protezione delle pagine fuori sequenza.

Non e necessario migrare a un framework frontend. E sufficiente introdurre un
runner leggero per testare le funzioni del motore.

### P2 - Validazione debole dei salvataggi importati

L'import verifica soltanto che il contenuto sia JSON valido.

**Rischio:** un save incompleto o manipolato puo produrre errori in pagine che
si aspettano campi e strutture specifiche.

**Suggerimento:** validare versione, tipi e valori essenziali; aggiungere una
funzione di migrazione per versioni future.

### P2 - Versione dello stato ferma a 1 senza migrazioni

`version` esiste, ma il caricamento usa solo `Object.assign`.

**Suggerimento:** introdurre `migrateState(data)` prima che il formato venga
esteso con exit, follow-on e seed.

### P2 - Alcuni campi dello stato sono inutilizzati

Campi da verificare o rimuovere:

- `publishedNews`;
- `pendingLPCalls`;
- `pendingICEvents`;
- `quarter`.

`readPages` viene scritto ma non ancora consumato.

### P2 - Commenti non aggiornati

Alcuni file parlano ancora di scheletro Sprint 3 o di future sostituzioni,
nonostante il market engine sia gia collegato.

**Suggerimento:** aggiornare i commenti dopo la stabilizzazione del game loop,
cosi che descrivano il comportamento corrente.

### P2 - Dipendenza esterna dal font Google

Il gioco carica VT323 da Google Fonts.

**Rischio:** offline, privacy blocker o problemi di rete cambiano l'aspetto.

**Suggerimento:** valutare il font locale per un deploy completamente statico.

### P2 - Assenza di README operativo

Il brief descrive il prodotto, ma manca una guida tecnica breve.

Il README dovrebbe spiegare:

- come avviare il server locale;
- struttura delle cartelle;
- flusso delle pagine;
- struttura dello stato;
- come aggiungere startup e news;
- come eseguire i test;
- come pubblicare su GitHub Pages.

## Spunti di design

### Rendere la lettura delle news parte del gioco

Il punto piu originale e il rapporto fra Televideo e decisioni VC. Conviene
costruire il gameplay attorno a questo elemento.

Possibile ciclo:

1. Le news mostrano segnali incompleti.
2. La DD conferma o smentisce una parte del segnale.
3. L'investimento espone il fondo alle conseguenze future.
4. L'IC spiega quali segnali hanno influenzato il risultato.
5. Il report finale evidenzia news decisive lette e ignorate.

### Rendere comprensibile il motore

Il motore contiene gia una buona granularita, ma il giocatore vede soprattutto
il risultato percentuale.

Si possono mostrare spiegazioni sintetiche:

```text
+18% trend settore
-8% founder risk
+5% unit economics
```

Questo mantiene la sorpresa ma rende il gioco educativo e meno arbitrario.

### Creare veri trade-off di portfolio

Possibili vincoli:

- massimo numero di nuove posizioni all'anno;
- riserva minima consigliata;
- concentrazione settoriale;
- ticket iniziale contro follow-on;
- reputazione necessaria per accedere ai deal migliori;
- LP con preferenze incompatibili.

### Migliorare il finale

Oltre allo score:

- miglior investimento;
- peggior investimento;
- occasione persa;
- news decisiva ignorata;
- concentrazione per settore;
- capitale non investito;
- exit realizzate;
- costo totale di DD;
- titolo ironico;
- testo condivisibile.

### Bilanciamento

Una volta completati i meccanismi, simulare molte partite con strategie diverse:

- investire sempre 1M;
- investire sempre 5M;
- seguire solo hype;
- seguire solo unit economics;
- fare sempre DD;
- non fare mai DD;
- concentrazione settoriale;
- diversificazione.

L'obiettivo e evitare una strategia dominante e controllare la distribuzione
degli score finali.

## Roadmap proposta

### Fase 0 - Mettere in sicurezza il lavoro

- Inizializzare Git.
- Creare README.
- Aggiungere test minimi del motore.
- Conservare questo documento come checklist.

### Fase 1 - Correggere il ciclo annuale

- Correggere lo stato delle startup nel dealflow.
- Impedire investimenti duplicati.
- Definire quando un anno puo essere chiuso.
- Proteggere le pagine fuori sequenza.
- Registrare le decisioni annuali nella history.

### Fase 2 - Completare l'economia del fondo

- Scegliere il modello valuation/equity.
- Implementare exit.
- Implementare write-off.
- Implementare follow-on e diluizione.
- Aggiornare MOIC, DPI e report.

### Fase 3 - Collegare informazioni e decisioni

- Rendere utile `readPages`.
- Eliminare o implementare `publishedNews`.
- Collegare news, DD e spiegazione dei risultati.
- Aggiungere un seed di partita.

### Fase 4 - Bilanciamento e UX

- Simulare strategie automatiche.
- Rivedere probabilita e punteggi.
- Verificare overflow delle pagine.
- Testare desktop e mobile.
- Testare solo tastiera e accessibilita di base.

### Fase 5 - Pubblicazione MVP

- Font locale o fallback verificato.
- Metadata social e favicon.
- Deploy su GitHub Pages.
- Smoke test su browser principali.
- Raccolta feedback.
- Solo successivamente valutare leaderboard remota.

## Criteri per considerare pronto l'MVP

- Nessuna startup puo essere deliberata due volte nello stesso anno.
- Non si puo saltare accidentalmente il ciclo di gioco.
- Ogni metrica mostrata e influenzabile dal giocatore.
- DPI puo diventare maggiore di zero.
- La valuation negoziata cambia realmente il risultato.
- Exit e write-off sono visibili e spiegati.
- Il save sopravvive a refresh e aggiornamenti compatibili.
- Le cinque annualita possono essere completate senza errori.
- Esistono test automatici per il motore e lo scoring.
- Il gioco e verificato in un browser reale usando soltanto la tastiera.
- Il report finale racconta in modo comprensibile le conseguenze delle scelte.

## Ordine suggerito per il prossimo intervento

Il primo intervento dovrebbe limitarsi a:

1. inizializzazione Git;
2. test del ciclo dealflow;
3. correzione delle startup investite o passate che ricompaiono;
4. regola esplicita per la chiusura dell'anno.

Solo dopo conviene introdurre exit e follow-on, perche dipendono da uno stato
annuale affidabile.
