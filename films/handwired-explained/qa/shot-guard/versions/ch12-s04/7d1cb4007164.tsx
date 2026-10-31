/**
 * ch12-s04 — STILL ARGUED (scene, dawnGold; cut from ch12-s03; 19.46 s).
 *   L1206 "Three beliefs are still argued over. Learn the weights, don't write them. Fully differentiable. And the
 *          README's claim to take “regular JavaScript”."
 *   L1207 "To the stranger's “why?”, the README's nearest answers: “for fun”, and “Let's find out!”"
 *
 * The wave has passed and the light settles on what still hangs unstruck (sets/ch12-s01-valley, the loom of s02/s03).
 * Even-handed: no side taken; the tags' own fronts carry the words, so no caption is added for them.
 *
 * TEACHES, word by word:
 *   half (2.28)     'argued': tags 2 (frame 1) and 10 (frame 3) settle to HALF brightness, steady; the red pencil
 *                   rests beside each; each keeps the thread tip it had in s01: a fine thread runs down from each to
 *                   its glowing open tip on the rule (2's at about seven and a half years, 10's at thirteen days)
 *   (2.3 .. 8)      a slow push toward frames 1 to 3
 *   tagline (8.69)  'claim': the camera glances to frame 0: tag 4 stays struck, its knot card unchanged, and a third
 *                   red pencil comes to rest against it (whether the phrase overclaims is still argued)
 *   rivet (10.26)   'JavaScript': a glint runs across tag 6's copper rivet (frame 2)
 *   why (12.79)     'why': the camera finds the small why tag at the foot of frame 1; it turns on its thread and shows
 *                   the stranger's 'why?' in red pencil on its back
 *   answer (14.68)  'nearest': the README's own words set in beside it on a parchment slip, “Let's find out!” — the
 *                   README ('for fun' is spoken only); the camera settles wide enough that frame 5's bare hook glows
 *                   faintly at frame right, waiting
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import {
  DEPS,
  HOOK,
  STRANDS,
  bisonLoop,
  camK,
  clamp01,
  depThread,
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
  sideOf,
  slackLoop,
  spline,
  states12,
  tag12,
  tagH,
  tagHalo,
  tagW,
  thread12,
  tip12,
  twos,
  valleyBack,
  valleyNear,
  win,
  type Key,
  type Pt,
} from '../sets/ch12-s01-valley';
import { TAGS, type TagId, type TagState } from '../sets/tagLine';
import timeline from '../timeline.json';

const ID = 'ch12-s04';
const SHOT = (timeline as { shots: { id: string; start: number; end: number }[] }).shots.find((s) => s.id === ID)!;
const D = SHOT.end - SHOT.start;

const STATES = states12();
const ST = new Map<TagId, TagState>(STATES.map((s) => [s.id, s]));
const HOOK_S = 1.5;
const hookIn = (): Pt => hookPoints(HOOK.x, HOOK.y, HOOK_S)[2];
const loomEye = (id: TagId): Pt => eyeOf(id, loomKnot(id));
const STRUCK: TagId[] = ['4', '5', '8', '3', '7', '9', '11'];
const CONTESTED: TagId[] = ['2', '10'];
/** Q010's own words (verbatim) and the attribution */
const ANSWER = '“Let’s find out!”';
const ANSWER_BY = '— the README';

interface Beats {
  half: number;
  tagline: number;
  rivet: number;
  why: number;
  answer: number;
}

