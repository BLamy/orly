// Nostr Implementation Possibilities №8 — Zaps, chapter 5.
// NIP-47 Nostr Wallet Connect: the wallet itself becomes a nostr service.
// A nostr+walletconnect:// URI (client pubkey path + relay + secret) pairs a
// client to a wallet service; kind-13194 advertises capabilities; requests are
// kind-23194 with NIP-44-encrypted {method, params}; responses are kind-23195
// with an e tag back to the request. The same request/response-over-a-relay
// pattern as NIP-46 remote signing (book 7), pointed at money.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, Connection, TokenFlight, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const URI_PARTS = [
  { text: 'nostr+walletconnect://', color: colors.MUTED, note: 'the scheme' },
  { text: 'a5f3…9c21', color: colors.ACCENT, note: 'wallet service pubkey' },
  { text: '?relay=wss://relay.getalby.com', color: colors.POSITIVE, note: 'where the wallet listens' },
  { text: '&secret=71c2…e0d4', color: colors.NEGATIVE, note: 'the client key — treat like a password' },
];

const PAY_REQUEST = {
  method: 'pay_invoice',
  params: { invoice: 'lnbc210n1p…' },
};
const PAY_RESPONSE = {
  result_type: 'pay_invoice',
  result: { preimage: '0f28…77aa', fees_paid: 4 },
};

const REQ_LAYOUT = layoutJson(PAY_REQUEST, { x: 120, y: 400, fontSize: 13.5 });
const RES_LAYOUT = layoutJson(PAY_RESPONSE, { x: 820, y: 400, fontSize: 13.5 });

const CLIENT = { x: 250, y: 250 };
const RELAY = { x: 640, y: 150 };
const WALLETSVC = { x: 1030, y: 250 };
const HALF_W = 84;

