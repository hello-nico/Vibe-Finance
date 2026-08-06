# Object Knowledge Module Contract

> 本文拥有 Vibe-Finance 的对象知识目录——证据层、知识层和判断层三层的全部文件与内容合同，包括 Purpose、Schema、Source / Raw、Wiki、Verdict、Report、Memory、证据锚点、日志和本地恢复。Wiki 是 Agent 持续维护的长期上下文，不是产品目标；普通用户在对象页看到“研究依据”，在数据页看到“研究资料”。分层依据、事务与并发模型以 [`../architecture/architecture.md`](../architecture/architecture.md) 为准；研究状态与报告的产品语义以 [`../research-design/research_design.md`](../research-design/research_design.md) 为准；跨页体验以 [`../flow_design.md`](../flow_design.md) 为准；通用分析方法以 [`../research-design/analysis_frameworks.md`](../research-design/analysis_frameworks.md) 为准。

## 1. Responsibility

本模块负责：

- 为每个个股和行业对象建立一份结构就绪、内容允许稀疏的三层知识目录；
- 使用 `purpose.md` 固定对象分析目的、核心问题和边界；
- 使用仓库级 Schema 维护页面类型、组织约定、分析框架和 Agent 工作规则，并允许对象级少量偏离；
- 将外部资料与用户资料登记到 `raw/sources/`，保持 Raw 只追加、不改写；
- 由 Agent 按 Schema 创建、更新、重组和交叉引用 Wiki 页面，并保持 Wiki 只承载事实与关系；
- 维护判断层的 `verdict.md`、`report.md` 和 `memory.md`，包括状态变更时间线；
- 维护当前索引、对象概览和追加式认知日志；
- 对关键陈述保留 FCISU、来源位置、数据时间、时效和失效条件；
- 维护本地 Git checkpoint、影响预览、原子更新和恢复。

本模块不负责：

- 预先为每个行业建设固定 Skill、利润公式或必填字段；
- 行情 tick、日 K 或实时行业指标的长期持久化；
- 研究页布局、关注 / 跟踪 / 持有标签或完整聊天历史；
- 自动交易和无证据结论；
- 向普通用户暴露 Wiki 文件、commit hash、分支和编译步骤。

## 2. Object knowledge structure

每个个股和行业对象在 llm-wiki 最小结构的基础上，按证据、知识、判断分成三层：

```text
purpose.md          固定对象分析目的、核心问题与范围
schema.md           仅当该对象需要偏离仓库级 Schema 时才存在

raw/sources/        证据层：原始资料或外部资料引用，只追加、不原地改写

wiki/               知识层：只承载事实与关系
  index.md          当前已经形成的知识页面，不列空页面
  overview.md       当前对象概览和进入其他页面的导航
  log.md            摄取、分析、Schema 和认知变化的追加记录
  ...               按实际需要形成的业务、行业、财务、关系等页面

judgment/           判断层：复核输出，会被推翻
  verdict.md        结构化判断状态与只追加的变更时间线
  report.md         当前报告全文
  memory.md         长期假设、用户修正与待验证问题
```

实现可以在同一个本地 Git 仓库中按对象建立逻辑目录，例如：

```text
objects/stocks/{ticker}/...
objects/industries/{slug}/...
```

具体父目录不是产品界面合同，但每个对象必须能独立装载、更新、删除和恢复。不得批量创建空页面伪装完整度。

三层的权威归属、越界规则和事务边界见 [`../architecture/architecture.md`](../architecture/architecture.md) §3 与 §4。本文只定义各层文件的内容合同。

## 3. Two connected loops

```text
知识循环
Purpose + Schema
→ Source / Raw
→ Agent 阅读、分析与补料
→ 带证据地维护 Wiki
→ 更新 Index / Overview
→ 追加 Log 与 Git checkpoint
```

