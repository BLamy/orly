import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import { BitField } from './bit-field';
import { hexToBits, leadingZeroBits, sha256Hex, shortHex } from './sha256';

/**
 * BitField catalog — every digest here is a REAL SHA-256 (the primitive ships
 * its own verified implementation). Three moves: settle (rounds churn, then
 * bits lock on), avalanche (one character changes ≈ half the bits), and the
 * NIP-13 proof-of-work zero-run (a genuinely mined nonce).
 */
if (sha256Hex('abc') !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') {
  throw new Error('sha256 self-test failed');
}

const MSG_A = 'hello nostr';
const MSG_B = 'hello nostr!';
const HEX_A = sha256Hex(MSG_A);
const HEX_B = sha256Hex(MSG_B);
const BITS_A = hexToBits(HEX_A);
const BITS_B = hexToBits(HEX_B);
const FLIPPED = BITS_A.reduce((n, b, i) => n + (b !== BITS_B[i] ? 1 : 0), 0);

// NIP-13: mine a real nonce until the id clears 10 bits of difficulty.
const DIFFICULTY = 10;
const NONCE = (() => {
  for (let n = 0; ; n++) {
    if (leadingZeroBits(sha256Hex(`nostr:pow:${n}`)) >= DIFFICULTY) return n;
  }
})();
const POW_HEX = sha256Hex(`nostr:pow:${NONCE}`);
const POW_BITS = hexToBits(POW_HEX);

const GA = { x: 120, y: 150 };
const GB = { x: 500, y: 150 };
const GP = { x: 880, y: 150 };
const CELL = 15;
const GRID_W = 16 * (CELL + 3) - 3;

function buildDemo() {
  const tl = new Timeline();
  const revealA = tl.channel('revealA', 0);
  const settleA = tl.channel('settleA', 0);
  const revealB = tl.channel('revealB', 0);
  const settleB = tl.channel('settleB', 0);
  const diffU = tl.channel('diffU', 0);
  const revealP = tl.channel('revealP', 0);
  const settleP = tl.channel('settleP', 0);
  const zeroU = tl.channel('zeroU', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 4.6, text: 'Two hundred fifty six bits of real SHA-256: the rounds churn, then every cell locks onto the true digest.' });
  tl.tween(revealA, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(settleA, 1, { at: 1.6, dur: 2.4, ease: ease.linear });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.4, text: `Add one exclamation mark and ${FLIPPED} of 256 bits flip — the avalanche that makes an event id a fingerprint.` });
  tl.tween(revealB, 1, { at: t - 5.0, dur: 1.2, ease: ease.draw });
  tl.tween(settleB, 1, { at: t - 4.2, dur: 2.0, ease: ease.linear });
  tl.tween(diffU, 1, { at: t - 1.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.6, text: `And NIP-13 proof of work: nonce ${NONCE}, mined for real, buys ${DIFFICULTY} leading zero bits.` });
  tl.tween(revealP, 1, { at: t - 5.2, dur: 1.2, ease: ease.draw });
  tl.tween(settleP, 1, { at: t - 4.4, dur: 2.0, ease: ease.linear });
  tl.tween(zeroU, 1, { at: t - 2.0, dur: 0.7, ease: ease.pop });
  tl.hold(t, 1.2);

  return { tl, revealA, settleA, revealB, settleB, diffU, revealP, settleP, zeroU };
}

const demo = buildDemo();

function Label({ x, text, sub }: { x: number; text: string; sub: string }) {
  return (
    <g>
      <text x={x} y={128} fill={colors.TEXT} fontSize={14} fontFamily="monospace">{text}</text>
      <text x={x} y={470} fill={colors.MUTED} fontSize={12} fontFamily="monospace">{sub}</text>
    </g>
  );
}

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <>
            <BitField bits={BITS_A} x={GA.x} y={GA.y} cell={CELL} reveal={s.get(demo.revealA)} settle={s.get(demo.settleA)} seed={1} />
            {s.get(demo.revealA) > 0 && <Label x={GA.x} text={`"${MSG_A}"`} sub={shortHex(HEX_A, 12, 6)} />}
            <BitField bits={BITS_B} x={GB.x} y={GB.y} cell={CELL} reveal={s.get(demo.revealB)} settle={s.get(demo.settleB)} diff={BITS_A} diffU={s.get(demo.diffU)} seed={2} />
            {s.get(demo.revealB) > 0 && <Label x={GB.x} text={`"${MSG_B}"`} sub={shortHex(HEX_B, 12, 6)} />}
            <BitField bits={POW_BITS} x={GP.x} y={GP.y} cell={CELL} reveal={s.get(demo.revealP)} settle={s.get(demo.settleP)} zeroRunU={s.get(demo.zeroU)} onColor={colors.SECONDARY} seed={3} />
            {s.get(demo.revealP) > 0 && <Label x={GP.x} text={`pow · nonce ${NONCE}`} sub={shortHex(POW_HEX, 12, 6)} />}
            {s.get(demo.diffU) > 0 && (
              <text x={GB.x + GRID_W / 2} y={505} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} opacity={s.get(demo.diffU)}>
                {FLIPPED}/256 bits flipped
              </text>
            )}
            {s.get(demo.zeroU) > 0 && (
              <text x={GP.x + GRID_W / 2} y={505} textAnchor="middle" fill={colors.WARM} fontSize={13} opacity={s.get(demo.zeroU)}>
                {DIFFICULTY}+ leading zero bits
              </text>
            )}
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/BitField',
  component: Demo,
};
export default meta;

export const RealSha256: StoryObj<typeof Demo> = {};
