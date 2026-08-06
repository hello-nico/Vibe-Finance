# Evidence and Wiki Module Contract

> 本文拥有 Vibe-Finance 的对象知识目录、Purpose、Schema、Source / Raw、Wiki、Memory、证据标注、日志和本地恢复合同。Wiki 是 Agent 持续维护的长期上下文，不是产品目标；普通用户在对象页看到“研究依据”，在数据页看到“研究资料”。跨页体验以 [`../flow_design.md`](../flow_design.md) 为准，通用分析方法以 [`../research-design/analysis_frameworks.md`](../research-design/analysis_frameworks.md) 为准。

## 1. Responsibility

本模块负责：

- 为每个个股和行业对象建立一份结构就绪、内容允许稀疏的知识目录；
- 使用 `purpose.md` 固定对象分析目的、核心问题和边界；
- 使用 `schema.md` 维护页面类型、组织约定、分析框架和 Agent 工作规则；
- 将外部资料与用户资料登记到 `raw/sources/`，保持 Raw 只追加、不改写；
- 由 Agent 按 Schema 创建、更新、重组和交叉引用 Wiki 页面；
- 维护当前索引、对象概览、长期 Memory 和追加式认知日志；
- 对关键陈述保留 FCISU、来源位置、数据时间、时效和失效条件；
- 维护本地 Git checkpoint、影响预览、原子更新和恢复。

本模块不负责：

- 预先为每个行业建设固定 Skill、利润公式或必填字段；
- 行情 tick、日 K 或实时行业指标的长期持久化；
- 研究页布局、关注 / 跟踪 / 持有标签或完整聊天历史；
- 自动交易和无证据结论；
- 向普通用户暴露 Wiki 文件、commit hash、分支和编译步骤。

## 2. Object knowledge structure

每个个股和行业对象都采用 llm-wiki 的最小结构：

```text
purpose.md          固定对象分析目的、核心问题与范围
schema.md           Wiki 结构、分析框架、约定与 Agent 工作规则
raw/sources/        原始资料或外部资料引用，摄取和纠错只追加、不原地改写
wiki/index.md       当前已经形成的知识页面，不列空页面
wiki/overview.md    当前对象概览和进入其他页面的导航
wiki/log.md         摄取、分析、Schema 和认知变化的追加记录
wiki/memory.md      长期有价值的对话增量、用户假设和待验证问题
wiki/...            按实际需要形成的业务、行业、财务、关系等页面
```

实现可以在同一个本地 Git 仓库中按对象建立逻辑目录，例如：

```text
objects/stocks/{ticker}/...
objects/industries/{slug}/...
```

具体父目录不是产品界面合同，但每个对象必须能独立装载、更新、删除和恢复。不得批量创建空页面伪装完整度。

## 3. Two connected loops

```text
知识循环
Purpose + Schema
→ Source / Raw
→ Agent 阅读、分析与补料
→ 带证据地维护 Wiki
→ 更新 Index / Overview / Memory
→ 追加 Log 与 Git checkpoint
```

```text
判断循环
Wiki + 动态市场数据 + 模型假设
→ 通用方法与确定性工具
→ 利润、估值、研究状态和当前报告
→ 将稳定的新认识回写 Wiki
→ 追加 Log
```

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

`schema.md` 是 Agent 的 Wiki 维护协议，而不是一张预先填满的行业数据表。它至少表达：

- 当前允许的页面类型及用途；
- 页面命名、frontmatter 和交叉引用约定；
- `index.md`、`overview.md`、`log.md` 和 `memory.md` 的维护规则；
- 通用分析框架和关键证据要求；
- 冲突、过时内容、开放问题和来源替代的处理方式；
- Agent 摄取、查询、维护和恢复时的工作顺序。

初始 Schema 使用通用投资分析结构。Agent 在真实资料和问题暴露新的稳定维度后，可以更新 Schema，例如新增“分部利润”“关键指标”“竞争格局”或“估值假设”页面类型。更新必须满足：

