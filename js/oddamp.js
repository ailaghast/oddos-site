// Odd·Amp: the OddOS music player, skinned like the old desktop players. Panel (logo, LCD clock, scrolling title,
// spectrum, seek bar) is a canvas at art resolution; controls and playlist are buttons with bitmap text.
// Tracks with a `src` play that file. Tracks without one play a stand-in chiptune generated from the title
// (Web Audio), so the player works before the real soundtracks are uploaded: just add src: 'music/xyz.mp3'.
// Usage: OddAmp.mount(rootElement) (root holds .amp-panel, .amp-ctl, .amp-list)
(function () {
  const TRACKS = [
    { title: 'Loaded dice', game: 'Dice Dice Battles', src: 'music/loaded-dice.mp3' },   // the trailer tune
    { title: 'Title screen', game: 'Dice Dice Battles', src: 'music/title-screen.ogg' },
    { title: 'Into the dungeon', game: 'Dice Dice Battles', src: 'music/into-the-dungeon.ogg' },
    { title: 'The shop', game: 'Dice Dice Battles', src: 'music/the-shop.ogg' },
  ];
  const PW = 156, PH = 52, TOMATO = '#FF5A36', PAPER = '#F3EFE6', INK = '#06080B';
  const px = (ctx, x, y, c, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const text = (ctx, s, x, y, c, o) => BT.drawText(ctx, s, x, y, c, o), tw = (s, b, k) => BT.textWidth(s, b, k);
  const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const SPR = {
    prev: ['#...#', '#..##', '#.###', '#..##', '#...#'], play: ['#....', '##...', '###..', '##...', '#....'], pause: ['##.##', '##.##', '##.##', '##.##', '##.##'],
    stop: ['#####', '#####', '#####', '#####', '#####'], next: ['#...#', '##..#', '###.#', '##..#', '#...#'], down: ['.....', '.....', '#####', '.....', '.....'], up: ['..#..', '..#..', '#####', '..#..', '..#..'],
  };
  function sprite(rows, color) {
    const c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length; const x = c.getContext('2d'); x.fillStyle = color;
    rows.forEach((r, y) => [...r].forEach((p, i) => p === '#' && x.fillRect(i, y, 1, 1))); return c;
  }

  // ---------- stand-in chiptunes: a little loop per title (minor pentatonic, square lead, triangle bass, kick, hats) ----------
  function rng(seed) { return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function compose(title) {
    const r = rng([...title].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7)), scale = [0, 3, 5, 7, 10];
    const root = [45, 47, 48, 50, 52, 53, 55][r() * 7 | 0], bpm = 92 + (r() * 44 | 0), lead = [], bass = [], kick = [], hat = [];
    for (let s = 0; s < 64; s++) {
      lead[s] = r() < .42 ? root + 12 + scale[r() * 5 | 0] + (r() < .25 ? 12 : 0) : null;
      bass[s] = s % 4 === 0 ? root - 12 + [0, 7, 5, 3][(s / 16 | 0) % 4] : null;
      kick[s] = s % 8 === 0 || (s % 16 === 14 && r() < .5); hat[s] = s % 2 === 1;
    }
    for (let s = 32; s < 48; s++) lead[s] = lead[s - 32];   // bar three echoes bar one, so it sounds like a tune
    const step = 60 / bpm / 4;
    return { bpm, step, lead, bass, kick, hat, len: Math.round(64 * step * 6) };
  }

  function mount(root) {
    const cv = root.querySelector('.amp-panel'), ctx = cv.getContext('2d'), ctl = root.querySelector('.amp-ctl'), list = root.querySelector('.amp-list');
    cv.width = PW; cv.height = PH;
    const songs = TRACKS.map(t => ({ ...t, tune: compose(t.title) }));
    let ac, master, analyser, bins, noise, cur = 0, state = 'stopped', timer = 0, stepIndex = 0, nextTime = 0, startAt = 0, pausedAt = 0, vol = 3, audio = null;
    // opened from disk, Chromium mutes files routed through Web Audio (CORS), so they play straight out and the spectrum is faked
    const direct = location.protocol === 'file:';

    function ensure() {
      if (ac) return;
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); analyser = ac.createAnalyser(); analyser.fftSize = 64; bins = new Uint8Array(analyser.frequencyBinCount);
      master.connect(analyser); analyser.connect(ac.destination); setVol(vol);
      noise = ac.createBuffer(1, ac.sampleRate * .2, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const freq = m => 440 * 2 ** ((m - 69) / 12);
    function voice(type, f, t, dur, v) {
      const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
    }
    function drum(kind, t) {
      if (kind === 'kick') { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
        g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g); g.connect(master); o.start(t); o.stop(t + .16); return; }
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = 6000;
      g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.001, t + .04); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + .05);
    }
    function schedule() {
      const T = songs[cur].tune;
      while (nextTime < ac.currentTime + .12) {
        if (stepIndex * T.step >= T.len) { next(); return; }
        const k = stepIndex % 64;
        if (T.lead[k] != null) voice('square', freq(T.lead[k]), nextTime, T.step * 1.6, .07);
        if (T.bass[k] != null) voice('triangle', freq(T.bass[k]), nextTime, T.step * 3.5, .22);
        if (T.kick[k]) drum('kick', nextTime); if (T.hat[k]) drum('hat', nextTime);
        stepIndex++; nextTime += T.step;
      }
    }
    function position() {
      if (audio) return audio.currentTime || 0;
      return state === 'playing' ? Math.max(0, ac.currentTime - startAt) : pausedAt;
    }
    const length = () => audio ? (isFinite(audio.duration) ? audio.duration : 0) : songs[cur].tune.len;
    function startAtSec(sec) {
      clearInterval(timer); if (audio) { audio.pause(); audio = null; }
      const s = songs[cur];
      if (s.src) {   // a real file
        audio = new Audio(s.src); audio.currentTime = sec; audio.onended = next;
        if (direct) setVol(vol); else ac.createMediaElementSource(audio).connect(master);
        audio.play();
      } else {
        const T = s.tune; stepIndex = Math.ceil(sec / T.step); nextTime = ac.currentTime + .05; startAt = nextTime - stepIndex * T.step;
        timer = setInterval(schedule, 25);
      }
      state = 'playing'; ac.resume(); paint();
    }
    function play(i = cur) {
      ensure();
      if (i !== cur || state === 'stopped') { cur = i; startAtSec(0); }
      else if (state === 'paused') { state = 'playing'; ac.resume(); if (audio) audio.play(); }
      paint();
    }
    function pause() { if (state !== 'playing') return; pausedAt = position(); state = 'paused'; ac.suspend(); if (audio) audio.pause(); paint(); }
    // stopping releases the audio device too (pause already suspends): no idle audio running in the background
    function stop() { clearInterval(timer); if (audio) { audio.pause(); audio = null; } if (ac) ac.suspend(); state = 'stopped'; pausedAt = 0; paint(); }
    function next() { play((cur + 1) % songs.length); if (state !== 'playing') startAtSec(0); }
    function prev() { position() > 3 ? startAtSec(0) : play((cur - 1 + songs.length) % songs.length); }
    function setVol(v) { vol = Math.max(0, Math.min(5, v)); if (master) master.gain.value = vol / 5 * .6; if (audio && direct) audio.volume = vol / 5 * .6; }
    function seek(frac) { ensure(); const sec = frac * length(); if (state === 'stopped') { pausedAt = sec; play(); startAtSec(sec); } else startAtSec(sec); }

    // ---------- panel ----------
    function draw() {
      const t = performance.now(), on = state === 'playing';
      px(ctx, 0, 0, INK, PW, PH); px(ctx, 1, 1, '#34404D', PW - 2, PH - 2); px(ctx, 2, 2, '#1E252E', PW - 3, PH - 3);
      for (let y = 3; y < PH - 2; y += 2) px(ctx, 2, y, '#232A34', PW - 4, 1);   // brushed metal
      // logo: ODD, the odd pixel, AMP
      const w1 = text(ctx, 'ODD', 5, 3, '#C3D0DE', { bold: true });
      ['.##', '###', '##.'].forEach((r, y) => [...r].forEach((c, x) => c === '#' && px(ctx, 5 + w1 + 3 + x, 4 + y, TOMATO)));
      text(ctx, 'AMP', 5 + w1 + 9, 3, '#C3D0DE', { bold: true });
      for (let x = 62; x < PW - 6; x += 2) px(ctx, x, 7, '#34404D');
      // left LCD: state, time, volume
      px(ctx, 4, 13, INK, 62, 26);
      const st = state === 'playing' ? SPR.play : state === 'paused' ? SPR.pause : SPR.stop;
      st.forEach((r, y) => [...r].forEach((c, x) => c === '#' && px(ctx, 7 + x, 16 + y, state === 'playing' ? '#C3D0DE' : '#66737F')));
      const shown = state === 'paused' && Math.floor(t / 500) % 2 ? '' : clock(position());
      text(ctx, shown, 16, 16, '#8AA4C0', { bold: true, scale: 2 });
      for (let v = 0; v < 5; v++) px(ctx, 52 + v * 2, 35 - v, v < vol ? '#5F80A4' : '#28313C', 1, v + 1);
      // right LCD: scrolling title, spectrum
      px(ctx, 70, 13, INK, PW - 74, 11); px(ctx, 70, 26, INK, PW - 74, 13);
      const s = songs[cur], m = `${cur + 1}. ${s.title.toUpperCase()} (${s.game.toUpperCase()})  ***  `, mw = tw(m) + 1, off = on ? Math.floor(t / 90) % mw : 0;
      ctx.save(); ctx.beginPath(); ctx.rect(72, 14, PW - 78, 9); ctx.clip(); text(ctx, m + m, 72 - off, 15, PAPER); ctx.restore();
      if (analyser && on) analyser.getByteFrequencyData(bins);
      if (direct && audio && on) for (let b = 1; b <= 16; b++) bins[b] = 255 * (1 - b / 22) * (.55 + .45 * Math.sin(t / (90 + b * 13) + b * b));
      for (let b = 0; b < 16; b++) { const h = on && bins ? Math.min(10, Math.round(bins[b + 1] / 255 * 11)) : 0; px(ctx, 72 + b * 5, 37 - Math.max(1, h), b % 5 === 4 ? '#5F80A4' : '#8AA4C0', 4, Math.max(1, h)); }
      // seek bar
      const L = length(), f = L ? Math.min(1, position() / L) : 0, sx = 4, sw = PW - 8, kx = sx + Math.round((sw - 5) * f);
      px(ctx, sx, 45, '#28313C', sw, 1); px(ctx, sx, 45, '#5F80A4', kx - sx, 1);
      px(ctx, kx, 43, INK, 5, 5); px(ctx, kx + 1, 44, '#C3D0DE', 3, 3);
      if (cv.isConnected && cv.offsetParent) requestAnimationFrame(draw); else drawing = false;
    }
    let drawing = false;
    const loop = () => { if (!drawing) { drawing = true; requestAnimationFrame(draw); } };
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * PW, y = (e.clientY - r.top) / r.height * PH;
      if (y >= 40) seek(Math.max(0, Math.min(1, (x - 4) / (PW - 8))));
    });

    // ---------- controls ----------
    [['prev', prev, 'Previous'], ['play', () => play(), 'Play'], ['pause', pause, 'Pause'], ['stop', stop, 'Stop'], ['next', next, 'Next'], null, ['down', () => setVol(vol - 1), 'Volume down'], ['up', () => setVol(vol + 1), 'Volume up']]
      .forEach(b => {
        if (!b) return ctl.insertAdjacentHTML('beforeend', '<i class="gap"></i>');
        const btn = document.createElement('button'); btn.setAttribute('aria-label', b[2]); btn.appendChild(sprite(SPR[b[0]], '#C3D0DE')); btn.onclick = b[1]; ctl.appendChild(btn);
      });
    // ---------- playlist ----------
    songs.forEach((s, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<button><i class="mark"></i><span data-bt>${i + 1}. ${s.title}</span><span class="meta" data-bt="fit">${s.src ? '-:--' : clock(s.tune.len)}</span></button>`;
      li.querySelector('button').onclick = () => play(i);
      li.querySelector('button').setAttribute('aria-label', `${s.title}, ${s.game}`);
      list.appendChild(li);
      if (s.src) {   // a real file: its own length replaces the stand-in's once the browser has read it
        const meta = li.querySelector('.meta'), a = new Audio(); a.preload = 'metadata';
        a.onloadedmetadata = () => { if (isFinite(a.duration)) (meta.querySelector(':scope > .sr') || meta).textContent = clock(a.duration); BT.render(meta); };
        a.src = s.src;
      }
    });
    function paint() {
      [...list.children].forEach((li, i) => { li.classList.toggle('cur', i === cur); li.classList.toggle('playing', i === cur && state === 'playing'); });
      BT.scan(list); list.querySelectorAll('[data-bt]').forEach(BT.render);
    }
    paint();
    return { show: loop, play, pause, stop };
  }
  window.OddAmp = { mount };
})();
