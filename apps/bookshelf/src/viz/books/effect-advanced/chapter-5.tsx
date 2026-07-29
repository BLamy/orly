// The Composition Graph
//
// Backing files: packages/effect/src/Layer.ts (Layer<ROut, E, RIn>; MemoMap
// "prevents duplicate construction of the same layer instance"; Layer.launch),
// ai-docs/src/01_effect/03_services/20_layer-composition.ts (UserRepository
// .layerNoDeps piped through Layer.provide(SqlClientLayer) vs
// Layer.provideMerge exposing both), ai-docs/src/01_effect/05_resources/
// 10_acquire-release.ts (Smtp: Effect.acquireRelease creates the NodeMailer
// transporter, releases with transporter.close(); Mailer depends on Smtp),
// ai-docs/src/01_effect/06_running/20_layer-launch.ts (Layer.launch as the
// app entry point).
//
// Centerpiece: the socket graph — service boxes with output plugs and input
// sockets. Provide docks a dependency and seals the seam; two ghost builds of
// the same client collapse into one memoized instance; the build glow sweeps
// bottom-up, launch runs the graph as the app, and teardown cascades back
// down in exactly reverse order. Ends on the book recap.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Graph geometry — depth 0 builds first, tears down last.
// ---------------------------------------------------------------------------

const BOX_W = 230;
const BOX_H = 64;

const REPO = { x: 400, y: 200 } as const;
const SQL = { x: 400, y: 330 } as const; // docks up against the repo
const MAILER = { x: 790, y: 200 } as const;
const SMTP = { x: 790, y: 330 } as const;
const APP = { x: 595, y: 80 } as const;
const GHOST = { x: 1090, y: 330 } as const; // the duplicate client build

const MERGE_PANEL = { x: 880, y: 150, w: 330, h: 210 } as const;

const RECAP = [
  { label: 'streams pull', color: colors.ACCENT },
  { label: 'queues hand off', color: colors.POSITIVE },
  { label: 'hubs broadcast', color: colors.SECONDARY },
  { label: 'transactions commit', color: colors.WARM },
  { label: 'layers wire it', color: colors.TEAL },
] as const;

