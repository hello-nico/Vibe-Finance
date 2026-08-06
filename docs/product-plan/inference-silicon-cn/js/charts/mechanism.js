/* js/charts/mechanism.js — 周期机制图（五阶段周期波形）
 * 注册：window.Charts['mechanism'] = function(frame){}，渲染进 frame.querySelector('.chart-body')
 * 数据：window.CHART_DATA['mechanism'] = {stages:[{id,label,amp,desc}],annotations,loop:{from,to,text},note}
 *
 * 英文原版 js/charts/mechanism.js 整图移植（清单 §37）：
 *  · 一条连续波形贯穿五站（需求点火 → 产能假设失效 → 恐慌性重复下单 → 大块产能到达 → 出清），
 *    振幅 morph 1.0 → 1.6 → 2.6 → 4.0 → 4.0，描边渐变为 蓝 #2251ff → 铜 #b07a10 → 红 #c22f4e → 墨色破裂段；
 *  · dashed 包络线跟随 ampAt 全段（含出清下潜段）；0.32 反射 ghost 副波；
 *  · 反馈环在图表上方：出清 → 需求的大跨虚线 Bézier + 顶部居中 mono 标签（白 halo），
 *    环 hover 变蓝、可点击弹 drill；
 *  · rAF 相位动画（prefers-reduced-motion 时单帧静态）；
 *  · 基线圆点 + 骑波菱形节点；阶段标签放波形下方两条错行车道、按局部波极值避让；
 *  · 「放大 →」「断裂 ↓」标注；主体固定 460px。
 * 交互：hover 命中阶段/反馈环 → Utils.tooltip；click → Utils.drill.open。
 * Canvas DPR：Utils.fitCanvas（绝不把 canvas.style.width 设为像素值）。
 * 幂等；debounced ResizeObserver 重绘。
 */
