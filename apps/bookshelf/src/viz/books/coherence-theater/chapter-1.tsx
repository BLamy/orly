// Chapter 1 — The Orderly Failure.
//
// Grounded in the paper's abstract and Sections 1, 3, and 4 (SSRN 7212700,
// "Now Playing in Coherence Theaters Near You"). The REAL title page —
// figures/title-page.png, rendered from the actual PDF at 150 dpi — is on
// stage from frame zero. The centerpiece is the paper's opening claim made
// visible: a report stream that stays tidy while the three correction
// channels beneath it (challenge, escalate, verify) are priced out one at a
// time. Section 4's "two orders" close the argument: same tidy surface, only
// one of them still answerable to reality.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Figure } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

// The tidy output stream: report tiles sliding across the top of the machine.
const TILES = Array.from({ length: 9 }, (_, i) => i);
const TILE_W = 74;

// The three correction channels of Section 4 — the ones that quietly go.
const CHANNELS = [
  { label: 'challenge the frame', y: 0 },
  { label: 'escalate the contradiction', y: 1 },
  { label: 'verify against source', y: 2 },
] as const;

const CAM_PAPER: CameraState = { x: 300, y: 330, k: 1.3 };
const CAM_MACHINE: CameraState = { x: 850, y: 350, k: 1.18 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  paperU: ChannelRef<number>;
  machineU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  decayU: ChannelRef<number>;
  namesU: ChannelRef<number>;
  ordersU: ChannelRef<number>;
  smoothU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const paperU = tl.channel('paperU', 0);
  const machineU = tl.channel('machineU', 0);
  const streamU = tl.channel('streamU', 0);
  const decayU = tl.channel('decayU', 0);
  const namesU = tl.channel('namesU', 0);
  const ordersU = tl.channel('ordersU', 0);
  const smoothU = tl.channel('smoothU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the real paper, on stage.
  tl.caption({
    at: 0.1,
    dur: 6.6,
    text: 'This is the actual paper. Its opening claim is a quiet trap: regimes of epistemic failure do not always announce themselves by becoming visibly incoherent. Some are most dangerous while they still look orderly.',
  });
  tl.tween(paperU, 1, { at: 0.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_PAPER, { at: 0.3, dur: 1.4, ease: ease.move });
  tl.hold(7.1, 0.6);

  // Beat 1 — the machine and its tidy stream.
  tl.caption({
    at: 7.7,
    dur: 6.6,
    text: 'Here is the system the paper is worried about. Reports come out on time. Summaries are clean. Decisions are legible. Watch the output for a while and nothing looks broken, because nothing visible is broken.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 7.9, dur: 1.5, ease: ease.move });
  tl.tween(machineU, 1, { at: 8.3, dur: 1.4, ease: ease.draw });
  tl.tween(streamU, 1, { at: 9.4, dur: 4.0, ease: ease.linear });
  tl.hold(14.7, 0.6);

  // Beat 2 — the correction channels beneath it.
  tl.caption({
    at: 15.3,
    dur: 6.8,
    text: 'What keeps that surface honest lives underneath: someone can challenge a frame, escalate a contradiction, or check a claim against its source. The paper calls these the conditions for epistemic correction.',
  });
  tl.tween(decayU, 0.08, { at: 15.6, dur: 0.8, ease: ease.move });
  tl.hold(22.5, 0.6);

  // Beat 3 — the channels get priced out.
  tl.caption({
    at: 23.1,
    dur: 7.2,
    text: 'Now let each channel become locally expensive. Challenging the frame costs status. Escalating slows the team. Verifying makes you look inefficient beside a colleague who accepts the summary. One by one, the channels stop being used — not banned, just priced out.',
  });
  tl.tween(decayU, 1, { at: 23.6, dur: 5.4, ease: ease.linear });
  tl.hold(30.7, 0.6);

  // Beat 4 — nothing on the surface changed.
  tl.caption({
    at: 31.3,
    dur: 6.4,
    text: 'And notice the top row. The stream never stuttered. If anything the reports are smoother now, because nothing interrupts them. The failure is orderly — that is what makes it a failure you keep.',
  });
  tl.tween(smoothU, 1, { at: 31.8, dur: 1.6, ease: ease.enter });
  tl.hold(38.1, 0.6);

  // Beat 5 — name the regime and the show.
  tl.caption({
    at: 38.7,
    dur: 7.0,
    text: 'The paper gives the two layers different names. The condition underneath — correction degrading before capability does — is the regime, adversarial epistemic incoherence. The polished surface it keeps producing is coherence theater. One is the disease; the other is the performance.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 38.9, dur: 1.5, ease: ease.move });
  tl.tween(namesU, 1, { at: 39.6, dur: 1.4, ease: ease.enter });
  tl.hold(46.1, 0.6);

  // Beat 6 — two orders (Section 4).
  tl.caption({
    at: 46.7,
    dur: 7.0,
    text: 'Because two kinds of order are available. One preserves the capacity to challenge frames and surface error. The other preserves fluency and reporting stability while hollowing out the channels underneath. Both look like competence from the audience seats.',
  });
  tl.tween(ordersU, 1, { at: 47.2, dur: 1.6, ease: ease.enter });
  tl.hold(54.1, 0.6);

  // Beat 7 — close on the thesis.
  tl.caption({
    at: 54.7,
    dur: 6.6,
    text: 'So the book asks the paper’s question, not the comfortable one. Not: does this system look coherent? But: is its coherence still attached to correction — and how does the detachment spread? That movement is the next four chapters.',
  });
  tl.tween(dimU, 1, { at: 55.1, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.2, dur: 0.9, ease: ease.enter });
  tl.hold(61.9, 1.2);

  return { tl, cam, paperU, machineU, streamU, decayU, namesU, ordersU, smoothU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Channel({
  y,
  label,
  decay,
  k,
}: {
  y: number;
  label: string;
  decay: number;
  k: number;
}) {
  // each channel dies in sequence as decay sweeps 0..1
  const health = clamp01(1 - (decay * 3.6 - k * 1.1));
  const dead = health < 0.25;
  const cy = 400 + y * 62;
  const color = dead ? colors.NEGATIVE : colors.POSITIVE;
  return (
    <g>
      <line
        x1={520}
        y1={cy}
        x2={1140}
        y2={cy}
        stroke={color}
        strokeWidth={2 + health * 5}
        strokeDasharray={dead ? '4 10' : undefined}
        opacity={0.25 + health * 0.75}
      />
      {/* correction pulses still travelling while the channel lives */}
      {!dead &&
        [0, 1, 2].map((p) => (
          <circle
            key={p}
            cx={520 + ((p * 0.33 + 0.15) % 1) * 620}
            cy={cy}
            r={4 + health * 2}
            fill={colors.POSITIVE}
            opacity={health * 0.9}
          />
        ))}
      <text x={520} y={cy - 12} fill={color} fontSize={12} fontFamily={MONO} opacity={0.5 + health * 0.5}>
        {label}
      </text>
      {dead && (
        <text x={1140} y={cy - 12} textAnchor="end" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO}>
          locally irrational
        </text>
      )}
      <text x={1152} y={cy + 4} fill={color} fontSize={13} fontFamily={MONO} opacity={0.9}>
        {dead ? '✕' : '✓'}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const paperU = s.get(scene.paperU);
  const machineU = s.get(scene.machineU);
  const streamU = s.get(scene.streamU);
  const decayU = s.get(scene.decayU);
  const namesU = s.get(scene.namesU);
  const ordersU = s.get(scene.ordersU);
  const smoothU = s.get(scene.smoothU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The orderly failure
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        a system can keep looking coherent after it stops being correctable
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          {/* ---- the real paper (rendered from the PDF, not a mockup) ---- */}
          <Figure
            src="/generated/coherence-theater/figures/title-page.png"
            x={80}
            y={100}
            w={320}
            h={478}
            reveal={paperU}
            opacity={paperU * (1 - 0.55 * clamp01(machineU))}
            caption="the paper · title page, from the PDF"
          />

          {/* ---- the machine: tidy stream above, correction channels below ---- */}
          <g opacity={machineU}>
            <rect x={470} y={110} width={710} height={470} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={506} y={146} fill={colors.TEXT} fontSize={16} fontWeight={700}>
              the visible layer
            </text>
            <text x={506} y={168} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              reports · summaries · approvals — always on time
            </text>

            {/* the report stream */}
            <g>
              <rect x={500} y={186} width={650} height={92} rx={14} fill="#101827" stroke={colors.GRID} />
              {TILES.map((i) => {
                const u = (streamU * 2.2 + i / TILES.length) % 1;
                const x = 512 + u * (630 - TILE_W);
                const sparkle = smoothU > 0 && i % 3 === 0;
                return (
                  <g key={i} opacity={clamp01(streamU * 4)}>
                    <rect
                      x={x}
                      y={204}
                      width={TILE_W}
                      height={56}
                      rx={9}
                      fill={colors.PANEL}
                      stroke={sparkle ? colors.ACCENT : colors.POSITIVE}
                      strokeWidth={sparkle ? 2.2 : 1.4}
                    />
                    <line x1={x + 12} y1={222} x2={x + TILE_W - 12} y2={222} stroke={colors.MUTED} strokeWidth={2} opacity={0.7} />
                    <line x1={x + 12} y1={234} x2={x + TILE_W - 20} y2={234} stroke={colors.MUTED} strokeWidth={2} opacity={0.5} />
                    <circle cx={x + TILE_W - 14} cy={248} r={5} fill={colors.POSITIVE} />
                  </g>
                );
              })}
              {smoothU > 0 && (
                <text x={1150} y={200} textAnchor="end" fill={colors.ACCENT} fontSize={12} fontFamily={MONO} opacity={smoothU}>
                  smoother than ever
                </text>
              )}
            </g>

            {/* the correction channels */}
            <text x={506} y={330} fill={colors.TEXT} fontSize={16} fontWeight={700}>
              the correction layer
            </text>
            <text x={506} y={352} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              what has to stay cheap for the surface to stay honest
            </text>
            {CHANNELS.map((c, k) => (
              <Channel key={c.label} y={c.y} label={c.label} decay={decayU} k={k} />
            ))}
          </g>

          {/* ---- the two names ---- */}
          {namesU > 0 && (
            <g opacity={namesU}>
              <rect x={470} y={596} width={344} height={54} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
              <text x={642} y={618} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
                the regime — adversarial epistemic incoherence
              </text>
              <text x={642} y={638} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                correction degrades before capability does
              </text>
              <rect x={836} y={596} width={344} height={54} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={1008} y={618} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
                the show — coherence theater
              </text>
              <text x={1008} y={638} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                the tidy layer the audience is given
              </text>
            </g>
          )}

          {/* ---- Section 4's two orders ---- */}
          {ordersU > 0 && (
            <g opacity={ordersU}>
              <rect x={90} y={596} width={344} height={54} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={262} y={618} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO} fontWeight={700}>
                order that can still be challenged
              </text>
              <text x={262} y={638} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                the only order that stays answerable to reality
              </text>
            </g>
          )}
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={160} y={226} width={960} height={228} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={640} y={290} textAnchor="middle" fill={colors.TEXT} fontSize={33} fontWeight={800}>
          Coherence can outlive correction
        </text>
        <text x={640} y={336} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18}>
          the regime degrades the channels · the theater keeps the surface
        </text>
        <text x={640} y={376} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>
          the question is never the surface — it is whether correction still travels
        </text>
        <text x={640} y={416} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
          next: the five force pairs that tip the balance
        </text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
