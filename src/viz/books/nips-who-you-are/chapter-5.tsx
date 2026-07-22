// Who You Are — chapter 5: proofs, not passwords (NIP-39) — and the stack.
// Grounded in NIP-39: kind-0 i tags ["i", "<platform>:<identity>", "<proof>"]
// for github/twitter/mastodon/telegram; each proof is a public post on that
// platform containing the npub, so verification is a loop: claim → proof URL
// → npub found → matches the key. Closes the book by stacking every layer
// from chapters 1–4 onto the one unchanged key.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { JsonDoc, layoutJson, shortHex } from '../../primitives';
import { PUBKEY } from './chapter-1';
import { NPUB } from './chapter-2';
import overrides from './chapter-5.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const EVENT = {
  kind: 0,
  pubkey: PUBKEY,
  tags: [
    ['i', 'github:semisol', '9721ce4ee4fceb91c9711ca2a6c9a5ab'],
    ['i', 'twitter:semisol_public', '1619358434134196225'],
    ['i', 'mastodon:bitcoinhackers.org/@semisol', '109775066355589974'],
  ],
  content: '{ …profile… }',
};

const LAYOUT = layoutJson(EVENT, {
  x: 80,
  y: 150,
  fontSize: 14,
  inlineArrayMax: 66,
  abbrev: (_p, raw) => (raw.length > 34 ? `${raw.slice(0, 12)}…` : raw),
});

const PLATFORMS = [
  { name: 'github', detail: 'a gist saying:', y: 130 },
  { name: 'twitter', detail: 'a tweet saying:', y: 300 },
  { name: 'mastodon', detail: 'a post saying:', y: 470 },
];
const CARD_X = 760;
const CARD_W = 400;

// the closing stack of layers
const LAYERS = [
  { label: 'profile — kind 0 (NIP-01, NIP-24)', color: colors.POSITIVE },
  { label: 'npub / nprofile — bech32 coats (NIP-19)', color: colors.SECONDARY },
  { label: 'bob@bob.example — a DNS name (NIP-05)', color: colors.ACCENT },
  { label: 'follows + petnames — the graph (NIP-02)', color: colors.WARM },
  { label: 'external proofs (NIP-39)', color: colors.NEGATIVE },
];

