// arXiv:2607.03502 — "Reading Between the Dots", chapter 5: why it matters.
// Two lanes to the same answer: a written chain of thought you can read on
// the surface, and filler computation that is invisible until you hold the
// weights and the trace. The paper's closing claim (kept at its honest
// size): opaque reasoning WAS monitorable here — via full computational
// traces on open-weights models — which is an argument for trace access,
// not a license to trust surface behavior. Ties to the shelf's thesis:
// you cannot verify what you cannot see.
import {
  CAMERA_HOME,
  Camera,
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
// The two lanes (labels only — this closing chapter is a synthesis, and the
// numbers shown are the earlier chapters' computed/reported results).
// ---------------------------------------------------------------------------

const COT_TOKENS = ['silicon', 'is', '14', ';', '14', '+', '62', '=', '76'];
const DOT_TOKENS = ['.', '.', '.', '.', '.', '.', '.', '.', '.'];

const RECAP = [
  { text: 'a fixed prompt, dots, and a rising accuracy — work with no words', c: colors.WARM },
  { text: 'a toy machine where the dots provably carry the computation', c: colors.ACCENT },
  { text: 'fingerprints: the relay, the lens, ablation and transplant', c: colors.SECONDARY },
  { text: 'frontier traces: 80–95% of hidden intermediates decoded', c: colors.POSITIVE },
];

const LANE_Y1 = 200;
const LANE_Y2 = 330;
const TOK_X0 = 220;
const TOK_DX = 92;

const CAM_LANES: CameraState = { x: 640, y: 270, k: 1.2 };
const CAM_DOTS: CameraState = { x: 640, y: 340, k: 1.5 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  laneU: ChannelRef<number>;
  eyeU: ChannelRef<number>;
  xrayU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const laneU = tl.channel('laneU', 0);
  const eyeU = tl.channel('eyeU', 0);
  const xrayU = tl.channel('xrayU', 0);
  const recapU = tl.channel('recapU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — two lanes
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Two ways for a model to reach the same answer. The top lane writes its reasoning out loud: silicon is fourteen, fourteen plus sixty two is seventy six. Anyone can audit it.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LANES, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(laneU, 1, { at: 1.2, dur: 2.6, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.6,
    text: 'The bottom lane emits nine identical dots and lands on the same answer. From the outside there is nothing to audit. The reasoning happened — you just were not invited.',
  });
  tl.tween(eyeU, 1, { at: 8.2, dur: 1.0, ease: ease.enter });
  tl.hold(12.3, 0.6);

  // Beat 2 — the asymmetry of trust
  tl.caption({
    at: 12.9,
    dur: 6.2,
    text: 'Here is the asymmetry that matters. A claim of failure is cheap to accept — you look, and either it is broken or it is not. A claim that the reasoning was fine, made from behind a wall of dots, is the expensive kind. It needs evidence.',
  });
  tl.hold(19.1, 0.6);

  // Beat 3 — the paper's answer
  tl.caption({
    at: 19.7,
    dur: 6.0,
    text: 'The paper’s contribution is that the wall is thinner than it looks — if you hold the weights. Point the lens at the dots and the hidden intermediates read out, eight or nine times in ten.',
  });
  tl.tween(cam, CAM_DOTS, { at: 20.0, dur: 1.5, ease: ease.move });
  tl.tween(xrayU, 1, { at: 21.2, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 26.1,
    dur: 5.8,
    text: 'But notice what carried the audit: not the model’s claims, and not its visible behavior — the recording of its computation. Oversight followed trace access, nothing else.',
  });
  tl.hold(31.9, 0.6);

  // Beat 4 — recap
  tl.caption({
    at: 32.5,
    dur: 5.6,
    text: 'Retrace the whole book. Dots that do work. A toy that shows what readable work looks like. Fingerprints that separate relays from scenery. And frontier traces that mostly decode.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.8, dur: 1.4, ease: ease.move });
  tl.tween(laneU, 0.15, { at: 32.8, dur: 1.0, ease: ease.move });
  tl.tween(xrayU, 0.15, { at: 32.8, dur: 1.0, ease: ease.move });
  tl.tween(recapU, 1, { at: 33.4, dur: 3.2, ease: ease.enter });
  tl.hold(38.3, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 38.9,
    dur: 6.0,
    text: 'The moral is not that hidden computation is safe. It is that legibility is a property you have to engineer and demand: keep the traces, keep the access — because you cannot verify what you cannot see.',
  });
  tl.tween(closeU, 1, { at: 39.8, dur: 1.1, ease: ease.enter });
  tl.hold(45.1, 1.4);

  return { tl, cam, titleU, laneU, eyeU, xrayU, recapU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/legible-computation/overrides.json',
  slug: 'legible-computation',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Lane({
  tokens,
  y,
  color,
  u,
  mono,
}: {
  tokens: string[];
  y: number;
  color: string;
  u: number;
  mono?: boolean;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={Math.min(1, u * 1.2)}>
      {tokens.map((t, i) => {
        const tu = clamp01(u * tokens.length - i);
        if (tu <= 0) return null;
        return (
          <g key={i} opacity={tu}>
            <rect x={TOK_X0 + i * TOK_DX} y={y} width={TOK_DX - 8} height={40} rx={7} fill={colors.PANEL} stroke={color} />
            <text
              x={TOK_X0 + i * TOK_DX + (TOK_DX - 8) / 2}
              y={y + 25}
              textAnchor="middle"
              fill={mono ? colors.MUTED : colors.TEXT}
              fontSize={14}
              fontFamily="monospace"
            >
              {t}
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
  const laneU = s.get(scene.laneU);
  const eyeU = s.get(scene.eyeU);
  const xrayU = s.get(scene.xrayU);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;
  // the hidden values revealed "through" the dots by the lens
  const HIDDEN = ['', '', '14', '', '', '62', '', '', '76'];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={laneU > 0 ? 1 : 0}>
            <text x={TOK_X0} y={LANE_Y1 - 16} fill={colors.POSITIVE} fontSize={14} opacity={Math.min(1, laneU * 2)}>
              legible: a written chain of thought
            </text>
            <text x={TOK_X0} y={LANE_Y2 - 16} fill={colors.WARM} fontSize={14} opacity={Math.min(1, laneU * 2)}>
              hidden: the same work, behind dots
            </text>
          </g>
          <Lane tokens={COT_TOKENS} y={LANE_Y1} color={colors.POSITIVE} u={laneU} />
          <Lane tokens={DOT_TOKENS} y={LANE_Y2} color={colors.WARM} u={laneU} mono />
          <g opacity={laneU}>
            <text x={TOK_X0 + COT_TOKENS.length * TOK_DX + 14} y={LANE_Y1 + 25} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">
              → 76
            </text>
            <text x={TOK_X0 + DOT_TOKENS.length * TOK_DX + 14} y={LANE_Y2 + 25} fill={colors.WARM} fontSize={15} fontFamily="monospace">
              → 76
            </text>
          </g>
          {eyeU > 0 && (
            <text x={TOK_X0} y={LANE_Y2 + 66} fill={colors.MUTED} fontSize={13} opacity={eyeU}>
              surface oversight reads the top lane and is blind to the bottom one
            </text>
          )}

          {/* the lens x-ray over the dots */}
          {xrayU > 0 && (
            <g opacity={xrayU}>
              {HIDDEN.map((h, i) =>
                h ? (
                  <g key={i}>
                    <rect
                      x={TOK_X0 + i * TOK_DX - 2}
                      y={LANE_Y2 - 2}
                      width={TOK_DX - 4}
                      height={44}
                      rx={8}
                      fill="none"
                      stroke={colors.TEAL}
                      strokeWidth={2}
                    />
                    <text
                      x={TOK_X0 + i * TOK_DX + (TOK_DX - 8) / 2}
                      y={LANE_Y2 + 62}
                      textAnchor="middle"
                      fill={colors.TEAL}
                      fontSize={15}
                      fontWeight={600}
                      fontFamily="monospace"
                    >
                      {h}
                    </text>
                  </g>
                ) : null,
              )}
              <text x={TOK_X0} y={LANE_Y2 + 92} fill={colors.TEAL} fontSize={13}>
                the lens, reading the trace beneath the dots (decoded 80–95% of the time)
              </text>
            </g>
          )}

          {/* recap */}
          {recapU > 0 && (
            <g opacity={Math.min(1, recapU * 1.2)}>
              {RECAP.map((r, i) => {
                const u = clamp01(recapU * RECAP.length - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={250} cy={470 + i * 36} r={5} fill={r.c} />
                    <text x={270} y={475 + i * 36} fill={colors.TEXT} fontSize={15}>
                      {r.text}
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
          You can’t verify what you can’t see
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.03502 · closing argument
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={230} width={880} height={200} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Legibility is engineered, not assumed.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            The dots were readable because someone kept the weights
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            and the traces — and went looking.
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Reading Between the Dots · arXiv:2607.03502
          </text>
        </g>
      )}
    </>
  );
}

export function LegibleComputation() {
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
