// arXiv:2607.09711 — "EvoClawBench" — Chapter 3: the reported results,
// replotted honestly (not re-run). Nanobot runtime scores per model/mode:
//   GPT-5.4         96.13 / 96.73 / 96.17
//   MiniMax-M2.7    90.97 / 92.90 / 94.50
//   GPT-5.4 mini    88.71 / 87.41 / 89.77
//   DeepSeek-V4-Pro 77.77 /  4.80 /  0.99   ← the collapse
//   Qwen3.6-Plus    56.45 / 59.90 / 54.33
// OpenClaw runtime: all models stay below 20% in every mode (18.63–19.99
// baseline), with GPT-5.4 PostSkill collapsing to 1.14. Verdict quoted from
// the paper: skill learning is "selective and cost-sensitive, rather than an
// automatic benefit."
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

const ROWS = [
  { model: 'GPT-5.4', base: 96.13, pre: 96.73, post: 96.17 },
  { model: 'MiniMax-M2.7', base: 90.97, pre: 92.9, post: 94.5 },
  { model: 'GPT-5.4 mini', base: 88.71, pre: 87.41, post: 89.77 },
  { model: 'DeepSeek-V4-Pro', base: 77.77, pre: 4.8, post: 0.99 },
  { model: 'Qwen3.6-Plus', base: 56.45, pre: 59.9, post: 54.33 },
];

const CHART_X = 260;
const CHART_Y = 150;
const ROW_H = 84;
const BAR_MAX = 700;
const BAR_H = 16;

