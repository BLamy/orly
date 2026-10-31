/**
 * handwired-explained — DEVICE 1: the Promise Tags on the copper line, over the Lifespan Rule (the spine).
 * Built from script.json staging.tagLine (canonical) and staging.buildList.tagLine; every shot that shows the
 * line uses these painters so scale, colour code and placement never drift between shot authors.
 *
 *   import { tagLineScene, TAGS, tagsAt, drawTag, lifeX, LINE, RULE } from '../sets/tagLine';
 *   // a whole canonical shot (workshop, line, rule, tags), with hooks for the hands:
 *   tagLineScene(f, { variant: 'workshop', tags: tagsAt('ch03-s03', 'start'), l5: (c, env) => hands.draw(...) });
 *   // or the pieces, inside your own layers:
 *   f.layer('L4', (c, env) => { drawLine(c, env, {}); drawRule(c, env, {}); drawTags(c, env, states, {}) });
 *
 * GEOGRAPHY (staging.tagLine, rest-screen stage px at L4): the copper line at 58 % of frame height (LINE.y = 418),
 * strung between two turned posts; the Lifespan Rule lies FRONT-ON along the bench edge under it (RULE). L2 the tall
 * paned window wall (its sky carries the mood); L3 the workbench with the HandwiredOS desk's dimmed silhouette and
 * parchment plates pinned along its back edge; L4 line, rule, tags, threads; L5 the narrator's hands (lower left);
 * L6 the near post at frame right, where the red pencil rests. Chapter variants move the line height
 * (staging.tagLine.variants: VARIANT_LINE_Y); 'none' paints only the line, rule and tags for a shot's own room.
 *
 * ORDER: tags hang left to right by number (tag 1 far left, the blank why tag far right), with the question card qK
 * right of tag 1 and the 1992–2026 typed card right of tag 2; they never change places except in the ch12 re-hang
 * (pass x per tag there).
 *
 * LIFESPAN ENCODING (one rule, film-wide): a struck or ended thread drops to the rule at its MEASURED lifespan and ends
 * in a cut, dull tip ('frayed' where the bible's date is interpretive: tag 1's biology strand); a still-held thread
 * drops to its AGE AS OF 27 OCTOBER 2026 and ends in a glowing open tip with a short copper arrow pointing right.
 * Nothing runs past the rule's end except tag 1's engineering strand (about 83 years). Suspects (3, 4, 5) hang slack
 * with no drop; question cards (qK, why, nano) never drop. The rule is log-scaled; ticks an hour · a day · a week ·
 * a month · a year · a decade · a lifetime, labelled only an hour · a day · a year · a lifetime. No dates on the rule.
 *
 * A TAG (treatment Device 1): front in ink (the belief, paraphrase), the knot eyelet with its holder's typeset card(s)
 * (or visibly EMPTY), the back in red pencil (who doubted it), one red strike for a broken belief, a copper rivet for a
 * kept one, the red pencil resting beside a contested one, and a brass signature grommet only where the bible
 * settles it (empty on tag 1). Suspect tags carry a small faded 'suspect' rubber stamp (a prop mark, not text to read).
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { windowWall } from '../../../film/silhouette/architecture';
import timeline from '../timeline.json';
import { copperOf, drawPencil, pencilRed, PENCIL_MARK, type Pt } from './narratorHands';
import { handwiredDesk } from './handwiredDesk';

// ---------------------------------------------------------------- geometry
export const LINE = { x0: 70, x1: 1210, y: 418, sag: 10 } as const;
export const RULE = { x0: 120, x1: 1160, y: 606, h: 30 } as const;
/** tag size at scale 1 (stage px at L4); the eyelet sits STRING px under the line */
export const TAG = { w: 60, h: 86, string: 24 } as const;

/** chapter variants (staging.tagLine.variants): the line's height as a fraction of the frame */
export const VARIANT_LINE_Y: Record<string, number> = {
  ch01: 0.58, ch02: 0.5, ch03: 0.58, ch04: 0.66, ch05: 0.64, ch06: 0.4, ch07: 0.56, ch08: 0.52, ch09: 0.6, ch10: 0.48, ch11: 0.58, ch12: 0.58,
};
export const lineYFor = (shotId: string) => 720 * (VARIANT_LINE_Y[shotId.slice(0, 4)] ?? 0.58);

