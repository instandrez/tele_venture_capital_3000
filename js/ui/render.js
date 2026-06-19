/* Render utilities — costruisce HTML preservando layout monospace.
   Le pagine producono stringhe HTML usando questi helper. */
(function (global) {

  const COLS = 56;
  const ROWS = 30;
  let lastPage = null;

  function escape(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function visibleLength(text) {
    return String(text)
      .replace(/<[^>]*>/g, "")
      .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ").length;
  }

  function center(text, width) {
    width = width || COLS;
    const t = String(text);
    const len = visibleLength(t);
    if (len >= width) return t;
    const pad = Math.floor((width - len) / 2);
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
    text = String(text);
    // Le vecchie pagine usavano barre da 40 colonne. Sulla nuova griglia
    // larga le estendiamo automaticamente senza dover riscrivere ogni titolo.
    if (text.length >= 36 && text.length < COLS) text = pad(text, COLS);
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

  // Banner "LP IN LINEA" — una riga lampeggiante se ci sono call
  // pendenti. Le pagine principali la mostrano così il giocatore
  // sa SEMPRE quando il telefono squilla. Ritorna null se silenzio.
  function lpAlert(state) {
    try {
      if (!state || !state.gameStarted || state.gameOver) return null;
      const calls = global.TVLPCalls.pickCallsForYear(state);
      if (!calls.length) return null;
      return ' <span class="blink c-red">((( LP IN LINEA )))</span> ' +
             color("c-yellow", "rispondi a pag 600");
    } catch (e) { return null; }
  }

  function sectionFor(pageNum) {
    if (pageNum < 110) return "system";
    if (pageNum < 200) return "news";
    if (pageNum < 300) return "dealflow";
    if (pageNum < 400) return "battle";
    if (pageNum < 500) return "portfolio";
    if (pageNum < 600) return "committee";
    if (pageNum < 700) return "lp";
    if (pageNum < 800) return "report";
    if (pageNum < 900) return "ranking";
    return "credits";
  }

  function setMode(mode, pageNum) {
    const screen = document.getElementById("screen");
    const content = document.getElementById("tv-content");
    const stage = document.getElementById("console-stage");
    if (!screen) return;
    const consoleMode = mode === "console";
    screen.classList.toggle("console-mode", consoleMode);
    screen.dataset.section = sectionFor(pageNum);
    if (content) content.setAttribute("aria-hidden", consoleMode ? "true" : "false");
    if (stage) stage.setAttribute("aria-hidden", consoleMode ? "false" : "true");
  }

  function navTargetFor(pageNum) {
    if (pageNum === 100 || pageNum < 110) return 100;
    if (pageNum >= 110 && pageNum < 190) return 110;
    if (pageNum === 190) return 190;
    if (pageNum >= 200 && pageNum < 400) return 200;
    if (pageNum >= 400 && pageNum < 600) return 400;
    if (pageNum >= 600 && pageNum < 700) return 600;
    return null;
  }

  function updateNav(pageNum) {
    const nav = document.getElementById("tv-nav");
    if (!nav || !nav.querySelectorAll) return;
    const active = navTargetFor(pageNum);
    nav.querySelectorAll("[data-page]").forEach(button => {
      const current = parseInt(button.dataset.page, 10) === active;
      button.classList.toggle("is-active", current);
      if (current) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
  }

  // Renderizza una pagina (stringa HTML) nel contenitore.
  // Applica un cap rigoroso a ROWS righe: se la pagina sfora,
  // sostituisce l'ultima riga con un marker visibile per il dev.
  function show(pageNum, html, opts) {
    opts = opts || {};
    const content = document.getElementById("tv-content");
    if (!content) return;
    setMode("teletext", pageNum);
    const rawLines = String(html).split("\n");
    if (rawLines.length > ROWS) {
      const overflow = rawLines.length - (ROWS - 1);
      const truncated = rawLines.slice(0, ROWS - 1);
      truncated.push('<span class="c-red">▼ +' + overflow + " righe nascoste ▼</span>");
      content.innerHTML = truncated.join("\n");
    } else {
      content.innerHTML = html;
    }
    content.dataset.page = String(pageNum);
    if (lastPage !== pageNum) {
      content.classList.remove("page-enter");
      void content.offsetWidth;
      content.classList.add("page-enter");
      lastPage = pageNum;
    }
    TVHeader.setPage(pageNum);
    updateNav(pageNum);
    if (opts.title) TVHeader.setTitle(opts.title);
    else TVHeader.setTitle("TELE VENTURE CAPITAL 3000");
  }

  function showScene(pageNum, html, opts) {
    opts = opts || {};
    const stage = document.getElementById("console-stage");
    if (!stage) return;
    setMode("console", pageNum);
    stage.className = opts.className || "";
    stage.innerHTML = html;
    stage.dataset.page = String(pageNum);
    TVHeader.setPage(pageNum);
    updateNav(pageNum);
    TVHeader.setTitle(opts.title || "VC3000");
  }

  global.TVRender = {
    COLS, ROWS, escape, visibleLength, center, pad, padLeft, line, row,
    color, bg, blink, eur, lpAlert, show, showScene, setMode,
    navTargetFor, updateNav
  };
})(window);
