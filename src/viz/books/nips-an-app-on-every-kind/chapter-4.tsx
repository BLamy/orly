// New Colonies — chapter 4 of "An App on Every Kind".
//
// Whole product categories, re-minted as kinds. NIP-34 git: a repository
// announcement (kind 30617) with patches (1617) and issues (1621). NIP-52
// calendar: date- and time-based events (31922 / 31923) and RSVPs (31925).
// NIP-53 live: a live streaming event (30311) with live chat messages (1311).
// ONE machine: three familiar apps — a code forge, a calendar, a live stream —
// each dissolving into a small constellation of kinds, then a single reaction
// (kind 7) landing on all three, because underneath they are all just events.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

interface Colony {
  key: string;
  app: string;
  cx: number;
  cy: number;
  color: string;
  kinds: Array<{ k: number; label: string; dx: number; dy: number }>;
}
const COLONIES: Colony[] = [
  {
    key: 'git', app: 'a code forge', cx: 290, cy: 300, color: colors.ACCENT,
    kinds: [
      { k: 30617, label: 'repo', dx: 0, dy: -70 },
      { k: 1617, label: 'patch', dx: -84, dy: 40 },
      { k: 1621, label: 'issue', dx: 84, dy: 40 },
    ],
  },
  {
    key: 'cal', app: 'a calendar', cx: 640, cy: 300, color: colors.POSITIVE,
    kinds: [
      { k: 31923, label: 'event', dx: 0, dy: -70 },
      { k: 31922, label: 'all-day', dx: -84, dy: 40 },
      { k: 31925, label: 'rsvp', dx: 84, dy: 40 },
    ],
  },
  {
    key: 'live', app: 'a live stream', cx: 990, cy: 300, color: colors.NEGATIVE,
    kinds: [
      { k: 30311, label: 'stream', dx: 0, dy: -70 },
      { k: 1311, label: 'live chat', dx: -84, dy: 40 },
      { k: 10312, label: 'presence', dx: 84, dy: 40 },
    ],
  },
];

