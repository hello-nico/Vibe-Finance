/* ============================================================================
 * js/utils.js — inference-silicon-cn 共享交互工具（Agent C）
 * 纯 Vanilla JS。加载顺序：data.js 之后、charts 之前。
 * 幂等：重复执行安全 —— 事件监听只注册一次（window.__utilsBound 守卫），
 *       DOM 节点存在即复用，不重复创建。
 *
 * 导出 window.Utils：
 *   css(name)                 读 :root CSS 变量值（trim）
 *   fitCanvas(canvas)         按 SPEC §6 DPR 规则初始化，返回 {ctx, w, h}
 *                             （w/h 为 CSS 像素逻辑尺寸）；绝不把 style 设为像素值
 *   tooltip.show(html,x,y,o)  显示并定位 #tooltip；o.via='click' 时移动端也可用
 *   tooltip.move(x,y)         跟随定位（自动防出屏）
 *   tooltip.hide()            隐藏
 *   drill.open(opts)          打开 drill card（底部抽屉 <768px）。opts 支持：
 *                               {title, body, source, date}              —— 旧版调用，完全兼容
 *                               {category, period, bigNumber, bigLabel}  —— 深藏青卡新增可选字段
 *                               {fact, cite}                             —— 出处卡别名
 *                               （body/fact 可传受信任 HTML 片段，自动识别）
 *   drill.close()             关闭（Escape / 点遮罩 / 关闭按钮均可触发）
 *   el(tag, attrs, children)  DOM 构建小助手
 *   fmt(n)                    数字千分位；null/undefined/NaN → '未披露'
 *
 * 样式契约（与 css/style.css 对齐，JS 只管定位与显隐）：
 *   - 显隐一律用 [hidden] 属性（CSS: [hidden]{display:none!important}），
 *     JS 绝不写 style.display。
 *   - tooltip 保留 #tooltip（等宽 11px 深色样式由 CSS 负责），内部可用 .t-title / .t-sub。
 *   - drill card 为深藏青规格：JS 给 #drill-card 加 .drill-dark 类（视觉由 CSS 负责）。
 *     内部结构：button.drill-close × div.drill-cat（类别，可选）× h3.drill-title ×
 *     div.drill-period（期间，可选）× div.drill-big（大数字块：.drill-big-num +
 *     .drill-big-label，可选）× div.drill-body × div.drill-src。
 *     兼容 index.html 既有 id 节点（#drill-close/#drill-title/#drill-body/#drill-src），
 *     复用时补挂同名 class，不重复创建。
 *   - <768px 时 drill overlay 加 .drawer 类（底部抽屉样式由 CSS 负责）。
 *   - <768px 时 tooltip 不响应 hover（show 需 via:'click' 才生效）。
 * ============================================================================ */
(function () {
  'use strict';

  if (window.Utils && window.Utils.__v) { return; } // 幂等：已初始化则直接退出

  var MOBILE_BP = 768;

  function isMobile() { return window.innerWidth < MOBILE_BP; }

  /* ------------------------------ css ------------------------------ */
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ------------------------------ fitCanvas ------------------------------
   * SPEC §6：getBoundingClientRect → dpr=min(devicePixelRatio,2)
   * → canvas.width/height = round(css*dpr) → style.width/height = '100%'
   * → ctx.setTransform(dpr,0,0,dpr,0,0)，返回 {ctx,w,h}（w/h 为 CSS 像素）。 */
  function fitCanvas(canvas) {
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width;
    var cssH = rect.height;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }

  /* ------------------------------ el ------------------------------ */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          for (var s in v) { if (Object.prototype.hasOwnProperty.call(v, s)) node.style[s] = v[s]; }
        }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'dataset' && typeof v === 'object') {
          for (var d in v) { if (Object.prototype.hasOwnProperty.call(v, d)) node.dataset[d] = v[d]; }
        }
        else node.setAttribute(k, v);
      }
    }
    if (children != null) {
      var list = Array.isArray(children) ? children : [children];
      list.forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return node;
  }

  /* ------------------------------ fmt ------------------------------ */
  function fmt(n) {
    if (n === null || n === undefined || (typeof n === 'number' && !isFinite(n))) return '未披露';
    if (typeof n !== 'number') return String(n);
    var neg = n < 0;
    var parts = String(Math.abs(n)).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + parts.join('.');
  }

  /* ------------------------------ tooltip ------------------------------ */
  function ensureTooltip() {
    var t = document.getElementById('tooltip');
    if (!t) {
      t = document.createElement('div');
      t.id = 'tooltip';
      t.setAttribute('role', 'tooltip');
      t.hidden = true;
      document.body.appendChild(t);
    }
    return t;
  }

  var PAD = 14;

  function placeTooltip(t, x, y) {
    /* 视口坐标定位：调用方传 event.clientX/clientY，绝不要加 scrollX/scrollY。
     * position:fixed 由 CSS 负责；缺失时 JS 兜底补上（仅定位，不碰其他样式）。 */
    if (getComputedStyle(t).position !== 'fixed') t.style.position = 'fixed';
    var vw = window.innerWidth, vh = window.innerHeight;
    var tw = t.offsetWidth, th = t.offsetHeight;
    var left = x + PAD, top = y + PAD;
    if (left + tw > vw - 8) left = x - tw - PAD;
    if (top + th > vh - 8) top = y - th - PAD;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }

  var tooltip = {
    show: function (html, x, y, opts) {
      if (isMobile() && !(opts && opts.via === 'click')) return; // <768px 不响应 hover
      var t = ensureTooltip();
      t.innerHTML = html;
      t.hidden = false;
      placeTooltip(t, x, y);
    },
    move: function (x, y) {
      var t = document.getElementById('tooltip');
      if (!t || t.hidden) return;
      placeTooltip(t, x, y);
    },
    hide: function () {
      var t = document.getElementById('tooltip');
      if (t) t.hidden = true;
    }
  };

  /* 内部共享给后半段（drill + 组装）；组装完成后即删除 */
  window.__U1 = { isMobile: isMobile, css: css, fitCanvas: fitCanvas, el: el, fmt: fmt, tooltip: tooltip, ensureTooltip: ensureTooltip };
})();

