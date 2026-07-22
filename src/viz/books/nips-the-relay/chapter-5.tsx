// Nostr Implementation Possibilities №5 — The Relay, chapter 5.
// NIP-65 (Relay List Metadata / the outbox model): kind 10002 with
// ["r", url, "read"|"write"?]; fetch a user's events from their WRITE relays,
// look for mentions of them on their READ relays, publish to your write
// relays plus every mentioned user's read relays; keep lists small (2–4 per
// category). The JSON ↔ topology round trip is the book's closing morph.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, JsonDoc, ServiceNode, TokenFlight, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export const ALICE_LIST = {
  kind: 10002,
  tags: [
    ['r', 'wss://nest.example', 'write'],
    ['r', 'wss://reef.example', 'write'],
    ['r', 'wss://inbox.example', 'read'],
  ],
  content: '',
};

const LAYOUT = layoutJson(ALICE_LIST, { x: 76, y: 168, fontSize: 14.5, inlineArrayMax: 56 });

interface RelaySpec { path: string; short: string; mode: 'write' | 'read'; x: number; y: number }
export const RELAYS: RelaySpec[] = [
  { path: 'tags[0][1]', short: 'nest.example', mode: 'write', x: 1030, y: 150 },
  { path: 'tags[1][1]', short: 'reef.example', mode: 'write', x: 1030, y: 300 },
  { path: 'tags[2][1]', short: 'inbox.example', mode: 'read', x: 1030, y: 450 },
];

const YOU = { x: 620, y: 300 };
const HALF_W = 84;

