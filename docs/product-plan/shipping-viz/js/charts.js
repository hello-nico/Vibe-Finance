/* charts.js — 全部 D3 图表构建器 + 通用 UI（tooltip / 数据卡 / 来源行） */
(function () {
  "use strict";
  var D = window.DATA;

  var C = {
    paper: "#F7F2E7", paperDeep: "#EFE7D3", card: "#FDFAF2",
    ink: "#14263B", ink2: "#3D4E63", gray: "#8C8577", line: "#D8CFBA",
    container: "#0E67B5", dry: "#C25E28", tanker: "#1F8A70", red: "#C0392B",
    gold: "#C9A227", green: "#2E8B57", pieOff: "#E4DBC4"
  };

  var SECTOR_COLOR = { container: C.container, dry: C.dry, tanker: C.tanker };
  var SECTOR_NAME = { container: "集运", dry: "干散", tanker: "油运" };

  /* ---------------- 通用 UI ---------------- */
  var tooltipEl = document.getElementById("tooltip");
  function tip(html, x, y) {
    tooltipEl.innerHTML = html;
    tooltipEl.style.display = "block";
    var tx = Math.min(x + 14, window.innerWidth - 320);
    var ty = Math.min(y + 14, window.innerHeight - 140);
    tooltipEl.style.left = Math.max(4, tx) + "px";
    tooltipEl.style.top = Math.max(4, ty) + "px";
  }
  function tipHide() { tooltipEl.style.display = "none"; }

  var overlay = document.getElementById("modal-overlay");
  var modalBody = document.getElementById("modal-body");
  function openModal(o) {
    var h = "";
    if (o.title) h += "<h3>" + o.title + "</h3>";
    if (o.tags) o.tags.forEach(function (t) {
      h += '<span class="modal-tag" style="background:' + t.color + '">' + t.text + "</span>";
    });
    if (o.nums) {
      h += '<div class="modal-nums">';
      o.nums.forEach(function (n) {
        h += '<div class="modal-num"><div class="mn-v">' + n.v + '</div><div class="mn-l">' + n.l + "</div></div>";
      });
      h += "</div>";
    }
    if (o.desc) h += '<div class="modal-desc">' + o.desc + "</div>";
    h += '<div class="modal-src">' + sourceHTML(o.sources, o.asof) + "</div>";
    modalBody.innerHTML = h;
    overlay.hidden = false;
  }
  function closeModal() { overlay.hidden = true; }
  overlay.addEventListener("click", function (e) { if (e.target === overlay) closeModal(); });
  document.getElementById("modal-close").addEventListener("click", closeModal);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

  function srcItem(s) {
    if (!s || !s.label) return "";
    if (s.url) return '<a href="' + s.url + '" target="_blank" rel="noopener">' + s.label + "</a>";
    return s.label;
  }
  function sourceHTML(sources, asof) {
    sources = (sources || []).filter(function (s) { return s && s.label; });
    if (!sources.length) {
      return '<div class="src-line">' + (asof ? '<span class="asof">数据截至 ' + asof + "</span>" : "") + "</div>";
    }
    var h = '<div class="src-line">';
    if (sources.length > 1) {
      h += "<details><summary>来源：" + srcItem(sources[0]) + " 等 " + sources.length + " 项 ▸</summary><ul>";
      sources.forEach(function (s) { h += "<li>" + srcItem(s) + "</li>"; });
      h += "</ul></details>";
    } else {
      h += '<span class="src-first">来源：' + srcItem(sources[0]) + "</span>";
    }
    if (asof) h += ' <span class="asof">数据截至 ' + asof + "</span>";
    return h + "</div>";
  }
  function sourceLine(el, sources, asof) {
    if (typeof el === "string") el = document.getElementById(el);
    el.innerHTML = sourceHTML(sources, asof);
  }

  function fmt(v, dec) {
    if (v === null || v === undefined || isNaN(v)) return "—";
    if (dec === undefined) dec = Math.abs(v) >= 100 ? 0 : 2;
    return Number(v).toLocaleString("zh-CN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  /* 图宽：scrolly 容器减 400px、上限 820px；≤900px 占满 */
  function chartWidth(el) {
    var sc = el.closest(".scrolly");
    var cw = sc ? sc.clientWidth - 48 : (el.parentNode.clientWidth || 800);
    if (window.innerWidth <= 900) return Math.max(320, Math.min(cw, 820));
    return Math.max(420, Math.min(cw - 400, 820));
  }

  window.UI = {
    C: C, SECTOR_COLOR: SECTOR_COLOR, SECTOR_NAME: SECTOR_NAME,
    tip: tip, tipHide: tipHide, openModal: openModal, closeModal: closeModal,
    sourceLine: sourceLine, sourceHTML: sourceHTML, fmt: fmt, chartWidth: chartWidth
  };

  /* ================= 1. 三套时钟 ================= */
  var STAGES = ["过热顶部", "初段下行", "利润压力", "出清", "底部观察", "早期上行", "重新扩张"];
  function buildClocks(el) {
    var R = 118, size = R * 2 + 76, cx = size / 2, cy = size / 2;
    D.clocks.forEach(function (ck) {
      var card = document.createElement("div");
      card.className = "clock-card card";
      el.appendChild(card);

      var svg = d3.select(card).append("svg")
        .attr("width", size).attr("height", size)
        .attr("viewBox", "0 0 " + size + " " + size);

      var pie = d3.pie()
        .startAngle(-0.82 * Math.PI).endAngle(0.82 * Math.PI)
        .padAngle(0.012).value(function () { return 1; });
      var arc = d3.arc().innerRadius(R - 34).outerRadius(R);
      var arcs = pie(STAGES);

      var gPie = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");
      gPie.selectAll("path").data(arcs).join("path")
        .attr("d", arc)
        .attr("fill", function (d, i) { return i === ck.stageIndex ? SECTOR_COLOR[ck.key] : C.pieOff; })
        .attr("stroke", C.ink).attr("stroke-width", 0.7)
        .style("cursor", "pointer")
        .on("mousemove", function (e, d) {
          var i = arcs.indexOf(d);
          UI.tip('<div class="tt-title">阶段 ' + (i + 1) + " / 7 · " + STAGES[i] + "</div>" +
            (i === ck.stageIndex ? "<div>" + ck.name + "当前所处：" + ck.badge + "</div>" : "<div>七阶段周期框架（decision_frame.stage_taxonomy）</div>") +
            '<div style="opacity:.75">来源：decision_frame；answer_box</div>', e.clientX, e.clientY);
        })
        .on("mouseleave", UI.tipHide);

      // 阶段名（表盘外）
      gPie.selectAll("text.stage").data(arcs).join("text")
        .attr("class", "stage")
        .attr("transform", function (d) {
          var a = (d.startAngle + d.endAngle) / 2;
          var r = R + 20;
          return "translate(" + Math.sin(a) * r + "," + (-Math.cos(a) * r) + ")";
        })
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", 11)
        .attr("fill", function (d, i) { return i === ck.stageIndex ? SECTOR_COLOR[ck.key] : C.ink2; })
        .attr("font-weight", function (d, i) { return i === ck.stageIndex ? 700 : 400; })
        .text(function (d, i) { return STAGES[i]; });

      // 指针 + 轴心 + 像素船
      var cur = arcs[ck.stageIndex];
      var a = (cur.startAngle + cur.endAngle) / 2;
      var nx = Math.sin(a) * (R - 44), ny = -Math.cos(a) * (R - 44);
      var gC = svg.append("g").attr("transform", "translate(" + cx + "," + cy + ")");
      gC.append("line")
        .attr("x1", 0).attr("y1", 0).attr("x2", nx).attr("y2", ny)
        .attr("stroke", C.ink).attr("stroke-width", 3).attr("stroke-linecap", "round");
      gC.append("circle").attr("r", 6).attr("fill", C.ink);
      var shipSvg = window.PIXEL.makeShip(ck.ship, 2.2);
      shipSvg.setAttribute("x", -31); shipSvg.setAttribute("y", 16);
      gC.node().appendChild(shipSvg);

      // 表盘下信息
      var info = document.createElement("div");
      info.innerHTML =
        '<div class="clock-name">' + ck.name + '</div>' +
        '<span class="clock-badge" style="background:' + SECTOR_COLOR[ck.key] + '">' + ck.badge + '</span>' +
        '<div class="clock-index">' + ck.indexLabel + " " + UI.fmt(ck.indexValue, ck.indexValue % 1 ? 2 : 0) +
        ' <small>（' + ck.indexDate + '）</small></div>' +
        '<div class="clock-reason">' + ck.reason + '</div>' +
        UI.sourceHTML(ck.source, D.meta.asof);
      card.appendChild(info);
    });
  }

  /* ================= 2. 中远海控股价 scrolly ================= */
  var stockState = {};
  function parseDate(s) { return new Date(s + "T00:00:00"); }

  function buildStockline(el) {
    var W = UI.chartWidth(el);
    var H = 560;
    var m = { t: 46, r: 24, b: 42, l: 56 };
    var rows = D.anchor_monthly.rows.map(function (r) { return { d: parseDate(r[0]), v: r[1] }; });

    var svg = d3.select(el).append("svg")
      .attr("width", "100%").attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");

    var x = d3.scaleTime().domain([rows[0].d, rows[rows.length - 1].d]).range([m.l, W - m.r]);
    var ymax = d3.max(rows, function (r) { return r.v; });
    var y = d3.scaleLinear().domain([0, ymax * 1.18]).range([H - m.b, m.t]);

    svg.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + (H - m.b) + ")")
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(3)).tickFormat(d3.timeFormat("%Y")));
    svg.append("g").attr("class", "axis")
      .attr("transform", "translate(" + m.l + ",0)")
      .call(d3.axisLeft(y).ticks(6));
    svg.append("text").attr("x", m.l).attr("y", 20).attr("font-size", 12)
      .attr("fill", C.gray).attr("font-family", "SF Mono,Menlo,monospace")
      .text("中远海控 601919 · 前复权月线（元）· 225 个月");

    var area = d3.area().x(function (r) { return x(r.d); })
      .y0(H - m.b).y1(function (r) { return y(r.v); }).curve(d3.curveMonotoneX);
    var line = d3.line().x(function (r) { return x(r.d); })
      .y(function (r) { return y(r.v); }).curve(d3.curveMonotoneX);

    svg.append("path").datum(rows).attr("d", area)
      .attr("fill", C.container).attr("fill-opacity", 0.16);
    svg.append("path").datum(rows).attr("d", line)
      .attr("fill", "none").attr("stroke", C.container).attr("stroke-width", 2.2);

    // 步骤高亮窗口（浅红虚线矩形）
    var winRect = svg.append("rect")
      .attr("y", m.t).attr("height", H - m.b - m.t)
      .attr("fill", C.red).attr("fill-opacity", 0.07)
      .attr("stroke", C.red).attr("stroke-dasharray", "5 4").attr("stroke-opacity", 0.55)
      .style("opacity", 0);

    // 8 个事件钉
    var events = D.events.map(function (ev, i) {
      var dt = parseDate(ev.date);
      var ym = ev.date.slice(0, 7);
      var row = rows.filter(function (r) {
        return r.d.getFullYear() + "-" + String(r.d.getMonth() + 1).padStart(2, "0") === ym;
      })[0];
      return { ev: ev, i: i, d: dt, v: row ? row.v : null };
    });

    var pins = svg.append("g").selectAll("g.pin").data(events).join("g")
      .attr("class", "pin clickable")
      .attr("transform", function (p) { return "translate(" + x(p.d) + "," + (p.v !== null ? y(p.v) : m.t + 30) + ")"; });
    pins.append("line")
      .attr("y1", -5).attr("y2", -26)
      .attr("stroke", C.red).attr("stroke-width", 1.4);
    pins.append("circle").attr("r", 5).attr("fill", C.red).attr("stroke", C.card).attr("stroke-width", 1.2);
    pins.append("text")
      .attr("y", function (p) { return -32 - (p.i % 2) * 15; })
      .attr("text-anchor", "middle")
      .attr("class", "anno-text")
      .attr("font-size", 11).attr("fill", C.ink).attr("font-weight", 600)
      .text(function (p) { return p.ev.label; });
    pins.on("mousemove", function (e, p) {
      UI.tip('<div class="tt-title">' + p.ev.label + "</div>" +
        '<div class="tt-num">' + p.ev.date.slice(0, 7) + (p.v !== null ? " · 前复权 " + UI.fmt(p.v) + " 元" : "") + "</div>" +
        "<div>" + p.ev.detail + "</div>", e.clientX, e.clientY);
    }).on("mouseleave", UI.tipHide)
      .on("click", function (e, p) {
        UI.openModal({
          title: p.ev.label,
          tags: [{ text: "锚公司事件", color: C.red }, { text: p.ev.date.slice(0, 7), color: C.ink2 }],
          nums: [{ l: "当月前复权收盘价（元）", v: p.v !== null ? UI.fmt(p.v) : "—" }],
          desc: p.ev.detail + "\n序列口径：" + D.anchor_monthly.basis,
          sources: [{ label: p.ev.src, url: null },
            { label: "akshare stock_zh_a_daily(adjust=qfq) 日线重采样为月末", url: null }],
          asof: D.meta.asof
        });
      });

    var WINDOWS = [
      null,
      ["2007-06-01", "2007-12-31"], ["2013-01-01", "2013-12-31"],
      ["2016-01-01", "2016-12-31"], ["2020-01-01", "2020-12-31"],
      ["2021-01-01", "2021-12-31"], ["2024-01-01", "2026-07-31"]
    ];
    var REL = [
      null,
      ["A股上市", "顶点 68.4 元"], ["*ST 远洋"], ["重组求生"],
      ["疫情前夜 1.33 元"], ["十倍行情"], ["红海红利", "霍尔木兹"]
    ];

    stockState.update = function (step) {
      pins.transition().duration(450).style("opacity", function (p) {
        if (step === 0) return 0.85;
        return REL[step].indexOf(p.ev.label) >= 0 ? 1 : 0.16;
      });
      if (!WINDOWS[step]) {
        winRect.transition().duration(350).style("opacity", 0);
      } else {
        winRect
          .attr("x", x(parseDate(WINDOWS[step][0])))
          .attr("width", x(parseDate(WINDOWS[step][1])) - x(parseDate(WINDOWS[step][0])))
          .transition().duration(350).style("opacity", 1);
      }
    };
  }

  window.CHARTS = window.CHARTS || {};
  window.CHARTS.buildClocks = buildClocks;
  window.CHARTS.buildStockline = buildStockline;
  window.CHARTS.stockState = stockState;
})();