const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.3 };
const CAM_CARDS: CameraState = { x: 780, y: 330, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  cardsU: ChannelRef<number>;
  loopU: ChannelRef<number>;
  checksU: ChannelRef<number>;
  cautionU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  stackU: ChannelRef<number>;
  keyU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const cardsU = tl.channel('cardsU', 0);
  const loopU = tl.channel('loopU', 0);
  const checksU = tl.channel('checksU', 0);
  const cautionU = tl.channel('cautionU', 0);
  const dimU = tl.channel('dimU', 0);
  const stackU = tl.channel('stackU', 0);
  const keyU = tl.channel('keyU', 0);

  // Beat 1 — the last kind of claim.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One question remains: how does this key prove it is also you on the platforms that came before? nip thirty nine answers with i tags — identity claims, right inside the profile event.',
  });
  tl.tween(jsonU, 1, { at: 0.8, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the shape of a claim.
  tl.caption({
    at: 7.0,
    dur: 5.8,
    text: 'Each claim is two strings: a platform and a user name joined by a colon, and a proof — the id of a public post on that platform. A gist, a tweet, a mastodon post.',
  });
  tl.tween(cardsU, 1, { at: 7.8, dur: 2.6, ease: ease.linear });
  tl.tween(cam, CAM_CARDS, { at: 8.0, dur: 1.5, ease: ease.move });
  tl.hold(12.8, 0.7);

  // Beat 3 — the loop.
  tl.caption({
    at: 13.5,
    dur: 6.4,
    text: 'And every proof contains the same sentence: verifying that I control the following nostr public key — followed by this key’s n pub. The claim points out; the proof points straight back.',
  });
  tl.tween(loopU, 1, { at: 14.4, dur: 2.6, ease: ease.linear });
  tl.hold(19.9, 0.7);

  // Beat 4 — anyone can check.
  tl.caption({
    at: 20.6,
    dur: 5.6,
    text: 'No oracle sits in the middle. Any client can fetch the gist, read the n pub, and compare bytes. Three green checks, earned by three public posts.',
  });
  tl.tween(checksU, 1, { at: 21.6, dur: 2.0, ease: ease.linear });
  tl.hold(26.2, 0.7);

  // Beat 5 — the caution.
  tl.caption({
    at: 26.9,
    dur: 5.4,
    text: 'The proofs are as durable as the platforms hosting them. Delete the tweet and the claim goes quiet. Like the domain name, these are witnesses — not the identity itself.',
  });
  tl.tween(cautionU, 1, { at: 27.9, dur: 1.0, ease: ease.enter });
  tl.hold(32.3, 0.8);

  // Beat 6 — the stack.
  tl.caption({
    at: 33.1,
    dur: 6.6,
    text: 'Step back and count the coats. A profile it signed. An alphabet it is spoken in. A name at a domain. A graph of who it trusts. And witnesses on other networks. Five layers of claims.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 33.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 33.5, dur: 1.2, ease: ease.move });
  tl.tween(stackU, 1, { at: 34.4, dur: 3.4, ease: ease.linear });
  tl.hold(39.7, 0.7);

  // Beat 7 — the key, unmoved.
  tl.caption({
    at: 40.4,
    dur: 6.2,
    text: 'Every one of them can change, move, or die — and identity survives, because underneath them all sits the same thirty-two bytes from chapter one. On nostr, you are your key. Everything else is a coat.',
  });
  tl.tween(keyU, 1, { at: 41.6, dur: 1.2, ease: ease.pop });
  tl.hold(46.6, 1.4);

  return { tl, cam, jsonU, cardsU, loopU, checksU, cautionU, dimU, stackU, keyU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-who-you-are/chapter-5.overrides.json',
  slug: 'books/nips-who-you-are/chapter-5',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const cardsU = s.get(scene.cardsU);
  const loopU = s.get(scene.loopU);
  const checksU = s.get(scene.checksU);
  const cautionU = s.get(scene.cautionU);
  const dimU = s.get(scene.dimU);
  const stackU = s.get(scene.stackU);
  const keyU = s.get(scene.keyU);

  const mainOp = 1 - 0.88 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc layout={LAYOUT} reveal={jsonU} opacity={1 - 0.7 * clamp01(cardsU * 1.5)} focus={cardsU > 0 ? ['tags'] : undefined} focusU={cardsU > 0 ? 0.55 : 0} />

          {PLATFORMS.map((p, i) => {
            const u = clamp01(cardsU * PLATFORMS.length - i);
            if (u <= 0) return null;
            const a = LAYOUT.anchor(`tags[${i}]`);
            const lu = clamp01(loopU * PLATFORMS.length - i);
            const cu = clamp01(checksU * PLATFORMS.length - i);
            return (
              <g key={p.name}>
                <g opacity={u}>
                  <rect x={CARD_X} y={p.y} width={CARD_W} height={118} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={CARD_X + 16} y={p.y + 26} fill={colors.ACCENT} fontSize={13} fontWeight={600} fontFamily="monospace">
                    {p.name}
                  </text>
                  <text x={CARD_X + 16} y={p.y + 50} fill={colors.MUTED} fontSize={12}>
                    {p.detail}
                  </text>
                  <text x={CARD_X + 16} y={p.y + 72} fill={colors.TEXT} fontSize={11.5} fontStyle="italic">
                    “Verifying that I control the following
                  </text>
                  <text x={CARD_X + 16} y={p.y + 90} fill={colors.TEXT} fontSize={11.5} fontStyle="italic">
                    Nostr public key: <tspan fill={colors.SECONDARY} fontFamily="monospace">{`${NPUB.slice(0, 16)}…`}</tspan>”
                  </text>
                </g>
                {/* claim → proof arrow */}
                {lu > 0 && (
                  <path
                    d={`M${a.x + a.w + 8},${a.cy} Q ${(a.x + a.w + CARD_X) / 2},${a.cy - 60} ${CARD_X - 8},${p.y + 40}`}
                    fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="6 5" opacity={0.8 * lu}
                  />
                )}
                {/* proof → key arrow back */}
                {lu >= 1 && (
                  <path
                    d={`M${CARD_X + 30},${p.y + 112} Q 600,${p.y + 160} ${a.x + 60},${a.cy + 22}`}
                    fill="none" stroke={colors.SECONDARY} strokeWidth={1.4} strokeDasharray="3 5" opacity={0.6}
                  />
                )}
                {cu > 0 && (
                  <g opacity={cu}>
                    <circle cx={CARD_X + CARD_W + 26} cy={p.y + 58} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
                    <path d={`M${CARD_X + CARD_W + 19} ${p.y + 58} l5 5 l9 -11`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })}

          {cautionU > 0 && (
            <text x={CARD_X} y={620} fill={colors.WARM} fontSize={13} opacity={cautionU}>
              proofs live on other people’s platforms — witnesses, not the identity
            </text>
          )}
        </Camera>
      </g>

      {/* the closing stack — drawn screen-fixed over the dim */}
      {stackU > 0 && (
        <g>
          {LAYERS.map((l, i) => {
            const u = clamp01(stackU * LAYERS.length - i);
            if (u <= 0) return null;
            const y = 150 + i * 62;
            return (
              <g key={l.label} opacity={u} transform={`translate(0, ${(1 - u) * -12})`}>
                <rect x={330} y={y} width={620} height={48} rx={10} fill={colors.PANEL} stroke={l.color} strokeWidth={1.6} opacity={0.95} />
                <text x={640} y={y + 30} textAnchor="middle" fill={l.color} fontSize={15} fontFamily="monospace">
                  {l.label}
                </text>
              </g>
            );
          })}
          {keyU > 0 && (
            <g opacity={keyU}>
              <rect x={330} y={150 + LAYERS.length * 62 + 8} width={620} height={54} rx={10} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={2} />
              <text x={640} y={150 + LAYERS.length * 62 + 30} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="monospace" fontWeight={700}>
                {shortHex(PUBKEY, 20, 12)}
              </text>
              <text x={640} y={150 + LAYERS.length * 62 + 50} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                the key — unchanged since chapter one
              </text>
            </g>
          )}
        </g>
      )}
    </>
  );
}

export function Chapter5() {
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
