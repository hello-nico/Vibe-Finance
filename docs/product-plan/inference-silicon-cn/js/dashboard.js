/* ==========================================================================
 * js/dashboard.js — Agent E
 * 右侧固定 460px Dashboard：Canvas 点阵地球 + HTML 信息层
 *
 * 契约（SPEC §5 / 用户 §8 / CSS 层结构约定）：
 *   window.Dashboard = { init(), setState(key) }
 *   消费：window.Utils（fitCanvas / tooltip / drill）、window.DASH_STATES、
 *         window.COHORT、vendor/d3.min.js + topojson-client.min.js（全局 d3/topojson）
 *   DOM：#dash-rail > #dash-canvas + #dash-html
 *
 * #dash-html 结构（类名与 CSS 层对齐）：
 *   .dash-top    > .dash-badge / .dash-title / .dash-stage / .dash-stages>span(.on)
 *   .dash-spacer （地球区域，canvas 在其背面绘制点阵地球）
 *   .dash-bottom > .dash-mini(.dash-mini-title + .dash-mini-big + svg + .dash-mini-read)
 *                  / .dash-metrics(.dash-metric>.v+.l)
 *                  / .dash-cohort(.dash-cohort-item.on>.dash-cohort-sym+名)
 *                  / .dash-cohort-legend（符号图例行）
 *   .dash-src（右栏底部来源行，点击弹 drill 列出 mini 数据来源）
 *
 * P1 升级（mini 点阵半色调 + cohort 符号体系）新增类名（内联 style 已兜底，
 * 建议 CSS 层接管）：.dash-mini-big(.v/.c) .dash-mini-read .dash-src
 *   .dash-cohort-sym .dash-cohort-legend；.dash-cohort-item 改为纵向（图标上/名下）。
 *
 * 降级与纪律：fetch 失败降级为经纬网格球（console.warn，不抛错）；
 *   prefers-reduced-motion 地球静止；visibilitychange 暂停 rAF；init() 幂等。
 * ========================================================================== */