```text
判断循环
Wiki + 动态市场数据 + judgment/memory.md 的模型假设
→ 通用方法与确定性工具
→ 利润、估值、研究状态和当前报告写入 judgment/
→ 将稳定的新认识回写 Wiki
→ 追加 Log
```

两个循环的方向不能颠倒：Wiki 是判断循环的输入，判断层是它的输出。判断层可以引用 Wiki 的事实，Wiki 不得写入判断层的结论。回写 Wiki 的只是分析过程中形成的稳定新事实与新关系，不是判断本身。

Wiki 不负责保存实时 tick。动态数据实际支撑判断时，记录本次使用的关键数值、查询口径、数据时间、来源和影响；下次展示仍从接口获取最新值。

## 4. Purpose contract

`purpose.md` 固定所有对象共享的核心目的，并允许记录对象特有的分析问题：

- 公司或行业怎样创造利润和现金；
- 哪些变量影响利润、价值区间和证伪条件；
- 当前价格相对价值是否有吸引力，为什么；
- 需要持续观察什么；
- 哪些内容不属于本对象范围。

Purpose 不随每份资料自动重写。只有产品合同改变，或对象范围经用户确认发生实质变化时才更新，并写入 `wiki/log.md`。

## 5. Schema contract

Schema 是 Agent 的知识维护协议，而不是一张预先填满的行业数据表。

**Schema 的作用域是仓库级，不是对象级。** 仓库维护两份全局 Schema——一份个股、一份行业：

```text
schema/stock.md
schema/industry.md
```

Agent 在某个对象上摸索出的稳定维度写回全局 Schema，因此一次学会、处处生效；这也是 [`../research-design/analysis_frameworks.md`](../research-design/analysis_frameworks.md) 中「反复使用且稳定的方法可以沉淀复用」的落点。对象目录下的 `schema.md` 只在该对象确实需要偏离全局约定时才存在，且只记录偏离项和原因，不复制全局内容。

Schema 至少表达：

- 当前允许的页面类型及用途；
- 页面命名、frontmatter 和交叉引用约定；
- `index.md`、`overview.md`、`log.md` 和判断层三个文件的维护规则；
- 通用分析框架和关键证据要求；
- 数据时效窗口；
- 冲突、过时内容、开放问题和来源替代的处理方式；
- Agent 摄取、查询、维护和恢复时的工作顺序。

初始 Schema 使用通用投资分析结构。Agent 在真实资料和问题暴露新的稳定维度后，可以更新 Schema，例如新增“分部利润”“关键指标”“竞争格局”或“估值假设”页面类型。更新必须满足：

1. 新维度会重复使用，而不是只服务一次回答；
2. 不用已有页面即可清楚承载；
3. 不引入大量空页面或固定行业字段；
4. 记录更新原因、影响页面和时间；
5. 与触发它的那次对象知识更新一并原子提交。

全局 Schema 演化不回溯重写已有对象。既有对象在下一次自身复核或摄取时按新 Schema 维护，因此不同对象的页面完整度可以不一致，这属于正常状态而非缺陷。

普通用户不需要编辑 Schema。高级配置可以查看和调整，但不能移除来源、时间、FCISU 和冲突表达等底线。

## 6. Source and Raw contract

`raw/sources/` 保存原始文件、URL、粘贴内容、外部文件引用或 API 查询快照引用。每个 Source 至少登记：

```yaml
source:
  id:
  channel:          # 官方披露 | 研究报告 | 资讯舆情 | 行业数据 | 市场数据 | 用户资料 | 报告回灌
  title:
  origin:           # URL、文件引用、上游 API 与上游 ID
  publisher:
  published_at:
  data_as_of:
  fetched_at:
  covers: []        # 关联个股 / 行业
  status:           # 有效 | 已替换 | 已删除
```

规则：