const CAM_CHART: CameraState = { x: 640, y: 340, k: 1.12 };
const CAM_DEEP: CameraState = { x: 640, y: CHART_Y + 3 * ROW_H + 30, k: 1.5 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  rowsU: ChannelRef<number>;
  preU: ChannelRef<number>;
  postU: ChannelRef<number>;
  deepU: ChannelRef<number>;
  clawU: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const preU = tl.channel('preU', 0);
  const postU = tl.channel('postU', 0);
  const deepU = tl.channel('deepU', 0);
  const clawU = tl.channel('clawU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — baselines
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Here are the papers numbers on the capable runtime, replotted. First the baselines, no skills: the strongest model near ninety six percent, the weakest at fifty six. Five models, a healthy spread.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CHART, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(rowsU, 1, { at: 1.6, dur: 3.0, ease: ease.linear });
  tl.hold(5.9, 0.7);

  // Beat 2 — add the skill modes
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Now add the skill modes. Authoring skills up front, and learning them from your own run. For most models the bars barely move — a point up here, a point down there. The loop is mostly a wash.',
  });
  tl.tween(preU, 1, { at: 7.6, dur: 2.0, ease: ease.move });
  tl.tween(postU, 1, { at: 9.8, dur: 2.0, ease: ease.move });
  tl.caption({
    at: 12.9,
    dur: 4.6,
    text: 'One model bucks the trend upward: it gains three and a half points from learning off its own evidence — the compounding dream, measured, but small.',
  });
  tl.hold(17.5, 0.7);

  // Beat 3 — the collapse
  tl.caption({
    at: 18.2,
    dur: 6.0,
    text: 'And one model detonates. From seventy eight percent with no skills — to under five when forced to author skills first, and under one percent when learning from its own runs. Its own skills reduced it to noise.',
  });
  tl.tween(cam, CAM_DEEP, { at: 18.5, dur: 1.5, ease: ease.move });
  tl.tween(deepU, 1, { at: 19.6, dur: 1.2, ease: ease.move });
  tl.hold(24.2, 0.7);

  // Beat 4 — the runtime story
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'And the second runtime tells an uglier story: under its scaffolding, every model — including the ninety six percent one — stays below twenty percent in every mode. The harness around the agent moved the numbers more than any skill did.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 25.1, dur: 1.4, ease: ease.move });
  tl.tween(clawU, 1, { at: 26.4, dur: 1.0, ease: ease.enter });
  tl.hold(30.7, 0.7);

  // Beat 5 — the verdict
  tl.caption({
    at: 31.4,
    dur: 5.6,
    text: 'The papers verdict, in its own words: learning reusable skills from your own runs is selective and cost sensitive — not an automatic benefit. Whether the loop compounds depends on who is looping, and inside what.',
  });
  tl.tween(verdictU, 1, { at: 32.6, dur: 0.9, ease: ease.enter });
  tl.hold(37.0, 0.7);

  // Beat 6 — close
  tl.caption({
    at: 37.7,
    dur: 4.6,
    text: 'Same tasks, same skill format, same freeze rules. The spread from under one percent to ninety six is the finding. Next: the mechanisms behind the failures.',
  });
  tl.tween(dimU, 1, { at: 38.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 38.9, dur: 1.0, ease: ease.enter });
  tl.hold(42.3, 1.2);

  return { tl, cam, titleU, rowsU, preU, postU, deepU, clawU, verdictU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/evoclaw-results/overrides.json',
  slug: 'evoclaw-results',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const rowsU = s.get(scene.rowsU);
  const preU = s.get(scene.preU);
  const postU = s.get(scene.postU);
  const deepU = s.get(scene.deepU);
  const clawU = s.get(scene.clawU);
  const verdictU = s.get(scene.verdictU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <text x={CHART_X} y={CHART_Y - 40} fill={colors.TEXT} fontSize={16} opacity={rowsU}>
            nanobot runtime · % sub-problems passed
          </text>
          <text x={CHART_X + 420} y={CHART_Y - 40} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={rowsU}>
            reported — replotted, not re-run
          </text>
          {/* legend */}
          {preU > 0 && (
            <g opacity={Math.max(preU, postU)}>
              <rect x={CHART_X} y={CHART_Y - 26} width={12} height={12} fill={colors.MUTED} opacity={0.55} />
              <text x={CHART_X + 18} y={CHART_Y - 16} fill={colors.MUTED} fontSize={11}>baseline</text>
              <rect x={CHART_X + 90} y={CHART_Y - 26} width={12} height={12} fill={colors.SECONDARY} opacity={0.75} />
              <text x={CHART_X + 108} y={CHART_Y - 16} fill={colors.MUTED} fontSize={11}>author-first</text>
              <rect x={CHART_X + 200} y={CHART_Y - 26} width={12} height={12} fill={colors.ACCENT} opacity={0.85} />
              <text x={CHART_X + 218} y={CHART_Y - 16} fill={colors.MUTED} fontSize={11}>learn-from-run</text>
            </g>
          )}

          {ROWS.map((r, i) => {
            const u = clamp01(rowsU * ROWS.length - i);
            if (u <= 0) return null;
            const y = CHART_Y + i * ROW_H;
            const isDeep = r.model === 'DeepSeek-V4-Pro';
            const wBase = (r.base / 100) * BAR_MAX;
            const wPre = (r.pre / 100) * BAR_MAX * preU;
            const wPost = (r.post / 100) * BAR_MAX * postU;
            return (
              <g key={r.model} opacity={u}>
                <text x={CHART_X - 14} y={y + 22} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                  {r.model}
                </text>
                <rect x={CHART_X} y={y} width={wBase} height={BAR_H} rx={3} fill={colors.MUTED} opacity={0.55} />
                <text x={CHART_X + wBase + 8} y={y + 13} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                  {r.base.toFixed(2)}
                </text>
                {preU > 0 && (
                  <g opacity={preU}>
                    <rect x={CHART_X} y={y + 20} width={Math.max(wPre, 2)} height={BAR_H} rx={3}
                      fill={isDeep && deepU > 0 ? colors.NEGATIVE : colors.SECONDARY} opacity={0.75} />
                    <text x={CHART_X + Math.max(wPre, 2) + 8} y={y + 33} fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>
                      {r.pre.toFixed(2)}
                    </text>
                  </g>
                )}
                {postU > 0 && (
                  <g opacity={postU}>
                    <rect x={CHART_X} y={y + 40} width={Math.max(wPost, 2)} height={BAR_H} rx={3}
                      fill={isDeep && deepU > 0 ? colors.NEGATIVE : colors.ACCENT} opacity={0.85} />
                    <text x={CHART_X + Math.max(wPost, 2) + 8} y={y + 53} fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
                      {r.post.toFixed(2)}
                    </text>
                  </g>
                )}
                {isDeep && deepU > 0 && (
                  <text x={CHART_X + 320} y={y + 36} fill={colors.NEGATIVE} fontSize={14} fontWeight={600} opacity={deepU}>
                    ← its own skills reduced it to noise
                  </text>
                )}
              </g>
            );
          })}

          {/* OpenClaw strip */}
          {clawU > 0 && (
            <g opacity={clawU}>
              <rect x={CHART_X} y={CHART_Y + 5 * ROW_H + 6} width={BAR_MAX} height={40} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={CHART_X} y={CHART_Y + 5 * ROW_H + 6} width={(20 / 100) * BAR_MAX} height={40} rx={8} fill={colors.NEGATIVE} opacity={0.18} />
              <text x={CHART_X + 16} y={CHART_Y + 5 * ROW_H + 31} fill={colors.TEXT} fontSize={13}>
                OpenClaw runtime: every model, every mode — below 20% (GPT-5.4 PostSkill: 1.14)
              </text>
            </g>
          )}

          {/* verdict */}
          {verdictU > 0 && (
            <g opacity={verdictU}>
              <rect x={CHART_X + 180} y={CHART_Y + 5 * ROW_H + 60} width={560} height={40} rx={10} fill={colors.WARM} opacity={0.12} />
              <text x={CHART_X + 460} y={CHART_Y + 5 * ROW_H + 86} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={600}>
                “selective and cost-sensitive, rather than an automatic benefit”
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The measured answer
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.09711 · results
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            From 0.99 to 96.73 — on the same benchmark
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            one model gains from its own runs, one detonates, most tread water,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and the runtime scaffolding outweighs the skills entirely
          </text>
        </g>
      )}
    </>
  );
}

export function EvoclawResults() {
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
