import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Connection, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';
import overrides from './overrides.json';
import {
  BOUND,
  CIPHER,
  CODEX,
  DERP,
  DOORS,
  E_DZ,
  E_JP,
  E_JT,
  E_PI,
  E_TD,
  E_UJ,
  FA_PATH,
  FB_PATH,
  FINAL_BOUND,
  FS_LINE,
  F1_PATH,
  HATCHES,
  HKDF,
  HOST,
  INET,
  IV_TAG,
  JUNCT,
  KC_TAG,
  KEY,
  NP_TAG,
  OC_TAG,
  OP_TAG,
  PASS,
  PM_PATH,
  PORT,
  PROBES,
  PROBE_FROM,
  PROXY,
  REQ_PATH,
  ROGUE2_PATH,
  SOP_CHIP,
  TAILHOST,
  TAILZONE,
  TIER_CHIPS,
  TIER_DESC,
  TIER_MAIN,
  TIER_SANDBOX,
  TIER_WORKER,
  TSC,
  USER,
  WIRE_TAG,
  WZONE,
  buildScene,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/almostnode-walls/overrides.json', slug: 'almostnode-walls' };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = colors.font.mono;

/** A rounded mono pill — user-code chips, door chips, key/secret chips. */
function Chip({
  x,
  y,
  text,
  sub,
  color,
  u = 1,
  glow = 0,
  dim = 0,
  fontSize = 13,
}: {
  x: number;
  y: number;
  text: string;
  sub?: string;
  color: string;
  u?: number;
  glow?: number;
  dim?: number;
  fontSize?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const cw = fontSize * 0.64;
  const w = Math.max(text.length * cw, (sub?.length ?? 0) * 6.6) + 26;
  const h = sub ? 44 : fontSize + 17;
  const sc = 0.85 + 0.15 * uu;
  const g = clamp01(glow);
  return (
    <g transform={`translate(${x}, ${y}) scale(${sc})`} opacity={uu * (1 - 0.75 * clamp01(dim))}>
      {g > 0 && (
        <rect x={-w / 2 - 4} y={-h / 2 - 4} width={w + 8} height={h + 8} rx={h / 2 + 4} fill="none" stroke={color} strokeWidth={5} opacity={0.35 * g} />
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={sub ? -3 : fontSize * 0.36} textAnchor="middle" fill={color} fontSize={fontSize} fontFamily={MONO}>
        {text}
      </text>
      {sub && (
        <text y={14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
          {sub}
        </text>
      )}
    </g>
  );
}

/** A NEGATIVE ✕ with an expanding ripple — a probe dying at a wall. */
function XFlash({ x, y, u, label }: { x: number; y: number; u: number; label?: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={uu}>
      <circle r={12 + 16 * (1 - uu)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} opacity={0.55 * uu} />
      <path d="M -7 -7 L 7 7 M 7 -7 L -7 7" stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      {label && (
        <text y={34} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontWeight={700} fontFamily={MONO}>
          {label}
        </text>
      )}
    </g>
  );
}

/** A bold boundary rect that draws on — "the tab", and the closing floor plan. */
function BoldBoundary({
  x,
  y,
  w,
  h,
  u,
  glow = 0,
  label,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  u: number;
  glow?: number;
  label?: string;
  color: string;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const L = 2 * (w + h);
  const g = clamp01(glow);
  return (
    <g>
      {g > 0 && <rect x={x} y={y} width={w} height={h} rx={18} fill="none" stroke={color} strokeWidth={11} opacity={0.25 * g} />}
      <rect x={x} y={y} width={w} height={h} rx={18} fill="none" stroke={color} strokeWidth={3.5} strokeDasharray={`${L * uu} ${L}`} opacity={0.95} />
      {label && (
        <g opacity={clamp01(uu * 2 - 1)}>
          <rect x={x + 16} y={y - 12} width={label.length * 8 + 20} height={24} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
          <text x={x + 26} y={y + 4} fill={color} fontSize={13} fontWeight={600} fontFamily={MONO}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/** A small centered mono annotation. */
function MonoTag({ x, y, text, u, color = colors.MUTED, size = 12 }: { x: number; y: number; text: string; u: number; color?: string; size?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <text x={x} y={y} textAnchor="middle" fill={color} fontSize={size} fontFamily={MONO} opacity={uu}>
      {text}
    </text>
  );
}

const TIER_LABELS = ['Runtime · main thread', 'WorkerRuntime', 'SandboxRuntime'];

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const tierDim = s.get(scene.tierDim);
  const dAB = clamp01(s.get(scene.dimAB) + tierDim); // main + worker tiers
  const dC = tierDim; // sandbox tier stays bright while probed
  const descU = s.get(scene.descU);
  const b3 = s.get(scene.b3U);
  const b4 = s.get(scene.b4U);
  const b5 = s.get(scene.b5U);
  const routeAU = s.get(scene.routeAU);
  const routeBU = s.get(scene.routeBU);
  const doorsU = s.get(scene.doorsU);
  const decU = s.get(scene.decU);
  const hatchU = s.get(scene.hatchU);
  // door glow channels map to exercised chips: fs/applyPatch, command/exec, network/fetch
  const doorGlow = [0, 0, s.get(scene.dg[0]), s.get(scene.dg[2]), s.get(scene.dg[1]), 0];
  const hatchColors = [colors.ACCENT, colors.WARM, colors.SECONDARY];

  return (
    <Camera {...s.get(scene.cam)}>
      {/* ---- the three tiers: escalating wall styles ---------------------- */}
      <Zone {...TIER_MAIN} kind="group" label={TIER_LABELS[0]} u={s.get(scene.tierU[0])} dim={dAB} />
      <Zone {...TIER_WORKER} kind="az" label={TIER_LABELS[1]} u={s.get(scene.tierU[1])} dim={dAB} />
      <Zone {...TIER_SANDBOX} kind="vpc" label={TIER_LABELS[2]} u={s.get(scene.tierU[2])} dim={dC} />
      {TIER_CHIPS.map((c, i) => (
        <Chip key={`uc${i}`} x={c.x} y={c.y} text="user code" color={colors.ACCENT} u={s.get(scene.chipU[i])} dim={i < 2 ? dAB : dC} />
      ))}
      {TIER_DESC.map((d, i) => {
        const u = clamp01(descU - i) * (1 - 0.75 * (i < 2 ? dAB : dC));
        return u <= 0 ? null : (
          <g key={`desc${i}`} opacity={u}>
            <text x={d.x} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
              {d.text}
            </text>
            <text x={d.x} y={294} textAnchor="middle" fill={colors.ink.muted} fontSize={10.5} fontFamily={MONO}>
              {d.foot}
            </text>
          </g>
        );
      })}
      <MonoTag {...FS_LINE} u={s.get(scene.fsU) * (1 - 0.5 * tierDim)} />

      {/* ---- beat 2: probes die at the wall; postMessage gets frisked ----- */}
      {PROBES.map((p, i) => (
        <Packet key={`probe${i}`} from={PROBE_FROM} to={p.to} u={s.get(scene.probeU[i])} r={5} color={colors.NEGATIVE} label={p.label} labelSize={11} />
      ))}
      {PROBES.map((p, i) => (
        <XFlash key={`fl${i}`} x={p.to.x} y={p.to.y} u={s.get(scene.flashU[i])} />
      ))}
      <Chip x={SOP_CHIP.x} y={SOP_CHIP.y} text="Same-Origin Policy" color={colors.POSITIVE} u={s.get(scene.sopU)} glow={s.get(scene.sopGlow)} dim={tierDim} />
      <RequestFlow
        path={PM_PATH}
        u={s.get(scene.pmU)}
        roundTrip
        r={5}
        color={colors.WARM}
        responseColor={colors.NEGATIVE}
        label="postMessage"
        responseLabel="dropped"
        labelSize={11}
      />
      <MonoTag {...OC_TAG} u={s.get(scene.ocU)} color={colors.NEGATIVE} size={12} />

      {/* ---- beat 3: hatch 1 — egress is opt-in, two routes ---------------- */}
      {b3 > 0.002 && (
        <g opacity={b3}>
          <Connection {...E_UJ} u={s.get(scene.connYU)} color={colors.MUTED} />
          <Connection {...E_JP} u={clamp01(routeAU)} dashed color={colors.MUTED} />
          <Connection {...E_PI} u={clamp01(routeAU - 2)} color={colors.MUTED} />
          <Connection {...E_JT} u={clamp01(routeBU)} color={colors.MUTED} />
          <Connection {...E_TD} u={clamp01(routeBU - 2)} flow={s.get(scene.wsFlow)} label="WebSocket" color={colors.SECONDARY} />
          <Connection {...E_DZ} u={clamp01(routeBU - 4)} color={colors.MUTED} />
          <ServiceNode {...USER} kind="fn" label="user code" sublabel="in the sandbox" u={s.get(scene.userU)} />
          <ServiceNode {...JUNCT} kind="gateway" label="browserFetch" sublabel="selectNetworkRouteForUrl" u={s.get(scene.junctU)} glow={s.get(scene.junctGlow)} />
          <MonoTag {...NP_TAG} u={s.get(scene.npU)} size={12} />
          <ServiceNode {...PROXY} kind="external" label="CORS proxy" sublabel="setCorsProxy(url)" u={clamp01(routeAU - 1)} />
          <ServiceNode {...INET} kind="cdn" label="internet" sublabel="https" u={clamp01(routeAU - 3)} />
          <ServiceNode {...TSC} kind="fn" label="tailscale-connect" sublabel="WASM Tailscale · Worker" u={clamp01(routeBU - 1)} />
          <ServiceNode {...DERP} kind="cdn" label="DERP relay" sublabel="wss" u={clamp01(routeBU - 3)} />
          <Zone {...TAILZONE} kind="subnet" label="tailnet" u={clamp01(routeBU - 4)} />
          <ServiceNode {...TAILHOST} kind="server" label="100.x.y.z" u={clamp01(routeBU - 5)} />
          <RequestFlow path={F1_PATH} u={s.get(scene.f1)} r={7} color={colors.ACCENT} label="fetch(url)" />
          <RequestFlow path={FA_PATH} u={s.get(scene.fA)} r={7} color={colors.ACCENT} label="proxyFetch" />
          <RequestFlow path={F1_PATH} u={s.get(scene.rogueU)} r={7} color={colors.NEGATIVE} label="fetch(100.x.y.z)" />
          <XFlash x={JUNCT.x} y={JUNCT.y} u={s.get(scene.rogueFlash)} label="throws" />
          <RequestFlow path={FB_PATH} u={s.get(scene.fB)} r={7} color={colors.SECONDARY} label="tailscale route" />
        </g>
      )}

      {/* ---- beat 4: hatch 2 — the vault; the boundary stays sealed -------- */}
      {b4 > 0.002 && (
        <g opacity={b4}>
          <BoldBoundary {...BOUND} u={s.get(scene.boundU)} glow={s.get(scene.boundGlow)} label="the tab" color={colors.WARM} />
          <MonoTag {...KC_TAG} u={s.get(scene.kcU)} size={12.5} />
          <Chip x={PASS.x} y={PASS.y} text="passkey" sub="platform authenticator" color={colors.SECONDARY} u={s.get(scene.passU)} glow={s.get(scene.touchGlow)} />
          <ServiceNode {...HKDF} kind="fn" label="HKDF" sublabel="deriveVaultKeyFromPrf" u={s.get(scene.hkdfU)} glow={s.get(scene.hkdfGlow)} />
          <Packet from={PASS} to={{ x: HKDF.x, y: HKDF.y }} u={s.get(scene.prfU)} r={6} color={colors.SECONDARY} label="PRF bytes" labelSize={12} />
          <Chip x={KEY.x} y={KEY.y} text="AES-GCM-256 key" color={colors.WARM} u={s.get(scene.keyU)} />
          <Packet from={KEY} to={CIPHER} u={s.get(scene.keyPk)} r={6} color={colors.WARM} label="decryptData" labelSize={12} />
          <Chip x={CIPHER.x} y={CIPHER.y} text="ciphertext" color={colors.MUTED} u={s.get(scene.cipherU) * (1 - decU)} />
          <Chip x={CIPHER.x} y={CIPHER.y} text="secret" color={colors.POSITIVE} u={decU} />
          <MonoTag {...IV_TAG} u={s.get(scene.ivU)} size={11} />
        </g>
      )}

      {/* ---- beat 5: hatch 3 — every capability is a named, typed door ------ */}
      {b5 > 0.002 && (
        <g opacity={b5}>
          <Zone {...WZONE} kind="az" label="Worker" u={s.get(scene.wzU)} />
          <Connection {...PORT} u={s.get(scene.portU)} label="MessagePort" color={colors.MUTED} arrow={false} />
          <ServiceNode {...CODEX} kind="fn" label="codex" sublabel="WASM coding agent" u={s.get(scene.codexU)} />
          <ServiceNode {...HOST} kind="browser" label="host" sublabel="main window" u={s.get(scene.hostU)} />
          <MonoTag {...OP_TAG} u={s.get(scene.opU)} size={12.5} />
          <MonoTag {...WIRE_TAG} u={s.get(scene.wireU)} size={12} />
          {DOORS.map((d, i) => (
            <Chip key={d.op} x={d.x} y={d.y} text={d.op} color={colors.TEAL} u={clamp01(doorsU - i)} glow={doorGlow[i]} fontSize={12} />
          ))}
          <RequestFlow path={REQ_PATH} u={s.get(scene.req[0])} roundTrip r={6} color={colors.ACCENT} responseColor={colors.POSITIVE} label="fs/applyPatch" responseLabel="ok" labelSize={12} />
          <RequestFlow path={REQ_PATH} u={s.get(scene.req[1])} roundTrip r={6} color={colors.ACCENT} responseColor={colors.POSITIVE} label="command/exec" responseLabel="exit 0" labelSize={12} />
          <RequestFlow path={REQ_PATH} u={s.get(scene.req[2])} roundTrip r={6} color={colors.ACCENT} responseColor={colors.POSITIVE} label="network/fetch" responseLabel="200" labelSize={12} />
          <RequestFlow
            path={ROGUE2_PATH}
            u={s.get(scene.rogue2U)}
            roundTrip
            r={6}
            color={colors.NEGATIVE}
            responseColor={colors.NEGATIVE}
            label="fs/escape"
            responseLabel="no such door"
            labelSize={12}
          />
          <XFlash x={ROGUE2_PATH[1].x} y={ROGUE2_PATH[1].y} u={s.get(scene.rogue2Flash)} />
        </g>
      )}

      {/* ---- beat 6: the floor plan ----------------------------------------- */}
      <BoldBoundary {...FINAL_BOUND} u={s.get(scene.finalU)} label="almostnode" color={colors.ACCENT} />
      {HATCHES.map((h, i) => (
        <Chip key={`hatch${i}`} x={h.x} y={h.y} text={h.text} color={hatchColors[i]} u={clamp01(hatchU - i)} />
      ))}
    </Camera>
  );
}

export function AlmostnodeWalls() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {renderFrame}
      </Player>
    </div>
  );
}

// registry adapter (see src/viz/scenes.ts) — lets books embed this scene via step.viz
export const vizScene = () => scene;
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
