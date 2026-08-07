/* 个股详情 mock · 默认寒武纪对齐 Vibe-Research 截图字段 */
(function (global) {
  const CAMB = {
    name: "寒武纪",
    code: "688256",
    industry: "半导体",
    val: {
      name: "寒武纪",
      code: "688256",
      price: 1028,
      pe_ttm: 237.72,
      pb: 52.77,
      mcap_yi: 6458.85,
      eps_26e: 8.71,
      pe_26e: 118,
      peg: 1.09,
      digest_years: 1.9,
      analyst_count: 15,
      forecast_note: null,
    },
    fin: {
      period: "2026-03-31",
      revenue: "28.85亿",
      revenue_yoy: "159.56%",
      net_profit: "11.23亿",
      net_profit_yoy: "185.04%",
      eps: "2.68",
      roe: "8.20%",
      gross_margin: "68.42%",
      net_margin: "38.93%",
      bvps: "19.48",
      op_cf_ps: "1.12",
    },
    pctl: {
      period: "近5年",
      metrics: {
        pe_ttm: {
          n: 914,
          current: 237.72,
          percentile: 76.5,
          min: 7.46,
          p20: 48.2,
          p50: 112.4,
          p80: 278.5,
          max: 4283.29,
        },
        pb: {
          n: 914,
          current: 52.77,
          percentile: 82.1,
          min: 4.12,
          p20: 12.8,
          p50: 28.6,
          p80: 48.9,
          max: 96.4,
        },
      },
    },
    reports: [
      { publishDate: "2026-07-29", orgSName: "群益证券", title: "算力紧缺利好国产芯片企业", emRatingName: "增持", pdfUrl: null },
      { publishDate: "2026-07-28", orgSName: "中金公司", title: "云侧订单加速落地，盈利弹性逐步释放", emRatingName: "买入", pdfUrl: null },
      { publishDate: "2026-07-22", orgSName: "华泰证券", title: "AI 训练芯片国产替代加速，维持增持", emRatingName: "增持", pdfUrl: null },
      { publishDate: "2026-07-15", orgSName: "国泰君安", title: "一季报超预期，关注下半年放量节奏", emRatingName: "增持", pdfUrl: null },
      { publishDate: "2026-07-08", orgSName: "招商证券", title: "推理侧需求上行，估值消化进入观察期", emRatingName: "买入", pdfUrl: null },
    ],
    announcements: [
      { date: "2026-07-29", type: "法律意见书", title: "北京市中伦律师事务所关于中科寒武纪科技股份有限公司2026年限制性股票激励计划的法律意见书", url: null },
      { date: "2026-07-29", type: "公司章程", title: "中科寒武纪科技股份有限公司章程（2026年7月修订）", url: null },
      { date: "2026-07-28", type: "股权激励", title: "2026年限制性股票激励计划（草案）", url: null },
      { date: "2026-07-15", type: "定期报告", title: "2026年第一季度报告", url: null },
      { date: "2026-06-30", type: "股东大会", title: "2025年年度股东大会决议公告", url: null },
    ],
    news: [
      { time: "2026-07-28 21:50", title: "寒武纪：拟推500万股限制性股票激励计划 业绩考核目标为2026-2028年累计营收不低于1000亿元等" },
      { time: "2026-07-22 10:18", title: "国产算力芯片厂商扩产提速，寒武纪获多家云厂商意向订单" },
      { time: "2026-07-15 16:02", title: "寒武纪一季报：营收同比增近1.6倍，归母净利扭亏为盈" },
      { time: "2026-06-30 22:55", title: "机构调研纪要：寒武纪称推理侧需求环比改善，产能定位于高端训练芯片" },
      { time: "2026-06-12 09:31", title: "半导体板块集体走强，寒武纪涨超6%" },
    ],
    capital: {
      margin: { rzye_yi: 175.67, rqye_yi: 0.8, date: "2026-07-31" },
      holders: { num: 68582, change_ratio: 3.09 },
      dividend: { bonus_rmb: 15, date: "2026-05-08" },
      fund_flow_20d_yi: 12.46,
      blockTrades: [
        { date: "2026-08-03", price: 1028, premium_pct: 0, buyer: "招商证券上海分公司", seller: "中信证券总部" },
        { date: "2026-07-28", price: 1015, premium_pct: -1.2, buyer: "华泰证券深圳分公司", seller: "国泰君安上海分公司" },
        { date: "2026-07-21", price: 998, premium_pct: -0.5, buyer: "中金公司上海分公司", seller: "海通证券总部" },
        { date: "2026-07-14", price: 980, premium_pct: 0.8, buyer: "广发证券广州分公司", seller: "申万宏源总部" },
        { date: "2026-07-07", price: 965, premium_pct: -2.1, buyer: "兴业证券上海分公司", seller: "中信建投北京分公司" },
      ],
    },
    lockup: {
      upcoming: [],
      history: [
        { date: "2026-04-16", type: "定向增发机构配售股份" },
        { date: "2025-11-20", type: "首发原股东限售股份" },
        { date: "2025-07-08", type: "首发战略配售股份" },
        { date: "2024-12-12", type: "定向增发机构配售股份" },
        { date: "2024-07-09", type: "首发原股东限售股份" },
      ],
    },
    blocks: {
      concept_tags: [
        "数字芯片设计", "电子", "半导体", "AI芯片", "MSCI中国",
        "边缘计算", "科创板做市股", "国产芯片", "人工智能", "云计算",
        "华为概念", "融资融券", "机构重仓",
      ],
    },
    hotConcepts: [
      { concept: "半导体概念" },
      { concept: "算力概念" },
      { concept: "人工智能" },
      { concept: "AI芯片" },
      { concept: "国产芯片" },
    ],
  };

  const FALLBACK = {
    name: "示例公司",
    code: "000000",
    industry: "—",
    val: {
      name: "示例公司",
      code: "000000",
      price: null,
      pe_ttm: null,
      pb: null,
      mcap_yi: null,
      eps_26e: null,
      pe_26e: null,
      peg: null,
      digest_years: null,
      analyst_count: 0,
      forecast_note: "原型占位数据，请从行情页进入具体公司。",
    },
    fin: {
      period: "—",
      revenue: "—",
      revenue_yoy: null,
      net_profit: "—",
      net_profit_yoy: null,
      eps: "—",
      roe: "—",
      gross_margin: "—",
      net_margin: "—",
      bvps: "—",
      op_cf_ps: "—",
    },
    pctl: {
      period: "近5年",
      metrics: {
        pe_ttm: {
          n: 0, current: 0, percentile: 50,
          min: 0, p20: 20, p50: 50, p80: 80, max: 100,
        },
      },
    },
    reports: [],
    announcements: [],
    news: [],
    capital: {
      margin: null,
      holders: null,
      dividend: null,
      fund_flow_20d_yi: null,
      blockTrades: [],
    },
    lockup: { upcoming: [], history: [] },
    blocks: { concept_tags: [] },
    hotConcepts: [],
  };

  // 保留旧入口名，避免行情链断裂时完全空白
  const MAOTAI = {
    ...structuredClone(CAMB),
    name: "贵州茅台",
    code: "600519",
    industry: "白酒",
    val: {
      name: "贵州茅台",
      code: "600519",
      price: 1482,
      pe_ttm: 24.5,
      pb: 8.2,
      mcap_yi: 18600,
      eps_26e: 68.2,
      pe_26e: 21.7,
      peg: 1.8,
      digest_years: 3.2,
      analyst_count: 28,
      forecast_note: null,
    },
    fin: {
      period: "2026-03-31",
      revenue: "512.4亿",
      revenue_yoy: "15.20%",
      net_profit: "268.1亿",
      net_profit_yoy: "14.80%",
      eps: "21.35",
      roe: "32.00%",
      gross_margin: "92.10%",
      net_margin: "52.30%",
      bvps: "186.4",
      op_cf_ps: "18.2",
    },
    pctl: {
      period: "近5年",
      metrics: {
        pe_ttm: {
          n: 1200, current: 24.5, percentile: 32.0,
          min: 18.2, p20: 22.1, p50: 28.4, p80: 38.6, max: 68.2,
        },
        pb: {
          n: 1200, current: 8.2, percentile: 28.0,
          min: 6.1, p20: 7.4, p50: 10.2, p80: 14.8, max: 22.5,
        },
      },
    },
    reports: [
      { publishDate: "2026-07-20", orgSName: "中金公司", title: "批价平稳，旺季动销有望环比改善", emRatingName: "跑赢行业", pdfUrl: null },
      { publishDate: "2026-07-12", orgSName: "华泰证券", title: "直营占比提升对冲批价波动", emRatingName: "增持", pdfUrl: null },
    ],
    announcements: [
      { date: "2026-07-18", type: "定期报告", title: "2026年半年度业绩预告", url: null },
      { date: "2026-06-28", type: "分红", title: "2025年年度权益分派实施公告", url: null },
    ],
    news: [
      { time: "2026-07-18 18:20", title: "贵州茅台：上半年预计归母净利同比增长约15%" },
      { time: "2026-06-30 09:12", title: "白酒板块分化，茅台成交额居前" },
    ],
    capital: {
      margin: { rzye_yi: 92.3, rqye_yi: 1.2, date: "2026-07-31" },
      holders: { num: 142308, change_ratio: -0.8 },
      dividend: { bonus_rmb: 308.76, date: "2026-06-28" },
      fund_flow_20d_yi: -3.2,
      blockTrades: [
        { date: "2026-07-25", price: 1478, premium_pct: -0.3, buyer: "中信证券总部", seller: "国泰君安总部" },
      ],
    },
    lockup: { upcoming: [], history: [{ date: "2024-08-01", type: "首发原股东限售股份" }] },
    blocks: {
      concept_tags: ["白酒", "大消费", "贵州板块", "沪深300", "融资融券", "机构重仓"],
    },
    hotConcepts: [{ concept: "白酒概念" }, { concept: "消费复苏" }],
  };

  const STOCKS = {
    寒武纪: CAMB,
    中科寒武纪: CAMB,
    贵州茅台: MAOTAI,
    茅台: MAOTAI,
  };

  function getStock(name) {
    const key = (name || "").trim();
    if (STOCKS[key]) return structuredClone(STOCKS[key]);
    // 名字匹配：含「寒武」走寒武纪
    if (key.includes("寒武")) return structuredClone(CAMB);
    if (key.includes("茅台")) return structuredClone(MAOTAI);
    const fb = structuredClone(FALLBACK);
    if (key) {
      fb.name = key;
      fb.val.name = key;
    }
    return fb;
  }

  global.StockData = { STOCKS, getStock, DEFAULT_NAME: "寒武纪" };
})(window);
