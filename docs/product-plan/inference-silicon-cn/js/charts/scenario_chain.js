/* scenario_chain.js — §9 · 情景算术：乘法链 + 区间条
 * 注册 key: 'scenario-chain'（SPEC §5 / §8：~360px）
 * 原版规格：STEP 1——云厂 capex 路径 1.52×（330→500）× ASIC 美元份额 1.67×（12→20%）
 *   = Base-case 2.0–4.7×（蓝框强调，midpoint≈2.5×）；
 * STEP 2——0–5× 横轴三条区间条：Base 蓝填充带 / Conservative 墨框 /
 *   Contraction 红虚线框（−15%~−35%，等值 0.65–0.85×）；
 * 下附 KILL SWITCH 注 + 4–7× 估计已退役免责声明；点击各环节弹 basis+source 卡。
 * 数值口径：data.js K1–K4 / CHART_DATA['scenario-chain']。
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* STEP 1 乘法链三环节 */
  var FACTORS = [
    { key: 'capex', label: '云厂 capex 路径', en: 'Cloud capex path', range: '1.52×',
      basis: '依据：Top-4 云厂 capex 2025 ≈$410–413B（编制估计 compiled estimate，K5）、2026 年指引 $695–725B；向 2028 外推的三年美元路径取 1.52×（330→500）。口径：美元；不使用单位或 CoWoS 口径。',
      source: '公司披露（10-K/10-Q）· 券商研究（Nomura，2025-12-02）· 研究综合' },
    { key: 'share', label: 'ASIC 美元份额', en: 'ASIC dollar share', range: '1.67×',
      basis: '依据：ASIC 在 AI 加速器美元口径中的份额提升路径 12%→20%（Series A 读数，K8），即 1.67×；与单位口径、CoWoS 口径分列，不混用。',
      source: '研究综合 · 三种口径份额（§4）' },
    { key: 'base', label: 'Base 情景', en: 'Base-case', range: '2.0–4.7×', mid: 'midpoint ≈ 2.5×',
      basis: '依据：1.52×（330→500）× 1.67×（12→20%），乘积中点 ≈2.5×，对外表述区间 2.0–4.7×；情景乘法只使用美元口径；失效阈值见 K4（+14%）。',
      source: '研究综合 · K1' }
  ];

  /* STEP 2 区间条（横轴 0–5×；Contraction −15%~−35% 以 0.65–0.85× 等值放置） */
  var BARS = [
    { key: 'base', name: 'Base', range: '2.0–4.7×', lo: 2.0, hi: 4.7, mid: 2.5,
      style: 'fill', color: 'var(--blue)', ref: 'K1',
      basis: FACTORS[2].basis, source: '研究综合 · K1' },
    { key: 'cons', name: 'Conservative', range: '1.9–2.1×', lo: 1.9, hi: 2.1, mid: 2.0,
      style: 'ink', color: 'var(--ink)', ref: 'K2',
      basis: '依据：capex 增速放缓但仍为正、单位增长减速、电力主导供给拉伸；供应约束延续、需求温和情形，三年美元口径 1.9–2.1×（≈2.0×）。',
      source: '研究综合 · K2' },
    { key: 'neg', name: 'Contraction', range: '−15%~−35%', lo: 0.65, hi: 0.85, mid: 0.75,
      style: 'neg', color: 'var(--neg)', ref: 'K3',
      basis: '依据：−15% 对应电力与已签约需求缓冲起效，−35% 对应缓冲失效、重复下单全额出清（2001 年行业 −32% 为历史锚）；在 0–5× 横轴上以 0.65–0.85× 等值放置。压力参照，非预测；kill switch 触发后进入本情景复核。',
      source: '研究综合 · K3' }
  ];

  var KILL_NOTE = 'KILL SWITCH ▸ 若 2027 Top-4 capex 增速 <+14%，Base 失效、Conservative 接管（K4）';
  var RETIRED = '免责声明：早期 4–7× 上行情景估计已退役，不再进入区间条；Contraction 为压力参照，非预测。';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* CJK 计 1、其余计 0.58 的加权长度 → 估算像素 = units × fontSize */
  function ulen(s) {
    var u = 0;
    for (var i = 0; i < s.length; i++) {
      u += /[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(s.charAt(i)) ? 1 : 0.58;
    }
    return u;
  }
  function fitText(s, fontSize, maxW) {
    if (ulen(s) * fontSize <= maxW) return s;
    var out = '';
    for (var i = 0; i < s.length; i++) {
      if (ulen(out + s.charAt(i) + '…') * fontSize > maxW) break;
      out += s.charAt(i);
    }
    return out + '…';
  }
  /* 按 maxW 折行（贪心断行；拉丁词不从中断开，最多 maxLines 行，末行超出加省略号） */
  function wrapText(s, fontSize, maxW, maxLines) {
    function isLat(ch) { return /[A-Za-z0-9]/.test(ch); }
    var lines = [], cur = '', i;
    for (i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (cur !== '' && ulen(cur + ch) * fontSize > maxW) {
        var br = cur.length;               // 断点：若在拉丁词中间则回溯到词首
        if (isLat(cur.charAt(br - 1)) && isLat(ch)) {
          var j = br - 1;
          while (j > 0 && isLat(cur.charAt(j - 1))) j--;
          if (j > 0) br = j;
        }
        lines.push(cur.slice(0, br));
        cur = cur.slice(br) + ch;
        if (lines.length === maxLines) break;
      } else {
        cur += ch;
      }
    }
    if (lines.length === maxLines) {          // 已满：剩余并入末行并截断
      lines[maxLines - 1] = fitText(lines[maxLines - 1] + cur + s.slice(i + 1), fontSize, maxW);
    } else if (cur) {
      lines.push(cur);
    }
    return lines;
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  window.Charts['scenario-chain'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;

    var H = 384;
    var lastW = 0;

    function render() {
      var W = Math.max(320, Math.floor(body.clientWidth || 760));
      lastW = W;
      body.innerHTML = '';

      var narrow = W < 560;
      var pad = narrow ? 12 : 24;

      /* 注记区折行预算（决定总高 H） */
      var killFS = narrow ? 10 : 11;
      var retFS = narrow ? 9.5 : 10.5;
      var KILL_PREFIX = 'KILL SWITCH ▸ ';
      var KILL_BODY = '若 2027 Top-4 capex 增速 <+14%，Base 失效、Conservative 接管（K4）';
      var preW = ulen(KILL_PREFIX) * killFS * 1.08;      // mono bold 加安全余量
      var killL1 = '', ki;
      for (ki = 0; ki < KILL_BODY.length; ki++) {
        if (ulen(killL1 + KILL_BODY.charAt(ki)) * killFS > W - 2 * pad - 16 - preW) break;
        killL1 += KILL_BODY.charAt(ki);
      }
      var killRest = KILL_BODY.slice(ki);
      var killLines = [killL1];
      if (killRest) killLines.push(fitText(killRest, killFS, W - 2 * pad - 16));
      var retLines = wrapText(RETIRED, retFS, W - 2 * pad, 2);
      var H = 384 + (killLines.length - 1) * 14 + (retLines.length - 1) * 14;

      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label',
        '情景乘法链与区间条：STEP 1，云厂 capex 路径 1.52 倍（330→500）乘 ASIC 美元份额 1.67 倍（12%→20%）等于 Base 情景 2.0–4.7 倍（中点约 2.5 倍）；' +
        'STEP 2，0 到 5 倍横轴上三条区间条：Base 2.0–4.7 倍蓝填充带、Conservative 1.9–2.1 倍墨框、Contraction −15% 至 −35% 红虚线框；' +
        '附 KILL SWITCH 注与 4–7 倍估计已退役免责声明');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var html = '';

      /* ================= STEP 1 · 乘法链 ================= */
      html += '<text x="' + pad + '" y="18" style="font-size:10.5px;font-weight:700;letter-spacing:.14em;fill:var(--ink);font-family:var(--mono)">STEP 1 · 乘法链（美元口径 · 三年）</text>';

      var opW = narrow ? 22 : 36;
      var boxH = 66, boxY = 28;
      var boxW = (W - 2 * pad - 2 * opW) / 3;
      var boxX = [pad, pad + boxW + opW, pad + 2 * (boxW + opW)];

      FACTORS.forEach(function (f, i) {
        var x = boxX[i], emph = f.key === 'base';
        html += '<g class="sc-f" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(f.label) + ' ' + esc(f.range) + (f.mid ? '，' + esc(f.mid) : '') + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + x + '" y="' + boxY + '" width="' + boxW + '" height="' + boxH + '" rx="5" style="fill:' +
          (emph ? 'var(--blue)' : '#ffffff') + ';stroke:var(--blue);stroke-width:' + (emph ? 0 : 1.4) + '" />';
        var fg = emph ? '#ffffff' : 'var(--ink)';
        var fgLo = emph ? 'rgba(255,255,255,.75)' : 'var(--ink-lo)';
        html += '<text x="' + (x + 12) + '" y="' + (boxY + 17) + '" style="font-size:9px;letter-spacing:.08em;fill:' + fgLo + ';font-family:var(--mono)">' + esc(f.label) + '</text>';
        html += '<text x="' + (x + 12) + '" y="' + (boxY + 43) + '" style="font-size:' + (narrow ? 13.5 : 19) + 'px;font-weight:700;fill:' + fg + ';font-family:var(--mono)">' + esc(f.range) + '</text>';
        var sub = f.mid ? (narrow ? 'mid ≈ 2.5×' : f.mid) : (narrow ? '' : f.en);   // 窄屏省略英文副标，保留 mid
        if (sub) html += '<text x="' + (x + 12) + '" y="' + (boxY + 59) + '" style="font-size:9px;fill:' + fgLo + ';font-family:var(--mono)">' + esc(fitText(sub, 9, boxW - 24)) + '</text>';
        html += '</g>';
        /* 运算符 × / = */
        if (i < 2) {
          var op = i === 0 ? '×' : '=';
          html += '<text x="' + (x + boxW + opW / 2) + '" y="' + (boxY + boxH / 2 + 7) + '" text-anchor="middle" style="font-size:' + (narrow ? 16 : 21) + 'px;font-weight:700;fill:var(--ink-md);font-family:var(--mono)">' + op + '</text>';
        }
      });
      if (!narrow) {
        html += '<text x="' + pad + '" y="' + (boxY + boxH + 16) + '" style="font-size:9.5px;fill:var(--ink-lo);font-family:var(--mono)">乘数 1.52×（330→500）× 1.67×（12→20%）· 中点 ≈2.5× · 对外表述 2.0–4.7×（K1）· 点击任一环节查看依据与来源</text>';
      }

      /* ================= STEP 2 · 区间条 ================= */
      var s2Y = narrow ? boxY + boxH + 26 : boxY + boxH + 34;
      html += '<text x="' + pad + '" y="' + s2Y + '" style="font-size:10.5px;font-weight:700;letter-spacing:.14em;fill:var(--ink);font-family:var(--mono)">STEP 2 · 区间条（0–5× 横轴）</text>';

      var labW = narrow ? 96 : 148;
      var ax0 = pad + labW, ax1 = W - pad - 8;
      var sx = function (v) { return ax0 + (ax1 - ax0) * v / 5; };
      var barH = 18, pitch = 36, barY0 = s2Y + 12;
      var axisY = barY0 + 3 * pitch + 2;

      /* 网格竖线 + 刻度 */
      for (var t = 0; t <= 5; t++) {
        html += '<line x1="' + sx(t) + '" y1="' + (barY0 - 2) + '" x2="' + sx(t) + '" y2="' + axisY + '" style="stroke:var(--line-lo);stroke-width:1" />';
        html += '<text x="' + sx(t) + '" y="' + (axisY + 13) + '" text-anchor="middle" style="font-size:9px;fill:var(--ink-lo);font-family:var(--mono)">' + t + '×</text>';
      }
      html += '<line x1="' + ax0 + '" y1="' + axisY + '" x2="' + ax1 + '" y2="' + axisY + '" style="stroke:var(--line);stroke-width:1.2" />';

      BARS.forEach(function (b, i) {
        var by = barY0 + i * pitch;
        var cy = by + barH / 2;
        var x0 = sx(b.lo), x1 = sx(b.hi), bw = x1 - x0;

        /* 行标签 */
        html += '<text x="' + (pad) + '" y="' + (cy - 1) + '" style="font-size:10px;font-weight:700;fill:' + b.color + ';font-family:var(--mono)">' + esc(b.name) + '</text>';
        html += '<text x="' + (pad) + '" y="' + (cy + 11) + '" style="font-size:9.5px;fill:var(--ink-md);font-family:var(--mono)">' + esc(b.range) + '</text>';

        /* 区间条 */
        var fillStyle, strokeStyle;
        if (b.style === 'fill') { fillStyle = 'var(--blue)'; strokeStyle = 'none'; }
        else if (b.style === 'ink') { fillStyle = '#ffffff'; strokeStyle = 'var(--ink)'; }
        else { fillStyle = '#ffffff'; strokeStyle = 'var(--neg)'; }
        html += '<g class="sc-bar" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(b.name) + ' 区间 ' + esc(b.range) + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + x0 + '" y="' + by + '" width="' + bw + '" height="' + barH + '" rx="' + (b.style === 'fill' ? 3 : 1) + '" style="fill:' + fillStyle +
          (b.style === 'fill' ? '' : ';stroke:' + strokeStyle + ';stroke-width:1.6' + (b.style === 'neg' ? ';stroke-dasharray:5 3' : '')) + '" />';
        /* Base：中点刻线 + 带内数值 */
        if (b.style === 'fill') {
          /* 中点刻线只画在条外上下沿，不穿过带内数值 */
          html += '<line x1="' + sx(b.mid) + '" y1="' + (by - 4) + '" x2="' + sx(b.mid) + '" y2="' + (by + 2) + '" style="stroke:var(--blue);stroke-width:1.6" />';
          html += '<line x1="' + sx(b.mid) + '" y1="' + (by + barH - 2) + '" x2="' + sx(b.mid) + '" y2="' + (by + barH + 4) + '" style="stroke:var(--blue);stroke-width:1.6" />';
          if (bw > 60) html += '<text x="' + ((x0 + x1) / 2) + '" y="' + (cy + 3.5) + '" text-anchor="middle" style="font-size:10px;font-weight:700;fill:#ffffff;font-family:var(--mono)">' + esc(b.range) + '</text>';
          if (!narrow) html += '<text x="' + sx(b.mid) + '" y="' + (by - 8) + '" text-anchor="middle" style="font-size:8.5px;fill:var(--blue);font-family:var(--mono)">mid≈2.5×</text>';
        } else {
          /* 条右端数值 */
          html += '<text x="' + (x1 + 6) + '" y="' + (cy + 3.5) + '" style="font-size:9.5px;fill:' + b.color + ';font-family:var(--mono)">' +
            (b.style === 'neg' ? '=0.65–0.85×' : esc(b.range)) + '</text>';
        }
        html += '</g>';
      });

      /* ================= 注记区 ================= */
      var noteY = axisY + 34;
      html += '<g class="sc-kill" tabindex="0" role="button" aria-label="' + esc(KILL_NOTE) + '" style="cursor:pointer;outline:none">';
      html += '<rect x="' + pad + '" y="' + (noteY - 10) + '" width="8" height="8" style="fill:var(--neg)" />';
      html += '<text x="' + (pad + 16) + '" y="' + noteY + '" style="font-size:' + killFS + 'px;fill:var(--neg)">' +
        '<tspan style="font-family:var(--mono);font-weight:700">' + esc(KILL_PREFIX) + '</tspan>' + esc(killLines[0]) + '</text>';
      if (killLines[1]) {
        html += '<text x="' + (pad + 16) + '" y="' + (noteY + 14) + '" style="font-size:' + killFS + 'px;fill:var(--neg)">' + esc(killLines[1]) + '</text>';
      }
      html += '</g>';
      var retY = noteY + killLines.length * 14 + 8;
      html += '<g class="sc-ret" tabindex="0" role="button" aria-label="' + esc(RETIRED) + '" style="cursor:pointer;outline:none">';
      retLines.forEach(function (ln, li) {
        html += '<text x="' + pad + '" y="' + (retY + li * 14) + '" style="font-size:' + retFS + 'px;fill:var(--ink-lo)">' + esc(ln) + '</text>';
      });
      html += '</g>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* ---------- 交互 ---------- */
      function bind(el, tip, drillFn) {
        el.addEventListener('mouseenter', function (e) { tipShow(tip, e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        el.addEventListener('click', drillFn);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drillFn(); }
        });
      }

      svg.querySelectorAll('.sc-f').forEach(function (el) {
        var f = FACTORS[+el.getAttribute('data-i')];
        bind(el,
          '<b>' + esc(f.label) + '</b> · <span style="color:var(--blue)">' + esc(f.range) + '</span>' +
          (f.mid ? '<br><span style="color:var(--ink-lo)">' + esc(f.mid) + '</span>' : ''),
          function () {
            drill({ title: f.label + ' ' + f.range + (f.mid ? '（' + f.mid + '）' : ''), body: f.basis, source: f.source, date: '2026-07' });
          });
      });

      svg.querySelectorAll('.sc-bar').forEach(function (el) {
        var b = BARS[+el.getAttribute('data-i')];
        bind(el,
          '<b style="color:' + b.color + '">' + esc(b.name) + '</b> · ' + esc(b.range) + '<br><span style="color:var(--ink-lo)">横轴位置 ' + b.lo + '–' + b.hi + '×（' + esc(b.ref) + '）</span>',
          function () {
            drill({ title: b.name + ' 区间 ' + b.range + '（' + b.ref + '）', body: b.basis, source: b.source, date: '2026-07' });
          });
      });

      var killEl = svg.querySelector('.sc-kill');
      if (killEl) {
        bind(killEl, '<b style="color:var(--neg)">KILL SWITCH</b><br>若 2027 Top-4 capex 增速低于 +14%，Base 失效、Conservative 接管',
          function () {
            drill({
              title: 'KILL SWITCH —— +14%（K4）',
              body: '依据：+14% 大致等于已宣布产能对应的资本开支摊到 2027 年所需的最低同比增速，也接近 Top-4 经营现金流自然增速的底线；跌破它意味着已宣布项目被砍或推迟、供给曲线左移，Base 失效、Conservative 接管。',
              source: '研究综合 · K4', date: '2026-07'
            });
          });
      }
      var retEl = svg.querySelector('.sc-ret');
      if (retEl) {
        bind(retEl, '<b>已退役估计</b><br><span style="color:var(--ink-lo)">早期 4–7× 上行情景不再进入区间条</span>',
          function () {
            drill({
              title: '免责声明 —— 4–7× 估计已退役',
              body: '依据：早期 4–7× 上行情景在 2026-07 复核后退役——上端缺乏可验证的 capex 路径支撑，保留会导致区间虚宽；当前对外区间以 K1（2.0–4.7×）为准。退役数字仅在此处披露，不参与任何情景乘法。',
              source: '研究综合 · 已退役数字披露', date: '2026-07'
            });
          });
      }
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
