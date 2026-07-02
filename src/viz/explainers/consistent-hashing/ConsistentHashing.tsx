import { interpolateRgb } from 'd3';
import { MathLabel, Player, colors, ease } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { NodeBadge } from '../../primitives';
import overrides from './overrides.json';
import {
  BADGE_R,
  B_SUCCESSOR,
  EXAMPLE_KEYS,
  KEY_ANGLES,
  KEY_RANK,
  LOAD_AFTER,
  LOAD_BEFORE,
  LOAD_SERVERS,
  MOD_B3,
  MOD_B4,
  MOD_MOVED,
  MOD_SLOT3,
  MOD_SLOT4,
  MOVED_ADD,
  MOVED_REMOVE,
  OWNER0,
  OWNER1,
  OWNER2,
  OWNER3,
  RING,
  SERVER_ANGLE,
  SERVER_COLOR,
  TAU,
  VNODE_MARKS,
  buildScene,
  cwDelta,
  ringPoint,
  shortestDelta,
  win,
} from './scene';
import type { ServerId } from './scene';

/** Built once at module scope — the Player samples it; nothing self-animates. */
const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/consistent-hashing/overrides.json',
  slug: 'consistent-hashing',
};

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const mix = (a: string, b: string, u: number) =>
  u <= 0 ? a : u >= 1 ? b : interpolateRgb(a, b)(u);
/** 0..3 pulse driver → three smooth pulses, exactly 0 at both ends. */
const pulseOf = (v: number) => Math.abs(Math.sin(Math.PI * v));

/* -------------------------------------------------- static render data */

const C0 = OWNER0.map((s) => SERVER_COLOR[s]);
const C1 = OWNER1.map((s) => SERVER_COLOR[s]);
const C2 = OWNER2.map((s) => SERVER_COLOR[s]);
const C3 = OWNER3.map((s) => SERVER_COLOR[s]);
const MOVED_BY_ADD = OWNER0.map((s, i) => s !== OWNER1[i]);
const MOVED_BY_REMOVE = OWNER1.map((s, i) => s !== OWNER2[i]);
const MOVED_BY_VNODE = OWNER2.map((s, i) => s !== OWNER3[i]);

const RING_C = TAU * RING.r; // circumference, for the dashoffset draw-on

// beat-1 strawman layout
const BX3 = [410, 640, 870];
const BX4 = [295, 525, 755, 985];
const BUCKET_Y = 400;
const BUCKET_COLOR = [colors.ACCENT, colors.POSITIVE, colors.SECONDARY, colors.WARM];
const bucketX = (b: number, shift: number) => (b === 3 ? BX4[3] : lerp(BX3[b], BX4[b], shift));
const slotPos = (b: number, slot: number, shift: number) => ({
  x: bucketX(b, shift) + ((slot % 2) - 0.5) * 46,
  y: 452 - Math.floor(slot / 2) * 46,
});

// load-bar panel (bottom-right, above the caption band)
const BAR_X0 = 1050;
const BAR_STEP = 76;
const BAR_W = 46;
const BAR_BASE = 600;
const BAR_SCALE = 4.6;

/** Sampled arc along the ring (handles sweeps > π, unlike SVG arc flags). */
function arcPath(a0: number, sweep: number, radius: number): string {
  const n = Math.max(2, Math.ceil((Math.abs(sweep) / TAU) * 96));
  let d = '';
  for (let i = 0; i <= n; i++) {
    const p = ringPoint(a0 + (sweep * i) / n, radius);
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
  }
  return d;
}

