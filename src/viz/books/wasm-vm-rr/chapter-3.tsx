// wasm-vm-rr · Chapter 3 — "Two Streams in Lockstep"
// The guest VM emits one canonical TraceRecord line per retired instruction;
// Spike (--log-commits) is the reference, normalized by normalize_spike.py
// into the exact same shape. run_diff.sh byte-compares the two streams in
// lockstep until the FIRST divergent line; report.py frames last-20 matching
// + the divergent pair + a 5-line lookahead. `make diff-selftest` corrupts
// one line via sed and asserts the harness catches exactly it. Finally the
// heavy compare collapses: Snapshot{pc, xregs[32], mem_digest} — all of RAM
// SHA-256'd — proves native and wasm builds identical with one equality.
import { MathLabel, Timeline, colors, ease, mulberry32 } from '../../core';
import type { SceneState } from '../../core';
import { Connection, MatrixGrid, NodeBadge, ServiceNode, Vec } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ── the canonical trace: TraceRecord{pc, insn, rd, mem} rendered as
//    `core 0: 0x{pc} (0x{insn}) x{rd} 0x{val} mem 0x{addr}` ─────────────────
const hex = (v: number, w: number) => (v >>> 0).toString(16).padStart(w, '0');

interface Rec { pc: string; insn: string; rd: string; val: string; mem?: string }
const fmt = (r: Rec) =>
  `core 0: 0x${r.pc} (0x${r.insn}) x${r.rd} 0x${r.val}${r.mem ? ` mem 0x${r.mem}` : ''}`;

const N_LINES = 30;
const RECS: Rec[] = [];
{
  let pc = 0x800000e4 >>> 0;
  for (let i = 0; i < N_LINES; i++) {
    RECS.push({
      pc: hex(pc, 8),
      insn: hex(((0x00a58533 ^ (i * 0x9e3779b1)) | 0x33) >>> 0, 8),
      rd: String(((i * 7) % 31) + 1),
      val: hex((0x42 + i * 0x0d1b2a3c) >>> 0, 8),
      mem: i % 4 === 1 ? hex((0x80002000 + i * 8) >>> 0, 8) : undefined,
    });
    pc = (pc + (i % 5 === 3 ? 8 : 4)) >>> 0;
  }
}
const LINES = RECS.map(fmt);
const DIV = 22; // first divergent instruction (no mem suffix → tail is the val)
const SPIKE_LINES = LINES.map((l, i) => (i === DIV ? l.slice(0, -4) + 'beef' : l));

// ── layout, 1280×720 stage (bottom ~12%, y ≳ 633, kept clear) ───────────────
const LANE_FS = 11;
const CHW = LANE_FS * 0.602;
const LINE_H = 25;
const VP_TOP = 232; // lane viewport (clipped)
const VP_BOT = 584;
const AX = 245; // column A (vm) text left edge
const BX = 675; // column B (spike, normalized) text left edge
const COL_W = 61 * CHW + 8; // widest line ≈ 61 chars
const ACX = AX + COL_W / 2;
const BCX = BX + COL_W / 2;
const DIV_SLOT = 6; // the divergent pair freezes at this viewport row…
const Y_DIV = VP_TOP + DIV_SLOT * LINE_H; // …= 382
const SCROLL_END = DIV - DIV_SLOT; // lines scrolled past when it lands

const VM = { x: ACX, y: 118 };
const SPIKE = { x: BCX, y: 96 };
const FUNNEL = { x: BCX, y: 170 };

