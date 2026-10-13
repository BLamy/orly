/**
 * ch05-s03 — Geoffrey Hinton, at the sterile candle's rim all the while, is named, and his desk travels the rim of the light:
 * San Diego, Cambridge, Pittsburgh (where a small net flickers hot and settles as it cools), Toronto.
 *
 * Crossfade from the Hall of Mirrors (the easel's chalk ring lingers a beat as a ghost) to the candle stage:
 * the sterile candle MANY-LAYERED NETS ARE A STERILE EXTENSION (lit 1969; a little over a decade of ghost
 * sleeve; flame live) stands at left, soft, its rings not counted here. At the right rim of its pool,
 * half in shadow and facing out, Hinton sits at a desk, head bent over paper. SEATED THROUGHOUT.
 *
 *   'Hinton'      name card
 *   +0.1 / +0.6   the desk travels: a slow truck along the rim; the backcloth behind him swaps (San Diego
 *                 palms, Cambridge tracery), desk and chair dissolving and re-forming at each stop
 *   +1.1          Pittsburgh (bridges, mill stacks at labGreen dusk): PITTSBURGH · 1982, the long stop
 *   'With'        label: Boltzmann machine · with Sejnowski & Ackley · 1985
 *   'built'       the small lantern net on the desk flickers hot (lanterns blinking at random)
 *   'settles'     the thermometer card falls 20 → 15 → 12 → 10 and the net steadies (settling, not learning)
 *   +0.7          Toronto: a window with snow beginning over a generic skyline; TORONTO · 1987 to the end
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, PoseTrack, defineShot, mixLab, overscan, seatHeight, toScreen, withAlpha, withLife } from '../../../film';
import type { Rect } from '../../../film/core/multiplane';
import { cast } from '../cast';
import { floorShadow, stageGeo } from '../sets/candleStage';
import { beliefCandle, namedLabel } from '../sets/beliefCandle';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { candleNamingAt, shelfStateAt } from '../sets/studyState';
import { stageLip } from '../sets/ch03-s06-kit';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { boltzNet, boltzState, thermoTag, type ClothKind } from '../sets/ch05-s03-desks';
import { farRectFor, farView, winGeoFor, windowWall, type WinGeo } from '../sets/ch05-s03-windows';
import { camKeys, clamp01, phosphorStamp, textPlateLabel, tq12, win } from '../sets/ch05-s01-kit';

const ID = 'ch05-s03';
const man = cast['hinton-young'];
/** the sterile candle (its base tag is left off here: the corner belongs to the era stamps, and its rings are not counted in this shot) */
const STERILE = { ...shelfStateAt(ID, 'start').find((v) => v.id === 'sterile')!, tag: '' };
const CANDLE_X = 300;
/** smaller than the stage default: the sterile candle stays a soft background presence here */
const CANDLE_S = 1.42;
const FLOOR = 640;
const MAN_X0 = 806;
const DESK_DX = 128;
const PS = 1.06;
/** the key is the window behind him (up and to his front); the candle only warms the floor */
const LIGHT_DIR = { x: 0.55, y: -1 };

// ------------------------------------------------------------------ Hinton, seated (facing right, out from the flame)
const SIT = POSES.sit;
const BENT: Pose = { ...SIT, angles: { ...SIT.angles, torso: 8, neck: 20, head: 16, shoulderF: 34, elbowF: 66, wristF: 4, shoulderB: 26, elbowB: 70, wristB: 6 }, handF: 'grip', handB: 'relaxed' };
const WRITING = BENT;
const WATCH: Pose = { ...SIT, angles: { ...SIT.angles, torso: 4, neck: 14, head: 10, shoulderF: 30, elbowF: 148, wristF: -22, shoulderB: 22, elbowB: 70, wristB: 6 }, handF: 'chin', handB: 'relaxed' };
const SETTLED: Pose = { ...SIT, angles: { ...SIT.angles, torso: -2, neck: 10, head: 4, shoulderF: 22, elbowF: 74, wristF: 6, shoulderB: 18, elbowB: 76, wristB: 6 }, handF: 'relaxed', handB: 'relaxed' };
const WINDOW: Pose = { ...SIT, angles: { ...SIT.angles, torso: 0, neck: 6, head: -6, shoulderF: 30, elbowF: 70, wristF: 4, shoulderB: 22, elbowB: 72, wristB: 6 }, handF: 'grip', handB: 'relaxed' };