- Raw 摄取和纠错只追加、不原地改写；需要修正时新增 Source 或替代记录；
- 三个时间分别回答“何时发布、数据截至何时、系统何时取得”；
- 大文件可以保存在外部目录，Raw 只保存稳定引用和校验信息；
- 用户在“研究资料”中明确删除原始资料，是 Raw 不可改写规则的唯一删除例外：先影响预览和二次确认，再从当前树移除 Source，并由仓库级变更日志与 Git checkpoint 保留恢复路径；删除研究档案本身只解除原始资料关联，不删除 Raw；
- 报告回灌重新作为 Source 摄取，不直接覆盖 Wiki；
- 系统自动数据应保存可回放的证券 / 品种、字段、查询参数、时点和上游标识。

## 7. Wiki maintenance

**Wiki 只承载事实与关系。** 页面中可以出现明确标注为 Inference 或 Synthesis 的推导，但不得出现对象级结论——研究状态、价值区间、估值位置和是否值得投资都属于判断层，见 §8。这条边界由变更集校验强制执行，不依赖 Agent 自觉。

Wiki 不是随意 append。除 `wiki/log.md` 外，Agent 可以并且应当重写当前页面，使它们始终表达最新的综合认识：

- 新 Source 可能创建页面，也可能更新多个已有页面；
- 新事实替代旧事实时，当前页面更新为最新认识，同时保留来源、替代关系和 Log；
- 来源冲突时不得静默选边，应在相关页面记录双方并形成开放问题；
- 重复摘要应合并，不为每份 Source 永久创建一套平行知识页；
- 一次性问题只有形成长期价值时才写回 Wiki；
- 页面结构以可读和可维护为目标，不要求每句话单独成为 Fact 文件。

### 7.1 `wiki/index.md`

Index 是当前已有知识的目录：

- 只列实际存在的页面；
- 每项包含链接和一句话说明；
- 按 Schema 的页面类型分组；
- 每次创建、删除或移动页面时同步更新；
- 不列“待补充”空页面。

### 7.2 `wiki/overview.md`

Overview 是对象的当前概览和导航，不是完整报告。它可以包含：

- 对象身份和行业关系；
- 当前已经理解的业务或行业结构；
- 已识别的主要利润变量和关键问题；
- 当前证据覆盖、冲突和缺口；
- 指向详细 Wiki 页面、当前报告和关系对象的入口。

Overview 引用动态价格时必须显示数据时间，不把快照冒充永久事实。它可以链接到 `judgment/`，但不复述研究状态或价值区间的取值。

### 7.3 `wiki/log.md`

Log 是唯一强制追加的 Wiki 文件，记录：

```markdown
## YYYY-MM-DD HH:mm | ingest / analysis / query / schema / recovery

- 输入或问题
- 创建、更新、移动或删除了哪些页面
- 形成、修正或推翻了什么认识
- 暴露了什么冲突和缺口
```

Log 记录认知如何变化，不复制完整会话，也不替代 Git diff。

## 8. Judgment layer

判断层保存复核循环的输出。它引用 Wiki 的事实，但不是事实的第二权威；它的内容会被后续复核推翻，因此必须保留变更历史。研究状态四态含义、复核触发条件和报告应包含的内容以 [`../research-design/research_design.md`](../research-design/research_design.md) 为准，本节只定义文件结构与写入规则。

### 8.1 `judgment/verdict.md`

`verdict.md` 是机器可读的判断状态。列表页的状态灯、更新时间和待复核标记从这里投影，实时估值位置和安全边际从这里取价值区间计算——不解析报告行文抠数字。

文件由一条分隔线切成上下两个性质不同的区域：

```markdown
# 判断 · 中远海控

## 当前判断
核心论点，一句到一段。

## 研究状态
绿 / 黄 / 红 / 灰，附理由、证据强度和支撑锚点。

## 价值区间
区间数值、估值方法、关键假设快照、data_as_of。

## 失效条件
什么情况会推翻当前判断。

## 待复核
是否待复核、由什么触发、标记时间。

---
<!-- 以下为只追加区：任何时候不得重写或删除 -->

## 变更时间线

### 2026-08-06 | 研究状态 黄 → 绿
- 变化：具体从什么变成什么
- 原因：为什么改
- 依据：证据锚点
- 数据截至：YYYY-MM-DD
```

