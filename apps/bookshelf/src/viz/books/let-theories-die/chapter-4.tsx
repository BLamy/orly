// Fit Isn't Good
//
// Let Theories Die — chapter 4. D3/SVG scene authored by Claude Opus 5.5. Requested model `claude-opus-5-5`;
// actual: `claude-opus-5-5`. Planned by Claude Opus 5.5 (user override of the default Astra planning stage) in
// .orly-work/visual-plan.md, chapter 4. The eleven captions are the plan's fixed narration.
//
// Sources (sources.json, chapter 4):
//   Weimar figures      https://en.wikipedia.org/wiki/July_1932_German_federal_election
//   Popper, the quote   "Natural Selection and the Emergence of Mind" (Darwin Lecture 1977; Dialectica 32, 1978)
//   Popper, democracy   The Economist, 1988, "The open society and its enemies revisited"
//   Wrangham            The Goodness Paradox (2019); Planer review, PhilSci-Archive 20268
//   memetic fitness     inferred (narrated as an inference)
//
// Schematic versus measured: the social graph, both ideas, their spread and the clusters are an illustration.
// The Weimar panel carries the article's reported values (unemployment 8.5% → nearly 30%, 1929–32; 37.3% of the
// vote in July 1932). The coalition ring is schematic.
//
// Beat sheet — ONE graph of 42 people carries the chapter:
//   C0  the graph; two ideas seeded: a simple one (red) and a careful one (blue)
//   C1  red floods by hops; blue crawls; chip: an inference
//   C2  a Weimar panel: unemployment bar rises 8.5 → ~30
//   C3  the vote bar: 37.3%, July 1932
//   C4  "selection didn't miss them: they won it"
//   C5  Popper: an animal dies with its hypothesis; a person states it, and only the idea dies
//   C6  the quote card
//   C7  the graph splits into three clusters with filters on the bridges; red is contained and drains
//   C8  Wrangham: a dominant node, a coalition gathers round it
//   C9  the ring closes; the would-be tyrant shrinks to an equal
//   C10 veil; closing
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ACCENT, Chips, Closing, DEAD, GOAL, Panel, SCORE, Txt, Veil, addCaptions, captionClock, clamp01, lerp, win } from './shared/kit';

const CAPS = [
  'Ideas get copied too, so they face selection. But selection rewards whatever spreads, and that is not the same as whatever is true or good.',
  'An idea that offers a simple answer, a clear enemy and certainty in a crisis may spread especially well when people are frightened. That is an inference, not a law.',
  'Weimar Germany is the grim example. Between nineteen twenty-nine and nineteen thirty-two, unemployment rose from eight and a half percent to nearly thirty percent.',
  'In July nineteen thirty-two, the Nazi party won thirty-seven percent of the vote, the largest seat total of any party in the Weimar years.',
  'Those ideas did not slip past selection. In that environment, they won it. So selection alone cannot be trusted to kill a bad idea.',
  'Karl Popper’s answer was to move the selection somewhere safer. An uncritical animal can be eliminated along with its dogmatic hypotheses. We can state ours, and criticize them.',
  'In his words: let our conjectures, our theories, die in our stead.',
  'Open societies build that into institutions. Free argument tests claims in public. Elections remove failed leaders without bloodshed. Divided power means no single filter controls everything.',
  'The anthropologist Richard Wrangham argues that early human groups used coalitions to kill members who were excessively violent, which selected against reactive aggression.',
  'He calls the result self-domestication, and admits the word is imperfect, since no one did the domesticating. Coalitions of equals kept down the would-be tyrant.',
  'A system built to decide which ideas may live would be the most powerful filter of all. The safer design keeps many judges, and lets ideas die in argument.',
];
const { T, DUR } = captionClock(CAPS);

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

