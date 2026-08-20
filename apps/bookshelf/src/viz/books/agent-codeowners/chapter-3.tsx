// Agent CODEOWNERS — chapter 3: Base SHA vs. Head SHA.
// Grounded in "Trust boundary: base SHA vs. head SHA": CODEOWNERS and every
// harness's agents/** directory are read from the PR's BASE SHA; only the code
// and diff under review are read from the HEAD SHA. A PR editing its own
// reviewer file only takes effect on a FUTURE pull request, after that edit
// has itself been reviewed and merged — never on the PR making the edit.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const BASE_ITEMS = ['CODEOWNERS', '.claude/agents/**', '.codex/agents/**', '.opencode/agents/**'];

const LANE_X = 140;
const LANE_W = 1000;
const BASE_Y = 130;
const BASE_H = 170;
const BOUNDARY_Y = 340;
const HEAD_Y = 400;
const HEAD_H = 150;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const laneU = tl.channel('laneU', 0);
  const baseItemsU = tl.channel('baseItemsU', 0);
  const headU = tl.channel('headU', 0);
  const editU = tl.channel('editU', 0);
  const attemptU = tl.channel('attemptU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const futureU = tl.channel('futureU', 0);
  const mirrorU = tl.channel('mirrorU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 5.6, text: "This is the security critical asymmetry of the whole design: two clocks, one boundary between them." });
  tl.tween(laneU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 260, k: 1.0 }, { at: 0.9, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'The ownership file, and every agent definition in every harness, are read from the base branch — the state of the repository before this pull request.' });
  tl.tween(baseItemsU, 1, { at: t - 5.8, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: BASE_Y + BASE_H / 2, k: 1.15 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.8, text: "Only the code and the diff being reviewed are read from the pull request's own head — the commit actually under review." });
  tl.tween(headU, 1, { at: t - 5.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.0 }, { at: t - 4.8, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 7.0, text: 'Say a pull request edits its own reviewer, telling the database review agent to always approve every migration from now on.' });
  tl.tween(editU, 1, { at: t - 6.2, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: HEAD_Y + HEAD_H / 2, k: 1.2 }, { at: t - 6.0, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: 'It tries to reach up into the very check that is reviewing it — but that check already loaded its configuration from the base, before this diff existed.' });
  tl.tween(attemptU, 1, { at: t - 6.0, dur: 1.6, ease: ease.linear });
  tl.tween(bounceU, 1, { at: t - 4.2, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: 640, y: BOUNDARY_Y, k: 1.1 }, { at: t - 5.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 7.0, text: 'The edit has no effect here. It only takes effect on a future pull request, after it has itself been reviewed and merged through the normal process.' });
  tl.tween(futureU, 1, { at: t - 6.2, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 900, y: 300, k: 1.0 }, { at: t - 6.0, dur: 1.5, ease: ease.move });
  tl.tween(editU, 0.25, { at: t - 6.0, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: "This isn't a new rule. The platform already resolves pull request ownership from the base branch's ownership file — the design just mirrors that." });
  tl.tween(mirrorU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 260, k: 0.95 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: 'Configuration comes from the base. Code comes from the head. That one line is what keeps a reviewer trustworthy.' });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(baseItemsU, 0.15, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(headU, 0.15, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(futureU, 0.15, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(mirrorU, 0.15, { at: t - 5.4, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 300, k: 0.9 }, { at: t - 5.0, dur: 1.5, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, laneU, baseItemsU, headU, editU, attemptU, bounceU, futureU, mirrorU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const laneU = s.get(scene.laneU);
  const baseItemsU = s.get(scene.baseItemsU);
  const headU = s.get(scene.headU);
  const editU = s.get(scene.editU);
  const attemptU = s.get(scene.attemptU);
  const bounceU = s.get(scene.bounceU);
  const futureU = s.get(scene.futureU);
  const mirrorU = s.get(scene.mirrorU);
  const closeU = s.get(scene.closeU);
  const dim = 1 - closeU;

  // attempt packet travels from the edit up toward the boundary, then bounces back down
  const rise = attemptU < 0.6 ? attemptU / 0.6 : 1;
  const fallback = attemptU >= 0.6 ? (attemptU - 0.6) / 0.4 : 0;
  const packetY = lerp(HEAD_Y + 40, BOUNDARY_Y + 6, rise) + fallback * 26;
  const packetX = 640;

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* lanes */}
      <g opacity={laneU * dim}>
        <rect x={LANE_X} y={BASE_Y} width={LANE_W} height={BASE_H} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={LANE_X + 24} y={BASE_Y + 30} fill={colors.POSITIVE} fontSize={15} fontWeight={750} fontFamily={mono}>base SHA · configuration</text>

        <path d={`M ${LANE_X} ${BOUNDARY_Y} L ${LANE_X + LANE_W} ${BOUNDARY_Y}`} stroke={colors.WARM} strokeWidth={2}
          strokeDasharray="10 6" opacity={0.7} />
        <text x={LANE_X + LANE_W - 10} y={BOUNDARY_Y - 8} textAnchor="end" fill={colors.WARM} fontSize={11} fontFamily={mono}>trust boundary</text>

        <rect x={LANE_X} y={HEAD_Y} width={LANE_W} height={HEAD_H} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
        <text x={LANE_X + 24} y={HEAD_Y + 30} fill={colors.ACCENT} fontSize={15} fontWeight={750} fontFamily={mono}>head SHA · code under review</text>
      </g>

      {/* base config items */}
      <g opacity={baseItemsU * dim}>
        {BASE_ITEMS.map((item, i) => {
          const u = clamp01(baseItemsU * 5 - i * 0.7);
          return <g key={item} opacity={u} transform={`translate(${LANE_X + 30 + i * 240} ${BASE_Y + 70})`}>
            <rect width={220} height={62} rx={12} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.4} opacity={0.9} />
            <text x={110} y={28} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>{item}</text>
            <text x={110} y={48} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={mono}>locked · pre-diff</text>
          </g>;
        })}
      </g>

      {/* head diff */}
      <g opacity={headU * dim}>
        <text x={LANE_X + 24} y={HEAD_Y + 60} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>src/components/EventStatus.tsx · migration.sql · …</text>
        <g opacity={editU}>
          <rect x={LANE_X + 24} y={HEAD_Y + 78} width={620} height={54} rx={10} fill={colors.NEGATIVE} fillOpacity={0.1} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text x={LANE_X + 40} y={HEAD_Y + 100} fill={colors.NEGATIVE} fontSize={12} fontFamily={mono}>.claude/agents/db-review.md · edited in this diff</text>
          <text x={LANE_X + 40} y={HEAD_Y + 120} fill={colors.NEGATIVE} fontSize={11} fontFamily={mono}>"always approve every migration"</text>
        </g>
      </g>

      {/* the attempt + bounce */}
      {attemptU > 0 && attemptU < 1 && <g opacity={dim}>
        <circle cx={packetX} cy={packetY} r={9} fill={colors.NEGATIVE} />
        <path d={`M ${packetX} ${HEAD_Y + 40} L ${packetX} ${packetY}`} stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="3 4" opacity={0.5} />
      </g>}
      {bounceU > 0 && <g opacity={bounceU * dim}>
        <text x={packetX} y={BOUNDARY_Y - 16} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={800}>✕ no effect on this PR</text>
      </g>}

      {/* future PR ghost card */}
      {futureU > 0 && <g opacity={futureU * dim} transform={`translate(${840 - 840} 0)`}>
        <g transform="translate(80 500)" opacity={futureU}>
          <rect width={1040} height={90} rx={16} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="6 5" />
          <text x={24} y={30} fill={colors.MUTED} fontSize={12} fontFamily={mono}>a later pull request, after this edit merges</text>
          <text x={24} y={56} fill={colors.POSITIVE} fontSize={13} fontFamily={mono}>its own base SHA now includes the edited db-review.md</text>
          <text x={24} y={76} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>only then does the new instruction take effect</text>
        </g>
      </g>}

      {mirrorU > 0 && <text x={640} y={90} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={mono} opacity={mirrorU * (1 - closeU)}>
        GitHub already resolves CODEOWNERS from the base branch — this mirrors that
      </text>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={230} y={250} width={820} height={180} rx={26} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
        <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={800}>configuration is base · code is head</text>
        <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={mono}>a PR cannot redefine the reviewer that is judging it</text>
        <text x={640} y={392} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={mono}>the edit only applies to future pull requests</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
