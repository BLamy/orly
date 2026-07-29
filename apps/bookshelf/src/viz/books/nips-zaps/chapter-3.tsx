// Nostr Implementation Possibilities №8 — Zaps, chapter 3.
// The description-hash invoice. The wallet server takes the zap request JSON,
// hashes it with SHA-256 (computed for REAL below), and mints a bolt11
// invoice whose description hash IS that digest. Paying the invoice pays that
// exact request — the hash binds the lightning world to the nostr event.
// Grounded in NIP-57 appendix B ("a lightning invoice with the zap request
// JSON, escaped and JSON-encoded, as the description hash").
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { BitField, JsonDoc, TokenFlight, hexToBits, layoutJson, sha256Hex, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Same zap request as chapter 2 (kept in sync); its digest is computed for
// real at module scope — what's on screen is the true SHA-256.
// ---------------------------------------------------------------------------
const ZAP_REQUEST = {
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
export const REQUEST_JSON = JSON.stringify(ZAP_REQUEST);
export const DESC_HASH = sha256Hex(REQUEST_JSON);
const DESC_BITS = hexToBits(DESC_HASH);

const LAYOUT = layoutJson(ZAP_REQUEST, {
  x: 80,
  y: 120,
  fontSize: 13.5,
  inlineArrayMax: 50,
  abbrev: (_p, raw) => (raw.length > 24 ? shortHex(raw, 6, 2) : raw),
});

const GRID = { x: 560, y: 130, cell: 12, gap: 2.5 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

// invoice card
const INV = { x: 860, y: 130, w: 330, h: 250 };
const INVOICE_FIELDS = [
  { k: 'amount', v: '21000 msat', hot: false },
  { k: 'payee', v: 'wallet.example node', hot: false },
  { k: 'desc_hash', v: shortHex(DESC_HASH, 10, 6), hot: true },
  { k: 'expiry', v: '600 s', hot: false },
];

const CAM_JSON: CameraState = { x: 400, y: 300, k: 1.2 };
const CAM_INV: CameraState = { x: 880, y: 300, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  serU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  settleU: ChannelRef<number>;
  invU: ChannelRef<number>;
  hashFlyU: ChannelRef<number>;
  bindU: ChannelRef<number>;
  payU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const serU = tl.channel('serU', 0);
  const gridU = tl.channel('gridU', 0);
  const settleU = tl.channel('settleU', 0);
  const invU = tl.channel('invU', 0);
  const hashFlyU = tl.channel('hashFlyU', 0);
  const bindU = tl.channel('bindU', 0);
  const payU = tl.channel('payU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the wallet server holds the request.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The wallet server now holds the signed zap request. Before it answers with an invoice, it does one thing to it — the same thing nostr does to every event. It hashes it.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — serialize and hash, for real.
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'The whole event, stringified, runs through S-H-A two fifty six. These are the true bits of that digest, computed from the request on the left — not an illustration.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(serU, 1, { at: 7.4, dur: 1.2, ease: ease.move });
  tl.tween(gridU, 1, { at: 8.2, dur: 1.2, ease: ease.draw });
  tl.tween(settleU, 1, { at: 9.0, dur: 2.6, ease: ease.linear });
  tl.hold(13.0, 0.7);

  // Beat 3 — the invoice is minted around the hash.
  tl.caption({
    at: 13.7,
    dur: 6.4,
    text: 'Then it mints a lightning invoice — a bolt eleven payment request — and writes that digest into the invoice itself, in a field called the description hash. The invoice is built around the event.',
  });
  tl.tween(invU, 1, { at: 14.4, dur: 1.0, ease: ease.enter });
  tl.tween(hashFlyU, 1, { at: 15.6, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAM_INV, { at: 15.8, dur: 1.4, ease: ease.move });
  tl.hold(20.8, 0.7);

  // Beat 4 — what the binding buys.
  tl.caption({
    at: 21.5,
    dur: 6.4,
    text: 'Feel what that binding buys. Change one character of the zap request and the digest scatters — this invoice no longer matches. Pay this invoice, and you have provably paid that exact request: amount, recipient, note and all.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.7, dur: 1.4, ease: ease.move });
  tl.tween(bindU, 1, { at: 22.6, dur: 1.2, ease: ease.enter });
  tl.hold(27.9, 0.7);

  // Beat 5 — payment.
  tl.caption({
    at: 28.6,
    dur: 5.8,
    text: 'The invoice travels back to the sender, their lightning wallet pays it, and sats move through the lightning network — outside nostr entirely. Nostr has not seen a single event yet. That changes next.',
  });
  tl.tween(payU, 1, { at: 29.6, dur: 2.0, ease: ease.move });
  tl.hold(34.4, 0.7);

  // Beat 6 — close.
  tl.caption({
    at: 35.1,
    dur: 5.6,
    text: 'One digest, two worlds: a nostr event fingerprinted inside a lightning invoice. The payment and the request are now the same fact, stated in two protocols. The receipt will say so in public.',
  });
  tl.tween(dimU, 1, { at: 35.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.5, dur: 1.0, ease: ease.enter });
  tl.hold(40.7, 1.2);

  return { tl, cam, jsonU, serU, gridU, settleU, invU, hashFlyU, bindU, payU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const serU = s.get(scene.serU);
  const gridU = s.get(scene.gridU);
  const settleU = s.get(scene.settleU);
  const invU = s.get(scene.invU);
  const hashFlyU = s.get(scene.hashFlyU);
  const bindU = s.get(scene.bindU);
  const payU = s.get(scene.payU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const hashHome = { x: GRID.x + GRID_W / 2, y: GRID.y + GRID_W + 30 };
  const hashSlot = { x: INV.x + 208, y: INV.y + 148 };

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc layout={LAYOUT} reveal={jsonU} opacity={1 - 0.5 * clamp01(invU)} />

          {serU > 0 && (
            <g opacity={serU}>
              <text x={80} y={555} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, Menlo, monospace">
                JSON.stringify(request) → {REQUEST_JSON.length} bytes
              </text>
              <path d={`M420,320 Q490,300 ${GRID.x - 14},${GRID.y + GRID_W / 2}`} fill="none" stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="5 5" opacity={serU} />
            </g>
          )}

          {gridU > 0 && (
            <g>
              <text x={GRID.x} y={GRID.y - 16} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, Menlo, monospace" opacity={gridU}>
                SHA-256 — real digest
              </text>
              <BitField bits={DESC_BITS} x={GRID.x} y={GRID.y} cell={GRID.cell} gap={GRID.gap} reveal={gridU} settle={settleU} seed={8} />
              {settleU >= 1 && hashFlyU < 1 && (
                <text x={hashHome.x} y={hashHome.y} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily="ui-monospace, Menlo, monospace">
                  {shortHex(DESC_HASH, 10, 6)}
                </text>
              )}
            </g>
          )}

          {/* the invoice card */}
          {invU > 0 && (
            <g opacity={invU}>
              <rect x={INV.x} y={INV.y} width={INV.w} height={INV.h} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={INV.x + 20} y={INV.y + 32} fill={colors.WARM} fontSize={15} fontWeight={600}>
                bolt11 invoice
              </text>
              <text x={INV.x + 20} y={INV.y + 54} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
                lnbc210n1p…
              </text>
              {INVOICE_FIELDS.map((f, i) => {
                const y = INV.y + 92 + i * 34;
                return (
                  <g key={f.k}>
                    <text x={INV.x + 20} y={y} fill={f.hot ? colors.ACCENT : colors.MUTED} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
                      {f.k}
                    </text>
                    {(!f.hot || hashFlyU >= 1) && (
                      <text x={INV.x + 130} y={y} fill={f.hot ? colors.ACCENT : colors.TEXT} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
                        {f.v}
                      </text>
                    )}
                    {f.hot && hashFlyU < 1 && (
                      <rect x={INV.x + 128} y={y - 14} width={160} height={20} rx={5} fill="none" stroke={colors.MUTED} strokeDasharray="4 4" opacity={0.5} />
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the digest flies into the desc_hash slot */}
          <TokenFlight
            from={hashHome}
            to={hashSlot}
            u={hashFlyU}
            text={shortHex(DESC_HASH, 10, 6)}
            fill={colors.ACCENT}
            fontSize={12.5}
            lift={90}
            holdAtEnd={false}
          />

          {bindU > 0 && (
            <text x={GRID.x + GRID_W / 2} y={500} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} opacity={bindU}>
              pay the invoice = provably pay THIS request
            </text>
          )}

          {payU > 0 && (
            <g opacity={payU}>
              <line x1={INV.x + 40} y1={430} x2={INV.x + INV.w - 40} y2={430} stroke={colors.WARM} strokeWidth={2} strokeDasharray="2 6" opacity={0.8} />
              <text x={INV.x + INV.w / 2} y={456} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                ⚡ paid over lightning — outside nostr
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One digest, stated in two protocols
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            SHA-256(zap request) becomes the invoice's description hash
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-57 appendix B — the binding
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
