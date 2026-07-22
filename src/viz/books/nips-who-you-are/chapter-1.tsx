// Who You Are — chapter 1: the profile is an event (kind 0 + NIP-24 fields).
// Grounded in NIP-01 (kind 0 = user metadata, replaceable) and NIP-24
// (display_name/website/banner/bot active; displayName/username deprecated).
// Centerpiece: the kind-0 event's content STRING unfolds into a document of
// its own — and a newer profile replaces the whole thing, because kind zero
// is replaceable.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, shortHex } from '../../primitives';
import type { TimelineOverrides } from '../../core';
import overrides from './chapter-1.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// The pubkey used throughout the book — NIP-19's own example key.
export const PUBKEY = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';

const EVENT = {
  kind: 0,
  pubkey: PUBKEY,
  created_at: 1700000000,
  tags: [],
  content: '{ … }',
};

const PROFILE_V1 = {
  name: 'bob',
  display_name: 'Bob 🌊',
  about: 'building on nostr',
  website: 'https://bob.example',
  banner: 'https://bob.example/banner.jpg',
  bot: false,
  nip05: 'bob@bob.example',
};

const EVT_LAYOUT = layoutJson(EVENT, {
  x: 90,
  y: 150,
  fontSize: 16,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});
const PROF_X = 620;
const PROF_Y = 130;
const PROF_LAYOUT = layoutJson(PROFILE_V1, {
  x: PROF_X,
  y: PROF_Y,
  fontSize: 15,
  abbrev: (_p, raw) => (raw.length > 34 ? `${raw.slice(0, 31)}…` : raw),
});

const CONTENT_A = EVT_LAYOUT.anchor('content');
const NIP24_FIELDS = ['display_name', 'website', 'banner', 'bot'];
const DEPRECATED = [
  { name: 'displayName', use: 'display_name' },
  { name: 'username', use: 'name' },
];

