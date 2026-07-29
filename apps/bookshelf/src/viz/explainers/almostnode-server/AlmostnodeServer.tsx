import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Connection, Packet, RequestFlow, ServiceNode, Zone } from '../../primitives';
import overrides from './overrides.json';
import {
  BR_A,
  BR_B,
  CC_CHIP,
  CONN_FETCH,
  CONN_HANDLE,
  CONN_MC,
  CONN_VFS,
  ESB,
  GRID,
  GRID_COUNT_AT,
  HDRS,
  HDR_X,
  HDR_XFO,
  IDE_ZONE,
  IFR,
  IFR_ZONE,
  JS_CHIP,
  PAINT,
  REGEX_CHIP,
  REQ_PATH,
  RT,
  SHIMS,
  SW,
  SW_ZONE,
  TAB,
  TERM,
  TERM_CMD,
  TREE_PKG,
  TREE_ROOT,
  TREE_SRV,
  TS_CHIP,
  VFS_A,
  VFS_B,
  VITE,
  buildScene,
  clamp01,
  lerpPt,
} from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/almostnode-server/overrides.json', slug: 'almostnode-server' };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* --------------------------------------------------------------------- */
/* Local subcomponents — pure functions of the values handed in.          */
/* --------------------------------------------------------------------- */

/** A small labeled chip (module names, regexes, headers, FSNodes). */
function Chip({
  x,
  y,
  w,
  text,
  u = 1,
  h = 28,
  color = colors.MUTED,
  textColor = colors.TEXT,
  fontSize = 12,
  glow = 0,
  strike = 0,
}: {
  x: number;
  y: number;
  w: number;
  text: string;
  u?: number;
  h?: number;
  color?: string;
  textColor?: string;
  fontSize?: number;
  glow?: number;
  strike?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const s = 0.84 + 0.16 * uu;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={uu}>
      {glow > 0 && (
        <rect
          x={-w / 2 - 5}
          y={-h / 2 - 5}
          width={w + 10}
          height={h + 10}
          rx={10}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.6 * clamp01(glow)}
        />
      )}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text y={fontSize * 0.36} textAnchor="middle" fill={textColor} fontSize={fontSize} fontFamily={MONO}>
        {text}
      </text>
      {strike > 0 && (
        <line
          x1={-w / 2 + 8}
          y1={0}
          x2={-w / 2 + 8 + (w - 16) * clamp01(strike)}
          y2={0}
          stroke={colors.NEGATIVE}
          strokeWidth={2.2}
        />
      )}
    </g>
  );
}

/** The terminal: `node server.js`, typed on by one linear channel. */
function Terminal({ u, typeU }: { u: number; typeU: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const n = Math.round(clamp01(typeU) * TERM_CMD.length);
  const typed = TERM_CMD.slice(0, n);
  const x0 = TERM.cx - TERM.w / 2;
  const y0 = TERM.cy - TERM.h / 2;
  return (
    <g opacity={uu}>
      <rect x={x0} y={y0} width={TERM.w} height={TERM.h} rx={9} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.4} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x0 + 16 + i * 14} cy={y0 + 13} r={3.5} fill={colors.MUTED} opacity={0.55} />
      ))}
      <text x={x0 + 18} y={TERM.cy + 15} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
        {typed}
      </text>
      <rect x={x0 + 18 + n * 9.03} y={TERM.cy + 2} width={8} height={16} fill={colors.POSITIVE} opacity={0.8} />
    </g>
  );
}

/** The mini page that paints inside the preview iframe. */
function PaintFrame({ u, paintU }: { u: number; paintU: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const lines = [
    { w: 140, c: colors.ACCENT, o: 0.6 },
    { w: 100, c: colors.MUTED, o: 0.55 },
    { w: 124, c: colors.MUTED, o: 0.4 },
  ];
  return (
    <g opacity={uu}>
      <rect x={PAINT.x} y={PAINT.y} width={PAINT.w} height={PAINT.h} rx={8} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.2} opacity={0.9} />
      <line x1={PAINT.x} y1={PAINT.y + 20} x2={PAINT.x + PAINT.w} y2={PAINT.y + 20} stroke={colors.MUTED} strokeWidth={1} opacity={0.5} />
      {lines.map((l, i) => {
        const lu = clamp01(paintU * 3 - i);
        return lu > 0 ? (
          <rect key={i} x={PAINT.x + 14} y={PAINT.y + 36 + i * 26} width={l.w * lu} height={9} rx={4.5} fill={l.c} opacity={l.o} />
        ) : null;
      })}
    </g>
  );
}