// magnified line (beat 0): line 1 (it has a mem access) split into fields
const MAG_FS = 13.5;
const MCH = MAG_FS * 0.602;
const MAG_SEGS = (() => {
  const r = RECS[1];
  const segs = [
    { text: 'core 0: ', color: colors.MUTED, label: '' },
    { text: `0x${r.pc}`, color: colors.ACCENT, label: 'pc' },
    { text: ' ', color: colors.MUTED, label: '' },
    { text: `(0x${r.insn})`, color: colors.SECONDARY, label: 'insn' },
    { text: ' ', color: colors.MUTED, label: '' },
    { text: `x${r.rd}`, color: colors.WARM, label: 'rd' },
    { text: ' ', color: colors.MUTED, label: '' },
    { text: `0x${r.val}`, color: colors.TEXT, label: 'val' },
    { text: ` mem 0x${r.mem}`, color: colors.TEAL, label: 'mem' },
  ];
  let c = 0;
  return segs.map((sg) => {
    const at = c;
    c += sg.text.length;
    return { ...sg, x: at * MCH, w: sg.text.length * MCH };
  });
})();
const MAG_W = MAG_SEGS[MAG_SEGS.length - 1].x + MAG_SEGS[MAG_SEGS.length - 1].w;
const MAG_X = BCX - MAG_W / 2; // over the (still empty) right half
const MAG_Y = 380;
const MAG_LABELED = MAG_SEGS.filter((sg) => sg.label !== '');

// selftest (beat 3): a copied slice of the lane; sed flips ONE hex digit
const SELF = LINES.slice(8, 14);
const SELF_K = 3; // the corrupted row
const SELF_FS = 12;
const SCHW = SELF_FS * 0.602;
const SELF_X = 300;
const SELF_Y0 = 268;
const SELF_ROW_H = 32;
const FLIP_IDX = SELF[SELF_K].length - 3; // a hex digit inside the val
const FLIP_FROM = SELF[SELF_K][FLIP_IDX];
const FLIP_TO = FLIP_FROM === '7' ? 'b' : '7';
const FLIP_CX = SELF_X + (FLIP_IDX + 0.5) * SCHW;
const FLIP_CY = SELF_Y0 + SELF_K * SELF_ROW_H;

// digest (beat 4): guest RAM heatmap → SHA-256 → one mem_digest per build
const RAM_ROWS = 8;
const RAM_COLS = 14;
const RAM_CELL = 20;
const RAM_GAP = 3;
const RAM_X = 180;
const RAM_Y = 196;
const RAM_W = RAM_COLS * (RAM_CELL + RAM_GAP) - RAM_GAP;
const RAM_H = RAM_ROWS * (RAM_CELL + RAM_GAP) - RAM_GAP;
const RAM_VALUES: number[][] = (() => {
  const rand = mulberry32(0x5a17);
  return Array.from({ length: RAM_ROWS }, () =>
    Array.from({ length: RAM_COLS }, () => 0.15 + 0.8 * rand()),
  );
})();
const DIGEST = '3fa9…7d2c';
const HASH = { x: 760, y: RAM_Y + RAM_H / 2 }; // the SHA-256 chip
const NATIVE = { x: 430, y: 492 };
const WASM = { x: 850, y: 492 };
const CHIP_Y = 554;
const CHIP_MEET = 82; // half-gap when the two digest chips meet at center

