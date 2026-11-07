// The emblem as pixels, copied from the brand kit's hand-snapped favicons (16px and 32px):
// '#' white square pixels, 'c' the escaped cyan pixel. Recolour freely; keep the shapes.
(function (root) {
  const E = {
    "small": [
      ".......c...",
      ".......cccc",
      "####...ccc.",
      "####..cccc.",
      "####.....c.",
      "####.......",
      "...........",
      "####.####..",
      "####.####..",
      "####.####..",
      "####.####.."
    ],
    "large": [
      "..............cccc...",
      "..............ccccccc",
      "..............ccccccc",
      "########.....cccccccc",
      "########.....cccccccc",
      "########.....ccccccc.",
      "########.....ccccccc.",
      "########........cccc.",
      "########.............",
      "########.............",
      "########.............",
      ".....................",
      ".....................",
      "########..########...",
      "########..########...",
      "########..########...",
      "########..########...",
      "########..########...",
      "########..########...",
      "########..########...",
      "########..########..."
    ]
  };
  if (typeof module !== 'undefined') module.exports = E; else root.ODDOS_EMBLEM = E;
})(this);
