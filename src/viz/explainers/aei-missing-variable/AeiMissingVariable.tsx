// SSRN 6325939 — "Adversarial Epistemic Incoherence (AEI): An Under-Modeled
// Failure Class for Advanced AI and Socio-Technical Decision Systems"
// (Jeremy B. Dixon, Independent Researcher). Chapter 1: the missing variable.
// Grounded in the paper's Abstract, §1 (Introduction), §3 (The Coherent-World
// Assumption), §4 (Aerospace Safety Culture example — Challenger/Columbia,
// citing Reason 1990; NRC 2011), and §7 (performance vs readiness).
// This is a position paper: everything here is reported as ITS claims.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — a benchmark score panel resting on three assumption pillars.
// ---------------------------------------------------------------------------
const SCORE_X = 180;
const SCORE_Y = 150;
const SCORE_W = 400;
const SCORE_H = 180;

// The three assumptions the paper says evaluation implicitly makes (§3):
// coherent objectives, coherent authority, coherent evaluators.
const PILLARS = [
  { label: 'stable objectives', x: 220 },
  { label: 'stable authority', x: 380, },
  { label: 'stable evaluators', x: 540 },
];
const PILLAR_TOP = SCORE_Y + SCORE_H + 20;
const PILLAR_H = 150;
const PILLAR_W = 110;

// Benchmark bars shown inside the score panel (illustrative — the paper has
// no benchmark numbers; these are generic "high scores under stable framing").
const BENCH = [
  { label: 'correctness', v: 0.94 },
  { label: 'helpfulness', v: 0.91 },
  { label: 'compliance', v: 0.96 },
];

const CHALL_X = 730;
const CHALL_Y = 170;
const CHALL_W = 440;

