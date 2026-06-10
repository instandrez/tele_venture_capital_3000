/* Pagina 900 — Easter egg / crediti.
   Riferimenti criptici al Televideo, a Markstrat, al lavoro VC. */
(function (global) {

  function render(pageNum) {
    const r = TVRender;
    const lines = [];
    lines.push(r.bg("bg-magenta", "  " + r.pad("CREDITI & FINESTRA SUL '92", 38)));
    lines.push("");
    lines.push(r.color("c-yellow", r.center("TELE VENTURE CAPITAL 3000")));
    lines.push("");
    lines.push(r.color("c-cyan",   " un televideo che dà segnali di mercato"));
    lines.push(r.color("c-cyan",   " a chi ha pazienza di leggere."));
    lines.push("");
    lines.push(r.color("c-white",  " ispirato a:"));
    lines.push("   - un decoder " + r.color("c-yellow", "PHILIPS") + " dimenticato in cantina");
    lines.push("   - serate da " + r.color("c-yellow", "VC con dieci tab aperte"));
    lines.push("   - simulazioni " + r.color("c-yellow", "Markstrat") + " in business school");
    lines.push("   - bandi da " + r.color("c-yellow", "14.000€") + " con 84 documenti");
    lines.push("");
    lines.push(r.color("c-magenta", " principi nascosti:"));
    lines.push(r.color("c-white",   " 1. ogni pagina che apri ha un peso"));
    lines.push(r.color("c-white",   " 2. il rumore è quasi sempre flavor"));
    lines.push(r.color("c-white",   " 3. il segnale arriva dove non guardi"));
    lines.push(r.color("c-white",   " 4. il founder \"too good to be true\" lo è"));
    lines.push("");
    lines.push(r.color("c-yellow", r.center("buona caccia, GP.")));

    while (lines.length < 21) lines.push("");
    lines.push(r.color("c-white", " 100 HOME"));

    r.show(pageNum, lines.join("\n"), { title: "CREDITI" });
  }

  const P = global.TVPages = global.TVPages || {};
  P[900] = { render };
})(window);