// ---------------------------------------------------------------- the registry
export type TagId = '1' | 'qK' | '2' | 'lineage' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'nano' | '11' | 'why';
export type TipKind = 'open' | 'cut' | 'frayed';
export interface Strand {
  /** lifespan or age in days */
  days: number;
  tip: TipKind;
  label?: string;
}
export interface TagDef {
  id: TagId;
  kind: 'tag' | 'question' | 'card' | 'border';
  /** the front (paraphrase, sentence case; quoted verbatim only where quotes.json has it) */
  front: string;
  /** a small second line under the front (tag 6's ternary, tag 9's hedge) */
  sub?: string;
  /** holder card(s) threaded through the eyelet; [] = the EMPTY knot (nobody in the record held it) */
  knot: string[];
  /** the doubt in red pencil on the back */
  back?: string[];
  stamp?: 'suspect';
  grommet?: 'empty' | 'stamped';
  /** threads to the rule (two for tag 1's split, tag 11's JSON / TOML) */
  strands?: Strand[];
  /** slack, no drop (suspects) */
  slack?: boolean;
  /** contested at the end: the pencil rests beside it */
  contested?: boolean;
}
const Y = 365.25;
export const TAGS: Record<TagId, TagDef> = {
  '1': { id: '1', kind: 'tag', front: 'The neuron is a logic gate', knot: ['McCulloch & Pitts, 1943'], grommet: 'empty', back: ['Kleene, 1951: obscure'], strands: [{ days: 77 * Y, tip: 'frayed', label: 'biology' }, { days: 83 * Y, tip: 'open', label: 'engineering' }] },
  qK: { id: 'qK', kind: 'question', front: '', knot: [] },
  '2': { id: '2', kind: 'tag', front: "Learn the weights; don't write them", knot: ['Sutton, 2019'], back: ['Brooks, 2019'], strands: [{ days: 7.6 * Y, tip: 'open' }], contested: true },
  lineage: { id: 'lineage', kind: 'card', front: '1992–2026', knot: [] },
  '3': { id: '3', kind: 'tag', front: 'Somebody trained it', knot: [], stamp: 'suspect', slack: true, back: ['the HandwiredOS README'] },
  '4': { id: '4', kind: 'tag', front: 'A tool turned ordinary JavaScript into it', knot: ['the README'], stamp: 'suspect', slack: true, back: ["the repo's own docs"] },
  '5': { id: '5', kind: 'tag', front: "It isn't really a network", knot: [], stamp: 'suspect', slack: true, back: ['the loom itself'] },
  '6': { id: '6', kind: 'tag', front: 'For an integer a', sub: '(a > 4) ? 10 : 12', knot: ['the README'], strands: [{ days: 13, tip: 'open' }] },
  '7': { id: '7', kind: 'tag', front: 'One evaluation per frame', knot: ["HandwiredOS's own design"], strands: [{ days: 99, tip: 'cut' }] },
  '8': { id: '8', kind: 'tag', front: 'Established conclusions: take these as given', knot: ['the July briefs'], strands: [{ days: 57, tip: 'cut' }] },
  '9': { id: '9', kind: 'tag', front: 'The GPU is the faster one', sub: '(for the highlighter half)', knot: ['09:01'], strands: [{ days: 0.3, tip: 'cut' }] },
  '10': { id: '10', kind: 'tag', front: 'fully differentiable!', knot: ["the README's tagline"], back: ['slope 0'], strands: [{ days: 13, tip: 'open' }], contested: true },
  nano: { id: 'nano', kind: 'question', front: 'nanoGPT?', knot: [] },
  '11': { id: '11', kind: 'border', front: "Gradient descent can fill a parser's unused entries", knot: ['the recovery experiment', 'the rule for failure, fixed beforehand'], strands: [{ days: 12, tip: 'open', label: 'JSON' }, { days: 1.5, tip: 'cut', label: 'TOML' }] },
  why: { id: 'why', kind: 'tag', front: '', knot: [], slack: true },
};
export const TAG_ORDER: TagId[] = ['1', 'qK', '2', 'lineage', '3', '4', '5', '6', '7', '8', '9', '10', '11', 'why'];
/** slot x (L4 rest px) per tag: cards take a narrower slot than tags. The nano question hangs FROM tag 10. */
export const SLOT_X: Record<TagId, number> = (() => {
  const wts = TAG_ORDER.map((id) => (TAGS[id].kind === 'tag' || TAGS[id].kind === 'border' ? 1 : 0.55));
  const total = wts.reduce((a, b) => a + b, 0);
  const x0 = 135, x1 = 1145;
  const out = {} as Record<TagId, number>;
  let acc = 0;
  TAG_ORDER.forEach((id, i) => {
    out[id] = x0 + ((acc + wts[i] / 2) / total) * (x1 - x0);
    acc += wts[i];
  });
  out.nano = out['10'] + 22;
  return out;
})();

// ---------------------------------------------------------------- the Lifespan Rule (log scale)
const LO = Math.log10(1 / 48); // half an hour
const HI = Math.log10(80 * Y); // a lifetime
export const TICKS: { days: number; label?: string }[] = [
  { days: 1 / 24, label: 'an hour' },
  { days: 1, label: 'a day' },
  { days: 7 },
  { days: 30.44 },
  { days: Y, label: 'a year' },
  { days: 10 * Y },
  { days: 80 * Y, label: 'a lifetime' },
];
/** rule x for a lifespan in days (L4 rest px); runs past RULE.x1 only beyond a lifetime */
export function lifeX(days: number, r: { x0: number; x1: number } = RULE): number {
  const u = (Math.log10(Math.max(1e-4, days)) - LO) / (HI - LO);
  const lifetimeX = r.x1 - 18;
  return r.x0 + 14 + u * (lifetimeX - (r.x0 + 14));
}

// ---------------------------------------------------------------- per-shot state
export interface TagState {
  id: TagId;
  /** override the slot x (ch12 re-hang) and the eyelet y */
  x?: number;
  y?: number;
  /** override the front / sub / knot / back from the registry */
  front?: string;
  sub?: string;
  knot?: string[];
  back?: string[];
  /** 0..1 the front's ink (written on as the narrator says it); default 1 */
  ink?: number;
  /** 0..1 how far the knot card(s) have threaded in; default 1 */
  knotIn?: number;
  /** 0..1 the tag turned over (front → back); draw with the hands' flip */
  flip?: number;
  /** 0..1 how much of the red back text is written (the pencil's stroke) */
  backInk?: number;
  /** 0..1 the red strike through the front */
  strike?: number;
  /** 0..1 the copper rivet punched in */
  rivet?: number;
  /** 0..1 the thread's drop to the rule (per strand: the same u, or an array) */
  drop?: number | number[];
  /** border tag (11): 0..1 the TOML half struck by its own rule */
  tomlStrike?: number;
  /** 0..1 presence (fade in when it swings in) */
  alpha?: number;
  /** swing amplitude (radians) and phase; the tag swings about its knot, on twos */
  swing?: number;
  phase?: number;
  /** the red pencil resting beside it (contested) */
  pencilRest?: boolean;
  /** red marks on the back as short strokes (tag 8's ten strokes): count and 0..1 progress */
  strokes?: { n: number; u: number };
  /** scale (1 = canonical); a highlight glow 0..1 (beat kicks) */
  scale?: number;
  glow?: number;
  /** text role: true when a shot pushes in to read the front (legibility audit) */
  subject?: boolean;
}

interface TagEvents {
  tie: string;
  drop?: string;
  strike?: string;
  rivet?: string;
  write?: string;
  untie?: string;
}
/** when each tag is tied, measured, struck, riveted (script staging + shot directions) */
export const TAG_EVENTS: Record<TagId, TagEvents> = {
  '3': { tie: 'ch01-s05', strike: 'ch03-s06', write: 'ch03-s06' },
  '4': { tie: 'ch01-s05', strike: 'ch03-s03', write: 'ch03-s03' },
  '5': { tie: 'ch01-s05', strike: 'ch05-s03', write: 'ch05-s03' },
  why: { tie: 'ch01-s05', write: 'ch10-s03' },
  '6': { tie: 'ch01-s07', rivet: 'ch10-s02', drop: 'ch10-s02' },
  '1': { tie: 'ch02-s01', drop: 'ch02-s04', write: 'ch02-s03' },
  qK: { tie: 'ch02-s03', untie: 'ch06-s12' },
  '2': { tie: 'ch02-s05', drop: 'ch02-s05', write: 'ch02-s05' },
  lineage: { tie: 'ch02-s06' },
  '7': { tie: 'ch06-s05b', strike: 'ch06-s05b', drop: 'ch06-s05b', write: 'ch06-s05b' },
  '10': { tie: 'ch07-s05', drop: 'ch07-s05', write: 'ch07-s05' },
  nano: { tie: 'ch07-s11' },
  '8': { tie: 'ch08-s02', drop: 'ch08-s03', write: 'ch08-s03', strike: 'ch08-s08' },
  '9': { tie: 'ch09-s03b', strike: 'ch09-s07', drop: 'ch09-s07' },
  '11': { tie: 'ch11-s02', drop: 'ch11-s02', rivet: 'ch11-s03', strike: 'ch11-s04' },
};
const SHOT_INDEX: Record<string, number> = Object.fromEntries((timeline as { shots: { id: string }[] }).shots.map((s, i) => [s.id, i]));
const idx = (id: string) => SHOT_INDEX[id] ?? Infinity;

