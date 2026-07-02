import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease, stagger } from '../core';
import { NodeBadge, TimerArc } from './node-badge';
import { Packet } from './packet';

/**
 * NodeBadge catalog: three badges stagger in with kind colors, the leader
 * gets a glow pulse (tweened up and down), a packet travels client → leader
 * from one 0..1 channel, a timer arc counts down, and the replica goes
 * dashed + dim as if partitioned away.
 */
const NODES = [
  { x: 300, y: 300, label: 'client', sublabel: 'ACCENT', color: colors.ACCENT },
  { x: 640, y: 300, label: 'leader', sublabel: 'POSITIVE', color: colors.POSITIVE },
  { x: 980, y: 300, label: 'replica', sublabel: 'SECONDARY', color: colors.SECONDARY },
];

function buildDemo() {
  const tl = new Timeline();
  const us = NODES.map((_, i) => tl.channel(`node${i}`, 0));
  const glow = tl.channel('glow', 0);
  const pkt = tl.channel('pkt', 0);
  const timer = tl.channel('timer', 1); // remaining fraction, 1 → 0
  const dimC = tl.channel('dimC', 0);

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.2, text: 'Badges stagger in — kind colors from the shelf palette.' });
  stagger(us.length, { at: 0.6, each: 0.16, dur: 0.7, ease: ease.pop }).forEach((o, i) =>
    tl.tween(us[i], 1, o),
  );
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.6, text: 'A glow channel pulses emphasis; a packet is one 0→1 channel.' });
  tl.tween(glow, 1, { at: t - 3.2, dur: 0.6, ease: ease.pulse });
  tl.tween(glow, 0, { at: t - 2.6, dur: 0.6, ease: ease.pulse });
  tl.tween(glow, 1, { at: t - 2.0, dur: 0.6, ease: ease.pulse });
  tl.tween(glow, 0, { at: t - 1.4, dur: 0.6, ease: ease.pulse });
  tl.tween(pkt, 1, { at: t - 2.6, dur: 1.3, ease: ease.linear });
  t = tl.hold(t, 0.7);

  t = tl.caption({ at: t, dur: 3.6, text: 'A timer arc counts down; dashed + dim marks a partitioned node.' });
  tl.tween(timer, 0, { at: t - 3.2, dur: 2.2, ease: ease.linear });
  tl.tween(dimC, 1, { at: t - 2.4, dur: 0.9, ease: ease.move });
  tl.hold(t, 1.1);

  return { tl, us, glow, pkt, timer, dimC };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const dim = s.get(demo.dimC);
          return (
            <>
              <NodeBadge {...NODES[0]} u={s.get(demo.us[0])} />
              <NodeBadge {...NODES[1]} u={s.get(demo.us[1])} glow={s.get(demo.glow)} />
              <NodeBadge {...NODES[2]} u={s.get(demo.us[2])} dashed={dim > 0.01} dim={dim} />
              <TimerArc
                cx={1085}
                cy={252}
                r={13}
                u={s.get(demo.timer)}
                color={colors.WARM}
                opacity={s.get(demo.us[2])}
              />
              <Packet
                from={{ x: NODES[0].x + 78, y: NODES[0].y }}
                to={{ x: NODES[1].x - 78, y: NODES[1].y }}
                u={s.get(demo.pkt)}
                color={colors.ACCENT}
                label="msg"
              />
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/NodeBadge',
  component: Demo,
};
export default meta;

export const BadgesGlowTimerPacket: StoryObj<typeof Demo> = {};
