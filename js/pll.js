// PLL cases.
(function (global) {
  'use strict';

  const Cube = typeof require === 'function' ? require('./cube.js') : global.Cube;

  const PLL_DATA = [
    ['Aa', 'Adjacent Corner Swap', "x L2 D2 L' U' L D2 L' U L'"],
    ['Ab', 'Adjacent Corner Swap', "x' L2 D2 L U L' D2 L U' L"],
    ['F', 'Adjacent Corner Swap', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
    ['Ga', 'Adjacent Corner Swap', "R2 U R' U R' U' R U' R2 U' D R' U R D'"],
    ['Gb', 'Adjacent Corner Swap', "R' U' R U D' R2 U R' U R U' R U' R2 D"],
    ['Gc', 'Adjacent Corner Swap', "R2 U' R U' R U R' U R2 U D' R U' R' D"],
    ['Gd', 'Adjacent Corner Swap', "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
    ['Ja', 'Adjacent Corner Swap', "x R2 F R F' R U2 r' U r U2"],
    ['Jb', 'Adjacent Corner Swap', "R U R' F' R U R' U' R' F R2 U' R'"],
    ['Ra', 'Adjacent Corner Swap', "R U' R' U' R U R D R' U' R D' R' U2 R'"],
    ['Rb', 'Adjacent Corner Swap', "R2 F R U R U' R' F' R U2 R' U2 R"],
    ['T', 'Adjacent Corner Swap', "R U R' U' R' F R2 U' R' U' R U R' F'"],
    ['E', 'Diagonal Corner Swap', "x' L' U L D' L' U' L D L' U' L D' L' U L D"],
    ['Na', 'Diagonal Corner Swap', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
    ['Nb', 'Diagonal Corner Swap', "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
    ['V', 'Diagonal Corner Swap', "R' U R' U' y R' F' R2 U' R' U R' F R F"],
    ['Y', 'Diagonal Corner Swap', "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
    ['H', 'Edges Only', "M'2 U M'2 U2 M'2 U M'2"],
    ['Ua', 'Edges Only', "M'2 U M U2 M' U M'2"],
    ['Ub', 'Edges Only', "M'2 U' M U2 M' U' M'2"],
    ['Z', 'Edges Only', "M' U M'2 U M'2 U M' U2 M'2"],
  ];

  const GROUPS = ['Edges Only', 'Adjacent Corner Swap', 'Diagonal Corner Swap'];

  const CASES = PLL_DATA.map(([id, group, alg]) => {
    const moves = Cube.parseAlg(alg);
    const start = Cube.setupState(moves);
    const states = [];
    for (let j = 0; j < 4; j++) {
      const st = Cube.cloneCube(start);
      for (let k = 0; k < j; k++) Cube.applyMove(st, { face: 'U', turns: 1 });
      states.push(st);
    }
    return { id, group, alg, moves, states };
  });

  const AUF_FIX = [null, { face: 'U', turns: -1 }, { face: 'U', turns: 2 }, { face: 'U', turns: 1 }];

  function solutionMoves(caseObj, auf) {
    return AUF_FIX[auf] ? Cube.mergeMoves([AUF_FIX[auf]].concat(caseObj.moves)) : caseObj.moves.slice();
  }

  function solutionText(caseObj, auf) {
    return solutionMoves(caseObj, auf).map(Cube.moveName).join(' ');
  }

  function scrambleText(caseObj, auf) {
    return Cube.scrambleMoves(caseObj.states[auf], solutionMoves(caseObj, auf)).map(Cube.moveName).join(' ');
  }

  const DIRS = { U: [0, 1, 0], D: [0, -1, 0], F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0] };

  // Compare number arrays element by element.
  function lessThan(a, b) {
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
  }

  // Where each misplaced last-layer piece goes: [{ from, to }] as [x, z] positions.
  // Ignores a final U turn of the whole layer, like printed PLL diagrams do.
  // Picks the turn with the fewest moving pieces, then the most even corner/edge split (G: 3 + 3),
  // then the fewest moving corners (H moves edges).
  function pieceMoves(state) {
    const pieces = [];
    const seen = new Set();
    for (const s of state) {
      const key = s.p.join(',');
      if (s.p[1] !== 1 || seen.has(key)) continue;
      seen.add(key);
      const home = [0, 0, 0];
      for (const c of Cube.cubieColors(state, s.p)) DIRS[c].forEach((v, i) => (home[i] += v));
      pieces.push({ from: [s.p[0], s.p[2]], home: [home[0], home[2]] });
    }
    let best = null;
    for (let k = 0; k < 4; k++) {
      const moves = [];
      for (const pc of pieces) {
        let to = pc.home;
        for (let i = 0; i < k; i++) to = [to[1], -to[0]];
        if (to[0] !== pc.from[0] || to[1] !== pc.from[1]) moves.push({ from: pc.from, to });
      }
      const edges = moves.filter((m) => m.from[0] === 0 || m.from[1] === 0).length;
      const score = [moves.length, Math.max(edges, moves.length - edges), moves.length - edges];
      if (!best || lessThan(score, best.score)) best = { moves, score };
    }
    return best.moves;
  }

  let markerId = 0;

  // Top view of the last layer with arrows; two-way swaps share one double-headed arrow.
  function diagramSvg(state, size) {
    const id = `pll-head-${markerId++}`;
    const center = (v) => 50 + v * 32;
    const moves = pieceMoves(state);
    const same = (a, b) => a[0] === b[0] && a[1] === b[1];
    const drawn = [];
    const lines = moves.map((m) => {
      if (drawn.some((d) => same(d.from, m.to) && same(d.to, m.from))) return '';
      drawn.push(m);
      const swap = moves.some((o) => same(o.from, m.to) && same(o.to, m.from));
      const [x1, y1, x2, y2] = [center(m.from[0]), center(m.from[1]), center(m.to[0]), center(m.to[1])];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / len;
      const uy = (y2 - y1) / len;
      const pad = 9;
      const kind = m.from[0] !== 0 && m.from[1] !== 0 ? 'corner' : 'edge';
      const head = `url(#${id}-${kind})`;
      return `<line class="${kind}" x1="${x1 + ux * pad}" y1="${y1 + uy * pad}" x2="${x2 - ux * pad}" y2="${y2 - uy * pad}" marker-end="${head}"${swap ? ` marker-start="${head}"` : ''}/>`;
    }).join('');
    const cells = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(`<rect x="${3 + c * 32}" y="${3 + r * 32}" width="30" height="30" rx="4"/>`);
    return `<svg class="pll-diagram" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">
      <defs>${['corner', 'edge'].map((k) => `<marker id="${id}-${k}" class="${k}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z"/></marker>`).join('')}</defs>
      <g class="cells">${cells.join('')}</g><g class="arrows">${lines}</g></svg>`;
  }

  const api = { GROUPS, CASES, solutionMoves, solutionText, scrambleText, pieceMoves, diagramSvg };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.Pll = api;
})(this);
