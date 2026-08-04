# Industry Detail Design QA

## Verification target

- Source: `/Users/apple/.codex/generated_images/019fc7c4-b2bb-7d51-99c3-a48308ce9713/exec-d7e7722c-6d7b-4717-807b-1d34040246aa.png`
- Implementation: `/Users/apple/.codex/visualizations/2026/08/03/019fc7c4-b2bb-7d51-99c3-a48308ce9713/industry-redesign/implementation-v1.png`
- URL: `http://127.0.0.1:39877/04-industry.html`
- Viewport: `1440 × 1024`
- State: warm-orange light theme, assistant closed, market-performance table view

## Full-view comparison

The reference and implementation screenshots were inspected together at the same viewport. The implementation preserves the selected direction's hierarchy: product shell, industry identity and market metrics, five-stage industry chain, three objective prosperity signals, and a constituent-company table with four metric views.

Intentional differences from the generated reference:

- Reuses the existing Vibe-Finance shell, tokens, glass surfaces, spacing and navigation instead of copying generated-image decoration.
- Uses the current product definition from `docs/flow_design.md`: no composite score, recommendation, target price or buy/sell conclusion.
- Keeps source and period visible on each prosperity signal and treats the figures as realistic prototype data.
- Uses an interactive chain state instead of decorative stage arrows.

## Focused checks

| Region | Result | Notes |
|---|---|---|
| Industry identity | passed | Classification, stable identity, description, update time and source context are readable. |
| Market metric strip | passed | Six metrics align with the existing market/stock density and use tabular numerals. |
| Industry chain | passed | Five stages fit one row at desktop width; selection state and detail copy update correctly. |
| Prosperity signals | passed | Three comparable data blocks show value, change, period and source without generating a score. |
| Constituent table | passed | Market, valuation, profitability and scale tabs replace columns without layout shift. |
| Responsive safety | passed | No horizontal page overflow at 1440px; table owns its narrow-screen overflow. |

## Interaction and runtime checks

- `设备` chain stage changes `aria-pressed` and the current-signal detail.
- `估值指标` tab changes the table columns and selected state.
- `实时行情` toggles its pressed state.
- `加入研究` changes to `已加入 · 去研究` before routing.
- `寒武纪` opens `05-stock.html?name=寒武纪` and browser back returns to the industry page.
- Assistant drawer opens and closes.
- Browser console warnings/errors: none.
- JavaScript syntax checks: passed for `data.js`, `components.js`, and `page.js`.

## Comparison history

1. v1 — matched the selected hierarchy and existing product standard; no P0, P1 or P2 visual defects found.

final result: passed

---

# Sidebar List 统一复用 · 本轮视觉与交互检查

## 验收结果

- 板块左栏不再保留 `sector-shortcuts` 专用 CSS。市场和数据页现在共同使用 `Sidebar List`：`sidebar-search`、`sidebar-section-label`、`sidebar-list`、`sidebar-list-item` 与统一选中态。
- 板块只通过 `sidebar-list-item--icon` 声明图标这一内容差异；行高、内边距、标题、辅助文本、搜索框、分组标题与淡橙选中表面不再另起一套规格。
- 数据页的 Wiki 与数据源两组目录已迁移到同一组件类；搜索现在会过滤当前 Tab 的条目及其空分组，Tab 切换与条目点击保持可用。
- 板块快捷入口仍为六个策展项；`?focus=ai-computing` 会同步左栏与主区卡片定位。

## 证据

- 在 1280px 桌面视口中，市场板块与数据页的共享字段逐项一致：搜索框 `34px / 12px / 10px`（高度 / 字号 / 圆角）、分组标题 `10px / 5px 7px 4px`、条目 `13px / 7px 8px / 8px`（字号 / 内边距 / 圆角）、选中底色均为 `rgba(232, 75, 23, 0.15)`。
- 两页分别检索“HBM”和“航运”时，仅留下对应条目与仍有结果的分组；控制台无 error。
- 视觉复核以用户提供的数据页目录样式为参考：板块保留唯一的内容差异——18px Lucide 图标和单行标题；搜索、分组、条目与选中态全部来自共享组件。

## 结果

final result: passed

---

# 个股实时状态与热门板块检索 · 上轮视觉与交互检查

## 验收结果

- 个股详情以单页组件栈继续呈现；顶栏移除“2 分钟前 / 14:32”，替换为与行情总览共用状态的“实时行情”开关。
- 开关默认开启；关闭与重新开启后，`aria-pressed` 和橙色状态同步，无 `.topbar-sync` 残留。
- 板块左栏呈现前 5 个热门板块，并提供本地检索；检索仅过滤左栏快捷下钻，不改变主区完整板块网格。
- 搜索 `AI` 后保留包含该关键词的热门项；个股页和板块页均无控制台 error。
- 行业详情未在本轮改动：其信息架构尚待产品讨论，因此不以原型占位替代正式设计。

## 结果

final result: passed

---

# 资讯与板块目录去重 · 上轮视觉与交互检查

## 验收结果

