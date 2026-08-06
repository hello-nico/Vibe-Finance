/* hbm.js — 9e · HBM 容量 / 缺口 / 定价组合图（主线：占 DRAM 产能比重约 8%→41%，研究口径）
 * 注册 key: 'hbm'（SPEC §5 / §8，主体高 400px；两点不插值，中间年份未披露）
 * 数据：window.CHART_DATA['hbm'] = {unit,series:[[年,%]],gap,pricing,parity,note}
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* 兜底数据（与 CHART_DATA['hbm'] 同构） */
  var FALLBACK = {
    unit: '%（占 DRAM 总产能，研究口径）',
    series: [[2023, 8], [2026, 41]],
    gap: '缺口方向确认，幅度未披露（K14）',
    pricing: '未披露单点；年度合约重签，方向：HBM4 溢价（K15）',
    parity: '3 家供应：SK hynix / Samsung / Micron（K16）',
    note: 'K13：8%（2023）→ 41%（2026E）；中间年份未披露，不插值'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  window.Charts['hbm'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['hbm'];
    var data = (cd && cd.series && cd.series.length >= 2) ? cd : FALLBACK;

    var H = 400;
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
        'HBM 占 DRAM 产能比重：2023 年约 8% 升至 2026E 约 41%（研究口径，两点不插值）；缺口方向确认、定价未披露单点');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var padL = 48, padR = 24, padT = 44, padB = 118;
      var plotW = W - padL - padR;
      var plotH = H - padT - padB;

      var years = data.series.map(function (p) { return p[0]; });
      var y0 = Math.min.apply(null, years), y1 = Math.max.apply(null, years);
      var maxV = 50;

      function X(yr) { return padL + plotW * (yr - y0) / (y1 - y0); }
      function Y(v) { return padT + plotH * (1 - v / maxV); }

      var html = '';

      /* 网格与 y 轴 */
      for (var t = 0; t <= 5; t++) {
        var v = maxV * t / 5;
        var yy = Y(v);
        html += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (W - padR) + '" y2="' + yy +
          '" style="stroke:var(--line-lo);stroke-width:1" />';
        html += '<text x="' + (padL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + v + '%</text>';
      }
      html += '<text x="' + (padL - 8) + '" y="' + (padT - 10) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + esc(data.unit) + '</text>';

      /* 两点之间：虚线连接（不插值） + 中点注记 */
      var p0 = data.series[0], p1 = data.series[data.series.length - 1];
      var mx = (X(p0[0]) + X(p1[0])) / 2;
      html += '<line x1="' + X(p0[0]) + '" y1="' + Y(p0[1]) + '" x2="' + X(p1[0]) + '" y2="' + Y(p1[1]) +
        '" style="stroke:var(--blue);stroke-width:2;stroke-dasharray:6 5;opacity:.6" />';
      var midY = (Y(p0[1]) + Y(p1[1])) / 2;
      html += '<rect x="' + (mx - 92) + '" y="' + (midY - 15) + '" width="184" height="22" rx="3" style="fill:var(--paper-hi);stroke:var(--line)" />';
      html += '<text x="' + mx + '" y="' + midY + '" text-anchor="middle" style="font-size:10px;fill:var(--ink-lo)">中间年份未披露，不插值</text>';

      /* 中间年份刻度（虚位） */
      for (var yr = y0; yr <= y1; yr++) {
        html += '<text x="' + X(yr) + '" y="' + (padT + plotH + 22) + '" text-anchor="middle" style="font-size:11.5px;fill:var(--ink-md);font-family:var(--mono)">' +
          yr + (yr === y1 ? 'E' : '') + '</text>';
      }
      html += '<line x1="' + padL + '" y1="' + (padT + plotH) + '" x2="' + (W - padR) + '" y2="' + (padT + plotH) +
        '" style="stroke:var(--line);stroke-width:1" />';

      /* 数据点 */
      data.series.forEach(function (p, i) {
        html += '<g class="spt" data-i="' + i + '" tabindex="0" role="button" aria-label="' + p[0] + ' 年占比约 ' + p[1] + '%" style="cursor:pointer;outline:none">';
        html += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="7" style="fill:#ffffff;stroke:var(--blue);stroke-width:2.6" />';
        html += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="2.4" style="fill:var(--blue)" />';
        html += '<text x="' + X(p[0]) + '" y="' + (Y(p[1]) - 16) + '" text-anchor="middle" style="font-size:15px;font-weight:700;fill:var(--blue-hi);font-family:var(--mono)">' +
          p[1] + '%</text>';
        html += '</g>';
      });

      /* 底部三栏注记：缺口 / 定价 / 供给 */
      var notes = [
        { k: '缺口', v: data.gap, color: 'var(--neg)', cls: 'gap' },
        { k: '定价', v: data.pricing, color: 'var(--copper)', cls: 'price' },
        { k: '供给', v: data.parity, color: 'var(--blue)', cls: 'parity' }
      ];
      var colW = plotW / 3;
      notes.forEach(function (nt, i) {
        var nx = padL + i * colW;
        var ny = H - 92;
        html += '<g class="note" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(nt.k) + '：' + esc(nt.v) + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + nx + '" y="' + ny + '" width="' + (colW - 12) + '" height="52" rx="4" style="fill:#ffffff;stroke:var(--line);stroke-width:1" />';
        html += '<rect x="' + nx + '" y="' + ny + '" width="3" height="52" style="fill:' + nt.color + '" />';
        html += '<text x="' + (nx + 12) + '" y="' + (ny + 18) + '" style="font-size:10.5px;font-weight:700;fill:' + nt.color + '">' + esc(nt.k) + '</text>';
        /* 简单两行截断 */
        var maxCh = Math.max(6, Math.floor((colW - 28) / 10));
        var line1 = nt.v.length > maxCh ? nt.v.slice(0, maxCh) : nt.v;
        var line2 = nt.v.length > maxCh ? nt.v.slice(maxCh, maxCh * 2 - 1) + (nt.v.length > maxCh * 2 - 1 ? '…' : '') : '';
        html += '<text x="' + (nx + 12) + '" y="' + (ny + 33) + '" style="font-size:10px;fill:var(--ink-md)">' + esc(line1) + '</text>';
        if (line2) html += '<text x="' + (nx + 12) + '" y="' + (ny + 46) + '" style="font-size:10px;fill:var(--ink-md)">' + esc(line2) + '</text>';
        html += '</g>';
      });

      html += '<text x="' + padL + '" y="' + (H - 12) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' + esc(data.note) + '</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* 交互：数据点 */
      svg.querySelectorAll('.spt').forEach(function (el) {
        var p = data.series[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + p[0] + '</b><br>HBM 占 DRAM 产能：约 ' + p[1] + '%（研究口径）', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: 'HBM · ' + p[0],
            body: '<p><b>占 DRAM 产能：约 ' + p[1] + '%</b>（研究口径）</p>' +
              '<p>主线为约 8%→41% 的研究口径；产能被 HBM 挤占，是常规 DRAM 与 HBM 同时涨价的结构性原因。' + esc(data.note) + '</p>',
            source: '研究综合', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      /* 交互：注记 */
      svg.querySelectorAll('.note').forEach(function (el) {
        var nt = notes[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + esc(nt.k) + '</b><br>' + esc(nt.v), e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: 'HBM · ' + nt.k,
            body: '<p>' + esc(nt.v) + '</p><p>' + esc(data.note) + '</p>',
            source: '研究综合', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
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
