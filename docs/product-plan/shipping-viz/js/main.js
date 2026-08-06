/* main.js — 启动：渲染 13 区块 → 初始化 scrolly */
(function () {
  "use strict";
  document.addEventListener("DOMContentLoaded", function () {
    window.SECTIONS.renderAll();
    window.SCROLLY.init();
  });
})();
