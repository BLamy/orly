// Who You Are — chapter 3: a name you can say (NIP-05).
// Grounded in NIP-05: identifier <local>@<domain>; client fetches
// https://<domain>/.well-known/nostr.json?name=<local>; response has a
// required "names" map (hex pubkeys ONLY) and a recommended "relays" map;
// verification = returned key equals the event's pubkey; _@domain is the
// domain's root identity; names can be reassigned so the KEY stays primary.
// Centerpiece: the HTTP round trip, then two hex keys sliding together and
// matching — and later, the name arrow swinging to a different key while the
// original key stands unmoved.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { Connection, JsonDoc, ServiceNode, layoutJson, shortHex } from '../../primitives';
import { PUBKEY } from './chapter-1';
import overrides from './chapter-3.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const OTHER_KEY = '9d2f81a4c6e0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2';

const RESPONSE = {
  names: { bob: PUBKEY },
  relays: { [shortHex(PUBKEY, 6, 2)]: ['wss://relay.example.com'] },
};

const RESP_LAYOUT = layoutJson(RESPONSE, {
  x: 700,
  y: 300,
  fontSize: 14,
  inlineArrayMax: 40,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});

const CLIENT = { x: 210, y: 210 };
const SERVER = { x: 1020, y: 210 };
const HALF_W = 84;