1. 新维度会重复使用，而不是只服务一次回答；
2. 不用已有页面即可清楚承载；
3. 不引入大量空页面或固定行业字段；
4. 记录更新原因、影响页面和时间；
5. 与同一对象当前 Wiki 一并原子提交。

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

Overview 引用动态价格时必须显示数据时间，不把快照冒充永久事实。

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

### 7.4 `wiki/memory.md`

Memory 只保存后续仍有价值的：

- 用户明确提出的持续假设；
- 对对象事实或口径的修正；
- 用户长期关心的变量；
- 待验证问题；
- 对话中形成且已有来源支撑的稳定增量。

普通问答和完整聊天不进入 Memory。系统可以在对话后异步提取候选；用户主动修改或采用持续估值假设时仍需确认。用户陈述在获得外部证据前保持“用户假设”，不能因写入 Memory 成为事实。

## 8. Evidence, FCISU, and freshness

Evidence 是关键陈述与来源之间的可核对连接。它可以通过页面 frontmatter、引用块、表格列或内联锚点表达，不要求每条 Evidence 单独建文件或数据库记录。

关键数字、判断和模型输入至少包含：

- FCISU；
- Source；
- 页、段、表、行或上游记录位置；
- 原文或必要摘录；
- 数据时间；
- 口径和单位；
- 时效状态；
- 失效条件或冲突链接。

| 标记 | 含义 | 使用规则 |
|---|---|---|
| F — Fact | 一手或权威来源直接陈述 | 可支撑事实，仍保留口径与时间 |
| C — Claim | 某来源的明确主张 | 只能证明来源这样判断 |
| I — Inference | 从事实推导 | 保留推导链和假设 |
| S — Synthesis | 多来源综合 | 能逐项下钻到来源 |
| U — Unattributed | 无来源陈述 | 默认不信任，只登记为传闻或缺口 |

时效由数据性质、`data_as_of` 和 Schema 约定共同判断。财报事实可持续一个报告期，结构知识可以更长，市场价格和库存通常更短。引用趋旧或过时内容时必须显示状态。

## 9. Stock and industry knowledge

### 9.1 Stock Wiki

个股 Wiki 按实际需要形成页面，常见但非强制的内容包括：

- 公司发展和重要节点；
- 股权、管理团队和治理；
- 业务、产品、客户与竞争；
- 财务、资本和现金流；
- 盈利模式与关键变量；
- 当前开放问题和数据缺口；
- 与一个或多个行业的关系。

首版最小对象仍是证券，不预先建立独立公司实体。具体对象需要什么页面，由 Schema、现有证据和用户问题共同决定。

### 9.2 Industry Wiki

行业 Wiki 按实际需要维护：

- 产业链和角色关系；
- 行业发展空间；
- 供需、产能和库存；
- 竞争格局；
- 核心门槛与政策；
- 关键变量和领先 / 滞后关系；
- 关联公司。

行业页提供 Agent 理解公司所需的背景，但不等于预置行业 Skill。一个公司可以连接多个行业，加入个股时至少识别一个主行业并建立双向入口。

## 10. Relations and open questions

关系通过 Wiki 链接、页面元数据和必要的证据锚点表达。首版至少支持：

- 个股属于 / 主营暴露于行业；
- 行业关联重点个股；
- 上游、下游、竞争、客户、供应、股权和相邻关系；
- 一个公司连接多个行业。

无法解决的冲突、缺少的资料和待继续分析的问题写入现有页面的开放问题区，或按 Schema 创建 query 页面。缺口至少记录问题、影响和补料方向。

## 11. Repository and Git lifecycle

所有对象目录进入同一个本地 Git 仓库。仓库级 `log.md` 记录对象创建、整个对象删除、跨对象变更和恢复；对象仍存在时的知识维护由对象 `wiki/log.md` 记录。SQLite 只保存关注关系、对象元数据、事件、数据源连接和上传记录。接口缓存、临时解析文件、运行日志、tick 和完整聊天不进入 Git。

一次自然 checkpoint 包含：

