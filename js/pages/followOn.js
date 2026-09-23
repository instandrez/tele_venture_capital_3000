/* Pagina 450 — Follow-on round.
   A fine anno (dopo la delibera del dealflow) alcune
   posizioni in crescita rilanciano un round. Il GP sceglie:

   1 PRO-RATA    — investe il 50% del ticket originale al prezzo
                   corrente: mantiene la quota, il multiplo si
                   ridetermina come media ponderata (blended).
   2 RADDOPPIA   — come sopra ma con importo doppio: più esposizione
                   sul vincitore (o sul presunto tale).
   9 RINUNCIA    — nessun esborso, ma diluizione: il valore della
                   posizione scende del 15%.

   Le offerte sono deterministiche per partita (TVState.roll). */
(function (global) {

  function offersForYear(s) {
    if (!s.followOnCache) s.followOnCache = {};
    const key = "y" + s.year;
    if (!s.followOnCache[key]) {
      const eligible = s.portfolio.filter(p =>
        (!p.status || p.status === "active") &&
        p.entryYear < s.year
      ).sort((a, b) => (b.currentValueMultiplier || 1) - (a.currentValueMultiplier || 1));
      let candidates = eligible.filter(p =>
        p.currentValueMultiplier >= 1.15 &&
        TVState.roll("fo|" + p.id + "|" + s.year) < 0.6
      ).slice(0, 2);
      if (!candidates.length && eligible.length) {
        candidates = eligible.filter(p => (p.currentValueMultiplier || 1) >= 0.95).slice(0, 1);
        if (!candidates.length) candidates = eligible.slice(0, 1);
      }
      s.followOnCache[key] = candidates.map(p => ({
        id: p.id, name: p.name,
        cost: Math.max(500_000, Math.round(p.investedAmount * 0.5)),
        status: "pending"
      }));
      TVState.save();
    }
    return s.followOnCache[key];
  }

  function nextPending(s) {
    return offersForYear(s).find(o => o.status === "pending") || null;
  }

  function renderClose(pageNum, s) {
    const r = TVRender;
    const calls = TVLPCalls.pickCallsForYear(s);
    const m = TVScoring.computeMetrics(s);
    const lines = [
      r.bg("bg-yellow", "  CHIUSURA ANNO " + s.year + " // ULTIMO CONTROLLO"), "",
      " " + r.color("c-white", "Il mercato sta per correggere il tuo PowerPoint."), "",
      " " + r.color("c-cyan", "Investito " + r.eur(s.invested) + " // Cash " + r.eur(s.cash)),
      " " + r.color("c-white", "MOIC " + m.moic.toFixed(2) + "x // DPI " + m.dpi.toFixed(2) + "x"), "",
      " " + r.color(calls.length ? "c-yellow" : "c-green", calls.length
        ? calls.length + " LP call aperte: chiudere costa -6 satisfaction per call."
        : "LP aggiornati. Il telefono tace. Per ora."), "",
      '<button type="button" class="run-next" data-action="1">1 CHIUDI ANNO E SCOPRI I RISULTATI</button>',
      calls.length ? '<button type="button" class="run-next" data-action="2">2 RISPONDI PRIMA AGLI LP</button>' : "",
      r.color("c-white", " 400 PORTFOLIO    100 HOME")
    ];
    r.show(pageNum, lines.join("\n"), { title: "CHIUSURA ANNO", directAction: true });
    let closed = false;
    TVRouter.setActionHandler(num => {
      if (num === 2 && calls.length) { TVRouter.goto(600, { skipLoading: true }); return; }
      if (num !== 1 || closed || s.gameOver) return;
      closed = true;
      TVYearEnd.routeAfterClose(s);
    });
  }

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }
    if (s.gameOver) { TVRouter.goto(700, { skipLoading: true }); return; }
    if (TVDealflow.pendingDeals(s).length > 0) {
      TVRouter.flash("PRIMA DELIBERA IL DEALFLOW");
      TVRouter.goto(200, { skipLoading: true });
      return;
    }
    const incident = global.TVPortfolioIncidents &&
      TVPortfolioIncidents.activeIncident(s);
    if (incident) {
      TVRouter.flash("PORTFOLIO COMPANY IN LINEA");
      TVRouter.goto(620, { skipLoading: true });
      return;
    }

    const offer = nextPending(s);
    if (!offer) {
      renderClose(pageNum, s);
      return;
    }
    const pos = s.portfolio.find(p => p.id === offer.id);
    if (!pos) { offer.status = "done"; TVState.save(); render(pageNum); return; }

    const lines = [];
    lines.push(r.bg("bg-green", "  " + r.pad("FOLLOW-ON — ANNO " + s.year, 38)));
    lines.push("");
    lines.push(" " + r.color("c-yellow", pos.name) + r.color("c-white", " sta rilanciando un round."));
    lines.push("");
    lines.push(" " + r.color("c-white", "ticket originale:  " + r.eur(pos.investedAmount)));
    lines.push(" " + r.color("c-white", "multiplo attuale:  ") +
               r.color(pos.currentValueMultiplier >= 1 ? "c-green" : "c-red",
                       pos.currentValueMultiplier.toFixed(2) + "x"));
    lines.push(" " + r.color("c-white", "valore posizione:  " +
               r.eur(pos.investedAmount * pos.currentValueMultiplier)));
    lines.push("");
    lines.push(r.bg("bg-magenta", "  OPZIONI                               "));
    lines.push(" " + r.color("c-yellow", "1") + " pro-rata        -" + r.eur(offer.cost));
    lines.push(" " + r.color("c-yellow", "2") + " raddoppia       -" + r.eur(offer.cost * 2));
    lines.push(" " + r.color("c-yellow", "9") + " rinuncia        diluizione -15%");
    lines.push("");
    lines.push(" " + r.color("c-green", "Cash " + r.eur(s.cash)));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " il round si chiude ora: decidi"));

    r.show(pageNum, lines.join("\n"), { title: "FOLLOW-ON" });

    TVRouter.setActionHandler(num => {
      if (offer.status !== "pending") return;
      function investMore(amount) {
        if (s.cash < amount) {
          TVAudio.error();
          TVRouter.flash("CASH INSUFFICIENTE");
          return false;
        }
        // blended multiple: il nuovo capitale entra al prezzo corrente
        const oldValue = pos.investedAmount * pos.currentValueMultiplier;
        pos.currentValueMultiplier = (oldValue + amount) / (pos.investedAmount + amount);
        pos.investedAmount += amount;
        s.cash -= amount;
        s.invested += amount;
        s.history.push({ year: s.year, type: "followon", startup: pos.name, amount: amount });
        return true;
      }

      if (num === 1) {
        if (!investMore(offer.cost)) return;
        offer.status = "done";
        TVState.save();
        TVAudio.success();
        TVRouter.flash("PRO-RATA " + r.eur(offer.cost));
        render(pageNum);
      } else if (num === 2) {
        if (!investMore(offer.cost * 2)) return;
        offer.status = "done";
        TVState.save();
        TVAudio.success();
        TVRouter.flash("RADDOPPIO " + r.eur(offer.cost * 2));
        render(pageNum);
      } else if (num === 9) {
        pos.currentValueMultiplier *= 0.85;
        offer.status = "done";
        s.history.push({ year: s.year, type: "diluted", startup: pos.name });
        TVState.save();
        TVAudio.pageChange();
        TVRouter.flash("DILUITO -15%");
        render(pageNum);
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[450] = { render };
})(window);
