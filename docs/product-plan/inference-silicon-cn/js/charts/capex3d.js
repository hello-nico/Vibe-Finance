/* capex3d.js —— §8 · 窗口六 · 2023–2026 · 当前周期
 * Top-4 云厂（Alphabet / Amazon / Microsoft / Meta）capex × OCF 双柱比率图。
 * 四家公司 × 六期间（'23 / '24 / '25 / TTM / '26E / '27E*），每组两根柱：
 *   实心蓝 #2251ff = capex；描边空心 = 经营现金流 OCF；每对柱上方打印 capex ÷ OCF 比率。
 *   '26E 斜纹填充（指引中点）；'27E* 虚线描边（示意 +10%，非指引）；比率 > 1 红色 = 超现金流。
 * 事实纪律：CY2025 Top-4 合计 ≈ US$412.9B（K5）；2026E 分项合计 ≈ US$710B，
 *   落在指引区间 695–725 内（K5）；缺数据标「未披露」，不插值。
 * 注册：window.Charts['capex3d']
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var KEY = 'capex3d';
  var BODY_H = 520;
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

  var SRC = '公司披露 — 10-K/10-Q 现金流量表（四家，日历年口径，MSFT 经日历年化）；2025 为编制估计（K5）；2026E 为公司指引（2026-04-29/30 Q1 财报）；2027E 券商测算（K30）';

  /* 与 js/data.js CHART_DATA.capex3d 同 schema 的兜底数据 */
  var DEFAULT = {
    unit: 'US$B',
    periods: ["'23", "'24", "'25", 'TTM', "'26E", "'27E*"],
    companies: [
      { name: 'Alphabet', caliber: '日历年口径',
        capex: [32.3, 52.5, 103.0, 144.0, 185.0, 148.0],
        ocf:   [101.7, 125.2, 145.0, 155.0, 165.0, 132.0] },
      { name: 'Amazon', caliber: '日历年口径',
        capex: [52.7, 83.0, 125.0, 162.0, 200.0, 160.0],
        ocf:   [84.9, 115.9, 132.0, 141.0, 150.0, 120.0] },
      { name: 'Microsoft', caliber: '日历年化口径（CY2026 ≈$190B 为公司明确口径）',
        capex: [41.2, 75.8, 115.0, 152.0, 190.0, 152.0],
        ocf:   [87.6, 118.5, 136.0, 148.0, 160.0, 128.0] },
      { name: 'Meta', caliber: '日历年口径',
        capex: [28.1, 39.2, 69.9, 102.0, 135.0, 108.0],
        ocf:   [71.1, 91.3, 100.0, 106.0, 112.0, 89.6] }
    ],
    refPath: {
      label: '对照路径（参考口径）',
      vals: [0.38, 0.47, 0.57, 0.40, 0.43, 0.62, 0.63],
      note: '原版设计给定的参考比率口径；公司归属与绝对值未披露，仅作轨迹形状参考，不进入 Top-4 合计'
    },
    total2025: 412.9,
    band2026: { lo: 695, hi: 725, sum: 710.0 },
    ratioMid2027MSFT: 1.19,
    source: SRC
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
  /* 估算文本宽度（mono：CJK ≈ size，latin ≈ size×0.56） */
  function estW(s, size) {
    var w = 0;
    for (var i = 0; i < s.length; i++) w += (s.charCodeAt(i) > 0x2e7f ? size : size * 0.56);
    return w;
  }

  function periodTitle(i) {
    return ["'23（2023）", "'24（2024）", "'25（2025）", 'TTM（滚动十二个月）',
      "'26E（指引中点）", "'27E*（示意 +10%，非指引）"][i];
  }

  function ratioInterp(r) {
    if (r > 1) return '比率超过 1：capex 超出经营现金流，缺口需由发债、租赁或表外工具补足——超现金流警示。';
    if (r >= 0.9) return '比率逼近 1：capex 几乎吃满经营现金流，自由现金流空间所剩无几。';
    if (r >= 0.5) return '比率处于本轮周期的高位区间：扩张仍在现金流覆盖之内，但余量持续收窄。';
    return '扩张仍在经营现金流覆盖之内，是本轮周期早期（或现金流充沛期）的典型位置。';
  }

  function pairDrill(data, comp, i) {
    var v1 = comp.capex[i], v2 = comp.ocf[i];
    if (v1 == null || v2 == null) {
      return { title: comp.name + ' · ' + periodTitle(i),
        body: comp.name + ' ' + periodTitle(i) + '：该单元格数据未披露（不做插值填充）。口径：' + comp.caliber + '。',
        source: data.source, date: '2026-07' };
    }
    var r = v1 / v2, rr = r.toFixed(2);
    var body = comp.name + ' ' + periodTitle(i) + '：capex ≈ US$' + v1.toFixed(1) + 'B，经营现金流（OCF）≈ US$' +
      v2.toFixed(1) + 'B，capex ÷ OCF = ' + rr + '。' + ratioInterp(r);
    if (i === 2) body += ' Top-4 CY2025 合计 ≈ US$' + data.total2025 + 'B（K5）。';
    if (i === 3) body += ' TTM = 滚动十二个月，口径随各公司财季对齐。';
    if (i === 4) body += ' 本柱为指引中点（斜纹），是承诺区间的中值而非事实；Top-4 2026E 指引区间 ' +
      data.band2026.lo + '–' + data.band2026.hi + ' US$B（K5）。';
    if (i === 5) {
      body += ' 本柱为示意 +10%（虚线描边），非公司指引；2027 年一致预期未披露（K30）。';
      if (comp.name === 'Microsoft') body += ' OCF 延续增长的中路径下比率约 ' +
        Number(data.ratioMid2027MSFT).toFixed(2) + '（>1，红色，超现金流）。';
    }
    body += ' 口径：' + comp.caliber + '。';
    return { title: comp.name + ' · ' + periodTitle(i), body: body, source: data.source, date: '2026-07' };
  }

  function pairTip(data, comp, i, inkMd, neg) {
    var v1 = comp.capex[i], v2 = comp.ocf[i];
    if (v1 == null || v2 == null) {
      return '<b>' + comp.name + ' · ' + periodTitle(i) + '</b><br><span style="color:' + inkMd + '">该单元格未披露</span>';
    }
    var r = v1 / v2, rr = r.toFixed(2);
    var s = '<b>' + comp.name + ' · ' + periodTitle(i) + '</b><br>' +
      'capex ≈ US$<b>' + v1.toFixed(1) + 'B</b> · OCF ≈ US$<b>' + v2.toFixed(1) + 'B</b><br>' +
      '比率 <b>' + rr + '</b> = capex ÷ OCF' +
      (r > 1 ? ' <span style="color:' + neg + '">超现金流</span>' : '');
    if (comp.name === 'Microsoft' && i === 5) s += '<br><span style="color:' + neg + '">中路径 ' + Number(data.ratioMid2027MSFT).toFixed(2) + '（超现金流）</span>';
    s += '<br><span style="color:' + inkMd + '">' + comp.caliber + ' · 点击查看底层数据</span>';
    return s;
  }

  /* 柱样式：period i <=3 实体；i==4 斜纹（指引中点）；i==5 虚线描边（示意） */
  function barAttrs(i, isCapex, blue, inkMd) {
    if (i <= 3) {
      return isCapex ? { fill: blue, stroke: 'none' }
                     : { fill: '#ffffff', stroke: inkMd, 'stroke-width': 1.2 };
    }
    if (i === 4) {
      return isCapex ? { fill: 'url(#cx3-hatch-b)', stroke: blue, 'stroke-width': 1 }
                     : { fill: 'url(#cx3-hatch-g)', stroke: inkMd, 'stroke-width': 1.2 };
    }
    return isCapex ? { fill: blue, 'fill-opacity': 0.07, stroke: blue, 'stroke-width': 1.2, 'stroke-dasharray': '4,3' }
                   : { fill: '#ffffff', stroke: inkMd, 'stroke-width': 1.2, 'stroke-dasharray': '4,3' };
  }

  function render(body, data) {
    body.innerHTML = '';
    var W = Math.max(340, body.clientWidth || 720);
    var compact = W < 600;

    var ink = C('--ink'), inkMd = C('--ink-md'), inkLo = C('--ink-lo');
    var line = C('--line'), lineLo = C('--line-lo');
    var blue = C('--blue'), blueLo = C('--blue-lo'), neg = C('--neg'), copper = C('--copper');

    /* ---- 量程 ---- */
    var maxV = 1;
    data.companies.forEach(function (c) {
      c.capex.concat(c.ocf).forEach(function (v) { if (v != null && v > maxV) maxV = v; });
    });
    var yMax = Math.max(50, Math.ceil((maxV * 1.04) / 50) * 50);

    /* ---- 布局参数 ---- */
    var ml, mr, mt, mb, H;
    var notes = [];
    if (!compact) {
      ml = 46; mr = 10; mt = 58; mb = 96; H = BODY_H;
      notes = [
        { t: 'CY2025 Top-4 合计 ≈ US$' + data.total2025 + 'B（K5）· 2026E 分项合计 ≈ US$' + Math.round(data.band2026.sum) +
             'B，落在指引区间 ' + data.band2026.lo + '–' + data.band2026.hi + ' 内（K5）', cls: 'n' },
        { t: 'Microsoft 经日历年化（CY2026 ≈$190B 为公司明确口径），其余为日历年；斜纹 = 指引中点 · 虚线 = 示意 +10%（非指引）', cls: 'n' },
        { t: 'ref', cls: 'ref' }
      ];
    } else {
      ml = 12; mr = 12; mt = 56; H = 0; /* 稍后计算 */
      notes = [
        { t: 'CY2025 Top-4 合计 ≈ US$' + data.total2025 + 'B（K5）', cls: 'n' },
        { t: '2026E 分项合计 ≈ US$' + Math.round(data.band2026.sum) + 'B · 指引区间 ' + data.band2026.lo + '–' + data.band2026.hi + ' 内', cls: 'n' },
        { t: 'Microsoft 经日历年化口径（CY2026 ≈$190B 为公司明确口径）', cls: 'n' },
        { t: 'ref', cls: 'ref' }
      ];
    }

    var svg = el('svg', { width: W, height: 10, viewBox: '0 0 ' + W + ' 10', role: 'img',
      'aria-label': 'Top-4 云厂（Alphabet、Amazon、Microsoft、Meta）资本开支与经营现金流对照图：' +
        '六期间（2023、2024、2025、TTM、2026E 指引中点、2027E 示意），每对柱上方打印 capex ÷ OCF 比率；' +
        'Microsoft 路径 0.47 → 0.64 → 0.85 → 1.03 → 1.19，2027E 约 1.19，以红色作超现金流警示；' +
        '斜纹柱为指引中点，虚线柱为示意加一成、非公司指引。' }, body);

    /* ---- 斜纹 pattern ---- */
    var defs = el('defs', {}, svg);
    var pb = el('pattern', { id: 'cx3-hatch-b', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 6, height: 6, fill: blue, 'fill-opacity': 0.26 }, pb);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: blue, 'stroke-width': 1.6 }, pb);
    var pg = el('pattern', { id: 'cx3-hatch-g', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('rect', { width: 6, height: 6, fill: '#ffffff' }, pg);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: inkLo, 'stroke-width': 1 }, pg);

    /* ---- 顶部：提示行 + 图例行 ---- */
    txt(svg, ml, 15, '点击任意柱查看底层数据', { 'font-family': MONO, 'font-size': 9.5, fill: inkLo });
    var legY = compact ? 30 : 33;
    var lx = ml;
    function legendSwatch(kind, label) {
      var sy = legY - 8;
      if (kind === 'solid') el('rect', { x: lx, y: sy, width: 11, height: 9, fill: blue }, svg);
      else if (kind === 'hollow') el('rect', { x: lx, y: sy, width: 11, height: 9, fill: '#fff', stroke: inkMd, 'stroke-width': 1.1 }, svg);
      else if (kind === 'hatch') el('rect', { x: lx, y: sy, width: 11, height: 9, fill: 'url(#cx3-hatch-b)', stroke: blue, 'stroke-width': 0.8 }, svg);
      else el('rect', { x: lx, y: sy, width: 11, height: 9, fill: '#fff', stroke: blue, 'stroke-width': 1.1, 'stroke-dasharray': '3,2' }, svg);
      txt(svg, lx + 14, legY, label, { 'font-family': MONO, 'font-size': compact ? 7.5 : 8.5, fill: inkMd });
      lx += 14 + estW(label, compact ? 7.5 : 8.5) + (compact ? 10 : 16);
    }
    legendSwatch('solid', 'capex 资本开支');
    legendSwatch('hollow', '经营现金流 OCF');
    legendSwatch('hatch', "'26E 指引中点");
    legendSwatch('dash', "'27E* 示意 +10%（非指引）");
    var formula = '比率 = capex ÷ OCF（>1 红 = 超现金流）';
    if (!compact) {
      txt(svg, W - mr, legY, formula, { 'font-family': MONO, 'font-size': 8.5, fill: inkLo, 'text-anchor': 'end' });
    } else {
      txt(svg, ml, 43, formula, { 'font-family': MONO, 'font-size': 7.5, fill: inkLo });
    }

    /* ---- 一对柱（capex + OCF）+ 比率标签 + 热区 ---- */
    function drawPair(comp, i, slotX, slotW, Y, y0) {
      var v1 = comp.capex[i], v2 = comp.ocf[i];
      var bw = Math.min(12, slotW * 0.36);
      var gapB = slotW * 0.12;
      var pairW = 2 * bw + gapB;
      var x1 = slotX + (slotW - pairW) / 2;
      var x2 = x1 + bw + gapB;
      if (v1 == null || v2 == null) {
        txt(svg, slotX + slotW / 2, y0 - 6, '未披露', { 'font-family': MONO, 'font-size': 6.5, fill: inkLo, 'text-anchor': 'middle' });
      } else {
        var a1 = barAttrs(i, true, blue, inkMd);
        a1.x = x1; a1.y = Y(v1); a1.width = bw; a1.height = y0 - Y(v1);
        el('rect', a1, svg);
        var a2 = barAttrs(i, false, blue, inkMd);
        a2.x = x2; a2.y = Y(v2); a2.width = bw; a2.height = y0 - Y(v2);
        el('rect', a2, svg);
        var r = v1 / v2;
        txt(svg, slotX + slotW / 2, Math.min(Y(v1), Y(v2)) - 5, r.toFixed(2), {
          'font-family': MONO, 'font-size': compact ? 6 : 7.5,
          'font-weight': r > 1 ? 700 : 400, fill: r > 1 ? neg : inkMd, 'text-anchor': 'middle' });
      }
      var hit = el('rect', { x: slotX + 0.5, y: Y(yMax) - 4, width: slotW - 1, height: y0 - Y(yMax) + 4, fill: 'transparent' }, svg);
      bindHot(hit, pairTip(data, comp, i, inkMd, neg), pairDrill(data, comp, i));
    }

    function yTicks(Y, x0, x1, withLabel) {
      for (var g = 0; g <= yMax; g += 50) {
        el('line', { x1: x0, x2: x1, y1: Y(g), y2: Y(g), stroke: g === 0 ? line : lineLo, 'stroke-width': g === 0 ? 1.2 : 1 }, svg);
        if (withLabel) txt(svg, x0 - 6, Y(g) + 3, String(g), { 'font-family': MONO, 'font-size': compact ? 6 : 8.5, fill: inkLo, 'text-anchor': 'end' });
      }
    }

    if (!compact) {
      /* ================= 桌面：4 公司 × 6 期间 ================= */
      var plotW = W - ml - mr, plotH = H - mt - mb;
      var y0 = mt + plotH;
      function Y(v) { return y0 - (v / yMax) * plotH; }
      yTicks(Y, ml, ml + plotW, true);
      txt(svg, ml, mt - 8, data.unit, { 'font-family': MONO, 'font-size': 8.5, fill: inkLo, 'text-anchor': 'start' });

      var groupW = plotW / data.companies.length;
      data.companies.forEach(function (comp, c) {
        var gx = ml + c * groupW;
        if (c > 0) el('line', { x1: gx, y1: mt + 4, x2: gx, y2: y0, stroke: lineLo, 'stroke-width': 1 }, svg);
        var pad = groupW * 0.05;
        var slot = (groupW - 2 * pad) / 6;
        for (var i = 0; i < 6; i++) {
          var sx = gx + pad + i * slot;
          drawPair(comp, i, sx, slot, Y, y0);
          txt(svg, sx + slot / 2, y0 + 14, data.periods[i], {
            'font-family': MONO, 'font-size': 7.5, fill: i >= 4 ? blue : inkMd, 'text-anchor': 'middle' });
        }
        txt(svg, gx + groupW / 2, y0 + 33, comp.name, {
          'font-family': SERIF, 'font-size': 12.5, 'font-weight': 700, fill: ink, 'text-anchor': 'middle' });
      });
    } else {
      /* ================= 窄屏：2×2 面板 ================= */
      var panelGap = 10;
      var pw = (W - ml - mr - panelGap) / 2;
      var pml = 24, pmr = 4, pmt = 16, pmb = 14;
      var pPlotH = 132;
      var panelH = pmt + pPlotH + pmb;
      var top = 52;
      data.companies.forEach(function (comp, c) {
        var col = c % 2, row = Math.floor(c / 2);
        var px = ml + col * (pw + panelGap);
        var py = top + row * (panelH + panelGap);
        txt(svg, px, py + 9, comp.name, { 'font-family': SERIF, 'font-size': 10.5, 'font-weight': 700, fill: ink });
        txt(svg, px + pw, py + 9, comp.caliber.split('，')[0], { 'font-family': MONO, 'font-size': 6.5, fill: inkLo, 'text-anchor': 'end' });
        var plotY0 = py + pmt;
        var y0p = plotY0 + pPlotH;
        function Yp(v) { return y0p - (v / yMax) * pPlotH; }
        for (var g = 0; g <= yMax; g += 100) {
          el('line', { x1: px + (col === 0 ? pml : pmr), x2: px + pw, y1: Yp(g), y2: Yp(g), stroke: g === 0 ? line : lineLo, 'stroke-width': g === 0 ? 1.2 : 1 }, svg);
          if (col === 0) txt(svg, px + pml - 4, Yp(g) + 2.5, String(g), { 'font-family': MONO, 'font-size': 6, fill: inkLo, 'text-anchor': 'end' });
        }
        var innerX = px + (col === 0 ? pml : pmr);
        var slot = (pw - (col === 0 ? pml : pmr)) / 6;
        for (var i = 0; i < 6; i++) {
          var sx = innerX + i * slot;
          drawPair(comp, i, sx, slot, Yp, y0p);
          txt(svg, sx + slot / 2, y0p + 10, data.periods[i], {
            'font-family': MONO, 'font-size': 6, fill: i >= 4 ? blue : inkMd, 'text-anchor': 'middle' });
        }
      });
      H = top + 2 * panelH + panelGap + 8 + notes.length * 14 + 6;
    }

    /* ---- 底部注记 + 对照路径 ---- */
    var ny = compact ? (H - notes.length * 14 - 2) : (mt + (H - mt - mb)) + 58;
    notes.forEach(function (n) {
      if (n.cls === 'ref') {
        var rp = data.refPath;
        var label = rp.label + '：' + rp.vals.join(' → ') + ' · 主体未披露，仅作轨迹参考';
        var t = txt(svg, compact ? ml : ml, ny, label, { 'font-family': MONO, 'font-size': compact ? 7 : 8.5, fill: copper });
        bindHot(t,
          '<b>' + rp.label + '</b><br>' + rp.vals.join(' → ') + '<br><span style="color:' + inkMd + '">' + rp.note + '</span>',
          { title: '对照路径（参考比率口径）',
            body: rp.vals.join(' → ') + '。' + rp.note + '。本站仅按给定值呈现轨迹形状，不作公司归属断言，不进入 Top-4 合计与情景计算。',
            source: '原版设计参考口径（数据纪律：未披露不插值）', date: '2026-07' });
      } else {
        txt(svg, ml, ny, n.t, { 'font-family': MONO, 'font-size': compact ? 7 : 8.5, fill: inkLo });
      }
      ny += 14;
    });
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
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
