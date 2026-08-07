/**
 * 数据 Mode · 区块渲染 · prototype/data/components.js
 * 通道卡、摄取节奏、研究资料、Skills、时效、变更记录与各类确认对话框。
 */
(function (global) {
  var esc = function (s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  var CH_STATUS = { on: ['on', '可用'], off: ['off', '未配置'], degraded: ['degraded', '部分失败'] };
  var MAT_STATUS = { '已解析': 'ok', '解析失败': 'fail', '待选择对象': 'pending' };

  /* ---------- 数据通道 ---------- */
  function renderChannels(channels) {
    return '<div class="ch-grid">' + channels.map(function (c) {
      var st = CH_STATUS[c.status] || ['off', ''];
      return (
        '<div class="ch-card">' +
        '  <div class="ch-top"><span class="ch-name">' + esc(c.name) + '</span>' +
        '  <span class="ch-status ' + st[0] + '">' + st[1] + '</span></div>' +
        '  <div class="ch-desc">' + esc(c.desc) + '</div>' +
        '  <div class="ch-meta">' +
        (c.lastOk ? '<span>最近成功 <b>' + esc(c.lastOk) + '</b></span>' : '') +
        (c.rhythm ? '<span>节奏 <b>' + esc(c.rhythm) + '</b></span>' : '') +
        '  </div>' +
        (c.note ? '<div class="ch-note">' + esc(c.note) + '</div>' : '') +
        '  <div class="ch-actions">' +
        (c.status === 'off'
          ? '<button type="button" class="ch-btn primary" data-ch-config="' + esc(c.name) + '">配置</button>'
          : '<button type="button" class="ch-btn" data-ch-config="' + esc(c.name) + '">配置</button>' +
            (c.status === 'degraded' ? '<button type="button" class="ch-btn primary" data-ch-retry="' + esc(c.name) + '">重试失败来源</button>' : '')) +
        '  </div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /* ---------- 摄取节奏 ---------- */
  function renderRhythm(dw) {
    return (
      '<div class="rhythm-grid">' +
      '  <div class="rhythm-card"><div class="rhythm-k">按需</div><p>行情、日 K、估值和实时行业指标：页面打开或分析需要时读取，不持久化。</p></div>' +
      '  <div class="rhythm-card"><div class="rhythm-k">每日</div><p>关注对象的公告、新闻和研报：增量获取，已获取的不重复登记。</p></div>' +
      '  <div class="rhythm-card"><div class="rhythm-k">披露窗口加密</div><p>' + esc(dw.text) + '</p></div>' +
      '</div>' +
      '<div class="missing-note"><strong>' + esc(dw.missing.obj) + ' · 缺 ' + esc(dw.missing.period) + '：</strong>' + esc(dw.missing.note) + '</div>'
    );
  }

  /* ---------- 研究资料 ---------- */
  function renderMaterials(list) {
    return '<div class="mat-list">' + list.map(function (m) {
      var stCls = MAT_STATUS[m.status] || 'ok';
      return (
        '<div class="mat-item" data-key="' + esc(m.key) + '">' +
        '  <div class="mat-top"><span class="mat-title">' + esc(m.title) + '</span>' +
        '  <span class="mat-type">' + esc(m.type) + '</span>' +
        '  <span class="mat-status ' + stCls + '">' + esc(m.status) + '</span></div>' +
        '  <div class="mat-meta">' +
        '    <span>来源 ' + esc(m.source) + '</span>' +
        '    <span>上传 ' + esc(m.uploaded) + '</span>' +
        '    <span>发布 ' + esc(m.published) + '</span>' +
        '    <span>关联 ' + esc(m.objects.join('、')) + '</span>' +
        '  </div>' +
        '  <div class="mat-evidence">' + esc(m.evidence) + '</div>' +
        '  <div class="mat-row-actions">' +
        '    <button type="button" class="mat-act" data-act="view">查看</button>' +
        (m.status === '解析失败' ? '<button type="button" class="mat-act primary" data-act="retry">重试解析</button>' : '') +
        (m.status === '待选择对象' ? '<button type="button" class="mat-act primary" data-act="pick">选择关联对象</button>' : '') +
        '    <button type="button" class="mat-act" data-act="edit">编辑</button>' +
        '    <button type="button" class="mat-act danger" data-act="delete">删除</button>' +
        '  </div>' +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /* ---------- Skills ---------- */
  function renderSkills(skills) {
    return skills.map(function (s, i) {
      return (
        '<div class="skill-row">' +
        '  <div><div class="skill-name">' + esc(s.name) + '</div>' +
        '  <div class="skill-scope">' + esc(s.scope) + '</div>' +
        '  <div class="skill-desc">' + esc(s.desc) + '</div></div>' +
        '  <button type="button" class="skill-toggle' + (s.on ? ' on' : '') + '" data-skill="' + i + '" aria-label="启停"></button>' +
        '</div>'
      );
    }).join('');
  }

  /* ---------- 时效规则 ---------- */
  function renderFreshness(rows) {
    return rows.map(function (r) {
      return '<div class="fresh-row"><span>' + esc(r.name) + '</span><span>' + esc(r.window) + '</span></div>';
    }).join('');
  }

  /* ---------- 变更记录 ---------- */
  function renderChanges(list) {
    return '<div class="change-list">' + list.map(function (c) {
      return (
        '<div class="change-item">' +
        '  <span class="change-when">' + esc(c.when) + '</span>' +
        '  <div class="change-main">' +
        '    <span class="change-action">' + esc(c.action) + ' · ' + esc(c.obj) + '</span>' +
        '    <div class="change-scope">' + esc(c.scope) + '</div>' +
        '  </div>' +
        (c.restore ? '<button type="button" class="change-restore" data-restore="' + esc(c.action) + ' · ' + esc(c.obj) + '">恢复</button>' : '') +
        '</div>'
      );
    }).join('') + '</div>';
  }

  /* ---------- 对话框 ---------- */
  function dialogMask(inner) {
    return '<div class="dlg-mask" id="dlg-mask"><div class="dlg">' + inner + '</div></div>';
  }

  function impactDialog(impact) {
    return dialogMask(
      '<h3>' + esc(impact.action) + '「' + esc(impact.title) + '」？</h3>' +
      '<div class="dlg-sub">执行前先看清影响范围，确认后一次完成；取消则不产生任何修改。</div>' +
      '<ul class="dlg-list">' + impact.affected.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>' +
      '<div class="dlg-note">' + impact.keep.map(esc).join('；') + '。</div>' +
      '<div class="dlg-actions">' +
      '  <button type="button" class="dlg-cancel" id="dlg-cancel">取消</button>' +
      '  <button type="button" class="dlg-confirm" id="dlg-confirm">确认' + esc(impact.action) + '</button>' +
      '</div>'
    );
  }

  function ambiguityDialog(amb) {
    return dialogMask(
      '<h3>「' + esc(amb.title) + '」关联到哪个对象？</h3>' +
      '<div class="dlg-sub">系统识别到多个候选对象，请你选择；选择后才进入解析。</div>' +
      '<div class="dlg-cands">' + amb.candidates.map(function (c) {
        return '<button type="button" class="dlg-cand" data-cand="' + esc(c) + '">' + esc(c) + '</button>';
      }).join('') + '</div>' +
      '<div class="dlg-actions"><button type="button" class="dlg-cancel" id="dlg-cancel">取消</button></div>'
    );
  }

  function restoreDialog(what) {
    return dialogMask(
      '<h3>恢复「' + esc(what) + '」？</h3>' +
      '<div class="dlg-sub">恢复前再次确认将带回的内容：研究内容、关系与关注状态都会恢复；恢复本身会形成一条新的变更记录。</div>' +
      '<div class="dlg-note">恢复后对象重新出现在关注列表，沿用删除前已经成功形成的知识。</div>' +
      '<div class="dlg-actions">' +
      '  <button type="button" class="dlg-cancel" id="dlg-cancel">取消</button>' +
      '  <button type="button" class="dlg-confirm safe" id="dlg-confirm">确认恢复</button>' +
      '</div>'
    );
  }

  global.DataComponents = {
    renderChannels: renderChannels,
    renderRhythm: renderRhythm,
    renderMaterials: renderMaterials,
    renderSkills: renderSkills,
    renderFreshness: renderFreshness,
    renderChanges: renderChanges,
    impactDialog: impactDialog,
    ambiguityDialog: ambiguityDialog,
    restoreDialog: restoreDialog,
  };
})(window);
