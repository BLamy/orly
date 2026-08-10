// Chapter 5 — The Intervention Test.
//
// Grounded in Sections 10 and 11: AEI is a narrow diagnosis, ordinary error
// and bias can remain below threshold, and the practical test asks whether a
// principled intervention can restore a scalable path to revision.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Vec } from '../../primitives';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const CASES = Array.from({ length: 44 }, (_, i) => {
  const lane = i % 4;
  const col = Math.floor(i / 4);
  const risky = i % 3 === 0 || i > 31;
  const x0 = 170 + (col % 8) * 54 + lane * 6;
  const y0 = 460 - lane * 46 - Math.floor(col / 8) * 20;
  const x1 = risky ? 580 + (col % 4) * 24 : 220 + (col % 5) * 42;
  const y1 = risky ? 390 + lane * 22 : 210 + lane * 34;
  return { x0, y0, x1, y1, risky, r: 3.4 + (i % 3) * 0.6 };
});

const QUESTIONS = [
  'Are correction channels usable?',
  'Does friction carry local cost?',
  'Does routing add authority?',
  'Are evaluators inside the field?',
  'Would one correction be absorbed?',
];
const CAM_FIELD: CameraState = { x: 438, y: 330, k: 1.13 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const caseU = tl.channel('caseU', 0);
  const gateU = tl.channel('gateU', 0);
  const railU = tl.channel('railU', 0);
  const focusRow = tl.channel('focusRow', -1);
  const focusU = tl.channel('focusU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 0 — the field of possible cases.
  tl.caption({
    at: 0.1,
    dur: 6.4,
    text: 'The paper keeps the diagnosis narrow. A system can contain ordinary error, bias, or strain without entering a regime that prices correction out.',
  });
  tl.tween(fieldU, 1, { at: 0.15, dur: 1.4, ease: ease.draw });
  tl.tween(gateU, 1, { at: 0.7, dur: 1.0, ease: ease.draw });
  tl.hold(6.9, 0.6);

  // Beat 1 — boundary cases.
  tl.caption({
    at: 7.5,
    dur: 6.2,
    text: 'Below the gate, a flawed output can be challenged and the correction can propagate. A biased process can still have protected dissent, appeal, and independent verification.',
  });
  tl.tween(caseU, 0.28, { at: 8.1, dur: 1.4, ease: ease.move });
  tl.hold(13.7, 0.6);

  // Beat 2 — introduce the intervention test.
  tl.caption({
    at: 14.3,
    dur: 6.3,
    text: 'The intervention test asks what happens in practice. Are the correction channels usable, or merely present in the organization chart?',
  });
  tl.tween(railU, 0.45, { at: 14.8, dur: 1.2, ease: ease.draw });
  tl.tween(focusRow, 0, { at: 15.7, dur: 0.4, ease: ease.move });
  tl.tween(focusU, 1, { at: 16.1, dur: 0.5, ease: ease.enter });
  tl.hold(20.6, 0.6);

  // Beat 3 — walk the questions.
  tl.caption({
    at: 21.2,
    dur: 6.4,
    text: 'Then ask whether refusal, hesitation, and dissent carry disproportionate local cost; whether outputs gain authority by routing; and whether the evaluator is already contaminated.',
  });
  tl.tween(focusU, 0, { at: 21.3, dur: 0.5, ease: ease.move });
  tl.tween(railU, 1, { at: 21.8, dur: 1.2, ease: ease.draw });
  tl.tween(focusRow, 2, { at: 22.7, dur: 1.0, ease: ease.move });
  tl.tween(focusU, 1, { at: 23.7, dur: 0.5, ease: ease.enter });
  tl.hold(27.6, 0.6);

  // Beat 4 — cases diverge.
  tl.caption({
    at: 28.2,
    dur: 6.4,
    text: 'Now let the cases move. Some interventions cross the gate and reopen a path to revision. Others are routed back into the same workflow as another inconvenience.',
  });
  tl.tween(focusU, 0, { at: 28.3, dur: 0.5, ease: ease.move });
  tl.tween(caseU, 1, { at: 28.8, dur: 2.4, ease: ease.move });
  tl.tween(focusRow, 4, { at: 30.0, dur: 0.8, ease: ease.move });
  tl.tween(focusU, 1, { at: 30.8, dur: 0.5, ease: ease.enter });
  tl.hold(35.2, 0.6);

  // Beat 5 — the absorbed intervention.
  tl.caption({
    at: 35.8,
    dur: 6.4,
    text: 'A documented correction that is overridden and returned as policy is not evidence that correction works. It is evidence that the regime can absorb principled action without changing its baseline.',
  });
  tl.tween(bridgeU, 1, { at: 36.4, dur: 1.6, ease: ease.draw });
  tl.tween(focusU, 0, { at: 37.2, dur: 0.6, ease: ease.move });
  tl.hold(42.8, 0.6);

  // Beat 6 — operational reading.
  tl.caption({
    at: 43.4,
    dur: 6.4,
    text: 'The operational reading is simple: distorted outputs must not acquire authority and persist faster than the system can revise them.',
  });
  tl.tween(cam, CAM_FIELD, { at: 43.6, dur: 1.3, ease: ease.move });
  tl.tween(focusRow, 0, { at: 44.0, dur: 0.6, ease: ease.move });
  tl.tween(focusU, 1, { at: 44.6, dur: 0.5, ease: ease.enter });
  tl.hold(49.8, 0.6);

  // Beat 7 — close on the source's final distinction.
  tl.caption({
    at: 50.4,
    dur: 6.7,
    text: 'That is the paper’s final discipline: do not ask only whether a system looks coherent. Ask whether someone can still make correction travel.',
  });
  tl.tween(dimU, 1, { at: 50.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 52.0, dur: 0.9, ease: ease.enter });
  tl.hold(58.0, 1.0);

  return { tl, cam, fieldU, caseU, gateU, railU, focusRow, focusU, bridgeU, dimU, closeU };
}

const scene = buildScene();

function CaseField({ field, cases, gate, bridge }: { field: number; cases: number; gate: number; bridge: number }) {
  return (
    <g opacity={field}>
      <rect x={132} y={124} width={590} height={430} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={162} y={158} fill={colors.TEXT} fontSize={16} fontWeight={700}>boundary field</text>
      <text x={162} y={180} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>local correction capacity →</text>
      <text x={146} y={520} fill={colors.MUTED} fontSize={11} fontFamily={MONO} transform="rotate(-90 146 520)">authority of the artifact →</text>
      <line x1={415} y1={198} x2={415} y2={500} stroke={colors.WARM} strokeWidth={3} strokeDasharray="8 8" opacity={gate} />
      <text x={427} y={220} fill={colors.WARM} fontSize={11} fontFamily={MONO} opacity={gate}>regime gate</text>
      <rect x={165} y={210} width={216} height={260} rx={16} fill={colors.POSITIVE} opacity={0.05} />
      <rect x={448} y={210} width={244} height={260} rx={16} fill={colors.NEGATIVE} opacity={0.05} />
      <text x={273} y={244} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>correction remains live</text>
      <text x={570} y={244} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>correction is absorbed</text>
      {CASES.map((d, i) => {
        const x = lerp(d.x0, d.x1, cases);
        const y = lerp(d.y0, d.y1, cases);
        const color = d.risky ? colors.NEGATIVE : colors.POSITIVE;
        return (
          <g key={i} opacity={clamp01(field * 1.25)}>
            <circle cx={x} cy={y} r={d.r + (cases > 0.7 ? 1.5 : 0)} fill={color} opacity={0.86} />
            {i % 7 === 0 && <circle cx={x} cy={y} r={d.r + 8} fill="none" stroke={color} opacity={0.25} />}
          </g>
        );
      })}
      <g opacity={bridge}>
        <Vec x1={350} y1={490} x2={548} y2={290} grow={bridge} color={colors.ACCENT} width={3} label="intervention" labelAt="mid" labelSize={11} />
        <text x={370} y={520} fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>can the correction cross?</text>
      </g>
    </g>
  );
}

function DiagnosticRail({ rail, row, focus }: { rail: number; row: number; focus: number }) {
  return (
    <g opacity={rail}>
      <rect x={760} y={124} width={398} height={430} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={792} y={158} fill={colors.TEXT} fontSize={16} fontWeight={700}>intervention test</text>
      <text x={792} y={180} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>five questions from Section 11</text>
      {QUESTIONS.map((q, i) => {
        const y = 222 + i * 60;
        const active = i === row && focus > 0.05;
        const risk = i >= 2;
        return (
          <g key={q} opacity={clamp01(rail * (0.65 + (i + 1) / QUESTIONS.length))}>
            <rect x={790} y={y - 22} width={338} height={43} rx={10} fill={active ? colors.WARM : colors.BG} opacity={active ? 0.16 : 0.55} stroke={active ? colors.WARM : colors.GRID} strokeWidth={active ? 2 : 1} />
            <circle cx={814} cy={y} r={8} fill={risk ? colors.NEGATIVE : colors.POSITIVE} />
            <text x={834} y={y + 4} fill={active ? colors.WARM : colors.TEXT} fontSize={11}>{q}</text>
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const field = s.get(scene.fieldU);
  const cases = s.get(scene.caseU);
  const gate = s.get(scene.gateU);
  const rail = s.get(scene.railU);
  const row = Math.round(s.get(scene.focusRow));
  const focus = s.get(scene.focusU);
  const bridge = s.get(scene.bridgeU);
  const dim = 1 - 0.88 * s.get(scene.dimU);
  const close = s.get(scene.closeU);

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={800} opacity={dim}>
        The intervention test
      </text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={dim}>
        not “does it look coherent?” · “can correction still travel?”
      </text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={dim}>
          <CaseField field={field} cases={cases} gate={gate} bridge={bridge} />
          <DiagnosticRail rail={rail} row={row} focus={focus} />
          <MathLabel tex={'\text{revision} \text{ must remain scalable}'} x={640} y={588} fontSize={19} color={colors.ACCENT} opacity={clamp01(bridge * 1.3)} />
        </g>
      </Camera>
      <g opacity={close}>
        <rect x={154} y={224} width={972} height={224} rx={28} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
        <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>Make correction cheaper than the fiction</text>
        <text x={640} y={334} textAnchor="middle" fill={colors.ACCENT} fontSize={19}>protect refusal · preserve provenance · reopen authority</text>
        <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>a coherent surface is not a readiness test</text>
      </g>
    </>
  );
}

export const vizScene = () => scene;
