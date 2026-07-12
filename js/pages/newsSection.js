/* Pagine sezione news (110, 120, 160, 180): mostrano la lista delle
   news pubblicate fino all'anno corrente. Cliccando il numero pagina
   relativo (es. 121, 122...) si apre il dettaglio. */
(function (global) {
  const PUBLIC_SEASON_MAX_YEAR = 3;

  const SECTION_META = {
    110: { title: "ULTIM'ORA",        bg: "bg-red",     accent: "c-red"     },
    120: { title: "POLITICA",         bg: "bg-blue",    accent: "c-yellow"  },
    160: { title: "CRONACA STARTUP",  bg: "bg-magenta", accent: "c-magenta" },
    180: { title: "CORPORATE WATCH",  bg: "bg-yellow",  accent: "c-yellow"  }
  };

  function wrapText(text, width) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const out = [];
    let cur = "";
    words.forEach(word => {
      const next = cur ? cur + " " + word : word;
      if (next.length > width && cur) {
        out.push(cur);
        cur = word;
      } else {
        cur = next;
      }
    });
    if (cur) out.push(cur);
    return out.length ? out : [""];
  }

  function pushWrapped(lines, prefix, text, width, cls) {
    wrapText(text, width).forEach((line, idx) => {
      lines.push(prefix(idx) + TVRender.color(cls || "c-white", line));
    });
  }

  function newsRow(page, line, extraClass) {
    return '<button type="button" class="news-link-row' +
      (extraClass ? " " + extraClass : "") +
      '" data-page="' + page + '">' + line + '</button>';
  }

  function renderList(sectionRoot) {
    return function render(pageNum) {
      const r = TVRender;
      const s = TVState.current || {};
      const year = s.year || 1;
      const meta = SECTION_META[sectionRoot];
      const items = TVIntel.newsForCurrentDealflow
        ? TVIntel.newsForCurrentDealflow(s, sectionRoot)
        : TVNews.listSection(sectionRoot, year);
      const width = r.COLS - 2;

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " — ANNO " + year, width)));
      lines.push("");

      if (items.length === 0) {
        lines.push("");
        lines.push(r.center(r.color("c-white", "nessuna news utile al dealflow.")));
        lines.push(r.center(r.color("c-white", "torna dopo il prossimo round.")));
      } else {
        items.forEach((n, i) => {
          const intel = TVIntel.pageStatus(s, n.page);
          const tag = n.tone === "ironic" ? r.color("c-yellow", "[!]") :
                      n.tone === "gossip" ? r.color("c-magenta", "[~]") :
                                            r.color("c-cyan",   "[·]");
          const num = r.color(meta.accent, String(n.page));
          const maxTitle = r.COLS - 13;
          const title = r.escape(n.headline.length > maxTitle
            ? n.headline.slice(0, maxTitle) + "…" : n.headline);
          if (sectionRoot === 110) {
            // Ultim'Ora: tag lampeggiante "NEW" davanti, titolo fisso e leggibile
            lines.push(" " + num + " " + '<span class="blink c-red">NEW</span> ' + r.color("c-white", title));
          } else {
            lines.push(" " + num + "  " + tag + " " + title);
          }
          const status = intel.read
            ? r.color("c-green", "[LETTA]")
            : r.color("c-white", "[NON LETTA]");
          lines.push("      " + status);
        });
      }

      // hint navigazione
      while (lines.length < 18) lines.push("");
      lines.push(r.color("c-white", " 100 HOME    200 DEALFLOW    400 PORTFOLIO"));

      r.show(pageNum, lines.join("\n"), { title: meta.title });
    };
  }

  function renderDetail() {
    return function render(pageNum) {
      const r = TVRender;
      const news = TVNews.byPage(pageNum);
      if (!news) {
        // pagina non esiste → fallback su lista
        const root = Math.floor(pageNum / 10) * 10;
        const sectionRoot = Math.floor(pageNum / 20) === 5 ? 100 : Math.floor(pageNum / 20) * 20;
        // semplifica: torna a home
        TVRouter.goto(100, { skipLoading: true });
        return;
      }
      const sectionRoot = news.section;
      const meta = SECTION_META[sectionRoot] || { title: "NEWS", bg: "bg-blue", accent: "c-yellow" };
      const width = r.COLS - 2;

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " — ANNO " + news.year, width)));
      lines.push("");
      lines.push(r.color(meta.accent, " " + news.headline));
      lines.push(r.color("c-white", " " + "─".repeat(width)));
      lines.push("");
      news.body.forEach(line => {
        lines.push(" " + r.color("c-white", line));
      });
      const intel = TVIntel.pageStatus(TVState.current, pageNum);
      const fingerprint = TVIntel.newsFingerprint(news);
      lines.push("");
      if (fingerprint) {
        lines.push(" " + r.color("c-yellow", "FIRMA: " + fingerprint.kind) +
          r.color("c-white", " - " + fingerprint.description));
      }
      if (intel.deals.length) {
        lines.push(" " + r.color("c-green", "RITAGLIO ARCHIVIATO A PAG 190."));
        lines.push(" " + r.color("c-cyan", "Incrocialo con una fonte di tipo diverso."));
      } else {
        lines.push(" " + r.color("c-magenta", "IL TACCUINO RESTA IN SILENZIO."));
      }
      const unlocked = TVIntel.unlockedSourcesForPage(TVState.current, pageNum);
      if (unlocked.length) {
        lines.push(" " + r.color("c-magenta",
          "FONTE RISERVATA SBLOCCATA: " + unlocked[0].chain.page + "."));
      }

      while (lines.length < 19) lines.push("");
      const backTo = sectionRoot;
      lines.push(r.color("c-white", " " + backTo + " TORNA ALLA SEZIONE    100 HOME"));

      r.show(pageNum, lines.join("\n"), { title: meta.title });
    };
  }

  function renderListSafe(sectionRoot) {
    return function render(pageNum) {
      const r = TVRender;
      const s = TVState.current || {};
      const year = s.year || 1;
      const meta = SECTION_META[sectionRoot];
      const items = TVIntel.newsForCurrentDealflow
        ? TVIntel.newsForCurrentDealflow(s, sectionRoot)
        : TVNews.listSection(sectionRoot, year);
      const width = r.COLS - 2;

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " - ANNO " + year, width)));
      lines.push("");

      if (items.length === 0) {
        lines.push("");
        lines.push(r.center(r.color("c-white", "nessuna news utile al dealflow.")));
        lines.push(r.center(r.color("c-white", "torna dopo il prossimo round.")));
      } else {
        items.forEach(n => {
          const intel = TVIntel.pageStatus(s, n.page);
          const tag = n.tone === "ironic" ? r.color("c-yellow", "[!]") :
                      n.tone === "gossip" ? r.color("c-magenta", "[~]") :
                                            r.color("c-cyan", "[*]");
          const num = r.color(meta.accent, String(n.page));
          const titleLines = wrapText(n.headline, r.COLS - 15).slice(0, 2);
          if (sectionRoot === 110) {
            lines.push(newsRow(n.page, " " + num + " " +
              '<span class="blink c-red">NEW</span> ' +
              r.color("c-white", titleLines[0])));
          } else {
            lines.push(newsRow(n.page, " " + num + "  " + tag + " " +
              r.color("c-white", titleLines[0])));
          }
          if (titleLines[1]) {
            lines.push(newsRow(n.page, "          " + r.color("c-white", titleLines[1]),
              "news-link-row-cont"));
          }
          lines.push("      " + (intel.read
            ? r.color("c-green", "[LETTA]")
            : r.color("c-white", "[NON LETTA]")));
        });
      }

      while (lines.length < 18) lines.push("");
      lines.push(r.color("c-white", " 100 HOME    200 DEALFLOW    400 PORTFOLIO"));
      r.show(pageNum, lines.join("\n"), { title: meta.title });
    };
  }

  function renderDetailSafe() {
    return function render(pageNum) {
      const r = TVRender;
      const news = TVNews.byPage(pageNum);
      if (!news) { TVRouter.goto(100, { skipLoading: true }); return; }
      const sectionRoot = news.section;
      const meta = SECTION_META[sectionRoot] || { title: "NEWS", bg: "bg-blue", accent: "c-yellow" };
      const width = r.COLS - 2;

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " - ANNO " + news.year, width)));
      lines.push("");
      pushWrapped(lines, () => " ", news.headline, width - 1, meta.accent);
      lines.push(r.color("c-white", " " + "-".repeat(width)));
      lines.push("");
      news.body.forEach(line => {
        pushWrapped(lines, idx => idx ? "   " : " ", line, width - 1, "c-white");
      });

      const intel = TVIntel.pageStatus(TVState.current, pageNum);
      const fingerprint = TVIntel.newsFingerprint(news);
      lines.push("");
      if (fingerprint) {
        pushWrapped(lines, () => " ", "FIRMA: " + fingerprint.kind +
          " - " + fingerprint.description, width - 1, "c-yellow");
      }
      if (intel.deals.length) {
        lines.push(" " + r.color("c-green", "RITAGLIO ARCHIVIATO A PAG 190."));
        lines.push(" " + r.color("c-cyan", "Incrocialo con una fonte di tipo diverso."));
      } else {
        lines.push(" " + r.color("c-magenta", "IL TACCUINO RESTA IN SILENZIO."));
      }
      const unlocked = TVIntel.unlockedSourcesForPage(TVState.current, pageNum);
      if (unlocked.length) {
        lines.push(" " + r.color("c-magenta",
          "FONTE RISERVATA SBLOCCATA: " + unlocked[0].chain.page + "."));
      }

      while (lines.length < 19) lines.push("");
      lines.push(r.color("c-white", " " + sectionRoot + " TORNA ALLA SEZIONE    100 HOME"));
      r.show(pageNum, lines.join("\n"), { title: meta.title });
    };
  }

  // Registra pagine sezione (110, 120, 160, 180)
  const P = global.TVPages = global.TVPages || {};
  P[110] = { render: renderListSafe(110) };
  P[120] = { render: renderListSafe(120) };
  P[160] = { render: renderListSafe(160) };
  P[180] = { render: renderListSafe(180) };

  // Registra solo la stagione pubblica. Gli anni 4+ restano nel calendario
  // come espansione, ma non sono pagine navigabili in questa build.
  const detailRender = renderDetailSafe();
  TVNews.NEWS.forEach(n => {
    if (n.year <= PUBLIC_SEASON_MAX_YEAR && [110, 120, 160, 180].includes(n.section)) {
      P[n.page] = { render: detailRender };
    }
  });
})(window);
