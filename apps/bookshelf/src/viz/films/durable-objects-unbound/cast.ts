/**
 * durable-objects-unbound — the cast (story/script.json "cast"), as articulated silhouette puppets.
 *
 *   import { cast, CAST_INFO, KEEPER_RIM } from '../cast';
 *   cast['keeper-a'].draw(c, { x, y, facing: 'right', pose: POSES.stand, ink: PUPPET_NEAR_BLACK, light, edgeRim }, env);
 *
 * Keys are the script's cast ids exactly (quote the hyphenated ones). The demonstrator's hand
 * (`narrator-hands`) is not a puppet: it is drawn by sets/demonstratorHand.ts (always from the lower RIGHT, only
 * to pull / reseat a pin, turn a Plate tile on a parchment insert, or hold up a slip). Bert Belder appears only as
 * a name card beside an empty, out-of-focus chair (no figure is drawn), so he has a spec but shots never draw him.
 *
 * Lead-animator mapping of the script's wardrobe words onto the kit's WARDROBES (the kit has no 'workJacket',
 * 'scarfCoat', 'satchelJacket', 'vest', 'smock', 'shirt', 'sweater' or 'longCoat' cut), chosen so no two figures
 * read as the same cut-out at 64 px (style bible §4.4):
 *  - sender: a hoodie (f), hair in a bun, the phone in the near hand; idle listen. Seen seated at the L4 window.
 *  - keeper-a: a gilet over shirtsleeves (the work jacket), crew cut under a cap, tall, a stoop; idle rest.
 *  - keeper-b: an overcoat (f) for the scarf coat, a bob, slight, chin up; idle shift.
 *  - keeper-c: a quarter-zip (the satchel jacket; a satchel strap is cut as a detail), beanie, stocky, papers; idle clasp.
 *  - copyist-1: a cardigan, long hair, round glasses, a book; stoop 8; idle think.
 *  - copyist-2: a sweater vest (seen seated at a desk, so the cut's flared trousers never show), receding, stubble, pen;
 *    idle fold.
 *  - witness: a small (160 px) lab-coat smock and cap: a metaphor figure, never a person.
 *  - kenton-varda: a polo (the shirt), short side part; a 6 deg stoop and the 'think' idle; screen-left desks only.
 *  - ryan-dahl: a turtleneck (the sweater), swept-back short hair, tall, chin up 2; screen-right desks only.
 *  - werner-vogels: a blazer, receding hair, tall, idle clasp; one appearance beside the Well cutaway.
 * Real people: generic, dignified silhouettes, no likeness attempted, no appearance details claimed (cast.json).
 */
import type { PuppetSpec } from '../../film/contracts';
import { createPuppet } from '../../film/silhouette/puppet';

export const SPECS = {
  sender: {
    id: 'sender', height: 310, build: 'slight', era: '2020s', wardrobe: 'hoodie:f', hair: 'bun',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.45, brow: 0.5, chin: 0.45, jaw: 0.42 },
    prop: 'phone', details: ['collar'],
    signature: { idle: 'listen', tilt: 2, rim: { x: -0.6, y: -0.8, px: 2.25, alpha: 0.85, warm: 0.6 } },
  },
  'keeper-a': {
    id: 'keeper-a', height: 330, build: 'tall', era: '2020s', wardrobe: 'gilet', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'cap', profile: { nose: 0.55, brow: 0.55, chin: 0.5, jaw: 0.55 },
    prop: 'none', details: ['cuff', 'pocketFlap'],
    signature: { stoop: 4, idle: 'rest', tilt: 1, rim: true },
  },
  'keeper-b': {
    id: 'keeper-b', height: 300, build: 'slight', era: '2020s', wardrobe: 'overcoat:f', hair: 'bob',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.42, brow: 0.48, chin: 0.46, jaw: 0.4 },
    prop: 'none', details: ['beltLine', 'cuff'],
    signature: { chinUp: 3, idle: 'shift', tilt: -2, rim: true },
  },
  'keeper-c': {
    id: 'keeper-c', height: 315, build: 'stocky', era: '2020s', wardrobe: 'quarterZip', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'beanie', profile: { nose: 0.5, brow: 0.52, chin: 0.55, jaw: 0.6 },
    prop: 'papers', details: ['cuff'],
    signature: { idle: 'clasp', tilt: 2, rim: true },
  },
  'copyist-1': {
    id: 'copyist-1', height: 300, build: 'average', era: '2020s', wardrobe: 'cardigan:f', hair: 'long',
    facialHair: 'none', glasses: 'round', hat: 'none', profile: { nose: 0.46, brow: 0.5, chin: 0.45, jaw: 0.44 },
    prop: 'book', details: ['cardiganEdge'],
    signature: { stoop: 8, idle: 'think', tilt: 3, rim: true },
  },
  'copyist-2': {
    id: 'copyist-2', height: 320, build: 'average', era: '2020s', wardrobe: 'sweaterVest', hair: 'receding',
    facialHair: 'stubble', glasses: 'none', hat: 'none', profile: { nose: 0.56, brow: 0.55, chin: 0.52, jaw: 0.58 },
    prop: 'pen', details: ['shirtCuff'],
    signature: { idle: 'fold', tilt: -2, rim: true },
  },
  witness: {
    id: 'witness', height: 160, build: 'slight', era: '2020s', wardrobe: 'labCoat', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'cap', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'none', details: ['hemLine'],
    signature: { idle: 'listen', rim: { x: 0.2, y: -1, px: 2.25, alpha: 0.85, warm: 0.2 } },
  },
  'kenton-varda': {
    id: 'kenton-varda', height: 325, build: 'average', era: '2020s', wardrobe: 'polo', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'laptop', details: ['collar', 'shirtCuff'],
    signature: { stoop: 6, idle: 'think', tilt: 2, rim: { x: 0.7, y: -0.7, px: 2.25, alpha: 0.85, warm: 0.7 } },
  },
  'ryan-dahl': {
    id: 'ryan-dahl', height: 330, build: 'tall', era: '2020s', wardrobe: 'turtleneck', hair: 'sweptBack',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.52 },
    prop: 'laptop', details: ['hemLine'],
    signature: { chinUp: 2, idle: 'rest', tilt: -1, rim: { x: -0.7, y: -0.7, px: 2.25, alpha: 0.85, warm: 0.6 } },
  },
  'bert-belder': {
    id: 'bert-belder', height: 320, build: 'average', era: '2020s', wardrobe: 'polo', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', prop: 'none', details: [],
    signature: { idle: 'stand' },
  },
  'werner-vogels': {
    id: 'werner-vogels', height: 335, build: 'tall', era: '2020s', wardrobe: 'blazer', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.55, chin: 0.5, jaw: 0.52 },
    prop: 'none', details: ['lapel'],
    signature: { idle: 'clasp', tilt: 1, rim: { x: 0.5, y: -0.9, px: 2.25, alpha: 0.85, warm: 0.3 } },
  },
} satisfies Record<string, PuppetSpec>;

