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
        r.pad("#", 3) + r.pad("GP/FONDO", 17) + r.pad("MODE", 6) + r.pad("MOIC", 7) + "SCORE"));
      lines.push(r.color("c-blue", " " + "─".repeat(38)));
      lb.slice(0, 14).forEach((e, i) => {
        const rank = String(i + 1);
        const rankCls = i === 0 ? "c-yellow" : (i < 3 ? "c-green" : "c-white");
        const label = (e.nickname ? e.nickname + "/" : "") + (e.fundName || "—");
        const mode = e.runMode === "partner" ? "PRT" : "QCK";
        const moic = (typeof e.moic === "number" && isFinite(e.moic)) ? e.moic : 0;
        lines.push(" " +
          r.color(rankCls, r.pad(rank, 3)) +
          r.color("c-white",  r.pad(label.slice(0, 16), 17)) +
          r.color("c-yellow", r.pad(mode, 6)) +
          r.color("c-cyan",   r.pad(moic.toFixed(2) + "x", 7)) +
          r.color("c-magenta", String(e.score || 0).slice(0, 5)));
      });
    }

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "CLASSIFICA" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[800] = { render };
})(window);
