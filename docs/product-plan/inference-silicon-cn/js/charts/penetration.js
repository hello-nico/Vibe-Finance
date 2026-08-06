/* penetration.js —— 9a · 当前窗口（第二轮自研芯片浪潮，以及测量纪律）
 * 三种份额口径并排三面板：单位 / CoWoS 产能分配 / 美元。各自 y 轴，明确标注口径不可混用。
 * 2023–2027E ASIC vs GPU 份额曲线；情景计算只用美元口径。
 * 注册：window.Charts['penetration']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'penetration';
  var BODY_H = 420;
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

  var YEARS = ['2023', '2024', '2025', '2026E', '2027E'];
  var DEFAULT = {
    panels: [
      { id: 'unit', title: '口径一 · 单位份额', max: 60, unit: '%',
        asic: [8, 12, 18, 30, 50], band27: [45, 55],
        note: 'A2 检验对象：2027E 触及约 50%——交叉是否成立「无法判定」',
        desc: 'AI 加速器出货颗数口径：TPU / Trainium 等定制 ASIC 颗数 ÷（ASIC + GPU）总颗数。2027E 为估计区间 45–55%。' },
      { id: 'cowos', title: '口径二 · CoWoS 产能分配', max: 40, unit: '%',
        asic: [5, 10, 15, 22, 28], band27: [24, 32],
        note: '先进封装产能口径：ASIC 项目分配约三成封顶',
        desc: 'CoWoS 先进封装产能的分配口径：定制 ASIC 项目占台积电 CoWoS 产能的比例。2027E 为估计区间 24–32%。' },
      { id: 'dollar', title: '口径三 · 美元份额', max: 25, unit: '%',
        asic: [4, 6, 9, 12, 15], band27: [13, 18],
        note: '美元口径：GPU 仍占约 85%——情景乘法只用此口径',
        desc: '按芯片美元价值计算的份额：定制 ASIC 单价显著低于旗舰 GPU，美元份额远低于单位份额。2027E 为估计区间 13–18%。' }
    ]
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
      'aria-label': '2023 至 2027E 年 ASIC 对 GPU 份额的三种口径对比：单位份额、CoWoS 产能分配份额与美元份额三个并排面板，各自纵轴刻度独立，明确标注口径不可混用。' }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg');

    // ---- 顶部标题与警告 ----
    txt(svg, 12, 17, '三把尺子，三个答案：口径各自独立，不可混用', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink });
    txt(svg, 12, 33, '纵轴刻度各自独立 · 2026E / 2027E 为估计（虚线）· 情景计算只用美元口径', {
      'font-family': MONO, 'font-size': 9.5, fill: neg });

    var panels = data.panels;
    var gap = 26;
    var pw = (W - 24 - gap * (panels.length - 1)) / panels.length;
    var mt = 78, mb = 126;
    var plotH = H - mt - mb;

    panels.forEach(function (p, pi) {
      var ox = 12 + pi * (pw + gap);       // 面板左缘
      var ml = 36;                          // 面板内 y 轴留白
      var px0 = ox + ml, px1 = ox + pw - 4;
      var pwi = px1 - px0;
      function X(i) { return px0 + pwi * i / (YEARS.length - 1); }
      function Y(v) { return mt + plotH - (v / p.max) * plotH; }

      // 面板分隔细线
      if (pi > 0) el('line', { x1: ox - gap / 2, x2: ox - gap / 2, y1: mt - 14, y2: mt + plotH + 30, stroke: lineLo, 'stroke-width': 1 }, svg);

      // 面板标题
      txt(svg, ox, mt - 22, p.title, { 'font-family': SERIF, 'font-size': 12, 'font-weight': 700, fill: inkMd });

      // y 网格
      var ticks = [0, p.max / 2, p.max];
      ticks.forEach(function (g) {
        el('line', { x1: px0, x2: px1, y1: Y(g), y2: Y(g), stroke: lineLo, 'stroke-width': 1 }, svg);
        txt(svg, px0 - 5, Y(g) + 3, g + '%', { 'font-family': MONO, 'font-size': 8.5, fill: inkLo, 'text-anchor': 'end' });
      });

      // 2027E 区间带（扇形/误差条）
      var bLo = p.band27[0], bHi = p.band27[1];
      var x27 = X(4), x26 = X(3);
      el('path', { d: 'M' + x26 + ',' + Y(p.asic[3]) + 'L' + x27 + ',' + Y(bHi) + 'L' + x27 + ',' + Y(bLo) + 'Z',
        fill: blue, 'fill-opacity': 0.10 }, svg);
      el('line', { x1: x27, y1: Y(bHi), x2: x27, y2: Y(bLo), stroke: blue, 'stroke-width': 1.6 }, svg);
      el('line', { x1: x27 - 4, y1: Y(bHi), x2: x27 + 4, y2: Y(bHi), stroke: blue, 'stroke-width': 1.6 }, svg);
      el('line', { x1: x27 - 4, y1: Y(bLo), x2: x27 + 4, y2: Y(bLo), stroke: blue, 'stroke-width': 1.6 }, svg);

      // ASIC 线（2023–2025 实线，2025→2026E 虚线）
      function linePath(vals, from, to) {
        var d = '';
        for (var i = from; i <= to; i++) d += (i === from ? 'M' : 'L') + X(i) + ',' + Y(vals[i]);
        return d;
      }
      el('path', { d: linePath(p.asic, 0, 2), fill: 'none', stroke: blue, 'stroke-width': 2.2 }, svg);
      el('path', { d: linePath(p.asic, 2, 3), fill: 'none', stroke: blue, 'stroke-width': 2, 'stroke-dasharray': '5,4' }, svg);
      // GPU 镜像线（100 − ASIC），同一面板不同刻度感——用浅灰细线示对照（刻度归一化到 panel max）
      var gpu = p.asic.map(function (v) { return 100 - v; });
      // GPU 份额超过 panel max，只画 2025→2027E 顶部边界的提示性短线于面板上方？改为标注文字。
      // 数据点
      p.asic.forEach(function (v, i) {
        if (i === 4) return;   // 2027E 用区间带
        el('circle', { cx: X(i), cy: Y(v), r: 3, fill: '#fff', stroke: blue, 'stroke-width': 1.6 }, svg);
        txt(svg, X(i), Y(v) - 7, v + '%', { 'font-family': MONO, 'font-size': 8.5, fill: blue, 'text-anchor': 'middle' });
      });
      txt(svg, x27, Y(bLo) + 15, bLo + '–' + bHi + '%', { 'font-family': MONO, 'font-size': 8.5, 'font-weight': 700, fill: blue, 'text-anchor': 'middle' });

      // GPU 对照标注（文字）
      var gpu27 = 100 - p.asic[4];
      txt(svg, px0 + 2, Y(p.max) + 14, 'GPU：' + (100 - p.asic[0]) + '% → 约 ' + gpu27 + '%', {
        'font-family': MONO, 'font-size': 8.8, fill: inkLo });

      // x 轴年份
      YEARS.forEach(function (yy, i) {
        txt(svg, X(i), mt + plotH + 16, yy, { 'font-family': MONO, 'font-size': 8.8,
          fill: i >= 3 ? blue : inkMd, 'text-anchor': 'middle' });
      });
      el('line', { x1: px0, x2: px1, y1: mt + plotH, y2: mt + plotH, stroke: line, 'stroke-width': 1 }, svg);

      // 面板注记
      var shortNote = { unit: 'A2 检验：2027E 约 50% —— 无法判定', cowos: '产能口径：ASIC 约三成封顶', dollar: '美元口径：GPU 仍占约 85%' }[p.id] || p.note;
      txt(svg, px0, mt + plotH + 32, shortNote, { 'font-family': SERIF, 'font-size': 9.8, fill: inkMd });

      // 交互热区
      var hot = el('rect', { x: px0, y: mt, width: pwi, height: plotH, fill: 'transparent' }, svg);
      bindHot(hot,
        '<b>' + p.title + '</b><br>' +
        YEARS.map(function (yy, i) {
          var v = (i === 4) ? (p.band27[0] + '–' + p.band27[1] + '%（区间）') : p.asic[i] + '%';
          return yy + '：ASIC ' + v;
        }).join('<br>'),
        { title: p.title,
          body: p.desc + ' 三个口径不可互相换算：单位份额≠晶圆/封装份额≠美元份额。本报告情景计算（Base ≈2.5x，区间 2.0–4.7x 等）只使用美元口径。',
          source: '券商研究 / 研究综合（估计区间）', date: '2026-07' });
    });

    // ---- 图例 ----
    var ly = 350;
    el('line', { x1: 12, x2: 32, y1: ly - 3, y2: ly - 3, stroke: blue, 'stroke-width': 2.2 }, svg);
    txt(svg, 38, ly, 'ASIC 份额（实线 = 披露，虚线 = 估计）', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });
    el('line', { x1: 268, x2: 280, y1: ly - 3, y2: ly - 3, stroke: blue, 'stroke-width': 1.6 }, svg);
    el('line', { x1: 274, x2: 274, y1: ly - 9, y2: ly + 3, stroke: blue, 'stroke-width': 1.6 }, svg);
    txt(svg, 286, ly, '2027E 估计区间', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });

    // ---- 底部注记 ----
    txt(svg, 12, H - 26, '同一行业，三把尺子：把单位份额当成美元份额，是「2027 交叉」叙事最常见的测量错误。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
    txt(svg, 12, H - 10, '单位 ≈ 半数，CoWoS ≈ 三成，美元 ≈ 一成半——三个数字可以同时为真。', {
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
