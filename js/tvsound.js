// Odd·Vision sounds (Web Audio, nothing to download). Channel change: a short burst of static with a relay click.
// Off: a falling zip and a soft thunk. On: a low thump and a rising whine. Shares OddOS's Sound on/off (localStorage oddos-sound) and lets go of
// the audio device when it's quiet.
(function () {
  let ac = null, master = null, noise = null, rest = 0;
  const enabled = () => localStorage.getItem('oddos-sound') !== 'off';
  function ensure() {
    if (!enabled()) return false;
    try {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
        noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      ac.resume(); return true;
    } catch { return false; }
  }
  // suspend the audio shortly after the last sound
  const settle = ms => { clearTimeout(rest); rest = setTimeout(() => { if (ac) ac.suspend(); }, ms); };
  function burst(t, dur, vol, lo, hi) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noise; s.loop = true;
    f.type = 'bandpass'; f.frequency.value = Math.sqrt(lo * hi); f.Q.value = .7;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5); s.stop(t + dur + .02);
  }
  function tone(t, type, f0, f1, dur, vol) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
  }
  const TV = {
    tune() { if (!ensure()) return; const t = ac.currentTime; tone(t, 'square', 1800, 900, .012, .05); burst(t, .26, .12, 1500, 5000); settle(600); },
    off() { if (!ensure()) return; const t = ac.currentTime; tone(t, 'sine', 900, 50, .32, .07); tone(t + .3, 'sine', 70, 40, .12, .12); burst(t, .08, .05, 2000, 6000); settle(800); },
    on() { if (!ensure()) return; const t = ac.currentTime; tone(t, 'sine', 55, 90, .18, .16); tone(t + .05, 'sine', 2500, 7000, .35, .012); burst(t + .05, .3, .07, 1500, 5000); settle(800); },
    // the easter egg's little fanfare
    chime() { if (!ensure()) return; const t = ac.currentTime; [523, 659, 784, 1047, 1319].forEach((f, i) => tone(t + i * .09, 'square', f, f, .12, .035)); settle(1200); },
    // the odd hour on channel 4: a low heartbeat thump, and the picture tearing (a rough burst over a falling hum)
    beat() { if (!ensure()) return; const t = ac.currentTime; tone(t, 'sine', 62, 38, .22, .3); settle(600); },
    glitch() { if (!ensure()) return; const t = ac.currentTime; burst(t, .9, .14, 300, 6000); tone(t, 'sawtooth', 160, 30, .9, .05); settle(1400); },
  };
  window.TVSound = TV;
})();
