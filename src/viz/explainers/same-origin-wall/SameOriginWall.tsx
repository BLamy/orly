// Explained: The Sandbox — chapter 2: the browser's own walls.
// The same-origin policy as the security primitive almostnode's sandbox is
// built on. Grounded in real behavior: an origin is scheme + host + port; two
// documents on different origins cannot read each other's cookies,
// localStorage, sessionStorage, IndexedDB, or reach across the DOM — the
// browser refuses. A cross-origin iframe still renders and can be messaged,
// but the parent cannot touch its storage and it cannot touch the parent's.
// This is exactly the guarantee SandboxRuntime's comment cites.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// origin comparison table (real same-origin-policy rules vs a base origin)
const BASE = 'https://app.example.com:443';
const CASES = [
  { url: 'https://app.example.com/other', same: true, why: 'same scheme, host, port' },
  { url: 'http://app.example.com', same: false, why: 'scheme differs (http vs https)' },
  { url: 'https://api.example.com', same: false, why: 'host differs (subdomain)' },
  { url: 'https://app.example.com:3002', same: false, why: 'port differs' },
];

// what crosses the wall, and what does not (real)
const BLOCKED = ['document.cookie', 'localStorage', 'sessionStorage', 'IndexedDB', 'DOM reads/writes'];
const ALLOWED = ['postMessage(msg, origin)', 'the iframe still renders'];

