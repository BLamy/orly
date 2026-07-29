// A Million Tokens Deep — chapter 4: Keep the Agent's World Alive.
//
// Grounded in MoonshotAI/Kimi-K3 k3_tech_report.pdf §§5.3–5.4 and Figure 12.
// Long-context RL uses partial rollouts, an external CPU DRAM KV-cache pool,
// auto-throttling, and AgentENV microVMs with checkpoint/resume/fork/snapshot.
// Hybrid KDA/MLA prefix caching restores both cache types at a shared boundary;
// the report's example resumes at token 2560 inside a 6144-token physical block.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const BLOCKS = Array.from({ length: 12 }, (_, i) => i);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('tapeU', 0);
  const partialU = tl.channel('partialU', 0);
  const gpuU = tl.channel('gpuU', 0);
  const poolU = tl.channel('poolU', 0);
  const transferU = tl.channel('transferU', 0);
  const alignedU = tl.channel('alignedU', 0);
  const throttleU = tl.channel('throttleU', 0);
  const sandboxU = tl.channel('sandboxU', 0);
  const pauseU = tl.channel('pauseU', 0);
  const forkU = tl.channel('forkU', 0);
  const prefixU = tl.channel('prefixU', 0);
  const restoreU = tl.channel('restoreU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.9, text: 'An agentic reinforcement-learning trajectory can grow toward one million tokens, with tool results and environment state attached.' });
  tl.tween(tapeU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 340, k: 1.02 }, { at: 1.1, dur: 1.3, ease: ease.move });
  tl.hold(6.4, 0.5);

  tl.caption({ at: 6.9, dur: 5.8, text: 'Partial rollouts stop unfinished trajectories between iterations, so replaying a lost prefix would be painfully expensive.' });
  tl.tween(partialU, 1, { at: 7.4, dur: 1.1, ease: ease.enter });
  tl.hold(12.7, 0.5);

  tl.caption({ at: 13.2, dur: 6.0, text: 'Active decoding blocks stay on the graphics processor. Reusable idle prefixes write back to an external pool in ordinary memory.' });
  tl.tween(gpuU, 1, { at: 13.7, dur: 0.8, ease: ease.enter });
  tl.tween(poolU, 1, { at: 14.2, dur: 0.8, ease: ease.enter });
  tl.tween(transferU, 1, { at: 15.0, dur: 2.0, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 365, k: 1.02 }, { at: 15.2, dur: 1.3, ease: ease.move });
  tl.hold(19.2, 0.5);

  tl.caption({ at: 19.7, dur: 5.9, text: 'The recurrent delta state moves with its matching global-attention cache blocks, keeping both halves of the hybrid prefix aligned.' });
  tl.tween(alignedU, 1, { at: 20.2, dur: 1.3, ease: ease.move });
  tl.hold(25.6, 0.5);

  tl.caption({ at: 26.1, dur: 5.8, text: 'As contexts grow, a scheduler watches queued work and cache pressure, then lowers concurrency before the system overloads.' });
  tl.tween(throttleU, 1, { at: 26.6, dur: 1.5, ease: ease.move });
  tl.hold(31.9, 0.5);

  tl.caption({ at: 32.4, dur: 5.9, text: 'The environment must persist too. Agent E N V runs each task in an isolated micro virtual machine and checkpoints only dirtied pages.' });
  tl.tween(sandboxU, 1, { at: 32.9, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 365, k: 1.03 }, { at: 33.2, dur: 1.3, ease: ease.move });
  tl.hold(38.3, 0.5);

  tl.caption({ at: 38.8, dur: 5.8, text: 'Checkpoint takes as little as one hundred thirty-three milliseconds; resume takes forty-nine milliseconds.' });
  tl.tween(pauseU, 1, { at: 39.3, dur: 0.8, ease: ease.pop });
  tl.hold(44.6, 0.5);

  tl.caption({ at: 45.1, dur: 6.0, text: 'Pause frees resources while inference runs. Fork makes a judging branch without changing the original. Snapshot provides recovery.' });
  tl.tween(forkU, 1, { at: 45.6, dur: 1.7, ease: ease.move });
  tl.hold(51.1, 0.5);

  tl.caption({ at: 51.6, dur: 6.1, text: 'Fine-grained hash blocks locate a reusable prefix, while sparse delta-state checkpoints mark the boundaries that can actually resume.' });
  tl.tween(prefixU, 1, { at: 52.1, dur: 1.6, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 385, k: 1.03 }, { at: 52.4, dur: 1.3, ease: ease.move });
  tl.hold(57.7, 0.5);

  tl.caption({ at: 58.2, dur: 5.9, text: 'At token two thousand five hundred sixty, both caches restore together, and prefill resumes with no recompute before that point.' });
  tl.tween(restoreU, 1, { at: 58.7, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 60.6, dur: 1.3, ease: ease.move });
  tl.hold(64.1, 0.5);

  tl.caption({ at: 64.6, dur: 6.5, text: 'Across tokens, layers, experts, and agent time, Kimi K3 keeps the right state alive instead of rebuilding the past.' });
  tl.tween(dimU, 1, { at: 65.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 65.9, dur: 0.7, ease: ease.enter });
  tl.hold(71.1, 1.0);

  return { tl, cam, tapeU, partialU, gpuU, poolU, transferU, alignedU, throttleU, sandboxU, pauseU, forkU, prefixU, restoreU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const tapeU = s.get(scene.tapeU);
  const transferU = s.get(scene.transferU);
  const alignedU = s.get(scene.alignedU);
  const forkU = s.get(scene.forkU);
  const prefixU = s.get(scene.prefixU);
  const restoreU = s.get(scene.restoreU);
  const detailOpacity = 1 - prefixU;
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={750}>Persistent state for million-token agents</text>
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>partial rollout · external KV pool · AgentENV · KDA-aware prefix cache</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <g transform="translate(100 120)">
            {Array.from({ length: 64 }, (_, i) => {
              const u = clamp01(tapeU * 64 - i);
              const tool = i % 11 === 7;
              return <rect key={i} x={i * 16} y={0} width={12} height={tool ? 52 : 34} rx={3} fill={tool ? colors.WARM : colors.ACCENT} opacity={0.15 + 0.7 * u} />;
            })}
            <text x={0} y={76} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>trajectory prefix</text>
            <text x={1010} y={76} textAnchor="end" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>→ 1,048,576 tokens</text>
            {s.get(scene.partialU) > 0 && (
              <g opacity={s.get(scene.partialU)}>
                <line x1={700} x2={700} y1={-15} y2={64} stroke={colors.NEGATIVE} strokeWidth={3} strokeDasharray="6 5" />
                <text x={700} y={92} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>partial rollout boundary</text>
              </g>
            )}
          </g>

          {s.get(scene.gpuU) > 0 && (
            <g opacity={s.get(scene.gpuU) * detailOpacity} transform="translate(135 275)">
              <rect width={300} height={130} rx={17} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={150} y={34} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontWeight={700}>GPU KV CACHE</text>
              <text x={150} y={63} textAnchor="middle" fill={colors.MUTED} fontSize={11}>active decoding blocks</text>
              <rect x={38} y={82} width={224} height={18} rx={9} fill={colors.ACCENT} opacity={0.35} />
            </g>
          )}

          {s.get(scene.poolU) > 0 && (
            <g opacity={s.get(scene.poolU) * detailOpacity} transform="translate(135 455)">
              <rect width={300} height={120} rx={17} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
              <text x={150} y={34} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontWeight={700}>EXTERNAL KV POOL</text>
              <text x={150} y={62} textAnchor="middle" fill={colors.MUTED} fontSize={11}>CPU DRAM · write-back on eviction</text>
              <rect x={38} y={80} width={224} height={18} rx={9} fill={colors.SECONDARY} opacity={0.35} />
            </g>
          )}

          {transferU > 0 && (
            <g opacity={detailOpacity}>
              <path d="M285 405 L285 455" stroke={colors.WARM} strokeWidth={4} />
              <circle cx={285} cy={405 + 50 * transferU} r={10} fill={colors.WARM} />
              <text x={315} y={435} fill={colors.WARM} fontSize={11} fontFamily={MONO}>evict / prefetch</text>
            </g>
          )}

          {alignedU > 0 && (
            <g opacity={alignedU * detailOpacity} transform="translate(500 280)">
              <rect width={265} height={126} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <rect x={28} y={32} width={90} height={22} rx={6} fill={colors.ACCENT} opacity={0.35} />
              <rect x={145} y={32} width={90} height={22} rx={6} fill={colors.SECONDARY} opacity={0.35} />
              <text x={73} y={78} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>KDA state</text>
              <text x={190} y={78} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>MLA KV</text>
              <path d="M73 92 C100 116 165 116 190 92" fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={132} y={116} textAnchor="middle" fill={colors.POSITIVE} fontSize={10}>one lifecycle</text>
            </g>
          )}

          {s.get(scene.throttleU) > 0 && (
            <g opacity={s.get(scene.throttleU) * detailOpacity} transform="translate(500 455)">
              <rect width={265} height={120} rx={16} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={132} y={31} textAnchor="middle" fill={colors.WARM} fontSize={12} fontWeight={700}>AUTO-THROTTLING</text>
              {[0.25, 0.55, 0.82].map((v, i) => <rect key={i} x={28} y={52 + i * 20} width={205 * v} height={9} rx={4} fill={i === 2 ? colors.NEGATIVE : colors.WARM} opacity={0.65} />)}
              <text x={238} y={95} textAnchor="end" fill={colors.MUTED} fontSize={9}>KV pressure ↑</text>
            </g>
          )}

          {s.get(scene.sandboxU) > 0 && (
            <g opacity={s.get(scene.sandboxU) * detailOpacity} transform="translate(850 270)">
              <rect width={285} height={260} rx={22} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={142} y={38} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={750}>AgentENV microVM</text>
              <rect x={42} y={66} width={201} height={108} rx={13} fill={colors.BG} stroke={colors.GRID} />
              <text x={142} y={105} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>filesystem + memory</text>
              <text x={142} y={132} textAnchor="middle" fill={colors.MUTED} fontSize={11}>dirty pages only</text>
              {s.get(scene.pauseU) > 0 && (
                <g opacity={s.get(scene.pauseU)}>
                  <text x={76} y={213} textAnchor="middle" fill={colors.WARM} fontSize={11} fontWeight={700}>CHECKPOINT</text>
                  <text x={76} y={235} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>133 ms</text>
                  <text x={210} y={213} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontWeight={700}>RESUME</text>
                  <text x={210} y={235} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>49 ms</text>
                </g>
              )}
            </g>
          )}

          {forkU > 0 && (
            <g opacity={forkU * detailOpacity}>
              <path d="M1135 395 C1200 395 1200 505 1160 530" fill="none" stroke={colors.WARM} strokeWidth={3} />
              <rect x={1030} y={520} width={190} height={70} rx={13} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={1125} y={549} textAnchor="middle" fill={colors.WARM} fontSize={11} fontWeight={700}>FORK FOR JUDGING</text>
              <text x={1125} y={572} textAnchor="middle" fill={colors.MUTED} fontSize={10}>original stays running</text>
            </g>
          )}

          {prefixU > 0 && (
            <g opacity={prefixU} transform="translate(225 420)">
              <text x={400} y={-24} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700}>fine-grained hybrid prefix restore</text>
              {BLOCKS.map((b) => <rect key={b} x={b * 67} y={0} width={61} height={34} rx={5} fill={b < 5 ? colors.SECONDARY : colors.PANEL} opacity={b < 5 ? 0.55 : 0.22} stroke={colors.GRID} />)}
              {BLOCKS.map((b) => <circle key={b} cx={b * 67 + 30} cy={58} r={b === 4 ? 9 : b % 3 === 2 ? 5 : 3} fill={b === 4 ? colors.WARM : colors.MUTED} opacity={0.8} />)}
              <text x={400} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>12 × 512-token hash blocks inside one 6144-token physical block</text>
              {restoreU > 0 && (
                <g opacity={restoreU}>
                  <line x1={298} x2={298} y1={-16} y2={76} stroke={colors.WARM} strokeWidth={3} />
                  <text x={298} y={116} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>B = 2560 · restore KDA + MLA</text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={205} y={235} width={870} height={194} rx={22} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={750}>Keep the right state alive</text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={16}>tokens · layers · experts · agent environments</text>
          <text x={640} y={378} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>restore at B=2560 · zero recompute of [0, B)</text>
          <text x={640} y={407} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>A million tokens deep, without rebuilding the past</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
