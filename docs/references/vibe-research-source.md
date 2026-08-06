看完了。这个项目的定位是「**A 股主推 + 美股/港股兼看**」，数据源确实拆成两套工具箱（姊妹项目），后端再各移植一份做接口。梳理如下：

## 一、整体架构

```
Vibe-Research/
├── a-stock-data/      A股数据工具箱 v3.6.0（10层 · 47端点 · 15数据源）→ backend/astock.py 移植
├── global-stock-data/ 美股/港股数据工具箱 v2.0.3（13层 · 30+端点 · 11数据源）→ backend/gstock.py 移植
└── backend/           FastAPI :8900（两套路由，见下）
```

## 二、A股数据源（`a-stock-data/SKILL.md`，15个）

| 优先级 | 数据源 | 用途 | 封IP风险 |
|---|---|---|---|
| 1 | mootdx（通达信 TCP 7709） | K线/五档/逐笔/财务/F10 | 不封 |
| 2 | 腾讯财经 | 实时价/PE/PB/市值/涨跌停/指数/ETF | 不封 |
| 3 | 同花顺 | 热点/北向/一致预期 | 极低 |
| 4 | 百度股市通 | K线 | 极低 |
| 5 | 新浪财经 | 财报三表 | 低 |
| 6 | 巨潮 cninfo | 公告全文 | 低 |
| 7 | iwencai | 语义搜索（唯一要 Key 的） | 低 |
| 8 | 东财（datacenter/push2/reportapi/search…） | 龙虎榜/两融/大宗/资金流/研报/新闻等独有数据 | 中，会封，统一走 `em_get()` 限流 |
| 备胎 | 沪深交易所官方 / 新浪 / HKEX | 主源被封时降级 | — |

原则：**能走通达信/腾讯就优先（不封 IP），东财只用于独有数据**，且已内置 1s+抖动串行限流。

## 三、美股/港股数据源（`global-stock-data/SKILL.md`，11个，全部零鉴权）

| 数据源 | 合规级 | 覆盖 |
|---|---|---|
| SEC EDGAR | **S**（可商用可再分发） | Filing/XBRL/申报流/全文检索/全市场筛选 |
| US Treasury | **S** | 收益率曲线 1M~30Y |
| CFTC | **S** | COT 持仓报告 |
| FINRA | B | 全市场每日空头成交量 |
| CBOE | C（需授权） | 期权链+希腊字母+IV+0DTE |
| Nasdaq | C | 财报日历 |
| 东财 / Yahoo / 新浪 / 腾讯 | C（personal use） | 美港股行情/资金流/三表 |

这家的特色是 **V2.0 起「官方源优先」**，每个源都标了合规级别和条款原文（甚至主动删掉了 HKEX CCASS 抓取代码，因为其条款禁止爬取）。

## 四、后端两套接口（`backend/app.py`）

1. **A股接口**（主，数据来自 `astock.py`）：`/api/indices`、`/api/quote`、`/api/valuation`、`/api/financials`、`/api/reports`、`/api/announcements`、`/api/news`、`/api/kline`、`/api/finance`、资金面全家桶（`margin`/`block-trade`/`holders`/`dividend`/`fund-flow`/`dragon-tiger`/`lockup`/`blocks`/`hot-concepts`/`investor-qa`/`industry`）、`/api/market/*`、`/api/radar`

2. **美股接口**（轻量，数据来自 `gstock.py`）：`/api/global/indices`、`/api/global/stock`、`/api/global/hk/cashflow`

注意一点：**gstock.py 只移植了「域内（东财）」的合规子集**——因为 Yahoo/SEC 等国外源需要科学上网且非必需，所以美股这块只并入全球指数 + 美港股行情 + 关键财务指标，服务 A 股「看隔夜外围脸色」的场景。而完整的 13 层美股能力（CBOE 期权、FINRA 空头、SEC EDGAR）只存在于 `global-stock-data/SKILL.md` 里供 agent 直接用，后端没全搬。

另外后端还带 AI 层：`/api/chat`（function calling）、`/api/debate`（多空辩论）、`/api/reflect`（反思审计）、`mcp_server.py`（MCP 接入 Claude Code 等 agent）。

要我深入看哪一套的某个具体接口吗？