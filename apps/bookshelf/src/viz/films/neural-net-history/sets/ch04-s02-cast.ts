/**
 * ch04-s02 — the two authors as this shot stages them, with stronger silhouette signatures (review round 1:
 * "stiff, generic stick silhouettes, far below the reference frame's costume detail").
 *
 *   papertS02   Seymour Papert: the cast's spec, in a sports jacket with VISIBLE SKIRTS (a hanging lower panel to
 *               mid-thigh that parts with the legs), lapels, pocket flaps, shirt cuffs and a hem cut-line; the full
 *               beard and a fuller hair mass (×1.3)
 *   minskyS02   Marvin Minsky in the 1960s: no glasses, the BALD DOME, slight build with narrow shoulders and a
 *               small forward stoop, in the turtleneck (fold, rib and cuff cut-lines)
 *   standLife(p, tq, seed, o)   breathing and a slow weight shift (hip sway, root drift) on twos, so a figure
 *               standing through 20 s is never frozen
 *
 * The kit's WARDROBES gets one shot-scoped entry ('ch04-s02-sportCoat'); nothing shared is changed.
 */
import { WARDROBES, addPose, createPuppet } from '../../../film';
import type { Pose } from '../../../film';
import { cast } from '../cast';

const SPORT = 'ch04-s02-sportCoat';
if (!WARDROBES[SPORT])
  WARDROBES[SPORT] = {
    ...WARDROBES.blazer,
    hem: 20,
    pad: 0.75,
    waist: 0.18,
    sleeve: { ...WARDROBES.blazer.sleeve, shirtCuff: true },
    lower: { waist: 0.3, hem: 40, flare: 4, coat: true },
    details: ['lapel', 'pocketFlap', 'hemLine', 'shirtCuff', 'buttons', 'cuff'],
  };

export const papertS02 = createPuppet({
  ...cast.papert.spec,
  id: 'papert-ch04-s02',
  wardrobe: SPORT,
  details: ['lapel', 'pocketFlap', 'hemLine', 'shirtCuff'],
  signature: { hairScale: 1.3, rim: true },
});

export const minskyS02 = createPuppet({
  ...cast['minsky-1960s'].spec,
  id: 'minsky-ch04-s02',
  hair: 'bald',
  glasses: 'none',
  build: 'slight',
  details: ['turtleFold', 'rib', 'cuff', 'crease'],
  signature: { stoop: 4, rim: true },
});

const TWOS = 12;
const ph = (seed: number, k: number) => ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1) * Math.PI * 2;

/** breathing (4 s) and a weight shift (period ~6 s, seeded phase) on twos; `amt` scales both */
export function standLife<P extends Pose & { prev?: Pose }>(p: P, tq: number, seed: number, amt = 1): P {
  const off = (t: number) => {
    const b = Math.sin((t / 4) * Math.PI * 2 + ph(seed, 1));
    const w = Math.sin((t / 6.3) * Math.PI * 2 + ph(seed, 2));
    return {
      angles: {
        torso: (1.1 * b - 0.9 * w) * amt,
        neck: -0.5 * b * amt,
        shoulderF: 1.0 * b * amt,
        shoulderB: 1.0 * b * amt,
        hipF: 2.6 * w * amt,
        hipB: -2.2 * w * amt,
        kneeF: -1.6 * Math.max(0, -w) * amt,
        kneeB: -1.6 * Math.max(0, w) * amt,
      },
      rootX: 2.4 * w * amt,
    };
  };
  const apply = (q: Pose, t: number): Pose => {
    const o = off(t);
    const r = addPose(q, o.angles);
    return { ...r, root: { ...(q.root ?? {}), x: (q.root?.x ?? 0) + o.rootX } };
  };
  const out = apply(p, tq) as P;
  if (p.prev) out.prev = apply(p.prev, tq - 1 / TWOS);
  return out;
}
