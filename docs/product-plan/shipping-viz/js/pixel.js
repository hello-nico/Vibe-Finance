/* pixel.js — 8-bit 像素船：由字符矩阵实时生成 SVG <rect>，禁止替换为图片 */
(function () {
  "use strict";

  var MATRICES = {
    container: [
      "..F.......................",
      "..B.......................",
      "..BB..12341234123412341...",
      "..BWB.43214321432143214...",
      "..BBB.21432143214321432...",
      "HHHHHHHHHHHHHHHHHHHHHHHH..",
      ".hHHHHHHHHHHHHHHHHHHHHh...",
      "..hhhhhhhhhhhhhhhhhhhh...."
    ],
    dry: [
      "..F.......................",
      "..BB......................",
      "..BWB..GG...GG...GG...G...",
      "..BBB.DDDD.DDDD.DDDD.DD...",
      "HHHHHHHHHHHHHHHHHHHHHHHH..",
      ".hHHHHHHHHHHHHHHHHHHHHh...",
      "..hhhhhhhhhhhhhhhhhhhh...."
    ],
    tanker: [
      "..F................O......",
      "..BB...PPPPPPPPPPPPPPP....",
      "..BWB..P....P....P....P...",
      "..BBBTTTTTTTTTTTTTTTTTT...",
      "TTTTTTTTTTTTTTTTTTTTTTTT..",
      ".tTTTTTTTTTTTTTTTTTTTTt...",
      "..tttttttttttttttttttt...."
    ]
  };

  var PALETTE = {
    H: "#14263B", h: "#0C1828", B: "#FDFAF2", b: "#D8CFBA",
    W: "#14263B", K: "#C0392B",
    "1": "#0E67B5", "2": "#5A9BD5", "3": "#C25E28", "4": "#1F8A70",
    D: "#C25E28", d: "#9A4A1F", G: "#8C8577",
    T: "#1F8A70", t: "#166955", P: "#C9BFA6", O: "#C0392B", F: "#E8B84B"
  };

  var SVGNS = "http://www.w3.org/2000/svg";

  /**
   * makeShip(type, px) → <svg> 元素
   * 根组带 .px-ship 与 data-w / data-h（像素格数）
   */
  function makeShip(type, px) {
    var rows = MATRICES[type];
    if (!rows) throw new Error("unknown ship type: " + type);
    px = px || 4;
    var w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    var h = rows.length;

    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("width", w * px);
    svg.setAttribute("height", h * px);
    svg.setAttribute("viewBox", "0 0 " + w * px + " " + h * px);
    svg.style.imageRendering = "pixelated";
    svg.setAttribute("class", "px-ship-svg");

    var g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "px-ship");
    g.setAttribute("data-w", w);
    g.setAttribute("data-h", h);

    rows.forEach(function (row, y) {
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch === "." || ch === " ") continue;
        var color = PALETTE[ch];
        if (!color) continue;
        var rect = document.createElementNS(SVGNS, "rect");
        rect.setAttribute("x", x * px);
        rect.setAttribute("y", y * px);
        rect.setAttribute("width", px);
        rect.setAttribute("height", px);
        rect.setAttribute("fill", color);
        g.appendChild(rect);
      }
    });

    svg.appendChild(g);
    return svg;
  }

  window.PIXEL = { MATRICES: MATRICES, PALETTE: PALETTE, makeShip: makeShip };
})();
