// Explained: Proof or It Didn't Happen — chapter 2: how a proof assistant checks.
// A REAL tiny kernel, implemented and run at module scope: propositional
// natural deduction with five rules (assume, ∧-elim-left, ∧-elim-right,
// ∧-intro, →-intro). The derivation of A ∧ B → B ∧ A is checked line by
// line — each line must name a rule and premises, and the kernel recomputes
// what that rule yields and compares syntactically. A bogus line (jumping
// straight to the conclusion "by intuition") is fed to the same kernel and
// rejected. No heuristics anywhere: the checker is ~30 lines and total.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
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
// The kernel, for real.
// ---------------------------------------------------------------------------

type Form =
  | { k: 'var'; name: string }
  | { k: 'and'; l: Form; r: Form }
  | { k: 'imp'; l: Form; r: Form };

const V = (name: string): Form => ({ k: 'var', name });
const And = (l: Form, r: Form): Form => ({ k: 'and', l, r });
const Imp = (l: Form, r: Form): Form => ({ k: 'imp', l, r });

const eq = (a: Form, b: Form): boolean => {
  if (a.k !== b.k) return false;
  if (a.k === 'var') return a.name === (b as { k: 'var'; name: string }).name;
  const bb = b as { k: 'and' | 'imp'; l: Form; r: Form };
  return eq((a as { l: Form; r: Form }).l, bb.l) && eq((a as { l: Form; r: Form }).r, bb.r);
};

// A judgment is: assumptions ⊢ formula. A proof line names a rule + premises
// (indices of earlier lines). The kernel RECOMPUTES the judgment each rule
// yields and compares — it never trusts the stated conclusion.
interface Judgment { hyps: Form[]; concl: Form }
interface Line {
  rule: 'assume' | 'andEL' | 'andER' | 'andI' | 'impI';
  prem: number[];
  arg?: Form; // assume: the formula; impI: the hypothesis discharged
  stated: Judgment; // what the proof CLAIMS this line derives
}

function applyRule(rule: Line['rule'], prems: Judgment[], arg?: Form): Judgment | string {
  switch (rule) {
    case 'assume':
      if (!arg) return 'assume needs a formula';
      return { hyps: [arg], concl: arg };
    case 'andEL': {
      const p = prems[0];
      if (!p || p.concl.k !== 'and') return 'premise is not a conjunction';
      return { hyps: p.hyps, concl: p.concl.l };
    }
    case 'andER': {
      const p = prems[0];
      if (!p || p.concl.k !== 'and') return 'premise is not a conjunction';
      return { hyps: p.hyps, concl: p.concl.r };
    }
    case 'andI': {
      const [p, q] = prems;
      if (!p || !q) return 'and-intro needs two premises';
      return { hyps: [...p.hyps, ...q.hyps], concl: And(p.concl, q.concl) };
    }
    case 'impI': {
      const p = prems[0];
      if (!p || !arg) return 'imp-intro needs a premise and a hypothesis';
      return { hyps: p.hyps.filter((h) => !eq(h, arg)), concl: Imp(arg, p.concl) };
    }
  }
}

const sameJudgment = (a: Judgment, b: Judgment) =>
  eq(a.concl, b.concl) &&
  a.hyps.length === b.hyps.length &&
  a.hyps.every((h) => b.hyps.some((g) => eq(h, g)));

/** The whole kernel: check every line; return per-line verdicts. */
function check(lines: Line[]): Array<{ ok: boolean; why: string }> {
  const derived: Judgment[] = [];
  return lines.map((ln) => {
    const prems = ln.prem.map((i) => derived[i]);
    const got = applyRule(ln.rule, prems, ln.arg);
    if (typeof got === 'string') { derived.push(ln.stated); return { ok: false, why: got }; }
    const ok = sameJudgment(got, ln.stated);
    derived.push(got);
    return { ok, why: ok ? 'recomputed = stated' : 'stated judgment differs from what the rule yields' };
  });
}

