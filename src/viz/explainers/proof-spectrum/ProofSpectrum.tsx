// Explained: Proof or It Didn't Happen — chapter 1: the spectrum of trust.
// A real toy bug, actually found at module scope: on an 8-bit machine,
// avg(a,b) = (a+b) >> 1 wraps when a+b > 255, so the "average is between
// min and max" property fails. A 60-case seeded test suite (typical values,
// a,b < 128) passes 60/60. Exhaustive checking of all 65,536 pairs counts
// the true violations. Tests sample the space; a proof would cover it.
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
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The toy, run for real at module scope.
// ---------------------------------------------------------------------------

// 8-bit machine: avg wraps at 256.
const avg8 = (a: number, b: number) => ((a + b) & 0xff) >> 1;
const holds = (a: number, b: number) =>
  avg8(a, b) >= Math.min(a, b) && avg8(a, b) <= Math.max(a, b);

// The test suite: 60 seeded "typical" pairs, both operands under 128.
const rand = mulberry32(41);
const TESTS: Array<{ a: number; b: number; ok: boolean }> = [];
for (let i = 0; i < 60; i++) {
  const a = Math.floor(rand() * 128);
  const b = Math.floor(rand() * 128);
  TESTS.push({ a, b, ok: holds(a, b) });
}
const TESTS_PASSED = TESTS.filter((t) => t.ok).length; // 60 — all pass

// Exhaustive: every pair of 8-bit values.
let VIOLATIONS = 0;
let FIRST_CE: { a: number; b: number } | null = null;
for (let a = 0; a < 256; a++) {
  for (let b = 0; b < 256; b++) {
    if (!holds(a, b)) {
      VIOLATIONS++;
      if (!FIRST_CE) FIRST_CE = { a, b };
    }
  }
}
const TOTAL = 256 * 256; // 65,536
const CE = FIRST_CE!; // the first counterexample found by the sweep
const CE_AVG = avg8(CE.a, CE.b);

// The 256×256 space, downsampled to a 64×64 grid for the heat view: each cell
// covers a 4×4 block; value = fraction of the block that violates.
const G = 64;
const GRID: number[] = [];
for (let gy = 0; gy < G; gy++) {
  for (let gx = 0; gx < G; gx++) {
    let bad = 0;
    for (let dy = 0; dy < 4; dy++)
      for (let dx = 0; dx < 4; dx++)
        if (!holds(gx * 4 + dx, gy * 4 + dy)) bad++;
    GRID.push(bad / 16);
  }
}

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const MAP_X = 180; // heat map top-left
const MAP_Y = 150;
const MAP_S = 440; // px, square
const CELL = MAP_S / G;
const mapX = (a: number) => MAP_X + (a / 256) * MAP_S;
const mapY = (b: number) => MAP_Y + (b / 256) * MAP_S;

