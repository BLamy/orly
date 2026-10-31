/**
 * ch03-s01 — Washington, 7 July 1958: the Weather Bureau's machine room (labGreen, ink-bleed in from the study).
 *
 * A long, low machine room: a row of IBM-704-style cabinets as black slabs with vent grilles and tape reels
 * (L3), a high clerestory wall whose window HOLES throw one slanting green beam through the haze (L2, dust
 * motes in the beam), a foreground cable run (L5). CAMERA: a slow lateral dolly left → right with a slight
 * push (≈ 9 px/s at the action plane), three planes sliding against each other.
 *
 *   head-hold (0-2.7 s)      the manila chapter tab drops at TOP-LEFT as the ink-bleed clears: Clue Two: A Knob That
 *                            Turns (2.5 s hold); the clouds clear and the clerestory beam comes on through the haze,
 *                            the camera already travelling, the beam full as 'Washington' is spoken
 *   L0302 start (stamp)      WASHINGTON · 7 JULY 1958 types on, bottom left (the case stamp)
 *   'Rosenblatt's' (name)    name card, upper right beside his head
 *   'perceptron' (cards)     the reader's hopper starts feeding notched cards; each shows in the lit read window
 *                            (a single notch on its LEFT or RIGHT edge), the LEFT / RIGHT lamp panel answers,
 *                            the card drops into a pocket and the typed tally on the reader's side counts it.
 *                            First dozen: the lamps disagree with the notches often (seeded, thinning out);
 *                            after card 30 the correct lamp lights every time. Pace: slow enough to read for the
 *                            first ten, a riffle through the middle, slow again for the last eight.
 *   'borrowed' (computer)    the property tag hanging on the nearest cabinet twists to face us and catches the
 *                            green beam: IBM 704 · U.S. WEATHER BUREAU (the learner was a program on this
 *                            borrowed machine; the Mark I does not exist yet)
 *   line end (learned)       the tally reaches 50; the reporter's pencil starts to move (held through holdAfter)
 *
 * The tally's numerals are part of the prop (a typed card), not a caption. Illustrative: which early cards
 * were missed is seeded, not historical; only "fifty tries" is the claim.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, dustMotes, godRays, ibm704, legibleSize, mixLab, overscan, pose, softPlate, tapeDrive, windowBeam, withAlpha, withLife } from '../../../film';
import type { Camera3, PaintEnv, Pose } from '../../../film';
import { cast } from '../cast';
import { indexTabLg } from '../sets/ch03-s01-indexTab';
import { peakedCap } from '../sets/ch03-s01-peakedCap';
import { caseStamp } from '../sets/ch01-s06-stamp';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { bake, camPath, clamp01, lerp, sm, tq12, typedLine, win, h01 } from '../sets/ch03-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch03-s01';

// ------------------------------------------------------------------------------------------- geography
const FLOOR4 = 640; // action-plane floor
const FLOOR3 = 596; // the cabinet row's floor (L3)
const ROW_S = 0.78; // the 704 row stands further back (smaller), an aisle open behind the group
/** the nearest unit (L4): a PAIR of 704 tape drives, reels like round eyes over vacuum columns; the tag hangs
 *  from the hand-rail across the pair, under the reels (the frame "locker" cabinets stay back in the L3 row) */
const DRIVES = [244, 384];
/** the property tag hangs from a hook on the near drive's top edge, inside the clerestory beam (string top) */
const TAG = { x: 286, y: 300 };
const REPORTER = { x: 506, y: FLOOR4 + 24, s: 1.08 }; // a step nearer the lens than the others (L4 front)
const ROS_X = 868;
/** the aisle, one step behind Rosenblatt: a plane of its own IN FRONT of fog B (z 1150, light haze), so the
 *  officer reads as a dark figure with a peaked cap rather than a ghost in the haze */
const OFFICER_X = 742;
const OFFICER_FLOOR = 618;
const L3N = { id: 'L3n', z: 1150, haze: 0.07, blur: 0.35 };
const READER = { x: 1076, y: FLOOR4, w: 276, h: 196 };
const READ_WIN = { x: 1030, y: READER.y - READER.h + 28, w: 160, h: 84 };
const LAMPS = { x: READ_WIN.x, y: 352 };
const TALLY = { x: READER.x + 112, y: READER.y - 128 };
/** the hopper the cards drop from (above the reader's right shoulder) */
const HOPPER = { x: READER.x + 88, y: READER.y - READER.h - 2 };
const WINDOWS = [-260, 20, 300, 580, 860, 1420, 1700];
/** one TALL bay over the reader: clerestory and sash run together, floor-to-beam (breaks the grid) */
const TALL = { x: 1070, y: 30, w: 236, h: 514 };
/** the clerestory band (one throws the beam) above a tall bank of steel-sash windows */
const WIN = { y: 46, w: 190, h: 124 };
const SASH = { y: 214, h: 330, w: 236, pitch: 280, x0: -330 };

// cameras: a slow truck right with a slight push
// round 1: the truck is ~190 px (was ~85) so cabinets, figures and the cable run visibly slide against each other
const CAM0: Camera3 = { x: 540, y: 362, z: 0, lens: 1 };
const CAM1: Camera3 = { x: 730, y: 358, z: 64, lens: 1 };
const CAMS = [CAM0, CAM1];
/** the name card's anchor (right-aligned name baseline): over Rosenblatt, above the lamp panel */
const NAME = { x: 1060, y: 214 };

// ------------------------------------------------------------------------------------------- the cards
/** feed schedule: card i (0-based) appears in the read window at FEED[i] (shot-local s) */
const N_CARDS = 50;
/** notch side per card (seeded): -1 left, +1 right */
const NOTCH = Array.from({ length: N_CARDS }, (_, i) => (h01(i, 1958) < 0.5 ? -1 : 1));
/** the machine's misses: thinning out, none after card 30 (illustrative, seeded) */
const MISS = new Set([0, 1, 3, 4, 6, 8, 9, 12, 15, 19, 24, 29]);
const answerOf = (i: number) => (MISS.has(i) ? -NOTCH[i] : NOTCH[i]);

