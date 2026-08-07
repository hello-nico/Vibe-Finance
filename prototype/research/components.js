/**
 * 研究 Mode · 区块渲染 · prototype/research/components.js
 * 一函数一卡：最近更新、对象卡、健康评估、实时指标、当前报告、研究依据、关系、情景确认、删除档案对话框。
 */
(function (global) {
  var esc = function (s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var STATE_LABEL = { green: '绿 · 总体有利', yellow: '黄 · 指标分化', red: '红 · 明显恶化', gray: '灰 · 证据不足' };
  var STATE_SHORT = { green: '绿', yellow: '黄', red: '红', gray: '灰' };
  var UPD_TAG = {
    pending: ['pending', '待复核'],
    state: ['state', '状态变化'],
    report: ['report', '报告更新'],
    unchanged: ['unchanged', '查过了，没变'],
    stale: ['stale', '证据过时'],
    failed: ['failed', '失败'],
  };

  function objHref(obj, kind) {
    var base = window.RES_PATHS && window.RES_PATHS.rootBase ? window.RES_PATHS.rootBase : '';
    if (kind === 'industry') return base + 'research/object-industry.html?key=' + encodeURIComponent(obj.key);
    return base + 'research/object-stock.html?key=' + encodeURIComponent(obj.key);
  }

  /* ---------- 最近更新 ---------- */
  function renderUpdates(updates) {
    var rows = updates.map(function (u) {
      var tag = UPD_TAG[u.type] || ['report', '更新'];
      return (
        '<div class="upd-item" data-obj="' + esc(u.objKey) + '" data-kind="' + esc(u.kind) + '">' +
        '  <span class="upd-tag ' + tag[0] + '">' + tag[1] + '</span>' +
        '  <div class="upd-main">' +
        '    <span class="upd-obj">' + esc(u.obj) + '</span>' +
        '    <span class="upd-when">' + esc(u.when) + '</span>' +
        '    <div class="upd-text">' + esc(u.text) + '</div>' +
        '  </div>' +
        '</div>'
      );
    }).join('');
    return '<div class="upd-list">' + rows + '</div>';
  }

  /* ---------- 关注对象卡 ---------- */
  function cardBuilding(o) {
    return (
      '<div class="obj-card building" data-building="' + esc(o.name) + '">' +
      '  <div class="obj-top"><span class="obj-name">' + esc(o.name) + '</span>' +
      '  <span class="obj-code">' + esc(o.code) + '</span>' +
      '  <span class="obj-tag">关注</span></div>' +
      '  <div class="obj-init"><span class="pulse"></span>正在建立研究…</div>' +
      '  <div class="obj-note">卡片已出现，不必等待；建立完成后可直接进入。</div>' +
      '</div>'
    );
  }

  function cardFailed(o) {
    return (
      '<div class="obj-card failed-init" data-failed="' + esc(o.name) + '">' +
      '  <div class="obj-top"><span class="obj-name">' + esc(o.name) + '</span>' +
      '  <span class="obj-code">' + esc(o.code) + '</span>' +
      '  <span class="obj-tag">关注</span></div>' +
      '  <div class="obj-init"><span class="x-dot"></span>建立研究已暂停（三次重试未成功）</div>' +
      '  <button type="button" class="obj-resume">恢复建立研究</button>' +
      '</div>'
    );
  }

  function renderObjectCards(list, kind) {
    return '<div class="obj-grid">' + list.map(function (o) {
      if (o.init === 'building') return cardBuilding(o);
      if (o.init === 'failed') return cardFailed(o);
      var badges = '';
      if (o.pendingReview) badges += '<span class="obj-badge">待复核</span>';
      if (o.stale) badges += '<span class="obj-badge stale">证据过时</span>';
      var tagCls = o.tag === '跟踪' ? 'track' : o.tag === '持有' ? 'hold' : '';
      return (
        '<a class="obj-card" href="' + objHref(o, kind) + '" style="text-decoration:none;color:inherit">' +
        (o.unread ? '<span class="obj-unread" aria-label="未查看"></span>' : '') +
        '  <div class="obj-top"><span class="obj-name">' + esc(o.name) + '</span>' +
        (o.code ? '<span class="obj-code">' + esc(o.code) + '</span>' : '') +
        (o.tag ? '<span class="obj-tag ' + tagCls + '">' + esc(o.tag) + '</span>' : '') +
        '  </div>' +
        '  <div class="obj-state"><span class="hl-dot ' + o.state + '"></span>' +
        '    <span class="hl-label ' + o.state + '">' + (STATE_LABEL[o.state] || '') + '</span></div>' +
        (o.note ? '<div class="obj-note">' + esc(o.note) + '</div>' : '') +
        (badges ? '<div class="obj-badges">' + badges + '</div>' : '') +
        '  <div class="obj-updated">最近完成 ' + esc(o.updated) + '</div>' +
        '</a>'
      );
    }).join('') + '</div>';
  }

  /* ---------- 健康评估 ---------- */
  function renderHealth(h) {
    var reasons = (h.reasons || []).map(function (r) {
      return '<div class="ev-line"><span class="ev-lv ' + esc(r.level) + '">' + esc(r.level) + '</span><span>' + esc(r.text) + '</span></div>';
    }).join('');
    var gaps = (h.gaps || []).map(function (g) {
      return '<div class="gap-line">' + esc(g) + '</div>';
    }).join('');
    return (
      '<div class="res-card health-card">' +
      '  <div class="health-head">' +
      '    <span class="hl-dot ' + h.state + '"></span>' +
      '    <span class="health-title hl-label ' + h.state + '">' + (STATE_LABEL[h.state] || '') + '</span>' +
      '  </div>' +
      '  <div class="health-headline">' + esc(h.headline) + '</div>' +
      '  <div class="health-meta">最近完成：' + esc(h.completedAt) + ' · 不随盘中价格波动</div>' +
      (h.pendingReview ? '<div class="health-pending">' + esc(h.pendingReview) + '</div>' : '') +
      '  <button type="button" class="health-toggle" id="health-toggle">展开原因、证据与改变条件 ↓</button>' +
      '  <div class="health-detail" id="health-detail">' +
      '    <div class="health-block"><div class="health-block-h">主要原因与证据</div>' + reasons + '</div>' +
      (gaps ? '<div class="health-block"><div class="health-block-h">当前缺口</div>' + gaps + '</div>' : '') +
      (h.changeConditions ? '<div class="health-block"><div class="health-block-h">什么会改变判断</div><div class="ev-line"><span>' + esc(h.changeConditions) + '</span></div></div>' : '') +
      '  </div>' +
      '</div>'
    );
  }

  /* ---------- 实时指标 ---------- */
  function renderIndicators(ind) {
    var html = '';
    if (ind.price && ind.range) {
      html +=
        '<div class="res-card" style="margin-bottom:12px">' +
        '  <div class="price-band">' +
        '    <div><span class="price-now">' + esc(ind.price.value) + '</span> ' +
        '    <span class="price-chg up">' + esc(ind.price.change) + '</span>' +
        '    <div class="price-asof">现价 · ' + esc(ind.price.asof) + '</div></div>' +
        '    <div class="range-wrap">' +
        '      <div class="range-track"><div class="range-band"></div>' +
        '        <div class="range-price"><span>当前价格</span></div></div>' +
        '      <div class="range-labels"><span>区间下沿 ' + esc(ind.range.low) + '</span><span>价值区间</span><span>区间上沿 ' + esc(ind.range.high) + '</span></div>' +
        '      <div class="range-meta">估值位置：<strong>' + esc(ind.range.position) + '</strong> · 安全边际：' + esc(ind.range.margin) + ' · 区间完成于 ' + esc(ind.range.computedAt) + '</div>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    }
    (ind.groups || []).forEach(function (g) {
      var items = g.items.map(function (it) {
        var trend = it.trend || '';
        return (
          '<div class="ind-item">' +
          '  <div class="ind-name">' + esc(it.name) + '</div>' +
          '  <div class="ind-value">' + esc(it.value) +
          (it.delta ? '<span class="ind-delta ' + trend + '">' + esc(it.delta) + '</span>' : '') + '</div>' +
          '  <div class="ind-meta">' + esc(it.src || '') + ' · ' + esc(it.asof || '') + '</div>' +
          '</div>'
        );
      }).join('');
      html +=
        '<div class="ind-group">' +
        '  <div class="ind-group-h">' + esc(g.title) + '</div>' +
        '  <div class="ind-grid">' + items + '</div>' +
        '</div>';
    });
    return '<div class="res-card">' + html + '</div>';
  }

  /* ---------- 当前报告 ---------- */
  function renderReport(obj) {
    var r = obj.report;
    var html =
      '<div class="res-card">' +
      '  <div class="report-head"><div class="res-sec-t">当前报告</div>' +
      '  <div class="report-updated">' + esc(r.updated) + '</div></div>' +
      '  <div class="report-judge">' + esc(r.judgement) + '</div>';

    if (r.business) {
      var rows = r.business.map(function (b) {
        return (
          '<div class="biz-row">' +
          '  <div class="biz-name">' + esc(b.name) + ' <span>' + esc(b.desc) + '</span></div>' +
          '  <div class="bars">' +
          '    <div class="bar"><span class="tag">收入占比</span><div class="track"><div class="fill rev" style="width:' + b.rev + '%"></div></div><span class="val">' + b.rev + '%</span></div>' +
          '    <div class="bar"><span class="tag">利润占比</span><div class="track"><div class="fill profit" style="width:' + b.profit + '%"></div></div><span class="val">' + b.profit + '%</span></div>' +
          '  </div>' +
          '</div>'
        );
      }).join('');
      html +=
        '<div class="report-block"><div class="report-block-h">业务与利润拆分</div>' + rows +
        '<div class="bars-legend"><span><i style="background:var(--fg-4);opacity:.55"></i>收入占比</span><span><i style="background:var(--accent)"></i>归母利润占比</span></div></div>';
    }

    if (r.mechanism) {
      html += '<div class="report-block"><div class="report-block-h">行业机制</div><div class="val-method">' + esc(r.mechanism) + '</div></div>';
    }

    if (r.drivers) {
      var drv = r.drivers.map(function (d) {
        return (
          '<div class="drv-card">' +
          '  <div class="drv-t">' + esc(d.name) + '<span class="d ' + (d.trend || '') + '">' + esc(d.delta) + '</span></div>' +
          '  <p>' + esc(d.role) + '</p>' +
          '</div>'
        );
      }).join('');
      html += '<div class="report-block"><div class="report-block-h">利润驱动与先行指标</div><div class="drv-grid">' + drv + '</div></div>';
    }

    if (r.valuation) {
      var v = r.valuation;
      var facts = (v.facts || []).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
      html +=
        '<div class="report-block"><div class="report-block-h">估值与价值区间</div>' +
        '  <div class="val-method"><strong>' + esc(v.method) + '</strong>　' + esc(v.why) + '</div>' +
        '  <ul class="val-facts">' + facts + '</ul>' +
        '  <div class="val-range-line">' +
        '    <span>价值区间 <strong>' + esc(v.range) + '</strong></span>' +
        '    <span>估值位置 <strong>' + esc(v.position) + '</strong></span>' +
        '    <span>安全边际 <strong>' + esc(v.margin) + '</strong></span>' +
        '  </div>' +
        '  <div class="val-method" style="margin-top:8px">敏感性：' + esc(v.sensitivity) + '</div>' +
        '  <button type="button" class="obj-resume" id="btn-scenario">试一个情景：如果运价回落 20%</button>' +
        '</div>';
    }

    if (r.risks) {
      var risks = r.risks.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      html += '<div class="report-block"><div class="report-block-h">风险与证伪条件</div><ul class="risk-list">' + risks + '</ul></div>';
    }

    if (r.gaps) {
      var gaps = r.gaps.map(function (x) { return '<div class="gap-line">' + esc(x) + '</div>'; }).join('');
      html += '<div class="gap-box"><strong>知识缺口</strong>' + gaps + '</div>';
    }

    if (r.evidenceNote) {
      html += '<div class="report-evidence-note">' + esc(r.evidenceNote) + '</div>';
    }

    return html + '</div>';
  }

  /* ---------- 情景确认流 ---------- */
  function renderScenario(scn) {
    var inputs = scn.inputs.map(function (i) {
      return (
        '<div class="scn-row"><label>' + esc(i.label) + '</label>' +
        '<input type="text" value="' + esc(i.value) + '" data-key="' + esc(i.key) + '" />' +
        '<span class="unit">' + esc(i.unit) + '</span>' +
        '<span class="hint">' + esc(i.hint) + '</span></div>'
      );
    }).join('');
    return (
      '<div class="scn-card" id="scn-card" style="display:none">' +
      '  <div class="scn-h">' + esc(scn.title) + '</div>' +
      '  <div class="scn-sub">助手已把要填的数列好：默认值、口径和出处都在。你确认后才重算。</div>' +
      '  <div class="scn-inputs">' + inputs + '</div>' +
      '  <div class="scn-actions">' +
      '    <button type="button" class="scn-confirm" id="scn-confirm">确认并重算</button>' +
      '    <button type="button" class="scn-cancel" id="scn-cancel">取消</button>' +
      '    <span class="scn-note">不确认，不发生；本次情景不改动当前报告</span>' +
      '  </div>' +
      '  <div class="scn-result" id="scn-result">' +
      '    <div class="scn-line">利润：' + esc(scn.result.profit) + '</div>' +
      '    <div class="scn-line">价值区间：<strong>' + esc(scn.result.range) + '</strong></div>' +
      '    <div class="scn-line">估值位置：' + esc(scn.result.position) + '</div>' +
      '    <div class="scn-line">' + esc(scn.result.verdict) + '</div>' +
      '    <div class="scn-note" style="margin-top:8px">想把本情景当成长期假设，需要再次确认，系统会重新研究一遍。</div>' +
      '  </div>' +
      '</div>'
    );
  }

  /* ---------- 研究依据 ---------- */
  function renderEvidence(groups) {
    return '<div class="res-card">' + (groups || []).map(function (g) {
      var items = g.items.map(function (it) {
        return (
          '<div class="evd-item">' +
          '  <span class="evd-title">' + esc(it.title) + '</span>' +
          '  <span class="evd-note">' + esc(it.note) + '</span>' +
          (it.anchor ? '<span class="evd-anchor">' + esc(it.anchor) + '</span>' : '') +
          '</div>'
        );
      }).join('');
      return '<div class="evd-group"><div class="evd-group-h">' + esc(g.group) + '</div>' + items + '</div>';
    }).join('') + '</div>';
  }

  /* ---------- 关系 ---------- */
  function renderRelations(obj) {
    var cards = [];
    if (obj.industry) {
      var href = (window.RES_PATHS ? window.RES_PATHS.rootBase : '') + 'research/object-industry.html?key=' + encodeURIComponent(obj.industry.key);
      cards.push(
        '<a class="rel-card" href="' + href + '" style="text-decoration:none;color:inherit">' +
        '  <div class="rel-kind">所属行业</div>' +
        '  <div class="rel-name">' + esc(obj.industry.name) + ' <span class="hl-dot green"></span></div>' +
        '  <div class="rel-note">利润暴露以集运为主 · 双向链接 · 有据可查</div>' +
        '</a>'
      );
    }
    if (obj.relatedStocks) {
      obj.relatedStocks.forEach(function (s) {
        var inner =
          '  <div class="rel-kind">关联个股</div>' +
          '  <div class="rel-name">' + esc(s.name) + (s.state ? ' <span class="hl-dot ' + s.state + '"></span>' : '') + '</div>' +
          '  <div class="rel-note">' + esc(s.note) + (s.code && s.code !== '未加入' ? ' · ' + esc(s.code) : ' · 未加入研究') + '</div>';
        if (s.code && s.code !== '未加入') {
          cards.push('<a class="rel-card" href="object-stock.html?key=cosco" style="text-decoration:none;color:inherit">' + inner + '</a>');
        } else {
          cards.push('<div class="rel-card">' + inner + '</div>');
        }
      });
    }
    return '<div class="rel-row">' + cards.join('') + '</div>';
  }

  /* ---------- 删除研究档案对话框 ---------- */
  function deleteDialogHtml(objName) {
    return (
      '<div class="dlg-mask" id="dlg-mask">' +
      '  <div class="dlg">' +
      '    <h3>删除「' + esc(objName) + '」的研究档案？</h3>' +
      '    <div class="dlg-sub">这是低频的破坏性动作，请确认你了解将删除和将保留的内容。</div>' +
      '    <div class="dlg-cols">' +
      '      <div class="dlg-col del"><div class="dlg-col-h">将删除</div>' +
      '        <ul><li>健康评估与研究状态</li><li>当前报告</li><li>研究依据与关系</li><li>长期记忆</li><li>关注状态，停止持续更新</li></ul></div>' +
      '      <div class="dlg-col keep"><div class="dlg-col-h">将保留</div>' +
      '        <ul><li>你上传的原始资料（只解除与本对象的关联）</li><li>全局变更记录</li></ul></div>' +
      '    </div>' +
      '    <div class="dlg-note">你上传的原始资料不会删除。删除后如需找回，可从「数据 → 配置 → 变更记录」恢复。</div>' +
      '    <div class="dlg-actions">' +
      '      <button type="button" class="dlg-cancel" id="dlg-cancel">取消</button>' +
      '      <button type="button" class="dlg-confirm" id="dlg-confirm">确认删除</button>' +
      '    </div>' +
      '  </div>' +
      '</div>'
    );
  }

  global.ResComponents = {
    renderUpdates: renderUpdates,
    renderObjectCards: renderObjectCards,
    renderHealth: renderHealth,
    renderIndicators: renderIndicators,
    renderReport: renderReport,
    renderScenario: renderScenario,
    renderEvidence: renderEvidence,
    renderRelations: renderRelations,
    deleteDialogHtml: deleteDialogHtml,
    objHref: objHref,
  };
})(window);
