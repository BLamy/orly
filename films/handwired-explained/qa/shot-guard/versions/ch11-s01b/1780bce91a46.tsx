/**
 * ch11-s01b — THE RECOVERY GRID, part two: the fix, given room to be seen (winterBlue; cut in closer; 13.38 s).
 *   L1103 "Train only the unread entries, to keep going after a mistake, and valid JSON parses exactly as before."
 *         (a held 3.8 s breath after "keep going": the gap is the picture's)
 *
 * The same quilt (sets/ch11-s01-quilt), closer; the kinked thread still sits stalled at its dark well.
 *   1.00 Train     STEP 4: the narrator's hands enter from the lower left and lay a pale paper stencil over the table
 *                  (the 'place' action): solid over every lit cell (their copper pins poke through it), cut open over
 *                  every dark one, so training can reach only the unread entries. The training label sets in. Through
 *                  the holes each dark well fills with a soft, shimmering blend of three or four faint copper tiles
 *                  (the free entry softened into a weighted mix while it trains).
 *   3.42 wave      THE HELD WAVE (through the breath after "keep going", on into the next words): a slow diagonal wave
 *                  crosses the grid on twos; each well it reaches snaps to its single strongest tile with a small detent
 *                  glint. The 240 pinned cells never flicker, not once. The hands then lift the stencil away.
 *   9.84 exactly   STEP 5: the valid thread runs again; a translucent ghost of its first run settles over it and the two
 *                  match bead for bead: unchanged by construction.
 *  11.75 pass      the kinked thread's stack loosens; it steps onto its well, which now holds a filled tile, and keeps
 *                  going along the route to the far edge.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, softPlate, textProbe, textRole, withAlpha } from '../../../film';
import { hands } from '../cast';
import {
  FRONT_MAX, QROWS, ROUTE_KINK, ROUTE_RECOVER, ROUTE_VALID, WELL, cellPx, drawBeadThread, drawPins, drawQuilt, drawStencil,
  frontCells, glyph, gp, makeRoute, quiltNear, quiltRoom, tileCol, tilesOf,
} from '../sets/ch11-s01-quilt';

const ID = 'ch11-s01b';
type C2 = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const CAM_A: Camera3 = { x: 664, y: 440, z: 296, lens: 1 };
const CAM_B: Camera3 = { x: 700, y: 452, z: 322, lens: 1 };
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: lerp(a.lens, b.lens, u) });

/** where the hand holds the stencil: its left edge, part way down (L4 rest px) */
const GRIP = gp(-1.1, 21);
/** the kinked thread's whole way: in, astray into the well, and (after training) on along the route */
const ROUTE_KINK_ON = makeRoute([...ROUTE_KINK.pts, ...ROUTE_RECOVER.pts.slice(1)]);

interface Beats {
  D: number;
  stencil: number;
  wave: number;
  after: number;
  same: number;
  pass: number;
  placeAt: number;
  placeDur: number;
  liftAt: number;
  liftDur: number;
  waveEnd: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const stencil = T.beat('stencil');
    const wave = T.beat('wave');
    const after = T.word('L1103', 'after');
    const placeDur = 1.9;
    const b: Beats = {
      D: T.duration,
      stencil,
      wave,
      after,
      same: T.beat('same'),
      pass: T.beat('pass'),
      // the stencil lands (place u = .5) half a second after "Train"
      placeAt: stencil + 0.5 - 0.5 * placeDur,
      placeDur,
      // the wave crosses the whole table through the breath and on into "after a mistake"
      waveEnd: after + 0.75,
      liftAt: after + 0.55,
      liftDur: 1.9,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = lerpCam(CAM_A, CAM_B, smr(t / b.D));
    f.camera(cam);
    quiltRoom(f, ID);

    // ---- training state
    const blend = seg(t, b.placeAt + 0.5 * b.placeDur + 0.05, b.wave - 0.2);
    // the wave front, on twos (cells along the diagonal)
    const front = tq < b.wave ? -1 : lerp(0, FRONT_MAX, clamp01((tq - b.wave) / (b.waveEnd - b.wave)));
    // ---- the stencil and the hand that carries it
    const entry = hands.entry(cam, 'L4');
    const uPlace = clamp01((tq - b.placeAt) / b.placeDur);
    const uLift = clamp01((tq - b.liftAt) / b.liftDur);
    const DROP = { x: GRIP.x - 760, y: GRIP.y + 560 };
    let hp: ReturnType<typeof hands.act> | null = null;
    let st: { dx: number; dy: number; lift: number; alpha: number } | null = null;
    let onTable = false;
    if (tq >= b.placeAt && tq < b.liftAt) {
      hp = hands.act('place', uPlace, GRIP, { held: 'none', scale: 1.45, entry });
      const sk = hands.socket(hp) ?? GRIP;
      const carried = uPlace < 0.5;
      st = carried ? { dx: sk.x - GRIP.x, dy: sk.y - GRIP.y, lift: 1 - seg(uPlace, 0.36, 0.5), alpha: 1 } : { dx: 0, dy: 0, lift: 0, alpha: 1 };
      onTable = !carried;
      if (uPlace >= 1) hp = null;
    } else if (tq >= b.liftAt) {
      hp = uLift < 1 ? hands.act('lift', uLift, GRIP, { held: 'none', scale: 1.45, entry, dropAt: DROP }) : null;
      const lifted = uLift >= 0.36;
      if (!lifted) {
        st = { dx: 0, dy: 0, lift: 0, alpha: 1 };
        onTable = true;
      } else if (uLift < 0.62) {
        const sk = hp ? hands.socket(hp) ?? GRIP : GRIP;
        st = { dx: sk.x - GRIP.x, dy: sk.y - GRIP.y, lift: seg(uLift, 0.36, 0.46), alpha: 1 };
      } else {
        st = { dx: DROP.x - GRIP.x, dy: DROP.y - GRIP.y, lift: 1, alpha: 1 - seg(uLift, 0.62, 0.8) };
      }
    }

    // ---- threads
    // the kinked thread: stalled in its well (stacked) until 'pass', then it loosens and goes on
    const rel0 = b.pass - 0.45;
    const stack = 1 - seg(tq, rel0, b.pass);
    const kHead = tq < b.pass ? ROUTE_KINK.len : ROUTE_KINK.len + (tq - b.pass) * ((ROUTE_KINK_ON.len - ROUTE_KINK.len + 4.5) / Math.max(0.6, b.D - 0.25 - b.pass));
    const kinkedBead = tq < b.pass + 0.05;
    // the valid thread again, on 'exactly', with the ghost of its first run settling over it
    const v0 = b.same - 0.4, v1 = v0 + 2.35;
    const vHead = lerp(-2.4, ROUTE_VALID.len + 4.5, (t - v0) / (v1 - v0));
    const vA = t < v0 ? 0 : 1 - seg(t, v1 - 0.35, v1);
    const ghostDy = -16 * (1 - seg(t, b.same - 0.1, b.same + 0.7));

    f.layer('L4', (c, env) => {
      drawQuilt(f, c, env, { blend, shimmer: tq, front });
      drawPins(f, c, env);
      if (front > 0) detents(c, env, front, tq, b);
      if (tq >= b.pass - 0.1) passGlint(c, env, t, b.pass);
      // the stencil lies over everything on the table; the pins poke up through it
      if (st) {
        drawStencil(f, c, env, st);
        if (onTable) drawPins(f, c, env);
      }
      if (t >= v0 && vA > 0) {
        drawBeadThread(c, env, { route: ROUTE_VALID, head: vHead, alpha: vA, seed: 11 });
        c.save();
        c.translate(0, ghostDy);
        drawBeadThread(c, env, { route: ROUTE_VALID, head: vHead, alpha: vA * 0.85 * seg(t, b.same - 0.25, b.same + 0.1), seed: 11, ghost: true });
        c.restore();
      }
      drawBeadThread(c, env, { route: ROUTE_KINK_ON, head: kHead, kinked: kinkedBead, stack, seed: 11, alpha: 1 - seg(t, b.D - 0.5, b.D - 0.1) });
      if (hp) hands.draw(c, hp, env);
    });
    f.rim({ x: 0, y: -1 });
    quiltNear(f);
    trainingLabel(f.c, f.mood, t, b);
  },
});

