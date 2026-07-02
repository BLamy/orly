import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, colors, ease, stagger } from '../core';
import { Connection } from './connection';
import { ServiceNode } from './service';
import type { ServiceKind } from './service';

/**
 * Connection catalog: nodes first, then edges draw on with protocol labels
 * (HTTPS, gRPC, SQL). The SQL edge shows elbow routing, the dashed async
 * edge to the queue routes through explicit waypoints, and one linearly
 * tweened `flow` channel streams traffic dashes along two edges at once.
 */
const HALF_W = 84;
const HALF_H = 28;

const NODES: Array<{ kind: ServiceKind; label: string; sub?: string; x: number; y: number }> = [
  { kind: 'client', label: 'client', x: 185, y: 190 },
  { kind: 'lb', label: 'lb', sub: 'load balancer', x: 545, y: 190 },
  { kind: 'server', label: 'server', sub: 'api', x: 935, y: 190 },
  { kind: 'db', label: 'db', sub: 'postgres', x: 700, y: 470 },
  { kind: 'queue', label: 'queue', sub: 'jobs', x: 250, y: 470 },
];

const E_HTTPS = { from: { x: 185 + HALF_W, y: 190 }, to: { x: 545 - HALF_W, y: 190 } };
const E_GRPC = { from: { x: 545 + HALF_W, y: 190 }, to: { x: 935 - HALF_W, y: 190 } };
// elbow-routed: drops out of the server, then runs left into the db
const E_SQL = { from: { x: 935, y: 190 + HALF_H }, to: { x: 700 + HALF_W, y: 470 } };
// waypoint-routed: swings wide around the db on its way to the queue
const E_ASYNC = {
  from: { x: 880, y: 190 + HALF_H },
  via: [
    { x: 880, y: 345 },
    { x: 250, y: 345 },
  ],
  to: { x: 250, y: 470 - HALF_H },
};

function buildDemo() {
  const tl = new Timeline();
  const us = NODES.map((n) => tl.channel(`u:${n.kind}`, 0));
  const uE = ['https', 'grpc', 'sql', 'async'].map((k) => tl.channel(`edge:${k}`, 0));
  const flow = tl.channel('flow', 0);

  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 3.4,
    text: 'Five boxes, no wires — an architecture diagram starts as nouns.',
  });
  stagger(us.length, { at: 0.6, each: 0.12, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween(us[i], 1, o),
  );
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 3.8,
    text: 'Edges draw on and name their protocol: HTTPS, gRPC, SQL.',
  });
  tl.tween(uE[0], 1, { at: t - 3.4, dur: 1.1, ease: ease.draw });
  tl.tween(uE[1], 1, { at: t - 3.0, dur: 1.1, ease: ease.draw });
  tl.tween(uE[2], 1, { at: t - 2.6, dur: 1.3, ease: ease.draw });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 4.0,
    text: 'Edges elbow and waypoint around the furniture; the dashed one is async — fire, forget, drain later.',
  });
  tl.tween(uE[3], 1, { at: t - 3.6, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.4);

  t = tl.caption({
    at: t,
    dur: 4.6,
    text: 'Now traffic: one linearly tweened flow channel streams dashes down the wires — scrub it, nothing skips.',
  });
  tl.tween(flow, 6, { at: t - 4.2, dur: 6.0, ease: ease.linear });
  tl.hold(t, 1.8);

  return { tl, us, uE, flow };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => (
          <>
            <Connection {...E_HTTPS} u={s.get(demo.uE[0])} flow={s.get(demo.flow)} label="HTTPS" color={colors.ACCENT} />
            <Connection {...E_GRPC} u={s.get(demo.uE[1])} flow={s.get(demo.flow)} label="gRPC" color={colors.SECONDARY} />
            <Connection {...E_SQL} elbow="v" u={s.get(demo.uE[2])} label="SQL" color={colors.WARM} />
            <Connection from={E_ASYNC.from} via={E_ASYNC.via} to={E_ASYNC.to} u={s.get(demo.uE[3])} dashed label="async" />
            {NODES.map((n, i) => (
              <ServiceNode
                key={n.kind}
                x={n.x}
                y={n.y}
                kind={n.kind}
                label={n.label}
                sublabel={n.sub}
                u={s.get(demo.us[i])}
              />
            ))}
          </>
        )}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/Connection',
  component: Demo,
};
export default meta;

export const EdgesLabelsTraffic: StoryObj<typeof Demo> = {};
