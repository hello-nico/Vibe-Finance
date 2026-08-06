/* sawtooth.js —— 插曲 · 2017–2022 · 挖矿镜像（配套图）
 * Alchip（世芯-KY）与 GUC（创意电子）季度营收：项目制认列造成明显锯齿。
 * 标注：2021–2022 crypto 占比区间（阴影带）、2023→ AI 转型段。
 * 同一渲染函数参数化注册：window.Charts['sawtooth-alchip'] 与 window.Charts['sawtooth-guc']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var BODY_H = 340;
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

  // quarters: [标签, 营收（NT$亿，约数）]
  var CONFIGS = {
    'sawtooth-alchip': {
      key: 'sawtooth-alchip',
      name: 'Alchip（世芯-KY）',
      unit: 'NT$亿',
      quarters: [
        ['20Q1', 14.2], ['20Q2', 16.5], ['20Q3', 15.1], ['20Q4', 24.9],
        ['21Q1', 20.4], ['21Q2', 26.8], ['21Q3', 24.6], ['21Q4', 32.2],
        ['22Q1', 41.2], ['22Q2', 68.5], ['22Q3', 55.9], ['22Q4', 75.0],
        ['23Q1', 61.8], ['23Q2', 74.2], ['23Q3', 66.5], ['23Q4', 77.5],
        ['24Q1', 78.2], ['24Q2', 96.5], ['24Q3', 90.8], ['24Q4', 104.5]
      ],
      crypto: { from: '21Q1', to: '22Q4', share: '约 30–40%' },
      ai: { from: '23Q1', note: 'AI 加速器项目接棒（先进制程 ASIC）' },
      aria: 'Alchip（世芯-KY）2020 至 2024 年季度营收锯齿图：2021 至 2022 年 crypto 订单占比约三至四成，2023 年起 AI 项目接棒，营收呈明显锯齿波动。',
      note: '加密货币矿机 ASIC 订单在 2021–2022 年推高营收，退潮后由 AI 定制芯片接棒；季度间大幅起伏来自项目制收入认列。'
    },
    'sawtooth-guc': {
      key: 'sawtooth-guc',
      name: 'GUC（创意电子）',
      unit: 'NT$亿',
      quarters: [
        ['20Q1', 34.5], ['20Q2', 42.2], ['20Q3', 40.8], ['20Q4', 44.5],
        ['21Q1', 38.9], ['21Q2', 44.6], ['21Q3', 41.7], ['21Q4', 45.8],
        ['22Q1', 52.3], ['22Q2', 64.8], ['22Q3', 60.2], ['22Q4', 66.7],
        ['23Q1', 60.4], ['23Q2', 68.9], ['23Q3', 63.8], ['23Q4', 68.9],
        ['24Q1', 64.5], ['24Q2', 74.8], ['24Q3', 70.2], ['24Q4', 75.5]
      ],
      crypto: { from: '21Q1', to: '22Q4', share: '约 10–20%' },
      ai: { from: '23Q1', note: 'AI/HPC ASIC 接棒（云厂自研芯片委托设计）' },
      aria: 'GUC（创意电子）2020 至 2024 年季度营收锯齿图：2021 至 2022 年 crypto 相关占比约一至两成，2023 年起 AI 与 HPC 委托设计接棒，营收呈锯齿波动。',
      note: 'GUC 的 crypto 敞口小于同业，但同样经历 2021–2022 放大与退潮；2023 年后云厂自研芯片（AI/HPC ASIC）委托设计成为主要增量。'
    }
  };

  function getData(cfg) {
    var d = (window.CHART_DATA && window.CHART_DATA[cfg.key]) || null;
    if (!d) return cfg;
    var out = {};
    for (var k in cfg) out[k] = cfg[k];
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

  function render(body, cfg) {
    body.innerHTML = '';
    var W = Math.max(320, body.clientWidth || 720);
    var H = BODY_H;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': cfg.aria }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg');

    var ml = 46, mr = 16, mt = 58, mb = 62;
    var plotW = W - ml - mr, plotH = H - mt - mb;
    var qs = cfg.quarters, n = qs.length;
    var maxV = 0;
    qs.forEach(function (q) { if (q[1] > maxV) maxV = q[1]; });
    maxV = Math.ceil(maxV * 1.12 / 10) * 10;

    var step = plotW / n;
    var barW = Math.max(6, step * 0.56);
    function X(i) { return ml + step * (i + 0.5); }
    function Y(v) { return mt + plotH - (v / maxV) * plotH; }

    // ---- crypto 占比阴影带 ----
    var ci0 = -1, ci1 = -1, ai0 = -1;
    qs.forEach(function (q, i) {
      if (q[0] === cfg.crypto.from) ci0 = i;
      if (q[0] === cfg.crypto.to) ci1 = i;
      if (q[0] === cfg.ai.from) ai0 = i;
    });
    if (ci0 >= 0 && ci1 >= 0) {
      var bx0 = ml + step * ci0 + 2, bx1 = ml + step * (ci1 + 1) - 2;
      el('rect', { x: bx0, y: mt, width: bx1 - bx0, height: plotH, fill: blueLo, 'fill-opacity': 0.10 }, svg);
      txt(svg, (bx0 + bx1) / 2, mt + 13, 'crypto 订单占比 ' + cfg.crypto.share, {
        'font-family': MONO, 'font-size': 9.5, fill: C('--blue-hi'), 'text-anchor': 'middle' });
    }
    // ---- AI 转型段标注 ----
    if (ai0 >= 0) {
      var ax0 = ml + step * ai0 + 2;
      el('line', { x1: ax0, x2: W - mr, y1: mt - 8, y2: mt - 8, stroke: blue, 'stroke-width': 1.4 }, svg);
      el('path', { d: 'M' + (W - mr) + ',' + (mt - 8) + ' l-6,-3.4 l0,6.8 Z', fill: blue }, svg);
      txt(svg, ax0 + 4, mt - 13, cfg.ai.note, { 'font-family': SERIF, 'font-size': 10.5, 'font-weight': 700, fill: blue });
    }

    // ---- 网格与 y 轴 ----
    var gy = 4;
    for (var g = 0; g <= gy; g++) {
      var v = maxV * g / gy, yy = Y(v);
      el('line', { x1: ml, x2: W - mr, y1: yy, y2: yy, stroke: lineLo, 'stroke-width': 1 }, svg);
      txt(svg, ml - 8, yy + 3, String(Math.round(v)), { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });
    }
    txt(svg, ml - 8, mt - 6, cfg.unit, { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });

    // ---- 锯齿连线（先画线，柱在上）----
    var down = 'stroke:' + neg;
    for (var i = 1; i < n; i++) {
      var x0 = X(i - 1), y0 = Y(qs[i - 1][1]), x1 = X(i), y1 = Y(qs[i][1]);
      var isDown = qs[i][1] < qs[i - 1][1];
      el('line', { x1: x0, y1: y0, x2: x1, y2: y1,
        stroke: isDown ? neg : inkLo, 'stroke-width': isDown ? 1.8 : 1.2,
        'stroke-opacity': isDown ? 0.9 : 0.8 }, svg);
    }

    // ---- 柱 + 热点 ----
    qs.forEach(function (q, i) {
      var v = q[1];
      var prev = i > 0 ? qs[i - 1][1] : null;
      var qoq = prev ? (v / prev - 1) * 100 : null;
      var inCrypto = (ci0 >= 0 && i >= ci0 && i <= ci1);
      var bh = plotH - (Y(v) - mt);
      var r = el('rect', { x: X(i) - barW / 2, y: Y(v), width: barW, height: bh,
        fill: blue, 'fill-opacity': inCrypto ? 0.92 : 0.55 }, svg);
      el('circle', { cx: X(i), cy: Y(v), r: 2.2, fill: '#fff', stroke: (prev && v < prev) ? neg : blue, 'stroke-width': 1.4 }, svg);
      var tip = '<b>' + cfg.name + ' · 20' + q[0].slice(0, 2) + ' ' + q[0].slice(2) + '</b><br>' +
        '季度营收约 <b>NT$' + v.toFixed(1) + ' 亿</b>' +
        (qoq == null ? '' : '（QoQ ' + (qoq >= 0 ? '+' : '') + qoq.toFixed(1) + '%）') +
        '<br><span style="color:' + inkMd + '">项目制认列，季度间呈锯齿波动' + (inCrypto ? '；位于 crypto 订单期' : '') + '</span>';
      var drill = {
        title: cfg.name + ' · 20' + q[0].slice(0, 2) + ' ' + q[0].slice(2),
        body: '季度营收约 NT$' + v.toFixed(1) + ' 亿（约数）。' + cfg.note,
        source: '公司月度营收公告 / 研究综合（季度值为约数）', date: '2026-07'
      };
      bindHot(r, tip, drill);
    });

    // ---- x 轴 ----
    el('line', { x1: ml, x2: W - mr, y1: mt + plotH, y2: mt + plotH, stroke: line, 'stroke-width': 1.2 }, svg);
    qs.forEach(function (q, i) {
      if (q[0].slice(2) === 'Q1') {
        el('line', { x1: ml + step * i, x2: ml + step * i, y1: mt + plotH, y2: mt + plotH + 5, stroke: line, 'stroke-width': 1 }, svg);
        txt(svg, ml + step * i + 2, mt + plotH + 17, '20' + q[0].slice(0, 2), { 'font-family': MONO, 'font-size': 10, fill: inkMd });
      }
    });
    // 缩小字号标注每一季
    if (step > 30) {
      qs.forEach(function (q, i) {
        txt(svg, X(i), mt + plotH + 30, q[0].slice(2), { 'font-family': MONO, 'font-size': 7.5, fill: inkLo, 'text-anchor': 'middle' });
      });
    }

    // ---- 图例 ----
    var lx = ml, ly = 26;
    el('rect', { x: lx, y: ly - 8, width: 10, height: 10, fill: blue, 'fill-opacity': 0.9 }, svg);
    txt(svg, lx + 15, ly, '季度营收（' + cfg.unit + '）', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });
    el('line', { x1: lx + 118, x2: lx + 142, y1: ly - 3, y2: ly - 3, stroke: neg, 'stroke-width': 1.8 }, svg);
    txt(svg, lx + 147, ly, '环比下滑段（锯齿）', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });
    el('rect', { x: lx + 262, y: ly - 8, width: 10, height: 10, fill: blueLo, 'fill-opacity': 0.25 }, svg);
    txt(svg, lx + 277, ly, 'crypto 订单期', { 'font-family': MONO, 'font-size': 9.5, fill: inkMd });

    // ---- 底部注记 ----
    txt(svg, ml, H - 8, '项目制收入认列 → 季度间起伏剧烈；crypto 订单放大波峰，AI 项目决定下一周期高度。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
  }

  Object.keys(CONFIGS).forEach(function (key) {
    window.Charts[key] = function (frame) {
      var body = frame.querySelector('.chart-body');
      if (!body) return;
      function draw() { render(body, getData(CONFIGS[key])); }
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
  });
})();
