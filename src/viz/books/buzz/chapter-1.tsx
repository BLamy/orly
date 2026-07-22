// Buzz — chapter 1: a message is an event.
// A Buzz chat bubble flips into its true wire form: a kind-9 NIP-01 event
// (KIND_STREAM_MESSAGE = 9, crates/buzz-core/src/kind.rs) carrying an
// ["h", <channel-uuid>] tag (buzz-sdk/src/builders.rs). The id is EARNED on
// screen: the NIP-01 serialization [0, pubkey, created_at, kind, tags,
// content] is hashed with a REAL SHA-256 (BitField), and the digest flies
// into the empty id slot; a Schnorr signature seals it.
// Pubkey/sig hex are illustrative placeholders; the id is genuinely computed.
import {
  CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  BitField, JsonDoc, TokenFlight, hexToBits, layoutJson, sha256Hex, shortHex,
} from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The event — a Buzz stream message, per buzz-sdk builders.
// ---------------------------------------------------------------------------
const PUBKEY = '9c41e7b208aa3f5dd1c8be22f0e97ad3164c05e8b97a2f4de3908b16fa74c2d1';
const CHANNEL = '7b1e4c0a-2d5f-4e8b-9c3a-6f0d2e8b4a1c';
const MENTION = '4c8a2e6f0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e';
const CREATED_AT = 1753142400;
const KIND = 9; // KIND_STREAM_MESSAGE
const TAGS = [
  ['h', CHANNEL],
  ['p', MENTION],
];
const CONTENT = 'gm team — standup in 5';

const SERIAL = JSON.stringify([0, PUBKEY, CREATED_AT, KIND, TAGS, CONTENT]);
const ID = sha256Hex(SERIAL);
const ID_BITS = hexToBits(ID);

const EVENT = {
  id: ID,
  pubkey: PUBKEY,
  created_at: CREATED_AT,
  kind: KIND,
  tags: TAGS,
  content: CONTENT,
  sig: 'a1f3…(64-byte schnorr)',
};

const LAYOUT = layoutJson(EVENT, {
  x: 90,
  y: 128,
  fontSize: 15,
  inlineArrayMax: 52,
  abbrev: (_p, raw) =>
    raw.length > 40 ? shortHex(raw, 8, 4) : raw.length > 30 ? `${raw.slice(0, 13)}…` : raw,
});
const ID_ANCHOR = LAYOUT.anchor('id');

// chat bubble (the "before" form)
const BUBBLE = { x: 360, y: 250, w: 470, h: 120 };

// serialization strip
const STRIP_Y = 486;
const STRIP_X = 96;
const STRIP_CELLS = [
  { label: '0', path: '', w: 34 },
  { label: shortHex(PUBKEY, 6, 2), path: 'pubkey', w: 112 },
  { label: String(CREATED_AT), path: 'created_at', w: 112 },
  { label: '9', path: 'kind', w: 34 },
  { label: 'tags', path: 'tags', w: 64 },
  { label: '"gm team…"', path: 'content', w: 108 },
];
const CELL_X: number[] = [];
{
  let x = STRIP_X;
  for (const c of STRIP_CELLS) {
    CELL_X.push(x);
    x += c.w + 10;
  }
}

