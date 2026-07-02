import { interpolateRgb } from 'd3';
import { Timeline, ease, mulberry32, gaussian, colors } from '../../core';
import type { ChannelRef, SceneState } from '../../core';
import type { ParticlePoint } from '../../primitives';

/**
 * Diffusion — Noise, Forward and Back.
 *
 * Everything hangs off one closed form: for each particle,
 *   x(σ) = √ᾱ·x₀ + √(1−ᾱ)·ε        with ᾱ = 1 − σ²
 * where x₀ (a two-moons sample) and ε (a unit-gaussian offset) are FIXED,
 * precomputed at module scope from one seed. Forward diffusion tweens the σ
 * channel 0→1; reverse tweens it 1→0. No per-frame randomness, no
 * integration — every frame is a pure function of the sampled state, so the
 * whole thing scrubs exactly.
 */

/* ————— stage geometry ————— */

export const CX = 640; // main cloud center (stage px)
export const CY = 320;
export const SCALE = 140; // px per data unit
export const N = 2200;

const NOISE = 0.9; // ε scale in data units (blob std ≈ 126 px)
const JITTER = 0.09; // moon thickness

/** Finale split-screen panels: the SAME point set at two fixed σ values. */
export const PANEL = {
  scale: 60,
  lx: 350, // left panel center (σ = 0, data)
  rx: 930, // right panel center (σ = 1, noise)
  cy: 330,
  w: 340,
  h: 260,
};

/* ————— precomputed data (module scope, seed fixed) ————— */

const rand = mulberry32(7);
const norm = gaussian(rand);

const X0 = new Float64Array(N); // clean two-moons sample (centered)
const Y0 = new Float64Array(N);
const EX = new Float64Array(N); // one fixed unit-gaussian ε per point
const EY = new Float64Array(N);
const FADE = new Float64Array(N); // per-point entrance stagger key

for (let i = 0; i < N; i++) {
  const th = rand() * Math.PI;
  if (i < N / 2) {
    // upper moon: unit semicircle at the origin
    X0[i] = Math.cos(th) - 0.5 + norm() * JITTER;
    Y0[i] = Math.sin(th) - 0.25 + norm() * JITTER;
  } else {
    // lower moon: mirrored semicircle at (1, 0.5)
    X0[i] = 1 - Math.cos(th) - 0.5 + norm() * JITTER;
    Y0[i] = 0.5 - Math.sin(th) - 0.25 + norm() * JITTER;
  }
  EX[i] = norm() * NOISE;
  EY[i] = norm() * NOISE;
  FADE[i] = rand();
}

/** Point color drifts ACCENT → MUTED as σ→1; one shared lookup per frame. */
const ramp = interpolateRgb(colors.ACCENT, colors.MUTED);
const RAMP: string[] = Array.from({ length: 65 }, (_, k) => ramp((0.75 * k) / 64));

/* ————— the score field (precomputed) —————
 * For each grid point g, approximate the score ∇ₓ log p(x) by the mean-shift
 * direction: the vector from g to the Gaussian-KDE-weighted local mean of
 * the CLEAN moon points (bandwidth h = 0.5 data units). Directions are
 * normalized; display length is 10–28 px by clamped magnitude.
 */

export interface ScoreArrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const GRID_COLS = 10;
const GRID_ROWS = 6;
const GRID_X0 = 190;
const GRID_DX = 100;
const GRID_Y0 = 110;
const GRID_DY = 80;
const BANDWIDTH = 0.5;

