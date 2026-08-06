/* matrix.js — §9 · 结论：六窗口 × 五机制 历史矩阵（DOM 热力表）
 * 注册 key: 'matrix'（SPEC §5 / §8：~460px；当前周期 = 需求侧 1995–2003 × 供应侧 2019–2022 叠加；
 * 1997–98 与 2008–09 标为 rejected windows）
 * 数据：window.CHART_DATA['matrix']（cells：1=命中，0=未命中，null=未确认），缺失时用同构兜底
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  /* 兜底数据（与 CHART_DATA['matrix'] 同构） */
  var FALLBACK = {
    phases: ['需求点火', '供给约束', '重复下单', '产能到达', '出清'],
    rows: [
      { window: '1985–1995', cells: [1, 0, 0, 0, 0], note: '创立期：点火即战略' },
      { window: '1995–2003', cells: [1, 1, 1, 1, 1], note: '完整周期：行业 −32% / 双寡头 ≈−39%' },
      { window: '2004–2012', cells: [0, 0, 0, 0, 0], note: '安静的十年（出清后研发）' },
      { window: '2013–2018', cells: [1, 0, 0, 0, 0], note: '点火 + 生态锁定' },
      { window: '2019–2022', cells: [1, 1, 1, 1, 0], note: '短缺与并购超级周期' },
      { window: '2023–2026', cells: [1, 1, 1, null, null], note: '扩张已确认，峰值开放' }
    ],
    rejected: [
      { window: '1997–98', reason: '亚洲金融危机：需求冲击，非产能周期' },
      { window: '2008–09', reason: '金融危机：信用冲击，非产能周期' }
    ],
    note: 'cells：1=命中，0=未命中，null=未确认；当前周期 = 需求侧 1995–2003 × 供应侧 2019–2022 叠加'
  };

  /* 展示层注解（非数据）：窗口中文名与 rejected 归属 */
  var NAMES = {
    '1985–1995': 'FPGA 创立期', '1995–2003': '繁荣与崩塌', '2004–2012': '安静的十年',
    '2013–2018': '点火', '2019–2022': '短缺与并购超级周期', '2023–2026': '当前周期'
  };
  var REJECT_PARENT = { '1997–98': '1995–2003', '2008–09': '2004–2012' };
  var OVERLAY = '当前周期 ≈ 需求侧 1995–2003 × 供应侧 2019–2022 叠加';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  window.Charts['matrix'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var cd = window.CHART_DATA && window.CHART_DATA['matrix'];
    var data = (cd && cd.rows && cd.rows.length) ? cd : FALLBACK;
    var mechs = data.phases || FALLBACK.phases;

    body.innerHTML = '';

    /* DOM 表格类图表：region + aria-label；外套 .table-scroll 横向滚动 */
    var wrap = document.createElement('div');
    wrap.className = 'table-scroll';
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label',
      '六窗口乘五机制历史矩阵热力表；' + OVERLAY + '；1997–98 与 2008–09 为 rejected windows');
    wrap.style.overflowX = 'auto';
    wrap.style.webkitOverflowScrolling = 'touch';

    var table = document.createElement('table');
    table.style.cssText = 'border-collapse:collapse;min-width:660px;width:100%;font-size:12.5px;';

    /* 表头 */
    var thead = document.createElement('thead');
    var hr = document.createElement('tr');
    var corner = document.createElement('th');
    corner.textContent = '窗口 \\ 机制';
    corner.style.cssText = 'text-align:left;font-family:var(--mono);font-size:10.5px;color:var(--ink-lo);font-weight:400;padding:6px 10px;border-bottom:1px solid var(--line);';
    hr.appendChild(corner);
    mechs.forEach(function (m) {
      var th = document.createElement('th');
      th.textContent = m;
      th.style.cssText = 'font-family:var(--mono);font-size:10.5px;color:var(--ink-lo);font-weight:400;padding:6px 6px;border-bottom:1px solid var(--line);text-align:center;';
      hr.appendChild(th);
    });
    thead.appendChild(hr);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');

    function cellState(v) {
      if (v === null || v === undefined) return { label: '未确认', style: 'background:#ffffff;color:var(--ink-lo);border:1px dashed var(--line);' };
      if (v === 1) return { label: '命中', style: 'background:var(--blue);color:var(--paper);' };
      return { label: '—', style: 'background:var(--paper-hi);color:var(--ink-lo);' };
    }

    function cellTip(w, mi) {
      var st = cellState(w.cells[mi]);
      return '<b>' + esc(w.window) + ' · ' + esc(NAMES[w.window] || '') + '</b><br>' +
        esc(mechs[mi]) + '：<b>' + st.label + '</b>' +
        '<br><span style="color:var(--ink-lo)">' + esc(w.note || '') + '</span>';
    }

    function cellDrill(w, mi) {
      var st = cellState(w.cells[mi]);
      drill({
        title: w.window + ' · ' + (NAMES[w.window] || '') + ' × ' + mechs[mi],
        body: '<p>机制状态：<b>' + st.label + '</b>（1=命中，0=未命中，null=未确认）</p>' +
          '<p>' + esc(w.note || '') + '</p>' +
          '<p>' + esc(OVERLAY) + '。</p>',
        source: '研究综合', date: '2026-07'
      });
    }

    data.rows.forEach(function (w) {
      var isCurrent = w.window === '2023–2026';
      var tr = document.createElement('tr');
      if (isCurrent) tr.style.cssText = 'background:var(--paper-hi);';

      var th = document.createElement('th');
      th.scope = 'row';
      th.innerHTML = '<span style="font-family:var(--mono);font-size:11px;color:var(--ink-md)">' + esc(w.window) + '</span><br>' +
        '<span style="font-weight:700;font-size:12.5px">' + esc(NAMES[w.window] || w.window) + '</span>' +
        (isCurrent ? ' <span style="color:var(--blue);font-size:10.5px;font-family:var(--mono)">◀ 当前</span>' : '');
      th.style.cssText = 'text-align:left;padding:8px 10px;border-bottom:1px solid var(--line-lo);white-space:nowrap;' +
        (isCurrent ? 'border-left:3px solid var(--blue);' : 'border-left:3px solid transparent;');
      tr.appendChild(th);

      w.cells.forEach(function (v, mi) {
        var st = cellState(v);
        var td = document.createElement('td');
        td.textContent = st.label;
        td.setAttribute('tabindex', '0');
        td.setAttribute('role', 'button');
        td.setAttribute('aria-label', w.window + ' ' + (NAMES[w.window] || '') + '，' + mechs[mi] + '，' + st.label);
        td.style.cssText = 'text-align:center;padding:8px 6px;border-bottom:1px solid var(--line-lo);cursor:pointer;outline:none;' +
          'font-family:var(--mono);font-size:11px;min-width:64px;' + st.style;
        td.addEventListener('mouseenter', function (e) { tipShow(cellTip(w, mi), e); });
        td.addEventListener('mousemove', tipMove);
        td.addEventListener('mouseleave', tipHide);
        td.addEventListener('click', function () { cellDrill(w, mi); });
        td.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cellDrill(w, mi); }
        });
        tr.appendChild(td);
      });

      tbody.appendChild(tr);

      /* rejected windows：嵌在所属窗口之后 */
      (data.rejected || []).forEach(function (rj) {
        if ((REJECT_PARENT[rj.window] || rj.parent) !== w.window) return;
        var rr = document.createElement('tr');
        var rh = document.createElement('th');
        rh.scope = 'row';
        rh.innerHTML = '<span style="font-family:var(--mono);font-size:10.5px;color:var(--neg)">✗ ' + esc(rj.window) + '</span>' +
          ' <span style="font-size:10.5px;color:var(--neg)">rejected window</span>';
        rh.style.cssText = 'text-align:left;padding:4px 10px 4px 22px;border-bottom:1px solid var(--line-lo);font-weight:400;border-left:3px solid transparent;';
        rr.appendChild(rh);
        var rd = document.createElement('td');
        rd.colSpan = mechs.length;
        rd.textContent = rj.reason + ' —— 不作类比';
        rd.style.cssText = 'text-align:left;padding:4px 6px;border-bottom:1px solid var(--line-lo);font-size:11px;color:var(--neg);font-style:italic;';
        rr.appendChild(rd);
        tbody.appendChild(rr);
      });
    });

    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);

    /* 叠加结论注记 */
    var note = document.createElement('p');
    note.style.cssText = 'margin:12px 0 0;padding-left:12px;border-left:3px solid var(--blue);font-size:13px;font-weight:700;color:var(--ink);';
    note.textContent = OVERLAY;
    body.appendChild(note);

    var sub = document.createElement('p');
    sub.style.cssText = 'margin:6px 0 0;padding-left:12px;font-size:10.5px;color:var(--ink-lo);font-family:var(--mono);';
    sub.textContent = '1=命中 / 0=未命中 / 未确认 · 研究综合 · 2026-07 · 悬停查看说明，点击查看出处';
    body.appendChild(sub);
  };
})();
