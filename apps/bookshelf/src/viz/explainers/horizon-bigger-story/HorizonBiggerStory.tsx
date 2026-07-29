// arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters" (Agents-A1).
// Chapter 5: the close. What the result does to the "bigger is the only way"
// story: capability becomes a region reachable along two axes — parameters
// OR harnessed horizon — with the paper's own limits marking where the
// second axis runs out (coherence over long ML-engineering runs; planning,
// reflection, long-context summarizing named as future work). Recap beat
// retraces the book: axes → solution tree → teachers/distillation → ledger.
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

// ---------------------------------------------------------------------------
// The capability contour: an iso-capability curve in (horizon, params) space.
// Drawn as a hyperbola-like frontier — points on the curve reach the same
// task performance. Conceptual illustration (labeled as such), anchored by
// the paper's two real endpoints: 1T-class short-horizon vs 35B at 45K.
// ---------------------------------------------------------------------------

const AX_X = 190;
const AX_Y = 500;
const AX_W = 520;
const AX_H = 340;

// frontier samples: x = horizon (0..1 of axis), y = params (0..1 of axis)
const FRONTIER = Array.from({ length: 81 }, (_, i) => {
  const x = 0.08 + (i / 80) * 0.86;
  const y = Math.min(1, 0.055 / x); // xy = const, clamped
  return { x, y };
});
const F_PATH = FRONTIER.map((p, i) =>
  `${i === 0 ? 'M' : 'L'}${(AX_X + p.x * AX_W).toFixed(1)},${(AX_Y - p.y * AX_H).toFixed(1)}`
).join(' ');

const P_BIG = { x: AX_X + 0.1 * AX_W, y: AX_Y - Math.min(1, 0.055 / 0.1) * AX_H };
const P_SMALL = { x: AX_X + 0.9 * AX_W, y: AX_Y - (0.055 / 0.9) * AX_H };

const JOURNEY = [
  'ch1 · two axes, one scoreboard',
  'ch2 · the solution tree — search with receipts',
  'ch3 · six teachers distilled into one 35B student',
  'ch4 · the honest ledger: wins, losses, arithmetic',
];

