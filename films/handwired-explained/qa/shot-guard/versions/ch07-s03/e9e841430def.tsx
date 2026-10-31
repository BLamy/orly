/**
 * ch07-s03 — THE VALVE SHUTS (plate; crossfade in from s02 on the same plate and framing; dawnGold → duskRose in shot;
 * 24.1 s). The chapter's quiet moment: one bias lowered, the gate shut, and learning dies behind it.
 *   L0706 "Lower b to minus four tenths. The valve shuts, and every slope behind it goes dark."
 *   L0707 "A README in the project warns: “Without any decay, a unit whose gate has closed gets no gradient and stays
 *          shut”."   (spoken, never set on screen)
 *   L0708 "The neurons of 1943 couldn't learn. These can, if you let them."
 *
 * TEACHES, word by word (every number COMPUTED in FP32 by sets/ch07-s02-valve):
 *   0–3        the same open valve as s02's last frame, its backward arrows lit; the light cools to duskRose (3 s)
 *   'Lower'    the b dial turns, heavily, and the cam rolls back toward its corner (the tag re-inks b −0.4 on 'four')
 *   'shuts'    the wheel drops onto the flat: the gate falls shut with a jolt; the ruler's pointer settles at −0.15,
 *              below its zero mark; the outflow stops and the tray is empty; the product under it re-inks 1.5 × 0 = 0
 *              and the bottom line becomes b = −0.4 → gate −0.15 · y = 0
 *   'dark'     the backward arrows go out on twos, right to left (tray, b, g, w); each slope becomes 0; the line
 *              finishes '· every slope 0'. Then 1.8 s of no narration: the haze, the dark arrows, the closed gate
 *   'Without'  a small paper card drops onto the plate: its source and the gallery's cure (the sentence is spoken)
 *   'decay'    a hair-thin paper spring draws itself at the card's corner: weight decay (the toy valve does not reopen)
 *   'neurons'  far back in the haze beside the plate, the ghost of ch02's 1943 lanterns (two feeding a third, wiring
 *              fixed) fades up at 30 %; the camera pulls back slowly so ghost and valve share the frame
 *   'can'      the valve's channel catches the warm rim light again; the 1943 ghost fades
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { cam3Interp, cardProbe, defineShot, FONT, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import {
  V_COPPER, V_INK, VALVE_CAM_END, VALVE_INK, VG, drawValve, valveBackward, valveForward, valveNear, valveRoom, vfmt, vInkSegs,
} from '../sets/ch07-s02-valve';
import { gateLanterns } from '../sets/ch02-s02-lanterns';

const ID = 'ch07-s03';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const W0 = 0.5, G0 = 0.25, B0 = -0.1, B1 = -0.4;
const OPEN = valveBackward(W0, G0, B0);
const SHUT = valveForward(W0, G0, B1);
/** b at which the gate just closes (g + b = 0) */
const B_EDGE = -G0;
const END: Camera3 = { x: 770, y: 380, z: -400, lens: 1 };
/** the ghost lanterns' depth: behind the plate, in front of the wall, in the haze */
const GHOST: LayerSpec = { id: 'ghost', z: 1560, haze: 0.4, blur: 1.5 };

const pullU = (t: number, b: Beats) => win(t, b.last - 0.5, b.can + 0.9);

