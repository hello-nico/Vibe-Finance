---
name: Vibe-Finance
description: Calm Market Cockpit — 投研助手的视觉与交互设计系统。
sourceOfTruth: prototype/shared.css
themeScript: prototype/theme.js
marketModule: prototype/market/
stockModule: prototype/stock/
themes: [amber, mint, dark]
defaultTheme: amber
colors:
  # 结构由 shared.css 的 CSS 变量定义；此处为文档快照，以源文件为准
  primary: "hsl(15 89% 56%) · Research 暖橙 ≈#F35D2B"
  market-up: "A-share red (locked · --danger)"
  market-down: "A-share green (locked · --success)"
typography:
  quote: { fontSize: "22px", fontWeight: 600, lineHeight: 1.1 }
  title: { fontSize: "14px", fontWeight: 600, lineHeight: 1.25 }
  body: { fontSize: "13px", fontWeight: 400, lineHeight: 1.5 }
  label: { fontSize: "11px", fontWeight: 500, lineHeight: 1.2 }
  caption: { fontSize: "10px", fontWeight: 400, lineHeight: 1.35 }
rounded: { control: "8px", surface: "16px · --radius-card", pill: "999px" }
spacing: { base: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", "2xl": "32px" }
shadow: { sm: "tight contact + light ambient", glass: "--glass-shadow", md: "drawer / floating only" }
---

# Design System: 投研助手（Vibe-Finance）

> **Runtime source of truth:** [`prototype/shared.css`](../prototype/shared.css)  
> **Theme switcher:** [`prototype/theme.js`](../prototype/theme.js)  
> 本文是可解释的设计契约；色值/尺寸以 CSS 变量为准。文档与源码冲突时，**改文档或改源码，但以源码行为为真**。
>
> **行情总览页面规范：** [`market_overview_standard.md`](./market_overview_standard.md) 定义 Dashboard 边界、分组、刷新和文案纪律；本文件定义其视觉系统。

本系统继承 Maka「Companion Command Center」的纪律（克制、可检视、中文优先），面向**行情驾驶舱 + 研究工作台**重写品牌与语义；并以 [killaislop.com](https://killaislop.com/) 的 slop 图鉴作为反面验收标准——产品要像**有人做过决定的投研工具**，不像生成默认页。

---

## 1. North Star

**Creative North Star: “Calm Market Cockpit”（冷静行情驾驶舱）**

- 开屏先看到**市场在发生什么**（热力、指数、主题），再下钻研究。
- 密度可读：扫盘优先，不为「高级感」牺牲对比与信息。
- AI 在侧：**显式动作**（复盘 / 提炼 / 读这只股），不靠 ✨ 装饰证明自己智能。
- 中文优先；无吉祥物、无表演型亲和。

**不是：**

- Indigo / 紫粉渐变 SaaS 着陆页  
- 发光玻璃卡片墙  
- 奶油纸 + 展示衬线的「第二波 AI 制服」  
- 全站黑客终端戏服  

---

## 2. Six principles（避免 AI slop）

译自 killaislop 六条，写成投研可执行标准：

### 2.1 Decide before you decorate · 先决定，再装饰

每个视觉选择必须说得出理由。说不出的，就是别人的默认值（Tailwind 演示、模型缩略图偏好）。

### 2.2 One accent, one voice · 一个主色，一种嗓音

- **每个 theme 只有一条 accent**（另配 `accent-ink` / `accent-soft` 为同一色相的深浅与淡底，不算第二品牌色）。
- 文案整站像同一个人说话：具体、可核对，不用对称空话和「不止是…更是…」。

### 2.3 Hierarchy from scale and space · 层级来自字号与留白

用字号、字重、间距排主次。**禁止**靠渐变字、中途换衬线、满段加粗来假装重点。

### 2.4 Subtract first · 先做减法

Slop 是堆出来的。先删到每一样非在不可：badge、callout、左边条、emoji 默认不出现。

### 2.5 Specific beats loud · 具体胜过响亮

「近 5 年 PE 分位 42%」优于「智能洞察市场 ✨」。数字须可追溯来源；无测量就不写社会证明条。

### 2.6 Decoration must mean something · 装饰必须有语义

图标、色点、左条、徽章都是**信号**。铺满则信号归零。  
例：热力色 = 涨跌；报价卡左条 = 涨跌；mono = 证据型数字；主题切换图标 = 下一档外观。

---

## 3. Color tokens

### 3.1 三层模型

| 层 | 内容 | 谁能改 |
|---|---|---|
| **结构层** | `--radius`、字体栈、间距习惯 | 产品级，罕改 |
| **主题层** | `bg / surface / sunken / fg* / accent* / border / hover / selected / shadow*` | `data-theme` 三套 |
| **业务语义层** | `--up` / `--down`（及 ok/warn/err） | **锁死**；不跟 brand 走 |

### 3.2 三套主题

通过 `html[data-theme="…"]` 切换，持久化键 `vf-theme`。

| Theme | 气质 | 用途 |
|---|---|---|
| **`amber`（默认）** | 暖琥珀点缀 + 近中性暖底 | 默认投研气质；有记忆点但不刷焦糖 |
| **`mint`** | 薄荷底 + teal 向 accent + 深绿 ink | 助手/生产力向；参考 workbench 绿系 |
| **`dark`** | 冷深底 + 琥珀强调；涨跌单独提亮 | 盘中久看 |

**规则：**

- 温度来自**克制的一点 accent + 文案**，不是整页暖铺（kill: warm ramp 滥用）。
- **Mint 的 brand 绿 ≠ 下跌绿**：accent 偏 teal（~175°），down 偏青相绿且与 ink 分离，避免 CTA 与跌幅同色。
- 暗色：**一个 flat 背景贯穿**；深度靠 tonal 阶 + hairline + 轻 shadow，不用径向聚光灯渐变底。

### 3.3 Accent 三档（每肤一套）

| Token | 用途 |
|---|---|
| `--accent` | 焦点环、小点缀、描边提示 |
| `--accent-ink` | 主按钮、关键链接、选中字色 |
| `--accent-soft` | 选中底、意图卡淡底 |

**Signal, not texture：** accent 表动作/状态，不作页面背景洪水。

### 3.4 文字色四阶

| Token | 角色 |
|---|---|
| `--fg` | 主文、关键数字 |
| `--fg-2` | 次级正文 |
| `--fg-3` | 标签、未激活控件 |
| `--fg-4` | 时间戳、 titcker 弱信息 |

Wash（`--hover` 等）是**表面**，不是字色。

### 3.5 Market semantics（锁）

| Token | 含义 |
|---|---|
| `--up` | A 股红涨 |
| `--down` | A 股绿跌 |
| 热力 `hm-up-*` / `hm-down-*` / `hm-flat` | 绝对色阶，**不**跟随 theme accent |
| PE 分位条 low/mid/high | 估值位置编码（可保留有限三色）；**不要**拿同一套去刷 info/success/error 提示盒 |

状态文案优先：**加粗「错误 / 警告」+ 中性底**；色只点真正要区分的态。屏幕上很少需要红黄绿三灯同时大面积亮。

---

## 4. Typography

### 4.1 Faces

| 角色 | 选择 | 理由 |
|---|---|---|
| UI / 正文 | 系统栈：`-apple-system, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif` | 工具服从 OS；中文可读；**有意选择**，不是偷懒套 Inter 制服 |
| 数字 / 代码 | `"Geist Mono", ui-monospace, …` + `tabular-nums` | **Native Voice：** mono 只给证据——价格、涨跌幅、PE、代码、时间 |

**禁止：** 仪表盘展示衬线、正文 Playfair/Lora、一句话里 sans/serif 混搭、全站 mono 终端皮。

### 4.2 Scale（级差要够）

| 角色 | 约值 | 备注 |
|---|---|---|
| Quote / 主名 | 22px / 600 | 个股、行业报价 |
| Title | 14–15px / 600 | 区块标题 |
| Body | **13px** / 400 | 根字号 |
| Label | 11px / 500 | 顶栏、chip、控件 |
| Caption | 10–11px / 400–500 | panel-head、同步时间 |
| Mono | 跟随层级 | `letter-spacing: -0.01em ~ -0.02em` |

少而陡的台阶（≥1.25× 体感）。差 1–2px 的两级应合并。  
**禁止：** 整句 72px 展示字、整站挤在 14–18px 靠灰色分出层次。

---

## 5. Spacing

按**关系**给间距，不是一个 token 铺满：

- 组内紧、组间松（标题贴其正文，区块与区块推开）。
- 建议刻度：**4 / 8 / 12 / 16 / 24 / 32**（与 frontmatter 一致）。
- 页边约 14–16px；研究/数据主区可略宽。

---

## 6. Elevation & surfaces

### 6.1 规则

- **One working plane：** 主内容区少叠「卡片阴影墙」；用分割与 tonal 阶。
- **Hairline first：** 多数分离一条发丝边（`--glass-stroke` / `--border`）。
- **Shadow scale：**
  - `--shadow-sm`：轻接触影（次级）
  - `--glass-shadow`：主区玻璃卡（柔环境影 + **inset 顶高光**）
  - `--shadow-md`：仅浮层备用  
- 阴影模拟**高度**：模糊有度；无彩色 glow；阴影不大于物体。
- **Dark restraint：** 暗色 glass 用低不透明白填充 + 同配方 blur；禁止 neon 描边洪水。

### 6.1b FROZEN v1 · Dashboard + Table（禁止私改）

行情总览已冻结共享组件（`shared.css` 中 `FROZEN v1` 段）。**后续所有页面/模块必须复用，不得在页面内联覆盖。**

| 类名 | 用途 |
|---|---|
| `.ds-sec` / `.ds-sec-h` / `.ds-ico` | 区块标题（可带图标） |
| `.ds-card` + `.glass` | 外层毛玻璃大卡 |
| `.ds-tile` / `.ds-tile-lg` / `.ds-tile-grid` | 内嵌指标块：`muted/28` 底、**无描边** |
| `.ds-table-wrap` + `.ds-table` | 表格：亮色白描边 glass；表头浅底；行间 hairline；`.up/.down`=涨跌 |
| `.ds-table-wrap.is-flat` | 嵌在 card 内的表（无外框） |
| `.ds-split` + flow row | 双栏列表（资金轮动） |

兼容：旧 `.ov-*` 已挂同一规则。改视觉只改 `shared.css` 冻结段。

### 6.1c 原型模块结构（v3 · 目录组件化）

**核心纪律：动态数据 + 固定布局 + AI 辅助解释（助手复用）。**  
薄 HTML 壳只挂载；数据 / 渲染 / 壳 / 助手分文件；样式真源仍是 `shared.css`（页专属样式可放模块 CSS，**不改** FROZEN `.ds-*`）。

#### 全站共享

| 文件 | 角色 |
|---|---|
| [`prototype/shared.css`](../prototype/shared.css) | 主题 token（Research 字面量）+ glass + FROZEN + 行情/资讯样式 |
| [`prototype/theme.js`](../prototype/theme.js) | 主题切换（amber / mint / dark） |

#### 行情 Mode · `prototype/market/`

| 文件 | 角色 |
|---|---|
| [`01-market.html`](../prototype/01-market.html) | **总览**入口：检索 / 大盘指数 / 指数市盈率 / 热力 / 市场情绪 / 短线情绪 / 成交额 Top20 / 资金轮动 |
| [`market/shell.js`](../prototype/market/shell.js) | 壳：topbar + rail + `mkt-nav`（顶层 Tab + 总览页内目录）+ agent dock |
| [`market/data.js`](../prototype/market/data.js) | mock：sectors / tracks / newsDemo / filings / publicNews |
| [`market/components.js`](../prototype/market/components.js) | 一函数一卡：资讯 Tab 体、Investment 面板、关注聚合列表、板块网格 / 详情、Dashboard 标题栏 / 刷新交互 |
| [`market/agent.js`](../prototype/market/agent.js) | 助手 dock；页面设 `window.MKT_AGENT_CTX`（可选 `suggest`） |
| [`market/sectors.html`](../prototype/market/sectors.html) | **板块中心**：完整赛道卡片网格；左栏另设热门板块快捷导航 |
| [`market/sector-detail.html`](../prototype/market/sector-detail.html) | **板块详情**：`?key=`；返回板块中心 · 核心环节 pill ·「让 AI 拆这个板块」（对齐 Research SectorDetail）；与 `04-industry`（行业财务）分流 |
| [`market/intel.html`](../prototype/market/intel.html) | **资讯雷达**：页内 Tab + 固定卡布局 |

壳用法：页面写 `<div id="shell-root" data-view="overview\|sectors\|intel"></div>` + `<main class="main-area">`，脚本顺序：`data.js` → `shell.js` → `agent.js` →（可选）`components.js`。

#### 个股详情 · `prototype/stock/`

| 文件 | 角色 |
|---|---|
| [`05-stock.html`](../prototype/05-stock.html) | 壳：topbar / rail / crumb「加入研究」/ `#stk-root` / agent |
| [`stock/data.js`](../prototype/stock/data.js) | mock（默认寒武纪；`?name=` 切换） |
| [`stock/components.js`](../prototype/stock/components.js) | 一函数一卡：概览 / 财报速览 / 估值分位 / 财务 / 研报 / 公告 / 新闻 / 资金 / 解禁 / 概念 |
| [`stock/page.js`](../prototype/stock/page.js) | 挂载 + 加入研究 + 助手接线 |
| [`stock/stock.css`](../prototype/stock/stock.css) | 个股专有：估值带、列表行、pill（不改 FROZEN） |

结构对齐 Vibe-Research `StockData.tsx` 字段栈；**无**页内搜索框；AI 走助手抽屉，不另起渐变 AskAi 按钮。

#### 其他页面（尚未目录化）

| 文件 | 角色 |
|---|---|
| `02-research.html` | 研究池（`obj-nav` 行业/个股列表） |
| `03-data.html` | 数据 |
| `04-industry.html` | 行业财务详情（`ind-shell` + 加入研究；与行情「板块详情」分流） |

### 6.2 Structured Glass（v6.5 · 贴边 glass）

色值与玻璃配方 **字面抄** `Vibe-Research/frontend/src/index.css`（HSL + rgba）。

**主题**

| Finance | = Research |
|---|---|
| `amber`（默认亮） | `.light` 暖橙 |
| `mint` | 画布微绿 + **同一套** Research 橙动作色 |
| `dark` | Research `:root` 暗色暖橙 |

**画布**

- Research 双光晕：顶 `hsl(15 … / 0.08)` + 角 `hsl(220 … / 0.06)`（暗色 0.11 / 0.08）
- `shell` 透明

**主区 `.glass`**

- fill `0.7 / 0.35`（亮）· `0.055 / 0.012`（暗）
- blur **14px**（无 saturate）
- 亮影 `0 10px 26px rgba(30,60,100,.10)` + inset hi
- 暗影 `0 12px 30px rgba(0,0,0,.35)` + inset hi
- 圆角 16px

**侧栏：贴边 glass（非浮岛）**

- `.rail` / `.mkt-nav` / `.obj-nav` / `.data-nav`：**贴满壳列**，无 `m-2` 外缝
- 材质：半透 `--nav-fill` + 同 blur；不是 Research 侧栏浮岛
- Active：`bg primary/15` + `text primary` + **`shadow-glow`**

**动作色**

- 主 CTA：实心 `--accent` + `--accent-fg` + glow
- 次 CTA / 图标钮：`primary/15` + 橙字（勿写死绿）
- 涨跌绿/红只用于行情语义，不用于品牌图标

**禁止：** 每行 blur、彩边洪水、热力套玻璃、实心蜜桃选中块

### 6.3 Radius

| Token | 值 | 用途 |
|---|---|---|
| `--radius` | 8px | 控件、小块 |
| `--radius-lg` | **16px** | 玻璃主表面、面板 |
| `--radius-xl` | 20px | 可选更大容器 |
| pill | 999px | **仅** chip / 小 CTA / 主题相关小控件 |

内容卡不用 `rounded-full`。  
嵌套圆角：`inner ≈ outer − gap`，或内层不圆角。  
**border 与 border-radius 写在同一盒子上**（避免圆角裁切描边断角）。

### 6.4 容器纪律

- 一个区域**一层** surface。
- 内部用间距、对齐、细分隔线分组。
- 子级再开 surface，仅当它是独立对象（预览、嵌入、助手抽屉）。
- **禁止**三层以上 nested rounded+bordered 盒。

---

## 7. Layout shell

| 区域 | 规格 |
|---|---|
| Topbar | 高 36px；品牌 + 右侧全局状态；行情总览与个股详情使用同一个“实时行情”状态开关，其他页面保留同步 / 助手；不承载行情报价 |
| Rail | 宽 56px；图标 + 10px 字；应用级：行情 / 研究 / 数据 |
| 二级栏 | 行情 `mkt-nav`、研究 `obj-nav`、数据 `data-nav` 共用 220px 宽度、Tab 与 `Sidebar List`（搜索 / 分组标题 / 列表项 / 选中态）组件；叶子页使用与主区真实内容对应的目录，不显示“当前页面”这类通用占位文案，也不与目录重复设置第二套来源切换控件 |
| Main | `content-with-agent`：正文 ‖ 可选 `--agent-w`（340px）助手 |
| 左栏开合 | 收起只留 icon rail；展开 = rail + 二级栏（非整栏消失） |
| 品牌 | topbar 品牌名；不扩散为装饰系统 |

页面变体只改列宽，不改视觉语言：

| Shell class | 列 | 用途 |
|---|---|---|
| `.shell.market` | 56 + 220 + 1fr | 行情三页（总览 / 板块 / 资讯） |
| `.shell.research` | 56 + 220 + 1fr | 研究池 |
| `.shell.data` | 56 + 220 + 1fr | 数据 |
| `.shell.ind-shell` | 56 + 1fr | 个股 / 行业详情（无二级栏） |
| `+ .nav-collapsed` | dock → 56px（仅 rail），二级栏宽 → 0 | 全站；[`nav-collapse.js`](../prototype/nav-collapse.js)；`localStorage vf-nav` |

**左栏开合（强制）：** rail 底三件套对齐 Research——**主题 · 用户 · `<<`/`>>`**（无文字头像）；收起后 **icon rail 常驻**，不是整栏消失；与右侧助手可同时开。  
点击 **当前 Mode 的 rail** 始终切换二级栏开合；收起态为展开，展开态为收起。点击其他 Mode 则跳转并以展开态落地。`.nav-dock` 必须 `min-width: 0`，否则 grid 会把收起宽度撑回内容宽。

### 7.1 行情左栏（`mkt-nav`）

```text
总览 | 板块 | 资讯（顶层 Tab）
└─ 总览：指数 / 情绪 / 资金（页内目录；检索固定在主区顶部）
```

**规则（强制）：**

1. 顶层 Tab 用于总览 / 板块 / 资讯分页；总览内的紧凑目录只滚动同页 Dashboard，不复制主区数据。  
2. `指数` = 大盘指数 + 指数市盈率；`情绪` = 热力图 + 市场情绪 + 短线情绪；`资金` = 全市场成交额 Top20 + 资金轮动。  
3. 选中态：淡橙洗底 `primary/12` + 橙字（无重 glow 块），随主区滚动同步。  
4. 板块主区保留完整卡片网格；左栏使用与数据页相同的 `Sidebar List` 组件（搜索 + 分组标题 + 列表项 + 选中态），板块只额外声明 Lucide 图标与 6 个策展入口；选中快捷入口只高亮对应卡片，卡片本身再下钻至详情。资讯赛道只出现在 Investment News **页内 chips**。
5. 总览的每个数据 Dashboard 复用统一标题栏：`标题 + 短说明 + 刷新 + 时间`；总览标题不放问号提示。
   标题统一配 15px 线性图标，全部使用或全部不用；当前选择全部使用。
6. 大盘指数与指数市盈率分别是独立 Dashboard；市盈率标题栏在 panel 外，不与指数卡片组共用容器边界。热力图同样是一个独立 Dashboard，复用标题 / 刷新 / 时间；行业与个股只是内部内容，不增加子栏头。

对齐 Research：侧栏「资讯雷达」无二级入口；「板块中心」的嵌套列表在 Research 侧栏，**Finance 刻意不做**（避免与主区网格重复）。

### 7.2 行情三页布局

| 页 | 主区结构 |
|---|---|
| **总览** | 页头（标题 +「今日复盘」）→ 检索 → 指数（3/4/3 大盘指数 + 市盈率）→ 情绪（双热力 / 市场情绪 / 短线情绪）→ 资金（成交额 Top20 / 轮动双栏） |
| **板块中心** | 页头（+「解读板块」）→ `.sector-grid` 卡片（热门徽章 / 环节数）→ 点卡片或左栏热门进 `sector-detail.html?key=` |
| **板块详情** | ← 板块中心 · 标题/定位 · `.ov-cta`「让 AI 拆这个板块」· `.sector-node` 核心环节 · `.vf-disclaimer` |
| **资讯雷达** | 页头 → **页内 Tab** → 单一 `intel-panel` 大卡（内容随 Tab 换数据） |

---

## 8. Components

### 8.1 Buttons & chips

| 类型 | 表现 |
|---|---|
| 主 CTA / `.ov-cta` | `primary/15` 底 + 橙字 + 轻 glow（「今日复盘」「解读板块」「让 AI 提炼…」） |
| 次按钮 / 刷新 | 描边或幽灵；`ds-refresh` 图标钮 |
| 赛道 chip / `.news-chip` | `rounded-full` pill；选中 `border-primary` + `primary/15` |
| 过渡 | 120–200ms；只过渡 color / background / border / opacity |
| **禁止** | 渐变按钮、hover:scale 卡片、transition-all、bounce |

### 8.2 Panels & lists

- 主卡：`.glass` + `.ds-card` / `.intel-panel`  
- 列表行：底部分割线 + hover wash；时间 / 标签 / 标题分列 mono  
- **列表就是列表**：不对每行套 left-accent callout  

### 8.3 Heatmap

- 行业 | 个股双图；cell 可点下钻（行业 → `04-industry`，个股 → `05-stock`）  
- 涨跌色阶固定；hover 可用亮度/内描边，**不**用夸张 scale  
- Agent 开合改变主区宽度后必须重测（`mkt:agent-layout`）  

### 8.4 Quote / 个股卡片

- 详情页概览：名称 + 代码 + 机构覆盖 + **8 格指标**（`.stk-metric`）  
- 估值分位带：绿低估 / 灰合理 / 红高估 + 指针（`.stk-valband*`）  
- 行业/旧报价卡可选 3px 左色条 `is-up` / `is-down`；**仅限报价语义**  

### 8.5 Theme control

- 形态：图标 + 文案；展示**下一档**操作  
- 循环：`amber → mint → dark → amber`  
- 无三色豆盘、无脉冲光点  

### 8.6 Agent / AI affordances（复用）

| 模式 | 要求 |
|---|---|
| 入口 | 顶栏「助手」；场景 CTA 打开同一抽屉并打包 context |
| 上下文 | 行情：`MKT_AGENT_CTX`；个股：`page.js` 写 agent 文案 |
| 场景 CTA | 「今日复盘」「解读板块」「一键提炼全部要点」「让 AI 提炼今日要点」「让助手读这些数据」 |
| **禁止** | 每页自建第二套 AI 侧栏；✨ AI-POWERED 徽章；假进度光效 |

**全局 dock（强制）：**

- 关：drawer `width: 0`；主区左右对等 padding。  
- 开：挤到 `--agent-w`（340px），主区被挤压而非遮罩。  
- 热力等依赖宽度的模块：监听 `mkt:agent-layout` / `transitionend` 后重绘。

AI = 压缩与推理层，不是视觉主题。**动态数据进固定布局，解释交给助手。**

### 8.7 资讯雷达 Tab（对齐 Research Intel，有删减）

页内 Tab（`.intel-tabs` / `.intel-tab`），**不是**左栏二级导航：

| Tab | 状态 | 固定布局内容 |
|---|---|---|
| A股公告 | 启用 | 关注聚合列表：日期 \| 股票名(橙) \| 类型 \| 标题 |
| 公开新闻 | 启用 | 关注聚合列表：时间 \| 股票名 \| 标题 |
| Investment News | 启用（默认） | meta + 赛道 chips + AI 要点卡 + RSS 时间线 |
| 事件概率 | **本轮不做** | Research 有规划占位；Finance 不展示该 Tab |

Investment News 内：赛道筛选只用 **chips**，禁止再在左栏复制一份赛道列表。

### 8.8 板块中心卡片

- `.sector-card.glass`：标题 + 可选「热门」+ tagline + 环节数  
- 点击卡片 → 行业详情；主区网格是完整板块浏览面  
- 左栏热门板块使用独立快捷导航规格：检索 + 6 个策展入口（人形机器人、AI 算力、HBM、光互联、商业航天、生物医药）；18px Lucide 图标、15px 标题、圆角选中态。选中时只聚焦主区对应卡片，不伪装为详情页状态。

### 8.9 Badges & icons

- Badge 只表真状态（「热门」「集成」、数量、已加入）  
- 图标继承字色 / primary；装饰 emoji 不进产品 UI  

---

## 9. Copy voice

| 不要 | 要 |
|---|---|
| 赋能、洞见、一站式、智能闭环 | 字段名、单位、时间、来源 |
| 「不止看盘，更懂投资」 | 「东财二级行业 · 今日涨跌」 |
| 对称排比、三词口号 | 一个人会怎么跟另一个人解释 |
| 功能区上方重复 kicker（FEATURES） | panel-head 只写**有增量信息**的标签 |

合规口径（产品中立时）：客观数据、公开榜单、不构成投资建议——用正常句子，不靠彩色警告盒刷存在感。

---

## 10. Do / Don't

### Do

- 每个 theme 一条可解释的 accent；默认 amber。  
- 涨跌与 brand 隔离；热力用绝对色阶。  
- 层级靠 scale / weight / space；数字 mono + tabular。  
- 一区一层 surface；列表用分割线。  
- 阴影两级且无色；暗色 flat bg。  
- AI 做成**显式、可点的总结/复盘动作**，并说明吃哪些数据；复用同一助手抽屉。  
- 行情 / 个股：**动态数据 + 固定布局**；数据进 `data.js`，卡片进 `components.js`。  
- 先减后加；改 UI 前能回答「这解决什么扫盘/研究问题」。  

### Don't

- Indigo/purple 渐变、`bg-clip-text` 标题、紫/彩 glow。  
- 大面积 glassmorphism、每卡一色渐变洗底。  
- 彩虹语义糖豆墙、同色 border+text+bg/10 状态盒刷屏。  
- 展示衬线仪表盘、全站 Inter+Space Grotesk 制服无理由复刻。  
- 装饰 emoji、营销 badge 墙、无序区块的 01/02/03 大号序。  
- 等权 icon-tile 宫格冒充信息架构。  
- 假社会证明（10k+ / 99.9% / 24/7）。  
- hover 放大卡片、bounce、transition-all。  
- 三层嵌套圆角盒、border 与 radius 分属父子导致断角。  
- 把 mint brand 绿与跌幅绿混用。  
- 为「有温度」整页刷 amber-50/stone 焦糖。  
- 行情左栏再挂与主区重复的板块/赛道二级列表；页内另起第二套 AI 侧栏。  
- 覆盖 FROZEN `.ds-*`；把 Research 浮岛侧栏目录原样照搬进 Finance。  

### Code signals（审查时直接搜）

```
from-indigo / to-purple / via-purple
bg-clip-text text-transparent
shadow-purple / shadow-*-500/50
backdrop-blur + white/10 glass cards
rounded-full on content cards
hover:scale- / transition-all
border-l-4 + bg-*-50 on every row
animate-ping status dots
emoji in headings / ✨ AI-POWERED
font-serif on dashboard stats
10k+ / 99.9% / 24/7 vanity stats
```

更完整的 slop 图鉴见 [killaislop.com](https://killaislop.com/)；可选用 [kill-ai-slop](https://github.com/yetone/kill-ai-slop) skill 对仓库做回归扫描。

---

## 11. Relation to legacy Maka doc

| 保留 | 替换 |
|---|---|
| Command center 纪律、中文优先 | 北极星 → Calm Market Cockpit |
| Signal not texture / Honest glass 精神 | 单 accent 蓝 → 三肤 accent |
| Native Voice、One working plane | 圆角 6/8 → 8/12 |
| Dark restraint、反吉祥物 | 无涨跌语义 → Market semantics 专章 |
| | 无 slop 验收 → §2 + §10 代码信号 |

旧文中的 `maka-tokens.css` **不再**是本项目真源。

---

## 12. Maintenance

1. **改视觉先改 [`prototype/shared.css`](../prototype/shared.css)**，再视需要更新本文 frontmatter。FROZEN `.ds-*` 禁止页面私改。  
2. **改行情业务**：数据进 `market/data.js`；渲染进 `market/components.js`；壳/助手不进页面内联大脚本。  
3. **改个股详情**：数据 / 卡片 / 编排分属 `stock/{data,components,page}.js`；专有样式只进 `stock/stock.css`。  
4. 新组件优先复用：`.ds-*` / `.glass` / `.ov-cta` / chip / agent drawer。  
5. 新页面合并前自问：  
   - 是否仍是「动态数据 + 固定布局 + 复用助手」？  
   - 左栏是否又堆了与主区重复的列表？  
   - 主色是否仍只有一条 accent？涨跌是否被主题污染？  
   - 删一半装饰后信息是否仍完整？文案是否可核对？  
6. 主题扩展（第四套）必须仍遵守：一肤一 accent、涨跌锁、flat dark bg。  

### 12.1 与 Vibe-Research 的对齐边界

| 对齐 | Finance 有意不同 |
|---|---|
| 每日复盘气质区块（情绪 / 短线 / 资金） | IA：行情 = 总览+板块+资讯；非 Research 全侧栏平铺 |
| 资讯雷达 Tab + Investment News 面板 | 不做「事件概率」Tab；左栏以 3 项来源目录替代主区重复 Tab |
| 个股详情字段栈（估值 / 财报 / 研报…） | 无页内搜代码；「加入研究」+ 助手抽屉替代 AskAi 渐变钮 |
| glass / primary 暖橙 token | 壳是 Finance rail + 分页，不是 Research 浮岛侧栏 |

权威实现以 `prototype/` 为准；Research 为字段与模块对照，不是目录照搬。

---

*本文合订：Maka 工作台纪律 · shared.css v6.5 + market/stock 组件化 · [Kill AI Slop](https://killaislop.com/) · 对照 Vibe-Research DailyReview / Intel / StockData。*
