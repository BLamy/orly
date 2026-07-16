// The Builder's Workshop
//
// Backed by: electric-forest AGENTS.md (Builder protocol: gates in ascending
// cost — pnpm format:check && pnpm lint → typecheck → test → build; failure
// returns to the top; self-validation is free and lives in the task folder's
// work/, gitignored via .gitignore ".eforest/tasks/**/work/"; durable
// artifacts go in evidence/, committed; the claim is a Verification log
// entry), .eforest/tasks/epic-1-the-trunk/E1-T09-official-substrate-.../
// (a real task folder: readme.md + work/ + evidence/; builder entry cites
// implementation commit 9aee35c), and .eforest/loop.md (the builder's whole
// workshop is the task's own folder).
//
// ONE persistent object: the task folder. Scratch probes flicker into work/
// and evaporate (the future's /tmp); the gate gauntlet runs and bounces a
// failure back to the top; the final happy run is recorded and its artifacts
// crystallize into evidence/; the claim card lands with the commit hash.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { GauntletRail, RecordingStrip } from '../../agent';
import type { RecordingPoint } from '../../agent';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const FOLDER = { x: 90, y: 96, w: 460, h: 420 };
const WORK = { x: 116, y: 196, w: 194, h: 290 };
const EVID = { x: 330, y: 196, w: 194, h: 290 };
const RAIL = { x: 640, y: 190, w: 540 };
const TAPE = { x: 620, y: 330, w: 560, h: 26 };
const CLAIMCARD = { x: 620, y: 430, w: 560, h: 118 };

const CAM_FOLDER: CameraState = { x: 400, y: 300, k: 1.3 };
const CAM_WORK: CameraState = { x: 330, y: 330, k: 1.5 };
const CAM_RAIL: CameraState = { x: 880, y: 230, k: 1.35 };
const CAM_TAPE: CameraState = { x: 890, y: 360, k: 1.3 };
const CAM_CLAIM: CameraState = { x: 890, y: 430, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 1.0 };

/** The real gate order from AGENTS.md step 3. */
const GATES = ['format:check', 'lint', 'typecheck', 'test', 'build'];

/** Scratch probes in work/ — seeded, deterministic. */
const rand = mulberry32(7);
const PROBES = Array.from({ length: 9 }, (_, i) => ({
  x: WORK.x + 22 + rand() * (WORK.w - 60),
  y: WORK.y + 46 + rand() * (WORK.h - 90),
  w: 34 + rand() * 46,
  seed: rand(),
  i,
}));

/** Durable artifacts that land in evidence/ (E1-T09's real currency). */
const ARTIFACTS = ['event log dump', 'state digests', 'integration output'];

/** The recorded final run's points. */
const RUN_POINTS: RecordingPoint[] = [
  { at: 0.1, kind: 'interaction', label: 'setup' },
  { at: 0.28, kind: 'network' },
  { at: 0.44, kind: 'interaction', label: 'the merge' },
  { at: 0.62, kind: 'render' },
  { at: 0.8, kind: 'network', label: 'refusal path' },
  { at: 0.92, kind: 'render' },
];

