/**
 * The master limiter: a look-ahead brickwall with FINITE memory, shared by the live graph, offline export chunks
 * and the node tests, so a mix rendered in 60 s chunks is sample-identical to one rendered in one go.
 *
 *   const k = createLimiterKernel({ sampleRate: 48000, ceilingDb: -1.5 })
 *   k.process(inL, inR, outL, outR, n)       // streaming, any block size; output is delayed by k.latency frames
 *   k.setCeiling(-1)                         // live change (the next samples use it)
 *   LIMITER_WORKLET_URL()                    // a Blob URL registering the same kernel as AudioWorklet 'orly-limiter'
 *
 * Why not WebAudio's DynamicsCompressor: its detector smooths with an exponential release, so its state at any
 * moment depends on the WHOLE past signal. Two export chunks that start at different times therefore disagree
 * wherever the limiter is working (up to ~0.8 dB measured on the pilot film), and live playback started
 * mid-passage differs from the export the same way. It also is not a true brickwall (it overshoots its threshold).
 *
 * This kernel's gain at sample n is a pure function of the input in [n − R, n + L]:
 *   req[k]  = min(1, ceiling / max(|L[k]|, |R[k]|))                  linked stereo: the gain sample k needs
 *   att[n]  = min over k ∈ [n, n+L] of req[k] + (k − n)/L             look-ahead: a straight ramp down into each peak
 *   g[n]    = min(1, min over k ∈ [n−R, n] of att[k] + (n − k)/R)    release: a straight ramp back up to unity
 *   out[n]  = in[n] · g[n],  then clamped to ±ceiling (float rounding)
 * so |out| ≤ ceiling exactly, the gain never jumps (it moves at most 1/L per sample down, 1/R up), and a chunk
 * rendered with a pre-roll ≥ R samples (and a post-roll of L) matches a continuous render bit for bit. Both sliding
 * minima are monotonic deques over ring buffers: O(1) amortised per sample. The ramps add `k/L` (`k/R`) offsets
 * so each window minimum is a minimum of FIXED values: min_k (req[k] + k/L) − n/L.
 *
 * The kernel is written as one self-contained function (no imports, no closures over module scope, plain ES2015)
 * because its source text is also the AudioWorklet module's: `createLimiterKernel.toString()`.
 */

export interface LimiterOptions {
  sampleRate: number;
  /** output ceiling (dBFS, ≤ 0) */
  ceilingDb: number;
  /** look-ahead / attack ramp (s); default 0.005 */
  lookahead?: number;
  /** release ramp from full reduction back to unity (s); default 0.08 */
  release?: number;
}

export interface LimiterKernel {
  /** frames the output lags the input (the look-ahead) */
  readonly latency: number;
  /** frames of history a sample's gain depends on: a chunk's pre-roll must be at least this long */
  readonly memory: number;
  process(inL: Float32Array, inR: Float32Array, outL: Float32Array, outR: Float32Array, n: number): void;
  setCeiling(db: number): void;
}

export const LIMITER_LOOKAHEAD = 0.005;
export const LIMITER_RELEASE = 0.08;