/* --------------------------------------------------------------------- */
/* Frame render: SceneState in, SVG out.                                  */
/* --------------------------------------------------------------------- */

function renderFrame(s: SceneState) {
  const layout = s.get(scene.layoutU);
  const aOp = 1 - layout;

  // FSNode-tree entrance/walk, all derived from two channels.
  const treeV = s.get(scene.treeU);
  const rootU = clamp01(treeV * 2);
  const edgesU = clamp01(treeV * 2 - 0.5);
  const childU = clamp01(treeV * 2 - 1);
  const walkV = s.get(scene.walkU);
  const retV = s.get(scene.retU);
  const walkOp = 1 - clamp01(retV * 1.5); // walk glows fade as the bytes leave
  const rootGlow = clamp01(walkV * 3) * walkOp;
  const edgeHot = clamp01(walkV * 3 - 1) * walkOp;
  const leafGlow = clamp01(walkV * 3 - 2) * walkOp;

  const gridV = s.get(scene.gridU);
  const shimCount = Math.round(75 * gridV);
  const esbV = s.get(scene.esbU);
  const esbGlow = clamp01(1 - Math.abs(esbV - 0.5) * 4); // pulses at handoff

  const wireV = s.get(scene.wireU);
  const swDeadV = s.get(scene.swDead);
  const freshV = s.get(scene.freshU);
  const freshOpV = s.get(scene.freshOp);
  const hdrOpV = s.get(scene.hdrOp);

  // The two persistent nodes ride the re-layout; everything else in layout A fades.
  const vfsPos = lerpPt(VFS_A, VFS_B, layout);
  const brPos = lerpPt(BR_A, BR_B, layout);

  return (
    <Camera {...s.get(scene.cam)}>
      {/* the one constant: the browser tab */}
      <rect
        x={TAB.x - 7}
        y={TAB.y - 7}
        width={TAB.w + 14}
        height={TAB.h + 14}
        rx={18}
        fill="none"
        stroke={colors.ACCENT}
        strokeWidth={3}
        opacity={0.55 * s.get(scene.tabGlow)}
      />
      <Zone {...TAB} kind="provider" label="browser tab" u={s.get(scene.tabU)} />

      {/* ---- layout A: the container ---------------------------------- */}
      {aOp > 0.002 && (
        <g opacity={aOp}>
          <Terminal u={s.get(scene.termU)} typeU={s.get(scene.typeU)} />
          <Chip x={CC_CHIP.x} y={CC_CHIP.y} w={CC_CHIP.w} h={CC_CHIP.h} text="createContainer()" u={s.get(scene.ccU)} color={colors.ACCENT} />
          {[VFS_A, RT, BR_A].map((p, i) => (
            <Connection
              key={i}
              from={{ x: CC_CHIP.x, y: CC_CHIP.y + 15 }}
              to={{ x: p.x, y: p.y - 30 }}
              u={clamp01((wireV - i * 0.15) / 0.7)}
              arrow={false}
              width={1.4}
            />
          ))}
          <ServiceNode {...RT} kind="server" label="Runtime" sublabel="~75 shims" u={s.get(scene.uRt)} />

          {/* FSNode mini-tree: '/' → children Map → { server.js, package.json } */}
          <line x1={VFS_A.x} y1={VFS_A.y + 28} x2={TREE_ROOT.x} y2={TREE_ROOT.y - 15} stroke={colors.MUTED} strokeWidth={1.2} strokeDasharray="3 5" opacity={rootU * 0.6} />
          <g opacity={edgesU}>
            <line x1={TREE_ROOT.x} y1={TREE_ROOT.y + 14} x2={TREE_SRV.x} y2={TREE_SRV.y - 14} stroke={colors.MUTED} strokeWidth={1.2} />
            <line x1={TREE_ROOT.x} y1={TREE_ROOT.y + 14} x2={TREE_PKG.x} y2={TREE_PKG.y - 14} stroke={colors.MUTED} strokeWidth={1.2} />
            <text x={TREE_ROOT.x + 6} y={TREE_ROOT.y + 36} fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={0.9}>
              children: Map
            </text>
          </g>
          {edgeHot > 0 && (
            <line
              x1={TREE_ROOT.x}
              y1={TREE_ROOT.y + 14}
              x2={TREE_ROOT.x + (TREE_SRV.x - TREE_ROOT.x) * edgeHot}
              y2={TREE_ROOT.y + 14 + (TREE_SRV.y - 14 - (TREE_ROOT.y + 14)) * edgeHot}
              stroke={colors.ACCENT}
              strokeWidth={2.2}
            />
          )}
          <Chip x={TREE_ROOT.x} y={TREE_ROOT.y} w={TREE_ROOT.w} text="/" u={rootU} color={colors.WARM} glow={rootGlow} />
          <Chip x={TREE_SRV.x} y={TREE_SRV.y} w={TREE_SRV.w} text="server.js" u={childU} color={colors.WARM} glow={leafGlow} fontSize={11} />
          <Chip x={TREE_PKG.x} y={TREE_PKG.y} w={TREE_PKG.w} text="package.json" u={childU} color={colors.WARM} fontSize={11} />
          <Packet from={{ x: RT.x, y: RT.y + 28 }} to={{ x: TREE_ROOT.x, y: TREE_ROOT.y - 18 }} u={s.get(scene.readU)} label="readFileSync" labelSize={13} />
          <Packet from={{ x: TREE_SRV.x, y: TREE_SRV.y }} to={{ x: RT.x, y: RT.y + 28 }} u={retV} color={colors.POSITIVE} label="Uint8Array" labelSize={13} />

          {/* the shim grid — one channel staggers all ten chips */}
          {SHIMS.map((name, i) => {
            const col = i % GRID.cols.length;
            const row = Math.floor(i / GRID.cols.length);
            return (
              <Chip
                key={name}
                x={GRID.cols[col]}
                y={GRID.rows[row]}
                w={GRID.chipW}
                h={GRID.chipH}
                text={name}
                fontSize={11}
                u={clamp01((gridV * 12 - i) / 2)}
                color={colors.SECONDARY}
              />
            );
          })}
          {gridV > 0.01 && (
            <text x={GRID_COUNT_AT.x} y={GRID_COUNT_AT.y} fill={colors.WARM} fontSize={15} fontWeight={700} fontFamily={MONO}>
              {gridV >= 1 ? '~75 shims' : `${shimCount} shims`}
            </text>
          )}

          {/* esbuild-wasm: TS/JSX chip in, JS chip out */}
          <Chip x={TS_CHIP.x} y={TS_CHIP.y} w={TS_CHIP.w} h={TS_CHIP.h} text="TS / JSX" u={s.get(scene.esbNodeU)} color={colors.ACCENT} fontSize={11} />
          <ServiceNode x={ESB.x} y={ESB.y} w={ESB.w} h={ESB.h} kind="fn" label="esbuild-wasm" sublabel="window.__esbuild" u={s.get(scene.esbNodeU)} glow={esbGlow} labelSize={14} />
          <Chip x={JS_CHIP.x} y={JS_CHIP.y} w={JS_CHIP.w} h={JS_CHIP.h} text="JS" u={s.get(scene.esbNodeU)} color={colors.POSITIVE} fontSize={11} />
          <Packet from={{ x: TS_CHIP.x, y: TS_CHIP.y }} to={{ x: ESB.x, y: ESB.y }} u={clamp01(esbV * 2)} r={6} />
          <Packet from={{ x: ESB.x, y: ESB.y }} to={{ x: JS_CHIP.x, y: JS_CHIP.y }} u={clamp01(esbV * 2 - 1)} r={6} color={colors.POSITIVE} />
        </g>
      )}

      {/* ---- layout B: the interception relay -------------------------- */}
      <Zone {...IDE_ZONE} kind="group" label="IDE (main thread)" u={s.get(scene.uZoneIde)} />
      <Zone {...SW_ZONE} kind="group" label="service worker" color={colors.SECONDARY} u={s.get(scene.uZoneSw)} />
      <Zone {...IFR_ZONE} kind="group" label="preview iframe" u={s.get(scene.uZoneIfr)} />

      <Connection {...CONN_HANDLE} u={s.get(scene.uConnHandle)} />
      <Connection {...CONN_VFS} u={s.get(scene.uConnVfs)} dashed arrow={false} />
      <Connection {...CONN_MC} u={s.get(scene.uConnMc)} label="postMessage" labelSize={11} dim={s.get(scene.mcDim)} />
      <Connection {...CONN_FETCH} u={s.get(scene.uConnFetch)} label="fetch" labelSize={11} />
      {/* the fresh MessageChannel port, redrawn after the SW resurrects */}
      {freshV > 0 && freshOpV > 0 && (
        <g opacity={freshOpV}>
          <Connection {...CONN_MC} u={freshV} color={colors.POSITIVE} width={2.6} arrow={false} />
        </g>
      )}
      {freshV > 0.9 && (
        <text x={(CONN_MC.from.x + CONN_MC.to.x) / 2} y={CONN_MC.from.y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO} opacity={0.9}>
          keepalive · 20s
        </text>
      )}

      <ServiceNode x={vfsPos.x} y={vfsPos.y} kind="db" label="VirtualFS" sublabel="RAM only" u={s.get(scene.uVfs)} glow={s.get(scene.vfsGlow)} />
      <ServiceNode x={brPos.x} y={brPos.y} kind="gateway" label="ServerBridge" sublabel="shared" u={s.get(scene.uBridge)} glow={s.get(scene.bridgeGlow)} />
      <ServiceNode {...VITE} kind="server" label="Vite dev server" sublabel="virtual :3000" u={s.get(scene.uVite)} glow={s.get(scene.viteGlow)} />
      <ServiceNode
        {...SW}
        w={160}
        kind="fn"
        label="__sw__.js"
        sublabel={swDeadV > 0.5 ? 'idle — killed' : 'v17'}
        status={swDeadV > 0.5 ? 'down' : 'ok'}
        dim={swDeadV * 0.8}
        u={s.get(scene.uSw)}
      />
      <Chip x={REGEX_CHIP.x} y={REGEX_CHIP.y} w={REGEX_CHIP.w} h={REGEX_CHIP.h} text={'/__virtual__/(\\d+)/'} u={s.get(scene.regexU)} color={colors.SECONDARY} fontSize={11} glow={s.get(scene.regexGlow)} />
      <ServiceNode {...IFR} w={176} kind="browser" label="iframe" sublabel="/__virtual__/3000/" u={s.get(scene.uIfr)} glow={s.get(scene.ifrGlow)} />
      <PaintFrame u={s.get(scene.uIfr)} paintU={s.get(scene.paintU)} />

      <Packet from={VITE} to={BR_B} u={s.get(scene.regU)} color={colors.TEAL} label="register(3000)" labelSize={12} />
      <Packet from={SW} to={BR_B} u={s.get(scene.needsInitU)} color={colors.SECONDARY} label="sw-needs-init" labelSize={12} />

      {/* THE relay: one linear channel, six hops, main thread in the middle */}
      <RequestFlow
        path={REQ_PATH}
        u={s.get(scene.reqU)}
        roundTrip
        label="GET /__virtual__/3000/"
        responseLabel="200 · base64"
        responseColor={colors.POSITIVE}
      />
      {/* beat 5: the same trip, stalled WARM at a dead worker, then completed */}
      <RequestFlow
        path={REQ_PATH}
        u={s.get(scene.stallU)}
        roundTrip
        color={colors.WARM}
        label="GET /"
        responseLabel="200"
        responseColor={colors.POSITIVE}
      />

      {/* ---- beat 4: the header stamp ---------------------------------- */}
      {hdrOpV > 0.002 && (
        <g opacity={hdrOpV}>
          {HDRS.map((hd, i) => (
            <Chip key={hd.text} x={HDR_X} y={hd.y} w={hd.w} h={26} text={hd.text} fontSize={11} u={s.get(scene.hdr[i])} color={colors.POSITIVE} />
          ))}
          <Chip x={HDR_X} y={HDR_XFO.y} w={HDR_XFO.w} h={26} text={HDR_XFO.text} fontSize={11} u={s.get(scene.hdr[3])} color={colors.NEGATIVE} strike={s.get(scene.strikeU)} />
        </g>
      )}
    </Camera>
  );
}

export function AlmostnodeServer() {
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
