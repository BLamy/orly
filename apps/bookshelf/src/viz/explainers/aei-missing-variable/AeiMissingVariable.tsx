// SSRN 6325939 — "Adversarial Epistemic Incoherence (AEI): An Under-Modeled
// Failure Class for Advanced AI and Socio-Technical Decision Systems"
// (Jeremy B. Dixon, Independent Researcher). Chapter 1: the missing variable.
// Grounded in the paper's Abstract, §1 (Introduction), §3 (The Coherent-World
// Assumption), §4 (Aerospace Safety Culture example — Challenger/Columbia,
// citing Reason 1990; NRC 2011), and §7 (performance vs readiness).
// This is a position paper: everything here is reported as ITS claims.
//
// STAGING — every beat is drawn in its own ROOM on a 2-D world grid, and the
// camera travels between rooms. Rooms are 1600 apart horizontally and 900
// vertically, both larger than the 1280×720 viewport, so two rooms can NEVER
// share the frame: overlap is structurally impossible rather than fought off
// with opacity. Each room carries its own in-world header, so a zoom can never
// drag old content under a screen-fixed title.
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
// The room grid. Room (c, r) owns the local box 0..1280 × 0..720 translated to
// (c * ROOM_DX, r * ROOM_DY). Keep local content inside y ∈ [40, 610] so the
// player's caption pill (bottom ~12% of the screen) never covers it.
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

// Boustrophedon path: (0,0) → (1,0) → (2,0) → (2,1) → (1,1) → (0,1), so every
// move is a single-axis pan and the camera never crosses a room it has left.
// Zoom stays ≤ 1.08: at k the leftmost visible world x is 640 - 640/k, and the
// room header sits at x = 60, so anything tighter shaves the title.
const CAM_SCORES = camAt(0, 0);
const CAM_PAPER = camAt(1, 0);
const CAM_PILLARS = camAt(2, 0);
const CAM_SHUTTLE = camAt(2, 1, 1.06);
const CAM_READY = camAt(1, 1);
const CAM_CLOSE = camAt(0, 1);

const FIG = '/generated/ssrn-aei/figures';

// Benchmark bars (illustrative — the paper has no benchmark numbers; these
// stand for "high scores under stable framing", which is all §7 needs).
const BENCH = [
  { label: 'correctness', v: 0.94 },
  { label: 'helpfulness', v: 0.91 },
  { label: 'compliance', v: 0.96 },
];
const SCORE = { x: 330, y: 180, w: 620, h: 300 };

// The three assumptions §3 says evaluation implicitly makes.
const PILLARS = [
  { top: 'stable', bottom: 'objectives', x: 220 },
  { top: 'stable', bottom: 'authority', x: 400 },
  { top: 'stable', bottom: 'evaluators', x: 580 },
];
const PILLAR_TOP = 190;
const PILLAR_H = 190;
const PILLAR_W = 150;
// deterministic zigzag for the crack polyline
const CRACK_PTS = [0, 8, -6, 10, -4, 7];

