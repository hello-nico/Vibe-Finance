/* cover-wire.js — 封面模式 C「蓝图」（移植自英文原版 COVER ENGINE C · BLUEPRINT）
 * 白纸上的工程蓝图：细线框 floorplan 区块、尺寸标注线、坐标刻度、
 * 十字准星与工艺结构引出标注（小号 mono 字）。墨色低 alpha——
 * 克制、印刷感，不透明度 ≲0.5。
 * 布局：宽屏时整张图纸右移（zoneL = max(0.57w, .cover-lede 实测右缘+26)，
 * die/尺寸线/标注全部不得落入文字列，x<文字右缘+余量不布线）；
 * 窄屏用简化图纸落入 #cover-mode 之下的净空条带。
 *
 * 契约：window.CoverModes['c'] = { start(canvas), stop() }
 * DPR 每次重建重读；离屏/隐藏/停止时 rAF 完全暂停；
 * prefers-reduced-motion 只画单帧静态画面。
 * 禁令遵守：绝不把 canvas.style.width/height 设成像素值（只动 backing store）。
 */
window.CoverModes = window.CoverModes || {};
(function () {
  'use strict';

  var INK = '5,28,44';      /* #051c2c */
  var INKMD = '66,86,106';  /* #42566a */
  var GREY = '133,149,166'; /* #8595a6 */
  var BLUE = '34,81,255';   /* #2251ff */
  var MONO = 'Menlo, Consolas, "SF Mono", monospace';

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

  /* 文字栈底部（模式切换行）的 canvas 坐标 */
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
     中文 chips/anchor 比 lede 更宽，仅看 lede 会让 dimV/图框探入文字行 */
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

  /* SCROLL 提示内容右缘（中文站 .scroll-hint 是整列宽容器，取子元素
     实际范围），供扫描线避让 */
  function cueRightOf(canvas) {
    var el = document.querySelector('#cover .scroll-hint');
    if (!el) return 0;
    var cr = canvas.getBoundingClientRect();
    var best = 0, kids = el.children, i, r;
    for (i = 0; i < kids.length; i++) {
      r = kids[i].getBoundingClientRect();
      if (r && r.width >= 1) best = Math.max(best, r.right - cr.left);
    }
    if (!best) {
      r = el.getBoundingClientRect();
      if (r) best = r.right - cr.left;
    }
    return best + 12;
  }

  function makeEngine(canvas) {
    var ctx = null, w = 0, h = 0;
    var raf = null, t0 = 0, running = false, inView = true, pageVisible = true;
    var io = null, ro = null, visFn = null;
    var reduced = isReduced();

    function rebuild() {
      var box = sizeCanvas(canvas);
      ctx = box.ctx; w = box.w; h = box.h;
    }

    /* floorplan 区块，相对于单位 die 矩形（0..1）；标注已中文化 */
    var BLOCKS = [
      { x: 0.06, y: 0.08, w: 0.52, h: 0.52, label: '计算阵列 · SYSTOLIC 128×128', hatch: true },
      { x: 0.62, y: 0.08, w: 0.32, h: 0.24, label: 'SRAM · 192MB', hatch: false },
      { x: 0.62, y: 0.36, w: 0.32, h: 0.24, label: 'SERDES · 112G ×32', hatch: true },
      { x: 0.06, y: 0.64, w: 0.28, h: 0.28, label: 'HBM3E PHY ×4', hatch: false },
      { x: 0.38, y: 0.64, w: 0.28, h: 0.28, label: 'NoC 互连', hatch: false },
      { x: 0.70, y: 0.64, w: 0.24, h: 0.28, label: 'PCIe / CXL', hatch: false }
    ];
    /* 无左侧引出标注——构图整体右移，任何东西都不得探入标题/lede 文字块 */
    var CALLOUTS = [
      { tx: 0.20, ty: 0.30, text: 'FINFET 阵列 · N3', side: 'tl' },
      { tx: 0.78, ty: 0.48, text: 'M12–M15 · RDL', side: 'r' },
      { tx: 0.20, ty: 0.78, text: 'μBUMP · 40μm 节距', side: 'b' },
      { tx: 0.52, ty: 0.10, text: 'CoWoS 基板 · 10kwpm', side: 't' }
    ];

    function dimH(x0, x1, y, label, dash) {
      ctx.strokeStyle = 'rgba(' + INKMD + ',0.42)';
      ctx.fillStyle = 'rgba(' + INKMD + ',0.66)';
      ctx.lineWidth = 0.7;
      ctx.setLineDash(dash ? [4, 4] : []);
      ctx.beginPath();
      ctx.moveTo(x0, y); ctx.lineTo(x1, y);
      ctx.stroke();
      ctx.setLineDash([]);
      /* 端点 tick */
      ctx.beginPath();
      ctx.moveTo(x0, y - 4); ctx.lineTo(x0, y + 4);
      ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4);
      ctx.stroke();
      /* 箭头 */
      ctx.beginPath();
      ctx.moveTo(x0, y); ctx.lineTo(x0 + 6, y - 2.4); ctx.lineTo(x0 + 6, y + 2.4); ctx.closePath();
      ctx.moveTo(x1, y); ctx.lineTo(x1 - 6, y - 2.4); ctx.lineTo(x1 - 6, y + 2.4); ctx.closePath();
      ctx.fill();
      ctx.font = '8.5px ' + MONO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, (x0 + x1) / 2, y - 3);
    }

    function dimV(x, y0, y1, label) {
      ctx.strokeStyle = 'rgba(' + INKMD + ',0.42)';
      ctx.fillStyle = 'rgba(' + INKMD + ',0.66)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y0); ctx.lineTo(x, y1);
      ctx.moveTo(x - 4, y0); ctx.lineTo(x + 4, y0);
      ctx.moveTo(x - 4, y1); ctx.lineTo(x + 4, y1);
      ctx.stroke();
      ctx.save();
      ctx.translate(x - 4, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = '8.5px ' + MONO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }

    function crosshair(x, y, r, a) {
      ctx.strokeStyle = 'rgba(' + BLUE + ',' + a.toFixed(3) + ')';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.moveTo(x - r - 5, y); ctx.lineTo(x + r + 5, y);
      ctx.moveTo(x, y - r - 5); ctx.lineTo(x, y + r + 5);
      ctx.stroke();
    }

    /* die 矩形内的线框 floorplan 区块（桌面图纸与移动简化图纸共用） */
    function blocks(dx, dy, dw, dh, t, labels) {
      var dash = reduced ? 0 : -t * 8; /* marching ants 蚂蚁线 */
      for (var b = 0; b < BLOCKS.length; b++) {
        var B = BLOCKS[b];
        var bx = dx + B.x * dw, by = dy + B.y * dh;
        var bw = B.w * dw, bh = B.h * dh;
        ctx.strokeStyle = 'rgba(' + INK + ',0.26)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash(B.hatch ? [5, 4] : []);
        ctx.lineDashOffset = B.hatch ? dash : 0;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        if (B.hatch) {
          /* 45° 斜线填充，按构造裁剪在区块内 */
          ctx.strokeStyle = 'rgba(' + INK + ',0.07)';
          ctx.beginPath();
          for (var s = -bh; s < bw; s += 9) {
            var x0 = bx + Math.max(0, s), y0 = by + (s < 0 ? -s : 0);
            var x1 = bx + Math.min(bw, s + bh);
            var y1 = by + Math.min(bh, Math.min(bw, s + bh) - s);
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
          }
          ctx.stroke();
        }
        if (labels) {
          ctx.fillStyle = 'rgba(' + INKMD + ',0.6)';
          ctx.font = '8px ' + MONO;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(B.label, bx + 5, by + 5);
        }
      }
    }

    function sweep(dx, dy, dw, dh, t, yTop, yBot, xMin) {
      if (reduced) return;
      var x0 = Math.max(dx - 80, xMin || -1e9);
      var x1 = dx + dw + 80;
      var span = x1 - x0;
      if (span < 24) return;
      var sx = x0 + ((t * 36) % span);
      var top = Math.max(dy - 30, yTop), bot = Math.min(dy + dh + 30, yBot);
      var grad = ctx.createLinearGradient(sx - 30, 0, sx + 2, 0);
      grad.addColorStop(0, 'rgba(' + BLUE + ',0)');
      grad.addColorStop(1, 'rgba(' + BLUE + ',0.10)');
      ctx.fillStyle = grad;
      ctx.fillRect(Math.max(sx - 30, x0), top, sx + 2 - Math.max(sx - 30, x0), bot - top);
      ctx.strokeStyle = 'rgba(' + BLUE + ',0.22)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx, top); ctx.lineTo(sx, bot);
      ctx.stroke();
    }

    function drawFrame(now) {
      if (!ctx || w < 80 || h < 80) return;
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);

      var wide = w >= 760;

      if (!wide) {
        /* 窄屏图纸：模式切换之下净空条带里的简化蓝图——die、区块、
           扫描线；无尺寸线/标注，避免探入文字列 */
        var freeTop = freeTopOf(canvas, h);
        var stripH = h - freeTop;
        if (stripH < 88) return;
        var sdw = Math.min(w * 0.6, 300, (stripH - 30) / 0.72);
        if (sdw < 90) return;
        var sdh = sdw * 0.72;
        var sdx = Math.min(w - sdw - 14, Math.max(14, w * 0.64 - sdw / 2));
        var sdy = Math.max(freeTop + 12, freeTop + (stripH - sdh) / 2 - 4); /* 准星臂展 11px，不得探入模式切换行 */
        ctx.strokeStyle = 'rgba(' + INK + ',0.30)';
        ctx.lineWidth = 1;
        ctx.strokeRect(sdx, sdy, sdw, sdh);
        blocks(sdx, sdy, sdw, sdh, t, sdw >= 200);
        var puls2 = reduced ? 0.3 : (0.2 + 0.14 * Math.sin(t * 1.8));
        crosshair(sdx, sdy, 6, puls2);
        crosshair(sdx + sdw, sdy + sdh, 6, puls2 * 0.8);
        /* 扫描线保持在 SCROLL 提示之右 */
        sweep(sdx, sdy, sdw, sdh, t, freeTop - 2, h - 8, Math.max(sdx + 4, cueRightOf(canvas)));
        return;
      }

      /* die 矩形——宽屏时整张图纸右移，任何墨迹（die、尺寸线、标注）
         都不会落到 H1 或 lede 块背后；保护区是实测的 lede 列，
         中间宽度（760–1150px）同样保持净空 */
      var zoneL = Math.max(w * 0.57, stackRightOf(canvas, w) + 26);
      var rightRoom = 118;                  /* 给 'r' 侧标注文字留位 */
      var maxDw = (w - 30 - rightRoom) - zoneL - 26;
      if (maxDw < 170) {                     /* 放不下真图纸 → 简化图纸 */
        var ft2 = freeTopOf(canvas, h);
        var sh2 = h - ft2;
        if (sh2 < 88) return;
        var d2 = Math.min(w * 0.6, 300, (sh2 - 30) / 0.72);
        if (d2 < 90) return;
        var h2 = d2 * 0.72;
        var x2 = Math.min(w - d2 - 14, Math.max(14, w * 0.64 - d2 / 2));
        var y2 = Math.max(ft2 + 12, ft2 + (sh2 - h2) / 2 - 4);
        ctx.strokeStyle = 'rgba(' + INK + ',0.30)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x2, y2, d2, h2);
        blocks(x2, y2, d2, h2, t, d2 >= 200);
        var pu3 = reduced ? 0.3 : (0.2 + 0.14 * Math.sin(t * 1.8));
        crosshair(x2, y2, 6, pu3);
        crosshair(x2 + d2, y2 + h2, 6, pu3 * 0.8);
        sweep(x2, y2, d2, h2, t, ft2 - 2, h - 8, Math.max(x2 + 4, cueRightOf(canvas)));
        return;
      }
      var dw = Math.min(w * 0.62, 640, maxDw);
      var dh = dw * 0.72;
      if (dh > h * 0.52) { dh = h * 0.52; dw = dh / 0.72; }
      var dx = zoneL + 26;
      var dy = (h - dh) / 2 + 10;
      if (dy < h * 0.30) dy = h * 0.30;      /* 低于 H1 带 */
      if (dy + dh > h * 0.92) dy = Math.max(h * 0.24, h * 0.92 - dh);
      var furn = dw >= 320;                  /* 完整图纸家具 */
      var dims = dw >= 250;                  /* 尺寸标注线 */

      /* 坐标刻度：die 上方的顶边 + 画布右缘——绝不进入左侧文字区 */
      ctx.strokeStyle = 'rgba(' + GREY + ',0.35)';
      ctx.fillStyle = 'rgba(' + GREY + ',0.55)';
      ctx.lineWidth = 0.6;
      ctx.font = '7.5px ' + MONO;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var step = Math.max(28, Math.round(dw / 14));
      var i, v;
      for (i = 0; i <= Math.floor(dw / step); i++) {
        v = dx + i * step;
        ctx.beginPath(); ctx.moveTo(v, 14); ctx.lineTo(v, 19); ctx.stroke();
        if (i % 2 === 0) ctx.fillText(String(i * 10), v, 21);
      }
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (i = 0; i <= Math.floor(dh / step); i++) {
        v = dy + i * step;
        ctx.beginPath(); ctx.moveTo(w - 25, v); ctx.lineTo(w - 20, v); ctx.stroke();
        if (i % 2 === 0) ctx.fillText(String(i * 10), w - 29, v);
      }

      /* die 轮廓 + 线框区块 */
      ctx.strokeStyle = 'rgba(' + INK + ',0.34)';
      ctx.lineWidth = 1;
      ctx.strokeRect(dx, dy, dw, dh);
      blocks(dx, dy, dw, dh, t, dw >= 230);

      /* die 周围的尺寸标注线（需要肘部空间） */
      if (dims) {
        dimH(dx, dx + dw, dy - 26, (dw / 25.4).toFixed(2) + ' mm · 芯片边缘', false);
        dimH(dx, dx + dw * 0.58, dy + dh + 22, '阵列区 · ±0.05', true);
        dimV(dx - 26, dy, dy + dh, (dh / 25.4).toFixed(2) + ' mm');
      }

      /* 工艺结构引出标注（带肘形引线） */
      if (furn) {
      ctx.font = '8.5px ' + MONO;
      for (var c = 0; c < CALLOUTS.length; c++) {
        var C = CALLOUTS[c];
        var tx = dx + C.tx * dw, ty = dy + C.ty * dh;
        var lx = tx, ly = ty;
        if (C.side === 'tl') { lx = dx - 10; ly = dy - 44; }
        if (C.side === 'r') { lx = dx + dw + 12; ly = ty - 8; }
        if (C.side === 'b') { lx = tx - 14; ly = dy + dh + 42; }
        if (C.side === 't') { lx = tx + 30; ly = dy - 48; }
        /* 肘线：从目标点引出，再到标注锚点 */
        var mx = tx, my = ty;
        if (C.side === 'r') { mx = tx + 14; my = ty; }
        else if (C.side === 't' || C.side === 'tl') { mx = tx; my = ly + 10; }
        else if (C.side === 'b') { mx = tx; my = ly - 12; }
        ctx.strokeStyle = 'rgba(' + GREY + ',0.5)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(mx, my);
        ctx.lineTo(lx, ly);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + INKMD + ',0.6)';
        ctx.fill();
        ctx.fillStyle = 'rgba(' + INKMD + ',0.66)';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(C.text, lx + 3, ly - 2);
      }
      }

      /* die 四角 + 阵列中心的十字准星，轻脉冲 */
      var puls = reduced ? 0.35 : (0.22 + 0.16 * Math.sin(t * 1.8));
      crosshair(dx, dy, 7, puls);
      crosshair(dx + dw, dy + dh, 7, puls * 0.8);
      crosshair(dx + dw * 0.32, dy + dh * 0.34, 10, puls);

      /* 对位标记（registration fiducials） */
      ctx.strokeStyle = 'rgba(' + INK + ',0.3)';
      ctx.lineWidth = 0.7;
      var fx = dx + dw * 0.9, fy = dy + dh * 0.9;
      ctx.beginPath();
      ctx.moveTo(fx - 6, fy); ctx.lineTo(fx + 6, fy);
      ctx.moveTo(fx, fy - 6); ctx.lineTo(fx, fy + 6);
      ctx.stroke();

      /* 慢速扫描线——绝不探入保护文字区之左 */
      sweep(dx, dy, dw, dh, t, dy - 30, dy + dh + 30, zoneL + 10);

      /* 图签栏，右下——工程图纸家具 */
      var tw2 = 168, th2 = 34, tx2 = w - tw2 - 18, ty2 = h - th2 - 16;
      if (tx2 > dx + dw * 0.5) {
        ctx.strokeStyle = 'rgba(' + INK + ',0.3)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(tx2, ty2, tw2, th2);
        ctx.beginPath();
        ctx.moveTo(tx2, ty2 + th2 / 2); ctx.lineTo(tx2 + tw2, ty2 + th2 / 2);
        ctx.moveTo(tx2 + tw2 * 0.62, ty2); ctx.lineTo(tx2 + tw2 * 0.62, ty2 + th2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(' + INKMD + ',0.72)';
        ctx.font = '7.5px ' + MONO;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('图号 42 · 推理', tx2 + 6, ty2 + th2 / 4);
        ctx.fillText('比例 1:42 · A 版', tx2 + 6, ty2 + th2 * 0.75);
        ctx.fillText('1985–2026', tx2 + tw2 * 0.62 + 6, ty2 + th2 / 4);
        ctx.fillText('第 1/1 幅', tx2 + tw2 * 0.62 + 6, ty2 + th2 * 0.75);
      }
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
        if (reduced) drawFrame(t0 + 1000);   /* 单帧静态画面 */
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
  window.CoverModes['c'] = {
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
