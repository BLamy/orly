// Grounding: paper equations 11–13; orarl/algorithm/selection.py;
// orarl/algorithm/correction.py; tests/test_algorithm_selection.py; configs/orarl_9b.yaml.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ROWS = [
  { id: 0, score: 0.8, oracle: false },
  { id: 1, score: 0.4, oracle: false },
  { id: 2, score: -0.9, oracle: false },
  { id: 3, score: -0.3, oracle: false },
  { id: 4, score: 0.0, oracle: false },
  { id: 5, score: 0.5, oracle: true },
];
const SELECTED = new Set([0, 2, 3, 5]);
const KEPT = ROWS.filter((r) => SELECTED.has(r.id));
const PRE_POLICY_RMS = Math.sqrt(ROWS.filter((r) => !r.oracle).reduce((sum, r) => sum + r.score * r.score, 0) / 5);
const CENTER = KEPT.reduce((sum, r) => sum + r.score, 0) / KEPT.length;
const CENTERED = KEPT.map((r) => r.score - CENTER);
const SELECTED_RMS = Math.sqrt(CENTERED.reduce((sum, v) => sum + v * v, 0) / CENTERED.length);
const RMS_SCALE = Math.min(1, Math.max(0.25, PRE_POLICY_RMS / SELECTED_RMS));
const CORRECTED = CENTERED.map((v) => v * RMS_SCALE);

const startPos = (i: number) => ({ x: 172 + i * 188, y: 188 });
const lanePos = (row: typeof ROWS[number]) => {
  if (row.oracle) return { x: 1090, y: 322 };
  if (row.score > 0) return { x: row.id === 0 ? 280 : 438, y: 322 };
  if (row.score < 0) return { x: row.id === 2 ? 648 : 806, y: 442 };
  return { x: 966, y: 544 };
};

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const rowsP = tl.channel('full advantage group', 0);
  const splitU = tl.channel('split by sign', 0);
  const oracleKeepU = tl.channel('force keep oracle', 0);
  const selectP = tl.channel('strict quotas', 0);
  const fallbackU = tl.channel('fallback order', 0);
  const dropU = tl.channel('drop unselected', 0);
  const distortionU = tl.channel('selection distorts moments', 0);
  const correctionU = tl.channel('moment correction', 0);
  const updateU = tl.channel('actor update group', 0);
  const close = tl.channel('both signs survive', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'The full rollout group carries useful positives, useful negatives, and a few rows that say almost nothing.' });
  tl.tween(rowsP, 6, { at: 0.8, dur: 3.0, ease: ease.enter });

  tl.caption({ at: 6.8, dur: 6.1, text: 'The method computes every advantage first, then sends the rows through a sign-balanced sorter.' });
  tl.tween(splitU, 1, { at: 7.5, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 620, y: 380, k: 1.08 }, { at: 9.8, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.3, dur: 6.1, text: 'The annotation-derived oracle is force-kept as the positive anchor.' });
  tl.tween(oracleKeepU, 1, { at: 14.0, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 1010, y: 322, k: 1.12 }, { at: 15.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 19.8, dur: 6.3, text: 'The configured budget then keeps one strongest positive policy row and two strongest negative rows.' });
  tl.tween(selectP, 4, { at: 20.5, dur: 2.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 23.3, dur: 1.2, ease: ease.move });

  tl.caption({ at: 26.5, dur: 6.2, text: 'If one sign runs short, the selector borrows from the other sign, and uses a zero row only as the last fallback.' });
  tl.tween(fallbackU, 1, { at: 27.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 33.1, dur: 6.2, text: 'The unselected rows disappear before the actor’s forward and backward passes, where the expensive work happens.' });
  tl.tween(dropU, 1, { at: 33.8, dur: 1.3, ease: ease.move });

  tl.caption({ at: 39.7, dur: 6.1, text: 'But selection changes the retained mean and scale, because large magnitudes and the positive oracle are favored.' });
  tl.tween(distortionU, 1, { at: 40.4, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 640, y: 446, k: 1.13 }, { at: 42.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 46.2, dur: 6.4, text: 'Post-selection correction recenters the group, prevents a negative oracle, and only downscales the root-mean-square size.' });
  tl.tween(correctionU, 1, { at: 46.9, dur: 1.5, ease: ease.move });

  tl.caption({ at: 53.0, dur: 6.2, text: 'The configured floor limits that attenuation to a factor of four, while amplification is never allowed.' });
  tl.tween(updateU, 1, { at: 53.7, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 56.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 59.6, dur: 6.5, text: 'Four rows reach the update: the oracle, one policy success, and two policy failures. Both learning directions survive.' });
  tl.tween(close, 1, { at: 60.3, dur: 1.1, ease: ease.move });
  tl.hold(66.4, 1.0);

  return { tl, cam, rowsP, splitU, oracleKeepU, selectP, fallbackU, dropU, distortionU, correctionU, updateU, close };
}

const scene = buildScene();

