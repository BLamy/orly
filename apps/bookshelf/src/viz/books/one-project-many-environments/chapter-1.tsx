// One Project, Many Environments — chapter 1.
// Grounded in Loop QA PR #1686: scripts/schema.ts (project_environments),
// netlify/functions/lib/project-environments.ts (normalization/replacement), and
// project-chat-environments.ts (mergeProjectEnvironmentForChat).
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ENVIRONMENTS = [
  { name: 'Production', kind: 'production', url: 'app.example.com', color: colors.POSITIVE },
  { name: 'Staging', kind: 'staging', url: 'staging.example.com', color: colors.WARM },
  { name: 'Development', kind: 'development', url: 'localhost', color: colors.ACCENT },
  { name: 'Preview', kind: 'preview', url: 'deployment-resolved', color: colors.SECONDARY },
] as const;
const JOURNEYS = ['sign in', 'search', 'checkout', 'profile'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const projectsU = tl.channel('projectsU', 0);
  const duplicateU = tl.channel('duplicateU', 0);
  const driftU = tl.channel('driftU', 0);
  const collapseU = tl.channel('collapseU', 0);
  const envU = tl.channel('envU', 0);
  const urlsU = tl.channel('urlsU', 0);
  const instructionsU = tl.channel('instructionsU', 0);
  const chatU = tl.channel('chatU', 0);
  const sharedGlow = tl.channel('sharedGlow', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.5;
  t = tl.caption({ at: t, dur: 6, text: 'A production project, a staging project, a development project, and a preview project all begin with the same journeys.' });
  tl.tween(projectsU, 1, { at: 0.8, dur: 1.5, ease: ease.enter });
  tl.tween(duplicateU, 1, { at: 2.0, dur: 2.8, ease: ease.linear });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 6, text: 'But every copied journey becomes another thing to edit, schedule, and eventually forget.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.12 }, { at: t - 5.6, dur: 1.2, ease: ease.move });
  tl.tween(driftU, 1, { at: t - 4.7, dur: 3.0, ease: ease.linear });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.5, text: 'This change makes the project the stable thing, and turns environments into named settings inside it.' });
  tl.tween(collapseU, 1, { at: t - 5.0, dur: 2.5, ease: ease.move });
  tl.tween(cam, { x: 640, y: 350, k: 1.0 }, { at: t - 4.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6, text: 'Production, staging, development, and preview now live as rows in one environment table.' });
  tl.tween(envU, 1, { at: t - 5.5, dur: 2.5, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6, text: 'Each row can own its address, its testing instructions, its trigger, and whether it is the default.' });
  tl.tween(urlsU, 1, { at: t - 5.5, dur: 1.8, ease: ease.enter });
  tl.tween(instructionsU, 1, { at: t - 3.5, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 6.2, text: 'The project chat can add staging without asking a model to rewrite and risk deleting the complete environment list.' });
  tl.tween(chatU, 1, { at: t - 5.8, dur: 0.7, ease: ease.enter });
  tl.tween(envU, 1.12, { at: t - 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(envU, 1, { at: t - 2.8, dur: 0.5, ease: ease.move });
  t = tl.hold(t, 0.5);

  t = tl.caption({ at: t, dur: 6, text: 'The journeys stay shared. Only the world they run against changes.' });
  tl.tween(sharedGlow, 1, { at: t - 5.5, dur: 1.2, ease: ease.pop });
  tl.tween(chatU, 0, { at: t - 4.5, dur: 0.8, ease: ease.move });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 5.5, text: 'One project keeps the knowledge. Environments supply the context.' });
  tl.tween(closeU, 1, { at: t - 5.0, dur: 0.9, ease: ease.enter });
  tl.tween(envU, 0.14, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(sharedGlow, 0, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: t - 4.6, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.0);
  return { tl, cam, projectsU, duplicateU, driftU, collapseU, envU, urlsU, instructionsU, chatU, sharedGlow, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const projectsU = s.get(scene.projectsU);
  const duplicateU = s.get(scene.duplicateU);
  const collapseU = ease.move(clamp01(s.get(scene.collapseU)));
  const driftU = s.get(scene.driftU);
  const envU = s.get(scene.envU);
  const sharedGlow = s.get(scene.sharedGlow);
  const closeU = s.get(scene.closeU);
  return <>
    <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
    <Camera {...s.get(scene.cam)}>
      {ENVIRONMENTS.map((environment, row) => {
        const fromX = 85 + row * 295;
        const fromY = 95;
        const toX = 165;
        const toY = 245 + row * 82;
        const x = lerp(fromX, toX, collapseU);
        const y = lerp(fromY, toY, collapseU);
        const cardW = lerp(260, 950, collapseU);
        return <g key={environment.kind} opacity={projectsU} transform={`translate(${x},${y})`}>
          <rect width={cardW} height={64} rx={14} fill={colors.PANEL} stroke={environment.color} strokeWidth={collapseU > 0.7 ? 1.8 : 1.2} opacity={0.95} />
          <text x={18} y={26} fill={colors.TEXT} fontSize={17} fontWeight={700}>{environment.name}</text>
          <text x={18} y={47} fill={colors.MUTED} fontSize={12} fontFamily={mono}>{environment.kind}</text>
          {collapseU > 0.55 && <>
            <text x={210} y={27} fill={colors.MUTED} fontSize={12} fontFamily={mono} opacity={s.get(scene.urlsU)}>{environment.url}</text>
            <text x={515} y={27} fill={colors.ACCENT} fontSize={12} fontFamily={mono} opacity={s.get(scene.instructionsU)}>{row === 0 ? 'instructions: set' : 'instructions: inherit'}</text>
          </>}
        </g>;
      })}

      {ENVIRONMENTS.flatMap((_, project) => JOURNEYS.map((journey, column) => {
        const shown = clamp01(duplicateU * 5 - column);
        const startX = 118 + project * 295 + column * 54;
        const startY = 175 + (project === 2 && column === 3 ? driftU * 38 : 0);
        const endX = 420 + column * 150;
        const endY = 130;
        return <g key={`${project}-${journey}`} opacity={shown * (collapseU > 0.7 && project > 0 ? 1 - collapseU : 1)} transform={`translate(${lerp(startX, endX, collapseU)},${lerp(startY, endY, collapseU)})`}>
          <circle r={12 + 3 * sharedGlow} fill={project === 2 && column === 3 && driftU > 0.5 ? colors.NEGATIVE : colors.ACCENT} opacity={0.88} />
          {project === 0 && <text y={32} textAnchor="middle" fill={colors.MUTED} fontSize={11}>{journey}</text>}
        </g>;
      }))}

      {collapseU > 0.45 && <g opacity={collapseU}>
        <rect x={310} y={72} width={650} height={118} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2 + 2 * sharedGlow} />
        <text x={635} y={105} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={750}>Shared journey catalog</text>
        <text x={635} y={174} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>journeys · one copy per project</text>
      </g>}

      {s.get(scene.chatU) > 0 && <g opacity={s.get(scene.chatU)} transform={`translate(735 ${210 - 12 * s.get(scene.chatU)})`}>
        <rect width={420} height={72} rx={18} fill={colors.PANEL} stroke={colors.SECONDARY} />
        <text x={22} y={29} fill={colors.TEXT} fontSize={15}>“Add this as my staging URL.”</text>
        <text x={22} y={52} fill={colors.SECONDARY} fontSize={12} fontFamily={mono}>mergeProjectEnvironmentForChat</text>
      </g>}

      {closeU > 0 && <g opacity={closeU}>
        <rect x={255} y={245} width={770} height={160} rx={24} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={2} />
        <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={800}>One project</text>
        <text x={640} y={360} textAnchor="middle" fill={colors.ACCENT} fontSize={25}>many environments · one journey catalog</text>
      </g>}
    </Camera>
  </>;
}

export const vizScene = () => scene;
