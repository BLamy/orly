// Search the Claim, Keep the Source — chapter 3: Stabilize the Taxonomy.
//
// Grounded in AskChem src/askchem/taxonomy_v2.json,
// src/askchem/taxonomy_path_aliases.json, src/askchem/canonical_l3.py,
// src/askchem/taxonomy.py, and the README's stabilized and living taxonomies.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const VIEWS = [
  { label: 'by_reaction_type', angle: -2.5, color: colors.ACCENT },
  { label: 'by_substance_class', angle: -1.55, color: colors.SECONDARY },
  { label: 'by_application', angle: -0.6, color: colors.POSITIVE },
  { label: 'by_technique', angle: 0.55, color: colors.WARM },
  { label: 'by_mechanism', angle: 1.55, color: colors.TEAL },
];
const ALIASES = [
  'biomedicine/antibacterials',
  'biomedicine/antimicrobial_therapy',
  'biomedicine/antibacterial_therapy',
  'biomedicine/antimicrobial/other',
];
const LIVING = ['principles', 'theories', 'models', 'mechanisms', 'phenomena'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const claimU = tl.channel('claimU', 0);
  const viewsU = tl.channel('viewsU', 0);
  const fanU = tl.channel('fanU', 0);
  const aliasesU = tl.channel('aliasesU', 0);
  const funnelU = tl.channel('funnelU', 0);
  const treeU = tl.channel('treeU', 0);
  const diveU = tl.channel('diveU', 0);
  const livingU = tl.channel('livingU', 0);
  const orbitU = tl.channel('orbitU', 0);
  const pullbackU = tl.channel('pullbackU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'Chemistry can be browsed by reaction, substance, application, technique, or mechanism. One folder tree cannot answer every question.' });
  tl.tween(claimU, 1, { at: 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(viewsU, 1, { at: 1.6, dur: 1.4, ease: ease.enter });
  tl.hold(6.1, 0.6);

  tl.caption({ at: 6.7, dur: 5.8, text: 'Ask Chem places the same claim into several views, so the finding moves while the underlying source stays put.' });
  tl.tween(fanU, 1, { at: 7.2, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 345, k: 1.08 }, { at: 8.0, dur: 1.3, ease: ease.move });
  tl.hold(12.5, 0.6);

  tl.caption({ at: 13.1, dur: 5.8, text: 'But extracted labels drift. Several names can describe nearly the same branch, making paths unstable over time.' });
  tl.tween(aliasesU, 1, { at: 13.6, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 345, y: 350, k: 1.15 }, { at: 14.1, dur: 1.3, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.8, text: 'An alias map catches those variants and funnels them toward canonical destinations instead of multiplying branches.' });
  tl.tween(funnelU, 1, { at: 20.0, dur: 1.8, ease: ease.move });
  tl.hold(25.3, 0.6);

  tl.caption({ at: 25.9, dur: 5.9, text: 'The stabilized taxonomy locks broad, middle, and specific levels into a clean hierarchy that browsing can depend on.' });
  tl.tween(cam, CAMERA_HOME, { at: 25.0, dur: 0.9, ease: ease.move });
  tl.tween(treeU, 1, { at: 25.9, dur: 1.8, ease: ease.draw });
  tl.hold(31.8, 0.6);

  tl.caption({ at: 32.4, dur: 5.8, text: 'A reaction query can descend from reaction type, through coupling, to cross coupling without losing its place.' });
  tl.tween(diveU, 1, { at: 32.9, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 935, y: 355, k: 1.22 }, { at: 33.5, dur: 1.3, ease: ease.move });
  tl.hold(38.2, 0.6);

  tl.caption({ at: 38.8, dur: 6.0, text: 'A separate living taxonomy explores scientific principles, theories, models, mechanisms, and phenomena over the same store.' });
  tl.tween(livingU, 1, { at: 39.3, dur: 1.5, ease: ease.enter });
  tl.tween(orbitU, 1, { at: 40.4, dur: 2.1, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 41.0, dur: 1.3, ease: ease.move });
  tl.hold(44.8, 0.6);

  tl.caption({ at: 45.4, dur: 6.2, text: 'Many maps now sit over one claim store. Organizing the evidence never requires detaching it from the paper.' });
  tl.tween(pullbackU, 1, { at: 45.9, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 47.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 47.9, dur: 0.7, ease: ease.enter });
  tl.hold(51.6, 1.0);

  return { tl, cam, claimU, viewsU, fanU, aliasesU, funnelU, treeU, diveU, livingU, orbitU, pullbackU, dimU, endU };
}

const scene = buildScene();

function Pill({ x, y, text, color, u, w = 176 }: { x: number; y: number; text: string; color: string; u: number; w?: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y}) scale(${0.84 + uu * 0.16})`}>
    <rect x={-w / 2} y={-19} width={w} height={38} rx={13} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
    <text y={5} textAnchor="middle" fill={color} fontSize={11} fontFamily={MONO}>{text}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const viewsU = s.get(scene.viewsU);
  const fanU = s.get(scene.fanU);
  const aliasesU = s.get(scene.aliasesU);
  const funnelU = s.get(scene.funnelU);
  const treeU = s.get(scene.treeU);
  const diveU = s.get(scene.diveU);
  const livingU = s.get(scene.livingU);
  const orbitU = s.get(scene.orbitU);
  const pullbackU = s.get(scene.pullbackU);
  const viewOpacity = viewsU * (1 - aliasesU * 0.88) * (1 - treeU * 0.88);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={780} opacity={mainOpacity}>Stabilize the taxonomy</text>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity * (1 - pullbackU * 0.25)}>
        <g opacity={s.get(scene.claimU)} transform={`translate(${640 + (1 - fanU) * -255} 345)`}>
          <circle r={42} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={3} />
          <text y={-3} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={750}>one claim</text>
          <text y={17} textAnchor="middle" fill={colors.WARM} fontSize={9} fontFamily={MONO}>source_doi</text>
        </g>
        {VIEWS.map((view, i) => {
          const r = 225;
          const x = 640 + Math.cos(view.angle) * r * fanU;
          const y = 345 + Math.sin(view.angle) * r * 0.8 * fanU;
          return <g key={view.label} opacity={viewOpacity}>
            <line x1={640} y1={345} x2={x} y2={y} stroke={view.color} strokeWidth={2} opacity={0.28 + fanU * 0.42} />
            <Pill x={x} y={y} text={view.label} color={view.color} u={viewOpacity} w={184} />
          </g>;
        })}
        {aliasesU > 0 && <g opacity={aliasesU * (1 - treeU * 0.8)}>
          <rect x={86} y={151} width={430} height={340} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={301} y={187} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>taxonomy_path_aliases.json</text>
          {ALIASES.map((alias, i) => {
            const yy = 235 + i * 58;
            const targetY = 325;
            const x = 260 + funnelU * (340 - 260);
            const y = yy + funnelU * (targetY - yy);
            return <g key={alias}>
              <path d={`M260 ${yy} C300 ${yy} 310 ${targetY} 345 ${targetY}`} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.8} opacity={0.25 + funnelU * 0.5} />
              <Pill x={x} y={y} text={alias} color={colors.NEGATIVE} u={aliasesU} w={310} />
            </g>;
          })}
          {funnelU > 0 && <Pill x={401} y={325} text="biomedicine/antimicrobial" color={colors.POSITIVE} u={funnelU} w={245} />}
        </g>}
        {treeU > 0 && <g opacity={treeU * (1 - livingU * 0.88)}>
          <rect x={690} y={120} width={500} height={440} rx={26} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={940} y={157} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>taxonomy_v2.json · stable L1 / L2 / L3</text>
          {[
            { x: 790, y: 220, label: 'by_reaction_type', c: colors.ACCENT },
            { x: 940, y: 330, label: 'coupling', c: colors.WARM },
            { x: 1080, y: 445, label: 'cross_coupling', c: colors.POSITIVE },
          ].map((n, i, a) => <g key={n.label}>
            {i > 0 && <path d={`M${a[i - 1].x + 80} ${a[i - 1].y} C${a[i - 1].x + 120} ${a[i - 1].y} ${n.x - 120} ${n.y} ${n.x - 80} ${n.y}`} fill="none" stroke={n.c} strokeWidth={3} opacity={clamp01(treeU * 3 - i)} />}
            <Pill x={n.x} y={n.y} text={n.label} color={n.c} u={clamp01(treeU * 3 - i)} w={180} />
            {diveU > 0 && <circle cx={n.x} cy={n.y} r={27 + i * 5} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={clamp01(diveU * 3 - i) * (1 - clamp01(diveU * 3 - i - 1))} />}
          </g>)}
        </g>}
        {livingU > 0 && <g opacity={livingU}>
          {LIVING.map((label, i) => {
            const a = -Math.PI / 2 + i * (Math.PI * 2 / LIVING.length) + orbitU * 0.25;
            const r = 180 + i * 8;
            return <Pill key={label} x={640 + Math.cos(a) * r} y={345 + Math.sin(a) * r * 0.72} text={label} color={[colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE, colors.TEAL][i]} u={livingU} w={132} />;
          })}
          <text x={640} y={585} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>living taxonomy · exploratory overlay</text>
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={170} y={224} width={940} height={222} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={820}>One claim store, many maps</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={21}>stable facets for retrieval · living structures for discovery</text>
      <text x={640} y={397} textAnchor="middle" fill={colors.MUTED} fontSize={14}>organization changes; provenance does not</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