/** the chair's seat height (his thighs) */
const SEAT_H = seatHeight(man.spec, SIT) * PS;
/** the desk top */
const DESK_TOP = FLOOR - 77 * 1.83 * PS;
/** the net on the Pittsburgh desk: big enough to read when the camera leans in */
const NET_K = 1.5;
/** clear of his head: the net's frame stands right of his profile, so the head sits on clean window light */
const NET_DX = 70;
/** the Pittsburgh / Toronto desk, long enough for the net and the thermometer card */
const DESK_W_MODERN = 284;

interface Beats {
  name: number;
  travel: number;
  cambridge: number;
  boltz: number;
  label: number;
  hot: number;
  settle: number;
  toronto: number;
  temps: [number, number][];
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  man: PoseTrack;
  cam: (t: number) => Camera3;
  travel: (t: number) => number;
  CAMS: Camera3[];
  /** the clock, for the candle-naming rule (the candle is baked, so the rule is driven from here) */
  T: { word(line: string, w: string): number };
  /** each stop's window (L2 world), the far view's L1 rect, and the head's L2 x (bars keep clear of it) */
  win: Record<ClothKind, { g: WinGeo; far: Rect; clearX: number }>;
}

/** which stop the desk is at: a 0.15 s crossfade into each stop, which then stands alone */
const XF = 0.15;
function stopAt(t: number, b: Beats): { kind: ClothKind; from: ClothKind; u: number } {
  const swaps: [number, ClothKind][] = [
    [b.travel - 0.2, 'sandiego'],
    [b.cambridge - 0.2, 'cambridge'],
    [b.boltz - 0.2, 'pittsburgh'],
    [b.toronto - 0.2, 'toronto'],
  ];
  let kind: ClothKind = 'blank';
  let from: ClothKind = 'blank';
  let at = -9;
  for (const [ts, k] of swaps)
    if (t >= ts) {
      from = kind;
      kind = k;
      at = ts;
    }
  const v = clamp01((t - at) / XF);
  return { kind, from, u: v * v * (3 - 2 * v) };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const settle = T.beat('settle');
    const b: Beats = {
      name: T.beat('name'),
      travel: T.beat('travel'),
      cambridge: T.beat('cambridge'),
      boltz: T.beat('boltz'),
      label: T.beat('label'),
      hot: T.beat('hot'),
      settle,
      toronto: T.beat('toronto'),
      // the fall plays under 'settles as it cools': 20 → 15 → 12 → 10, about 0.4 s a step
      temps: [
        [settle - 0.1, 15],
        [settle + 0.32, 12],
        [settle + 0.74, 10],
      ],
    };
    const m = new PoseTrack(tl, 'hinton.pose', WRITING, 'right', 0.5);
    m.loop('write', { at: 0.4, dur: Math.max(0.5, b.name - 0.6) });
    m.to(BENT, { at: b.name - 0.1, dur: 0.4 });
    m.to(WATCH, { at: b.hot - 0.35, dur: 0.5, force: true });
    m.to(SETTLED, { at: settle + 1.0, dur: 0.6 });
    m.to(WINDOW, { at: b.toronto + 0.3, dur: 0.6 });
    m.loop('write', { at: b.toronto + 1.1, dur: Math.max(0.5, D - b.toronto - 1.4) });
    // the desk's travel along the rim (the desk rides with this, on the twos)
    const travelK = camKeys([
      [0, 600, 0, 0],
      [2.6, 700, 0, 0],
      [b.name, 728, 0, 0],
      [b.boltz + 0.6, 790, 0, 0],
      [b.toronto, 826, 0, 0],
      [D, 838, 0, 0],
    ]);
    const travel = (t: number) => travelK(t).x;
    // the camera: the slow truck, then a lean in on the little net through L0505b (about 7% a second), then
    // easing back out for Toronto
    const lineEnd = T.line('L0505b').end;
    const cam = camKeys([
      [0, 600, 318, 50],
      [2.6, 700, 326, 106],
      [b.name, 728, 330, 128],
      [b.boltz + 0.2, 782, 334, 150],
      [b.settle + 0.6, 966, 352, 312],
      [lineEnd + 0.1, 972, 352, 318],
      [D - 1.0, 896, 336, 196],
      [D, 890, 335, 190],
    ]);
    tl.hold(0, D);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) CAMS.push(cam((D * i) / 24));
    // each stop's window, placed where it frames his head on screen at the stop's key moment
    const manXAt = (t: number) => MAN_X0 + Math.max(0, travel(t) - travel(b.name)) * 0.94;
    const camsIn = (t0: number, t1: number) => Array.from({ length: 9 }, (_, i) => cam(t0 + ((t1 - t0) * i) / 8));
    const stops: [ClothKind, number, number, number, number][] = [
      // kind, key time, from, to, window width (screen px)
      ['blank', 2.0, 0, b.travel, 520],
      ['sandiego', b.travel + 0.25, b.travel - 0.3, b.cambridge, 500],
      ['cambridge', b.cambridge + 0.25, b.cambridge - 0.3, b.boltz, 300],
      ['pittsburgh', settle, b.boltz - 0.3, b.toronto, 560],
      ['toronto', D - 1.2, b.toronto - 0.3, D, 540],
    ];
    const win = {} as Scene['win'];
    for (const [kind, tk, t0, t1, W] of stops) {
      const c0 = cam(tk);
      const pose = m.sample(tk).pose;
      const head = man.anchor({ x: manXAt(tk), y: FLOOR, facing: 'right', pose, scale: PS }, 'head');
      const hs = toScreen(LAYERS.L4, c0, head.x, head.y);
      const deskS = toScreen(LAYERS.L4, c0, 0, DESK_TOP).y;
      const top = kind === 'cambridge' ? 70 : 96;
      const g = winGeoFor({ x: hs.x - W * (kind === 'cambridge' ? 0.5 : 0.36), y: top, w: W, h: deskS - 16 - top }, c0);
      const clearX = (hs.x - toScreen(LAYERS.L2, c0, 0, 0).x) / toScreen(LAYERS.L2, c0, 1, 0).k;
      win[kind] = { g, far: farRectFor(g, camsIn(t0, t1)), clearX };
    }
    return { tl, b, D, man: m, cam, travel, CAMS, T, win };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    // the desk rides along the rim with the truck (on the twos: a paper cut-out slid along its groove)
    const manX = MAN_X0 + Math.max(0, sc.travel(tq) - sc.travel(b.name)) * 0.94;
    const deskX = manX + DESK_DX;
    const stop = stopAt(t, b);
    let temp = 20;
    for (const [ts, v] of b.temps) if (tq >= ts) temp = v;
    const on = boltzState(tq, temp, b.hot - 0.15);
    const netA = stop.kind === 'pittsburgh' || stop.kind === 'toronto' ? (stop.kind === 'pittsburgh' && stop.from !== 'pittsburgh' ? stop.u : 1) : 0;
    const geo = stageGeo({ candle: STERILE, candleX: CANDLE_X, s: CANDLE_S, pool: 0.84 });
    const POOL_RX = 372;
    const POOL_RY = 58;

    f.backlight({ sunX: 300, sunY: geo.flame.y + 60, sunRadius: 420, intensity: 0.28 });
    // L1: the far view through the stop's window (cached per stop); a 0.15 s dissolve into each stop
    f.layer('L1', (c, env) => {
      if (stop.u < 1) farView(f, c, stop.from, sc.win[stop.from].far, env, ID);
      farView(f, c, stop.kind, sc.win[stop.kind].far, env, ID, stop.kind === stop.from ? 1 : stop.u);
    });
    // L2: the dark stage wall with the window cut through it (no plate: the opening IS the light), and the low
    // warmth of the candle on the wall at left
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, sc.CAMS, 60);
      const snowK = win(t, b.toronto + 0.2, b.toronto + 1.6);
      if (stop.u < 1) windowWall(f, c, stop.from, sc.win[stop.from].g, r, env, ID, { clearX: sc.win[stop.from].clearX, t, snow: snowK });
      windowWall(f, c, stop.kind, sc.win[stop.kind].g, r, env, ID, { alpha: stop.kind === stop.from ? 1 : stop.u, clearX: sc.win[stop.kind].clearX, t, snow: snowK });
      const g = c.createRadialGradient(geo.flame.x, geo.flame.y + 80, 10, geo.flame.x, geo.flame.y + 80, 420);
      g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.45), 0.5));
      g.addColorStop(0.5, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.2), 0.2));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      c.fillStyle = g;
      c.fillRect(geo.flame.x - 420, geo.flame.y - 340, 840, 840);
    });
    f.fog({ yCenter: 0.55 * 720, height: 0.42 * 720, alpha: 0.12, drift: 5 });
    f.fog('B');

    f.layer('L4', (c, env) => {
      const m = env.mood;
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      // the floor: near-black boards, and the candle's pool with a visible RIM of light short of the desk
      c.fillStyle = mixLab(m.fg, m.set, 0.18);
      c.fillRect(r.x, FLOOR - 6, r.w, r.y + r.h - FLOOR + 6);
      c.save();
      c.translate(CANDLE_X, FLOOR + 12);
      c.scale(1, POOL_RY / POOL_RX);
      const pg = c.createRadialGradient(0, 0, 10, 0, 0, POOL_RX);
      pg.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.2), 0.85));
      pg.addColorStop(0.5, withAlpha(m.halo, 0.5));
      pg.addColorStop(0.86, withAlpha(mixLab(m.setHaze, m.halo, 0.45), 0.36));
      pg.addColorStop(0.95, withAlpha(mixLab(m.setHaze, m.halo, 0.3), 0.26));
      pg.addColorStop(1, withAlpha(m.set, 0));
      c.fillStyle = pg;
      c.beginPath();
      c.arc(0, 0, POOL_RX, 0, Math.PI * 2);
      c.fill();
      c.restore();
      c.strokeStyle = withAlpha(m.fg, 0.4);
      c.lineWidth = 1;
      for (let i = -14; i <= 14; i++) {
        c.beginPath();
        c.moveTo(CANDLE_X + i * 60, FLOOR);
        c.lineTo(CANDLE_X + i * 110, r.y + r.h);
        c.stroke();
      }
      // the sterile candle, to the candle-clock rule: the ring-scored translucent ghost sleeve above (its burned
      // years), the warm wax stub below with its scored rings, and the flame from f.practical('candle') on the
      // join (halo, then core). Baked a touch soft: it is the background, not the subject.
      const cw = 140, ch = 460;
      f.cached(`${ID}/candle3/${m.id}`, cw, ch, (cc) => {
        cc.translate(cw / 2 - CANDLE_X, ch - 10 - FLOOR);
        beliefCandle(cc, { x: CANDLE_X, y: FLOOR, view: STERILE, s: CANDLE_S, flame: 1, drawFlame: false, letters: 0, named: 0 }, env);
        waxCandle(cc, { x: CANDLE_X, y: FLOOR, view: STERILE, s: CANDLE_S, flame: 1, letters: 0.55 }, env);
        // the GHOST SLEEVE reads as translucent paper over the dark wall (darker than the lit wax), its rings
        // scored firmly enough to count at this distance (every fifth a full cut); the STUB is warm wax,
        // brightest just under the flame
        const top = FLOOR - 270 * CANDLE_S, stubTop = top + STERILE.rings * 6 * CANDLE_S, w = 30 * CANDLE_S;
        cc.fillStyle = withAlpha(m.ink, 0.5);
        cc.fillRect(CANDLE_X - w / 2, top, w, stubTop - top);
        cc.strokeStyle = withAlpha(m.rim, 0.42);
        cc.lineWidth = 1.1;
        cc.strokeRect(CANDLE_X - w / 2, top, w, stubTop - top);
        const wg = cc.createLinearGradient(0, stubTop, 0, FLOOR);
        wg.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.55));
        wg.addColorStop(0.18, withAlpha(m.halo, 0.22));
        wg.addColorStop(0.5, withAlpha(m.fg, 0.32));
        wg.addColorStop(1, withAlpha(m.fg, 0.62));
        cc.fillStyle = wg;
        cc.fillRect(CANDLE_X - w / 2 + 0.5, stubTop + 2, w - 1, FLOOR - stubTop - 2);
        cc.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.55);
        cc.lineWidth = 1;
        for (let i = 1; i < STERILE.rings; i++) {
          const yy = top + i * 6 * CANDLE_S;
          const ins = i % 5 === 0 ? 0 : w * 0.18;
          cc.beginPath();
          cc.moveTo(CANDLE_X - w / 2 + ins, yy);
          cc.lineTo(CANDLE_X + w / 2 - ins, yy);
          cc.stroke();
        }
        void stubTop;
      }, { blur: 0.8 })(c, CANDLE_X - cw / 2, FLOOR + 10 - ch);
      // the candle rule: on 'sterile' its label turns horizontal beside the flame with its dates (the bake
      // cannot fire the rule by itself, so it is driven here, live)
      const nk = candleNamingAt(ID, sc.T, t)[STERILE.id] ?? 0;
      // (it is still burning here, before 1986: its dates read 'lit 1969 · still burning', not its end)
      if (nk > 0) namedLabel(c, { x: CANDLE_X, y: FLOOR, view: { ...STERILE, years: null }, s: CANDLE_S, named: nk }, env);

      const smp = sc.man.sample(t);
      const p = withLife(smp.pose, tq, 1976, 0.8);
      const o = { x: manX, y: FLOOR, facing: 'right' as const, pose: p, scale: PS, ink: PUPPET_NEAR_BLACK, light: { x: LIGHT_DIR.x, y: LIGHT_DIR.y, floor: 0 }, edgeRim: { x: LIGHT_DIR.x, y: LIGHT_DIR.y, px: 1.6, alpha: 0.65 } };
      const deskKind = stop.u < 0.5 ? stop.from : stop.kind;
      // the long shadow away from the flame (desk and man)
      floorShadow(c, geo, manX, (cc) => {
        man.draw(cc, { ...o, x: 0, y: 0, edgeRim: undefined, cutLines: false }, env);
        cc.fillStyle = env.fill('ink');
        cc.fill(furniture(deskKind, -manX, 0, manX, deskX));
      }, env, 0.9);
      // desk + chair: SOLID ink paper-cuts, dissolving by the alpha of the whole shape at each stop
      const fa = stop.kind === stop.from ? 1 : Math.abs(stop.u - 0.5) * 2;
      c.save();
      c.globalAlpha *= fa;
      c.fillStyle = env.fill('ink');
      c.fill(furniture(deskKind, 0, 0, manX, deskX));
      // a thin rim on the candle-facing edges only (the furniture; the man is lit from the window)
      c.fillStyle = withAlpha(m.rim, 0.22);
      for (const [x, y, h] of rimEdges(deskKind, manX, deskX)) c.fillRect(x, y, 1.3, h);
      c.restore();
      man.draw(c, o, env);
      // the Boltzmann net on the Pittsburgh desk (it stays, steady, in Toronto)
      boltzNet(c, { x: deskX + NET_DX, y: DESK_TOP - 50 * NET_K, on, k: NET_K, alpha: netA }, env);
      thermoTag(c, { x: deskX + 182, y: DESK_TOP, temp, k: 1.15, alpha: netA * (1 - win(t, b.toronto - 0.1, b.toronto + 0.3)), flash: Math.max(0, 1 - Math.abs(tq - b.settle) * 3) }, env);
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: geo.flame.x, y: geo.flame.y + 4 * CANDLE_S, kind: 'candle', seed: 1943 + STERILE.slot, intensity: 0.85, radius: 80 });
    // the lantern net's light on his face and the desk
    if (netA > 0) {
      const lit = on.reduce((s, v) => s + v, 0) / 6;
      f.practical({ x: deskX + NET_DX, y: DESK_TOP - 50 * NET_K, kind: 'lamp', seed: 1982, intensity: 0.2 * netA * (0.4 + lit), radius: 46 });
    }
    // L5: a blurred chair back at the near left (the opening), the near corner of a reading desk at the right
    // (books, a mug, a lamp's dark shade) through the travel and Pittsburgh, and the stage lip along the bottom
    f.layer('L5', (c, env) => {
      c.fillStyle = env.fill('fg');
      nearDesk(c, env);
      c.fillStyle = env.fill('fg');
      const x = 120, y = 760;
      c.fillRect(x - 40, y - 330, 14, 330);
      c.fillRect(x + 70, y - 300, 12, 300);
      c.beginPath();
      c.moveTo(x - 46, y - 330);
      c.quadraticCurveTo(x + 20, y - 372, x + 88, y - 306);
      c.lineTo(x + 88, y - 286);
      c.quadraticCurveTo(x + 20, y - 344, x - 46, y - 304);
      c.closePath();
      c.fill();
      for (let k = 0; k < 4; k++) c.fillRect(x - 20 + k * 24, y - 320 + k * 6, 6, 120);
      c.fillRect(x - 46, y - 200, 134, 10);
    });
    stageLip(f, sc.CAMS, ID, 628);

    // the Hall's chalk ring lingering a beat as a ghost (screen-locked, where s01's easel left it)
    const ghost = 0.42 * (1 - win(t, 0.3, 1.7));
    if (ghost > 0.01) {
      const c = f.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(mixLab(f.mood.rim, f.mood.core, 0.4), ghost);
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(852, 336, 60, 0, Math.PI * 2);
      c.stroke();
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 4;
        c.fillStyle = withAlpha(f.mood.core, ghost);
        c.beginPath();
        c.arc(852 + Math.cos(a) * 60, 336 + Math.sin(a) * 60, 6.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }

    // type: the name only (script), clear of the candle on its own plate
    const tenv = { t, mood: f.mood, seed: 1982 };
    // his first naming: in on the word (lead 0.2 s), held 3 s through San Diego and Cambridge, mid-left over the
    // dark wall where the candle's naming label has just cleared (the stamp corner and the top label stay free)
    nameCardLg(f.c, { name: 'Geoffrey Hinton', role: '', x: 210, y: 330, align: 'left', at: b.name - 0.2, dur: 3.0 }, tenv);
    phosphorStamp(f.c, { place: 'PITTSBURGH', date: '1982', year: 1982, at: b.boltz, until: b.toronto - 0.05, fade: 0.3 }, tenv);
    phosphorStamp(f.c, { place: 'TORONTO', date: '1987', year: 1987, at: b.toronto + 0.05 }, tenv);
    const la = win(t, b.label - 0.1, b.label + 0.35) * (1 - win(t, b.toronto - 0.25, b.toronto + 0.1));
    textPlateLabel(f.c, 'Boltzmann machine · with Sejnowski & Ackley · 1985', 640, 92, { mood: f.mood, alpha: la, size: 30 });
  },
});