/** detent glints: each well on the snapping front flashes as it snaps (this tick bright, the last tick fading) */
function detents(c: C2, env: PaintEnv, front: number, tq: number, b: Beats) {
  if (tq > b.waveEnd + 0.1) return;
  const step = FRONT_MAX / Math.max(1, (b.waveEnd - b.wave) * 12);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [k, a] of [[0, 0.7], [1, 0.3]] as const) {
    for (const [i, j] of frontCells(front - k * step)) {
      const p = gp(i + 0.5, j + 0.5);
      const r = cellPx(i + 0.5, j + 0.5) * 0.55;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), a * 0.55));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
    }
  }
  c.restore();
}

/** the kinked thread steps onto its well, which now holds a filled tile: the tile catches the light as it passes */
function passGlint(c: C2, env: PaintEnv, t: number, at: number) {
  const u = clamp01((t - (at - 0.1)) / 0.9);
  if (u >= 1) return;
  const p = gp(WELL.i + 0.5, WELL.j + 0.5);
  const r = cellPx(WELL.i + 0.5, WELL.j + 0.5);
  const tt = tilesOf(WELL.i, WELL.j);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5);
  g.addColorStop(0, withAlpha(env.mood.core, 0.5 * Math.sin(Math.PI * u)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - r * 1.5, p.y - r * 1.5, r * 3, r * 3);
  c.restore();
  c.fillStyle = mixLab(tileCol(env), env.mood.core, 0.5 * Math.sin(Math.PI * u));
  glyph(c, tt.kinds[tt.best], p.x, p.y, r * 0.24);
  c.fill();
}

/** "training: about 40,000 broken payloads, 55 kinds of mistake" (screen-locked, upper right, on a soft plate) */
function trainingLabel(c: C2, mood: PaintEnv['mood'], t: number, b: Beats) {
  const at = b.stencil + 0.15;
  const A = smr((t - at) / 0.5) * (1 - smr((t - (b.D - 0.6)) / 0.5));
  if (A <= 0.001) return;
  textRole(c, 'subject', () => {
    c.save();
    const base = `500 24px ${FONT.text}`;
    const size = legibleSize(c, base, 24);
    const txt = 'training: about 40,000 broken payloads, 55 kinds of mistake';
    c.font = `500 ${size}px ${FONT.text}`;
    const W = c.measureText(txt).width;
    const xR = 1196, y = 74;
    softPlate(c, xR - W / 2, y - size * 0.32, W + 100, size * 2.6, mixLab(mood.ink, '#000000', 0.3), 0.66 * A);
    c.globalAlpha = A;
    c.textAlign = 'right';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(mood.rim, '#f3ead6', 0.55);
    c.fillText(txt, xR, y);
    textProbe(c, `${ID}-train`, xR - W, y - size * 0.75, W, size, A);
    c.restore();
  });
}

void QROWS;
