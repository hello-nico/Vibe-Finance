/* cowos.js — 9e · CoWoS 供需（2023–2026E）
 * 注册 key: 'cowos'（SPEC §5 / §8：viewBox 高约 457；禁用未证实 75→110 万片路径；缺数标「未披露」）
 * 数据：window.CHART_DATA['cowos'] = {unit,capacity:[{year,lo,hi}],demand,share:[{label,v}],note}
 * 产能以 lo–hi 区间带绘制；需求未披露 → 不画单点，以文字与「缺口方向」阴影表达
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* 兜底数据（与 CHART_DATA['cowos'] 同构） */
  var FALLBACK = {
    unit: '万片/月（研究口径）',
    capacity: [
      { year: 2024, lo: 3.5, hi: 4 },
      { year: 2025, lo: 7, hi: 8 },
      { year: 2026, lo: 12, hi: 13 }
    ],
    demand: '未披露单点（K11；方向：2025–2026 持续供不应求）',
    share: [
      { label: '定制 ASIC 分配', v: 30, note: '≈30%，±10–20%（K7）' },
      { label: 'GPU 与其他', v: 70, note: '余额（研究综合）' }
    ],
    note: '不使用未经确认的 75→110 路径；±10–20% 误差带'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  window.Charts['cowos'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['cowos'];
    var data = (cd && cd.capacity && cd.capacity.length) ? cd : FALLBACK;

    var H = 457;
    var lastW = 0;

    function render() {
      var W = Math.max(300, Math.floor(body.clientWidth || 760));
      lastW = W;
      body.innerHTML = '';

      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label',
        'CoWoS 产能区间图（2023–2026E）：产能以估计区间带绘制，需求未披露单点，缺口方向确认；不使用未经证实的 75→110 路径');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var narrow = W < 600;
      var padL = 46, padT = 46, padB = narrow ? 96 : 78;
      var sideW = narrow ? 0 : Math.min(120, W * 0.16);   // 右侧分配条（窄屏省略）
      var padR = 20 + sideW;
      var plotW = W - padL - padR;
      var plotH = H - padT - padB;

      /* 年份轴：2023（未披露） + 数据年 */
      var years = [2023];
      data.capacity.forEach(function (c) { years.push(c.year); });
      var n = years.length;
      var maxV = 0;
      data.capacity.forEach(function (c) { if (c.hi > maxV) maxV = c.hi; });
      maxV = Math.ceil(maxV * 1.2);

      function X(i) { return padL + plotW * (i + 0.5) / n; }
      function Y(v) { return padT + plotH * (1 - v / maxV); }

      var html = '';

      /* 网格与 y 轴 */
      for (var t = 0; t <= 5; t++) {
        var v = maxV * t / 5;
        var yy = Y(v);
        html += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy +
          '" style="stroke:var(--line-lo);stroke-width:1" />';
        html += '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
          (v % 1 ? v.toFixed(1) : v) + '</text>';
      }
      html += '<text x="' + (padL - 8) + '" y="' + (padT - 8) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + esc(data.unit) + '</text>';

      /* 缺口方向阴影（需求未披露 → 只画方向：2025–2026 区间上方） */
      var gapYears = [2025, 2026];
      gapYears.forEach(function (gy) {
        var gi = years.indexOf(gy);
        var cap = data.capacity.filter(function (c) { return c.year === gy; })[0];
        if (gi < 0 || !cap) return;
        var bandW = plotW / n * 0.5;
        html += '<rect x="' + (X(gi) - bandW / 2) + '" y="' + padT + '" width="' + bandW + '" height="' + (Y(cap.hi) - padT) +
          '" style="fill:var(--neg);opacity:.08" class="gapdir" data-y="' + gy + '" />';
        html += '<text x="' + X(gi) + '" y="' + (padT + 16) + '" text-anchor="middle" style="font-size:10.5px;font-weight:700;fill:var(--neg)">缺口↑</text>';
      });

      /* 产能区间带（lo–hi 浮动柱） */
      var bandW2 = Math.min(52, plotW / n * 0.42);
      years.forEach(function (yr, i) {
        var cap = data.capacity.filter(function (c) { return c.year === yr; })[0];
        var lab = yr + (yr >= 2026 ? 'E' : '');
        if (!cap) {
          /* 无数据年份：未披露 */
          html += '<text x="' + X(i) + '" y="' + (padT + plotH - 10) + '" text-anchor="middle" style="font-size:10px;fill:var(--ink-lo)">未披露</text>';
        } else {
          var yTop = Y(cap.hi), yBot = Y(cap.lo);
          html += '<g class="cap" data-y="' + yr + '" tabindex="0" role="button" aria-label="' + yr + ' 产能估计区间 ' +
            cap.lo + '–' + cap.hi + ' ' + esc(data.unit) + '" style="cursor:pointer;outline:none">';
          html += '<rect x="' + (X(i) - bandW2 / 2) + '" y="' + yTop + '" width="' + bandW2 + '" height="' + (yBot - yTop) +
            '" rx="2" style="fill:var(--blue);opacity:.45" />';
          html += '<line x1="' + (X(i) - bandW2 / 2 - 6) + '" y1="' + yTop + '" x2="' + (X(i) + bandW2 / 2 + 6) + '" y2="' + yTop +
            '" style="stroke:var(--blue-hi);stroke-width:2" />';
          html += '<line x1="' + (X(i) - bandW2 / 2 - 6) + '" y1="' + yBot + '" x2="' + (X(i) + bandW2 / 2 + 6) + '" y2="' + yBot +
            '" style="stroke:var(--blue-hi);stroke-width:2" />';
          html += '<text x="' + X(i) + '" y="' + (yTop - 8) + '" text-anchor="middle" style="font-size:11px;fill:var(--blue-hi);font-family:var(--mono)">' +
            cap.lo + '–' + cap.hi + '</text>';
          html += '</g>';
        }
        html += '<text x="' + X(i) + '" y="' + (padT + plotH + 22) + '" text-anchor="middle" style="font-size:12px;fill:var(--ink-md)">' + lab + '</text>';
      });
      html += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) +
        '" style="stroke:var(--line);stroke-width:1" />';

      /* 需求未披露注记 */
      html += '<g class="dem" tabindex="0" role="button" aria-label="需求：未披露" style="cursor:pointer;outline:none">';
      html += '<rect x="' + padL + '" y="' + (padT - 34) + '" width="252" height="24" rx="4" style="fill:var(--paper-hi);stroke:var(--line)" />';
      html += '<text x="' + (padL + 10) + '" y="' + (padT - 18) + '" style="font-size:11px;fill:var(--ink-md)">需求：<tspan style="fill:var(--neg);font-weight:700">未披露</tspan>（方向：持续供不应求）</text>';
      html += '</g>';

      /* 右侧：CoWoS 分配条（share） */
      if (sideW > 0 && data.share && data.share.length) {
        var sx = W - padR + 24;
        var sy = padT + 10;
        var sh = plotH - 40;
        html += '<text x="' + sx + '" y="' + (padT - 8) + '" style="font-size:10.5px;font-weight:700;fill:var(--ink)">分配口径</text>';
        var acc = 0;
        data.share.forEach(function (s, si) {
          var segH = sh * s.v / 100;
          var col = si === 0 ? 'var(--blue)' : 'var(--blue-lo)';
          html += '<g class="share" data-i="' + si + '" style="cursor:pointer">';
          html += '<rect x="' + sx + '" y="' + (sy + acc) + '" width="20" height="' + segH + '" style="fill:' + col + ';opacity:.8" />';
          html += '<text x="' + (sx + 26) + '" y="' + (sy + acc + 13) + '" style="font-size:10px;fill:var(--ink-md)">' + esc(s.label) + '</text>';
          html += '<text x="' + (sx + 26) + '" y="' + (sy + acc + 26) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">≈' + s.v + '%</text>';
          html += '</g>';
          acc += segH;
        });
      }

      /* 图例与来源 */
      var ly = H - 40;
      html += '<rect x="' + padL + '" y="' + (ly - 10) + '" width="12" height="12" rx="2" style="fill:var(--blue);opacity:.45" />';
      html += '<text x="' + (padL + 18) + '" y="' + ly + '" style="font-size:11px;fill:var(--ink-md)">产能估计区间（lo–hi）</text>';
      html += '<rect x="' + (padL + 150) + '" y="' + (ly - 11) + '" width="14" height="12" style="fill:var(--neg);opacity:.1" />';
      html += '<text x="' + (padL + 170) + '" y="' + ly + '" style="font-size:11px;fill:var(--ink-md)">缺口方向（幅度未披露）</text>';
      html += '<text x="' + padL + '" y="' + (H - 12) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
        esc(data.note) + '</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* 交互 */
      svg.querySelectorAll('.cap').forEach(function (el) {
        var yr = +el.getAttribute('data-y');
        var cap = data.capacity.filter(function (c) { return c.year === yr; })[0];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + yr + '</b><br>产能估计区间：' + cap.lo + '–' + cap.hi + ' ' + esc(data.unit) +
            '<br><span style="color:var(--ink-lo)">±10–20% 误差带</span>', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: 'CoWoS 产能 · ' + yr,
            body: '<p><b>产能估计区间：</b>' + cap.lo + '–' + cap.hi + ' ' + esc(data.unit) + '</p>' +
              '<p>需求侧：' + esc(data.demand) + '</p>' +
              '<p>' + esc(data.note) + '</p>',
            source: '研究综合估计（未经公司披露确认）', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      svg.querySelectorAll('.gapdir').forEach(function (el) {
        var gy = el.getAttribute('data-y');
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + gy + ' 缺口方向</b><br>' + esc(data.demand), e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
      });

      var demEl = svg.querySelector('.dem');
      demEl.addEventListener('mouseenter', function (e) {
        tipShow('<b>需求：未披露</b><br>' + esc(data.demand) + '<br><span style="color:var(--ink-lo)">不做插值或单点猜测</span>', e);
      });
      demEl.addEventListener('mousemove', tipMove);
      demEl.addEventListener('mouseleave', tipHide);
      demEl.addEventListener('click', function () {
        drill({
          title: 'CoWoS 需求：未披露',
          body: '<p>' + esc(data.demand) + '</p><p>需求单点未经公司披露，本图以「缺口方向」阴影表达供不应求的方向，不虚构数值。</p>',
          source: '研究综合', date: '2026-07'
        });
      });
      demEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); demEl.dispatchEvent(new Event('click')); }
      });

      svg.querySelectorAll('.share').forEach(function (el) {
        var s = data.share[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + esc(s.label) + ' ≈' + s.v + '%</b><br><span style="color:var(--ink-lo)">' + esc(s.note || '') + '</span>', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
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
