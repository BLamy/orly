/**
 * ch09-s03b — TAG 9 IS TIED ON, already hedged (serverCyan, crossfade in from the copper-flecked map; 8.29 s).
 *   L0914 "On the thirteenth, a hedged write-up tied on a tag: the GPU is faster."
 *
 * TAG-LINE STAGING, ch09 variant (THE CYAN GRAIN): the copper line strung inside the search hall at 60 % of frame
 * height, the Lifespan Rule along the bottom (its four labels and unlabelled week / month / decade ticks, sets/tagLine),
 * the earlier tags hanging soft in the haze (tagsAt: the film's continuity). Back planes: L2 the hall's window wall,
 * L3 the search map faint behind the line (its copper flecks still shimmering, sets/ch09-s03-searchMap), fog, L4 the
 * line, rule and tags (sharp), L5 a hall pillar at the left edge (soft). The red pencil is nowhere in frame yet.
 *
 * TEACHES:
 *   0 -> 1.2       the wide: the line, its tags, the rule, the map grain behind.
 *   1.2 -> 4.3     a slow push in on tag 9 (it lands as the line names the claim: "the GPU is faster").
 *   2.77 tied      tag 9 swings in from the right and is tied on (the knot pulls down: the detent's tie click); its
 *                  knot card carries only the time, 09:01; the date stamp 13 OCTOBER 2026 · 09:01 sets in. Its front:
 *                  THE GPU IS THE FASTER ONE, and a small pencilled qualifier under it, (for the highlighter half).
 *   5.31 faster    the qualifier darkens a shade (a soft graphite underscore), and the tag turns gently on its thread
 *                  toward the hall, as if to face the test that is coming.
 *   hold           the unstruck tag, its thread just begun.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, mixLab, placeStamp, textProbe, textRole, withAlpha } from '../../../film';
import { LINE, SLOT_X, TAG, drawLine, drawRule, drawTags, lineYAt, lineYFor, tagsAt, type TagState } from '../sets/tagLine';
import { drawSearchMap, mapView, searchHallWall, MAP } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, releaseSwing, seg, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s03b';

/** the ch09 line height (staging.tagLine.variants: 60 %), as an offset from the canonical line */
const LINE_DY = lineYFor(ID) - LINE.y;
const X9 = SLOT_X['9'];
/** tag 9's eyelet in the set's own (untranslated) coordinates, and its centre on screen (with the variant offset) */
const EYE9 = { x: X9, y: lineYAt(X9) + TAG.string };
const TAG9_C = { x: X9, y: EYE9.y + LINE_DY + TAG.h / 2 };

/** action-plane scale k centred on (x, y): dolly to k 1.2, lens beyond */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
const WIDE0 = camK(636, 398, 1.0);
const WIDE1 = camK(646, 404, 1.03);
/** the insert: tag 9 and its knot card fill the middle of the frame */
const TIGHT = camK(X9 + 16, TAG9_C.y - 8, 3.5);
const TIGHT1 = camK(X9 + 18, TAG9_C.y - 10, 3.64);
/**
 * tag 9 gets its own clear slot in this shot: tag 10 (and its README's-tagline knot card, which hangs to the LEFT of
 * its string) is nudged right so the card clears tag 9 entirely, and the nano question card hangs beside tag 10
 * instead of behind it. No tag hides another in any framing.
 */
const X10_NUDGE = 72;
const NANO_DX = 96;

interface Beats {
  D: number;
  tied: number;
  hedged: number;
}

function camAt(t: number, b: Beats): Camera3 {
  const p0 = 1.2, p1 = 4.3;
  const lerpCam = (a: Camera3, z: Camera3, u: number): Camera3 => {
    // log-uniform zoom; centre tracks so the target point moves in a straight line
    const ka = (1000 * a.lens) / (1000 - a.z), kz = (1000 * z.lens) / (1000 - z.z);
    const k = Math.exp(lerp(Math.log(ka), Math.log(kz), u));
    const f = (1 / ka - 1 / k) / (1 / ka - 1 / kz);
    return camK(lerp(a.x, z.x, f), lerp(a.y, z.y, f), k);
  };
  if (t < p0) return lerpCam(WIDE0, WIDE1, t / p0);
  if (t < p1) return lerpCam(WIDE1, TIGHT, smr((t - p0) / (p1 - p0)));
  return lerpCam(TIGHT, TIGHT1, smr((t - p1) / (b.D - p1)));
}

