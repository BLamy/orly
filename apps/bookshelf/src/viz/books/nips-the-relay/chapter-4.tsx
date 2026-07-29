// Nostr Implementation Possibilities №5 — The Relay, chapter 4.
// NIP-40 (Expiration): ["expiration","<unix>"] — relays SHOULD drop expired
// events and SHOULD NOT serve them; no guarantee. NIP-09 (Deletion Request):
// kind 5 with e/a/k tags and a reason in content; relays SHOULD stop serving
// matching events by the same pubkey and SHOULD keep the deletion request
// itself forever; clients hide. Both are requests, not guarantees — the
// chapter's honest spine. Tag shapes are the specs' own.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { ReactNode } from 'react';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { JsonDoc, ServiceNode, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const NOTE_ID = '4a8c2e6f0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e';

export const EXPIRING_NOTE = {
  kind: 1,
  content: 'flash sale — one hour only',
  tags: [['expiration', '1700003600']],
};

export const DELETE_REQ = {
  kind: 5,
  content: 'posted the wrong link',
  tags: [
    ['e', NOTE_ID],
    ['k', '1'],
  ],
};

const NOTE_LAYOUT = layoutJson(EXPIRING_NOTE, { x: 96, y: 140, fontSize: 14.5, inlineArrayMax: 52 });
const DEL_LAYOUT = layoutJson(DELETE_REQ, {
  x: 96,
  y: 150,
  fontSize: 14.5,
  inlineArrayMax: 52,
  abbrev: (_p, raw) => (raw.length > 30 ? shortHex(raw, 8, 4) : raw),
});

const RELAY_A = { x: 880, y: 190 };
const RELAY_B = { x: 880, y: 430 };