const REPORTER_LEAN: Pose = pose({ hipF: 8, kneeF: -6, hipB: -6, kneeB: -2, torso: 9, neck: 8, head: 4, shoulderF: 34, elbowF: 92, wristF: -14, shoulderB: 26, elbowB: 88, wristB: -8 }, { handF: 'grip', handB: 'pinch' });
/** the reporter glances up to the tally on 'right' */
const REPORTER_LOOK: Pose = pose({ hipF: 8, kneeF: -6, hipB: -6, kneeB: -2, torso: 7, neck: 2, head: -6, shoulderF: 34, elbowF: 92, wristF: -14, shoulderB: 26, elbowB: 88, wristB: -8 }, { handF: 'grip', handB: 'pinch' });
const ROS_WATCH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 2, neck: 10, head: -2, shoulderF: 6, elbowF: 22, wristF: 6, shoulderB: -8, elbowB: 14 });
const ROS_LEAN: Pose = pose({ hipF: 6, kneeF: -5, hipB: -5, kneeB: -1, torso: 5, neck: 12, head: 2, shoulderF: 10, elbowF: 26, wristF: 8, shoulderB: -6, elbowB: 16 });
const ROS_UP: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 7, head: -8, shoulderF: 6, elbowF: 20, wristF: 6, shoulderB: -9, elbowB: 12 });

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const cards = T.beat('cards');
    const learned = T.beat('learned');
    // the feed: the first five SLOW (each card drops from the hopper, lands, and only then a lamp answers, so the
    // notch can be matched to the lamp), a riffle through the middle (one card per twos step), the last eight
    // slower again, the 50th landing on the line's end
    const feed: number[] = [];
    const slowA = 0.36, slowB = 0.19;
    const tA = cards + 0.05;
    for (let i = 0; i < 5; i++) feed.push(tA + i * slowA);
    const tB0 = tA + 5 * slowA;
    const tC0 = learned - 0.12 - 7 * slowB; // card 43 … 50 (index 42 … 49)
    const nB = 37; // index 5 … 41
    for (let i = 0; i < nB; i++) feed.push(tB0 + (i * (tC0 - tB0)) / nB);
    for (let i = 0; i < 8; i++) feed.push(tC0 + i * slowB);
    tl.hold(0, D);
    return {
      tl,
      D,
      feed,
      // the index tab drops at the head of the shot, as soon as the ink-bleed has cleared (the head-hold is 2.7 s
      // before 'Washington'); it is gone before the date stamp types on
      tab: 0,
      // HEAD-HOLD beat: the clouds clear and the clerestory beam comes on through the haze while the camera is
      // already travelling, landing full as 'Washington' is spoken
      sunUp: [0.25, T.word('L0301', 'Washington') + 0.2] as [number, number],
      stamp: T.beat('stamp'),
      name: T.beat('name') - 0.18,
      tag: T.beat('computer'),
      learns: T.word('L0302', 'learns'),
      right: T.word('L0302', 'right'),
      learned,
      // the camera is already travelling as the ink-bleed clears (ease-out: no dead start under the head-hold)
      cam: camPath([
        [0, CAM0],
        [D, CAM1, (u: number) => 1 - (1 - u) * (1 - u) * (1 - 0.35 * u)],
      ]),
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const cam = scene.cam(t);
    f.camera(cam);
    const sun = win(t, scene.sunUp[0], scene.sunUp[1]);
    f.backlight({ sunX: 360, sunY: 150, sunRadius: 560, intensity: 0.5 + 0.25 * sun });
    // L1: the glow centre of the back wall sits in the beam's column (upper left); the panes away from it fall
    // off toward ink, so the windows read as one lit bay with a dimming run, not a uniform grid
    f.layer('L1', (c, env) => {
      const P = env.mood;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(330, 230, 20, 330, 230, 520);
      g.addColorStop(0, withAlpha(P.halo, 0.34 * (0.55 + 0.45 * sun)));
      g.addColorStop(0.5, withAlpha(P.halo, 0.12 * (0.55 + 0.45 * sun)));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(-600, -400, 2600, 1500);
      c.restore();
      const d = c.createRadialGradient(330, 260, 220, 330, 260, 1150);
      d.addColorStop(0, withAlpha(P.ink, 0));
      d.addColorStop(1, withAlpha(P.ink, 0.6));
      c.fillStyle = d;
      c.fillRect(-600, -400, 2600, 1500);
      // the tall bay over the reader keeps a little of its own light (a second, smaller glow)
      const t2 = c.createRadialGradient(1180, 250, 10, 1180, 250, 260);
      t2.addColorStop(0, withAlpha(P.halo, 0.2));
      t2.addColorStop(1, withAlpha(P.halo, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = t2;
      c.fillRect(800, -200, 800, 900);
      c.globalCompositeOperation = 'source-over';
    });

    // current card (on twos): the last card whose feed time has passed
    let n = -1;
    for (let i = 0; i < N_CARDS; i++) if (scene.feed[i] <= tq + 1e-6) n = i;
    const since = n >= 0 ? tq - scene.feed[n] : 0;
    const gap = n >= 0 && n < N_CARDS - 1 ? scene.feed[n + 1] - scene.feed[n] : 0.6;
    // a card shows in the window for most of its slot, then drops (the last one stays in the window)
    const inWindow = n >= 0 && (n === N_CARDS - 1 ? true : since < gap * 0.8);
    // slow cards spend one twos step in flight down the chute; the lamp answers once the card has landed
    const flight = n >= 0 && n < 5 ? 1 / 12 : 0;
    const lampOn = n >= 0 && since >= flight + (flight > 0 ? 0.08 : 0) && (n === N_CARDS - 1 ? true : since < gap * 0.95);
    const ans = n >= 0 ? answerOf(n) : 0;
    const count = n + 1;
    // the tag twists to face us just before 'borrowed', then CATCHES the beam on the word: set value → cream
    // over 0.4 s (it never appears at full value)
    const tagTurn = win(t, scene.tag - 0.5, scene.tag - 0.05);
    const tagLight = win(t, scene.tag - 0.05, scene.tag + 0.35);

    // ---------------------------------------------------------------- L2: the clerestory wall (window HOLES)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 80);
      bake(f, c, `${ID}/L2/${env.mood.id}`, r, (cc) => {
        const wall = env.fill('set');
        cc.fillStyle = wall;
        cc.beginPath();
        cc.rect(r.x, r.y, r.w, r.h);
        for (const x of WINDOWS) cc.rect(x, WIN.y, WIN.w, WIN.h);
        for (let x = SASH.x0; x < r.x + r.w; x += SASH.pitch) if (x !== TALL.x) cc.rect(x, SASH.y, SASH.w, SASH.h);
        cc.rect(TALL.x, TALL.y, TALL.w, TALL.h);
        cc.fill('evenodd');
        // glazing bars (the backlight shows between them): clerestory quarters, a steel-sash grid below
        cc.fillStyle = wall;
        for (const x of WINDOWS) {
          for (let k = 1; k < 4; k++) cc.fillRect(x + (WIN.w * k) / 4 - 3, WIN.y, 6, WIN.h);
          cc.fillRect(x, WIN.y + WIN.h / 2 - 3, WIN.w, 6);
        }
        // the tall bay: the same steel-sash grid run floor to beam, a heavier transom at clerestory height
        for (let k = 1; k < 5; k++) cc.fillRect(TALL.x + (TALL.w * k) / 5 - 2, TALL.y, 4, TALL.h);
        for (let k = 1; k < 11; k++) cc.fillRect(TALL.x, TALL.y + (TALL.h * k) / 11 - 2, TALL.w, 4);
        cc.fillRect(TALL.x, WIN.y + WIN.h + 6, TALL.w, 10);
        for (let x = SASH.x0; x < r.x + r.w; x += SASH.pitch) {
          if (x === TALL.x) continue;
          for (let k = 1; k < 5; k++) cc.fillRect(x + (SASH.w * k) / 5 - 2, SASH.y, 4, SASH.h);
          for (let k = 1; k < 7; k++) cc.fillRect(x, SASH.y + (SASH.h * k) / 7 - 2, SASH.w, 4);
          // an opened hopper pane, tilted in
          cc.fillRect(x + SASH.w / 5, SASH.y + SASH.h / 7 - 2, SASH.w / 5, 10);
        }
        // cornice under the windows, pilasters between them, a dado line
        cc.fillStyle = mixLab(wall, env.mood.fg, 0.35);
        cc.fillRect(r.x, WIN.y + WIN.h + 10, TALL.x - 14 - r.x, 14);
        cc.fillRect(TALL.x + TALL.w + 14, WIN.y + WIN.h + 10, r.x + r.w - (TALL.x + TALL.w + 14), 14);
        cc.fillRect(r.x, WIN.y - 24, r.w, 10);
        cc.fillRect(r.x, SASH.y + SASH.h, r.w, 12);
        // the ceiling falls to ink above the clerestory (the top of frame is the darkest band)
        const cg = cc.createLinearGradient(0, r.y, 0, WIN.y);
        cg.addColorStop(0, env.mood.ink);
        cg.addColorStop(0.75, mixLab(env.mood.ink, wall, 0.45));
        cg.addColorStop(1, mixLab(env.mood.ink, wall, 0.7));
        cc.fillStyle = cg;
        cc.fillRect(r.x, r.y, r.w, WIN.y - 24 - r.y);
        cc.strokeStyle = withAlpha(env.mood.rim, 0.12);
        cc.lineWidth = 1.2;
        cc.beginPath();
        cc.moveTo(r.x, WIN.y + WIN.h + 10.5);
        cc.lineTo(r.x + r.w, WIN.y + WIN.h + 10.5);
        cc.stroke();
        // the tall bay's frame: a deep reveal either side
        cc.fillStyle = mixLab(wall, env.mood.fg, 0.35);
        cc.fillRect(TALL.x - 14, TALL.y - 8, 14, TALL.h + 8);
        cc.fillRect(TALL.x + TALL.w, TALL.y - 8, 14, TALL.h + 8);
        cc.fillRect(TALL.x - 14, TALL.y - 10, TALL.w + 28, 10);
        // a low run of radiators and file cabinets under the sills, in haze
        cc.fillStyle = mixLab(wall, env.mood.setHaze, 0.15);
        for (let x = -300; x < 1900; x += 140) {
          const h = 70 + 30 * h01(x, 4);
          cc.fillRect(x, 560 - h, 120, h);
        }
        // round 1: the upper clerestory structure falls ~25-30% toward ink (panes included), so the window wall is
        // no longer one flat mid band: the beam's window and the sash below carry the light
        const up = cc.createLinearGradient(0, WIN.y - 30, 0, SASH.y + 40);
        up.addColorStop(0, withAlpha(env.mood.ink, 0.32));
        up.addColorStop(0.7, withAlpha(env.mood.ink, 0.24));
        up.addColorStop(1, withAlpha(env.mood.ink, 0));
        cc.fillStyle = up;
        cc.fillRect(r.x, r.y, r.w, SASH.y + 40 - r.y);
        // and the sash bays away from the beam dim toward the right (a falling run, not a uniform grid)
        const run = cc.createLinearGradient(400, 0, 1500, 0);
        run.addColorStop(0, withAlpha(env.mood.ink, 0));
        run.addColorStop(1, withAlpha(env.mood.ink, 0.22));
        cc.fillStyle = run;
        cc.fillRect(400, SASH.y - 4, r.x + r.w - 400, SASH.h + 8);
      });
    });
    f.fog({ yCenter: 0.56 * 720, height: 0.44 * 720, alpha: 0.26, drift: 6 });

    // ---------------------------------------------------------------- L3: the 704 row, the officer, the beam
    // round 1: the beam is wider, longer and brighter: it crosses the near drives (and the tag) to the floor
    const beam = windowBeam({ x: 10, y: WIN.y + 10, w: 220, h: WIN.h }, { x: 0.5, y: 1 }, 1080, 1.45);
    f.layer('L3', (c, env) => {
      // the ceiling: a steel girder and the drops of its trusses, near ink (the top ~10% of frame is the darkest
      // band), and the floor of the aisle falling to ink toward the lens
      const r3 = overscan(LAYERS.L3, CAMS, 80);
      bake(f, c, `${ID}/L3c/${env.mood.id}`, r3, (cc) => {
        const ink = env.fill('ink');
        const rim = env.mood.rim;
        cc.fillStyle = ink;
        cc.fillRect(r3.x, r3.y, r3.w, 30 - r3.y);
        cc.fillStyle = withAlpha(rim, 0.16);
        cc.fillRect(r3.x, 29, r3.w, 1.2);
        for (let x = -360; x < r3.x + r3.w; x += 420) {
          cc.fillStyle = ink;
          // a truss drop: a tapered web and a bottom flange
          cc.beginPath();
          cc.moveTo(x - 70, 28);
          cc.lineTo(x + 70, 28);
          cc.lineTo(x + 16, 66);
          cc.lineTo(x - 16, 66);
          cc.closePath();
          cc.fill();
          cc.fillRect(x - 26, 64, 52, 6);
          cc.fillStyle = withAlpha(rim, 0.14);
          cc.fillRect(x - 26, 64, 52, 1);
        }
        const fg = cc.createLinearGradient(0, FLOOR3 - 2, 0, 760);
        fg.addColorStop(0, mixLab(env.mood.ink, env.mood.set, 0.35));
        fg.addColorStop(0.35, mixLab(env.mood.ink, env.mood.set, 0.15));
        fg.addColorStop(1, env.mood.ink);
        cc.fillStyle = fg;
        cc.fillRect(r3.x, FLOOR3 - 2, r3.w, r3.y + r3.h - FLOOR3 + 2);
      });
      // the row of cabinets: tape drives with reels (on ones), frame cabinets, the operator's console
      // (two groups with an aisle between them, so Rosenblatt and the officer stand against the windows)
      ibm704(c, { x: 150, y: FLOOR3, s: ROW_S, units: ['tape', 'tape', 'frame', 'tape'], spin: 0.32, activity: 0.4, seed: 7 }, env);
      ibm704(c, { x: 1200, y: FLOOR3, s: ROW_S, units: ['console', 'frame', 'tape', 'tape'], spin: 0.32, activity: 0.45, seed: 8 }, env);
    });
    f.layer('L3', (c, env) => {
      godRays(c, { beams: [beam], intensity: (0.2 + 0.62 * sun) + 0.16 * tagLight, mullions: 3, streaks: 6, salt: 31 }, env);
      dustMotes(c, { beam, count: Math.round(50 + 90 * sun), drift: { x: 2.2, y: 3 }, size: 1.15, salt: 58 }, env);
    });
    f.fog('B');

    // ---------------------------------------------------------------- L3n: the officer, one step behind Rosenblatt
    // (round 1: in front of fog B, so he holds his shape; a step lighter than the two near figures)
    f.layer(L3N, (c, env) => {
      const oOpts = { x: OFFICER_X, y: OFFICER_FLOOR, facing: 'right' as const, pose: withLife(POSES.clasp, tq, 58, 0.8), scale: 0.92, ink: mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.16), light: { x: -0.5, y: -0.8, floor: 0.05 }, edgeRim: { x: -0.6, y: -0.8, px: 1.2 } };
      cast['navy-officer'].draw(c, oOpts, env);
      peakedCap(c, env, cast['navy-officer'].anchor(oOpts, 'head'), 0.92, oOpts.ink);
    });

    // ---------------------------------------------------------------- L4: the action plane
    f.layer('L4', (c, env) => {
      const P = env.mood;
      // the floor (a dark band receding) with a faint sheen where the beam lands
      const fr = overscan(LAYERS.L4, CAMS, 40);
      const flg = c.createLinearGradient(0, FLOOR4 - 4, 0, 740);
      flg.addColorStop(0, mixLab(P.ink, P.set, 0.42));
      flg.addColorStop(0.5, mixLab(P.ink, P.set, 0.3));
      flg.addColorStop(1, mixLab(P.ink, P.set, 0.12));
      c.fillStyle = flg;
      c.fillRect(fr.x, FLOOR4 - 4, fr.w, fr.y + fr.h - FLOOR4 + 4);
      const sheen = c.createRadialGradient(330, FLOOR4 + 6, 10, 330, FLOOR4 + 6, 360);
      sheen.addColorStop(0, withAlpha(P.halo, 0.3));
      sheen.addColorStop(1, withAlpha(P.halo, 0));
      c.save();
      c.translate(0, FLOOR4 + 6);
      c.scale(1, 0.12);
      c.translate(0, -(FLOOR4 + 6));
      c.fillStyle = sheen;
      c.fillRect(-60, FLOOR4 - 360, 780, 720);
      c.restore();

      // the nearest unit: a pair of 704 tape drives (reels behind glass, vacuum columns), the tag on their rail
      DRIVES.forEach((x, i) => tapeDrive(c, { x, y: FLOOR4, spin: 0.38 + 0.08 * i, seed: 21 + i, lamps: 1 }, env));
      tag(c, env, TAG.x, TAG.y, tagTurn, tagLight, t);

      // the reporter, leaning in from frame left, notepad up; his pencil moves once the tally reaches 50
      // on 'right' he glances up to the tally; as it reaches fifty he looks down and WRITES (a scribble on twos:
      // the pencil hand swings ~6 px each step, two frames per drawing, lines appearing on the pad)
      const look = win(tq, scene.right - 0.1, scene.right + 0.15) * (1 - win(tq, scene.learned + 0.05, scene.learned + 0.25));
      const writing = tq >= scene.learned;
      let rp = withLife(blendPose(REPORTER_LEAN, REPORTER_LOOK, look), tq, 1958, 0.8);
      const wk = writing ? Math.floor((tq - scene.learned) * 12) % 4 : -1;
      if (wk >= 0) {
        const dW = [0, 16, -6, 12][wk], dE = [0, -9, 5, -6][wk];
        rp = { ...rp, angles: { ...rp.angles, wristF: (rp.angles.wristF ?? 0) + dW, elbowF: (rp.angles.elbowF ?? 0) + dE } };
      }
      const rOpts = { x: REPORTER.x, y: REPORTER.y, scale: REPORTER.s, facing: 'right' as const, pose: rp, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -0.5, y: -0.8, floor: 0 }, edgeRim: { x: -0.6, y: -0.8, px: 1.5 } };
      cast.reporter.draw(c, rOpts, env);
      const written = writing ? Math.min(5, 1 + Math.floor((tq - scene.learned) * 6)) : 0;
      notepad(c, env, cast.reporter.anchor(rOpts, 'handB'), written);

      // Rosenblatt beside the reader: leans in as it learns, lifts his head as the tally reaches fifty
      const lean = win(tq, scene.learns - 0.3, scene.learns + 0.3);
      const up = win(tq, scene.learned - 0.25, scene.learned + 0.25);
      const rosP = withLife(blendPose(blendPose(ROS_WATCH, ROS_LEAN, lean), ROS_UP, up), tq, 1928, 0.9);
      cast.rosenblatt.draw(c, { x: ROS_X, y: FLOOR4, facing: 'right', pose: rosP, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -0.5, y: -0.8, floor: 0 }, edgeRim: { x: -0.6, y: -0.8, px: 1.5 } }, env);

      // the card reader, its lamp panel and the typed tally
      reader(c, env, { n, inWindow, since, count, flight });
      lampPanel(c, env, lampOn ? ans : 0);
      tally(c, env, count);
    });
    f.rim({ x: -0.55, y: -0.8 });
    // practicals: the reader's read lamp (behind the window) and the answering lamp
    if (inWindow) f.practical({ x: READ_WIN.x, y: READ_WIN.y + READ_WIN.h / 2, kind: 'lamp', seed: 704, intensity: 0.18, radius: 70 });
    if (lampOn) f.practical({ x: LAMPS.x + ans * 44, y: LAMPS.y, kind: 'led', seed: 711 + (ans > 0 ? 1 : 0), intensity: 0.9, radius: 30 });

    // ---------------------------------------------------------------- L5: the foreground cable run
    // World y is chosen so the run sits at stage y ≈ 645-670 at the start and ≈ 680-715 at the end of the push
    // (the L5 plane grows ~11% as the camera dollies in). The near cabinet edge at left is a blurred slab the
    // L→R truck carries out of frame (exits left by mid-shot): the fastest plane, so the parallax reads.
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 60);
      bake(f, c, `${ID}/L5b/${env.mood.id}`, r, (cc) => {
        const fg = env.fill('fg');
        const rim = env.mood.rim;
        // round 1: a recognisable CABLE AND CONDUIT RUN along the bottom ~8% (it read as theatre seats): a rigid
        // steel conduit with coupling collars and pipe straps, heavy cables slung BELOW it in shallow sags between
        // the straps (hanging, never humped), a floor channel under them; dark against the lit floor behind
        const CY0 = 646; // conduit top (world): ≈ 650 on screen at the start, ≈ 690 at the end of the push
        cc.fillStyle = fg;
        cc.fillRect(r.x, 694, r.w, r.y + r.h - 694); // the floor channel
        cc.fillStyle = withAlpha(rim, 0.22);
        cc.fillRect(r.x, 694, r.w, 1.6);
        // cables: three runs, each a catenary between straps (drawn first: the conduit sits in front)
        cc.lineCap = 'round';
        const STRAP = 300;
        // one bundle: the same straps, nested sags (a festoon), so the run reads as cable, never as a lattice
        const runs = [
          { dy: 16, sag: 9, w: 12, ph: 0 },
          { dy: 16, sag: 15, w: 9, ph: 0 },
          { dy: 16, sag: 21, w: 7, ph: 0 },
        ];
        for (const q of runs) {
          const path = new Path2D();
          let x = r.x - STRAP + q.ph;
          path.moveTo(x, CY0 + q.dy);
          for (; x <= r.x + r.w + STRAP; x += STRAP) {
            const sag = q.sag * (0.85 + 0.3 * h01(x, 5));
            path.quadraticCurveTo(x + STRAP / 2, CY0 + q.dy + 2 * sag, x + STRAP, CY0 + q.dy);
          }
          cc.strokeStyle = fg;
          cc.lineWidth = q.w;
          cc.stroke(path);
          cc.save();
          cc.translate(0, -q.w / 2 + 0.8);
          cc.strokeStyle = withAlpha(rim, 0.6);
          cc.lineWidth = 1.8;
          cc.stroke(path);
          cc.restore();
        }
        // the conduit: one straight steel tube, collars every 210, a clean lit top edge
        cc.fillStyle = fg;
        cc.fillRect(r.x, CY0, r.w, 15);
        cc.fillStyle = withAlpha(rim, 0.85);
        cc.fillRect(r.x, CY0, r.w, 2.6);
        for (let x = r.x + 30; x < r.x + r.w; x += 210) {
          cc.fillStyle = fg;
          cc.fillRect(x, CY0 - 3, 20, 21);
          cc.fillStyle = withAlpha(rim, 0.8);
          cc.fillRect(x, CY0 - 3, 20, 2.4);
        }
        // pipe straps down to the floor channel (where the cables hang from)
        for (let x = r.x - STRAP; x <= r.x + r.w + STRAP; x += STRAP) {
          cc.fillStyle = fg;
          cc.fillRect(x - 4, CY0 + 10, 8, 694 - CY0 - 10);
          cc.fillRect(x - 12, CY0 - 4, 24, 6);
        }
        // the near column (left): a riveted steel stanchion with a flared cap and a plinth, its window-side face
        // fluted and catching a rim, so the edge of frame has a deliberate shape (a doorway pillar, not a gap)
        const PX = 64; // the column's right (lit) face, world x
        cc.fillStyle = fg;
        cc.fillRect(r.x, r.y, PX - r.x, r.h);
        cc.beginPath(); // capital flare under the ceiling
        cc.moveTo(r.x, 70);
        cc.lineTo(PX + 26, 70);
        cc.lineTo(PX + 26, 86);
        cc.lineTo(PX, 104);
        cc.lineTo(r.x, 104);
        cc.closePath();
        cc.fill();
        cc.fillRect(r.x, 600, PX + 22 - r.x, 80); // plinth
        cc.fillStyle = withAlpha(rim, 0.6);
        cc.fillRect(PX - 3, 104, 3, 496);
        cc.fillRect(PX, 70, 26, 1.6);
        cc.fillRect(PX + 20, 600, 2, 66);
        cc.fillStyle = withAlpha(rim, 0.12);
        for (let k = 1; k < 3; k++) cc.fillRect(PX - 8 - k * 12, 108, 1.4, 488);
        cc.fillStyle = withAlpha(rim, 0.2);
        for (let y = 130; y < 590; y += 46) {
          cc.beginPath();
          cc.arc(PX - 8, y, 2, 0, Math.PI * 2);
          cc.fill();
        }
      });
    });

    // ---------------------------------------------------------------- type (screen-locked, last)
    // a soft vignette (~0.25): the corners fall toward ink, the glow centre stays in the beam
    {
      const c = f.c;
      const v = c.createRadialGradient(560, 330, 260, 640, 360, 820);
      v.addColorStop(0, withAlpha(f.mood.ink, 0));
      v.addColorStop(1, withAlpha(f.mood.ink, 0.25 * 1.6));
      c.fillStyle = v;
      c.fillRect(0, 0, 1280, 720);
    }
    const tenv = { t, mood: f.mood };
    indexTabLg(f.c, { title: 'Clue Two: A Knob That Turns', at: scene.tab, hold: 2.5, baseline: 58, cap: 29 }, tenv);
    const stampA = win(t, scene.stamp - 0.05, scene.stamp + 0.15) * (1 - win(t, scene.learned - 2.4, scene.learned - 1.9));
    caseStamp(f.c, 'WASHINGTON · 7 JULY 1958', { t, at: scene.stamp, A: stampA, mood: f.mood, seed: 1958 });
    // a feathered ink plate under the card: the sash windows behind it are the brightest thing in the frame
    const nA = win(t, scene.name, scene.name + 0.4) * (1 - win(t, scene.name + 4.4, scene.name + 4.8));
    // the card rides directly above Rosenblatt's head (screen x ≈ 800-830 while it shows), its rule ending over him
    if (nA > 0.001) softPlate(f.c, NAME.x - 210, NAME.y + 22, 640, 150, f.mood.ink, 0.6 * nA);
    nameCardLg(f.c, { name: 'Frank Rosenblatt', role: 'psychologist, Cornell Aeronautical Laboratory', align: 'right', x: NAME.x, y: NAME.y, at: scene.name, dur: 4.8 }, tenv);
  },
});

