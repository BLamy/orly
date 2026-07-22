// Who You Are — chapter 4: who you listen to (NIP-02).
// Grounded in NIP-02: kind 3, p tags ["p", <hex key>, <relay url>, <petname>],
// content unused; every new list REPLACES the old (so it must be complete);
// uses: backup/recovery on a new device, discovery, petname chains
// ("frank.david.erin"), relay sharing per contact.
// Centerpiece: p tags fly out of the JSON and become a follow graph around
// "you"; a whole-list version swap demonstrates replaceability; a petname
// path assembles hop by hop.
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { JsonDoc, TokenFlight, layoutJson, shortHex } from '../../primitives';
import { PUBKEY } from './chapter-1';
import overrides from './chapter-4.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const FOLLOWS = [
  { key: '91cf9b32f9dc1eaa5e9df02e29f7a1b6c3d4e5f60718293a4b5c6d7e8f901234', relay: 'wss://alicerelay.com', pet: 'alice' },
  { key: '14aeb8dad4dc1eaa5e9df02e29f7a1b6c3d4e5f60718293a4b5c6d7e8f905678', relay: 'wss://nostr.mom', pet: 'erin' },
  { key: '612aee61e5dc1eaa5e9df02e29f7a1b6c3d4e5f60718293a4b5c6d7e8f909abc', relay: 'wss://no.str.cr', pet: 'david' },
];

const EVENT = {
  kind: 3,
  pubkey: PUBKEY,
  tags: FOLLOWS.map((f) => ['p', f.key, f.relay, f.pet]),
  content: '',
};

const LAYOUT = layoutJson(EVENT, {
  x: 80,
  y: 140,
  fontSize: 14.5,
  inlineArrayMax: 60,
  abbrev: (_p, raw) => (raw.length > 22 ? shortHex(raw, 6, 2) : raw),
});

const YOU = { x: 880, y: 300 };
const NODE_POS = [
  { x: 1120, y: 170 },
  { x: 1140, y: 420 },
  { x: 880, y: 520 },
];

