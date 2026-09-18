// Grounding: arXiv:2609.17488 Sections 2.1–2.2; official source
// model/v2_0/transformer.py and model/v2_0/encoders.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ROWS = 5;
const COLS = 7;
const CELLS = Array.from({ length: ROWS * COLS }, (_, i) => ({
  row: Math.floor(i / COLS), col: i % COLS, x: 192 + (i % COLS) * 126, y: 174 + Math.floor(i / COLS) * 82,
}));
const MASK = 24;
const COL_LABELS = ['age', 'income', 'city', 'balance', 'visits', 'risk', 'y'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const tableU = tl.channel('raw table', 0);
  const rowCollapseU = tl.channel('row token temptation', 0);
  const cellLiftU = tl.channel('cell level tokens', 0);
  const maskU = tl.channel('shared missing embedding', 0);
  const codeU = tl.channel('low rank column code', 0);
  const permuteU = tl.channel('column permutation', 0);
  const dimsU = tl.channel('embedding dimensions', 0);
  const closeU = tl.channel('cell identity payoff', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'A table looks flat, but every cell answers two questions at once: what value is here, and which variable does it belong to?' });
  tl.tween(tableU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: 2.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'Many tabular models compress a whole row early. This model refuses that shortcut and preserves one representation per cell.' });
  tl.tween(rowCollapseU, 1, { at: 6.9, dur: 1.3, ease: ease.move });
  tl.tween(cellLiftU, 1, { at: 8.2, dur: 2.0, ease: ease.enter });

  tl.caption({ at: 12.4, dur: 5.5, text: 'The numerical encoder maps each observed value into a two-hundred-fifty-six-dimensional token.' });
  tl.tween(dimsU, 1, { at: 13.0, dur: 1.0, ease: ease.enter });
  tl.tween(rowCollapseU, 0, { at: 13.2, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 18.4, dur: 5.5, text: 'When a value is missing, its contents vanish into one shared learned embedding. The blank itself carries no column name.' });
  tl.tween(maskU, 1, { at: 19.0, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: CELLS[MASK].x, y: CELLS[MASK].y, k: 1.55 }, { at: 19.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'So discriminative feature encoding adds identity separately: a compact code, one quarter of the token width, projected into the embedding space.' });
  tl.tween(codeU, 1, { at: 25.0, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 740, y: 330, k: 1.14 }, { at: 24.7, dur: 1.3, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Value embedding plus column code gives the masked cell a place in the table even before its value is known.' });
  tl.tween(maskU, 1.7, { at: 31.0, dur: 1.2, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 33.4, dur: 1.3, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The code names the variable without treating neighboring columns as spatial neighbors. Permute columns with their codes, and the identity travels with them.' });
  tl.tween(permuteU, 1, { at: 37.0, dur: 2.3, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Now the model can compare cells within a row and statistics down a column without crushing either axis into a single vector.' });
  tl.tween(cellLiftU, 1.7, { at: 43.0, dur: 1.6, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.8, text: 'The first invariant is simple: every cell keeps its own value token, its own column identity, and its own route into context.' });
  tl.tween(closeU, 1, { at: 49.0, dur: 1.4, ease: ease.move });
  tl.hold(54.2, 1.0);
  return { tl, cam, tableU, rowCollapseU, cellLiftU, maskU, codeU, permuteU, dimsU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const table = s.get(scene.tableU);
  const lift = s.get(scene.cellLiftU);
  const mask = s.get(scene.maskU);
  const code = s.get(scene.codeU);
  const permute = s.get(scene.permuteU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="76" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">a table of cells, not rows</text>
      {COL_LABELS.map((label, c) => {
        const x = 192 + c * 126 + (c === 1 ? permute * 252 : c === 3 ? -permute * 252 : 0);
        return <text key={label} x={x} y="130" textAnchor="middle" fill={c === 3 ? colors.WARM : colors.MUTED} fontSize="13" fontFamily={colors.font.mono} opacity={table}>{label}</text>;
      })}
      {CELLS.map((cell, i) => {
        const swap = cell.col === 1 ? permute * 252 : cell.col === 3 ? -permute * 252 : 0;
        const x = cell.x + swap;
        const u = clamp01(table * CELLS.length - i);
        const isMask = i === MASK;
        const value = isMask && mask > 0.15 ? 'Emiss' : `${((cell.row + 2) * (cell.col + 3)) % 17}.${cell.row}`;
        const color = isMask ? colors.WARM : colors.ACCENT;
        return <g key={i} transform={`translate(${x} ${cell.y - lift * 10})`} opacity={u}>
          <rect x="-48" y="-28" width="96" height="56" rx="14" fill={isMask ? '#2b2513' : '#101827'} stroke={color} strokeWidth={isMask ? 3 : 1.5} />
          <text y="5" textAnchor="middle" fill={isMask ? colors.WARM : colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>{value}</text>
          {lift > 0 && <rect x="-43" y={31 + (1 - lift) * 16} width="86" height="8" rx="4" fill={color} opacity={0.18 + 0.55 * lift} />}
        </g>;
      })}
      <g opacity={s.get(scene.rowCollapseU)}>
        {Array.from({ length: ROWS }, (_, r) => <g key={r}>
          <path d={`M1050 ${174 + r * 82} H1130`} stroke={colors.NEGATIVE} strokeWidth="3" />
          <circle cx="1160" cy={174 + r * 82} r="23" fill="#281821" stroke={colors.NEGATIVE} strokeWidth="2" />
        </g>)}
        <text x="1110" y="610" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13">row compression</text>
      </g>
      <g opacity={code}>
        <path d={`M${CELLS[MASK].x} ${CELLS[MASK].y - 44} C780 110 900 110 986 184`} fill="none" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="10 8" />
        <rect x="892" y="164" width="220" height="88" rx="22" fill="#18172d" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="1002" y="196" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>DFE: u_j → E u_j</text>
        <text x="1002" y="226" textAnchor="middle" fill={colors.MUTED} fontSize="12">column identity</text>
      </g>
      <MathLabel tex={'d=256 \\qquad s=d/4'} x={1060} y={112} fontSize={21} opacity={s.get(scene.dimsU)} />
    </g>
    <g opacity={close}>
      <rect x="170" y="126" width="940" height="430" rx="58" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="218" textAnchor="middle" fill={colors.TEXT} fontSize="48" fontWeight="880">every cell keeps its place</text>
      {['value embedding', 'missing token', 'column code'].map((label, i) => <g key={label} transform={`translate(${348 + i * 292} 370)`}>
        <circle r="70" fill="#101827" stroke={[colors.ACCENT, colors.WARM, colors.SECONDARY][i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{label}</text>
      </g>)}
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="16">cell-level representation · low-rank identity</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