const GRID = { x: 856, y: 150, cell: 15, gap: 3 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;
const DIGEST_LABEL = { x: GRID.x + GRID_W / 2, y: GRID.y + GRID_W + 32 };

const FIELDS = ['id', 'pubkey', 'created_at', 'kind', 'tags', 'content', 'sig'];

const CAM_BUBBLE: CameraState = { x: BUBBLE.x + BUBBLE.w / 2, y: BUBBLE.y + 90, k: 1.35 };
const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.25 };
const CAM_GRID: CameraState = { x: 830, y: 330, k: 1.18 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bubbleU = tl.channel('bubbleU', 0);
  const flipU = tl.channel('flipU', 0);
  const jsonU = tl.channel('jsonU', 0);
  const sweepF = tl.channel('sweepF', -1);
  const sweepU = tl.channel('sweepU', 0);
  const hU = tl.channel('hU', 0);
  const stripU = tl.channel('stripU', 0);
  const serU = tl.channel('serU', 0);
  const gridU = tl.channel('gridU', 0);
  const settleU = tl.channel('settleU', 0);
  const idFlyU = tl.channel('idFlyU', 0);
  const sigU = tl.channel('sigU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the familiar surface.
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'This is Buzz: channels, threads, a message on its way to the team. It looks like every chat app you have ever used. The interesting part is what that message actually is.',
  });
  tl.tween(bubbleU, 1, { at: 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BUBBLE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(5.9, 0.7);

  // Beat 2 — the flip.
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Underneath, there is no proprietary format at all. The bubble is a nostr event — one small structured object, defined by the very first nostr specification. Watch it flip over.',
  });
  tl.tween(cam, CAM_JSON, { at: 7.0, dur: 1.5, ease: ease.move });
  tl.tween(flipU, 1, { at: 7.4, dur: 1.0, ease: ease.move });
  tl.tween(jsonU, 1, { at: 8.0, dur: 2.2, ease: ease.draw });
  tl.hold(12.4, 0.7);

  // Beat 3 — sweep the seven fields.
  tl.caption({
    at: 13.1,
    dur: 6.4,
    text: 'Seven fields: an id, the author’s public key, a timestamp, a kind number, tags, the message text, and a signature. Kind nine is Buzz’s stream message — the constant is right in the kind registry.',
  });
  tl.tween(sweepU, 1, { at: 13.3, dur: 0.5, ease: ease.enter });
  tl.set(sweepF, 0, 13.5);
  tl.tween(sweepF, FIELDS.length - 1, { at: 13.7, dur: 4.8, ease: ease.linear });
  tl.tween(sweepU, 0, { at: 18.9, dur: 0.6, ease: ease.move });
  tl.hold(19.7, 0.7);

  // Beat 4 — the h tag is the channel.
  tl.caption({
    at: 20.4,
    dur: 6.0,
    text: 'The h tag is how a message knows its channel: the builder in the Buzz client library stamps every stream message with the channel’s identifier. A p tag mentions a person. Routing is just tags.',
  });
  tl.tween(hU, 1, { at: 20.8, dur: 0.6, ease: ease.enter });
  tl.tween(hU, 0, { at: 25.4, dur: 0.6, ease: ease.move });
  tl.hold(26.4, 0.7);

  // Beat 5 — the serialization.
  tl.caption({
    at: 27.1,
    dur: 6.4,
    text: 'Now the id — notice its slot is still empty, because an id must be earned. The spec lines up exactly six things: a literal zero, then pubkey, timestamp, kind, tags, and content, serialized without a single space.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 27.3, dur: 1.4, ease: ease.move });
  tl.tween(stripU, 1, { at: 28.3, dur: 0.8, ease: ease.enter });
  tl.tween(serU, 1, { at: 29.1, dur: 3.2, ease: ease.linear });
  tl.hold(33.5, 0.7);

  // Beat 6 — the hash.
  tl.caption({
    at: 34.2,
    dur: 6.2,
    text: 'That byte string goes through the sha hash, and two hundred fifty-six bits settle into place. These are the real bits of this exact message’s digest — change one letter of the text and nearly half of them flip.',
  });
  tl.tween(cam, CAM_GRID, { at: 34.4, dur: 1.4, ease: ease.move });
  tl.tween(gridU, 1, { at: 34.8, dur: 1.4, ease: ease.draw });
  tl.tween(settleU, 1, { at: 35.8, dur: 3.0, ease: ease.linear });
  tl.hold(40.4, 0.7);

  // Beat 7 — the digest becomes the id.
  tl.caption({
    at: 41.1,
    dur: 5.6,
    text: 'And that digest is the id. It flies home into the empty slot — a fingerprint of exactly who said exactly what, exactly when, in exactly which channel.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.tween(idFlyU, 1, { at: 42.3, dur: 1.5, ease: ease.move });
  tl.hold(46.7, 0.7);

  // Beat 8 — the signature.
  tl.caption({
    at: 47.4,
    dur: 6.0,
    text: 'Finally the sender’s key signs that id — a Schnorr signature over secp256k1. The relay will verify both the hash and the signature before it stores a single byte. No account required: the keypair is the identity.',
  });
  tl.tween(sigU, 1, { at: 48.4, dur: 1.0, ease: ease.enter });
  tl.hold(53.4, 0.7);

  // Beat 9 — close.
  tl.caption({
    at: 54.1,
    dur: 5.6,
    text: 'So a Buzz message is not a row in some private schema. It is a portable, self-proving object. The next chapter follows it through the relay’s front door.',
  });
  tl.tween(dimU, 1, { at: 54.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 55.5, dur: 1.0, ease: ease.enter });
  tl.hold(59.7, 1.2);

  return {
    tl, cam, bubbleU, flipU, jsonU, sweepF, sweepU, hU,
    stripU, serU, gridU, settleU, idFlyU, sigU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bubbleU = s.get(scene.bubbleU);
  const flipU = s.get(scene.flipU);
  const jsonU = s.get(scene.jsonU);
  const sweepU = s.get(scene.sweepU);
  const sweepF = Math.round(s.get(scene.sweepF));
  const hU = s.get(scene.hU);
  const stripU = s.get(scene.stripU);
  const serU = s.get(scene.serU);
  const gridU = s.get(scene.gridU);
  const settleU = s.get(scene.settleU);
  const idFlyU = s.get(scene.idFlyU);
  const sigU = s.get(scene.sigU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const idLanded = idFlyU >= 1;
  const bubbleOp = bubbleU * (1 - flipU);

  let focus: string[] | undefined;
  let focusU = 0;
  if (sweepU > 0 && sweepF >= 0) {
    focus = [FIELDS[Math.min(sweepF, FIELDS.length - 1)]];
    focusU = sweepU;
  } else if (hU > 0) {
    focus = ['tags'];
    focusU = hU;
  } else if (sigU > 0 && closeU <= 0) {
    focus = ['sig', 'id'];
    focusU = Math.min(sigU, 0.8);
  }

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the Buzz bubble */}
          {bubbleOp > 0 && (
            <g opacity={bubbleOp}>
              <text x={BUBBLE.x} y={BUBBLE.y - 16} fill={colors.MUTED} fontSize={14} fontWeight={600}>
                # general
              </text>
              <rect x={BUBBLE.x} y={BUBBLE.y} width={BUBBLE.w} height={BUBBLE.h} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
              <circle cx={BUBBLE.x + 36} cy={BUBBLE.y + 38} r={16} fill={colors.WARM} opacity={0.85} />
              <text x={BUBBLE.x + 36} y={BUBBLE.y + 43} textAnchor="middle" fill={colors.BG} fontSize={13} fontWeight={700}>
                m
              </text>
              <text x={BUBBLE.x + 64} y={BUBBLE.y + 34} fill={colors.TEXT} fontSize={14} fontWeight={600}>
                maya
              </text>
              <text x={BUBBLE.x + 112} y={BUBBLE.y + 34} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                09:41
              </text>
              <text x={BUBBLE.x + 64} y={BUBBLE.y + 62} fill={colors.TEXT} fontSize={15}>
                gm team — standup in 5
              </text>
              <text x={BUBBLE.x + 64} y={BUBBLE.y + 96} fill={colors.MUTED} fontSize={12}>
                💬 2 replies · @sam
              </text>
            </g>
          )}

          {/* the JSON true form */}
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={focus}
            focusU={focusU}
            hidden={idLanded ? undefined : ['id']}
          />
          {hU > 0 && (
            <g opacity={hU}>
              <text x={560} y={300} fill={colors.ACCENT} fontSize={13}>
                h → the channel (a workspace UUID)
              </text>
              <text x={560} y={326} fill={colors.POSITIVE} fontSize={13}>
                p → a person, mentioned
              </text>
            </g>
          )}

          {/* serialization strip */}
          {stripU > 0 && (
            <g opacity={stripU}>
              <text x={STRIP_X} y={STRIP_Y - 16} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                serialize: [0, pubkey, created_at, kind, tags, content] — no whitespace
              </text>
              <text x={CELL_X[0] - 14} y={STRIP_Y + 26} fill={colors.MUTED} fontSize={16} fontFamily="monospace">[</text>
              <text x={CELL_X[5] + STRIP_CELLS[5].w + 6} y={STRIP_Y + 26} fill={colors.MUTED} fontSize={16} fontFamily="monospace">]</text>
              {STRIP_CELLS.map((c, i) => {
                const u = clamp01(serU * STRIP_CELLS.length - i);
                const a = c.path ? LAYOUT.anchor(c.path) : null;
                return (
                  <g key={i}>
                    <rect
                      x={CELL_X[i]} y={STRIP_Y} width={c.w} height={38} rx={7}
                      fill={colors.PANEL} stroke={u >= 1 ? colors.ACCENT : colors.GRID}
                      opacity={0.4 + 0.6 * u}
                    />
                    {a ? (
                      <TokenFlight
                        from={{ x: a.cx, y: a.cy + 5 }}
                        to={{ x: CELL_X[i] + c.w / 2, y: STRIP_Y + 24 }}
                        u={u}
                        text={c.label}
                        fill={colors.TEXT}
                        fontSize={12}
                        lift={40}
                      />
                    ) : (
                      u > 0 && (
                        <text x={CELL_X[i] + c.w / 2} y={STRIP_Y + 24} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="monospace" opacity={u}>
                          0
                        </text>
                      )
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the digest */}
          {gridU > 0 && (
            <g>
              <text x={GRID.x} y={GRID.y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={gridU}>
                SHA-256(serialization) — real bits
              </text>
              <BitField
                bits={ID_BITS}
                x={GRID.x} y={GRID.y} cell={GRID.cell} gap={GRID.gap}
                reveal={gridU} settle={settleU} seed={9}
              />
              {settleU >= 1 && idFlyU < 1 && (
                <text x={DIGEST_LABEL.x} y={DIGEST_LABEL.y} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                  {shortHex(ID, 12, 8)}
                </text>
              )}
            </g>
          )}

          <TokenFlight
            from={{ x: DIGEST_LABEL.x, y: DIGEST_LABEL.y }}
            to={{ x: ID_ANCHOR.cx, y: ID_ANCHOR.cy + 5 }}
            u={idFlyU}
            text={shortHex(ID)}
            fill={colors.ACCENT}
            fontSize={13}
            lift={120}
            holdAtEnd={false}
          />

          {sigU > 0 && (
            <g opacity={sigU}>
              <MathLabel tex={'\\text{sig} = \\text{schnorr}_{d}(\\text{id})'} x={620} y={560} />
              <circle cx={560} cy={556} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <path d="M553 556 l5 5 l9 -10" fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A chat bubble is a signed, portable object
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            kind 9 stream message · the h tag names the channel · the id proves the content
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 · KIND_STREAM_MESSAGE = 9 · buzz-sdk builders
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
