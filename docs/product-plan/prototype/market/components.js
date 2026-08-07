/**
 * 行情区块渲染 · 一函数一卡
 * 资讯雷达对齐 Vibe-Research Intel.tsx：Tab + 固定布局 + 动态数据 + AI 入口（复用助手）
 */
(function (global) {
  var esc = function (s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  var ICO = {
    filings:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    news:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h12v16H4z"/><path d="M16 8h4v12a2 2 0 0 1-2 2h-2"/><path d="M7 8h6M7 12h6M7 16h4"/></svg>',
    rss:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></svg>',
    spark:
      '<svg class="ov-cta-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/></svg>',
    refresh:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
    star:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.5 6.5L21 11l-5 4.2L17.5 21 12 17.5 6.5 21 8 15.2 3 11l6.5-1.5L12 3z"/></svg>',
  };

  function renderWatchlistFeed(kind, data) {
    var isFilings = kind === 'filings';
    var title = isFilings ? 'A股公告' : '公开新闻';
    var ico = isFilings ? ICO.filings : ICO.news;
    var items = isFilings ? data.filings || [] : data.publicNews || [];
    var watchN = (data.watchlist || []).length;
    var rows = items.length
      ? items
          .map(function (r) {
            return (
              '<div class="intel-row">' +
              '<span class="dt">' +
              esc(r.when) +
              '</span>' +
              '<span class="nm">' +
              esc(r.name) +
              '</span>' +
              (isFilings && r.type ? '<span class="meta">' + esc(r.type) + '</span>' : '') +
              '<span class="title">' +
              esc(r.title) +
              '</span>' +
              '</div>'
            );
          })
          .join('')
      : '<div class="intel-placeholder">关注列表为空。可从总览加入标的后查看聚合公告 / 新闻。</div>';

    return (
      '<div class="ov-glass ds-card intel-panel">' +
      '<div class="intel-panel-head">' +
      '<div class="intel-panel-title">' +
      ico +
      ' ' +
      title +
      '</div>' +
      '<div class="intel-panel-acts">' +
      '<button type="button" class="ds-refresh" title="刷新" aria-label="刷新" data-ai="refresh">' +
      ICO.refresh +
      '</button>' +
      '</div></div>' +
      '<div class="intel-panel-meta">' +
      ICO.star +
      ' 关注 ' +
      watchN +
      ' 只 · 共 ' +
      items.length +
      ' 条' +
      (isFilings ? '公告' : '新闻') +
      '（近期）</div>' +
      '<div class="intel-feed">' +
      rows +
      '</div>' +
      '<p class="intel-foot">公开信息聚合，不构成投资建议。今日要点由助手基于客观数据提炼。</p>' +
      '</div>'
    );
  }

  function renderInvestmentPanel(data, trackId) {
    var tracks = data.tracks || [];
    var meta = data.radarMeta || {};
    var active = trackId || (tracks[0] && tracks[0].id) || 'llm';
    var cur = tracks.find(function (t) { return t.id === active; }) || tracks[0];
    var lines = (data.newsDemo && data.newsDemo[active]) || (data.newsDemo && data.newsDemo.llm) || [];

    var chips = tracks
      .map(function (t) {
        return (
          '<button type="button" class="news-chip' +
          (t.id === active ? ' on' : '') +
          '" data-track="' +
          t.id +
          '" role="listitem">' +
          '<i class="dot" style="background:' +
          esc(t.accent || '') +
          '" aria-hidden="true"></i>' +
          esc(t.name) +
          '<span class="n">' +
          esc(t.n) +
          '</span></button>'
        );
      })
      .join('');

    var feed = lines
      .map(function (r) {
        return (
          '<div class="feed-item news-feed-item">' +
          '<span class="feed-time">' +
          esc(r[0]) +
          '</span>' +
          '<span class="feed-tag">' +
          esc(r[1]) +
          '</span>' +
          '<div class="feed-text">' +
          esc(r[2]) +
          '</div></div>'
        );
      })
      .join('');

    return (
      '<div class="ov-glass ds-card intel-panel">' +
      '<div class="intel-panel-head">' +
      '<div class="intel-panel-title">' +
      ICO.rss +
      ' Investment News <span class="intel-badge">investment-news</span></div>' +
      '<div class="intel-panel-acts">' +
      '<button type="button" class="ov-cta" data-ai="digest-all">' +
      ICO.spark +
      ' 一键提炼全部要点</button>' +
      '<button type="button" class="ds-refresh" title="刷新" aria-label="刷新" data-ai="refresh">' +
      ICO.refresh +
      '</button>' +
      '</div></div>' +
      '<div class="intel-panel-meta">' +
      esc(meta.total_sources || 108) +
      ' 个公开源 · 近 ' +
      esc(meta.recent_days || 7) +
      ' 天 · 更新于 ' +
      esc(meta.generated_at || '—') +
      '</div>' +
      '<div class="news-chip-row" id="chip-row" role="list">' +
      chips +
      '</div>' +
      '<div class="news-ai-card">' +
      '<div class="news-ai-title">' +
      ICO.spark.replace('ov-cta-ico', 'ds-ico') +
      '<span id="ai-title">今日要点 · ' +
      esc(cur ? cur.name : '') +
      '</span></div>' +
      '<button type="button" class="ov-cta" data-ai="digest-track">' +
      ICO.spark +
      ' 让 AI 提炼今日要点</button>' +
      '</div>' +
      '<div class="feed-list news-feed" id="feed">' +
      feed +
      '</div>' +
      '<p class="intel-foot">公开 RSS 聚合，不构成投资建议。要点由助手基于当前赛道客观标题提炼。</p>' +
      '</div>'
    );
  }

  function renderIntelBody(tab, data, trackId) {
    if (tab === 'filings') return renderWatchlistFeed('filings', data);
    if (tab === 'news') return renderWatchlistFeed('news', data);
    return renderInvestmentPanel(data, trackId);
  }

  function sectorNodeCount(s) {
    return Array.isArray(s.nodes) ? s.nodes.length : Number(s.nodes) || 0;
  }

  function renderSectorGrid(sectors, mktBase) {
    mktBase = mktBase || '';
    return sectors
      .map(function (s) {
        var count = sectorNodeCount(s);
        return (
          '<a class="sector-card glass' +
          (s.hot ? ' glass-glow' : '') +
          '" data-sector-key="' + esc(s.key) + '" href="' +
          mktBase +
          'sector-detail.html?key=' +
          encodeURIComponent(s.key) +
          '">' +
          '<div><div class="sector-card-head"><h3>' +
          esc(s.label) +
          '</h3>' +
          (s.hot
            ? '<span class="sector-hot"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.3-3.7.5-4.5.5.83.5 2 0 3-.5 1-1 2-1 3a2.5 2.5 0 0 0 2.5 2.5c1 0 1.5-.5 2-1.5.5 1 .5 2.5-.5 3.5-1.2 1.2-3 1-4.5 0z"/></svg>热门</span>'
            : '') +
          '</div><p class="sector-tagline">' +
          esc(s.tagline) +
          '</p></div>' +
          '<div class="sector-card-foot"><span>' +
          (s.verified ? count + ' 个环节' : '环节梳理中') +
          '</span>' +
          '<svg class="sector-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg></div></a>'
        );
      })
      .join('');
  }

  /** 板块详情（对齐 Research SectorDetail：返回 · 标题 · AI CTA · 核心环节 · 免责） */
  function renderSectorDetail(sector, mktBase) {
    mktBase = mktBase || '';
    var back =
      '<a class="sector-back" href="' +
      mktBase +
      'sectors.html">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>板块中心</a>';

    if (!sector) {
      return (
        back +
        '<div class="sector-detail-miss">未找到该板块。<a href="' +
        mktBase +
        'sectors.html">返回板块中心</a></div>'
      );
    }

    var nodes = Array.isArray(sector.nodes) ? sector.nodes : [];
    var head =
      '<div class="ov-head">' +
      '<div><h1>' +
      esc(sector.label) +
      '</h1><p class="sub">' +
      esc(sector.tagline) +
      '</p></div>' +
      '<div class="ov-head-actions">' +
      '<button type="button" class="ov-cta" id="ai-sector">' +
      ICO.spark +
      '让 AI 拆这个板块</button></div></div>';

    var body;
    if (sector.verified && nodes.length) {
      body =
        '<section class="sector-nodes-block" aria-label="核心环节">' +
        '<h3 class="sector-nodes-title">核心环节（' +
        nodes.length +
        '）</h3>' +
        '<div class="sector-nodes">' +
        nodes
          .map(function (n) {
            return '<span class="sector-node">' + esc(n) + '</span>';
          })
          .join('') +
        '</div>' +
        '<p class="sector-nodes-hint">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>' +
        '想在某个环节挂上自己关注的标的？数据存在你本地，不会上传、不进仓库。' +
        '</p></section>';
    } else {
      body =
        '<div class="sector-pending glass">' +
        '<svg class="sector-pending-ico" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' +
        '<p>该板块的环节骨架尚在<strong>实时核实</strong>补全中（不靠模型记忆）——已核实的板块见左侧。</p>' +
        '<p class="sector-pending-sub">也可以点右上角「让 AI 拆这个板块」，用你自己的 AI 按七维框架当场梳理它的产业链。</p>' +
        '</div>';
    }

    var disclaimer =
      '<div class="vf-disclaimer" role="note">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>' +
      '<span>投研助手是中立的信息整理与 AI 接入工具。板块页<strong>只呈现产业链环节骨架，不含具体标的</strong>；' +
      '本产品<strong>只呈现事实，不推荐个股、不预测涨跌、不给买卖时机、不构成投资建议</strong>；' +
      '分析方向由你自己配置的 AI 给出。请自行核实并独立决策，风险自担。</span></div>';

    return back + head + body + disclaimer;
  }

  // 总览 Dashboard 的共同标题栏：各区块只声明自己的内容和刷新 id，刷新与时间保持一致。
  function renderDashboardHeader(options) {
    var o = options || {};
    var id = esc(o.id || 'dashboard');
    var title = esc(o.title || '数据看板');
    var summary = esc(o.summary || '');
    var updatedAt = esc(o.updatedAt || '—');
    var icon = o.icon || '';

    return (
      '<div class="dashboard-head" data-dashboard="' + id + '">' +
      '<div class="dashboard-title">' +
      icon +
      '<h3>' + title + '</h3>' +
      (summary ? '<span class="hint">' + summary + '</span>' : '') +
      '</div>' +
      '<span class="grow"></span>' +
      '<button type="button" class="ds-refresh" title="刷新' + title + '" aria-label="刷新' + title + '" data-dashboard-refresh="' + id + '">' +
      ICO.refresh +
      '</button>' +
      '<time class="hint mono ds-meta" data-dashboard-updated="' + id + '">' + updatedAt + '</time>' +
      '</div>'
    );
  }

  function renderIndexGroups(groups) {
    return (groups || [])
      .map(function (group) {
        var items = group.items || [];
        return (
          '<div class="ov-idx-row cols-' + items.length + '">' +
          items
            .map(function (item) {
              var chg = Number(item.change || 0);
              return (
                '<div class="ov-idx-card">' +
                '<div class="name">' + esc(item.name) + '</div>' +
                '<div class="px">' + esc(item.price) + '</div>' +
                '<div class="chg ' + (chg >= 0 ? 'up' : 'down') + '">' + esc(item.changeLabel) + '</div>' +
                '</div>'
              );
            })
            .join('') +
          '</div>'
        );
      })
      .join('');
  }

  // 刷新行为由页面的数据组件提供；此处只统一 loading 与时间状态。
  function bindDashboardControls(root, refreshDashboard) {
    root.addEventListener('click', function (event) {
      var refresh = event.target.closest('[data-dashboard-refresh]');
      if (!refresh || refresh.disabled) return;
      var id = refresh.getAttribute('data-dashboard-refresh');
      refresh.disabled = true;
      refresh.classList.add('is-refreshing');

      Promise.resolve(refreshDashboard ? refreshDashboard(id) : null)
        .then(function () {
          root.querySelectorAll('[data-dashboard-updated="' + id + '"]').forEach(function (node) {
            node.textContent = '刚刚更新';
          });
        })
        .finally(function () {
          refresh.disabled = false;
          refresh.classList.remove('is-refreshing');
        });
    });
  }

  global.MarketComponents = {
    renderIntelBody: renderIntelBody,
    renderInvestmentPanel: renderInvestmentPanel,
    renderWatchlistFeed: renderWatchlistFeed,
    renderSectorGrid: renderSectorGrid,
    renderSectorDetail: renderSectorDetail,
    renderDashboardHeader: renderDashboardHeader,
    renderIndexGroups: renderIndexGroups,
    bindDashboardControls: bindDashboardControls,
  };
})(window);