interface Beats {
  D: number;
  lower: number;
  four: number;
  shut: number;
  dark: number;
  quote: number;
  decay: number;
  lanterns: number;
  can: number;
  last: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      lower: T.beat('lower'),
      four: T.word('L0706', 'four'),
      shut: T.beat('shut'),
      dark: T.beat('dark'),
      quote: T.beat('quote'),
      decay: T.beat('decay'),
      lanterns: T.beat('lanterns'),
      can: T.beat('can'),
      last: T.line('L0708').start,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);

    // ---- camera: held on s02's framing, then a very slow pull back on the last line
    const cam = cam3Interp({ ...VALVE_CAM_END }, END)(pullU(t, b));
    f.camera(cam);
    // the light cools across the opening 3 s (quantised: the baked wall and sheet re-bake 16 times, not every frame)
    const mu = Math.round(win(t, 0, 3) * 16) / 16;
    if (mu < 1) f.setMood('duskRose', { from: 'dawnGold', u: mu });

    // ---- b: a slow heavy turn that closes the gate exactly on 'shuts', then the last of the detent
    let bv: number;
    if (tq < b.shut) bv = B0 + (B_EDGE - B0) * win(tq, b.lower + 0.15, b.shut);
    else bv = B_EDGE + (B1 - B_EDGE) * (1 - Math.pow(1 - clamp01((tq - b.shut) / 0.35), 3));
    const settle = b.shut + 0.35;
    const jolt = t >= b.shut ? Math.exp(-(t - b.shut) * 9) : 0;
    // the arrows go dark on twos, right to left: tray, b, g, w
    const d = (k: number) => (tq >= b.dark + k * 0.25 ? clamp01((tq - b.dark - k * 0.25) / 0.17) : 0);
    const dark: [number, number, number, number] = [d(0), d(3), d(2), d(1)];
    const zero = win(tq, b.dark + 0.2, b.dark + 1.0);

    valveRoom(f, { key: ID, paper: 1 });

    // ---- the 1943 ghost, behind the plate in the haze (beside it once the camera pulls back)
    const ghostA = 0.3 * win(t, b.lanterns - 0.1, b.lanterns + 1.4) * (1 - win(t, b.can + 0.1, b.can + 1.3));
    if (ghostA > 0.003) {
      f.layer(GHOST, (c, env) => {
        gateLanterns(c, env, { a: 1, b: 1, out: 1, ring: 2, alpha: ghostA, at: { x: 1010, y: 168 }, scale: 0.5 });
      });
    }

    f.layer(VALVE_INK, (c, env) => {
      // the tray empties with the outflow (its level IS y); the read slip hides while the pointer travels
      const read = 1 - win(t, b.lower + 0.1, b.lower + 0.4) + win(t, settle, settle + 0.3);
      drawValve(c, env, {
        paper: 1,
        w: W0,
        g: G0,
        b: bv,
        up: 1,
        down: 1,
        fill: 1,
        tags: { w: 1, g: 1, b: 1 },
        tagVals: { w: W0, g: G0, b: tq < b.four ? B0 : B1 },
        kick: { b: t >= settle ? Math.exp(-(t - settle) * 7) * Math.sin((t - settle) * 26) * 0.4 : 0 },
        inTag: 1,
        collarTag: 1,
        read: clamp01(read),
        back: 1,
        armW: 1,
        armG: 1,
        bGlow: 1,
        dark,
        slopes: { w: 1, g: 1, b: 0.85, zero, vals: OPEN },
        warm: win(t, b.can - 0.1, b.can + 0.7),
        jolt,
        tq,
        id: ID,
      });

      // the product under the tray: s02's line out, the shut valve's in (never both readable at once)
      const outP = 1 - win(t, b.shut - 0.3, b.shut - 0.02);
      const inP = win(t, b.shut + 0.05, b.shut + 0.35);
      vInkSegs(c, [
        { text: `${vfmt(valveForward(W0, G0, B0).channel)} × ${vfmt(valveForward(W0, G0, B0).opening)}`, a: outP },
        { text: ` = ${vfmt(valveForward(W0, G0, B0).y)}`, a: outP, color: V_COPPER },
      ], VG.tray.x, VG.tray.bot + 42, { size: 26, font: 'serif', weight: 600, align: 'center', id: `${ID}-prod0` });
      vInkSegs(c, [
        { text: `${vfmt(SHUT.channel)} × ${vfmt(SHUT.opening)}`, a: inP },
        { text: ` = ${vfmt(SHUT.y)}`, a: inP, color: V_INK },
      ], VG.tray.x, VG.tray.bot + 42, { size: 26, font: 'serif', weight: 600, align: 'center', id: `${ID}-prod1` });

      // the bottom line: s02's derived slopes, then the shut valve's account
      vInkSegs(c, [
        { text: '∂y/∂w = ', a: outP },
        { text: `3 × ${vfmt(valveForward(W0, G0, B0).opening)}`, a: outP },
        { text: ` = ${vfmt(OPEN.dw)}`, a: outP, color: V_COPPER },
        { text: '   ·   ∂y/∂g = ', a: outP },
        { text: '3w', a: outP },
        { text: ` = ${vfmt(OPEN.dg)}`, a: outP, color: V_COPPER },
        { text: '  (derived)', a: 0.75 * outP },
      ], 640, 628, { size: 25, font: 'mono', weight: 500, align: 'center', id: `${ID}-eq2` });
      vInkSegs(c, [
        { text: `b = ${vfmt(B1)} → gate ${vfmt(SHUT.pre)}`, a: inP },
        { text: `  ·  y = ${vfmt(SHUT.y)}`, a: win(t, b.shut + 0.5, b.shut + 0.8) },
        { text: '  ·  every slope 0', a: win(t, b.dark + 0.9, b.dark + 1.2) },
      ], 640, 628, { size: 25, font: 'mono', weight: 500, align: 'center', id: `${ID}-eq3` });

      // the formula stays at the top left
      vInkSegs(c, [{ text: 'y = 3w · max(0, g + b)', a: 1 }], 176, 170, { size: 34, font: 'italic', weight: 500, id: `${ID}-eq1` });

      readmeCard(c, env, t, b);
      decaySpring(c, env, t, b);
    });

    // the bench edge sinks out of the way as the camera pulls back (a slight tilt up)
    valveNear(f, ID, 236 * pullU(t, b));
  },
});

