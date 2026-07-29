// Nostr Implementation Possibilities №8 — Zaps, chapter 2.
// The kind-9734 zap request: a fully signed nostr event that is deliberately
// NOT published to relays. Its tags say where the receipt should go (relays),
// how much this is for (amount, millisats), who gets it (p) and optionally
// which note earned it (e). It travels as a URL parameter in an HTTP GET to
// the wallet server's callback. Grounded in NIP-57 appendix A/B.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, Connection, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The zap request (NIP-57 shape; hex values illustrative, structure exact).
// ---------------------------------------------------------------------------
export const ZAP_REQUEST = {
  kind: 9734,
  pubkey: 'b1a6f4e29c8d0a3f5e7b9d1c3a5f7e9b1d3c5a7f9e1b3d5c7a9f1e3b5d7c9a1f',
  created_at: 1700003600,
  tags: [
    ['relays', 'wss://relay.damus.io', 'wss://nos.lol'],
    ['amount', '21000'],
    ['p', '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2'],
    ['e', '9ae37aa68f48645127299e9453eb5d908a0cbb6058ff340d528ed4d37c8994fb'],
  ],
  content: 'great note ⚡',
  sig: '…',
};

const LAYOUT = layoutJson(ZAP_REQUEST, {
  x: 90,
  y: 130,
  fontSize: 15,
  inlineArrayMax: 54,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw, 6, 2) : raw),
});

const TAG_NOTES: Array<{ path: string; label: string; note: string }> = [
  { path: 'tags[0]', label: 'relays', note: 'publish my receipt here' },
  { path: 'tags[1]', label: 'amount', note: '21000 millisats — 21 sats' },
  { path: 'tags[2]', label: 'p', note: 'who is being zapped' },
  { path: 'tags[3]', label: 'e', note: 'the note that earned it' },
];

const RELAY = { x: 1020, y: 170 };
const WALLET = { x: 1020, y: 470 };
const HALF_W = 84;

