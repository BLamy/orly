// Sovereign Agent Mesh — chapter 2: The gate before the road.
//
// Grounded in google/sam at 0fb93d87b89881977cc77589b35c98444b6b5270:
// internal/router/router.go, internal/node/node.go,
// internal/node/middleware.go, internal/node/gate.go, and api/sam.proto.
// The persistent object is one authenticated route: a Biscuit handshake
// changes an unopened door into a relay circuit.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

type Pt = { x: number; y: number };

const NODE: Pt = { x: 166, y: 350 };
const ROUTER: Pt = { x: 640, y: 350 };
const REMOTE: Pt = { x: 1114, y: 350 };
const RELAY_TOP: Pt = { x: 640, y: 188 };

function Chip({
  x,
  y,
  text,
  color = colors.MUTED,
  opacity = 1,
  w,
  h = 26,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  opacity?: number;
  w?: number;
  h?: number;
}) {
  const width = w ?? Math.max(60, text.length * 6.8 + 18);
  return (
    <g opacity={clamp01(opacity)}>
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={h / 2} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{text}</text>
    </g>
  );
}

function AuthGate({ u, open, denied, opacity = 1 }: { u: number; open: number; denied: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const oo = clamp01(open);
  const dd = clamp01(denied);
  const doorX = 640 + oo * 34;
  return (
    <g opacity={uu * opacity}>
      <rect x={536} y={236} width={208} height={228} rx={20} fill={colors.PANEL} stroke={dd > 0.1 ? colors.NEGATIVE : oo > 0.5 ? colors.POSITIVE : colors.WARM} strokeWidth={2.2} />
      <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={750}>authentication gate</text>
      <text x={640} y={294} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>WithBiscuitAuth</text>
      <path d="M580 322h120v90H580z" fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <path d="M580 322 640 350 700 322" fill="none" stroke={colors.GRID} strokeWidth={1.5} />
      <g transform={`translate(${doorX} 366)`}>
        <rect x={-30} y={-43} width={60} height={86} rx={8} fill={dd > 0.1 ? colors.NEGATIVE : oo > 0.5 ? colors.POSITIVE : colors.WARM} opacity={0.22 + 0.28 * oo} stroke={dd > 0.1 ? colors.NEGATIVE : oo > 0.5 ? colors.POSITIVE : colors.WARM} strokeWidth={2} />
        <circle cx={-10} cy={2} r={5} fill={colors.TEXT} />
        <path d="M-10 7v14" stroke={colors.TEXT} strokeWidth={2} strokeLinecap="round" />
      </g>
      <Chip x={640} y={434} text={dd > 0.1 ? 'rejected' : oo > 0.5 ? 'authenticated' : 'waiting'} color={dd > 0.1 ? colors.NEGATIVE : oo > 0.5 ? colors.POSITIVE : colors.WARM} w={122} />
    </g>
  );
}

function Token({ x, y, u, glow, label, opacity = 1 }: { x: number; y: number; u: number; glow: number; label: string; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const s = 0.78 + 0.22 * uu;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={uu * opacity}>
      {glow > 0 && <circle r={38} fill="none" stroke={colors.WARM} strokeWidth={2.4} opacity={0.28 * clamp01(glow)} />}
      <rect x={-31} y={-22} width={62} height={44} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
      <path d="M-18-6h36M-18 4h24M-18 14h15" stroke={colors.WARM} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
      <text y={38} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>{label}</text>
    </g>
  );
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const meshU = tl.channel('meshU', 0);
  const gateU = tl.channel('gateU', 0);
  const authU = tl.channel('authU', 0);
  const verifyU = tl.channel('verifyU', 0);
  const openU = tl.channel('openU', 0);
  const mutualU = tl.channel('mutualU', 0);
  const deniedU = tl.channel('deniedU', 0);
  const directU = tl.channel('directU', 0);
  const directDim = tl.channel('directDim', 0);
  const relayU = tl.channel('relayU', 0);
  const routeU = tl.channel('routeU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the three roles appear, but no road is open yet.
  tl.caption({ at: 0.4, dur: 4.7, text: 'The token from the first chapter is not a free pass; it has to open a door.' });
  tl.tween(meshU, 1, { at: 0.7, dur: 1.1, ease: ease.enter });
  tl.tween(gateU, 1, { at: 1.4, dur: 0.9, ease: ease.enter });
  tl.hold(5.4, 0.4);

  // BEAT 2 — the token enters the authentication protocol.
  tl.caption({ at: 5.8, dur: 4.6, text: 'A node opens the authentication protocol and presents its Biscuit.' });
  tl.tween(authU, 1, { at: 6.1, dur: 1.0, ease: ease.linear });
  tl.tween(cam, { x: 510, y: 350, k: 1.18 }, { at: 6.2, dur: 1.2, ease: ease.move });
  tl.hold(10.8, 0.4);

  // BEAT 3 — the router verifies before it remembers.
  tl.caption({ at: 11.2, dur: 4.8, text: "The router checks that token against the control plane's trusted public keys." });
  tl.tween(verifyU, 1, { at: 11.5, dur: 1.4, ease: ease.draw });
  tl.tween(openU, 1, { at: 12.4, dur: 1.0, ease: ease.move });
  tl.caption({ at: 16.4, dur: 4.9, text: 'When the check passes, the router remembers this peer in its authenticated set.' });
  tl.tween(mutualU, 1, { at: 16.7, dur: 1.0, ease: ease.enter });
  tl.hold(21.4, 0.4);

  // BEAT 4 — mutual proof returns through the same door.
  // Hold this explanation through the mutual-proof return. The recorded cue
  // is long enough to cover the verifier's mid-chapter seek after retiming.
  tl.caption({ at: 21.8, dur: 6.2, text: "The answer carries the router's own proof, so both sides can inspect the other." });
  tl.tween(authU, 0.22, { at: 22.1, dur: 0.8, ease: ease.move });
  tl.tween(mutualU, 1, { at: 22.4, dur: 1.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 22.8, dur: 1.3, ease: ease.move });
  tl.hold(26.9, 0.4);

  // BEAT 5 — relay ACLs turn authentication into a usable road.
  tl.caption({ at: 27.3, dur: 5.3, text: 'A relay reservation is allowed only for authenticated peers; an unknown caller stops at the gate.' });
  tl.tween(deniedU, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(directU, 1, { at: 28.2, dur: 0.9, ease: ease.draw });
  tl.tween(directDim, 0.82, { at: 30.0, dur: 0.8, ease: ease.move });
  tl.tween(deniedU, 0, { at: 30.3, dur: 0.8, ease: ease.move });
  tl.tween(relayU, 1, { at: 30.8, dur: 1.2, ease: ease.draw });
  tl.hold(34.8, 0.4);

  // BEAT 6 — address preparation changes the route, not the request.
  tl.caption({ at: 35.2, dur: 5.2, text: 'Address preparation drops a failed private path and builds a circuit through the router.' });
  tl.tween(cam, { x: 640, y: 330, k: 1.12 }, { at: 35.4, dur: 1.2, ease: ease.move });
  tl.tween(relayU, 1, { at: 36.0, dur: 0.9, ease: ease.enter });
  tl.tween(directDim, 1, { at: 36.4, dur: 0.7, ease: ease.move });
  tl.tween(routeU, 1, { at: 37.1, dur: 5.0, ease: ease.linear });
  tl.caption({ at: 40.4, dur: 4.8, text: 'The same request now crosses the relay, reaches the remote peer, and returns.' });
  tl.tween(routeU, 1, { at: 40.7, dur: 4.2, ease: ease.linear });
  tl.hold(45.6, 0.4);

  // BEAT 7 — quiet ending on the earned route.
  tl.caption({ at: 46.0, dur: 4.6, text: 'Connectivity is a consequence of proof.' });
  tl.tween(dimU, 1, { at: 46.3, dur: 0.9, ease: ease.move });
  tl.tween(endU, 1, { at: 47.0, dur: 0.7, ease: ease.enter });
  tl.hold(53.1, 1.0);

  return { tl, cam, meshU, gateU, authU, verifyU, openU, mutualU, deniedU, directU, directDim, relayU, routeU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const directOpacity = 1 - 0.65 * s.get(scene.directDim);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={760}>The gate before the road</text>
        <text x={640} y={75} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>AuthFrame · HandleAuthHandshake · authenticatedPeers · relayACL</text>

        <Connection from={{ x: 260, y: NODE.y }} to={{ x: 520, y: NODE.y }} u={s.get(scene.directU)} dim={1 - directOpacity} color={colors.MUTED} dashed label="direct address" />
        <Connection from={{ x: 760, y: ROUTER.y }} to={{ x: 1050, y: REMOTE.y }} u={s.get(scene.relayU)} flow={s.get(scene.routeU)} color={colors.POSITIVE} label="/p2p-circuit" />
        <Connection from={{ x: 760, y: ROUTER.y }} to={{ x: 1050, y: REMOTE.y }} via={[{ x: ROUTER.x, y: RELAY_TOP.y }, { x: REMOTE.x, y: RELAY_TOP.y }]} u={s.get(scene.relayU)} flow={s.get(scene.routeU)} color={colors.POSITIVE} label="relay circuit" />

        <NodeBadge x={NODE.x} y={NODE.y} w={164} h={70} label="sam-node" sublabel="authenticated caller" color={colors.ACCENT} u={s.get(scene.meshU)} glow={s.get(scene.authU)} />
        <NodeBadge x={ROUTER.x} y={ROUTER.y} w={172} h={70} label="sam-router" sublabel="bootstrap · relay" color={colors.SECONDARY} u={s.get(scene.meshU)} glow={s.get(scene.mutualU)} />
        <NodeBadge x={REMOTE.x} y={REMOTE.y} w={178} h={70} label="remote peer" sublabel="MCP target" color={colors.POSITIVE} u={s.get(scene.meshU)} glow={s.get(scene.routeU)} />
        <NodeBadge x={RELAY_TOP.x} y={RELAY_TOP.y} w={144} h={54} label="relay" sublabel="libp2p" color={colors.POSITIVE} u={s.get(scene.relayU)} glow={s.get(scene.routeU)} />

        <AuthGate u={s.get(scene.gateU)} open={s.get(scene.openU)} denied={s.get(scene.deniedU)} />
        <Token x={330} y={NODE.y} u={s.get(scene.authU)} glow={s.get(scene.verifyU)} label="Biscuit" />
        <Packet from={{ x: NODE.x + 78, y: NODE.y }} to={{ x: ROUTER.x - 102, y: ROUTER.y }} u={s.get(scene.authU)} color={colors.WARM} r={6} label="AuthFrame" />
        <Packet from={{ x: ROUTER.x + 104, y: ROUTER.y }} to={{ x: REMOTE.x - 106, y: REMOTE.y }} u={s.get(scene.mutualU)} color={colors.POSITIVE} r={5} label="AuthResponse" />
        <RequestFlow path={[NODE, ROUTER, REMOTE]} u={s.get(scene.routeU)} roundTrip color={colors.ACCENT} responseColor={colors.POSITIVE} label="request" responseLabel="response" hold />

        <g opacity={s.get(scene.verifyU)}>
          <Chip x={430} y={192} text="VerifyBiscuit" color={colors.WARM} w={132} />
          <Chip x={850} y={192} text="trusted public keys" color={colors.SECONDARY} w={158} />
        </g>
        <g opacity={s.get(scene.deniedU)}>
          <line x1={444} y1={418} x2={520} y2={490} stroke={colors.NEGATIVE} strokeWidth={3} />
          <line x1={520} y1={418} x2={444} y2={490} stroke={colors.NEGATIVE} strokeWidth={3} />
          <Chip x={482} y={514} text="AllowReserve = false" color={colors.NEGATIVE} w={166} />
        </g>
        <g opacity={s.get(scene.relayU)}>
          <Chip x={640} y={548} text="AllowConnect" color={colors.POSITIVE} w={126} />
          <Chip x={820} y={548} text="authenticated peer" color={colors.POSITIVE} w={152} />
        </g>
      </g>

      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={208} y={218} width={864} height={224} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={640} y={282} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={800}>The road is earned</text>
          <text x={640} y={330} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>Biscuit verified · peers mutual · relay allowed</text>
          <text x={640} y={374} textAnchor="middle" fill={colors.MUTED} fontSize={14}>one request, now able to cross the mesh</text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>AuthProtocolID → authenticatedPeers → relay circuit</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
