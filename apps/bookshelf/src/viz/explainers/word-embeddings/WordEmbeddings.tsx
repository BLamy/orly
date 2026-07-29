import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Vec } from '../../primitives';
import overrides from './overrides.json';
import {
  ANALOGY_1,
  ANALOGY_2,
  CLUSTERS,
  COS_CAT_APPLE,
  COS_CAT_DOG,
  POS,
  SCATTER,
  WORDS,
  buildScene,
  posOf,
  resultPos,
} from './scene';
import type { Group } from './scene';

/**
 * Word Embeddings — words become directions.
 * Pure render: every visual value comes from the sampled SceneState or a
 * module-scope precomputation in scene.ts (which also numerically verifies
 * both analogies). No local clocks, no randomness.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/word-embeddings/overrides.json', slug: 'word-embeddings' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const GROUP_COLOR: Record<Group, string> = {
  people: colors.ACCENT,
  royals: colors.WARM,
  animals: colors.POSITIVE,
  foods: colors.NEGATIVE,
};

// per-word stagger for the entrance and the formation lerp
const STAG = 0.35;
const wordU = (base: number, i: number): number =>
  clamp01(base * (1 + STAG) - (i / (WORDS.length - 1)) * STAG);

// the words each analogy beat spotlights (everything else dims)
const FOCUS_1 = new Set([ANALOGY_1.a, ANALOGY_1.b, ANALOGY_1.c, ANALOGY_1.target]);
const FOCUS_2 = new Set([ANALOGY_2.a, ANALOGY_2.b, ANALOGY_2.c, ANALOGY_2.target]);

// analogy stage geometry (projection is linear, so the translated difference
// arrow ends exactly at the projected 4-D result)
const RES_1 = resultPos(ANALOGY_1);
const RES_2 = resultPos(ANALOGY_2);

// the similarity beat's probes
const CAT = posOf('cat');
const DOG = posOf('dog');
const APPLE = posOf('apple');

/** A difference arrow b→a, then the same arrow re-rooted at c (the "ghost"). */
function AnalogyArrows({
  a,
  b,
  c,
  res,
  vecU,
  ghostU,
  resU,
}: {
  a: readonly [number, number];
  b: readonly [number, number];
  c: readonly [number, number];
  res: readonly [number, number];
  vecU: number;
  ghostU: number;
  resU: number;
}) {
  return (
    <g>
      {vecU > 0 && (
        <Vec
          x1={b[0]}
          y1={b[1]}
          x2={a[0]}
          y2={a[1]}
          grow={Math.min(1, vecU)}
          color={colors.SECONDARY}
          width={3}
          head={10}
          opacity={Math.min(1, vecU)}
        />
      )}
      {ghostU > 0 && (
        <Vec
          x1={c[0]}
          y1={c[1]}
          x2={res[0]}
          y2={res[1]}
          grow={Math.min(1, ghostU)}
          color={colors.SECONDARY}
          width={3}
          head={10}
          opacity={0.8 * Math.min(1, ghostU)}
        />
      )}
      {resU > 0 && (
        <g opacity={Math.min(1, resU)}>
          <circle cx={res[0]} cy={res[1]} r={5.5 * Math.min(1, resU)} fill={colors.SECONDARY} />
        </g>
      )}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const dotsU = s.get(scene.dotsU);
  const formU = s.get(scene.formU);
  const labelU = s.get(scene.labelU);
  const featU = s.get(scene.featU);
  const clusterU = s.get(scene.clusterU);
  const simU = s.get(scene.simU);
  const vec1U = s.get(scene.vec1U);
  const ghost1U = s.get(scene.ghost1U);
  const res1U = s.get(scene.res1U);
  const tex1U = s.get(scene.tex1U);
  const vec2U = s.get(scene.vec2U);
  const ghost2U = s.get(scene.ghost2U);
  const res2U = s.get(scene.res2U);
  const tex2U = s.get(scene.tex2U);
  const focus1U = s.get(scene.focus1U);
  const focus2U = s.get(scene.focus2U);
  const worldU = s.get(scene.worldU);
  const endU = s.get(scene.endU);

  const simLabelU = clamp01((simU - 0.6) / 0.4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={worldU}>
        <Camera {...cam}>
          {/* cluster halos + names */}
          {clusterU > 0 &&
            CLUSTERS.map((c) => (
              <g key={c.group} opacity={clusterU}>
                <circle
                  cx={c.cx}
                  cy={c.cy}
                  r={c.r}
                  fill={GROUP_COLOR[c.group]}
                  fillOpacity={0.07}
                  stroke={GROUP_COLOR[c.group]}
                  strokeOpacity={0.3}
                  strokeDasharray="4 5"
                />
                <text
                  x={c.cx + c.labelDx}
                  y={c.cy + c.labelDy}
                  textAnchor="middle"
                  fill={colors.MUTED}
                  fontSize={17}
                  fontStyle="italic"
                >
                  {c.label}
                </text>
              </g>
            ))}

          {/* the similarity probes: two 4-D cosines, drawn between the dots */}
          {simU > 0 && (
            <g>
              <Vec
                x1={CAT[0]}
                y1={CAT[1]}
                x2={DOG[0]}
                y2={DOG[1]}
                grow={simU}
                color={colors.TEAL}
                width={2.4}
                head={7}
                opacity={simU}
              />
              <Vec
                x1={CAT[0]}
                y1={CAT[1]}
                x2={APPLE[0]}
                y2={APPLE[1]}
                grow={simU}
                color={colors.TEAL}
                width={2.4}
                head={7}
                opacity={simU}
              />
              <MathLabel
                tex={`\\cos(\\text{cat},\\text{dog}) = ${COS_CAT_DOG.toFixed(2)}`}
                x={655}
                y={455}
                fontSize={16}
                color={colors.TEAL}
                opacity={simLabelU}
              />
              <MathLabel
                tex={`\\cos(\\text{cat},\\text{apple}) = ${COS_CAT_APPLE.toFixed(2)}`}
                x={330}
                y={250}
                fontSize={16}
                color={colors.TEAL}
                opacity={simLabelU}
              />
            </g>
          )}

          {/* the vocabulary: seeded scatter condensing into the projection */}
          {WORDS.map((w, i) => {
            const appear = wordU(dotsU, i);
            if (appear <= 0) return null;
            const f = wordU(formU, i);
            const x = lerp(SCATTER[i][0], POS[i][0], f);
            const y = lerp(SCATTER[i][1], POS[i][1], f);
            const dim =
              1 -
              0.75 *
                Math.max(
                  focus1U * (FOCUS_1.has(w.word) ? 0 : 1),
                  focus2U * (FOCUS_2.has(w.word) ? 0 : 1),
                );
            return (
              <g key={w.word} opacity={appear * dim}>
                <circle cx={x} cy={y} r={5.5 * appear} fill={GROUP_COLOR[w.group]} />
                <text
                  x={x + w.lx}
                  y={y + w.ly}
                  textAnchor={w.lx > 8 ? 'start' : w.lx < -8 ? 'end' : 'middle'}
                  fill={colors.TEXT}
                  fontSize={14}
                  opacity={labelU}
                >
                  {w.word}
                </text>
              </g>
            );
          })}

          {/* analogy 1: king − man + woman ≈ queen (fades to a whisper for analogy 2) */}
          <g opacity={1 - 0.85 * focus2U}>
            <AnalogyArrows
              a={posOf(ANALOGY_1.a)}
              b={posOf(ANALOGY_1.b)}
              c={posOf(ANALOGY_1.c)}
              res={RES_1}
              vecU={vec1U}
              ghostU={ghost1U}
              resU={res1U}
            />
            {res1U > 0 && (
              <circle
                cx={posOf(ANALOGY_1.target)[0]}
                cy={posOf(ANALOGY_1.target)[1]}
                r={17}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={Math.min(1, res1U)}
              />
            )}
          </g>

          {/* analogy 2: dog − puppy + kitten ≈ cat */}
          <AnalogyArrows
            a={posOf(ANALOGY_2.a)}
            b={posOf(ANALOGY_2.b)}
            c={posOf(ANALOGY_2.c)}
            res={RES_2}
            vecU={vec2U}
            ghostU={ghost2U}
            resU={res2U}
          />
          {res2U > 0 && (
            <circle
              cx={posOf(ANALOGY_2.target)[0]}
              cy={posOf(ANALOGY_2.target)[1]}
              r={13}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={2}
              strokeDasharray="4 4"
              opacity={Math.min(1, res2U)}
            />
          )}
        </Camera>
      </g>

      {/* the feature readout (screen-fixed, bottom-left, above the CC strip) */}
      {featU > 0 && (
        <g opacity={featU}>
          <rect
            x={40}
            y={468}
            width={400}
            height={142}
            rx={12}
            fill={colors.PANEL}
            opacity={0.92}
            stroke={colors.GRID}
          />
          <text x={64} y={500} fill={colors.TEXT} fontSize={16}>
            four hand-picked features
          </text>
          <MathLabel
            tex="\text{king} = [\,-1.0,\ \ 1.0,\ \ 0.5,\ \ 0.0\,]"
            x={64}
            y={526}
            anchor="start"
            fontSize={18}
            color={colors.WARM}
          />
          <text x={124} y={584} fill={colors.MUTED} fontSize={13}>
            gender
          </text>
          <text x={196} y={584} fill={colors.MUTED} fontSize={13}>
            royalty
          </text>
          <text x={268} y={584} fill={colors.MUTED} fontSize={13}>
            size
          </text>
          <text x={318} y={584} fill={colors.MUTED} fontSize={13}>
            edibility
          </text>
        </g>
      )}

      {/* screen-fixed analogy equations (top strip, clear of the clusters) */}
      <MathLabel
        tex="\vec{v}_{\text{king}} - \vec{v}_{\text{man}} + \vec{v}_{\text{woman}}"
        x={650}
        y={54}
        anchor="start"
        fontSize={21}
        color={colors.SECONDARY}
        opacity={tex1U}
      />
      <MathLabel
        tex="\approx\ \vec{v}_{\text{queen}}"
        x={942}
        y={54}
        anchor="start"
        fontSize={21}
        color={colors.WARM}
        opacity={Math.min(tex1U, res1U)}
      />
      <MathLabel
        tex="\vec{v}_{\text{dog}} - \vec{v}_{\text{puppy}} + \vec{v}_{\text{kitten}}"
        x={650}
        y={54}
        anchor="start"
        fontSize={21}
        color={colors.SECONDARY}
        opacity={tex2U}
      />
      <MathLabel
        tex="\approx\ \vec{v}_{\text{cat}}"
        x={952}
        y={54}
        anchor="start"
        fontSize={21}
        color={colors.POSITIVE}
        opacity={Math.min(tex2U, res2U)}
      />

      {/* the closing beat — the world has faded to a whisper behind it */}
      {endU > 0 && (
        <g opacity={endU}>
          <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={38} fontWeight={600}>
            Meaning is geometry.
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={18}>
            The model never sees words — only directions.
          </text>
        </g>
      )}
    </>
  );
}

export function WordEmbeddings() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
