const assert = require('assert');
const Cube = require('../js/cube.js');
const F2l = require('../js/f2l.js');

const faceOf = (n) => Cube.FACES.find(([, fn]) => Cube.sameVec(fn, n))[0];

// Everything below the U layer is solved.
function isF2LSolved(cube) {
  return cube.filter((s) => s.p[1] < 1).every((s) => s.c === faceOf(s.n));
}

// Everything below the U layer is solved except the front-right slot.
function isRestSolved(cube) {
  return cube
    .filter((s) => s.p[1] < 1 && !(s.p[0] === 1 && s.p[2] === 1))
    .every((s) => s.c === faceOf(s.n));
}

assert.strictEqual(F2l.CASES.length, 41, 'should have 41 cases');

for (const c of F2l.CASES) {
  assert.ok(F2l.GROUPS.includes(c.group), `F2L ${c.id}: unknown group`);
  for (let auf = 0; auf < 4; auf++) {
    const start = c.states[auf];
    assert.ok(isRestSolved(start), `F2L ${c.id}: cross and other slots must be solved at start`);
    assert.ok(!isF2LSolved(start), `F2L ${c.id}: slot must not be solved at start`);
    // Scramble from solved must recreate the case (grayed stickers can be anything).
    const scrambled = Cube.applyAlg(Cube.solvedCube(), Cube.parseAlg(F2l.scrambleText(c, auf)));
    assert.ok(
      start.every((st) => st.c === 'X' || Cube.colorAt(scrambled, st.p, st.n) === st.c),
      `F2L ${c.id} auf ${auf}: scramble must create the case`,
    );

    const end = Cube.applyAlg(Cube.cloneCube(start), F2l.solutionMoves(c, auf));
    assert.ok(isF2LSolved(end), `F2L ${c.id} auf ${auf}: F2L must be solved after alg`);
  }
}

// Where the pair's white and front-color stickers sit, e.g. "1,1,1/0,1,0 1,0,1/0,0,1".
function pairKey(cube) {
  const white = cube.find((s) => s.c === 'D' && Cube.cubieColors(cube, s.p) === 'DFR');
  const front = cube.find((s) => s.c === 'F' && Cube.cubieColors(cube, s.p) === 'FR');
  return [white, front].map((s) => s.p + '/' + s.n).join(' ');
}

// Every case owns distinct pair states, and together they cover all 15 x 10 - 1 unsolved ones.
const owner = new Map();
for (const c of F2l.CASES) {
  for (const key of new Set(c.states.map(pairKey))) {
    assert.ok(!owner.has(key), `F2L ${c.id} shares a state with F2L ${owner.get(key)}`);
    owner.set(key, c.id);
  }
}
assert.strictEqual(owner.size, 149, 'every unsolved pair state must map to a case');
assert.ok(!owner.has(pairKey(Cube.solvedCube())), 'solved state must not be a case');

assert.deepStrictEqual(
  Cube.mergeMoves(Cube.parseAlg("U U' R U U")).map(Cube.moveName),
  ['R', 'U2'],
);

console.log(`OK - ${F2l.CASES.length} F2L cases cover ${owner.size} pair states`);
