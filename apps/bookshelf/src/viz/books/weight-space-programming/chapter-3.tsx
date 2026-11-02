// Chapter 3 — A side path that switches off.
//
// Source: "Sparks of Weight-Space Programming" (Takehi, Teoh, Zhang, Khattab; MIT CSAIL; November 2, 2026),
// https://rikiyat.github.io/blog/weight-space-programming/ . Experiment 4: a PPO actor for the car-on-ramp level of
// Kinetix (back the car up, then jump a red strip to reach the blue box). Actor: 679 to 128 (ReLU) to five layers of
// 128 (tanh) to 16, 171,664 weights. The trained policy converges to a local minimum and never succeeds in 256
// episodes. Astra's one-shot edit changes 3.5% of the weights, adds a small separate path through a few units per
// layer that reads position and speed, and succeeds in all 1,024 episodes. Once the green wheel is past the red strip,
// the path switches off and the trained network drives the rest.
//
// Beat sheet. One machine: the car's route drawn as a trail, coloured by which controller is driving.
//  1. [Exp 4] Ground, ramp, red strip and blue box appear. The trained policy drives straight at the ramp and stalls.
//  2. [Exp 4] Astra, reading the scene and one episode, names a local minimum: no reverse, so no run-up.
//  3. [Exp 4] The edit (3.5% of weights): the side-path gauge lights, warm, beside the trained-network gauge.
//  4. [Exp 4] The car backs up along the runway; the trail is warm, so the side path is driving.
//  5. [Exp 4] The climb: the car rolls up the ramp on the same warm trail.
//  6. [Exp 4] The jump: the green wheel clears the red strip; the side path switches off, the gauges swap, and the
//     trail turns accent as the trained network drives.
//  7. [Exp 4] The car lands at the blue box.
//  8. [Exp 4] Results: never succeeds in 256 episodes (original) against all 1,024 episodes (edited).
//  9. Closing: the stage clears under the last line.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const BLUE = '#3b82f6';

// Seconds a caption takes to say, with a breath: pacing follows the words.
const speakSeconds = (text: string) => Math.round((text.split(/\s+/).length / 2.6 + 0.5) * 10) / 10;

// ---- world geometry (stage units) -----------------------------------------------------------
const GROUND_Y = 470;
const PLATEAU_Y = 380;
const RAMP_X0 = 430;
const RAMP_X1 = 520;
const STRIP_X0 = 600;
const STRIP_X1 = 612;
const STRIP_H = 36;
const BOX_X0 = 900;
const BOX_W = 52;
const BOX_H = 50;
const JUMP_X0 = 560;
const LAND_CX = 846;
const JUMP_H = 170;
const WHEEL_DX = 26; // green wheel sits this far ahead of the car centre
const WHEEL_R = 12;

const groundY = (x: number) =>
  x <= RAMP_X0
    ? GROUND_Y
    : x >= RAMP_X1
      ? PLATEAU_Y
      : GROUND_Y + ((x - RAMP_X0) / (RAMP_X1 - RAMP_X0)) * (PLATEAU_Y - GROUND_Y);

// Edited run. p runs 0 to 1 over the run; each value is the car's centre and contact point.
// Reverse on the flat (p 0 to 0.18), climb the ramp (0.18 to 0.56), jump the strip to the box (0.56 to 1).
function fixAt(p: number): { cx: number; cy: number } {
  if (p <= 0.18) {
    const t = p / 0.18;
    return { cx: 200 + (150 - 200) * t, cy: GROUND_Y };
  }
  if (p <= 0.56) {
    const t = (p - 0.18) / 0.38;
    const cx = 150 + (JUMP_X0 - 150) * t;
    return { cx, cy: groundY(cx) };
  }
  const t = (p - 0.56) / 0.44;
  return { cx: JUMP_X0 + (LAND_CX - JUMP_X0) * t, cy: PLATEAU_Y - 4 * t * (1 - t) * JUMP_H };
}

// Original policy: drives straight at the ramp and stalls at its foot (x = 430).
const baseCx = (p: number) => 200 + 230 * (1 - (1 - p) ** 2);

// The side path switches off once the whole green wheel has cleared the strip (computed once, at module scope).
const P_CROSS = (() => {
  for (let k = 0; k <= 20000; k++) {
    const p = 0.56 + (0.44 * k) / 20000;
    if (fixAt(p).cx + WHEEL_DX - WHEEL_R >= STRIP_X1) return p;
  }
  return 1;
})();

// Sampled trail for the edited run, so the warm and accent trails are plain polylines.
const TRAIL_N = 240;
const TRAIL = Array.from({ length: TRAIL_N + 1 }, (_, k) => {
  const p = k / TRAIL_N;
  return { p, ...fixAt(p) };
});
const pathThrough = (from: number, to: number) => {
  const pts = TRAIL.filter((q) => q.p >= from && q.p <= to);
  if (pts.length < 2) return '';
  return `M ${pts.map((q) => `${q.cx.toFixed(2)} ${(q.cy - WHEEL_R).toFixed(2)}`).join(' L ')}`;
};