export type CastId = keyof typeof SPECS;
export const CAST_IDS = Object.keys(SPECS) as CastId[];
export const cast = Object.fromEntries(CAST_IDS.map((id) => [id, createPuppet(SPECS[id])])) as Record<CastId, ReturnType<typeof createPuppet>>;

/** the town's key light is the moon, low-left: keepers in the square are rimmed on their upper-left contour */
export const MOON_RIM = { x: -0.75, y: -0.65, px: 2.5, alpha: 0.85, warm: 0.35 } as const;
export const MOON_LIGHT = { x: -0.75, y: -0.65, floor: 0.15 } as const;
/** desk lamps: Kenton Varda's lamp sits to his right (he faces right), Ryan Dahl's to his left (he faces left) */
export const KENTON_RIM = { x: 0.8, y: -0.6, px: 2.5, alpha: 0.85, warm: 0.7 } as const;
export const RYAN_RIM = { x: -0.8, y: -0.6, px: 2.5, alpha: 0.85, warm: 0.65 } as const;

/** name cards (exact strings from the script's onScreenText) */
export const CAST_INFO: Record<CastId | 'narrator-hands', { name: string; role: string; firstAppearance: string; generic?: boolean }> = {
  sender: { name: 'The sender (illustrative)', role: 'sends message #42 from a harbour-side window', firstAppearance: 'ch01-s01', generic: true },
  'keeper-a': { name: 'The keeper of House A', role: 'the runtime process in House A (illustrative)', firstAppearance: 'ch01-s01', generic: true },
  'keeper-b': { name: 'The keeper of House B', role: 'the runtime process in House B (illustrative)', firstAppearance: 'ch03-s02', generic: true },
  'keeper-c': { name: 'The keeper of House C', role: 'the runtime process in House C (illustrative)', firstAppearance: 'ch01-s02', generic: true },
  'copyist-1': { name: 'The first neighbour', role: 'a celld follower (illustrative)', firstAppearance: 'ch07-s03', generic: true },
  'copyist-2': { name: 'The second neighbour', role: 'a celld follower (illustrative)', firstAppearance: 'ch07-s03', generic: true },
  witness: { name: 'The witness in the well', role: 'a metaphor for S3\'s witness component', firstAppearance: 'ch03-s04', generic: true },
  'narrator-hands': { name: "The demonstrator's hand", role: 'pulls and reseats the pins, from the lower right', firstAppearance: 'ch03-s02', generic: true },
  'kenton-varda': { name: 'Kenton Varda', role: 'Cloudflare', firstAppearance: 'ch02-s01' },
  'ryan-dahl': { name: 'Ryan Dahl', role: 'Deno', firstAppearance: 'ch04-s01' },
  'bert-belder': { name: 'Bert Belder', role: '', firstAppearance: 'ch04-s03' },
  'werner-vogels': { name: 'Werner Vogels', role: 'Amazon CTO', firstAppearance: 'ch03-s04' },
};
