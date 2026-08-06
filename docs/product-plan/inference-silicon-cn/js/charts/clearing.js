/* js/charts/clearing.js — 生存者泳道图（Agent F）
 * 注册：window.Charts['clearing']
 * SVG 816px：14 家样本企业生存泳道（成立 → 结局），结局标记：并购（蓝点+收购方名）、
 * 资产出售（空心点）、许可（虚线空心点）、IPO（圆点）、仍独立（泳道延伸到 2026 箭头）。
 * 突出「0 家龙头破产」注解 —— 出清以并购与出售完成（途中一例 Chapter 11）。
 * 数据：window.CHART_DATA['clearing'].rows / window.COHORT（缺失时内嵌兜底，与 data.js 口径一致）。
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

/* ---------------- 兜底数据（与 data.js window.COHORT 口径一致） ---------------- */
var FB_ROWS = [
  { name: 'Xilinx',         status: 'acquired',    founded: 1984, exitYear: 2022, note: 'FPGA 发明者；AMD 收购：2020-10 报价 $35B，2022-02 交割 ≈$49B' },
  { name: 'Altera',         status: 'acquired',    founded: 1983, exitYear: 2015, note: 'FPGA 双寡头之一；Intel $16.7B 收购（2015）；2025-09-16 Intel 将 51% 售予 Silver Lake' },
  { name: 'Achronix',       status: 'independent', founded: 2004, exitYear: null, note: 'FPGA 创业公司；2021 SPAC 合并取消，保持私有独立' },
  { name: 'Wave Computing', status: 'acquired',    founded: 2008, exitYear: 2025, note: 'Chapter 11（2020）→ 2021 以 MIPS 复出 → 2025-08 被 GlobalFoundries 收购' },
  { name: 'Mythic',         status: 'independent', founded: 2012, exitYear: null, note: '模拟存内计算；2025-12 以 $125M 融资重启' },
  { name: 'Nervana',        status: 'acquired',    founded: 2014, exitYear: 2016, note: 'Intel ≈$350M 收购（2016）；产品线 2020 年在 Intel 内终止' },
  { name: 'Flex Logix',     status: 'asset-sale',  founded: 2014, exitYear: 2024, note: 'eFPGA/AI 技术资产与团队 2024-11 转让 Analog Devices；条款未披露' },
  { name: 'SiFive',         status: 'independent', founded: 2015, exitYear: null, note: 'RISC-V；仍独立（pre-IPO）' },
  { name: 'Cerebras',       status: 'ipo',         founded: 2015, exitYear: null, note: '晶圆级芯片；2026-05 完成 IPO（Nasdaq: CBRS，定价 $185，募资 ≈$5.5B）' },
  { name: 'Groq',           status: 'license',     founded: 2016, exitYear: null, note: 'LPU；2025-12-24 与 NVIDIA 达成非独占许可（≈$20B，CNBC 报道未获确认）；余部独立' },
  { name: 'Graphcore',      status: 'acquired',    founded: 2016, exitYear: 2024, note: 'IPU（Bristol）；2024-07 被 SoftBank 收购（据报道 ≈$500–600M，未获确认）' },
  { name: 'Habana',         status: 'acquired',    founded: 2016, exitYear: 2019, note: 'AI 加速器（Tel Aviv）；Intel ≈$2B 收购（2019-12）' },
  { name: 'Tenstorrent',    status: 'independent', founded: 2016, exitYear: null, note: 'RISC-V + AI（Toronto）；2026-06 公开否认 Qualcomm 收购传闻' },
  { name: 'SambaNova',      status: 'independent', founded: 2017, exitYear: null, note: '数据流架构；2026-07 完成 $1B Series F（估值 $11B）' }
];
/* 结局短标签（泳道末端标注），键为公司名 */
var END_LABEL = {
  'Xilinx': 'AMD 收购', 'Altera': 'Intel 收购', 'Nervana': 'Intel 收购',
  'Graphcore': 'SoftBank 收购', 'Habana': 'Intel 收购',
  'Wave Computing': 'GlobalFoundries 收购', 'Flex Logix': 'Analog Devices 资产',
  'Groq': '技术许可 · 媒体口径'
};
var STATUS_CN = { acquired: '并购', 'asset-sale': '资产出售', exited: '关停 / 出售', license: '许可', ipo: 'IPO', independent: '仍独立' };

