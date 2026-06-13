/* Sprite per la PITCH BATTLE — pixel art da console anni '90.

   Formato: griglia di caratteri-palette, un pixel = un carattere
   "█" (dopo lo stretch CRT 4:3 i pixel sono quasi quadrati).
   Larghezza fissa 18 pixel.

     .  trasparente
     W bianco   Y giallo   C ciano    G verde
     M magenta  R rosso    B blu
     S pelle    L pelle chiara (luce)  D pelle scura (ombra)
     A argento  K scuro    O castano

   Gli sprite sono il "tipo" del founder: si imparano partita dopo
   partita, come le silhouette dei mostri tascabili. Il giocatore
   esperto riconosce l'archetipo a vista — l'edge è anche visivo.

   Modulo puro: niente DOM, testabile in node. */
(function (global) {

  const PAL = {
    W: "c-white", Y: "c-yellow", C: "c-cyan", G: "c-green",
    M: "c-magenta", R: "c-red", B: "c-blue",
    S: "c-skin", L: "c-skin-l", D: "c-skin-d",
    A: "c-silver", K: "c-dark", O: "c-brown"
  };

  const SPRITES = {
    /* ego — riga perfetta, occhiali da sole INDOOR (riflesso ciano),
       dolcevita nero. Monocromo come il suo personal brand. */
    ego: [
      "......KKKKKK......",
      ".....KKKKKKKK.....",
      "....LSSSSSSSSD....",
      "....KKCKKKKKCK....",
      "....LSSSSSSSSD....",
      "....LSSSSRRSSD....",
      ".....LSSSSSSD.....",
      "...KKKKKKKKKKKK...",
      "..KKKKKKKKKKKKKK.."
    ],
    /* hustle — cappellino della demo day con visiera lunga, grin
       a 32 denti, felpa col cordino. Energia da Series A. */
    hustle: [
      "....RRRRRRRR......",
      "...RRRRRRRRRR.....",
      "...RRRRRRRRRRRRR..",
      "....LSSSSSSSSD....",
      "....LSKSSSSKSD....",
      "....SWWWWWWWWS....",
      ".....LSSSSSSD.....",
      "...CCCCCCCCCCCC...",
      "..CCCWCCCCCCWCCC.."
    ],
    /* red_flag — stempiatura a M, occhi che scappano di lato,
       goccia di sudore, cravatta che migra come il co-founder. */
    red_flag: [
      "....KK......KK....",
      "....KSSSSSSSSK....",
      "....LSSSSSSSSD....",
      "....SKKSSKKSSS..C.",
      "....LSSSSSSSSD....",
      "....LSRRRSSSSD....",
      ".....LSSSSSSD.....",
      "...WWWWWRRWWWWW...",
      "..WWWWWWWRRWWWWW.."
    ],
    /* competent — riga di lato, occhiali tondi, sorriso misurato,
       blazer sopra la camicia. L'unico adulto nella stanza. */
    competent: [
      ".....OOOOOOOO.....",
      "....OOOOOOOOOO....",
      "....LSSSSSSSSD....",
      "....SCKCSSCKCS....",
      "....LSSSSSSSSD....",
      "....LSSRRRSSSD....",
      ".....LSSSSSSD.....",
      "...BBBWWWWWWBBB...",
      "..BBBBBWWWWBBBBB.."
    ],
    /* grit — sale e pepe, sguardo fermo, bocca a linea dritta,
       mascella squadrata, braccia conserte sulla polo del 2019. */
    grit: [
      ".....AAAAAAAA.....",
      "....AAAAAAAAAA....",
      "....LSSSSSSSSD....",
      "....LSKSSSSKSD....",
      "....LSSSSSSSSD....",
      "....LSKKKKKSSD....",
      "....LSSSSSSSSD....",
      "...GGGGGGGGGGGG...",
      "..GGGSSGGGGSSGGG.."
    ],
    /* first_time — ciuffi spettinati, occhioni sgranati, sorriso
       nervoso a zigzag, t-shirt del proprio hackathon. Suda. */
    first_time: [
      "....O.OO.OO.O.....",
      "....OOOOOOOOOO....",
      "....LSSSSSSSSD....",
      "....SWKSSSWKSS..C.",
      "....LSSSSSSSSD....",
      "....LSRSRSRSSD....",
      ".....LSSSSSSD.....",
      "...YYYYYYYYYYYY...",
      "..YYYYYWWYYYYYYY.."
    ],
    /* player — TU, di spalle: il General Partner. Giacca blu
       istituzionale e term sheet già pronto nella destra. */
    player: [
      "......KKKKKK......",
      ".....KKKKKKKK.....",
      "...BBBBBBBBBBBB...",
      ".BBBBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBWW.."
    ]
  };

  /* una riga palette → HTML (run-length: un solo span per blocco
     di colore contiguo, "█" per pixel) */
  function rowHtml(row) {
    let out = "", i = 0;
    while (i < row.length) {
      const ch = row[i];
      let j = i;
      while (j < row.length && row[j] === ch) j++;
      const blocks = "█".repeat(j - i);
      out += ch === "." ? " ".repeat(j - i)
           : '<span class="' + (PAL[ch] || "c-white") + '">' + blocks + "</span>";
      i = j;
    }
    return out;
  }

  /* sprite completo → array di righe HTML (18 colonne visibili) */
  function spriteRows(key) {
    return (SPRITES[key] || SPRITES.competent).map(rowHtml);
  }

  global.TVSprites = { SPRITES, PAL, rowHtml, spriteRows };
})(typeof window !== "undefined" ? window : global);
