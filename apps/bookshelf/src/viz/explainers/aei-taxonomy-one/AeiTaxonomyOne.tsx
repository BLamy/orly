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
//
// STAGING — each failure mode gets its OWN ROOM on a 2-D world grid; rooms are
// 1600/900 apart, wider and taller than the viewport, so modes can never
// overlap and each is drawn on a clean background. (The previous version laid
// all four modes side by side in one 1280-wide world and let the camera drag
// them across each other and under the title — that is what this fixes.)
import {
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
import { Figure } from '../../primitives';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Room grid — room (c, r) owns 0..1280 × 0..720 translated by (c*1600, r*900).
// ---------------------------------------------------------------------------
const ROOM_DX = 1600;
const ROOM_DY = 900;
// Room bodies are pushed down by BODY_DY so the graphic sits centred in the
// 16:9 frame instead of hugging the top edge; the header is lifted back up by
// the same amount so it still renders at y = 62 on screen.
const BODY_DY = 45;
const roomAt = (c: number, r = 0) =>
  `translate(${c * ROOM_DX}, ${r * ROOM_DY + BODY_DY})`;
const camAt = (c: number, r = 0, k = 1): CameraState => ({
  x: c * ROOM_DX + STAGE_W / 2,
  y: r * ROOM_DY + STAGE_H / 2,
  k,
});

// Zoom stays ≤ 1.08: at k the leftmost visible world x is 640 - 640/k, and the
// room header sits at x = 60, so anything tighter shaves the title. The chain
// room is a full 1280 wide, so it is only ever viewed at k = 1.
const CAM_FRAME = camAt(0, 0);
const CAM_BELIEF = camAt(1, 0, 1.06);
const CAM_MANDATE = camAt(2, 0);
const CAM_CHAIN = camAt(2, 1);
const CAM_CLOSE = camAt(1, 1);

const FIG = '/generated/ssrn-aei/figures';

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

const REV_X0 = 180;
const REV_Y = 300; // verdicts sit at REV_Y-56, the reframe line at REV_Y+204
const REV_DX = 62;

// premature coherence: two-peaked belief density snapping to a spike.
const belief = (x: number, snap: number) => {
  const g = (m: number, s: number) => Math.exp(-((x - m) ** 2) / (2 * s * s));
  const ambiguous = 0.55 * g(0.32, 0.1) + 0.45 * g(0.7, 0.11);
  const confident = g(0.32, 0.028);
  return ambiguous * (1 - snap) + confident * snap;
};
const BEL = { x: 390, y: 180, w: 500, h: 230 };
const beliefPts = (snap: number) =>
  Array.from({ length: 120 }, (_, i) => {
    const x = i / 119;
    return `${BEL.x + x * BEL.w},${BEL.y + BEL.h - belief(x, snap) * BEL.h * 0.92}`;
  }).join(' ');

// frame lock-in geometry
const FRAME = { x: 140, y: 190, w: 380, h: 230 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  frameU: ChannelRef<number>;
  taxFigU: ChannelRef<number>;
  beliefU: ChannelRef<number>;
  snapU: ChannelRef<number>;
  mandateU: ChannelRef<number>;
  chainU: ChannelRef<number>;
  sigU: ChannelRef<number>;
  actU: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  reframeU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FRAME, cameraInterp);
  const frameU = tl.channel('frameU', 0);
  const taxFigU = tl.channel('taxFigU', 0);
  const beliefU = tl.channel('beliefU', 0);
  const snapU = tl.channel('snapU', 0);
  const mandateU = tl.channel('mandateU', 0);
  const chainU = tl.channel('chainU', 0);
  const sigU = tl.channel('sigU', 0);
  const actU = tl.channel('actU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const reframeU = tl.channel('reframeU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — ROOM (0,0): §6.1 frame lock-in, beside the printed taxonomy.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Inside that regime, the paper catalogs eight recurring failure modes. First: frame lock-in. The system optimizes beautifully inside a frame it has no way to challenge — and the answer it needs sits outside the frame.',
  });
  tl.tween(frameU, 1, { at: 0.6, dur: 1.6, ease: ease.enter });
  tl.tween(taxFigU, 1, { at: 2.4, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — ROOM (1,0): §6.5 premature coherence.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'Second: premature coherence. The honest state of this belief is genuinely ambiguous — two live possibilities. Under evaluative pressure, the ambiguity collapses early into one confident answer, because confidence is what gets rewarded.',
  });
  // Each room change starts ~1.5s BEFORE its line, so the camera has settled
  // and the room is dressed by the time the narration reaches it.
  tl.tween(cam, CAM_BELIEF, { at: 5.5, dur: 1.4, ease: ease.move });
  tl.tween(beliefU, 1, { at: 5.8, dur: 1.0, ease: ease.draw });
  tl.tween(snapU, 1, { at: 9.8, dur: 1.6, ease: ease.move });
  tl.hold(13.2, 0.7);

  // Beat 3 — ROOM (2,0): §6.2 contradictory mandate collapse.
  tl.caption({
    at: 13.9,
    dur: 6.2,
    text: 'Third: contradictory mandate collapse. Be maximally fast and take no risks — two constraints that cannot both hold. The system resolves the conflict silently, picks one, and rationalizes the choice afterward.',
  });
  tl.tween(cam, CAM_MANDATE, { at: 12.4, dur: 1.4, ease: ease.move });
  tl.tween(mandateU, 1, { at: 12.7, dur: 1.4, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — ROOM (2,1): §6.3 authority laundering — the cascade machine.
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'The fourth mode deserves its own machine: authority laundering. Claims gain force by passing through institutional channels rather than through evidence. The paper points at informational cascades — so let us actually compute one.',
  });
  tl.tween(cam, CAM_CHAIN, { at: 19.3, dur: 1.4, ease: ease.move });
  tl.tween(chainU, 1, { at: 19.6, dur: 2.6, ease: ease.enter });
  tl.hold(27.2, 0.7);

  // Beat 5 — same room: the private signals.
  tl.caption({
    at: 27.9,
    dur: 6.6,
    text: 'Sixteen reviewers assess a system in sequence. Each gets a private signal that is right seventy percent of the time — the truth is: unsafe. But each reviewer also sees every verdict already on the record, and rationally weighs that record.',
  });
  tl.tween(sigU, 1, { at: 29.2, dur: 3.2, ease: ease.linear });

  // Beat 6 — same room: the public verdicts bury them.
  tl.caption({
    at: 34.8,
    dur: 6.8,
    text: 'In this run, the first two private signals happen to read safe. From reviewer three on, the public record outweighs any single private signal — so every reviewer signs safe. Thirteen of the fourteen remaining signals said unsafe. All of them are buried.',
  });
  tl.tween(actU, 1, { at: 36.2, dur: 4.0, ease: ease.linear });
  tl.tween(tallyU, 1, { at: 40.6, dur: 0.9, ease: ease.pop });
  tl.hold(41.9, 0.8);

  // Beat 7 — same room, pushed in on the tail: the reframe.
  tl.caption({
    at: 42.7,
    dur: 6.0,
    text: 'Every reviewer behaved reasonably. Nobody lied. And the sixteenth signature carries enormous institutional weight while containing almost no information. That is authority laundering: the channel substitutes for the evidence.',
  });
  tl.tween(reframeU, 1, { at: 41.6, dur: 0.8, ease: ease.enter });
  tl.hold(48.7, 0.7);

  // Beat 8 — ROOM (1,1): the close, on an empty stage.
  tl.caption({
    at: 49.4,
    dur: 5.4,
    text: 'Four modes down, and notice the shape they share: each one produces a decision that looks coherent from inside. The next chapter turns to the four modes the paper aims directly at AI assistants.',
  });
  tl.tween(cam, CAM_CLOSE, { at: 47.9, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.2, dur: 1.0, ease: ease.enter });
  tl.hold(54.8, 1.2);

  return {
    tl, cam, frameU, taxFigU, beliefU, snapU, mandateU, chainU,
    sigU, actU, tallyU, reframeU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-taxonomy-one/overrides.json',
  slug: 'aei-taxonomy-one',
};