const CAM_WIRE: CameraState = { x: 615, y: 260, k: 1.15 };
const CAM_MATCH: CameraState = { x: 640, y: 420, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nameU: ChannelRef<number>;
  nodesU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  respU: ChannelRef<number>;
  matchU: ChannelRef<number>;
  checkU: ChannelRef<number>;
  rootU: ChannelRef<number>;
  swingU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nameU = tl.channel('nameU', 0);
  const nodesU = tl.channel('nodesU', 0);
  const reqU = tl.channel('reqU', 0);
  const respU = tl.channel('respU', 0);
  const matchU = tl.channel('matchU', 0);
  const checkU = tl.channel('checkU', 0);
  const rootU = tl.channel('rootU', 0);
  const swingU = tl.channel('swingU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the identifier.
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'An n pub is speakable, barely. What people actually want is bob at bob dot example — a name at a domain. nip five borrows the shape of email without borrowing its servers.',
  });
  tl.tween(nameU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.hold(5.9, 0.7);

  // Beat 2 — the lookup.
  tl.caption({
    at: 6.6,
    dur: 6.2,
    text: 'The client splits the identifier, walks to the domain, and asks one well-known path on that domain — the nostr file every host can serve — with the name as a query. Plain web requests, no special infrastructure.',
  });
  tl.tween(nodesU, 1, { at: 6.9, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_WIRE, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: 8.2, dur: 2.0, ease: ease.linear });
  tl.hold(12.8, 0.7);

  // Beat 3 — the response.
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'The answer is a tiny document: a names map from local parts to keys — raw hex, never n pub — and, if the host is kind, a relays map saying where that key publishes.',
  });
  tl.tween(respU, 1, { at: 14.2, dur: 2.2, ease: ease.draw });
  tl.hold(19.5, 0.7);

  // Beat 4 — the match.
  tl.caption({
    at: 20.2,
    dur: 6.2,
    text: 'Verification is one comparison. The key the domain returned, against the key that signed the profile claiming the name. If the bytes agree, the badge is honest.',
  });
  tl.tween(cam, CAM_MATCH, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.tween(matchU, 1, { at: 21.2, dur: 1.8, ease: ease.move });
  tl.tween(checkU, 1, { at: 23.4, dur: 0.7, ease: ease.pop });
  tl.hold(26.4, 0.7);

  // Beat 5 — the root identity.
  tl.caption({
    at: 27.1,
    dur: 5.2,
    text: 'One convention rides along: the underscore local part means the domain itself. Underscore at bob dot example displays as just bob dot example — a domain as a person.',
  });
  tl.tween(rootU, 1, { at: 28.0, dur: 1.0, ease: ease.enter });
  tl.hold(32.3, 0.7);

  // Beat 6 — names are claims, keys are identities.
  tl.caption({
    at: 33.0,
    dur: 6.4,
    text: 'And the caution the spec itself insists on: the domain owner can point that name at a different key tomorrow. The name is a claim that can move. Track the key — the name is decoration.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 33.2, dur: 1.4, ease: ease.move });
  tl.tween(swingU, 1, { at: 34.4, dur: 1.8, ease: ease.move });
  tl.hold(39.4, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.1,
    dur: 5.2,
    text: 'Three coats now: a profile, an alphabet, a name at a domain. The next chapter turns outward — the follow list, where your key starts pointing at other people’s.',
  });
  tl.tween(dimU, 1, { at: 40.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.5, dur: 1.0, ease: ease.enter });
  tl.hold(45.3, 1.2);

  return { tl, cam, nameU, nodesU, reqU, respU, matchU, checkU, rootU, swingU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-who-you-are/chapter-3.overrides.json',
  slug: 'books/nips-who-you-are/chapter-3',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nameU = s.get(scene.nameU);
  const nodesU = s.get(scene.nodesU);
  const reqU = s.get(scene.reqU);
  const respU = s.get(scene.respU);
  const matchU = s.get(scene.matchU);
  const checkU = s.get(scene.checkU);
  const rootU = s.get(scene.rootU);
  const swingU = s.get(scene.swingU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the identifier */}
          {nameU > 0 && (
            <g opacity={nameU * (1 - 0.7 * clamp01(matchU))}>
              <text x={400} y={100} fontSize={26} fontFamily="monospace">
                <tspan fill={colors.POSITIVE} fontWeight={600}>bob</tspan>
                <tspan fill={colors.MUTED}>@</tspan>
                <tspan fill={colors.ACCENT} fontWeight={600}>bob.example</tspan>
              </text>
              <text x={400} y={126} fill={colors.MUTED} fontSize={12}>
                local part · domain — NIP-05 identifier
              </text>
            </g>
          )}

          {/* client / server */}
          {nodesU > 0 && (
            <g>
              <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="client" sublabel="any app" u={nodesU} />
              <ServiceNode x={SERVER.x} y={SERVER.y} kind="server" label="bob.example" sublabel="plain web host" u={nodesU} />
              <Connection
                from={{ x: CLIENT.x + HALF_W, y: CLIENT.y }}
                to={{ x: SERVER.x - HALF_W, y: SERVER.y }}
                u={clamp01(reqU * 2)}
                flow={reqU * 2}
                label="GET /.well-known/nostr.json?name=bob"
                color={colors.ACCENT}
              />
            </g>
          )}

          {/* response document */}
          {respU > 0 && (
            <g opacity={1 - 0.8 * clamp01(swingU * 2)}>
              <text x={RESP_LAYOUT.x} y={286} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={respU}>
                200 OK — nostr.json
              </text>
              <JsonDoc layout={RESP_LAYOUT} reveal={respU} focus={matchU > 0 ? ['names.bob'] : undefined} focusU={matchU > 0 ? 0.8 : 0} />
            </g>
          )}

          {/* the match */}
          {matchU > 0 && (
            <g>
              <g opacity={Math.min(1, matchU * 2)}>
                <rect x={180 + matchU * 120} y={470} width={310} height={40} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} />
                <text x={196 + matchU * 120} y={488} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">from the domain</text>
                <text x={196 + matchU * 120} y={503} fill={colors.ACCENT} fontSize={13} fontFamily="monospace">{shortHex(PUBKEY, 14, 6)}</text>
                <rect x={790 - matchU * 120} y={470} width={310} height={40} rx={9} fill={colors.PANEL} stroke={colors.WARM} />
                <text x={806 - matchU * 120} y={488} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">from the signed profile</text>
                <text x={806 - matchU * 120} y={503} fill={colors.WARM} fontSize={13} fontFamily="monospace">{shortHex(PUBKEY, 14, 6)}</text>
              </g>
              {checkU > 0 && (
                <g opacity={checkU}>
                  <circle cx={640} cy={555} r={15} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
                  <path d="M632 555 l6 6 l11 -13" fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} strokeLinecap="round" />
                  <text x={664} y={560} fill={colors.POSITIVE} fontSize={14}>same bytes — verified</text>
                </g>
              )}
            </g>
          )}

          {/* root identity */}
          {rootU > 0 && swingU <= 0 && (
            <g opacity={rootU}>
              <text x={120} y={330} fill={colors.SECONDARY} fontSize={15} fontFamily="monospace">_@bob.example</text>
              <text x={120} y={356} fill={colors.MUTED} fontSize={13}>displays as just “bob.example”</text>
            </g>
          )}

          {/* the swing: name re-points, key unmoved */}
          {swingU > 0 && (
            <g opacity={swingU}>
              <text x={210} y={330} fill={colors.POSITIVE} fontSize={18} fontFamily="monospace">bob@bob.example</text>
              <g>
                <rect x={820} y={250} width={300} height={40} rx={9} fill={colors.PANEL} stroke={colors.WARM} opacity={1 - 0.5 * swingU} />
                <text x={836} y={275} fill={colors.WARM} fontSize={13} fontFamily="monospace" opacity={1 - 0.5 * swingU}>
                  {shortHex(PUBKEY, 14, 6)}
                </text>
                <rect x={820} y={380} width={300} height={40} rx={9} fill={colors.PANEL} stroke={colors.NEGATIVE} />
                <text x={836} y={405} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                  {shortHex(OTHER_KEY, 14, 6)}
                </text>
              </g>
              {(() => {
                const ang = swingU; // 0 → old key, 1 → new key
                const y2 = 270 + (400 - 270) * ang;
                return <line x1={520} y1={324} x2={812} y2={y2} stroke={colors.MUTED} strokeWidth={2} strokeDasharray="7 5" />;
              })()}
              <text x={560} y={470} fill={colors.MUTED} fontSize={13} opacity={clamp01(swingU * 2 - 1)}>
                the domain re-pointed the name — the old key didn’t change, the claim did
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The name is a claim; the key is the identity
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one GET, one comparison — verification without a platform
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-05 · /.well-known/nostr.json · hex only
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter3() {
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
