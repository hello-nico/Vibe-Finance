/* ============================================================================
 * js/data.js — inference-silicon-cn 全站数据唯一来源（Agent C）
 * 纯 Vanilla JS，无构建。最先加载（vendor 之后、utils/charts 之前）。
 * 幂等：本文件只做字面量赋值，不注册任何监听；重复执行安全（同值覆盖）。
 *
 * 导出全局对象：
 *   window.K               K1–K41 数据注册表（{id,label,value,unit,asOf,source,note}，K27 保留）
 *   window.WINDOWS         6 个历史窗口 [{id,from,to,name,nameCn}]，id 与 DASH_STATES 的 e2..e7 对齐
 *   window.TIMELINE_EVENTS 13 个事件 [{year,yearLabel,label,window,drill:{title,body,source,date}}]
 *   window.SECTION_TO_DASH 19 section → 16 dashboard 状态映射（严格按 SPEC §5）
 *   window.DASH_STATES     16 状态 {badge,title,stage,center:[lon,lat],nodes:[{name,lon,lat,note}],
 *                          mini:{title,unit,series:[[x,y],…],note},metrics:[{v,l}×4],
 *                          cohort:{focus:[公司名…],note}}（cohort 与 window.COHORT 按 name 关联）
 *   window.COHORT          14 家公司样本 [{name,status,founded,exitYear,note}]
 *                          status ∈ independent | acquired | asset-sale | license | ipo
 *                          （6 并购 · 1 资产出售 · 1 许可 · 1 IPO · 5 独立 · 0 解散；Wave 途中经过 Chapter 11）
 *   window.CHART_DATA      26 个 data-chart key 各一份数据（schema 见下方逐 key 说明）
 *
 * 通用约定：
 *   - 缺失数据一律字符串「未披露」或 null（null 仅供图表留空位），绝不插值。
 *   - series 为 [[x, y], …]；x 可为年份数字或中文/标签字符串，y 为数字或 null（=未披露）。
 *   - 「约数」= 公司披露/券商研究取整，note 中标注；情景乘法只用美元口径（K8）。
 *   - 数据日期：研究截止 2026-07-18（point-in-time register）。
 *
 * CHART_DATA 逐 key schema（图表 agent 按 key 读取 window.CHART_DATA[key]）：
 * ----------------------------------------------------------------------------
 * timeline42    {from,to,axis:[刻度年…],windows:[{id,from,to,label,sub}],
 *                events:[{year,yearLabel,label,window,drill}]}   // events 复用 TIMELINE_EVENTS
 * mechanism     {stages:[{id,label,amp,desc}],annotations:[{at,text}],
 *                loop:{from,to,text},note}                        // 五阶段波形，amp=振幅
 * clearing      {unit,rows:[{name,founded,exitYear,status,note}],legend,note}
 * conflow       {nodes:[{id,label}],flows:[{from,to,weight,label}],
 *                eras:[{era,primary,note}],note}                  // 约束迁移流图（权重为相对强度）
 * submarine     {unit,events:[{year,label,depth,visible,note}],
 *                hidden:{from,to,label},kpi,note}                 // depth>0 水下(未披露) 0 水面
 * tpu           {unit,gens:[{gen,deploy,disclose,note}],note}     // 部署/披露错位
 * mining        {unit,fyLabel,series:[[财年,US$B]],shocks:[{fy,label}],
 *                events:[{year,label}],note}                      // NVIDIA 游戏分部（财年）
 * sawtooth-alchip / sawtooth-guc
 *               {unit,series:[[年,NT$B 或 null]],crypto:[{year,label}],note}  // 锯齿收入+crypto占比
 * capex3d       {unit,periods[6],companies:[{name,caliber,capex[6],ocf[6]}],
 *                refPath:{label,vals[7],note},total2025,band2026:{lo,hi,sum},
 *                ratioMid2027MSFT,source,note}                    // Top-4 capex×OCF 双柱比率
 * capex-stairs  {unit,years[4],ocf[4],capexLo[4],capexHi[4],estFrom,source,note}
 *                                                              // 字段为 null 时图表回退内置约数
 * penetration   {unit,calibers:[{key,label,value,lo,hi,note}],warning}
 * stamps        {cards:[{name,vendor,year,face,gen,role,
 *                specs:[{label,value}],asOf,source,note,drill}],note}
 * revenue-split {unitA,unitPanel:{tpu:[{label,v}],gpu:{label,lo,hi,note}},
 *                unitB,dollarPanel:[{label,v,note}],conclusion,note}
 * pergw         {rackKW,gpusPerRack,racksPerGW,unitsPerGW,band,lo,hi,cost,steps:[{label,v}],note}
 * gates         {gates:[{rank,gate,tightness,note}],note}          // tightness 1–5 相对强度
 * cowos         {unit,capacity:[{year,lo,hi}],demand,share:[{label,v}],note}
 * hbm           {unit,series:[[年,%]],gap,pricing,parity,note}     // 两点不插值
 * hbmgen        {gens:[{gen,year,status,note}],note}
 * partition     {unit,twh:[[年,TWh]],rack:{name,kw},metronomes:{deploy,order},note}
 * assume-a2 / assume-a3
 *               {assumption,verdict,verdictClass,evidence:[{side,items:[…]}],note}
 * matrix        {phases:[…],rows:[{window,cells:[1|0|null…],note}],
 *                rejected:[{window,reason}],note}                  // null=未确认
 * verdict-tree  {root,branches:[{name,range,lo,hi,mid,cls,desc}],killSwitch:{threshold,desc},unit,note}
 * scenario-chain{chains:[{trigger,steps:[…],result,cls}],note}
 * signals       {cols:[列名…],rows:[{id,name,metric,threshold,freq,status}],asOf,note}
 * invest        {companies:[{name,gate,facts:[…],risks:[…],disclaimer}],note}
 * ============================================================================ */
