/* gates.js — 9e · 四道供应关卡：HBM > 先进制程 > CoWoS > 光互连
 * 注册 key: 'gates'（SPEC §5 / §8）
 * 数据：window.CHART_DATA['gates']，缺失时使用内嵌兜底数据（与 SPEC §8 事实纪律一致）
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- 兜底数据（研究综合口径，未证实项标「未披露」） ---------- */
  var FALLBACK = {
    gates: [
      {
        rank: 1, name: 'HBM', tight: 5, tightLabel: '极度紧张',
        gap: 26,
        pool: '利润池：SK hynix · Samsung · Micron（三家寡占）',
        poolShort: 'SK hynix 三家寡占',
        note: 'HBM 占 DRAM 产能比重约 8%→41%（研究口径），是本轮最紧的一道关口',
        source: '研究综合', date: '2026-07'
      },
      {
        rank: 2, name: '先进制程', tight: 4, tightLabel: '高度紧张',
        gap: 44,
        pool: '利润池：TSMC（N5/N4/N3 节点几乎独占）',
        poolShort: 'TSMC 几乎独占',
        note: 'AI 加速器集中在 5nm/4nm/3nm 投片，先进节点排队与溢价并存',
        source: '研究综合', date: '2026-07'
      },
      {
        rank: 3, name: 'CoWoS', tight: 3, tightLabel: '中度紧张（缓解中）',
        gap: 64,
        pool: '利润池：TSMC 先进封装 · OSAT 配套',
        poolShort: 'TSMC 先进封装',
        note: '产能逐年翻倍扩充，缺口逐年收敛；具体产能路径未经公司完整披露',
        source: '研究综合', date: '2026-07'
      },
      {
        rank: 4, name: '光互连', tight: 2, tightLabel: '温和紧张',
        gap: 88,
        pool: '利润池：光模块与 DSP 厂商（多家竞争）',
        poolShort: '光模块厂商多家',
        note: '800G→1.6T 升级中，供应商多于前三道关口，议价权相对分散',
        source: '研究综合', date: '2026-07'
      }
    ],
    verdict: '利润池位于关口，而非云端 —— 越紧的关口，议价权越强'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  /* 展示层注解（非数据）：紧张度措辞与利润池位置 */
  var TIGHT_LABEL = { 5: '极度紧张', 4: '高度紧张', 3: '中度紧张（缓解中）', 2: '温和紧张' };
  var GAP_BY_TIGHT = { 5: 26, 4: 44, 3: 64, 2: 88 };
  var POOLS = {
    'HBM': ['利润池：SK hynix · Samsung · Micron（三家寡占）', 'SK hynix 三家寡占'],
    '先进制程': ['利润池：TSMC（N5/N4/N3 节点几乎独占）', 'TSMC 几乎独占'],
    'CoWoS': ['利润池：TSMC 先进封装 · OSAT 配套', 'TSMC 先进封装'],
    '光互连': ['利润池：光模块与 DSP 厂商（多家竞争）', '光模块厂商多家']
  };

  /* CHART_DATA['gates'] = {gates:[{rank,gate,tightness,note}],note} → 渲染模型 */
  function fromCD(cd) {
    if (!cd || !cd.gates || cd.gates.length !== 4) return null;
    return {
      gates: cd.gates.map(function (g) {
        var name = g.gate || g.name;
        var tight = g.tightness || g.tight || 3;
        var pool = g.pool || (POOLS[name] ? POOLS[name][0] : '');
        return {
          rank: g.rank, name: name, tight: tight,
          tightLabel: g.tightLabel || TIGHT_LABEL[tight] || '紧张',
          gap: g.gap || GAP_BY_TIGHT[tight] || 64,
          pool: pool,
          poolShort: g.poolShort || (POOLS[name] ? POOLS[name][1] : pool),
          note: g.note || '',
          source: g.source || '研究综合', date: g.date || '2026-07'
        };
      }),
      verdict: cd.verdict || FALLBACK.verdict
    };
  }

  window.Charts['gates'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var data = fromCD(window.CHART_DATA && window.CHART_DATA['gates']) ||
      { gates: FALLBACK.gates, verdict: FALLBACK.verdict };

    var H = 420;
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
        '四道供应关卡排序图：HBM 最紧，其次先进制程、CoWoS、光互连；' + data.verdict);
      svg.style.display = 'block';
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.fontFamily = 'var(--serif)';

      var narrow = W < 560;
      var padL = narrow ? 20 : 100, padR = 26;
      var innerW = W - padL - padR;
      var n = data.gates.length;
      var midY = 168;              // 通道中线
      var wallTop = 96, wallBot = 240; // 墙体纵向范围
      var colW = innerW / n;

      var html = '';

      /* 需求流入箭头（左端） */
      if (narrow) {
        html += '<text x="' + padL + '" y="24" style="font-size:11px;fill:var(--ink-lo);font-family:var(--mono)">AI 加速器需求 →</text>';
      } else {
        html += '<text x="24" y="' + (midY - 8) + '" style="font-size:11px;fill:var(--ink-lo);font-family:var(--mono)">AI 加速器</text>';
        html += '<text x="24" y="' + (midY + 8) + '" style="font-size:11px;fill:var(--ink-lo);font-family:var(--mono)">需求 →</text>';
      }
      html += '<line x1="' + padL + '" y1="' + midY + '" x2="' + (W - padR + 6) + '" y2="' + midY +
        '" style="stroke:var(--blue-lo);stroke-width:14;opacity:.28" />';
      html += '<line x1="' + padL + '" y1="' + midY + '" x2="' + (W - padR + 6) + '" y2="' + midY +
        '" style="stroke:var(--blue);stroke-width:1.4;stroke-dasharray:5 4" />';
      /* 右端流出箭头 */
      html += '<path d="M ' + (W - padR + 2) + ' ' + (midY - 6) + ' L ' + (W - padR + 14) + ' ' + midY +
        ' L ' + (W - padR + 2) + ' ' + (midY + 6) + ' Z" style="fill:var(--blue)" />';
      html += '<text x="' + (W - padR + 4) + '" y="' + (midY + 26) + '" text-anchor="end" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">交付</text>';

      data.gates.forEach(function (g, i) {
        var cx = padL + colW * (i + 0.5);       // 关卡中心
        var gw = 34;                            // 墙体厚度
        var gap = g.gap;                        // 开口高度（越小越紧）
        var gapTop = midY - gap / 2, gapBot = midY + gap / 2;

        html += '<g class="gate" data-i="' + i + '" tabindex="0" role="button" aria-label="关卡 ' +
          g.rank + '：' + esc(g.name) + '，' + esc(g.tightLabel) + '" style="cursor:pointer;outline:none">';

        /* 上墙 */
        html += '<rect x="' + (cx - gw / 2) + '" y="' + wallTop + '" width="' + gw + '" height="' + (gapTop - wallTop) +
          '" rx="2" style="fill:var(--paper-hi);stroke:var(--ink);stroke-width:1.4" />';
        /* 下墙 */
        html += '<rect x="' + (cx - gw / 2) + '" y="' + gapBot + '" width="' + gw + '" height="' + (wallBot - gapBot) +
          '" rx="2" style="fill:var(--paper-hi);stroke:var(--ink);stroke-width:1.4" />';
        /* 开口提示线 */
        html += '<line x1="' + (cx - gw / 2 - 7) + '" y1="' + gapTop + '" x2="' + (cx + gw / 2 + 7) + '" y2="' + gapTop +
          '" style="stroke:var(--ink-lo);stroke-width:1;stroke-dasharray:2 3" />';
        html += '<line x1="' + (cx - gw / 2 - 7) + '" y1="' + gapBot + '" x2="' + (cx + gw / 2 + 7) + '" y2="' + gapBot +
          '" style="stroke:var(--ink-lo);stroke-width:1;stroke-dasharray:2 3" />';

        /* 排序徽章 */
        html += '<circle cx="' + cx + '" cy="' + (wallTop - 26) + '" r="11" style="fill:var(--blue)" />';
        html += '<text x="' + cx + '" y="' + (wallTop - 22) + '" text-anchor="middle" style="font-size:11px;fill:#ffffff;font-family:var(--mono)">' + g.rank + '</text>';

        /* 名称 */
        html += '<text x="' + cx + '" y="' + (wallTop - 44) + '" text-anchor="middle" style="font-size:' + (narrow ? 12 : 16) + 'px;font-weight:700;fill:var(--ink)">' + esc(g.name) + '</text>';

        /* 紧张度点阵（5 点） */
        var dots = '';
        for (var d = 0; d < 5; d++) {
          dots += '<circle cx="' + (cx - 24 + d * 12) + '" cy="' + (wallBot + 22) + '" r="3.4" style="fill:' +
            (d < g.tight ? 'var(--blue)' : 'var(--line)') + '" />';
        }
        html += dots;
        html += '<text x="' + cx + '" y="' + (wallBot + 42) + '" text-anchor="middle" style="font-size:' + (narrow ? 9.5 : 11) + 'px;fill:var(--ink-md)">' +
          (narrow ? esc(g.tightLabel) : '紧张度 · ' + esc(g.tightLabel)) + '</text>';

        /* 利润池（短标签两行内，避免跨列重叠；CJK 计 1、其余计 0.56 加权换行） */
        var ps = String(g.poolShort || g.pool);
        var maxU = Math.max(4, colW / 10.5);
        function wlen(s) {
          var u = 0;
          for (var q = 0; q < s.length; q++) u += /[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(s.charAt(q)) ? 1 : 0.56;
          return u;
        }
        var psLines = [];
        if (wlen(ps) <= maxU) {
          psLines = [ps];
        } else {
          var acc = '', u2 = 0, idx = 0;
          while (idx < ps.length) {
            var cw = /[\u2e80-\u9fff\uff00-\uffef\u3000-\u303f]/.test(ps.charAt(idx)) ? 1 : 0.56;
            if (u2 + cw > maxU) break;
            u2 += cw; acc += ps.charAt(idx); idx++;
          }
          var rest = ps.slice(idx);
          psLines = [acc, wlen(rest) > maxU ? rest.slice(0, Math.max(1, Math.floor(maxU)) - 1) + '…' : rest];
        }
        if (!narrow) {
          html += '<text x="' + cx + '" y="' + (wallBot + 60) + '" text-anchor="middle" style="font-size:9.5px;fill:var(--ink-lo);font-family:var(--mono)">利润池</text>';
          psLines.forEach(function (ln, li) {
            html += '<text x="' + cx + '" y="' + (wallBot + 74 + li * 12) + '" text-anchor="middle" style="font-size:10px;fill:var(--copper)">' + esc(ln) + '</text>';
          });
        }

        html += '</g>';
      });

      /* 结论注记 */
      var ny = 342;
      html += '<rect x="' + padL + '" y="' + ny + '" width="3" height="34" style="fill:var(--blue)" />';
      html += '<text x="' + (padL + 12) + '" y="' + (ny + 15) + '" style="font-size:13.5px;font-weight:700;fill:var(--ink)">利润池位于关口，而非云端</text>';
      html += '<text x="' + (padL + 12) + '" y="' + (ny + 31) + '" style="font-size:11px;fill:var(--ink-lo)">排序口径：2026 年供给紧张度 × 议价权（研究综合）；越靠左的关口越紧</text>';

      /* 图例 */
      html += '<text x="' + padL + '" y="' + (H - 14) + '" style="font-size:10px;fill:var(--ink-lo);font-family:var(--mono)">墙体开口越窄 = 通过能力越受限 · 悬停查看说明 · 点击查看来源</text>';

      svg.innerHTML = html;
      body.appendChild(svg);

      /* 交互 */
      svg.querySelectorAll('.gate').forEach(function (el) {
        var g = data.gates[+el.getAttribute('data-i')];
        var htmlTip = '<b>关卡 ' + g.rank + ' · ' + esc(g.name) + '</b><br>' +
          '紧张度：' + esc(g.tightLabel) + '（' + g.tight + '/5）<br>' +
          esc(g.pool) + '<br><span style="color:var(--ink-lo)">' + esc(g.note) + '</span>';
        el.addEventListener('mouseenter', function (e) { tipShow(htmlTip, e); });
        el.addEventListener('mousemove', tipMove);
        el.addEventListener('mouseleave', tipHide);
        el.addEventListener('click', function () {
          drill({
            title: '关卡 ' + g.rank + ' · ' + g.name,
            body: '<p><b>紧张度：</b>' + esc(g.tightLabel) + '（' + g.tight + '/5）</p>' +
              '<p><b>' + esc(g.pool) + '</b></p>' +
              '<p>' + esc(g.note) + '</p>' +
              '<p>四道关口的整体排序为 HBM &gt; 先进制程 &gt; CoWoS &gt; 光互连；利润池位于关口，而非云端。</p>',
            source: g.source, date: g.date
          });
        });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.dispatchEvent(new Event('click')); }
        });
      });
    }

    render();
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () {
        var w = Math.floor(body.clientWidth || 0);
        if (Math.abs(w - lastW) > 1) render();   // 只重绘，不改预留高度
      });
      ro.observe(body);
    }
  };
})();
