/* ============================================================================
 * js/sources.js — inference-silicon-cn 三层来源系统（数据层）
 * 纯 Vanilla JS。加载位置：js/data.js 之后、js/charts/* 之前（依赖 window.K，
 * 不依赖 window.Utils 的加载时机 —— Utils 仅在点击弹出出处卡时取用）。
 *
 * 导出全局对象（幂等：重复执行安全，已绑定元素不重复绑定）：
 *   window.SOURCES      全量来源条目数组，由 K1–K41 注册表的 source/asOf 字段
 *                       聚合去重生成，每条 {id, category, title, org, date, note,
 *                       refs, aggregated}；category ∈ 公司披露 | 券商研究 |
 *                       行业与官方 | 研究综合；每条带日期；聚合转载类
 *                       aggregated=true 且 note 标注「不进入情景计算」。
 *   window.DRILL_FACTS  关键数字的出处映射 {K 编号: {fact, cite, bigNumber?,
 *                       bigLabel?}}；fact=中文一句话事实，cite=来源+日期。
 *   window.SourceCards  {bind(root), open(key)}：
 *                       bind 给 root 内所有 [data-source]（值为 K 编号或来源 id）
 *                       元素挂点击/键盘行为，弹出出处卡（复用 Utils.drill，
 *                       内容={fact, cite, category, date}）；并给元素加
 *                       .src-btn 类渲染为 ◆ 小按钮（样式由 CSS 负责，不改文案）。
 *
 * 属性约定（index.html 使用）：<span data-source="K5">412.9</span>
 * ============================================================================ */