const CAM_URI: CameraState = { x: 640, y: 380, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  uriF: ChannelRef<number>;
  uriU: ChannelRef<number>;
  nodesU: ChannelRef<number>;
  infoU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  sealU: ChannelRef<number>;
  resU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const uriF = tl.channel('uriF', -1);
  const uriU = tl.channel('uriU', 0);
  const nodesU = tl.channel('nodesU', 0);
  const infoU = tl.channel('infoU', 0);
  const reqU = tl.channel('reqU', 0);
  const sealU = tl.channel('sealU', 0);
  const resU = tl.channel('resU', 0);
  const loopU = tl.channel('loopU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — one string pairs a wallet.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One question is still open: chapter three said your wallet pays the invoice. Which wallet? How does a nostr client reach one? With nostr wallet connect, the answer is: over nostr itself.',
  });
  tl.tween(uriU, 1, { at: 0.9, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_URI, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — anatomy of the pairing URI.
  tl.caption({
    at: 7.0,
    dur: 6.6,
    text: 'Pairing is one string, usually scanned from the wallet. Read it left to right: a scheme, the wallet service\'s public key, the relay where it listens — and a secret. That secret is a key, and whoever holds it can spend. Treat it like a password.',
  });
  tl.tween(uriF, 0, { at: 7.2, dur: 0.1, ease: ease.linear });
  tl.tween(uriF, URI_PARTS.length - 1, { at: 7.6, dur: 4.4, ease: ease.linear });
  tl.hold(13.8, 0.7);

  // Beat 3 — three parties again.
  tl.caption({
    at: 14.5,
    dur: 6.0,
    text: 'The shape should look familiar from the previous book: a client here, a wallet service there, a relay passing notes between machines that never meet. The wallet announces what it can do in a little capabilities event.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 14.7, dur: 1.4, ease: ease.move });
  tl.tween(uriU, 0, { at: 14.9, dur: 0.8, ease: ease.move });
  tl.tween(nodesU, 1, { at: 15.5, dur: 1.6, ease: ease.enter });
  tl.tween(infoU, 1, { at: 17.4, dur: 0.9, ease: ease.enter });
  tl.hold(20.6, 0.7);

  // Beat 4 — the pay_invoice request.
  tl.caption({
    at: 21.3,
    dur: 6.4,
    text: 'To pay chapter three\'s invoice, the client writes a tiny instruction — method: pay invoice, params: the invoice — seals it with the encryption from book three, and publishes it as a kind two three one nine four event addressed to the wallet.',
  });
  tl.tween(reqU, 1, { at: 21.8, dur: 1.4, ease: ease.draw });
  tl.tween(sealU, 1, { at: 23.6, dur: 2.2, ease: ease.linear });
  tl.hold(27.9, 0.7);

  // Beat 5 — the response comes back.
  tl.caption({
    at: 28.6,
    dur: 6.2,
    text: 'The wallet decrypts, pays over lightning, and answers with a response event pointing back at the request: result type pay invoice, the payment preimage as proof, and the fee it cost. Four sats, in this case.',
  });
  tl.tween(resU, 1, { at: 29.6, dur: 2.4, ease: ease.linear });
  tl.hold(35.0, 0.7);

  // Beat 6 — the loop closes.
  tl.caption({
    at: 35.7,
    dur: 6.0,
    text: 'Step back and the whole book closes into one loop: discovery on a profile, a request bound into an invoice, payment by a wallet that is itself a nostr service, and a public receipt anyone can verify.',
  });
  tl.tween(loopU, 1, { at: 36.4, dur: 1.6, ease: ease.enter });
  tl.hold(41.9, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 42.6,
    dur: 6.0,
    text: 'That is money as a social primitive: no platform balance, no like button with a database behind it — just events, keys, and invoices agreeing with each other in public. Next in the series: what long-form content does with these same pieces.',
  });
  tl.tween(dimU, 1, { at: 43.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 44.0, dur: 1.0, ease: ease.enter });
  tl.hold(48.8, 1.4);

  return { tl, cam, uriF, uriU, nodesU, infoU, reqU, sealU, resU, loopU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const uriF = Math.round(s.get(scene.uriF));
  const uriU = s.get(scene.uriU);
  const nodesU = s.get(scene.nodesU);
  const infoU = s.get(scene.infoU);
  const reqU = s.get(scene.reqU);
  const sealU = s.get(scene.sealU);
  const resU = s.get(scene.resU);
  const loopU = s.get(scene.loopU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  // URI parts laid out as one long monospace string with per-part highlight
  let uriX = 180;
  const uriSpans = URI_PARTS.map((p, i) => {
    const x = uriX;
    uriX += p.text.length * 8.4;
    return { ...p, x, i };
  });

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* pairing URI */}
          {uriU > 0 && (
            <g opacity={uriU}>
              <rect x={150} y={330} width={1000} height={54} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              {uriSpans.map((p) => {
                const active = uriF === p.i;
                return (
                  <g key={p.i}>
                    <text x={p.x} y={363} fill={p.color} fontSize={14} fontFamily="ui-monospace, Menlo, monospace" opacity={uriF < 0 || active ? 1 : 0.45} fontWeight={active ? 700 : 400}>
                      {p.text}
                    </text>
                    {active && (
                      <text x={p.x} y={416} fill={p.color} fontSize={13}>
                        {p.note}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* topology */}
          {nodesU > 0 && (
            <g opacity={nodesU}>
              <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="nostr client" sublabel="holds the secret" u={nodesU} />
              <ServiceNode x={RELAY.x} y={RELAY.y} kind="server" label="relay.getalby.com" sublabel="the meeting point" u={nodesU} />
              <ServiceNode x={WALLETSVC.x} y={WALLETSVC.y} kind="server" label="wallet service" sublabel="holds the sats" u={nodesU} />
              <Connection from={{ x: CLIENT.x + HALF_W, y: CLIENT.y - 20 }} to={{ x: RELAY.x - HALF_W, y: RELAY.y + 10 }} u={nodesU} color={colors.GRID} arrow={false} />
              <Connection from={{ x: RELAY.x + HALF_W, y: RELAY.y + 10 }} to={{ x: WALLETSVC.x - HALF_W, y: WALLETSVC.y - 20 }} u={nodesU} color={colors.GRID} arrow={false} />
            </g>
          )}
          {infoU > 0 && (
            <g opacity={infoU}>
              <rect x={930} y={320} width={230} height={40} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} opacity={0.95} />
              <text x={948} y={345} fill={colors.SECONDARY} fontSize={12.5} fontFamily="ui-monospace, Menlo, monospace">
                13194: pay_invoice, get_balance
              </text>
            </g>
          )}

          {/* request over the relay */}
          {reqU > 0 && (
            <g opacity={1 - 0.6 * resU}>
              <JsonDoc layout={REQ_LAYOUT} reveal={reqU} />
              <text x={120} y={382} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, Menlo, monospace" opacity={reqU}>
                kind 23194 — content, before sealing
              </text>
            </g>
          )}
          {sealU > 0 && (
            <TokenFlight
              from={{ x: 300, y: 430 }}
              to={{ x: RELAY.x, y: RELAY.y + 44 }}
              u={Math.min(1, sealU * 1.4)}
              text="🔒 nip44( pay_invoice )"
              fill={colors.POSITIVE}
              fontSize={13}
              lift={80}
              fadeOut
            />
          )}
          {sealU >= 0.7 && resU < 0.3 && (
            <Connection
              from={{ x: RELAY.x + HALF_W, y: RELAY.y + 10 }}
              to={{ x: WALLETSVC.x - HALF_W, y: WALLETSVC.y - 20 }}
              u={1}
              flow={sealU * 3}
              color={colors.POSITIVE}
              label="23194"
            />
          )}

          {/* response */}
          {resU > 0 && (
            <>
              <Connection
                from={{ x: WALLETSVC.x - HALF_W, y: WALLETSVC.y + 10 }}
                to={{ x: CLIENT.x + HALF_W, y: CLIENT.y + 10 }}
                u={Math.min(1, resU * 1.5)}
                flow={resU * 3}
                color={colors.WARM}
                label="23195 · e → request"
              />
              <JsonDoc layout={RES_LAYOUT} reveal={resU} />
              <text x={820} y={382} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, Menlo, monospace" opacity={resU}>
                kind 23195 — decrypted content
              </text>
            </>
          )}

          {loopU > 0 && (
            <text x={640} y={600} textAnchor="middle" fill={colors.ACCENT} fontSize={14} opacity={loopU}>
              profile → request → invoice → payment → receipt — every arrow an event or an invoice, nothing else
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The wallet is just another nostr service
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            pair with a URI · ask with 23194 · proof comes back as 23195
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-47 — nostr wallet connect · NIP-57 complete
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
