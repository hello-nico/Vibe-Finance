/* capex_stairs.js —— §8 · 窗口六 · 2023–2026 · 当前周期
 * capex / OCF 约束阶梯图：Top-4 资本开支与经营现金流双阶梯对比 + 比率条 + 100% 约束阈值线。
 * 事实纪律：2025 / 2026E 为估计并明确标注；OCF 2026E ≈587 为 working estimate。
 * 注册：window.Charts['capex-stairs']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'capex-stairs';
  var BODY_H = 400;
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

  // US$B，日历年 Top-4 合计；2025E / 2026E 为估计
  var DEFAULT = {
    years: ['2023', '2024', '2025E', '2026E'],
    ocf: [345.3, 450.9, 513, 587],      // 2026E ≈587 为 working estimate（虚线延伸）
    capexLo: [154.3, 250.5, 412.9, 695],
    capexHi: [154.3, 250.5, 412.9, 725],
    estFrom: 2,                          // 从 2025E 起为估计
    note: 'OCF 为四家合计约数；2025E 为估计，2026E ≈587 为 working estimate，非公司指引加总。'
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
      'aria-label': 'Top-4 云厂资本开支与经营现金流双阶梯约束图：2023 至 2026E，capex 相对 OCF 的比率从约 45% 升至 2026E 的约 118–124%，越过 100% 约束阈值线。' }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg');

    var ml = 56, mr = 20, mt = 52, mbStrip = 118;
    var plotW = W - ml - mr;
    var plotH = H - mt - mbStrip;          // 主阶梯区
    var maxV = 780;
    function Y(v) { return mt + plotH - (v / maxV) * plotH; }

    var years = data.years, nS = years.length;
    var slotX = [];
    for (var i = 0; i <= nS; i++) slotX.push(ml + plotW * i / nS);

    function stepPath(vals, yFn) {
      var d = '';
      vals.forEach(function (v, i) {
        var xa = slotX[i], xb = slotX[i + 1], yy = yFn(v);
        d += (i === 0 ? 'M' + xa + ',' + yy : 'L' + xa + ',' + yy) + 'L' + xb + ',' + yy;
      });
      return d;
    }

    // ---- 网格 ----
    [0, 200, 400, 600].forEach(function (g) {
      el('line', { x1: ml, x2: ml + plotW, y1: Y(g), y2: Y(g), stroke: lineLo, 'stroke-width': 1 }, svg);
      txt(svg, ml - 8, Y(g) + 3, String(g), { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });
    });
    txt(svg, ml - 8, mt - 8, 'US$B', { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });

    // ---- 2026E capex 超出 OCF 的缺口阴影（neg 仅标记此缺口）----
    var gx0 = slotX[nS - 1], gx1 = slotX[nS];
    var ocf26 = data.ocf[nS - 1], capLo26 = data.capexLo[nS - 1], capHi26 = data.capexHi[nS - 1];
    el('rect', { x: gx0, y: Y(capLo26), width: gx1 - gx0, height: Y(ocf26) - Y(capLo26),
      fill: neg, 'fill-opacity': 0.08 }, svg);
    txt(svg, (gx0 + gx1) / 2, Y(ocf26) - 6, '缺口：转向债务/租赁融资', {
      'font-family': MONO, 'font-size': 8.8, fill: neg, 'text-anchor': 'middle' });

    // ---- 2026E capex 指引区间带 ----
    el('rect', { x: gx0, y: Y(capHi26), width: gx1 - gx0, height: Y(capLo26) - Y(capHi26),
      fill: blue, 'fill-opacity': 0.08, stroke: blue, 'stroke-width': 1, 'stroke-dasharray': '4,3' }, svg);

    // ---- OCF 阶梯（2026E 段为虚线估计）----
    el('path', { d: stepPath(data.ocf.slice(0, 3), Y), fill: 'none', stroke: inkMd, 'stroke-width': 2.2 }, svg);
    el('path', { d: 'M' + slotX[2] + ',' + Y(data.ocf[2]) + 'L' + slotX[3] + ',' + Y(data.ocf[2]) +
      'L' + slotX[3] + ',' + Y(data.ocf[3]) + 'L' + slotX[4] + ',' + Y(data.ocf[3]),
      fill: 'none', stroke: inkMd, 'stroke-width': 2, 'stroke-dasharray': '5,4' }, svg);
    // ---- capex 阶梯 ----
    el('path', { d: stepPath(data.capexLo.slice(0, 3), Y), fill: 'none', stroke: blue, 'stroke-width': 2.4 }, svg);
    // capex 2026E 区间上下沿虚线
    el('path', { d: 'M' + slotX[3] + ',' + Y(capLo26) + 'L' + slotX[4] + ',' + Y(capLo26),
      fill: 'none', stroke: blue, 'stroke-width': 1.6, 'stroke-dasharray': '4,3' }, svg);
    el('path', { d: 'M' + slotX[3] + ',' + Y(capHi26) + 'L' + slotX[4] + ',' + Y(capHi26),
      fill: 'none', stroke: blue, 'stroke-width': 1.6, 'stroke-dasharray': '4,3' }, svg);
    // capex 从 2025 到 2026E 的跳升 riser
    el('line', { x1: slotX[3], y1: Y(data.capexLo[2]), x2: slotX[3], y2: Y(capLo26),
      stroke: blue, 'stroke-width': 1.6, 'stroke-dasharray': '4,3' }, svg);

    // ---- 系列标注 ----
    txt(svg, slotX[1] + 6, Y(data.ocf[1]) - 8, '经营现金流 OCF', {
      'font-family': SERIF, 'font-size': 11.5, 'font-weight': 700, fill: inkMd });
    txt(svg, slotX[1] + 4, Y(data.capexLo[1]) - 10, '资本开支 capex', {
      'font-family': SERIF, 'font-size': 11.5, 'font-weight': 700, fill: blue });
    txt(svg, slotX[2] + 8, Y(data.capexLo[2]) - 10, '2025 ≈ 412.9', {
      'font-family': MONO, 'font-size': 9, fill: blue });
    txt(svg, gx1 - 4, Y(capHi26) - 6, '695–725', {
      'font-family': MONO, 'font-size': 9, fill: blue, 'text-anchor': 'end' });

    // ---- x 轴 ----
    el('line', { x1: ml, x2: ml + plotW, y1: Y(0), y2: Y(0), stroke: line, 'stroke-width': 1.2 }, svg);
    years.forEach(function (yy, i) {
      txt(svg, (slotX[i] + slotX[i + 1]) / 2, Y(0) + 16, yy, {
        'font-family': MONO, 'font-size': 10.5, fill: i >= data.estFrom ? blue : inkMd, 'text-anchor': 'middle' });
    });

    // ---- 交互热区（按槽）----
    years.forEach(function (yy, i) {
      var cap = i === 3 ? (capLo26 + '–' + capHi26) : String(data.capexLo[i]);
      var ocf = data.ocf[i];
      var rLo = data.capexLo[i] / ocf * 100, rHi = data.capexHi[i] / ocf * 100;
      var ratio = (Math.abs(rHi - rLo) < 0.5) ? rLo.toFixed(0) + '%' : rLo.toFixed(0) + '–' + rHi.toFixed(0) + '%';
      var hot = el('rect', { x: slotX[i], y: mt, width: slotX[i + 1] - slotX[i], height: plotH, fill: 'transparent' }, svg);
      var est = i >= data.estFrom ? '（估计）' : '';
      bindHot(hot,
        '<b>' + yy + '</b> · Top-4 合计' + est + '<br>capex：≈ US$<b>' + cap + 'B</b><br>OCF：≈ US$<b>' + ocf + 'B</b>' +
        '<br>capex/OCF ≈ <b>' + ratio + '</b>',
        { title: yy + ' · capex / OCF' + est,
          body: 'Top-4（Microsoft / Google / Amazon / Meta）日历年合计：capex ≈ US$' + cap + 'B，经营现金流 ≈ US$' + ocf + 'B，比率约 ' + ratio + '。' + (i === 3 ? '2026E 指引区间越过经营现金流：差额需由债务、租赁与资产负债表吸收——约束第一次显形。' : '') + data.note,
          source: i >= data.estFrom ? '研究综合（估计）' : '公司披露', date: '2026-07' });
    });

    // ================= 比率条（capex/OCF） =================
    var st = mt + plotH + 34;              // 比率条顶部
    var sh = 52;                           // 比率条高度
    var rMax = 125;
    function RY(r) { return st + sh - (r / rMax) * sh; }

    txt(svg, ml, st - 8, 'capex / OCF（%）', { 'font-family': MONO, 'font-size': 9.5, fill: inkLo });

    // 100% 阈值线
    el('line', { x1: ml, x2: ml + plotW, y1: RY(100), y2: RY(100), stroke: neg, 'stroke-width': 1.3, 'stroke-dasharray': '6,4' }, svg);
    txt(svg, ml + 4, RY(100) - 5, '阈值 100%：自融资极限', {
      'font-family': MONO, 'font-size': 8.8, fill: neg });
    // 阈值上方区域（>100%）轻阴影
    el('rect', { x: ml, y: RY(rMax), width: plotW, height: RY(100) - RY(rMax), fill: neg, 'fill-opacity': 0.04 }, svg);

    // 比率阶梯（2026E 为区间带）
    var ratiosLo = [], ratiosHi = [];
    years.forEach(function (yy, i) {
      ratiosLo.push(data.capexLo[i] / data.ocf[i] * 100);
      ratiosHi.push(data.capexHi[i] / data.ocf[i] * 100);
    });
    el('path', { d: stepPath(ratiosLo.slice(0, 3), RY), fill: 'none', stroke: blue, 'stroke-width': 2 }, svg);
    el('rect', { x: gx0, y: RY(ratiosHi[3]), width: gx1 - gx0, height: RY(ratiosLo[3]) - RY(ratiosHi[3]),
      fill: blue, 'fill-opacity': 0.15, stroke: blue, 'stroke-width': 1, 'stroke-dasharray': '4,3' }, svg);
    el('line', { x1: slotX[3], y1: RY(ratiosLo[2]), x2: slotX[3], y2: RY(ratiosLo[3]),
      stroke: blue, 'stroke-width': 1.4, 'stroke-dasharray': '4,3' }, svg);

    // 比率值标签
    ratiosLo.forEach(function (r, i) {
      var lab = Math.abs(ratiosHi[i] - r) < 0.5 ? r.toFixed(0) + '%' : r.toFixed(0) + '–' + ratiosHi[i].toFixed(0) + '%';
      txt(svg, (slotX[i] + slotX[i + 1]) / 2, RY(ratiosHi[i]) - 6, lab, {
        'font-family': MONO, 'font-size': 9.5, 'font-weight': 700,
        fill: ratiosHi[i] > 100 ? neg : blue, 'text-anchor': 'middle' });
    });
    el('line', { x1: ml, x2: ml + plotW, y1: st + sh, y2: st + sh, stroke: lineLo, 'stroke-width': 1 }, svg);

    // ---- 顶部与底部注记 ----
    txt(svg, ml, 22, '约束显形：2026E 指引区间越过经营现金流（阈值线 100%）', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink });
    txt(svg, ml, 38, '实线 = 公司披露；虚线 = 估计（2025E / 2026E）', {
      'font-family': MONO, 'font-size': 9.5, fill: inkLo });
    txt(svg, ml, H - 8, 'capex 可以暂时高于 OCF——用债务和租赁补上；但比率越过阈值后，每一分增长都要向债权人证明。', {
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