规则：

- 分隔线以上可被深复核整体重写；分隔线以下只追加，与 `wiki/log.md` 和 Raw 一样不可重写或删除；
- 上半任何一项发生实质变化时，下半必须同步追加一条，说明变化、原因、依据和数据时间；
- **轻复核只能写「待复核」一节和 `wiki/log.md`**，触及其他任何内容的变更集必须被校验拒绝；
- 时效状态不写入文件。新鲜、趋旧、过时由 `data_as_of` 与 Schema 时效窗口在渲染时推导，写死会在下一周变成假话；
- 价值区间必须持久化而不是每次重算，否则实时价格的估值位置会自行漂移。

### 8.2 `judgment/report.md`

`report.md` 是面向人的当前报告全文，承载贯穿的论证行文——判断的表达本身就是文章，无法由字段拼接生成。

规则：

- 每个对象只有一份，深复核时整体重写，不提供版本列表；
- 更新失败保留最后成功版本，不用空白或半成品覆盖；
- 报告中复述 Wiki 的事实必须带脚注锚点指回 Wiki 或 Raw；Wiki 始终是事实的唯一权威；
- 报告落后于 Wiki 是允许的：摄取新资料到下一次深复核之间，报告可能尚未反映最新事实，这由 `verdict.md` 的待复核标记向用户表达，不通过偷偷改报告掩盖；
- 报告可导出，也可作为新 Source 重新摄取，回灌时按 §6 登记，不直接覆盖 Wiki。

### 8.3 `judgment/memory.md`

Memory 保存模型假设与待验证问题。它属于判断层而不是知识层，因为假设是判断的输入，不是已确立的事实。

只保存后续仍有价值的：

- 用户明确提出的持续假设；
- 对对象事实或口径的修正；
- 用户长期关心的变量；
- 待验证问题；
- 对话中形成且已有来源支撑的稳定增量。

普通问答和完整聊天不进入 Memory。系统可以在对话后异步提取候选；用户主动修改或采用持续估值假设时仍需确认。用户陈述在获得外部证据前保持“用户假设”，不能因写入 Memory 成为事实，也不能因此进入 Wiki。

## 9. Evidence, FCISU, and freshness

Evidence 是关键陈述与来源之间的可核对连接。不要求每条 Evidence 单独建文件或数据库记录。

**表达形式固定为 Markdown 脚注**，这是唯一必须遵守的机制，Wiki 页面和判断层通用。数字和叙述型判断使用同一套锚点，因为最需要标注 FCISU 的往往是「公司通过长协对冲了运价暴露」这类推断，它无法放进任何表格行。

```markdown
集装箱航运是利润主体，2025 年贡献归母利润 94%[^s3-t12]，收入占比 88%[^s3-t12]。
长协价与即期价的占比目前无法核实[^gap-1]。

[^s3-t12]: F · 2025年报 · p.47 表3「分部经营成果」 · data_as_of 2025-12-31
           · 摘录：「集装箱航运业务归属于母公司股东的净利润 XXX 亿元」
[^gap-1]: U · 缺口 · 年报未披露长协占比 · 补料方向：管理层交流、行业运价数据库
```

整表同源时，表格可以额外带一列来源作为阅读便利，但不替代脚注。

每条锚点至少包含：

- FCISU；
- Source；
- 页、段、表、行或上游记录位置；
- 原文或必要摘录；
- 数据时间 `data_as_of`；
- 口径和单位；
- 失效条件或冲突链接。

**时效状态不写入锚点。** 新鲜、趋旧和过时由 `data_as_of` 与 Schema 时效窗口在渲染时推导；写进文件的时效状态会随时间变成错误陈述。

