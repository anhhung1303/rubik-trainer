// 3D viewer with step-through controls for one algorithm.
(function (global) {
  'use strict';

  const RESET_DELAY = 1000;

  function createPlayer(root) {
    root.innerHTML = `
      <div class="viewer-wrap">
        <div class="viewer"></div>
        <button class="btn ghost small view-btn" type="button" data-act="view" title="Reset camera">Reset view</button>
      </div>
      <div class="moves" aria-label="Algorithm steps"></div>
      <div class="controls">
        <button class="btn icon" type="button" data-act="restart" title="Restart">&#9198;</button>
        <button class="btn icon" type="button" data-act="back" title="Step back (Left arrow)">&#9664;</button>
        <button class="btn icon primary" type="button" data-act="play" title="Play / pause (Space)">&#9654;</button>
        <button class="btn icon" type="button" data-act="forward" title="Step forward (Right arrow)">&#9654;&#10073;</button>
        <button class="btn icon" type="button" data-act="end" title="Jump to end">&#9197;</button>
        <label class="speed">Speed <input type="range" min="1" max="10" value="5"></label>
      </div>`;

    const viewer = new CubeViewer(root.querySelector('.viewer'));
    const movesEl = root.querySelector('.moves');
    const playBtn = root.querySelector('[data-act="play"]');
    const speed = root.querySelector('input[type="range"]');
    const s = { moves: [], start: Cube.solvedCube(), index: 0, playing: false, busy: false, gen: 0, pending: null, hidden: false, aufFirst: false, extraLast: 0 };

    function quarterTime() {
      return 900 - Number(speed.value) * 80;
    }

    function render() {
      movesEl.innerHTML = s.moves.map((m, i) => {
        const regrip = i >= s.moves.length - s.extraLast;
        const cls = ['move', i < s.index ? 'done' : '', i === s.index ? 'next' : '', (i === 0 && s.aufFirst) || regrip ? 'auf' : '']
          .filter(Boolean)
          .join(' ');
        const title = regrip ? ' title="Turn the whole cube back upright"' : '';
        return `<span class="${cls}"${title}>${s.hidden ? '?' : Cube.moveName(m)}</span>`;
      }).join('');
      playBtn.innerHTML = s.playing ? '&#10074;&#10074;' : '&#9654;';
    }

    function jumpTo(index) {
      s.gen++;
      s.playing = false;
      s.busy = false;
      s.index = index;
      viewer.setState(Cube.applyAlg(Cube.cloneCube(s.start), s.moves.slice(0, index)));
      render();
    }

    function step(dir) {
      // While a move is animating, callers wait for it instead of starting another.
      if (s.busy) return s.pending;
      const forward = dir > 0;
      if (forward ? s.index >= s.moves.length : s.index <= 0) return Promise.resolve();
      const move = forward ? s.moves[s.index] : Cube.invertMove(s.moves[s.index - 1]);
      const gen = s.gen;
      s.busy = true;
      s.pending = viewer.animate(move, quarterTime()).then(() => {
        if (gen !== s.gen) return;
        s.busy = false;
        s.index += dir;
        render();
      });
      return s.pending;
    }

    async function play() {
      if (s.playing) {
        s.playing = false;
        render();
        return;
      }
      if (!s.moves.length) return;
      if (s.index >= s.moves.length) jumpTo(0);
      const gen = s.gen;
      s.playing = true;
      render();
      while (s.playing && gen === s.gen && s.index < s.moves.length) await step(1);
      if (gen !== s.gen) return;
      const finished = s.playing && s.index >= s.moves.length;
      s.playing = false;
      render();
      if (!finished) return;
      // Show the solved result briefly, then return to the case.
      await new Promise((resolve) => setTimeout(resolve, RESET_DELAY));
      if (gen === s.gen && s.index >= s.moves.length) jumpTo(0);
    }

    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      ({
        view: () => viewer.resetView(),
        restart: () => jumpTo(0),
        back: () => step(-1),
        play,
        forward: () => step(1),
        end: () => jumpTo(s.moves.length),
      })[act.dataset.act]();
    });

    document.addEventListener('keydown', (e) => {
      // Only the player in the visible section reacts.
      if (root.offsetParent === null || e.target.closest('input, textarea, button')) return;
      if (e.key === ' ') {
        e.preventDefault();
        play();
      } else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    return {
      load(start, moves, opts = {}) {
        s.start = start;
        s.moves = moves;
        s.aufFirst = Boolean(opts.aufFirst);
        s.hidden = Boolean(opts.hidden);
        s.extraLast = opts.extraLast || 0;
        jumpTo(0);
      },
      setHidden(hidden) {
        s.hidden = hidden;
        render();
      },
    };
  }

  global.createPlayer = createPlayer;
})(this);
