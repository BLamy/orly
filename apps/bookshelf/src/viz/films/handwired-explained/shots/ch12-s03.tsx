/**
 * ch12-s03 — THE FORWARD PASS THROUGH THE FILM (scene, dawnGold; cut from ch12-s02's wide; 9.71 s).
 *   L1204 "Send one wave of light through it. Every tag lights."
 *   L1205 "The struck ones ran too. Multiplied by nought."
 *
 * The six-column tag-loom of ch12-s02 against the misty ridges (sets/ch12-s01-valley). A band of copper light enters at
 * frame 0 and runs left to right, one frame per beat, along the dependency threads (the same forward pass as a
 * Handwired evaluation: every frame, every time). It reaches EVERY tag, struck ones included. On a kept or still-held
 * tag (1, 2, 6, 10, the JSON half of 11, the why tag) the light arrives and stays. On a struck tag (3, 4, 5, 7, 8, 9,
 * the TOML half of 11) it arrives just the same and glows fully; then a small paper shutter slides closed behind the
 * tag: the branch was computed, then multiplied by zero (both branches always run; the 0/1 gate picks). The select
 * itself, as the docs write it, sets in on a slip under frame 2. The wave comes to rest on frame 5's empty hook (the
 * hinge profile: flat, then up), a faint copper glow on bare wire.
 *
 * TEACHES, word by word:
 *   wave (1.36)    'wave': the light enters frame 0 and starts across; the camera follows its leading edge
 *   lights (3.77)  'lights': it has crossed frames 1 to 4; every tag is lit, struck ones included
 *   struck (5.55)  'struck': the shutters begin to close behind the struck tags, frame by frame; the slip sets in
 *   zero (8.35)    'nought': the last shutters close in frame 4 (tag 9, 11's TOML half); the wave rests on the hook
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import {
  COLX,
  DEPS,
  FRAME_OF,
  HOOK,
  STRANDS,
  bisonLoop,
  camK,
  clamp01,
  depThread,
  depVia,
  drawHook,
  drawLine12,
  drawRule12,
  drawWarp,
  eyeOf,
  hookPoints,
  lifeX12,
  loomKnot,
  nanoUnder,
  pencilBeside,
  shadeRule12,
  sideOf,
  slackLoop,
  spline,
  states12,
  tag12,
  tagH,
  tagHalo,
  tagShade,
  tagW,
  tip12,
  twos,
  valleyBack,
  valleyNear,
  whyFace,
  win,
  type Key,
  type Pt,
} from '../sets/ch12-s01-valley';
import { TAGS, type TagId, type TagState } from '../sets/tagLine';
import timeline from '../timeline.json';

const ID = 'ch12-s03';
const SHOT = (timeline as { shots: { id: string; start: number; end: number }[] }).shots.find((s) => s.id === ID)!;
const D = SHOT.end - SHOT.start;

const STATES = states12();
const ST = new Map<TagId, TagState>(STATES.map((s) => [s.id, s]));
const HOOK_S = 1.5;
const hookIn = (): Pt => hookPoints(HOOK.x, HOOK.y, HOOK_S)[2];
const loomEye = (id: TagId): Pt => eyeOf(id, loomKnot(id));
/** struck tags (shuttered after the light reaches them); 11 is shuttered on its TOML (right) half only */
const STRUCK: TagId[] = ['4', '5', '8', '3', '7', '9', '11'];

/** the select, as the docs write it, and the shot's label (script onScreenText) */
const EQ = 'gate × on + (1 − gate) × off';
const LABEL = 'struck: computed, then × 0';

interface Beats {
  wave: number;
  lights: number;
  struck: number;
  zero: number;
}

/** when the wave reaches each frame (0..4), and the hook (5) */
function arrivals(b: Beats): number[] {
  const t0 = b.wave - 0.05;
  const step = (b.lights - 0.02 - t0) / 4;
  return [0, 1, 2, 3, 4].map((c) => t0 + c * step).concat([b.zero - 0.05]);
}
/** the wave's position in frame units at t (eases between frames: one frame per beat) */
function waveAt(arr: number[], t: number): number {
  if (t < arr[0]) return -1;
  for (let c = 0; c < arr.length - 1; c++) {
    if (t < arr[c + 1]) {
      // frames 0..4 step evenly; the last leg to the hook waits, then travels in the last 0.7 s
      const a = c === 4 ? Math.max(arr[4], arr[5] - 0.7) : arr[c];
      const u = clamp01((t - a) / (arr[c + 1] - a));
      return c + u * u * (3 - 2 * u);
    }
  }
  return 5;
}

