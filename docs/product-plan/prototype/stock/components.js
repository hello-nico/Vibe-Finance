/* 个股详情区块渲染 · 一函数一卡，对齐 Vibe-Research StockData */
(function (global) {
  const esc = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fmt = (v, suffix = "") =>
    v === null || v === undefined || v === "" ? "—" : `${v}${suffix}`;

  const num = (s) => {
    if (s == null) return null;
    const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ""));
    return Number.isNaN(n) ? null : n;
  };

  const yoyClass = (s) => {
    const n = num(s);
    if (n == null) return "";
    if (n > 0) return "up";
    if (n < 0) return "down";
    return "";
  };

  const ico = {
    clipboard:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>',
    line:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    bar:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19V8"/></svg>',
    file:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',
    megaphone:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11v2a4 4 0 0 0 4 4h1"/><path d="M14 6l7-2v16l-7-2V6z"/><path d="M14 8.5A6.5 6.5 0 0 0 7.5 15"/></svg>',
    news:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h12v16H4z"/><path d="M16 8h4v12a2 2 0 0 1-2 2h-2"/><path d="M7 8h6M7 12h6M7 16h4"/></svg>',
    wallet:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H5a2 2 0 0 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><circle cx="17" cy="12" r="1"/></svg>',
    lock:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
    boxes:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3"/><circle cx="6.5" cy="16" r="3"/><circle cx="17.5" cy="16" r="3"/><path d="M9.2 9.5 7.6 13M14.8 9.5l1.6 3.5M9.2 16h5.6"/></svg>',
  };

  function card(inner) {
    return `<section class="ds-sec"><div class="glass ds-card">${inner}</div></section>`;
  }

  function metricTile(k, v, sub, subClass) {
    return `<div class="stk-metric"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>${
      sub ? `<div class="sub ${subClass || ""}">${esc(sub)}</div>` : ""
    }</div>`;
  }

  function renderOverview(val) {
    if (!val) return "";
    const metrics = [
      { k: "现价", v: fmt(val.price) },
      { k: "PE(TTM)", v: fmt(val.pe_ttm) },
      { k: "PB", v: fmt(val.pb) },
      { k: "总市值", v: fmt(val.mcap_yi, " 亿") },
      { k: "26E EPS", v: fmt(val.eps_26e) },
      { k: "前向PE", v: fmt(val.pe_26e) },
      { k: "PEG", v: fmt(val.peg) },
      { k: "消化年数", v: fmt(val.digest_years, " 年") },
    ];
    const cover =
      val.analyst_count > 0
        ? `<span class="stk-ov-meta">机构覆盖 ${esc(val.analyst_count)} 家</span>`
        : "";
    return card(`
      <div class="stk-ov-head">
        <span class="stk-ov-name">${esc(val.name)}</span>
        <span class="stk-ov-code">${esc(val.code)}</span>
        ${cover}
        <button type="button" class="stk-ov-ai" data-agent="读这些数据">让助手读这些数据</button>
      </div>
      <div class="stk-metrics">
        ${metrics.map((m) => metricTile(m.k, m.v)).join("")}
      </div>
      ${val.forecast_note ? `<p class="stk-note">${esc(val.forecast_note)}</p>` : ""}
    `);
  }

  function earningsTags(val, fin, pctl) {
    const tags = [];
    const revYoy = num(fin.revenue_yoy);
    const npYoy = num(fin.net_profit_yoy);
    const roe = num(fin.roe);
    const pePctile = pctl?.metrics?.pe_ttm?.percentile ?? null;
    if (revYoy != null) tags.push(`营收${revYoy >= 30 ? "高增长" : revYoy >= 0 ? "正增长" : "下滑"}`);
    if (revYoy != null && npYoy != null) {
      tags.push(npYoy >= revYoy ? "利润增速快于营收" : "利润增速慢于营收");
    }
    if (roe != null) tags.push(`${roe >= 15 ? "高" : roe >= 8 ? "中" : "偏低"} ROE ${roe}%`);
    if (pePctile != null) {
      tags.push(`PE ${pePctile < 30 ? "低" : pePctile <= 70 ? "中" : "高"}分位 ${Math.round(pePctile)}%`);
    }
    if (val.peg != null) tags.push(`PEG ${val.peg}`);
    return tags;
  }

  function renderEarnings(val, fin, pctl) {
    if (!fin || (!fin.revenue && !fin.net_profit)) return "";
    const tags = earningsTags(val, fin, pctl);
    const fwd = [];
    if (val.eps_26e != null) fwd.push(`一致预期 26E EPS ${val.eps_26e}`);
    if (val.pe_26e != null) fwd.push(`前向 PE ${val.pe_26e}`);
    if (val.digest_years != null && val.digest_years > 0) fwd.push(`估值消化 ${val.digest_years} 年`);
    if (val.analyst_count > 0) fwd.push(`${val.analyst_count} 家机构覆盖`);

    return card(`
      <div class="stk-card-h">${ico.clipboard} 财报速览${
        fin.period ? `<span class="period">· ${esc(fin.period)}</span>` : ""
      }</div>
      <p class="stk-card-hint">最新财报 + 前向一致预期 + 估值位置一眼看全。客观数据机械分档，不构成买卖建议。</p>
      <div class="stk-metrics" style="grid-template-columns:1fr 1fr">
        ${metricTile("营业总收入", fin.revenue ?? "—", fin.revenue_yoy ? `同比 ${fin.revenue_yoy}` : "", yoyClass(fin.revenue_yoy))}
        ${metricTile("归母净利润", fin.net_profit ?? "—", fin.net_profit_yoy ? `同比 ${fin.net_profit_yoy}` : "", yoyClass(fin.net_profit_yoy))}
      </div>
      ${
        tags.length
          ? `<div class="stk-tags">${tags.map((t) => `<span class="stk-tag">${esc(t)}</span>`).join("")}</div>`
          : ""
      }
      ${
        fwd.length
          ? `<p class="stk-card-foot"><span class="label">前向预期：</span>${esc(fwd.join(" · "))}</p>`
          : ""
      }
    `);
  }

  function valBand(label, m) {
    const span = Math.max(m.max - m.min, 1e-6);
    const pos = (v) => Math.min(100, Math.max(0, ((v - m.min) / span) * 100));
    const p20 = pos(m.p20);
    const p80 = pos(m.p80);
    const cur = pos(m.current);
    const zone =
      m.percentile < 20 ? "低估区" : m.percentile > 80 ? "高估区" : "合理区";
    const zoneCls =
      m.percentile < 20 ? "zone-low" : m.percentile > 80 ? "zone-high" : "zone-fair";
    return `
      <div class="stk-valband">
        <div class="stk-valband-h">
          <span class="lab">${esc(label)} <span class="n">${esc(m.n)} 点</span></span>
          <span class="sum">当前 <b>${esc(m.current)}</b> · 近5年 <b class="${zoneCls}">${esc(m.percentile)}%</b> 分位（<span class="${zoneCls}">${zone}</span>）</span>
        </div>
        <div class="stk-valband-track">
          <div class="seg seg-low" style="width:${p20}%"></div>
          <div class="seg seg-mid" style="left:${p20}%;width:${Math.max(p80 - p20, 0)}%"></div>
          <div class="seg seg-high" style="left:${p80}%;width:${Math.max(100 - p80, 0)}%"></div>
          <div class="stk-valband-pin" style="left:${cur}%"></div>
        </div>
        <div class="stk-valband-scale">
          <span>低 ${esc(m.min)}</span>
          <span>20% ${esc(m.p20)}</span>
          <span>中 ${esc(m.p50)}</span>
          <span>80% ${esc(m.p80)}</span>
          <span>高 ${esc(m.max)}</span>
        </div>
      </div>`;
  }

  function renderValBands(pctl) {
    if (!pctl || (!pctl.metrics?.pe_ttm && !pctl.metrics?.pb)) return "";
    return card(`
      <div class="stk-card-h">${ico.line} 估值历史分位 · ${esc(pctl.period)}</div>
      <p class="stk-card-hint">绿=低估区 / 灰=合理区 / 红=高估区。只显示当前处于历史什么位置，不构成买卖建议。</p>
      ${pctl.metrics.pe_ttm ? valBand("PE-TTM", pctl.metrics.pe_ttm) : ""}
      ${pctl.metrics.pb ? valBand("市净率 PB", pctl.metrics.pb) : ""}
    `);
  }

  function renderFinancials(fin) {
    if (!fin || (!fin.revenue && !fin.roe)) return "";
    const items = [
      { k: "营业总收入", v: fin.revenue, yoy: fin.revenue_yoy },
      { k: "归母净利润", v: fin.net_profit, yoy: fin.net_profit_yoy },
      { k: "每股收益", v: fin.eps },
      { k: "ROE", v: fin.roe },
      { k: "销售毛利率", v: fin.gross_margin },
      { k: "销售净利率", v: fin.net_margin },
      { k: "每股净资产", v: fin.bvps },
      { k: "每股经营现金流", v: fin.op_cf_ps },
    ];
    return card(`
      <div class="stk-card-h">${ico.bar} 财务关键指标${
        fin.period ? `<span class="period">· ${esc(fin.period)}</span>` : ""
      }</div>
      <p class="stk-card-hint">同花顺财务摘要，最新报告期。</p>
      <div class="stk-metrics">
        ${items
          .map((m) =>
            metricTile(
              m.k,
              m.v ?? "—",
              m.yoy ? `同比 ${m.yoy}` : "",
              yoyClass(m.yoy)
            )
          )
          .join("")}
      </div>
    `);
  }

  function renderReports(list) {
    if (!list?.length) return "";
    const rows = list
      .slice(0, 12)
      .map((r) => {
        const title = r.pdfUrl
          ? `<a class="title" href="${esc(r.pdfUrl)}" target="_blank" rel="noreferrer">${esc(r.title)}</a>`
          : `<span class="title">${esc(r.title)}</span>`;
        const rating = r.emRatingName
          ? `<span class="stk-rating">${esc(r.emRatingName)}</span>`
          : "";
        return `<div class="stk-row">
          <span class="dt">${esc((r.publishDate || "").slice(0, 10))}</span>
          <span class="org">${esc(r.orgSName || "")}</span>
          ${title}
          ${rating}
        </div>`;
      })
      .join("");
    return card(`
      <div class="stk-card-h">${ico.file} 近期研报（${list.length}）</div>
      <div class="stk-list" style="margin-top:10px">${rows}</div>
    `);
  }

  function renderAnnouncements(list) {
    if (!list?.length) return "";
    const rows = list
      .slice(0, 12)
      .map((a) => {
        const clean = String(a.title || "").replace(/^[^:：]*[:：]/, "");
        const title = a.url
          ? `<a class="title" href="${esc(a.url)}" target="_blank" rel="noreferrer">${esc(clean)}</a>`
          : `<span class="title">${esc(clean)}</span>`;
        return `<div class="stk-row">
          <span class="dt">${esc(a.date)}</span>
          ${a.type ? `<span class="type">${esc(a.type)}</span>` : ""}
          ${title}
        </div>`;
      })
      .join("");
    return card(`
      <div class="stk-card-h">${ico.megaphone} 近期公告（${list.length}）</div>
      <div class="stk-list" style="margin-top:10px">${rows}</div>
    `);
  }

  function renderNews(list) {
    const body =
      !list?.length
        ? `<p class="stk-empty">暂无新闻</p>`
        : `<div class="stk-list">${list
            .slice(0, 10)
            .map((n) => {
              const parts = String(n.time || "").split(" ");
              const dt =
                parts.length >= 2
                  ? `<span class="dt-stack">${esc(parts[0])}<br>${esc(parts[1])}</span>`
                  : `<span class="dt">${esc(n.time || "")}</span>`;
              return `<div class="stk-row">${dt}<span class="title">${esc(n.title)}</span></div>`;
            })
            .join("")}</div>`;
    return card(`
      <div class="stk-card-h">${ico.news} 个股新闻</div>
      <div style="margin-top:10px">${body}</div>
    `);
  }

  function renderCapital(capital) {
    if (!capital) return "";
    const { margin, holders, dividend, fund_flow_20d_yi, blockTrades } = capital;
    const has =
      margin || holders || dividend || fund_flow_20d_yi != null || blockTrades?.length;
    if (!has) return "";

    const tiles = [];
    if (margin) {
      tiles.push(metricTile("融资余额", `${margin.rzye_yi} 亿`, margin.date));
      tiles.push(metricTile("融券余额", `${margin.rqye_yi} 亿`));
    }
    if (holders) {
      tiles.push(
        metricTile(
          "股东户数",
          Number(holders.num).toLocaleString("zh-CN"),
          `环比 ${holders.change_ratio}%`
        )
      );
    }
    if (fund_flow_20d_yi != null) {
      tiles.push(metricTile("近20日主力净流入", `${fund_flow_20d_yi} 亿`));
    }
    if (dividend) {
      tiles.push(metricTile("最近派息(每10股)", `${dividend.bonus_rmb} 元`, dividend.date));
    }

    let blocks = "";
    if (blockTrades?.length) {
      blocks = `
        <div class="stk-block-h">近期大宗交易（${blockTrades.length}）</div>
        ${blockTrades
          .slice(0, 5)
          .map((b) => {
            const premCls = b.premium_pct >= 0 ? "up" : "down";
            return `<div class="stk-block-row">
              <span class="dt">${esc(b.date)}</span>
              <span class="px">${esc(b.price)} 元</span>
              <span class="prem ${premCls}">折溢 ${esc(b.premium_pct)}%</span>
              <span class="parties">买 ${esc(b.buyer)} · 卖 ${esc(b.seller)}</span>
            </div>`;
          })
          .join("")}`;
    }

    return card(`
      <div class="stk-card-h">${ico.wallet} 资金面 · 筹码</div>
      <div class="stk-metrics" style="margin-top:10px">${tiles.join("")}</div>
      ${blocks}
      <p class="stk-note">资金/筹码为公开客观数据，仅供了解该股当前状态，不构成任何买卖建议。</p>
    `);
  }

  function renderLockup(lockup) {
    if (!lockup || (!lockup.upcoming?.length && !lockup.history?.length)) return "";
    let upcoming;
    if (lockup.upcoming.length) {
      upcoming = `
        <div class="stk-note" style="margin:0 0 10px;padding:10px 12px;border-radius:10px;border:1px solid hsl(var(--warning)/0.3);background:hsl(var(--warning)/0.08)">
          <div style="font-weight:500;color:hsl(var(--warning));margin-bottom:6px">未来 90 天待解禁（${lockup.upcoming.length}）</div>
          ${lockup.upcoming
            .slice(0, 4)
            .map(
              (h) =>
                `<div class="stk-block-row"><span class="dt">${esc(h.date)}</span><span class="parties" style="color:var(--fg)">${esc(h.type)}</span></div>`
            )
            .join("")}
        </div>`;
    } else {
      upcoming = `<p class="stk-empty">未来 90 天无待解禁。</p>`;
    }
    const hist = lockup.history?.length
      ? `
        <div class="stk-block-h" style="border-top:none;padding-top:0;margin-top:4px">历史解禁（近 ${Math.min(lockup.history.length, 5)}）</div>
        ${lockup.history
          .slice(0, 5)
          .map(
            (h) =>
              `<div class="stk-block-row"><span class="dt">${esc(h.date)}</span><span class="parties">${esc(h.type)}</span></div>`
          )
          .join("")}`
      : "";
    return card(`
      <div class="stk-card-h">${ico.lock} 限售解禁</div>
      <div style="margin-top:8px">${upcoming}${hist}</div>
    `);
  }

  function renderConcepts(blocks, hot) {
    const tags = blocks?.concept_tags || [];
    const hotList = hot || [];
    if (!tags.length && !hotList.length) return "";
    return card(`
      <div class="stk-card-h">${ico.boxes} 板块归属 · 概念</div>
      ${
        tags.length
          ? `<div class="stk-concepts" style="margin-top:10px">${tags
              .slice(0, 24)
              .map((t) => `<span class="stk-tag muted">${esc(t)}</span>`)
              .join("")}</div>`
          : ""
      }
      ${
        hotList.length
          ? `<p class="stk-hot-label">当下热门概念命中</p>
             <div class="stk-concepts">${hotList
               .slice(0, 12)
               .map((h) => `<span class="stk-tag hot">${esc(h.concept)}</span>`)
               .join("")}</div>`
          : ""
      }
    `);
  }

  function renderPage(stock) {
    return [
      renderOverview(stock.val),
      renderEarnings(stock.val, stock.fin, stock.pctl),
      renderValBands(stock.pctl),
      renderFinancials(stock.fin),
      renderReports(stock.reports),
      renderAnnouncements(stock.announcements),
      renderNews(stock.news),
      renderCapital(stock.capital),
      renderLockup(stock.lockup),
      renderConcepts(stock.blocks, stock.hotConcepts),
    ].join("");
  }

  global.StockComponents = {
    renderOverview,
    renderEarnings,
    renderValBands,
    renderFinancials,
    renderReports,
    renderAnnouncements,
    renderNews,
    renderCapital,
    renderLockup,
    renderConcepts,
    renderPage,
  };
})(window);
