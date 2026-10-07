(function () {
  'use strict';

  const TABS = ['f2l', 'oll', 'pll'];

  function showTab() {
    const name = TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'oll';
    for (const t of TABS) {
      document.getElementById('tab-' + t).hidden = t !== name;
      document.querySelector(`.tabs [data-tab="${t}"]`).setAttribute('aria-current', t === name ? 'page' : 'false');
    }
  }

  createCaseTrainer({ prefix: 'f2l', label: 'F2L', module: F2l });
  createCaseTrainer({ prefix: 'pll', label: 'PLL', module: Pll });

  window.addEventListener('hashchange', showTab);
  showTab();

  // Copy buttons anywhere on the page carry their text in data-copy.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    navigator.clipboard.writeText(btn.dataset.copy).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    });
  });
})();
