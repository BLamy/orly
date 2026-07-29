// Nostr Implementation Possibilities №6 — Proof of Work, chapter 3.
// The committed target. NIP-13: the nonce tag's third slot SHOULD carry the
// target difficulty, so relays can judge intent, not luck — "clients MAY
// reject a note matching a target difficulty if it is missing a difficulty
// commitment." ACHIEVED below is a real dataset: 120 events actually mined
// to a committed target of 6 with the toolkit sha256, keeping each event's
// achieved difficulty. Three of them got lucky and hit 13 bits — the exact
// spam scenario the spec's commitment rule exists to stop. Two samples are
// re-mined at module load to keep the dataset honest (throws on mismatch).
import {
  CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { leadingZeroBits, sha256Hex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The real mined population (offline run; target 6; content "spam <i>").
// ---------------------------------------------------------------------------
const ACHIEVED = [
  8, 6, 6, 6, 8, 6, 6, 6, 7, 8, 6, 7, 6, 8, 7, 7, 7, 6, 6, 7, 7, 6, 6, 13,
  8, 6, 6, 6, 7, 6, 6, 7, 6, 6, 6, 7, 6, 7, 13, 6, 7, 6, 6, 8, 7, 6, 10, 7,
  7, 9, 6, 8, 10, 6, 6, 13, 7, 7, 6, 8, 6, 6, 6, 8, 7, 6, 6, 7, 8, 6, 6, 7,
  8, 6, 6, 6, 9, 7, 6, 6, 6, 8, 6, 7, 6, 6, 6, 11, 7, 8, 6, 7, 6, 7, 7, 9,
  8, 8, 6, 6, 7, 6, 7, 6, 6, 6, 6, 7, 7, 7, 6, 7, 8, 9, 9, 6, 11, 6, 7, 6,
];
const TARGET = 6;
const STRICT = 13;

// spot-check the dataset is reproducible (re-mine events 0 and 23 for real)
const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const remine = (e: number): number => {
  for (let n = 0; n < 100000; n++) {
    const id = sha256Hex(JSON.stringify([0, PUBKEY, 1700000000 + e, 1, [['nonce', String(n), String(TARGET)]], `spam ${e}`]));
    const d = leadingZeroBits(id);
    if (d >= TARGET) return d;
  }
  return -1;
};
if (remine(0) !== ACHIEVED[0] || remine(23) !== ACHIEVED[23]) {
  throw new Error('mined population drifted from the recorded run');
}

const LUCKY = ACHIEVED.map((d, i) => [d, i] as const).filter(([d]) => d >= STRICT).map(([, i]) => i);
const COUNTS = new Map<number, number>();
for (const d of ACHIEVED) COUNTS.set(d, (COUNTS.get(d) ?? 0) + 1);

// histogram layout: difficulty 6..14 → columns of dots packed 4-wide so the
// 59-deep six-bit column stays on stage
const HIST = { x: 250, y0: 520, colW: 84, dot: 5.5, pitch: 13.5 };
const histX = (d: number) => HIST.x + (d - TARGET) * HIST.colW;
// dot index within its column, per event, in arrival order
const columnSlot: number[] = (() => {
  const seen = new Map<number, number>();
  return ACHIEVED.map((d) => {
    const k = seen.get(d) ?? 0;
    seen.set(d, k + 1);
    return k;
  });
})();
const dotPos = (i: number) => {
  const k = columnSlot[i];
  return {
    x: histX(ACHIEVED[i]) + ((k % 4) - 1.5) * HIST.pitch,
    y: HIST.y0 - Math.floor(k / 4) * HIST.pitch,
  };
};

const GATE = { x: 1020, y: 300 };

const CAM_FARM: CameraState = { x: 560, y: 330, k: 1.15 };
const CAM_GATE: CameraState = { x: 860, y: 330, k: 1.15 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  farmU: ChannelRef<number>;
  rainU: ChannelRef<number>;
  luckyU: ChannelRef<number>;
  gateU: ChannelRef<number>;
  slipU: ChannelRef<number>;
  commitU: ChannelRef<number>;
  bounceU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const farmU = tl.channel('farmU', 0);
  const rainU = tl.channel('rainU', 0);
  const luckyU = tl.channel('luckyU', 0);
  const gateU = tl.channel('gateU', 0);
  const slipU = tl.channel('slipU', 0);
  const commitU = tl.channel('commitU', 0);
  const bounceU = tl.channel('bounceU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the spam farm.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Meet a spam operation. It mines every message, but cheaply — aiming for just six bits of work each, about a hundred hashes a note. Pocket change, at industrial scale.',
  });
  tl.tween(farmU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_FARM, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the population rains down.
  tl.caption({
    at: 7.0,
    dur: 6.4,
    text: 'Here are one hundred twenty of its notes — really mined, every one. Most land exactly at six or seven bits. But a hash is a coin, and coins have moods: watch the tail on the right.',
  });
  tl.tween(rainU, 1, { at: 7.4, dur: 4.6, ease: ease.linear });
  tl.hold(13.4, 0.7);

  // Beat 3 — the lucky three.
  tl.caption({
    at: 14.1,
    dur: 5.8,
    text: 'Three of them got lucky — thirteen zero bits, from a miner that only paid for six. Twice the difficulty it aimed at, for free. Luck like that arrives on schedule when you buy enough tickets.',
  });
  tl.tween(luckyU, 1, { at: 14.8, dur: 1.4, ease: ease.pop });
  tl.hold(19.9, 0.7);

  // Beat 4 — the strict relay, fooled by luck.
  tl.caption({
    at: 20.6,
    dur: 6.2,
    text: 'Now a strict relay that wants thirteen bits of commitment. If it judged the hash alone, those three lucky notes would stroll right past the door — spam wearing a rented tuxedo.',
  });
  tl.tween(cam, CAM_GATE, { at: 20.8, dur: 1.4, ease: ease.move });
  tl.tween(gateU, 1, { at: 21.4, dur: 0.9, ease: ease.enter });
  tl.tween(slipU, 1, { at: 22.6, dur: 2.4, ease: ease.linear });
  tl.hold(26.8, 0.7);

  // Beat 5 — the commitment.
  tl.caption({
    at: 27.5,
    dur: 6.4,
    text: 'This is why the third slot of the nonce tag exists. The miner wrote six in there — a signed confession of what it was actually aiming for. The spec says relays may judge that commitment, not the luck.',
  });
  tl.tween(commitU, 1, { at: 28.4, dur: 1.2, ease: ease.move });
  tl.hold(33.9, 0.7);

  // Beat 6 — bounced.
  tl.caption({
    at: 34.6,
    dur: 5.8,
    text: 'Committed target: six. Required: thirteen. All three bounce — the same lucky hashes, rejected for what they aimed at. And a note with no commitment at all can be refused on sight.',
  });
  tl.tween(bounceU, 1, { at: 35.4, dur: 1.4, ease: ease.move });
  tl.hold(40.4, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 41.1,
    dur: 5.6,
    text: 'Proof of work is not about one lucky hash — it is a declared price, paid in public. Next: what happens when the device that wants to speak is too small to pay it.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 41.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 41.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.5, dur: 1.0, ease: ease.enter });
  tl.hold(46.7, 1.2);

  return {
    tl, cam, farmU, rainU, luckyU, gateU, slipU, commitU, bounceU, dimU, closeU,
  };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const farmU = s.get(scene.farmU);
  const rainU = s.get(scene.rainU);
  const luckyU = s.get(scene.luckyU);
  const gateU = s.get(scene.gateU);
  const slipU = s.get(scene.slipU);
  const commitU = s.get(scene.commitU);
  const bounceU = s.get(scene.bounceU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* the farm */}
          {farmU > 0 && (
            <g opacity={farmU}>
              <rect x={96} y={150} width={220} height={92} rx={12} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              <text x={120} y={186} fill={colors.NEGATIVE} fontSize={15} fontWeight={600}>
                spam farm
              </text>
              <text x={120} y={210} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                target: {TARGET} bits · ~2⁶ hashes/note
              </text>
            </g>
          )}

          {/* the histogram of real achieved difficulties */}
          {rainU > 0 && (
            <g>
              {/* axis */}
              <line x1={histX(TARGET) - 40} y1={HIST.y0 + 18} x2={histX(14) + 40} y2={HIST.y0 + 18} stroke={colors.GRID} strokeWidth={1.5} opacity={Math.min(1, rainU * 3)} />
              {[6, 7, 8, 9, 10, 11, 12, 13].map((d) => (
                <text key={d} x={histX(d)} y={HIST.y0 + 40} textAnchor="middle" fill={d >= STRICT ? colors.WARM : colors.MUTED} fontSize={12} fontFamily="monospace" opacity={Math.min(1, rainU * 3)}>
                  {d}
                </text>
              ))}
              <text x={histX(9) + 40} y={HIST.y0 + 62} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} opacity={Math.min(1, rainU * 3)}>
                achieved difficulty, 120 genuinely mined notes
              </text>
              {ACHIEVED.map((d, i) => {
                const u = clamp01(rainU * ACHIEVED.length * 1.1 - i);
                if (u <= 0) return null;
                const p = dotPos(i);
                const lucky = d >= STRICT;
                const gone = lucky && bounceU >= 1;
                // lucky dots drift toward the gate during the slip beat, then return on bounce
                const drift = lucky ? clamp01(slipU) * (1 - clamp01(bounceU)) : 0;
                const x = p.x + (GATE.x - 90 - p.x) * drift;
                const y = p.y - 260 * (1 - u) + (GATE.y - p.y) * drift;
                return (
                  <g key={i} opacity={u * (gone ? 0.35 : 1)}>
                    <circle
                      cx={x}
                      cy={y}
                      r={HIST.dot}
                      fill={lucky ? colors.WARM : colors.ACCENT}
                      opacity={lucky ? 0.95 : 0.7}
                      stroke={lucky && luckyU > 0 ? colors.WARM : 'none'}
                      strokeWidth={2}
                    />
                    {lucky && luckyU > 0 && drift === 0 && (
                      <text x={x} y={y - 14} textAnchor="middle" fill={colors.WARM} fontSize={11} opacity={luckyU}>
                        {d} bits
                      </text>
                    )}
                  </g>
                );
              })}
              {luckyU > 0 && (
                <text x={histX(13)} y={HIST.y0 - 120} textAnchor="middle" fill={colors.WARM} fontSize={13} fontWeight={600} opacity={luckyU * (1 - slipU)}>
                  {LUCKY.length} lucky hits
                </text>
              )}
            </g>
          )}

          {/* the strict relay gate */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <rect x={GATE.x - 60} y={GATE.y - 120} width={150} height={240} rx={12} fill={colors.PANEL} stroke={bounceU > 0 ? colors.NEGATIVE : colors.GRID} />
              <text x={GATE.x + 15} y={GATE.y - 88} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
                strict relay
              </text>
              <text x={GATE.x + 15} y={GATE.y - 66} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                require ≥ {STRICT} bits
              </text>
              {/* judgment line: flips from hash-only to commitment */}
              <text x={GATE.x + 15} y={GATE.y - 20} textAnchor="middle" fill={commitU > 0.5 ? colors.MUTED : colors.POSITIVE} fontSize={12} fontFamily="monospace" opacity={commitU > 0.5 ? 0.45 : 1}>
                zeros(id) = 13 ✓
              </text>
              {commitU > 0 && (
                <g opacity={commitU}>
                  <text x={GATE.x + 15} y={GATE.y + 10} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
                    tag says target "6"
                  </text>
                  <text x={GATE.x + 15} y={GATE.y + 34} textAnchor="middle" fill={bounceU > 0 ? colors.NEGATIVE : colors.TEXT} fontSize={12} fontFamily="monospace">
                    6 &lt; 13 → reject
                  </text>
                </g>
              )}
              {bounceU > 0 && (
                <g opacity={bounceU}>
                  <line x1={GATE.x - 34} y1={GATE.y + 74} x2={GATE.x + 64} y2={GATE.y + 74} stroke={colors.NEGATIVE} strokeWidth={2} />
                  <text x={GATE.x + 15} y={GATE.y + 98} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={600}>
                    all 3 bounced
                  </text>
                </g>
              )}
            </g>
          )}
        </g>
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Judged by what you aimed at
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            the committed target turns luck back into economics
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-13 · third slot SHOULD carry the target · missing commitment MAY be rejected
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