// ===================================================================================================== props

/** the manila property tag on a string; `turn` 0 = edge-on … 1 = face-on; `light` = in the beam.
 *  Round 1: a SMALL hanging tag (≈ 200 px wide, three typed lines at the 22 px floor), hung from a hook on the
 *  near drive's top edge inside the clerestory beam, well clear of the date stamp's corner. */
function tag(c: C, env: PaintEnv, x: number, y: number, turn: number, light: number, t: number) {
  const P = env.mood;
  const sway = 0.035 * Math.sin(t * 1.3) * (1 - light * 0.6);
  const s1 = legibleSize(c, `400 15px ${FONT.typewriter}`, 15);
  const LINES = ['IBM 704', 'U.S. WEATHER', 'BUREAU'];
  c.save();
  c.font = `400 ${s1}px ${FONT.typewriter}`;
  const tw = Math.max(...LINES.map((l) => c.measureText(l).width));
  c.restore();
  const lead = Math.round(s1 * 1.12);
  const W = Math.round(tw + 26), H = Math.round(16 + lead * LINES.length + 8), drop = 16;
  c.save();
  c.translate(x, y);
  // the hook on the cabinet's top edge
  c.fillStyle = env.fill('ink');
  c.fillRect(-5, -4, 10, 6);
  c.rotate(sway);
  // string from the hook
  c.strokeStyle = withAlpha(P.rim, 0.55);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, drop);
  c.stroke();
  // the tag twists on its string: width scales from edge-on to face-on
  const sx = lerp(0.16, 1, sm(turn));
  c.translate(0, drop);
  c.scale(sx, 1);
  const paper = mixLab(mixLab(P.set, P.ink, 0.12), mixLab(mixLab(P.set, P.halo, 0.5), '#ddd1ad', 0.4), sm(light));
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-W / 2 + 12, 0);
  c.lineTo(W / 2 - 12, 0);
  c.lineTo(W / 2, 12);
  c.lineTo(W / 2, H);
  c.lineTo(-W / 2, H);
  c.lineTo(-W / 2, 12);
  c.closePath();
  c.fill();
  // eyelet
  c.fillStyle = mixLab(P.ink, paper, 0.25);
  c.beginPath();
  c.arc(0, 7, 3, 0, Math.PI * 2);
  c.fill();
  if (sx > 0.55) {
    const ink = withAlpha(P.ink, 0.92 * clamp01((sx - 0.55) / 0.3) * (0.35 + 0.65 * light));
    LINES.forEach((l, i) => typedLine(c, l, 0, 14 + lead * (i + 1) - 4, { size: s1, color: ink, align: 'center', seed: 704 + i }));
  }
  c.restore();
  // the beam's light on the paper (additive, a touch of bloom)
  if (light > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y + drop + H / 2, 10, x, y + drop + H / 2, 150);
    g.addColorStop(0, withAlpha(P.halo, 0.18 * light));
    g.addColorStop(1, withAlpha(P.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 200, y + drop + H / 2 - 200, 400, 400);
    c.restore();
  }
}

