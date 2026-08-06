# 推理芯片的四十二年（inference-silicon-cn）

围绕「推理芯片四十二年周期（1985–2026）」的交互式中文研究报告静态网站。
核心问题：2023–2026 年的推理芯片繁荣，是旧周期的再次上演，还是一轮受新约束驱动的新周期？

## 运行

无构建步骤，任意静态服务器即可：

```bash
cd inference-silicon-cn
python3 -m http.server 8765
# 打开 http://localhost:8765/
```

注意：必须通过 HTTP 访问（Dashboard 地球需 fetch `vendor/land-110m.json`），直接双击 file:// 打开会导致地图数据加载失败。

## 技术栈

- HTML5 + CSS3 + Vanilla JavaScript（无框架、无构建）
- D3.js v7 + TopoJSON Client（本地 `vendor/`，运行时不依赖任何外部 CDN）
- SVG + Canvas 图表（26 张可交互图表 + 三模式 Cover + 正射投影点阵地球 Dashboard）
- ET Book 字体本地嵌入（拉丁字符），中文使用宋体系字体

## 结构

```
├── index.html            # 19 个章节 + Cover + Era Rail + Dashboard + Footer
├── css/                  # fonts.css（ET Book @font-face）、style.css（设计 tokens 与布局）
├── js/
│   ├── data.js           # K1–K41 数据注册表、Dashboard 状态机、26 图表数据（全站数字唯一来源）
│   ├── utils.js          # tooltip / drill card / Canvas DPR 工具
│   ├── cover*.js         # Cover 三模式：A 递归 / B 爆炸图 / C 蓝图
│   ├── dashboard.js      # 右侧固定 460px Dashboard（点阵地球 + mini chart + metrics + cohort）
│   ├── main.js           # 启动、eager 渲染、IntersectionObserver、hash 导航
│   └── charts/           # 26 个图表模块（25 个文件）
└── vendor/               # d3.min.js / topojson-client.min.js / land-110m.json
```

## 数据纪律

- 全部关键数字来自 `js/data.js` 的 K1–K41 注册表，图表与正文不各自为政
- 缺失数据一律标记「未披露」，不插值
- 情景乘法只使用美元口径；单位份额、晶圆份额、美元份额并列展示但不混用
- 来源分四类：公司披露 / 券商研究 / 行业与官方 / 研究综合；聚合转载不进入情景计算
- 数据日期：2026-07-12，更新于 2026-07-14

## 免责声明

本站仅供信息参考，不构成投资建议；不提供买入、卖出、持有评级，不提供目标价。