const SHUTTLE_LINES = [
  'fragmented authority',
  'schedule pressure',
  'normalization of deviance',
  'suppressed dissent',
  'refusal treated as failure',
];

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  panelU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  paperU: ChannelRef<number>;
  abstractU: ChannelRef<number>;
  pillarsU: ChannelRef<number>;
  crackU: ChannelRef<number>;
  shuttleU: ChannelRef<number>;
  shuttleLinesU: ChannelRef<number>;
  shuttleNoteU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  dotU: ChannelRef<number>;
  readyFigU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SCORES, cameraInterp);
  const panelU = tl.channel('panelU', 0);
  const barsU = tl.channel('barsU', 0);
  const paperU = tl.channel('paperU', 0);
  const abstractU = tl.channel('abstractU', 0);
  const pillarsU = tl.channel('pillarsU', 0);
  const crackU = tl.channel('crackU', 0);
  const shuttleU = tl.channel('shuttleU', 0);
  const shuttleLinesU = tl.channel('shuttleLinesU', 0);
  const shuttleNoteU = tl.channel('shuttleNoteU', 0);
  const axesU = tl.channel('axesU', 0);
  const dotU = tl.channel('dotU', 0);
  const readyFigU = tl.channel('readyFigU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — ROOM (0,0): a system that passes everything.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is a system that passes its evaluations. Correct, helpful, compliant — every score is green. By everything we usually measure, this system is ready to deploy.',
  });
  tl.tween(panelU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(barsU, 1, { at: 1.8, dur: 1.8, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — ROOM (1,0): the paper itself, on stage.
  tl.caption({
    at: 6.8,
    dur: 6.4,
    text: 'A position paper on the S S R N preprint server argues that this picture is missing a variable. Many failures blamed on weak intelligence or misalignment, it claims, come from somewhere upstream: the environment the system is deployed into.',
  });
  // Each room change starts ~1.5s BEFORE its line, so the camera has settled
  // and the room is dressed by the time the narration reaches it.
  tl.tween(cam, CAM_PAPER, { at: 5.3, dur: 1.4, ease: ease.move });
  tl.tween(paperU, 1, { at: 5.6, dur: 1.0, ease: ease.enter });
  tl.tween(abstractU, 1, { at: 6.2, dur: 1.0, ease: ease.enter });
  tl.hold(13.2, 0.7);

  // Beat 3 — ROOM (2,0): the coherent-world assumption.
  tl.caption({
    at: 13.9,
    dur: 6.2,
    text: 'Every one of those green scores rests on quiet assumptions. That the objectives stay stable. That authority stays stable. That the evaluators stay stable. The paper calls this the coherent world assumption.',
  });
  tl.tween(cam, CAM_PILLARS, { at: 12.4, dur: 1.4, ease: ease.move });
  tl.tween(pillarsU, 1, { at: 12.7, dur: 2.2, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — same room: the pillars crack. One object, transformed.
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'Real deployments routinely violate it. Mandates shift. Multiple principals disagree about who is in charge. Evaluation criteria move after the outcomes are visible. The scores stay green — the ground under them does not.',
  });
  tl.tween(crackU, 1, { at: 19.8, dur: 2.4, ease: ease.move });
  tl.hold(27.2, 0.7);

  // Beat 5 — ROOM (2,1): the non-AI anchor (§4).
  tl.caption({
    at: 27.9,
    dur: 6.6,
    text: 'The paper anchors this with a case that has nothing to do with AI. Investigations of the Challenger and Columbia shuttle disasters described fragmented authority, schedule pressure, and suppressed dissent.',
  });
  tl.tween(cam, CAM_SHUTTLE, { at: 26.4, dur: 1.4, ease: ease.move });
  tl.tween(shuttleU, 1, { at: 26.7, dur: 0.9, ease: ease.enter });
  tl.tween(shuttleLinesU, 1, { at: 27.2, dur: 2.8, ease: ease.linear });

  // Beat 6 — same room: the twist under the list.
  tl.caption({
    at: 34.5,
    dur: 6.2,
    text: 'The launch decisions were internally coherent at the time — formal compliance and reassuring narratives stood in for unresolved uncertainty. And refusal or delay was treated as failure. Nobody needed to be a villain.',
  });
  tl.tween(shuttleNoteU, 1, { at: 33.8, dur: 1.0, ease: ease.enter });
  tl.hold(40.7, 0.7);

  // Beat 7 — ROOM (1,1): performance vs readiness (§7), next to the real text.
  tl.caption({
    at: 41.4,
    dur: 6.4,
    text: 'So the paper draws a hard line between two different questions. Performance asks: can the system produce the desired outputs while the framing holds still? Readiness asks: does it stay coherent when the framing stops holding still?',
  });
  tl.tween(cam, CAM_READY, { at: 39.9, dur: 1.4, ease: ease.move });
  tl.tween(axesU, 1, { at: 40.2, dur: 1.3, ease: ease.draw });
  tl.tween(dotU, 1, { at: 40.6, dur: 1.0, ease: ease.move });
  tl.tween(readyFigU, 1, { at: 40.8, dur: 0.9, ease: ease.enter });
  tl.hold(47.8, 0.7);

  // Beat 8 — ROOM (0,1): a clean, empty room for the closing card.
  tl.caption({
    at: 48.5,
    dur: 6.0,
    text: 'The condition where those two answers come apart has a name in this paper: adversarial epistemic incoherence. The next chapters unpack the regime that produces it — and the eight ways the paper says systems fail inside it.',
  });
  tl.tween(cam, CAM_CLOSE, { at: 47.0, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 47.3, dur: 1.0, ease: ease.enter });
  tl.hold(54.5, 1.2);

  return {
    tl, cam, panelU, barsU, paperU, abstractU, pillarsU, crackU,
    shuttleU, shuttleLinesU, shuttleNoteU, axesU, dotU, readyFigU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/aei-missing-variable/overrides.json',
  slug: 'aei-missing-variable',
};

/** In-world room header — travels with its room, so a zoom can't collide it. */
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
  const panelU = s.get(scene.panelU);
  const barsU = s.get(scene.barsU);
  const paperU = s.get(scene.paperU);
  const abstractU = s.get(scene.abstractU);
  const pillarsU = s.get(scene.pillarsU);
  const crackU = s.get(scene.crackU);
  const shuttleU = s.get(scene.shuttleU);
  const shuttleLinesU = s.get(scene.shuttleLinesU);
  const shuttleNoteU = s.get(scene.shuttleNoteU);
  const axesU = s.get(scene.axesU);
  const dotU = s.get(scene.dotU);
  const readyFigU = s.get(scene.readyFigU);
  const closeU = s.get(scene.closeU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* ---------- ROOM (0,0) — the green scoreboard ---------- */}
        <g transform={roomAt(0, 0)} opacity={panelU}>
          <RoomHeader
            title="The missing variable"
            sub="SSRN 6325939 — Adversarial Epistemic Incoherence · Jeremy B. Dixon"
          />
          <rect x={SCORE.x} y={SCORE.y} width={SCORE.w} height={SCORE.h} rx={14}
            fill={colors.PANEL} stroke={colors.GRID} />
          <text x={SCORE.x + 26} y={SCORE.y + 42} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            controlled evaluation — stable framing
          </text>
          {BENCH.map((b, i) => {
            const u = clamp01(barsU * BENCH.length - i);
            const y = SCORE.y + 78 + i * 66;
            const w = 300 * b.v * u;
            return (
              <g key={b.label}>
                <text x={SCORE.x + 176} y={y + 22} textAnchor="end" fill={colors.MUTED} fontSize={15}>
                  {b.label}
                </text>
                <rect x={SCORE.x + 194} y={y} width={Math.max(w, 1)} height={30} rx={5}
                  fill={colors.POSITIVE} opacity={0.7} />
                <text x={SCORE.x + 204 + w} y={y + 22} fill={colors.POSITIVE} fontSize={16}
                  fontFamily="monospace" opacity={u}>
                  {Math.round(b.v * 100)}
                </text>
              </g>
            );
          })}
        </g>

        {/* ---------- ROOM (1,0) — the paper, photographed ---------- */}
        <g transform={roomAt(1, 0)}>
          <RoomHeader title="The claim" sub="SSRN 6325939 · title page and abstract" u={paperU} />
          <Figure
            src={`${FIG}/title-block.png`}
            x={90} y={140} w={520} h={196}
            reveal={paperU} opacity={paperU}
            caption="the paper itself — SSRN 6325939"
          />
          <Figure
            src={`${FIG}/abstract.png`}
            x={670} y={140} w={470} h={363}
            reveal={abstractU} opacity={abstractU}
            accent={colors.WARM}
            caption="abstract — the missing upstream failure class"
          />
          <text x={90} y={430} fill={colors.MUTED} fontSize={15} opacity={abstractU}>
            “a distinct, upstream failure class
          </text>
          <text x={90} y={456} fill={colors.MUTED} fontSize={15} opacity={abstractU}>
            is being under-modeled”
          </text>
        </g>

        {/* ---------- ROOM (2,0) — the coherent-world assumption ---------- */}
        <g transform={roomAt(2, 0)} opacity={pillarsU}>
          <RoomHeader title="The coherent-world assumption" sub="SSRN 6325939 §3" />
          {PILLARS.map((p, i) => {
            const u = clamp01(pillarsU * PILLARS.length - i);
            if (u <= 0) return null;
            const cx = p.x;
            const shear = crackU * (i - 1) * 14;
            return (
              <g key={p.bottom} opacity={u}
                transform={`translate(${shear}, ${crackU * 8}) rotate(${crackU * (i - 1) * 4}, ${cx}, ${PILLAR_TOP + PILLAR_H})`}>
                <rect x={cx - PILLAR_W / 2} y={PILLAR_TOP} width={PILLAR_W} height={PILLAR_H} rx={10}
                  fill={colors.PANEL}
                  stroke={crackU > 0.3 ? colors.NEGATIVE : colors.ACCENT}
                  strokeWidth={1.5}
                  opacity={1 - 0.3 * crackU}
                />
                <text x={cx} y={PILLAR_TOP + 40} textAnchor="middle"
                  fill={crackU > 0.3 ? colors.NEGATIVE : colors.ACCENT} fontSize={15} fontWeight={600}>
                  {p.top}
                </text>
                <text x={cx} y={PILLAR_TOP + 62} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                  {p.bottom}
                </text>
                {crackU > 0 && (
                  <polyline
                    points={CRACK_PTS.map((dx, k) =>
                      `${cx + dx * crackU},${PILLAR_TOP + 88 + k * (PILLAR_H - 100) / (CRACK_PTS.length - 1)}`).join(' ')}
                    fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={crackU}
                  />
                )}
              </g>
            );
          })}
          {crackU > 0.4 && (
            <text x={400} y={PILLAR_TOP + PILLAR_H + 56} textAnchor="middle"
              fill={colors.NEGATIVE} fontSize={16} opacity={(crackU - 0.4) / 0.6}>
              the coherent-world assumption, violated
            </text>
          )}
          <Figure
            src={`${FIG}/coherent-world.png`}
            x={720} y={230} w={500} h={159}
            reveal={pillarsU} opacity={pillarsU}
            accent={colors.WARM}
            caption="§3 — what assurance practice presumes"
          />
        </g>

        {/* ---------- ROOM (2,1) — aerospace safety culture ---------- */}
        <g transform={roomAt(2, 1)} opacity={shuttleU}>
          <RoomHeader title="A case with no AI in it" sub="SSRN 6325939 §4 — Reason 1990; NRC 2011" />
          <rect x={300} y={150} width={680} height={280} rx={14} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={330} y={190} fill={colors.WARM} fontSize={17} fontWeight={600}>
            aerospace safety culture (non-AI)
          </text>
          <text x={330} y={214} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
            Challenger · Columbia
          </text>
          {SHUTTLE_LINES.map((l, i) => {
            const u = clamp01(shuttleLinesU * SHUTTLE_LINES.length - i);
            if (u <= 0) return null;
            const y = 248 + i * 36;
            return (
              <g key={l} opacity={u}>
                <circle cx={344} cy={y} r={4} fill={colors.WARM} />
                <text x={362} y={y + 5} fill={colors.TEXT} fontSize={16}>
                  {l}
                </text>
              </g>
            );
          })}
          {shuttleNoteU > 0 && (
            <g opacity={shuttleNoteU}>
              <text x={640} y={478} textAnchor="middle" fill={colors.NEGATIVE} fontSize={17}>
                internally coherent at the time — and epistemically unsound
              </text>
              <text x={640} y={506} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
                nobody had to be a villain
              </text>
            </g>
          )}
        </g>

        {/* ---------- ROOM (1,1) — performance vs readiness ---------- */}
        <g transform={roomAt(1, 1)} opacity={axesU}>
          <RoomHeader title="Performance is not readiness" sub="SSRN 6325939 §7" />
          <g transform="translate(140, 180)">
            <line x1={0} y1={280} x2={470 * axesU} y2={280} stroke={colors.GRID} strokeWidth={1.5} />
            <line x1={0} y1={280} x2={0} y2={280 - 250 * axesU} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={466} y={306} textAnchor="end" fill={colors.ACCENT} fontSize={15}>
              performance — stable framing
            </text>
            <text x={-14} y={20} textAnchor="start" fill={colors.WARM} fontSize={15}
              transform="rotate(-90, -14, 20)">
              readiness
            </text>
            {dotU > 0 && (
              <g opacity={dotU}>
                <circle cx={410} cy={258} r={10} fill={colors.POSITIVE} />
                <text x={410} y={224} textAnchor="middle" fill={colors.POSITIVE} fontSize={14}>
                  high score
                </text>
                <text x={410} y={244} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
                  readiness: unmeasured
                </text>
              </g>
            )}
          </g>
          <Figure
            src={`${FIG}/readiness.png`}
            x={700} y={250} w={500} h={165}
            reveal={readyFigU} opacity={readyFigU}
            accent={colors.WARM}
            caption="§7 — the paper's own wording"
          />
        </g>

        {/* ---------- ROOM (0,1) — the close, on an empty stage ---------- */}
        <g transform={roomAt(0, 1)} opacity={closeU}>
          <rect x={190} y={200} width={900} height={230} rx={16}
            fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={268} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={600}>
            Performance ≠ readiness
          </text>
          <text x={640} y={314} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            performance: desired outputs under stable framing
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            readiness: coherence when framing, authority, incentives destabilize
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            Adversarial Epistemic Incoherence · SSRN 6325939 · §1, §3, §7
          </text>
        </g>
      </Camera>
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
