// Sealed and Wrapped — chapter 1: the postcard problem (NIP-04, deprecated).
// A kind-4 DM's content is encrypted, but the envelope — p tag, pubkey,
// created_at — is public on every relay. An eavesdropper's card fills itself
// from tags alone, a who-talks-to-whom graph assembles from envelopes, and
// the spec's own deprecation stamp lands. Grounded in NIP-04 (AES-256-CBC,
// unhashed ECDH x-coordinate, "?iv=" suffix, "leaks metadata in the events",
// deprecated in favor of NIP-17).
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, sha256Hex, shortHex } from '../../primitives';
import overrides from './chapter-1.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The kind-4 event. Pubkeys are illustrative; the ciphertext is a stand-in
// (derived from a real hash so it is deterministic) in NIP-04's actual
// "<base64>?iv=<base64>" shape.
// ---------------------------------------------------------------------------
export const ALICE = '82f1a9c3e5b7d901f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9';
export const BOB = '6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e4c8a2e6f0b3d7a1c5e9f2b6d0a4c8e2f';

const toB64 = (hex: string) =>
  // browser-safe: map hex pairs to a base64-looking alphabet deterministically
  hex.match(/.{2}/g)!.map((h) => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[parseInt(h, 16) % 64]).join('');

const CIPHER = toB64(sha256Hex('nip04 demo ciphertext')).slice(0, 22);
const IV = toB64(sha256Hex('nip04 demo iv')).slice(0, 8);

export const DM_EVENT = {
  kind: 4,
  pubkey: ALICE,
  created_at: 1700003340,
  tags: [['p', BOB]],
  content: `${CIPHER}?iv=${IV}`,
  sig: 'aa91…',
};

const LAYOUT = layoutJson(DM_EVENT, {
  x: 90,
  y: 150,
  fontSize: 15,
  abbrev: (_p, raw) => (raw.length > 30 && !raw.includes('?iv=') ? shortHex(raw) : raw),
});

// eavesdropper card rows: which JSON path feeds which claim
const CARD = { x: 830, y: 150, w: 360 };
const ROWS = [
  { path: 'pubkey', label: 'from', value: shortHex(ALICE, 6, 2) },
  { path: 'tags[0][1]', label: 'to', value: shortHex(BOB, 6, 2) },
  { path: 'created_at', label: 'when', value: '22:29, a tuesday' },
];

// who-talks-to-whom graph, assembled from envelopes alone
const GRAPH = { ax: 880, ay: 420, bx: 1110, by: 420 };
const EXTRA = [
  { x: 960, y: 530 },
  { x: 1040, y: 350 },
];

