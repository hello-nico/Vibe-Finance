/**
 * 投研助手 · 主题切换
 * 与 Vibe-Research 对齐：亮色挂 html.light；暗色去掉 .light
 * 循环：amber(Research light) → mint(微绿画布) → dark(Research dark)
 */
(function () {
  var KEY = "vf-theme";
  var ORDER = ["amber", "mint", "dark"];
  var VALID = { amber: 1, mint: 1, dark: 1 };

  var NEXT_UI = {
    amber: {
      next: "mint",
      label: "浅绿",
      icon:
        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>' +
        '<path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    },
    mint: {
      next: "dark",
      label: "暗色",
      icon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/>',
    },
    dark: {
      next: "amber",
      label: "暖橙",
      icon:
        '<circle cx="12" cy="12" r="4"/>' +
        '<path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    },
  };

  function read() {
    try {
      var t = localStorage.getItem(KEY);
      if (t && VALID[t]) return t;
    } catch (e) {}
    return "amber";
  }

  function apply(theme) {
    if (!VALID[theme]) theme = "amber";
    var root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // Research：亮色 classList.add("light")
    if (theme === "dark") {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
    syncButton(theme);
  }

  function syncButton(theme) {
    var ui = NEXT_UI[theme] || NEXT_UI.amber;
    var ico =
      '<svg class="theme-ico" viewBox="0 0 24 24" aria-hidden="true">' +
      ui.icon +
      "</svg>";

    // rail 底主题钮：仅图标（对齐 Research 侧栏底）
    document.querySelectorAll(".rail-theme").forEach(function (btn) {
      btn.setAttribute("data-current", theme);
      btn.setAttribute("data-next", ui.next);
      btn.setAttribute("aria-label", "切换为" + ui.label);
      btn.title = "切换为" + ui.label;
      btn.innerHTML = ico;
    });
  }

  apply(read());

  window.VFTheme = {
    apply: apply,
    read: read,
    sync: function () {
      syncButton(read());
    },
    next: function () {
      var ui = NEXT_UI[read()] || NEXT_UI.amber;
      apply(ui.next);
    },
    themes: ORDER.slice(),
  };
})();
