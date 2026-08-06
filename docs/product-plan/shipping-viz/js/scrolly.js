/* scrolly.js — 三个 Scrollama scrolly（股价 7 步 / 曲线 7 步 / 牌桌 4 步） */
(function () {
  "use strict";

  function makeScrolly(scrollyId, onStep) {
    var container = document.getElementById(scrollyId);
    var steps = container.querySelectorAll(".step");
    var scroller = scrollama();
    scroller
      .setup({ step: container.querySelectorAll(".step"), offset: 0.62 })
      .onStepEnter(function (resp) {
        steps.forEach(function (s) { s.classList.remove("active"); });
        resp.element.classList.add("active");
        onStep(parseInt(resp.element.dataset.idx, 10));
      });
    window.addEventListener("resize", function () { scroller.resize(); });
    return scroller;
  }

  function init() {
    makeScrolly("scrolly-stock", function (i) {
      window.CHARTS.stockState.update(i);
    });
    makeScrolly("scrolly-curves", function (i) {
      window.CHARTS.curvesState.update(i);
    });
    makeScrolly("scrolly-cohort", function (i) {
      window.CHARTS.cohortState.update(i);
    });

    // 初始状态
    window.CHARTS.stockState.update(0);
    window.CHARTS.curvesState.update(0);
    window.CHARTS.cohortState.update(0);
  }

  window.SCROLLY = { init: init };
})();
