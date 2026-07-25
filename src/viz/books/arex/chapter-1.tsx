// The Answer Audits Itself — chapter 1: The Expensive Guess.
//
// Grounded in AREX paper §§1 and 2.1 and the official repository README.
// The paper frames multi-constraint research as a discovery–verification
// asymmetry: finding one jointly valid candidate is expensive, while checking
// a proposed candidate can be decomposed into constraint-wise tests.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const TARGET = { x: 815, y: 352 };
const rand = mulberry32(260721461);
const SEARCH_POINTS = Array.from({ length: 760 }, () => ({
  x: 105 + rand() * 1070,
  y: 135 + rand() * 420,
  r: 1.4 + rand() * 1.8,
}));
const PATH = [
  { x: 150, y: 500 },
  { x: 310, y: 220 },
  { x: 475, y: 470 },
  { x: 650, y: 185 },
  TARGET,
];
const CONSTRAINTS = [
  { label: 'time', x: 738, y: 314, rx: 125, ry: 94, color: colors.ACCENT },
  { label: 'place', x: 864, y: 314, rx: 125, ry: 94, color: colors.SECONDARY },
  { label: 'source', x: 768, y: 400, rx: 125, ry: 94, color: colors.WARM },
  { label: 'relation', x: 848, y: 400, rx: 125, ry: 94, color: colors.POSITIVE },
];

