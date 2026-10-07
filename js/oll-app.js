(function () {
  'use strict';

  const { SLOTS, CENTER, CASES } = Oll;
  const $ = (id) => document.getElementById(id);

  let bits = SLOTS.map((_, i) => i === CENTER);
  let current = null; // { caseObj, auf }

  const player = createPlayer($('oll-player'));

  // ---------- Pattern thumbnail ----------
  const SIZES = [5, 12, 12, 12, 5];
  const OFFS = SIZES.map((_, i) => SIZES.slice(0, i).reduce((a, b) => a + b, 0) + i);

  function patternSvg(pattern, size) {
    const rects = SLOTS.map((s, i) => {
      const cls = pattern[i] ? 'y' : 'n';
      return `<rect class="${cls}" x="${OFFS[s.gc]}" y="${OFFS[s.gr]}" width="${SIZES[s.gc]}" height="${SIZES[s.gr]}" rx="1.5"/>`;
    }).join('');
    return `<svg class="pat" viewBox="0 0 50 50" width="${size}" height="${size}" aria-hidden="true">${rects}</svg>`;
  }

  // ---------- Picker ----------
  function renderPicker(result) {
    const bad = new Set();
    result.pieces.filter((pc) => pc.status === 'bad').forEach((pc) => pc.slots.forEach((i) => bad.add(i)));
    $('oll-picker').innerHTML = SLOTS.map((s, i) => {
      const cls = ['cell', bits[i] ? 'on' : '', s.top ? '' : 'side', i === CENTER ? 'fixed' : '', bad.has(i) ? 'bad' : '']
        .filter(Boolean)
        .join(' ');
      return `<button type="button" class="${cls}" data-i="${i}" style="grid-row:${s.gr + 1};grid-column:${s.gc + 1}" aria-pressed="${bits[i]}" aria-label="sticker ${i}"></button>`;
    }).join('');
  }

  $('oll-picker').addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const i = Number(cell.dataset.i);
    if (i === CENTER) return;
    bits[i] = !bits[i];
    update();
  });

  $('oll-clear').addEventListener('click', () => {
    bits = SLOTS.map((_, i) => i === CENTER);
    update();
  });

  // ---------- Result ----------
  function renderStatus(result) {
    const unknown = result.pieces.filter((pc) => pc.status === 'empty').length;
    const n = result.candidates.length;
    let html;
    if (result.hasBad) {
      html = '<span class="err">Each corner and edge has exactly one yellow sticker. Fix the pieces outlined in red.</span>';
    } else if (result.complete && n === 0) {
      html = '<span class="err">This pattern is impossible on a real cube. Double-check your stickers.</span>';
    } else if (n === 1) {
      html = result.complete ? 'Exact match found.' : `Match found (${unknown} piece${unknown === 1 ? '' : 's'} not marked yet, but only one case fits).`;
    } else {
      html = `${n} cases still fit. Mark ${unknown} more piece${unknown === 1 ? '' : 's'} (one yellow sticker each).`;
    }
    $('oll-status').innerHTML = html;
  }

  function renderResult() {
    if (!current) {
      $('oll-result').innerHTML = '<div class="empty">Mark the yellow stickers on the left to find your OLL case.</div>';
      return;
    }
    const { caseObj, auf } = current;
    const moves = Oll.solutionMoves(caseObj, auf);
    const aufText = auf ? `<span class="auf">${Cube.moveName(moves[0])}</span> ` : '';
    $('oll-result').innerHTML = `
      <div class="result-head">
        ${patternSvg(caseObj.patterns[auf], 72)}
        <div>
          <p class="case-title">OLL ${caseObj.id}</p>
          <div class="case-group">${caseObj.group}${auf ? ' - turn U first to line it up' : ''}</div>
        </div>
      </div>
      <div class="alg-line">
        <span class="alg">${aufText}${caseObj.alg}</span>
        <button class="btn small copy" type="button" data-copy="${Oll.solutionText(caseObj, auf)}">Copy</button>
      </div>
      ${scrambleBlock(Oll.scrambleText(caseObj, auf))}`;
  }

  // ---------- Gallery ----------
  function renderGallery(result) {
    const fit = new Map(result.candidates.map((m) => [m.caseObj.id, m.auf]));
    const groups = [...new Set(CASES.map((c) => c.group))].sort();
    $('oll-gallery').innerHTML = groups.map((g) => {
      const items = CASES.filter((c) => c.group === g).map((c) => {
        const auf = fit.has(c.id) ? fit.get(c.id) : 0;
        const cls = ['case', fit.has(c.id) ? '' : 'dim', current && current.caseObj.id === c.id ? 'active' : '']
          .filter(Boolean)
          .join(' ');
        return `<button type="button" class="${cls}" data-id="${c.id}" title="${c.alg}">${patternSvg(c.patterns[auf], 56)}<div>${c.id}</div></button>`;
      }).join('');
      return `<div class="group"><h3>${g}</h3><div class="cases">${items}</div></div>`;
    }).join('');
    $('oll-gallery-count').textContent = `${fit.size} of ${CASES.length} fit`;
  }

  $('oll-gallery').addEventListener('click', (e) => {
    const btn = e.target.closest('.case');
    if (!btn) return;
    const c = CASES.find((x) => x.id === Number(btn.dataset.id));
    bits = c.patterns[0].slice();
    update();
    $('oll-picker').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- Main update ----------
  function loadDemo() {
    if (current) {
      player.load(current.caseObj.states[current.auf], Oll.solutionMoves(current.caseObj, current.auf), { aufFirst: current.auf > 0 });
    } else {
      player.load(Cube.solvedCube(), []);
    }
  }

  function update() {
    const result = Oll.match(bits);
    const next = !result.hasBad && result.candidates.length === 1 ? result.candidates[0] : null;
    const changed = (next && next.caseObj.id + '-' + next.auf) !== (current && current.caseObj.id + '-' + current.auf);
    current = next;
    renderPicker(result);
    renderStatus(result);
    renderResult();
    renderGallery(result);
    if (changed) loadDemo();
  }

  update();
  loadDemo();
})();
