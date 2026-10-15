import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { CARDS, BARS, H1_UNCHANGED, SCORES, buildScene } from './scene';

/**
 * Ablation — proof by removal.
 * Pure render: three circuit cards (full, head-1 knocked out, head-2 knocked
 * out) with real 9/9 → 0/9 → 0/9 scores, and the surgical-survival chip
 * (head 1's pattern verified bit-for-bit identical under the head-2 cut).
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/ablation/overrides.json', slug: 'ablation' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function CircuitCard({
  c,
  title,
  h1Dead,
  h2Dead,
  score,
  u,
}: {
  c: { x: number; y: number; w: number; h: number };
  title: string;
  h1Dead: boolean;
  h2Dead: boolean;
  score: string;
  u: number;
}) {
  if (u <= 0) return null;
  const cx = c.x + c.w / 2;
  const y1 = c.y + 214; // head 1 (previous token), lower in the stack
  const y2 = c.y + 124; // head 2 (induction)
  const ok = !h1Dead && !h2Dead;
  // knockout mark sits in the gutter beside its head, so it never crosses the head's label
  const xMark = cx + 132;
  const knockX = (y: number) => (
    <g stroke={colors.NEGATIVE} strokeWidth={3.5} strokeLinecap="round">
      <line x1={xMark - 11} y1={y - 11} x2={xMark + 11} y2={y + 11} />
      <line x1={xMark - 11} y1={y + 11} x2={xMark + 11} y2={y - 11} />
    </g>
  );
  return (
    <g opacity={u}>
      <rect x={c.x} y={c.y} width={c.w} height={c.h} rx={14} fill={colors.PANEL} opacity={0.55} stroke={ok ? colors.GRID : colors.NEGATIVE} strokeWidth={1.6} />
      <text x={cx} y={c.y + 30} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
        {title}
      </text>
      {/* tokens in */}
      <text x={cx} y={c.y + c.h - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
        tokens in
      </text>
      {/* head 1 box */}
      <g opacity={h1Dead ? 0.4 : 1}>
        <rect x={cx - 105} y={y1 - 22} width={210} height={44} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={2} />
        <text x={cx} y={y1 + 5} textAnchor="middle" fill={colors.SECONDARY} fontSize={14}>
          head 1 · previous token
        </text>
      </g>
      {/* head 2 box */}
      <g opacity={h2Dead ? 0.4 : 1}>
        <rect x={cx - 105} y={y2 - 22} width={210} height={44} rx={10} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
        <text x={cx} y={y2 + 5} textAnchor="middle" fill={colors.WARM} fontSize={14}>
          head 2 · induction
        </text>
      </g>
      {/* wires */}
      <line x1={cx} y1={y1 + 22} x2={cx} y2={c.y + c.h - 30} stroke={colors.GRID} strokeWidth={2} opacity={h1Dead ? 0.25 : 0.9} />
      <line x1={cx} y1={y1 - 22} x2={cx} y2={y2 + 22} stroke={colors.GRID} strokeWidth={2} opacity={h1Dead || h2Dead ? 0.25 : 0.9} />
      <line x1={cx} y1={y2 - 22} x2={cx} y2={c.y + 72} stroke={colors.GRID} strokeWidth={2} opacity={h2Dead ? 0.25 : 0.9} />
      {/* knockout marks */}
      {h1Dead && knockX(y1)}
      {h2Dead && knockX(y2)}
      {/* score chip */}
      <rect x={cx - 62} y={c.y + 44} width={124} height={28} rx={8} fill={colors.BG} stroke={ok ? colors.POSITIVE : colors.NEGATIVE} strokeWidth={1.6} />
      <text x={cx} y={c.y + 63} textAnchor="middle" fill={ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={14} fontFamily="ui-monospace, monospace">
        {score}
      </text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const card0U = s.get(scene.card0U);
  const card1U = s.get(scene.card1U);
  const card2U = s.get(scene.card2U);
  const barsProg = s.get(scene.barsProg);
  const surviveU = s.get(scene.surviveU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          <CircuitCard c={CARDS[0]} title="full circuit" h1Dead={false} h2Dead={false} score={`copies ${SCORES[0].ok}/${SCORES[0].tot}`} u={card0U} />
          {/* card 1 steps back while the head-2 knockout is the subject */}
          <CircuitCard c={CARDS[1]} title="ablate head 1" h1Dead={true} h2Dead={false} score={`copies ${SCORES[1].ok}/${SCORES[1].tot}`} u={card1U * (1 - 0.55 * card2U)} />
          <CircuitCard c={CARDS[2]} title="ablate head 2" h1Dead={false} h2Dead={true} score={`copies ${SCORES[2].ok}/${SCORES[2].tot}`} u={card2U} />

          {/* survival chip under card 2 */}
          {surviveU > 0 && H1_UNCHANGED && (
            <g opacity={surviveU}>
              <rect x={CARDS[2].x + 10} y={CARDS[2].y + CARDS[2].h + 14} width={CARDS[2].w - 20} height={40} rx={10} fill={colors.PANEL} opacity={0.93} stroke={colors.POSITIVE} />
              <text x={CARDS[2].x + CARDS[2].w / 2} y={CARDS[2].y + CARDS[2].h + 39} textAnchor="middle" fill={colors.POSITIVE} fontSize={14}>
                head 1 pattern: identical, bit for bit
              </text>
            </g>
          )}

          {/* scoreboard bars */}
          {barsProg > 0 && (
            <g>
              {SCORES.map((sc, i) => {
                const u = clamp01(barsProg - i);
                if (u <= 0) return null;
                const w = sc.ok * BARS.scale * u;
                return (
                  <g key={i} opacity={u}>
                    <text x={BARS.x - 14} y={BARS.y + i * BARS.rowH + 20} textAnchor="end" fill={colors.MUTED} fontSize={14}>
                      {sc.label}
                    </text>
                    <rect x={BARS.x} y={BARS.y + i * BARS.rowH} width={9 * BARS.scale} height={28} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
                    {w > 1 && <rect x={BARS.x + 2} y={BARS.y + i * BARS.rowH + 2} width={w - 4} height={24} rx={6} fill={colors.POSITIVE} opacity={0.85} />}
                    <text x={BARS.x + 9 * BARS.scale + 14} y={BARS.y + i * BARS.rowH + 20} fill={sc.ok > 0 ? colors.POSITIVE : colors.NEGATIVE} fontSize={15} fontFamily="ui-monospace, monospace">
                      {`${sc.ok}/${sc.tot}`}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={225} width={820} height={200} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Ablation
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            9/9 whole · 0/9 with either head removed · upstream behavior intact
          </text>
          <text x={640} y={374} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            interpretability claims are proven by intervention, not by looking
          </text>
        </g>
      )}
    </>
  );
}

export function Ablation() {
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
