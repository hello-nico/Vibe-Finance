/**
 * 研究 Mode · 共享 mock · prototype/research/data.js
 * 关注对象、最近更新、对象页内容（个股：中远海控；行业：航运）。
 * 全部为演示数据；界面语言遵循业务口径，不出现内部技术名词。
 */
window.RES_DATA = {
  // ---- 关注对象列表 ----
  stocks: [
    {
      key: 'cosco', name: '中远海控', code: '601919', tag: '跟踪',
      state: 'green', updated: '今天 09:12', unread: true, pendingReview: true,
      industry: '航运', industryKey: 'shipping',
      note: '即期运价越过关键阈值，待复核',
    },
    {
      key: 'cambricon', name: '寒武纪', code: '688256', tag: '关注',
      state: 'yellow', updated: '昨天 17:40', unread: true, pendingReview: false,
      industry: '推理芯片', industryKey: 'inference-silicon',
      note: '指标分化：订单强、毛利率回落',
    },
    {
      key: 'shenhuo', name: '神火股份', code: '000933', tag: '关注',
      state: 'gray', updated: '昨天 08:00', unread: false, pendingReview: false,
      industry: '电解铝', industryKey: 'aluminum',
      note: '缺 2026 年一季报，财务证据已过时',
      stale: true,
    },
    {
      key: 'yunlv', name: '云铝股份', code: '000807', tag: '关注',
      state: null, updated: '', unread: false, pendingReview: false,
      industry: '电解铝', industryKey: 'aluminum',
      init: 'building',
    },
    {
      key: 'guodian', name: '国电电力', code: '600795', tag: '关注',
      state: null, updated: '2 天前', unread: false, pendingReview: false,
      industry: '电力', industryKey: 'power',
      init: 'failed',
    },
  ],
  industries: [
    {
      key: 'shipping', name: '航运', tag: '',
      state: 'green', updated: '今天 08:50', unread: true, pendingReview: false,
      note: '年报摄取后完成深复核，报告已更新',
    },
    {
      key: 'inference-silicon', name: '推理芯片', tag: '',
      state: 'yellow', updated: '昨天 17:40', unread: true, pendingReview: true,
      note: '资本开支数据越过阈值，待复核',
    },
    {
      key: 'aluminum', name: '电解铝', tag: '',
      state: 'yellow', updated: '3 天前', unread: false, pendingReview: false,
      note: '氧化铝价格与电价分化',
    },
  ],

  // ---- 最近更新（两 Tab 顶部共用） ----
  updates: [
    { type: 'pending', obj: '中远海控', objKey: 'cosco', kind: 'stock', when: '今天 09:12',
      text: '即期运价（SCFI）四周累计上行 18%，越过关键阈值，已标记待复核。' },
    { type: 'report', obj: '航运', objKey: 'shipping', kind: 'industry', when: '今天 08:50',
      text: '年报摄取后完成深复核：利润假设与价值区间已重算，当前报告已更新。' },
    { type: 'state', obj: '推理芯片', objKey: 'inference-silicon', kind: 'industry', when: '昨天 17:40',
      text: '健康评估由绿转黄：订单保持强势，但毛利率连续两期回落，指标分化。' },
    { type: 'unchanged', obj: '神火股份', objKey: 'shenhuo', kind: 'stock', when: '昨天 08:00',
      text: '每周例行检查完成：查了价格估值位置、3 项先行指标和是否有新到资料——查过了，没变。' },
    { type: 'stale', obj: '神火股份', objKey: 'shenhuo', kind: 'stock', when: '昨天 08:00',
      text: '超过披露截止日与宽限期仍未取到 2026 年一季报，财务证据已标记过时，缺哪一期已登记。' },
    { type: 'failed', obj: '国电电力', objKey: 'guodian', kind: 'stock', when: '2 天前',
      text: '建立研究三次重试未成功，已暂停。再次点击该对象即可恢复。' },
  ],

  // ---- 个股对象页：中远海控 ----
  cosco: {
    name: '中远海控', code: '601919', tag: '跟踪',
    industry: { name: '航运', key: 'shipping' },
    health: {
      state: 'green',
      headline: '条件总体有利：运价上行、成本稳定、供给压力可控',
      completedAt: '今天 08:50（深度分析完成）',
      pendingReview: '即期运价越过关键阈值，待复核；复核完成前，健康评估与价值区间不变。',
      reasons: [
        { level: 'F', text: '即期运价（SCFI）近四周上行 18%，欧线、美线同步走强（截至今天，交易所数据）。' },
        { level: 'F', text: '一季度归母净利润同比增长，集装箱航运贡献约 94%（公司季报，2026-04-28）。' },
        { level: 'I', text: '长协重签价格高于去年，锁定了部分利润弹性（基于公司披露与券商调研的推断）。' },
        { level: 'C', text: '订单簿占船队 6.9%，交付高峰在明年，年内供给压力可控（行业数据，2026-07）。' },
      ],
      gaps: ['长协与即期的价格结构缺少公司官方口径', '明年新船集中交付后的运力消化缺最新数据'],
      changeConditions: '运价连续四周回落、新船交付明显快于预期、或长协重签价格转跌，都会把评估压向黄。',
    },
    indicators: {
      price: { value: '11.86', change: '+1.2%', asof: '今天 15:00' },
      range: { low: '12.5', high: '15.8', position: '区间下沿附近', margin: '安全边际较足', computedAt: '今天 08:50' },
      groups: [
        {
          title: '财务与估值',
          items: [
            { name: '归母净利润（一季度）', value: '同比 +24%', asof: '2026-04-28', src: '公司季报' },
            { name: '经营现金流', value: '为净利润 1.1 倍', asof: '2026-04-28', src: '公司季报' },
            { name: '在手现金', value: '约 1,800 亿', asof: '2026-04-28', src: '公司季报' },
          ],
        },
        {
          title: '利润关键变量',
          items: [
            { name: '即期运价（SCFI）', value: '2,180 点', trend: 'up', delta: '四周 +18%', asof: '今天', src: '交易所' },
            { name: '长协价占比', value: '约 45%', trend: 'flat', delta: '重签中', asof: '2026-06', src: '券商调研' },
            { name: '燃油成本', value: '基本持平', trend: 'flat', delta: '两周 +1%', asof: '今天', src: '行业数据' },
          ],
        },
        {
          title: '行业先行指标',
          items: [
            { name: '订单簿占船队', value: '6.9%', trend: 'down', delta: '供给压力可控', asof: '2026-07', src: '行业数据' },
            { name: '新船交付（年内）', value: '低于去年', trend: 'flat', delta: '高峰在明年', asof: '2026-07', src: '行业数据' },
            { name: '欧线装载率', value: '96%', trend: 'up', delta: '高位', asof: '本周', src: '行业数据' },
          ],
        },
      ],
    },
    report: {
      updated: '今天 08:50 · 深度分析后更新',
      judgement: '健康评估绿。利润由运价驱动，当前价格处于价值区间下沿附近，安全边际较足；运价回落是最需要盯的反证。',
      business: [
        { name: '集装箱航运', desc: '运价 × 运量，周期性强', rev: 88, profit: 94 },
        { name: '码头业务', desc: '稳定现金流，弱周期', rev: 9, profit: 5 },
        { name: '其他', desc: '物流等', rev: 3, profit: 1 },
      ],
      drivers: [
        { name: '即期运价', role: '本轮利润弹性的核心变量，领先利润约一个季度', trend: 'up', delta: '近 4 周上行' },
        { name: '长协价结构', role: '决定回落时的利润缓冲垫', trend: 'flat', delta: '重签中，价格高于去年' },
        { name: '供给（交付 − 拆船）', role: '决定下一轮供需平衡', trend: 'down', delta: '年内可控，明年是高峰' },
      ],
      valuation: {
        method: '周期正常化利润 + 分红折现交叉验证',
        why: '航运利润周期性强，单年利润不代表盈利能力；用正常化利润估计中枢，再用高分红做下限验证。',
        facts: ['正常化归母净利润按五年中枢与当前运价情景估计', '分红率按公司承诺口径', '运价情景与燃油成本为模型假设，可追问'],
        range: '12.5 – 15.8',
        position: '当前 11.86，处于区间下沿附近',
        margin: '安全边际较足',
        sensitivity: '运价每变动 10%，正常化利润约变动 22%，区间上下沿同步移动。',
      },
      risks: ['运价见顶回落：装载率与运价同时拐头是最直接的信号', '明年新船交付高峰若叠加需求走弱，供给逻辑反转', '长协重签价格低于预期，利润缓冲变薄'],
      gaps: ['长协与即期价格结构缺公司官方口径', '新船交付后的实际消化缺最新数据'],
      evidenceNote: '报告中的关键数字都能从「研究依据」回到原始资料与数据日期；报告今天 08:50 更新后，09:12 运价越过阈值，已标记待复核。',
    },
    evidence: [
      { group: '对象档案', items: [
        { title: '业务与利润结构', note: '公司季报、年报 · 2026-04-28', anchor: '季报 · 分部经营讨论' },
        { title: '运价传导路径', note: '交易所运价指数 · 每周', anchor: 'SCFI 周度数据' },
      ]},
      { group: '关键事实', items: [
        { title: '一季度归母净利润同比 +24%', note: '公司季报 · F', anchor: '季报 · 主要财务数据' },
        { title: '订单簿占船队 6.9%', note: '行业数据 · 2026-07 · F', anchor: '船队月度统计' },
      ]},
      { group: '关系', items: [
        { title: '所属行业：航运', note: '利润暴露以集运为主', anchor: '双向链接已建立' },
      ]},
      { group: '缺口', items: [
        { title: '长协 / 即期价格结构', note: '待公司披露或调研补证', anchor: '' },
        { title: '明年运力消化', note: '缺最新订单与交付数据', anchor: '' },
      ]},
    ],
    scenario: {
      title: '如果运价回落 20%',
      inputs: [
        { key: 'price', label: '即期运价变化', value: '-20%', unit: '', hint: '默认情景' },
        { key: 'contract', label: '长协价占比', value: '45', unit: '%', hint: '券商调研口径' },
        { key: 'fuel', label: '燃油成本变化', value: '0', unit: '%', hint: '两周 +1%' },
      ],
      result: {
        profit: '正常化归母净利润约回落 14%（长协部分提供缓冲）',
        range: '价值区间下移至 11.0 – 14.0',
        position: '当前价格将落在区间中部附近，安全边际明显收窄',
        verdict: '情景下判断由"明显低估"转为"合理偏低"，健康评估待复核后可能转黄。',
      },
    },
  },

  // ---- 行业对象页：航运 ----
  shipping: {
    name: '航运',
    health: {
      state: 'green',
      headline: '条件总体有利：运价上行、供给纪律仍在',
      completedAt: '今天 08:50（深度分析完成）',
      reasons: [
        { level: 'F', text: '三条船型订单簿占船队均处低位：集运 6.9%、干散 1%、油轮 2.6%（行业数据，2026-07）。' },
        { level: 'F', text: 'SCFI 近四周上行 18%（截至今天）。' },
        { level: 'I', text: '年内供需紧平衡延续；真正的供给考验在明年交付高峰（推断）。' },
      ],
      gaps: ['明年交付高峰的需求侧匹配数据不足'],
      changeConditions: '装载率与运价同步拐头、订单簿快速上升时，评估转向黄。',
    },
    indicators: {
      groups: [
        {
          title: '价格与价差',
          items: [
            { name: 'SCFI 综合指数', value: '2,180 点', trend: 'up', delta: '四周 +18%', asof: '今天', src: '交易所' },
            { name: '欧线运价', value: '高位上行', trend: 'up', delta: '周 +6%', asof: '本周', src: '交易所' },
          ],
        },
        {
          title: '供需与订单',
          items: [
            { name: '订单簿占船队（集运）', value: '6.9%', trend: 'flat', delta: '低位', asof: '2026-07', src: '行业数据' },
            { name: '拆船量', value: '回升', trend: 'up', delta: '老旧船退出加速', asof: '2026-07', src: '行业数据' },
            { name: '欧线装载率', value: '96%', trend: 'up', delta: '高位', asof: '本周', src: '行业数据' },
          ],
        },
      ],
    },
    report: {
      updated: '今天 08:50 · 年报摄取后深复核更新',
      judgement: '健康评估绿。运价上行叠加供给纪律，年内利润中枢上移；明年交付高峰是主要反证。',
      mechanism: '同一场地缘冲击推高三条运价曲线，但集运、干散、油轮握着完全不同的订单簿——不能当作一个周期看。利润弹性来自运价 × 装载率，成本端燃油与租船锁定度决定回落时的缓冲。',
      drivers: [
        { name: '运价（SCFI）', role: '利润的直接驱动，领先财报约一个季度', trend: 'up', delta: '近 4 周上行' },
        { name: '订单簿 / 交付', role: '下一轮供需平衡的决定项', trend: 'down', delta: '年内可控' },
        { name: '拆船与环保规则', role: '供给退出的速度', trend: 'up', delta: '回升' },
      ],
      risks: ['需求端走弱叠加明年交付高峰', '地缘扰动平息后运价均值回归'],
      gaps: ['明年需求侧的订单与库存数据不足'],
      evidenceNote: '行业判断引用的事实可在「研究依据」中回到来源与日期。',
    },
    relatedStocks: [
      { name: '中远海控', code: '601919', state: 'green', note: '集运利润暴露最大' },
      { name: '海丰国际', code: '未加入', state: null, note: '亚洲区域内集运' },
    ],
  },
};
