// Odd·Vision, a CRT TV drawn as pixel art. Casing and screen are canvases at art resolution. Channels:
// 1 the studio avatar, 2 Dice Dice Battles, 3 live cuts from its fights, 4 no signal
// (mostly: see "the odd hour").
// The game's art is shown at its native resolution (one game pixel = one art pixel), only in text-free areas
// (the game draws its text on a finer grid, which doesn't survive the reduction).
// Usage: PixelTV.mount(element, { art: 'path/to/art/' }) -> { tune(i), next(), prev(), power() }
(function () {
  const SW = 128, SH = 96, TOMATO = '#FF5A36', PAPER = '#F3EFE6', NIGHT = '#0F1318', INK = '#06080B';
  const C = { out: INK, body: '#1E252E', lit: '#34404D', shade: '#161B22', bezel: NIGHT, ant: '#C3D0DE', label: '#66737F' };
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  // stepped round corners: how far row j of an h-tall box with radius r is inset
  const inset = (j, h, r) => { const d = j < r ? r - j : j >= h - r ? j - (h - r - 1) : 0; return d ? r - Math.round(Math.sqrt(r * r - (d - .5) * (d - .5))) : 0; };
  function rrect(ctx, x, y, w, h, r, c) { for (let j = 0; j < h; j++) { const i = inset(j, h, r); px(ctx, x + i, y + j, c, w - i * 2, 1); } }
  function line(ctx, x0, y0, x1, y1, c) {   // Bresenham
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (;;) { px(ctx, x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  const text = (ctx, s, x, y, c, o) => BT.drawText(ctx, s, x, y, c, o), tw = (s, b, k) => BT.textWidth(s, b, k);

  // ---------- the set: size, where the screen sits, and how the casing is drawn ----------
  const SKINS = {
    crt: { name: 'CRT', W: 148, H: 143, SX: 10, SY: 26, scan: true, osd: true,
      draw(ctx, st) {
        const W = 148, CY = 18, CH = 122, mx = W / 2, wig = st.wiggle;
        line(ctx, mx - 2, CY - 2, mx - 22 + wig, 3, C.ant); line(ctx, mx + 2, CY - 2, mx + 18 - wig, 5, C.ant);
        px(ctx, mx - 24 + wig, 1, '#8AA4C0', 3, 3); px(ctx, mx + 17 - wig, 3, PAPER, 3, 3);
        rrect(ctx, mx - 9, CY - 4, 18, 6, 3, C.out); rrect(ctx, mx - 8, CY - 3, 16, 5, 2, C.body);
        px(ctx, 22, CY + CH - 1, C.out, 14, 4); px(ctx, W - 36, CY + CH - 1, C.out, 14, 4);
        px(ctx, 23, CY + CH - 1, C.body, 12, 3); px(ctx, W - 35, CY + CH - 1, C.body, 12, 3);
        rrect(ctx, 0, CY, W, CH, 10, C.out); rrect(ctx, 1, CY + 1, W - 2, CH - 2, 9, C.body);
        // top highlight: the body's own top rows, so it follows the rounded corner instead of poking out
        for (let j = 0; j < 3; j++) { const i = inset(j, CH - 2, 9); px(ctx, 1 + i, CY + 1 + j, C.lit, W - 2 - i * 2, 1); }
        px(ctx, 8, CY + CH - 3, C.shade, W - 16, 1);
        rrect(ctx, 7, 23, SW + 6, SH + 6, 8, C.out); rrect(ctx, 8, 24, SW + 4, SH + 4, 7, C.bezel);
        text(ctx, 'ODD·VISION', 10, 128, C.label, { bold: true });
        for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 2; gy++) px(ctx, W - 46 + gx * 4, 128 + gy * 4, C.out, 2, 2);
        const led = st.on ? (st.odd ? TOMATO : '#5DA35E') : '#C23A1C';   // tomato on the last channel in the odd hour
        px(ctx, W - 18, 129, led, 3, 3); px(ctx, W - 18, 129, st.on ? PAPER : '#C23A1C', 1, 1);
      } },
  };

  // ---------- channels, drawn into the 128x96 screen ----------
  // live cuts: spots from four fights (Fortuna, the Pit Boss, the Fates, the Fool's encore)
  const CUTS = [['shot-01_fortuna.png', 350, 48], ['shot-02_pitboss.png', 305, 54], ['shot-03_fates.png', 300, 50], ['shot-04_abbot.png', 60, 50]];
  const CH = [
    { name: 'Odd Pixel Labs', imgs: ['tv-avatar.png'], draw(ctx, t, I) { ctx.drawImage(I['tv-avatar.png'], 0, 0); } },
    { name: 'Dice Dice Battles, on Steam', imgs: ['hero.png'], draw(ctx, t, I, st) {
      ctx.drawImage(I['hero.png'], 70, 59, SW, SH, 0, 0, SW, SH);   // the four champions and the first die
      // ON STEAM blinks from the start (the channel number draws on top while it shows)
      if (Math.floor(t / 650) % 2 === 0) { const w = tw('ON STEAM', true); px(ctx, 5, 5, TOMATO, w + 6, 11); text(ctx, 'ON STEAM', 8, 7, NIGHT, { bold: true }); }
    } },
    { name: 'LIVE: Dice Dice Battles', imgs: [...new Set(CUTS.map(c => c[0]))], draw(ctx, t, I) {
      const k = Math.floor(t / 2400) % CUTS.length, [img, x, y] = CUTS[k];
      if (t % 2400 < 70) { noise(ctx); return; }   // a quick cut
      ctx.drawImage(I[img], x, y, SW, SH, 0, 0, SW, SH);
      const w = tw('LIVE', true); px(ctx, 5, SH - 16, TOMATO, w + 12, 11); text(ctx, 'LIVE', 14, SH - 14, NIGHT, { bold: true });
      if (Math.floor(t / 500) % 2 === 0) px(ctx, 8, SH - 12, NIGHT, 3, 3);   // the blinking dot
    } },
    { name: 'No signal', imgs: [], odd: true, draw(ctx, t, I, st) {
      if (st.odd) return oddHour.call(this, ctx, st);
      noSignal(ctx);
    } },
  ];
  const GREYS = [INK, '#1E252E', '#34404D', '#66737F', '#96A1AB', '#C3D0DE', PAPER];
  function noise(ctx, keep = 1) { for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x += 2) px(ctx, x, y, Math.random() < keep ? GREYS[Math.random() * GREYS.length | 0] : INK, 2, 1); }
  const noSignal = (ctx, keep = 1) => { noise(ctx, keep); if (Math.random() < keep) text(ctx, 'NO SIGNAL', (SW - tw('NO SIGNAL', true)) >> 1, (SH >> 1) - 4, PAPER, { bold: true, shadow: INK }); };

  // ---------- the odd hour: on channel 4, between 00:00 and 00:59 (or with ?oddhour), the static isn't empty ----------
  // It settles, and the odd pixel from the lab's jar is in there. It beats, it talks, it opens an eye that follows your
  // pointer, then the picture tears and it's static again. 24 seconds, from the moment you tune in, then round again.
  const isOddHour = () => /[?&]oddhour/.test(location.search) || new Date().getHours() === 0;
  const LINES = [[5.2, "IT'S THE ODD HOUR."], [8.2, 'THE CATS ARE ASLEEP.'], [11.2, 'I GOT OUT OF THE JAR.'], [15, 'I CAN SEE YOU.'], [18.4, "DON'T TELL THEM."]];
  const EYE = ['....#####....', '..#########..', '.###########.', '#############', '.###########.', '..#########..', '....#####....'];
  function oddHour(ctx, st) {
    const u = st.since % 24, cx = SW >> 1, cy = 38, at = T => this.last < T && u >= T;   // at(T): crossed T since the last frame
    if (this.last === undefined || u < this.last) this.last = -1;
    if (at(3.8) || at(4.4) || at(12.2)) st.sfx('beat');
    if (at(21.6)) st.sfx('glitch');
    this.last = u;
    if (u < 1.8 || u >= 22.6) return noSignal(ctx);                              // nothing to see here
    if (u < 2.6) return noSignal(ctx, 1 - (u - 1.8) / .8);                       // the static settles
    px(ctx, 0, 0, INK, SW, SH);
    if (u < 3.2) return;
    if (u < 11.8) {                                                               // the odd pixel, two heartbeats
      const beat = (u > 3.8 && u < 3.95) || (u > 4.4 && u < 4.55);
      if (beat) { px(ctx, cx - 1, cy, TOMATO, 3, 1); px(ctx, cx, cy - 1, TOMATO, 1, 3); } else px(ctx, cx, cy, TOMATO);
    } else {                                                                      // ...opens an eye
      const open = Math.min(1, (u - 11.8) / .4), blink = u > 12.4 && (u - 12.4) % 2.7 < .12, half = blink ? 0 : Math.round(open * 3);
      const [lx, ly] = st.look, dx = Math.max(-3, Math.min(3, Math.round(lx * 3))), dy = Math.max(-1, Math.min(1, Math.round(ly)));
      EYE.forEach((r, y) => [...r].forEach((p, x) => {
        if (p !== '#' || Math.abs(y - 3) > half) return;
        const ix = x - 6 - dx, iy = y - 3 - dy, iris = Math.abs(ix) <= 1 && Math.abs(iy) <= 1;
        px(ctx, cx - 19 + x * 3, cy - 10 + y * 3, ix === 0 && iy === 0 ? INK : iris ? TOMATO : '#C3D0DE', 3, 3);   // at 3x
      }));
      if (!half) px(ctx, cx - 16, cy - 1, '#C3D0DE', 33, 3);                     // shut: just the lid
    }
    // what it says, typed in, a line at a time
    const line = LINES.filter(([s]) => u >= s).pop();
    if (line) { const s = line[1].slice(0, Math.floor((u - line[0]) * 14)); text(ctx, s, (SW - tw(line[1])) >> 1, 60, '#96A1AB'); }
    if (u >= 21.6) {                                                              // the picture tears
      for (let y = 0; y < SH; y++) if (Math.random() < .35) ctx.drawImage(ctx.canvas, 0, y, SW, 1, Math.round((Math.random() - .5) * 24), y, SW, 1);
      for (let i = 0; i < 6; i++) px(ctx, 0, Math.random() * SH | 0, Math.random() < .5 ? TOMATO : PAPER, SW, 1);
    }
  }

  // CRT roll: a soft band drifts down the screen, nudging its rows one pixel sideways
  function roll(ctx, t) {
    const period = 7000, band = 9, y0 = Math.floor((t % period) / period * (SH + band * 2)) - band;
    for (let y = Math.max(0, y0); y < Math.min(SH, y0 + band); y++) {
      const k = y - y0;
      // shift the row by copying the canvas onto itself (reading pixels back is blocked for local files)
      if (k > 1 && k < band - 2) ctx.drawImage(ctx.canvas, 0, y, SW - 1, 1, 1, y, SW - 1, 1);
      ctx.fillStyle = `rgba(243,239,230,${k === 0 || k === band - 1 ? .03 : .06})`; ctx.fillRect(0, y, SW, 1);
    }
  }

  function mount(el, { art = '', skin = 'crt' } = {}) {
    el.classList.add('ptv');
    el.innerHTML = '<canvas class="ptv-case"></canvas><canvas class="ptv-screen" width="' + SW + '" height="' + SH + '"></canvas>';
    const cv = el.querySelector('.ptv-case'), cc = cv.getContext('2d'), scv = el.querySelector('.ptv-screen'), sc = scv.getContext('2d');
    const I = {}; CH.forEach(c => c.imgs.forEach(f => { if (!I[f]) { I[f] = new Image(); I[f].src = art + f; } }));
    const ready = c => c.imgs.every(f => I[f].complete && I[f].naturalWidth);
    let cur = 0, on = true, staticUntil = 0, osdUntil = 0, wiggleUntil = 0, offAnim = null, S, tunedAt = performance.now(), look = [0, 0], pointed = 0;
    const shot = location.search.includes('shot');
    function setSkin(name) {
      skin = name in SKINS ? name : 'crt'; S = SKINS[skin];
      cv.width = S.W; cv.height = S.H; Object.assign(el.style, { position: 'relative', width: S.W + 'px', height: S.H + 'px' });
      Object.assign(scv.style, { left: S.SX + 'px', top: S.SY + 'px' });
      el.dispatchEvent(new CustomEvent('skin', { detail: skin }));
    }
    setSkin(skin);
    // where the pointer is, seen from the screen (-1..1 across the window), for the odd hour's eye; it wanders without one
    addEventListener('pointermove', e => { const r = scv.getBoundingClientRect(), k = v => Math.max(-1, Math.min(1, v)); look = [k((e.clientX - r.left - r.width / 2) / (innerWidth / 3)), k((e.clientY - r.top - r.height / 2) / (innerHeight / 3))]; pointed = performance.now(); });
    function frame() {
      const t = performance.now(), st = { t, on, cur, title: CH[cur].name, wiggle: t < wiggleUntil ? (Math.floor(t / 80) % 2 ? 2 : -2) : 0, osdShowing: S.osd && t < osdUntil,
        odd: !!CH[cur].odd && isOddHour(), since: (t - tunedAt) / 1000, look: t - pointed < 4000 ? look : [Math.sin(t / 1700), Math.sin(t / 2300) * .6], sfx };
      cc.clearRect(0, 0, S.W, S.H); S.draw(cc, st);
      if (offAnim) offAnim(t);
      else if (!on) px(sc, 0, 0, INK, SW, SH);
      else if (t < staticUntil) noise(sc);
      else {
        const c = CH[cur];
        if (ready(c)) c.draw(sc, t, I, st); else px(sc, 0, 0, INK, SW, SH);
        if (st.osdShowing) { const s = 'CH ' + (st.odd ? '0DD' : String(cur + 1).padStart(2, '0')); text(sc, s, SW - tw(s, true, 2) - 6, 6, PAPER, { bold: true, scale: 2, shadow: INK }); }
      }
      if (S.scan && (on || offAnim)) {
        if (on && !offAnim && !shot) roll(sc, t);
        sc.fillStyle = 'rgba(6,8,11,.22)'; for (let y = 1; y < SH; y += 2) sc.fillRect(0, y, SW, 1);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    function tune(i) {
      if (!on) power(); else sfx('tune');
      cur = (i + CH.length) % CH.length; const t = performance.now(); tunedAt = t;
      staticUntil = shot ? 0 : t + 260; osdUntil = shot ? 0 : t + 1800; wiggleUntil = t + 400;
      el.dispatchEvent(new CustomEvent('tune', { detail: cur }));
    }
    // sounds only after the visitor has interacted (browsers block audio before that anyway)
    const sfx = k => { if (window.TVSound && navigator.userActivation?.hasBeenActive) TVSound[k](); };
    function power() {
      const t0 = performance.now(), wasOn = on && !offAnim;
      sfx(wasOn ? 'off' : 'on');
      if (on && S.scan) {   // a CRT squashes to a line, then a dot
        offAnim = t => { const k = (t - t0) / 380; if (k >= 1) { offAnim = null; on = false; return; }
          px(sc, 0, 0, INK, SW, SH); const h = Math.max(1, Math.round(SH * (1 - k * 2))), w = k < .5 ? SW : Math.max(2, Math.round(SW * (1 - (k - .5) * 2)));
          px(sc, (SW - w) >> 1, (SH - h) >> 1, PAPER, w, h); };
      } else if (on) on = false;
      else { on = true; staticUntil = t0 + 300; }
      el.dispatchEvent(new CustomEvent('power', { detail: { on: !wasOn } }));
    }
    return { tune, next: () => tune(cur + 1), prev: () => tune(cur - 1), power, skin: setSkin,
      get channel() { return cur; }, get on() { return on && !offAnim; }, get skinName() { return skin; }, get width() { return S.W; },
      channels: CH.map(c => c.name), skins: Object.keys(SKINS).map(k => [k, SKINS[k].name]) };
  }
  window.PixelTV = { mount };
})();
