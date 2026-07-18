// Book scene — codex-app-server, chapter 1: "One Engine, Any Face".
//
// ONE persistent object: the WIRE — the newline-delimited JSON-RPC stream
// between a client UI and the `codex app-server` binary — with a handshake
// gate in front of the engine. Grounded in codex-rs/app-server/src/main.rs
// (`--listen stdio://` default transport), README.md ("JSON-RPC 2.0 messages
// with the jsonrpc header omitted", JSONL over stdio, powers the VS Code
// extension), and message_processor.rs (ConnectionSessionState: requests
// before the initialize/initialized handshake get a "Not initialized" error).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const FACES = [
  { x: 190, y: 120, label: 'VS Code extension' },
  { x: 500, y: 120, label: 'Codex desktop app' },
  { x: 810, y: 120, label: 'your app' },
];
const FACE_W = 250;
const FACE_H = 96;

const CLIENT = { x: 80, y: 250, w: 290, h: 210 };
const ENGINE = { x: 900, y: 230, w: 310, h: 250 };
const WIRE_Y = 360;
const WIRE_X0 = CLIENT.x + CLIENT.w; // 370
const GATE_X = ENGINE.x - 34; // 866
const ANATOMY = { x: 405, y: 88, w: 470, rowH: 56 };

const CAM_HOME: CameraState = CAMERA_HOME;
const CAM_FACES: CameraState = { x: 640, y: 220, k: 1.05 };
const CAM_WIRE: CameraState = { x: 640, y: 360, k: 1.08 };
const CAM_ANATOMY: CameraState = { x: 640, y: 220, k: 1.12 };
const CAM_GATE: CameraState = { x: 800, y: 360, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 370, k: 0.98 };

