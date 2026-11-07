// OddTube: the trailer opens as an old video-site page inside OddOS (header, title, embedded player, channel row,
// description, comments, related videos). The player's fullscreen button switches to the theatre: the video on the
// whole screen, at a whole multiple of its pixels when that fills the screen well (1:1 for a 1080p trailer on a 1080p
// screen), otherwise scaled smoothly. The video itself is a normal file (mp4/webm) in trailer/.
// Usage: Trailer.mount(el, { getScale: () => ({ Z, AW, AH }), openApp: name => {}, phone: () => bool, onClose: () => {} }) -> { open(), close() }
(function () {
  const SPR = {
    play: ['#....', '##...', '###..', '####.', '###..', '##...', '#....'], pause: ['##.##', '##.##', '##.##', '##.##', '##.##', '##.##', '##.##'],
    vol: ['...#...', '..##.#.', '####..#', '####..#', '####..#', '..##.#.', '...#...'], mute: ['...#...', '..##...', '####.#.', '####..#', '####.#.', '..##...', '...#...'],
    close: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
    full: ['##.##', '#...#', '.....', '#...#', '##.##'], unfull: ['.#.#.', '##.##', '.....', '##.##', '.#.#.'],
    star: ['..#..', '.###.', '#####', '.###.', '.#.#.'],
  };
  const PAPER = '#F3EFE6', TOMATO = '#FF5A36', INK = '#06080B', SLATE = '#294460';
  const STEAM_DDB = 'https://store.steampowered.com/app/5427200/Dice_Dice_Battles';   // a video's own `steam` link wins
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  function sprite(rows, c = '#C3D0DE') { const cv = document.createElement('canvas'); cv.width = rows[0].length; cv.height = rows.length; const x = cv.getContext('2d'); x.fillStyle = c; rows.forEach((r, y) => [...r].forEach((p, i) => p === '#' && x.fillRect(i, y, 1, 1))); return cv; }
  const swap = (btn, rows, c) => { btn.innerHTML = ''; btn.appendChild(sprite(rows, c)); };

  // the OddTube logo: "Odd" in slate, "Tube" in paper on a tomato tab with stepped corners
  function logo(cv) {
    const a = 'Odd', b = 'Tube', wa = BT.textWidth(a, true, 2), wb = BT.textWidth(b, true, 2);
    cv.width = wa + wb + 12; cv.height = 18; const c = cv.getContext('2d');
    BT.drawText(c, a, 0, 2, SLATE, { bold: true, scale: 2 });
    const x0 = wa + 4; c.fillStyle = TOMATO; c.fillRect(x0 + 1, 0, wb + 6, 18); c.fillRect(x0, 1, wb + 8, 16);
    BT.drawText(c, b, x0 + 4, 2, PAPER, { bold: true, scale: 2 });
  }
  // the old five-star rating, in halves (a half star lights its left half)
  function stars(cv, rating) {
    cv.width = 29; cv.height = 5; const c = cv.getContext('2d'); c.clearRect(0, 0, 29, 5);
    for (let s = 0; s < 5; s++) SPR.star.forEach((r, y) => [...r].forEach((p, x) => { if (p !== '#') return; c.fillStyle = s + 1 <= rating || (s + .5 <= rating && x < 2) ? '#F2C14E' : '#C3D0DE'; c.fillRect(s * 6 + x, y, 1, 1); }));
    cv.setAttribute('aria-label', `Rated ${rating} out of 5`);
  }

  function mount(el, { getScale, openApp = () => {}, phone = () => false, onClose = () => {} }) {
    const v = el.querySelector('video'), bar = el.querySelector('.tbar'), seek = el.querySelector('.tseek'), sc = seek.getContext('2d');
    const playBtn = el.querySelector('.tplay'), volBtn = el.querySelector('.tvol'), fullBtn = el.querySelector('.tfull'), time = el.querySelector('.ttime');
    const endCard = el.querySelector('.tend'), player = el.querySelector('.tplayer'), screenBox = el.querySelector('.tscreen'), page = el.querySelector('.tube'), stage = el.querySelector('.tstage');
    let raf = 0, idle = 0, mode = 'page';
    logo(el.querySelector('.tlogo'));
    const VIDEOS = window.ODDTUBE || [];
    let current = VIDEOS[0];

    // in the theatre the control bar floats over the video and hides after two quiet seconds while playing
    const wake = () => { el.classList.remove('quiet'); clearTimeout(idle); if (mode === 'full') idle = setTimeout(() => { if (!v.paused && !bar.matches(':hover')) el.classList.add('quiet'); }, 2000); };
    ['pointermove', 'pointerdown', 'keydown'].forEach(t => el.addEventListener(t, wake));
    v.addEventListener('pause', () => el.classList.remove('quiet')); v.addEventListener('play', wake);

    function sizeSeek(barW) {
      seek.style.width = '0px';
      seek.width = Math.max(30, barW - (bar.querySelector('.tleft').offsetWidth + bar.querySelector('.tright').offsetWidth + 14)); seek.height = 7;
      seek.style.width = seek.width + 'px'; seek.style.height = '7px';
    }
    // How big to show the video, in screen pixels. With data-native (the game's own width, 480 for Luckfall) any whole
    // multiple of that width shows every game pixel as a solid block, even below the file's size (a 4x trailer at 2x
    // or 3x per game pixel). Without it, whole multiples of the file's own size. null = no exact size fits.
    // A video can set its own (native: 0 for footage whose pixels aren't a whole multiple, like a 1080p trailer with a camera zoom).
    let native = +v.dataset.native || 0;
    const nativeOf = c => c.native ?? (+v.dataset.native || 0);
    function exactWidth(devW, devH, vw, vh) {
      const base = native || vw, m = Math.floor(Math.min(devW / base, devH / (base * vh / vw)));
      return m >= 1 ? base * m : null;
    }
    function fit() {
      const { Z, AW, AH } = getScale(), dpr = devicePixelRatio || 1, vw = v.videoWidth || 1920, vh = v.videoHeight || 1080;
      el.style.width = AW + 'px'; el.style.height = AH + 'px';
      if (mode === 'full') {
        // a whole multiple keeps pixel art sharp, unless it would waste more than a fifth of the screen (then fill smoothly)
        // exact if it fills at least four fifths of the screen, otherwise fill it smoothly
        const dw = AW * Z * dpr, dh = AH * Z * dpr, fillW = Math.min(dw, dh * vw / vh), ex = exactWidth(dw, dh, vw, vh), exact = ex && ex / fillW >= .8;
        const w = (exact ? ex : fillW) / dpr / Z, h = w * vh / vw;
        Object.assign(v.style, { width: w + 'px', height: h + 'px', left: (AW - w) / 2 + 'px', top: (AH - h) / 2 + 'px', imageRendering: exact ? 'pixelated' : 'auto' });
        sizeSeek(AW - 8);
        endCard.style.left = Math.round((AW - 200) / 2) + 'px'; endCard.style.top = Math.round(AH * .4 - 30) + 'px';
      } else {
        // the embedded player: a black box as wide as the main column; the video inside at an exact size, centred
        // (pillarboxed, like the old players), or filling the box smoothly if no exact size fits
        // best of all: one game pixel = one OddOS pixel (the video exactly `native` art pixels wide), no mixed pixel sizes
        const bw = player.clientWidth, bh = Math.round(bw * 9 / 16), same = native && bw >= native;
        // narrower than the game (phones): game pixels can't match OddOS pixels there, so fill the player smoothly
        const ex = same ? native * Z * dpr : native ? null : exactWidth(bw * Z * dpr, bh * Z * dpr, vw, vh);
        const w = ex ? ex / dpr / Z : bw, h = Math.round(w * vh / vw);
        Object.assign(v.style, { width: w + 'px', height: h + 'px', left: Math.round((bw - w) / 2) + 'px', top: Math.round((bh - h) / 2) + 'px', imageRendering: ex ? 'pixelated' : 'auto' });
        screenBox.style.height = bh + 'px';
        sizeSeek(bw - 4);
        endCard.style.left = Math.max(4, Math.round((bw - 200) / 2)) + 'px'; endCard.style.top = Math.max(4, Math.round(bh / 2 - 34)) + 'px';
      }
      drawSeek();
    }
    function drawSeek() {
      const w = seek.width, d = v.duration || 1, f = Math.min(1, v.currentTime / d), kx = Math.round((w - 5) * f);
      sc.clearRect(0, 0, w, 7); sc.fillStyle = '#34404D'; sc.fillRect(0, 2, w, 3); sc.fillStyle = TOMATO; sc.fillRect(0, 2, kx, 3);   // the old red progress bar
      sc.fillStyle = INK; sc.fillRect(kx, 0, 5, 7); sc.fillStyle = '#C3D0DE'; sc.fillRect(kx + 1, 1, 3, 5);
      const t = `${clock(v.currentTime)} / ${clock(v.duration || 0)}`, s = time.querySelector('.sr');
      if (!s || s.textContent !== t) { (s || time).textContent = t; BT.render(time); }
      if (!v.ended && el.classList.contains('ended')) { el.classList.remove('ended'); endCard.hidden = true; }
    }
    function loop() { drawSeek(); raf = requestAnimationFrame(loop); }
    function sync() {
      swap(playBtn, v.paused ? SPR.play : SPR.pause); swap(volBtn, v.muted ? SPR.mute : SPR.vol); swap(fullBtn, mode === 'full' ? SPR.unfull : SPR.full);
      playBtn.setAttribute('aria-label', v.paused ? 'Play' : 'Pause'); volBtn.setAttribute('aria-label', v.muted ? 'Unmute' : 'Mute');
      fullBtn.setAttribute('aria-label', mode === 'full' ? 'Exit fullscreen' : 'Fullscreen');
    }
    const toggle = () => { endCard.hidden = true; v.paused ? v.play() : v.pause(); };

    // page <-> theatre: the video and its bar move between the player and the stage (moving keeps it playing)
    const isFull = () => !!document.fullscreenElement;
    async function browserFull(on) {
      try { if (on && !isFull()) { await document.documentElement.requestFullscreen(); screen.orientation?.lock?.('landscape').catch(() => {}); } else if (!on && isFull()) await document.exitFullscreen(); } catch {}
    }
    function setMode(m) {
      mode = m; el.classList.toggle('full', m === 'full');
      (m === 'full' ? stage : screenBox).append(v, endCard);
      (m === 'full' ? stage : player).append(bar);
      sync(); wake(); fit(); requestAnimationFrame(fit);
    }
    fullBtn.onclick = () => { if (mode === 'full') { setMode('page'); browserFull(false); } else { setMode('full'); browserFull(true); } };
    document.addEventListener('fullscreenchange', () => { if (!isFull() && mode === 'full' && el.classList.contains('open')) setMode('page'); setTimeout(fit, 120); });

    playBtn.onclick = toggle; v.onclick = toggle;
    volBtn.onclick = () => { v.muted = !v.muted; localStorage.setItem('oddos-trailer-muted', v.muted ? '1' : ''); sync(); };
    seek.addEventListener('pointerdown', e => {
      const go = ev => { const r = seek.getBoundingClientRect(); v.currentTime = Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)) * (v.duration || 0); endCard.hidden = true; drawSeek(); };
      go(e); seek.setPointerCapture(e.pointerId); seek.onpointermove = go; seek.onpointerup = () => { seek.onpointermove = null; };
    });
    ['play', 'pause', 'volumechange'].forEach(t => v.addEventListener(t, sync));
    v.addEventListener('loadedmetadata', fit);
    v.addEventListener('ended', () => { endCard.hidden = false; el.classList.add('ended'); BT.scan(endCard); });
    el.querySelector('.tagain').onclick = () => { v.currentTime = 0; endCard.hidden = true; el.classList.remove('ended'); v.play(); };
    el.querySelector('.tnext').onclick = () => show(related()[0].id, true);

    // ---------- the videos: everything on the page follows the one playing ----------
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    // the sidebar: every other video, starting with the one after this one (so the order changes as you go)
    function related() { const i = VIDEOS.indexOf(current); return [...VIDEOS.slice(i + 1), ...VIDEOS.slice(0, i)]; }
    function show(id, autoplay) {
      current = VIDEOS.find(x => x.id === id) || VIDEOS[0];
      const c = current, q = s => el.querySelector(s), steam = c.steam || STEAM_DDB;
      native = nativeOf(c);
      v.pause(); v.src = `trailer/${c.file}.${c.ext || 'webm'}`; v.poster = `trailer/${c.file}-poster.png`; v.load();
      endCard.hidden = true; el.classList.remove('ended');
      q('.ttitle').innerHTML = `<h1 data-bt><b>${esc(c.title)}</b></h1>`;
      q('.tviewcount').innerHTML = `<span data-bt="fit"><b>${c.views}</b> views</span>`;
      stars(q('.tstars'), c.rating);
      q('.tdesc').innerHTML = `<p data-bt><span class="tdim">Added:</span> ${c.added}  <span class="tdim">From:</span> <u>oddpixellabs</u></p><p data-bt>${esc(c.desc)}</p>`
        + (c.wishlist ? `<div class="row"><a class="pbtn" href="${steam}" target="_blank" rel="noopener"><span data-bt="fit"><b>Wishlist on Steam</b></span></a></div>` : '');
      q('.tcomments').innerHTML = `<p data-bt><b>Comments &amp; Responses</b> <span class="tdim">(${c.comment ? 1 : 0})</span></p>`
        + (c.comment ? `<div class="tcomment tauthor"><p data-bt><b><u>oddpixellabs</u></b> <span class="tdim">(${c.comment[0]})</span></p><p data-bt>${esc(c.comment[1])}</p></div>` : '');
      q('.tendtext').innerHTML = `<p data-bt><b>${esc(c.title)}</b></p>`;
      q('.twish').style.display = c.wishlist ? '' : 'none'; q('.twish').href = steam;
      q('.trellist').innerHTML = related().map(r => `<a class="trel" href="#" data-video="${r.id}" aria-label="${esc(r.title)}"><span class="tthumb"><img src="art/tube/${r.thumb}.png" width="64" height="36" alt=""><span class="tlen" data-bt="fit">${r.len}</span></span>`
        + `<span class="trelt"><span data-bt><u>${esc(r.title)}</u></span><span data-bt class="tdim">${r.views} views</span></span></a>`).join('');
      BT.scan(el); page.scrollTop = 0;
      if (autoplay) v.play().catch(() => sync());
      el.dispatchEvent(new CustomEvent('video', { detail: c.id }));
    }
    el.querySelector('.trellist').addEventListener('click', e => { const a = e.target.closest('[data-video]'); if (!a) return; e.preventDefault(); show(a.dataset.video, true); });
    el.querySelector('.tchan').innerHTML = `<span data-bt="fit"><b><u>oddpixellabs</u></b></span><span data-bt="fit" class="tdim tcount">${VIDEOS.length} videos</span>`;
    show(current.id, false);
    el.querySelector('.tclose').onclick = () => close();
    addEventListener('keydown', e => {
      if (!el.classList.contains('open') || /INPUT/.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
      if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 5);
      if (e.key === 'm') volBtn.click();
      if (e.key === 'f') fullBtn.click();
      if (e.key === 'Escape') { e.stopImmediatePropagation(); mode === 'full' ? fullBtn.click() : close(); }
    }, true);
    addEventListener('resize', () => el.classList.contains('open') && setTimeout(fit, 80));

    function open({ autoplay = true, fullscreen = false, video } = {}) {
      if (video && video !== current.id) show(video, false);
      el.classList.add('open'); el.classList.remove('ended'); endCard.hidden = true; const { AW } = getScale(); el.classList.toggle('narrow', phone() || AW < 480 + 130 + 30);   // the sidebar goes under the video when the 480-wide player and it don't fit side by side
      el.style.top = (el.parentElement.scrollTop || 0) + 'px'; page.scrollTop = 0;
      v.muted = !!localStorage.getItem('oddos-trailer-muted');
      BT.scan(el); setMode(fullscreen ? 'full' : 'page'); if (fullscreen) browserFull(true);
      cancelAnimationFrame(raf); loop();
      if (autoplay) v.play().catch(() => sync());
      playBtn.focus({ preventScroll: true });
    }
    function close() { v.pause(); if (mode === 'full') setMode('page'); el.classList.remove('open'); cancelAnimationFrame(raf); browserFull(false); onClose(); }
    swap(el.querySelector('.tclose'), SPR.close, SLATE);
    return { open, close, fit, show, get video() { return v; }, get current() { return current.id; }, get mode() { return mode; } };
  }
  window.Trailer = { mount };
})();