function pathPoint(p: number) {
  const q = clamp01(p) * (PATH.length - 1);
  const i = Math.min(PATH.length - 2, Math.floor(q));
  const u = q - i;
  return {
    x: PATH[i].x + (PATH[i + 1].x - PATH[i].x) * u,
    y: PATH[i].y + (PATH[i + 1].y - PATH[i].y) * u,
  };
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const lensesU = tl.channel('lensesU', 0);
  const searchP = tl.channel('searchP', 0);
  const candidateU = tl.channel('candidateU', 0);
  const checksU = tl.channel('checksU', 0);
  const verifiedU = tl.channel('verifiedU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'A deep-research answer may need one candidate that satisfies several constraints at the same time.' });
  tl.tween(fieldU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  tl.tween(lensesU, 1, { at: 2.1, dur: 1.5, ease: ease.draw });
  tl.hold(6.2, 0.6);

  tl.caption({ at: 6.8, dur: 5.5, text: 'The valid overlap can be tiny. Discovery means searching a large space for that one joint fit.' });
  tl.tween(searchP, 1, { at: 7.3, dur: 4.6, ease: ease.linear });
  tl.tween(cam, { x: 690, y: 350, k: 1.08 }, { at: 7.6, dur: 1.4, ease: ease.move });
  tl.hold(12.3, 0.5);

  tl.caption({ at: 12.8, dur: 5.3, text: 'Longer search is not guaranteed progress. Early mistakes can survive while exhausted directions repeat.' });
  tl.tween(searchP, 0.72, { at: 13.4, dur: 1.2, ease: ease.move });
  tl.tween(searchP, 0.96, { at: 15.1, dur: 1.2, ease: ease.move });
  tl.hold(18.1, 0.5);

  tl.caption({ at: 18.6, dur: 4.9, text: 'But once a provisional answer exists, each constraint becomes a direct question.' });
  tl.tween(candidateU, 1, { at: 19.0, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 815, y: 352, k: 1.3 }, { at: 19.2, dur: 1.4, ease: ease.move });
  tl.hold(23.5, 0.5);

  tl.caption({ at: 24.0, dur: 5.5, text: 'Check the date. Check the location. Check the source. Check the required relationship.' });
  tl.tween(checksU, 4, { at: 24.5, dur: 3.4, ease: ease.enter });
  tl.hold(29.0, 0.5);

  tl.caption({ at: 29.5, dur: 5.3, text: 'Those checks reveal more than pass or fail. They show exactly which claims are supported.' });
  tl.tween(verifiedU, 0.58, { at: 30.1, dur: 1.1, ease: ease.move });
  tl.hold(34.8, 0.5);

  tl.caption({ at: 35.3, dur: 5.3, text: 'The unresolved checks are not wasted work. They become the next, narrower research objective.' });
  tl.tween(verifiedU, 1, { at: 35.9, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 905, y: 360, k: 1.18 }, { at: 36.1, dur: 1.4, ease: ease.move });
  tl.hold(40.6, 0.5);

  tl.caption({ at: 41.1, dur: 5.1, text: 'Verification turns a partially correct answer into a map of what to preserve and what to pursue.' });
  tl.tween(cam, CAMERA_HOME, { at: 41.6, dur: 1.4, ease: ease.move });
  tl.hold(46.2, 0.5);

  tl.caption({ at: 46.7, dur: 6.2, text: 'That asymmetry is the core move: do not merely search longer. Audit the answer, then search where the audit points.' });
  tl.tween(dimU, 1, { at: 47.3, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 48.2, dur: 0.7, ease: ease.enter });
  tl.hold(52.9, 1.0);

  return { tl, cam, fieldU, lensesU, searchP, candidateU, checksU, verifiedU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const fieldU = s.get(scene.fieldU);
  const lensesU = s.get(scene.lensesU);
  const searchP = s.get(scene.searchP);
  const checksU = s.get(scene.checksU);
  const verifiedU = s.get(scene.verifiedU);
  const dot = pathPoint(searchP);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const compute = () => SEARCH_POINTS.map((p) => ({
    ...p,
    color: Math.hypot(p.x - TARGET.x, p.y - TARGET.y) < 70 ? colors.POSITIVE : colors.MUTED,
    alpha: fieldU * (Math.hypot(p.x - TARGET.x, p.y - TARGET.y) < 70 ? 0.85 : 0.24),
  }));

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <text x={640} y={72} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>Discovery is the expensive side</text>
      <text x={640} y={99} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>discovery ↔ constraint-wise verification</text>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <ParticleCloud state={s} compute={compute} alpha={1} />

          {CONSTRAINTS.map((c, i) => {
            const u = clamp01(lensesU * 5 - i);
            return (
              <g key={c.label} opacity={u}>
                <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={c.color} fillOpacity={0.055} stroke={c.color} strokeWidth={2} strokeDasharray="7 7" />
                <text x={c.x} y={c.y - c.ry - 9} textAnchor="middle" fill={c.color} fontSize={11} fontFamily={MONO}>{c.label}</text>
              </g>
            );
          })}

          {searchP > 0 && (
            <g transform={`translate(${dot.x} ${dot.y})`}>
              <circle r={25} fill={colors.WARM} opacity={0.12} />
              <circle r={8} fill={colors.WARM} />
              <text x={-22} y={22} textAnchor="end" fill={colors.WARM} fontSize={10} fontFamily={MONO}>candidate</text>
            </g>
          )}

          {s.get(scene.candidateU) > 0 && (
            <g transform={`translate(${TARGET.x} ${TARGET.y})`} opacity={s.get(scene.candidateU)}>
              <circle r={34} fill={colors.POSITIVE} opacity={0.16} />
              <circle r={11} fill={colors.POSITIVE} />
              <text y={62} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>provisional answer</text>
            </g>
          )}

          {checksU > 0 && (
            <g transform="translate(980 180)">
              <rect width={205} height={300} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={102} y={34} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={700}>constraint audit</text>
              {CONSTRAINTS.map((c, i) => {
                const u = clamp01(checksU - i);
                const done = verifiedU > (i + 0.8) / 4;
                return (
                  <g key={c.label} transform={`translate(22 ${68 + i * 53})`} opacity={u}>
                    <rect width={161} height={34} rx={8} fill={done ? colors.POSITIVE : colors.WARM} fillOpacity={0.12} stroke={done ? colors.POSITIVE : colors.WARM} />
                    <text x={14} y={22} fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{c.label}</text>
                    <text x={145} y={22} textAnchor="end" fill={done ? colors.POSITIVE : colors.WARM} fontSize={12}>{done ? '✓' : '?'}</text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={245} width={810} height={182} rx={20} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={29} fontWeight={700}>Search where the audit points</text>
          <text x={640} y={351} textAnchor="middle" fill={colors.MUTED} fontSize={16}>preserve verified evidence · target unresolved constraints</text>
          <text x={640} y={390} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>arXiv:2607.21461 · §1 discovery–verification asymmetry</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
