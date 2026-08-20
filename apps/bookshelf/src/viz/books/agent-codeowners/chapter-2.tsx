// Agent CODEOWNERS — chapter 2: One Reference, Three Native Formats.
// Grounded in "Harness and agent resolution" + "Shared harness interface": the
// harness segment of @harness/agent selects an adapter, the agent segment names
// a project-scoped file already in that harness's OWN native format — nothing
// is translated into a universal format — and every adapter normalizes its
// output into one shared ReviewHarness contract.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const COLS = [
  {
    key: 'claude', x: 60, color: colors.ACCENT,
    ref: '@claude/db-review',
    path: '.claude/agents/db-review.md',
    lines: ['name: db-review', 'tools: Read, Glob, Grep', 'model: sonnet'],
    kind: 'Markdown + YAML frontmatter',
  },
  {
    key: 'codex', x: 460, color: colors.WARM,
    ref: '@codex/package-json-review',
    path: '.codex/agents/package-json-review.toml',
    lines: ['name = "package-json-review"', 'sandbox_mode = "read-only"', 'developer_instructions = "..."'],
    kind: 'TOML',
  },
  {
    key: 'opencode', x: 860, color: colors.TEAL,
    ref: '@opencode/foobar-review',
    path: '.opencode/agents/foobar-review.md',
    lines: ['mode: subagent', 'permission:', '  edit: deny', '  bash: deny'],
    kind: 'Markdown frontmatter',
  },
] as const;