(function () {
  'use strict';

  var AS_OF = '2026-07-18';
  var UPDATED = '2026-07-18';

  /* ------------------------- K1–K41 数据注册表 ------------------------- */
  window.K = {
    K1:  { id: 'K1', label: 'Base case', value: '≈2.5x（区间 2.0–4.7x）', unit: '倍 · 美元口径 · 2025→2028E', asOf: AS_OF, source: '研究综合', note: '情景乘法只使用美元口径；3.0–4.3x 旧链已作废（do not cite）；失效阈值见 K4' },
    K2:  { id: 'K2', label: 'Conservative case', value: '≈2.0x（band 1.9–2.1x）', unit: '倍 · 美元口径 · 2025→2028E', asOf: AS_OF, source: '研究综合', note: 'TAM 路径达成、份额停留在 2026F 读数（≈16%）' },
    K3:  { id: 'K3', label: 'Contraction case', value: '−15% ~ −35%', unit: '美元口径 · 三年', asOf: AS_OF, source: '研究综合', note: 'kill switch 触发后进入本情景' },
    K4:  { id: 'K4', label: 'Kill switch', value: '+14%', unit: 'Top-4 2027 capex 增速阈值', asOf: AS_OF, source: '研究综合', note: 'Top-4 2027 capex 增速低于 +14% → Base/Conservative 失效；阈值刻意低于 K30 全部券商测算' },
    K5:  { id: 'K5', label: 'Top-4 capex', value: 412.9, unit: 'US$B · 2025 · 编制估计', asOf: AS_OF, source: '公司披露（研究综合加总）', note: 'Amazon / Microsoft / Google / Meta；2025 为编制估计（compiled estimate，区间 ≈410–413）；2026 指引 695–725 US$B（公司指引口径：Amazon ≈200 / MSFT ≈190 日历年 / Alphabet 180–190 / Meta 125–145）' },
    K6:  { id: 'K6', label: 'Unit penetration', value: '≈30%（2024）→ ≈50%（2027F 主张）', unit: '% · 单位口径 · 券商口径', asOf: AS_OF, source: '券商研究', note: '定制 ASIC 单位份额；TrendForce 27.8% 为 2026 AI 服务器口径（2025 为 20.9%），分母不同，不贴 2027；不与 CoWoS/美元口径混用' },
    K7:  { id: 'K7', label: 'CoWoS allocation', value: '≈30%（2026E）→ ≈34%（2027F）', unit: '% · CoWoS 分配口径', asOf: AS_OF, source: '券商研究', note: '±10–20% 误差带；不与单位/美元口径混用' },
    K8:  { id: 'K8', label: 'Dollar penetration', value: '≈20%', unit: '% · 美元口径 · 2027F', asOf: AS_OF, source: '券商研究', note: 'Series A 序列 8/12/16/20%（2024→2027F）；情景计算唯一使用口径' },
    K9:  { id: 'K9', label: 'Custom ASIC TAM', value: '60–90', unit: 'US$B · 2027E SAM', asOf: '2024-12-12', source: '公司披露（Broadcom）', note: 'Hock Tan 原话「$60–90B in fiscal 2027」；仅限既有客户群口径，不外推全行业；2026-06 合格客户已增至 6 家（K23）' },
    K10: { id: 'K10', label: 'NVIDIA data-center revenue', value: '≈17.6x', unit: '12 个季度间隔 · 13 个季度观测值 · 美元口径', asOf: AS_OF, source: '公司披露（研究综合计算）', note: '端点 $4.28B（Q1 FY2024，截至 2023-04）→ $75.2B（Q1 FY2027，截至 2026-04）= 17.6×；季度序列随附（自然季度标签，约数；25Q3/25Q4 未列单点，不插值）',
           series: [['23Q1', 4.28], ['23Q2', 10.32], ['23Q3', 14.51], ['23Q4', 18.40], ['24Q1', 22.56], ['24Q2', 26.30], ['24Q3', 30.77], ['24Q4', 35.58], ['25Q1', 39.11], ['25Q2', 41.10], ['25Q3', null], ['25Q4', null], ['26Q1', 75.2]] },
    K11: { id: 'K11', label: 'CoWoS demand', value: '需求 ≈2× 装机产能（至 2025）；售罄至 2026', unit: '—', asOf: AS_OF, source: '供应链核查（券商）+ 公司口径（TSMC AGM 2026-06）', note: '2× 为供应链估计；「售罄至 2026」为 C.C. Wei 在 2026-06 AGM 的公司表述' },
    K12: { id: 'K12', label: 'CoWoS capacity', value: '约 7–8（2025 末）→ 12–13（2026 末目标）', unit: '万片/月 · 第三方估计', asOf: AS_OF, source: '券商研究', note: '第三方估计（TSMC 不指引 kwpm）；±10–20% 误差带' },
    K13: { id: 'K13', label: 'HBM revenue share', value: '8%（2023）→ 41%（2027F）', unit: '占 DRAM 收入 · 2026E 为 33% · 估计框架', asOf: AS_OF, source: '券商研究', note: '位元占比远低于收入占比（K16）；中间年份不插值' },
    K14: { id: 'K14', label: 'HBM gap', value: '2026 供应售罄（SK hynix）', unit: '—', asOf: AS_OF, source: '公司披露（SK hynix）+ 供应链核查', note: '客户需求超其三年产能路线图；「售罄」与「超三年产能」为公司表述' },
    K15: { id: 'K15', label: 'HBM pricing', value: '≈5–6×（每 bit 相对常规 DRAM）', unit: '倍 · 券商估计', asOf: AS_OF, source: '券商研究', note: '年度合约重签机制；方向：HBM4 溢价' },
    K16: { id: 'K16', label: 'HBM parity', value: '3 家供应', unit: 'SK hynix / Samsung / Micron', asOf: AS_OF, source: '研究综合', note: 'HBM4 起 base die 转向逻辑代工；未见单一垄断；HBM 位元占 DRAM 比远低于其收入占比（K13）' },
    K17: { id: 'K17', label: '2001 bust', value: '行业 −32% · FPGA 双寡头 ≈−39%', unit: 'YoY · 2001 · 美元口径', asOf: '2002-03-31', source: 'WSTS / 公司披露（研究综合）', note: '产能到达滞后 9–12 个月，放大冲击' },
    K18: { id: 'K18', label: 'Equipment sales', value: '未披露单点', unit: '—', asOf: '2002-03-31', source: '行业与官方（SEMI，口径分歧）', note: '2001 年设备销售降幅大于器件；口径分歧不列单点' },
    K19: { id: 'K19', label: 'TPU crossover requirement', value: '8.0–8.4', unit: '百万颗 · 2027E · 50% 单位份额所需量', asOf: AS_OF, source: '券商研究', note: '交叉线 = 达成 50% 单位份额所需颗数，非 K31 区间中值（中值 10.75M）；并列展示，不强行统一' },
    K20: { id: 'K20', label: 'Trainium 2', value: '12 个月 140 万颗 · 环比 ≈10×', unit: '颗 · re:Invent 2024', asOf: '2024-12-03', source: '公司披露（AWS re:Invent 2024）', note: '公司口径；支撑 Anthropic Project Rainier' },
    K21: { id: 'K21', label: 'TSMC revenue/GW', value: '≈2.1', unit: 'US$B/GW · 派生值', asOf: AS_OF, source: '研究综合', note: '公式：≈$3.5k（逻辑 + CoWoS + 中介层）/ 颗 × ≈60 万颗 / GW ≈ $2.1B；数量级派生，对颗数与价格假设敏感' },
    K22: { id: 'K22', label: 'Cost/token', value: '≈10×/年 下降', unit: '前沿推理价格 · 数量级口径', asOf: AS_OF, source: '公开推理定价页汇编', note: 'mix-shift 与代际效应主导；非逐季审计值' },
    K23: { id: 'K23', label: 'Broadcom backlog/customers', value: '6 家合格客户 + 2 家爬坡；AI backlog ≈$73B+', unit: '客户数 · FY26 AI ≈$56B · FY27 AI >$100B', asOf: '2026-06-03', source: '公司披露（Broadcom Q2 FY26）', note: '客户：Google、Meta、ByteDance、OpenAI、Anthropic、Fujitsu；2025-09 的「3+1 / >US$10B」口径已过期（STALE），不用' },
    K24: { id: 'K24', label: 'Broadcom share', value: '≈70%', unit: '定制 AI ASIC 设计份额 · 研究口径', asOf: AS_OF, source: '研究综合', note: '±10%；指设计市场份额，与客户收入占比无关' },
    K25: { id: 'K25', label: 'Marvell custom silicon', value: '未披露（未单列）', unit: '—', asOf: AS_OF, source: '公司披露', note: '数据中心分部收入序列见 DASH_STATES.frame.mini' },
    K26: { id: 'K26', label: 'Electricity', value: '415 → 945', unit: 'TWh · 2024 → 2030E', asOf: AS_OF, source: '行业与官方（IEA）', note: '全球数据中心用电；另：GB200 NVL72 机柜 ≈120kW' },
    K27: { id: 'K27', label: 'Reserved', note: '保留，不得重定义' },
    K28: { id: 'K28', label: 'TPU v8（8t/8i）', value: '2026-04-22 发布（Cloud Next）', unit: '≈9 PFLOPS FP4（估计）· 2026 晚些 GA', asOf: '2026-04-22', source: '公司披露（Google Cloud Next）', note: '发布与 GA 窗口为公司口径；≈9 PFLOPS FP4 为估计（精度口径最宽）；替换原 12.6 PFLOPS 口径' },
    K29: { id: 'K29', label: 'Capex/OCF', value: '0.45–0.56（2021–24）→ 0.80（2025）→ 1.21（2026E 中点）', unit: '倍 · 2026E 区间 1.18–1.24', asOf: AS_OF, source: '研究综合', note: '核心压力指标；OCF 2026E ≈$587B 为 working estimate（无公开一致预期）；>1.0 = 合计 capex 超合计经营现金流' },
    K30: { id: 'K30', label: '2027 capex estimates', value: '$520B / $568B / $591B', unit: 'US$B · 2027E · 三家券商测算', asOf: AS_OF, source: '券商研究', note: '均在 +14% 之上；kill switch 阈值（K4）刻意低于全部第三方测算' },
    K31: { id: 'K31', label: 'TPU range', value: '6.5–15', unit: '百万颗 · 2026 年已发表估计（区间 2025→2027F）', asOf: AS_OF, source: '券商研究', note: '并列展示，不强行统一；区间中值 10.75M；交叉线（K19）为 50% 单位份额所需量' },
    K32: { id: 'K32', label: 'Anthropic TPU GW', value: '≈100 万颗 · >1 GW（2026）', unit: '—', asOf: '2025-10-23', source: '公司披露（Anthropic × Google）', note: '多年期扩展协议；2026 年上线容量 >1 GW' },
    K33: { id: 'K33', label: 'Value crossover', value: '未交叉', unit: '美元口径 · 2027F ≈20%（Series A）', asOf: AS_OF, source: '研究综合', note: '单位口径可能交叉（K19）；美元口径 GPU 仍占优（K8）' },
    K34: { id: 'K34', label: 'External arbiters', value: 'TPU 数量收敛 + 云厂披露', unit: '—', asOf: AS_OF, source: '研究综合', note: '交叉点是否成立由 2026–2027 披露裁决' },
    K35: { id: 'K35', label: 'Unadjudicable verdict', value: '无法判定', unit: '—', asOf: AS_OF, source: '研究综合', note: 'A2：2027 年 ASIC 单位出货超 GPU；证据并列，见 assume-a2' },
    K36: { id: 'K36', label: 'NVIDIA crypto hits', value: '2 次（2019 · 2022）', unit: '库存冲击', asOf: AS_OF, source: '公司披露（研究综合）', note: 'crypto hangover；Q4 FY19 游戏分部单季 −45% YoY；游戏分部序列见 CHART_DATA.mining' },
    K37: { id: 'K37', label: 'Alchip sawtooth', value: '锯齿形收入', unit: '挖矿占比峰值 30–40%', asOf: AS_OF, source: '公司披露（约数取整）', note: '年收入 2017 NT$6.9B → 2018 NT$5.24B → 2019 NT$3.87B（锯齿）；2023 起 AI 占比 ≈70%；序列见 CHART_DATA["sawtooth-alchip"]' },
    K38: { id: 'K38', label: 'GUC crypto mix', value: '挖矿 NRE 占比峰值 ≈20%（2018）', unit: '—', asOf: AS_OF, source: '公司披露（约数取整）', note: '年收入 ≈NT$11.6B（2017）→ ≈NT$24.9B（2024）；序列见 CHART_DATA["sawtooth-guc"]' },
    K39: { id: 'K39', label: 'NVLink Fusion', value: '2025-05 发布', unit: '—', asOf: '2025-05-19', source: '公司披露（NVIDIA · Computex）', note: '向第三方 XPU/CPU 开放 NVLink 生态；平台化对冲 ASIC 份额叙事' },
    K40: { id: 'K40', label: 'No confirmed NVIDIA-designed custom die', value: '确认：无', unit: '—', asOf: UPDATED, source: '研究综合', note: '截至 2026-07-18 无确认的 NVIDIA 设计定制 die' },
    K41: { id: 'K41', label: 'NVIDIA-inside ASIC path', value: '许可 / 平台路径', unit: '—', asOf: UPDATED, source: '研究综合', note: 'NVLink Fusion（2025-05-19）+ Groq 非独占许可（2025-12-24，≈US$20B，CNBC 报道未获确认，不进入情景计算）' }
  };
})();

