// An App on Every Kind — chapter 5, the finale of the series.
//
// Reprise of the whole spine: an event whose id proves WHAT was said (SHA-256,
// book 1), whose signature proves WHO said it (keys, book 1/7), carried by
// relays with no center (book 5), and read through its kind — one open
// namespace (books 9–10). The closing beat mints a brand-new kind and it works
// everywhere immediately, because the plumbing underneath never changed.
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
import { JsonDoc, layoutJson, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const EVENT = {
  id: 'a9f81d2c…10da',
  pubkey: '8e0d3d3e…5e0ed7',
  created_at: 1700900000,
  kind: 30402,
  tags: [['d', 'your-new-thing']],
  content: '…',
  sig: 'c1d7…',
};
const EVENT_LAYOUT = layoutJson(EVENT, { x: 470, y: 150, fontSize: 16, inlineArrayMax: 30 });

// the reprise spine — four proofs orbiting the event
const PROOFS = [
  { key: 'id', label: 'id — proves what was said', sub: 'SHA-256 of the event', color: colors.ACCENT, x: 200, y: 165 },
  { key: 'sig', label: 'sig — proves who said it', sub: 'Schnorr over your key', color: colors.POSITIVE, x: 200, y: 258 },
  { key: 'relays', label: 'relays — carry it, no center', sub: 'dumb pipes, your list', color: colors.NEGATIVE, x: 200, y: 351 },
  { key: 'kind', label: 'kind — says how to read it', sub: 'one open namespace', color: colors.SECONDARY, x: 200, y: 444 },
];

// mini namespace strip for the mint beat
const STRIP_KINDS = [1, 7, 9735, 30023, 30311, 31990];
const NEW_KIND = 30402;

const CAM_EVENT: CameraState = { x: 640, y: 300, k: 1.1 };
const CAM_MINT: CameraState = { x: 640, y: 360, k: 1.0 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const eventU = tl.channel('eventU', 0);
  const proofF = tl.channel('proofF', -1);
  const stripU = tl.channel('stripU', 0);
  const mintU = tl.channel('mintU', 0);
  const worksU = tl.channel('worksU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the object the whole series was about.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Ten books, and it was always this one object. A short piece of signed data — the event. Everything else we met was a way of making, moving, or reading it.',
  });
  tl.tween(eventU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_EVENT, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.6);

  // Beat 2 — the four proofs light up in turn.
  tl.caption({
    at: 6.9,
    dur: 7.2,
    text: 'Its id is a hash of its own contents, so it proves what was said. Its signature is made with your secret key, so it proves who said it. Relays carry it with no center. And its kind says how to read it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.set(proofF, 0, 7.6);
  tl.set(proofF, 1, 9.4);
  tl.set(proofF, 2, 11.2);
  tl.set(proofF, 3, 12.9);
  tl.hold(14.1, 0.7);

  // Beat 3 — the kind is the only open part.
  tl.caption({
    at: 14.8,
    dur: 6.0,
    text: 'Three of those four are fixed for everyone, forever. Only the last one is open. The identity, the integrity, the transport — all settled — so that inventing a new kind of thing is the easy part.',
  });
  tl.tween(stripU, 1, { at: 15.6, dur: 2.0, ease: ease.enter });
  tl.hold(20.8, 0.7);

  // Beat 4 — mint a brand-new kind.
  tl.caption({
    at: 21.5,
    dur: 6.4,
    text: 'So mint one. Pick an unused number, write down what its tags mean, publish the agreement. That is the entire cost of a new application on this network — a paragraph and a number nobody was using.',
  });
  tl.tween(cam, CAM_MINT, { at: 21.7, dur: 1.4, ease: ease.move });
  tl.tween(mintU, 1, { at: 22.6, dur: 1.6, ease: ease.pop });
  tl.hold(27.9, 0.7);

  // Beat 5 — it works everywhere immediately.
  tl.caption({
    at: 28.6,
    dur: 6.6,
    text: 'And on the day it is born it already has followers, signatures, reactions, zaps, and a way for any client to learn to open it. Not because anyone bridged to it — because it never left the shared foundation.',
  });
  tl.tween(worksU, 1, { at: 29.4, dur: 2.6, ease: ease.linear });
  tl.hold(35.2, 0.7);

  // Beat 6 — the thesis.
  tl.caption({
    at: 35.9,
    dur: 6.4,
    text: 'That is the whole idea the protocol is defending. Not one app, or ten, but a namespace no one owns — where the cost of a new kind of software is low enough that there can be an app on every kind.',
  });
  tl.hold(42.3, 0.6);

  // Beat 7 — close the series.
  tl.caption({
    at: 42.9,
    dur: 6.0,
    text: 'One little event, a key that is yours, relays that answer to no one, and an open number line. That is nostr — and that is where this shelf of ten books finally rests.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 43.1, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 43.3, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 44.3, dur: 1.0, ease: ease.enter });
  tl.hold(48.9, 1.4);

  return { tl, cam, eventU, proofF, stripU, mintU, worksU, dimU, closeU };
}

const scene = buildScene();

const WORKS = ['followed', 'signed', 'reacted', 'zapped', 'openable'];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const eventU = s.get(scene.eventU);
  const proofF = Math.round(s.get(scene.proofF));
  const stripU = s.get(scene.stripU);
  const mintU = s.get(scene.mintU);
  const worksU = s.get(scene.worksU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const focus = proofF >= 0 && proofF < PROOFS.length ? [PROOFS[proofF].key === 'relays' ? 'kind' : PROOFS[proofF].key] : undefined;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the event */}
          <JsonDoc layout={EVENT_LAYOUT} reveal={eventU} focus={mintU > 0 ? ['kind'] : focus} focusU={mintU > 0 ? mintU : proofF >= 0 ? 1 : 0} />

          {/* the four proofs */}
          {PROOFS.map((p, i) => {
            const lit = proofF >= i;
            if (eventU < 1) return null;
            return (
              <g key={p.key} opacity={lit ? 1 : 0.28}>
                <rect x={p.x - 20} y={p.y - 26} width={250} height={52} rx={9} fill={colors.PANEL} stroke={lit ? p.color : colors.GRID} strokeWidth={lit ? 1.6 : 1} />
                <text x={p.x - 6} y={p.y - 5} fill={lit ? p.color : colors.MUTED} fontSize={13.5} fontWeight={600}>
                  {p.label}
                </text>
                <text x={p.x - 6} y={p.y + 14} fill={colors.MUTED} fontSize={11.5}>
                  {p.sub}
                </text>
              </g>
            );
          })}

          {/* mini namespace strip + minted kind */}
          {stripU > 0 && (
            <g opacity={stripU}>
              {STRIP_KINDS.map((k, i) => {
                const x = 300 + i * 116;
                return (
                  <g key={k}>
                    <rect x={x} y={500} width={96} height={40} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                    <text x={x + 48} y={525} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily="monospace">
                      {k}
                    </text>
                  </g>
                );
              })}
              {mintU > 0 && (
                <g opacity={mintU}>
                  <rect x={300 + STRIP_KINDS.length * 116} y={500} width={96} height={40} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                  <text x={300 + STRIP_KINDS.length * 116 + 48} y={525} textAnchor="middle" fill={colors.WARM} fontSize={14} fontWeight={700} fontFamily="monospace">
                    {NEW_KIND}
                  </text>
                  <text x={300 + STRIP_KINDS.length * 116 + 48} y={560} textAnchor="middle" fill={colors.WARM} fontSize={11} opacity={mintU}>
                    minted
                  </text>
                </g>
              )}
            </g>
          )}

          {/* it works everywhere */}
          {worksU > 0 && (
            <g>
              {WORKS.map((w, i) => {
                const u = clamp01(worksU * WORKS.length - i);
                if (u <= 0) return null;
                const x = 320 + i * 130;
                return (
                  <g key={w} opacity={u}>
                    <circle cx={x} cy={600} r={7} fill="none" stroke={colors.POSITIVE} strokeWidth={1.8} />
                    <path d={`M${x - 4} 600 l3 3 l6 -7`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} strokeLinecap="round" />
                    <text x={x + 16} y={605} fill={colors.POSITIVE} fontSize={13}>
                      {w}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={190} y={230} width={900} height={210} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.SECONDARY} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>
            An app on every kind
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one signed event · your key · relays with no center · an open namespace
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            {shortHex('a9f81d2c1c8fbe4443ba0a19f32b4b382cd9bafb90d1a2a0b83c3f21c5cf10da', 10, 6)} — and anyone can mint the next kind
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            Nostr Implementation Possibilities · the series, complete
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
