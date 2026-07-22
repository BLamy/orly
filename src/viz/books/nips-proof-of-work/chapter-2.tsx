// Nostr Implementation Possibilities №6 — Proof of Work, chapter 2.
// The mining montage. The nonce tag ["nonce", "<counter>", "<target>"] per
// NIP-13; mining = increment, re-serialize, re-hash. The MILESTONES ladder
// below is a real mining run performed with the toolkit's sha256 (every entry
// is the nonce where a new best difficulty first appeared); the final result
// is re-hashed and re-counted at module load and the module throws if it
// doesn't reproduce. Nothing here is decorative.
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import {
  BitField, JsonDoc, hexToBits, layoutJson, leadingZeroBits,
  sha256Hex, shortHex,
} from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The real mining run (precomputed offline with this exact serialization).
// ---------------------------------------------------------------------------
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const CREATED_AT = 1700000000;
const CONTENT = 'pow on nostr';
const TARGET = 14;
const serialize = (nonce: number) =>
  JSON.stringify([0, PUBKEY, CREATED_AT, 1, [['nonce', String(nonce), String(TARGET)]], CONTENT]);

// [nonce, best-so-far difficulty] — every new best from the actual search.
const MILESTONES: Array<[number, number]> = [
  [0, 1], [2, 2], [9, 3], [13, 4], [26, 5], [153, 7], [171, 8],
  [1218, 9], [1380, 10], [2020, 11], [11929, 12], [19450, 13], [52665, 14],
];
const WIN_NONCE = 52665;
const WIN_ID = sha256Hex(serialize(WIN_NONCE));
if (leadingZeroBits(WIN_ID) !== TARGET) throw new Error('mined nonce must reproduce 14 zero bits');
if (WIN_ID !== '0002e0aa992aff34853e5b11aa5247437750d5d889a55304c870f689f1b1b303')
  throw new Error('mined id drifted from the recorded run');

// ids at each milestone, recomputed for real at module load (13 hashes — cheap).
const MILE_IDS = MILESTONES.map(([n]) => sha256Hex(serialize(n)));
const MILE_BITS = MILE_IDS.map((h) => hexToBits(h));

export const EVENT = {
  pubkey: PUBKEY,
  created_at: CREATED_AT,
  kind: 1,
  tags: [['nonce', '0', String(TARGET)]],
  content: CONTENT,
};

const LAYOUT = layoutJson(EVENT, {
  x: 84,
  y: 168,
  fontSize: 14.5,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});
const NONCE_ANCHOR = LAYOUT.anchor('tags[0][1]');

const GRID = { x: 812, y: 128, cell: 15, gap: 3 };
const GRID_W = 16 * (GRID.cell + GRID.gap) - GRID.gap;

// difficulty ladder along the left of the grid
const LADDER_X = GRID.x - 46;
const ladderY = (d: number) => GRID.y + GRID_W - (d / TARGET) * GRID_W;