(function () {
  'use strict';

  /* ------------------------- 六个历史窗口 ------------------------- */
  window.WINDOWS = [
    { id: 'e2', from: 1985, to: 1995, name: 'Window 1 · 1985–1995', nameCn: '窗口一 · FPGA 创立期' },
    { id: 'e3', from: 1995, to: 2003, name: 'Window 2 · 1995–2003', nameCn: '窗口二 · 繁荣与崩塌' },
    { id: 'e4', from: 2004, to: 2012, name: 'Window 3 · 2004–2012', nameCn: '窗口三 · 安静的十年' },
    { id: 'e5', from: 2013, to: 2018, name: 'Window 4 · 2013–2018', nameCn: '窗口四 · 点火' },
    { id: 'e6', from: 2019, to: 2022, name: 'Window 5 · 2019–2022', nameCn: '窗口五 · 短缺与并购超级周期' },
    { id: 'e7', from: 2023, to: 2026, name: 'Window 6 · 2023–2026', nameCn: '窗口六 · 当前周期' }
  ];

  /* ------------------------- 13 个时间线事件 ------------------------- */
  window.TIMELINE_EVENTS = [
    { year: 1984, yearLabel: '1983–84', label: 'Xilinx 与 Altera 成立', window: 'e2',
      drill: { title: '1983–84 · Xilinx 与 Altera 成立',
        body: 'Altera 于 1983 年、Xilinx 于 1984 年相继在硅谷成立，开创可编程逻辑（PLD/FPGA）品类。它们以「更好的 ASIC」为定位，从低端市场切入定制芯片的漫长竞争。随后的 fabless 模式与 TSMC 的代工模式相互成就，重塑了整个行业。',
        source: '公司史料（研究综合）', date: '1984-12-31' } },
    { year: 1994, yearLabel: '1994', label: 'Xilinx 获得 PLD 领先', window: 'e2',
      drill: { title: '1994 · Xilinx 获得 PLD 领先',
        body: '1994 年前后，Xilinx 在 PLD 市场取得领先份额，FPGA 从利基器件走向主流设计选项。「更好的 ASIC」这一定位本身成为战略：不与 ASIC 正面拼成本，而是吃掉 ASIC 够不着的灵活性需求。',
        source: '行业史料（研究综合）', date: '1994-12-31' } },
    { year: 2000, yearLabel: '2000', label: '电信泡沫见顶', window: 'e3',
      drill: { title: '2000 · 电信泡沫见顶',
        body: '2000 年，光通信与网络设备需求见顶，通信类客户在 FPGA 需求中高度集中。短缺期的恐慌性重复下单与不可取消订单，为随后的崩塌埋下伏笔。',
        source: '行业与官方（研究综合）', date: '2000-12-31' } },
    { year: 2001, yearLabel: '2001', label: '行业 −32%，双寡头约 −39%', window: 'e3',
      drill: { title: '2001 · 行业 −32%，双寡头约 −39%',
        body: '2001 年半导体行业收入下滑约 32%（WSTS 口径），FPGA 双寡头 Xilinx 与 Altera 各下滑约 39%。产能到达滞后需求 9–12 个月，冲击被进一步放大。同一次冲击，在不同公司身上留下四种不同伤痕。',
        source: 'WSTS / 公司披露（研究综合）', date: '2001-12-31' } },
    { year: 2003, yearLabel: '2003', label: '1200 万门级 FPGA', window: 'e3',
      drill: { title: '2003 · 1200 万门级 FPGA',
        body: '2003 年前后，FPGA 迈入 1,200 万门级。制程与架构的持续进步，使其进入越来越多原本属于 ASIC 的腹地市场，也为下一个十年的云端加速实验奠定硬件基础。',
        source: '公司披露（研究综合）', date: '2003-12-31' } },
    { year: 2012, yearLabel: '2012', label: 'Microsoft 部署 1,632 台 FPGA 服务器', window: 'e4',
      drill: { title: '2012 · Microsoft Catapult 部署 1,632 台 FPGA 服务器',
        body: '2012 年底，Microsoft 在 Catapult 项目中部署 1,632 台 FPGA 服务器，用于 Bing 搜索排序加速。该部署直到 2014 年 ISCA 论文才公开——先部署，后披露，成为云厂自研加速的范式。',
        source: '公司披露（Microsoft Catapult，ISCA 2014）', date: '2014-06-14' } },
    { year: 2015, yearLabel: '2015', label: 'Google 部署 TPU v1', window: 'e5',
      drill: { title: '2015 · Google 部署 TPU v1',
        body: 'Google 早在 2015 年就在数据中心部署 TPU v1，2016 年对外公开，2017 年发表 ISCA 论文。部署先于披露的传统由此延续：当外界看到论文时，芯片往往已在机房运行多年。',
        source: '公司披露（Google，ISCA 2017）', date: '2017-06-24' } },
    { year: 2016, yearLabel: '2016', label: 'Intel 通过收购进入 AI', window: 'e5',
      drill: { title: '2016 · Intel 通过收购进入 AI',
        body: 'Intel 以 167 亿美元完成对 Altera 的收购（2015 年 12 月），随后 2016 年收购 Nervana、2019 年收购 Habana，试图用支票进入 AI 加速。自研与并购是两种答案，同一场考试。',
        source: '公司披露（Intel，2015-12-28 / 2016-08-09）', date: '2016-08-09' } },
    { year: 2020, yearLabel: '2020', label: 'AMD 以 350 亿美元竞购 Xilinx', window: 'e6',
      drill: { title: '2020 · AMD 以 350 亿美元竞购 Xilinx',
        body: '2020 年 7–10 月的 108 天内出现五笔大型半导体交易：ADI–Maxim、NVIDIA–Arm、SK hynix–Intel NAND、AMD–Xilinx、Marvell–Inphi。AMD 于 10 月 27 日宣布以约 350 亿美元全股票收购 Xilinx（2020-10 报价），2022 年 2 月以约 490 亿美元完成交割。',
        source: '公司披露（AMD / Xilinx，2020-10-27）', date: '2020-10-27' } },
    { year: 2022.77, yearLabel: '2022-10-07', label: '周期高点遇到出口管制与关键披露', window: 'e6',
      drill: { title: '2022-10-07 · 周期高点遇到出口管制与关键披露',
        body: '2022 年 10 月 7 日，美国出台对华先进计算出口管制，周期高点与政策拐点重叠。此后，两轮库存冲击与出口管制共同改写了定制芯片的需求结构。',
        source: '行业与官方（BIS，2022-10-07）', date: '2022-10-07' } },
    { year: 2023, yearLabel: '2023', label: '生成式 AI 点火', window: 'e7',
      drill: { title: '2023 · 生成式 AI 点火',
        body: 'ChatGPT 之后，生成式 AI 的训练与推理需求点火，NVIDIA 数据中心收入自 $4.28B（Q1 FY2024）增至 $75.2B（Q1 FY2027）——12 个季度间隔、13 个季度观测值，约 17.6 倍。云厂资本开支进入扩张通道，新一轮周期正式启动。',
        source: '研究综合', date: '2023-03-31' } },
    { year: 2025, yearLabel: '2025', label: 'NVLink Fusion 打开平台', window: 'e7',
      drill: { title: '2025 · NVLink Fusion 打开平台',
        body: '2025 年 5 月，NVIDIA 发布 NVLink Fusion，向第三方 XPU/CPU 开放 NVLink 互连生态。这是对 ASIC 份额叙事的平台化回应：如果不能击败定制芯片，就让定制芯片长在 NVIDIA 的互连上。',
        source: '公司披露（NVIDIA，2025-05-19）', date: '2025-05-19' } },
    { year: 2026, yearLabel: '2026', label: '扩张已确认，峰值仍未确认', window: 'e7',
      drill: { title: '2026 · 扩张已确认，峰值仍未确认',
        body: 'Top-4 云厂 2025 年 capex 约 4,100–4,130 亿美元（编制估计），2026 年指引 6,950–7,250 亿美元。扩张已被确认；峰值是否出现，交由八个证伪触发器持续跟踪（point-in-time register）。',
        source: '公司披露 / 研究综合', date: '2026-07-18' } }
  ];

  /* ------------------------- section → dashboard 映射（SPEC §5 照抄） ------------------------- */
  window.SECTION_TO_DASH = {
    'sec-frame': 'frame',
    'sec-grave': 'clearing',
    'sec-w2': 'e2',
    'sec-w3': 'e3',
    'sec-w4': 'e4',
    'sec-w5': 'e5',
    'sec-w6': 'e6',
    'sec-mining': 'e6',
    'sec-w7': 'e7',
    'sec-now': 'now',
    'sec-crossover': 'now',
    'sec-mismatch': 'mismatch',
    'sec-bottleneck': 'gates',
    'sec-partition': 'grid',
    'sec-assumptions': 'assumptions',
    'sec-analog': 'analog',
    'sec-verdict': 'verdict',
    'sec-signals': 'signals',
    'sec-invest': 'invest'
  };

  /* ------------------------- 14 家公司样本 ------------------------- */
  window.COHORT = [
    { name: 'Xilinx',         status: 'acquired',    founded: 1984, exitYear: 2022, note: 'FPGA 发明者；AMD 收购：2020-10 报价 $35B，2022-02 交割 ≈$49B' },
    { name: 'Altera',         status: 'acquired',    founded: 1983, exitYear: 2015, note: 'FPGA 双寡头之一；Intel $16.7B 收购（2015）；2025-09-16 Intel 将 51% 售予 Silver Lake' },
    { name: 'Achronix',       status: 'independent', founded: 2004, exitYear: null, note: 'FPGA 创业公司；2021 SPAC 合并取消，保持私有独立' },
    { name: 'Wave Computing', status: 'acquired',    founded: 2008, exitYear: 2025, note: 'Chapter 11（2020）→ 2021 以 MIPS 复出 → 2025-08 被 GlobalFoundries 收购' },
    { name: 'Mythic',         status: 'independent', founded: 2012, exitYear: null, note: '模拟存内计算；2025-12 以 $125M 融资重启' },
    { name: 'Nervana',        status: 'acquired',    founded: 2014, exitYear: 2016, note: 'Intel ≈$350M 收购（2016）；产品线 2020 年在 Intel 内终止' },
    { name: 'Flex Logix',     status: 'asset-sale',  founded: 2014, exitYear: 2024, note: 'eFPGA/AI 技术资产与团队 2024-11 转让 Analog Devices；条款未披露' },
    { name: 'SiFive',         status: 'independent', founded: 2015, exitYear: null, note: 'RISC-V；仍独立（pre-IPO）' },
    { name: 'Cerebras',       status: 'ipo',         founded: 2015, exitYear: null, note: '晶圆级芯片；2026-05 完成 IPO（Nasdaq: CBRS，定价 $185，募资 ≈$5.5B）' },
    { name: 'Groq',           status: 'license',     founded: 2016, exitYear: null, note: 'LPU；2025-12-24 与 NVIDIA 达成非独占许可（≈$20B，CNBC 报道未获确认）；余部独立' },
    { name: 'Graphcore',      status: 'acquired',    founded: 2016, exitYear: 2024, note: 'IPU（Bristol）；2024-07 被 SoftBank 收购（据报道 ≈$500–600M，未获确认）' },
    { name: 'Habana',         status: 'acquired',    founded: 2016, exitYear: 2019, note: 'AI 加速器（Tel Aviv）；Intel ≈$2B 收购（2019-12）' },
    { name: 'Tenstorrent',    status: 'independent', founded: 2016, exitYear: null, note: 'RISC-V + AI（Toronto）；2026-06 公开否认 Qualcomm 收购传闻' },
    { name: 'SambaNova',      status: 'independent', founded: 2017, exitYear: null, note: '数据流架构；2026-07 完成 $1B Series F（估值 $11B）' }
  ];
})();

