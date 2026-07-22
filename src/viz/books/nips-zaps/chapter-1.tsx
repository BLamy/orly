// Nostr Implementation Possibilities №8 — Zaps, chapter 1.
// NIP-57 discovery: the lightning address on a kind-0 profile (lud16) unfolds
// into an LNURL pay endpoint; the wallet server's JSON response advertises
// `allowsNostr: true` and a `nostrPubkey` — the two fields that upgrade a
// plain lightning tip into a zap. Grounded in NIP-57 (appendices A/B): clients
// compute https://<domain>/.well-known/lnurlp/<name> from name@domain and look
// for allowsNostr/nostrPubkey in the pay-request response.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, Connection, TokenFlight, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0  ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The profile and the wallet server's pay-request response (NIP-57 shapes).
// ---------------------------------------------------------------------------
const PROFILE = {
  kind: 0,
  pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
  content: '{ "name": "derek", "lud16": "derek@wallet.example", … }',
};

const PAY_RESPONSE = {
  callback: 'https://wallet.example/lnurlp/derek/cb',
  minSendable: 1000,
  maxSendable: 100000000,
  allowsNostr: true,
  nostrPubkey: '9630f464cca6a5147aa8a35f0bcdd3ce485324e732fd39e09233b1d848238f31',
};

const PROFILE_LAYOUT = layoutJson(PROFILE, {
  x: 90,
  y: 170,
  fontSize: 15,
  abbrev: (_p, raw) => (raw.length > 40 ? `${raw.slice(0, 37)}…` : raw),
});

const RESP_LAYOUT = layoutJson(PAY_RESPONSE, {
  x: 620,
  y: 330,
  fontSize: 14,
  inlineArrayMax: 40,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw) : raw),
});

const LUD16 = 'derek@wallet.example';
const WELL_KNOWN = 'https://wallet.example/.well-known/lnurlp/derek';
const WALLET = { x: 1020, y: 190 };
const HALF_W = 84;
const URL_Y = 120;

