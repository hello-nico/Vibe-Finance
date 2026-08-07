/* 行业详情展示组件：纯渲染，不持有路由、加入研究或助手状态。 */
(function (global) {
  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const icons = {
    chain:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3"/><circle cx="6.5" cy="16" r="3"/><circle cx="17.5" cy="16" r="3"/><path d="M9.2 9.5 7.6 13M14.8 9.5l1.6 3.5M9.2 16h5.6"/></svg>',
    signal:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    company:
      '<svg class="ds-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19V8"/></svg>',
    arrow:
      '<svg class="industry-chain-arrow-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    up:
      '<svg class="industry-trend-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    down:
      '<svg class="industry-trend-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg>',
  };

  const stageIcons = {
    materials:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 2v7.31L4.69 18A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.71-3L14 9.31V2"/><path d="M8.5 2h7M7 15h10"/></svg>',
    equipment:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    design:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9zM9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>',
    manufacturing:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21h18M5 21V10l4 3V10l4 3V7l4 3V3h2v18"/></svg>',
    packaging:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  };

  const signalIcons = {
    revenue:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>',
    profit:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.5-1 1.5-2 1.5-2 .5-2 1.5 1 1.5 2 1.5 1.9-.5 2.5-1.5"/></svg>',
    inventory:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/></svg>',
  };

  const fmtNumber = (value, digits = 2) =>
    value == null
      ? "—"
      : Number(value).toLocaleString("zh-CN", {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        });

  const fmtPct = (value) => {
    if (value == null) return "—";
    const sign = value > 0 ? "+" : value < 0 ? "−" : "";
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  };

  const toneClass = (value) => (value > 0 ? "up" : value < 0 ? "down" : "");

  function sectionHeader(icon, title, summary, meta) {
    return `<div class="industry-section-head">
      <div class="industry-section-heading">
        <div class="industry-section-title">${icon}<h2>${esc(title)}</h2></div>
        ${summary ? `<p class="industry-section-summary">${esc(summary)}</p>` : ""}
      </div>
      ${meta ? `<span class="industry-section-meta">${esc(meta)}</span>` : ""}
    </div>`;
  }

  function renderOverview(industry) {
    const { identity, quote } = industry;
    const classification = identity.classification || {};
    const badge = classification.badge || `${classification.system || ""}${classification.level ? classification.level : ""}`;
    const metaPairs = [
      ["所属板块", classification.parentName],
      ["证监会行业", classification.csrc],
      ["申万一级行业", classification.swL1 || classification.parentName],
      ["成分股数", identity.constituentCount == null ? "—" : `${identity.constituentCount}`],
      ["自由流通市值", identity.floatCapYi == null ? "—" : `${fmtNumber(identity.floatCapYi, 2)} 亿元`],
      ["更新日期", identity.updatedAt],
    ];

    const changeTone = toneClass(quote.changePct);
    const metrics = [
      {
        label: "行业指数",
        value: fmtNumber(quote.indexValue),
        sub:
          quote.changePts == null && quote.changePct == null
            ? ""
            : `${quote.changePts > 0 ? "+" : quote.changePts < 0 ? "−" : ""}${fmtNumber(Math.abs(quote.changePts ?? 0), 2)} / ${fmtPct(quote.changePct)}`,
        tone: changeTone,
      },
      { label: "今日涨跌", value: fmtPct(quote.changePct), sub: "", tone: changeTone },
      { label: "成分股数", value: String(identity.constituentCount ?? "—"), sub: "" },
      { label: "PE（TTM）", value: fmtNumber(quote.peTtm, 2), sub: "" },
      { label: "PB（LF）", value: fmtNumber(quote.pb, 2), sub: "" },
      {
        label: "成交额",
        value: quote.turnoverYi == null ? "—" : `${fmtNumber(quote.turnoverYi, 2)} 亿`,
        sub: "",
      },
    ];

    return `<section class="industry-identity">
      <div class="industry-identity-main glass">
        <div class="industry-title-row">
          <div class="industry-title-block">
            <h1>${esc(identity.name)}</h1>
            <span class="industry-badge">${esc(badge)}</span>
          </div>
        </div>
        <p class="industry-description">${esc(identity.description)}</p>
        <dl class="industry-meta-grid">
          ${metaPairs
            .map(
              ([label, value]) => `<div class="industry-meta-item">
                <dt>${esc(label)}</dt>
                <dd title="${esc(value ?? "—")}">${esc(value ?? "—")}</dd>
              </div>`
            )
            .join("")}
        </dl>
      </div>
      <div class="industry-metrics glass" role="list">
        ${metrics
          .map(
            (item) => `<div class="industry-metric${item.compact ? " is-compact" : ""}" role="listitem">
              <span class="label">${esc(item.label)}</span>
              <strong class="value ${item.tone || ""}">${esc(item.value)}</strong>
              ${item.sub ? `<span class="sub ${item.tone || ""}">${esc(item.sub)}</span>` : ""}
            </div>`
          )
          .join("")}
      </div>
    </section>`;
  }

  function renderChain(stages, activeId) {
    if (!stages?.length) {
      return `<section class="industry-section">${sectionHeader(icons.chain, "产业链结构", "行业关键环节与代表公司", "暂无数据")}<div class="industry-empty">产业链数据待接入</div></section>`;
    }

    const active = stages.find((stage) => stage.id === activeId) || stages[0];
    const parts = [];
    stages.forEach((stage, index) => {
      if (index > 0) {
        parts.push(`<span class="industry-chain-arrow" aria-hidden="true">${icons.arrow}</span>`);
      }
      parts.push(`<button type="button" class="industry-stage ${stage.id === active.id ? "is-active" : ""}" data-stage="${esc(stage.id)}" aria-pressed="${stage.id === active.id}">
        <span class="industry-stage-ico">${stageIcons[stage.id] || stageIcons.design}</span>
        <strong>${esc(stage.name)}</strong>
        <span class="industry-stage-role">${esc(stage.role)}</span>
        <span class="industry-stage-label">代表公司</span>
        <span class="industry-stage-companies">${stage.companies.map(esc).join(" · ")}</span>
      </button>`);
    });

    return `<section class="industry-section" id="industry-chain">
      ${sectionHeader(icons.chain, "产业链结构", "从上游材料到封装测试；点击环节唤起助手并带入上下文")}
      <div class="industry-chain" role="list">${parts.join("")}</div>
    </section>`;
  }

  function renderSignals(signals) {
    return `<section class="industry-section" id="industry-signals">
      ${sectionHeader(icons.signal, "景气度信号", "只呈现可追溯的行业经营数据，不生成综合评分")}
      <div class="industry-signal-grid">
        ${(signals || [])
          .map((signal) => {
            const trend =
              signal.tone === "improve" || signal.tone === "down" ? icons.down : icons.up;
            return `<article class="industry-signal-card glass">
              <span class="industry-signal-ico">${signalIcons[signal.icon] || signalIcons.revenue}</span>
              <div class="industry-signal-body">
                <span class="industry-signal-label">${esc(signal.label)}</span>
                <div class="industry-signal-row">
                  <strong>${esc(signal.value)}</strong>
                  <b class="${esc(signal.tone)}">${trend}<span>${esc(signal.change)}</span>${signal.period ? `<i>${esc(signal.period)}</i>` : ""}</b>
                </div>
              </div>
            </article>`;
          })
          .join("") || '<div class="industry-empty">景气数据待接入</div>'}
      </div>
    </section>`;
  }

  const TABLE_VIEWS = {
    market: {
      label: "市场表现",
      columns: [
        ["price", "现价", (v) => fmtNumber(v, 2)],
        ["changePct", "涨跌幅", fmtPct, toneClass],
        ["turnoverYi", "成交额(亿)", (v) => fmtNumber(v, 1)],
        ["pe", "PE(TTM)", (v) => fmtNumber(v, 1)],
        ["pb", "PB(LF)", (v) => fmtNumber(v, 2)],
        ["pePctile", "PE分位(近5年)", (v) => (v == null ? "—" : `${fmtNumber(v, 0)}%`)],
        ["marketCapYi", "总市值(亿)", (v) => fmtNumber(v, 0)],
        ["floatCapYi", "流通市值(亿)", (v) => fmtNumber(v, 0)],
      ],
    },
    valuation: {
      label: "估值指标",
      columns: [
        ["pe", "PE(TTM)", (v) => fmtNumber(v, 1)],
        ["pb", "PB", (v) => fmtNumber(v, 2)],
        ["pePctile", "PE分位(近5年)", (v) => (v == null ? "—" : `${fmtNumber(v, 0)}%`)],
        ["marketCapYi", "总市值(亿)", (v) => fmtNumber(v, 0)],
        ["ytdPct", "今年来", fmtPct, toneClass],
      ],
    },
    profit: {
      label: "盈利能力",
      columns: [
        ["roe", "ROE", (v) => `${fmtNumber(v, 1)}%`],
        ["profitYoY", "净利润同比", fmtPct, toneClass],
        ["pe", "PE(TTM)", (v) => fmtNumber(v, 1)],
        ["pb", "PB", (v) => fmtNumber(v, 2)],
      ],
    },
    scale: {
      label: "市值规模",
      columns: [
        ["marketCapYi", "总市值(亿)", (v) => fmtNumber(v, 0)],
        ["floatCapYi", "流通市值(亿)", (v) => fmtNumber(v, 0)],
        ["turnoverYi", "成交额(亿)", (v) => fmtNumber(v, 1)],
        ["changePct", "涨跌幅", fmtPct, toneClass],
      ],
    },
  };

  function renderConstituents(rows, viewId = "market") {
    const view = TABLE_VIEWS[viewId] || TABLE_VIEWS.market;
    const columns = view.columns;
    return `<section class="industry-section" id="industry-companies">
      ${sectionHeader(icons.company, "成分股表现", "按市场、估值、盈利与规模切换同一组重点公司")}
      <div class="industry-table-card glass">
        <div class="industry-tabs" role="tablist" aria-label="成分股指标视图">
          ${Object.entries(TABLE_VIEWS)
            .map(
              ([id, spec]) => `<button type="button" role="tab" class="industry-tab ${id === viewId ? "is-active" : ""}" data-view="${id}" aria-selected="${id === viewId}">${esc(spec.label)}</button>`
            )
            .join("")}
        </div>
        <div class="industry-table-wrap">
          <table class="industry-table">
            <thead><tr><th>#</th><th>代码</th><th>名称</th>${columns.map((column) => `<th class="right">${esc(column[1])}</th>`).join("")}</tr></thead>
            <tbody>
              ${(rows || [])
                .map(
                  (row, index) => `<tr data-stock="${esc(row.name)}">
                    <td class="idx">${index + 1}</td>
                    <td class="code"><a href="05-stock.html?name=${encodeURIComponent(row.name)}">${esc(row.code)}</a></td>
                    <td class="company"><a href="05-stock.html?name=${encodeURIComponent(row.name)}">${esc(row.name)}</a></td>
                    ${columns
                      .map((column) => {
                        const value = row[column[0]];
                        const cls = column[3] ? column[3](value) : "";
                        return `<td class="right mono ${cls}">${esc(column[2](value))}</td>`;
                      })
                      .join("")}
                  </tr>`
                )
                .join("") || `<tr><td colspan="${3 + columns.length}" class="industry-empty-cell">成分股数据待接入</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="industry-table-foot">
          <span>数据仅作信息整理，不构成投资建议</span>
          <a href="02-research.html">查看更多成分股 →</a>
        </div>
      </div>
    </section>`;
  }

  global.IndustryComponents = {
    renderOverview,
    renderChain,
    renderSignals,
    renderConstituents,
    tableViews: TABLE_VIEWS,
  };
})(window);
