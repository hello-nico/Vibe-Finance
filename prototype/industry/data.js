/* 行业详情 mock 数据适配层。
 * 后续真实接入只需保持 loadIndustry(name) 的返回结构，不影响展示组件。
 */
(function (global) {
  const SEMICONDUCTOR = {
    identity: {
      id: "industry-em-bk0447",
      name: "半导体",
      aliases: ["半导体产业"],
      classification: {
        system: "东财",
        level: "二级行业",
        badge: "东财二级行业",
        code: "BK0447",
        parentName: "电子",
        csrc: "C39 计算机、通信和其他电子设备制造业",
        swL1: "电子",
      },
      description:
        "半导体行业涵盖芯片设计、晶圆制造、封装测试及上游材料与设备，是电子信息产业的基础支撑环节。",
      constituentCount: 86,
      floatCapYi: 3482.21,
      updatedAt: "2026-08-04",
      updatedAtFull: "2026-08-04 14:32",
      sourceLabel: "行情数据 · 行业分类 · 公司资料",
    },
    quote: {
      indexValue: 2846.32,
      changePts: 206.15,
      changePct: 7.29,
      ytdPct: 18.42,
      turnoverYi: 1268.34,
      peTtm: 48.6,
      pb: 4.85,
    },
    chain: [
      {
        id: "materials",
        name: "上游材料",
        role: "硅片、光刻胶、电子特气、靶材",
        companies: ["沪硅产业", "安集科技"],
        signal: {
          label: "需求回暖，价格企稳",
          detail: "硅片报价环比持平，国产材料验证持续推进",
          tone: "positive",
        },
      },
      {
        id: "equipment",
        name: "设备",
        role: "光刻、刻蚀、薄膜、清洗、检测",
        companies: ["北方华创", "中微公司"],
        signal: {
          label: "订单饱满，扩产兑现",
          detail: "头部设备厂商在手订单保持增长",
          tone: "positive",
        },
      },
      {
        id: "design",
        name: "设计",
        role: "CPU/GPU、存储、模拟、射频",
        companies: ["寒武纪", "兆易创新"],
        signal: {
          label: "AI 芯片景气上行",
          detail: "AI 算力强势，消费类芯片仍在修复",
          tone: "positive",
        },
      },
      {
        id: "manufacturing",
        name: "制造",
        role: "先进制程、成熟制程、特色工艺",
        companies: ["中芯国际", "华虹公司"],
        signal: {
          label: "产能利用率回升",
          detail: "先进制程利用率维持高位，成熟制程温和改善",
          tone: "positive",
        },
      },
      {
        id: "packaging",
        name: "封测",
        role: "先进封装、传统封测、测试",
        companies: ["长电科技", "通富微电"],
        signal: {
          label: "先进封装需求强",
          detail: "高性能计算相关封装需求继续增长",
          tone: "positive",
        },
      },
    ],
    signals: [
      {
        id: "revenue",
        label: "行业营收（TTM）",
        value: "6,458.85 亿元",
        change: "+19.6%",
        period: "同比",
        source: "样本公司汇总",
        tone: "positive",
        icon: "revenue",
      },
      {
        id: "profit",
        label: "净利润（TTM）",
        value: "1,123.12 亿元",
        change: "+18.5%",
        period: "同比",
        source: "样本公司汇总",
        tone: "positive",
        icon: "profit",
      },
      {
        id: "inventory",
        label: "存货周转天数",
        value: "84 天",
        change: "−6 天（改善）",
        period: "环比",
        source: "样本公司汇总",
        tone: "improve",
        icon: "inventory",
      },
    ],
    constituents: [
      { code: "688981", name: "中芯国际", stage: "制造", price: 48.2, changePct: 3.4, turnoverYi: 86.2, pe: 62.1, pb: 2.8, pePctile: 72, roe: 4.2, profitYoY: 41.8, marketCapYi: 3860, floatCapYi: 1972, ytdPct: 12.5 },
      { code: "002371", name: "北方华创", stage: "设备", price: 312.5, changePct: 4.85, turnoverYi: 64.8, pe: 38.2, pb: 6.1, pePctile: 58, roe: 15.8, profitYoY: 35.4, marketCapYi: 1620, floatCapYi: 1598, ytdPct: 28.4 },
      { code: "688012", name: "中微公司", stage: "设备", price: 168.4, changePct: 6.21, turnoverYi: 42.6, pe: 55.0, pb: 8.2, pePctile: 65, roe: 12.1, profitYoY: 28.6, marketCapYi: 1040, floatCapYi: 1032, ytdPct: 35.2 },
      { code: "688256", name: "寒武纪", stage: "设计", price: 1028, changePct: 2.96, turnoverYi: 95.4, pe: 237.7, pb: 52.8, pePctile: 88, roe: 8.2, profitYoY: 185.0, marketCapYi: 6459, floatCapYi: 6459, ytdPct: 46.8 },
      { code: "603986", name: "兆易创新", stage: "设计", price: 98.6, changePct: 2.15, turnoverYi: 31.2, pe: 42.0, pb: 3.9, pePctile: 44, roe: 9.5, profitYoY: 32.1, marketCapYi: 680, floatCapYi: 676, ytdPct: 8.6 },
      { code: "688008", name: "澜起科技", stage: "设计", price: 72.3, changePct: 1.8, turnoverYi: 27.9, pe: 48.5, pb: 5.2, pePctile: 51, roe: 11.0, profitYoY: 52.6, marketCapYi: 820, floatCapYi: 818, ytdPct: 15.1 },
      { code: "600584", name: "长电科技", stage: "封测", price: 39.8, changePct: 1.42, turnoverYi: 24.7, pe: 31.6, pb: 2.6, pePctile: 39, roe: 8.9, profitYoY: 22.3, marketCapYi: 712, floatCapYi: 708, ytdPct: 11.2 },
      { code: "688126", name: "沪硅产业", stage: "上游材料", price: 18.7, changePct: -0.64, turnoverYi: 13.3, pe: 96.4, pb: 3.1, pePctile: 71, roe: 2.7, profitYoY: -8.4, marketCapYi: 514, floatCapYi: 514, ytdPct: -2.8 },
    ],
  };

  const INDUSTRIES = {
    半导体: SEMICONDUCTOR,
    "半导体产业": SEMICONDUCTOR,
  };

  const EMPTY = {
    identity: {
      id: "industry-placeholder",
      name: "示例行业",
      aliases: [],
      classification: {
        system: "待接入",
        level: "—",
        badge: "待接入",
        code: "—",
        parentName: "—",
        csrc: "—",
        swL1: "—",
      },
      description: "暂无行业资料。",
      constituentCount: 0,
      floatCapYi: null,
      updatedAt: "—",
      updatedAtFull: "—",
      sourceLabel: "原型占位",
    },
    quote: {
      indexValue: null,
      changePts: null,
      changePct: null,
      ytdPct: null,
      turnoverYi: null,
      peTtm: null,
      pb: null,
    },
    chain: [],
    signals: [],
    constituents: [],
  };

  async function loadIndustry(name) {
    const key = String(name || "").trim();
    const value = INDUSTRIES[key] || {
      ...structuredClone(EMPTY),
      identity: { ...structuredClone(EMPTY.identity), name: key || EMPTY.identity.name },
    };
    return structuredClone(value);
  }

  global.IndustryData = {
    DEFAULT_NAME: "半导体",
    loadIndustry,
  };
})(window);
