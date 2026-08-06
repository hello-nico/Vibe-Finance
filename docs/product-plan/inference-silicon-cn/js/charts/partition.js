/* partition.js — 9f · 约束的最后一站：电网
 * 注册 key: 'partition'（SPEC §5 / §8：415→945 TWh；GB200 NVL72≈120kW 标尺；
 * 「部署节拍器 ≠ 订单节拍器」注解；主体高约 420px）
 * 数据：window.CHART_DATA['partition'] = {unit,twh:[[年,TWh]],rack:{name,kw},metronomes:{deploy,order},note}
 * 两个端点不插值，中间年份未披露
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* 兜底数据（与 CHART_DATA['partition'] 同构） */
  var FALLBACK = {
    unit: 'TWh',
    twh: [[2024, 415], [2030, 945]],
    rack: { name: 'GB200 NVL72', kw: 120 },
    metronomes: {
      deploy: '部署节拍器：电网接入、变压器、输电容量',
      order: '订单节拍器：芯片下单与交期'
    },
    note: 'K26：415（2024）→ 945（2030E）；中间年份未披露，不插值'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  window.Charts['partition'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['partition'];
    var data = (cd && cd.twh && cd.twh.length >= 2) ? cd : FALLBACK;
    var rack = data.rack || FALLBACK.rack;
    var met = data.metronomes || FALLBACK.metronomes;

    var H = 420;
    var lastW = 0;

    function render() {
      var W = Math.max(320, Math.floor(body.clientWidth || 760));
      lastW = W;
      body.innerHTML = '';

      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label',
        '数据中心用电量：2024 年 415 TWh 升至 2030E 945 TWh（两端点不插值）；部署节拍器不等于订单节拍器');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var padL = 56, padT = 44, padB = 108;
      var sideW = Math.min(150, W * 0.22);
      var padR = sideW + 20;
      var plotW = W - padL - padR;
      var plotH = H - padT - padB;

      var p0 = data.twh[0], p1 = data.twh[data.twh.length - 1];
      var maxV = Math.ceil((p1[1] * 1.08) / 100) * 100;

      function X(yr) { return padL + plotW * (yr - p0[0]) / (p1[0] - p0[0]); }
      function Y(v) { return padT + plotH * (1 - v / maxV); }

      var html = '';

      /* 网格与 y 轴 */
      for (var t = 0; t <= 5; t++) {
        var v = maxV * t / 5;
        var yy = Y(v);
        html += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy +
          '" style="stroke:var(--line-lo);stroke-width:1" />';
        html += '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + v + '</text>';
      }
      html += '<text x="' + (padL - 8) + '" y="' + (padT - 10) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + esc(data.unit || 'TWh') + '</text>';

      /* 端点间面积（不插值：面积仅作视觉引导，斜线虚线表示区间未披露） */
      var area = 'M ' + X(p0[0]) + ' ' + Y(0) + ' L ' + X(p0[0]) + ' ' + Y(p0[1]) +
        ' L ' + X(p1[0]) + ' ' + Y(p1[1]) + ' L ' + X(p1[0]) + ' ' + Y(0) + ' Z';
      html += '<path d="' + area + '" style="fill:var(--blue);opacity:.07" />';
      html += '<line x1="' + X(p0[0]) + '" y1="' + Y(p0[1]) + '" x2="' + X(p1[0]) + '" y2="' + Y(p1[1]) +
        '" style="stroke:var(--blue);stroke-width:2.2;stroke-dasharray:7 5" class="slope" />';

      /* 中点注记 */
      var mx = (X(p0[0]) + X(p1[0])) / 2, my = (Y(p0[1]) + Y(p1[1])) / 2;
      html += '<rect x="' + (mx - 92) + '" y="' + (my - 15) + '" width="184" height="22" rx="3" style="fill:var(--paper-hi);stroke:var(--line)" />';
      html += '<text x="' + mx + '" y="' + my + '" text-anchor="middle" style="font-size:10px;fill:var(--ink-lo)">中间年份未披露，不插值</text>';

      /* 端点 */
      [[p0, ''], [p1, 'E']].forEach(function (cfg, i) {
        var p = cfg[0];
        html += '<g class="pt" data-i="' + i + '" tabindex="0" role="button" aria-label="' + p[0] + cfg[1] + ' 用电量约 ' + p[1] + ' TWh" style="cursor:pointer;outline:none">';
        html += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="7" style="fill:#ffffff;stroke:var(--blue);stroke-width:2.6" />';
        html += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="2.4" style="fill:var(--blue)" />';
        var anchor = i === 0 ? 'start' : 'end';
        var dx = i === 0 ? 12 : -12;
        html += '<text x="' + (X(p[0]) + dx) + '" y="' + (Y(p[1]) - 12) + '" text-anchor="' + anchor + '" style="font-size:14px;font-weight:700;fill:var(--blue-hi);font-family:var(--mono)">' +
          p[1] + ' ' + esc(data.unit || 'TWh') + '</text>';
        html += '</g>';
        html += '<text x="' + X(p[0]) + '" y="' + (padT + plotH + 24) + '" text-anchor="middle" style="font-size:12px;fill:var(--ink-md);font-family:var(--mono)">' +
          p[0] + cfg[1] + '</text>';
      });
      html += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) +
        '" style="stroke:var(--line);stroke-width:1" />';

      /* 右侧：机柜功耗标尺 */
      var sx = W - padR + 24;
      var sy = padT + 8;
      html += '<g class="rack" tabindex="0" role="button" aria-label="' + esc(rack.name) + '，单机柜约 ' + rack.kw + ' kW" style="cursor:pointer;outline:none">';
      html += '<rect x="' + sx + '" y="' + sy + '" width="32" height="112" rx="3" style="fill:var(--paper-hi);stroke:var(--ink);stroke-width:1.3" />';
      for (var u = 0; u < 6; u++) {
        html += '<line x1="' + (sx + 5) + '" y1="' + (sy + 15 + u * 16) + '" x2="' + (sx + 27) + '" y2="' + (sy + 15 + u * 16) +
          '" style="stroke:var(--ink-lo);stroke-width:1" />';
      }
      html += '<text x="' + (sx + 16) + '" y="' + (sy - 8) + '" text-anchor="middle" style="font-size:10.5px;font-weight:700;fill:var(--ink)">' + esc(rack.name) + '</text>';
      html += '<text x="' + (sx + 16) + '" y="' + (sy + 130) + '" text-anchor="middle" style="font-size:10px;fill:var(--ink-md);font-family:var(--mono)">≈' + rack.kw + ' kW</text>';
      html += '</g>';
      html += '<text x="' + sx + '" y="' + (sy + 148) + '" style="font-size:9.5px;fill:var(--ink-lo)">单机柜功耗标尺</text>';

      /* 底部：节拍器对照（两条） */
      var ay = H - 84;
      html += '<g class="met" tabindex="0" role="button" aria-label="部署节拍器不等于订单节拍器" style="cursor:pointer;outline:none">';
      html += '<rect x="' + padL + '" y="' + ay + '" width="3" height="46" style="fill:var(--blue)" />';
      html += '<text x="' + (padL + 12) + '" y="' + (ay + 14) + '" style="font-size:13px;font-weight:700;fill:var(--ink)">部署节拍器 ≠ 订单节拍器</text>';
      html += '<text x="' + (padL + 12) + '" y="' + (ay + 30) + '" style="font-size:11px;fill:var(--ink-md)">' + esc(met.deploy) + '</text>';
      html += '<text x="' + (padL + 12) + '" y="' + (ay + 44) + '" style="font-size:11px;fill:var(--ink-md)">' + esc(met.order) + '</text>';
      html += '</g>';
      html += '<text x="' + padL + '" y="' + (H - 12) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + esc(data.note) + '</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* 交互 */
      svg.querySelectorAll('.pt').forEach(function (el) {
        var p = data.twh[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + p[0] + '</b><br>数据中心用电：约 ' + p[1] + ' ' + esc(data.unit || 'TWh'), e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: '数据中心用电 · ' + p[0],
            body: '<p><b>约 ' + p[1] + ' ' + esc(data.unit || 'TWh') + '</b></p><p>' + esc(data.note) + '</p>' +
              '<p>部署节拍器 ≠ 订单节拍器：电网接入决定真实部署节奏。</p>',
            source: '研究综合估计（IEA 口径外推）', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      var rackEl = svg.querySelector('.rack');
      rackEl.addEventListener('mouseenter', function (e) {
        tipShow('<b>' + esc(rack.name) + '</b><br>单机柜约 ' + rack.kw + ' kW；电网接入周期以年计', e);
      });
      rackEl.addEventListener('mousemove', tipMove);
      rackEl.addEventListener('mouseleave', tipHide);
      function rackDrill() {
        drill({
          title: rack.name + ' · 功耗标尺',
          body: '<p>单机柜约 ' + rack.kw + ' kW 量级；当单园区以数百 MW 规划时，并网排队、变压器与输电容量取代晶圆，成为部署节奏的最后一道约束。</p>',
          source: '研究综合估计', date: '2026-07'
        });
      }
      rackEl.addEventListener('click', rackDrill);
      rackEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rackDrill(); }
      });

      var metEl = svg.querySelector('.met');
      metEl.addEventListener('mouseenter', function (e) {
        tipShow('<b>部署节拍器 ≠ 订单节拍器</b><br>' + esc(met.deploy) + '<br>' + esc(met.order), e);
      });
      metEl.addEventListener('mousemove', tipMove);
      metEl.addEventListener('mouseleave', tipHide);
      metEl.addEventListener('click', function () {
        drill({
          title: '部署节拍器 ≠ 订单节拍器',
          body: '<p>' + esc(met.deploy) + '</p><p>' + esc(met.order) + '</p><p>芯片可以下单，电表不一定跟得上；电网接入决定真实部署节奏。</p>',
          source: '研究综合', date: '2026-07'
        });
      });
      metEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); metEl.dispatchEvent(new Event('click')); }
      });
    }

    render();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        var w = Math.floor(body.clientWidth || 0);
        if (Math.abs(w - lastW) > 1) render();
      });
      ro.observe(body);
    }
  };
})();
