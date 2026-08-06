/* deepdive.js — §11 · 公司深研：六家公司，位于供应链的收费关口（DOM 卡片网格）
 * 注册 key: 'invest'（SPEC §5 / §8：~480px；每家含关口位置、关键事实（带来源日期）、风险；
 * 明确「不提供评级与目标价」）
 */
(function () {
  'use strict';
  window.Charts = window.Charts || {};

  var FALLBACK = {
    disclaimer: '不提供评级与目标价 · 仅供信息参考，不构成投资建议',
    companies: [
      {
        name: 'Broadcom', cn: '博通', gate: '定制 ASIC 设计 + 网络',
        facts: [
          { t: 'AI 半导体收入连续多季高增长，为公司第一大增长引擎', src: '公司披露', date: '2025-12' },
          { t: '第四家大型定制 ASIC 客户订单落地，在手订单规模扩大', src: '公司披露', date: '2025-09' }
        ],
        risk: '客户集中度高；增长预期已大部分计入，指引下修即触发监测链',
        note: '收费关口位置最深的设计服务商：XPU + Tomahawk/Jericho 网络双线收费。'
      },
      {
        name: 'Marvell', cn: '美满电子', gate: '定制硅 + 数据中心互连',
        facts: [
          { t: '定制硅（custom silicon）业务扩张，数据中心收入占比过半', src: '公司披露', date: '2025-08' },
          { t: '光 DSP 与互连产品受益于 800G/1.6T 升级', src: '公司披露 / 研究综合', date: '2025' }
        ],
        risk: '大客户项目归属竞争激烈；定制项目青黄不接时收入波动大',
        note: '同时坐在「定制设计」与「光互连」两道关口上。'
      },
      {
        name: 'MediaTek', cn: '联发科', gate: 'ASIC 设计服务（消费电子基本盘之上）',
        facts: [
          { t: '参与云端 ASIC 定制项目的报道与确认增多', src: '公司披露 / 研究综合', date: '2025' },
          { t: '4Q26 法说的 AI 指引被列为八个证伪触发器之首', src: '研究综合', date: '2026' }
        ],
        risk: '手机主业周期波动；AI 项目兑现节奏与毛利率结构待验证',
        note: '从消费电子芯片厂转向云端 ASIC 供应商的关键一跃，市场等待 4Q26 的答案。'
      },
      {
        name: 'GUC', cn: '创意电子', gate: 'TSMC 系 ASIC 设计服务',
        facts: [
          { t: '依托 TSMC 先进制程与 CoWoS 的 turnkey 项目管线', src: '公司披露', date: '2025' },
          { t: '历史上收入呈锯齿形态，crypto 敞口曾放大波动', src: '公司披露 / 研究综合', date: '2018–2022' }
        ],
        risk: '项目制收入的锯齿波动；与母公司产能分配的绑定既是护城河也是上限',
        note: '「TSMC 系」身份让它天然坐在先进制程与先进封装两道关口的收费口。'
      },
      {
        name: 'Alchip', cn: '世芯电子', gate: '北美 AI ASIC 项目（先进节点）',
        facts: [
          { t: '收入呈典型锯齿形态：大单驱动，年际波动剧烈', src: '公司披露', date: '2019–2025' },
          { t: '3nm AI 项目进度被列为八个证伪触发器之一', src: '研究综合', date: '2026' }
        ],
        risk: '单一客户集中；出口管制影响其部分中国客户项目（2024 起）',
        note: '锯齿收入是项目制 ASIC 的教科书样本；3nm 进展是下一轮大单的入场券。'
      },
      {
        name: 'VeriSilicon', cn: '芯原股份', gate: '中国大陆半导体 IP + 一站式定制',
        facts: [
          { t: '半导体 IP 授权 + 芯片定制双业务模式，覆盖 AIoT/数据中心边缘', src: '公司披露', date: '2025' },
          { t: '本土 ASIC 需求上升带来定制项目增量', src: '公司披露 / 研究综合', date: '2025' }
        ],
        risk: '盈利波动较大；地缘政治与出口管制影响先进节点获取',
        note: '中国大陆口径下最接近「ASIC 卖铲者」定位的标的。'
      }
    ]
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tipShow(html, evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.show(html, evt.clientX, evt.clientY); }
  function tipMove(evt) { if (window.Utils && Utils.tooltip) Utils.tooltip.move(evt.clientX, evt.clientY); }
  function tipHide() { if (window.Utils && Utils.tooltip) Utils.tooltip.hide(); }
  function drill(d) { if (window.Utils && Utils.drill) Utils.drill.open(d); }

  /* 展示层注解（非数据）：公司中文名 */
  var CN = { Broadcom: '博通', Marvell: '美满电子', MediaTek: '联发科', GUC: '创意电子', Alchip: '世芯电子', VeriSilicon: '芯原股份' };

  /* CHART_DATA['invest'] = {companies:[{name,gate,facts:[…],risks:[…],disclaimer}],note} → 渲染模型 */
  function fromCD(cd) {
    if (!cd || !cd.companies || !cd.companies.length) return null;
    return {
      disclaimer: FALLBACK.disclaimer,
      note: cd.note || '',
      companies: cd.companies.map(function (c) {
        var facts = (c.facts || []).map(function (f) {
          return typeof f === 'string' ? { t: f, src: '', date: '' } : f;
        });
        var risks = c.risks || (c.risk ? [c.risk] : []);
        return {
          name: c.name, cn: c.cn || CN[c.name] || '', gate: c.gate || '',
          facts: facts,
          risk: risks.join('；'),
          note: c.note || (c.disclaimer ? '免责：' + c.disclaimer : ''),
          disclaimer: c.disclaimer || '无评级 · 无目标价'
        };
      })
    };
  }

  window.Charts['invest'] = function (frame) {
    var body = frame.querySelector('.chart-body');
    if (!body) return;
    var data = fromCD(window.CHART_DATA && window.CHART_DATA['invest']) || FALLBACK;

    body.innerHTML = '';

    /* DOM 类图表：region + aria-label */
    var wrap = document.createElement('div');
    wrap.setAttribute('role', 'region');
    wrap.setAttribute('aria-label', '六家公司深研卡：' + data.companies.map(function (c) { return c.name; }).join('、') +
      '；' + data.disclaimer);

    /* 免责声明条 */
    var disc = document.createElement('p');
    disc.style.cssText = 'margin:0 0 12px;padding:6px 12px;border:1px dashed var(--line);font-family:var(--mono);' +
      'font-size:10.5px;color:var(--ink-lo);background:var(--paper-hi);';
    disc.textContent = data.disclaimer;
    wrap.appendChild(disc);

    /* 卡片网格 */
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:12px;';

    data.companies.forEach(function (c, i) {
      var card = document.createElement('div');
      card.className = 'inv-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', c.name + '（' + c.cn + '），关口位置：' + c.gate);
      card.style.cssText = 'border:1px solid var(--line);background:#ffffff;padding:12px 14px 11px;cursor:pointer;outline:none;';

      /* 头部：公司名 + 关口 chip */
      var head = document.createElement('div');
      head.style.cssText = 'display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:8px;';
      head.innerHTML =
        '<span style="font-size:15px;font-weight:700;color:var(--ink)">' + esc(c.name) +
        ' <span style="font-size:11px;font-weight:400;color:var(--ink-lo)">' + esc(c.cn) + '</span></span>' +
        '<span style="font-size:9.5px;font-family:var(--mono);color:var(--blue);border:1px solid var(--blue);' +
        'border-radius:9px;padding:2px 8px;white-space:nowrap">关口 · ' + esc(c.gate) + '</span>';
      card.appendChild(head);

      /* 关键事实 */
      var ul = document.createElement('ul');
      ul.style.cssText = 'margin:0 0 8px;padding:0;list-style:none;';
      c.facts.forEach(function (f) {
        var li = document.createElement('li');
        li.style.cssText = 'font-size:12px;color:var(--ink-md);margin-bottom:5px;padding-left:12px;position:relative;line-height:1.5;';
        var srcTxt = (f.src || f.date) ? ' <span style="font-family:var(--mono);font-size:9.5px;color:var(--ink-lo)">（' +
          esc([f.src, f.date].filter(Boolean).join(' · ')) + '）</span>' : '';
        li.innerHTML = '<span style="position:absolute;left:0;top:0;color:var(--blue)">·</span>' + esc(f.t) + srcTxt;
        ul.appendChild(li);
      });
      card.appendChild(ul);

      /* 风险（--neg） */
      var risk = document.createElement('p');
      risk.style.cssText = 'margin:0;font-size:11.5px;color:var(--neg);border-left:2px solid var(--neg);padding-left:8px;line-height:1.5;';
      risk.textContent = '风险：' + c.risk;
      card.appendChild(risk);

      /* 交互 */
      card.addEventListener('mouseenter', function (e) {
        card.style.background = 'var(--paper-hi)';
        tipShow('<b>' + esc(c.name) + '</b> · ' + esc(c.gate) + '<br><span style="color:var(--ink-lo)">' + esc(c.note) + '</span>', e);
      });
      card.addEventListener('mousemove', tipMove);
      card.addEventListener('mouseleave', function () {
        card.style.background = '#ffffff';
        tipHide();
      });
      function openDrill() {
        drill({
          title: c.name + (c.cn ? '（' + c.cn + '）' : ''),
          body: '<p><b>关口位置：</b>' + esc(c.gate) + '</p>' +
            '<p><b>关键事实：</b></p><ul style="margin:0 0 10px;padding-left:18px">' +
            c.facts.map(function (f) {
              var s = (f.src || f.date) ? ' <span style="color:var(--ink-lo);font-size:12px">（' +
                esc([f.src, f.date].filter(Boolean).join(' · ')) + '）</span>' : '';
              return '<li style="margin-bottom:6px">' + esc(f.t) + s + '</li>';
            }).join('') + '</ul>' +
            '<p><b>风险：</b><span style="color:var(--neg)">' + esc(c.risk) + '</span></p>' +
            (c.note ? '<p>' + esc(c.note) + '</p>' : '') +
            '<p style="color:var(--ink-lo);font-size:12px">' + esc(data.disclaimer) + '</p>',
          source: '公司披露 / 研究综合',
          date: '2026-07'
        });
      }
      card.addEventListener('click', openDrill);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrill(); }
      });

      grid.appendChild(card);
    });

    wrap.appendChild(grid);
    body.appendChild(wrap);
  };
})();
