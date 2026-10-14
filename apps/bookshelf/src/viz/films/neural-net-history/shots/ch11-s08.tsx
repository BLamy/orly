/**
 * ch11-s08 — the crowded rim of the scaling candle (duskRose stage → candleAmber board; 24.5 s; crossfade in from
 * the Wall).
 *
 * CAMERA: out of the flame (the shelf's SCALE IS THE MAIN LEVER candle, now huge on its stage) → the WIDE stage →
 * along the right RIM: the islands and the octopus → the parrot and Gebru → Marcus at the far rim → cut to the BOARD.
 *   0 → 'rim'    pulled back out of the flame: the candle stands huge, its pool full of server racks and anonymous
 *                builders facing the flame; at the rim, half in shadow and facing OUT, long shadows, the doubters
 *   'octopus'    two islands, an undersea telegraph cable drawn across the floor between them; an octopus coiled on
 *                the cable taps it, copying the dot-dash patterns perfectly (Bender & Koller · 2020, name card)
 *   'meaning'    a bear rises on one island's beach; the octopus has nothing useful to send (its side goes quiet)
 *   'parrots'    the camera eases along the rim (the octopus leaves frame left) to a parrot on a perch repeating
 *                type slugs in shuffled order; the paper's own phrase fades in small beside it (verbatim)
 *   'Gebru'      Gebru at the very edge (name card); two plain cards rise beside her, exactly equal in size and height:
 *                She says she was fired · Google says it accepted her resignation.
 *   'marcus'     music only: Marcus at the far rim with one short fragment of his words (might not hold forever)
 *   'clueCard'   cut to the board (candleAmber, STUDY LOCK): the hands pin this chapter's clue card, a single type sort,
 *                into C4-a; a thread of light runs back to ch10's thread-of-light card in C3. Hold, end.
 * ROUND-1 REVISE: the candle is the motivated key (pool 2× the stage default, rim at x ≈ 1420): the wall and floor fall
 *   toward ink with distance from the flame, a low fog sheet lies between the racks and the rim, and every rim figure
 *   (Bender, the islands, the parrot, Gebru, Marcus) stands where the light falls off, with a long floor shadow; the
 *   push from the wide reaches the islands on 'octopus' (the name card lands 0.1 s before it), and after the bear the
 *   octopus's half of the cable goes dark; the parrot/Gebru section is restaged ≈15% tighter with Gebru and her two
 *   equal 33 px cards in the left-centre third and Marcus at the far rim in the light's last spill; blurred L5
 *   occluders (a rack corner the truck slides across, the islands' near shore); the hero candle's own lettering is
 *   texture here (alpha 0.26, the shelf shot named it). The cut to the board comes at ≈23.2 s (Marcus's words have had
 *   3.8 s), the hands enter after a held beat, the sort (drawn over the fingers) lands on the pin at the clueCard beat
 *   and the thread runs back to C3-d over 0.5 s; C4-a in the centre third, the case card whole, and the lamp's pool
 *   falls off to the right so the board's small output (chat-box) card and the X-ray column sink into shadow. The
 *   'scaling laws:' kicker stays a separate italic gloss above Marcus's verbatim fragment.
 * Nobody is mocked and nobody is crowned: the rim figures are cut and lit like everyone else.
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, Palette, PaintEnv, Pose } from '../../../film';
import { LAYERS, MOODS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, layerXform, mixLab, nameCard, pose, quoteCard, serverRack, toLayer, withAlpha, withLife } from '../../../film';
import { cast, hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, slotWorld, studyCase, studyNear, studyRoom } from '../sets/study';
import { SLOTS, shelfStateAt } from '../sets/studyState';
import { STAGE, candleStage, type StageGeo } from '../sets/candleStage';
import { DEFAULT_POOL, drawCard, poolAt } from '../sets/caseBoard';
import { lightThread } from '../sets/ch05-s07-kit';
import { screenPass } from '../sets/ch06-s01-kit';
import { CARD19, CARD85, ch11Board, drawLineage, drawQuoteCard } from '../sets/ch11-s02-cards';
import { camPath, capLine, clamp01, pinArm, sm, tq12, win } from '../sets/ch11-s01-kit';
import { FONT, cardProbe, legibleSize } from '../../../film/silhouette/type';
import { candleFlame } from '../sets/beliefCandle';
import { ISLES, accountCard, bear, islands, octopus, parrot, parrotSlugs } from '../sets/ch11-s08-rim';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s08';
const SCALE_V = shelfStateAt(ID, 'start').find((v) => v.id === 'scale')!;
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const FY = STAGE.floorY;
/** round-2 revise: duskRose with its haze, sky and highlights pushed ≈18% further toward rose/mauve (the stock palette
 *  sits within a hair of candleAmber on this stage); the flame's core stays warm. A shot-local palette id keeps every
 *  cache keyed apart from the stock duskRose. */
