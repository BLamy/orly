// Sovereign Agent Mesh — chapter 1: The identity earns a route.
//
// Grounded in google/sam at 0fb93d87b89881977cc77589b35c98444b6b5270:
// internal/node/enroll.go, internal/controlplane/server.go, api/sam.proto,
// and internal/identity/biscuit.go. The persistent object is the node's
// identity envelope: a local key becomes an enrollment request, then a
// control-plane-signed Biscuit plus router addresses.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, MatrixGrid, NodeBadge, Packet } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

type Pt = { x: number; y: number };

const STORE: Pt = { x: 158, y: 344 };
const CONTROL: Pt = { x: 640, y: 176 };
const ROUTER: Pt = { x: 1120, y: 344 };
const ENROLL_CARD = { x: 640, y: 452, w: 424, h: 118 };
const POLICY = { x: 392, y: 238 };

const POLICY_VALUES = [
  [1, 0.72, 0.38],
  [0.52, 1, 0.66],
  [0.34, 0.62, 1],
];

const REQUEST_FIELDS = ['jwt', 'peer_id', 'public_key', 'requested_role', 'labels'];
const POLICY_ROWS = ['jwt', 'peer_id', 'labels'];
const POLICY_COLS = ['verify', 'resolve', 'mint'];

function Chip({
  x,
  y,
  text,
  color = colors.MUTED,
  opacity = 1,
  w,
  h = 26,
  fill = colors.PANEL,
  fontSize = 11,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  opacity?: number;
  w?: number;
  h?: number;
  fill?: string;
  fontSize?: number;
}) {
  const width = w ?? Math.max(58, text.length * fontSize * 0.62 + 18);
  return (
    <g opacity={clamp01(opacity)}>
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + fontSize * 0.34} textAnchor="middle" fill={colors.TEXT} fontSize={fontSize} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

function IdentityEnvelope({
  x,
  y,
  u,
  seal,
  glow,
  opacity = 1,
}: {
  x: number;
  y: number;
  u: number;
  seal: number;
  glow: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const s = 0.76 + 0.24 * uu;
  const sealed = clamp01(seal);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={uu * opacity}>
      {glow > 0 && <circle r={64} fill="none" stroke={sealed > 0.5 ? colors.POSITIVE : colors.ACCENT} strokeWidth={3} opacity={0.28 * clamp01(glow)} />}
      <rect x={-46} y={-38} width={92} height={76} rx={16} fill={colors.PANEL} stroke={sealed > 0.5 ? colors.POSITIVE : colors.ACCENT} strokeWidth={2.2} />
      <path d="M-44-30 0 4 44-30" fill="none" stroke={colors.GRID} strokeWidth={1.5} />
      <path d="M-44 30-9 0M44 30 9 0" fill="none" stroke={colors.GRID} strokeWidth={1.2} opacity={0.7} />
      <circle cx={0} cy={5} r={12} fill={sealed > 0.5 ? colors.POSITIVE : colors.WARM} opacity={0.88} />
      <path d="M0-2v15M-6 6h12" stroke={colors.BG} strokeWidth={2.4} strokeLinecap="round" />
      <text y={58} textAnchor="middle" fill={sealed > 0.5 ? colors.POSITIVE : colors.TEXT} fontSize={12} fontFamily={MONO}>
        {sealed > 0.5 ? 'Biscuit' : 'peer identity'}
      </text>
      {sealed > 0.5 && <Chip x={0} y={-56} text="signed facts" color={colors.POSITIVE} w={112} h={23} />}
    </g>
  );
}

function RequestCard({ u, fields, glow, opacity = 1 }: { u: number; fields: number; glow: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g opacity={uu * opacity}>
      <rect x={ENROLL_CARD.x - ENROLL_CARD.w / 2} y={ENROLL_CARD.y - ENROLL_CARD.h / 2} width={ENROLL_CARD.w} height={ENROLL_CARD.h} rx={18} fill={colors.PANEL} stroke={glow > 0.1 ? colors.WARM : colors.GRID} strokeWidth={glow > 0.1 ? 2.4 : 1.4} />
      <text x={ENROLL_CARD.x - ENROLL_CARD.w / 2 + 22} y={ENROLL_CARD.y - 34} fill={colors.TEXT} fontSize={16} fontWeight={700} fontFamily={MONO}>EnrollRequest</text>
      <text x={ENROLL_CARD.x + ENROLL_CARD.w / 2 - 22} y={ENROLL_CARD.y - 34} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>application/x-protobuf</text>
      {REQUEST_FIELDS.map((field, i) => (
        <Chip key={field} x={ENROLL_CARD.x - 164 + (i % 3) * 164} y={ENROLL_CARD.y + (i < 3 ? 2 : 35)} text={field} color={i === 0 ? colors.SECONDARY : i === 3 ? colors.WARM : colors.ACCENT} opacity={clamp01(fields * 3 - i * 0.45)} />
      ))}
    </g>
  );
}

function PolicyBlock({ u, glow, opacity = 1 }: { u: number; glow: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g opacity={uu * opacity}>
      <rect x={POLICY.x - 26} y={POLICY.y - 36} width={298} height={218} rx={18} fill={colors.PANEL} stroke={glow > 0.1 ? colors.WARM : colors.GRID} strokeWidth={glow > 0.1 ? 2.2 : 1.2} />
      <text x={POLICY.x + 123} y={POLICY.y - 8} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>HandleRegister</text>
      <text x={POLICY.x + 123} y={POLICY.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>resolveRoles → MintBiscuitToken</text>
      <MatrixGrid
        x={POLICY.x + 22}
        y={POLICY.y + 40}
        values={POLICY_VALUES}
        cell={43}
        gap={6}
        cellU={(i, j) => clamp01(uu * 3 - (i * 3 + j) * 0.3)}
        rowLabels={POLICY_ROWS}
        colLabels={POLICY_COLS}
        highlight={{ cell: [1, 1], color: colors.WARM, u: clamp01(glow) }}
        labelSize={10}
        opacity={0.92}
      />
    </g>
  );
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const storeU = tl.channel('storeU', 0);
  const keyU = tl.channel('keyU', 0);
  const requestU = tl.channel('requestU', 0);
  const fieldU = tl.channel('fieldU', 0);
  const sendU = tl.channel('sendU', 0);
  const policyU = tl.channel('policyU', 0);
  const policyGlow = tl.channel('policyGlow', 0);
  const sealU = tl.channel('sealU', 0);
  const routerU = tl.channel('routerU', 0);
  const saveU = tl.channel('saveU', 0);
  const identityX = tl.channel('identityX', STORE.x);
  const identityY = tl.channel('identityY', STORE.y);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — a local secret becomes a durable peer identity.
  tl.caption({ at: 0.4, dur: 4.2, text: 'A node starts with one local secret, and nothing in the mesh can trust it yet.' });
  tl.tween(storeU, 1, { at: 0.6, dur: 0.8, ease: ease.enter });
  tl.tween(keyU, 1, { at: 1.3, dur: 1.1, ease: ease.pop });
  tl.caption({ at: 5.1, dur: 4.8, text: 'The first run creates a durable key pair; later runs recover the same one from the store.' });
  tl.tween(identityX, 238, { at: 5.4, dur: 1.1, ease: ease.move });
  tl.tween(identityY, 304, { at: 5.4, dur: 1.1, ease: ease.move });
  tl.hold(10.0, 0.4);

  // BEAT 2 — request fields assemble around the same envelope.
  tl.caption({ at: 10.4, dur: 4.8, text: 'The node packs its identity, requested role, and operator labels into one enrollment request.' });
  tl.tween(requestU, 1, { at: 10.7, dur: 0.7, ease: ease.enter });
  tl.tween(fieldU, 1, { at: 11.2, dur: 1.5, ease: ease.draw });
  tl.tween(identityX, 640, { at: 11.8, dur: 1.4, ease: ease.move });
  tl.tween(identityY, 382, { at: 11.8, dur: 1.4, ease: ease.move });
  tl.caption({ at: 15.8, dur: 4.5, text: 'The request crosses the control plane as a compact protobuf message, carrying fields the server can check.' });
  tl.tween(sendU, 1, { at: 16.1, dur: 1.8, ease: ease.linear });
  tl.hold(20.6, 0.4);

  // BEAT 3 — the policy grid turns claims into a decision.
  tl.caption({ at: 21.0, dur: 4.7, text: 'The control plane checks the signed login before it considers the peer.' });
  tl.tween(policyU, 1, { at: 21.3, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 520, y: 310, k: 1.16 }, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.caption({ at: 26.0, dur: 4.9, text: 'It validates the labels and resolves the roles that this identity is allowed to carry.' });
  tl.tween(policyGlow, 1, { at: 26.3, dur: 0.5, ease: ease.pop });
  tl.tween(policyGlow, 0.2, { at: 28.3, dur: 0.7, ease: ease.move });
  tl.hold(30.9, 0.4);

  // BEAT 4 — a token is minted from the same request.
  tl.caption({ at: 31.3, dur: 5.0, text: 'A Biscuit token now binds the peer, its role, its policy facts, and its labels to a signed envelope.' });
  tl.tween(cam, CAMERA_HOME, { at: 31.5, dur: 1.2, ease: ease.move });
  tl.tween(sealU, 1, { at: 32.0, dur: 0.9, ease: ease.pop });
  tl.tween(identityX, 790, { at: 32.3, dur: 1.1, ease: ease.move });
  tl.tween(identityY, 186, { at: 32.3, dur: 1.1, ease: ease.move });
  tl.caption({ at: 36.8, dur: 4.8, text: 'The node verifies the required role before saving the token and the mesh configuration.' });
  tl.tween(saveU, 1, { at: 37.1, dur: 1.0, ease: ease.enter });
  tl.tween(routerU, 1, { at: 37.8, dur: 1.1, ease: ease.enter });
  tl.hold(41.6, 0.4);

  // BEAT 5 — the proof and the first route leave together.
  tl.caption({ at: 42.0, dur: 4.8, text: 'Router addresses come back with the proof, so the next move is a connection with a reason.' });
  tl.tween(identityX, ROUTER.x, { at: 42.3, dur: 1.7, ease: ease.move });
  tl.tween(identityY, ROUTER.y, { at: 42.3, dur: 1.7, ease: ease.move });
  tl.tween(sendU, 0.18, { at: 42.6, dur: 0.8, ease: ease.move });
  tl.caption({ at: 47.4, dur: 4.5, text: 'The request leaves the control plane carrying evidence, not just a name.' });
  tl.tween(dimU, 1, { at: 47.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 48.6, dur: 0.7, ease: ease.enter });
  tl.hold(54.4, 1.0);

  return { tl, cam, storeU, keyU, requestU, fieldU, sendU, policyU, policyGlow, sealU, routerU, saveU, identityX, identityY, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const envelope = { x: s.get(scene.identityX), y: s.get(scene.identityY) };
  const requestProgress = s.get(scene.requestU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={760}>The identity earns a route</text>
        <text x={640} y={75} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>GetOrGenerateKey · EnrollRequest · HandleRegister · MintBiscuitToken</text>

        <Connection from={{ x: 236, y: STORE.y }} to={{ x: 520, y: STORE.y }} u={s.get(scene.storeU)} flow={s.get(scene.sendU)} color={colors.ACCENT} label="POST /register" />
        <Connection from={{ x: 760, y: CONTROL.y }} to={{ x: 1050, y: ROUTER.y }} via={[{ x: 860, y: CONTROL.y }, { x: 860, y: ROUTER.y }]} u={s.get(scene.routerU)} flow={s.get(scene.sendU)} color={colors.POSITIVE} label="router_addresses" />

        <NodeBadge x={STORE.x} y={STORE.y} w={176} h={72} label="sam-node" sublabel="Store · local key" color={colors.ACCENT} u={s.get(scene.storeU)} glow={s.get(scene.keyU)} />
        <NodeBadge x={CONTROL.x} y={CONTROL.y} w={218} h={64} label="sam-control-plane" sublabel="identity registry" color={colors.SECONDARY} u={s.get(scene.policyU)} glow={s.get(scene.policyGlow)} />
        <NodeBadge x={ROUTER.x} y={ROUTER.y} w={168} h={72} label="sam-router" sublabel="first mesh route" color={colors.POSITIVE} u={s.get(scene.routerU)} glow={s.get(scene.routerU)} />

        <PolicyBlock u={s.get(scene.policyU)} glow={s.get(scene.policyGlow)} opacity={0.96} />
        <RequestCard u={requestProgress} fields={s.get(scene.fieldU)} glow={s.get(scene.sendU)} />

        <IdentityEnvelope x={envelope.x} y={envelope.y} u={Math.max(s.get(scene.keyU), s.get(scene.requestU), s.get(scene.sealU))} seal={s.get(scene.sealU)} glow={Math.max(s.get(scene.keyU), s.get(scene.policyGlow), s.get(scene.routerU))} />
        <Packet from={{ x: 228, y: 304 }} to={{ x: 512, y: 304 }} u={s.get(scene.sendU)} color={colors.WARM} r={6} label="EnrollRequest" />

        <g opacity={s.get(scene.saveU)}>
          <Chip x={788} y={274} text="SaveIdentity" color={colors.POSITIVE} w={122} />
          <Chip x={788} y={314} text="SaveMeshConfig" color={colors.POSITIVE} w={142} />
          <Chip x={788} y={354} text="control_plane_public_key" color={colors.SECONDARY} w={202} fontSize={10} />
        </g>
      </g>

      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={184} y={208} width={912} height={252} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={640} y={276} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={800}>A name becomes a credential</text>
          <text x={640} y={322} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>peer identity · policy facts · router addresses</text>
          <text x={640} y={366} textAnchor="middle" fill={colors.MUTED} fontSize={14}>the next gate can verify the same envelope locally</text>
          <text x={640} y={414} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>EnrollResponse → BiscuitToken + router_addresses</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