- 资讯主区已移除 A股公告、公开新闻、Investment News 三个重复 Tab；左侧“今日资讯”是唯一来源切换入口。
- 切换左侧资讯后，地址栏、选中态与当前资讯 Dashboard 一致；主区不再保留第二套切换控件。
- 板块目录更名为“热门板块”，其项目文案为“热门赛道 / 热点 · 产业链”，不再展示“19 个板块”的数量型副文案。
- 资讯页与板块页均无控制台 error。

## 结果

final result: passed

---

# 行情板块与资讯目录 · 上轮视觉与交互检查

## 验收结果

- 板块页不再使用“当前页面”占位，二级栏改为“板块目录 / 热门赛道”，并定位其 19 个板块的产业链内容。
- 资讯页不再使用“当前页面”占位，二级栏改为“资讯目录”；A股公告、公开新闻、Investment News 与主区 Tab 共用 `MKT_DATA.intelTabs` 配置。
- 点击主区 Tab 后，左栏选中态和地址栏查询参数同步；点击左栏目录后，主区 Tab 同步为同一内容。
- 板块页与资讯页均无控制台 error。

## 结果

final result: passed

---

# 行情总览实时状态 · 上轮视觉与交互检查

## 对比对象

- **需求视觉依据：** 用户提供的实时行情开关标注图（开启为橙色状态、关闭为灰色状态），以及行情总览标题去重标注图。
- **实现：** `http://127.0.0.1:4173/01-market.html`；默认亮色主题、展开态。
- **实现捕捉：** 2026-08-04 通过应用内浏览器捕捉；截图验证页面标题、橙色开启状态及组件更新时间。

## 验收结果

- 主区标题为“市场全景”；侧栏的“总览”保留为导航名称，两者不再重复。
- 顶栏移除同步时间，行情总览以 `实时行情` pill 开关承载全局自动刷新状态；开启为橙色，关闭为灰色。
- `实时行情`采用紧凑规格：26px 高、11px 字、9px 水平内边距、6px 状态点；不抢占页面级“今日复盘”的视觉层级。
- 开关默认开启。关闭后 `aria-pressed=false` 且停止自动调度；重新开启后，7 个独立 Dashboard 均在各自标题栏更新为“刚刚更新”。
- 顶栏没有 `.topbar-sync` 残留；“今日复盘”仍是独立的页面级动作。
- “实时行情”仅出现在行情总览，不在板块、资讯页面显示无作用的控件。
- 控制台无 error。

## 结果

final result: passed

---

# 二级栏与顶栏 · 上轮视觉与交互检查

## 对比对象

- **需求视觉依据：** 用户提供的研究栏标注图 `/var/folders/nn/djrvyf_d2yj2drvwyx7y0crc0000gn/T/codex-clipboard-a25ed36f-bd25-4347-ac67-16a0e017dad4.png`（590 × 760 px），以及同轮市场栏 / 开合交互标注图。
- **实现：** `http://127.0.0.1:4173/02-research.html`；默认亮色主题、展开态、1200 × 762 CSS px、device scale factor 1。
- **实现捕捉：** [`research-nav-unified.png`](./research-nav-unified.png)（1200 × 762 px）；另有 [`market-nav-unified.png`](./market-nav-unified.png) 用于数据栏共享样式检查。
- **归一化：** 需求图是窄屏高密度截取，实现图是完整桌面 CSS 视口；因此聚焦二级栏的相对层级、间距、选中态与开合状态，不以画布宽度作逐像素判断。

## 比较结果

### 字体与层级

- Tab 统一为 11px，列表标题统一为 12px，辅助说明统一为 10px；研究、行情、数据不再各自定义字号。
- 顶栏只保留品牌与全局状态；移除 ticker 是本轮明确需求，不视为与旧截图的偏差。

### 间距与布局节奏

- 三种二级栏共用 220px 宽度、10px × 8px 容器内边距、12px Tab 间距和 7px × 8px 列表项内边距。
- 研究栏仍是参考基准；行情栏从更紧的独立 padding 改为同一节奏，数据栏从 250px 收束为 220px。
- rail 收起后 dock 为 56px；展开后为 276px，未出现主区被二级栏撑开的溢出。

### 颜色与视觉 token

- 三栏共用 glass 材质、hairline 分隔、hover wash 与 `--selected` 选中态。
- 行情目录保留淡橙市场定位色；研究、数据使用同一基础选中表面，不新增装饰层。

### 图像与图标

- 本轮没有新增或替换图像资产；rail 图标沿用现有线性图标。

### 文案与内容

- 未修改研究、行情、数据的具体目录内容；只统一其承载样式。

## 交互证据

- 当前行情 rail：展开态点击后收起（dock 56px），再次点击恢复展开（dock 276px，行情栏 220px）。
- 当前研究 rail：展开态点击后收起。
- 收起态点击数据 rail：进入数据页且以展开态落地；数据栏实测 220px。
- 三栏实测共享 `11px` Tab 字号、`12px` Tab 间距、`7px 8px` 列表项内边距。
- 各页面 `topbar-ticker` 节点数量为 0。
- 浏览器控制台没有 error；`favicon.ico` 不再计入本轮页面控制台错误。

## Findings

无 P0 / P1 / P2 可操作差异。

## Follow-up Polish

- P3：若数据页未来需要展示极长的 Provider 名称，再评估内容层的截断策略；不恢复独立侧栏宽度。

## 结果

final result: passed