| 标记 | 含义 | 使用规则 |
|---|---|---|
| F — Fact | 一手或权威来源直接陈述 | 可支撑事实，仍保留口径与时间 |
| C — Claim | 某来源的明确主张 | 只能证明来源这样判断 |
| I — Inference | 从事实推导 | 保留推导链和假设 |
| S — Synthesis | 多来源综合 | 能逐项下钻到来源 |
| U — Unattributed | 无来源陈述 | 默认不信任，只登记为传闻或缺口 |

时效由数据性质、`data_as_of` 和 Schema 约定共同判断。财报事实可持续一个报告期，结构知识可以更长，市场价格和库存通常更短。引用趋旧或过时内容时必须显示状态。

## 10. Stock and industry knowledge

### 10.1 Stock Wiki

个股 Wiki 按实际需要形成页面，常见但非强制的内容包括：

- 公司发展和重要节点；
- 股权、管理团队和治理；
- 业务、产品、客户与竞争；
- 财务、资本和现金流；
- 盈利模式与关键变量；
- 当前开放问题和数据缺口；
- 与一个或多个行业的关系。

首版最小对象仍是证券，不预先建立独立公司实体。具体对象需要什么页面，由 Schema、现有证据和用户问题共同决定。

### 10.2 Industry Wiki

行业 Wiki 按实际需要维护：

- 产业链和角色关系；
- 行业发展空间；
- 供需、产能和库存；
- 竞争格局；
- 核心门槛与政策；
- 关键变量和领先 / 滞后关系；
- 关联公司。

行业页提供 Agent 理解公司所需的背景，但不等于预置行业 Skill。一个公司可以连接多个行业，加入个股时至少识别一个主行业并建立双向入口。

## 11. Relations and open questions

关系通过 Wiki 链接、页面元数据和必要的证据锚点表达。首版至少支持：

- 个股属于 / 主营暴露于行业；
- 行业关联重点个股；
- 上游、下游、竞争、客户、供应、股权和相邻关系；
- 一个公司连接多个行业。

无法解决的冲突、缺少的资料和待继续分析的问题写入现有页面的开放问题区，或按 Schema 创建 query 页面。缺口至少记录问题、影响和补料方向。

## 12. Repository and Git lifecycle

所有对象目录和仓库级 Schema 进入同一个本地 Git 仓库。仓库级 `log.md` 记录对象创建、整个对象删除、跨对象变更、全局 Schema 演化和恢复；对象仍存在时的知识维护由对象 `wiki/log.md` 记录。SQLite 是可重建的投影层，不进入 Git。接口缓存、临时解析文件、运行日志、tick 和完整聊天也不进入 Git。

一次自然 checkpoint 包含：

```text
Raw / Source 登记
→ Schema 与 Wiki 更新
→ Index / Overview 更新
→ 判断层更新（verdict / report / memory，视本次动作范围）
→ Log 追加
→ 单次 Git commit
```

checkpoint 的实际执行路径是 [`../architecture/architecture.md`](../architecture/architecture.md) §4 的变更集事务：Agent 产出变更集，确定性 Command 校验后一次性落盘并提交。

普通用户只看到“变更记录”和“恢复”。恢复通过反向变更形成新 checkpoint，不使用破坏历史的 reset，也不展示 commit、hash 或分支。

## 13. Mutation transaction

用户资料编辑、删除，用户主动或破坏性的 Schema 更新，以及研究档案删除必须执行：

```text
预览影响
→ 显示受影响对象、页面、当前报告和数据缺口
→ 用户二次确认
→ 原子更新 Raw 关系、Schema、Wiki、判断层和 Log
→ Git checkpoint
```

任一步失败则保留原状态，不允许 Raw 已改、Wiki 未改或报告半更新。

### 13.1 Research-record deletion

