import * as THREE from 'three';
import { cactusTexture } from './cactusTexture';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot } from './pot';

let cactusMat: THREE.MeshStandardMaterial | null = null;
function trunkMaterial(): THREE.MeshStandardMaterial {
  if (!cactusMat) {
    cactusMat = new THREE.MeshStandardMaterial({ map: cactusTexture(), roughness: 0.7 });
  }
  return cactusMat;
}

function addArm(parent: THREE.Group, rng: () => number, baseY: number, radius: number): void {
  const armLen = 0.22 + rng() * 0.12;
  const armR = radius * (0.55 + rng() * 0.15);
  const arm = new THREE.Group();
  const angle = rng() * Math.PI * 2;
  arm.position.set(Math.sin(angle) * radius * 0.7, baseY, Math.cos(angle) * radius * 0.7);
  arm.rotation.z = Math.sin(angle) * 0.5;
  arm.rotation.x = Math.cos(angle) * 0.5;

  // A short elbow up, then a straight segment — the classic saguaro-arm
  // silhouette (grows outward, then turns to grow straight up again).
  const elbow = new THREE.Mesh(
    new THREE.CapsuleGeometry(armR, armLen * 0.4, 4, 10),
    trunkMaterial(),
  );
  elbow.rotation.z = Math.PI / 2.4;
  elbow.position.y = armLen * 0.15;
  arm.add(elbow);

  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(armR * 0.9, armLen * 0.7, 4, 10), trunkMaterial());
  upper.position.set(Math.sin(angle) * armLen * 0.55, armLen * 0.55, Math.cos(angle) * armLen * 0.1);
  arm.add(upper);

  parent.add(arm);
}

function buildCactus(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup);

  const trunkR = 0.15 + rng() * 0.05;
  const trunkLen = 0.55 + rng() * 0.3;
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(trunkR, trunkLen, 4, 14), trunkMaterial());
  trunk.position.y = 0.19 + trunkLen / 2 + trunkR;
  potGroup.add(trunk);

  const armCount = rng() < 0.7 ? 1 + Math.floor(rng() * 2) : 0;
  for (let i = 0; i < armCount; i++) {
    addArm(potGroup, rng, 0.19 + trunkLen * (0.35 + rng() * 0.35), trunkR);
  }

  // A small chance of a bloom on top — a cluster of thin bright petals.
  if (rng() < 0.4) {
    const petalCount = 6 + Math.floor(rng() * 4);
    const hue = 0.92 + rng() * 0.08; // magenta/pink
    const petalMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.75, 0.6),
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const flowerY = 0.19 + trunkLen + trunkR * 1.7;
    for (let i = 0; i < petalCount; i++) {
      const a = (i / petalCount) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.1), petalMat);
      petal.position.set(Math.sin(a) * 0.03, flowerY, Math.cos(a) * 0.03);
      petal.rotation.y = -a;
      petal.rotation.x = -0.5;
      potGroup.add(petal);
    }
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf4d35e, roughness: 0.6 }),
    );
    center.position.y = flowerY;
    potGroup.add(center);
  }

  // Rigid — real cacti don't sway. Returning no sway entries is fine; the
  // shared animation loop simply has nothing to animate.
  return [];
}

/** A small potted cactus (a stout ribbed trunk, sometimes an arm or two,
 *  occasionally in bloom), three.js-rendered. Desktop shelf only — see
 *  DesktopShelf's placement logic in Library.tsx. */
export function Cactus({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // potY sits the pot's own bottom right at the bottom of the frustum
  // (~-1.0, matching the container's bottom edge — see PlantCanvas — which
  // is also where a spine book's bottom lands), so it reads as standing on
  // the shelf board like the books beside it, not floating mid-frame.
  return <PlantCanvas width={width} height={height} seed={seed} potY={-0.78} build={buildCactus} />;
}