const CAM_NOTE: CameraState = { x: 350, y: 260, k: 1.25 };
const CAM_RELAYS: CameraState = { x: 760, y: 320, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  noteU: ChannelRef<number>;
  storeU: ChannelRef<number>;
  timerU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  keepU: ChannelRef<number>;
  swapU: ChannelRef<number>;
  delU: ChannelRef<number>;
  sweepU: ChannelRef<number>;
  foreverU: ChannelRef<number>;
  ghostU: ChannelRef<number>;
  relayVis: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const noteU = tl.channel('noteU', 0);
  const storeU = tl.channel('storeU', 0);
  const timerU = tl.channel('timerU', 0);
  const dropU = tl.channel('dropU', 0);
  const keepU = tl.channel('keepU', 0);
  const swapU = tl.channel('swapU', 0);
  const delU = tl.channel('delU', 0);
  const sweepU = tl.channel('sweepU', 0);
  const foreverU = tl.channel('foreverU', 0);
  const ghostU = tl.channel('ghostU', 0);
  // the relay column sits off-camera during document beats — keep it at a
  // whisper there so nothing clips at full opacity
  const relayVis = tl.channel('relayVis', 0.3);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Relays remember. That is their whole job — and sometimes it is exactly the problem. This chapter is about the two ways to ask a relay to forget, and the one word that makes both honest.',
  });
  tl.tween(noteU, 1, { at: 0.8, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_NOTE, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'The gentle way is to post with a death date. One tag — expiration, and a unix timestamp. This note carries its own funeral arrangements.',
  });
  tl.tween(storeU, 1, { at: 8.0, dur: 1.4, ease: ease.move });
  tl.hold(12.6, 0.7);

  tl.caption({
    at: 13.3,
    dur: 6.0,
    text: 'Two relays hold copies. Watch the clock run out: the relay that honors expiration drops the event and stops serving it. The word in the spec is should — not must.',
  });
  tl.tween(cam, CAM_RELAYS, { at: 13.6, dur: 1.4, ease: ease.move });
  tl.tween(relayVis, 1, { at: 13.6, dur: 1.2, ease: ease.move });
  tl.tween(timerU, 1, { at: 14.2, dur: 2.6, ease: ease.linear });
  tl.tween(dropU, 1, { at: 17.0, dur: 1.0, ease: ease.move });
  tl.hold(19.3, 0.7);

  tl.caption({
    at: 20.0,
    dur: 5.6,
    text: 'The second relay never implemented the fortieth proposal. It keeps serving the expired note, entirely within the rules. Expiration is a request to the well-behaved.',
  });
  tl.tween(keepU, 1, { at: 21.0, dur: 1.0, ease: ease.enter });
  tl.hold(25.6, 0.7);

  tl.caption({
    at: 26.3,
    dur: 6.0,
    text: 'The direct way is the deletion request — kind five. Its e tags name the events to remove, a k tag names their kind, and the content can say why, in plain words.',
  });
  tl.tween(swapU, 1, { at: 26.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_NOTE, { at: 26.8, dur: 1.4, ease: ease.move });
  tl.tween(relayVis, 0.22, { at: 26.8, dur: 1.0, ease: ease.move });
  tl.tween(delU, 1, { at: 27.6, dur: 1.8, ease: ease.draw });
  tl.hold(32.3, 0.7);

  tl.caption({
    at: 33.0,
    dur: 6.0,
    text: 'A relay that receives it checks one thing above all: the deletion request and the doomed events must be signed by the same key. You can only unsay what you yourself said.',
  });
  tl.tween(cam, CAM_RELAYS, { at: 33.3, dur: 1.4, ease: ease.move });
  tl.tween(relayVis, 1, { at: 33.3, dur: 1.2, ease: ease.move });
  tl.tween(sweepU, 1, { at: 34.4, dur: 1.8, ease: ease.move });
  tl.hold(39.0, 0.7);

  tl.caption({
    at: 39.7,
    dur: 5.8,
    text: 'Here is the twist: the relay deletes the note but keeps the deletion request — indefinitely, on purpose. Copies of the note may live on relays it has never met; the request must outlive them all.',
  });
  tl.tween(foreverU, 1, { at: 40.8, dur: 1.0, ease: ease.enter });
  tl.hold(45.5, 0.7);

  tl.caption({
    at: 46.2,
    dur: 5.8,
    text: 'And the honest ending: the second relay ignores deletion requests too. Nothing in the protocol can reach into every database — or into a screenshot. Deletion is a request, amplified by convention.',
  });
  tl.tween(ghostU, 1, { at: 47.2, dur: 1.2, ease: ease.enter });
  tl.hold(52.0, 0.7);

  tl.caption({
    at: 52.7,
    dur: 5.2,
    text: 'So the protocol tells the truth instead of promising magic: expiration for things meant to fade, deletion requests for regrets — and the knowledge that publishing was the permanent act.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 52.9, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 53.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 54.2, dur: 1.0, ease: ease.enter });
  tl.hold(57.9, 1.2);

  return { tl, cam, noteU, storeU, timerU, dropU, keepU, swapU, delU, sweepU, foreverU, ghostU, relayVis, dimU, closeU };
}

const scene = buildScene();

function RelayBox({ x, y, label, sub, u, note, noteOp, extra }: {
  x: number; y: number; label: string; sub: string; u: number; note: boolean; noteOp: number; extra?: ReactNode;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <ServiceNode x={x} y={y} kind="server" label={label} sublabel={sub} u={u} />
      {note && (
        <g opacity={noteOp}>
          <rect x={x + 110} y={y - 16} width={150} height={32} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} opacity={0.9} />
          <text x={x + 185} y={y + 4} textAnchor="middle" fill={colors.ACCENT} fontSize={11.5} fontFamily="ui-monospace, Menlo, monospace">
            "flash sale…"
          </text>
        </g>
      )}
      {extra}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const noteU = s.get(scene.noteU);
  const storeU = s.get(scene.storeU);
  const timerU = s.get(scene.timerU);
  const dropU = s.get(scene.dropU);
  const keepU = s.get(scene.keepU);
  const swapU = s.get(scene.swapU);
  const delU = s.get(scene.delU);
  const sweepU = s.get(scene.sweepU);
  const foreverU = s.get(scene.foreverU);
  const ghostU = s.get(scene.ghostU);
  const relayVis = s.get(scene.relayVis);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const noteDocOp = (1 - swapU) * noteU;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* left document: the expiring note, later swapped for the deletion request */}
          {noteDocOp > 0 && (
            <g opacity={noteDocOp}>
              <JsonDoc layout={NOTE_LAYOUT} reveal={noteU} focus={storeU > 0 ? ['tags'] : undefined} focusU={storeU * 0.9} />
            </g>
          )}
          {swapU > 0 && (
            <g opacity={swapU}>
              <text x={96} y={128} fill={colors.NEGATIVE} fontSize={13} fontWeight={600}>the deletion request — kind 5</text>
              <JsonDoc layout={DEL_LAYOUT} reveal={delU} />
              {delU >= 1 && sweepU < 0.5 && (
                <text x={96} y={330} fill={colors.MUTED} fontSize={12.5}>
                  same pubkey as the note — the one check that matters
                </text>
              )}
            </g>
          )}

          {/* the countdown */}
          {timerU > 0 && swapU < 0.5 && (
            <g opacity={1 - swapU * 2}>
              <rect x={340} y={470} width={280 * (1 - timerU)} height={12} rx={6} fill={colors.WARM} opacity={0.8} />
              <rect x={340} y={470} width={280} height={12} rx={6} fill="none" stroke={colors.GRID} />
              <text x={340} y={504} fill={timerU >= 1 ? colors.NEGATIVE : colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, Menlo, monospace">
                {timerU >= 1 ? 'expiration reached' : 'time remaining'}
              </text>
            </g>
          )}

          <RelayBox
            x={RELAY_A.x} y={RELAY_A.y} label="relay A" sub="honors 40 + 09" u={relayVis}
            note={dropU < 1 && sweepU < 1}
            noteOp={(1 - dropU) * (1 - sweepU)}
            extra={
              <>
                {dropU > 0 && swapU < 0.5 && (
                  <text x={RELAY_A.x + 110} y={RELAY_A.y + 6} fill={colors.MUTED} fontSize={12} opacity={dropU * (1 - swapU * 2)}>
                    dropped — not served
                  </text>
                )}
                {sweepU >= 1 && (
                  <text x={RELAY_A.x + 110} y={RELAY_A.y + 6} fill={colors.MUTED} fontSize={12} opacity={sweepU}>
                    note gone
                  </text>
                )}
                {foreverU > 0 && (
                  <g opacity={foreverU}>
                    <rect x={RELAY_A.x + 110} y={RELAY_A.y + 22} width={168} height={30} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} opacity={0.9} />
                    <text x={RELAY_A.x + 194} y={RELAY_A.y + 41} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily="ui-monospace, Menlo, monospace">
                      kind 5 — kept forever
                    </text>
                  </g>
                )}
              </>
            }
          />
          <RelayBox
            x={RELAY_B.x} y={RELAY_B.y} label="relay B" sub="implements neither" u={relayVis}
            note
            noteOp={1}
            extra={
              <>
                {keepU > 0 && (
                  <text x={RELAY_B.x + 110} y={RELAY_B.y + 40} fill={colors.WARM} fontSize={12} opacity={keepU}>
                    still serving — within the rules
                  </text>
                )}
                {ghostU > 0 && (
                  <text x={RELAY_B.x - 84} y={RELAY_B.y + 78} fill={colors.MUTED} fontSize={12} opacity={ghostU}>
                    …and no protocol reaches a screenshot
                  </text>
                )}
              </>
            }
          />
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={235} width={840} height={185} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={303} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Forgetting is a request, not a guarantee
          </text>
          <text x={640} y={347} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            expiration for things meant to fade · kind 5 for regrets · SHOULD, never MUST
          </text>
          <text x={640} y={387} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, Menlo, monospace">
            NIP-40 · NIP-09
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
