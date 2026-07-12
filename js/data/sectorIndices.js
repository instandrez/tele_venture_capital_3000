/* Indici settoriali del Tele Venture Capital 3000.
   Ogni indice ha trend base (anno per anno) e volatilità.
   Il marketEngine li mescola con gli effetti delle news. */
(function (global) {

  // Trend percentuali di base per anno (anno 1..3: il fondo dura 3 anni)
  // Numeri ironici ma realistici rispetto a cicli VC noti.
  const SECTOR_INDICES = {
    AI:           { name: "INDICE AI",          color: "c-magenta", base: [ 25,  18,  -8] },
    CLIMATE:      { name: "INDICE CLIMATE",     color: "c-green",   base: [  8,  12,  18] },
    ROBOTICS:     { name: "INDICE ROBOTICS",    color: "c-yellow",  base: [ 12,  20,  -5] },
    MOBILITY:     { name: "INDICE MOBILITY",    color: "c-cyan",    base: [ -4,   2,   6] },
    BATTERY:      { name: "INDICE BATTERY",     color: "c-green",   base: [ 10,  14,  18] },
    CYBER:        { name: "INDICE CYBER",       color: "c-red",     base: [  6,  10,  14] },
    LEGALTECH:    { name: "INDICE LEGALTECH",   color: "c-white",   base: [  4,   6,   8] },
    SPACE:        { name: "INDICE SPACE",       color: "c-cyan",    base: [ 14,  10,   6] },
    FINTECH:      { name: "INDICE FINTECH",     color: "c-yellow",  base: [ -8,  -2,   4] },
    SAAS:         { name: "INDICE B2B SAAS",    color: "c-white",   base: [  6,   8,   4] },
    CRYPTO:       { name: "INDICE CRYPTO",      color: "c-magenta", base: [-22, -10,  20] },
    CONSUMER:     { name: "INDICE CONSUMER",    color: "c-cyan",    base: [ -6,  -2,   0] }
  };

  // Flag testuali per "segnale" nella tabella borsa
  function signal(pct) {
    if (pct >= 15)  return { sym: "▲▲", cls: "c-green",   txt: "BULL" };
    if (pct >= 5)   return { sym: "▲",  cls: "c-green",   txt: "POS." };
    if (pct >= -4)  return { sym: "·",  cls: "c-white",   txt: "FLAT" };
    if (pct >= -14) return { sym: "▼",  cls: "c-red",     txt: "NEG." };
    return                  { sym: "▼▼",cls: "c-red",     txt: "BEAR" };
  }

  global.TVSectors = { SECTOR_INDICES, signal };
})(window);
