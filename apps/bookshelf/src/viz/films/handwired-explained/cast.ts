/**
 * handwired-explained — the cast (story/script.json "cast"), as articulated silhouette puppets and hand rigs.
 *
 *   import { cast, CAST_INFO, hands } from '../cast';
 *   cast.mcculloch.draw(c, { x, y, facing: 'right', pose: POSES.stand, ink: PUPPET_NEAR_BLACK, edgeRim }, env);
 *   cast['seating-clerk'].draw(c, { x, y, facing: 'left', pose }, env);
 *   hands.draw(c, hands.act('tie', u, linePoint, { held: 'tag' }), env);        // the tag-keeper's hands
 *   hands.draw(c, hands.pencil('strike', u, tagFace), env);                     // the red pencil
 *   hands.deskHands(c, { x, y, tq: env.tq, author: 'type', agent: 'type' }, env); // author + agent at the laptop
 *   hands.draw(c, hands.viewer(u, palm), env);                                   // the viewer's open hand (ch12-s06)
 *
 * Keys are the script's cast ids exactly (quote the hyphenated ones). The five HAND roles are not puppets:
 * `narrator-hands`, `red-pencil-hand`, `author-hands`, `agent-hand` and `viewer-hand` are all drawn by the one
 * rig in sets/narratorHands.ts (re-exported here as `hands`), so they share one silhouette language at one
 * scale (staging.hands). Their signature locks: the narrator's hands enter from the lower LEFT only and alone
 * tie / flip / rivet / lift / place / bend / holdUp; the pencil enters from frame RIGHT only and only hovers /
 * writes / strikes / rests; the author's hands appear only at a laptop or desk under a lamp; the agent's hand
 * is a paper sheet paler, beside the author's, and never acts first; the viewer's hand rises once from below.
 *
 * The four puppets (style bible §4.4: respectful, era-correct, never caricature; profiles within 0.35-0.65 of
 * neutral; differences from wardrobe, hair, glasses, build and height, which read at 64 px). Lead-animator
 * refinements to the script specs, each so two figures never read as the same cut-out:
 *  - mcculloch: three-piece suit with a watch chain, the full 'wild' beard and a big hair mass (1.15), chin up;
 *    idle think (hand at the chin). No cigarette (the kit has none; a pipe would be a substitution).
 *  - pitts: the youngest and smallest in the 1943 pair (294), a slightly long forehead (headScale y 1.05), round
 *    wire glasses, a single-breasted suit; idle clasp (hands behind the back), a slight stoop, head tilted.
 *  - kleene: a deliberately GENERIC 1950s academic (his appearance is not verified, bible §3): receding hair,
 *    no glasses, suit and tie, a stoop; idle pocket (the script's 'rest' is not a signature idle). Seen mostly
 *    from behind at a typewriter; never captioned as a portrait.
 *  - seating-clerk: a small teaching figure (230), not a person: shirtsleeves rolled (the kit's sweaterVest wears 1970s
 *    flared trousers, wrong for a 1950s clerk), pleated trousers, a loose tie, a clipboard as the
 *    seating chart. Hair slicked and browline frames (not Pitts's side part and round wire), so the clerk can
 *    never be read as Pitts returning.
 */
import type { PuppetSpec } from '../../film/contracts';
import { createPuppet } from '../../film/silhouette/puppet';
import { narratorHands } from './sets/narratorHands';

export const SPECS = {
  mcculloch: {
    id: 'mcculloch', height: 330, build: 'average', era: '1940s', wardrobe: 'threePiece', hair: 'messy',
    facialHair: 'fullBeard', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.6, chin: 0.5, jaw: 0.55 },
    prop: 'pen', details: ['waistcoat', 'watchChain', 'lapel', 'tie', 'shirtCuff'],
    signature: { idle: 'think', tilt: -2, chinUp: 2, hairScale: 1.15, rim: true },
  },
  pitts: {
    id: 'pitts', height: 294, build: 'slight', era: '1940s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'round', hat: 'none', profile: { nose: 0.45, brow: 0.62, chin: 0.42, jaw: 0.4 },
    prop: 'papers', details: ['lapel', 'tie', 'shirtCuff'],
    signature: { idle: 'clasp', tilt: 3, stoop: 4, headScale: { x: 1, y: 1.05 }, hairScale: 0.95, rim: true },
  },
  kleene: {
    id: 'kleene', height: 322, build: 'average', era: '1950s', wardrobe: 'suit', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: ['lapel', 'tie', 'shirtCuff'],
    signature: { idle: 'pocket', tilt: 2, stoop: 6, rim: true },
  },
  'seating-clerk': {
    id: 'seating-clerk', height: 230, build: 'slight', era: '1950s', wardrobe: 'rolledSleeves', hair: 'slicked',
    facialHair: 'none', glasses: 'browline', hat: 'none', profile: { nose: 0.5, brow: 0.48, chin: 0.5, jaw: 0.46 },
    prop: 'clipboard', details: ['sleeveGarter', 'shirtCuff'],
    signature: { idle: 'shift', tilt: -3, stoop: 3, rim: true },
  },
} satisfies Record<string, PuppetSpec>;

export type CastId = keyof typeof SPECS;
export const CAST_IDS = Object.keys(SPECS) as CastId[];

export const cast = Object.fromEntries(CAST_IDS.map((id) => [id, createPuppet(SPECS[id])])) as Record<CastId, ReturnType<typeof createPuppet>>;

/** every hand in the film (narrator, red pencil, author + agent at the laptop, viewer): sets/narratorHands.ts */
export const hands = narratorHands;

export type HandId = 'narrator-hands' | 'red-pencil-hand' | 'author-hands' | 'agent-hand' | 'viewer-hand';

/** name cards and roles (from script.json; name cards appear on a real person's first appearance) */
export const CAST_INFO: Record<CastId | HandId, { name: string; role: string; firstAppearance: string; generic?: boolean }> = {
  'narrator-hands': { name: "The tag-keeper's hands", role: 'the unseen narrator\'s two steady hands, a mid-life teacher\'s; they tie, flip, rivet, lift, place, bend and hold up', firstAppearance: 'ch01-s05', generic: true },
  'red-pencil-hand': { name: 'The red pencil', role: 'a single anonymous hand with a red pencil: the film\'s sign for doubt; writes, strikes, rests', firstAppearance: 'ch01-s07', generic: true },
  'author-hands': { name: 'Cheng Lou', role: "Handwired's author and sole commit author; seen only as hands at a laptop", firstAppearance: 'ch03-s01' },
  'agent-hand': { name: 'The coding agent', role: 'a second, paler hand at the same keyboard: the AI coding agents credited on 756 of 825 commits', firstAppearance: 'ch03-s01', generic: true },
  'viewer-hand': { name: "The viewer's open hand", role: 'an open, bare hand rising into the lower third in the last scene', firstAppearance: 'ch12-s06', generic: true },
  mcculloch: { name: 'Warren S. McCulloch', role: 'neurophysiologist and psychiatrist, University of Illinois; co-author of the 1943 logical calculus', firstAppearance: 'ch02-s01' },
  pitts: { name: 'Walter Pitts', role: 'self-taught logician, University of Chicago; co-author of the 1943 paper', firstAppearance: 'ch02-s01' },
  kleene: { name: 'Stephen C. Kleene', role: 'logician at RAND, December 1951; recast nerve nets as finite automata and regular events', firstAppearance: 'ch02-s03' },
  'seating-clerk': { name: 'The clerk with a seating chart', role: 'a teaching figure: assigns photos to rectangles (ch07); walks the JSON strips (ch09)', firstAppearance: 'ch07-s07', generic: true },
};
