/* Ambiente isolato per testare router/pagine e timer senza browser.
   Non verifica CSS, hit target reali o rendering: per quelli serve un playtest. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function harness() {
  const storage = {};
  const timers = new Map();
  const errors = [];
  let timerId = 0;
  const nodes = {};
  function element(id) {
    const classes = new Set();
    return nodes[id] || (nodes[id] = {
      id, innerHTML: "", textContent: "", dataset: {}, scrollTop: 0, offsetWidth: 1000,
      classList: { add: k => classes.add(k), remove: k => classes.delete(k),
        contains: k => classes.has(k), toggle(k, on) { if (on) classes.add(k); else classes.delete(k); } },
      setAttribute() {}, removeAttribute() {}, addEventListener() {},
      querySelectorAll() { return []; }, querySelector() { return null; }
    });
  }
  const ctx = vm.createContext({
    console: { log() {}, error(...args) { errors.push(args.map(String).join(" ")); } },
    localStorage: {
      getItem: k => storage[k] || null, setItem: (k, v) => { storage[k] = String(v); },
      removeItem: k => { delete storage[k]; }
    },
    document: { getElementById: element, addEventListener() {} },
    navigator: {},
    matchMedia: () => ({ matches: false }),
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    setInterval() { return 0; }, clearInterval() {},
    btoa: s => Buffer.from(s, "binary").toString("base64"),
    atob: s => Buffer.from(s, "base64").toString("binary")
  });
  ctx.window = ctx;
  ctx.TVAudio = new Proxy({}, { get: (_, key) => key === "isMuted" ? () => true : () => {} });
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const files = [...html.matchAll(/<script src="(js\/[^?"]+)/g)].map(m => m[1]);
  files.filter(f => f !== "js/engine/audio.js" && f !== "js/ui/fx.js").forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", f), "utf8"), ctx, { filename: f });
  });
  function flush(limit = 300) {
    let count = 0;
    while (timers.size) {
      if (++count > limit) throw new Error("Timer loop");
      const [id, fn] = timers.entries().next().value;
      timers.delete(id);
      fn();
    }
    if (errors.length) throw new Error(errors.join("\n"));
  }
  function go(page) { ctx.TVRouter.goto(page, { skipLoading: true }); }
  function act(num, settle = true) { ctx.TVInput.pressAction(num); if (settle) flush(); }
  function scene() { return element("console-stage").innerHTML; }
  function page() { return element("tv-content").innerHTML; }
  return { ctx, storage, timers, errors, nodes, flush, go, act, scene, page };
}

module.exports = { harness };
