// The probe ledger — one released chat row drawn as a writable record.
//
// Every value shown is a field of the U10 `day8-151` row in
// manifest/realcompanion_manifest.json (probe_dayid, signals.hint, locus,
// locus_verified, stage_b_counts, recent_context, profile_refs, episode_refs,
// tier, category, grounding_dayids, trace_e). The public manifest carries no
// conversation text, so the referent and the reply are drawn as withheld bars
// with an abstract texture — never as invented wording. The five comb teeth
// visualize the count `retrieved: 5`; only the verified tooth has a real
// identifier. This is a local renderer, not an upstream component.
import { colors } from '../../../core';
import { Chip, INK, Txt, clamp01, lerp } from './kit';

export const LEDGER = { x0: 110, x1: 890, top: 96, cx0: 175, cx1: 860 } as const;
export const BANDS = [
  { key: 'A', y0: 170, y1: 232, title: 'A — referent_text / locus' },
  { key: 'B', y0: 240, y1: 330, title: 'B — retrieve_distant_turns' },
  { key: 'C', y0: 338, y1: 410, title: 'C — categorize_turn' },
  { key: 'D', y0: 418, y1: 470, title: 'D — reply / grounding_dayids' },
  { key: 'E', y0: 478, y1: 530, title: 'E — ok / category_ok' },
] as const;
/** Frame bottom after n bands have opened (n may be fractional). */
const BOTTOMS = [162, 240, 338, 418, 478, 540];
export const ledgerBottom = (open: number): number => {
  const i = Math.min(4, Math.max(0, Math.floor(open)));
  return lerp(BOTTOMS[i], BOTTOMS[i + 1], clamp01(open - i));
};

// header tape: aggregate bins; three keyed by real identifiers
export const TAPE_Y = 142;
const TAPE_BINS = 46;
const TAPE_PITCH = (LEDGER.cx1 - LEDGER.cx0) / TAPE_BINS;
export const tapeX = (j: number): number => LEDGER.cx0 + (j + 0.5) * TAPE_PITCH;
const BIN_DISTANT = 10;
const BIN_RECENT = 40;
const BIN_PROBE = 41;
export const X_DISTANT = tapeX(BIN_DISTANT);
export const X_RECENT = tapeX(BIN_RECENT);
export const X_PROBE = tapeX(BIN_PROBE);

// evidence comb in band B: five candidate teeth, all before the probe
export const SPINE_Y = 284;
export const TOOTH_LEN = 26;
export const TEETH = [0, 1, 2, 3, 4].map((i) => X_DISTANT + i * 100);
export const SURVIVOR = 0;

// context sockets in band C
export const SOCKET_Y = 370;
export const SOCKET_H = 30;
export const SOCKETS = [
  { key: 'recent_context', x: 175, value: 'day8-150', color: INK.thread },
  { key: 'profile_refs', x: 405, value: '[ ]', color: INK.muted },
  { key: 'episode_refs', x: 635, value: 'day7-50', color: INK.distant },
] as const;
export const SOCKET_W = 210;

export const GROUNDING = { x: 500, y: 455 } as const;

// abstract withheld-text texture (deterministic dash runs)
const dashes = (x0: number, x1: number, seed: number): Array<{ x: number; w: number }> => {
  const out: Array<{ x: number; w: number }> = [];
  let x = x0 + 8;
  let k = seed;
  while (x < x1 - 14) {
    k = (k * 37 + 11) % 23;
    const w = Math.min(10 + k * 1.6, x1 - 8 - x);
    out.push({ x, w });
    x += w + 6;
  }
  return out;
};
const PROSE_A = dashes(290, 560, 5);
const PROSE_D = dashes(175, 470, 9);

export interface RowState {
  /** frame growth, 0…5 bands */
  open: number;
  /** per-band opacity A…E */
  bands: readonly number[];
  /** blank band shells (defaults to `bands`) — writable before written */
  shells?: readonly number[];
  /** header tape draw-on */
  tape: number;
  /** 0 = unverified yellow claim, 1 = verified */
  verified: number;
  hint: number;
  locus: number;
  /** comb: spine draw-on, per-tooth length, label opacities */
  spine: number;
  teeth: readonly number[];
  retrieved: number;
  verifiedCount: number;
  locusVerified: number;
  /** sockets entrance (0…1) and episode occupancy (1 = real row) */
  sockets: number;
  episode: number;
  tier: number;
  tierText: string;
  grounding: number;
  stamps: readonly number[];
  /** abstract text texture in the withheld bars */
  prose: number;
  /** 1 = inked ledger, 0 = structural stencil (fills recede, outlines stay) */
  ink: number;
  /** overall dim for supporting content */
  dim?: number;
}

