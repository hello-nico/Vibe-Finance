/* js/charts/tpu.js — TPU 对数轴算力线图（Agent F）
 * 注册：window.Charts['tpu']
 * 数据：window.CHART_DATA['tpu'].gens（gen/deploy/disclose/note，部署先于披露口径）
 *       峰值算力（peak compute）为各代公司披露值，按本文件 PEAK 表接入；缺失标「未披露」。
 * 设计：log 轴 peak compute，TPU v1 92 TOPS INT8（2015）→ v8t ≈9 PFLOPS FP4（估计，2026）；
 *       代际间标 ×2.3 / ×2.0 / ×5.0 / ≈×2.0 倍增；顶部三范式带 CNN / RNN·NMT / TRANSFORMER→INFERENCE；
 *       图侧「为何重要」说明块；注明精度口径不直接可比、约 12 个月迭代节奏；
 *       部署/披露错位标记；hover tooltip / 点击代际节点弹 drill。SVG 主体 ≈430px。
 */
(function () {
'use strict';
window.Charts = window.Charts || {};

var NS = 'http://www.w3.org/2000/svg';
function css(name, fb) {
  try {
    var v = '';
    if (window.Utils && typeof Utils.css === 'function') v = Utils.css(name);
    if (!v) v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  } catch (e) { return fb; }
}
function S(tag, attrs, parent) {
  var n = document.createElementNS(NS, tag);
  if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function T(parent, x, y, str, attrs) {
  var t = S('text', attrs, parent);
  t.setAttribute('x', x); t.setAttribute('y', y);
  t.textContent = str;
  return t;
}
function tipShow(html, x, y) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, x, y); }
function tipMove(x, y) { if (window.Utils && Utils.tooltip && Utils.tooltip.move) Utils.tooltip.move(x, y); }
function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
function drillOpen(d) { if (window.Utils && Utils.drill && d) Utils.drill.open(d); }
function bind(el, html, drill) {
  el.setAttribute('tabindex', '0');
  el.style.cursor = 'pointer';
  el.addEventListener('mouseenter', function (e) { tipShow(html, e.clientX, e.clientY); });
  el.addEventListener('mousemove', function (e) { tipMove(e.clientX, e.clientY); });
  el.addEventListener('mouseleave', tipHide);
  el.addEventListener('focus', function () {
    var r = el.getBoundingClientRect();
    tipShow(html, r.left + r.width / 2, r.top);
  });
  el.addEventListener('blur', tipHide);
  el.addEventListener('click', function () { drillOpen(drill); });
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drillOpen(drill); }
  });
}
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* 峰值算力表（T = 10^12 ops/s；公司披露口径，任务给定端点；v8t 峰值 ≈9 PFLOPS FP4 为估计（K28，替换原 12.6 口径））
 * key 对应 CHART_DATA.tpu.gens 的 gen 名 */
var PEAK = {
  'TPU v1':          { t: 92,    prec: 'INT8', val: '92 TOPS INT8' },
  'TPU v2':          { t: 45,    prec: 'BF16', val: '45 TFLOPS BF16' },
  'TPU v3':          { t: 90,    prec: 'BF16', val: '90 TFLOPS BF16' },
  'TPU v4':          { t: 275,   prec: 'BF16', val: '275 TFLOPS BF16' },
  'TPU v5e':         { t: 197,   prec: 'BF16', val: '197 TFLOPS BF16' },
  'TPU v5p':         { t: 459,   prec: 'BF16', val: '459 TFLOPS BF16' },
  'TPU v6 Trillium': { t: 918,   prec: 'BF16', val: '≈918 TFLOPS BF16' },
  'TPU v7 Ironwood': { t: 4614,  prec: 'FP8',  val: '≈4.6 PFLOPS FP8' },
  'TPU v8':          { t: 9000,  prec: 'FP4',  val: '≈9 PFLOPS FP4（估计）', disp: 'TPU v8t' }
};
/* 倍增徽章：挂在对数轴主线/支线的代际衔接上（数值为披露值之比，口径见脚注） */
var MULTS = [
  { from: 'TPU v5e', to: 'TPU v5p', label: '×2.3' },
  { from: 'TPU v5p', to: 'TPU v6 Trillium', label: '×2.0', dx: 7, dy: 14 },
  { from: 'TPU v6 Trillium', to: 'TPU v7 Ironwood', label: '×5.0' },
  { from: 'TPU v7 Ironwood', to: 'TPU v8', label: '≈×2.0' }
];
/* 主线顺序（v5e 为轻量支线） */
var MAIN = ['TPU v1', 'TPU v2', 'TPU v3', 'TPU v4', 'TPU v5p', 'TPU v6 Trillium', 'TPU v7 Ironwood', 'TPU v8'];
/* 顶部三范式带（年份区间 + 标签） */
var PARADIGMS = [
  { from: 2014.5, to: 2015.6, label: 'CNN' },
  { from: 2015.6, to: 2018,   label: 'RNN · NMT' },
  { from: 2018,   to: 2026.5, label: 'TRANSFORMER → INFERENCE' }
];
/* 标签摆放（相对节点）：above / below / right / aboveEnd */
var LABEL_POS = {
  'TPU v1': 'above', 'TPU v2': 'right', 'TPU v3': 'above', 'TPU v4': 'aboveEnd',
  'TPU v5e': 'below', 'TPU v5p': 'above', 'TPU v6 Trillium': 'aboveEnd',
  'TPU v7 Ironwood': 'aboveEnd', 'TPU v8': 'aboveEnd'
};

