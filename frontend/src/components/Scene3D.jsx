import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { rp } from '../utils.js';

// Papan label dari canvas (teks bisa beberapa baris dipisah \n)
function labelMesh(lines, { bg = '#ffffff', fg = '#1e293b', w = 2.2, h = 0.9 } = {}) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = Math.round(512 * (h / w));
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.beginPath();
  const r = 36;
  g.moveTo(r, 0); g.lineTo(c.width - r, 0); g.quadraticCurveTo(c.width, 0, c.width, r);
  g.lineTo(c.width, c.height - r); g.quadraticCurveTo(c.width, c.height, c.width - r, c.height);
  g.lineTo(r, c.height); g.quadraticCurveTo(0, c.height, 0, c.height - r);
  g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0); g.fill();
  g.fillStyle = fg;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const arr = lines.split('\n');
  const size = arr.length > 1 ? 70 : 90;
  g.font = `bold ${size}px sans-serif`;
  arr.forEach((t, i) => g.fillText(t, c.width / 2, (c.height / (arr.length + 1)) * (i + 1)));
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
  );
  return m;
}

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z);
  return m;
}

function disposeScene(scene) {
  scene.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      object.material.map?.dispose();
      object.material.dispose();
    }
  });
}

function buildKios(scene, { beli, jual }) {
  scene.add(box(3, 1, 1.4, 0xb7792f, 0, 0.5, 0)); // meja
  scene.add(box(3.2, 0.1, 1.6, 0xd9a05b, 0, 1.05, 0)); // alas meja
  scene.add(box(0.1, 2.2, 0.1, 0x8b5a1e, -1.5, 1.1, -0.65));
  scene.add(box(0.1, 2.2, 0.1, 0x8b5a1e, 1.5, 1.1, -0.65));
  for (let i = 0; i < 6; i++) scene.add(box(0.58, 0.08, 1.9, i % 2 ? 0xffffff : 0xdc2626, -1.45 + i * 0.58, 2.3, -0.1)); // atap
  [0xf59e0b, 0xef4444, 0x22c55e].forEach((c, i) => scene.add(box(0.5, 0.35, 0.4, c, -0.8 + i * 0.8, 1.27, 0.1))); // barang
  for (let i = 0; i < 4; i++) {
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24), mat(0xfacc15));
    coin.position.set(1.2, 1.13 + i * 0.055, 0.45);
    scene.add(coin);
  }
  const l1 = labelMesh(`HARGA BELI\n${rp(beli)}`, { bg: '#dbeafe', fg: '#1e3a8a' });
  l1.position.set(-1.0, 1.95, 0.95);
  const l2 = labelMesh(`HARGA JUAL\n${rp(jual)}`, { bg: '#ffedd5', fg: '#9a3412' });
  l2.position.set(1.0, 1.95, 0.95);
  scene.add(l1, l2);
  return { target: new THREE.Vector3(0, 1.3, 0), camera: new THREE.Vector3(0, 2.4, 5.6) };
}

function buildBars(scene, { beli, jual }) {
  const max = Math.max(beli, jual);
  const k = 3 / max;
  const hb = beli * k, hj = jual * k;
  const base = (h, x, color) => scene.add(box(1.1, h, 1.1, color, x, h / 2, 0));
  base(hb, -1.3, 0x2563eb);

  if (jual >= beli) {
    base(hb, 1.3, 0xea580c);
    if (jual > beli) scene.add(box(1.1, hj - hb, 1.1, 0x16a34a, 1.3, hb + (hj - hb) / 2, 0));
  } else {
    base(hj, 1.3, 0xea580c);
    const ghost = box(1.1, hb - hj, 1.1, 0xdc2626, 1.3, hj + (hb - hj) / 2, 0);
    ghost.material.transparent = true;
    ghost.material.opacity = 0.35;
    scene.add(ghost);
  }

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), mat(0xe2e8f0));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const lb = labelMesh(`Beli\n${rp(beli)}`, { bg: '#dbeafe', fg: '#1e3a8a', w: 1.9, h: 0.9 });
  lb.position.set(-1.3, hb + 0.65, 0);
  const lj = labelMesh(`Jual\n${rp(jual)}`, { bg: '#ffedd5', fg: '#9a3412', w: 1.9, h: 0.9 });
  lj.position.set(1.3, Math.max(hj, hb) + 0.65, 0);
  scene.add(lb, lj);

  const selisih = Math.abs(jual - beli);
  const txt = jual > beli ? `Untung\n${rp(selisih)}` : jual < beli ? `Rugi\n${rp(selisih)}` : 'Impas';
  const ls = labelMesh(txt, {
    bg: jual > beli ? '#dcfce7' : jual < beli ? '#fee2e2' : '#f1f5f9',
    fg: jual > beli ? '#166534' : jual < beli ? '#991b1b' : '#334155',
    w: 1.9, h: 0.9,
  });
  ls.position.set(0, 0.6, 1.0);
  scene.add(ls);
  return { target: new THREE.Vector3(0, 1.5, 0), camera: new THREE.Vector3(0, 2.8, 6.4) };
}

