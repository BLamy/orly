// Agent CODEOWNERS — chapter 1: CODEOWNERS Routes the Diff.
// Grounded in the proposal's "CODEOWNERS as the routing layer" section: patterns
// are evaluated in file order and the LAST matching pattern wins; GitHub only
// ever reads the content before "#", so the human owner and the inline
// "# agents:" comment are two separate readers of the same winning line.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const CHANGED_FILE = 'prisma/migrations/20260820_add_event_status/migration.sql';

const ROWS = [
  { pattern: '*', owner: '@our-org/engineering', agents: null as string | null, match: true },
  { pattern: '/db/**', owner: '@our-org/database', agents: '@claude/db-review', match: false },
  { pattern: '/prisma/**', owner: '@our-org/database', agents: '@claude/db-review', match: true },
  { pattern: '/migrations/**', owner: '@our-org/database', agents: '@claude/db-review,@codex/migration-safety-review', match: false },
  { pattern: '**/*.sql', owner: '@our-org/database', agents: '@claude/db-review', match: true },
] as const;

const WINNER = 4; // last matching row — **/*.sql
const SUPERSEDED = 2; // /prisma/** — matched, then overridden

const LIST_X = 130;
const LIST_Y = 208;
const ROW_H = 54;
const ROW_W = 1020;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fileU = tl.channel('fileU', 0);
  const listU = tl.channel('listU', 0);
  const g0 = tl.channel('g0', 0);
  const g1 = tl.channel('g1', 0);
  const g2 = tl.channel('g2', 0);
  const g3 = tl.channel('g3', 0);
  const g4 = tl.channel('g4', 0);
  const winnerU = tl.channel('winnerU', 0);
  const supersedeU = tl.channel('supersedeU', 0);
  const splitU = tl.channel('splitU', 0);
  const humanU = tl.channel('humanU', 0);
  const agentU = tl.channel('agentU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 5.6, text: "Here's a pull request that touches one file: a new database migration." });
  tl.tween(fileU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 200, k: 1.05 }, { at: 0.9, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'The ownership file is the routing layer. The platform reads it from the base branch and checks every pattern against that path, in file order.' });
  tl.tween(listU, 1, { at: t - 6.0, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 400, k: 0.98 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  tl.tween(g0, 1, { at: t - 3.6, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.4, text: "The database folder pattern doesn't match — this migration doesn't live directly under it." });
  tl.tween(g1, 1, { at: t - 4.8, dur: 1.2, ease: ease.linear });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.8, text: 'The prisma folder pattern does match, so for a moment, database review looks like the answer.' });
  tl.tween(g2, 1, { at: t - 5.0, dur: 1.2, ease: ease.linear });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.8, text: "The root migrations folder doesn't match either — this file sits nested under prisma, not there." });
  tl.tween(g3, 1, { at: t - 5.0, dur: 1.2, ease: ease.linear });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 7.2, text: 'But any file ending in dot sql matches too, and the platform always keeps the last matching line, never the first.' });
  tl.tween(g4, 1, { at: t - 6.4, dur: 1.2, ease: ease.linear });
  tl.tween(winnerU, 1, { at: t - 5.0, dur: 1.0, ease: ease.pop });
  tl.tween(supersedeU, 1, { at: t - 4.6, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 750, y: LIST_Y + WINNER * ROW_H + 20, k: 1.28 }, { at: t - 4.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'So this line wins. Before the hash mark is what the platform actually sees: a human owner, the database team.' });
  tl.tween(splitU, 1, { at: t - 5.8, dur: 1.0, ease: ease.enter });
  tl.tween(humanU, 1, { at: t - 4.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 7.2, text: "After the hash mark is a comment the platform ignores completely — but it's exactly what one small automated workflow is watching for." });
  tl.tween(agentU, 1, { at: t - 6.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, { x: 850, y: LIST_Y + WINNER * ROW_H, k: 1.15 }, { at: t - 6.0, dur: 1.5, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: 'One file, one winning pattern, two readers: the platform assigns the human owner, and the workflow reads the agent.' });
  tl.tween(cam, { x: 640, y: 360, k: 1.0 }, { at: t - 6.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.6, dur: 1.0, ease: ease.enter });
  tl.tween(listU, 0.12, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(fileU, 0.12, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(splitU, 0.1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(humanU, 0.1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(agentU, 0.1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, fileU, listU, g0, g1, g2, g3, g4, winnerU, supersedeU, splitU, humanU, agentU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const fileU = s.get(scene.fileU);
  const listU = s.get(scene.listU);
  const gs = [s.get(scene.g0), s.get(scene.g1), s.get(scene.g2), s.get(scene.g3), s.get(scene.g4)];
  const winnerU = s.get(scene.winnerU);
  const supersedeU = s.get(scene.supersedeU);
  const splitU = s.get(scene.splitU);
  const humanU = s.get(scene.humanU);
  const agentU = s.get(scene.agentU);
  const closeU = s.get(scene.closeU);
  const dim = 1 - closeU;

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* changed file card */}
      <g opacity={fileU * dim}>
        <rect x={140} y={92} width={1000} height={54} rx={14} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
        <text x={166} y={112} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>changed file</text>
        <text x={166} y={132} fill={colors.WARM} fontSize={14} fontFamily={mono}>{CHANGED_FILE}</text>
      </g>

      {/* CODEOWNERS list */}
      <g opacity={listU * dim}>
        <text x={LIST_X} y={LIST_Y - 22} fill={colors.TEXT} fontSize={14} fontWeight={750} fontFamily={mono}>.github/CODEOWNERS</text>
        {ROWS.map((row, i) => {
          const seen = gs[i]!;
          const isWinner = i === WINNER;
          const isSuperseded = i === SUPERSEDED;
          const won = isWinner ? winnerU : 0;
          const superseded = isSuperseded ? supersedeU : 0;
          const rowOpacity = 0.35 + 0.65 * seen;
          const strokeColor = won > 0 ? colors.POSITIVE : row.match && seen > 0.5 ? colors.WARM : colors.MUTED;
          const strokeOp = superseded > 0 ? lerp(1, 0.15, superseded) : row.match ? 0.4 + 0.5 * seen : 0.25;
          const y = LIST_Y + i * ROW_H;
          return <g key={row.pattern} opacity={rowOpacity * (isWinner ? 1 : lerp(1, 0.6, closeU))} transform={`translate(0 ${(1 - seen) * 6})`}>
            <rect x={LIST_X} y={y} width={ROW_W} height={ROW_H - 10} rx={10}
              fill={won > 0 ? colors.POSITIVE : colors.BG} fillOpacity={won > 0 ? 0.08 + 0.06 * won : 0}
              stroke={strokeColor} strokeOpacity={strokeOp} strokeWidth={won > 0 ? 2.2 : 1.4} />
            <text x={LIST_X + 20} y={y + 28} fill={superseded > 0.4 ? colors.MUTED : colors.TEXT} fontSize={13} fontFamily={mono}>{row.pattern}</text>
            <text x={LIST_X + 260} y={y + 28} fill={superseded > 0.4 ? colors.MUTED : colors.ACCENT} fontSize={12.5} fontFamily={mono}>{row.owner}</text>
            {row.agents && <text x={LIST_X + 520} y={y + 28} fill={superseded > 0.4 ? colors.MUTED : colors.SECONDARY} fontSize={12.5} fontFamily={mono} opacity={0.5 + 0.5 * seen}># agents:{row.agents}</text>}
            {seen > 0.3 && !row.match && <text x={LIST_X + ROW_W - 26} y={y + 28} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} opacity={clamp01((seen - 0.3) * 3)}>✕</text>}
            {won >= 1 && <text x={LIST_X + ROW_W - 26} y={y + 28} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontWeight={800} opacity={won}>← last match wins</text>}
          </g>;
        })}
      </g>

      {/* split into two readers */}
      {splitU > 0 && <g opacity={splitU * dim}>
        {(() => {
          const y = LIST_Y + WINNER * ROW_H + (ROW_H - 10) / 2;
          const hashX = LIST_X + 480;
          return <>
            <path d={`M ${hashX} ${y} L ${hashX} ${y + 70}`} stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="4 4" opacity={0.5} />
            <g opacity={humanU}>
              <path d={`M ${hashX - 40} ${y + 70} L ${LIST_X + 140} ${y + 130}`} fill="none" stroke={colors.ACCENT} strokeWidth={2}
                strokeDasharray="200" strokeDashoffset={200 * (1 - humanU)} />
              <rect x={LIST_X + 30} y={y + 130} width={230} height={56} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={LIST_X + 145} y={y + 154} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>GitHub sees</text>
              <text x={LIST_X + 145} y={y + 174} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={mono}>@our-org/database</text>
            </g>
            <g opacity={agentU}>
              <path d={`M ${hashX + 40} ${y + 70} L ${LIST_X + 780} ${y + 130}`} fill="none" stroke={colors.SECONDARY} strokeWidth={2}
                strokeDasharray="360" strokeDashoffset={360 * (1 - agentU)} />
              <rect x={LIST_X + 660} y={y + 130} width={280} height={56} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.8} />
              <text x={LIST_X + 800} y={y + 154} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>the action reads</text>
              <text x={LIST_X + 800} y={y + 174} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily={mono}>@claude/db-review</text>
            </g>
          </>;
        })()}
      </g>}

      {/* close */}
      {closeU > 0 && <g opacity={closeU}>
        <rect x={215} y={250} width={850} height={190} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={318} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800}>one line, two readers</text>
        <text x={640} y={358} textAnchor="middle" fill={colors.ACCENT} fontSize={16} fontFamily={mono}>before # → GitHub's human owner</text>
        <text x={640} y={392} textAnchor="middle" fill={colors.SECONDARY} fontSize={16} fontFamily={mono}>after # → the action's agent reference</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
