/* revenue_split.js —— 9c · 深入检验：2027 年交叉点是否成立
 * 左：TPU 2027 出货估计区间带（650–1,500 万颗，扇形误差带 + 散点），800–840 万颗交叉线。
 * 右：美元口径面板——GPU 仍占优。结论注记：「合理、模型支持，但未被证明」。
 * 注册：window.Charts['revenue-split']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'revenue-split';
  var BODY_H = 430;
  var TOKENS = {
    '--paper': '#ffffff', '--paper-hi': '#f7f9fc',
    '--ink': '#051c2c', '--ink-md': '#42566a', '--ink-lo': '#8595a6',
    '--line': '#dbe2ea', '--line-lo': '#eef1f6',
    '--blue': '#2251ff', '--blue-hi': '#1233b8', '--blue-lo': '#7d9bff',
    '--copper': '#b07a10', '--green': '#008a6d', '--violet': '#7a45c9',
    '--gold': '#b07a10', '--neg': '#c22f4e'
  };
  function C(name) {
    var v = '';
    try {
      if (window.Utils && typeof window.Utils.css === 'function') v = window.Utils.css(name);
      if (!v) v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch (e) { v = ''; }
    return v || TOKENS[name] || '#051c2c';
  }
  var MONO = 'Menlo, Consolas, "SF Mono", "PingFang SC", monospace';
  var SERIF = '"et-book", "Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", "STSong", "Iowan Old Style", Palatino, Georgia, serif';

  var DEFAULT = {
    maxM: 16,                       // 横轴上限（百万颗）
    range: [6.5, 15.0],             // TPU 2027 出货估计区间（百万颗）
    cross: [8.0, 8.4],              // 交叉线：GPU 2027 出货（百万颗）
    estimates: [
      { v: 6.5,  label: '保守情形', row: 0 },
      { v: 7.4,  label: '券商·低', row: 1 },
      { v: 8.1,  label: '券商·中', row: 2 },
      { v: 8.6,  label: '综合·中', row: 0 },
      { v: 10.5, label: '乐观情形', row: 1 },
      { v: 12.0, label: '激进情形', row: 2 },
      { v: 15.0, label: '上限情形', row: 0 }
    ],
    dollar: { gpu: 260, asic: 65 }  // 2027E 美元口径（US$B，约数，研究综合）
  };

  function getData() {
    var d = (window.CHART_DATA && window.CHART_DATA[KEY]) || null;
    if (!d) return DEFAULT;
    var out = {};
    for (var k in DEFAULT) out[k] = DEFAULT[k];
    for (var k2 in d) if (d[k2] != null) out[k2] = d[k2];
    return out;
  }

  function el(tag, attrs, parent) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, str, attrs) {
    var t = el('text', attrs, parent);
    t.setAttribute('x', x); t.setAttribute('y', y);
    t.textContent = str;
    return t;
  }
  function bindHot(node, tipHtml, drillData) {
    node.style.cursor = 'pointer';
    node.addEventListener('mouseenter', function (e) {
      if (window.Utils && Utils.tooltip) Utils.tooltip.show(tipHtml, e.clientX, e.clientY);
    });
    node.addEventListener('mousemove', function (e) {
      if (window.Utils && Utils.tooltip) Utils.tooltip.move(e.clientX, e.clientY);
    });
    node.addEventListener('mouseleave', function () {
      if (window.Utils && Utils.tooltip) Utils.tooltip.hide();
    });
    node.addEventListener('click', function () {
      if (window.Utils && Utils.tooltip) Utils.tooltip.hide();
      if (window.Utils && Utils.drill && drillData) Utils.drill.open(drillData);
    });
  }

  function render(body, data) {
    body.innerHTML = '';
    var W = Math.max(340, body.clientWidth || 720);
    var H = BODY_H;
    var stacked = W < 620;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '2027 年交叉点检验：左侧为 TPU 2027 年出货估计区间 650 至 1500 万颗的误差带与散点，800 至 840 万颗处标出交叉线；右侧美元口径面板显示 GPU 仍占优。结论：合理、模型支持，但未被证明。' }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg');

    // ---- 顶部 ----
    txt(svg, 12, 20, '单位口径：交叉落在估计区间之内；美元口径：GPU 仍然占优', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink });
    txt(svg, 12, 37, 'TPU 2027 出货估计 · 单位：百万颗 · 各估计并列展示，不强行统一', {
      'font-family': MONO, 'font-size': 9.5, fill: inkLo });

    // ================= 左面板：区间带 + 交叉线 =================
    var L = stacked ? { x: 12, y: 56, w: W - 24, h: 190 } : { x: 12, y: 56, w: W * 0.56 - 12, h: 250 };
    var ml = 12, mr = 12;
    function X(v) { return L.x + ml + (v / data.maxM) * (L.w - ml - mr); }
    var bandY = L.y + 52, bandH = 56;

    txt(svg, L.x, L.y - 4, '① 单位口径 · TPU 2027 出货估计', { 'font-family': SERIF, 'font-size': 11.5, 'font-weight': 700, fill: inkMd });

    // 主轴
    var axisY = bandY + bandH + 26;
    el('line', { x1: X(0), x2: X(data.maxM), y1: axisY, y2: axisY, stroke: line, 'stroke-width': 1.2 }, svg);
    for (var g = 0; g <= data.maxM; g += 4) {
      el('line', { x1: X(g), x2: X(g), y1: axisY, y2: axisY + 4, stroke: line, 'stroke-width': 1 }, svg);
      txt(svg, X(g), axisY + 15, g === 0 ? '0' : g + '00万', { 'font-family': MONO, 'font-size': 8.5, fill: inkLo, 'text-anchor': 'middle' });
    }

    // 估计区间带（650–1,500 万）
    var rx0 = X(data.range[0]), rx1 = X(data.range[1]);
    el('rect', { x: rx0, y: bandY, width: rx1 - rx0, height: bandH, fill: blueLo, 'fill-opacity': 0.14,
      stroke: blueLo, 'stroke-width': 1 }, svg);
    txt(svg, rx1 - 6, bandY + bandH - 7, '估计区间 650–1,500 万颗', { 'font-family': MONO, 'font-size': 8.5, fill: C('--blue-hi'), 'text-anchor': 'end' });
    el('line', { x1: rx0, y1: bandY - 3, x2: rx0, y2: bandY + bandH + 3, stroke: blueLo, 'stroke-width': 1.2 }, svg);
    el('line', { x1: rx1, y1: bandY - 3, x2: rx1, y2: bandY + bandH + 3, stroke: blueLo, 'stroke-width': 1.2 }, svg);

    // 交叉线带（800–840 万）
    var cx0 = X(data.cross[0]), cx1 = X(data.cross[1]);
    el('rect', { x: cx0, y: bandY - 22, width: cx1 - cx0, height: bandH + 48, fill: blue, 'fill-opacity': 0.10,
      stroke: blue, 'stroke-width': 1.1, 'stroke-dasharray': '4,3' }, svg);
    txt(svg, (cx0 + cx1) / 2, bandY - 28, '交叉线 800–840 万 ＝ 50% 单位份额所需量（非区间中值）', { 'font-family': MONO, 'font-size': 8.8, 'font-weight': 700, fill: blue, 'text-anchor': 'middle' });

    // 散点（扇形三行）
    var rowY = [bandY + 12, bandY + 28, bandY + 44];
    data.estimates.forEach(function (e) {
      var ex = X(e.v), ey = rowY[e.row % 3];
      el('line', { x1: ex, y1: ey + 4, x2: ex, y2: axisY, stroke: line, 'stroke-width': 0.8, 'stroke-dasharray': '1,3' }, svg);
      var dot = el('circle', { cx: ex, cy: ey, r: 4.5, fill: '#fff', stroke: blue, 'stroke-width': 1.6 }, svg);
      txt(svg, ex, ey - 8, e.label, { 'font-family': MONO, 'font-size': 7.8, fill: inkMd, 'text-anchor': 'middle' });
      var cross = (e.v >= data.cross[0] && e.v <= data.cross[1]);
      bindHot(dot,
        '<b>' + e.label + '</b>：TPU 2027 ≈ <b>' + (e.v * 100).toFixed(0) + ' 万颗</b>' +
        (cross ? '<br><span style="color:' + blue + '">落在交叉线 800–840 万之内</span>' : (e.v < data.cross[0] ? '<br><span style="color:' + inkMd + '">低于交叉线</span>' : '<br><span style="color:' + inkMd + '">高于交叉线</span>')),
        { title: 'TPU 2027 出货 · ' + e.label,
          body: '该情形估计 TPU 2027 年出货约 ' + (e.v * 100).toFixed(0) + ' 万颗。交叉线 800–840 万颗 ＝ 50% 单位份额所需量（GPU 2027 出货估计，非区间中值——区间中值 1,075 万颗）。全区间 650–1,500 万颗（2026 年已发表估计）覆盖了交叉线——交叉成立与否取决于哪个情形为真。',
          source: '券商研究 / 研究综合（并列展示）', date: '2026-07' });
    });

    // 结论注记（左面板底部）
    var vy = axisY + 34;
    el('rect', { x: L.x, y: vy, width: L.w - 4, height: 40, fill: '#fff', stroke: line, 'stroke-width': 1 }, svg);
    el('rect', { x: L.x, y: vy, width: 2.5, height: 40, fill: blue }, svg);
    txt(svg, L.x + 10, vy + 16, '结论：合理、模型支持，但未被证明。', { 'font-family': SERIF, 'font-size': 11.5, 'font-weight': 700, fill: ink });
    txt(svg, L.x + 10, vy + 31, '单位交叉成立与否取决于 650–1,500 万区间中哪个情形为真；且单位口径 ≠ 美元口径。', { 'font-family': MONO, 'font-size': 8.8, fill: inkMd });

    // ================= 右面板：美元口径 =================
    var R = stacked ? { x: 12, y: 286, w: W - 24, h: 100 } : { x: W * 0.58, y: 56, w: W * 0.42 - 12, h: 250 };
    txt(svg, R.x, R.y - 4, '② 美元口径 · 2027E（约数）', { 'font-family': SERIF, 'font-size': 11.5, 'font-weight': 700, fill: inkMd });
    var dMax = 280, barH = 30, bg = 14;
    var bw = R.w - 108;
    function DX(v) { return R.x + 78 + (v / dMax) * bw; }

    // GPU bar
    var gy1 = R.y + 30;
    txt(svg, R.x, gy1 + barH / 2 + 4, 'GPU', { 'font-family': MONO, 'font-size': 10, fill: inkMd });
    el('rect', { x: R.x + 78, y: gy1, width: DX(data.dollar.gpu) - R.x - 78, height: barH, fill: inkMd, 'fill-opacity': 0.85 }, svg);
    txt(svg, DX(data.dollar.gpu) + 6, gy1 + barH / 2 + 4, '≈$' + data.dollar.gpu + 'B', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });
    // ASIC bar
    var gy2 = gy1 + barH + bg;
    txt(svg, R.x, gy2 + barH / 2 + 4, '定制 ASIC', { 'font-family': MONO, 'font-size': 10, fill: blue });
    el('rect', { x: R.x + 78, y: gy2, width: DX(data.dollar.asic) - R.x - 78, height: barH, fill: blue, 'fill-opacity': 0.9 }, svg);
    txt(svg, DX(data.dollar.asic) + 6, gy2 + barH / 2 + 4, '≈$' + data.dollar.asic + 'B', { 'font-family': MONO, 'font-size': 9.5, fill: blue });

    var ry2 = gy2 + barH + 18;
    txt(svg, R.x, ry2, '美元口径下 GPU 仍占优 ≈4 倍。', { 'font-family': SERIF, 'font-size': 11, 'font-weight': 700, fill: ink });
    txt(svg, R.x, ry2 + 15, '情景乘法只用美元口径。', { 'font-family': MONO, 'font-size': 9, fill: inkLo });

    var hotR = el('rect', { x: R.x, y: R.y - 12, width: R.w, height: (stacked ? 96 : 140), fill: 'transparent' }, svg);
    bindHot(hotR,
      '<b>美元口径（2027E，约数）</b><br>GPU ≈ US$' + data.dollar.gpu + 'B · 定制 ASIC ≈ US$' + data.dollar.asic + 'B<br><span style="color:' + inkMd + '">颗数接近交叉，美元远未交叉：ASIC 单价显著低于旗舰 GPU。</span>',
      { title: '美元口径：为什么 GPU 仍然占优',
        body: '2027E 美元口径（研究综合约数）：GPU 约 US$' + data.dollar.gpu + 'B，定制 ASIC 约 US$' + data.dollar.asic + 'B。即使单位颗数交叉成立，美元份额也不交叉——因为定制 ASIC 的单价显著低于旗舰 GPU。本站全部情景乘法（Base ≈2.5x，区间 2.0–4.7x 等）只使用美元口径。',
        source: '研究综合（估计）', date: '2026-07' });

    // ---- 底部注记 ----
    txt(svg, 12, H - 24, '检验方法：把每个估计当成独立证词并列展示——区间覆盖交叉线，意味着「无法证伪」而非「已被证明」。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
    txt(svg, 12, H - 8, '左面板单位口径 · 右面板美元口径：两个面板回答两个问题，不可合并读数。', {
      'font-family': MONO, 'font-size': 9.5, fill: inkLo });
  }

  window.Charts[KEY] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    function draw() { render(body, getData()); }
    draw();
    if ('ResizeObserver' in window) {
      var raf = 0, lastW = body.clientWidth;
      var ro = new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          var w = body.clientWidth;
          if (Math.abs(w - lastW) < 2) return;
          lastW = w;
          draw();
        });
      });
      ro.observe(body);
    }
  };
})();
