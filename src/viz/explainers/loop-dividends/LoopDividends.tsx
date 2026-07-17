// arXiv:2607.13491 — DeepLoop, chapter 4: what it buys. Every number in this
// chapter is REPORTED from the paper (Tables 1–2; FineWeb-Edu, 50B tokens,
// GPT-2 Small and Medium, loop counts R = 1, 3, 5, 7) and labeled as such —
// nothing here was re-run. Neutrality at R = 1: +0.0004 nats (Small),
// +0.0011 (Medium). At R = 7: −0.0186 (Small), −0.0278 (Medium). Downstream
// 8-task averages at R = 7 (Medium): 0-shot 52.95 → 53.88, 1-shot
// 54.62 → 55.20, winning 7 of 8 tasks.
import { scaleLinear } from 'd3';
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
import { Axes } from '../../primitives';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// REPORTED data (arXiv:2607.13491, Table 1 & Table 2). Not re-run.
// ---------------------------------------------------------------------------

const RS = [1, 3, 5, 7];
const SMALL_BASE = [2.8627, 2.8077, 2.791, 2.77];
const SMALL_DL = [2.8631, 2.7917, 2.7679, 2.7514];
const MED_BASE = [2.6253, 2.5779, 2.564, 2.5558];
const MED_DL = [2.6264, 2.5627, 2.5444, 2.528];