/**
 * Canonical tag states for continuity: every tag tied before this shot ('start') or by its end ('end'), in the
 * state the film left it. A shot animates its own events on top (ink, flip, strike, rivet, drop progress).
 */
export function tagsAt(shotId: string, when: 'start' | 'end' = 'start'): TagState[] {
  const now = idx(shotId);
  const done = (s?: string) => s !== undefined && (when === 'end' ? idx(s) <= now : idx(s) < now);
  const out: TagState[] = [];
  (Object.keys(TAG_EVENTS) as TagId[]).forEach((id) => {
    const e = TAG_EVENTS[id];
    if (!done(e.tie) || done(e.untie)) return;
    const st: TagState = { id, ink: 1, knotIn: 1, flip: 0 };
    if (done(e.write)) st.backInk = 1;
    if (done(e.strike)) st.strike = id === '11' ? 0 : 1;
    if (id === '11' && done(e.strike)) st.tomlStrike = 1;
    if (done(e.rivet)) st.rivet = 1;
    if (done(e.drop)) st.drop = 1;
    if (TAGS[id].contested && done(e.drop)) st.pencilRest = true;
    if (id === 'why' && done(e.write)) st.back = ['why?'];
    out.push(st);
  });
  out.sort((a, b) => TAG_ORDER.indexOf(a.id) - TAG_ORDER.indexOf(b.id));
  return out;
}

// ---------------------------------------------------------------- painters
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function lw(c: CanvasRenderingContext2D, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}
/** the line's y at x (a gentle sag between the posts) */
export function lineYAt(x: number, o: { x0?: number; x1?: number; y?: number; sag?: number } = {}): number {
  const x0 = o.x0 ?? LINE.x0, x1 = o.x1 ?? LINE.x1, y = o.y ?? LINE.y, sag = o.sag ?? LINE.sag;
  const u = clamp01((x - x0) / (x1 - x0));
  return y + sag * 4 * u * (1 - u);
}

const manila = (env: PaintEnv, lift = 0) => mixLab(mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.core, lift * 0.35), env.mood.haze, env.layer.haze * 0.7);
const inkOn = (env: PaintEnv) => mixLab('#1d140d', env.mood.ink, 0.3);
const threadCol = (env: PaintEnv) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);