const CAM_JSON: CameraState = { x: 400, y: 300, k: 1.22 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  tagF: ChannelRef<number>;
  tagU: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  bounceU: ChannelRef<number>;
  sendU: ChannelRef<number>;
  urlU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const tagF = tl.channel('tagF', -1);
  const tagU = tl.channel('tagU', 0);
  const lanesU = tl.channel('lanesU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const sendU = tl.channel('sendU', 0);
  const urlU = tl.channel('urlU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a new kind of event.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'To ask for an invoice, the sender composes an event: kind nine seven three four, the zap request. It looks like any other note — seven fields, a signature — but every tag on it is an instruction.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — sweep the tags.
  tl.caption({
    at: 7.0,
    dur: 6.6,
    text: 'Read them as a checklist. Relays: publish my receipt to these two. Amount: twenty one thousand millisats. P: the person being zapped. E: the exact note that earned it. The request carries its own delivery instructions.',
  });
  tl.tween(tagU, 1, { at: 7.3, dur: 0.5, ease: ease.enter });
  tl.set(tagF, 0, 7.5);
  tl.tween(tagF, TAG_NOTES.length - 1, { at: 7.8, dur: 4.6, ease: ease.linear });
  tl.tween(tagU, 0, { at: 13.0, dur: 0.6, ease: ease.move });
  tl.hold(13.6, 0.7);

  // Beat 3 — the twist: not for relays.
  tl.caption({
    at: 14.3,
    dur: 6.2,
    text: 'Now the twist. Every event so far in this series went to a relay. This one must not. Publish a zap request and you have just told the whole network what you tip — before any payment even exists.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.5, dur: 1.4, ease: ease.move });
  tl.tween(lanesU, 1, { at: 15.4, dur: 1.2, ease: ease.enter });
  tl.tween(bounceU, 1, { at: 16.8, dur: 1.8, ease: ease.move });
  tl.hold(20.5, 0.7);

  // Beat 4 — it rides an HTTP GET instead.
  tl.caption({
    at: 21.2,
    dur: 6.4,
    text: 'Instead, the signed event is stringified, U-R-L encoded, and tucked into a get request to the callback address from chapter one — riding to the wallet server as a query parameter named nostr.',
  });
  tl.tween(sendU, 1, { at: 22.2, dur: 2.2, ease: ease.move });
  tl.tween(urlU, 1, { at: 24.4, dur: 1.0, ease: ease.enter });
  tl.hold(27.6, 0.7);

  // Beat 5 — why sign something that never gets published?
  tl.caption({
    at: 28.3,
    dur: 6.2,
    text: 'Why sign something no relay will ever see? Because the wallet server is about to bake this exact request into the invoice — and later, everyone will want proof that the person named in it really asked for that payment.',
  });
  tl.hold(34.5, 0.7);

  // Beat 6 — close.
  tl.caption({
    at: 35.2,
    dur: 5.8,
    text: 'So the zap request is a letter of intent: signed like a note, addressed like a receipt, delivered like a web request. What comes back is lightning — an invoice with this event fingerprinted inside it.',
  });
  tl.tween(dimU, 1, { at: 35.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.6, dur: 1.0, ease: ease.enter });
  tl.hold(41.0, 1.2);

  return { tl, cam, jsonU, tagF, tagU, lanesU, bounceU, sendU, urlU, dimU, closeU };
}

const scene = buildScene();

const DOC_ANCHOR = LAYOUT.anchor('');

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const tagU = s.get(scene.tagU);
  const tagF = Math.round(s.get(scene.tagF));
  const lanesU = s.get(scene.lanesU);
  const bounceU = s.get(scene.bounceU);
  const sendU = s.get(scene.sendU);
  const urlU = s.get(scene.urlU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const activeTag = tagU > 0 && tagF >= 0 ? TAG_NOTES[Math.min(tagF, TAG_NOTES.length - 1)] : null;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={activeTag ? [activeTag.path] : undefined}
            focusU={tagU}
          />
          {activeTag && (
            <g opacity={tagU}>
              <rect x={560} y={250} width={330} height={56} rx={10} fill={colors.PANEL} stroke={colors.WARM} opacity={0.95} />
              <text x={578} y={274} fill={colors.WARM} fontSize={14} fontWeight={600}>
                {activeTag.label}
              </text>
              <text x={578} y={294} fill={colors.TEXT} fontSize={13}>
                {activeTag.note}
              </text>
            </g>
          )}

          {/* the two lanes */}
          {lanesU > 0 && (
            <g opacity={lanesU}>
              <ServiceNode x={RELAY.x} y={RELAY.y} kind="server" label="relay" sublabel="the usual road" u={lanesU} dim={0.2} />
              <ServiceNode x={WALLET.x} y={WALLET.y} kind="server" label="wallet.example" sublabel="callback endpoint" u={lanesU} />
            </g>
          )}

          {/* bounce off the relay lane */}
          {bounceU > 0 && bounceU < 1 && (
            <TokenFlight
              from={{ x: DOC_ANCHOR.x + DOC_ANCHOR.w - 20, y: 180 }}
              to={{ x: RELAY.x - HALF_W - 24, y: RELAY.y }}
              u={Math.min(1, bounceU * 1.6)}
              text="kind 9734"
              fill={colors.NEGATIVE}
              fontSize={13}
              lift={60}
            />
          )}
          {bounceU >= 0.6 && (
            <g opacity={Math.min(1, (bounceU - 0.6) / 0.4) * (1 - sendU)}>
              <line x1={RELAY.x - HALF_W - 14} y1={RELAY.y - 16} x2={RELAY.x - HALF_W - 38} y2={RELAY.y + 16} stroke={colors.NEGATIVE} strokeWidth={3} />
              <line x1={RELAY.x - HALF_W - 38} y1={RELAY.y - 16} x2={RELAY.x - HALF_W - 14} y2={RELAY.y + 16} stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={RELAY.x - HALF_W - 26} y={RELAY.y + 44} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12}>
                never published
              </text>
            </g>
          )}

          {/* the HTTP ride to the wallet */}
          {sendU > 0 && (
            <>
              <Connection
                from={{ x: 620, y: 470 }}
                to={{ x: WALLET.x - HALF_W, y: WALLET.y }}
                u={Math.min(1, sendU * 1.5)}
                flow={sendU * 2}
                label="GET ?amount=21000&nostr=…"
                color={colors.WARM}
              />
              <TokenFlight
                from={{ x: DOC_ANCHOR.x + DOC_ANCHOR.w - 40, y: 320 }}
                to={{ x: 600, y: 462 }}
                u={Math.min(1, sendU * 1.3)}
                text="signed 9734, url-encoded"
                fill={colors.WARM}
                fontSize={12.5}
                lift={50}
              />
            </>
          )}
          {urlU > 0 && (
            <text x={430} y={540} fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, Menlo, monospace" opacity={urlU}>
              …/lnurlp/derek/cb?amount=21000&nostr=%7B%22kind%22%3A9734…
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Signed like a note, delivered like a web request
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            kind 9734 carries relays · amount · p · e — and never touches a relay
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-57 — the zap request
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
