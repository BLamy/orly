// Book scene — codex-app-server, chapter 3: "The Wire Reverses".
//
// ONE persistent object: a server→client REQUEST — the JSON-RPC arrow flips.
// Grounded in codex-rs/app-server/src/bespoke_event_handling.rs
// (EventMsg::ExecApprovalRequest / ApplyPatchApprovalRequest → the
// item/commandExecution/requestApproval and item/fileChange/requestApproval
// server-initiated requests), outgoing_message.rs (OutgoingMessageSender's
// request_id_to_callback map parks the pending id until the client answers),
// and README.md Approvals (decisions accept / acceptForSession / decline /
// cancel; the dynamic-tools item/tool/call flow uses the same reversed channel).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const CLIENT = { x: 70, y: 210, w: 330, h: 300 };
const ENGINE = { x: 890, y: 210, w: 320, h: 300 };
const WIRE_Y = 360;
const WIRE_X0 = CLIENT.x + CLIENT.w; // 400
const WIRE_X1 = ENGINE.x; // 890

const CMD_CARD = { x: 470, y: 128, w: 360, h: 84 };
const DIALOG = { x: 92, y: 250, w: 286, h: 214 };
const CALLBACK = { x: 910, y: 330, w: 280, h: 96 };
const TOOLNOTE = { x: 440, y: 470, w: 420, h: 64 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_CARD: CameraState = { x: 650, y: 240, k: 1.14 };
const CAM_WIRE: CameraState = { x: 645, y: 340, k: 1.06 };
const CAM_ENGINE: CameraState = { x: 950, y: 360, k: 1.22 };
const CAM_DIALOG: CameraState = { x: 330, y: 360, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 350, k: 0.97 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0); // client + engine + wire
  const cardU = tl.channel('cardU', 0); // the frozen commandExecution item
  const lockU = tl.channel('lockU', 1); // 1 locked … 0 open
  const reverseU = tl.channel('reverseU', 0); // the direction flip annotation
  const reqU = tl.channel('reqU', 0); // requestApproval packet engine→client
  const slotU = tl.channel('slotU', 0); // callback-table row appears
  const slotPulse = tl.channel('slotPulse', 0); // waiting pulse
  const dialogU = tl.channel('dialogU', 0);
  const pickU = tl.channel('pickU', 0); // accept button highlight
  const respU = tl.channel('respU', 0); // decision packet client→engine
  const runU = tl.channel('runU', 0); // command output after unlock
  const doneU = tl.channel('doneU', 0); // completed stamp
  const declineU = tl.channel('declineU', 0); // ghost declined variant
  const toolU = tl.channel('toolU', 0); // dynamic-tools note
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · the stakes — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Mid turn, the agent decides it needs a command that policy will not allow silently. Someone has to decide — and the engine refuses to decide alone.',
  });
  tl.tween(stageU, 1, { at: t - 6.4, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_CARD, { at: t - 5.0, dur: 1.3, ease: ease.move });
  tl.tween(cardU, 1, { at: t - 4.2, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 2 · the reversal — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'So the wire reverses. Until now, every request came from your side. This time the server sends the request — and your client owes it the response.',
  });
  tl.tween(cam, CAM_WIRE, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(reverseU, 1, { at: t - 4.2, dur: 1.0, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 3 · the request crosses — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The request names the frozen item, the thread and turn it belongs to, the exact command, the directory, and the reason it was flagged.',
  });
  tl.tween(reqU, 1, { at: t - 5.2, dur: 1.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 4 · the parked callback — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'On the engine side, nothing blocks. The request id is parked in a callback table, the turn holds its breath, and the loop keeps serving every other connection.',
  });
  tl.tween(cam, CAM_ENGINE, { at: t - 6.0, dur: 1.3, ease: ease.move });
  tl.tween(slotU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.tween(slotPulse, 1, { at: t - 3.6, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 5 · the dialog is yours — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'On your side, this is just a dialog. The protocol does not care what it looks like — it cares that exactly one decision comes back.',
  });
  tl.tween(cam, CAM_DIALOG, { at: t - 5.4, dur: 1.3, ease: ease.move });
  tl.tween(dialogU, 1, { at: t - 4.0, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the decision menu — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'You can accept once, accept for the whole session, decline, or cancel. The choice rides back down the wire as a one line response.',
  });
  tl.tween(pickU, 1, { at: t - 3.2, dur: 0.5, ease: ease.pop });
  tl.tween(respU, 1, { at: t - 2.4, dur: 1.8, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 7 · unlock and run — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'The response lands on the parked id, the callback fires, the padlock opens — and the command finally runs, streaming output like any other item.',
  });
  tl.tween(cam, CAM_CARD, { at: t - 5.4, dur: 1.3, ease: ease.move });
  tl.tween(slotU, 0, { at: t - 5.0, dur: 0.5, ease: ease.move });
  tl.tween(lockU, 0, { at: t - 4.4, dur: 0.6, ease: ease.pop });
  tl.tween(runU, 1, { at: t - 3.6, dur: 2.2, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 8 · completed vs declined — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'Item completed arrives with status completed. Had you declined, the same item would close as declined instead — and the turn would simply continue around it.',
  });
  tl.tween(doneU, 1, { at: t - 5.6, dur: 0.5, ease: ease.pop });
  tl.tween(declineU, 1, { at: t - 3.2, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 9 · same channel, more powers — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'File edits cross the same bridge — a file change freezes, an approval crosses, a decision returns. And dynamic tools go further: the server calls a tool your client owns.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.2, dur: 1.4, ease: ease.move });
  tl.tween(declineU, 0, { at: t - 5.6, dur: 0.6, ease: ease.move });
  tl.tween(toolU, 1, { at: t - 4.4, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 10 · close — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'That is the deal on this wire: the engine runs the agent, but every irreversible step can be routed through you, in an interface you fully control.',
  });
  tl.tween(dimU, 0.45, { at: t - 3.0, dur: 1.4, ease: ease.move });
  tl.hold(t, 1.0);

  return {
    tl, cam, stageU, cardU, lockU, reverseU, reqU, slotU, slotPulse,
    dialogU, pickU, respU, runU, doneU, declineU, toolU, dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function Panel({ x, y, w, h, title, sub, color, u, dim }: {
  x: number; y: number; w: number; h: number; title: string; sub: string; color: string; u: number; dim: number;
}) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.55 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text x={18} y={30} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>{title}</text>
      <text x={18} y={50} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>{sub}</text>
    </g>
  );
}

/** The frozen commandExecution item, padlocked until a decision returns. */
function FrozenCommand({ u, lock, run, done, dim }: { u: number; lock: number; run: number; done: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = CMD_CARD;
  const l = clamp01(lock);
  const r = clamp01(run);
  const extra = r > 0 ? 40 : 0;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.5 * clamp01(dim))}>
      <rect width={w} height={h + extra} rx={10} fill={colors.PANEL} stroke={l > 0.5 ? colors.WARM : colors.POSITIVE} strokeWidth={1.5} strokeDasharray={l > 0.5 ? '5 4' : undefined} />
      <text x={14} y={22} fill={colors.WARM} fontSize={11} fontWeight={700} fontFamily={mono}>commandExecution</text>
      {clamp01(done) > 0.5 && (
        <text x={w - 14} y={22} fill={colors.POSITIVE} fontSize={11} fontWeight={700} fontFamily={mono} textAnchor="end">✓ status: completed</text>
      )}
      <text x={14} y={46} fill={colors.TEXT} fontSize={13} fontFamily={mono}>git push origin main</text>
      <text x={14} y={68} fill={colors.MUTED} fontSize={11} fontFamily={mono}>reason: writes outside the sandbox</text>
      {l > 0 && (
        <g transform={`translate(${w - 34}, ${40})`} opacity={l}>
          <rect x={-9} y={-4} width={18} height={14} rx={3} fill={colors.WARM} />
          <path d="M -5 -4 v -5 a 5 5 0 0 1 10 0 v 5" fill="none" stroke={colors.WARM} strokeWidth={2.5} />
        </g>
      )}
      {l <= 0 && (
        <g transform={`translate(${w - 34}, ${40})`}>
          <rect x={-9} y={-4} width={18} height={14} rx={3} fill={colors.POSITIVE} />
          <path d="M -5 -4 v -5 a 5 5 0 0 1 10 0" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
        </g>
      )}
      {r > 0 && (
        <text x={14} y={h + 24} fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={r}>
          {'Enumerating objects: 12, done.'.slice(0, Math.round(r * 29))}
        </text>
      )}
    </g>
  );
}

/** A packet on the wire. dir -1 = engine→client (the reversal), +1 = client→engine. */
function WirePacket({ u, dir, label, color, wch = 300 }: { u: number; dir: 1 | -1; label: string; color: string; wch?: number }) {
  const p = clamp01(u);
  if (p <= 0 || p >= 1) return null;
  const from = dir === -1 ? WIRE_X1 - 10 : WIRE_X0 + 10;
  const to = dir === -1 ? WIRE_X0 + 10 : WIRE_X1 - 10;
  const cx = lerp(from, to, p);
  const fade = p < 0.1 ? p / 0.1 : p > 0.9 ? (1 - p) / 0.1 : 1;
  return (
    <g transform={`translate(${cx - wch / 2}, ${WIRE_Y - 42})`} opacity={fade}>
      <rect width={wch} height={30} rx={8} fill={colors.BG} stroke={color} strokeWidth={1.5} />
      <text x={wch / 2} y={20} fill={color} fontSize={11.5} fontFamily={mono} textAnchor="middle">{label}</text>
      <path
        d={dir === -1 ? `M -8 15 l 12 -7 v 14 z` : `M ${wch + 8} 15 l -12 -7 v 14 z`}
        fill={color}
      />
    </g>
  );
}

/** The engine's pending-callback table — the parked request id. */
function CallbackSlot({ u, pulse, dim }: { u: number; pulse: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = CALLBACK;
  const p = clamp01(pulse);
  const glow = p > 0 && p < 1 ? 0.35 + 0.3 * Math.sin(p * Math.PI * 6) : 0.35;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 10})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.5} />
      <text x={14} y={22} fill={colors.SECONDARY} fontSize={11} fontWeight={700} fontFamily={mono}>request_id_to_callback</text>
      <rect x={12} y={34} width={w - 24} height={30} rx={7} fill={colors.SECONDARY} opacity={glow * 0.35} />
      <text x={22} y={54} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>id 44 → ⟨awaiting decision⟩</text>
      <text x={14} y={h - 12} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>the turn waits · the loop does not</text>
    </g>
  );
}

