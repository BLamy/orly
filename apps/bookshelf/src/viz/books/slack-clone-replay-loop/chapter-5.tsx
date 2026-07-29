// The Loop, Closed
//
// Backed by: scripts/record-two-replays.mjs end to end — the whole script is
// one loop: spawn emulators + app, waitForHttp, snapshot replayio list, run
// the two-worker Playwright config, diff, gate (>= 2 new), upload, weld the
// MP4, write recordings/latest.json — and the finally block
// (await Promise.all([stop(app), stop(emulator)])) that tears the world down
// no matter what. The artifacts outlive the world that produced them.
//
// Machine: the six stops of the loop on a LoopRing, the run packet making
// its lap while recap frames of chapters one through four light up in turn.
// Then the finally block: the world's nodes power off around the ring, and
// only the evidence cards remain lit.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { LoopRing } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const RING = { cx: 420, cy: 330, r: 190 };
const STOPS = [
  { label: 'emulators + app up', color: colors.TEAL },
  { label: 'health check', color: colors.WARM },
  { label: 'two witnesses record', color: colors.ACCENT },
  { label: 'diff: only new counts', color: colors.SECONDARY },
  { label: 'upload the evidence', color: colors.POSITIVE },
  { label: 'weld the film', color: colors.WARM },
];

const EVIDENCE = { x: 880, y: 150, w: 320, rowH: 84 };

const CAM_RING: CameraState = { x: 430, y: 330, k: 1.14 };
const CAM_EVIDENCE: CameraState = { x: 880, y: 330, k: 1.16 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

const EVIDENCE_CARDS = [
  { title: 'replay recording — Ada', sub: 'app.replay.io/recording/…', color: colors.ACCENT },
  { title: 'replay recording — Linus', sub: 'app.replay.io/recording/…', color: colors.SECONDARY },
  { title: 'side-by-side film', sub: 'recordings/replay-<ts>.mp4', color: colors.POSITIVE },
  { title: 'the receipt', sub: 'recordings/latest.json', color: colors.WARM },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const orbitU = tl.channel('orbitU', 0); // laps around the loop
  const evidenceU = tl.channel('evidenceU', 0); // 0..4 cards light up
  const finallyU = tl.channel('finallyU', 0); // the teardown
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · name the loop — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Step back, and the whole book is one machine. Six stops, one lap, one command — and it is the same loop the previous two books taught, with a real app in the middle.',
  });
  tl.tween(cam, CAM_RING, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(ringU, 1, { at: t - 4.8, dur: 1.6, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the first half of the lap — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The lap starts by building a sealed world and refusing to move until it answers. Then two recording browsers hold one conversation across a durable stream.',
  });
  tl.tween(orbitU, 0.45, { at: t - 5.4, dur: 5.0, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 3 · the second half — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Then the skeptical half: count only recordings that did not exist before, demand two, upload them deliberately, and weld the films into one you can watch.',
  });
  tl.tween(orbitU, 1, { at: t - 5.4, dur: 5.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 4 · what the lap leaves behind — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'Every lap deposits the same four artifacts: two recordings a critic can interrogate, one film a human can watch, and one receipt that points at all of it.',
  });
  tl.tween(cam, CAM_EVIDENCE, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(evidenceU, 4, { at: t - 4.6, dur: 3.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the finally block — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'And then the world is destroyed on purpose. A finally block stops the app and the emulators whether the run passed or threw. Nothing lingers to contaminate the next lap.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(finallyU, 1, { at: t - 4.2, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the doctrine, restated — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'That is the doctrine in one sentence: the world is disposable, the evidence is not. A green checkmark asks for your trust; this loop hands you two recordings and a film instead.',
  });
  t = tl.hold(t, 0.4);

  /* — beat 7 · recap the journey — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'You watched a command build a sealed world, two witnesses share one room, a diff insist the evidence was new, and a welder make it watchable. Run the command again, and the loop closes again.',
  });
  tl.tween(dimU, 1, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.2);

  return { tl, cam, ringU, orbitU, evidenceU, finallyU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function EvidenceCards({ u, dim }: { u: number; dim: number }) {
  if (u <= 0) return null;
  const { x, y, w, rowH } = EVIDENCE;
  return (
    <g opacity={1 - 0.25 * clamp01(dim)}>
      <text x={x} y={y - 18} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
        what survives the run
      </text>
      {EVIDENCE_CARDS.map((c, i) => {
        const cu = clamp01(u - i);
        if (cu <= 0) return null;
        return (
          <g key={c.title} transform={`translate(${x}, ${y + i * rowH + (1 - cu) * 10})`} opacity={cu}>
            <rect width={w} height={rowH - 16} rx={11} fill={colors.PANEL} stroke={c.color} strokeWidth={1.6} />
            <circle cx={22} cy={(rowH - 16) / 2} r={5} fill={c.color} />
            <text x={40} y={28} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
              {c.title}
            </text>
            <text x={40} y={48} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              {c.sub}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The finally block — the teardown card plus power-off Xs over the world stops. */
function FinallyBlock({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={1 - 0.85 * clamp01(dim)}>
      <g transform={`translate(${RING.cx}, ${640 - 62 + (1 - uu) * 10})`} opacity={uu}>
        <rect x={-230} y={-26} width={460} height={44} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
        <text y={2} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
          finally &#123; stop(app) · stop(emulator) &#125;
        </text>
      </g>
      {/* the world's stops power off; the evidence stops stay lit */}
      {[0, 1, 2].map((i) => {
        const a = -Math.PI / 2 + (i / STOPS.length) * Math.PI * 2;
        const sx = RING.cx + RING.r * Math.cos(a);
        const sy = RING.cy + RING.r * Math.sin(a);
        const su = clamp01(uu * 2.4 - i * 0.5);
        if (su <= 0) return null;
        return (
          <g key={i} transform={`translate(${sx}, ${sy})`} opacity={su}>
            <circle r={13} fill={colors.BG} opacity={0.85} />
            <g stroke={colors.NEGATIVE} strokeWidth={2.2} strokeLinecap="round">
              <line x1={-5.5} y1={-5.5} x2={5.5} y2={5.5} />
              <line x1={5.5} y1={-5.5} x2={-5.5} y2={5.5} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${330 + (1 - uu) * 12})`} opacity={uu}>
      <rect x={-360} y={-70} width={720} height={140} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-24} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
        The world is disposable. The evidence is not.
      </text>
      <text y={10} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily={MONO}>
        pnpm record:replay → 2 recordings · 1 film · latest.json
      </text>
      <text y={40} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
        Same loop as the wasm-vm and electric-forest books — with a real app inside.
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <LoopRing
        cx={RING.cx}
        cy={RING.cy}
        r={RING.r}
        stops={STOPS}
        u={s.get(scene.orbitU)}
        reveal={s.get(scene.ringU)}
        dim={dim}
        labelSize={12.5}
      />
      <text
        x={RING.cx}
        y={RING.cy + 6}
        textAnchor="middle"
        fill={colors.MUTED}
        fontSize={13}
        fontFamily={MONO}
        opacity={clamp01(s.get(scene.ringU)) * (1 - 0.85 * dim)}
      >
        pnpm record:replay
      </text>
      <EvidenceCards u={s.get(scene.evidenceU)} dim={dim} />
      <FinallyBlock u={s.get(scene.finallyU)} dim={dim} />
      <ClosingCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
