import * as THREE from 'three';

export const POT_TOP_R = 0.34;
export const POT_RIM_Y = 0.2;
export const POT_SOIL_R = 0.29;
/** Anything rooted "at the soil" should clear this radius before it's safe
 *  to start falling/leaning — see Pothos.tsx's buildVine for why: it's not
 *  just past the decorative rim ring, it's past the pot's own max radius. */
export const POT_CLEAR_R = 0.42;
export const POT_CROWN_Y = 0.22; // just above the soil — where stems/blades start

/** The shared terracotta pot every shelf plant sits in — open-ended (no
 *  solid top cap), so a stem/vine rooted at the soil and rendered above
 *  POT_RIM_Y is guaranteed not to clip it, regardless of horizontal
 *  position (there's no pot geometry up there to clip). */
export function buildPot(potGroup: THREE.Group): void {
  const potGeo = new THREE.CylinderGeometry(POT_TOP_R, 0.25, 0.4, 20, 1, true);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa8582f, roughness: 0.75, side: THREE.DoubleSide });
  potGroup.add(new THREE.Mesh(potGeo, potMat));

  const rimGeo = new THREE.TorusGeometry(0.335, 0.018, 8, 20);
  const rim = new THREE.Mesh(rimGeo, new THREE.MeshStandardMaterial({ color: 0xc06a3a, roughness: 0.6 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = POT_RIM_Y;
  potGroup.add(rim);

  const soilGeo = new THREE.CylinderGeometry(POT_SOIL_R, POT_SOIL_R, 0.04, 20);
  const soil = new THREE.Mesh(soilGeo, new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 1 }));
  soil.position.y = 0.19;
  potGroup.add(soil);
}