const CAM_PANEL: CameraState = { x: SCORE_X + SCORE_W / 2, y: SCORE_Y + 120, k: 1.35 };
const CAM_PILLARS: CameraState = { x: 400, y: PILLAR_TOP + 80, k: 1.3 };
const CAM_CHALL: CameraState = { x: CHALL_X + CHALL_W / 2, y: CHALL_Y + 140, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  panelU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  pillarsU: ChannelRef<number>;
  crackU: ChannelRef<number>;
  challU: ChannelRef<number>;
  challLinesU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  dotU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const panelU = tl.channel('panelU', 0);
  const barsU = tl.channel('barsU', 0);
  const pillarsU = tl.channel('pillarsU', 0);
  const crackU = tl.channel('crackU', 0);
  const challU = tl.channel('challU', 0);
  const challLinesU = tl.channel('challLinesU', 0);
  const axesU = tl.channel('axesU', 0);
  const dotU = tl.channel('dotU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the setup: a system that passes everything.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is a system that passes its evaluations. Correct, helpful, compliant — every score is green. By everything we usually measure, this system is ready to deploy.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(panelU, 1, { at: 1.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_PANEL, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.tween(barsU, 1, { at: 2.2, dur: 1.6, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — the paper's claim.
  tl.caption({
    at: 6.8,
    dur: 6.4,
    text: 'A position paper on the S S R N preprint server argues that this picture is missing a variable. Many failures blamed on weak intelligence or misalignment, it claims, come from somewhere upstream: the environment the system is deployed into.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.hold(13.2, 0.7);

  // Beat 3 — the coherent-world assumption: three pillars under the score.
  tl.caption({
    at: 13.9,
    dur: 6.2,
    text: 'Every one of those green scores rests on quiet assumptions. That the objectives stay stable. That authority stays stable. That the evaluators stay stable. The paper calls this the coherent world assumption.',
  });
  tl.tween(cam, CAM_PILLARS, { at: 14.2, dur: 1.4, ease: ease.move });
  tl.tween(pillarsU, 1, { at: 15.2, dur: 2.4, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — the pillars crack.
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'Real deployments routinely violate it. Mandates shift. Multiple principals disagree about who is in charge. Evaluation criteria move after the outcomes are visible. The scores stay green — the ground under them does not.',
  });
  tl.tween(crackU, 1, { at: 21.8, dur: 2.2, ease: ease.move });
  tl.hold(27.2, 0.7);

  // Beat 5 — the non-AI anchor: Challenger and Columbia (§4).
  tl.caption({
    at: 27.9,
    dur: 6.6,
    text: 'The paper anchors this with a case that has nothing to do with AI. Investigations of the Challenger and Columbia shuttle disasters described fragmented authority, schedule pressure, and suppressed dissent.',
  });
  tl.tween(cam, CAM_CHALL, { at: 28.2, dur: 1.4, ease: ease.move });
  tl.tween(challU, 1, { at: 29.2, dur: 0.8, ease: ease.enter });
  tl.tween(challLinesU, 1, { at: 30.0, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 34.5,
    dur: 6.2,
    text: 'The launch decisions were internally coherent at the time — formal compliance and reassuring narratives stood in for unresolved uncertainty. And refusal or delay was treated as failure. Nobody needed to be a villain.',
  });
  tl.hold(40.7, 0.7);

  // Beat 6 — performance vs readiness (camera home before the bottom reveal).
  tl.caption({
    at: 41.4,
    dur: 6.4,
    text: 'So the paper draws a hard line between two different questions. Performance asks: can the system produce the desired outputs while the framing holds still? Readiness asks: does it stay coherent when the framing stops holding still?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.6, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 42.8, dur: 1.2, ease: ease.draw });
  tl.tween(dotU, 1, { at: 44.4, dur: 1.2, ease: ease.move });
  tl.hold(47.8, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 48.5,
    dur: 6.0,
    text: 'The condition where those two answers come apart has a name in this paper: adversarial epistemic incoherence. The next chapters unpack the regime that produces it — and the eight ways the paper says systems fail inside it.',
  });
  tl.tween(dimU, 1, { at: 48.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 49.8, dur: 1.0, ease: ease.enter });
  tl.hold(54.5, 1.2);

  return {
    tl, cam, titleU, panelU, barsU, pillarsU, crackU,
    challU, challLinesU, axesU, dotU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-missing-variable/overrides.json',
  slug: 'aei-missing-variable',
};

const CHALL_LINES = [
  'fragmented authority',
  'schedule pressure',
  'normalization of deviance',
  'suppressed dissent',
  'refusal treated as failure',
];

// crack polyline offsets for a pillar (deterministic zigzag)
const CRACK_PTS = [0, 8, -6, 10, -4, 7];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const panelU = s.get(scene.panelU);
  const barsU = s.get(scene.barsU);
  const pillarsU = s.get(scene.pillarsU);
  const crackU = s.get(scene.crackU);
  const challU = s.get(scene.challU);
  const challLinesU = s.get(scene.challLinesU);
  const axesU = s.get(scene.axesU);
  const dotU = s.get(scene.dotU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* benchmark score panel */}
          {panelU > 0 && (
            <g opacity={panelU}>
              <rect x={SCORE_X} y={SCORE_Y} width={SCORE_W} height={SCORE_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={SCORE_X + 18} y={SCORE_Y + 30} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                controlled evaluation — stable framing
              </text>
              {BENCH.map((b, i) => {
                const u = clamp01(barsU * BENCH.length - i);
                const y = SCORE_Y + 52 + i * 40;
                const w = (SCORE_W - 190) * b.v * u;
                return (
                  <g key={b.label}>
                    <text x={SCORE_X + 120} y={y + 15} textAnchor="end" fill={colors.MUTED} fontSize={13}>
                      {b.label}
                    </text>
                    <rect x={SCORE_X + 132} y={y} width={Math.max(w, 1)} height={20} rx={4} fill={colors.POSITIVE} opacity={0.7} />
                    <text x={SCORE_X + 138 + w} y={y + 15} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace" opacity={u}>
                      {Math.round(b.v * 100)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the three coherence pillars */}
          {PILLARS.map((p, i) => {
            const u = clamp01(pillarsU * PILLARS.length - i);
            if (u <= 0) return null;
            const cx = p.x;
            const shear = crackU * (i - 1) * 14; // pillars lean apart
            return (
              <g key={p.label} opacity={u} transform={`translate(${shear}, ${crackU * 8}) rotate(${crackU * (i - 1) * 4}, ${cx}, ${PILLAR_TOP + PILLAR_H})`}>
                <rect
                  x={cx - PILLAR_W / 2} y={PILLAR_TOP} width={PILLAR_W} height={PILLAR_H} rx={8}
                  fill={colors.PANEL}
                  stroke={crackU > 0.3 ? colors.NEGATIVE : colors.ACCENT}
                  strokeWidth={1.5}
                  opacity={1 - 0.3 * crackU}
                />
                <text x={cx} y={PILLAR_TOP + 34} textAnchor="middle" fill={crackU > 0.3 ? colors.NEGATIVE : colors.ACCENT} fontSize={13} fontWeight={600}>
                  {p.label.split(' ')[0]}
                </text>
                <text x={cx} y={PILLAR_TOP + 54} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                  {p.label.split(' ')[1]}
                </text>
                {/* crack */}
                {crackU > 0 && (
                  <polyline
                    points={CRACK_PTS.map((dx, k) => `${cx + dx * crackU},${PILLAR_TOP + 70 + k * (PILLAR_H - 80) / (CRACK_PTS.length - 1)}`).join(' ')}
                    fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={crackU}
                  />
                )}
              </g>
            );
          })}
          {pillarsU >= 1 && crackU > 0.4 && (
            <text x={400} y={PILLAR_TOP + PILLAR_H + 36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={(crackU - 0.4) / 0.6}>
              the coherent-world assumption, violated
            </text>
          )}

          {/* Challenger / Columbia card */}
          {challU > 0 && (
            <g opacity={challU}>
              <rect x={CHALL_X} y={CHALL_Y} width={CHALL_W} height={64 + CHALL_LINES.length * 34} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={CHALL_X + 20} y={CHALL_Y + 30} fill={colors.WARM} fontSize={15} fontWeight={600}>
                aerospace safety culture (non-AI)
              </text>
              <text x={CHALL_X + 20} y={CHALL_Y + 50} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                Challenger · Columbia — Reason 1990; NRC 2011
              </text>
              {CHALL_LINES.map((l, i) => {
                const u = clamp01(challLinesU * CHALL_LINES.length - i);
                if (u <= 0) return null;
                const y = CHALL_Y + 76 + i * 34;
                return (
                  <g key={l} opacity={u}>
                    <circle cx={CHALL_X + 30} cy={y} r={4} fill={colors.WARM} />
                    <text x={CHALL_X + 46} y={y + 5} fill={colors.TEXT} fontSize={14}>
                      {l}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* performance vs readiness axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <g transform="translate(760, 470)">
                <line x1={0} y1={120} x2={380 * axesU} y2={120} stroke={colors.GRID} strokeWidth={1.5} />
                <line x1={0} y1={120} x2={0} y2={120 - 110 * axesU} stroke={colors.GRID} strokeWidth={1.5} />
                <text x={370} y={144} textAnchor="end" fill={colors.ACCENT} fontSize={14}>
                  performance — stable framing
                </text>
                <text x={-8} y={4} textAnchor="start" fill={colors.WARM} fontSize={14} transform="rotate(-90, -8, 4) translate(-116, -14)">
                  readiness
                </text>
                {dotU > 0 && (
                  <g opacity={dotU}>
                    <circle cx={330} cy={120 - 18 - dotU * 0} r={9} fill={colors.POSITIVE} />
                    <text x={330} y={86} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>
                      high score
                    </text>
                    <text x={330} y={102} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                      readiness: unmeasured
                    </text>
                  </g>
                )}
              </g>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The missing variable
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          SSRN 6325939 — Adversarial Epistemic Incoherence (AEI) · Jeremy B. Dixon
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={215} width={860} height={220} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Performance ≠ readiness
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            performance: desired outputs under stable framing
          </text>
          <text x={640} y={354} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            readiness: coherence when framing, authority, incentives destabilize
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Adversarial Epistemic Incoherence · SSRN 6325939 · §1, §3, §7
          </text>
        </g>
      )}
    </>
  );
}

export function AeiMissingVariable() {
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
