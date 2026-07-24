import * as THREE from 'three';
import { bladeTexture } from './bladeTexture';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot } from './pot';

const bladeMatCache = new Map<number, THREE.MeshStandardMaterial>();
function bladeMaterial(variant: number): THREE.MeshStandardMaterial {
  let mat = bladeMatCache.get(variant);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: bladeTexture(variant),
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 0.45,
    });
    bladeMatCache.set(variant, mat);
  }
  return mat;
}

function buildSnakePlant(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup);

  // A tight upright cluster of tall, stiff, pointed blades — no droop, just
  // a slight outward fan and a gentle per-blade twist, clustered near the
  // soil's center rather than spread to the rim (Sansevieria grows as a
  // dense rosette, not a wide spread).
  const bladeCount = 5 + Math.floor(rng() * 4);
  const sway: Sway[] = [];
  for (let i = 0; i < bladeCount; i++) {
    const a = (i / bladeCount) * Math.PI * 2 + rng() * 0.6;
    const startR = 0.02 + rng() * 0.09;
    const height = 0.55 + rng() * 0.32;
    const width = 0.09 + rng() * 0.03;
    const lean = 0.08 + rng() * 0.1; // slight outward fan, not ramrod-straight

    const group = new THREE.Group();
    group.position.set(Math.sin(a) * startR, 0.19, Math.cos(a) * startR);
    group.rotation.y = a + (rng() - 0.5) * 0.3;
    group.rotation.z = lean;

    const variant = Math.floor(rng() * 3);
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(width, height), bladeMaterial(variant));
    // texture's tall axis is +y already (tip near top edge of the canvas);
    // anchor at the blade's base, not its center.
    blade.geometry.translate(0, height / 2, 0);
    blade.rotateZ((rng() - 0.5) * 0.12); // a faint twist along its own axis
    group.add(blade);

    // A back-to-back second plane at a slight angle gives the blade some
    // cross-sectional volume instead of reading as a flat cutout from every
    // angle.
    const blade2 = new THREE.Mesh(new THREE.PlaneGeometry(width, height), bladeMaterial(variant));
    blade2.geometry.translate(0, height / 2, 0);
    blade2.rotation.y = Math.PI / 2 + (rng() - 0.5) * 0.3;
    group.add(blade2);

    potGroup.add(group);
    sway.push({ group, phase: rng() * Math.PI * 2, freq: 0.35 + rng() * 0.25, amp: 0.015 + rng() * 0.015 });
  }

  return sway;
}

/** A small potted snake plant (Sansevieria) — tall stiff variegated blades
 *  in an upright cluster, no trailing vines. Desktop shelf only — see
 *  DesktopShelf's placement logic in Library.tsx. */
export function SnakePlant({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  return <PlantCanvas width={width} height={height} seed={seed} potY={0.05} build={buildSnakePlant} />;
}
