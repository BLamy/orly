// Agent CODEOWNERS — chapter 5: One Stable Check, Additive to Human Review.
// Grounded in "Merge enforcement": the branch ruleset requires exactly ONE
// check, Agent Code Review. It never submits an approving/requesting-changes
// human-style review — human CODEOWNER approval and the automated check are
// two separate, additive requirements. One stable check name fronts many
// dynamically-added agents, so adding an agent never touches the ruleset, and
// no permanent "changes requested" state is ever left behind to dismiss.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const AGENTS_NOW = [
  { name: '@claude/db-review', color: colors.ACCENT },
  { name: '@codex/package-json-review', color: colors.WARM },
  { name: '@opencode/foobar-review', color: colors.TEAL },
] as const;
const AGENT_LATER = { name: '@opencode/terraform-review', color: colors.SECONDARY };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pillU = tl.channel('pillU', 0);
  const impersonateU = tl.channel('impersonateU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const rosterU = tl.channel('rosterU', 0);
  const laterU = tl.channel('laterU', 0);
  const stuckU = tl.channel('stuckU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6, text: 'The branch ruleset requires exactly one check to merge: agent code review. Just this one name, nothing else.' });
  tl.tween(pillU, 1, { at: 0.7, dur: 1.2, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 200, k: 1.1 }, { at: 0.9, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: "It never pretends to be a human reviewer. It doesn't submit an approving or requesting changes review — only a pass or fail status." });
  tl.tween(impersonateU, 1, { at: t - 5.6, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'Human code owner approval and this automated check are two separate requirements. Both are required — one never substitutes for the other.' });
  tl.tween(gatesU, 1, { at: t - 5.8, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.0 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'Underneath that one stable name, a whole roster of agents can run: database review, the package file reviewer, foobar review, and more.' });
  tl.tween(rosterU, 1, { at: t - 5.8, dur: 1.8, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 260, k: 1.05 }, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: 'Add a new agent later, say a terraform reviewer, and it just joins the roster — the branch ruleset itself never has to change.' });
  tl.tween(laterU, 1, { at: t - 6.0, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.8, text: "And because it's only a status check, a fix simply reruns it — there's no permanent changes requested review left behind for someone to dismiss." });
  tl.tween(stuckU, 1, { at: t - 6.0, dur: 1.6, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 420, k: 1.0 }, { at: t - 5.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.4, text: 'When both gates are satisfied — the human owner, and the check — the merge opens. Neither one alone is enough.' });
  tl.tween(mergeU, 1, { at: t - 5.6, dur: 1.4, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 460, k: 1.0 }, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0);

  t = tl.caption({ at: t, dur: 6.6, text: 'One stable check, additive to human ownership, fronting a roster of agents that can keep growing underneath it.' });
  tl.tween(closeU, 1, { at: t - 5.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 340, k: 0.9 }, { at: t - 5.6, dur: 1.5, ease: ease.move });
  tl.tween(rosterU, 0.14, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(gatesU, 0.14, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(impersonateU, 0.1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(stuckU, 0.1, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.tween(mergeU, 0.14, { at: t - 5.8, dur: 1.0, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, cam, pillU, impersonateU, gatesU, rosterU, laterU, stuckU, mergeU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const pillU = s.get(scene.pillU);
  const impersonateU = s.get(scene.impersonateU);
  const gatesU = s.get(scene.gatesU);
  const rosterU = s.get(scene.rosterU);
  const laterU = s.get(scene.laterU);
  const stuckU = s.get(scene.stuckU);
  const mergeU = s.get(scene.mergeU);
  const closeU = s.get(scene.closeU);
  const dim = 1 - closeU;

  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {/* the one stable required check */}
      <g opacity={pillU * dim}>
        <rect x={440} y={90} width={400} height={54} rx={27} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.2} />
        <text x={640} y={124} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily={mono} fontWeight={700}>Agent Code Review · required check</text>
      </g>

      {/* it never impersonates a human review state */}
      {impersonateU > 0 && <g opacity={impersonateU * dim}>
        <rect x={420} y={160} width={440} height={40} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.4} opacity={0.7} />
        <text x={640} y={185} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontFamily={mono}>✕ approve / request changes — never submitted</text>
      </g>}

      {/* agent roster feeding the one check */}
      <g opacity={rosterU * dim}>
        {AGENTS_NOW.map((a, i) => {
          const u = clamp01(rosterU * 5 - i * 0.7);
          return <g key={a.name} opacity={u} transform={`translate(${290 + i * 250} 230)`}>
            <rect width={220} height={44} rx={12} fill={colors.BG} stroke={a.color} strokeWidth={1.6} />
            <text x={110} y={27} textAnchor="middle" fill={a.color} fontSize={11.5} fontFamily={mono}>{a.name}</text>
            <path d={`M 110 44 L 110 90`} stroke={a.color} strokeWidth={1.2} strokeOpacity={0.5} strokeDasharray="3 4" />
          </g>;
        })}
        {laterU > 0 && <g opacity={laterU} transform="translate(150 300)">
          <rect width={980} height={44} rx={12} fill={colors.BG} stroke={AGENT_LATER.color} strokeWidth={1.6} strokeDasharray="5 4" />
          <text x={490} y={27} textAnchor="middle" fill={AGENT_LATER.color} fontSize={11.5} fontFamily={mono}>{AGENT_LATER.name} · joins the roster</text>
          <text x={490} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={mono}>the branch ruleset itself never changes</text>
        </g>}
      </g>

      {/* two additive gates */}
      <g opacity={gatesU * dim}>
        <g transform="translate(200 340)">
          <rect width={360} height={70} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
          <text x={180} y={30} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily={mono} fontWeight={700}>Human CODEOWNER approval</text>
          <text x={180} y={52} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>unchanged · same as today</text>
        </g>
        <g transform="translate(720 340)">
          <rect width={360} height={70} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.8} />
          <text x={180} y={30} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={mono} fontWeight={700}>Agent Code Review status check</text>
          <text x={180} y={52} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>additive · not a substitute</text>
        </g>
        <text x={640} y={382} textAnchor="middle" fill={colors.WARM} fontSize={20} fontWeight={800}>+</text>
      </g>

      {/* no stuck "changes requested" state */}
      {stuckU > 0 && <g opacity={stuckU * dim}>
        <rect x={720} y={430} width={360} height={44} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.2} opacity={0.5} strokeDasharray="4 5" />
        <text x={900} y={456} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={mono}>✕ no stuck review to manually dismiss</text>
      </g>}

      {/* merge gate */}
      {mergeU > 0 && <g opacity={mergeU * dim} transform="translate(490 500)">
        <rect width={300} height={54} rx={27} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.2} />
        <text x={150} y={34} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily={mono} fontWeight={700}>merge allowed</text>
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={215} y={260} width={850} height={200} rx={26} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={2} />
        <text x={640} y={330} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={800}>one check, additive, growable</text>
        <text x={640} y={372} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily={mono}>human approval + agent code review, both required</text>
        <text x={640} y={406} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={mono}>new agents join the roster · the ruleset never changes</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