const CAM_JSON: CameraState = { x: 350, y: 320, k: 1.25 };
const CAM_CARD: CameraState = { x: 830, y: 340, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  encU: ChannelRef<number>;
  lensU: ChannelRef<number>;
  metaU: ChannelRef<number>;
  graphU: ChannelRef<number>;
  stampU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const encU = tl.channel('encU', 0);
  const lensU = tl.channel('lensU', 0);
  const metaU = tl.channel('metaU', 0);
  const graphU = tl.channel('graphU', 0);
  const stampU = tl.channel('stampU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the promise.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Nostr’s first attempt at private messages was called kind four. Here is one. The message text is encrypted, and at first glance, that looks like privacy.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the dated cipher.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'The cipher itself is dated: A E S in C B C mode, keyed by a raw, unhashed shared point. You can even see the initialization vector bolted onto the text after a question mark.',
  });
  tl.tween(encU, 1, { at: 7.6, dur: 1.0, ease: ease.enter });
  tl.hold(13.4, 0.7);

  // Beat 3 — what is NOT encrypted.
  tl.caption({
    at: 14.1,
    dur: 6.2,
    text: 'But look at what is not encrypted. The envelope still says who wrote it, who it is for, and exactly when it was sent — in public, on every relay that stores it.',
  });
  tl.tween(encU, 0, { at: 14.3, dur: 0.8, ease: ease.move });
  tl.tween(lensU, 1, { at: 15.0, dur: 3.6, ease: ease.linear });
  tl.hold(20.5, 0.7);

  // Beat 4 — the eavesdropper's card.
  tl.caption({
    at: 21.2,
    dur: 6.0,
    text: 'An eavesdropper never needs to break the cipher. They read the outside of the envelope, and the letter keeps its secret while the mailing list gives everything away.',
  });
  tl.tween(cam, CAM_CARD, { at: 21.4, dur: 1.5, ease: ease.move });
  tl.tween(metaU, 1, { at: 22.2, dur: 2.6, ease: ease.linear });
  tl.hold(27.4, 0.7);

  // Beat 5 — the graph assembles.
  tl.caption({
    at: 28.1,
    dur: 6.4,
    text: 'Collect enough envelopes and the social graph assembles itself: who talks to whom, how often, at what hour of the night. Metadata is the story of your life, told without a single decrypted word.',
  });
  tl.tween(graphU, 1, { at: 28.9, dur: 3.0, ease: ease.linear });
  tl.hold(34.7, 0.7);

  // Beat 6 — the deprecation stamp.
  tl.caption({
    at: 35.4,
    dur: 6.0,
    text: 'The specification now carries its own warning label. In its exact words: this standard leaks metadata in the events. It is deprecated in favor of nip seventeen.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 35.6, dur: 1.4, ease: ease.move });
  tl.tween(stampU, 1, { at: 36.8, dur: 0.6, ease: ease.pop });
  tl.hold(41.6, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 42.3,
    dur: 5.8,
    text: 'So here is this book’s problem statement: encrypting the letter is the easy part. Hiding the envelope is the real work — and the next four chapters build exactly that, one layer at a time.',
  });
  tl.tween(dimU, 1, { at: 42.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.7, dur: 1.0, ease: ease.enter });
  tl.hold(48.3, 1.2);

  return { tl, cam, jsonU, encU, lensU, metaU, graphU, stampU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-sealed-and-wrapped/chapter-1.overrides.json',
  slug: 'books/nips-sealed-and-wrapped/chapter-1',
};

const LENS_PATHS = ['pubkey', 'tags[0][1]', 'created_at'];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const encU = s.get(scene.encU);
  const lensU = s.get(scene.lensU);
  const metaU = s.get(scene.metaU);
  const graphU = s.get(scene.graphU);
  const stampU = s.get(scene.stampU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  let focus: string[] | undefined;
  let focusU = 0;
  if (encU > 0) {
    focus = ['content'];
    focusU = encU;
  } else if (lensU > 0 && metaU <= 0) {
    const li = Math.min(Math.floor(lensU * LENS_PATHS.length), LENS_PATHS.length - 1);
    focus = LENS_PATHS.slice(0, li + 1);
    focusU = clamp01(lensU * 4);
  } else if (metaU > 0) {
    focus = LENS_PATHS;
    focusU = 0.85;
  }

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the doc recedes once its values live on the card and the graph takes over */}
          <JsonDoc layout={LAYOUT} reveal={jsonU} focus={focus} focusU={focusU} opacity={1 - 0.8 * clamp01(graphU * 2)} />

          {/* "?iv=" callout while the cipher beat is on */}
          {encU > 0 && (
            <g opacity={encU}>
              <text x={90} y={430} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                AES-256-CBC · key = unhashed ECDH x · "?iv=" appended in the clear
              </text>
            </g>
          )}

          {/* eavesdropper card */}
          {metaU > 0 && (
            <g>
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={64 + ROWS.length * 40} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} opacity={Math.min(1, metaU * 3)} />
              <text x={CARD.x + 20} y={CARD.y + 32} fill={colors.NEGATIVE} fontSize={15} fontWeight={600} opacity={Math.min(1, metaU * 3)}>
                eavesdropper’s notebook
              </text>
              <text x={CARD.x + 20} y={CARD.y + 52} fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={Math.min(1, metaU * 3)}>
                cipher: unbroken · notebook: full
              </text>
              {ROWS.map((r, i) => {
                const u = clamp01(metaU * ROWS.length - i);
                if (u <= 0) return null;
                const a = LAYOUT.anchor(r.path);
                const ty = CARD.y + 84 + i * 40;
                return (
                  <g key={r.path}>
                    <TokenFlight
                      from={{ x: a.cx, y: a.cy + 5 }}
                      to={{ x: CARD.x + 220, y: ty }}
                      u={u}
                      text={r.value}
                      fill={colors.TEXT}
                      fontSize={13}
                      lift={60}
                    />
                    <text x={CARD.x + 20} y={ty} fill={colors.MUTED} fontSize={13} opacity={u}>
                      {r.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the metadata graph */}
          {graphU > 0 && (
            <g>
              {[{ x: GRAPH.ax, y: GRAPH.ay, l: shortHex(ALICE, 4, 0) }, { x: GRAPH.bx, y: GRAPH.by, l: shortHex(BOB, 4, 0) }, ...EXTRA.map((e, i) => ({ ...e, l: `…${i + 1}` }))].map((n, i) => {
                const u = clamp01(graphU * 4 - i);
                if (u <= 0) return null;
                return (
                  <g key={i} opacity={u}>
                    <circle cx={n.x} cy={n.y} r={16} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                      {n.l}
                    </text>
                  </g>
                );
              })}
              {[[GRAPH.ax, GRAPH.ay, GRAPH.bx, GRAPH.by], [GRAPH.ax, GRAPH.ay, EXTRA[0].x, EXTRA[0].y], [GRAPH.bx, GRAPH.by, EXTRA[1].x, EXTRA[1].y], [EXTRA[0].x, EXTRA[0].y, GRAPH.bx, GRAPH.by]].map(([x1, y1, x2, y2], i) => {
                const u = clamp01(graphU * 4 - i - 0.5);
                if (u <= 0) return null;
                return (
                  <line key={i} x1={x1} y1={y1} x2={x1 + (x2 - x1) * u} y2={y1 + (y2 - y1) * u} stroke={colors.NEGATIVE} strokeWidth={1.5} opacity={0.6} />
                );
              })}
              <text x={GRAPH.ax - 20} y={575} fill={colors.NEGATIVE} fontSize={12} opacity={clamp01(graphU * 2 - 1)}>
                the social graph, from envelopes alone
              </text>
            </g>
          )}

          {/* deprecation stamp */}
          {stampU > 0 && (
            <g opacity={stampU} transform={`rotate(-9, 350, 320)`}>
              <rect x={160} y={288} width={380} height={62} rx={8} fill="none" stroke={colors.NEGATIVE} strokeWidth={3.5} />
              <text x={350} y={322} textAnchor="middle" fill={colors.NEGATIVE} fontSize={22} fontWeight={700} letterSpacing={2}>
                DEPRECATED — kind 4
              </text>
              <text x={350} y={342} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace">
                "leaks metadata in the events" → NIP-17
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The letter was never the leak
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            encrypting content is easy — hiding the envelope takes four more chapters
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-04 · kind 4 · AES-256-CBC · deprecated in favor of NIP-17
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter1() {
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
