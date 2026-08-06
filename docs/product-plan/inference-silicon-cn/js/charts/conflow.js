/* js/charts/conflow.js — 出清流桑基图（Agent F）
 * 注册：window.Charts['conflow']
 * 数据：window.COHORT（13 家样本 {name,status,founded,exitYear,note}）+ 本文件 DEST/FLOW 映射
 *       （去向与披露交易额；金额缺失一律标「未披露」，细流带表示）。
 * 设计：左列三代企业队列（PAL/PLD era · FPGA wars 1983–95 · duopoly challengers 2004–12 ·
 *       AI accelerators 2016）生命线沿时间轴向右延伸，汇入右侧去向框：
 *       AMD(+2) / DISSOLVED(+4) / MICROCHIP / LATTICE / INTEL(+1) / STILL INDEPENDENT(+4) /
 *       SOFTBANK / NVIDIA / PUBLIC MARKETS / QUALCOMM（+ AVAGO，样本内 LSI 去向）；
 *       流带宽度 = 披露交易额（平方根比例）；解散红 ×、IPO 圆点；去向框中文括注。
 *       hover tooltip / click drill。viewBox 高 ≈710。
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

/* ---------------- 三代企业队列（按成立年归组） ---------------- */
var ERAS = [
  { id: 'pal',  label: 'PAL/PLD ERA',                    sub: '早期可编程逻辑与 ASIC 先驱' },
  { id: 'fpga', label: 'FPGA WARS · 1983–95',            sub: 'FPGA 战争' },
  { id: 'duo',  label: 'DUOPOLY CHALLENGERS · 2004–12',  sub: '双寡头挑战者' },
  { id: 'ai',   label: 'AI ACCELERATORS · 2016',         sub: 'AI 加速器创业潮' }
];
function eraOf(founded) {
  if (founded <= 1982) return 'pal';
  if (founded <= 1995) return 'fpga';
  if (founded <= 2013) return 'duo';
  return 'ai';
}

/* ---------------- 去向框（顺序按原版规格；AVAGO 为样本内 LSI 的实际去向） ---------------- */
var DESTS = [
  { id: 'AMD',      label: 'AMD (+2)',              sub: '收购方 · +2 家样本外 · 未披露', active: true },
  { id: 'DISSOLVED',label: 'DISSOLVED (+4)',        sub: '已解散 · +4 家样本外 · 未披露', active: true, neg: true },
  { id: 'MICROCHIP',label: 'MICROCHIP',             sub: '收购方 · 本样本无 · 未披露',   active: false },
  { id: 'LATTICE',  label: 'LATTICE',               sub: '仍独立 · 本样本无 · 未披露',   active: false },
  { id: 'INTEL',    label: 'INTEL (+1)',            sub: '收购方 · Altera 2015 / Habana 2019', active: true },
  { id: 'INDEP',    label: 'STILL INDEPENDENT (+4)',sub: '仍独立 · 持续观察',            active: true },
  { id: 'SOFTBANK', label: 'SOFTBANK',              sub: '收购方 · Graphcore 2024',      active: true },
  { id: 'NVIDIA',   label: 'NVIDIA',                sub: '许可 / 平台 · 非并购',          active: true },
  { id: 'PUBLIC',   label: 'PUBLIC MARKETS',        sub: '公开上市 · 本样本无 · 未披露', active: false },
  { id: 'QUALCOMM', label: 'QUALCOMM',              sub: '收购方 · 本样本无 · 未披露',   active: false },
  { id: 'AVAGO',    label: 'AVAGO（现 BROADCOM）',  sub: '收购方 · LSI 2014',            active: true }
];

