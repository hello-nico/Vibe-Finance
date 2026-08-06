# Vibe-Finance

面向所有 A 股投资者的投研助手：从行情广度发现潜在方向，聚合股票、价格、财务和行业指标，使用内置方法拆分利润、识别先行指标并建立估值模型，解释当前价格为什么偏高、合理或偏低。尚无方向时从广度可视化形成候选，已有关注股票时直接加入；个股可用“关注 / 跟踪 / 持有”标签表达关系，助手根据具体问题动态调整解释和分析深度。

当前仓库处于**实施方案确认阶段**：首版产品合同已经按人类访谈结果收敛，下一步在人类确认方案后建立原型 Tasks 并完善正式 UI 原型。原型用于验证交互，不反向决定产品范围。

## Project files

| Document | Owns |
|---|---|
| [`README.md`](README.md) | 项目入口、文档导航、模块地图和能力边界 |
| [`AGENTS.md`](AGENTS.md) | Agent 工作方式与产品设计纪律 |
| [`human-checklist.md`](human-checklist.md) | 已确认人类决策的台账；只记决策结论，细节指向 Owner |
| [`todo.md`](todo.md) | 未解决或明确延期的工作 |
| [`design-qa.md`](design-qa.md) | 已完成原型检查产生的证据；不创建产品决策 |

### 产品设计文档

| Document | Owns |
|---|---|
| [`docs/flow_design.md`](docs/flow_design.md) | 背景、用户、范围、页面职责、四条用户主线、对象生命周期、助手会话和整体验收 |
| [`docs/architecture/architecture.md`](docs/architecture/architecture.md) | 判断权边界、四层存储与权威、知识事务与并发、运行形态和组件职责 |
| [`docs/market-design/market_design.md`](docs/market-design/market_design.md) | 行情总览 / 资讯 / 行业详情 / 个股详情、加入研究和基本面速览 |
| [`docs/market-design/market_overview_standard.md`](docs/market-design/market_overview_standard.md) | 行情总览的信息架构、Dashboard 契约和刷新行为 |
| [`docs/research-design/research_design.md`](docs/research-design/research_design.md) | 关注列表、研究对象页、研究状态、复核节奏、报告、方法、估值和助手合同 |
| [`docs/research-design/analysis_frameworks.md`](docs/research-design/analysis_frameworks.md) | 通用分析主线、Agent 动态发现、估值方法和案例参考 |
| [`docs/knowledge-design/wiki.md`](docs/knowledge-design/wiki.md) | 对象知识目录三层：Purpose、Schema、Raw、Wiki、判断层、证据锚点、日志和恢复合同 |
| [`docs/data-design/data_design.md`](docs/data-design/data_design.md) | 数据源、主动摄取调度、研究资料、配置、SQLite 投影边界和 CRUD 合同 |
| [`docs/ui-design/DESIGN.md`](docs/ui-design/DESIGN.md) | 全局视觉、布局和组件设计系统 |

### 对外阅读稿

| Document | Role |
|---|---|
| [`docs/product-plan/index.html`](docs/product-plan/index.html) | 产品方案的对外说明稿（面向客户）；非权威，内容以 `human-checklist.md` 和 `docs/flow_design.md` 为准 |
| [`docs/product-plan/architecture.html`](docs/product-plan/architecture.html) | 架构实施说明的阅读稿；非权威，内容以 `docs/architecture/architecture.md` 为准 |
| [`docs/product-plan/wiki.html`](docs/product-plan/wiki.html) | Wiki 实施说明的阅读稿；非权威，内容以 `docs/knowledge-design/wiki.md` 为准 |
| [`docs/product-plan/shipping-viz/`](docs/product-plan/shipping-viz/) | 航运案例的交互可视化，验证周期型行业的分析方法 |
| [`docs/product-plan/inference-silicon-cn/`](docs/product-plan/inference-silicon-cn/) | 推理芯片案例的交互可视化，验证成长产业链型行业的分析方法 |

### 只读参考

`docs/references/` 下的全部文件都是只读参考，不构成设计权威，也不作为任何合同的生成前提。

