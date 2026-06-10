/* Pagina 140 — Borsa & Indici Settoriali.
   Tabella ispirata al Televideo finanziario classico:
   nome indice, valore, variazione %, segnale. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current || {};
    const year = s.year || 1;
    const yearIdx = Math.min(year, 5) - 1;

    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("BORSA & INDICI — ANNO " + year, 38)));
    lines.push("");
    lines.push(" " + r.color("c-white", r.pad("INDICE", 18) + r.pad("YTD%", 8) + r.pad("SEGN.", 6) + "TREND"));
    lines.push(" " + r.color("c-blue", "─".repeat(38)));

    Object.keys(TVSectors.SECTOR_INDICES).forEach(key => {
      const idx = TVSectors.SECTOR_INDICES[key];
      // valore "live": include i signal già pubblicati nell'anno corrente
      const pct = (typeof TVMarket !== "undefined")
        ? TVMarket.liveSectorIndex(key, year)
        : (idx.base[yearIdx] || 0);
      const sig = TVSectors.signal(pct);
      const pctStr = (pct >= 0 ? "+" : "") + pct + "%";
      const name = idx.name.replace("INDICE ", "");
      lines.push(
        " " +
        r.color(idx.color, r.pad(name, 18)) +
        r.color(sig.cls, r.pad(pctStr, 8)) +
        r.color(sig.cls, r.pad(sig.txt, 6)) +
        r.color(sig.cls, sig.sym)
      );
    });

    lines.push("");
    lines.push(" " + r.color("c-yellow", "news settore:"));
    const newsInSection = TVNews.listSection(140, year);
    newsInSection.slice(0, 2).forEach(n => {
      lines.push(" " + r.color("c-cyan", String(n.page)) + " " + r.color("c-white", n.headline.slice(0, 32)));
    });

    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 100 HOME    200 DEALFLOW    400 PORTFOLIO"));

    r.show(pageNum, lines.join("\n"), { title: "BORSA & INDICI" });
  }

  function renderNewsDetail(pageNum) {
    const r = TVRender;
    const news = TVNews.byPage(pageNum);
    if (!news) { TVRouter.goto(140, { skipLoading: true }); return; }
    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("BORSA — ANNO " + news.year, 38)));
    lines.push("");
    lines.push(r.color("c-yellow", " " + news.headline));
    lines.push(r.color("c-white", " " + "─".repeat(38)));
    lines.push("");
    news.body.forEach(l => lines.push(" " + r.color("c-white", l)));
    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 140 INDICI    100 HOME"));
    r.show(pageNum, lines.join("\n"), { title: "BORSA & INDICI" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[140] = { render };
  // registra dinamicamente le news Borsa cross-anno
  TVNews.NEWS.forEach(n => {
    if (n.section === 140) P[n.page] = { render: renderNewsDetail };
  });
})(window);
