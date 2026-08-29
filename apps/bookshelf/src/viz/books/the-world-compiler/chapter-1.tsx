// Grounding: paper sections 1 and 4; scripts/unityscenebench/
// run_author_design_exp1_true_generation_by_training.py (asset names,
// Unity-backed generation protocol, snapshots, and FAILURE_MODES).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ASSETS = [
  { name: 'roof_canopy_long', x: 498, y: 182, w: 430, h: 34, color: colors.ACCENT },
  { name: 'chevron_support_pillar', x: 354, y: 320, w: 30, h: 220, color: colors.SECONDARY },
  { name: 'overhead_wire_pole', x: 808, y: 306, w: 24, h: 250, color: colors.MUTED },
  { name: 'red_phone_booth', x: 514, y: 370, w: 76, h: 112, color: colors.NEGATIVE },
  { name: 'utility_cabinet', x: 566, y: 378, w: 86, h: 88, color: colors.WARM },
  { name: 'flower_planter_trio', x: 944, y: 414, w: 116, h: 50, color: colors.POSITIVE },
];
const FAILURES = ['asset_overlap', 'off_platform_asset', 'platform_too_narrow', 'under_lit', 'camera_too_close', 'occluding_foreground'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fuzzyU = tl.channel('fuzzy proxy', 0);
  const planU = tl.channel('scene payload plan', 0);
  const importP = tl.channel('asset import progress', 0);
  const renderU = tl.channel('rendered screenshot', 0);
  const snapshotU = tl.channel('scene snapshot', 0);
  const scanP = tl.channel('engine check sweep', 0);
  const overlapU = tl.channel('asset overlap failure', 0);
  const offPlatformU = tl.channel('off platform failure', 0);
  const repairU = tl.channel('localized repair', 0);
  const passU = tl.channel('engine pass record', 0);
  const close = tl.channel('executable evidence', 0);

  tl.caption({ at: 0.4, dur: 6.1, text: 'A plausible video can earn a fuzzy similarity score while hiding a wall you can walk through.' });
  tl.tween(fuzzyU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 6.2, text: 'The released generator samples a fresh scene plan instead, so the candidate is a world the engine can execute.' });
  tl.tween(planU, 1, { at: 7.0, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 448, y: 320, k: 1.05 }, { at: 8.9, dur: 1.3, ease: ease.move });

  tl.caption({ at: 12.7, dur: 6.2, text: 'Unity imports real mesh assets, places them from the plan, and assembles one concrete rail platform.' });
  tl.tween(importP, ASSETS.length, { at: 13.2, dur: 3.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 16.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.9, dur: 6.2, text: 'The run captures a screenshot and writes a scene snapshot, tying visible evidence to the exact generated state.' });
  tl.tween(renderU, 1, { at: 19.4, dur: 1.1, ease: ease.draw });
  tl.tween(snapshotU, 1, { at: 21.2, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 25.1, dur: 6.3, text: 'Six checks sweep the same scene for overlap, escaped assets, narrow platforms, bad light, bad cameras, and foreground occlusion.' });
  tl.tween(scanP, FAILURES.length, { at: 25.7, dur: 4.5, ease: ease.linear });

  tl.caption({ at: 31.4, dur: 6.2, text: 'Here the phone booth collides with a cabinet, while the planter slips beyond the platform edge.' });
  tl.tween(overlapU, 1, { at: 31.9, dur: 0.5, ease: ease.pop });
  tl.tween(offPlatformU, 1, { at: 33.2, dur: 0.5, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 340, k: 1.05 }, { at: 34.1, dur: 1.3, ease: ease.move });

  tl.caption({ at: 37.6, dur: 6.2, text: 'Because the failure is localized, the repair moves those objects and the engine reruns the identical checks.' });
  tl.tween(repairU, 1, { at: 38.2, dur: 1.4, ease: ease.move });
  tl.tween(overlapU, 0, { at: 39.7, dur: 0.6, ease: ease.enter });
  tl.tween(offPlatformU, 0, { at: 39.7, dur: 0.6, ease: ease.enter });
  tl.tween(scanP, FAILURES.length * 2, { at: 40.1, dur: 2.2, ease: ease.linear });
  tl.tween(passU, 1, { at: 42.2, dur: 0.5, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 42.3, dur: 1.2, ease: ease.move });

  tl.caption({ at: 43.8, dur: 6.4, text: 'The accepted world is no longer just media. It is an executable specification with a trace of what failed and what fixed it.' });
  tl.tween(close, 1, { at: 44.5, dur: 1.1, ease: ease.move });
  tl.hold(50.4, 1.0);

  return { tl, cam, fuzzyU, planU, importP, renderU, snapshotU, scanP, overlapU, offPlatformU, repairU, passU, close };
}

