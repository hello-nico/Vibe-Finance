/* cover-exploded.js — 封面模式 B「爆炸图」（移植自英文原版 COVER ENGINE B · EXPLODED）
 * 芯片封装爆炸图：基板 / 中介层 / 逻辑芯片 / HBM 堆叠 / 顶盖沿 z 轴
 * 分离-聚合，白纸上的发丝轴测线框，克制的铜金 #b07a10 活性点缀，
 * 整体不透明度 ≲0.5。
 * 布局：宽屏时构图浮在封面右侧（zoneL = max(0.58w, .cover-lede 实测
 * 右缘+30)，绝不越过文字列）；窄屏压缩进 #cover-mode 之下的净空条带
 * （等比缩放适配），任何帧图形与文字都不相遇。
 *
 * 契约：window.CoverModes['b'] = { start(canvas), stop() }
 * DPR 每次重建重读；离屏/隐藏/停止时 rAF 完全暂停；
 * prefers-reduced-motion 只画单帧静态画面。
 * 禁令遵守：绝不把 canvas.style.width/height 设成像素值（只动 backing store）。
 */
window.CoverModes = window.CoverModes || {};
(function () {
  'use strict';

  var INK = '5,28,44';      /* #051c2c */
  var GREY = '133,149,166'; /* #8595a6 */
  var COPPER = '176,122,16';/* #b07a10 */

  /* 轴测投影（压扁，纸面友好） */
  var CA = 0.866, SA = 0.31;

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

  /* 新鲜 DPR 的 canvas 尺寸——每次重建重读，绝不缓存（SPEC §6）。
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

  /* 文字栈底部（模式切换行）的 canvas 坐标——窄屏时其下净空条带
     是图形唯一允许出现的位置 */
  function freeTopOf(canvas, h) {
    var mo = document.querySelector('#cover #cover-mode');
    if (!mo) return h * 0.9;
    var cr = canvas.getBoundingClientRect();
    var r = mo.getBoundingClientRect();
    if (!cr || !r) return h * 0.9;
    return Math.min(h, Math.max(0, r.bottom - cr.top)) + 14;
  }

  /* 文字栈整体右缘的 canvas 坐标——lede/anchor 撑满列用元素盒，
     kicker/标题/副题用 Range 逐行字形盒，chips/模式按钮取最深一颗——
     任何视口下构图都不得越过它向左（中文 chips/anchor 比 lede 更宽，
     仅看 lede 会让点阵/构图探入文字行） */
  function stackRightOf(canvas, w) {
    var cr = canvas.getBoundingClientRect();
    if (!cr || cr.width < 8) return w * 0.57;
    var best = 0;
    function scan(el, useBox) {
      if (!el) return;
      if (useBox) {
        var r = el.getBoundingClientRect();
        if (r && r.width >= 1) best = Math.max(best, r.right - cr.left);
        return;
      }
      /* 逐 text node 的 Range 字形盒 */
      var range = document.createRange();
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        range.selectNodeContents(node);
        var rs = range.getClientRects();
        for (var i = 0; i < rs.length; i++) best = Math.max(best, rs[i].right - cr.left);
      }
    }
    scan(document.querySelector('#cover .cover-kicker'));
    scan(document.querySelector('#cover .cover-title'));
    scan(document.querySelector('#cover .cover-sub'));
    scan(document.querySelector('#cover .cover-lede'), true);
    scan(document.querySelector('#cover .cover-anchor'), true);
    var chips = document.querySelectorAll('#cover .chip'), i, r;
    for (i = 0; i < chips.length; i++) {
      r = chips[i].getBoundingClientRect();
      if (r && r.width >= 1) best = Math.max(best, r.right - cr.left);
    }
    var pills = document.querySelectorAll('#cover-mode .mode-btn, #cover-mode .cover-mode-label');
    for (i = 0; i < pills.length; i++) {
      r = pills[i].getBoundingClientRect();
      if (r && r.width >= 1) best = Math.max(best, r.right - cr.left);
    }
    return best > 0 ? best : w * 0.57;
  }

  function makeEngine(canvas) {
    var ctx = null, w = 0, h = 0;
    var raf = null, t0 = 0, running = false, inView = true, pageVisible = true;
    var io = null, ro = null, visFn = null;
    var reduced = isReduced();

    /* 各层平面尺寸（px，投影前）；标注文字已中文化 */
    var LAYERS = [
      { id: '基板',        pw: 400, ph: 280, grid: 26, th: 9,  z: 0 },
      { id: '中介层',      pw: 330, ph: 218, grid: 22, th: 6,  z: 1 },
      { id: 'HBM3E ×4',    pw: 0,   ph: 0,   grid: 0,  th: 14, z: 2, hbm: true },
      { id: '逻辑芯片',    pw: 188, ph: 148, grid: 17, th: 10, z: 2, die: true },
      { id: '顶盖',        pw: 296, ph: 208, grid: 0,  th: 7,  z: 3.15, frame: true }
    ];

    function rebuild() {
      var box = sizeCanvas(canvas);
      ctx = box.ctx; w = box.w; h = box.h;
    }

    /* 平面点 + 高度 → 屏幕投影 */
    function proj(cx, cy, x, y, z) {
      return [cx + (x - y) * CA, cy + (x + y) * SA - z];
    }

    function slab(cx, cy, pw, ph, z, th, strokeA, fillA, copper) {
      var c = [
        proj(cx, cy, -pw / 2, -ph / 2, z),
        proj(cx, cy, pw / 2, -ph / 2, z),
        proj(cx, cy, pw / 2, ph / 2, z),
        proj(cx, cy, -pw / 2, ph / 2, z)
      ];
      /* 侧壁 */
      ctx.strokeStyle = 'rgba(' + INK + ',' + (strokeA * 0.55).toFixed(3) + ')';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(c[1][0], c[1][1]); ctx.lineTo(c[1][0], c[1][1] + th);
      ctx.lineTo(c[2][0], c[2][1] + th); ctx.lineTo(c[2][0], c[2][1]);
      ctx.moveTo(c[2][0], c[2][1] + th); ctx.lineTo(c[3][0], c[3][1] + th);
      ctx.lineTo(c[3][0], c[3][1]);
      ctx.stroke();
      /* 顶面 */
      ctx.beginPath();
      ctx.moveTo(c[0][0], c[0][1]);
      for (var i = 1; i < 4; i++) ctx.lineTo(c[i][0], c[i][1]);
      ctx.closePath();
      if (fillA > 0) {
        ctx.fillStyle = 'rgba(' + (copper ? COPPER : INK) + ',' + fillA.toFixed(3) + ')';
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(' + (copper ? COPPER : INK) + ',' + strokeA.toFixed(3) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
      return c;
    }

    function gridOnFace(cx, cy, pw, ph, z, step, a) {
      ctx.strokeStyle = 'rgba(' + INK + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      var x, y, p0, p1;
      for (x = -pw / 2 + step; x < pw / 2 - 0.5; x += step) {
        p0 = proj(cx, cy, x, -ph / 2, z); p1 = proj(cx, cy, x, ph / 2, z);
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      }
      for (y = -ph / 2 + step; y < ph / 2 - 0.5; y += step) {
        p0 = proj(cx, cy, -pw / 2, y, z); p1 = proj(cx, cy, pw / 2, y, z);
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      }
      ctx.stroke();
    }

    function tag(cx, cy, pw, ph, z, label, side) {
      var edge = proj(cx, cy, pw / 2, side ? ph / 2 : -ph / 2, z);
      var lx = edge[0] + 26, ly = edge[1] - 4;
      ctx.strokeStyle = 'rgba(' + GREY + ',0.4)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(edge[0] + 3, edge[1] - 2);
      ctx.lineTo(lx - 5, ly + 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(66,86,106,0.62)';
      ctx.font = '9px Menlo, Consolas, "SF Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      if (lx + 90 < w) ctx.fillText(label, lx, ly);
    }

    function drawFrame(now) {
      if (!ctx || w < 80 || h < 80) return;
      var t = (now - t0) / 1000;
      var explode = reduced ? 0.9
        : 0.78 + 0.22 * (0.5 + 0.5 * Math.sin(t * (Math.PI * 2 / 9) - Math.PI / 2));
      var gap = 34 * explode;

      ctx.clearRect(0, 0, w, h);

      /* 摆放：宽屏把层叠浮在右侧、避开文字列；窄屏压进模式切换之下的
         净空条带——图文永不相遇 */
      var wide = w >= 720;
      var zoneL = wide ? Math.max(w * 0.58, stackRightOf(canvas, w) + 30) : 0;
      if (wide && w - zoneL < 220) wide = false;   /* 太挤 → 条带模式 */
      var freeTop = wide ? h : freeTopOf(canvas, h);
      var stripH = h - freeTop;
      var cx, anchorY, scale, drawComp = true;

      if (wide) {
        cx = zoneL + (w - zoneL) * 0.5;
        anchorY = h / 2;
        scale = Math.min(1, (w - zoneL) / 700, h / 560);
      } else {
        cx = w * 0.62;
        anchorY = freeTop + stripH / 2 - 6;
        scale = Math.min(0.9, (w * 0.86) / 700, (stripH - 20) / 340);
        if (stripH < 92 || scale < 0.12) drawComp = false;
      }

      /* 淡纸点阵——桌面的右侧区 / 移动的条带区 */
      ctx.fillStyle = 'rgba(' + GREY + ',0.10)';
      var gs = 30;
      for (var gx = gs / 2; gx < w; gx += gs) {
        for (var gy = gs / 2; gy < h; gy += gs) {
          if (wide) { if (gx < zoneL && gy < h * 0.88) continue; }
          else if (gy < freeTop) continue;
          ctx.fillRect(gx - 0.5, gy - 0.5, 1, 1);
        }
      }

      if (!drawComp) return;

      /* 整组绕锚点缩放 */
      ctx.save();
      ctx.translate(cx, anchorY);
      ctx.scale(scale, scale);
      ctx.translate(-cx, -anchorY);
      var cy = anchorY + 46 * explode * (wide ? 1 : 0.35);
      var labels = scale >= 0.5;

      for (var i = 0; i < LAYERS.length; i++) {
        var L = LAYERS[i];
        var bob = reduced ? 0 : Math.sin(t * 0.9 + i * 1.31) * 2.5;
        var z = L.z * gap + bob;

        if (L.hbm) {
          /* 四个 HBM 堆叠拱卫逻辑芯片 */
          var bw = 34, bh = 128;
          var offs = [[-128, -56], [-128, 56], [128, -56], [128, 56]];
          for (var s = 0; s < offs.length; s++) {
            var hx = cx + (offs[s][0] - offs[s][1]) * CA;
            var hy = cy + (offs[s][0] + offs[s][1]) * SA - z;
            slab(hx, hy, bw, bh, 0, L.th, 0.30, 0.05, false);
            gridOnFace(hx, hy, bw, bh, 0, 11, 0.10);
          }
          if (labels && i === 2) tag(cx, cy, 250, 190, z, L.id, true);
          continue;
        }

        var copper = !!L.die;
        slab(cx, cy, L.pw, L.ph, z, L.th, copper ? 0.42 : 0.24, copper ? 0.05 : 0.035, copper);
        if (L.grid) gridOnFace(cx, cy, L.pw, L.ph, z, L.grid, L.die ? 0.16 : 0.07);

        if (L.die) {
          /* 活性单元——克制的铜色点缀 */
          var pulse = reduced ? 0.6 : (0.45 + 0.25 * Math.sin(t * 1.6));
          ctx.fillStyle = 'rgba(' + COPPER + ',' + (pulse * 0.35).toFixed(3) + ')';
          var cells = [[-3, -1], [0, 2], [2, -2], [4, 1], [-1, -3]];
          for (var cc = 0; cc < cells.length; cc++) {
            var gx0 = cells[cc][0] * L.grid, gy0 = cells[cc][1] * L.grid;
            var q = [
              proj(cx, cy, gx0, gy0, z),
              proj(cx, cy, gx0 + L.grid, gy0, z),
              proj(cx, cy, gx0 + L.grid, gy0 + L.grid, z),
              proj(cx, cy, gx0, gy0 + L.grid, z)
            ];
            ctx.beginPath();
            ctx.moveTo(q[0][0], q[0][1]);
            for (var qi = 1; qi < 4; qi++) ctx.lineTo(q[qi][0], q[qi][1]);
            ctx.closePath();
            ctx.fill();
          }
          /* 键合线：die 边缘下到基板 */
          ctx.strokeStyle = 'rgba(' + COPPER + ',0.30)';
          ctx.lineWidth = 0.7;
          var pads = [[-L.pw / 2, -L.ph / 4], [-L.pw / 2, L.ph / 4], [L.pw / 2, -L.ph / 4], [L.pw / 2, L.ph / 4]];
          for (var wd = 0; wd < pads.length; wd++) {
            var a0 = proj(cx, cy, pads[wd][0], pads[wd][1], z);
            var a1 = proj(cx, cy, pads[wd][0] * 1.9, pads[wd][1] * 1.9, 0.5 * gap);
            ctx.beginPath();
            ctx.moveTo(a0[0], a0[1]);
            ctx.quadraticCurveTo((a0[0] + a1[0]) / 2, Math.min(a0[1], a1[1]) - 14, a1[0], a1[1]);
            ctx.stroke();
          }
        }
        if (L.frame) {
          /* 顶盖：空心框——内挖 cutout */
          slab(cx, cy, L.pw - 44, L.ph - 44, z, 0.1, 0.16, 0, false);
        }
        if (labels) tag(cx, cy, L.pw, L.ph, z, L.id, i % 2 === 0);
      }
      ctx.restore();
    }

    /* ---- 循环控制：rAF 只在运行 AND 在屏 AND 标签页可见时存在 ---- */
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
        if (reduced) drawFrame(t0 + 4500);   /* 单帧静态画面 */
        else { drawFrame(t0); syncLoop(); }  /* 首帧同步绘制：切换无闪烁 */
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
            rebuild();                          /* resize：重新测量文字边界 */
            if (running && (reduced || (inView && pageVisible))) {
              drawFrame(performance.now());
            }
            syncLoop();
          }, 140);
          ro = new ResizeObserver(onR);
          ro.observe(canvas.parentElement || canvas);
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
  window.CoverModes['b'] = {
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
