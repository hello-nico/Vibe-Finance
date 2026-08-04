/* 个股详情页编排：读参、挂载、加入研究、助手抽屉 */
(function () {
  const params = new URLSearchParams(location.search);
  const name =
    params.get("name") ||
    (window.StockData && StockData.DEFAULT_NAME) ||
    "寒武纪";
  const stock = StockData.getStock(name);
  const realtimeButton = document.getElementById("stock-realtime");

  function readRealtime() {
    try {
      return localStorage.getItem("vf-market-realtime") !== "off";
    } catch (e) {
      return true;
    }
  }

  function syncRealtime(enabled) {
    if (!realtimeButton) return;
    realtimeButton.classList.toggle("on", enabled);
    realtimeButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    realtimeButton.title = enabled
      ? "实时行情已开启，点击暂停自动刷新"
      : "实时行情已暂停，点击开启自动刷新";
  }

  let realtimeEnabled = readRealtime();
  syncRealtime(realtimeEnabled);
  realtimeButton?.addEventListener("click", () => {
    realtimeEnabled = !realtimeEnabled;
    try {
      localStorage.setItem("vf-market-realtime", realtimeEnabled ? "on" : "off");
    } catch (e) { /* ignore unavailable storage */ }
    syncRealtime(realtimeEnabled);
  });

  // crumb
  const crumb = document.getElementById("crumb-name");
  if (crumb) crumb.textContent = stock.name;

  // mount cards
  const root = document.getElementById("stk-root");
  if (root) root.innerHTML = StockComponents.renderPage(stock);

  // agent copy
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  setText("agent-obj", stock.name);
  setText("agent-ctx", "个股数据 · 估值 / 财报 / 研报");
  setText("agent-greet-name", stock.name);

  const suggest = document.getElementById("agent-suggest");
  if (suggest) {
    suggest.innerHTML = [
      "这个估值贵不贵",
      "机构一致预期怎么看",
      "近期研报的分歧点",
      "有什么风险",
    ]
      .map((q) => `<button type="button" data-q="${q}">${q}</button>`)
      .join("");
  }

  // 加入研究
  const joinBtn = document.getElementById("stk-research");
  if (joinBtn) {
    joinBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (joinBtn.dataset.joined === "1") {
        location.href = "02-research.html";
        return;
      }
      joinBtn.dataset.joined = "1";
      joinBtn.classList.add("joined");
      joinBtn.textContent = "已加入 · 去研究";
    });
  }

  // 助手抽屉
  const shell = document.getElementById("shell");
  const agent = document.getElementById("agent");
  const btnAgent = document.getElementById("btn-agent");

  function openAgent(ctx) {
    if (ctx) setText("agent-ctx", "个股数据 · " + ctx);
    shell.classList.add("agent-open");
    agent.setAttribute("aria-hidden", "false");
    btnAgent.classList.add("on");
  }
  function closeAgent() {
    shell.classList.remove("agent-open");
    agent.setAttribute("aria-hidden", "true");
    btnAgent.classList.remove("on");
  }

  btnAgent?.addEventListener("click", () => {
    if (shell.classList.contains("agent-open")) closeAgent();
    else openAgent();
  });
  agent?.addEventListener("click", () => {
    if (!shell.classList.contains("agent-open")) openAgent();
  });
  document.getElementById("agent-close")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeAgent();
  });

  document.querySelectorAll("[data-agent]").forEach((el) => {
    el.addEventListener("click", () => {
      openAgent(el.dataset.agent);
      const body = document.getElementById("agent-body");
      body.insertAdjacentHTML(
        "beforeend",
        `<div class="msg"><div class="who">助手</div>已带入「${el.dataset.agent}」。可以继续追问估值位置、财报信号或是否值得加入研究。</div>`
      );
      body.scrollTop = body.scrollHeight;
    });
  });

  function sendAgent(q) {
    const body = document.getElementById("agent-body");
    body.insertAdjacentHTML(
      "beforeend",
      `<div class="msg user"><div class="who">你</div>${q}</div>` +
        `<div class="msg"><div class="who">助手</div>关于<strong>${stock.name}</strong>（${stock.code}）：「${q}」——原型示意回复，正式环境会结合估值分位、财报与研报客观数据作答。</div>`
    );
    body.scrollTop = body.scrollHeight;
  }

  suggest?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-q]");
    if (!b) return;
    openAgent();
    sendAgent(b.dataset.q);
  });
  document.getElementById("agent-send")?.addEventListener("click", () => {
    const input = document.getElementById("agent-input");
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    sendAgent(q);
  });
  document.getElementById("agent-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("agent-send")?.click();
  });

  document.title = `投研助手 · ${stock.name}`;
})();