const CAM_WIDE: CameraState = { x: 640, y: 300, k: 1.0 };
const CAM_GIT: CameraState = { x: 290, y: 300, k: 1.35 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const appsU = tl.channel('appsU', 0);
  const gitU = tl.channel('gitU', 0);
  const calU = tl.channel('calU', 0);
  const liveU = tl.channel('liveU', 0);
  const reactU = tl.channel('reactU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — three familiar apps.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Once a kind is just an agreement, whole categories of software can move over. Here are three you know: a code forge, a shared calendar, and a live stream.',
  });
  tl.tween(appsU, 1, { at: 0.7, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: 0.9, dur: 1.2, ease: ease.move });
  tl.hold(6.1, 0.6);

  // Beat 2 — the forge dissolves into kinds.
  tl.caption({
    at: 6.7,
    dur: 6.4,
    text: 'The code forge is not an application anymore — it is three kinds. A repository announcement, and hanging off it, patches and issues. Pull requests and bug reports become events anyone can host.',
  });
  tl.tween(cam, CAM_GIT, { at: 6.9, dur: 1.4, ease: ease.move });
  tl.tween(gitU, 1, { at: 7.6, dur: 2.4, ease: ease.enter });
  tl.hold(13.1, 0.7);

  // Beat 3 — the calendar.
  tl.caption({
    at: 13.8,
    dur: 5.8,
    text: 'The calendar is the same trick. A time-based event, an all-day variant, and a yes-or-no reply. Invitations stop belonging to one company’s servers and start belonging to you.',
  });
  tl.tween(cam, CAM_WIDE, { at: 14.0, dur: 1.4, ease: ease.move });
  tl.tween(calU, 1, { at: 14.8, dur: 2.2, ease: ease.enter });
  tl.hold(19.6, 0.7);

  // Beat 4 — the live stream.
  tl.caption({
    at: 20.3,
    dur: 5.8,
    text: 'And the live stream: one event holding the video address and who is on stage, with a running river of live chat messages beside it. Each message is its own tiny event.',
  });
  tl.tween(liveU, 1, { at: 21.0, dur: 2.2, ease: ease.enter });
  tl.hold(26.1, 0.7);

  // Beat 5 — the payoff: interop for free.
  tl.caption({
    at: 26.8,
    dur: 6.6,
    text: 'Now the quiet miracle. Everything from earlier in this series still works on all of them. A follow, a zap, a reaction — the very same reaction code — lands on a git issue, a calendar invite, and a live chat alike.',
  });
  tl.tween(reactU, 1, { at: 27.6, dur: 3.0, ease: ease.linear });
  tl.hold(33.4, 0.7);

  // Beat 6 — no bridges required.
  tl.caption({
    at: 34.1,
    dur: 6.0,
    text: 'Nobody wrote a bridge between the forge and the calendar and the stream. They interoperate because they never diverged — they are all events under one identity, on shared relays, addressed the same way.',
  });
  tl.hold(40.1, 0.6);

  // Beat 7 — close.
  tl.caption({
    at: 40.7,
    dur: 5.6,
    text: 'A new colony costs almost nothing: pick unused numbers, write down the agreement, publish. The app is new; the plumbing — identity, signatures, relays — was already there and already shared.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.1, dur: 1.0, ease: ease.enter });
  tl.hold(46.3, 1.2);

  return { tl, cam, appsU, gitU, calU, liveU, reactU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const appsU = s.get(scene.appsU);
  const gitU = s.get(scene.gitU);
  const calU = s.get(scene.calU);
  const liveU = s.get(scene.liveU);
  const reactU = s.get(scene.reactU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const colonyU = [gitU, calU, liveU];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {COLONIES.map((col, ci) => {
            const cu = colonyU[ci];
            return (
              <g key={col.key}>
                {/* the app card (fades as it dissolves into kinds) */}
                {appsU > 0 && (
                  <g opacity={appsU * (1 - 0.7 * clamp01(cu))}>
                    <rect x={col.cx - 90} y={col.cy - 34} width={180} height={68} rx={12} fill={colors.PANEL} stroke={col.color} strokeWidth={1.6} />
                    <text x={col.cx} y={col.cy + 6} textAnchor="middle" fill={col.color} fontSize={16} fontWeight={600}>
                      {col.app}
                    </text>
                  </g>
                )}
                {/* the kind constellation */}
                {cu > 0 &&
                  col.kinds.map((kd, ki) => {
                    const u = clamp01(cu * col.kinds.length - ki);
                    if (u <= 0) return null;
                    const x = col.cx + kd.dx;
                    const y = col.cy + kd.dy;
                    return (
                      <g key={kd.k} opacity={u}>
                        <line x1={col.cx} y1={col.cy} x2={x} y2={y} stroke={colors.GRID} strokeWidth={1.2} opacity={0.5} />
                        <rect x={x - 60} y={y - 24} width={120} height={48} rx={9} fill={colors.PANEL} stroke={col.color} strokeWidth={1.3} />
                        <text x={x - 46} y={y - 4} fill={col.color} fontSize={14} fontWeight={700} fontFamily="monospace">
                          {kd.k}
                        </text>
                        <text x={x - 46} y={y + 15} fill={colors.TEXT} fontSize={12}>
                          {kd.label}
                        </text>
                        {/* a reaction landing on one kind per colony */}
                        {reactU > 0 && ki === (ci === 0 ? 2 : ci === 1 ? 2 : 1) && (
                          <g opacity={clamp01(reactU * 3 - ci)}>
                            <circle cx={x + 52} cy={y - 20} r={13} fill={colors.WARM} opacity={0.9} />
                            <text x={x + 52} y={y - 15} textAnchor="middle" fill={colors.BG} fontSize={13} fontWeight={700}>
                              +
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
              </g>
            );
          })}

          {reactU > 0 && (
            <text x={640} y={470} textAnchor="middle" fill={colors.WARM} fontSize={14} opacity={clamp01(reactU * 2 - 0.5)}>
              one kind-7 reaction — the same code — works on all three
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Whole apps, re-minted as kinds
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            forge, calendar, live stream — interoperable because they never split
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-34 git · NIP-52 calendar · NIP-53 live
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
