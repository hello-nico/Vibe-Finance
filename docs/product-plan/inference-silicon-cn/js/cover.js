/* cover.js — 封面模式 A「递归」（移植自英文原版 COVER ENGINE A · RECURSION）
 * 密集芯片/模块小格矩阵锚定在封面中右部（≈68% 宽、≈45% 高）：
 * 确定性种子的递归矩形细分（近锚点四分、远处单分），叶子格偶发点阵填充；
 * 边缘 alpha 向外渐隐；buildMask 实测文字净空场（getBoundingClientRect +
 * measureText 墨迹宽度）保证左侧文字列（kicker → 模式切换）在任何断点下
 * 都无图形侵入。<720px 时锚点落入 #cover-mode 之下的净空条带并减淡。
 * 调色：#2251ff 低 alpha + #dbe2ea 发丝线；填充 alpha ≤0.18。
 *
 * 契约：window.CoverModes['a'] = { start(canvas), stop() }
 * DPR 每次重建重读；离屏/隐藏/停止时 rAF 完全暂停；
 * prefers-reduced-motion 只画单帧静态画面（走同一掩码）。
 * 禁令遵守：绝不把 canvas.style.width/height 设成像素值（只动 backing store）。
 */
window.CoverModes = window.CoverModes || {};
(function () {
  'use strict';

  var BLUE = [34, 81, 255];     /* #2251ff */
  var HAIR = [219, 226, 234];   /* #dbe2ea */

  /* 确定性 RNG：矩阵在多次重绘间保持稳定 */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function isReduced() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function debounce(fn, ms) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { timer = null; fn.apply(self, args); }, ms);
    };
  }

  /* 新鲜 DPR 的 canvas 尺寸——每次重建都重读 devicePixelRatio（绝不缓存），
     浏览器缩放/跨屏拖动会重栅格化 backing store（SPEC §6）。
     只写 canvas.width/height，绝不触碰 CSS 尺寸。 */
  function sizeCanvas(canvas) {
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var host = canvas.parentElement || canvas;
    var w = host.clientWidth || canvas.clientWidth || window.innerWidth || 0;
    var h = host.clientHeight || canvas.clientHeight || 0;
    if (w < 8 || h < 8) return { ctx: null, w: 0, h: 0 };
    var bw = Math.max(1, Math.round(w * dpr));
    var bh = Math.max(1, Math.round(h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    var ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ------------------------------------------------------------------ *
   * 文字净空场（text-clearance field）。
   * 实测封面文字栈每个元素的真实渲染盒（单行块再用 canvas measureText
   * 量墨迹右缘），返回 mask(x, y) → 文字背后/旁侧为 0、净空区为 1，
   * 边缘平滑过渡。移动端每个块都撑满整列，净空场清空整个文字列，
   * 矩阵只在模式切换之下存活——任何宽度都不发生图文相撞。
   * ------------------------------------------------------------------ */
  function buildMask(canvas, ctx, w, h) {
    function geometric() {                  /* DOM 缺失时的兜底 */
      return function (x, y) {
        if (y >= h * 0.9) return 1;
        var xr = w < 720 ? w : w * 0.60;
        return smooth(xr - 70, xr + 26, x);
      };
    }
    if (!canvas || !ctx || !document.querySelector) return geometric();
    var cr = canvas.getBoundingClientRect();
    if (!cr || cr.width < 8) return geometric();

    function rectOf(el) {
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (!r || (r.width < 1 && r.height < 1)) return null;
      return { x0: r.left - cr.left, y0: r.top - cr.top,
               x1: r.right - cr.left, y1: r.bottom - cr.top };
    }
    /* 元素文字的渲染墨迹右缘（含 letter-spacing） */
    function inkRight(el, box) {
      var cs = window.getComputedStyle(el);
      var fs = parseFloat(cs.fontSize) || 12;
      var lh = parseFloat(cs.lineHeight) || fs * 1.4;
      var lines = Math.max(1, Math.round((box.y1 - box.y0) / lh));
      if (lines > 1) return box.x1;          /* 折行 → 视为撑满整列 */
      var ls = 0;
      if (cs.letterSpacing && cs.letterSpacing !== 'normal') {
        ls = parseFloat(cs.letterSpacing);
        if (/em$/.test(cs.letterSpacing)) ls *= fs;
        if (!isFinite(ls)) ls = 0;
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.font = (cs.fontStyle !== 'normal' ? cs.fontStyle + ' ' : '') +
        (cs.fontWeight || '400') + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var line = '', maxw = 0, i, node;
      function flush() {
        if (!line) return;
        var tw = ctx.measureText(line).width + ls * Math.max(0, line.length - 1);
        if (tw > maxw) maxw = tw;
        line = '';
      }
      for (i = 0; i < el.childNodes.length; i++) {
        node = el.childNodes[i];
        if (node.nodeName === 'BR') flush();
        else line += node.textContent || '';
      }
      flush();
      ctx.restore();
      return box.x0 + Math.min(maxw, box.x1 - box.x0);
    }

    /* 中文站选择器映射：.cover→#cover、.kicker→.cover-kicker、
       .subtitle→.cover-sub、.lead→.cover-lede、.cover-note→.cover-anchor、
       .cover-modes→#cover-mode、.scroll-cue→.scroll-hint、.chip→#cover .chip */
    var q = function (s) { return document.querySelector('#cover ' + s); };
    var k = rectOf(q('.cover-kicker')), t = rectOf(q('.cover-title')),
        s = rectOf(q('.cover-sub')), l = rectOf(q('.cover-lede')),
        ch = rectOf(q('.cover-chips')), n = rectOf(q('.cover-anchor')),
        mo = rectOf(q('#cover-mode'));
    if (!k || !t || !l) return geometric();

    var bands = [];
    /* kicker 行——量墨迹（桌面单行，移动端折行） */
    bands.push({ y0: k.y0 - 10, y1: k.y1 + 16, xR: inkRight(q('.cover-kicker'), k) + 30 });
    /* H1 + 副题——逐行量墨迹 */
    var titleR = Math.max(inkRight(q('.cover-title'), t),
                          s ? inkRight(q('.cover-sub'), s) : 0);
    bands.push({ y0: t.y0 - 6, y1: (s ? s.y1 : t.y1) + 12, xR: titleR + 30 });
    /* lede 段——文字撑满 620px 列 */
    bands.push({ y0: l.y0 - 8, y1: l.y1 + 14, xR: l.x1 + 24 });
    /* chips——不透明胶囊；清空到最深一颗 chip 的右缘 */
    if (ch) {
      var chipR = 0, chips = document.querySelectorAll('#cover .chip');
      for (var i = 0; i < chips.length; i++) {
        var rr = rectOf(chips[i]);
        if (rr && rr.x1 > chipR) chipR = rr.x1;
      }
      bands.push({ y0: ch.y0 - 8, y1: ch.y1 + 12, xR: (chipR || ch.x1) + 14 });
    }
    /* 底部注释——mono 小字撑满列 */
    if (n) bands.push({ y0: n.y0 - 8, y1: n.y1 + 12, xR: n.x1 + 20 });
    /* 模式切换——只清空按钮实际占据的范围 */
    if (mo) {
      var mr = 0, pills = document.querySelectorAll('#cover-mode .mode-btn');
      for (var j = 0; j < pills.length; j++) {
        var pr = rectOf(pills[j]);
        if (pr && pr.x1 > mr) mr = pr.x1;
      }
      bands.push({ y0: mo.y0 - 8, y1: mo.y1 + 14, xR: (mr || mo.x0 + 320) + 16 });
    }

    /* SCROLL 提示：中文站 .scroll-hint 是整列宽的容器，取其实际内容
       （子元素并集）作为缺口范围，与原版的紧凑 .scroll-cue 对齐 */
    var cueEl = q('.scroll-hint');
    var cue = contentRect(cueEl);

    function contentRect(el) {
      if (!el) return null;
      var kids = el.children, u = null, i, r;
      for (i = 0; i < kids.length; i++) {
        r = rectOf(kids[i]);
        if (!r) continue;
        if (!u) u = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 };
        else {
          if (r.x0 < u.x0) u.x0 = r.x0;
          if (r.y0 < u.y0) u.y0 = r.y0;
          if (r.x1 > u.x1) u.x1 = r.x1;
          if (r.y1 > u.y1) u.y1 = r.y1;
        }
      }
      return u || rectOf(el);
    }

    function xLimitRaw(y) {
      for (var i = 0; i < bands.length; i++) {
        if (y >= bands[i].y0 && y < bands[i].y1) return bands[i].xR;
      }
      return 0;
    }
    /* 对阶梯轮廓做 box-blur，带与带之间柔化衔接；
       但与原始值取 max——细带（kicker/chips 等厚度 <48px 的带）不会被
       模糊窗稀释到墨迹边缘之内，带内始终保有完整 xR 净空 */
    function xLimit(y) {
      return Math.max(xLimitRaw(y),
        (xLimitRaw(y - 24) + xLimitRaw(y) + xLimitRaw(y + 24)) / 3);
    }
    /* 过渡带完全位于墨迹边缘之外：xl+6 以内全清，xl+92 以外全自由——
       任何 cell 都不得探入文字；SCROLL 提示周围有柔和缺口。
       bands/cuePad 挂在函数对象上，供 buildField 做矩形级精化：
       cell 掩码不能只按中心点采样——大 cell（≤230px）中心落在未遮罩区时，
       边线会穿越文字带 */
    maskFn.bands = bands;
    maskFn.cuePad = cue ? { x0: cue.x0 - 16, y0: cue.y0 - 22,
                            x1: cue.x1 + 16, y1: cue.y1 + 22 } : null;
    return maskFn;

    function maskFn(x, y) {
      var m = 1;
      var xl = xLimit(y);
      if (xl > 0) {
        m = smooth(xl + 6, xl + 92, x);
      }
      /* SCROLL 提示周围的柔和缺口，保持可读 */
      if (cue && y > cue.y0 - 22 && y < cue.y1 + 22) {
        var inX = smooth(cue.x0 - 48, cue.x0 - 16, x) *
                  (1 - smooth(cue.x1 + 16, cue.x1 + 48, x));
        m *= 1 - inX * 0.9;
      }
      return m;
    }
  }

  /* ------------------------------------------------------------------ *
   * 递归矩形细分——分形 cell 矩阵。
   * 根矩形铺满画布；每个矩形按锚点衰减决定的深度/尺寸继续切分
   * （近核四分、远缘单刀），核心细密嵌套、边缘大而疏。
   * 种子固定 → 每次重建布局完全一致。
   * ------------------------------------------------------------------ */
  function buildField(w, h, rng, mask, ax, ay, R) {
    var nodes = [];
    var MAX_NODES = 9000;
    var maxDepth = 7;

    function falloff(cx, cy) {
      var d = Math.hypot(cx - ax, cy - ay) / R;
      return Math.exp(-d * d * 2.4);
    }

    /* 矩形级掩码：中心采样之外，凡与文字带垂直相交的 cell 按其左缘
       计算掩码（带内 xR+6 全清），与 cuePad 相交的 cell 压到 0.1——
       保证任意大小的 cell 都不会把边线画进文字/SCROLL 提示区 */
    function rectMask(x, y, rw, rh, cx, cy) {
      var m = mask(cx, cy);
      var bands = mask.bands, i, b;
      if (bands) {
        for (i = 0; i < bands.length; i++) {
          b = bands[i];
          if (y < b.y1 && y + rh > b.y0) {
            m = Math.min(m, smooth(b.xR + 6, b.xR + 92, x));
          }
        }
      }
      var cp = mask.cuePad;
      if (cp && x < cp.x1 && x + rw > cp.x0 && y < cp.y1 && y + rh > cp.y0) {
        m = Math.min(m, 0.1);
      }
      return m;
    }

    function subdivide(x, y, rw, rh, d) {
      if (nodes.length >= MAX_NODES) return;
      var cx = x + rw / 2, cy = y + rh / 2;
      var f = falloff(cx, cy);
      var node = {
        x: Math.round(x), y: Math.round(y),
        w: Math.round(rw), h: Math.round(rh),
        d: d, f: f, leaf: false, dots: false, fill: 0,
        m: rectMask(x, y, rw, rh, cx, cy),
        at: clamp(Math.hypot(cx - ax, cy - ay) / (R * 0.85), 0, 1.6),
        ph: rng() * Math.PI * 2
      };
      nodes.push(node);
      if (node.w < 6 || node.h < 6) { node.leaf = true; return; }

      var minSide = Math.min(rw, rh);
      var target = 40 - f * 30;                    /* 核心 ≈10px → 远缘 ≈40px */
      var eff = f * 0.85 + node.m * 0.15;
      var mustSplit = minSide / 2 >= target && d < 2 + Math.round(f * 4);
      var maySplit = minSide / 2 >= 9 && d < maxDepth &&
                     rng() < 0.12 + eff * 0.62;
      if (!(mustSplit || maySplit)) {
        node.leaf = true;
        /* 偶发纸色淡填充，核心处 alpha 封顶 0.18 以下 */
        if (rng() < 0.05 + f * f * 0.22) node.fill = 0.02 + 0.14 * f * f;
        /* 叶子格偶发点阵填充（焊点/过孔阵） */
        if (rng() < 0.14 + f * 0.34 && minSide >= 11) node.dots = true;
        return;
      }
      /* 切分：核心附近以四分为王（矩阵感），远处单刀 Guillotine 切 */
      if (rng() < 0.32 + f * 0.55 && minSide / 2 >= 9) {
        var mx = Math.round(x + rw * (0.42 + rng() * 0.16));
        var my = Math.round(y + rh * (0.42 + rng() * 0.16));
        subdivide(x, y, mx - x, my - y, d + 1);
        subdivide(mx, y, x + rw - mx, my - y, d + 1);
        subdivide(x, my, mx - x, y + rh - my, d + 1);
        subdivide(mx, my, x + rw - mx, y + rh - my, d + 1);
      } else if (rw >= rh) {
        var sx = Math.round(x + rw * (0.36 + rng() * 0.28));
        subdivide(x, y, sx - x, rh, d + 1);
        subdivide(sx, y, x + rw - sx, rh, d + 1);
      } else {
        var sy = Math.round(y + rh * (0.36 + rng() * 0.28));
        subdivide(x, y, rw, sy - y, d + 1);
        subdivide(x, sy, rw, y + rh - sy, d + 1);
      }
    }

    var rs = Math.max(110, Math.min(230, Math.round(w / 6.2)));
    for (var gy = -rs * 0.2; gy < h + rs * 0.2; gy += rs) {
      for (var gx = -rs * 0.2; gx < w + rs * 0.2; gx += rs) {
        subdivide(gx + (rng() - 0.5) * rs * 0.12,
                  gy + (rng() - 0.5) * rs * 0.12, rs, rs, 0);
      }
    }

    /* 逐节点描边色：随锚点衰减从发丝灰 → 电光蓝
       （中间带保持灰，只有核心变蓝） */
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var t = Math.pow(nd.f, 2.6) * nd.m;
      nd.col = Math.round(lerp(HAIR[0], BLUE[0], t)) + ',' +
               Math.round(lerp(HAIR[1], BLUE[1], t)) + ',' +
               Math.round(lerp(HAIR[2], BLUE[2], t));
    }
    return nodes;
  }

  function makeEngine(canvas) {
    var ctx = null, w = 0, h = 0;
    var nodes = [];
    var raf = null, t0 = 0, running = false, inView = true, pageVisible = true;
    var io = null, ro = null, visFn = null;
    var reduced = isReduced();

    function rebuild() {
      var box = sizeCanvas(canvas);
      ctx = box.ctx; w = box.w; h = box.h;
      nodes = [];
      if (!ctx || w < 40 || h < 40) return;
      var mask = buildMask(canvas, ctx, w, h);
      /* 锚点：封面中右部；窄屏时文字列占满宽度，锚点落入
         模式切换之下的净空区，图文分离 */
      var ax = w * 0.68, ay = h * 0.45;
      if (w < 720 && mask(ax, ay) < 0.5) {
        /* 窄屏：文字列把模式切换以上全部屏蔽——锚点落入净空条带，
           居中 SCROLL 提示之右 */
        ax = w * 0.74;
        var freeTop = h;
        for (var y = h - 1; y > h * 0.3; y -= 8) {
          if (mask(ax, y) < 0.5) break;
          freeTop = y;
        }
        if (h - freeTop > 40) ay = freeTop + (h - freeTop) * 0.40;
      }
      /* 衰减半径：桌面放宽；移动端的净空区是薄条带，半径收紧保持柔和 */
      var R = w < 720 ? Math.max(320, Math.min(480, h * 0.38))
                      : 0.68 * Math.max(w, h);
      nodes = buildField(w, h, mulberry32(19850429), mask, ax, ay, R);
    }

    function revealOf(nd, t) {
      return reduced ? 1 : clamp((t - 0.15 - nd.at * 0.75) * 2.2, 0, 1);
    }

    function drawFrame(now) {
      if (!ctx) return;
      var t = reduced ? 3.2 : Math.max(0, (now - t0) / 1000);
      var breath = reduced ? 1 : 0.94 + 0.06 * Math.sin(t * 0.7);
      /* 小屏矩阵栖身文字之下的薄条带——进一步减淡，移动封面保持纸感 */
      var dim = w < 720 ? 0.7 : 1;

      ctx.clearRect(0, 0, w, h);
      var i, nd, reveal, a;

      /* 第一遍——发丝描边，先父后子（先序）；嵌套线累积出分形矩形质感。
         alpha 随锚点衰减陡峭上升：远场几乎不可见的灰，只有核心读得出蓝。
         掩码 m 乘进每一帧——动画任意帧都不会越过文字净空场。 */
      ctx.save();
      ctx.translate(0.5, 0.5);                /* 1px 发丝线对齐像素 */
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        if (nd.m < 0.02) continue;
        reveal = revealOf(nd, t);
        if (reveal <= 0) continue;
        a = (0.045 + 0.36 * Math.pow(nd.f, 1.8)) * nd.m * reveal * breath * dim /
            (1 + nd.d * 0.08);
        if (a < 0.015) continue;
        ctx.strokeStyle = 'rgba(' + nd.col + ',' + a.toFixed(3) + ')';
        ctx.strokeRect(nd.x, nd.y, nd.w, nd.h);
      }
      ctx.restore();

      /* 第二遍——叶子淡填充，纸色蓝，封顶低 alpha */
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        if (!nd.leaf || !nd.fill || nd.m < 0.02) continue;
        reveal = revealOf(nd, t);
        if (reveal <= 0) continue;
        a = nd.fill * nd.m * reveal * breath * dim;
        if (a < 0.012) continue;
        ctx.fillStyle = 'rgba(' + BLUE[0] + ',' + BLUE[1] + ',' + BLUE[2] + ',' + a.toFixed(3) + ')';
        ctx.fillRect(nd.x + 1, nd.y + 1, nd.w - 2, nd.h - 2);
      }

      /* 第三遍——叶子格点阵填充，轻微闪烁 */
      for (i = 0; i < nodes.length; i++) {
        nd = nodes[i];
        if (!nd.leaf || !nd.dots || nd.m < 0.02) continue;
        reveal = revealOf(nd, t);
        if (reveal <= 0) continue;
        var shim = reduced ? 0.85 : 0.72 + 0.28 * Math.sin(t * 0.9 + nd.ph);
        a = (0.04 + 0.30 * nd.f * nd.f) * nd.m * reveal * shim * dim;
        if (a < 0.015) continue;
        ctx.fillStyle = 'rgba(' + nd.col + ',' + a.toFixed(3) + ')';
        var step = Math.min(nd.w, nd.h) >= 20 ? 5 : 4;
        for (var dx = nd.x + 3; dx < nd.x + nd.w - 2.5; dx += step) {
          for (var dy = nd.y + 3; dy < nd.y + nd.h - 2.5; dy += step) {
            ctx.fillRect(dx, dy, 1.4, 1.4);
          }
        }
      }
    }

    /* ---- 循环控制：rAF 只在引擎运行 AND canvas 在屏 AND 标签页可见时存在 ---- */
    function loopWanted() {
      return running && !reduced && inView && pageVisible;
    }
    function syncLoop() {
      if (loopWanted() && raf === null) {
        raf = requestAnimationFrame(tick);
      } else if (!loopWanted() && raf !== null) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }
    function tick(now) {
      raf = null;
      if (!running) return;
      drawFrame(now);
      if (loopWanted()) raf = requestAnimationFrame(tick);
    }

    return {
      start: function () {
        this.stop();
        reduced = isReduced();
        rebuild();
        running = true;
        pageVisible = !document.hidden;
        t0 = performance.now();
        if (reduced) {
          drawFrame(t0);                       /* 单帧静态画面（同一掩码） */
        } else {
          drawFrame(t0);                       /* 首帧同步绘制：切换无闪烁 */
          syncLoop();
        }
        if ('IntersectionObserver' in window) {
          io = new IntersectionObserver(function (es) {
            inView = !!(es[0] && es[0].isIntersecting);
            if (inView && running) drawFrame(performance.now());
            syncLoop();
          }, { threshold: 0.02 });
          io.observe(canvas);
        }
        visFn = function () {
          pageVisible = !document.hidden;
          if (pageVisible && running) drawFrame(performance.now());
          syncLoop();
        };
        document.addEventListener('visibilitychange', visFn);
        if ('ResizeObserver' in window) {
          var onR = debounce(function () {
            rebuild();                          /* resize：掩码随布局重建 */
            if (running && (reduced || (inView && pageVisible))) {
              drawFrame(performance.now());
            }
            syncLoop();
          }, 140);
          ro = new ResizeObserver(onR);
          ro.observe(canvas.parentElement || canvas);
        }
        /* webfont 就绪后重新测量文字掩码一次 */
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () {
            if (!running) return;
            rebuild();
            if (reduced || (inView && pageVisible)) drawFrame(performance.now());
          });
        }
      },
      stop: function () {
        running = false;
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
        if (io) { io.disconnect(); io = null; }
        if (ro) { ro.disconnect(); ro = null; }
        if (visFn) { document.removeEventListener('visibilitychange', visFn); visFn = null; }
        if (ctx) ctx.clearRect(0, 0, w, h);
      }
    };
  }

  var engine = null;
  window.CoverModes['a'] = {
    start: function (canvas) {
      if (!canvas) return;
      if (!engine) engine = makeEngine(canvas);
      engine.start();
    },
    stop: function () {
      if (engine) engine.stop();
    }
  };
})();
