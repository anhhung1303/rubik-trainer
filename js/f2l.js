// F2L cases for the front-right slot.
(function (global) {
  'use strict';

  const Cube = typeof require === 'function' ? require('./cube.js') : global.Cube;

  // Numbering, groups and front-right slot algorithms.
  const F2L_DATA = [
    [1, 'Free Pairs', "U R U' R'"],
    [2, 'Free Pairs', "U' F' U F"],
    [3, 'Free Pairs', "F' U' F"],
    [4, 'Free Pairs', "R U R'"],
    [5, 'Disconnected Pairs', "U' R U R' U2 R U' R'"],
    [6, 'Disconnected Pairs', "U' r U' R' U R U r'"],
    [7, 'Disconnected Pairs', "U' R U2 R' U' R U2 R'"],
    [8, 'Disconnected Pairs', "r' U2 R2 U R2 U r"],
    [9, 'Disconnected Pairs', "U' R U' R' U F' U' F"],
    [10, 'Disconnected Pairs', "U' R U R' U R U R'"],
    [11, 'Connected Pairs', "U' R U2 R' U F' U' F"],
    [12, 'Connected Pairs', "R U' R' U R U' R' U2 R U' R'"],
    [13, 'Connected Pairs', "U F' U F U' F' U' F"],
    [14, 'Connected Pairs', "U' R U' R' U R U R'"],
    [15, 'Connected Pairs', "R U R' U2 R U' R' U R U' R'"],
    [16, 'Connected Pairs', "R U' R' U2 F' U' F"],
    [17, 'Connected Pairs', "R U2 R' U' R U R'"],
    [18, 'Connected Pairs', "F' U2 F U F' U' F"],
    [19, 'Disconnected Pairs', "U R U2 R' U R U' R'"],
    [20, 'Disconnected Pairs', "U' F' U2 F U' F' U F"],
    [21, 'Disconnected Pairs', "U2 R U R' U R U' R'"],
    [22, 'Disconnected Pairs', "r U' r' U2 r U r'"],
    [23, 'Connected Pairs', "U R U' R' U' R U' R' U R U' R'"],
    [24, 'Connected Pairs', "F U R U' R' F' R U' R'"],
    [25, 'Corner In Slot', "U' R' F R F' R U R'"],
    [26, 'Corner In Slot', "U R U' R' F R' F' R"],
    [27, 'Corner In Slot', "R U' R' U R U' R'"],
    [28, 'Corner In Slot', "R U R' U' F R' F' R"],
    [29, 'Corner In Slot', "R' F R F' U R U' R'"],
    [30, 'Corner In Slot', "R U R' U' R U R'"],
    [31, 'Edge In Slot', "U' R' F R F' R U' R'"],
    [32, 'Edge In Slot', "U R U' R' U R U' R' U R U' R'"],
    [33, 'Edge In Slot', "U' R U' R' U2 R U' R'"],
    [34, 'Edge In Slot', "U R U R' U2 R U R'"],
    [35, 'Edge In Slot', "U' R U R' U F' U' F"],
    [36, 'Edge In Slot', "U F' U' F U' R U R'"],
    [37, 'Pieces In Slot', "R2 U2 F R2 F' U2 R' U R'"],
    [38, 'Pieces In Slot', "R U' R' U' R U R' U2 R U' R'"],
    [39, 'Pieces In Slot', "R U' R' U R U2 R' U R U' R'"],
    [40, 'Pieces In Slot', "r U' r' U2 r U r' R U R'"],
    [41, 'Pieces In Slot', "R U' R' r U' r' U2 r U r'"],
  ];

  const GROUPS = ['Free Pairs', 'Connected Pairs', 'Disconnected Pairs', 'Corner In Slot', 'Edge In Slot', 'Pieces In Slot'];

  // Gray out last-layer pieces (any piece with yellow) except the yellow center.
  function grayLastLayer(cube) {
    const gray = cube.map((s) => !Cube.sameVec(s.p, [0, 1, 0]) && Cube.cubieColors(cube, s.p).includes('U'));
    cube.forEach((s, i) => {
      if (gray[i]) s.c = 'X';
    });
    return cube;
  }

  const CASES = F2L_DATA.map(([id, group, alg]) => {
    const moves = Cube.parseAlg(alg);
    const start = grayLastLayer(Cube.setupState(moves));
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

  const api = {
    GROUPS,
    CASES,
    solutionMoves,
    solutionText,
    scrambleText,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else global.F2l = api;
})(this);
