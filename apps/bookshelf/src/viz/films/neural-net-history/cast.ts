/**
 * neural-net-history — the cast (story/script.json "cast"), as articulated silhouette puppets.
 *
 *   import { cast, CAST_INFO, hands } from '../cast';
 *   cast.pitts.draw(c, { x, y, facing: 'right', pose }, env);       // feet at (x, y), world space
 *   cast['hinton-young'].draw(c, { x, y, facing: 'left', pose: POSES.sit }, env);
 *   hands.draw(c, { action: 'pin', u, target }, env);                // the detective's hands (sets/narratorHands)
 *
 * Keys are the script's cast ids exactly (quote the hyphenated ones). `narrator-hands` is NOT a
 * puppet: it is the forearm rig in sets/narratorHands.ts, re-exported here as `hands`.
 *
 * Silhouette signatures (style bible §4.4) — respectful, era-correct, never caricature. Profiles stay
 * within 0.35–0.65 of neutral; differences come from wardrobe, hair, glasses, build and height, which
 * read at 64 px. Refinements to the script specs (lead animator, line-up pass), each to keep two
 * people in the same chapter from reading as the same cut-out:
 *  - gerard: double-breasted (vs Pitts's single-breasted, Hebb's rimless glasses).
 *  - hebb: receding hair + rimless lenses, tall and slight (vs Pitts: young, small, round wire).
 *  - mccarthy: a cardigan over a tie, heavy frames; widrow: slim suit, wavy dark hair, browline frames.
 *  - navy-officer: double-breasted service coat + peaked cap (no insignia).
 *  - newsboy: an open shirt (polo cut, no tie) and a cap, child height.
 *  - michie: tall in a slim suit, slicked hair (vs Lighthill: suit, side part, papers).
 *  - rumelhart: sweater vest + beard (vs young Hinton's cardigan, both 1980s).
 *  - sutskever: a plain collared shirt; krizhevsky: a hoodie, seen from behind (both slight, 2010s).
 *  - crowd-worker / labeller: women's cuts (fleeceF, tshirt:f) so the crowd is not all one figure.
 *  - polosukhin: quarter-zip (vs Uszkoreit's T-shirt at the same lunch table).
 * SIGNATURES (review round 1: "Hinton, LeCun, Bengio and Hassabis must read apart at a glance"): every real
 * person carries spec.signature (puppet kit): a posture (stoop / chinUp), a hair mass, and a back-top contour
 * rim on every draw (backlit cut paper), plus 2-3 interior cut lines first in the detail budget.
 *  - Hinton: the tallest figure (342) with a forward stoop (8°: he stands to work), swept-back receding hair (round 4).
 *  - LeCun: a broader, rounder head (headScale 1.2 × 1.1), heavy glasses, a heavier (stocky) build, close
 *    curls, chin up: compact and upright (review round 2).
 *  - Bengio: a big curly hair mass (1.3) and a close-trimmed beard line (beardEdge cut), heavy brow, a slight stoop.
 *  - Hassabis: the shortest of the four (286), close-cropped (hair mass 0.8), upright, blazer.
 * Round 2 (kit): every named puppet (spec.signature) draws a 1.5 px WARM rim on its light-facing edge (pass the
 * shot's key-light direction as o.light; otherwise back-top) and always shows a collar and a sleeve cut.
 * Round 3 (kit + cast, "smooth mannequins"): the rim is 2.5 px at 1080p and 65 % warm (kit floor 2.25-3 px, 60-70 %
 * warm on every edgeRim); jackets cut a lapel notch into the chest line and kick their coat skirt out at the back
 * vent; notch-lapel jackets show a pale shirt V with the tie breaking it (1940s-50s suits now wear ties); shirt cuffs
 * read as pale bands; lenses carry a glint; and every cast member holds a period hand prop (pen, notebook, papers,
 * chalk, mug, laptop or phone; the kit passes it to whichever hand can hold it).
 * Lee Sedol keeps empty hands (the Go stone is a shot prop).
 * Round 4 (kit + cast, "line-ups read as identical mannequins"): every named person carries signature.idle, drawn
 * whenever a shot passes a standing pose (puppet kit: weighted by how close the pose is to POSES.stand, so gestures
 * and walks are untouched): shift (weight on the back leg, the prop carried in a crooked arm), clasp (hands behind the back), think (hand at the chin), glasses
 * (hand at the glasses or temple), fold (arms folded, the prop held to the chest), pocket (near hand at the pocket);
 * and signature.tilt, a head tilt of -4..+4 deg (+ = nod). Line-ups get different idles: ch13-s03/ch13-s04/ch15-s06
 * Hinton shift · Bengio clasp · LeCun fold · Amodei glasses · Altman pocket; ch11-s08 Bender glasses · Gebru shift ·
 * Marcus fold; ch10-s03 Uszkoreit shift · Hans glasses · Kelcey fold · Polosukhin pocket. Hinton's hair is the kit's
 * sweptBack (receding front, combed straight back, fuller behind; period photographs), replacing generic waves.
 */
