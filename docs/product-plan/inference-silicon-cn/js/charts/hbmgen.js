/* hbmgen.js — 9e · HBM 代际路线图：HBM3 → HBM3E → HBM4（时间轴 + 代际卡片）
 * 注册 key: 'hbmgen'（SPEC §5 / §8：viewBox 高约 356）
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* 兜底数据（公司披露 / 行业与官方口径混合，未证实项标「未披露」） */
  var FALLBACK = {
    gens: [
      {
        name: 'HBM3', status: '量产中', from: 2022, to: 2024,
        specs: ['引脚速率 5.6–6.4 Gbps', '单堆带宽约 819 GB/s', '代表平台：H100'],
        note: '2022 年起随 H100 放量，是本轮 AI 加速器的第一代标配',
        source: '公司披露 / 行业与官方（JEDEC）', date: '2022–2024'
      },
      {
        name: 'HBM3E', status: '量产爬坡', from: 2024, to: 2026,
        specs: ['引脚速率 8–9.2 Gbps', '单堆带宽约 1.2 TB/s', '代表平台：H200 / B200 / MI300'],
        note: '2024 年进入量产爬坡，12-hi 堆叠比例上升，是当前出货主力',
        source: '公司披露', date: '2024–2025'
      },
      {
        name: 'HBM4', status: '路线图（送样阶段）', from: 2026, to: 2027,
        specs: ['接口宽度翻倍至 2048-bit', '单堆带宽目标约 2× HBM3E', '量产节奏：未披露'],
        note: '配合下一代加速器平台；具体量产时间与价格未经原厂完整披露',
        source: '研究综合（原厂路线图）', date: '2025–2026'
      }
    ],
    axisFrom: 2022, axisTo: 2027
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  /* CHART_DATA['hbmgen'] = {gens:[{gen,year,status,note}],note} → 渲染模型 */
  function fromCD(cd) {
    if (!cd || !cd.gens || !cd.gens.length) return null;
    var gens = cd.gens.map(function (g, i, arr) {
      var next = arr[i + 1];
      return {
        name: g.gen || g.name,
        status: g.status || '',
        from: g.year || g.from,
        to: g.to || (next ? next.year : (g.year || g.from)),
        specs: g.specs || (g.note ? [g.note] : []),
        note: g.note || '',
        source: g.source || '公司披露 / 研究综合', date: g.date || '2026-07'
      };
    });
    var years = gens.map(function (g) { return g.from; });
    return {
      gens: gens,
      axisFrom: cd.axisFrom || Math.min.apply(null, years),
      axisTo: cd.axisTo || Math.max.apply(null, years.concat([data_axisTo(gens)]))
    };
  }
  function data_axisTo(gens) {
    var m = 0;
    gens.forEach(function (g) { if (g.to > m) m = g.to; });
    return m;
  }

  window.Charts['hbmgen'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var data = fromCD(window.CHART_DATA && window.CHART_DATA['hbmgen']) || FALLBACK;

    var H = 356;
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
      svg.setAttribute('aria-label', 'HBM 代际路线图：HBM3（2022）、HBM3E（2024）、HBM4（2026 起，送样阶段）');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var padL = 30, padR = 30;
      var axisY = 300;
      var plotW = W - padL - padR;
      var span = data.axisTo - data.axisFrom;

      function X(year) { return padL + plotW * (year - data.axisFrom) / span; }

      var html = '';

      /* 时间轴 */
      html += '<line x1="' + padL + '" y1="' + axisY + '" x2="' + (W - padR) + '" y2="' + axisY +
        '" style="stroke:var(--ink);stroke-width:1.4" />';
      html += '<path d="M ' + (W - padR) + ' ' + (axisY - 5) + ' L ' + (W - padR + 10) + ' ' + axisY +
        ' L ' + (W - padR) + ' ' + (axisY + 5) + ' Z" style="fill:var(--ink)" />';
      for (var y = data.axisFrom; y <= data.axisTo; y++) {
        html += '<line x1="' + X(y) + '" y1="' + (axisY - 4) + '" x2="' + X(y) + '" y2="' + (axisY + 4) +
          '" style="stroke:var(--ink-md);stroke-width:1" />';
        html += '<text x="' + X(y) + '" y="' + (axisY + 22) + '" text-anchor="middle" style="font-size:11px;fill:var(--ink-md);font-family:var(--mono)">' + y + '</text>';
      }

      /* 代际卡片：横向依次排布，纵向错位避免重叠 */
      var cardW = Math.min(210, (plotW - 24) / data.gens.length);
      var rows = [26, 150, 26, 150];   // 卡片顶部 y（上下错位避免重叠）

      data.gens.forEach(function (g, i) {
        var cx = padL + plotW * (i + 0.5) / data.gens.length;
        var top = rows[i % rows.length];
        var cardH = 108;
        var x0 = Math.min(Math.max(cx - cardW / 2, padL), W - padR - cardW);

        /* 生命周期条（轴上 from→to） */
        var bx0 = X(g.from), bx1 = X(Math.min(g.to, data.axisTo));
        var dashed = /未披露|路线图|送样/.test(g.status);
        html += '<line x1="' + bx0 + '" y1="' + (axisY - 14) + '" x2="' + bx1 + '" y2="' + (axisY - 14) +
          '" style="stroke:var(--blue);stroke-width:4;stroke-linecap:round' + (dashed ? ';stroke-dasharray:6 5;opacity:.55' : '') + '" />';

        /* 连接 pin */
        var pinX = Math.min(Math.max(cx, x0 + 16), x0 + cardW - 16);
        html += '<line x1="' + pinX + '" y1="' + (top + cardH) + '" x2="' + pinX + '" y2="' + (axisY - 16) +
          '" style="stroke:var(--ink-lo);stroke-width:1;stroke-dasharray:2 3" />';
        html += '<circle cx="' + pinX + '" cy="' + (axisY - 14) + '" r="3" style="fill:var(--blue)" />';

        /* 卡片 */
        html += '<g class="gen" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(g.name) + '，' +
          esc(g.status) + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + x0 + '" y="' + top + '" width="' + cardW + '" height="' + cardH + '" rx="4" style="fill:#ffffff;stroke:var(--line);stroke-width:1.2" />';
        html += '<rect x="' + x0 + '" y="' + top + '" width="3.5" height="' + cardH + '" style="fill:var(--blue)" />';
        html += '<text x="' + (x0 + 14) + '" y="' + (top + 24) + '" style="font-size:15.5px;font-weight:700;fill:var(--ink)">' + esc(g.name) + '</text>';
        html += '<text x="' + (x0 + 14) + '" y="' + (top + 41) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
          g.from + ' → ' + g.to + ' · ' + esc(g.status) + '</text>';
        g.specs.forEach(function (s, si) {
          html += '<text x="' + (x0 + 14) + '" y="' + (top + 60 + si * 16) + '" style="font-size:11px;fill:var(--ink-md)">· ' + esc(s) + '</text>';
        });
        html += '</g>';
      });

      html += '<text x="' + padL + '" y="' + (H - 12) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">轴上蓝条 = 量产窗口；虚线条 = 路线图阶段 · 悬停查看规格 · 点击查看来源</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      svg.querySelectorAll('.gen').forEach(function (el) {
        var g = data.gens[+el.getAttribute('data-i')];
        var tip = '<b>' + esc(g.name) + '</b> · ' + esc(g.status) + '<br>' +
          g.specs.map(function (s) { return esc(s); }).join('<br>') +
          '<br><span style="color:var(--ink-lo)">' + esc(g.note) + '</span>';
        el.addEventListener('mouseenter', function (e) { tipShow(tip, e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: g.name + ' · ' + g.from + ' → ' + g.to,
            body: '<p><b>状态：</b>' + esc(g.status) + '</p><p><b>关键规格：</b><br>' +
              g.specs.map(function (s) { return '· ' + esc(s); }).join('<br>') + '</p><p>' + esc(g.note) + '</p>',
            source: g.source, date: g.date
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
