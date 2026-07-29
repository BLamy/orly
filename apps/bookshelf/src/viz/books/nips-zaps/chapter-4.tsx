// Nostr Implementation Possibilities №8 — Zaps, chapter 4.
// The kind-9735 zap receipt: after payment, the wallet server (not the
// sender) publishes the receipt to exactly the relays the zap request asked
// for. Its description tag carries the entire zap request; clients validate
// with three checks — signer pubkey == the lnurl server's nostrPubkey,
// invoice amount == requested amount, embedded request intact. Grounded in
// NIP-57 appendices D/E/F.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, Connection, TokenFlight, layoutJson, sha256Hex, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The receipt (NIP-57 appendix E shape). The embedded description is the
// chapter-2/3 zap request verbatim; its digest is re-computed here for real.
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
const DESC_HASH = sha256Hex(JSON.stringify(ZAP_REQUEST));

const NOSTR_PUBKEY = '9630f464cca6a5147aa8a35f0bcdd3ce485324e732fd39e09233b1d848238f31';

const RECEIPT = {
  kind: 9735,
  pubkey: NOSTR_PUBKEY,
  created_at: 1700003641,
  tags: [
    ['p', '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2'],
    ['P', 'b1a6f4e29c8d0a3f5e7b9d1c3a5f7e9b1d3c5a7f9e1b3d5c7a9f1e3b5d7c9a1f'],
    ['e', '9ae37aa68f48645127299e9453eb5d908a0cbb6058ff340d528ed4d37c8994fb'],
    ['bolt11', 'lnbc210n1p…'],
    ['description', '{"kind":9734,…}'],
  ],
  content: '',
};

const LAYOUT = layoutJson(RECEIPT, {
  x: 80,
  y: 110,
  fontSize: 13.5,
  inlineArrayMax: 44,
  abbrev: (_p, raw) => (raw.length > 24 ? shortHex(raw, 6, 2) : raw),
});

const WALLET = { x: 250, y: 560 };
const RELAY_A = { x: 1010, y: 140 };
const RELAY_B = { x: 1010, y: 300 };
const HALF_W = 84;

const CHECKS = [
  { label: 'receipt signed by the endpoint\'s nostrPubkey', detail: `pubkey == ${shortHex(NOSTR_PUBKEY, 6, 2)}` },
  { label: 'invoice amount equals the requested amount', detail: 'bolt11: 21000 msat == amount tag' },
  { label: 'the embedded request is intact', detail: `SHA-256(description) == ${shortHex(DESC_HASH, 6, 4)}` },
];

