// Case browser with 3D previews, demo player and practice mode. Shared by the F2L and PLL tabs.
(function (global) {
  'use strict';

  // Scramble line with a copy button, shared with the OLL page.
  function scrambleBlock(text) {
    return `
      <div class="scramble">
        <span class="scramble-label">Scramble</span>
        <span class="scramble-moves">${text}</span>
        <button class="btn small copy" type="button" data-copy="${text}">Copy</button>
        <div class="hint">From a solved cube, yellow on top and green in front.</div>
      </div>`;
  }

  // cfg: { prefix, label, module } where module has CASES, GROUPS, solutionMoves, solutionText, scrambleText.
  function createCaseTrainer(cfg) {
    const { CASES, GROUPS } = cfg.module;
    const $ = (name) => document.getElementById(`${cfg.prefix}-${name}`);

    let current = null; // { caseObj, auf }
    let practice = null; // { revealed } while practicing
    const groupsOn = new Set(GROUPS);

    const player = createPlayer($('player'));

    // ---------- Case images ----------
    const imageCache = new Map();

    // 3D snapshot of a case, rendered once and cached.
    function caseImage(caseObj, auf, size) {
      const key = `${caseObj.id}-${auf}-${size}`;
      if (!imageCache.has(key)) imageCache.set(key, CubeViewer.snapshot(caseObj.states[auf], size));
      return `<img class="cube-img" src="${imageCache.get(key)}" width="${size}" height="${size}" alt="${cfg.label} ${caseObj.id}">`;
    }

    // Optional top-view diagram, e.g. PLL arrows.
    function diagram(caseObj, auf, size) {
      return cfg.module.diagramSvg ? cfg.module.diagramSvg(caseObj.states[auf], size) : '';
    }

    // ---------- Result ----------
    function renderResult() {
      const el = $('result');
      if (!current) {
        el.innerHTML = '<div class="empty">Pick a case from the list below, or press <b>Random case</b> to practice.</div>';
        return;
      }
      const { caseObj, auf } = current;
      const hidden = practice && !practice.revealed;
      const title = hidden ? 'Which case is this?' : `${cfg.label} ${caseObj.id}`;
      const sub = hidden ? 'Try it on your cube first' : caseObj.group + (auf ? ' - includes the U turn to line it up' : '');
      const algLine = hidden
        ? '<button class="btn primary reveal" type="button">Reveal algorithm</button>'
        : `<span class="alg">${cfg.module.solutionText(caseObj, auf)}</span>
           <button class="btn small copy" type="button" data-copy="${cfg.module.solutionText(caseObj, auf)}">Copy</button>`;
      el.innerHTML = `
        <div class="result-head">
          ${caseImage(caseObj, auf, 96)}${hidden ? '' : diagram(caseObj, auf, 84)}
          <div>
            <p class="case-title">${title}</p>
            <div class="case-group">${sub}</div>
          </div>
        </div>
        <div class="alg-line">${algLine}</div>
        ${hidden ? '' : scrambleBlock(cfg.module.scrambleText(caseObj, auf))}`;
    }

    $('result').addEventListener('click', (e) => {
      if (!e.target.closest('.reveal')) return;
      practice.revealed = true;
      player.setHidden(false);
      renderResult();
      renderGallery();
    });

    // ---------- Practice ----------
    function renderPracticeGroups() {
      $('groups').innerHTML = GROUPS.map((g) => {
        const n = CASES.filter((c) => c.group === g).length;
        return `<button type="button" class="chip ${groupsOn.has(g) ? 'on' : ''}" data-group="${g}" aria-pressed="${groupsOn.has(g)}">${g} <span>${n}</span></button>`;
      }).join('');
    }

    $('groups').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      const g = chip.dataset.group;
      if (groupsOn.has(g)) groupsOn.delete(g);
      else groupsOn.add(g);
      renderPracticeGroups();
    });

    $('random').addEventListener('click', () => {
      const pool = CASES.filter((c) => groupsOn.has(c.group));
      if (!pool.length) return;
      let pick;
      do {
        pick = pool[Math.floor(Math.random() * pool.length)];
      } while (pool.length > 1 && current && current.caseObj === pick);
      practice = { revealed: false };
      select(pick, Math.floor(Math.random() * 4));
    });

    // ---------- Gallery ----------
    function renderGallery() {
      $('gallery').innerHTML = GROUPS.map((g) => {
        const items = CASES.filter((c) => c.group === g).map((c) => {
          const active = current && current.caseObj === c && !(practice && !practice.revealed);
          return `<button type="button" class="case ${active ? 'active' : ''}" data-id="${c.id}" title="${c.alg}"><div class="case-pics">${caseImage(c, 0, 112)}${diagram(c, 0, 88)}</div><div>${c.id}</div></button>`;
        }).join('');
        return `<div class="group"><h3>${g}</h3><div class="cases">${items}</div></div>`;
      }).join('');
    }

    $('gallery').addEventListener('click', (e) => {
      const btn = e.target.closest('.case');
      if (!btn) return;
      practice = null;
      select(CASES.find((c) => String(c.id) === btn.dataset.id), 0);
    });

    // ---------- Main ----------
    function select(caseObj, auf) {
      current = { caseObj, auf };
      renderResult();
      renderGallery();
      const moves = cfg.module.solutionMoves(caseObj, auf);
      // Algorithms ending with the cube rotated get a regrip so the demo ends upright.
      const regrip = Cube.regripMoves(Cube.applyAlg(Cube.cloneCube(caseObj.states[auf]), moves));
      player.load(caseObj.states[auf], moves.concat(regrip), { hidden: Boolean(practice), extraLast: regrip.length });
      document.getElementById(`tab-${cfg.prefix}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    renderPracticeGroups();
    renderResult();
    renderGallery();
  }

  global.createCaseTrainer = createCaseTrainer;
  global.scrambleBlock = scrambleBlock;
})(this);