function normRows() {
  var src = (window.CHART_DATA && window.CHART_DATA.clearing && Array.isArray(window.CHART_DATA.clearing.rows) && window.CHART_DATA.clearing.rows.length && window.CHART_DATA.clearing.rows) ||
            (Array.isArray(window.COHORT) && window.COHORT.length && window.COHORT) || null;
  if (!src) return FB_ROWS.slice();
  return src.map(function (c, i) {
    var fb = FB_ROWS[i] || {};
    var st = c.status || c.outcome || fb.status || 'independent';
    if (st === 'sold' || st === 'closed' || st === 'exit') st = 'exited';
    if (st === 'licensed') st = 'license';
    if (st === 'alive') st = 'independent';
    return {
      name: c.name || fb.name || '未命名',
      status: st,
      founded: +(c.founded != null ? c.founded : (c.from != null ? c.from : fb.founded)),
      exitYear: (c.exitYear != null ? c.exitYear : (c.to != null ? c.to : fb.exitYear)),
      note: c.note || (c.drill && c.drill.body) || fb.note || ''
    };
  }).filter(function (c) { return isFinite(c.founded); });
}

/* ---------------- 图表主体 ---------------- */
window.Charts['clearing'] = function (frame) {
  var body = frame.querySelector('.chart-body');
  if (!body) return;
  var lastW = 0;

  function render() {
    var W = body.clientWidth || 0;
    if (W < 300) W = 300;
    lastW = W;
    var H = 816;
    body.innerHTML = '';

    var INK = css('--ink', '#051c2c'), INKMD = css('--ink-md', '#42566a'),
        INKLO = css('--ink-lo', '#8595a6'), LINE = css('--line', '#dbe2ea'),
        LINELO = css('--line-lo', '#eef1f6'), PAPERHI = css('--paper-hi', '#f7f9fc'),
        BLUE = css('--blue', '#2251ff'), BLUELO = css('--blue-lo', '#7d9bff');

    var rows = normRows().sort(function (a, b) {
      return a.founded - b.founded || (a.name < b.name ? -1 : 1);
    });

    /* 统计 */
    var cnt = { acquired: 0, 'asset-sale': 0, exited: 0, license: 0, ipo: 0, independent: 0 };
    rows.forEach(function (r) { if (cnt[r.status] != null) cnt[r.status]++; });
    /* 结局类别标签：优先 CHART_DATA.clearing.legend */
    var LG = (window.CHART_DATA && window.CHART_DATA.clearing && window.CHART_DATA.clearing.legend) || {};
    function stLabel(st) { return LG[st] || STATUS_CN[st] || st; }

    body.setAttribute('role', 'img');
    body.setAttribute('aria-label', '14 家样本企业生存泳道图：1983 至 2026 年，并购 ' + cnt.acquired + ' 家、资产出售 ' + cnt['asset-sale'] + ' 家、许可 ' + cnt.license + ' 家、IPO ' + cnt.ipo + ' 家、仍独立 ' + cnt.independent + ' 家，0 家解散（途中一例 Chapter 11）');

    var svg = S('svg', {
      viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H,
      style: 'display:block;font-family:var(--serif)', 'aria-hidden': 'true'
    }, body);

    var X0 = 1981, X1 = 2026.6, plotX0 = 148, plotX1 = W - 14;
    function x(yr) { return plotX0 + (yr - X0) / (X1 - X0) * (plotX1 - plotX0); }

    var axisY = 40, rowH = 42, firstY = 84;

    /* 年份网格 + 刻度 */
    for (var yr = 1985; yr <= 2020; yr += 5) {
      S('line', { x1: x(yr), y1: axisY + 6, x2: x(yr), y2: firstY + (rows.length - 1) * rowH + 14, stroke: LINELO, 'stroke-width': 1 }, svg);
      T(svg, x(yr), axisY, String(yr), { 'font-size': 9.5, fill: INKLO, 'text-anchor': 'middle', style: 'font-family:var(--mono)' });
    }
    S('line', { x1: x(2025), y1: axisY + 6, x2: x(2025), y2: firstY + (rows.length - 1) * rowH + 14, stroke: LINELO, 'stroke-width': 1 }, svg);
    T(svg, plotX1, axisY, '2026', { 'font-size': 9.5, fill: INKMD, 'text-anchor': 'end', 'font-weight': 700, style: 'font-family:var(--mono)' });

    /* 代际分组（按成立年） */
    var groups = [
      { test: function (f) { return f <= 1990; }, label: '第一代 · FPGA / ASIC 创立' },
      { test: function (f) { return f > 1990 && f <= 2014; }, label: '第二代 · 2000s 挑战者' },
      { test: function (f) { return f > 2014; }, label: '第三代 · 2016–17 AI 芯片创业' }
    ];
    var prevGroup = -1;

    rows.forEach(function (r, i) {
      var y = firstY + i * rowH;
      var gi = groups[0].test(r.founded) ? 0 : (groups[1].test(r.founded) ? 1 : 2);
      if (gi !== prevGroup) {
        if (prevGroup >= 0) {
          S('line', { x1: plotX0, y1: y - rowH / 2, x2: plotX1, y2: y - rowH / 2, stroke: LINELO, 'stroke-width': 1, 'stroke-dasharray': '3 4' }, svg);
        }
        T(svg, plotX0 + 2, y - rowH / 2 + 2, groups[gi].label, { 'font-size': 9, fill: BLUELO, style: 'font-family:var(--mono)' });
        prevGroup = gi;
      }

      /* 行底色（偶数行淡色） */
      if (i % 2 === 0) S('rect', { x: plotX0, y: y - rowH / 2 + 4, width: plotX1 - plotX0, height: rowH - 6, fill: PAPERHI, opacity: 0.45 }, svg);

      var end = r.exitYear != null ? +r.exitYear : (r.status === 'license' ? 2025.9 : 2026.35);
      var xs = x(Math.max(r.founded, X0)), xe = x(end);

      /* 公司名 + 成立年 */
      T(svg, plotX0 - 10, y + 1, r.name, { 'font-size': 12, fill: INK, 'text-anchor': 'end', 'font-weight': 600 });
      T(svg, plotX0 - 10, y + 14, String(r.founded), { 'font-size': 9, fill: INKLO, 'text-anchor': 'end', style: 'font-family:var(--mono)' });

      var g = S('g', {}, svg);
      /* 泳道 */
      var lane = S('line', { x1: xs, y1: y, x2: xe, y2: y, stroke: LINE, 'stroke-width': 2 }, g);
      /* 起点（成立） */
      S('circle', { cx: xs, cy: y, r: 2.6, fill: INKLO }, g);

      /* 结局标记（按 data.js COHORT status 分流） */
      var endLabel = END_LABEL[r.name] || stLabel(r.status) || '';
      if (r.exitYear != null || r.status === 'license' || r.status === 'ipo') endLabel += ' · ' + (r.exitYear != null ? r.exitYear : (r.status === 'ipo' ? '2026-05' : '2025'));
      if (r.status === 'acquired') {
        S('circle', { cx: xe, cy: y, r: 4.4, fill: BLUE, stroke: '#fff', 'stroke-width': 1.4 }, g);
      } else if (r.status === 'asset-sale' || r.status === 'exited') {
        S('circle', { cx: xe, cy: y, r: 4.2, fill: '#fff', stroke: INKMD, 'stroke-width': 1.6 }, g);
      } else if (r.status === 'license') {
        S('circle', { cx: xe, cy: y, r: 4.2, fill: '#fff', stroke: BLUE, 'stroke-width': 1.6, 'stroke-dasharray': '2.5 2' }, g);
      } else if (r.status === 'ipo') {
        S('circle', { cx: xe, cy: y, r: 4.4, fill: BLUELO, stroke: '#fff', 'stroke-width': 1.4 }, g);
      } else {
        /* 仍独立：泳道延伸到 2026 + 箭头 */
        S('line', { x1: xe - 0.5, y1: y, x2: xe, y2: y, stroke: LINE, 'stroke-width': 2 }, g);
        S('path', { d: 'M ' + xe + ' ' + y + ' l -7 -3.6 l 0 7.2 Z', fill: BLUELO }, g);
        if (!endLabel) endLabel = '仍独立';
      }

      /* 结局文字（右侧空间不足时放左侧） */
      var labelRight = xe < plotX1 - 168;
      T(g, labelRight ? xe + 9 : xe - 9, y + 3.5, endLabel, {
        'font-size': 10.5, fill: INKMD, 'text-anchor': labelRight ? 'start' : 'end'
      });

      /* hover 高亮 + 交互 */
      var hit = S('rect', { x: plotX0, y: y - rowH / 2 + 3, width: plotX1 - plotX0, height: rowH - 4, fill: 'transparent' }, g);
      g.addEventListener('mouseenter', function () { lane.setAttribute('stroke', BLUE); });
      g.addEventListener('mouseleave', function () { lane.setAttribute('stroke', LINE); });
      var years = r.founded + ' → ' + (r.exitYear != null ? r.exitYear : '至今');
      var html = '<div style="font-weight:700">' + r.name + ' · ' + years + '</div>' +
                 '<div style="max-width:270px">' + (r.note || stLabel(r.status)) + '</div>' +
                 '<div style="opacity:.65;font-size:10px;margin-top:4px">结局：' + stLabel(r.status) + ' · 点击查看详情</div>';
      bind(hit, html, {
        title: r.name + '（' + years + '）',
        body: (r.note ? r.note + '<br><br>' : '') + '结局类别：' + stLabel(r.status) + '。三代样本的共同语法：行业出清以并购与出售完成，而非破产。',
        source: '公司披露 / 研究综合',
        date: r.exitYear != null ? String(r.exitYear) : '2026-07'
      });
    });

    /* ---- 「0 家龙头破产」注解 ---- */
    var anY = firstY + rows.length * rowH + 34;
    S('line', { x1: plotX0, y1: anY - 26, x2: plotX1, y2: anY - 26, stroke: LINELO, 'stroke-width': 1 }, svg);
    T(svg, plotX0 + 4, anY + 14, '0', { 'font-size': 44, fill: BLUE, 'font-weight': 700 });
    T(svg, plotX0 + 52, anY + 2, '家龙头企业破产', { 'font-size': 15, fill: INK, 'font-weight': 700 });
    T(svg, plotX0 + 52, anY + 22, '三代样本、两轮出清：退出语法始终是并购与出售，而非破产。决定生存的是软件工具链与生态。',
      { 'font-size': 11.5, fill: INKMD });
    T(svg, plotX0 + 4, anY + 48,
      '14 家样本 —— 并购 ' + cnt.acquired + ' · 资产出售 ' + cnt['asset-sale'] + ' · 许可 ' + cnt.license + ' · IPO ' + cnt.ipo + ' · 仍独立 ' + cnt.independent + ' · 解散 ' + cnt.exited + '（途中一例 Chapter 11）',
      { 'font-size': 11, fill: INKMD });

    /* ---- 图例 ---- */
    var ly = H - 16, lx = plotX0 + 4;
    S('circle', { cx: lx + 4, cy: ly - 3, r: 4.2, fill: BLUE }, svg);
    T(svg, lx + 13, ly, '并购', { 'font-size': 10, fill: INKMD });
    S('circle', { cx: lx + 56, cy: ly - 3, r: 4, fill: '#fff', stroke: INKMD, 'stroke-width': 1.5 }, svg);
    T(svg, lx + 65, ly, '资产出售', { 'font-size': 10, fill: INKMD });
    S('circle', { cx: lx + 124, cy: ly - 3, r: 4, fill: '#fff', stroke: BLUE, 'stroke-width': 1.5, 'stroke-dasharray': '2.5 2' }, svg);
    T(svg, lx + 133, ly, '许可', { 'font-size': 10, fill: INKMD });
    S('circle', { cx: lx + 172, cy: ly - 3, r: 4.2, fill: BLUELO }, svg);
    T(svg, lx + 181, ly, 'IPO', { 'font-size': 10, fill: INKMD });
    S('path', { d: 'M ' + (lx + 222) + ' ' + (ly - 3) + ' l -7 -3.4 l 0 6.8 Z', fill: BLUELO }, svg);
    T(svg, lx + 230, ly, '仍独立', { 'font-size': 10, fill: INKMD });
    T(svg, plotX1, ly, '单位：家 · 结局截至 2026-07', { 'font-size': 9.5, fill: INKLO, 'text-anchor': 'end', style: 'font-family:var(--mono)' });
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
