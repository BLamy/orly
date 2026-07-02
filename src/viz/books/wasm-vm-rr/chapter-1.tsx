// Book scene — wasm-vm-rr, chapter 1: "A Claim Needs a Recording".
// One coherent stage across 5 beats: the subject (a RISC-V emulator in Rust,
// compiled to wasm, booting Alpine riscv64 in a browser tab) anchors the left;
// a green cargo-test run gets stamped as a CLAIM in the middle; record-test.sh
// freezes the run into a sealed rr trace along the bottom; the right side
// splits the evidence into GUEST and HOST layers, then closes on the preflight
// gate: /bin/true recorded and replayed before rr is trusted at all.
import { Timeline, colors, ease } from '../../core';
import type { SceneState } from '../../core';
import { Connection, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ————— layout at module scope — 1280×720 stage, bottom ~12% clear —————

// left column — the subject: browser tab ▸ wasm VM ▸ guest
const TAB = { x: 44, y: 56, w: 400, h: 330 };
const VM = { x: 244, y: 152 };
const GUEST = { x: 84, y: 230, w: 320, h: 132 };
const BOOT = { x: 104, y: 262, w: 280, h: 84 };
const CRATES = ['core', 'wasm', 'cli'];
const CRATE_Y = 414;
const CRATE_XS = [144, 244, 344];

// middle column — the worker's claim
const TEST = { x: 490, y: 72, w: 330, h: 142 };
const TEST_LINES: { text: string; ok?: boolean }[] = [
  { text: '$ cargo test -p vm-core' },
  { text: 'test hart_step ... ok', ok: true },
  { text: 'test result: ok.', ok: true },
];
const STAMP = { x: 655, y: 140 };

// bottom band — record-test.sh freezing the run
const CMD_CHIP = { x: 370, y: 545, text: 'record-test.sh -p vm-core hart_step' };
const chipW = (t: string) => t.length * 6.9 + 22;
const PIPE_Y = 602;
const PIPE_ITEMS = ['cargo test --no-run', 'rr record', 'rr-traces/hart_step', 'rr pack'];
const PIPE_GAP = 30;
const PIPE_X0 = 100;
const PIPE_XS = PIPE_ITEMS.reduce<number[]>((xs, t, i) => {
  const left = i === 0 ? PIPE_X0 : xs[i - 1] + chipW(PIPE_ITEMS[i - 1]) / 2 + PIPE_GAP;
  xs.push(left + chipW(t) / 2);
  return xs;
}, []);
const SEAL_IDX = 2; // rr-traces/hart_step — the trace dir that gets sealed

// right column — the two evidence layers
const EVID = { x: 850, y: 56, w: 390, h: 320 };
const GBOX = { x: 862, y: 92, w: 366, h: 128 };
const HBOX = { x: 862, y: 232, w: 366, h: 132 };
const G_TICKS = 28;

// right column — the preflight gate
const PRE = { x: 850, y: 396, w: 390, h: 224 };
const LOOP = { cx: 990, cy: 528, rx: 90, ry: 46 };
const MAC = { startX: 1195, hitX: LOOP.cx + LOOP.rx + 28, y: 545 };

// ————— timeline —————

export function buildScene() {
  const tl = new Timeline();

  const tabU = tl.channel('tabU', 0);
  const vmU = tl.channel('vmU', 0);
  const guestU = tl.channel('guestU', 0);
  const bootU = tl.channel('bootU', 0);
  const crateU = tl.channel('crateU', 0);

  const testU = tl.channel('testU', 0);
  const checkU = tl.channel('checkU', 0);
  const stampU = tl.channel('stampU', 0);
  const noteU = tl.channel('noteU', 0);

  const cmdU = tl.channel('cmdU', 0);
  const pipeU = tl.channel('pipeU', 0);
  const sealU = tl.channel('sealU', 0);

  const panelU = tl.channel('panelU', 0);
  const guestLU = tl.channel('guestLU', 0);
  const gBadgeU = tl.channel('gBadgeU', 0);
  const hostLU = tl.channel('hostLU', 0);
  const hBadgeU = tl.channel('hBadgeU', 0);

  const preU = tl.channel('preU', 0);
  const loopDrawU = tl.channel('loopDrawU', 0);
  const loopU = tl.channel('loopU', 0);
  const okU = tl.channel('okU', 0);
  const macU = tl.channel('macU', 0);
  const macXU = tl.channel('macXU', 0);

  // BEAT 0 — the subject: an RV64 emulator in Rust → wasm, real Linux in a tab
  tl.caption({ at: 0.4, dur: 4.5, text: 'A RISC-V emulator in Rust, compiled to wasm — real Linux booting in a browser tab.' });
  tl.tween(tabU, 1, { at: 0.5, dur: 1.2, ease: ease.draw });
  tl.tween(vmU, 1, { at: 1.6, dur: 0.7, ease: ease.enter });
  tl.tween(guestU, 1, { at: 2.4, dur: 1.0, ease: ease.draw });
  tl.tween(bootU, 1, { at: 3.4, dur: 1.4, ease: ease.linear });
  tl.tween(crateU, 1, { at: 5.0, dur: 1.2, ease: ease.linear });
  tl.hold(6.4, 3.0);

  // BEAT 1 — the worker's claim: cargo test, green
  tl.caption({ at: 9.4, dur: 4.5, text: 'cargo test is green — but a satisfied worker is a claim, not evidence.' });
  tl.tween(testU, 1, { at: 9.6, dur: 0.6, ease: ease.enter });
  tl.tween(checkU, 1, { at: 10.2, dur: 1.8, ease: ease.linear });
  tl.tween(stampU, 1, { at: 12.6, dur: 0.5, ease: ease.pop });
  tl.tween(noteU, 1, { at: 13.6, dur: 0.6, ease: ease.enter });
  tl.hold(14.4, 3.0);

  // BEAT 2 — record-test.sh freezes the run into a sealed trace
  tl.caption({ at: 17.4, dur: 4.5, text: 'record-test.sh freezes the run: one thread, one test binary, into rr-traces/<name>.' });
  tl.tween(cmdU, 1, { at: 17.6, dur: 0.6, ease: ease.enter });
  tl.tween(pipeU, 1, { at: 18.6, dur: 2.8, ease: ease.linear });
  tl.tween(sealU, 1, { at: 22.0, dur: 0.8, ease: ease.pop });
  tl.hold(23.0, 4.4);

  // BEAT 3 — two evidence layers: guest everywhere, host on Linux + PMU
  tl.caption({ at: 27.4, dur: 4.5, text: 'Two evidence layers: guest instructions everywhere; the host process on Linux + PMU.' });
  tl.tween(panelU, 1, { at: 27.6, dur: 0.7, ease: ease.enter });
  tl.tween(guestLU, 1, { at: 28.6, dur: 1.6, ease: ease.linear });
  tl.tween(gBadgeU, 1, { at: 30.4, dur: 0.5, ease: ease.pop });
  tl.tween(hostLU, 1, { at: 31.2, dur: 1.6, ease: ease.linear });
  tl.tween(hBadgeU, 1, { at: 33.0, dur: 0.5, ease: ease.pop });
  tl.hold(33.7, 3.7);

  // BEAT 4 — the preflight gate: prove rr works before trusting it
  tl.caption({ at: 37.4, dur: 4.5, text: 'preflight.sh proves rr first: /bin/true recorded and replayed, or hard fail.' });
  tl.tween(preU, 1, { at: 37.6, dur: 0.7, ease: ease.enter });
  tl.tween(loopDrawU, 1, { at: 38.5, dur: 1.2, ease: ease.draw });
  tl.tween(loopU, 1, { at: 39.8, dur: 2.6, ease: ease.linear });
  tl.tween(okU, 1, { at: 42.6, dur: 0.5, ease: ease.pop });
  tl.tween(macU, 1, { at: 43.4, dur: 1.0, ease: ease.move });
  tl.tween(macXU, 1, { at: 44.2, dur: 0.5, ease: ease.pop });
  tl.hold(45.0, 1.8);

  return {
    tl,
    tabU,
    vmU,
    guestU,
    bootU,
    crateU,
    testU,
    checkU,
    stampU,
    noteU,
    cmdU,
    pipeU,
    sealU,
    panelU,
    guestLU,
    gBadgeU,
    hostLU,
    hBadgeU,
    preU,
    loopDrawU,
    loopU,
    okU,
    macU,
    macXU,
  };
}

const scene = buildScene();

// ————— local subcomponents (pure) —————

/** Small pill chip, mono text. */
function Chip({ x, y, text, u, color, fill = colors.PANEL }: { x: number; y: number; text: string; u: number; color: string; fill?: string }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = chipW(text);
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * -6})`} opacity={uu}>
      <rect x={-w / 2} y={-12} width={w} height={24} rx={12} fill={fill} stroke={color} strokeWidth={1.4} />
      <text y={4} textAnchor="middle" fill={color} fontSize={11.5} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** A terminal-ish mono card; lines stagger in from one channel; `ok` lines get a green check. */
function MonoCard({
  x,
  y,
  w,
  h,
  title,
  lines,
  enter,
  lineU,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: { text: string; ok?: boolean }[];
  enter: number;
  lineU: number;
}) {
  const e = clamp01(enter);
  if (e <= 0) return null;
  const n = lines.length;
  return (
    <g transform={`translate(${x}, ${y + (1 - e) * 12})`} opacity={e}>
      <rect width={w} height={h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      <text x={14} y={22} fill={colors.MUTED} fontSize={12}>
        {title}
      </text>
      {lines.map((line, i) => {
        const lu = clamp01(clamp01(lineU) * n - i);
        if (lu <= 0) return null;
        const color = line.ok ? colors.POSITIVE : colors.TEXT;
        return (
          <text key={i} x={16} y={46 + i * 24} fill={color} fontSize={13.5} fontFamily={mono} opacity={lu}>
            {line.ok ? '✓ ' : ''}
            {line.text}
          </text>
        );
      })}
    </g>
  );
}

/** The rubber stamp — pops in over the test card, slightly rotated. */
function Stamp({ x, y, text, u }: { x: number; y: number; text: string; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const sc = 1 + (1 - uu) * 0.9;
  return (
    <g transform={`translate(${x}, ${y}) rotate(-12) scale(${sc})`} opacity={uu * 0.95}>
      <rect x={-72} y={-24} width={144} height={48} rx={6} fill="none" stroke={colors.WARM} strokeWidth={3} />
      <text y={9} textAnchor="middle" fill={colors.WARM} fontSize={26} fontWeight={800} letterSpacing={4} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

/** One pipeline arrow between chips. */
function PipeArrow({ x1, x2, y, u }: { x1: number; x2: number; y: number; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu} stroke={colors.MUTED} strokeWidth={1.5} fill="none">
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <path d={`M ${x2 - 5} ${y - 4} L ${x2} ${y} L ${x2 - 5} ${y + 4}`} />
    </g>
  );
}

// ————— render (pure function of SceneState) —————

export function Render({ s }: { s: SceneState }) {
  const guestL = clamp01(s.get(scene.guestLU));
  const hostL = clamp01(s.get(scene.hostLU));
  const pipe = clamp01(s.get(scene.pipeU));
  const seal = clamp01(s.get(scene.sealU));
  const panel = clamp01(s.get(scene.panelU));
  const pre = clamp01(s.get(scene.preU));
  const loopDraw = clamp01(s.get(scene.loopDrawU));
  const loop = clamp01(s.get(scene.loopU));
  const mac = clamp01(s.get(scene.macU));

  // preflight loop packet — clockwise from the top, pure function of loopU
  const theta = 2 * Math.PI * loop;
  const px = LOOP.cx + LOOP.rx * Math.sin(theta);
  const py = LOOP.cy - LOOP.ry * Math.cos(theta);

  // macOS chip approaches the gate, then recoils — closed form of one channel
  const bounce = mac < 0.6 ? mac / 0.6 : 1 - 0.28 * ((mac - 0.6) / 0.4);
  const macX = MAC.startX + (MAC.hitX - MAC.startX) * bounce;

  // pipeline stagger: chip, arrow, chip, arrow… from one channel
  const pipeItemU = (i: number) => clamp01(pipe * 7 - i);

  return (
    <>
      {/* ——— the subject: browser tab ▸ wasm VM ▸ guest ——— */}
      <Zone {...TAB} label="browser tab" kind="group" u={s.get(scene.tabU)} />
      <ServiceNode {...VM} kind="fn" label="wasm-vm" sublabel="RV64 emulator" u={s.get(scene.vmU)} />
      <Connection from={{ x: VM.x, y: VM.y + 32 }} to={{ x: VM.x, y: GUEST.y }} u={s.get(scene.guestU)} dashed arrow={false} />
      <Zone {...GUEST} label="guest" kind="group" color={colors.SECONDARY} u={s.get(scene.guestU)} />
      <MonoCard
        {...BOOT}
        title="boot log"
        lines={[{ text: 'Alpine riscv64' }, { text: 'login: _' }]}
        enter={s.get(scene.guestU)}
        lineU={s.get(scene.bootU)}
      />
      {clamp01(s.get(scene.crateU)) > 0 && (
        <text x={92} y={CRATE_Y + 4} fill={colors.MUTED} fontSize={11} opacity={clamp01(s.get(scene.crateU))}>
          crates
        </text>
      )}
      {CRATES.map((c, i) => (
        <Chip key={c} x={CRATE_XS[i]} y={CRATE_Y} text={c} u={clamp01(clamp01(s.get(scene.crateU)) * 3 - i)} color={colors.ACCENT} />
      ))}

      {/* ——— the claim: cargo test, green, stamped ——— */}
      <MonoCard {...TEST} title="the worker's run" lines={TEST_LINES} enter={s.get(scene.testU)} lineU={s.get(scene.checkU)} />
      <Stamp {...STAMP} text="CLAIM" u={s.get(scene.stampU)} />
      {clamp01(s.get(scene.noteU)) > 0 && (
        <text x={TEST.x + TEST.w / 2} y={TEST.y + TEST.h + 26} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={clamp01(s.get(scene.noteU))}>
          satisfied ≠ evidence
        </text>
      )}

      {/* ——— record-test.sh: build → record → trace dir → pack ——— */}
      <Chip {...CMD_CHIP} u={s.get(scene.cmdU)} color={colors.TEAL} />
      {clamp01(s.get(scene.cmdU)) > 0 && (
        <text x={CMD_CHIP.x + chipW(CMD_CHIP.text) / 2 + 12} y={CMD_CHIP.y + 4} fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={clamp01(s.get(scene.cmdU))}>
          forces --test-threads=1
        </text>
      )}
      {PIPE_ITEMS.map((t, i) => {
        const isSeal = i === SEAL_IDX;
        const u = pipeItemU(i * 2);
        return (
          <g key={t}>
            {isSeal && seal > 0 && (
              <ellipse cx={PIPE_XS[i]} cy={PIPE_Y} rx={chipW(t) / 2 + 8} ry={20} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.7 * seal} />
            )}
            <Chip x={PIPE_XS[i]} y={PIPE_Y} text={t} u={u} color={isSeal && seal > 0.5 ? colors.POSITIVE : colors.MUTED} />
            {/* the trace dir crystallizes: a tiny padlock seals it */}
            {isSeal && seal > 0 && (
              <g transform={`translate(${PIPE_XS[i] + chipW(t) / 2 - 4}, ${PIPE_Y - 18})`} opacity={seal}>
                <rect x={-5} y={-1} width={10} height={8} rx={1.5} fill={colors.POSITIVE} />
                <path d="M -3 -1 v -3 a 3 3 0 0 1 6 0 v 3" fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
              </g>
            )}
            {i < PIPE_ITEMS.length - 1 && (
              <PipeArrow x1={PIPE_XS[i] + chipW(t) / 2 + 4} x2={PIPE_XS[i + 1] - chipW(PIPE_ITEMS[i + 1]) / 2 - 4} y={PIPE_Y} u={pipeItemU(i * 2 + 1)} />
            )}
          </g>
        );
      })}

      {/* ——— two evidence layers ——— */}
      {panel > 0 && (
        <g transform={`translate(0, ${(1 - panel) * 14})`} opacity={panel}>
          <rect {...EVID} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={EVID.x + 16} y={EVID.y + 26} fill={colors.MUTED} fontSize={13}>
            evidence layers
          </text>

          {/* GUEST — every retired instruction, runs everywhere */}
          <rect {...GBOX} rx={8} fill="none" stroke={colors.ACCENT} strokeWidth={1.2} strokeOpacity={0.5} />
          <text x={GBOX.x + 12} y={GBOX.y + 20} fill={colors.ACCENT} fontSize={12} fontWeight={700} fontFamily={mono}>
            GUEST
          </text>
          <text x={GBOX.x + 66} y={GBOX.y + 20} fill={colors.MUTED} fontSize={11}>
            every retired instruction
          </text>
          {Array.from({ length: G_TICKS }, (_, i) => {
            const tu = clamp01(guestL * G_TICKS - i);
            if (tu <= 0) return null;
            const digest = i % 7 === 6;
            const tx = GBOX.x + 16 + i * ((GBOX.w - 32) / (G_TICKS - 1));
            return (
              <line
                key={i}
                x1={tx}
                y1={GBOX.y + (digest ? 38 : 42)}
                x2={tx}
                y2={GBOX.y + (digest ? 62 : 58)}
                stroke={digest ? colors.WARM : colors.ACCENT}
                strokeWidth={digest ? 2.2 : 1.4}
                opacity={tu * (digest ? 1 : 0.75)}
              />
            );
          })}
          <text x={GBOX.x + 12} y={GBOX.y + 84} fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={guestL}>
            state digests · diff vs Spike / QEMU
          </text>
          <Chip x={GBOX.x + GBOX.w - 78} y={GBOX.y + 106} text="runs everywhere" u={s.get(scene.gBadgeU)} color={colors.POSITIVE} />

          {/* HOST — rr records the whole Rust process */}
          <rect {...HBOX} rx={8} fill="none" stroke={colors.SECONDARY} strokeWidth={1.2} strokeOpacity={0.5} />
          <text x={HBOX.x + 12} y={HBOX.y + 20} fill={colors.SECONDARY} fontSize={12} fontWeight={700} fontFamily={mono}>
            HOST
          </text>
          <text x={HBOX.x + 58} y={HBOX.y + 20} fill={colors.MUTED} fontSize={11}>
            rr records the whole Rust process
          </text>
          {['threads', 'syscalls', 'memory'].map((lane, i) => {
            const lu = clamp01(hostL * 3 - i);
            if (lu <= 0) return null;
            const ly = HBOX.y + 44 + i * 24;
            const x0 = HBOX.x + 82;
            const x1 = HBOX.x + HBOX.w - 20;
            return (
              <g key={lane} opacity={lu}>
                <text x={HBOX.x + 12} y={ly + 4} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
                  {lane}
                </text>
                <line x1={x0} y1={ly} x2={x0 + (x1 - x0) * lu} y2={ly} stroke={colors.SECONDARY} strokeWidth={1.4} opacity={0.6} />
                {Array.from({ length: 5 }, (_, j) => {
                  const dx = x0 + ((j + 0.5 + i * 0.3) / 5) * (x1 - x0);
                  return dx <= x0 + (x1 - x0) * lu ? <circle key={j} cx={dx} cy={ly} r={2.4} fill={colors.SECONDARY} /> : null;
                })}
              </g>
            );
          })}
          {hostL > 0.9 && (
            <g opacity={clamp01((hostL - 0.9) * 10)}>
              <path d={`M ${HBOX.x + 130} ${HBOX.y + 118} h -36 m 0 0 l 6 -4 m -6 4 l 6 4`} stroke={colors.WARM} strokeWidth={1.5} fill="none" />
              <text x={HBOX.x + 138} y={HBOX.y + 122} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
                reverse execution
              </text>
            </g>
          )}
          <Chip x={HBOX.x + HBOX.w - 82} y={HBOX.y + 22} text="Linux + PMU only" u={s.get(scene.hBadgeU)} color={colors.WARM} />
        </g>
      )}

      {/* ——— the preflight gate ——— */}
      {pre > 0 && (
        <g transform={`translate(0, ${(1 - pre) * 14})`} opacity={pre}>
          <rect {...PRE} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={PRE.x + 16} y={PRE.y + 26} fill={colors.MUTED} fontSize={13} fontFamily={mono}>
            tools/rr/preflight.sh
          </text>
          <ellipse
            cx={LOOP.cx}
            cy={LOOP.cy}
            rx={LOOP.rx}
            ry={LOOP.ry}
            fill="none"
            stroke={colors.TEAL}
            strokeWidth={1.5}
            pathLength={1}
            strokeDasharray={`${loopDraw} 1`}
            opacity={0.7}
          />
          <text x={LOOP.cx} y={LOOP.cy - LOOP.ry - 10} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={loopDraw}>
            rr record →
          </text>
          <text x={LOOP.cx} y={LOOP.cy + LOOP.ry + 20} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono} opacity={loopDraw}>
            ← rr replay
          </text>
          <Chip x={LOOP.cx} y={LOOP.cy} text="/bin/true" u={pre} color={colors.TEXT} />
          {loop > 0.001 && loop < 0.999 && <circle cx={px} cy={py} r={5} fill={colors.TEAL} />}
          <Chip x={1148} y={PRE.y + 34} text="✓ round-trip replayed" u={s.get(scene.okU)} color={colors.POSITIVE} />
          {/* macOS bounces off the gate */}
          <Chip x={macX} y={MAC.y} text="macOS / no PMU" u={clamp01(mac * 3)} color={colors.MUTED} />
          {clamp01(s.get(scene.macXU)) > 0 && (
            <text x={macX} y={MAC.y + 32} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700} fontFamily={mono} opacity={clamp01(s.get(scene.macXU))}>
              ✗ hard fail
            </text>
          )}
        </g>
      )}
    </>
  );
}

// registry adapter — books embed this via step.viz { scene: 'books/wasm-vm-rr/chapter-1', beat: i }
export const vizScene = () => scene;