/** the limiter kernel (self-contained: its source is also the worklet's; see the header) */
export function createLimiterKernel(opts: LimiterOptions): LimiterKernel {
  var sr = opts.sampleRate;
  var L = Math.max(1, Math.round(sr * (opts.lookahead === undefined ? 0.005 : opts.lookahead)));
  var R = Math.max(1, Math.round(sr * (opts.release === undefined ? 0.08 : opts.release)));
  var ceiling = Math.pow(10, Math.min(0, opts.ceilingDb) / 20);
  // ring sizes: powers of two ≥ the window + 1 (indices are absolute sample counters masked into the ring)
  var size = function (n: number): number {
    var s = 1;
    while (s < n + 2) s *= 2;
    return s;
  };
  var DL = size(L + 1);
  var DR = size(R + 1);
  var delayL = new Float32Array(DL);
  var delayR = new Float32Array(DL);
  // attack window: deque of absolute indices k with increasing values req[k] + k/L
  var aIdx = new Float64Array(DL);
  var aVal = new Float64Array(DL);
  var aHead = 0;
  var aTail = 0;
  // release window: deque over att[k] − k/R (increasing values)
  var rIdx = new Float64Array(DR);
  var rVal = new Float64Array(DR);
  var rHead = 0;
  var rTail = 0;
  var i = 0; // absolute input sample counter
  var invL = 1 / L;
  var invR = 1 / R;
  // the deques hold offsets relative to `base` so k/L stays small however long the stream runs
  var base = 0;
  var rebase = function (): void {
    // shift every stored value by the same amount (keeps order): v(k) = req + (k − base)/L
    var shift = 1 << 20;
    for (var q = aHead; q !== aTail; q = (q + 1) & (DL - 1)) aVal[q] -= shift * invL;
    for (var q2 = rHead; q2 !== rTail; q2 = (q2 + 1) & (DR - 1)) rVal[q2] += shift * invR;
    base += shift;
  };
  return {
    latency: L,
    memory: R + L,
    setCeiling: function (db: number): void {
      ceiling = Math.pow(10, Math.min(0, db) / 20);
    },
    process: function (inL: Float32Array, inR: Float32Array, outL: Float32Array, outR: Float32Array, n: number): void {
      for (var j = 0; j < n; j++) {
        if (i - base >= 1 << 21) rebase();
        var xl = inL[j];
        var xr = inR[j];
        var pk = Math.max(Math.abs(xl), Math.abs(xr));
        var req = pk > ceiling ? ceiling / pk : 1;
        // push req[i] into the attack window (values req[k] + (k − base)/L)
        var v = req + (i - base) * invL;
        while (aTail !== aHead && aVal[(aTail - 1) & (DL - 1)] >= v) aTail = (aTail - 1) & (DL - 1);
        aIdx[aTail] = i;
        aVal[aTail] = v;
        aTail = (aTail + 1) & (DL - 1);
        delayL[i & (DL - 1)] = xl;
        delayR[i & (DL - 1)] = xr;
        // the output sample is m = i − L: its attack window is [m, m + L] = [i − L, i]
        var m = i - L;
        while (aIdx[aHead] < m) aHead = (aHead + 1) & (DL - 1);
        var att = aVal[aHead] - (m - base) * invL;
        if (att > 1) att = 1;
        // release window over att[k] for k ∈ [m − R, m]: values att[k] − (k − base)/R
        var w = att - (m - base) * invR;
        while (rTail !== rHead && rVal[(rTail - 1) & (DR - 1)] >= w) rTail = (rTail - 1) & (DR - 1);
        rIdx[rTail] = m;
        rVal[rTail] = w;
        rTail = (rTail + 1) & (DR - 1);
        while (rIdx[rHead] < m - R) rHead = (rHead + 1) & (DR - 1);
        var g = rVal[rHead] + (m - base) * invR;
        if (g > 1) g = 1;
        var yl = 0;
        var yr = 0;
        if (m >= 0) {
          yl = delayL[m & (DL - 1)] * g;
          yr = delayR[m & (DL - 1)] * g;
          if (yl > ceiling) yl = ceiling;
          else if (yl < -ceiling) yl = -ceiling;
          if (yr > ceiling) yr = ceiling;
          else if (yr < -ceiling) yr = -ceiling;
        }
        outL[j] = yl;
        outR[j] = yr;
        i++;
      }
    },
  };
}

/** the AudioWorklet processor name the kernel registers as */
export const LIMITER_PROCESSOR = 'orly-limiter';

let workletUrl: string | null = null;

/**
 * A Blob URL of an AudioWorklet module that registers `orly-limiter` around the same kernel source (created once).
 * processorOptions: { sampleRate, ceilingDb, lookahead?, release? }; port message { ceilingDb } changes the ceiling.
 * Two-channel in, two-channel out; a mono input is treated as both channels.
 */
export function limiterWorkletUrl(): string {
  if (workletUrl) return workletUrl;
  const src = `const createLimiterKernel = ${createLimiterKernel.toString()};
class OrlyLimiter extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.k = createLimiterKernel({ sampleRate: o.sampleRate || sampleRate, ceilingDb: o.ceilingDb || 0, lookahead: o.lookahead, release: o.release });
    this.port.onmessage = (e) => { if (e.data && typeof e.data.ceilingDb === 'number') this.k.setCeiling(e.data.ceilingDb); };
    this.zero = new Float32Array(128);
  }
  process(inputs, outputs) {
    const out = outputs[0];
    const n = out[0].length;
    if (this.zero.length < n) this.zero = new Float32Array(n);
    const inp = inputs[0] || [];
    const l = inp[0] || this.zero;
    const r = inp[1] || l;
    this.k.process(l, r, out[0], out[1] || new Float32Array(n), n);
    return true;
  }
}
registerProcessor(${JSON.stringify(LIMITER_PROCESSOR)}, OrlyLimiter);
`;
  workletUrl = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
  return workletUrl;
}