const CAM_TABLE: CameraState = { x: 470, y: 360, k: 1.14 };
const CAM_WALL: CameraState = { x: 640, y: 360, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  defU: ChannelRef<number>; // origin definition
  tableU: ChannelRef<number>; // the origin comparison rows
  wallU: ChannelRef<number>; // two-origin wall diagram
  blockU: ChannelRef<number>; // blocked list
  msgU: ChannelRef<number>; // the one legal channel
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const defU = tl.channel('defU', 0);
  const tableU = tl.channel('tableU', 0);
  const wallU = tl.channel('wallU', 0);
  const blockU = tl.channel('blockU', 0);
  const msgU = tl.channel('msgU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — origin
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'You do not need to invent a sandbox from scratch. The browser has enforced a hard boundary for twenty five years, and almostnode’s cage is built directly on it. The boundary is called an origin, and it is three things stapled together.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(defU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'Scheme, host, and port. Change any one of the three and the browser calls it a different origin — a different world. Same page, served over plain http instead of secure, is a stranger. A subdomain is a stranger. A different port is a stranger.',
  });
  tl.tween(cam, CAM_TABLE, { at: 7.0, dur: 1.3, ease: ease.move });
  tl.tween(tableU, 1, { at: 7.8, dur: 2.6, ease: ease.linear });
  tl.hold(12.1, 0.6);

  // Beat 2 — the wall
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'Now put two origins side by side, the way a page and a cross-origin iframe sit in one window. The same-origin policy draws a wall between them that the browser itself enforces — not a library, not a config, the engine.',
  });
  tl.tween(cam, CAM_WALL, { at: 13.0, dur: 1.3, ease: ease.move });
  tl.tween(wallU, 1, { at: 13.8, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 5.6,
    text: 'Across that wall, code on one side cannot read the other side’s cookies, its local or session storage, its cached database, or reach a single node of its page content. Not blocked by convention — the property access simply throws.',
  });
  tl.tween(blockU, 1, { at: 19.8, dur: 2.2, ease: ease.linear });
  tl.hold(24.3, 0.6);

  // Beat 3 — what still crosses
  tl.caption({
    at: 24.9,
    dur: 5.8,
    text: 'But the wall is not a void. Two things still cross it. The iframe on the far side still renders and runs — it is alive, just quarantined. And there is exactly one sanctioned pinhole between them: message passing, where you address a message to a specific origin and nothing else leaks.',
  });
  tl.tween(msgU, 1, { at: 26.0, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 31.3,
    dur: 5.2,
    text: 'That is the entire security model in one picture. A live but walled-off world, reachable only through a narrow, addressed channel. Everything almostnode’s sandbox does is arrange for untrusted code to run on the far side of this wall.',
  });
  tl.hold(36.5, 0.6);

  // Beat 4 — why it's trustworthy
  tl.caption({
    at: 37.1,
    dur: 5.6,
    text: 'And here is why leaning on the browser is the right move. This wall is tested by every bank, every webmail, every login on Earth, every day, adversarially. Any hole in it is a global emergency. You could not build a more scrutinized primitive if you tried.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 37.3, dur: 1.3, ease: ease.move });
  tl.hold(42.7, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 43.3,
    dur: 5.2,
    text: 'One catch remains, and it is a big one. To use this wall you must actually get untrusted code onto the far side of it — a genuinely different origin, wired back to your app through that one pinhole. That plumbing is almostnode’s architecture, and it is next.',
  });
  tl.tween(dimU, 1, { at: 44.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.3, dur: 1.0, ease: ease.enter });
  tl.hold(48.5, 1.4);

  return { tl, cam, titleU, defU, tableU, wallU, blockU, msgU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/same-origin-wall/overrides.json',
  slug: 'same-origin-wall',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const defU = s.get(scene.defU);
  const tableU = s.get(scene.tableU);
  const wallU = s.get(scene.wallU);
  const blockU = s.get(scene.blockU);
  const msgU = s.get(scene.msgU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const tableFade = 1 - 0.85 * clamp01(wallU * 2.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* origin definition */}
          {defU > 0 && (
            <g opacity={defU * tableFade}>
              <text x={200} y={180} fill={colors.TEXT} fontSize={16} fontWeight={600}>
                an origin =
              </text>
              <text x={330} y={180} fill={colors.ACCENT} fontSize={16} fontFamily="monospace">
                scheme
              </text>
              <text x={430} y={180} fill={colors.MUTED} fontSize={16}> + </text>
              <text x={460} y={180} fill={colors.SECONDARY} fontSize={16} fontFamily="monospace">
                host
              </text>
              <text x={530} y={180} fill={colors.MUTED} fontSize={16}> + </text>
              <text x={560} y={180} fill={colors.WARM} fontSize={16} fontFamily="monospace">
                port
              </text>
            </g>
          )}

          {/* origin comparison table */}
          {tableU > 0 &&
            CASES.map((c, i) => {
              const u = clamp01(tableU * CASES.length - i);
              if (u <= 0) return null;
              const y = 220 + i * 58;
              return (
                <g key={c.url} opacity={u * tableFade}>
                  <rect x={200} y={y} width={560} height={46} rx={8} fill={colors.PANEL} opacity={0.9} stroke={c.same ? colors.POSITIVE : colors.NEGATIVE} />
                  <text x={218} y={y + 20} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                    {c.url}
                  </text>
                  <text x={218} y={y + 38} fill={colors.MUTED} fontSize={11}>
                    {c.why}
                  </text>
                  <text x={742} y={y + 28} textAnchor="end" fill={c.same ? colors.POSITIVE : colors.NEGATIVE} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
                    {c.same ? 'same origin' : 'CROSS origin'}
                  </text>
                </g>
              );
            })}
          {tableU > 0.1 && (
            <text x={200} y={210} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={tableFade}>
              base: {BASE}
            </text>
          )}

          {/* the wall diagram */}
          {wallU > 0 && (
            <g opacity={wallU}>
              <rect x={300} y={200} width={280} height={300} rx={14} fill={colors.PANEL} opacity={0.9} stroke={colors.ACCENT} strokeWidth={1.5} />
              <text x={440} y={230} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                your app
              </text>
              <text x={440} y={252} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                app.example.com
              </text>
              <rect x={700} y={200} width={280} height={300} rx={14} fill={colors.PANEL} opacity={0.9} stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={840} y={230} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
                sandbox iframe
              </text>
              <text x={840} y={252} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                sandbox.example.com
              </text>
              {/* the wall */}
              <line x1={640} y1={186} x2={640} y2={514} stroke={colors.NEGATIVE} strokeWidth={4} strokeDasharray="10 7" />
              <text x={640} y={176} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontWeight={700}>
                same-origin wall
              </text>

              {/* blocked list on the app side */}
              {blockU > 0 &&
                BLOCKED.map((b, i) => {
                  const u = clamp01(blockU * BLOCKED.length - i);
                  if (u <= 0) return null;
                  return (
                    <g key={b} opacity={u}>
                      <text x={320} y={288 + i * 34} fill={colors.TEXT} fontSize={11.5} fontFamily="monospace">
                        {b}
                      </text>
                      <text x={600} y={288 + i * 34} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontWeight={700}>
                        ✗ blocked →
                      </text>
                    </g>
                  );
                })}

              {/* the one legal channel */}
              {msgU > 0 && (
                <g opacity={msgU}>
                  <line x1={580} y1={470} x2={700} y2={470} stroke={colors.POSITIVE} strokeWidth={3} />
                  <circle cx={640} cy={470} r={5} fill={colors.POSITIVE} />
                  <text x={640} y={496} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily="monospace" fontWeight={700}>
                    postMessage — the only pinhole
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* allowed note — screen space */}
      {msgU > 0 && (
        <g opacity={msgU * mainOp}>
          <rect x={880} y={120} width={360} height={120} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.POSITIVE} />
          <text x={904} y={150} fill={colors.POSITIVE} fontSize={14} fontWeight={700}>
            what still crosses the wall
          </text>
          {ALLOWED.map((a, i) => (
            <text key={a} x={904} y={182 + i * 26} fill={colors.MUTED} fontSize={12.5} fontFamily="monospace">
              • {a}
            </text>
          ))}
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The browser’s own wall
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A live world, walled off, reachable through one pinhole.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            different scheme, host, OR port → no cookie · storage · DB · DOM crosses
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            the most adversarially-tested primitive on the web — enforced by the engine
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: how almostnode gets untrusted code onto the far side
          </text>
        </g>
      )}
    </>
  );
}

export function SameOriginWall() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
