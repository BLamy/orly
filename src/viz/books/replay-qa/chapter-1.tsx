// Book scene — replay-qa, chapter 1: "The Expensive Claim".
//
// The asymmetry of belief, made visible. ONE persistent object — a cloud of
// ~340 "moments" (every state the app can be in) — carries the whole chapter:
// one dot turns red and flies to the "it's broken" card (an existential claim
// needs exactly one witness, so it is cheap to believe); a handful turn green
// under the "it works" card (a universal claim — spot checks barely dent it);
// then the entire cloud compresses into a horizontal tape — a Replay
// recording, the only currency that can pay for the expensive claim.
//
// Grounded in replayio/loop-qa: AppSpec.md (a project = a URL to test; every
// run produces a Replay recording; bugs link replay_recording_id) and
// scripts/seed-db.ts (proj-acme-store · 'Acme Online Store' ·
// https://acme-store.example.com, recording b5f2a3c1-7d4e-…).
import { CAMERA_HOME, Camera, MathLabel, Timeline, colors, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage 1280×720; the bottom ~12% (y ≳ 630) stays clear for captions. */
const BROKEN = { x: 110, y: 108, w: 400, h: 96 };
const WORKS = { x: 770, y: 108, w: 400, h: 96 };
const CLOUD_C = { x: 640, y: 408 };
const TAPE = { x: 720, y: 452, w: 460, rows: 3, pitch: 4.6, rowGap: 9 };
const PROJ_CARD = { x: 110, y: 430, w: 400, h: 118 };
const CHIP = { x: 950, y: 530 };

const CAM_BROKEN: CameraState = { x: 410, y: 300, k: 1.22 };
const CAM_WORKS: CameraState = { x: 880, y: 300, k: 1.18 };
const CAM_WIDE: CameraState = { x: 640, y: 356, k: 1.0 };
const CAM_CLOSE: CameraState = { x: 660, y: 380, k: 1.04 };

/* -------------------------------------------------- precomputed particles */
const N = 340;
const rand = mulberry32(11);
const g = gaussian(rand);

/** Formation A — the scattered cloud of app moments. */
const SX = new Float64Array(N);
const SY = new Float64Array(N);
for (let i = 0; i < N; i++) {
  SX[i] = Math.min(1200, Math.max(80, CLOUD_C.x + g() * 210));
  SY[i] = Math.min(600, Math.max(250, CLOUD_C.y + g() * 88));
}

/** Formation B — the tape: rows of tightly packed moments under "it works". */
const TX = new Float64Array(N);
const TY = new Float64Array(N);
{
  const perRow = Math.ceil(N / TAPE.rows);
  for (let i = 0; i < N; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    TX[i] = TAPE.x + col * (TAPE.w / perRow) + TAPE.pitch / 2;
    TY[i] = TAPE.y + row * TAPE.rowGap;
  }
}

/** Per-particle staggers, all drawn from the one seed. */
const STAG_IN = new Float64Array(N);
const STAG_TAPE = new Float64Array(N);
for (let i = 0; i < N; i++) STAG_IN[i] = rand();
for (let i = 0; i < N; i++) STAG_TAPE[i] = rand();

/** The one red witness — the failing moment. */
const WITNESS = 57;
const WITNESS_TARGET = { x: BROKEN.x + BROKEN.w / 2, y: BROKEN.y + BROKEN.h + 46 };
/** Witness's slot on the tape — pinned near the end of the recording. */
TX[WITNESS] = TAPE.x + TAPE.w * 0.94;
TY[WITNESS] = TAPE.y + TAPE.rowGap;

/** The spot checks — the few moments a manual pass actually looks at. */
const CHECKS: number[] = [];
for (let k = 0; k < 12; k++) CHECKS.push((k * 29 + 7) % N);
const CHECK_RANK = new Map<number, number>(CHECKS.map((i, k) => [i, k]));

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const brokenE = tl.channel('brokenCard', 0);
  const worksE = tl.channel('worksCard', 0);
  const cloudU = tl.channel('cloudU', 0); // moments rain into the scatter
  const witnessU = tl.channel('witnessU', 0); // the red dot flies to "broken"
  const acceptU = tl.channel('acceptStamp', 0);
  const existsTexU = tl.channel('existsTex', 0);
  const forallTexU = tl.channel('forallTex', 0);
  const checksU = tl.channel('checksU', 0); // the few green spot checks
  const unprovenU = tl.channel('unprovenStamp', 0);
  const projU = tl.channel('projCard', 0);
  const tapeU = tl.channel('tapeU', 0); // THE morph: cloud → recording
  const tapeGlowU = tl.channel('tapeGlow', 0);
  const chipU = tl.channel('recChip', 0);
  const texFade = tl.channel('texFade', 1);
  const dimU = tl.channel('dimU', 0); // close: cards fade to a whisper

  /* — beat 1 · two sentences that look symmetrical — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Here are two sentences about the same checkout page: it is broken, and it works. They look symmetrical. They are not.',
  });
  tl.tween(brokenE, 1, { at: t - 5.4, dur: 0.7, ease: ease.enter });
  tl.tween(worksE, 1, { at: t - 4.9, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 2 · the space of moments — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Picture every moment your app can be in. Every page, every click, every request in flight — each one is a dot.',
  });
  tl.tween(cloudU, 1, { at: t - 5.4, dur: 3.4, ease: ease.linear });
  t = tl.hold(t, 0.7);

  /* — beat 3 · broken is existential: one witness — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'To believe the checkout is broken, you need exactly one bad moment. One witness, anywhere in the cloud.',
  });
  tl.tween(cam, CAM_BROKEN, { at: t - 5.4, dur: 1.3, ease: ease.move });
  tl.tween(witnessU, 1, { at: t - 4.2, dur: 1.4, ease: ease.move });
  tl.tween(existsTexU, 1, { at: t - 2.6, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'So a bug report is cheap to accept. Worst case, you go look at that one moment and it is fine. Believing broken costs almost nothing.',
  });
  tl.tween(acceptU, 1, { at: t - 4.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* — beat 4 · works is universal: every dot — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Now the other sentence. It works is a claim about every moment in this cloud — each one of them has to come out fine.',
  });
  tl.tween(cam, CAM_WORKS, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(forallTexU, 1, { at: t - 3.4, dur: 0.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'A manual pass turns a few dots green and leaves the rest unexamined. That is why works, fixed, and the run is green are the expensive claims — they need evidence, in bulk.',
  });
  tl.tween(checksU, 1, { at: t - 5.8, dur: 2.6, ease: ease.linear });
  tl.tween(unprovenU, 1, { at: t - 2.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.7);

  /* — beat 5 · the product: a project is a URL — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'This asymmetry is the problem LoopQA is built around. A project is just a URL — a web app you point the system at.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(existsTexU, 0, { at: t - 5.2, dur: 0.6, ease: ease.move });
  tl.tween(projU, 1, { at: t - 3.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 6 · the morph: the cloud becomes a recording — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'It sends an agent to walk that app in a real browser — and every run produces a Replay recording of the entire session.',
  });
  tl.tween(forallTexU, 0, { at: t - 5.6, dur: 0.6, ease: ease.move });
  tl.tween(tapeU, 1, { at: t - 4.8, dur: 3.6, ease: ease.linear });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The moments stop being hypothetical. They are captured, in order, on a tape you can re-open — including the bad one.',
  });
  tl.tween(chipU, 1, { at: t - 3.2, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 7 · the promise — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'So the promise is not we find bugs. The promise is stricter: nothing gets believed working without a recording behind it.',
  });
  tl.tween(tapeGlowU, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 8 · close, clean — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The tape is the spine of everything that follows. Next: how one run lays it down.',
  });
  tl.tween(dimU, 1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(texFade, 0, { at: t - 4.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_CLOSE, { at: t - 4.6, dur: 2.2, ease: ease.move });
  tl.hold(t, 1.2);

  return {
    tl,
    cam,
    brokenE,
    worksE,
    cloudU,
    witnessU,
    acceptU,
    existsTexU,
    forallTexU,
    checksU,
    unprovenU,
    projU,
    tapeU,
    tapeGlowU,
    chipU,
    texFade,
    dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------- per-frame particle compute */
const IN_SPREAD = 5;
const TAPE_SPREAD = 0.9;
const HOP = 24;

const PTS: ParticlePoint[] = Array.from({ length: N }, () => ({
  x: 0,
  y: 0,
  r: 2.4,
  alpha: 0,
  color: colors.MUTED,
}));
const OUT: ParticlePoint[] = [];

function computeParticles(s: SceneState): ParticlePoint[] {
  const cu = s.get(scene.cloudU);
  OUT.length = 0;
  if (cu <= 0) return OUT;
  const wu = ease.move(clamp01(s.get(scene.witnessU)));
  const ck = s.get(scene.checksU);
  const tp = clamp01(s.get(scene.tapeU));

  for (let i = 0; i < N; i++) {
    const f = clamp01(cu * (1 + IN_SPREAD) - STAG_IN[i] * IN_SPREAD);
    if (f <= 0) continue;

    let x = SX[i];
    let y = SY[i] + 26 * (1 - ease.move(f));

    if (i === WITNESS && wu > 0) {
      // the witness flies up to the "broken" card
      x = lerp(x, WITNESS_TARGET.x, wu);
      y = lerp(y, WITNESS_TARGET.y, wu) - 30 * Math.sin(Math.PI * wu);
    }

    if (tp > 0) {
      const u = ease.move(clamp01(tp * (1 + TAPE_SPREAD) - STAG_TAPE[i] * TAPE_SPREAD));
      if (u > 0) {
        x = lerp(x, TX[i], u);
        y = lerp(y, TY[i], u) - HOP * Math.sin(Math.PI * u);
      }
    }

    const pt = PTS[i];
    pt.x = x;
    pt.y = y;
    pt.r = i === WITNESS ? 4.2 : 2.4;
    pt.alpha = 0.85 * Math.min(1, f * 4);
    if (i === WITNESS && wu > 0.05) {
      pt.color = colors.NEGATIVE;
      pt.alpha = 1;
    } else {
      const rank = CHECK_RANK.get(i);
      const checked = rank !== undefined && ck * 14 - rank > 1;
      pt.color = checked ? colors.POSITIVE : colors.MUTED;
      if (checked) pt.alpha = 1;
    }
    OUT.push(pt);
  }
  return OUT;
}

/* -------------------------------------------------- local subcomponents */

function ClaimCard({
  box,
  text,
  enter,
  dim,
}: {
  box: { x: number; y: number; w: number; h: number };
  text: string;
  enter: number;
  dim: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${box.x}, ${box.y + (1 - e) * 12})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={box.w} height={box.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text
        x={box.w / 2}
        y={box.h / 2 + 7}
        textAnchor="middle"
        fill={colors.TEXT}
        fontSize={21}
        fontWeight={600}
      >
        {text}
      </text>
    </g>
  );
}

function Stamp({
  x,
  y,
  label,
  color,
  u,
  dim,
}: {
  x: number;
  y: number;
  label: string;
  color: string;
  u: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = label.length * 11 + 36;
  return (
    <g transform={`translate(${x}, ${y}) rotate(-7) scale(${0.7 + 0.3 * uu})`} opacity={uu * (1 - 0.85 * dim)}>
      <rect x={-w / 2} y={-19} width={w} height={38} rx={6} fill={colors.BG} opacity={0.55} />
      <rect x={-w / 2} y={-19} width={w} height={38} rx={6} fill="none" stroke={color} strokeWidth={3} />
      <text y={6} textAnchor="middle" fill={color} fontSize={17} fontWeight={800} letterSpacing={2.5} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/** The project card — a project is a URL (AppSpec: projects.target_url). */
function ProjectCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = PROJ_CARD;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu * (1 - 0.85 * dim)}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} opacity={0.95} />
      <text x={20} y={30} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        project
      </text>
      <text x={20} y={56} fill={colors.TEXT} fontSize={17} fontWeight={700}>
        Acme Online Store
      </text>
      <text x={20} y={80} fill={colors.ACCENT} fontSize={12.5} fontFamily={mono}>
        target_url: https://acme-store.example.com
      </text>
      <text x={20} y={100} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        id: proj-acme-store
      </text>
    </g>
  );
}