/* -------------------------------------------------------------- timeline */
export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  folderU: ChannelRef<number>;
  binsU: ChannelRef<number>;
  probesU: ChannelRef<number>; // scratch probes flicker in work/
  railU: ChannelRef<number>;
  tokenU: ChannelRef<number>; // gate-units along the rail
  g0: ChannelRef<number>;
  g1: ChannelRef<number>;
  g2: ChannelRef<number>;
  g3: ChannelRef<number>;
  g4: ChannelRef<number>;
  arcU: ChannelRef<number>; // the bounce back to the top
  lap2U: ChannelRef<number>; // second, clean lap
  tapeU: ChannelRef<number>;
  recU: ChannelRef<number>;
  artU: ChannelRef<number>; // artifacts crystallize into evidence/
  claimCardU: ChannelRef<number>;
  ghostU: ChannelRef<number>; // work/ evaporates (gitignored)
  endDim: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const folderU = tl.channel('folderU', 0);
  const binsU = tl.channel('binsU', 0);
  const probesU = tl.channel('probesU', 0);
  const railU = tl.channel('railU', 0);
  const tokenU = tl.channel('tokenU', -1);
  const g0 = tl.channel('g0', 0);
  const g1 = tl.channel('g1', 0);
  const g2 = tl.channel('g2', 0);
  const g3 = tl.channel('g3', 0);
  const g4 = tl.channel('g4', 0);
  const arcU = tl.channel('arcU', 0);
  const lap2U = tl.channel('lap2U', 0);
  const tapeU = tl.channel('tapeU', 0);
  const recU = tl.channel('recU', 0);
  const artU = tl.channel('artU', 0);
  const claimCardU = tl.channel('claimCardU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const endDim = tl.channel('endDim', 0);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the task folder —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Every task in this repository owns a folder, and that folder is the whole workshop. The spec lives there, and so do two very different rooms.',
  });
  tl.tween(cam, CAM_FOLDER, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(folderU, 1, { at: 1.2, dur: 1.0, ease: ease.draw });
  tl.tween(binsU, 1, { at: 3.4, dur: 1.2, ease: ease.enter });
  tl.hold(7.5, 0.7);

  // — Beat 2 · work/ is scratch —
  tl.caption({
    at: 8.2,
    dur: 7.5,
    text: 'The first room is scratch space. The builder self-validates as much as it likes here — throwaway scripts, ad hoc runs, dead ends. None of it is evidence, and none of it is ever committed.',
  });
  tl.tween(cam, CAM_WORK, { at: 8.4, dur: 1.3, ease: ease.move });
  tl.tween(probesU, 1, { at: 9.0, dur: 5.5, ease: ease.linear });
  tl.hold(15.7, 0.6);

  // — Beat 3 · evidence/ is durable —
  tl.caption({
    at: 16.3,
    dur: 6,
    text: 'The second room is the opposite: whatever lands here is committed, permanent, and citable. Scratch is for the builder. Evidence is for everyone who comes after.',
  });
  tl.tween(cam, CAM_FOLDER, { at: 16.5, dur: 1.3, ease: ease.move });
  tl.hold(22.3, 0.6);

  // — Beat 4 · the gauntlet —
  tl.caption({
    at: 22.9,
    dur: 7,
    text: 'Before any claim, the code runs a gauntlet of gates in ascending cost: formatting, linting, type checking, tests, and the build. Cheap checks first, so failures are cheap too.',
  });
  tl.tween(cam, CAM_RAIL, { at: 23.1, dur: 1.4, ease: ease.move });
  tl.tween(railU, 1, { at: 23.8, dur: 1.6, ease: ease.draw });
  tl.set(tokenU, 0, 26.2);
  tl.tween(tokenU, 2, { at: 26.2, dur: 1.8, ease: ease.linear });
  tl.tween(g0, 1, { at: 26.6, dur: 0.4, ease: ease.pop });
  tl.tween(g1, 1, { at: 27.4, dur: 0.4, ease: ease.pop });
  tl.tween(g2, 1, { at: 28.2, dur: 0.4, ease: ease.pop });
  tl.hold(29.9, 0.4);

  // — Beat 5 · a failure returns to the top —
  tl.caption({
    at: 30.3,
    dur: 7,
    text: 'And a failure at any gate sends the work back to the very top. Not a patch applied mid pipeline — a fix never re-earns the gates it already passed.',
  });
  tl.tween(tokenU, 3, { at: 30.6, dur: 0.9, ease: ease.linear });
  tl.tween(g3, -1, { at: 31.5, dur: 0.4, ease: ease.pop });
  tl.tween(arcU, 1, { at: 32.4, dur: 1.6, ease: ease.move });
  // cool the gates for lap two
  tl.tween(g0, 0, { at: 34.2, dur: 0.5, ease: ease.move });
  tl.tween(g1, 0, { at: 34.2, dur: 0.5, ease: ease.move });
  tl.tween(g2, 0, { at: 34.2, dur: 0.5, ease: ease.move });
  tl.tween(g3, 0, { at: 34.2, dur: 0.5, ease: ease.move });
  tl.hold(36.7, 0.6);

  // — Beat 6 · the clean lap —
  tl.caption({
    at: 37.3,
    dur: 6,
    text: 'So the builder fixes the real problem and runs the whole gauntlet again, from formatting to build, until every gate goes green in one unbroken pass.',
  });
  tl.set(arcU, 0, 37.6);
  tl.set(tokenU, 0, 37.8);
  tl.tween(tokenU, 4, { at: 37.8, dur: 3.4, ease: ease.linear });
  tl.tween(lap2U, 1, { at: 37.8, dur: 3.4, ease: ease.linear });
  tl.tween(g0, 1, { at: 38.2, dur: 0.4, ease: ease.pop });
  tl.tween(g1, 1, { at: 39.0, dur: 0.4, ease: ease.pop });
  tl.tween(g2, 1, { at: 39.8, dur: 0.4, ease: ease.pop });
  tl.tween(g3, 1, { at: 40.6, dur: 0.4, ease: ease.pop });
  tl.tween(g4, 1, { at: 41.3, dur: 0.4, ease: ease.pop });
  tl.hold(43.3, 0.6);

  // — Beat 7 · record the final happy run —
  tl.caption({
    at: 43.9,
    dur: 7.5,
    text: 'Then comes the run that counts. The builder performs the same validation one last time, under recording — and makes sure every behavior the diff changes actually executes during it.',
  });
  tl.tween(cam, CAM_TAPE, { at: 44.1, dur: 1.4, ease: ease.move });
  tl.tween(tapeU, 1, { at: 44.8, dur: 1.4, ease: ease.draw });
  tl.tween(recU, 1, { at: 46.4, dur: 4.2, ease: ease.linear });
  tl.hold(51.4, 0.6);

  // — Beat 8 · artifacts crystallize —
  tl.caption({
    at: 52.0,
    dur: 6.5,
    text: 'The durable artifacts of that run — the event log, the state digests, the integration output — crystallize into the evidence room and get committed with the code.',
  });
  tl.tween(cam, CAM_WIDE, { at: 52.2, dur: 1.5, ease: ease.move });
  tl.tween(artU, 1, { at: 53.0, dur: 3.6, ease: ease.linear });
  tl.hold(58.5, 0.6);

  // — Beat 9 · the claim —
  tl.caption({
    at: 59.1,
    dur: 7,
    text: 'Finally the builder writes its claim into the task log: the exact commit, the exact commands, where the evidence lives, and one paragraph on what the recording demonstrates.',
  });
  tl.tween(cam, CAM_CLAIM, { at: 59.3, dur: 1.3, ease: ease.move });
  tl.tween(claimCardU, 1, { at: 60.0, dur: 1.0, ease: ease.enter });
  tl.hold(66.1, 0.6);

  // — Beat 10 · work/ evaporates —
  tl.caption({
    at: 66.7,
    dur: 6.5,
    text: 'And the scratch room? It evaporates — ignored by version control, the way a workbench gets swept. Only the spec, the evidence, and the claim are history. The critic is next.',
  });
  tl.tween(cam, CAM_WIDE, { at: 66.9, dur: 1.4, ease: ease.move });
  tl.tween(ghostU, 1, { at: 67.5, dur: 2.0, ease: ease.move });
  tl.tween(endDim, 1, { at: 70.6, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 71.4, dur: 0.9, ease: ease.enter });
  tl.hold(73.6, 1.2);

  return {
    tl, cam, folderU, binsU, probesU, railU, tokenU, g0, g1, g2, g3, g4,
    arcU, lap2U, tapeU, recU, artU, claimCardU, ghostU, endDim, endU,
  };
}

