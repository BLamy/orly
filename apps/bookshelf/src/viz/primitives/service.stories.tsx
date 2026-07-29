import type { Meta, StoryObj } from '@storybook/react-vite';
import { Player, Timeline, ease, stagger } from '../core';
import { ServiceNode } from './service';
import type { ServiceKind } from './service';

/**
 * ServiceNode catalog: all fourteen kinds stagger into a grid, each labeled
 * by its kind. Then the dynamic props get a beat each: the server grows an
 * ×3 replicas chip, the database walks ok → warn → down with a glow, and
 * the external cloud stays dashed the whole time — that's its kind.
 */
const COLS = [176, 408, 640, 872, 1104];
const ROW3 = [292, 524, 756, 988];

const CELLS: Array<{ kind: ServiceKind; sub: string; x: number; y: number }> = [
  { kind: 'client', sub: 'sdk caller', x: COLS[0], y: 170 },
  { kind: 'browser', sub: 'web app', x: COLS[1], y: 170 },
  { kind: 'mobile', sub: 'native app', x: COLS[2], y: 170 },
  { kind: 'server', sub: 'api service', x: COLS[3], y: 170 },
  { kind: 'gateway', sub: 'api gateway', x: COLS[4], y: 170 },
  { kind: 'lb', sub: 'load balancer', x: COLS[0], y: 320 },
  { kind: 'fn', sub: 'function', x: COLS[1], y: 320 },
  { kind: 'db', sub: 'database', x: COLS[2], y: 320 },
  { kind: 'cache', sub: 'cache', x: COLS[3], y: 320 },
  { kind: 'queue', sub: 'message queue', x: COLS[4], y: 320 },
  { kind: 'storage', sub: 'object storage', x: ROW3[0], y: 470 },
  { kind: 'search', sub: 'search index', x: ROW3[1], y: 470 },
  { kind: 'cdn', sub: 'edge network', x: ROW3[2], y: 470 },
  { kind: 'external', sub: 'third-party', x: ROW3[3], y: 470 },
];

const SERVER_I = CELLS.findIndex((c) => c.kind === 'server');
const DB_I = CELLS.findIndex((c) => c.kind === 'db');

function buildDemo() {
  const tl = new Timeline();
  const us = CELLS.map((c) => tl.channel(`u:${c.kind}`, 0));
  const reps = tl.channel('replicas', 1);
  const statusN = tl.channel('statusN', 0); // 0 ok · 1 warn · 2 down
  const glowDb = tl.channel('glowDb', 0);

  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 4.0,
    text: 'Fourteen kinds, one component — each brings its own glyph and color.',
  });
  stagger(us.length, { at: 0.6, each: 0.09, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween(us[i], 1, o),
  );
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 3.6,
    text: 'The server scales out — the ×N chip counts replicas as they join.',
  });
  tl.tween(reps, 3, { at: t - 3.0, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 4.4,
    text: 'The database degrades: amber for warn, rose for down — the border is the status light.',
  });
  tl.set(statusN, 1, t - 4.0);
  tl.tween(glowDb, 1, { at: t - 4.0, dur: 0.6, ease: ease.pulse });
  tl.tween(glowDb, 0.35, { at: t - 3.2, dur: 0.6, ease: ease.pulse });
  tl.set(statusN, 2, t - 2.2);
  tl.tween(glowDb, 1, { at: t - 2.2, dur: 0.6, ease: ease.pulse });
  t = tl.hold(t, 0.5);

  t = tl.caption({
    at: t,
    dur: 3.6,
    text: "And the external cloud stays dashed — someone else's uptime, not yours.",
  });
  tl.hold(t, 0.9);

  return { tl, us, reps, statusN, glowDb };
}

const demo = buildDemo();

function Demo() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={demo.tl} loop>
        {(s) => {
          const stN = s.get(demo.statusN);
          const dbStatus = stN >= 2 ? ('down' as const) : stN >= 1 ? ('warn' as const) : undefined;
          return (
            <>
              {CELLS.map((c, i) => (
                <ServiceNode
                  key={c.kind}
                  x={c.x}
                  y={c.y}
                  kind={c.kind}
                  label={c.kind}
                  sublabel={c.sub}
                  u={s.get(demo.us[i])}
                  replicas={i === SERVER_I ? Math.round(s.get(demo.reps)) : undefined}
                  status={i === DB_I ? dbStatus : undefined}
                  glow={i === DB_I ? s.get(demo.glowDb) : 0}
                />
              ))}
            </>
          );
        }}
      </Player>
    </div>
  );
}

const meta: Meta<typeof Demo> = {
  title: 'Primitives/ServiceNode',
  component: Demo,
};
export default meta;

export const KindCatalog: StoryObj<typeof Demo> = {};
