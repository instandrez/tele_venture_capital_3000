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
      const candidates = s.portfolio.filter(p =>
        (!p.status || p.status === "active") &&
        p.entryYear < s.year &&
        p.currentValueMultiplier >= 1.15 &&
        TVState.roll("fo|" + p.id + "|" + s.year) < 0.6
      ).slice(0, 2);
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

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current;
    if (!s || !s.gameStarted) { TVRouter.goto(101, { skipLoading: true }); return; }
    if (TVDealflow.pendingDeals(s).length > 0) {
      TVRouter.flash("PRIMA DELIBERA IL DEALFLOW");
      TVRouter.goto(200, { skipLoading: true });
      return;
    }

    const offer = nextPending(s);
    if (!offer) {
      TVYearEnd.routeAfterClose(s);
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
        setTimeout(() => render(pageNum), 400);
      } else if (num === 2) {
        if (!investMore(offer.cost * 2)) return;
        offer.status = "done";
        TVState.save();
        TVAudio.success();
        TVRouter.flash("RADDOPPIO " + r.eur(offer.cost * 2));
        setTimeout(() => render(pageNum), 400);
      } else if (num === 9) {
        pos.currentValueMultiplier *= 0.85;
        offer.status = "done";
        s.history.push({ year: s.year, type: "diluted", startup: pos.name });
        TVState.save();
        TVAudio.pageChange();
        TVRouter.flash("DILUITO -15%");
        setTimeout(() => render(pageNum), 400);
      }
    });
  }

  const P = global.TVPages = global.TVPages || {};
  P[450] = { render };
})(window);