function RowBead({ row, x, y, u, selected, drop, oracleKeep }: { row: typeof ROWS[number]; x: number; y: number; u: number; selected: boolean; drop: number; oracleKeep: number }) {
  const color = row.oracle ? colors.WARM : row.score > 0 ? colors.POSITIVE : row.score < 0 ? colors.NEGATIVE : colors.MUTED;
  const dim = selected ? 0 : drop * 0.9;
  const halo = row.oracle ? oracleKeep : selected ? clamp01(drop * 2) : 0;
  return <g opacity={u * (1 - dim)} transform={`translate(${x} ${y}) scale(${0.82 + u * 0.18})`}>
    <circle r={halo > 0 ? 29 : 23} fill={color} opacity={0.22 + halo * 0.16} />
    <circle r="20" fill={color} stroke="#07101d" strokeWidth="3" />
    <text y="5" textAnchor="middle" fill="#07101d" fontSize="12" fontWeight="900">{row.oracle ? 'GT' : row.id}</text>
    <text y="-34" textAnchor="middle" fill={color} fontSize="13" fontFamily={colors.font.mono}>{row.score > 0 ? '+' : ''}{row.score.toFixed(1)}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const split = s.get(scene.splitU);
  const drop = s.get(scene.dropU);
  const distortion = s.get(scene.distortionU);
  const correction = s.get(scene.correctionU);
  const selectedProgress = s.get(scene.selectP);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet * (1 - distortion * 0.92)}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">A sorter that keeps both directions</text>

      <g opacity={split}>
        <rect x="198" y="270" width="318" height="104" rx="26" fill="#0d2a23" stroke={colors.POSITIVE} strokeWidth="2" />
        <text x="357" y="256" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontWeight="800">positive policy</text>
        <rect x="566" y="390" width="318" height="104" rx="26" fill="#2a131d" stroke={colors.NEGATIVE} strokeWidth="2" />
        <text x="725" y="376" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontWeight="800">negative policy</text>
        <rect x="912" y="492" width="108" height="102" rx="25" fill="#182130" stroke={colors.MUTED} strokeWidth="2" />
        <text x="966" y="478" textAnchor="middle" fill={colors.MUTED} fontSize="13">zero</text>
        <rect x="1036" y="270" width="108" height="104" rx="26" fill="#2b240d" stroke={colors.WARM} strokeWidth="2" />
        <text x="1090" y="256" textAnchor="middle" fill={colors.WARM} fontSize="13">oracle</text>
      </g>

      {ROWS.map((row, i) => {
        const u = clamp01(s.get(scene.rowsP) - i);
        const a = startPos(i);
        const b = lanePos(row);
        const selected = SELECTED.has(row.id);
        return <RowBead key={row.id} row={row} x={a.x + (b.x - a.x) * split} y={a.y + (b.y - a.y) * split} u={u} selected={selectedProgress > 0 && selected} drop={drop} oracleKeep={s.get(scene.oracleKeepU)} />;
      })}

      <g opacity={clamp01(selectedProgress)}>
        {KEPT.map((row, i) => {
          const pos = lanePos(row);
          const u = clamp01(selectedProgress - i);
          return <g key={row.id} opacity={u}>
            <circle cx={pos.x} cy={pos.y} r="35" fill="none" stroke={colors.WARM} strokeWidth="3" strokeDasharray="7 6" />
            <text x={pos.x} y={pos.y + 62} textAnchor="middle" fill={colors.WARM} fontSize="12" fontWeight="800">keep</text>
          </g>;
        })}
      </g>

      <g opacity={s.get(scene.fallbackU)}>
        <path d="M512 548 C610 580 748 580 900 548" fill="none" stroke={colors.SECONDARY} strokeWidth="3" strokeDasharray="8 7" />
        <text x="706" y="590" textAnchor="middle" fill={colors.SECONDARY} fontSize="13">cross-sign fallback → zero fallback</text>
      </g>
    </g>

    <g opacity={distortion * quiet}>
      <text x="640" y="78" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="850">Correct the retained moments</text>
      <text x="640" y="112" textAnchor="middle" fill={colors.MUTED} fontSize="14" fontFamily={colors.font.mono}>selected row IDs [0, 2, 3, 5]</text>
      <line x1="198" y1="360" x2="1082" y2="360" stroke={colors.GRID} strokeWidth="4" />
      {KEPT.map((row, i) => {
        const x = 314 + i * 218;
        const before = row.score;
        const after = CORRECTED[i];
        const value = before + (after - before) * correction;
        const top = 360 - value * 180;
        const color = row.oracle ? colors.WARM : value >= 0 ? colors.POSITIVE : colors.NEGATIVE;
        return <g key={row.id}>
          <rect x={x - 42} y={Math.min(360, top)} width="84" height={Math.max(3, Math.abs(360 - top))} rx="12" fill={color} opacity="0.8" />
          <circle cx={x} cy={top} r={s.get(scene.updateU) > 0 ? 16 : 10} fill={color} />
          <text x={x} y="410" textAnchor="middle" fill={color} fontSize="14" fontWeight="800">{row.oracle ? 'oracle' : `row ${row.id}`}</text>
          <text x={x} y="438" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{value >= 0 ? '+' : ''}{value.toFixed(2)}</text>
        </g>;
      })}
      <g opacity={correction}>
        <rect x="314" y="492" width="652" height="72" rx="24" fill="#101a2d" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="640" y="520" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>Σ Â = 0 · Âgt ≥ 0 · λ = {RMS_SCALE.toFixed(2)}</text>
        <text x="640" y="546" textAnchor="middle" fill={colors.MUTED} fontSize="14">recenter · protect oracle sign · RMS downscale only</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="208" y="138" width="864" height="402" rx="40" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="210" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">four rows reach the update</text>
      {[
        { label: 'policy +', color: colors.POSITIVE },
        { label: 'policy −', color: colors.NEGATIVE },
        { label: 'policy −', color: colors.NEGATIVE },
        { label: 'oracle +', color: colors.WARM },
      ].map((item, i) => <g key={i} transform={`translate(${370 + i * 180} 350)`}>
        <circle r="58" fill="#101a2d" stroke={item.color} strokeWidth="5" />
        <text y="6" textAnchor="middle" fill={item.color} fontSize="17" fontWeight="850">{item.label}</text>
      </g>)}
      <text x="640" y="472" textAnchor="middle" fill={colors.MUTED} fontSize="21">reinforce what worked · suppress what failed</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