“删除研究档案”删除该对象的 Purpose、对象级 Schema 偏离、Wiki 和整个判断层，并停止更新。用户上传的原始资料保留在数据页，解除对象关联。删除动作在移除对象前写入仓库级 `log.md`，并与删除事务形成同一 checkpoint；因此对象 `wiki/log.md` 和 `judgment/verdict.md` 的变更时间线可以随对象删除，而删除历史仍能通过“变更记录”读取和恢复。

## 14. Public interfaces

实现至少提供：

- `initializeKnowledgeObject(object)`：建立 Purpose、Raw、Wiki 和判断层最小结构；
- `ingestSource(source, object)`：登记 Source 并按 Schema 维护 Wiki；
- `compileWiki(object, changedSources)`：创建、更新、重组页面及 Index / Overview；
- `readWikiContext(object, query)`：按 Index 定位相关 Wiki 与 Raw 锚点；
- `readVerdict(object)` / `applyVerdictChange(object, changeSet)`：读取判断状态，写入时同步追加变更时间线；
- `markPendingReview(object, trigger)`：轻复核唯一允许的判断层写入；
- `writeReport(object, content)`：整体重写当前报告，失败时保留最后成功版本；
- `appendObjectMemory(object, entry)`：写入长期假设候选；
- `readEvidenceAnchors(object, statements)`：读取关键陈述的来源锚点；
- `previewSourceMutation(change)` / `applySourceMutation(change)`；
- `previewSchemaMutation(change)` / `applySchemaMutation(change)`；
- `previewResearchRecordDeletion(object)` / `deleteResearchRecord(object)`；
- `listChangeHistory(scope)` / `restoreCheckpoint(id)`。

确定性写入、删除、恢复和计算由 Tool / Command 实现；Agent 决定分析、页面维护和解释，不直接绕过事务边界写最终状态。

## 15. Failure semantics

- Source 无法解析：保留资料登记和失败原因，不生成伪内容；允许重新解析或删除；
- Schema 不可用：使用默认通用 Schema 建立最小 Wiki，并标记待修复；
- Wiki 生成中断：保留最后成功页面，不写半个文件；
- 报告生成中断：保留最后成功报告，`verdict.md` 不被改动；
- 判断层写入越界（如轻复核试图改写报告）：变更集整体拒绝并记录原因；
- 无法定位原文：关键陈述降级并形成缺口；
- 来源冲突：保留双方，不静默覆盖；
- 动态数据失败：保留最近成功值及时间，明确当前不可用；
- Git checkpoint 失败：整次知识变更回滚；
- Memory 提取失败：不阻断当前回答；
- 删除失败：保留原对象并返回可恢复错误。

## 16. Business validation

- 新对象立即获得 Purpose、Raw、Wiki 和判断层最小结构，内容允许稀疏；
- `wiki/index.md` 只列实际页面，`wiki/overview.md` 能导航当前已知内容；
- 新 Source 能更新多个已有页面，而不是只追加一份摘要；
- 除 `wiki/log.md`、Raw 和 `verdict.md` 只追加区外，当前页面可以被 Agent 重写和重组；
- Wiki 页面中不出现研究状态、价值区间或估值结论；
- 判断层中复述的每个关键数字都能通过脚注锚点回到 Wiki 或 Raw；
- `verdict.md` 上半的每次实质变化都在只追加区留下变化、原因、依据和数据时间；
- 轻复核无法改写报告或研究状态；
- 关键陈述的时效状态由数据时间推导，不以写死的文字形式存在于文件中；
- Agent 在一个对象上演化出的稳定维度写入全局 Schema，对新对象直接生效，且不回溯重写已有对象；
- 新分析维度只有在可复用时才演化 Schema，不预建行业字段；
- 个股与一个或多个行业可以双向链接；
- Wiki 与动态价格、模型和判断层保持分层；
- 用户主动或破坏性的 Schema 更新、资料编辑、删除和恢复均有影响预览、确认和原子边界；Agent 的非破坏性 Schema 演化有日志和 checkpoint；
- 普通用户界面不出现 Wiki、Git、commit、hash 或文件路径。