/** the reporter's notepad, held up in his far hand */
function notepad(c: C, env: PaintEnv, at: { x: number; y: number }, written: number) {
  const P = env.mood;
  c.save();
  c.translate(at.x + 4, at.y - 4);
  // tipped ~15° further toward the key light (upper left), so its face and top edge catch the window
  c.rotate(-0.25 - 0.26);
  c.fillStyle = mixLab(P.setHaze, P.rim, 0.4);
  c.fillRect(-4, -30, 30, 40);
  c.fillStyle = withAlpha(P.rim, 0.85);
  c.fillRect(-4, -30, 30, 1.6);
  c.fillRect(-4, -30, 1.4, 40);
  c.fillStyle = withAlpha(P.ink, 0.5);
  for (let k = 0; k < 4; k++) c.fillRect(1, -22 + k * 8, 20, 1.2);
  // fresh lines of shorthand as he writes
  c.fillStyle = withAlpha(P.ink, 0.85);
  for (let k = 0; k < written; k++) c.fillRect(1, -18 + k * 5, 8 + ((k * 7) % 12), 1.6);
  c.restore();
}

/** the card reader: a waist-high cabinet, hopper at its right shoulder, a big lit read window, two pockets
 *  (left / right). Each card DROPS from the hopper into the window (one twos step in flight), so the viewer can
 *  match the notch side to the lamp that answers. */
