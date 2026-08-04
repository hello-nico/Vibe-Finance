/* 行业详情页编排：数据装载、组件挂载与页面级交互。 */
(function () {
  const params = new URLSearchParams(location.search);
  const industryName = params.get("name") || IndustryData.DEFAULT_NAME;
  const state = { industry: null, activeStage: null, tableView: "market" };

  const byId = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const element = byId(id);
    if (element) element.textContent = value;
  };

  function mountOverview() {
    byId("industry-overview").innerHTML = IndustryComponents.renderOverview(state.industry);
  }

  function mountChain() {
    byId("industry-chain-slot").innerHTML = IndustryComponents.renderChain(
      state.industry.chain,
      state.activeStage
    );
    byId("industry-chain-slot").querySelectorAll("[data-stage]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeStage = button.dataset.stage;
        mountChain();
        const stage = state.industry.chain.find((item) => item.id === state.activeStage);
        if (stage && typeof window.__industryOpenAgent === "function") {
          window.__industryOpenAgent(
            `${stage.name} · ${stage.signal?.label || "环节"}`,
            `当前关注产业链「${stage.name}」。角色：${stage.role}。代表公司：${(stage.companies || []).join("、")}。信号：${stage.signal?.detail || "—"}。请基于这些客观信息回答。`
          );
        }
      });
    });
  }

  function mountSignals() {
    byId("industry-signals-slot").innerHTML = IndustryComponents.renderSignals(
      state.industry.signals
    );
  }

  function mountConstituents() {
    const slot = byId("industry-companies-slot");
    slot.innerHTML = IndustryComponents.renderConstituents(
      state.industry.constituents,
      state.tableView
    );
    slot.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.tableView = button.dataset.view;
        mountConstituents();
      });
    });
    slot.querySelectorAll("tr[data-stock]").forEach((row) => {
      row.addEventListener("click", (event) => {
        if (event.target.closest("a")) return;
        location.href = `05-stock.html?name=${encodeURIComponent(row.dataset.stock)}`;
      });
    });
  }

  function setupJoinResearch() {
    const button = byId("industry-research");
    button?.addEventListener("click", (event) => {
      event.preventDefault();
      if (button.dataset.joined === "1") {
        location.href = "02-research.html";
        return;
      }
      button.dataset.joined = "1";
      button.classList.add("joined");
      button.textContent = "已加入 · 去研究";
    });
  }

  function setupRealtime() {
    const button = byId("industry-realtime");
    let enabled = true;
    try {
      enabled = localStorage.getItem("vf-market-realtime") !== "off";
    } catch (error) { /* storage may be unavailable in a file preview */ }

    function sync() {
      button?.classList.toggle("on", enabled);
      button?.setAttribute("aria-pressed", enabled ? "true" : "false");
      button?.setAttribute(
        "title",
        enabled ? "实时行情已开启，点击暂停自动刷新" : "实时行情已暂停，点击开启自动刷新"
      );
    }

    button?.addEventListener("click", () => {
      enabled = !enabled;
      try {
        localStorage.setItem("vf-market-realtime", enabled ? "on" : "off");
      } catch (error) { /* ignore */ }
      sync();
    });
    sync();
  }

  function setupAgent() {
    const shell = byId("shell");
    const agent = byId("agent");
    const button = byId("btn-agent");

    function openAgent(context, greeting) {
      if (context) setText("agent-ctx", `行业数据 · ${context}`);
      if (greeting) {
        const greet = byId("agent-greeting");
        if (greet) {
          greet.innerHTML = "";
          const who = document.createElement("div");
          who.className = "who";
          who.textContent = "助手";
          greet.appendChild(who);
          greet.append(greeting);
        }
      }
      shell?.classList.add("agent-open");
      agent?.setAttribute("aria-hidden", "false");
      button?.classList.add("on");
    }
    window.__industryOpenAgent = openAgent;
    function closeAgent() {
      shell?.classList.remove("agent-open");
      agent?.setAttribute("aria-hidden", "true");
      button?.classList.remove("on");
    }
    function appendMessage(role, text, strongName) {
      const body = byId("agent-body");
      if (!body) return;
      const message = document.createElement("div");
      message.className = role === "user" ? "msg user" : "msg";
      const who = document.createElement("div");
      who.className = "who";
      who.textContent = role === "user" ? "你" : "助手";
      message.appendChild(who);
      if (strongName) {
        message.append("关于");
        const strong = document.createElement("strong");
        strong.textContent = strongName;
        message.appendChild(strong);
        message.append(`：「${text}」——原型示意回复，正式环境将基于产业链、景气数据与重点公司资料回答。`);
      } else {
        message.append(text);
      }
      body.appendChild(message);
      body.scrollTop = body.scrollHeight;
    }
    function sendQuestion(question) {
      appendMessage("user", question);
      appendMessage("assistant", question, state.industry.identity.name);
    }

    button?.addEventListener("click", () => {
      shell?.classList.contains("agent-open") ? closeAgent() : openAgent();
    });
    agent?.addEventListener("click", () => {
      if (!shell?.classList.contains("agent-open")) openAgent();
    });
    byId("agent-close")?.addEventListener("click", (event) => {
      event.stopPropagation();
      closeAgent();
    });
    byId("agent-suggest")?.addEventListener("click", (event) => {
      const suggestion = event.target.closest("button[data-q]");
      if (!suggestion) return;
      openAgent();
      sendQuestion(suggestion.dataset.q);
    });
    byId("agent-send")?.addEventListener("click", () => {
      const input = byId("agent-input");
      const question = input?.value.trim();
      if (!question) return;
      input.value = "";
      sendQuestion(question);
    });
    byId("agent-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") byId("agent-send")?.click();
    });
  }

  async function init() {
    state.industry = await IndustryData.loadIndustry(industryName);
    state.activeStage = state.industry.chain[0]?.id || null;
    const name = state.industry.identity.name;

    document.title = `投研助手 · ${name}`;
    setText("crumb-name", name);
    setText("agent-obj", name);
    setText("agent-greet-name", name);

    mountOverview();
    mountChain();
    mountSignals();
    mountConstituents();
    setupJoinResearch();
    setupRealtime();
    setupAgent();
  }

  init().catch((error) => {
    console.error("行业详情装载失败", error);
    byId("industry-overview").innerHTML = '<div class="industry-empty">行业数据装载失败，请稍后重试。</div>';
  });
})();