const CAM_EVT: CameraState = { x: 330, y: 300, k: 1.25 };
const CAM_PROF: CameraState = { x: 700, y: 300, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  keyU: ChannelRef<number>;
  evtU: ChannelRef<number>;
  kindU: ChannelRef<number>;
  flyU: ChannelRef<number>;
  profU: ChannelRef<number>;
  nip24U: ChannelRef<number>;
  deprU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const keyU = tl.channel('keyU', 0);
  const evtU = tl.channel('evtU', 0);
  const kindU = tl.channel('kindU', 0);
  const flyU = tl.channel('flyU', 0);
  const profU = tl.channel('profU', 0);
  const nip24U = tl.channel('nip24U', 0);
  const deprU = tl.channel('deprU', 0);
  const swapU = tl.channel('swapU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the key is the identity; everything else is a coat it wears.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'On nostr, who you are is a thirty-two byte public key. Everything human about an identity — a name, a face, a bio — is just data that key has signed. This book is about those layers.',
  });
  tl.tween(keyU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — the profile event.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'The first layer is the profile. It is not a database row anywhere — it is an ordinary signed event, of kind zero, whose content field carries one string.',
  });
  tl.tween(evtU, 1, { at: 7.4, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_EVT, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.tween(kindU, 1, { at: 11.0, dur: 0.6, ease: ease.enter });
  tl.hold(13.0, 0.7);

  // Beat 3 — the content string unfolds.
  tl.caption({
    at: 13.7,
    dur: 6.2,
    text: 'That string is itself structured data. Unfold it, and the profile appears: a short name, a display name, an about line, a website. A document hiding inside a field.',
  });
  tl.tween(cam, CAM_PROF, { at: 14.0, dur: 1.5, ease: ease.move });
  tl.tween(flyU, 1, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(profU, 1, { at: 15.8, dur: 2.4, ease: ease.draw });
  tl.hold(19.9, 0.7);

  // Beat 4 — NIP-24's extra fields.
  tl.caption({
    at: 20.6,
    dur: 6.2,
    text: 'A later spec, nip twenty four, standardized the extras clients had been inventing: a richer display name, a website, a wide banner image, and a bot flag that owns up to automation.',
  });
  tl.tween(nip24U, 1, { at: 21.4, dur: 2.0, ease: ease.linear });
  tl.hold(26.8, 0.7);

  // Beat 5 — the deprecated spellings.
  tl.caption({
    at: 27.5,
    dur: 5.8,
    text: 'It also buried two spellings. Camel-case display name and username are deprecated — same idea, older coats. Interoperability is just everyone agreeing which key names mean what.',
  });
  tl.tween(deprU, 1, { at: 28.4, dur: 1.2, ease: ease.enter });
  tl.hold(33.3, 0.7);

  // Beat 6 — replaceable: the new profile replaces the old, wholesale.
  tl.caption({
    at: 34.0,
    dur: 6.4,
    text: 'And here is the mechanic that makes it a profile rather than a diary: kind zero is replaceable. Publish a new one, and every relay keeps only the newest. There is no edit — only replacement.',
  });
  tl.tween(swapU, 1, { at: 35.2, dur: 1.8, ease: ease.move });
  tl.hold(40.4, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.1,
    dur: 5.6,
    text: 'So a profile is a claim, signed by the key and replaceable at will. The key underneath never changes. Next: how that same key learns to dress for humans — as an n pub.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.5, dur: 1.0, ease: ease.enter });
  tl.hold(46.7, 1.2);

  return { tl, cam, keyU, evtU, kindU, flyU, profU, nip24U, deprU, swapU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-who-you-are/chapter-1.overrides.json',
  slug: 'books/nips-who-you-are/chapter-1',
};

function KeyChip({ u }: { u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={90} y={52} width={330} height={40} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.6} />
      <text x={106} y={70} fill={colors.MUTED} fontSize={11} fontFamily="monospace">the key — 32 bytes, forever</text>
      <text x={106} y={86} fill={colors.WARM} fontSize={13} fontFamily="monospace">{shortHex(PUBKEY, 16, 8)}</text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const keyU = s.get(scene.keyU);
  const evtU = s.get(scene.evtU);
  const kindU = s.get(scene.kindU);
  const flyU = s.get(scene.flyU);
  const profU = s.get(scene.profU);
  const nip24U = s.get(scene.nip24U);
  const deprU = s.get(scene.deprU);
  const swapU = s.get(scene.swapU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <KeyChip u={keyU} />

          <JsonDoc
            layout={EVT_LAYOUT}
            reveal={evtU}
            opacity={1 - 0.75 * clamp01(profU)}
            focus={kindU > 0 && flyU <= 0 ? ['kind'] : flyU > 0 ? ['content'] : undefined}
            focusU={flyU > 0 ? clamp01(flyU * 2) * 0.7 : kindU}
            hidden={flyU > 0 ? ['content'] : undefined}
          />

          {/* the content string unfolds into the profile document */}
          <TokenFlight
            from={{ x: CONTENT_A.cx, y: CONTENT_A.cy + 5 }}
            to={{ x: PROF_X + 40, y: PROF_Y - 24 }}
            u={flyU}
            text={'"{ … }"'}
            fill={colors.POSITIVE}
            fontSize={14}
            lift={90}
            fadeOut
          />
          {profU > 0 && (
            <g opacity={1 - 0.82 * swapU}>
              <text x={PROF_X} y={PROF_Y - 14} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={profU}>
                content, parsed — profile v1
              </text>
              <JsonDoc
                layout={PROF_LAYOUT}
                reveal={profU}
                focus={nip24U > 0 && deprU <= 0 ? NIP24_FIELDS : undefined}
                focusU={nip24U > 0 && deprU <= 0 ? Math.min(nip24U, 0.85) : 0}
              />
            </g>
          )}

          {/* deprecated spellings */}
          {deprU > 0 && swapU < 0.5 && (
            <g opacity={deprU * (1 - clamp01(swapU * 2))}>
              {DEPRECATED.map((d, i) => {
                const y = 470 + i * 34;
                return (
                  <g key={d.name}>
                    <text x={640} y={y} fill={colors.NEGATIVE} fontSize={14} fontFamily="monospace">
                      "{d.name}"
                    </text>
                    <line x1={636} y1={y - 5} x2={640 + d.name.length * 9 + 18} y2={y - 5} stroke={colors.NEGATIVE} strokeWidth={1.6} />
                    <text x={840} y={y} fill={colors.MUTED} fontSize={13}>
                      → use "{d.use}"
                    </text>
                  </g>
                );
              })}
              <text x={640} y={545} fill={colors.MUTED} fontSize={12}>
                deprecated by NIP-24
              </text>
            </g>
          )}

          {/* replaceable: v2 slides over v1 */}
          {swapU > 0 && (
            <g opacity={swapU} transform={`translate(${(1 - swapU) * 240}, 0)`}>
              <rect x={PROF_X - 20} y={PROF_Y - 40} width={430} height={300} rx={12} fill={colors.BG} opacity={0.94} />
              <rect x={PROF_X - 20} y={PROF_Y - 40} width={430} height={300} rx={12} fill={colors.PANEL} opacity={0.5} stroke={colors.ACCENT} />
              <text x={PROF_X} y={PROF_Y - 14} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
                profile v2 — replaces v1 entirely
              </text>
              <text x={PROF_X} y={PROF_Y + 22} fill={colors.ACCENT} fontSize={15} fontFamily="monospace">"name": "bob"</text>
              <text x={PROF_X} y={PROF_Y + 52} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">"display_name": "Bob ⚡"</text>
              <text x={PROF_X} y={PROF_Y + 82} fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">"about": "relay operator now"</text>
              <text x={PROF_X} y={PROF_Y + 118} fill={colors.MUTED} fontSize={12}>
                kind 0 · created_at newer → relays drop the old one
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A profile is a signed, replaceable claim
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the key underneath never changes — the coats do
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 kind 0 · NIP-24 fields
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
