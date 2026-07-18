// Two Witnesses, One Room
//
// Backed by: tests/replay-concurrent.spec.mjs (personas Ada ada@example.test
// and Linus linus@example.test, login through the Auth0 emulator at
// 127.0.0.1:4101 with password DemoPass123, a four-message staggered
// conversation at 700/2100/3500/4900 ms in one durable-stream room, each
// session asserting EVERY line from BOTH sides is visible) and
// replay.playwright.config.mjs (devices "Replay Chromium", workers: 2,
// fullyParallel — two concurrent recording browsers).
//
// Machine: twin chat panes, one per Replay Chromium worker. Messages cross a
// vertical durable-stream spine between them; every observable also falls as
// a particle onto a RecordingStrip under each pane — two tapes growing in
// lockstep. Payoff: both panes hold all four lines; each seat proved the
// sync from where it sat.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';
import { POINT_COLOR, RecordingStrip } from '../../agent';
import type { RecordingPoint, RecordingPointKind } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const PANE_W = 420;
const PANE_H = 330;
const ADA = { x: 70, y: 96 };
const LINUS = { x: 790, y: 96 };
const SPINE_X = 640;
const SPINE_TOP = 120;
const SPINE_BOT = 430;
const TAPE_Y = 520;
const TAPE_H = 20;