export const SCORE_ARROWS: ScoreArrow[] = (() => {
  const arrows: ScoreArrow[] = [];
  const h2 = 2 * BANDWIDTH * BANDWIDTH;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const px = GRID_X0 + c * GRID_DX;
      const py = GRID_Y0 + r * GRID_DY;
      const gx = (px - CX) / SCALE;
      const gy = (CY - py) / SCALE;
      let sw = 0;
      let sx = 0;
      let sy = 0;
      for (let i = 0; i < N; i++) {
        const dx = X0[i] - gx;
        const dy = Y0[i] - gy;
        const w = Math.exp(-(dx * dx + dy * dy) / h2);
        sw += w;
        sx += w * X0[i];
        sy += w * Y0[i];
      }
      const mx = sx / sw - gx;
      const my = sy / sw - gy;
      const mag = Math.hypot(mx, my);
      if (mag < 1e-9) continue;
      const len = 10 + 18 * Math.min(1, mag / 1.4); // normalized, capped ≈ 28 px
      arrows.push({
        x1: px,
        y1: py,
        x2: px + (mx / mag) * len,
        y2: py - (my / mag) * len,
      });
    }
  }
  return arrows;
})();

/* ————— finale panel points (fixed σ, so positions are constants) ————— */

const STRIDE = 3; // subsample the cloud for the mini panels

function panelPoints(cx: number, cy: number, useNoise: boolean, color: string): ParticlePoint[] {
  const pts: ParticlePoint[] = [];
  const mx = PANEL.w / 2 - 14;
  const my = PANEL.h / 2 - 14;
  for (let i = 0; i < N; i += STRIDE) {
    const dx = (useNoise ? EX[i] : X0[i]) * PANEL.scale;
    const dy = (useNoise ? EY[i] : Y0[i]) * PANEL.scale;
    if (Math.abs(dx) > mx || Math.abs(dy) > my) continue; // keep inside the frame
    pts.push({ x: cx + dx, y: cy - dy, r: 1.9, color, alpha: 0 });
  }
  return pts;
}

const LEFT_PTS = panelPoints(PANEL.lx, PANEL.cy, false, colors.ACCENT); // σ = 0
const RIGHT_PTS = panelPoints(PANEL.rx, PANEL.cy, true, RAMP[64]); // σ = 1

/* ————— channels + timeline ————— */

export interface DiffusionChannels {
  /** per-point staggered fade-in of the cloud */
  entrance: ChannelRef<number>;
  /** THE noise channel: 0 = data, 1 = pure noise (ᾱ = 1 − σ²) */
  sigma: ChannelRef<number>;
  /** forward-process equation opacity */
  eqU: ChannelRef<number>;
  /** timestep bar reveal */
  barU: ChannelRef<number>;
  /** score arrows draw-on (only ever grows) */
  scoreGrow: ChannelRef<number>;
  /** score arrows opacity: 0 → 1 → whisper → 0 */
  scoreU: ChannelRef<number>;
  /** score equation opacity */
  scoreEqU: ChannelRef<number>;
  /** finale crossfade: main cloud out, split panels in */
  splitU: ChannelRef<number>;
  /** finale add-noise / denoise arrows draw-on */
  linkU: ChannelRef<number>;
}