import type { PuppetSpec } from '../../film/contracts';
import { createPuppet } from '../../film/silhouette/puppet';
import { narratorHands } from './sets/narratorHands';

type Spec = PuppetSpec;

export const SPECS = {
  // ---------------------------------------------------------------- generic figures
  'chat-user': {
    id: 'chat-user', height: 318, build: 'average', era: '2020s', wardrobe: 'quarterZip', hair: 'messy',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.48, brow: 0.45, chin: 0.5, jaw: 0.45 },
    prop: 'mug', details: ['zip', 'rib'],
  },
  newsboy: {
    id: 'newsboy', height: 250, build: 'slight', era: '1950s', wardrobe: 'polo', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'cap', profile: { nose: 0.38, brow: 0.4, chin: 0.42, jaw: 0.38 },
    prop: 'papers', details: [],
  },
  'navy-officer': {
    id: 'navy-officer', height: 328, build: 'average', era: '1950s', wardrobe: 'doubleBreasted', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'cap', profile: { nose: 0.5, brow: 0.55, chin: 0.58, jaw: 0.6 },
    prop: 'papers', details: ['lapel', 'buttons'],
  },
  reporter: {
    id: 'reporter', height: 320, build: 'average', era: '1950s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'fedora', profile: { nose: 0.55, brow: 0.5, chin: 0.48, jaw: 0.5 },
    prop: 'pen', details: [],
  },
  'crowd-worker': {
    id: 'crowd-worker', height: 300, build: 'average', era: '2000s', wardrobe: 'fleeceF', hair: 'ponytail',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.42, brow: 0.3, chin: 0.42, jaw: 0.35 },
    prop: 'mug', details: [],
  },
  labeller: {
    id: 'labeller', height: 300, build: 'average', era: '2020s', wardrobe: 'tshirt:f', hair: 'bun',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.42, brow: 0.3, chin: 0.45, jaw: 0.35 },
    prop: 'laptop', details: [],
  },
  delegate: {
    id: 'delegate', height: 322, build: 'average', era: '2020s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: [],
  },

  // ---------------------------------------------------------------- 1940s
  pitts: {
    id: 'pitts', height: 296, build: 'slight', era: '1940s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'round', hat: 'none', profile: { nose: 0.45, brow: 0.45, chin: 0.42, jaw: 0.4 },
    prop: 'papers', details: ['lapel', 'shirtCuff'],
    signature: { idle: 'shift', tilt: 3, stoop: 6, hairScale: 0.95, rim: true },
  },
  mcculloch: {
    id: 'mcculloch', height: 330, build: 'average', era: '1940s', wardrobe: 'threePiece', hair: 'messy',
    facialHair: 'fullBeard', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.6, chin: 0.5, jaw: 0.55 },
    prop: 'pen', details: ['waistcoat', 'watchChain'],
    signature: { idle: 'fold', tilt: -2, chinUp: 3, hairScale: 1.15, rim: true },
  },
  gerard: {
    id: 'gerard', height: 322, build: 'average', era: '1940s', wardrobe: 'doubleBreasted', hair: 'receding',
    facialHair: 'none', glasses: 'round', hat: 'none', profile: { nose: 0.52, brow: 0.55, chin: 0.52, jaw: 0.55 },
    prop: 'pen', details: ['lapel', 'buttons'],
    signature: { idle: 'clasp', tilt: 2, rim: true },
  },
  hebb: {
    id: 'hebb', height: 330, build: 'slight', era: '1940s', wardrobe: 'suit', hair: 'receding',
    facialHair: 'none', glasses: 'rimless', hat: 'none', profile: { nose: 0.55, brow: 0.5, chin: 0.48, jaw: 0.42 },
    prop: 'book', details: ['lapel'],
    signature: { idle: 'glasses', tilt: 1, stoop: 3, rim: true },
  },

  // ---------------------------------------------------------------- 1950s
  turing: {
    id: 'turing', height: 326, build: 'average', era: '1950s', wardrobe: 'blazer', hair: 'messy',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.55, chin: 0.5, jaw: 0.5 },
    prop: 'chalk', details: [],
    signature: { idle: 'pocket', tilt: 3, stoop: 4, hairScale: 1.1, rim: true },
  },
  minsky: {
    id: 'minsky', height: 312, build: 'slight', era: '1950s', wardrobe: 'rolledSleeves', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.45, jaw: 0.45 },
    prop: 'chalk', details: [],
    signature: { idle: 'fold', tilt: -2, chinUp: 2, rim: true },
  },
  mccarthy: {
    id: 'mccarthy', height: 322, build: 'average', era: '1950s', wardrobe: 'cardigan', hair: 'sidePart',
    facialHair: 'none', glasses: 'heavy', hat: 'none', profile: { nose: 0.48, brow: 0.5, chin: 0.52, jaw: 0.5 },
    prop: 'pen', details: [],
    signature: { idle: 'glasses', tilt: -3, rim: true },
  },
  widrow: {
    id: 'widrow', height: 324, build: 'average', era: '1950s', wardrobe: 'slimSuit', hair: 'waves',
    facialHair: 'none', glasses: 'browline', hat: 'none', profile: { nose: 0.52, brow: 0.5, chin: 0.55, jaw: 0.55 },
    prop: 'pen', details: ['lapel', 'shirtCuff'],
    signature: { idle: 'clasp', tilt: 2, chinUp: 2, rim: true },
  },
  rosenblatt: {
    id: 'rosenblatt', height: 322, build: 'slight', era: '1950s', wardrobe: 'shortSleeve', hair: 'slicked',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.45, chin: 0.5, jaw: 0.45 },
    prop: 'cards', details: ['placket', 'crease'],
    signature: { idle: 'shift', tilt: -3, chinUp: 4, hairScale: 1.05, rim: true },
  },

  // ---------------------------------------------------------------- 1960s–70s
  'minsky-1960s': {
    id: 'minsky-1960s', height: 312, build: 'slight', era: '1960s', wardrobe: 'turtleneck', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.55, chin: 0.45, jaw: 0.45 },
    prop: 'chalk', details: [],
    signature: { idle: 'think', tilt: 2, stoop: 2, rim: true },
  },
  papert: {
    id: 'papert', height: 326, build: 'average', era: '1960s', wardrobe: 'blazer', hair: 'shaggy',
    facialHair: 'fullBeard', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.55, chin: 0.5, jaw: 0.5 },
    prop: 'book', details: [],
    signature: { idle: 'fold', tilt: -1, hairScale: 1.2, rim: true },
  },
  lighthill: {
    id: 'lighthill', height: 326, build: 'average', era: '1970s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.55, chin: 0.55, jaw: 0.52 },
    prop: 'papers', details: [],
    signature: { idle: 'clasp', tilt: -3, chinUp: 2, rim: true },
  },
  michie: {
    id: 'michie', height: 340, build: 'tall', era: '1970s', wardrobe: 'slimSuit', hair: 'slicked',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.5, chin: 0.48, jaw: 0.45 },
    prop: 'papers', details: [],
    signature: { idle: 'pocket', tilt: 2, chinUp: 1, rim: true },
  },

  // ---------------------------------------------------------------- 1980s
  'hinton-young': {
    id: 'hinton-young', height: 340, build: 'tall', era: '1980s', wardrobe: 'cardigan', hair: 'messy',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.5, chin: 0.5, jaw: 0.48 },
    prop: 'pen', details: ['collar', 'crease'],
    signature: { idle: 'think', tilt: 3, stoop: 6, hairScale: 1.08, rim: true },
  },
  hopfield: {
    id: 'hopfield', height: 338, build: 'tall', era: '1980s', wardrobe: 'suit', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.52, jaw: 0.45 },
    prop: 'chalk', details: [],
    signature: { idle: 'clasp', tilt: 1, stoop: 2, rim: true },
  },
  rumelhart: {
    id: 'rumelhart', height: 322, build: 'average', era: '1980s', wardrobe: 'sweaterVest', hair: 'sidePart',
    facialHair: 'beard', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.52, chin: 0.5, jaw: 0.55 },
    prop: 'chalk', details: [],
    signature: { idle: 'shift', tilt: -2, rim: true },
  },
  lenat: {
    id: 'lenat', height: 322, build: 'average', era: '1980s', wardrobe: 'rolledSleeves', hair: 'curly',
    facialHair: 'beard', glasses: 'heavy', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.55 },
    prop: 'cards', details: [],
    signature: { idle: 'fold', tilt: -3, hairScale: 1.12, rim: true },
  },
  fodor: {
    id: 'fodor', height: 320, build: 'average', era: '1980s', wardrobe: 'blazer', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.55, chin: 0.48, jaw: 0.5 },
    prop: 'book', details: [],
    signature: { idle: 'think', tilt: 2, rim: true },
  },
  pylyshyn: {
    id: 'pylyshyn', height: 320, build: 'average', era: '1980s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'heavy', hat: 'none', profile: { nose: 0.48, brow: 0.5, chin: 0.52, jaw: 0.5 },
    prop: 'papers', details: [],
    signature: { idle: 'glasses', tilt: -1, rim: true },
  },

  // ---------------------------------------------------------------- 1990s–2000s
  lecun: {
    id: 'lecun', height: 322, build: 'stocky', era: '1990s', wardrobe: 'polo', hair: 'curly',
    facialHair: 'none', glasses: 'heavy', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.56, jaw: 0.6 },
    prop: 'pen', details: ['shirtCollar', 'armSeam'],
    signature: { idle: 'fold', tilt: -2, chinUp: 4, hairScale: 0.8, headScale: { x: 1.2, y: 1.1 }, rim: true },
  },
  vapnik: {
    id: 'vapnik', height: 320, build: 'stocky', era: '1990s', wardrobe: 'suit', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.58, chin: 0.55, jaw: 0.6 },
    prop: 'chalk', details: [],
    signature: { idle: 'clasp', tilt: 3, stoop: 3, rim: true },
  },
  jackel: {
    id: 'jackel', height: 322, build: 'average', era: '1990s', wardrobe: 'blazer', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.48, brow: 0.48, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: [],
    signature: { idle: 'pocket', tilt: -2, rim: true },
  },
  hochreiter: {
    id: 'hochreiter', height: 322, build: 'average', era: '1990s', wardrobe: 'polo', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.5, chin: 0.48, jaw: 0.48 },
    prop: 'pen', details: [],
    signature: { idle: 'think', tilt: 1, rim: true },
  },
  bengio: {
    id: 'bengio', height: 316, build: 'average', era: '2000s', wardrobe: 'fleece', hair: 'curly',
    facialHair: 'beard', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.65, chin: 0.5, jaw: 0.5 },
    prop: 'pen', details: ['collar', 'armSeam', 'beardEdge', 'curls'],
    signature: { idle: 'clasp', tilt: 3, stoop: 3, hairScale: 1.3, rim: true },
  },
  li: {
    id: 'li', height: 300, build: 'slight', era: '2000s', wardrobe: 'trouserSuit', hair: 'long',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.4, brow: 0.3, chin: 0.42, jaw: 0.35 },
    prop: 'clipboard', details: [],
    signature: { idle: 'fold', tilt: -2, chinUp: 2, rim: true },
  },

  // ---------------------------------------------------------------- 2010s
  hinton: {
    id: 'hinton', height: 342, build: 'tall', era: '2010s', wardrobe: 'blazer', hair: 'sweptBack',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.55, brow: 0.5, chin: 0.5, jaw: 0.48 },
    prop: 'laptop', details: ['shirtCollar', 'crease', 'armSeam'],
    signature: { idle: 'shift', tilt: 2, stoop: 8, hairScale: 1.06, rim: true },
  },
  sutskever: {
    id: 'sutskever', height: 318, build: 'slight', era: '2010s', wardrobe: 'polo', hair: 'receding',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.55, chin: 0.48, jaw: 0.45 },
    prop: 'papers', details: [],
    signature: { idle: 'think', tilt: -2, stoop: 2, rim: true },
  },
  krizhevsky: {
    id: 'krizhevsky', height: 318, build: 'slight', era: '2010s', wardrobe: 'hoodie', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.48, brow: 0.48, chin: 0.48, jaw: 0.45 },
    prop: 'laptop', details: [],
    signature: { idle: 'pocket', tilt: 3, stoop: 5, rim: true },
  },
  hassabis: {
    id: 'hassabis', height: 286, build: 'slight', era: '2010s', wardrobe: 'blazer', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.45, brow: 0.5, chin: 0.48, jaw: 0.45 },
    prop: 'pen', details: ['shirtCollar', 'armSeam', 'crease'],
    signature: { idle: 'clasp', tilt: -2, chinUp: 2, hairScale: 0.8, headScale: 0.96, rim: true },
  },
  'lee-sedol': {
    id: 'lee-sedol', height: 312, build: 'average', era: '2010s', wardrobe: 'suit', hair: 'bob',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.45, brow: 0.5, chin: 0.48, jaw: 0.5 },
    prop: 'none', details: [],
    signature: { idle: 'think', tilt: 4, stoop: 4, rim: true },
  },
  uszkoreit: {
    id: 'uszkoreit', height: 338, build: 'tall', era: '2010s', wardrobe: 'tshirt', hair: 'messy',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.52, brow: 0.5, chin: 0.52, jaw: 0.5 },
    prop: 'mug', details: [],
    signature: { idle: 'shift', tilt: 2, rim: true },
  },
  'hans-uszkoreit': {
    id: 'hans-uszkoreit', height: 318, build: 'average', era: '2010s', wardrobe: 'cardigan', hair: 'receding',
    facialHair: 'none', glasses: 'rimless', hat: 'none', profile: { nose: 0.52, brow: 0.55, chin: 0.5, jaw: 0.5 },
    prop: 'book', details: [],
    signature: { idle: 'glasses', tilt: 3, stoop: 3, rim: true },
  },
  kelcey: {
    id: 'kelcey', height: 320, build: 'average', era: '2010s', wardrobe: 'hoodie', hair: 'crewCut',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.52 },
    prop: 'laptop', details: [],
    signature: { idle: 'fold', tilt: -2, rim: true },
  },
  polosukhin: {
    id: 'polosukhin', height: 322, build: 'average', era: '2010s', wardrobe: 'quarterZip', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.48, chin: 0.5, jaw: 0.5 },
    prop: 'mug', details: [],
    signature: { idle: 'pocket', tilt: 1, rim: true },
  },

  // ---------------------------------------------------------------- 2020s
  'amodei-dario': {
    id: 'amodei-dario', height: 320, build: 'average', era: '2020s', wardrobe: 'quarterZip', hair: 'curly',
    facialHair: 'none', glasses: 'rectangular', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: [],
    signature: { idle: 'glasses', tilt: 2, stoop: 2, hairScale: 1.1, rim: true },
  },
  bender: {
    id: 'bender', height: 302, build: 'average', era: '2020s', wardrobe: 'cardiganF', hair: 'long',
    facialHair: 'none', glasses: 'rimless', hat: 'none', profile: { nose: 0.42, brow: 0.3, chin: 0.45, jaw: 0.35 },
    prop: 'book', details: [],
    signature: { idle: 'glasses', tilt: -1, rim: true },
  },
  gebru: {
    id: 'gebru', height: 302, build: 'average', era: '2020s', wardrobe: 'blouseTrousers', hair: 'curly',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.42, brow: 0.32, chin: 0.42, jaw: 0.35 },
    prop: 'papers', details: [],
    signature: { idle: 'shift', tilt: 2, hairScale: 1.15, rim: true },
  },
  marcus: {
    id: 'marcus', height: 320, build: 'average', era: '2020s', wardrobe: 'blazer', hair: 'curly',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.52, chin: 0.48, jaw: 0.5 },
    prop: 'book', details: [],
    signature: { idle: 'fold', tilt: -3, chinUp: 2, rim: true },
  },
  altman: {
    id: 'altman', height: 306, build: 'slight', era: '2020s', wardrobe: 'quarterZip', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.45, brow: 0.45, chin: 0.48, jaw: 0.45 },
    prop: 'phone', details: [],
    signature: { idle: 'pocket', tilt: -1, rim: true },
  },
  'lecun-2020s': {
    id: 'lecun-2020s', height: 322, build: 'stocky', era: '2020s', wardrobe: 'blazer', hair: 'curly',
    facialHair: 'none', glasses: 'heavy', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.56, jaw: 0.6 },
    prop: 'pen', details: ['shirtCollar', 'armSeam', 'crease'],
    signature: { idle: 'fold', tilt: -2, chinUp: 4, hairScale: 0.82, headScale: { x: 1.2, y: 1.1 }, rim: true },
  },
  'bengio-2020s': {
    id: 'bengio-2020s', height: 316, build: 'average', era: '2020s', wardrobe: 'blazer', hair: 'curly',
    facialHair: 'beard', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.65, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: ['shirtCollar', 'armSeam', 'beardEdge', 'curls'],
    signature: { idle: 'clasp', tilt: 3, stoop: 4, hairScale: 1.32, rim: true },
  },
  liang: {
    id: 'liang', height: 320, build: 'average', era: '2020s', wardrobe: 'suit', hair: 'sidePart',
    facialHair: 'none', glasses: 'none', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 },
    prop: 'papers', details: [],
    signature: { idle: 'clasp', tilt: 1, rim: true },
  },
} satisfies Record<string, Spec>;

