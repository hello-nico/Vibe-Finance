/* assumptions.js — S10 · 共识压力测试
 * 注册 keys: 'assume-a2'（2027 ASIC 单位超过 GPU → 无法判定，多空证据天平）
 *            'assume-a3'（需求可见至 2028 → 延迟，订单能见度时间轴）
 * SPEC §5 / §8：各约 360px
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------------- A2 兜底数据 ---------------- */
  var FALLBACK_A2 = {
    claim: 'A2 · 2027 年 ASIC 单位超过 GPU',
    verdict: '无法判定',
    verdictNote: '合理、模型支持，但未被证明',
    bull: {
      title: '多方证据（支持交叉）',
      items: [
        { t: 'TPU 2027E 800–840 万颗估计', d: '券商研究口径，已进入多家模型', src: '券商研究', date: '2026' },
        { t: '2027 估计区间上限 1,500 万颗', d: '乐观情形足以覆盖交叉点', src: '研究综合', date: '2026' },
        { t: 'Trainium / MTIA 第二代放量', d: '第二轮自研浪潮扩大分母', src: '公司披露 / 研究综合', date: '2025–2026' }
      ]
    },
    bear: {
      title: '空方证据（反对 / 存疑）',
      items: [
        { t: 'GW→单位换算误差 ±40%', d: '每 GW 成本口径不稳，单位数随之漂移', src: '研究综合', date: '2026' },
        { t: '估计区间 650–1,500 万过宽', d: '区间宽度本身即「无法判定」的证据', src: '研究综合', date: '2026' },
        { t: '美元口径 GPU 仍占优', d: '单位交叉 ≠ 价值交叉（K33）', src: '研究综合', date: '2026' }
      ]
    }
  };

  /* ---------------- A3 兜底数据 ---------------- */
  var FALLBACK_A3 = {
    claim: 'A3 · 需求可见至 2028',
    verdict: '延迟',
    verdictNote: '能见度边界随每次财报移动；外推不等于可见',
    axis: [2025, 2026, 2027, 2028],
    visibleTo: 2026.5,   // 实心能见度区右边界
    milestones: [
      { year: 2025, label: '在手订单确认', note: '大型定制 ASIC 客户订单落地（公司披露口径）', solid: true },
      { year: 2026, label: '能见度边界', note: '多数指引止于 2026；之后依赖外推', solid: true },
      { year: 2027, label: '部分可见', note: '2027 指引待披露，仅有零星信号', solid: false },
      { year: 2028, label: '纯外推', note: '「可见至 2028」是把外推当作可见', solid: false }
    ],
    source: '公司披露 / 研究综合',
    date: '2026-07'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }
  function mkSvg(body, W, H, aria) {
    body.innerHTML = '';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', aria);
    svg.style.display = 'block';
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.fontFamily = 'var(--serif)';
    return svg;
  }
  function watchResize(body, render) {
    var lastW = 0;
    function wrapped() {
      var w = Math.floor(body.clientWidth || 0);
      lastW = w;
      render(w);
    }
    wrapped();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        var w = Math.floor(body.clientWidth || 0);
        if (Math.abs(w - lastW) > 1) wrapped();
      });
      ro.observe(body);
    }
  }

  /* evidence[{side,items:[…]}] → bull/bear 渲染模型 */
  function sidesToGroups(cd, fbBull, fbBear) {
    if (!cd || !cd.evidence || !cd.evidence.length) return { bull: fbBull, bear: fbBear };
    function grp(side, fallback) {
      var e = cd.evidence.filter(function (x) { return x.side === side; })[0];
      if (!e) return fallback;
      return {
        title: fallback.title,
        items: (e.items || []).map(function (t) {
          return typeof t === 'string' ? { t: t, d: '', src: '', date: '' } : t;
        })
      };
    }
    return { bull: grp('支持', fbBull), bear: grp('反对', fbBear) };
  }

  /* ================= A2：多空证据天平 ================= */
  window.Charts['assume-a2'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['assume-a2'];
    var groups = sidesToGroups(cd, FALLBACK_A2.bull, FALLBACK_A2.bear);
    var data = {
      claim: (cd && cd.assumption) || FALLBACK_A2.claim,
      verdict: (cd && cd.verdict) || FALLBACK_A2.verdict,
      verdictNote: (cd && cd.note) || FALLBACK_A2.verdictNote,
      bull: groups.bull,
      bear: groups.bear
    };
    var H = 360;

    function render(W) {
      W = Math.max(320, W || 760);
      var narrow = W < 560;
      var hNow = narrow ? 500 : H;
      var svg = mkSvg(body, W, hNow,
        '假设检验 A2：' + data.claim + '，结论：' + data.verdict + '；多空证据并列，天平保持水平');

      var html = '';
      var padL = 24, padR = 24;

      /* 顶部命题 + 判定徽章 */
      html += '<text x="' + (W / 2) + '" y="26" text-anchor="middle" style="font-size:14px;font-weight:700;fill:var(--ink)">' + esc(data.claim) + '</text>';
      var vw = 130;
      html += '<g class="verdict" tabindex="0" role="button" aria-label="判定：' + esc(data.verdict) + '" style="cursor:pointer;outline:none">';
      html += '<rect x="' + (W / 2 - vw / 2) + '" y="38" width="' + vw + '" height="26" rx="13" style="fill:#ffffff;stroke:var(--ink);stroke-width:1.4" />';
      html += '<text x="' + (W / 2) + '" y="55" text-anchor="middle" style="font-size:12.5px;font-weight:700;fill:var(--ink)">判定：' + esc(data.verdict) + '</text>';
      html += '</g>';

      /* 窄屏：对照表式纵向堆叠（天平隐喻保留在桌面版） */
      var cols;
      if (narrow) {
        cols = [
          { d: data.bull, color: 'var(--blue)' },
          { d: data.bear, color: 'var(--ink-md)' }
        ];
        var sy = 92;
        cols.forEach(function (c, ci) {
          html += '<text x="' + padL + '" y="' + sy + '" style="font-size:12.5px;font-weight:700;fill:' + c.color + '">' +
            (ci === 0 ? '◀ ' : '') + esc(c.d.title) + (ci === 1 ? ' ▶' : '') + '</text>';
          c.d.items.forEach(function (it, ii) {
            var iy = sy + 22 + ii * 42;
            html += '<g class="ev ' + (ci === 0 ? 'bull' : 'bear') + '" data-c="' + ci + '" data-i="' + ii + '" tabindex="0" role="button" aria-label="' +
              esc(it.t) + '" style="cursor:pointer;outline:none">';
            html += '<circle cx="' + (padL + 5) + '" cy="' + (iy - 4) + '" r="3.4" style="fill:' + c.color + '" />';
            html += '<text x="' + (padL + 16) + '" y="' + iy + '" style="font-size:11.5px;fill:var(--ink)">' + esc(it.t) + '</text>';
            if (it.src || it.date) {
              html += '<text x="' + (padL + 16) + '" y="' + (iy + 15) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
                esc([it.src, it.date].filter(Boolean).join(' · ')) + '</text>';
            }
            html += '</g>';
          });
          sy += 22 + c.d.items.length * 42 + 18;
        });
        /* 小型水平天平符号 */
        var bx = W / 2, by = sy + 10;
        html += '<line x1="' + (bx - 60) + '" y1="' + by + '" x2="' + (bx + 60) + '" y2="' + by + '" style="stroke:var(--ink);stroke-width:2" />';
        html += '<circle cx="' + bx + '" cy="' + by + '" r="4" style="fill:var(--ink)" />';
        html += '<text x="' + bx + '" y="' + (by + 20) + '" text-anchor="middle" style="font-size:10px;fill:var(--ink-lo)">天平保持水平 = 无法判定</text>';
        html += '<rect x="' + padL + '" y="' + (hNow - 28) + '" width="3" height="20" style="fill:var(--blue)" />';
        html += '<text x="' + (padL + 12) + '" y="' + (hNow - 14) + '" style="font-size:12px;fill:var(--ink-md)">' + esc(data.verdictNote) + '</text>';
        svg.innerHTML = html;
        body.appendChild(svg);
        bindA2(svg, cols);
        return;
      }

      /* 中央天平：支柱 + 水平横梁 + 两盘 */
      var cx = W / 2, beamY = 132, fulY = 108, baseY = 300;
      html += '<line x1="' + cx + '" y1="' + fulY + '" x2="' + cx + '" y2="' + (baseY - 10) + '" style="stroke:var(--ink-md);stroke-width:2" />';
      html += '<path d="M ' + (cx - 26) + ' ' + baseY + ' L ' + (cx + 26) + ' ' + baseY + ' L ' + cx + ' ' + (baseY - 12) + ' Z" style="fill:var(--ink-md)" />';
      var beamHalf = Math.min(210, (W - padL - padR) / 2 - 60);
      html += '<line x1="' + (cx - beamHalf) + '" y1="' + beamY + '" x2="' + (cx + beamHalf) + '" y2="' + beamY +
        '" style="stroke:var(--ink);stroke-width:2.4" />';
      html += '<circle cx="' + cx + '" cy="' + beamY + '" r="5" style="fill:var(--ink)" />';
      /* 左盘（多方，蓝）右盘（空方，墨） —— 水平 = 无法判定 */
      [['-1', 'var(--blue)'], ['1', 'var(--ink-md)']].forEach(function (cfg) {
        var dir = +cfg[0];
        var px = cx + dir * beamHalf;
        html += '<line x1="' + px + '" y1="' + beamY + '" x2="' + px + '" y2="' + (beamY + 26) + '" style="stroke:var(--ink-lo);stroke-width:1.2" />';
        html += '<path d="M ' + (px - 30) + ' ' + (beamY + 26) + ' A 30 12 0 0 0 ' + (px + 30) + ' ' + (beamY + 26) +
          '" style="fill:none;stroke:' + cfg[1] + ';stroke-width:2.2" />';
      });

      /* 两侧证据列 */
      var colW = (W - padL - padR) / 2 - 46;
      var cols = [
        { d: data.bull, x: padL, color: 'var(--blue)', align: 'start', cls: 'bull' },
        { d: data.bear, x: W - padR - colW, color: 'var(--ink-md)', align: 'start', cls: 'bear' }
      ];
      cols.forEach(function (c, ci) {
        html += '<text x="' + c.x + '" y="' + (beamY + 64) + '" style="font-size:12.5px;font-weight:700;fill:' + c.color + '">' +
          (ci === 0 ? '◀ ' : '') + esc(c.d.title) + (ci === 1 ? ' ▶' : '') + '</text>';
        c.d.items.forEach(function (it, ii) {
          var iy = beamY + 82 + ii * 44;
          html += '<g class="ev ' + c.cls + '" data-c="' + ci + '" data-i="' + ii + '" tabindex="0" role="button" aria-label="' +
            esc(it.t) + '" style="cursor:pointer;outline:none">';
          html += '<circle cx="' + (c.x + 5) + '" cy="' + (iy - 4) + '" r="3.4" style="fill:' + c.color + '" />';
          html += '<text x="' + (c.x + 16) + '" y="' + iy + '" style="font-size:11.5px;fill:var(--ink)">' + esc(it.t) + '</text>';
          if (it.src || it.date) {
            html += '<text x="' + (c.x + 16) + '" y="' + (iy + 15) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
              esc([it.src, it.date].filter(Boolean).join(' · ')) + '</text>';
          }
          html += '</g>';
        });
      });

      /* 底部结论 */
      html += '<rect x="' + padL + '" y="' + (H - 34) + '" width="3" height="22" style="fill:var(--blue)" />';
      html += '<text x="' + (padL + 12) + '" y="' + (H - 18) + '" style="font-size:12px;fill:var(--ink-md)">' + esc(data.verdictNote) +
        ' —— 天平保持水平，美元口径下 GPU 仍占优</text>';

      svg.innerHTML = html;
      body.appendChild(svg);
      bindA2(svg, cols);
    }

    function bindA2(svg, cols) {
      svg.querySelectorAll('.ev').forEach(function (el) {
        var c = cols[+el.getAttribute('data-c')].d;
        var it = c.items[+el.getAttribute('data-i')];
        var tip = '<b>' + esc(it.t) + '</b><br><span style="color:var(--ink-lo)">' + esc(it.d) + '</span>';
        el.addEventListener('mouseenter', function (e) { tipShow(tip, e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: data.claim + ' · ' + data.verdict,
            body: '<p><b>' + esc(c.title) + '</b></p><p><b>' + esc(it.t) + '</b> —— ' + esc(it.d) + '</p>' +
              '<p>结论：' + esc(data.verdict) + '。' + esc(data.verdictNote) + '。</p>',
            source: it.src, date: it.date
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      var vEl = svg.querySelector('.verdict');
      if (!vEl) return;
      function vDrill() {
        drill({
          title: data.claim,
          body: '<p><b>判定：' + esc(data.verdict) + '</b> —— ' + esc(data.verdictNote) + '。</p>' +
            '<p>多空证据并列后，天平保持水平：单位口径的交叉点既未被证实，也未被证伪；监测 TPU 数量收敛与各路估计的收敛速度。</p>',
          source: '研究综合', date: '2026-07'
        });
      }
      vEl.addEventListener('click', vDrill);
      vEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vDrill(); }
      });
    }

    watchResize(body, render);
  };

  /* ================= A3：订单能见度时间轴 ================= */
  window.Charts['assume-a3'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['assume-a3'];
    /* CHART_DATA['assume-a3'] = {assumption,verdict,verdictClass,evidence:[{side,items}],note} → 里程碑模型 */
    var milestones = FALLBACK_A3.milestones;
    if (cd && cd.evidence && cd.evidence.length) {
      function side(name) {
        var e = cd.evidence.filter(function (x) { return x.side === name; })[0];
        return e ? (e.items || []) : [];
      }
      var sup = side('支持'), opp = side('反对');
      milestones = [
        { year: 2025, label: '在手订单确认', note: sup[0] || FALLBACK_A3.milestones[0].note, solid: true },
        { year: 2026, label: '能见度边界', note: sup.slice(1).join('；') || FALLBACK_A3.milestones[1].note, solid: true },
        { year: 2027, label: '部分可见', note: opp.slice(0, 2).join('；') || FALLBACK_A3.milestones[2].note, solid: false },
        { year: 2028, label: '纯外推', note: opp[2] || FALLBACK_A3.milestones[3].note, solid: false }
      ];
    }
    var data = {
      claim: (cd && cd.assumption) || FALLBACK_A3.claim,
      verdict: (cd && cd.verdict) || FALLBACK_A3.verdict,
      verdictNote: (cd && cd.note) || FALLBACK_A3.verdictNote,
      axis: FALLBACK_A3.axis,
      visibleTo: FALLBACK_A3.visibleTo,
      milestones: milestones,
      source: (cd && cd.source) || FALLBACK_A3.source,
      date: (cd && cd.date) || FALLBACK_A3.date
    };
    var H = 360;

    function render(W) {
      W = Math.max(320, W || 760);
      var svg = mkSvg(body, W, H,
        '假设检验 A3：' + data.claim + '，结论：' + data.verdict + '；能见度区实心，外推区虚线');

      var html = '';
      var padL = 34, padR = 34;
      var axisY = 168;
      var y0 = data.axis[0], y1 = data.axis[data.axis.length - 1];
      function X(year) { return padL + (W - padL - padR) * (year - y0) / (y1 - y0); }

      /* 顶部命题 + 判定徽章 */
      html += '<text x="' + (W / 2) + '" y="28" text-anchor="middle" style="font-size:14px;font-weight:700;fill:var(--ink)">' + esc(data.claim) + '</text>';
      html += '<g class="verdict" tabindex="0" role="button" aria-label="判定：' + esc(data.verdict) + '" style="cursor:pointer;outline:none">';
      html += '<rect x="' + (W / 2 - 110) + '" y="40" width="220" height="26" rx="13" style="fill:#ffffff;stroke:var(--copper);stroke-width:1.4" />';
      html += '<text x="' + (W / 2) + '" y="57" text-anchor="middle" style="font-size:12.5px;font-weight:700;fill:var(--copper)">判定：' + esc(data.verdict) + '（能见度前移中）</text>';
      html += '</g>';

      /* 能见度区（实心）与外推区（虚线） */
      var narrow = W < 560;
      var vx = X(data.visibleTo);
      html += '<rect x="' + padL + '" y="' + (axisY - 13) + '" width="' + (vx - padL) + '" height="26" rx="4" style="fill:var(--blue);opacity:.85" class="zone" data-z="0" />';
      html += '<rect x="' + vx + '" y="' + (axisY - 13) + '" width="' + (W - padR - vx) + '" height="26" rx="4" style="fill:#ffffff;stroke:var(--ink-lo);stroke-width:1.4;stroke-dasharray:6 5" class="zone" data-z="1" />';
      html += '<text x="' + ((padL + vx) / 2) + '" y="' + (axisY + 4) + '" text-anchor="middle" style="font-size:11px;font-weight:700;fill:#ffffff">' +
        (narrow ? '能见度区（披露）' : '能见度区 · 在手订单（公司披露）') + '</text>';
      html += '<text x="' + ((vx + W - padR) / 2) + '" y="' + (axisY + 4) + '" text-anchor="middle" style="font-size:11px;fill:var(--ink-lo)">' +
        (narrow ? '外推区' : '外推区（研究综合）') + '</text>';

      /* 能见度边界竖线 */
      html += '<line x1="' + vx + '" y1="' + (axisY - 40) + '" x2="' + vx + '" y2="' + (axisY + 40) + '" style="stroke:var(--ink);stroke-width:1.6" />';
      html += '<text x="' + vx + '" y="' + (axisY - 46) + '" text-anchor="middle" style="font-size:10.5px;font-weight:700;fill:var(--ink)">能见度边界（随每次财报移动）</text>';

      /* 年份刻度 */
      data.axis.forEach(function (y) {
        html += '<line x1="' + X(y) + '" y1="' + (axisY + 24) + '" x2="' + X(y) + '" y2="' + (axisY + 30) + '" style="stroke:var(--ink-md);stroke-width:1" />';
        html += '<text x="' + X(y) + '" y="' + (axisY + 46) + '" text-anchor="middle" style="font-size:11.5px;fill:var(--ink-md);font-family:var(--mono)">' + y + '</text>';
      });

      /* 里程碑（盒子做边缘钳制 + 窄屏变窄，避免出血/重叠） */
      var boxW = narrow ? 96 : 112;
      data.milestones.forEach(function (m, i) {
        var mx = X(m.year);
        var my = axisY + 78 + (i % 2) * 34;
        var boxX = Math.min(Math.max(mx - boxW / 2, padL), W - padR - boxW);
        var textX = boxX + boxW / 2;
        html += '<g class="ms" data-i="' + i + '" tabindex="0" role="button" aria-label="' + m.year + ' ' + esc(m.label) + '" style="cursor:pointer;outline:none">';
        html += '<line x1="' + mx + '" y1="' + (axisY + 30) + '" x2="' + mx + '" y2="' + (my - 12) + '" style="stroke:var(--ink-lo);stroke-width:1;stroke-dasharray:2 3" />';
        html += '<circle cx="' + mx + '" cy="' + (axisY + 13) + '" r="4" style="fill:' + (m.solid ? '#ffffff' : 'var(--paper-hi)') + ';stroke:' + (m.solid ? '#ffffff' : 'var(--ink-lo)') + ';stroke-width:1.6" />';
        html += '<rect x="' + boxX + '" y="' + (my - 12) + '" width="' + boxW + '" height="30" rx="3" style="fill:#ffffff;stroke:var(--line);stroke-width:1' + (m.solid ? '' : ';stroke-dasharray:4 3') + '" />';
        html += '<text x="' + textX + '" y="' + (my + 7) + '" text-anchor="middle" style="font-size:' + (narrow ? 9.5 : 10.5) + 'px;fill:var(--ink)">' + esc(m.label) + '</text>';
        html += '</g>';
      });

      /* 底部结论 */
      html += '<rect x="' + padL + '" y="' + (H - 40) + '" width="3" height="26" style="fill:var(--copper)" />';
      html += '<text x="' + (padL + 12) + '" y="' + (H - 26) + '" style="font-size:' + (narrow ? 11 : 12) + 'px;fill:var(--ink-md)">判定「' + esc(data.verdict) + '」：' + esc(data.verdictNote) + '</text>';
      html += '<text x="' + (padL + 12) + '" y="' + (H - 12) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">' +
        esc(data.source) + ' · ' + esc(data.date) + '</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      var zoneTips = [
        '<b>能见度区</b><br>在手订单与正式指引覆盖的区间（公司披露口径）',
        '<b>外推区</b><br>超出披露边界的部分为研究外推；把外推当作可见，是 A3 的核心风险'
      ];
      svg.querySelectorAll('.zone').forEach(function (el) {
        var z = +el.getAttribute('data-z');
        el.addEventListener('mouseenter', function (e) { tipShow(zoneTips[z], e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
      });

      svg.querySelectorAll('.ms').forEach(function (el) {
        var m = data.milestones[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b>' + m.year + ' · ' + esc(m.label) + '</b><br><span style="color:var(--ink-lo)">' + esc(m.note) + '</span>', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: m.year + ' · ' + m.label,
            body: '<p>' + esc(m.note) + '</p><p>命题「' + esc(data.claim) + '」的判定为「' + esc(data.verdict) +
              '」：' + esc(data.verdictNote) + '。</p>',
            source: data.source, date: data.date
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      var vEl = svg.querySelector('.verdict');
      function vDrill() {
        drill({
          title: data.claim,
          body: '<p><b>判定：' + esc(data.verdict) + '</b> —— ' + esc(data.verdictNote) + '。</p>' +
            '<p>订单能见度目前覆盖至 2026 年（公司披露口径）；2027 年仅部分可见，2028 年纯属外推。每季度复核能见度边界是否前移。</p>',
          source: data.source, date: data.date
        });
      }
      vEl.addEventListener('click', vDrill);
      vEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); vDrill(); }
      });
    }

    watchResize(body, render);
  };
})();