// ---------------------------------------------------------------- the camera
// hold the loom, a slow push toward frames 1-3, the glance to frame 0 on 'claim', a find on the why tag, then the
// settle wide enough for frame 5's hook at frame right
function camKeys(b: Beats) {
  const KX: Key[] = [[0, 662], [1.2, 655], [7.9, 500], [b.tagline + 0.75, 300], [b.why - 0.5, 330], [b.why + 0.9, 390], [b.answer + 0.4, 420], [b.answer + 3.4, 700], [D, 712]];
  const KY: Key[] = [[0, 670], [1.2, 668], [7.9, 640], [b.tagline + 0.75, 640], [b.why - 0.5, 650], [b.why + 0.9, 760], [b.answer + 0.4, 770], [b.answer + 3.4, 680], [D, 680]];
  const KK: Key[] = [[0, 0.89], [1.2, 0.9], [7.9, 1.16], [b.tagline + 0.75, 1.22], [b.why - 0.5, 1.2], [b.why + 0.9, 1.6], [b.answer + 0.4, 1.56], [b.answer + 3.4, 0.98], [D, 0.96]];
  const KZ: Key[] = [[0, -118], [1.2, -110], [7.9, 120], [b.tagline + 0.75, 160], [b.why - 0.5, 150], [b.why + 0.9, 330], [b.answer + 0.4, 320], [b.answer + 3.4, -20], [D, -40]];
  return { KX, KY, KK, KZ };
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { half: T.beat('half'), tagline: T.beat('tagline'), rivet: T.beat('rivet'), why: T.beat('why'), answer: T.beat('answer') };
    const keys = camKeys(b);
    const camAt = (t: number): Camera3 => camK(spline(keys.KX, t), spline(keys.KY, t), spline(keys.KK, t), spline(keys.KZ, t));
    const cams = Array.from({ length: 48 }, (_, i) => camAt((i / 47) * T.duration));
    // the answer slip reads at the settled wide (the smallest framing it is seen in)
    const kSlip = Math.min(...Array.from({ length: 20 }, (_, i) => spline(keys.KK, b.answer + ((D - b.answer) * i) / 19)));
    return { tl, b, camAt, cams, kSlip };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const camAt = sc.camAt as (t: number) => Camera3;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(t);
    f.camera(cam);

    valleyBack(f, { key: ID, cams: sc.cams as Camera3[], sunX: 700, dawn: 1 });

    const half = win(t, b.half - 0.15, b.half + 0.7);
    const threadU = win(t, b.half + 0.1, b.half + 1.6);
    const pencil4 = win(t, b.tagline - 0.05, b.tagline + 0.5);
    const turn = win(tq, b.why - 0.05, b.why + 0.85);
    // still slowly turning: after the first turn it keeps a slow sway about its back
    const flipWhy = turn < 1 ? turn : 1 - 0.16 * (1 - Math.cos((tq - b.why - 0.85) * 1.3));

    f.layer('L4', (c, env) => {
      drawLine12(c, env, 0.55);
      drawRule12(c, env, 0);
      for (let col = 0; col < 6; col++) drawWarp(c, env, col, { glow: col < 5 ? 0.3 : 0, tq });
      drawHook(c, env, HOOK.x, HOOK.y, 0.5 + 0.12 * Math.sin(tq * 2.1), HOOK_S, 1);
      // the dependency threads, lit where they lead to a tag that kept its light
      for (const [a, z] of DEPS) {
        const pa = sideOf(a, loomEye(a), 'R');
        const pz = z === 'hook' ? hookIn() : sideOf(z, loomEye(z), 'L');
        const into = z === 'hook' ? 0.5 : STRUCK.includes(z) && z !== '11' ? 0.15 : CONTESTED.includes(z) ? 0.5 - 0.25 * half : 0.5;
        depThread(c, env, pa, pz, { lit: into, alpha: 1 });
      }
      // the tips on the rule; the two contested tags' threads run down to theirs again
      for (const s of STRANDS) {
        const isC = CONTESTED.includes(s.id);
        if (isC && threadU > 0) {
          const eye = loomEye(s.id);
          thread12(c, env, { x: eye.x + s.dx, y: eye.y + tagH(s.id) }, lifeX12(s.days), s.lane, threadU, 0.9);
        }
        tip12(c, env, lifeX12(s.days), s.lane, s.tip, { glow: isC ? 0.8 - 0.3 * half : 0.8, s: 1.35 });
      }
      // the tags as the wave left them: kept ones lit, struck ones dark behind their shutters; 2 and 10 at half
      for (const st of STATES) {
        if (st.id === 'nano') continue;
        const eye = loomEye(st.id);
        const knot = loomKnot(st.id);
        const w = tagW(st.id), h = tagH(st.id);
        const struck = STRUCK.includes(st.id);
        const lit = struck ? (st.id === '11' ? 0.55 : 0) : CONTESTED.includes(st.id) ? 0.55 - 0.27 * half : 0.55;
        tagHalo(c, env, eye, st.id, lit);
        if (struck) shutterClosed(c, env, eye, w, h, st.id === '11');
        const bottom = { x: eye.x, y: eye.y + h };
        if (TAGS[st.id].slack) slackLoop(c, env, bottom, st.scale ?? 1);
        if (st.id === '11') bisonLoop(c, env, { x: eye.x + 2, y: bottom.y }, tq);
        const s2: TagState = { ...st, glow: struck ? (st.id === '11' ? 0.4 : 0.05) : 0.9 * lit / 0.55 * 0.5 };
        if (st.id === 'why') {
          s2.flip = flipWhy;
          s2.swing = 0.05;
          s2.subject = turn > 0.6;
        }
        tag12(c, env, s2, eye, knot, tq);
        if (st.id === '10') {
          const nano = ST.get('nano');
          if (nano) nanoUnder(c, env, { ...nano, glow: 0.3 }, eye, tq);
        }
        if (st.pencilRest) pencilBeside(c, env, eye, st.id);
        if (st.id === '4') pencilBeside(c, env, eye, '4', pencil4);
      }
      // the glint across tag 6's rivet on 'JavaScript'
      rivetGlint(c, env, loomEye('6'), t - b.rivet);
      // the README's nearest answer beside the why tag
      answerSlip(c, env, t, b.answer, toScreen(LAYERS.L4, cam, 0, 0).k, sc.kSlip as number);
    });
    f.rim({ x: 0, y: -1 });
    valleyNear(f, ID, 1);
  },
});

