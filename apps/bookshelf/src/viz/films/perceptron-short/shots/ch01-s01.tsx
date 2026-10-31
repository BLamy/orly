/**
 * ch01-s01 — title card over the night-dark laboratory (labGreen, ≈5.2 s, the film's first frame).
 *
 * fadeBlack in: the first 0.8 s are TRUE black (pure #000 over everything, type included). At the
 * `title` beat the room wakes out of black in about a second and the graded night backlight (a hot centre
 * low behind the middle window, falling off toward the top of the glass: sets/ch01-s01-nightlab NIGHT_LOOK)
 * is fully up by 2.0 s, so the title rises over a lit window, not a black slide. Depth: the window wall, a
 * slow fog sheet (y 430, 6 px/s) between the windows and the eye, the haze plane, the sleeping plugboard and
 * racks pushed back into the air (a haze veil, ≈25% lighter than the eye), the eye on its stand as the one
 * sharp ink plane, then the near desk, chair and stool. On "see" ONE glint of window light crosses the eye's
 * photocells and is gone; the grid stays dark to the cut (ch01-s02 starts the eye's glow on "Its").
 * Type: the title in small caps on a feathered plate fades up at 0.8 s; the place stamp
 * (CORNELL AERONAUTICAL LABORATORY / BUFFALO, NEW YORK · c. 1960) types on, on the twos, from the same title
 * beat, complete by ≈2.3 s; both hold to ≈4.5 s and are gone by 4.9 s, before the crossfade.
 * The camera dollies in and lands EXACTLY on ch01-s02's opening framing (MATCH_CAM) at the cut, with the
 * same exposure and foreground, so the 1 s crossfade is a true match-dissolve.
 * Review round 4 (story, four rounds): the machine is a RUMOUR in the dark. After the machine is drawn the
 * whole action plane takes a further SLEEP_DARK pass toward black (housing, stand, card post, racks under
 * ≈12% luma at 2.8 s; only the thin pole, where the bright blind band blooms over it, reaches ≈14), and only
 * the glint (markIEyeGlint) is laid over it. s02 opens on exactly this darkness and lifts it on "Its".
 */
import { Timeline, ease } from '../../../core';
import { FONT, actionScale, defineShot, hash1, softPlate, withAlpha } from '../../../film';
import { DESK_LAMP, deskLampGlow, deskLampPool } from '../sets/ch01-s01-lamp';
import type { Camera3, Palette } from '../../../film';
import { labForeground, labHaze, stoolSeatY } from '../sets/lab';
import { nearChairBack } from '../sets/ch01-s01-near';
import { NIGHT_LOOK, hungTube, nightDesk, nightLab, nightVignette } from '../sets/ch01-s01-nightlab';
import { CUT_PUSH_K, EYE_HELD, MK, SLEEP, SLEEP_DARK, LAB_CHAIR, LAB_DESK, LOW_TUBES, MATCH_CAM, NEAR_FLOOR, NEAR_PLANE, REST_WEIGHTS, drawMachine, markIEyeGlint, nightBeam, nightCabinet, sleepDarken } from '../sets/ch01-s02-machine';

/** round-1 critic (artistry): the dolly starts 60 px further left (was x 640), so the three sleeping cabinets
 * take less of the frame early and the middle window carries the composition; it still lands on MATCH_CAM */
const START: Camera3 = { x: 580, y: 352, z: -20, lens: 1 };
const END: Camera3 = MATCH_CAM;
const CAMS = [START, END];
/** type holds to here (s), then fades out over TYPE_OUT: both cards are gone by ≈4.6 s, before the
 * crossfade into ch01-s02 begins (they never ghost over s02's tubes) */
const TYPE_HOLD = 4.5;
const TYPE_OUT = 0.4;
/** the place stamp must be fully typed by about this time (round-1 critic: it starts on "machine" and is done by
 * ≈2.9 s, so the whole stamp holds fully legible for ≈1.6 s before it fades 4.5 → 4.9 s) */
const TYPED_BY = 2.9;
/** the stamp's struck size and line lead (round-1 critic, legibility: 25 px (37 px at 1080p) on a tighter 0.96 em pitch, so "LABORATORY" ends ≈30 px short of
 * the camera stand's pole, on the desk's dark front, over its own feathered plate) */
