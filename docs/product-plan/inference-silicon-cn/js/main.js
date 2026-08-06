/* main.js — 启动流程与全局编排
 * 职责（SPEC §5）：
 *   1) DOMContentLoaded 后初始化 cover 三模式切换（#cover-mode 胶囊按钮，role=tab，aria-pressed，默认 A）；
 *   2) eager render 全部 [data-chart]（Charts 缺 key 时 console.warn，不中断）；
 *   3) IntersectionObserver 监听 19 个 section → era-rail 高亮段 + 年份 badge（年份映射读 window.WINDOWS）
 *      + #era-rail / #dash-rail 的 .on 类（cover 可见时隐藏，进入文章显示）
 *      + Dashboard.setState(SECTION_TO_DASH[id])（存在才调）；
 *   4) era-rail 段点击 → 对应 section scrollIntoView（reduced-motion 时不用平滑滚动）；
 *   5) hash 导航：DOMContentLoaded → 图表首渲染 → document.fonts.ready 后精确落位；监听 hashchange；
 *   6) scroll 监听 rAF 节流、只注册一次；全程幂等；无控制台错误、无未捕获 Promise。
 */
(function () {
  'use strict';

  /* ---------- 小工具 ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function warn() {
    if (window.console && typeof window.console.warn === 'function') {
      window.console.warn.apply(window.console, arguments);
    }
  }

  var rmMql = null;
  try {
    rmMql = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  } catch (e) { rmMql = null; }
  function prefersReduced() { return !!(rmMql && rmMql.matches); }

  /* ---------- 常量 ---------- */
  var COVER_MODES = [
    { key: 'a', canvasId: 'cover-canvas' },
    { key: 'b', canvasId: 'cover-canvas-x' },
    { key: 'c', canvasId: 'cover-canvas-w' }
  ];
  var DEFAULT_MODE = 'a';

  /* 19 个 section → 六个窗口索引（era-rail 高亮依据；不可增减的 section id 见 SPEC §4） */
  var SECTION_TO_WIN = {
    'sec-frame': 0, 'sec-grave': 0,
    'sec-w2': 0, 'sec-w3': 1, 'sec-w4': 2, 'sec-w5': 3, 'sec-w6': 4,
    'sec-mining': 4, 'sec-w7': 5,
    'sec-now': 5, 'sec-crossover': 5, 'sec-mismatch': 5,
    'sec-bottleneck': 5, 'sec-partition': 5, 'sec-assumptions': 5,
    'sec-analog': 5, 'sec-verdict': 5, 'sec-signals': 5, 'sec-invest': 5
  };
  var WIN_SECS = ['sec-w2', 'sec-w3', 'sec-w4', 'sec-w5', 'sec-w6', 'sec-w7'];
  var FALLBACK_LABELS = ['1985', '1995', '2004', '2013', '2019', '2023→26'];
  var BADGE_OVERRIDE = {
    'sec-frame': '1985–2026',
    'sec-grave': '1975–2026',
    'sec-mining': '2017–2022'
  };

  /* ---------- 运行状态 ---------- */
  var booted = false;
  var sections = [];
  var eraRail = null, dashRail = null, badgeEl = null, segs = [];
  var coverBtns = [];
  var sectionIO = null, coverIO = null;
  var currentSection = null;
  var currentWin = -1;
  var coverVisible = true;
  var activeMode = null;
  var scrollScheduled = false;
  var hintDismissed = false;
  var ioSupported = ('IntersectionObserver' in window);

  /* 窗口年份标签：优先 window.WINDOWS（data.js），缺失时用兜底表 */
  function winLabels() {
    var W = window.WINDOWS;
    if (!W || !W.length) return FALLBACK_LABELS;
    var out = [];
    for (var i = 0; i < W.length; i++) {
      var from = (W[i] && W[i].from != null) ? String(W[i].from) : (FALLBACK_LABELS[i] || '');
      if (i === W.length - 1 && W[i] && W[i].to != null) {
        out.push(from + '→' + String(W[i].to).slice(-2));
      } else {
        out.push(from);
      }
    }
    return out;
  }

  function scrollToId(id, smooth) {
    var el = document.getElementById(id);
    if (!el) return false;
    var behavior = (smooth && !prefersReduced()) ? 'smooth' : 'auto';
    try {
      el.scrollIntoView({ behavior: behavior, block: 'start', inline: 'nearest' });
    } catch (e) {
      try { el.scrollIntoView(); } catch (e2) { /* ignore */ }
    }
    return true;
  }

  /* ---------- Cover 三模式切换 ---------- */
  function resolveModeKey(btn, idx) {
    var attr = btn.getAttribute('data-mode') || btn.getAttribute('data-cover') || btn.getAttribute('data-key');
    if (attr && /^[abc]$/i.test(attr)) return attr.toLowerCase();
    var txt = (btn.textContent || '').replace(/\s+/g, '');
    if (txt.indexOf('递归') !== -1) return 'a';
    if (txt.indexOf('爆炸') !== -1) return 'b';
    if (txt.indexOf('蓝图') !== -1) return 'c';
    if (/^A/i.test(txt)) return 'a';
    if (/^B/i.test(txt)) return 'b';
    if (/^C/i.test(txt)) return 'c';
    return COVER_MODES[idx] ? COVER_MODES[idx].key : null;
  }

  function startCoverMode(key) {
    var mode = window.CoverModes && window.CoverModes[key];
    var conf = null, i;
    for (i = 0; i < COVER_MODES.length; i++) {
      if (COVER_MODES[i].key === key) conf = COVER_MODES[i];
    }
    var c = conf && document.getElementById(conf.canvasId);
    if (mode && typeof mode.start === 'function' && c) {
      try { mode.start(c); } catch (e) { warn('[main] cover 模式启动失败:', key, e); }
    } else if (!mode) {
      warn('[main] window.CoverModes 缺少模式:', key);
    }
  }

  function stopCoverModes() {
    for (var i = 0; i < COVER_MODES.length; i++) {
      var mode = window.CoverModes && window.CoverModes[COVER_MODES[i].key];
      if (mode && typeof mode.stop === 'function') {
        try { mode.stop(); } catch (e) { /* ignore */ }
      }
    }
  }

  function updateCoverPlayback() {
    if (coverVisible) {
      if (activeMode) startCoverMode(activeMode);
    } else {
      stopCoverModes();
    }
  }

  function setCoverMode(key) {
    var found = false, i;
    /* 先切 display（目标 canvas 可见后再 start，fitCanvas 才能量到尺寸；
     * start() 首帧同步绘制，同一任务内完成 → 切换无闪烁） */
    for (i = 0; i < COVER_MODES.length; i++) {
      var c = document.getElementById(COVER_MODES[i].canvasId);
      if (c) c.style.display = (COVER_MODES[i].key === key) ? '' : 'none';
      if (COVER_MODES[i].key === key) found = true;
    }
    if (!found) return;
    for (i = 0; i < coverBtns.length; i++) {
      var on = coverBtns[i].__mode === key ? 'true' : 'false';
      coverBtns[i].setAttribute('aria-pressed', on);
      coverBtns[i].setAttribute('aria-selected', on); /* role=tab 兼容 */
    }
    stopCoverModes();
    activeMode = key;
    if (coverVisible) startCoverMode(key);
  }

  function initCoverModes() {
    var box = $('#cover-mode');
    var i;
    /* 三 canvas 全部初始化：先全部置为可见（display 切换，不动宽高样式），
     * 逐个 start（各自同步画好首帧），再停掉并隐藏非默认模式——
     * 之后任何切换都已初始化过，无闪烁。全程同步，不会上屏中间态。 */
    for (i = 0; i < COVER_MODES.length; i++) {
      var c = document.getElementById(COVER_MODES[i].canvasId);
      if (c) c.style.display = '';
    }
    for (i = 0; i < COVER_MODES.length; i++) {
      startCoverMode(COVER_MODES[i].key);
    }
    for (i = 0; i < COVER_MODES.length; i++) {
      if (COVER_MODES[i].key === DEFAULT_MODE) continue;
      var mode = window.CoverModes && window.CoverModes[COVER_MODES[i].key];
      if (mode && typeof mode.stop === 'function') {
        try { mode.stop(); } catch (e) { /* ignore */ }
      }
      var c2 = document.getElementById(COVER_MODES[i].canvasId);
      if (c2) c2.style.display = 'none';
    }
    if (box) {
      if (!box.getAttribute('role')) box.setAttribute('role', 'tablist');
      /* 识别 button / [role=tab] + data-mode（P1 纯文本按钮 DOM 兼容） */
      coverBtns = $all('button, [role="tab"]', box);
      coverBtns.forEach(function (b, idx) {
        var key = resolveModeKey(b, idx);
        if (!key) return;
        b.__mode = key;
        if (!b.getAttribute('role')) b.setAttribute('role', 'tab');
        if (b.tagName === 'BUTTON' && !b.getAttribute('type')) b.setAttribute('type', 'button');
        b.setAttribute('aria-pressed', key === DEFAULT_MODE ? 'true' : 'false');
        b.setAttribute('aria-selected', key === DEFAULT_MODE ? 'true' : 'false');
        b.addEventListener('click', function () { setCoverMode(key); });
      });
    }
    setCoverMode(DEFAULT_MODE);
  }

  /* ---------- 封面 chips 可点击（.chip[data-goto] → 平滑滚动） ---------- */
  /* 文案 → section id 兜底映射（data-goto 缺失时按 chip 文字识别） */
  var CHIP_TEXT_MAP = {
    '核心结论': 'sec-frame',
    '生存者记录': 'sec-grave',
    '最近历史类比': 'sec-w3',
    '当前周期': 'sec-w7',
    '交叉点压力测试': 'sec-crossover',
    '两种情景': 'sec-verdict',
    '三项大胆假设': 'sec-assumptions',
    '八个触发器': 'sec-signals'
  };

  function chipTargetId(chip) {
    var raw = chip.getAttribute('data-goto') || chip.getAttribute('data-target') || '';
    raw = raw.replace(/^#/, '').trim();
    if (raw) return raw;
    var txt = (chip.textContent || '').replace(/\s+/g, '');
    if (CHIP_TEXT_MAP[txt]) return CHIP_TEXT_MAP[txt];
    for (var k in CHIP_TEXT_MAP) {
      if (Object.prototype.hasOwnProperty.call(CHIP_TEXT_MAP, k) && txt.indexOf(k) !== -1) {
        return CHIP_TEXT_MAP[k];
      }
    }
    return '';
  }

  function activateChip(chip) {
    var id = chipTargetId(chip);
    if (!id) return;
    /* scrollIntoView 平滑滚动；prefers-reduced-motion 时 auto（scrollToId 内已处理） */
    scrollToId(id, true);
  }

  function initChips() {
    if (window.__chipsBound) return;
    window.__chipsBound = '1';
    /* 事件委托：.chip 为 <button data-goto> 或旧 <span> 均可；
     * 只响应带可解析目标的 .chip，不影响页面其他元素 */
    document.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || typeof t.closest !== 'function') return;
      var chip = t.closest('.chip');
      if (!chip) return;
      if (!chipTargetId(chip)) return;
      activateChip(chip);
    });
    /* 键盘兜底：非 <button> 的 .chip（如旧 span 结构）也可 Enter/Space 触发 */
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var t = ev.target;
      if (!t || typeof t.closest !== 'function') return;
      var chip = t.closest('.chip');
      if (!chip || chip.tagName === 'BUTTON' || chip.tagName === 'A') return;
      if (!chipTargetId(chip)) return;
      ev.preventDefault();
      activateChip(chip);
    });
  }

  /* ---------- 图表 eager render ---------- */
  function renderAllCharts() {
    var frames = $all('[data-chart]');
    var Charts = window.Charts || {};
    frames.forEach(function (frame) {
      var key = frame.getAttribute('data-chart');
      if (!key) return;
      if (typeof Charts[key] === 'function') {
        try { Charts[key](frame); } catch (e) { warn('[main] 图表渲染失败:', key, e); }
      } else {
        warn('[main] Charts 缺少 key:', key);
      }
    });
  }

  /* ---------- Dashboard 初始化（SPEC §5；其内部幂等，重复调用安全） ---------- */
  function initDashboard() {
    if (window.Dashboard && typeof window.Dashboard.init === 'function') {
      try { window.Dashboard.init(); } catch (e) { warn('[main] Dashboard.init 失败:', e); }
    }
  }

  /* ---------- Era Rail ---------- */
  function initEraRail() {
    eraRail = $('#era-rail');
    dashRail = $('#dash-rail');
    if (!eraRail) return;
    badgeEl = $('#era-badge') || $('.era-badge', eraRail);
    segs = $all('.era-seg', eraRail);
    segs.forEach(function (seg, i) {
      var sec = seg.getAttribute('data-sec') || WIN_SECS[i] || null;
      seg.__sec = sec;
      seg.__win = (sec && SECTION_TO_WIN[sec] != null) ? SECTION_TO_WIN[sec] : i;
      if (!seg.hasAttribute('tabindex')) seg.setAttribute('tabindex', '0');
      if (!seg.getAttribute('role')) seg.setAttribute('role', 'button');
      var go = function () { if (seg.__sec) scrollToId(seg.__sec, true); };
      seg.addEventListener('click', go);
      seg.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          go();
        }
      });
    });
  }

  function updateEraRail() {
    if (eraRail && segs.length) {
      segs.forEach(function (seg) {
        var on = currentWin >= 0 && seg.__win === currentWin;
        seg.classList.toggle('on', on);
        if (on) seg.setAttribute('aria-current', 'true');
        else seg.removeAttribute('aria-current');
      });
    }
    if (badgeEl && currentSection) {
      var labels = winLabels();
      var txt = BADGE_OVERRIDE[currentSection] || (currentWin >= 0 ? labels[currentWin] : '');
      if (txt && badgeEl.textContent !== txt) badgeEl.textContent = txt;
    }
  }

  function updateRails() {
    var show = !coverVisible && !!currentSection;
    if (eraRail) eraRail.classList.toggle('on', show);
    if (dashRail) dashRail.classList.toggle('on', show);
  }

  /* ---------- 当前 section 追踪 ---------- */
  function setCurrentSection(id) {
    if (!id || id === currentSection) return;
    currentSection = id;
    currentWin = (SECTION_TO_WIN[id] != null) ? SECTION_TO_WIN[id] : -1;
    updateEraRail();
    updateRails();
    var map = window.SECTION_TO_DASH || {};
    if (map[id] && window.Dashboard && typeof window.Dashboard.setState === 'function') {
      try { window.Dashboard.setState(map[id]); }
      catch (e) { warn('[main] Dashboard.setState 失败:', e); }
    }
  }

  function initObservers() {
    sections = $all('main section[id]');
    if (!sections.length) sections = $all('section.band[id]');
    if (!sections.length) sections = $all('section[id]');
    if (!ioSupported) return;

    sectionIO = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) setCurrentSection(entries[i].target.id);
      }
    }, { root: null, rootMargin: '-38% 0px -55% 0px', threshold: 0 });
    sections.forEach(function (s) { sectionIO.observe(s); });

    var cover = $('#cover');
    if (cover) {
      coverIO = new IntersectionObserver(function (entries) {
        var en = entries[0];
        coverVisible = !!(en && en.isIntersecting);
        updateRails();
        updateCoverPlayback();
      }, { root: null, threshold: 0.1 });
      coverIO.observe(cover);
    }
  }

  /* ---------- scroll（rAF 节流，全程只注册一次；不直接重绘） ---------- */
  function fallbackTrack() {
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var line = vh * 0.42;
    var best = null;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      if (r.top <= line && r.bottom > line) { best = sections[i]; break; }
      if (r.top <= line) best = sections[i];
    }
    if (best) setCurrentSection(best.id);
    var cover = $('#cover');
    if (cover) {
      coverVisible = cover.getBoundingClientRect().bottom > vh * 0.15;
      updateRails();
      updateCoverPlayback();
    }
  }

  function handleScroll() {
    if (!hintDismissed) {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (y > 80) {
        hintDismissed = true;
        var hint = $('.scroll-hint');
        if (hint) hint.classList.add('off');
      }
    }
    if (!ioSupported) fallbackTrack();
  }

  function onScroll() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    window.requestAnimationFrame(function () {
      scrollScheduled = false;
      try { handleScroll(); } catch (e) { /* ignore */ }
    });
  }

  function initScroll() {
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- hash 导航 ---------- */
  function hashToId(hash) {
    var raw = (hash || '').replace(/^#/, '');
    if (!raw) return '';
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  function initHashNav() {
    var initial = hashToId(window.location.hash);
    if (initial && document.getElementById(initial)) {
      var done = false;
      var go = function () {
        if (done) return;
        done = true;
        /* 此时 DOMContentLoaded 与图表首渲染已完成，fonts.ready 后精确落位 */
        scrollToId(initial, false);
        window.requestAnimationFrame(function () { scrollToId(initial, false); });
      };
      if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') {
        document.fonts.ready.then(go, go); /* 拒绝时也落位，不产生未捕获 Promise */
      } else {
        go();
      }
    }
    window.addEventListener('hashchange', function () {
      var id = hashToId(window.location.hash);
      if (id) scrollToId(id, true);
    });
  }

  /* ---------- reduced-motion 偏好变化 ---------- */
  function initMotionWatch() {
    if (!rmMql) return;
    var onChange = function () {
      /* 重启当前 cover 模式以应用新的运动偏好（静态帧 ↔ 动画） */
      if (coverVisible && activeMode) startCoverMode(activeMode);
    };
    try {
      if (typeof rmMql.addEventListener === 'function') rmMql.addEventListener('change', onChange);
      else if (typeof rmMql.addListener === 'function') rmMql.addListener(onChange);
    } catch (e) { /* ignore */ }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    if (booted) return;
    booted = true;
    try { initCoverModes(); } catch (e) { warn('[main] cover 初始化失败:', e); }
    try { initChips(); } catch (e) { warn('[main] chips 初始化失败:', e); }
    try { renderAllCharts(); } catch (e) { warn('[main] 图表渲染失败:', e); }
    try { initDashboard(); } catch (e) { warn('[main] dashboard 初始化失败:', e); }
    try { initEraRail(); } catch (e) { warn('[main] era-rail 初始化失败:', e); }
    try { initObservers(); } catch (e) { warn('[main] observer 初始化失败:', e); }
    try { initScroll(); } catch (e) { /* ignore */ }
    try { initMotionWatch(); } catch (e) { /* ignore */ }
    try { initHashNav(); } catch (e) { /* ignore */ }
    updateRails();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