| Document | Role |
|---|---|
| [`docs/references/研究流程.html`](docs/references/研究流程.html) | 通用投资研究流程参考 |
| [`docs/references/个股知识库架构搭建.html`](docs/references/个股知识库架构搭建.html) | 个股研究知识参考 |
| [`docs/references/行业知识库架构搭建.html`](docs/references/行业知识库架构搭建.html) | 行业研究知识参考 |
| [`docs/references/finance-evidence-workspace.html`](docs/references/finance-evidence-workspace.html) | 早期证据工作台探索稿，已被现有合同取代 |
| [`docs/references/vibe-research-source.md`](docs/references/vibe-research-source.md) | Vibe-Research 的行情、资讯和公开数据能力盘点 |
| [`docs/references/daily_stock_analysis.md`](docs/references/daily_stock_analysis.md) | Daily Stock Analysis 的方法和数据降级盘点 |

`docs/ui-design/` 下的 PNG 是设计探索截图，不是设计权威。

## Module map

| Module | Current source | Design authority | Task list |
|---|---|---|---|
| Market and details | `prototype/01-market.html`, `prototype/market/`, `prototype/04-industry.html`, `prototype/industry/`, `prototype/05-stock.html`, `prototype/stock/` | `docs/market-design/`, `docs/ui-design/DESIGN.md` | Not established; wait for plan confirmation |
| Research | `prototype/02-research.html` | `docs/research-design/`, `docs/knowledge-design/wiki.md`, `docs/ui-design/DESIGN.md` | Not established; wait for plan confirmation |
| Data | `prototype/03-data.html` | `docs/data-design/data_design.md`, `docs/knowledge-design/wiki.md`, `docs/ui-design/DESIGN.md` | Not established; wait for plan confirmation |
| Evidence and knowledge | Implementation not established | `docs/knowledge-design/wiki.md`, `docs/architecture/architecture.md` | Not established; wait for plan confirmation |
| Agent integration | Implementation not established | `docs/architecture/architecture.md`, `docs/flow_design.md`, `docs/research-design/research_design.md` | Not established; wait for plan confirmation |
| UI foundation | `prototype/shared.css`, `prototype/theme.js`, `prototype/nav-collapse.js` | `docs/ui-design/DESIGN.md` | Not established; wait for plan confirmation |

`prototype/06-research-v2.html`、`prototype/07-research-v3.html` 和 `prototype/08-research-v4.html` 是已淘汰的探索稿，不属于正式模块入口；方案确认后的原型任务将移除它们。

## Capability boundaries

本节是运行时与外部能力复用的唯一 Owner，产品设计文档不重复这些内容。

| Repository / runtime | Role in this product |
|---|---|
| `/Users/apple/ts/src/Vibe-Research` | 优先复用行情、估值、财务、公告、行业工具、Function Calling 和流式回答 |
| `/Users/apple/ts/src/daily_stock_analysis` | 通用分析方法和数据降级参考 |
| `/Users/apple/ts/src/llm_wiki` | Source、Schema、摄取、关系、日志、检查和增量维护参考 |
| Pi SDK + Extensions | 统一 Agent Runtime、Tools、Skills、生命周期、Session 和 Package 基础 |
| `/Users/apple/ts/src/workbench-desktop-finance-desktop` | 仅参考 SQLite migration 与 Pi + Extensions 组织方式 |

这些能力提供实现基础，不直接决定 Vibe-Finance 的用户界面。产品不另建 Agent Runtime，也不依赖 Pi 内部模块。

持久化边界：接口数据按需获取；文件仓库是唯一权威，存储 Purpose、Schema、Raw、Wiki、判断层和日志；SQLite 是可丢弃重建的投影层，保存对象、关注、事件、数据源、上传资料索引和列表页查询字段；Git 提供本地 checkpoint 和恢复，不执行自动 push。分层依据与事务模型见 [`docs/architecture/architecture.md`](docs/architecture/architecture.md)，文件与表的细节见 [`docs/knowledge-design/wiki.md`](docs/knowledge-design/wiki.md) 与 [`docs/data-design/data_design.md`](docs/data-design/data_design.md)。

## Delivery sequence

1. 直接形成并同步 Human Checklist、完整实施方案和模块合同；
2. 人类完整阅读并明确确认方案；
3. 确认后先形成架构设计与实施方案，再按 Task Protocol 设计原型实施 Tasks；
4. 通过 Tasks 完善 `prototype/01–05` 及共享资源，移除 `06–08`；
5. 按 `docs/flow_design.md` 的四条用户主线执行 Review 和 Smoke；
6. 原型确认后，再建立真实数据、知识和 Pi Extensions 的实现 Tasks。
