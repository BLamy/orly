// Explained: AI Control — chapter 4: honeypots and upfront auditing.
// Simulated at module scope on the same monitor (D = 2.2, audit-2% catch
// p ≈ 0.558). The blue team seeds a fraction q of tasks with honeypots —
// synthetic openings that look like an ideal moment to defect but are always
// audited, so defecting on one is an instant catch. The attacker cannot tell a
// honeypot from a real opening, so its per-defection catch rate rises to
// 1 - (1-q)(1-p). Over a k=3-defection attacker, simulated evade-all falls:
//   q=0%  → 8.4%   q=10% → 6.1%   q=20% → 4.4%   q=40% → 1.9%
// (20,000 seeded episodes per q). Upfront auditing is the same idea in time:
// audit the model heavily at the start, on tasks where you can check the
// ground truth, to estimate its defection rate before trusting it later.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
  gaussian,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The simulation.
// ---------------------------------------------------------------------------

const D = 2.2;
const thrRand = mulberry32(3);
const thrG = gaussian(thrRand);
const benign: number[] = [];
for (let i = 0; i < 40000; i++) benign.push(thrG());
benign.sort((a, b) => a - b);
const THR = benign[Math.floor(0.98 * benign.length)];

const K = 3; // attacker defects 3 times
const QS = [0, 0.1, 0.2, 0.4];
const simRand = mulberry32(23);
const simG = gaussian(simRand);
const TRIALS = 20000;
const RESULT = QS.map((q) => {
  let evade = 0;
  for (let t = 0; t < TRIALS; t++) {
    let ok = true;
    for (let j = 0; j < K; j++) {
      // the attacker defects; is this opening a honeypot?
      if (simRand() < q) { ok = false; break; } // instant catch on a trap
      if (D + simG() > THR) { ok = false; break; } // caught by the monitor+audit
    }
    if (ok) evade++;
  }
  return { q, evade: evade / TRIALS };
});
const BASE = RESULT[0];
const AT40 = RESULT[3];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const BX = 220;
const BY = 210;
const BW = 560;
const BH = 300;
const bx = (i: number) => BX + (i + 0.5) * (BW / QS.length);
const by = (v: number) => BY + BH - (v / BASE.evade) * BH;
const CAM_BARS: CameraState = { x: 540, y: 360, k: 1.12 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  trapU: ChannelRef<number>; // the honeypot idea
  fieldU: ChannelRef<number>; // real + honeypot openings
  barsU: ChannelRef<number>; // evade-all vs honeypot fraction
  upfrontU: ChannelRef<number>; // upfront auditing panel
  calcU: ChannelRef<number>; // attacker's calculus note
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const trapU = tl.channel('trapU', 0);
  const fieldU = tl.channel('fieldU', 0);
  const barsU = tl.channel('barsU', 0);
  const upfrontU = tl.channel('upfrontU', 0);
  const calcU = tl.channel('calcU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the trap idea
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Last chapter cornered the attacker into defecting almost never. But rare is not the same as safe — you still have to survive that one attempt. The blue team’s counter is delicious: plant fake opportunities. Openings that look like the perfect, unmonitored moment to defect, and are actually traps that are always audited.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(trapU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(6.3, 0.5);

  // Beat 2 — the field of openings
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'Now the attacker looks out over its opportunities and cannot tell which are real and which are bait. Every tempting-looking opening might be a hook. Defecting on a honeypot is not a coin flip — it is an automatic catch, because a human is already watching that one.',
  });
  tl.tween(cam, CAM_BARS, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.tween(fieldU, 1, { at: 7.8, dur: 2.4, ease: ease.linear });
  tl.hold(12.6, 0.6);

  // Beat 3 — the effect
  tl.caption({
    at: 13.2,
    dur: 5.8,
    text: 'Measure the damage to the attacker. Take the rare, three-defection strategy from last chapter, whose evade rate was about eight percent. Salt ten percent of openings with traps and it drops to six. Salt forty percent and it falls to under two percent. The attacker did nothing wrong — the ground moved under it.',
  });
  tl.tween(barsU, 1, { at: 14.2, dur: 2.6, ease: ease.draw });
  tl.hold(19.6, 0.6);

  // Beat 4 — the calculus
  tl.caption({
    at: 20.2,
    dur: 5.8,
    text: 'And the real weapon is not the catch rate — it is the doubt. The attacker now has to assume any opening could be a trap, which taxes every single defection it might ever attempt, including the ones you never planted. You are no longer paying to catch attacks. You are paying to make the attacker too scared to try.',
  });
  tl.tween(calcU, 1, { at: 21.2, dur: 0.9, ease: ease.enter });
  tl.hold(26.0, 0.6);

  // Beat 5 — upfront auditing
  tl.caption({
    at: 26.6,
    dur: 5.8,
    text: 'Upfront auditing is the same trick, spent in time instead of space. At the very start, before you rely on the model for anything, audit it heavily on tasks where you already know the right answer. If it is defecting, you are likeliest to catch it here — and if it stays clean through a big upfront sample, you have earned a calibrated reason to extend it a little rope.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 26.9, dur: 1.3, ease: ease.move });
  tl.tween(upfrontU, 1, { at: 28.0, dur: 0.9, ease: ease.enter });
  tl.hold(32.7, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 33.3,
    dur: 5.0,
    text: 'Monitoring, rare-attack economics, honeypots, upfront auditing — these are the moving parts. The last chapter zooms out to the measured results: how safe the real protocols actually are, honestly reported, and where the newest attacks are pushing back.',
  });
  tl.tween(dimU, 1, { at: 34.1, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 35.3, dur: 1.0, ease: ease.enter });
  tl.hold(38.3, 1.4);

  return { tl, cam, titleU, trapU, fieldU, barsU, upfrontU, calcU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/honeypot-audit/overrides.json', slug: 'honeypot-audit' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// a field of openings: mostly real, some honeypots (deterministic layout)
const fieldRand = mulberry32(41);
const OPENINGS = Array.from({ length: 40 }, (_, i) => ({ honey: fieldRand() < 0.25, i }));

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const trapU = s.get(scene.trapU);
  const fieldU = s.get(scene.fieldU);
  const barsU = s.get(scene.barsU);
  const upfrontU = s.get(scene.upfrontU);
  const calcU = s.get(scene.calcU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const fieldFade = 1 - 0.85 * clamp01(barsU * 2.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* field of openings */}
          {fieldU > 0 && fieldFade > 0.05 && (
            <g opacity={fieldFade}>
              <text x={220} y={180} fill={colors.MUTED} fontSize={12.5} opacity={fieldU}>
                the attacker’s openings — which are real, which are bait?
              </text>
              {OPENINGS.map((o, i) => {
                const u = clamp01(fieldU * OPENINGS.length - i);
                if (u <= 0) return null;
                const col = i % 10;
                const row = Math.floor(i / 10);
                const revealed = trapU > 0.5; // only the blue team sees the honeypots
                return (
                  <g key={i} opacity={u}>
                    <rect
                      x={220 + col * 58}
                      y={210 + row * 58}
                      width={44}
                      height={44}
                      rx={8}
                      fill={colors.PANEL}
                      opacity={0.9}
                      stroke={o.honey && revealed ? colors.WARM : colors.GRID}
                      strokeWidth={o.honey && revealed ? 2.5 : 1}
                    />
                    <text x={242 + col * 58} y={238 + row * 58} textAnchor="middle" fontSize={16} fill={o.honey && revealed ? colors.WARM : colors.MUTED}>
                      {o.honey && revealed ? '🪝' : '·'}
                    </text>
                  </g>
                );
              })}
              {trapU > 0.5 && (
                <text x={220} y={210 + 4 * 58 + 20} fill={colors.WARM} fontSize={12.5} fontFamily="monospace" opacity={clamp01(trapU * 2 - 1)}>
                  🪝 = honeypot (always audited) — invisible to the attacker
                </text>
              )}
            </g>
          )}

          {/* the bars: evade-all vs honeypot fraction */}
          {barsU > 0 && (
            <g>
              <line x1={BX} y1={BY} x2={BX} y2={BY + BH} stroke={colors.GRID} strokeWidth={1.5} opacity={barsU} />
              <line x1={BX} y1={BY + BH} x2={BX + BW} y2={BY + BH} stroke={colors.GRID} strokeWidth={1.5} opacity={barsU} />
              <text x={BX + BW / 2} y={BY + BH + 34} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} opacity={barsU}>
                fraction of openings that are honeypots
              </text>
              <text x={BX - 54} y={BY + BH / 2} fill={colors.MUTED} fontSize={12} textAnchor="middle" transform={`rotate(-90 ${BX - 54} ${BY + BH / 2})`} opacity={barsU}>
                attacker evade-all (k=3)
              </text>
              {RESULT.map((r, i) => {
                const u = clamp01(barsU * RESULT.length - i);
                if (u <= 0) return null;
                const h = (r.evade / BASE.evade) * BH * u;
                return (
                  <g key={r.q}>
                    <rect x={bx(i) - 34} y={BY + BH - h} width={68} height={h} rx={6} fill={i === 0 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.8} />
                    <text x={bx(i)} y={BY + BH - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily="monospace" fontWeight={700}>
                      {(r.evade * 100).toFixed(1)}%
                    </text>
                    <text x={bx(i)} y={BY + BH + 16} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                      {(r.q * 100).toFixed(0)}%
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {/* attacker calculus note — screen space */}
      {calcU > 0 && (
        <g opacity={calcU * mainOp}>
          <rect x={860} y={110} width={380} height={128} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.WARM} />
          <text x={884} y={140} fill={colors.WARM} fontSize={14} fontWeight={700}>
            the real weapon is doubt
          </text>
          <text x={884} y={170} fill={colors.MUTED} fontSize={12}>
            every opening might be a trap
          </text>
          <text x={884} y={192} fill={colors.MUTED} fontSize={12}>
            so every defection is taxed —
          </text>
          <text x={884} y={214} fill={colors.MUTED} fontSize={12}>
            even the ones you never planted
          </text>
        </g>
      )}

      {/* upfront auditing panel */}
      {upfrontU > 0 && (
        <g opacity={upfrontU * mainOp}>
          <rect x={210} y={110} width={520} height={100} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.SECONDARY} />
          <text x={234} y={140} fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
            upfront auditing — the same trick in time
          </text>
          <text x={234} y={168} fill={colors.MUTED} fontSize={12.5}>
            audit heavily at the start, on tasks with known answers —
          </text>
          <text x={234} y={190} fill={colors.MUTED} fontSize={12.5}>
            estimate the defection rate before extending any trust.
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Traps and the doubt they cast
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Make the one rare attack a coin flip with a trap.
          </text>
          <text x={640} y={320} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            k=3 evade: no traps {(BASE.evade * 100).toFixed(1)}% → 40% honeypots {(AT40.evade * 100).toFixed(1)}% (computed)
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            you pay to make the attacker too scared to try
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: the reported state of the art
          </text>
        </g>
      )}
    </>
  );
}

export function HoneypotAudit() {
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