(function () {
'use strict';
window.Charts = window.Charts || {};

var MONO = 'Menlo, Consolas, "SF Mono", "PingFang SC", monospace';
var C = {
  blue: '#2251ff', blueHi: '#1233b8', blueLo: '#7d9bff',
  copper: '#b07a10', neg: '#c22f4e',
  ink: '#051c2c', inkMd: '#42566a', inkLo: '#8595a6',
  line: '#dbe2ea', lineLo: '#eef1f6', paper: '#ffffff'
};
var CSS_H = 460;                       /* 固定图高（清单 §37）          */
var AMPS_FALLBACK = [1.0, 1.6, 2.6, 4.0, 4.0];
var CYCLES = [1.15, 1.45, 1.75, 1.35]; /* 每站之间的波形周期数          */
var BUST_AMP = 1.1;                    /* 断裂后残留的振荡幅度          */

/* ---------------- 兜底数据（用户 §12 原文五阶段） ---------------- */
var FB_STAGES = [
  { label: '需求点火', amp: 1.0,
    desc: '真实需求突然加速，订单首次超过既有产能规划。历史对应：1995 年光通信、2023 年生成式 AI。点火阶段的信号是真实需求，而非账面订单。' },
  { label: '产能假设失效', amp: 1.6,
    desc: '既有扩产假设被证伪：交期拉长、配额出现、价格信号失灵。客户意识到线性外推的产能规划无法覆盖需求，市场开始按「拿不到货」定价。' },
  { label: '恐慌性重复下单', amp: 2.6,
    desc: '客户为锁定产能重复、超额下单，账面需求被显著放大（放大 →）。2000–2001 年电信周期与 2020–2022 年短缺周期均出现不可取消订单与重复下单。' },
  { label: '大块产能到达', amp: 4.0,
    desc: '产能到达滞后需求 9–12 个月：恐慌期锁定的大额产能集中落地时，需求往往已经降温。振幅达到 ×4.0，供需缺口在最宽处反转。' },
  { label: '出清', amp: 4.0,
    desc: '库存与产能出清（断裂 ↓）：订单取消扩散、资产减记、公司易主。四十二年间行业以并购与出售完成出清——0 家龙头破产。研发穿越低谷，下一代技术底座（300mm → EUV → HBM/CoWoS）再次点火。' }
];
var FB_LOOP = '研发穿越低谷 → 下一代技术底座（300mm → EUV → HBM/CoWoS）→ 再次点火';
var FB_AMP_NOTE = '放大 →';
var FB_BREAK_NOTE = '断裂 ↓';

/* ---------------- 小工具 ---------------- */
function debounce(fn, ms) {
  var t = null;
  return function () {
    var a = arguments, s = this;
    if (t) clearTimeout(t);
    t = setTimeout(function () { t = null; fn.apply(s, a); }, ms);
  };
}
function hexA(hex, a) {
  var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function lerpHex(h1, h2, f) {
  var r1 = parseInt(h1.slice(1, 3), 16), g1 = parseInt(h1.slice(3, 5), 16), b1 = parseInt(h1.slice(5, 7), 16);
  var r2 = parseInt(h2.slice(1, 3), 16), g2 = parseInt(h2.slice(3, 5), 16), b2 = parseInt(h2.slice(5, 7), 16);
  function m(a, b) { return Math.round(a + (b - a) * f); }
  return 'rgb(' + m(r1, r2) + ',' + m(g1, g2) + ',' + m(b1, b2) + ')';
}
/* 波形沿程颜色：蓝 → 铜 → 红（峰）→ 墨色（破裂段） */
function waveColor(t, n) {             /* t 以站为单位，0 .. n-1        */
  var peak = n - 2;                    /* 峰在倒数第二站（大块产能到达） */
  if (t >= peak) return lerpHex(C.neg, C.inkMd, Math.min(1, (t - peak) / (n - 1 - peak)));
  var half = peak * 0.5;
  if (t <= half) return lerpHex(C.blue, C.copper, t / half);
  return lerpHex(C.copper, C.neg, (t - half) / (peak - half));
}
function smoothstep(f) { return f * f * (3 - 2 * f); }

/* ---------------- 本站 Utils 桥接 ---------------- */
function tipShow(html, x, y) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, x, y); }
function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
function drillOpen(opts) { if (window.Utils && Utils.drill && opts) Utils.drill.open(opts); }
function reducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
/* DPR 适配：优先 Utils.fitCanvas；兜底绝不把 style.width 设为像素值 */
function fit(canvas) {
  if (window.Utils && typeof Utils.fitCanvas === 'function') return Utils.fitCanvas(canvas);
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var rect = canvas.getBoundingClientRect();
  var w = rect.width || canvas.clientWidth || 772, h = rect.height || CSS_H;
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.width = '100%'; canvas.style.height = '100%';
  var ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: w, h: h };
}

/* ---------------- 数据适配：CHART_DATA → 原版 data 形状 ---------------- */
function buildData() {
  var D = (window.CHART_DATA && window.CHART_DATA.mechanism) || {};
  var raw = (Array.isArray(D.stages) && D.stages.length === 5) ? D.stages : null;
  var stages = FB_STAGES.map(function (fb, i) {
    var s = raw ? raw[i] : null;
    return {
      order: i + 1,
      name: (s && (s.label || s.name)) || fb.label,
      amp: (s && isFinite(+s.amp) && +s.amp > 0) ? +s.amp : fb.amp,
      desc: (s && (s.desc || s.body || s.tip)) || fb.desc
    };
  });
  var ampNote = FB_AMP_NOTE, breakNote = FB_BREAK_NOTE;
  if (Array.isArray(D.annotations)) {
    D.annotations.forEach(function (a) {
      if (!a || !a.text) return;
      if (a.text.indexOf('放大') >= 0) ampNote = a.text;
      if (a.text.indexOf('断裂') >= 0) breakNote = a.text;
    });
  }
  return {
    stages: stages,
    meta: {
      feedbackLabel: (D.loop && D.loop.text) || D.loopText || FB_LOOP,
      ampNote: ampNote,
      breakNote: breakNote,
      note: D.note || ''
    }
  };
}