window.Charts['tpu'] = function (frame) {
  var body = frame.querySelector('.chart-body');
  if (!body) return;
  body.setAttribute('role', 'img');
  body.setAttribute('aria-label',
    'TPU 对数轴算力线图：2015 年 TPU v1 92 TOPS INT8 到 2026 年 TPU v8t ≈9 PFLOPS FP4（估计），' +
    '代际间标注倍增；顶部为 CNN、RNN·NMT、Transformer 到推理三范式带；各代精度口径不直接可比；' +
    '悬停查看详情，点击代际节点展开资料卡');
  var lastW = 0;

  function render() {
    var W = body.clientWidth || 0;
    if (W < 620) W = 620;
    lastW = W;
    var H = 430;
    body.innerHTML = '';

    var INK = css('--ink', '#051c2c'), INKMD = css('--ink-md', '#42566a'),
        INKLO = css('--ink-lo', '#8595a6'), LINE = css('--line', '#dbe2ea'),
        LINELO = css('--line-lo', '#eef1f6'), PAPERHI = css('--paper-hi', '#f7f9fc'),
        BLUE = css('--blue', '#2251ff'), BLUELO = css('--blue-lo', '#7d9bff'),
        COPPER = css('--copper', '#b07a10');

    /* 数据：CHART_DATA.tpu.gens + PEAK 表 */
    var gensSrc = (window.CHART_DATA && window.CHART_DATA.tpu && window.CHART_DATA.tpu.gens) || [];
    var gens = {};
    gensSrc.forEach(function (g) {
      var p = PEAK[g.gen] || null;
      gens[g.gen] = {
        gen: (p && p.disp) || g.gen,
        deploy: +g.deploy, disclose: +g.disclose,
        note: g.note || '',
        peak: p,
        val: p ? p.val : '未披露',
        t: p ? p.t : null
      };
    });
    var G = function (k) { return gens[k]; };

    /* 坐标：左侧 y 轴，右侧「为何重要」说明块 */
    var panelW = 178, padL = 56, padR = 14;
    var plotL = padL, plotR = W - panelW - padR - 10;
    var plotT = 52, plotB = 336, axisY = plotB;
    var X0 = 2014.5, X1 = 2026.5;
    function x(yr) { return plotL + (yr - X0) / (X1 - X0) * (plotR - plotL); }
    var LOG0 = Math.log(30) / Math.LN10, LOG1 = Math.log(30000) / Math.LN10;
    function y(t) { return plotB - (Math.log(t) / Math.LN10 - LOG0) / (LOG1 - LOG0) * (plotB - plotT); }

    var svg = S('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width: '100%', height: H,
      style: 'display:block;font-family:var(--serif)',
      'aria-hidden': 'true'
    }, body);

    /* ---------------- 顶部三范式带 ---------------- */
    T(svg, plotL - 8, 27, '范式', { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'end', style: 'font-family:var(--mono)' });
    PARADIGMS.forEach(function (p) {
      var xa = x(p.from), xb = Math.min(x(p.to), plotR);
      S('rect', { x: xa, y: 14, width: Math.max(2, xb - xa), height: 18, fill: PAPERHI, stroke: LINELO, 'stroke-width': 1 }, svg);
      T(svg, (xa + xb) / 2, 26.5, p.label, {
        'font-size': 8.5, fill: INKMD, 'text-anchor': 'middle',
        style: 'font-family:var(--mono);letter-spacing:.06em'
      });
    });

    /* ---------------- log 轴网格 + 刻度 ---------------- */
    [[100, '100 T'], [1000, '1 P'], [10000, '10 P']].forEach(function (tk) {
      var yy = y(tk[0]);
      S('line', { x1: plotL, y1: yy, x2: plotR, y2: yy, stroke: LINELO, 'stroke-width': 1 }, svg);
      T(svg, plotL - 8, yy + 3, tk[1], { 'font-size': 9, fill: INKLO, 'text-anchor': 'end', style: 'font-family:var(--mono)' });
    });
    T(svg, plotL, plotT - 6, 'peak compute（log）', { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'start', style: 'font-family:var(--mono)' });
    S('line', { x1: plotL, y1: plotT - 8, x2: plotL, y2: axisY, stroke: LINE, 'stroke-width': 1 }, svg);

    /* ---------------- x 轴（部署年份） ---------------- */
    S('line', { x1: plotL, y1: axisY, x2: plotR, y2: axisY, stroke: LINE, 'stroke-width': 1.2 }, svg);
    for (var yr = 2015; yr <= 2026; yr++) {
      var xx = x(yr);
      S('line', { x1: xx, y1: axisY, x2: xx, y2: axisY + 4, stroke: LINE, 'stroke-width': 1 }, svg);
      if (yr % 2 === 1 || yr === 2026) {
        T(svg, xx, axisY + 14, String(yr), { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'middle', style: 'font-family:var(--mono)' });
      }
    }
    T(svg, plotR, axisY + 26, '部署年份（先部署，后披露）', { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'end', style: 'font-family:var(--mono)' });

    /* ---------------- 主线：v1 → v8t ---------------- */
    var pts = MAIN.map(function (k) {
      var g = G(k);
      return g && g.t != null ? { k: k, g: g, px: x(g.deploy), py: y(g.t) } : null;
    }).filter(Boolean);
    if (pts.length > 1) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.px.toFixed(1) + ' ' + p.py.toFixed(1); }).join(' ');
      S('path', { d: d, fill: 'none', stroke: BLUE, 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, svg);
    }
    /* v5e 支线：v5p 垂直向下（同年轻量推理 SKU） */
    var e5 = G('TPU v5e'), p5 = G('TPU v5p');
    if (e5 && p5 && e5.t != null && p5.t != null) {
      S('line', {
        x1: x(p5.deploy), y1: y(p5.t), x2: x(e5.deploy), y2: y(e5.t),
        stroke: BLUELO, 'stroke-width': 1.2
      }, svg);
    }

    /* ---------------- 部署/披露错位标记（v1 2015→2016；v4 2020→2021） ---------------- */
    ['TPU v1', 'TPU v4'].forEach(function (k) {
      var g = G(k);
      if (!g || g.t == null || !(g.disclose > g.deploy)) return;
      var yy = y(g.t);
      S('line', { x1: x(g.deploy), y1: yy, x2: x(g.disclose), y2: yy, stroke: INKLO, 'stroke-width': 1, 'stroke-dasharray': '2 3' }, svg);
      S('circle', { cx: x(g.disclose), cy: yy, r: 3, fill: '#fff', stroke: INKLO, 'stroke-width': 1.2 }, svg);
    });

    /* ---------------- 倍增徽章 ---------------- */
    MULTS.forEach(function (m) {
      var a = G(m.from), b = G(m.to);
      if (!a || !b || a.t == null || b.t == null) return;
      var mx = (x(a.deploy) + x(b.deploy)) / 2, my = (y(a.t) + y(b.t)) / 2;
      var vertical = Math.abs(x(a.deploy) - x(b.deploy)) < 2;
      var bx = vertical ? mx + 8 : mx + (m.dx || 0), by = vertical ? my + 3 : my + (m.dy || -7);
      T(svg, bx, by, m.label, {
        'font-size': 10, fill: BLUE, 'font-weight': 700,
        'text-anchor': vertical ? 'start' : 'middle',
        style: 'font-family:var(--mono);paint-order:stroke;stroke:#fff;stroke-width:3px'
      });
    });

    /* ---------------- 代际节点 + 标签 + 交互 ---------------- */
    var order = MAIN.concat(['TPU v5e']);
    order.forEach(function (k) {
      var g = G(k);
      if (!g) return;
      var px = x(g.deploy);
      var py = g.t != null ? y(g.t) : null;
      var grp = S('g', {}, svg);
      if (py != null) {
        S('circle', { cx: px, cy: py, r: 4, fill: BLUE, stroke: '#fff', 'stroke-width': 1.4 }, grp);
        var pos = LABEL_POS[k] || 'above';
        var name = g.gen, val = g.val + ' · ' + g.deploy;
        var nx = px, ny, anchor = 'middle';
        if (pos === 'above') { ny = py - 22; }
        else if (pos === 'below') { ny = py + 28; }
        else if (pos === 'right') { nx = px + 9; ny = py - 4; anchor = 'start'; }
        else if (pos === 'leftEnd') { nx = px - 8; ny = py - 6; anchor = 'end'; }
        else { nx = px - 8; ny = py - 20; anchor = 'end'; } /* aboveEnd */
        T(grp, nx, ny, name, { 'font-size': 10.5, fill: INK, 'font-weight': 700, 'text-anchor': anchor,
          style: 'paint-order:stroke;stroke:#fff;stroke-width:3px' });
        T(grp, nx, ny + 11.5, val, { 'font-size': 8.5, fill: INKLO, 'text-anchor': anchor,
          style: 'font-family:var(--mono);paint-order:stroke;stroke:#fff;stroke-width:3px' });
      } else {
        /* 缺值：时间轴上空位标注 未披露 */
        T(grp, px, axisY - 8, g.gen + ' · 未披露', { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'middle' });
      }
      var tip = '<div class="t-title">' + esc(g.gen + ' · ' + g.deploy + ' 部署') + '</div>' +
                '<div>峰值算力：' + esc(g.val) + '（' + esc(g.peak ? g.peak.prec : '未披露') + ' 口径）</div>' +
                '<div>' + esc(g.note || '未披露') + '</div>' +
                '<div class="t-sub">点击查看资料卡</div>';
      var drill = {
        title: g.gen + ' · ' + g.deploy + ' 部署' + (g.disclose > g.deploy ? ' / ' + g.disclose + ' 披露' : ''),
        body: '峰值算力 ' + g.val + '（' + (g.peak ? g.peak.prec : '未披露') + ' 口径）。' + (g.note || '') +
              (k === 'TPU v8' ? ' 详细规格未披露（K28）；图中峰值为研究综合口径（FP4），与前几代 INT8/BF16/FP8 不直接可比。' : ' 各代精度口径不同，数值不直接可比。'),
        source: k === 'TPU v8' ? '研究综合' : '公司披露（Google）/ 研究综合',
        date: String(g.disclose || g.deploy)
      };
      /* 透明热区，便于点击 */
      if (py != null) S('circle', { cx: px, cy: py, r: 12, fill: 'transparent' }, grp);
      bind(grp, tip, drill);
    });

    /* ---------------- 图例 ---------------- */
    var ly = 372;
    S('circle', { cx: plotL + 4, cy: ly - 3, r: 3.5, fill: BLUE }, svg);
    T(svg, plotL + 12, ly, '部署年份（节点）', { 'font-size': 8.5, fill: INKLO });
    S('circle', { cx: plotL + 96, cy: ly - 3, r: 3, fill: '#fff', stroke: INKLO, 'stroke-width': 1.2 }, svg);
    T(svg, plotL + 104, ly, '披露年份（虚线错位）', { 'font-size': 8.5, fill: INKLO });
    T(svg, plotL + 208, ly, '×N = 相邻代际峰值算力倍增', { 'font-size': 8.5, fill: INKLO, style: 'font-family:var(--mono)' });

    /* ---------------- 图侧「为何重要」说明块 ---------------- */
    var px0 = plotR + 12, pw = panelW - 4;
    var box = S('g', {}, svg);
    S('rect', { x: px0, y: 52, width: pw, height: 178, fill: PAPERHI, stroke: LINELO, 'stroke-width': 1, rx: 2 }, box);
    T(box, px0 + 10, 70, '为何重要', {
      'font-size': 10, fill: BLUE, 'font-weight': 700,
      style: 'font-family:var(--mono);letter-spacing:.18em'
    });
    S('line', { x1: px0 + 10, y1: 78, x2: px0 + pw - 10, y2: 78, stroke: LINE, 'stroke-width': 1 }, box);
    var whyLines = [
      '十一年间，单芯片峰值算力',
      '提升约三个数量级。',
      '负载范式每 2–3 年切换一',
      '次：CNN → RNN/NMT →',
      'Transformer → 推理。',
      '部署始终先于披露：外界看',
      '到论文时，芯片已在机房运',
      '行多年。'
    ];
    whyLines.forEach(function (ln, i) {
      T(box, px0 + 10, 96 + i * 15.5, ln, { 'font-size': 10, fill: INKMD });
    });

    /* ---------------- 脚注 ---------------- */
    T(svg, plotL, 398, '注：各代精度口径不同（INT8 / BF16 / FP8 / FP4），峰值数值不直接可比；log 轴仅示数量级。',
      { 'font-size': 9, fill: INKLO });
    T(svg, plotL, 413, '迭代节奏约 12 个月一代（2015–2026 · 九代）；v8t 详细规格未披露（K28），峰值为研究综合口径。',
      { 'font-size': 9, fill: INKLO });
  }

  render();
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () {
      var w = body.clientWidth || 0;
      if (Math.abs(w - lastW) > 2) render();
    });
    ro.observe(body);
  }
};
})();
