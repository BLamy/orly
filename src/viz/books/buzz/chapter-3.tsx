// Buzz — chapter 3: one context.
// The core product idea from Block's launch post: a feature branch becomes a
// channel. The conversation that shapes a change, the patch, the CI result, the
// code review, and the merge decision all live as signed events in the SAME
// thread — every one tagged to the channel with ["h", <channel-uuid>]
// (buzz-sdk builders). Code review becomes a conversation with a permanent
// record: one thread, one search. Honest status: chat/threads/review/workflows
// work today; full git hosting is still being wired up.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const CH = '7b1e4c0a…4a1c';

// the single thread — events arrive top to bottom, all ["h", channel]
const THREAD = [
  { kind: 'message', who: 'maya', color: colors.WARM, text: '"the token refresh races on cold start"' },
  { kind: 'patch', who: 'goose', color: colors.SECONDARY, text: 'patch 4a2f · +18 −6 in auth/session' },
  { kind: 'ci', who: 'ci', color: colors.ACCENT, text: 'checks: build ✓  tests ✓  lint ✓' },
  { kind: 'review', who: 'sam', color: colors.POSITIVE, text: '"LGTM — nice catch on the cold path"' },
  { kind: 'merge', who: 'maya', color: colors.TEXT, text: 'merge decision · recorded' },
];
const ROW_Y0 = 150;
const ROW_H = 74;
const THREAD_X = 360;
const THREAD_W = 560;

const CAM_SCATTER: CameraState = { x: 640, y: 250, k: 1.05 };
const CAM_THREAD: CameraState = { x: 640, y: 360, k: 1.02 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const branchU = tl.channel('branchU', 0);
  const becomeU = tl.channel('becomeU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const tagU = tl.channel('tagU', 0);
  const recordU = tl.channel('recordU', 0);
  const searchU = tl.channel('searchU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Think about what a single change normally touches. A thread in chat where the idea forms. A pull request over on the code host. A run in the build-and-test system. A review somewhere else again. Four tools, four fragments.',
  });
  tl.tween(cam, CAM_SCATTER, { at: 0.8, dur: 1.5, ease: ease.move });
  tl.tween(branchU, 1, { at: 1.0, dur: 1.6, ease: ease.enter });
  tl.hold(6.7, 0.7);

  tl.caption({
    at: 7.4,
    dur: 6.0,
    text: 'On Buzz, a feature branch simply becomes a channel. And once it is a channel, everything about that change can live in one place — because everything is the same kind of thing: a signed event.',
  });
  tl.tween(becomeU, 1, { at: 8.0, dur: 1.8, ease: ease.move });
  tl.tween(cam, CAM_THREAD, { at: 8.4, dur: 1.5, ease: ease.move });
  tl.hold(13.4, 0.7);

  tl.caption({
    at: 14.1,
    dur: 7.0,
    text: 'Watch one thread fill. The conversation that framed the bug. The patch that fixes it. The build and test results. The review. And the merge decision. Each is an event, arriving in order, in the same thread.',
  });
  tl.tween(rowsU, 1, { at: 14.6, dur: 5.2, ease: ease.linear });
  tl.hold(21.8, 0.7);

  tl.caption({
    at: 22.5,
    dur: 6.4,
    text: 'What ties them together is a single tag. Every one of these events carries an h tag naming the channel, so the client library files them into the same thread. Routing an entire change is just that one shared tag.',
  });
  tl.tween(tagU, 1, { at: 23.0, dur: 2.4, ease: ease.enter });
  tl.hold(29.6, 0.7);

  tl.caption({
    at: 30.3,
    dur: 6.4,
    text: 'The payoff is that code review stops being a detour and becomes a conversation with a permanent record. The reasoning and the result sit side by side, forever, in one searchable thread. One record, one search.',
  });
  tl.tween(recordU, 1, { at: 30.8, dur: 1.4, ease: ease.enter });
  tl.tween(searchU, 1, { at: 32.6, dur: 1.4, ease: ease.enter });
  tl.hold(37.4, 0.7);

  tl.caption({
    at: 38.1,
    dur: 5.6,
    text: 'Threads, review, and workflows work today; full git hosting is still being wired up. But the shape is already clear: one context, instead of four.',
  });
  tl.tween(dimU, 1, { at: 38.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.5, dur: 1.0, ease: ease.enter });
  tl.hold(44.0, 1.2);

  return { tl, cam, branchU, becomeU, rowsU, tagU, recordU, searchU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const branchU = s.get(scene.branchU);
  const becomeU = s.get(scene.becomeU);
  const rowsU = s.get(scene.rowsU);
  const tagU = s.get(scene.tagU);
  const recordU = s.get(scene.recordU);
  const searchU = s.get(scene.searchU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);
  const mainOp = 1 - 0.85 * dimU;

  const headOp = branchU * (1 - becomeU);
  const chanOp = becomeU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* header: "feature/auth-refresh" → "# auth-refresh" */}
          {headOp > 0 && (
            <text x={640} y={116} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace" opacity={headOp}>
              branch: feature/auth-refresh
            </text>
          )}
          {chanOp > 0 && (
            <g opacity={chanOp}>
              <text x={640} y={116} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontWeight={600} fontFamily="monospace">
                # auth-refresh
              </text>
              <text x={640} y={136} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={tagU}>
                h = {CH}
              </text>
            </g>
          )}

          {/* the unified thread */}
          {THREAD.map((r, i) => {
            const u = clamp01(rowsU * THREAD.length - i);
            if (u <= 0) return null;
            const y = ROW_Y0 + i * ROW_H;
            return (
              <g key={i} opacity={u} transform={`translate(0, ${(1 - u) * 10})`}>
                <rect x={THREAD_X} y={y} width={THREAD_W} height={ROW_H - 12} rx={9} fill={colors.PANEL} stroke={tagU > 0 ? r.color : colors.GRID} strokeOpacity={tagU > 0 ? 0.5 : 1} />
                <rect x={THREAD_X} y={y} width={5} height={ROW_H - 12} rx={2} fill={r.color} />
                <text x={THREAD_X + 20} y={y + 26} fill={r.color} fontSize={12} fontWeight={600} fontFamily="monospace">{r.kind}</text>
                <text x={THREAD_X + 20} y={y + 47} fill={colors.TEXT} fontSize={13}>{r.text}</text>
                <text x={THREAD_X + THREAD_W - 16} y={y + 26} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">{r.who}</text>
                {/* the shared h tag chip */}
                {tagU > 0 && (
                  <text x={THREAD_X + THREAD_W - 16} y={y + 47} textAnchor="end" fill={r.color} fontSize={10} fontFamily="monospace" opacity={tagU}>
                    ["h", …4a1c]
                  </text>
                )}
              </g>
            );
          })}

          {recordU > 0 && (
            <text x={640} y={ROW_Y0 + THREAD.length * ROW_H + 8} textAnchor="middle" fill={colors.TEXT} fontSize={14} opacity={recordU}>
              code review = a conversation with a permanent record
            </text>
          )}
          {searchU > 0 && (
            <text x={640} y={ROW_Y0 + THREAD.length * ROW_H + 34} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} opacity={searchU} fontFamily="monospace">
              one thread · one search
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600}>A feature branch is a channel</text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>conversation, patch, CI, review, and merge — one signed thread</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">one context · the h tag names the channel · git hosting: coming</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
