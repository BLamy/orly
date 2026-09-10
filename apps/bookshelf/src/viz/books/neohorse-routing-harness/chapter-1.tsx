// Grounding: arXiv:2609.08183 Sections 3.1 and 3.4; official NeoHorse README.md.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TIERS = [
  { id: 'C0', label: 'bounded', x: 250, color: colors.POSITIVE },
  { id: 'C1', label: 'general', x: 485, color: colors.ACCENT },
  { id: 'C2', label: 'multi-step', x: 720, color: colors.WARM },
  { id: 'C3', label: 'maximum', x: 955, color: colors.SECONDARY },
] as const;
const EVENTS = [
  { label: 'user request', short: 'USER', color: colors.ACCENT },
  { label: 'reasoning', short: 'THINK', color: colors.SECONDARY },
  { label: 'tool call', short: 'CALL', color: colors.WARM },
  { label: 'observation', short: 'RESULT', color: colors.POSITIVE },
  { label: 'recovery', short: 'RETRY', color: colors.NEGATIVE },
  { label: 'visible response', short: 'ANSWER', color: colors.ACCENT },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const requestU = tl.channel('user turn', 0);
  const fieldU = tl.channel('routing field', 0);
  const predictionU = tl.channel('raw prediction', 0);
  const policyU = tl.channel('policy adjustment', 0);
  const servedU = tl.channel('served tier', 0);
  const eventU = tl.channel('trajectory events', 0);
  const contextU = tl.channel('context policy', 0);
  const linksU = tl.channel('provenance links', 0);
  const recordU = tl.channel('training record', 0);
  const closeU = tl.channel('closing loop', 0);
  const pulse = tl.channel('route pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 58, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.5, text: 'A user turn enters a harness backed by different models, but the route it takes will matter long after the answer.' });
  tl.tween(requestU, 1, { at: 0.9, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 430, y: 330, k: 1.04 }, { at: 2.4, dur: 1.3, ease: ease.move });

  tl.caption({ at: 6.2, dur: 5.5, text: 'The router estimates capability demand from the request, recent dialogue, earlier routes, and available execution state.' });
  tl.tween(fieldU, 1, { at: 6.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 9.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 12.0, dur: 5.5, text: 'Its four tiers run from bounded work to maximum capability, while policy can still react to risk, pressure, failure, or service limits.' });
  tl.tween(predictionU, 1, { at: 12.6, dur: 1.3, ease: ease.move });
  tl.tween(policyU, 1, { at: 14.5, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 17.8, dur: 5.5, text: 'The system keeps the raw prediction, the policy-adjusted decision, and the tier actually served as three separate facts.' });
  tl.tween(servedU, 1, { at: 18.4, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 680, y: 300, k: 1.04 }, { at: 20.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 23.6, dur: 5.5, text: 'Once the model acts, the turn grows a tape of reasoning, tool calls, observations, recovery attempts, and the visible response.' });
  tl.tween(eventU, 1, { at: 24.1, dur: 4.2, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 400, k: 1.04 }, { at: 25.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 29.4, dur: 5.5, text: 'Current-turn reasoning stays with its actions, while reasoning from earlier turns is omitted and visible history remains as context.' });
  tl.tween(contextU, 1, { at: 30.0, dur: 1.4, ease: ease.move });

  tl.caption({ at: 35.2, dur: 5.5, text: 'The turn never loses its provenance: it stays linked to the complete trajectory and to the local subscene that shares its goal.' });
  tl.tween(linksU, 1, { at: 35.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 35.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 41.0, dur: 5.5, text: 'Now prediction, action, and outcome line up in one record, ready to be filtered instead of flattened into a prompt and answer.' });
  tl.tween(recordU, 1, { at: 41.6, dur: 1.2, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 44.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.8, dur: 6.0, text: 'That is the harness flywheel: serving a turn also creates evidence about what capability was requested, what ran, and what happened.' });
  tl.tween(closeU, 1, { at: 47.5, dur: 1.3, ease: ease.move });
  tl.hold(53.0, 1.2);

  return { tl, cam, requestU, fieldU, predictionU, policyU, servedU, eventU, contextU, linksU, recordU, closeU, pulse };
}

const scene = buildScene();

function Tier({ tier, u, selected, pulse }: { tier: typeof TIERS[number]; u: number; selected: number; pulse: number }) {
  const active = tier.id === 'C2' ? selected : 0;
  return <g transform={`translate(${tier.x} 250)`} opacity={clamp01(u)}>
    <circle r={52 + active * 7} fill={active ? '#332510' : colors.PANEL} stroke={tier.color} strokeWidth={2.5 + active * 2} />
    <circle r="61" fill="none" stroke={tier.color} strokeWidth="2" opacity={active * (0.35 + 0.35 * Math.sin(pulse * Math.PI * 8))} />
    <text y="-3" textAnchor="middle" fill={tier.color} fontSize="25" fontWeight="850">{tier.id}</text>
    <text y="23" textAnchor="middle" fill={colors.MUTED} fontSize="12">{tier.label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const events = s.get(scene.eventU);
  const selected = s.get(scene.servedU);
  const policy = s.get(scene.policyU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="74" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850" opacity={1 - clamp01(events * 2)}>a turn leaves more than an answer</text>
      <g opacity={s.get(scene.requestU)} transform="translate(72 132)">
        <rect width="230" height="82" rx="22" fill="#10243a" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="115" y="34" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>user turn</text>
        <text x="115" y="59" textAnchor="middle" fill={colors.TEXT} fontSize="13">request + recent context</text>
      </g>
      <path d="M302 173 C390 173 410 218 452 232" fill="none" stroke={colors.ACCENT} strokeWidth="5" strokeDasharray="12 8" strokeDashoffset={-36 * s.get(scene.pulse)} opacity={s.get(scene.fieldU)} />
      <g opacity={s.get(scene.fieldU)}>
        <rect x="180" y="184" width="880" height="150" rx="38" fill="#0f1728" stroke={colors.GRID} strokeWidth="2" />
        {TIERS.map((tier) => <Tier key={tier.id} tier={tier} u={s.get(scene.fieldU)} selected={selected} pulse={s.get(scene.pulse)} />)}
      </g>
      <g opacity={s.get(scene.predictionU)}>
        <path d="M560 118 C620 100 690 118 720 182" fill="none" stroke={colors.WARM} strokeWidth="3" />
        <text x="560" y="106" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>raw prediction → C2</text>
      </g>
      <g opacity={policy}>
        <rect x="775" y="116" width="250" height="46" rx="18" fill="#2d2111" stroke={colors.WARM} />
        <text x="900" y="145" textAnchor="middle" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>policy-adjusted decision → C2</text>
      </g>
      <g opacity={selected}>
        <path d="M720 306 V365" stroke={colors.WARM} strokeWidth="5" />
        <polygon points="720,375 709,354 731,354" fill={colors.WARM} />
        <text x="750" y="351" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>served tier C2</text>
      </g>

      <g transform="translate(92 400)">
        <rect width="1096" height="154" rx="30" fill="#111a2a" stroke={colors.GRID} strokeWidth="2" opacity={clamp01(events * 2)} />
        <text x="30" y="32" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>trajectory / user turn / subscene</text>
        {EVENTS.map((event, i) => {
          const u = clamp01(events * EVENTS.length - i);
          const x = 35 + i * 174;
          return <g key={event.short} transform={`translate(${x} 56)`} opacity={u}>
            <rect width="146" height="66" rx="17" fill={i === 4 ? '#301923' : '#15243a'} stroke={event.color} strokeWidth="2" />
            <text x="73" y="28" textAnchor="middle" fill={event.color} fontSize="13" fontFamily={colors.font.mono}>{event.short}</text>
            <text x="73" y="49" textAnchor="middle" fill={colors.TEXT} fontSize="11">{event.label}</text>
            {i < EVENTS.length - 1 && <path d="M146 33 H174" stroke={colors.MUTED} strokeWidth="3" />}
          </g>;
        })}
        <g opacity={s.get(scene.contextU)}>
          <path d="M220 135 H525" stroke={colors.SECONDARY} strokeWidth="5" strokeDasharray="9 7" />
          <text x="372" y="148" textAnchor="middle" fill={colors.SECONDARY} fontSize="11" fontFamily={colors.font.mono}>earlier visible history retained · earlier reasoning omitted</text>
        </g>
      </g>
      <g opacity={s.get(scene.linksU)}>
        <path d="M165 572 C260 620 408 620 494 572" fill="none" stroke={colors.ACCENT} strokeWidth="3" />
        <path d="M790 572 C878 620 1015 620 1100 572" fill="none" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="330" y="615" textAnchor="middle" fill={colors.ACCENT} fontSize="12">parent trajectory</text>
        <text x="945" y="615" textAnchor="middle" fill={colors.SECONDARY} fontSize="12">local subscene</text>
      </g>
      <g opacity={s.get(scene.recordU)} transform="translate(640 360)">
        <rect x="-230" y="-32" width="460" height="64" rx="24" fill="#13291f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text y="-3" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="800">prediction → action → outcome</text>
        <text y="20" textAnchor="middle" fill={colors.TEXT} fontSize="12">one provenance-linked training record</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="210" y="126" width="860" height="420" rx="48" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">the route becomes evidence</text>
      {['REQUEST', 'ROUTE', 'TRAJECTORY', 'OUTCOME'].map((label, i) => <g key={label} transform={`translate(${315 + i * 218} 350)`}>
        <circle r="58" fill={colors.PANEL} stroke={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={[colors.ACCENT, colors.WARM, colors.SECONDARY, colors.POSITIVE][i]} fontSize="13" fontFamily={colors.font.mono}>{label}</text>
        {i < 3 && <path d="M62 0 H145" stroke={colors.MUTED} strokeWidth="5" />}
      </g>)}
      <text x="640" y="485" textAnchor="middle" fill={colors.WARM} fontSize="19">serving writes the next training record</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