/** A clockwise sweep with an arrowhead riding its tip. */
function SweepArc({
  a0,
  sweep,
  radius,
  v,
  color,
  width = 5,
}: {
  a0: number;
  sweep: number;
  radius: number;
  /** 0..1 draws, 1..2 fades */
  v: number;
  color: string;
  width?: number;
}) {
  if (v <= 0.002 || v >= 1.998) return null;
  const prog = Math.min(v, 1);
  const fade = v > 1 ? clamp01(2 - v) : 1;
  const aEnd = a0 + sweep * prog;
  const tip = ringPoint(aEnd, radius);
  const tangentDeg = (aEnd * 180) / Math.PI + 90;
  return (
    <g opacity={fade}>
      <path
        d={arcPath(a0, sweep * prog, radius)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        opacity={0.85}
      />
      <path
        d="M0 -5.5 L11 0 L0 5.5 Z"
        fill={color}
        transform={`translate(${tip.x}, ${tip.y}) rotate(${tangentDeg})`}
      />
    </g>
  );
}

function CountLabel({
  x,
  y,
  u,
  text,
  color,
}: {
  x: number;
  y: number;
  u: number;
  text: string;
  color: string;
}) {
  if (u <= 0.002) return null;
  return (
    <g transform={`translate(${x}, ${y}) scale(${0.8 + 0.2 * clamp01(u)})`} opacity={clamp01(u)}>
      <text textAnchor="middle" fill={color} fontSize={26} fontWeight={700}>
        {text}
      </text>
    </g>
  );
}

/* ----------------------------------------------------- beat 1: mod N */

function Strawman({ s, opacity }: { s: SceneState; opacity: number }) {
  const keysInP = s.get(scene.modKeysIn);
  const shift = s.get(scene.shiftU);
  const b4 = s.get(scene.bucket4U);
  const jumpP = s.get(scene.modJump);
  const countU = s.get(scene.modCountU);

  return (
    <g opacity={opacity}>
      {/* the three original buckets (they shuffle left to make room) */}
      {[0, 1, 2].map((b) => (
        <g key={b} transform={`translate(${bucketX(b, shift)}, ${BUCKET_Y})`}>
          <rect x={-65} y={-85} width={130} height={170} rx={14} fill={colors.PANEL} stroke={BUCKET_COLOR[b]} strokeWidth={2} />
          <text y={107} textAnchor="middle" fill={colors.MUTED} fontSize={16}>{`mod ${b}`}</text>
        </g>
      ))}
      {/* the newcomer */}
      {b4 > 0.002 && (
        <g transform={`translate(${BX4[3]}, ${BUCKET_Y}) scale(${0.7 + 0.3 * clamp01(b4)})`} opacity={Math.min(1, b4)}>
          <rect x={-65} y={-85} width={130} height={170} rx={14} fill={colors.PANEL} stroke={BUCKET_COLOR[3]} strokeWidth={2} />
          <text y={107} textAnchor="middle" fill={colors.MUTED} fontSize={16}>mod 3</text>
        </g>
      )}

      {/* twelve keys: drop in, then (mostly) rehash into new homes */}
      {MOD_B3.map((b3, i) => {
        const inU = win(keysInP, 12, i, 5);
        if (inU <= 0) return null;
        const inE = ease.enter(inU);
        const jE = ease.move(win(jumpP, 12, i, 4));
        const b4i = MOD_B4[i];
        const from = slotPos(b3, MOD_SLOT3[i], shift);
        const to = slotPos(b4i, MOD_SLOT4[i], shift);
        const hop = b3 !== b4i ? 85 : 18;
        const x = lerp(from.x, to.x, jE);
        const y = lerp(from.y, to.y, jE) - Math.sin(Math.PI * jE) * hop - 46 * (1 - inE);
        return (
          <circle key={i} cx={x} cy={y} r={11} fill={mix(BUCKET_COLOR[b3], BUCKET_COLOR[b4i], jE)} stroke={colors.BG} strokeWidth={1.5} opacity={inE} />
        );
      })}

      <MathLabel tex="h(k) \bmod 3" x={640} y={168} fontSize={30} opacity={s.get(scene.mod3U)} />
      <MathLabel tex="h(k) \bmod 4" x={640} y={168} fontSize={30} opacity={s.get(scene.mod4U)} />
      <CountLabel x={640} y={240} u={countU} text={`${MOD_MOVED} of 12 keys moved`} color={colors.NEGATIVE} />
    </g>
  );
}

/* -------------------------------------------------------- the ring */

function Ring({ s }: { s: SceneState }) {
  const ringV = s.get(scene.ringU);
  if (ringV <= 0.002) return null;

  const landP = s.get(scene.keyLand);
  const waveP = s.get(scene.colorWave);
  const uAddV = s.get(scene.uAdd);
  const uRemoveV = s.get(scene.uRemove);
  const vP = s.get(scene.uVnode);
  const vColorMix = ease.move(clamp01((vP - 0.3) / 0.7));
  const pAdd = pulseOf(s.get(scene.pulseAdd));
  const pRemove = pulseOf(s.get(scene.pulseRemove));
  const pVnode = pulseOf(s.get(scene.pulseVnode));
  const bDeadV = s.get(scene.bDead);
  const arcV = [s.get(scene.arc1), s.get(scene.arc2), s.get(scene.arc3)];
  const primaryFade = clamp01(vP * 2.5);

  const srvU: Record<ServerId, number> = {
    A: s.get(scene.srvA),
    B: s.get(scene.srvB),
    C: s.get(scene.srvC),
    D: s.get(scene.srvD),
  };
  const glowD = Math.min(1, pAdd + pRemove);
  const topTick0 = ringPoint(-Math.PI / 2, RING.r - 9);
  const topTick1 = ringPoint(-Math.PI / 2, RING.r + 9);

  return (
    <g>
      {/* the ring draws on via dashoffset, starting at 12 o'clock */}
      <circle
        cx={RING.cx}
        cy={RING.cy}
        r={RING.r}
        fill="none"
        stroke={colors.MUTED}
        strokeWidth={2.5}
        opacity={0.55}
        strokeDasharray={RING_C}
        strokeDashoffset={RING_C * (1 - ringV)}
        transform={`rotate(-90 ${RING.cx} ${RING.cy})`}
      />
      <line x1={topTick0.x} y1={topTick0.y} x2={topTick1.x} y2={topTick1.y} stroke={colors.MUTED} strokeWidth={2} opacity={0.7 * ringV} />
      <MathLabel tex="0 \equiv 2^{32}" x={584} y={62} fontSize={16} color={colors.MUTED} anchor="start" opacity={0.9 * ringV} />

      {/* beat-3 rule demos: walk clockwise until you hit a server */}
      {EXAMPLE_KEYS.map((k, j) => {
        const owner = OWNER0[k];
        const a0 = KEY_ANGLES[k];
        return (
          <SweepArc
            key={`ex${k}`}
            a0={a0}
            sweep={cwDelta(a0, SERVER_ANGLE[owner])}
            radius={RING.r - 18}
            v={arcV[j]}
            color={SERVER_COLOR[owner]}
          />
        );
      })}
      {/* beat-5 handoff: B's keys keep walking to the next survivor */}
      <SweepArc
        a0={SERVER_ANGLE.B}
        sweep={cwDelta(SERVER_ANGLE.B, SERVER_ANGLE[B_SUCCESSOR])}
        radius={RING.r + 18}
        v={s.get(scene.handoffU)}
        color={colors.NEGATIVE}
      />

      {/* forty keys, colored by whoever they walk into */}
      {KEY_ANGLES.map((a, i) => {
        const landU = win(landP, 40, i, 8);
        if (landU <= 0) return null;
        const e = ease.enter(landU);
        const exIdx = EXAMPLE_KEYS.indexOf(i);
        const exMix = exIdx >= 0 ? clamp01((arcV[exIdx] - 0.92) / 0.16) : 0;
        const waveMix = ease.move(win(waveP, 40, KEY_RANK[i], 10));
        let c = mix(colors.MUTED, C0[i], Math.max(exMix, waveMix));
        c = mix(c, C1[i], uAddV);
        c = mix(c, C2[i], uRemoveV);
        c = mix(c, C3[i], vColorMix);
        const p = Math.min(
          1,
          (MOVED_BY_ADD[i] ? pAdd : 0) +
            (MOVED_BY_REMOVE[i] ? pRemove : 0) +
            (MOVED_BY_VNODE[i] ? pVnode : 0),
        );
        const pos = ringPoint(a, RING.r + 26 * (1 - e));
        const haloU = exIdx >= 0 && arcV[exIdx] < 1.9 ? clamp01(Math.min(arcV[exIdx], 1) * 4) * clamp01(2 - arcV[exIdx]) : 0;
        return (
          <g key={i} opacity={e}>
            {p > 0.01 && <circle cx={pos.x} cy={pos.y} r={6 + 10 * p} fill="none" stroke={c} strokeWidth={2} opacity={0.45 * p} />}
            {haloU > 0.01 && <circle cx={pos.x} cy={pos.y} r={12} fill="none" stroke={c} strokeWidth={2} opacity={0.9 * haloU} />}
            <circle cx={pos.x} cy={pos.y} r={6 + 3.5 * p} fill={c} stroke={colors.BG} strokeWidth={1.2} />
          </g>
        );
      })}

      {/* virtual nodes scatter along the ring (mark 0 barely moves) */}
      {VNODE_MARKS.map((m, i) => {
        const mj = win(vP, 12, i, 5);
        if (mj <= 0) return null;
        const e = ease.move(mj);
        const home = SERVER_ANGLE[m.server];
        const angle = home + shortestDelta(home, m.angle) * e;
        const pos = ringPoint(angle, RING.r);
        return (
          <circle key={`vn${i}`} cx={pos.x} cy={pos.y} r={5.5 * clamp01(mj * 4)} fill={SERVER_COLOR[m.server]} stroke={colors.BG} strokeWidth={1.2} />
        );
      })}

      {/* servers: a dot on the ring + a labeled badge just outside it */}
      {(['A', 'B', 'C', 'D'] as ServerId[]).map((id) => {
        const u = srvU[id];
        if (u <= 0.002) return null;
        const angle = SERVER_ANGLE[id];
        const dot = ringPoint(angle, RING.r);
        const badge = ringPoint(angle, BADGE_R);
        const dotOpacity =
          Math.min(1, u) * (id === 'B' ? 1 - bDeadV : 1) * (id === 'B' ? 1 : 1 - primaryFade);
        return (
          <g key={id}>
            {dotOpacity > 0.01 && <circle cx={dot.x} cy={dot.y} r={7} fill={SERVER_COLOR[id]} stroke={colors.BG} strokeWidth={1.5} opacity={dotOpacity} />}
            {id === 'B' && bDeadV > 0.01 && (
              <text x={dot.x} y={dot.y + 8} textAnchor="middle" fill={colors.NEGATIVE} fontSize={24} fontWeight={700} opacity={bDeadV}>
                ✕
              </text>
            )}
            <NodeBadge
              x={badge.x}
              y={badge.y}
              w={56}
              h={38}
              label={id}
              color={SERVER_COLOR[id]}
              u={u}
              glow={id === 'D' ? glowD : 0}
              dim={id === 'B' ? bDeadV : 0}
              labelSize={19}
            />
          </g>
        );
      })}

      <CountLabel x={1080} y={132} u={s.get(scene.addCountU)} text={`${MOVED_ADD} of 40 moved`} color={colors.WARM} />
      <CountLabel x={1080} y={132} u={s.get(scene.removeCountU)} text={`${MOVED_REMOVE} of 40 moved`} color={colors.NEGATIVE} />
    </g>
  );
}

/* -------------------------------------- beat 6: per-server load bars */

function LoadBars({ s }: { s: SceneState }) {
  const u = clamp01(s.get(scene.barsU));
  if (u <= 0.002) return null;
  const morph = s.get(scene.barMorph);
  return (
    <g opacity={u}>
      <text x={BAR_X0 + BAR_STEP} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        keys per server
      </text>
      <line x1={BAR_X0 - 44} y1={BAR_BASE + 0.5} x2={BAR_X0 + 2 * BAR_STEP + 44} y2={BAR_BASE + 0.5} stroke={colors.GRID} strokeWidth={1.5} />
      {LOAD_SERVERS.map((id, j) => {
        const v = lerp(LOAD_BEFORE[j], LOAD_AFTER[j], morph);
        const h = v * BAR_SCALE * u;
        const x = BAR_X0 + j * BAR_STEP;
        return (
          <g key={id}>
            <rect x={x - BAR_W / 2} y={BAR_BASE - h} width={BAR_W} height={h} rx={5} fill={SERVER_COLOR[id]} opacity={0.85} />
            <text x={x} y={BAR_BASE - h - 9} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={600}>
              {Math.round(v)}
            </text>
            <text x={x} y={BAR_BASE + 22} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
              {id}
            </text>
          </g>
        );
      })}
      <MathLabel tex="\text{keys moved} \approx K/n" x={BAR_X0 + BAR_STEP} y={430} fontSize={23} color={colors.WARM} opacity={s.get(scene.texU)} />
    </g>
  );
}

/** Pure render: SceneState in, SVG out. */
function renderFrame(s: SceneState) {
  const modV = s.get(scene.modU);
  return (
    <g>
      {modV > 0.002 && <Strawman s={s} opacity={modV} />}
      <Ring s={s} />
      <LoadBars s={s} />
    </g>
  );
}

export function ConsistentHashing() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {renderFrame}
      </Player>
    </div>
  );
}