const ROSE: Palette = (() => {
  const d = MOODS.duskRose;
  const r = (hex: string, to: string, u: number) => mixLab(hex, to, u);
  return {
    ...d,
    id: 'duskRose~ch11-s08' as Palette['id'],
    sky: d.sky.map((h, i) => r(h, ['#4a2c38', '#734857', '#93606f', '#b47e88'][i], 0.22)) as Palette['sky'],
    set: r(d.set, '#45293a', 0.14),
    setHaze: r(d.setHaze, '#6b4458', 0.2),
    haze: r(d.haze, '#8c5f72', 0.2),
    rim: r(d.rim, '#e6a6ae', 0.22),
    halo: r(d.halo, '#b9737f', 0.18),
  };
})();

// ------------------------------------------------------------------------------------------------ marks (L4 world)
/** round-1 revise: the pool is the motivated key (2× the stage default: its rim at x ≈ 1420), and the rim figures are
 *  restaged closer so each stands where the light falls off: Bender at the pool's outer glow, the islands straddling
 *  the rim, the parrot and Gebru just past it, Marcus at the light's last edge */
const POOL_K = 2.0;
const RIM_X = STAGE.candleX + STAGE.poolRx * POOL_K;
/** Bender stands at the water's edge beside the octopus island, half-lit, looking at the parable. Round-3 review: out
 *  at the pool's edge (≈ 120 px right of the first cut in the wide), clear of the builders, facing out, her long shadow
 *  raking across the floor away from the candle */
const BENDER_X = 990;
/** the islands diorama is drawn 1.65× about its centre, straddling the rim */
const ISLE_K = 1.65;
const ISLE_C = { x: 1300, y: 676 };
const PARROT = { x: 1720, y: 470 };
const GEBRU_X = 1830;
/** two EXACTLY equal cards on one plane at Gebru's shoulder height, right beside her (33 px: ≥ 22 px cap at 1080p) */
/** round-2 revise: 75% of the first cut (paper props at the rim, not slides), still exactly equal; 25 px type clears
 *  the 22 px cap floor from GEB_CAM */
const CARDS = { y: 404, w: 232, h: 124, gap: 14, size: 25 };
const CARD_A = { x: GEBRU_X + 54 + CARDS.w / 2, lines: ['She says', 'she was fired'] };
const CARD_B = { x: GEBRU_X + 54 + CARDS.w * 1.5 + CARDS.gap, lines: ['Google says it', 'accepted her', 'resignation.'] };
/** Marcus at the far rim, lit by the light's last edge (he enters frame on his beat; round-2: ≈80 px further into
 *  frame, so he is whole by the time his words are read) */
const MARCUS_X = 2648;
/** the stage candle's flame (the opening close-up starts on it) */
const FLAME = candleFlame({ x: STAGE.candleX, y: FY, view: SCALE_V, s: STAGE.s });

// ------------------------------------------------------------------------------------------------ cameras
/** round-3 review: the shot OPENS on the stage candle's flame in close-up, the flame where the shelf candle's flame sat
 *  in ch11-s05's shelf framing (screen ≈ 670, 156), so the candle carries the crossfade; then the pull back to the wide */
const FLAME_K = 1000 / (1000 - 640);
const FLAME_CAM: Camera3 = { x: FLAME.x - (670 - 640) / FLAME_K, y: FLAME.y - (156 - 360) / FLAME_K, z: 640, lens: 1 };
const WIDE: Camera3 = { x: 1010, y: 420, z: -290, lens: 1 };
/** the push toward the parable: by 'octopus' the islands fill the frame's middle (tapping and the bear read) */
const OCTO: Camera3 = { x: 1270, y: 560, z: 210, lens: 1 };
/** close on the parrot and its shuffled slugs, Gebru beside it, the pool's edge at the left */
const PARROT_IN: Camera3 = { x: PARROT.x + 70, y: 470, z: 300, lens: 1 };
/** Gebru and her two cards in the left-centre third; the pool's last light at the left edge */
const GEB_CAM: Camera3 = { x: 2000, y: 440, z: 100, lens: 1 };
/** round-3 review: trucked ≈ 115 px further right, so Marcus stands at ≈ 80 % of the frame width with room around him */
const FAR: Camera3 = { x: 2275, y: 430, z: 60, lens: 1 };
const FAR2: Camera3 = { x: 2292, y: 428, z: 78, lens: 1 };
const CAMS = [FLAME_CAM, WIDE, OCTO, PARROT_IN, GEB_CAM, FAR, FAR2];
/** round-1 review: the parrot's word strips hang on their OWN plane in front of the perch (sharp, nearer than the
 *  action plane, so they slide against the perch on every move), clear of Gebru's silhouette: placed by where they
 *  should read on screen from PARROT_IN (centred left of the perch, below the bird), slugs ≈ 0.85× the first cut */
