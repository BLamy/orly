import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease } from '../core';
import { JsonDoc, layoutJson } from './json-doc';
import { TokenFlight } from './token-flight';
import { shortHex } from './sha256';

/**
 * JsonDoc catalog: a real NIP-01 nostr event lays out with syntax colors and
 * per-token anchors. Lines stagger in from one reveal channel, a focus
 * spotlight sweeps the fields, and finally the pubkey VALUE flies out of the
 * document to become a labeled chip — the JSON ↔ picture morph idiom.
 */
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

const EVENT = {
  id: 'a9f81d2c1c8fbe4443ba0a19f32b4b382cd9bafb90d1a2a0b83c3f21c5cf10da',
  pubkey: '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7',
  created_at: 1700000000,
  kind: 1,
  tags: [
    ['e', 'b31c5a2f9e4d7c8a1f0b3d5e7a9c2e4f6a8b0d1c3e5f7a9b1d3f5a7c9e1b3d5f'],
    ['p', '4c8a2e6f0b3d7a1c5e9f2b6d0a4c8e2f6b0d4a8c2e6f0a4b8d2c6e0f4a8b2d6e'],
  ],
  content: 'hello nostr',
  sig: '7d4e…',
};

const LAYOUT = layoutJson(EVENT, {
  x: 110,
  y: 120,
  fontSize: 16,
  abbrev: (_p, raw) => (raw.length > 26 ? shortHex(raw) : raw),
});

const FIELDS = ['id', 'pubkey', 'created_at', 'kind', 'tags', 'content', 'sig'];
const PK = LAYOUT.anchor('pubkey');
const CHIP = { x: 980, y: 300 };

function buildDemo() {
  const tl = new Timeline();
  const reveal = tl.channel('reveal', 0);
  const focusF = tl.channel('focusF', -1); // floored → which field is spotlit
  const focusU = tl.channel('focusU', 0);
  const flyU = tl.channel('flyU', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.6, text: 'A real NIP-01 event: keys, strings, numbers, and arrays each get a color — and every token gets an anchor.' });
  tl.tween(reveal, 1, { at: 0.6, dur: 2.2, ease: ease.draw });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 5.2, text: 'A focus spotlight sweeps the seven fields; everything off-path drops to a whisper.' });
  tl.tween(focusU, 1, { at: t - 4.8, dur: 0.5, ease: ease.enter });
  tl.set(focusF, 0, t - 4.6);
  tl.tween(focusF, FIELDS.length - 1, { at: t - 4.4, dur: 3.6, ease: ease.linear });
  tl.tween(focusU, 0, { at: t - 0.6, dur: 0.5, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 4.6, text: 'And the morph idiom: anchor a value, blank its slot, and fly it out to live somewhere else.' });
  tl.tween(flyU, 1, { at: t - 3.8, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.6);

  t = tl.caption({ at: t, dur: 3.2, text: 'The return trip is the same flight, run backwards.' });
  tl.tween(flyU, 0, { at: t - 2.6, dur: 1.4, ease: ease.move });
  tl.hold(t, 1.0);

  return { tl, reveal, focusF, focusU, flyU };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const focusU = s.get(demo.focusU);
          const fi = Math.round(s.get(demo.focusF));
          const flyU = s.get(demo.flyU);
          const focus = focusU > 0 && fi >= 0 ? [FIELDS[Math.min(fi, FIELDS.length - 1)]] : undefined;
          return (
            <>
              <JsonDoc
                layout={LAYOUT}
                reveal={s.get(demo.reveal)}
                focus={focus}
                focusU={focusU}
                hidden={flyU > 0 ? ['pubkey'] : undefined}
              />
              <TokenFlight
                from={{ x: PK.cx, y: PK.cy + 5 }}
                to={{ x: CHIP.x, y: CHIP.y + 5 }}
                u={flyU}
                text={shortHex(EVENT.pubkey)}
                fill={colors.POSITIVE}
                fontSize={15}
                toScale={1.1}
              />
              {flyU >= 1 && (
                <g>
                  <rect x={CHIP.x - 90} y={CHIP.y - 42} width={180} height={64} rx={10} fill="none" stroke={colors.POSITIVE} opacity={0.7} />
                  <text x={CHIP.x} y={CHIP.y - 22} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                    author
                  </text>
                </g>
              )}
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/JsonDoc',
  component: Demo,
};
export default meta;

export const NostrEvent: StoryObj<typeof Demo> = {};
