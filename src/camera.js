import * as THREE from 'three';
import gsap from 'gsap';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createCamera(canvas, width, height) {
  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 900);
  camera.position.set(-34, 55, 76);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(75, 0, 75);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = true;
  controls.minDistance = 3;
  controls.maxDistance = 250;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();
  let activeTween;

  function flyTo(point, onArrival) {
    activeTween?.kill();
    const aisleCenter = Math.round(point.x / 14) * 14;
    const rackCenter = Math.round(point.z / 12) * 12;
    const side = point.x < aisleCenter ? -1 : 1;
    const destination = new THREE.Vector3(
      aisleCenter + side * 7.4,
      point.y + 1.3,
      rackCenter + 6.7,
    );
    const distance = camera.position.distanceTo(destination);
    const state = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: controls.target.x,
      ty: controls.target.y,
      tz: controls.target.z,
    };
    activeTween = gsap.to(state, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        tx: point.x,
        ty: point.y,
        tz: point.z,
        duration: Math.min(1.35, Math.max(0.55, distance * 0.006)),
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.position.set(state.x, state.y, state.z);
          controls.target.set(state.tx, state.ty, state.tz);
          controls.update();
        },
        onComplete: onArrival,
    });
  }

  return { camera, controls, flyTo };
}
