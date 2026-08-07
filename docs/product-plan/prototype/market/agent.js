/**
 * 行情 Mode · 助手 dock 共享逻辑
 * 用法：在 market/shell.js 之后引入；页面设置 window.MKT_AGENT_CTX = { title, sub, body, ph, suggest? }。
 * dock 展开后派发 'mkt:agent-layout'，总览热力可重测尺寸。
 */
(function () {
  var shell = document.getElementById('shell');
  var drawer = document.getElementById('agent');
  var btnAgent = document.getElementById('btn-agent');
  if (!shell || !drawer) return;

  function ctx() {
    return (
      window.MKT_AGENT_CTX || {
        title: '今日市场',
        sub: '行情 · 助手',
        body: '会带上当前页的客观数据，判断由你的模型给出。',
        ph: '追问…',
      }
    );
  }

  function layout() {
    var ev;
    try {
      ev = new CustomEvent('mkt:agent-layout');
    } catch (e) {
      ev = document.createEvent('CustomEvent');
      ev.initCustomEvent('mkt:agent-layout', false, false, null);
    }
    requestAnimationFrame(function () {
      window.dispatchEvent(ev);
    });
    clearTimeout(layout._t);
    layout._t = setTimeout(function () {
      window.dispatchEvent(ev);
    }, 340);
  }

  function applySuggest(list) {
    var box = document.getElementById('agent-suggest');
    if (!box || !Array.isArray(list) || !list.length) return;
    box.innerHTML = list
      .map(function (label) {
        return '<button type="button">' + String(label)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;') + '</button>';
      })
      .join('');
  }

  function open(fromAi) {
    var c = ctx();
    shell.classList.add('agent-open');
    drawer.setAttribute('aria-hidden', 'false');
    btnAgent && btnAgent.classList.add('on');
    var t = document.getElementById('agent-title');
    var s = document.getElementById('agent-sub');
    var b = document.getElementById('agent-body-text');
    var i = document.getElementById('agent-input');
    if (t) t.textContent = c.title;
    if (s) s.textContent = c.sub + (fromAi ? ' · 一键' : ' · 助手');
    if (b) b.textContent = c.body;
    if (i && c.ph) i.placeholder = c.ph;
    if (c.suggest) applySuggest(c.suggest);
    layout();
  }

  function close() {
    shell.classList.remove('agent-open');
    drawer.setAttribute('aria-hidden', 'true');
    btnAgent && btnAgent.classList.remove('on');
    layout();
  }

  window.MKT_AGENT = { open: open, close: close };

  btnAgent &&
    btnAgent.addEventListener('click', function () {
      if (shell.classList.contains('agent-open')) close();
      else open(false);
    });
  document.getElementById('agent-close') &&
    document.getElementById('agent-close').addEventListener('click', close);
})();
