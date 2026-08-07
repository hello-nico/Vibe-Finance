/**
 * 数据 Mode · 助手 dock 共享逻辑
 * 用法：在 data/shell.js 之后引入；页面设置 window.DATA_AGENT_CTX = { title, sub, body, ph, suggest? }。
 */
(function () {
  var shell = document.getElementById('shell');
  var drawer = document.getElementById('agent');
  var btnAgent = document.getElementById('btn-agent');
  if (!shell || !drawer) return;

  function ctx() {
    return (
      window.DATA_AGENT_CTX || {
        title: '数据',
        sub: '数据 · 助手',
        body: '会带上当前页的通道、资料或配置状态。',
        ph: '追问…',
      }
    );
  }

  function applySuggest(list) {
    var box = document.getElementById('agent-suggest');
    if (!box || !Array.isArray(list) || !list.length) return;
    box.innerHTML = list
      .map(function (label) {
        return '<button type="button">' + String(label)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') + '</button>';
      })
      .join('');
  }

  function open() {
    var c = ctx();
    shell.classList.add('agent-open');
    drawer.setAttribute('aria-hidden', 'false');
    btnAgent && btnAgent.classList.add('on');
    var t = document.getElementById('agent-title');
    var s = document.getElementById('agent-sub');
    var b = document.getElementById('agent-body-text');
    var i = document.getElementById('agent-input');
    if (t) t.textContent = c.title;
    if (s) s.textContent = c.sub;
    if (b) b.textContent = c.body;
    if (i && c.ph) i.placeholder = c.ph;
    if (c.suggest) applySuggest(c.suggest);
  }

  function close() {
    shell.classList.remove('agent-open');
    drawer.setAttribute('aria-hidden', 'true');
    btnAgent && btnAgent.classList.remove('on');
  }

  btnAgent &&
    btnAgent.addEventListener('click', function () {
      if (shell.classList.contains('agent-open')) close();
      else open();
    });
  document.getElementById('agent-close') &&
    document.getElementById('agent-close').addEventListener('click', close);
})();