(function () {
  'use strict';

  /* ------------------------- Dashboard 16 状态 -------------------------
   * 每状态：{badge,title,stage,center:[lon,lat],nodes:[{name,lon,lat,note}],
   *          mini:{title,unit,series,note},metrics:[{v,l}×4],cohort:{focus,note}}
   * frame / clearing 内容严格按用户 §8 原文。 */
  window.DASH_STATES = {

    /* §1 执行摘要 —— 用户 §8 原文 */
    frame: {
      badge: '2023 → ?',
      title: '扩张已确认 · 峰值仍开放',
      stage: '结论先行',
      center: [-122.0, 37.4],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'Broadcom / Marvell：卖铲者' },
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: 'AWS：Trainium 自研' },
        { name: 'Seoul', lon: 126.98, lat: 37.57, note: 'SK hynix / Samsung：HBM' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC：CoWoS 与先进制程' },
        { name: 'Beijing', lon: 116.41, lat: 39.90, note: '出口管制变量' }
      ],
      mini: {
        title: 'Marvell 数据中心业务收入', unit: 'US$B / quarter',
        series: [['24Q2', 0.82], ['24Q3', 0.88], ['24Q4', 1.10], ['25Q1', 1.37], ['25Q2', 1.44], ['25Q3', 1.49]],
        note: '公司披露（自然季度标签，约数）'
      },
      metrics: [
        { v: '≈2.5x', l: 'Base case（区间 2.0–4.7x）' },
        { v: '<+14%', l: '盈亏平衡阈值' },
        { v: '2', l: '两类证据一致' },
        { v: '未披露', l: '订单与取消' }
      ],
      cohort: { focus: ['Cerebras', 'SambaNova', 'Tenstorrent', 'Groq'], note: '14 家样本全程跟踪；2016 级 4 家：并购 2 · 许可 1 · 独立 1' }
    },

    /* §2 生存者 —— 用户 §8 原文 */
    clearing: {
      badge: '1975→2026',
      title: '出清 · 出售，而非破产',
      stage: '出清语法',
      center: [-95.0, 42.0],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'Xilinx / Altera / Nervana / Cerebras' },
        { name: 'Bristol', lon: -2.59, lat: 51.45, note: 'Graphcore → SoftBank（2024）' },
        { name: 'Tel Aviv', lon: 34.78, lat: 32.08, note: 'Habana → Intel（2019）' }
      ],
      mini: {
        title: '14 家样本中仍在场的企业', unit: '家 / 年',
        series: [[1983, 1], [1984, 2], [2004, 3], [2008, 4], [2012, 5], [2014, 7], [2015, 8], [2016, 11], [2017, 12], [2019, 11], [2022, 10], [2024, 8], [2025, 7], [2026, 7]],
        note: '在场 = 未并购、未解散（许可存续与 IPO 计入）；阶梯序列，无插值'
      },
      metrics: [
        { v: '0', l: '样本解散（0 家）' },
        { v: '6+1', l: '并购 · 资产出售' },
        { v: '1+1', l: 'IPO（Cerebras）· 许可（Groq）' },
        { v: '5', l: '仍独立' }
      ],
      cohort: { focus: [], note: '14 家：6 并购 · 1 资产出售 · 1 许可 · 1 IPO · 5 独立 · 0 解散；Wave 途中经过 Chapter 11（2020）' }
    },

    /* 窗口一 · 1985–1995 · FPGA 创立期 */
    e2: {
      badge: '1985–1995',
      title: '“更好的 ASIC” · 定位即战略',
      stage: '需求点火',
      center: [-122.0, 37.4],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'Xilinx（1984）/ Altera（1983）' },
        { name: 'Hillsboro', lon: -122.99, lat: 45.52, note: 'Lattice：PLD 阵营' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC（1987）：代工模式开启 fabless 时代' },
        { name: 'Tokyo', lon: 139.69, lat: 35.69, note: '日系 ASIC 阵营' }
      ],
      mini: {
        title: 'FPGA 门容量演进（代表产品）', unit: '万门',
        series: [[1985, 0.12], [1987, 0.9], [1991, 2.5], [1995, 8.5]],
        note: '代表产品 XC2064 / XC3090 / XC4000 系 / XC4000XLA（公司披露，约数）'
      },
      metrics: [
        { v: '1983–84', l: 'Altera / Xilinx 成立' },
        { v: '1994', l: 'Xilinx 获得 PLD 领先' },
        { v: '低端切入', l: '避开 ASIC 正面战场' },
        { v: '未披露', l: '窗口早期市场规模' }
      ],
      cohort: { focus: ['Xilinx', 'Altera'], note: '创立期双寡头：「更好的 ASIC」定位' }
    },

    /* 窗口二 · 1995–2003 · 繁荣与崩塌 */
    e3: {
      badge: '1995–2003',
      title: '−39% · 同一次冲击，四种伤痕',
      stage: '恐慌下单 → 出清',
      center: [-100.0, 42.0],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'Xilinx / Altera：各约 −39%' },
        { name: 'Ottawa', lon: -75.70, lat: 45.42, note: 'Nortel：通信需求集中度样本' },
        { name: 'Murray Hill', lon: -74.40, lat: 40.68, note: 'Lucent：不可取消订单' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC：产能 9–12 个月后到达' }
      ],
      mini: {
        title: '半导体行业收入增速', unit: '%（WSTS）',
        series: [[1999, 18.9], [2000, 36.8], [2001, -32.0], [2002, 1.3], [2003, 18.3]],
        note: 'WSTS（研究综合）；2001 为行业史上最差年份'
      },
      metrics: [
        { v: '−32%', l: '2001 行业收入' },
        { v: '≈−39%', l: 'FPGA 双寡头' },
        { v: '9–12 个月', l: '产能到达滞后' },
        { v: '不可取消', l: '恐慌期订单条款' }
      ],
      cohort: { focus: ['Xilinx', 'Altera'], note: '双寡头同一次冲击，伤痕不同' }
    },

    /* 窗口三 · 2004–2012 · 安静的十年 */
    e4: {
      badge: '2004–2012',
      title: '安静的十年 · 先部署，后披露',
      stage: '出清后研发',
      center: [-122.2, 42.0],
      nodes: [
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: 'Microsoft Catapult：2012 部署 / 2014 披露' },
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: 'FPGA 双寡头：28nm 竞争' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC：28nm 成为主战场' }
      ],
      mini: {
        title: '先进制程量产节点', unit: 'nm',
        series: [[2004, 90], [2006, 65], [2008, 40], [2011, 28]],
        note: '行业量产节点（研究综合，约数年份）'
      },
      metrics: [
        { v: '1,632 台', l: 'Catapult FPGA 服务器（2012 部署）' },
        { v: '2014', l: '披露年份（ISCA）' },
        { v: '28nm', l: '窗口末制程主战场' },
        { v: '2 年', l: '部署→披露静默期' }
      ],
      cohort: { focus: ['Xilinx', 'Altera', 'Achronix'], note: '工具链壁垒确立；Achronix（2004）保持独立' }
    },

    /* 窗口四 · 2013–2018 · 点火 */
    e5: {
      badge: '2013–2018',
      title: 'TPU 与 167 亿美元支票',
      stage: '再次点火',
      center: [-122.0, 40.0],
      nodes: [
        { name: 'Mountain View', lon: -122.08, lat: 37.39, note: 'Google：TPU 2015 部署 / 2016 公开 / 2017 ISCA' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: 'Intel：167 亿美元收购 Altera' },
        { name: 'Bristol', lon: -2.59, lat: 51.45, note: 'Graphcore（2016）' },
        { name: 'Toronto', lon: -79.38, lat: 43.65, note: 'Tenstorrent（2016）' },
        { name: 'Tel Aviv', lon: 34.78, lat: 32.08, note: 'Habana（2016）' }
      ],
      mini: {
        title: 'NVIDIA 数据中心收入（财年）', unit: 'US$B',
        series: [[2014, 0.24], [2015, 0.32], [2016, 0.34], [2017, 0.83], [2018, 1.93], [2019, 2.93]],
        note: '公司披露（财年，截至次年 1 月）；点火前的低基数'
      },
      metrics: [
        { v: '2015', l: 'TPU v1 部署（2016 公开）' },
        { v: 'US$16.7B', l: 'Intel 收购 Altera' },
        { v: '2016 级', l: '创业公司集体进入' },
        { v: 'CUDA', l: '软件生态护城河' }
      ],
      cohort: { focus: ['Graphcore', 'Groq', 'Habana', 'Cerebras', 'Tenstorrent'], note: '2016 级创业公司进入；Altera 退出独立身份' }
    },

    /* 窗口五 · 2019–2022 · 短缺与并购超级周期（含挖矿插曲共用状态） */
    e6: {
      badge: '2019–2022',
      title: '定时装置 · 短缺与并购超级周期',
      stage: '恐慌下单',
      center: [-98.0, 38.0],
      nodes: [
        { name: 'Austin', lon: -97.74, lat: 30.27, note: 'AMD：$35B 报价 → ≈$49B 交割（Xilinx）' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: 'NVIDIA–Arm 400 亿美元（后终止）' },
        { name: 'San Jose', lon: -121.89, lat: 37.34, note: 'Marvell–Inphi' },
        { name: 'Norwood', lon: -71.20, lat: 42.19, note: 'ADI–Maxim' },
        { name: 'Seoul', lon: 126.98, lat: 37.57, note: 'SK hynix–Intel NAND' }
      ],
      mini: {
        title: '108 天五笔交易（2020.7–10）', unit: 'US$B',
        series: [['ADI–Maxim', 20.9], ['NVIDIA–Arm', 40], ['SK hynix–Intel NAND', 9], ['AMD–Xilinx', 35], ['Marvell–Inphi', 10]],
        note: '公司披露；NVIDIA–Arm 于 2022-02 终止'
      },
      metrics: [
        { v: '108 天', l: '五笔大型交易窗口' },
        { v: '36–52 周', l: '交期峰值' },
        { v: '2022-10-07', l: '出口管制 + 关键披露' },
        { v: '2 次', l: 'crypto 库存冲击（2019 / 2022）' }
      ],
      cohort: { focus: ['Xilinx', 'Habana', 'Graphcore', 'Wave Computing'], note: '并购超级周期：Xilinx 退出独立身份；Wave Chapter 11' }
    },

    /* 窗口六 · 2023–2026 · 当前周期 */
    e7: {
      badge: '2023–2026',
      title: '需求、卖铲者与迁移的约束',
      stage: '扩张 · 约束迁移',
      center: [-122.0, 40.0],
      nodes: [
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: 'Amazon：capex 与 Trainium' },
        { name: 'Redmond', lon: -122.12, lat: 47.67, note: 'Microsoft：capex 与 Maia' },
        { name: 'Mountain View', lon: -122.08, lat: 37.39, note: 'Google：capex 与 TPU' },
        { name: 'Menlo Park', lon: -122.18, lat: 37.45, note: 'Meta：capex 与 MTIA' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: 'NVIDIA：卖铲者' }
      ],
      mini: {
        title: 'Top-4 云厂 capex', unit: 'US$B',
        series: [[2023, 154.3], [2024, 250.5], [2025, 412.9], [2026, 710]],
        note: '2023–2024 公司披露合计；2025 编制估计（≈410–413）；2026 为指引中点（695–725）'
      },
      metrics: [
        { v: '≈$410–413B', l: 'Top-4 2025 capex（编制估计）' },
        { v: '695–725B', l: '2026 指引（US$）' },
        { v: '≈17.6x', l: 'NVIDIA DC 12 间隔 · 13 观测值' },
        { v: 'HBM→电网', l: '约束迁移方向' }
      ],
      cohort: { focus: ['Groq', 'Cerebras'], note: '第二轮自研浪潮下的幸存者样本' }
    }
  };
})();

