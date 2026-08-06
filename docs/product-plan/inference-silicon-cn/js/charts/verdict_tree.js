/* verdict_tree.js — §9 · 自上而下判定树
 * 注册 key: 'verdict-tree'（SPEC §5 / §8：~420px）
 * 原版规格：深藏青根横幅「判定 · §9 / 结论不是单选题」→ 正交折线分三支
 *   SAME-CASE 蓝框（2000 年剧本）/ DIFFERENT-CASE 墨框（电力主导的拉伸）/
 *   POLICY PARTITION 灰虚线框（超出本报告范围）
 * → 下挂三叶 BASE 2.0–4.7×（midpoint≈2.5×）/ CONSERVATIVE 1.9–2.1×（≈2.0×）/
 *   CONTRACTION −15%~−35%（压力参照，非预测）
 * → 底部 KILL SWITCH 通栏（--neg）。点击节点弹依据卡（drill）。
 * 数值口径：data.js K1–K4 / CHART_DATA['verdict-tree']。
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* 分支/叶定义：数值从 CHART_DATA 按 cls 回填，缺省用 K1–K4 常量 */
  var LEAF_DEF = [
    { cls: 'base', tag: 'BASE', dRange: '2.0–4.7×', dMid: 'midpoint ≈ 2.5×',
      color: 'var(--blue)', w: 2.2, dash: false, ref: 'K1' },
    { cls: 'cons', tag: 'CONSERVATIVE', dRange: '1.9–2.1×', dMid: '≈2.0× · 增速降档 · 仍为正',
      color: 'var(--ink-md)', w: 1.5, dash: false, ref: 'K2' },
    { cls: 'neg', tag: 'CONTRACTION', dRange: '−15%~−35%', dMid: '压力参照，非预测',
      color: 'var(--neg)', w: 1.5, dash: true, ref: 'K3' }
  ];

  var BRANCH_DEF = [
    { key: 'same', tag: 'SAME-CASE', title: '2000 年剧本',
      desc: '需求点火 → 重复下单 → 产能到达 → 出清，机制矩阵逐格命中',
      color: 'var(--blue)', w: 1.8, dash: false,
      basis: '依据：与 1995–2003 窗口的机制矩阵对照——需求点火、供给约束、重复下单、产能到达四格命中；2001 年行业 −32% 是「需求消失＋库存出清」完整形态的历史锚。若同案成立，Base 路径兑现后须警惕出清尾段。' },
    { key: 'diff', tag: 'DIFFERENT-CASE', title: '电力主导的拉伸',
      desc: '电力约束拖慢供给到达，周期被拉长、峰值后移',
      color: 'var(--ink)', w: 1.8, dash: false,
      basis: '依据：用电需求 415→945 TWh、GB200 NVL72 机柜 ≈120kW，部署节拍器慢于订单节拍器；供给被电力与并网拖慢，景气被拉伸而非消失——对应 Conservative 的降档扩张。' },
    { key: 'policy', tag: 'POLICY PARTITION', title: '超出本报告范围',
      desc: '出口管制与政策分割改变市场边界，缺乏可验证口径',
      color: 'var(--ink-lo)', w: 1.5, dash: true,
      basis: '依据：政策分割改变的是市场边界而非产能周期本身；相关路径缺乏可验证的公开口径，本报告不作判定。CONTRACTION −15%~−35% 仅作压力参照，非预测。' }
  ];

  var KILL_TEXT = '若 2027 Top-4 capex 增速 <+14%，Base 失效、Conservative 接管';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  /* 从 CHART_DATA 取叶数值（K1–K4 口径）；body 用纯文本（drill 以 textContent 写入） */
  function buildModel() {
    var cd = window.CHART_DATA && window.CHART_DATA['verdict-tree'];
    var byCls = {};
    if (cd && cd.branches) cd.branches.forEach(function (b) { byCls[b.cls || 'base'] = b; });
    var leaves = LEAF_DEF.map(function (def) {
      var b = byCls[def.cls];
      var range = def.dRange, mid = def.dMid;
      if (b) {
        if (def.cls === 'neg') range = '−15%~−35%';
        else range = String(b.range).replace(/x$/, '×');
        if (def.cls === 'base') mid = 'midpoint ≈ ' + (b.mid != null ? b.mid : 2.5) + '×';
      }
      return {
        cls: def.cls, tag: def.tag, range: range, mid: mid,
        color: def.color, w: def.w, dash: def.dash, ref: def.ref,
        note: (b && b.desc) || ''
      };
    });
    var kill = (cd && cd.killSwitch && cd.killSwitch.threshold) || '+14%';
    return { leaves: leaves, killThreshold: kill };
  }

  window.Charts['verdict-tree'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;

    var H = 420;
    var lastW = 0;

    function render() {
      var model = buildModel();
      var W = Math.max(320, Math.floor(body.clientWidth || 760));
      lastW = W;
      body.innerHTML = '';

      var narrow = W < 560;
      var pad = narrow ? 12 : 24;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label',
        '判定树：根节点「结论不是单选题」向下分三支——SAME-CASE 2000 年剧本、DIFFERENT-CASE 电力主导的拉伸、POLICY PARTITION 超出本报告范围；' +
        '下挂三叶 BASE 2.0–4.7 倍（中点约 2.5 倍）、CONSERVATIVE 1.9–2.1 倍、CONTRACTION −15% 至 −35%（压力参照，非预测）；' +
        '底部 KILL SWITCH：若 2027 Top-4 capex 增速低于 +14%，Base 失效、Conservative 接管');
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      /* 几何 */
      var rootY = 8, rootH = 56, rootB = rootY + rootH;          // 根横幅
      var busY = rootB + 20;                                       // 横向母线
      var brY = busY + 18, brH = narrow ? 66 : 80, brB = brY + brH; // 分支框
      var lfY = brB + 20, lfH = 76, lfB = lfY + lfH;               // 叶框
      var killY = lfB + 30, killH = 54;                            // kill 通栏
      var colW = (W - 2 * pad) / 3;
      var gut = narrow ? 8 : 18;
      var boxW = colW - gut;
      var cx = [0, 1, 2].map(function (i) { return pad + colW * (i + 0.5); });

      var html = '';

      /* 正交连线（先画线，节点后盖） */
      html += '<path d="M ' + (W / 2) + ' ' + rootB + ' L ' + (W / 2) + ' ' + busY +
        ' M ' + cx[0] + ' ' + busY + ' L ' + cx[2] + ' ' + busY +
        cx.map(function (x) { return ' M ' + x + ' ' + busY + ' L ' + x + ' ' + brY; }).join('') +
        cx.map(function (x) { return ' M ' + x + ' ' + brB + ' L ' + x + ' ' + lfY; }).join('') +
        '" style="fill:none;stroke:var(--ink-lo);stroke-width:1.4" />';

      /* 根节点横幅（深藏青） */
      html += '<g class="vt-root" tabindex="0" role="button" aria-label="根节点：判定 §9，结论不是单选题" style="cursor:pointer;outline:none">';
      html += '<rect x="' + pad + '" y="' + rootY + '" width="' + (W - 2 * pad) + '" height="' + rootH + '" rx="5" style="fill:var(--ink)" />';
      html += '<text x="' + (pad + 18) + '" y="' + (rootY + 22) + '" style="font-size:10px;letter-spacing:.18em;fill:#ffffff;opacity:.72;font-family:var(--mono)">判定 · §9</text>';
      html += '<text x="' + (pad + 18) + '" y="' + (rootY + 44) + '" style="font-size:' + (narrow ? 15 : 17) + 'px;font-weight:700;fill:#ffffff">结论不是单选题</text>';
      if (!narrow) {
        html += '<text x="' + (W - pad - 18) + '" y="' + (rootY + 34) + '" text-anchor="end" style="font-size:10px;fill:#ffffff;opacity:.6;font-family:var(--mono)">情景乘法只用美元口径 · 点击节点查看依据</text>';
      }
      html += '</g>';

      /* 三分支 */
      BRANCH_DEF.forEach(function (br, i) {
        var x = cx[i] - boxW / 2;
        html += '<g class="vt-br" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(br.tag) + '：' + esc(br.title) + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + x + '" y="' + brY + '" width="' + boxW + '" height="' + brH + '" rx="5" style="fill:#ffffff;stroke:' +
          br.color + ';stroke-width:' + br.w + (br.dash ? ';stroke-dasharray:6 4' : '') + '" />';
        html += '<text x="' + (x + 12) + '" y="' + (brY + 19) + '" style="font-size:' + (narrow ? 8 : 9.5) + 'px;letter-spacing:' + (narrow ? '.04em' : '.12em') + ';fill:' + br.color + ';font-family:var(--mono);font-weight:700">' + esc(br.tag) + '</text>';
        html += '<text x="' + (x + 12) + '" y="' + (brY + 41) + '" style="font-size:' + (narrow ? 12.5 : 14.5) + 'px;font-weight:700;fill:var(--ink)">' + esc(br.title) + '</text>';
        if (!narrow) {
          /* 描述换两行内放下（按宽度截断） */
          var maxU = (boxW - 24) / 10.5;
          var d = br.desc;
          var l1 = d, l2 = '';
          if (d.length > maxU) {
            var cut = Math.floor(maxU);
            l1 = d.slice(0, cut);
            l2 = d.slice(cut, cut * 2 - 1) + (d.length > cut * 2 - 1 ? '…' : '');
          }
          html += '<text x="' + (x + 12) + '" y="' + (brY + 59) + '" style="font-size:10px;fill:var(--ink-lo)">' + esc(l1) + '</text>';
          if (l2) html += '<text x="' + (x + 12) + '" y="' + (brY + 72) + '" style="font-size:10px;fill:var(--ink-lo)">' + esc(l2) + '</text>';
        }
        html += '</g>';
      });

      /* 三叶 */
      model.leaves.forEach(function (lf, i) {
        var x = cx[i] - boxW / 2;
        html += '<g class="vt-leaf" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(lf.tag) + ' ' + esc(lf.range) + '，' + esc(lf.mid) + '" style="cursor:pointer;outline:none">';
        html += '<rect x="' + x + '" y="' + lfY + '" width="' + boxW + '" height="' + lfH + '" rx="5" style="fill:#ffffff;stroke:' +
          lf.color + ';stroke-width:' + lf.w + (lf.dash ? ';stroke-dasharray:6 4' : '') + '" />';
        html += '<rect x="' + x + '" y="' + lfY + '" width="4" height="' + lfH + '" style="fill:' + lf.color + '" />';
        html += '<text x="' + (x + 14) + '" y="' + (lfY + 18) + '" style="font-size:' + (narrow ? 8 : 9) + 'px;letter-spacing:' + (narrow ? '.04em' : '.12em') + ';fill:' + lf.color + ';font-family:var(--mono);font-weight:700">' + esc(lf.tag) + (narrow ? '' : ' · ' + esc(lf.ref)) + '</text>';
        html += '<text x="' + (x + 14) + '" y="' + (lfY + 45) + '" style="font-size:' + (narrow ? 15 : 20) + 'px;font-weight:700;fill:' + lf.color + ';font-family:var(--mono)">' + esc(lf.range) + '</text>';
        html += '<text x="' + (x + 14) + '" y="' + (lfY + 64) + '" style="font-size:10px;fill:' + (lf.cls === 'neg' ? 'var(--neg)' : 'var(--ink-md)') + '">' + esc(lf.mid) + '</text>';
        html += '</g>';
      });

      /* KILL SWITCH 通栏 */
      var oneLine = W >= 640;
      html += '<g class="vt-kill" tabindex="0" role="button" aria-label="KILL SWITCH：' + esc(KILL_TEXT) + '" style="cursor:pointer;outline:none">';
      html += '<rect x="' + pad + '" y="' + killY + '" width="' + (W - 2 * pad) + '" height="' + killH + '" rx="5" style="fill:#ffffff;stroke:var(--neg);stroke-width:1.8" />';
      html += '<rect x="' + (pad + 16) + '" y="' + (killY + (oneLine ? killH / 2 - 5 : 14)) + '" width="10" height="10" style="fill:var(--neg)" />';
      if (oneLine) {
        html += '<text x="' + (pad + 36) + '" y="' + (killY + killH / 2 + 4) + '" style="font-size:12.5px;fill:var(--neg)">' +
          '<tspan style="font-family:var(--mono);font-weight:700;letter-spacing:.08em">KILL SWITCH ▸ </tspan>' + esc(KILL_TEXT) + '</text>';
      } else {
        html += '<text x="' + (pad + 34) + '" y="' + (killY + 22) + '" style="font-size:11px;font-weight:700;letter-spacing:.08em;fill:var(--neg);font-family:var(--mono)">KILL SWITCH ▸</text>';
        html += '<text x="' + (pad + 16) + '" y="' + (killY + 42) + '" style="font-size:11px;fill:var(--neg)">' + esc(KILL_TEXT) + '</text>';
      }
      html += '</g>';

      /* 底注 */
      html += '<text x="' + pad + '" y="' + (H - 10) + '" style="font-size:9.5px;fill:var(--ink-lo);font-family:var(--mono)">' +
        (narrow ? '自上而下判定树 · 点击节点查看依据 · K1–K4' : '自上而下判定树 · 点击任一节点查看依据 · 数值为美元口径三年路径（K1–K4）') + '</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* ---------- 交互 ---------- */
      function bindG(sel, tip, drillFn) {
        var el = svg.querySelector(sel);
        if (!el) return;
        el.addEventListener('mouseenter', function (e) { tipShow(tip, e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        el.addEventListener('click', drillFn);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drillFn(); }
        });
      }

      bindG('.vt-root',
        '<b>判定 · §9</b><br><span style="color:var(--ink-lo)">结论不是单选题——三种情景共用同一事实底座，分叉发生在 2027 年</span>',
        function () {
          drill({
            title: '判定 · §9 —— 结论不是单选题',
            body: '依据：三种情景（Base / Conservative / Contraction）共用同一事实底座——已披露订单、云厂 capex 指引与约束产能；分叉发生在 2027 年，由 kill switch 阈值裁决哪一条路径接管。本报告给出的是判定树而非点预测：同一组事实，按 SAME-CASE / DIFFERENT-CASE / POLICY PARTITION 三种读法落到不同叶子。',
            source: '研究综合 · §9 情景算术（K1–K4）', date: '2026-07'
          });
        });

      svg.querySelectorAll('.vt-br').forEach(function (el) {
        var br = BRANCH_DEF[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b style="color:' + br.color + '">' + esc(br.tag) + '</b> · ' + esc(br.title) + '<br><span style="color:var(--ink-lo)">' + esc(br.desc) + '</span>', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: br.tag + ' —— ' + br.title,
            body: br.basis,
            source: '研究综合 · 机制矩阵 / 电网分割（§7–§8）', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      var LEAF_BASIS = {
        base: '依据：云厂 capex 路径 1.52×（330→500）× ASIC 美元份额 1.67×（12→20%），乘积中点 ≈2.5×，对外表述区间 2.0–4.7×；情景乘法只使用美元口径；失效阈值见 K4（+14%）。',
        cons: '依据：capex 增速放缓但仍为正、单位增长减速、电力主导供给拉伸——三年美元口径 1.9–2.1×（≈2.0×）；供应约束延续、需求温和情形。',
        neg: '依据：订单取消扩散、重复下单回落、库存修正——−15% 对应电力与已签约需求缓冲起效，−35% 对应缓冲失效、重复下单全额出清（2001 年 −32% 为历史锚）。本叶为压力参照，非预测；kill switch 触发后进入本情景复核。'
      };
      svg.querySelectorAll('.vt-leaf').forEach(function (el) {
        var lf = model.leaves[+el.getAttribute('data-i')];
        el.addEventListener('mouseenter', function (e) {
          tipShow('<b style="color:' + lf.color + '">' + esc(lf.tag) + '</b> · ' + esc(lf.range) + '<br><span style="color:var(--ink-lo)">' + esc(lf.mid) + '（' + esc(lf.ref) + '）</span>', e);
        });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        function openDrill() {
          drill({
            title: lf.tag + ' ' + lf.range + '（' + lf.ref + '）',
            body: LEAF_BASIS[lf.cls],
            source: '研究综合 · §9 情景算术', date: '2026-07'
          });
        }
        el.addEventListener('click', openDrill);
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
        });
      });

      bindG('.vt-kill',
        '<b style="color:var(--neg)">KILL SWITCH</b><br>' + esc(KILL_TEXT),
        function () {
          drill({
            title: 'KILL SWITCH —— ' + model.killThreshold + '（K4）',
            body: '依据：+14% 大致等于已宣布产能对应的资本开支摊到 2027 年所需的最低同比增速，也接近 Top-4 经营现金流自然增速的底线；低于它意味着部分已宣布项目被砍或推迟、供给曲线左移。若 2027 Top-4 capex 增速低于 +14%，Base 失效、Conservative 接管；CONTRACTION 仅作压力参照。',
            source: '研究综合 · K4（Top-4 2027 capex 增速阈值）', date: '2026-07'
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