const SLUG_PLANE: LayerSpec = { id: 'parrotSlugs', z: 800, haze: 0.02, blur: 0 };
const SLUG_AT = toLayer(SLUG_PLANE, PARROT_IN, 440, 470);
const SLUG_SIZE = (15 * 1.45 * (1000 / (1000 - PARROT_IN.z)) * 0.85) / layerXform(SLUG_PLANE, PARROT_IN).k;
/** L5 occluders (blurred): a rack corner that the truck from the islands to the parrot slides across, and the islands'
 *  near shore low in the frame while the camera is on the parable */
const RACK_AT = toLayer(LAYERS.L5, PARROT_IN, 40, -40);
/** the front-row spectator: the art's top-left at screen (1010, 560) when the camera is on the parable */
const SPECT_AT = toLayer(LAYERS.L5, OCTO, 1010, 560);
const L5K = layerXform(LAYERS.L5, PARROT_IN).k;
// the board insert at the end
/** C4-a in the centre third, the WHO TAUGHT IT? case card whole at the left, C3-d below so the thread back reads */
const BOARD_CAM: Camera3 = { x: 860, y: 360, z: 480, lens: 1 };
const BOARD_CAMS = [BOARD_CAM, { ...BOARD_CAM, z: 500 }];

interface B {
  D: number;
  rim: number;
  octo: number;
  bear: number;
  parrot: number;
  gebru: number;
  marcus: number;
  cut: number;
  pin: number;
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      rim: T.beat('rim'),
      octo: T.beat('octopus'),
      bear: T.beat('bear'),
      parrot: T.beat('parrot'),
      gebru: T.beat('twoAccounts') - 0.14,
      marcus: T.beat('marcus'),
      // round-3 review: the cut to the board comes 0.8 s before the pin (Marcus's words have been up since ≈ 20.4 s),
      // so the sort is pinned on the clueCard beat, the thread runs back over 0.5 s and the frame holds clean at the end
      cut: T.beat('clueCard') - 0.8,
      pin: T.beat('clueCard'),
    };
    tl.hold(0, D);
    const cam = camPath([
      [0, FLAME_CAM],
      // (eased in and out: the close-up holds through the middle of the crossfade, the pull back lands at 0.9 s)
      [0.9, WIDE, (u) => u * u * (3 - 2 * u)],
      // the push toward the parable, 1.0 → just past 'octopus' (the octopus large enough to read its tapping)
      [b.octo + 0.15, OCTO],
      [b.bear + 0.8, { ...OCTO, x: OCTO.x - 14, z: OCTO.z + 24 }],
      [b.parrot - 0.1, PARROT_IN],
      [b.gebru - 1.6, { ...PARROT_IN, x: PARROT_IN.x + 24, z: PARROT_IN.z + 30 }],
      [b.gebru + 0.2, GEB_CAM],
      [b.marcus + 0.4, FAR],
      [b.cut, FAR2],
    ]);
    return { tl, b, cam };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    if (t >= b.cut) return paintBoard(f, t, b);
    const cam = (scene.cam as (t: number) => Camera3)(t);
    f.camera(cam);
    f.setMood(ROSE);
    const tq = tq12(t);
    candleStage(f, {
      key: ID,
      cams: CAMS,
      candle: SCALE_V,
      pool: POOL_K,
      // the shelf shot named this candle: its own lettering is texture here (the audit's alpha floor is 0.3)
      letters: 0.26,
      // review round 3: the rim room's ornamental near plane (a pierced fretwork screen at the right edge). Round-3
      // hand-off: it crowded Marcus at the far rim and his quote block, so it is DROPPED for the far-rim framing: it
      // fades out over 1.2 s while the two account cards hold (Marcus still off frame right), and is gone before he
      // enters on his beat
      // round-3 review: the full-height fret read as film sprocket holes: ONE carved chair back at the lower right
      // instead (the rim-room rule), faded out for the far-rim framing as before
      near: fretAlpha(t, b) > 0.003 ? { kind: 'chair', side: 'right', alpha: fretAlpha(t, b), scale: 0.68 } : undefined,
      back: (c, env) => back(c, env),
      draw: (c, env, geo) => front(c, env, geo, t, tq, b),
    });
    // the parrot's repeated slugs, strung on their own plane in front of the perch
    // (they come in as the camera leaves the islands for the perch, so they never hang loose at the frame's edge)
    const slugA = win(t, b.bear + 1.0, b.parrot - 0.7);
    if (slugA > 0.003) {
      f.layer(SLUG_PLANE, (c, env) => {
        c.save();
        c.globalAlpha *= slugA;
        const tw = parrotSlugs(c, env, { x: SLUG_AT.x, y: SLUG_AT.y, tq, talk: win(t, b.parrot - 0.4, b.parrot + 0.2), align: 'center', size: SLUG_SIZE });
        cardProbe(c, 'ch11-s08/slugs', SLUG_AT.x - tw / 2, SLUG_AT.y, tw, SLUG_SIZE * 2, 1, 1);
        c.restore();
      });
    }
    // L5: the near occluders, soft
    f.layer('L5', (c, env) => nearOccluders(f, c, env));
    screenPass(f, (c) => {
      const tenv = { t, mood: f.mood };
      nameCard(c, { name: 'Emily M. Bender & Alexander Koller', role: '2020', x: 56, y: 600, at: b.octo - 0.1, dur: b.parrot - b.octo - 0.2 }, tenv);
      // the quotations' attributions are set large (≥ 26 px at 1080p) on their own plate line
      const pq = { at: b.parrot + 0.05, dur: b.gebru - 0.5 - b.parrot };
      // (the kit card sets the attribution itself, at the legibility floor: the speakers, then the source line)
      quoteCard(c, { quote: '…without any reference to meaning: a stochastic parrot.', speaker: 'Bender, Gebru, McMillan-Major & Mitchell', source: '(as Shmitchell), 2021', x: 540, y: 112, width: 600, size: 27, align: 'center', at: pq.at, dur: pq.dur, stagger: 0.3 }, tenv);
      // round-2 revise: the name lands AS it is said (fully up by 'Gebru')
      nameCard(c, { name: 'Timnit Gebru', role: "co-lead, Google's Ethical AI team", x: 56, y: 600, at: b.gebru - 0.36, dur: 3.9 }, tenv);
      // round-1 review (historian): Marcus's words labelled in context (q11-marcus-laws, verbatim). Round-2 revise: the
      // context is a plain label OUTSIDE the quotation ('on scaling laws'), and the block sits high over Marcus himself,
      // clear of the account cards
      kicker(c, f.mood, t, b.marcus, b.cut + 0.1, 'on scaling laws', 1050, 72);
      quoteCard(c, { quote: 'mere observations that might not hold forever', speaker: 'Gary Marcus', source: '2022', x: 1050, y: 171, width: 420, size: 27, align: 'center', at: b.marcus + 0.15, dur: b.cut - b.marcus - 0.05, stagger: 0.3 }, tenv);
    });
  },
});