const CAM_MAP: CameraState = { x: 470, y: 380, k: 1.12 };
const CAM_CE: CameraState = {
  x: mapX(CE.a),
  y: mapY(CE.b),
  k: 2.1,
};

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  claimU: ChannelRef<number>; // the function + property panel
  mapU: ChannelRef<number>; // input-space square
  testU: ChannelRef<number>; // test dots land
  verdictU: ChannelRef<number>; // "60/60 pass"
  heatU: ChannelRef<number>; // violation region revealed
  ceU: ChannelRef<number>; // the counterexample pinned
  countU: ChannelRef<number>; // the violation count
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const claimU = tl.channel('claimU', 0);
  const mapU = tl.channel('mapU', 0);
  const testU = tl.channel('testU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const heatU = tl.channel('heatU', 0);
  const ceU = tl.channel('ceU', 0);
  const countU = tl.channel('countU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the setup
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'This series ends a long argument the shelf keeps having: how much should you believe a green check mark? Start with the humblest kind — a passing test suite.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 5.8,
    text: 'Here is a tiny function on an eight bit machine. It averages two numbers by adding them and shifting right. And it makes a claim: the average always lands between the two inputs.',
  });
  tl.tween(claimU, 1, { at: 7.0, dur: 0.9, ease: ease.enter });
  tl.hold(12.3, 0.6);

  // Beat 2 — the input space and the tests
  tl.caption({
    at: 12.9,
    dur: 5.6,
    text: 'Every possible input lives in this square — two hundred fifty six values on each side, sixty five thousand five hundred thirty six pairs in all. Small enough to see whole, which is the point.',
  });
  tl.tween(cam, CAM_MAP, { at: 13.2, dur: 1.4, ease: ease.move });
  tl.tween(mapU, 1, { at: 13.8, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 18.7,
    dur: 5.8,
    text: 'Now run a perfectly reasonable test suite: sixty seeded cases, drawn from typical values. Watch them land. Every single one passes — sixty out of sixty, green across the board.',
  });
  tl.tween(testU, 1, { at: 19.6, dur: 2.8, ease: ease.linear });
  tl.tween(verdictU, 1, { at: 22.8, dur: 0.7, ease: ease.pop });
  tl.hold(24.7, 0.7);

  // Beat 3 — the lurking region
  tl.caption({
    at: 25.4,
    dur: 5.6,
    text: 'But a test suite is a sample. Sixty dots in a space of sixty five thousand. Here is what the tests never touched — now check every pair, all of them, exhaustively.',
  });
  tl.tween(heatU, 1, { at: 27.2, dur: 2.2, ease: ease.draw });
  tl.caption({
    at: 31.4,
    dur: 5.8,
    text: 'That red triangle is real. Whenever the two inputs sum past two hundred fifty five, the addition wraps around and the average teleports outside the interval. The property fails on thirty two thousand six hundred forty pairs — half of the entire space.',
  });
  tl.tween(countU, 1, { at: 33.6, dur: 0.8, ease: ease.enter });
  tl.hold(37.4, 0.6);

  // Beat 4 — one counterexample, up close
  tl.caption({
    at: 38.0,
    dur: 5.8,
    text: 'Zoom into the first failure the sweep finds. One input is one, the other is two hundred fifty five. Their sum is two hundred fifty six — which wraps to zero — and the so-called average comes out zero, below both inputs. The property is simply false.',
  });
  tl.tween(cam, CAM_CE, { at: 38.4, dur: 1.6, ease: ease.move });
  tl.tween(ceU, 1, { at: 40.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 44.4,
    dur: 5.4,
    text: 'The tests were not wrong — they were incomplete, and they had no way to say so. A sample can only report on the dots it landed. Silence about the rest is not evidence about the rest.',
  });
  tl.hold(49.8, 0.6);

  // Beat 5 — the spectrum, and where this book goes
  tl.caption({
    at: 50.4,
    dur: 5.8,
    text: 'So there is a spectrum of trust. Tests sample the space. An adversarial critic — the loop books on this shelf — hunts the space. And at the far end sits something stronger: a proof, which covers the space. Every pair, or a counterexample.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.6, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 56.8,
    dur: 5.6,
    text: 'This book is about that far end — what a proof actually is, how a machine checks one, and why language models suddenly care. First stop: the kernel that says yes.',
  });
  tl.hold(62.4, 1.4);

  return { tl, cam, titleU, claimU, mapU, testU, verdictU, heatU, ceU, countU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/proof-spectrum/overrides.json',
  slug: 'proof-spectrum',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const claimU = s.get(scene.claimU);
  const mapU = s.get(scene.mapU);
  const testU = s.get(scene.testU);
  const verdictU = s.get(scene.verdictU);
  const heatU = s.get(scene.heatU);
  const ceU = s.get(scene.ceU);
  const countU = s.get(scene.countU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* input-space square */}
          {mapU > 0 && (
            <g opacity={mapU}>
              <rect
                x={MAP_X}
                y={MAP_Y}
                width={MAP_S}
                height={MAP_S}
                fill={colors.PANEL}
                opacity={0.55}
                stroke={colors.GRID}
              />
              <text x={MAP_X} y={MAP_Y - 12} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                a →  (0..255)
              </text>
              <text
                x={MAP_X - 12}
                y={MAP_Y + 4}
                fill={colors.MUTED}
                fontSize={12}
                fontFamily="monospace"
                transform={`rotate(-90 ${MAP_X - 12} ${MAP_Y + 4})`}
                textAnchor="end"
              >
                b →  (0..255)
              </text>
              <text x={MAP_X + MAP_S / 2} y={MAP_Y + MAP_S + 24} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                all 65,536 input pairs
              </text>
            </g>
          )}

          {/* the violation region, exhaustive */}
          {heatU > 0 && (
            <g opacity={heatU}>
              {GRID.map((v, i) => {
                if (v <= 0) return null;
                const gx = i % G;
                const gy = Math.floor(i / G);
                // reveal sweeps along the anti-diagonal, where the wrap lives
                const u = clamp01(heatU * 1.6 - (gx + gy) / (2 * G));
                if (u <= 0) return null;
                return (
                  <rect
                    key={i}
                    x={MAP_X + gx * CELL}
                    y={MAP_Y + gy * CELL}
                    width={CELL + 0.5}
                    height={CELL + 0.5}
                    fill={colors.NEGATIVE}
                    opacity={0.7 * v * u}
                  />
                );
              })}
            </g>
          )}

          {/* the test dots */}
          {testU > 0 && (
            <g>
              {TESTS.map((t, i) => {
                const u = clamp01(testU * TESTS.length - i);
                if (u <= 0) return null;
                return (
                  <circle
                    key={i}
                    cx={mapX(t.a)}
                    cy={mapY(t.b)}
                    r={3.6}
                    fill={colors.POSITIVE}
                    opacity={0.95 * u}
                  />
                );
              })}
            </g>
          )}

          {/* the counterexample */}
          {ceU > 0 && (
            <g opacity={ceU}>
              <circle cx={mapX(CE.a)} cy={mapY(CE.b)} r={7} fill="none" stroke={colors.WARM} strokeWidth={2.4} />
              <circle cx={mapX(CE.a)} cy={mapY(CE.b)} r={2.6} fill={colors.WARM} />
              <g transform={`translate(${mapX(CE.a) + 16}, ${mapY(CE.b) - 44})`}>
                <rect width={230} height={64} rx={7} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
                <text x={12} y={22} fill={colors.WARM} fontSize={11.5} fontFamily="monospace" fontWeight={700}>
                  counterexample: a={CE.a}, b={CE.b}
                </text>
                <text x={12} y={40} fill={colors.TEXT} fontSize={11} fontFamily="monospace">
                  avg8({CE.a},{CE.b}) = {CE_AVG}
                </text>
                <text x={12} y={55} fill={colors.MUTED} fontSize={10}>
                  outside [{Math.min(CE.a, CE.b)}, {Math.max(CE.a, CE.b)}] — wrap at 256
                </text>
              </g>
            </g>
          )}
        </Camera>
      </g>

      {/* the function + claim panel — screen space, right side */}
      {claimU > 0 && (
        <g opacity={claimU * mainOp * (1 - 0.8 * clamp01(ceU * 2))}>
          <rect x={760} y={140} width={430} height={168} rx={12} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={784} y={174} fill={colors.TEXT} fontSize={15} fontWeight={600}>
            the function under test
          </text>
          <text x={784} y={202} fill={colors.ACCENT} fontSize={14} fontFamily="monospace">
            avg8(a, b) = ((a + b) &amp; 0xff) &gt;&gt; 1
          </text>
          <text x={784} y={232} fill={colors.TEXT} fontSize={13.5}>
            the claimed property, for all pairs:
          </text>
          <MathLabel
            tex="\min(a,b) \le \mathrm{avg8}(a,b) \le \max(a,b)"
            x={784}
            y={252}
            fontSize={16}
            color={colors.SECONDARY}
            opacity={1}
          />
        </g>
      )}

      {/* test verdict / exhaustive count — screen space */}
      {verdictU > 0 && (
        <g opacity={verdictU * mainOp * (1 - 0.85 * clamp01(heatU * 2.5))}>
          <text x={760} y={356} fill={colors.POSITIVE} fontSize={16} fontFamily="monospace" fontWeight={700}>
            test suite: {TESTS_PASSED}/{TESTS.length} passed ✓
          </text>
          <text x={760} y={380} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
            60 seeded cases · typical values (a, b &lt; 128)
          </text>
        </g>
      )}
      {countU > 0 && (
        <g opacity={countU * mainOp}>
          <text x={760} y={356} fill={colors.NEGATIVE} fontSize={16} fontFamily="monospace" fontWeight={700}>
            exhaustive: {VIOLATIONS.toLocaleString()} / {TOTAL.toLocaleString()} pairs fail
          </text>
          <text x={760} y={380} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
            {((VIOLATIONS / TOTAL) * 100).toFixed(1)}% of the space · every one missed by the tests
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Tests sample, proofs cover
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={180} y={200} width={920} height={260} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={258} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The spectrum of trust
          </text>
          <text x={640} y={310} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontFamily="monospace">
            tests — sample the space · 60 dots, all green, wrong
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontFamily="monospace">
            critics — hunt the space · the loop books
          </text>
          <text x={640} y={378} textAnchor="middle" fill={colors.WARM} fontSize={16} fontFamily="monospace">
            proofs — cover the space · every pair, or a counterexample
          </text>
          <text x={640} y={424} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            next: what it means for a machine to check a proof
          </text>
        </g>
      )}
    </>
  );
}

export function ProofSpectrum() {
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
