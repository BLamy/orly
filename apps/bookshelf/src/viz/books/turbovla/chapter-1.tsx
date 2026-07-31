// Skip the Giant Model — chapter 1: Remove the Language Model Bottleneck.
//
// Grounded in arXiv:2607.27205 Figures 1–2 and Table 1, plus
// turbovla/models/turbovla.py GroundingDINOVLA.forward. The paper reports
// 31.2 ms latency, 0.2B parameters, 0.9 GB inference VRAM, and 32 Hz for
// TurboVLA; its illustrated pi-0.5 comparison is 93.6 ms / about 11 Hz.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const inputU = tl.channel('inputU', 0);
  const legacyU = tl.channel('legacyU', 0);
  const legacyRace = tl.channel('legacyRace', 0);
  const directU = tl.channel('directU', 0);
  const directRace = tl.channel('directRace', 0);
  const resourceU = tl.channel('resourceU', 0);
  const clockU = tl.channel('clockU', 0);
  const codeU = tl.channel('codeU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.8, text: 'A robot control tick begins with two camera frames, one instruction, and the need to move before the scene changes.' });
  tl.tween(inputU, 1, { at: 0.9, dur: 1.3, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.3, 0.6);

  tl.caption({ at: 6.9, dur: 5.8, text: 'A conventional vision language action policy routes every control step through a large language model before it can decode an action.' });
  tl.tween(legacyU, 1, { at: 7.3, dur: 1.6, ease: ease.draw });
  tl.hold(12.7, 0.6);

  tl.caption({ at: 13.3, dur: 5.8, text: 'In the paper’s comparison, that route takes ninety three point six milliseconds, so the next control ticks arrive before the first one finishes.' });
  tl.tween(legacyRace, 1, { at: 13.8, dur: 4.2, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 318, k: 1.12 }, { at: 14.2, dur: 1.3, ease: ease.move });
  tl.hold(19.1, 0.6);

  tl.caption({ at: 19.7, dur: 5.7, text: 'Turbo V L A removes that central detour. Vision and instruction features meet directly, then flow into a compact action decoder.' });
  tl.tween(legacyU, 0.12, { at: 20.2, dur: 1.0, ease: ease.move });
  tl.tween(directU, 1, { at: 20.5, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 21.0, dur: 1.3, ease: ease.move });
  tl.hold(25.4, 0.6);

  tl.caption({ at: 26.0, dur: 5.7, text: 'The direct route produces a complete action chunk in thirty one point two milliseconds, fast enough for thirty two policy updates each second.' });
  tl.tween(directRace, 1, { at: 26.4, dur: 2.0, ease: ease.linear });
  tl.tween(clockU, 1, { at: 28.0, dur: 1.6, ease: ease.draw });
  tl.hold(31.7, 0.6);

  tl.caption({ at: 32.3, dur: 5.6, text: 'The whole policy is two hundred million parameters, with nine tenths of a gigabyte of measured inference memory on the tested graphics card.' });
  tl.tween(resourceU, 1, { at: 32.8, dur: 1.5, ease: ease.enter });
  tl.tween(cam, { x: 905, y: 360, k: 1.18 }, { at: 33.2, dur: 1.3, ease: ease.move });
  tl.hold(37.9, 0.6);

  tl.caption({ at: 38.5, dur: 5.8, text: 'The repository makes the shortcut literal: visual tokens, text tokens, and two state tokens become one decoder memory.' });
  tl.tween(codeU, 1, { at: 39.0, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 390, k: 1.06 }, { at: 40.0, dur: 1.3, ease: ease.move });
  tl.hold(44.3, 0.6);

  tl.caption({ at: 44.9, dur: 6.2, text: 'One tick now travels from perception to motion without asking a giant generative model to stand in the middle.' });
  tl.tween(dimU, 1, { at: 45.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 46.1, dur: 0.7, ease: ease.enter });
  tl.hold(51.1, 1.0);

  return { tl, cam, inputU, legacyU, legacyRace, directU, directRace, resourceU, clockU, codeU, dimU, endU };
}

const scene = buildScene();

function Token({ x, y, label, color, u }: { x: number; y: number; label: string; color: string; u: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y}) scale(${0.82 + uu * 0.18})`}>
    <rect x={-58} y={-25} width={116} height={50} rx={14} fill={colors.PANEL} stroke={color} strokeWidth={2} />
    <text y={5} textAnchor="middle" fill={color} fontSize={13} fontFamily={MONO}>{label}</text>
  </g>;
}

function RoutePacket({ x0, x1, y, u, color }: { x0: number; x1: number; y: number; u: number; color: string }) {
  const uu = clamp01(u);
  return <g opacity={uu > 0 ? 1 : 0}>
    <circle cx={x0 + (x1 - x0) * uu} cy={y} r={9} fill={color} />
    <circle cx={x0 + (x1 - x0) * uu} cy={y} r={17} fill="none" stroke={color} opacity={0.25} />
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const inputU = s.get(scene.inputU);
  const legacyU = s.get(scene.legacyU);
  const directU = s.get(scene.directU);
  const resourceU = s.get(scene.resourceU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const legacyAngle = s.get(scene.legacyRace) * Math.PI * 5;
  const clockU = s.get(scene.clockU);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={mainOpacity}>
      <text x={640} y={52} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={760}>Remove the language-model bottleneck</text>
      <text x={640} y={78} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>V → LLM → A  versus  V + L → A</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <Token x={130} y={252} label="2 camera views" color={colors.ACCENT} u={inputU} />
        <Token x={130} y={438} label="instruction" color={colors.WARM} u={inputU} />

        <g opacity={legacyU}>
          <path d="M190 252 C300 252 300 318 410 318" fill="none" stroke={colors.MUTED} strokeWidth={3} strokeDasharray="7 7" />
          <path d="M190 438 C300 438 300 382 410 382" fill="none" stroke={colors.MUTED} strokeWidth={3} strokeDasharray="7 7" />
          <circle cx={510} cy={350} r={104} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={3} />
          <circle cx={510} cy={350} r={72} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="12 8" transform={`rotate(${legacyAngle * 18} 510 350)`} />
          <text x={510} y={342} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>large language</text>
          <text x={510} y={370} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>model</text>
          <path d="M614 350 H820" fill="none" stroke={colors.MUTED} strokeWidth={3} />
          <Token x={900} y={350} label="action" color={colors.NEGATIVE} u={legacyU} />
          <RoutePacket x0={200} x1={810} y={350} u={s.get(scene.legacyRace)} color={colors.NEGATIVE} />
          <text x={510} y={492} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontFamily={MONO}>93.6 ms · about 11 Hz</text>
        </g>

        <g opacity={directU}>
          <path d="M190 252 C320 252 320 314 445 314" fill="none" stroke={colors.ACCENT} strokeWidth={4} />
          <path d="M190 438 C320 438 320 386 445 386" fill="none" stroke={colors.WARM} strokeWidth={4} />
          <rect x={445} y={288} width={260} height={124} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={3} />
          <text x={575} y={338} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={760}>direct V–L interaction</text>
          <text x={575} y={371} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>feature_enhancer</text>
          <path d="M705 350 H820" fill="none" stroke={colors.POSITIVE} strokeWidth={4} />
          <Token x={900} y={350} label="12 × 7 actions" color={colors.POSITIVE} u={directU} />
          <RoutePacket x0={200} x1={810} y={350} u={s.get(scene.directRace)} color={colors.POSITIVE} />
          <text x={575} y={492} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontFamily={MONO}>31.2 ms · 32 Hz</text>
        </g>

        {clockU > 0 && <g transform="translate(1060 212)" opacity={clockU}>
          <circle r={74} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={2} />
          {Array.from({ length: 32 }, (_, i) => {
            const a = (i / 32) * Math.PI * 2 - Math.PI / 2;
            return <line key={i} x1={Math.cos(a) * 57} y1={Math.sin(a) * 57} x2={Math.cos(a) * 68} y2={Math.sin(a) * 68} stroke={i < 11 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={i % 4 === 0 ? 3 : 1.5} />;
          })}
          <text y={7} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={800}>32 Hz</text>
        </g>}

        {resourceU > 0 && <g transform="translate(984 360)" opacity={resourceU}>
          <rect x={0} y={0} width={220} height={180} rx={20} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={110} y={33} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>COMPLETE ONLINE POLICY</text>
          <text x={24} y={78} fill={colors.ACCENT} fontSize={28} fontWeight={800}>0.2B</text>
          <text x={24} y={100} fill={colors.MUTED} fontSize={12}>parameters</text>
          <text x={24} y={142} fill={colors.WARM} fontSize={28} fontWeight={800}>0.9 GB</text>
          <text x={24} y={164} fill={colors.MUTED} fontSize={12}>inference VRAM</text>
        </g>}

        {s.get(scene.codeU) > 0 && <g opacity={s.get(scene.codeU)} transform="translate(274 548)">
          <rect width={732} height={58} rx={15} fill={colors.PANEL} stroke={colors.ACCENT} />
          <text x={366} y={24} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>GroundingDINOVLA.forward</text>
          <text x={366} y={46} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>cat([visual_tokens, text_tokens, state_tokens]) → action_policy</text>
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={190} y={238} width={900} height={190} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={303} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>Vision + language → action</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={20}>31.2 ms · 0.2B parameters · 0.9 GB</text>
      <text x={640} y={390} textAnchor="middle" fill={colors.MUTED} fontSize={14}>the direct execution path in one policy tick</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