// ── timeline ─────────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();
  const titleU = tl.channel('titleU', 0);
  const vmU = tl.channel('vmU', 0);
  const connAU = tl.channel('connAU', 0);
  const flowA = tl.channel('flowA', 0);
  const emitP = tl.channel('emitP', 0); // vm lines land on the strip
  const magU = tl.channel('magU', 0); // magnified line panel
  const magLblP = tl.channel('magLblP', 0); // field underlines + labels
  const spikeU = tl.channel('spikeU', 0);
  const funnelU = tl.channel('funnelU', 0);
  const connBU = tl.channel('connBU', 0);
  const flowB = tl.channel('flowB', 0);
  const emitBP = tl.channel('emitBP', 0); // normalized lines fill column B
  const lanesFullU = tl.channel('lanesFullU', 0); // rows beyond the first 8
  const compareOn = tl.channel('compareOn', 0); // lockstep tint gate
  const scrollL = tl.channel('scrollL', 0); // scroll offset, in LINES
  const divU = tl.channel('divU', 0); // NEGATIVE flare on the divergent pair
  const reportU = tl.channel('reportU', 0); // report.py frame
  const regionP = tl.channel('regionP', 0); // last-20 / pair / lookahead labels
  const phaseAOut = tl.channel('phaseAOut', 0);
  const selfU = tl.channel('selfU', 0); // selftest group
  const selfRowsP = tl.channel('selfRowsP', 0);
  const sedU = tl.channel('sedU', 0); // the sed chip descends
  const flipU = tl.channel('flipU', 0); // one hex digit flips
  const flagU = tl.channel('flagU', 0); // the harness flags THAT line
  const exactU = tl.channel('exactU', 0); // ✓ caught exactly one
  const selfOut = tl.channel('selfOut', 0);
  const ramU = tl.channel('ramU', 0); // RAM heatmap fill
  const funnelCU = tl.channel('funnelCU', 0); // grid → hash funnel
  const hashU = tl.channel('hashU', 0); // mem_digest chip
  const snapU = tl.channel('snapU', 0); // Snapshot{…} caption line
  const buildsU = tl.channel('buildsU', 0); // native + wasm nodes
  const chipsU = tl.channel('chipsU', 0); // per-build digest chips
  const slideU = tl.channel('slideU', 0); // the chips slide together
  const eqU = tl.channel('eqU', 0); // POSITIVE equals

  // BEAT 0 — every retired instruction → one canonical line
  tl.caption({ at: 0.4, dur: 5.2, text: 'Every retired instruction becomes one canonical trace line.' });
  tl.tween(titleU, 1, { at: 0.5, dur: 0.6, ease: ease.enter });
  tl.tween(vmU, 1, { at: 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(connAU, 1, { at: 1.6, dur: 0.9, ease: ease.draw });
  tl.tween(flowA, 10, { at: 1.8, dur: 30, ease: ease.linear });
  tl.tween(emitP, 1, { at: 1.9, dur: 2.6, ease: ease.move });
  tl.tween(magU, 1, { at: 4.8, dur: 0.8, ease: ease.enter });
  tl.tween(magLblP, 1, { at: 5.8, dur: 1.2, ease: ease.draw });

  // BEAT 1 — Spike is the reference; normalize_spike.py reshapes its log
  tl.caption({ at: 10.0, dur: 5.0, text: 'Spike is the reference — its log normalized into the exact same shape.' });
  tl.tween(magU, 0, { at: 10.1, dur: 0.6, ease: ease.enter });
  tl.tween(spikeU, 1, { at: 10.6, dur: 0.7, ease: ease.enter });
  tl.tween(funnelU, 1, { at: 11.3, dur: 0.7, ease: ease.enter });
  tl.tween(connBU, 1, { at: 12.0, dur: 1.0, ease: ease.draw });
  tl.tween(flowB, 8, { at: 12.2, dur: 24, ease: ease.linear });
  tl.tween(emitBP, 1, { at: 12.4, dur: 2.4, ease: ease.move });
  tl.hold(16.0, 1.0);

  // BEAT 2 — byte-for-byte lockstep, until the first divergent line
  tl.caption({ at: 19.0, dur: 5.4, text: 'Byte-for-byte lockstep, until the first divergent line lights up.' });
  tl.tween(lanesFullU, 1, { at: 19.2, dur: 0.8, ease: ease.enter });
  tl.tween(compareOn, 1, { at: 19.4, dur: 0.8, ease: ease.enter });
  tl.tween(scrollL, SCROLL_END, { at: 20.4, dur: 5.6, ease: ease.linear }); // …then it freezes
  tl.tween(divU, 1, { at: 26.0, dur: 0.5, ease: ease.pop });
  tl.tween(reportU, 1, { at: 27.2, dur: 1.4, ease: ease.draw });
  tl.tween(regionP, 1, { at: 28.6, dur: 1.2, ease: ease.move });
  tl.hold(30.4, 1.0);

  // BEAT 3 — make diff-selftest: corrupt one line, catch exactly it
  tl.caption({ at: 33.0, dur: 5.2, text: 'The selftest corrupts one line on purpose — the diff must catch exactly it.' });
  tl.tween(phaseAOut, 1, { at: 33.1, dur: 0.8, ease: ease.move });
  tl.tween(selfU, 1, { at: 34.0, dur: 0.7, ease: ease.enter });
  tl.tween(selfRowsP, 1, { at: 34.4, dur: 1.4, ease: ease.move });
  tl.tween(sedU, 1, { at: 36.2, dur: 0.8, ease: ease.enter });
  tl.tween(flipU, 1, { at: 37.4, dur: 0.5, ease: ease.pop });
  tl.tween(flagU, 1, { at: 38.4, dur: 0.6, ease: ease.enter });
  tl.tween(exactU, 1, { at: 39.6, dur: 0.6, ease: ease.pop });
  tl.hold(40.6, 1.0);

  // BEAT 4 — the heavy compare, collapsed to one SHA-256 equality
  tl.caption({ at: 43.0, dur: 5.6, text: 'All of RAM digests to one SHA-256; native and wasm match in a single compare.' });
  tl.tween(selfOut, 1, { at: 43.1, dur: 0.7, ease: ease.move });
  tl.tween(ramU, 1, { at: 43.9, dur: 2.0, ease: ease.move });
  tl.tween(funnelCU, 1, { at: 46.0, dur: 1.1, ease: ease.draw });
  tl.tween(hashU, 1, { at: 47.0, dur: 0.6, ease: ease.enter });
  tl.tween(snapU, 1, { at: 47.7, dur: 0.6, ease: ease.enter });
  tl.tween(buildsU, 1, { at: 48.6, dur: 0.9, ease: ease.enter });
  tl.tween(chipsU, 1, { at: 49.7, dur: 0.6, ease: ease.enter });
  tl.tween(slideU, 1, { at: 50.7, dur: 1.1, ease: ease.move });
  tl.tween(eqU, 1, { at: 51.9, dur: 0.5, ease: ease.pop });
  tl.hold(52.6, 1.6);

  return {
    tl, titleU, vmU, connAU, flowA, emitP, magU, magLblP, spikeU, funnelU,
    connBU, flowB, emitBP, lanesFullU, compareOn, scrollL, divU, reportU,
    regionP, phaseAOut, selfU, selfRowsP, sedU, flipU, flagU, exactU, selfOut,
    ramU, funnelCU, hashU, snapU, buildsU, chipsU, slideU, eqU,
  };
}

const scene = buildScene();

// ── local subcomponents ──────────────────────────────────────────────────────

/** Small mono pill. */
function MonoChip({
  x, y, label, color, u = 1, fs = 13,
}: { x: number; y: number; label: string; color: string; u?: number; fs?: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const w = label.length * fs * 0.62 + 26;
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.85 + 0.15 * uu})`} opacity={uu}>
      <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text y={4.5} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono}>
        {label}
      </text>
    </g>
  );
}

/** A right-side region bracket for the report frame. */
function RegionBracket({
  y0, y1, label, color, u,
}: { y0: number; y1: number; label: string; color: string; u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const x = BX + COL_W + 14;
  const mid = (y0 + y1) / 2;
  const h = ((y1 - y0) / 2) * uu;
  return (
    <g opacity={uu}>
      <path
        d={`M ${x + 6} ${mid - h} L ${x} ${mid - h} L ${x} ${mid + h} L ${x + 6} ${mid + h}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
      />
      <text x={x + 12} y={mid + 4} fill={color} fontSize={11}>
        {label}
      </text>
    </g>
  );
}

