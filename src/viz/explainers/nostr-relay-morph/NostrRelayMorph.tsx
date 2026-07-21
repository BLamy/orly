import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Connection, JsonDoc, ServiceNode, TokenFlight } from '../../primitives';
import { CLIENT, LAYOUT, NODE_HALF_W, RELAYS, buildScene } from './scene';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/nostr-relay-morph/overrides.json',
  slug: 'nostr-relay-morph',
};

const MODE_COLOR: Record<string, string> = {
  'read + write': colors.ACCENT,
  read: colors.POSITIVE,
  write: colors.WARM,
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const kindU = s.get(scene.kindU);
  const outU = s.get(scene.outU);
  const clientU = s.get(scene.clientU);
  const connU = s.get(scene.connU);
  const flowU = s.get(scene.flowU);
  const backU = s.get(scene.backU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  // the morph runs on one signed progress: out then back
  const morph = (i: number) => clamp01(outU * RELAYS.length - i) * (1 - clamp01(backU * RELAYS.length - i));
  const mapFade = 1 - clamp01(backU * 1.4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={kindU > 0 ? ['kind'] : undefined}
            focusU={kindU}
            hidden={RELAYS.filter((_, i) => morph(i) > 0).map((r) => r.path)}
          />

          {RELAYS.map((r, i) => {
            const u = morph(i);
            const a = LAYOUT.anchor(r.path);
            if (u <= 0) return null;
            return (
              <g key={r.path}>
                <TokenFlight
                  from={{ x: a.cx, y: a.cy + 5 }}
                  to={{ x: r.x, y: r.y - 38 }}
                  u={u}
                  text={r.url}
                  fill={colors.POSITIVE}
                  fontSize={13}
                  lift={60}
                  fadeOut
                />
                <ServiceNode
                  x={r.x}
                  y={r.y}
                  kind="server"
                  label={r.short}
                  sublabel="relay"
                  u={clamp01(u * 2 - 1)}
                />
              </g>
            );
          })}

          {clientU > 0 && mapFade > 0 && (
            <g opacity={mapFade}>
              <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="you" sublabel="any client" u={clientU} />
              {RELAYS.map((r, i) => {
                const u = clamp01(connU * RELAYS.length - i);
                if (u <= 0) return null;
                const from =
                  r.mode === 'read'
                    ? { x: r.x - NODE_HALF_W, y: r.y }
                    : { x: CLIENT.x + NODE_HALF_W, y: CLIENT.y };
                const to =
                  r.mode === 'read'
                    ? { x: CLIENT.x + NODE_HALF_W, y: CLIENT.y }
                    : { x: r.x - NODE_HALF_W, y: r.y };
                return (
                  <Connection
                    key={r.path}
                    from={from}
                    to={to}
                    u={u}
                    flow={flowU}
                    label={r.mode}
                    color={MODE_COLOR[r.mode]}
                  />
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The routing table travels with you
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            picture ↔ JSON, losslessly — publish a new list and the network re-routes
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-65 · kind 10002 · ["r", url, "read"|"write"?]
          </text>
        </g>
      )}
    </>
  );
}

export function NostrRelayMorph() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
