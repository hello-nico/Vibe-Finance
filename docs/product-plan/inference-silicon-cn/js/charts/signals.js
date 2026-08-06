/* signals.js — §10 · 监测：八个证伪触发器（DOM 表格，point-in-time register）
 * 注册 key: 'signals'（SPEC §5 / §8：渲染进 .chart-body，外套 .table-scroll 横向滚动；
 * 列：触发器 / 观察指标 / 失效阈值 / 下一窗口）
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var FALLBACK = {
    freq: '见下一窗口',
    triggers: [
      {
        name: 'MediaTek 4Q26', metric: '4Q26 法说 AI ASIC 收入指引与量产节奏',
        threshold: 'AI 收入指引下修，或定制项目量产推迟',
        detail: 'MediaTek 是 TPU 相关定制项目的观察窗口；4Q26 法说是交叉点检验的关键节点。',
        source: '公司披露（法说会）', date: '2026Q4 起'
      },
      {
        name: 'TSMC CoWoS 表述', metric: '法说会对 CoWoS 供需与扩产的措辞',
        threshold: '由「供不应求」转向「供需平衡 / 宽松」',
        detail: '措辞转向是约束缓解的领先信号；若转向发生在需求仍在加速时，则反而提示订单质量下降。',
        source: '公司披露（法说会）', date: '见下一窗口'
      },
      {
        name: 'Alchip 3nm', metric: '3nm AI 项目 tape-out 与量产进度',
        threshold: '3nm 项目延迟、缩减或取消',
        detail: 'Alchip 的先进节点项目是北美 ASIC 需求的前瞻指标；延迟通常领先收入下修一至两季。',
        source: '公司披露 / 研究综合', date: '见下一窗口'
      },
      {
        name: 'Broadcom AI 指引', metric: 'AI 半导体收入指引、在手订单与客户数',
        threshold: '指引下修，或大客户订单集中恶化',
        detail: 'Broadcom 是定制 ASIC 收入的晴雨表；第四家大型客户之后的增量客户数是核心观察点。',
        source: '公司披露（财报）', date: '见下一窗口'
      },
      {
        name: 'TPU 数量收敛', metric: '各路 2026/2027 TPU 出货估计的区间宽度',
        threshold: '估计持续发散不收敛（如 650–1,500 万长期不收窄）',
        detail: 'A2「无法判定」的解除条件：独立估计应随披露增加而收敛；不收敛即维持无法判定。',
        source: '券商研究 / 研究综合', date: '见下一窗口'
      },
      {
        name: 'capex / OCF', metric: 'Top-4 云厂 capex 与经营现金流覆盖',
        threshold: '2027 capex 增速 < +14%，或 OCF 覆盖显著恶化',
        detail: 'kill switch：+14% 为盈亏平衡阈值；低于该值 Base 情景失效。',
        source: '公司披露（财报）', date: '见下一窗口'
      },
      {
        name: '订单取消扩散', metric: 'ASIC / GPU 订单取消与推迟的披露和报道',
        threshold: '取消由个案扩散为普遍现象',
        detail: '单点取消不改周期；扩散才是 2001 年语法的开场。区分「正常排产调整」与「恐慌性撤单」。',
        source: '公司披露 / 行业与官方', date: '见下一窗口'
      },
      {
        name: '库存与预建行为', metric: '供应链库存天数、预建库存（pre-build）节奏',
        threshold: '库存异常攀升，同时预建行为放缓',
        detail: '库存升 + 预建停 = 重复下单回落的确认组合；单独一项不构成信号。',
        source: '公司披露 / 研究综合', date: '见下一窗口'
      }
    ],
    note: 'point-in-time register，非逐季更新产品。任一触发器失效，即按 scenario-chain 收缩链复核情景权重。'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  /* CHART_DATA['signals'] = {cols,rows:[{id,name,metric,threshold,freq,status}],asOf,note} → 渲染模型 */
  function fromCD(cd) {
    if (!cd || !cd.rows || !cd.rows.length) return null;
    return {
      freq: cd.freq || FALLBACK.freq,
      triggers: cd.rows.map(function (r) {
        return {
          id: r.id || '', name: r.name, metric: r.metric, threshold: r.threshold,
          freq: r.freq || cd.freq || FALLBACK.freq,
          status: r.status || '未触发',
          detail: r.detail || ('阈值未触发即维持当前情景；触发后按收缩链复核情景权重。'),
          source: r.source || '公司披露 / 研究综合', date: r.date || (cd.asOf || '2026-07-14')
        };
      }),
      note: cd.note || FALLBACK.note
    };
  }

  window.Charts['signals'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var data = fromCD(window.CHART_DATA && window.CHART_DATA['signals']) || FALLBACK;

    body.innerHTML = '';

    /* DOM 表格类图表：role=region + aria-label；外套 .table-scroll 支持横向滚动 */
    var wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '八个证伪触发器表：' + data.triggers.map(function (t) { return t.name; }).join('、') + '；下一窗口见表中列');
    wrap.style.overflowX = 'auto';
    wrap.style.webkitOverflowScrolling = 'touch';

    var table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;min-width:720px;width:100%;font-size:12.5px;';

    /* 表头 */
    var cols = ['#', '触发器', '观察指标', '失效阈值', '下一窗口', '状态'];
    var widths = ['28px', '132px', '', '', '96px', '64px'];
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    cols.forEach(function (c, i) {
      var th = document.createElement('th');
      th.textContent = c;
      th.style.cssText = 'text-align:left;font-family:var(--mono);font-size:10.5px;color:var(--ink-lo);font-weight:400;' +
        'padding:6px 8px;border-bottom:1px solid var(--line);' + (widths[i] ? 'width:' + widths[i] + ';' : '');
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');

    data.triggers.forEach(function (t, i) {
      var tr = document.createElement('tr');
      tr.setAttribute('tabindex', '0');
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', '触发器 ' + (i + 1) + '：' + t.name + '；失效阈值：' + t.threshold);
      tr.style.cssText = 'cursor:pointer;outline:none;border-bottom:1px solid var(--line-lo);';

      function td(html, extra) {
        var d = document.createElement('td');
        d.innerHTML = html;
        d.style.cssText = 'padding:9px 8px;vertical-align:top;' + (extra || '');
        return d;
      }

      tr.appendChild(td('<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink-lo)">' + (i + 1) + '</span>'));
      tr.appendChild(td('<b style="font-size:13px">' + esc(t.name) + '</b>', 'white-space:nowrap;'));
      tr.appendChild(td('<span style="color:var(--ink-md)">' + esc(t.metric) + '</span>'));
      tr.appendChild(td('<span style="color:var(--neg)">' + esc(t.threshold) + '</span>'));
      tr.appendChild(td('<span style="font-family:var(--mono);font-size:10.5px;color:var(--ink-lo)">' + esc(t.freq || data.freq) + '</span>', 'white-space:nowrap;'));
      tr.appendChild(td('<span style="font-family:var(--mono);font-size:10.5px;color:var(--green)">' + esc(t.status || '未触发') + '</span>', 'white-space:nowrap;'));

      tr.addEventListener('mouseenter', function (e) {
        tr.style.background = 'var(--paper-hi)';
        tipShow('<b>' + esc(t.name) + '</b><br><span style="color:var(--ink-lo)">' + esc(t.detail) + '</span>', e);
      });
      tr.addEventListener('mousemove', tipMove);
      tr.addEventListener('mouseleave', function () {
        tr.style.background = '';
        tipHide();
      });
      function openDrill() {
        drill({
          title: '触发器 ' + (i + 1) + ' · ' + t.name,
          body: '<p><b>观察指标：</b>' + esc(t.metric) + '</p>' +
            '<p><b>失效阈值：</b><span style="color:var(--neg)">' + esc(t.threshold) + '</span></p>' +
            '<p>' + esc(t.detail) + '</p>' +
            '<p><b>下一窗口：</b>' + esc(t.freq || data.freq) + ' · <b>当前状态：</b><span style="color:var(--green)">' + esc(t.status || '未触发') + '</span></p>',
          source: t.source, date: t.date
        });
      }
      tr.addEventListener('click', openDrill);
      tr.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);

    /* 底部注记 */
    var note = document.createElement('p');
    note.style.cssText = 'margin:12px 0 0;padding-left:12px;border-left:3px solid var(--neg);font-size:12px;color:var(--ink-md);';
    note.textContent = data.note;
    body.appendChild(note);
  };
})();
