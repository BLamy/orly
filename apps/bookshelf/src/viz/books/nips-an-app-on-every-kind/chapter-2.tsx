// Who Opens This? — chapter 2 of "An App on Every Kind".
//
// Grounded in NIP-89 (recommended application handlers) and NIP-21 (nostr:
// URIs). A nostr link addresses an event of a kind the current client cannot
// render. The client asks the network: a kind 31989 recommendation carries a
// `d` tag naming the target kind and an `a` tag pointing at a kind 31990
// handler-information event, whose url templates contain a `<bech32>`
// placeholder the client MUST replace with the addressed entity. ONE machine:
// a nostr link with nowhere to go, resolved through two events into the app
// that opens it.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, TokenFlight, layoutJson } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const NADDR = 'naddr1qq…kxamnw';

// kind 31989 — a recommendation: "for kind 30023, I trust this handler"
const REC = {
  kind: 31989,
  pubkey: 'friend…a11c',
  tags: [
    ['d', '30023'],
    ['a', '31990:habla…9f2:web', 'wss://relay.example', 'web'],
  ],
  content: '',
};
const REC_LAYOUT = layoutJson(REC, { x: 80, y: 150, fontSize: 15, inlineArrayMax: 30 });

// kind 31990 — handler information: the url templates
const HANDLER = {
  kind: 31990,
  pubkey: 'habla…9f2',
  tags: [
    ['d', 'web'],
    ['k', '30023'],
    ['web', 'https://app.example/a/<bech32>'],
    ['ios', 'app.example://a/<bech32>'],
  ],
  content: '{ "name": "Habla" }',
};
const HANDLER_LAYOUT = layoutJson(HANDLER, { x: 700, y: 150, fontSize: 15, inlineArrayMax: 40 });

const LINK = { x: 500, y: 96 };
const APP = { x: 560, y: 470, w: 320, h: 96 };

