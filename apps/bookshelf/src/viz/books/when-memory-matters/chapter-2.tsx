// Rare does not mean nearby
//
// Sources (RealCompanion, arXiv 2610.01780 v2, and its reproducibility repo):
//   paper §§4–6 (demand rate; distance result: median furthest evidence 2,157)
//   expected/counts_proportional.json — 1,169 scoreable / 1,227 released
//   expected/counts_enriched.json, expected/census.json — 364 scoreable / 373
//   expected/on_screen.json — proportional.recorded 40, clear_removed 15
//   expected/arithmetic.json — control_rows 434 · audit/gates.py gate_v
//   docs/pipeline.md (on-screen field; strata) · audit/counts.py in_stratum
//
// Machine: a population ribbon of exactly 1,169 cells (167 × 7). Forty cells
// turn violet in true proportion and a magnified copy peels out; twenty-five
// of those go hollow under the stricter reading. The enriched extension
// (364 = 52 × 7) and the abstention controls (434 = 62 × 7) are separate
// ribbons that never enter the natural-rate brace. A single bracket carries
// the paper's aggregate distance figure — no distribution is drawn.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Brace } from '../../primitives';
import {
  Heading,
  INK,
  SourceNote,
  Tether,
  Txt,
  beatAt,
  clamp01,
  lerp,
  narrate,
  on,
  win,
} from './shared/kit';

// ---------------------------------------------------------------------------
// Data and deterministic geometry (module scope)
// ---------------------------------------------------------------------------

const SCOREABLE = 1169;
const RECORDED = 40; // expected/on_screen.json, proportional.recorded
const STRICT = 15; // proportional.clear_removed
const ENRICHED = 364;
const CONTROLS = 434;
const MEDIAN_DISTANCE = 2157; // paper §6

const ROWS = 7;
const PITCH = 6;
const CELL = 4.6;
const MAIN = { x: 139, y: 300, cols: SCOREABLE / ROWS }; // 167 columns
const ENR = { x: 139, y: 440, cols: ENRICHED / ROWS }; // 52 columns
const ABS = { x: 769, y: 440, cols: CONTROLS / ROWS }; // 62 columns
const MAIN_W = MAIN.cols * PITCH;

const cellXY = (n: number, o: { x: number; y: number }) => ({
  x: o.x + Math.floor(n / ROWS) * PITCH,
  y: o.y + (n % ROWS) * PITCH,
});
const sq = (x: number, y: number): string => `M${x} ${y}h${CELL}v${CELL}h${-CELL}z`;

/** Every cell of the proportional ribbon after the forty memory-bearing ones. */
const MAIN_REST = (() => {
  let d = '';
  for (let n = RECORDED; n < SCOREABLE; n++) {
    const p = cellXY(n, MAIN);
    d += sq(p.x, p.y);
  }
  return d;
})();
/** One path per column, so a sweep reveals whole columns. */
const columnPaths = (o: { x: number; y: number; cols: number }): string[] =>
  Array.from({ length: o.cols }, (_, c) => {
    let d = '';
    for (let r = 0; r < ROWS; r++) d += sq(o.x + c * PITCH, o.y + r * PITCH);
    return d;
  });
const ENR_COLS = columnPaths(ENR);
const ABS_COLS = columnPaths(ABS);

// magnified copy of the forty: 8 × 5
const INSET = { x: 139, y: 120, pitch: 22, cell: 17, rows: 5 } as const;
const HEAD = Array.from({ length: RECORDED }, (_, n) => ({
  from: cellXY(n, MAIN),
  to: { x: INSET.x + Math.floor(n / INSET.rows) * INSET.pitch, y: INSET.y + (n % INSET.rows) * INSET.pitch },
  clear: n >= STRICT, // 25 with referent_on_screen: clear
}));
const INSET_W = (RECORDED / INSET.rows) * INSET.pitch;
const INSET_BOTTOM = INSET.y + INSET.rows * INSET.pitch;

