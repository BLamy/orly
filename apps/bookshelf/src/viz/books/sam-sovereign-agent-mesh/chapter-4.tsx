// Sovereign Agent Mesh — chapter 4: One call, many proofs.
//
// Grounded in google/sam at 0fb93d87b89881977cc77589b35c98444b6b5270:
// internal/node/mcp.go, internal/node/middleware.go, internal/node/gate.go,
// internal/node/sidecar.go, internal/node/mcp_handlers.go, and api/sam.proto.
// The persistent object is one remote-tool request. It splits, authenticates,
// enters an MCP session, and returns as a result without losing its identity.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, NodeBadge, Packet, RequestFlow } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

type Pt = { x: number; y: number };

const SIDECAR: Pt = { x: 162, y: 356 };
const GATE: Pt = { x: 640, y: 356 };
const TARGET: Pt = { x: 1114, y: 356 };
const STAGES = ['call_remote_tool', 'SplitToolName', 'AuthFrame', 'session.CallTool'];

function Chip({ x, y, text, color = colors.MUTED, opacity = 1, w, h = 26, fontSize = 11, fill = colors.PANEL }: { x: number; y: number; text: string; color?: string; opacity?: number; w?: number; h?: number; fontSize?: number; fill?: string }) {
  const width = w ?? Math.max(62, text.length * fontSize * 0.62 + 18);
  return (
    <g opacity={clamp01(opacity)}>
      <rect x={x - width / 2} y={y - h / 2} width={width} height={h} rx={h / 2} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x} y={y + fontSize * 0.34} textAnchor="middle" fill={colors.TEXT} fontSize={fontSize} fontFamily={MONO}>{text}</text>
    </g>
  );
}

