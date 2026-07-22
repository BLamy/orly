// Your Relay, Your Database — chapter 3 of "An App on Every Kind".
//
// Two faces of "an event is generic infrastructure". NIP-78: an app stores its
// own settings as a kind 30078 addressable event whose `d` tag names the app,
// so a relay becomes a personal, syncing database with no app backend. NIP-98:
// a kind 27235 event, signed and base64-wrapped into an Authorization header,
// lets any ordinary web server authenticate a request against a pubkey — the
// server checks kind, a fresh timestamp, the url tag, and the method tag.
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
import { JsonDoc, TokenFlight, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// kind 30078 — arbitrary app data
const APPDATA = {
  kind: 30078,
  pubkey: 'you…5e0ed7',
  tags: [['d', 'com.example.reader']],
  content: '{ "theme": "dark", "fontSize": 18 }',
};
const APPDATA_LAYOUT = layoutJson(APPDATA, { x: 120, y: 130, fontSize: 15, inlineArrayMax: 40 });

// kind 27235 — HTTP auth
const AUTH = {
  kind: 27235,
  pubkey: 'you…5e0ed7',
  created_at: 1700900042,
  tags: [
    ['u', 'https://api.example/upload'],
    ['method', 'POST'],
  ],
  content: '',
};
const AUTH_LAYOUT = layoutJson(AUTH, { x: 100, y: 150, fontSize: 15, inlineArrayMax: 44 });

const RELAY = { x: 560, y: 250 };
const DEVICES = [
  { x: 940, y: 150, label: 'laptop' },
  { x: 940, y: 300, label: 'phone' },
];

const CHECKS = ['kind is 27235', 'timestamp fresh (<60s)', 'u tag = request url', 'method tag = POST'];
const SERVER = { x: 760, y: 150, w: 360 };

const CAM_APPDATA: CameraState = { x: 420, y: 300, k: 1.15 };
const CAM_AUTH: CameraState = { x: 640, y: 320, k: 1.05 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const dataU = tl.channel('dataU', 0);
  const syncU = tl.channel('syncU', 0);
  const arriveU = tl.channel('arriveU', 0);
  const authU = tl.channel('authU', 0);
  const headerU = tl.channel('headerU', 0);
  const checkF = tl.channel('checkF', 0);
  const okU = tl.channel('okU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the app has settings; where do they live?
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Your reading app has settings — a theme, a font size. In a normal app those live in a company database. Here, the app has no backend at all. So where do they go?',
  });
  tl.tween(dataU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_APPDATA, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.6);

  // Beat 2 — settings are just an addressable event.
  tl.caption({
    at: 6.9,
    dur: 6.2,
    text: 'Into an event. Kind 30078 is a blank slot for any app to store its own data. The identifier tag is just the app’s name, so each app keeps its own corner and never collides with another.',
  });
  tl.hold(13.3, 0.6);

  // Beat 3 — it syncs through a relay to every device.
  tl.caption({
    at: 13.9,
    dur: 6.2,
    text: 'You sign it and hand it to a relay. Now every device you own reads the same event and wakes up configured. The relay became your personal, syncing database — and it never knew what the settings meant.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.1, dur: 1.4, ease: ease.move });
  tl.tween(syncU, 1, { at: 15.0, dur: 2.4, ease: ease.linear });
  tl.tween(arriveU, 1, { at: 17.4, dur: 1.2, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — the other direction: proving who you are to a plain server.
  tl.caption({
    at: 20.8,
    dur: 6.2,
    text: 'Now turn it around. You want to upload a file to an ordinary web server — no nostr inside it. How do you prove who you are, with no password and no account? Sign a second event.',
  });
  tl.tween(dataU, 0, { at: 20.8, dur: 0.8, ease: ease.move });
  tl.tween(syncU, 0, { at: 20.8, dur: 0.6, ease: ease.move });
  tl.tween(arriveU, 0, { at: 20.8, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_AUTH, { at: 21.0, dur: 1.4, ease: ease.move });
  tl.tween(authU, 1, { at: 21.8, dur: 1.8, ease: ease.draw });
  tl.hold(27.0, 0.7);

  // Beat 5 — wrap it into the sign-in header.
  tl.caption({
    at: 27.7,
    dur: 6.0,
    text: 'Kind 27235 names the exact web address and the method — here, an upload to that endpoint. You sign it, wrap it up, and send it as the request’s authorization header. It never touches a relay.',
  });
  tl.tween(headerU, 1, { at: 28.6, dur: 1.6, ease: ease.move });
  tl.hold(33.7, 0.7);

  // Beat 6 — the server runs four checks.
  tl.caption({
    at: 34.4,
    dur: 6.4,
    text: 'The server runs four checks. Is it the right kind? Is the timestamp fresh, within about a minute? Does the address tag match the request? Does the method match? All four pass, and the signature is real.',
  });
  tl.set(checkF, 0, 34.8);
  tl.set(checkF, 1, 36.2);
  tl.set(checkF, 2, 37.6);
  tl.set(checkF, 3, 39.0);
  tl.tween(okU, 1, { at: 40.2, dur: 0.8, ease: ease.pop });
  tl.hold(40.8, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.5,
    dur: 6.0,
    text: 'Same key, two jobs: a relay you use as a database, and a plain server you sign into with a throwaway event. One little schema, and any web service can trust you without ever storing a secret.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.7, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.9, dur: 1.0, ease: ease.enter });
  tl.hold(47.5, 1.2);

  return {
    tl, cam, dataU, syncU, arriveU, authU, headerU, checkF, okU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dataU = s.get(scene.dataU);
  const syncU = s.get(scene.syncU);
  const arriveU = s.get(scene.arriveU);
  const authU = s.get(scene.authU);
  const headerU = s.get(scene.headerU);
  const checkF = Math.round(s.get(scene.checkF));
  const okU = s.get(scene.okU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const uAnchor = AUTH_LAYOUT.anchor('tags[0][1]');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* NIP-78 app data + sync */}
          {dataU > 0 && (
            <g opacity={dataU}>
              <JsonDoc layout={APPDATA_LAYOUT} reveal={1} focus={syncU > 0 ? ['tags[0]'] : undefined} focusU={clamp01(syncU * 2)} />
              {syncU > 0 && (
                <>
                  <circle cx={RELAY.x} cy={RELAY.y} r={30} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} opacity={clamp01(syncU * 3)} />
                  <text x={RELAY.x} y={RELAY.y + 5} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={clamp01(syncU * 3)}>
                    relay
                  </text>
                  {DEVICES.map((d, i) => {
                    const u = clamp01(arriveU * 2 - i * 0.4);
                    return (
                      <g key={d.label}>
                        <line x1={RELAY.x + 30} y1={RELAY.y} x2={d.x - 40} y2={d.y + 30} stroke={colors.GRID} strokeWidth={1.4} opacity={clamp01(syncU * 2) * 0.7} />
                        <rect x={d.x - 40} y={d.y} width={120} height={60} rx={9} fill={colors.PANEL} stroke={u > 0.5 ? colors.POSITIVE : colors.GRID} opacity={0.4 + 0.6 * clamp01(syncU * 2)} />
                        <text x={d.x + 20} y={d.y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                          {d.label}
                        </text>
                        <text x={d.x + 20} y={d.y + 47} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} opacity={u}>
                          theme: dark · 18
                        </text>
                      </g>
                    );
                  })}
                </>
              )}
            </g>
          )}

          {/* NIP-98 HTTP auth */}
          {authU > 0 && (
            <g opacity={authU}>
              <JsonDoc layout={AUTH_LAYOUT} reveal={1} hidden={headerU > 0 && headerU < 1 ? ['tags[0][1]'] : undefined} />

              {/* the request + authorization header */}
              {headerU > 0 && (
                <g opacity={clamp01(headerU * 1.5)}>
                  <rect x={SERVER.x} y={SERVER.y} width={SERVER.w} height={70} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={SERVER.x + 16} y={SERVER.y + 27} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                    POST /upload
                  </text>
                  <text x={SERVER.x + 16} y={SERVER.y + 50} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                    Authorization: Nostr {'{event}'}
                  </text>
                  <TokenFlight
                    from={{ x: uAnchor.cx, y: uAnchor.cy + 5 }}
                    to={{ x: SERVER.x + SERVER.w / 2, y: SERVER.y + 50 }}
                    u={headerU}
                    text="signed 27235"
                    fill={colors.WARM}
                    fontSize={12}
                    lift={70}
                    fadeOut
                  />
                </g>
              )}

              {/* four checks */}
              {headerU >= 1 && (
                <g>
                  {CHECKS.map((c, i) => {
                    const passed = checkF >= i;
                    return (
                      <g key={c} opacity={passed ? 1 : 0.3}>
                        <circle cx={SERVER.x + 12} cy={SERVER.y + 104 + i * 30} r={7} fill="none" stroke={passed ? colors.POSITIVE : colors.GRID} strokeWidth={1.8} />
                        {passed && <path d={`M${SERVER.x + 8} ${SERVER.y + 104 + i * 30} l3 3 l6 -7`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" />}
                        <text x={SERVER.x + 28} y={SERVER.y + 109 + i * 30} fill={passed ? colors.TEXT : colors.MUTED} fontSize={13} fontFamily="monospace">
                          {c}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}
              {okU > 0 && (
                <g opacity={okU}>
                  <rect x={SERVER.x} y={SERVER.y + 232} width={SERVER.w} height={38} rx={9} fill={colors.POSITIVE} opacity={0.16} />
                  <text x={SERVER.x + SERVER.w / 2} y={SERVER.y + 257} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                    200 — authenticated, no password
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One key, a database and a login
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            a relay stores your app data; a signed event logs you in anywhere
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-78 kind 30078 · NIP-98 kind 27235
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
