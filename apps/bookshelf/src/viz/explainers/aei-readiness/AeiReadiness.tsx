// SSRN 6325939 — Adversarial Epistemic Incoherence (Dixon). Chapter 5:
// readiness. Grounded in §7 (Evaluation Implications: From Performance to
// Readiness), §8 (Conclusion — the burden-of-proof line, quoted verbatim on
// screen and shown as the printed page), and §1 (the paper deliberately
// proposes no detection or mitigation mechanisms — "by internal consistency
// rather than omission").
//
// STAGING — one ROOM per beat-group on a 2-D world grid, 1600/900 apart, so
// no two subjects can share a frame and every beat lands on a clean stage.
import {
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
// room header sits at x = 60, so anything tighter shaves the title.
const CAM_CONST = camAt(0, 0, 1.04);
const CAM_DIAL = camAt(1, 0);
const CAM_NOFIX = camAt(2, 0, 1.04);
const CAM_BRIDGE = camAt(2, 1, 1.05);
const CAM_QUOTE = camAt(1, 1);

const FIG = '/generated/ssrn-aei/figures';

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
const CORE = { x: 640, y: 340 };
const ORBIT_R = 225;
const modePos = (i: number) => {
  const a = -Math.PI / 2 + (i / MODES.length) * Math.PI * 2;
  return { x: CORE.x + Math.cos(a) * ORBIT_R, y: CORE.y + Math.sin(a) * 0.72 * ORBIT_R };
};

// performance-vs-readiness panel (room 1,0)
const DIAL = { x: 150, y: 170, w: 560, h: 300 };

const BRIDGES = [
  'adversarial verification — never trust "it works" without evidence',
  'recordings over narratives — claims need receipts',
  'evals built to survive being gamed',
];

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  coreU: ChannelRef<number>;
  modesU: ChannelRef<number>;
  dialU: ChannelRef<number>;
  perfU: ChannelRef<number>;
  readyU: ChannelRef<number>;
  readyFigU: ChannelRef<number>;
  noFixU: ChannelRef<number>;
  bridgeU: ChannelRef<number>;
  bridgeNoteU: ChannelRef<number>;
  quoteU: ChannelRef<number>;
  concFigU: ChannelRef<number>;
  journeyU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CONST, cameraInterp);
  const coreU = tl.channel('coreU', 0);
  const modesU = tl.channel('modesU', 0);
  const dialU = tl.channel('dialU', 0);
  const perfU = tl.channel('perfU', 0);
  const readyU = tl.channel('readyU', 0);
  const readyFigU = tl.channel('readyFigU', 0);
  const noFixU = tl.channel('noFixU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const bridgeNoteU = tl.channel('bridgeNoteU', 0);
  const quoteU = tl.channel('quoteU', 0);
  const concFigU = tl.channel('concFigU', 0);
  const journeyU = tl.channel('journeyU', 0);

  // Beat 1 — ROOM (0,0): the whole threat model, reassembled.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Put the whole threat model back together. One regime in the middle — and the eight failure modes orbiting it, each one a different way a system stays locally coherent while drifting from the truth.',
  });
  tl.tween(coreU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(modesU, 1, { at: 1.6, dur: 3.4, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — ROOM (1,0): performance vs readiness, next to the printed §7.
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'The evaluation consequence, in the paper’s words: performance asks whether a system produces desired outputs under stable framing. Readiness asks whether it stays coherent when framing, authority, incentives, and evaluation destabilize.',
  });
  // Each room change starts ~1.5s BEFORE its line, so the camera has settled
  // and the room is dressed by the time the narration reaches it.
  tl.tween(cam, CAM_DIAL, { at: 5.3, dur: 1.4, ease: ease.move });
  tl.tween(dialU, 1, { at: 5.6, dur: 1.0, ease: ease.draw });
  tl.tween(perfU, 1, { at: 5.8, dur: 1.4, ease: ease.move });
  tl.tween(readyFigU, 1, { at: 6.2, dur: 0.9, ease: ease.enter });

  // Beat 3 — same room: the second line is simply not measured.
  tl.caption({
    at: 13.4,
    dur: 5.4,
    text: 'Every benchmark you have ever seen measures the first line. The second line is simply not measured — and if the regime is real, unmeasured is not the same as fine.',
  });
  tl.tween(readyU, 1, { at: 12.8, dur: 1.8, ease: ease.move });
  tl.hold(18.8, 0.7);

  // Beat 4 — ROOM (2,0): what the paper deliberately does not do.
  tl.caption({
    at: 19.5,
    dur: 6.2,
    text: 'Be careful what you take from this. The paper offers no experiments, no detection mechanism, no mitigation — deliberately. It is a position paper doing one job: naming a threat model that evaluation practice implicitly excludes.',
  });
  tl.tween(cam, CAM_NOFIX, { at: 18.0, dur: 1.4, ease: ease.move });
  tl.tween(noFixU, 1, { at: 18.3, dur: 1.0, ease: ease.enter });
  tl.hold(25.7, 0.7);

  // Beat 5 — ROOM (2,1): the shelf's answers.
  tl.caption({
    at: 26.4,
    dur: 6.6,
    text: 'And notice how much of this shelf already answers it from the other side. Adversarial verification instead of trusting green checkmarks. Recorded evidence instead of confident narrative. Evaluations designed to survive the models gaming them.',
  });
  tl.tween(cam, CAM_BRIDGE, { at: 24.9, dur: 1.4, ease: ease.move });
  tl.tween(bridgeU, 1, { at: 25.2, dur: 2.6, ease: ease.enter });

  // Beat 6 — same room: what they have in common.
  tl.caption({
    at: 33.2,
    dur: 4.8,
    text: 'Each of those practices is, in this paper’s vocabulary, a way of refusing to assume a coherent world. The paper supplies the name for what they are all defending against.',
  });
  tl.tween(bridgeNoteU, 1, { at: 32.6, dur: 1.0, ease: ease.enter });
  tl.hold(38.0, 0.8);

  // Beat 7 — ROOM (1,1): the burden of proof, verbatim, beside the real page.
  tl.caption({
    at: 38.8,
    dur: 6.4,
    text: 'The paper ends by handing the reader a burden of proof, and it is worth hearing exactly: if your evaluation and governance assume a coherent world, your readiness claims are built on insufficient assumptions.',
  });
  tl.tween(cam, CAM_QUOTE, { at: 37.3, dur: 1.4, ease: ease.move });
  tl.tween(quoteU, 1, { at: 37.6, dur: 1.0, ease: ease.enter });
  tl.tween(concFigU, 1, { at: 38.2, dur: 0.9, ease: ease.enter });

  // Beat 8 — same room: the journey, summed.
  tl.caption({
    at: 45.6,
    dur: 6.6,
    text: 'So the journey ran: one missing variable, five environmental properties, eight failure modes — and a single closing question. Not: how smart is your system. But: what happens to it when the world stops agreeing with itself.',
  });
  tl.tween(journeyU, 1, { at: 44.8, dur: 1.0, ease: ease.enter });
  tl.hold(50.8, 1.4);

  return {
    tl, cam, coreU, modesU, dialU, perfU, readyU, readyFigU,
    noFixU, bridgeU, bridgeNoteU, quoteU, concFigU, journeyU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-readiness/overrides.json',
  slug: 'aei-readiness',
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
  const coreU = s.get(scene.coreU);
  const modesU = s.get(scene.modesU);
  const dialU = s.get(scene.dialU);
  const perfU = s.get(scene.perfU);
  const readyU = s.get(scene.readyU);
  const readyFigU = s.get(scene.readyFigU);
  const noFixU = s.get(scene.noFixU);
  const bridgeU = s.get(scene.bridgeU);
  const bridgeNoteU = s.get(scene.bridgeNoteU);
  const quoteU = s.get(scene.quoteU);
  const concFigU = s.get(scene.concFigU);
  const journeyU = s.get(scene.journeyU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* ---------- ROOM (0,0) — the constellation ---------- */}
        <g transform={roomAt(0, 0)} opacity={coreU}>
          <RoomHeader title="From performance to readiness" sub="SSRN 6325939 §7–8" />
          {MODES.map((m, i) => {
            const u = clamp01(modesU * MODES.length - i);
            if (u <= 0) return null;
            const { x, y } = modePos(i);
            return (
              <g key={m} opacity={u}>
                <line x1={CORE.x} y1={CORE.y} x2={x} y2={y} stroke={colors.GRID} strokeWidth={1} opacity={0.6} />
                <circle cx={x} cy={y} r={9} fill={colors.SECONDARY} opacity={0.85} />
                <text x={x} y={y + (y > CORE.y ? 30 : -18)} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                  {m}
                </text>
              </g>
            );
          })}
          <circle cx={CORE.x} cy={CORE.y} r={58} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text x={CORE.x} y={CORE.y - 2} textAnchor="middle" fill={colors.WARM} fontSize={22} fontWeight={700}>
            AEI
          </text>
          <text x={CORE.x} y={CORE.y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
            the regime
          </text>
        </g>

        {/* ---------- ROOM (1,0) — performance vs readiness ---------- */}
        <g transform={roomAt(1, 0)} opacity={dialU}>
          <RoomHeader title="Two different questions" sub="SSRN 6325939 §7" />
          <rect x={DIAL.x} y={DIAL.y} width={DIAL.w} height={DIAL.h} rx={14}
            fill={colors.PANEL} stroke={colors.GRID} />
          {perfU > 0 && (
            <g opacity={perfU}>
              <text x={DIAL.x + 28} y={DIAL.y + 62} fill={colors.POSITIVE} fontSize={19} fontWeight={600}>
                performance
              </text>
              <rect x={DIAL.x + 28} y={DIAL.y + 80} width={(DIAL.w - 90) * 0.93 * perfU} height={24} rx={5}
                fill={colors.POSITIVE} opacity={0.7} />
              <text x={DIAL.x + 28} y={DIAL.y + 130} fill={colors.MUTED} fontSize={15}>
                desired outputs, stable framing — measured
              </text>
            </g>
          )}
          {readyU > 0 && (
            <g opacity={readyU}>
              <text x={DIAL.x + 28} y={DIAL.y + 198} fill={colors.WARM} fontSize={19} fontWeight={600}>
                readiness
              </text>
              <rect x={DIAL.x + 28} y={DIAL.y + 216} width={DIAL.w - 90} height={24} rx={5}
                fill="none" stroke={colors.WARM} strokeDasharray="6 6" />
              <text x={DIAL.x + 28 + (DIAL.w - 90) / 2} y={DIAL.y + 234} textAnchor="middle"
                fill={colors.WARM} fontSize={16} fontFamily="monospace">
                ?
              </text>
              <text x={DIAL.x + 28} y={DIAL.y + 268} fill={colors.MUTED} fontSize={15}>
                coherence under destabilization — unmeasured
              </text>
            </g>
          )}
          <Figure
            src={`${FIG}/readiness.png`}
            x={770} y={230} w={440} h={145}
            reveal={readyFigU} opacity={readyFigU}
            accent={colors.WARM}
            caption="§7 — as published"
          />
        </g>

        {/* ---------- ROOM (2,0) — what the paper deliberately omits ---------- */}
        <g transform={roomAt(2, 0)} opacity={noFixU}>
          <RoomHeader title="What this paper does not do" sub="SSRN 6325939 §1 — by internal consistency, not omission" />
          <rect x={280} y={200} width={720} height={230} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={600}>
            deliberately absent
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.MUTED} fontSize={20}>
            experiments · detection · mitigation
          </text>
          <text x={640} y={366} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontStyle="italic">
            “to surface a missing threat model”
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="monospace">
            a position paper, doing one job
          </text>
        </g>

        {/* ---------- ROOM (2,1) — the shelf's answers ---------- */}
        <g transform={roomAt(2, 1)} opacity={bridgeU}>
          <RoomHeader title="The shelf's answers" sub="in this paper's vocabulary" />
          {BRIDGES.map((b, i) => {
            const u = clamp01(bridgeU * BRIDGES.length - i);
            if (u <= 0) return null;
            const y = 220 + i * 72;
            return (
              <g key={b} opacity={u}>
                <circle cx={180} cy={y - 5} r={6} fill={colors.ACCENT} />
                <text x={206} y={y} fill={colors.TEXT} fontSize={19}>
                  {b}
                </text>
              </g>
            );
          })}
          {bridgeNoteU > 0 && (
            <g opacity={bridgeNoteU}>
              <text x={640} y={480} textAnchor="middle" fill={colors.WARM} fontSize={19}>
                all of them: a refusal to assume a coherent world
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (1,1) — the burden of proof ---------- */}
        <g transform={roomAt(1, 1)}>
          <g opacity={quoteU}>
            <rect x={80} y={160} width={680} height={260} rx={16} fill={colors.PANEL} stroke={colors.WARM} />
            <text x={420} y={222} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic">
              “If your evaluation and governance
            </text>
            <text x={420} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic">
              assume a coherent world,
            </text>
            <text x={420} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600} fontStyle="italic">
              your readiness claims are built
            </text>
            <text x={420} y={326} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={600} fontStyle="italic">
              on insufficient assumptions.”
            </text>
            <text x={420} y={378} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
              Jeremy B. Dixon · SSRN 6325939 §8
            </text>
          </g>
          <Figure
            src={`${FIG}/conclusion.png`}
            x={820} y={160} w={380} h={184}
            reveal={concFigU} opacity={concFigU}
            accent={colors.WARM}
            caption="§8 — the closing page"
          />
          {journeyU > 0 && (
            <g opacity={journeyU}>
              <text x={640} y={496} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
                1 missing variable · 5 environmental properties · 8 failure modes
              </text>
              <text x={640} y={540} textAnchor="middle" fill={colors.WARM} fontSize={18}>
                not “how smart is your system” — but what happens when the world stops agreeing with itself
              </text>
            </g>
          )}
        </g>
      </Camera>
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
