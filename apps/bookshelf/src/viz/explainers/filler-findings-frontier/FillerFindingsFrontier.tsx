// arXiv:2607.03502 — "Reading Between the Dots", chapter 4: the findings on
// frontier models, reported honestly. The paper studies two open-weights
// models (DeepSeek V3, Kimi K2) across four task families and builds a
// four-stage unsupervised decoding pipeline (Section 5: extraction ->
// logit lens -> aggregation -> LLM judge) that recovers the hidden
// intermediate values from the filler positions. Numbers replotted verbatim:
//   decoding accuracy — one-fact 94.3% · two-fact 82.3 / 90.0 ·
//   letter position 92.7 / 90.2 · equations 82.1
//   layer story — intermediates emerge early in the fillers, compositions
//   crystallize late (Fig. 3); failures often HAVE the addends but LACK the
//   sum. Caveats stated by the authors and repeated here on screen: logit
//   lens is unreliable in early layers, only discrete nameable intermediates
//   are decodable, and closed-weights models could not be tested.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
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
// The reported numbers (module scope, verbatim from the paper).
// ---------------------------------------------------------------------------

const PIPELINE = ['extract hidden states', 'logit lens readout', 'aggregate over positions', 'judge the candidates'];

const DECODE = [
  { task: 'one fact addition', v3: 94.3, k2: null as number | null },
  { task: 'two fact addition', v3: 82.3, k2: 90.0 },
  { task: 'letter position', v3: 92.7, k2: 90.2 },
  { task: 'system of equations', v3: 82.1, k2: null },
];

