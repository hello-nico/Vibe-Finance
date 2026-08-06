# 数据源分析：`data_provider/`

项目采用**策略模式**：`BaseFetcher`（抽象基类）+ `DataFetcherManager`（自动 failover 管理器），每个数据源是一个 Fetcher 子类，通过统一接口暴露能力。

## 1. 统一接口（`BaseFetcher`，data_provider/base.py）

| 接口 | 签名 | 说明 |
| --- | --- | --- |
| 日线获取 | `get_daily_data(stock_code, start_date, end_date, days=30) -> DataFrame` | 统一入口：算日期范围 → `_fetch_raw_data()` → `_normalize_data()` → 清洗 → 算指标（MA5/10/20、volume_ratio） |
| 原始数据 | `_fetch_raw_data(stock_code, start_date, end_date)` | 抽象方法，子类必须实现 |
| 标准化 | `_normalize_data(df, stock_code)` | 抽象方法，统一为 `['date','open','high','low','close','volume','amount','pct_chg']` |
| 实时行情 | `get_realtime_quote(stock_code) -> UnifiedRealtimeQuote` | 统一返回类型（data_provider/realtime_types.py） |
| 股票名称 | `get_stock_name(stock_code)` | 缓存于 manager |
| 大盘 | `get_main_indices(region="cn")` / `get_market_stats()` | 指数点位、涨跌家数/涨停数 |
| 板块/热点 | `get_sector_rankings(n)` / `get_concept_rankings(n)` / `get_hot_stocks(n)` / `get_limit_up_pool(date, n)` | 涨跌板块榜、人气股、涨停池 |
| 可用性探针 | `is_available_for_request(capability)` / `is_available()` / `_is_available()` | manager 在请求前过滤不可用源 |

**`DataFetcherManager` 对外还提供**：`prefetch_realtime_quotes`、`prefetch_daily_klines`、`get_chip_distribution`（筹码分布）、`get_fundamental_context` / `get_capital_flow_context` / `get_dragon_tiger_context` / `get_board_context`（基本面/资金流/龙虎榜/所属板块，经 `AkshareFundamentalAdapter` / `YfinanceFundamentalAdapter`），以及 `get_stock_name` / `batch_get_stock_names`。

## 2. 数据源清单（含底层接口）

**默认免费链路（当前 .env 所有 token 均为空，实际生效的就是这一组）：**

| Fetcher | 优先级 | 底层数据源 / 接口 |
| --- | --- | --- |
| `EfinanceFetcher` | 0 | 东方财富，经 efinance 库：`ef.stock.get_quote_history()`（K线）、`get_realtime_quotes()`、`get_base_info()`、`get_belong_board()` |
| `AkshareFetcher` | 1 | akshare 库；实时行情直连 `http://hq.sinajs.cn/list=...`（新浪）、`http://qt.gtimg.cn/q=...`（腾讯）；另有涨停池、人气股、板块、筹码分布 `get_chip_distribution` |
| `PytdxFetcher` | 2 | 通达信 pytdx 协议（TCP 直连行情服务器，可配 `PYTDX_HOST/PYTDX_PORT`） |
| `BaostockFetcher` | 3 | baostock 库（`get_stock_list`、`get_stock_name`） |
| `YfinanceFetcher` | 4 | yahoo finance（yfinance 库），覆盖 cn/hk/us/jp/kr/tw；美股兜底直连 Stooq：`https://stooq.com/q/l/?s=...` 与 `/q/d/l/?s=...&i=d` |
| `TencentFetcher` | 5 | 腾讯直连：K线 `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get`、实时 `qt.gtimg.cn`（A 股最终兜底） |

**可选源（配置 token 后注入，当前未启用）：**

| Fetcher | 优先级 | 底层接口 | 配置 |
| --- | --- | --- | --- |
| `TushareFetcher` | 2→**0**（有 token 自动提升） | Tushare Pro：`http://api.tushare.pro`（POST，`daily`/`hk_daily`/`fund_daily`、实时行情、指数、市场统计、板块、筹码、股票列表） | `TUSHARE_TOKEN`、`TUSHARE_HTTP_URL` |
| `TickFlowFetcher` | 2（可配） | TickFlow SDK（批量日K、实时、指数、市场宽度、板块） | `TICKFLOW_API_KEY` |
| `LongbridgeFetcher` | 5 | 长桥 OpenAPI：`https://openapi.longbridge.cn/.com`（港美股日线/实时，OAuth，懒加载） | `LONGBRIDGE_*` |
| `FinnhubFetcher` | 2 | `https://finnhub.io/api/v1`（美股） | `FINNHUB_API_KEY` |
| `AlphaVantageFetcher` | 3 | `https://www.alphavantage.co/query`（美股） | `ALPHAVANTAGE_API_KEY` |

**独立工具类（非 BaseFetcher 子类）：** `TwInstitutionalFetcher` — 台湾三大法人买卖超，直连 `https://www.twse.com.tw/rwd/zh/fund/T86` + `https://www.tpex.org.tw/openapi/v1/tpex_3insti_daily_trading`，接口 `get_institutional_net()`。

## 3. 路由与 failover 策略

- **A 股（cn）**：按优先级 0→5 循环尝试，单源失败自动切下一个，连续 3 次失败由 `CircuitBreaker` 熔断该源 300 秒。
- **美股（us）**：专用路由 `Finnhub(P2) → AlphaVantage(P3) → Yfinance(P4) → Longbridge(P5)`；配置长桥后 Longbridge 置首；**美股指数始终 Yfinance 首选**。
- **港股（hk）**：先过滤不支持港股的源（`_DAILY_MARKET_FETCHER_SUPPORT`），再走通用循环（Longbridge → AkShare/Tushare → Yfinance）。
- **日/韩/台**：走 Yfinance 等支持后缀代码的源。
- **实时行情**：由 `REALTIME_SOURCE_PRIORITY` 控制（默认 `tencent,akshare_sina,efinance,akshare_em`；配了 TUSHARE_TOKEN 且未显式指定时 tushare 自动置首），`RealtimeSource` 枚举标记来源，失败记录 `fallback_from`。
- **大盘复盘**：配置 `TICKFLOW_API_KEY` 时优先 TickFlow，失败回退 AkShare/Tushare/Efinance 链路（详见 docs/data-source-stability.md）。

## 4. 当前实际生效状态

`.env` 中 `TUSHARE_TOKEN`、`TICKFLOW_API_KEY`、`FINNHUB_API_KEY`、`ALPHAVANTAGE_API_KEY`、`LONGBRIDGE_*`、`PYTDX_HOST` 均为空 → **实际生效的是免费源链路：Efinance → AkShare → Pytdx → Baostock → Yfinance(+Stooq) → Tencent**，美股仅 Yfinance/Finnhub/AlphaVantage 可用（后两者无 key，实际只有 Yfinance），港股靠 AkShare/Tushare/Yfinance。