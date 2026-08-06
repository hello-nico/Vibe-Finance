/* mining.js —— 插曲 · 2017–2022 · 挖矿镜像
 * 时间轴 + 事件带：挖矿 ASIC 兴起（Bitmain）、NVIDIA 两次库存冲击（2019 / 2022 crypto hangover）。
 * 数据：window.CHART_DATA['mining'] = {unit, fyLabel, series:[[财年,US$B]], shocks:[{fy,label}], events:[{year,label}]}
 *   —— 本文件内置适配器：财年 fy 映射为时间跨度（FYxxxx = 前年 2 月–当年 1 月），events.year 映射为 plaque 位置。
 *   —— CHART_DATA 缺失时使用内嵌兜底数据（同 schema 的等价默认）。
 * 视觉：BTC 背景曲线（左轴）+ NVIDIA 游戏分部财年阶梯线 + 冲击阴影带 + 事件 plaque；--neg 仅标记负值。
 * 注册：window.Charts['mining']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'mining';
  var BODY_H = 380;

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

  // 兜底数据（与 CHART_DATA.mining 同 schema；BTC 为背景参考序列）
  var DEFAULT = {
    unit: 'US$B（财年）',
    fyLabel: 'NVIDIA 游戏分部收入（财年，截至次年 1 月）',
    series: [[2018, 5.5], [2019, 6.3], [2020, 5.5], [2021, 7.8], [2022, 12.5], [2023, 9.1]],
    shocks: [
      { fy: 2020, label: '第一次库存冲击（2018Q4–2019）' },
      { fy: 2023, label: '第二次库存冲击（2022）' }
    ],
    events: [
      { year: 2017, label: 'crypto 牛市点火，Bitmain 崛起' },
      { year: 2019, label: 'crypto hangover：游戏分部下滑' },
      { year: 2021, label: '第二波牛市 + 短缺' },
      { year: 2022, label: '以太坊转 PoS，第二次库存冲击' }
    ],
    note: 'K36：两次库存冲击（2019 / 2022）；序列为公司披露约数',
    // 比特币季度末价格（千美元）——背景镜像曲线（图表内嵌参考数据）
    btc: [
      [2017.00, 1.1], [2017.25, 2.5], [2017.50, 4.3], [2017.75, 14.0],
      [2018.00, 6.9], [2018.25, 6.4], [2018.50, 6.6], [2018.75, 3.8],
      [2019.00, 4.1], [2019.25, 10.8], [2019.50, 8.3], [2019.75, 7.2],
      [2020.00, 6.4], [2020.25, 9.1], [2020.50, 10.8], [2020.75, 29.0],
      [2021.00, 58.9], [2021.25, 34.6], [2021.50, 43.8], [2021.75, 46.2],
      [2022.00, 45.5], [2022.25, 18.7], [2022.50, 19.4], [2022.75, 16.5]
    ]
  };

  function getRaw() {
    var d = (window.CHART_DATA && window.CHART_DATA[KEY]) || null;
    if (!d) return DEFAULT;
    var out = {};
    for (var k in DEFAULT) out[k] = DEFAULT[k];
    for (var k2 in d) if (d[k2] != null) out[k2] = d[k2];
    return out;
  }

  /* 适配器：把 {series, shocks:[{fy,label}], events:[{year,label}]} 归一化为渲染模型。
   * 财年映射：FYxxxx = (xxxx-1) 年 2 月 → xxxx 年 1 月（NVIDIA 财年截至次年 1 月）。 */
  function normalize(raw) {
    // 已归一化（含渲染字段）则直接使用
    if (raw.events && raw.events.length && typeof raw.events[0].t === 'number' && raw.shocks && typeof raw.shocks[0].from === 'number') {
      return raw;
    }
    var shocks = (raw.shocks || []).map(function (s) {
      var fy = +s.fy;
      return { from: fy - 1 + 2 / 12, to: fy + 1 / 12, label: s.label, fy: fy };
    });
    var ups = 0, downs = 0;
    var events = (raw.events || []).slice()
      .sort(function (a, b) { return a.year - b.year; })
      .map(function (e, i) {
        var side = (i % 2 === 0) ? 'up' : 'down';
        var row;
        if (side === 'up') { row = ups % 2; ups++; } else { row = downs % 2; downs++; }
        var neg = /hangover|库存|下滑|冲击|下跌/.test(e.label);
        var parts = e.label.split(/[，：]/);
        var title = parts[0];
        var sub = (parts.length > 1 ? parts.slice(1).join('，') + ' · ' : '') + e.year;
        return {
          t: e.year + 0.5, side: side, row: row, neg: neg,
          title: title, sub: sub,
          tip: e.label,
          drill: {
            title: title + '（' + e.year + '）',
            body: e.label + '。' + (raw.note || '挖矿需求放大又收回，镜像了定制芯片周期的第一轮完整起伏。'),
            source: '公司披露 / 研究综合', date: '2026-07'
          }
        };
      });
    return {
      btc: raw.btc || DEFAULT.btc,
      series: (raw.series || []).filter(function (p) { return p[1] != null; }),
      seriesUnit: raw.unit || DEFAULT.unit,
      fyLabel: raw.fyLabel || DEFAULT.fyLabel,
      shocks: shocks,
      events: events,
      note: raw.note || ''
    };
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
    var W = Math.max(320, body.clientWidth || 720);
    var H = BODY_H;
    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '2017 至 2022 年挖矿镜像周期：比特币价格背景曲线与 NVIDIA 游戏分部财年阶梯线之上，标注挖矿 ASIC（Bitmain）的兴起，以及 NVIDIA 2019 年与 2022 年两次库存冲击。' }, body);

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg');

    var ml = 46, mr = 18, mt = 124, mb = 30;
    var plotW = W - ml - mr;
    var plotH = 128;                 // 背景 BTC 曲线区
    var plotTop = mt, plotBot = mt + plotH;
    var axisY = plotBot + 26;        // 时间轴带

    var t0 = 2017, t1 = 2023;
    function X(t) { return ml + (t - t0) / (t1 - t0) * plotW; }
    function XC(t) { return Math.max(ml, Math.min(W - mr, X(t))); }   // 钳制到绘图区
    var maxP = 72;
    function Y(p) { return plotBot - (p / maxP) * plotH; }

    // ---- 顶部说明 ----
    txt(svg, ml, 20, '镜像：两轮加密牛市 → 两轮库存坠落', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: inkMd });
    txt(svg, ml, 36, '灰线：比特币季度末价格（千美元，左轴）· 蓝阶梯：NVIDIA 游戏分部收入（US$B，财年）· 红色仅标记负值事件', {
      'font-family': MONO, 'font-size': 9, fill: inkLo });

    // ---- 库存冲击阴影带（财年映射跨度，先于曲线，置于底层）----
    data.shocks.forEach(function (s) {
      var x0 = XC(s.from), x1 = XC(s.to);
      el('rect', { x: x0, y: plotTop, width: Math.max(2, x1 - x0), height: plotH,
        fill: neg, 'fill-opacity': 0.07 }, svg);
      txt(svg, (x0 + x1) / 2, plotTop + 12, s.label, {
        'font-family': MONO, 'font-size': 9, fill: neg, 'text-anchor': 'middle' });
    });

    // ---- 背景网格（极简）----
    [0, 20, 40, 60].forEach(function (g) {
      el('line', { x1: ml, x2: W - mr, y1: Y(g), y2: Y(g), stroke: lineLo, 'stroke-width': 1 }, svg);
      txt(svg, ml - 8, Y(g) + 3, String(g), { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });
    });
    txt(svg, ml - 8, plotTop - 6, '千美元', { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'end' });

    // ---- BTC 面积 + 折线 ----
    var pts = data.btc;
    if (pts && pts.length) {
      var dLine = '', dArea = '';
      pts.forEach(function (p, i) {
        var cmd = (i === 0 ? 'M' : 'L') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1);
        dLine += cmd;
        dArea += cmd;
      });
      dArea += 'L' + X(pts[pts.length - 1][0]).toFixed(1) + ',' + plotBot + 'L' + X(pts[0][0]).toFixed(1) + ',' + plotBot + 'Z';
      el('path', { d: dArea, fill: blue, 'fill-opacity': 0.06, stroke: 'none' }, svg);
      el('path', { d: dLine, fill: 'none', stroke: inkLo, 'stroke-width': 1.4 }, svg);
      txt(svg, X(2017.75), Y(14) - 10, '≈2 万', { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'middle' });
      txt(svg, X(2021.6), Y(60) + 2, '≈6.9 万', { 'font-family': MONO, 'font-size': 9, fill: inkLo, 'text-anchor': 'middle' });
      txt(svg, X(2021.05), Y(58.9) - 12, '见顶 ↓', { 'font-family': SERIF, 'font-size': 10.5, fill: neg, 'text-anchor': 'middle' });
    }

    // ---- NVIDIA 游戏分部财年阶梯线（蓝）----
    var sMax = 14;
    function YS(v) { return plotBot - (v / sMax) * plotH; }
    if (data.series && data.series.length) {
      var dStep = '';
      data.series.forEach(function (p, i) {
        var fy = p[0], v = p[1];
        var xa = XC(fy - 1 + 2 / 12), xb = XC(fy + 1 / 12), yy = YS(v);
        dStep += (i === 0 ? 'M' + xa + ',' + yy : 'L' + xa + ',' + yy) + 'L' + xb + ',' + yy;
      });
      el('path', { d: dStep, fill: 'none', stroke: blue, 'stroke-width': 1.8, 'stroke-opacity': 0.85 }, svg);
      data.series.forEach(function (p) {
        var fy = p[0], v = p[1];
        var xm = (XC(fy - 1 + 2 / 12) + XC(fy + 1 / 12)) / 2, yy = YS(v);
        var mk = el('circle', { cx: xm, cy: yy, r: 3, fill: '#fff', stroke: blue, 'stroke-width': 1.6 }, svg);
        txt(svg, xm, yy - 7, String(v), { 'font-family': MONO, 'font-size': 8.5, fill: blue, 'text-anchor': 'middle' });
        bindHot(mk, '<b>FY' + fy + ' · NVIDIA 游戏分部</b><br>收入 ≈ US$<b>' + v + 'B</b><br>' +
          '<span style="color:' + inkMd + '">' + data.fyLabel + '</span>',
          { title: 'NVIDIA 游戏分部 · FY' + fy,
            body: data.fyLabel + '：FY' + fy + ' ≈ US$' + v + 'B。两次下滑（FY2020、FY2023）正对应两轮 crypto 库存冲击——挖矿需求的起落被直接写进了这张损益表。',
            source: '公司披露（约数）', date: '2026-07' });
      });
      txt(svg, XC(2018.6), YS(5.5) + 16, '游戏分部（财年）', { 'font-family': MONO, 'font-size': 8.5, fill: blue });
    }

    // ---- 时间轴带 ----
    el('line', { x1: ml, x2: W - mr, y1: axisY, y2: axisY, stroke: line, 'stroke-width': 1.2 }, svg);
    for (var yr = t0; yr <= t1; yr++) {
      el('line', { x1: X(yr), x2: X(yr), y1: axisY - 4, y2: axisY + 4, stroke: line, 'stroke-width': 1 }, svg);
      txt(svg, X(yr), axisY + 18, String(yr), { 'font-family': MONO, 'font-size': 10, fill: inkMd, 'text-anchor': 'middle' });
    }

    // ---- 事件 plaque ----
    var plaqueW = 150, plaqueH = 34;
    data.events.forEach(function (ev) {
      var x = XC(ev.t);
      var upRows = [mt - 44, mt - 84];       // 轴上方两排（位于 plot 区顶部留白）
      var downRows = [axisY + 30, axisY + 64];
      var py = (ev.side === 'up') ? upRows[ev.row] : downRows[ev.row];
      var px = Math.max(4, Math.min(W - plaqueW - 4, x - plaqueW / 2));
      var accent = ev.neg ? neg : blue;
      var anchorY = (ev.side === 'up') ? (py + plaqueH) : py;

      // 连接虚线：plaque → 时间轴 pin
      el('line', { x1: x, x2: x, y1: anchorY, y2: axisY - 5, stroke: accent, 'stroke-width': 1,
        'stroke-dasharray': '2,3', 'stroke-opacity': 0.75 }, svg);
      el('circle', { cx: x, cy: axisY, r: 4, fill: '#fff', stroke: accent, 'stroke-width': 1.6 }, svg);

      var g = el('g', {}, svg);
      el('rect', { x: px, y: py, width: plaqueW, height: plaqueH, fill: '#fff', stroke: line, 'stroke-width': 1 }, g);
      el('rect', { x: px, y: py, width: 2.5, height: plaqueH, fill: accent }, g);
      txt(g, px + 9, py + 14, ev.title, { 'font-family': SERIF, 'font-size': 11,
        'font-weight': 700, fill: ev.neg ? neg : ink });
      txt(g, px + 9, py + 27, ev.sub, { 'font-family': MONO, 'font-size': 8.8, fill: inkLo });
      bindHot(g, '<b>' + ev.title + '</b><br><span style="color:' + inkMd + '">' + ev.tip + '</span>', ev.drill);
    });

    // ---- 底部注记 ----
    txt(svg, ml, H - 8, '同一面镜子照过两轮：挖矿放大需求信号，退潮时又把它收回。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
  }

  window.Charts[KEY] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    function draw() { render(body, normalize(getRaw())); }
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
