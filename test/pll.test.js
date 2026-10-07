const assert = require('assert');
const Cube = require('../js/cube.js');
const Pll = require('../js/pll.js');

assert.strictEqual(Pll.CASES.length, 21, 'should have 21 cases');

const faceOf = (n) => Cube.FACES.find(([, fn]) => Cube.sameVec(fn, n))[0];
const lastLayerKey = (cube) =>
  cube.filter((s) => s.p[1] === 1).map((s) => s.p + s.n + s.c).sort().join('|');

const owner = new Map();
for (const c of Pll.CASES) {
  assert.ok(Pll.GROUPS.includes(c.group), `PLL ${c.id}: unknown group`);
  for (let auf = 0; auf < 4; auf++) {
    const start = c.states[auf];
    // Only the last layer is unsolved, and it is already oriented.
    assert.ok(start.filter((s) => s.p[1] < 1 || s.n[1] === 1).every((s) => s.c === faceOf(s.n)), `PLL ${c.id}: only LL sides may differ`);
    assert.ok(!Cube.isSolved(start), `PLL ${c.id}: must not start solved`);

    // Scramble from solved must recreate the case (grayed stickers can be anything).
    const scrambled = Cube.applyAlg(Cube.solvedCube(), Cube.parseAlg(Pll.scrambleText(c, auf)));
    assert.ok(
      start.every((st) => st.c === 'X' || Cube.colorAt(scrambled, st.p, st.n) === st.c),
      `PLL ${c.id} auf ${auf}: scramble must create the case`,
    );

    const end = Cube.applyAlg(Cube.cloneCube(start), Pll.solutionMoves(c, auf));
    assert.ok(Cube.isSolved(end), `PLL ${c.id} auf ${auf}: must be solved after alg`);
    Cube.applyAlg(end, Cube.regripMoves(end));
    assert.strictEqual(Cube.centerColor(end, [0, 1, 0]), 'U', `PLL ${c.id}: regrip must restore yellow on top`);
    assert.strictEqual(Cube.centerColor(end, [0, 0, 1]), 'F', `PLL ${c.id}: regrip must restore green in front`);

    const key = lastLayerKey(start);
    assert.ok(!owner.has(key) || owner.get(key) === c.id, `PLL ${c.id} shares a state with PLL ${owner.get(key)}`);
    owner.set(key, c.id);
  }
}

// Moved corners and edges in the arrow diagram, as on printed PLL sheets.
const EXPECTED_MOVES = {
  Aa: [3, 0], Ab: [3, 0], E: [4, 0], H: [0, 4], Ua: [0, 3], Ub: [0, 3], Z: [0, 4],
  Ga: [3, 3], Gb: [3, 3], Gc: [3, 3], Gd: [3, 3],
  F: [2, 2], Ja: [2, 2], Jb: [2, 2], Ra: [2, 2], Rb: [2, 2], T: [2, 2], Na: [2, 2], Nb: [2, 2], V: [2, 2], Y: [2, 2],
};
for (const c of Pll.CASES) {
  for (let auf = 0; auf < 4; auf++) {
    const moves = Pll.pieceMoves(c.states[auf]);
    const corners = moves.filter((m) => m.from[0] !== 0 && m.from[1] !== 0).length;
    assert.deepStrictEqual([corners, moves.length - corners], EXPECTED_MOVES[c.id], `PLL ${c.id} auf ${auf}: arrow diagram`);
  }
}

console.log(`OK - ${Pll.CASES.length} PLL cases, ${owner.size} distinct states`);