(function () {
  'use strict';

  /* ------------------------- Dashboard 状态（续） ------------------------- */
  Object.assign(window.DASH_STATES, {

    /* 9a/9c 当前窗口 · 第二轮自研浪潮 + 交叉点检验 */
    now: {
      badge: '2026 · 进行中',
      title: '第二轮自研芯片浪潮',
      stage: '测量纪律',
      center: [-122.1, 40.5],
      nodes: [
        { name: 'Mountain View', lon: -122.08, lat: 37.39, note: 'Google Ironwood（TPU v7）' },
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: 'AWS Trainium 3' },
        { name: 'Redmond', lon: -122.12, lat: 47.67, note: 'Microsoft Maia 200' },
        { name: 'Menlo Park', lon: -122.18, lat: 37.45, note: 'Meta MTIA v3' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: 'NVIDIA：参照系' }
      ],
      mini: {
        title: 'TPU 出货估计（2026 已发表，并列展示）', unit: '百万颗',
        series: [['研究低端', 6.5], ['交叉线', 8.2], ['区间中值', 10.75], ['研究高端', 15.0]],
        note: 'K19 / K31；8.0–8.4M 为 50% 单位份额所需量，非区间中值；并列展示，不强行统一'
      },
      metrics: [
        { v: '8.0–8.4M', l: '50% 单位份额所需（K19）' },
        { v: '6.5–15M', l: '2026 已发表估计区间（中值 10.75M）' },
        { v: '3 种', l: '份额口径并列，不混用' },
        { v: '140 万颗', l: 'Trainium 2 · 12 个月（K20）' }
      ],
      cohort: { focus: ['Cerebras', 'SambaNova', 'Tenstorrent'], note: '第二轮自研浪潮的同辈样本' }
    },

    /* 9d 节奏错配 */
    mismatch: {
      badge: '9d · 深入检验',
      title: '模型与芯片的节奏错配仍可管理',
      stage: '深入检验',
      center: [-122.0, 40.0],
      nodes: [
        { name: 'Mountain View', lon: -122.08, lat: 37.39, note: '八代 TPU：稳定算子层' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: '编译器与互连' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: '制程节拍：两年一代' },
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: '训练 / 推理双轨' }
      ],
      mini: {
        title: '每 GW 加速器单位换算', unit: '万颗 GPU 等效 / GW',
        series: [['−40%', 36], ['基准', 60], ['+40%', 84]],
        note: '由 NVL72≈120kW × 72 GPU 推算；±40% 换算带'
      },
      metrics: [
        { v: '≈120kW', l: 'GB200 NVL72 机柜' },
        { v: '≈60 万', l: '每 GW GPU 等效（±40%）' },
        { v: '8 代', l: 'TPU 代际延续' },
        { v: '≈$50B', l: '每 GW 成本（全口径估计，K21）' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* 9e 四道供应关卡 */
    gates: {
      badge: '9e · 供应关卡',
      title: '利润池位于关口，而非云端',
      stage: '供应约束',
      center: [152.0, 36.0],
      nodes: [
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC：CoWoS + 先进制程' },
        { name: 'Seoul', lon: 126.98, lat: 37.57, note: 'SK hynix / Samsung：HBM' },
        { name: 'Boise', lon: -116.20, lat: 43.62, note: 'Micron：HBM 第三极' },
        { name: 'San Jose', lon: -121.89, lat: 37.34, note: '光互连阵营' }
      ],
      mini: {
        title: 'HBM 占 DRAM 收入', unit: '%（估计框架）',
        series: [[2023, 8], [2026, 33], [2027, 41]],
        note: 'K13；位元占比远低于收入占比；估计框架'
      },
      metrics: [
        { v: '8%→41%', l: 'HBM 占 DRAM 收入（2023→2027F）' },
        { v: '4 道', l: 'HBM > 先进制程 > CoWoS > 光互连' },
        { v: '±10–20%', l: '估计误差带' },
        { v: '≈2×', l: 'CoWoS 需求/产能（至 2025）' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* 9f 电网 */
    grid: {
      badge: '9f · 电网',
      title: '约束的最后一站：电网',
      stage: '电力约束',
      center: [-20.0, 38.0],
      nodes: [
        { name: 'Ashburn', lon: -77.49, lat: 39.04, note: '北弗吉尼亚：全球最大数据中心枢纽' },
        { name: 'Dublin', lon: -6.26, lat: 53.35, note: '欧洲枢纽：并网排队' },
        { name: 'Singapore', lon: 103.85, lat: 1.29, note: '亚太枢纽：电力约束' },
        { name: 'Phoenix', lon: -112.07, lat: 33.45, note: '新兴枢纽：电力先行' }
      ],
      mini: {
        title: '全球数据中心用电', unit: 'TWh（IEA）',
        series: [[2024, 415], [2030, 945]],
        note: 'K26；中间年份未披露，不插值'
      },
      metrics: [
        { v: '415→945', l: '数据中心用电 TWh（2024→2030E）' },
        { v: '≈120kW', l: 'GB200 NVL72 机柜' },
        { v: '2 个', l: '节拍器：部署 vs 订单' },
        { v: '未披露', l: '并网排队时长单点' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* S10 三项大胆假设 */
    assumptions: {
      badge: 'S10 · 压力测试',
      title: '三项大胆假设',
      stage: '证伪检验',
      center: [-140.0, 38.0],
      nodes: [
        { name: 'San Jose', lon: -121.89, lat: 37.34, note: 'Broadcom：A1 利润跟随芯片' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'MediaTek / Alchip：A2 单位交叉' },
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: '云厂：A3 需求可见度' }
      ],
      mini: {
        title: '三项假设判定', unit: '编码：0 不成立 / 1 无法判定 / 2 延迟',
        series: [['A1', 0], ['A2', 1], ['A3', 2]],
        note: 'A1 利润跟随芯片 / A2 2027 单位超 GPU / A3 需求可见至 2028'
      },
      metrics: [
        { v: '不成立', l: 'A1 利润跟随芯片' },
        { v: '无法判定', l: 'A2 2027 单位超 GPU' },
        { v: '延迟', l: 'A3 需求可见至 2028' },
        { v: '07-18', l: 'point-in-time · 研究截止' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* §9 结论 · 历史矩阵 */
    analog: {
      badge: '§9 · 结论',
      title: '需求侧 1995–2003 × 供应侧 2019–2022',
      stage: '机制叠加',
      center: [150.0, 35.0],
      nodes: [
        { name: 'Silicon Valley', lon: -122.03, lat: 37.37, note: '1995–2003 需求侧类比' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: '2019–2022 供给侧类比' },
        { name: 'Seoul', lon: 126.98, lat: 37.57, note: '存储周期参照' },
        { name: 'Austin', lon: -97.74, lat: 30.27, note: '并购超级周期' }
      ],
      mini: {
        title: '机制矩阵命中（五阶段）', unit: '项 / 窗口',
        series: [['85–95', 1], ['95–03', 5], ['04–12', 0], ['13–18', 1], ['19–22', 4], ['23–26', 3]],
        note: '与 CHART_DATA.matrix 一致；2023–26 后两格未确认'
      },
      metrics: [
        { v: '2 轮', l: '出清已发生' },
        { v: '2 个', l: 'rejected：1997–98 / 2008–09' },
        { v: '需求 95–03', l: '当前需求侧类比' },
        { v: '供给 19–22', l: '当前供给侧类比' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* §9b 情景算术 */
    verdict: {
      badge: '§9b · 情景算术',
      title: '两种情景 · 明确阈值',
      stage: '情景与阈值',
      center: [-122.2, 42.0],
      nodes: [
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: 'Top-4：Amazon' },
        { name: 'Redmond', lon: -122.12, lat: 47.67, note: 'Top-4：Microsoft' },
        { name: 'Mountain View', lon: -122.08, lat: 37.39, note: 'Top-4：Google' },
        { name: 'Menlo Park', lon: -122.18, lat: 37.45, note: 'Top-4：Meta' }
      ],
      mini: {
        title: 'Base case 指数路径', unit: '指数（2025=100，美元口径）',
        series: [['2025', 100], ['2028E 低', 200], ['2028E 中', 250], ['2028E 高', 470]],
        note: 'K1：≈2.5x（区间 2.0–4.7x，2025→2028E）；情景乘法只用美元口径'
      },
      metrics: [
        { v: '≈2.5x', l: 'Base（区间 2.0–4.7x）' },
        { v: '≈2.0x', l: 'Conservative（1.9–2.1x）' },
        { v: '−15%~−35%', l: 'Contraction' },
        { v: '+14%', l: 'kill switch 阈值' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* §10 监测 */
    signals: {
      badge: '§10 · 监测',
      title: '八个证伪触发器 · point-in-time register',
      stage: '研究截止 2026-07-18',
      center: [-160.0, 35.0],
      nodes: [
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'TSMC / MediaTek / GUC / Alchip' },
        { name: 'Taipei', lon: 121.56, lat: 25.03, note: '供应链数据点' },
        { name: 'San Jose', lon: -121.89, lat: 37.34, note: 'Broadcom AI 指引' },
        { name: 'Seattle', lon: -122.33, lat: 47.61, note: '云厂 capex 指引' }
      ],
      mini: {
        title: '触发器状态（截至 2026-07-18）', unit: '个',
        series: [['部分确认', 7], ['已确认', 1]],
        note: '1 已确认（HBM 售罄）+ 7 部分确认；point-in-time register'
      },
      metrics: [
        { v: '8 个', l: '证伪触发器' },
        { v: '1', l: '已确认（HBM 售罄）' },
        { v: '7', l: '部分确认' },
        { v: '07-18', l: '研究截止（point-in-time）' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    },

    /* §11 公司深研 */
    invest: {
      badge: '§11 · 公司深研',
      title: '六家公司，位于供应链的收费关口',
      stage: '无评级 · 无目标价',
      center: [145.0, 33.0],
      nodes: [
        { name: 'San Jose', lon: -121.89, lat: 37.34, note: 'Broadcom：定制 XPU + 网络' },
        { name: 'Santa Clara', lon: -121.96, lat: 37.35, note: 'Marvell：定制硅 + 互连' },
        { name: 'Hsinchu', lon: 120.97, lat: 24.81, note: 'MediaTek / GUC' },
        { name: 'Taipei', lon: 121.56, lat: 25.03, note: 'Alchip' },
        { name: 'Shanghai', lon: 121.47, lat: 31.23, note: 'VeriSilicon' }
      ],
      mini: {
        title: 'Broadcom AI 收入（公司披露）', unit: 'US$B（财年）',
        series: [[2024, 12.2], [2025, 19.9], ['2026E', 56]],
        note: '公司披露；FY26 为指引 ≈$56B（2026-06-03，K23）；FY27 AI >$100B（指引）'
      },
      metrics: [
        { v: '6 家', l: '关口公司' },
        { v: '0 个', l: '评级与目标价' },
        { v: '≈$73B+', l: 'Broadcom AI backlog（K23）' },
        { v: '未披露', l: 'Marvell custom silicon 单列' }
      ],
      cohort: { focus: [], note: '14 家样本全程跟踪' }
    }
  });
})();

(function () {
  'use strict';

  var CD = window.CHART_DATA = window.CHART_DATA || {};

  /* 1. timeline42 —— 四十二年，一条时间线（SVG，主体≈504px） */
  CD.timeline42 = {
    from: 1983, to: 2026,
    axis: [1985, 1995, 2004, 2013, 2019, 2023],
    windows: window.WINDOWS.map(function (w) {
      return { id: w.id, from: w.from, to: w.to, label: w.nameCn, sub: w.from + '–' + w.to };
    }),
    events: window.TIMELINE_EVENTS.map(function (e) {
      return { year: e.year, yearLabel: e.yearLabel, label: e.label, window: e.window, drill: e.drill };
    }),
    note: '13 个事件 plaque；greedy row packing 多层 staggered；hover tooltip / click drill'
  };

  /* 2. mechanism —— 五阶段周期机制（Canvas，主体 460px） */
  CD.mechanism = {
    stages: [
      { id: 1, label: '需求点火', amp: 1.0, desc: '新需求叙事确立，订单开始加速' },
      { id: 2, label: '产能假设失效', amp: 1.6, desc: '既有产能规划跟不上需求，交期拉长' },
      { id: 3, label: '恐慌性重复下单', amp: 2.6, desc: '客户为保供重复下单、签订不可取消订单，信号失真' },
      { id: 4, label: '大块产能到达', amp: 4.0, desc: '新产能集中投产（滞后 9–12 个月），供需反转' },
      { id: 5, label: '出清', amp: 4.0, desc: '库存与价格下坠；退出语法：并购为主，而非破产（途中一例 Chapter 11：Wave 2020）' }
    ],
    annotations: [
      { at: 3, text: '放大 →' },
      { at: 4, text: '断裂 ↓' }
    ],
    loop: { from: 5, to: 1, text: '研发穿越低谷 → 下一代技术底座（300mm → EUV → HBM/CoWoS）→ 再次点火' },
    note: '连续波形 + dashed envelope + diamond node；出清段下坠 bust curve；大 dashed Bézier loop 回到需求'
  };

  /* 3. clearing —— 14 家样本生存者泳道（SVG，主体≈774px） */
  CD.clearing = {
    unit: '年',
    rows: window.COHORT.map(function (c) {
      return { name: c.name, founded: c.founded, exitYear: c.exitYear, status: c.status, note: c.note };
    }),
    legend: { independent: '仍独立', acquired: '并购', 'asset-sale': '资产出售', license: '许可存续', ipo: 'IPO', exited: '关停' },
    range: [1983, 2026],
    note: '成立 → 结局；主题：并购为主，而非破产（0 家解散；Wave 途中经过 Chapter 11）'
  };

  /* 4. conflow —— 约束迁移流图（SVG viewBox≈710 高） */
  CD.conflow = {
    nodes: [
      { id: 'fab', label: '晶圆厂 · 先进制程' },
      { id: 'cowos', label: 'CoWoS · 先进封装' },
      { id: 'hbm', label: 'HBM · 高带宽存储' },
      { id: 'optics', label: '光互连' },
      { id: 'grid', label: '电网 · 电力' }
    ],
    flows: [
      { from: 'fab', to: 'cowos', weight: 3, label: '1995–2003 / 2019–2022：约束在晶圆厂' },
      { from: 'cowos', to: 'hbm', weight: 3, label: '2023–2024：先进封装成为第一约束' },
      { from: 'hbm', to: 'grid', weight: 4, label: '2024–2026：HBM 绑定 2026 产能' },
      { from: 'cowos', to: 'grid', weight: 2, label: '封装扩产同步吃电' },
      { from: 'optics', to: 'grid', weight: 1, label: '2026 →：光互连为电网减压' }
    ],
    eras: [
      { era: '1995–2003', primary: 'fab', note: '约束在晶圆代工产能' },
      { era: '2019–2022', primary: 'fab', note: '成熟 + 先进制程全面短缺' },
      { era: '2023–2024', primary: 'cowos', note: 'CoWoS 成为第一约束' },
      { era: '2024–2026', primary: 'hbm', note: 'HBM 占 DRAM 收入 8%→41%（2023→2027F，K13）' },
      { era: '2026 →', primary: 'grid', note: '约束的最后一站：电网（K26）' }
    ],
    note: '权重为相对约束强度（研究综合），不代表物理流量'
  };

  /* 5. submarine —— Catapult「潜水艇」图（主体 420px） */
  CD.submarine = {
    unit: '年',
    events: [
      { year: 2010, label: 'Catapult 研究启动', depth: 1, visible: false, note: '内部项目，未披露' },
      { year: 2012, label: '部署 1,632 台 FPGA 服务器', depth: 2, visible: false, note: '先部署（2012 年底）' },
      { year: 2014, label: 'ISCA 论文披露', depth: 0, visible: true, note: '后披露（2014-06）' },
      { year: 2016, label: 'Azure 规模部署', depth: 0, visible: true, note: '进入云基础设施' }
    ],
    hidden: { from: 2012, to: 2014, label: '隐蔽期：先部署，后披露' },
    kpi: { v: '1,632 台', l: 'FPGA 服务器（2012 部署 / 2014 披露）' },
    note: '水位线隐喻：depth>0 为水下（未披露）；事实纪律：不是 2010 年部署'
  };

  /* 6. tpu —— TPU 代际演进（SVG，主体≈430px） */
  CD.tpu = {
    unit: '年',
    gens: [
      { gen: 'TPU v1', deploy: 2015, disclose: 2016, note: '2015 部署 / 2016 公开 / 2017 ISCA 论文' },
      { gen: 'TPU v2', deploy: 2017, disclose: 2017, note: '2017-05 Google I/O 发布' },
      { gen: 'TPU v3', deploy: 2018, disclose: 2018, note: '液冷 pod' },
      { gen: 'TPU v4', deploy: 2020, disclose: 2021, note: '2021 ISCA；部署先于披露' },
      { gen: 'TPU v5e', deploy: 2023, disclose: 2023, note: '轻量推理' },
      { gen: 'TPU v5p', deploy: 2023, disclose: 2023, note: '训练旗舰' },
      { gen: 'TPU v6 Trillium', deploy: 2024, disclose: 2024, note: '2024-05 发布' },
      { gen: 'TPU v7 Ironwood', deploy: 2025, disclose: 2025, note: '2025-04 发布；42.5 EFLOPS FP8 / 9,216 颗 pod；192GB HBM3E' },
      { gen: 'TPU v8', deploy: 2026, disclose: 2026, note: 'TPU 8t/8i · 2026-04-22 发布（Cloud Next）；≈9 PFLOPS FP4（估计）；2026 晚些 GA（K28）' }
    ],
    note: '部署 / 披露错位标记；部署先于披露的传统'
  };

  /* 7. mining —— 挖矿镜像 2017–2022（SVG，主体≈380px） */
  CD.mining = {
    unit: 'US$B（财年）',
    fyLabel: 'NVIDIA 游戏分部收入（财年，截至次年 1 月）',
    series: [[2018, 5.5], [2019, 6.3], [2020, 5.5], [2021, 7.8], [2022, 12.5], [2023, 9.1]],
    shocks: [
      { fy: 2020, label: '第一次库存冲击（2018Q4–2019）' },
      { fy: 2023, label: '第二次库存冲击（2022）' }
    ],
    events: [
      { year: 2017, label: 'BTC 2017-12 峰值 ≈$19.7k；16nm 挖矿 ASIC 抢单' },
      { year: 2019, label: 'crypto hangover：游戏分部单季 −45% YoY（Q4 FY19）' },
      { year: 2021, label: 'BTC 2021-11 ≈$69k；第二波牛市 + 短缺' },
      { year: 2022, label: '以太坊转 PoS，第二次库存冲击' }
    ],
    note: 'K36：两次库存冲击（2019 / 2022）；Q4 FY19 游戏分部单季 −45% YoY；序列为公司披露约数'
  };

  /* 8. sawtooth-alchip —— Alchip 锯齿收入（SVG，340px） */
  CD['sawtooth-alchip'] = {
    unit: 'NT$B / 年',
    series: [[2017, 6.9], [2018, 5.24], [2019, 3.87], [2020, 7.1], [2021, 10.9], [2022, 24.1], [2023, 26.4], [2024, 51.0], [2025, null]],
    crypto: [
      { year: 2018, label: '挖矿收入占比峰值 30–40%（K37，研究综合）' },
      { year: 2023, label: '2023 起 AI 占比 ≈70%（K37）' }
    ],
    note: 'K37；公司披露约数取整；2025 未披露（null）；2017→2019 锯齿：6.9 → 5.24 → 3.87'
  };

  /* 9. sawtooth-guc —— GUC 锯齿收入（SVG，340px） */
  CD['sawtooth-guc'] = {
    unit: 'NT$B / 年',
    series: [[2017, 11.6], [2018, 12.0], [2019, 10.8], [2020, 14.5], [2021, 21.3], [2022, 27.6], [2023, 25.5], [2024, 24.9], [2025, null]],
    crypto: [
      { year: 2018, label: '挖矿 NRE 占比峰值 ≈20%（K38）' },
      { year: 2024, label: 'AI 接力：2024 ≈NT$24.9B' }
    ],
    note: 'K38；公司披露约数取整；2025 未披露（null）；≈NT$11.6B（2017）→ ≈NT$24.9B（2024）'
  };

  /* 10. capex3d —— Top-4 云厂 capex × OCF 双柱比率图（主体 520px）
   * schema（chart 直接消费）：{unit, periods[6], companies:[{name, caliber, capex[6], ocf[6]}],
   *   refPath:{label, vals[7], note}, total2025, band2026, ratioMid2027MSFT, source, note}
   * 口径纪律：capex/ocf 单位 US$B，日历年口径（Microsoft 经日历年化；CY2026 ≈$190B 为公司明确口径）；
   * '25 = 编制估计（compiled estimate，合计 ≈412.9，区间 ≈410–413，K5）；'26E = 指引中点（斜纹，
   * 分项合计 710.0，落在指引区间 695–725 内，K5）；'27E* = 券商 2027 测算中值 $568B 按 2026E
   * 占比分摊（虚线，非指引；三家测算 $520B/$568B/$591B 见 K30）；TTM 为研究综合约数；
   * K29：合计 capex/OCF 0.45–0.56（2021–24）→ 0.80（2025）→ 1.21 中点（2026E，区间 1.18–1.24）。 */
  CD.capex3d = {
    unit: 'US$B',
    periods: ["'23", "'24", "'25", 'TTM', "'26E", "'27E*"],
    companies: [
      { name: 'Alphabet', caliber: '日历年口径',
        capex: [32.3, 52.5, 103.0, 144.0, 185.0, 148.0],
        ocf:   [101.7, 125.2, 145.0, 155.0, 165.0, 132.0] },
      { name: 'Amazon', caliber: '日历年口径',
        capex: [52.7, 83.0, 125.0, 162.0, 200.0, 160.0],
        ocf:   [84.9, 115.9, 132.0, 141.0, 150.0, 120.0] },
      { name: 'Microsoft', caliber: '日历年化口径（CY2026 ≈$190B 为公司明确口径）',
        capex: [41.2, 75.8, 115.0, 152.0, 190.0, 152.0],
        ocf:   [87.6, 118.5, 136.0, 148.0, 160.0, 128.0] },
      { name: 'Meta', caliber: '日历年口径',
        capex: [28.1, 39.2, 69.9, 102.0, 135.0, 108.0],
        ocf:   [71.1, 91.3, 100.0, 106.0, 112.0, 89.6] }
    ],
    refPath: {
      label: '对照路径（参考口径）',
      vals: [0.38, 0.47, 0.57, 0.40, 0.43, 0.62, 0.63],
      note: '原版设计给定的参考比率口径；公司归属与绝对值未披露，仅作轨迹形状参考，不进入 Top-4 合计'
    },
    total2025: 412.9,
    band2026: { lo: 695, hi: 725, sum: 710.0 },
    ratioMid2027MSFT: 1.19,
    source: '公司披露 — 10-K/10-Q 现金流量表（四家，日历年口径，MSFT 经日历年化）；2025 为编制估计（K5）；2026E 为公司指引（2026-04-29/30 Q1 财报）；2027E 券商测算（K30）',
    note: '2023–2024 分项为公司披露（日历年）；2025 为编制估计（≈$410–413B）；TTM 为研究综合约数（滚动十二个月）；比率 = capex ÷ OCF，>1 红色 = 超现金流（K29：合计 0.80 → 1.18–1.24）'
  };

  /* 11. capex-stairs —— capex/OCF 阶梯约束（SVG，400px）
   * schema（capex_stairs.js 直接消费）：{unit, years[4], ocf[4], capexLo[4], capexHi[4],
   *   estFrom, source, note}；任一字段置 null 时图表回退其内置约数（缺值由图表侧兜底）。
   * 口径：日历年 Top-4 合计（Microsoft 经日历年化）；capex 2023–2024 公司披露合计（154.3 / 250.5），
   * 2025 = 编制估计 412.9（K5，区间 ≈410–413），2026E = 指引区间 695–725（K5）；
   * OCF 2023–2024 公司披露合计（345.3 / 450.9），2025E = 513（估计），2026E ≈587（working estimate）。
   * K29 核心压力指标：比率 0.45 → 0.56 → 0.80 → 1.18–1.24（2026E 中点 1.21）。 */
  CD['capex-stairs'] = {
    unit: 'US$B · 日历年 Top-4 合计',
    years: ['2023', '2024', '2025E', '2026E'],
    ocf: [345.3, 450.9, 513, 587],
    capexLo: [154.3, 250.5, 412.9, 695],
    capexHi: [154.3, 250.5, 412.9, 725],
    estFrom: 2,
    source: '公司披露 — 10-K/10-Q 现金流量表（四家，日历年口径，MSFT 经日历年化）；2026E：公司指引区间（K5）；OCF 2026E ≈$587B 为 working estimate（K29）',
    note: 'K29 核心压力指标：capex/OCF = 0.45（2023）→ 0.56（2024）→ 0.80（2025E）→ 1.18–1.24（2026E，中点 1.21）；OCF 2026E ≈$587B 为 working estimate（无公开一致预期）；capex 2025 ≈$410–413B 编制估计，2026E 指引 695–725（K5）。'
  };

  /* 12. penetration —— 三种口径份额并列（SVG，≈420px） */
  CD.penetration = {
    unit: '%',
    calibers: [
      { key: 'unit', label: '单位口径', value: 50, lo: 30, hi: 50, note: '2024 ≈30% → 2027F 主张 ≈50% · 券商口径（K6）；TrendForce 27.8% 为 2026 AI 服务器口径，不贴 2027' },
      { key: 'cowos', label: 'CoWoS 分配口径', value: 30, lo: 24, hi: 36, note: '2026E ≈30% → 2027F ≈34% · 券商研究，±10–20%（K7）' },
      { key: 'dollar', label: '美元口径', value: 20, lo: 12, hi: 20, note: 'Series A 8/12/16/20%（2024→2027F）· 情景计算唯一口径（K8）' }
    ],
    warning: '三种口径并列展示，绝不混用；情景乘法只用美元口径',
    note: '定制 ASIC 占 AI 加速器份额的三种测量'
  };

  /* 13. stamps —— 玩家图鉴邮戳卡（SVG，≈1270px，12 枚）
   * schema：{cards:[{name, vendor, year, face, gen, role,
   *   specs:[{label, value}×3], asOf, source, note,
   *   drill:{title, body, source, date}}], note}
   * 纪律：只列已披露 / 给定口径；缺数据一律「未披露」，不做推测填充。 */
  CD.stamps = {
    cards: [
      { name: 'Ironwood（TPU v7）', vendor: 'Google', year: '2025', face: 'v7', gen: 'TPU v7',
        role: '推理专用旗舰',
        specs: [{ label: '算力', value: '42.5 EFLOPS FP8 / pod' }, { label: '规模', value: '9,216 颗 / pod' }, { label: '存储', value: '192GB HBM3E / 颗' }],
        asOf: '2025-04', source: '公司披露（Google）',
        note: '首款为推理时代设计的 TPU',
        drill: { title: 'Google TPU v7「Ironwood」（2025）',
          body: '2025 年 4 月发布的第七代 TPU，定位推理优先：单 Pod 9,216 颗芯片、42.5 EFLOPS（FP8）、每颗 192GB HBM3E。八代 TPU 的产品纪律来自同一套稳定算子层与 XLA 编译器栈——模型换代，芯片不必换代。',
          source: '公司披露（Google）', date: '2025-04' } },
      { name: 'TPU v8（8t/8i）', vendor: 'Google', year: '2026', face: 'v8', gen: 'TPU v8',
        role: '下一代 · 训练 + 推理',
        specs: [{ label: '算力', value: '≈9 PFLOPS FP4（估计，K28）' }, { label: '发布', value: '2026-04-22（Cloud Next）' }, { label: 'GA', value: '2026 晚些（公司口径）' }],
        asOf: '2026-04-22', source: '公司披露（Google Cloud Next）',
        note: '≈9 PFLOPS FP4 为估计（精度口径最宽）；替换原 12.6 PFLOPS 口径',
        drill: { title: 'Google TPU v8（8t/8i，2026）',
          body: 'TPU 8t/8i 于 2026-04-22（Cloud Next）发布：单颗 ≈9 PFLOPS FP4（估计，精度口径最宽），2026 晚些 GA（K28）。从 v1（2015 部署 / 2016 公开）开始，部署先于披露就是 Google 的传统；本次为发布先于 GA。',
          source: '公司披露（Google Cloud Next）', date: '2026-04-22' } },
      { name: 'Trainium 3', vendor: 'AWS', year: '2025→26', face: 'T3', gen: 'Trn3',
        role: '训练 + 推理通用',
        specs: [{ label: '制程', value: '3nm' }, { label: '算力', value: '较上代 ≈2.4×（公司口径）' }, { label: '出货', value: '未披露' }],
        asOf: '2025-12', source: '公司披露（AWS re:Invent）',
        note: '首款 3nm 自研 AI 芯片',
        drill: { title: 'AWS Trainium 3（2025→26）',
          body: 'AWS 第三代自研 AI 芯片，3nm 制程，公司口径算力较上代 ≈2.4×。Trainium 定位训练与推理通用，与 Google 的推理专用路线形成对照；出货规模未披露。',
          source: '公司披露（AWS re:Invent）', date: '2025-12' } },
      { name: 'Trainium 2 · Project Rainier', vendor: 'AWS × Anthropic', year: '2024', face: 'T2', gen: 'Trn2',
        role: '超大规模训练集群',
        specs: [{ label: '颗数', value: '12 个月 140 万颗（K20）' }, { label: '场景', value: 'Anthropic Project Rainier' }, { label: '环比', value: '≈10×（re:Invent 2024）' }],
        asOf: '2024-12-03', source: '公司披露（AWS re:Invent 2024）',
        note: 'Trainium 系列最大规模部署场景',
        drill: { title: 'AWS Trainium 2 · Project Rainier（2024）',
          body: 'Trainium 2 支撑 Anthropic Project Rainier——Trainium 系列最大规模的部署场景（K20）。公司披露 12 个月出货 140 万颗、环比 ≈10×（re:Invent 2024）；它的存在本身就是证据：自研芯片可以承接前沿模型级别的训练负载。',
          source: '公司披露（AWS re:Invent 2024）', date: '2024-12-03' } },
      { name: 'Inferentia 2', vendor: 'AWS', year: '2023', face: 'I2', gen: 'Inf2',
        role: '成本优先推理',
        specs: [{ label: '定位', value: '推理成本优化' }, { label: '算力', value: '未披露' }, { label: '出货', value: '未披露' }],
        asOf: '2023-04', source: '公司披露（AWS）',
        note: '与 Trainium 互补的推理线',
        drill: { title: 'AWS Inferentia 2（2023）',
          body: 'AWS 推理专用芯片线第二代，2023 年正式发布，与 Trainium（训练 + 推理通用）互补：Inferentia 只做一件事——把推理的单位成本压到最低。详细规格与出货规模未披露。',
          source: '公司披露（AWS）', date: '2023-04' } },
      { name: 'Maia 200', vendor: 'Microsoft', year: '2025-11', face: 'M2', gen: 'Maia 2',
        role: '内部负载 · 推理优先',
        specs: [{ label: '算力', value: '未披露' }, { label: '负载', value: 'Copilot / OpenAI 工作负载' }, { label: '部署', value: '未披露' }],
        asOf: '2025-11', source: '公司披露（Microsoft）· 据报道',
        note: '继 Maia 100（2023-11）之后的第二代',
        drill: { title: 'Microsoft Maia 200（2025-11）',
          body: '继 2023 年 Maia 100 之后的第二代自研芯片，2025 年 11 月发布，面向 Microsoft 内部推理负载（Copilot / OpenAI 工作负载）。参数披露有限，本站以「据报道」口径标注，不做精确规格断言。',
          source: '公司披露（Microsoft）· 据报道', date: '2025-11' } },
      { name: 'MTIA v3', vendor: 'Meta', year: '2026', face: 'M3', gen: 'MTIA 3',
        role: '排序 / 推荐推理',
        specs: [{ label: '算力', value: '未披露' }, { label: '场景', value: '排序与推荐模型' }, { label: '部署', value: '未披露' }],
        asOf: '2026-07', source: '公司披露 / 研究综合（据报道）',
        note: '窄而稳的算子集合，内部闭环',
        drill: { title: 'Meta MTIA v3（2026）',
          body: 'Meta 自研推理芯片第三代（v1 2023 / v2 2024）。MTIA 聚焦排序与推荐这一窄而稳的算子集合——负载稳定、规模足够、内部闭环，正是自研芯片最擅长的场景。详细规格以公司披露为准（据报道）。',
          source: '公司披露 / 研究综合（据报道）', date: '2026-07' } },
      { name: 'Broadcom 定制 XPU', vendor: 'Broadcom', year: '2026', face: 'X', gen: 'XPU',
        role: '定制设计龙头',
        specs: [{ label: '客户', value: '6 家合格 + 2 家爬坡（K23）' }, { label: 'AI backlog', value: '≈$73B+（2026-06-03）' }, { label: 'AI 指引', value: 'FY26 ≈$56B · FY27 >$100B' }],
        asOf: '2026-06-03', source: '公司披露（Broadcom Q2 FY26）',
        note: '客户：Google、Meta、ByteDance、OpenAI、Anthropic、Fujitsu；2025-09 旧口径已过期（STALE）',
        drill: { title: 'Broadcom 定制 XPU（2026-06）',
          body: '定制 AI ASIC 设计龙头（2026-06-03，Q2 FY26）：6 家合格 XPU 客户（Google、Meta、ByteDance、OpenAI、Anthropic、Fujitsu）+ 2 家爬坡；AI backlog ≈$73B+；FY26 AI ≈$56B、FY27 AI >$100B（指引，K23）。定制 ASIC 设计份额约 70%（K24，研究口径，±10%）；既有客户群 2027E SAM 60–90 US$B（K9，不外推全行业）。',
          source: '公司披露（Broadcom Q2 FY26）', date: '2026-06-03' } },
      { name: 'Marvell 定制', vendor: 'Marvell', year: '2025', face: 'Mv', gen: 'Custom',
        role: '定制硅第二极',
        specs: [{ label: '定制收入', value: '未披露（未单列，K25）' }, { label: '定位', value: '定制计算 + 互连' }, { label: '客户', value: '未披露' }],
        asOf: '2026-07', source: '公司披露（Marvell）',
        note: '数据中心分部未单列定制收入',
        drill: { title: 'Marvell 定制硅（2025）',
          body: '定制芯片设计的第二极：定制计算 + 互连双轮。公司未单列定制硅收入（K25），客户名单未披露；本站不做份额断言。数据中心分部收入序列见 Dashboard。',
          source: '公司披露（Marvell）', date: '2026-07' } },
      { name: 'Alchip / GUC 设计服务', vendor: '台系设计服务', year: '2024', face: 'DS', gen: 'Design',
        role: '定制设计服务双雄',
        specs: [{ label: 'Alchip', value: '2024 收入 ≈NT$51.0B（K37）' }, { label: 'GUC', value: '2024 收入 ≈NT$24.9B（K38）' }, { label: '挖矿峰值', value: '30–40% / ≈20%（K37/K38）' }],
        asOf: '2026-07', source: '公司披露（约数取整）',
        note: '锯齿形收入：crypto 孵化，AI 接力',
        drill: { title: 'Alchip / GUC 设计服务（2024）',
          body: '台系定制设计服务双雄：Alchip 2024 收入约 NT$51.0B（K37，2017→2019 锯齿 6.9 → 5.24 → 3.87）、GUC 约 NT$24.9B（K38，2017 ≈NT$11.6B），公司披露约数取整。两家收入均呈锯齿形——crypto 周期孵化（挖矿占比峰值 30–40% / ≈20%），AI 定制接力。2025 年数据未披露，不插值。',
          source: '公司披露（约数取整）', date: '2026-07' } },
      { name: 'OpenAI × Broadcom', vendor: 'OpenAI × Broadcom', year: '2025-10', face: 'O×B', gen: '10 GW',
        role: '自研加速器 + 定制落地',
        specs: [{ label: '规模', value: '10 GW 定制加速器（联合公告口径）' }, { label: '部署', value: '2026H2 起（公告口径）' }, { label: '芯片规格', value: '未披露' }],
        asOf: '2025-10', source: '公司披露（OpenAI × Broadcom 联合公告）',
        note: '模型公司第一次走到芯片定义层',
        drill: { title: 'OpenAI × Broadcom 合作（2025-10）',
          body: '2025 年 10 月，OpenAI 与 Broadcom 宣布合作部署 10 GW 定制 AI 加速器（联合公告口径），2026 年下半年起部署。模型公司第一次走到芯片定义层：OpenAI 定义加速器，Broadcom 负责设计与落地。芯片规格未披露。',
          source: '公司披露（OpenAI × Broadcom 联合公告）', date: '2025-10' } },
      { name: 'Anthropic × Google TPU', vendor: 'Anthropic × Google', year: '2025-10', face: 'A×G', gen: '≈1M 颗',
        role: '自研芯片第一个外部大客户',
        specs: [{ label: '规模', value: '最多约 100 万颗 TPU（K32）' }, { label: '容量', value: '>1 GW（2026 上线）' }, { label: '性质', value: '多年期扩展协议' }],
        asOf: '2025-10-23', source: '公司披露（Anthropic × Google）',
        note: '自研芯片从内部成本工具变成商品化供给',
        drill: { title: 'Anthropic × Google TPU 协议（2025-10）',
          body: '2025 年 10 月 23 日，Anthropic 与 Google 宣布多年期扩展协议：Anthropic 将使用最多约 100 万颗 TPU，2026 年上线容量超过 1 GW（K32）。自研芯片第一次拥有外部大客户——从内部成本工具变成商品化的算力供给。',
          source: '公司披露（Anthropic × Google）', date: '2025-10-23' } }
    ],
    note: '玩家图鉴 12 枚邮戳：云厂自研 × 定制设计 × 设计服务 × 外部大客户；只列已披露口径，缺数据一律「未披露」'
  };
})();

(function () {
  'use strict';

  var CD = window.CHART_DATA = window.CHART_DATA || {};

  /* 14. revenue-split —— 2027 交叉点检验（SVG，≈430px）
   * 注：revenue_split.js 当前消费 range/cross/estimates/dollar 四键（一并给出，与 unitPanel 等文档键一致） */
  CD['revenue-split'] = {
    unitA: '百万颗（单位口径）',
    unitPanel: {
      tpu: [
        { label: '研究低端（2026 已发表）', v: 6.5 },
        { label: '交叉线（50% 所需）', v: 8.2 },
        { label: '区间中值', v: 10.75 },
        { label: '研究高端', v: 15.0 }
      ],
      gpu: { label: 'GPU 单位参照（2027F ≈8M 级）', lo: 8, hi: 8.4, note: '研究综合参照，非预测' }
    },
    unitB: '%（美元口径）',
    dollarPanel: [
      { label: 'GPU', v: 80, note: '美元口径仍占优（K33）' },
      { label: '定制 ASIC', v: 20, note: '美元口径份额 ≈20%（K8，Series A 2027F）' }
    ],
    range: [6.5, 15.0],
    cross: [8.0, 8.4],
    dollar: { gpu: 260, asic: 65 },
    conclusion: '合理、模型支持，但未被证明（A2：无法判定，K35）',
    note: '单位口径可能交叉（K19 8.0–8.4M 为 50% 单位份额所需量，非区间中值；K31 2026 已发表区间 6.5–15M，中值 10.75M）；美元口径 ≈20%（2027F，K8），GPU 仍占优；不混用口径'
  };

  /* 15. pergw —— 每 GW 成本/单位换算 ±40%（SVG，300px） */
  CD.pergw = {
    rackKW: 120,
    gpusPerRack: 72,
    racksPerGW: 8300,
    unitsPerGW: 600000,
    band: 0.4,
    lo: 360000,
    hi: 840000,
    cost: '≈$50B（全口径，估计）',
    steps: [
      { label: '1 GW ÷ 120kW/机柜', v: '≈8,300 机柜' },
      { label: '× 72 GPU / NVL72', v: '≈60 万颗 GPU 等效' },
      { label: '±40% 换算带', v: '36 万 – 84 万颗' },
      { label: 'TSMC 每 GW 收入', v: '≈$2.1B/GW（K21 派生）' }
    ],
    note: '由 GB200 NVL72 ≈120kW 推算（K26）；单位换算 ±40% 带；TSMC 每 GW 收入 ≈$2.1B（K21 派生值：≈$3.5k/颗 × ≈60 万颗）'
  };

  /* 16. gates —— 四道供应关卡（SVG，≈420px） */
  CD.gates = {
    gates: [
      { rank: 1, gate: 'HBM', tightness: 5, note: '三家供应；2026 供应售罄（SK hynix，K14）；占 DRAM 收入 8%→41%（2023→2027F，K13）' },
      { rank: 2, gate: '先进制程', tightness: 4, note: '3nm / 2nm 产能集中；排队与溢价' },
      { rank: 3, gate: 'CoWoS', tightness: 3, note: '产能 7–8 → 12–13 万片/月（K12，第三方估计）；需求 ≈2× 产能、售罄至 2026（K11）' },
      { rank: 4, gate: '光互连', tightness: 2, note: '2026 后的下一道约束；当前约束度最低' }
    ],
    note: '排序：HBM > 先进制程 > CoWoS > 光互连；利润池位于关口，而非云端'
  };

  /* 17. cowos —— CoWoS 供需（SVG viewBox≈457） */
  CD.cowos = {
    unit: '万片/月（第三方估计）',
    capacity: [
      { year: 2024, lo: 3.5, hi: 4 },
      { year: 2025, lo: 7, hi: 8 },
      { year: 2026, lo: 12, hi: 13 },
      { year: 2027, lo: 13, hi: 13 }
    ],
    demand: '需求 ≈2× 装机产能（至 2025，供应链估计）；售罄至 2026（C.C. Wei，AGM 2026-06，K11）',
    share: [
      { label: '定制 ASIC 分配', v: 30, note: '≈30%（2026E）→ ≈34%（2027F），±10–20%（K7）' },
      { label: 'GPU 与其他', v: 70, note: '余额（研究综合）' }
    ],
    note: '第三方估计（TSMC 不指引 kwpm）；2026 末 12–13 万片/月为目标口径；±10–20% 误差带'
  };

  /* 18. hbm —— HBM 容量/缺口/定价（SVG，400px） */
  CD.hbm = {
    unit: '%（占 DRAM 收入，估计框架）',
    series: [[2023, 8], [2026, 33], [2027, 41]],
    gap: '2026 供应售罄（SK hynix，K14）；客户需求超其三年产能路线图',
    pricing: '≈5–6× 常规 DRAM 每 bit（K15，券商估计）；年度合约重签，方向：HBM4 溢价',
    parity: '3 家供应：SK hynix / Samsung / Micron（K16）',
    note: 'K13：占 DRAM 收入 8%（2023）→ 33%（2026E）→ 41%（2027F）；位元占比远低于收入占比；估计框架'
  };

  /* 19. hbmgen —— HBM 代际路线（SVG viewBox≈356） */
  CD.hbmgen = {
    gens: [
      { gen: 'HBM3', year: 2022, status: '量产', note: '2022 起量产' },
      { gen: 'HBM3E', year: 2024, status: '主力', note: '2024–2025 主力；8/12 层堆叠' },
      { gen: 'HBM4', year: 2026, status: '导入', note: 'base die 转向逻辑代工；2026 合约重签' },
      { gen: 'HBM4E', year: 2027, status: '展望', note: '路线展望；细节未披露' }
    ],
    note: '代际路线为研究综合；未披露细节不补'
  };

  /* 20. partition —— 电网（SVG，≈420px） */
  CD.partition = {
    unit: 'TWh（IEA）',
    twh: [[2024, 415], [2030, 945]],
    rack: { name: 'GB200 NVL72', kw: 120 },
    metronomes: {
      deploy: '部署节拍器：电力与并网排队决定真实落地速度',
      order: '订单节拍器：capex 指引决定订单，二者可相差 12–24 个月'
    },
    note: 'K26：415（2024）→ 945（2030E）；中间年份未披露，不插值'
  };

  /* 21. assume-a2 —— A2 2027 ASIC 单位超 GPU：无法判定（SVG，≈360px） */
  CD['assume-a2'] = {
    assumption: 'A2 · 2027 年 ASIC 单位出货超过 GPU',
    verdict: '无法判定',
    verdictClass: 'pending',
    evidence: [
      { side: '支持', items: ['50% 单位份额所需 ≈8.0–8.4M（K19）', '2026 已发表估计上限 15M（K31）', 'Anthropic ≈100 万颗 / >1 GW（K32）'] },
      { side: '反对', items: ['已发表区间下限 6.5M、中值 10.75M（K31）', '美元口径 2027F ≈20%，GPU 仍占优（K8/K33）', 'GW→单位换算 ±40%（K21）'] }
    ],
    note: '证据并列，不强行统一；外部裁判：TPU 数量收敛与云厂披露（K34）'
  };

  /* 22. assume-a3 —— A3 需求可见至 2028：延迟（SVG，≈360px） */
  CD['assume-a3'] = {
    assumption: 'A3 · 需求可见至 2028',
    verdict: '延迟',
    verdictClass: 'delayed',
    evidence: [
      { side: '支持', items: ['AI backlog ≈$73B+ 与多年期合约（K23）', '2026 指引 695–725 US$B（K5）', '修订台账全部向上：Meta $60–65B→$70–72B · Alphabet $75B→$91–93B · Microsoft ≈$80B→$140B+ · Amazon ≈$105B→$125B；公告滞后部署 1–4 年', 'Anthropic 多年期扩展（K32）'] },
      { side: '反对', items: ['2027 后能见度未披露', '2027 capex 券商测算 $520B/$568B/$591B，仍存分歧（K30）', 'kill switch +14%（K4）'] }
    ],
    note: '需求可见至 2026–2027；2028 延迟确认'
  };

  /* 23. matrix —— 六窗口机制矩阵（SVG/DOM，≈460px） */
  CD.matrix = {
    phases: ['需求点火', '供给约束', '重复下单', '产能到达', '出清'],
    rows: [
      { window: '1985–1995', cells: [1, 0, 0, 0, 0], note: '创立期：点火即战略' },
      { window: '1995–2003', cells: [1, 1, 1, 1, 1], note: '完整周期：行业 −32% / 双寡头 ≈−39%' },
      { window: '2004–2012', cells: [0, 0, 0, 0, 0], note: '安静的十年（出清后研发）' },
      { window: '2013–2018', cells: [1, 0, 0, 0, 0], note: '点火 + 生态锁定' },
      { window: '2019–2022', cells: [1, 1, 1, 1, 0], note: '短缺与并购超级周期' },
      { window: '2023–2026', cells: [1, 1, 1, null, null], note: '扩张已确认，峰值开放' }
    ],
    rejected: [
      { window: '1997–98', reason: '亚洲金融危机：需求冲击，非产能周期' },
      { window: '2008–09', reason: '金融危机：信用冲击，非产能周期' }
    ],
    note: 'cells：1=命中，0=未命中，null=未确认；当前周期 = 需求侧 1995–2003 × 供应侧 2019–2022 叠加'
  };

  /* 24. verdict-tree —— 情景树（SVG，≈420px） */
  CD['verdict-tree'] = {
    root: '2023–2026 扩张已确认',
    unit: '美元口径 · 2025→2028E',
    branches: [
      { name: 'Base', range: '2.0–4.7x', lo: 2.0, hi: 4.7, mid: 2.5, cls: 'base', desc: '≈2.5x（K1 · 区间 2.0–4.7x）' },
      { name: 'Conservative', range: '1.9–2.1x', lo: 1.9, hi: 2.1, mid: 2.0, cls: 'cons', desc: '≈2.0x（K2 · band 1.9–2.1x）' },
      { name: 'Contraction', range: '−15% ~ −35%', lo: -35, hi: -15, mid: -25, cls: 'neg', desc: 'K3（kill switch 触发后）' }
    ],
    killSwitch: { threshold: '+14%', desc: 'Top-4 2027 capex 增速低于 +14% → Base / Conservative 失效，转入 Contraction（K4）' },
    note: '情景乘法只使用美元口径（K8）；3.0–4.3x 旧链已作废（do not cite）'
  };

  /* 25. scenario-chain —— 情景链（SVG，≈360px） */
  CD['scenario-chain'] = {
    chains: [
      { trigger: '2027 capex 增速 ≥ +14%，且 HBM / CoWoS 逐步缓解',
        steps: ['订单节拍器延续', '产能有序到达', '单位与美元口径同步扩张'],
        result: 'Base：≈2.5x（区间 2.0–4.7x）', cls: 'base' },
      { trigger: '2027 capex 增速 < +14%（kill switch）',
        steps: ['订单节拍器降速', '重复下单消退', '2027–28 产能集中到达', '价格与利用率承压'],
        result: 'Contraction：−15% ~ −35%', cls: 'neg' }
    ],
    note: '触发 → 传导 → 结果；阈值见 K4'
  };

  /* 26a. signals —— 八个证伪触发器（DOM 表格，≈420px；point-in-time register，研究截止 2026-07-18） */
  CD.signals = {
    cols: ['触发器', '观察指标', '失效阈值', '下一窗口', '状态'],
    rows: [
      { id: 'S1', name: 'Top-4 capex 指引', metric: '2026 指引合计 695–725 US$B vs 2025 ≈410–413B（K5）', threshold: '指引增速跌破 +20% YoY', freq: '2026-07-28 → 07-30（四大云厂财报）', status: '部分确认' },
      { id: 'S2', name: 'NVIDIA 数据中心增速', metric: 'DC 收入 YoY（Q1 FY27 $75.2B，+92%）', threshold: '连续两季 <+20%', freq: '≈2026-08-26（Q2 FY27）', status: '部分确认' },
      { id: 'S3', name: 'Broadcom 定制硅动能', metric: 'FY27 AI 指引 / 合格客户数（K23）', threshold: 'FY27 AI 指引低于 FY26（≈$56B）或丢失合格客户', freq: '2026-09-02', status: '部分确认' },
      { id: 'S4', name: 'GW 项目 vs 并网现实', metric: '具名站点新增并网容量（Stargate ≈7GW 宣称 vs ≈0.6GW 在建）', threshold: '连续两季无新增并网', freq: '2026-09（Oracle 财报 + 卫星复查）', status: '部分确认' },
      { id: 'S5', name: 'HBM 供给 / 价格 / 交期', metric: 'HBM3E/HBM4 ASP 与交期（K14–K15）', threshold: 'ASP −15% 或交期 <2 个季度', freq: '2026-10（存储厂财报）', status: '已确认（2026 售罄）' },
      { id: 'S6', name: 'CoWoS 产能与利用率', metric: '利用率 vs 扩产（7–8 → 12–13 万片/月，K12）', threshold: '利用率 <85%', freq: '2026-08-10（TSMC 月营收）', status: '部分确认' },
      { id: 'S7', name: '定制硅份额动能', metric: '单位份额（TrendForce 27.8%，2026 AI 服务器）/ Series A 美元份额（K8）', threshold: '单位 <≈20% 或美元 <15%（至 2027F）', freq: '2026Q4（TrendForce 更新）', status: '部分确认' },
      { id: 'S8', name: 'Google TPU 节奏', metric: 'TPU 8t/8i GA / Anthropic >1GW 上线（K28/K32）', threshold: 'GA 滑入 2027 或 1GW 未于 2026 上线', freq: '2026-07-28 + 2026H2', status: '部分确认' }
    ],
    asOf: '2026-07-18',
    note: '八个证伪触发器：1 已确认（HBM 售罄）+ 7 部分确认；point-in-time register，研究截止 2026-07-18，非逐季更新产品'
  };

  /* 26b. invest —— 六公司深研（DOM/SVG，≈480px） */
  CD.invest = {
    companies: [
      { name: 'Broadcom', gate: '定制 XPU 设计 + 网络芯片',
        facts: ['6 家合格 XPU 客户 + 2 家爬坡（K23，2026-06-03）', 'AI backlog ≈$73B+；FY26 AI ≈$56B；FY27 AI >$100B（指引）', '定制 ASIC 设计份额 ≈70%（K24，研究口径）'],
        risks: ['客户高度集中', '单位口径份额不等于利润份额'],
        disclaimer: '无评级 · 无目标价' },
      { name: 'Marvell', gate: '定制硅 + DSP / 光互连',
        facts: ['数据中心收入 6 个季度约 0.82 → 1.49 US$B（frame mini）', 'custom silicon 未单列披露（K25）'],
        risks: ['项目制收入波动', '大客户项目节奏'],
        disclaimer: '无评级 · 无目标价' },
      { name: 'MediaTek', gate: 'ASIC turnkey（4Q26 触发器）',
        facts: ['进入云厂 ASIC 供应链（研究综合）', '4Q26 指引为八触发器之一（S1）'],
        risks: ['消费周期对冲 ASIC 增量', '进度低于预期风险'],
        disclaimer: '无评级 · 无目标价' },
      { name: 'GUC', gate: 'TSMC 系 ASIC 设计服务',
        facts: ['收入锯齿与 crypto 占比联动（K38）', '先进制程设计服务能力（研究综合）'],
        risks: ['单一大客户依赖', 'crypto 敞口残留'],
        disclaimer: '无评级 · 无目标价' },
      { name: 'Alchip', gate: '3nm ASIC 设计服务',
        facts: ['收入锯齿显著（K37）', '3nm 项目进度为八触发器之一（S3）'],
        risks: ['crypto 历史敞口', '项目延迟风险'],
        disclaimer: '无评级 · 无目标价' },
      { name: 'VeriSilicon', gate: 'IP 授权 + 定制（中国大陆敞口）',
        facts: ['IP + 定制双模式（公司披露）', '出口管制敏感（2022-10-07 事件）'],
        risks: ['盈利波动', '政策敞口'],
        disclaimer: '无评级 · 无目标价' }
    ],
    note: '六家公司位于供应链收费关口；仅供信息参考，不构成投资建议'
  };
})();
