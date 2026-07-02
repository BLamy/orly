// wasm-vm × rr — Chapter 2: "Time Runs Backwards"
// rr reverse execution answering "who corrupted this?": a guest register goes
// bad millions of instructions in; forward debugging overshoots forever;
// `whowrote` (watch -l + reverse-continue, tools/rr/verifier.gdb) runs time
// BACKWARDS to the writing line; `cite` mints an event number anyone can
// reopen with `rr replay -g <event>`. 5 beats ↔ 5 non-cover storyboard steps.
import { Timeline, colors, ease, mulberry32 } from '../../core';
import type { SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ── layout (1280×720 stage; bottom ~12% — y ≳ 633 — stays clear) ──────────
const N_REGS = 16; // x0..x15 register-file column, left edge
const BAD = 14; // the corrupted register
const REG = { cx: 165, w: 158, h: 26, gap: 6, y0: 92 };
const regY = (i: number) => REG.y0 + i * (REG.h + REG.gap) + REG.h / 2;

// the execution timeline strip — a whole rr trace, end to end
const STRIP = { x: 350, y: 118, w: 870, h: 32 };
const stripX = (u: number) => STRIP.x + u * STRIP.w;
const STRIP_MID = STRIP.y + STRIP.h / 2;
const CORRUPT_AT = 0.42; // where the bad write actually happened (hidden at first)
const TICKS = [0.09, 0.2, 0.31, 0.42, 0.55, 0.67, 0.8, 0.92]; // faint event ticks
const FWD_STOPS = [0.93, 0.74, 0.58]; // beat 1: three breakpoints, all too late

const GDB_CARD = { x: 480, y: 300, w: 340, h: 96 };
const SRC_CARD = { x: 880, y: 322, w: 400, h: 74 };
const FRAME_Y = SRC_CARD.y + SRC_CARD.h / 2 + 34;
const FRAMES = ['#0 set_x', '#1 execute', '#2 step'];
const REOPEN_CARD = { x: 880, y: 512, w: 470, h: 78 };

// deterministic register values (mono, abstract)
const rand = mulberry32(4217);
const REG_VALS = Array.from({ length: N_REGS }, (_, i) =>
  i === 0 ? '0x00000000' : `0x${Math.floor(rand() * 0xffffffff).toString(16).padStart(8, '0')}`,
);
const BAD_VAL = '0xdeadbeef'; // what x14 flips into

// ── timeline ───────────────────────────────────────────────────────────────
export function buildScene() {
  const tl = new Timeline();

  const regsU = tl.channel('regsU', 0); // register column staggers in
  const stripU = tl.channel('stripU', 0); // timeline strip draws on
  const fwd0 = tl.channel('fwd0', 0); // beat 0: execution runs to the end
  const insnsU = tl.channel('insnsU', 0); // "~3,000,000 insns" position marker
  const corruptU = tl.channel('corruptU', 0); // x14 flips NEGATIVE
  const fwdVis = tl.channel('fwdVis', 0); // beat 1: retry cursor visibility
  const fwd = tl.channel('fwd', 0); // beat 1: forward re-run cursor
  const missFlash = tl.channel('missFlash', 0); // WARM "too late" at each stop
  const pinU = tl.channel('pinU', 0); // hardware watchpoint pin on x14
  const gdbU = tl.channel('gdbU', 0); // gdb card lines, 0..3
  const revVis = tl.channel('revVis', 0); // reverse cursor visibility
  const revX = tl.channel('revX', 1); // reverse cursor position (starts at end)
  const revFlow = tl.channel('revFlow', 0); // reversed dash-flow phase
  const revWash = tl.channel('revWash', 0); // SECONDARY wash over the covered span
  const landFlash = tl.channel('landFlash', 0); // dead-stop flash at the write
  const srcU = tl.channel('srcU', 0); // source-line card
  const frameU = tl.channel('frameU', 0); // stack-frame chips stagger
  const coinU = tl.channel('coinU', 0); // `when → event` chip mints
  const coinRing = tl.channel('coinRing', 0); // mint ring pop
  const reopenU = tl.channel('reopenU', 0); // reopen terminal, 0..2

  // BEAT 0 — millions of instructions in, x14 holds garbage
  tl.caption({ at: 0.3, dur: 4.8, text: 'Millions of instructions in, x14 holds garbage — and nobody knows since when.' });
  tl.tween(regsU, 1, { at: 0.5, dur: 1.6, ease: ease.linear });
  tl.tween(stripU, 1, { at: 0.9, dur: 1.3, ease: ease.draw });
  tl.tween(fwd0, 1, { at: 2.3, dur: 2.2, ease: ease.linear });
  tl.tween(insnsU, 1, { at: 4.1, dur: 0.5, ease: ease.enter });
  tl.tween(corruptU, 1, { at: 4.4, dur: 0.5, ease: ease.pop });
  tl.hold(4.9, 2.4);

  // BEAT 1 — forward debugging keeps overshooting the (hidden) corruption
  tl.caption({ at: 7.3, dur: 4.8, text: 'Forward debugging: re-run, breakpoint, pray — the bug happened long before you looked.' });
  tl.tween(fwdVis, 1, { at: 7.5, dur: 0.3, ease: ease.enter });
  // pass 1
  tl.tween(fwd, FWD_STOPS[0], { at: 7.6, dur: 1.1, ease: ease.linear });
  tl.tween(missFlash, 1, { at: 8.75, dur: 0.35, ease: ease.pop });
  tl.tween(missFlash, 0, { at: 9.1, dur: 0.3, ease: ease.move });
  // pass 2 — re-run from zero, stop earlier… still too late
  tl.set(fwd, 0, 9.5);
  tl.tween(fwd, FWD_STOPS[1], { at: 9.6, dur: 0.9, ease: ease.linear });
  tl.tween(missFlash, 1, { at: 10.55, dur: 0.35, ease: ease.pop });
  tl.tween(missFlash, 0, { at: 10.9, dur: 0.3, ease: ease.move });
  // pass 3
  tl.set(fwd, 0, 11.3);
  tl.tween(fwd, FWD_STOPS[2], { at: 11.4, dur: 0.8, ease: ease.linear });
  tl.tween(missFlash, 1, { at: 12.25, dur: 0.35, ease: ease.pop });
  tl.tween(missFlash, 0, { at: 12.6, dur: 0.3, ease: ease.move });
  // give up: run to the end again — back where we started
  tl.tween(fwd, 1, { at: 13.0, dur: 0.8, ease: ease.move });

  // BEAT 2 — whowrote: watchpoint on x14, then time runs BACKWARDS
  tl.caption({ at: 14.4, dur: 5.0, text: 'whowrote: drop a hardware watchpoint on x14 and run time backwards.' });
  tl.tween(pinU, 1, { at: 14.7, dur: 0.5, ease: ease.pop });
  tl.tween(gdbU, 1, { at: 15.3, dur: 0.35, ease: ease.enter }); // (gdb) whowrote x14
  tl.tween(gdbU, 2, { at: 15.9, dur: 0.35, ease: ease.enter }); // → watch -l x14
  tl.tween(gdbU, 3, { at: 16.4, dur: 0.35, ease: ease.enter }); // → reverse-continue
  tl.tween(revVis, 1, { at: 16.9, dur: 0.3, ease: ease.enter });
  tl.tween(revWash, 1, { at: 17.0, dur: 0.8, ease: ease.move });
  tl.tween(revFlow, 6, { at: 17.0, dur: 4.0, ease: ease.linear }); // dashes stream left
  tl.tween(revX, 0.55, { at: 17.2, dur: 2.6, ease: ease.linear }); // the long rewind…
  tl.tween(revX, CORRUPT_AT, { at: 19.8, dur: 0.9, ease: ease.move }); // …decelerating in

  // BEAT 3 — dead stop on the writing line: file, line, frame
  tl.caption({ at: 20.4, dur: 4.8, text: 'reverse-continue stops on the writing line — file, line, frame. Two commands.' });
  tl.tween(landFlash, 1, { at: 20.7, dur: 0.45, ease: ease.pop });
  tl.tween(landFlash, 0.55, { at: 21.6, dur: 0.9, ease: ease.move }); // settle to a glow
  tl.tween(srcU, 1, { at: 21.1, dur: 0.6, ease: ease.enter });
  tl.tween(frameU, 1, { at: 21.9, dur: 0.8, ease: ease.linear });
  tl.tween(revWash, 0.35, { at: 22.6, dur: 1.0, ease: ease.move });
  tl.hold(23.6, 2.8);

  // BEAT 4 — cite stamps the moment: an event number anyone can reopen
  tl.caption({ at: 26.4, dur: 5.4, text: 'cite stamps event 118,442 — anyone can reopen it with rr replay -g <event>.' });
  tl.tween(coinU, 1, { at: 26.8, dur: 0.5, ease: ease.pop });
  tl.tween(coinRing, 1, { at: 26.8, dur: 0.45, ease: ease.enter });
  tl.tween(coinRing, 0, { at: 27.4, dur: 0.8, ease: ease.move });
  tl.tween(reopenU, 1, { at: 28.4, dur: 0.4, ease: ease.enter }); // $ rr replay -g …
  tl.tween(reopenU, 2, { at: 29.4, dur: 0.5, ease: ease.enter }); // → same state, forever
  tl.hold(29.9, 2.6);

  return {
    tl, regsU, stripU, fwd0, insnsU, corruptU, fwdVis, fwd, missFlash, pinU,
    gdbU, revVis, revX, revFlow, revWash, landFlash, srcU, frameU, coinU,
    coinRing, reopenU,
  };
}

const scene = buildScene();

// ── local subcomponents (pure functions of the values handed to them) ──────
function TermCard({ x, y, w, h, lines, u, prompt }: {
  x: number; y: number; w: number; h: number;
  lines: { text: string; color: string }[]; u: number; prompt?: string;
}) {
  if (u <= 0.002) return null;
  const head = clamp01(u); // first line gates the card itself
  return (
    <g opacity={head} transform={`translate(${x}, ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10}
        fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {prompt && (
        <text x={-w / 2 + 14} y={-h / 2 - 8} fill={colors.MUTED} fontSize={12}>{prompt}</text>
      )}
      {lines.map((ln, i) => {
        const lu = clamp01(u - i);
        if (lu <= 0) return null;
        return (
          <text key={i} x={-w / 2 + 16} y={-h / 2 + 24 + i * 24} fill={ln.color}
            fontSize={14.5} fontFamily={mono} opacity={lu}>
            {ln.text}
          </text>
        );
      })}
    </g>
  );
}

function renderFrame(s: SceneState) {
  const regsU = clamp01(s.get(scene.regsU));
  const stripU = clamp01(s.get(scene.stripU));
  const fwd0 = clamp01(s.get(scene.fwd0));
  const insnsU = clamp01(s.get(scene.insnsU));
  const corruptU = clamp01(s.get(scene.corruptU));
  const fwdVis = clamp01(s.get(scene.fwdVis));
  const fwd = clamp01(s.get(scene.fwd));
  const missFlash = clamp01(s.get(scene.missFlash));
  const pinU = clamp01(s.get(scene.pinU));
  const gdbU = s.get(scene.gdbU);
  const revVis = clamp01(s.get(scene.revVis));
  const revX = clamp01(s.get(scene.revX));
  const revFlow = s.get(scene.revFlow);
  const revWash = clamp01(s.get(scene.revWash));
  const landFlash = clamp01(s.get(scene.landFlash));
  const srcU = clamp01(s.get(scene.srcU));
  const frameU = clamp01(s.get(scene.frameU));
  const coinU = clamp01(s.get(scene.coinU));
  const coinRing = clamp01(s.get(scene.coinRing));
  const reopenU = s.get(scene.reopenU);

  // ONE cursor — reverse overrides forward-retries overrides the initial run
  const reversing = revVis > 0.01;
  const cursorU = reversing ? revX : fwdVis > 0.01 ? fwd : fwd0;
  const cursorX = stripX(cursorU);
  const cursorColor = reversing ? colors.SECONDARY : colors.WARM;
  const landed = landFlash > 0.02;

  return (
    <g>
      {/* ── register-file column: x0..x15 ── */}
      <text x={REG.cx} y={REG.y0 - 18} textAnchor="middle" fill={colors.MUTED}
        fontSize={13} opacity={regsU}>
        guest registers
      </text>
      {REG_VALS.map((val, i) => {
        const u = clamp01((regsU * (N_REGS + 4) - i) / 4);
        if (u <= 0) return null;
        const isBad = i === BAD;
        const badNow = isBad && corruptU > 0.02;
        const stroke = badNow ? colors.NEGATIVE : colors.GRID;
        const textCol = badNow ? colors.NEGATIVE : colors.MUTED;
        const scale = 0.85 + 0.15 * u + (isBad ? 0.08 * corruptU : 0);
        return (
          <g key={i} opacity={u} transform={`translate(${REG.cx}, ${regY(i)}) scale(${scale})`}>
            <rect x={-REG.w / 2} y={-REG.h / 2} width={REG.w} height={REG.h} rx={6}
              fill={colors.PANEL} stroke={stroke} strokeWidth={badNow ? 2 : 1.2} />
            <text x={-REG.w / 2 + 10} y={5} fill={badNow ? colors.NEGATIVE : colors.TEXT}
              fontSize={12.5} fontFamily={mono}>
              {`x${i}`}
            </text>
            <text x={REG.w / 2 - 10} y={5} textAnchor="end" fill={textCol}
              fontSize={12.5} fontFamily={mono}>
              {badNow && corruptU > 0.5 ? BAD_VAL : val}
            </text>
          </g>
        );
      })}
      {/* NEGATIVE flash ring on x14 as it flips */}
      {corruptU > 0.02 && (
        <rect x={REG.cx - REG.w / 2 - 5} y={regY(BAD) - REG.h / 2 - 5}
          width={REG.w + 10} height={REG.h + 10} rx={9} fill="none"
          stroke={colors.NEGATIVE} strokeWidth={2.5}
          opacity={0.35 + 0.55 * Math.max(corruptU * (1 - fwdVis * 0.5), landFlash)} />
      )}

      {/* ── hardware watchpoint pin on x14 (beat 2) ── */}
      {pinU > 0.002 && (
        <g opacity={pinU}
          transform={`translate(${REG.cx + REG.w / 2 + 26}, ${regY(BAD) - 14 * (1 - pinU)})`}>
          <line x1={0} y1={-2} x2={0} y2={10} stroke={colors.ACCENT} strokeWidth={2.5} />
          <path d="M 0 10 L -5 3 L 5 3 Z" fill={colors.ACCENT} />
          <circle cy={-8} r={7} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <circle cy={-8} r={2.5} fill={colors.ACCENT} />
          <text x={14} y={-4} fill={colors.ACCENT} fontSize={12} fontFamily={mono}>
            watch -l
          </text>
        </g>
      )}

      {/* ── the execution timeline strip: the whole rr trace ── */}
      {stripU > 0.002 && (
        <g>
          <text x={STRIP.x} y={STRIP.y - 12} fill={colors.MUTED} fontSize={12} opacity={stripU}>
            rr-traces/&lt;name&gt; — one deterministic execution
          </text>
          <rect x={STRIP.x} y={STRIP.y} width={STRIP.w * stripU} height={STRIP.h} rx={7}
            fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={STRIP.x} y={STRIP.y + STRIP.h + 18} fill={colors.MUTED} fontSize={11.5}
            fontFamily={mono} opacity={stripU * 0.9}>
            insn 0
          </text>
          {/* position marker at the far right: where the garbage was noticed */}
          {insnsU > 0.002 && (
            <text x={STRIP.x + STRIP.w} y={STRIP.y + STRIP.h + 18} textAnchor="end"
              fill={colors.WARM} fontSize={11.5} fontFamily={mono} opacity={insnsU}>
              ~3,000,000 insns
            </text>
          )}

          {/* SECONDARY wash over the span the rewind has covered */}
          {revWash > 0.002 && revVis > 0.01 && (
            <rect x={cursorX} y={STRIP.y} width={STRIP.x + STRIP.w - cursorX}
              height={STRIP.h} rx={7} fill={colors.SECONDARY} opacity={0.1 * revWash} />
          )}

          {/* faint event ticks; they light up as the rewind sweeps back over them */}
          {TICKS.map((p, i) => {
            const relit = reversing && revX <= p ? 1 : 0;
            return (
              <line key={i} x1={stripX(p)} y1={STRIP.y + 6} x2={stripX(p)} y2={STRIP.y + STRIP.h - 6}
                stroke={relit ? colors.SECONDARY : colors.MUTED} strokeWidth={relit ? 2 : 1.2}
                opacity={stripU * (0.22 + 0.6 * relit * revWash)} />
            );
          })}

          {/* the (hidden) corruption point — a ghost until reverse-continue lands */}
          <g transform={`translate(${stripX(CORRUPT_AT)}, ${STRIP_MID})`}>
            <path d="M 0 -8 L 7 0 L 0 8 L -7 0 Z"
              fill={landed ? colors.NEGATIVE : 'none'}
              stroke={colors.NEGATIVE} strokeWidth={1.5}
              opacity={stripU * (landed ? 0.5 + 0.5 * landFlash : 0.14)} />
            {landed && (
              <circle r={12 + 14 * (1 - landFlash)} fill="none" stroke={colors.NEGATIVE}
                strokeWidth={2.5} opacity={landFlash} />
            )}
          </g>

          {/* reversed dash flow: dashes STREAM right→left across the covered span */}
          {reversing && revWash > 0.02 && (
            <line x1={cursorX + 10} y1={STRIP_MID} x2={STRIP.x + STRIP.w - 6} y2={STRIP_MID}
              stroke={colors.SECONDARY} strokeWidth={2.5} strokeLinecap="round"
              strokeDasharray="9 7" strokeDashoffset={revFlow * 64}
              opacity={0.85 * revWash * revVis} />
          )}

          {/* WARM "breakpoint — too late" flash at each forward stop */}
          {missFlash > 0.002 && fwdVis > 0.01 && (
            <g transform={`translate(${cursorX}, ${STRIP.y - 8})`} opacity={missFlash}>
              <path d={`M -6 -12 L 6 0 M 6 -12 L -6 0`} stroke={colors.WARM}
                strokeWidth={2.5} strokeLinecap="round" />
              <text y={-20} textAnchor="middle" fill={colors.WARM} fontSize={12.5}>
                too late — already corrupted
              </text>
            </g>
          )}

          {/* THE cursor — WARM going forward, SECONDARY running backwards */}
          {stripU > 0.95 && (
            <g transform={`translate(${cursorX}, 0)`}>
              <line y1={STRIP.y - 5} y2={STRIP.y + STRIP.h + 5} stroke={cursorColor}
                strokeWidth={2.5} strokeLinecap="round" />
              <circle cy={STRIP.y - 5} r={4} fill={cursorColor} />
              {/* reverse chevrons: unmistakably running the other way */}
              {reversing && !landed && (
                <g stroke={colors.SECONDARY} strokeWidth={2.5} strokeLinecap="round"
                  strokeLinejoin="round" fill="none" opacity={revVis}>
                  <path d={`M -8 ${STRIP.y - 16} l -7 -6 l 7 -6`} />
                  <path d={`M 2 ${STRIP.y - 16} l -7 -6 l 7 -6`} />
                  <text x={10} y={STRIP.y - 18} fill={colors.SECONDARY} stroke="none"
                    fontSize={12.5} fontFamily={mono}>
                    reverse-continue
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      )}

      {/* ── gdb card: whowrote is two commands (tools/rr/verifier.gdb) ── */}
      <TermCard {...GDB_CARD} u={gdbU} prompt="tools/rr/verifier.gdb"
        lines={[
          { text: '(gdb) whowrote x14', color: colors.TEXT },
          { text: '→ watch -l x14', color: colors.ACCENT },
          { text: '→ reverse-continue', color: colors.SECONDARY },
        ]} />

      {/* ── the writing line: file, line, frame (beat 3) ── */}
      {srcU > 0.002 && (
        <g opacity={srcU} transform={`translate(${SRC_CARD.x}, ${SRC_CARD.y}) scale(${0.92 + 0.08 * srcU})`}>
          <rect x={-SRC_CARD.w / 2 - 4} y={-SRC_CARD.h / 2 - 4} width={SRC_CARD.w + 8}
            height={SRC_CARD.h + 8} rx={13} fill="none" stroke={colors.POSITIVE}
            strokeWidth={1.5} opacity={0.35 + 0.45 * landFlash} />
          <rect x={-SRC_CARD.w / 2} y={-SRC_CARD.h / 2} width={SRC_CARD.w} height={SRC_CARD.h}
            rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2} />
          <text y={-6} textAnchor="middle" fill={colors.POSITIVE} fontSize={16.5}
            fontFamily={mono} fontWeight={600}>
            {'hart/regs.rs — set_x(14, …)'}
          </text>
          <text y={18} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily={mono}>
            info line · frame — the write, caught in the act
          </text>
          {/* leader from the landing point down to the card */}
          <line x1={stripX(CORRUPT_AT) - SRC_CARD.x} y1={STRIP_MID + 12 - SRC_CARD.y}
            x2={0} y2={-SRC_CARD.h / 2 - 6} stroke={colors.POSITIVE} strokeWidth={1.5}
            strokeDasharray="3 4" opacity={0.6} />
        </g>
      )}
      {/* stack-frame chips beneath */}
      {FRAMES.map((f, i) => {
        const u = clamp01(frameU * (FRAMES.length + 1) - i);
        if (u <= 0) return null;
        const w = f.length * 8.6 + 26;
        const x = SRC_CARD.x - SRC_CARD.w / 2 + w / 2 + i * (w + 14) + i * 10;
        return (
          <g key={f} opacity={u} transform={`translate(${x}, ${FRAME_Y + 6 * (1 - u)})`}>
            <rect x={-w / 2} y={-13} width={w} height={26} rx={13}
              fill={colors.PANEL} stroke={i === 0 ? colors.POSITIVE : colors.GRID} strokeWidth={1.5} />
            <text y={4.5} textAnchor="middle" fill={i === 0 ? colors.POSITIVE : colors.MUTED}
              fontSize={12.5} fontFamily={mono}>
              {f}
            </text>
          </g>
        );
      })}

      {/* ── cite: the moment, minted as an event number (beat 4) ── */}
      {coinU > 0.002 && (() => {
        const label = 'when → event 118,442';
        const cw = label.length * 7.4 + 34;
        const cx = stripX(CORRUPT_AT);
        const cy = STRIP.y - 40 - 8 * (1 - coinU);
        return (
          <g opacity={coinU} transform={`translate(${cx}, ${cy})`}>
            <line x1={0} y1={13} x2={0} y2={38} stroke={colors.WARM} strokeWidth={1.5}
              strokeDasharray="2 3" />
            {coinRing > 0.002 && (
              <rect x={-cw / 2 - 6 - 14 * (1 - coinRing)} y={-19 - 14 * (1 - coinRing)}
                width={cw + 12 + 28 * (1 - coinRing)} height={38 + 28 * (1 - coinRing)}
                rx={19 + 14 * (1 - coinRing)} fill="none" stroke={colors.WARM}
                strokeWidth={2} opacity={coinRing} />
            )}
            <rect x={-cw / 2} y={-13} width={cw} height={26} rx={13}
              fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.8} />
            {/* crosshair glyph — a point link's mark */}
            <g stroke={colors.WARM} strokeWidth={1.4}>
              <circle cx={-cw / 2 + 14} r={4.5} fill="none" />
              <line x1={-cw / 2 + 14} y1={-7.5} x2={-cw / 2 + 14} y2={7.5} />
              <line x1={-cw / 2 + 6.5} y1={0} x2={-cw / 2 + 21.5} y2={0} />
            </g>
            <text x={11} y={4.5} textAnchor="middle" fill={colors.WARM} fontSize={13}
              fontFamily={mono}>
              {label}
            </text>
          </g>
        );
      })()}

      {/* the second terminal: anyone reopens the trace at that exact event */}
      <TermCard {...REOPEN_CARD} u={reopenU} prompt="anyone, any machine, any day"
        lines={[
          { text: '$ rr replay -g 118442 rr-traces/<name>', color: colors.TEXT },
          { text: '→ event 118,442 — same state, forever', color: colors.POSITIVE },
        ]} />
    </g>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
/** The module-scope scene; its `.tl` drives embedding (beats = caption starts). */
export const vizScene = () => scene;
