// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 3:
// taxonomy part one — §6.1 Frame Lock-In (Goffman 1974), §6.5 Premature
// Coherence (Kühberger 1998), §6.2 Contradictory Mandate Collapse (Majka &
// El-Mhamdi 2025), §6.3 Authority Laundering (Bikhchandani et al. 1992).
// The review-chain centerpiece is an ILLUSTRATIVE SIMULATION of the
// informational-cascade mechanism the paper cites: mulberry32 seed 109,
// 16 reviewers, signal accuracy 0.7, true state "unsafe". First two private
// signals happen to read "safe"; every later reviewer rationally follows the
// public record. Result: 16/16 public "safe" verdicts while 13 of the 14
// remaining private signals said "unsafe". Verified numerically.
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
  mulberry32,
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
// Bikhchandani-style cascade, precomputed. 'U' = unsafe (true), 'S' = safe.
// ---------------------------------------------------------------------------
const N_REV = 16;
const { signals, actions } = (() => {
  const rand = mulberry32(109);
  const sig = Array.from({ length: N_REV }, () => (rand() < 0.7 ? 'U' : 'S'));
  const act: string[] = [];
  for (let k = 0; k < N_REV; k++) {
    const u = act.filter((a) => a === 'U').length;
    const d = u - (act.length - u);
    act.push(d >= 2 ? 'U' : d <= -2 ? 'S' : sig[k]);
  }
  return { signals: sig, actions: act };
})();
// sanity: signals = SSUUUUUUUSUUUUUU, actions = all S.
const LATER_U = signals.slice(2).filter((x) => x === 'U').length; // 13

const REV_X0 = 130;
const REV_Y = 380;
const REV_DX = 64;

