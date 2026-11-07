// Alternative brand palettes for OddOS (round 11). Each one gives the same roles as the current palette, so any
// OddOS colour can be swapped one for one: night ramp (8, darkest first), primary ramp (7 + paper, replaces violet
// to white), accent ramp (5, replaces cyan; the odd pixel is accent[3]). Warm, plant and red shades stay as they are.
(function (root) {
  const ROLES = {
    night: ['#05030B', '#0E0A1F', '#161030', '#1F1742', '#2C2358', '#3A2E70', '#6F63A8', '#9D93C7'],
    primary: ['#1D0560', '#2E0888', '#440DBF', '#5A22E0', '#8C6BFF', '#A98EFF', '#C9BBFF', '#FFFFFF'],
    accent: ['#004E66', '#007A99', '#00B4D8', '#00E5FF', '#9EF6FF'],
  };
  const PALETTES = {
    current: { name: 'Current: violet + cyan', note: 'For reference.', ...ROLES },
    ember: {
      name: 'Ember', note: 'Taken from Luckfall itself: dungeon umber, brick red, candle gold. Studio and game feel like one place.',
      night: ['#0A0605', '#160F0C', '#201612', '#2B1E18', '#3A2920', '#4C362A', '#7F6655', '#AE957F'],
      primary: ['#3A120B', '#5A1C10', '#862B17', '#AE3E1F', '#D2694A', '#E39373', '#F0C2A6', '#F5ECDD'],
      accent: ['#5A3907', '#89590F', '#C88D1D', '#F2B33D', '#FFE3A3'],
    },
    felt: {
      name: 'Felt', note: 'A card table: green baize, ivory dice, one red pip.',
      night: ['#040907', '#0A1611', '#102019', '#162D22', '#1D392B', '#284A38', '#5D7867', '#8EA596'],
      primary: ['#0E3123', '#144632', '#1D5E43', '#287A57', '#4C9E77', '#7BBE9A', '#B7DCC5', '#F3ECDA'],
      accent: ['#4A0F12', '#781A1E', '#B0282B', '#E8483A', '#FF9E90'],
    },
    amber: {
      name: 'Amber', note: 'An old amber terminal, with green phosphor for the odd pixel. Leans hardest into the CRT.',
      night: ['#060402', '#110C06', '#1A1309', '#24190C', '#302210', '#3F2D15', '#7C5B27', '#AB7F37'],
      primary: ['#3A2000', '#5A3200', '#874B00', '#B36500', '#DD8600', '#FFAE1A', '#FFD07A', '#FFF2D8'],
      accent: ['#0B3D1A', '#12602A', '#1E9440', '#45E070', '#B0FFC4'],
    },
    slate: {
      name: 'Slate', note: 'Quiet blue-grey, like a notebook cover, with a tomato-red odd pixel.',
      night: ['#06080B', '#0F1318', '#161B22', '#1E252E', '#28313C', '#34404D', '#66737F', '#96A1AB'],
      primary: ['#14212F', '#1C2E42', '#294460', '#36597E', '#5F80A4', '#8AA4C0', '#C3D0DE', '#F3EFE6'],
      accent: ['#4D1408', '#7A2210', '#C23A1C', '#FF5A36', '#FFB09C'],
    },
    ink: {
      name: 'Ink', note: 'Almost no colour. Warm black and paper; the odd pixel is the only red thing on the page.',
      night: ['#070606', '#121110', '#1A1817', '#232120', '#2E2B29', '#3C3835', '#6E6965', '#9C9691'],
      primary: ['#1E1C1A', '#2A2725', '#3B3734', '#504B47', '#7A746E', '#A29C95', '#CDC7BF', '#F2EDE4'],
      accent: ['#4E0E0B', '#7E1912', '#BF2A1E', '#F23D2B', '#FFA597'],
    },
    // round 12: blue-led, after the user picked Slate
    denim: {
      name: 'Denim', note: 'Workwear denim with mustard stitching. A bit warmer and bluer than Slate.',
      night: ['#05070B', '#0D121B', '#131A26', '#1A2332', '#232E40', '#2E3B51', '#627189', '#93A0B5'],
      primary: ['#15223A', '#1F3255', '#2F4B7C', '#3D6199', '#6584B5', '#8FA6CB', '#C3D0E4', '#F4EFE3'],
      accent: ['#4F3A08', '#7D5C10', '#B8871C', '#E8B53A', '#FFE0A0'],
    },
    blueprint: {
      name: 'Blueprint', note: 'Prussian blue like a cyanotype, white lines, a safety-orange pixel.',
      night: ['#04070C', '#0B1320', '#101B2D', '#16243B', '#1D2F4A', '#273C5C', '#5A7193', '#8CA1C0'],
      primary: ['#0D2546', '#143766', '#1D4E89', '#2865AB', '#5A8BC8', '#8AAEDA', '#C2D5EE', '#F2F4F0'],
      accent: ['#5A2405', '#8C380A', '#CC5512', '#FF7A1A', '#FFC193'],
    },
    delft: {
      name: 'Delft', note: 'Delft pottery: a strong cobalt on cream, with an egg-yolk pixel. The boldest blue here.',
      night: ['#05060C', '#0C0F1E', '#12172B', '#192039', '#212A48', '#2C365A', '#5F6890', '#9198BC'],
      primary: ['#101D45', '#182C68', '#23408E', '#2F55B0', '#5B7ECC', '#8CA3DD', '#C4D0EF', '#F5F1E6'],
      accent: ['#5A4100', '#8A6400', '#C79000', '#F5B700', '#FFE38A'],
    },
    petrol: {
      name: 'Petrol', note: 'Blue with a little green in it, like old enamel paint. Coral pixel.',
      night: ['#030809', '#0A1417', '#0F1D21', '#15272C', '#1C3339', '#254149', '#587479', '#8BA4A8'],
      primary: ['#0B2A33', '#123D4A', '#1F5566', '#2A6E82', '#5592A3', '#87B5C1', '#BEDAE0', '#F3EEE4'],
      accent: ['#5A1D10', '#8C2E1A', '#CC472B', '#F2704E', '#FFB8A4'],
    },
    midnight: {
      name: 'Midnight', note: 'Darker, deeper navy than Slate, with a signal-red pixel. The calmest of the set.',
      night: ['#050609', '#0C0F18', '#121622', '#191E2E', '#20273A', '#2A3249', '#5C6480', '#8F96AE'],
      primary: ['#111831', '#182344', '#22305A', '#2E4178', '#586A9F', '#8796C0', '#C1C9E0', '#F1EEE7'],
      accent: ['#4E0E0B', '#7E1912', '#BF2A1E', '#F23D2B', '#FFA597'],
    },
    slateochre: {
      name: 'Slate, ochre pixel', note: 'Slate exactly, with Denim\'s mustard in place of the tomato.',
      night: ['#06080B', '#0F1318', '#161B22', '#1E252E', '#28313C', '#34404D', '#66737F', '#96A1AB'],
      primary: ['#14212F', '#1C2E42', '#294460', '#36597E', '#5F80A4', '#8AA4C0', '#C3D0DE', '#F3EFE6'],
      accent: ['#4F3A08', '#7D5C10', '#B8871C', '#E8B53A', '#FFE0A0'],
    },
  };
  // old hex -> new hex for one palette
  function map(key) {
    const p = PALETTES[key], m = {};
    if (!p || key === 'current') return m;
    for (const role of Object.keys(ROLES)) ROLES[role].forEach((c, i) => { m[c.toUpperCase()] = p[role][i].toUpperCase(); });
    return m;
  }
  const api = { ROLES, PALETTES, map };
  if (typeof module !== 'undefined') module.exports = api; else root.ODDOS_PALETTES = api;
})(this);