/* ---------------- 图表主体（原版 render 移植） ---------------- */
function render(container, data) {
  if (!container) return;
  var reduced = reducedMotion();

  /* 幂等：拆除上一次渲染 */
  var st = container.__mech;
  if (st) {
    if (st.ro) st.ro.disconnect();
    if (st.raf) cancelAnimationFrame(st.raf);
  }
  st = container.__mech = { ro: null, raf: 0, w: 0 };
  container.innerHTML = '';

  var stages = data && Array.isArray(data.stages) ? data.stages.filter(Boolean) : [];
  var meta = data && data.meta ? data.meta : {};
  var fbLabel = meta.feedbackLabel || FB_LOOP;
  var ampNote = meta.ampNote || FB_AMP_NOTE;
  var breakNote = meta.breakNote || FB_BREAK_NOTE;
  if (stages.length < 2 || !container.isConnected) return;
  stages.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

  var W = Math.max(280, container.clientWidth || 280);
  st.w = W;
  var H = CSS_H;

  container.style.height = H + 'px';
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:100%;height:' + H + 'px';
  var canvas = document.createElement('canvas');
  /* 百分比尺寸（严禁像素值）：canvas 是替换元素，不预设宽度时首帧
     getBoundingClientRect 会读到固有宽度 300，必须先行声明 100% */
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.display = 'block';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '周期机制图：一条波形穿过五个阶段——' +
    stages.map(function (s) { return s.name; }).join('、') +
    '——最终向下断裂为出清曲线，并有反馈环回到需求点火。');
  wrap.appendChild(canvas);
  container.appendChild(wrap);

  /* ---- 几何 ---------------------------------------------------------- */
  var n = stages.length;
  var amps = stages.map(function (s, i) {
    var a = +s.amp;
    return isFinite(a) && a > 0 ? a : (AMPS_FALLBACK[i] || 1);
  });
  var padL = 30, padR = 30;
  var stageW = (W - padL - padR) / (n - 1);
  var sx = stages.map(function (_, i) { return padL + i * stageW; });
  var midY = 252;
  var crestI = n - 2;                  /* 大块产能到达承载波峰           */
  var bustDepth = 62;

  /* 反馈环标签按宽度折行；弧顶在标签下方 */
  var meas = document.createElement('canvas').getContext('2d');
  var FB_FS = 9, FB_LH = 12;
  if (meas) meas.font = FB_FS + 'px ' + MONO;
  function textW(s) { return meas ? meas.measureText(s).width : s.length * FB_FS * 0.602; }
  /* CJK 感知折行：英文按词、中文按字，空格可断行 */
  function wrapText(text, maxW) {
    var units = [];
    String(text).split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { units.push(' '); return; }
      var buf = '';
      for (var i = 0; i < part.length; i++) {
        var ch = part.charAt(i);
        if (/[⺀-鿿豈-﫿　-〿＀-￯]/.test(ch)) {
          if (buf) { units.push(buf); buf = ''; }
          units.push(ch);
        } else buf += ch;
      }
      if (buf) units.push(buf);
    });
    var lines = [], cur = '';
    units.forEach(function (u) {
      if (u === ' ') {
        if (cur && cur.charAt(cur.length - 1) !== ' ') cur += ' ';
        return;
      }
      var t = cur ? cur + u : u;
      if (cur && textW(t) > maxW) { lines.push(cur.replace(/\s+$/, '')); cur = u; }
      else cur = t;
    });
    if (cur) lines.push(cur.replace(/\s+$/, ''));
    return lines.slice(0, 3);
  }
  var fbLines = wrapText(fbLabel, W - 32);
  var labelTopY = 16;
  var apexY = labelTopY + fbLines.length * FB_LH + 12;

  var baseAmp = Math.max(26, Math.min(38, (midY - apexY - 50) / amps[crestI]));

  /* 振幅 morph 1.0→1.6→2.6→4.0，断裂后衰减到 BUST_AMP */
  function ampAt(t) {
    var tt = Math.max(0, Math.min(n - 1, t));
    var i0 = Math.min(n - 1, Math.floor(tt)), i1 = Math.min(n - 1, i0 + 1);
    var a = amps[i0] + (amps[i1] - amps[i0]) * smoothstep(tt - i0);
    if (tt > crestI) {
      var f = Math.min(1, (tt - crestI) / (n - 1 - crestI));
      a = amps[crestI] + (BUST_AMP - amps[crestI]) * smoothstep(f);
    }
    return a;
  }
  /* 破裂曲线：峰后均值线下潜到基线以下 */
  function dropAt(t) {
    if (t <= crestI) return 0;
    return bustDepth * smoothstep(Math.min(1, (t - crestI) / (n - 1 - crestI)));
  }
  /* 连续相位：站与站之间积分局部波数 */
  function thetaAt(t) {
    var th = 0, k;
    for (k = 0; k < Math.floor(t) && k < CYCLES.length; k++) th += CYCLES[k];
    if (t > 0 && k < CYCLES.length) th += CYCLES[k] * (t - Math.floor(t));
    return th * Math.PI * 2;
  }
  function waveY(x, phase) {
    var t = (x - padL) / stageW;
    var fade = Math.min(1, x / 22, (W - x) / 22);
    return midY + dropAt(t) - ampAt(t) * baseAmp * fade * Math.sin(thetaAt(Math.max(0, t)) + phase);
  }

  /* 反馈环几何（顶部大跨虚线 Bézier）：出清 → 需求点火。
     弧从出清站已平息的破裂波上方出发，横扫整图顶部，落回需求站上方。 */
  var fbStart = { x: sx[n - 1], y: midY + bustDepth - BUST_AMP * baseAmp - 18 };
  var fbEnd = { x: sx[0], y: midY - amps[0] * baseAmp - 26 };
  var fbC1 = { x: sx[n - 1], y: apexY - 24 };
  var fbC2 = { x: sx[0], y: apexY - 24 };
  var fbPts = [];
  for (var pi = 0; pi <= 72; pi++) {
    var u = pi / 72, iu = 1 - u;
    fbPts.push({
      x: iu * iu * iu * fbStart.x + 3 * iu * iu * u * fbC1.x + 3 * iu * u * u * fbC2.x + u * u * u * fbEnd.x,
      y: iu * iu * iu * fbStart.y + 3 * iu * iu * u * fbC1.y + 3 * iu * u * u * fbC2.y + u * u * u * fbEnd.y
    });
  }
  var fbLabelBox = { x0: 0, y0: 0, x1: 0, y1: 0 };

  var hit = { stage: -1, fb: false };

  /* ---- 绘制 ---------------------------------------------------------- */
  function draw(phase) {
    var env = fit(canvas);
    var g = env.ctx;
    if (!g) return;
    g.clearRect(0, 0, W, H);
    g.lineJoin = 'round';
    g.lineCap = 'round';

    function halo(text, x, y) {
      g.lineWidth = 3;
      g.strokeStyle = 'rgba(255,255,255,0.92)';
      g.strokeText(text, x, y);
    }

    /* 细基线 */
    g.beginPath();
    g.moveTo(0, midY + 0.5);
    g.lineTo(W, midY + 0.5);
    g.strokeStyle = C.line;
    g.lineWidth = 1;
    g.stroke();

    /* dashed 包络线：跟随 ampAt 全段（含下潜段） */
    [1, -1].forEach(function (side) {
      g.beginPath();
      for (var x = 0; x <= W; x += 3) {
        var t = Math.max(0, (x - padL) / stageW);
        var fade = Math.min(1, x / 22, (W - x) / 22);
        var y = midY + dropAt(t) - side * ampAt(t) * baseAmp * fade;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.setLineDash([3, 4]);
      g.strokeStyle = hexA(C.inkLo, 0.55);
      g.lineWidth = 1;
      g.stroke();
      g.setLineDash([]);
    });

    /* 0.32 反射 ghost 副波——绘图仪质感 */
    g.beginPath();
    for (var gx = 0; gx <= W; gx += 2) {
      var gt = Math.max(0, (gx - padL) / stageW);
      var gy = midY + dropAt(gt) - (midY + dropAt(gt) - waveY(gx, phase)) * 0.32;
      if (gx === 0) g.moveTo(gx, gy); else g.lineTo(gx, gy);
    }
    g.globalAlpha = 0.4;
    g.strokeStyle = C.blueLo;
    g.lineWidth = 0.75;
    g.stroke();
    g.globalAlpha = 1;

    /* 主波形——描边渐变：蓝 → 铜 → 红 → 墨色破裂段 */
    var grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, C.blue);
    grad.addColorStop(Math.max(0.01, Math.min(0.99, (padL + (crestI * 0.5) * stageW) / W)), C.copper);
    grad.addColorStop(Math.max(0.01, Math.min(0.99, sx[crestI] / W)), C.neg);
    grad.addColorStop(1, C.inkMd);
    g.beginPath();
    for (var wx = 0; wx <= W; wx += 2) {
      var wy = waveY(wx, phase);
      if (wx === 0) g.moveTo(wx, wy); else g.lineTo(wx, wy);
    }
    g.strokeStyle = grad;
    g.lineWidth = 1.8;
    g.stroke();

    /* 标注：上升沿「放大 →」，下潜处「断裂 ↓」 */
    g.font = '9px ' + MONO;
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    var ampX = padL + stageW * 1.5, ampY = midY - ampAt(1.5) * baseAmp - 12;
    halo(ampNote, ampX, ampY);
    g.fillStyle = C.copper;
    g.fillText(ampNote, ampX, ampY);
    var brkX = sx[crestI] + stageW * 0.44, brkY = midY + 34;
    halo(breakNote, brkX, brkY);
    g.fillStyle = C.neg;
    g.fillText(breakNote, brkX, brkY);

    /* 反馈环——大跨虚线 Bézier，出清 → 需求点火 */
    g.beginPath();
    g.moveTo(fbPts[0].x, fbPts[0].y);
    for (var fi = 1; fi < fbPts.length; fi++) g.lineTo(fbPts[fi].x, fbPts[fi].y);
    g.setLineDash([5, 5]);
    g.strokeStyle = hit.fb ? C.blue : C.inkLo;
    g.lineWidth = hit.fb ? 1.6 : 1.1;
    g.stroke();
    g.setLineDash([]);
    /* 指向需求的箭头 */
    g.beginPath();
    g.moveTo(fbEnd.x, fbEnd.y + 7);
    g.lineTo(fbEnd.x - 4.5, fbEnd.y - 2);
    g.lineTo(fbEnd.x + 4.5, fbEnd.y - 2);
    g.closePath();
    g.fillStyle = hit.fb ? C.blue : C.inkLo;
    g.fill();
    /* 顶部居中 mono 标签（白 halo） */
    g.font = FB_FS + 'px ' + MONO;
    var fbMaxW = 0;
    fbLines.forEach(function (ln, li) {
      var ly = labelTopY + li * FB_LH;
      halo(ln, W / 2, ly);
      g.fillStyle = hit.fb ? C.blue : C.inkLo;
      g.fillText(ln, W / 2, ly);
      fbMaxW = Math.max(fbMaxW, textW(ln));
    });
    fbLabelBox = {
      x0: W / 2 - fbMaxW / 2 - 8, y0: labelTopY - FB_FS - 4,
      x1: W / 2 + fbMaxW / 2 + 8, y1: labelTopY + (fbLines.length - 1) * FB_LH + 4
    };

    /* 基线圆点 */
    stages.forEach(function (s, i) {
      var hot = hit.stage === i;
      g.beginPath();
      g.arc(sx[i], midY, hot ? 4.5 : 3, 0, Math.PI * 2);
      g.fillStyle = hot ? C.blue : C.paper;
      g.fill();
      g.strokeStyle = hot ? C.blue : waveColor(i, n);
      g.lineWidth = 1.4;
      g.stroke();
    });

    /* 骑波菱形节点 */
    stages.forEach(function (s, i) {
      var y = waveY(sx[i], phase);
      var hot = hit.stage === i;
      var d = hot ? 6.5 : 5;
      g.beginPath();
      g.moveTo(sx[i], y - d);
      g.lineTo(sx[i] + d, y);
      g.lineTo(sx[i], y + d);
      g.lineTo(sx[i] - d, y);
      g.closePath();
      g.fillStyle = hot ? waveColor(i, n) : C.paper;
      g.fill();
      g.strokeStyle = hot ? C.blue : waveColor(i, n);
      g.lineWidth = 1.5;
      g.stroke();
    });

    /* 阶段标签——mono，折行，置于波形下方两条错行车道；
       每个标签都塞到其横跨范围内波形+包络的局部最低点之下，
       保证波形绝不压字；被下推的标签用点状引线连回基线圆点 */
    g.font = '9px ' + MONO;
    var laneW = Math.min(2 * stageW - 12, 340);
    stages.forEach(function (s, i) {
      var hot = hit.stage === i;
      var name = (i + 1) + ' · ' + String(s.name || '');
      var lines = wrapText(name, laneW);
      var w = 0;
      lines.forEach(function (ln) { w = Math.max(w, textW(ln)); });
      var lx = Math.max(4 + w / 2, Math.min(sx[i], W - 4 - w / 2));
      /* 标签横跨范围内波形+包络的局部下沿 */
      var envMax = midY;
      for (var k = -6; k <= 6; k++) {
        var xx = lx + (k / 6) * (w / 2);
        var tt = Math.max(0, (xx - padL) / stageW);
        var fd = Math.min(1, xx / 22, (W - xx) / 22);
        var ext = midY + dropAt(tt) + ampAt(tt) * baseAmp * fd;
        if (ext > envMax) envMax = ext;
      }
      var laneY = midY + 24 + (i % 2) * 18;
      var ly = Math.min(H - 8 - (lines.length - 1) * 11, Math.max(laneY, envMax + 16));
      /* 被下推的标签：点状引线连回基线圆点 */
      if (ly > midY + 46) {
        g.beginPath();
        g.moveTo(sx[i] + 0.5, midY + 8);
        g.lineTo(sx[i] + 0.5, ly - 13);
        g.setLineDash([1.5, 3]);
        g.strokeStyle = C.line;
        g.lineWidth = 1;
        g.stroke();
        g.setLineDash([]);
      }
      lines.forEach(function (ln, li) {
        halo(ln, lx, ly + li * 11);
        g.fillStyle = hot ? C.blue : C.inkMd;
        g.fillText(ln, lx, ly + li * 11);
      });
    });
  }

  /* ---- 命中测试 ------------------------------------------------------- */
  function locate(mx, my) {
    if (mx >= fbLabelBox.x0 && mx <= fbLabelBox.x1 && my >= fbLabelBox.y0 && my <= fbLabelBox.y1) {
      return { stage: -1, fb: true };
    }
    var bd = Infinity;
    for (var i = 0; i < fbPts.length; i++) {
      var dx = mx - fbPts[i].x, dy = my - fbPts[i].y;
      var d2 = dx * dx + dy * dy;
      if (d2 < bd) bd = d2;
    }
    if (bd < 81) return { stage: -1, fb: true };   /* 弧 9px 以内 */
    var best = -1, bdx = Infinity;
    for (var si = 0; si < n; si++) {
      var d = Math.abs(mx - sx[si]);
      if (d < bdx) { bdx = d; best = si; }
    }
    if (bdx <= stageW / 2 && my > apexY + 4) return { stage: best, fb: false };
    return { stage: -1, fb: false };
  }

  function redrawStatic() { draw(phase); }

  canvas.addEventListener('mousemove', function (ev) {
    var r = canvas.getBoundingClientRect();
    var h = locate(ev.clientX - r.left, ev.clientY - r.top);
    var changed = h.stage !== hit.stage || h.fb !== hit.fb;
    hit = h;
    canvas.style.cursor = (h.stage >= 0 || h.fb) ? 'pointer' : 'default';
    if (h.fb) {
      tipShow('<b>闭环——反馈到下一周期</b><br>' + fbLabel, ev.clientX, ev.clientY);
    } else if (h.stage >= 0) {
      var s = stages[h.stage];
      tipShow('<b>阶段 ' + (h.stage + 1) + ' · ' + s.name +
        '（振幅 ×' + (+amps[h.stage]).toFixed(1) + '）</b><br>' +
        '<span style="display:inline-block;max-width:260px">' + (s.desc || '') + '</span>',
        ev.clientX, ev.clientY);
    } else {
      tipHide();
    }
    if (changed && reduced) redrawStatic(); /* 动画模式下一帧自会重绘 */
  });
  canvas.addEventListener('mouseleave', function () {
    hit = { stage: -1, fb: false };
    canvas.style.cursor = 'default';
    tipHide();
    if (reduced) redrawStatic();
  });
  canvas.addEventListener('click', function (ev) {
    var r = canvas.getBoundingClientRect();
    var h = locate(ev.clientX - r.left, ev.clientY - r.top);
    if (h.fb) {
      drillOpen({
        title: '闭环：研发穿越低谷，再次点火',
        body: fbLabel + '<br><br>出清不是终点：研发投资穿越低谷期，下一代技术底座' +
          '（300mm → EUV → HBM/CoWoS）在出清段就位，为下一轮需求点火。' +
          '四十二年间行业以并购与出售完成出清——0 家龙头破产。',
        source: '研究综合 · 周期机制重建',
        date: '2026-07'
      });
      return;
    }
    if (h.stage >= 0) {
      var s = stages[h.stage];
      drillOpen({
        title: '阶段 ' + (h.stage + 1) + ' · ' + s.name,
        body: (s.desc || '') + (h.stage === n - 1 ? '<br><br>' + fbLabel : ''),
        source: '研究综合 · 周期机制重建',
        date: '2026-07'
      });
    }
  });

  /* ---- 动画（reduced-motion 下单帧静态） ------------------------------- */
  var phase = 0;
  if (reduced) {
    draw(0);
  } else {
    var last = 0;
    var loop = function (ts) {
      if (!canvas.isConnected) { st.raf = 0; return; }   /* 自清理 */
      st.raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (ts - last < 33) return;                        /* ~30fps 足够 */
      last = ts;
      phase += 0.03;
      draw(phase);
    };
    st.raf = requestAnimationFrame(loop);
  }

  /* ---- 响应式重绘（防抖） --------------------------------------------- */
  if ('ResizeObserver' in window) {
    var rerender = debounce(function () {
      var w = container.clientWidth || 0;
      if (Math.abs(w - st.w) < 2 || !container.isConnected) return;
      render(container, data);
    }, 140);
    st.ro = new ResizeObserver(rerender);
    st.ro.observe(container);
  }
}

/* ---------------- 注册 ---------------- */
window.Charts['mechanism'] = function (frame) {
  var body = frame.querySelector('.chart-body');
  if (!body) return;
  render(body, buildData());
};
})();