// premature coherence: two-peaked belief density snapping to a spike.
const belief = (x: number, snap: number) => {
  const g = (m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  const ambiguous = 0.55 * g(0.32, 0.1) + 0.45 * g(0.7, 0.11);
  const confident = g(0.32, 0.028);
  return ambiguous * (1 - snap) + confident * snap;
};
const BEL = { x: 460, y: 130, w: 300, h: 130 };
const beliefPts = (snap: number) =>
  Array.from({ length: 80 }, (_, i) => {
    const x = i / 79;
    return `${BEL.x + x * BEL.w},${BEL.y + BEL.h - belief(x, snap) * BEL.h * 0.92}`;
  }).join(' ');

// wide enough that the 6.2 mandate module (world x ≈ 850–1120) stays on screen
const CAM_CARDS: CameraState = { x: 645, y: 195, k: 1.2 };
// wide enough for the row labels left of reviewer 1 (world x ≈ 31) through node 16
const CAM_CHAIN: CameraState = { x: 568, y: REV_Y + 15, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  frameU: ChannelRef<number>;
  snapU: ChannelRef<number>;
  mandateU: ChannelRef<number>;
  chainU: ChannelRef<number>;
  sigU: ChannelRef<number>;
  actU: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const frameU = tl.channel('frameU', 0);
  const snapU = tl.channel('snapU', 0);
  const mandateU = tl.channel('mandateU', 0);
  const chainU = tl.channel('chainU', 0);
  const sigU = tl.channel('sigU', 0);
  const actU = tl.channel('actU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the taxonomy begins: frame lock-in.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Inside that regime, the paper catalogs eight recurring failure modes. First: frame lock-in. The system optimizes beautifully inside a frame it has no way to challenge — and the answer it needs sits outside the frame.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_CARDS, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(frameU, 1, { at: 1.6, dur: 1.4, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — premature coherence.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'Second: premature coherence. The honest state of this belief is genuinely ambiguous — two live possibilities. Under evaluative pressure, the ambiguity collapses early into one confident answer, because confidence is what gets rewarded.',
  });
  tl.tween(snapU, 1, { at: 9.6, dur: 1.6, ease: ease.move });
  tl.hold(13.2, 0.7);

  // Beat 3 — contradictory mandate collapse.
  tl.caption({
    at: 13.9,
    dur: 6.2,
    text: 'Third: contradictory mandate collapse. Be maximally fast and take no risks — two constraints that cannot both hold. The system resolves the conflict silently, picks one, and rationalizes the choice afterward.',
  });
  tl.tween(mandateU, 1, { at: 14.8, dur: 1.2, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — authority laundering: the cascade setup.
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'The fourth mode deserves its own machine: authority laundering. Claims gain force by passing through institutional channels rather than through evidence. The paper points at informational cascades — so let us actually compute one.',
  });
  tl.tween(cam, CAM_CHAIN, { at: 21.4, dur: 1.5, ease: ease.move });
  tl.tween(chainU, 1, { at: 23.0, dur: 2.6, ease: ease.enter });
  tl.hold(27.2, 0.7);

  // Beat 5 — signals vs verdicts.
  tl.caption({
    at: 27.9,
    dur: 6.6,
    text: 'Sixteen reviewers assess a system in sequence. Each gets a private signal that is right seventy percent of the time — the truth is: unsafe. But each reviewer also sees every verdict already on the record, and rationally weighs that record.',
  });
  tl.tween(sigU, 1, { at: 29.2, dur: 3.2, ease: ease.linear });
  tl.caption({
    at: 34.8,
    dur: 6.8,
    text: 'In this run, the first two private signals happen to read safe. From reviewer three on, the public record outweighs any single private signal — so every reviewer signs safe. Thirteen of the fourteen remaining signals said unsafe. All of them are buried.',
  });
  tl.tween(actU, 1, { at: 36.2, dur: 4.0, ease: ease.linear });
  tl.tween(tallyU, 1, { at: 40.6, dur: 0.9, ease: ease.pop });
  tl.hold(41.9, 0.8);

  // Beat 6 — the reframe.
  tl.caption({
    at: 42.7,
    dur: 6.0,
    text: 'Every reviewer behaved reasonably. Nobody lied. And the sixteenth signature carries enormous institutional weight while containing almost no information. That is authority laundering: the channel substitutes for the evidence.',
  });
  tl.hold(48.7, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 49.4,
    dur: 5.4,
    text: 'Four modes down, and notice the shape they share: each one produces a decision that looks coherent from inside. The next chapter turns to the four modes the paper aims directly at AI assistants.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 49.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 49.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.8, dur: 1.0, ease: ease.enter });
  tl.hold(54.8, 1.2);

  return {
    tl, cam, titleU, frameU, snapU, mandateU, chainU,
    sigU, actU, tallyU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-taxonomy-one/overrides.json',
  slug: 'aei-taxonomy-one',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const frameU = s.get(scene.frameU);
  const snapU = s.get(scene.snapU);
  const mandateU = s.get(scene.mandateU);
  const chainU = s.get(scene.chainU);
  const sigU = s.get(scene.sigU);
  const actU = s.get(scene.actU);
  const tallyU = s.get(scene.tallyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const fadeTop = 1 - 0.75 * clamp01(chainU * 2); // fade mode cards when chain arrives

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={fadeTop}>
            {/* 6.1 frame lock-in */}
            {frameU > 0 && (
              <g opacity={frameU}>
                <text x={130} y={110} fill={colors.ACCENT} fontSize={15} fontWeight={600}>
                  6.1 frame lock-in
                </text>
                <rect x={130} y={130} width={220} height={130} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="7 5" />
                {/* optimizer dot climbing inside the frame */}
                <circle cx={210 + 60 * frameU} cy={230 - 55 * frameU} r={8} fill={colors.POSITIVE} />
                <text x={240} y={250} fill={colors.MUTED} fontSize={12}>
                  optimizing here
                </text>
                {/* the true target, outside the frame */}
                <circle cx={392} cy={150} r={7} fill="none" stroke={colors.WARM} strokeWidth={2} />
                <text x={392} y={130} textAnchor="middle" fill={colors.WARM} fontSize={12}>
                  answer
                </text>
              </g>
            )}

            {/* 6.5 premature coherence */}
            <g opacity={frameU}>
              <text x={BEL.x} y={110} fill={colors.SECONDARY} fontSize={15} fontWeight={600}>
                6.5 premature coherence
              </text>
              <line x1={BEL.x} y1={BEL.y + BEL.h} x2={BEL.x + BEL.w} y2={BEL.y + BEL.h} stroke={colors.GRID} />
              <polyline points={beliefPts(snapU)} fill="none" stroke={snapU > 0.5 ? colors.NEGATIVE : colors.SECONDARY} strokeWidth={2.5} />
              <text x={BEL.x + BEL.w / 2} y={BEL.y + BEL.h + 22} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                {snapU > 0.5 ? 'confident resolution — indeterminate truth' : 'honest ambiguity'}
              </text>
            </g>

            {/* 6.2 contradictory mandate collapse */}
            {mandateU > 0 && (
              <g opacity={mandateU}>
                <text x={850} y={110} fill={colors.WARM} fontSize={15} fontWeight={600}>
                  6.2 contradictory mandate collapse
                </text>
                <text x={870} y={150} fill={colors.TEXT} fontSize={14}>
                  "ship maximally fast"
                </text>
                <text x={870} y={180} fill={colors.TEXT} fontSize={14}>
                  "take zero risks"
                </text>
                <line x1={1010} y1={158} x2={1060} y2={158} stroke={colors.NEGATIVE} strokeWidth={2} />
                <line x1={1060} y1={158} x2={1035} y2={143} stroke={colors.NEGATIVE} strokeWidth={2} />
                <line x1={1060} y1={158} x2={1035} y2={173} stroke={colors.NEGATIVE} strokeWidth={2} />
                <text x={870} y={220} fill={colors.NEGATIVE} fontSize={13}>
                  resolved implicitly → rationalized after
                </text>
                <text x={870} y={244} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                  Goodhart under conflicting objectives
                </text>
              </g>
            )}
          </g>

          {/* 6.3 authority laundering — the review chain */}
          {chainU > 0 && (
            <g>
              <text x={REV_X0} y={REV_Y - 90} fill={colors.WARM} fontSize={16} fontWeight={600} opacity={chainU}>
                6.3 authority laundering — an informational cascade, computed
              </text>
              <text x={REV_X0} y={REV_Y - 66} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={chainU}>
                illustrative simulation (Bikhchandani et al. 1992) · signal accuracy 0.7 · ground truth: UNSAFE
              </text>
              {signals.map((sig, i) => {
                const u = clamp01(chainU * N_REV * 0.5 - i * 0.5);
                if (u <= 0) return null;
                const x = REV_X0 + i * REV_DX;
                const su = clamp01(sigU * N_REV - i);
                const au = clamp01(actU * N_REV - i);
                const act = actions[i];
                return (
                  <g key={i} opacity={u}>
                    {/* reviewer node */}
                    <circle cx={x} cy={REV_Y} r={16} fill={colors.PANEL} stroke={au > 0.5 ? (act === 'S' ? colors.NEGATIVE : colors.POSITIVE) : colors.GRID} strokeWidth={2} />
                    <text x={x} y={REV_Y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {i + 1}
                    </text>
                    {/* private signal below */}
                    {su > 0 && (
                      <g opacity={su}>
                        <rect x={x - 13} y={REV_Y + 30} width={26} height={20} rx={4}
                          fill={sig === 'U' ? colors.POSITIVE : colors.NEGATIVE} opacity={0.22} />
                        <text x={x} y={REV_Y + 44} textAnchor="middle" fontSize={11} fontWeight={600}
                          fill={sig === 'U' ? colors.POSITIVE : colors.NEGATIVE}>
                          {sig === 'U' ? 'unsafe' : 'safe'}
                        </text>
                      </g>
                    )}
                    {/* public verdict above */}
                    {au > 0 && (
                      <g opacity={au}>
                        <rect x={x - 13} y={REV_Y - 56} width={26} height={20} rx={4}
                          fill={act === 'S' ? colors.NEGATIVE : colors.POSITIVE} opacity={0.3} />
                        <text x={x} y={REV_Y - 42} textAnchor="middle" fontSize={11} fontWeight={700}
                          fill={act === 'S' ? colors.NEGATIVE : colors.POSITIVE}>
                          {act === 'S' ? 'SAFE' : 'UNSAFE'}
                        </text>
                      </g>
                    )}
                    {i > 0 && <line x1={x - REV_DX + 16} y1={REV_Y} x2={x - 16} y2={REV_Y} stroke={colors.GRID} strokeWidth={1.5} opacity={u} />}
                  </g>
                );
              })}
              <text x={REV_X0 - 4} y={REV_Y - 42} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                public verdict →
              </text>
              <text x={REV_X0 - 4} y={REV_Y + 44} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                private signal →
              </text>
              {tallyU > 0 && (
                <g opacity={tallyU}>
                  <rect x={REV_X0} y={REV_Y + 74} width={640} height={34} rx={8} fill={colors.NEGATIVE} opacity={0.14} />
                  <text x={REV_X0 + 16} y={REV_Y + 96} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace">
                    public record: 16/16 SAFE · private signals after reviewer 2: {LATER_U}/14 said UNSAFE
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The taxonomy, part one
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
          SSRN 6325939 §6.1–6.3, §6.5
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={225} width={860} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Coherent from the inside, unsound from above
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            frame lock-in · premature coherence · mandate collapse · authority laundering
          </text>
          <text x={640} y={378} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            SSRN 6325939 §6 — cascade sim illustrative (Bikhchandani et al. 1992)
          </text>
        </g>
      )}
    </>
  );
}

export function AeiTaxonomyOne() {
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
