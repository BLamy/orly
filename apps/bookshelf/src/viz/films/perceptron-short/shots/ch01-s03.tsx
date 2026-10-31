/**
 * ch01-s03 — inside the machine's mind: a lantern-lit theatre of photocells (candleAmber, iris in),
 * then the bookend back in the night lab (labGreen) and the film's fade to black.
 *
 * The perceptron teaching machine (sets/ch01-s03-mind.ts), captioned in era type as "an illustration,
 * simplified" (only after the planted question, L0105, has landed), stands on a small stage in a dark proscenium. Everything it shows is the REAL record
 * trainFromRandom({ seed: 911, wSeed: 13 }) (sets/ch01-s03-mind-init.ts; horizontal vs vertical bars; the perceptron rule on mistakes only):
 *   try 1  a horizontal bar lands on "shape" (a dim 'answer: horizontal' tag under the retina while it is
 *          up); on "Each lit cell" its threads fire through the patch tangle into the dials; over "tugs the
 *          needle through the dials it feeds" pulses run from the dials into the response unit and the needle steps
 *          with the running total (bias right, then the pulses left, to −39°); on "total" the threshold mark
 *          brightens into a line labelled 'threshold' (claim mk1-sum), and on "decides" the needle sits on
 *          its VERTICAL side and the answer lights. On "wrong" the needle shudders and the wick gutters
 *          out (an unlit, dark-amber lantern); on "nudge" the camera pushes ≈1.2× onto the dial bank (landing on "say", easing back by
 *          "answer"): the untouched dials dim to ≈40%, and each dial fed by a lit cell sweeps a translucent
 *          wedge from its old setting to its new one, under a thick pointer and an arc arrow
 *   try 2  vertical → HORIZONTAL, verdict on "Wrong"   try 3  horizontal → VERTICAL, on "wrong" (#2)
 *   try 4  a vertical bar lands on "suddenly"; the needle swings into VERTICAL, the lantern flares on "right"
 *   try 5  in the clear air after "right": a horizontal bar → HORIZONTAL (try 1's needle flashes, dashed, on
 *          VERTICAL as it settles); its caption ("now") holds over try 1's ("then") on a frozen plate
 * From try 3 on, the last try with the same shape leaves a dashed, labelled ghost needle (try 3 over try 1,
 * try 4 over try 2, try 5 over try 1), so the needle visibly lands closer to, then across, the threshold. A
 * five-chip try tally under the retina fills ✗ ✗ ✗ ✓ ✓ on the verdict words; the tag under the retina reads
 * "correct answer: …" and holds through each try's verdict and nudge, while a faint dashed tick on the
 * meter's correct side marks the target the nudged dials push toward. Each part's header leaves ≈2.2 s
 * after its word (at most three labels on screen). A wrong verdict leaves the lantern unlit, dark amber. The camera sits high and ≈8% in, the apron and footlights along the bottom edge,
 * curtain hems pooled in the bottom corners (a sharp near plane) and a haze band between arcade and machine.
 * A slow ≈45 px drift runs from "Each" to "total"; a mirrored drape on the left frames the stage.
 * Verdict captions land 0.1 s before their word (the verdict in roman small caps) and clear before the next
 * shape comes. Try 5 freezes after its verdict (no lit cell changes after it) and its caption holds to the
 * start of L0108. On "It could learn" the answer is spent (caption out, needle back to the mark, lantern
 * idle, and the retina's cells and threads go idle with the dials' learned settings dimmed); on "simple" the
 * two learned shapes stand on two separate plates, tagged VERTICAL / HORIZONTAL, under 'what it could
 * learn: simple patterns'. From "In" the era stamp '1969 · MINSKY & PAPERT, Perceptrons' (the title in
 * italic) types on at the TOP of the frame, a closed book standing on a small shelf beside it from
 * "Minsky". On "showed just how simple" the plates slide left and the LIMIT is shown: a separate two-cell
 * XOR mini machine (sets/ch01-s03-xor.ts) runs Rosenblatt's rule for real and never settles (✓ ✗ ✓ ✗ ✓ ✗
 * ✗ …, its pip never flares); on "years" the stage dims a clear notch while it keeps flickering. From
 * "faded" the K3 push and the iris close on the lantern, whose glow match-dissolves into the camera-box
 * eye in the night lab of ch01-s02, open by "Its"; over "descendants … networks" three faint stacked
 * layers (claim lineage-mlp) glow in the window light behind the eye, gone before "still". The camera
 * pulls back over ≈3.5 s (then a slow ~3% drift) while the title returns small: desk – lit stimulus card –
 * eye – man – racks (the racks AWAKE, their dial faces showing, as s02 left them). Rosenblatt stands against
 * the backlit blinds between the eye and the plugboard (a clear sliver of window light between his profile
 * and the camera box), facing LEFT, eyeline a little down onto the eye's lit bar, breathing; on "mistakes" he lowers it and tips his head toward the
 * eye's lit bar, then holds; the fade to black starts about 1.2 s after "mistakes" and ends on the last frame.
 * Every beat is anchored to the word timings (T.word / T.beat); the schedule keeps keys monotone.
 *
 * Round-1 revision: the kit iris opens on the retina at frame centre (camera KR), pulling back to the whole
 * machine by "tugs"; a warm wash behind the retina silhouettes the housing and uprights as ink; the gauge
 * comes up before its strings; a slow push toward the needle and lantern from "total" to "right" (KP), a
 * pull-back over L0108; a low fog sheet at footlight height. The try row shows each try's SHAPE and verdict
 * (H ✗ V ✗ H ✗ V ✓ on "right", flashing); no answer tag on right tries. The era stamp reads exactly
 * "1969 · Perceptrons · Minsky & Papert". When the XOR plate (no words) arrives the machine drops to ≈35%,
 * the cards to half and the lantern goes out; "years" steps the lights down ≈25%. Bookend: three cut-paper
 * network panels grow left to right (L3, L2, L2) on "descendants", "today's", "networks"; Rosenblatt in ink
 * presents toward the eye with an open palm; the maker's plate is unlettered.
 * Round-4 revision (re-anchored by word to the re-locked clock): the entry truck lands by "guesses" with the
 * needle trembling undecided at the threshold until the tugs commit it; the try-5 caption is one plate (NOW over
 * THEN, tags inside, ≥16 px clear of the try row); the LIMIT is shown again on "showed just how simple": the
 * learned plates slide left at half value, the gauge's labels fade, and the real trainXor() plate fills ≈40% of
 * the frame ('XOR · one lit, not both' / 'one layer of dials', two-dot case glyphs in every try box, 'never
 * settles · best: n of 4' from "simple"); the closed book stands beside the stamp at the top; "years" steps the
 * key down ≈28% over 0.3 s and adds '→ the 1970s' under the stamp; the iris starts on "faded". The lineage grows
 * out of the eye: 1-, 2- and 3-layer silhouettes fanned behind the camera box (no window plaques).
 * Round-1 critic revision (this pass): the XOR plate carries no captions, only the word 'XOR' (no 'best: n of 4',
 * which read as the unit's ceiling); no '→ the 1970s'; the stamp, its plate and the book's shelf are gone by
 * "descendants" − 0.6 so the dissolve lands in clean labGreen; the bookend pull-back runs ≈4.5 s from just after
 * "descendants" to the end of "mistakes" (log-scale, ease.move); the lineage panels clear by "still" − 0.4; one
 * caption face (the era typewriter) with the small-caps serif kept for the gauge (VERTICAL / HORIZONTAL /
 * THRESHOLD); feathered plates under 'an illustration, simplified' and 'what it could learn'; depth: the arcade
 * and the lanterns pushed back into haze and a blurred near footlight rail under the proscenium's velvet edges.
 */
import { Timeline, ease } from '../../../core';
import { FONT, actionScale, arcade, boardFloor, cam3Interp, defineShot, makeCanvas, mixLab, overscan, paperLantern, softPlate, tasselFringe, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec, PaintEnv, Palette, Pose, Rect } from '../../../film';
import { LAYERS } from '../../../film/contracts';
import { MOODS } from '../../../film/silhouette/palette';
import { toLayer } from '../../../film/core/multiplane';
import { MIND_RUN, mindGeo, mindMachine, needleAt, phaseOf } from '../sets/ch01-s03-mind';
import { XOR_RUN, XOR_W, xorMini } from '../sets/ch01-s03-xor';
import { TASK, TASK_NAMES } from '../../../film/silhouette/metaphors/perceptronMath';
import { MK, RACK_VEIL, REST_WEIGHTS, SET_RIM, cellAt, drawMachine } from '../sets/ch01-s02-machine';
import { eyeBox } from '../sets/ch01-s01-eye';
import { nightDesk, nightLab, nightVignette } from '../sets/ch01-s01-nightlab';
import { labHaze } from '../sets/lab';
import { ROSENBLATT_SCALE, ROSE_POSES, breath, rosenblattSuit } from '../sets/ch01-s02-rosenblatt';
import { addPose, blendPose, withLife } from '../../../film';

// ---------------------------------------------------------------- staging
/** the machine's box on the action plane (geometry scales with w/1280) */
const BOX = { x: 78, y: 34, w: 1150, h: 647 };
const FLOOR_Y = BOX.y + BOX.h * 0.8; // where the machine's stands meet the stage
const G = mindGeo(BOX);
const LANTERN = G.lantern;
const RACK = { x: G.knobs.x + G.knobs.w / 2, y: G.knobs.y + G.knobs.h / 2 };
const RUN = MIND_RUN;

const STAGE: LayerSpec = { id: 'stage', z: 1150, haze: 0.04, blur: 0 };
// round-1 critic (depth): the arcade sits further back in the air (more haze), the hanging lanterns on their own
// farther, hazier, softer plane, and a blurred near footlight rail with a curtain edge in front of the apron, so
// the machine is the one sharp plane of a theatre, not a diagram on a wall
const BACK: LayerSpec = { id: 'backstage', z: 1800, haze: 0.36, blur: 1.8 };
const FLY: LayerSpec = { id: 'fliesBack', z: 1600, haze: 0.4, blur: 1.35 };
const RAIL: LayerSpec = { id: 'footRail', z: 470, haze: 0, blur: 5 };
const DRAPE: LayerSpec = { id: 'drapeR', z: 1250, haze: 0.04, blur: 1 };
const NEAR: LayerSpec = { id: 'curtainNear', z: 420, haze: 0, blur: 3.5 };
/** a sharp near proscenium plane: the curtain hems pooled in the bottom corners and the apron's dark edge */
const PROSC: LayerSpec = { id: 'proscNear', z: 600, haze: 0, blur: 0.8 };

const kz = (k: number) => 1000 - 1000 / k;
/** wide: retina, tangle, dials, needle and lantern all in frame; the camera sits high and ≈8% in, so the
 * machine fills the frame and the empty stage floor is cropped */
const K0: Camera3 = { x: 656, y: 326, z: kz(1.03), lens: 1 };
const K1: Camera3 = { x: 648, y: 332, z: kz(1.08), lens: 1 };
/** "tugs" → "total": a slow drift down and right (≈45 px) with a slight push, so the explanation is not a
 * static board */
const KT: Camera3 = { x: 660, y: 362, z: kz(1.05), lens: 1 };
/** the nudge: a small push (clamped so the whole retina, its tag and both gauge labels stay ≥ 24 px inside
 * the frame: the board spans world x ≈ 107…1185, so 1.12× centred on x 646 is the most it can take) */
const KN: Camera3 = { x: 656, y: 342, z: kz(1.06), lens: 1 };
/** L0108: the answer spent, the camera pulls back to the whole stage for the limit */
const K2: Camera3 = { x: 646, y: 334, z: kz(1.06), lens: 1 };
/** the retina's centre (L4 world) */
const RET_C = { x: G.retina.x + G.retina.size / 2, y: G.retina.y + G.retina.size / 2 };
/** the kit's iris (frame-centred) opens on the retina, as ch01-s02's closed on the eye: the camera starts
 * close on it and pulls back to the whole machine by "tugs" (review round 1) */
const KR: Camera3 = { x: RET_C.x, y: RET_C.y, z: kz(1.3), lens: 1 };
/** "total" → "right": the slow push toward the needle and the lantern, as far as the frame can go with the
 * retina's cells, its tag and the try row still in (the board spans world x ≈ 107…1185) */
// round-1 critic: pulled back ≈10% and centred on the board (world x ≈ 120…1192), so the retina, the dial bank,
// the gauge with both its labels and the lantern all sit inside the 90% safe area on "right"
const KP: Camera3 = { x: 656, y: 352, z: kz(1.05), lens: 1 };
/** the iris out (round-1 critic): it closes on the RETINA, the camera easing back a touch; the bookend's
 * first framing (LAB0) puts the camera-box eye's photocell grid exactly where the retina's grid is left on
 * screen, at its scale, so the dissolve is a true match (grid onto grid) */
const K3: Camera3 = { x: 600, y: 340, z: kz(0.95), lens: 1 };
const K3k = 0.95;
/** the retina at K3: screen centre and width */
const RET_END = { x: 640 + (G.retina.x + G.retina.size / 2 - K3.x) * K3k, y: 360 + (G.retina.y + G.retina.size / 2 - K3.y) * K3k, w: G.retina.size * K3k };
const CAMS = [KR, K0, K1, KT, KN, KP, K2, K3];