const scene = buildScene();

function Asset({ asset, u, repair }: { asset: (typeof ASSETS)[number]; u: number; repair: number }) {
  const enter = clamp01(u);
  if (enter <= 0) return null;
  const phone = asset.name === 'red_phone_booth';
  const cabinet = asset.name === 'utility_cabinet';
  const planter = asset.name === 'flower_planter_trio';
  const dx = phone ? -52 * repair : planter ? -90 * repair : 0;
  const dy = 0;
  const labelDx = phone ? -48 : cabinet ? 52 : 0;
  const labelDy = asset.h / 2 + (cabinet ? 36 : 20);
  return <g opacity={enter} transform={`translate(${dx} ${dy + (1 - enter) * 28})`}>
    <rect x={asset.x - asset.w / 2} y={asset.y - asset.h / 2} width={asset.w} height={asset.h} rx="8" fill={asset.color} fillOpacity="0.22" stroke={asset.color} strokeWidth="3" />
    <text x={asset.x + labelDx} y={asset.y + labelDy} textAnchor="middle" fill={asset.color} fontSize="11" fontFamily={colors.font.mono}>{asset.name}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const plan = s.get(scene.planU);
  const importP = s.get(scene.importP);
  const repair = s.get(scene.repairU);
  const scanP = s.get(scene.scanP) % FAILURES.length;
  const activeFailure = Math.min(FAILURES.length - 1, Math.floor(scanP));
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">A game engine turns a scene into a test</text>

      <g opacity={s.get(scene.fuzzyU)} transform="translate(102 108)">
        <rect width="214" height="124" rx="24" fill="#111a2b" stroke={colors.MUTED} strokeWidth="2" />
        <path d="M28 88 C66 44 102 96 142 48 S188 76 194 38" fill="none" stroke={colors.SECONDARY} strokeWidth="7" opacity="0.7" />
        <text x="107" y="111" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>CLIP score: plausible</text>
      </g>

      <g opacity={plan} transform="translate(72 250)">
        <rect width="236" height="230" rx="24" fill="#102033" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="118" y="36" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>fresh scene payload</text>
        {ASSETS.slice(0, 5).map((asset, i) => <g key={asset.name} opacity={clamp01(plan * 4 - i * 0.45)}>
          <circle cx="28" cy={70 + i * 38} r="5" fill={asset.color} />
          <text x="43" y={75 + i * 38} fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>{asset.name}</text>
        </g>)}
      </g>

      <g>
        <rect x="330" y="116" width="850" height="400" rx="30" fill="#0d1727" stroke={s.get(scene.passU) ? colors.POSITIVE : colors.GRID} strokeWidth="3" />
        <rect x="372" y="430" width="732" height="60" rx="12" fill="#263249" stroke={colors.ACCENT} strokeWidth="2" />
        <line x1="352" y1="460" x2="1128" y2="460" stroke={colors.WARM} strokeWidth="4" strokeDasharray="18 12" opacity="0.7" />
        {ASSETS.map((asset, i) => <Asset key={asset.name} asset={asset} u={importP - i} repair={repair} />)}

        <g opacity={s.get(scene.renderU)}>
          <rect x="354" y="136" width="122" height="38" rx="19" fill="#102a22" stroke={colors.POSITIVE} />
          <text x="415" y="160" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>render.png</text>
        </g>
        <g opacity={s.get(scene.snapshotU)}>
          <rect x="494" y="136" width="142" height="38" rx="19" fill="#251d36" stroke={colors.SECONDARY} />
          <text x="565" y="160" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>scene_snapshot.json</text>
        </g>

        {s.get(scene.scanP) > 0 && <g>
          <line x1={350 + (scanP / FAILURES.length) * 804} y1="182" x2={350 + (scanP / FAILURES.length) * 804} y2="486" stroke={colors.WARM} strokeWidth="5" opacity="0.8" />
          <rect x="862" y="132" width="278" height="196" rx="20" fill="#111a2b" stroke={colors.GRID} />
          {FAILURES.map((failure, i) => <g key={failure} opacity={i === activeFailure ? 1 : 0.28}>
            <circle cx="884" cy={161 + i * 28} r="5" fill={i < activeFailure || s.get(scene.passU) ? colors.POSITIVE : i === activeFailure ? colors.WARM : colors.MUTED} />
            <text x="899" y={165 + i * 28} fill={i === activeFailure ? colors.TEXT : colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{failure}</text>
          </g>)}
        </g>}
        <g opacity={s.get(scene.overlapU)}>
          <circle cx="540" cy="374" r="58" fill={colors.NEGATIVE} fillOpacity="0.12" stroke={colors.NEGATIVE} strokeWidth="5" strokeDasharray="10 7" />
          <text x="540" y="304" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13" fontWeight="750">asset_overlap</text>
        </g>
        <g opacity={s.get(scene.offPlatformU)}>
          <path d="M892 458 H1110" stroke={colors.NEGATIVE} strokeWidth="7" />
          <text x="1001" y="374" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13" fontWeight="750">off_platform_asset</text>
        </g>
        <g opacity={s.get(scene.passU)} transform="translate(744 274)">
          <circle r="52" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="5" />
          <path d="M-24 2 L-7 20 L28 -20" fill="none" stroke={colors.POSITIVE} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <text y="78" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>engine label: pass</text>
        </g>
      </g>
    </g>

    <g opacity={close}>
      <rect x="194" y="126" width="892" height="430" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">the world becomes executable evidence</text>
      <g transform="translate(338 354)">
        <rect x="-104" y="-70" width="208" height="140" rx="26" fill="#13233a" stroke={colors.ACCENT} strokeWidth="3" />
        <text y="-8" textAnchor="middle" fill={colors.ACCENT} fontSize="18">scene plan</text>
        <text y="24" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>objects · transforms</text>
      </g>
      <path d="M454 354 H584" stroke={colors.WARM} strokeWidth="7" strokeLinecap="round" />
      <polygon points="584,354 560,340 560,368" fill={colors.WARM} />
      <g transform="translate(700 354)">
        <rect x="-92" y="-70" width="184" height="140" rx="26" fill="#221c35" stroke={colors.SECONDARY} strokeWidth="3" />
        <text y="-8" textAnchor="middle" fill={colors.SECONDARY} fontSize="18">Unity</text>
        <text y="24" textAnchor="middle" fill={colors.MUTED} fontSize="13">execute · check</text>
      </g>
      <path d="M794 354 H900" stroke={colors.POSITIVE} strokeWidth="7" strokeLinecap="round" />
      <polygon points="900,354 876,340 876,368" fill={colors.POSITIVE} />
      <g transform="translate(958 354)"><circle r="62" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" /><path d="M-28 0 L-8 22 L32 -24" fill="none" stroke={colors.POSITIVE} strokeWidth="9" strokeLinecap="round" /></g>
      <text x="640" y="506" textAnchor="middle" fill={colors.MUTED} fontSize="17">screenshot · snapshot · localized failure · repair</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