/* charts.js — 第二部分：三曲线 / 旧牌桌 / 季度利润 / 订单簿 2.5D / lead-lag / 传导桥 */
(function () {
  "use strict";
  var D = window.DATA, UI = window.UI, C = UI.C;
  var SECTOR_COLOR = UI.SECTOR_COLOR;

  function parseDate(s) { return new Date(s + "T00:00:00"); }

  /* ================= 3. 三条曲线三十八年 ================= */
  var curvesState = {};
  function buildCurves(el) {
    var W = UI.chartWidth(el);
    var PH = 172, GAP = 34, m = { t: 30, r: 16, b: 34, l: 56 };
    var H = m.t + PH * 3 + GAP * 2 + m.b;
    var panels = [
      { key: "container", name: "集运 · SCFI / CCFI（披露点，不连线）", y0: 0, y1: 5500 },
      { key: "dry", name: "干散 · BDI（月均）", y0: 0, y1: 11000 },
      { key: "tanker", name: "油运 · BDTI（月均）", y0: 0, y1: 2400 }
    ];
    var svg = d3.select(el).append("svg")
      .attr("width", "100%").attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");

    var defs = svg.append("defs");
    var pat = defs.append("pattern").attr("id", "hatch45")
      .attr("patternUnits", "userSpaceOnUse").attr("width", 8).attr("height", 8)
      .attr("patternTransform", "rotate(45)");
    pat.append("rect").attr("width", 8).attr("height", 8).attr("fill", "#EFE7D3");
    pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 8)
      .attr("stroke", "#C9BFA6").attr("stroke-width", 2.2);

    var x = d3.scaleTime()
      .domain([parseDate("1988-01-01"), parseDate("2026-12-31")])
      .range([m.l, W - m.r]);

    svg.append("g").attr("class", "axis")
      .attr("transform", "translate(0," + (H - m.b) + ")")
      .call(d3.axisBottom(x).ticks(d3.timeYear.every(5)).tickFormat(d3.timeFormat("%Y")));

    var bdiRows = D.indexA_monthly.rows.map(function (r) { return { d: parseDate(r[0]), v: r[1] }; });
    var bdtiRows = D.indexB_monthly.rows.map(function (r) { return { d: parseDate(r[0]), v: r[1] }; });

    var pG = [], pY = [];
    panels.forEach(function (p, i) {
      var top = m.t + i * (PH + GAP);
      var g = svg.append("g").attr("transform", "translate(0," + top + ")");
      pG.push(g);
      var y = d3.scaleLinear().domain([p.y0, p.y1]).range([PH, 0]);
      pY.push(y);
      g.append("rect").attr("x", m.l).attr("y", 0).attr("width", W - m.r - m.l).attr("height", PH)
        .attr("fill", "none").attr("stroke", C.line).attr("stroke-width", 1);
      g.append("text").attr("x", m.l + 6).attr("y", 15).attr("font-size", 12)
        .attr("fill", SECTOR_COLOR[p.key]).attr("font-weight", 700).text(p.name);
      g.append("g").attr("class", "axis").attr("transform", "translate(" + m.l + ",0)")
        .call(d3.axisLeft(y).ticks(3));
    });

    // 面板 1：集运披露点
    var g0 = pG[0], y0 = pY[0];
    g0.append("rect")
      .attr("x", x(parseDate("1988-01-01"))).attr("y", 0)
      .attr("width", x(parseDate("2002-12-31")) - x(parseDate("1988-01-01"))).attr("height", PH)
      .attr("fill", "url(#hatch45)").attr("stroke", C.line);
    g0.append("text")
      .attr("x", x(parseDate("1989-06-01"))).attr("y", PH / 2 - 12)
      .attr("font-size", 12).attr("fill", C.ink2).attr("class", "anno-text")
      .text("1988–2002：集运没有公开运价指数");
    g0.append("text")
      .attr("x", x(parseDate("1989-06-01"))).attr("y", PH / 2 + 8)
      .attr("font-size", 12).attr("fill", C.ink2).attr("class", "anno-text")
      .text("公会定价时代 · 1998-04-13 CCFI 才首发");
    // SCFI：圆点 + 竖 stem
    D.spot_points.forEach(function (p) {
      var px = x(parseDate(p.date)), py = y0(p.value);
      g0.append("line").attr("x1", px).attr("x2", px).attr("y1", PH).attr("y2", py)
        .attr("stroke", C.container).attr("stroke-opacity", 0.45).attr("stroke-width", 1.2);
    });
    g0.selectAll("circle.scfi").data(D.spot_points).join("circle")
      .attr("class", "scfi clickable")
      .attr("cx", function (p) { return x(parseDate(p.date)); })
      .attr("cy", function (p) { return y0(p.value); })
      .attr("r", 3.4).attr("fill", C.container).attr("stroke", C.card).attr("stroke-width", 1)
      .on("mousemove", function (e, p) {
        UI.tip('<div class="tt-title">SCFI ' + UI.fmt(p.value) + '</div><div class="tt-num">' + p.date + "</div><div>" + p.label + "</div>", e.clientX, e.clientY);
      }).on("mouseleave", UI.tipHide)
      .on("click", function (e, p) { pointModal("SCFI", p, C.container); });
    // CCFI：空心方块
    g0.selectAll("rect.ccfi").data(D.composite_points).join("rect")
      .attr("class", "ccfi clickable")
      .attr("x", function (p) { return x(parseDate(p.date)) - 3.5; })
      .attr("y", function (p) { return y0(p.value) - 3.5; })
      .attr("width", 7).attr("height", 7)
      .attr("fill", C.card).attr("stroke", C.container).attr("stroke-width", 1.8)
      .on("mousemove", function (e, p) {
        UI.tip('<div class="tt-title">CCFI ' + UI.fmt(p.value) + '</div><div class="tt-num">' + p.date + "</div><div>" + p.label + "</div>", e.clientX, e.clientY);
      }).on("mouseleave", UI.tipHide)
      .on("click", function (e, p) { pointModal("CCFI", p, C.container); });

    function pointModal(idx, p, color) {
      UI.openModal({
        title: idx + " 披露点",
        tags: [{ text: idx, color: color }, { text: "披露点 · 非连续序列", color: C.gray }],
        nums: [{ l: idx + "（点）", v: UI.fmt(p.value) }, { l: "日期", v: p.date }],
        desc: p.label + "\n口径：官方/权威披露的关键时点值，披露点之间不插值、不连线、不做跨点连续比较。",
        sources: [{ label: String(p.source), url: null }],
        asof: D.meta.asof
      });
    }

    // 面板 2/3：面积 + 折线
    function drawArea(g, y, rows, color) {
      var area = d3.area().x(function (r) { return x(r.d); }).y0(PH).y1(function (r) { return y(r.v); });
      var line = d3.line().x(function (r) { return x(r.d); }).y(function (r) { return y(r.v); });
      g.append("path").datum(rows).attr("d", area).attr("fill", color).attr("fill-opacity", 0.18);
      g.append("path").datum(rows).attr("d", line).attr("fill", "none").attr("stroke", color).attr("stroke-width", 1.6);
    }
    drawArea(pG[1], pY[1], bdiRows, C.dry);
    drawArea(pG[2], pY[2], bdtiRows, C.tanker);
    pG[2].append("text")
      .attr("x", x(parseDate("1990-06-01"))).attr("y", PH / 2)
      .attr("font-size", 12).attr("fill", C.gray).attr("class", "anno-text")
      .text("2001-12 前序列缺失（BDTI 自 2001-12 起）");

    // 时间窗口虚线矩形（三面板同步）
    var winRects = pG.map(function (g) {
      return g.append("rect").attr("y", 0).attr("height", PH)
        .attr("fill", C.ink).attr("fill-opacity", 0.05)
        .attr("stroke", C.ink).attr("stroke-dasharray", "5 4").attr("stroke-opacity", 0.6)
        .style("opacity", 0);
    });

    // 注释（峰谷圆圈 + 4px 纸色描边文字）
    function annoCircle(pi, dt, yv, label, color, dx, dy) {
      var g = pG[pi];
      var px = x(dt), py = pY[pi](yv);
      g.append("circle").attr("class", "anno").attr("cx", px).attr("cy", py)
        .attr("r", 7).attr("fill", "none").attr("stroke", color || C.red).attr("stroke-width", 2)
        .style("opacity", 0);
      g.append("text").attr("class", "anno anno-text")
        .attr("x", px + (dx || 12)).attr("y", py + (dy || -10))
        .attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", color || C.red).text(label)
        .style("opacity", 0);
    }
    function monthlyNear(rows, ym) {
      return rows.filter(function (r) {
        return r.d.getFullYear() + "-" + String(r.d.getMonth() + 1).padStart(2, "0") === ym;
      })[0];
    }
    function monthlyMax(rows, a, b) {
      return rows.filter(function (r) { return r.d >= parseDate(a) && r.d <= parseDate(b); })
        .reduce(function (acc, r) { return !acc || r.v > acc.v ? r : acc; }, null);
    }
    function monthlyMin(rows, a, b) {
      return rows.filter(function (r) { return r.d >= parseDate(a) && r.d <= parseDate(b); })
        .reduce(function (acc, r) { return !acc || r.v < acc.v ? r : acc; }, null);
    }

    // 注释按 step 分组：annoGroups[step] = [元素]
    var annoGroups = { 2: [], 3: [], 4: [], 5: [], 6: [] };
    function reg(step, pi, dt, yv, label, color, dx, dy) {
      var g = pG[pi];
      var px = x(dt), py = pY[pi](yv);
      var c1 = g.append("circle").attr("cx", px).attr("cy", py)
        .attr("r", 7).attr("fill", "none").attr("stroke", color || C.red).attr("stroke-width", 2)
        .style("opacity", 0);
      var t1 = g.append("text").attr("class", "anno-text")
        .attr("x", px + (dx || 12)).attr("y", py + (dy || -10))
        .attr("font-size", 12).attr("font-weight", 700)
        .attr("fill", color || C.red).text(label)
        .style("opacity", 0);
      annoGroups[step].push(c1, t1);
    }

    // step2: 2003–2008
    var bdiPeak = monthlyMax(bdiRows, "2003-01-01", "2008-12-31");
    var bdiEnd08 = monthlyNear(bdiRows, "2008-12");
    if (bdiPeak) reg(2, 1, bdiPeak.d, bdiPeak.v, "BDI 11793（2008-05 日度纪录）", C.red, -60, -16);
    if (bdiEnd08) reg(2, 1, bdiEnd08.d, bdiEnd08.v, "663：七个月跌去 94%", C.red, 8, 24);
    // step3: 2009–2016
    var bdiLow = monthlyNear(bdiRows, "2016-02");
    if (bdiLow) reg(3, 1, bdiLow.d, bdiLow.v, "290（2016-02-10 历史最低）", C.red, 10, -14);
    var ccfiLow = D.composite_points.filter(function (p) { return p.date === "2016-04-29"; })[0];
    if (ccfiLow) reg(3, 0, parseDate(ccfiLow.date), ccfiLow.value, "CCFI 632.36（2016-04-29）", C.red, 10, -14);
    // step4: 2017–2019
    var w3max = monthlyMax(bdiRows, "2017-01-01", "2019-12-31");
    var w3min = monthlyMin(bdiRows, "2017-01-01", "2019-12-31");
    if (w3max) reg(4, 1, w3max.d, w3max.v, "区间峰 2518", C.ink2, 8, -14);
    if (w3min) reg(4, 1, w3min.d, w3min.v, "区间谷 595（日度）", C.ink2, 8, 24);
    // step5: 2020–2022
    var scfiPeak = D.spot_points.filter(function (p) { return p.value === 5109.6; })[0];
    if (scfiPeak) reg(5, 0, parseDate(scfiPeak.date), scfiPeak.value, "SCFI 5109.60（2022-01）", C.red, -80, -16);
    var bdi21 = monthlyMax(bdiRows, "2020-01-01", "2022-12-31");
    if (bdi21) reg(5, 1, bdi21.d, bdi21.v, "BDI 5650（2021-10 日度）", C.ink2, -40, -16);
    var bdti20 = monthlyMax(bdtiRows, "2020-01-01", "2020-12-31");
    if (bdti20) reg(5, 2, bdti20.d, bdti20.v, "油运脉冲：2020-03 囤油 VLCC 一周 +678%", C.red, -170, -14);
    // step6: 2023–2026
    var scfiNow = D.spot_points.filter(function (p) { return p.date === "2026-07-10"; })[0];
    if (scfiNow) reg(6, 0, parseDate(scfiNow.date), scfiNow.value, "SCFI 3184.83（2026-07-10）", C.container, -130, -16);
    var bdiLast = bdiRows[bdiRows.length - 1];
    reg(6, 1, bdiLast.d, bdiLast.v, "BDI 2944（07-10，同比 +101%）", C.dry, -170, -16);
    var bdtiLast = bdtiRows[bdtiRows.length - 1];
    reg(6, 2, bdtiLast.d, bdtiLast.v, "BDTI 2031（07-10）", C.tanker, -130, -16);

    var WINDOWS = [
      null,
      ["1988-01-01", "2002-12-31"], ["2003-01-01", "2008-12-31"],
      ["2009-01-01", "2016-12-31"], ["2017-01-01", "2019-12-31"],
      ["2020-01-01", "2022-12-31"], ["2023-01-01", "2026-07-10"]
    ];

    curvesState.update = function (step) {
      winRects.forEach(function (r) {
        if (!WINDOWS[step]) { r.transition().duration(300).style("opacity", 0); return; }
        r.attr("x", x(parseDate(WINDOWS[step][0])))
          .attr("width", x(parseDate(WINDOWS[step][1])) - x(parseDate(WINDOWS[step][0])))
          .transition().duration(300).style("opacity", 1);
      });
      Object.keys(annoGroups).forEach(function (k) {
        var on = Number(k) === step;
        annoGroups[k].forEach(function (sel) {
          sel.transition().duration(300).style("opacity", on ? 1 : 0);
        });
      });
    };
    curvesState.update(0);
  }

  /* ================= 4. 旧牌桌 ================= */
  var cohortState = {};
  var FATE_META = {
    survivor: { label: "在桌", color: "#1F8A70" },
    renamed: { label: "更名存活", color: "#0E67B5" },
    restructured: { label: "重整存活", color: "#3D4E63" },
    rescued: { label: "国家救助", color: "#C9A227" },
    merged: { label: "被并购", color: "#8C8577" },
    bankrupt: { label: "破产", color: "#C0392B" }
  };
  function buildCohort(el) {
    var sectors = ["container", "dry", "tanker"];
    var allTiles = [];
    sectors.forEach(function (sec) {
      var tiles = D.cohort_tiles.filter(function (t) { return t.sector === sec; });
      var block = document.createElement("div");
      block.className = "cohort-sector";
      block.innerHTML = '<div class="cohort-sector-title" style="color:' + SECTOR_COLOR[sec] + '">' +
        UI.SECTOR_NAME[sec] + '<span class="cohort-count">' + tiles.length + " 张牌</span></div>";
      var grid = document.createElement("div");
      grid.className = "cohort-grid";
      block.appendChild(grid);
      el.appendChild(block);

      tiles.forEach(function (t) {
        var fm = FATE_META[t.fate] || { label: t.fate, color: C.gray };
        var tile = document.createElement("div");
        tile.className = "tile";
        tile.style.borderColor = SECTOR_COLOR[sec];
        tile.dataset.fate = t.fate;
        tile.dataset.sector = sec;
        var ship = window.PIXEL.makeShip(sec, 1.3);
        ship.classList.add("tile-ship");
        tile.appendChild(ship);
        var nm = document.createElement("span");
        nm.className = "tile-name";
        nm.textContent = t.name;
        tile.appendChild(nm);
        var tag = document.createElement("span");
        tag.className = "fate-tag";
        tag.style.background = fm.color;
        tag.textContent = fm.label;
        tile.appendChild(tag);
        grid.appendChild(tile);
        allTiles.push(tile);

        tile.addEventListener("mousemove", function (e) {
          UI.tip('<div class="tt-title">' + t.name + '</div><div>' + UI.SECTOR_NAME[sec] + " · 点击查看结局</div>", e.clientX, e.clientY);
        });
        tile.addEventListener("mouseleave", UI.tipHide);
        tile.addEventListener("click", function () {
          UI.openModal({
            title: t.name,
            tags: [{ text: UI.SECTOR_NAME[sec], color: SECTOR_COLOR[sec] }, { text: fm.label, color: fm.color }],
            desc: t.detail,
            sources: [{ label: t.src, url: null }].concat(D.ledger_sources.slice(0, 4)),
            asof: D.table_cohort_legend.asof
          });
        });
      });
    });

    function tag(tl, on) {
      d3.select(tl.querySelector(".fate-tag")).transition().duration(500).style("opacity", on ? 1 : 0);
    }
    cohortState.update = function (step) {
      // 基线：全部恢复正常
      allTiles.forEach(function (tl) {
        d3.select(tl).transition().duration(700)
          .style("opacity", 1)
          .style("transform", "translateY(0px) rotate(0deg)");
        tl.style.backgroundColor = "";
        tl.style.borderColor = SECTOR_COLOR[tl.dataset.sector];
        tag(tl, step >= 3);
      });
      if (step >= 1) {
        // 破产/重整标签出现；bankrupt 下沉 10px、旋转 -6°、opacity .75、浅红底
        allTiles.forEach(function (tl) {
          var f = tl.dataset.fate;
          if (f === "bankrupt" || f === "restructured") tag(tl, true);
          if (f === "bankrupt") {
            d3.select(tl).transition().duration(700)
              .style("opacity", 0.75)
              .style("transform", "translateY(10px) rotate(-6deg)");
            tl.style.backgroundColor = "#F3DEDA";
            tl.style.borderColor = C.red;
          }
        });
      }
      if (step >= 2) {
        allTiles.forEach(function (tl) {
          var f = tl.dataset.fate;
          if (f === "merged" || f === "rescued") {
            tag(tl, true);
            tl.style.backgroundColor = "#E7E0CE";
            tl.style.borderColor = C.gray;
          }
        });
      }
      if (step >= 3) {
        // 2026 终局：所有标签出现；非 survivor/renamed/restructured 降至 .22
        allTiles.forEach(function (tl) {
          var keep = ["survivor", "renamed", "restructured"].indexOf(tl.dataset.fate) >= 0;
          d3.select(tl).transition().duration(700)
            .style("transform", "translateY(0px) rotate(0deg)")
            .style("opacity", keep ? 1 : 0.22);
        });
      }
    };
  }

  /* ================= 5. 季度利润 ================= */
  function buildQuarterly(el, btnWrap, noteEl, srcEl) {
    var keys = ["w2", "w4", "current"];
    var cur = "w2";
    keys.forEach(function (k) {
      var b = document.createElement("button");
      b.textContent = D.quarterly[k].label;
      if (k === cur) b.classList.add("active");
      b.addEventListener("click", function () {
        cur = k;
        btnWrap.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        draw();
      });
      btnWrap.appendChild(b);
    });

    function draw() {
      var view = D.quarterly[cur];
      el.innerHTML = "";
      noteEl.textContent = view.note + " · 口径：" + view.basis;
      UI.sourceLine(srcEl, view.source, D.meta.asof);

      var W = Math.min(el.clientWidth || 960, 1032), H = 420;
      var m = { t: 26, r: 16, b: 56, l: 56 };
      var rows = view.rows;
      var svg = d3.select(el).append("svg")
        .attr("width", "100%").attr("height", H)
        .attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");
      var x = d3.scaleBand().domain(rows.map(function (r) { return r.period; }))
        .range([m.l, W - m.r]).padding(0.22);
      var vmin = d3.min(rows, function (r) { return r.margin; });
      var vmax = d3.max(rows, function (r) { return r.margin; });
      var y = d3.scaleLinear()
        .domain([Math.min(0, vmin * 1.15), Math.max(1, vmax * 1.18)])
        .range([H - m.b, m.t]);

      svg.append("g").attr("class", "axis").attr("transform", "translate(0," + (H - m.b) + ")")
        .call(d3.axisBottom(x).tickValues(x.domain().filter(function (d, i) { return i % Math.ceil(rows.length / 12) === 0; })))
        .selectAll("text").attr("transform", "rotate(-38)").attr("text-anchor", "end");
      svg.append("g").attr("class", "axis").attr("transform", "translate(" + m.l + ",0)")
        .call(d3.axisLeft(y).ticks(6).tickFormat(function (v) { return v + "%"; }));
      svg.append("line").attr("x1", m.l).attr("x2", W - m.r)
        .attr("y1", y(0)).attr("y2", y(0)).attr("stroke", C.ink).attr("stroke-width", 1.5);

      svg.selectAll("rect.bar").data(rows).join("rect")
        .attr("class", "bar clickable")
        .attr("x", function (r) { return x(r.period); })
        .attr("width", x.bandwidth())
        .attr("y", function (r) { return r.margin >= 0 ? y(r.margin) : y(0); })
        .attr("height", function (r) { return Math.abs(y(r.margin) - y(0)); })
        .attr("fill", function (r) { return r.margin >= 0 ? C.container : C.red; })
        .on("mousemove", function (e, r) {
          UI.tip('<div class="tt-title">' + r.period + '</div><div class="tt-num">单季归母净利率 ' + UI.fmt(r.margin) + "%</div>", e.clientX, e.clientY);
        }).on("mouseleave", UI.tipHide)
        .on("click", function (e, r) {
          UI.openModal({
            title: "中远海控 " + r.period + " 单季",
            tags: [{ text: view.label, color: C.ink2 }, { text: "累计报表差分", color: C.gray }],
            nums: [
              { l: "单季营收（亿元）", v: UI.fmt(r.rev) },
              { l: "单季归母净利（亿元）", v: UI.fmt(r.npp) },
              { l: "单季归母净利率", v: UI.fmt(r.margin) + "%" }
            ],
            desc: "口径：" + view.basis + "。",
            sources: view.source, asof: D.meta.asof
          });
        });

      // 稀疏标签：|v|>12% 或小样本
      var sparse = rows.filter(function (r) { return Math.abs(r.margin) > 12 || rows.length <= 12; });
      svg.selectAll("text.blab").data(sparse).join("text")
        .attr("class", "blab anno-text")
        .attr("x", function (r) { return x(r.period) + x.bandwidth() / 2; })
        .attr("y", function (r) { return r.margin >= 0 ? y(r.margin) - 6 : y(r.margin) + 14; })
        .attr("text-anchor", "middle").attr("font-size", 10)
        .attr("fill", function (r) { return r.margin >= 0 ? C.container : C.red; })
        .text(function (r) { return UI.fmt(r.margin, 2) + "%"; });
    }
    draw();
  }

  /* ================= 6. 订单簿 2.5D ================= */
  function buildOrderbook(el) {
    var ob = D.orderbook;
    var W = Math.min(el.clientWidth || 960, 1032), H = 560;
    var m = { t: 64, r: 20, b: 46, l: 40 };
    var baseY = H - m.b;
    var BH = 17, BW = 26, DEP = 12, PER = 5; // 一层 = 5 个百分点
    var svg = d3.select(el).append("svg")
      .attr("width", "100%").attr("height", H)
      .attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");

    // 图例（左上横排）
    var legend = svg.append("g").attr("transform", "translate(" + m.l + ",18)");
    ob.series.forEach(function (s, i) {
      var g = legend.append("g").attr("transform", "translate(" + i * 150 + ",0)");
      g.append("rect").attr("width", 14).attr("height", 14)
        .attr("fill", SECTOR_COLOR[s.key]).attr("stroke", C.ink).attr("stroke-width", 0.7);
      g.append("text").attr("x", 20).attr("y", 12).attr("font-size", 13).attr("fill", C.ink2).text(s.name);
    });
    svg.append("text").attr("x", W - m.r).attr("y", 24).attr("text-anchor", "end")
      .attr("font-size", 11.5).attr("fill", C.gray)
      .text("一个立体层 = 5 个百分点 · 单位：" + ob.unit);

    var cats = ob.categories;
    var innerW = W - m.l - m.r;
    var catStep = innerW / cats.length;

    var stacks = [];
    cats.forEach(function (cat, ci) {
      var cx0 = m.l + catStep * (ci + 0.5);
      var present = ob.series.filter(function (s) { return s.data[ci] !== null && s.data[ci] !== undefined; });
      var stackGap = 46;
      var totalW = present.length * stackGap - (stackGap - BW - DEP);
      present.forEach(function (s, si) {
        stacks.push({
          cat: cat, ci: ci, series: s, value: s.data[ci],
          x: cx0 - totalW / 2 + si * stackGap,
          src: ob.rowSources[ci]
        });
      });
    });

    svg.append("line").attr("x1", m.l).attr("x2", W - m.r)
      .attr("y1", baseY + 0.5).attr("y2", baseY + 0.5).attr("stroke", C.ink).attr("stroke-width", 1.5);
    svg.selectAll("text.cat").data(cats).join("text")
      .attr("x", function (c, i) { return m.l + catStep * (i + 0.5); })
      .attr("y", baseY + 24).attr("text-anchor", "middle")
      .attr("font-size", 12).attr("fill", C.ink2)
      .attr("font-family", "SF Mono,Menlo,monospace")
      .text(function (c) { return c; });

    var gStacks = svg.append("g");
    stacks.forEach(function (st) {
      var color = SECTOR_COLOR[st.series.key];
      var c = d3.color(color);
      var topC = c.brighter(1.1), rightC = c.darker(0.9);
      var full = Math.floor(st.value / PER);
      var part = st.value - full * PER;
      var g = gStacks.append("g").attr("class", "ob-stack clickable");
      function block(gy, h) {
        g.append("polygon")
          .attr("points", [st.x, gy, st.x + DEP, gy - DEP, st.x + BW + DEP, gy - DEP, st.x + BW, gy].join(" "))
          .attr("fill", topC).attr("stroke", C.ink).attr("stroke-width", 0.7);
        g.append("rect")
          .attr("x", st.x).attr("y", gy).attr("width", BW).attr("height", h)
          .attr("fill", color).attr("stroke", C.ink).attr("stroke-width", 0.7);
        g.append("polygon")
          .attr("points", [st.x + BW, gy, st.x + BW + DEP, gy - DEP, st.x + BW + DEP, gy - DEP + h, st.x + BW, gy + h].join(" "))
          .attr("fill", rightC).attr("stroke", C.ink).attr("stroke-width", 0.7);
      }
      for (var k = 0; k < full; k++) block(baseY - (k + 1) * BH, BH);
      if (part > 0.01) {
        var ph = part / PER * BH;
        block(baseY - full * BH - ph, ph);
      }
      st.topY = baseY - full * BH - (part > 0.01 ? part / PER * BH : 0);
      // 透明命中区
      var hit = g.append("rect")
        .attr("x", st.x - 4).attr("y", st.topY - DEP - 4)
        .attr("width", BW + DEP + 8).attr("height", baseY - st.topY + DEP + 8)
        .attr("fill", "transparent");
      hit.on("mousemove", function (e) {
        UI.tip('<div class="tt-title">' + st.series.name + " · " + st.cat + '</div>' +
          '<div class="tt-num">订单簿占船队 ' + UI.fmt(st.value, 1) + "%</div>" +
          "<div>仅同船型跨时点比较，不插值</div>", e.clientX, e.clientY);
      }).on("mouseleave", UI.tipHide)
        .on("click", function () {
          UI.openModal({
            title: st.series.name + "订单簿 · " + st.cat,
            tags: [{ text: UI.SECTOR_NAME[st.series.key], color: color }, { text: "披露口径", color: C.gray }],
            nums: [{ l: "订单簿占船队比例", v: UI.fmt(st.value, 1) + "%" }],
            desc: "口径：" + ob.metric_definition + "\n" + (ob.note || ""),
            sources: [st.src].concat(ob.source || []),
            asof: ob.asof
          });
        });
    });

    // 数字标签最后统一绘制（避免被后画货堆遮挡）
    var glab = svg.append("g");
    stacks.forEach(function (st) {
      glab.append("text")
        .attr("x", st.x + BW / 2 + DEP / 2).attr("y", st.topY - DEP - 8)
        .attr("text-anchor", "middle")
        .attr("font-size", 12.5).attr("font-weight", 700)
        .attr("font-family", "SF Mono,Menlo,monospace")
        .attr("fill", SECTOR_COLOR[st.series.key])
        .attr("paint-order", "stroke").attr("stroke", C.paper).attr("stroke-width", 4)
        .text(UI.fmt(st.value, st.value % 1 ? 1 : 0) + "%");
    });

    // 标注
    function callout(text, tx, ty, lx, ly) {
      var g = svg.append("g");
      g.append("line").attr("x1", tx).attr("y1", ty + 6).attr("x2", lx).attr("y2", ly)
        .attr("stroke", C.ink).attr("stroke-width", 1.2).attr("stroke-dasharray", "3 3");
      g.append("text").attr("class", "ob-callout")
        .attr("x", tx).attr("y", ty).attr("text-anchor", "middle")
        .attr("fill", C.ink).text(text);
    }
    var st0807 = stacks.filter(function (s) { return s.cat === "2008-07" && s.series.key === "dry"; })[0];
    if (st0807) callout("危机前夜的杠杆底稿", st0807.x - 40, st0807.topY - 96, st0807.x + 13, st0807.topY - 26);
    var st26 = stacks.filter(function (s) { return s.cat === "2026-06" && s.series.key === "container"; })[0];
    if (st26) callout("只有集运把杠杆借回来了", st26.x + 10, st26.topY - 82, st26.x + 13, st26.topY - 24);
  }

  /* ================= 7. 运价领先利润 ================= */
  function buildLeadlag(el) {
    ["container", "tanker"].forEach(function (key) {
      var cfg = D.leadlag[key];
      var color = SECTOR_COLOR[key];
      var panel = document.createElement("div");
      panel.className = "ll-panel card";
      panel.style.padding = "18px 20px 14px";
      el.appendChild(panel);

      var head = document.createElement("div");
      head.className = "ll-panel-head";
      var panelTitle = key === "container"
        ? "集运：CCFI 披露点（线） vs 中远海控单季净利率（柱）"
        : cfg.name;
      head.innerHTML = "<h3>" + panelTitle + "</h3>";
      var btn = document.createElement("button");
      btn.className = "play-btn";
      btn.textContent = "▶ 播放：让运价线右移去“变成”利润";
      var status = document.createElement("span");
      status.className = "ll-status";
      status.textContent = "右移 0 个季度";
      head.appendChild(btn);
      head.appendChild(status);
      panel.appendChild(head);

      var chartDiv = document.createElement("div");
      panel.appendChild(chartDiv);
      var note = document.createElement("div");
      note.className = "ll-note";
      note.textContent = key === "container"
        ? "CCFI 为披露点序列，按季落位以折线连接；长协缓冲使利润滞后运价 1–4 个季度（报告 p12）"
        : cfg.note;
      panel.appendChild(note);

      var W = Math.min(chartDiv.clientWidth || 900, 980), H = 300;
      var m = { t: 18, r: 56, b: 42, l: 50 };
      var quarters = cfg.margin.map(function (r) { return r.period; });
      var svg = d3.select(chartDiv).append("svg")
        .attr("width", "100%").attr("height", H)
        .attr("viewBox", "0 0 " + W + " " + H).attr("preserveAspectRatio", "xMidYMid meet");

      var x = d3.scaleBand().domain(quarters).range([m.l, W - m.r]).padding(0.28);
      var mvals = cfg.margin.map(function (r) { return r.margin; });
      var yL = d3.scaleLinear()
        .domain([Math.min(0, d3.min(mvals) * 1.2), d3.max(mvals) * 1.2])
        .range([H - m.b, m.t]).nice();

      var rateVals = key === "tanker"
        ? cfg.rate.map(function (r) { return r.value; })
        : cfg.ratePoints.map(function (r) { return r.value; });
      var yR = d3.scaleLinear()
        .domain([0, d3.max(rateVals) * 1.15])
        .range([H - m.b, m.t]).nice();

      svg.append("g").attr("class", "axis").attr("transform", "translate(0," + (H - m.b) + ")")
        .call(d3.axisBottom(x).tickValues(x.domain().filter(function (d, i) { return i % 4 === 0; })));
      svg.append("g").attr("class", "axis").attr("transform", "translate(" + m.l + ",0)")
        .call(d3.axisLeft(yL).ticks(5).tickFormat(function (v) { return v + "%"; }));
      // 运价使用独立标尺：只留图例，不画右轴刻度
      svg.append("line").attr("x1", m.l).attr("x2", W - m.r)
        .attr("y1", yL(0)).attr("y2", yL(0)).attr("stroke", C.ink).attr("stroke-width", 1.2);
      svg.append("text").attr("x", m.l).attr("y", 12).attr("font-size", 11).attr("fill", C.gray)
        .text("柱：单季归母净利率（左轴）· 点/线：运价（独立标尺）");

      svg.selectAll("rect.mbar").data(cfg.margin).join("rect")
        .attr("class", "mbar clickable")
        .attr("x", function (r) { return x(r.period); })
        .attr("width", x.bandwidth())
        .attr("y", function (r) { return r.margin >= 0 ? yL(r.margin) : yL(0); })
        .attr("height", function (r) { return Math.abs(yL(r.margin) - yL(0)); })
        .attr("fill", function (r) { return r.margin >= 0 ? C.gray : C.red; })
        .on("mousemove", function (e, r) {
          UI.tip('<div class="tt-title">' + r.period + '</div><div class="tt-num">净利率 ' + UI.fmt(r.margin) + "%</div>", e.clientX, e.clientY);
        }).on("mouseleave", UI.tipHide);

      // 运价层（可平移）
      var gRate = svg.append("g");
      var band = x.step();
      if (key === "tanker") {
        var line = d3.line()
          .x(function (r) { return x(r.period) + x.bandwidth() / 2; })
          .y(function (r) { return yR(r.value); });
        gRate.append("path").datum(cfg.rate).attr("d", line)
          .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.2);
        gRate.selectAll("circle").data(cfg.rate).join("circle")
          .attr("cx", function (r) { return x(r.period) + x.bandwidth() / 2; })
          .attr("cy", function (r) { return yR(r.value); })
          .attr("r", 3).attr("fill", color)
          .on("mousemove", function (e, r) {
            UI.tip('<div class="tt-title">BDTI 季均 ' + UI.fmt(r.value, 1) + '</div><div class="tt-num">' + r.period + "</div>", e.clientX, e.clientY);
          }).on("mouseleave", UI.tipHide);
      } else {
        // CCFI 披露点：折线连接 + 圆点（与油运面板同风格）
        var lineC = d3.line()
          .x(function (r) { return x(r.quarter) + x.bandwidth() / 2; })
          .y(function (r) { return yR(r.value); });
        gRate.append("path").datum(cfg.ratePoints).attr("d", lineC)
          .attr("fill", "none").attr("stroke", color).attr("stroke-width", 2.2);
        gRate.selectAll("circle").data(cfg.ratePoints).join("circle")
          .attr("cx", function (r) { return x(r.quarter) + x.bandwidth() / 2; })
          .attr("cy", function (r) { return yR(r.value); })
          .attr("r", 4).attr("fill", color).attr("stroke", C.card).attr("stroke-width", 1)
          .on("mousemove", function (e, r) {
            UI.tip('<div class="tt-title">CCFI ' + UI.fmt(r.value) + '</div><div class="tt-num">' + r.date + "（披露点，按季落位）</div><div>" + r.label + "</div>", e.clientX, e.clientY);
          }).on("mouseleave", UI.tipHide);
      }

      // 播放逻辑：每步 760ms cubic-in-out 平移一个季度，间隔 560ms
      var playing = false;
      btn.addEventListener("click", function () {
        if (playing) return;
        playing = true;
        btn.disabled = true;
        gRate.interrupt().attr("transform", "translate(0,0)");
        var k = 0;
        status.textContent = "右移 0 个季度";
        function stepAnim() {
          k += 1;
          gRate.transition().duration(760).ease(d3.easeCubicInOut)
            .attr("transform", "translate(" + k * band + ",0)")
            .on("end", function () {
              if (k >= cfg.maxShift) {
                status.textContent = "形状对上了（右移 " + cfg.maxShift + " 个季度）";
                btn.textContent = "↻ 重新播放";
                btn.disabled = false;
                playing = false;
              } else {
                status.textContent = "右移 " + k + " 个季度";
                d3.timeout(stepAnim, 560);
              }
            });
        }
        d3.timeout(stepAnim, 250);
      });
    });
  }

  /* ================= 9. 传导桥 ================= */
  function buildBridge(el) {
    var W = 1040, H = 560;
    var svg = d3.select(el).append("svg")
      .attr("width", "100%").attr("viewBox", "0 0 " + W + " " + H)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("display", "block").style("height", "auto");

    var p14 = D.pages.filter(function (p) { return p.id === "p14_bridge"; })[0];
    var cmp = D.table_subindustry_compare.rows.filter(function (r) { return r["维度"] === "不能跨用的信号"; })[0];

    var nodes = [
      { key: "container", name: "集运班轮", role: "长协+现货 · 订单簿 38–39%", y: 56 },
      { key: "dry", name: "干散货", role: "现货 · 订单簿约 7%", y: 226 },
      { key: "tanker", name: "油运", role: "现货+期租 · 订单簿约 15%", y: 396 }
    ];
    var NODE_W = 190, NODE_H = 92;
    var chan = [
      { id: "can", title: "能传导：钱与情绪", items: ["订单与造船资金流", "二手船价与资产价格", "风险定价与情绪"], y: 86, ok: true },
      { id: "cant", title: "不能传导：需求与口径", items: ["货种与需求结构", "合同结构（长协 vs 现货）", "指数口径与定义"], y: 330, ok: false }
    ];
    var CHAN_X = 350, CHAN_W = 340, CHAN_H = 130;

    // 连接线（先画线）
    var link = d3.linkHorizontal()
      .source(function (d) { return d.source; })
      .target(function (d) { return d.target; })
      .x(function (d) { return d[0]; }).y(function (d) { return d[1]; });
    var gLinks = svg.append("g");
    nodes.forEach(function (n) {
      var sy = n.y + NODE_H / 2;
      chan.forEach(function (ch) {
        var ty = ch.y + CHAN_H / 2;
        var path = link({ source: [210, sy], target: [CHAN_X, ty] });
        if (ch.ok) {
          gLinks.append("path").attr("d", path).attr("fill", "none")
            .attr("stroke", SECTOR_COLOR[n.key]).attr("stroke-width", 2.4).attr("stroke-opacity", 0.8);
        } else {
          gLinks.append("path").attr("d", path).attr("fill", "none")
            .attr("stroke", C.gray).attr("stroke-width", 1.4).attr("stroke-dasharray", "5 4");
          var mx = (210 + CHAN_X) / 2, my = (sy + ty) / 2;
          var gx = gLinks.append("g").attr("transform", "translate(" + mx + "," + my + ")");
          gx.append("line").attr("x1", -6).attr("y1", -6).attr("x2", 6).attr("y2", 6).attr("stroke", C.red).attr("stroke-width", 2.4);
          gx.append("line").attr("x1", -6).attr("y1", 6).attr("x2", 6).attr("y2", -6).attr("stroke", C.red).attr("stroke-width", 2.4);
        }
      });
    });

    // 左侧船型节点
    nodes.forEach(function (n) {
      var g = svg.append("g").attr("transform", "translate(20," + n.y + ")");
      g.append("rect").attr("width", NODE_W).attr("height", NODE_H)
        .attr("fill", C.card).attr("stroke", SECTOR_COLOR[n.key]).attr("stroke-width", 2);
      var ship = window.PIXEL.makeShip(n.key, 1.8);
      ship.setAttribute("x", 14); ship.setAttribute("y", 12);
      g.node().appendChild(ship);
      g.append("text").attr("x", NODE_W - 12).attr("y", 34).attr("text-anchor", "end")
        .attr("font-size", 16).attr("font-weight", 700).attr("fill", C.ink).text(n.name);
      g.append("text").attr("x", NODE_W - 12).attr("y", 56).attr("text-anchor", "end")
        .attr("font-size", 10.5).attr("fill", C.ink2).text(n.role);
    });

    // 中部通道
    chan.forEach(function (ch) {
      var g = svg.append("g").attr("transform", "translate(" + CHAN_X + "," + ch.y + ")");
      g.append("rect").attr("width", CHAN_W).attr("height", CHAN_H)
        .attr("fill", C.card)
        .attr("stroke", ch.ok ? C.green : C.red).attr("stroke-width", 2)
        .attr("stroke-dasharray", ch.ok ? "none" : "7 5");
      g.append("text").attr("x", 16).attr("y", 28)
        .attr("font-size", 15).attr("font-weight", 700)
        .attr("fill", ch.ok ? C.green : C.red).text(ch.title);
      ch.items.forEach(function (it, i) {
        g.append("text").attr("x", 16).attr("y", 56 + i * 26)
          .attr("font-size", 13).attr("fill", C.ink2).text("· " + it);
      });
    });

    // 右侧三条禁令（红描边框）
    var bans = [
      { key: "container", text: cmp["集运"] },
      { key: "dry", text: cmp["干散"] },
      { key: "tanker", text: cmp["油运"] }
    ];
    bans.forEach(function (b, i) {
      var y = 66 + i * 160;
      var g = svg.append("g").attr("transform", "translate(756," + y + ")");
      g.append("rect").attr("width", 264).attr("height", 108)
        .attr("fill", C.card).attr("stroke", C.red).attr("stroke-width", 2);
      g.append("text").attr("x", 14).attr("y", 28)
        .attr("font-size", 13).attr("font-weight", 700).attr("fill", SECTOR_COLOR[b.key])
        .text("禁令 · " + UI.SECTOR_NAME[b.key]);
      var words = b.text.split("≠");
      g.append("text").attr("x", 14).attr("y", 64)
        .attr("font-size", 15).attr("font-weight", 700).attr("fill", C.ink)
        .text(words[0] + " ≠");
      if (words[1]) g.append("text").attr("x", 14).attr("y", 90)
        .attr("font-size", 15).attr("font-weight", 700).attr("fill", C.ink)
        .text(words[1]);
      svg.append("line")
        .attr("x1", CHAN_X + CHAN_W).attr("y1", chan[1].y + CHAN_H / 2)
        .attr("x2", 756).attr("y2", y + 54)
        .attr("stroke", C.gray).attr("stroke-width", 1.2).attr("stroke-dasharray", "4 4");
    });

    if (p14) {
      svg.append("text").attr("x", 20).attr("y", H - 16)
        .attr("font-size", 12).attr("fill", C.gray)
        .text("依据：" + p14.claim);
    }
  }

  window.CHARTS = window.CHARTS || {};
  window.CHARTS.buildCurves = buildCurves;
  window.CHARTS.curvesState = curvesState;
  window.CHARTS.buildCohort = buildCohort;
  window.CHARTS.cohortState = cohortState;
  window.CHARTS.buildQuarterly = buildQuarterly;
  window.CHARTS.buildOrderbook = buildOrderbook;
  window.CHARTS.buildLeadlag = buildLeadlag;
  window.CHARTS.buildBridge = buildBridge;
})();
