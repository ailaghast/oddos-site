// OddOS: pixel scale, wallpaper, windows, taskbar, pocket mode for phones, reading mode.
// The whole OS lives in #os, measured in art pixels; scale() picks a whole number of DEVICE pixels per art pixel
// (so it stays exact on 125%/150% Windows scaling and on phones). Layout happens at true art-pixel size and one
// transform: scale() maps it to the screen: CSS zoom would round sizes to device pixels at fractional ratios.
(function () {
  const os = document.getElementById('os'), $ = (s, r = os) => r.querySelector(s), $$ = (s, r = os) => [...r.querySelectorAll(s)];
  const q = new URLSearchParams(location.search), shot = q.has('shot');
  const touch = matchMedia('(hover: none)').matches || q.has('touch');
  const TASK = 17;
  let N = 2, Z = 2, AW = 0, AH = 0, z = 20;

  // ---------- scale & screen ----------
  // Pixel size = how many art pixels wide the screen aims to be: [desktop, phone]. Medium (default) is about 640 on a
  // desktop: 3x on 1080p, 4x on 1440p, 5x on a Retina MacBook. Only whole multiples are allowed, so on some screens two
  // sizes come out the same; the menu skips those.
  const SIZES = { large: [480, 200], medium: [640, 240], small: [960, 300] }, ORDER = Object.keys(SIZES);
  let size = SIZES[q.get('px')] ? q.get('px') : SIZES[localStorage.getItem('oddos-px')] ? localStorage.getItem('oddos-px') : 'medium';
  function multiple(s) {
    const dpr = devicePixelRatio || 1, dw = innerWidth * dpr, dh = innerHeight * dpr, [wDesk, wPhone] = SIZES[s];
    return Math.max(1, innerWidth < 700 ? Math.round(dw / wPhone) : Math.min(Math.round(dw / wDesk), Math.floor(dh / 260)));   // keep at least 260 rows
  }
  function scale() {
    const dpr = devicePixelRatio || 1;
    N = +(q.get('n') || multiple(size)); Z = N / dpr;
    os.style.transform = `scale(${Z})`;
    AW = Math.floor(innerWidth / Z); AH = Math.floor(innerHeight / Z);
    os.style.width = AW + 'px'; os.style.height = AH + 'px';
    const wall = $('.wall'); Wallpaper.draw(wall, AW, AH); wall.style.width = AW + 'px'; wall.style.height = AH + 'px';
  }
  // stepped glass corners
  function corners() {
    const R = ['111111', '1111..', '111...', '11....', '1.....', '1.....'];
    [['left', 'top', 1, 1], ['right', 'top', -1, 1], ['left', 'bottom', 1, -1], ['right', 'bottom', -1, -1]].forEach(([h, v, fx, fy]) => {
      const c = document.createElement('canvas'); c.width = c.height = 6; c.className = 'corner'; c.style[h] = 0; c.style[v] = 0;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#06080B';
      R.forEach((row, y) => [...row].forEach((p, x) => p === '1' && ctx.fillRect(fx > 0 ? x : 5 - x, fy > 0 ? y : 5 - y, 1, 1)));
      os.appendChild(c);
    });
  }
  function sprite(rows, color = '#F3EFE6') {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    const ctx = c.getContext('2d'); ctx.fillStyle = color;
    rows.forEach((r, y) => [...r].forEach((p, x) => p === '#' && ctx.fillRect(x, y, 1, 1)));
    return c;
  }
  const SPR = {
    close: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], mini: ['.....', '.....', '.....', '.....', '#####'],
    power: ['..#..', '#.#.#', '#.#.#', '#...#', '.###.'], prev: ['..#', '.##', '###', '.##', '..#'], next: ['#..', '##.', '###', '##.', '#..'],
  };
  function emblems() {
    $$('.emb').forEach(c => { const E = ODDOS_EMBLEM.small; c.width = E[0].length; c.height = E.length; const ctx = c.getContext('2d');
      E.forEach((r, y) => [...r].forEach((p, x) => { if (p === '.') return; ctx.fillStyle = p === 'c' ? '#FF5A36' : '#F3EFE6'; ctx.fillRect(x, y, 1, 1); })); });
  }

  // ---------- windows ----------
  const wins = Object.fromEntries($$('.win').map(w => [w.id.slice(2), w]));
  const pocket = () => os.classList.contains('pocket');
  for (const [name, w] of Object.entries(wins)) {
    const tb = document.createElement('div'); tb.className = 'tb';
    tb.innerHTML = `<button class="back" aria-label="Back to home"><span data-bt="fit"><b>‹ Home</b></span></button>
      <img src="art/icons16/${w.dataset.icon}.png" alt=""><span class="title" data-bt="fit"><b>${w.dataset.title}</b></span>
      <button class="tbtn mini" aria-label="Minimise"></button><button class="tbtn x" aria-label="Close"></button>`;
    w.prepend(tb);
    tb.querySelector('.mini').appendChild(sprite(SPR.mini)); tb.querySelector('.x').appendChild(sprite(SPR.close));
    tb.querySelector('.mini').onclick = e => { e.stopPropagation(); w.classList.remove('open'); syncTabs(); };
    tb.querySelector('.x').onclick = e => { e.stopPropagation(); close(name); };
    tb.querySelector('.back').onclick = () => history.state?.app ? history.back() : close(name);
    w.addEventListener('pointerdown', () => !pocket() && front(name));
    // drag by the title bar in whole art pixels, never off screen
    tb.addEventListener('pointerdown', e => {
      if (pocket() || os.classList.contains('plain') || e.target.closest('button')) return;
      const x0 = e.clientX, y0 = e.clientY, l0 = w.offsetLeft, t0 = w.offsetTop; tb.setPointerCapture(e.pointerId); tb.style.cursor = 'grabbing';
      tb.onpointermove = ev => place(w, l0 + Math.round((ev.clientX - x0) / Z), t0 + Math.round((ev.clientY - y0) / Z));
      tb.onpointerup = () => { tb.onpointermove = null; tb.style.cursor = ''; };
    });
  }
  function place(w, x, y) {
    w.style.left = Math.max(0, Math.min(x, AW - w.offsetWidth - 2)) + 'px';
    w.style.top = Math.max(0, Math.min(y, AH - TASK - 14)) + 'px';
  }
  function fitWin(w) {
    // data-at="x,y,width" for a 640x343 desktop; x only stretches (never squeezes into the icons), y scales with height;
    // a negative x anchors the window to the right edge
    const [x, y, wd] = w.dataset.at.split(',').map(Number), kx = Math.max(1, AW / 640), ky = (AH - TASK) / 343;
    w.style.width = Math.min(wd, AW - 6) + 'px';
    place(w, x < 0 ? AW - w.offsetWidth + x : Math.round(x * kx), Math.round(y * ky));
    w.style.maxHeight = (AH - TASK - 2 - w.offsetTop) + 'px';
  }
  function front(name) {
    const w = wins[name]; w.style.zIndex = ++z;
    $$('.win').forEach(x => { const was = x.classList.contains('front'); x.classList.toggle('front', x === w); if (was !== (x === w)) $$('.tb [data-bt]', x).forEach(BT.render); });
    syncTabs();
  }
  function open(name) {
    const w = wins[name]; if (!w) return;   // unknown names (old links) do nothing
    if (!w.classList.contains('open') && !w.dataset.tab && !pocket()) { w.classList.add('open'); fitWin(w); }
    w.classList.add('open'); w.dataset.tab = '1'; front(name); $('#menu').classList.remove('open');
    BT.scan(w);
    if (pocket()) { $$('.win').forEach(x => x !== w && x.classList.remove('open')); if (!history.state?.app && !shot) history.pushState({ app: name }, ''); }
    if (name === 'odd') game.show();
    if (name === 'amp') amp.show();
    if (name === 'tv') centreControls();
    snap();
  }
  function close(name) { const w = wins[name]; w.classList.remove('open'); w.dataset.tab = ''; syncTabs(); if (name === 'amp') amp.stop(); }
  addEventListener('popstate', () => { if (pocket()) $$('.win.open').forEach(w => close(w.id.slice(2))); });
  function syncTabs() {
    const tabs = $('#tabs'); tabs.innerHTML = '';
    for (const [name, w] of Object.entries(wins)) if (w.dataset.tab) {
      const b = document.createElement('button');
      b.className = w.classList.contains('front') && w.classList.contains('open') ? 'front' : '';
      b.innerHTML = `<span data-bt="fit">${w.dataset.title}</span>`; b.onclick = () => open(name); tabs.appendChild(b);
    }
    BT.scan(tabs);
  }

  // ---------- desktop icons ----------
  $$('.ico').forEach(i => {
    i.onclick = e => {
      open(i.dataset.win);   // one click, tap or Enter opens
    };
  });
  os.addEventListener('click', e => { const b = e.target.closest('[data-win]:not(.ico)'); if (b) open(b.dataset.win); });
  $('#start').onclick = () => { $('#menu').classList.toggle('open'); BT.scan($('#menu')); };
  $$('[data-act="plain"]').forEach(b => b.onclick = () => { os.classList.add('plain'); $('#menu').classList.remove('open'); $$('.win').forEach(w => BT.scan(w)); os.scrollTop = 0; snap(); });
  $('[data-act="desktop"]').onclick = () => { os.classList.remove('plain'); mode(true); };
  $('[data-act="crt"]').onclick = () => $('.glass').classList.toggle('off');
  // pixel size: chunky / medium / fine, remembered on this device
  // the menu item's die shows the size: 1 pip small, 2 medium, 3 large
  function sizeDie() {
    const c = $('.pxdie').getContext('2d'), pips = { small: [[7, 7]], medium: [[4, 4], [10, 10]], large: [[3, 3], [7, 7], [11, 11]] }[size];
    c.clearRect(0, 0, 16, 16); c.fillStyle = '#06080B'; c.fillRect(1, 1, 14, 14); c.fillStyle = '#F3EFE6'; c.fillRect(2, 2, 12, 12);
    c.fillStyle = '#294460'; pips.forEach(([x, y]) => c.fillRect(x, y, 2, 2));
  }
  const sizeLabel = () => { const s = $('[data-act="px"] [data-bt]'); (s.querySelector('.sr') || s).textContent = 'Pixel size: ' + size; BT.render(s); sizeDie(); };
  $('[data-act="px"]').onclick = () => {
    // next size that actually looks different on this screen
    for (let k = 1; k < ORDER.length; k++) { const s = ORDER[(ORDER.indexOf(size) + k) % ORDER.length]; if (multiple(s) !== N) { size = s; break; } }
    localStorage.setItem('oddos-px', size);
    scale(); mode(true); BT.rerenderAll(); sizeLabel(); snap();
  };
  addEventListener('keydown', e => {
    if (/INPUT/.test(e.target.tagName)) return;
    if (lb.classList.contains('open')) {
      if (e.key === 'Escape') shots(false); if (e.key === 'ArrowRight') showShot(1); if (e.key === 'ArrowLeft') showShot(-1);
      return;
    }
    if (e.key === 'Escape') {
      if ($('#menu').classList.contains('open')) return $('#menu').classList.remove('open');
      const top = $$('.win.open').sort((a, b) => b.style.zIndex - a.style.zIndex)[0]; if (top) close(top.id.slice(2));
    }
    if (wins.tv.classList.contains('open')) {
      if (e.key === 'ArrowRight') tv.next(); if (e.key === 'ArrowLeft') tv.prev();
      if (e.key >= '1' && e.key <= String(tv.channels.length)) tv.tune(+e.key - 1);
    }
  });

  // ---------- the TV ----------
  const tv = PixelTV.mount($('#ptv'), { art: 'art/' }), ctl = $('.tvctl');
  tv.channels.forEach((name, i) => { const b = document.createElement('button'); b.setAttribute('aria-label', 'Channel ' + (i + 1) + ': ' + name); b.innerHTML = `<span data-bt="fit" data-exact>${i + 1}</span>`; b.onclick = () => tv.tune(i); ctl.appendChild(b); });
  ctl.insertAdjacentHTML('beforeend', '<i class="gap"></i>');
  [['prev', () => tv.prev(), 'Previous channel'], ['next', () => tv.next(), 'Next channel'], ['power', () => tv.power(), 'Power']].forEach(([s, f, label], k) => {
    if (k === 2) ctl.insertAdjacentHTML('beforeend', '<i class="gap"></i>');
    const b = document.createElement('button'); b.setAttribute('aria-label', label); b.appendChild(sprite(SPR[s], '#C3D0DE')); b.onclick = f; ctl.appendChild(b);
  });
  const markChannel = () => [...ctl.querySelectorAll('button')].slice(0, tv.channels.length).forEach((b, i) => { b.classList.toggle('cur', i === tv.channel); BT.render(b.firstChild); });
  $('#ptv').addEventListener('tune', markChannel);

  // ---------- screenshots: full screen, the original 1920x1080 files ----------
  // Both games draw their text on a finer grid than their art, so the shots are shown from the originals, not reduced.
  // Sized in real screen pixels: a whole multiple when the screen is big enough (1:1 on a 1080p screen), otherwise
  // scaled down smoothly to fit, like a photo. Each game's Screenshots button names its set (data-game).
  const GAMES = {
    ddb: { name: 'Dice Dice Battles', dir: 'shots-ddb', shots: [['01_fortuna', 'Fortuna'], ['02_pitboss', 'The Pit Boss'], ['03_fates', 'The Fates'], ['04_abbot', 'The Abbot'], ['05_shop', 'The shop'], ['06_stamp', 'Stamping a die'], ['07_notch', 'Notching a face'], ['08_rivals', 'Rivals'], ['09_champion', 'Champions'], ['10_compendium', 'The Compendium']] },
  };
  const lb = $('.lightbox'), lbimg = $('.lbimg');
  let shotSet = GAMES.ddb, SHOTS = shotSet.shots, shotI = 0;
  function fitShot() {
    const dpr = devicePixelRatio || 1, dw = AW * Z * dpr, dh = AH * Z * dpr, s = Math.min(dw / 1920, dh / 1080), k = s >= 1 ? Math.floor(s) : s;
    const w = 1920 * k / dpr / Z, h = 1080 * k / dpr / Z;   // in art pixels (may be fractional; it's a photo)
    Object.assign(lbimg.style, { width: w + 'px', height: h + 'px', left: (AW - w) / 2 + 'px', top: (AH - h) / 2 + 'px', imageRendering: k >= 1 ? 'pixelated' : 'auto' });
  }
  function showShot(d) {
    shotI = (shotI + d + SHOTS.length) % SHOTS.length;
    lbimg.src = `assets/${shotSet.dir}/${SHOTS[shotI][0]}.png`; lbimg.alt = shotSet.name + ': ' + SHOTS[shotI][1];
    const label = $('.shotname'); label.innerHTML = ''; label._bt = false; label.textContent = `${shotI + 1}/${SHOTS.length} · ${SHOTS[shotI][1]}`; BT.attach(label);
  }
  function shots(on, id = 'ddb') {
    if (on && GAMES[id] && GAMES[id] !== shotSet) { shotSet = GAMES[id]; SHOTS = shotSet.shots; shotI = 0; }   // another game starts at its first shot
    lb.classList.toggle('open', on); if (on) { lb.setAttribute('aria-label', shotSet.name + ' screenshots'); fitShot(); showShot(0); BT.scan(lb); snap(); }
  }
  $$('[data-shot]').forEach(b => b.onclick = e => { e.stopPropagation(); showShot(+b.dataset.shot); });
  $$('[data-act="shots"]').forEach(b => b.onclick = () => shots(true, b.dataset.game));
  $('.lbclose').onclick = e => { e.stopPropagation(); shots(false); };
  $('.lbx').appendChild(sprite(SPR.close, '#C3D0DE')); $('.lbx').onclick = e => { e.stopPropagation(); shots(false); };
  lbimg.onclick = () => showShot(1);

  // ---------- the hidden game ----------
  const game = OddOneOut.mount($('.oddgame'));
  const amp = OddAmp.mount($('.amp'));
  const trailer = Trailer.mount($('.theatre'), { getScale: () => ({ Z, AW, AH }), openApp: n => open(n), pocket: () => pocket() });
  $$('[data-act="trailer"]').forEach(b => b.onclick = () => { amp.pause && amp.pause(); trailer.open({ video: b.dataset.video || 'trailer' }); });   // OddTube opens on the trailer; fullscreen is one tap away   // the music steps aside for the trailer
  // sound toggle: a speaker with waves, or with a cross when muted
  const muteBtn = $('.oddmute'), muteLabel = () => {
    const c = $('canvas', muteBtn).getContext('2d'), rows = game.muted ? ['...#.....', '..##.#..#', '####..##.', '####..##.', '####.#..#', '..##.....', '...#.....'] : ['...#...#.', '..##.#..#', '####..#.#', '####..#.#', '####.#..#', '..##...#.', '...#.....'];
    c.clearRect(0, 0, 9, 7); c.fillStyle = '#C3D0DE'; rows.forEach((r, y) => [...r].forEach((p, x) => p === '#' && c.fillRect(x, y, 1, 1)));
    muteBtn.setAttribute('aria-label', game.muted ? 'Sound off' : 'Sound on');
  };
  muteBtn.onclick = () => { game.mute(!game.muted); muteLabel(); menuLabels(); };
  setTimeout(muteLabel);

  // ---------- sound (OddOS-wide), from the Odd menu ----------
  const label = (sel, t) => { const s = $(sel + ' [data-bt]'); (s.querySelector('.sr') || s).textContent = t; BT.render(s); };
  function menuLabels() {
    label('[data-act="sound"]', 'Sound: ' + (localStorage.getItem('oddos-sound') === 'off' ? 'off' : 'on'));
  }
  $('[data-act="sound"]').onclick = () => { localStorage.setItem('oddos-sound', localStorage.getItem('oddos-sound') === 'off' ? 'on' : 'off'); menuLabels(); muteLabel(); };

  // ---------- easter egg: click the tomato star in the sky ----------
  os.addEventListener('pointerdown', e => {
    const bare = e.target === os || e.target.classList.contains('wall') || e.target.matches('.home, .icons, .glass');
    if (!bare || os.classList.contains('plain') || Wallpaper.busy) return;
    const r = os.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / Z), y = Math.floor((e.clientY - r.top) / Z);
    if (!Wallpaper.hitsOdd(x, y)) return;
    Wallpaper.egg(() => { TVSound.chime(); toast('You found the odd pixel.'); });
  });
  function toast(text) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
    t.innerHTML = `<canvas class="emb" aria-hidden="true"></canvas><span data-bt="fit"><b>${text}</b></span>`;
    os.appendChild(t); emblems(); BT.scan(t);
    t.style.left = Math.round((AW - t.offsetWidth) / 2) + 'px';
    setTimeout(() => t.remove(), 3800);
  }

  // ---------- devlog: the list opens each post in the reader ----------
  // long posts: the reader takes the screen's height (minus the taskbar) and scrolls; older/newer links at the end
  function readerSize() { const w = wins.post; if (pocket() || os.classList.contains('plain')) return; w.style.height = (AH - TASK - 2 - w.offsetTop) + 'px'; }
  const posts = $$('#w-post article');
  posts.forEach((p, i) => {
    const nav = document.createElement('div'); nav.className = 'row postnav';
    if (posts[i + 1]) nav.insertAdjacentHTML('beforeend', `<button class="pbtn o" data-go="${posts[i + 1].dataset.post}"><span data-bt="fit"><b>◂ Older</b></span></button>`);
    if (posts[i - 1]) nav.insertAdjacentHTML('beforeend', `<button class="pbtn o" data-go="${posts[i - 1].dataset.post}"><span data-bt="fit"><b>Newer ▸</b></span></button>`);
    p.appendChild(nav);
  });
  os.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) $(`#w-devlog [data-post="${g.dataset.go}"]`).click(); });
  $$('[data-post]', $('#w-devlog')).forEach(a => a.onclick = e => {
    e.preventDefault();
    $$('#w-post article').forEach(p => p.classList.toggle('on', p.dataset.post === a.dataset.post));
    const w = wins.post; w.dataset.title = a.querySelector('[data-bt] .sr')?.textContent || 'Devlog';
    const t = $('.tb .title', w); if (t) { t.innerHTML = '<b>' + w.dataset.title + '</b>'; t._bt = false; BT.attach(t); }
    open('post'); readerSize(); $('.bd', w).scrollTop = 0; $$('#w-post article.on [data-bt]').forEach(BT.render);
  });

  // ---------- about: two cats watch the odd pixel float in its jar (moves in whole pixels) ----------
  (function () {
    const cv = $('.aboutscene'), c = cv.getContext('2d'), bg = new Image(), sp = new Image();
    bg.src = 'art/about-cats.png'; sp.src = 'art/about-pixel.png';
    (function draw() {
      if (bg.complete && sp.complete && cv.offsetParent) {
        // it hangs in liquid: a slow rise and sink across most of the jar, a little sway, and a few bubbles going up
        const t = performance.now() / 1000;
        const dy = Math.round(Math.sin(t * .8) * 9 + Math.sin(t * 2.1) * 2), dx = Math.round(Math.sin(t * .5 + 1) * 2);
        c.drawImage(bg, 0, 0);
        [[66, 0], [92, 2.3], [79, 4.1]].forEach(([bx, o]) => { const k = ((t * .35 + o / 6) % 1); c.fillStyle = '#5F80A4'; c.fillRect(bx + Math.round(Math.sin(t * 3 + o) * .6), Math.round(86 - k * 40), 1, 1); });
        c.drawImage(sp, 71 + dx, 58 + dy);
      }
      requestAnimationFrame(draw);
    })();
  })();
  $('.status .emb').addEventListener('click', () => open('odd'));   // phones have no Odd menu: the emblem in the status bar hides the game

  // ---------- clock ----------
  (function tick() {
    const t = new Date().toTimeString().slice(0, 5);
    $$('.clock').forEach(c => { const s = c.querySelector('.sr'); if (s) s.textContent = t; else c.textContent = t; BT.render(c); });
    setTimeout(tick, 15000);
  })();

  // ---------- keep everything on the art grid ----------
  // Centring in a box with an odd amount of spare room puts content half an art pixel off. After layout changes,
  // nudge any canvas or image that landed between grid lines back onto it.
  let snapQ = 0;
  function snap() {
    cancelAnimationFrame(snapQ);
    snapQ = requestAnimationFrame(() => {
      const o = os.getBoundingClientRect();
      $$('canvas, img, .ptv').forEach(el => {
        if (el.parentElement.classList.contains('ptv') || el.classList.contains('lbimg') || el.classList.contains('wall') || el.classList.contains('corner') || !el.offsetParent) return;
        if (el.style.position !== 'relative') { el.style.position = 'relative'; el.style.left = '0px'; el.style.top = '0px'; }
        const r = el.getBoundingClientRect(), x = (r.left - o.left) / Z, y = (r.top - o.top) / Z;
        const fx = x - Math.round(x), fy = y - Math.round(y);
        if (Math.abs(fx) > .01) el.style.left = (parseFloat(el.style.left) - fx) + 'px';
        if (Math.abs(fy) > .01) el.style.top = (parseFloat(el.style.top) - fy) + 'px';
      });
    });
  }
  new MutationObserver(snap).observe(os, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'width', 'height', 'style'] });   // settles: a second pass finds nothing to move
  function centreControls() { ctl.style.paddingLeft = '0px'; const used = [...ctl.children].reduce((a, c) => a + c.offsetWidth, 0) + (ctl.children.length - 1) * 2; ctl.style.paddingLeft = Math.max(0, Math.floor((ctl.clientWidth - used) / 2)) + 'px'; }

  // ---------- modes ----------
  function isPocket() { return innerWidth < 700 || innerHeight < 520 || (innerWidth < 1000 && innerHeight > innerWidth); }
  // what's open on arrival: the game right of the icons, then the TV with the Welcome note under it at
  // the right edge, as many as fit without covering each other. The rest start minimised in the taskbar, one click away.
  // Most desktops fit all three; if the TV and the note don't fit beside the game, they wait in the taskbar.
  function firstLook() {
    const o = os.getBoundingClientRect(), left = Math.ceil(Math.max(...$$('.ico').map(i => (i.getBoundingClientRect().right - o.left) / Z))) + 2;
    const wd = n => +wins[n].dataset.at.split(',')[2], gap = 2, right = AW - 4, side = Math.max(wd('tv'), wd('welcome'));
    const plan = left + wd('ddb') + gap + side <= right ? { ddb: left, tv: true, welcome: true } : { ddb: left };
    ['welcome', 'ddb', 'tv'].forEach(n => { open(n); if (typeof plan[n] === 'number') place(wins[n], plan[n], wins[n].offsetTop); });
    // the note goes under the TV, or waits too if the screen is too short for both
    const tvEnd = wins.tv.offsetTop + wins.tv.offsetHeight + gap + 2;
    if (plan.welcome && wins.welcome.offsetTop < tvEnd) { place(wins.welcome, wins.welcome.offsetLeft, tvEnd); if (tvEnd + wins.welcome.offsetHeight > AH - TASK) plan.welcome = false; }
    wins.welcome.style.maxHeight = (AH - TASK - 2 - wins.welcome.offsetTop) + 'px';
    Object.keys(wins).forEach(n => { if (wins[n].dataset.tab && !plan[n]) wins[n].classList.remove('open'); });
    front('ddb');
  }
  function mode(force) {
    const p = isPocket();
    if (force || p !== pocket()) {
      os.classList.toggle('pocket', p); $$('.ico [data-bt]').forEach(BT.render);   // the game's name: two lines on a desktop, one on a phone
      $$('.win').forEach(w => { w.classList.remove('open'); w.dataset.tab = ''; }); syncTabs();
      if (!p) firstLook();
    } else if (!p) $$('.win.open').forEach(w => { w.style.width = Math.min(+w.dataset.at.split(',')[2], AW - 6) + 'px'; place(w, w.offsetLeft, w.offsetTop); });
  }
  function boot() {
    scale(); corners(); emblems(); BT.scan(os); $$('.field').forEach(BT.field);
    os.classList.toggle('pocket', isPocket()); mode(true);
    if (q.has('plain')) $('[data-act="plain"]').click();
    if (q.get('open')) open(q.get('open'));
    if (q.get('ch')) tv.tune(+q.get('ch') - 1); else markChannel();
    if (q.has('shots')) shots(true, q.get('shots') || 'ddb');
    if (q.has('trailer')) trailer.open({ autoplay: !q.has('shot'), video: q.get('trailer') || 'trailer' });
    centreControls(); sizeLabel(); menuLabels(); snap();
  }
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { scale(); mode(); BT.rerenderAll(); if (lb.classList.contains('open')) fitShot(); snap(); }, 60); });
  matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener?.('change', () => { scale(); BT.rerenderAll(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(boot);
})();