const CAM_ADA: CameraState = { x: 320, y: 280, k: 1.24 };
const CAM_SPINE: CameraState = { x: 640, y: 300, k: 1.14 };
const CAM_TAPES: CameraState = { x: 640, y: 440, k: 1.1 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/* ------------------------------------------------------------------ data */
/** The spec's real conversation — persona, stagger delay, and text. */
const CONVO = [
  { from: 'Ada', delay: '700ms', text: 'Good morning Linus, can you see this room from your Replay session?' },
  { from: 'Linus', delay: '2100ms', text: 'Yes, I can see it. Your message arrived through durable streams.' },
  { from: 'Ada', delay: '3500ms', text: 'Great. I am sending one more note after your reply.' },
  { from: 'Linus', delay: '4900ms', text: 'Received. The second browser has the full staggered conversation.' },
] as const;

/** convoU value at which message i is sent / has fully arrived on both sides. */
const SEND_AT = [0.08, 0.32, 0.56, 0.8];
const CROSS = 0.14; // convoU spent crossing the spine

/** Tape events per persona — send interactions, stream network hops, renders. */
interface TapeEvent {
  emit: number; // convoU when it leaves the pane
  at: number; // 0..1 position on the tape
  kind: RecordingPointKind;
  mine: boolean; // emitted by this pane (send) vs arriving (render)
}
function paneEvents(persona: 'Ada' | 'Linus'): TapeEvent[] {
  const ev: TapeEvent[] = [];
  CONVO.forEach((m, i) => {
    const sent = m.from === persona;
    // the sender clicks send (interaction) then sees it render; the receiver
    // gets a network delivery then a render.
    if (sent) {
      ev.push({ emit: SEND_AT[i], at: 0.06 + i * 0.24, kind: 'interaction', mine: true });
      ev.push({ emit: SEND_AT[i] + 0.03, at: 0.1 + i * 0.24, kind: 'render', mine: true });
    } else {
      ev.push({ emit: SEND_AT[i] + CROSS, at: 0.12 + i * 0.24, kind: 'network', mine: false });
      ev.push({ emit: SEND_AT[i] + CROSS + 0.03, at: 0.16 + i * 0.24, kind: 'render', mine: false });
    }
  });
  return ev;
}
const ADA_EVENTS = paneEvents('Ada');
const LINUS_EVENTS = paneEvents('Linus');
const ADA_POINTS: RecordingPoint[] = ADA_EVENTS.map((e) => ({ at: e.at, kind: e.kind }));
const LINUS_POINTS: RecordingPoint[] = LINUS_EVENTS.map((e) => ({ at: e.at, kind: e.kind }));

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const paneU = tl.channel('paneU', 0); // both browser panes rise
  const loginU = tl.channel('loginU', 0); // 0..1 the login handshake
  const spineU = tl.channel('spineU', 0); // the durable stream draws on
  const convoU = tl.channel('convoU', 0); // THE clock of the exchange
  const tapeU = tl.channel('tapeU', 0); // tapes reveal
  const assertU = tl.channel('assertU', 0); // the final visibility assertions
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · two workers — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The test file declares two witnesses: Ada and Linus. The Playwright config runs them as two parallel workers, and each worker opens its own recording browser — Replay Chromium.',
  });
  tl.tween(paneU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · login through the emulator — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Each browser lands on the chat route, gets bounced to a login form, and signs in against the local auth emulator from chapter one — seeded accounts, seeded password, nothing real.',
  });
  tl.tween(cam, CAM_ADA, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(loginU, 1, { at: t - 4.8, dur: 2.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the room — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Both sessions join the same room, and between them runs the thing under test: a durable stream. Every message is an append; every reader catches up from its offset.',
  });
  tl.tween(cam, CAM_SPINE, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(spineU, 1, { at: t - 4.6, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the tapes — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'And underneath each browser, a tape is rolling. Whatever happens on screen also lands on a recording — one per witness.',
  });
  tl.tween(cam, CAM_TAPES, { at: t - 4.4, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: t - 4.8, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 5 · Ada speaks — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'The conversation is staggered on purpose. Ada speaks first, and her message crosses the stream into a browser she has never touched.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(convoU, 0.28, { at: t - 4.8, dur: 4.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 6 · Linus answers — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Fourteen hundred milliseconds later, Linus answers from the other seat. Two writers, one ordered log, no coordination between the browsers.',
  });
  tl.tween(convoU, 0.52, { at: t - 5.2, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the exchange completes — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Two more lines cross, each landing twice: once in the sender window, once through the stream in the other one. And every landing falls onto both tapes as it happens.',
  });
  tl.tween(convoU, 1, { at: t - 5.6, dur: 5.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 8 · the assertion — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Then comes the point of the test: each session asserts that every message from both sides is visible on its own screen. Ada proves the sync from her seat, Linus from his.',
  });
  tl.tween(assertU, 1, { at: t - 4.8, dur: 1.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · close — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'When the workers exit, the green checkmarks evaporate — but the two recordings do not. Two independent witnesses saw the same conversation, and both wrote it down.',
  });
  tl.tween(dimU, 1, { at: t - 5.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, paneU, loginU, spineU, convoU, tapeU, assertU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------- per-frame particle compute */
const PTS: ParticlePoint[] = [...ADA_EVENTS, ...LINUS_EVENTS].map(() => ({
  x: 0,
  y: 0,
  r: 3,
  alpha: 0,
  color: colors.MUTED,
}));
const OUT: ParticlePoint[] = [];
const FLIGHT = 0.05;

function computeParticles(s: SceneState): ParticlePoint[] {
  const p = s.get(scene.convoU);
  OUT.length = 0;
  if (p <= 0) return OUT;
  const groups: [TapeEvent[], number, number][] = [
    [ADA_EVENTS, ADA.x, 0],
    [LINUS_EVENTS, LINUS.x, ADA_EVENTS.length],
  ];
  for (const [events, px, base] of groups) {
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const u = (p - e.emit) / FLIGHT;
      if (u <= 0 || u >= 1) continue;
      const uu = ease.move(clamp01(u));
      const fx = px + PANE_W / 2 + (e.mine ? 60 : -60);
      const fy = ADA.y + PANE_H - 40;
      const tx = px + e.at * PANE_W;
      const ty = TAPE_Y + TAPE_H / 2;
      const pt = PTS[base + i];
      pt.x = fx + (tx - fx) * uu;
      pt.y = fy + (ty - fy) * uu * uu;
      pt.color = POINT_COLOR[e.kind];
      pt.alpha = Math.min(1, u * 5);
      OUT.push(pt);
    }
  }
  return OUT;
}

/* -------------------------------------------------- local subcomponents */

/** One Replay Chromium pane: header, auth state, then the live transcript. */
function ChatPane({
  x,
  persona,
  email,
  displayName,
  enter,
  login,
  convo,
  assert,
  dim,
}: {
  x: number;
  persona: 'Ada' | 'Linus';
  email: string;
  displayName: string;
  enter: number;
  login: number;
  convo: number;
  assert: number;
  dim: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const lg = clamp01(login);
  const y = ADA.y;
  const authed = lg >= 0.999;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.85 * dim)}>
      <rect width={PANE_W} height={PANE_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {/* worker chrome */}
      <rect x={12} y={10} width={PANE_W - 24} height={24} rx={12} fill={colors.BG} opacity={0.6} />
      <circle cx={26} cy={22} r={4} fill={colors.NEGATIVE} opacity={0.9} />
      <text x={40} y={26} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
        Replay Chromium · worker {persona === 'Ada' ? '1' : '2'} · 127.0.0.1:5175/app?room=…
      </text>
      {/* login form → auth header */}
      {!authed && (
        <g opacity={1 - lg}>
          <text x={20} y={64} fill={colors.TEXT} fontSize={14} fontWeight={700}>
            Sign in
          </text>
          <rect x={20} y={78} width={PANE_W - 40} height={26} rx={6} fill={colors.BG} stroke={colors.GRID} />
          <text x={30} y={95} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            {lg > 0.25 ? email : ''}
          </text>
          <rect x={20} y={112} width={PANE_W - 40} height={26} rx={6} fill={colors.BG} stroke={colors.GRID} />
          <text x={30} y={129} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
            {lg > 0.55 ? 'DemoPass123' : ''}
          </text>
          <text x={20} y={162} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            auth0-emulator-url: http://127.0.0.1:4101
          </text>
        </g>
      )}
      {authed && (
        <g>
          <text x={20} y={58} fill={colors.TEXT} fontSize={13.5} fontWeight={700}>
            {displayName}
          </text>
          <text x={20} y={74} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
            auth-user: {email} · Auth0 emulator · live
          </text>
          {/* transcript */}
          {CONVO.map((m, i) => {
            const sentByMe = m.from === persona;
            const visAt = sentByMe ? SEND_AT[i] + 0.03 : SEND_AT[i] + CROSS;
            const vu = clamp01((convo - visAt) * 14);
            if (vu <= 0) return null;
            const my = 96 + i * 44;
            const checked = clamp01(assert * 5 - i);
            return (
              <g key={i} transform={`translate(20, ${my + (1 - vu) * 6})`} opacity={vu}>
                <rect
                  width={PANE_W - 40}
                  height={38}
                  rx={8}
                  fill={sentByMe ? colors.ACCENT : colors.SECONDARY}
                  opacity={0.1}
                />
                <text x={10} y={15} fill={sentByMe ? colors.ACCENT : colors.SECONDARY} fontSize={10.5} fontFamily={MONO} fontWeight={700}>
                  {m.from === 'Ada' ? 'Ada Lovelace' : 'Linus Torvalds'} · {m.delay}
                </text>
                <text x={10} y={30} fill={colors.TEXT} fontSize={10.5}>
                  {m.text.length > 62 ? `${m.text.slice(0, 62)}…` : m.text}
                </text>
                {checked > 0 && (
                  <g transform={`translate(${PANE_W - 58}, 19)`} opacity={checked}>
                    <circle r={8} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
                    <path d="M -3.5 0 l 2.5 3 l 4.5 -6" fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}
          {clamp01(assert) > 0.8 && (
            <text x={20} y={PANE_H - 14} fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={clamp01(assert)}>
              expect getByText(message) toBeVisible — all 4 ✓
            </text>
          )}
        </g>
      )}
    </g>
  );
}

/** The durable stream between the panes — an append-only spine. */
function StreamSpine({ u, convo, dim }: { u: number; convo: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={1 - 0.85 * dim}>
      <line
        x1={SPINE_X}
        y1={SPINE_TOP}
        x2={SPINE_X}
        y2={SPINE_TOP + (SPINE_BOT - SPINE_TOP) * uu}
        stroke={colors.TEAL}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {uu >= 0.999 && (
        <text x={SPINE_X} y={SPINE_TOP - 12} textAnchor="middle" fill={colors.TEAL} fontSize={10.5} fontFamily={MONO}>
          /rooms/&lt;room&gt;/messages
        </text>
      )}
      {/* appended entries tick down the spine as messages land */}
      {CONVO.map((m, i) => {
        const au = clamp01((convo - SEND_AT[i] - CROSS * 0.5) * 10);
        if (au <= 0) return null;
        const y = SPINE_TOP + 40 + i * 66;
        return (
          <g key={i} opacity={au}>
            <circle cx={SPINE_X} cy={y} r={5} fill={colors.TEAL} />
            <text x={SPINE_X + 12} y={y + 4} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>
              offset {i}
            </text>
          </g>
        );
      })}
      {/* the message in flight across the spine */}
      {CONVO.map((m, i) => {
        const f = (convo - SEND_AT[i]) / CROSS;
        if (f <= 0 || f >= 1) return null;
        const fromAda = m.from === 'Ada';
        const x0 = fromAda ? ADA.x + PANE_W : LINUS.x;
        const x1 = fromAda ? LINUS.x : ADA.x + PANE_W;
        const fx = x0 + (x1 - x0) * ease.move(clamp01(f));
        const fy = ADA.y + 130 + i * 30;
        return (
          <g key={`f${i}`}>
            <circle cx={fx} cy={fy} r={6} fill={fromAda ? colors.ACCENT : colors.SECONDARY} />
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
    <g transform={`translate(640, ${300 + (1 - uu) * 12})`} opacity={uu}>
      <rect x={-330} y={-58} width={660} height={116} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-14} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
        Two witnesses. Two recordings. One log.
      </text>
      <text y={22} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily={MONO}>
        tests/replay-concurrent.spec.mjs · workers: 2 · devices: Replay Chromium
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const convo = s.get(scene.convoU);
  const tape = s.get(scene.tapeU);
  return (
    <>
      <StreamSpine u={s.get(scene.spineU)} convo={convo} dim={dim} />
      <ChatPane
        x={ADA.x}
        persona="Ada"
        email="ada@example.test"
        displayName="Ada Lovelace"
        enter={s.get(scene.paneU)}
        login={s.get(scene.loginU)}
        convo={convo}
        assert={s.get(scene.assertU)}
        dim={dim}
      />
      <ChatPane
        x={LINUS.x}
        persona="Linus"
        email="linus@example.test"
        displayName="Linus Torvalds"
        enter={clamp01(s.get(scene.paneU) * 1.3 - 0.3)}
        login={clamp01(s.get(scene.loginU) * 1.15 - 0.15)}
        convo={convo}
        assert={s.get(scene.assertU)}
        dim={dim}
      />
      <ParticleCloud state={s} compute={computeParticles} />
      {/* the two tapes — they survive the dim */}
      <RecordingStrip
        x={ADA.x}
        y={TAPE_Y}
        w={PANE_W}
        h={TAPE_H}
        points={ADA_POINTS}
        reveal={tape * Math.max(0.08, convo)}
        title="recording — Ada's session"
        dim={0.3 * dim}
      />
      <RecordingStrip
        x={LINUS.x}
        y={TAPE_Y}
        w={PANE_W}
        h={TAPE_H}
        points={LINUS_POINTS}
        reveal={tape * Math.max(0.08, convo)}
        title="recording — Linus's session"
        dim={0.3 * dim}
      />
      <ClosingCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