function Withheld({ x0, x1, y, runs, prose, o }: { x0: number; x1: number; y: number; runs: typeof PROSE_A; prose: number; o: number }) {
  return (
    <g opacity={o}>
      <rect x={x0} y={y - 10} width={x1 - x0} height={20} rx={4} fill="none" stroke={INK.muted} strokeDasharray="4 3" opacity={0.7} />
      <g opacity={prose}>
        {runs.map((r, i) => (
          <rect key={i} x={r.x} y={y - 1.5} width={r.w} height={3} rx={1.5} fill={INK.muted} />
        ))}
      </g>
      <Txt x={(x0 + x1) / 2} y={y + 4} size={10} anchor="middle" fill={INK.muted} opacity={(1 - prose) * 0.9}>
        text withheld
      </Txt>
    </g>
  );
}

export function LedgerRow({ st }: { st: RowState }) {
  const bottom = ledgerBottom(st.open);
  const dim = st.dim ?? 1;
  const [a, b, c, d, e] = st.bands;
  const claimColor = st.verified > 0.5 ? INK.distant : INK.claim;
  return (
    <g opacity={dim}>
      {/* frame + gutter */}
      <rect x={LEDGER.x0} y={LEDGER.top} width={LEDGER.x1 - LEDGER.x0} height={bottom - LEDGER.top} rx={10} fill={INK.panel} fillOpacity={0.35 + 0.55 * st.ink} stroke={INK.muted} strokeOpacity={0.55} strokeWidth={1.2} />
      <line x1={158} y1={166} x2={158} y2={Math.max(166, bottom - 8)} stroke={colors.GRID} />

      {/* header: the tape the ledger is rolled out from */}
      <Txt x={LEDGER.cx0} y={120} size={12} mono fill={INK.text} opacity={st.tape}>
        U10 · probe_dayid: day8-151
      </Txt>
      <Txt x={LEDGER.cx1} y={120} size={12} mono anchor="end" fill={INK.muted} opacity={st.hint * 0.75}>
        signals.hint: basic
      </Txt>
      <g>
        {Array.from({ length: TAPE_BINS }, (_, j) => {
          const o = clamp01(st.tape * (TAPE_BINS + 4) - j);
          if (o <= 0 || j === BIN_DISTANT || j === BIN_RECENT || j === BIN_PROBE) return null;
          return <rect key={j} x={tapeX(j) - 4.5} y={TAPE_Y - 5} width={9} height={10} rx={1.5} fill={INK.thread} opacity={o * (j > BIN_PROBE ? 0.1 : 0.14 + 0.2 * st.ink)} />;
        })}
        <g opacity={clamp01(st.tape * 2 - 1)}>
          <rect x={X_DISTANT - 5.5} y={TAPE_Y - 8} width={11} height={16} rx={2} fill={claimColor} fillOpacity={st.verified * st.ink} stroke={claimColor} strokeWidth={1.5} />
          <rect x={X_RECENT - 4.5} y={TAPE_Y - 7} width={9} height={14} rx={2} fill={INK.thread} fillOpacity={st.ink} stroke={INK.thread} />
          <rect x={X_PROBE - 4.5} y={TAPE_Y - 7} width={9} height={14} rx={2} fill={INK.text} fillOpacity={st.ink} stroke={INK.text} />
          <rect x={X_PROBE - 8} y={TAPE_Y - 11} width={16} height={22} rx={4} fill="none" stroke={INK.text} strokeWidth={1.2} />
          <Txt x={X_PROBE - 3} y={TAPE_Y + 20} size={9.5} mono fill={INK.text}>
            day8-151
          </Txt>
          <Txt x={X_RECENT + 3} y={TAPE_Y + 20} size={9.5} mono anchor="end" fill={INK.thread}>
            day8-150
          </Txt>
          <Txt x={X_DISTANT} y={TAPE_Y + 20} size={9.5} mono anchor="middle" fill={INK.distant} opacity={st.verified}>
            day7-50
          </Txt>
        </g>
      </g>

      {/* band shells */}
      {BANDS.map((band, i) => {
        const o = (st.shells ?? st.bands)[i];
        if (o <= 0.003) return null;
        return (
          <g key={band.key}>
            <g opacity={o}>
              <rect x={118} y={band.y0} width={764} height={band.y1 - band.y0} rx={6} fill={INK.bg} fillOpacity={0.55 * st.ink} stroke={colors.GRID} />
              <Txt x={138} y={(band.y0 + band.y1) / 2 + 6} size={18} weight={700} anchor="middle" fill={INK.muted}>
                {band.key}
              </Txt>
            </g>
            <Txt x={LEDGER.cx0} y={band.y0 + 22} size={12} mono fill={INK.text} opacity={st.bands[i]}>
              {band.title}
            </Txt>
          </g>
        );
      })}

      {/* A — what the probe refers to, and where that would live */}
      <g opacity={a}>
        <Txt x={LEDGER.cx0} y={220} size={11.5} mono fill={INK.muted}>
          referent_text
        </Txt>
        <Withheld x0={290} x1={560} y={216} runs={PROSE_A} prose={st.prose} o={1} />
        <Chip x={600} y={216} anchor="start" text="locus: episode" color={INK.claim} opacity={st.locus} size={11.5} />
      </g>

      {/* B — the evidence comb */}
      <g opacity={b}>
        <Txt x={392} y={262} size={11} mono fill={INK.ok} opacity={st.locusVerified}>
          locus_verified: episode
        </Txt>
        <Txt x={742} y={262} size={12} mono anchor="end" fill={INK.claim} opacity={st.retrieved}>
          retrieved: 5
        </Txt>
        <Txt x={LEDGER.cx1} y={262} size={12} mono anchor="end" fill={INK.ok} opacity={st.verifiedCount}>
          verified: 1
        </Txt>
        <line x1={TEETH[0] - 18} y1={SPINE_Y} x2={lerp(TEETH[0] - 18, TEETH[4] + 18, st.spine)} y2={SPINE_Y} stroke={INK.muted} strokeWidth={2} strokeLinecap="round" />
        {TEETH.map((x, i) => {
          const len = st.teeth[i];
          const keep = i === SURVIVOR;
          const color = keep && st.verified > 0.5 ? INK.ok : INK.claim;
          if (len <= 0.003) return null;
          return (
            <g key={i}>
              <line x1={x} y1={SPINE_Y} x2={x} y2={SPINE_Y + TOOTH_LEN * len} stroke={color} strokeWidth={keep ? 3 : 2} strokeLinecap="round" opacity={0.35 + 0.65 * len} />
              <Txt x={x} y={324} size={9.5} anchor="middle" fill={INK.muted} opacity={(keep ? 1 - st.verified : 1) * clamp01(len * 2 - 1)}>
                candidate
              </Txt>
              {keep && (
                <Txt x={x} y={324} size={10.5} mono anchor="middle" fill={INK.ok} opacity={st.verified}>
                  day7-50
                </Txt>
              )}
            </g>
          );
        })}
      </g>

      {/* C — the tier follows the context that survives */}
      <g opacity={c}>
        <Txt x={LEDGER.cx1} y={360} size={13} mono weight={600} anchor="end" fill={INK.text} opacity={st.tier}>
          {st.tierText}
        </Txt>
        {SOCKETS.map((sk, i) => {
          const o = clamp01(st.sockets * 3 - i);
          const occ = sk.key === 'episode_refs' ? st.episode : 1;
          const empty = sk.key === 'profile_refs';
          return (
            <g key={sk.key} opacity={o}>
              <rect x={sk.x} y={SOCKET_Y} width={SOCKET_W} height={SOCKET_H} rx={5} fill={sk.color} fillOpacity={empty ? 0 : 0.1 * occ * st.ink} stroke={sk.color} strokeOpacity={0.75} strokeDasharray={empty ? '4 3' : undefined} />
              <Txt x={sk.x + 9} y={SOCKET_Y + 19} size={10.5} mono fill={INK.muted}>
                {sk.key}
              </Txt>
              <Txt x={sk.x + SOCKET_W - 9} y={SOCKET_Y + 19} size={11.5} mono anchor="end" fill={sk.color} opacity={occ}>
                {sk.value}
              </Txt>
              {sk.key === 'episode_refs' && (
                <Txt x={sk.x + SOCKET_W - 9} y={SOCKET_Y + 19} size={11.5} mono anchor="end" fill={INK.muted} opacity={1 - occ}>
                  [ ]
                </Txt>
              )}
            </g>
          );
        })}
      </g>

      {/* D — the reference reply and the turns it names */}
      <g opacity={d}>
        <Withheld x0={175} x1={470} y={GROUNDING.y} runs={PROSE_D} prose={st.prose} o={1} />
        <Chip x={GROUNDING.x} y={GROUNDING.y} anchor="start" text="grounding_dayids: [day7-50]" color={INK.distant} opacity={st.grounding} size={11} />
      </g>

      {/* E — the final check's recorded verdicts */}
      <g opacity={e}>
        <Chip x={420} y={504} anchor="start" text="ok: true" color={INK.ok} opacity={st.stamps[0]} size={11.5} />
        <Chip x={520} y={504} anchor="start" text="category_ok: true" color={INK.ok} opacity={st.stamps[1]} size={11.5} />
      </g>
    </g>
  );
}

/** The complete, verified row — chapter 3's end state and chapter 4's start. */
export const FULL_ROW: RowState = {
  open: 5,
  bands: [1, 1, 1, 1, 1],
  tape: 1,
  verified: 1,
  hint: 1,
  locus: 1,
  spine: 1,
  teeth: [1, 0.18, 0.18, 0.18, 0.18],
  retrieved: 1,
  verifiedCount: 1,
  locusVerified: 0,
  sockets: 1,
  episode: 1,
  tier: 1,
  tierText: 'hard / event_recall',
  grounding: 1,
  stamps: [1, 1],
  prose: 0.7,
  ink: 1,
};
