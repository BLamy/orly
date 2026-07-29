import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease, stagger } from '../core';
import { Connection } from './connection';
import { RequestFlow } from './flow';
import { ServiceNode } from './service';
import type { ServiceKind } from './service';

/**
 * RequestFlow catalog: a client → lb → server → db path, then ONE linear
 * 0→1 channel drives a whole round trip — the packet dwells at each hop
 * and retraces the path in the response color. A second beat fans two
 * parallel RequestFlows out of the balancer from two staggered channels.
 */
const HALF_W = 84;
const HALF_H = 28;

const CLIENT = { x: 160, y: 230 };
const LB = { x: 480, y: 230 };
const SERVER_A = { x: 800, y: 230 };
const DB = { x: 1120, y: 230 };
const SERVER_B = { x: 800, y: 450 };

const NODES: Array<{ kind: ServiceKind; label: string; sub?: string; x: number; y: number }> = [
  { kind: 'client', label: 'client', ...CLIENT },
  { kind: 'lb', label: 'lb', sub: 'load balancer', ...LB },
  { kind: 'server', label: 'server', sub: 'replica a', ...SERVER_A },
  { kind: 'db', label: 'db', sub: 'postgres', ...DB },
];

const C1 = { from: { x: CLIENT.x + HALF_W, y: 230 }, to: { x: LB.x - HALF_W, y: 230 } };
const C2 = { from: { x: LB.x + HALF_W, y: 230 }, to: { x: SERVER_A.x - HALF_W, y: 230 } };
const C3 = { from: { x: SERVER_A.x + HALF_W, y: 230 }, to: { x: DB.x - HALF_W, y: 230 } };
const C4 = { from: { x: LB.x, y: 230 + HALF_H }, to: { x: SERVER_B.x - HALF_W, y: SERVER_B.y } };

/** hop-by-hop waypoints — node centers, so the dwell lands ON each node */
const TRIP = [CLIENT, LB, SERVER_A, DB];
const FAN_A = [LB, SERVER_A];
const FAN_B = [LB, { x: LB.x, y: SERVER_B.y }, SERVER_B];

function buildDemo() {
  const tl = new Timeline();
  const uNodes = NODES.map((n) => tl.channel(`u:${n.kind}`, 0));
  const uEdges = [0, 1, 2].map((i) => tl.channel(`edge${i}`, 0));
  const reqU = tl.channel('reqU', 0);
  const uServerB = tl.channel('uServerB', 0);
  const uC4 = tl.channel('uC4', 0);
  const fan = [tl.channel('fanA', 0), tl.channel('fanB', 0)];

  let t = 0.4;
  t = tl.caption({ at: t, dur: 3.4, text: 'A request path: client, balancer, server, database.' });
  stagger(uNodes.length, { at: 0.6, each: 0.12, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween(uNodes[i], 1, o),
  );
  stagger(uEdges.length, { at: 1.5, each: 0.18, dur: 1.0, ease: ease.draw }).forEach((o, i) =>
    tl.tween(uEdges[i], 1, o),
  );
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 3.8,
    text: "One linear channel drives the whole trip — watch the request dwell at each hop. That's where latency lives.",
  });
  tl.tween(reqU, 1, { at: t - 3.4, dur: 6.8, ease: ease.linear });
  t = tl.caption({
    at: t + 0.2,
    dur: 3.6,
    text: 'The green leg is the response, retracing the same path — 200, 42 milliseconds later.',
  });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 4.8,
    text: 'Fan out: a second server pops in, and two staggered channels put two requests in flight at once.',
  });
  tl.tween(uServerB, 1, { at: t - 4.4, dur: 0.6, ease: ease.pop });
  tl.tween(uC4, 1, { at: t - 3.9, dur: 1.0, ease: ease.draw });
  stagger(fan.length, { at: t - 2.7, each: 0.4, dur: 2.0, ease: ease.linear }).forEach((o, i) =>
    tl.tween(fan[i], 1, o),
  );
  tl.hold(t, 0.6);

  return { tl, uNodes, uEdges, reqU, uServerB, uC4, fan };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <>
            <Connection {...C1} u={s.get(demo.uEdges[0])} />
            <Connection {...C2} u={s.get(demo.uEdges[1])} />
            <Connection {...C3} u={s.get(demo.uEdges[2])} />
            <Connection {...C4} elbow="v" u={s.get(demo.uC4)} />
            {NODES.map((n, i) => (
              <ServiceNode
                key={n.kind}
                x={n.x}
                y={n.y}
                kind={n.kind}
                label={n.label}
                sublabel={n.sub}
                u={s.get(demo.uNodes[i])}
              />
            ))}
            <ServiceNode {...SERVER_B} kind="server" label="server" sublabel="replica b" u={s.get(demo.uServerB)} />
            <RequestFlow
              path={TRIP}
              u={s.get(demo.reqU)}
              roundTrip
              label="GET /user"
              responseLabel="200 · 42ms"
              responseColor={colors.POSITIVE}
            />
            <RequestFlow path={FAN_A} u={s.get(demo.fan[0])} color={colors.ACCENT} label="GET /a" />
            <RequestFlow path={FAN_B} u={s.get(demo.fan[1])} color={colors.TEAL} label="GET /b" dwell={0} />
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/RequestFlow',
  component: Demo,
};
export default meta;

export const RoundTripAndFanOut: StoryObj<typeof Demo> = {};
