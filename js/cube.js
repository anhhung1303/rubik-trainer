// Sticker-based 3x3 cube model. Axes: x = right, y = up, z = front.
(function (global) {
  'use strict';

  const COLORS = {
    U: '#ffd500', // yellow
    D: '#ffffff', // white
    F: '#009b48', // green
    B: '#0046ad', // blue
    R: '#ff5800', // orange
    L: '#c41e3a', // red
    X: '#5b6068', // unknown (last layer, not yellow)
  };

  // dir: quarter turns about +axis (counterclockwise looking from +axis toward origin)
  const MOVES = {
    R: { axis: 0, dir: -1, layers: [1] },
    L: { axis: 0, dir: 1, layers: [-1] },
    M: { axis: 0, dir: 1, layers: [0] },
    r: { axis: 0, dir: -1, layers: [0, 1] },
    l: { axis: 0, dir: 1, layers: [-1, 0] },
    x: { axis: 0, dir: -1, layers: [-1, 0, 1] },
    U: { axis: 1, dir: -1, layers: [1] },
    D: { axis: 1, dir: 1, layers: [-1] },
    E: { axis: 1, dir: 1, layers: [0] },
    u: { axis: 1, dir: -1, layers: [0, 1] },
    d: { axis: 1, dir: 1, layers: [-1, 0] },
    y: { axis: 1, dir: -1, layers: [-1, 0, 1] },
    F: { axis: 2, dir: -1, layers: [1] },
    B: { axis: 2, dir: 1, layers: [-1] },
    S: { axis: 2, dir: -1, layers: [0] },
    f: { axis: 2, dir: -1, layers: [0, 1] },
    b: { axis: 2, dir: 1, layers: [-1, 0] },
    z: { axis: 2, dir: -1, layers: [-1, 0, 1] },
  };

  const FACES = [
    ['U', [0, 1, 0]],
    ['D', [0, -1, 0]],
    ['F', [0, 0, 1]],
    ['B', [0, 0, -1]],
    ['R', [1, 0, 0]],
    ['L', [-1, 0, 0]],
  ];

  function solvedCube() {
    const stickers = [];
    for (const [color, n] of FACES) {
      const axis = n.findIndex((v) => v !== 0);
      const b = (axis + 1) % 3;
      const c = (axis + 2) % 3;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const p = [0, 0, 0];
          p[axis] = n[axis];
          p[b] = i;
          p[c] = j;
          stickers.push({ p, n: n.slice(), c: color });
        }
      }
    }
    return stickers;
  }

  function cloneCube(cube) {
    return cube.map((s) => ({ p: s.p.slice(), n: s.n.slice(), c: s.c }));
  }

  // Rotate a vector in place by q quarter turns about the given axis.
  function rotate(v, axis, q) {
    const b = (axis + 1) % 3;
    const c = (axis + 2) % 3;
    for (let k = 0; k < ((q % 4) + 4) % 4; k++) {
      const vb = v[b];
      v[b] = -v[c] || 0;
      v[c] = vb;
    }
  }

  function parseAlg(text) {
    return text
      .replace(/[()]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => {
        const m = /^([RLUDFBMESxyzrludfb])(w?)('2|2'|2|')?$/.exec(tok);
        if (!m) throw new Error('Unknown move: ' + tok);
        const face = m[2] ? m[1].toLowerCase() : m[1];
        // X'2 is a half turn done counterclockwise, e.g. M'2 for an easier fingertrick.
        const turns = { "'2": -2, "2'": 2, 2: 2, "'": -1 }[m[3]] || 1;
        return { face, turns };
      });
  }

  function moveName(move) {
    return move.face + ({ 2: '2', '-2': "'2", '-1': "'" }[move.turns] || '');
  }

  // Half turns undo themselves, so they keep their written direction.
  function invertMove(move) {
    return { face: move.face, turns: Math.abs(move.turns) === 2 ? move.turns : -move.turns };
  }

  function invertAlg(moves) {
    return moves.slice().reverse().map(invertMove);
  }

  function applyMove(cube, move) {
    const def = MOVES[move.face];
    const q = def.dir * move.turns;
    for (const s of cube) {
      if (def.layers.includes(s.p[def.axis])) {
        rotate(s.p, def.axis, q);
        rotate(s.n, def.axis, q);
      }
    }
    return cube;
  }

  function applyAlg(cube, moves) {
    for (const m of moves) applyMove(cube, m);
    return cube;
  }

  function sameVec(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  function colorAt(cube, p, n) {
    const s = cube.find((st) => sameVec(st.p, p) && sameVec(st.n, n));
    return s ? s.c : null;
  }

  function centerColor(cube, n) {
    return colorAt(cube, n, n);
  }

  // All 24 whole-cube orientations as move lists.
  const ORIENTATIONS = (() => {
    const list = [];
    for (let a = 0; a < 4; a++) {
      for (let b = 0; b < 4; b++) {
        for (let c = 0; c < 4; c++) {
          const moves = [];
          for (let i = 0; i < a; i++) moves.push({ face: 'x', turns: 1 });
          for (let i = 0; i < b; i++) moves.push({ face: 'y', turns: 1 });
          for (let i = 0; i < c; i++) moves.push({ face: 'z', turns: 1 });
          list.push(moves);
        }
      }
    }
    return list;
  })();

  // Cube state the algorithm solves, with U and F centers kept in place.
  function setupState(moves) {
    const inverse = invertAlg(moves);
    for (const pre of ORIENTATIONS) {
      const cube = applyAlg(applyAlg(solvedCube(), pre), inverse);
      if (centerColor(cube, [0, 1, 0]) === 'U' && centerColor(cube, [0, 0, 1]) === 'F') return cube;
    }
    throw new Error('No orientation found');
  }

  // Combine adjacent turns of the same face, e.g. U U' -> nothing, U U -> U2.
  function mergeMoves(moves) {
    const out = [];
    for (const m of moves) {
      const last = out[out.length - 1];
      if (last && last.face === m.face) {
        const t = (((last.turns + m.turns) % 4) + 4) % 4;
        out.pop();
        if (t) out.push({ face: m.face, turns: t === 3 ? -1 : t });
      } else {
        out.push({ face: m.face, turns: m.turns });
      }
    }
    return out;
  }

  // Shortest whole-cube rotation that brings the U and F centers back to place.
  function regripMoves(cube) {
    let best = null;
    for (const pre of ORIENTATIONS) {
      const turned = applyAlg(cloneCube(cube), pre);
      if (centerColor(turned, [0, 1, 0]) !== 'U' || centerColor(turned, [0, 0, 1]) !== 'F') continue;
      const moves = mergeMoves(pre);
      if (!best || moves.length < best.length) best = moves;
    }
    return best;
  }

  // Moves that create start from a solved cube (yellow up, green front): the solution reversed,
  // including the regrip for algorithms that end with the cube rotated.
  function scrambleMoves(start, solution) {
    const regrip = regripMoves(applyAlg(cloneCube(start), solution));
    return mergeMoves(invertAlg(solution.concat(regrip)));
  }

  function isSolved(cube) {
    return FACES.every(([, n]) => new Set(cube.filter((s) => sameVec(s.n, n)).map((s) => s.c)).size === 1);
  }

  // Sorted color set of the cubie at position p, e.g. "DFR".
  function cubieColors(cube, p) {
    return cube.filter((s) => sameVec(s.p, p)).map((s) => s.c).sort().join('');
  }

  const api = {
    COLORS,
    MOVES,
    FACES,
    ORIENTATIONS,
    solvedCube,
    cloneCube,
    parseAlg,
    moveName,
    invertMove,
    invertAlg,
    applyMove,
    applyAlg,
    colorAt,
    centerColor,
    sameVec,
    setupState,
    mergeMoves,
    regripMoves,
    scrambleMoves,
    isSolved,
    cubieColors,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.Cube = api;
})(this);
