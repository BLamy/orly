// The Long Game — chapter 1: A Year Is the Task.
//
// Grounded in arXiv:2607.28956v2 Sections 1 and 3, plus
// env/scenarios/default.yaml and env/core/simulator.py Environment._step_impl,
// _run_hook_and_finalize, and the configured horizon/activation period.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const DAY_POINTS = Array.from({ length: 365 }, (_, day) => {
  const a = -Math.PI / 2 + (day / 365) * Math.PI * 2;
  const r = 244 + 10 * Math.sin(day * 0.43);
  return { day, x: 640 + Math.cos(a) * r, y: 344 + Math.sin(a) * r, a };
});

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const storeU = tl.channel('storeU', 0);
  const yearU = tl.channel('yearU', 0);
  const hourU = tl.channel('hourU', 0);
  const windowsU = tl.channel('windowsU', 0);
  const hiddenU = tl.channel('hiddenU', 0);
  const wakeU = tl.channel('wakeU', 0);
  const horizonU = tl.channel('horizonU', 0);
  const settleU = tl.channel('settleU', 0);
  const ledgerU = tl.channel('ledgerU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.3, text: 'This benchmark does not ask for one clever purchase. It asks an agent to keep one store coherent for a simulated year.' });
  tl.tween(storeU, 1, { at: 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(yearU, 1, { at: 1.5, dur: 3.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 2.0, dur: 1.3, ease: ease.move });
  tl.hold(6.8, 0.8);

  tl.caption({ at: 7.6, dur: 6.2, text: 'The environment advances one hour at a time, for eight thousand seven hundred sixty control steps.' });
  tl.tween(hourU, 1, { at: 8.1, dur: 4.6, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 344, k: 1.15 }, { at: 9.0, dur: 1.3, ease: ease.move });
  tl.hold(13.8, 0.8);

  tl.caption({ at: 14.6, dur: 6.5, text: 'Demand, suppliers, and orders move every hour, while the agent receives a decision window only once every twelve hours.' });
  tl.tween(windowsU, 1, { at: 15.1, dur: 3.0, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 344, k: 1.03 }, { at: 16.0, dur: 1.3, ease: ease.move });
  tl.hold(21.1, 0.8);

  tl.caption({ at: 21.9, dur: 6.4, text: 'The state is only partly visible. Future demand, hidden risks, and recovery schedules stay behind the observation boundary.' });
  tl.tween(hiddenU, 1, { at: 22.4, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 815, y: 350, k: 1.16 }, { at: 23.0, dur: 1.3, ease: ease.move });
  tl.hold(28.3, 0.8);

  tl.caption({ at: 29.1, dur: 6.4, text: 'An early listing choice changes later demand, so one action leaves a wake through orders, cash, and store rating.' });
  tl.tween(wakeU, 1, { at: 29.6, dur: 3.4, ease: ease.draw });
  tl.tween(cam, { x: 565, y: 365, k: 1.12 }, { at: 30.5, dur: 1.3, ease: ease.move });
  tl.hold(35.5, 0.8);

  tl.caption({ at: 36.3, dur: 6.4, text: 'At the year boundary, new demand stops, but unresolved orders keep moving until every terminal settlement lands.' });
  tl.tween(horizonU, 1, { at: 36.8, dur: 1.0, ease: ease.pop });
  tl.tween(settleU, 1, { at: 38.0, dur: 3.3, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 344, k: 1.02 }, { at: 38.5, dur: 1.3, ease: ease.move });
  tl.hold(42.7, 0.8);

  tl.caption({ at: 43.5, dur: 6.1, text: 'The score is not a streak of short wins. It is terminal net assets after the whole ledger closes.' });
  tl.tween(ledgerU, 1, { at: 44.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.10 }, { at: 44.8, dur: 1.3, ease: ease.move });
  tl.hold(49.6, 0.8);

  tl.caption({ at: 50.4, dur: 6.5, text: 'That is the benchmark’s wager: a long episode matters only when the past keeps constraining the future.' });
  tl.tween(dimU, 1, { at: 50.9, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 51.7, dur: 0.7, ease: ease.enter });
  tl.hold(56.9, 1.0);

  return { tl, cam, storeU, yearU, hourU, windowsU, hiddenU, wakeU, horizonU, settleU, ledgerU, dimU, endU };
}

const scene = buildScene();

function Store({ u }: { u: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(640 344) scale(${0.82 + 0.18 * uu})`}>
    <rect x={-132} y={-82} width={264} height={164} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
    <path d="M-94 -26 H94 L78 52 H-78 Z" fill={colors.ACCENT} opacity={0.14} />
    <path d="M-105 -50 H105 M-84 -50 V-18 M-42 -50 V-18 M0 -50 V-18 M42 -50 V-18 M84 -50 V-18" stroke={colors.WARM} strokeWidth={8} strokeLinecap="round" />
    <text y={17} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={800}>one persistent store</text>
    <text y={48} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>cash · deposit · listings · orders</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const yearU = s.get(scene.yearU);
  const hourU = s.get(scene.hourU);
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const cursor = Math.floor(hourU * 364);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={44} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={850}>A year is the task</text>
      <text x={640} y={70} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>horizon_steps: 8760 · activation_period: 12</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        {DAY_POINTS.map((p) => {
          const u = clamp01(yearU * 365 - p.day);
          const active = p.day <= cursor;
          const window = p.day % 6 === 0 && s.get(scene.windowsU) > 0.1;
          return <circle key={p.day} cx={p.x} cy={p.y} r={window ? 4.4 : 2.8} fill={active ? colors.ACCENT : colors.GRID} opacity={u * (window ? 0.95 : 0.72)} />;
        })}
        {MONTHS.map((m, i) => {
          const a = -Math.PI / 2 + ((i * 30.42 + 15) / 365) * Math.PI * 2;
          return <text key={m} x={640 + Math.cos(a) * 282} y={350 + Math.sin(a) * 282} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={clamp01(yearU * 12 - i)}>{m}</text>;
        })}
        <Store u={s.get(scene.storeU)} />
        {hourU > 0 && <g>
          <line x1={640} y1={344} x2={DAY_POINTS[cursor].x} y2={DAY_POINTS[cursor].y} stroke={colors.WARM} strokeWidth={2} opacity={0.68} />
          <circle cx={DAY_POINTS[cursor].x} cy={DAY_POINTS[cursor].y} r={10} fill={colors.WARM} />
          <text x={640} y={454} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily={MONO}>hour {Math.round(hourU * 8760).toLocaleString()}</text>
        </g>}

        <g opacity={s.get(scene.hiddenU)}>
          <path d="M732 164 A220 220 0 0 1 880 520" fill="none" stroke={colors.NEGATIVE} strokeWidth={18} opacity={0.14} />
          <text x={985} y={278} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>hidden</text>
          <text x={985} y={301} textAnchor="middle" fill={colors.MUTED} fontSize={11}>future demand</text>
          <text x={985} y={321} textAnchor="middle" fill={colors.MUTED} fontSize={11}>risk parameters</text>
          <text x={985} y={341} textAnchor="middle" fill={colors.MUTED} fontSize={11}>recovery times</text>
        </g>

        {s.get(scene.wakeU) > 0 && Array.from({ length: 8 }, (_, i) => {
          const u = clamp01(s.get(scene.wakeU) * 8 - i);
          const p = DAY_POINTS[25 + i * 25];
          return <g key={i} opacity={u}>
            <circle cx={p.x} cy={p.y} r={7 + i * 0.8} fill={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM][i % 4]} opacity={0.22 + u * 0.35} />
            {i > 0 && <line x1={DAY_POINTS[25 + (i - 1) * 25].x} y1={DAY_POINTS[25 + (i - 1) * 25].y} x2={p.x} y2={p.y} stroke={colors.SECONDARY} strokeWidth={2} opacity={u * 0.55} />}
          </g>;
        })}

        <g opacity={s.get(scene.horizonU)}>
          <path d="M510 575 H770" stroke={colors.NEGATIVE} strokeWidth={4} strokeLinecap="round" />
          <text x={640} y={606} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>control horizon · no new demand</text>
        </g>
        <g opacity={s.get(scene.settleU)}>
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={lerp(430, 850, clamp01(s.get(scene.settleU) * 1.8 - i * 0.22))} cy={575} r={8} fill={i === 3 ? colors.POSITIVE : colors.WARM} />)}
        </g>
        <g opacity={s.get(scene.ledgerU)} transform="translate(442 495)">
          <rect width={396} height={82} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={198} y={30} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>terminal objective</text>
          <text x={198} y={59} textAnchor="middle" fill={colors.POSITIVE} fontSize={24} fontWeight={850}>final net assets</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={180} y={230} width={920} height={206} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={307} textAnchor="middle" fill={colors.TEXT} fontSize={35} fontWeight={850}>The past stays on the ledger</text>
      <text x={640} y={356} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>365 days of accumulated state</text>
      <text x={640} y={391} textAnchor="middle" fill={colors.WARM} fontSize={18}>one terminal balance sheet</text>
    </g>
  </>;
}

export const vizScene = () => scene;