/* ---------------- 公司 → 去向 / 披露交易额映射（金额缺失 = null → 细流带 + 未披露） ---------------- */
var FLOW = {
  'LSI Logic':      { dest: 'AVAGO',     amount: 6.6,  amountLabel: 'US$6.6B · 2014',            kind: 'acquired' },
  'Altera':         { dest: 'INTEL',     amount: 16.7, amountLabel: 'US$16.7B · 2015',           kind: 'acquired' },
  'Xilinx':         { dest: 'AMD',       amount: 49,   amountLabel: '~US$49B · 2020–22',         kind: 'acquired' },
  'Tabula':         { dest: 'DISSOLVED', amount: null, amountLabel: '解散 · 金额未披露',          kind: 'dissolved' },
  'Wave Computing': { dest: 'DISSOLVED', amount: null, amountLabel: '解散 · 金额未披露',          kind: 'dissolved' },
  'Mythic':         { dest: 'INDEP',     amount: null, amountLabel: '仍独立',                    kind: 'independent' },
  'Esperanto':      { dest: 'INDEP',     amount: null, amountLabel: '仍独立',                    kind: 'independent' },
  'Graphcore':      { dest: 'SOFTBANK',  amount: null, amountLabel: '2024 · 金额未披露',          kind: 'acquired' },
  'Groq':           { dest: 'NVIDIA',    amount: 20,   amountLabel: '~US$20B · 媒体口径·未获确认', kind: 'license' },
  'Habana':         { dest: 'INTEL',     amount: 2,    amountLabel: '~US$2B · 2019',             kind: 'acquired' },
  'Cerebras':       { dest: 'INDEP',     amount: null, amountLabel: '仍独立 · 已递交 IPO 文件',   kind: 'ipo' },
  'Tenstorrent':    { dest: 'INDEP',     amount: null, amountLabel: '仍独立',                    kind: 'independent' },
  'SambaNova':      { dest: 'INDEP',     amount: null, amountLabel: '仍独立',                    kind: 'independent' }
};

/* COHORT 兜底（data.js 缺失时） */
var FB_COHORT = [
  { name: 'Xilinx', status: 'acquired', founded: 1984, exitYear: 2022, note: 'FPGA 发明者；AMD 约 350 亿美元收购（2020-10 宣布，2022-02 完成）' },
  { name: 'Altera', status: 'acquired', founded: 1983, exitYear: 2016, note: 'FPGA 双寡头之一；Intel 167 亿美元收购（2015-12 完成）' },
  { name: 'LSI Logic', status: 'acquired', founded: 1981, exitYear: 2014, note: 'ASIC 先驱；Avago 约 66 亿美元收购' },
  { name: 'Tabula', status: 'exited', founded: 2003, exitYear: 2015, note: '3D FPGA 创业公司；融资耗尽后关停' },
  { name: 'Graphcore', status: 'acquired', founded: 2016, exitYear: 2024, note: 'IPU 创业公司；2024-07 被 SoftBank 收购' },
  { name: 'Groq', status: 'license', founded: 2016, exitYear: null, note: 'LPU 创业公司；与 NVIDIA 达成技术许可安排（~US$20B，媒体口径，未获确认）' },
  { name: 'Habana', status: 'acquired', founded: 2016, exitYear: 2019, note: 'AI 加速器创业公司；Intel 约 20 亿美元收购' },
  { name: 'Wave Computing', status: 'exited', founded: 2010, exitYear: 2020, note: 'DPU 创业公司；Chapter 11 重组后资产出售' },
  { name: 'Cerebras', status: 'independent', founded: 2016, exitYear: null, note: '晶圆级芯片；已递交 IPO 文件，仍独立，持续观察' },
  { name: 'SambaNova', status: 'independent', founded: 2017, exitYear: null, note: '数据流架构；仍独立，持续观察' },
  { name: 'Tenstorrent', status: 'independent', founded: 2016, exitYear: null, note: 'RISC-V + AI；仍独立，持续观察' },
  { name: 'Mythic', status: 'independent', founded: 2012, exitYear: null, note: '模拟存内计算；重组后小规模存续' },
  { name: 'Esperanto', status: 'independent', founded: 2014, exitYear: null, note: 'RISC-V 众核推理；小规模存续' }
];