(function () {
  'use strict';

  /* ---------------- 设计 tokens（与 SPEC §2 一致，仅用于 canvas 绘制） ---------------- */
  var C = {
    ink: '#051c2c', inkMd: '#42566a', inkLo: '#8595a6',
    line: '#dbe2ea', lineLo: '#eef1f6', paperHi: '#f7f9fc',
    blue: '#2251ff', blueHi: '#1233b8', neg: '#c22f4e'
  };

  var SPIN = 0.02;            // 自转速度：约 0.02°/帧（60fps ≈ 1.2°/s）
  var TWEEN_MS = 1400;        // 状态切换时 rotate 平滑插值时长
  var HALF_PI = Math.PI / 2;
  var HIT_R = 18;             // 节点命中半径（CSS px）

  // 六阶段指示器文案（window.WINDOWS 存在时优先使用其 name）
  var STAGE_FALLBACK = [
    '窗口一 · 1985–1995', '窗口二 · 1995–2003', '窗口三 · 2004–2012',
    '窗口四 · 2013–2018', '窗口五 · 2019–2022', '窗口六 · 2023–2026'
  ];

  // 状态 key → 六窗口序号（0..5；-1 = 跨窗口总览，不高亮任何阶段点）
  var KEY_TO_WINDOW = {
    frame: 5, clearing: -1,
    e2: 0, e3: 1, e4: 2, e5: 3, e6: 4, e7: 5,
    now: 5, mismatch: 5, gates: 5, grid: 5, assumptions: 5,
    analog: 5, verdict: 5, signals: 5, invest: 5
  };

  /* ---------------- 防御性 fallback（window.COHORT / DASH_STATES 未就绪时使用） ---------------- */
  // 与 js/data.js window.COHORT 对齐：14 家（6 并购 · 1 资产出售 · 1 许可 · 1 IPO · 5 独立 · 0 解散）
  var FALLBACK_COHORT = [
    { name: 'Xilinx',         status: 'acquired',    founded: 1984, note: '2022 年被 AMD 收购（≈$49B 交割）' },
    { name: 'Altera',         status: 'acquired',    founded: 1983, note: '2015 年被 Intel 以 167 亿美元收购' },
    { name: 'Achronix',       status: 'independent', founded: 2004, note: '仍独立，持续观察' },
    { name: 'Wave Computing', status: 'acquired',    founded: 2008, note: '2020 Chapter 11 → 2025 被 GlobalFoundries 收购' },
    { name: 'Mythic',         status: 'independent', founded: 2012, note: '仍独立（2025-12 重启融资）' },
    { name: 'Nervana',        status: 'acquired',    founded: 2014, note: '2016 年被 Intel 收购' },
    { name: 'Flex Logix',     status: 'asset-sale',  founded: 2014, note: '2024 资产出售予 Analog Devices' },
    { name: 'SiFive',         status: 'independent', founded: 2015, note: '仍独立（pre-IPO）' },
    { name: 'Cerebras',       status: 'ipo',         founded: 2015, note: '2026-05 IPO（Nasdaq: CBRS）' },
    { name: 'Groq',           status: 'license',     founded: 2016, note: '2025-12 非独占许可（媒体口径约 $20B）；余部独立' },
    { name: 'Graphcore',      status: 'acquired',    founded: 2016, note: '2024 年被 SoftBank 收购' },
    { name: 'Habana',         status: 'acquired',    founded: 2016, note: '2019 年被 Intel 收购' },
    { name: 'Tenstorrent',    status: 'independent', founded: 2016, note: '仍独立，持续观察' },
    { name: 'SambaNova',      status: 'independent', founded: 2017, note: '仍独立，持续观察' }
  ];

  var FALLBACK_STATES = {
    frame: {
      badge: '2023 → ?', title: '扩张已确认 · 峰值仍开放', stage: '结论先行',
      center: [-160, 35],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'GPU/TPU 需求与风险投资中心' },
        { name: 'Seattle',        lon: -122.33, lat: 47.61, note: '云厂商总部：Amazon 与 Microsoft' },
        { name: 'Seoul',          lon: 126.98,  lat: 37.57, note: 'HBM：SK hynix 与 Samsung' },
        { name: 'Hsinchu',        lon: 120.97,  lat: 24.78, note: 'TSMC 先进制程与 CoWoS' },
        { name: 'Beijing',        lon: 116.41,  lat: 39.90, note: '国产替代与出口管制应对' }
      ],
      mini: {
        title: 'Marvell 数据中心业务收入', unit: 'US$B / quarter',
        series: [[1, 0.74], [2, 0.82], [3, 0.98], [4, 1.10], [5, 1.29], [6, 1.49], [7, 1.52], [8, 1.80]]
      },
      metrics: [
        { v: '≈2.5x', l: 'Base case（区间 2.0–4.7x）' },
        { v: '<+14%',    l: '盈亏平衡阈值' },
        { v: '2',        l: '两类证据一致' },
        { v: '未披露',   l: '订单与取消' }
      ]
    },
    clearing: {
      badge: '1975→2026', title: '出清 · 出售，而非破产', stage: '出清语法',
      center: [-45, 38],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: '三代挑战者的出发地' },
        { name: 'Bristol',        lon: -2.59,   lat: 51.45, note: 'Graphcore 总部，2024 年出售' },
        { name: 'Tel Aviv',       lon: 34.78,   lat: 32.09, note: 'Habana 总部，2019 年被 Intel 收购' }
      ],
      mini: {
        title: '14 家样本中仍在场的企业', unit: '家 / 年',
        series: [[1983, 1], [1984, 2], [2004, 3], [2008, 4], [2012, 5], [2014, 7], [2015, 8], [2016, 11], [2017, 12], [2019, 11], [2022, 10], [2024, 8], [2025, 7], [2026, 7]]
      },
      metrics: [
        { v: '0',   l: '样本解散（0 家）' },
        { v: '6+1', l: '并购 · 资产出售' },
        { v: '1+1', l: 'IPO（Cerebras）· 许可（Groq）' },
        { v: '5',   l: '仍独立' }
      ]
    }
  };

  /* ---------------- 模块状态 ---------------- */
  var D = {
    inited: false, built: false, rotSet: false,
    rail: null, canvas: null, root: null,
    ctx: null, w: 0, h: 0,
    projection: null, grat: null,
    rot: { l: 0, p: -20 }, tween: null, lastT: 0,
    geo: { cx: 230, cy: 260, r: 150 },
    key: null, state: null, pendingKey: null,
    landState: 'loading', landPromise: null, dots: null,
    nodePts: [], hoverNode: null, tipShown: false,
    reduced: false, mq: null,
    raf: 0, resizing: false, measureRaf: 0,
    spacerEl: null
  };

  /* ---------------- 小工具 ---------------- */
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function normLon(l) { return ((l + 540) % 360) - 180; }
  function shortestDelta(from, to) {
    var d = (to - from) % 360;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return d;
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function escA(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // DPR 适配：优先 Utils.fitCanvas（SPEC §5/§6），缺失时按同一规则本地实现
  function fitCanvasInto(canvas) {
    if (window.Utils && typeof window.Utils.fitCanvas === 'function') {
      return window.Utils.fitCanvas(canvas);
    }
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: rect.width, h: rect.height };
  }

  /* ---------------- 状态数据规范化（防御缺失字段） ---------------- */
  function getState(key) {
    var all = window.DASH_STATES || {};
    var st = all[key];
    if (!st) {
      if (!FALLBACK_STATES[key]) {
        console.warn('[dashboard] 未知状态 "' + key + '"，使用占位状态。');
      }
      st = FALLBACK_STATES[key] || {
        badge: '—', title: '（数据准备中）', stage: '', center: [0, 20],
        nodes: [], mini: { title: '', unit: '', series: [] }, metrics: []
      };
    }
    return st;
  }

  function stageMeta(st, key) {
    var text = '', idx = null;
    if (typeof st.stage === 'string') text = st.stage;
    else if (st.stage && typeof st.stage === 'object') {
      text = st.stage.text || st.stage.name || '';
      if (isFinite(+st.stage.index)) idx = +st.stage.index;
    }
    if (isFinite(+st.stageIndex)) idx = +st.stageIndex;
    else if (isFinite(+st.window)) idx = +st.window;
    if (idx == null && KEY_TO_WINDOW[key] != null) idx = KEY_TO_WINDOW[key];
    if (idx != null) { if (idx === 6) idx = 5; idx = clamp(idx, -1, 5); }
    return { text: text, idx: idx };
  }

  function stageLabels() {
    var w = window.WINDOWS;
    if (Object.prototype.toString.call(w) === '[object Array]' && w.length === 6) {
      return w.map(function (x, i) { return (x && x.name) || STAGE_FALLBACK[i]; });
    }
    return STAGE_FALLBACK;
  }

  /* ---------------- cohort 规范化：状态 → ind / acq / out ---------------- */
  var COHORT_META = {
    ind: { color: C.blue,  label: '独立' },
    acq: { color: C.inkLo, label: '已并购' },
    out: { color: C.neg,   label: '退出/许可' }
  };
  function normStatus(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (/^(ind|independent|独立)/.test(s)) return 'ind';
    if (/^(ipo|上市)/.test(s)) return 'ind';                    // IPO 计入在场（与 data.js 口径一致）
    if (/^(asset[- ]?sale|资产出售)/.test(s)) return 'acq';      // 资产出售归入出售/并购桶
    if (/^(acq|acquired|并购|已并购|m&a)/.test(s)) return 'acq';
    if (/^(out|exit|exited|lic|licensed|license|退出|许可|closed|bankrupt|dissolved)/.test(s)) return 'out';
    return 'ind';
  }
  // 细分符号类别：lic（许可）从 out 中拆出；sale（资产出售）/ ipo 为 14 家样本新增类别
  function symKind(s) {
    s = String(s == null ? '' : s).toLowerCase();
    if (/^(lic|licensed|license|许可)/.test(s)) return 'lic';
    if (/^(asset[- ]?sale|资产出售)/.test(s)) return 'sale';
    if (/^(ipo|上市)/.test(s)) return 'ipo';
    if (/^(acq|acquired|并购|已并购|m&a)/.test(s)) return 'acq';
    if (/^(out|exit|exited|退出|closed|bankrupt|dissolved)/.test(s)) return 'out';
    return 'ind';
  }
  function normCo(b, on) {
    return {
      name: (b && (b.name || b.id)) || '?',
      status: normStatus(b && b.status),
      kind: symKind(b && b.status),
      founded: isFinite(+(b && b.founded)) ? +b.founded : null,
      note: (b && b.note) || '',
      on: on == null ? (b && (b.on || b.active)) !== false && true : !!on
    };
  }
  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }
  function normalizeCohort(st) {
    var base = (isArr(window.COHORT) && window.COHORT.length) ? window.COHORT : FALLBACK_COHORT;
    var c = st && st.cohort;
    if (isArr(c) && c.length) {
      // 形态 A：状态直接给完整数组 [{name,status,note}]
      return c.map(function (b) { return normCo(b); });
    }
    if (c && typeof c === 'object') {
      if (isArr(c.focus)) {
        // 形态 B（data.js）：{focus:[公司名…], note} —— focus 内公司高亮（.on）
        return base.map(function (b) {
          var nm = (b && (b.name || b.id)) || '?';
          return normCo(b, c.focus.indexOf(nm) >= 0);
        });
      }
      // 形态 C（兼容）：{公司名: 状态覆盖}，出现的公司视为高亮
      return base.map(function (b) {
        var nm = (b && (b.name || b.id)) || '?';
        var hit = Object.prototype.hasOwnProperty.call(c, nm);
        var merged = hit ? { name: nm, status: c[nm], note: b && b.note } : b;
        return normCo(merged, hit);
      });
    }
    return base.map(function (b) { return normCo(b, true); });
  }

  /* ---------------- #dash-html 构建 ---------------- */
  // .dash-top：badge / title / stage / .dash-stages>span(.on)
  function buildStages(idx) {
    var wrap = el('div', 'dash-stages');
    wrap.setAttribute('role', 'list');
    wrap.setAttribute('aria-label', '周期阶段指示器：六个窗口');
    stageLabels().forEach(function (name, i) {
      var d = el('span', i === idx ? 'on' : '');
      d.setAttribute('role', 'listitem');
      d.setAttribute('title', name);
      d.setAttribute('aria-label', name + (i === idx ? '（当前）' : ''));
      wrap.appendChild(d);
    });
    return wrap;
  }

  /* ---------------- mini chart：点阵半色调 + 深色虚线趋势 + 大数字 ---------------- */
  // 解析 mini.series → {pts:[[x,y]], labs:[原始x标签], numeric:bool}
  function parseMini(mini) {
    var raw = (mini && Object.prototype.toString.call(mini.series) === '[object Array]') ? mini.series : [];
    var pts = [], labs = [], numeric = true, i, d, y, x;
    for (i = 0; i < raw.length; i++) {
      d = raw[i];
      if (!d) continue;
      y = +d[1];
      if (!isFinite(y)) continue;
      x = +d[0];
      if (!isFinite(x)) numeric = false;
      pts.push([x, y]);
      labs.push(d[0] == null ? '' : String(d[0]));
    }
    if (!numeric || pts.length < 3) {
      // 类目序列（或仅 2 点、不插值）：按序号等距布列
      for (i = 0; i < pts.length; i++) pts[i][0] = i;
      numeric = false;
    }
    return { pts: pts, labs: labs, numeric: numeric };
  }

  // 峰值/终点大数字：取 |y| 最大点；终点即峰值时标「终点」，否则标「峰值」
  function miniKeyPoint(mini, parsed) {
    var pts = parsed.pts, bi = 0, i;
    for (i = 1; i < pts.length; i++) {
      if (Math.abs(pts[i][1]) >= Math.abs(pts[bi][1])) bi = i;
    }
    if (!pts.length) return null;
    return { v: pts[bi][1], lab: parsed.labs[bi], kind: bi === pts.length - 1 ? '终点' : '峰值' };
  }

  // 点阵半色调 SVG：数据区小圆点阵（点距 4.5px）+ 深色虚线趋势线
  function buildMiniSvg(mini, label, parsed) {
    var pts = parsed.pts, i;
    if (!pts.length) return '';
    var W = 400, H = 62, pl = 6, pr = 6, pt = 6, pb = 8;
    var iw = W - pl - pr, ih = H - pt - pb;
    var xmin = pts[0][0], xmax = pts[0][0], ymin = pts[0][1], ymax = pts[0][1];
    for (i = 1; i < pts.length; i++) {
      if (pts[i][0] < xmin) xmin = pts[i][0];
      if (pts[i][0] > xmax) xmax = pts[i][0];
      if (pts[i][1] < ymin) ymin = pts[i][1];
      if (pts[i][1] > ymax) ymax = pts[i][1];
    }
    var hasNeg = ymin < 0;
    if (!parsed.numeric || hasNeg) { ymin = Math.min(0, ymin); ymax = Math.max(0, ymax); }
    else { var pad = (ymax - ymin) * 0.08 || 1; ymin -= pad; ymax += pad; }
    if (ymax - ymin < 1e-9) ymax = ymin + 1;
    function X(v) { return pl + (v - xmin) / ((xmax - xmin) || 1) * iw; }
    function Y(v) { return pt + (1 - (v - ymin) / (ymax - ymin)) * ih; }
    var SP = 4.5, R = 0.95;                      // 点距 ~4.5px，点半径
    var base = hasNeg ? Y(0) : (H - pb);         // 点阵填充基准线
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' +
      escA(label || '迷你图表') + '" width="100%" height="' + H + '">';
    // 基准线（负值序列为零线，否则为底边）
    s += '<line x1="' + pl + '" y1="' + base.toFixed(1) + '" x2="' + (W - pr) + '" y2="' + base.toFixed(1) +
      '" stroke="' + C.lineLo + '" stroke-width="1"/>';
    var dotTail = '" r="' + R + '" fill="' + C.blue + '" opacity="0.42"/>';
    function dotAt(cx, cy) {
      return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + dotTail;
    }
    var px = [], py = [], dPath = '';
    for (i = 0; i < pts.length; i++) {
      px.push(X(pts[i][0])); py.push(Y(pts[i][1]));
      dPath += (i ? 'L' : 'M') + px[i].toFixed(1) + ' ' + py[i].toFixed(1);
    }
    var gx, gy, cy, seg, k;
    if (parsed.numeric) {
      // 折线模式：沿 x 网格逐列插值，点阵从基准线填至曲线
      for (gx = pl; gx <= W - pr + 0.01; gx += SP) {
        seg = 0;
        while (seg < px.length - 2 && px[seg + 1] < gx) seg++;
        k = (gx - px[seg]) / ((px[seg + 1] - px[seg]) || 1);
        cy = py[seg] + clamp(k, 0, 1) * (py[seg + 1] - py[seg]);
        if (cy <= base) { for (gy = base; gy >= cy - 0.01; gy -= SP) s += dotAt(gx, gy); }
        else { for (gy = base; gy <= cy + 0.01; gy += SP) s += dotAt(gx, gy); }
      }
    } else {
      // 类目模式：每类一列点阵柱（不插值）
      var n = pts.length, half = Math.max(SP, Math.min(13.5, iw / n * 0.3));
      for (i = 0; i < n; i++) {
        for (gx = px[i] - half; gx <= px[i] + half + 0.01; gx += SP) {
          cy = py[i];
          if (cy <= base) { for (gy = base; gy >= cy - 0.01; gy -= SP) s += dotAt(gx, gy); }
          else { for (gy = base; gy <= cy + 0.01; gy += SP) s += dotAt(gx, gy); }
        }
      }
    }
    // 深色虚线趋势线
    if (pts.length > 1) {
      s += '<path d="' + dPath + '" fill="none" stroke="' + C.ink +
        '" stroke-width="1.3" stroke-dasharray="3.5 2.5" stroke-linejoin="round"/>';
      s += '<circle cx="' + px[px.length - 1].toFixed(1) + '" cy="' + py[py.length - 1].toFixed(1) +
        '" r="2.2" fill="' + C.ink + '"/>';
    } else {
      s += '<circle cx="' + px[0].toFixed(1) + '" cy="' + py[0].toFixed(1) +
        '" r="2.2" fill="' + C.ink + '"/>';
    }
    s += '</svg>';
    return s;
  }

  function fmtNum(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a >= 100) return String(Math.round(v));
    if (a >= 10) return String(Math.round(v * 10) / 10);
    return String(Math.round(v * 100) / 100);
  }

  function buildMini(mini) {
    var wrap = el('div', 'dash-mini');
    mini = mini || {};
    if (mini.note) wrap.setAttribute('title', String(mini.note));
    var title = mini.title || '', unit = mini.unit || '';
    var parsed = parseMini(mini);
    if (title || unit) {
      var t = el('div', 'dash-mini-title', title);
      if (unit) {
        var u = el('span', 'dash-mini-unit', unit);
        u.style.marginLeft = '8px';
        t.appendChild(u);
      }
      wrap.appendChild(t);
    }
    // 大号蓝色关键数字（峰值/终点值 + 说明）
    var kp = miniKeyPoint(mini, parsed);
    if (kp) {
      var big = el('div', 'dash-mini-big');
      big.style.cssText = 'display:flex;align-items:baseline;gap:8px;margin:2px 0 4px;flex-wrap:wrap;';
      var bv = el('span', 'v', fmtNum(kp.v) + (unit ? ' ' + String(unit).split('（')[0].trim() : ''));
      bv.style.cssText = 'font-size:24px;font-weight:700;line-height:1.1;color:' + C.blue + ';' +
        'font-family:var(--mono),Menlo,monospace;letter-spacing:-.01em;';
      var bc = el('span', 'c', kp.kind + ' · ' + kp.lab + ' · ' + title);
      bc.style.cssText = 'font-family:var(--mono),Menlo,monospace;font-size:9.5px;' +
        'letter-spacing:.04em;color:var(--ink-lo),' + C.inkLo + ';';
      big.appendChild(bv);
      big.appendChild(bc);
      wrap.appendChild(big);
    }
    var svg = buildMiniSvg(mini, title + (unit ? '（' + unit + '）' : ''), parsed);
    if (svg) {
      wrap.insertAdjacentHTML('beforeend', svg);   // .dash-mini > title + big + svg + read
    } else {
      wrap.appendChild(el('div', 'dash-mini-empty', '未披露'));
    }
    // 如何阅读：单位与口径说明
    var read = el('div', 'dash-mini-read',
      '如何阅读：单位 ' + (unit || '未披露') + '；' + (mini.note ? String(mini.note) + '；' : '') +
      '点阵面积示意量级，深色虚线为数据趋势。');
    read.style.cssText = 'font-family:var(--mono),Menlo,monospace;font-size:9px;line-height:1.5;' +
      'color:var(--ink-lo),' + C.inkLo + ';margin-top:3px;';
    wrap.appendChild(read);
    return wrap;
  }

  // .dash-metrics > .dash-metric > .v + .l（至多 4 项 placard）
  function buildMetrics(list) {
    var wrap = el('div', 'dash-metrics');
    wrap.setAttribute('role', 'list');
    (Object.prototype.toString.call(list) === '[object Array]' ? list : []).slice(0, 4)
      .forEach(function (m) {
        var box = el('div', 'dash-metric');
        box.setAttribute('role', 'listitem');
        box.appendChild(el('div', 'v', m && m.v != null ? String(m.v) : '—'));
        box.appendChild(el('div', 'l', m && m.l != null ? String(m.l) : ''));
        wrap.appendChild(box);
      });
    return wrap;
  }

  /* ---------------- cohort 符号体系 ----------------
   * →=被收购(acq) L=被许可(lic) ×=解散(out) +=资产出售(sale) ●=IPO(ipo)
   * 虚线框=成立前(pre) 实心方块=当前领先（独立且当前状态 focus） 点=活跃（独立）
   * 公司名横排在图标下方；底部图例行说明符号。 */
  var SYM_LABEL = {
    arr: '被收购', lic: '被许可', x: '解散/退出', sale: '资产出售', ipo: 'IPO',
    pre: '成立前', solid: '当前领先', dot: '活跃'
  };
  function coSym(co, winTo) {
    if (co.founded != null && winTo != null && co.founded > winTo) return 'pre';
    if (co.kind === 'acq') return 'arr';
    if (co.kind === 'lic') return 'lic';
    if (co.kind === 'sale') return 'sale';
    if (co.kind === 'ipo') return 'ipo';
    if (co.kind === 'out') return 'x';
    return co.on ? 'solid' : 'dot';
  }
  function buildSymIcon(sym, on) {
    var ic = el('span', 'dash-cohort-sym');
    ic.setAttribute('aria-hidden', 'true');
    ic.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;' +
      'width:14px;height:12px;line-height:1;flex:0 0 auto;';
    var color = on ? C.blue : C.inkMd;
    if (sym === 'arr' || sym === 'lic' || sym === 'x' || sym === 'sale' || sym === 'ipo') {
      ic.textContent = sym === 'arr' ? '→' : (sym === 'lic' ? 'L' : (sym === 'x' ? '×' : (sym === 'sale' ? '+' : '●')));
      ic.style.fontSize = '11px';
      ic.style.fontWeight = '700';
      ic.style.fontFamily = 'var(--mono),Menlo,monospace';
      ic.style.color = sym === 'x' ? C.neg : color;
      if (sym === 'x') ic.style.fontSize = '12px';
      if (sym === 'ipo') ic.style.fontSize = '9px';
    } else if (sym === 'pre') {
      ic.style.width = '9px';
      ic.style.height = '9px';
      ic.style.border = '1px dashed ' + C.inkLo;
      ic.style.boxSizing = 'border-box';
    } else if (sym === 'solid') {
      ic.style.width = '8px';
      ic.style.height = '8px';
      ic.style.background = on ? C.blue : C.ink;
    } else { // dot
      ic.style.width = '6px';
      ic.style.height = '6px';
      ic.style.borderRadius = '50%';
      ic.style.background = color;
    }
    return ic;
  }

  // .dash-cohort > .dash-cohort-item(.on) > .dash-cohort-sym + 名称（横排图标下）
  function buildCohort(st, winTo) {
    var wrap = el('div', 'dash-cohort');
    wrap.setAttribute('role', 'list');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px 9px;margin-top:12px;' +
      'padding-top:8px;border-top:1px solid var(--line-lo,' + C.lineLo + ');align-items:flex-start;';
    var cohortNote = st && st.cohort && !isArr(st.cohort) && st.cohort.note;
    wrap.setAttribute('aria-label', '14 家样本公司符号队列：→ 收购 · L 许可 · × 解散 · + 资产出售 · ● IPO · 虚线框 成立前 · 实心 当前领先 · 点 活跃' +
      (cohortNote ? '；' + cohortNote : ''));
    normalizeCohort(st).forEach(function (co) {
      var sym = coSym(co, winTo);
      var s = el('span', 'dash-cohort-item' + (co.on ? ' on' : ''));
      s.setAttribute('role', 'listitem');
      s.setAttribute('data-s', co.status);
      s.setAttribute('data-sym', sym);
      // 旧版 ::before 圆点改透明（符号体系取代；类名契约保留，CSS 层可后续移除）
      s.style.setProperty('--line', 'transparent');
      s.style.setProperty('--blue', 'transparent');
      s.style.cssText = 'display:inline-flex;flex-direction:column;align-items:center;gap:2px;' +
        'font-family:var(--mono),Menlo,monospace;font-size:9px;letter-spacing:.02em;' +
        'color:' + (co.on ? 'var(--ink),' + C.ink : 'var(--ink-lo),' + C.inkLo) + ';' +
        'white-space:nowrap;max-width:64px;';
      var nm = el('span', '', co.name);
      nm.style.cssText = 'max-width:64px;overflow:hidden;text-overflow:ellipsis;';
      var t = co.name + '：' + SYM_LABEL[sym] + (co.note ? ' · ' + co.note : '');
      s.setAttribute('title', t);
      s.setAttribute('aria-label', t);
      s.appendChild(buildSymIcon(sym, co.on));
      s.appendChild(nm);
      wrap.appendChild(s);
    });
    // 图例行
    var lg = el('div', 'dash-cohort-legend',
      '14-player cohort · 1975–2026 · solid=当前领先 · dot=活跃 · → 收购 · L 许可 · × 解散 · + 资产出售 · ● IPO · 虚线=成立前');
    lg.style.cssText = 'font-family:var(--mono),Menlo,monospace;font-size:8.5px;line-height:1.5;' +
      'color:var(--ink-lo),' + C.inkLo + ';margin-top:6px;letter-spacing:.02em;';
    wrap.appendChild(lg);
    return wrap;
  }

  /* ---------------- 右栏底部来源行：点击弹 drill 列出 mini 数据来源 ---------------- */
  function buildSource(st) {
    var b = el('button', 'dash-src', 'Source · Kimi Research · 图表素材库 · 点击查看出处');
    b.setAttribute('type', 'button');
    b.style.cssText = 'display:block;width:100%;text-align:left;background:none;border:0;' +
      'border-top:1px solid var(--line-lo,' + C.lineLo + ');margin-top:10px;padding:6px 0 0;' +
      'font-family:var(--mono),Menlo,monospace;font-size:9px;letter-spacing:.04em;' +
      'color:var(--ink-lo),' + C.inkLo + ';cursor:pointer;pointer-events:auto;';
    b.addEventListener('mouseenter', function () { b.style.color = C.blue; });
    b.addEventListener('mouseleave', function () { b.style.color = ''; });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!(window.Utils && Utils.drill && typeof Utils.drill.open === 'function')) return;
      var mini = (st && st.mini) || {};
      var cn = st && st.cohort && !isArr(st.cohort) && st.cohort.note;
      var body =
        '迷你图《' + (mini.title || '未命名') + '》\n' +
        '· 来源 / 口径：' + (mini.note || '未披露') + '\n' +
        '· 单位：' + (mini.unit || '未披露') + '\n' +
        '· 大数字：取序列峰值/终点值（图中标注）\n' +
        (cn ? 'cohort 队列说明：' + cn + '\n' : 'cohort 队列说明：未披露\n') +
        '指标卡数值逐项来源：未披露（随正文 K 编号核对）。';
      Utils.drill.open({
        title: '出处 · ' + (st.title || 'Dashboard 状态'),
        body: body,
        source: 'Kimi Research · 图表素材库',
        date: ''
      });
      var be = document.querySelector('#drill-card .drill-body');
      if (be) be.style.whiteSpace = 'pre-line';
    });
    return b;
  }

  function buildHTML(st, key) {
    var root = D.root;
    root.textContent = '';
    var meta = stageMeta(st, key);
    var top = el('div', 'dash-top');
    top.appendChild(el('div', 'dash-badge', st.badge || '—'));
    top.appendChild(el('div', 'dash-title', st.title || ''));
    top.appendChild(el('div', 'dash-stage', meta.text));
    top.appendChild(buildStages(meta.idx));
    root.appendChild(top);
    D.spacerEl = el('div', 'dash-spacer');
    D.spacerEl.setAttribute('aria-hidden', 'true');
    root.appendChild(D.spacerEl);
    var bottom = el('div', 'dash-bottom');
    bottom.appendChild(buildMini(st.mini));
    bottom.appendChild(buildMetrics(st.metrics));
    // 当前状态对应窗口的结束年份：早于该年份未成立的公司以虚线框表示「成立前」
    var winTo = null;
    if (meta.idx != null && meta.idx >= 0) {
      var W6 = window.WINDOWS;
      if (isArr(W6) && W6[meta.idx] && isFinite(+W6[meta.idx].to)) winTo = +W6[meta.idx].to;
      else {
        var fb = [[1985, 1995], [1995, 2003], [2004, 2012], [2013, 2018], [2019, 2022], [2023, 2026]];
        winTo = fb[clamp(meta.idx, 0, 5)][1];
      }
    }
    bottom.appendChild(buildCohort(st, winTo));
    bottom.appendChild(buildSource(st));
    root.appendChild(bottom);
  }

  /* ---------------- 陆地数据：fetch 一次并缓存，失败降级为网格球 ---------------- */
  function loadLand() {
    if (D.landPromise) return D.landPromise;
    D.landPromise = fetch('vendor/land-110m.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (topo) {
        if (typeof topojson === 'undefined') throw new Error('topojson 未加载');
        var obj = topo && topo.objects &&
          (topo.objects.land || topo.objects[Object.keys(topo.objects)[0]]);
        if (!obj) throw new Error('TopoJSON 缺少 objects');
        var land = topojson.feature(topo, obj);
        // 预计算点阵：纬度 −58..76，经度 −178..180，约 3° 步长，仅保留陆地点
        var pts = [];
        for (var lat = -58; lat <= 76; lat += 3) {
          for (var lon = -178; lon <= 180; lon += 3) {
            if (d3.geoContains(land, [lon, lat])) pts.push([lon, lat]);
          }
        }
        D.dots = pts;
        D.landState = 'ok';
      })
      .catch(function (err) {
        D.landState = 'fail';
        console.warn('[dashboard] land-110m.json 加载失败，降级为经纬网格球。', err);
      });
    return D.landPromise;
  }

  /* ---------------- 地球几何：以 .dash-spacer 为准（CSS 缺失时按比例兜底） ---------------- */
  function measure() {
    var w = D.w, h = D.h;
    var top = h * 0.17, bottom = h * 0.62;
    if (D.canvas && D.spacerEl) {
      var cr = D.canvas.getBoundingClientRect();
      var rs = D.spacerEl.getBoundingClientRect();
      if (rs.height > 60) {
        top = rs.top - cr.top + 4;
        bottom = rs.bottom - cr.top - 4;
      }
    }
    if (!(bottom - top > 80)) { top = h * 0.17; bottom = h * 0.62; }
    var gap = bottom - top;
    D.geo = {
      cx: w / 2,
      cy: (top + bottom) / 2,
      r: Math.max(50, Math.min(w * 0.44, gap * 0.46))
    };
  }
  function requestMeasure() {
    measure();
    if (D.measureRaf) cancelAnimationFrame(D.measureRaf);
    D.measureRaf = requestAnimationFrame(function () {
      D.measureRaf = 0;
      measure();
    });
  }

  /* ---------------- 自转与状态插值 ---------------- */
  function updateRot(t) {
    if (D.reduced) { D.lastT = t; return; }
    var dt = D.lastT ? clamp(t - D.lastT, 0, 64) : 16.7;
    D.lastT = t;
    if (D.tween) {
      var tw = D.tween, k = (t - tw.t0) / TWEEN_MS;
      if (k >= 1) {
        D.rot.l = tw.toL; D.rot.p = tw.toP; D.tween = null;
      } else {
        if (k < 0) k = 0;
        var e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        D.rot.l = tw.fromL + (tw.toL - tw.fromL) * e;
        D.rot.p = tw.fromP + (tw.toP - tw.fromP) * e;
      }
    } else {
      D.rot.l += SPIN * (dt / 16.667);
      if (D.rot.l > 180) D.rot.l -= 360;
      else if (D.rot.l < -180) D.rot.l += 360;
    }
  }

  /* ---------------- Canvas 绘制（每帧） ---------------- */
  function drawLandDots(inv) {
    var ctx = D.ctx, proj = D.projection, pts = D.dots;
    ctx.fillStyle = C.inkLo;
    for (var i = 0; i < pts.length; i++) {
      var gd = d3.geoDistance(pts[i], inv);
      if (gd > HALF_PI) continue;                    // 只画可见半球
      var p = proj(pts[i]);
      ctx.globalAlpha = 0.2 + 0.48 * Math.cos(gd);   // 边缘渐隐
      ctx.fillRect(p[0] - 0.75, p[1] - 0.75, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;
  }

  function drawNodes(t, inv, path) {
    var st = D.state;
    if (!st) return;
    var nodes = Object.prototype.toString.call(st.nodes) === '[object Array]' ? st.nodes : [];
    var ctx = D.ctx, proj = D.projection, i;
    // 节点之间的细弧线（geoPath + clipAngle(90) 自动裁剪背面）
    if (nodes.length > 1) {
      ctx.beginPath();
      for (i = 0; i < nodes.length - 1; i++) {
        var a = nodes[i], b = nodes[i + 1];
        if (!isFinite(+a.lon) || !isFinite(+a.lat) || !isFinite(+b.lon) || !isFinite(+b.lat)) continue;
        path({ type: 'LineString', coordinates: [[+a.lon, +a.lat], [+b.lon, +b.lat]] });
      }
      ctx.strokeStyle = 'rgba(34,81,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    D.nodePts = [];
    var placed = [];   // 已放置的中文名标注盒，用于简单防重叠
    ctx.font = '11px "et-book","Songti SC","Noto Serif CJK SC",serif';
    for (i = 0; i < nodes.length; i++) {
      var n = nodes[i], lon = +n.lon, lat = +n.lat;
      if (!isFinite(lon) || !isFinite(lat)) continue;
      var gd = d3.geoDistance([lon, lat], inv);
      var vis = gd <= HALF_PI + 0.03;
      var p = vis ? proj([lon, lat]) : null;
      var rec = { n: n, vis: vis, x: p ? p[0] : 0, y: p ? p[1] : 0 };
      D.nodePts.push(rec);
      if (!vis) continue;
      var fade = gd > HALF_PI - 0.25 ? Math.max(0, (HALF_PI + 0.03 - gd) / 0.28) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      // 脉冲环
      ctx.beginPath();
      if (D.reduced) {
        ctx.arc(rec.x, rec.y, 7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34,81,255,0.3)';
      } else {
        var ph = ((t / 1700) + i * 0.37) % 1;
        ctx.arc(rec.x, rec.y, 4 + ph * 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(34,81,255,' + (0.45 * (1 - ph)).toFixed(3) + ')';
      }
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 节点圆点
      ctx.beginPath();
      ctx.arc(rec.x, rec.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = C.blue;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // 名称标注（简单防重叠：默认右上，冲突时改右下）
      var name = String(n.name || '');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var tw = ctx.measureText(name).width;
      var lx = rec.x + 8, ly = rec.y - 7, j, hit;
      for (j = 0; j < placed.length; j++) {
        hit = Math.abs(placed[j].x - lx) < (placed[j].w + tw) / 2 + 6 &&
              Math.abs(placed[j].y - ly) < 12;
        if (hit) { ly = rec.y + 10; break; }
      }
      placed.push({ x: lx + tw / 2, y: ly, w: tw });
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeText(name, lx, ly);
      ctx.fillStyle = C.ink;
      ctx.fillText(name, lx, ly);
      ctx.restore();
    }
  }

  function draw(t) {
    if (!D.ctx || !D.projection) return;
    if (D.w < 8 || D.h < 8) return;   // ≤1180px 时 rail display:none，跳过绘制
    updateRot(t);
    var ctx = D.ctx, proj = D.projection;
    proj.rotate([D.rot.l, D.rot.p]).translate([D.geo.cx, D.geo.cy]).scale(D.geo.r);
    var path = d3.geoPath(proj, ctx);
    ctx.clearRect(0, 0, D.w, D.h);
    // 球体轮廓
    ctx.beginPath();
    path({ type: 'Sphere' });
    ctx.fillStyle = 'rgba(247,249,252,0.55)';
    ctx.fill();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.stroke();
    var inv = [-D.rot.l, -D.rot.p];
    if (D.landState === 'ok' && D.dots) {
      drawLandDots(inv);
    } else if (D.landState === 'fail') {
      // 降级：经纬网格球
      if (!D.grat) D.grat = d3.geoGraticule10();
      ctx.beginPath();
      path(D.grat);
      ctx.strokeStyle = C.line;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    drawNodes(t || 0, inv, path);
  }

  function drawOnce() {
    D.lastT = 0;
    draw(now());
  }

  /* ---------------- 命中检测：hover → tooltip，click → drill ---------------- */
  function nodeAt(x, y) {
    var best = null, bd = HIT_R * HIT_R;
    for (var i = 0; i < D.nodePts.length; i++) {
      var np = D.nodePts[i];
      if (!np.vis) continue;
      var dx = np.x - x, dy = np.y - y, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = np; }
    }
    return best;
  }
  function hideTip() {
    if (D.tipShown && window.Utils && Utils.tooltip) Utils.tooltip.hide();
    D.tipShown = false;
    D.hoverNode = null;
  }
  function onMove(e) {
    if (!D.canvas) return;
    var r = D.canvas.getBoundingClientRect();
    var np = nodeAt(e.clientX - r.left, e.clientY - r.top);
    D.rail.style.cursor = np ? 'pointer' : '';
    if (!np) { hideTip(); return; }
    if (window.Utils && Utils.tooltip) {
      var html = '<strong>' + escA(np.n.name || '节点') + '</strong>' +
        (np.n.note ? '<br>' + escA(np.n.note) : '');
      if (D.hoverNode !== np.n) {
        Utils.tooltip.show(html, e.clientX, e.clientY);
        D.hoverNode = np.n;
      } else if (typeof Utils.tooltip.move === 'function') {
        Utils.tooltip.move(e.clientX, e.clientY);
      }
      D.tipShown = true;
    }
  }
  function onLeave() {
    if (D.rail) D.rail.style.cursor = '';
    hideTip();
  }
  function onClick(e) {
    if (!D.canvas) return;
    var r = D.canvas.getBoundingClientRect();
    var np = nodeAt(e.clientX - r.left, e.clientY - r.top);
    if (!np || !(window.Utils && Utils.drill && typeof Utils.drill.open === 'function')) return;
    var n = np.n;
    var payload = {
      title: String(n.name || '节点'),
      body: String(n.note || '暂无说明'),
      source: n.source || '',
      date: n.date || ''
    };
    if (n.drill && typeof n.drill === 'object') {
      for (var k in n.drill) payload[k] = n.drill[k];
      if (!payload.title) payload.title = String(n.name || '节点');
    }
    Utils.drill.open(payload);
  }

  /* ---------------- rAF 循环与生命周期 ---------------- */
  function startLoop() {
    if (D.raf || D.reduced || document.hidden) return;
    D.lastT = 0;
    D.raf = requestAnimationFrame(tick);
  }
  function stopLoop() {
    if (D.raf) cancelAnimationFrame(D.raf);
    D.raf = 0;
  }
  function tick(t) {
    D.raf = 0;
    if (D.reduced || document.hidden) return;
    draw(t);
    D.raf = requestAnimationFrame(tick);
  }
  function onVis() {
    if (document.hidden) { stopLoop(); hideTip(); }
    else if (D.reduced) drawOnce();
    else startLoop();
  }
  function onMq() {
    D.reduced = !!(D.mq && D.mq.matches);
    if (D.reduced) {
      stopLoop();
      if (D.tween) {
        D.rot.l = normLon(D.tween.toL);
        D.rot.p = D.tween.toP;
        D.tween = null;
      }
      requestMeasure();
      drawOnce();
    } else {
      startLoop();
    }
  }
  function onResize() {
    if (D.resizing) return;
    D.resizing = true;
    requestAnimationFrame(function () {
      D.resizing = false;
      var f = fitCanvasInto(D.canvas);
      D.ctx = f.ctx; D.w = f.w; D.h = f.h;
      requestMeasure();
      if (D.reduced) drawOnce();
    });
  }

  /* ---------------- 对外 API ---------------- */
  function setState(key) {
    if (key == null || key === '') return;
    key = String(key);
    if (!D.inited) { D.pendingKey = key; return; }
    if (key === D.key && D.built) return;
    var st = getState(key);
    D.key = key;
    D.state = st;
    // 目标 rotate：使 center 城市转到正面中心（最短路径插值）
    var c = (Object.prototype.toString.call(st.center) === '[object Array]' && st.center.length >= 2)
      ? st.center : [0, 20];
    var toP = clamp(-(+c[1] || 0), -55, 55);
    var toL = D.rot.l + shortestDelta(D.rot.l, -(+c[0] || 0));
    if (!D.rotSet || D.reduced) {
      D.rot.l = normLon(toL);
      D.rot.p = toP;
      D.tween = null;
      D.rotSet = true;
    } else {
      D.tween = { t0: now(), fromL: D.rot.l, fromP: D.rot.p, toL: toL, toP: toP };
    }
    buildHTML(st, key);
    D.built = true;
    requestMeasure();
    var names = (isArr(st.nodes) ? st.nodes : []).map(function (n) { return n && n.name; }).filter(Boolean);
    D.canvas.setAttribute('aria-label',
      '正射投影点阵地球：' + (st.title || key) + (names.length ? '；节点：' + names.join('、') : ''));
    hideTip();
    if (D.reduced) drawOnce();
  }

  function init() {
    if (D.inited) return;                                    // 幂等
    var rail = document.getElementById('dash-rail');
    var canvas = document.getElementById('dash-canvas');
    var root = document.getElementById('dash-html');
    if (!rail || !canvas || !root) {
      console.warn('[dashboard] 缺少 #dash-rail / #dash-canvas / #dash-html，初始化跳过。');
      return;
    }
    if (typeof d3 === 'undefined') {
      console.warn('[dashboard] d3 未加载，初始化跳过。');
      return;
    }
    D.inited = true;
    D.rail = rail;
    D.canvas = canvas;
    D.root = root;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', '正射投影点阵地球');
    var f = fitCanvasInto(canvas);
    D.ctx = f.ctx; D.w = f.w; D.h = f.h;
    D.projection = d3.geoOrthographic().clipAngle(90);
    if (window.matchMedia) {
      D.mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      D.reduced = !!D.mq.matches;
      if (typeof D.mq.addEventListener === 'function') D.mq.addEventListener('change', onMq);
      else if (typeof D.mq.addListener === 'function') D.mq.addListener(onMq);
    }
    // 监听挂在 #dash-rail：HTML 层 pointer-events:none 时事件冒泡至此，且不重复注册
    rail.addEventListener('mousemove', onMove);
    rail.addEventListener('mouseleave', onLeave);
    rail.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        requestMeasure();
        if (D.reduced) drawOnce();
      });
    }
    loadLand().then(function () {
      if (D.reduced) drawOnce();                             // 陆地就绪后补一帧
    });
    setState(D.pendingKey || 'frame');
    startLoop();
    if (D.reduced) drawOnce();
  }

  window.Dashboard = { init: init, setState: setState };

  // 兜底启动：按 SPEC §5 应由 main.js 调用 Dashboard.init()；
  // 若其未调用，此处 DOM 就绪后自动初始化（init 幂等，重复调用无副作用）。
  function autoInit() { if (!D.inited) init(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit, { once: true });
  } else {
    setTimeout(autoInit, 0);
  }
})();
