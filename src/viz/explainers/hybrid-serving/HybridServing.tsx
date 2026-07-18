// Explained: Hybrid Attention — chapter 5: what the hybrid buys at serve
// time. Pure KV-budget arithmetic at module scope, same model as chapter 3:
// 48 layers, 8 KV heads, head dim 128, fp16 → 192 KiB of cache per token,
// so one 128k-token sequence costs 24 GiB of cache under full attention and
// 3.04 GiB under a one-in-eight hybrid (plus ~47 MiB of fixed recurrent
// state). On an 80 GiB accelerator holding 24 GiB of weights, the leftover
// 56 GiB fits 2 full-attention sequences versus 18 hybrid ones — a 9x
// concurrency win from the same card. Bridges to Explained: Inference
// (chapter on the KV cache) without re-teaching it.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// Real arithmetic, module scope.
// ---------------------------------------------------------------------------

const LAYERS = 48;
const KV_PER_TOK_KIB = (2 * 8 * 128 * 2 * LAYERS) / 1024; // 192 KiB per token, full stack
const T_CTX = 131072;
const FULL_SEQ_GIB = (KV_PER_TOK_KIB * T_CTX) / 2 ** 20; // 24.0 GiB
const FRAC = 1 / 8;
const SSM_GIB = (128 * 4096 * 2 * LAYERS) / 2 ** 30; // ≈ 0.047 GiB fixed
const HYB_SEQ_GIB = FULL_SEQ_GIB * FRAC + SSM_GIB; // ≈ 3.05 GiB

const HBM_GIB = 80;
const WEIGHTS_GIB = 24; // ~12B params, fp16
const FREE_GIB = HBM_GIB - WEIGHTS_GIB; // 56
const FULL_BATCH = Math.floor(FREE_GIB / FULL_SEQ_GIB); // 2
const HYB_BATCH = Math.floor(FREE_GIB / HYB_SEQ_GIB); // 18
// caption checks: 24.0 GiB, 3.0 GiB, batch 2 vs 18, "nine times".

// ---------------------------------------------------------------------------
// Layout: one big HBM bar (the persistent object), refilled across beats.
// ---------------------------------------------------------------------------

const BAR_X0 = 160;
const BAR_Y0 = 150;
const BAR_W = 960;
const BAR_H = 120;
const gibW = (g: number): number => (g / HBM_GIB) * BAR_W;

