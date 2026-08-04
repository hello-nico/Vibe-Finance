/**
 * 行情 Mode · 共享 mock · prototype/market/data.js
 * 动态数据源；页面只负责固定布局挂载。
 * 来源：Vibe-Research sectors.json / Intel.tsx / newsradar
 */
window.MKT_DATA = {
  // nodes：产业链环节名（对齐 Research sectors.json）；verified=false 时为空，待核实补全
  sectors: [
    { key: 'humanoid', label: '人形机器人', tagline: '从减速器到灵巧手，AI 具身智能的物理载体', hot: true, verified: true, nodes: ['谐波减速器', '行星滚柱丝杠', '无框力矩电机', '灵巧手', '六维力传感器', '具身大模型'] },
    { key: 'ai-computing', label: 'AI 算力', tagline: '算力基建的产业链——芯片、光互连、封装、散热', hot: true, verified: true, nodes: ['AI芯片', '光模块', 'CPO光互连', 'HBM存储', '先进封装', 'PCB', '液冷散热'] },
    { key: 'hbm', label: 'HBM', tagline: '高带宽存储——AI 芯片的内存瓶颈', hot: true, verified: false, nodes: [] },
    { key: 'cpo', label: '光互联', tagline: '光电共封装（CPO）——突破铜互连的带宽墙', hot: true, verified: false, nodes: [] },
    { key: 'semiconductor', label: '半导体国产替代', tagline: '设备、材料、EDA、制造的自主链条', hot: true, verified: false, nodes: [] },
    { key: 'solid-state-battery', label: '固态电池', tagline: '下一代电池的材料与工艺路线', hot: true, verified: false, nodes: [] },
    { key: 'low-altitude', label: '低空经济', tagline: 'eVTOL、空管、基建与运营', hot: true, verified: false, nodes: [] },
    { key: 'smart-driving', label: '智能驾驶', tagline: '感知、算力、线控与整车', hot: true, verified: false, nodes: [] },
    { key: 'innovative-drug', label: '创新药', tagline: '靶点、临床、CXO 与出海', hot: true, verified: false, nodes: [] },
    { key: 'power-grid', label: '电网与特高压', tagline: '输配电设备与新型电力系统', hot: false, verified: false, nodes: [] },
    { key: 'defense', label: '军工', tagline: '航空、航天、船舶与信息化', hot: false, verified: false, nodes: [] },
    { key: 'fusion', label: '可控核聚变', tagline: '磁约束、超导与第一壁材料', hot: true, verified: false, nodes: [] },
    { key: 'business-space', label: '商业航天', tagline: '火箭、卫星制造与卫星互联网', hot: true, verified: false, nodes: [] },
    { key: 'ai-pharma', label: '生物医药', tagline: '创新药、AI 制药与生物技术', hot: true, verified: false, nodes: [] },
    { key: 'resources', label: '资源卡口', tagline: '稀土、锗、铟等被卡的关键资源', hot: false, verified: false, nodes: [] },
    { key: 'ai-application', label: 'AI 应用', tagline: '大模型落地的应用与 Agent', hot: true, verified: false, nodes: [] },
    { key: 'ai-hardware', label: 'AI 硬件', tagline: '端侧、AI 眼镜与消费终端', hot: true, verified: false, nodes: [] },
    { key: 'energy-storage', label: '储能', tagline: '电化学储能与电网侧调峰', hot: false, verified: false, nodes: [] },
    { key: 'data-element', label: '数据要素', tagline: '数据确权、交易与流通基建', hot: false, verified: false, nodes: [] },
  ],

  // 板块中心左栏的快捷入口：这是独立的导航组件，不从完整网格按顺序截取。
  // icon 使用 Lucide 同名图标，和 Research 的热门板块导航保持同一套语义映射。
  sectorShortcuts: [
    { key: 'humanoid', icon: 'cog' },
    { key: 'ai-computing', icon: 'cpu' },
    { key: 'hbm', icon: 'database' },
    { key: 'cpo', icon: 'cable' },
    { key: 'business-space', icon: 'rocket' },
    { key: 'ai-pharma', icon: 'flask-conical' },
  ],

  // 资讯导航与内容 Tab 共用这一份配置，避免二级栏和主区各写一套名称 / 口径。
  intelTabs: [
    { key: 'filings', label: 'A股公告', navSummary: '关注标的 · 公告', ico: 'filings', badge: null, desc: '汇总关注列表里各个股的近期公告' },
    { key: 'news', label: '公开新闻', navSummary: '关注标的 · 新闻', ico: 'news', badge: null, desc: '汇总关注列表里各个股的近期新闻' },
    { key: 'investment-news', label: 'Investment News', navSummary: '赛道资讯 · RSS', ico: 'rss', badge: '集成', desc: '12 赛道全球公开 RSS' },
  ],

  // Investment News · 12 赛道
  tracks: [
    { id: 'llm', name: 'AI / 大模型', n: 70, accent: '#F35D2B' },
    { id: 'chip', name: '半导体 / 芯片', n: 43, accent: '#3B82F6' },
    { id: 'robot', name: '机器人 / 自动化', n: 22, accent: '#8B5CF6' },
    { id: 'auto', name: '汽车 / 新能源车', n: 28, accent: '#10B981' },
    { id: 'energy', name: '能源 / 新能源', n: 42, accent: '#F59E0B' },
    { id: 'bio', name: '生物医药 / 健康', n: 28, accent: '#EC4899' },
    { id: 'space', name: '航天 / 太空', n: 31, accent: '#6366F1' },
    { id: 'netsec', name: '网络安全', n: 25, accent: '#EF4444' },
    { id: 'web', name: '科技 / 互联网', n: 86, accent: '#14B8A6' },
    { id: 'elec', name: '消费电子 / 数码', n: 42, accent: '#A855F7' },
    { id: 'macro', name: '财经 / 宏观', n: 67, accent: '#64748B' },
    { id: 'sci', name: '科学 / 前沿', n: 42, accent: '#0EA5E9' },
  ],
  radarMeta: {
    total_sources: 108,
    recent_days: 7,
    generated_at: '2026-08-03 11:30',
  },
  newsDemo: {
    llm: [
      ['08-03 08:49', 'MarkTech', 'Ontology 发布神经符号搜索模型，电商检索精度提升 2.7×'],
      ['08-03 05:19', 'MarkTech', 'GeoAI Tutorial：足迹提取与分割模型'],
      ['08-03 04:54', 'TechCrunch', 'Sam Altman and AI’s decel debate'],
      ['08-03 03:40', 'The Verge AI', 'Fender CEO on “analog AI”'],
      ['08-02 13:00', '机器之心', '100M 参数内小模型能力声索'],
      ['08-02 13:00', '机器之心', '从 TPU 到自我进化的 Agent'],
    ],
    chip: [
      ['08-03 10:55', 'DIGITIMES', 'Taiwan manufacturing business climate improves amid AI demand'],
      ['08-03 09:12', '财联社', '半导体设备订单回暖，国产替代加速'],
      ['08-03 08:01', 'SemiWiki', 'OpenAI reportedly expands probe into chip supply'],
      ['08-03 07:40', 'SEMI', 'Wafer fab equipment spending outlook'],
    ],
  },

  // A股公告 / 公开新闻 · 关注列表聚合（对齐 Research WatchlistFeed）
  watchlist: [{ code: '600519', name: '贵州茅台' }],
  filings: [
    { when: '2026-08-03', name: '贵州茅台', type: '交易提示', title: '8只个股大宗交易超5000万元' },
    { when: '2026-08-02', name: '贵州茅台', type: '权益分派', title: '2025年年度权益分派实施公告' },
    { when: '2026-07-28', name: '贵州茅台', type: '定期报告', title: '2026年半年度业绩预告' },
    { when: '2026-07-15', name: '贵州茅台', type: '股东大会', title: '2025年年度股东大会决议公告' },
    { when: '2026-07-08', name: '贵州茅台', type: '其他', title: '关于控股股东增持计划进展的公告' },
  ],
  publicNews: [
    { when: '08-03 18:43', name: '贵州茅台', title: '8只个股大宗交易超5000万元' },
    { when: '08-03 15:20', name: '贵州茅台', title: '白酒板块分化，茅台成交额居前' },
    { when: '08-02 21:10', name: '贵州茅台', title: '机构关注批价与直营占比变化' },
    { when: '08-02 09:12', name: '贵州茅台', title: '上半年预计归母净利同比增长约15%' },
    { when: '08-01 16:05', name: '贵州茅台', title: '旺季动销有望环比改善，渠道库存平稳' },
  ],
};