/** tag 9's state at t: swings in, tied, the knot card threads in, turns gently toward the hall on 'faster' */
function tag9(t: number, tq: number, b: Beats): TagState {
  const inU = smr((tq - (b.tied - 0.75)) / 0.75);
  return {
    id: '9',
    ink: 1,
    knotIn: seg(tq, b.tied + 0.05, b.tied + 0.4),
    // on 'faster' the tag turns on its thread toward the hall: a clear yaw (squashed to ~0.84 wide, a lit edge)
    flip: 0.18 * seg(tq, b.hedged - 0.05, b.hedged + 0.45),
    // the qualifier is drawn by the shot (hedgeMark): wrapped inside the paper, its ink strengthening on 'faster'
    sub: '',
    alpha: clamp01(inU * 1.6),
    swing: tq < b.tied ? 0.2 : releaseSwing(tq, b.tied, 0.18),
    phase: 0.4,
    x: X9 + 70 * (1 - inU),
    y: EYE9.y - 30 * (1 - inU) * (1 - inU),
    drop: 0.05 * seg(tq, b.hedged + 0.8, b.hedged + 2.2),
    subject: t > b.tied,
  };
}

/** the faint map on the back plane: copper-flecked (as s03 left it), whole, behind the line (L3 rest px) */
const MAP_L3 = mapView(1060 / (MAP.cols * MAP.cw), (MAP.cols * MAP.cw) / 2, (MAP.rows * MAP.ch) / 2, { x: 650, y: 300 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, tied: T.beat('tied'), hedged: T.beat('hedged') };
    // the earlier tags as the film left them (soft, swinging a little)
    const others = tagsAt(ID, 'start').map((st, i) => {
      const x = st.id === '10' ? SLOT_X['10'] + X10_NUDGE : st.id === 'nano' ? SLOT_X['10'] + X10_NUDGE + NANO_DX : st.x;
      return { ...st, x, swing: 0.02, phase: i * 1.31 };
    });
    return { tl, b, others };
  },
  paint(f, _s, sc) {
    const { b, others } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 360, intensity: 0.85 });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        searchHallWall(cc, env);
      })(c, -260, -100);
    });
    f.fog('A');
    // the map behind the line: copper-flecked, faint, every bead still stepping
    f.layer('L3', (c, env) => {
      drawSearchMap(f, c, env, MAP_L3, { slot: Math.floor(Math.max(0, tq) * 4) % 513, matches: 1, sweepX: 99999, key: ID, alpha: 0.42 });
    });
    f.fog({ yCenter: 0.5 * 720, height: 0.5 * 720, alpha: 0.22, drift: 5 });
    // a second thin sheet between the line and the grain, so the tags stand clear of the busy map
    f.fog({ yCenter: 300, height: 440, alpha: 0.15, drift: 8 });

    const st9 = tag9(t, tq, b);
    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, LINE_DY);
      drawLine(c, env, { glow: 0.55 });
      drawRule(c, env, { labels: 1 });
      drawTags(c, env, [...others, st9], { tq, pencil: 'none' });
      c.restore();
      hedgeMark(c, env, st9, tq, seg(t, b.hedged - 0.05, b.hedged + 0.45), t > b.tied);
      tieKnot(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // ---------------- L5: a hall pillar at the left edge (soft), out of frame once the camera pushes in
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 200, 1200, (cc) => {
        cc.translate(40, 200);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(-40, -200, 96, 1200);
        cc.fillRect(-52, 560, 120, 26);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.16);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(55, -200);
        cc.lineTo(55, 560);
        cc.stroke();
      })(c, -40, -200);
    });
    placeStamp(f.c, { place: '13 October 2026', date: '09:01', style: 'mono', x: 52, y: 64, at: b.tied + 0.05, fade: 0.5 }, { t, mood: f.mood, seed: 931 });
  },
});