function CallCard({ u, split, labels, opacity = 1 }: { u: number; split: number; labels: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const ss = clamp01(split);
  return (
    <g opacity={uu * opacity}>
      <rect x={24} y={180} width={278} height={144} rx={18} fill={colors.PANEL} stroke={ss > 0.5 ? colors.WARM : colors.ACCENT} strokeWidth={ss > 0.5 ? 2.2 : 1.4} />
      <text x={163} y={210} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={740}>CallRemoteToolParams</text>
      <Chip x={92} y={245} text="peer_id" color={colors.ACCENT} w={88} />
      <Chip x={226} y={245} text="tool_name" color={colors.SECONDARY} w={102} />
      <Chip x={92} y={282} text="arguments" color={colors.POSITIVE} w={102} />
      <Chip x={226} y={282} text="required_labels" color={colors.WARM} w={128} fontSize={10} />
      {ss > 0.2 && <path d="M310 252h92M310 278h92" stroke={colors.WARM} strokeWidth={2.2} strokeDasharray="6 5" opacity={ss} />}
      {ss > 0.2 && <g opacity={ss}><Chip x={474} y={244} text="mcp://code-reviewer" color={colors.SECONDARY} w={174} fontSize={10} /><Chip x={474} y={282} text="review_pr" color={colors.POSITIVE} w={108} /></g>}
      {labels > 0.2 && <Chip x={163} y={349} text="labels checked before call" color={colors.WARM} w={182} fontSize={10} />}
    </g>
  );
}

function SessionGate({ u, auth, ack, opacity = 1 }: { u: number; auth: number; ack: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const aa = clamp01(auth);
  const kk = clamp01(ack);
  return (
    <g opacity={uu * opacity}>
      <rect x={526} y={248} width={228} height={218} rx={20} fill={colors.PANEL} stroke={kk > 0.4 ? colors.POSITIVE : colors.WARM} strokeWidth={2.2} />
      <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={750}>MCP stream</text>
      <text x={640} y={304} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>ConnectMCPSession</text>
      <Chip x={640} y={342} text="AuthFrame" color={colors.WARM} w={112} opacity={aa} />
      <path d="M640 360v38" stroke={colors.GRID} strokeWidth={2} strokeDasharray="5 6" opacity={aa} />
      <Chip x={640} y={420} text="AuthResponse" color={colors.POSITIVE} w={126} opacity={kk} />
      {kk > 0.5 && <circle cx={716} cy={420} r={5} fill={colors.POSITIVE} />}
    </g>
  );
}

function CallRibbon({ u, opacity = 1 }: { u: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  const x0 = 340;
  const y = 108;
  const w = 600;
  const segment = w / STAGES.length;
  const current = Math.min(STAGES.length - 1, Math.floor(uu * STAGES.length));
  return (
    <g opacity={uu * opacity}>
      <path d={`M${x0} ${y}H${x0 + w}`} stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" />
      <path d={`M${x0} ${y}H${x0 + w * uu}`} stroke={colors.ACCENT} strokeWidth={8} strokeLinecap="round" />
      {STAGES.map((stage, i) => {
        const cx = x0 + segment * (i + 0.5);
        const on = i <= current;
        return (
          <g key={stage}>
            <circle cx={cx} cy={y} r={on ? 14 : 10} fill={on ? (i === STAGES.length - 1 ? colors.POSITIVE : colors.ACCENT) : colors.PANEL} stroke={on ? colors.ACCENT : colors.GRID} strokeWidth={2} />
            <text x={cx} y={y - 26} textAnchor="middle" fill={on ? colors.TEXT : colors.MUTED} fontSize={10} fontFamily={MONO}>{stage}</text>
          </g>
        );
      })}
    </g>
  );
}

function EgressRibbon({ u, opacity = 1 }: { u: number; opacity?: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || opacity <= 0) return null;
  return (
    <g opacity={uu * opacity}>
      <rect x={250} y={548} width={780} height={56} rx={28} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
      <path d="M300 576H970" stroke={colors.SECONDARY} strokeWidth={3} strokeDasharray="8 8" strokeDashoffset={-uu * 120} />
      <Packet from={{ x: 300, y: 576 }} to={{ x: 970, y: 576 }} u={uu} color={colors.SECONDARY} r={6} />
      <Chip x={390} y={576} text="X-Sam-Biscuit" color={colors.POSITIVE} w={132} fontSize={10} />
      <Chip x={640} y={576} text="libp2p://peer/service" color={colors.SECONDARY} w={174} fontSize={10} />
      <Chip x={884} y={576} text="local gate stripped" color={colors.WARM} w={144} fontSize={10} />
    </g>
  );
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const sidecarU = tl.channel('sidecarU', 0);
  const requestU = tl.channel('requestU', 0);
  const splitU = tl.channel('splitU', 0);
  const streamU = tl.channel('streamU', 0);
  const authU = tl.channel('authU', 0);
  const ackU = tl.channel('ackU', 0);
  const targetU = tl.channel('targetU', 0);
  const callU = tl.channel('callU', 0);
  const labelsU = tl.channel('labelsU', 0);
  const resultU = tl.channel('resultU', 0);
  const egressU = tl.channel('egressU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  // BEAT 1 — the local sidecar is the narrow entry point.
  tl.caption({ at: 0.4, dur: 4.9, text: 'The local sidecar gives the agent one narrow door into the node.' });
  tl.tween(sidecarU, 1, { at: 0.7, dur: 1.0, ease: ease.enter });
  tl.tween(requestU, 1, { at: 1.5, dur: 0.9, ease: ease.enter });
  tl.hold(5.7, 0.4);

  // BEAT 2 — request fields become one card.
  tl.caption({ at: 6.1, dur: 5.0, text: 'The call carries a peer, a namespaced tool, structured arguments, and an optional label requirement.' });
  tl.tween(callU, 0.18, { at: 6.4, dur: 0.7, ease: ease.enter });
  tl.tween(labelsU, 1, { at: 7.0, dur: 0.8, ease: ease.pop });
  tl.hold(11.5, 0.4);

  // BEAT 3 — SplitToolName exposes the target service.
  tl.caption({ at: 11.9, dur: 5.0, text: 'The node splits the service name from the tool name before it opens the stream.' });
  tl.tween(splitU, 1, { at: 12.2, dur: 1.1, ease: ease.move });
  tl.tween(cam, { x: 470, y: 300, k: 1.18 }, { at: 12.4, dur: 1.2, ease: ease.move });
  tl.tween(callU, 0.34, { at: 13.0, dur: 0.8, ease: ease.move });
  tl.hold(17.3, 0.4);

  // BEAT 4 — the stream cannot become a session before the handshake.
  tl.caption({ at: 17.7, dur: 5.0, text: 'It sends an authentication frame first and waits for the other side to answer.' });
  tl.tween(streamU, 1, { at: 18.0, dur: 0.9, ease: ease.enter });
  tl.tween(authU, 1, { at: 18.5, dur: 1.1, ease: ease.linear });
  tl.tween(callU, 0.56, { at: 19.0, dur: 1.0, ease: ease.linear });
  tl.hold(22.7, 0.4);

  // BEAT 5 — target-side proof returns and label requirements stay narrow.
  tl.caption({ at: 23.1, dur: 5.2, text: 'The target verifies the proof, checks the requested service, and returns its own identity.' });
  tl.tween(ackU, 1, { at: 23.4, dur: 1.0, ease: ease.linear });
  tl.tween(targetU, 1, { at: 24.0, dur: 0.9, ease: ease.enter });
  tl.tween(callU, 0.7, { at: 24.4, dur: 1.1, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 25.0, dur: 1.3, ease: ease.move });
  tl.hold(28.7, 0.4);

  // BEAT 6 — the authenticated session carries structured arguments.
  tl.caption({ at: 29.1, dur: 5.4, text: 'Now the Model Context Protocol session can hand structured arguments to the selected tool.' });
  tl.tween(callU, 1, { at: 29.4, dur: 2.0, ease: ease.linear });
  tl.tween(resultU, 0.45, { at: 31.2, dur: 0.8, ease: ease.enter });
  tl.hold(34.9, 0.4);

  // BEAT 7 — the target chooses pass-through or catalog.
  tl.caption({ at: 35.3, dur: 5.4, text: 'The stream gate either passes through a registered service or serves the local catalog.' });
  tl.tween(targetU, 1, { at: 35.6, dur: 0.8, ease: ease.pop });
  tl.tween(resultU, 1, { at: 36.5, dur: 1.2, ease: ease.enter });
  tl.tween(callU, 1, { at: 37.0, dur: 1.0, ease: ease.move });
  tl.hold(41.1, 0.4);

  // BEAT 8 — the sidecar's HTTP egress is the same proof in a new wrapper.
  tl.caption({ at: 41.5, dur: 5.2, text: 'For an outbound web request, the sidecar rewrites the destination as a peer service path and carries the mesh proof.' });
  tl.tween(egressU, 1, { at: 41.8, dur: 2.2, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 400, k: 1.08 }, { at: 42.0, dur: 1.2, ease: ease.move });
  tl.hold(47.1, 0.4);

  // BEAT 9 — quiet recap over a clean stage.
  tl.caption({ at: 47.5, dur: 6.0, text: 'One request has crossed identity, route, discovery, and a tool call; each step left evidence for the next.' });
  tl.tween(dimU, 1, { at: 47.9, dur: 0.9, ease: ease.move });
  tl.tween(endU, 1, { at: 48.7, dur: 0.7, ease: ease.enter });
  tl.hold(55.9, 1.0);

  return { tl, cam, sidecarU, requestU, splitU, streamU, authU, ackU, targetU, callU, labelsU, resultU, egressU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={760}>One call, many proofs</text>
        <text x={640} y={75} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>StartSidecarServer · ConnectMCPSession · WithBiscuitAuth · HandleMCPStream</text>

        <CallRibbon u={s.get(scene.callU)} />
        <Connection from={{ x: SIDECAR.x + 90, y: SIDECAR.y }} to={{ x: GATE.x - 114, y: GATE.y }} u={s.get(scene.streamU)} flow={s.get(scene.callU)} color={colors.ACCENT} label="MCPProtocolID" />
        <Connection from={{ x: GATE.x + 114, y: GATE.y }} to={{ x: TARGET.x - 104, y: TARGET.y }} u={s.get(scene.targetU)} flow={s.get(scene.resultU)} color={colors.POSITIVE} label="selected service" />

        <NodeBadge x={SIDECAR.x} y={SIDECAR.y} w={184} h={78} label="sidecar" sublabel="/mcp · /sam/ · /v1/*" color={colors.ACCENT} u={s.get(scene.sidecarU)} glow={s.get(scene.requestU)} />
        <NodeBadge x={TARGET.x} y={TARGET.y} w={196} h={78} label="remote service" sublabel="MCPService" color={colors.POSITIVE} u={s.get(scene.targetU)} glow={s.get(scene.resultU)} />
        <SessionGate u={s.get(scene.streamU)} auth={s.get(scene.authU)} ack={s.get(scene.ackU)} />
        <CallCard u={s.get(scene.requestU)} split={s.get(scene.splitU)} labels={s.get(scene.labelsU)} />

        <Packet from={SIDECAR} to={{ x: GATE.x - 122, y: GATE.y }} u={s.get(scene.authU)} color={colors.WARM} r={6} label="AuthFrame" />
        <Packet from={{ x: GATE.x + 122, y: GATE.y }} to={TARGET} u={s.get(scene.ackU)} color={colors.POSITIVE} r={5} label="AuthResponse" />
        <RequestFlow path={[SIDECAR, GATE, TARGET]} u={s.get(scene.callU)} roundTrip color={colors.ACCENT} responseColor={colors.POSITIVE} label="tool call" responseLabel="result" hold />

        <g opacity={s.get(scene.resultU)}>
          <rect x={968} y={470} width={292} height={86} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={1114} y={500} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={720}>session.CallTool</text>
          <text x={1114} y={530} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>structured result</text>
        </g>
        <EgressRibbon u={s.get(scene.egressU)} />
        <g opacity={s.get(scene.labelsU)}>
          <Chip x={388} y={390} text="required_labels" color={colors.WARM} w={132} fontSize={10} />
          <Chip x={540} y={390} text="checkPeerLabels" color={colors.WARM} w={134} fontSize={10} />
        </g>
      </g>

      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={178} y={198} width={924} height={270} rx={26} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={640} y={266} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={800}>A request that can prove itself</text>
          <text x={640} y={314} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>identity → route → discovery → tool result</text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={14}>the same request changes transport without losing its facts</text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>call_remote_tool → ConnectMCPSession → session.CallTool</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
