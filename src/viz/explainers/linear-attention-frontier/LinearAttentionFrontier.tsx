// arXiv:2605.22791 — "Gated DeltaNet-2", chapter 5: where this line is going.
// A closing map of the 2026 linear-attention frontier: DeltaNet (the delta
// rule) -> Gated DeltaNet (scalar gate + decay) -> Kimi Delta Attention
// (channel-wise decay) -> Gated DeltaNet-2 (decoupled channel-wise erase and
// write). The bars are the PAPER'S reported numbers (Tables 2-4, 1.3B-param
// recurrent models trained on 100B tokens) — recreated as published results,
// labeled as such on screen, not re-measured here:
//   WikiText perplexity:  Gated DeltaNet 16.40 · KDA 16.81 · GDN-2 15.90
//   RULER S-NIAH-2 @ 4K:  Mamba-2 62.6 · Gated DeltaNet 87.2 · GDN-2 93.0
//   RULER MK-NIAH-1 @ 4K: Mamba-2 21.4 · Gated DeltaNet 27.8 · GDN-2 37.8
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The lineage and the published numbers (module scope, verbatim from the paper)
// ---------------------------------------------------------------------------

interface Node {
  x: number;
  y: number;
  name: string;
  sub: string;
  tex: string;
  color: string;
}

const LINEAGE: Node[] = [
  {
    x: 190,
    y: 250,
    name: 'delta net',
    sub: 'the delta rule',
    tex: 'S_t = (I - \\beta_t k_t k_t^{\\top}) S_{t-1} + \\beta_t k_t v_t^{\\top}',
    color: colors.MUTED,
  },
  {
    x: 480,
    y: 250,
    name: 'gated delta net',
    sub: 'scalar gate + decay',
    tex: '\\alpha_t\\,(\\cdot)',
    color: colors.ACCENT,
  },
  {
    x: 770,
    y: 250,
    name: 'kimi delta attention',
    sub: 'channel-wise decay',
    tex: 'D_t = \\mathrm{Diag}(\\alpha_t)',
    color: colors.SECONDARY,
  },
  {
    x: 1060,
    y: 250,
    name: 'gated delta net two',
    sub: 'decoupled erase / write',
    tex: 'b_t \\odot \\;\\; w_t \\odot',
    color: colors.POSITIVE,
  },
];

interface BarGroup {
  title: string;
  note: string;
  higherBetter: boolean;
  max: number;
  rows: { label: string; v: number; color: string }[];
}

const GROUPS: BarGroup[] = [
  {
    title: 'perplexity, lower is better',
    note: 'WikiText · Table 2',
    higherBetter: false,
    max: 18,
    rows: [
      { label: 'kimi delta attention', v: 16.81, color: colors.SECONDARY },
      { label: 'gated delta net', v: 16.4, color: colors.ACCENT },
      { label: 'gated delta net two', v: 15.9, color: colors.POSITIVE },
    ],
  },
  {
    title: 'single needle retrieval, percent',
    note: 'RULER S-NIAH-2 @ 4K · Table 3',
    higherBetter: true,
    max: 100,
    rows: [
      { label: 'mamba two', v: 62.6, color: colors.MUTED },
      { label: 'gated delta net', v: 87.2, color: colors.ACCENT },
      { label: 'gated delta net two', v: 93.0, color: colors.POSITIVE },
    ],
  },
  {
    title: 'multi key retrieval, percent',
    note: 'RULER MK-NIAH-1 @ 4K · Table 3',
    higherBetter: true,
    max: 100,
    rows: [
      { label: 'mamba two', v: 21.4, color: colors.MUTED },
      { label: 'gated delta net', v: 27.8, color: colors.ACCENT },
      { label: 'gated delta net two', v: 37.8, color: colors.POSITIVE },
    ],
  },
];

const GROUP_X = [120, 520, 880];
const GROUP_Y = 420;
const BAR_W_MAX = 260;
const ROW_H = 44;

