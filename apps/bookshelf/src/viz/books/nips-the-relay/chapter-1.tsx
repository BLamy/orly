// Nostr Implementation Possibilities №5 — The Relay, chapter 1.
// NIP-11 (Relay Information Document): fetch the wss:// URL over https with
// Accept: application/nostr+json and the relay describes itself — identity
// fields, supported_nips, and the limitation object (max_subscriptions,
// max_message_length, auth_required, payment_required…). All field names are
// the spec's own; values are an illustrative but typical relay.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const ADMIN_PK = '9f2b6d0e4a8c2f6b0d4e8a2c6f0b4d8e2a6c0f4b8d2e6a0c4f8b2d6e0a4c8f2b';

export const INFO = {
  name: 'nest',
  description: 'a public nostr relay',
  pubkey: ADMIN_PK,
  supported_nips: [1, 9, 11, 40, 42, 45, 50, 65],
  software: 'git.example/nestrelay',
  version: '1.4.2',
  limitation: {
    max_subscriptions: 20,
    max_limit: 5000,
    max_message_length: 131072,
    auth_required: false,
    payment_required: false,
  },
};

const LAYOUT = layoutJson(INFO, {
  x: 96,
  y: 130,
  fontSize: 14.5,
  inlineArrayMax: 60,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw, 8, 4) : raw),
});

const RELAY_NODE = { x: 1010, y: 170 };
const URL_POS = { x: 1010, y: 96 };

// supported_nips badges: values fly out of the array to a right-side column.
const NIP_BADGES = INFO.supported_nips.map((n, i) => ({
  n,
  x: 880 + (i % 4) * 88,
  y: 300 + Math.floor(i / 4) * 54,
}));

// limitation "gates" rendered under the relay: label + reading.
const GATES = [
  { key: 'limitation.max_subscriptions', label: 'subscriptions', val: '≤ 20' },
  { key: 'limitation.max_limit', label: 'filter limit clamp', val: '≤ 5000' },
  { key: 'limitation.max_message_length', label: 'message bytes', val: '≤ 131072' },
  { key: 'limitation.auth_required', label: 'auth lock', val: 'open' },
];