const PLACE_SIZE = 25;
const PLACE_LEAD = 36;
/** the cabinets right of the eye (world x from here) are darkened a step less than the rest while the stamp
 * holds (round-1 critic: their louvres and dial lattice read as cut detail, not a dead block), easing back to the
 * full SLEEP_DARK by the cut so s02 opens on exactly its own darkness */
const RACK_EASE = 0.15;
const RACK_X0 = 650;
const RACK_X1 = 700;
const PLACE = ['CORNELL AERONAUTICAL LABORATORY', 'BUFFALO, NEW YORK · c. 1960'];
/** the dolly's lens settles to MATCH_CAM's this long before the cut (from there the push is pure dolly) */
const LENS_BY = 1.2;
const K_START = actionScale(START);
const K_END = actionScale(END);
const easeIO = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
/** the camera as a pure function of shot time: a slow push that lands on MATCH_CAM AT the cut still moving
 * (CUT_PUSH_K, the rate ch01-s02 starts with) and carries on past the end through the crossfade, so the
 * dissolve reads as one continuous push. x/y settle (s02's truck starts from rest) */
function camAt(t: number, D: number): Camera3 {
  const tt = Math.max(0, t);
  const lens = START.lens + (END.lens - START.lens) * easeIO(tt / (D - LENS_BY));
  let k: number;
  if (tt >= D) k = K_END + CUT_PUSH_K * (tt - D);
  else {
    // cubic Hermite: rest at the start, CUT_PUSH_K at the cut
    const u = tt / D;
    const u2 = u * u;
    const u3 = u2 * u;
    k = (2 * u3 - 3 * u2 + 1) * K_START + (-2 * u3 + 3 * u2) * K_END + (u3 - u2) * D * CUT_PUSH_K;
  }
  const e = easeIO(tt / D);
  return { x: START.x + (END.x - START.x) * e, y: START.y + (END.y - START.y) * e, z: 1000 - (1000 * lens) / k, lens };
}
/** the room is fully up (NIGHT_LOOK) by this time, so the title rises over a lit window, not a black slide */
const LIGHT_BY = 2.0;
/** the faint backlight starts rising out of black here (a dim green glow is legible by the title beat) */
const RISE = 0.3;
/** how long the room takes to wake out of black */
const HEAD = 1.1;

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

/** the eye at night: dark, then on "see" ONE glint of window light crosses the cells (a diagonal band from
 * the upper right) and is gone: review round 4, the grid stays dark to the cut and s02 starts its glow on
 * "Its" (5.6 s), not here */
const CELLS = new Float32Array(400);
function eyeCells(t: number, k: number): Float32Array {
  void t;
  const s = k * 1.5 - 0.25; // the band's position along the diagonal: off-plate before and after
  for (let i = 0; i < 400; i++) {
    const r = Math.floor(i / 20);
    const c = i % 20;
    const p = (19 - c + r) / 38; // 0 at the upper-right corner, 1 at the lower-left
    const d = (p - s) / 0.075;
    // the band only: review round 4, the grid stays DARK after the glint (its glow begins on s02's "Its")
    CELLS[i] = 0.55 * Math.exp(-d * d);
  }
  return CELLS;
}

/** a rectangular plate with feathered edges (fe px) on all four sides, drawn in vertical slices */
function featherRect(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, fe: number, ink: string, a: number) {
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
  const W = x1 - x0 + 2 * fe;
  const w = W / N;
  for (let i = 0; i < N; i++) {
    const x = x0 - fe + i * w;
    const xm = x + w / 2;
    const e = Math.min(1, (xm - (x0 - fe)) / (2 * fe), (x1 + fe - xm) / (2 * fe));
    c.globalAlpha = a * e * e * (3 - 2 * e);
    c.fillRect(x - 0.5, y0 - fe, w + 1, hh);
  }
  c.restore();
}

