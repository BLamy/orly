import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  ANGLE_A,
  ANGLE_B,
  COS_A,
  COS_B,
  DOC_A,
  DOC_B,
  DOT_A,
  DOT_B,
  OX,
  OY,
  Q,
  SCALE,
  buildScene,
  unit,
  vx,
  vy,
} from './scene';
import type { V2 } from './scene';

/**
 * Cosine Similarity — pure render. Every arrow, score, and angle is the
 * real arithmetic from scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/cosine-similarity/overrides.json',
  slug: 'cosine-similarity',
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpV = (a: V2, b: V2, t: number): V2 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

function Arrow({
  v,
  grow,
  color,
  label,
  lx = 14,
  ly = -6,
  anchor = 'start',
  width = 3.5,
}: {
  v: V2;
  grow: number;
  color: string;
  label?: string;
  /** label offset from the arrow tip, so labels of near-parallel arrows can sit apart */
  lx?: number;
  ly?: number;
  anchor?: 'start' | 'end';
  width?: number;
}) {
  if (grow <= 0) return null;
  const tip: V2 = { x: v.x * grow, y: v.y * grow };
  const ang = Math.atan2(-(vy(tip) - OY), vx(tip) - OX);
  return (
    <g>
      <line x1={OX} y1={OY} x2={vx(tip)} y2={vy(tip)} stroke={color} strokeWidth={width} />
      <path
        d={`M${vx(tip)} ${vy(tip)} L${vx(tip) - 13 * Math.cos(ang - 0.42)} ${vy(tip) + 13 * Math.sin(ang - 0.42)} L${vx(tip) - 13 * Math.cos(ang + 0.42)} ${vy(tip) + 13 * Math.sin(ang + 0.42)} Z`}
        fill={color}
      />
      {label && (
        <text
          x={vx(tip) + lx}
          y={vy(tip) + ly}
          fill={color}
          fontSize={15}
          fontWeight={600}
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Words the opening caption talks about: they become vectors, then fade as the query arrives. */
const CHIPS: { word: string; x: number; y: number }[] = [
  { word: 'espresso', x: 330, y: 330 },
  { word: 'grinder', x: 440, y: 262 },
  { word: 'crema', x: 320, y: 200 },
];

function arcPath(v: V2, r: number): string {
  const a0 = Math.atan2(Q.y, Q.x);
  const a1 = Math.atan2(v.y, v.x);
  const x0 = OX + r * Math.cos(a0);
  const y0 = OY - r * Math.sin(a0);
  const x1 = OX + r * Math.cos(a1);
  const y1 = OY - r * Math.sin(a1);
  return `M${x0} ${y0} A${r} ${r} 0 0 ${a1 > a0 ? 0 : 1} ${x1} ${y1}`;
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const axU = s.get(scene.axU);
  const qU = s.get(scene.qU);
  const aU = s.get(scene.aU);
  const bU = s.get(scene.bU);
  const dotU = s.get(scene.dotU);
  const normW = s.get(scene.normW);
  const circU = s.get(scene.circU);
  const arcU = s.get(scene.arcU);
  const cosU = s.get(scene.cosU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const qNow = lerpV(Q, unit(Q), normW);
  const aNow = lerpV(DOC_A, unit(DOC_A), normW);
  const bNow = lerpV(DOC_B, unit(DOC_B), normW);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axes */}
          <g opacity={axU}>
            <line x1={OX - 60} y1={OY} x2={OX + 5.6 * SCALE} y2={OY} stroke={colors.MUTED} strokeOpacity={0.6} />
            <line x1={OX} y1={OY + 50} x2={OX} y2={OY - 2.6 * SCALE} stroke={colors.MUTED} strokeOpacity={0.6} />
            <text x={OX - 16} y={OY + 22} fill={colors.MUTED} fontSize={14}>
              0
            </text>
          </g>

          {/* the words the caption names, before they become vectors */}
          {CHIPS.map((c) => (
            <g key={c.word} opacity={axU * (1 - qU)}>
              <rect x={c.x - 56} y={c.y - 16} width={112} height={32} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={c.x} y={c.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
                {c.word}
              </text>
            </g>
          ))}

          {/* unit circle */}
          {circU > 0 && (
            <g opacity={circU}>
              <circle cx={OX} cy={OY} r={SCALE} fill="none" stroke={colors.MUTED} strokeDasharray="6 7" opacity={0.6} />
              <text x={OX + SCALE * 0.72} y={OY + SCALE * 0.8} fill={colors.MUTED} fontSize={14}>
                the unit circle
              </text>
            </g>
          )}

          {/* angle arcs: each label sits outside its arc, clear of both rays */}
          {arcU > 0 && (
            <g opacity={arcU}>
              <path d={arcPath(DOC_A, SCALE * 0.55)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
              <path d={arcPath(DOC_B, SCALE * 0.8)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} />
              <text x={OX + SCALE * 0.7 * Math.cos(-0.14)} y={OY - SCALE * 0.7 * Math.sin(-0.14)} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={600}>
                {`${ANGLE_A.toFixed(0)}°`}
              </text>
              <text x={OX + SCALE * 0.94 * Math.cos(0.47)} y={OY - SCALE * 0.94 * Math.sin(0.47)} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} fontWeight={600}>
                {`${ANGLE_B.toFixed(0)}°`}
              </text>
            </g>
          )}

          {/* the vectors: query label sits below its ray, A's above, so they never meet */}
          <Arrow
            v={qNow}
            grow={qU}
            color={colors.WARM}
            label="query"
            lx={normW > 0.5 ? -14 : 14}
            ly={22}
            anchor={normW > 0.5 ? 'end' : 'start'}
          />
          <Arrow
            v={aNow}
            grow={aU}
            color={colors.POSITIVE}
            label={normW > 0.5 ? 'Â' : 'A — short, on-topic'}
            lx={normW > 0.5 ? 4 : 14}
            ly={-10}
          />
          <Arrow
            v={bNow}
            grow={bU}
            color={colors.NEGATIVE}
            label={normW > 0.5 ? 'B̂' : 'B — long, off-angle'}
            lx={normW > 0.5 ? 14 : -14}
            ly={normW > 0.5 ? -6 : -12}
            anchor={normW > 0.5 ? 'start' : 'end'}
          />
        </g>
      </Camera>

      {/* dot-product scoreboard: fully gone once the cosine board takes over */}
      {dotU > 0 && (
        <g opacity={dotU * dimU * (1 - cosU)}>
          <rect x={905} y={110} width={310} height={110} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={928} y={142} fill={colors.TEXT} fontSize={15} fontWeight={650}>
            raw dot product
          </text>
          <text x={928} y={172} fill={colors.NEGATIVE} fontSize={15}>
            {`B: ${DOT_B.toFixed(2)}   ← “winner”`}
          </text>
          <text x={928} y={200} fill={colors.POSITIVE} fontSize={15}>
            {`A: ${DOT_A.toFixed(2)}`}
          </text>
        </g>
      )}

      {/* cosine scoreboard */}
      {cosU > 0 && (
        <g opacity={cosU * dimU}>
          <rect x={905} y={250} width={310} height={110} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={928} y={282} fill={colors.TEXT} fontSize={15} fontWeight={650}>
            cosine — angle only
          </text>
          <text x={928} y={312} fill={colors.POSITIVE} fontSize={15}>
            {`A: ${COS_A.toFixed(3)}   ← winner`}
          </text>
          <text x={928} y={340} fill={colors.NEGATIVE} fontSize={15}>
            {`B: ${COS_B.toFixed(3)}`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Cosine Similarity
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={600}>
            {'cos θ = (q · d) / (‖q‖ ‖d‖)'}
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>
            {'meaning = direction'}
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            normalize, or your search engine quietly prefers long documents
          </text>
        </g>
      )}
    </>
  );
}

export function CosineSimilarity() {
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
