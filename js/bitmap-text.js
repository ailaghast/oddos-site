// Bitmap text: draws OddOS Sans glyphs pixel by pixel into canvases at art resolution, so text is exactly on the
// pixel grid (browsers always anti-alias real text). The original text stays in the page, visually hidden,
// for screen readers, search and copy. Mark elements with data-bt:
//   data-bt          wrap to the element's width (paragraphs, list items)
//   data-bt="fit"    one line, canvas as wide as the text (labels, buttons, titles)
// Options: data-scale="2" (each font pixel 2x2 art px), data-shadow="#06080B" (1px drop shadow),
// data-lh="14" (line height, default 12 x scale), data-align="center". <b> inside = bold, colours from CSS.
(function () {
  const G = window.ODDOS_GLYPHS, $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const glyph = ch => G[ch] || (ch === ' ' ? G[' '] : G['?']);
  const adv = (ch, bold) => Math.max(...glyph(ch).map(r => r.length)) + 1 + (bold ? 1 : 0);

  // flatten an element into styled runs: [{ text, color, bold }]
  function runs(el) {
    const out = [], walk = (node, bold) => {
      for (const n of node.childNodes) {
        if (n.nodeType === 3) out.push({ text: n.textContent.replace(/\s+/g, ' '), color: getComputedStyle(node).color, bold });
        else if (n.nodeType === 1 && n.tagName === 'BR') { if (getComputedStyle(n).display !== 'none') out.push({ text: '\n', color: '', bold }); }   // CSS can hide a break
        else if (n.nodeType === 1) walk(n, bold || /^(B|STRONG)$/.test(n.tagName) || +getComputedStyle(n).fontWeight >= 600);
      }
    };
    walk(el, +getComputedStyle(el).fontWeight >= 600);
    return out;
  }
  // word-wrap runs into lines of { x, ch, color, bold } (x in font pixels)
  function layout(rs, maxW) {
    const lines = [[]]; let x = 0;
    const words = [];
    for (const r of rs) for (const part of r.text.split(/( |\n)/)) if (part) words.push({ part, color: r.color, bold: r.bold });
    for (const w of words) {
      if (w.part === '\n') { lines.push([]); x = 0; continue; }
      const width = [...w.part].reduce((a, ch) => a + adv(ch, w.bold), 0);
      if (w.part === ' ') { if (x === 0) continue; }
      else if (maxW && x > 0 && x + width - 1 > maxW) {
        const line = lines[lines.length - 1];
        while (line.length && line[line.length - 1].ch === ' ') line.pop();
        lines.push([]); x = 0;
      }
      for (const ch of w.part) { lines[lines.length - 1].push({ x, ch, color: w.color, bold: w.bold }); x += adv(ch, w.bold); }
    }
    return lines.map(l => { const last = l[l.length - 1]; return { glyphs: l, width: last ? last.x + adv(last.ch, last.bold) - 1 : 0 }; });
  }
  function drawGlyph(ctx, ch, x, y, s, bold) {
    const rows = glyph(ch);
    rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') { ctx.fillRect(x + c * s, y + r * s, s * (bold ? 2 : 1), s); } });
  }

  function render(el) {
    if (!el.isConnected) return;
    // a drop shadow only reads on the wallpaper: highlighted (hovered or selected) labels go without
    const lit = el.closest('.ico') && el.closest('.ico').matches(':hover, .sel');
    const fit = el.dataset.bt === 'fit', s = +(el.dataset.scale || 1), shadow = lit ? null : el.dataset.shadow, lh = +(el.dataset.lh || 12 * s);
    let src = el.querySelector(':scope > .sr');
    if (!src) {   // first run: keep the real text for assistive tech, hidden
      src = document.createElement('span'); src.className = 'sr';
      while (el.firstChild) src.appendChild(el.firstChild);
      el.appendChild(src);
      const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true'); el.appendChild(cv);
    }
    const cv = el.querySelector(':scope > canvas');
    const avail = fit ? 0 : Math.floor(el.clientWidth / s);
    if (!fit && !avail) return;
    const lines = layout(runs(src), avail);
    // fit canvases get even sizes, so centring them never lands on half a pixel
    // (data-exact: the canvas is exactly the glyphs, cap height only, for centring in odd-sized boxes like TV buttons)
    const exact = el.dataset.exact !== undefined, even = v => fit && !exact ? v + (v % 2) : v;
    const w = fit ? even(Math.max(1, ...lines.map(l => l.width)) * s + (shadow ? 1 : 0)) : el.clientWidth;
    const h = exact ? 7 * s : even(lines.length * lh - (lh - 10 * s) + (shadow ? 1 : 0));   // last line keeps only its descender room
    cv.width = w; cv.height = Math.max(1, h); cv.style.width = w + 'px'; cv.style.height = Math.max(1, h) + 'px';
    const ctx = cv.getContext('2d'), align = el.dataset.align || getComputedStyle(el).textAlign;
    ctx.clearRect(0, 0, w, h);
    lines.forEach((line, i) => {
      const ox = align === 'center' ? Math.floor((w - line.width * s) / 2) : align === 'right' || align === 'end' ? w - line.width * s - (shadow ? 1 : 0) : 0;
      const oy = i * lh + Math.floor((lh - 10 * s) / 2) * (lines.length > 1 ? 1 : 0);
      for (const pass of shadow ? [shadow, null] : [null]) for (const g of line.glyphs) {
        ctx.fillStyle = pass || g.color;
        drawGlyph(ctx, g.ch, ox + g.x * s + (pass ? 1 : 0), oy + (pass ? 1 : 0), s, g.bold);
      }
    });
  }

  // re-render when the text's colour can change (hover/focus on links and buttons) or when wrapped blocks resize
  const ro = new ResizeObserver(es => es.forEach(e => { if (e.target._btw !== e.target.clientWidth) { e.target._btw = e.target.clientWidth; render(e.target); } }));
  function attach(el) {
    if (el._bt) return; el._bt = true;
    render(el);
    if (el.dataset.bt !== 'fit') { el._btw = el.clientWidth; ro.observe(el); }
    const host = el.closest('a, button, label, [data-hov]');
    if (host && !host._bth) {
      host._bth = true;
      const again = () => requestAnimationFrame(() => $$('[data-bt]', host).concat(host.matches('[data-bt]') ? [host] : []).forEach(render));
      ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach(t => host.addEventListener(t, again));
    }
  }
  function scan(root = document) { $$('[data-bt]', root).forEach(attach); }

  // text fields: the real <input> stays (invisible text) and a canvas draws the value and a block caret
  function field(wrap) {
    const input = wrap.querySelector('input'), out = document.createElement('span');
    out.dataset.bt = 'fit'; out.className = 'fieldtext'; wrap.appendChild(out);
    let on = false;
    const draw = () => {
      const v = input.value, ph = !v;
      out.innerHTML = ''; out._bt = false;
      const t = document.createElement('span');
      t.textContent = (ph ? input.placeholder : v.slice(-40)) + (on && document.activeElement === input ? '█' : '');
      t.style.color = ph ? 'var(--dim)' : 'var(--paper)';
      out.appendChild(t); attach(out);
    };
    ['input', 'focus', 'blur'].forEach(e => input.addEventListener(e, draw));
    setInterval(() => { on = !on; if (document.activeElement === input) draw(); }, 500);
    wrap.addEventListener('pointerdown', () => setTimeout(() => input.focus()));
    draw();
  }

  // draw a string straight onto any canvas (TV screen, wallpaper): returns its width
  function drawText(ctx, text, x, y, color, { bold = false, scale = 1, shadow } = {}) {
    let cx = 0;
    for (const ch of text) {
      if (shadow) { ctx.fillStyle = shadow; drawGlyph(ctx, ch, x + cx + 1, y + 1, scale, bold); }
      ctx.fillStyle = color; drawGlyph(ctx, ch, x + cx, y, scale, bold); cx += adv(ch, bold) * scale;
    }
    return cx - scale;
  }
  const textWidth = (text, bold, scale = 1) => [...text].reduce((a, ch) => a + adv(ch, bold), 0) * scale - scale;

  window.BT = { render, attach, scan, field, drawText, textWidth, rerenderAll: () => $$('[data-bt]').forEach(render) };
})();