const CAM_REC: CameraState = { x: 330, y: 300, k: 1.25 };
const CAM_HANDLER: CameraState = { x: 900, y: 300, k: 1.2 };
const CAM_APP: CameraState = { x: 640, y: 430, k: 1.15 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const linkU = tl.channel('linkU', 0);
  const stuckU = tl.channel('stuckU', 0);
  const recU = tl.channel('recU', 0);
  const dMatchU = tl.channel('dMatchU', 0);
  const handlerU = tl.channel('handlerU', 0);
  const fillU = tl.channel('fillU', 0);
  const openU = tl.channel('openU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a link with nowhere to go.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'A friend sends you a nostr link. It addresses one specific event — an article, kind thirty thousand twenty three. But the app you are holding only knows how to show short notes.',
  });
  tl.tween(linkU, 1, { at: 0.7, dur: 1.0, ease: ease.enter });
  tl.tween(stuckU, 1, { at: 3.0, dur: 0.8, ease: ease.enter });
  tl.hold(6.3, 0.6);

  // Beat 2 — instead of failing, ask the network.
  tl.caption({
    at: 6.9,
    dur: 6.2,
    text: 'A closed app would just fail here. Instead the client asks the network a question: who handles this kind? It looks for a recommendation — kind 31989 — whose identifier tag is exactly that number.',
  });
  tl.tween(cam, CAM_REC, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(stuckU, 0, { at: 7.1, dur: 0.6, ease: ease.move });
  tl.tween(recU, 1, { at: 7.8, dur: 1.8, ease: ease.draw });
  tl.tween(dMatchU, 1, { at: 10.2, dur: 1.0, ease: ease.enter });
  tl.hold(13.1, 0.7);

  // Beat 3 — the recommendation points at a handler.
  tl.caption({
    at: 13.8,
    dur: 6.0,
    text: 'The recommendation carries an address tag. It does not contain the app — it points at one: a handler-information event, kind 31990, published by the app itself, sitting at a lasting address.',
  });
  tl.tween(cam, CAM_HANDLER, { at: 14.0, dur: 1.5, ease: ease.move });
  tl.tween(handlerU, 1, { at: 15.0, dur: 1.8, ease: ease.draw });
  tl.hold(19.8, 0.7);

  // Beat 4 — the url template with a placeholder.
  tl.caption({
    at: 20.5,
    dur: 6.4,
    text: 'Inside are web address templates, one per platform. Each has a hole in it — the word bech32 — a blank the client is required to fill with the exact entity the link was pointing at.',
  });
  tl.hold(26.9, 0.6);

  // Beat 5 — fill the hole with the entity.
  tl.caption({
    at: 27.5,
    dur: 6.0,
    text: 'So the client drops the addressed entity into the blank. Template plus entity becomes a real web address — a deep link that lands directly on that one article inside the app that understands it.',
  });
  tl.tween(fillU, 1, { at: 28.4, dur: 1.8, ease: ease.move });
  tl.hold(33.5, 0.7);

  // Beat 6 — the app opens.
  tl.caption({
    at: 34.2,
    dur: 5.8,
    text: 'The right app opens, on the right screen, showing the exact event. Nobody registered a file type with an operating system. The recommendation came from a person you follow, as just another event.',
  });
  tl.tween(cam, CAM_APP, { at: 34.4, dur: 1.5, ease: ease.move });
  tl.tween(openU, 1, { at: 35.2, dur: 1.0, ease: ease.pop });
  tl.hold(40.0, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.7,
    dur: 5.8,
    text: 'Discovery is social, not central. Kinds you have never seen become openable because someone vouched for a handler — and the whole handshake is three ordinary events pointing at each other.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 40.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.1, dur: 1.0, ease: ease.enter });
  tl.hold(46.5, 1.2);

  return {
    tl, cam, linkU, stuckU, recU, dMatchU, handlerU, fillU, openU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const linkU = s.get(scene.linkU);
  const stuckU = s.get(scene.stuckU);
  const recU = s.get(scene.recU);
  const dMatchU = s.get(scene.dMatchU);
  const handlerU = s.get(scene.handlerU);
  const fillU = s.get(scene.fillU);
  const openU = s.get(scene.openU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const webAnchor = HANDLER_LAYOUT.anchor('tags[2][1]');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the nostr link */}
          {linkU > 0 && (
            <g opacity={linkU}>
              <rect x={LINK.x} y={LINK.y} width={280} height={40} rx={9} fill={colors.PANEL} stroke={stuckU > 0.5 ? colors.NEGATIVE : colors.ACCENT} />
              <text x={LINK.x + 16} y={LINK.y + 25} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
                nostr:{NADDR}
              </text>
              {stuckU > 0 && (
                <text x={LINK.x + 140} y={LINK.y + 66} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={stuckU}>
                  kind 30023 — this app can’t render it
                </text>
              )}
            </g>
          )}

          {/* kind 31989 recommendation */}
          <JsonDoc layout={REC_LAYOUT} reveal={recU} focus={dMatchU > 0 ? ['tags[0]', 'kind'] : undefined} focusU={dMatchU} />
          {dMatchU > 0 && (
            <g opacity={dMatchU}>
              {(() => {
                const a = REC_LAYOUT.anchor('tags[0][1]');
                return (
                  <rect x={a.x - 6} y={a.y - 2} width={a.w + 12} height={a.h + 2} rx={5} fill="none" stroke={colors.WARM} strokeWidth={1.5} />
                );
              })()}
              <text x={REC_LAYOUT.x} y={REC_LAYOUT.anchor('tags[0][1]').y + 44} fill={colors.WARM} fontSize={12}>
                d = 30023 → this recommendation is for articles
              </text>
            </g>
          )}

          {/* kind 31990 handler information */}
          <JsonDoc layout={HANDLER_LAYOUT} reveal={handlerU} hidden={fillU > 0 && fillU < 1 ? ['tags[2][1]'] : undefined} />

          {/* fill the <bech32> hole with the entity */}
          {fillU > 0 && (
            <TokenFlight
              from={{ x: LINK.x + 140, y: LINK.y + 20 }}
              to={{ x: webAnchor.cx, y: webAnchor.cy + 5 }}
              u={fillU}
              text={NADDR}
              fill={colors.POSITIVE}
              fontSize={12}
              lift={90}
            />
          )}
          {fillU >= 1 && (
            <text x={HANDLER_LAYOUT.x} y={webAnchor.y + 44} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
              https://app.example/a/{NADDR}
            </text>
          )}

          {/* the app opens */}
          {openU > 0 && (
            <g opacity={openU}>
              <rect x={APP.x} y={APP.y} width={APP.w} height={APP.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <circle cx={APP.x + 34} cy={APP.y + 34} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
              <path d={`M${APP.x + 27} ${APP.y + 34} l5 5 l10 -11`} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} strokeLinecap="round" />
              <text x={APP.x + 60} y={APP.y + 32} fill={colors.TEXT} fontSize={16} fontWeight={600}>
                Habla — opened
              </text>
              <text x={APP.x + 60} y={APP.y + 56} fill={colors.MUTED} fontSize={13}>
                the exact article, in an app that reads it
              </text>
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Discovery is social, not central
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            a recommendation points at a handler; the client fills the blank
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-89 · kind 31989 recommends · kind 31990 handles
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