const COLS = 7;
const ROWS = 6;
const NODES = (() => {
  const r = mulberry32(1932);
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const c = i % COLS;
    const row = Math.floor(i / COLS);
    return { x: 200 + c * 140 + (r() - 0.5) * 50, y: 200 + row * 68 + (r() - 0.5) * 30, c, row, jit: r() };
  });
})();
const EDGES: [number, number][] = (() => {
  const out: [number, number][] = [];
  const r = mulberry32(7);
  for (let i = 0; i < NODES.length; i++) {
    const { c, row } = NODES[i];
    if (c + 1 < COLS) out.push([i, i + 1]);
    if (row + 1 < ROWS) out.push([i, i + COLS]);
    if (c + 1 < COLS && row + 1 < ROWS && r() < 0.35) out.push([i, i + COLS + 1]);
  }
  return out;
})();
/** hop distance from a seed, breadth first */
function hops(seed: number): number[] {
  const d = NODES.map(() => Infinity);
  d[seed] = 0;
  const q = [seed];
  while (q.length) {
    const a = q.shift()!;
    for (const [x, y] of EDGES) {
      const b = x === a ? y : y === a ? x : -1;
      if (b >= 0 && d[b] === Infinity) {
        d[b] = d[a] + 1;
        q.push(b);
      }
    }
  }
  return d;
}
const RED_SEED = 2 * COLS + 1;
const BLUE_SEED = 3 * COLS + 5;
const RED_H = hops(RED_SEED);
const BLUE_H = hops(BLUE_SEED);
const MAX_H = Math.max(...RED_H);
const cluster = (i: number) => (NODES[i].c <= 1 ? 0 : NODES[i].c <= 4 ? 1 : 2);
const CLUSTER_DX = [-60, 0, 60];
const BRIDGES = EDGES.filter(([a, b]) => cluster(a) !== cluster(b));
const FILTER_SPOTS = [
  { x: 480, y: 250, text: 'free argument' },
  { x: 900, y: 370, text: 'elections' },
  { x: 480, y: 520, text: 'divided power' },
];

// Wrangham overlay
const TY = { x: 640, y: 360 };
const RING = Array.from({ length: 10 }, (_, k) => {
  const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
  return { x: TY.x + Math.cos(a) * 150, y: TY.y + Math.sin(a) * 150, a };
});

const RED = colors.NEGATIVE;
const BLUE = colors.ACCENT;

const CAM_GRAPH: CameraState = { x: 640, y: 380, k: 1.05 };
const CAM_WEIMAR: CameraState = { x: 760, y: 360, k: 1.0 };
const CAM_POPPER: CameraState = { x: 640, y: 340, k: 1.1 };
const CAM_TYRANT: CameraState = { x: 640, y: 360, k: 1.15 };