const CARD_W = 360;
const CARD_Y = 250;
const CARD_H = 200;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const refU = tl.channel('refU', 0);
  const decoyU = tl.channel('decoyU', 0);
  const claudeU = tl.channel('claudeU', 0);
  const codexU = tl.channel('codexU', 0);
  const opencodeU = tl.channel('opencodeU', 0);
  const focus = tl.channel('focus', 0); // 0 all equal · 1..3 = COLS index+1 in the spotlight
  const morphU = tl.channel('morphU', 0);
  const nativeU = tl.channel('nativeU', 0);
  const convergeU = tl.channel('convergeU', 0);
  const contractU = tl.channel('contractU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6.4, text: 'An agent reference names two things: a harness, and an agent. Claude, database review. Codex, the package file reviewer. Open Code, foobar review.' });
  tl.tween(refU, 1, { at: 0.7, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 160, k: 1.02 }, { at: 0.9, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: 'Only these three harness names are ever recognized. Anything else is treated as an ordinary, unresolved owner token — never as a command.' });
  tl.tween(decoyU, 1, { at: t - 5.4, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: "The harness segment picks an adapter. The agent segment names a file that's already sitting in the repository, written in that harness's own format." });
  tl.tween(decoyU, 0, { at: t - 5.8, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 0.94 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(morphU, 1, { at: t - 4.2, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.8, text: 'Database review resolves to a markdown file with a structured header — Claude Code natively supports project scoped subagents right here.' });
  tl.tween(claudeU, 1, { at: t - 5.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: COLS[0].x + CARD_W / 2, y: CARD_Y + CARD_H / 2, k: 1.2 }, { at: t - 4.8, dur: 1.3, ease: ease.move });
  tl.tween(focus, 1, { at: t - 4.8, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.2, text: "The package file reviewer resolves to a small configuration file, with its own read only sandbox mode built in — Codex supports project scoped agents in this format natively too." });
  tl.tween(codexU, 1, { at: t - 5.4, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: COLS[1].x + CARD_W / 2, y: CARD_Y + CARD_H / 2, k: 1.2 }, { at: t - 5.2, dur: 1.3, ease: ease.move });
  tl.tween(focus, 2, { at: t - 5.2, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'Foobar review resolves to another markdown file, where the filename itself is the agent name, and edit and bash are both denied by default.' });
  tl.tween(opencodeU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: COLS[2].x + CARD_W / 2, y: CARD_Y + CARD_H / 2, k: 1.2 }, { at: t - 5.4, dur: 1.3, ease: ease.move });
  tl.tween(focus, 3, { at: t - 5.4, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'Nothing here gets translated into a universal format. Each definition stays exactly as its own harness already expects to read it.' });
  tl.tween(nativeU, 1, { at: t - 5.6, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 400, k: 0.9 }, { at: t - 5.4, dur: 1.5, ease: ease.move });
  tl.tween(focus, 0, { at: t - 5.6, dur: 1.0, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: 'But every adapter normalizes what it produces into one shared contract, so the code publishing results never has to know which harness ran.' });
  tl.tween(convergeU, 1, { at: t - 6.0, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 560, k: 1.02 }, { at: t - 5.8, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'One interface: resolve the agent, run the review, return findings with a severity and a conclusion. Three formats in, one shape out.' });
  tl.tween(contractU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 5.8, text: 'Three harnesses, three native files, one shared review interface underneath every one of them.' });
  tl.tween(cam, { x: 640, y: 380, k: 0.86 }, { at: t - 5.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.0, dur: 1.0, ease: ease.enter });
  tl.tween(claudeU, 0.14, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.tween(codexU, 0.14, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.tween(opencodeU, 0.14, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.tween(refU, 0.14, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.tween(contractU, 0.14, { at: t - 4.2, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, refU, decoyU, claudeU, codexU, opencodeU, focus, morphU, nativeU, convergeU, contractU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const refU = s.get(scene.refU);
  const decoyU = s.get(scene.decoyU);
  const cardU = [s.get(scene.claudeU), s.get(scene.codexU), s.get(scene.opencodeU)];
  const focus = s.get(scene.focus);
  const cardOp = (i: number) => {
    const active = clamp01(1 - Math.abs(focus - (i + 1)));
    return lerp(1, lerp(0.08, 1, active), clamp01(focus));
  };
  const morphU = s.get(scene.morphU);
  const nativeU = s.get(scene.nativeU);
  const convergeU = s.get(scene.convergeU);
  const contractU = s.get(scene.contractU);
  const closeU = s.get(scene.closeU);
  const dim = 1 - closeU;

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* reference tokens */}
      <g opacity={refU * dim}>
        {COLS.map((c) => <g key={c.key} transform={`translate(${c.x} 96)`}>
          <rect width={CARD_W} height={44} rx={22} fill={colors.PANEL} stroke={c.color} strokeWidth={1.8} />
          <text x={CARD_W / 2} y={28} textAnchor="middle" fill={c.color} fontSize={14.5} fontFamily={mono} fontWeight={700}>{c.ref}</text>
        </g>)}
        <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>harness / agent</text>
      </g>

      {decoyU > 0 && <g opacity={decoyU * dim}>
        <rect x={490} y={168} width={300} height={40} rx={20} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.6} opacity={0.7} />
        <text x={640} y={193} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>@random/thing · unrecognized · inert</text>
      </g>}

      {/* morph arrows down */}
      {morphU > 0 && COLS.map((c) => <path key={c.key} d={`M ${c.x + CARD_W / 2} 140 L ${c.x + CARD_W / 2} ${CARD_Y - 10}`}
        stroke={c.color} strokeWidth={1.6} strokeDasharray="180" strokeDashoffset={180 * (1 - morphU)} opacity={0.6 * dim} />)}

      {/* native file cards */}
      {COLS.map((c, i) => {
        const u = cardU[i]!;
        if (u <= 0) return null;
        return <g key={c.key} opacity={u * dim * cardOp(i)} transform={`translate(0 ${(1 - u) * 18})`}>
          <rect x={c.x} y={CARD_Y} width={CARD_W} height={CARD_H} rx={16} fill={colors.PANEL} stroke={c.color} strokeWidth={2} />
          <text x={c.x + 20} y={CARD_Y + 30} fill={c.color} fontSize={13} fontFamily={mono} fontWeight={700}>{c.path}</text>
          <text x={c.x + 20} y={CARD_Y + 50} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>{c.kind}</text>
          {c.lines.map((line, li) => <text key={li} x={c.x + 20} y={CARD_Y + 84 + li * 24} fill={colors.TEXT} fontSize={12} fontFamily={mono}
            opacity={clamp01(nativeU > 0 ? 1 : u * 4 - li)}>{line}</text>)}
          {nativeU > 0.3 && <text x={c.x + CARD_W - 16} y={CARD_Y + CARD_H - 14} textAnchor="end" fill={c.color} fontSize={10} fontFamily={mono}
            opacity={clamp01((nativeU - 0.3) * 3)}>native · unconverted</text>}
        </g>;
      })}

      {/* convergence lines into the shared interface */}
      {convergeU > 0 && <g opacity={convergeU * dim}>
        {COLS.map((c) => <path key={c.key} d={`M ${c.x + CARD_W / 2} ${CARD_Y + CARD_H + 10} C ${c.x + CARD_W / 2} ${CARD_Y + CARD_H + 90}, 640 ${CARD_Y + CARD_H + 60}, 640 ${CARD_Y + CARD_H + 130}`}
          fill="none" stroke={c.color} strokeWidth={1.8} strokeDasharray="260" strokeDashoffset={260 * (1 - convergeU)} opacity={0.75} />)}
      </g>}

      {/* shared contract */}
      {contractU > 0 && <g opacity={contractU * dim} transform={`translate(0 ${(1 - contractU) * 14})`}>
        <rect x={370} y={CARD_Y + CARD_H + 130} width={540} height={148} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.2} />
        <text x={640} y={CARD_Y + CARD_H + 160} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={750} fontFamily={mono}>ReviewHarness</text>
        <text x={640} y={CARD_Y + CARD_H + 190} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>resolveAgent(repositoryPath, agentName, baseSha)</text>
        <text x={640} y={CARD_Y + CARD_H + 214} textAnchor="middle" fill={colors.TEXT} fontSize={12.5} fontFamily={mono}>review(request) → findings, conclusion</text>
        <text x={640} y={CARD_Y + CARD_H + 250} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>one shape, three harnesses behind it</text>
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={230} y={310} width={820} height={170} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={370} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={800}>three native formats, one interface</text>
        <text x={640} y={410} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={mono}>markdown · toml · markdown → one ReviewHarness contract</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
