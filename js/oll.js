// OLL cases, recognition patterns and lookup.
(function (global) {
  'use strict';

  const Cube = typeof require === 'function' ? require('./cube.js') : global.Cube;

  const OLL_DATA = [
    [29, 'Awkward Shape', "R U R' U' R U' R' F' U' F R U R'"],
    [30, 'Awkward Shape', "F R' F R2 U' R' U' R U R' F2"],
    [41, 'Awkward Shape', "R U R' U R U2 R' F R U R' U' F'"],
    [42, 'Awkward Shape', "R' U' R U' R' U2 R F R U R' U' F'"],
    [39, 'Big Lightning Bolt', "L F' L' U' L U F U' L'"],
    [40, 'Big Lightning Bolt', "R' F R U R' U' F' U R"],
    [34, 'C Shape', "R U R2 U' R' F R U R U' F'"],
    [46, 'C Shape', "R' U' R' F R F' U R"],
    [28, 'Corners Oriented', "r U R' U' r' R U R U' R'"],
    [57, 'Corners Oriented', "R U R' U' M' U R U' r'"],
    [21, 'Cross', "R U2 R' U' R U R' U' R U' R'"],
    [22, 'Cross', "R U2 R2 U' R2 U' R2 U2 R"],
    [23, 'Cross', "R2 D' R U2 R' D R U2 R"],
    [24, 'Cross', "r U R' U' r' F R F'"],
    [25, 'Cross', "F' r U R' U' r' F R"],
    [26, 'Cross', "R U2 R' U' R U' R'"],
    [27, 'Cross', "R U R' U R U2 R'"],
    [1, 'Dot', "R U2 R2 F R F' U2 R' F R F'"],
    [2, 'Dot', "r U r' U2 r U2 R' U2 R U' r'"],
    [3, 'Dot', "r' R2 U R' U r U2 r' U M'"],
    [4, 'Dot', "M U' r U2 r' U' R U' R' M'"],
    [17, 'Dot', "F R' F' R2 r' U R U' R' U' M'"],
    [18, 'Dot', "r U R' U R U2 r2 U' R U' R' U2 r"],
    [19, 'Dot', "r' R U R U R' U' M' R' F R F'"],
    [20, 'Dot', "r U R' U' M'2 U R U' R' U' M'"],
    [9, 'Fish Shape', "R U R' U' R' F R2 U R' U' F'"],
    [10, 'Fish Shape', "R U R' U R' F R F' R U2 R'"],
    [35, 'Fish Shape', "R U2 R2 F R F' R U2 R'"],
    [37, 'Fish Shape', "F R' F' R U R U' R'"],
    [51, 'I Shape', "F U R U' R' U R U' R' F'"],
    [52, 'I Shape', "R U R' U R U' B U' B' R'"],
    [55, 'I Shape', "R' F R U R U' R2 F' R2 U' R' U R U R'"],
    [56, 'I Shape', "r' U' r U' R' U R U' R' U R r' U r"],
    [13, 'Knight Move Shape', "F U R U' R2 F' R U R U' R'"],
    [14, 'Knight Move Shape', "R' F R U R' F' R F U' F'"],
    [15, 'Knight Move Shape', "l' U' l L' U' L U l' U l"],
    [16, 'Knight Move Shape', "r U r' R U R' U' r U' r'"],
    [31, 'P Shape', "R' U' F U R U' R' F' R"],
    [32, 'P Shape', "L U F' U' L' U L F L'"],
    [43, 'P Shape', "F' U' L' U L F"],
    [44, 'P Shape', "F U R U' R' F'"],
    [47, 'Small L Shape', "R' U' R' F R F' R' F R F' U R"],
    [48, 'Small L Shape', "F R U R' U' R U R' U' F'"],
    [49, 'Small L Shape', "r U' r2 U r2 U r2 U' r"],
    [50, 'Small L Shape', "r' U r2 U' r2 U' r2 U r'"],
    [53, 'Small L Shape', "l' U2 L U L' U' L U L' U l"],
    [54, 'Small L Shape', "r U2 R' U' R U R' U' R U' r'"],
    [7, 'Small Lightning Bolt', "r U R' U R U2 r'"],
    [8, 'Small Lightning Bolt', "l' U' L U' L' U2 l"],
    [11, 'Small Lightning Bolt', "r U R' U R' F R F' R U2 r'"],
    [12, 'Small Lightning Bolt', "M' R' U' R U' R' U2 R U' R r'"],
    [5, 'Square Shape', "l' U2 L U L' U l"],
    [6, 'Square Shape', "r U2 R' U' R U' r'"],
    [33, 'T Shape', "R U R' U' R' F R F'"],
    [45, 'T Shape', "F R U R' U' F'"],
    [36, 'W Shape', "L' U' L U' L' U L U L F' L' F"],
    [38, 'W Shape', "R U R' U R U' R' U' R' F R F'"],
  ];

  // Picker layout: 5x5 grid seen from above, back side on top, front side at the bottom.
  const SLOTS = (() => {
    const slots = [];
    for (let gr = 0; gr < 5; gr++) {
      for (let gc = 0; gc < 5; gc++) {
        if ((gr === 0 || gr === 4) && (gc === 0 || gc === 4)) continue;
        let p;
        let n;
        if (gr === 0) [p, n] = [[gc - 2, 1, -1], [0, 0, -1]];
        else if (gr === 4) [p, n] = [[gc - 2, 1, 1], [0, 0, 1]];
        else if (gc === 0) [p, n] = [[-1, 1, gr - 2], [-1, 0, 0]];
        else if (gc === 4) [p, n] = [[1, 1, gr - 2], [1, 0, 0]];
        else [p, n] = [[gc - 2, 1, gr - 2], [0, 1, 0]];
        slots.push({ gr, gc, p, n, piece: p.join(','), top: n[1] === 1 });
      }
    }
    return slots;
  })();

  const CENTER = SLOTS.findIndex((s) => s.piece === '0,1,0');

  // The 8 last-layer pieces, each with its sticker slot indexes.
  const PIECES = (() => {
    const byKey = new Map();
    SLOTS.forEach((s, i) => {
      if (i === CENTER) return;
      if (!byKey.has(s.piece)) byKey.set(s.piece, []);
      byKey.get(s.piece).push(i);
    });
    return [...byKey.entries()].map(([key, slots]) => ({ key, slots }));
  })();

  // Preferred AUF order: none, U', U, U2 (index = number of U turns applied to the case).
  const AUF_ORDER = [0, 1, 3, 2];
  const AUF_FIX = [null, { face: 'U', turns: -1 }, { face: 'U', turns: 2 }, { face: 'U', turns: 1 }];

  function readPattern(cube) {
    return SLOTS.map((s) => Cube.colorAt(cube, s.p, s.n) === 'U');
  }

  function buildCases() {
    return OLL_DATA.map(([id, group, alg]) => {
      const moves = Cube.parseAlg(alg);
      const start = Cube.setupState(moves);
      // Last layer colors other than yellow are unknown at OLL time.
      for (const s of start) if (s.p[1] === 1 && s.c !== 'U') s.c = 'X';
      const states = [];
      const patterns = [];
      for (let j = 0; j < 4; j++) {
        const st = Cube.cloneCube(start);
        for (let k = 0; k < j; k++) Cube.applyMove(st, { face: 'U', turns: 1 });
        states.push(st);
        patterns.push(readPattern(st));
      }
      return { id, group, alg, moves, states, patterns };
    }).sort((a, b) => a.id - b.id);
  }

  const CASES = buildCases();

  function solutionMoves(caseObj, auf) {
    return AUF_FIX[auf] ? [AUF_FIX[auf]].concat(caseObj.moves) : caseObj.moves.slice();
  }

  function solutionText(caseObj, auf) {
    return solutionMoves(caseObj, auf).map(Cube.moveName).join(' ');
  }

  function scrambleText(caseObj, auf) {
    return Cube.scrambleMoves(caseObj.states[auf], solutionMoves(caseObj, auf)).map(Cube.moveName).join(' ');
  }

  // Match user input. Pieces with exactly one yellow sticker are "known" and constrain the search.
  function match(bits) {
    const pieceInfo = PIECES.map((pc) => {
      const count = pc.slots.filter((i) => bits[i]).length;
      return { ...pc, count, status: count === 1 ? 'ok' : count === 0 ? 'empty' : 'bad' };
    });
    const known = pieceInfo.filter((pc) => pc.status === 'ok');
    const checkSlots = [CENTER].concat(...known.map((pc) => pc.slots));
    const candidates = [];
    for (const c of CASES) {
      const auf = AUF_ORDER.find((j) => checkSlots.every((i) => c.patterns[j][i] === bits[i]));
      if (auf !== undefined) candidates.push({ caseObj: c, auf });
    }
    return {
      pieces: pieceInfo,
      complete: known.length === PIECES.length,
      hasBad: pieceInfo.some((pc) => pc.status === 'bad'),
      candidates,
    };
  }

  const api = {
    SLOTS,
    CENTER,
    PIECES,
    CASES,
    readPattern,
    solutionMoves,
    solutionText,
    scrambleText,
    match,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.Oll = api;
})(this);
