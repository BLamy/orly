// Grounding: pm2s-clean/README.md; pm2s-clean/scripts/export_workflows.py;
// pm2s-clean/scripts/generate_skills.py; src/procmem2skills/inducer/workflow.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const STAGES = ['raw trajectories', 'status gate', 'qualified workflows', 'normal skill', 'no-hint skill', 'controlled eval'];
const X = [130, 330, 530, 750, 950, 1140];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tape = tl.channel('trajectory tape', 0);
  const scan = tl.channel('scan head', 0);
  const gate = tl.channel('qualification gate', 0);
  const card = tl.channel('procedure card', 0);
  const branch = tl.channel('skill branches', 0);
  const fixed = tl.channel('fixed controls', 0);
  const close = tl.channel('closing focus', 0);

  tl.caption({ at: 0.4, dur: 6.4, text: 'A long agent run is noisy: actions, observations, retries, and one final verifier result.' });
  tl.tween(tape, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(scan, 1, { at: 2.0, dur: 4.2, ease: ease.linear });
  tl.caption({ at: 7.4, dur: 6.4, text: 'The clean pipeline starts by keeping status-qualified success and failure evidence.' });
  tl.tween(gate, 1, { at: 8.0, dur: 1.0, ease: ease.enter });
  tl.caption({ at: 14.2, dur: 6.4, text: 'The workflow exporter orders actionable steps and attaches the verification signal each step earned.' });
  tl.tween(card, 0.55, { at: 14.8, dur: 1.4, ease: ease.move });
  tl.caption({ at: 21.0, dur: 6.3, text: 'That shared workflow becomes the common input, so later arms begin with the same experience.' });
  tl.tween(card, 1, { at: 21.6, dur: 1.2, ease: ease.move });
  tl.caption({ at: 27.8, dur: 6.4, text: 'The skill generator folds it into execution-ready steps, preconditions, and verification checks.' });
  tl.tween(branch, 0.5, { at: 28.4, dur: 1.4, ease: ease.draw });
  tl.caption({ at: 34.6, dur: 6.4, text: 'A second no-hint card hides outcome labels while preserving the same workflow source.' });
  tl.tween(branch, 1, { at: 35.2, dur: 1.4, ease: ease.draw });
  tl.caption({ at: 41.4, dur: 7.0, text: 'The comparison holds the benchmark, tasks, model, provider, pool, seed, and trial count fixed.' });
  tl.tween(fixed, 1, { at: 42.0, dur: 1.2, ease: ease.enter });
  tl.caption({ at: 49.0, dur: 6.5, text: 'Only the representation changes. The procedure card can now earn its result instead of borrowing it.' });
  tl.tween(close, 1, { at: 50.0, dur: 1.2, ease: ease.move });
  tl.hold(56.0, 1.0);
  return { tl, cam, tape, scan, gate, card, branch, fixed, close };
}

const scene = buildScene();
export function Render({ s }: { s: SceneState }) {
  const tape = s.get(scene.tape), scan = s.get(scene.scan), card = s.get(scene.card), branch = s.get(scene.branch), close = s.get(scene.close);
  // The pipeline leaves the stage once the closing panel takes over, so no label sits under the panel.
  const pipeline = close < 0.5;
  return <Camera {...s.get(scene.cam)}>
    <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">From trace to procedure card</text>
    {pipeline && <text x="100" y="212" fill={colors.MUTED} fontSize="16" opacity={tape}>one agent run · red marks failed attempts and retries</text>}
    <path d={`M ${X[0]} 350 H ${X[0] + (X[5]-X[0])*tape}`} stroke={colors.ACCENT} strokeWidth="8" strokeLinecap="round" fill="none" opacity={0.95-0.82*close}/>
    {Array.from({length:18},(_,i)=><rect key={i} x={100+i*42} y={250+(i%3)*32} width="28" height="12" rx="6" fill={i%4===0?colors.NEGATIVE:colors.MUTED} opacity={tape*Math.max(0,1-i/20)*(1-close)*(1-0.6*branch)}/>) }
    <line x1={105+scan*760} x2={105+scan*760} y1="230" y2="360" stroke={colors.WARM} strokeWidth="4" opacity={tape*(1-close)}/>
    {pipeline && STAGES.map((label,i)=>{const u=i===0?tape:i===1?s.get(scene.gate):i===2?card:i<5?branch:s.get(scene.fixed); return <g key={label} opacity={Math.min(1,u*1.8)}><circle cx={X[i]} cy="350" r="34" fill="#111827" stroke={i===5?colors.POSITIVE:colors.ACCENT} strokeWidth="3"/><text x={X[i]} y="357" textAnchor="middle" fill={colors.MUTED} fontSize="18" fontWeight="700">{i+1}</text><text x={X[i]} y="415" textAnchor="middle" fill={colors.TEXT} fontSize="17">{label}</text></g>})}
    {pipeline && <g opacity={branch}><path d="M 530 316 Q 640 200 750 316" fill="none" stroke={colors.SECONDARY} strokeWidth="4"/></g>}
    {pipeline && <g opacity={Math.max(0,(branch-0.5)*2)}><path d="M 530 316 Q 740 120 950 316" fill="none" stroke={colors.SECONDARY} strokeWidth="4"/></g>}
    {pipeline && <g opacity={s.get(scene.fixed)}><rect x="930" y="140" width="270" height="102" rx="18" fill="#111827" stroke={colors.POSITIVE}/><text x="1065" y="170" textAnchor="middle" fill={colors.POSITIVE} fontSize="18">held fixed</text><text x="1065" y="200" textAnchor="middle" fill={colors.MUTED} fontSize="15">benchmark · tasks · model</text><text x="1065" y="224" textAnchor="middle" fill={colors.MUTED} fontSize="15">provider · pool · seed · trials</text></g>}
    <g opacity={close}><rect x="300" y="170" width="680" height="300" rx="28" fill="#0a0e1a" stroke={colors.ACCENT} strokeWidth="3"/><text x="640" y="285" textAnchor="middle" fill={colors.TEXT} fontSize="38" fontWeight="700">same evidence</text><text x="640" y="350" textAnchor="middle" fill={colors.WARM} fontSize="34">different representation</text><text x="640" y="410" textAnchor="middle" fill={colors.MUTED} fontSize="22">the controlled comparison begins here</text></g>
  </Camera>;
}
export const vizScene = () => scene;
