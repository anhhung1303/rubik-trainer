// three.js renderer that animates moves defined in cube.js.
(function (global) {
  'use strict';

  const AXES = ['x', 'y', 'z'];

  function roundedSquare(size, radius) {
    const h = size / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-h + radius, -h);
    shape.lineTo(h - radius, -h);
    shape.quadraticCurveTo(h, -h, h, -h + radius);
    shape.lineTo(h, h - radius);
    shape.quadraticCurveTo(h, h, h - radius, h);
    shape.lineTo(-h + radius, h);
    shape.quadraticCurveTo(-h, h, -h, h - radius);
    shape.lineTo(-h, -h + radius);
    shape.quadraticCurveTo(-h, -h, -h + radius, -h);
    return new THREE.ShapeGeometry(shape);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  const CAMERA_POS = [4.6, 5.4, 7.4];

  // Geometries and materials shared by every renderer.
  let assets = null;
  function getAssets() {
    if (!assets) {
      assets = {
        bodyGeo: new THREE.BoxGeometry(0.98, 0.98, 0.98),
        bodyMat: new THREE.MeshBasicMaterial({ color: 0x16181c }),
        stickerGeo: roundedSquare(0.84, 0.1),
        stickerMats: {},
      };
    }
    return assets;
  }

  function stickerMat(color) {
    const mats = getAssets().stickerMats;
    if (!mats[color]) mats[color] = new THREE.MeshBasicMaterial({ color: Cube.COLORS[color], side: THREE.DoubleSide });
    return mats[color];
  }

  // Add one group per cubie to parent, built from a cube.js sticker list.
  function buildCubies(cube, parent) {
    const { bodyGeo, bodyMat, stickerGeo } = getAssets();
    const byKey = new Map();
    for (const s of cube) {
      const key = s.p.join(',');
      if (!byKey.has(key)) {
        const cubie = new THREE.Group();
        cubie.position.set(s.p[0], s.p[1], s.p[2]);
        cubie.add(new THREE.Mesh(bodyGeo, bodyMat));
        byKey.set(key, cubie);
        parent.add(cubie);
      }
      const mesh = new THREE.Mesh(stickerGeo, stickerMat(s.c));
      const [nx, ny, nz] = s.n;
      mesh.position.set(nx * 0.495, ny * 0.495, nz * 0.495);
      if (nx) mesh.rotation.y = (nx * Math.PI) / 2;
      else if (ny) mesh.rotation.x = (-ny * Math.PI) / 2;
      else if (nz < 0) mesh.rotation.y = Math.PI;
      byKey.get(key).add(mesh);
    }
    return [...byKey.values()];
  }

  // One offscreen renderer turns cube states into images, avoiding a WebGL context per thumbnail.
  let snap = null;
  function snapshot(cube, size) {
    if (!snap) {
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      camera.position.set(...CAMERA_POS).multiplyScalar(0.9);
      camera.lookAt(0, 0, 0);
      snap = { renderer: new THREE.WebGLRenderer({ antialias: true, alpha: true }), scene: new THREE.Scene(), camera };
    }
    snap.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    snap.renderer.setSize(size, size, false);
    snap.scene.clear();
    buildCubies(cube, snap.scene);
    snap.renderer.render(snap.scene, snap.camera);
    return snap.renderer.domElement.toDataURL('image/png');
  }

  class CubeViewer {
    constructor(container) {
      this.container = container;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
      this.camera.position.set(...CAMERA_POS);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enablePan = false;
      this.controls.enableDamping = true;
      this.controls.minDistance = 7;
      this.controls.maxDistance = 16;

      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.cubies = [];
      this.anim = null;

      new ResizeObserver(() => this.resize()).observe(container);
      this.resize();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    resetView() {
      this.camera.position.set(...CAMERA_POS);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }

    // Rebuild all cubies from a cube.js sticker list. Cancels any running animation.
    setState(cube) {
      if (this.anim) {
        const done = this.anim.resolve;
        this.anim = null;
        done();
      }
      this.root.clear();
      this.cubies = buildCubies(cube, this.root);
    }

    animate(move, duration) {
      const def = Cube.MOVES[move.face];
      const axis = AXES[def.axis];
      const pivot = new THREE.Object3D();
      this.root.add(pivot);
      const moving = this.cubies.filter((c) => def.layers.includes(Math.round(c.position[axis])));
      moving.forEach((c) => pivot.attach(c));
      const target = (def.dir * move.turns * Math.PI) / 2;
      const time = Math.abs(move.turns) === 2 ? duration * 1.5 : duration;
      return new Promise((resolve) => {
        this.anim = { pivot, moving, axis, target, time, start: performance.now(), resolve };
      });
    }

    finishAnim() {
      const { pivot, moving, axis, target, resolve } = this.anim;
      pivot.rotation[axis] = target;
      pivot.updateMatrixWorld(true);
      const m = new THREE.Matrix4();
      for (const c of moving) {
        this.root.attach(c);
        c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
        m.makeRotationFromQuaternion(c.quaternion);
        for (const i of [0, 1, 2, 4, 5, 6, 8, 9, 10]) m.elements[i] = Math.round(m.elements[i]);
        c.quaternion.setFromRotationMatrix(m);
      }
      this.root.remove(pivot);
      this.anim = null;
      resolve();
    }

    loop(now) {
      if (this.anim) {
        const t = Math.min(1, (now - this.anim.start) / this.anim.time);
        this.anim.pivot.rotation[this.anim.axis] = this.anim.target * easeInOut(t);
        if (t >= 1) this.finishAnim();
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      requestAnimationFrame(this.loop);
    }
  }

  CubeViewer.snapshot = snapshot;
  global.CubeViewer = CubeViewer;
})(this);