/** The recording-id chip — the tape now has a name it can be cited by. */
function RecordingChip({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const label = 'replay_recording_id: b5f2a3c1-7d4e…';
  const w = label.length * 6.6 + 28;
  return (
    <g transform={`translate(${CHIP.x}, ${CHIP.y + (1 - uu) * 8})`} opacity={uu}>
      <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
      <circle cx={-w / 2 + 14} r={4} fill={colors.NEGATIVE} />
      <text x={7} y={4.5} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const texF = clamp01(s.get(scene.texFade));
  const tapeGlow = clamp01(s.get(scene.tapeGlowU));
  const tp = clamp01(s.get(scene.tapeU));

  return (
    <>
      <ClaimCard box={BROKEN} text={'“The checkout is broken.”'} enter={s.get(scene.brokenE)} dim={dim} />
      <ClaimCard box={WORKS} text={'“The checkout works.”'} enter={s.get(scene.worksE)} dim={dim} />
      <Stamp
        x={BROKEN.x + BROKEN.w - 66}
        y={BROKEN.y + BROKEN.h - 12}
        label="BELIEVED"
        color={colors.POSITIVE}
        u={s.get(scene.acceptU)}
        dim={dim}
      />
      <Stamp
        x={WORKS.x + WORKS.w - 70}
        y={WORKS.y + WORKS.h - 12}
        label="UNPROVEN"
        color={colors.WARM}
        u={s.get(scene.unprovenU)}
        dim={dim}
      />

      {/* the persistent object: 340 moments — cloud, then tape */}
      <ParticleCloud state={s} compute={computeParticles} />

      {/* tape frame + glow, once the morph has formed it */}
      {tp > 0.55 && (
        <g opacity={clamp01((tp - 0.55) * 4)}>
          <rect
            x={TAPE.x - 12}
            y={TAPE.y - 12}
            width={TAPE.w + 24}
            height={TAPE.rows * TAPE.rowGap + 16}
            rx={9}
            fill="none"
            stroke={tapeGlow > 0 ? colors.WARM : colors.GRID}
            strokeWidth={1.5 + tapeGlow}
            opacity={0.5 + 0.5 * tapeGlow}
          />
          <text x={TAPE.x - 12} y={TAPE.y - 22} fill={colors.MUTED} fontSize={12}>
            the recording — every moment, in order
          </text>
        </g>
      )}

      <MathLabel
        tex={'\\exists\\,t:\\ \\mathrm{fail}(t)'}
        x={BROKEN.x + BROKEN.w / 2}
        y={BROKEN.y + BROKEN.h + 96}
        fontSize={22}
        color={colors.NEGATIVE}
        opacity={s.get(scene.existsTexU) * texF}
      />
      <MathLabel
        tex={'\\forall\\,t:\\ \\mathrm{pass}(t)'}
        x={WORKS.x + WORKS.w / 2}
        y={WORKS.y + WORKS.h + 56}
        fontSize={22}
        color={colors.WARM}
        opacity={s.get(scene.forallTexU) * texF}
      />

      <ProjectCard u={s.get(scene.projU)} dim={dim} />
      <RecordingChip u={s.get(scene.chipU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