const CAM_DOC: CameraState = { x: 330, y: 300, k: 1.28 };
// wide enough that the document (x ≈ 96) AND the badge/gate column (→ ≈ 1178)
// are both on screen — the flights read better when takeoff and landing show
const CAM_RIGHT: CameraState = { x: 726, y: 300, k: 1.05 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodeU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  docU: ChannelRef<number>;
  whoU: ChannelRef<number>;
  nipsU: ChannelRef<number>;
  gatesU: ChannelRef<number>;
  honestU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const nodeU = tl.channel('nodeU', 0);
  const flipU = tl.channel('flipU', 0);
  const docU = tl.channel('docU', 0);
  const whoU = tl.channel('whoU', 0);
  const nipsU = tl.channel('nipsU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const honestU = tl.channel('honestU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A relay is just a websocket address. But before a single event crosses that socket, a careful client knocks on the front door a different way — and asks the relay to introduce itself.',
  });
  tl.tween(nodeU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.hold(6.3, 0.7);

  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'The trick is in the eleventh proposal. Take the same address, speak plain web instead of websocket, and send one extra header asking for the relay description format. The relay answers with a document.',
  });
  tl.tween(flipU, 1, { at: 8.2, dur: 1.4, ease: ease.move });
  tl.hold(13.0, 0.7);

  tl.caption({
    at: 13.7,
    dur: 5.6,
    text: 'This is the relay information document. It is the relay describing itself, in one small structured file, before you commit a connection to it.',
  });
  tl.tween(docU, 1, { at: 14.2, dur: 2.4, ease: ease.draw });
  tl.tween(cam, CAM_DOC, { at: 14.4, dur: 1.4, ease: ease.move });
  tl.hold(19.3, 0.7);

  tl.caption({
    at: 20.0,
    dur: 5.8,
    text: 'The top half is identity: a name, a description, and an administrator public key — an actual person you can contact, which matters the day your notes stop appearing.',
  });
  tl.tween(whoU, 1, { at: 20.6, dur: 0.6, ease: ease.enter });
  tl.tween(whoU, 0, { at: 24.8, dur: 0.6, ease: ease.move });
  tl.hold(25.8, 0.7);

  tl.caption({
    at: 26.5,
    dur: 6.2,
    text: 'Supported nips is the menu. Each number is one protocol extension this relay actually implements — and this particular menu happens to be the table of contents of this book.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 26.8, dur: 1.4, ease: ease.move });
  tl.tween(nipsU, 1, { at: 27.6, dur: 2.8, ease: ease.linear });
  tl.hold(32.7, 0.7);

  tl.caption({
    at: 33.4,
    dur: 6.4,
    text: 'The limitation object is the house rules, machine-readable: at most twenty subscriptions per connection, filter limits clamped at five thousand, messages capped at a hundred thirty-one kilobytes — and two booleans saying whether authentication or payment is required.',
  });
  tl.tween(gatesU, 1, { at: 34.2, dur: 2.6, ease: ease.linear });
  tl.hold(39.8, 0.7);

  tl.caption({
    at: 40.5,
    dur: 5.6,
    text: 'One honest caveat: every word of this document is self-reported. Nothing forces a relay to tell the truth here. It is a sign on a door, not a contract.',
  });
  tl.tween(honestU, 1, { at: 41.4, dur: 0.8, ease: ease.enter });
  tl.hold(46.1, 0.7);

  tl.caption({
    at: 46.8,
    dur: 5.4,
    text: 'Still — read the sign before you walk in. Everything else in this book is a conversation with this machine, and the document tells you which conversations it can hold.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 47.0, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.4, dur: 1.0, ease: ease.enter });
  tl.hold(52.2, 1.2);

  return { tl, cam, nodeU, flipU, docU, whoU, nipsU, gatesU, honestU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodeU = s.get(scene.nodeU);
  const flipU = s.get(scene.flipU);
  const docU = s.get(scene.docU);
  const whoU = s.get(scene.whoU);
  const nipsU = s.get(scene.nipsU);
  const gatesU = s.get(scene.gatesU);
  const honestU = s.get(scene.honestU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // while the camera is parked on the right column, keep the document in a
  // focus dim so its off-camera identity fields never clip at full opacity
  let focus: string[] | undefined;
  let focusU = 0;
  if (whoU > 0) {
    focus = ['name', 'description', 'pubkey'];
    focusU = whoU;
  } else if (nipsU > 0) {
    // gates beat: the subject is the right-column chips — sink the whole
    // document to near-nothing so no off-camera token clips visibly
    focus = gatesU > 0 ? ['(nothing)'] : ['supported_nips'];
    focusU = clamp01(nipsU * 3);
  }

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {nodeU > 0 && (
            <g>
              <ServiceNode x={RELAY_NODE.x} y={RELAY_NODE.y} kind="server" label="relay.example" sublabel="a relay" u={nodeU} />
              {/* the address, flipping scheme */}
              <text x={URL_POS.x} y={URL_POS.y} textAnchor="middle" fontSize={15} fontFamily="ui-monospace, Menlo, monospace" opacity={nodeU}>
                <tspan fill={flipU > 0.5 ? colors.WARM : colors.ACCENT}>{flipU > 0.5 ? 'https' : 'wss'}</tspan>
                <tspan fill={colors.MUTED}>://relay.example</tspan>
              </text>
              {flipU > 0 && (
                <g opacity={Math.min(1, flipU * 1.4)}>
                  <rect x={790} y={122} width={300} height={26} rx={7} fill={colors.PANEL} stroke={colors.WARM} opacity={0.9} />
                  <text x={940} y={139} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
                    Accept: application/nostr+json
                  </text>
                </g>
              )}
            </g>
          )}

          <JsonDoc layout={LAYOUT} reveal={docU} focus={focus} focusU={focusU} dim={gatesU > 0 ? 0.06 : 0.22} />

          {/* supported_nips badges */}
          {NIP_BADGES.map((b, i) => {
            const a = LAYOUT.anchor(`supported_nips[${i}]`);
            const u = clamp01(nipsU * NIP_BADGES.length - i);
            if (u <= 0) return null;
            return (
              <g key={b.n}>
                <TokenFlight
                  from={{ x: a.cx, y: a.cy + 5 }}
                  to={{ x: b.x, y: b.y + 5 }}
                  u={u}
                  text={String(b.n)}
                  fill={colors.ACCENT}
                  fontSize={15}
                  lift={46}
                />
                {u >= 1 && (
                  <rect x={b.x - 32} y={b.y - 16} width={64} height={34} rx={9} fill="none" stroke={colors.ACCENT} opacity={0.55} />
                )}
              </g>
            );
          })}
          {nipsU >= 1 && (
            <text x={880 - 32} y={280} fill={colors.MUTED} fontSize={12} opacity={Math.min(1, (nipsU - 0.9) * 10)}>
              what this relay speaks
            </text>
          )}

          {/* limitation gates */}
          {GATES.map((gate, i) => {
            const u = clamp01(gatesU * GATES.length - i);
            if (u <= 0) return null;
            const y = 430 + i * 40;
            return (
              <g key={gate.key} opacity={u}>
                <rect x={848} y={y - 18} width={330} height={32} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={866} y={y + 3} fill={colors.TEXT} fontSize={13}>{gate.label}</text>
                <text x={1160} y={y + 3} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
                  {gate.val}
                </text>
              </g>
            );
          })}

          {honestU > 0 && (
            <text x={330} y={560} fill={colors.NEGATIVE} fontSize={14} opacity={honestU}>
              self-reported — a sign on a door, not a contract
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={235} width={840} height={185} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={303} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Read the sign before you walk in
          </text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            identity · supported extensions · machine-readable house rules
          </text>
          <text x={640} y={387} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-11 · GET https://…  Accept: application/nostr+json
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