export default function Scene3D({ type = 'kios', beli = 10000, jual = 12000 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(3, 6, 4);
    scene.add(sun);

    if (type === 'kios') {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(4, 40), mat(0xe2e8f0));
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);
    }
    const view = (type === 'bars' ? buildBars : buildKios)(scene, { beli, jual });

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.copy(view.camera);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(view.target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = 0.6;
    controls.maxPolarAngle = 1.55;
    controls.minAzimuthAngle = -0.9;
    controls.maxAzimuthAngle = 0.9;

    const resize = () => {
      const w = el.clientWidth || 300;
      const h = Math.round(w * 0.78);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          o.material.map?.dispose();
          o.material.dispose();
        }
      });
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [type, beli, jual]);

  return (
    <div>
      <div ref={ref} className="scene" aria-label="Ilustrasi 3D" />
      <p className="muted center">Geser dengan jari untuk memutar ilustrasi.</p>
    </div>
  );
}

const GAME_CONTEXT = {
  g1: { goods: 'Bahan gorengan', colors: [0xf4c95d, 0xd2b48c], kind: 'ingredients' },
  g2: { goods: 'Gorengan dijual', colors: [0xf2a65a, 0xffd166], kind: 'donuts' },
  g3: { goods: 'Susu kotak', colors: [0x9bded2, 0xffffff], kind: 'milk' },
  g4: { goods: 'Susu terjual', colors: [0xa7c7f9, 0xffffff], kind: 'milk' },
  g5: { goods: 'Roti dibeli', colors: [0xd99555, 0xf0c27b], kind: 'bread' },
  g6: { goods: 'Roti ditawarkan', colors: [0xe8a45b, 0xf5c879], kind: 'bread' },
  g7: { goods: 'Belanja bahan', colors: [0xc5a1f2, 0xf0c96b], kind: 'buy' },
  g8: { goods: 'Pembayaran', colors: [0xf3a4c4, 0xf0c96b], kind: 'sell' },
};

function gameLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fffdfd';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#493f67';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = 'bold 46px sans-serif';
  context.fillText(text, canvas.width / 2, canvas.height / 2, 460);
  const texture = new THREE.CanvasTexture(canvas);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.62),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  mesh.position.set(0, 2.45, 0.94);
  return mesh;
}

function createGameCharacter(scene, { x, shirtColor, hijab, facing = 1 }) {
  const person = new THREE.Group();
  person.position.set(x, 0.12, 0.25);
  const skin = mat(0xf1c5a5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 14), skin);
  head.position.y = 1.6;
  person.add(head);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.8, 14), mat(shirtColor));
  torso.position.y = 0.93;
  person.add(torso);
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.3, 0.38, 12), mat(0x6874a8));
  legs.position.y = 0.32;
  person.add(legs);
  if (hijab) {
    const veil = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), mat(hijab));
    veil.scale.set(1.05, 1.1, 0.86);
    veil.position.set(0, 1.57, -0.08);
    person.add(veil);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), skin);
    face.scale.set(0.9, 1, 0.85);
    face.position.set(0, 1.59, 0.2);
    person.add(face);
  }

  const makeArm = (side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.24, 1.18, 0.02);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.62, 10), mat(shirtColor));
    arm.position.y = 0.29;
    pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), skin);
    hand.position.y = 0.62;
    pivot.add(hand);
    person.add(pivot);
    return pivot;
  };
  const wavingArm = makeArm(facing);
  makeArm(-facing).rotation.z = -facing * 0.1;
  scene.add(person);
  return { person, wavingArm };
}

