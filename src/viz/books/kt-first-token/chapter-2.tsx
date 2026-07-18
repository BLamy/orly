// kt run — the registry-driven launch vs the hand-built one.
//
// Backed by: kt-kernel/python/cli/commands/run.py (run() → _run_impl() →
// UserModelRegistry lookup → _build_sglang_command()), kt-kernel/python/cli/
// utils/model_registry.py (builtin aliases: "m2" → MiniMax-M2, "v3.2" →
// DeepSeek-V3.2, "kimi" → Kimi-K2-Thinking …), doc/en/kt-kernel/kt-cli.md
// (kt run / chat / doctor / model), and kt-kernel/README.md ("Launch SGLang
// Server" with the real --kt-* flags).
//
// ONE machine: a terminal line at the top feeds an assembly line — the alias
// drops into the registry card, the registry emits the model's facts, and the
// command builder stacks the full flag column that a manual launch would make
// you type yourself. Both roads end at the same booted server.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

const TERM = { x: 120, y: 86, w: 420, h: 46 } as const;
const REG = { x: 120, y: 196, w: 300, h: 178 } as const;
// Real aliases from kt-kernel/python/cli/utils/model_registry.py
const ALIASES = [
  ['m2', 'MiniMax-M2'],
  ['v3.2', 'DeepSeek-V3.2'],
  ['kimi', 'Kimi-K2-Thinking'],
  ['r1', 'DeepSeek-R1-0528'],
] as const;

const CMD = { x: 520, y: 196, w: 330, h: 330 } as const;
// The real flag stack (kt-kernel/README.md, Qwen3-30B-A3B AMXINT8 example).
const FLAGS = [
  'python -m sglang.launch_server',
  '--model  <model path>',
  '--kt-method  AMXINT8',
  '--kt-weight-path  <cpu weights>',
  '--kt-cpuinfer  64',
  '--kt-threadpool-count  2',
  '--kt-num-gpu-experts  32',
  '--kt-max-deferred-experts-per-token  2',
  '--chunked-prefill-size  4096',
  '--mem-fraction-static  0.92',
] as const;

const SRV = { x: 1060, y: 330 } as const;
const MANUAL = { x: 950, y: 90 } as const;

