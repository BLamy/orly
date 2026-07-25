import * as THREE from 'three';
import { bladeTexture } from './bladeTexture';
import { snakeBladeGeometry } from './leafGeometry';
import { PlantCanvas, type Sway } from './PlantCanvas';
import { buildPot } from './pot';

// No transparency/alphaTest any more: the blade's silhouette is the mesh (see
// snakeBladeGeometry), so the texture is a full-bleed surface. That also lets
// the material take a real specular sheen — Sansevieria leaves are waxy.
const bladeMatCache = new Map<number, THREE.MeshStandardMaterial>();
function bladeMaterial(variant: number): THREE.MeshStandardMaterial {
  let mat = bladeMatCache.get(variant);
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      map: bladeTexture(variant),
      side: THREE.DoubleSide,
      roughness: 0.42,
      metalness: 0.04,
    });
    mat.userData.shared = true; // cached across instances — see PlantCanvas teardown
    bladeMatCache.set(variant, mat);
  }
  return mat;
}

function buildSnakePlant(potGroup: THREE.Group, rng: () => number): Sway[] {
  buildPot(potGroup, rng);

  // A tight upright rosette of tall, stiff, pointed blades. Two things carry
  // the look, both of them per-blade properties of the mesh rather than of
  // the arrangement: every blade tapers to a real point and twists around its
  // own axis (so you see its face at the base and its edge near the tip), and
  // every blade arches slightly backward instead of standing like a ruler.
  //
  // The blades are also grown in two tiers — a taller inner set and a shorter
  // outer set fanned further out — which is how a real Sansevieria clump
  // reads: new shoots come up in the middle, older ones lean away.
  const bladeCount = 7 + Math.floor(rng() * 5);
  const sway: Sway[] = [];
  // A golden-angle spiral rather than evenly-divided angles: even spacing
  // makes a fan, phyllotaxis makes a clump.
  const GOLDEN = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < bladeCount; i++) {
    const a = i * GOLDEN + rng() * 0.35;
    const inner = i % 3 !== 0; // roughly two-thirds tall inner shoots
    const startR = (inner ? 0.02 : 0.07) + rng() * 0.06;
    const height = inner ? 0.62 + rng() * 0.3 : 0.34 + rng() * 0.22;
    const width = 0.13 + rng() * 0.05;
    const lean = (inner ? 0.05 : 0.16) + rng() * 0.12; // outer shoots fan wider

    const group = new THREE.Group();
    group.position.set(Math.sin(a) * startR, 0.19, Math.cos(a) * startR);
    // Lean radially outward: rotate to face away from center, then tip over.
    group.rotation.y = a + (rng() - 0.5) * 0.25;
    group.rotation.z = lean * (rng() < 0.5 ? 1 : -1);
    group.rotation.x = -lean * 0.5;

    const variant = Math.floor(rng() * 3);
    const blade = new THREE.Mesh(
      snakeBladeGeometry(width, height, {
        // Alternate the twist direction so the clump doesn't all spiral the
        // same way, and twist the tall blades more (they have further to go).
        twist: (0.35 + rng() * 0.5) * (i % 2 === 0 ? 1 : -1) * (inner ? 1.2 : 0.8),
        bend: 0.08 + rng() * 0.1,
        curl: 0.8 + rng() * 0.5,
      }),
      bladeMaterial(variant),
    );
    group.add(blade);

    potGroup.add(group);
    // Taller blades sway a little more and a little slower, like real ones.
    sway.push({
      group,
      phase: rng() * Math.PI * 2,
      freq: (inner ? 0.3 : 0.42) + rng() * 0.2,
      amp: (inner ? 0.02 : 0.012) + rng() * 0.012,
    });
  }

  return sway;
}

/** A small potted snake plant (Sansevieria) — tall stiff variegated blades
 *  in an upright cluster, no trailing vines. Desktop shelf only — see
 *  DesktopShelf's placement logic in Library.tsx. */
export function SnakePlant({ width, height, seed = 0 }: { width: number; height: number; seed?: number }) {
  // potY sits the pot's own bottom right at the bottom of the frustum — see
  // the matching comment in Cactus.tsx — so it stands on the shelf board
  // like the books beside it instead of floating mid-frame.
  return <PlantCanvas width={width} height={height} seed={seed} potY={-0.78} build={buildSnakePlant} />;
}
