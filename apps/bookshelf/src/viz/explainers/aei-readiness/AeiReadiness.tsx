// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 5:
// readiness. Grounded in §7 (Evaluation Implications: From Performance to
// Readiness), §8 (Conclusion — the burden-of-proof line, quoted verbatim on
// screen), and §1 (the paper deliberately proposes no detection or mitigation
// mechanisms — "by internal consistency rather than omission").
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
// The eight failure modes as a constellation around the AEI core (§6 order).
// ---------------------------------------------------------------------------
const MODES = [
  'frame lock-in',
  'mandate collapse',
  'authority laundering',
  'narrative capture',
  'premature coherence',
  'boundary confusion',
  'oversight failure',
  'refusal inversion',
];
const CORE = { x: 420, y: 330 };
const ORBIT_R = 205;
const modePos = (i: number) => {
  const a = -Math.PI / 2 + (i / MODES.length) * Math.PI * 2;
  return { x: CORE.x + Math.cos(a) * ORBIT_R, y: CORE.y + Math.sin(a) * 0.78 * ORBIT_R };
};

// readiness stress dial: environment coherence sweeping down, and the two
// curves (performance under stable framing = flat high; readiness = unknown).
const DIAL = { x: 820, y: 200, w: 330, h: 240 };

const CAM_CONST: CameraState = { x: CORE.x, y: CORE.y - 10, k: 1.25 };
const CAM_DIAL: CameraState = { x: DIAL.x + DIAL.w / 2, y: DIAL.y + DIAL.h / 2, k: 1.25 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  coreU: ChannelRef<number>;
  modesU: ChannelRef<number>;
  dialU: ChannelRef<number>;
  perfU: ChannelRef<number>;
  readyU: ChannelRef<number>;
  noFixU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  quoteU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const coreU = tl.channel('coreU', 0);
  const modesU = tl.channel('modesU', 0);
  const dialU = tl.channel('dialU', 0);
  const perfU = tl.channel('perfU', 0);
  const readyU = tl.channel('readyU', 0);
  const noFixU = tl.channel('noFixU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const quoteU = tl.channel('quoteU', 0);

  // Beat 1 — reassemble the whole taxonomy.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Put the whole threat model back together. One regime in the middle — and the eight failure modes orbiting it, each one a different way a system stays locally coherent while drifting from the truth.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CONST, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(coreU, 1, { at: 1.2, dur: 0.8, ease: ease.enter });
  tl.tween(modesU, 1, { at: 2.0, dur: 3.4, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — the paper's evaluation claim.
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'The evaluation consequence, in the paper’s words: performance asks whether a system produces desired outputs under stable framing. Readiness asks whether it stays coherent when framing, authority, incentives, and evaluation destabilize.',
  });
  tl.tween(cam, CAM_DIAL, { at: 7.2, dur: 1.5, ease: ease.move });
  tl.tween(dialU, 1, { at: 8.2, dur: 1.2, ease: ease.draw });
  tl.tween(perfU, 1, { at: 9.6, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 13.4,
    dur: 5.4,
    text: 'Every benchmark you have ever seen measures the first line. The second line is simply not measured — and if the regime is real, unmeasured is not the same as fine.',
  });
  tl.tween(readyU, 1, { at: 14.4, dur: 1.8, ease: ease.move });
  tl.hold(18.8, 0.7);

  // Beat 3 — what the paper deliberately does not do.
  tl.caption({
    at: 19.5,
    dur: 6.2,
    text: 'Be careful what you take from this. The paper offers no experiments, no detection mechanism, no mitigation — deliberately. It is a position paper doing one job: naming a threat model that evaluation practice implicitly excludes.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 19.7, dur: 1.4, ease: ease.move });
  tl.tween(noFixU, 1, { at: 20.8, dur: 1.0, ease: ease.enter });
  tl.hold(25.7, 0.7);

  // Beat 4 — bridges to the shelf.
  tl.caption({
    at: 26.4,
    dur: 6.6,
    text: 'And notice how much of this shelf already answers it from the other side. Adversarial verification instead of trusting green checkmarks. Recorded evidence instead of confident narrative. Evaluations designed to survive the models gaming them.',
  });
  tl.tween(bridgeU, 1, { at: 27.4, dur: 2.6, ease: ease.enter });
  tl.caption({
    at: 33.2,
    dur: 4.8,
    text: 'Each of those practices is, in this paper’s vocabulary, a way of refusing to assume a coherent world. The paper supplies the name for what they are all defending against.',
  });
  tl.hold(38.0, 0.8);

  // Beat 5 — the burden of proof, verbatim.
  tl.caption({
    at: 38.8,
    dur: 6.4,
    text: 'The paper ends by handing the reader a burden of proof, and it is worth hearing exactly: if your evaluation and governance assume a coherent world, your readiness claims are built on insufficient assumptions.',
  });
  tl.tween(dimU, 1, { at: 39.2, dur: 1.2, ease: ease.move });
  tl.tween(quoteU, 1, { at: 40.2, dur: 1.2, ease: ease.enter });
  // dur runs to the authored end (50.8 + 1.4 hold) so the retimed caption
  // stays up through the actual end of the delivered narration
  tl.caption({
    at: 45.6,
    dur: 6.6,
    text: 'So the journey ran: one missing variable, five environmental properties, eight failure modes — and a single closing question. Not: how smart is your system. But: what happens to it when the world stops agreeing with itself.',
  });
  tl.hold(50.8, 1.4);

  return {
    tl, cam, titleU, coreU, modesU, dialU, perfU, readyU,
    noFixU, bridgeU, dimU, quoteU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-readiness/overrides.json',
  slug: 'aei-readiness',
};

const BRIDGES = [
  'adversarial verification — never trust "it works" without evidence',
  'recordings over narratives — claims need receipts',
  'evals built to survive being gamed',
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const coreU = s.get(scene.coreU);
  const modesU = s.get(scene.modesU);
  const dialU = s.get(scene.dialU);
  const perfU = s.get(scene.perfU);
  const readyU = s.get(scene.readyU);
  const noFixU = s.get(scene.noFixU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const quoteU = s.get(scene.quoteU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* constellation */}
          {coreU > 0 && (
            <g opacity={coreU}>
              <circle cx={CORE.x} cy={CORE.y} r={54} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
              <text x={CORE.x} y={CORE.y - 2} textAnchor="middle" fill={colors.WARM} fontSize={20} fontWeight={700}>
                AEI
              </text>
              <text x={CORE.x} y={CORE.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                the regime
              </text>
            </g>
          )}
          {MODES.map((m, i) => {
            const u = clamp01(modesU * MODES.length - i);
            if (u <= 0) return null;
            const { x, y } = modePos(i);
            return (
              <g key={m} opacity={u}>
                <line x1={CORE.x} y1={CORE.y} x2={x} y2={y} stroke={colors.GRID} strokeWidth={1} opacity={0.6} />
                <circle cx={x} cy={y} r={9} fill={colors.SECONDARY} opacity={0.85} />
                <text x={x} y={y + (y > CORE.y ? 28 : -18)} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                  {m}
                </text>
              </g>
            );
          })}

          {/* performance vs readiness panel */}
          {dialU > 0 && (
            <g opacity={dialU}>
              <rect x={DIAL.x} y={DIAL.y} width={DIAL.w} height={DIAL.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={DIAL.x + 18} y={DIAL.y + 30} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                §7 — performance vs readiness
              </text>
              {perfU > 0 && (
                <g opacity={perfU}>
                  <text x={DIAL.x + 18} y={DIAL.y + 68} fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
                    performance
                  </text>
                  <rect x={DIAL.x + 18} y={DIAL.y + 80} width={(DIAL.w - 60) * 0.93 * perfU} height={18} rx={4} fill={colors.POSITIVE} opacity={0.7} />
                  <text x={DIAL.x + 18} y={DIAL.y + 118} fill={colors.MUTED} fontSize={12}>
                    desired outputs, stable framing — measured
                  </text>
                </g>
              )}
              {readyU > 0 && (
                <g opacity={readyU}>
                  <text x={DIAL.x + 18} y={DIAL.y + 156} fill={colors.WARM} fontSize={14} fontWeight={600}>
                    readiness
                  </text>
                  <rect x={DIAL.x + 18} y={DIAL.y + 168} width={DIAL.w - 60} height={18} rx={4} fill="none" stroke={colors.WARM} strokeDasharray="5 5" />
                  <text x={DIAL.x + DIAL.w / 2 - 12} y={DIAL.y + 182} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                    ?
                  </text>
                  <text x={DIAL.x + 18} y={DIAL.y + 206} fill={colors.MUTED} fontSize={12}>
                    coherence under destabilization — unmeasured
                  </text>
                </g>
              )}
            </g>
          )}

          {/* what the paper does not provide */}
          {noFixU > 0 && (
            <g opacity={noFixU}>
              <rect x={820} y={450} width={330} height={110} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={838} y={478} fill={colors.TEXT} fontSize={13} fontWeight={600}>
                deliberately absent (§1):
              </text>
              <text x={838} y={502} fill={colors.MUTED} fontSize={13}>
                experiments · detection · mitigation
              </text>
              <text x={838} y={526} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                "a missing threat model" — position paper
              </text>
            </g>
          )}

          {/* shelf bridges */}
          {bridgeU > 0 && (
            <g>
              <text x={700} y={116} fill={colors.ACCENT} fontSize={13} fontWeight={600} opacity={Math.min(1, bridgeU * 3)}>
                the shelf's answers, in this paper's vocabulary:
              </text>
              {BRIDGES.map((b, i) => {
                const u = clamp01(bridgeU * BRIDGES.length - i);
                if (u <= 0) return null;
                return (
                  <text key={b} x={716} y={140 + i * 22} fill={colors.TEXT} fontSize={12.5} opacity={u * 0.9}>
                    • {b}
                  </text>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          From performance to readiness
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          SSRN 6325939 §7–8
        </text>
      </g>

      {quoteU > 0 && (
        <g opacity={quoteU}>
          <rect x={170} y={200} width={940} height={250} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.WARM} />
          <text x={640} y={262} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontStyle="italic">
            “If your evaluation and governance assume a coherent world,
          </text>
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={600} fontStyle="italic">
            your readiness claims are built on insufficient assumptions.”
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            1 missing variable · 5 environmental properties · 8 failure modes
          </text>
          <text x={640} y={382} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Adversarial Epistemic Incoherence · Jeremy B. Dixon · SSRN 6325939 §8
          </text>
        </g>
      )}
    </>
  );
}

export function AeiReadiness() {
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
