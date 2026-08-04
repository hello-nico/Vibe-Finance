/**
 * 全站左栏开合 + rail 底三件套（对齐 Research）：
 *   主题 · 用户 · << / >>
 * 收起 = 只留 icon rail；展开 = rail + 二级栏。
 * 持久化：localStorage vf-nav = collapsed | expanded
 */
(function () {
  var KEY = 'vf-nav';
  var ICO_LEFT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/></svg>';
  var ICO_RIGHT =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/></svg>';
  var ICO_USER =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/></svg>';
  var ICO_MOON =
    '<svg class="theme-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></svg>';

  function readCollapsed() {
    try {
      return localStorage.getItem(KEY) === 'collapsed';
    } catch (e) {
      return false;
    }
  }

  function writeCollapsed(on) {
    try {
      localStorage.setItem(KEY, on ? 'collapsed' : 'expanded');
    } catch (e) { /* ignore */ }
  }

  function ensureDock(shell) {
    var existing = shell.querySelector(':scope > .nav-dock');
    if (existing) return existing;

    var rail = shell.querySelector(':scope > .rail');
    if (!rail) return null;

    var dock = document.createElement('div');
    dock.className = 'nav-dock';
    dock.setAttribute('aria-label', '主导航');

    var secondary = shell.querySelector(':scope > .mkt-nav, :scope > .obj-nav, :scope > .data-nav');
    shell.insertBefore(dock, rail);
    dock.appendChild(rail);
    if (secondary) dock.appendChild(secondary);
    return dock;
  }

  /** rail 底：主题 / 用户 /（可选）开合 — 替换旧头像 */
  function ensureRailFoot(rail, withToggle) {
    var avatar = rail.querySelector('.rail-avatar');
    if (avatar) avatar.remove();

    // 旧版把 collapse 直接挂在 rail 上，迁入 foot
    var looseToggle = rail.querySelector(':scope > .nav-collapse-btn');

    var foot = rail.querySelector('.rail-foot');
    if (!foot) {
      foot = document.createElement('div');
      foot.className = 'rail-foot';
      rail.appendChild(foot);
    }

    if (!rail.querySelector('.rail-spacer')) {
      var sp = document.createElement('div');
      sp.className = 'rail-spacer';
      rail.insertBefore(sp, foot);
    }

    var themeBtn = foot.querySelector('.rail-theme');
    if (!themeBtn) {
      themeBtn = document.createElement('button');
      themeBtn.type = 'button';
      themeBtn.className = 'rail-ico-btn rail-theme';
      themeBtn.setAttribute('aria-label', '切换主题');
      themeBtn.title = '切换主题';
      themeBtn.innerHTML = ICO_MOON;
      themeBtn.addEventListener('click', function () {
        if (window.VFTheme) window.VFTheme.next();
      });
      foot.appendChild(themeBtn);
    } else if (!themeBtn.innerHTML) {
      themeBtn.innerHTML = ICO_MOON;
      if (!themeBtn.getAttribute('aria-label')) {
        themeBtn.setAttribute('aria-label', '切换主题');
        themeBtn.title = '切换主题';
      }
    }

    var userBtn = foot.querySelector('.rail-user');
    if (!userBtn) {
      userBtn = document.createElement('button');
      userBtn.type = 'button';
      userBtn.className = 'rail-ico-btn rail-user';
      userBtn.title = '账户';
      userBtn.setAttribute('aria-label', '账户');
      userBtn.innerHTML = ICO_USER;
      foot.appendChild(userBtn);
    }

    var toggleBtn = foot.querySelector('.nav-collapse-btn');
    if (looseToggle && looseToggle.parentNode !== foot) {
      foot.appendChild(looseToggle);
      toggleBtn = looseToggle;
      toggleBtn.classList.add('rail-ico-btn');
    }

    if (withToggle) {
      if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'rail-ico-btn nav-collapse-btn';
        foot.appendChild(toggleBtn);
      } else {
        toggleBtn.classList.add('rail-ico-btn');
      }
    } else if (toggleBtn) {
      toggleBtn.remove();
      toggleBtn = null;
    }

    // 顺序固定：主题 → 用户 → 开合
    if (themeBtn) foot.appendChild(themeBtn);
    if (userBtn) foot.appendChild(userBtn);
    if (toggleBtn) foot.appendChild(toggleBtn);

    if (window.VFTheme && typeof window.VFTheme.sync === 'function') {
      window.VFTheme.sync();
    }

    return toggleBtn;
  }

  function emitLayout() {
    window.dispatchEvent(new CustomEvent('vf:nav-layout'));
    window.dispatchEvent(new CustomEvent('mkt:agent-layout'));
  }

  function bind(shell) {
    var dock = ensureDock(shell);
    if (!dock) return null;

    var rail = dock.querySelector('.rail');
    var secondary = dock.querySelector('.mkt-nav, .obj-nav, .data-nav');
    var edge = shell.querySelector(':scope > .nav-edge-toggle');
    if (edge) edge.remove();

    var toggleBtn = ensureRailFoot(rail, !!secondary);
    if (!secondary || !toggleBtn) return null;

    function apply(collapsed, persist) {
      shell.classList.toggle('nav-collapsed', collapsed);
      toggleBtn.innerHTML = collapsed ? ICO_RIGHT : ICO_LEFT;
      toggleBtn.setAttribute('aria-label', collapsed ? '展开导航' : '收起导航');
      toggleBtn.title = collapsed ? '展开导航' : '收起导航';
      toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      secondary.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
      if ('inert' in secondary) secondary.inert = collapsed;
      if (persist !== false) writeCollapsed(collapsed);
      emitLayout();
    }

    toggleBtn.addEventListener('click', function (e) {
      e.preventDefault();
      apply(!shell.classList.contains('nav-collapsed'));
    });

    // 当前 Mode 的 rail 始终切换二级栏；跨 Mode → 落地页展开。
    rail.querySelectorAll('a.rail-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (btn.classList.contains('active')) {
          e.preventDefault();
          apply(!shell.classList.contains('nav-collapsed'));
          return;
        }
        writeCollapsed(false);
      });
    });

    dock.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'width' || e.propertyName === 'max-width') emitLayout();
    });

    apply(readCollapsed(), false);

    var api = {
      collapse: function () { apply(true); },
      expand: function () { apply(false); },
      toggle: function () { apply(!shell.classList.contains('nav-collapsed')); },
      isCollapsed: function () { return shell.classList.contains('nav-collapsed'); },
    };
    window.VF_NAV = api;
    return api;
  }

  function init() {
    var shell = document.getElementById('shell');
    if (!shell) return;
    var rail = shell.querySelector('.rail');
    if (!rail) return;

    // 无二级栏时仍装主题/用户
    var dock = ensureDock(shell);
    var secondary = dock && dock.querySelector('.mkt-nav, .obj-nav, .data-nav');
    if (!secondary) {
      ensureRailFoot(rail, false);
      return;
    }
    bind(shell);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