function reader(c: C, env: PaintEnv, o: { n: number; inWindow: boolean; since: number; count: number; flight: number }) {
  const P = env.mood;
  const ink = env.fill('ink');
  const { x, y, w, h } = READER;
  const top = y - h;
  c.save();
  // body: plinth, cabinet, a shallow raked top deck
  c.fillStyle = ink;
  c.fillRect(x - w / 2 + 6, y - 8, w - 12, 8);
  c.fillRect(x - w / 2, top + 16, w, h - 24);
  c.beginPath();
  c.moveTo(x - w / 2, top + 16);
  c.lineTo(x - w / 2 + 10, top);
  c.lineTo(x + w / 2 - 6, top);
  c.lineTo(x + w / 2, top + 16);
  c.closePath();
  c.fill();
  // the hopper (feed stack, shrinking as cards are read), slanted toward the window
  const left = 1 - o.count / 50;
  c.save();
  c.translate(HOPPER.x, HOPPER.y);
  c.rotate(-0.18);
  c.fillRect(-36, -66, 72, 66);
  c.fillStyle = mixLab(P.set, P.rim, 0.25);
  c.fillRect(-30, -62 + 54 * (1 - left), 60, Math.max(2, 54 * left));
  c.fillStyle = withAlpha(P.ink, 0.6);
  for (let k = 0; k < 12 * left; k++) c.fillRect(-30, -62 + 54 * (1 - left) + k * 4.4, 60, 0.8);
  c.restore();
  // a chute from the hopper's mouth down to the window
  c.beginPath();
  c.moveTo(HOPPER.x - 40, HOPPER.y + 4);
  c.lineTo(READ_WIN.x + READ_WIN.w / 2 + 6, READ_WIN.y - 4);
  c.lineTo(READ_WIN.x + READ_WIN.w / 2 + 6, READ_WIN.y + 10);
  c.lineTo(HOPPER.x - 30, HOPPER.y + 14);
  c.closePath();
  c.fill();
  // the read window (a HOLE lit from inside) with the card in it
  const W = READ_WIN;
  const inFlight = o.n >= 0 && o.inWindow && o.since < o.flight;
  c.fillStyle = mixLab(P.fg, P.set, 0.3);
  c.fillRect(W.x - W.w / 2 - 7, W.y - 7, W.w + 14, W.h + 14);
  c.fillStyle = mixLab(mixLab(P.set, P.halo, o.inWindow ? 0.6 : 0.2), '#d9b77a', o.inWindow ? 0.35 : 0.15);
  c.fillRect(W.x - W.w / 2, W.y, W.w, W.h);
  if (o.inWindow && o.n >= 0 && !inFlight) card(c, env, W.x, W.y + W.h / 2, NOTCH[o.n], 0);
  // two output pockets below the window: LEFT and RIGHT stacks growing
  const pk = [W.x - 40, W.x + 40];
  let nl = 0, nr = 0;
  for (let i = 0; i < o.count - (o.inWindow ? 1 : 0); i++) (answerOf(i) < 0 ? nl++ : nr++);
  [nl, nr].forEach((k, j) => {
    const px = pk[j];
    const py = y - 14;
    c.fillStyle = mixLab(P.fg, P.set, 0.2);
    c.fillRect(px - 34, py - 48, 68, 48);
    c.fillStyle = mixLab(P.set, P.rim, 0.3);
    const sh = Math.min(42, k * 1.4);
    c.fillRect(px - 28, py - sh, 56, sh);
    c.fillStyle = withAlpha(P.ink, 0.55);
    for (let q = 0; q < sh; q += 3.2) c.fillRect(px - 28, py - q, 56, 0.7);
  });
  // panel seams + louvres (cut-lines)
  c.strokeStyle = withAlpha(P.rim, 0.22);
  c.lineWidth = 1;
  c.strokeRect(x - w / 2 + 8, top + 22, w - 16, h - 38);
  c.restore();
  // the card in flight: halfway down the chute, tilted, for one twos step
  if (inFlight) {
    c.save();
    c.translate(lerp(HOPPER.x - 20, W.x, 0.5), lerp(HOPPER.y - 8, W.y + W.h / 2, 0.5));
    c.rotate(-0.32);
    card(c, env, 0, 0, NOTCH[o.n], 0);
    c.restore();
  }
}

