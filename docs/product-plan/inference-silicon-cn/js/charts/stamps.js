/* stamps.js —— 9a · 当前窗口（第二轮自研芯片浪潮，以及测量纪律）
 * 玩家图鉴：12 枚「邮戳」式规格卡（Ironwood / TPU v8 / Trainium 3 / Trainium 2 ·
 * Project Rainier / Inferentia 2 / Maia 200 / MTIA v3 / Broadcom 定制 XPU /
 * Marvell 定制 / Alchip·GUC 设计服务 / OpenAI × Broadcom / Anthropic × Google TPU）。
 * 细线边框 + 打孔边效果 + mono 小字（厂商 / 年份 / 定位 / 关键事实 / 来源日期）；
 * 缺数据一律「未披露」，不做推测填充。
 * 注册：window.Charts['stamps']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'stamps';
  var CARD_H = 184;
  var GAP = 14;
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

  /* 兜底（正常由 js/data.js CHART_DATA.stamps 提供 12 枚） */
  var DEFAULT = {
    cards: [
      { name: 'Ironwood（TPU v7）', vendor: 'Google', year: '2025', face: 'v7', gen: 'TPU v7',
        role: '推理专用旗舰',
        specs: [{ label: '算力', value: '42.5 EFLOPS FP8 / pod' }, { label: '规模', value: '9,216 颗 / pod' }, { label: '存储', value: '192GB HBM3E / 颗' }],
        asOf: '2025-04', source: '公司披露（Google）', note: '首款为推理时代设计的 TPU',
        drill: { title: 'Google TPU v7「Ironwood」（2025）', body: '2025 年 4 月发布的第七代 TPU，定位推理优先：单 Pod 9,216 颗芯片、42.5 EFLOPS（FP8）、每颗 192GB HBM3E。', source: '公司披露（Google）', date: '2025-04' } },
      { name: 'Trainium 3', vendor: 'AWS', year: '2025→26', face: 'T3', gen: 'Trn3',
        role: '训练 + 推理通用',
        specs: [{ label: '制程', value: '3nm' }, { label: '算力', value: '较上代 ≈2.4×（公司口径）' }, { label: '出货', value: '未披露' }],
        asOf: '2025-12', source: '公司披露（AWS re:Invent）', note: '首款 3nm 自研 AI 芯片',
        drill: { title: 'AWS Trainium 3（2025→26）', body: 'AWS 第三代自研 AI 芯片，3nm 制程，公司口径算力较上代 ≈2.4×；出货规模未披露。', source: '公司披露（AWS re:Invent）', date: '2025-12' } },
      { name: 'Maia 200', vendor: 'Microsoft', year: '2025-11', face: 'M2', gen: 'Maia 2',
        role: '内部负载 · 推理优先',
        specs: [{ label: '算力', value: '未披露' }, { label: '负载', value: 'Copilot / OpenAI 工作负载' }, { label: '部署', value: '未披露' }],
        asOf: '2025-11', source: '公司披露（Microsoft）· 据报道', note: '继 Maia 100 之后的第二代',
        drill: { title: 'Microsoft Maia 200（2025-11）', body: '继 Maia 100 之后的第二代自研芯片，面向内部推理负载；参数披露有限，不做精确规格断言。', source: '公司披露（Microsoft）· 据报道', date: '2025-11' } },
      { name: 'MTIA v3', vendor: 'Meta', year: '2026', face: 'M3', gen: 'MTIA 3',
        role: '排序 / 推荐推理',
        specs: [{ label: '算力', value: '未披露' }, { label: '场景', value: '排序与推荐模型' }, { label: '部署', value: '未披露' }],
        asOf: '2026-07', source: '公司披露 / 研究综合（据报道）', note: '窄而稳的算子集合，内部闭环',
        drill: { title: 'Meta MTIA v3（2026）', body: 'Meta 自研推理芯片第三代，聚焦排序与推荐推理；详细规格以公司披露为准（据报道）。', source: '公司披露 / 研究综合（据报道）', date: '2026-07' } }
    ]
  };

  function getData() {
    var d = (window.CHART_DATA && window.CHART_DATA[KEY]) || null;
    if (!d || !d.cards || !d.cards.length) return DEFAULT;
    return d;
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

  /* 打孔边：沿矩形四周绘制圆孔 */
  function perforation(g, x, y, w, h, r, gap, fill) {
    var i;
    for (i = x + gap / 2; i < x + w; i += gap) {
      el('circle', { cx: i, cy: y, r: r, fill: fill }, g);
      el('circle', { cx: i, cy: y + h, r: r, fill: fill }, g);
    }
    for (i = y + gap / 2; i < y + h; i += gap) {
      el('circle', { cx: x, cy: i, r: r, fill: fill }, g);
      el('circle', { cx: x + w, cy: i, r: r, fill: fill }, g);
    }
  }

  function render(body, data) {
    body.innerHTML = '';
    var W = Math.max(340, body.clientWidth || 720);
    var cards = data.cards;
    var compact = W < 560;
    var cols = compact ? 1 : 2;
    var rows = Math.ceil(cards.length / cols);
    var x0 = 12, y0 = 40;
    var cw = (W - 2 * x0 - (cols - 1) * GAP) / cols;
    var FOOT = 46;
    var H = y0 + rows * CARD_H + (rows - 1) * GAP + FOOT;

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo');

    var svg = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': '第二轮自研芯片浪潮玩家图鉴：' + cards.length + ' 枚邮戳卡——' +
        cards.map(function (s) { return s.name; }).join('、') + '；缺数据一律标未披露。' }, body);

    txt(svg, x0, 20, '第二轮自研芯片浪潮 · 玩家图鉴（' + cards.length + ' 枚邮戳 · 厂商 / 年份 / 定位 / 来源）', {
      'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink });

    cards.forEach(function (s, i) {
      var col = i % cols, row = Math.floor(i / cols);
      var x = x0 + col * (cw + GAP);
      var y = y0 + row * (CARD_H + GAP);
      var g = el('g', {}, svg);

      /* 票面（白）+ 打孔边 + 内框细线 */
      el('rect', { x: x, y: y, width: cw, height: CARD_H, fill: '#fff', stroke: 'none' }, g);
      perforation(g, x + 2, y + 2, cw - 4, CARD_H - 4, 1.6, 9, line);
      el('rect', { x: x + 10, y: y + 10, width: cw - 20, height: CARD_H - 20, fill: 'none', stroke: line, 'stroke-width': 1 }, g);

      /* 面值（右上角大字 mono） */
      txt(g, x + cw - 20, y + 35, s.face, { 'font-family': MONO, 'font-size': 18, 'font-weight': 700, fill: blue, 'text-anchor': 'end' });
      txt(g, x + cw - 20, y + 48, s.gen, { 'font-family': MONO, 'font-size': 8, fill: inkLo, 'text-anchor': 'end' });

      /* 芯片轮廓小图（左侧） */
      var cx = x + 24, cy = y + 20;
      el('rect', { x: cx, y: cy, width: 30, height: 22, fill: 'none', stroke: blueLo, 'stroke-width': 1.2 }, g);
      var p;
      for (p = 0; p < 4; p++) {
        el('line', { x1: cx + 4 + p * 7, y1: cy - 4, x2: cx + 4 + p * 7, y2: cy, stroke: blueLo, 'stroke-width': 1 }, g);
        el('line', { x1: cx + 4 + p * 7, y1: cy + 22, x2: cx + 4 + p * 7, y2: cy + 26, stroke: blueLo, 'stroke-width': 1 }, g);
      }
      for (p = 0; p < 2; p++) {
        el('line', { x1: cx - 4, y1: cy + 5 + p * 9, x2: cx, y2: cy + 5 + p * 9, stroke: blueLo, 'stroke-width': 1 }, g);
        el('line', { x1: cx + 30, y1: cy + 5 + p * 9, x2: cx + 34, y2: cy + 5 + p * 9, stroke: blueLo, 'stroke-width': 1 }, g);
      }

      /* 名称与厂商 */
      txt(g, cx + 40, cy + 11, s.name, { 'font-family': SERIF, 'font-size': 15, 'font-weight': 700, fill: ink });
      txt(g, cx + 40, cy + 24, s.vendor + ' · ' + s.year, { 'font-family': MONO, 'font-size': 9, fill: inkMd });

      /* 定位与关键事实（mono 小字；未披露降色） */
      txt(g, x + 20, y + 72, '定位 · ' + s.role, { 'font-family': MONO, 'font-size': 9.5, fill: blue });
      s.specs.forEach(function (sp, j) {
        var missing = String(sp.value).indexOf('未披露') === 0;
        txt(g, x + 20, y + 92 + j * 14, sp.label + ' · ' + sp.value, {
          'font-family': MONO, 'font-size': 8.8, fill: missing ? inkLo : inkMd });
      });

      /* 来源与日期 */
      el('line', { x1: x + 20, y1: y + 132, x2: x + cw - 20, y2: y + 132, stroke: lineLo, 'stroke-width': 1 }, g);
      txt(g, x + 20, y + 145, '来源 · ' + s.source + ' · ' + s.asOf, { 'font-family': MONO, 'font-size': 7.8, fill: inkLo });
      txt(g, x + 20, y + 162, 'POSTAGE · INFERENCE SILICON · 2026', { 'font-family': MONO, 'font-size': 7.2, fill: inkLo, 'letter-spacing': 1.5 });

      bindHot(g, '<b>' + s.name + '</b>（' + s.vendor + ' · ' + s.year + '）<br>' +
        '<span style="color:' + inkMd + '">' + s.note + ' · ' + s.role + '</span><br>' +
        '<span style="color:' + inkLo + '">点击查看详情与来源</span>', s.drill);
    });

    /* ---- 底部注记 ---- */
    txt(svg, x0, H - 26, cards.length + ' 枚邮戳 = 自研 / 定制版图全景：云厂自研 × 定制设计 × 设计服务 × 外部大客户。', {
      'font-family': SERIF, 'font-size': 11, fill: inkMd });
    txt(svg, x0, H - 10, '缺数据一律「未披露」，不做推测填充；悬停查看字段，点击查看详情与来源。', {
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
