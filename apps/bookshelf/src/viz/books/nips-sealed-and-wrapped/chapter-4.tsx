// Sealed and Wrapped — chapter 4: the padding staircase (NIP-44 calc_padded_len).
// The padded-length function is implemented EXACTLY as specified and the
// staircase plot is drawn from it. A message grows character by character and
// its padded size jumps only at bucket edges; an observer's histogram shows
// many true lengths collapsing into a few buckets. Honest limits close the
// chapter (the spec's own "limited message size leak").
import { CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import overrides from './chapter-4.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// calc_padded_len — verbatim from NIP-44.
// ---------------------------------------------------------------------------
export function calcPaddedLen(len: number): number {
  if (len <= 32) return 32;
  const nextPower = 1 << (Math.floor(Math.log2(len - 1)) + 1);
  const chunk = nextPower <= 256 ? 32 : nextPower / 8;
  return chunk * (Math.floor((len - 1) / chunk) + 1);
}
// spot checks: 1→32, 32→32, 33→64, 257→320 (next_power 512 → chunk 64 → 5 chunks)
if (calcPaddedLen(1) !== 32 || calcPaddedLen(32) !== 32 || calcPaddedLen(33) !== 64 || calcPaddedLen(257) !== 320) {
  throw new Error('calc_padded_len self-test failed');
}

// staircase samples for the plot (1..520 bytes)
const X_MAX = 520;
const SAMPLES = Array.from({ length: X_MAX }, (_, i) => calcPaddedLen(i + 1));
const Y_MAX = Math.max(...SAMPLES) * 1.15;

const PLOT = { x: 150, y: 120, w: 700, h: 360 };
const px = (len: number) => PLOT.x + (len / X_MAX) * PLOT.w;
const py = (v: number) => PLOT.y + PLOT.h - (v / Y_MAX) * PLOT.h;

// the growing message demo
const DEMO_MSG = 'meet me at the old bridge at midnight, bring the key';
// observer histogram: 24 deterministic message lengths → buckets
const OBS_LENS = [3, 9, 14, 20, 26, 31, 33, 41, 47, 58, 64, 70, 88, 96, 120, 130, 150, 190, 220, 260, 300, 340, 420, 500];
const BUCKETS = [...new Set(OBS_LENS.map(calcPaddedLen))].sort((a, b) => a - b);

const CAM_PLOT: CameraState = { x: 500, y: 300, k: 1.15 };
const CAM_OBS: CameraState = { x: 900, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  stairU: ChannelRef<number>;
  growN: ChannelRef<number>;
  bucketU: ChannelRef<number>;
  obsU: ChannelRef<number>;
  minU: ChannelRef<number>;
  limitU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('axesU', 0);
  const stairU = tl.channel('stairU', 0);
  const growN = tl.channel('growN', 0);
  const bucketU = tl.channel('bucketU', 0);
  const obsU = tl.channel('obsU', 0);
  const minU = tl.channel('minU', 0);
  const limitU = tl.channel('limitU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — why length leaks.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Even a perfectly encrypted message leaks one thing: its size. Yes and I never loved you are different lengths, and a patient observer can tell them apart without decrypting anything.',
  });
  tl.tween(axesU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.1, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the staircase draws.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'So nip forty-four never sends true lengths. This staircase is the actual padding function from the spec, computed live: every true length on the floor is rounded up to the step above it.',
  });
  tl.tween(stairU, 1, { at: 7.6, dur: 2.6, ease: ease.draw });
  tl.hold(13.4, 0.7);

  // Beat 3 — a message grows.
  tl.caption({
    at: 14.1,
    dur: 6.6,
    text: 'Watch a message being typed. For thirty-two bytes nothing changes — the smallest bucket swallows it whole. Then one more character, and the padded size jumps a full step to sixty-four.',
  });
  tl.tween(growN, DEMO_MSG.length, { at: 14.7, dur: 4.6, ease: ease.linear });
  tl.hold(20.9, 0.7);

  // Beat 4 — buckets, not lengths.
  tl.caption({
    at: 21.6,
    dur: 6.0,
    text: 'The observer never sees the floor of the staircase — only the steps. Buckets are powers-of-two aligned: small messages share size thirty-two, then sixty-four, then coarser chunks as messages grow.',
  });
  tl.tween(bucketU, 1, { at: 22.4, dur: 1.6, ease: ease.move });
  tl.hold(27.8, 0.7);

  // Beat 5 — the observer's histogram.
  tl.caption({
    at: 28.5,
    dur: 6.4,
    text: 'Here are twenty-four different messages as the eavesdropper sees them. Twenty-four true lengths collapse into just a handful of observed sizes — the crowd is the camouflage.',
  });
  tl.tween(cam, CAM_OBS, { at: 28.7, dur: 1.5, ease: ease.move });
  tl.tween(obsU, 1, { at: 29.5, dur: 2.8, ease: ease.linear });
  tl.hold(35.1, 0.7);

  // Beat 6 — the floor price.
  tl.caption({
    at: 35.8,
    dur: 5.6,
    text: 'There is a floor price: version byte, nonce, mac, and the smallest bucket mean every payload is at least ninety-nine bytes — one hundred thirty-two characters of base sixty-four.',
  });
  tl.tween(minU, 1, { at: 36.6, dur: 0.8, ease: ease.enter });
  tl.hold(41.6, 0.7);

  // Beat 7 — honest limits.
  tl.caption({
    at: 42.3,
    dur: 6.0,
    text: 'And the spec is honest about the residue: padding only partially masks length — a novel still looks bigger than a yes. Perfect size privacy is not on offer; a cheaper signal is.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 42.5, dur: 1.4, ease: ease.move });
  tl.tween(limitU, 1, { at: 43.3, dur: 0.9, ease: ease.enter });
  tl.hold(48.5, 0.7);

  // Beat 8 — close.
  tl.caption({
    at: 49.2,
    dur: 5.2,
    text: 'The letter is sealed and its size is blurred. One leak remains — the envelope itself still names the sender. The final chapter makes even that disappear.',
  });
  tl.tween(dimU, 1, { at: 49.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.6, dur: 1.0, ease: ease.enter });
  tl.hold(54.6, 1.2);

  return { tl, cam, axesU, stairU, growN, bucketU, obsU, minU, limitU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-sealed-and-wrapped/chapter-4.overrides.json',
  slug: 'books/nips-sealed-and-wrapped/chapter-4',
};

const stairPath = (u: number): string => {
  const n = Math.max(2, Math.round(X_MAX * u));
  let d = `M${px(1)},${py(SAMPLES[0])}`;
  for (let i = 1; i < n; i++) {
    if (SAMPLES[i] !== SAMPLES[i - 1]) d += ` L${px(i + 1)},${py(SAMPLES[i - 1])} L${px(i + 1)},${py(SAMPLES[i])}`;
  }
  d += ` L${px(n)},${py(SAMPLES[n - 1])}`;
  return d;
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const stairU = s.get(scene.stairU);
  const growN = Math.floor(s.get(scene.growN));
  const bucketU = s.get(scene.bucketU);
  const obsU = s.get(scene.obsU);
  const minU = s.get(scene.minU);
  const limitU = s.get(scene.limitU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const typedLen = Math.max(0, growN);
  const padded = typedLen > 0 ? calcPaddedLen(typedLen) : 32;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* axes */}
          {axesU > 0 && (
            <g opacity={axesU}>
              <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w * axesU} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x} y2={PLOT.y + PLOT.h - PLOT.h * axesU} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={PLOT.x + PLOT.w - 4} y={PLOT.y + PLOT.h + 26} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                true length (bytes)
              </text>
              <text x={PLOT.x - 10} y={PLOT.y - 10} fill={colors.MUTED} fontSize={12}>
                padded length
              </text>
              {[32, 64, 128, 256, 480].map((v) => (
                <text key={v} x={PLOT.x - 8} y={py(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                  {v}
                </text>
              ))}
            </g>
          )}

          {/* identity line for contrast + staircase */}
          {stairU > 0 && (
            <g>
              <line x1={px(1)} y1={py(1)} x2={px(X_MAX * Math.min(1, stairU))} y2={py(X_MAX * Math.min(1, stairU))} stroke={colors.GRID} strokeWidth={1} strokeDasharray="3 5" opacity={0.7} />
              <path d={stairPath(stairU)} fill="none" stroke={colors.ACCENT} strokeWidth={2.2} />
              <text x={px(X_MAX) - 6} y={py(SAMPLES[X_MAX - 1]) - 10} textAnchor="end" fill={colors.ACCENT} fontSize={12} opacity={clamp01(stairU * 2 - 1)}>
                calc_padded_len — the real function
              </text>
            </g>
          )}

          {/* the growing message */}
          {growN > 0 && (
            <g>
              <circle cx={px(typedLen)} cy={py(padded)} r={7} fill={colors.WARM} />
              <line x1={px(typedLen)} y1={PLOT.y + PLOT.h} x2={px(typedLen)} y2={py(padded)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 4" opacity={0.6} />
              <text x={PLOT.x} y={PLOT.y + PLOT.h + 52} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                "{DEMO_MSG.slice(0, typedLen)}"
              </text>
              <text x={PLOT.x} y={PLOT.y + PLOT.h + 74} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                typed: {typedLen} B → sent: {padded} B
              </text>
            </g>
          )}

          {/* bucket edges */}
          {bucketU > 0 && (
            <g opacity={bucketU}>
              {[32, 64, 96, 128, 160, 192, 224, 256, 320, 384, 448].map((b) => (
                <line key={b} x1={PLOT.x} y1={py(b)} x2={PLOT.x + PLOT.w} y2={py(b)} stroke={colors.SECONDARY} strokeWidth={0.7} strokeDasharray="2 6" opacity={0.5} />
              ))}
              <text x={PLOT.x + PLOT.w - 4} y={py(448) - 8} textAnchor="end" fill={colors.SECONDARY} fontSize={11}>
                the only sizes an observer ever sees
              </text>
            </g>
          )}

          {/* observer histogram */}
          {obsU > 0 && (
            <g>
              <text x={950} y={150} fill={colors.NEGATIVE} fontSize={14} fontWeight={600} opacity={Math.min(1, obsU * 3)}>
                observer’s view
              </text>
              <text x={950} y={170} fill={colors.MUTED} fontSize={11} opacity={Math.min(1, obsU * 3)}>
                {OBS_LENS.length} messages → {BUCKETS.length} sizes
              </text>
              {BUCKETS.map((b, i) => {
                const count = OBS_LENS.filter((l) => calcPaddedLen(l) === b).length;
                const u = clamp01(obsU * BUCKETS.length - i);
                if (u <= 0) return null;
                const y = 200 + i * 44;
                return (
                  <g key={b} opacity={u}>
                    <text x={1000} y={y + 14} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {b} B
                    </text>
                    <rect x={1010} y={y} width={count * 22 * u} height={20} rx={4} fill={colors.NEGATIVE} opacity={0.55} />
                    <text x={1016 + count * 22 * u} y={y + 14} fill={colors.NEGATIVE} fontSize={11} fontFamily="monospace">
                      ×{count}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* floor price */}
          {minU > 0 && (
            <g opacity={minU}>
              <rect x={905} y={470} width={300} height={56} rx={9} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={1055} y={493} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                min payload: 99 bytes decoded
              </text>
              <text x={1055} y={513} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                1 + 32 + 34 + 32 · base64 ≥ 132 chars
              </text>
            </g>
          )}

          {/* honest limit */}
          {limitU > 0 && (
            <text x={PLOT.x} y={560} fill={colors.MUTED} fontSize={13} opacity={limitU}>
              spec’s own words: a “limited message size leak” remains — buckets blur length, they don’t erase it
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Hide in a bucket, not in a haystack
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            true lengths are rounded up the staircase; observers see steps, not floors
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-44 · calc_padded_len · min 99 B · power-of-two chunks
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