/** the card: dropped onto the plate on 'Without', bearing only its source and the gallery's cure */
const CARD = { x: 748, y: 92, w: 372, h: 84 };
function readmeCard(c: C, env: PaintEnv, t: number, b: Beats) {
  const u = (t - b.quote + 0.12) / 0.42;
  if (u <= 0) return;
  const fall = 1 - sm(u);
  const a = clamp01(u * 3);
  c.save();
  const s1 = legibleSize(c, `italic 400 26px ${FONT.text}`, 26, "the learned gallery's README");
  const s2 = legibleSize(c, `600 24px ${FONT.sc}`, 24, 'its cure: weight decay');
  c.font = `italic 400 ${s1}px ${FONT.text}`;
  const w1 = c.measureText("the learned gallery's README").width;
  c.font = `600 ${s2}px ${FONT.sc}`;
  const w2 = c.measureText('its cure: weight decay').width;
  const w = Math.max(CARD.w, Math.max(w1, w2) + 44);
  const h = Math.max(CARD.h, s1 + s2 + 30);
  const x = CARD.x + CARD.w - w, y = CARD.y;
  c.translate(x + w / 2, y + h / 2 - 46 * fall);
  c.rotate(-0.012 + 0.07 * fall);
  c.translate(-(x + w / 2), -(y + h / 2));
  c.globalAlpha = a;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2 * (1 - fall));
  c.fillRect(x + 4 + 10 * fall, y + 6 + 18 * fall, w, h);
  c.fillStyle = mixLab('#f6edd8', env.mood.core, 0.18);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#2a1d14', 0.35);
  c.lineWidth = 1;
  c.strokeRect(x, y, w, h);
  textRole(c, 'subject', () => {
    c.font = `italic 400 ${s1}px ${FONT.text}`;
    c.fillStyle = '#2a1d14';
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText("the learned gallery's README", x + 20, y + 10 + s1);
    c.font = `600 ${s2}px ${FONT.sc}`;
    c.fillStyle = V_COPPER;
    c.fillText('its cure: weight decay', x + 20, y + 18 + s1 + s2);
    textProbe(c, `${ID}-card`, x + 20, y + 10, w - 40, h - 18, a);
  });
  cardProbe(c, `${ID}-cardp`, x, y, w, h, a, a);
  c.restore();
}

/** a hair-thin paper spring drawing itself down from the card's right corner (weight decay) */
function decaySpring(c: C, env: PaintEnv, t: number, b: Beats) {
  const u = clamp01((q2(t) - b.decay + 0.05) / 0.9);
  if (u <= 0) return;
  const x = CARD.x + CARD.w - 22, y0 = CARD.y + CARD.h + 2;
  const L = 96, coils = 11;
  c.save();
  c.strokeStyle = withAlpha(mixLab(V_INK, V_COPPER, 0.4), 0.9);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(x, y0);
  const n = 140;
  for (let i = 1; i <= Math.round(n * u); i++) {
    const k = i / n;
    const yy = y0 + 8 + k * L;
    const xx = x + (k < 0.06 || k > 0.94 ? 0 : Math.sin(k * coils * Math.PI * 2) * 7);
    c.lineTo(xx, yy);
  }
  c.stroke();
  // the hook at the foot, once drawn
  if (u >= 1) {
    c.beginPath();
    c.arc(x, y0 + L + 14, 4, -Math.PI / 2, Math.PI);
    c.stroke();
  }
  c.restore();
  void env;
}
