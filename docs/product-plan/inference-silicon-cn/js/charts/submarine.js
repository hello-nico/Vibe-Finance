/* js/charts/submarine.js — 「潜水艇」隐喻图（Agent F）
 * 注册：window.Charts['submarine']
 * SVG 420px：水面线 = 披露线。Microsoft Catapult 2012 年底部署 1,632 台 FPGA 服务器，
 * 在水下（未披露）运行，2014 年 ISCA 论文披露后浮出。横轴 2004–2014，标注 28nm 制程竞争。
 * 数据：window.CHART_DATA['submarine'] = {unit,events:[{year,label,depth,visible,note}],hidden,kpi,note}
 * （缺失时内嵌兜底；depth>0 = 水下/未披露）。hover tooltip，click drill。
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

/* ---------------- 兜底数据（SPEC §8：Catapult 2012 底部署 / 2014 披露，不是 2010） ---------------- */
var FB = {
  hidden: { from: 2012.96, to: 2014.45, label: '隐蔽期 ≈ 1.5 年' },
  kpi: { v: '1,632 台', l: 'FPGA 服务器 · 2012 年底部署 · 2014 年披露' },
  events: [
    { year: 2011, label: '28nm 制程竞争', depth: 0, visible: true,
      note: 'TSMC / 三星 / GlobalFoundries 的 28nm 量产竞赛：制程成为新约束，FPGA 双寡头借代工升级巩固工具链壁垒。',
      source: '行业与官方 · 研究综合', date: '2011' },
    { year: 2012.96, label: 'Catapult 部署 1,632 台 FPGA 服务器', depth: 0.25, visible: false,
      note: '2012 年底，Microsoft 在数据中心部署 1,632 台 FPGA 服务器（Catapult 项目），用于 Bing 搜索排序加速——全程未对外披露。',
      source: '公司披露（Microsoft Catapult，ISCA 2014 回溯）', date: '2014-06' },
    { year: 2013.5, label: '水下运行 · Bing 排序生产实测', depth: 1.6, visible: false,
      note: '部署后系统在 Bing 生产环境持续运行：排序吞吐显著提升。外界对此一无所知——披露线之下，定制计算已经点火。',
      source: '公司披露（ISCA 2014）', date: '2014-06' },
    { year: 2014.45, label: 'ISCA 论文披露 · 浮出披露线', depth: 0, visible: true,
      note: '2014 年 6 月 ISCA 论文公开 Catapult 细节。当外界看到论文时，系统已在生产环境运行逾一年：先部署，后披露。',
      source: '公司披露（Microsoft Catapult，ISCA 2014）', date: '2014-06' }
  ]
};

