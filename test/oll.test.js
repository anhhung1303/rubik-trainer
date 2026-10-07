const assert = require('assert');
const Cube = require('../js/cube.js');
const Oll = require('../js/oll.js');

function isF2LSolved(cube) {
  return cube.filter((s) => s.p[1] < 1).every((s) => s.c === Cube.FACES.find(([, n]) => n.every((v, i) => v === s.n[i]))[0]);
}

function topAllYellow(cube) {
  return cube.filter((s) => s.n[1] === 1).every((s) => s.c === 'U');
}

// Basic move sanity: every move repeated 4 times is identity.
for (const face of Object.keys(Cube.MOVES)) {
  const cube = Cube.solvedCube();
  for (let i = 0; i < 4; i++) Cube.applyMove(cube, { face, turns: 1 });
  assert.deepStrictEqual(cube, Cube.solvedCube(), `${face}4 should be identity`);
}

// Sexy move has order 6.
{
  const cube = Cube.solvedCube();
  const sexy = Cube.parseAlg("R U R' U'");
  for (let i = 0; i < 6; i++) Cube.applyAlg(cube, sexy);
  assert.deepStrictEqual(cube, Cube.solvedCube(), "(R U R' U')6 should be identity");
}

// M'2 is written as a counterclockwise half turn but gives the same state as M2.
{
  const moves = Cube.parseAlg("M'2 R2 U' F2'");
  assert.deepStrictEqual(moves.map(Cube.moveName), ["M'2", 'R2', "U'", 'F2']);
  assert.deepStrictEqual(Cube.invertAlg(moves).map(Cube.moveName), ['F2', 'U', 'R2', "M'2"]);
  assert.deepStrictEqual(
    Cube.applyAlg(Cube.solvedCube(), Cube.parseAlg("M'2")),
    Cube.applyAlg(Cube.solvedCube(), Cube.parseAlg('M2')),
  );
}

assert.strictEqual(Oll.CASES.length, 57, 'should have 57 cases');
assert.strictEqual(Oll.PIECES.length, 8, 'should have 8 last-layer pieces');

const seen = new Map();
for (const c of Oll.CASES) {
  for (let auf = 0; auf < 4; auf++) {
    const start = c.states[auf];
    assert.ok(isF2LSolved(start), `OLL ${c.id}: F2L must be solved at start`);
    assert.ok(!topAllYellow(start), `OLL ${c.id}: top must not be oriented at start`);

    const end = Cube.applyAlg(Cube.cloneCube(start), Oll.solutionMoves(c, auf));
    assert.ok(topAllYellow(end), `OLL ${c.id} auf ${auf}: top must be yellow after alg`);
    assert.ok(isF2LSolved(end), `OLL ${c.id} auf ${auf}: F2L must stay solved`);

    const key = c.patterns[auf].map(Number).join('');
    if (seen.has(key)) assert.strictEqual(seen.get(key), c.id, `pattern shared by OLL ${seen.get(key)} and ${c.id}`);
    seen.set(key, c.id);

    const scrambled = Cube.applyAlg(Cube.solvedCube(), Cube.parseAlg(Oll.scrambleText(c, auf)));
    assert.deepStrictEqual(Oll.readPattern(scrambled), c.patterns[auf], `OLL ${c.id} auf ${auf}: scramble must create the case`);
    assert.ok(isF2LSolved(scrambled), `OLL ${c.id} auf ${auf}: scramble must keep F2L solved`);

    const m = Oll.match(c.patterns[auf]);
    assert.ok(m.complete, `OLL ${c.id}: pattern should be complete`);
    assert.strictEqual(m.candidates.length, 1, `OLL ${c.id}: exactly one candidate`);
    assert.strictEqual(m.candidates[0].caseObj.id, c.id);
  }
}

console.log(`OK - ${Oll.CASES.length} cases, ${seen.size} distinct oriented patterns`);