/** a punch card face-on: bright, a clipped corner, ONE deep triangular bite out of its left or right edge */
function card(c: C, env: PaintEnv, cx: number, cy: number, side: number, _since: number) {
  const P = env.mood;
  const w = 140, h = 62;
  const x0 = cx - w / 2, y0 = cy - h / 2;
  c.save();
  c.fillStyle = mixLab(P.core, '#ece4c8', 0.35);
  c.beginPath();
  c.moveTo(x0 + 11, y0);
  c.lineTo(x0 + w, y0);
  c.lineTo(x0 + w, y0 + h);
  c.lineTo(x0, y0 + h);
  c.lineTo(x0, y0 + 11);
  c.closePath();
  // the notch: a wide V bitten out of the left or right edge (a hole, so the window's light shows through)
  const nx = side < 0 ? x0 : x0 + w;
  const d = side < 0 ? 30 : -30;
  c.moveTo(nx, cy - 19);
  c.lineTo(nx + d, cy);
  c.lineTo(nx, cy + 19);
  c.closePath();
  c.fill('evenodd');
  // the bite's inked edge, so the notch reads even against the lit window
  c.strokeStyle = withAlpha(P.ink, 0.75);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(nx, cy - 19);
  c.lineTo(nx + d, cy);
  c.lineTo(nx, cy + 19);
  c.stroke();
  // faint punched columns (texture), kept clear of the notch
  c.fillStyle = withAlpha(P.ink, 0.22);
  for (let k = 0; k < 11; k++) c.fillRect(x0 + 38 + k * 6.4, y0 + 10 + ((k * 7) % 5) * 8, 2.4, 5);
  c.restore();
}

