/* Titoli ironici finali assegnati dal report (pag 700)
   in base alle metriche di chiusura. */
(function (global) {

  function pickTitle(metrics) {
    const { moic, dpi, lpSat, reputation, impact, score } = metrics;
    const deploymentRate = metrics.deploymentRate || 0;

    // Conditional picks first (più specifici prima)
    if (moic < 0.2)                          return "Falo' Rituale di Capitale Altrui";
    if (moic < 0.5)                          return "Write-Off Collector con Thesis";
    if (moic > 4.0)                          return "Outlier Certificato, Non Replicabile";
    if (moic >= 0.9 && moic <= 1.1 && dpi < 0.5) return "Ha Inventato il BTP Illiquido";
    if (deploymentRate < 0.35 && moic > 2.0) return "Cecchino col Freno a Mano Tirato";
    if (deploymentRate > 0.9 && moic < 1.0)  return "Ha Deployato Anche gli Errori";
    if (moic > 3.0 && dpi > 1.5)             return "LP Whisperer";
    if (moic > 2.5 && reputation > 75)       return "Carry Enjoyer";
    if (dpi > 2.0)                           return "Distribuisce Come Un Bancomat";
    if (reputation < 25)                     return "Persona Non Grata Ai Demo Day";
    if (dpi > 1.0 && moic < 1.5)             return "DPI Dreamer";
    if (impact > 75 && moic < 1.5)           return "Impact-Pilled";
    if (impact > 70 && moic > 2.0)           return "Climate Contrarian";
    if (reputation > 80 && moic < 1.5)       return "Panel Hero, DPI Zero";
    if (moic > 2.0 && dpi < 0.3)             return "Paper Unicorn Farmer";
    if (lpSat.sovereign > 80 && lpSat.endowment < 30) return "Gulf Pleaser";
    if (lpSat.pensione > 80 && moic < 1.0)   return "Pensioner Friend, Returns Stranger";
    if (lpSat.family > 80 && impact > 60)    return "Plant Visit Enjoyer";
    if (moic > 1.5 && moic < 2.5 && reputation > 50) return "Seed Stage Samurai";
    if (score > 70)                          return "PowerPoint Prophet";

    // fallback evergreen
    if (score > 50) return "Decent GP da Comitato del Martedi";
    if (score < 25) return "Il Mercato Aveva Torto (cit.)";
    return "Corporate Synergy Victim";
  }

  global.TVTitles = { pickTitle };
})(window);
