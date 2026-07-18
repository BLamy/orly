// arXiv:2607.09711 — "EvoClawBench" — Chapter 4: the failure modes and the
// bill. Mechanisms the paper reports: (1) runtime dependence — scaffolding
// changes the regime more than skills do; (2) over-specification — first-run
// evidence bakes incidental assumptions into skills that misroute a fresh
// execution; (3) skill count irrelevance — 21–26 authored skills with scores
// stuck at 15–19%. Costs: skill workflows consume 2.5–5x baseline tokens
// (token-efficiency ratios 0.21–0.40); on the hybrid subset neither workflow
// breaks even on tokens or provider cost; wall-clock breaks even only after
// 14 (PreSkill) or 9 (PostSkill) repeated executions.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
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

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const MODES3 = [
  {
    name: 'runtime dependence',
    detail: 'same model: 96% in one scaffold, under 20% in the other',
    sub: 'the harness sets the regime; skills only perturb it',
  },
  {
    name: 'over-specification',
    detail: 'first-run evidence bakes fixture assumptions into the skill',
    sub: 'the skill routes attention wrong in the fresh workspace',
  },
  {
    name: 'skill count irrelevance',
    detail: '21–26 authored skills · scores stuck at 15–19%',
    sub: 'writing more skills is not learning more',
  },
];

// cost bars: token multiplier vs baseline (1/efficiency: 2.5–5x)
const COSTS = [
  { label: 'baseline run', mult: 1.0 },
  { label: 'author-first workflow', mult: 2.6 }, // 1/0.38
  { label: 'learn-from-run workflow', mult: 3.9 }, // ~1/0.26
];

const CAM_MODES: CameraState = { x: 420, y: 320, k: 1.25 };
const CAM_COST: CameraState = { x: 880, y: 380, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  modesU: ChannelRef<number>;
  costU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  breakU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const modesU = tl.channel('modesU', 0);
  const costU = tl.channel('costU', 0);
  const fillU = tl.channel('fillU', 0);
  const breakU = tl.channel('breakU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — mechanism 1
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Why does the same loop compound for one agent and detonate another? The paper finds three mechanisms. First, the runtime. The scaffolding around the model — prompt wrapping, workspace setup, tool plumbing — sets the whole regime.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_MODES, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(modesU, 0.34, { at: 1.6, dur: 1.4, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — mechanism 2
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Second, over specification — the mechanism our toy agent showed. Evidence from a single run is full of incidental truths, and a skill that memorizes them routes the fresh execution into walls. The skill does not just fail to help; it actively misleads.',
  });
  tl.tween(modesU, 0.67, { at: 7.8, dur: 1.4, ease: ease.enter });
  tl.hold(12.6, 0.7);

  // Beat 3 — mechanism 3
  tl.caption({
    at: 13.3,
    dur: 5.4,
    text: 'Third, volume is a decoy. Agents on the weak runtime authored twenty something skills per suite — and stayed under twenty percent. Skill counts do not predict gains anywhere in the data. Writing more is not learning more.',
  });
  tl.tween(modesU, 1, { at: 14.3, dur: 1.4, ease: ease.enter });
  tl.hold(18.7, 0.7);

  // Beat 4 — the bill
  tl.caption({
    at: 19.4,
    dur: 5.8,
    text: 'Now the bill. Skill workflows burn two and a half to five times the tokens of just solving the task — you pay for the authoring run, the evidence digest, and the re-execution.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.6, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_COST, { at: 21.1, dur: 1.2, ease: ease.move });
  tl.tween(costU, 1, { at: 20.6, dur: 1.2, ease: ease.enter });
  tl.tween(fillU, 1, { at: 21.8, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 25.7,
    dur: 5.8,
    text: 'And amortization is slow. On the subset where it can be computed, neither workflow ever breaks even on tokens or provider cost. Wall clock time breaks even only after nine to fourteen repeated executions of the same task.',
  });
  tl.tween(breakU, 1, { at: 27.0, dur: 1.0, ease: ease.enter });
  tl.hold(31.5, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 32.2,
    dur: 5.6,
    text: 'So a skill has to clear two bars at once: be general enough to survive transfer, and be reused often enough to pay for its own creation. Most skills in this benchmark cleared neither.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.4, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 33.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 34.3, dur: 1.0, ease: ease.enter });
  tl.hold(37.8, 1.2);

  return { tl, cam, titleU, modesU, costU, fillU, breakU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/evoclaw-failures/overrides.json',
  slug: 'evoclaw-failures',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const modesU = s.get(scene.modesU);
  const costU = s.get(scene.costU);
  const fillU = s.get(scene.fillU);
  const breakU = s.get(scene.breakU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* three failure mechanism cards */}
          {MODES3.map((m, i) => {
            const u = clamp01(modesU * MODES3.length - i);
            if (u <= 0) return null;
            const y = 150 + i * 140;
            return (
              <g key={m.name} opacity={u}>
                <rect x={130} y={y} width={560} height={118} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} />
                <text x={154} y={y + 32} fill={colors.NEGATIVE} fontSize={16} fontWeight={600}>
                  {i + 1} · {m.name}
                </text>
                <text x={154} y={y + 62} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                  {m.detail}
                </text>
                <text x={154} y={y + 90} fill={colors.MUTED} fontSize={13}>
                  {m.sub}
                </text>
              </g>
            );
          })}

          {/* the bill */}
          {costU > 0 && (
            <g opacity={costU}>
              <text x={760} y={220} fill={colors.TEXT} fontSize={16}>
                the token bill · reported ratios
              </text>
              <text x={760} y={240} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                efficiency 0.21–0.40 → 2.5–5x baseline tokens
              </text>
              {COSTS.map((c, i) => {
                const w = (c.mult / 5) * 380 * fillU;
                const y = 268 + i * 58;
                return (
                  <g key={c.label}>
                    <text x={760} y={y + 12} fill={colors.TEXT} fontSize={13}>
                      {c.label}
                    </text>
                    <rect x={760} y={y + 20} width={Math.max(w, 3)} height={16} rx={4}
                      fill={i === 0 ? colors.MUTED : colors.WARM} opacity={0.75} />
                    <text x={770 + w} y={y + 33} fill={i === 0 ? colors.MUTED : colors.WARM} fontSize={12} fontFamily={MONO} opacity={fillU}>
                      {c.mult.toFixed(1)}x
                    </text>
                  </g>
                );
              })}
              {breakU > 0 && (
                <g opacity={breakU}>
                  <rect x={760} y={452} width={430} height={78} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
                  <text x={780} y={482} fill={colors.WARM} fontSize={14} fontWeight={600}>
                    break-even (reported)
                  </text>
                  <text x={780} y={508} fill={colors.TEXT} fontSize={13}>
                    tokens and cost: never · wall-clock: 9–14 repeats
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          How the loop fails, and what it bills
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.09711 · failure modes · costs
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Two bars: survive transfer, and amortize
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a skill must generalize past its own birth run, and be reused
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            enough times to repay 2.5–5x tokens — most cleared neither
          </text>
        </g>
      )}
    </>
  );
}

export function EvoclawFailures() {
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