// ---------------------------------------------------------------- the camera: hold, follow the leading edge, settle back
const KX: Key[] = [[0, 652], [1.2, 630], [2.55, 540], [3.9, 800], [5.3, 655], [D, 662]];
const KY: Key[] = [[0, 670], [1.2, 668], [2.55, 650], [3.9, 652], [5.3, 668], [D, 670]];
const KK: Key[] = [[0, 0.885], [1.2, 0.9], [2.55, 1.02], [3.9, 1.0], [5.3, 0.895], [D, 0.89]];
const KZ: Key[] = [[0, -125], [1.2, -110], [2.55, 0], [3.9, -10], [5.3, -110], [D, -118]];
const camAt = (t: number): Camera3 => camK(spline(KX, t), spline(KY, t), spline(KK, t), spline(KZ, t));
const CAMS: Camera3[] = Array.from({ length: 32 }, (_, i) => camAt((i / 31) * D));
/** the slip is sized to read at the settled wide */
const K_SLIP = 0.89;

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { wave: T.beat('wave'), lights: T.beat('lights'), struck: T.beat('struck'), zero: T.beat('zero') };
    const arr = arrivals(b);
    // shutters close frame by frame from 'struck'; frame 4's last ones land on 'nought'
    const shutCol = [b.struck + 0.05, b.struck + 0.5, b.struck + 0.95, b.struck + 1.4, b.zero - 0.4];
    return { tl, b, arr, shutCol };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const arr = sc.arr as number[];
    const shutCol = sc.shutCol as number[];
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t);
    f.camera(cam);
    const W = waveAt(arr, t);

    valleyBack(f, { key: ID, cams: CAMS, sunX: 700, dawn: 1 });

    /** how lit a frame is: a flare as the wave arrives, then a steady glow */
    const frameLit = (col: number) => {
      const a = arr[col];
      return win(t, a - 0.08, a + 0.12) * (0.55 + 0.45 * Math.exp(-Math.max(0, t - a - 0.12) * 1.6));
    };
    const shutU = (id: TagId) => (STRUCK.includes(id) ? win(t, shutCol[FRAME_OF[id]!], shutCol[FRAME_OF[id]!] + 0.35) : 0);

    f.layer('L4', (c, env) => {
      drawLine12(c, env, 0.55);
      drawRule12(c, env, 0);
      // the rule stays sunk behind the loom's foot (as s02 left it)
      shadeRule12(c, env, 0.4);
      for (let col = 0; col < 6; col++) drawWarp(c, env, col, { glow: col < 5 ? frameLit(col) * 0.8 : 0, tq });
      // the hook: the wave rests on it (a faint copper glow on bare wire)
      const rest = win(t, arr[5] - 0.1, arr[5] + 0.3);
      drawHook(c, env, HOOK.x, HOOK.y, 0.22 + 0.5 * rest * (0.85 + 0.15 * Math.sin(tq * 2.4)), HOOK_S, 1);
      // dependency threads: the dim thread, then its lit length up to the wave (a bead at the leading edge)
      for (const [a, z] of DEPS) {
        const ca = FRAME_OF[a]!;
        const cz = z === 'hook' ? 5 : FRAME_OF[z]!;
        const pa = sideOf(a, loomEye(a), 'R');
        const pz = z === 'hook' ? hookIn() : sideOf(z, loomEye(z), 'L');
        // skip threads run between the rows (the same routing as s02): the light never passes behind a tag it skips
        const via = depVia(a, z);
        // a thread into a struck tag dims (light and thread both) once its shutter has closed
        const shut = z !== 'hook' && STRUCK.includes(z) && z !== '11' ? shutU(z) : 0;
        depThread(c, env, pa, pz, { alpha: 1 - 0.45 * shut, via });
        const pb = clamp01((W - ca) / (cz - ca));
        if (pb <= 0) continue;
        const dim = 1 - 0.85 * shut;
        const after = pb >= 1 ? 0.55 + 0.45 * Math.exp(-Math.max(0, t - arr[cz]) * 1.2) : 1;
        depThread(c, env, pa, pz, { u: pb, lit: after * dim, alpha: 1 - 0.45 * shut, bead: pb < 1 ? 0.999 : undefined, via });
      }
      // lifespan tips stay on the rule
      // (their glow held low, so the wave's bead and its arriving flare are the hottest points in frame)
      for (const s of STRANDS) tip12(c, env, lifeX12(s.days), s.lane, s.tip, { glow: 0.25, s: 1.35 });
      // the tags: halo (the wave's light behind), the shutter sliding closed behind a struck tag, then the tag
      for (const st of STATES) {
        if (st.id === 'nano') continue;
        const eye = loomEye(st.id);
        const knot = loomKnot(st.id);
        const col = FRAME_OF[st.id]!;
        const lit = frameLit(col);
        const sh = shutU(st.id);
        const w = tagW(st.id), h = tagH(st.id);
        tagHalo(c, env, eye, st.id, lit);
        if (sh > 0) shutter(c, env, eye, w, h, sh, st.id === '11');
        const bottom = { x: eye.x, y: eye.y + h };
        if (TAGS[st.id].slack) slackLoop(c, env, bottom, st.scale ?? 1);
        if (st.id === '11') bisonLoop(c, env, { x: eye.x + 2, y: bottom.y }, tq);
        const glow = lit * (st.id === '11' ? 1 - 0.35 * sh : 1 - 0.85 * sh);
        tag12(c, env, { ...st, glow: 0.9 * glow }, eye, knot, tq);
        // multiplied by nought: once its shutter closes a struck tag drops into shadow (about 55 % value; 11 on its
        // TOML half only), so the loom splits at a glance into lit and shadowed tags
        if (sh > 0) tagShade(c, env, st, eye, 0.45 * sh, tq, st.id === '11');
        if (st.id === 'why') whyFace(c, env, st, eye, tq);
        if (st.id === '10') {
          const nano = ST.get('nano');
          if (nano) nanoUnder(c, env, { ...nano, glow: 0.7 * lit }, eye, tq);
        }
        if (st.pencilRest) pencilBeside(c, env, eye, st.id);
      }
      // the slip under frame 2: the select, then the label
      const k = toScreen(LAYERS.L4, cam, 0, 0).k;
      slip(c, env, t, b.struck, k);
    });
    f.rim({ x: 0, y: -1 });
    valleyNear(f, ID, 1);
  },
});

