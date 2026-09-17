// Grounding: arXiv:2609.06986 Sections 3–5; official source tsh/run.py,
// tsh/README.md, experiments/methods.py, analysis/factorial.py, and README.md.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const COUNTS = [90, 45, 23, 10];
const HORIZONS = [10, 20, 50, 100];
const CANDIDATES = Array.from({ length: 90 }, (_, i) => ({
  i,
  x: 106 + (i % 15) * 34,
  y: 128 + Math.floor(i / 15) * 34,
  color: [colors.ACCENT, colors.SECONDARY, colors.WARM][i % 3],
}));
const CELLS = Array.from({ length: 16 }, (_, i) => ({
  i,
  x: 312 + (i % 4) * 164,
  y: 176 + Math.floor(i / 4) * 92,
}));
const RESULTS = [
  { label: 'Symbol-QA', value: 18.5, rank: 'rank 2 of 16', color: colors.ACCENT },
  { label: 'LLM-QA', value: 41.8, rank: 'rank 1 of 16', color: colors.SECONDARY },
  { label: 'Real-QA', value: 44.3, rank: 'rank 3 of 16', color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const cloudU = tl.channel('ninety candidates', 0);
  const funnelP = tl.channel('successive halving rungs', 0);
  const scoreU = tl.channel('three seed score', 0);
  const factorialU = tl.channel('sixteen factorial cells', 0);
  const factorsU = tl.channel('four binary factors', 0);
  const bestU = tl.channel('all mechanisms cell', 0);
  const resultsU = tl.channel('three dataset results', 0);
  const compareU = tl.channel('retention comparison', 0);
  const interactionU = tl.channel('replay merge interaction', 0);
  const recapU = tl.channel('complete composition', 0);
  const closeU = tl.channel('closing result', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'Composition creates a search problem. The development sweep begins with ninety anchor and allocation configurations.' });
  tl.tween(cloudU, 1, { at: 0.8, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 350, y: 270, k: 1.08 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'Task-Level Successive Halving spends the first budget on ten tasks, scores final retention over three seeds, and keeps forty-five.' });
  tl.tween(scoreU, 1, { at: 6.9, dur: 1.0, ease: ease.enter });
  tl.tween(funnelP, 1, { at: 7.8, dur: 2.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 9.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'At twenty tasks, forty-five candidates become twenty-three. Weak compositions stop before consuming the longest runs.' });
  tl.tween(funnelP, 2, { at: 12.9, dur: 2.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'At fifty tasks, twenty-three become ten. Only those survivors receive the full one-hundred-task horizon.' });
  tl.tween(funnelP, 3, { at: 18.9, dur: 2.2, ease: ease.move });
  tl.tween(cam, { x: 934, y: 288, k: 1.1 }, { at: 19.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'The final experiment then isolates four switches: Synaptic Intelligence, self-distillation, replay, and merged low-rank adaptation.' });
  tl.tween(factorialU, 1, { at: 24.9, dur: 1.2, ease: ease.move });
  tl.tween(factorsU, 1, { at: 25.9, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 27.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Every on-or-off combination appears once, giving sixteen factorial cells instead of a hand-picked comparison.' });
  tl.tween(factorsU, 1.8, { at: 31.0, dur: 1.6, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'One fixed composition turns on all three anchors and merged allocation. It is the only cell ranked in the top three on every dataset.' });
  tl.tween(bestU, 1, { at: 36.9, dur: 0.8, ease: ease.pop });
  tl.tween(cam, { x: 720, y: 360, k: 1.08 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Its final retention is eighteen point five percent on symbols, forty-one point eight on fictional facts, and forty-four point three on real questions.' });
  tl.tween(resultsU, 3, { at: 42.9, dur: 2.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 45.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.5, text: 'Averaged across the three streams, that is thirty-four point nine percent after one hundred tasks.' });
  tl.tween(compareU, 1, { at: 49.0, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 54.4, dur: 5.5, text: 'Naive sequential fine-tuning averages one point two percent. The composed method retains about twenty-eight times as much.' });
  tl.tween(compareU, 2, { at: 55.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 60.4, dur: 5.5, text: 'Factorial analysis finds replay and merged allocation provide the largest average gains, with a super-additive interaction on all three datasets.' });
  tl.tween(interactionU, 1, { at: 61.0, dur: 1.5, ease: ease.pop });

  tl.caption({ at: 66.4, dur: 5.5, text: 'Data, function, and weight anchors decide what survives. Merged low-rank updates decide where each protected change remains.' });
  tl.tween(recapU, 1, { at: 67.0, dur: 2.0, ease: ease.move });

  tl.caption({ at: 72.4, dur: 6.0, text: 'The result is not one magic defense. It is a measured composition whose parts cover one another’s blind spots.' });
  tl.tween(closeU, 1, { at: 73.0, dur: 1.3, ease: ease.move });
  tl.hold(78.3, 1.0);

  return { tl, cam, cloudU, funnelP, scoreU, factorialU, factorsU, bestU, resultsU, compareU, interactionU, recapU, closeU };
}

const scene = buildScene();

function CandidateCloud({ u, rung }: { u: number; rung: number }) {
  const step = Math.min(3, Math.floor(rung + 0.001));
  const next = Math.min(3, step + 1);
  const local = clamp01(rung - step);
  const aliveNow = COUNTS[step];
  const aliveNext = COUNTS[next];
  return <g opacity={u}>
    {CANDIDATES.map((c) => {
      const survivesNow = c.i < aliveNow;
      const survivesNext = c.i < aliveNext;
      const opacity = survivesNow ? (survivesNext ? 0.88 : 0.88 * (1 - local)) : 0.04;
      const targetX = 760 + (c.i % 10) * 38;
      const targetY = 150 + Math.floor(c.i / 10) * 38;
      return <circle key={c.i} cx={c.x + (targetX - c.x) * rung / 3} cy={c.y + (targetY - c.y) * rung / 3} r={7.5} fill={c.color} opacity={opacity * clamp01(u * 95 - c.i)} />;
    })}
    <g transform="translate(88 388)">
      {HORIZONS.map((h, i) => <g key={h} transform={`translate(${i * 276} 0)`} opacity={rung >= i ? 1 : 0.22}>
        <rect width="238" height="92" rx="22" fill="#101827" stroke={rung >= i ? colors.ACCENT : colors.GRID} strokeWidth="2.5" />
        <text x="119" y="34" textAnchor="middle" fill={colors.TEXT} fontSize="17" fontWeight="800">{h} tasks</text>
        <text x="119" y="64" textAnchor="middle" fill={rung >= i ? colors.WARM : colors.MUTED} fontSize="15">{COUNTS[i]} configurations</text>
      </g>)}
    </g>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const factorial = s.get(scene.factorialU);
  const factors = s.get(scene.factorsU);
  const best = s.get(scene.bestU);
  const results = s.get(scene.resultsU);
  const compare = s.get(scene.compareU);
  const recap = s.get(scene.recapU);
  const funnelFade = 1 - factorial;
  const gridFade = 1 - recap;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">search the compositions, then test every switch</text>
      <g opacity={funnelFade}>
        <CandidateCloud u={s.get(scene.cloudU)} rung={s.get(scene.funnelP)} />
        <g opacity={s.get(scene.scoreU)}>
          <rect x="430" y="520" width="420" height="54" rx="19" fill="#151f31" stroke={colors.WARM} />
          <text x="640" y="553" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>mean final retention · seeds 41, 42, 43</text>
        </g>
      </g>

      <g opacity={factorial * gridFade}>
        <text x="640" y="108" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>2⁴ factorial · FACTORS = si, sd, replay, merge</text>
        {CELLS.map((cell) => {
          const u = clamp01(factors * 17 - cell.i);
          const active = cell.i === 15;
          return <g key={cell.i} transform={`translate(${cell.x} ${cell.y})`} opacity={u}>
            <rect width="128" height="66" rx="18" fill={active ? '#193328' : '#101827'} stroke={active ? colors.POSITIVE : colors.GRID} strokeWidth={active ? 4 + best * 2 : 1.5} />
            {['SI', 'SD', 'R', 'M'].map((label, bit) => {
              const on = (cell.i & (1 << bit)) !== 0;
              return <g key={label} transform={`translate(${20 + bit * 29} 22)`}>
                <circle r="9" fill={on ? [colors.WARM, colors.SECONDARY, colors.ACCENT, colors.POSITIVE][bit] : '#202b3e'} />
                <text y="31" textAnchor="middle" fill={on ? colors.TEXT : colors.MUTED} fontSize="9">{label}</text>
              </g>;
            })}
          </g>;
        })}

        <g opacity={results}>
          {RESULTS.map((r, i) => {
            const u = clamp01(results - i);
            return <g key={r.label} transform={`translate(176 ${176 + i * 132})`} opacity={u}>
              <rect width="170" height="104" rx="24" fill="#101827" stroke={r.color} strokeWidth="3" />
              <text x="85" y="29" textAnchor="middle" fill={r.color} fontSize="13" fontWeight="800">{r.label}</text>
              <text x="85" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="30" fontWeight="900">{r.value}%</text>
              <text x="85" y="89" textAnchor="middle" fill={colors.MUTED} fontSize="11">{r.rank}</text>
            </g>;
          })}
        </g>

        <g opacity={clamp01(compare)}>
          <rect x="848" y="510" width="320" height="96" rx="26" fill="#101827" stroke={colors.GRID} strokeWidth="2" />
          <rect x="878" y="536" width={7 * clamp01(compare)} height="18" rx="9" fill={colors.NEGATIVE} />
          <rect x="878" y="566" width={203 * clamp01(compare - 1)} height="18" rx="9" fill={colors.POSITIVE} />
          <text x="1100" y="551" textAnchor="end" fill={colors.NEGATIVE} fontSize="12">1.2% naive</text>
          <text x="1100" y="581" textAnchor="end" fill={colors.POSITIVE} fontSize="12">34.9% composed</text>
        </g>
        <g opacity={s.get(scene.interactionU)}>
          <path d="M760 470 C820 420 920 420 990 470" fill="none" stroke={colors.WARM} strokeWidth="5" />
          <circle cx="760" cy="470" r="18" fill={colors.ACCENT} />
          <circle cx="990" cy="470" r="18" fill={colors.POSITIVE} />
          <circle cx="875" cy="425" r="28" fill={colors.WARM} />
          <text x="875" y="430" textAnchor="middle" fill={colors.BG} fontSize="12" fontWeight="900">SUPER</text>
          <text x="875" y="496" textAnchor="middle" fill={colors.MUTED} fontSize="12">replay × merge · all three datasets</text>
        </g>
      </g>

      <g opacity={recap}>
        <path d="M190 342 H1090" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
        {[{ l: 'data', c: colors.ACCENT }, { l: 'function', c: colors.SECONDARY }, { l: 'weight', c: colors.WARM }, { l: 'merge', c: colors.POSITIVE }].map((item, i) => {
          const u = clamp01(recap * 5 - i);
          return <g key={item.l} transform={`translate(${280 + i * 240} 342)`} opacity={u}>
            <circle r="60" fill="#101827" stroke={item.c} strokeWidth="4" />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{item.l}</text>
          </g>;
        })}
        <text x="640" y="490" textAnchor="middle" fill={colors.POSITIVE} fontSize="24" fontWeight="850">34.9% average final retention</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="160" y="108" width="960" height="468" rx="58" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="202" textAnchor="middle" fill={colors.TEXT} fontSize="52" fontWeight="900">The Three Anchors</text>
      <text x="640" y="246" textAnchor="middle" fill={colors.POSITIVE} fontSize="18">complementary protections compose</text>
      {[{ l: 'replay', c: colors.ACCENT }, { l: 'distill', c: colors.SECONDARY }, { l: 'protect', c: colors.WARM }, { l: 'merge', c: colors.POSITIVE }].map((item, i) => <g key={item.l} transform={`translate(${280 + i * 240} 385)`}>
        <circle r="60" fill="#101827" stroke={item.c} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{item.l}</text>
      </g>)}
      <text x="640" y="510" textAnchor="middle" fill={colors.MUTED} fontSize="16">1.2% → 34.9% after one hundred tasks</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
