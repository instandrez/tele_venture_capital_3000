/* Sprite "mosaico Televideo" per la PITCH BATTLE — pixel art in
   blocchi pieni, come la grafica mosaic del teletext vero (e come
   i mostri tascabili su console portatile, ma con più cap table).

   Formato: ogni sprite è una griglia di caratteri-palette.
     .  trasparente        W bianco    Y giallo    C ciano
     G  verde   M magenta  R rosso     B blu
   Ogni pixel è reso come "██" (due colonne monospace = un pixel
   quadrato). Larghezza fissa 10 pixel = 20 colonne.

   Gli sprite sono il "tipo" del founder: si imparano partita dopo
   partita, come le silhouette dei mostri. Il giocatore esperto
   riconosce l'archetipo a vista — l'edge è anche visivo.

   Modulo puro: niente DOM, testabile in node. */
(function (global) {

  const PAL = {
    W: "c-white", Y: "c-yellow", C: "c-cyan", G: "c-green",
    M: "c-magenta", R: "c-red", B: "c-blue"
  };

  const SPRITES = {
    /* ego — riga perfetta, occhiali da sole INDOOR, dolcevita.
       Ha un TED talk e te lo farà sapere. */
    ego: [
      "..YYYYYY..",
      ".YYYYYYYY.",
      ".BCBBBBCB.",
      ".WWWWWWWW.",
      ".WWWWRRWW.",
      "..WWWWWW..",
      ".MMMMMMMM.",
      "MMMMMMMMMM"
    ],
    /* hustle — cappellino della demo day, sorriso a 32 denti,
       felpa col logo della propria startup. */
    hustle: [
      "..RRRRRR..",
      ".RRRRRRRR.",
      "RRRRRRRRRR",
      ".WBWWWWBW.",
      ".WWWWWWWW.",
      ".WRRRRRRW.",
      "..CCCCCC..",
      ".CCWCCWCC."
    ],
    /* red_flag — sudorazione da data room, occhi che scappano,
       cravatta che migra verso destra come il co-founder. */
    red_flag: [
      "..WWWWWW..",
      ".WWWWWWWW.",
      ".WWBWWBWW.",
      ".WWWWWWWC.",
      ".WWRRWWWW.",
      "..WWWWWW..",
      ".WWWWRWWW.",
      ".WWWWWRWW."
    ],
    /* competent — occhiali da vista, giacca vera, camicia stirata.
       L'unico adulto nella stanza. Fa quasi paura. */
    competent: [
      "..BBBBBB..",
      ".BBBBBBBB.",
      ".CWWCCWWC.",
      ".WWWWWWWW.",
      ".WWWRWWWW.",
      "..WWWWWW..",
      ".BBBBBBBB.",
      "BBBWWWWBBB"
    ],
    /* grit — capelli sale e pepe, mascella ferma, polo del 2019
       che funziona ancora. Come i suoi clienti. */
    grit: [
      "..WWWWWW..",
      ".WWWWWWWW.",
      ".WBWWWWBW.",
      ".WWWWWWWW.",
      ".WWRRRRWW.",
      "..WWWWWW..",
      ".GGGGGGGG.",
      "GGGGGGGGGG"
    ],
    /* first_time — ciuffo spettinato, occhioni da primo round,
       t-shirt del proprio hackathon. Suda verità. */
    first_time: [
      ".R.RRRR.R.",
      ".RRRRRRRR.",
      ".WCWWWWCW.",
      ".WWWWWWWC.",
      ".WWWRRWWW.",
      "..WWWWWW..",
      ".YYYYYYYY.",
      "YYYYYYYYYY"
    ],
    /* player — TU, di spalle: il General Partner. Giacca blu
       istituzionale e term sheet già pronto nella destra. */
    player: [
      "...WWWW...",
      "..WWWWWW..",
      ".BBBBBBBB.",
      "BBBBBBBBBB",
      "BBBBBBBWW.",
      "BBBBBBBWW."
    ]
  };

  /* una riga palette → HTML (run-length: un solo span per blocco
     di colore contiguo, "██" per pixel) */
  function rowHtml(row) {
    let out = "", i = 0;
    while (i < row.length) {
      const ch = row[i];
      let j = i;
      while (j < row.length && row[j] === ch) j++;
      const blocks = "██".repeat(j - i);
      out += ch === "." ? "  ".repeat(j - i)
           : '<span class="' + (PAL[ch] || "c-white") + '">' + blocks + "</span>";
      i = j;
    }
    return out;
  }

  /* sprite completo → array di righe HTML (20 colonne visibili) */
  function spriteRows(key) {
    return (SPRITES[key] || SPRITES.competent).map(rowHtml);
  }

  global.TVSprites = { SPRITES, PAL, rowHtml, spriteRows };
})(typeof window !== "undefined" ? window : global);