/** LEFT / RIGHT: two lamps above the reader on a bracket; `which` -1 left, +1 right, 0 none */
function lampPanel(c: C, env: PaintEnv, which: number) {
  const P = env.mood;
  const { x, y } = LAMPS;
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 4, y + 26, 8, READER.y - READER.h - y - 26);
  c.beginPath();
  c.roundRect(x - 92, y - 30, 184, 76, 8);
  c.fill();
  for (const s of [-1, 1]) {
    const lx = x + s * 44;
    const on = which === s;
    c.fillStyle = on ? P.core : mixLab(P.set, P.ink, 0.35);
    c.beginPath();
    c.arc(lx, y - 6, 14, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(P.rim, 0.4);
    c.lineWidth = 1.2;
    c.stroke();
    typedLine(c, s < 0 ? 'LEFT' : 'RIGHT', lx, y + 32, { size: 18, color: withAlpha(mixLab(P.rim, P.core, 0.4), 0.95), align: 'center', seed: 11 + s });
  }
  c.restore();
}

/** the tally: a typed card pinned on the reader's side panel: TRIES, the count, tally strokes in fives */
function tally(c: C, env: PaintEnv, n: number) {
  const P = env.mood;
  const { x, y } = TALLY;
  const W = 124, H = 112;
  c.save();
  c.translate(x, y);
  c.rotate(0.02);
  softPlate(c, 0, 0, W + 60, H + 40, P.ink, 0.35);
  c.fillStyle = mixLab(mixLab(P.set, P.halo, 0.5), '#e2d8bd', 0.35);
  c.fillRect(-W / 2, -H / 2, W, H);
  c.fillStyle = withAlpha(P.ink, 0.9);
  c.beginPath();
  c.arc(0, -H / 2 + 7, 3, 0, Math.PI * 2);
  c.fill();
  const ink = withAlpha(P.ink, 0.92);
  typedLine(c, 'TRIES', 0, -H / 2 + 30, { size: 18, color: ink, align: 'center', seed: 3 });
  typedLine(c, String(Math.max(0, n)), 0, 18, { size: 40, color: ink, align: 'center', seed: 100 + n });
  // tally strokes: groups of five, a slash through each fifth
  c.strokeStyle = withAlpha(P.ink, 0.7);
  c.lineWidth = 1.2;
  const groups = Math.ceil(n / 5);
  for (let gi = 0; gi < groups; gi++) {
    const gx = -W / 2 + 9 + (gi % 5) * 22;
    const gy = 30 + Math.floor(gi / 5) * 13;
    const k = Math.min(5, n - gi * 5);
    for (let s = 0; s < Math.min(4, k); s++) {
      c.beginPath();
      c.moveTo(gx + s * 4, gy);
      c.lineTo(gx + s * 4, gy + 10);
      c.stroke();
    }
    if (k === 5) {
      c.beginPath();
      c.moveTo(gx - 2, gy + 9);
      c.lineTo(gx + 15, gy + 1);
      c.stroke();
    }
  }
  c.restore();
}
