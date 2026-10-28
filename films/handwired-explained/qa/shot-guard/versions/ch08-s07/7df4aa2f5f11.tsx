/**
 * ch08-s07 — THE FILM'S ONE PLAIN STATEMENT ABOUT TOOLING (bible §9), and its only mention of any lab's tools.
 * dawnGold, crossfade in from ch08-s06's plate; 18.08 s on the locked clock.
 *   L0810 "Every commit is Cheng Lou's; most also credit a coding agent, Claude Code."
 *   L0811 "The review also names an earlier OpenAI agent, Codex. This film was written with Claude."
 *   L0812 "Mistakes and catches alike came from one process, under his direction."
 *
 * The lamplit desk from ch03-s01's lit pane, now seen close in warm dawn (sets/ch08-s07-desk): a logo-less laptop,
 * Cheng's two paper hands typing (cast author-hands, framed at the wrists) and, beside them, the agent's single paler
 * hand (cast agent-hand) typing half a beat behind. No faces, no words of the agent's own, no logos, no model names.
 *
 *   hands   (0.40)  the hands at one keyboard, typing on twos, in warm dawn; the camera drifts in very slowly
 *   commits (0.97)  the plain label inks across the lower third, two lines, the exact counts (the voice need not say
 *                   them): "825 commits · all authored by Cheng Lou" / "756 also credit Claude Code · no model named"
 *                   (the second line inks as the voice reaches 'most also credit')
 *   agent   (3.49)  the paler hand catches a faint cool rim on its upper-left edge (the window's light)
 *   Codex   (8.69)  nothing new is drawn: no third hand (a mention in a document, not a presence)
 *   film    (10.50) the label has gone; the camera pulls back so the desk sits inside the frame of the copper line and
 *                   its tags (an L5 near plane strung across the top of frame between two posts, out of focus): the
 *                   film is a made thing too
 *   process (15.19) all three hands lift off the keys and lie flat beside the keyboard, at the same moment
 *   (to 18.08)      hold: the screen, the lamp, the dawn; the hands still. Ends clean into ch08-s08's crossfade.
 *
 * Neutral light throughout: the screen's wash and the lamp fall on every hand alike; no hero light, no praise or blame.
 */
import { Timeline } from '../../../core';
import type { Camera3 } from '../../../film';
import { FONT, cam3Interp, defineShot, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { deskBack, deskFrameLine, deskFront } from '../sets/ch08-s07-desk';

const ID = 'ch08-s07';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));

interface Beats {
  D: number;
  hands: number;
  commits: number;
  most: number;
  agent: number;
  film: number;
  process: number;
}

const LINE1 = '825 commits · all authored by Cheng Lou';
const LINE2 = '756 also credit Claude Code · no model named';

/** camera keys: a very slow drift in on the hands, then on 'film' a slight pull back to the framed wide */
const CLOSE0: Camera3 = { x: 640, y: 424, z: 172, lens: 1 };
const CLOSE1: Camera3 = { x: 652, y: 416, z: 206, lens: 1 };
const WIDE: Camera3 = { x: 640, y: 362, z: 0, lens: 1 };
const WIDE1: Camera3 = { x: 636, y: 360, z: -8, lens: 1 };

function camAt(t: number, b: Beats): Camera3 {
  const p0 = b.film - 0.25;
  const p1 = b.film + 4.1;
  if (t < p0) return cam3Interp(CLOSE0, CLOSE1)(sm(t / p0) * 0.5 + (t / p0) * 0.5);
  if (t < p1) return cam3Interp(CLOSE1, WIDE)(smr((t - p0) / (p1 - p0)));
  return cam3Interp(WIDE, WIDE1)(sm((t - p1) / (b.D - p1)));
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const beats: Beats = {
      D: T.duration,
      hands: T.beat('hands'),
      commits: T.beat('commits'),
      most: T.word('L0810', 'most'),
      agent: T.beat('agent'),
      film: T.beat('film'),
      process: T.beat('process'),
    };
    tl.hold(0, T.duration);
    return { tl, beats };
  },
  paint(f, _s, scene) {
    const b = scene.beats as Beats;
    const t = f.t;
    const tq = f.tq;
    const cam = camAt(t, b);
    f.camera(cam);
    deskBack(f, { key: ID, lamp: 0.75 });
    // both pairs of hands come to rest together, landing on 'process'
    const rest = seg(tq, b.process - 0.5, b.process + 0.05);
    const agentRim = 0.75 * seg(t, b.agent - 0.1, b.agent + 0.6);
    f.layer('L4', (c, env) => deskFront(c, env, { tq, hands: { rest, agentRim }, screen: 0.85 }));
    f.layer('L5', (c, env) => deskFrameLine(c, env, { tq }));
    commitLabel(f.c, f.mood, t, b);
  },
});

/** the label: two lines inked left to right across the lower third on a soft dark plate; gone before 'film' */
function commitLabel(c: CanvasRenderingContext2D, mood: { ink: string; core: string }, t: number, b: Beats) {
  const l1 = seg(t, b.commits - 0.12, b.commits + 1.15);
  const l2 = seg(t, b.most - 0.1, b.most + 1.25);
  const out = 1 - seg(t, b.film - 0.75, b.film - 0.1);
  const A = sm(l1 * 3) * out;
  if (A <= 0.01) return;
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 27px ${FONT.text}`, 27);
    const font = `500 ${size}px ${FONT.text}`;
    c.font = font;
    const w1 = c.measureText(LINE1).width;
    const w2 = c.measureText(LINE2).width;
    const w = Math.max(w1, w2);
    const y1 = 584, y2 = 584 + size * 1.32;
    c.globalAlpha = A;
    softPlate(c, 640, (y1 + y2) / 2 - size * 0.35, w + 200, size * 2.4 + 70, mood.ink, 0.62);
    c.fillStyle = mixLab('#efe6d2', mood.core, 0.22);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const line = (txt: string, tw: number, y: number, u: number, id: string) => {
      if (u <= 0.001) return;
      const x = 640 - tw / 2;
      c.save();
      c.beginPath();
      c.rect(x - 6, y - size * 1.2, (tw + 12) * u, size * 1.7);
      c.clip();
      c.fillText(txt, x, y);
      c.restore();
      textProbe(c, id, x, y - size * 0.8, tw, size, A * (u > 0.4 ? 1 : u));
    };
    line(LINE1, w1, y1, l1, `${ID}-l1`);
    line(LINE2, w2, y2, l2, `${ID}-l2`);
  });
  c.restore();
}
