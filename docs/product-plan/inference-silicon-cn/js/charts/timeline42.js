/* js/charts/timeline42.js — 四十二年，一条时间线（按英文原版整图移植）
 * 注册：window.Charts['timeline42'] = function (frame) {}
 *   渲染进 frame.querySelector('.chart-body')；
 *   数据：window.TIMELINE_EVENTS / window.WINDOWS / window.CHART_DATA['timeline42']
 *   交互：Utils.tooltip.show/move/hide(html,x,y) · Utils.drill.open({title,body,source,date})
 * 移植蓝本：英文原版 js/charts/timeline42.js（构图、纵向度量、greedy 打包逐行对齐）：
 *   a) 顶部三行错开窗口标签 → 全高窗口底纹带（每窗口独立 color 的 8% alpha 着色
 *      + 左缘发丝线；color 照抄原版 data.js，本站 WINDOWS 缺该字段由 adapter 补齐）
 *      → 中部牌匾 → 底部年份轴
 *   b) 牌匾统一 32px 高、两行 mono（10px 粗体年份 + 9px 标签）、白底灰边
 *      + 左侧 2px 蓝竖条、超长截断 …；无红/蓝描边、无编号头、无变高变宽
 *   c) 牌匾居中于年份针（desired = xe − 卡宽/2）、按年份排序 greedy 首适行
 *      packing、行距均匀；无右侧惩罚区、无大位移
 *   d) 连线 #dbe2ea 1.5/3 浅虚线 + 1.5px 蓝色小刻度针（非实心圆针）；
 *      刻度 9 个（1985–2020 每 5 年 + 2026）
 *   e) 事件 10 的 year=2022.77（标签 2022-10-07）由数据侧提供，直接消费
 * 幂等；自持 debounced ResizeObserver（只重绘）；reduced-motion 下静态、滚动降级 auto。
 */
