/* Header del Televideo: titolo sezione + numero pagina + orologio simulato. */
(function (global) {
  let clockInterval = null;

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function tickClock() {
    const el = document.getElementById("hdr-clock");
    if (!el) return;
    const d = new Date();
    el.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  global.TVHeader = {
    setPage(pageNum) {
      const el = document.getElementById("hdr-page");
      if (el) el.textContent = "P." + pageNum;
    },
    setTitle(title) {
      const el = document.getElementById("hdr-title");
      if (el) el.textContent = title;
    },
    start() {
      tickClock();
      if (clockInterval) clearInterval(clockInterval);
      clockInterval = setInterval(tickClock, 30_000);
    }
  };
})(window);
