/* Render utilities — costruisce HTML preservando layout monospace.
   Le pagine producono stringhe HTML usando questi helper. */
(function (global) {

  const COLS = 40;
  const ROWS = 22;

  function escape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function center(text, width) {
    width = width || COLS;
    const t = String(text);
    if (t.length >= width) return t;
    const pad = Math.floor((width - t.length) / 2);
    return " ".repeat(pad) + t;
  }

  function pad(text, width, char) {
    text = String(text);
    char = char || " ";
    if (text.length >= width) return text.slice(0, width);
    return text + char.repeat(width - text.length);
  }

  function padLeft(text, width, char) {
    text = String(text);
    char = char || " ";
    if (text.length >= width) return text.slice(-width);
    return char.repeat(width - text.length) + text;
  }

  function line(char) { return (char || "═").repeat(COLS); }

  function row(left, right) {
    const space = COLS - left.length - right.length;
    return left + (space > 0 ? " ".repeat(space) : " ") + right;
  }

  // Avvolge testo in classe colore, conservando layout (output HTML)
  function color(cls, text) {
    return '<span class="' + cls + '">' + escape(text) + '</span>';
  }

  function bg(cls, text) {
    return '<span class="' + cls + '">' + escape(text) + '</span>';
  }

  function blink(text) {
    return '<span class="blink c-red">' + escape(text) + '</span>';
  }

  // formatta importo in €
  function eur(v) {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1) + "M€";
    if (v >= 1_000) return Math.round(v / 1_000) + "k€";
    return v + "€";
  }

  // Renderizza una pagina (stringa HTML) nel contenitore.
  // Applica un cap rigoroso a ROWS righe: se la pagina sfora,
  // sostituisce l'ultima riga con un marker visibile per il dev.
  function show(pageNum, html, opts) {
    opts = opts || {};
    const content = document.getElementById("tv-content");
    if (!content) return;
    const rawLines = String(html).split("\n");
    if (rawLines.length > ROWS) {
      const overflow = rawLines.length - (ROWS - 1);
      const truncated = rawLines.slice(0, ROWS - 1);
      truncated.push('<span class="c-red">▼ +' + overflow + " righe nascoste ▼</span>");
      content.innerHTML = truncated.join("\n");
    } else {
      content.innerHTML = html;
    }
    TVHeader.setPage(pageNum);
    if (opts.title) TVHeader.setTitle(opts.title);
    else TVHeader.setTitle("TELE VENTURE CAPITAL 3000");
  }

  global.TVRender = {
    COLS, ROWS, escape, center, pad, padLeft, line, row, color, bg, blink, eur, show
  };
})(window);
