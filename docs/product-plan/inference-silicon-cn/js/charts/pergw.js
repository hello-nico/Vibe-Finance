/* pergw.js —— 9d · 深入检验：为什么模型与芯片的节奏错配仍可管理
 * 每 GW 成本拆解：GPU 方案 vs ASIC 方案单 GW 成本构成（水平堆叠条形）。
 * 附 GW → 颗数换算 ±40% 误差注记（单颗功耗与利用率假设驱动）。
 * 注册：window.Charts['pergw']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'pergw';
  var BODY_H = 300;
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

  // US$B / GW，研究综合估计（约数）
  var DEFAULT = {
    bars: [
      { name: 'GPU 方案', total: 40.0, segs: [
        { label: '加速芯片（含 HBM）', v: 21.0, color: '--blue' },
        { label: '网络与互连', v: 4.5, color: '--blue-lo' },
        { label: '服务器与整机', v: 5.5, color: '--ink-md' },
        { label: '电力与机房配套', v: 9.0, color: '--ink-lo' }
      ] },
      { name: 'ASIC 方案', total: 28.0, segs: [
        { label: '加速芯片（含 HBM）', v: 12.5, color: '--blue' },
        { label: '网络与互连', v: 3.0, color: '--blue-lo' },
        { label: '服务器与整机', v: 4.0, color: '--ink-md' },
        { label: '电力与机房配套', v: 8.5, color: '--ink-lo' }
      ] }
    ],
    conv: { gpu: '≈ 50–60 万颗', asic: '≈ 90–110 万颗', err: '±40%' }
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
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '每 GW 成本拆解条形图：GPU 方案约 400 亿美元每 GW，ASIC 方案约 280 亿美元每 GW，按加速芯片、网络互连、服务器整机与电力机房四段构成；附 GW 到颗数换算约正负 40% 误差注记。' }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo'), blue = C('--blue');

    // ---- 顶部 ----
    txt(svg, 12, 20, '同一 GW，两本账：ASIC 单 GW 成本约低三成', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink });
    txt(svg, 12, 37, 'US$B / GW · 研究综合估计（约数）· 含芯片、网络、整机与电力机房', {
      'font-family': MONO, 'font-size': 9.5, fill: inkLo });

    var ml = 92, mr = 96;
    var plotW = W - ml - mr;
    var maxV = 42;
    var barH = 34, rowGap = 30;
    var y1 = 56;
    function X(v) { return ml + (v / maxV) * plotW; }

    data.bars.forEach(function (b, bi) {
      var y = y1 + bi * (barH + rowGap);
      txt(svg, ml - 10, y + barH / 2 + 4, b.name, { 'font-family': SERIF, 'font-size': 12, 'font-weight': 700,
        fill: bi === 0 ? inkMd : blue, 'text-anchor': 'end' });
      var acc = 0;
      b.segs.forEach(function (s) {
        var x0 = X(acc), x1 = X(acc + s.v);
        var r = el('rect', { x: x0, y: y, width: x1 - x0, height: barH, fill: C(s.color),
          'fill-opacity': 0.85, stroke: '#fff', 'stroke-width': 0.8 }, svg);
        // 段内标签（宽度足够时）
        if (x1 - x0 > 44) {
          txt(svg, (x0 + x1) / 2, y + barH / 2 + 3.5, '$' + s.v.toFixed(1) + 'B', {
            'font-family': MONO, 'font-size': 8.8, fill: '#fff', 'text-anchor': 'middle' });
        }
        bindHot(r, '<b>' + b.name + ' · ' + s.label + '</b><br>≈ US$<b>' + s.v.toFixed(1) + 'B</b> / GW（' +
          (s.v / b.total * 100).toFixed(0) + '%）',
          { title: b.name + ' · ' + s.label,
            body: b.name + ' 单 GW 成本约 US$' + b.total.toFixed(1) + 'B，其中「' + s.label + '」约 US$' + s.v.toFixed(1) + 'B（' + (s.v / b.total * 100).toFixed(0) + '%）。研究综合估计，随 HBM 配比、网络拓扑与机房标准可有 ±20% 以上波动。',
            source: '研究综合（估计）', date: '2026-07' });
        acc += s.v;
      });
      // 总额标签
      txt(svg, X(b.total) + 8, y + barH / 2 + 4, '≈ $' + b.total.toFixed(0) + 'B/GW', {
        'font-family': MONO, 'font-size': 10, 'font-weight': 700, fill: bi === 0 ? inkMd : blue });
    });

    // 差额标注
    var yMid = y1 + barH + rowGap / 2;
    el('line', { x1: X(28) , y1: y1 + barH + 2, x2: X(40), y2: y1 + barH + 2, stroke: line, 'stroke-width': 1, 'stroke-dasharray': '2,3' }, svg);
    txt(svg, X(34), yMid + 12, 'Δ ≈ −$12B/GW（约 −30%）', { 'font-family': MONO, 'font-size': 8.8, fill: inkMd, 'text-anchor': 'middle' });

    // ---- 图例 ----
    var ly = y1 + 2 * barH + rowGap + 22;
    var lx = ml;
    data.bars[0].segs.forEach(function (s) {
      el('rect', { x: lx, y: ly - 9, width: 9, height: 9, fill: C(s.color), 'fill-opacity': 0.85 }, svg);
      var t = txt(svg, lx + 13, ly, s.label, { 'font-family': MONO, 'font-size': 9, fill: inkMd });
      lx += 13 + s.label.length * 9.5 + 22;
    });

    // ---- GW → 颗数换算注记 ----
    var ny = ly + 18;
    el('rect', { x: 12, y: ny, width: W - 24, height: 46, fill: '#fff', stroke: line, 'stroke-width': 1 }, svg);
    el('rect', { x: 12, y: ny, width: 2.5, height: 46, fill: blue }, svg);
    txt(svg, 24, ny + 17, 'GW → 颗数换算：1 GW ≈ GPU ' + data.conv.gpu + ' · ASIC ' + data.conv.asic + '，换算误差 ' + data.conv.err + '。', {
      'font-family': SERIF, 'font-size': 11, 'font-weight': 700, fill: ink });
    txt(svg, 24, ny + 33, '误差来自单颗功耗、整机 overhead 与利用率假设——比较 GW 与颗数时务必带 ±40% 区间。', {
      'font-family': MONO, 'font-size': 8.8, fill: inkMd });

    // ---- 底部注记 ----
    txt(svg, 12, H - 6, '节奏错配可管理的另一面：无论芯片谁胜，电力与机房这一段的账单几乎相同。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
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