const CAVEATS = [
  'logit lens is unreliable in early layers',
  'only discrete, nameable intermediates are decodable',
  'authors evaluating their own pipeline, two models, one scale',
  'closed-weights frontier models could not be tested',
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const RAIL_Y = 200;
const RAIL_X0 = 150;
const RAIL_DX = 270;

const BARS_Y = 330;
const BAR_MAX = 300;

const CAV_Y = 300;

const CAM_RAIL: CameraState = { x: 640, y: 210, k: 1.25 };
const CAM_BARS: CameraState = { x: 600, y: 400, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  railU: ChannelRef<number>;
  barsU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  layerU: ChannelRef<number>;
  failU: ChannelRef<number>;
  cavU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const railU = tl.channel('railU', 0);
  const barsU = tl.channel('barsU', 0);
  const fillU = tl.channel('fillU', 0);
  const layerU = tl.channel('layerU', 0);
  const failU = tl.channel('failU', 0);
  const cavU = tl.channel('cavU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the pipeline
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Now the real experiment. Two open weights frontier models, four task families, and a decoding pipeline with no supervision: extract the hidden states, read them through the lens, aggregate, and let a judge name the best candidate.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_RAIL, { at: 0.8, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 1.2, dur: 3.0, ease: ease.draw });
  tl.hold(6.3, 0.6);

  // Beat 2 — the headline numbers
  tl.caption({
    at: 6.9,
    dur: 5.6,
    text: 'The question was whether the hidden intermediates are readable at all. The answer: mostly yes. Here is how often the pipeline recovered them.',
  });
  tl.tween(cam, CAM_BARS, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 1, { at: 8.2, dur: 1.0, ease: ease.enter });
  tl.tween(fillU, 1, { at: 9.4, dur: 2.4, ease: ease.move });
  tl.caption({
    at: 12.9,
    dur: 6.2,
    text: 'Ninety four percent on single fact retrieval. Eighty to ninety on the harder families — across both models. The scratch work in the dots is not just present; it is decodable, eight or nine times out of ten.',
  });
  tl.hold(19.1, 0.7);

  // Beat 3 — the layer story + failures
  tl.caption({
    at: 19.8,
    dur: 6.0,
    text: 'The traces even have an anatomy. Retrieved facts surface early in the filler region; the final composition crystallizes only in late layers — the same shape our toy predicted.',
  });
  tl.tween(layerU, 1, { at: 20.6, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 26.0,
    dur: 6.0,
    text: 'And the failures are diagnostic. When the model gets a two fact question wrong, the lens often shows both facts sitting right there — retrieved, but never added. The trace records where the computation broke.',
  });
  tl.tween(failU, 1, { at: 27.2, dur: 0.9, ease: ease.enter });
  tl.hold(32.0, 0.7);

  // Beat 4 — the caveats
  tl.caption({
    at: 32.7,
    dur: 6.0,
    text: 'Now the caveats, straight from the paper. The lens is noisy in early layers. Only intermediates you can name in vocabulary are decodable — computation that never projects onto tokens stays invisible.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 33.0, dur: 1.4, ease: ease.move });
  tl.tween(barsU, 0.15, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(layerU, 0.15, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(failU, 0.15, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(railU, 0.15, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(cavU, 1, { at: 34.0, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 39.1,
    dur: 5.6,
    text: 'And the biggest one: this is two open weights models, tested by the pipeline’s own authors. Whether closed frontier models behave the same way is exactly what nobody outside can check.',
  });
  tl.hold(44.7, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 45.4,
    dur: 5.4,
    text: 'So the finding, stated at its honest size: on the models we can open, hidden filler computation is real, structured, and about eighty to ninety percent readable.',
  });
  tl.tween(closeU, 1, { at: 46.2, dur: 1.0, ease: ease.enter });
  tl.hold(50.8, 1.2);

  return { tl, cam, titleU, railU, barsU, fillU, layerU, failU, cavU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/filler-findings-frontier/overrides.json',
  slug: 'filler-findings-frontier',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const railU = s.get(scene.railU);
  const barsU = s.get(scene.barsU);
  const fillU = s.get(scene.fillU);
  const layerU = s.get(scene.layerU);
  const failU = s.get(scene.failU);
  const cavU = s.get(scene.cavU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * closeU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the pipeline rail */}
          <g opacity={Math.min(1, railU * 1.2)}>
            {PIPELINE.map((step, i) => {
              const u = clamp01(railU * PIPELINE.length - i);
              if (u <= 0) return null;
              const x = RAIL_X0 + i * RAIL_DX;
              return (
                <g key={step} opacity={u}>
                  {i > 0 && (
                    <line x1={x - RAIL_DX + 208} y1={RAIL_Y + 20} x2={x - 8} y2={RAIL_Y + 20} stroke={colors.GRID} strokeWidth={2.5} />
                  )}
                  <rect x={x} y={RAIL_Y} width={208} height={40} rx={9} fill={colors.PANEL} stroke={colors.TEAL} />
                  <text x={x + 104} y={RAIL_Y + 25} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                    {step}
                  </text>
                </g>
              );
            })}
            <text x={RAIL_X0} y={RAIL_Y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={railU}>
              unsupervised decoding pipeline · Section 5
            </text>
          </g>

          {/* decoding accuracy bars */}
          {barsU > 0 && (
            <g opacity={barsU}>
              <text x={150} y={BARS_Y - 12} fill={colors.TEXT} fontSize={16}>
                how often the hidden intermediates were decoded
              </text>
              <text x={150} y={BARS_Y + 8} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                reported (DeepSeek V3 / Kimi K2) — replotted, not re-run
              </text>
              {DECODE.map((r, i) => {
                const y = BARS_Y + 34 + i * 46;
                const w1 = (r.v3 / 100) * BAR_MAX * fillU;
                const w2 = r.k2 === null ? 0 : (r.k2 / 100) * BAR_MAX * fillU;
                return (
                  <g key={r.task}>
                    <text x={150} y={y + 12} fill={colors.MUTED} fontSize={13}>
                      {r.task}
                    </text>
                    <rect x={360} y={y} width={w1} height={13} rx={3} fill={colors.ACCENT} opacity={0.85} />
                    <text x={366 + w1} y={y + 11} fill={colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={fillU}>
                      {r.v3}
                    </text>
                    {r.k2 !== null && (
                      <>
                        <rect x={360} y={y + 16} width={w2} height={13} rx={3} fill={colors.SECONDARY} opacity={0.85} />
                        <text x={366 + w2} y={y + 27} fill={colors.SECONDARY} fontSize={12} fontFamily="monospace" opacity={fillU}>
                          {r.k2}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the layer story */}
          {layerU > 0 && (
            <g opacity={layerU}>
              <text x={800} y={BARS_Y - 12} fill={colors.TEXT} fontSize={16}>
                where things surface (Fig. 3)
              </text>
              {[
                { label: 'fact one', c: colors.ACCENT, x0: 0.1, x1: 0.35, row: 0 },
                { label: 'fact two', c: colors.SECONDARY, x0: 0.25, x1: 0.5, row: 1 },
                { label: 'the sum', c: colors.POSITIVE, x0: 0.68, x1: 0.95, row: 2 },
              ].map((b) => (
                <g key={b.label}>
                  <text x={800} y={BARS_Y + 36 + b.row * 34} fill={colors.MUTED} fontSize={12}>
                    {b.label}
                  </text>
                  <rect x={880} y={BARS_Y + 24 + b.row * 34} width={280} height={16} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
                  <rect
                    x={880 + 280 * b.x0}
                    y={BARS_Y + 24 + b.row * 34}
                    width={280 * (b.x1 - b.x0) * layerU}
                    height={16}
                    rx={4}
                    fill={b.c}
                    opacity={0.8}
                  />
                </g>
              ))}
              <text x={880} y={BARS_Y + 24 + 3 * 34 + 8} fill={colors.MUTED} fontSize={11}>
                early layers ————————— late layers
              </text>
              {failU > 0 && (
                <text x={800} y={BARS_Y + 24 + 4 * 34 + 8} fill={colors.WARM} fontSize={13} opacity={failU}>
                  in failures: both facts present, the sum missing
                </text>
              )}
            </g>
          )}

          {/* caveats */}
          {cavU > 0 && (
            <g opacity={cavU}>
              <rect x={240} y={CAV_Y - 46} width={800} height={40 + CAVEATS.length * 38} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
              <text x={270} y={CAV_Y - 16} fill={colors.WARM} fontSize={17} fontWeight={600}>
                the authors’ own caveats
              </text>
              {CAVEATS.map((c, i) => {
                const u = clamp01(cavU * CAVEATS.length - i);
                return (
                  <text key={c} x={270} y={CAV_Y + 20 + i * 38} fill={colors.TEXT} fontSize={15} opacity={u}>
                    · {c}
                  </text>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The findings, at their honest size
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.03502 · §5, Fig. 3
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Readable — where we can look.
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            80–95% of hidden intermediates decoded, on two open models,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            by the method’s own authors. Closed models remain untested.
          </text>
        </g>
      )}
    </>
  );
}

export function FillerFindingsFrontier() {
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
