// The OddOS wallpaper, drawn as real pixel art at the screen's art resolution (so it fits any device exactly):
// a slate night in flat bands joined by checkerboard dithering, pixel stars, one tomato star tilted like the logo's
// escaped pixel, and three layers of hills with pines. Seeded, so it looks the same on every visit.
// Easter egg: click the tomato star and every star in the sky flies into the Odd Pixel Labs emblem for a few seconds
// (the small emblem in a small sky, like reading mode's strip, which hasn't enough stars for the big one).
(function () {
  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const SKY = ['#0F1318', '#161B22', '#14212F', '#1C2E42', '#294460', '#36597E'];
  const HILLS = [['#1C2E42', '#294460'], ['#14212F', '#1C2E42'], ['#0F1318', '#161B22']];   // far to near: [body, ridge highlight]
  const ODD = ['.##.', '####', '####', '.##.'], TOMATO = '#FF5A36';
  let W = 0, H = 0, wall = null, sky = null, hills = null, stars = [], odd = null, egg = null;
  const layer = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const dot = (ctx, x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); };

  function draw(cv, w, h) {
    W = w; H = h; wall = cv; cv.width = w; cv.height = h;
    const r = rng(17); sky = layer(); hills = layer(); stars = [];
    const s = sky.getContext('2d'), px = (x, y, c) => dot(s, x, y, c);
    // sky: equal bands, each boundary a 2-row checkerboard
    const horizon = Math.round(h * .78), band = horizon / SKY.length;
    for (let i = 0; i < SKY.length; i++) { s.fillStyle = SKY[i]; s.fillRect(0, Math.round(i * band), w, Math.ceil(band) + 1); }
    for (let i = 1; i < SKY.length; i++) {
      const y0 = Math.round(i * band);
      for (let y = y0 - 2; y < y0 + 2; y++) for (let x = 0; x < w; x++) {
        const above = y < y0, odd = (x + y) % 2 === 0;
        if (above ? (y === y0 - 1 && odd) : (y === y0 && !odd)) px(x, y, above ? SKY[i] : SKY[i - 1]);
        if (above && y === y0 - 2 && odd && x % 2 === 0) px(x, y, SKY[i]);
        if (!above && y === y0 + 1 && !odd && x % 2 === 0) px(x, y, SKY[i - 1]);
      }
    }
    s.fillStyle = SKY[SKY.length - 1]; s.fillRect(0, horizon - 1, w, h - horizon + 1);
    // stars: mostly single pixels, thinning towards the horizon, a few bigger twinkles (kept as a list so they can move)
    const n = Math.round(w * h / 380);
    for (let i = 0; i < n; i++) {
      const x = Math.floor(r() * w), y = Math.floor(Math.pow(r(), 1.6) * horizon * .9);
      stars.push({ x, y, c: r() < .25 ? '#C3D0DE' : '#F3EFE6', big: r() < .06 });
    }
    // the one tomato star: the brand's small tilted square, upper right (the odd pixel)
    odd = { x: Math.round(w * .84) - 1, y: Math.round(horizon * .16), w: 5, h: 4 };
    // hills: sums of sines, flat colour with a one-pixel lit ridge; pines on the nearer layers
    const hc = hills.getContext('2d'), hp = (x, y, c) => dot(hc, x, y, c);
    HILLS.forEach(([body, ridge], L) => {
      const base = horizon + Math.round((h - horizon) * (L * .32)) - Math.round(h * .06), amp = h * (.05 + L * .015);
      const f1 = .008 + r() * .006, f2 = .021 + r() * .01, p1 = r() * 9, p2 = r() * 9, top = [];
      for (let x = 0; x < w; x++) top[x] = Math.round(base - amp * (Math.sin(x * f1 + p1) * .6 + Math.sin(x * f2 + p2) * .4 + 1) / 2);
      for (let x = 0; x < w; x++) { hc.fillStyle = body; hc.fillRect(x, top[x], 1, h - top[x]); hp(x, top[x], ridge); if (top[x - 1] > top[x] + 1) for (let y = top[x]; y < top[x - 1]; y++) hp(x, y, ridge); }
      if (L > 0) {
        const count = Math.round(w / (L === 2 ? 26 : 40));
        for (let t = 0; t < count; t++) {
          const tx = Math.floor(r() * w), th = Math.round((L === 2 ? 14 : 9) + r() * (L === 2 ? 10 : 6)), ty = top[Math.min(w - 1, tx)] + 2;
          for (let k = 0; k < th; k++) { const half = Math.floor((k + 2) / 3) + (k % 3 === 0 ? 0 : -1) + 1; hc.fillStyle = body; hc.fillRect(tx - half, ty - th + k, half * 2 + 1, 1); }
          hp(tx, ty - th - 1, body);
        }
      }
    });
    egg = null; paint();
  }

  function drawStar(ctx, x, y, st, c) { dot(ctx, x, y, c || st.c); if (st.big && !c) ['#5F80A4'].forEach(b => { dot(ctx, x - 1, y, b); dot(ctx, x + 1, y, b); dot(ctx, x, y - 1, b); dot(ctx, x, y + 1, b); }); }
  function drawOdd(ctx, x, y) { ODD.forEach((row, j) => [...row].forEach((c, i) => c === '#' && dot(ctx, x + i + (j < 2 ? 1 : 0), y + j, TOMATO))); }
  // the static wallpaper: sky, stars, the odd star, hills in front
  function paint() {
    const c = wall.getContext('2d');
    c.drawImage(sky, 0, 0); stars.forEach(st => drawStar(c, st.x, st.y, st)); drawOdd(c, odd.x, odd.y); c.drawImage(hills, 0, 0);
  }

  // ---------- the easter egg ----------
  function startEgg(onPeak) {
    if (egg) return;
    // targets: the emblem (white squares + the tilted tomato one), one star per cell, 4px apart, in the middle of the sky;
    // the big one if there are stars enough for every cell
    const count = rows => rows.join('').replace(/\./g, '').length, E = stars.length >= count(ODDOS_EMBLEM.large) ? ODDOS_EMBLEM.large : ODDOS_EMBLEM.small;
    const gap = 4, ew = E[0].length * gap, eh = E.length * gap;
    const ox = Math.round((W - ew) / 2), oy = Math.max(4, Math.round(H * .36 - eh / 2)), cells = [];
    E.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') cells.push({ x: ox + i * gap, y: oy + j * gap, odd: c === 'c' }); }));
    // each cell takes the nearest free star (the odd star itself heads for the tomato square)
    const free = stars.map((s, i) => i), moves = [];
    cells.forEach(cell => {
      let best = -1, bd = 1e9;
      free.forEach((si, k) => { const s = stars[si], d = (s.x - cell.x) ** 2 + (s.y - cell.y) ** 2; if (d < bd) { bd = d; best = k; } });
      if (best < 0) return;
      const si = free.splice(best, 1)[0]; moves.push({ s: stars[si], cell, delay: Math.random() * .35 });
    });
    egg = { t0: performance.now(), moves, peaked: false, onPeak };
    requestAnimationFrame(eggFrame);
  }
  const ease = k => k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
  function eggFrame(now) {
    const t = (now - egg.t0) / 1000, c = wall.getContext('2d'), GO = 1.4, HOLD = 3.2, BACK = 1.4, END = GO + HOLD + BACK + .4;
    c.drawImage(sky, 0, 0); c.drawImage(hills, 0, 0);
    const moving = new Set(egg.moves.map(m => m.s));
    stars.forEach(st => { if (!moving.has(st)) drawStar(c, st.x, st.y, st); });
    egg.moves.forEach(m => {
      const out = Math.max(0, Math.min(1, (t - m.delay) / GO)), back = Math.max(0, Math.min(1, (t - GO - HOLD - m.delay * .5) / BACK));
      const k = ease(out) * (1 - ease(back)), x = Math.round(m.s.x + (m.cell.x - m.s.x) * k), y = Math.round(m.s.y + (m.cell.y - m.s.y) * k);
      drawStar(c, x, y, m.s, m.cell.odd && k > .6 ? TOMATO : k > .6 ? '#F3EFE6' : null);
    });
    drawOdd(c, odd.x, odd.y);
    if (!egg.peaked && t > GO) { egg.peaked = true; egg.onPeak && egg.onPeak(); }
    if (t < END) requestAnimationFrame(eggFrame); else { egg = null; paint(); }
  }
  // is an art-pixel point on the odd star? (a couple of pixels of slack around it, or more for a fingertip)
  const hitsOdd = (x, y, slack = 2) => odd && x >= odd.x - slack && x <= odd.x + odd.w + slack && y >= odd.y - slack && y <= odd.y + odd.h + slack;

  window.Wallpaper = { draw, hitsOdd, egg: startEgg, get busy() { return !!egg; } };
})();
