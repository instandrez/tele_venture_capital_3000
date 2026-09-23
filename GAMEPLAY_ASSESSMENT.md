# VC3000 — assessment e revisione della giocabilità

Revisione del 23 settembre 2026, sulla base del commit `8278d55`.

## Il criterio: voglio fare un altro deal?

Il punto forte è l'incontro tra tre cose: il Televideo come strumento d'indagine,
il founder come avversario riconoscibile, il capitale come posta in gioco.
Il gesto interessante è **scoprire una contraddizione, usarla nella call,
decidere se credere ancora al founder e vedere cosa succede**.

La versione precedente aveva già personaggi, battute, pixel art e un mondo
coerente. Il limite maggiore era il ritmo: troppo tempo tra un'intenzione e
la possibilità di agire di nuovo. Aggiungere altre schermate o altre metriche
avrebbe amplificato quel problema. Questa revisione concentra il lavoro su
ritmo, chiarezza, scelte con conseguenze e voglia di riprovare.

## Diagnosi e interventi

| Area | Problema rilevato | Intervento realizzato | Effetto cercato |
|---|---|---|---|
| Primo minuto | Nove scene introduttive e ritorno all'indice prima di agire | Quattro scene, circa 15,5 secondi prima della schermata finale; skip sempre disponibile; ingresso diretto nel percorso di gioco | Far incontrare presto il primo founder |
| Battle | Una domanda poteva richiedere più conferme intermedie, drenaggi e note obbligatorie | Due brevi passaggi visivi; il risultato resta fermo mentre tornano disponibili le scelte | Una domanda, una risposta, una nuova decisione |
| Lettura | Pitch e note spezzavano lo scambio | Archivio facoltativo «Pitch e appunti»; risposta, danno e prossima minaccia nello stesso scambio | Tenere il dialogo vivo senza perdere informazioni |
| Indagine | Il salto fra news, fonti, indice e startup richiedeva memoria dei numeri | «Segui una pista», ritorno all'incontro e «Riprendi il filo»; restano i numeri Televideo | La curiosità conduce al prossimo gesto |
| Difficoltà | Tre ricerche economiche si potevano acquistare tutte, quasi senza scelta | Due controlli per deal fra DD, reference e co-invest; news gratuite | Preparazione con una piccola rinuncia, spiegata sullo schermo |
| Equità | La domanda suggerita dal dossier poteva coincidere con una parata dannosa | La prova armata supera la parata; indizi trovati dopo l'ingresso aiutano senza rigenerare scudi consumati | Premiare un'intuizione comprensibile |
| Suspense | Note e fonti potevano anticipare data ed esito delle exit; il memo giudicava con informazioni future | Osservazioni e indiscrezioni, senza leggere il futuro; memo su prove, prezzo e concentrazione | Lasciare tensione fino al risultato |
| Conseguenze | Contattare una fonte poteva imporre il segno del rendimento | Il mondo economico evolve allo stesso modo con o senza lettura | L'indagine migliora la scelta, non altera la realtà |
| Interruzioni | Telefonate delle partecipate ripetute dopo molte battle | Massimo una proposta all'anno in Quick e due in Partner, rispettando quelle già salvate | Le chiamate restano eventi, non una tassa sul ritmo |
| Fine anno | Avanzamento automatico e costo delle LP call facile da perdere | Chiusura esplicita, costo visibile, recap completo da confermare | Attesa del verdetto e conseguenze leggibili |
| Rendimento | Hype tardivo quasi immune al decadimento, somma eccessiva di news, sovrapprezzo non penalizzato | Fondamentali più incisivi, hype fragile già al primo mark, contesto limitato, prezzo post-money, premio exit legato al periodo di detenzione | Scelte difficili da ottimizzare alla cieca |
| Rigiocabilità | Nuova partita senza confronto diretto con la scelta precedente | Rivincita con stesso seed e modalità, seed nella share card | «Questa volta quel deal lo passo» |
| Affidabilità | ESC/reload durante un'animazione poteva eludere conseguenze; timer potevano finire nella battle successiva | Turno e decisione salvati prima delle animazioni, memo idempotenti, timer cancellabili | Nessuna frustrazione da stato incoerente |
| Fruizione | Testo oltre 30 righe tagliato, numeri narrativi trasformati in comandi, ridisegno periodico della battle | Testo scorrevole, comandi espliciti nelle scene, idle in CSS; layout mobile in flusso e tasti più grandi | Leggere e toccare senza combattere l'interfaccia |

## Direzione comica e atmosfera

La sigla introduce New Milan 3000: Internet è un pitch deck a pagamento,
l'informazione libera sopravvive sul Televideo, gli LP hanno ancora WhatsApp.
La battuta presenta il mondo e porta all'azione. Le reazioni dei founder e
gli attacchi per archetipo restano il centro della comicità della battle.

I nuovi memo distinguono una sala persa da un cattivo investimento:
«Il founder ha vinto la call. Non significa che abbia un business».
Un round rifiutato risponde: «Ultimo slot? Curioso: il prezzo ha appena trovato
spazio». Il bersaglio è il comportamento dell'ecosistema, più che una lista
di buzzword. Passare deve poter essere una scelta soddisfacente.

Il richiamo Pokémon vive nella domanda efficace, nella parata, nella prova
speciale e nella reazione visibile. Il richiamo all'avventura comica vive
negli indizi, nelle fonti e nel sottotesto del dialogo. Non ho aggiunto una
seconda economia, alberi di abilità o altre attività obbligatorie.

## Regole economiche attuali