/** struck typewriter lines (the kit's placeStamp face), typed on the twos, one line after the other */
function typeLines(c: CanvasRenderingContext2D, m: Palette, t: number, o: { lines: string[]; x: number; y: number; lead: number; size: number; at: number; cps: number; A: number; seed: number; track: number }) {
  const tq = Math.floor(t * 12) / 12;
  c.save();
  c.font = `400 ${o.size}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const adv = c.measureText('M').width * o.track;
  let typed = Math.max(0, Math.floor((tq - o.at) * o.cps + 1e-6));
  let n = 0;
  o.lines.forEach((line, li) => {
    const shown = Math.min(line.length, typed);
    typed -= line.length;
    for (let i = 0; i < shown; i++, n++) {
      const ch = line[i];
      if (ch === ' ') continue;
      const ink = 0.78 + 0.22 * (0.5 + 0.5 * hash1(n, o.seed + 41));
      const dy = hash1(n, o.seed + 42) * 0.6;
      const rot = hash1(n, o.seed + 43) * 0.012;
      c.save();
      c.translate(o.x + i * adv + adv / 2, o.y + li * o.lead + dy);
      c.rotate(rot);
      c.globalAlpha = o.A * 0.92 * ink;
      c.fillStyle = m.rim;
      c.fillText(ch, 0, 0);
      c.restore();
    }
  });
  c.restore();
}

export default defineShot({
  id: 'ch01-s01',
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const light = tl.channel('light', 0.3);
    tl.tween(light, NIGHT_LOOK.light, { at: RISE, dur: LIGHT_BY - RISE, ease: ease.move });
    const see = T.word('L0101', 'see');
    const eye = tl.channel('eye', 0);
    tl.tween(eye, 1, { at: see - 0.15, dur: 1.0, ease: ease.enter });
    tl.hold(0, T.duration);
    const titleAt = T.beat('title');
    // type holds to 4.5 s and is gone by 4.9 s (the crossfade into ch01-s02 runs ≈4.7 → 5.7 s)
    const out = Math.min(TYPE_HOLD, T.duration - 0.7);
    // the room wakes out of black under the title, in about a second
    const head = HEAD;
    // round-1 critic (sync): the title gets the screen alone first, then the place stamp types on with "machine"
    // (the script's place beat), complete by ≈2.9 s and fully legible ≈1.6 s before it fades (4.5 → 4.9 s)
    const placeAt = T.word('L0101', 'machine') - 0.15;
    const chars = PLACE.reduce((n, l) => n + l.length, 0);
    const cps = Math.max(40, chars / Math.max(0.6, TYPED_BY - placeAt));
    return { tl, light, eye, titleAt, placeAt, cps, see, dur: T.duration, out, head };
  },
  paint(f, s, scene) {
    const t = f.t;
    const cam = camAt(t, scene.dur);
    f.camera(cam);
    const light = s.get(scene.light);
    // the sun sits on the glass right behind the eye (it tracks the eye's screen position through the dolly),
    // so the camera box stands against the brightest glass of the room
    const sunX = 640 + (MK.EYE.x - cam.x) * actionScale(cam);
    const L = NIGHT_LOOK;
    nightLab(f, {
      key: 'ch01-s01',
      cams: CAMS,
      light,
      sunX,
      sunRadius: L.sunRadius,
      hot: L.hot,
      focus: L.focus,
      tubesLit: 0,
      blinds: L.blinds,
      fog: L.fog,
      glass: L.glass,
      floorDark: L.floorDark,
      wall: L.wall,
      air: () => {
        labHaze(f, { key: 'ch01-s01', cams: CAMS, hot: 640, k: 0.75 * light });
        // a slow sheet of fog between the windows and the eye (a third plane of air)
        f.fog({ yCenter: 430, height: 170, alpha: 0.15 * (light / L.light), drift: 6 });
      },
      mid: () => {
        nightCabinet(f, { key: 'ch01-s01', dark: 0.7 });
        nightBeam(f, { key: 'ch01-s01', wx: 640, k: 0.8 * light });
        // the two low fixtures s02 strikes, cold here
        f.layer('L3', (c, env) => {
          for (const p of LOW_TUBES) hungTube(c, env, { x: p.x, y: p.y, lit: 0 });
        });
      },
    });

    // L4 — the sleeping machine in near-darkness; the eye and its card silhouetted against the window
    const eyeK = s.get(scene.eye);
    // the glint's own envelope: up as the band reaches the face, gone as it leaves (nothing is held)
    const glint = Math.sin(Math.PI * Math.min(1, Math.max(0, (eyeK - 0.1) / 0.8)));
    f.layer('L4', (c, env) => {
      drawMachine(c, env, {
        cells: undefined,
        patch: 0,
        racks: 1,
        // a glint of window light on the face as the band crosses, settling to the held face light
        eyeLight: 0,
        card: 0,
        knobs: { weights: REST_WEIGHTS },
        // held near black (review rounds 1-3: stand, desk and racks under ≈15% luminance): only the window,
        // the blind shafts and the glint on "see" read, so s02 shows each part for the first time. The shared
        // SLEEP look: shuttered faces (no dial lattice), no knob-top rim, only a faint window rim along the
        // cabinet tops so their cut edge sits against the glass; s02 opens on exactly this
        dim: { patch: SLEEP.dim, racks: SLEEP.dim },
        faces: SLEEP.faces,
        sleepRim: SLEEP.sleepRim,
        topRim: SLEEP.topRim,
        sideRim: SLEEP.sideRim,
        shutterDark: SLEEP.shutterDark,
        veil: { patch: SLEEP.veil * (light / NIGHT_LOOK.light), racks: SLEEP.veil * (light / NIGHT_LOOK.light) },
      });
      // review round 4: the machine is a rumour in the dark. The whole action plane (housing, stand, card post,
      // board, racks) goes a further step toward black (under ≈12% luma at 2.8 s), then ONLY the glint is laid
      // over it: the band of window light crossing the cells and the raking light on the face
      // the cabinets (right of RACK_X0) get a step less of it while the stamp holds, easing back to full by the cut
      const ease = RACK_EASE * (1 - sm((t - 3.6) / 1.5));
      if (ease > 0.002) {
        c.save();
        c.globalCompositeOperation = 'source-atop';
        const g = c.createLinearGradient(RACK_X0, 0, RACK_X1, 0);
        g.addColorStop(0, `rgba(0,0,0,${SLEEP_DARK.toFixed(4)})`);
        g.addColorStop(1, `rgba(0,0,0,${(SLEEP_DARK - ease).toFixed(4)})`);
        c.fillStyle = g;
        c.fillRect(-2000, -2000, 6000, 6000);
        c.restore();
      } else sleepDarken(c, SLEEP_DARK);
      if (glint > 0.002) markIEyeGlint(c, { ...MK.EYE_AT, cells: eyeCells(t, eyeK), light: 0.55 * glint }, env);
    });
    f.rim({ x: 0, y: -1 });
    // the glint's breath of light on the glass in front of the face: it comes and goes with the band (the eye
    // holds no glow after it; s02 starts the glow on "Its")
    if (glint > 0.01) f.practical({ x: MK.EYE.x, y: MK.EYE.y, kind: 'screen', seed: EYE_HELD.seed, intensity: 0.12 * glint, radius: EYE_HELD.radius, layer: 'L4' });
    // near — the desk end and its gooseneck lamp (cold), crisp against the fog band
    const desk = nightDesk(f, { key: 'ch01-s01', ...LAB_DESK });
    // round-1 critic: the desk lamp is lit, dim (one warm-neutral point in the green night, anchoring the near
    // plane); its bulb sits in the near desk's plane, carried to the action plane's coordinates for the practical
    const lampI = DESK_LAMP * sm((t - RISE) / HEAD);
    deskLampGlow(f, cam, desk.bulb, lampI);
    // near plane (z 560): the desk's swivel chair pushed back under the desk at far left, framing the place
    // stamp (the eye, its cable and the racks stay clear of near-plane blur)
    labForeground(f, { key: 'ch01-s01', cams: CAMS, floor: 760, items: [LAB_CHAIR] });
    // s02's near stool with its coil of cable (z 780), so the cut's foreground matches
    labForeground(f, { key: 'ch01-s01', cams: CAMS, plane: NEAR_PLANE, floor: NEAR_FLOOR, items: [{ kind: 'stool', x: 640, s: 0.9 }, { kind: 'coil', x: 634, s: 0.55, y: stoolSeatY(NEAR_FLOOR, 0.9) + 6 }] });
    // L5: the edge of a chair back, near black and out of focus in the lower-right corner (the reference's
    // near / far stack); the dolly grows it into the corner and s02 opens on it
    nearChairBack(f, { key: 'ch01-s01' });
    nightVignette(f, 0.95);
    deskLampPool(f, cam, desk.bulb, lampI);

    const c = f.c;
    // fadeBlack in: a faint backlight rises out of black from RISE; the room is half up by the title beat
    const head = 1 - sm((t - RISE) / scene.head);
    if (head > 0) {
      c.save();
      c.globalAlpha = Math.min(1, head * 1.04);
      c.fillStyle = '#000';
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // screen-locked type (above the head black, so the title rises out of the dark); both cards hold
    // to scene.out, then fade under the crossfade
    const outK = 1 - sm((t - scene.out) / TYPE_OUT);
    const A = sm((t - (scene.titleAt - 0.2)) / 0.6) * outK; // fully up by "Once" (1.2 s)
    const TY = 152;
    if (A > 0) {
      c.save();
      c.globalAlpha = A;
      // a firm plate with a wide feather: the window bars die out well before the cap height
      softPlate(c, 640, TY - 6, 1240, 280, f.mood.ink, 0.92);
      // and a feathered band (60 px top and bottom, soft ends) right under the title and its rules, so no
      // mullion or slat edge crosses a letter
      {
        const y0 = TY - 66;
        const y1 = TY + 56;
        const fe = 60;
        const x0 = 640 - 470;
        const x1 = 640 + 470;
        const gv = c.createLinearGradient(0, y0 - fe, 0, y1 + fe);
        const hh = y1 - y0 + 2 * fe;
        gv.addColorStop(0, withAlpha(f.mood.ink, 0));
        gv.addColorStop(fe / hh, withAlpha(f.mood.ink, 0.62));
        gv.addColorStop(1 - fe / hh, withAlpha(f.mood.ink, 0.62));
        gv.addColorStop(1, withAlpha(f.mood.ink, 0));
        c.save();
        c.fillStyle = gv;
        // drawn in slices so the ends feather too (vertical gradient × a horizontal smoothstep ramp)
        const N = 24;
        const w = (x1 - x0 + 240) / N;
        for (let i = 0; i < N; i++) {
          const u = (i + 0.5) / N;
          const e = Math.min(1, u / 0.2, (1 - u) / 0.2);
          c.globalAlpha = A * 0.9 * e * e * (3 - 2 * e);
          c.fillRect(x0 - 120 + i * w - 0.5, y0 - fe, w + 1, hh);
        }
        c.restore();
      }
      c.font = `500 54px ${FONT.sc}`;
      (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '3px';
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillStyle = f.mood.core;
      c.fillText('The Machine That Learned to See', 640, TY + 14);
      const w = c.measureText('The Machine That Learned to See').width;
      const g = sm((t - scene.titleAt - 0.1) / 0.9);
      c.strokeStyle = withAlpha(f.mood.rim, 0.75);
      c.lineWidth = 1.2;
      for (const y of [TY - 46, TY + 36]) {
        c.beginPath();
        c.moveTo(640 - (w / 2) * g, y);
        c.lineTo(640 + (w / 2) * g, y);
        c.stroke();
      }
      c.restore();
    }
    // place stamp: two typed lines on the desk's dark apron, left of the eye's pedestal
    const PA = sm((t - scene.placeAt + 0.05) / 0.25) * outK;
    if (PA > 0) {
      c.save();
      c.globalAlpha = PA;
      // the kit's soft ink plate, deep enough that the blind-shadow stripes never cross the second line
      // (round-1 critic: a firmer ink plate, so the struck letters never fight the desk's top edge)
      softPlate(c, 340, 588, 860, 200, f.mood.ink, 0.6);
      softPlate(c, 330, 590, 680, 124, f.mood.ink, 0.6);
      c.restore();
      // round-1 critic (legibility): a feathered rectangular plate (24 px feather) right under the struck lines, so
      // no desk, lamp or chair edge crosses a letter
      featherRect(c, 44, 552, 584, 630, 24, f.mood.ink, 0.5 * PA);
      typeLines(c, f.mood, t, { lines: PLACE, x: 56, y: 580, lead: PLACE_LEAD, size: PLACE_SIZE, at: scene.placeAt, cps: scene.cps, A: PA, seed: 11, track: 0.96 });
    }
    // true black for the first frames only (before the backlight starts to rise)
    if (t < RISE) {
      c.save();
      c.fillStyle = '#000';
      c.fillRect(-20, -20, 1320, 760);
      c.restore();
    }
  },
});
