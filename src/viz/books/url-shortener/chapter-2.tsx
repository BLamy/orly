// Minting the Link
//
// Backing files: solutions/system_design/pastebin/README.md (unique url
// generation: MD5 of ip_address+timestamp, Base 62 encoding, first 7 chars,
// 62^7 keyspace vs 360M shortlinks in 3 years, duplicate check against the
// SQL pastes table) and README.md "Design core components" (MD5/Base62/hash
// collisions as the canonical url-shortener talking points).
//
// Centerpiece: the base-62 mint. The division odometer is REAL math — the
// remainders and quotients below are computed at module scope with BigInt
// from the actual MD5 of "73.223.4.87" + "1467906443", so every glyph the
// machine emits is the true base-62 encoding, filled least-significant-digit
// first (right to left), exactly like the primer's base_encode pseudocode.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ParticleCloud, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Real math at module scope — md5("73.223.4.87" + "1467906443"), precomputed
// (node crypto), then base-62 decomposed here with BigInt. Deterministic.
// ---------------------------------------------------------------------------

const IP = '73.223.4.87';
const TS = '1467906443';
const MD5_HEX = '075bd76434d68fa29a6b87a4e284d161';
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface DivStep {
  quotient: string; // decimal string BEFORE this division
  rem: number; // index into ALPHABET
}

const STEPS: DivStep[] = (() => {
  const out: DivStep[] = [];
  let n = BigInt('0x' + MD5_HEX);
  while (n > 0n) {
    out.push({ quotient: n.toString(10), rem: Number(n % 62n) });
    n = n / 62n;
  }
  return out;
})();

// encoded = remainders reversed → "dSUUsvoCWnklpNI0YQ4Ux"
const ENCODED = STEPS.map((st) => ALPHABET[st.rem]).reverse().join('');
const N_STEPS = STEPS.length; // 21
const SHORTLINK = ENCODED.slice(0, 7); // "dSUUsvo"

// the keyspace cloud — 62^7 as a vast field, 360M as a tiny cluster
const krand = mulberry32(627);
const SPACE_DOTS = Array.from({ length: 700 }, () => ({
  x: 150 + krand() * 980,
  y: 120 + krand() * 400,
  a: 0.1 + krand() * 0.22,
}));
const NEED_DOTS = Array.from({ length: 70 }, () => {
  const ang = krand() * Math.PI * 2;
  const rad = Math.sqrt(krand()) * 34;
  return { x: 330 + Math.cos(ang) * rad, y: 430 + Math.sin(ang) * rad * 0.8 };
});

// layout
const PLATE = { x: 445, y: 96, slot: 56, gap: 8 } as const; // 7 slots, centered on 640
const STRIP = { x0: 128, x1: 1152, y: 388 } as const;
const glyphX = (i: number): number => STRIP.x0 + (i / 61) * (STRIP.x1 - STRIP.x0);
const TAPE = { x0: 240, y: 470, cell: 38, gap: 4 } as const; // 21 cells
const tapeX = (k: number): number => TAPE.x0 + k * (TAPE.cell + TAPE.gap);

const CAM_PLATE: CameraState = { x: 640, y: 220, k: 1.3 };
const CAM_MACHINE: CameraState = { x: 640, y: 430, k: 1.22 };
const CAM_WIDE: CameraState = CAMERA_HOME;