export type CastId = keyof typeof SPECS;
export const CAST_IDS = Object.keys(SPECS) as CastId[];

export const cast = Object.fromEntries(CAST_IDS.map((id) => [id, createPuppet(SPECS[id])])) as Record<CastId, ReturnType<typeof createPuppet>>;

/** the detective's two cuffed forearms (script cast id `narrator-hands`): see sets/narratorHands.ts */
export const hands = narratorHands;

/** name cards and roles (from script.json; name cards appear on a real person's first appearance) */
export const CAST_INFO: Record<CastId | 'narrator-hands', { name: string; role: string; firstAppearance: string; generic?: boolean }> = {
  "narrator-hands": { name: "The detective's hands (narrator rig)", role: "the unseen narrator's two steady, cuffed hands (a mid-life teacher's, never an old man's): the only part of the detective ever shown; they do most of the film's acting at the Case Board, the candle shelf, the Wall of Forecasts and the manila file", firstAppearance: "ch01-s04", generic: true },
  "chat-user": { name: "A person at a desk (anonymous)", role: "generic 2020s user of the chat box; never a real person", firstAppearance: "ch01-s01", generic: true },
  newsboy: { name: "Newspaper boy", role: "generic 1958 newsboy running the headline", firstAppearance: "ch03-s02", generic: true },
  "navy-officer": { name: "Naval officer", role: "generic officer at the 1958 demonstration", firstAppearance: "ch03-s01", generic: true },
  reporter: { name: "Reporter", role: "generic 1958 press reporter", firstAppearance: "ch03-s01", generic: true },
  "crowd-worker": { name: "Crowd worker", role: "generic labeller at a home computer (ImageNet, 2008–10)", firstAppearance: "ch07-s03", generic: true },
  labeller: { name: "Labeller", role: "generic contractor comparing two answers (2022)", firstAppearance: "ch12-s02", generic: true },
  delegate: { name: "Delegate", role: "generic official at a lectern (either shore, drawn identically)", firstAppearance: "ch14-s02", generic: true },
  pitts: { name: "Walter Pitts", role: "self-taught logician; co-author of the 1943 neuron paper at about 19–20", firstAppearance: "ch02-s01" },
  mcculloch: { name: "Warren McCulloch", role: "neurophysiologist and psychiatrist, Chicago; co-author of the 1943 paper", firstAppearance: "ch02-s01" },
  gerard: { name: "Ralph Gerard", role: "Chicago neurophysiologist; the analog dissent at the Macy conferences", firstAppearance: "ch02-s04" },
  hebb: { name: "Donald Hebb", role: "McGill psychologist; the 1949 learning postulate", firstAppearance: "ch02-s05" },
  turing: { name: "Alan Turing", role: "mathematician, Manchester; the imitation game and the 'child machine' (1950)", firstAppearance: "ch02-s05b" },
  minsky: { name: "Marvin Minsky (young)", role: "builder of SNARC (1951); Dartmouth co-proposer; later symbolic AI", firstAppearance: "ch02-s07" },
  mccarthy: { name: "John McCarthy", role: "Dartmouth organiser; coined 'artificial intelligence'", firstAppearance: "ch02-s07" },
  widrow: { name: "Bernard Widrow", role: "Stanford engineer; ADALINE and the LMS rule; sat in at Dartmouth in 1956", firstAppearance: "ch02-s07" },
  rosenblatt: { name: "Frank Rosenblatt", role: "Cornell psychologist; the perceptron and the Mark I", firstAppearance: "ch03-s01" },
  "minsky-1960s": { name: "Marvin Minsky", role: "MIT; co-author of Perceptrons (1969); 1969 Turing Award", firstAppearance: "ch04-s02" },
  papert: { name: "Seymour Papert", role: "MIT mathematician; co-author of Perceptrons", firstAppearance: "ch04-s02" },
  lighthill: { name: "Sir James Lighthill", role: "Cambridge applied mathematician; the 1972 survey for Britain's Science Research Council", firstAppearance: "ch04-s06" },
  michie: { name: "Donald Michie", role: "Edinburgh machine-intelligence pioneer; argued against Lighthill on television (1973)", firstAppearance: "ch04-s06" },
  "hinton-young": { name: "Geoffrey Hinton (1970s–1990s)", role: "the persister: Sussex 1976, San Diego, Cambridge, Carnegie Mellon, Toronto from 1987", firstAppearance: "ch04-s08" },
  hopfield: { name: "John Hopfield", role: "physicist (Caltech); the Hopfield network; 2024 Nobel laureate", firstAppearance: "ch05-s01" },
  rumelhart: { name: "David Rumelhart", role: "UCSD psychologist; first author of the 1986 backprop paper", firstAppearance: "ch05-s04" },
  lenat: { name: "Douglas Lenat", role: "founder of Cyc (MCC, Austin, 1984)", firstAppearance: "ch05-s08" },
  fodor: { name: "Jerry Fodor", role: "philosopher; co-author of the 1988 systematicity critique", firstAppearance: "ch05-s10" },
  pylyshyn: { name: "Zenon Pylyshyn", role: "cognitive scientist; co-author of the 1988 critique", firstAppearance: "ch05-s10" },
  lecun: { name: "Yann LeCun (1990s)", role: "Bell Labs, Holmdel; convolutional networks, ZIP codes and the check reader", firstAppearance: "ch06-s01" },
  vapnik: { name: "Vladimir Vapnik", role: "statistical learning theory; support vector machines (Bell Labs)", firstAppearance: "ch06-s03" },
  jackel: { name: "Larry Jackel", role: "head of Bell Labs' Adaptive Systems Research Department; the 1995 bet", firstAppearance: "ch06-s05" },
  hochreiter: { name: "Sepp Hochreiter", role: "found vanishing gradients (1991); co-invented the LSTM (1997); praised the Transformer poster (2017)", firstAppearance: "ch06-s06" },
  bengio: { name: "Yoshua Bengio (2000s)", role: "Université de Montréal; the patient holdout", firstAppearance: "ch06-s04" },
  hinton: { name: "Geoffrey Hinton (2000s–2020s)", role: "Toronto; 2006 deep nets; AlexNet supervisor; left Google in 2023; 2024 Nobel laureate", firstAppearance: "ch07-s02" },
  li: { name: "Fei-Fei Li", role: "created ImageNet (Princeton, then Stanford)", firstAppearance: "ch07-s03" },
  sutskever: { name: "Ilya Sutskever (2010s)", role: "AlexNet co-author; believed performance would scale with data", firstAppearance: "ch08-s02" },
  krizhevsky: { name: "Alex Krizhevsky", role: "AlexNet's first author; wrote the GPU code", firstAppearance: "ch08-s02" },
  hassabis: { name: "Demis Hassabis", role: "DeepMind co-founder; 'the face of AlphaGo' in Seoul; 2024 Chemistry Nobel", firstAppearance: "ch09-s03" },
  "lee-sedol": { name: "Lee Sedol", role: "9-dan Go professional; won game 4 with move 78", firstAppearance: "ch09-s03" },
  uszkoreit: { name: "Jakob Uszkoreit", role: "Google; proposed replacing recurrence with self-attention", firstAppearance: "ch10-s03" },
  "hans-uszkoreit": { name: "Hans Uszkoreit", role: "computational linguist; Jakob's father, who doubted the idea at the dinner table", firstAppearance: "ch10-s03" },
  kelcey: { name: "Mat Kelcey", role: "Google colleague who doubted self-attention would work", firstAppearance: "ch10-s03" },
  polosukhin: { name: "Illia Polosukhin", role: "Transformer co-author; left early in 2017", firstAppearance: "ch10-s03" },
  "amodei-dario": { name: "Dario Amodei", role: "co-founder and CEO of Anthropic", firstAppearance: "ch13-s03" },
  bender: { name: "Emily M. Bender", role: "University of Washington linguist; the octopus; co-led 'Stochastic Parrots'", firstAppearance: "ch11-s08" },
  gebru: { name: "Timnit Gebru", role: "Ethical AI co-lead at Google; 'Stochastic Parrots'; founded DAIR", firstAppearance: "ch11-s08" },
  marcus: { name: "Gary Marcus", role: "cognitive scientist; critic of pure deep learning", firstAppearance: "ch11-s08" },
  altman: { name: "Sam Altman", role: "OpenAI chief executive; a lab head who signed the May 2023 extinction-risk statement", firstAppearance: "ch13-s03" },
  "lecun-2020s": { name: "Yann LeCun (2020s)", role: "the leading dissenter on doom and on language models as the road", firstAppearance: "ch13-s04" },
  "bengio-2020s": { name: "Yoshua Bengio (2020s)", role: "chair of the International AI Safety Report; second signatory of the 2023 statement", firstAppearance: "ch13-s03" },
  liang: { name: "Liang Wenfeng", role: "founder of DeepSeek (Hangzhou)", firstAppearance: "ch14-s04" },
};