// ------------------------------------------------------------------ the furniture: one solid path per stop
/** the desk and chair for a stop, as one path (so it dissolves as one paper shape); offset (ox, oy) */
function furniture(kind: ClothKind, ox: number, oy: number, manX: number, deskX: number): Path2D {
  const p = new Path2D();
  const R = (x: number, y: number, w: number, h: number) => p.rect(x + ox, y + oy, w, h);
  const top = DESK_TOP;
  const seat = FLOOR - SEAT_H;
  const cx = manX - 34 * PS; // the chair under him
  const modern = kind === 'pittsburgh' || kind === 'toronto';
  // chair: seat slab, a back post rising behind him, legs (or a swivel column and star base)
  R(cx - 26 * PS, seat - 2, 58 * PS, 7 * PS);
  if (modern) {
    R(cx - 30 * PS, seat - 92 * PS, 9 * PS, 92 * PS);
    p.ellipse(cx - 24 * PS + ox, seat - 70 * PS + oy, 10 * PS, 30 * PS, -0.12, 0, Math.PI * 2);
    R(cx - 2 * PS, seat, 6 * PS, FLOOR - seat - 10);
    R(cx - 32 * PS, FLOOR - 10, 70 * PS, 5);
    p.moveTo(cx - 32 * PS + ox, FLOOR - 5 + oy);
    p.arc(cx - 32 * PS + ox, FLOOR - 3 + oy, 4, 0, Math.PI * 2);
    p.moveTo(cx + 38 * PS + ox, FLOOR - 5 + oy);
    p.arc(cx + 38 * PS + ox, FLOOR - 3 + oy, 4, 0, Math.PI * 2);
  } else {
    R(cx - 28 * PS, seat - 104 * PS, 7 * PS, FLOOR - seat + 104 * PS);
    R(cx - 32 * PS, seat - 104 * PS, 15 * PS, 6 * PS);
    R(cx - 28 * PS, seat - 70 * PS, 6 * PS, 6 * PS);
    R(cx + 25 * PS, seat, 6 * PS, FLOOR - seat);
    R(cx - 24 * PS, seat + (FLOOR - seat) * 0.6, 50 * PS, 3.5 * PS);
  }
  // desk
  const L = deskX - 70 * PS;
  const W = kind === 'pittsburgh' || kind === 'toronto' ? DESK_W_MODERN * PS : kind === 'cambridge' ? 160 * PS : 170 * PS;
  R(L - 6, top, W + 12, 9 * PS);
  if (kind === 'cambridge') {
    // a roll-top hood over the back of the desk
    p.moveTo(L + W * 0.35 + ox, top + oy);
    p.lineTo(L + W * 0.35 + ox, top - 70 * PS + oy);
    p.quadraticCurveTo(L + W + 8 + ox, top - 82 * PS + oy, L + W + 4 + ox, top + oy);
    p.closePath();
  }
  if (kind === 'sandiego') {
    // a plain table: four turned legs
    R(L + 2, top, 7 * PS, FLOOR - top);
    R(L + W - 9 * PS, top, 7 * PS, FLOOR - top);
    R(L + 2, top + 9 * PS, W - 4, 12 * PS);
  } else {
    // a pedestal of drawers at the far end, a leg at the near end, a modesty panel
    R(L + W - 64 * PS, top, 64 * PS, FLOOR - top);
    R(L + 2, top, 8 * PS, FLOOR - top);
    R(L + 2, top + 9 * PS, W - 66 * PS, 18 * PS);
  }
  return p;
}
/** candle-facing (left) edges that catch a thin rim: [x, y, h] */
function rimEdges(kind: ClothKind, manX: number, deskX: number): [number, number, number][] {
  const top = DESK_TOP;
  const L = deskX - 70 * PS;
  const W = kind === 'pittsburgh' || kind === 'toronto' ? DESK_W_MODERN * PS : kind === 'cambridge' ? 160 * PS : 170 * PS;
  const seat = FLOOR - SEAT_H;
  const cx = manX - 34 * PS;
  const out: [number, number, number][] = [
    [L - 6, top, 9 * PS],
    [L + 2, top + 9 * PS, FLOOR - top - 9 * PS],
    [kind === 'sandiego' ? L + W - 9 * PS : L + W - 64 * PS, top + 9 * PS, FLOOR - top - 9 * PS],
  ];
  if (kind === 'pittsburgh' || kind === 'toronto') out.push([cx - 34 * PS, seat - 100 * PS, 60 * PS]);
  else out.push([cx - 28 * PS, seat - 104 * PS, FLOOR - seat + 104 * PS]);
  return out;
}

// ------------------------------------------------------------------ L5: the near reading desk (right)
/** the near corner of a reading desk at frame right, out of focus: a slab edge, two books, a mug and a lamp's
 *  dark shade (L5 world; it slides in with the truck and frames the Pittsburgh lean-in from below right) */
function nearDesk(c: CanvasRenderingContext2D, env: PaintEnv) {
  const ink = env.fill('fg');
  const x = 1250, y = 506;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - 40, y);
  c.lineTo(x + 900, y - 12);
  c.lineTo(x + 900, y + 400);
  c.lineTo(x - 40, y + 400);
  c.closePath();
  c.fill();
  c.fillRect(x + 160, y - 30, 150, 30);
  c.fillRect(x + 172, y - 52, 128, 22);
  c.beginPath();
  c.ellipse(x + 90, y - 26, 18, 26, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x + 360, y - 300, 10, 300);
  c.beginPath();
  c.moveTo(x + 280, y - 300);
  c.lineTo(x + 450, y - 300);
  c.lineTo(x + 410, y - 380);
  c.lineTo(x + 320, y - 380);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.25);
  c.fillRect(x - 40, y - 1, 940, 1.6);
}
