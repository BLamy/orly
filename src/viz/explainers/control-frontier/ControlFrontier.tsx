// Explained: AI Control — chapter 5: the reported state of the art + close.
// The four protocol points are REPORTED results from Greenblatt, Shlegeris,
// Sachan & Roger, "AI Control: Improving Safety Despite Intentional
// Subversion" (2023), APPS backdoor setting, 2% auditing budget — replotted
// here and clearly labeled "reported". Safety / usefulness:
//   upfront auditing (baseline) — 15% / 100%
//   trusted monitoring          — 62% / 97%
//   untrusted monitoring        — 79% / 96%
//   trusted editing (20%)       — 92% / 94%
// The recent-pushback note references a 2026 evaluation of DISTRIBUTED attacks
// in persistent state (attacks split across many changes), reported to evade a
// single weak monitor most of the time, roughly halved by a monitor ensemble —
// stated as "reported", directional, not exact. Close: control is verification
// under an adversarial assumption — the loop books' critic, formalized.
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

// ---------------------------------------------------------------------------
// Reported data (Greenblatt et al., 2023). Clearly labeled on screen.
// ---------------------------------------------------------------------------

const PROTOCOLS = [
  { name: 'upfront auditing', safety: 0.15, useful: 1.0, color: colors.NEGATIVE, note: 'baseline' },
  { name: 'trusted monitoring', safety: 0.62, useful: 0.97, color: colors.WARM, note: 'ch. 2' },
  { name: 'untrusted monitoring', safety: 0.79, useful: 0.96, color: colors.SECONDARY, note: 'U watches U' },
  { name: 'trusted editing (20%)', safety: 0.92, useful: 0.94, color: colors.POSITIVE, note: 'T rewrites U' },
];