const CAM_JSON: CameraState = { x: 400, y: 290, k: 1.2 };
const CAM_CHECKS: CameraState = { x: 800, y: 420, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  walletU: ChannelRef<number>;
  jsonU: ChannelRef<number>;
  pubU: ChannelRef<number>;
  descU: ChannelRef<number>;
  relaysU: ChannelRef<number>;
  fanU: ChannelRef<number>;
  checkU: ChannelRef<number>;
  tallyU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const walletU = tl.channel('walletU', 0);
  const jsonU = tl.channel('jsonU', 0);
  const pubU = tl.channel('pubU', 0);
  const descU = tl.channel('descU', 0);
  const relaysU = tl.channel('relaysU', 0);
  const fanU = tl.channel('fanU', 0);
  const checkU = tl.channel('checkU', 0);
  const tallyU = tl.channel('tallyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the payment lands; the server speaks.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The invoice settles, and now — for the first time in this whole story — something gets published to nostr. And notice who publishes it: not the sender. The wallet server does.',
  });
  tl.tween(walletU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(jsonU, 1, { at: 1.6, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.9, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — read the receipt.
  tl.caption({
    at: 7.0,
    dur: 6.6,
    text: 'Kind nine seven three five, the zap receipt, signed with the same key the endpoint advertised back in chapter one. Lowercase p: who got paid. Capital P: who sent it. E: the note that was zapped.',
  });
  tl.tween(pubU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(pubU, 0, { at: 12.6, dur: 0.6, ease: ease.move });
  tl.hold(13.6, 0.6);

  // Beat 3 — the request rides inside.
  tl.caption({
    at: 14.2,
    dur: 6.0,
    text: 'And in the description tag: the entire zap request from chapter two, embedded verbatim. The receipt does not summarize the request — it carries it, so anyone can re-hash it against the invoice.',
  });
  tl.tween(descU, 1, { at: 14.6, dur: 0.8, ease: ease.enter });
  tl.tween(descU, 0, { at: 19.4, dur: 0.6, ease: ease.move });
  tl.hold(20.2, 0.6);

  // Beat 4 — fan out to the requested relays.
  tl.caption({
    at: 20.8,
    dur: 5.8,
    text: 'Where does it go? Exactly where the zap request asked: the two relays from its relays tag. The sender chose the audience for a receipt someone else would sign — that was the point of the tag.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 21.0, dur: 1.4, ease: ease.move });
  tl.tween(relaysU, 1, { at: 21.6, dur: 0.9, ease: ease.enter });
  tl.tween(fanU, 1, { at: 22.6, dur: 2.0, ease: ease.linear });
  tl.hold(26.6, 0.7);

  // Beat 5 — trust, but verify.
  tl.caption({
    at: 27.3,
    dur: 6.6,
    text: 'A receipt is a claim, so clients check three things: the signer is the endpoint\'s advertised key, the invoice amount matches the requested amount, and the embedded request still hashes to the invoice\'s description hash.',
  });
  tl.tween(cam, CAM_CHECKS, { at: 27.5, dur: 1.4, ease: ease.move });
  tl.tween(checkU, 1, { at: 28.2, dur: 3.2, ease: ease.linear });
  tl.hold(33.9, 0.7);

  // Beat 6 — the zap appears.
  tl.caption({
    at: 34.6,
    dur: 5.6,
    text: 'All three pass, and the note under discussion gains a small yellow number. Twenty one sats. Behind that number: a signed request, a bound invoice, and a verifiable receipt.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 34.8, dur: 1.4, ease: ease.move });
  tl.tween(tallyU, 1, { at: 35.8, dur: 0.8, ease: ease.pop });
  tl.hold(40.2, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.9,
    dur: 5.6,
    text: 'That is a complete zap: request, invoice, payment, receipt — one round trip through two networks, ending as an ordinary event any client can count. One piece remains: the wallet that paid. It can live on nostr too.',
  });
  tl.tween(dimU, 1, { at: 41.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.3, dur: 1.0, ease: ease.enter });
  tl.hold(46.5, 1.2);

  return { tl, cam, walletU, jsonU, pubU, descU, relaysU, fanU, checkU, tallyU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const walletU = s.get(scene.walletU);
  const jsonU = s.get(scene.jsonU);
  const pubU = s.get(scene.pubU);
  const descU = s.get(scene.descU);
  const relaysU = s.get(scene.relaysU);
  const fanU = s.get(scene.fanU);
  const checkU = s.get(scene.checkU);
  const tallyU = s.get(scene.tallyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  let focus: string[] | undefined;
  let focusU = 0;
  if (pubU > 0) {
    focus = ['pubkey', 'tags[0]', 'tags[1]', 'tags[2]'];
    focusU = pubU;
  } else if (descU > 0) {
    focus = ['tags[4]'];
    focusU = descU;
  }

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {walletU > 0 && (
            <ServiceNode x={WALLET.x} y={WALLET.y} kind="server" label="wallet.example" sublabel="signs the receipt" u={walletU} />
          )}
          <JsonDoc layout={LAYOUT} reveal={jsonU} focus={focus} focusU={focusU} />

          {relaysU > 0 && (
            <g opacity={relaysU}>
              <ServiceNode x={RELAY_A.x} y={RELAY_A.y} kind="server" label="relay.damus.io" sublabel="from the relays tag" u={relaysU} />
              <ServiceNode x={RELAY_B.x} y={RELAY_B.y} kind="server" label="nos.lol" sublabel="from the relays tag" u={relaysU} />
            </g>
          )}
          {fanU > 0 && (
            <>
              <Connection from={{ x: 560, y: 200 }} to={{ x: RELAY_A.x - HALF_W, y: RELAY_A.y }} u={Math.min(1, fanU * 1.6)} flow={fanU * 2} label="EVENT 9735" color={colors.POSITIVE} />
              <Connection from={{ x: 560, y: 260 }} to={{ x: RELAY_B.x - HALF_W, y: RELAY_B.y }} u={Math.min(1, fanU * 1.6 - 0.3)} flow={fanU * 2} label="EVENT 9735" color={colors.POSITIVE} />
            </>
          )}

          {/* validation checklist */}
          {checkU > 0 && (
            <g>
              <text x={620} y={396} fill={colors.MUTED} fontSize={12.5} opacity={Math.min(1, checkU * 3)}>
                client-side validation (appendix F)
              </text>
              {CHECKS.map((c, i) => {
                const u = clamp01(checkU * CHECKS.length - i);
                if (u <= 0) return null;
                const y = 424 + i * 52;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={634} cy={y} r={10} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                    <path d={`M628 ${y} l4 4 l8 -9`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} strokeLinecap="round" opacity={u >= 1 ? 1 : 0} />
                    <text x={656} y={y - 2} fill={colors.TEXT} fontSize={13.5}>{c.label}</text>
                    <text x={656} y={y + 17} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">{c.detail}</text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the zapped note gains its tally */}
          {tallyU > 0 && (
            <g opacity={tallyU}>
              <rect x={520} y={96} width={300} height={64} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={540} y={122} fill={colors.TEXT} fontSize={13}>the zapped note</text>
              <text x={540} y={144} fill={colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
                {shortHex('9ae37aa68f48645127299e9453eb5d908a0cbb6058ff340d528ed4d37c8994fb', 8, 4)}
              </text>
              <text x={760} y={134} fill={colors.WARM} fontSize={16} fontWeight={700}>⚡ 21</text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The receipt is signed by the wallet, aimed by the sender
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            kind 9735 · three checks: signer key, amount, intact request
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-57 appendices D–F — the zap receipt
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