/** the shutter behind a struck tag, closed (as s03 left it) */
function shutterClosed(c: CanvasRenderingContext2D, env: PaintEnv, eye: Pt, w: number, h: number, rightHalf: boolean) {
  const pw = rightHalf ? w * 0.62 : w * 1.3;
  const ph = h * 1.12;
  const x = rightHalf ? eye.x : eye.x - pw / 2;
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x, eye.y + h / 2 - ph / 2, pw, ph);
}

/** a quick star of light that runs across tag 6's rivet (dt = seconds since 'JavaScript') */
function rivetGlint(c: CanvasRenderingContext2D, env: PaintEnv, eye: Pt, dt: number) {
  if (dt < -0.1 || dt > 1.1) return;
  const u = clamp01(dt / 0.9);
  const k = Math.sin(Math.PI * u);
  const r = { x: eye.x - tagW('6') * 0.3, y: eye.y + 16 };
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the streak runs across the tag's top corner, through the rivet
  const sx = r.x - 26 + 52 * u;
  const g = c.createRadialGradient(sx, r.y, 0, sx, r.y, 16);
  g.addColorStop(0, withAlpha(env.mood.core, 0.7 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(sx - 16, r.y - 16, 32, 32);
  // the star on the rivet itself, peaking as the streak crosses it
  const p = Math.exp(-Math.pow((u - 0.5) / 0.16, 2));
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.9 * p);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(r.x - 13 * p, r.y);
  c.lineTo(r.x + 13 * p, r.y);
  c.moveTo(r.x, r.y - 9 * p);
  c.lineTo(r.x, r.y + 9 * p);
  c.stroke();
  c.restore();
}

/** the parchment slip beside the why tag: the README's own words (Q010) and the attribution */
function answerSlip(c: CanvasRenderingContext2D, env: PaintEnv, t: number, at: number, k: number, kRef: number) {
  const inkAt = at + 0.1;
  const paper = cardPaperAlpha(t, inkAt, 0.35);
  if (paper <= 0) return;
  const scale = k / kRef;
  const qSize = Math.max(22, legibleSize(c, `italic 400 28px ${FONT.text}`, 28, ANSWER) * scale);
  const bSize = Math.max(16, legibleSize(c, `500 18px ${FONT.sc}`, 18, ANSWER_BY) * scale);
  const why = loomEye('why');
  c.save();
  c.font = `italic 400 ${qSize.toFixed(1)}px ${FONT.text}`;
  const qw = c.measureText(ANSWER).width;
  c.font = `500 ${bSize.toFixed(1)}px ${FONT.sc}`;
  const bw = c.measureText(ANSWER_BY).width;
  const w = Math.max(qw, bw) + 34;
  const h = qSize * 1.25 + bSize * 1.4 + 24;
  const x0 = why.x + 44;
  const y0 = why.y + 6 + (1 - paper) * 8;
  // pinned to the frame's rail by a short thread
  c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.85 * paper);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(why.x + 40, why.y - 4);
  c.lineTo(x0 + 10, y0);
  c.stroke();
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
  c.fillRect(x0 + 3, y0 + 4, w, h);
  c.fillStyle = mixLab(mixLab('#efe3c8', env.mood.halo, 0.18), env.mood.core, 0.12);
  c.fillRect(x0, y0, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x0, y0);
  c.lineTo(x0 + w, y0);
  c.stroke();
  const qInk = win(t, inkAt, inkAt + 0.3);
  const bInk = win(t, inkAt + 0.55, inkAt + 0.9);
  // its last words catch the light
  const catchU = win(t, inkAt + 0.6, inkAt + 1.6) * (1 - win(t, inkAt + 2.2, inkAt + 3.6));
  textRole(c, 'subject', () => {
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.globalAlpha = paper * qInk;
    c.fillStyle = mixLab(mixLab('#21170f', env.mood.ink, 0.2), '#7a4a18', 0.35 * catchU);
    c.font = `italic 400 ${qSize.toFixed(1)}px ${FONT.text}`;
    c.fillText(ANSWER, x0 + 17, y0 + 12 + qSize);
    c.globalAlpha = paper * bInk;
    c.fillStyle = mixLab('#4a3420', env.mood.ink, 0.2);
    c.font = `500 ${bSize.toFixed(1)}px ${FONT.sc}`;
    c.fillText(ANSWER_BY, x0 + 17, y0 + 12 + qSize * 1.25 + bSize * 1.1);
  });
  c.globalAlpha = 1;
  cardProbe(c, `${ID}-answer`, x0, y0, w, h, paper, qInk);
  textProbe(c, `${ID}-answer-q`, x0 + 17, y0 + 12, qw, qSize * 1.2, paper * qInk);
  textProbe(c, `${ID}-answer-by`, x0 + 17, y0 + 12 + qSize * 1.25, bw, bSize * 1.2, paper * bInk);
  c.restore();
}
