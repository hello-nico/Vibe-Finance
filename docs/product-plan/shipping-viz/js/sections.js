/* sections.js — 13 个区块的 DOM 渲染、步骤文案、封面动效 */
(function () {
  "use strict";
  var D = window.DATA, UI = window.UI, C = UI.C;

  function page(pid) {
    return D.pages.filter(function (p) { return p.id === pid; })[0];
  }
  function bulletsHTML(bullets) {
    if (!bullets || !bullets.length) return "";
    return "<ul style='margin:8px 0 0 18px'>" + bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
  }

  /* ---------------- 0. 封面 ---------------- */
  function renderCover() {
    document.getElementById("cover-asof").textContent = D.meta.asof;

    // 海面：三条像素船 + 三层方波海浪
    var sea = document.getElementById("sea");
    var sailCfg = [
      { cls: "sail-1", type: "container", px: 6, scale: 1 },
      { cls: "sail-2", type: "dry", px: 6, scale: 0.82 },
      { cls: "sail-3", type: "tanker", px: 6, scale: 0.7 }
    ];
    sailCfg.forEach(function (s) {
      var d = document.createElement("div");
      d.className = "sail " + s.cls;
      var inner = document.createElement("div");
      inner.className = "sail-inner";
      inner.style.transform = "scale(" + s.scale + ")";
      inner.appendChild(window.PIXEL.makeShip(s.type, s.px));
      d.appendChild(inner);
      sea.appendChild(d);
    });

    // 方波海浪：96/72/48px，7s 正 / 11s 反 / 9s 正
    var waveCfg = [
      { cls: "wave-1", bottom: 96, color: C.ink, op: 0.16 },
      { cls: "wave-2", bottom: 72, color: C.container, op: 0.14 },
      { cls: "wave-3", bottom: 48, color: C.ink, op: 0.10 }
    ];
    waveCfg.forEach(function (w) {
      var div = document.createElement("div");
      div.className = "wave " + w.cls;
      div.style.bottom = w.bottom + "px";
      var W = 2400, H = 22, path = "M0," + H + " L0,8 ";
      for (var x = 0; x < W; x += 96) {
        path += "L" + (x + 48) + ",8 L" + (x + 48) + "," + H + " L" + (x + 96) + "," + H + " L" + (x + 96) + ",8 ";
      }
      path += "L" + W + "," + H + " Z";
      div.innerHTML = '<svg width="100%" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" style="display:block">' +
        '<path d="' + path + '" fill="' + w.color + '" fill-opacity="' + w.op + '"/></svg>';
      sea.appendChild(div);
    });

    // 三个订单簿指标：进入视口后 1400ms cubic-out 数到目标值
    var wrap = document.getElementById("cover-stats");
    D.cover_stats.forEach(function (st) {
      var color = UI.SECTOR_COLOR[st.key];
      var div = document.createElement("div");
      div.className = "cover-stat";
      var dec = st.value % 1 ? 1 : 0;
      div.innerHTML =
        '<div class="cs-num" style="color:' + color + '" data-target="' + st.value + '" data-dec="' + dec + '">0' + st.suffix + "</div>" +
        '<div class="cs-bar" style="background:' + color + ";width:" + Math.round(st.value / 38.7 * 150) + 'px"></div>' +
        '<div class="cs-label">' + st.label + "</div>";
      div.addEventListener("mousemove", function (e) {
        UI.tip('<div class="tt-title">' + st.label + "</div><div>" + st.note + "</div>" +
          '<div style="opacity:.75">来源：' + st.source.label + "</div>", e.clientX, e.clientY);
      });
      div.addEventListener("mouseleave", UI.tipHide);
      div.addEventListener("click", function () {
        document.getElementById("orderbook").scrollIntoView({ behavior: "smooth" });
      });
      wrap.appendChild(div);
    });

    var counted = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || counted) return;
        counted = true;
        wrap.querySelectorAll(".cs-num").forEach(function (el) {
          var target = parseFloat(el.dataset.target), dec = parseInt(el.dataset.dec, 10);
          var ease = d3.easeCubicOut;
          var timer = d3.timer(function (elapsed) {
            var t = Math.min(1, elapsed / 1400);
            el.textContent = (target * ease(t)).toFixed(dec) + "%";
            if (t >= 1) timer.stop();
          });
        });
      });
    }, { threshold: 0.4 });
    io.observe(wrap);
  }

  /* ---------------- 1. 时钟导语 ---------------- */
  function renderClocksIntro() {
    var ab = D.answer_box;
    var el = document.getElementById("clocks-intro");
    var html = "<p>" + ab.why_closest_or_none + "</p>" +
      '<p style="font-size:14px;color:var(--gray)">' + ab.mapping_implication + "</p>";
    el.innerHTML = html;
  }

  /* ---------------- scrolly 步骤文案 ---------------- */
  function ev(i) { return D.events[i]; }
  var STOCK_STEPS = [
    { kicker: "STEP 1 / 7 · 全景", title: "十九年，一张图",
      text: function () { return page("p03_stockline").claim + " 共 225 个月前复权月线（2007-06 → 2026-07），8 个事件钉可点击。"; } },
    { kicker: "STEP 2 / 7 · 2007 顶点上市", title: "周期顶点是最好的发行窗口",
      text: function () { return ev(0).detail + "；" + ev(1).detail; } },
    { kicker: "STEP 3 / 7 · 2013 披星戴帽", title: "*ST 远洋",
      text: function () { return ev(2).detail; } },
    { kicker: "STEP 4 / 7 · 2016 换名求生", title: "重组求生",
      text: function () { return ev(3).detail; } },
    { kicker: "STEP 5 / 7 · 2020 地板", title: "疫情前夜 1.33 元",
      text: function () { return ev(4).detail; } },
    { kicker: "STEP 6 / 7 · 2021 十倍", title: "十倍行情",
      text: function () { return ev(5).detail; } },
    { kicker: "STEP 7 / 7 · 2024/2026 事件红利", title: "红海与霍尔木兹",
      text: function () { return ev(6).detail + "；" + ev(7).detail; } }
  ];

  var CURVES_STEPS = [
    { kicker: "STEP 1 / 7 · 三套口径", title: "分图分口径",
      text: function () { return page("p04_freight_long").claim + " 三个面板共用 1988–2026 时间轴；披露点只画点、不连线。"; } },
    { kicker: "STEP 2 / 7 · 1988–2002 缺口", title: "缺口本身就是证据",
      text: function () { return page("p05_archaeology").claim + " " + page("p05_archaeology").bullets[0] + "。"; } },
    { kicker: "STEP 3 / 7 · 2003–2008", title: "需求是真繁荣，订单是借来的",
      text: function () { return page("p07_w1_supercycle").claim; } },
    { kicker: "STEP 4 / 7 · 2009–2016", title: "八年出清",
      text: function () { return page("p08_w2_clearing").claim; } },
    { kicker: "STEP 5 / 7 · 2017–2019", title: "脆弱复苏",
      text: function () { return page("p10_w3_imo2020").claim; } },
    { kicker: "STEP 6 / 7 · 2020–2022", title: "集运上天、油运入地、干散迟到",
      text: function () { return page("p11_w4_covid").claim; } },
    { kicker: "STEP 7 / 7 · 2023–2026", title: "两个事件峰夹着一个失望的 2025",
      text: function () {
        return "SCFI 3733.80（2024-07-05）随袭击暂停回落；2026 年双走廊首次同时受阻，SCFI 报 3184.83。同期 BDI 2944（同比 +101%）、BDTI 2031——三条曲线再度分叉。";
      } }
  ];

  var COHORT_STEPS = [
    { kicker: "STEP 1 / 4 · 2008 满桌", title: "先认识旧牌桌",
      text: function () { return page("p06_cohort").claim + " 26 张船牌：集运 13、干散 8、油运 5。"; } },
    { kicker: "STEP 2 / 4 · 破产与重整", title: "出清以三种形式完成",
      text: function () {
        return "韩进 2016-08-31 接管、2017-02-17 宣告破产（集运 50 余年最大破产）；Genco 2014 预重整 Chapter 11 走出；DryShips 反复并股退出公开市场；OSG 2012 申请、2014 走出。";
      } },
    { kicker: "STEP 3 / 4 · 并购与救助", title: "减员靠并购，续命靠国家",
      text: function () {
        return "APL→CMA CGM、Hamburg Süd→Maersk、OOCL→中远海运、Eagle→Star Bulk、Golden Ocean→CMB.TECH、ZIM→Hapag（待批）；HMM 2016 债权人主导重组、KDB 入主。";
      } },
    { kicker: "STEP 4 / 4 · 2026 终局", title: "一半已不在场上",
      text: function () { return D.table_cohort_legend.note + " 留在桌上的：survivor / renamed / restructured。"; } }
  ];

  function renderSteps(containerId, steps) {
    var wrap = document.getElementById(containerId);
    steps.forEach(function (s, i) {
      var div = document.createElement("div");
      div.className = "step";
      div.dataset.idx = i;
      div.innerHTML = '<div class="step-kicker">' + s.kicker + "</div><h4>" + s.title + "</h4><p>" + s.text() + "</p>";
      wrap.appendChild(div);
    });
  }

  /* ---------------- 8. 打分卡 ---------------- */
  var ROLE_META = {
    "same_case": { label: "同一剧本", color: "#C0392B" },
    "same_case（事件样本）": { label: "同一剧本（事件样本）", color: "#D46A5E" },
    "mixed": { label: "半真半假", color: "#C9A227" },
    "different_case": { label: "不同剧本", color: "#1F8A70" },
    "negative_control": { label: "对照组（缺口）", color: "#8C8577" }
  };
  function renderScorecard() {
    var sc = D.table_analog_scorecard;
    var wrap = document.getElementById("scorecard-rows");
    sc.rows.forEach(function (r) {
      var role = ROLE_META[r["same/different"]] || { label: r["same/different"], color: C.gray };
      var row = document.createElement("div");
      row.className = "score-row";
      row.innerHTML =
        '<div class="score-cell"><div class="score-win">' + r["窗口"] + '</div><div class="score-driver">' + r["主驱动"] + "</div></div>" +
        '<div class="score-cell score-mid"><b>' + r["机制一句话"] + "</b><br>运价：" + r["运价峰谷"] + " · 订单簿：" + r["订单簿"] + "</div>" +
        '<div class="score-role" style="background:' + role.color + '">' + role.label + "</div>";
      row.addEventListener("click", function () {
        UI.openModal({
          title: "窗口 " + r["窗口"],
          tags: [{ text: role.label, color: role.color }, { text: r["主驱动"], color: C.ink2 }],
          desc: "机制：" + r["机制一句话"] + "\n主驱动：" + r["主驱动"] +
            "\n运价峰谷：" + r["运价峰谷"] + "\n订单簿：" + r["订单簿"] +
            "\n公司结局：" + r["公司结局"],
          sources: sc.source, asof: sc.asof
        });
      });
      wrap.appendChild(row);
    });

    // 被拒绝的类比
    var rj = D.table_rejected;
    var rb = document.getElementById("rejected-block");
    rb.innerHTML = '<h3 style="margin:34px 0 14px;font-size:22px">被排除的类比：<span style="color:var(--red)">形状相似 ≠ 机制相似</span></h3>';
    rj.rows.forEach(function (r) {
      var div = document.createElement("div");
      div.className = "rejected-card";
      div.innerHTML = "<h4>✕ " + r["候选类比"] + "</h4><p><b>为什么诱人：</b>" + r["为什么诱人"] +
        "<br><b>为什么排除：</b>" + r["为什么排除"] + "</p>";
      rb.appendChild(div);
    });
    UI.sourceLine("src-scorecard", (sc.source || []).concat(rj.source || []).filter(function (s, i, arr) {
      return arr.findIndex(function (x) { return x.label === s.label; }) === i;
    }), sc.asof);
  }

  /* ---------------- 10. 三行业现在时 ---------------- */
  function renderCurrent() {
    var wrap = document.getElementById("current-lanes");
    var cmpSrc = D.table_subindustry_compare.source;
    // 原版每条航道 4 张大数字卡：当前运价 / 订单簿占船队 / 需求驱动 / 当前阶段
    var KEEP = ["当前运价", "订单簿占船队", "需求驱动", "当前阶段"];
    D.current_lanes.forEach(function (lane) {
      var color = UI.SECTOR_COLOR[lane.key];
      var block = document.createElement("div");
      block.className = "lane-block";

      var strips = D.stage_strips[lane.key];
      var segs = strips.map(function (s) {
        var cur = s.current;
        return '<div class="strip-seg' + (cur ? " current" : "") + '"' +
          (cur ? ' style="background:' + color + '"' : "") + ">" +
          (cur ? '<div class="strip-marker"><span class="mk-ship"></span><div class="mk-text" style="color:' + color + '">▼ 现在在这</div></div>' : "") +
          '<div class="seg-label">' + s.label + '</div><div class="seg-period">' + s.period + "</div></div>";
      }).join("");

      var nums = lane.numbers.filter(function (n) { return KEEP.indexOf(n.label) >= 0; });
      block.innerHTML =
        '<div class="lane-head"><h3 style="color:' + color + '">' + lane.name + '</h3><span class="lane-en">' + lane.title + "</span></div>" +
        '<div class="strip-wrap"><div class="strip">' + segs + "</div></div>" +
        '<div class="num-cards">' + nums.map(function (n) {
          return '<div class="num-card"><div class="nc-v" style="color:' + color + '">' + n.value + '</div><div class="nc-l">' + n.label + "</div></div>";
        }).join("") + "</div>" +
        '<p class="lane-verdict"><b>判定：</b>' + lane.verdict + "</p>" +
        '<ul class="lane-bullets">' + lane.bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
      wrap.appendChild(block);
      var shipHolder = block.querySelector(".mk-ship");
      if (shipHolder) {
        var ship = window.PIXEL.makeShip(lane.ship, 1.6);
        ship.style.display = "inline-block";
        shipHolder.appendChild(ship);
      }
    });
    // 来源行在整个 section 底部只渲染一次
    UI.sourceLine("src-current", cmpSrc, D.table_subindustry_compare.asof);
  }

  /* ---------------- 11. 监控仪表盘 ---------------- */
  var STATUS_META = {
    met: { label: "已确认", color: "#2E8B57" },
    partial: { label: "部分", color: "#C9A227" },
    missing: { label: "缺失", color: "#C0392B" }
  };
  function familyColor(f) {
    if (f === "price") return "#0E67B5";
    if (f === "capacity") return "#C25E28";
    return "#C0392B";
  }
  function renderSignals() {
    var wrap = document.getElementById("signals-grid");
    D.signals.forEach(function (s) {
      var st = STATUS_META[s.status] || { label: s.status, color: C.gray };
      var card = document.createElement("div");
      card.className = "signal-card";
      card.innerHTML =
        '<div class="signal-top"><span class="status-dot" style="background:' + st.color + '"></span>' +
        '<span class="signal-name">' + s.label + '</span>' +
        '<span class="family-tag" style="background:' + familyColor(s.signal_family) + '">' + s.signal_family + "</span></div>" +
        '<div class="signal-row"><b>现值</b> <span class="sv">' + s.current_value + "</span></div>" +
        '<div class="signal-row"><b>阈值</b> ' + s.threshold + "</div>" +
        '<div class="signal-row"><b>时滞</b> ' + s.expected_lag + "</div>" +
        '<div class="signal-row"><b>证伪</b> ' + s.falsifier + "</div>" +
        '<div class="signal-foot">状态：' + st.label + " · 来源：" + s.source + ' · <span class="mono">' + s.asof + "</span></div>";
      wrap.appendChild(card);
    });
    UI.sourceLine("src-signals", [
      { label: "signals 工作表：8 个监控信号的阈值 / 时滞 / 证伪与来源（见各卡）", url: null },
      { label: "上海航交所官网（SCFI/CCFI 2026-07-10）", url: "https://www.sse.net.cn/index/singleIndex?indexType=scfi" }
    ], D.meta.asof);
  }

  /* ---------------- 12. 缺口与出处 ---------------- */
  function renderGaps() {
    var gap = D.table_gap_register;
    var gt = document.getElementById("gap-table");
    var html = '<h3 style="margin-bottom:14px;font-size:22px">' + gap.title + "</h3><table><thead><tr><th>缺口</th><th>影响范围</th><th>处理方式</th></tr></thead><tbody>";
    gap.rows.forEach(function (r) {
      html += "<tr><td>" + r["缺口"] + "</td><td>" + r["影响范围"] + "</td><td>" + r["处理方式"] + "</td></tr>";
    });
    html += "</tbody></table>";
    html += UI.sourceHTML(gap.source, gap.asof);
    gt.innerHTML = html;

    var lb = document.getElementById("limitations-block");
    lb.innerHTML = '<h3 style="margin-bottom:12px;font-size:22px">这份报告不能回答什么（limitations 前 9 条）</h3><ol>' +
      D.limitations.slice(0, 9).map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ol>";

    var fm = document.getElementById("footer-meta");
    fm.innerHTML =
      '<div><span class="fm-k">source pack</span>' + D.meta.source_pack + "</div>" +
      '<div><span class="fm-k">报告标题</span>' + D.meta.title + "</div>" +
      '<div><span class="fm-k">run id</span>' + D.meta.run_id + "</div>" +
      '<div><span class="fm-k">数据截至</span>' + D.meta.asof + "</div>" +
      '<div><span class="fm-k">参考说明</span>本页的 scrollytelling 结构（sticky 图 + 步骤卡、披露点不连线、像素图标实时生成）参考 The Pudding 的数据叙事范式，逐条对应见项目 NOTES-pudding.md。</div>' +
      '<div class="disclaimer">免责声明：' + D.limitations[10] + "</div>";
  }

  /* ---------------- 来源行 ---------------- */
  function renderSources() {
    UI.sourceLine("src-stock", [
      { label: "akshare stock_zh_a_daily(adjust=qfq)，日线重采样为月末 OHLCV（前复权）", url: null },
      { label: "财新周刊 2022-11-05《中远备战新周期》", url: "https://weekly.caixin.com/2022-11-05/101960892.html" },
      { label: "东方财富 2013-03-28：中国远洋更名 *ST 远洋", url: "https://wap.eastmoney.com/a/20130328281780968.html" }
    ], D.meta.asof);
    var cm = D.chart_meta;
    var curveSrc = [];
    ["chart_scfi_points", "chart_bdi_monthly", "chart_bdti_monthly"].forEach(function (k) {
      (cm[k] && cm[k].source || []).forEach(function (s) {
        if (!curveSrc.find(function (x) { return x.label === s.label; })) curveSrc.push(s);
      });
    });
    UI.sourceLine("src-curves", curveSrc, D.meta.asof);
    UI.sourceLine("src-cohort", D.table_cohort_legend.source, D.table_cohort_legend.asof);
    UI.sourceLine("src-orderbook", D.orderbook.source, D.orderbook.asof);
    var llSrc = [];
    [D.leadlag.container, D.leadlag.tanker].forEach(function (cfg) {
      (cfg.source || []).forEach(function (s) {
        if (!llSrc.find(function (x) { return x.label === s.label; })) llSrc.push(s);
      });
    });
    UI.sourceLine("src-leadlag", llSrc, D.leadlag.container.asof);
    UI.sourceLine("src-bridge", D.table_subindustry_compare.source, D.table_subindustry_compare.asof);
  }

  /* ---------------- 总装 ---------------- */
  function renderAll() {
    renderCover();
    renderClocksIntro();
    window.CHARTS.buildClocks(document.getElementById("clocks-dials"));

    renderSteps("steps-stock", STOCK_STEPS);
    window.CHARTS.buildStockline(document.getElementById("chart-stock"));

    renderSteps("steps-curves", CURVES_STEPS);
    window.CHARTS.buildCurves(document.getElementById("chart-curves"));

    renderSteps("steps-cohort", COHORT_STEPS);
    window.CHARTS.buildCohort(document.getElementById("chart-cohort"));

    window.CHARTS.buildQuarterly(
      document.getElementById("chart-quarterly"),
      document.getElementById("q-btns"),
      document.getElementById("q-note"),
      document.getElementById("src-quarterly")
    );
    window.CHARTS.buildOrderbook(document.getElementById("chart-orderbook"));
    window.CHARTS.buildLeadlag(document.getElementById("chart-leadlag"));
    renderScorecard();
    window.CHARTS.buildBridge(document.getElementById("chart-bridge"));
    renderCurrent();
    renderSignals();
    renderGaps();
    renderSources();
  }

  window.SECTIONS = { renderAll: renderAll };
})();
