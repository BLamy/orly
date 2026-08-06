// Two Roads Into One Project
//
// Backed by the live loop-qa tunnel path: netlify/functions/lib/tunnel/backend.ts
// and tunnel.ts (AWS/Kubernetes gateway, per-session frps pod, ClusterIP data/admin
// host, and the asynchronously allocated network-load-balancer control hostname),
// tunnel/health.ts (DNS and TCP gates), infra/frp-tunnel/orchestrator/tunnel-proxy.ts
// (the private data path and pre-dispatch health gate), and the managed replayqa
// client contract (local forward proxy, frpc supervisor, reconnect, and target wait).
//
// Machine: two persistent rails share one project key without ever merging.
// The upper rail is browser data crossing an outbound-only frp tunnel into a
// laptop. The lower rail is an agent calling LoopQA's MCP catalog. A readiness
// ladder explains why an allocated AWS endpoint is not immediately usable, and
// a recovery loop shows suspend → reconnect → resume without losing the run.
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
import { Connection, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LAPTOP = { x: 55, y: 115, w: 420, h: 395 };
const AWS = { x: 545, y: 95, w: 675, h: 425 };
const APP = { x: 150, y: 275 };
const PROXY = { x: 350, y: 275 };
const FRPC = { x: 350, y: 420 };
const ONBOARD = { x: 655, y: 155 };
const CONTROL = { x: 935, y: 155 };
const FRPS = { x: 750, y: 300 };
const NLB = { x: 1080, y: 300 };
const BROWSER = { x: 1080, y: 440 };
const ORCH = { x: 900, y: 440 };
const PROJECT = { x: 500, y: 575 };
const MCP = { x: 790, y: 575 };
const AGENT = { x: 1080, y: 575 };

const CAM_PROJECT: CameraState = { x: 640, y: 350, k: 0.95 };
const CAM_LOCAL: CameraState = { x: 360, y: 300, k: 1.0 };
const CAM_CONTROL: CameraState = { x: 650, y: 300, k: 1.04 };
const CAM_DATA: CameraState = { x: 680, y: 300, k: 0.98 };
const CAM_HEALTH: CameraState = { x: 760, y: 335, k: 0.82 };
const CAM_MCP: CameraState = { x: 820, y: 500, k: 1.08 };
const CAM_WIDE: CameraState = { x: 640, y: 355, k: 0.95 };

const DATA_PATH = [
  { x: BROWSER.x - 92, y: BROWSER.y },
  { x: FRPS.x + 92, y: FRPS.y },
  { x: FRPC.x + 92, y: FRPC.y },
  { x: PROXY.x - 92, y: PROXY.y },
  { x: APP.x + 92, y: APP.y },
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  projectU: ChannelRef<number>;
  onboardU: ChannelRef<number>;
  localU: ChannelRef<number>;
  managedU: ChannelRef<number>;
  awsU: ChannelRef<number>;
  dnsU: ChannelRef<number>;
  targetU: ChannelRef<number>;
  frpControlU: ChannelRef<number>;
  dataU: ChannelRef<number>;
  healthU: ChannelRef<number>;
  disconnectU: ChannelRef<number>;
  resumeU: ChannelRef<number>;
  mcpU: ChannelRef<number>;
  toolsU: ChannelRef<number>;
  keyU: ChannelRef<number>;
  warningU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const projectU = tl.channel('projectU', 0);
  const onboardU = tl.channel('onboardU', 0);
  const localU = tl.channel('localU', 0);
  const managedU = tl.channel('managedU', 0);
  const awsU = tl.channel('awsU', 0);
  const dnsU = tl.channel('dnsU', 0);
  const targetU = tl.channel('targetU', 0);
  const frpControlU = tl.channel('frpControlU', 0);
  const dataU = tl.channel('dataU', 0);
  const healthU = tl.channel('healthU', 0);
  const disconnectU = tl.channel('disconnectU', 0);
  const resumeU = tl.channel('resumeU', 0);
  const mcpU = tl.channel('mcpU', 0);
  const toolsU = tl.channel('toolsU', 0);
  const keyU = tl.channel('keyU', 0);
  const warningU = tl.channel('warningU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · a private target needs another entrance —
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'A private Slack app can have a Replay QA project while still being unreachable from a hosted browser. Reverse-proxy setup begins in onboarding or the service’s web interface.',
  });
  tl.tween(cam, CAM_PROJECT, { at: t - 6.7, dur: 1.4, ease: ease.move });
  tl.tween(projectU, 1, { at: t - 6.2, dur: 0.8, ease: ease.enter });
  tl.tween(onboardU, 1, { at: t - 5.2, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.6);

  // — Beat 2 · AWS provisions the host container —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'The Amazon Web Services gateway provisions a session-scoped host container: an frps pod, a private cluster-service name for data and health, and a public network-load-balancer endpoint for the client control connection.',
  });
  tl.tween(cam, CAM_CONTROL, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(awsU, 1, { at: t - 5.9, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.5);

  // — Beat 3 · the public hostname is not ready yet —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'The network load balancer hostname can appear before public domain-name lookup catches up. Replay QA keeps the session row and polls for an address instead of giving an early negative answer to frpc.',
  });
  tl.tween(cam, CAM_DATA, { at: t - 6.7, dur: 1.4, ease: ease.move });
  tl.tween(dnsU, 0.2, { at: t - 6.0, dur: 1.0, ease: ease.enter });
  tl.tween(dnsU, 1, { at: t - 2.8, dur: 2.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 4 · the managed client starts after DNS —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Only after domain-name lookup returns an address does the managed command write its frpc configuration, start the local allowlisted proxy, and open an outbound control connection. Nothing dials into the laptop.',
  });
  tl.tween(cam, CAM_LOCAL, { at: t - 6.5, dur: 1.4, ease: ease.move });
  tl.tween(localU, 1, { at: t - 5.9, dur: 1.0, ease: ease.draw });
  tl.tween(managedU, 1, { at: t - 5.1, dur: 1.6, ease: ease.move });
  tl.tween(frpControlU, 1, { at: t - 3.8, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 5 · client app startup is its own wait —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'The application on the client machine is a separate gate. If it has not started yet, the tunnel can remain provisioned while the managed client waits and retries local target health.',
  });
  tl.tween(cam, CAM_LOCAL, { at: t - 6.3, dur: 1.2, ease: ease.move });
  tl.tween(targetU, 0.22, { at: t - 5.4, dur: 1.1, ease: ease.enter });
  tl.tween(targetU, 0.52, { at: t - 2.6, dur: 2.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 6 · three gates make ready —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Ready means three things: the host container serves, the control port accepts a connection, and frpc reports its user-target proxy online. The test browser then reaches the app through the private data host.',
  });
  tl.tween(cam, CAM_HEALTH, { at: t - 6.5, dur: 1.3, ease: ease.move });
  tl.tween(targetU, 1, { at: t - 5.3, dur: 1.5, ease: ease.linear });
  tl.tween(healthU, 1, { at: t - 4.8, dur: 2.1, ease: ease.linear });
  tl.tween(dataU, 1, { at: t - 2.9, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  // — Beat 7 · MCP is a second road —
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'Meanwhile, an agent reaches the same Replay QA project through the Model Context Protocol server. That control request never enters the tunnel or the browser data path.',
  });
  tl.tween(cam, CAM_MCP, { at: t - 6.2, dur: 1.5, ease: ease.move });
  tl.tween(keyU, 1, { at: t - 5.7, dur: 1.2, ease: ease.draw });
  tl.tween(mcpU, 1, { at: t - 5.0, dur: 3.8, ease: ease.linear });
  t = tl.hold(t, 0.6);

  // — Beat 8 · a mid-run disconnect suspends work —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'If frpc drops during a run, the health gate sees user-target offline. The browser work suspends at the boundary, records the disconnect, and waits instead of turning a transient tunnel loss into a false test result.',
  });
  tl.tween(cam, CAM_HEALTH, { at: t - 6.6, dur: 1.4, ease: ease.move });
  tl.tween(disconnectU, 1, { at: t - 5.8, dur: 1.0, ease: ease.pop });
  tl.tween(dataU, 0.08, { at: t - 4.8, dur: 1.2, ease: ease.move });
  tl.tween(healthU, 0, { at: t - 4.2, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0.5);

  // — Beat 9 · reconnect and resume —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'The managed client reconnects or restarts frpc, while the same session row and endpoint stay in place. A fresh online signal releases the pause and the run resumes with its evidence intact.',
  });
  tl.tween(cam, CAM_CONTROL, { at: t - 6.4, dur: 1.3, ease: ease.move });
  tl.tween(frpControlU, 1, { at: t - 5.7, dur: 2.0, ease: ease.linear });
  tl.tween(healthU, 1, { at: t - 4.0, dur: 1.4, ease: ease.linear });
  tl.tween(dataU, 1, { at: t - 2.8, dur: 1.8, ease: ease.linear });
  tl.tween(disconnectU, 0, { at: t - 2.1, dur: 0.9, ease: ease.move });
  tl.tween(resumeU, 1, { at: t - 1.4, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  // — Beat 10 · dead endpoints are reaped, not confused with waits —
  t = tl.caption({
    at: t,
    dur: 7.2,
    text: 'A real dead endpoint is different from a domain-name or client wait. If the host container never serves or its public control port stays unreachable past the timeout, the gateway reaps it and the next poll reprovisions cleanly.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 6.5, dur: 1.5, ease: ease.move });
  tl.tween(warningU, 1, { at: t - 5.6, dur: 0.8, ease: ease.pop });
  tl.tween(toolsU, 1, { at: t - 4.9, dur: 2.0, ease: ease.move });
  t = tl.hold(t, 0.6);

  // — Beat 11 · close —
  t = tl.caption({
    at: t,
    dur: 7.0,
    text: 'Cloud readiness, local target readiness, and frpc connectivity are three gates on one project key. Wait, suspend, reconnect, resume — without losing the recording or the catalog history.',
  });
  tl.tween(dimU, 1, { at: t - 6.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 5.2, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.0);

  return {
    tl,
    cam,
    projectU,
    onboardU,
    localU,
    managedU,
    awsU,
    dnsU,
    targetU,
    frpControlU,
    dataU,
    healthU,
    disconnectU,
    resumeU,
    mcpU,
    toolsU,
    keyU,
    warningU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */
function OnboardingCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu * (1 - 0.78 * dim)}>
      <rect x={520} y={28} width={420} height={54} rx={12} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
      <text x={540} y={52} fill={colors.WARM} fontSize={11.5} fontFamily={MONO} fontWeight={700}>
        WEB ONBOARDING
      </text>
      <text x={540} y={70} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
        POST /api/v1/projects · use_reverse_proxy: true · start_paused
      </text>
      <path
        d={`M 655 82 C 655 105, ${ONBOARD.x} 112, ${ONBOARD.x} ${115 + 40 * uu}`}
        fill="none"
        stroke={colors.WARM}
        strokeWidth={1.6}
        strokeDasharray="4 5"
      />
    </g>
  );
}

function CommandChip({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(86, ${76 + (1 - uu) * 12})`} opacity={uu * (1 - 0.8 * dim)}>
      <rect width={362} height={44} rx={11} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={18} y={27} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
        npx replayqa proxy --project &lt;qa-project-id&gt;
      </text>
    </g>
  );
}

function DataPacket({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 1) return null;
  const lengths: number[] = [];
  let total = 0;
  for (let i = 1; i < DATA_PATH.length; i++) {
    const len = Math.hypot(DATA_PATH[i].x - DATA_PATH[i - 1].x, DATA_PATH[i].y - DATA_PATH[i - 1].y);
    lengths.push(len);
    total += len;
  }
  let target = uu * total;
  let x = DATA_PATH[0].x;
  let y = DATA_PATH[0].y;
  for (let i = 1; i < DATA_PATH.length; i++) {
    const len = lengths[i - 1];
    if (target <= len || i === DATA_PATH.length - 1) {
      const p = len ? target / len : 0;
      x = DATA_PATH[i - 1].x + (DATA_PATH[i].x - DATA_PATH[i - 1].x) * p;
      y = DATA_PATH[i - 1].y + (DATA_PATH[i].y - DATA_PATH[i - 1].y) * p;
      break;
    }
    target -= len;
  }
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - 0.78 * dim}>
      <circle r={10} fill={colors.TEAL} />
      <circle r={17} fill="none" stroke={colors.TEAL} strokeWidth={1.4} opacity={0.45} />
      <path d="M -4 -3 h 8 v 6 h -8 Z" fill={colors.BG} opacity={0.9} />
    </g>
  );
}

function ToolFan({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  const tools = ['list_projects', 'list_journeys', 'list_test_runs', 'list_explorations'];
  if (uu <= 0) return null;
  return (
    <g opacity={1 - 0.8 * dim}>
      {tools.map((tool, i) => {
        const p = clamp01(uu * 4.5 - i * 0.9);
        if (p <= 0) return null;
        const angle = -145 + i * 38;
        const a = (angle * Math.PI) / 180;
        const x = MCP.x + Math.cos(a) * (72 + 52 * p);
        const y = MCP.y + Math.sin(a) * (72 + 52 * p);
        const w = tool.length * 6.5 + 20;
        return (
          <g key={tool} transform={`translate(${x}, ${y + (1 - p) * 10})`} opacity={p}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={13} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text y={4} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.2} fontFamily={MONO}>
              {tool}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function SharedKeySpine({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu * (1 - 0.75 * dim)}>
      <line
        x1={PROJECT.x}
        y1={PROJECT.y - 30}
        x2={PROJECT.x + (FRPS.x - PROJECT.x) * uu}
        y2={PROJECT.y - 30 + (FRPS.y + 58 - PROJECT.y + 30) * uu}
        stroke={colors.WARM}
        strokeWidth={1.5}
        strokeDasharray="3 6"
      />
      {uu > 0.8 && (
        <g transform="translate(612, 466)">
          <rect x={-92} y={-14} width={184} height={28} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.1} />
          <text y={4} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
            same qa-project-id · not traffic
          </text>
        </g>
      )}
    </g>
  );
}

function ReadinessRail({
  aws,
  dns,
  target,
  frp,
  health,
  disconnect,
  resume,
  dim,
}: {
  aws: number;
  dns: number;
  target: number;
  frp: number;
  health: number;
  disconnect: number;
  resume: number;
  dim: number;
}) {
  const stages = [
    { label: 'AWS host', u: aws, color: colors.SECONDARY },
    { label: 'public DNS', u: dns, color: colors.WARM },
    { label: 'local app', u: target, color: colors.ACCENT },
    { label: 'frpc online', u: frp, color: colors.ACCENT },
    { label: 'ready', u: health, color: colors.TEAL },
  ];
  const opacity = 1 - 0.82 * dim;
  return (
    <g transform="translate(566, 502)" opacity={opacity}>
      <line x1={12} y1={0} x2={612} y2={0} stroke={colors.GRID} strokeWidth={2} />
      {stages.map((stage, i) => {
        const x = 18 + i * 148;
        const u = clamp01(stage.u);
        return (
          <g key={stage.label} transform={`translate(${x}, 0)`}>
            <circle r={11} fill={u > 0.82 ? stage.color : colors.BG} stroke={u > 0.82 ? stage.color : colors.MUTED} strokeWidth={2} />
            {u > 0.82 && <circle r={4} fill={colors.BG} />}
            <text y={26} textAnchor="middle" fill={u > 0.82 ? stage.color : colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              {stage.label}
            </text>
          </g>
        );
      })}
      {disconnect > 0.2 && (
        <g transform="translate(318, -23)" opacity={clamp01(disconnect)}>
          <rect x={-76} y={-12} width={152} height={24} rx={12} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.2} />
          <text y={4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={9.5} fontFamily={MONO}>
            SUSPENDED · frpc offline
          </text>
        </g>
      )}
      {resume > 0.2 && (
        <g transform="translate(598, -23)" opacity={clamp01(resume)}>
          <rect x={-58} y={-12} width={116} height={24} rx={12} fill={colors.BG} stroke={colors.TEAL} strokeWidth={1.2} />
          <text y={4} textAnchor="middle" fill={colors.TEAL} fontSize={9.5} fontFamily={MONO}>
            RESUMED
          </text>
        </g>
      )}
    </g>
  );
}

function RecoveryCard({ disconnect, resume, dim }: { disconnect: number; resume: number; dim: number }) {
  const u = Math.max(clamp01(disconnect), clamp01(resume));
  if (u <= 0) return null;
  const recovering = resume > disconnect;
  return (
    <g transform={`translate(1070, ${54 + (1 - u) * 8})`} opacity={u * (1 - 0.72 * dim)}>
      <rect x={-138} y={-18} width={276} height={36} rx={10} fill={colors.PANEL} stroke={recovering ? colors.TEAL : colors.NEGATIVE} strokeWidth={1.4} />
      <text y={-1} textAnchor="middle" fill={recovering ? colors.TEAL : colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} fontWeight={700}>
        {recovering ? 'frpc online · resume run' : 'frpc offline · suspend run'}
      </text>
      <text y={14} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
        same session row · evidence preserved
      </text>
    </g>
  );
}

function WarningCard({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${92 + (1 - uu) * 12})`} opacity={uu * (1 - 0.65 * dim)}>
      <rect x={-270} y={-34} width={540} height={68} rx={14} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.8} />
      <text y={-7} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontWeight={750}>
        dead endpoint ≠ a transient wait
      </text>
      <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        timeout → reap host → reprovision cleanly
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${326 + (1 - uu) * 14})`} opacity={uu}>
      <rect x={-372} y={-104} width={744} height={208} rx={18} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.6} />
      <text y={-57} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={760}>
        Two roads. One project key.
      </text>
      <line x1={-278} y1={-18} x2={278} y2={-18} stroke={colors.GRID} />
      <circle cx={-286} cy={20} r={8} fill={colors.TEAL} />
      <text x={-264} y={25} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
        browser → private ClusterIP → frps → local :8888 → app
      </text>
      <circle cx={-286} cy={58} r={8} fill={colors.SECONDARY} />
      <text x={-264} y={63} fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
        agent → LoopQA MCP → project evidence catalog
      </text>
      <text y={91} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
        NLB control + DNS gate · suspend/reconnect · correlation by project identifier
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const local = clamp01(s.get(scene.localU));
  const managed = clamp01(s.get(scene.managedU));
  const aws = clamp01(s.get(scene.awsU));
  const dns = clamp01(s.get(scene.dnsU));
  const target = clamp01(s.get(scene.targetU));
  const controlFlow = clamp01(s.get(scene.frpControlU));
  const data = clamp01(s.get(scene.dataU));
  const health = clamp01(s.get(scene.healthU));
  const disconnect = clamp01(s.get(scene.disconnectU));
  const resume = clamp01(s.get(scene.resumeU));
  const mcp = clamp01(s.get(scene.mcpU));
  const project = clamp01(s.get(scene.projectU));
  const localDim = clamp01((1 - target) * 0.65 + disconnect * 0.55);
  const upperDim = clamp01(mcp * 0.9);
  const localLayerDim = Math.max(dim, localDim, upperDim);
  const awsLayerDim = Math.max(dim, upperDim, disconnect * 0.35);
  const projectStageU = project * clamp01(1 - health + mcp + resume * 0.2);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={(1 - 0.82 * dim) * (1 - 0.88 * upperDim)}>
          <Zone x={LAPTOP.x} y={LAPTOP.y} w={LAPTOP.w} h={LAPTOP.h} label="developer laptop" kind="group" u={local * (1 - localDim)} color={colors.ACCENT} dim={localLayerDim} />
          <Zone x={AWS.x} y={AWS.y} w={AWS.w} h={AWS.h} label="AWS / Kubernetes session gateway" kind="provider" u={aws} color={colors.SECONDARY} dim={awsLayerDim} />

          <ServiceNode x={APP.x} y={APP.y} kind="server" label="Slack app" sublabel="private target" w={174} u={managed * (1 - localDim)} dim={localLayerDim} />
          <ServiceNode x={PROXY.x} y={PROXY.y} kind="gateway" label="forward proxy" sublabel="127.0.0.1:8888 · allowlist" w={205} u={managed * (1 - localDim)} dim={localLayerDim} />
          <ServiceNode x={FRPC.x} y={FRPC.y} kind="client" label="frpc" sublabel="managed tunnel client" w={186} u={managed * (1 - localDim)} dim={localLayerDim} />

          <ServiceNode x={ONBOARD.x} y={ONBOARD.y} kind="client" label="web onboarding" sublabel="reverse-proxy project setup" w={210} u={s.get(scene.onboardU)} dim={awsLayerDim} />
          <ServiceNode x={CONTROL.x} y={CONTROL.y} kind="fn" label="AWS gateway" sublabel="provision + lifecycle" w={210} u={aws} dim={awsLayerDim} />
          <ServiceNode x={FRPS.x} y={FRPS.y} kind="gateway" label="frps pod / host" sublabel="ClusterIP data + admin" w={210} u={aws} glow={controlFlow > 0.8 ? 0.7 : 0} dim={awsLayerDim} />
          <ServiceNode x={NLB.x} y={NLB.y} kind="gateway" label="session NLB" sublabel="public control hostname" w={190} u={aws * dns} glow={dns > 0.8 ? 0.45 : 0} dim={awsLayerDim} />
          <ServiceNode x={BROWSER.x} y={BROWSER.y} kind="browser" label="test container" sublabel="Replay Chromium" w={190} u={aws} dim={awsLayerDim} />
          <ServiceNode x={ORCH.x} y={ORCH.y} kind="fn" label="orchestrator" sublabel="health gate + suspend" w={205} u={aws} dim={awsLayerDim} />

          <Connection
            from={{ x: ONBOARD.x + 100, y: ONBOARD.y }}
            to={{ x: CONTROL.x - 100, y: CONTROL.y }}
            u={s.get(scene.onboardU)}
            color={colors.WARM}
            label="provision session"
            labelSize={10}
            dim={awsLayerDim}
          />
          <Connection
            from={{ x: CONTROL.x, y: CONTROL.y + 30 }}
            to={{ x: FRPS.x, y: FRPS.y - 34 }}
            u={aws}
            color={colors.SECONDARY}
            label="gateway API"
            labelSize={10}
            dim={awsLayerDim}
          />
          <Connection
            from={{ x: CONTROL.x + 92, y: CONTROL.y }}
            to={{ x: NLB.x - 92, y: NLB.y }}
            u={aws * dns}
            color={colors.WARM}
            label="allocate NLB hostname"
            labelSize={9.5}
            dim={awsLayerDim}
          />

          <Connection
            from={{ x: FRPC.x + 88, y: FRPC.y }}
            to={{ x: NLB.x - 94, y: NLB.y }}
            u={controlFlow * dns * (1 - disconnect)}
            flow={controlFlow * 5}
            color={colors.ACCENT}
            dashed
            label="outbound control · NLB :7000"
            labelSize={10.5}
            dim={Math.max(localLayerDim, awsLayerDim)}
          />
          <Connection
            from={{ x: NLB.x - 94, y: NLB.y + 18 }}
            to={{ x: FRPS.x + 96, y: FRPS.y + 18 }}
            u={controlFlow * dns * (1 - disconnect)}
            flow={controlFlow * 4}
            color={colors.ACCENT}
            dashed
            label="control to frps pod"
            labelSize={9.5}
            dim={awsLayerDim}
          />
          <Connection
            from={{ x: BROWSER.x - 95, y: BROWSER.y }}
            to={{ x: FRPS.x + 105, y: FRPS.y }}
            u={clamp01(data * 3)}
            color={colors.TEAL}
            label="ClusterIP data host · private"
            labelSize={10}
            dim={awsLayerDim}
          />
          <Connection
            from={{ x: FRPS.x - 104, y: FRPS.y + 10 }}
            to={{ x: FRPC.x + 94, y: FRPC.y }}
            u={clamp01(data * 3 - 0.8) * (1 - localDim)}
            color={colors.TEAL}
            label="frp data over established tunnel"
            labelSize={10}
            dim={Math.max(localLayerDim, awsLayerDim)}
          />
          <Connection
            from={{ x: FRPC.x, y: FRPC.y - 30 }}
            to={{ x: PROXY.x, y: PROXY.y + 30 }}
            u={clamp01(data * 3 - 1.4) * (1 - localDim)}
            color={colors.TEAL}
            label="local"
            labelSize={10}
            dim={localLayerDim}
          />
          <Connection
            from={{ x: PROXY.x - 104, y: PROXY.y }}
            to={{ x: APP.x + 88, y: APP.y }}
            u={clamp01(data * 3 - 2) * (1 - localDim)}
            color={colors.TEAL}
            label="allowlisted target"
            labelSize={10}
            dim={localLayerDim}
          />
          <DataPacket u={data * (1 - localDim)} dim={Math.max(localLayerDim, awsLayerDim)} />

          <Connection
            from={{ x: ORCH.x - 102, y: ORCH.y }}
            to={{ x: FRPS.x + 88, y: FRPS.y + 22 }}
            u={health}
            flow={health * 4}
            color={colors.WARM}
            dashed
            label="ClusterIP admin · frps health"
            labelSize={10}
            dim={awsLayerDim}
          />
        </g>

        <CommandChip u={local * (1 - localDim)} dim={Math.max(dim, upperDim)} />
        <OnboardingCard u={s.get(scene.onboardU) * (1 - upperDim)} dim={awsLayerDim} />
        <RecoveryCard disconnect={disconnect} resume={resume} dim={Math.max(dim, upperDim)} />
        <ReadinessRail aws={aws} dns={dns} target={target} frp={controlFlow} health={health} disconnect={disconnect} resume={resume} dim={Math.max(dim, upperDim)} />

        <g opacity={1 - 0.82 * dim}>
          <ServiceNode x={PROJECT.x} y={PROJECT.y} kind="db" label="Replay QA project" sublabel="qa-project-id · catalog authority" w={230} u={projectStageU} />
          <ServiceNode x={MCP.x} y={MCP.y} kind="gateway" label="LoopQA MCP server" sublabel="project / journey / test / exploration" w={238} u={mcp} />
          <ServiceNode x={AGENT.x} y={AGENT.y} kind="client" label="coding agent" sublabel="catalog control path" w={190} u={mcp} />
          <Connection
            from={{ x: AGENT.x - 96, y: AGENT.y }}
            to={{ x: MCP.x + 120, y: MCP.y }}
            u={mcp}
            flow={mcp * 5}
            color={colors.SECONDARY}
            label="MCP"
            labelSize={10.5}
          />
          <Connection
            from={{ x: MCP.x - 120, y: MCP.y }}
            to={{ x: PROJECT.x + 116, y: PROJECT.y }}
            u={mcp}
            flow={mcp * 5}
            color={colors.SECONDARY}
            label="tool call / result"
            labelSize={10}
          />
        </g>

        <ToolFan u={s.get(scene.toolsU)} dim={dim} />
        <SharedKeySpine u={s.get(scene.keyU)} dim={dim} />
        <WarningCard u={s.get(scene.warningU)} dim={dim} />
        <ClosingCard u={s.get(scene.closeU)} />
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