/** The client-rendered approval dialog. */
function ApprovalDialog({ u, pick, dim }: { u: number; pick: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = DIALOG;
  const buttons = ['accept', 'acceptForSession', 'decline', 'cancel'];
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={16} y={26} fill={colors.TEXT} fontSize={13} fontWeight={700}>Codex wants to run:</text>
      <rect x={16} y={38} width={w - 32} height={26} rx={6} fill={colors.PANEL} />
      <text x={24} y={56} fill={colors.WARM} fontSize={11.5} fontFamily={mono}>git push origin main</text>
      {buttons.map((b, i) => {
        const picked = i === 0 && clamp01(pick) > 0.5;
        return (
          <g key={b} transform={`translate(16, ${76 + i * 32})`}>
            <rect width={w - 32} height={26} rx={7} fill={picked ? colors.POSITIVE : colors.PANEL} opacity={picked ? 0.9 : 1} stroke={picked ? colors.POSITIVE : colors.GRID} strokeWidth={1} />
            <text x={12} y={17} fill={picked ? colors.BG : colors.TEXT} fontSize={11.5} fontWeight={picked ? 700 : 400} fontFamily={mono}>
              {b}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const stageU = clamp01(s.get(scene.stageU));
  const revU = clamp01(s.get(scene.reverseU));
  const declU = clamp01(s.get(scene.declineU));
  const toolU = clamp01(s.get(scene.toolU));
  return (
    <>
      <Panel {...CLIENT} title="your client" sub="renders items · answers requests" color={colors.GRID} u={stageU} dim={dim} />
      <Panel {...ENGINE} title="codex app-server" sub="mid turn · sandbox flagged a command" color={colors.ACCENT} u={stageU} dim={dim} />

      {/* the wire */}
      {stageU > 0 && (
        <g opacity={stageU * (1 - 0.5 * dim)}>
          <line x1={WIRE_X0} y1={WIRE_Y} x2={WIRE_X1} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={3} />
          {revU > 0 && (
            <g opacity={revU}>
              <text x={(WIRE_X0 + WIRE_X1) / 2} y={WIRE_Y + 26} fill={colors.SECONDARY} fontSize={12} fontFamily={mono} textAnchor="middle">
                ◂ server-initiated request
              </text>
            </g>
          )}
        </g>
      )}

      <FrozenCommand u={s.get(scene.cardU)} lock={s.get(scene.lockU)} run={s.get(scene.runU)} done={s.get(scene.doneU)} dim={dim} />
      <CallbackSlot u={s.get(scene.slotU)} pulse={s.get(scene.slotPulse)} dim={dim} />
      <ApprovalDialog u={s.get(scene.dialogU)} pick={s.get(scene.pickU)} dim={dim} />

      <WirePacket u={s.get(scene.reqU)} dir={-1} label='item/commandExecution/requestApproval' color={colors.SECONDARY} wch={330} />
      <WirePacket u={s.get(scene.respU)} dir={1} label='{"id":44,"result":{"decision":"accept"}}' color={colors.POSITIVE} wch={310} />

      {/* the declined ghost */}
      {declU > 0 && (
        <g transform={`translate(${CMD_CARD.x}, ${CMD_CARD.y + 148})`} opacity={declU * (1 - 0.6 * dim)}>
          <rect width={CMD_CARD.w} height={44} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.85} />
          <text x={14} y={20} fill={colors.NEGATIVE} fontSize={11} fontWeight={700} fontFamily={mono}>the other timeline</text>
          <text x={14} y={36} fill={colors.MUTED} fontSize={11} fontFamily={mono}>item/completed · status: declined — turn continues</text>
        </g>
      )}

      {/* dynamic tools note */}
      {toolU > 0 && (
        <g transform={`translate(${TOOLNOTE.x}, ${TOOLNOTE.y + (1 - toolU) * 10})`} opacity={toolU * (1 - 0.55 * dim)}>
          <rect width={TOOLNOTE.w} height={TOOLNOTE.h} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={16} y={24} fill={colors.SECONDARY} fontSize={11.5} fontWeight={700} fontFamily={mono}>same reversed channel:</text>
          <text x={16} y={46} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>item/fileChange/requestApproval · item/tool/call</text>
        </g>
      )}
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