(function () {
'use strict';
window.Charts = window.Charts || {};

var NS = 'http://www.w3.org/2000/svg';
var MONO = 'Menlo, Consolas, "SF Mono", "PingFang SC", monospace';

/* 原版 data.js 各窗口 color（本站 WINDOWS 无此字段，adapter 按 id/序补齐） */
var WIN_COLORS = { e2: '#8595a6', e3: '#7a45c9', e4: '#008a6d', e5: '#b07a10', e6: '#c22f4e', e7: '#2251ff' };
var WIN_COLOR_LIST = ['#8595a6', '#7a45c9', '#008a6d', '#b07a10', '#c22f4e', '#2251ff'];

/* 纵向度量（照抄原版） */
var WIN_ROW_Y = [16, 31, 46];   /* 三行错开的窗口标签行            */
var BAND_TOP = 60;              /* 底纹带从标签行之下开始          */
var AXIS_BLOCK = 30;            /* 底部轴 + 刻度标签               */
var PLAQUE_H = 32;              /* 两行式牌匾，统一 32px           */
var MIN_PITCH = PLAQUE_H + 11;  /* 错行最紧行距                    */
var YEAR_FS = 10, LABEL_FS = 9, WIN_FS = 9;

/* ---------------- 自足小工具 ---------------- */
function css(name, fb) {
  try {
    var v = '';
    if (window.Utils && typeof Utils.css === 'function') v = Utils.css(name);
    if (!v) v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fb;
  } catch (e) { return fb; }
}
function hexA(hex, a) {
  var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function el(name, attrs, parent) {
  var n = document.createElementNS(NS, name);
  if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function debounce(fn, ms) {
  var t = null;
  return function () {
    var a = arguments, s = this;
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn.apply(s, a); }, ms);
  };
}

/* CJK 感知字宽：全角字符=fs，其余按 mono 0.602·fs */
function isWide(ch) {
  return /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch);
}
function strw(s, fs) {
  var w = 0;
  for (var i = 0; i < s.length; i++) w += isWide(s.charAt(i)) ? fs : fs * 0.602;
  return w;
}
/* 按像素预算截断 mono 标签，结尾 …（原版的 fit()，CJK 适配） */
function fit(text, maxPx, fs) {
  if (strw(text, fs) <= maxPx) return text;
  var out = '', w = 0, budget = maxPx - fs * 0.602; /* 给 … 留位 */
  for (var i = 0; i < text.length; i++) {
    var cw = isWide(text.charAt(i)) ? fs : fs * 0.602;
    if (w + cw > budget) break;
    out += text.charAt(i); w += cw;
  }
  return out.replace(/[\s:;,.\-–—·&，、：；。]+$/, '') + '…';
}
/* 窗口标签宽：strw + 每字符 0.6 letter-spacing */
function winW(s) { return strw(s, WIN_FS) + s.length * 0.6; }

function scrollToId(id, reduced) {
  var t = id && document.getElementById(id);
  if (t) t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
}

/* 桌面锚定 504px；窄屏等比收缩，下限 380px（原版 targetH） */
function targetH(W) {
  if (W >= 720) return 504;
  return Math.max(380, Math.round(504 * W / 876));
}

/* ---------------- adapter：本站数据 → 原版 render 期望的形状 ---------------- */
function readEvents() {
  var src = (window.CHART_DATA && window.CHART_DATA.timeline42 && window.CHART_DATA.timeline42.events) ||
            (Array.isArray(window.TIMELINE_EVENTS) ? window.TIMELINE_EVENTS : []);
  return src.map(function (e) {
    if (!e) return null;
    var d = e.drill || {};
    var yr = +e.year;
    /* 事件 10：数据侧已把 year 改为 2022.77（标签 2022-10-07 不变），直接消费；
       防御旧数据快照仍是整数 2022 的情况 */
    if (e.yearLabel === '2022-10-07' && yr === 2022) yr = 2022.77;
    var body = String(d.body || '');
    return {
      year: yr,
      yearLabel: String(e.yearLabel !== undefined && e.yearLabel !== null ? e.yearLabel : Math.floor(yr)),
      label: String(e.label || ''),
      blurb: fit(body, 320, 11),
      target: e.window ? 'sec-w' + String(e.window).slice(1) : null,
      drill: d.title ? { title: d.title, body: d.body, source: d.source, date: d.date } : null
    };
  }).filter(function (e) { return e && isFinite(e.year); });
}

function readWindows() {
  var src = (window.CHART_DATA && window.CHART_DATA.timeline42 && window.CHART_DATA.timeline42.windows) ||
            (Array.isArray(window.WINDOWS) ? window.WINDOWS : []);
  return src.map(function (w, i) {
    if (!w) return null;
    var from = +(w.from !== undefined ? w.from : (w.years && w.years[0]));
    var to = +(w.to !== undefined ? w.to : (w.years && w.years[1]));
    if (!isFinite(from) || !isFinite(to)) return null;
    var id = w.id || '';
    var name = String(w.nameCn || w.label || w.name || ('窗口 ' + (i + 1)));
    var years = from + '–' + to;
    var dash = id && window.DASH_STATES && window.DASH_STATES[id];
    return {
      years: [from, to],
      name: name,
      color: w.color || WIN_COLORS[id] || WIN_COLOR_LIST[i % WIN_COLOR_LIST.length],
      sectionId: id ? 'sec-w' + id.slice(1) : null,
      tip: name,
      judgment: years + (dash && dash.title ? ' · ' + dash.title : ''),
      drill: {
        category: '历史窗口',
        title: name,
        period: years,
        body: dash ? (dash.title + (dash.stage ? '；周期阶段：' + dash.stage : '')) : '',
        source: ''
      }
    };
  }).filter(Boolean);
}

/* ---------------- 原版 render（契约适配：container=chart-body，data 由 adapter 组装） ---------------- */
function render(container, data, ctx) {
  if (!container) return;
  ctx = ctx || {};
  var tooltip = ctx.tooltip || { show: function () {}, move: function () {}, hide: function () {} };
  var drill = typeof ctx.drill === 'function' ? ctx.drill : function () {};
  var reduced = !!ctx.reducedMotion;

  var C = {
    blue: css('--blue', '#2251ff'),
    ink: css('--ink', '#051c2c'), inkMd: css('--ink-md', '#42566a'), inkLo: css('--ink-lo', '#8595a6'),
    line: css('--line', '#dbe2ea'), lineLo: css('--line-lo', '#eef1f6'), paper: css('--paper', '#ffffff')
  };

  /* 幂等：拆除上一次渲染 */
  var st = container.__tl42;
  if (st && st.ro) st.ro.disconnect();
  st = container.__tl42 = { ro: null, w: 0 };
  container.innerHTML = '';

  var events = (data && Array.isArray(data.events) ? data.events : []).filter(Boolean).slice();
  var windows = (data && Array.isArray(data.windows) ? data.windows : []).filter(Boolean);
  if (!events.length || !container.isConnected) return;

  var W = Math.max(280, container.clientWidth || 280);
  st.w = W;

  /* ---- x 比例尺 ----------------------------------------------------- */
  var margin = { l: 14, r: 14 };
  var x0d = 1984, x1d = 2027;
  function x(yr) { return margin.l + (yr - x0d) / (x1d - x0d) * (W - margin.l - margin.r); }

  /* ---- 牌匾文案 + greedy 左→右首适行 packing -------------------------- */
  var labelCap = Math.min(200, Math.max(120, W * 0.42));
  var items = events.map(function (ev) {
    var yearLabel = String(ev.yearLabel);
    var label = fit(ev.label, labelCap, LABEL_FS);
    var w = Math.max(strw(yearLabel, YEAR_FS), strw(label, LABEL_FS)) + 14;
    return { ev: ev, yearLabel: yearLabel, label: label, cx: x(+ev.year || x0d), w: w };
  }).sort(function (a, b) { return (a.cx - b.cx) || (b.w - a.w); });

  var rowsRight = [];
  items.forEach(function (it) {
    it.left = Math.max(2, Math.min(it.cx - it.w / 2, W - 2 - it.w));
    var r = -1;
    for (var i = 0; i < rowsRight.length; i++) {
      if (rowsRight[i] + 10 <= it.left) { r = i; break; }
    }
    if (r < 0) { r = rowsRight.length; rowsRight.push(-Infinity); }
    it.row = r;
    rowsRight[r] = it.left + it.w;
  });
  var nRows = Math.max(1, rowsRight.length);

  /* ---- 高度：504px 桌面锚定；行数多时加行而不碰撞 ---------------------- */
  var H = targetH(W);
  var minH = BAND_TOP + (nRows - 1) * MIN_PITCH + PLAQUE_H + AXIS_BLOCK + 6;
  if (H < minH) H = minH;
  var axisY = H - AXIS_BLOCK;
  /* 错行在底纹带内均匀铺开（行距封顶 60，墙体保持紧凑），整体垂直居中 */
  var avail = axisY - 4 - BAND_TOP - PLAQUE_H;
  var pitch = nRows > 1 ? Math.min(60, avail / (nRows - 1)) : 0;
  var blockH = (nRows - 1) * pitch + PLAQUE_H;
  var startY = BAND_TOP + Math.max(0, (axisY - 4 - BAND_TOP - blockH) / 2);
  function rowY(r) { return startY + r * pitch; }

  /* 预留精确盒高（消除布局位移） */
  container.style.height = H + 'px';

  /* ---- svg ---------------------------------------------------------- */
  var svg = el('svg', {
    width: W, height: H, viewBox: '0 0 ' + W + ' ' + H,
    role: 'img', 'aria-label': '四十二年，一条线——六个着色窗口与十三块事件牌匾，1985 至 2026；悬停查看摘要，点击牌匾展开资料卡'
  }, container);
  svg.style.display = 'block';
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';

  /* ---- 浅色网格刻度 --------------------------------------------------- */
  var tickYears = W < 560
    ? [1985, 1995, 2005, 2015, 2026]
    : [1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2026];
  var grid = el('g', { 'pointer-events': 'none' }, svg);
  tickYears.forEach(function (yr) {
    el('line', {
      x1: x(yr), y1: BAND_TOP, x2: x(yr), y2: axisY,
      stroke: C.lineLo, 'stroke-width': 1, 'shape-rendering': 'crispEdges'
    }, grid);
  });

  /* ---- 六个窗口底纹带（全高、8% alpha、左缘发丝线）+ 三行错开标签 ------- */
  var winRowRight = [-Infinity, -Infinity, -Infinity];
  windows.forEach(function (win, i) {
    if (!win || !Array.isArray(win.years)) return;
    var xa = x(Math.max(x0d, win.years[0])), xb = x(Math.min(x1d, win.years[1]));
    if (!(xb > xa)) return;
    var col = win.color || C.inkLo;
    var band = el('rect', {
      x: xa, y: BAND_TOP, width: xb - xa, height: axisY - BAND_TOP,
      fill: hexA(col, 0.08), stroke: 'none', cursor: 'pointer'
    }, svg);
    el('line', {
      x1: xa, y1: BAND_TOP, x2: xa, y2: axisY,
      stroke: C.line, 'stroke-width': 1, 'shape-rendering': 'crispEdges'
    }, svg);

    /* 窗口名——mono，三行首适 */
    var name = String(win.name || '');
    var lw = winW(name);
    var bandCx = (xa + xb) / 2;
    var placed = null, rr;
    for (rr = 0; rr < 3 && !placed; rr++) {
      var row = (i + rr) % 3;
      var left = Math.max(2, Math.min(bandCx - lw / 2, W - 2 - lw));
      if (left > winRowRight[row] + 8) placed = { row: row, left: left, text: name };
    }
    if (!placed) {
      var bestRow = 0, minRight = Infinity;
      for (rr = 0; rr < 3; rr++) {
        if (winRowRight[rr] < minRight) { minRight = winRowRight[rr]; bestRow = rr; }
      }
      var avail2 = Math.max(56, W - 2 - (minRight === -Infinity ? 0 : minRight + 8));
      var shrunk = fit(name, avail2 - name.length * 0.6, WIN_FS);
      placed = { row: bestRow, left: minRight === -Infinity ? 2 : minRight + 8, text: shrunk };
      lw = winW(shrunk);
    }
    winRowRight[placed.row] = placed.left + winW(placed.text);
    /* 标签到其底纹带的发丝引线 */
    el('line', {
      x1: bandCx, y1: WIN_ROW_Y[placed.row] + 3, x2: bandCx, y2: BAND_TOP,
      stroke: C.lineLo, 'stroke-width': 1
    }, svg);
    var lab = el('text', {
      x: placed.left, y: WIN_ROW_Y[placed.row], 'text-anchor': 'start',
      'font-family': MONO, 'font-size': WIN_FS + 'px', 'letter-spacing': '0.6px',
      fill: C.inkLo, cursor: 'pointer'
    }, svg);
    lab.textContent = placed.text;

    function bandHover(ev) {
      tooltip.show('<b>' + esc(win.tip || win.name || '') + '</b><br>' +
        esc(String(win.judgment || '').slice(0, 200)), ev.clientX, ev.clientY);
      band.setAttribute('fill', hexA(col, 0.17));
    }
    function bandOut() { tooltip.hide(); band.setAttribute('fill', hexA(col, 0.08)); }
    function bandGo(ev) {
      var e = ev || {};
      drill(win.drill, e.clientX, e.clientY);
      scrollToId(win.sectionId, reduced);
    }
    [band, lab].forEach(function (node) {
      node.addEventListener('mouseover', bandHover);
      node.addEventListener('mousemove', function (ev) { tooltip.move(ev.clientX, ev.clientY); });
      node.addEventListener('mouseleave', bandOut);
      node.addEventListener('click', bandGo);
    });
  });
  /* 右端收边发丝线 */
  el('line', {
    x1: x(x1d), y1: BAND_TOP, x2: x(x1d), y2: axisY,
    stroke: C.line, 'stroke-width': 1, 'shape-rendering': 'crispEdges'
  }, svg);

  /* ---- 浅虚线连线 + 年份刻度针（底层，不响应事件） --------------------- */
  var wires = el('g', { 'pointer-events': 'none' }, svg);
  items.forEach(function (it) {
    var py = rowY(it.row);
    var sx = Math.max(it.left + 8, Math.min(it.cx, it.left + it.w - 8));
    el('line', {
      x1: sx, y1: py + PLAQUE_H, x2: it.cx, y2: axisY - 5,
      stroke: C.line, 'stroke-width': 1, 'stroke-dasharray': '1.5 3'
    }, wires);
    /* 年份针——轴上 1.5px 蓝色小刻度 */
    it.pin = el('line', {
      x1: it.cx, y1: axisY - 4.5, x2: it.cx, y2: axisY + 4.5,
      stroke: C.blue, 'stroke-width': 1.5
    }, wires);
  });

  /* ---- 十三块事件牌匾（统一 32px，两行 mono，左 2px 蓝竖条） ------------ */
  items.forEach(function (it) {
    var py = rowY(it.row);
    var g = el('g', { cursor: 'pointer' }, svg);
    var gTitle = el('title', {}, g);
    gTitle.textContent = it.yearLabel + ' · ' + (it.ev.label || '') + ' —— 点击查看资料卡';

    var rect = el('rect', {
      x: it.left, y: py, width: it.w, height: PLAQUE_H, rx: 2,
      fill: C.paper, stroke: C.line, 'stroke-width': 1
    }, g);
    /* 左侧 2px 蓝色竖条 */
    el('rect', { x: it.left, y: py, width: 2, height: PLAQUE_H, fill: C.blue }, g);
    var year = el('text', {
      x: it.left + 8, y: py + 13, 'text-anchor': 'start',
      'font-family': MONO, 'font-size': YEAR_FS + 'px', 'font-weight': 'bold', fill: C.ink
    }, g);
    year.textContent = it.yearLabel;
    var lab = el('text', {
      x: it.left + 8, y: py + 26, 'text-anchor': 'start',
      'font-family': MONO, 'font-size': LABEL_FS + 'px', fill: C.inkMd
    }, g);
    lab.textContent = it.label;
    var pin = it.pin;

    function tipHtml() {
      return '<b>' + esc(it.yearLabel + ' · ' + (it.ev.label || '')) + '</b><br>' + esc(it.ev.blurb || '');
    }
    function hover(ev) {
      rect.setAttribute('stroke', C.blue);
      pin.setAttribute('stroke-width', '3');
      tooltip.show(tipHtml(), ev.clientX, ev.clientY);
    }
    function out() {
      rect.setAttribute('stroke', C.line);
      pin.setAttribute('stroke-width', '1.5');
      tooltip.hide();
    }
    function activate(ev) {
      var e = ev || {};
      drill(it.ev.drill, e.clientX, e.clientY);
      scrollToId(it.ev.target, reduced);
    }
    g.addEventListener('mouseover', hover);
    g.addEventListener('mousemove', function (ev) { tooltip.move(ev.clientX, ev.clientY); });
    g.addEventListener('mouseleave', out);
    g.addEventListener('click', activate);
  });

  /* ---- 发丝年份轴 ------------------------------------------------------ */
  var ax = el('g', { 'pointer-events': 'none' }, svg);
  el('line', {
    x1: margin.l, y1: axisY + 0.5, x2: W - margin.r, y2: axisY + 0.5,
    stroke: C.line, 'stroke-width': 1, 'shape-rendering': 'crispEdges'
  }, ax);
  tickYears.forEach(function (yr) {
    el('line', {
      x1: x(yr), y1: axisY, x2: x(yr), y2: axisY + 4,
      stroke: C.line, 'stroke-width': 1, 'shape-rendering': 'crispEdges'
    }, ax);
    var t = el('text', {
      x: x(yr), y: axisY + 16, 'text-anchor': 'middle',
      'font-family': MONO, 'font-size': '9.5px', fill: C.inkLo
    }, ax);
    t.textContent = String(yr);
  });

  /* ---- 响应式重绘（debounced，只重绘） ---------------------------------- */
  if ('ResizeObserver' in window) {
    var rerender = debounce(function () {
      var w = container.clientWidth || 0;
      if (Math.abs(w - st.w) < 2 || !container.isConnected) return;
      render(container, data, ctx);
    }, 140);
    st.ro = new ResizeObserver(rerender);
    st.ro.observe(container);
  }
}

/* ---------------- 注册：本站契约 Charts['timeline42'](frame) ---------------- */
window.Charts['timeline42'] = function (frame) {
  var body = frame && frame.querySelector ? frame.querySelector('.chart-body') : null;
  if (!body) return;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var tooltip = (window.Utils && Utils.tooltip) || null;
  var ctx = {
    reducedMotion: reduced,
    tooltip: tooltip || { show: function () {}, move: function () {}, hide: function () {} },
    drill: function (d) { if (d && window.Utils && Utils.drill) Utils.drill.open(d); }
  };
  render(body, { events: readEvents(), windows: readWindows() }, ctx);
};
})();
