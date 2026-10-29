import * as THREE from 'three';

const AISLES = 26;
const RACKS = 15;
const rackCenters = [-3.15, 0, 3.15];
const levelCenters = [1.5, 4.5, 7.5];

function addFloorLabel(scene, text, x, z) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#14212b';
  context.fillRect(0, 0, 256, 128);
  context.strokeStyle = '#31576a';
  context.strokeRect(5, 5, 246, 118);
  context.fillStyle = '#90b2c2';
  context.font = 'bold 66px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, 128, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4.8, 2.4),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.025, z);
  scene.add(mesh);
}

function addRacks(scene) {
  const parts = [];
  for (let aisle = 0; aisle < AISLES; aisle++) {
    for (let rack = 0; rack < RACKS; rack++) {
      const x = aisle * 14;
      const z = rack * 12;
      for (const dx of [-5.05, 5.05]) {
        for (const dz of [-4.3, 4.3]) parts.push({ x: x + dx, y: 4.6, z: z + dz, sx: 0.16, sy: 9.2, sz: 0.16 });
      }
      for (const y of [0.45, 3.05, 6.05, 9.05]) {
        for (const dz of [-4.3, 4.3]) parts.push({ x, y, z: z + dz, sx: 10.3, sy: 0.14, sz: 0.19, beam: true });
      }
    }
  }
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.55, roughness: 0.5 }),
    parts.length,
  );
  const dummy = new THREE.Object3D();
  parts.forEach((part, i) => {
    dummy.position.set(part.x, part.y, part.z);
    dummy.scale.set(part.sx, part.sy, part.sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, new THREE.Color(part.beam ? 0xb32b12 : 0x3d4653));
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
}

export function createWarehouse(canvas, products) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0f1115');
  scene.fog = new THREE.FogExp2('#0f1115', 0.0031);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0x93b7c8, 0x19232c, 2.2));
  const sunlight = new THREE.DirectionalLight(0xd6e8ff, 2.0);
  sunlight.position.set(100, 130, 70);
  scene.add(sunlight);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(375, 190),
    new THREE.MeshStandardMaterial({ color: 0x15171e, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(175, -0.06, 84);
  scene.add(floor);
  const grid = new THREE.GridHelper(380, 95, 0x315063, 0x263943);
  grid.position.set(175, 0, 84);
  scene.add(grid);

  addRacks(scene);
  for (let aisle = 0; aisle < AISLES; aisle++) {
    for (let rack = 0; rack < RACKS; rack += 3) {
      addFloorLabel(scene, `${String.fromCharCode(65 + aisle)}${rack + 1}`, aisle * 14 - 6.1, rack * 12);
    }
  }

  const boxes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1.8, 1.85, 2.3),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, emissive: 0x280707, emissiveIntensity: 0.17 }),
    products.length,
  );
  const dummy = new THREE.Object3D();
  const normalColors = [];
  const locations = new Map();
  const counts = new Map();
  products.forEach((product, index) => {
    const aisle = product.aisle.charCodeAt(0) - 65;
    const rack = Number(product.rack) - 1;
    const level = Number(product.level) - 1;
    const slot = Number(product.position);
    const slotKey = `${aisle}:${rack}:${level}:${slot}`;
    const duplicate = counts.get(slotKey) ?? 0;
    counts.set(slotKey, duplicate + 1);
    const point = new THREE.Vector3(
      aisle * 14 + rackCenters[slot],
      levelCenters[level],
      rack * 12 + ((duplicate % 3) - 1) * 2.65,
    );
    dummy.position.copy(point);
    dummy.rotation.y = 0;
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    boxes.setMatrixAt(index, dummy.matrix);
    const color = new THREE.Color(0xc8cbd0);
    normalColors.push(color);
    boxes.setColorAt(index, color);
    locations.set(String(product.id), { point, index });
  });
  boxes.instanceMatrix.needsUpdate = true;
  boxes.instanceColor.needsUpdate = true;
  boxes.computeBoundingSphere();
  scene.add(boxes);

  const selectedBox = new THREE.Mesh(
    boxes.geometry,
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.75, roughness: 0.5 }),
  );
  selectedBox.visible = false;
  selectedBox.scale.setScalar(1.025);
  scene.add(selectedBox);

  const selectionLight = new THREE.PointLight(0xef4444, 0, 16, 2);
  scene.add(selectionLight);
  let selectedIndex = -1;

  function selectProduct(id) {
    const location = locations.get(String(id));
    if (!location) return null;
    if (selectedIndex >= 0) boxes.setColorAt(selectedIndex, normalColors[selectedIndex]);
    selectedIndex = location.index;
    boxes.setColorAt(selectedIndex, new THREE.Color(0xef4444));
    boxes.instanceColor.needsUpdate = true;
    selectedBox.position.copy(location.point);
    selectedBox.visible = true;
    selectionLight.position.copy(location.point);
    selectionLight.intensity = 7;
    return location.point;
  }

  function resize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    renderer.setSize(width, height, false);
    return { width, height };
  }

  return { scene, renderer, resize, selectProduct };
}