const CAM_CHART: CameraState = { x: AX_X + AX_W / 2 + 40, y: 330, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  bigU: ChannelRef<number>;
  smallU: ChannelRef<number>;
  slideU: ChannelRef<number>; // dot slides along frontier
  edgeU: ChannelRef<number>; // where the axis runs out
  journeyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const axesU = tl.channel('axesU', 0);
  const curveU = tl.channel('curveU', 0);
  const bigU = tl.channel('bigU', 0);
  const smallU = tl.channel('smallU', 0);
  const slideU = tl.channel('slideU', 0);
  const edgeU = tl.channel('edgeU', 0);
  const journeyU = tl.channel('journeyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the old story
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'The old story drew capability as a ladder with one rail: parameters. You climbed by buying weights, and there was exactly one place to stand at every level.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CHART, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(bigU, 1, { at: 3.6, dur: 0.8, ease: ease.pop });
  tl.hold(5.7, 0.7);

  // Beat 2 — the frontier
  tl.caption({
    at: 6.4,
    dur: 5.8,
    text: 'This paper redraws it as a frontier. The same task performance is a curve, not a point — and you can walk along it, trading weights for harnessed horizon. This sketch is conceptual; the two endpoints are real.',
  });
  tl.tween(curveU, 1, { at: 7.2, dur: 1.6, ease: ease.draw });
  tl.tween(smallU, 1, { at: 9.4, dur: 0.8, ease: ease.pop });
  tl.tween(slideU, 1, { at: 10.4, dur: 1.6, ease: ease.move });
  tl.hold(12.2, 0.7);

  // Beat 3 — what it changes
  tl.caption({
    at: 12.9,
    dur: 6.0,
    text: 'That changes who gets to play. A trillion parameter model is a data center purchase. A thirty five billion parameter agent with a good harness is a lab budget. If the frontier is real, agency stops being gated on capital.',
  });
  tl.hold(18.9, 0.7);

  // Beat 4 — but the frontier bends back
  tl.caption({
    at: 19.6,
    dur: 6.0,
    text: 'But keep chapter four in your pocket: the curve is not flat forever. Push the horizon far enough and coherence starts leaking — stable goals, remembered decisions, unrepeated trials. Past that point, weights still buy what retries cannot.',
  });
  tl.tween(edgeU, 1, { at: 21.0, dur: 1.2, ease: ease.move });
  tl.hold(25.6, 0.7);

  // Beat 5 — recap
  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'Retrace the book. Two axes and a scoreboard where the small agent takes five of eight. A solution tree that turns retries plus verifiers into reliability. Six specialist teachers compressed into one student. And a ledger honest about all three losses.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 26.5, dur: 1.4, ease: ease.move });
  tl.tween(journeyU, 1, { at: 27.4, dur: 3.2, ease: ease.linear });
  tl.hold(32.3, 0.7);

  // Beat 6 — close
  tl.caption({
    at: 33.0,
    dur: 6.0,
    text: 'So bigger is no longer the only way — it is one axis of two. The interesting engineering has moved into the harness: the verifiers, the memory, the teachers. Which is exactly where this shelf keeps pointing.',
  });
  tl.tween(dimU, 1, { at: 33.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 34.3, dur: 1.0, ease: ease.enter });
  tl.hold(39.0, 1.4);

  return {
    tl, cam, titleU, axesU, curveU, bigU, smallU, slideU,
    edgeU, journeyU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/horizon-bigger-story/overrides.json',
  slug: 'horizon-bigger-story',
};

function frontierPoint(u: number): { x: number; y: number } {
  const i = Math.round(clamp01(u) * (FRONTIER.length - 1));
  const p = FRONTIER[i];
  return { x: AX_X + p.x * AX_W, y: AX_Y - p.y * AX_H };
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axesU = s.get(scene.axesU);
  const curveU = s.get(scene.curveU);
  const bigU = s.get(scene.bigU);
  const smallU = s.get(scene.smallU);
  const slideU = s.get(scene.slideU);
  const edgeU = s.get(scene.edgeU);
  const journeyU = s.get(scene.journeyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const walker = frontierPoint(slideU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* axes */}
          {axesU > 0 && (
            <g opacity={axesU * (1 - 0.8 * journeyU)}>
              <line x1={AX_X} y1={AX_Y} x2={AX_X} y2={AX_Y - AX_H * axesU} stroke={colors.GRID} strokeWidth={2} />
              <line x1={AX_X} y1={AX_Y} x2={AX_X + AX_W * axesU} y2={AX_Y} stroke={colors.GRID} strokeWidth={2} />
              <text x={AX_X - 20} y={AX_Y - AX_H - 14} fill={colors.MUTED} fontSize={13}>
                parameters
              </text>
              <text x={AX_X + AX_W - 40} y={AX_Y + 24} fill={colors.MUTED} fontSize={13}>
                harnessed horizon
              </text>
              <text x={AX_X + 180} y={AX_Y - AX_H + 6} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
                iso-capability frontier — conceptual sketch; endpoints reported
              </text>

              {/* frontier */}
              {curveU > 0 && (
                <path d={F_PATH} fill="none" stroke={colors.ACCENT} strokeWidth={3}
                  strokeDasharray={`${1400 * clamp01(curveU)} 1400`} opacity={0.9} />
              )}

              {/* endpoints */}
              {bigU > 0 && (
                <g opacity={bigU}>
                  <circle cx={P_BIG.x} cy={P_BIG.y} r={10} fill={colors.NEGATIVE} />
                  <text x={P_BIG.x + 18} y={P_BIG.y - 6} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                    ~1T weights, short runs
                  </text>
                </g>
              )}
              {smallU > 0 && (
                <g opacity={smallU}>
                  <circle cx={P_SMALL.x} cy={P_SMALL.y} r={10} fill={colors.POSITIVE} />
                  <text x={P_SMALL.x - 12} y={P_SMALL.y - 16} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                    Agents-A1 · 35B, 45K-token runs
                  </text>
                </g>
              )}
              {slideU > 0 && slideU < 1 && (
                <circle cx={walker.x} cy={walker.y} r={7} fill={colors.WARM} opacity={0.9} />
              )}

              {/* where the axis runs out */}
              {edgeU > 0 && (
                <g opacity={edgeU}>
                  <rect x={AX_X + AX_W * 0.82} y={AX_Y - AX_H} width={AX_W * 0.22} height={AX_H} fill={colors.NEGATIVE} opacity={0.07} />
                  <line x1={AX_X + AX_W * 0.82} y1={AX_Y - AX_H} x2={AX_X + AX_W * 0.82} y2={AX_Y} stroke={colors.NEGATIVE} strokeDasharray="5 5" opacity={0.5} />
                  <text x={AX_X + AX_W * 0.84} y={AX_Y - AX_H + 30} fill={colors.NEGATIVE} fontSize={12}>
                    coherence
                  </text>
                  <text x={AX_X + AX_W * 0.84} y={AX_Y - AX_H + 48} fill={colors.NEGATIVE} fontSize={12}>
                    leaks here
                  </text>
                </g>
              )}
            </g>
          )}

          {/* recap */}
          {journeyU > 0 && (
            <g opacity={journeyU}>
              {JOURNEY.map((line, i) => {
                const u = clamp01(journeyU * JOURNEY.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={370} cy={190 + i * 56} r={5} fill={colors.SECONDARY} />
                    {i < JOURNEY.length - 1 && (
                      <line x1={370} y1={196 + i * 56} x2={370} y2={240 + i * 56} stroke={colors.GRID} strokeWidth={1.5} />
                    )}
                    <text x={392} y={196 + i * 56} fill={colors.TEXT} fontSize={16}>
                      {line}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          What happens to the bigger-is-better story
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.30616
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Capability is a frontier, not a ladder
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            weights and harnessed horizon trade against each other —
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            until coherence runs out, and the paper says where that is
          </text>
          <text x={640} y={398} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Scaling the Horizon · arXiv:2606.30616
          </text>
        </g>
      )}
    </>
  );
}

export function HorizonBiggerStory() {
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