// the bookend: the s02 lab at night (L4 world of sets/ch01-s02-machine)
const EYE = MK.EYE;
const zFor = (k: number) => 1000 - 1000 / k;
/** opens with the eye's photocell grid where the retina's grid was left (RET_END: same screen centre and
 * width; the extra scale is a lens zoom, so no near plane passes the camera), then pulls back */
const EYE_GRID = (() => {
  const a = cellAt(0, 0);
  const b = cellAt(19, 19);
  const w = ((cellAt(0, 19).x - a.x) * 20) / 19;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, w };
})();
const LAB0: Camera3 = (() => {
  const k = RET_END.w / EYE_GRID.w;
  const z = zFor(1.55);
  return { x: EYE_GRID.x - (RET_END.x - 640) / k, y: EYE_GRID.y - (RET_END.y - 360) / k, z, lens: k / 1.55 };
})();
const LAB1: Camera3 = { x: 500, y: 380, z: zFor(1.0), lens: 1 };
/** a slow ~3% dolly back across the hold, then still into the fade */
const LAB2: Camera3 = { x: 512, y: 378, z: zFor(0.97), lens: 1 };
const LAB_CAMS = [LAB0, LAB1, LAB2];
/** round-1 critic (camera): the bookend pull-back, re-eased. It starts just after "descendants" (the night lab
 * holds the eye's grid where the retina's was through the dissolve), runs ≈4.5 s with ease.move and settles as
 * "mistakes" ends; the SCALE is interpolated in log space and the position perspective-correctly (in 1/k), so
 * the eye shrinks at an even rate instead of whipping out in the first two seconds. Then the slow ≈3% drift
 * (LAB1 → LAB2) to the last frame */
const LAB_K0 = actionScale(LAB0);
const LAB_K1 = actionScale(LAB1);
const labDrift = cam3Interp(LAB1, LAB2);
function labCamAt(t: number, pb0: number, pb1: number, D: number): Camera3 {
  if (t >= pb1) return labDrift(ease.move(Math.min(1, (t - pb1) / Math.max(0.5, D - pb1))));
  const u = ease.move(Math.max(0, Math.min(1, (t - pb0) / (pb1 - pb0))));
  const k = Math.exp(Math.log(LAB_K0) + (Math.log(LAB_K1) - Math.log(LAB_K0)) * u);
  const v = (1 / k - 1 / LAB_K0) / (1 / LAB_K1 - 1 / LAB_K0);
  const lens = LAB0.lens + (LAB1.lens - LAB0.lens) * v;
  return { x: LAB0.x + (LAB1.x - LAB0.x) * v, y: LAB0.y + (LAB1.y - LAB0.y) * v, z: 1000 - (1000 * lens) / k, lens };
}
/** between the eye's stand and the first rack, facing LEFT toward the eye (s02's screen direction):
 * desk – card – eye – man – racks, left to right */
const ROSE = { x: 670, s: MK.S * ROSENBLATT_SCALE };
/** s02's present toward the eye (review round 1): the upper arm forward, the forearm lifted ≈ +60° at a
 * visible elbow hinge, the open palm up under the eye's box (not across it), chin up toward the eye */
const ROSE_PRESENT: Pose = { ...addPose(ROSE_POSES.LOOK, { shoulderF: 9, elbowF: 48, wristF: -16, head: 9, neck: 3 }), handF: 'open' };
/** on "mistakes": the arm lowers, the head tips toward the eye's lit bar, and he holds */
const ROSE_REST = addPose(ROSE_POSES.LOOK, { neck: 5, head: 9, shoulderF: 2, elbowF: 16, wristF: 4 });
const TITLE = 'The Machine That Learned to See';
/** the bookend's key comes from the upper right: his cut-lines and his own contour rim (the kit's edgeRim) catch
 * it on that side only (review round 4: floor 0; the set is rimmed on its tops alone, f.rim(SET_RIM)) */
const BOOK_LIGHT = { x: 0.6, y: -0.8, floor: 0 };

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