function createGameGoods(scene, kind, colors) {
  const group = new THREE.Group();
  group.position.set(0, 1.3, 0.22);
  const addBox = (w, h, d, color, x, y, z) => {
    const item = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    item.position.set(x, y, z);
    group.add(item);
    return item;
  };
  const addSphere = (color, x, y, z, scale) => {
    const item = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(color));
    item.position.set(x, y, z);
    item.scale.set(...scale);
    group.add(item);
    return item;
  };

  if (kind === 'ingredients') {
    addBox(0.36, 0.58, 0.3, colors[0], -0.38, 0.42, 0);
    addBox(0.2, 0.12, 0.22, 0xfaf2d8, -0.38, 0.78, 0);
    addSphere(colors[1], 0.34, 0.35, 0, [0.4, 0.36, 0.35]);
  } else if (kind === 'donuts') {
    for (let i = 0; i < 3; i++) {
      const donut = new THREE.Mesh(
        new THREE.TorusGeometry(0.25, 0.12, 10, 20),
        mat([0xe5a44c, 0xf29a83, 0xf0c96b][i])
      );
      donut.position.set((i - 1) * 0.45, 0.38 + (i % 2) * 0.04, 0);
      group.add(donut);
    }
  } else if (kind === 'milk') {
    [-0.32, 0.32].forEach((x, index) => {
      addBox(0.43, 0.7, 0.36, index ? 0xffffff : colors[0], x, 0.43, 0);
      addBox(0.14, 0.1, 0.14, 0x86b7e8, x, 0.83, 0);
    });
  } else if (kind === 'bread') {
    addSphere(colors[0], -0.32, 0.37, 0, [0.65, 0.7, 0.46]);
    addSphere(colors[1], 0.32, 0.37, 0, [0.65, 0.7, 0.46]);
  } else {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.7, 0.4), mat(colors[0]));
    bag.position.set(-0.28, 0.38, 0);
    group.add(bag);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.045, 8, 16, Math.PI), mat(colors[0]));
    handle.position.set(-0.28, 0.78, 0);
    group.add(handle);
    for (let i = 0; i < 4; i++) {
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 20), mat(colors[1]));
      coin.rotation.x = Math.PI / 2;
      coin.position.set(0.25 + (i % 2) * 0.2, 0.34 + Math.floor(i / 2) * 0.1, 0.12);
      group.add(coin);
    }
  }

  scene.add(group);
  return group;
}

export function GameScene3D({ term }) {
  const ref = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    if (!el) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f2ff);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xadb5d2, 1.7));
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(-3, 6, 5);
    scene.add(light);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), mat(0xe8f5f2));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    scene.add(floor);
    scene.add(box(2.6, 0.85, 0.9, 0xc98e62, 0, 0.72, 0));
    scene.add(box(3.35, 0.1, 1.05, 0xf2c98b, 0, 1.2, 0));
    scene.add(box(3.15, 0.16, 0.14, 0xe7a1be, 0, 2.1, -0.08));
    for (let i = 0; i < 5; i++) {
      scene.add(box(0.62, 0.16, 0.16, i % 2 ? 0xb9a2f5 : 0xf8d9a0, -1.24 + i * 0.62, 2.1, 0.02));
    }
    scene.add(box(0.09, 1.2, 0.09, 0xc98e62, -1.45, 1.58, -0.06));
    scene.add(box(0.09, 1.2, 0.09, 0xc98e62, 1.45, 1.58, -0.06));
    scene.add(gameLabel(GAME_CONTEXT[term.id]?.goods ?? 'Kantin Kak Uci'));

    const context = GAME_CONTEXT[term.id] ?? GAME_CONTEXT.g1;
    const goods = createGameGoods(scene, context.kind, context.colors);
    const seller = createGameCharacter(scene, { x: -2.05, shirtColor: 0xb9a2f5, hijab: 0xe88db5, facing: 1 });
    const buyer = createGameCharacter(scene, { x: 2.05, shirtColor: 0x83cfc2, facing: -1 });
    const transferCoin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.055, 24),
      mat(0xf0c96b)
    );
    transferCoin.rotation.x = Math.PI / 2;
    transferCoin.position.set(0.06, 1.75, 0.52);
    scene.add(transferCoin);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.set(0, 3.35, 7.1);
    camera.lookAt(0, 1.45, 0);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (error) {
      console.error('Perangkat ini tidak dapat menampilkan ilustrasi 3D game:', error);
      disposeScene(scene);
      setFailed(true);
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    el.appendChild(renderer.domElement);

    const resize = () => {
      const width = el.clientWidth || 320;
      const height = el.clientHeight || 230;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(el);

    let raf;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = (now - start) / 1000;
      goods.position.y = 1.3 + Math.sin(elapsed * 2.6) * 0.045;
      seller.wavingArm.rotation.z = -0.65 + Math.sin(elapsed * 4) * 0.14;
      buyer.wavingArm.rotation.z = 0.65 + Math.sin(elapsed * 3.4 + 0.8) * 0.12;
      transferCoin.position.x = Math.sin(elapsed * 1.6) * 0.42;
      transferCoin.rotation.y = elapsed * 2.2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      disposeScene(scene);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, [term.id]);

  return (
    <div className="game-scene" ref={ref} aria-label={`Ilustrasi 3D bergerak: ${term.contoh}`}>
      {failed && (
        <div className="game-scene-fallback" role="img" aria-label={`Ilustrasi: ${term.contoh}`}>
          {term.illustration.map((item, index) => <span key={`${term.id}-${index}`}>{item}</span>)}
        </div>
      )}
    </div>
  );
}