const ANATOMY_ROWS = [
  { tag: 'request', text: '{"id":10,"method":"thread/start","params":{…}}', note: 'has an id — expects one reply', color: colors.ACCENT },
  { tag: 'response', text: '{"id":10,"result":{"thread":{…}}}', note: 'answers that id', color: colors.POSITIVE },
  { tag: 'notification', text: '{"method":"thread/started","params":{…}}', note: 'no id — fire and forget', color: colors.SECONDARY },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAM_HOME, cameraInterp);
  const facesU = tl.channel('facesU', 0); // three faces, staggered via one channel
  const facesDim = tl.channel('facesDim', 0);
  const clientU = tl.channel('clientU', 0);
  const engineU = tl.channel('engineU', 0);
  const wireU = tl.channel('wireU', 0); // wire draw-on
  const anatU = tl.channel('anatU', 0); // message anatomy rows
  const eagerU = tl.channel('eagerU', 0); // premature thread/start chip → gate
  const eagerShake = tl.channel('eagerShake', 0); // bounce at the gate
  const errU = tl.channel('errU', 0); // "Not initialized" error chip ← gate
  const initU = tl.channel('initU', 0); // initialize chip →
  const respU = tl.channel('respU', 0); // initialize response ←
  const ackU = tl.channel('ackU', 0); // initialized notification →
  const gateU = tl.channel('gateU', 0); // 0 closed … 1 open
  const finalU = tl.channel('finalU', 0); // thread/start sails through
  const engineGlow = tl.channel('engineGlow', 0);
  const dimU = tl.channel('dimU', 0);

  /* — beat 1 · many faces, one engine — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Open Codex inside your editor and a coding agent appears in the sidebar. But the extension is mostly a shell of buttons — the agent itself lives in a separate process.',
  });
  tl.tween(cam, CAM_FACES, { at: t - 6.6, dur: 1.3, ease: ease.move });
  tl.tween(facesU, 1, { at: t - 6.2, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.6);

  /* — beat 2 · the binary and the wire — */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'That process is the app server: one binary wrapping the whole Codex engine, talking to any front end over a single wire — plain lines of text on standard input and output.',
  });
  tl.tween(facesDim, 1, { at: t - 6.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_WIRE, { at: t - 6.6, dur: 1.4, ease: ease.move });
  tl.tween(clientU, 1, { at: t - 5.6, dur: 0.8, ease: ease.enter });
  tl.tween(engineU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  tl.tween(wireU, 1, { at: t - 3.8, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 3 · three message shapes — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Each line is one message in a request and response protocol — the same family as the model context protocol. Three shapes cover everything.',
  });
  tl.tween(cam, CAM_ANATOMY, { at: t - 5.8, dur: 1.3, ease: ease.move });
  tl.tween(anatU, 1, { at: t - 4.6, dur: 2.0, ease: ease.enter });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'A request carries an id and expects exactly one reply. A response answers it, matched by that id. And a notification is fire and forget — no id, and no reply is coming.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 4 · the eager client bounces — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The wire has one rule: introduce yourself first. Watch a client skip it, and ask the engine to start a conversation right away.',
  });
  tl.tween(cam, CAM_GATE, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(eagerU, 1, { at: t - 3.4, dur: 1.6, ease: ease.linear });
  tl.tween(eagerShake, 1, { at: t - 1.8, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.3);

  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'The gate throws it straight back. Until this connection completes a handshake, every request is rejected with a not initialized error.',
  });
  tl.tween(eagerU, 0, { at: t - 5.2, dur: 0.01 });
  tl.tween(errU, 1, { at: t - 5.0, dur: 1.5, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the handshake — */
  t = tl.caption({
    at: t,
    dur: 6.6,
    text: 'So the first message is always initialize. The client says who it is — this is how the official extension introduces itself — and which capabilities it can handle.',
  });
  tl.tween(errU, 0, { at: t - 6.2, dur: 0.4, ease: ease.move });
  tl.tween(cam, CAM_WIRE, { at: t - 6.0, dur: 1.3, ease: ease.move });
  tl.tween(initU, 1, { at: t - 4.6, dur: 1.7, ease: ease.linear });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The engine answers with its own coordinates — the home directory it manages, the user agent it presents upstream, the platform it is running on.',
  });
  tl.tween(initU, 0, { at: t - 5.6, dur: 0.01 });
  tl.tween(respU, 1, { at: t - 5.4, dur: 1.7, ease: ease.linear });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'The client acknowledges with one final notification — initialized — and the gate opens for good on this connection.',
  });
  tl.tween(respU, 0, { at: t - 5.0, dur: 0.01 });
  tl.tween(ackU, 1, { at: t - 4.8, dur: 1.5, ease: ease.linear });
  tl.tween(cam, CAM_GATE, { at: t - 3.4, dur: 1.2, ease: ease.move });
  tl.tween(gateU, 1, { at: t - 2.0, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 6 · sails through; the close — */
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'Now the same message sails straight through, and a conversation starts. Everything the official extension does rides this wire — and anything you build can ride it too.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.8, dur: 1.6, ease: ease.move });
  tl.tween(finalU, 1, { at: t - 5.6, dur: 1.8, ease: ease.linear });
  tl.tween(engineGlow, 1, { at: t - 3.6, dur: 0.8, ease: ease.pop });
  tl.tween(dimU, 0.5, { at: t - 2.2, dur: 1.2, ease: ease.move });
  tl.hold(t, 1.0);

  return {
    tl, cam, facesU, facesDim, clientU, engineU, wireU, anatU,
    eagerU, eagerShake, errU, initU, respU, ackU, gateU, finalU, engineGlow, dimU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

/** A front-end face — a small window chrome mock. */
function WindowFace({ x, y, label, u, dim }: { x: number; y: number; label: string; u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.75 * clamp01(dim))}>
      <rect width={FACE_W} height={FACE_H} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <circle cx={16} cy={15} r={4} fill={colors.NEGATIVE} opacity={0.7} />
      <circle cx={30} cy={15} r={4} fill={colors.WARM} opacity={0.7} />
      <circle cx={44} cy={15} r={4} fill={colors.POSITIVE} opacity={0.7} />
      <rect x={14} y={34} width={FACE_W - 90} height={10} rx={5} fill={colors.GRID} />
      <rect x={14} y={52} width={FACE_W - 130} height={10} rx={5} fill={colors.GRID} />
      <text x={14} y={FACE_H - 14} fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/** The client panel — whatever UI you're building. */
function ClientPanel({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = CLIENT;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.6 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={18} y={30} fill={colors.TEXT} fontSize={15} fontWeight={700}>
        your client
      </text>
      <text x={18} y={52} fill={colors.MUTED} fontSize={12} fontFamily={mono}>
        clientInfo.name: "codex_vscode"
      </text>
      <rect x={18} y={70} width={w - 36} height={34} rx={8} fill={colors.BG} opacity={0.7} />
      <text x={28} y={92} fill={colors.MUTED} fontSize={12}>
        chat panel · diff view · approvals
      </text>
      <rect x={18} y={116} width={w - 36} height={12} rx={6} fill={colors.GRID} />
      <rect x={18} y={138} width={w - 90} height={12} rx={6} fill={colors.GRID} />
      <text x={18} y={h - 18} fill={colors.ACCENT} fontSize={12} fontFamily={mono}>
        stdin ▸ · ◂ stdout
      </text>
    </g>
  );
}

/** The engine — the codex app-server binary wrapping codex-core. */
function EnginePanel({ u, glow, dim }: { u: number; glow: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, h } = ENGINE;
  const g = clamp01(glow);
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 14})`} opacity={e * (1 - 0.5 * clamp01(dim))}>
      {g > 0 && <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={16} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} opacity={0.55 * g} />}
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={18} y={30} fill={colors.TEXT} fontSize={15} fontWeight={700} fontFamily={mono}>
        codex app-server
      </text>
      <text x={18} y={50} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        --listen stdio://
      </text>
      <rect x={18} y={66} width={w - 36} height={106} rx={9} fill={colors.BG} opacity={0.7} />
      <text x={30} y={90} fill={colors.ACCENT} fontSize={12.5} fontWeight={700} fontFamily={mono}>
        codex-core
      </text>
      <text x={30} y={112} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        ThreadManager · turns
      </text>
      <text x={30} y={132} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        sandbox · model client
      </text>
      <text x={30} y={152} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        MessageProcessor
      </text>
      <text x={18} y={h - 20} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
        one process · many fronts
      </text>
    </g>
  );
}

/** The stdio wire between client and gate. */
function Wire({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const x1 = WIRE_X0 + (GATE_X - WIRE_X0) * e;
  return (
    <g opacity={1 - 0.5 * clamp01(dim)}>
      <line x1={WIRE_X0} y1={WIRE_Y} x2={x1} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={3} />
      <line x1={WIRE_X0} y1={WIRE_Y} x2={x1} y2={WIRE_Y} stroke={colors.ACCENT} strokeWidth={1.2} opacity={0.5} strokeDasharray="2 10" />
      {e > 0.95 && (
        <text x={(WIRE_X0 + GATE_X) / 2} y={WIRE_Y + 24} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} textAnchor="middle">
          one message per line
        </text>
      )}
    </g>
  );
}

/** The initialize gate in front of the engine. */
function Gate({ open, shake }: { open: number; shake: number }) {
  const o = clamp01(open);
  // shake: brief lateral jitter when the eager request bounces
  const s = clamp01(shake);
  const jitter = s > 0 && s < 1 ? Math.sin(s * Math.PI * 4) * 5 * (1 - s) : 0;
  const half = 52 * (1 - o);
  return (
    <g transform={`translate(${GATE_X + jitter}, ${WIRE_Y})`}>
      <line x1={0} y1={-64} x2={0} y2={-half} stroke={o > 0.98 ? colors.POSITIVE : colors.WARM} strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={64} x2={0} y2={half} stroke={o > 0.98 ? colors.POSITIVE : colors.WARM} strokeWidth={5} strokeLinecap="round" />
      <text x={0} y={-76} fill={o > 0.98 ? colors.POSITIVE : colors.WARM} fontSize={11.5} fontFamily={mono} textAnchor="middle">
        {o > 0.98 ? 'initialized ✓' : 'initialize first'}
      </text>
    </g>
  );
}

/** A JSONL line-chip traveling the wire. u 0..1; dir +1 → engine, -1 → client. */
function LineChip({ u, dir, text, color, w = 250 }: { u: number; dir: 1 | -1; text: string; color: string; w?: number }) {
  const p = clamp01(u);
  if (p <= 0 || p >= 1) return null;
  const from = dir === 1 ? WIRE_X0 + 30 : GATE_X - 24;
  const to = dir === 1 ? GATE_X - 24 : WIRE_X0 + 30;
  const cx = lerp(from, to, p);
  const fade = p < 0.12 ? p / 0.12 : p > 0.88 ? (1 - p) / 0.12 : 1;
  return (
    <g transform={`translate(${cx - w / 2}, ${WIRE_Y - 40})`} opacity={fade}>
      <rect width={w} height={28} rx={8} fill={colors.BG} stroke={color} strokeWidth={1.5} />
      <text x={w / 2} y={19} fill={color} fontSize={12} fontFamily={mono} textAnchor="middle">
        {text}
      </text>
    </g>
  );
}

/** The three message anatomies. */
function Anatomy({ u, dim }: { u: number; dim: number }) {
  const e = clamp01(u);
  if (e <= 0) return null;
  const { x, y, w, rowH } = ANATOMY;
  return (
    <g opacity={1 - 0.85 * clamp01(dim)}>
      {ANATOMY_ROWS.map((row, i) => {
        const ru = clamp01(e * 3 - i);
        if (ru <= 0) return null;
        return (
          <g key={row.tag} transform={`translate(${x}, ${y + i * rowH + (1 - ru) * 10})`} opacity={ru}>
            <rect width={w} height={rowH - 12} rx={9} fill={colors.PANEL} stroke={row.color} strokeWidth={1.5} />
            <text x={14} y={19} fill={row.color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
              {row.tag}
            </text>
            <text x={14} y={35} fill={colors.TEXT} fontSize={11} fontFamily={mono}>
              {row.text}
            </text>
            <text x={w - 14} y={19} fill={colors.MUTED} fontSize={10.5} textAnchor="end">
              {row.note}
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
  const facesDim = clamp01(s.get(scene.facesDim));
  const facesU = s.get(scene.facesU);
  const anatDim = Math.max(clamp01(s.get(scene.eagerU)) > 0 ? 1 : 0, dim) * 0.9;
  return (
    <>
      {FACES.map((f, i) => (
        <WindowFace key={f.label} x={f.x} y={f.y} label={f.label} u={clamp01(facesU * 3 - i)} dim={Math.max(facesDim, dim)} />
      ))}
      <ClientPanel u={s.get(scene.clientU)} dim={dim} />
      <EnginePanel u={s.get(scene.engineU)} glow={s.get(scene.engineGlow)} dim={0} />
      <Wire u={s.get(scene.wireU)} dim={dim} />
      <Gate open={s.get(scene.gateU)} shake={s.get(scene.eagerShake)} />
      <Anatomy u={s.get(scene.anatU)} dim={anatDim} />
      <LineChip u={s.get(scene.eagerU)} dir={1} text={'{"id":1,"method":"thread/start"}'} color={colors.ACCENT} />
      <LineChip u={s.get(scene.errU)} dir={-1} text={'{"id":1,"error":"Not initialized"}'} color={colors.NEGATIVE} />
      <LineChip u={s.get(scene.initU)} dir={1} text={'{"id":0,"method":"initialize"}'} color={colors.ACCENT} />
      <LineChip u={s.get(scene.respU)} dir={-1} text={'{"id":0,"result":{"codexHome":…}}'} color={colors.POSITIVE} />
      <LineChip u={s.get(scene.ackU)} dir={1} text={'{"method":"initialized"}'} color={colors.SECONDARY} w={210} />
      <LineChip u={s.get(scene.finalU)} dir={1} text={'{"id":10,"method":"thread/start"}'} color={colors.ACCENT} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
