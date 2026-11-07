// Palette preview: ?pal=ember (see palettes-alt.js) redraws OddOS in another palette. Does nothing without ?pal.
// Canvas colours are swapped as they are set, CSS colours through the :root variables, and the converted pixel art
// (icons, desk scene) is swapped for copies recoloured by _tools/repal-art.js. Dice Dice Battles' own art is left alone.
(function () {
  const key = new URLSearchParams(location.search).get('pal');
  const M = key && window.ODDOS_PALETTES.map(key);
  if (!M || !Object.keys(M).length) return;
  const swap = v => (typeof v === 'string' && M[v.toUpperCase()]) || v;
  for (const prop of ['fillStyle', 'strokeStyle']) {
    const d = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, prop);
    Object.defineProperty(CanvasRenderingContext2D.prototype, prop, { get: d.get, set(v) { d.set.call(this, swap(v)); } });
  }
  // (stylesheet rules can't be read from file:// pages, so the variable names are listed here)
  const css = getComputedStyle(document.documentElement);
  const vars = 'ink night night2 night3 line line2 violet violet-d lav lav-l dim white cyan dcyan'.split(' ')
    .map(n => `--${n}: ${swap(css.getPropertyValue('--' + n).trim())};`);
  const st = document.createElement('style'); st.textContent = `:root { ${vars.join(' ')} }`; document.head.appendChild(st);
  const fix = img => {
    const src = img.getAttribute('src') || '', m = src.match(/^(.*\/art\/)(icons16\/|icons\/|dev-at-desk\.png)(.*)$/);
    if (m) img.setAttribute('src', `${m[1]}pal/${key}/${m[2]}${m[3]}`);
  };
  const scan = root => root.querySelectorAll && root.querySelectorAll('img').forEach(fix);
  scan(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.tagName === 'IMG') fix(n); else scan(n); })))
    .observe(document.documentElement, { childList: true, subtree: true });
})();
