/**
 * 行情 Mode · 壳层（topbar + rail + mkt-nav + agent dock）
 * 二级栏：顶层视图 Tab；总览页补充指数 / 情绪 / 资金目录，定位主区而不复制数据。
 * 用法：<div id="shell-root" data-view="overview|sectors|intel"></div>
 *      先引 data.js，再引本文件，最后 agent.js。
 */
(function () {
  var root = document.getElementById('shell-root');
  if (!root) return;
  var view = root.getAttribute('data-view') || 'overview';

  var inMarketDir = /\/market\/[^/]+\.html$/.test(location.pathname);
  var rootBase = inMarketDir ? '../' : '';
  var mktBase = inMarketDir ? '' : 'market/';
  var marketData = window.MKT_DATA || {};
  var REALTIME_KEY = 'vf-market-realtime';
  var realtimeTimer = null;

  var MKT_VIEWS = [
    { id: 'overview', href: rootBase + '01-market.html', n: '总览', m: '热力 · 指数 · 情绪' },
    { id: 'sectors', href: mktBase + 'sectors.html', n: '板块', m: '赛道 · 产业链' },
    { id: 'intel', href: mktBase + 'intel.html', n: '资讯', m: '公告 · 新闻 · RSS' },
  ];

  function mktTabs() {
    return MKT_VIEWS.map(function (v) {
      return (
        '<a class="mkt-tab' + (v.id === view ? ' on' : '') + '" href="' + v.href + '">' + v.n + '</a>'
      );
    }).join('');
  }

  function mktContext() {
    if (view === 'overview') {
      var items = [
        ['market-index', '指数', '大盘指数 · 市盈率'],
        ['market-sentiment', '情绪', '热力图 · 市场 · 短线'],
        ['market-funds', '资金', '成交额 Top20 · 轮动'],
      ];
      return (
        '<div class="mkt-sub show" aria-label="总览目录">' +
        '  <div class="mkt-sub-count">今日行情</div>' +
        '  <div class="mkt-sub-list">' +
        items.map(function (item, index) {
          return '<button type="button" class="mkt-sub-item' + (index === 0 ? ' on' : '') +
            '" data-scroll-target="' + item[0] + '">' +
            '<div class="n">' + item[1] + '</div><div class="m">' + item[2] + '</div></button>';
        }).join('') +
        '  </div>' +
        '</div>'
      );
    }
    if (view === 'sectors') {
      var sectorParams = new URLSearchParams(location.search);
      var focusKey = sectorParams.get('key') || sectorParams.get('focus');
      var sectorByKey = (marketData.sectors || []).reduce(function (byKey, item) {
        byKey[item.key] = item;
        return byKey;
      }, {});
      var shortcuts = (marketData.sectorShortcuts || []).map(function (shortcut) {
        return Object.assign({}, sectorByKey[shortcut.key], shortcut);
      }).filter(function (item) { return item.label; });
      return (
        '<div class="mkt-sub show" aria-label="热门板块">' +
        '  <div class="mkt-sub-count sidebar-section-label">热门板块</div>' +
        '  <label class="mkt-sub-search"><input class="sidebar-search" type="search" id="sector-search" placeholder="搜索热门板块…" autocomplete="off" /></label>' +
        '  <div class="mkt-sub-list sidebar-list sidebar-list--compact" id="sector-nav-list">' +
        shortcuts.map(function (item) {
          var active = item.key === focusKey;
          var iconColor = active ? '%23F35D2B' : '%237B8BA0';
          return '<a class="mkt-sub-item mkt-sub-item--icon' + (active ? ' on' : '') + '" data-sector-shortcut data-sector-search="' + item.label + ' ' + item.tagline +
            '" href="' + mktBase + 'sector-detail.html?key=' + encodeURIComponent(item.key) + '"' + (active ? ' aria-current="page"' : '') + '>' +
            '<img class="mkt-sub-ico" src="https://api.iconify.design/lucide:' + item.icon + '.svg?color=' + iconColor + '" alt="" aria-hidden="true" />' +
            '<span class="n">' + item.label + '</span>' +
            '</a>';
        }).join('') +
        '    <div class="mkt-sub-empty" id="sector-search-empty" hidden>未找到热门板块</div>' +
        '  </div>' +
        '</div>'
      );
    }

    var params = new URLSearchParams(location.search);
    var activeIntelTab = params.get('tab') || 'investment-news';
    var intelTabs = marketData.intelTabs || [];
    return (
      '<div class="mkt-sub show" aria-label="今日资讯">' +
      '  <div class="mkt-sub-count">今日资讯</div>' +
      '  <div class="mkt-sub-list">' +
      intelTabs.map(function (item) {
        var active = item.key === activeIntelTab;
        return '<a class="mkt-sub-item' + (active ? ' on' : '') + '" data-intel-tab="' + item.key +
          '" href="' + mktBase + 'intel.html?tab=' + item.key + '"' + (active ? ' aria-current="page"' : '') + '>' +
          '<div class="n">' + item.label + '</div><div class="m">' + item.navSummary + '</div></a>';
      }).join('') +
      '  </div>' +
      '</div>'
    );
  }

  function readRealtime() {
    try {
      var stored = localStorage.getItem(REALTIME_KEY);
      return stored !== 'off';
    } catch (e) {
      return true;
    }
  }

  function writeRealtime(enabled) {
    try {
      localStorage.setItem(REALTIME_KEY, enabled ? 'on' : 'off');
    } catch (e) { /* ignore */ }
  }

  var realtimeControl = view === 'overview'
    ? '<button type="button" class="market-realtime" id="market-realtime" aria-pressed="true">' +
      '  <i aria-hidden="true"></i><span>实时行情</span>' +
      '</button>'
    : '';

  root.innerHTML =
    '<div class="shell market" id="shell">' +
    '  <div class="topbar">' +
    '    <span class="topbar-brand">投研助手</span>' +
    '    <div class="topbar-right">' +
    realtimeControl +
    '      <button type="button" class="topbar-agent" id="btn-agent">助手</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="nav-dock" aria-label="主导航">' +
    '    <nav class="rail">' +
    '      <a class="rail-btn active" href="' + rootBase + '01-market.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18"/><path d="M5 14l4-5 3.5 3L17 6"/><path d="M14 6h3v3"/></svg>' +
    '        <span>行情</span></a>' +
    '      <a class="rail-btn" href="' + rootBase + '02-research.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h8l4 4v12H7V4z"/><path d="M15 4v4h4M9 12h6M9 16h4"/></svg>' +
    '        <span>研究</span></a>' +
    '      <a class="rail-btn" href="' + rootBase + '03-data.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"/><path d="M5 9h14M5 13h14M5 17h14M10 5v14M15 5v14"/></svg>' +
    '        <span>数据</span></a>' +
    '      <div class="rail-spacer"></div>' +
    '    </nav>' +
    '    <aside class="mkt-nav" aria-label="行情导航">' +
    '      <div class="mkt-tabs">' + mktTabs() + '</div>' +
    mktContext() +
    '    </aside>' +
    '  </div>' +
    '</div>';

  var shell = document.getElementById('shell');
  var main = document.querySelector('main.main-area');
  if (main && main.parentNode !== shell) shell.appendChild(main);

  var realtimeButton = document.getElementById('market-realtime');
  var realtimeEnabled = readRealtime();

  function refreshMarketDashboards() {
    if (!realtimeEnabled || document.hidden) return;
    window.dispatchEvent(new CustomEvent('mkt:realtime-refresh'));
  }

  function syncRealtimeControl() {
    if (!realtimeButton) return;
    realtimeButton.classList.toggle('on', realtimeEnabled);
    realtimeButton.setAttribute('aria-pressed', realtimeEnabled ? 'true' : 'false');
    realtimeButton.title = realtimeEnabled ? '实时行情已开启，点击暂停自动刷新' : '实时行情已暂停，点击开启自动刷新';
  }

  function startRealtimeTimer() {
    if (realtimeTimer) window.clearInterval(realtimeTimer);
    if (!realtimeEnabled || view !== 'overview') return;
    realtimeTimer = window.setInterval(refreshMarketDashboards, 30000);
  }

  if (realtimeButton) {
    realtimeButton.addEventListener('click', function () {
      realtimeEnabled = !realtimeEnabled;
      writeRealtime(realtimeEnabled);
      syncRealtimeControl();
      startRealtimeTimer();
      if (realtimeEnabled) refreshMarketDashboards();
    });
  }
  syncRealtimeControl();
  startRealtimeTimer();

  var sectorSearch = document.getElementById('sector-search');
  if (sectorSearch) {
    var sectorNavItems = Array.prototype.slice.call(document.querySelectorAll('[data-sector-shortcut]'));
    var sectorSearchEmpty = document.getElementById('sector-search-empty');
    sectorSearch.addEventListener('input', function () {
      var query = sectorSearch.value.trim().toLowerCase();
      var visible = 0;
      sectorNavItems.forEach(function (item) {
        var matched = !query || item.getAttribute('data-sector-search').toLowerCase().indexOf(query) !== -1;
        item.hidden = !matched;
        if (matched) visible += 1;
      });
      if (sectorSearchEmpty) sectorSearchEmpty.hidden = visible !== 0;
    });
  }

  var content = main && main.querySelector('.content-with-agent');
  if (content && !content.querySelector('.agent-drawer')) {
    content.insertAdjacentHTML(
      'beforeend',
      '<aside class="agent-drawer" id="agent" aria-hidden="true">' +
      '  <div class="agent-hd"><div class="info">' +
      '    <div class="t" id="agent-title">今日市场</div>' +
      '    <div class="s" id="agent-sub">行情 · 助手</div>' +
      '  </div><button type="button" class="x" id="agent-close" aria-label="关闭">×</button></div>' +
      '  <div class="agent-body">' +
      '    <div class="msg"><div class="who">系统</div>' +
      '      <span id="agent-body-text">将打包当前页的客观数据，判断由你的模型给出。</span></div>' +
      '    <div class="suggest" id="agent-suggest">' +
      '      <button type="button">当前上下文下主线是什么？</button>' +
      '      <button type="button">列出 3 个可验证点</button>' +
      '      <button type="button">有哪些数据缺口？</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="agent-ft">' +
      '    <input type="text" placeholder="追问…" id="agent-input" />' +
      '    <button type="button" id="agent-send">发送</button>' +
      '  </div>' +
      '</aside>'
    );
  }

  if (main) {
    var scroller = main.querySelector('.page-body');
    var navItems = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-target]'));
    var targets = navItems.map(function (item) {
      return { item: item, target: document.getElementById(item.getAttribute('data-scroll-target')) };
    }).filter(function (entry) { return entry.target; });

    function setActive(target) {
      navItems.forEach(function (item) {
        var active = item.getAttribute('data-scroll-target') === target.id;
        item.classList.toggle('on', active);
        if (active) item.setAttribute('aria-current', 'location');
        else item.removeAttribute('aria-current');
      });
    }

    function syncActive() {
      if (!scroller || !targets.length) return;
      var rootTop = scroller.getBoundingClientRect().top;
      var current = targets[0];
      targets.forEach(function (entry) {
        if (entry.target.getBoundingClientRect().top - rootTop <= 72) current = entry;
      });
      setActive(current.target);
    }

    navItems.forEach(function (item) {
      item.addEventListener('click', function () {
        var target = document.getElementById(item.getAttribute('data-scroll-target'));
        if (!target || !scroller) return;
        scroller.scrollBy({
          top: target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12,
          behavior: 'smooth',
        });
        setActive(target);
      });
    });
    if (scroller) scroller.addEventListener('scroll', syncActive, { passive: true });
    syncActive();
  }
  document.body.appendChild(shell);
  window.MKT_PATHS = { rootBase: rootBase, mktBase: mktBase, view: view };
})();