const groupColor = (i: number): string =>
  i < 10 ? colors.ACCENT : i < 36 ? colors.TEAL : colors.SECONDARY;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  plateU: ChannelRef<number>;
  counterU: ChannelRef<number>;
  counterN: ChannelRef<number>;
  counterDim: ChannelRef<number>;
  inputU: ChannelRef<number>;
  hashU: ChannelRef<number>;
  stripU: ChannelRef<number>;
  b64U: ChannelRef<number>;
  divStep: ChannelRef<number>;
  keepU: ChannelRef<number>;
  plateFill: ChannelRef<number>;
  machineDim: ChannelRef<number>;
  spaceU: ChannelRef<number>;
  needU: ChannelRef<number>;
  dupU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PLATE, cameraInterp);
  const plateU = tl.channel('plateU', 0);
  const counterU = tl.channel('counterU', 0);
  const counterN = tl.channel('counterN', 1);
  const counterDim = tl.channel('counterDim', 1);
  const inputU = tl.channel('inputU', 0);
  const hashU = tl.channel('hashU', 0);
  const stripU = tl.channel('stripU', 0);
  const b64U = tl.channel('b64U', 0);
  const divStep = tl.channel('divStep', 0);
  const keepU = tl.channel('keepU', 0);
  const plateFill = tl.channel('plateFill', 0);
  const machineDim = tl.channel('machineDim', 1);
  const spaceU = tl.channel('spaceU', 0);
  const needU = tl.channel('needU', 0);
  const dupU = tl.channel('dupU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · seven empty slots —
  tl.caption({
    at: 0.5,
    dur: 6,
    text: 'Every paste needs a name — seven characters, unique, and safe to put in a URL. This chapter is about where those seven characters come from.',
  });
  tl.tween(plateU, 1, { at: 0.6, dur: 1.2, ease: ease.draw });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the tempting counter —
  tl.caption({
    at: 7.0,
    dur: 6.8,
    text: 'The tempting answer is a counter. One, two, three. But sequential names are guessable — anyone can walk your entire site — and a single number every write must touch is a bottleneck waiting to happen.',
  });
  tl.tween(counterU, 1, { at: 7.2, dur: 0.7, ease: ease.enter });
  tl.tween(counterN, 8, { at: 7.9, dur: 4.5, ease: ease.linear });
  tl.tween(counterDim, 0, { at: 12.6, dur: 1.0, ease: ease.move });

  // — Beat 3 · hash instead —
  tl.caption({
    at: 14.2,
    dur: 6,
    text: "The primer hashes instead: take the writer's address and the timestamp, and run them through MD5 — a well known hash that scatters its inputs uniformly across a huge space.",
  });
  tl.tween(inputU, 1, { at: 14.4, dur: 0.8, ease: ease.enter });
  tl.tween(hashU, 1, { at: 17.0, dur: 1.4, ease: ease.draw });
  tl.hold(20.2, 0.5);

  // — Beat 4 · 128 bits, too long —
  tl.caption({
    at: 20.9,
    dur: 5.3,
    text: 'The result is a one hundred twenty eight bit number. Big, uniform — and far too long to be a link anyone would share.',
  });

  // — Beat 5 · base 62 —
  tl.caption({
    at: 26.5,
    dur: 6.5,
    text: 'So we change how we write it down. Base 62 spends every digit, every lowercase letter, and every uppercase letter — sixty two symbols, each one legal in a URL.',
  });
  tl.tween(cam, CAM_MACHINE, { at: 26.7, dur: 1.5, ease: ease.move });
  tl.tween(stripU, 1, { at: 27.4, dur: 2.6, ease: ease.draw });

  // — Beat 6 · why not base 64 —
  tl.caption({
    at: 33.4,
    dur: 5.4,
    text: 'Base 64 would pack a little more, but its two extra characters are plus and slash — both need escaping inside a URL. Not worth the trouble.',
  });
  tl.tween(b64U, 1, { at: 33.8, dur: 0.6, ease: ease.pop });
  tl.tween(b64U, 0, { at: 37.6, dur: 1.0, ease: ease.move });

  // — Beat 7 · the division machine —
  tl.caption({
    at: 39.2,
    dur: 6.8,
    text: 'Now the machine. Divide the number by sixty two: the remainder picks a symbol. Divide again — another symbol. Every division peels one character off the end of the name.',
  });
  tl.tween(divStep, 4, { at: 40.0, dur: 5.6, ease: ease.linear });

  // — Beat 8 · keep the first seven —
  tl.caption({
    at: 46.4,
    dur: 5.6,
    text: 'Twenty one divisions later, the number is spent. The primer keeps just the first seven characters of the result.',
  });
  tl.tween(divStep, N_STEPS, { at: 46.6, dur: 3.4, ease: ease.move });
  tl.tween(keepU, 1, { at: 50.4, dur: 0.8, ease: ease.draw });
  tl.tween(plateFill, 1, { at: 51.0, dur: 1.0, ease: ease.move });
  tl.hold(52.4, 0.5);

  // — Beat 9 · the keyspace —
  tl.caption({
    at: 53.1,
    dur: 6.9,
    text: 'Seven slots, sixty two choices each — sixty two to the seventh power. About three and a half trillion possible names, for the three hundred sixty million we expect to need in three years.',
  });
  tl.tween(machineDim, 0.12, { at: 53.3, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_WIDE, { at: 53.3, dur: 1.6, ease: ease.move });
  tl.tween(spaceU, 1, { at: 54.2, dur: 2.2, ease: ease.draw });
  tl.tween(needU, 1, { at: 57.4, dur: 1.4, ease: ease.move });
  tl.hold(60.4, 0.5);

  // — Beat 10 · collisions —
  tl.caption({
    at: 61.1,
    dur: 6.4,
    text: 'Uniform is not the same as unique. Before the write commits, the service checks the database for a duplicate — and if the name is taken, it simply mints another and checks again.',
  });
  tl.tween(spaceU, 0.15, { at: 61.3, dur: 1.0, ease: ease.move });
  tl.tween(needU, 0, { at: 61.3, dur: 1.0, ease: ease.move });
  tl.tween(dupU, 1, { at: 62.2, dur: 4.6, ease: ease.linear });

  // — Beat 11 · the link exists —
  tl.caption({
    at: 68.1,
    dur: 5.4,
    text: "And with that, our link exists — seven characters, minted from a hash. Next, we give the paste itself somewhere to live.",
  });
  tl.tween(dupU, 0, { at: 68.3, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_PLATE, { at: 68.5, dur: 1.6, ease: ease.move });
  tl.tween(closeU, 1, { at: 69.6, dur: 0.9, ease: ease.enter });
  tl.hold(73.0, 1.5);

  return {
    tl,
    cam,
    plateU,
    counterU,
    counterN,
    counterDim,
    inputU,
    hashU,
    stripU,
    b64U,
    divStep,
    keepU,
    plateFill,
    machineDim,
    spaceU,
    needU,
    dupU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function spaceParticles(s: SceneState) {
  const spaceU = s.get(scene.spaceU);
  const needU = s.get(scene.needU);
  const pts = [];
  if (spaceU > 0) {
    for (let i = 0; i < SPACE_DOTS.length; i++) {
      const d = SPACE_DOTS[i];
      const appear = clamp01(spaceU * 1.4 - (i / SPACE_DOTS.length) * 0.4);
      pts.push({ x: d.x, y: d.y, r: 1.6, alpha: appear * d.a, color: colors.MUTED });
    }
  }
  if (needU > 0) {
    for (const d of NEED_DOTS) {
      pts.push({ x: d.x, y: d.y, r: 2.2, alpha: needU * 0.9, color: colors.WARM });
    }
  }
  return pts;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const plateU = s.get(scene.plateU);
  const counterU = s.get(scene.counterU);
  const counterN = s.get(scene.counterN);
  const counterDim = s.get(scene.counterDim);
  const inputU = s.get(scene.inputU);
  const hashU = s.get(scene.hashU);
  const stripU = s.get(scene.stripU);
  const b64U = s.get(scene.b64U);
  const divStep = s.get(scene.divStep);
  const keepU = s.get(scene.keepU);
  const plateFill = s.get(scene.plateFill);
  const machineDim = s.get(scene.machineDim);
  const spaceU = s.get(scene.spaceU);
  const dupU = s.get(scene.dupU);
  const closeU = s.get(scene.closeU);

  const stepIdx = Math.min(Math.floor(divStep), N_STEPS - 1);
  const stepFrac = divStep - Math.floor(divStep);
  const running = divStep > 0 && divStep < N_STEPS;
  const cur = STEPS[stepIdx];
  const cellsFilled = Math.floor(divStep); // tape cells already emitted

  // counter odometer text
  const counterVal = String(Math.max(1, Math.floor(counterN))).padStart(6, '0');

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- keyspace cloud (behind everything) ---- */}
        <ParticleCloud state={s} compute={spaceParticles} />
        {spaceU > 0.4 && (
          <g opacity={clamp01(spaceU * 2 - 1) * (1 - closeU)}>
            <MathLabel tex={'62^7 \\approx 3.5 \\times 10^{12}'} x={900} y={200} fontSize={30} color={colors.TEXT} />
            <text x={330} y={510} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={s.get(scene.needU)}>
              360 M needed — barely a speck
            </text>
          </g>
        )}

        {/* ---- the 7-slot plate ---- */}
        <g opacity={plateU}>
          {Array.from({ length: 7 }, (_, i) => {
            const x = PLATE.x + i * (PLATE.slot + PLATE.gap);
            const lit = clamp01(plateFill * 9 - i);
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={PLATE.y}
                  width={PLATE.slot}
                  height={64}
                  rx={9}
                  fill={lit > 0 ? colors.PANEL : colors.BG}
                  stroke={lit > 0 ? colors.ACCENT : colors.GRID}
                  strokeWidth={lit > 0 ? 1.8 : 1.2}
                />
                {lit > 0 && (
                  <text x={x + PLATE.slot / 2} y={PLATE.y + 42} textAnchor="middle" fill={colors.ACCENT} fontSize={30} fontFamily="monospace" opacity={lit}>
                    {SHORTLINK[i]}
                  </text>
                )}
              </g>
            );
          })}
          <text x={640} y={PLATE.y - 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            seven characters, unique, url-safe
          </text>
        </g>

        {/* ---- the rejected counter ---- */}
        {counterU > 0 && counterDim > 0 && (
          <g opacity={counterU * counterDim}>
            <rect x={500} y={220} width={280} height={70} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
            <text x={640} y={258} textAnchor="middle" fill={colors.NEGATIVE} fontSize={26} fontFamily="monospace">
              {counterVal}
            </text>
            <text x={640} y={280} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
              sequential → guessable · one owner → bottleneck
            </text>
          </g>
        )}

        {/* ---- input → hash ---- */}
        <g opacity={inputU * machineDim}>
          <rect x={128} y={224} width={200} height={34} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={228} y={246} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
            ip {IP}
          </text>
          <rect x={128} y={266} width={200} height={34} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={228} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily="monospace">
            t {TS}
          </text>
          <text x={356} y={272} fill={colors.MUTED} fontSize={16}>
            →
          </text>
          <text x={392} y={252} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
            md5(ip_address + timestamp)
          </text>
        </g>
        <g opacity={hashU * machineDim}>
          <rect x={390} y={262} width={498 * hashU} height={38} rx={8} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={402} y={287} fill={colors.SECONDARY} fontSize={16} fontFamily="monospace" opacity={hashU}>
            {MD5_HEX.slice(0, Math.max(1, Math.round(32 * hashU)))}
          </text>
          <text x={890} y={252} textAnchor="end" fill={colors.MUTED} fontSize={11} fontStyle="italic" opacity={clamp01(hashU * 2 - 1)}>
            128 bits, uniformly distributed
          </text>
        </g>

        {/* ---- the base-62 alphabet strip ---- */}
        <g opacity={machineDim}>
          {ALPHABET.split('').map((ch, i) => {
            const u = clamp01(stripU * 62 * 1.3 - i);
            if (u <= 0) return null;
            const isRem = running && cur.rem === i;
            return (
              <text
                key={i}
                x={glyphX(i)}
                y={STRIP.y + (isRem ? -6 : 0)}
                textAnchor="middle"
                fill={isRem ? colors.WARM : groupColor(i)}
                fontSize={isRem ? 22 : 14}
                fontFamily="monospace"
                fontWeight={isRem ? 700 : 400}
                opacity={u * (isRem ? 1 : 0.8)}
              >
                {ch}
              </text>
            );
          })}
          {stripU > 0.9 && (
            <g opacity={clamp01(stripU * 4 - 3.4)}>
              <text x={glyphX(4)} y={STRIP.y + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={10}>
                0–9
              </text>
              <text x={glyphX(22)} y={STRIP.y + 24} textAnchor="middle" fill={colors.TEAL} fontSize={10}>
                a–z
              </text>
              <text x={glyphX(48)} y={STRIP.y + 24} textAnchor="middle" fill={colors.SECONDARY} fontSize={10}>
                A–Z
              </text>
            </g>
          )}
          {/* base 64's rejected extras */}
          {b64U > 0 && (
            <g opacity={b64U}>
              <text x={1096} y={STRIP.y + 42 + 18 * b64U} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontFamily="monospace">
                +
              </text>
              <text x={1126} y={STRIP.y + 42 + 26 * b64U} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20} fontFamily="monospace">
                /
              </text>
              <text x={1030} y={STRIP.y + 46} textAnchor="end" fill={colors.NEGATIVE} fontSize={10}>
                base 64 extras — need escaping →
              </text>
            </g>
          )}
        </g>

        {/* ---- the division odometer ---- */}
        {running && (
          <g opacity={machineDim}>
            <rect x={240} y={548} width={560} height={44} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={252} y={576} fill={colors.TEXT} fontSize={15} fontFamily="monospace">
              {cur.quotient.length > 30 ? cur.quotient.slice(0, 30) + '…' : cur.quotient}
            </text>
            <rect x={816} y={548} width={92} height={44} rx={9} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={862} y={576} textAnchor="middle" fill={colors.WARM} fontSize={16} fontFamily="monospace">
              ÷ 62
            </text>
            <text x={952} y={568} fill={colors.MUTED} fontSize={12}>
              remainder {cur.rem}
            </text>
            <text x={952} y={586} fill={colors.WARM} fontSize={14} fontFamily="monospace">
              → “{ALPHABET[cur.rem]}”
            </text>
            {/* the emitted glyph flying to its tape cell (right to left) */}
            {stepFrac > 0.15 && (
              <text
                x={glyphX(cur.rem) + (tapeX(N_STEPS - 1 - stepIdx) + TAPE.cell / 2 - glyphX(cur.rem)) * clamp01((stepFrac - 0.15) / 0.7)}
                y={STRIP.y + (TAPE.y + 26 - STRIP.y) * clamp01((stepFrac - 0.15) / 0.7)}
                textAnchor="middle"
                fill={colors.WARM}
                fontSize={18}
                fontFamily="monospace"
              >
                {ALPHABET[cur.rem]}
              </text>
            )}
          </g>
        )}
        {running && (
          <text x={640} y={630} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace" opacity={machineDim}>
            base_encode(num, base=62) — O(k), k = 7
          </text>
        )}

        {/* ---- the output tape ---- */}
        <g opacity={machineDim * (divStep > 0 ? 1 : 0)}>
          {Array.from({ length: N_STEPS }, (_, cellK) => {
            // cell k (left→right) holds ENCODED[k]; it fills at step N-1-k
            const stepThatFills = N_STEPS - 1 - cellK;
            const filled = cellsFilled > stepThatFills;
            const kept = cellK < 7;
            const dimmed = keepU > 0 && !kept;
            return (
              <g key={cellK} opacity={dimmed ? 1 - keepU * 0.82 : 1}>
                <rect
                  x={tapeX(cellK)}
                  y={TAPE.y}
                  width={TAPE.cell}
                  height={40}
                  rx={6}
                  fill={filled ? colors.PANEL : colors.BG}
                  stroke={kept && keepU > 0 ? colors.ACCENT : colors.GRID}
                  strokeWidth={kept && keepU > 0 ? 1.8 : 1}
                />
                {filled && (
                  <text x={tapeX(cellK) + TAPE.cell / 2} y={TAPE.y + 27} textAnchor="middle" fill={kept && keepU > 0 ? colors.ACCENT : colors.TEXT} fontSize={18} fontFamily="monospace">
                    {ENCODED[cellK]}
                  </text>
                )}
              </g>
            );
          })}
          {keepU > 0 && (
            <text x={tapeX(0)} y={TAPE.y - 12} fill={colors.ACCENT} fontSize={12} opacity={keepU}>
              keep the first 7
            </text>
          )}
        </g>

        {/* ---- the duplicate check ---- */}
        {dupU > 0 && (
          <g opacity={Math.min(1, dupU * 6)}>
            <ServiceNode x={430} y={560} kind="server" label="Write API" u={1} />
            <ServiceNode x={850} y={560} kind="db" label="SQL" sublabel="pastes" u={1} />
            {/* first attempt: taken */}
            {dupU < 0.5 && (
              <>
                <circle cx={430 + 420 * clamp01(dupU / 0.2)} cy={560} r={7} fill={colors.WARM} opacity={dupU < 0.2 ? 1 : 0} />
                {dupU >= 0.2 && dupU < 0.42 && (
                  <circle cx={850 - 420 * clamp01((dupU - 0.22) / 0.2)} cy={560} r={7} fill={colors.NEGATIVE} />
                )}
                <text x={640} y={528} textAnchor="middle" fill={dupU > 0.2 ? colors.NEGATIVE : colors.MUTED} fontSize={13} fontFamily="monospace">
                  {dupU > 0.2 ? 'taken — mint again' : 'is it unique?'}
                </text>
              </>
            )}
            {/* second attempt: accepted */}
            {dupU >= 0.5 && (
              <>
                <circle cx={430 + 420 * clamp01((dupU - 0.5) / 0.25)} cy={560} r={7} fill={colors.WARM} opacity={dupU < 0.75 ? 1 : 0} />
                <text x={640} y={528} textAnchor="middle" fill={dupU > 0.8 ? colors.POSITIVE : colors.MUTED} fontSize={13} fontFamily="monospace">
                  {dupU > 0.8 ? 'unique ✓' : 'check the new name'}
                </text>
              </>
            )}
          </g>
        )}

        {/* ---- closing ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={400} y={210} width={480} height={92} rx={14} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={248} textAnchor="middle" fill={colors.TEXT} fontSize={16}>
              minted from a hash, spelled in base 62
            </text>
            <text x={640} y={280} textAnchor="middle" fill={colors.ACCENT} fontSize={20} fontFamily="monospace" fontWeight={700}>
              /{SHORTLINK}
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
