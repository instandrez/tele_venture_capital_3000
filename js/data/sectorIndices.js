/* Indici settoriali del Tele Venture Capital 3000.
   Ogni indice ha trend base (anno per anno) e volatilità.
   Il marketEngine li mescola con gli effetti delle news. */
(function (global) {

  // Trend percentuali di base per anno (anno 1..5)
  // Numeri ironici ma realistici rispetto a cicli VC noti.
  const SECTOR_INDICES = {
    AI:           { name: "INDICE AI",          color: "c-magenta", base: [ 25,  18,  -8,  12,   6] },
    CLIMATE:      { name: "INDICE CLIMATE",     color: "c-green",   base: [  8,  12,  18,  10,   4] },
    ROBOTICS:     { name: "INDICE ROBOTICS",    color: "c-yellow",  base: [ 12,  20,  -5,   8,  14] },
    MOBILITY:     { name: "INDICE MOBILITY",    color: "c-cyan",    base: [ -4,   2,   6,  10,  -2] },
    BATTERY:      { name: "INDICE BATTERY",     color: "c-green",   base: [ 10,  14,  18,   6,   8] },
    CYBER:        { name: "INDICE CYBER",       color: "c-red",     base: [  6,  10,  14,  12,   8] },
    LEGALTECH:    { name: "INDICE LEGALTECH",   color: "c-white",   base: [  4,   6,   8,  12,  10] },
    SPACE:        { name: "INDICE SPACE",       color: "c-cyan",    base: [ 14,  10,   6,  -4,  18] },
    FINTECH:      { name: "INDICE FINTECH",     color: "c-yellow",  base: [ -8,  -2,   4,   8,   6] },
    SAAS:         { name: "INDICE B2B SAAS",    color: "c-white",   base: [  6,   8,   4,  10,   8] },
    CRYPTO:       { name: "INDICE CRYPTO",      color: "c-magenta", base: [-22, -10,  20,  35, -15] },
    CONSUMER:     { name: "INDICE CONSUMER",    color: "c-cyan",    base: [ -6,  -2,   0,   4,   2] }
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
