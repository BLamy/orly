// Nostr Implementation Possibilities №6 — Proof of Work, chapter 5.
// The economics: cost per note = 2^difficulty hashes. One curve, two very
// different bills — a person pays it once, a spam farm pays it per message.
// The relay knob is NIP-11's limitation.min_pow_difficulty (book 5's info
// document), which is how a relay actually publishes its price. All curve
// values are the exact powers of two.
import {
  CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// cost curve: x = difficulty 0..24, y = log2 scale of hashes (which is x) —
// we PLOT the log so the exponential reads as the straight wall it is, and
// print the true 2^d numbers alongside.
const PLOT = { x: 220, y: 140, w: 560, h: 330 };
const D_MAX = 24;
const px = (d: number) => PLOT.x + (d / D_MAX) * PLOT.w;
const py = (d: number) => PLOT.y + PLOT.h - (d / D_MAX) * PLOT.h;
const fmtHashes = (d: number): string => {
  const v = 2 ** d;
  if (v >= 1e9) return `${(v / 1e9).toFixed(v >= 1e10 ? 0 : 1)} billion`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e7 ? 0 : 1)} million`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} thousand`;
  return String(v);
};

const SPAM_NOTES = 10000;

const CAM_PLOT: CameraState = { x: 520, y: 320, k: 1.18 };
const CAM_BILLS: CameraState = { x: 900, y: 330, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  axesU: ChannelRef<number>;
  curveU: ChannelRef<number>;
  dialD: ChannelRef<number>; // the difficulty dial, 0..20
  billsU: ChannelRef<number>;
  knobU: ChannelRef<number>;
  seriesU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('axesU', 0);
  const curveU = tl.channel('curveU', 0);
  const dialD = tl.channel('dialD', 0);
  const billsU = tl.channel('billsU', 0);
  const knobU = tl.channel('knobU', 0);
  const seriesU = tl.channel('seriesU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the price curve.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Time to ask what all this hashing actually buys. The price of a note is two to the power of the difficulty — each extra bit doubles the bill. Here is that wall, one doubling at a time.',
  });
  tl.tween(axesU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(curveU, 1, { at: 2.2, dur: 2.4, ease: ease.draw });
  tl.hold(6.3, 0.7);

  // Beat 2 — slide the dial.
  tl.caption({
    at: 7.0,
    dur: 6.2,
    text: 'Slide the difficulty and read the bill. Ten bits: a thousand hashes, unnoticeable. Sixteen: sixty five thousand, a blink. Twenty: a million hashes — about a second of one phone core.',
  });
  tl.tween(dialD, 20, { at: 7.6, dur: 4.6, ease: ease.linear });
  tl.hold(13.4, 0.7);

  // Beat 3 — two customers.
  tl.caption({
    at: 14.1,
    dur: 6.4,
    text: 'Now hand that same price to two different customers. A person posting one note pays it once and never notices. A spam farm posting ten thousand notes pays it ten thousand times.',
  });
  tl.tween(cam, CAM_BILLS, { at: 14.3, dur: 1.5, ease: ease.move });
  tl.tween(billsU, 1, { at: 15.0, dur: 2.2, ease: ease.move });
  tl.hold(20.7, 0.7);

  // Beat 4 — the asymmetry in numbers.
  tl.caption({
    at: 21.4,
    dur: 6.2,
    text: 'At twenty bits that is one second of your afternoon versus three hours of the farm’s day, every day, forever. The tax is flat — which makes it negligible for speech and ruinous for volume.',
  });
  tl.hold(27.6, 0.8);

  // Beat 5 — the relay's knob.
  tl.caption({
    at: 28.4,
    dur: 6.2,
    text: 'And the knob is public. Remember the relay information document from the last book? Its limitation object has a field called min pow difficulty — a relay literally publishes its price on the door.',
  });
  tl.tween(knobU, 1, { at: 29.4, dur: 1.2, ease: ease.enter });
  tl.hold(34.6, 0.7);

  // Beat 6 — no permission.
  tl.caption({
    at: 35.3,
    dur: 6.0,
    text: 'Notice what is absent: no account, no review queue, no moderator deciding who may speak. The gate is arithmetic. Anyone can pay it, nobody can talk their way past it, and checking costs one hash.',
  });
  tl.tween(seriesU, 1, { at: 36.4, dur: 1.4, ease: ease.move });
  tl.hold(41.3, 0.7);

  // Beat 7 — close the book.
  tl.caption({
    at: 42.0,
    dur: 6.2,
    text: 'That is proof of work on nostr: difficulty is a zero count, mining is a loop, the target is a confession, the work can be hired, and the economics do the moderating. Spam costs electricity — speech stays free.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 42.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 42.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.4, dur: 1.0, ease: ease.enter });
  tl.hold(48.2, 1.4);

  return { tl, cam, axesU, curveU, dialD, billsU, knobU, seriesU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axesU = s.get(scene.axesU);
  const curveU = s.get(scene.curveU);
  const dialD = s.get(scene.dialD);
  const billsU = s.get(scene.billsU);
  const knobU = s.get(scene.knobU);
  const seriesU = s.get(scene.seriesU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const d = Math.round(clamp01(dialD / 20) * 20);
  const dialOn = dialD > 0;

  return (
    <>
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* the log-scale price wall */}
          {axesU > 0 && (
            <g>
              <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x + PLOT.w * axesU} y2={PLOT.y + PLOT.h} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={PLOT.x} y1={PLOT.y + PLOT.h} x2={PLOT.x} y2={PLOT.y + PLOT.h - PLOT.h * axesU} stroke={colors.GRID} strokeWidth={1.5} />
              <text x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 28} textAnchor="end" fill={colors.MUTED} fontSize={12.5} opacity={axesU * (1 - clamp01(billsU * 1.25))}>
                difficulty — leading zero bits
              </text>
              <text x={PLOT.x - 10} y={PLOT.y - 12} fill={colors.MUTED} fontSize={12.5} opacity={axesU * (1 - clamp01(billsU * 1.25))}>
                hashes per note (each step = ×2)
              </text>
              {curveU > 0 && (
                <>
                  <polyline
                    points={Array.from({ length: 49 }, (_, i) => {
                      const dd = (i / 48) * D_MAX * curveU;
                      return `${px(dd)},${py(dd)}`;
                    }).join(' ')}
                    fill="none"
                    stroke={colors.WARM}
                    strokeWidth={2.5}
                  />
                  {[4, 8, 12, 16, 20, 24].map((dd) => (
                    <g key={dd} opacity={clamp01(curveU * D_MAX - dd) * 0.9}>
                      <circle cx={px(dd)} cy={py(dd)} r={4} fill={colors.WARM} />
                      <text x={px(dd) + 10} y={py(dd) - 8} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                        2^{dd} = {fmtHashes(dd)}
                      </text>
                    </g>
                  ))}
                </>
              )}
              {/* the dial */}
              {dialOn && (
                <g>
                  <line x1={px(d)} y1={PLOT.y + PLOT.h} x2={px(d)} y2={py(d)} stroke={colors.ACCENT} strokeWidth={1.5} strokeDasharray="4 4" />
                  <circle cx={px(d)} cy={py(d)} r={7} fill={colors.ACCENT} />
                  <g>
                    <rect x={px(d) - 92} y={py(d) - 58} width={184} height={36} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} opacity={0.95} />
                    <text x={px(d)} y={py(d) - 34} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                      d = {d} → {fmtHashes(d)} hashes
                    </text>
                  </g>
                </g>
              )}
            </g>
          )}

          {/* two bills */}
          {billsU > 0 && (
            <g opacity={billsU}>
              <rect x={880} y={150} width={300} height={130} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={904} y={184} fill={colors.POSITIVE} fontSize={15} fontWeight={600}>
                a person · 1 note
              </text>
              <text x={904} y={212} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                2²⁰ = 1,048,576 hashes
              </text>
              <text x={904} y={236} fill={colors.MUTED} fontSize={12.5}>
                ≈ one second, once
              </text>
              <rect x={880} y={310} width={300} height={130} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={904} y={344} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                spam farm · {SPAM_NOTES.toLocaleString('en-US')} notes
              </text>
              <text x={904} y={372} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
                10,000 × 2²⁰ ≈ 10.5 billion hashes
              </text>
              <text x={904} y={396} fill={colors.MUTED} fontSize={12.5}>
                ≈ three hours of compute — per day, forever
              </text>
            </g>
          )}

          {/* the relay's public knob */}
          {knobU > 0 && (
            <g opacity={knobU}>
              <rect x={880} y={470} width={300} height={84} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={904} y={500} fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                "limitation": {'{'}
              </text>
              <text x={922} y={522} fill={colors.WARM} fontSize={13} fontFamily="monospace">
                "min_pow_difficulty": 20
              </text>
              <text x={904} y={544} fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
                {'}'} — NIP-11, the price on the door
              </text>
            </g>
          )}

          {seriesU > 0 && (
            <g opacity={seriesU}>
              <MathLabel tex={'\\text{gate} = 2^{d}\\ \\text{hashes; no permission required}'} x={250} y={540} />
            </g>
          )}
        </g>
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={225} width={840} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={295} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Spam costs CPU — speech stays free
          </text>
          <text x={640} y={339} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            a flat tax that people never notice and volume cannot survive
          </text>
          <text x={640} y={379} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-13 proof of work · zeros → mining → commitment → delegation → economics
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
