// Grounding: LoopArena paper Sections 1 and 2.2; docs/protocol.md;
// src/looparena/harness/continuous_session.py, packet_compiler.py, and rendering.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const STATIONS = [
  { label: 'Worker', sub: 'persistent conversation', x: 250, y: 340, color: colors.ACCENT },
  { label: 'Reporter', sub: 'temporary · read only', x: 460, y: 150, color: colors.SECONDARY },
  { label: 'Evidence Packet', sub: 'report + cited turns', x: 760, y: 150, color: colors.WARM },
  { label: 'Controller', sub: 'no repository tools', x: 1020, y: 340, color: colors.POSITIVE },
  { label: 'Loop Contract', sub: 'advance · verify · stop', x: 760, y: 530, color: colors.NEGATIVE },
] as const;
const PATH = [...STATIONS, STATIONS[0]].map(({ x, y }) => ({ x, y }));

function pointOnPath(progress: number) {
  const p = Math.max(0, Math.min(PATH.length - 1.001, progress));
  const i = Math.floor(p);
  const u = p - i;
  return { x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * u, y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * u };
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const taskU = tl.channel('task enters', 0);
  const workerTurns = tl.channel('worker turns', 0);
  const orbitP = tl.channel('control cycle progress', 0);
  const reporterFork = tl.channel('reporter fork', 0);
  const readOnlyU = tl.channel('read only aperture', 0);
  const packetU = tl.channel('evidence packet', 0);
  const toolCutU = tl.channel('controller tool boundary', 0);
  const contractU = tl.channel('contract choices', 0);
  const verifyU = tl.channel('verify selected', 0);
  const returnU = tl.channel('assignment returns', 0);
  const evaluatorU = tl.channel('evaluator handoff', 0);
  const closeU = tl.channel('whole loop recap', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'A long coding task can look finished when one narrow check passes and another requirement stays untouched.' });
  tl.tween(taskU, 1, { at: 0.9, dur: 0.7, ease: ease.pop });
  tl.tween(workerTurns, 4, { at: 2.0, dur: 3.4, ease: ease.linear });

  tl.caption({ at: 6.5, dur: 5.8, text: 'Loop Arena holds the coding Worker fixed, then evaluates a different model that controls the loop around it.' });
  tl.tween(cam, { x: 430, y: 330, k: 1.18 }, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.tween(orbitP, 0.25, { at: 9.0, dur: 1.4, ease: ease.linear });

  tl.caption({ at: 12.6, dur: 5.8, text: 'When the Worker pauses naturally, the harness forks a temporary Reporter from the accumulated conversation.' });
  tl.tween(reporterFork, 1, { at: 13.1, dur: 1.0, ease: ease.draw });
  tl.tween(orbitP, 1, { at: 14.2, dur: 1.5, ease: ease.linear });
  tl.tween(cam, { x: 460, y: 205, k: 1.34 }, { at: 15.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'That Reporter can inspect the workspace through read only tools, but it cannot run tests or change the repository.' });
  tl.tween(readOnlyU, 1, { at: 19.3, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 22.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.8, dur: 5.8, text: 'The harness compiles its report and cited Worker turns into a structured Evidence Packet.' });
  tl.tween(orbitP, 2, { at: 25.3, dur: 1.7, ease: ease.linear });
  tl.tween(packetU, 1, { at: 26.8, dur: 0.6, ease: ease.pop });

  tl.caption({ at: 30.9, dur: 5.8, text: 'The Controller receives that packet and its own decision history, but never receives repository tools.' });
  tl.tween(orbitP, 3, { at: 31.5, dur: 1.8, ease: ease.linear });
  tl.tween(toolCutU, 1, { at: 33.3, dur: 0.8, ease: ease.draw });
  tl.tween(cam, { x: 960, y: 330, k: 1.22 }, { at: 34.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 37.0, dur: 5.8, text: 'Its Loop Contract chooses one action: advance the work, request focused verification, or stop.' });
  tl.tween(orbitP, 4, { at: 37.5, dur: 1.6, ease: ease.linear });
  tl.tween(contractU, 1, { at: 38.8, dur: 1.0, ease: ease.enter });
  tl.tween(verifyU, 1, { at: 40.1, dur: 0.5, ease: ease.pop });

  tl.caption({ at: 43.1, dur: 5.8, text: 'A continuing Contract becomes one bounded assignment in the same persistent Worker conversation.' });
  tl.tween(returnU, 1, { at: 43.7, dur: 2.2, ease: ease.linear });
  tl.tween(orbitP, 5, { at: 43.7, dur: 2.2, ease: ease.linear });
  tl.tween(workerTurns, 7, { at: 46.0, dur: 1.5, ease: ease.linear });

  tl.caption({ at: 49.2, dur: 6.2, text: 'When the Controller finally stops, the evaluator judges the workspace. The outer loop is the object under test.' });
  tl.tween(cam, CAMERA_HOME, { at: 49.7, dur: 1.2, ease: ease.move });
  tl.tween(evaluatorU, 1, { at: 50.6, dur: 1.3, ease: ease.linear });
  tl.tween(closeU, 1, { at: 52.4, dur: 1.1, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, taskU, workerTurns, orbitP, reporterFork, readOnlyU, packetU, toolCutU, contractU, verifyU, returnU, evaluatorU, closeU };
}

const scene = buildScene();

function Station({ item, u, glow = 0 }: { item: (typeof STATIONS)[number]; u: number; glow?: number }) {
  const enter = clamp01(u);
  return <g opacity={enter} transform={`translate(${item.x} ${item.y + (1 - enter) * 18})`}>
    <rect x="-104" y="-45" width="208" height="90" rx="22" fill="#101b2e" stroke={item.color} strokeWidth={2 + glow * 3} />
    <text y="-5" textAnchor="middle" fill={item.color} fontSize="18" fontWeight="800">{item.label}</text>
    <text y="22" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{item.sub}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const orbitP = s.get(scene.orbitP);
  const dot = pointOnPath(orbitP);
  const close = s.get(scene.closeU);
  const contract = s.get(scene.contractU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">the loop around the coding loop</text>
      <path d="M250 340 Q340 150 460 150 H760 Q930 150 1020 340 Q930 530 760 530 Q470 570 250 340" fill="none" stroke={colors.GRID} strokeWidth="5" strokeDasharray="12 12" />
      {STATIONS.map((item, i) => <Station key={item.label} item={item} u={clamp01(s.get(scene.taskU) * 4 - i * 0.45)} glow={Math.max(0, 1 - Math.abs(orbitP - i) * 2)} />)}
      <g transform={`translate(${dot.x} ${dot.y})`} opacity={s.get(scene.taskU)}>
        <circle r="14" fill={colors.WARM} stroke="#fff" strokeWidth="3" />
        <text y="-24" textAnchor="middle" fill={colors.WARM} fontSize="12" fontWeight="750">task state</text>
      </g>

      <g transform="translate(250 430)" opacity={s.get(scene.taskU)}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <rect key={i} x={-92 + i * 27} y="0" width="19" height={10 + 8 * ((i % 3) + 1)} rx="4" fill={i < s.get(scene.workerTurns) ? colors.ACCENT : colors.GRID} opacity={i < s.get(scene.workerTurns) ? 0.9 : 0.3} />)}
        <text x="0" y="54" textAnchor="middle" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>main Worker turns</text>
      </g>

      <path d="M250 305 Q330 222 430 170" fill="none" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="8 7" opacity={s.get(scene.reporterFork)} />
      <g opacity={s.get(scene.readOnlyU)} transform="translate(460 244)">
        <rect x="-86" y="-23" width="172" height="46" rx="12" fill="#221c35" stroke={colors.SECONDARY} />
        <text y="5" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>read-only workspace</text>
      </g>
      <g opacity={s.get(scene.packetU)} transform="translate(760 232)">
        <rect x="-88" y="-25" width="176" height="50" rx="12" fill="#2b2415" stroke={colors.WARM} strokeWidth="2" />
        <text y="5" textAnchor="middle" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>quoted_worker_evidence</text>
      </g>
      <g opacity={s.get(scene.toolCutU)} transform="translate(1020 430)">
        <text x="0" y="0" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>repository tools</text>
        <line x1="-72" y1="-12" x2="72" y2="12" stroke={colors.NEGATIVE} strokeWidth="5" />
      </g>
      {contract > 0 && <g opacity={contract}>
        {['advance', 'verify', 'stop'].map((label, i) => <g key={label} transform={`translate(${650 + i * 110} 598)`}>
          <rect x="-48" y="-19" width="96" height="38" rx="19" fill={label === 'verify' && s.get(scene.verifyU) ? '#2b2415' : '#121c2c'} stroke={label === 'verify' ? colors.WARM : colors.MUTED} strokeWidth={label === 'verify' && s.get(scene.verifyU) ? 3 : 1.5} />
          <text y="5" textAnchor="middle" fill={label === 'verify' ? colors.WARM : colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{label}</text>
        </g>)}
      </g>}
      <path d="M665 530 Q430 590 267 385" fill="none" stroke={colors.WARM} strokeWidth="5" opacity={s.get(scene.returnU)} strokeDasharray="10 8" />
      <g opacity={s.get(scene.evaluatorU)} transform="translate(1120 528)">
        <rect x="-82" y="-35" width="164" height="70" rx="18" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="800">task evaluator</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="156" y="122" width="968" height="440" rx="44" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="196" textAnchor="middle" fill={colors.TEXT} fontSize="38" fontWeight="850">the Controller is outside the coding loop</text>
      {STATIONS.slice(0, 5).map((item, i) => <g key={item.label} transform={`translate(${270 + i * 185} 340)`}>
        <circle r="46" fill="#101b2e" stroke={item.color} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={item.color} fontSize="12" fontWeight="800">{item.label}</text>
        {i < 4 && <><line x1="48" y1="0" x2="132" y2="0" stroke={colors.MUTED} strokeWidth="4" /><polygon points="132,0 114,-10 114,10" fill={colors.MUTED} /></>}
      </g>)}
      <text x="640" y="482" textAnchor="middle" fill={colors.MUTED} fontSize="17">same Worker · bounded guidance · executable evaluator</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