const RUN_DUR = 13.6;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const worldU = tl.channel('worldU', 0); // ground, ramp, strip and box appear
  const baseU = tl.channel('baseU', 0); // original policy runs and stalls
  const baseOut = tl.channel('baseOut', 0); // original car clears
  const stallU = tl.channel('stallU', 0); // stall label
  const carU = tl.channel('carU', 0); // edited-policy car appears at the start
  const runU = tl.channel('runU', 0); // edited run, 0 to 1
  const sideOn = tl.channel('sideOn', 1); // side path on (1) or off (0)
  const gaugeU = tl.channel('gaugeU', 0); // side-path and trained-network gauges
  const resultU = tl.channel('resultU', 0); // results chips
  const endU = tl.channel('endU', 0); // closing fade

  let t = 0.3;
  const line = (text: string, gap = 0.4) => {
    const at = t;
    tl.caption({ at, dur: speakSeconds(text), text });
    t = at + speakSeconds(text) + gap;
    return at;
  };

  // ---- beat 1: the trained policy stalls ----------------------------------------------
  const c1 = line('A car must climb a ramp and jump a red strip to reach a blue box. A trained controller drives straight at the ramp instead, and the car stalls there.');
  tl.tween(worldU, 1, { at: c1 + 0.5, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 330, y: 400, k: 1.25 }, { at: c1 + 2.3, dur: 1.4, ease: ease.move });
  tl.tween(baseU, 1, { at: c1 + 3.0, dur: 3.0, ease: ease.move });
  tl.tween(stallU, 1, { at: c1 + 5.6, dur: 0.8, ease: ease.enter });
  tl.tween(baseOut, 1, { at: c1 + 8.0, dur: 1.0, ease: ease.move });

  // ---- beat 2: the diagnosis ----------------------------------------------------------
  const c2 = line('From the weights, the scene, and one recorded episode, Astra identified a local minimum: a policy that drives straight at the ramp.');
  tl.tween(cam, CAMERA_HOME, { at: c2 + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(carU, 1, { at: c2 + 2.0, dur: 0.8, ease: ease.enter });

  // ---- beat 3: the edit ----------------------------------------------------------------
  const c3 = line("The fix is one edit, changing three point five percent of the network's weights. It adds a small side path through a few units in each layer.");
  tl.tween(gaugeU, 1, { at: c3 + 0.5, dur: 1.0, ease: ease.enter });

  // ---- beats 4 to 6: the run, with the switch at the wheel's crossing ----------------
  const c4 = line("That side path reads the car's position and speed, and it backs the car up before the forward drive.");
  const runStart = c4 + 0.5;
  tl.tween(cam, { x: 300, y: 420, k: 1.5 }, { at: c4 + 0.2, dur: 1.4, ease: ease.move });
  tl.tween(runU, 1, { at: runStart, dur: RUN_DUR, ease: ease.linear });
  tl.set(sideOn, 0, runStart + P_CROSS * RUN_DUR);
  const c5 = line('Once the green wheel is past the red strip, the side path switches off. The trained network drives the rest.');
  tl.tween(cam, { x: 700, y: 330, k: 1.5 }, { at: c5 + 0.5, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 840, y: 360, k: 1.6 }, { at: c5 + 4.2, dur: 1.4, ease: ease.move });

  // ---- beats 7 and 8: the numbers --------------------------------------------------------
  const c6 = line('The trained actor takes six hundred seventy-nine numbers describing the scene, and outputs sixteen motor and thruster actions.');
  tl.tween(cam, CAMERA_HOME, { at: c6 + 0.2, dur: 1.4, ease: ease.move });
  line('It has one hundred seventy-one thousand, six hundred sixty-four weights.');
  const c8 = line('The original policy never succeeds in two hundred fifty-six episodes. With the edit, the car succeeds in all one thousand, twenty-four episodes.');
  tl.tween(resultU, 1, { at: c8 + 0.5, dur: 1.0, ease: ease.enter });

  // ---- beats 9 and 10: one reply, one cause ------------------------------------------
  line('Astra made this change in a single reply, with no tools. It explained the failure, then fixed only its cause.');
  const closing = 'The edit is small and aimed at one failure. Everything after the wheel clears the strip is still the trained network.';
  const cEnd = line(closing, 0.5);
  tl.tween(endU, 1, { at: cEnd + speakSeconds(closing) + 0.1, dur: 1.4, ease: ease.move });
  tl.hold(t + 0.5, 0.6);

  return { tl, cam, worldU, baseU, baseOut, stallU, carU, runU, sideOn, gaugeU, resultU, endU };
}

const scene = buildScene();

function Car({
  cx,
  cy,
  wheelColor = colors.POSITIVE,
  body = colors.TEXT,
}: {
  cx: number;
  cy: number;
  wheelColor?: string;
  body?: string;
}) {
  return (
    <g>
      <rect x={cx - 46} y={cy - 12 - 30} width={92} height={28} rx={8} fill={colors.PANEL} stroke={body} strokeWidth={2} />
      <rect x={cx - 22} y={cy - 12 - 48} width={44} height={20} rx={6} fill={colors.PANEL} stroke={body} strokeWidth={2} />
      <circle cx={cx - WHEEL_DX} cy={cy - WHEEL_R} r={WHEEL_R} fill="#1b2640" stroke={colors.MUTED} strokeWidth={2} />
      <circle cx={cx + WHEEL_DX} cy={cy - WHEEL_R} r={WHEEL_R} fill={wheelColor} />
    </g>
  );
}

function Gauge({ y, label, fill, color, u }: { y: number; label: string; fill: number; color: string; u: number }) {
  const W = 300;
  return (
    <g opacity={u}>
      <text x={80} y={y + 14} fill={colors.MUTED} fontSize={17}>
        {label}
      </text>
      <rect x={250} y={y} width={W} height={16} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <rect x={250} y={y} width={W * clamp01(fill)} height={16} rx={8} fill={color} />
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endFade = 1 - s.get(scene.endU);
  const world = s.get(scene.worldU) * endFade;
  const baseU = s.get(scene.baseU);
  const baseOut = s.get(scene.baseOut);
  const stallU = s.get(scene.stallU);
  const carU = s.get(scene.carU);
  const runP = s.get(scene.runU);
  const side = s.get(scene.sideOn);
  const gauge = s.get(scene.gaugeU) * endFade;
  const resultU = s.get(scene.resultU) * endFade;

  const carNow = runP > 0 ? fixAt(runP) : fixAt(0);
  const trailWarm = pathThrough(0, Math.min(runP, P_CROSS));
  const trailAccent = runP > P_CROSS ? pathThrough(P_CROSS, runP) : '';

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={endFade}>
        Experiment 4: a car on a ramp, fixed by one edit
      </text>

      <Camera {...s.get(scene.cam)}>
        {world > 0 && (
          <g opacity={world}>
            <path
              d={`M 40 ${GROUND_Y} L ${RAMP_X0} ${GROUND_Y} L ${RAMP_X1} ${PLATEAU_Y} L 1000 ${PLATEAU_Y}`}
              fill="none"
              stroke={colors.MUTED}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <rect x={STRIP_X0} y={PLATEAU_Y - STRIP_H} width={STRIP_X1 - STRIP_X0} height={STRIP_H} fill={colors.NEGATIVE} />
            <text x={(STRIP_X0 + STRIP_X1) / 2} y={PLATEAU_Y + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15}>
              red strip
            </text>
            <rect x={BOX_X0} y={PLATEAU_Y - BOX_H} width={BOX_W} height={BOX_H} fill={BLUE} opacity={0.9} />
            <text x={BOX_X0 + BOX_W / 2} y={PLATEAU_Y - BOX_H - 10} textAnchor="middle" fill={BLUE} fontSize={15}>
              blue box
            </text>
          </g>
        )}

        {baseU > 0 && baseOut < 1 && (
          <g opacity={1 - baseOut}>
            <Car cx={baseCx(baseU)} cy={GROUND_Y} wheelColor={colors.MUTED} body={colors.MUTED} />
            {stallU > 0 && (
              <text x={430} y={GROUND_Y + 46} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18} opacity={stallU}>
                stalls at the ramp
              </text>
            )}
          </g>
        )}

        {carU > 0 && (
          <g opacity={carU}>
            {trailWarm && <path d={trailWarm} fill="none" stroke={colors.WARM} strokeWidth={4} strokeLinecap="round" opacity={0.9} />}
            {trailAccent && (
              <path d={trailAccent} fill="none" stroke={colors.ACCENT} strokeWidth={4} strokeLinecap="round" opacity={0.9} />
            )}
            <Car cx={carNow.cx} cy={carNow.cy} />
          </g>
        )}
      </Camera>

      {gauge > 0 && (
        <g>
          <Gauge y={100} label="side path" fill={side} color={colors.WARM} u={gauge} />
          <Gauge y={134} label="trained network" fill={1 - side} color={colors.ACCENT} u={gauge} />
          <text x={1180} y={116} textAnchor="end" fill={colors.MUTED} fontSize={17} fontFamily={MONO} opacity={gauge}>
            3.5% of weights
          </text>
        </g>
      )}

      {resultU > 0 && (
        <g opacity={resultU}>
          <rect x={100} y={500} width={500} height={56} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={2} />
          <text x={350} y={534} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            original policy: never succeeds in 256 episodes
          </text>
          <rect x={680} y={500} width={500} height={56} rx={14} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text x={930} y={534} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            edited policy: succeeds in all 1,024 episodes
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