```text
Raw / Source 登记
→ Schema 与 Wiki 更新
→ Index / Overview / Memory 更新
→ Log 追加
→ 当前报告标记待更新或完成更新
→ 单次 Git commit
```

普通用户只看到“变更记录”和“恢复”。恢复通过反向变更形成新 checkpoint，不使用破坏历史的 reset，也不展示 commit、hash 或分支。

## 12. Mutation transaction

用户资料编辑、删除，用户主动或破坏性的 Schema 更新，以及研究档案删除必须执行：

```text
预览影响
→ 显示受影响对象、页面、当前报告和数据缺口
→ 用户二次确认
→ 原子更新 Raw 关系、Schema、Wiki、Memory、Log 和报告状态
→ Git checkpoint
```

任一步失败则保留原状态，不允许 Raw 已改、Wiki 未改或报告半更新。

### 12.1 Research-record deletion

“删除研究档案”删除该对象的 Purpose、Schema、Wiki、Memory、当前报告、研究状态、关系和关注状态，并停止更新。用户上传的原始资料保留在数据页，解除对象关联。删除动作在移除对象前写入仓库级 `log.md`，并与删除事务形成同一 checkpoint；因此对象 `wiki/log.md` 可以随对象删除，而删除历史仍能通过“变更记录”读取和恢复。

## 13. Public interfaces

实现至少提供：

- `initializeKnowledgeObject(object)`：建立 Purpose、Schema、Raw 和 Wiki 最小结构；
- `ingestSource(source, object)`：登记 Source 并按 Schema 维护 Wiki；
- `compileWiki(object, changedSources)`：创建、更新、重组页面及 Index / Overview；
- `readWikiContext(object, query)`：按 Index 定位相关 Wiki 与 Raw 锚点；
- `appendObjectMemory(object, entry)`：写入长期 Memory 候选；
- `readEvidenceAnchors(object, statements)`：读取关键陈述的来源锚点；
- `previewSourceMutation(change)` / `applySourceMutation(change)`；
- `previewSchemaMutation(change)` / `applySchemaMutation(change)`；
- `previewResearchRecordDeletion(object)` / `deleteResearchRecord(object)`；
- `listChangeHistory(scope)` / `restoreCheckpoint(id)`。

确定性写入、删除、恢复和计算由 Tool / Command 实现；Agent 决定分析、页面维护和解释，不直接绕过事务边界写最终状态。

## 14. Failure semantics

- Source 无法解析：保留资料登记和失败原因，不生成伪内容；允许重新解析或删除；
- Schema 不可用：使用默认通用 Schema 建立最小 Wiki，并标记待修复；
- Wiki 生成中断：保留最后成功页面，不写半个文件；
- 无法定位原文：关键陈述降级并形成缺口；
- 来源冲突：保留双方，不静默覆盖；
- 动态数据失败：保留最近成功值及时间，明确当前不可用；
- Git checkpoint 失败：整次知识变更回滚；
- Memory 提取失败：不阻断当前回答；
- 删除失败：保留原对象并返回可恢复错误。

## 15. Business validation

- 新对象立即获得 Purpose、Schema、Raw 和 Wiki 最小结构，内容允许稀疏；
- `wiki/index.md` 只列实际页面，`wiki/overview.md` 能导航当前已知内容；
- 新 Source 能更新多个已有页面，而不是只追加一份摘要；
- 除 `wiki/log.md` 和 Raw 外，当前 Wiki 页面可以被 Agent 重写和重组；
- 新分析维度只有在可复用时才演化 Schema，不预建行业字段；
- 个股与一个或多个行业可以双向链接；
- 关键数字和判断可回到来源、位置和数据时间；
- Wiki 与动态价格、模型和当前报告保持分层；
- 用户主动或破坏性的 Schema 更新、资料编辑、删除和恢复均有影响预览、确认和原子边界；Agent 的非破坏性 Schema 演化有日志和 checkpoint；
- 普通用户界面不出现 Wiki、Git、commit、hash 或文件路径。
