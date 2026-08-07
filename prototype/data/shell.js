/**
 * 数据 Mode · 壳层（topbar + rail + data-nav + agent dock）
 * 二级栏：数据源 | 研究资料 | 配置。
 * 用法：<div id="shell-root" data-view="sources|materials|config"></div>
 *      先引 data.js，再引本文件，最后 agent.js。
 */
(function () {
  var root = document.getElementById('shell-root');
  if (!root) return;
  var view = root.getAttribute('data-view') || 'sources';

  var inDataDir = /\/data\/[^/]+\.html$/.test(location.pathname);
  var rootBase = inDataDir ? '../' : '';
  var dataBase = inDataDir ? '' : 'data/';

  var VIEWS = [
    { id: 'sources', href: rootBase + '03-data.html', n: '数据源', m: '通道 · 状态 · 节奏' },
    { id: 'materials', href: dataBase + 'materials.html', n: '研究资料', m: '你上传的 · 可恢复' },
    { id: 'config', href: dataBase + 'config.html', n: '配置', m: '规则 · Skills · 变更记录' },
  ];

  var tabs = VIEWS.map(function (v) {
    return '<a class="mkt-tab' + (v.id === view ? ' on' : '') + '" href="' + v.href + '">' + v.n + '</a>';
  }).join('');

  function subNav() {
    if (view === 'sources') {
      var items = [
        ['sec-channels', '数据通道', '七个业务通道'],
        ['sec-rhythm', '主动获取节奏', '按需 · 每日 · 披露窗口'],
      ];
      return (
        '<div class="mkt-sub show" aria-label="本页内容">' +
        '  <div class="mkt-sub-count">本页内容</div>' +
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
    if (view === 'materials') {
      return (
        '<div class="mkt-sub show" aria-label="按状态筛选">' +
        '  <div class="mkt-sub-count">按状态筛选</div>' +
        '  <div class="mkt-sub-list">' +
        '    <button type="button" class="mkt-sub-item on" data-mat-filter="all"><div class="n">全部</div><div class="m">所有上传资料</div></button>' +
        '    <button type="button" class="mkt-sub-item" data-mat-filter="ok"><div class="n">已解析</div><div class="m">已进入研究档案</div></button>' +
        '    <button type="button" class="mkt-sub-item" data-mat-filter="fail"><div class="n">解析失败</div><div class="m">可重试或删除</div></button>' +
        '    <button type="button" class="mkt-sub-item" data-mat-filter="pending"><div class="n">待选择对象</div><div class="m">等待你确认关联</div></button>' +
        '  </div>' +
        '</div>'
      );
    }
    // config
    var items = [
      ['cfg-schema', 'Schema', '高级 · 默认折叠'],
      ['cfg-skills', '研究 Skills', '启停与适用范围'],
      ['cfg-tags', '标签', '筛选与内置标签'],
      ['cfg-fresh', '时效规则', '新鲜窗口'],
      ['sec-changes', '变更记录', '全局恢复入口'],
    ];
    return (
      '<div class="mkt-sub show" aria-label="本页内容">' +
      '  <div class="mkt-sub-count">本页内容</div>' +
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

  root.innerHTML =
    '<div class="shell market datamode" id="shell">' +
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
    '      <a class="rail-btn" href="' + rootBase + '02-research.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h8l4 4v12H7V4z"/><path d="M15 4v4h4M9 12h6M9 16h4"/></svg>' +
    '        <span>研究</span></a>' +
    '      <a class="rail-btn active" href="' + rootBase + '03-data.html">' +
    '        <svg class="rail-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5z"/><path d="M5 9h14M5 13h14M5 17h14M10 5v14M15 5v14"/></svg>' +
    '        <span>数据</span></a>' +
    '      <div class="rail-spacer"></div>' +
    '    </nav>' +
    '    <aside class="mkt-nav" aria-label="数据导航">' +
    '      <div class="mkt-tabs">' + tabs + '</div>' +
    subNav() +
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
      '    <div class="t" id="agent-title">数据</div>' +
      '    <div class="s" id="agent-sub">数据 · 助手</div>' +
      '  </div><button type="button" class="x" id="agent-close" aria-label="关闭">×</button></div>' +
      '  <div class="agent-body">' +
      '    <div class="msg"><div class="who">系统</div>' +
      '      <span id="agent-body-text">会带上当前页的通道、资料或配置状态。</span></div>' +
      '    <div class="suggest" id="agent-suggest"></div>' +
      '  </div>' +
      '  <div class="agent-ft">' +
      '    <input type="text" placeholder="追问…" id="agent-input" />' +
      '    <button type="button" id="agent-send">发送</button>' +
      '  </div>' +
      '</aside>'
    );
  }

  document.body.appendChild(shell);

  // 本页内容锚点滚动定位
  if (main) {
    var scroller = main.querySelector('.page-body');
    var navItems = Array.prototype.slice.call(document.querySelectorAll('[data-scroll-target]'));
    var targets = navItems.map(function (item) {
      return { item: item, target: document.getElementById(item.getAttribute('data-scroll-target')) };
    }).filter(function (entry) { return entry.target; });

    function setActive(target) {
      navItems.forEach(function (item) {
        item.classList.toggle('on', item.getAttribute('data-scroll-target') === target.id);
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

  window.DATA_PATHS = { rootBase: rootBase, dataBase: dataBase, view: view };
})();
