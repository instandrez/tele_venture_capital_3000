/* Pagina 140 — Borsa & Indici Settoriali.
   Tabella ispirata al Televideo finanziario classico:
   nome indice, valore, variazione %, segnale. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const s = TVState.current || {};
    const year = s.year || 1;
    const yearIdx = Math.min(year, 5) - 1;
    const width = r.COLS - 2;

    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("BORSA & INDICI — ANNO " + year, width)));
    lines.push("");
    lines.push(" " + r.color("c-white", r.pad("INDICE", 28) + r.pad("YTD%", 9) + r.pad("SEGN.", 8) + "TREND"));
    lines.push(" " + r.color("c-blue", "─".repeat(width)));

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
        r.color(idx.color, r.pad(name, 28)) +
        r.color(sig.cls, r.pad(pctStr, 9)) +
        r.color(sig.cls, r.pad(sig.txt, 8)) +
        r.color(sig.cls, sig.sym)
      );
    });

    lines.push("");
    lines.push(" " + r.color("c-yellow", "news settore:"));
    const newsInSection = TVNews.listSection(140, year);
    newsInSection.slice(0, 2).forEach(n => {
      const intel = TVIntel.pageStatus(s, n.page);
      lines.push(" " + r.color("c-cyan", String(n.page)) + " " +
        r.color("c-white", n.headline.slice(0, 41)) + " " +
        r.color(intel.read ? "c-green" : "c-yellow", intel.read ? "[L]" : "[?]"));
    });

    while (lines.length < 19) lines.push("");
    lines.push(r.color("c-white", " 100 HOME    200 DEALFLOW    400 PORTFOLIO"));

    r.show(pageNum, lines.join("\n"), { title: "BORSA & INDICI" });
  }

  function renderNewsDetail(pageNum) {
    const r = TVRender;
    const news = TVNews.byPage(pageNum);
    if (!news) { TVRouter.goto(140, { skipLoading: true }); return; }
    const width = r.COLS - 2;
    const lines = [];
    lines.push(r.bg("bg-cyan", "  " + r.pad("BORSA — ANNO " + news.year, width)));
    lines.push("");
    lines.push(r.color("c-yellow", " " + news.headline));
    lines.push(r.color("c-white", " " + "─".repeat(width)));
    lines.push("");
    news.body.forEach(l => lines.push(" " + r.color("c-white", l)));
    const intel = TVIntel.pageStatus(TVState.current, pageNum);
    const fingerprint = TVIntel.newsFingerprint(news);
    lines.push("");
    if (fingerprint) {
      lines.push(" " + r.color("c-yellow", "FIRMA: " + fingerprint.kind) +
        r.color("c-white", " - " + fingerprint.description));
    }
    if (intel.deals.length) {
      lines.push(" " + r.color("c-green", "RITAGLIO ARCHIVIATO A PAG 190."));
      lines.push(" " + r.color("c-cyan", "Il taccuino non dice ancora perche'."));
    } else {
      lines.push(" " + r.color("c-magenta", "IL TACCUINO RESTA IN SILENZIO."));
    }
    const unlocked = TVIntel.unlockedSourcesForPage(TVState.current, pageNum);
    if (unlocked.length) {
      lines.push(" " + r.color("c-magenta",
        "DUE FIRME COMBACIANO. INTERNO " + unlocked[0].chain.page + "."));
    }
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
