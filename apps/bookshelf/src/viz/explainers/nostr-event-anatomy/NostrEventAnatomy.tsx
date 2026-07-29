import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { BitField, JsonDoc, TokenFlight, shortHex } from '../../primitives';
import {
  FIELDS, GRID, GRID_W, ID, ID_BITS, LAYOUT,
  STRIP_CELLS, STRIP_X, STRIP_Y, TAG_CHIPS, buildScene,
} from './scene';
import overrides from './overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/nostr-event-anatomy/overrides.json',
  slug: 'nostr-event-anatomy',
};

// strip cell x positions
const CELL_X: number[] = [];
{
  let x = STRIP_X;
  for (const c of STRIP_CELLS) {
    CELL_X.push(x);
    x += c.w + 10;
  }
}
const ID_ANCHOR = LAYOUT.anchor('id');
const DIGEST_LABEL = { x: GRID.x + GRID_W / 2, y: GRID.y + GRID_W + 34 };

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const jsonU = s.get(scene.jsonU);
  const sweepU = s.get(scene.sweepU);
  const sweepF = Math.round(s.get(scene.sweepF));
  const tagU = s.get(scene.tagU);
  const stripU = s.get(scene.stripU);
  const serU = s.get(scene.serU);
  const gridU = s.get(scene.gridU);
  const settleU = s.get(scene.settleU);
  const idFlyU = s.get(scene.idFlyU);
  const sigU = s.get(scene.sigU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const idLanded = idFlyU >= 1;

  let focus: string[] | undefined;
  let focusU = 0;
  if (sweepU > 0 && sweepF >= 0) {
    focus = [FIELDS[Math.min(sweepF, FIELDS.length - 1)]];
    focusU = sweepU;
  } else if (tagU > 0 && stripU < 0.01) {
    focus = ['tags'];
    focusU = clamp01(tagU * 2);
  } else if (sigU > 0 && closeU <= 0) {
    focus = ['sig', 'id'];
    focusU = Math.min(sigU, 0.8);
  }

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <JsonDoc
            layout={LAYOUT}
            reveal={jsonU}
            focus={focus}
            focusU={focusU}
            hidden={idLanded ? undefined : ['id']}
          />

          {/* tag chips — values that flew out of the document */}
          {TAG_CHIPS.map((c, i) => {
            const a = LAYOUT.anchor(c.path);
            const u = clamp01(tagU * 2 - i * 0.5);
            if (u <= 0) return null;
            return (
              <g key={c.path}>
                <TokenFlight
                  from={{ x: a.cx, y: a.cy + 5 }}
                  to={{ x: c.x, y: c.y + 5 }}
                  u={u}
                  text={c.label}
                  fill={colors.POSITIVE}
                  fontSize={14}
                  lift={50}
                />
                {u >= 1 && (
                  <g>
                    <rect x={c.x - 78} y={c.y - 20} width={156} height={40} rx={9} fill="none" stroke={colors.POSITIVE} opacity={0.6} />
                    <text x={c.x} y={c.y + 36} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
                      {c.kindLabel}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* serialization strip */}
          {stripU > 0 && (
            <g opacity={stripU}>
              <text x={STRIP_X} y={STRIP_Y - 16} fill={colors.MUTED} fontSize={12} fontFamily="monospace">
                serialize: [0, pubkey, created_at, kind, tags, content] — no whitespace
              </text>
              <text x={CELL_X[0] - 14} y={STRIP_Y + 26} fill={colors.MUTED} fontSize={16} fontFamily="monospace">[</text>
              <text x={CELL_X[5] + STRIP_CELLS[5].w + 6} y={STRIP_Y + 26} fill={colors.MUTED} fontSize={16} fontFamily="monospace">]</text>
              {STRIP_CELLS.map((c, i) => {
                const u = clamp01(serU * STRIP_CELLS.length - i);
                const a = c.path === 'kindByte' ? null : LAYOUT.anchor(c.path);
                return (
                  <g key={i}>
                    <rect
                      x={CELL_X[i]}
                      y={STRIP_Y}
                      width={c.w}
                      height={38}
                      rx={7}
                      fill={colors.PANEL}
                      stroke={u >= 1 ? colors.ACCENT : colors.GRID}
                      opacity={0.4 + 0.6 * u}
                    />
                    {a ? (
                      <TokenFlight
                        from={{ x: a.cx, y: a.cy + 5 }}
                        to={{ x: CELL_X[i] + c.w / 2, y: STRIP_Y + 24 }}
                        u={u}
                        text={c.label}
                        fill={colors.TEXT}
                        fontSize={12}
                        lift={40}
                      />
                    ) : (
                      u > 0 && (
                        <text x={CELL_X[i] + c.w / 2} y={STRIP_Y + 24} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily="monospace" opacity={u}>
                          0
                        </text>
                      )
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the digest */}
          {gridU > 0 && (
            <g>
              <text x={GRID.x} y={GRID.y - 18} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={gridU}>
                SHA-256(serialization) — real bits
              </text>
              <BitField
                bits={ID_BITS}
                x={GRID.x}
                y={GRID.y}
                cell={GRID.cell}
                gap={GRID.gap}
                reveal={gridU}
                settle={settleU}
                seed={5}
              />
              {settleU >= 1 && idFlyU < 1 && (
                <text x={DIGEST_LABEL.x} y={DIGEST_LABEL.y} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                  {shortHex(ID, 12, 8)}
                </text>
              )}
            </g>
          )}

          {/* digest → id slot */}
          <TokenFlight
            from={{ x: DIGEST_LABEL.x, y: DIGEST_LABEL.y }}
            to={{ x: ID_ANCHOR.cx, y: ID_ANCHOR.cy + 5 }}
            u={idFlyU}
            text={shortHex(ID)}
            fill={colors.ACCENT}
            fontSize={13}
            lift={120}
            holdAtEnd={false}
          />

          {/* signature seal */}
          {sigU > 0 && (
            <g opacity={sigU}>
              <MathLabel tex={'\\text{sig} = \\text{schnorr}_{d}(\\text{id})'} x={620} y={560} />
              <circle cx={560} cy={556} r={13} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <path d="M553 556 l5 5 l9 -10" fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} strokeLinecap="round" />
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={230} width={840} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            id proves the what · sig proves the who
          </text>
          <text x={640} y={344} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            one self-contained JSON object — the whole protocol stands on it
          </text>
          <text x={640} y={384} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 · id = SHA-256([0, pubkey, created_at, kind, tags, content])
          </text>
        </g>
      )}
    </>
  );
}

export function NostrEventAnatomy() {
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
