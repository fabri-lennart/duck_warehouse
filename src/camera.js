import * as THREE from 'three';
import gsap from 'gsap';

export function createCamera(width, height) {
  const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 900);
  camera.position.set(-34, 55, 76);
  const lookTarget = new THREE.Vector3(75, 0, 75);
  camera.lookAt(lookTarget);
  let activeTween;

  function flyTo(point) {
    activeTween?.kill();
    const destination = new THREE.Vector3(point.x - 11, point.y + 9, point.z + 18);
    const state = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      tx: lookTarget.x,
      ty: lookTarget.y,
      tz: lookTarget.z,
    };
    return new Promise((resolve) => {
      activeTween = gsap.to(state, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        tx: point.x,
        ty: point.y,
        tz: point.z,
        duration: 2.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.position.set(state.x, state.y, state.z);
          lookTarget.set(state.tx, state.ty, state.tz);
          camera.lookAt(lookTarget);
        },
        onComplete: resolve,
      });
    });
  }

  return { camera, flyTo };
}