// The derivation of A ∧ B → B ∧ A.
const A = V('A');
const B = V('B');
const AB = And(A, B);
const GOOD: Line[] = [
  { rule: 'assume', prem: [], arg: AB, stated: { hyps: [AB], concl: AB } },
  { rule: 'andER', prem: [0], stated: { hyps: [AB], concl: B } },
  { rule: 'andEL', prem: [0], stated: { hyps: [AB], concl: A } },
  { rule: 'andI', prem: [1, 2], stated: { hyps: [AB, AB], concl: And(B, A) } },
  { rule: 'impI', prem: [3], arg: AB, stated: { hyps: [], concl: Imp(AB, And(B, A)) } },
];
const GOOD_VERDICTS = check(GOOD); // all ok — verified below in the render

// The bogus proof: one line that just STATES the theorem, no rule earns it.
const BOGUS: Line[] = [
  { rule: 'andI', prem: [], stated: { hyps: [], concl: Imp(AB, And(B, A)) } },
];
const BOGUS_VERDICTS = check(BOGUS); // rejected: 'and-intro needs two premises'
const ALL_GOOD = GOOD_VERDICTS.every((v) => v.ok);
const BOGUS_REJECTED = !BOGUS_VERDICTS[0].ok;

// Display strings for the five lines.
const LINES_TEX = [
  { rule: 'assume', tex: 'A \\wedge B \\;\\vdash\\; A \\wedge B', from: 'assume' },
  { rule: '\\wedge\\text{-elim-R}', tex: 'A \\wedge B \\;\\vdash\\; B', from: 'from line 1' },
  { rule: '\\wedge\\text{-elim-L}', tex: 'A \\wedge B \\;\\vdash\\; A', from: 'from line 1' },
  { rule: '\\wedge\\text{-intro}', tex: 'A \\wedge B \\;\\vdash\\; B \\wedge A', from: 'from lines 2, 3' },
  { rule: '\\to\\text{-intro}', tex: '\\vdash\\; A \\wedge B \\to B \\wedge A', from: 'discharge line 1' },
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const LINE_X = 210;
const LINE_Y0 = 190;
const LINE_DY = 84;
const CAM_LINES: CameraState = { x: 520, y: 400, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  goalU: ChannelRef<number>;
  rulesU: ChannelRef<number>;
  linesU: ChannelRef<number>; // lines appear one by one
  checkU: ChannelRef<number>; // kernel stamps travel down the lines
  bogusU: ChannelRef<number>; // the bogus line + rejection
  trustU: ChannelRef<number>; // the small-kernel note
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const goalU = tl.channel('goalU', 0);
  const rulesU = tl.channel('rulesU', 0);
  const linesU = tl.channel('linesU', 0);
  const checkU = tl.channel('checkU', 0);
  const bogusU = tl.channel('bogusU', 0);
  const trustU = tl.channel('trustU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — what a proof is
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Last chapter ended at a promise: a proof covers the whole space. But what is a proof, mechanically? Not an argument that convinces a reader — a data structure that a dumb, tiny program can check.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.3,
    dur: 5.2,
    text: 'Take the smallest theorem worth the name: if A and B both hold, then B and A both hold. Obvious to you. The machine does not do obvious — it does rules.',
  });
  tl.tween(goalU, 1, { at: 7.0, dur: 0.8, ease: ease.enter });
  tl.hold(11.5, 0.5);

  // Beat 2 — the rules
  tl.caption({
    at: 12.0,
    dur: 5.8,
    text: 'The whole logic is five moves. You may assume a formula, and it goes on your tab. From a conjunction you may take either half. From two facts you may build their conjunction. And discharging an assumption buys you an implication.',
  });
  tl.tween(rulesU, 1, { at: 12.8, dur: 1.0, ease: ease.enter });
  tl.hold(17.8, 0.6);

  // Beat 3 — the derivation
  tl.caption({
    at: 18.4,
    dur: 5.6,
    text: 'A proof is then just a numbered list, where every line names its rule and points at earlier lines. Assume the conjunction. Take the right half. Take the left half. Rebuild them swapped. Discharge the assumption.',
  });
  tl.tween(cam, CAM_LINES, { at: 18.7, dur: 1.3, ease: ease.move });
  tl.tween(linesU, 1, { at: 19.2, dur: 4.4, ease: ease.linear });
  tl.caption({
    at: 24.6,
    dur: 5.8,
    text: 'Now the part that matters. The kernel does not read the proof the way you just did. For each line it reruns the named rule on the named premises, and compares the result to what the line states — symbol by symbol.',
  });
  tl.tween(checkU, 1, { at: 25.8, dur: 4.0, ease: ease.linear });
  tl.caption({
    at: 31.0,
    dur: 5.0,
    text: 'Five lines, five recomputations, five exact matches. The theorem is accepted — with no assumptions left on the tab. That last part is what makes it a theorem and not a hope.',
  });
  tl.hold(36.0, 0.6);

  // Beat 4 — the rejection
  tl.caption({
    at: 36.6,
    dur: 5.6,
    text: 'Feed the same kernel a different proof: one line that simply states the theorem. A fluent one liner, the kind a language model writes with total confidence. The kernel reruns the rule it names — and the rule does not produce that line.',
  });
  tl.tween(bogusU, 1, { at: 37.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 42.8,
    dur: 5.0,
    text: 'Rejected. Not argued with — rejected, the way a compiler rejects a syntax error. There is no partial credit and nothing to persuade. The check ran here, in this scene, and both verdicts on screen are its real output.',
  });
  tl.hold(47.8, 0.6);

  // Beat 5 — why "tiny" is the point
  tl.caption({
    at: 48.4,
    dur: 5.8,
    text: 'And notice what you had to trust: about thirty lines of checker. Not the proof search, not the person or model who wrote the proof — just the little program that reruns rules. Real proof assistants scale this same shape to all of mathematics.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 48.6, dur: 1.3, ease: ease.move });
  tl.tween(trustU, 1, { at: 49.6, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 54.8,
    dur: 5.4,
    text: 'A proof can be written by anyone — a genius, a search procedure, a language model having a good day. The authority never lives in the author. It lives in the kernel. Next: letting a model propose, and the kernel dispose.',
  });
  tl.tween(dimU, 1, { at: 55.6, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.6, dur: 1.0, ease: ease.enter });
  tl.hold(60.4, 1.4);

  return { tl, cam, titleU, goalU, rulesU, linesU, checkU, bogusU, trustU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/proof-kernel/overrides.json',
  slug: 'proof-kernel',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const goalU = s.get(scene.goalU);
  const rulesU = s.get(scene.rulesU);
  const linesU = s.get(scene.linesU);
  const checkU = s.get(scene.checkU);
  const bogusU = s.get(scene.bogusU);
  const trustU = s.get(scene.trustU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the goal */}
          <g opacity={goalU * (1 - 0.6 * bogusU)}>
            <MathLabel tex="\text{goal:}\quad A \wedge B \to B \wedge A" x={LINE_X} y={128} fontSize={21} color={colors.WARM} opacity={1} />
          </g>

          {/* the derivation lines */}
          {LINES_TEX.map((L, i) => {
            const u = clamp01(linesU * LINES_TEX.length - i);
            if (u <= 0) return null;
            const y = LINE_Y0 + i * LINE_DY;
            const stamped = clamp01(checkU * LINES_TEX.length - i);
            const v = GOOD_VERDICTS[i];
            return (
              <g key={i} opacity={u * (1 - 0.65 * bogusU)}>
                <text x={LINE_X - 40} y={y + 20} fill={colors.MUTED} fontSize={14} fontFamily="monospace">
                  {i + 1}.
                </text>
                <MathLabel tex={L.tex} x={LINE_X} y={y} fontSize={18} color={colors.TEXT} opacity={1} />
                <MathLabel tex={L.rule} x={LINE_X + 420} y={y + 2} fontSize={13} color={colors.ACCENT} opacity={0.9} />
                <text x={LINE_X + 420} y={y + 34} fill={colors.MUTED} fontSize={11}>
                  {L.from}
                </text>
                {stamped > 0 && (
                  <g opacity={stamped}>
                    <rect x={LINE_X + 590} y={y - 4} width={168} height={40} rx={7} fill={colors.PANEL} opacity={0.9} stroke={v.ok ? colors.POSITIVE : colors.NEGATIVE} />
                    <text x={LINE_X + 604} y={y + 13} fill={v.ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={11} fontFamily="monospace" fontWeight={700}>
                      kernel: {v.ok ? 'accept' : 'reject'}
                    </text>
                    <text x={LINE_X + 604} y={y + 29} fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                      {v.why}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* checked summary */}
          {checkU >= 1 && (
            <text x={LINE_X} y={LINE_Y0 + 5 * LINE_DY + 14} fill={colors.POSITIVE} fontSize={14} fontFamily="monospace" fontWeight={700} opacity={1 - 0.65 * bogusU}>
              {ALL_GOOD ? '✓ 5/5 lines recomputed and matched · hypotheses: none' : '✗ kernel bug'}
            </text>
          )}

          {/* the bogus proof */}
          {bogusU > 0 && (
            <g opacity={bogusU}>
              <rect x={LINE_X - 20} y={300} width={820} height={150} rx={12} fill={colors.PANEL} opacity={0.97} stroke={colors.NEGATIVE} />
              <text x={LINE_X} y={332} fill={colors.TEXT} fontSize={15} fontWeight={600}>
                the one-line “proof”
              </text>
              <text x={LINE_X - 6 + 30} y={366} fill={colors.MUTED} fontSize={13} fontFamily="monospace">
                1.
              </text>
              <MathLabel tex="\vdash\; A \wedge B \to B \wedge A \quad\text{(clearly true)}" x={LINE_X + 60} y={346} fontSize={17} color={colors.TEXT} opacity={1} />
              <rect x={LINE_X + 560} y={340} width={230} height={44} rx={7} fill={colors.NEGATIVE} opacity={0.16} stroke={colors.NEGATIVE} />
              <text x={LINE_X + 574} y={359} fill={colors.NEGATIVE} fontSize={11.5} fontFamily="monospace" fontWeight={700}>
                kernel: {BOGUS_REJECTED ? 'reject' : 'accept?!'}
              </text>
              <text x={LINE_X + 574} y={375} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                {BOGUS_VERDICTS[0].why}
              </text>
              <text x={LINE_X} y={430} fill={colors.MUTED} fontSize={12.5}>
                confidence is not a rule · “clearly” is not a premise
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* the five rules — screen space, right */}
      {rulesU > 0 && (
        <g opacity={rulesU * mainOp * (1 - 0.8 * clamp01(bogusU * 2)) * (1 - clamp01(checkU * 3))}>
          <rect x={905} y={110} width={340} height={250} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.GRID} />
          <text x={928} y={140} fill={colors.TEXT} fontSize={14} fontWeight={600}>
            the whole logic — five rules
          </text>
          <MathLabel tex="\text{assume } \varphi:\;\; \varphi \vdash \varphi" x={928} y={158} fontSize={13} color={colors.SECONDARY} opacity={1} />
          <MathLabel tex="\Gamma \vdash \varphi \wedge \psi \;\Rightarrow\; \Gamma \vdash \varphi" x={928} y={196} fontSize={13} color={colors.SECONDARY} opacity={1} />
          <MathLabel tex="\Gamma \vdash \varphi \wedge \psi \;\Rightarrow\; \Gamma \vdash \psi" x={928} y={234} fontSize={13} color={colors.SECONDARY} opacity={1} />
          <MathLabel tex="\Gamma \vdash \varphi,\; \Delta \vdash \psi \;\Rightarrow\; \Gamma,\Delta \vdash \varphi \wedge \psi" x={928} y={272} fontSize={13} color={colors.SECONDARY} opacity={1} />
          <MathLabel tex="\Gamma, \varphi \vdash \psi \;\Rightarrow\; \Gamma \vdash \varphi \to \psi" x={928} y={310} fontSize={13} color={colors.SECONDARY} opacity={1} />
        </g>
      )}

      {/* trusted-base note */}
      {trustU > 0 && (
        <g opacity={trustU * mainOp}>
          <text x={905} y={420} fill={colors.WARM} fontSize={14} fontFamily="monospace" fontWeight={700}>
            trusted base ≈ 30 lines
          </text>
          <text x={905} y={444} fill={colors.MUTED} fontSize={12}>
            the proof can come from anywhere
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The kernel says yes
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={268} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            A proof is data. Checking is rerunning rules.
          </text>
          <text x={640} y={316} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            every line: named rule + named premises → recompute → compare symbols
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily="monospace">
            5/5 accepted · the one-liner rejected · verdicts computed live
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.WARM} fontSize={15.5}>
            authority lives in the kernel, never in the author
          </text>
        </g>
      )}
    </>
  );
}

export function ProofKernel() {
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