type C = CanvasRenderingContext2D;
function bake(f: Frame, c: C, env: PaintEnv, key: string, r: Rect, paint: (cc: C) => void) {
  f.cached(`ch01-s03/${key}/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

// ---------------------------------------------------------------- the schedule (real tries, word-anchored)
type Keys = [number, number][];
/** keep key times strictly increasing (a crowded re-voice slides later keys, never compresses phases away) */
function ordered(keys: Keys, gap = 0.03): Keys {
  const out: Keys = [];
  for (const [t, v] of keys) out.push([out.length ? Math.max(t, out[out.length - 1][0] + gap) : t, v]);
  return out;
}
function stepAt(keys: Keys, t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1];
      return v0 + (v1 - v0) * Math.min(1, Math.max(0, (t - t0) / Math.max(1e-6, t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
}
/** a quick try k whose verdict lands on word W (needle settles at W − 0.32, shape lands at W − 0.75) */
const quick = (k: number, W: number, needleAt = W - 0.32): Keys => [
  [W - 1.15, k],
  [W - 1.0, k + 0.06],
  [W - 0.95, k + 0.09],
  [W - 0.75, k + 0.2],
  [W - 0.65, k + 0.3],
  [needleAt - 0.13, k + 0.42],
  [needleAt, k + 0.48],
  [W - 0.2, k + 0.55],
  [W, k + 0.65],
];

interface Beats {
  shape: number;
  each: number;
  cellEnd: number;
  tugs: number;
  dialEnd: number;
  total: number;
  decides: number;
  wrong1: number;
  nudge: number;
  wrong2: number;
  wrong3: number;
  again: number;
  suddenly: number;
  right: number;
  l08: number;
  limit: number;
  desc: number;
  needle: number;
  dialWord: number;
  /** try 5's shape lands here (in the clear air after "right") */
  p5: number;
  /** end of "faded" */
  fadedEnd: number;
  /** "interest" (… faded): the push and the iris begin here, so the night lab is open by "descendants" */
  interest: number;
  y1969: number;
  minsky: number;
  years: number;
  mistakes: number;
  mistEnd: number;
  /** end of L0105 ("… it guesses."): the illustration note comes in only after the question is planted */
  l05End: number;
  /** "In" (1969): the era stamp types on from here */
  inW: number;
  /** "showed" (just how simple): the machine steps back, the book stands alone */
  showed: number;
  /** "and" (… and then): try 4's shape lands */
  andThen: number;
  /** "guesses" (… it guesses): the needle twitches to a first guess */
  guesses: number;
  /** end of "Papert": the stamp's names are typed by here */
  papertEnd: number;
  /** start of "Papert" */
  papert: number;
  /** "faded" */
  faded: number;
  /** "Its" (descendants): the bookend must be readable by here */
  its: number;
  /** "still" (learn from mistakes): the lineage layers have faded by here */
  still: number;
  todays: number;
  networks: number;
  /** "simple" (#2, "just how simple"): 'never settles' comes in */
  simple2: number;
}

function schedule(b: Beats, D: number): Keys {
  const p1: Keys = [
    [0, 0],
    [b.shape - 0.3, 0.09],
    [b.shape + 0.12, 0.2],
    [b.each - 0.05, 0.2],
    [b.cellEnd + 0.1, 0.3],
    // the pulse train spreads over "tugs the needle through its dial", then the settled needle holds
    // and shivers through "total"; the answer lights on "decides"
    [b.tugs - 0.1, 0.3],
    [Math.max(b.dialWord + 0.25, b.tugs + 1.2), 0.42],
    [b.total - 0.15, 0.42],
    [b.decides + 0.05, 0.48],
    [b.wrong1 - 0.35, 0.5],
    [b.wrong1 - 0.2, 0.55],
    [b.wrong1 + 0.05, 0.65],
    [b.nudge - 0.15, 0.68],
    [b.nudge + 1.55, 0.92],
    [b.nudge + 2.9, 0.95],
  ];
  // the montage quickens: try 2's dials flick over in a beat, then try 3 comes straight in
  const p2: Keys = [...quick(1, b.wrong2), [b.wrong2 + 0.05, 1.68], [b.wrong2 + 0.17, 1.92], [b.wrong2 + 0.2, 1.95]];
  // try 3: its verdict lands on "wrong" (#2) of "wrong again"; then a quick nudge through "again", so try 4's
  // shape is up by "and then"
  const W3 = b.wrong3;
  const S3 = Math.max(b.wrong2 + 0.24, W3 - 0.66);
  const p3: Keys = [
    [S3, 2],
    [S3 + 0.08, 2.06],
    [S3 + 0.1, 2.09],
    [S3 + 0.24, 2.2],
    [S3 + 0.32, 2.3],
    [W3 - 0.27, 2.42],
    [W3 - 0.16, 2.48],
    [W3 - 0.1, 2.55],
    [W3 + 0.05, 2.65],
    [W3 + 0.25, 2.68],
    [W3 + 0.6, 2.92],
    [W3 + 0.7, 2.95],
  ];
  // try 4 (round-1 critic): its shape is up by "and then"; through "and then, quite suddenly" the pulses
  // trickle in and the needle HOVERS at the threshold (hover4), then tips into VERTICAL on "right" and the
  // lantern flares
  const A4 = b.andThen;
  const R = b.right;
  const p4: Keys = [
    [A4 - 0.3, 3],
    [A4 - 0.2, 3.06],
    [A4 - 0.15, 3.09],
    [A4 + 0.1, 3.2],
    [A4 + 0.35, 3.3],
    [A4 + 0.95, 3.36],
    [R - 0.3, 3.4],
    [R - 0.12, 3.42],
    [R - 0.05, 3.48],
    [R + 0.02, 3.55],
    [R + 0.2, 3.65],
    [R + 0.6, 3.95],
  ];
  // try 5: a horizontal bar again, answered right, flaring in the clear air between "right" and L0108;
  // then the plate holds FROZEN (no more firing) until the tail takes over on "simple"
  // (round-1 critic: compressed so its verdict lands ≈ +23.9, under the caption that comes in at ≈ +23.6)
  const P5 = b.p5;
  const p5: Keys = [
    [P5, 4],
    [P5 + 0.08, 4.06],
    [P5 + 0.1, 4.09],
    [P5 + 0.25, 4.2],
    [P5 + 0.33, 4.3],
    [P5 + 0.5, 4.42],
    [P5 + 0.6, 4.48],
    [P5 + 0.68, 4.55],
    [P5 + 0.8, 4.65],
    [P5 + 1.2, 4.7],
  ];
  void D;
  return ordered([...p1, ...p2, ...p3, ...p4, ...p5]);
}

// ---------------------------------------------------------------- set pieces
const FOOT = [-0.36, -0.24, -0.12, 0.12, 0.24, 0.36].map((u) => 640 + u * 1280 * 0.92); // L5 world x (= rest screen x)
/** the apron and its footlights sit this much higher (L5 world), so they stay along the bottom edge of the
 * higher, closer camera */
const LIP_DY = -26;
const FLIES = [492, 905, 1250]; // hanging paper lanterns (L3 world x), clear of the headers

function curtains(c: C, env: PaintEnv, sides: number[] = [-1], valance = true, role: 'fg' | 'ink' = 'fg', inset = 0) {
  const fg = env.fill(role);
  const fold = mixLab(fg, env.mood.set, 0.35);
  for (const side of sides) {
    const edge = (y: number) => {
      const top = 74 + inset;
      const tie = 30 + inset;
      const foot = 150 + inset;
      if (y < 470) return top + (tie - top) * sm(y / 470);
      return tie + (foot - tie) * sm((y - 470) / 300);
    };
    const p = new Path2D();
    const x0 = side < 0 ? -120 : 1400;
    p.moveTo(x0, -60);
    for (let y = -60; y <= 800; y += 20) {
      const e = edge(Math.max(0, y));
      p.lineTo(side < 0 ? e : 1280 - e, y);
    }
    p.lineTo(x0, 800);
    p.closePath();
    c.fillStyle = fg;
    c.fill(p);
    c.strokeStyle = withAlpha(fold, 0.55);
    c.lineWidth = 3;
    for (let k = 1; k <= 4; k++) {
      c.beginPath();
      for (let y = -60; y <= 800; y += 20) {
        const e = edge(Math.max(0, y)) * (1 - k * 0.2) - 10 * k;
        const x = side < 0 ? e : 1280 - e;
        if (y === -60) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    // the tie-back: a cord cinching the drape at its waist, a rim on its upper edge, a tassel hanging below
    const tx = side < 0 ? 30 + inset : 1250 - inset;
    const tw = 34 + inset * 0.6;
    const cx = side < 0 ? tx - tw / 2 : tx + tw / 2;
    c.fillStyle = fg;
    c.beginPath();
    c.ellipse(cx, 470, tw / 2 + 4, 9, side * 0.25, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.3);
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(cx, 470, tw / 2 + 4, 9, side * 0.25, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    c.fillStyle = fg;
    c.fillRect(tx - 1.5, 474, 3, 34);
    c.beginPath();
    c.moveTo(tx, 500);
    c.lineTo(tx + 9, 536);
    c.lineTo(tx - 9, 536);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(env.mood.rim, 0.22);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(tx - 1.5 * side, 476);
    c.lineTo(tx - 1.5 * side, 506);
    c.stroke();
  }
  if (!valance) return;
  c.fillStyle = fg;
  c.fillRect(-120, -60, 1520, 112);
  const fringe = tasselFringe({ w: 1520, pitch: 26, len: 22, band: 8 });
  c.save();
  c.translate(-120, 50);
  c.fill(fringe);
  c.restore();
  c.fillStyle = withAlpha(env.mood.rim, 0.1);
  c.fillRect(-120, 44, 1520, 1.5);
}

function stageLip(c: C, env: PaintEnv) {
  c.save();
  c.translate(0, LIP_DY);
  stageLipArt(c, env);
  c.restore();
}
function stageLipArt(c: C, env: PaintEnv) {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(-200, 676, 1680, 200);
  for (const x of FOOT) {
    c.beginPath();
    c.moveTo(x - 30, 684);
    c.quadraticCurveTo(x - 30, 664, x - 12, 662);
    c.lineTo(x + 12, 662);
    c.quadraticCurveTo(x + 30, 664, x + 30, 684);
    c.closePath();
    c.fill();
  }
  c.fillRect(-200, 652, 1680, 4);
  for (let x = -160; x <= 1440; x += 118) c.fillRect(x - 2, 652, 4, 30);
  c.fillStyle = withAlpha(env.mood.rim, 0.16);
  c.fillRect(-200, 651, 1680, 1.2);
  c.fillRect(-200, 676, 1680, 1.5);
}

/** the near footlight rail (RAIL world, placed from the K0 framing): a round brass rail along the very bottom
 * edge of the frame (screen y ≈ 700 at K0, under every caption and the try row), its top catching the footlights,
 * under the near proscenium's velvet edges (proscenium()), which hang in front of it at both sides */
const RAIL_Y = toLayer(RAIL, K0, 0, 702).y;
const RAIL_X0 = toLayer(RAIL, K0, -200, 0).x;
const RAIL_X1 = toLayer(RAIL, K0, 1480, 0).x;
const RAIL_K = toLayer(RAIL, K0, 100, 0).x - toLayer(RAIL, K0, 0, 0).x; // world px per 100 screen px
function footRail(c: C, env: PaintEnv) {
  const fg = mixLab(env.fill('fg'), '#000000', 0.35);
  const u = RAIL_K / 100;
  const y = RAIL_Y;
  c.save();
  c.fillStyle = fg;
  // the rail and the dark below it
  c.fillRect(RAIL_X0, y, RAIL_X1 - RAIL_X0, 120 * u);
  c.beginPath();
  c.roundRect(RAIL_X0, y - 7 * u, RAIL_X1 - RAIL_X0, 12 * u, 6 * u);
  c.fill();
  // its top catches the footlights (a warm line, brighter at the centre)
  const g = c.createLinearGradient(RAIL_X0, 0, RAIL_X1, 0);
  g.addColorStop(0, withAlpha(env.mood.rim, 0.05));
  g.addColorStop(0.5, withAlpha(env.mood.rim, 0.32));
  g.addColorStop(1, withAlpha(env.mood.rim, 0.05));
  c.fillStyle = g;
  c.fillRect(RAIL_X0, y - 7 * u, RAIL_X1 - RAIL_X0, 2 * u);
  // (the near proscenium's velvet edges, proscenium(), hang in front of it at both sides)
  c.restore();
}

/** curtain hems pooled on the apron in both bottom corners (PROSC world): heavy folds, a rim on their crowns */
function curtainPools(c: C, env: PaintEnv) {
  const fg = env.fill('fg');
  for (const side of [-1, 1]) {
    const X = (x: number) => (side < 0 ? x : 1280 - x);
    const p = new Path2D();
    p.moveTo(X(-320), 880);
    p.lineTo(X(-320), 560);
    p.bezierCurveTo(X(-60), 572, X(70), 600, X(118), 646);
    p.bezierCurveTo(X(150), 676, X(176), 700, X(214), 718);
    p.bezierCurveTo(X(250), 734, X(262), 760, X(270), 880);
    p.closePath();
    c.fillStyle = fg;
    c.fill(p);
    // fold lines: the heavy cloth breaking over itself where it pools
    c.strokeStyle = withAlpha(mixLab(fg, env.mood.set, 0.4), 0.7);
    c.lineWidth = 2.4;
    for (const [x0, y0, x1, y1] of [
      [-40, 590, 150, 880],
      [30, 612, 196, 880],
      [96, 650, 236, 880],
    ]) {
      c.beginPath();
      c.moveTo(X(x0), y0);
      c.quadraticCurveTo(X((x0 + x1) / 2 + 26), (y0 + y1) / 2, X(x1), y1);
      c.stroke();
    }
    // the crown of each fold catches the footlights
    c.strokeStyle = withAlpha(env.mood.rim, 0.28);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(X(-60), 573);
    c.bezierCurveTo(X(40), 586, X(96), 620, X(118), 646);
    c.bezierCurveTo(X(150), 676, X(176), 700, X(214), 718);
    c.stroke();
  }
}

// ---------------------------------------------------------------- type
const cream = (m: Palette) => mixLab(m.core, '#f4ead4', 0.55);
type LS = CanvasRenderingContext2D & { letterSpacing: string };
/** a verdict line (round-1 critic, type system: all captions in the era typewriter): "try k · said …  ·" with the
 * verdict word in capitals, on a
 * dark soft-ended band; an optional small-caps tag ("now" / "then") hangs to its left */
function verdictLine(c: C, m: Palette, a: number, k: number, y: number, o: { size?: number; band?: boolean; tag?: string; alpha?: number; head?: string; cx?: number } = {}) {
  if (a <= 0.003) return;
  const size = o.size ?? 30;
  const head = o.head ?? `try ${k + 1}  ·  said ${said(k)}  ·  `;
  const word = RUN.steps[k].error ? 'WRONG' : 'RIGHT';
  c.save();
  c.font = `400 ${Math.round(size * 0.8)}px ${FONT.typewriter}`;
  const wh = c.measureText(head).width;
  c.font = `400 ${Math.round(size * 0.84)}px ${FONT.typewriter}`;
  (c as LS).letterSpacing = '1.5px';
  const ww = c.measureText(word).width;
  (c as LS).letterSpacing = '0px';
  const w = wh + ww;
  const CX = o.cx ?? 640;
  const x0 = CX - w / 2;
  c.globalAlpha = a;
  if (o.band !== false) {
    const bw = w + 210;
    const bh = size * 1.7;
    const g = c.createLinearGradient(CX - bw / 2, 0, CX + bw / 2, 0);
    g.addColorStop(0, withAlpha(m.ink, 0));
    g.addColorStop(0.14, withAlpha(m.ink, 0.88));
    g.addColorStop(0.86, withAlpha(m.ink, 0.88));
    g.addColorStop(1, withAlpha(m.ink, 0));
    c.fillStyle = g;
    c.fillRect(CX - bw / 2, y - size * 1.12, bw, bh);
  }
  c.globalAlpha = a * (o.alpha ?? 1);
  c.fillStyle = cream(m);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `400 ${Math.round(size * 0.8)}px ${FONT.typewriter}`;
  c.fillText(head, x0, y);
  c.font = `400 ${Math.round(size * 0.84)}px ${FONT.typewriter}`;
  (c as LS).letterSpacing = '1.5px';
  c.fillText(word, x0 + wh, y);
  if (o.tag) {
    (c as LS).letterSpacing = '2px';
    c.font = `400 ${Math.round(size * 0.66)}px ${FONT.typewriter}`;
    c.textAlign = 'right';
    c.globalAlpha = a * (o.alpha ?? 1) * 0.8;
    c.fillStyle = mixLab(m.rim, m.core, 0.3);
    c.fillText(o.tag.toUpperCase(), x0 - 22, y);
  }
  c.restore();
}
/** try 5's two-line caption on one plate (review round 4): "NOW  try 5 · a new horizontal bar · said horizontal ·
 * RIGHT" over "THEN  try 1 · a horizontal bar · said vertical · WRONG", both tags left-aligned inside the plate */
function nowThen(c: C, m: Palette, a: number, ga: number, left: number, top: number) {
  if (a <= 0.003) return;
  const lines = [
    { tag: 'now', head: `try 5  ·  a new ${targetName(4)} bar  ·  said ${said(4)}  ·  `, k: 4, size: 26, alpha: 1, A: a },
    { tag: 'then', head: `try 1  ·  a ${targetName(0)} bar  ·  said ${said(0)}  ·  `, k: 0, size: 23, alpha: 0.8, A: ga },
  ];
  c.save();
  const TAGW = 64;
  const widths = lines.map((l) => {
    c.font = `400 ${Math.round(l.size * 0.8)}px ${FONT.typewriter}`;
    const wh = c.measureText(l.head).width;
    c.font = `400 ${Math.round(l.size * 0.84)}px ${FONT.typewriter}`;
    (c as LS).letterSpacing = '1.5px';
    const ww = c.measureText(RUN.steps[l.k].error ? 'WRONG' : 'RIGHT').width;
    (c as LS).letterSpacing = '0px';
    return { wh, ww };
  });
  const PAD = 18;
  const W = TAGW + Math.max(...widths.map((w) => w.wh + w.ww)) + 2 * PAD;
  const H = 74;
  c.globalAlpha = a;
  c.fillStyle = withAlpha(m.ink, 0.9);
  c.beginPath();
  c.roundRect(left, top, W, H, 6);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.28);
  c.lineWidth = 1;
  c.stroke();
  lines.forEach((l, i) => {
    if (l.A <= 0.003) return;
    const y = top + (i === 0 ? 31 : 61);
    const x = left + PAD;
    c.globalAlpha = l.A * l.alpha;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    (c as LS).letterSpacing = '2px';
    c.font = `400 ${Math.round(l.size * 0.66)}px ${FONT.typewriter}`;
    c.fillStyle = mixLab(m.rim, m.core, 0.3);
    c.fillText(l.tag.toUpperCase(), x, y);
    (c as LS).letterSpacing = '0px';
    c.fillStyle = cream(m);
    c.font = `400 ${Math.round(l.size * 0.8)}px ${FONT.typewriter}`;
    c.fillText(l.head, x + TAGW, y);
    c.font = `400 ${Math.round(l.size * 0.84)}px ${FONT.typewriter}`;
    (c as LS).letterSpacing = '1.5px';
    c.fillText(RUN.steps[l.k].error ? 'WRONG' : 'RIGHT', x + TAGW + widths[i].wh, y);
    (c as LS).letterSpacing = '0px';
  });
  c.restore();
}
const said = (k: number) => TASK_NAMES[RUN.steps[k].out === 1 ? TASK[0] : TASK[1]];
const targetName = (k: number) => TASK_NAMES[RUN.steps[k].img.target === 1 ? TASK[0] : TASK[1]];

/** each try's verdict caption: in (0.2 s) finishing 0.1 s before its verdict word, out as the next shape comes */
interface Cap {
  k: number;
  at: number;
  out: number;
}
function capAlpha(cap: Cap, t: number) {
  return sm((t - cap.at) / 0.2) * (1 - sm((t - cap.out) / 0.22));
}

/** the five tries as a HISTORY ROW (screen-locked under the retina; review round 1): each chip shows the
 * shape it was shown (a tiny bar, horizontal or vertical, as soon as that shape lands on the retina) and, on
 * its verdict word, ✗ (cold) or ✓ (warm). So on "right" the row reads H ✗ · V ✗ · H ✗ · V ✓: the vertical bar
 * it got wrong before is now answered right (and try 5's horizontal follows). `flash` 0..1 lifts the whole
 * row as "right" lands. */
const CHIP = { w: 52, h: 30, gap: 9 };
function tally(c: C, m: Palette, t: number, caps: Cap[], step: number, a: number, cx0: number, Y: number, flash = 0) {
  if (a <= 0.003) return;
  const { w: W, h: H, gap: GAP } = CHIP;
  const total = 5 * W + 4 * GAP;
  const X0 = cx0 - total / 2;
  const cur = Math.floor(step);
  c.save();
  c.globalAlpha = a;
  softPlate(c, cx0, Y + H / 2, total + 90, H + 40, m.ink, 0.85);
  if (flash > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = a * flash;
    softPlate(c, cx0, Y + H / 2, total + 60, H + 30, m.halo, 0.22);
    c.restore();
  }
  caps.forEach((cap, i) => {
    const x = X0 + i * (W + GAP);
    const on = sm((t - (cap.at + 0.2)) / 0.18);
    const right = !RUN.steps[cap.k].error;
    const live = i === cur && on < 1;
    c.globalAlpha = a;
    c.fillStyle = mixLab(m.ink, m.set, 0.25);
    c.beginPath();
    c.roundRect(x, Y, W, H, 3);
    c.fill();
    if (on > 0.01 && right) {
      c.globalAlpha = a * on;
      c.fillStyle = withAlpha(m.core, 0.2 + 0.12 * flash);
      c.fill();
    }
    c.globalAlpha = a;
    c.strokeStyle = withAlpha(m.rim, live ? 0.85 : 0.4 + 0.3 * flash);
    c.lineWidth = live ? 1.6 : 1;
    c.stroke();
    // the shape it was shown: a tiny retina square with the bar, from the moment the shape lands
    const seen = sm((step - (i + 0.1)) / 0.1);
    const gx = x + 5;
    const gy = Y + 4;
    const G2 = H - 8;
    c.globalAlpha = a;
    c.fillStyle = mixLab(m.ink, '#000000', 0.25);
    c.fillRect(gx, gy, G2, G2);
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 0.8;
    c.strokeRect(gx + 0.5, gy + 0.5, G2 - 1, G2 - 1);
    if (seen > 0.01) {
      const horiz = RUN.steps[cap.k].img.target === 1;
      c.globalAlpha = a * seen;
      c.fillStyle = mixLab(m.core, m.halo, 0.15);
      if (horiz) c.fillRect(gx + 3.5, gy + G2 / 2 - 2, G2 - 7, 4);
      else c.fillRect(gx + G2 / 2 - 2, gy + 3.5, 4, G2 - 7);
    }
    if (on <= 0.01) return;
    c.globalAlpha = a * on;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = 3;
    const cx = x + W - 15;
    const cy = Y + H / 2;
    if (right) {
      c.strokeStyle = m.core;
      c.beginPath();
      c.moveTo(cx - 7, cy + 0.5);
      c.lineTo(cx - 2, cy + 5.5);
      c.lineTo(cx + 8, cy - 6);
      c.stroke();
    } else {
      c.strokeStyle = mixLab(m.rim, m.ink, 0.25);
      c.beginPath();
      c.moveTo(cx - 6, cy - 6);
      c.lineTo(cx + 6, cy + 6);
      c.moveTo(cx + 6, cy - 6);
      c.lineTo(cx - 6, cy + 6);
      c.stroke();
    }
  });
  c.restore();
}

/** the two shapes it learned, on two separate small plates under a caption, each tagged with its answer;
 * on "showed" they slide left (slide 0 → 1) and the XOR mini machine joins them past a divider */
const PLATE_CELL = 4.7;
const PLATES_CY = 516;
/** the caption line over the plates; on "1969" the era stamp takes its place */
const STAMP_Y = PLATES_CY - (PLATE_CELL * 20) / 2 - 26;
/** plate centres before / after the slide, and the XOR plate's centre */
const PLATE_X0 = [570 - 92, 570 + 92];
const PLATE_X1 = [446, 612];
/** review round 4: the XOR plate fills ≈40% of the frame width (XOR_S × XOR_W ≈ 512 px), right of the slid
 * plates, over the dimmed gauge, between the stamp band and the bottom 12% */
const XOR_S = 1.45;
const XOR_CX = 948;
const XOR_CY = 410;
void XOR_W;
function learnedPlates(c: C, m: Palette, a: number, t0: number, t: number, plateA = a, capA = 1, slide = 0) {
  if (Math.max(a, plateA) <= 0.003) return;
  const P = PLATE_CELL * 20;
  const CY = PLATES_CY;
  const xs = PLATE_X0.map((x0, i) => x0 + (PLATE_X1[i] - x0) * slide);
  const mid = (xs[0] + xs[1]) / 2;
  c.save();
  // the dark plate comes up first (≈0.25 s ahead), so the caption lands on a settled dark ground; it widens
  // to the right as the XOR plate comes in
  c.globalAlpha = plateA;
  const left = xs[0] - 210;
  const right = xs[1] + 210;
  softPlate(c, (left + right) / 2, CY + 6, right - left, 330, m.ink, 0.94);
  softPlate(c, (left + right) / 2, CY + 6, right - left - 160, 260, m.ink, 0.9);
  c.globalAlpha = a * capA;
  // caption
  // round-1 critic (type system): the caption in the era typewriter, on its own feathered plate so it never sits
  // on the retina's edge or the dial board
  c.font = `400 25px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  {
    const cw = c.measureText('what it could learn: simple patterns').width;
    const a0 = c.globalAlpha;
    softPlate(c, mid, STAMP_Y - 8, cw + 150, 74, m.ink, 0.9);
    c.globalAlpha = a0;
  }
  c.fillStyle = cream(m);
  c.fillText('what it could learn: simple patterns', mid, STAMP_Y);
  c.globalAlpha = a;
  // the thin divider between the two plates
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(mid - 0.5, CY - P / 2 + 4, 1, P - 8);
  const shapes: [number, number][] = [
    [3, xs[0]],
    [4, xs[1]],
  ];
  shapes.forEach(([k, cx], i) => {
    const u = sm((t - t0 - i * 0.18) / 0.35);
    if (u <= 0) return;
    c.save();
    c.globalAlpha = a * u;
    const x0 = cx - P / 2;
    const y0 = CY - P / 2;
    // brass-rimmed plate
    c.fillStyle = mixLab(m.ink, m.set, 0.35);
    c.fillRect(x0 - 7, y0 - 7, P + 14, P + 14);
    c.strokeStyle = withAlpha(m.rim, 0.7);
    c.lineWidth = 1.4;
    c.strokeRect(x0 - 6.5, y0 - 6.5, P + 13, P + 13);
    const px = RUN.steps[k].img.px;
    const lit = new Path2D();
    const dim = new Path2D();
    for (let j = 0; j < 400; j++) {
      const x = x0 + (j % 20) * PLATE_CELL + PLATE_CELL / 2;
      const y = y0 + Math.floor(j / 20) * PLATE_CELL + PLATE_CELL / 2;
      const p = px[j] ? lit : dim;
      p.moveTo(x + PLATE_CELL * 0.4, y);
      p.arc(x, y, PLATE_CELL * 0.4, 0, Math.PI * 2);
    }
    c.fillStyle = withAlpha(m.halo, 0.16);
    c.fill(dim);
    c.fillStyle = m.core;
    c.fill(lit);
    // its learned answer, in era type
    c.font = `400 21px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.fillStyle = mixLab(m.rim, m.core, 0.45);
    (c as LS).letterSpacing = '2px';
    c.fillText(TASK_NAMES[RUN.steps[k].img.target === 1 ? TASK[0] : TASK[1]].toUpperCase(), cx, y0 + P + 36);
    c.restore();
  });
  c.restore();
}

/** a closed hardback standing three-quarter on, on a small wall shelf, cut as ink (never a likeness, no
 * title): the front board as a leaning parallelogram, the rounded spine down its left, the page block
 * showing along the top edge, the shelf on two brackets. ≈ 76 × 104 at s = 1, anchored at the shelf's
 * top centre */
function standingBook(c: C, m: Palette, x: number, y: number, s: number, shelf = true) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  const ink = mixLab(m.ink, '#000000', 0.3);
  // the shelf and its two brackets
  c.fillStyle = ink;
  if (shelf) {
  c.fillRect(-56, 0, 112, 7);
  for (const bx of [-38, 38]) {
    c.beginPath();
    c.moveTo(bx - 4, 7);
    c.lineTo(bx + 4, 7);
    c.lineTo(bx + 4, 26);
    c.quadraticCurveTo(bx - 1, 16, bx - 4, 9);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = withAlpha(m.rim, 0.6);
  c.lineWidth = 1.1 / s;
  c.beginPath();
  c.moveTo(-56, 0.5);
  c.lineTo(56, 0.5);
  c.stroke();
  }
  // the book: spine (left, narrow, rounded), front board leaning a hair, the page block along the top
  const H = 92;
  const W = 60;
  const SP = 14;
  // page block (the top edge, seen a little from above)
  c.fillStyle = mixLab(cream(m), m.ink, 0.3);
  c.beginPath();
  c.moveTo(-W / 2 + SP - 2, -H);
  c.lineTo(W / 2 - 2, -H - 2);
  c.lineTo(W / 2 + 6, -H + 5);
  c.lineTo(-W / 2 + SP + 6, -H + 7);
  c.closePath();
  c.fill();
  // front board
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-W / 2 + SP + 4, -H + 5);
  c.lineTo(W / 2 + 6, -H + 3);
  c.lineTo(W / 2 + 4, 0);
  c.lineTo(-W / 2 + SP + 2, 0);
  c.closePath();
  c.fill();
  // spine
  c.fillStyle = mixLab(ink, m.set, 0.18);
  c.beginPath();
  c.moveTo(-W / 2 + SP + 4, -H + 5);
  c.quadraticCurveTo(-W / 2 - 2, -H + 2, -W / 2 - 1, -H + 10);
  c.lineTo(-W / 2, -2);
  c.quadraticCurveTo(-W / 2 + SP * 0.4, 1, -W / 2 + SP + 2, 0);
  c.closePath();
  c.fill();
  // spine bands (raised cords) and the window rim down the board's lit edge and across the top
  c.strokeStyle = withAlpha(m.rim, 0.45);
  c.lineWidth = 1.2 / s;
  for (const yy of [-H + 20, -H + 30, -24, -14]) {
    c.beginPath();
    c.moveTo(-W / 2 + 0.5, yy);
    c.lineTo(-W / 2 + SP + 2.5, yy + 1);
    c.stroke();
  }
  c.strokeStyle = withAlpha(m.rim, 0.85);
  c.lineWidth = 1.5 / s;
  c.beginPath();
  c.moveTo(-W / 2 + SP + 4, -H + 5);
  c.lineTo(W / 2 + 6, -H + 3);
  c.lineTo(W / 2 + 4, 0);
  c.stroke();
  c.restore();
}

/** the era stamp (review round 3): "1969 · Minsky & Papert, Perceptrons", the book's title in italic (Fell
 * italic, as a book title) and the rest in era small caps (Fell SC). It types on in step with the words, on the
 * twos: "1969 · " from "In", so "1969" is on screen as it is spoken; "Minsky & Papert, " from "Minsky" to the end
 * of "Papert"; the title in the breath after it, before "showed". A closed book stands on its small shelf beside
 * it from "Minsky". It sits at the TOP of the frame on a feathered dark band and leaves as the iris begins */
const STAMP: { text: string; italic: boolean }[] = [
  { text: '1969 · ', italic: false },
  { text: 'Perceptrons', italic: true },
  { text: ' · Minsky & Papert', italic: false },
];
const STAMP_TOP = 132;
function eraStamp(c: C, m: Palette, t: number, b: Beats, out: number) {
  const t0 = b.inW - 0.04;
  if (t < t0 || out <= 0.003) return;
  const tq = Math.floor(t * 12 + 1e-9) / 12; // type on the twos
  // per segment: [start, end] of its typing
  // round-1 critic: the script's exact text, '1969 · Perceptrons · Minsky & Papert', fully up by ≈ +31.4 (while
  // "Minsky and Papert" is spoken): the year on "1969", the book's title in the breath after it, the names
  // from "Minsky", done by the start of "Papert" + 0.05
  const tA1 = Math.max(t0 + 0.3, b.y1969 + 0.22);
  const tB0 = tA1 + 0.04;
  const tB1 = Math.max(tB0 + 0.4, Math.min(b.minsky - 0.15, tB0 + 0.8));
  const tC0 = Math.max(tB1 + 0.04, b.minsky - 0.1);
  const tC1 = Math.max(tC0 + 0.5, Math.min(b.papertEnd, b.papert + 0.05));
  const spans: [number, number][] = [
    [t0, tA1],
    [tB0, tB1],
    [tC0, tC1],
  ];
  const typed = STAMP.map((sg, i) => {
    const [a0, a1] = spans[i];
    if (tq < a0) return 0;
    return Math.max(0, Math.min(sg.text.length, Math.floor(((tq - a0) / Math.max(0.1, a1 - a0)) * sg.text.length + 1e-6) + 1));
  });
  const sizeT = 30;
  const sizeI = 33;
  const Y = STAMP_TOP;
  const bookW = 0;
  const fontOf = (sg: (typeof STAMP)[number]) => (sg.italic ? `italic 400 ${sizeI}px ${FONT.fell}` : `400 ${sizeT}px ${FONT.fellSC}`);
  const spacing = (sg: (typeof STAMP)[number]) => (sg.italic ? '0.3px' : '1.5px');
  c.save();
  const widths = STAMP.map((sg) => {
    c.font = fontOf(sg);
    (c as LS).letterSpacing = spacing(sg);
    return c.measureText(sg.text).width;
  });
  const gap = 0;
  const textW = widths.reduce((x, y) => x + y, 0);
  const total = textW + gap + bookW;
  const X0 = 640 - total / 2;
  // a dark band, feathered on all four sides
  const deep = mixLab(m.ink, '#000000', 0.45);
  const bw = total + 220;
  const bh = 170;
  const by = Y - 112;
  c.globalAlpha = out * sm((t - t0) / 0.3);
  const N = 22;
  const gv = c.createLinearGradient(0, by, 0, by + bh);
  gv.addColorStop(0, withAlpha(deep, 0));
  gv.addColorStop(0.28, withAlpha(deep, 0.9));
  gv.addColorStop(0.75, withAlpha(deep, 0.9));
  gv.addColorStop(1, withAlpha(deep, 0));
  c.fillStyle = gv;
  const a0 = c.globalAlpha;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N;
    const e = Math.min(1, u / 0.18, (1 - u) / 0.18);
    c.globalAlpha = a0 * e * e * (3 - 2 * e);
    c.fillRect(640 - bw / 2 + (i * bw) / N - 0.5, by, bw / N + 1, bh);
  }
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  let x = X0;
  let n = 0;
  STAMP.forEach((sg, si) => {
    c.font = fontOf(sg);
    (c as LS).letterSpacing = spacing(sg);
    const shown = typed[si];
    if (sg.italic) {
      // the book title: set (not struck), letter by letter
      c.globalAlpha = out;
      c.fillStyle = cream(m);
      if (shown > 0) c.fillText(sg.text.slice(0, shown), x, Y + 1);
    } else {
      c.fillStyle = mixLab(cream(m), m.rim, 0.2);
      for (let i = 0; i < shown; i++) {
        const ch = sg.text[i];
        if (ch === ' ') continue;
        const h1 = Math.sin((n + i) * 12.9898) * 43758.5453;
        const r = h1 - Math.floor(h1);
        const fresh = i === shown - 1 && shown < sg.text.length ? 1.12 : 1;
        c.globalAlpha = out * Math.min(1, (0.8 + 0.2 * r) * fresh);
        c.fillText(ch, x + c.measureText(sg.text.slice(0, i)).width, Y + (r - 0.5) * 1.2);
      }
    }
    n += sg.text.length;
    x += widths[si];
  });
  // review round 4: the scripted closed book stands on its small shelf beside the stamp (where the reviewed cut
  // had it), so the stage floor is free for the limit; it drops onto the shelf on "Minsky", on the twos
  const bu = sm((tq - (b.minsky - 0.1)) / 0.4);
  if (bu > 0.003) {
    c.save();
    c.globalAlpha = out * bu;
    standingBook(c, m, X0 + textW + 70, Y + 16 - 8 * (1 - bu), 0.82);
    c.restore();
  }
  // round-1 critic (scripted text): no '→ the 1970s' line (not in the shot's onScreenText; the narration says
  // "for years")
  c.restore();
}

/** the closed book (round-1 critic: a real prop, not an icon): a hardback standing three-quarter on, on a
 * small plinth at the right of the stage (L4 world BOOK.x, standing on the stage floor), ≈ 165 px tall at rest
 * scale. Ink, no title, never a likeness; the lantern (to its right) rims its right edges warm. Drawn in screen
 * space at the L4 mapping (sx, sy = the plinth's foot, kk = the action-plane scale) */
const BOOK = { x: 800 };
// review round 4: the book stands beside the stamp again (eraStamp); the plinth staging is kept for reference
void BOOK;
void bookOnPlinth;
function bookOnPlinth(c: C, m: Palette, sx: number, sy: number, kk: number, bu: number, rimK: number) {
  c.save();
  c.translate(sx, sy);
  c.scale(kk, kk);
  c.globalAlpha = bu;
  const ink = mixLab(m.ink, '#000000', 0.35);
  const warm = mixLab(m.core, m.halo, 0.3);
  // plinth: base, shaft, cap (a cut-paper column, 72 tall)
  c.fillStyle = ink;
  c.fillRect(-50, -12, 100, 12);
  c.fillRect(-36, -52, 72, 40);
  c.fillRect(-46, -62, 92, 10);
  // a warm rim down the plinth's lantern side and along its cap
  c.strokeStyle = withAlpha(warm, 0.55 * rimK);
  c.lineWidth = 1.6 / kk;
  c.beginPath();
  c.moveTo(-46, -62.5);
  c.lineTo(46, -62.5);
  c.lineTo(46, -52);
  c.moveTo(36.5, -52);
  c.lineTo(36.5, -12);
  c.stroke();
  // the book on the cap, leaning a little against nothing but its own weight; it settles on the twos
  c.translate(0, -62 - 7 * (1 - bu));
  c.rotate(-0.06);
  const S = 1.75;
  // the fore-edge (the page block's long edge, turned toward the lantern): a cream sliver, finely ruled
  {
    const x0 = S * 34;
    const g = c.createLinearGradient(x0, 0, x0 + S * 9, 0);
    g.addColorStop(0, withAlpha(mixLab(cream(m), m.ink, 0.35), 0.95));
    g.addColorStop(1, withAlpha(mixLab(cream(m), warm, 0.3), 0.95 * (0.5 + 0.5 * rimK)));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(S * 36, S * -89);
    c.lineTo(S * 43, S * -84);
    c.lineTo(S * 41, S * 3);
    c.lineTo(S * 34, 0);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(m.ink, 0.35);
    c.lineWidth = 0.8 / kk;
    c.beginPath();
    for (const f of [0.25, 0.5, 0.75]) {
      c.moveTo(S * (36 + 7 * f), S * (-89 + 5 * f));
      c.lineTo(S * (34 + 7 * f), S * (3 * f));
    }
    c.stroke();
  }
  standingBook(c, m, 0, 0, S, false);
  // the lantern's rim on the book's right edges (front board edge + fore-edge)
  c.strokeStyle = withAlpha(warm, 0.85 * rimK);
  c.lineWidth = 2 / kk;
  c.beginPath();
  c.moveTo(S * 43, S * -84);
  c.lineTo(S * 41, S * 3);
  c.stroke();
  c.restore();
}

/** the near proscenium (round-1 critic): near-black, blurred velvet edges hugging both frame edges for the
 * whole shot (outside the 90% safe area), sliding a little against the camera's truck */
function proscenium(f: Frame, cam: Camera3) {
  const c = f.c;
  const m = f.mood;
  const dx = Math.max(-12, Math.min(12, -(cam.x - 646) * 0.06));
  for (const side of [-1, 1]) {
    const draw = f.cached(`ch01-s03/prosc/${side}/${m.id}`, 150, 780, (cc) => {
      const ink = mixLab(m.fg, '#000000', 0.55);
      const p = new Path2D();
      // the velvet's edge, a slow wave down the frame (local x: 0 = outer edge, inner edge ≈ 40..58)
      const X = (x: number) => (side < 0 ? x : 150 - x);
      p.moveTo(X(-10), -10);
      for (let y = -10; y <= 790; y += 20) p.lineTo(X(44 + 9 * Math.sin(y / 70) + (y > 600 ? (y - 600) * 0.12 : 0)), y);
      p.lineTo(X(-10), 790);
      p.closePath();
      cc.fillStyle = ink;
      cc.fill(p);
      // two fold lines, a hair lighter
      cc.strokeStyle = withAlpha(mixLab(ink, m.set, 0.3), 0.8);
      cc.lineWidth = 3;
      for (const k of [14, 28]) {
        cc.beginPath();
        for (let y = -10; y <= 790; y += 20) {
          const x = X(k + 5 * Math.sin(y / 55 + k));
          if (y === -10) cc.moveTo(x, y);
          else cc.lineTo(x, y);
        }
        cc.stroke();
      }
    }, { blur: 5 });
    draw(c, side < 0 ? -20 + dx : 1280 - 130 + dx, -30);
  }
}

/** a rectangular plate with feathered edges (fe px) on all four sides, drawn in vertical slices */
function featherRect(c: C, x0: number, y0: number, x1: number, y1: number, fe: number, ink: string, a: number) {
  if (a <= 0.002) return;
  c.save();
  const g = c.createLinearGradient(0, y0 - fe, 0, y1 + fe);
  const hh = y1 - y0 + 2 * fe;
  g.addColorStop(0, withAlpha(ink, 0));
  g.addColorStop(fe / hh, withAlpha(ink, 1));
  g.addColorStop(1 - fe / hh, withAlpha(ink, 1));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  const N = 32;
  const w = (x1 - x0 + 2 * fe) / N;
  for (let i = 0; i < N; i++) {
    const x = x0 - fe + i * w;
    const xm = x + w / 2;
    const e = Math.min(1, (xm - (x0 - fe)) / (2 * fe), (x1 + fe - xm) / (2 * fe));
    c.globalAlpha = a * e * e * (3 - 2 * e);
    c.fillRect(x - 0.5, y0 - fe, w + 1, hh);
  }
  c.restore();
}

/** the struck typewriter caption of the illustration (era type) */
function eraNote(c: C, m: Palette, a: number) {
  if (a <= 0.003) return;
  c.save();
  c.font = `400 28px ${FONT.typewriter}`;
  const text = 'an illustration, simplified';
  const w = c.measureText(text).width;
  c.globalAlpha = a;
  softPlate(c, 640, 603, w + 160, 76, m.ink, 0.9);
  // round-1 critic (legibility): and a feathered rectangular plate right under the line, so the board's legs
  // never cross a letter
  featherRect(c, 640 - w / 2 - 14, 588, 640 + w / 2 + 14, 618, 18, m.ink, 0.8 * a);
  c.globalAlpha = a;
  c.fillStyle = mixLab(m.rim, m.core, 0.35);
  c.textAlign = 'center';
  c.fillText(text, 640, 610);
  c.restore();
}

// ---------------------------------------------------------------- the two scenes
let SNAP: HTMLCanvasElement | null = null;
function snapshot(src: HTMLCanvasElement): HTMLCanvasElement {
  if (!SNAP || SNAP.width !== src.width || SNAP.height !== src.height) SNAP = makeCanvas(src.width, src.height);
  const cx = SNAP.getContext('2d')!;
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.clearRect(0, 0, SNAP.width, SNAP.height);
  cx.drawImage(src, 0, 0);
  return SNAP;
}

function paintTheatre(f: Frame, cam: Camera3, step: number, o: { reveal: number; hRet: number; hDial: number; hResp: number; b: Beats; t: number; caps: Cap[] }) {
  const t = o.t;
  const b = o.b;
  f.setMood('candleAmber');
  f.camera(cam);
  const { k, u, st } = phaseOf(step, RUN);
  // the response lantern: cold on wrongs (the machine's default); for the two right answers the shot
  // keeps a warm residual between try 4's flare and try 5's
  let lantern: { act: number; flare: number; cold: number } | undefined;
  let win = 0;
  const vU = sm((u - 0.55) / 0.1);
  if (k === 3) {
    lantern = { act: vU, flare: vU, cold: 0 };
    win = vU;
  } else if (k >= 4) {
    // try 5: a second, smaller flare (≈60% of try 4's) on its verdict, so "also right" reads
    const drop = 1 - 0.55 * sm(u / 0.2);
    const a = Math.max(drop * (1 - vU), 0.72 * vU);
    lantern = { act: a, flare: Math.max(drop * (1 - vU) * 0.6, 0.6 * vU), cold: 0 };
    win = a;
  }
  void st;
  // on "It could learn" the answer is spent: the try-5 caption has cleared, the needle eases back to the
  // mark and the lantern dims to idle; the plates follow on "simple"
  const rest = sm((t - (b.l08 + 0.08)) / 0.6);
  if (lantern && rest > 0) lantern = { act: lantern.act * (1 - 0.8 * rest), flare: lantern.flare * (1 - rest), cold: 0 };
  win *= 1 - 0.8 * rest;
  // the limit passage (review round 1): the plates arrive on "simple" and the machine steps back a little;
  // when the XOR plate arrives on "showed" the machine drops to ≈35% and the lantern's glow goes, so the eye
  // runs stamp → XOR plate; on "years" the stage lights step down a clear notch (≈25% over 0.6 s)
  const limU = sm((t - (b.limit - 0.25)) / 0.6);
  const focusX = sm((t - (b.showed - 0.3)) / 0.6);
  // (round-1 critic) the lantern stays a low glow through the limit passage: it rims the closed book
  if (lantern && focusX > 0) lantern = { act: lantern.act * (1 - 0.55 * focusX), flare: lantern.flare * (1 - focusX), cold: 0 };
  win *= 1 - 0.55 * focusX;
  // teaching the decision: on "total" the threshold mark becomes a labelled line; gone after try 1's verdict
  // (round-1 critic: it leaves before the verdict, so at most three labels are up at once)
  const thr = sm((t - (b.total - 0.25)) / 0.4) * (1 - sm((t - (b.wrong1 - 0.45)) / 0.4));
  // progress on the needle: from try 3 on, an earlier try with the SAME shape leaves a dashed, labelled ghost
  // needle, so each new needle visibly lands closer to (then across) the threshold: try 3 over try 1, try 4
  // over try 2, and try 5 over try 1 (the "then" line under its caption)
  const gk = k === 2 ? 0 : k === 3 ? 1 : k === 4 ? 0 : -1;
  // try 5's ghost (try 1's needle on VERTICAL) only flashes, ≈0.6 s around the moment the real needle settles
  const settle5 = b.p5 + 0.6;
  const ghostA =
    gk < 0 ? 0 : sm((u - 0.26) / 0.06) * (k < 4 ? 1 - sm((u - 0.93) / 0.05) : 1 - sm((t - (settle5 + 0.45)) / 0.2)) * (1 - rest);
  const ghost = gk < 0 ? undefined : { pos: needleAt(RUN.steps[gk].sum), a: 0.85 * ghostA };
  // on a wrong try, from the verdict through the nudge: a faint tick on the CORRECT side of the face, the
  // target the nudged dials push the needle toward
  const tgtSide = RUN.steps[k].img.target === 1 ? 1 : -1;
  const target = RUN.steps[k].error ? { pos: 0.62 * tgtSide, a: 0.9 * sm((u - 0.56) / 0.08) * (1 - sm((u - 0.96) / 0.03)) * (1 - rest) } : undefined;
  // a warm pool behind the dial rack, dark at the edges
  // the warm pool sits behind the gap between the dial rack and the meter (not behind the dials, which
  // would read as dots on a bright arch)
  // "for years, interest faded": the stage lights dim a clear notch (and stay down into the iris)
  // (round-1 critic: over 0.8 s from just before "years", before the iris starts)
  // review round 4: on "years" the key light steps down a clear ≈28% over 0.3 s and holds (the XOR row keeps
  // ticking under it) until the iris takes it on "faded"
  const dimU = sm((t - (b.years - 0.05)) / 0.3);
  // the iris out: the circle's content (the retina) comes back up to full light inside it
  const irisU = sm((t - irisStart(b)) / 0.5);
  // (round-1 critic, artistry) the backdrop sits ≈25% darker; soft pools of light stay behind the retina and
  // the gauge
  f.backlight({ sunX: RACK.x + 160, sunY: RACK.y - 10, sunRadius: 450, intensity: 0.8 * (1.15 + 0.3 * win) * (1 - 0.15 * focusX) * (1 - 0.3 * dimU) });
  f.layer(BACK, (c, env) => {
    const r = overscan(BACK, CAMS, 40);
    bake(f, c, env, 'arcade', r, (cc) => {
      arcade(cc, { x: r.x, y: Math.min(r.y, -20), w: r.w, h: 600 - Math.min(r.y, -20), bays: 7, spring: 250, shape: 'round', pier: 0.3, floor: 600 }, env);
    });
    // (round-1 critic) the whole backdrop a quarter darker, the pools below lift it back where the action is
    c.save();
    c.fillStyle = withAlpha(env.mood.fg, 0.25);
    c.fillRect(r.x, r.y, r.w, r.h);
    c.restore();
    // a warm wash on the cyclorama behind the retina and the patch uprights (review round 1): the housing,
    // its pedestal and the frames cut out of it as INK silhouettes instead of grey-on-black outlines
    {
      const q = toLayer(BACK, K0, 250, 372);
      c.save();
      c.globalCompositeOperation = 'screen';
      c.translate(q.x, q.y);
      c.scale(1, 1.15);
      const R = 560;
      const wg = c.createRadialGradient(0, 0, 40, 0, 0, R);
      wg.addColorStop(0, withAlpha(env.mood.halo, 0.42 * (1 - 0.3 * dimU)));
      wg.addColorStop(0.5, withAlpha(env.mood.halo, 0.2 * (1 - 0.3 * dimU)));
      wg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = wg;
      c.fillRect(-R, -R, 2 * R, 2 * R);
      c.restore();
    }
    // and a second pool behind the gauge and its lantern (the answer)
    {
      const q = toLayer(BACK, K0, 1027, 400);
      c.save();
      c.globalCompositeOperation = 'screen';
      c.translate(q.x, q.y);
      c.scale(1.1, 1);
      const R = 380;
      const wg = c.createRadialGradient(0, 0, 30, 0, 0, R);
      wg.addColorStop(0, withAlpha(env.mood.halo, 0.3 * (1 - 0.3 * dimU)));
      wg.addColorStop(0.55, withAlpha(env.mood.halo, 0.12 * (1 - 0.3 * dimU)));
      wg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = wg;
      c.fillRect(-R, -R, 2 * R, 2 * R);
      c.restore();
    }
    // the bay behind the dial rack is held ~22% darker, so the dial faces read against it (not dots on a bright arch)
    c.save();
    c.translate(RACK.x, RACK.y);
    c.scale(1, 1.25);
    const dg = c.createRadialGradient(0, 0, 60, 0, 0, 300);
    dg.addColorStop(0, withAlpha(env.mood.fg, 0.24));
    dg.addColorStop(0.6, withAlpha(env.mood.fg, 0.18));
    dg.addColorStop(1, withAlpha(env.mood.fg, 0));
    c.fillStyle = dg;
    c.fillRect(-300, -300, 600, 600);
    c.restore();
  });
  // a faint haze band between the arcade and the machine, so the arches sit back
  f.fog({ yCenter: 300, height: 260, alpha: 0.1, drift: 4 });
  f.layer(STAGE, (c, env) => {
    const r = overscan(STAGE, CAMS, 40);
    const fr = { x: r.x, y: FLOOR_Y - 6, w: r.w, h: r.y + r.h - FLOOR_Y + 6 };
    bake(f, c, env, 'boards3', fr, (cc) => {
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.6);
      cc.fillRect(fr.x, fr.y, fr.w, fr.h);
      boardFloor(cc, { x0: fr.x, x1: fr.x + fr.w, yBack: FLOOR_Y - 6, yFront: fr.y + fr.h, horizon: 300, vpX: 640, board: 46 }, env);
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      const dv = cc.createLinearGradient(0, fr.y, 0, fr.y + 120);
      dv.addColorStop(0, withAlpha(env.mood.fg, 0.55));
      dv.addColorStop(1, withAlpha(env.mood.fg, 0.82));
      cc.fillStyle = dv;
      cc.fillRect(fr.x, fr.y, fr.w, fr.h);
      cc.restore();
    });
  });
  f.fog({ yCenter: 720 * 0.6, height: 720 * 0.4, alpha: 0.14 });
  {
    const kk = actionScale(cam);
    // centred between the retina and the meter (it no longer buries the retina's side in black)
    const px = 640 + (RACK.x - 60 - cam.x) * kk;
    const py = 360 + (RACK.y - 20 - cam.y) * kk;
    const c = f.c;
    c.save();
    c.translate(px, py);
    c.scale(1.35, 1);
    const g = c.createRadialGradient(0, 0, 220 * kk, 0, 0, 700 * kk);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(0.35, withAlpha(f.mood.fg, 0.3));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.85));
    c.fillStyle = g;
    c.fillRect(-px / 1.35 - 20, -py - 20, 1320 / 1.35 + 40, 760 + 40);
    c.restore();
  }
  f.layer(FLY, (c, env) => {
    FLIES.forEach((x, i) => paperLantern(c, { x, y: 131 + (i % 2) * 22, r: 20, act: (0.42 + 0.06 * Math.sin(t * 1.3 + i)) * (1 - 0.3 * focusX) * (1 - 0.25 * dimU), hang: 175, tassel: true }, env));
  });
  f.layer(DRAPE, (c, env) => {
    bake(f, c, env, 'drapeR3', { x: 900, y: -80, w: 520, h: 900 }, (cc) => curtains(cc, env, [1], false, 'fg', 0));
    // its mirror on the left, so the proscenium frames the machine from both sides
    bake(f, c, env, 'drapeL3', { x: -140, y: -80, w: 520, h: 900 }, (cc) => curtains(cc, env, [-1], false, 'fg', 0));
  });
  f.fog('B');
  f.layer('L4', (c, env) => {
    // round-1 critic: on "it guesses" the needle twitches to a first guess (VERTICAL side) and holds it, then
    // eases back as "Each lit cell" begins the real swing (which restates the answer on "total")
    // review round 4 (teacher): on "guesses" the needle is UNDECIDED: a small tremble either side of the threshold
    // mark (on the twos), until the tugs of "Each lit cell tugs" arrive and the real swing commits it
    const tq2 = Math.floor(t * 12 + 1e-9) / 12;
    const undecided = sm((t - (b.guesses - 0.15)) / 0.25) * (1 - sm((t - (b.tugs - 0.05)) / 0.35));
    const kick = undecided * (0.075 * Math.sin(tq2 * 2 * Math.PI * 1.7) + 0.035 * Math.sin(tq2 * 2 * Math.PI * 4.3 + 1.1));
    // try 4: the needle hovers at the threshold through "and then, quite suddenly" and tips on "right"
    const hover = k === 3 ? sm((u - 0.3) / 0.03) * (1 - sm((u - 0.405) / 0.012)) : 0;
    mindMachine(c, { ...BOX, step, run: RUN, reveal: o.reveal, floorY: FLOOR_Y, headers: { retina: o.hRet, dials: o.hDial, response: o.hResp }, lantern, threshold: thr, ghost, target, rest, idle: sm((t - b.l08) / 0.6) * (1 - irisU), kick, hover, faceLabels: 1 - sm((t - (b.showed - 0.2)) / 0.3) }, env);
    // (round-1 critic) the dial lattice sits back half a plane: a haze veil over the knob bank, so the retina,
    // the threads and the needle are the one sharp action plane
    c.save();
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = withAlpha(env.fill('haze'), 0.1);
    c.fillRect(G.knobs.x - 6, G.knobs.y - 6, G.knobs.w + 12, G.knobs.h + 12);
    c.restore();
  });
  f.rim({ x: 0.1, y: -1 });
  // a low fog sheet at footlight height, between the machine and the apron (review round 1)
  f.fog({ yCenter: 610, height: 150, alpha: 0.12, drift: 7 });
  if (win > 0.01) f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 33, intensity: 1.25 * win, radius: 130, layer: 'L4' });
  FOOT.forEach((sx, i) => {
    f.practical({ x: sx, y: 664 + LIP_DY, kind: 'candle', seed: 50 + i * 7, intensity: (0.62 + 0.1 * win) * (1 - 0.15 * focusX) * (1 - 0.25 * dimU), radius: 40, layer: 'L5' });
  });
  f.layer('L5', (c, env) => {
    bake(f, c, env, 'lip4', { x: -220, y: 630 + LIP_DY, w: 1720, h: 260 }, (cc) => stageLip(cc, env));
  });
  // the near footlight rail (blurred, in front of the apron) and a velvet curtain edge in front of it at left
  // it belongs to the wide framings only: at the close opening on the retina (KR) its parallax would throw it
  // across the frame, so it comes in as the camera pulls back to K0
  {
    const railA = 1 - sm((actionScale(cam) - 1.06) / 0.04);
    if (railA > 0.003) f.layer(RAIL, (c, env) => {
      c.save();
      c.globalAlpha = railA;
      footRail(c, env);
      c.restore();
    });
  }
  // the sharp near plane: curtain hems pooled in the two bottom corners (a true foreground frame)
  f.layer(PROSC, (c, env) => {
    bake(f, c, env, 'pools1', { x: -320, y: 480, w: 1920, h: 400 }, (cc) => curtainPools(cc, env));
  });
  // the near curtains: at the close-on-retina opening the camera is panned far left, and the near plane's
  // parallax would throw the left curtain across a third of the frame; it fades in with the pull-back instead
  // (round-1 critic) the near proscenium for the WHOLE shot: near-black, blurred curtain edges hugging both
  // frame edges (outside the safe area, so nothing teaching is covered), sliding a little against the camera
  proscenium(f, cam);
  // screen-locked: the flies' darkness pulls in at the top corners
  const c = f.c;
  const m = f.mood;
  for (const cx of [0, 1280]) {
    c.save();
    c.translate(cx, -40);
    c.scale(1.5, 1);
    const vg = c.createRadialGradient(0, 0, 40, 0, 0, 420);
    vg.addColorStop(0, withAlpha(m.fg, 0.85));
    vg.addColorStop(0.55, withAlpha(m.fg, 0.4));
    vg.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = vg;
    c.fillRect(-420, -420, 840, 840);
    c.restore();
  }
  // the dims land on the whole stage, under the type (the stamp and the plates stay legible): a little on
  // "simple", to ≈35% on "showed" (the XOR plate), a further clear step on "years"
  // review round 4: the limit tableau is held a little brighter (mean luma ≈28-32), the board at about half its
  // value behind the XOR plate; "years" is a clear ≈28% step down
  const stageDim = (1 - (1 - 0.2 * limU) * (1 - 0.18 * focusX) * (1 - 0.34 * dimU)) * (1 - irisU);
  if (stageDim > 0.003) {
    c.save();
    c.globalAlpha = stageDim;
    c.fillStyle = '#000';
    c.fillRect(-40, -40, 1360, 800);
    c.restore();
  }
  // type: the era note in the first second, then each try's verdict (in 0.1 s before its word)
  // (only after the question "Nobody gave it the rule … it guesses" has been planted)
  eraNote(c, m, Math.min(sm((t - (b.l05End + 0.05)) / 0.4), 1 - sm((t - (b.dialWord - 0.35)) / 0.45)));
  // the retina group (screen space, follows the camera): the tag sits under the retina, the tally under it
  const kkR = actionScale(cam);
  const retX = 640 + (G.retina.x + G.retina.size / 2 - cam.x) * kkR;
  const retB = 360 + (G.retina.y + G.retina.size - cam.y) * kkR + 20 * kkR;
  const tagY = retB + 30;
  // the try row sits clear below the tag's plate (review round 1: the two never overlap)
  const tallyY = tagY + 24;
  // the target, dim beside the retina while each shape is up ("toward the right answer"); gone on the verdict
  if (k <= 4) {
    // the guess comes first, in the dark; the teacher's answer follows: the tag comes in as the guess
    // settles (just before the verdict) and holds through the nudge ("toward the right answer"), until the
    // next try's shape comes
    // (on a right try there is no nudge: the tag leaves with the verdict, so try 5's NOW / THEN lines own the
    // bottom of the frame)
    // (review round 1) on a RIGHT try there is no tag at all: the verdict and the history row carry it, and
    // nothing fades over the row as its chip fills
    // (round-1 critic: ≤ 3 labels) only on try 1, from its verdict through its nudge; the quick tries carry
    // their verdict caption and the history row instead
    const ta = RUN.steps[k].error && k === 0 ? sm((u - 0.55) / 0.05) * (1 - sm((u - 0.96) / 0.03)) * (1 - rest) : 0;
    if (ta > 0.003) {
      const rx = Math.max(64 + 30 + 200, retX); // inside the safe area
      c.save();
      c.globalAlpha = ta;
      c.font = `400 28px ${FONT.typewriter}`;
      const text = `correct answer: ${targetName(k)}`;
      const tw = c.measureText(text).width;
      const by = tagY + 4;
      softPlate(c, rx, by - 9, tw + 90, 54, m.ink, 0.88);
      c.fillStyle = mixLab(m.rim, m.core, 0.25);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(text, rx, by);
      c.restore();
    }
  }
  const Y = 590;
  // the try row's centre and right end (the row is drawn below; the NOW / THEN plate keeps clear of it)
  const tallyCx = Math.max(64 + 45 + (5 * CHIP.w + 4 * CHIP.gap) / 2, retX);
  const tallyEnd = tallyCx + (5 * CHIP.w + 4 * CHIP.gap) / 2;
  for (const cap of o.caps) {
    const a = capAlpha(cap, t);
    if (a <= 0.003) continue;
    if (cap.k === 4) {
      // honest NOW / THEN: try 5's bar is a NEW horizontal bar (from the real run), not try 1's again. Review
      // round 4 (art): the NOW tag sits INSIDE the caption plate, left-aligned, with THEN set the same way beneath
      // it, and the plate starts ≥ 16 px right of the try row's last box
      const ga = sm((t - (cap.at + 0.15)) / 0.25) * (1 - sm((t - cap.out) / 0.22));
      nowThen(c, m, a, ga, tallyEnd + 18, Y - 30);
    } else verdictLine(c, m, a, cap.k, Y);
  }
  // the try tally: five chips under the retina, each filling (✗ / ✓) on its verdict word, so the fast tries
  // stay readable after their captions clear; the running try's chip is outlined brighter
  const flash = Math.sin(Math.PI * Math.min(1, Math.max(0, (t - (b.right - 0.12)) / 1.5)));
  // (round-1 critic: ≤ 3 labels) the history row comes in with try 2, when there is a history to show
  tally(c, m, t, o.caps, step, sm((step - 0.97) / 0.03) * (1 - sm((t - (b.l08 + 0.1)) / 0.4)), tallyCx, tallyY, flash);
  // "simple patterns": the two learned shapes on two separate plates; on "1969" the era stamp types on above
  // them and the closed book lands on "Minsky"; both leave only as the iris begins (after "faded")
  {
    const I0 = irisStart(b);
    const out = 1 - sm((t - I0) / 0.4);
    const dimT = 1;
    const capA = 1 - sm((t - (b.y1969 - 0.3)) / 0.25);
    const tq = Math.floor(t * 12 + 1e-9) / 12;
    // review round 4 (teacher, story, art; showrunner at 56.4 s): on "showed just how simple" the LIMIT is shown.
    // The two learned plates slide left and drop to about half value; a separate two-cell XOR mini machine
    // (sets/ch01-s03-xor.ts, the REAL trainXor() run, which never settles) comes in at ≈40% of the frame width
    // over the dimmed gauge, whose VERTICAL / HORIZONTAL labels fade out as it enters. 'never settles' and the
    // run's live 'best: n of 4' come in on "simple"; it keeps ticking through "years" until the iris
    const xorIn = sm((t - (b.showed - 0.15)) / 0.4);
    const slide = sm((t - (b.showed - 0.25)) / 0.6);
    const pa = sm((t - (b.limit - 0.25)) / 0.25) * out * dimT * (1 - 0.5 * focusX);
    learnedPlates(c, m, pa, b.limit - 0.25, t, sm((t - (b.limit - 0.55)) / 0.3) * out * (1 - 0.5 * focusX), capA, slide);
    if (xorIn > 0.003) {
      const xs = Math.max(-1, (tq - b.showed - 0.1) / XOR_TICK);
      // round-1 critic (overload): the plate carries no captions (only 'XOR'), so it reads in the time it has
      xorMini(c, m, { x: XOR_CX, y: XOR_CY, a: xorIn * out * (1 - 0.1 * sm((t - (b.years - 0.05)) / 0.3)), step: xs, s: XOR_S });
    }
  }
  // the iris out, closing on the RETINA (round-1 critic; screen-space, black beyond a soft edge): it ends on a
  // circle just holding the retina's grid, which the bookend's eye grid replaces at the same place and size
  const kkI = actionScale(cam);
  const ir = irisAt(t, b, (G.retina.size * kkI) * 0.6);
  if (ir < 1600) {
    const kk = kkI;
    const lx = 640 + (RET_C.x - cam.x) * kk;
    const ly = 360 + (RET_C.y - cam.y) * kk;
    c.save();
    c.beginPath();
    c.rect(-40, -40, 1360, 800);
    c.arc(lx, ly, ir, 0, Math.PI * 2, true);
    c.fillStyle = '#000';
    c.fill('evenodd');
    const feather = Math.min(40, ir * 0.5);
    const g = c.createRadialGradient(lx, ly, Math.max(0, ir - feather), lx, ly, ir + 1);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g;
    c.fillRect(lx - ir - 2, ly - ir - 2, ir * 2 + 4, ir * 2 + 4);
    c.restore();
  }
}

/** the iris closes on the lantern from "interest faded" (fast at first, then lingering small), so it is a
 * tight circle of glow as "descendants" begins and the match-dissolve lands on the word */
const irisStart = (b: Beats) => b.faded;
const irisEnd = (b: Beats) => Math.max(irisStart(b) + 0.6, b.its - 0.3);
/** seconds per XOR try (on the twos: 9 frames) */
const XOR_TICK = 0.375;
function irisAt(t: number, b: Beats, rEnd: number) {
  const t0 = irisStart(b);
  const u = Math.min(1, Math.max(0, (t - t0) / (irisEnd(b) - t0)));
  const e = 1 - Math.pow(1 - u, 3);
  return t <= t0 ? 1600 : 1250 + (rEnd - 1250) * e;
}

const CELLS = new Float32Array(400);
function labCells(t: number): Float32Array {
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  for (let i = 0; i < 400; i++) {
    const r = Math.floor(i / 20);
    const c = i % 20;
    // the eye glows: a warm field with the last shape it answered (a horizontal bar) brightest
    const bar = r >= 8 && r <= 10 && c >= 4 && c <= 15 ? 1 : 0;
    CELLS[i] = 0.3 + 0.08 * Math.sin(tq * 1.7 + i * 0.37) + 0.62 * bar;
  }
  return CELLS;
}

/** "Its descendants, today's neural networks" (claim lineage-mlp). Review round 4 (story, teacher): the lineage
 * GROWS OUT OF THE EYE. On "descendants" the window light throws three stacked layer silhouettes directly behind
 * the camera box, fanning up and back from it into the glass at about the eyeline: 1, then 2, then 3 layers of
 * dials (each column a layer of dials, threads tying every dial to every dial of the next), each larger and
 * fainter (≈1.3×, 1.7×, 2.2× the box), tied to the box and to each other by thin threads. They answer the XOR
 * plate's 'one layer of dials'. A value step LIGHTER than him (window-lit, hazed), gone by "still". No modern
 * specifics. Drawn on the L4 plane before the machine, so the box, the card post and the man stand in front. */
interface Gen {
  layers: number;
  f: number;
  dx: number;
  dy: number;
  a: number;
}
const GENS: Gen[] = [
  { layers: 1, f: 1.3, dx: -1.0, dy: -0.35, a: 1 },
  { layers: 2, f: 1.7, dx: -2.3, dy: -0.6, a: 0.86 },
  { layers: 3, f: 2.2, dx: -3.95, dy: -0.8, a: 0.72 },
];
const EYE_BOX = eyeBox(MK.EYE_AT);
const BOX_C = { x: EYE_BOX.x + EYE_BOX.w / 2, y: EYE_BOX.y + EYE_BOX.h / 2 };
function genGeo(g: Gen) {
  const H = g.f * EYE_BOX.h;
  const cols = g.layers + 2; // inputs, the layers of dials, the output
  const W = H * (0.62 + 0.2 * g.layers);
  const cx = BOX_C.x + g.dx * EYE_BOX.h;
  const cy = BOX_C.y + g.dy * EYE_BOX.h;
  const colX = (i: number) => cx - W / 2 + W * (0.14 + (0.72 * i) / (cols - 1));
  const rows = (i: number) => (i === 0 ? 3 : i === cols - 1 ? 1 : 4);
  const rowY = (i: number, j: number) => cy + (j - (rows(i) - 1) / 2) * H * 0.2;
  return { H, W, cx, cy, cols, colX, rows, rowY };
}
function lineageStack(c: C, env: PaintEnv, t: number, b: Beats) {
  // round-1 critic (clean ending): gone well before "still" (≈ still − 0.4), so the hold is clear air
  const out = 1 - sm((t - (b.still - 1.0)) / 0.6);
  if (out <= 0.003) return;
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  const lands = [b.desc - 0.08, b.desc + 0.42, b.todays - 0.05];
  const m = env.mood;
  // window-lit ink: a clear step lighter than the near-black figure, darker than the glass
  const paper = mixLab(env.fill('ink'), env.fill('haze'), 0.14);
  const thread = withAlpha(paper, 0.9);
  for (let gi = GENS.length - 1; gi >= 0; gi--) {
    const g = GENS[gi];
    const u = sm((tq - lands[gi]) / 0.45);
    if (u <= 0.003) continue;
    const q = genGeo(g);
    c.save();
    c.globalAlpha = u * out * g.a;
    // it grows out of the eye: each card slides up and back from the box as it lands (on the twos)
    const k = 0.75 + 0.25 * u;
    c.translate(BOX_C.x + (q.cx - BOX_C.x) * (0.6 + 0.4 * u), BOX_C.y + (q.cy - BOX_C.y) * (0.6 + 0.4 * u));
    c.scale(k, k);
    c.translate(-q.cx, -q.cy);
    // the thread back to the previous generation (or to the box)
    const prev = gi === 0 ? { x: EYE_BOX.x + 4, y: EYE_BOX.y + 6 } : (() => { const p = genGeo(GENS[gi - 1]); return { x: p.cx - p.W / 2, y: p.cy }; })();
    c.strokeStyle = thread;
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(q.cx + q.W / 2, q.cy);
    c.quadraticCurveTo((q.cx + q.W / 2 + prev.x) / 2, Math.min(q.cy, prev.y) - 10, prev.x, prev.y);
    c.stroke();
    // the card: a cut-paper frame, open inside, so the threads cross real window light
    const B = 3.2;
    const frame = new Path2D();
    frame.roundRect(q.cx - q.W / 2, q.cy - q.H / 2, q.W, q.H, 3);
    frame.roundRect(q.cx - q.W / 2 + B, q.cy - q.H / 2 + B, q.W - 2 * B, q.H - 2 * B, 2);
    c.fillStyle = paper;
    c.fill(frame, 'evenodd');
    // threads: every node of a column tied to every node of the next
    c.strokeStyle = thread;
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i + 1 < q.cols; i++)
      for (let a = 0; a < q.rows(i); a++)
        for (let bb = 0; bb < q.rows(i + 1); bb++) {
          c.moveTo(q.colX(i), q.rowY(i, a));
          c.lineTo(q.colX(i + 1), q.rowY(i + 1, bb));
        }
    c.stroke();
    // nodes: input dots, then each layer of DIALS (an ink disc with a punched pointer slit), then the output pip
    const r = q.H * 0.065;
    for (let i = 0; i < q.cols; i++) {
      for (let j = 0; j < q.rows(i); j++) {
        const x = q.colX(i);
        const y = q.rowY(i, j);
        c.fillStyle = paper;
        c.beginPath();
        if (i === q.cols - 1) c.ellipse(x, y, r * 0.8, r * 1.1, 0, 0, Math.PI * 2);
        else c.arc(x, y, i === 0 ? r * 0.6 : r, 0, Math.PI * 2);
        c.fill();
        if (i > 0 && i < q.cols - 1) {
          const ang = -Math.PI / 2 + (hashA(gi * 31 + i * 7 + j) - 0.5) * 2.2;
          c.save();
          c.globalCompositeOperation = 'destination-out';
          c.lineWidth = Math.max(1, r * 0.32);
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x + Math.cos(ang) * r * 0.75, y + Math.sin(ang) * r * 0.75);
          c.stroke();
          c.restore();
        }
      }
    }
    // the window's rim along the card's top edge only (a crescent, not an outline)
    c.strokeStyle = withAlpha(m.rim, 0.55);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(q.cx - q.W / 2 + 3, q.cy - q.H / 2 + 0.6);
    c.lineTo(q.cx + q.W / 2 - 3, q.cy - q.H / 2 + 0.6);
    c.stroke();
    c.restore();
  }
}
const hashA = (i: number) => {
  const h = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
  return h - Math.floor(h);
};

function paintLab(f: Frame, cam: Camera3, o: { t: number; b: Beats; rim: boolean; open: number }) {
  const t = o.t;
  f.setMood('labGreen');
  f.camera(cam);
  nightLab(f, {
    key: 'ch01-s03-lab',
    cams: LAB_CAMS,
    light: 0.62 * o.open,
    sunX: 700,
    sunRadius: 470,
    hot: 640,
    focus: 1,
    tubesLit: 0,
    blinds: 0.82,
    fog: 0.55,
    glass: 0.72,
    floorDark: 0.78,
    air: () => labHaze(f, { key: 'ch01-s03-lab', cams: LAB_CAMS, hot: 640, k: 0.5 * o.open }),
  });
  f.layer('L4', (c, env) => {
    // its descendants grow out of the eye: three layer silhouettes in the window light behind the box
    lineageStack(c, env, t, o.b);
    // the machine is AWAKE now (it has learned): s02's dial faces, held a little back in the night air
    drawMachine(c, env, { cells: labCells(t), patch: 0.2, racks: 1, eyeLight: 0.35, card: 0.45, knobs: { weights: REST_WEIGHTS }, dim: { patch: 0.4, racks: 0.4 }, veil: { patch: RACK_VEIL * 0.5, racks: RACK_VEIL * 0.5 }, faces: 1 });
    // on "mistakes" the presenting arm lowers and his head tips toward the eye's lit bar; then he holds
    const at = (q: number) => addPose(blendPose(ROSE_PRESENT, ROSE_REST, sm((q - (o.b.mistakes - 0.15)) / 0.6)), breath(q, 5, 1));
    const pose = { ...at(env.tq), prev: at(env.tq - 1 / 12) };
    // near-black, one draw (review round 4: the darkest shape in frame, ROSE_INK via the rosenblatt wrapper):
    // his only light is his own window-side contour rim (the kit's edgeRim along BOOK_LIGHT) and a few dim
    // cut-lines (review round 1: no rim-coloured copy under him, which outlined the arm across the body)
    const lp = withLife(pose, env.tq, 1958, 1);
    const cutEnv: PaintEnv = { ...env, fill: (r) => (r === 'rim' ? mixLab(env.mood.rim, env.fill('ink'), 0.45) : env.fill(r)) };
    rosenblattSuit.draw(c, { x: ROSE.x, y: MK.INST.y, facing: 'left', pose: lp, scale: ROSE.s, cutLines: true, light: BOOK_LIGHT }, cutEnv);
  });
  // the set's rim on window-facing tops only (review round 4: was { x: 0.6, y: -0.8 }, which struck every rack's
  // right side edge)
  if (o.rim) f.rim(SET_RIM);
  // the eye's glow is the room's one warm light
  // (kept low, so the horizontal bar on the retina, the callback, stays a readable shape)
  f.practical({ x: EYE.x, y: EYE.y, kind: 'screen', seed: 61, intensity: 0.35, radius: 50, layer: 'L4' });
  // the near desk end and its cold lamp at the left edge, as in the film's first frame (s01), so the
  // bookend rhymes (shifted for this camera's parallax: it lands at the frame's left edge as in s01)
  nightDesk(f, { key: 'ch01-s03-lab', x: -300, w: 330, top: 482, lamp: { x: -188, h: 108 } });
  nightVignette(f, 0.95);
  // the room opens out of the dark around the eye's glow (a soft radial dark that recedes)
  const c = f.c;
  if (o.open < 1) {
    const kk = actionScale(cam);
    const ex = 640 + (EYE_GRID.x - cam.x) * kk;
    const ey = 360 + (EYE_GRID.y - cam.y) * kk;
    // at first only the eye's grid shows (the iris's circle, matched), then the room opens around it
    const r = (EYE_GRID.w * kk * 0.6) / 0.42 + 1500 * sm(o.open);
    c.save();
    const g = c.createRadialGradient(ex, ey, r * 0.42, ex, ey, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g;
    c.fillRect(-40, -40, 1360, 800);
    c.restore();
  }
  // the title returns, small, and brightens a little once the last word has landed
  const TA = sm((t - (o.b.desc + 1.2)) / 1.0) * (0.82 + 0.18 * sm((t - o.b.mistEnd) / 0.8));
  if (TA > 0) {
    c.save();
    c.globalAlpha = TA;
    softPlate(c, 640, 84, 760, 120, f.mood.ink, 0.75);
    c.font = `500 30px ${FONT.sc}`;
    (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '2px';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = f.mood.core;
    c.fillText(TITLE, 640, 94);
    const w = c.measureText(TITLE).width;
    c.strokeStyle = withAlpha(f.mood.rim, 0.7);
    c.lineWidth = 1;
    for (const y of [64, 108]) {
      c.beginPath();
      c.moveTo(640 - w / 2, y);
      c.lineTo(640 + w / 2, y);
      c.stroke();
    }
    c.restore();
  }
}

export default defineShot({
  id: 'ch01-s03',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = {
      shape: T.beat('shape'),
      each: T.word('L0105b', 'each'),
      cellEnd: T.wordEnd('L0105b', 'cell'),
      tugs: T.beat('tug'),
      needle: T.word('L0105b', 'needle'),
      dialWord: T.word('L0105b', 'dial'),
      p5: T.beat('right') + 0.3,
      andThen: T.word('L0107', 'and#2'),
      guesses: T.word('L0105', 'guesses'),
      fadedEnd: T.wordEnd('L0108', 'faded'),
      interest: T.word('L0108', 'interest'),
      y1969: T.word('L0108', '1969'),
      minsky: T.beat('minsky'),
      years: T.beat('years'),
      mistakes: T.word('L0108', 'mistakes'),
      mistEnd: T.wordEnd('L0108', 'mistakes'),
      dialEnd: T.wordEnd('L0105b', 'dial'),
      total: T.beat('sum'),
      decides: T.word('L0105b', 'decides'),
      wrong1: T.word('L0106', 'wrong'),
      nudge: T.beat('nudge'),
      wrong2: T.word('L0107', 'wrong'),
      wrong3: T.word('L0107', 'wrong#2'),
      again: T.word('L0107', 'again'),
      suddenly: T.word('L0107', 'suddenly'),
      right: T.beat('right'),
      l08: T.line('L0108').start,
      limit: T.beat('limit'),
      desc: T.beat('descendants'),
      l05End: T.line('L0105').end,
      inW: T.word('L0108', 'In'),
      showed: T.word('L0108', 'showed'),
      papertEnd: T.wordEnd('L0108', 'Papert'),
      papert: T.word('L0108', 'Papert'),
      faded: T.word('L0108', 'faded'),
      its: T.word('L0108', 'Its'),
      still: T.word('L0108', 'still'),
      todays: T.word('L0108', "today's"),
      networks: T.word('L0108', 'networks'),
      simple2: T.word('L0108', 'simple#2'),
    };
    const D = T.duration;
    // review round 1 camera: the iris opens on the retina (KR) and the camera pulls back over "Nobody gave it
    // the rule … Each lit cell" to the whole machine by "tugs"; a slow drift to "total"; from "total" a slow
    // push toward the needle and the lantern (onto the dial bank for "nudge", on to KP by "right"); a pull-back
    // to the whole stage over L0108's opening; the K3 push as the iris closes
    const cam = tl.channel<Camera3>('cam', KR, cam3Interp);
    const say = T.word('L0106', 'say');
    // round-1 critic: the reveal starts at once, so the needle is in frame by ≈ +3.9 for "it guesses"
    // review round 4: the entry truck lands by ≈ +3.9 s (26.9 s), so the whole gauge is framed on "guesses"; the
    // empty retina still holds the frame through the widened silence after "rule"
    tl.tween(cam, K0, { at: 0, dur: Math.max(2, b.guesses - 0.65), ease: ease.move });
    tl.tween(cam, KT, { at: b.tugs + 0.15, dur: Math.max(1, b.total - b.tugs - 0.15), ease: ease.move });
    tl.tween(cam, KN, { at: b.total, dur: Math.max(1, say - b.total), ease: ease.move });
    tl.tween(cam, KP, { at: say + 0.1, dur: Math.max(1, b.right - say - 0.1), ease: ease.move });
    tl.tween(cam, K2, { at: b.l08, dur: Math.max(1, b.limit + 0.6 - b.l08), ease: ease.move });
    const pushAt = irisStart(b);
    tl.tween(cam, K3, { at: pushAt, dur: Math.max(0.9, irisEnd(b) + 0.2 - pushAt), ease: ease.move });
    const lab = tl.channel<Camera3>('labCam', LAB0, cam3Interp);
    // the bookend breathes open under "today's neural networks": a ≈3.5 s pull-back, then a slow drift
    const fadeAt = Math.min(D - 1.2, b.mistEnd + 1.2);
    // round-1 critic: the pull-back runs from just after "descendants" to "mistakes"' end (≈4.5 s), see labCamAt
    const pb0 = b.desc + 0.15;
    const pb1 = Math.max(pb0 + 3.5, b.mistEnd + 0.2);
    const reveal = tl.channel('reveal', 0.35);
    tl.tween(reveal, 1, { at: 0, dur: b.shape - 0.2, ease: ease.enter });
    // headers arrive on the words that name their part, and leave as the iris closes
    const hRet = tl.channel('h.retina', 0);
    tl.tween(hRet, 1, { at: b.shape - 0.25, dur: 0.5, ease: ease.enter });
    tl.tween(hRet, 0, { at: b.shape + 2.2, dur: 0.6, ease: ease.move });
    // round-1 critic: the 'RESPONSE UNIT' header was up for under a second; dropped (the gauge's own
    // VERTICAL / HORIZONTAL faces and the 'threshold' label name it)
    const hResp = tl.channel('h.response', 0);
    const hDial = tl.channel('h.dials', 0);
    tl.tween(hDial, 1, { at: b.dialWord - 0.25, dur: 0.5, ease: ease.enter });
    tl.tween(hDial, 0, { at: Math.min(b.dialWord + 2.0, b.total + 0.1), dur: 0.5, ease: ease.move });
    tl.hold(0, D);
    const keys = schedule(b, D);
    // verdict captions: each lands 0.1 s before its word and clears as the next try's old shape goes
    const startOf = (k: number) => keys.find(([, v]) => v >= k)![0];
    // round-1 critic: every verdict holds ≥ 0.8 s after its word. Try 2's holds until just before try 3's lands
    // on "wrong" (#2); try 3's holds through "again"; try 5's comes in at ≈ +23.6 and holds to ≈ +25.6
    const words = [b.wrong1, b.wrong2, b.wrong3, b.right, b.p5 + 0.6];
    const caps: Cap[] = words.map((w, k) => {
      if (k === 1) return { k, at: w - 0.3, out: Math.max(w + 0.72, b.wrong3 - 0.22) };
      if (k === 2) return { k, at: w - 0.17, out: Math.max(w + 0.85, startOf(3) + 0.15) };
      if (k === 4) return { k, at: b.right + 0.76, out: b.l08 + 0.13 };
      return { k, at: w - 0.3, out: k < 4 ? Math.max(w + 0.8, startOf(k + 1) - 0.1) : b.l08 - 0.05 };
    });
    // the film's fade to black begins about 1.2 s after "mistakes" and completes on the last frame (fadeAt)
    return { tl, cam, lab, reveal, hRet, hResp, hDial, keys, b, dur: D, caps, fadeAt, pb0, pb1 };
  },
  paint(f, s, scene) {
    const t = f.t;
    const b = scene.b;
    const step = stepAt(scene.keys, Math.floor(t * 12 + 1e-9) / 12);
    // the match-dissolve: the lantern's glow (iris almost closed) becomes the eye's glow in the night lab
    // the dissolve lands so the night lab is readable by "Its" (descendants)
    const x0 = b.its - 0.6;
    const xu = sm((t - x0) / 0.45);
    const theatre = () =>
      paintTheatre(f, s.get(scene.cam), step, { reveal: s.get(scene.reveal), hRet: s.get(scene.hRet), hDial: s.get(scene.hDial), hResp: s.get(scene.hResp), b, t, caps: scene.caps });
    const open = sm((t - (b.its - 0.75)) / 0.8);
    void s.get(scene.lab);
    const labScene = (rim: boolean) => paintLab(f, labCamAt(t, scene.pb0, scene.pb1, scene.dur), { t, b, rim, open });
    if (xu <= 0) theatre();
    else if (xu >= 1) labScene(true);
    else {
      theatre();
      const snap = snapshot(f.c.canvas);
      labScene(false);
      const c = f.c;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = 1 - xu;
      c.drawImage(snap, 0, 0);
      c.restore();
    }
    // the era stamp (round-1 critic): on top of the iris and the dissolve, held until "descendants"
    // round-1 critic (continuity): the stamp, its plate and the book's shelf are gone by "descendants" − 0.6, so the
    // match-dissolve into the night lab lands in clean labGreen (no warm plate over the green close-up)
    eraStamp(f.c, MOODS.candleAmber, t, b, 1 - sm((t - (b.desc - 1.0)) / 0.4));
    // the film's last frames: a slow fade to black, starting about 1.2 s after "mistakes"
    const outU = sm((t - scene.fadeAt) / (scene.dur - scene.fadeAt));
    if (outU > 0) {
      const c = f.c;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = outU;
      c.fillStyle = '#000';
      c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      c.restore();
    }
  },
});