const PHASE_CHIPS = ['ideas are selected too', 'an inference, not a law', 'Weimar · reported figures', 'Popper', 'institutions · schematic', 'Wrangham · a contested hypothesis'];

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chipIn = tl.channel('chipIn', 0);
  const chipK = tl.channel('chipK', 0);
  const graphU = tl.channel('graphU', 0);
  const seedU = tl.channel('seedU', 0);
  const redU = tl.channel('redU', 0); // hops covered by red, 0..MAX_H+1
  const blueU = tl.channel('blueU', 0);
  const weimarU = tl.channel('weimarU', 0);
  const unempU = tl.channel('unempU', 0);
  const voteU = tl.channel('voteU', 0);
  const wonU = tl.channel('wonU', 0);
  const graphDim = tl.channel('graphDim', 0);
  const popU = tl.channel('popU', 0);
  const animalDie = tl.channel('animalDie', 0);
  const ideaDie = tl.channel('ideaDie', 0);
  const quoteU = tl.channel('quoteU', 0);
  const splitU = tl.channel('splitU', 0);
  const filterU = tl.channel('filterU', 0);
  const drainU = tl.channel('drainU', 0);
  const tyU = tl.channel('tyU', 0);
  const ringU = tl.channel('ringU', 0);
  const shrinkU = tl.channel('shrinkU', 0);
  const veil = tl.channel('veil', 0);
  const closeU = tl.channel('closeU', 0);

  addCaptions(tl, CAPS, T, DUR);

  // C0
  let t = T[0];
  tl.tween(chipIn, 1, { at: t, dur: 0.6, ease: ease.enter });
  tl.tween(graphU, 1, { at: t + 0.3, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_GRAPH, { at: t + 0.3, dur: 1.4, ease: ease.move });
  tl.tween(seedU, 1, { at: t + 2.6, dur: 0.6, ease: ease.pop });
  tl.hold(t + 3.2, 1);

  // C1 — the flood
  t = T[1];
  tl.tween(chipK, 1, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(redU, MAX_H + 1, { at: t + 0.6, dur: 6.0, ease: ease.linear });
  tl.tween(blueU, 2.2, { at: t + 0.6, dur: 6.0, ease: ease.linear });
  tl.hold(t + 6.6, 0.8);

  // C2 — Weimar unemployment
  t = T[2];
  tl.tween(chipK, 2, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(graphDim, 0.6, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_WEIMAR, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(weimarU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(unempU, 1, { at: t + 2.6, dur: 3.0, ease: ease.move });
  tl.hold(t + 5.6, 1);

  // C3 — the vote
  t = T[3];
  tl.tween(voteU, 1, { at: t + 0.4, dur: 2.0, ease: ease.move });
  tl.hold(t + 2.4, 1);

  // C4 — they won it
  t = T[4];
  tl.tween(wonU, 1, { at: t + 1.0, dur: 0.7, ease: ease.pop });
  tl.hold(t + 1.7, 1);

  // C5 — Popper: the animal and the person
  t = T[5];
  tl.tween(chipK, 3, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(weimarU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(wonU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(graphDim, 0.92, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_POPPER, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(popU, 1, { at: t + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(animalDie, 1, { at: t + 3.8, dur: 1.4, ease: ease.move });
  tl.tween(ideaDie, 1, { at: t + 7.2, dur: 1.4, ease: ease.move });
  tl.hold(t + 8.6, 0.8);

  // C6 — the quote
  t = T[6];
  tl.tween(quoteU, 1, { at: t + 0.2, dur: 0.9, ease: ease.enter });
  tl.hold(t + 1.1, 1);

  // C7 — institutions
  t = T[7];
  tl.tween(chipK, 4, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(quoteU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(popU, 0, { at: t, dur: 0.6, ease: ease.move });
  tl.tween(graphDim, 0, { at: t + 0.3, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_GRAPH, { at: t, dur: 1.2, ease: ease.move });
  tl.tween(splitU, 1, { at: t + 1.0, dur: 1.4, ease: ease.move });
  tl.tween(filterU, 3, { at: t + 2.6, dur: 6.0, ease: ease.linear });
  tl.tween(drainU, 1, { at: t + 6.0, dur: 4.0, ease: ease.move });
  tl.hold(t + 10.0, 0.6);

  // C8 — Wrangham: the coalition gathers
  t = T[8];
  tl.tween(chipK, 5, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(graphDim, 0.92, { at: t, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_TYRANT, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(tyU, 1, { at: t + 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(ringU, 1, { at: t + 2.8, dur: 3.0, ease: ease.move });
  tl.hold(t + 5.8, 1);

  // C9 — the ring closes
  t = T[9];
  tl.tween(shrinkU, 1, { at: t + 2.4, dur: 2.4, ease: ease.move });
  tl.hold(t + 4.8, 1);

  // C10 — closing
  t = T[10];
  tl.tween(chipIn, 0, { at: t, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: t, dur: 1.3, ease: ease.move });
  tl.tween(veil, 1, { at: t + 0.4, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 1.6, dur: 0.8, ease: ease.enter });
  tl.hold(T[10] + DUR[10], 0.6);

  return {
    tl, cam, chipIn, chipK, graphU, seedU, redU, blueU, weimarU, unempU, voteU, wonU, graphDim, popU, animalDie, ideaDie,
    quoteU, splitU, filterU, drainU, tyU, ringU, shrinkU, veil, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Bar({ x, y, w, label, value, max, shown, color, fmt }: { x: number; y: number; w: number; label: string; value: number; max: number; shown: number; color: string; fmt: string }) {
  return (
    <g>
      <text x={x} y={y - 10} fontSize={16} fill={colors.TEXT}>
        {label}
      </text>
      <rect x={x} y={y} width={w} height={22} rx={6} fill={colors.GRID} opacity={0.5} />
      <rect x={x} y={y} width={(w * value * shown) / max} height={22} rx={6} fill={color} />
      <text x={x + (w * value * shown) / max + 10} y={y + 17} fontSize={17} fill={color} fontWeight={650} opacity={win(shown, 0.6, 1)}>
        {fmt}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>) => s.get(ch);
  const cam = s.get(scene.cam);
  const graphOp = v(scene.graphU) * (1 - v(scene.graphDim));
  const redU = v(scene.redU);
  const blueU = v(scene.blueU);
  const split = v(scene.splitU);
  const drain = v(scene.drainU);
  const filterU = v(scene.filterU);
  const pos = (i: number) => ({ x: NODES[i].x + CLUSTER_DX[cluster(i)] * split, y: NODES[i].y });
  // red after the split is held to its own cluster and drains as argument does its work
  const redOf = (i: number) => {
    if (BLUE_H[i] <= 1) return 0; // the careful idea holds its own small neighbourhood
    const base = clamp01(redU - RED_H[i] - NODES[i].jit * 0.4);
    if (split < 0.01) return base;
    const contained = cluster(i) === cluster(RED_SEED) ? 1 : 0;
    return base * lerp(1, contained * (1 - 0.75 * drain), split);
  };
  const blueOf = (i: number) => clamp01(blueU - BLUE_H[i]) * (1 - redOf(i) * 0.9);

  return (
    <>
      <Camera {...cam}>
        {/* ================= the graph ================= */}
        {graphOp > 0.01 && (
          <g opacity={graphOp}>
            {EDGES.map(([a, b], k) => {
              const A = pos(a);
              const B = pos(b);
              const bridge = cluster(a) !== cluster(b);
              return <line key={k} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={colors.GRID} strokeWidth={1.4} opacity={bridge ? 1 - 0.7 * split : 1} strokeDasharray={bridge && split > 0.3 ? '4 5' : undefined} />;
            })}
            {NODES.map((n, i) => {
              const p = pos(i);
              const r = redOf(i);
              const b = blueOf(i);
              const fill = r > 0.5 ? RED : b > 0.5 ? BLUE : colors.MUTED;
              return (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r={13} fill={colors.PANEL} stroke={fill} strokeWidth={2.4} />
                  <circle cx={p.x} cy={p.y} r={8 * Math.max(r, b)} fill={fill} />
                </g>
              );
            })}
            {v(scene.seedU) > 0.01 && (
              <g opacity={v(scene.seedU) * (1 - split)}>
                <Txt x={NODES[RED_SEED].x} y={NODES[RED_SEED].y - 24} text="simple answer · clear enemy" size={15} anchor="middle" color={RED} />
                <Txt x={NODES[BLUE_SEED].x} y={NODES[BLUE_SEED].y - 24} text="careful · uncertain" size={15} anchor="middle" color={BLUE} />
              </g>
            )}
            {/* filters on the bridges */}
            {split > 0.01 &&
              FILTER_SPOTS.map((f, k) => {
                const u = clamp01(filterU - k);
                if (u <= 0.01) return null;
                return (
                  <g key={k} opacity={u}>
                    <rect x={f.x - 78} y={f.y - 17} width={156} height={34} rx={8} fill={colors.BG} stroke={GOAL} strokeWidth={1.6} />
                    <Txt x={f.x} y={f.y + 6} text={f.text} size={16} anchor="middle" color={GOAL} />
                  </g>
                );
              })}
            {BRIDGES.length > 0 && split > 0.5 && <Txt x={640} y={600} text="ideas still cross, but they are tested on the way" size={17} anchor="middle" color={colors.MUTED} u={win(drain, 0.3, 0.7)} italic />}
          </g>
        )}

        {/* ================= Weimar ================= */}
        {v(scene.weimarU) > 0.01 && (
          <g opacity={v(scene.weimarU)}>
            <Panel x={760} y={150} w={460} h={300} opaque stroke={SCORE} />
            <Txt x={782} y={186} text="Weimar Germany" size={20} weight={650} />
            <Bar x={782} y={232} w={300} label="unemployment, 1929 → 1932" value={lerp(8.5, 30, v(scene.unempU))} max={40} shown={1} color={SCORE} fmt={v(scene.unempU) > 0.95 ? 'nearly 30%' : `${lerp(8.5, 30, v(scene.unempU)).toFixed(1)}%`} />
            <Bar x={782} y={316} w={300} label="Nazi party vote, July 1932" value={37.3} max={50} shown={v(scene.voteU)} color={RED} fmt="37.3%" />
            <Txt x={782} y={378} text="largest seat total of any Weimar party" size={15} color={colors.MUTED} u={win(v(scene.voteU), 0.7, 1)} italic />
            <Txt x={990} y={428} text="they didn’t slip past selection: they won it" size={17} anchor="middle" color={RED} weight={650} u={v(scene.wonU)} />
          </g>
        )}

        {/* ================= Popper ================= */}
        {v(scene.popU) > 0.01 && (
          <g opacity={v(scene.popU)}>
            <Panel x={220} y={160} w={380} h={300} />
            <Panel x={680} y={160} w={380} h={300} stroke={GOAL} />
            <Txt x={410} y={196} text="an uncritical animal" size={19} anchor="middle" weight={650} />
            <Txt x={870} y={196} text="a critical person" size={19} anchor="middle" weight={650} />
            {/* the animal and its hypothesis die together */}
            <g opacity={1 - 0.7 * v(scene.animalDie)} transform={`translate(0,${v(scene.animalDie) * 30})`}>
              <circle cx={380} cy={320} r={30} fill={v(scene.animalDie) > 0.5 ? DEAD : SCORE} />
              <rect x={426} y={300} width={70} height={40} rx={8} fill={colors.PANEL} stroke={v(scene.animalDie) > 0.5 ? DEAD : RED} strokeWidth={2} />
              <Txt x={461} y={326} text="idea" size={15} anchor="middle" />
            </g>
            <Txt x={410} y={420} text="eliminated together" size={16} anchor="middle" color={colors.MUTED} u={v(scene.animalDie)} italic />
            {/* the person states the idea; only the idea dies */}
            <circle cx={820} cy={320} r={30} fill={SCORE} />
            <g opacity={1 - 0.8 * v(scene.ideaDie)} transform={`translate(${v(scene.ideaDie) * 60},${v(scene.ideaDie) * 34}) rotate(${v(scene.ideaDie) * 24},921,320)`}>
              <rect x={886} y={300} width={70} height={40} rx={8} fill={colors.PANEL} stroke={RED} strokeWidth={2} />
              <Txt x={921} y={326} text="idea" size={15} anchor="middle" />
            </g>
            <Txt x={870} y={420} text="the idea dies; the person lives" size={16} anchor="middle" color={GOAL} u={v(scene.ideaDie)} italic />
          </g>
        )}
        {v(scene.quoteU) > 0.01 && (
          <g opacity={v(scene.quoteU)}>
            <Panel x={250} y={220} w={780} h={190} stroke={ACCENT} opaque />
            <Txt x={640} y={300} text="“Let our conjectures, our theories," size={34} anchor="middle" weight={650} />
            <Txt x={640} y={350} text="die in our stead!”" size={34} anchor="middle" weight={650} color={ACCENT} />
            <Txt x={640} y={392} text="Karl Popper, Natural Selection and the Emergence of Mind (1977)" size={16} anchor="middle" color={colors.MUTED} italic />
          </g>
        )}

        {/* ================= Wrangham ================= */}
        {v(scene.tyU) > 0.01 && (
          <g opacity={v(scene.tyU)}>
            <circle cx={TY.x} cy={TY.y} r={lerp(54, 14, v(scene.shrinkU))} fill={RED} opacity={0.9} />
            <Txt x={TY.x} y={TY.y + 6} text={v(scene.shrinkU) < 0.5 ? 'bully' : ''} size={17} anchor="middle" color={colors.BG} weight={700} />
            {RING.map((p, k) => {
              const u = v(scene.ringU);
              const sx = TY.x + Math.cos(p.a) * lerp(330, 150, u);
              const sy = TY.y + Math.sin(p.a) * lerp(260, 150, u) * 0.9;
              return <circle key={k} cx={sx} cy={sy} r={14} fill={GOAL} opacity={win(u, k * 0.04, k * 0.04 + 0.4)} />;
            })}
            {v(scene.ringU) > 0.6 && (
              <circle cx={TY.x} cy={TY.y} r={150} fill="none" stroke={GOAL} strokeWidth={2} strokeDasharray="6 6" opacity={win(v(scene.ringU), 0.6, 1)} />
            )}
            <Txt x={TY.x} y={TY.y - 196} text="a coalition of equals" size={19} anchor="middle" color={GOAL} weight={650} u={win(v(scene.ringU), 0.5, 1)} />
            <Txt x={TY.x} y={TY.y + 200} text="selection against reactive aggression" size={17} anchor="middle" color={colors.MUTED} u={v(scene.shrinkU)} italic />
          </g>
        )}

        <Veil u={v(scene.veil)} />
      </Camera>
      <Chips texts={PHASE_CHIPS} k={v(scene.chipK)} inU={v(scene.chipIn)} />
      <Closing text="Many judges, and ideas that die in argument." sub="not a single filter deciding what may live" u={v(scene.closeU)} />
    </>
  );
}

export const vizScene = () => scene;
