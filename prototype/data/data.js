/**
 * 数据 Mode · 共享 mock · prototype/data/data.js
 * 数据通道、主动摄取节奏、研究资料、配置与变更记录。全部为演示数据。
 */
window.DATA_MOCK = {
  // ---- 数据通道（业务语言，不出现后台能力名称） ----
  channels: [
    { key: 'disclosure', name: '官方披露', desc: '交易所公告与定期报告',
      status: 'on', lastOk: '今天 08:50', rhythm: '每日增量 · 披露窗口加密' },
    { key: 'finance', name: '财务与量化数据', desc: '财务指标、估值与量价数据',
      status: 'on', lastOk: '今天 15:00', rhythm: '按需读取' },
    { key: 'reports', name: '研究报告', desc: '券商与机构研报',
      status: 'on', lastOk: '今天 07:30', rhythm: '每日增量' },
    { key: 'notes', name: '调研纪要', desc: '公司与行业调研记录',
      status: 'off', lastOk: '', rhythm: '', note: '未配置 · 配置后按每日增量获取' },
    { key: 'news', name: '资讯舆情', desc: '公开新闻与舆情聚合',
      status: 'degraded', lastOk: '昨天 22:10', rhythm: '每日增量',
      note: '部分来源失败 · 其余来源正常' },
    { key: 'industry', name: '行业与产业链数据', desc: '运价、供需、订单、景气指标',
      status: 'on', lastOk: '今天 09:00', rhythm: '按需读取 · 每日快照' },
    { key: 'rumor', name: '市场传闻', desc: '未证实消息，仅作线索',
      status: 'off', lastOk: '', rhythm: '', note: '未配置' },
  ],
  // 披露窗口说明条
  disclosureWindow: {
    text: '披露窗口内会提高定期检查频率，直到报告到位或截止日过去。',
    missing: { obj: '神火股份', period: '2026 年一季报', note: '已超过披露截止日与宽限期仍未取到——如实显示，不生成占位内容。' },
  },

  // ---- 研究资料（仅用户上传） ----
  materials: [
    { key: 'm1', title: '航运深度研报：三条船型三种供给', type: '文件 · PDF',
      source: '某券商研究所', uploaded: '07-28 14:20', published: '2026-07-25',
      objects: ['航运', '中远海控'], status: '已解析', evidence: '12 条证据 · 支撑 2 份当前报告' },
    { key: 'm2', title: '新船订单与交付数据（手工整理）', type: '文件 · 表格',
      source: '用户整理', uploaded: '07-30 10:02', published: '2026-07-30',
      objects: ['航运'], status: '已解析', evidence: '5 条证据' },
    { key: 'm3', title: '某券商调研纪要摘录（长协重签）', type: '粘贴文本',
      source: '粘贴自会议纪要', uploaded: '08-02 21:44', published: '2026-08-02',
      objects: ['中远海控'], status: '已解析', evidence: '3 条证据 · 1 条标记存疑' },
    { key: 'm4', title: '寒武纪产业链梳理（公众号文章）', type: 'URL',
      source: '行业自媒体', uploaded: '08-04 09:15', published: '2026-08-03',
      objects: ['寒武纪', '推理芯片'], status: '解析失败', evidence: '原文排版无法提取，可重试或删除' },
    { key: 'm5', title: '云铝成本拆解笔记', type: '粘贴文本',
      source: '用户笔记', uploaded: '08-05 16:40', published: '2026-08-05',
      objects: ['云铝股份'], status: '待选择对象', evidence: '识别到 2 个候选，等待选择' },
  ],
  // 影响预览（编辑/删除演示）
  impact: {
    action: '删除',
    title: '航运深度研报：三条船型三种供给',
    affected: [
      '影响对象：航运、中远海控',
      '影响证据：12 条（其中 3 条支撑当前报告的关键判断）',
      '影响报告：2 份当前报告将标记「待更新」',
    ],
    keep: ['原始上传文件将从当前树移除', '变更记录会保留，可恢复'],
  },
  // 批量导入歧义演示
  ambiguity: {
    title: '云铝成本拆解笔记',
    candidates: ['云铝股份（电解铝）', '神火股份（电解铝 · 煤电铝）'],
  },

  // ---- 配置 ----
  skills: [
    { name: '财报解读', scope: '通用 · 全部对象', on: true, desc: '从利润变量反向阅读财报，量化与验证候选变量' },
    { name: '利润拆分', scope: '通用 · 全部对象', on: true, desc: '收入、成本、利润与现金流的通用拆分框架' },
    { name: '估值与情景', scope: '通用 · 全部对象', on: true, desc: '按业务与行业特征选择估值方法，形成价值区间' },
    { name: '持续跟踪', scope: '通用 · 全部对象', on: true, desc: '先行指标、阈值与证伪条件的维护' },
    { name: '研究档案维护', scope: '通用 · 全部对象', on: true, desc: '档案、事实、关系与缺口的整理规则' },
  ],
  freshness: [
    { name: '行情与估值', window: '实时 · 按需' },
    { name: '公告与新闻', window: '24 小时内为新鲜' },
    { name: '定期报告', window: '本期报告期内有效' },
    { name: '行业先行指标', window: '按指标各自频率（周 / 月）' },
  ],
  // 变更记录（业务时间线）
  changes: [
    { when: '今天 09:40', action: '删除研究档案', obj: '某测试对象', scope: '研究状态、报告、依据与关注状态', restore: true },
    { when: '昨天 18:02', action: '删除研究资料', obj: '旧版运价数据表', scope: '资料与 4 条证据（已重算）', restore: true },
    { when: '昨天 08:00', action: '例行检查完成', obj: '神火股份', scope: '查过了，没变', restore: false },
    { when: '08-04 15:22', action: '修改时效规则', obj: '公告与新闻', scope: '新鲜窗口 12h → 24h', restore: true },
    { when: '08-02 11:10', action: '导入研究 Skill', obj: '周期利润正常化', scope: '适用范围：周期行业', restore: false },
  ],
};