- Restano 100M di commitments, 10M di fee iniziali, 90M investibili; entrambe
  le modalità durano tre anni, con tre o cinque deal annuali.
- Il mark di ingresso usa `(ask + ticket) / (prezzo pagato + ticket)`, limitato
  fra 0,05x e 1,5x: anche pagare troppo ha un effetto.
- Gli unit economics contribuiscono al mark annuale con un coefficiente 0,30.
  L'hype alto senza traction decade già nel primo anno di investimento.
- Il contributo aggregato delle news di contesto è limitato a −45% / +40%;
  gli eventi specifici del founder restano separati. Si applicano solo news
  pubblicate entro l'anno corrente e con materializzazione in quell'anno.
- L'incertezza di esecuzione è circa ±10 punti percentuali, deterministica
  per seed, startup e anno. Ricaricare non cambia il risultato.
- La parte del premio di exit sopra 1x matura per un terzo per ogni anno
  detenuto, fino al premio pieno. Write-off e tagli conservano la severità.
- «Fondo» nel report è `(cassa + realizzato + NAV attivo) / commitments`:
  include le fee e il valore ancora sulla carta. Non è il solo cash restituito.
- Punteggio: 20% MOIC, 15% rendimento dell'intero fondo, 15% DPI, 15% LP,
  10% reputazione, 10% impatto, 15% deployment. Target di deployment finale
  coerente con i suggerimenti annuali: 54M Quick, 72M Partner.

## Verifiche effettuate

`node tests/run.js`: **92 test superati**.

`node tests/gameplay.js`: **24 regressioni superate**, incluse partite complete
Quick e Partner attraverso router, battle, investimenti, telefonate, follow-on,
chiusure annuali, finale e rivincita. Il DOM è simulato: questi test verificano
logica e flussi, non dimostrano che il layout sia bello o che il gioco diverta.

`node tests/balance.js 300`: **1.800 scenari economici** su seed 1000–1299,
tre strategie in ciascuna modalità. La tabella riporta il valore finale
dell'intero fondo, inclusa la liquidità non investita e il NAV non realizzato.

| Modalità | Strategia automatica | Fondo mediano | Sotto 1x | Fondo almeno 2x |
|---|---|---:|---:|---:|
| Quick | Compra tutto | 0,92x | 69,0% | 0% |
| Quick | Compra hype ≥ 7 | 1,04x | 40,7% | 0% |
| Quick | Legge, vince la battle e seleziona | 1,50x | 0% | 0% |
| Partner | Compra tutto | 1,11x | 29,0% | 0,3% |
| Partner | Compra hype ≥ 7 | 1,03x | 43,7% | 0% |
| Partner | Legge, vince la battle e seleziona | 1,88x | 0% | 26,0% |

La strategia informata legge tutti i ritagli rilevanti, paga reference e DD,
usa le mosse efficaci e seleziona con unit economics, traction/fit e momentum.
Non consulta le exit. Usa il ticket preset massimo e il prezzo ottenibile
dalla battle. Le altre strategie comprano al prezzo richiesto, alzandolo
del 12% in caso di rifiuto. Sono esclusi follow-on, telefonate e catalyst
post-battle per isolare selezione, prezzo e mercato. Il deployment differisce:
il benchmark confronta politiche complete, non misura il solo effetto delle news.

Questi numeri sono un controllo contro strategie dominanti banali, **non tassi
di vittoria umani né una prova del divertimento**. L'operatore informato è
ideale; il 2x sul fondo è una soglia di confronto, non una condizione obbligatoria
per completare il gioco. La simulazione non è una rappresentazione del VC reale.

## Cosa resta da validare giocando

L'ispezione del sito pubblico riguarda la versione originale. Il browser
disponibile non ha potuto aprire la build locale; una successiva interazione
è stata rifiutata dal controllo automatico per limite d'uso. Non rivendico
quindi un playtest visivo della nuova build su desktop o telefono.

Prima di promuovere la versione pubblica:

1. Aprire il branch con `python -m http.server 5173` e completare una Quick
   sia con mouse/tastiera sia a 390×844 e 844×390 con touch.
2. Verificare che HUD, testo lungo, archivio, comandi e memo siano raggiungibili;
   controllare anche il focus da tastiera e la modalità movimento ridotto.
3. Far giocare 5–8 persone dell'ecosistema senza spiegarle a voce. Osservare
   dove si fermano, cosa credono facciano le mosse e se distinguono una buona
   battle da un buon investimento.
4. Chiedere «quale scelta rifaresti?» e osservare se avviano spontaneamente
   una seconda run. Obiettivi iniziali da verificare: primo deal deciso entro
   due minuti, Quick intorno a 10–15 minuti, nessuna assistenza per chiudere l'anno.

La variabilità narrativa resta il limite successivo: sei archetipi diventano
riconoscibili, molte exit sono ancora scriptate e il seed cambia soprattutto
il percorso. Il prossimo investimento creativo dovrebbe essere dialoghi
contestuali e richiami alle scelte precedenti, dopo aver osservato i playtest.
Prima di aggiungere contenuti, verificare che questo ciclo inviti a riprovare.

## Come provare la revisione

Branch: `codex/gameplay-signal-and-rhythm`. Nessuna dipendenza o build:

```sh
git checkout codex/gameplay-signal-and-rhythm
python -m http.server 5173
```

Aprire `http://localhost:5173`. I salvataggi precedenti vengono migrati alla
versione 8; le posizioni esistenti rimangono, i prossimi anni seguono le regole
aggiornate. Per valutare il nuovo equilibrio partire da una nuova run. I vecchi
punteggi della classifica locale non sono direttamente confrontabili.