const CAM_PROFILE: CameraState = { x: 380, y: 300, k: 1.25 };
const CAM_RESP: CameraState = { x: 760, y: 330, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  profU: ChannelRef<number>;
  ludU: ChannelRef<number>;
  urlU: ChannelRef<number>;
  walletU: ChannelRef<number>;
  getU: ChannelRef<number>;
  respU: ChannelRef<number>;
  nostrU: ChannelRef<number>;
  plainU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const profU = tl.channel('profU', 0);
  const ludU = tl.channel('ludU', 0);
  const urlU = tl.channel('urlU', 0);
  const walletU = tl.channel('walletU', 0);
  const getU = tl.channel('getU', 0);
  const respU = tl.channel('respU', 0);
  const nostrU = tl.channel('nostrU', 0);
  const plainU = tl.channel('plainU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a zap starts at a profile.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'A zap is a lightning payment that comes back to nostr as proof. And it starts in the least exotic place imaginable: a profile event, with a payment address sitting in the content.',
  });
  tl.tween(profU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PROFILE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.7);

  // Beat 2 — lud16 spotlight.
  tl.caption({
    at: 7.2,
    dur: 5.8,
    text: 'The field is called lud sixteen, and it reads like an email address: a name, an at sign, a domain. It is not an inbox. It is a recipe for a U-R-L.',
  });
  tl.tween(ludU, 1, { at: 7.6, dur: 0.8, ease: ease.enter });
  tl.hold(13.0, 0.7);

  // Beat 3 — the address unfolds into the well-known URL.
  tl.caption({
    at: 13.7,
    dur: 6.2,
    text: 'Split it at the at sign, and the two halves recombine: the domain becomes a server, the name becomes a path under well known L-N-U-R-L-P. The address was a folded-up web address all along.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 13.9, dur: 1.4, ease: ease.move });
  tl.tween(urlU, 1, { at: 14.8, dur: 1.6, ease: ease.move });
  tl.hold(19.9, 0.7);

  // Beat 4 — GET the pay endpoint.
  tl.caption({
    at: 20.6,
    dur: 6.0,
    text: 'The client calls that address — an ordinary H-T-T-P get, no nostr anywhere in sight — and the wallet server answers with a small structured menu: where to request invoices, and the minimum and maximum it will accept.',
  });
  tl.tween(walletU, 1, { at: 20.8, dur: 0.7, ease: ease.enter });
  tl.tween(getU, 1, { at: 21.6, dur: 1.6, ease: ease.linear });
  tl.tween(respU, 1, { at: 23.4, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_RESP, { at: 23.6, dur: 1.4, ease: ease.move });
  tl.hold(26.6, 0.7);

  // Beat 5 — the two magic fields.
  tl.caption({
    at: 27.3,
    dur: 6.4,
    text: 'Two fields turn this from a tip jar into a zap endpoint. Allows nostr says: I know what a zap request is, send me one. And nostr pubkey is the key this server will use to sign the receipt later. Remember it.',
  });
  tl.tween(nostrU, 1, { at: 28.0, dur: 0.8, ease: ease.enter });
  tl.hold(33.7, 0.7);

  // Beat 6 — without them, plain lightning.
  tl.caption({
    at: 34.4,
    dur: 5.6,
    text: 'If those fields are missing, everything still works — you can pay the invoice, the sats arrive. But nothing ever comes back to nostr. The payment happens; the social object does not.',
  });
  tl.tween(plainU, 1, { at: 35.2, dur: 0.9, ease: ease.enter });
  tl.hold(40.0, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.7,
    dur: 5.8,
    text: 'So discovery is settled: from a name on a profile to a wallet server that speaks nostr, and a receipt key saved for later. Next: the payment request itself — a signed event that never touches a relay.',
  });
  tl.tween(dimU, 1, { at: 41.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.1, dur: 1.0, ease: ease.enter });
  tl.hold(46.5, 1.2);

  return { tl, cam, profU, ludU, urlU, walletU, getU, respU, nostrU, plainU, dimU, closeU };
}

const scene = buildScene();

const LUD_ANCHOR = PROFILE_LAYOUT.anchor('content');

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const profU = s.get(scene.profU);
  const ludU = s.get(scene.ludU);
  const urlU = s.get(scene.urlU);
  const walletU = s.get(scene.walletU);
  const getU = s.get(scene.getU);
  const respU = s.get(scene.respU);
  const nostrU = s.get(scene.nostrU);
  const plainU = s.get(scene.plainU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={PROFILE_LAYOUT}
            reveal={profU}
            focus={ludU > 0 ? ['content'] : undefined}
            focusU={ludU * (1 - 0.6 * urlU)}
            opacity={1 - 0.95 * respU}
          />
          {ludU > 0 && (
            <g opacity={ludU * (1 - urlU)}>
              <rect x={LUD_ANCHOR.x - 6} y={LUD_ANCHOR.y - 2} width={LUD_ANCHOR.w + 12} height={LUD_ANCHOR.h + 4} rx={6} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
            </g>
          )}

          {/* lud16 → well-known URL */}
          <TokenFlight
            from={{ x: LUD_ANCHOR.cx, y: LUD_ANCHOR.cy }}
            to={{ x: 420, y: URL_Y }}
            u={urlU}
            text={LUD16}
            fill={colors.WARM}
            fontSize={14}
            lift={90}
            fadeOut
          />
          {urlU >= 0.8 && (
            <g opacity={(urlU - 0.8) / 0.2}>
              <rect x={120} y={URL_Y - 24} width={600} height={38} rx={8} fill={colors.PANEL} stroke={colors.WARM} opacity={0.9} />
              <text x={140} y={URL_Y} fill={colors.TEXT} fontSize={13.5} fontFamily="ui-monospace, Menlo, monospace">
                {WELL_KNOWN}
              </text>
            </g>
          )}

          {walletU > 0 && (
            <ServiceNode x={WALLET.x} y={WALLET.y} kind="server" label="wallet.example" sublabel="lnurl pay server" u={walletU} />
          )}
          {getU > 0 && (
            <Connection
              from={{ x: 720, y: URL_Y - 5 }}
              to={{ x: WALLET.x - HALF_W, y: WALLET.y }}
              u={Math.min(1, getU * 1.4)}
              flow={getU * 2}
              label="GET"
              color={colors.MUTED}
            />
          )}

          <JsonDoc
            layout={RESP_LAYOUT}
            reveal={respU}
            focus={nostrU > 0 ? ['allowsNostr', 'nostrPubkey'] : undefined}
            focusU={nostrU}
          />
          {respU > 0 && (
            <text x={620} y={310} fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, Menlo, monospace" opacity={respU}>
              pay-request response
            </text>
          )}
          {nostrU > 0 && (
            <text x={620} y={545} fill={colors.POSITIVE} fontSize={13} opacity={nostrU}>
              this wallet speaks nostr — receipts will be signed with nostrPubkey
            </text>
          )}
          {plainU > 0 && (
            <g opacity={plainU}>
              <text x={620} y={232} fill={colors.MUTED} fontSize={13}>
                without allowsNostr:
              </text>
              <text x={620} y={256} fill={colors.TEXT} fontSize={13}>
                sats still move — but no receipt ever returns to nostr
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            An address that folds out into an endpoint
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            lud16 → /.well-known/lnurlp/ → allowsNostr + nostrPubkey
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-57 appendix A/B — zap endpoint discovery
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