/** a small dark paper shutter sliding closed behind a tag (u 0..1), across the whole tag or its right half only */
function shutter(c: CanvasRenderingContext2D, env: PaintEnv, eye: Pt, w: number, h: number, u: number, rightHalf: boolean) {
  const pw = rightHalf ? w * 0.62 : w * 1.3;
  const ph = h * 1.12;
  const x1 = rightHalf ? eye.x : eye.x - pw / 2; // its closed position
  const y = eye.y + h / 2 - ph / 2;
  const x = x1 - (1 - u) * (pw + 18); // it slides in from the left, behind the tag
  c.save();
  c.beginPath();
  c.rect(rightHalf ? eye.x : eye.x - pw / 2 - 2, y - 2, pw + 4, ph + 4);
  c.clip();
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x, y, pw, ph);
  // its leading edge catches the light
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6 * (1 - u * 0.5));
  c.fillRect(x + pw - 1.5, y, 1.5, ph);
  c.restore();
}

/** the parchment slip under frame 2: the select (as the docs write it) and the label, sized to read at the wide */
function slip(c: CanvasRenderingContext2D, env: PaintEnv, t: number, at: number, k: number) {
  const inkAt = at + 0.12;
  const paper = cardPaperAlpha(t, inkAt, 0.35);
  if (paper <= 0) return;
  const scale = k / K_SLIP;
  const eqBase = `italic 400 24px ${FONT.text}`;
  const eqSize = Math.max(22, legibleSize(c, eqBase, 24, EQ) * scale);
  const lbBase = `italic 400 20px ${FONT.text}`;
  const lbSize = Math.max(18, legibleSize(c, lbBase, 19, LABEL) * scale);
  c.save();
  c.font = `italic 400 ${eqSize.toFixed(1)}px ${FONT.text}`;
  const ew = c.measureText(EQ).width;
  c.font = `italic 400 ${lbSize.toFixed(1)}px ${FONT.text}`;
  const lw2 = c.measureText(LABEL).width;
  const w = Math.max(ew, lw2) + 32;
  const h = eqSize * 1.3 + lbSize * 1.35 + 30;
  const x0 = COLX[2] - w / 2;
  // under the loom's foot, over the sunk rule (clear of frame 2's tags and the lower warps)
  const y0 = 882;
  const drop = (1 - paper) * -10;
  // the string from the frame's warp to the slip
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85 * paper);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(COLX[2], 866);
  c.lineTo(COLX[2], y0 + drop);
  c.stroke();
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x0 + 3, y0 + drop + 4, w, h);
  c.fillStyle = mixLab(mixLab('#efe3c8', env.mood.halo, 0.18), env.mood.core, 0.1);
  c.fillRect(x0, y0 + drop, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x0, y0 + drop);
  c.lineTo(x0 + w, y0 + drop);
  c.stroke();
  const eqInk = win(t, inkAt, inkAt + 0.25);
  const lbInk = win(t, inkAt + 0.5, inkAt + 0.85);
  textRole(c, 'subject', () => {
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.globalAlpha = paper * eqInk;
    c.fillStyle = mixLab('#21170f', env.mood.ink, 0.2);
    c.font = `italic 400 ${eqSize.toFixed(1)}px ${FONT.text}`;
    c.fillText(EQ, COLX[2], y0 + drop + 14 + eqSize);
    c.globalAlpha = paper * lbInk;
    c.fillStyle = mixLab('#7a2e22', env.mood.ink, 0.15);
    c.font = `italic 400 ${lbSize.toFixed(1)}px ${FONT.text}`;
    c.fillText(LABEL, COLX[2], y0 + drop + 14 + eqSize * 1.3 + lbSize * 1.05);
  });
  c.globalAlpha = 1;
  cardProbe(c, `${ID}-slip`, x0, y0 + drop, w, h, paper, eqInk);
  textProbe(c, `${ID}-eq`, x0 + 20, y0 + drop + 14, w - 40, eqSize * 1.2, paper * eqInk);
  textProbe(c, `${ID}-label`, x0 + 20, y0 + drop + 14 + eqSize * 1.3, w - 40, lbSize * 1.2, paper * lbInk);
  c.restore();
}