const CAM_REG: CameraState = { x: 330, y: 270, k: 1.45 };
const CAM_CMD: CameraState = { x: 685, y: 360, k: 1.35 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  termU: ChannelRef<number>;
  typeU: ChannelRef<number>;
  regU: ChannelRef<number>;
  lookU: ChannelRef<number>;
  hitU: ChannelRef<number>;
  buildU: ChannelRef<number>;
  flagsU: ChannelRef<number>;
  tuneU: ChannelRef<number>;
  manualU: ChannelRef<number>;
  srvU: ChannelRef<number>;
  bootU: ChannelRef<number>;
  toolsU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const termU = tl.channel('termU', 0); // terminal chrome
  const typeU = tl.channel('typeU', 0); // "kt run m2" typing on
  const regU = tl.channel('regU', 0); // registry card
  const lookU = tl.channel('lookU', 0); // alias packet into the registry
  const hitU = tl.channel('hitU', 0); // matched row highlight
  const buildU = tl.channel('buildU', 0); // command-builder panel
  const flagsU = tl.channel('flagsU', 0); // flags stack in
  const tuneU = tl.channel('tuneU', 0); // hardware-derived values glow
  const manualU = tl.channel('manualU', 0); // the manual road
  const srvU = tl.channel('srvU', 0); // server node
  const bootU = tl.channel('bootU', 0); // command → server packet
  const toolsU = tl.channel('toolsU', 0); // kt chat / kt doctor chips
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two words —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Booting a heterogeneous inference server sounds like a weekend project. The command line makes it two words and a nickname.',
  });
  tl.tween(termU, 1, { at: 0.7, dur: 0.8, ease: ease.enter });
  tl.tween(typeU, 1, { at: 1.8, dur: 1.6, ease: ease.linear });
  tl.hold(6.0, 0.5);

  // — Beat 2 · the registry —
  tl.caption({
    at: 6.5,
    dur: 6.5,
    text: 'That nickname is not a guess. The tool keeps a model registry — a table of known models, each with its aliases, sources, and launch defaults.',
  });
  tl.tween(cam, CAM_REG, { at: 6.7, dur: 1.4, ease: ease.move });
  tl.tween(regU, 1, { at: 7.4, dur: 1.2, ease: ease.enter });
  tl.hold(12.5, 0.5);

  // — Beat 3 · the lookup —
  tl.caption({
    at: 13.0,
    dur: 6.0,
    text: 'The alias drops in, the registry answers: em two means Minimax M two — here is its download source, and here is how it likes to be launched.',
  });
  tl.tween(lookU, 1, { at: 13.3, dur: 1.4, ease: ease.linear });
  tl.tween(hitU, 1, { at: 14.9, dur: 0.5, ease: ease.pop });
  tl.hold(18.5, 0.5);

  // — Beat 4 · the command builder —
  tl.caption({
    at: 19.0,
    dur: 6.5,
    text: 'Then a builder assembles the real launch: the same server anyone could start by hand, flag by flag, against the S G Lang runtime.',
  });
  tl.tween(cam, CAM_CMD, { at: 19.2, dur: 1.4, ease: ease.move });
  tl.tween(buildU, 1, { at: 20.0, dur: 0.9, ease: ease.enter });
  tl.tween(flagsU, 1, { at: 20.8, dur: 3.2, ease: ease.linear });
  tl.hold(25.0, 0.5);

  // — Beat 5 · the tuned values —
  tl.caption({
    at: 25.5,
    dur: 7.5,
    text: 'Notice which values it filled in for you: threads matched to your physical cores, thread pools matched to your memory domains, and how many experts fit on your card.',
  });
  tl.tween(tuneU, 1, { at: 26.3, dur: 1.0, ease: ease.move });
  tl.hold(32.5, 0.5);

  // — Beat 6 · the manual road —
  tl.caption({
    at: 33.0,
    dur: 7.0,
    text: 'There is nothing magic hiding here. Skip the tool, type that whole column yourself, and you get the identical server — the manual road and the registry road merge.',
  });
  tl.tween(cam, CAM_WIDE, { at: 33.2, dur: 1.4, ease: ease.move });
  tl.tween(manualU, 1, { at: 34.2, dur: 1.0, ease: ease.enter });
  tl.hold(39.5, 0.5);

  // — Beat 7 · boot —
  tl.caption({
    at: 40.0,
    dur: 6.0,
    text: 'Either way, the command lands and the server comes up: weights split across card and memory, listening on port thirty thousand.',
  });
  tl.tween(srvU, 1, { at: 40.4, dur: 0.8, ease: ease.enter });
  tl.tween(bootU, 1, { at: 41.2, dur: 2.0, ease: ease.linear });
  tl.hold(45.5, 0.5);

  // — Beat 8 · the sidekicks —
  tl.caption({
    at: 46.0,
    dur: 6.5,
    text: 'The same tool talks to it and checks up on it: an interactive chat for a first conversation, and a doctor command that audits your drivers, kernels, and hardware.',
  });
  tl.tween(toolsU, 1, { at: 46.6, dur: 1.2, ease: ease.enter });
  tl.hold(52.0, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 52.5,
    dur: 7.0,
    text: 'Two roads, one server. Remember the flag column, though — expert counts, deferred experts, thread pools. Each of those flags is a chapter later in this series.',
  });
  tl.tween(closeU, 1, { at: 53.3, dur: 1.3, ease: ease.move });
  tl.hold(59.0, 1.4);

  return { tl, cam, termU, typeU, regU, lookU, hitU, buildU, flagsU, tuneU, manualU, srvU, bootU, toolsU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const TYPED = 'kt run m2';

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const termU = s.get(scene.termU);
  const typeU = s.get(scene.typeU);
  const regU = s.get(scene.regU);
  const lookU = s.get(scene.lookU);
  const hitU = s.get(scene.hitU);
  const buildU = s.get(scene.buildU);
  const flagsU = s.get(scene.flagsU);
  const tuneU = s.get(scene.tuneU);
  const manualU = s.get(scene.manualU);
  const srvU = s.get(scene.srvU);
  const bootU = s.get(scene.bootU);
  const toolsU = s.get(scene.toolsU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  const typedChars = Math.round(typeU * TYPED.length);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- terminal ---- */}
          <g opacity={termU}>
            <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
            <circle cx={TERM.x + 18} cy={TERM.y + 23} r={4} fill={colors.NEGATIVE} opacity={0.7} />
            <circle cx={TERM.x + 32} cy={TERM.y + 23} r={4} fill={colors.WARM} opacity={0.7} />
            <circle cx={TERM.x + 46} cy={TERM.y + 23} r={4} fill={colors.POSITIVE} opacity={0.7} />
            <text x={TERM.x + 66} y={TERM.y + 29} fill={colors.TEXT} fontSize={15} fontFamily="ui-monospace, monospace">
              $ {TYPED.slice(0, typedChars)}
              {typeU > 0 && typeU < 1 ? '▌' : ''}
            </text>
          </g>

          {/* ---- registry card ---- */}
          <g opacity={regU}>
            <rect x={REG.x} y={REG.y} width={REG.w} height={REG.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
            <text x={REG.x + 16} y={REG.y + 24} fill={colors.SECONDARY} fontSize={12.5} fontFamily="ui-monospace, monospace">
              model_registry.py
            </text>
            {ALIASES.map(([a, m], i) => {
              const rowU = clamp01(regU * ALIASES.length - i);
              const hot = i === 0 ? hitU : 0;
              return (
                <g key={a} opacity={rowU}>
                  <rect x={REG.x + 12} y={REG.y + 38 + i * 32} width={REG.w - 24} height={26} rx={6} fill={hot > 0.3 ? colors.BG : 'none'} stroke={hot > 0.3 ? colors.WARM : colors.GRID} strokeWidth={hot > 0.3 ? 1.5 : 0.8} />
                  <text x={REG.x + 24} y={REG.y + 56 + i * 32} fill={hot > 0.3 ? colors.WARM : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    {a}
                  </text>
                  <text x={REG.x + 90} y={REG.y + 56 + i * 32} fill={colors.TEXT} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    → {m}
                  </text>
                </g>
              );
            })}
          </g>
          {/* alias packet terminal → registry */}
          {lookU > 0 && lookU < 1 && (
            <RequestFlow
              path={[
                { x: TERM.x + 200, y: TERM.y + TERM.h },
                { x: REG.x + REG.w / 2, y: REG.y },
              ]}
              u={lookU}
              color={colors.WARM}
              r={7}
              label="m2"
            />
          )}

          {/* ---- command builder ---- */}
          <g opacity={buildU}>
            <rect x={CMD.x} y={CMD.y} width={CMD.w} height={CMD.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={CMD.x + 16} y={CMD.y + 24} fill={colors.ACCENT} fontSize={12.5} fontFamily="ui-monospace, monospace">
              _build_sglang_command()
            </text>
            {FLAGS.map((f, i) => {
              const u = clamp01(flagsU * FLAGS.length - i);
              const tuned = i >= 4 && i <= 6; // cpuinfer / threadpool / gpu-experts
              return (
                <text
                  key={f}
                  x={CMD.x + 20 + (i > 0 ? 14 : 0)}
                  y={CMD.y + 52 + i * 27}
                  fill={tuned && tuneU > 0.3 ? colors.WARM : i === 0 ? colors.TEXT : colors.MUTED}
                  fontSize={11}
                  fontFamily="ui-monospace, monospace"
                  opacity={u}
                >
                  {f}
                  {tuned && tuneU > 0.3 ? '   ← yours' : ''}
                </text>
              );
            })}
          </g>
          <Connection from={{ x: REG.x + REG.w, y: REG.y + 60 }} to={{ x: CMD.x, y: CMD.y + 60 }} u={buildU} color={colors.GRID} arrow width={1.3} />

          {/* ---- the manual road ---- */}
          <g opacity={manualU}>
            <rect x={MANUAL.x - 110} y={MANUAL.y - 24} width={220} height={48} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={MANUAL.x} y={MANUAL.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
              the manual road
            </text>
            <text x={MANUAL.x} y={MANUAL.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="ui-monospace, monospace">
              you type every flag yourself
            </text>
            <Connection from={{ x: MANUAL.x, y: MANUAL.y + 24 }} to={{ x: CMD.x + CMD.w - 40, y: CMD.y }} u={manualU} color={colors.GRID} dashed arrow width={1.2} />
          </g>

          {/* ---- the server ---- */}
          <ServiceNode x={SRV.x} y={SRV.y} kind="server" label="SGLang-KT server" sublabel=":30000 · /v1" w={170} u={srvU} glow={bootU >= 1 ? 0.5 : 0} />
          {bootU > 0 && bootU < 1 && (
            <RequestFlow
              path={[
                { x: CMD.x + CMD.w, y: CMD.y + 140 },
                { x: SRV.x - 85, y: SRV.y },
              ]}
              u={bootU}
              color={colors.ACCENT}
              r={7}
              label="launch"
            />
          )}

          {/* ---- kt chat / kt doctor ---- */}
          <g opacity={toolsU}>
            {[
              ['kt chat', 'talk to it'],
              ['kt doctor', 'audit the box'],
            ].map(([cmd, sub], i) => (
              <g key={cmd}>
                <rect x={SRV.x - 85 + i * 10} y={SRV.y + 64 + i * 44} width={160} height={36} rx={9} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
                <text x={SRV.x - 75 + i * 10} y={SRV.y + 79 + i * 44} fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {cmd}
                </text>
                <text x={SRV.x - 75 + i * 10} y={SRV.y + 94 + i * 44} fill={colors.MUTED} fontSize={10}>
                  {sub}
                </text>
              </g>
            ))}
          </g>
        </g>

        {/* ---- close ---- */}
        <g opacity={closeU}>
          <rect x={330} y={228} width={620} height={204} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={274} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            two roads, one server
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            kt run resolves an alias, tunes the flags to your box, launches
          </text>
          <text x={640} y={334} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            the manual road types the same flags by hand
          </text>
          <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            kt run m2 · python -m sglang.launch_server --kt-method … --kt-num-gpu-experts …
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