const CAM_JSON: CameraState = { x: 330, y: 300, k: 1.3 };
const CAM_GRAPH: CameraState = { x: 900, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  youU: ChannelRef<number>;
  outU: ChannelRef<number>;
  petU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  chainU: ChannelRef<number>;
  recoverU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const youU = tl.channel('youU', 0);
  const outU = tl.channel('outU', 0);
  const petU = tl.channel('petU', 0);
  const swapU = tl.channel('swapU', 0);
  const chainU = tl.channel('chainU', 0);
  const recoverU = tl.channel('recoverU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the follow list is an event too.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Your social graph is not in a company’s database either. It is one event of kind three, whose p tags each name a key you follow — with a relay hint and a private nickname riding along.',
  });
  tl.tween(jsonU, 1, { at: 0.8, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — tags become a graph.
  tl.caption({
    at: 6.8,
    dur: 6.0,
    text: 'Read those tags as edges and the list becomes a graph. Each p tag lifts out and becomes a person your key points at. Following is literally just publishing arrows.',
  });
  tl.tween(cam, CAM_GRAPH, { at: 7.1, dur: 1.5, ease: ease.move });
  tl.tween(youU, 1, { at: 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(outU, 1, { at: 8.2, dur: 2.8, ease: ease.linear });
  tl.hold(12.8, 0.7);

  // Beat 3 — petnames.
  tl.caption({
    at: 13.5,
    dur: 5.6,
    text: 'The fourth slot is a petname — what you privately call them, regardless of what their profile says. Your address book, published in your own vocabulary.',
  });
  tl.tween(petU, 1, { at: 14.4, dur: 1.6, ease: ease.linear });
  tl.hold(19.1, 0.7);

  // Beat 4 — replaceable, wholesale.
  tl.caption({
    at: 19.8,
    dur: 6.2,
    text: 'Kind three is replaceable, like the profile — and that has a sharp edge. A new list overwrites the whole old one, so it must always carry every follow. Forget one, and it is unfollowed.',
  });
  tl.tween(swapU, 1, { at: 21.0, dur: 1.8, ease: ease.move });
  tl.hold(26.0, 0.7);

  // Beat 5 — petname chains.
  tl.caption({
    at: 26.7,
    dur: 6.2,
    text: 'Petnames compose across lists. You call him david. David’s list calls her erin. So a client can render a stranger as david dot erin — a name built from paths of trust instead of a registry.',
  });
  tl.tween(chainU, 1, { at: 27.6, dur: 2.6, ease: ease.linear });
  tl.hold(32.9, 0.7);

  // Beat 6 — recovery.
  tl.caption({
    at: 33.6,
    dur: 5.8,
    text: 'And because the list lives on relays, a brand-new device only needs your key. Ask the relays for your latest kind three, and your whole graph walks back in the door.',
  });
  tl.tween(recoverU, 1, { at: 34.6, dur: 1.8, ease: ease.move });
  tl.hold(39.4, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.1,
    dur: 5.4,
    text: 'A profile, an alphabet, a name, and now a graph — all of it signed, portable, and replaceable. One kind of claim remains: proving this key is also you somewhere else.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 40.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.5, dur: 1.0, ease: ease.enter });
  tl.hold(45.5, 1.2);

  return { tl, cam, jsonU, youU, outU, petU, swapU, chainU, recoverU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-who-you-are/chapter-4.overrides.json',
  slug: 'books/nips-who-you-are/chapter-4',
};

function PersonNode({ x, y, label, color, u }: { x: number; y: number; label: string; color: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <circle cx={x} cy={y} r={26} fill={colors.PANEL} stroke={color} strokeWidth={2} />
      <circle cx={x} cy={y - 6} r={7} fill={color} opacity={0.85} />
      <path d={`M${x - 12},${y + 14} a12 10 0 0 1 24 0`} fill={color} opacity={0.85} />
      <text x={x} y={y + 46} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
        {label}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const youU = s.get(scene.youU);
  const outU = s.get(scene.outU);
  const petU = s.get(scene.petU);
  const swapU = s.get(scene.swapU);
  const chainU = s.get(scene.chainU);
  const recoverU = s.get(scene.recoverU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            opacity={1 - 0.7 * clamp01(outU * 1.5)}
            hidden={FOLLOWS.map((_, i) => `tags[${i}][1]`).filter((_, i) => clamp01(outU * FOLLOWS.length - i) > 0)}
            focus={swapU > 0.3 ? ['tags'] : undefined}
            focusU={swapU > 0.3 ? 0.6 : 0}
          />

          <PersonNode x={YOU.x} y={YOU.y} label="you" color={colors.WARM} u={youU} />

          {FOLLOWS.map((f, i) => {
            const a = LAYOUT.anchor(`tags[${i}][1]`);
            const u = clamp01(outU * FOLLOWS.length - i);
            const p = NODE_POS[i];
            if (u <= 0) return null;
            return (
              <g key={f.key}>
                <TokenFlight
                  from={{ x: a.cx, y: a.cy + 5 }}
                  to={{ x: p.x, y: p.y - 40 }}
                  u={u}
                  text={shortHex(f.key, 6, 2)}
                  fill={colors.ACCENT}
                  fontSize={12}
                  lift={70}
                  fadeOut
                />
                <PersonNode x={p.x} y={p.y} label={petU > 0 ? f.pet : shortHex(f.key, 6, 2)} color={colors.ACCENT} u={clamp01(u * 2 - 1)} />
                {clamp01(u * 2 - 1) > 0 && (
                  <line
                    x1={YOU.x + 24}
                    y1={YOU.y}
                    x2={p.x - 24}
                    y2={p.y}
                    stroke={colors.MUTED}
                    strokeWidth={1.6}
                    opacity={0.7 * clamp01(u * 2 - 1)}
                    markerEnd="none"
                  />
                )}
              </g>
            );
          })}

          {/* petname note */}
          {petU > 0 && chainU <= 0 && swapU <= 0 && (
            <text x={760} y={120} fill={colors.MUTED} fontSize={12.5} opacity={petU}>
              ["p", key, relay, <tspan fill={colors.POSITIVE}>petname</tspan>] — your word, not theirs
            </text>
          )}

          {/* the wholesale swap */}
          {swapU > 0 && chainU <= 0 && (
            <g opacity={Math.min(1, swapU * 1.5) * (1 - clamp01(chainU * 2))}>
              <rect x={700} y={90} width={430} height={64} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={718} y={116} fill={colors.NEGATIVE} fontSize={13} fontFamily="monospace">
                new kind 3 = the ENTIRE list, again
              </text>
              <text x={718} y={138} fill={colors.MUTED} fontSize={12}>
                publish it missing alice → alice is unfollowed
              </text>
            </g>
          )}

          {/* petname chain */}
          {chainU > 0 && (
            <g>
              {(() => {
                const david = NODE_POS[2];
                const erin = NODE_POS[1];
                const u1 = clamp01(chainU * 2);
                const u2 = clamp01(chainU * 2 - 1);
                return (
                  <g>
                    <path
                      d={`M${david.x + 20},${david.y - 16} Q ${(david.x + erin.x) / 2 + 40},${(david.y + erin.y) / 2 - 60} ${erin.x - 6},${erin.y + 30}`}
                      fill="none" stroke={colors.SECONDARY} strokeWidth={1.8} strokeDasharray="6 5" opacity={u1}
                    />
                    <text x={1005} y={505} fill={colors.SECONDARY} fontSize={12} opacity={u1}>
                      david’s list: "erin"
                    </text>
                    {u2 > 0 && (
                      <text x={700} y={585} fontSize={16} fontFamily="monospace" opacity={u2}>
                        <tspan fill={colors.ACCENT}>david</tspan>
                        <tspan fill={colors.MUTED}>.</tspan>
                        <tspan fill={colors.SECONDARY}>erin</tspan>
                        <tspan fill={colors.MUTED}> — a name from a path of trust</tspan>
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>
          )}

          {/* recovery */}
          {recoverU > 0 && (
            <g opacity={recoverU}>
              <rect x={120} y={470} width={300} height={92} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={138} y={498} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>new device</text>
              <text x={138} y={520} fill={colors.MUTED} fontSize={12} fontFamily="monospace">has: the key</text>
              <text x={138} y={540} fill={colors.MUTED} fontSize={12} fontFamily="monospace">asks relays: latest kind 3</text>
              <path d={`M${430},${505} Q 560,440 ${YOU.x - 40},${YOU.y + 30}`} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} opacity={0.8} strokeDasharray="6 5" />
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Following is publishing arrows
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one replaceable event — your graph travels with your key
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-02 · kind 3 · ["p", key, relay, petname]
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter4() {
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