const PX = 260;
const PY = 180;
const PW = 620;
const PH = 340;
const sx = (u: number) => PX + u * PW; // usefulness 0..1
const sy = (v: number) => PY + PH - v * PH; // safety 0..1
const CAM_PLOT: CameraState = { x: 600, y: 360, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  ptsU: ChannelRef<number>; // the four protocols
  labelU: ChannelRef<number>; // "reported" label
  pushU: ChannelRef<number>; // distributed-attacks pushback
  bridgeU: ChannelRef<number>; // loop-books bridge
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const axesU = tl.channel('axesU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const labelU = tl.channel('labelU', 0);
  const pushU = tl.channel('pushU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the frontier
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Our toy monitor built intuition. Now the real numbers — reported, not simulated by me — from the paper that started this field. Same two axes as chapter one: usefulness across the bottom, safety up the side. Every protocol is one point, measured against a red team attacking its hardest.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_PLOT, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.tween(axesU, 1, { at: 1.8, dur: 1.3, ease: ease.draw });
  tl.tween(labelU, 1, { at: 2.6, dur: 0.8, ease: ease.enter });
  tl.hold(6.1, 0.5);

  // Beat 2 — the baseline
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'Start at the floor. Upfront auditing alone — check a sample at the start, then trust the model — keeps full usefulness but reports only about fifteen percent safety. Against a competent adversary that defects rarely, an early spot-check barely helps. This is the bar everything else has to clear.',
  });
  tl.tween(ptsU, 0.25, { at: 7.4, dur: 0.9, ease: ease.pop });
  tl.hold(12.2, 0.6);

  // Beat 3 — monitoring climbs
  tl.caption({
    at: 12.8,
    dur: 5.8,
    text: 'Add the trusted monitor from chapter two and safety jumps to about sixty two percent, with usefulness barely dented at ninety seven. Let the untrusted model help monitor itself — carefully, so it cannot simply wave its own attacks through — and the reported safety climbs to seventy nine. The weak watcher was worth a lot.',
  });
  tl.tween(ptsU, 0.75, { at: 13.8, dur: 1.6, ease: ease.move });
  tl.hold(18.6, 0.6);

  // Beat 4 — the best reported
  tl.caption({
    at: 19.2,
    dur: 5.8,
    text: 'And the strongest protocol in the paper does not just watch — it edits. The trusted model rewrites the untrusted model’s riskiest submissions, defusing a backdoor instead of merely flagging it. Reported safety about ninety two percent, usefulness still ninety four. From fifteen to ninety two, and you never once trusted the capable model.',
  });
  tl.tween(ptsU, 1, { at: 20.2, dur: 1.4, ease: ease.move });
  tl.hold(25.6, 0.6);

  // Beat 5 — the pushback
  tl.caption({
    at: 26.2,
    dur: 6.0,
    text: 'But this is a live contest, and the attackers have not stood still. More recent evaluations — reported, and I will keep the numbers directional — study distributed attacks in persistent state: instead of one suspicious submission, spread a backdoor across many small, innocent-looking changes. A single weak monitor misses most of these; an ensemble of monitors reportedly claws much of it back. The frontier moves both ways.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 26.5, dur: 1.3, ease: ease.move });
  tl.tween(pushU, 1, { at: 27.6, dur: 0.9, ease: ease.enter });
  tl.hold(32.8, 0.6);

  // Beat 6 — the shelf connection
  tl.caption({
    at: 33.4,
    dur: 5.8,
    text: 'Step back to where the shelf lives. Every book here has said: an agent’s claim is cheap to make and expensive to trust, so verify it. Control is that same sentence with the gloves off — verification under the assumption that the thing you are checking is actively trying to deceive you.',
  });
  tl.tween(bridgeU, 1, { at: 34.4, dur: 0.9, ease: ease.enter });
  tl.hold(39.2, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 39.8,
    dur: 5.6,
    text: 'The loop books built a critic that replays the evidence. Control formalizes that critic into a game with a budget, an adversary, and a score. Same instinct — do not believe the claim, test it — turned into an equilibrium you can actually measure. That is the whole shelf, in one adversarial frame.',
  });
  tl.tween(dimU, 1, { at: 40.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.8, dur: 1.0, ease: ease.enter });
  tl.hold(45.4, 1.4);

  return { tl, cam, titleU, axesU, ptsU, labelU, pushU, bridgeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/control-frontier/overrides.json', slug: 'control-frontier' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const LOOP_BOOKS = ['wasm-vm-loop', 'electric-forest-loop', 'the-progress-judge'];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axesU = s.get(scene.axesU);
  const ptsU = s.get(scene.ptsU);
  const labelU = s.get(scene.labelU);
  const pushU = s.get(scene.pushU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // reveal protocols progressively via ptsU thresholds
  const shown = PROTOCOLS.map((_, i) => {
    const thresholds = [0.2, 0.7, 0.7, 1.0];
    return ptsU >= thresholds[i] - 0.001;
  });

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={PX} y1={PY} x2={PX} y2={PY + PH} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PX} y1={PY + PH} x2={PX + PW} y2={PY + PH} stroke={colors.GRID} strokeWidth={1.5} />
              {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                <g key={v}>
                  <line x1={PX - 5} y1={sy(v)} x2={PX + PW} y2={sy(v)} stroke={colors.GRID} strokeWidth={0.5} opacity={0.3} />
                  <text x={PX - 12} y={sy(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {(v * 100).toFixed(0)}
                  </text>
                  <text x={sx(v)} y={PY + PH + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {(v * 100).toFixed(0)}
                  </text>
                </g>
              ))}
              <text x={PX - 44} y={PY + PH / 2} fill={colors.POSITIVE} fontSize={13.5} fontWeight={600} textAnchor="middle" transform={`rotate(-90 ${PX - 44} ${PY + PH / 2})`}>
                safety (%)
              </text>
              <text x={PX + PW / 2} y={PY + PH + 46} textAnchor="middle" fill={colors.ACCENT} fontSize={13.5} fontWeight={600}>
                usefulness (%)
              </text>
            </g>
          )}

          {/* protocol points */}
          {PROTOCOLS.map((p, i) => {
            if (!shown[i]) return null;
            return (
              <g key={p.name}>
                <circle cx={sx(p.useful)} cy={sy(p.safety)} r={9} fill={p.color} />
                <text x={sx(p.useful) - 16} y={sy(p.safety) + 4} textAnchor="end" fill={colors.TEXT} fontSize={13} fontWeight={600}>
                  {p.name}
                </text>
                <text x={sx(p.useful) - 16} y={sy(p.safety) + 22} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  {(p.safety * 100).toFixed(0)}% safe · {(p.useful * 100).toFixed(0)}% useful
                </text>
              </g>
            );
          })}
        </Camera>
      </g>

      {/* reported label — screen space */}
      {labelU > 0 && (
        <g opacity={labelU * mainOp}>
          <rect x={880} y={110} width={370} height={92} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={904} y={138} fill={colors.WARM} fontSize={13} fontWeight={700}>
            REPORTED — not simulated here
          </text>
          <text x={904} y={162} fill={colors.MUTED} fontSize={11.5}>
            Greenblatt, Shlegeris, Sachan, Roger
          </text>
          <text x={904} y={182} fill={colors.MUTED} fontSize={11.5}>
            2023 · APPS backdoors · 2% audit budget
          </text>
        </g>
      )}

      {/* pushback note */}
      {pushU > 0 && (
        <g opacity={pushU * mainOp}>
          <rect x={210} y={110} width={560} height={96} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.SECONDARY} />
          <text x={234} y={140} fill={colors.SECONDARY} fontSize={13.5} fontWeight={700}>
            reported pushback — distributed attacks (2026)
          </text>
          <text x={234} y={166} fill={colors.MUTED} fontSize={12}>
            a backdoor split across many small changes evades a single weak monitor —
          </text>
          <text x={234} y={186} fill={colors.MUTED} fontSize={12}>
            an ensemble of monitors reportedly recovers much of the lost detection.
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          What the numbers say
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={180} y={196} width={920} height={272} rx={16} fill={colors.PANEL} opacity={0.97} stroke={colors.GRID} />
          <text x={640} y={252} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Control is verification under adversarial assumption.
          </text>
          <text x={640} y={298} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily="monospace">
            reported: upfront 15% → monitoring 62% → untrusted-monitor 79% → trusted-editing 92% safe
          </text>
          {bridgeU > 0 &&
            LOOP_BOOKS.map((b, i) => (
              <text key={b} x={280 + i * 360} y={344} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily="monospace" opacity={0.9}>
                {b}
              </text>
            ))}
          <text x={640} y={392} textAnchor="middle" fill={colors.POSITIVE} fontSize={16}>
            the loop books’ critic, formalized into a game with a budget and a score
          </text>
          <text x={640} y={432} textAnchor="middle" fill={colors.WARM} fontSize={14.5}>
            don’t believe the claim — test it, assuming it wants to deceive you
          </text>
        </g>
      )}
    </>
  );
}

export function ControlFrontier() {
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
