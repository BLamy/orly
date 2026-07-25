// The Answer Audits Itself — chapter 2: Evidence on a Tape.
//
// Grounded in the released quickstart: src/arex_client.py,
// src/arex_http_tools.py, src/arex_tool_schema.py, and src/arex_prompts.py.
// AREXReActClient.run appends assistant responses and <tool_response>
// observations, dispatches search/google_scholar/visit, and returns when
// extract_fn_call_multi finds no tool call.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TOOLS = [
  { label: 'search', sub: 'serp_search_v1', x: 930, y: 190, color: colors.ACCENT },
  { label: 'google_scholar', sub: 'search_type=scholar', x: 1060, y: 330, color: colors.SECONDARY },
  { label: 'visit', sub: 'visit_pages_v1', x: 930, y: 470, color: colors.WARM },
];
const TAPE = [
  { role: 'system', text: 'SYSTEM_PROMPT_MAIN', color: colors.MUTED },
  { role: 'user', text: 'USER_PROMPT_MAIN', color: colors.ACCENT },
  { role: 'assistant', text: '<function=search>', color: colors.SECONDARY },
  { role: 'user', text: '<tool_response>', color: colors.POSITIVE },
  { role: 'assistant', text: '<function=visit>', color: colors.SECONDARY },
  { role: 'user', text: '<tool_response>', color: colors.POSITIVE },
  { role: 'assistant', text: 'final plain text', color: colors.WARM },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeP = tl.channel('tapeP', 0);
  const parseU = tl.channel('parseU', 0);
  const toolU = tl.channel('toolU', 0);
  const packet = tl.channel('packet', 0);
  const resultU = tl.channel('resultU', 0);
  const visitU = tl.channel('visitU', 0);
  const extractU = tl.channel('extractU', 0);
  const finishU = tl.channel('finishU', 0);
  const limitU = tl.channel('limitU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.6, text: 'The public quickstart begins with two messages: a research policy and the question to investigate.' });
  tl.tween(tapeP, 2, { at: 0.9, dur: 1.5, ease: ease.enter });
  tl.tween(cam, { x: 515, y: 340, k: 1.08 }, { at: 1.1, dur: 1.4, ease: ease.move });
  tl.hold(6.0, 0.5);

  tl.caption({ at: 6.5, dur: 5.3, text: 'The model answers with a tagged tool call. A parser extracts the function name and its arguments.' });
  tl.tween(tapeP, 3, { at: 7.0, dur: 0.7, ease: ease.enter });
  tl.tween(parseU, 1, { at: 7.7, dur: 1.1, ease: ease.draw });
  tl.hold(11.8, 0.5);

  tl.caption({ at: 12.3, dur: 5.1, text: 'Three real actions are available: web search, scholarly search, and visiting a page.' });
  tl.tween(toolU, 3, { at: 12.8, dur: 1.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.hold(17.4, 0.5);

  tl.caption({ at: 17.9, dur: 5.2, text: 'The runner dispatches the call, waits for the external service, and formats the returned evidence.' });
  tl.tween(packet, 1, { at: 18.4, dur: 3.2, ease: ease.linear });
  tl.hold(23.1, 0.5);

  tl.caption({ at: 23.6, dur: 5.0, text: 'That observation is wrapped as a tool response and appended to the same growing message tape.' });
  tl.tween(resultU, 1, { at: 24.1, dur: 0.8, ease: ease.enter });
  tl.tween(tapeP, 4, { at: 25.0, dur: 0.8, ease: ease.enter });
  tl.hold(28.6, 0.5);

  tl.caption({ at: 29.1, dur: 5.4, text: 'A page visit has another layer: long content is bounded, then an extractor keeps evidence that serves the current goal.' });
  tl.tween(visitU, 1, { at: 29.6, dur: 1.1, ease: ease.draw });
  tl.tween(extractU, 1, { at: 31.0, dur: 1.2, ease: ease.move });
  tl.tween(tapeP, 6, { at: 32.0, dur: 1.0, ease: ease.enter });
  tl.hold(34.5, 0.5);

  tl.caption({ at: 35.0, dur: 5.2, text: 'Each new observation can change the next query. The loop continues for as many as six hundred rounds.' });
  tl.tween(limitU, 1, { at: 35.6, dur: 1.0, ease: ease.enter });
  tl.hold(40.2, 0.5);

  tl.caption({ at: 40.7, dur: 5.2, text: 'When the response contains no tool call, the runner strips hidden thinking and returns the plain-text answer.' });
  tl.tween(finishU, 1, { at: 41.3, dur: 1.0, ease: ease.pop });
  tl.tween(tapeP, 7, { at: 42.1, dur: 0.8, ease: ease.enter });
  tl.hold(45.9, 0.5);

  tl.caption({ at: 46.4, dur: 6.2, text: 'This released runner is the inner research machine: action, observation, append, repeat, until the tape ends in an answer.' });
  tl.tween(dimU, 1, { at: 47.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 47.9, dur: 0.7, ease: ease.enter });
  tl.hold(52.6, 1.0);

  return { tl, cam, tapeP, parseU, toolU, packet, resultU, visitU, extractU, finishU, limitU, dimU, endU };
}

const scene = buildScene();

function TapeCard({ i, u }: { i: number; u: number }) {
  const c = TAPE[i];
  const x = 85 + i * 108;
  const y = 225 + (i % 2) * 88;
  return (
    <g transform={`translate(${x} ${y + (1 - u) * 18})`} opacity={u}>
      <rect width={96} height={62} rx={10} fill={colors.PANEL} stroke={c.color} />
      <text x={10} y={20} fill={c.color} fontSize={8.5} fontFamily={MONO}>{c.role}</text>
      <text x={10} y={42} fill={colors.TEXT} fontSize={8.2} fontFamily={MONO}>{c.text}</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const tapeP = s.get(scene.tapeP);
  const toolU = s.get(scene.toolU);
  const packet = s.get(scene.packet);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const p = packet < 0.5
    ? { x: 380 + (TOOLS[0].x - 380) * packet * 2, y: 260 + (TOOLS[0].y - 260) * packet * 2 }
    : { x: TOOLS[0].x + (490 - TOOLS[0].x) * (packet - 0.5) * 2, y: TOOLS[0].y + (402 - TOOLS[0].y) * (packet - 0.5) * 2 };

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={70} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>The released inner loop</text>
          <text x={640} y={97} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>AREXReActClient.run · messages.append(...)</text>

          <path d="M 82 354 C 300 380 560 380 810 354" fill="none" stroke={colors.GRID} strokeWidth={3} />
          {TAPE.map((_, i) => <TapeCard key={i} i={i} u={clamp01(tapeP - i)} />)}

          {s.get(scene.parseU) > 0 && (
            <g opacity={s.get(scene.parseU)}>
              <path d="M 330 222 C 365 175 420 165 470 177" fill="none" stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="6 5" />
              <rect x={470} y={145} width={260} height={58} rx={11} fill={colors.PANEL} stroke={colors.SECONDARY} />
              <text x={600} y={170} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>extract_fn_call_multi(response)</text>
              <text x={600} y={190} textAnchor="middle" fill={colors.SECONDARY} fontSize={9.5} fontFamily={MONO}>function + arguments</text>
            </g>
          )}

          {TOOLS.map((tool, i) => {
            const u = clamp01(toolU - i);
            return (
              <g key={tool.label} transform={`translate(${tool.x} ${tool.y})`} opacity={u}>
                <circle r={54} fill={tool.color} fillOpacity={0.1} stroke={tool.color} strokeWidth={2} />
                <text y={-3} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{tool.label}</text>
                <text y={17} textAnchor="middle" fill={tool.color} fontSize={8.5} fontFamily={MONO}>{tool.sub}</text>
              </g>
            );
          })}

          {packet > 0 && packet < 1 && (
            <g transform={`translate(${p.x} ${p.y})`}>
              <circle r={16} fill={colors.ACCENT} opacity={0.16} />
              <circle r={6} fill={colors.ACCENT} />
              <text y={-13} textAnchor="middle" fill={colors.ACCENT} fontSize={9} fontFamily={MONO}>{packet < 0.5 ? 'query' : 'organic[]'}</text>
            </g>
          )}

          {s.get(scene.resultU) > 0 && (
            <text x={490} y={436} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5} fontFamily={MONO} opacity={s.get(scene.resultU)}>&lt;tool_response&gt; evidence &lt;/tool_response&gt;</text>
          )}

          {s.get(scene.visitU) > 0 && (
            <g opacity={s.get(scene.visitU)}>
              <rect x={860} y={530} width={320} height={70} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <rect x={880} y={550} width={170 * (1 - 0.52 * s.get(scene.extractU))} height={10} rx={5} fill={colors.MUTED} opacity={0.55} />
              <rect x={880} y={570} width={255 * (1 - 0.62 * s.get(scene.extractU))} height={10} rx={5} fill={colors.MUTED} opacity={0.35} />
              <text x={1160} y={576} textAnchor="end" fill={colors.WARM} fontSize={9} fontFamily={MONO}>EXTRACTOR_PROMPT</text>
            </g>
          )}

          {s.get(scene.limitU) > 0 && (
            <text x={640} y={585} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={s.get(scene.limitU)}>for round_idx in range(1, max_rounds + 1) · default 600</text>
          )}
          {s.get(scene.finishU) > 0 && (
            <g opacity={s.get(scene.finishU)}>
              <circle cx={820} cy={465} r={34} fill={colors.POSITIVE} opacity={0.13} stroke={colors.POSITIVE} />
              <text x={820} y={469} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>no calls</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={245} width={810} height={182} rx={20} fill={colors.PANEL} stroke={colors.ACCENT} />
          <text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={700}>Action → observation → append</text>
          <text x={640} y={351} textAnchor="middle" fill={colors.MUTED} fontSize={16}>the public quickstart implements this inner research loop</text>
          <text x={640} y={390} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>search · google_scholar · visit · final plain text</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