const CAM_RAIL: CameraState = { x: 640, y: 260, k: 1.15 };
const CAM_LAST: CameraState = { x: 1000, y: 260, k: 1.35 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  nodeU: ChannelRef<number>[];
  railU: ChannelRef<number>;
  barsU: ChannelRef<number>[];
  fillU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const railU = tl.channel('railU', 0);
  const nodeU = LINEAGE.map((_, i) => tl.channel(`node${i}U`, 0));
  const barsU = GROUPS.map((_, i) => tl.channel(`bars${i}U`, 0));
  const fillU = tl.channel('fillU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the lineage rail
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Step back and the paper stops being an isolated trick. It is the latest move in a line of work that has been adding one control at a time.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_RAIL, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 1.0, dur: 2.4, ease: ease.draw });
  tl.tween(nodeU[0], 1, { at: 1.2, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 5.8,
    text: 'The delta net line started with the delta rule itself: write only the error. Gating added a scalar forget knob. Kimi delta attention made the decay channel-wise.',
  });
  tl.tween(nodeU[1], 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(nodeU[2], 1, { at: 9.6, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 12.5,
    dur: 5.2,
    text: 'And this paper finishes the set: erase and write, split into their own channel-wise gates. Every knob the update rule has is now independent.',
  });
  tl.tween(cam, CAM_LAST, { at: 12.8, dur: 1.4, ease: ease.move });
  tl.tween(nodeU[3], 1, { at: 13.2, dur: 0.7, ease: ease.enter });
  tl.hold(17.7, 0.7);

  // Beat 2 — the reported numbers
  tl.caption({
    at: 18.4,
    dur: 5.8,
    text: 'Does the extra freedom pay? Here are the numbers the authors report, at one point three billion parameters trained on one hundred billion tokens. We are replotting their tables, not re-running them.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 18.7, dur: 1.5, ease: ease.move });
  tl.tween(barsU[0], 1, { at: 20.0, dur: 0.8, ease: ease.enter });
  tl.tween(barsU[1], 1, { at: 20.5, dur: 0.8, ease: ease.enter });
  tl.tween(barsU[2], 1, { at: 21.0, dur: 0.8, ease: ease.enter });
  tl.tween(fillU, 1, { at: 21.4, dur: 2.2, ease: ease.move });
  tl.caption({
    at: 24.4,
    dur: 6.0,
    text: 'Perplexity edges down. Single needle retrieval improves. But the loudest gain is exactly where the theory predicts: multi key retrieval, where competing associations fight for the same fixed state.',
  });
  tl.hold(30.4, 0.7);
  tl.caption({
    at: 31.1,
    dur: 5.6,
    text: 'Keep the caveats: these are the authors evaluating their own model, at one scale, on synthetic retrieval suites. The honest claim is narrower — decoupling helps most when memory is contended.',
  });
  tl.hold(36.7, 0.6);

  // Beat 3 — where it goes
  tl.caption({
    at: 37.3,
    dur: 6.0,
    text: 'Where does the line go next? Hybrids that mix a few softmax layers into the recurrent stack, phase controlled variants of the same gates, and hardware aware kernels are all live directions this year.',
  });
  tl.tween(dimU, 1, { at: 37.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 38.8, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 43.5,
    dur: 6.0,
    text: 'The through line of this whole book is one sentence: a fixed memory is a budget, and the models that spend it best are the ones that can erase, write, and forget on separate accounts.',
  });
  tl.hold(49.5, 1.4);

  return { tl, cam, titleU, nodeU, railU, barsU, fillU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/linear-attention-frontier/overrides.json',
  slug: 'linear-attention-frontier',
};

function Bars({ g, x, u, fill }: { g: BarGroup; x: number; u: number; fill: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={x} y={GROUP_Y - 34} fill={colors.TEXT} fontSize={15}>
        {g.title}
      </text>
      <text x={x} y={GROUP_Y - 14} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
        {g.note} · reported, not re-run
      </text>
      {g.rows.map((r, i) => {
        const frac = (r.v / g.max) * fill;
        const w = Math.max(2, BAR_W_MAX * frac);
        return (
          <g key={r.label}>
            <text x={x} y={GROUP_Y + i * ROW_H + 12} fill={colors.MUTED} fontSize={12}>
              {r.label}
            </text>
            <rect x={x} y={GROUP_Y + i * ROW_H + 18} width={w} height={14} rx={4} fill={r.color} opacity={0.85} />
            <text
              x={x + w + 8}
              y={GROUP_Y + i * ROW_H + 30}
              fill={r.color}
              fontSize={13}
              fontFamily="monospace"
              opacity={fill > 0.9 ? 1 : 0}
            >
              {r.v}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const railU = s.get(scene.railU);
  const fillU = s.get(scene.fillU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the rail */}
          <line
            x1={LINEAGE[0].x}
            y1={250}
            x2={LINEAGE[0].x + (LINEAGE[3].x - LINEAGE[0].x) * railU}
            y2={250}
            stroke={colors.GRID}
            strokeWidth={3}
          />
          {LINEAGE.map((n, i) => {
            const u = s.get(scene.nodeU[i]);
            if (u <= 0) return null;
            return (
              <g key={n.name} opacity={u}>
                <circle cx={n.x} cy={n.y} r={12 * Math.min(1, u)} fill={n.color} />
                <circle cx={n.x} cy={n.y} r={19} fill="none" stroke={n.color} strokeWidth={1.5} opacity={0.5} />
                <text x={n.x} y={n.y - 44} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={600}>
                  {n.name}
                </text>
                <text x={n.x} y={n.y - 24} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  {n.sub}
                </text>
                <MathLabel tex={n.tex} x={n.x} y={n.y + 52} fontSize={13} color={n.color} opacity={u} />
              </g>
            );
          })}

          {/* the reported numbers */}
          {GROUPS.map((g, i) => (
            <Bars key={g.title} g={g} x={GROUP_X[i]} u={s.get(scene.barsU[i])} fill={fillU} />
          ))}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The 2026 linear-attention frontier
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2605.22791 · Tables 2–4 (1.3B, 100B tokens)
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={220} width={880} height={200} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            A fixed memory is a budget.
          </text>
          <text x={640} y={330} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Erase, write, and decay — spent on separate accounts,
          </text>
          <text x={640} y={354} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            channel by channel, inside one head.
          </text>
          <text x={640} y={394} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            DeltaNet → Gated DeltaNet → KDA → Gated DeltaNet-2 (arXiv:2605.22791)
          </text>
        </g>
      )}
    </>
  );
}

export function LinearAttentionFrontier() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