// Downstream (Medium, R = 7, 8-task averages).
const DOWN = [
  { label: '0-shot avg', base: 52.95, dl: 53.88 },
  { label: '1-shot avg', base: 54.62, dl: 55.2 },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const SM_X = scaleLinear().domain([0.6, 7.4]).range([140, 560]);
const SM_Y = scaleLinear().domain([2.74, 2.88]).range([560, 300]);
const MD_X = scaleLinear().domain([0.6, 7.4]).range([700, 1120]);
const MD_Y = scaleLinear().domain([2.51, 2.64]).range([560, 300]);

const BAR_X = 340;
const BAR_Y = 250;
const BAR_W = 600;
const BAR_SCALE = scaleLinear().domain([50, 56]).range([0, BAR_W]);

const CAM_SMALL: CameraState = { x: 380, y: 400, k: 1.25 };
const CAM_R1: CameraState = { x: 300, y: 500, k: 1.7 };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  axesU: ChannelRef<number>;
  baseTok: ChannelRef<number>;
  dlTok: ChannelRef<number>;
  r1U: ChannelRef<number>;
  gapU: ChannelRef<number>;
  lossDimU: ChannelRef<number>;
  downU: ChannelRef<number>;
  downTok: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const titleU = tl.channel('titleU', 0);
  const axesU = tl.channel('axesU', 0);
  const baseTok = tl.channel('baseTok', 0); // baseline curves draw 0..4
  const dlTok = tl.channel('dlTok', 0); // deeploop curves draw 0..4
  const r1U = tl.channel('r1U', 0); // R=1 neutrality callout
  const gapU = tl.channel('gapU', 0); // R=7 gap callout
  const lossDimU = tl.channel('lossDimU', 0); // fade loss plots for downstream
  const downU = tl.channel('downU', 0);
  const downTok = tl.channel('downTok', 0); // bars 0..2
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the experiment
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: 'So does the square root pay off at real scale? The authors trained G P T two small and medium on fifty billion tokens, at loop counts one, three, five, and seven. These are their reported numbers, not ours.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(axesU, 1, { at: 1.2, dur: 1.2, ease: ease.draw });
  tl.tween(baseTok, 4, { at: 2.6, dur: 3.2, ease: ease.linear });
  tl.tween(dlTok, 4, { at: 4.0, dur: 3.2, ease: ease.linear });
  tl.hold(7.4, 0.5);

  // Beat 2 — neutrality at R=1
  tl.caption({
    at: 7.9,
    dur: 6.8,
    text: 'At loop count one, where no block is revisited, the two curves are indistinguishable. Deep Loop costs about four ten-thousandths of a nat on small, one thousandth on medium. Neutral when there is nothing to fix.',
  });
  tl.tween(cam, CAM_R1, { at: 8.2, dur: 1.5, ease: ease.move });
  tl.tween(r1U, 1, { at: 9.4, dur: 0.8, ease: ease.enter });
  tl.hold(14.9, 0.7);

  // Beat 3 — the gap opens
  tl.caption({
    at: 15.6,
    dur: 6.4,
    text: 'Turn the loop on and the gap opens. At seven loops, Deep Loop is about point zero one nine nats better on small, and point zero two eight better on medium.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 15.8, dur: 1.5, ease: ease.move });
  tl.tween(gapU, 1, { at: 17.2, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 22.4,
    dur: 5.8,
    text: 'And on medium the gap keeps widening with loop count — exactly what a visit-counting theory predicts. More revisits, more alignment for the old scaling to mishandle.',
  });
  tl.hold(28.4, 0.7);

  // Beat 4 — downstream
  tl.caption({
    at: 29.1,
    dur: 6.4,
    text: 'It shows up downstream too. On an eight-task suite at seven loops, Deep Loop lifts the zero-shot average by nearly a full point, winning on seven of the eight tasks.',
  });
  tl.tween(lossDimU, 1, { at: 29.4, dur: 1.2, ease: ease.move });
  tl.tween(downU, 1, { at: 30.2, dur: 0.9, ease: ease.enter });
  tl.tween(downTok, 1, { at: 31.0, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 35.9,
    dur: 5.2,
    text: 'One-shot, the average climbs from fifty-four point six to fifty-five point two.',
  });
  tl.tween(downTok, 2, { at: 36.4, dur: 1.6, ease: ease.move });
  tl.hold(41.3, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 42.0,
    dur: 6.0,
    text: 'None of this needed new parameters or extra compute. Only the residual scale and the initialization changed — constants chosen before training even begins.',
  });
  tl.tween(dimU, 1, { at: 42.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 43.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 48.4,
    dur: 4.6,
    text: 'A one line change: neutral while the loop is off, compounding the moment it turns on.',
  });
  tl.hold(53.2, 1.2);

  return {
    tl,
    cam,
    titleU,
    axesU,
    baseTok,
    dlTok,
    r1U,
    gapU,
    lossDimU,
    downU,
    downTok,
    dimU,
    closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/loop-dividends/overrides.json',
  slug: 'loop-dividends',
};

// ---------------------------------------------------------------------------
// Pure render.
// ---------------------------------------------------------------------------

function seriesPath(
  xs: (v: number) => number,
  ys: (v: number) => number,
  vals: number[],
  upTo: number,
): string {
  const n = Math.min(vals.length, Math.ceil(upTo));
  return vals
    .slice(0, n)
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(RS[i])} ${ys(v)}`)
    .join(' ');
}

function LossPlot({
  xs,
  ys,
  base,
  dl,
  baseTok,
  dlTok,
  gapU,
  label,
  gapText,
}: {
  xs: (v: number) => number;
  ys: (v: number) => number;
  base: number[];
  dl: number[];
  baseTok: number;
  dlTok: number;
  gapU: number;
  label: string;
  gapText: string;
}) {
  return (
    <g>
      <text x={xs(0.6)} y={272} fill={colors.TEXT} fontSize={16}>
        {label}
      </text>
      <Axes
        x={scaleLinear().domain([0.6, 7.4]).range([xs(0.6), xs(7.4)])}
        y={scaleLinear().domain([ys === SM_Y ? 2.74 : 2.51, ys === SM_Y ? 2.88 : 2.64]).range([560, 300])}
        reveal={1}
        xTicks={4}
        yTicks={3}
        xLabel="loop count R"
        fontSize={10}
      />
      <path d={seriesPath(xs, ys, base, baseTok)} fill="none" stroke={colors.MUTED} strokeWidth={2.4} />
      {base.map((v, i) => (
        <circle key={`b${i}`} cx={xs(RS[i])} cy={ys(v)} r={3.5} fill={colors.MUTED} opacity={clamp01(baseTok - i)} />
      ))}
      <path d={seriesPath(xs, ys, dl, dlTok)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.6} />
      {dl.map((v, i) => (
        <circle key={`d${i}`} cx={xs(RS[i])} cy={ys(v)} r={3.5} fill={colors.POSITIVE} opacity={clamp01(dlTok - i)} />
      ))}
      {baseTok >= 4 && (
        <>
          <text x={xs(7.2)} y={ys(base[3]) - 10} textAnchor="end" fill={colors.MUTED} fontSize={11}>
            baseline
          </text>
          <text x={xs(7.2)} y={ys(dl[3]) + 20} textAnchor="end" fill={colors.POSITIVE} fontSize={11}>
            DeepLoop
          </text>
        </>
      )}
      <g opacity={gapU}>
        <line x1={xs(7)} y1={ys(base[3])} x2={xs(7)} y2={ys(dl[3])} stroke={colors.WARM} strokeWidth={2} />
        <text x={xs(7) + 8} y={(ys(base[3]) + ys(dl[3])) / 2 + 4} fill={colors.WARM} fontSize={12} fontFamily="monospace">
          {gapText}
        </text>
      </g>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const axesU = s.get(scene.axesU);
  const baseTok = s.get(scene.baseTok);
  const dlTok = s.get(scene.dlTok);
  const r1U = s.get(scene.r1U);
  const gapU = s.get(scene.gapU);
  const lossDimU = s.get(scene.lossDimU);
  const downU = s.get(scene.downU);
  const downTok = s.get(scene.downTok);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <g opacity={axesU * (1 - 0.85 * lossDimU)}>
            <LossPlot
              xs={SM_X}
              ys={SM_Y}
              base={SMALL_BASE}
              dl={SMALL_DL}
              baseTok={baseTok}
              dlTok={dlTok}
              gapU={gapU}
              label="GPT-2 Small — validation loss"
              gapText="−0.0186"
            />
            <LossPlot
              xs={MD_X}
              ys={MD_Y}
              base={MED_BASE}
              dl={MED_DL}
              baseTok={baseTok}
              dlTok={dlTok}
              gapU={gapU}
              label="GPT-2 Medium — validation loss"
              gapText="−0.0278"
            />
            {/* R=1 neutrality callout */}
            <g opacity={r1U}>
              <circle cx={SM_X(1)} cy={SM_Y(SMALL_BASE[0])} r={16} fill="none" stroke={colors.WARM} strokeWidth={2} />
              <text x={SM_X(1) + 24} y={SM_Y(SMALL_BASE[0]) - 14} fill={colors.WARM} fontSize={12} fontFamily="monospace">
                R=1: +0.0004 — indistinguishable
              </text>
            </g>
          </g>
        </Camera>
      </g>

      {/* screen-fixed title + provenance badge */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          What looping buys
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          FineWeb-Edu · 50B tokens · R ∈ {'{1,3,5,7}'}
        </text>
      </g>
      <g opacity={axesU * mainOp}>
        <rect x={1010} y={38} width={230} height={30} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.7} />
        <text x={1125} y={58} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="monospace">
          reported, not re-run
        </text>
      </g>

      {/* downstream bars */}
      <g opacity={downU * mainOp}>
        <rect x={BAR_X - 60} y={BAR_Y - 70} width={BAR_W + 180} height={280} rx={14} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
        <text x={BAR_X - 30} y={BAR_Y - 34} fill={colors.TEXT} fontSize={17}>
          downstream, 8-task average — GPT-2 Medium, R = 7 (reported)
        </text>
        {DOWN.map((d, i) => {
          const u = clamp01(downTok - i);
          const y = BAR_Y + i * 96;
          return (
            <g key={i} opacity={u > 0 ? 1 : 0.15}>
              <text x={BAR_X - 30} y={y + 14} fill={colors.MUTED} fontSize={13}>
                {d.label}
              </text>
              <rect x={BAR_X + 80} y={y} width={BAR_SCALE(d.base) * u} height={18} rx={4} fill={colors.MUTED} opacity={0.75} />
              <text x={BAR_X + 92 + BAR_SCALE(d.base) * u} y={y + 14} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                {d.base.toFixed(2)} base
              </text>
              <rect x={BAR_X + 80} y={y + 26} width={BAR_SCALE(d.dl) * u} height={18} rx={4} fill={colors.POSITIVE} opacity={0.9} />
              <text x={BAR_X + 92 + BAR_SCALE(d.dl) * u} y={y + 40} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                {d.dl.toFixed(2)} DeepLoop (+{(d.dl - d.base).toFixed(2)})
              </text>
            </g>
          );
        })}
        {downTok >= 1.9 && (
          <text x={BAR_X - 30} y={BAR_Y + 194} fill={colors.MUTED} fontSize={12}>
            wins 7 of 8 tasks in both settings
          </text>
        )}
      </g>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={240} width={800} height={170} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Free where it is idle, paid where it loops.
          </text>
          <text x={640} y={346} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            Same parameters, same compute — only the scaling constants moved.
          </text>
          <text x={640} y={382} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontFamily="monospace">
            Tables 1–2 · arXiv:2607.13491 · reported results
          </text>
        </g>
      )}
    </>
  );
}

export function LoopDividends() {
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