/** the fretwork near plane's opacity: full on the stage, the islands and the parrot; gone for the far-rim framing */
function fretAlpha(t: number, b: B): number {
  return 1 - win(t, b.gebru + 0.3, b.gebru + 1.4);
}

/** the context over a quotation (small italic, legible) */
function kicker(c: C, m: Frame['mood'], t: number, at: number, until: number, text: string, x: number, y: number) {
  const a = win(t, at, at + 0.5) * (1 - win(t, until - 0.6, until));
  const size = legibleSize(c, `500 17px ${FONT.mono}`, 17) + 1;
  capLine(c, m, text.toUpperCase(), x, y, a, { size, font: `500 ${size}px ${FONT.mono}`, color: mixLab(m.halo, '#ffffff', 0.45) });
}

// ================================================================================================= STAGE
function back(c: C, env: PaintEnv) {
  const m = env.mood;
  // the rim's architecture: the scaling candle's warm glow reaching across the upper wall from the left, and racks
  // marching off along the back wall into the haze beyond the rim (so the upper frame is never bare panelling)
  const gl = c.createLinearGradient(560, 0, 2900, 0);
  gl.addColorStop(0, withAlpha(m.halo, 0.32));
  gl.addColorStop(0.45, withAlpha(m.halo, 0.12));
  gl.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = gl;
  c.fillRect(560, -200, 2600, 760);
  c.save();
  for (let i = 0; i < 15; i++) {
    const x = 1120 + i * 150;
    c.globalAlpha = 0.5 - 0.022 * i;
    serverRack(c, { x, y: FY - 70, s: 1.55 - 0.02 * i, activity: 0.18, seed: 40 + i }, env);
  }
  c.restore();
  // a gantry of cable trays overhead, catching the candle's light along its top edge
  c.fillStyle = mixLab(m.set, m.setHaze, 0.5);
  c.fillRect(1000, 96, 2300, 10);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(1000, 95, 2300, 1.2);
  c.fillStyle = mixLab(m.set, m.setHaze, 0.5);
  for (let x = 1060; x < 3300; x += 230) c.fillRect(x, 106, 4, 40 + 30 * Math.abs(Math.sin(x)));
  // a soft backlight band behind the right rim, so the doubters read against light (half in shadow)
  for (const [x, r, a] of [
    [1240, 380, 0.32],
    [1900, 420, 0.3],
    [2700, 380, 0.28],
  ] as const) {
    const g = c.createRadialGradient(x, 470, 20, x, 470, r);
    g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.sky[2], 0.5), a));
    g.addColorStop(1, withAlpha(m.setHaze, 0));
    c.fillStyle = g;
    c.fillRect(x - r, 470 - r, 2 * r, 2 * r);
  }
  // the candle is the key: the wall darkens with distance from the flame (beyond the pool's rim it falls toward ink)
  const dk = c.createLinearGradient(STAGE.candleX + 300, 0, RIM_X + 1500, 0);
  dk.addColorStop(0, withAlpha(m.fg, 0));
  dk.addColorStop(0.35, withAlpha(m.fg, 0.38));
  dk.addColorStop(1, withAlpha(m.fg, 0.72));
  c.fillStyle = dk;
  c.fillRect(STAGE.candleX + 300, -400, 3400, 1200);
  const dl = c.createLinearGradient(STAGE.candleX - 300, 0, -600, 0);
  dl.addColorStop(0, withAlpha(m.fg, 0));
  dl.addColorStop(1, withAlpha(m.fg, 0.6));
  c.fillStyle = dl;
  c.fillRect(-1400, -400, 1100 + STAGE.candleX, 1200);
  // a fog sheet between the racks and the rim: low haze lit warm near the flame, cold and thin beyond
  const fg = c.createLinearGradient(0, FY - 260, 0, FY + 10);
  fg.addColorStop(0, withAlpha(m.setHaze, 0));
  fg.addColorStop(1, withAlpha(mixLab(m.setHaze, m.halo, 0.3), 0.32));
  c.fillStyle = fg;
  c.fillRect(STAGE.candleX + 200, FY - 260, 3200, 270);
  // server racks inside the pool, behind the builders
  for (const [x, s, seed] of [
    [340, 1.25, 3],
    [418, 1.15, 5],
    [740, 1.3, 7],
    [820, 1.2, 9],
    [900, 1.1, 13],
  ] as const) {
    serverRack(c, { x, y: FY - 6, s, activity: 0.25, seed }, env);
  }
}