const CAM_JSON: CameraState = { x: 330, y: 310, k: 1.26 };
const CAM_MINE: CameraState = { x: 800, y: 320, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  jsonU: ChannelRef<number>;
  tagU: ChannelRef<number>;
  gridU: ChannelRef<number>;
  mineU: ChannelRef<number>; // 0..1 sweeps through MILESTONES
  churnU: ChannelRef<number>; // continuous churn while mining
  stallU: ChannelRef<number>;
  winU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const jsonU = tl.channel('jsonU', 0);
  const tagU = tl.channel('tagU', 0);
  const gridU = tl.channel('gridU', 0);
  const mineU = tl.channel('mineU', 0);
  const churnU = tl.channel('churnU', 0);
  const stallU = tl.channel('stallU', 0);
  const winU = tl.channel('winU', 0);
  const gateU = tl.channel('gateU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the nonce tag.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'To mine an event you give it one extra tag. The first slot names it nonce, the second holds a counter, and the third declares the difficulty you are aiming for — here, fourteen bits.',
  });
  tl.tween(jsonU, 1, { at: 0.7, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAM_JSON, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(tagU, 1, { at: 3.2, dur: 0.8, ease: ease.enter });
  tl.hold(6.5, 0.7);

  // Beat 2 — the loop.
  tl.caption({
    at: 7.2,
    dur: 6.0,
    text: 'The loop is brutally simple: bump the counter, re-serialize, re-hash, look at the zeros. The spec also recommends refreshing the timestamp as you grind, so the note stays current.',
  });
  tl.tween(cam, CAM_MINE, { at: 7.4, dur: 1.5, ease: ease.move });
  tl.tween(gridU, 1, { at: 7.9, dur: 1.2, ease: ease.draw });
  tl.tween(churnU, 1, { at: 8.6, dur: 0.6, ease: ease.enter });
  tl.hold(13.2, 0.7);

  // Beat 3 — the montage begins.
  tl.caption({
    at: 13.9,
    dur: 6.4,
    text: 'Watch a real run — these are the actual nonces where this event’s record improved. Two tries bought two zeros. Twenty six bought five. Two thousand and twenty bought eleven.',
  });
  tl.tween(mineU, 10 / 12, { at: 14.4, dur: 5.4, ease: ease.linear });
  tl.hold(20.3, 0.7);

  // Beat 4 — the stall.
  tl.caption({
    at: 21.0,
    dur: 6.2,
    text: 'Then the wall. From nonce two thousand to nonce fifty two thousand, nothing. Ten thousand hashes, twenty thousand, forty — each extra bit doubles the average wait, and the coin owes you nothing.',
  });
  tl.tween(mineU, 11 / 12, { at: 21.6, dur: 1.0, ease: ease.move });
  tl.tween(stallU, 1, { at: 22.8, dur: 3.6, ease: ease.linear });
  tl.hold(27.2, 0.7);

  // Beat 5 — the strike.
  tl.caption({
    at: 27.9,
    dur: 5.8,
    text: 'Nonce fifty two thousand six hundred sixty five. Fourteen zeros. The digest you are looking at is that exact hash, recomputed the moment this scene loaded.',
  });
  tl.tween(mineU, 1, { at: 28.3, dur: 0.8, ease: ease.move });
  tl.tween(winU, 1, { at: 29.4, dur: 0.8, ease: ease.pop });
  tl.hold(33.7, 0.7);

  // Beat 6 — the gate.
  tl.caption({
    at: 34.4,
    dur: 6.0,
    text: 'Now the payoff. A relay that demands fourteen bits of work checks this in one hash — count the zeros, compare, done. Verification costs nothing; only production was expensive.',
  });
  tl.tween(gateU, 1, { at: 35.4, dur: 1.4, ease: ease.move });
  tl.hold(40.4, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.1,
    dur: 5.6,
    text: 'That asymmetry — hours to make, microseconds to check — is the entire trick. Next: why the tag also declares what you were aiming for, and what happens to miners who get lucky.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.5, dur: 1.0, ease: ease.enter });
  tl.hold(46.7, 1.2);

  return {
    tl, cam, jsonU, tagU, gridU, mineU, churnU, stallU,
    winU, gateU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const tagU = s.get(scene.tagU);
  const gridU = s.get(scene.gridU);
  const mineU = s.get(scene.mineU);
  const stallU = s.get(scene.stallU);
  const winU = s.get(scene.winU);
  const gateU = s.get(scene.gateU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // which milestone are we on?
  const mi = Math.min(MILESTONES.length - 1, Math.floor(mineU * MILESTONES.length));
  const started = mineU > 0;
  const [nonce, best] = started ? MILESTONES[mi] : [0, 0];
  // during the stall, interpolate the displayed nonce 19450 → 52665
  const shownNonce = stallU > 0 && winU < 1
    ? Math.round(19450 + (WIN_NONCE - 19450) * stallU)
    : nonce;
  const bits = started ? MILE_BITS[mi] : MILE_BITS[0];

  return (
    <>
      <Camera {...cam}>
        <g opacity={mainOp}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={tagU > 0 ? ['tags'] : undefined}
            focusU={tagU * 0.9}
            hidden={started ? ['tags[0][1]'] : undefined}
          />
          {/* live nonce odometer riding the hidden slot */}
          {started && (
            <g>
              <rect x={NONCE_ANCHOR.x - 4} y={NONCE_ANCHOR.y} width={NONCE_ANCHOR.w + 60} height={NONCE_ANCHOR.h} rx={4} fill={colors.PANEL} stroke={colors.WARM} opacity={0.9} />
              <text x={NONCE_ANCHOR.x + 4} y={NONCE_ANCHOR.y + NONCE_ANCHOR.h - 7} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={600}>
                {shownNonce.toLocaleString('en-US')}
              </text>
            </g>
          )}

          {/* the mining rig */}
          {gridU > 0 && (
            <g>
              <text x={GRID.x} y={GRID.y - 40} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={gridU}>
                id = SHA-256(serialization with nonce {shownNonce.toLocaleString('en-US')})
              </text>
              <text x={GRID.x} y={GRID.y - 20} fill={winU > 0 ? colors.POSITIVE : colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={gridU}>
                {shortHex(started ? MILE_IDS[mi] : MILE_IDS[0], 14, 6)}
              </text>
              <BitField
                bits={bits}
                x={GRID.x}
                y={GRID.y}
                cell={GRID.cell}
                gap={GRID.gap}
                reveal={gridU}
                settle={1}
                zeroRunU={started ? 1 : 0}
                onColor={winU > 0 ? colors.POSITIVE : colors.ACCENT}
                seed={31 + mi}
              />
              {/* difficulty ladder */}
              <line x1={LADDER_X} y1={ladderY(0)} x2={LADDER_X} y2={ladderY(TARGET)} stroke={colors.GRID} strokeWidth={1.5} opacity={gridU} />
              {Array.from({ length: TARGET + 1 }, (_, d) => (
                <g key={d} opacity={gridU}>
                  <line x1={LADDER_X - 4} y1={ladderY(d)} x2={LADDER_X + 4} y2={ladderY(d)} stroke={colors.GRID} strokeWidth={1} />
                </g>
              ))}
              <g opacity={started ? 1 : 0}>
                <circle cx={LADDER_X} cy={ladderY(best)} r={7} fill={winU > 0 ? colors.POSITIVE : colors.WARM} />
                <text x={LADDER_X - 14} y={ladderY(best) + 5} textAnchor="end" fill={winU > 0 ? colors.POSITIVE : colors.WARM} fontSize={13} fontWeight={600}>
                  {best}
                </text>
              </g>
              <text x={LADDER_X} y={ladderY(TARGET) - 12} textAnchor="middle" fill={colors.MUTED} fontSize={11} opacity={gridU}>
                target {TARGET}
              </text>

              {winU > 0 && (
                <g opacity={winU}>
                  <text x={GRID.x + GRID_W / 2} y={GRID.y + GRID_W + 32} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                    {TARGET} zero bits — mined, verified at load
                  </text>
                </g>
              )}
            </g>
          )}

          {/* the relay gate */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <rect x={330} y={520} width={620} height={58} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={358} y={546} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                relay check: leading_zero_bits(id) ≥ 14 ?
              </text>
              <text x={358} y={566} fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
                accepted — one hash to verify
              </text>
              <circle cx={914} cy={549} r={14} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} />
              <path d="M906 549 l6 6 l10 -12" fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} strokeLinecap="round" />
            </g>
          )}
        </g>
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Expensive to make, free to check
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            52,665 hashes for fourteen zero bits — verified here in one
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-13 · ["nonce", "&lt;counter&gt;", "&lt;target&gt;"]
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