(function () {
  'use strict';

  /* ============================ 类别归一 ============================ */
  var CATEGORIES = ['公司披露', '券商研究', '行业与官方', '研究综合'];

  function classify(src) {
    if (!src) return '研究综合';
    if (/券商/.test(src)) return '券商研究';
    if (/行业与官方|WSTS|SEMI|IEA|BIS|JEDEC|SIA/i.test(src)) return '行业与官方';
    if (/公司披露|公司史料/.test(src)) return '公司披露';
    return '研究综合';
  }

  /* ============================ SOURCES 生成 ============================
   * 从 window.K 的 source 字段聚合去重；每种来源一条，date 取引用条目中最晚
   * 的 asOf；refs 记录引用它的 K 编号。标题/机构为可读化整理（数值仍以
   * data.js 为准，此处不含任何新数字）。 */
  var SOURCE_TITLES = {
    '研究综合': { title: '研究综合（本报告重建、测算与判定）', org: 'Kimi Research' },
    '公司披露（研究综合加总）': { title: 'Top-4 云厂资本开支（研究综合加总）', org: 'Amazon / Microsoft / Google / Meta' },
    '券商研究': { title: '券商研究（份额、产能与出货估计，多家并列）', org: '券商研究' },
    '公司披露（Broadcom）': { title: 'Broadcom 定制 ASIC SAM 指引（2027E）', org: 'Broadcom' },
    '公司披露（研究综合计算）': { title: 'NVIDIA 数据中心分部收入（研究综合计算）', org: 'NVIDIA' },
    'WSTS / 公司披露（研究综合）': { title: '2001 年行业与 FPGA 双寡头收入降幅', org: 'WSTS / Xilinx / Altera' },
    '行业与官方（SEMI，口径分歧）': { title: '半导体设备销售（口径分歧，不列单点）', org: 'SEMI' },
    '公司披露（AWS）': { title: 'AWS Trainium 部署披露', org: 'AWS' },
    '公司披露（Broadcom 财报电话会）': { title: 'Broadcom 财报电话会：XPU 客户与订单', org: 'Broadcom' },
    '公司披露': { title: '公司披露（财报、公告与发布资料）', org: '各公司' },
    '行业与官方（IEA）': { title: '数据中心用电展望（415 → 945 TWh）', org: 'IEA' },
    '公司披露（Anthropic × Google）': { title: 'Anthropic × Google TPU 多年期扩容协议', org: 'Anthropic / Google' },
    '公司披露（研究综合）': { title: 'NVIDIA crypto 库存冲击（研究综合整理）', org: 'NVIDIA' },
    '公司披露（约数取整）': { title: '台湾 ASIC 设计公司月度营收（约数取整）', org: 'Alchip / GUC' },
    '公司披露（NVIDIA · Computex）': { title: 'NVLink Fusion 发布（Computex 2025）', org: 'NVIDIA · Computex' },
    '公司披露（AWS re:Invent 2024）': { title: 'AWS Trainium 2 出货披露（re:Invent 2024）', org: 'AWS' },
    '公司披露（Broadcom Q2 FY26）': { title: 'Broadcom Q2 FY26：XPU 客户、AI backlog 与 AI 指引', org: 'Broadcom' },
    '公司披露（Google Cloud Next）': { title: 'Google TPU 8t/8i 发布（Cloud Next 2026）', org: 'Google Cloud' },
    '公司披露（SK hynix）+ 供应链核查': { title: 'SK hynix HBM 供应售罄（公司表述）与供应链核查', org: 'SK hynix' },
    '供应链核查（券商）+ 公司口径（TSMC AGM 2026-06）': { title: 'CoWoS 供需：供应链核查与 TSMC AGM 表述', org: 'TSMC / 券商' },
    '公开推理定价页汇编': { title: '公开推理定价页汇编（前沿推理价格）', org: '各推理服务商' }
  };

  function latestDate(dates) {
    var best = '';
    dates.forEach(function (d) { if (d && d > best) best = d; });
    return best;
  }

  function buildSources() {
    var K = window.K || {};
    var bySrc = {}; // source 字符串 → 聚合桶
    var order = [];
    Object.keys(K).forEach(function (kid) {
      var e = K[kid];
      if (!e || !e.source) return; // K27 保留项无来源，跳过
      if (!bySrc[e.source]) {
        bySrc[e.source] = { src: e.source, dates: [], refs: [] };
        order.push(e.source);
      }
      bySrc[e.source].refs.push(kid);
      if (e.asOf) bySrc[e.source].dates.push(e.asOf);
    });

    var entries = order.map(function (src) {
      var b = bySrc[src];
      var t = SOURCE_TITLES[src] || { title: src, org: src.replace(/[（）]/g, ' ').trim() };
      return {
        category: classify(src),
        title: t.title,
        org: t.org,
        date: latestDate(b.dates),
        note: '引用：' + b.refs.join('、'),
        refs: b.refs,
        aggregated: false
      };
    });

    /* 聚合转载类：K 条目 note 中出现「媒体口径 / 未获确认 / 转载」的数字
     * 只作背景，单独列条目并标注「不进入情景计算」。 */
    Object.keys(K).forEach(function (kid) {
      var e = K[kid];
      if (!e || !e.note) return;
      if (!/媒体口径|未获确认|转载/.test(e.note)) return;
      entries.push({
        category: '研究综合',
        title: '媒体口径数字：' + e.label,
        org: '媒体 / 聚合转载',
        date: e.asOf || '',
        note: '聚合转载 · 不进入情景计算 —— ' + e.note,
        refs: [kid],
        aggregated: true
      });
    });

    /* 排序：四类顺序 → 日期降序；赋稳定 id */
    entries.sort(function (a, b) {
      var ca = CATEGORIES.indexOf(a.category), cb = CATEGORIES.indexOf(b.category);
      if (ca !== cb) return ca - cb;
      return a.date < b.date ? 1 : (a.date > b.date ? -1 : 0);
    });
    entries.forEach(function (e, i) {
      e.id = 'S' + (i + 1 < 10 ? '0' : '') + (i + 1);
      if (e.aggregated && e.note.indexOf('不进入情景计算') === -1) {
        e.note = '聚合转载 · 不进入情景计算 —— ' + e.note;
      }
    });
    return entries;
  }

  /* ============================ DRILL_FACTS 生成 ============================
   * 全部 K 条目自动成句（label + value + unit + note），主要条目用 curated
   * 句子与大数字覆盖。fact=中文一句话事实，cite=来源+日期。 */
  var CURATED = {
    K1: { fact: 'Base case：以美元口径计，2025→2028E 增长约 2.5 倍（区间 2.0–4.7×）；3.0–4.3× 旧链已作废（do not cite）；情景乘法只使用美元口径。',
      bigNumber: '≈2.5×', bigLabel: 'Base case · 区间 2.0–4.7× · 2025→2028E' },
    K2: { fact: 'Conservative case：TAM 路径达成、份额停留在 2026F 读数（≈16%），三年约 2.0 倍（band 1.9–2.1×，美元口径）。',
      bigNumber: '≈2.0×', bigLabel: 'Conservative · band 1.9–2.1×' },
    K3: { fact: 'Contraction case：kill switch 触发后进入的路径，三年 −15% 至 −35%（压力参照，非预测）。',
      bigNumber: '−15%~−35%', bigLabel: 'Contraction · 美元口径 · 三年' },
    K4: { fact: 'Kill switch：若 Top-4 云厂 2027 年资本开支同比增速低于 +14%，Base 与 Conservative 情景失效；阈值刻意低于全部券商 2027 测算（K30）。',
      bigNumber: '+14%', bigLabel: 'Top-4 2027 capex 增速阈值' },
    K5: { fact: 'Amazon、Microsoft、Google、Meta 四家 2025 年资本开支合计约 4,100–4,130 亿美元（编制估计 compiled estimate）；2026 年指引区间 6,950–7,250 亿美元（Amazon ≈200 / Microsoft ≈190 日历年 / Alphabet 180–190 / Meta 125–145）。',
      bigNumber: '$410–413B', bigLabel: 'Top-4 云厂 capex · 2025 · 编制估计' },
    K6: { fact: '定制 ASIC 单位口径份额：2024 约 30% → 2027F 主张约 50%（券商口径）；TrendForce 27.8% 为 2026 AI 服务器口径（2025 为 20.9%），分母不同，不贴 2027；不与 CoWoS、美元口径混用。',
      bigNumber: '≈50%', bigLabel: '单位口径 · 2027F 主张（券商）' },
    K7: { fact: 'CoWoS 分配口径份额 2026E 约 30% → 2027F 约 34%，误差带 ±10–20%；不与单位、美元口径混用。',
      bigNumber: '≈30%', bigLabel: 'CoWoS 分配口径 · 2026E' },
    K8: { fact: '美元口径（Series A）：8%（2024）→ 12%（2025E）→ 16%（2026F）→ 20%（2027F）——情景计算唯一使用的口径。',
      bigNumber: '≈20%', bigLabel: '美元口径 · 2027F · 情景唯一口径' },
    K9: { fact: 'Broadcom 于 2024-12 给出 2027 年定制 ASIC SAM 600–900 亿美元（Hock Tan 原话「$60–90B in fiscal 2027」），仅限其既有客户群口径，不外推全行业。',
      bigNumber: '$60–90B', bigLabel: '2027E SAM · 既有客户群口径' },
    K10: { fact: 'NVIDIA 数据中心分部收入自 $4.28B（Q1 FY2024，截至 2023-04）增至 $75.2B（Q1 FY2027，截至 2026-04）——约 17.6 倍，12 个季度间隔、13 个季度观测值。',
      bigNumber: '≈17.6×', bigLabel: '12 个季度间隔 · 13 个季度观测值' },
    K12: { fact: 'CoWoS 产能约 7–8 万片/月（2025 末）→ 12–13 万片/月（2026 末目标），第三方估计（TSMC 不指引 kwpm），±10–20%。' },
    K13: { fact: 'HBM 占 DRAM 收入约 8%（2023）→ 33%（2026E）→ 41%（2027F，估计框架）；位元占比远低于收入占比。',
      bigNumber: '8% → 41%', bigLabel: '占 DRAM 收入 · 2023 → 2027F' },
    K14: { fact: 'SK hynix 2026 年 HBM 供应售罄；客户需求超其三年产能路线图（公司表述）。',
      bigNumber: '售罄', bigLabel: '2026 HBM · SK hynix' },
    K15: { fact: 'HBM 价格约为常规 DRAM 的 5–6 倍（每 bit，券商估计）；年度合约重签，方向：HBM4 溢价。',
      bigNumber: '≈5–6×', bigLabel: '每 bit 相对常规 DRAM' },
    K17: { fact: '2001 年半导体行业收入 −32%（WSTS 口径），FPGA 双寡头 Xilinx 与 Altera 各约 −39%。',
      bigNumber: '−32% / ≈−39%', bigLabel: '2001 · 行业 / FPGA 双寡头 · YoY' },
    K19: { fact: '达成 50% 单位份额所需量：2027F 约 800–840 万颗 TPU 级芯片（非 K31 区间中值）；估计并列展示，不强行统一。',
      bigNumber: '8.0–8.4', bigLabel: '百万颗 · 50% 单位份额所需量' },
    K20: { fact: 'AWS 披露 Trainium 2 在 12 个月内出货 140 万颗，环比约 10 倍（re:Invent 2024）。',
      bigNumber: '140 万颗', bigLabel: 'Trainium 2 · 12 个月 · re:Invent 2024' },
    K21: { fact: 'TSMC 每 GW 收入派生值约 21 亿美元：≈$3.5k（逻辑 + CoWoS + 中介层）/ 颗 × ≈60 万颗 / GW ≈ $2.1B；数量级派生，对颗数与价格假设敏感。',
      bigNumber: '≈$2.1B/GW', bigLabel: '派生值（含公式）' },
    K22: { fact: '前沿推理价格以约 10×/年 的速度下降（公开推理定价页汇编，数量级口径）；mix-shift 与代际效应主导。',
      bigNumber: '≈10×/年', bigLabel: '前沿推理价格 · 数量级' },
    K23: { fact: 'Broadcom（2026-06-03，Q2 FY26）：6 家合格 XPU 客户（Google、Meta、ByteDance、OpenAI、Anthropic、Fujitsu）+ 2 家爬坡；AI backlog 约 730 亿美元以上；FY26 AI 约 560 亿美元、FY27 AI 超 1,000 亿美元（指引）。2025-09 的「3+1 / >US$10B」口径已过期（STALE），不用。',
      bigNumber: '6 + 2', bigLabel: '合格客户 + 爬坡 · FY27 AI >$100B' },
    K26: { fact: '全球数据中心用电量约 415 TWh（2024）→ 约 945 TWh（2030E，IEA 口径）；GB200 NVL72 机柜约 120 kW。',
      bigNumber: '415 → 945', bigLabel: 'TWh · 2024 → 2030E · IEA' },
    K28: { fact: 'TPU 8t/8i 于 2026-04-22（Cloud Next）发布，单颗约 9 PFLOPS FP4（估计，精度口径最宽），2026 晚些 GA。',
      bigNumber: '≈9 PFLOPS', bigLabel: 'TPU 8t/8i · FP4 估计' },
    K29: { fact: 'Top-4 合计 capex/OCF：0.45–0.56（2021–24，披露）→ 0.80（2025）→ 1.21 中点（2026E，区间 1.18–1.24）；OCF 2026E 约 5,870 亿美元为 working estimate（无公开一致预期）；>1.0 = 合计 capex 超合计经营现金流。',
      bigNumber: '0.80 → 1.21', bigLabel: 'capex/OCF · 2025 → 2026E 中点' },
    K30: { fact: '2027 年 Top-4 capex 三家券商测算：$520B / $568B / $591B，均在 +14% 之上——kill switch 阈值（K4）刻意低于全部第三方测算。',
      bigNumber: '$520/568/591B', bigLabel: '2027E · 三家券商测算' },
    K31: { fact: 'TPU 出货 2026 年已发表估计区间 650–1,500 万颗（2025→2027F），并列展示，不强行统一；区间中值 1,075 万颗。',
      bigNumber: '6.5–15', bigLabel: '百万颗 · 2026 已发表估计' },
    K32: { fact: 'Anthropic 与 Google 签订多年期扩展协议：约 100 万颗 TPU，2026 年上线容量超过 1 GW。' },
    K33: { fact: '美元口径 2027F 约 20%（Series A），未交叉：单位口径可能交叉（K19），美元口径 GPU 仍占优。' },
    K36: { fact: 'NVIDIA 经历两次 crypto 库存冲击（2019 / 2022）；Q4 FY19 游戏分部单季 −45% YoY（crypto hangover）。',
      bigNumber: '−45%', bigLabel: 'Q4 FY19 游戏分部 · YoY' },
    K37: { fact: 'Alchip：挖矿收入占比峰值 30–40%；年收入 2017 NT$6.9B → 2018 NT$5.24B → 2019 NT$3.87B（锯齿）；2023 起 AI 占比约 70%。' },
    K38: { fact: 'GUC：挖矿 NRE 占比峰值约 20%（2018）；年收入约 NT$11.6B（2017）→ 约 NT$24.9B（2024）。' },
    K39: { fact: 'NVIDIA 于 2025-05 Computex 发布 NVLink Fusion，向第三方 XPU/CPU 开放 NVLink 互连生态。' },
    K41: { fact: 'NVIDIA-inside 路径以许可/平台方式出现：NVLink Fusion（2025-05-19）+ Groq 非独占许可（2025-12-24，约 200 亿美元，CNBC 报道未获确认，不进入情景计算）。' }
  };

  function autoFact(e) {
    var s = e.label + '：' + (e.value !== undefined ? e.value : '未披露');
    if (e.unit && e.unit !== '—') s += '（' + e.unit + '）';
    s += '。';
    if (e.note) s += e.note;
    return s;
  }

  function autoBig(e) {
    var v = e.value;
    if (typeof v === 'number') return { bigNumber: String(v), bigLabel: e.unit || '' };
    if (typeof v === 'string' && v.length <= 14 && /^[≈~+\-−\d$]/.test(v)) {
      return { bigNumber: v, bigLabel: e.unit || '' };
    }
    return {};
  }

  function buildDrillFacts() {
    var K = window.K || {};
    var out = {};
    Object.keys(K).forEach(function (kid) {
      var e = K[kid];
      if (!e || !e.source) return; // K27 保留项跳过
      var cite = e.source + ' · ' + (e.asOf || '日期待核');
      var cur = CURATED[kid] || {};
      var entry = { fact: cur.fact || autoFact(e), cite: cite };
      var big = cur.bigNumber ? { bigNumber: cur.bigNumber, bigLabel: cur.bigLabel || e.unit || '' } : autoBig(e);
      if (big.bigNumber) { entry.bigNumber = big.bigNumber; entry.bigLabel = big.bigLabel; }
      out[kid] = entry;
    });
    return out;
  }

  /* ============================ 构建（幂等，等待 window.K） ============================ */
  var built = false;
  function build() {
    if (built || !window.K) return;
    built = true;
    window.SOURCES = buildSources();
    window.DRILL_FACTS = buildDrillFacts();
  }
  window.SOURCES = window.SOURCES || [];
  window.DRILL_FACTS = window.DRILL_FACTS || {};
  build();
  if (!built) {
    document.addEventListener('DOMContentLoaded', build); // 兜底：加载顺序异常时
  }

  /* ============================ SourceCards ============================ */
  function findSource(id) {
    var list = window.SOURCES || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  /* 弹出出处卡：内容 = {fact, cite, category, date}（K 编号附大数字/期间） */
  function open(key) {
    key = (key || '').trim();
    if (!key || !(window.Utils && Utils.drill && typeof Utils.drill.open === 'function')) return;
    build(); // 兜底：确保注册表已生成
    var payload;
    var f = window.DRILL_FACTS[key];
    var e = window.K && window.K[key];
    if (f && e) {
      payload = {
        title: key + ' · ' + e.label,
        category: classify(e.source),
        period: f.bigNumber ? '' : (e.unit && e.unit !== '—' ? e.unit : ''),
        bigNumber: f.bigNumber,
        bigLabel: f.bigLabel,
        body: f.fact,
        cite: f.cite
      };
    } else if (f) {
      payload = { title: key, category: '研究综合', body: f.fact, cite: f.cite,
        bigNumber: f.bigNumber, bigLabel: f.bigLabel };
    } else {
      var s = findSource(key);
      if (s) {
        payload = {
          title: s.id + ' · ' + s.title,
          category: s.category,
          period: s.refs && s.refs.length ? '引用：' + s.refs.join('、') : '',
          body: s.note,
          source: s.org,
          date: s.date
        };
      } else {
        payload = {
          title: '出处 · ' + key,
          category: '研究综合',
          body: '该编号未在来源注册表（K1–K41 / SOURCES）中登记。',
          source: 'inference-silicon-cn 来源注册表',
          date: '2026-07-18'
        };
      }
    }
    Utils.drill.open(payload);
  }

  /* 给 root 内所有 [data-source] 元素挂行为；加 .src-btn 类（◆ 样式由 CSS
   * 负责，不改动元素文案）。幂等：data-src-bound 守卫。 */
  function bind(root) {
    root = root || document;
    var nodes = root.querySelectorAll('[data-source]');
    Array.prototype.forEach.call(nodes, function (node) {
      if (node.dataset && node.dataset.srcBound) return;
      if (node.dataset) node.dataset.srcBound = '1';
      node.classList.add('src-btn');
      var tag = node.tagName.toLowerCase();
      if (tag !== 'button' && tag !== 'a') {
        node.setAttribute('role', 'button');
        node.setAttribute('tabindex', '0');
      }
      node.setAttribute('aria-haspopup', 'dialog');
      if (!node.getAttribute('title')) node.setAttribute('title', '点击查看出处');
      node.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        open(node.getAttribute('data-source'));
      });
      node.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          open(node.getAttribute('data-source'));
        }
      });
    });
  }

  window.SourceCards = { bind: bind, open: open };

  /* 自动绑定：DOM 就绪后扫描全文档（index.html 的 data-source 元素） */
  function autobind() { bind(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autobind);
  else autobind();
})();