const scene = buildScene();

/* ---------------------------------------------------------------- render */

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const folderU = s.get(scene.folderU);
  const binsU = s.get(scene.binsU);
  const probesU = s.get(scene.probesU);
  const railU = s.get(scene.railU);
  const tokenU = s.get(scene.tokenU);
  const gates = [s.get(scene.g0), s.get(scene.g1), s.get(scene.g2), s.get(scene.g3), s.get(scene.g4)];
  const arcU = s.get(scene.arcU);
  const tapeU = s.get(scene.tapeU);
  const recU = s.get(scene.recU);
  const artU = s.get(scene.artU);
  const claimCardU = s.get(scene.claimCardU);
  const ghostU = s.get(scene.ghostU);
  const endDim = s.get(scene.endDim);
  const endU = s.get(scene.endU);

  const worldOp = 1 - 0.85 * endDim;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the task folder ---- */}
          {folderU > 0 && (
            <g opacity={folderU}>
              <path
                d={`M ${FOLDER.x} ${FOLDER.y + 18} l 0 -12 q 0 -6 6 -6 l 120 0 l 16 14 l ${FOLDER.w - 142} 0 q 6 0 6 6 l 0 ${FOLDER.h - 20} q 0 6 -6 6 l ${-FOLDER.w + 12} 0 q -6 0 -6 -6 Z`}
                fill={colors.PANEL}
                stroke={colors.ACCENT}
                strokeWidth={1.6}
              />
              <text x={FOLDER.x + 16} y={FOLDER.y + 44} fill={colors.TEXT} fontSize={13} fontWeight={700}>
                one task, one folder
              </text>
              <text x={FOLDER.x + 16} y={FOLDER.y + 64} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                .eforest/tasks/epic-1-the-trunk/E1-T09-…/
              </text>
              <text x={FOLDER.x + 16} y={FOLDER.y + 82} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                readme.md · work/ · evidence/
              </text>
            </g>
          )}

          {/* ---- work/ (scratch, gitignored) ---- */}
          {binsU > 0 && (
            <g opacity={binsU * (1 - 0.75 * ghostU)}>
              <rect x={WORK.x} y={WORK.y} width={WORK.w} height={WORK.h} rx={12} fill="none" stroke={colors.MUTED} strokeWidth={1.6} strokeDasharray="7 6" />
              <text x={WORK.x + WORK.w / 2} y={WORK.y + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} fontWeight={700}>
                work/
              </text>
              <text x={WORK.x + WORK.w / 2} y={WORK.y + WORK.h - 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                gitignored — “the future’s /tmp”
              </text>
              {/* flickering probes: each pops in, lingers, fades */}
              {PROBES.map((p) => {
                const local = clamp01(probesU * 6 - p.i * 0.55);
                const life = local <= 0 ? 0 : Math.sin(Math.min(1, local) * Math.PI);
                if (life <= 0.01) return null;
                return (
                  <g key={p.i} opacity={life * 0.9}>
                    <rect x={p.x} y={p.y} width={p.w} height={14} rx={4} fill={colors.SECONDARY} opacity={0.35} />
                    <rect x={p.x} y={p.y} width={p.w * 0.55} height={14} rx={4} fill={colors.SECONDARY} opacity={0.5} />
                  </g>
                );
              })}
              {probesU > 0.4 && ghostU < 0.3 && (
                <text x={WORK.x + WORK.w / 2} y={WORK.y + 52} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontStyle="italic" opacity={0.85}>
                  probes, dead ends, rehearsals
                </text>
              )}
            </g>
          )}

          {/* ---- evidence/ (durable, committed) ---- */}
          {binsU > 0 && (
            <g opacity={binsU}>
              <rect x={EVID.x} y={EVID.y} width={EVID.w} height={EVID.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.8} />
              <text x={EVID.x + EVID.w / 2} y={EVID.y + 26} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO} fontWeight={700}>
                evidence/
              </text>
              <text x={EVID.x + EVID.w / 2} y={EVID.y + EVID.h - 14} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                committed — citable forever
              </text>
              {ARTIFACTS.map((a, i) => {
                const u = clamp01(artU * (ARTIFACTS.length + 1) - i);
                if (u <= 0) return null;
                const y = EVID.y + 58 + i * 44;
                return (
                  <g key={a} opacity={u} transform={`translate(0 ${(1 - u) * -16})`}>
                    <rect x={EVID.x + 16} y={y} width={EVID.w - 32} height={30} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
                    <text x={EVID.x + EVID.w / 2} y={y + 19} textAnchor="middle" fill={colors.TEXT} fontSize={11}>
                      {a}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ---- the gauntlet ---- */}
          <GauntletRail
            x={RAIL.x}
            y={RAIL.y}
            w={RAIL.w}
            gates={GATES.map((label, i) => ({ label, state: gates[i] }))}
            u={arcU > 0 && arcU < 1 ? -1 : tokenU}
            reveal={railU}
            arcU={arcU}
            arcFrom={3}
            tokenColor={colors.SECONDARY}
          />
          {railU > 0.9 && (
            <text x={RAIL.x + RAIL.w / 2} y={RAIL.y - 66} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO} opacity={railU}>
              pnpm format:check && pnpm lint → typecheck → test → build
            </text>
          )}

          {/* ---- the recorded final run ---- */}
          <RecordingStrip
            x={TAPE.x}
            y={TAPE.y}
            w={TAPE.w}
            h={TAPE.h}
            points={RUN_POINTS}
            u={recU}
            reveal={tapeU}
            title="the final happy run — recorded, in full"
          />
          {recU > 0.05 && recU < 1 && (
            <g opacity={0.9}>
              <circle cx={TAPE.x - 18} cy={TAPE.y + TAPE.h / 2} r={6} fill={colors.NEGATIVE} opacity={0.55 + 0.45 * Math.sin(recU * Math.PI * 8) ** 2} />
              <text x={TAPE.x - 30} y={TAPE.y + TAPE.h / 2 + 4} textAnchor="end" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>
                REC
              </text>
            </g>
          )}

          {/* ---- the claim card ---- */}
          {claimCardU > 0 && (
            <g opacity={claimCardU} transform={`translate(0 ${(1 - claimCardU) * 14})`}>
              <rect x={CLAIMCARD.x} y={CLAIMCARD.y} width={CLAIMCARD.w} height={CLAIMCARD.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.6} />
              <text x={CLAIMCARD.x + 18} y={CLAIMCARD.y + 26} fill={colors.SECONDARY} fontSize={12} fontFamily={MONO} fontWeight={700}>
                Verification log — builder — implemented
              </text>
              <text x={CLAIMCARD.x + 18} y={CLAIMCARD.y + 50} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                commit 9aee35c · gates rerun from the top
              </text>
              <text x={CLAIMCARD.x + 18} y={CLAIMCARD.y + 70} fill={colors.TEXT} fontSize={11.5} fontFamily={MONO}>
                evidence: event log + digests + integration output
              </text>
              <text x={CLAIMCARD.x + 18} y={CLAIMCARD.y + 90} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                Replay: N/A (protocol/CLI only) + mitigation named
              </text>
            </g>
          )}
        </g>

        {/* ---- closing panel ---- */}
        {endU > 0 && (
          <g opacity={endU}>
            <rect x={340} y={260} width={600} height={120} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={640} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={700}>
              diff + claim + recorded evidence
            </text>
            <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              submitted — and now somebody gets to attack it
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
