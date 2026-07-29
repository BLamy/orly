// Training T-Rex — chapter 2: One Shuffle, 128 Readers.
//
// Grounded in sft_training/tools/prepare_sft_indexmap.py and
// sft_training/scripts/launch_sft_deepseek4_flash_8n16_910c.sh.
// The helper resolves sample count, repeats document ids, shuffles with a
// NumPy RandomState seed, atomically replaces a temporary file, writes a
// .ready marker, and lets waiting nodes proceed only after valid_index passes.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const IDS = [7, 2, 9, 1, 4, 0, 8, 3, 6, 5, 4, 1, 7, 9, 2, 0, 6, 8, 5, 3];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const readersU = tl.channel('readersU', 0);
  const raceU = tl.channel('raceU', 0);
  const builderU = tl.channel('builderU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const shuffleU = tl.channel('shuffleU', 0);
  const tempU = tl.channel('tempU', 0);
  const replaceU = tl.channel('replaceU', 0);
  const readyU = tl.channel('readyU', 0);
  const releaseU = tl.channel('releaseU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.6, text: 'Packed supervised training needs a shuffle index. Without coordination, every node can race to build the same file.' });
  tl.tween(readersU, 1, { at: 0.9, dur: 1.4, ease: ease.enter });
  tl.tween(raceU, 1, { at: 2.0, dur: 2.8, ease: ease.linear });
  tl.hold(6.1, 0.5);

  tl.caption({ at: 6.6, dur: 5.0, text: 'T-Rex stops the race. Node zero becomes the only builder; every other node becomes a reader that waits.' });
  tl.tween(builderU, 1, { at: 7.1, dur: 1.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 360, k: 1.12 }, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.hold(11.6, 0.5);

  tl.caption({ at: 12.1, dur: 5.2, text: 'The required length is not guessed. It is training iterations multiplied by global batch size.' });
  tl.tween(formulaU, 1, { at: 12.7, dur: 0.8, ease: ease.enter });
  tl.hold(17.3, 0.5);

  tl.caption({ at: 17.8, dur: 5.2, text: 'Document identifiers repeat until the tape contains at least that many samples.' });
  tl.tween(tapeU, 1, { at: 18.4, dur: 2.0, ease: ease.draw });
  tl.hold(23.0, 0.5);

  tl.caption({ at: 23.5, dur: 5.2, text: 'Then a seeded random generator shuffles each pass. Seed twelve thirty-four makes the order reproducible.' });
  tl.tween(shuffleU, 1, { at: 24.1, dur: 2.1, ease: ease.move });
  tl.hold(28.7, 0.5);

  tl.caption({ at: 29.2, dur: 5.0, text: 'The builder writes a private temporary array file first, away from the readers.' });
  tl.tween(tempU, 1, { at: 29.8, dur: 1.0, ease: ease.enter });
  tl.hold(34.2, 0.5);

  tl.caption({ at: 34.7, dur: 5.0, text: 'Only when the array is complete does an atomic replace move it into the final index-map path.' });
  tl.tween(replaceU, 1, { at: 35.3, dur: 1.4, ease: ease.move });
  tl.hold(39.7, 0.5);

  tl.caption({ at: 40.2, dur: 4.8, text: 'A ready marker lands beside it. The marker is a signal, not proof by itself.' });
  tl.tween(readyU, 1, { at: 40.8, dur: 0.7, ease: ease.pop });
  tl.hold(45.0, 0.5);

  tl.caption({ at: 45.5, dur: 5.8, text: 'Waiting nodes require both the marker and a valid array with enough samples. Then all readers cross together.' });
  tl.tween(releaseU, 1, { at: 46.2, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 47.0, dur: 1.4, ease: ease.move });
  tl.hold(51.3, 0.5);

  tl.caption({ at: 51.8, dur: 6.2, text: 'One deterministic shuffle, one atomic handoff, one hundred twenty-eight consistent readers. Coordination turns a race into a rendezvous.' });
  tl.tween(dimU, 1, { at: 52.4, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 53.3, dur: 0.8, ease: ease.enter });
  tl.hold(58.0, 1.0);

  return { tl, cam, readersU, raceU, builderU, formulaU, tapeU, shuffleU, tempU, replaceU, readyU, releaseU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const readersU = s.get(scene.readersU);
  const raceU = s.get(scene.raceU);
  const builderU = s.get(scene.builderU);
  const tapeU = s.get(scene.tapeU);
  const shuffleU = s.get(scene.shuffleU);
  const releaseU = s.get(scene.releaseU);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const tapeY = 330;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={76} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>The packed-index rendezvous</text>
          <text x={640} y={101} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>prepare_sft_indexmap.py</text>

          {Array.from({ length: 16 }, (_, i) => {
            const u = clamp01(readersU * 6 - i / 3);
            const angle = (i / 16) * Math.PI * 2;
            const baseX = 640 + Math.cos(angle) * 420;
            const baseY = 205 + Math.sin(angle) * 82;
            const targetX = 640 + (i - 7.5) * 42;
            const targetY = 535;
            const x = baseX + (targetX - baseX) * releaseU;
            const y = baseY + (targetY - baseY) * releaseU;
            const waiting = builderU > 0 && i !== 0;
            return (
              <g key={i} opacity={u} transform={`translate(${x} ${y})`}>
                <circle r={i === 0 && builderU > 0 ? 17 : 11} fill={i === 0 && builderU > 0 ? colors.ACCENT : colors.SECONDARY} opacity={0.22 + 0.38 * u} stroke={i === 0 ? colors.ACCENT : colors.SECONDARY} />
                <text y={4} textAnchor="middle" fill={colors.TEXT} fontSize={8.5} fontFamily={MONO}>{i}</text>
                {waiting && <text y={29} textAnchor="middle" fill={colors.MUTED} fontSize={8}>wait</text>}
                {raceU > 0 && builderU < 0.2 && (
                  <line x1={0} y1={10} x2={(640 - baseX) * raceU * 0.45} y2={(tapeY - baseY) * raceU * 0.45} stroke={colors.NEGATIVE} strokeDasharray="3 5" opacity={0.45} />
                )}
              </g>
            );
          })}

          {builderU > 0 && (
            <g opacity={builderU}>
              <path d="M 1060 205 C 1040 255 980 276 900 298" fill="none" stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="5 6" />
              <text x={1060} y={183} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontWeight={700}>node 0 builds</text>
            </g>
          )}

          {s.get(scene.formulaU) > 0 && (
            <g opacity={s.get(scene.formulaU)}>
              <rect x={370} y={132} width={540} height={54} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={164} textAnchor="middle" fill={colors.WARM} fontSize={16} fontFamily={MONO}>num_samples = train_iters × global_batch_size</text>
            </g>
          )}

          {tapeU > 0 && (
            <g>
              <rect x={175} y={tapeY - 16} width={930 * tapeU} height={72} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              {IDS.map((id, i) => {
                const order = shuffleU > 0.5 ? IDS[(i * 7 + 3) % IDS.length] : id;
                const u = clamp01(tapeU * IDS.length - i);
                return (
                  <g key={i} opacity={u} transform={`translate(${195 + i * 44} ${tapeY})`}>
                    <rect width={36} height={36} rx={7} fill={i % 2 ? colors.ACCENT : colors.SECONDARY} opacity={0.18} stroke={i % 2 ? colors.ACCENT : colors.SECONDARY} />
                    <text x={18} y={23} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{order}</text>
                  </g>
                );
              })}
              <text x={640} y={tapeY + 82} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                train_indexmap_*_1234s_shuffle_decoder_packed_idx.npy
              </text>
            </g>
          )}

          {s.get(scene.tempU) > 0 && (
            <g opacity={s.get(scene.tempU)} transform={`translate(${260 + 300 * s.get(scene.replaceU)} 440)`}>
              <rect width={330} height={42} rx={9} fill={colors.WARM} opacity={0.16} stroke={colors.WARM} />
              <text x={165} y={26} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>.tmp.&lt;pid&gt;.npy</text>
            </g>
          )}
          {s.get(scene.replaceU) > 0 && (
            <g opacity={s.get(scene.replaceU)} transform="translate(690 440)">
              <rect width={330} height={42} rx={9} fill={colors.POSITIVE} opacity={0.16} stroke={colors.POSITIVE} />
              <text x={165} y={26} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>os.replace → final index</text>
            </g>
          )}
          {s.get(scene.readyU) > 0 && (
            <g opacity={s.get(scene.readyU)} transform="translate(820 493)">
              <rect width={200} height={38} rx={19} fill={colors.POSITIVE} opacity={0.2} stroke={colors.POSITIVE} />
              <text x={100} y={24} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>.npy.ready ✓</text>
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={250} y={250} width={780} height={166} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={640} y={311} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={700}>One shuffle. Every node agrees.</text>
          <text x={640} y={351} textAnchor="middle" fill={colors.MUTED} fontSize={16}>temporary write → atomic replace → ready marker → validity check</text>
          <text x={640} y={386} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>wait_until_ready(path, min_samples, timeout)</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