/** One lane row (clipped by the viewport); pure function of its inputs. */
function LaneRow({
  x, y, text, u, tint, div, divU,
}: { x: number; y: number; text: string; u: number; tint: number; div: boolean; divU: number }) {
  if (u <= 0) return null;
  const d = div ? clamp01(divU) : 0;
  const color = d > 0.01 ? colors.NEGATIVE : tint > 0.01 ? colors.POSITIVE : colors.TEXT;
  const op = u * (d > 0.01 ? 1 : tint > 0.01 ? 0.42 + 0.2 * (1 - tint) : 0.8);
  return (
    <g>
      {d > 0 && (
        <rect x={x - 6} y={y - LINE_H / 2 + 1} width={COL_W + 4} height={LINE_H - 2} rx={5} fill={colors.NEGATIVE} opacity={0.16 * d} />
      )}
      <text x={x} y={y + 4} fill={color} fontSize={LANE_FS} fontFamily={mono} opacity={op} fontWeight={d > 0.5 ? 700 : 400}>
        {text}
      </text>
    </g>
  );
}

// ── render (pure function of the sampled state) ──────────────────────────────
export function Render({ s }: { s: SceneState }) {
  const phaseA = 1 - clamp01(s.get(scene.phaseAOut));
  const selfIn = clamp01(s.get(scene.selfU)) * (1 - clamp01(s.get(scene.selfOut)));
  const emitP = s.get(scene.emitP);
  const emitBP = s.get(scene.emitBP);
  const lanesFull = s.get(scene.lanesFullU);
  const compareOn = s.get(scene.compareOn);
  const scroll = s.get(scene.scrollL);
  const divU = s.get(scene.divU);
  const reportU = s.get(scene.reportU);
  const regionP = s.get(scene.regionP);
  const magU = s.get(scene.magU);
  const magLblP = s.get(scene.magLblP);
  const headIdx = DIV_SLOT + scroll; // the compare head rides the freeze slot

  // per-row: entrance gate + lockstep tint (rows already compared go POSITIVE)
  const rowU = (i: number, firstP: number) => (i < 8 ? clamp01(firstP * 8 - i) : clamp01(lanesFull));
  const rowTint = (i: number) => (i < DIV ? clamp01(headIdx - i) * compareOn : 0);
  const rowY = (i: number) => VP_TOP + (i - scroll) * LINE_H + LINE_H / 2;
  const visible = (y: number) => y > VP_TOP - LINE_H && y < VP_BOT + LINE_H;

  const sedU = s.get(scene.sedU);
  const flipU = s.get(scene.flipU);
  const flagU = s.get(scene.flagU);
  const selfRowsP = s.get(scene.selfRowsP);

  const ramU = s.get(scene.ramU);
  const funnelCU = s.get(scene.funnelCU);
  const hashU = s.get(scene.hashU);
  const buildsU = s.get(scene.buildsU);
  const chipsU = s.get(scene.chipsU);
  const slideU = s.get(scene.slideU);
  const eqU = s.get(scene.eqU);
  const nChipX = lerp(NATIVE.x, 640 - CHIP_MEET, slideU);
  const wChipX = lerp(WASM.x, 640 + CHIP_MEET, slideU);

  return (
    <>
      <defs>
        <clipPath id="wvmrr3-lanes">
          <rect x={AX - 14} y={VP_TOP - LINE_H / 2} width={BX + COL_W - AX + 24} height={VP_BOT - VP_TOP + LINE_H} />
        </clipPath>
      </defs>

      {/* ═══ phase A — the two trace streams ═══ */}
      {phaseA > 0 && (
        <g opacity={phaseA}>
          <text x={640} y={52} textAnchor="middle" fill={colors.TEXT} fontSize={23} opacity={s.get(scene.titleU)}>
            Two streams in lockstep
          </text>

          {/* sources */}
          <ServiceNode {...VM} kind="server" label="wasm-vm" sublabel="retired insns" w={180} h={52} u={s.get(scene.vmU)} glow={0.35 * clamp01(emitP * 4) * (1 - clamp01(magU))} />
          <Connection from={{ x: VM.x, y: VM.y + 27 }} to={{ x: VM.x, y: VP_TOP - 16 }} u={s.get(scene.connAU)} flow={s.get(scene.flowA)} color={colors.ACCENT} arrow />
          <ServiceNode {...SPIKE} kind="external" label="spike" sublabel="--log-commits" w={190} h={48} u={s.get(scene.spikeU)} />
          <Connection from={{ x: SPIKE.x, y: SPIKE.y + 25 }} to={{ x: FUNNEL.x, y: FUNNEL.y - 19 }} u={s.get(scene.connBU)} flow={s.get(scene.flowB)} color={colors.SECONDARY} />
          <NodeBadge {...FUNNEL} w={222} h={36} label="normalize_spike.py" color={colors.SECONDARY} u={s.get(scene.funnelU)} labelSize={13} />
          <Connection from={{ x: FUNNEL.x, y: FUNNEL.y + 19 }} to={{ x: FUNNEL.x, y: VP_TOP - 16 }} u={s.get(scene.connBU)} flow={s.get(scene.flowB)} color={colors.SECONDARY} arrow />

          {/* column headers */}
          <text x={AX} y={VP_TOP - 22} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={s.get(scene.vmU)}>
            vm.trace — one line per TraceRecord
          </text>
          <text x={BX} y={VP_TOP - 22} fill={colors.MUTED} fontSize={11.5} fontFamily={mono} opacity={s.get(scene.funnelU)}>
            spike.trace (normalized)
          </text>

          {/* the two lanes, clipped and scrolled in lockstep */}
          <g clipPath="url(#wvmrr3-lanes)">
            {LINES.map((l, i) => {
              const y = rowY(i);
              if (!visible(y)) return null;
              return (
                <LaneRow key={`a${i}`} x={AX} y={y} text={l} u={rowU(i, emitP)} tint={rowTint(i)} div={i === DIV} divU={divU} />
              );
            })}
            {SPIKE_LINES.map((l, i) => {
              const y = rowY(i);
              if (!visible(y)) return null;
              return (
                <LaneRow key={`b${i}`} x={BX} y={y} text={l} u={rowU(i, emitBP)} tint={rowTint(i)} div={i === DIV} divU={divU} />
              );
            })}
          </g>

          {/* ≠ between the divergent pair */}
          {divU > 0 && (
            <text x={(AX + COL_W + BX) / 2} y={Y_DIV + LINE_H / 2 + 5} textAnchor="middle" fill={colors.NEGATIVE} fontSize={19} fontWeight={700} opacity={divU}>
              ≠
            </text>
          )}

          {/* magnified line with its fields labeled (beat 0) */}
          {magU > 0 && (
            <g opacity={magU} transform={`translate(${MAG_X}, ${MAG_Y + (1 - magU) * 14})`}>
              <rect x={-18} y={-34} width={MAG_W + 36} height={96} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
              {MAG_SEGS.map((sg, k) => (
                <text key={k} x={sg.x} y={0} fill={sg.color} fontSize={MAG_FS} fontFamily={mono}>
                  {sg.text}
                </text>
              ))}
              {MAG_LABELED.map((sg, k) => {
                const lu = clamp01(magLblP * MAG_LABELED.length - k * 0.7);
                if (lu <= 0) return null;
                return (
                  <g key={k} opacity={lu}>
                    <line x1={sg.x + 1} y1={10} x2={sg.x + 1 + (sg.w - 2) * lu} y2={10} stroke={sg.color} strokeWidth={2} />
                    <line x1={sg.x + sg.w / 2} y1={10} x2={sg.x + sg.w / 2} y2={22} stroke={sg.color} strokeWidth={1} opacity={0.7} />
                    <text x={sg.x + sg.w / 2} y={38} textAnchor="middle" fill={sg.color} fontSize={12.5} fontFamily={mono}>
                      {sg.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* the report.py frame around the divergence */}
          {reportU > 0 && (
            <g opacity={reportU}>
              <rect x={AX - 16} y={VP_TOP - 10} width={BX + COL_W - AX + 28} height={DIV_SLOT * LINE_H + 6 * LINE_H + 18} rx={10} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="7 5" />
              <MonoChip x={AX + 52} y={VP_TOP - 10} label="report.py" color={colors.MUTED} u={reportU} fs={11.5} />
              <RegionBracket y0={VP_TOP - 2} y1={Y_DIV - 3} label="last 20 matching" color={colors.POSITIVE} u={clamp01(regionP * 3)} />
              <RegionBracket y0={Y_DIV - 1} y1={Y_DIV + LINE_H - 1} label="first divergent pair" color={colors.NEGATIVE} u={clamp01(regionP * 3 - 1)} />
              <RegionBracket y0={Y_DIV + LINE_H + 1} y1={Y_DIV + 6 * LINE_H} label="+5-line lookahead" color={colors.WARM} u={clamp01(regionP * 3 - 2)} />
            </g>
          )}
        </g>
      )}

      {/* ═══ phase B — make diff-selftest ═══ */}
      {selfIn > 0 && (
        <g opacity={selfIn}>
          <MonoChip x={640} y={120} label="make diff-selftest" color={colors.WARM} u={selfIn} fs={15} />
          <text x={640} y={158} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={selfIn}>
            trust the harness first: break the trace yourself, watch the diff catch it
          </text>

          <text x={SELF_X} y={SELF_Y0 - 26} fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
            vm.trace (copy)
          </text>
          {SELF.map((l, i) => {
            const u = clamp01(selfRowsP * SELF.length - i * 0.8);
            if (u <= 0) return null;
            const y = SELF_Y0 + i * SELF_ROW_H;
            const isK = i === SELF_K;
            const flag = isK ? clamp01(flagU) : 0;
            return (
              <g key={i} opacity={u}>
                {flag > 0 && (
                  <rect x={SELF_X - 8} y={y - 14} width={SELF[SELF_K].length * SCHW + 16} height={28} rx={6} fill={colors.NEGATIVE} opacity={0.15 * flag} />
                )}
                {isK ? (
                  <text x={SELF_X} y={y + 4} fontSize={SELF_FS} fontFamily={mono} fill={flag > 0.01 ? colors.NEGATIVE : colors.TEXT} opacity={0.85}>
                    <tspan>{l.slice(0, FLIP_IDX)}</tspan>
                    <tspan fill={flipU > 0.5 ? colors.NEGATIVE : colors.TEXT} fontWeight={flipU > 0.5 ? 700 : 400}>
                      {flipU > 0.5 ? FLIP_TO : FLIP_FROM}
                    </tspan>
                    <tspan>{l.slice(FLIP_IDX + 1)}</tspan>
                  </text>
                ) : (
                  <text x={SELF_X} y={y + 4} fontSize={SELF_FS} fontFamily={mono} fill={colors.TEXT} opacity={0.75}>
                    {l}
                  </text>
                )}
                {/* the harness flags precisely this line */}
                {flag > 0 && (
                  <path d={`M ${SELF_X - 30} ${y - 7} l 12 7 l -12 7 z`} fill={colors.NEGATIVE} opacity={flag} />
                )}
              </g>
            );
          })}

          {/* the sed chip descends onto ONE hex digit */}
          {sedU > 0 && (
            <g opacity={sedU}>
              <MonoChip x={990} y={lerp(180, 236, sedU)} label={`sed: '${FLIP_FROM}' → '${FLIP_TO}'`} color={colors.WARM} u={sedU} fs={13} />
              <Vec x1={950} y1={256} x2={FLIP_CX + 10} y2={FLIP_CY - 10} grow={sedU} color={colors.WARM} width={1.5} head={7} />
            </g>
          )}
          {flipU > 0 && (
            <circle cx={FLIP_CX} cy={FLIP_CY} r={9 + 7 * flipU} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.8 * flipU * (1 - 0.6 * clamp01(flagU))} />
          )}
          {flagU > 0 && (
            <text x={SELF_X} y={SELF_Y0 + SELF.length * SELF_ROW_H + 16} fill={colors.NEGATIVE} fontSize={13} fontFamily={mono} opacity={flagU}>
              ✗ first divergence: line {8 + SELF_K + 1} — and only line {8 + SELF_K + 1}
            </text>
          )}

          {/* the verdict: it failed correctly */}
          {s.get(scene.exactU) > 0 && (
            <g transform={`translate(990, 420) scale(${0.88 + 0.12 * s.get(scene.exactU)})`} opacity={s.get(scene.exactU)}>
              <rect x={-140} y={-32} width={280} height={64} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text y={-4} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontWeight={700}>
                ✓ caught exactly one
              </text>
              <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                a verifier you have watched fail correctly
              </text>
            </g>
          )}
        </g>
      )}

      {/* ═══ phase C — the heavy compare, collapsed to one digest ═══ */}
      {ramU > 0 && (
        <g>
          <text x={640} y={64} textAnchor="middle" fill={colors.TEXT} fontSize={21} opacity={clamp01(ramU * 2)}>
            The heavy compare, collapsed
          </text>
          <text x={RAM_X} y={RAM_Y - 14} fill={colors.MUTED} fontSize={12} fontFamily={mono} opacity={clamp01(ramU * 2)}>
            guest RAM — every byte
          </text>
          <MatrixGrid
            x={RAM_X}
            y={RAM_Y}
            values={RAM_VALUES}
            cell={RAM_CELL}
            gap={RAM_GAP}
            cellU={(i, j) => clamp01(ramU * (RAM_ROWS * RAM_COLS + 10) - (i * RAM_COLS + j))}
            opacity={0.95}
          />

          {/* the funnel: all of it converges into one hash */}
          {funnelCU > 0 && (
            <g opacity={clamp01(funnelCU * 2)}>
              {[RAM_Y + 12, RAM_Y + RAM_H / 2, RAM_Y + RAM_H - 12].map((fy, k) => (
                <line
                  key={k}
                  x1={RAM_X + RAM_W + 10}
                  y1={fy}
                  x2={lerp(RAM_X + RAM_W + 10, HASH.x - 96, clamp01(funnelCU * 1.3 - k * 0.15))}
                  y2={lerp(fy, HASH.y, clamp01(funnelCU * 1.3 - k * 0.15))}
                  stroke={colors.ACCENT}
                  strokeWidth={1.5}
                  opacity={0.65}
                />
              ))}
            </g>
          )}
          {hashU > 0 && (
            <g opacity={hashU}>
              <MonoChip x={HASH.x + 40} y={HASH.y} label={`mem_digest: ${DIGEST}`} color={colors.ACCENT} u={hashU} fs={14} />
              <text x={HASH.x + 40} y={HASH.y - 28} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={mono}>
                SHA-256 over all of RAM
              </text>
            </g>
          )}
          <MathLabel
            tex="\texttt{Snapshot\{ pc, xregs[32], mem\_digest \}}"
            x={RAM_X}
            y={RAM_Y + RAM_H + 34}
            fontSize={16}
            color={colors.MUTED}
            opacity={s.get(scene.snapU)}
          />

          {/* two builds, one digest each */}
          <ServiceNode {...NATIVE} kind="server" label="native" sublabel="same program" w={170} h={52} u={buildsU} />
          <ServiceNode {...WASM} kind="fn" label="wasm" sublabel="same program" w={170} h={52} u={clamp01(buildsU * 1.4 - 0.4)} />
          {chipsU > 0 && (
            <g>
              <line x1={NATIVE.x} y1={NATIVE.y + 27} x2={nChipX} y2={CHIP_Y - 16} stroke={colors.GRID} strokeWidth={1.5} opacity={chipsU * (1 - 0.5 * slideU)} />
              <line x1={WASM.x} y1={WASM.y + 27} x2={wChipX} y2={CHIP_Y - 16} stroke={colors.GRID} strokeWidth={1.5} opacity={chipsU * (1 - 0.5 * slideU)} />
              <MonoChip x={nChipX} y={CHIP_Y} label={DIGEST} color={eqU > 0.01 ? colors.POSITIVE : colors.ACCENT} u={chipsU} fs={13} />
              <MonoChip x={wChipX} y={CHIP_Y} label={DIGEST} color={eqU > 0.01 ? colors.POSITIVE : colors.ACCENT} u={chipsU} fs={13} />
            </g>
          )}
          {eqU > 0 && (
            <g opacity={eqU}>
              <text x={640} y={CHIP_Y + 7} textAnchor="middle" fill={colors.POSITIVE} fontSize={24} fontWeight={700} transform={`translate(0 ${(1 - eqU) * 6})`}>
                =
              </text>
              <circle cx={640} cy={CHIP_Y} r={18 + 10 * eqU} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} opacity={0.5 * eqU} />
              <text x={640} y={CHIP_Y + 46} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={eqU}>
                native ≡ wasm — proven with a single equality
              </text>
            </g>
          )}
        </g>
      )}
    </>
  );
}

/** Module-scope scene; `.tl` drives the book player's beat windows. */
export const vizScene = () => scene;