export function buildScene(): { tl: Timeline; ch: DiffusionChannels } {
  const tl = new Timeline();
  const ch: DiffusionChannels = {
    entrance: tl.channel('entrance', 0),
    sigma: tl.channel('sigma', 0.35), // intro gathers in from mild noise
    eqU: tl.channel('eqU', 0),
    barU: tl.channel('barU', 0),
    scoreGrow: tl.channel('scoreGrow', 0),
    scoreU: tl.channel('scoreU', 0),
    scoreEqU: tl.channel('scoreEqU', 0),
    splitU: tl.channel('splitU', 0),
    linkU: tl.channel('linkU', 0),
  };

  // Beat 1 — the two-moons cloud gathers in (same closed form, σ 0.35 → 0).
  tl.caption({ at: 0.5, dur: 6.4, text: 'Real data lives on a thin manifold — most of space is empty.' });
  tl.tween(ch.entrance, 1, { at: 0.5, dur: 1.8, ease: ease.enter });
  tl.tween(ch.sigma, 0, { at: 0.7, dur: 2.4, ease: ease.move });

  // Beat 2 — forward noising: σ 0 → 1; the timestep bar fills in sync
  // (the marker reads σ directly, so it can't drift out of sync).
  tl.caption({ at: 8.0, dur: 8.8, text: 'Add a little noise, many times, and structure melts away.' });
  tl.tween(ch.barU, 1, { at: 8.0, dur: 1.1, ease: ease.draw });
  tl.tween(ch.eqU, 1, { at: 8.4, dur: 0.7, ease: ease.enter });
  tl.tween(ch.sigma, 1, { at: 9.6, dur: 6.2, ease: ease.move });

  // Beat 3 — freeze at full noise; the score field points back toward data.
  tl.caption({ at: 17.6, dur: 9.4, text: 'A network learns, at every noise level, which way is “less noisy”.' });
  tl.tween(ch.eqU, 0, { at: 17.6, dur: 0.8, ease: ease.move });
  tl.tween(ch.scoreGrow, 1, { at: 18.2, dur: 1.4, ease: ease.draw });
  tl.tween(ch.scoreU, 1, { at: 18.2, dur: 1.0, ease: ease.enter });
  tl.tween(ch.scoreEqU, 1, { at: 19.0, dur: 0.7, ease: ease.enter });

  // Beat 4 — reverse: arrows fade to a whisper; σ 1 → 0; the bar drains.
  tl.caption({ at: 28.2, dur: 8.8, text: 'Generation is the same walk, run backwards.' });
  tl.tween(ch.scoreU, 0.15, { at: 28.2, dur: 1.0, ease: ease.move });
  tl.tween(ch.scoreEqU, 0, { at: 28.6, dur: 0.8, ease: ease.move });
  tl.tween(ch.sigma, 0, { at: 29.4, dur: 6.2, ease: ease.move });
  tl.tween(ch.scoreU, 0, { at: 34.8, dur: 1.2, ease: ease.move });

  // Beat 5 — finale: the SAME points at two fixed σ values, side by side.
  tl.caption({ at: 38.0, dur: 14.0, text: 'Sampling is denoising.' });
  tl.tween(ch.splitU, 1, { at: 38.0, dur: 1.3, ease: ease.move });
  tl.tween(ch.barU, 0, { at: 38.0, dur: 0.9, ease: ease.move });
  tl.tween(ch.linkU, 1, { at: 39.5, dur: 1.1, ease: ease.draw });
  tl.hold(0, 55); // final hold

  return { tl, ch };
}

/* ————— per-frame particle compute (tight: no allocation) ————— */

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

// Reused every frame: 2200 preallocated main points + a shared output array.
const MAIN_PTS: ParticlePoint[] = Array.from({ length: N }, () => ({
  x: 0,
  y: 0,
  r: 2.2,
  alpha: 0,
  color: colors.ACCENT,
}));
const OUT: ParticlePoint[] = [];

/**
 * The whole mechanic: read σ, apply the closed form, map through stage
 * scales. Called from ParticleCloud's compute().
 */
export function computeParticles(s: SceneState, ch: DiffusionChannels): ParticlePoint[] {
  const sigma = clamp01(s.get(ch.sigma));
  const entrance = s.get(ch.entrance);
  const splitU = clamp01(s.get(ch.splitU));

  const a = Math.sqrt(1 - sigma * sigma); // √ᾱ
  const b = sigma; // √(1−ᾱ)
  const color = RAMP[Math.round(sigma * 64)];
  const mainA = 1 - splitU;

  OUT.length = 0;

  if (mainA > 0.002) {
    for (let i = 0; i < N; i++) {
      const p = MAIN_PTS[i];
      p.x = CX + (a * X0[i] + b * EX[i]) * SCALE;
      p.y = CY - (a * Y0[i] + b * EY[i]) * SCALE;
      p.color = color;
      p.alpha = 0.8 * mainA * clamp01((entrance - FADE[i] * 0.45) / 0.55);
      OUT.push(p);
    }
  }

  if (splitU > 0.002) {
    const pa = 0.85 * splitU;
    for (const p of LEFT_PTS) {
      p.alpha = pa;
      OUT.push(p);
    }
    for (const p of RIGHT_PTS) {
      p.alpha = pa;
      OUT.push(p);
    }
  }

  return OUT;
}