// distance bracket: back in time runs left
const RULER = { x1: 1185, y: 180, pxPer: 0.16 } as const;
const backX = (m: number): number => RULER.x1 - m * RULER.pxPer;

const pct = (a: number, b: number): string => ((100 * a) / b).toFixed(1);
const fmt = (n: number): string => n.toLocaleString('en-US');

const CAPTIONS = [
  'Most messages in these conversations concern what is happening now.',
  'The sample used to estimate demand contains eleven hundred sixty nine scoreable probes.',
  'Forty carry verified references beyond the recent thread, giving the recorded rate of three point four percent.',
  'Some referents are already visible in the recent conversation, despite having older citations.',
  'Removing those cases leaves fifteen probes, or one point three percent under the stricter reading.',
  'A separate sweep adds rare memory cases so comparisons have more examples to work with.',
  'Those selected cases cannot join the denominator used to describe ordinary conversation.',
  'Another four hundred thirty four cold openers test whether a system can hold back.',
  'When memory is needed, its furthest evidence sits a median of more than two thousand messages back.',
  'The benchmark therefore asks two questions at once: when to remember, and how far to reach.',
] as const;

const NOTES = [
  'paper §6',
  'expected/counts_proportional.json',
  'expected/on_screen.json, proportional.recorded',
  'expected/on_screen.json · docs/pipeline.md, on-screen field',
  'expected/on_screen.json, proportional.clear_removed',
  'expected/counts_enriched.json · expected/census.json',
  'docs/pipeline.md · audit/counts.py, in_stratum',
  'expected/arithmetic.json, control_rows · gate_v',
  'paper §6, distance result',
  'paper §§4–6',
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = narrate(tl, CAPTIONS);
  const fillU = tl.channel('fillU', 0); // rough band of "now" messages
  const cellsU = tl.channel('cellsU', 0); // band resolves into exact cells
  const braceU = tl.channel('braceU', 0);
  const violetU = tl.channel('violetU', 0); // forty cells turn violet in place
  const peelU = tl.channel('peelU', 0); // magnified copy peels out
  const recEqU = tl.channel('recEqU', 0);
  const markU = tl.channel('markU', 0); // 25 gain a hollow yellow inner mark
  const strictU = tl.channel('strictU', 0); // those 25 become outlines
  const strEqU = tl.channel('strEqU', 0);
  const enrichU = tl.channel('enrichU', 0); // separated enriched extension
  const joinU = tl.channel('joinU', 0); // attempted join, stopped
  const abstU = tl.channel('abstU', 0); // abstention controls
  const rulerU = tl.channel('rulerU', 0); // distance bracket

  // BEAT 0 — a blue majority; the numerator slot stays empty
  tl.tween(fillU, 1, { at: 0.5, dur: 3.6, ease: ease.linear });

  // BEAT 1 — exact cells and the denominator brace
  let t = beatAt(1);
  tl.tween(cellsU, 1, { at: t + 0.3, dur: 1.2, ease: ease.move });
  tl.tween(braceU, 1, { at: t + 1.5, dur: 1.4, ease: ease.draw });

  // BEAT 2 — forty turn violet; push into them
  t = beatAt(2);
  tl.tween(cam, { x: 400, y: 240, k: 1.3 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(violetU, 1, { at: t + 0.9, dur: 1.4, ease: ease.linear });
  tl.tween(peelU, 1, { at: t + 2.5, dur: 1.6, ease: ease.move });
  tl.tween(recEqU, 1, { at: t + 4.2, dur: 0.6, ease: ease.enter });

  // BEAT 3 — referent already on screen
  t = beatAt(3);
  tl.tween(cam, { x: 470, y: 250, k: 1.18 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(markU, 1, { at: t + 0.8, dur: 1.6, ease: ease.linear });

  // BEAT 4 — the stricter reading
  t = beatAt(4);
  tl.tween(strictU, 1, { at: t + 0.7, dur: 1.4, ease: ease.move });
  tl.tween(strEqU, 1, { at: t + 2.4, dur: 0.6, ease: ease.enter });

  // BEAT 5 — a separate sweep: the enriched extension
  t = beatAt(5);
  tl.tween(cam, { x: 620, y: 330, k: 1.05 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(enrichU, 1, { at: t + 0.8, dur: 1.6, ease: ease.linear });

  // BEAT 6 — the join stops at the brace boundary
  t = beatAt(6);
  tl.tween(cam, { x: 560, y: 336, k: 1.02 }, { at: t - 0.3, dur: 1.2, ease: ease.move });
  tl.tween(joinU, 1, { at: t + 0.9, dur: 1.2, ease: ease.move });
  tl.tween(joinU, 0, { at: t + 3.6, dur: 1.2, ease: ease.move });

  // BEAT 7 — abstention controls, outside both braces
  t = beatAt(7);
  tl.tween(cam, { x: 660, y: 335, k: 1.05 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(abstU, 1, { at: t + 0.8, dur: 1.6, ease: ease.linear });

  // BEAT 8 — how far back
  t = beatAt(8);
  tl.tween(cam, { x: 900, y: 262, k: 1.1 }, { at: t - 0.3, dur: 1.3, ease: ease.move });
  tl.tween(rulerU, 1, { at: t + 0.8, dur: 1.6, ease: ease.draw });

  // BEAT 9 — need and reach
  t = beatAt(9);
  tl.tween(cam, CAMERA_HOME, { at: t - 0.2, dur: 1.4, ease: ease.move });

  return { tl, cam, beat, fillU, cellsU, braceU, violetU, peelU, recEqU, markU, strictU, strEqU, enrichU, joinU, abstU, rulerU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const b = s.get(scene.beat);
  const fill = s.get(scene.fillU);
  const cells = s.get(scene.cellsU);
  const violet = s.get(scene.violetU);
  const peel = s.get(scene.peelU);
  const mark = s.get(scene.markU);
  const strict = s.get(scene.strictU);
  const enrich = s.get(scene.enrichU);
  const join = s.get(scene.joinU);
  const abst = s.get(scene.abstU);
  const ruler = s.get(scene.rulerU);

  const quiet = lerp(1, 0.15, on(b, 8)); // everything but Need / Reach recedes
  const gone = 1 - clamp01(on(b, 8) * 2); // rates and side ribbons leave before the distance beat
  const lift = -26 * join;
  const rulerX0 = lerp(RULER.x1, backX(MEDIAN_DISTANCE), ruler);

  return (
    <g>
      <Camera {...s.get(scene.cam)}>
        {/* the proportional ribbon */}
        <g opacity={quiet}>
          <rect x={MAIN.x + 36} y={MAIN.y} width={(MAIN_W - 36) * fill} height={ROWS * PITCH - (PITCH - CELL)} rx={2} fill={INK.thread} opacity={0.4 * (1 - cells)} />
          <path d={MAIN_REST} fill={INK.thread} opacity={0.55 * cells} />
          <Brace x0={MAIN.x} x1={MAIN.x + MAIN_W} y={348} u={s.get(scene.braceU)} color={INK.muted} />
          <Txt x={MAIN.x + MAIN_W / 2} y={384} size={12.5} mono anchor="middle" fill={INK.muted} opacity={s.get(scene.braceU)}>
            proportional: 1,169 scoreable / 1,227 released
          </Txt>
        </g>
        {/* the forty, in true proportion: empty slot → violet → outline under the strict reading */}
        {HEAD.map((c, n) => {
          const v = clamp01(violet * (RECORDED + 8) - n);
          const hollow = c.clear ? strict : 0;
          return (
            <rect
              key={n}
              x={c.from.x}
              y={c.from.y}
              width={CELL}
              height={CELL}
              fill={INK.distant}
              fillOpacity={v * (1 - hollow)}
              stroke={v > 0 ? INK.distant : INK.muted}
              strokeWidth={0.7}
              opacity={lerp(1, 0.5, on(b, 8))}
            />
          );
        })}

        {/* magnified copy */}
        <g opacity={clamp01(peel * 4) * (1 - on(b, 9))}>
          <Tether x1={MAIN.x} y1={MAIN.y - 3} x2={INSET.x} y2={INSET_BOTTOM + 3} color={INK.distant} opacity={0.35} />
          <Tether x1={MAIN.x + 36} y1={MAIN.y - 3} x2={INSET.x + INSET_W - 5} y2={INSET_BOTTOM + 3} color={INK.distant} opacity={0.35} />
        </g>
        <Txt x={INSET.x} y={INSET.y - 10} size={11} fill={INK.muted} opacity={clamp01(peel * 2 - 1)}>
          magnified
        </Txt>
        {peel > 0 &&
          HEAD.map((c, n) => {
            const p = clamp01(peel * 2 - n / RECORDED);
            if (p <= 0) return null;
            const size = lerp(CELL, INSET.cell, p);
            const x = lerp(c.from.x, c.to.x, p);
            const y = lerp(c.from.y, c.to.y, p);
            const m = c.clear ? clamp01(mark * 25 - (n - STRICT)) : 0;
            const hollow = c.clear ? strict : 0;
            return (
              <g key={n}>
                <rect x={x} y={y} width={size} height={size} rx={2} fill={INK.distant} fillOpacity={1 - hollow * 0.94} stroke={INK.distant} strokeWidth={1.2} />
                {m > 0 && (
                  <rect x={x + size * 0.28} y={y + size * 0.28} width={size * 0.44} height={size * 0.44} fill="none" stroke={INK.claim} strokeWidth={1.4} opacity={m} />
                )}
              </g>
            );
          })}

        {/* the rate: numerator slot, recorded reading, stricter reading */}
        <rect x={350} y={122} width={180} height={104} rx={8} fill="none" stroke={INK.muted} strokeDasharray="5 5" opacity={0.5 * on(b, 0) * (1 - s.get(scene.recEqU))} />
        <g opacity={gone}>
          <MathLabel tex={`\\frac{${RECORDED}}{1{,}169} = ${pct(RECORDED, SCOREABLE)}\\%`} x={440} y={160} fontSize={24} boxWidth={220} opacity={s.get(scene.recEqU) * lerp(1, 0.45, strict)} />
          <Txt x={440} y={214} size={13} anchor="middle" fill={INK.distant} opacity={s.get(scene.recEqU) * lerp(1, 0.45, strict)}>
            recorded reading
          </Txt>
          <Txt x={350} y={258} size={12} mono fill={INK.claim} opacity={win(b, 3, 4) * clamp01(mark * 2)}>
            referent_on_screen: clear
          </Txt>
          <MathLabel tex={`\\frac{${STRICT}}{1{,}169} = ${pct(STRICT, SCOREABLE)}\\%`} x={680} y={160} fontSize={24} boxWidth={220} opacity={s.get(scene.strEqU)} />
          <Txt x={680} y={214} size={13} anchor="middle" fill={INK.text} opacity={s.get(scene.strEqU)}>
            clear removed
          </Txt>
        </g>

        {/* the boundary the enriched cases cannot cross */}
        <g opacity={win(b, 6, 6)}>
          <line x1={MAIN.x} y1={404} x2={MAIN.x + MAIN_W} y2={404} stroke={INK.bad} strokeWidth={1.4 + join} strokeDasharray="6 5" opacity={0.5 + 0.5 * join} />
          <Txt x={480} y={452} size={12.5} mono fill={INK.text}>
            both = proportional + enriched
          </Txt>
          <Txt x={480} y={472} size={12} fill={INK.muted}>
            a comparison set, not a population rate
          </Txt>
        </g>

        {/* enriched extension: separate, every case memory-bearing by selection */}
        <g opacity={gone}>
          <g transform={`translate(0, ${lift})`}>
            {enrich > 0 &&
              ENR_COLS.map((d, c) => {
                const o = clamp01(enrich * (ENR.cols + 6) - c);
                return o > 0 ? <path key={c} d={d} fill={INK.distant} opacity={0.6 * o} /> : null;
              })}
          </g>
          <Txt x={ENR.x} y={504} size={12} mono fill={INK.distant} opacity={clamp01(enrich * 3 - 2)}>
            enriched: 364 scoreable / 373 released
          </Txt>

          {/* abstention controls: outlines only, outside both sampled braces */}
          {abst > 0 &&
            ABS_COLS.map((d, c) => {
              const o = clamp01(abst * (ABS.cols + 6) - c);
              return o > 0 ? <path key={c} d={d} fill="none" stroke={INK.muted} strokeWidth={0.8} opacity={o} /> : null;
            })}
          <g opacity={clamp01(abst * 3)}>
            <rect x={726} y={447} width={28} height={28} rx={5} fill="none" stroke={INK.muted} strokeDasharray="4 3" />
            <Txt x={740} y={490} size={9.5} mono anchor="middle" fill={INK.muted}>
              gold empty
            </Txt>
          </g>
          <Txt x={ABS.x} y={504} size={12} mono fill={INK.text} opacity={clamp01(abst * 3 - 2)}>
            abstention: 434
          </Txt>
          <Txt x={ABS.x + 372} y={504} size={11} anchor="end" fill={INK.muted} opacity={clamp01(abst * 3 - 2)}>
            controls, in neither sampled stratum
          </Txt>
        </g>

        {/* one bracket for the paper's aggregate distance figure */}
        {ruler > 0 && (
          <g>
            <line x1={RULER.x1} y1={RULER.y} x2={rulerX0} y2={RULER.y} stroke={INK.distant} strokeWidth={2} />
            {[0, 500, 1000, 1500, 2000].map((m) =>
              backX(m) >= rulerX0 ? (
                <g key={m}>
                  <line x1={backX(m)} y1={RULER.y - 5} x2={backX(m)} y2={RULER.y + 5} stroke={INK.distant} />
                  {m % 1000 === 0 && (
                    <Txt x={backX(m)} y={RULER.y + 20} size={10} anchor="middle" fill={INK.muted}>
                      {m === 0 ? 'probe' : `−${fmt(m)}`}
                    </Txt>
                  )}
                </g>
              ) : null,
            )}
            <rect x={RULER.x1 - 4} y={RULER.y - 11} width={8} height={22} rx={2} fill={INK.text} />
            <rect x={rulerX0 - 4} y={RULER.y - 11} width={8} height={22} rx={2} fill={INK.distant} />
            <Txt x={RULER.x1 + 4} y={RULER.y - 36} size={14} anchor="end" weight={600} opacity={clamp01(ruler * 3 - 2)}>
              {`median furthest evidence: ${fmt(MEDIAN_DISTANCE)} messages`}
            </Txt>
            <Txt x={RULER.x1 + 4} y={RULER.y + 44} size={11.5} anchor="end" fill={INK.muted} opacity={clamp01(ruler * 3 - 2)}>
              memory-bearing probes, recorded · Paper §6
            </Txt>
          </g>
        )}

        {/* the two questions */}
        <Txt x={INSET.x + INSET_W / 2 - 3} y={274} size={26} weight={600} anchor="middle" fill={INK.distant} opacity={on(b, 9)}>
          Need
        </Txt>
        <Txt x={(RULER.x1 + backX(MEDIAN_DISTANCE)) / 2} y={274} size={26} weight={600} anchor="middle" fill={INK.distant} opacity={on(b, 9)}>
          Reach
        </Txt>
      </Camera>

      <Heading n={2} title="Rare does not mean nearby" />
      <SourceNote beat={b} notes={NOTES} />
    </g>
  );
}

export const vizScene = () => scene;