/* ============================== 后半段：drill + 组装 ============================== */
(function () {
  'use strict';

  if (window.Utils && window.Utils.__v) { // 幂等：重复执行不再注册、不重建
    if (window.__U1) { try { delete window.__U1; } catch (e) { window.__U1 = undefined; } }
    return;
  }

  var U1 = window.__U1;
  var el = U1.el, isMobile = U1.isMobile;

  /* ------------------------------ drill card（深藏青规格） ------------------------------
   * 结构（样式由 CSS 负责，深藏青外观由 .drill-dark 类承担）：
   *   #drill-overlay[hidden] > #drill-card.drill-dark[role=dialog][aria-modal][tabindex=-1]
   *     > button.drill-close        × 关闭按钮
   *       div.drill-cat             类别 kicker（公司披露/券商研究/行业与官方/研究综合，可选）
   *       h3.drill-title            标题
   *       div.drill-period          期间（可选）
   *       div.drill-big             大数字块（可选）：.drill-big-num + .drill-big-label
   *       div.drill-body            一行解读（纯文本或受信任 HTML）
   *       div.drill-src             来源行
   * 兼容：index.html 既有 id 节点（#drill-close/#drill-title/#drill-body/#drill-src）
   *       直接复用并补挂 class；旧版 {title,body,source,date} 调用行为不变。
   * 行为：Escape 关闭、点遮罩关闭、打开聚焦卡片、关闭还原焦点、body 滚动锁定、
   *       <768px 给 overlay 加 .drawer 类（底部抽屉）。 */
  var lastFocused = null;
  var prevOverflow = '';
  var scrollLocked = false;

  function lockScroll() {
    if (scrollLocked) return;
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    scrollLocked = true;
  }

  function unlockScroll() {
    if (!scrollLocked) return;
    document.body.style.overflow = prevOverflow;
    scrollLocked = false;
  }

  /* body/fact 允许图表 agent 传受信任 HTML 片段（动态字段由各 agent 自行 esc）；
   * 纯文本一律走 textContent，杜绝注入。 */
  function looksHtml(s) {
    return typeof s === 'string' && /<[a-z][\s\S]*?>/i.test(s);
  }

  /* 复用既有节点（class 或 id 均可命中），缺失则惰性创建；命中 id 节点时补挂 class */
  function grab(card, cls, id, tag) {
    var node = card.querySelector('.' + cls);
    if (!node && id) {
      var byId = document.getElementById(id);
      if (byId && card.contains(byId)) node = byId;
    }
    if (!node) { node = el(tag, { class: cls }); card.appendChild(node); }
    if (!node.classList.contains(cls)) node.classList.add(cls);
    return node;
  }

  function ensureDrill() {
    var overlay = document.getElementById('drill-overlay');
    var card = document.getElementById('drill-card');

    if (!overlay) {
      overlay = el('div', { id: 'drill-overlay' });
      overlay.hidden = true;
      document.body.appendChild(overlay);
    }
    if (!card) {
      card = el('div', { id: 'drill-card', role: 'dialog', 'aria-modal': 'true', tabindex: '-1' });
      overlay.appendChild(card);
    }
    if (card.getAttribute('tabindex') == null) card.setAttribute('tabindex', '-1');
    card.classList.add('drill-dark'); // 深藏青卡规格（视觉由 CSS .drill-dark 负责）

    /* 基础四件套：复用 index.html 既有 id 节点或新建（新建顺序即文档顺序） */
    var closeBtn = grab(card, 'drill-close', 'drill-close', 'button');
    if (closeBtn.tagName.toLowerCase() !== 'button' && !closeBtn.getAttribute('type')) {
      closeBtn.setAttribute('type', 'button');
    }
    if (!closeBtn.getAttribute('aria-label')) closeBtn.setAttribute('aria-label', '关闭');
    if (!closeBtn.textContent) closeBtn.textContent = '×';

    var titleEl = grab(card, 'drill-title', 'drill-title', 'h3');
    if (!titleEl.id) titleEl.id = 'drill-title'; // 配合 aria-labelledby
    var bodyEl = grab(card, 'drill-body', 'drill-body', 'div');
    var srcEl = grab(card, 'drill-src', 'drill-src', 'div');

    /* 新增三件套：类别 kicker / 期间 / 大数字块，插到正确位置（幂等） */
    var catEl = card.querySelector('.drill-cat');
    if (!catEl) { catEl = el('div', { class: 'drill-cat' }); card.insertBefore(catEl, titleEl); }
    var periodEl = card.querySelector('.drill-period');
    if (!periodEl) {
      periodEl = el('div', { class: 'drill-period' });
      card.insertBefore(periodEl, titleEl.nextSibling);
    }
    var bigEl = card.querySelector('.drill-big');
    if (!bigEl) {
      bigEl = el('div', { class: 'drill-big' }, [
        el('div', { class: 'drill-big-num' }),
        el('div', { class: 'drill-big-label' })
      ]);
      card.insertBefore(bigEl, periodEl.nextSibling);
    }
    var bigNumEl = bigEl.querySelector('.drill-big-num');
    var bigLabelEl = bigEl.querySelector('.drill-big-label');

    /* 事件绑定：每个元素只绑一次 */
    if (!overlay.dataset.bound) {
      overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) drill.close(); });
      overlay.dataset.bound = '1';
    }
    if (!closeBtn.dataset.bound) {
      closeBtn.addEventListener('click', function () { drill.close(); });
      closeBtn.dataset.bound = '1';
    }
    return {
      overlay: overlay, card: card, closeBtn: closeBtn,
      catEl: catEl, titleEl: titleEl, periodEl: periodEl,
      bigEl: bigEl, bigNumEl: bigNumEl, bigLabelEl: bigLabelEl,
      bodyEl: bodyEl, srcEl: srcEl
    };
  }

  var drill = {
    open: function (opts) {
      opts = opts || {};
      var d = ensureDrill();

      /* 类别 kicker（可选） */
      var cat = opts.category ? String(opts.category) : '';
      d.catEl.textContent = cat;
      d.catEl.hidden = !cat;

      d.titleEl.textContent = opts.title || '';

      /* 期间（可选）：「标题 · 期间」规格 */
      var period = opts.period ? String(opts.period) : '';
      d.periodEl.textContent = period;
      d.periodEl.hidden = !period;

      /* 大数字块（如适用） */
      var hasBig = opts.bigNumber !== undefined && opts.bigNumber !== null && opts.bigNumber !== '';
      if (hasBig) {
        d.bigNumEl.textContent = String(opts.bigNumber);
        d.bigLabelEl.textContent = opts.bigLabel ? String(opts.bigLabel) : '';
        d.bigLabelEl.hidden = !opts.bigLabel;
      }
      d.bigEl.hidden = !hasBig;

      /* 一行解读：body 或别名 fact；HTML 片段自动识别 */
      var body = opts.body !== undefined && opts.body !== null ? opts.body
               : (opts.fact !== undefined && opts.fact !== null ? opts.fact : '');
      if (looksHtml(body)) d.bodyEl.innerHTML = String(body);
      else d.bodyEl.textContent = String(body);
      d.bodyEl.hidden = body === '' || body === null || body === undefined;

      /* 来源行：source + date；或出处卡别名 cite（本身已含日期） */
      var src = '';
      if (opts.source) {
        src = '来源：' + opts.source;
        if (opts.date) src += ' · ' + opts.date;
      } else if (opts.cite) {
        src = '来源：' + opts.cite;
      } else if (opts.date) {
        src = String(opts.date);
      }
      d.srcEl.textContent = src;
      d.srcEl.hidden = !src;

      d.overlay.classList.toggle('drawer', isMobile()); // <768px 底部抽屉
      d.overlay.hidden = false;
      lastFocused = document.activeElement;
      lockScroll();
      d.card.focus();
    },
    close: function () {
      var overlay = document.getElementById('drill-overlay');
      if (!overlay || overlay.hidden) return;
      overlay.hidden = true;
      unlockScroll();
      if (lastFocused && typeof lastFocused.focus === 'function') {
        try { lastFocused.focus(); } catch (e) { /* 元素可能已移除 */ }
      }
      lastFocused = null;
    },
    isOpen: function () {
      var overlay = document.getElementById('drill-overlay');
      return !!(overlay && !overlay.hidden);
    }
  };

  /* Escape 关闭：全局只注册一次 */
  if (!window.__utilsBound) {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) drill.close();
    });
    window.__utilsBound = true;
  }

  /* ------------------------------ 组装导出 ------------------------------ */
  window.Utils = {
    __v: 2,
    css: U1.css,
    fitCanvas: U1.fitCanvas,
    el: U1.el,
    fmt: U1.fmt,
    tooltip: U1.tooltip,
    drill: drill,
    isMobile: U1.isMobile
  };

  try { delete window.__U1; } catch (e) { window.__U1 = undefined; }
})();
