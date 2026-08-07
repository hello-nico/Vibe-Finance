/**
 * 研究 Mode · 壳层（topbar + rail + res-nav + agent dock）
 * 二级栏：行业 | 个股 Tab（主页内切换）；对象页补充骨架目录与返回。
 * 用法：<div id="shell-root" data-view="home|object"></div>
 *      先引 data.js，再引本文件，最后 agent.js。
 */
(function () {
  var root = document.getElementById('shell-root');
  if (!root) return;
  var view = root.getAttribute('data-view') || 'home';

  var inResDir = /\/research\/[^/]+\.html$/.test(location.pathname);
  var rootBase = inResDir ? '../' : '';

  var homeHref = rootBase + '02-research.html';
  var homeTab = new URLSearchParams(location.search).get('tab') || 'stocks';

  function homeTabs() {
    var tabs = [
      { id: 'stocks', n: '个股' },
      { id: 'industries', n: '行业' },
    ];
    return '<div class="mkt-tabs">' + tabs.map(function (t) {
      return '<a class="mkt-tab' + (t.id === homeTab ? ' on' : '') + '" href="' + homeHref + '?tab=' + t.id + '">' + t.n + '</a>';
    }).join('') + '</div>';
  }

  function resNav() {
    if (view === 'object') {
      var sections = window.RES_OBJECT_SECTIONS || [
        ['sec-health', '健康评估', '四态 · 原因 · 改变条件'],
        ['sec-indicators', '实时指标', '价格 · 变量 · 先行指标'],
        ['sec-report', '当前报告', '判断 · 拆分 · 估值 · 证伪'],
        ['sec-evidence', '研究依据', '档案 · 事实 · 关系 · 缺口'],
        ['sec-relations', '关系', '所属行业 · 关联对象'],
      ];
      return (
        '<div class="mkt-sub show" aria-label="对象页目录">' +
        '  <a class="mkt-sub-back" href="' + homeHref + '">← 返回研究列表</a>' +
        '  <div class="mkt-sub-list">' +
        sections.map(function (item, index) {
          return '<button type="button" class="mkt-sub-item' + (index === 0 ? ' on' : '') +
            '" data-scroll-target="' + item[0] + '">' +
            '<div class="n">' + item[1] + '</div><div class="m">' + item[2] + '</div></button>';
        }).join('') +
        '  </div>' +
        '</div>'
      );
    }
    // home：二级 Tab（行业 | 个股）在侧边栏顶部；下方为当前 Tab 的列表筛选
    return (
      homeTabs() +
      '<div class="mkt-sub show" aria-label="列表筛选">' +
      '  <div class="mkt-sub-count">列表筛选</div>' +
      '  <div class="mkt-sub-list">' +
      '    <button type="button" class="mkt-sub-item on" data-filter="all"><div class="n">全部</div><div class="m">含待复核与未查看</div></button>' +
      '    <button type="button" class="mkt-sub-item" data-filter="pending"><div class="n">待复核</div><div class="m">越过阈值，等待深度分析</div></button>' +
      '    <button type="button" class="mkt-sub-item" data-filter="unread"><div class="n">未查看</div><div class="m">有更新还没看</div></button>' +
      '  </div>' +
      '</div>'
    );
  }

  root.innerHTML =
    '<div class="shell market research" id="shell">' +
    '  <div class="topbar">' +
    '    <span class="topbar-brand">投研助手</span>' +
    '    <div class="topbar-right">' +
    '      <button type="button" class="topbar-agent" id="btn-agent">助手</button>' +
    '    </div>' +
    '  </div>' +
    '  <div class="nav-dock" aria-label="主导航">' +
    '    <nav class="rail">' +
    '      <a class="rail-btn" href="' + rootBase + '01-market.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18h18"/><path d="M5 14l4-5 3.5 3L17 6"/><path d="M14 6h3v3"/></svg>' +
    '        <span>行情</span></a>' +
    '      <a class="rail-btn active" href="' + homeHref + '">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h8l4 4v12H7V4z"/><path d="M15 4v4h4M9 12h6M9 16h4"/></svg>' +
    '        <span>研究</span></a>' +
    '      <a class="rail-btn" href="' + rootBase + '03-data.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"/><path d="M5 9h14M5 13h14M5 17h14M10 5v14M15 5v14"/></svg>' +
    '        <span>数据</span></a>' +
    '      <div class="rail-spacer"></div>' +
    '    </nav>' +
    '    <aside class="mkt-nav" aria-label="研究导航">' +
    resNav() +
    '    </aside>' +
    '  </div>' +
    '</div>';

  var shell = document.getElementById('shell');
  var main = document.querySelector('main.main-area');
  if (main && main.parentNode !== shell) shell.appendChild(main);

  var content = main && main.querySelector('.content-with-agent');
  if (content && !content.querySelector('.agent-drawer')) {
    content.insertAdjacentHTML(
      'beforeend',
      '<aside class="agent-drawer" id="agent" aria-hidden="true">' +
      '  <div class="agent-hd"><div class="info">' +
      '    <div class="t" id="agent-title">研究</div>' +
      '    <div class="s" id="agent-sub">研究 · 助手</div>' +
      '  </div><button type="button" class="x" id="agent-close" aria-label="关闭">×</button></div>' +
      '  <div class="agent-body">' +
      '    <div class="msg"><div class="who">系统</div>' +
      '      <span id="agent-body-text">会带上当前页的研究状态、报告与依据，判断给出时会附证据。</span></div>' +
      '    <div class="suggest" id="agent-suggest"></div>' +
      '  </div>' +
      '  <div class="agent-ft">' +
      '    <input type="text" placeholder="追问…" id="agent-input" />' +
      '    <button type="button" id="agent-send">发送</button>' +
      '  </div>' +
      '</aside>'
    );
  }

  // 骨架目录滚动定位（对象页）
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
      });
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
    if (scroller && targets.length) {
      scroller.addEventListener('scroll', function () {
        var rootTop = scroller.getBoundingClientRect().top;
        var current = targets[0];
        targets.forEach(function (entry) {
          if (entry.target.getBoundingClientRect().top - rootTop <= 72) current = entry;
        });
        setActive(current.target);
      }, { passive: true });
    }
  }

  document.body.appendChild(shell);
  window.RES_PATHS = { rootBase: rootBase, view: view };
})();