/**
 * The pencilled qualifier '(for the highlighter half)', drawn ON the tag in its own frame (eyelet, swing, turn), wrapped
 * onto two lines inside the paper with a margin. Pencil-grey at ~45 % before 'faster'; on 'faster' it strengthens to
 * ~90 % over half a second and a soft graphite underscore runs under it. On the turn, the tag's edge toward the hall
 * catches the light.
 */
const QUAL = ['(for the', 'highlighter half)'];
function hedgeMark(c: C2, env: PaintEnv, st: TagState, tq: number, u: number, subject: boolean) {
  const a = clamp01(st.alpha ?? 1);
  if (a <= 0.01) return;
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? 0));
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp01(st.flip ?? 0))));
  const eye = { x: st.x ?? X9, y: (st.y ?? EYE9.y) + LINE_DY };
  c.save();
  c.globalAlpha *= a;
  c.translate(eye.x, eye.y);
  c.rotate(swing);
  c.scale(sx, 1);
  // under the front's lines (sets/tagLine: top 26 + 0.8 fs, 1.12 fs a line, then 0.4 fs)
  const fsF = 9.6;
  c.font = `${fsF}px ${FONT.fell}`;
  const lines = wrapCount(c, 'The GPU is the faster one', TAG.w * 0.84);
  let y = 26 + fsF * 0.8 + lines * fsF * 1.12 + fsF * 0.4 - 0.5;
  // the qualifier's size: as large as fits the paper with a margin each side (about 18 px at 1080 in the insert)
  let fs = 7.4;
  c.font = `italic ${fs}px ${FONT.text}`;
  const widest = Math.max(...QUAL.map((l) => c.measureText(l).width));
  fs = Math.min(fs, (fs * (TAG.w - 2 * 4.2)) / widest);
  const ink = 0.45 + 0.45 * u;
  const pencil = mixLab('#3a3a38', env.mood.ink, 0.3);
  textRole(c, subject ? 'subject' : 'texture', () => {
    c.font = `italic ${fs.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(pencil, ink);
    QUAL.forEach((l, i) => c.fillText(l, 0, y + i * fs * 1.08));
  });
  const wq = Math.max(...QUAL.map((l) => c.measureText(l).width));
  textProbe(c, `${ID}-qual`, -wq / 2, y - fs, wq, fs * 2.2, a * ink);
  y += fs * 1.08;
  // the graphite underscore under the second line, drawn left to right on 'faster'
  if (u > 0.01) {
    const w = c.measureText(QUAL[1]).width;
    c.strokeStyle = withAlpha(pencil, 0.55 * u);
    c.lineWidth = 0.9;
    c.lineCap = 'round';
    c.beginPath();
    const x0 = -w / 2, x1 = -w / 2 + w * u;
    const yu = y + 2;
    c.moveTo(x0, yu);
    for (let k = 1; k <= 12; k++) c.lineTo(x0 + ((x1 - x0) * k) / 12, yu + Math.sin(k * 1.9) * 0.3);
    c.stroke();
  }
  // the lit edge: the tag's right edge, turned toward the hall, catches the backlight
  const fl = clamp01((st.flip ?? 0) / 0.18);
  if (fl > 0.01) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.8 * fl);
    c.lineWidth = 1.6 / sx;
    c.beginPath();
    c.moveTo(TAG.w / 2, 14);
    c.lineTo(TAG.w / 2, TAG.h - 1);
    c.stroke();
  }
  c.restore();
}
function wrapCount(c: C2, text: string, maxW: number): number {
  let n = 1, line = '';
  for (const w of text.split(' ')) {
    const tryL = line ? `${line} ${w}` : w;
    if (c.measureText(tryL).width > maxW && line) {
      n++;
      line = w;
    } else line = tryL;
  }
  return n;
}

/** the tie: a small flash on the knot as it pulls down on 'tied' (the detent's tie click) */
function tieKnot(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = (t - (b.tied + 0.02)) / 0.35;
  if (u < 0 || u > 1) return;
  const x = X9, y = lineYAt(X9) + LINE_DY;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, 14);
  g.addColorStop(0, withAlpha(env.mood.core, 0.6 * (1 - u)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 14, y - 14, 28, 28);
  c.restore();
}