window.Charts['conflow'] = function (frame) {
  var body = frame.querySelector('.chart-body');
  if (!body) return;
  body.setAttribute('role', 'img');
  body.setAttribute('aria-label',
    '出清流桑基图：三代十三个代表企业的生命线沿时间轴向右延伸，汇入 AMD、DISSOLVED、MICROCHIP、' +
    'LATTICE、INTEL、STILL INDEPENDENT、SOFTBANK、NVIDIA、PUBLIC MARKETS、QUALCOMM 等去向框；' +
    '流带宽度代表披露交易额，未披露金额为细流带；解散以红叉标记，IPO 以圆点标记；' +
    '悬停查看详情，点击展开资料卡');
  var lastW = 0;

  function render() {
    var W = body.clientWidth || 0;
    if (W < 660) W = 660;
    lastW = W;
    var H = 710;
    body.innerHTML = '';

    var INK = css('--ink', '#051c2c'), INKMD = css('--ink-md', '#42566a'),
        INKLO = css('--ink-lo', '#8595a6'), LINE = css('--line', '#dbe2ea'),
        LINELO = css('--line-lo', '#eef1f6'), PAPERHI = css('--paper-hi', '#f7f9fc'),
        BLUE = css('--blue', '#2251ff'), NEG = css('--neg', '#c22f4e'),
        COPPER = css('--copper', '#b07a10');

    /* ---------------- 数据装配 ---------------- */
    var cohortSrc = (Array.isArray(window.COHORT) && window.COHORT.length) ? window.COHORT : FB_COHORT;
    var companies = cohortSrc.filter(function (c) { return FLOW[c.name]; }).map(function (c) {
      var f = FLOW[c.name];
      return {
        name: c.name, founded: +c.founded, exitYear: c.exitYear != null ? +c.exitYear : null,
        status: c.status, note: c.note || '',
        era: eraOf(+c.founded),
        dest: f.dest, amount: f.amount, amountLabel: f.amountLabel, kind: f.kind
      };
    });
    function flowW(amount) { return amount == null ? 1.6 : Math.max(2.5, Math.sqrt(amount) * 2.9); }

    /* ---------------- 几何 ---------------- */
    var TL_X0 = 180, TL_X1 = W - 296;          /* 生命线时间轴 */
    var BX = W - 224, BW = 212;                 /* 去向框列 */
    var TOP = 64, ROWH = 24, ERAH = 34;
    var XA = 1975, XB = 2026;
    function tx(yr) { return TL_X0 + (yr - XA) / (XB - XA) * (TL_X1 - TL_X0); }

    var svg = S('svg', {
      viewBox: '0 0 ' + W + ' ' + H,
      width: '100%', height: H,
      style: 'display:block;font-family:var(--serif)',
      'aria-hidden': 'true'
    }, body);

    /* ---------------- 顶部时间轴 + 纵向网格 ---------------- */
    T(svg, 8, 24, '成立 → 退出 / 至今（生命线）', { 'font-size': 9, fill: INKLO, style: 'font-family:var(--mono)' });
    S('line', { x1: TL_X0, y1: 40, x2: tx(2026), y2: 40, stroke: LINE, 'stroke-width': 1.1 }, svg);
    [1975, 1985, 1995, 2005, 2015].forEach(function (yr) {
      var xx = tx(yr);
      S('line', { x1: xx, y1: 36, x2: xx, y2: 44, stroke: LINE, 'stroke-width': 1 }, svg);
      T(svg, xx, 30, String(yr), { 'font-size': 8.5, fill: INKLO, 'text-anchor': 'middle', style: 'font-family:var(--mono)' });
      S('line', { x1: xx, y1: 46, x2: xx, y2: 648, stroke: LINELO, 'stroke-width': 1 }, svg);
    });
    S('line', { x1: tx(2026), y1: 36, x2: tx(2026), y2: 44, stroke: LINE, 'stroke-width': 1 }, svg);
    T(svg, tx(2026), 30, '2026', { 'font-size': 8.5, fill: INKMD, 'text-anchor': 'end', 'font-weight': 700, style: 'font-family:var(--mono)' });

    /* ---------------- 左列：三代企业队列 ---------------- */
    var y = TOP;
    ERAS.forEach(function (era) {
      var rows = companies.filter(function (c) { return c.era === era.id; })
        .sort(function (a, b) { return a.founded - b.founded; });
      if (!rows.length) return;
      T(svg, 8, y + 12, era.label, {
        'font-size': 9.5, fill: BLUE, 'font-weight': 700,
        style: 'font-family:var(--mono);letter-spacing:.10em'
      });
      T(svg, 8, y + 24, era.sub, { 'font-size': 8.5, fill: INKLO });
      S('line', { x1: 8, y1: y + 29, x2: 168, y2: y + 29, stroke: LINELO, 'stroke-width': 1 }, svg);
      y += ERAH;
      rows.forEach(function (c) {
        c.rowY = y + ROWH / 2 + 1;
        T(svg, 8, c.rowY + 3.5, c.name, { 'font-size': 11, fill: INK });
        var range = c.founded + ' → ' + (c.exitYear != null ? c.exitYear : '');
        T(svg, 8 + 118, c.rowY + 3.5, range, { 'font-size': 8, fill: INKLO, 'text-anchor': 'start', style: 'font-family:var(--mono)' });
        y += ROWH;
      });
    });
    var flowBottom = y + 8;

    /* ---------------- 去向框（右侧列） ---------------- */
    var destById = {};
    var boxH = 40;
    var span = Math.max(flowBottom, 640) - TOP;
    var gap = (span - DESTS.length * boxH) / (DESTS.length - 1);
    if (gap < 6) { gap = 6; boxH = (span - gap * (DESTS.length - 1)) / DESTS.length; }
    DESTS.forEach(function (d, i) {
      d.y = TOP + i * (boxH + gap);
      d.h = boxH;
      d.inflow = 0;
      destById[d.id] = d;
    });
    /* 先累计各去向的流带总宽，确定槽位 */
    companies.forEach(function (c) {
      c.w = flowW(c.amount);
      destById[c.dest].inflow += c.w + 1.5;
    });
    DESTS.forEach(function (d) {
      d.cursor = d.y + d.h / 2 - (d.inflow - 1.5) / 2;
    });
    companies.forEach(function (c) {
      var d = destById[c.dest];
      c.slotY = d.cursor + c.w / 2;
      d.cursor += c.w + 1.5;
    });

    /* ---------------- 流带（先画，压在生命线与框之下） ---------------- */
    var KIND_STYLE = {
      acquired:    { fill: BLUE,   fop: 0.20, stroke: BLUE,   sop: 0.55, dash: null },
      license:     { fill: COPPER, fop: 0.16, stroke: COPPER, sop: 0.75, dash: '5 3' },
      dissolved:   { fill: NEG,    fop: 0.14, stroke: NEG,    sop: 0.60, dash: null },
      independent: { fill: INKLO,  fop: 0.16, stroke: INKLO,  sop: 0.55, dash: null },
      ipo:         { fill: INKLO,  fop: 0.16, stroke: BLUE,   sop: 0.55, dash: null }
    };
    companies.forEach(function (c) {
      var sx = tx(c.exitYear != null ? c.exitYear : 2026);
      var sy = c.rowY, ty = c.slotY, w2 = c.w / 2;
      var st = KIND_STYLE[c.kind];
      var mx = (sx + BX) / 2;
      var dPath = 'M ' + sx + ' ' + (sy - w2) +
        ' C ' + mx + ' ' + (sy - w2) + ' ' + mx + ' ' + (ty - w2) + ' ' + BX + ' ' + (ty - w2) +
        ' L ' + BX + ' ' + (ty + w2) +
        ' C ' + mx + ' ' + (ty + w2) + ' ' + mx + ' ' + (sy + w2) + ' ' + sx + ' ' + (sy + w2) + ' Z';
      c.band = S('path', {
        d: dPath, fill: st.fill, 'fill-opacity': st.fop,
        stroke: st.stroke, 'stroke-opacity': st.sop, 'stroke-width': 0.8,
        'stroke-dasharray': st.dash
      }, svg);
      /* 宽流带上的金额标签（贴近生命线末端；会压到去向框时改左锚） */
      if (c.amount != null && c.w >= 4) {
        var lw = 0;
        for (var ci = 0; ci < c.amountLabel.length; ci++) lw += (c.amountLabel.charCodeAt(ci) > 255 ? 8.5 : 4.8);
        var labelX = sx + 8, labelAnchor = 'start';
        if (labelX + lw > BX - 6) { labelX = sx - 8; labelAnchor = 'end'; }
        T(svg, labelX, sy - w2 - 4, c.amountLabel, {
          'font-size': 8.5, fill: c.kind === 'license' ? COPPER : INKMD, 'text-anchor': labelAnchor,
          style: 'font-family:var(--mono);paint-order:stroke;stroke:#fff;stroke-width:3px'
        });
      }
    });

    /* ---------------- 生命线（成立 → 退出/至今）+ 端点标记 ---------------- */
    companies.forEach(function (c) {
      var x0 = tx(c.founded);
      var x1 = tx(c.exitYear != null ? c.exitYear : 2026);
      var yy = c.rowY;
      var grp = S('g', {}, svg);
      S('line', { x1: x0, y1: yy, x2: x1, y2: yy, stroke: INKMD, 'stroke-width': 1.3 }, grp);
      S('circle', { cx: x0, cy: yy, r: 2, fill: INKMD }, grp); /* 成立点 */
      if (c.kind === 'dissolved') {
        /* 红 × 解散 */
        S('line', { x1: x1 - 4, y1: yy - 4, x2: x1 + 4, y2: yy + 4, stroke: NEG, 'stroke-width': 1.8 }, grp);
        S('line', { x1: x1 - 4, y1: yy + 4, x2: x1 + 4, y2: yy - 4, stroke: NEG, 'stroke-width': 1.8 }, grp);
      } else if (c.kind === 'ipo') {
        /* IPO 圆点（空心蓝点 = 已递交 IPO 文件） */
        S('circle', { cx: x1, cy: yy, r: 3.6, fill: '#fff', stroke: BLUE, 'stroke-width': 1.6 }, grp);
      } else if (c.exitYear == null) {
        S('circle', { cx: x1, cy: yy, r: 2.6, fill: INKLO }, grp); /* 活跃圆点 */
      }
      var tip = '<div class="t-title">' + esc(c.name + ' · ' + c.founded + ' → ' + (c.exitYear != null ? c.exitYear : '至今')) + '</div>' +
                '<div>' + esc(c.note || '未披露') + '</div>' +
                '<div class="t-sub">去向：' + esc(destById[c.dest].label) + ' · ' + esc(c.amountLabel) + ' · 点击查看资料卡</div>';
      var drill = {
        title: c.name + ' → ' + destById[c.dest].label,
        body: (c.note || '未披露') + ' 披露交易额：' + (c.amount != null ? c.amountLabel : '未披露') + '。',
        source: '公司披露 / 研究综合（13 家样本队列）',
        date: c.exitYear != null ? String(c.exitYear) : '2026-07'
      };
      S('rect', { x: 4, y: yy - 10, width: Math.max(170, x1), height: 20, fill: 'transparent' }, grp);
      bind(grp, tip, drill);
    });

    /* ---------------- 去向框绘制 ---------------- */
    DESTS.forEach(function (d) {
      var g = S('g', {}, svg);
      var rect = S('rect', {
        x: BX, y: d.y, width: BW, height: d.h, rx: 2,
        fill: d.active ? '#fff' : PAPERHI,
        stroke: d.neg ? NEG : (d.active ? INKMD : LINE),
        'stroke-width': 1,
        'stroke-dasharray': d.active ? 'none' : '4 3'
      }, g);
      if (d.neg) {
        /* 框内红 × 图标 */
        S('line', { x1: BX + 8, y1: d.y + d.h / 2 - 4, x2: BX + 16, y2: d.y + d.h / 2 + 4, stroke: NEG, 'stroke-width': 1.8 }, g);
        S('line', { x1: BX + 8, y1: d.y + d.h / 2 + 4, x2: BX + 16, y2: d.y + d.h / 2 - 4, stroke: NEG, 'stroke-width': 1.8 }, g);
      }
      var tx0 = BX + (d.neg ? 24 : 10);
      T(g, tx0, d.y + d.h / 2 - 2, d.label, {
        'font-size': 10.5, fill: d.active ? INK : INKLO, 'font-weight': 700,
        style: 'font-family:var(--mono)'
      });
      T(g, tx0, d.y + d.h / 2 + 11, d.sub, { 'font-size': 8.5, fill: INKLO });
      var inCos = companies.filter(function (c) { return c.dest === d.id; });
      var tip = '<div class="t-title">' + esc(d.label) + '</div>' +
                '<div>' + esc(d.sub) + '</div>' +
                (inCos.length ? '<div>样本内：' + esc(inCos.map(function (c) { return c.name; }).join(' / ')) + '</div>' : '<div>本样本内无对应公司 · 未披露</div>') +
                '<div class="t-sub">点击查看资料卡</div>';
      var drill = {
        title: '去向 · ' + d.label,
        body: (inCos.length
          ? '本样本内汇入：' + inCos.map(function (c) { return c.name + '（' + c.amountLabel + '）'; }).join('；') + '。'
          : '13 家样本内无公司汇入此去向；样本外公司未披露。') +
          ' 去向框标签中的（+N）为原版口径下样本外企业数，未逐一披露。',
        source: '研究综合（13 家样本队列）',
        date: '2026-07'
      };
      g.addEventListener('mouseenter', function () { rect.setAttribute('fill', d.active ? PAPERHI : '#fff'); });
      g.addEventListener('mouseleave', function () { rect.setAttribute('fill', d.active ? '#fff' : PAPERHI); });
      bind(g, tip, drill);
    });

    /* ---------------- 图例（底部两行） ---------------- */
    var ly1 = 668, ly2 = 690;
    var lx = 8;
    S('rect', { x: lx, y: ly1 - 8, width: 20, height: 7, fill: BLUE, 'fill-opacity': 0.2, stroke: BLUE, 'stroke-opacity': 0.55, 'stroke-width': 0.8 }, svg);
    T(svg, lx + 26, ly1 - 1, '并购 · 流带宽度 = 披露交易额（平方根比例）', { 'font-size': 9, fill: INKMD });
    lx += 26 + 250;
    S('rect', { x: lx, y: ly1 - 8, width: 20, height: 7, fill: COPPER, 'fill-opacity': 0.16, stroke: COPPER, 'stroke-width': 0.8, 'stroke-dasharray': '4 2' }, svg);
    T(svg, lx + 26, ly1 - 1, '许可（~US$20B 媒体口径 · 未获确认）', { 'font-size': 9, fill: INKMD });
    lx += 26 + 205;
    S('rect', { x: lx, y: ly1 - 8, width: 20, height: 3, fill: INKLO, 'fill-opacity': 0.2, stroke: INKLO, 'stroke-width': 0.6 }, svg);
    T(svg, lx + 26, ly1 - 1, '仍独立 / 金额未披露（细流带）', { 'font-size': 9, fill: INKMD });

    lx = 8;
    S('line', { x1: lx + 3, y1: ly2 - 8, x2: lx + 11, y2: ly2, stroke: NEG, 'stroke-width': 1.8 }, svg);
    S('line', { x1: lx + 3, y1: ly2, x2: lx + 11, y2: ly2 - 8, stroke: NEG, 'stroke-width': 1.8 }, svg);
    T(svg, lx + 18, ly2 - 1, '解散', { 'font-size': 9, fill: INKMD });
    lx += 18 + 44;
    S('circle', { cx: lx + 5, cy: ly2 - 4, r: 2.6, fill: INKLO }, svg);
    T(svg, lx + 14, ly2 - 1, '活跃', { 'font-size': 9, fill: INKMD });
    lx += 14 + 44;
    S('circle', { cx: lx + 5, cy: ly2 - 4, r: 3.4, fill: '#fff', stroke: BLUE, 'stroke-width': 1.5 }, svg);
    T(svg, lx + 14, ly2 - 1, '已递交 IPO 文件', { 'font-size': 9, fill: INKMD });
    lx += 14 + 108;
    S('rect', { x: lx, y: ly2 - 10, width: 16, height: 12, fill: PAPERHI, stroke: LINE, 'stroke-width': 1, 'stroke-dasharray': '4 3' }, svg);
    T(svg, lx + 22, ly2 - 1, '本样本无对应公司 · 未披露', { 'font-size': 9, fill: INKMD });
    lx += 22 + 160;
    T(svg, lx, ly2 - 1, '（+N）= 原版口径下样本外企业数，未逐一披露', { 'font-size': 9, fill: INKLO });
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
