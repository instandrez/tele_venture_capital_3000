/* Pagina 500 - redirect legacy.
   IC Moment non e' piu' una schermata giocata: il fine anno si chiude
   automaticamente dopo dealflow/follow-on. Questa pagina resta solo per
   save vecchi o utenti che digitano 500 a mano. */
(function (global) {

  function render() {
    const s = TVState.current;
    if (!s || !s.gameStarted) {
      TVRouter.goto(101, { skipLoading: true });
      return;
    }

    if (TVDealflow.pendingDeals(s).length > 0) {
      TVRouter.flash("PRIMA DELIBERA IL DEALFLOW");
      TVRouter.goto(200, { skipLoading: true });
      return;
    }

    TVYearEnd.routeAfterClose(s);
  }

  const P = global.TVPages = global.TVPages || {};
  P[500] = { render };
})(window);
