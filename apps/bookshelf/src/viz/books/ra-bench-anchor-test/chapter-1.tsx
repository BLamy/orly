// The Anchor Test — chapter 1: One anchor, nine mirrors.
// Grounded in 24029100313/RA-Bench README.md, metadata/release_inventory.json,
// and metadata/ra_bench_main.csv. The persistent object is one norm_clip_id:
// its real anchor stays fixed while matched generated rows fan out by source.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const SOURCES = ['Hailuo', 'HappyHorse', 'Kling', 'LTX', 'Omni', 'Runway', 'Seedance', 'Wan dyn.', 'Wan light.'];
const CATEGORIES = ['disaster', 'war', 'emergency', 'protest', 'accident', 'rescue', 'weather', 'public safety', 'conflict', 'infrastructure'];
const GRID = { x: 284, y: 214, w: 84, h: 36, gap: 10 };

function FilmFrame({ x, y, u, real, label }: { x: number; y: number; u: number; real?: boolean; label?: string }) {
  const p = clamp01(u);
  if (p <= 0.002) return null;
  const color = real ? colors.POSITIVE : colors.ACCENT;
  return <g transform={`translate(${x} ${y}) scale(${0.82 + 0.18 * p})`} opacity={p}>
    <rect x={-42} y={-25} width={84} height={50} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={real ? 2.4 : 1.4} />
    <path d="M-31 12 L-12 -7 L1 4 L18 -15 L33 12 Z" fill={color} opacity={0.35} />
    <circle cx={20} cy={-10} r={5} fill={colors.WARM} opacity={0.8} />
    {label && <text y={43} textAnchor="middle" fill={color} fontSize={11} fontFamily={MONO}>{label}</text>}
  </g>;
}

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const anchorU = tl.channel('anchorU', 0);
  const idU = tl.channel('idU', 0);
  const railsU = tl.channel('railsU', 0);
  const sourceP = tl.channel('sourceP', 0);
  const gridP = tl.channel('gridP', 0);
  const categoryP = tl.channel('categoryP', 0);
  const totalsU = tl.channel('totalsU', 0);
  const invariantU = tl.channel('invariantU', 0);
  const stageDim = tl.channel('stageDim', 0);

  tl.caption({ at: 0.3, dur: 5.4, text: 'A crisis-video benchmark needs a truth it can keep returning to. Start with one real clip.' });
  tl.tween(anchorU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 260, y: 340, k: 1.08 }, { at: 1.4, dur: 1.3, ease: ease.move });
  tl.caption({ at: 6.1, dur: 5.0, text: 'The release names that clip once, then carries its normalized identity through every pairing.' });
  tl.tween(idU, 1, { at: 6.5, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 10.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 11.6, dur: 5.5, text: 'Now hold the anchor still and fan its scene into nine generation sources.' });
  tl.tween(railsU, 1, { at: 12.1, dur: 1.4, ease: ease.draw });
  tl.tween(sourceP, 9, { at: 13.0, dur: 2.4, ease: ease.enter });
  tl.caption({ at: 17.6, dur: 5.7, text: 'Each source contributes generated counterparts matched back to the same real scene.' });
  tl.tween(gridP, 9, { at: 18.0, dur: 3.2, ease: ease.linear });

  tl.caption({ at: 23.8, dur: 5.3, text: 'Repeat that structure across one thousand eight hundred thirty real anchors.' });
  tl.tween(cam, { x: 700, y: 342, k: 0.9 }, { at: 24.2, dur: 1.3, ease: ease.move });
  tl.caption({ at: 29.6, dur: 5.2, text: 'Those anchors span ten social-risk categories, so the test is organized around real crisis footage.' });
  tl.tween(categoryP, 10, { at: 30.0, dur: 2.6, ease: ease.enter });

  tl.caption({ at: 35.4, dur: 6.0, text: 'The released main track contains sixteen thousand fifty-six generated clips and seventeen thousand eight hundred eighty-six videos overall.' });
  tl.tween(totalsU, 1, { at: 36.0, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 40.0, dur: 1.2, ease: ease.move });
  tl.caption({ at: 42.0, dur: 6.2, text: 'The scale changes. The generator changes. The invariant is the real anchor beneath every comparison.' });
  tl.tween(stageDim, 1, { at: 42.4, dur: 1.1, ease: ease.move });
  tl.tween(invariantU, 1, { at: 43.2, dur: 0.7, ease: ease.enter });
  tl.hold(48.6, 1.2);
  return { tl, cam, anchorU, idU, railsU, sourceP, gridP, categoryP, totalsU, invariantU, stageDim };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - s.get(scene.stageDim) * 0.88;
  const gridP = s.get(scene.gridP);
  const sourceP = s.get(scene.sourceP);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={dim}>
      <text x={72} y={74} fill={colors.TEXT} fontSize={26} fontWeight={700}>one real anchor</text>
      <FilmFrame x={168} y={340} u={s.get(scene.anchorU)} real label="real::norm_clip_id" />
      <g opacity={s.get(scene.idU)}>
        <rect x={72} y={418} width={192} height={32} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} />
        <text x={168} y={439} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>norm_clip_id</text>
      </g>
      {SOURCES.map((name, i) => {
        const x = GRID.x + i * (GRID.w + GRID.gap);
        const u = clamp01(sourceP - i);
        return <g key={name} opacity={u}>
          <path d={`M210 340 C250 340 ${x} 178 ${x} 205`} fill="none" stroke={colors.MUTED} strokeWidth={1.3} opacity={s.get(scene.railsU) * 0.55} />
          <text x={x} y={162} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{name}</text>
          {Array.from({ length: 5 }, (_, row) => <FilmFrame key={row} x={x} y={GRID.y + row * 70} u={clamp01(gridP - i - row * 0.14)} />)}
        </g>;
      })}
      <g opacity={s.get(scene.categoryP) > 0 ? 1 : 0}>
        {CATEGORIES.map((name, i) => {
          const u = clamp01(s.get(scene.categoryP) - i);
          return <g key={name} opacity={u} transform={`translate(${330 + (i % 5) * 160} ${590 + Math.floor(i / 5) * 28})`}>
            <circle r={4} fill={colors.WARM} /><text x={10} y={4} fill={colors.MUTED} fontSize={11}>{name}</text>
          </g>;
        })}
      </g>
      <g opacity={s.get(scene.totalsU)}>
        <rect x={860} y={72} width={340} height={86} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} />
        <text x={890} y={105} fill={colors.ACCENT} fontSize={24} fontWeight={700}>16,056 generated</text>
        <text x={890} y={136} fill={colors.TEXT} fontSize={20}>17,886 videos total</text>
      </g>
    </g>
    {s.get(scene.invariantU) > 0 && <g opacity={s.get(scene.invariantU)}>
      <rect x={238} y={225} width={804} height={216} rx={24} fill="#0a0e1a" stroke={colors.POSITIVE} strokeWidth={2} />
      <text x={640} y={292} textAnchor="middle" fill={colors.MUTED} fontSize={16} letterSpacing="0.16em">THE INVARIANT</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={38} fontWeight={750}>the real anchor stays fixed</text>
      <text x={640} y={393} textAnchor="middle" fill={colors.TEXT} fontSize={18}>nine sources · matched by norm_clip_id</text>
    </g>}
  </Camera>;
}

export const vizScene = () => scene;
