// The Event (NIPs series №1), chapter 3 — the wire protocol.
// One websocket between a client and a relay; every message is a JSON array.
// Grounded in NIP-01: client sends ["EVENT",…] ["REQ",…] ["CLOSE",…]; relay
// answers ["EVENT",…] ["OK",…] ["EOSE",…] ["CLOSED",…] ["NOTICE",…]; OK/CLOSED
// carry machine-readable prefixes (duplicate|pow|blocked|rate-limited|invalid|
// restricted|mute|error). The persistent object is the wire itself: frames
// travel it, and the subscription lives on the relay until closed.
import {
  CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline,
  cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import { ServiceNode } from '../../primitives';
import overrides from './chapter-3.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — client left, relay right, one wire between them.
// ---------------------------------------------------------------------------
const CLIENT = { x: 200, y: 330 };
const RELAY = { x: 1060, y: 330 };
const WIRE_Y = 330;
const WIRE_X0 = CLIENT.x + 90;
const WIRE_X1 = RELAY.x - 90;
const DB = { x: RELAY.x, y: 470 };

// a frame's x position along the wire; dir +1 = client→relay
const frameX = (u: number, dir: 1 | -1) =>
  dir > 0 ? WIRE_X0 + (WIRE_X1 - WIRE_X0) * u : WIRE_X1 - (WIRE_X1 - WIRE_X0) * u;

interface FrameSpec {
  text: string;
  color: string;
  dir: 1 | -1;
  /** vertical lane offset so replies pass under requests */
  lane: number;
  w: number;
}

const F_EVENT: FrameSpec = { text: '["EVENT", {…}]', color: colors.ACCENT, dir: 1, lane: -26, w: 150 };
const F_OK: FrameSpec = { text: '["OK", "a9f8…", true, ""]', color: colors.POSITIVE, dir: -1, lane: 26, w: 210 };
const F_BAD: FrameSpec = { text: '["EVENT", {…}]', color: colors.ACCENT, dir: 1, lane: -26, w: 150 };
const F_BADOK: FrameSpec = { text: '["OK", "7c2d…", false, "invalid: bad signature"]', color: colors.NEGATIVE, dir: -1, lane: 26, w: 350 };
const F_REQ: FrameSpec = { text: '["REQ", "sub1", {"kinds":[1],"limit":3}]', color: colors.WARM, dir: 1, lane: -26, w: 320 };
const F_EOSE: FrameSpec = { text: '["EOSE", "sub1"]', color: colors.MUTED, dir: -1, lane: 26, w: 150 };
const F_CLOSE: FrameSpec = { text: '["CLOSE", "sub1"]', color: colors.MUTED, dir: 1, lane: -26, w: 160 };
const STREAM: FrameSpec[] = [0, 1, 2].map(() => ({
  text: '["EVENT", "sub1", {…}]', color: colors.SECONDARY, dir: -1, lane: 26, w: 200,
}));

const CAM_WIRE: CameraState = { x: 630, y: 330, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  stageU: ChannelRef<number>;
  evtU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  okU: ChannelRef<number>;
  badU: ChannelRef<number>;
  badOkU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  subU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  eoseU: ChannelRef<number>;
  liveU: ChannelRef<number>;
  closeReqU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stageU = tl.channel('stageU', 0);
  const evtU = tl.channel('evtU', 0);
  const storeU = tl.channel('storeU', 0);
  const okU = tl.channel('okU', 0);
  const badU = tl.channel('badU', 0);
  const badOkU = tl.channel('badOkU', 0);
  const reqU = tl.channel('reqU', 0);
  const subU = tl.channel('subU', 0);
  const streamU = tl.channel('streamU', 0);
  const eoseU = tl.channel('eoseU', 0);
  const liveU = tl.channel('liveU', 0);
  const closeReqU = tl.channel('closeReqU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the whole vocabulary fits on one wire.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A client and a relay share one websocket, and everything they ever say is a short list of plain text. The client has three words. The relay has five. That is the entire wire protocol.',
  });
  tl.tween(stageU, 1, { at: 0.7, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAM_WIRE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — publish.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'Publishing is the first word — event — carrying the signed object from last chapter. The relay checks the signature, files the event away, and answers with an OK naming the id it accepted.',
  });
  tl.tween(evtU, 1, { at: 7.4, dur: 1.6, ease: ease.linear });
  tl.tween(storeU, 1, { at: 9.2, dur: 0.7, ease: ease.pop });
  tl.tween(okU, 1, { at: 10.0, dur: 1.6, ease: ease.linear });
  tl.hold(13.4, 0.7);

  // Beat 3 — rejection speaks a machine-readable dialect.
  tl.caption({
    at: 14.1,
    dur: 6.2,
    text: 'Rejections use the same word with false — and a reason that starts with a machine-readable prefix. Invalid, blocked, rate-limited, pow, duplicate: the client can react without parsing prose.',
  });
  tl.tween(badU, 1, { at: 14.5, dur: 1.4, ease: ease.linear });
  tl.tween(badOkU, 1, { at: 16.2, dur: 1.8, ease: ease.linear });
  tl.hold(20.3, 0.7);

  // Beat 4 — subscribe.
  tl.caption({
    at: 21.0,
    dur: 5.8,
    text: 'The second word is the request — spelled R E Q on the wire: a subscription id the client invents, plus a filter. This one asks for the three newest text notes. The relay pins the subscription open on its side of the wire.',
  });
  tl.tween(reqU, 1, { at: 21.6, dur: 1.8, ease: ease.linear });
  tl.tween(subU, 1, { at: 23.6, dur: 0.7, ease: ease.enter });
  tl.hold(26.8, 0.7);

  // Beat 5 — stored events stream back.
  tl.caption({
    at: 27.5,
    dur: 5.6,
    text: 'Stored events matching the filter stream back one by one, newest first, each tagged with the subscription id that asked for them.',
  });
  tl.tween(streamU, 1, { at: 27.9, dur: 3.6, ease: ease.linear });
  tl.hold(33.1, 0.7);

  // Beat 6 — EOSE, the line between past and present.
  tl.caption({
    at: 33.8,
    dur: 5.6,
    text: 'Then a small but important marker: end of stored events. Everything before this frame was history. Everything after it is live.',
  });
  tl.tween(eoseU, 1, { at: 34.2, dur: 1.6, ease: ease.linear });
  tl.hold(39.4, 0.7);

  // Beat 7 — live push.
  tl.caption({
    at: 40.1,
    dur: 5.8,
    text: 'Because the subscription stays open, when someone else publishes a matching note, the relay pushes it down the same wire immediately. No polling — the request is a standing question.',
  });
  tl.tween(liveU, 1, { at: 40.7, dur: 2.6, ease: ease.linear });
  tl.hold(45.9, 0.7);

  // Beat 8 — CLOSE (and CLOSED).
  tl.caption({
    at: 46.6,
    dur: 5.8,
    text: 'The client’s third word is close, ending the subscription by id. A relay can end it too — closed, with the same machine-readable prefixes — and a notice carries anything meant for human eyes.',
  });
  tl.tween(closeReqU, 1, { at: 47.2, dur: 1.6, ease: ease.linear });
  tl.tween(subU, 0, { at: 49.0, dur: 0.7, ease: ease.move });
  tl.hold(52.4, 0.7);

  // Beat 9 — close.
  tl.caption({
    at: 53.1,
    dur: 5.6,
    text: 'Three words up, five words down, plain text all the way. Next: the filter object inside that request — the little query language that decides what flows back.',
  });
  tl.tween(dimU, 1, { at: 53.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.5, dur: 1.0, ease: ease.enter });
  tl.hold(58.7, 1.2);

  return {
    tl, cam, stageU, evtU, storeU, okU, badU, badOkU, reqU, subU,
    streamU, eoseU, liveU, closeReqU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-the-event/chapter-3.overrides.json',
  slug: 'books/nips-the-event/chapter-3',
};

function Frame_({ spec, u, hold = true }: { spec: FrameSpec; u: number; hold?: boolean }) {
  const t = clamp01(u);
  if (t <= 0) return null;
  if (t >= 1 && !hold) return null;
  const x = frameX(t, spec.dir);
  const fade = t >= 1 ? 0.35 : 1;
  return (
    <g opacity={fade}>
      <rect x={x - spec.w / 2} y={WIRE_Y + spec.lane - 15} width={spec.w} height={30} rx={7}
        fill={colors.PANEL} stroke={spec.color} strokeWidth={1.5} />
      <text x={x} y={WIRE_Y + spec.lane + 5} textAnchor="middle" fill={spec.color}
        fontSize={12} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
        {spec.text}
      </text>
    </g>
  );
}

function Render_({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stageU = s.get(scene.stageU);
  const evtU = s.get(scene.evtU);
  const storeU = s.get(scene.storeU);
  const okU = s.get(scene.okU);
  const badU = s.get(scene.badU);
  const badOkU = s.get(scene.badOkU);
  const reqU = s.get(scene.reqU);
  const subU = s.get(scene.subU);
  const streamU = s.get(scene.streamU);
  const eoseU = s.get(scene.eoseU);
  const liveU = s.get(scene.liveU);
  const closeReqU = s.get(scene.closeReqU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {stageU > 0 && (
            <g opacity={stageU}>
              <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="client" sublabel="any app" u={stageU} />
              <ServiceNode x={RELAY.x} y={RELAY.y} kind="server" label="relay" sublabel="websocket" u={stageU} />
              <line x1={WIRE_X0} y1={WIRE_Y} x2={WIRE_X0 + (WIRE_X1 - WIRE_X0) * stageU} y2={WIRE_Y}
                stroke={colors.GRID} strokeWidth={2} strokeDasharray="2 6" opacity={0.8} />
              {/* the relay's storage */}
              <g opacity={stageU}>
                <ellipse cx={DB.x} cy={DB.y - 26} rx={44} ry={12} fill={colors.PANEL} stroke={colors.GRID} />
                <path d={`M${DB.x - 44},${DB.y - 26} v40 a44,12 0 0 0 88,0 v-40`} fill={colors.PANEL} stroke={colors.GRID} />
                <text x={DB.x} y={DB.y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                  stored events
                </text>
              </g>
            </g>
          )}

          {/* beat 2: EVENT → store → OK */}
          <Frame_ spec={F_EVENT} u={evtU} hold={false} />
          {storeU > 0 && (
            <g opacity={storeU}>
              <circle cx={DB.x} cy={DB.y - 4 - 10 * storeU} r={5} fill={colors.ACCENT} />
              <circle cx={RELAY.x + 62} cy={RELAY.y - 24} r={11} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <path d={`M${RELAY.x + 56} ${RELAY.y - 24} l4 4 l8 -9`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" />
            </g>
          )}
          <Frame_ spec={F_OK} u={okU} />

          {/* beat 3: rejected EVENT */}
          <Frame_ spec={F_BAD} u={badU} hold={false} />
          <Frame_ spec={F_BADOK} u={badOkU} />
          {badOkU >= 1 && (
            <text x={frameX(1, -1) + 40} y={WIRE_Y + 66} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace" opacity={0.9 * (1 - reqU)}>
              prefix: invalid | blocked | rate-limited | pow | duplicate | …
            </text>
          )}

          {/* beat 4: REQ + subscription chip */}
          <Frame_ spec={F_REQ} u={reqU} hold={false} />
          {subU > 0 && (
            <g opacity={subU}>
              <rect x={RELAY.x - 84} y={RELAY.y - 96} width={168} height={34} rx={8}
                fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={RELAY.x} y={RELAY.y - 74} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                sub1: kinds [1] · limit 3
              </text>
            </g>
          )}

          {/* beat 5: the stored stream */}
          {STREAM.map((spec, i) => (
            <Frame_ key={i} spec={spec} u={clamp01(streamU * 3 - i * 0.75)} hold={false} />
          ))}

          {/* beat 6: EOSE */}
          <Frame_ spec={F_EOSE} u={eoseU} />
          {eoseU >= 1 && liveU < 1 && (
            <text x={630} y={WIRE_Y + 66} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={0.9}>
              ← history · live →
            </text>
          )}

          {/* beat 7: someone else publishes; relay pushes live */}
          {liveU > 0 && (
            <g>
              <g opacity={Math.min(1, liveU * 3)}>
                <circle cx={RELAY.x + 10} cy={150} r={16} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
                <text x={RELAY.x + 10} y={155} textAnchor="middle" fill={colors.SECONDARY} fontSize={11}>✍</text>
                <line x1={RELAY.x + 10} y1={166} x2={RELAY.x + 4} y2={RELAY.y - 100 + 60 * clamp01(liveU * 2)} stroke={colors.SECONDARY} strokeWidth={1.5} strokeDasharray="3 4" />
              </g>
              <Frame_ spec={{ text: '["EVENT", "sub1", {…}]', color: colors.SECONDARY, dir: -1, lane: 26, w: 200 }} u={clamp01(liveU * 2 - 1)} />
            </g>
          )}

          {/* beat 8: CLOSE */}
          <Frame_ spec={F_CLOSE} u={closeReqU} />
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={218} width={880} height={214} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={278} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Three words up, five words down
          </text>
          <text x={640} y={324} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="monospace">
            client: EVENT · REQ · CLOSE
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.SECONDARY} fontSize={15} fontFamily="monospace">
            relay: EVENT · OK · EOSE · CLOSED · NOTICE
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
            NIP-01 — every frame a JSON array on one websocket
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter3() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render_ s={s} />}
      </Player>
    </div>
  );
}

export { Render_ as Render };
export const vizScene = () => scene;
