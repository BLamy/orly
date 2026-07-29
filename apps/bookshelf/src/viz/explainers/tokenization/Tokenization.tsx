import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  CHIP_H,
  FINAL_LEN,
  MERGES,
  N_MERGES,
  STAGES,
  START_LEN,
  buildScene,
  chipWidth,
  layout,
} from './scene';

/**
 * Tokenization — byte pair encoding, running on a real string.
 * Pure render: the token tape is laid out from the RECORDED BPE stages in
 * scene.ts; the merge highlight marks the most-frequent pair about to fuse.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/tokenization/overrides.json', slug: 'tokenization' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const TAPE_CY = 320;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const chipsU = s.get(scene.chipsU);
  const stageProg = s.get(scene.stageProg);
  const vocabU = s.get(scene.vocabU);
  const badgeU = s.get(scene.badgeU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const stageIdx = Math.max(0, Math.min(STAGES.length - 1, Math.round(stageProg)));
  const tokens = STAGES[stageIdx];
  const pos = layout(tokens);

  // the pair about to merge next (if any)
  const nextMerge = stageIdx < N_MERGES ? MERGES[stageIdx] : null;
  // find the first occurrence index of that pair in the current tape
  let mergeI = -1;
  if (nextMerge) {
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i] === nextMerge.a && tokens[i + 1] === nextMerge.b) {
        mergeI = i;
        break;
      }
    }
  }

  const vocab = STAGES[stageIdx].filter((t, i, arr) => arr.indexOf(t) === i && t.length > 1);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the tape of token chips */}
          {tokens.map((tok, i) => {
            const u = clamp01(chipsU * 2 - i / tokens.length);
            if (u <= 0) return null;
            const w = chipWidth(tok);
            const isMerge = i === mergeI || i === mergeI + 1;
            const multi = tok.length > 1;
            return (
              <g key={`${stageIdx}-${i}`} opacity={u}>
                <rect
                  x={pos[i].x - w / 2}
                  y={TAPE_CY - CHIP_H / 2}
                  width={w}
                  height={CHIP_H}
                  rx={9}
                  fill={multi ? colors.PANEL : colors.BG}
                  stroke={isMerge ? colors.WARM : multi ? colors.ACCENT : colors.GRID}
                  strokeWidth={isMerge ? 2.6 : multi ? 2 : 1.3}
                />
                <text
                  x={pos[i].x}
                  y={TAPE_CY + 6}
                  textAnchor="middle"
                  fill={isMerge ? colors.WARM : multi ? colors.ACCENT : colors.TEXT}
                  fontSize={19}
                  fontFamily="ui-monospace, monospace"
                >
                  {tok}
                </text>
              </g>
            );
          })}

          {/* merge bracket under the winning pair */}
          {mergeI >= 0 && nextMerge && (
            <g>
              <path
                d={`M${pos[mergeI].x - pos[mergeI].w / 2} ${TAPE_CY + CHIP_H / 2 + 12}` +
                  ` L${pos[mergeI].x - pos[mergeI].w / 2} ${TAPE_CY + CHIP_H / 2 + 20}` +
                  ` L${pos[mergeI + 1].x + pos[mergeI + 1].w / 2} ${TAPE_CY + CHIP_H / 2 + 20}` +
                  ` L${pos[mergeI + 1].x + pos[mergeI + 1].w / 2} ${TAPE_CY + CHIP_H / 2 + 12}`}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={2}
              />
              <text
                x={(pos[mergeI].x + pos[mergeI + 1].x) / 2}
                y={TAPE_CY + CHIP_H / 2 + 44}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={15}
              >
                {`most common pair · seen ${nextMerge.count} times`}
              </text>
            </g>
          )}
        </g>
      </Camera>

      {/* screen-fixed: rule, badge, growing vocabulary */}
      <MathLabel
        tex={'\\text{merge } \\arg\\max_{(a,b)}\\; \\mathrm{count}(a\\,b)'}
        x={330}
        y={70}
        fontSize={20}
        opacity={s.get(scene.texU) * dimU}
      />
      {badgeU > 0 && (
        <g opacity={badgeU * dimU}>
          <rect x={48} y={110} width={260} height={40} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
          <text x={66} y={136} fill={colors.TEXT} fontSize={15}>
            {`merge ${stageIdx} / ${N_MERGES} · length ${tokens.length}`}
          </text>
        </g>
      )}
      {vocabU > 0 && (
        <g opacity={vocabU * dimU}>
          <text x={1120} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            learned tokens
          </text>
          {vocab.slice(0, 10).map((t, i) => (
            <text key={i} x={1120} y={158 + i * 26} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontFamily="ui-monospace, monospace">
              {t}
            </text>
          ))}
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={250} y={220} width={780} height={210} rx={16} fill={colors.PANEL} opacity={0.93} stroke={colors.GRID} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            Tokenization
          </text>
          <MathLabel
            tex={'\\text{merge the most frequent pair, again and again}'}
            x={640}
            y={342}
            fontSize={20}
            color={colors.WARM}
            opacity={endU}
          />
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {`${START_LEN} characters compressed to ${FINAL_LEN} tokens — nothing is ever out of vocabulary`}
          </text>
        </g>
      )}
    </>
  );
}

export function Tokenization() {
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
