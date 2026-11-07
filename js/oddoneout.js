// Odd one out: the hidden OddOS game. A grid of slate squares, one of them is different: find it.
// Endless and score-based. It keeps getting harder: the grid grows (up to 12x12), the clock shrinks, and the
// difference gets subtler (a lighter shade, then a bite out of a corner, a one-pixel shift, a single missing pixel).
// Points for every find, more for speed and depth. Three lives. Your last and best scores are remembered on this device;
// beat your best and you get a NEW HIGHEST SCORE.
// Usage: OddOneOut.mount(canvasElement) -> { show() }
(function () {
  const W = 128, H = 152, BY = 24, BOARD = 128, TOMATO = '#FF5A36', PAPER = '#F3EFE6', NIGHT = '#0F1318', INK = '#06080B';
  const BASE = '#294460', LIGHT = '#36597E';
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const text = (ctx, s, x, y, c, o) => BT.drawText(ctx, s, x, y, c, o), tw = (s, b) => BT.textWidth(s, b);
  const HEART = ['.#.#.', '#####', '#####', '.###.', '..#..'];
  const KEY = { best: 'oddos-ooo-best', last: 'oddos-ooo-last' };
  const store = { get: k => +(localStorage.getItem(KEY[k]) || 0), set: (k, v) => localStorage.setItem(KEY[k], v) };

  // ---------- sound: small square-wave blips, like the old desktop puzzle games. Quiet, and remembered when muted ----------
  // sound on/off is OddOS-wide (localStorage oddos-sound), read live so the Odd menu and the speaker stay in step
  let ac = null;
  const isMuted = () => localStorage.getItem('oddos-sound') === 'off';
  function blip(notes, { type = 'square', vol = .05, len = .07, gap = .07, slide = 0 } = {}) {
    if (isMuted()) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); } catch { return; }
    // let go of the audio device shortly after the last sound (no idle audio running between clicks)
    clearTimeout(blip.rest); blip.rest = setTimeout(() => ac.suspend(), (notes.length * gap + len) * 1000 + 300);
    notes.forEach((f, i) => {
      const t = ac.currentTime + i * gap, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + len);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + len);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + len + .02);
    });
  }
  const SFX = {
    start: () => blip([523, 784], { len: .06 }),
    hit: L => blip([660 * 2 ** ((L % 8) / 12), 990 * 2 ** ((L % 8) / 12)], { len: .05, gap: .045 }),   // creeps up the scale as you go
    miss: () => blip([180], { type: 'triangle', vol: .12, len: .16, slide: .5 }),
    tick: () => blip([1200], { vol: .015, len: .015 }),
    best: () => blip([784, 988, 1175], { len: .06, gap: .06, vol: .04 }),
    over: () => blip([392, 330, 262], { type: 'triangle', vol: .1, len: .14, gap: .14 }),
    record: () => blip([523, 659, 784, 1047, 784, 1047], { len: .08, gap: .09 }),
  };

  // difficulty for find number L (1, 2, 3, ...): never stops, just flattens out
  const gridFor = L => Math.min(12, 2 + Math.floor(Math.sqrt(L * 1.6)));
  const timeFor = L => Math.max(2200, 9000 - L * 180);
  function kindFor(L) {
    const pool = L < 4 ? ['shade'] : L < 9 ? ['shade', 'bite'] : L < 16 ? ['bite', 'shift', 'shade'] : ['bite', 'shift', 'pixel', 'pixel'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function mount(cv) {
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    let state = 'intro', L, lives, score, odd, kind, n, cell, deadline, flash = null, record = false, running = false, corner = 0;

    function deal() {
      n = gridFor(L); cell = Math.floor((BOARD - 2) / n);
      odd = Math.floor(Math.random() * n * n); kind = kindFor(L); corner = Math.floor(Math.random() * 4);
      deadline = performance.now() + timeFor(L);
    }
    let lastTick = 0, cheered = false;
    function start() { L = 1; lives = 3; score = 0; flash = null; record = false; cheered = false; state = 'play'; deal(); loop(); SFX.start(); }
    function end() {
      state = 'over'; const best = store.get('best');
      record = score > best && score > 0; if (record) store.set('best', score); store.set('last', score);
      record ? SFX.record() : SFX.over();
    }
    function miss() {   // show where it was, then deal again (or end)
      lives--; flash = { i: odd, until: performance.now() + 650, good: false }; SFX.miss();
      setTimeout(() => { flash = null; lives <= 0 ? end() : deal(); }, 650);
    }
    function loop() { if (!running) { running = true; requestAnimationFrame(draw); } }

    function square(i, t) {
      const off = Math.floor((BOARD - n * cell) / 2), s = cell - 2;
      const gx = off + (i % n) * cell + 1, gy = BY + off + Math.floor(i / n) * cell + 1, isOdd = i === odd && state === 'play';
      const lit = flash && flash.i === i;
      let c = BASE, dx = 0, dy = 0, w = s, h = s;
      if (isOdd && !lit) { if (kind === 'shade') c = LIGHT; if (kind === 'shift') { dx = 1; dy = 1; w--; h--; } }
      if (lit) c = flash.good ? TOMATO : '#C3D0DE';
      px(ctx, gx + dx, gy + dy, c, w, h);
      if (isOdd && !lit && (kind === 'bite' || kind === 'pixel')) {
        const b = kind === 'pixel' || s < 8 ? 1 : 2, cx = corner & 1 ? gx + s - b : gx, cy = corner & 2 ? gy + s - b : gy;
        px(ctx, cx, cy, NIGHT, b, b);   // a bite out of one corner
      }
    }
    function draw() {
      const t = performance.now();
      px(ctx, 0, 0, NIGHT, W, H);
      if (state === 'intro') {
        n = 3; cell = 42; odd = -1;
        for (let i = 0; i < 9; i++) square(i, t);
        px(ctx, 8, BY + 30, INK, W - 16, 58); px(ctx, 9, BY + 31, '#1E252E', W - 18, 56);
        const a = 'Odd one out', b = `Best ${store.get('best')}`, c = `Last time ${store.get('last')}`, d = 'Click to start';
        text(ctx, a, (W - tw(a, true)) >> 1, BY + 36, PAPER, { bold: true });
        text(ctx, b, (W - tw(b)) >> 1, BY + 50, '#8AA4C0'); text(ctx, c, (W - tw(c)) >> 1, BY + 62, '#8AA4C0');
        if (Math.floor(t / 600) % 2 === 0) text(ctx, d, (W - tw(d)) >> 1, BY + 76, '#C3D0DE');
      } else {
        // header: score and lives, the clock, best so far
        text(ctx, String(score), 2, 2, PAPER, { bold: true, scale: 2 });
        for (let l = 0; l < 3; l++) HEART.forEach((r, y) => [...r].forEach((c, x) => c === '#' && px(ctx, W - 20 + l * 6 + x, 3 + y, l < lives ? '#C3D0DE' : '#34404D')));
        const beat = state === 'play' && store.get('best') > 0 && score > store.get('best');   // passed the record mid-game
        const bl = beat ? 'new best!' : 'best ' + store.get('best'); text(ctx, bl, W - tw(bl) - 2, 10, beat ? TOMATO : '#66737F');
        if (state === 'play') {
          const left = Math.max(0, deadline - t) / timeFor(L);
          px(ctx, 2, 18, '#28313C', W - 4, 3); px(ctx, 2, 18, left < .25 ? '#C3D0DE' : '#8AA4C0', Math.round((W - 4) * left), 3);
          if (t > deadline && !flash) miss();
          if (left < .25 && left > 0 && !flash && t - lastTick > 330) { lastTick = t; SFX.tick(); }   // the clock ticks when time is short
        }
        for (let i = 0; i < n * n; i++) square(i, t);
        if (state === 'over') {
          px(ctx, 6, BY + 26, INK, W - 12, 66); px(ctx, 7, BY + 27, '#1E252E', W - 14, 64);
          const a = 'Score ' + score; text(ctx, a, (W - tw(a, true)) >> 1, BY + 32, PAPER, { bold: true });
          if (record) { const c = Math.floor(t / 400) % 2 ? PAPER : TOMATO, r1 = 'NEW HIGHEST', r2 = 'SCORE!'; text(ctx, r1, (W - tw(r1, true)) >> 1, BY + 46, c, { bold: true }); text(ctx, r2, (W - tw(r2, true)) >> 1, BY + 57, c, { bold: true }); }
          else { const b = 'Best ' + store.get('best'); text(ctx, b, (W - tw(b)) >> 1, BY + 50, '#8AA4C0'); }
          const c = 'Click to play again'; text(ctx, c, (W - tw(c)) >> 1, BY + 74, '#C3D0DE');
        }
      }
      if (cv.isConnected && cv.offsetParent) requestAnimationFrame(draw); else running = false;
    }

    cv.addEventListener('pointerdown', e => {
      if (state !== 'play') return start();
      if (flash) return;
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
      const off = Math.floor((BOARD - n * cell) / 2), col = Math.floor((x - off) / cell), row = Math.floor((y - BY - off) / cell);
      if (col < 0 || row < 0 || col >= n || row >= n) return;
      const i = row * n + col;
      if (i === odd) {
        score += 10 + L + Math.ceil(Math.max(0, deadline - performance.now()) / 1000) * 2;   // depth plus speed
        flash = { i, until: performance.now() + 300, good: true }; SFX.hit(L);
        if (!cheered && store.get('best') > 0 && score > store.get('best')) { cheered = true; setTimeout(SFX.best, 140); }
        setTimeout(() => { flash = null; L++; deal(); }, 300);
      } else miss();
    });
    return { show() { state = state === 'play' ? 'play' : 'intro'; loop(); },
      get muted() { return isMuted(); }, mute(m) { localStorage.setItem('oddos-sound', m ? 'off' : 'on'); if (!m) SFX.hit(0); } };
  }
  window.OddOneOut = { mount };
})();
