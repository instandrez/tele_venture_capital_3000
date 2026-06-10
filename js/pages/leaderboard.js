/* Pagina 800 — Classifica locale. */
(function (global) {

  function readLB() {
    try { return JSON.parse(localStorage.getItem("tvc3000.leaderboard") || "[]"); }
    catch (e) { return []; }
  }

  function render(pageNum) {
    const r = TVRender;
    const lb = readLB();

    const lines = [];
    lines.push(r.bg("bg-yellow", "  " + r.pad("CLASSIFICA LOCALE", 38)));
    lines.push("");

    if (lb.length === 0) {
      lines.push(r.color("c-white", r.center("nessuna partita salvata.")));
      lines.push(r.color("c-magenta", r.center("vinci, salva, torna.")));
    } else {
      lines.push(" " + r.color("c-yellow",
        r.pad("#", 3) + r.pad("FONDO", 16) + r.pad("MOIC", 7) + "TITOLO"));
      lines.push(r.color("c-blue", " " + "─".repeat(38)));
      lb.slice(0, 14).forEach((e, i) => {
        const rank = String(i + 1);
        const rankCls = i === 0 ? "c-yellow" : (i < 3 ? "c-green" : "c-white");
        lines.push(" " +
          r.color(rankCls, r.pad(rank, 3)) +
          r.color("c-white",  r.pad(e.fundName.slice(0, 15), 16)) +
          r.color("c-cyan",   r.pad(e.moic.toFixed(2) + "x", 7)) +
          r.color("c-magenta", e.title.slice(0, 14)));
      });
    }

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "CLASSIFICA" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[800] = { render };
})(window);
