// The OddOS palette, brand v3 (slate + tomato). Every pixel OddOS draws comes from this list. Brand: slate #294460
// (ground), tomato #FF5A36 (the odd pixel and one accent per layout, nothing else), night #0F1318, paper #F3EFE6
// (text and logo), mist #8AA4C0 (secondary text, lines). The warm, plant and red shades are for illustrations only.
(function (root) {
  const P = [
    // night ramp
    '#06080B', '#0F1318', '#161B22', '#1E252E', '#28313C', '#34404D', '#66737F', '#96A1AB',
    // slate ramp to paper (mist is #8AA4C0)
    '#14212F', '#1C2E42', '#294460', '#36597E', '#5F80A4', '#8AA4C0', '#C3D0DE', '#F3EFE6',
    // tomato ramp: the odd pixel
    '#4D1408', '#7A2210', '#C23A1C', '#FF5A36', '#FFB09C',
    // warm: wood, skin, gold, lamp light
    '#2A1810', '#4A2C1C', '#6E4428', '#9A6538', '#C98E52', '#F2C14E', '#FFE7A0',
    // plants
    '#163A2E', '#2F6B48', '#5DA35E',
  ];
  if (typeof module !== 'undefined') module.exports = P; else root.ODDOS_PALETTE = P;
})(this);