const STAND: Pose = POSES.stand;
const DOUBT: Pose = POSES.doubt;
const THINK: Pose = POSES.think;
/** Marcus's small beat as his words arrive: chin up, the near hand opening a little from the fist */
const MARCUS_TURN: Pose = pose({ hipF: 2, kneeF: -2, hipB: -6, kneeB: 0, torso: -3, neck: 4, head: 7, shoulderF: -14, elbowF: 44, wristF: 4, shoulderB: -22, elbowB: 50 }, { handF: 'open', handB: 'fist' });
const LOOK: Pose = pose({ hipF: 6, kneeF: -6, hipB: -4, kneeB: -1, torso: 2, neck: 6, head: 4, shoulderF: -10, elbowF: 30, wristF: 6, shoulderB: -16, elbowB: 26 });

function front(c: C, env: PaintEnv, geo: StageGeo, t: number, tq: number, b: B) {
  const lightDir = { x: -1, y: -0.3 };
  // the floor beyond the pool falls off into dark (so the rim is a real edge of light), with one faint last spill
  // reaching Marcus
  {
    const m = env.mood;
    const g = c.createLinearGradient(RIM_X - 180, 0, RIM_X + 1500, 0);
    g.addColorStop(0, withAlpha(m.fg, 0));
    g.addColorStop(0.3, withAlpha(m.fg, 0.55));
    g.addColorStop(1, withAlpha(m.fg, 0.82));
    c.fillStyle = g;
    c.fillRect(RIM_X - 180, FY - 6, 3400, 400);
    const gl = c.createLinearGradient(geo.rimXL + 180, 0, geo.rimXL - 900, 0);
    gl.addColorStop(0, withAlpha(m.fg, 0));
    gl.addColorStop(1, withAlpha(m.fg, 0.75));
    c.fillStyle = gl;
    c.fillRect(geo.rimXL - 2400, FY - 6, 2580, 400);
    c.save();
    c.translate(geo.candleX, FY + 14);
    c.scale(1, 0.05);
    const sp = c.createRadialGradient(0, 0, RIM_X - geo.candleX, 0, 0, MARCUS_X - geo.candleX + 300);
    sp.addColorStop(0, withAlpha(m.halo, 0.14));
    sp.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = sp;
    c.beginPath();
    c.arc(0, 0, MARCUS_X - geo.candleX + 300, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // the builders inside the pool, facing the flame (anonymous; small)
  const builders: [keyof typeof cast, number, 'left' | 'right', Pose, number][] = [
    ['chat-user', 760, 'left', LOOK, 0.82],
    ['labeller', 840, 'left', STAND, 0.8],
    ['crowd-worker', 360, 'right', LOOK, 0.8],
  ];
  for (const [id, x0, facing, p, s] of builders) {
    const x = x0 - 150;
    const pp = withLife(p, tq, x);
    rimShadow(c, geo, x, (cc) => cast[id].draw(cc, { x: 0, y: 0, facing, pose: pp, scale: s, ink: PUPPET_NEAR_BLACK }, env), 0.8);
    cast[id].draw(c, { x, y: FY, facing, pose: pp, scale: s, ink: PUPPET_NEAR_BLACK, light: { x: x < geo.candleX ? 1 : -1, y: -0.3, floor: 0.1 }, edgeRim: { x: x < geo.candleX ? 1 : -1, y: -0.4 } }, env);
  }
  // ---- the islands and the octopus beyond the right rim, on the floor (a diorama, 1.8×); a low light over them
  // round-2 revise: from 'meaning' the tapping arm lifts and HOVERS, the mantle tilts ≈10°, and the cable stalls and
  // goes dark from the octopus outward to the bear's island (nothing useful to send)
  const alarm = win(t, b.bear, b.bear + 0.3);
  c.save();
  c.translate(ISLE_C.x, ISLE_C.y);
  c.scale(ISLE_K, ISLE_K);
  c.translate(-(ISLES.a.x + ISLES.b.x) / 2, -ISLES.a.y);
  c.save();
  c.translate((ISLES.a.x + ISLES.b.x) / 2, ISLES.a.y + 18);
  c.scale(1, 0.16);
  const pg = c.createRadialGradient(0, 0, 10, 0, 0, 260);
  pg.addColorStop(0, withAlpha(env.mood.halo, 0.22));
  pg.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = pg;
  c.fillRect(-260, -260, 520, 520);
  c.restore();
  // the bear rises: the islander's half of the cable flashes the alarm; the octopus keeps tapping out the SAME regular
  // pattern for 1.6 s (shape without meaning), then its arm hovers and its half goes dark
  const replyUntil = b.bear + 1.6;
  const reply = 1 - win(t, replyUntil, replyUntil + 0.35);
  islands(c, env, { t, tq, talk: win(t, b.octo - 0.6, b.octo + 0.2), alarm, light: 0.6, stallAt: b.bear, replyUntil });
  octopus(c, env, { tq, tap: reply, puzzled: 1 - reply, hover: 1 - reply });
  bear(c, env, sm(clamp01((tq - b.bear + 0.45) / 0.4)));
  c.restore();
  // ---- the rim figures, facing OUT (right), long shadows away from the candle
  const rims: [keyof typeof cast, number, Pose, number][] = [
    ['bender', BENDER_X, THINK, 1],
    ['gebru', GEBRU_X, STAND, 1],
    ['marcus', MARCUS_X, DOUBT, 1],
  ];
  // round-3 review: Gebru waits in the shadow (alpha 0.35, no rim) and steps into the light as her name card lands
  // (≈ 16 s), so for the 8 s before she cannot be taken for Bender. Marcus gives one small talk/turn beat (on twos) as
  // his quotation arrives.
  const gebLit = win(tq, b.gebru - 0.95, b.gebru - 0.35);
  const marcusBeat = win(tq, b.marcus + 0.1, b.marcus + 0.35) * (1 - win(tq, b.marcus + 1.0, b.marcus + 1.4));
  for (const [id, x0, p, s] of rims) {
    const x = id === 'gebru' ? x0 - 22 * (1 - gebLit) : x0;
    const p1 = id === 'marcus' ? blendPose(p, MARCUS_TURN, marcusBeat) : p;
    const pp = withLife(p1, tq, x0 * 3);
    // in the shadow: an opaque cut-out at ≈ 35 % of her lit contrast against the dark wall behind her (no rim, no
    // cut-lines), so she reads as a figure not yet in the light rather than a ghost
    const shade = id === 'gebru' ? 1 - gebLit : 0;
    const ink = shade > 0 ? mixLab(PUPPET_NEAR_BLACK, mixLab(env.mood.set, env.mood.fg, 0.55), 0.65 * shade) : PUPPET_NEAR_BLACK;
    const lit = id !== 'gebru' || gebLit > 0.5;
    // Bender's shadow is long, raking and stronger (she is out at the pool's edge); the others as before
    rimShadow(c, geo, x, (cc) => cast[id].draw(cc, { x: 0, y: 0, facing: 'right', pose: pp, scale: s, ink: PUPPET_NEAR_BLACK }, env), id === 'bender' ? 1.8 : 0.8 * (1 - 0.65 * shade), id === 'bender' ? 1.4 : 1);
    cast[id].draw(c, { x, y: FY, facing: 'right', pose: pp, scale: s, ink, ...(lit ? { light: { x: -1, y: -0.3, floor: 0.15 }, edgeRim: { x: -1, y: -0.3, px: 1.5 } } : { cutLines: false }) }, env);
  }
  // ---- the parrot on its perch beside Gebru
  c.save();
  c.translate(PARROT.x, FY);
  c.scale(1.45, 1.45);
  c.translate(-PARROT.x, -FY);
  parrot(c, env, { x: PARROT.x, y: PARROT.y + 50, tq, talk: win(t, b.parrot - 0.4, b.parrot + 0.2), light: 0.6, slugs: false });
  c.restore();
  // ---- two equal cards beside Gebru, one for each account. Round-2 review: they arrive ALREADY INKED (no blank grey
  // cards first): each is at full opacity from its first frame, its ink crisp; it settles 8 px on twos and catches
  // the light (0.35 → 0.55) over 0.3 s, so the eye lands on the words, never on an empty card
  if (tq >= b.gebru) {
    const u = sm(clamp01((tq - b.gebru) / 0.34));
    for (const cd of [CARD_A, CARD_B]) {
      const y = CARDS.y + 8 * (1 - u);
      accountCard(c, env, { x: cd.x, y, w: CARDS.w, h: CARDS.h, lines: cd.lines, rise: 1, light: 0.35 + 0.2 * u, size: CARDS.size });
      cardProbe(c, `ch11-s08/account${cd === CARD_A ? 'A' : 'B'}`, cd.x - CARDS.w / 2, y - CARDS.h / 2, CARDS.w, CARDS.h, 1, 1);
    }
  }
  void lightDir;
}

/**
 * A figure's long floor shadow away from the candle (the stage kit's floorShadow, re-aimed): round-2 revise: it falls
 * ≈11° steeper toward the viewer, a little shorter and soft (blurred, α ≈ 0.6), so the builders' shadows pass BELOW
 * the islands' diorama instead of running into the octopus like spears.
 */
function rimShadow(c: C, geo: StageGeo, feetX: number, draw: (c: C) => void, strength = 1, lenK = 1) {
  const dir = feetX >= geo.candleX ? 1 : -1;
  const lit = Math.max(0.15, geo.inPool(feetX) + 0.35);
  const len = (1.05 + 0.45 * (1 - geo.inPool(feetX))) * lenK;
  // a longer shadow (Bender's, out at the pool's edge) is wider and falls a little steeper toward the viewer, so it
  // passes in front of the octopus diorama rather than through it
  const a = ((lenK > 1 ? 24 : 17) * Math.PI) / 180;
  const wide = lenK > 1 ? 0.26 : 0.16;
  c.save();
  c.globalAlpha *= 0.6 * strength * lit;
  c.filter = 'blur(3.5px)';
  c.translate(feetX, geo.floorY + 2);
  c.transform(0, wide, -dir * len * Math.cos(a), -len * Math.sin(a), 0, 0);
  draw(c);
  c.restore();
}

// ================================================================================================= L5
function nearOccluders(f: Frame, c: C, env: PaintEnv) {
  const k = L5K;
  // a rack corner, full height, soft
  f.cached(`${ID}/L5rack/${env.mood.id}`, Math.ceil(150 / k), Math.ceil(800 / k), (cc) => {
    cc.scale(1 / k, 1 / k);
    cc.fillStyle = env.fill('fg');
    cc.fillRect(20, 0, 120, 800);
    cc.fillStyle = withAlpha(env.mood.rim, 0.35);
    cc.fillRect(138, 0, 2, 800);
    cc.fillStyle = withAlpha(env.mood.core, 0.5);
    for (let i = 0; i < 9; i++) cc.fillRect(118, 120 + i * 62, 6, 3);
  }, { blur: 8 })(c, RACK_AT.x, RACK_AT.y);
  // round-2 revise: the anonymous blob at the bottom of the wide is now a SPECTATOR in the front row of the paper
  // theatre: head and shoulders, soft, a lit edge on the crown; bottom-right of the wide, sliding right as the camera
  // pushes to the islands (a near plane against the stage)
  const ks = layerXform(LAYERS.L5, OCTO).k;
  f.cached(`${ID}/L5spectator/${env.mood.id}`, Math.ceil(420 / ks), Math.ceil(300 / ks), (cc) => {
    cc.scale(1 / ks, 1 / ks);
    cc.fillStyle = env.fill('fg');
    // shoulders and upper back, the coat collar
    cc.beginPath();
    cc.moveTo(30, 300);
    cc.quadraticCurveTo(40, 170, 140, 150);
    cc.lineTo(170, 134);
    cc.lineTo(250, 134);
    cc.lineTo(282, 150);
    cc.quadraticCurveTo(384, 170, 396, 300);
    cc.closePath();
    cc.fill();
    // neck and head (short hair, an ear)
    cc.fillRect(184, 104, 52, 44);
    cc.beginPath();
    cc.ellipse(210, 70, 46, 56, -0.06, 0, Math.PI * 2);
    cc.fill();
    cc.beginPath();
    cc.ellipse(166, 82, 8, 13, 0.2, 0, Math.PI * 2);
    cc.fill();
    // the candle catching the crown and the near shoulder
    cc.strokeStyle = withAlpha(env.mood.rim, 0.9);
    cc.lineWidth = 5;
    cc.beginPath();
    cc.ellipse(210, 70, 46, 56, -0.06, Math.PI * 1.0, Math.PI * 1.75);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(48, 214);
    cc.quadraticCurveTo(66, 164, 140, 150);
    cc.stroke();
  }, { blur: 7 })(c, SPECT_AT.x, SPECT_AT.y);
}

// ================================================================================================= BOARD
function paintBoard(f: Frame, t: number, b: B) {
  const cam = { ...BOARD_CAM, z: BOARD_CAM.z + 20 * sm((t - b.cut) / (b.D - b.cut)) };
  f.camera(cam);
  f.setMood('candleAmber');
  const tq = tq12(t);
  studyRoom(f, { key: ID, cams: BOARD_CAMS, outside: { mood: 'duskRose', kind: 'city', city: 0.5 } });
  const entry = handsEntry(cam, 'L4');
  // the hands enter after a held beat on the board; the sort lands on the pin at the clueCard beat (u = 0.45), then
  // the thread of light runs back to C3-d over 0.5 s
  const PIN_DUR = 1.6;
  // (after the pin the hand withdraws in 0.5 s, so the last 0.4 s hold on the pinned sort alone)
  const u = tq < b.pin ? (tq - (b.pin - 0.45 * PIN_DUR)) / PIN_DUR : 0.45 + (0.55 * (tq - b.pin)) / 0.5;
  const thread = clamp01((t - b.pin - 0.03) / 0.5);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: ch11Board(ID, 'start') },
    extra: (c, env) => {
      drawLineage(c, env);
      for (const g of [CARD19, CARD85]) drawQuoteCard(c, env, g, { light: poolAt(POOL, g.x - STUDY.board.x, g.y - STUDY.board.y) + 0.2, underline: 1 });
      if (thread > 0) lightThread(c, env, slotWorld('C4-a', 'pin'), slotWorld('C3-d', 'pin'), thread, 0.9, 30);
      if (u > 0 && u < 1) {
        const pose = hands.act('pin', Math.max(0.05, u), slotWorld('C4-a', 'pin'), { held: 'card', scale: 0.8, entry });
        // the carried sort is drawn OVER the fingers (they hold it by its top edge), so it reads all the way in
        let held: { x: number; y: number } | null = null;
        pinArm(c, env, pose, { heldDraw: u < 0.45 ? (_cc, at) => void (held = { x: at.x, y: at.y + SLOTS['C4-a'].h / 2 - 7 }) : undefined });
        const hp = held as { x: number; y: number } | null;
        if (hp) sortCard(c, env, hp, 0);
      }
      // once pinned the sort is drawn over the fingers (they press the pin at its top edge; the sort reads whole)
      if (u >= 0.45) sortCard(c, env, slotWorld('C4-a'), 0.3 * thread);
    },
  });
  studyNear(f, { key: ID, cams: BOARD_CAMS, file: true });
  // the lamp's pool falls off to the right: the board's output slot (the small chat-box card) and the study's X-ray
  // column beyond it sink into shadow, so nothing here reads as the glowing chat box ch12-s01 opens on
  screenPass(f, (c) => {
    const g = c.createLinearGradient(880, 0, 1160, 0);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(0.5, withAlpha(f.mood.fg, 0.84));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.9));
    c.fillStyle = g;
    c.fillRect(900, -4, 384, 728);
  });
  void LAYERS;
}

function sortCard(c: C, env: PaintEnv, p: { x: number; y: number }, glow: number) {
  const s = SLOTS['C4-a'];
  drawCard(c, s, { x: p.x, y: p.y, k: STUDY.board.k, light: poolAt(POOL, s.x, s.y) + glow, lit: glow > 0.05 }, env);
  // (its '2018' is the board map's canonical C4 start year, 2018–2023, as every later study shot letters it)
  cardProbe(c, 'ch11-s08/clue', p.x - (s.w * STUDY.board.k) / 2, p.y - (s.h * STUDY.board.k) / 2, s.w * STUDY.board.k, s.h * STUDY.board.k, 1, 1);
}
