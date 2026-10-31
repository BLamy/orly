/**
 * perceptron-short — the cast (story/script.json "cast"), as articulated silhouette puppets.
 *
 *   import { cast, CAST_INFO } from '../cast';
 *   cast.rosenblatt.draw(c, { x, y, facing: 'right', pose }, env);
 *
 * Silhouette signature (style bible §4.4), respectful and era-correct:
 *  - Frank Rosenblatt, c. 1958 (aged about 30): slight, upright build; dark side-parted hair;
 *    clean-shaven, no glasses; a 1950s lab coat over a narrow tie (flared hem below the knee,
 *    pen pocket). Profile parameters stay near neutral: never exaggerated.
 * Size: 322 px tall at scale 1 (≈ 45% of frame height on the action plane).
 */
import type { PuppetSpec } from '../../film/contracts';
import { createPuppet } from '../../film/silhouette/puppet';

export const SPECS = {
  rosenblatt: {
    id: 'rosenblatt',
    height: 322,
    build: 'slight',
    era: '1950s',
    wardrobe: 'labCoat',
    hair: 'sidePart',
    facialHair: 'none',
    glasses: 'none',
    hat: 'none',
    profile: { nose: 0.5, brow: 0.45, chin: 0.5, jaw: 0.45 },
    prop: 'none',
    details: ['lapel', 'penPocket'], // script: lapel + pocket → the kit's lab-coat pen pocket
  },
} satisfies Record<string, PuppetSpec>;

export type CastId = keyof typeof SPECS;

export const cast = {
  rosenblatt: createPuppet(SPECS.rosenblatt),
};

/** name cards and roles (from script.json; name cards appear on first appearance) */
export const CAST_INFO: Record<CastId, { name: string; role: string; firstAppearance: string }> = {
  rosenblatt: { name: 'Frank Rosenblatt', role: 'psychologist, Cornell Aeronautical Laboratory', firstAppearance: 'ch01-s02' },
};