function RoomHeader({ title, sub, u = 1 }: { title: string; sub: string; u?: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <text x={60} y={62 - BODY_DY} fill={colors.TEXT} fontSize={24} fontWeight={600}>
        {title}
      </text>
      <text x={60} y={88 - BODY_DY} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
        {sub}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const frameU = s.get(scene.frameU);
  const taxFigU = s.get(scene.taxFigU);
  const beliefU = s.get(scene.beliefU);
  const snapU = s.get(scene.snapU);
  const mandateU = s.get(scene.mandateU);
  const chainU = s.get(scene.chainU);
  const sigU = s.get(scene.sigU);
  const actU = s.get(scene.actU);
  const tallyU = s.get(scene.tallyU);
  const reframeU = s.get(scene.reframeU);
  const closeU = s.get(scene.closeU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* ---------- ROOM (0,0) — §6.1 frame lock-in ---------- */}
        <g transform={roomAt(0, 0)} opacity={frameU}>
          <RoomHeader title="6.1 — frame lock-in" sub="SSRN 6325939 §6.1 · Goffman 1974" />
          <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx={10}
            fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="8 6" />
          <text x={FRAME.x + 10} y={FRAME.y - 12} fill={colors.ACCENT} fontSize={14}>
            the frame the system can see
          </text>
          <circle cx={FRAME.x + 110 + 130 * frameU} cy={FRAME.y + 170 - 90 * frameU} r={9}
            fill={colors.POSITIVE} />
          <text x={FRAME.x + 130} y={FRAME.y + 208} fill={colors.MUTED} fontSize={14}>
            optimizing here, perfectly
          </text>
          <circle cx={600} cy={FRAME.y + 30} r={8} fill="none" stroke={colors.WARM} strokeWidth={2} />
          <text x={600} y={FRAME.y + 8} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            the answer
          </text>
          <text x={600} y={FRAME.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            outside
          </text>
          <Figure
            src={`${FIG}/taxonomy-one.png`}
            x={760} y={150} w={400} h={271}
            reveal={taxFigU} opacity={taxFigU}
            accent={colors.WARM}
            caption="§6.1–6.3, as published"
          />
        </g>

        {/* ---------- ROOM (1,0) — §6.5 premature coherence ---------- */}
        <g transform={roomAt(1, 0)} opacity={beliefU}>
          <RoomHeader title="6.5 — premature coherence" sub="SSRN 6325939 §6.5 · Kühberger 1998" />
          <line x1={BEL.x} y1={BEL.y + BEL.h} x2={BEL.x + BEL.w} y2={BEL.y + BEL.h}
            stroke={colors.GRID} strokeWidth={1.5} />
          <polyline points={beliefPts(snapU)} fill="none"
            stroke={snapU > 0.5 ? colors.NEGATIVE : colors.SECONDARY} strokeWidth={3} />
          <text x={BEL.x + BEL.w / 2} y={BEL.y + BEL.h + 40} textAnchor="middle"
            fill={snapU > 0.5 ? colors.NEGATIVE : colors.SECONDARY} fontSize={18}>
            {snapU > 0.5 ? 'confident resolution' : 'honest ambiguity — two live possibilities'}
          </text>
          <text x={BEL.x + BEL.w / 2} y={BEL.y + BEL.h + 68} textAnchor="middle"
            fill={colors.MUTED} fontSize={15} opacity={snapU}>
            where the epistemically correct state is indeterminate
          </text>
        </g>

        {/* ---------- ROOM (2,0) — §6.2 contradictory mandate collapse ---------- */}
        <g transform={roomAt(2, 0)} opacity={mandateU}>
          <RoomHeader title="6.2 — contradictory mandate collapse" sub="SSRN 6325939 §6.2 · Majka & El-Mhamdi 2025" />
          <rect x={200} y={190} width={340} height={90} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={370} y={244} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            “ship maximally fast”
          </text>
          <rect x={200} y={320} width={340} height={90} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={370} y={374} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            “take zero risks”
          </text>
          {/* the collision */}
          <line x1={570} y1={235} x2={680} y2={290} stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <line x1={570} y1={365} x2={680} y2={310} stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <circle cx={700} cy={300} r={16} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <line x1={691} y1={291} x2={709} y2={309} stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <line x1={709} y1={291} x2={691} y2={309} stroke={colors.NEGATIVE} strokeWidth={2.5} />
          <text x={760} y={286} fill={colors.NEGATIVE} fontSize={19}>
            resolved implicitly
          </text>
          <text x={760} y={318} fill={colors.NEGATIVE} fontSize={19}>
            → rationalized afterward
          </text>
          <text x={760} y={358} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            Goodhart under conflicting objectives
          </text>
        </g>

        {/* ---------- ROOM (2,1) — §6.3 authority laundering ---------- */}
        <g transform={roomAt(2, 1)} opacity={chainU}>
          <RoomHeader
            title="6.3 — authority laundering"
            sub="illustrative cascade (Bikhchandani et al. 1992) · accuracy 0.7 · truth: UNSAFE"
          />
          {signals.map((sig, i) => {
            const u = clamp01(chainU * N_REV * 0.5 - i * 0.5);
            if (u <= 0) return null;
            const x = REV_X0 + i * REV_DX;
            const su = clamp01(sigU * N_REV - i);
            const au = clamp01(actU * N_REV - i);
            const act = actions[i];
            return (
              <g key={i} opacity={u}>
                {i > 0 && (
                  <line x1={x - REV_DX + 16} y1={REV_Y} x2={x - 16} y2={REV_Y}
                    stroke={colors.GRID} strokeWidth={1.5} />
                )}
                <circle cx={x} cy={REV_Y} r={16} fill={colors.PANEL}
                  stroke={au > 0.5 ? (act === 'S' ? colors.NEGATIVE : colors.POSITIVE) : colors.GRID}
                  strokeWidth={2} />
                <text x={x} y={REV_Y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={11}
                  fontFamily="monospace">
                  {i + 1}
                </text>
                {su > 0 && (
                  <g opacity={su}>
                    <rect x={x - 13} y={REV_Y + 30} width={26} height={20} rx={4}
                      fill={sig === 'U' ? colors.POSITIVE : colors.NEGATIVE} opacity={0.22} />
                    <text x={x} y={REV_Y + 44} textAnchor="middle" fontSize={10} fontWeight={600}
                      fill={sig === 'U' ? colors.POSITIVE : colors.NEGATIVE}>
                      {sig === 'U' ? 'unsafe' : 'safe'}
                    </text>
                  </g>
                )}
                {au > 0 && (
                  <g opacity={au}>
                    <rect x={x - 13} y={REV_Y - 56} width={26} height={20} rx={4}
                      fill={act === 'S' ? colors.NEGATIVE : colors.POSITIVE} opacity={0.3} />
                    <text x={x} y={REV_Y - 42} textAnchor="middle" fontSize={10} fontWeight={700}
                      fill={act === 'S' ? colors.NEGATIVE : colors.POSITIVE}>
                      {act === 'S' ? 'SAFE' : 'UNSAFE'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          <text x={REV_X0 - 26} y={REV_Y - 42} textAnchor="end" fill={colors.MUTED} fontSize={12}>
            public verdict →
          </text>
          <text x={REV_X0 - 26} y={REV_Y + 44} textAnchor="end" fill={colors.MUTED} fontSize={12}>
            private signal →
          </text>
          {tallyU > 0 && (
            <g opacity={tallyU}>
              <rect x={REV_X0 - 20} y={REV_Y + 92} width={800} height={40} rx={8}
                fill={colors.NEGATIVE} opacity={0.14} />
              <text x={REV_X0 - 2} y={REV_Y + 118} fill={colors.NEGATIVE} fontSize={16}
                fontFamily="monospace">
                public record: 16/16 SAFE · private signals after reviewer 2: {LATER_U}/14 said UNSAFE
              </text>
            </g>
          )}
          {reframeU > 0 && (
            <g opacity={reframeU}>
              <text x={900} y={REV_Y + 176} textAnchor="middle" fill={colors.WARM} fontSize={17}>
                enormous institutional weight
              </text>
              <text x={900} y={REV_Y + 204} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                almost no information
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (1,1) — the close, on an empty stage ---------- */}
        <g transform={roomAt(1, 1)} opacity={closeU}>
          <rect x={190} y={220} width={900} height={220} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Coherent from the inside, unsound from above
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            frame lock-in · premature coherence · mandate collapse · authority laundering
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            SSRN 6325939 §6 — cascade sim illustrative (Bikhchandani et al. 1992)
          </text>
        </g>
      </Camera>
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