const CAM_BAR: CameraState = { x: 640, y: 240, k: 1.25 };
const CAM_COUNT: CameraState = { x: 640, y: 430, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline.
// ---------------------------------------------------------------------------

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  barU: ChannelRef<number>;
  wU: ChannelRef<number>;
  fullSeqs: ChannelRef<number>;
  hybridU: ChannelRef<number>;
  hybSeqs: ChannelRef<number>;
  countU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const barU = tl.channel('barU', 0);
  const wU = tl.channel('wU', 0);
  const fullSeqs = tl.channel('fullSeqs', 0);
  const hybridU = tl.channel('hybridU', 0);
  const hybSeqs = tl.channel('hybSeqs', 0);
  const countU = tl.channel('countU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the card
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Serving is where the hybrid design cashes out. Here is one accelerator with eighty gigabytes of fast memory, about to serve long conversations.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BAR, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(barU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 6.3,
    dur: 5.2,
    text: 'The model weights claim their share first: twenty four gigabytes, and they never move. Everything else is working room for caches.',
  });
  tl.tween(wU, 1, { at: 6.8, dur: 1.2, ease: ease.move });
  tl.hold(11.7, 0.6);

  // Beat 2 — full attention fills it fast
  tl.caption({
    at: 12.3,
    dur: 6.2,
    text: 'Under full attention, every sequence at a hundred twenty eight thousand tokens drags twenty four gigabytes of key value cache behind it. Watch the room disappear: two conversations, and the card is full.',
  });
  tl.tween(fullSeqs, FULL_BATCH, { at: 13.2, dur: 3.6, ease: ease.move });
  tl.hold(18.7, 0.7);

  // Beat 3 — swap in the hybrid
  tl.caption({
    at: 19.4,
    dur: 5.8,
    text: 'Now swap in the one-in-eight hybrid from the last two chapters. Each sequence carries three gigabytes of cache instead of twenty four, plus a recurrent state so small it barely registers.',
  });
  tl.tween(fullSeqs, 0, { at: 19.8, dur: 0.9, ease: ease.move });
  tl.tween(hybridU, 1, { at: 20.4, dur: 0.8, ease: ease.enter });
  tl.tween(hybSeqs, HYB_BATCH, { at: 21.0, dur: 4.4, ease: ease.move });
  tl.caption({
    at: 25.4,
    dur: 5.4,
    text: 'The same fifty six gigabytes of working room now holds eighteen conversations instead of two. Nine times the concurrency, from the same silicon.',
  });
  tl.hold(31.1, 0.7);

  // Beat 4 — why this compounds
  tl.caption({
    at: 31.8,
    dur: 6.0,
    text: 'And the win compounds. Decoding is memory-bandwidth bound: every generated token must stream the cache through the chip. A cache one eighth the size means each token reads one eighth the bytes.',
  });
  tl.tween(cam, CAM_COUNT, { at: 32.0, dur: 1.4, ease: ease.move });
  tl.tween(countU, 1, { at: 33.0, dur: 1.0, ease: ease.enter });
  tl.hold(38.0, 0.6);

  // Beat 5 — recap of the book
  tl.caption({
    at: 38.6,
    dur: 6.2,
    text: 'That completes the argument of this book. Two memories with opposite price tags. Layer types that are specialists, not rivals. A ratio the field sets low, placed where refined queries exist.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 38.8, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 40.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.3, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 45.2,
    dur: 5.6,
    text: 'And at serve time, the payoff: nine times the conversations per card. If you want the full story of that serving machinery, the inference book on this shelf picks it up from here.',
  });
  tl.hold(51.0, 1.2);

  return { tl, cam, titleU, barU, wU, fullSeqs, hybridU, hybSeqs, countU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/hybrid-serving/overrides.json',
  slug: 'hybrid-serving',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const barU = s.get(scene.barU);
  const wU = s.get(scene.wU);
  const fullSeqs = s.get(scene.fullSeqs);
  const hybridU = s.get(scene.hybridU);
  const hybSeqs = s.get(scene.hybSeqs);
  const countU = s.get(scene.countU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const weightsW = gibW(WEIGHTS_GIB) * wU;
  const nFull = fullSeqs;
  const nHyb = hybSeqs;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the HBM bar */}
          <g opacity={barU}>
            <text x={BAR_X0} y={BAR_Y0 - 34} fill={colors.TEXT} fontSize={19}>
              one accelerator — 80 GiB of fast memory
            </text>
            <rect x={BAR_X0} y={BAR_Y0} width={BAR_W} height={BAR_H} rx={10} fill={colors.PANEL} opacity={0.7} stroke={colors.GRID} strokeWidth={1.2} />
            {/* GiB ticks */}
            {[0, 20, 40, 60, 80].map((gv) => (
              <g key={gv}>
                <line x1={BAR_X0 + gibW(gv)} y1={BAR_Y0 + BAR_H} x2={BAR_X0 + gibW(gv)} y2={BAR_Y0 + BAR_H + 6} stroke={colors.GRID} />
                <text x={BAR_X0 + gibW(gv)} y={BAR_Y0 + BAR_H + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {gv} GiB
                </text>
              </g>
            ))}

            {/* weights block */}
            {wU > 0 && (
              <g>
                <rect x={BAR_X0} y={BAR_Y0} width={weightsW} height={BAR_H} rx={10} fill={colors.SECONDARY} opacity={0.75} />
                <text x={BAR_X0 + weightsW / 2} y={BAR_Y0 + BAR_H / 2 + 5} textAnchor="middle" fill={colors.BG} fontSize={15} fontWeight={600} opacity={wU}>
                  weights 24 GiB
                </text>
              </g>
            )}

            {/* full-attention sequences */}
            {nFull > 0.01 &&
              Array.from({ length: Math.ceil(nFull) }, (_, i) => {
                const u = Math.max(0, Math.min(1, nFull - i));
                const x = BAR_X0 + gibW(WEIGHTS_GIB) + gibW(FULL_SEQ_GIB) * i;
                const w = gibW(FULL_SEQ_GIB) * u;
                return (
                  <g key={i}>
                    <rect x={x} y={BAR_Y0} width={w} height={BAR_H} fill={colors.ACCENT} opacity={0.7} stroke={colors.BG} strokeWidth={1.5} />
                    {u > 0.7 && (
                      <text x={x + gibW(FULL_SEQ_GIB) / 2} y={BAR_Y0 + BAR_H / 2 + 5} textAnchor="middle" fill={colors.BG} fontSize={13} fontWeight={600}>
                        seq {i + 1}: 24 GiB
                      </text>
                    )}
                  </g>
                );
              })}

            {/* hybrid sequences */}
            {hybridU > 0 &&
              nHyb > 0.01 &&
              Array.from({ length: Math.ceil(nHyb) }, (_, i) => {
                const u = Math.max(0, Math.min(1, nHyb - i));
                const x = BAR_X0 + gibW(WEIGHTS_GIB) + gibW(HYB_SEQ_GIB) * i;
                const w = gibW(HYB_SEQ_GIB) * u;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={BAR_Y0}
                    width={Math.max(0.5, w - 2)}
                    height={BAR_H}
                    fill={colors.POSITIVE}
                    opacity={0.75}
                    stroke={colors.BG}
                    strokeWidth={1.2}
                  />
                );
              })}

            {/* running labels under the bar */}
            {nFull > 0.01 && (
              <text x={BAR_X0} y={BAR_Y0 + BAR_H + 52} fill={colors.ACCENT} fontSize={15}>
                full attention: {Math.floor(nFull + 1e-6)} sequences fit — 24 GiB of cache each
              </text>
            )}
            {hybridU > 0 && nHyb > 0.01 && (
              <text x={BAR_X0} y={BAR_Y0 + BAR_H + 52} fill={colors.POSITIVE} fontSize={15}>
                hybrid, one attention layer in eight: {Math.floor(nHyb + 1e-6)} sequences — {HYB_SEQ_GIB.toFixed(1)} GiB each
              </text>
            )}
          </g>

          {/* the arithmetic, on screen as math */}
          <g opacity={barU}>
            <MathLabel
              tex="192\ \text{KiB/token} \times 128\text{k} = 24\ \text{GiB}"
              x={BAR_X0}
              y={370}
              fontSize={17}
              color={colors.ACCENT}
              opacity={barU}
            />
            <MathLabel
              tex="f=\tfrac{1}{8}:\ 3.0\ \text{GiB} + 47\ \text{MiB state}"
              x={BAR_X0 + 480}
              y={370}
              fontSize={17}
              color={colors.POSITIVE}
              opacity={hybridU}
            />
          </g>

          {/* bandwidth beat */}
          {countU > 0 && (
            <g opacity={countU}>
              <text x={BAR_X0} y={452} fill={colors.TEXT} fontSize={16}>
                and every decoded token streams its cache through the chip
              </text>
              <rect x={BAR_X0} y={470} width={gibW(24) * 2} height={16} rx={4} fill={colors.ACCENT} opacity={0.7} />
              <text x={BAR_X0 + gibW(24) * 2 + 10} y={483} fill={colors.ACCENT} fontSize={12}>
                full: 24 GiB read per token
              </text>
              <rect x={BAR_X0} y={496} width={gibW(3) * 2} height={16} rx={4} fill={colors.POSITIVE} opacity={0.8} />
              <text x={BAR_X0 + gibW(3) * 2 + 10} y={509} fill={colors.POSITIVE} fontSize={12}>
                hybrid: 3 GiB — one eighth the bytes, one eighth the stall
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed title */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The serve-time payoff
        </text>
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={220} rx={14} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={640} y={278} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Nine times the conversations per card.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Two memories · specialists, not rivals · a low ratio, placed late ·
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            2 sequences at 24 GiB each → 18 at 3 GiB each.
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={15}>
            The serving machinery itself: Explained — Inference, on this shelf.
          </text>
        </g>
      )}
    </>
  );
}

export function HybridServing() {
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
