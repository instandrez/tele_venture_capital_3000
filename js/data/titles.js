/* Titoli ironici finali assegnati dal report (pag 700)
   in base alle metriche di chiusura. */
(function (global) {

  function pickTitle(metrics) {
    const { moic, dpi, lpSat, reputation, impact, score } = metrics;

    // Conditional picks first (più specifici prima)
    if (moic < 0.5)                          return "Write-Off Collector";
    if (moic > 3.0 && dpi > 1.5)             return "LP Whisperer";
    if (moic > 2.5 && reputation > 75)       return "Carry Enjoyer";
    if (dpi > 1.0 && moic < 1.5)             return "DPI Dreamer";
    if (impact > 75 && moic < 1.5)           return "Impact-Pilled";
    if (impact > 70 && moic > 2.0)           return "Climate Contrarian";
    if (reputation > 80 && moic < 1.5)       return "Conference Star";
    if (moic > 2.0 && dpi < 0.3)             return "Paper Unicorn Farmer";
    if (lpSat.sovereign > 80 && lpSat.endowment < 30) return "Gulf Pleaser";
    if (lpSat.pensione > 80 && moic < 1.0)   return "Pensioner Friend, Returns Stranger";
    if (lpSat.family > 80 && impact > 60)    return "Industrial Whisperer";
    if (moic > 1.5 && moic < 2.5 && reputation > 50) return "Seed Stage Samurai";
    if (score > 70)                          return "PowerPoint Prophet";

    // fallback evergreen
    if (score > 50) return "Decent GP";
    return "Corporate Synergy Victim";
  }

  global.TVTitles = { pickTitle };
})(window);