const CAM_JSON: CameraState = { x: 320, y: 300, k: 1.28 };
const CAM_MAP: CameraState = { x: 800, y: 300, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  outU: ChannelRef<number>;
  youU: ChannelRef<number>;
  readFlowU: ChannelRef<number>;
  mentionU: ChannelRef<number>;
  pubU: ChannelRef<number>;
  smallU: ChannelRef<number>;
  backU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const outU = tl.channel('outU', 0);
  const youU = tl.channel('youU', 0);
  const readFlowU = tl.channel('readFlowU', 0);
  const mentionU = tl.channel('mentionU', 0);
  const pubU = tl.channel('pubU', 0);
  const smallU = tl.channel('smallU', 0);
  const backU = tl.channel('backU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One question has haunted every chapter of this book: which relay? Four chapters of verbs, and never a rule for where to point them. The sixty-fifth proposal is that rule — and it fits in three tags.',
  });
  tl.tween(jsonU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  tl.caption({
    at: 7.0,
    dur: 5.8,
    text: 'This is Alice\'s relay list — kind ten thousand and two. Each r tag is a relay, marked write or read. Write relays are her outbox: where her notes live. Her read relay is her inbox: where she listens.',
  });
  tl.hold(12.8, 0.7);

  tl.caption({
    at: 13.5,
    dur: 5.6,
    text: 'Unfold the list into the network it describes: two outboxes, one inbox, and Alice\'s name on all three doors.',
  });
  tl.tween(cam, CAM_MAP, { at: 13.8, dur: 1.5, ease: ease.move });
  tl.tween(outU, 1, { at: 14.4, dur: 2.6, ease: ease.linear });
  tl.hold(19.1, 0.7);

  tl.caption({
    at: 19.8,
    dur: 6.2,
    text: 'Now the routing rules. Rule one: to read Alice, go where she writes. Your client fetches her notes from her write relays — not from some relay you both happen to share.',
  });
  tl.tween(youU, 1, { at: 20.2, dur: 0.8, ease: ease.enter });
  tl.tween(readFlowU, 4, { at: 21.0, dur: 4.4, ease: ease.linear });
  tl.hold(26.0, 0.7);

  tl.caption({
    at: 26.7,
    dur: 5.8,
    text: 'Rule two: to reach Alice, go where she reads. A reply that mentions her gets delivered to her inbox relay, because that is the door she is actually watching.',
  });
  tl.tween(mentionU, 1, { at: 27.6, dur: 2.2, ease: ease.linear });
  tl.hold(32.5, 0.7);

  tl.caption({
    at: 33.2,
    dur: 6.0,
    text: 'And when you publish, you fan out: your own write relays get the note, and every mentioned person\'s read relay gets a copy. The relay list event itself travels everywhere, so everyone can find the doors.',
  });
  tl.tween(pubU, 1, { at: 34.2, dur: 2.6, ease: ease.linear });
  tl.hold(39.2, 0.7);

  tl.caption({
    at: 39.9,
    dur: 5.6,
    text: 'The spec\'s one piece of lifestyle advice: keep the list small — two to four relays per category. The point is not redundancy through bulk; it is a short, current answer to the question "where".',
  });
  tl.tween(smallU, 1, { at: 41.0, dur: 0.8, ease: ease.enter });
  tl.hold(45.5, 0.7);

  tl.caption({
    at: 46.2,
    dur: 6.0,
    text: 'Fold the network back into the list and read what just happened: no directory, no company, no home server. Three tags, published like any other event, and the whole network routes itself around them.',
  });
  tl.tween(cam, CAM_JSON, { at: 46.5, dur: 1.5, ease: ease.move });
  tl.tween(backU, 1, { at: 47.2, dur: 2.4, ease: ease.linear });
  tl.hold(52.2, 0.7);

  tl.caption({
    at: 52.9,
    dur: 5.8,
    text: 'That is the relay: a dumb pipe with a sign on the door, an auth handshake, a few honest verbs — and smart clients weaving thousands of them into something with no center to seize.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 53.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.4, dur: 1.0, ease: ease.enter });
  tl.hold(58.7, 1.2);

  return { tl, cam, jsonU, outU, youU, readFlowU, mentionU, pubU, smallU, backU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const outU = s.get(scene.outU);
  const youU = s.get(scene.youU);
  const readFlowU = s.get(scene.readFlowU);
  const mentionU = s.get(scene.mentionU);
  const pubU = s.get(scene.pubU);
  const smallU = s.get(scene.smallU);
  const backU = s.get(scene.backU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const morph = (i: number) => clamp01(outU * RELAYS.length - i) * (1 - clamp01(backU * RELAYS.length - i));
  const mapFade = 1 - clamp01(backU * 1.4);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            hidden={RELAYS.filter((_, i) => morph(i) > 0).map((r) => r.path)}
          />
          {jsonU >= 1 && backU >= 1 && (
            <text x={76} y={330} fill={colors.POSITIVE} fontSize={13} opacity={clamp01((backU - 0.9) * 8)}>
              the whole topology, home again — three tags
            </text>
          )}

          {RELAYS.map((r, i) => {
            const u = morph(i);
            const a = LAYOUT.anchor(r.path);
            if (u <= 0) return null;
            return (
              <g key={r.path}>
                <TokenFlight
                  from={{ x: a.cx, y: a.cy + 5 }}
                  to={{ x: r.x, y: r.y - 40 }}
                  u={u}
                  text={r.short}
                  fill={r.mode === 'write' ? colors.WARM : colors.POSITIVE}
                  fontSize={13}
                  lift={60}
                  fadeOut
                />
                <ServiceNode
                  x={r.x}
                  y={r.y}
                  kind="server"
                  label={r.short}
                  sublabel={r.mode === 'write' ? "alice's outbox" : "alice's inbox"}
                  u={clamp01(u * 2 - 1)}
                />
              </g>
            );
          })}

          {youU > 0 && mapFade > 0 && (
            <g opacity={mapFade}>
              <ServiceNode x={YOU.x} y={YOU.y} kind="client" label="you" sublabel="reading alice" u={youU} />
              {/* rule 1: fetch from write relays */}
              {RELAYS.filter((r) => r.mode === 'write').map((r, i) => {
                const u = clamp01(readFlowU - i * 0.4);
                if (u <= 0) return null;
                return (
                  <Connection
                    key={`read-${r.short}`}
                    from={{ x: r.x - HALF_W, y: r.y }}
                    to={{ x: YOU.x + HALF_W, y: YOU.y }}
                    u={Math.min(1, u)}
                    flow={clamp01(readFlowU - 1) * 3}
                    label="her notes"
                    color={colors.WARM}
                  />
                );
              })}
              {/* rule 2: mention to her read relay */}
              {mentionU > 0 && (
                <Connection
                  from={{ x: YOU.x + HALF_W, y: YOU.y + 18 }}
                  to={{ x: RELAYS[2].x - HALF_W, y: RELAYS[2].y }}
                  u={Math.min(1, mentionU * 2)}
                  flow={clamp01(mentionU * 2 - 1) * 2}
                  label="@alice reply"
                  color={colors.POSITIVE}
                  dashed
                />
              )}
              {pubU > 0 && (
                <g opacity={Math.min(1, pubU * 2)}>
                  <text x={YOU.x} y={YOU.y + 74} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    publish = your write relays + each mention&apos;s read relay
                  </text>
                </g>
              )}
              {smallU > 0 && (
                <g opacity={smallU}>
                  <rect x={940} y={540} width={200} height={34} rx={9} fill="none" stroke={colors.SECONDARY} opacity={0.7} />
                  <text x={1040} y={562} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5}>
                    keep it small: 2–4 each
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={195} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Dumb pipes, smart clients, no center
          </text>
          <text x={640} y={342} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            read where they write · deliver where they read · the list travels with you
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-65 · kind 10002 · ["r", url, "read"|"write"?]
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