export interface LineOpts {
  x0?: number;
  x1?: number;
  y?: number;
  sag?: number;
  /** 0..1 copper glow (the backlight's peak catching it); default .5 */
  glow?: number;
  /** 0..1 how much of the line has drawn itself (ch01-s01: a thread drawing across the dark), from x0 */
  draw?: number;
  /** posts at both ends: 'post' (turned wooden posts, the workshop), 'stake' (fence stakes, ch10), 'none' */
  posts?: 'post' | 'stake' | 'none';
  /** 'bronze' for the older wire in ch02's period rooms */
  metal?: 'copper' | 'bronze';
}
/** the copper line between its posts (draw in L4) */
export function drawLine(c: CanvasRenderingContext2D, env: PaintEnv, o: LineOpts = {}) {
  const x0 = o.x0 ?? LINE.x0, x1 = o.x1 ?? LINE.x1, y = o.y ?? LINE.y;
  const glow = o.glow ?? 0.5;
  const u = clamp01(o.draw ?? 1);
  const ink = PUPPET_NEAR_BLACK;
  if ((o.posts ?? 'post') !== 'none') {
    for (const px of [x0, x1]) {
      c.fillStyle = env.layer.haze > 0.05 ? env.fill('ink') : ink;
      if (o.posts === 'stake') {
        c.beginPath();
        c.moveTo(px - 5, y - 14);
        c.lineTo(px, y - 22);
        c.lineTo(px + 5, y - 14);
        c.lineTo(px + 6, 760);
        c.lineTo(px - 6, 760);
        c.closePath();
        c.fill();
      } else {
        // a turned post: finial, collar, a long shaft down past the bench
        c.beginPath();
        c.ellipse(px, y - 22, 7, 8, 0, 0, Math.PI * 2);
        c.rect(px - 3, y - 15, 6, 6);
        c.rect(px - 8, y - 10, 16, 5);
        c.rect(px - 5.5, y - 6, 11, 800);
        c.rect(px - 9, y + 26, 18, 6);
        c.fill();
      }
      c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.8);
      c.lineWidth = lw(c, 2.4);
      c.beginPath();
      c.arc(px, y - 22, 7, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    }
  }
  if (u <= 0) return;
  const xe = x0 + (x1 - x0) * u;
  const pts = (k: number) => {
    const x = x0 + (xe - x0) * k;
    return { x, y: lineYAt(x, o) };
  };
  const metal = o.metal === 'bronze' ? mixLab('#8a6a3a', env.mood.halo, 0.2) : copperOf(env, glow);
  // glow underlay (additive) then the wire
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(env.mood.core, 0.12 * glow);
  c.lineWidth = lw(c, 7);
  c.beginPath();
  for (let k = 0; k <= 24; k++) {
    const p = pts(k / 24);
    if (k === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  c.restore();
  c.strokeStyle = metal;
  c.lineWidth = Math.max(lw(c, 2.2), 1.6);
  c.beginPath();
  for (let k = 0; k <= 24; k++) {
    const p = pts(k / 24);
    if (k === 0) c.moveTo(p.x, p.y);
    else c.lineTo(p.x, p.y);
  }
  c.stroke();
  // the bright top edge
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.55 * (0.4 + glow * 0.6));
  c.lineWidth = lw(c, 1);
  c.beginPath();
  for (let k = 0; k <= 24; k++) {
    const p = pts(k / 24);
    if (k === 0) c.moveTo(p.x, p.y - 0.8);
    else c.lineTo(p.x, p.y - 0.8);
  }
  c.stroke();
  // the drawing end glows while the line is still drawing itself
  if (u < 1) {
    const p = pts(1);
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
    g.addColorStop(0, withAlpha(env.mood.core, 0.8));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = g;
    c.fillRect(p.x - 26, p.y - 26, 52, 52);
    c.restore();
  }
}

export interface RuleOpts {
  x0?: number;
  x1?: number;
  y?: number;
  /** 0..1 presence (slides up from the bottom of frame in ch01-s07) */
  alpha?: number;
  /** 0..1 tick labels (an hour · a day · a year · a lifetime) */
  labels?: number;
  /** labels are the subject (ch01-s07 sets them as a label): enforce the legibility floor */
  labelSubject?: boolean;
  /** 0..1 each tick in turn (left to right) for a reveal; default all */
  ticks?: number;
}
/** the Lifespan Rule: a long paper ruler front-on with copper log-scale ticks (draw in L4) */
export function drawRule(c: CanvasRenderingContext2D, env: PaintEnv, o: RuleOpts = {}) {
  const x0 = o.x0 ?? RULE.x0, x1 = o.x1 ?? RULE.x1, y = o.y ?? RULE.y;
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0) return;
  const r = { x0, x1 };
  c.save();
  c.globalAlpha = a;
  const h = RULE.h;
  // the paper strip with a slight curl at each end and a soft cast shadow on the bench
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(x0 + 3, y + 4, x1 - x0, h);
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, manila(env, 0.25));
  g.addColorStop(1, mixLab(manila(env, 0), env.mood.set, 0.25));
  c.fillStyle = g;
  c.fillRect(x0, y, x1 - x0, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(x1, y);
  c.stroke();
  // minor log ticks (2..9 within each decade), faint
  const cop = mixLab(copperOf(env, 0.2), '#3a2210', 0.45);
  c.strokeStyle = withAlpha(cop, 0.5);
  c.lineWidth = lw(c, 1);
  c.beginPath();
  for (let d = Math.floor(LO); d <= Math.ceil(HI); d++) {
    for (let k = 2; k <= 9; k++) {
      const days = k * Math.pow(10, d);
      const x = lifeX(days, r);
      if (x < x0 + 6 || x > x1 - 14) continue;
      c.moveTo(x, y);
      c.lineTo(x, y + h * 0.22);
    }
  }
  c.stroke();
  // major ticks
  const tk = o.ticks ?? 1;
  TICKS.forEach((t, i) => {
    const on = clamp01(tk * TICKS.length - i);
    if (on <= 0) return;
    const x = lifeX(t.days, r);
    c.strokeStyle = withAlpha(cop, 0.95 * on);
    c.lineWidth = lw(c, t.label ? 2.4 : 1.8);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x, y + h * (t.label ? 0.62 : 0.42));
    c.stroke();
  });
  // labels: under the strip, centred on their ticks
  const la = clamp01(o.labels ?? 1);
  if (la > 0) {
    textRole(c, o.labelSubject ? 'subject' : 'texture', () => {
      const base = `italic 15px ${FONT.display}`;
      const size = o.labelSubject ? legibleSize(c, base, 15) : 15;
      c.font = `italic ${size}px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.3), 0.92 * la);
      TICKS.forEach((t, i) => {
        if (!t.label) return;
        const on = clamp01(tk * TICKS.length - i);
        if (on <= 0) return;
        c.globalAlpha = a * on;
        c.fillText(t.label, lifeX(t.days, r), y + h + 6);
      });
      c.textAlign = 'left';
    });
  }
  c.restore();
}

/**
 * A fine thread from the tag's bottom (x, y): it DROPS straight down to the rule, turns, and runs along the rule's
 * face to its lifespan x = lx, where it ends in its tip (u = 0..1 progress along the whole thread). `lane` stacks
 * the runs of several threads on the rule's face (0 = top) so they never lie on top of each other.
 */
export function drawThread(c: CanvasRenderingContext2D, env: PaintEnv, from: Pt, lx: number, tip: TipKind, u = 1, o: { ruleY?: number; glow?: number; lane?: number } = {}) {
  const ry = (o.ruleY ?? RULE.y) + 5 + (o.lane ?? 0) * 2.6;
  const U = clamp01(u);
  if (U <= 0) return;
  const R = 10;
  const dir = lx >= from.x ? 1 : -1;
  const drop = Math.max(0, ry - R - from.y);
  const run = Math.max(0, Math.abs(lx - from.x) - R);
  const corner = (Math.PI / 2) * R;
  const total = drop + corner + run;
  let len = U * total;
  c.lineWidth = Math.max(lw(c, 1.3), 0.9);
  c.lineCap = 'round';
  // the hanging part (light thread against the haze)
  c.strokeStyle = threadCol(env);
  c.beginPath();
  c.moveTo(from.x, from.y);
  const d1 = Math.min(len, drop);
  c.lineTo(from.x, from.y + d1);
  len -= d1;
  let end = { x: from.x, y: from.y + d1 };
  if (len > 0) {
    const k = Math.min(1, len / corner);
    const a0 = dir > 0 ? Math.PI : 0;
    const cx = from.x + dir * R, cy = from.y + drop;
    const steps = 6;
    for (let i = 1; i <= steps; i++) {
      const th = a0 - dir * (Math.PI / 2) * (k * i / steps);
      end = { x: cx + Math.cos(th) * R, y: cy + Math.sin(th) * R };
      c.lineTo(end.x, end.y);
    }
    len -= Math.min(len, corner);
  }
  c.stroke();
  // the run along the rule's face (darker thread so it reads on the paper)
  if (len > 0) {
    c.strokeStyle = withAlpha(mixLab('#4a2f1a', env.mood.ink, 0.3), 0.85);
    c.beginPath();
    c.moveTo(end.x, ry);
    c.lineTo(end.x + dir * Math.min(len, run), ry);
    c.stroke();
  }
  if (U < 1) return;
  const e = { x: lx, y: ry };
  if (tip === 'open') {
    // a glowing open tip with a short copper arrow pointing right (still held)
    const gl = o.glow ?? 1;
    const g = c.createRadialGradient(e.x, e.y, 0, e.x, e.y, 16);
    g.addColorStop(0, withAlpha(env.mood.core, 0.75 * gl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = g;
    c.fillRect(e.x - 16, e.y - 16, 32, 32);
    c.restore();
    c.strokeStyle = copperOf(env, 0.8);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(e.x, e.y + 4);
    c.lineTo(e.x + 16, e.y + 4);
    c.moveTo(e.x + 11, e.y);
    c.lineTo(e.x + 16, e.y + 4);
    c.lineTo(e.x + 11, e.y + 8);
    c.stroke();
    c.fillStyle = mixLab(env.mood.core, '#ffffff', 0.2);
    c.beginPath();
    c.arc(e.x, e.y, 2.2, 0, Math.PI * 2);
    c.fill();
  } else if (tip === 'cut') {
    // a cut, dull tip: a short dark crossbar and a dull end
    c.strokeStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.9);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(e.x - 4, e.y - 1);
    c.lineTo(e.x + 4, e.y + 1);
    c.stroke();
  } else {
    // frayed: a few splayed fibres
    c.strokeStyle = threadCol(env);
    c.lineWidth = lw(c, 1);
    c.beginPath();
    for (let k = -2; k <= 2; k++) {
      c.moveTo(e.x, e.y - 4);
      c.lineTo(e.x + k * 2.6, e.y + 3 + Math.abs(k));
    }
    c.stroke();
  }
}

function tagPath(w: number, h: number, kind: TagDef['kind']): Path2D {
  const p = new Path2D();
  if (kind === 'question' || kind === 'card') {
    p.rect(-w / 2, 0, w, h);
    return p;
  }
  const k = w * 0.2;
  p.moveTo(-w / 2 + k, 0);
  p.lineTo(w / 2 - k, 0);
  p.lineTo(w / 2, k);
  p.lineTo(w / 2, h);
  p.lineTo(-w / 2, h);
  p.lineTo(-w / 2, k);
  p.closePath();
  return p;
}

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

export interface DrawTagOpts {
  /** the eyelet point (where the string meets the tag), world; default from the slot under the line */
  at?: Pt;
  /** the knot point on the line (string top); default straight above the eyelet */
  knotAt?: Pt;
  /** shot time (on twos) for the swing */
  tq?: number;
}

/** one tag (or question / typed card) hanging from the line, in its current state (draw in L4) */
export function drawTag(c: CanvasRenderingContext2D, env: PaintEnv, st: TagState, o: DrawTagOpts = {}) {
  const def = TAGS[st.id];
  const a = clamp01(st.alpha ?? 1);
  if (a <= 0) return;
  const s = st.scale ?? 1;
  const x = st.x ?? o.at?.x ?? SLOT_X[st.id];
  const knot = o.knotAt ?? { x, y: lineYAt(x) };
  const small = def.kind === 'question' || def.kind === 'card';
  const w = (small ? TAG.w * 0.62 : TAG.w) * s;
  const h = (small ? TAG.w * 0.62 : TAG.h) * s;
  const eye = o.at ?? { x, y: (st.y ?? knot.y + TAG.string * s) };
  const tq = o.tq ?? env.tq;
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? SLOT_X[st.id] * 0.013));
  c.save();
  c.globalAlpha = a;
  // the string: from the knot on the line to the eyelet (a lark's-head loop over the wire)
  c.strokeStyle = threadCol(env);
  c.lineWidth = Math.max(lw(c, 1.2), 0.8);
  c.beginPath();
  c.moveTo(knot.x - 2.5 * s, knot.y);
  c.lineTo(eye.x, eye.y);
  c.lineTo(knot.x + 2.5 * s, knot.y);
  c.stroke();
  c.beginPath();
  c.ellipse(knot.x, knot.y, 3 * s, 2.2 * s, 0, 0, Math.PI * 2);
  c.stroke();
  // the tag swings about its eyelet
  c.translate(eye.x, eye.y);
  c.rotate(swing);
  const flip = clamp01(st.flip ?? 0);
  const sx = Math.cos(Math.PI * flip);
  const showBack = sx < 0;
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  const body = tagPath(w, h, def.kind);
  // drop shadow on the haze, then the paper
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.save();
  c.translate(2 * s, 3 * s);
  c.fill(body);
  c.restore();
  const g = c.createLinearGradient(0, 0, 0, h);
  const lift = (st.glow ?? 0) * 0.8 + 0.15;
  g.addColorStop(0, manila(env, lift + 0.1));
  g.addColorStop(1, mixLab(manila(env, lift), env.mood.set, showBack ? 0.28 : 0.18));
  c.fillStyle = g;
  c.fill(body);
  // the backlight rim on the tag's top edge
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.7);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(-w / 2 + w * 0.2, 0);
  c.lineTo(w / 2 - w * 0.2, 0);
  c.stroke();
  // the reinforced eyelet
  c.fillStyle = mixLab(manila(env, 0), env.mood.set, 0.35);
  c.beginPath();
  c.arc(0, 7 * s, 5 * s, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
  c.beginPath();
  c.arc(0, 7 * s, 2.2 * s, 0, Math.PI * 2);
  c.fill();
  const role = st.subject ? 'subject' : 'texture';
  if (!showBack) {
    // FRONT
    const ink = clamp01(st.ink ?? 1);
    if (def.stamp === 'suspect') {
      c.save();
      c.translate(w * 0.18, 18 * s);
      c.rotate(-0.08);
      textRole(c, 'texture', () => {
        c.font = `${(6.2 * s).toFixed(2)}px ${FONT.typewriter}`;
        c.fillStyle = withAlpha(mixLab('#8a4a36', env.mood.halo, 0.25), 0.55);
        c.textAlign = 'center';
        c.fillText('suspect', 0, 0);
        c.strokeStyle = withAlpha(mixLab('#8a4a36', env.mood.halo, 0.25), 0.45);
        c.lineWidth = lw(c, 0.8);
        c.strokeRect(-13 * s, -6.5 * s, 26 * s, 8.5 * s);
      });
      c.restore();
    }
    const front = st.front ?? def.front;
    if (front && ink > 0) {
      textRole(c, role, () => {
        const fs = (small ? 7.5 : 9.6) * s;
        c.font = `${fs.toFixed(2)}px ${FONT.fell}`;
        c.fillStyle = inkOn(env);
        c.textAlign = 'center';
        c.textBaseline = 'alphabetic';
        const lines = wrap(c, front, w * 0.84);
        const lh = fs * 1.12;
        const top = (small ? h * 0.42 : 26 * s) + fs * 0.8;
        // ink in by characters across all lines
        const total = lines.reduce((n, l) => n + l.length, 0);
        let budget = Math.ceil(total * ink);
        lines.forEach((l, i) => {
          if (budget <= 0) return;
          const t = l.slice(0, budget);
          budget -= l.length;
          const tw = c.measureText(l).width;
          c.textAlign = 'left';
          c.fillText(t, -tw / 2, top + i * lh);
        });
        const sub = st.sub ?? def.sub;
        if (sub && ink >= 1) {
          c.font = `italic ${(fs * 0.82).toFixed(2)}px ${FONT.text}`;
          c.textAlign = 'center';
          c.fillStyle = withAlpha(inkOn(env), 0.8);
          c.fillText(sub, 0, top + lines.length * lh + fs * 0.4);
        }
      });
    }
    if (def.kind === 'question' && st.id === 'qK') {
      // the dial's outline only (no words)
      c.strokeStyle = withAlpha(inkOn(env), 0.7);
      c.lineWidth = lw(c, 1.2);
      c.beginPath();
      c.arc(0, h * 0.58, w * 0.28, Math.PI * 0.9, Math.PI * 2.1);
      c.moveTo(0, h * 0.58);
      c.lineTo(w * 0.16, h * 0.42);
      c.stroke();
    }
    if (def.kind === 'border') {
      // the perforation down the middle; the TOML half (right) struck by its own rule
      c.strokeStyle = withAlpha(inkOn(env), 0.45);
      c.setLineDash([lw(c, 2.5), lw(c, 2.5)]);
      c.lineWidth = lw(c, 1);
      c.beginPath();
      c.moveTo(0, 14 * s);
      c.lineTo(0, h);
      c.stroke();
      c.setLineDash([]);
      const ts = clamp01(st.tomlStrike ?? 0);
      if (ts > 0) redStroke(c, env, { x: w * 0.05, y: h * 0.85 }, { x: w * 0.46, y: h * 0.3 }, ts, s);
    }
    const sk = clamp01(st.strike ?? 0);
    if (sk > 0) redStroke(c, env, { x: -w * 0.44, y: h * 0.82 }, { x: w * 0.44, y: h * 0.26 }, sk, s);
    if (def.grommet) {
      c.strokeStyle = mixLab('#b08d4a', env.mood.halo, 0.3);
      c.lineWidth = Math.max(lw(c, 1.4), 1.6 * s);
      c.beginPath();
      c.arc(w * 0.34, h - 9 * s, 3.4 * s, 0, Math.PI * 2);
      c.stroke();
      if (def.grommet === 'stamped') {
        c.fillStyle = mixLab('#b08d4a', env.mood.core, 0.3);
        c.beginPath();
        c.arc(w * 0.34, h - 9 * s, 1.6 * s, 0, Math.PI * 2);
        c.fill();
      }
    }
  } else {
    // BACK: the doubt in red pencil (mirrored so it reads)
    c.scale(-1, 1);
    const back = st.back ?? def.back ?? [];
    const bi = clamp01(st.backInk ?? 1);
    if (back.length && bi > 0) {
      textRole(c, role, () => {
        const fs = 9.4 * s;
        c.font = `italic ${fs.toFixed(2)}px ${FONT.fell}`;
        c.fillStyle = pencilRed(env, 0.95);
        c.textAlign = 'left';
        let budget = Math.ceil(back.reduce((n, l) => n + l.length, 0) * bi);
        let row = 0;
        back.forEach((l) => {
          wrap(c, l, w * 0.84).forEach((ln) => {
            if (budget <= 0) return;
            const tw = c.measureText(ln).width;
            c.fillText(ln.slice(0, budget), -tw / 2, 28 * s + fs * 0.8 + row * fs * 1.15);
            budget -= ln.length;
            row++;
          });
        });
      });
    }
    const strokes = st.strokes;
    if (strokes && strokes.n > 0) {
      const n = Math.floor(strokes.n * clamp01(strokes.u) + 1e-6);
      c.strokeStyle = pencilRed(env, 0.95);
      c.lineWidth = Math.max(lw(c, 1.6), 1.4 * s);
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < n; i++) {
        const row = Math.floor(i / 5), col = i % 5;
        const bx = -w * 0.36 + col * w * 0.16, by = h * 0.55 + row * 12 * s;
        c.moveTo(bx, by + 6 * s);
        c.lineTo(bx + w * 0.08, by - 3 * s);
      }
      c.stroke();
    }
  }
  c.restore();

  // knot cards threaded through the eyelet (unflipped, hanging to the left of the string)
  const kn = st.knot ?? def.knot;
  const kin = clamp01(st.knotIn ?? 1);
  if (kn.length && kin > 0) {
    c.save();
    c.globalAlpha = a * kin;
    kn.forEach((label, i) => {
      textRole(c, role, () => {
        const fs = 6.6 * s;
        c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
        const tw = c.measureText(label).width;
        const cw = tw + 8 * s, ch = fs + 6 * s;
        const kx = eye.x - cw - 6 * s - i * 4 * s, ky = eye.y - ch * 0.4 + i * (ch + 2 * s) + (1 - kin) * -8 * s;
        c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
        c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
        c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
        c.fillRect(kx, ky, cw, ch);
        c.strokeStyle = threadCol(env);
        c.lineWidth = lw(c, 0.9);
        c.beginPath();
        c.moveTo(kx + cw, ky + ch * 0.5);
        c.lineTo(eye.x, eye.y + 7 * s);
        c.stroke();
        c.fillStyle = inkOn(env);
        c.textBaseline = 'middle';
        c.fillText(label, kx + 4 * s, ky + ch * 0.55);
      });
    });
    c.restore();
  }

  // the copper rivet through the corner (a kept belief)
  const rv = clamp01(st.rivet ?? 0);
  if (rv > 0 && !showBack) {
    const pop = rv < 1 ? 1 + 0.4 * Math.sin(rv * Math.PI) : 1;
    const rx = eye.x + Math.cos(swing) * (-w * 0.3) - Math.sin(swing) * (16 * s);
    const ry = eye.y + Math.sin(swing) * (-w * 0.3) + Math.cos(swing) * (16 * s);
    c.fillStyle = copperOf(env, 0.4);
    c.beginPath();
    c.arc(rx, ry, 3.6 * s * pop, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.8);
    c.beginPath();
    c.arc(rx - 1 * s, ry - 1 * s, 1.1 * s, 0, Math.PI * 2);
    c.fill();
  }
}

function redStroke(c: CanvasRenderingContext2D, env: PaintEnv, p0: Pt, p1: Pt, u: number, s: number) {
  c.strokeStyle = pencilRed(env, 0.95);
  c.lineWidth = Math.max(lw(c, 2.2), 2.2 * s);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  // a firm stroke with a hair of wobble (dry pencil)
  const N = 10;
  for (let k = 1; k <= N; k++) {
    const t = (k / N) * u;
    c.lineTo(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t + Math.sin(t * 17) * 0.6 * s);
  }
  c.stroke();
}

/** the tag's eyelet and bottom (world) for a state: thread origins, hand targets */
export function tagAnchors(st: TagState) {
  const def = TAGS[st.id];
  const s = st.scale ?? 1;
  const x = st.x ?? SLOT_X[st.id];
  const knot = { x, y: lineYAt(x) };
  const small = def.kind === 'question' || def.kind === 'card';
  const h = (small ? TAG.w * 0.62 : TAG.h) * s;
  const eye = { x, y: st.y ?? knot.y + TAG.string * s };
  return { knot, eye, bottom: { x, y: eye.y + h }, centre: { x, y: eye.y + h / 2 }, corner: { x: x + TAG.w * 0.3 * s, y: eye.y + h * 0.8 } };
}

/**
 * The world geometry of a tag's red strike (unswung), for the pencil hand:
 *   const k = tagStrike(st); hands.pencil('strike', u, k.centre, { strikeW: k.w, strikeAngle: k.angle })
 * and draw the tag with strike = the pose's `stroke`, so lead and mark move together.
 */
export function tagStrike(st: TagState) {
  const an = tagAnchors(st);
  const s = st.scale ?? 1;
  const w = TAG.w * s, h = TAG.h * s;
  const p0 = { x: an.eye.x - w * 0.44, y: an.eye.y + h * 0.82 };
  const p1 = { x: an.eye.x + w * 0.44, y: an.eye.y + h * 0.26 };
  return { p0, p1, centre: { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 }, w: Math.hypot(p1.x - p0.x, p1.y - p0.y), angle: Math.atan2(p1.y - p0.y, p1.x - p0.x) };
}

export interface TagsOpts {
  tq?: number;
  ruleY?: number;
  ruleX?: { x0: number; x1: number };
  /** where the red pencil rests for contested tags: 'beside' (leaning on the line by the tag), or none */
  pencil?: 'beside' | 'none';
}
/** all threads (behind) then all tags, in order (draw in L4 after drawLine / drawRule) */
export function drawTags(c: CanvasRenderingContext2D, env: PaintEnv, states: TagState[], o: TagsOpts = {}) {
  const r = o.ruleX ?? RULE;
  let lane = 0;
  for (const st of states) {
    const def = TAGS[st.id];
    const an = tagAnchors(st);
    const a = clamp01(st.alpha ?? 1);
    if (a <= 0) continue;
    c.save();
    c.globalAlpha = a;
    if (def.slack || def.kind === 'question' || def.kind === 'card') {
      // a short slack loop under the tag: no lifespan
      if (def.slack) {
        c.strokeStyle = threadCol(env);
        c.lineWidth = Math.max(lw(c, 1.2), 0.8);
        c.beginPath();
        c.moveTo(an.bottom.x, an.bottom.y);
        c.bezierCurveTo(an.bottom.x - 6, an.bottom.y + 22, an.bottom.x + 12, an.bottom.y + 26, an.bottom.x + 4, an.bottom.y + 38);
        c.stroke();
      }
    } else if (def.strands && st.drop !== undefined) {
      def.strands.forEach((sd, i) => {
        const u = Array.isArray(st.drop) ? st.drop[i] ?? 0 : st.drop ?? 0;
        const from = def.strands!.length > 1 ? { x: an.bottom.x + (i === 0 ? -8 : 8), y: an.bottom.y } : an.bottom;
        drawThread(c, env, from, lifeX(sd.days, r), sd.tip, u, { ruleY: o.ruleY, lane: lane++ });
      });
    }
    c.restore();
  }
  for (const st of states) drawTag(c, env, st, { tq: o.tq });
  if ((o.pencil ?? 'beside') === 'beside') {
    for (const st of states) {
      if (!st.pencilRest) continue;
      const an = tagAnchors(st);
      // leaning against the tag's right edge, point down on the line's shadow: beside it, never on it
      drawPencil(c, { x: an.eye.x + TAG.w * 0.62, y: an.bottom.y - 6 }, Math.PI * 0.5 + 0.28, 62, env);
    }
  }
}

// ---------------------------------------------------------------- the workshop (canonical set)
export type Variant = 'workshop' | 'cold' | 'doors' | 'none';
export interface SceneOpts {
  variant?: Variant;
  tags?: TagState[];
  line?: LineOpts;
  rule?: RuleOpts | false;
  /** the desk on the bench: 0..1 lit from inside (ch03: the X-ray has begun), X-ray flags */
  desk?: { translucency?: number; lamp?: number; xray?: { table?: number; gates?: number; loom?: number; clockwork?: number; valve?: number } } | false;
  /** the bench lamp's intensity (practical), default .9 */
  lamp?: number;
  /** extra drawing hooks, in paint order */
  l3?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  l4?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  l5?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  l6?: (c: CanvasRenderingContext2D, env: PaintEnv) => void;
  /** where the red pencil lies on the near post (L6) when it is not writing; default true in workshop variants */
  pencilOnPost?: boolean;
  /** cache key salt (shot id) */
  key?: string;
  /** backlight sun x */
  sunX?: number;
  /** extended art bounds for camera moves (layer rest px): default a generous pad */
  pad?: number;
}

/** where the red pencil rests on the near L6 post (L6 rest px) */
export const NEAR_POST = { x: 1218, y: 470 } as const;

/**
 * The whole canonical tag-line shot: backlight, L2 window wall, fog A, L3 bench + desk + plates + lamp, fog B,
 * L4 line, rule, threads, tags (+ your l4), rim, the lamp practical, L5 (your hands), L6 near post (+ pencil).
 * Call after f.camera(...). 'none' skips the room (draw your own L1-L3 first, then call with variant 'none').
 */
export function tagLineScene(f: Frame, o: SceneOpts = {}) {
  const v = o.variant ?? 'workshop';
  const key = `hw-tl/${o.key ?? ''}/${v}`;
  const pad = o.pad ?? 260;
  const lamp = o.lamp ?? 0.9;
  if (v !== 'none') {
    f.backlight({ sunX: o.sunX ?? 640, intensity: v === 'cold' ? 0.75 : 1 });
    f.layer('L2', (c, env) => {
      f.cached(`${key}/L2/${env.mood.id}`, 1280 + 2 * pad, 720 + pad, (cc) => {
        cc.translate(pad, pad / 2);
        if (v === 'doors') doorsBack(cc, env, pad);
        else workshopWall(cc, env, v === 'cold', pad);
      })(c, -pad, -pad / 2);
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      if (v !== 'doors') {
        f.cached(`${key}/L3/${env.mood.id}`, 1280 + 2 * pad, 360, (cc) => {
          cc.translate(pad, -400);
          benchBack(cc, env, pad);
        })(c, -pad, 400);
        if (o.desk !== false) {
          const d = o.desk || {};
          handwiredDesk(f, c, env, { x: 470, y: 400, w: 300, proscenium: true, lamp: d.lamp ?? 0.4, translucency: d.translucency ?? 0, xray: d.xray, key: `${key}/bench`, wallpaper: 0.8 });
        }
      } else doorsMid(c, env);
      o.l3?.(c, env);
    });
    f.fog('B');
  }
  // the bench lamp sits behind the action plane: paint its light before L4 so the tags occlude it
  if (v === 'workshop' || v === 'cold') f.practical({ x: 300, y: 488, kind: 'lamp', seed: 41, intensity: lamp * (v === 'cold' ? 0.5 : 1), radius: 60, layer: 'L3' });
  f.layer('L4', (c, env) => {
    drawLine(c, env, { posts: v === 'doors' ? 'stake' : 'post', ...o.line });
    if (o.rule !== false) drawRule(c, env, o.rule || {});
    drawTags(c, env, o.tags ?? [], { tq: env.tq });
    o.l4?.(c, env);
  });
  f.rim({ x: 0, y: -1 });
  if (o.l5) f.layer('L5', (c, env) => o.l5!(c, env));
  f.layer('L6', (c, env) => {
    if (v !== 'none') {
      f.cached(`${key}/L6/${env.mood.id}`, 200, 900, (cc) => {
        cc.translate(-1130, 0);
        nearPost(cc, env, v);
      })(c, 1130, 0);
    }
    if (o.pencilOnPost ?? v !== 'none') drawPencil(c, { x: NEAR_POST.x - 46, y: NEAR_POST.y - 6 }, Math.PI - 0.18, 120, env);
    o.l6?.(c, env);
  });
}

/** L2: a tall paned window wall (flat-headed workshop windows; the sky carries the mood) */
function workshopWall(c: CanvasRenderingContext2D, env: PaintEnv, frost: boolean, pad: number) {
  windowWall(c, {
    x: -pad, y: -60, w: 1280 + 2 * pad, h: 760, centers: [-80, 250, 640, 1030, 1360], winW: 230, apex: 40, sill: 560,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: frost ? 1 : 0.6, seed: 23,
  }, env);
  if (frost) {
    // frosted panes (ch08: the cold window): a pale bloom creeping in from each window's lower corners
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.12);
    for (const cx of [250, 640, 1030]) {
      const g = c.createRadialGradient(cx, 560, 10, cx, 560, 180);
      g.addColorStop(0, withAlpha('#f4f8fa', 0.28));
      g.addColorStop(1, withAlpha('#f4f8fa', 0));
      c.fillStyle = g;
      c.fillRect(cx - 120, 300, 240, 260);
    }
  }
}

/** L3: the workbench (top edge at y ≈ 560), parchment plates pinned along its back edge, an anglepoise lamp */
function benchBack(c: CanvasRenderingContext2D, env: PaintEnv, pad: number) {
  const ink = env.fill('set');
  // parchment plates pinned along the back edge (texture, no readable text)
  const plates = [[120, 470, 120, 84], [300, 492, 96, 66], [860, 480, 110, 76], [1020, 470, 130, 90]];
  for (const [x, y, w, h] of plates) {
    c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.35);
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(env.mood.ink, 0.22);
    for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.12, y + h * (0.22 + i * 0.17), w * (0.7 - (i % 2) * 0.2), 1.6);
    c.fillStyle = mixLab('#b08d4a', env.mood.halo, 0.3);
    c.beginPath();
    c.arc(x + w / 2, y + 5, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  // the lamp (folded anglepoise silhouette) at left
  c.fillStyle = ink;
  c.beginPath();
  c.rect(286, 548, 32, 8);
  c.moveTo(300, 550);
  c.lineTo(296, 500);
  c.lineTo(302, 500);
  c.lineTo(306, 550);
  c.moveTo(296, 502);
  c.lineTo(286, 470);
  c.lineTo(292, 468);
  c.lineTo(302, 500);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(280, 468);
  c.lineTo(310, 474);
  c.lineTo(304, 492);
  c.lineTo(286, 488);
  c.closePath();
  c.fill();
  // the bench top and its body, edge-on, running past the frame
  c.fillStyle = ink;
  c.fillRect(-pad, 556, 1280 + 2 * pad, 14);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.35);
  c.fillRect(-pad, 570, 1280 + 2 * pad, 200);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-pad, 556);
  c.lineTo(1280 + pad, 556);
  c.stroke();
  // drawer fronts (cut-lines)
  c.strokeStyle = withAlpha(env.mood.rim, 0.12);
  for (let x = -pad + 40; x < 1280 + pad; x += 210) c.strokeRect(x, 584, 170, 46);
}

/** ch10 OUT OF DOORS: misty hills at dusk and the far ridge of lit windows (L2) */
function doorsBack(c: CanvasRenderingContext2D, env: PaintEnv, pad: number) {
  const ridge = (y: number, amp: number, seed: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-pad, 760);
    for (let x = -pad; x <= 1280 + pad; x += 20) c.lineTo(x, y + amp * Math.sin(x * 0.006 + seed) + amp * 0.5 * Math.sin(x * 0.017 + seed * 2));
    c.lineTo(1280 + pad, 760);
    c.closePath();
    c.fill();
  };
  ridge(430, 22, 1, mixLab(env.mood.set, env.mood.haze, 0.6));
  // the far ridge of lit windows
  for (let i = 0; i < 40; i++) {
    const x = -pad + ((i * 97) % (1280 + 2 * pad));
    const y = 424 + 22 * Math.sin(x * 0.006 + 1) - 4 - (i % 3) * 3;
    c.fillStyle = withAlpha(env.mood.core, 0.35 + (i % 4) * 0.1);
    c.fillRect(x, y, 3, 2.5);
  }
  ridge(500, 30, 3, mixLab(env.mood.set, env.mood.haze, 0.35));
}
function doorsMid(c: CanvasRenderingContext2D, env: PaintEnv) {
  c.fillStyle = env.fill('set');
  c.beginPath();
  c.moveTo(-300, 760);
  for (let x = -300; x <= 1580; x += 20) c.lineTo(x, 580 + 18 * Math.sin(x * 0.004 + 2));
  c.lineTo(1580, 760);
  c.closePath();
  c.fill();
}

/** L6: the near post at frame right (a big soft turned post; the pencil rests on its cap rail) */
function nearPost(c: CanvasRenderingContext2D, env: PaintEnv, v: Variant) {
  const ink = env.fill('fg');
  c.fillStyle = ink;
  c.beginPath();
  if (v === 'doors') {
    c.moveTo(1190, 440);
    c.lineTo(1215, 418);
    c.lineTo(1240, 440);
    c.lineTo(1246, 900);
    c.lineTo(1184, 900);
  } else {
    c.ellipse(1218, 452, 26, 18, 0, 0, Math.PI * 2);
    c.rect(1190, 462, 56, 14);
    c.rect(1198, 476, 40, 430);
    c.rect(1186, 600, 64, 16);
  }
  c.closePath();
  c.fill();
}
