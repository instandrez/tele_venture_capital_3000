/* Pagine sezione news (110, 120, 160, 180): mostrano la lista delle
   news pubblicate fino all'anno corrente. Cliccando il numero pagina
   relativo (es. 121, 122...) si apre il dettaglio. */
(function (global) {

  const SECTION_META = {
    110: { title: "ULTIM'ORA",        bg: "bg-red",     accent: "c-red"     },
    120: { title: "POLITICA",         bg: "bg-blue",    accent: "c-yellow"  },
    160: { title: "CRONACA STARTUP",  bg: "bg-magenta", accent: "c-magenta" },
    180: { title: "CORPORATE WATCH",  bg: "bg-yellow",  accent: "c-yellow"  }
  };

  function renderList(sectionRoot) {
    return function render(pageNum) {
      const r = TVRender;
      const s = TVState.current || {};
      const year = s.year || 1;
      const meta = SECTION_META[sectionRoot];
      const items = TVNews.listSection(sectionRoot, year);

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " — ANNO " + year, 38)));
      lines.push("");

      if (items.length === 0) {
        lines.push("");
        lines.push(r.center(r.color("c-white", "nessuna news pubblicata.")));
        lines.push(r.center(r.color("c-white", "torna più tardi, GP.")));
      } else {
        items.forEach((n, i) => {
          const tag = n.tone === "ironic" ? r.color("c-yellow", "[!]") :
                      n.tone === "gossip" ? r.color("c-magenta", "[~]") :
                                            r.color("c-cyan",   "[·]");
          const num = r.color(meta.accent, String(n.page));
          const title = r.escape(n.headline.length > 32 ? n.headline.slice(0, 32) + "…" : n.headline);
          if (sectionRoot === 110) {
            // Ultim'Ora: tag lampeggiante "NEW" davanti, titolo fisso e leggibile
            lines.push(" " + num + " " + '<span class="blink c-red">NEW</span> ' + r.color("c-white", title));
          } else {
            lines.push(" " + num + "  " + tag + " " + title);
          }
          lines.push("");
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

      const lines = [];
      lines.push(r.bg(meta.bg, "  " + r.pad(meta.title + " — ANNO " + news.year, 38)));
      lines.push("");
      lines.push(r.color(meta.accent, " " + news.headline));
      lines.push(r.color("c-white", " " + "─".repeat(38)));
      lines.push("");
      news.body.forEach(line => {
        lines.push(" " + r.color("c-white", line));
      });

      while (lines.length < 19) lines.push("");
      const backTo = sectionRoot;
      lines.push(r.color("c-white", " " + backTo + " TORNA ALLA SEZIONE    100 HOME"));

      r.show(pageNum, lines.join("\n"), { title: meta.title });
    };
  }

  // Registra pagine sezione (110, 120, 160, 180)
  const P = global.TVPages = global.TVPages || {};
  P[110] = { render: renderList(110) };
  P[120] = { render: renderList(120) };
  P[160] = { render: renderList(160) };
  P[180] = { render: renderList(180) };

  // Registra TUTTE le pagine di dettaglio news (cross-anno)
  // per le sezioni 110, 120, 160, 180 (140 lo gestisce borsa.js).
  const detailRender = renderDetail();
  TVNews.NEWS.forEach(n => {
    if ([110, 120, 160, 180].includes(n.section)) {
      P[n.page] = { render: detailRender };
    }
  });
})(window);