// camera marks
const CAM_REPO: CameraState = { x: 430, y: 240, k: 1.4 };
const CAM_PAIR: CameraState = { x: 560, y: 250, k: 1.18 };
const CAM_GRAPH: CameraState = { x: 640, y: 230, k: 1.1 };
const CAM_SMTP: CameraState = { x: 720, y: 300, k: 1.3 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  repoU: ChannelRef<number>;
  anatU: ChannelRef<number>;
  sqlU: ChannelRef<number>;
  provideU: ChannelRef<number>;
  mergeU: ChannelRef<number>;
  mergeDim: ChannelRef<number>;
  graphU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  memoU: ChannelRef<number>;
  buildT: ChannelRef<number>;
  launchU: ChannelRef<number>;
  runT: ChannelRef<number>;
  stopU: ChannelRef<number>;
  stageDim: ChannelRef<number>;
  recapU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_REPO, cameraInterp);
  const repoU = tl.channel('repoU', 0);
  const anatU = tl.channel('anatU', 0);
  const sqlU = tl.channel('sqlU', 0);
  const provideU = tl.channel('provideU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const mergeDim = tl.channel('mergeDim', 1);
  const graphU = tl.channel('graphU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const memoU = tl.channel('memoU', 0);
  const buildT = tl.channel('buildT', 0);
  const launchU = tl.channel('launchU', 0);
  const runT = tl.channel('runT', 0);
  const stopU = tl.channel('stopU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const recapU = tl.channel('recapU', 0);

  // — Beat 1 · wiring rots —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Big Effect codebases die by wiring: hundreds of services, each needing others, torn down in exactly the wrong order. So Effect made the wiring a value — a layer describes how to build a service.',
  });
  tl.tween(repoU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.hold(7.5, 0.5);

  // — Beat 2 · the type is a socket diagram —
  tl.caption({
    at: 8.0,
    dur: 5.5,
    text: 'Read the type like a socket diagram: on top, what it provides. On the side, what can fail while building it. Underneath, what it still requires.',
  });
  tl.tween(anatU, 1, { at: 8.4, dur: 1.0, ease: ease.enter });

  // — Beat 3 · an open socket —
  tl.caption({
    at: 13.9,
    dur: 5.5,
    text: 'This repository layer is built from an effect. It provides the repository — but its socket is still open: it requires a database client it does not have.',
  });
  tl.tween(sqlU, 1, { at: 15.4, dur: 0.9, ease: ease.enter });

  // — Beat 4 · provide seals the seam —
  tl.caption({
    at: 19.8,
    dur: 6.5,
    text: 'Provide plugs the client in underneath, and the seam seals. The requirement is satisfied — and hidden. Downstream code sees a repository, and never learns a database exists.',
  });
  tl.tween(provideU, 1, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.hold(26.3, 0.4);

  // — Beat 5 · provideMerge keeps both —
  tl.caption({
    at: 26.7,
    dur: 6,
    text: 'Sometimes you want both visible. Provide merge does the same plumbing but keeps the inner service exposed alongside the outer one. You choose the surface area.',
  });
  tl.tween(cam, CAM_PAIR, { at: 26.9, dur: 1.3, ease: ease.move });
  tl.tween(mergeU, 1, { at: 27.5, dur: 1.0, ease: ease.enter });

  // — Beat 6 · the graph grows —
  tl.caption({
    at: 33.1,
    dur: 6,
    text: 'The graph grows the same way: a mailer built on a mail transport, the repository on its client, and the rest of the app sitting on top of them all.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 33.3, dur: 1.4, ease: ease.move });
  tl.tween(mergeDim, 0, { at: 33.3, dur: 0.9, ease: ease.move });
  tl.tween(graphU, 1, { at: 33.9, dur: 1.6, ease: ease.draw });

  // — Beat 7 · memoized: built once —
  tl.caption({
    at: 39.5,
    dur: 6.5,
    text: 'And when two branches ask for the same layer, it builds once. Layers are memoized, so the whole graph shares one database client instead of opening two connection pools.',
  });
  tl.tween(ghostU, 1, { at: 39.9, dur: 0.9, ease: ease.enter });
  tl.tween(memoU, 1, { at: 42.4, dur: 1.4, ease: ease.move });
  tl.hold(46.4, 0.4);

  // — Beat 8 · build runs bottom-up —
  tl.caption({
    at: 46.8,
    dur: 6.5,
    text: 'Building runs bottom up, inside a scope. The mail transport is acquired with its release registered right next to it — every resource that opens already knows how it closes.',
  });
  tl.tween(cam, CAM_SMTP, { at: 47.0, dur: 1.3, ease: ease.move });
  tl.tween(buildT, 1, { at: 47.6, dur: 3.6, ease: ease.move });

  // — Beat 9 · launch —
  tl.caption({
    at: 53.7,
    dur: 6,
    text: 'Then launch turns the whole graph into the application: build everything and just run — a server, background workers, whatever the layers describe — until someone says stop.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 53.9, dur: 1.4, ease: ease.move });
  tl.tween(launchU, 1, { at: 54.5, dur: 1.0, ease: ease.draw });
  tl.tween(runT, 6, { at: 54.5, dur: 14, ease: ease.linear });

  // — Beat 10 · reverse teardown —
  tl.caption({
    at: 60.1,
    dur: 6.5,
    text: 'On shutdown, finalizers run in exactly reverse build order. The app stops first, and the connections close last — teardown you never had to write.',
  });
  tl.tween(stopU, 1, { at: 61.0, dur: 3.6, ease: ease.move });
  tl.hold(66.6, 0.4);

  // — Beat 11 · the book recap —
  tl.caption({
    at: 67.0,
    dur: 8,
    text: 'And that is the book. Streams pull, queues hand off, hubs broadcast, transactions commit all or nothing — and layers wire the whole machine together. Those are the good parts.',
  });
  tl.tween(cam, CAM_WIDE, { at: 67.2, dur: 1.5, ease: ease.move });
  tl.tween(stageDim, 0.12, { at: 67.6, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 68.8, dur: 1.6, ease: ease.enter });
  tl.hold(75.5, 1.5);

  return {
    tl,
    cam,
    repoU,
    anatU,
    sqlU,
    provideU,
    mergeU,
    mergeDim,
    graphU,
    ghostU,
    memoU,
    buildT,
    launchU,
    runT,
    stopU,
    stageDim,
    recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

// power state per depth: build lights 0 → 1 → 2, teardown darkens 2 → 1 → 0
function powerOf(depth: number, buildT: number, stopU: number): number {
  const lit = clamp01(buildT * 3 - depth);
  const cut = clamp01(stopU * 3 - (2 - depth));
  return lit * (1 - cut);
}

function ServiceBox({ x, y, title, code, u, power = 0, ghost, sealedWith }: {
  x: number;
  y: number;
  title: string;
  code: string;
  u: number;
  power?: number;
  ghost?: boolean;
  sealedWith?: number; // envelope opacity when part of a sealed unit
}) {
  if (u <= 0) return null;
  const stroke = power > 0.5 ? colors.POSITIVE : ghost ? colors.MUTED : colors.GRID;
  return (
    <g opacity={u * (ghost ? 0.65 : 1)}>
      <rect
        x={x - BOX_W / 2}
        y={y - BOX_H / 2}
        width={BOX_W}
        height={BOX_H}
        rx={10}
        fill={colors.PANEL}
        stroke={stroke}
        strokeWidth={power > 0.5 ? 2 : 1.2}
        strokeDasharray={ghost ? '5 5' : undefined}
      />
      <text x={x} y={y - 6} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={600}>
        {title}
      </text>
      <text x={x} y={y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
        {code}
      </text>
      {/* output plug */}
      <rect x={x - 14} y={y - BOX_H / 2 - 8} width={28} height={8} rx={3} fill={stroke} opacity={0.9} />
      {sealedWith !== undefined && sealedWith > 0 && (
        <rect
          x={x - BOX_W / 2 - 14}
          y={y - BOX_H / 2 - 18}
          width={BOX_W + 28}
          height={BOX_H * 2 + 66}
          rx={16}
          fill="none"
          stroke={colors.ACCENT}
          strokeWidth={1.6}
          opacity={sealedWith}
        />
      )}
    </g>
  );
}

function Socket({ x, y, open, u, label }: { x: number; y: number; open: boolean; u: number; label?: string }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x - 16} y={y} width={32} height={9} rx={3} fill="none" stroke={open ? colors.WARM : colors.POSITIVE} strokeWidth={1.5} strokeDasharray={open ? '3 3' : undefined} />
      {label && open && (
        <text x={x + 24} y={y + 9} fill={colors.WARM} fontSize={10} fontFamily="monospace">
          {label}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const repoU = s.get(scene.repoU);
  const anatU = s.get(scene.anatU);
  const sqlU = s.get(scene.sqlU);
  const provideU = s.get(scene.provideU);
  const mergeU = s.get(scene.mergeU) * s.get(scene.mergeDim);
  const graphU = s.get(scene.graphU);
  const ghostU = s.get(scene.ghostU);
  const memoU = s.get(scene.memoU);
  const buildT = s.get(scene.buildT);
  const launchU = s.get(scene.launchU);
  const runT = s.get(scene.runT);
  const stopU = s.get(scene.stopU);
  const stageDim = s.get(scene.stageDim);
  const recapU = s.get(scene.recapU);

  // the client box docks upward as provide runs
  const sqlY = lerp(SQL.y + 26, SQL.y, clamp01(provideU * 1.6));
  // the ghost client slides into the shared one as memoU runs
  const ghostX = lerp(GHOST.x, SQL.x, memoU);
  const ghostY = lerp(GHOST.y, sqlY, memoU);
  const ghostAlpha = ghostU * (1 - clamp01((memoU - 0.75) / 0.25));

  const p0 = powerOf(0, buildT, stopU);
  const p1 = powerOf(1, buildT, stopU);
  const p2 = powerOf(2, buildT, stopU);
  // the running heartbeat, visible only while the app is powered
  const heartbeat = launchU > 0 && p2 > 0.5 ? 0.55 + 0.45 * Math.abs(Math.sin(runT * Math.PI)) : 0;
  // finalizer chips flash as each depth powers down
  const finApp = stopU > 0.01 ? clamp01(stopU * 3) * (1 - clamp01(stopU * 3 - 2)) : 0;
  const finSmtp = clamp01(stopU * 3 - 2);

  const edgeStroke = (power: number) => (power > 0.5 ? colors.POSITIVE : colors.GRID);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ---- graph edges ---- */}
          {graphU > 0 && (
            <g opacity={graphU}>
              <line x1={APP.x - 60} y1={APP.y + BOX_H / 2 + 8} x2={REPO.x} y2={REPO.y - BOX_H / 2 - 10} stroke={edgeStroke(p1)} strokeWidth={1.3} />
              <line x1={APP.x + 60} y1={APP.y + BOX_H / 2 + 8} x2={MAILER.x} y2={MAILER.y - BOX_H / 2 - 10} stroke={edgeStroke(p1)} strokeWidth={1.3} />
              {/* the second ask for the client — bends into the shared box once memoized */}
              <path
                d={`M ${APP.x + 130} ${APP.y + 18} C ${lerp(GHOST.x, 900, memoU)} ${APP.y + 60}, ${ghostX + 140} ${ghostY - 90}, ${ghostX + (memoU > 0.9 ? BOX_W / 2 + 4 : 0)} ${ghostY - (memoU > 0.9 ? 0 : BOX_H / 2 + 10)}`}
                fill="none"
                stroke={ghostU > 0 ? edgeStroke(p0) : 'none'}
                strokeWidth={1.3}
                opacity={ghostU}
              />
            </g>
          )}
          {sqlU > 0 && provideU < 0.2 && (
            <line x1={REPO.x} y1={REPO.y + BOX_H / 2 + 10} x2={SQL.x} y2={sqlY - BOX_H / 2 - 10} stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="4 5" opacity={sqlU} />
          )}
          {graphU > 0 && <line x1={MAILER.x} y1={MAILER.y + BOX_H / 2 + 8} x2={SMTP.x} y2={SMTP.y - BOX_H / 2 - 10} stroke={edgeStroke(p0)} strokeWidth={1.3} opacity={graphU} />}

          {/* ---- the repository + client unit ---- */}
          <ServiceBox
            x={REPO.x}
            y={REPO.y}
            title="UserRepository"
            code="Layer.effect(UserRepository, …)"
            u={repoU}
            power={p1}
            sealedWith={clamp01(provideU * 1.4)}
          />
          <Socket x={REPO.x} y={REPO.y + BOX_H / 2 + 2} open={provideU < 0.6} u={repoU * anatU} label="requires SqlClient" />
          <ServiceBox x={SQL.x} y={sqlY} title="SqlClient" code="PgClient.layerConfig({ url: … })" u={sqlU} power={p0} />

          {/* type anatomy */}
          {anatU > 0 && provideU < 0.5 && (
            <g opacity={anatU * (1 - clamp01(provideU * 2))}>
              <text x={REPO.x} y={REPO.y - BOX_H / 2 - 20} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                {'Layer<ROut, E, RIn>'}
              </text>
              <text x={REPO.x - BOX_W / 2 - 12} y={REPO.y + 4} textAnchor="end" fill={colors.NEGATIVE} fontSize={10} fontFamily="monospace">
                E: SqlError
              </text>
            </g>
          )}
          {provideU > 0.3 && (
            <text x={REPO.x} y={sqlY + BOX_H / 2 + 34} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5} fontFamily="monospace" opacity={clamp01((provideU - 0.3) / 0.4) * (graphU > 0 ? 0.35 : 1)}>
              layerNoDeps.pipe(Layer.provide(SqlClientLayer))
            </text>
          )}

          {/* ---- provideMerge comparison ---- */}
          {mergeU > 0 && (
            <g opacity={mergeU}>
              <rect x={MERGE_PANEL.x} y={MERGE_PANEL.y} width={MERGE_PANEL.w} height={MERGE_PANEL.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={MERGE_PANEL.x + MERGE_PANEL.w / 2} y={MERGE_PANEL.y + 26} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
                Layer.provideMerge(SqlClientLayer)
              </text>
              {[0, 1].map((i) => (
                <g key={i}>
                  <rect x={MERGE_PANEL.x + 40} y={MERGE_PANEL.y + 48 + i * 70} width={MERGE_PANEL.w - 80} height={52} rx={9} fill={colors.BG} stroke={colors.GRID} />
                  <rect x={MERGE_PANEL.x + MERGE_PANEL.w / 2 - 12} y={MERGE_PANEL.y + 41 + i * 70} width={24} height={7} rx={3} fill={colors.POSITIVE} />
                  <text x={MERGE_PANEL.x + MERGE_PANEL.w / 2} y={MERGE_PANEL.y + 79 + i * 70} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
                    {i === 0 ? 'UserRepository' : 'SqlClient'}
                  </text>
                </g>
              ))}
              <text x={MERGE_PANEL.x + MERGE_PANEL.w / 2} y={MERGE_PANEL.y + MERGE_PANEL.h - 12} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                both plugs stay exposed
              </text>
            </g>
          )}

          {/* ---- the wider graph ---- */}
          <ServiceBox x={MAILER.x} y={MAILER.y} title="Mailer" code="Mailer.layerNoDeps" u={graphU} power={p1} />
          <ServiceBox x={SMTP.x} y={SMTP.y} title="Smtp" code="Effect.acquireRelease(createTransport)" u={graphU} power={p0} />
          <ServiceBox x={APP.x} y={APP.y} title="the rest of the app" code="Layer.mergeAll(…)" u={graphU} power={p2} />
          <ServiceBox x={ghostX} y={ghostY} title="SqlClient" code="the same layer, asked twice" u={ghostAlpha} ghost />
          {memoU > 0.75 && (
            <g opacity={clamp01((memoU - 0.75) / 0.25)}>
              <rect x={SQL.x - 92} y={sqlY + BOX_H / 2 + 8} width={184} height={24} rx={12} fill={colors.BG} stroke={colors.SECONDARY} />
              <text x={SQL.x} y={sqlY + BOX_H / 2 + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={10.5} fontFamily="monospace">
                MemoMap — built once, shared
              </text>
            </g>
          )}

          {/* acquire / release chips on the transport */}
          {buildT > 0.15 && stopU < 0.6 && (
            <text x={SMTP.x + BOX_W / 2 + 12} y={SMTP.y + 4} fill={colors.POSITIVE} fontSize={10} fontFamily="monospace" opacity={clamp01(buildT * 3) * (1 - clamp01(stopU * 2))}>
              acquire ✓
            </text>
          )}
          {finSmtp > 0 && (
            <text x={SMTP.x + BOX_W / 2 + 12} y={SMTP.y + 4} fill={colors.WARM} fontSize={10} fontFamily="monospace" opacity={finSmtp}>
              transporter.close()
            </text>
          )}
          {finApp > 0 && stopU > 0.05 && (
            <text x={APP.x + 170} y={APP.y + 4} fill={colors.WARM} fontSize={10} fontFamily="monospace" opacity={finApp}>
              finalizers — reverse order
            </text>
          )}

          {/* launch outline */}
          {launchU > 0 && (
            <g opacity={launchU}>
              <rect x={240} y={28} width={800} height={382} rx={18} fill="none" stroke={heartbeat > 0 ? colors.ACCENT : colors.GRID} strokeWidth={1.6} strokeDasharray="10 7" />
              <text x={264} y={54} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
                Layer.launch(app)
              </text>
              {heartbeat > 0 && (
                <g>
                  <circle cx={1006} cy={48} r={7} fill={colors.POSITIVE} opacity={heartbeat} />
                  <text x={992} y={53} textAnchor="end" fill={colors.POSITIVE} fontSize={11} opacity={heartbeat}>
                    running
                  </text>
                </g>
              )}
              {stopU > 0.1 && (
                <text x={1006} y={53} textAnchor="end" fill={colors.WARM} fontSize={11} opacity={clamp01(stopU * 2)}>
                  interrupted — closing scope
                </text>
              )}
            </g>
          )}
        </g>

        {/* ---- the book recap ---- */}
        {recapU > 0 && (
          <g opacity={recapU}>
            <rect x={220} y={230} width={840} height={230} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              the good parts
            </text>
            {RECAP.map((r, i) => {
              const u = clamp01(recapU * 5 - i * 0.7);
              const x = 300 + i * 172;
              return (
                <g key={r.label} opacity={u}>
                  <circle cx={x} cy={340} r={9} fill={r.color} opacity={0.85} />
                  <text x={x} y={372} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
                    {r.label}
                  </text>
                </g>
              );
            })}
            <text x={640} y={424} textAnchor="middle" fill={colors.ACCENT} fontSize={19} fontWeight={700}>
              small machines · one graph · they compose
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