/* ---------------- 图表主体 ---------------- */
window.Charts['submarine'] = function (frame) {
  var body = frame.querySelector('.chart-body');
  if (!body) return;
  body.setAttribute('role', 'img');
  body.setAttribute('aria-label', '潜水艇图：Microsoft Catapult 于 2012 年底部署 1,632 台 FPGA 服务器，在披露线以下隐蔽运行约一年半，2014 年 ISCA 论文披露后浮出；横轴 2004 至 2014 年，并标注 28nm 制程竞争');
  var lastW = 0;

  function render() {
    var W = body.clientWidth || 0;
    if (W < 300) W = 300;
    lastW = W;
    var H = 420;
    body.innerHTML = '';

    var INK = css('--ink', '#051c2c'), INKMD = css('--ink-md', '#42566a'),
        INKLO = css('--ink-lo', '#8595a6'), LINE = css('--line', '#dbe2ea'),
        LINELO = css('--line-lo', '#eef1f6'), PAPERHI = css('--paper-hi', '#f7f9fc'),
        BLUE = css('--blue', '#2251ff'), BLUELO = css('--blue-lo', '#7d9bff');

    var D = (window.CHART_DATA && window.CHART_DATA.submarine) || {};
    var useFB = !(Array.isArray(D.events) && D.events.length);
    var events = (useFB ? FB.events : D.events).map(function (e, i) {
      var fb = useFB ? (FB.events[i] || {}) : {}; /* 索引回退仅用于纯兜底模式 */

      return {
        year: +(e.year != null ? e.year : fb.year),
        label: e.label || fb.label || '',
        depth: +(e.depth != null ? e.depth : (fb.depth || 0)),
        visible: e.visible != null ? !!e.visible : !!fb.visible,
        note: e.note || fb.note || '',
        source: e.source || fb.source || '公司披露 / 研究综合',
        date: e.date || fb.date || '2014-06'
      };
    }).filter(function (e) { return isFinite(e.year); });
    var hidden = (D.hidden && isFinite(+D.hidden.from) && isFinite(+D.hidden.to)) ? D.hidden : FB.hidden;
    var kpi = (D.kpi && D.kpi.v) ? D.kpi : FB.kpi;
    var under = events.filter(function (e) { return e.depth > 0; }).sort(function (a, b) { return a.year - b.year; });
    var above = events.filter(function (e) { return e.depth <= 0; });

    /* 动态横轴：至少覆盖 2004–2014，事件超出时自动延展 */
    var maxY = 2014.8, minY = 2004;
    events.forEach(function (e) { if (e.year > maxY - 0.3) maxY = e.year + 0.6; if (e.year < minY) minY = Math.floor(e.year); });
    var X0 = minY, X1 = maxY;

    var svg = S('svg', {
      viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H,
      style: 'display:block;font-family:var(--serif)', 'aria-hidden': 'true'
    }, body);

    var plotX0 = 64, plotX1 = W - 24;
    function x(yr) { return plotX0 + (yr - X0) / (X1 - X0) * (plotX1 - plotX0); }
    var waterY = 150, axisY = 384;

    /* 水体（披露线以下） */
    S('rect', { x: plotX0 - 40, y: waterY, width: plotX1 - plotX0 + 64, height: axisY - waterY, fill: PAPERHI }, svg);

    /* 顶部小注 */
    T(svg, plotX0 - 40, 34, '窗口三 · 2004–2012 安静的十年：先部署，后披露', { 'font-size': 10, fill: INKLO, style: 'font-family:var(--mono)' });

    /* 披露线（水面，细波纹） */
    var wave = 'M ' + (plotX0 - 40) + ' ' + waterY;
    for (var wx = plotX0 - 40; wx <= plotX1 + 24; wx += 12) {
      wave += ' q 6 -4 12 0';
    }
    S('path', { d: wave, fill: 'none', stroke: BLUE, 'stroke-width': 1.6 }, svg);
    T(svg, plotX1 + 24, waterY - 10, '披露线 · 以上 = 公开', { 'font-size': 10, fill: INKLO, 'text-anchor': 'end' });
    T(svg, plotX1 + 24, waterY + 20, '以下 = 未披露运行', { 'font-size': 10, fill: INKLO, 'text-anchor': 'end' });

    /* 横轴 */
    S('line', { x1: plotX0 - 40, y1: axisY, x2: plotX1 + 24, y2: axisY, stroke: LINE, 'stroke-width': 1.2 }, svg);
    var tickEnd = X1 > 2014.8 ? Math.floor(X1 - 0.4) : 2014;
    for (var yr = 2004; yr <= tickEnd; yr += 2) {
      S('line', { x1: x(yr), y1: axisY, x2: x(yr), y2: axisY + 5, stroke: LINE, 'stroke-width': 1 }, svg);
      T(svg, x(yr), axisY + 17, String(yr), { 'font-size': 9.5, fill: INKLO, 'text-anchor': 'middle', style: 'font-family:var(--mono)' });
    }

    /* 潜水路径：入水 → 水下节点 → 出水（端点取 hidden 与水下事件的并集边界） */
    var entryY = +hidden.from, exitY = +hidden.to;
    under.forEach(function (e) { if (e.year < entryY) entryY = e.year; if (e.year > exitY) exitY = e.year; });
    var xa = x(entryY), xb = x(exitY);
    var depthY = waterY + 132;
    var pts = under.map(function (e) { return { x: x(e.year), y: Math.min(waterY + 24 + e.depth * 66, depthY + 8), e: e }; });
    var pathD = 'M ' + xa + ' ' + waterY;
    if (pts.length) {
      var lastX = xa, lastYv = waterY;
      pts.forEach(function (p) {
        var mx = (lastX + p.x) / 2;
        pathD += ' C ' + mx + ' ' + lastYv + ' ' + mx + ' ' + p.y + ' ' + p.x + ' ' + p.y;
        lastX = p.x; lastYv = p.y;
      });
      var mx2 = (lastX + xb) / 2;
      pathD += ' C ' + mx2 + ' ' + lastYv + ' ' + mx2 + ' ' + waterY + ' ' + xb + ' ' + waterY;
    } else {
      pathD += ' C ' + (xa + 40) + ' ' + depthY + ' ' + (xb - 40) + ' ' + depthY + ' ' + xb + ' ' + waterY;
    }
    S('path', { d: pathD, fill: 'none', stroke: BLUE, 'stroke-width': 2, 'stroke-dasharray': '5 4' }, svg);

    /* 入水 / 出水标记 */
    S('circle', { cx: xa, cy: waterY, r: 4.6, fill: '#fff', stroke: BLUE, 'stroke-width': 1.8 }, svg);
    S('circle', { cx: xb, cy: waterY, r: 4.6, fill: '#fff', stroke: BLUE, 'stroke-width': 1.8 }, svg);
    /* 出水涟漪 */
    S('path', { d: 'M ' + (xb - 12) + ' ' + (waterY - 8) + ' a 13 9 0 0 1 24 0', fill: 'none', stroke: BLUELO, 'stroke-width': 1.2 }, svg);
    S('path', { d: 'M ' + (xb - 20) + ' ' + (waterY - 14) + ' a 22 15 0 0 1 40 0', fill: 'none', stroke: BLUELO, 'stroke-width': 1, opacity: 0.6 }, svg);

    /* 潜水艇图形（路径中段） */
    var subX = (xa + xb) / 2, subY = depthY + 6;
    var sg = S('g', {}, svg);
    S('ellipse', { cx: subX, cy: subY, rx: 30, ry: 9, fill: '#fff', stroke: BLUE, 'stroke-width': 1.6 }, sg);
    S('rect', { x: subX - 6, y: subY - 16, width: 12, height: 9, fill: '#fff', stroke: BLUE, 'stroke-width': 1.4 }, sg);
    S('line', { x1: subX + 2, y1: subY - 16, x2: subX + 2, y2: subY - 24, stroke: BLUE, 'stroke-width': 1.4 }, sg);
    S('line', { x1: subX + 2, y1: subY - 24, x2: subX + 8, y2: subY - 24, stroke: BLUE, 'stroke-width': 1.4 }, sg);
    S('path', { d: 'M ' + (subX + 30) + ' ' + subY + ' l 8 -5 l 0 10 Z', fill: '#fff', stroke: BLUE, 'stroke-width': 1.2 }, sg);

    /* 水下节点 + 标签（上下交替，避开潜水艇图形） */
    pts.forEach(function (p, pi) {
      S('circle', { cx: p.x, cy: p.y, r: 3.6, fill: BLUE }, svg);
      var anchor = p.x > plotX1 - 150 ? 'end' : (p.x < plotX0 + 90 ? 'start' : 'middle');
      var ly = p.y + (pi % 2 === 0 ? -14 : 24);
      T(svg, p.x, ly, p.e.label, { 'font-size': 10.5, fill: INK, 'text-anchor': anchor, 'font-weight': 600 });
      var hit = S('circle', { cx: p.x, cy: p.y, r: 12, fill: 'transparent' }, svg);
      bind(hit,
        '<div style="font-weight:700">' + p.e.label + '</div>' +
        '<div style="max-width:260px">' + p.e.note + '</div>' +
        '<div style="opacity:.65;font-size:10px;margin-top:4px">水下（未披露）· 点击查看来源</div>',
        { title: p.e.label, body: p.e.note, source: p.e.source, date: p.e.date });
    });

    /* 隐蔽期括号 */
    var braceY = axisY - 26;
    S('line', { x1: xa, y1: braceY, x2: xb, y2: braceY, stroke: INKLO, 'stroke-width': 1, 'stroke-dasharray': '3 3' }, svg);
    S('line', { x1: xa, y1: braceY - 4, x2: xa, y2: braceY + 4, stroke: INKLO, 'stroke-width': 1 }, svg);
    S('line', { x1: xb, y1: braceY - 4, x2: xb, y2: braceY + 4, stroke: INKLO, 'stroke-width': 1 }, svg);
    T(svg, (xa + xb) / 2, braceY + 16, hidden.label || '隐蔽期', { 'font-size': 9.5, fill: INKLO, 'text-anchor': 'middle', style: 'font-family:var(--mono)' });

    /* 水上事件（披露线以上，交错标签） */
    above.forEach(function (e, i) {
      var ex = x(e.year), topY = waterY - 44 - (i % 2) * 26;
      S('line', { x1: ex, y1: waterY - 5, x2: ex, y2: topY + 5, stroke: INKLO, 'stroke-width': 1 }, svg);
      S('circle', { cx: ex, cy: topY, r: 3.2, fill: '#fff', stroke: BLUE, 'stroke-width': 1.6 }, svg);
      var anchor = ex > plotX1 - 130 ? 'end' : 'middle';
      T(svg, ex, topY - 9, e.label, { 'font-size': 10.5, fill: INK, 'text-anchor': anchor, 'font-weight': 600 });
      var hit = S('circle', { cx: ex, cy: topY, r: 13, fill: 'transparent' }, svg);
      bind(hit,
        '<div style="font-weight:700">' + e.label + '</div>' +
        '<div style="max-width:260px">' + e.note + '</div>' +
        '<div style="opacity:.65;font-size:10px;margin-top:4px">公开事件 · 点击查看来源</div>',
        { title: e.label, body: e.note, source: e.source, date: e.date });
    });

    /* 28nm 制程竞争（任务规格要求的事件点；数据缺省时固定补标） */
    var has28 = above.some(function (e) { return Math.abs(e.year - 2011) < 0.6; }) ||
                under.some(function (e) { return Math.abs(e.year - 2011) < 0.6; });
    if (!has28 && X0 <= 2011 && X1 >= 2011) {
      var n28 = x(2011), t28 = waterY - 96;
      S('line', { x1: n28, y1: waterY - 5, x2: n28, y2: t28 + 5, stroke: INKLO, 'stroke-width': 1 }, svg);
      S('circle', { cx: n28, cy: t28, r: 3.2, fill: '#fff', stroke: BLUE, 'stroke-width': 1.6 }, svg);
      var g28 = S('g', {}, svg);
      T(g28, n28, t28 - 9, '2011 · 28nm 制程竞争', { 'font-size': 10.5, fill: INK, 'text-anchor': 'middle', 'font-weight': 600 });
      bind(g28,
        '<div style="font-weight:700">2011 · 28nm 制程竞争</div>' +
        '<div style="max-width:250px">Xilinx 与 Altera 相继推出 28nm 系列（Virtex-7 / Stratix-V），TSMC 领衔代工量产竞赛：制程与工具链成为真正的进入壁垒。</div>',
        { title: '2011 · 28nm 制程竞争',
          body: '2011–2012 年，Xilinx 与 Altera 相继推出 28nm 系列（Virtex-7 与 Stratix-V），把 FPGA 的密度与功耗比推进一个世代；同期综合、布局布线软件持续加厚，工具链成为真正的进入壁垒。',
          source: '行业与官方 / 研究综合', date: '2011' });
    }

    /* KPI 注记 */
    T(svg, plotX0 - 40, axisY - 40, kpi.v, { 'font-size': 17, fill: BLUE, 'font-weight': 700 });
    T(svg, plotX0 - 40, axisY - 24, kpi.l, { 'font-size': 10, fill: INKMD });

    /* 图例 */
    T(svg, plotX1 + 24, H - 8, '悬停查看 · 点击打开来源', { 'font-size': 9.5, fill: INKLO, 'text-anchor': 'end' });
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
