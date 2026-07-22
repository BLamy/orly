// Edits That Replace — NIP-23 addressability, chapter 2.
//
// Grounded in NIP-01 kind ranges (30000–39999 = addressable) + NIP-23:
// an addressable event's identity is NOT its id but the coordinate
// `kind:pubkey:d-tag`. A relay keeps only the LATEST event per coordinate;
// re-publishing with the same d replaces the old one. Links that point at the
// coordinate (naddr) follow the edits; links that point at a specific id
// (nevent) freeze on that version.
//
// ONE machine: the address plate `30023:8e0d…:why-relays` is built once and
// persists. A relay's single "latest" slot for that address swaps v1 → v2 when
// the author fixes a typo. Two links resolve differently against it.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const D_TAG = 'why-relays';

// address plate pieces
const PLATE = { x: 150, y: 150, w: 560, h: 70 };
const COORD_PARTS = [
  { label: '30023', sub: 'kind', color: colors.WARM },
  { label: shortHex(PUBKEY, 6, 4), sub: 'pubkey', color: colors.ACCENT },
  { label: D_TAG, sub: 'd tag', color: colors.SECONDARY },
];

// relay latest-slot
const SLOT = { x: 300, y: 320, w: 320, h: 130 };
// the two versions
const V1 = { id: 'a3f01c9e', at: '1699000000', body: 'their words' };
const V2 = { id: 'e7b42d10', at: '1700860000', body: 'thier → their' };

// two links
const NADDR = { x: 830, y: 300 };
const NEVENT = { x: 830, y: 470 };

const CAM_PLATE: CameraState = { x: 430, y: 200, k: 1.3 };
const CAM_SLOT: CameraState = { x: 460, y: 380, k: 1.2 };
const CAM_LINKS: CameraState = { x: 720, y: 380, k: 1.15 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const plateU = tl.channel('plateU', 0);
  const coordU = tl.channel('coordU', 0);
  const v1U = tl.channel('v1U', 0);
  const editU = tl.channel('editU', 0); // 0 → v1 in slot, 1 → v2 replaced
  const naddrU = tl.channel('naddrU', 0);
  const naddrHitU = tl.channel('naddrHitU', 0);
  const neventU = tl.channel('neventU', 0);
  const neventHitU = tl.channel('neventHitU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the address is not the id.
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Book one sorted events into ranges. The article lives in the addressable range, and that changes what its name is. Its name is not the hash. Its name is three things joined: the kind, the author, and a chosen label.',
  });
  tl.tween(plateU, 1, { at: 0.7, dur: 0.9, ease: ease.enter });
  tl.tween(cam, CAM_PLATE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(coordU, 1, { at: 1.8, dur: 2.6, ease: ease.linear });
  tl.hold(6.5, 0.7);

  // Beat 2 — publish v1 into the slot.
  tl.caption({
    at: 7.2,
    dur: 5.8,
    text: 'The label here is "why-relays". Publish the article, and a relay files it in a single slot reserved for that one address — one coordinate, one current event.',
  });
  tl.tween(cam, CAM_SLOT, { at: 7.4, dur: 1.4, ease: ease.move });
  tl.tween(v1U, 1, { at: 8.4, dur: 1.0, ease: ease.enter });
  tl.hold(13.0, 0.7);

  // Beat 3 — edit → replace.
  tl.caption({
    at: 13.7,
    dur: 6.2,
    text: 'Now fix a typo. The author publishes again with the same label. It is a brand-new event, with a new hash and a newer timestamp — but the relay does not keep both. The newer one evicts the older. Only the latest survives per address.',
  });
  tl.tween(editU, 1, { at: 15.0, dur: 1.8, ease: ease.move });
  tl.hold(19.9, 0.7);

  // Beat 4 — the address link follows edits.
  tl.caption({
    at: 20.6,
    dur: 6.0,
    text: 'This is why two kinds of links exist. An address link carries the coordinate, not a hash. Follow it and you always land on whatever is current — right now, the corrected version.',
  });
  tl.tween(cam, CAM_LINKS, { at: 20.8, dur: 1.4, ease: ease.move });
  tl.tween(naddrU, 1, { at: 21.8, dur: 0.9, ease: ease.enter });
  tl.tween(naddrHitU, 1, { at: 23.2, dur: 1.4, ease: ease.linear });
  tl.hold(26.6, 0.7);

  // Beat 5 — the id link freezes.
  tl.caption({
    at: 27.3,
    dur: 6.2,
    text: 'The other kind of link carries a specific hash. It is frozen: it names the first version forever. That is perfect for a citation you never want to move — but the relay may have already dropped that exact event, so the link can simply go nowhere.',
  });
  tl.tween(neventU, 1, { at: 28.2, dur: 0.9, ease: ease.enter });
  tl.tween(neventHitU, 1, { at: 29.6, dur: 1.4, ease: ease.linear });
  tl.hold(33.5, 0.7);

  // Beat 6 — history vs freshness.
  tl.caption({
    at: 34.2,
    dur: 5.6,
    text: 'So the coordinate is a living pointer, and the hash is a snapshot. Editing in place and permanent citation are not in tension — the protocol just gives you a different link for each.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 34.4, dur: 1.4, ease: ease.move });
  tl.hold(39.8, 0.7);

  // Beat 7 — close.
  tl.caption({
    at: 40.5,
    dur: 5.4,
    text: 'One address, one current version, links that know which they want. Next: what happens when the thing you are publishing is not words at all, but a file.',
  });
  tl.tween(dimU, 1, { at: 40.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.9, dur: 1.0, ease: ease.enter });
  tl.hold(45.9, 1.2);

  return {
    tl, cam, plateU, coordU, v1U, editU, naddrU, naddrHitU,
    neventU, neventHitU, dimU, closeU,
  };
}

const scene = buildScene();

function VersionCard({ x, y, v, label, color, op }: { x: number; y: number; v: typeof V1; label: string; color: string; op: number }) {
  if (op <= 0) return null;
  return (
    <g opacity={op}>
      <rect x={x} y={y} width={SLOT.w} height={SLOT.h} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text x={x + 16} y={y + 28} fill={color} fontSize={13} fontWeight={600}>{label}</text>
      <text x={x + 16} y={y + 56} fill={colors.MUTED} fontSize={12} fontFamily="monospace">id {v.id}…</text>
      <text x={x + 16} y={y + 80} fill={colors.MUTED} fontSize={12} fontFamily="monospace">created_at {v.at}</text>
      <text x={x + 16} y={y + 108} fill={colors.TEXT} fontSize={13}>“{v.body}”</text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const plateU = s.get(scene.plateU);
  const coordU = s.get(scene.coordU);
  const v1U = s.get(scene.v1U);
  const editU = s.get(scene.editU);
  const naddrU = s.get(scene.naddrU);
  const naddrHitU = s.get(scene.naddrHitU);
  const neventU = s.get(scene.neventU);
  const neventHitU = s.get(scene.neventHitU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const partW = (PLATE.w - 40) / 3;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* address plate */}
          {plateU > 0 && (
            <g opacity={plateU}>
              <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              {COORD_PARTS.map((p, i) => {
                const u = clamp01(coordU * COORD_PARTS.length - i);
                if (u <= 0) return null;
                const px = PLATE.x + 16 + i * (partW + 6);
                return (
                  <g key={p.sub} opacity={u}>
                    <text x={px + partW / 2} y={PLATE.y + 34} textAnchor="middle" fill={p.color} fontSize={15} fontWeight={600} fontFamily="monospace">
                      {p.label}
                    </text>
                    <text x={px + partW / 2} y={PLATE.y + 54} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                      {p.sub}
                    </text>
                    {i < 2 && <text x={px + partW + 3} y={PLATE.y + 38} textAnchor="middle" fill={colors.MUTED} fontSize={18}>:</text>}
                  </g>
                );
              })}
              {coordU >= 1 && (
                <text x={PLATE.x + PLATE.w / 2} y={PLATE.y - 12} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily="monospace">
                  the address — kind:pubkey:d
                </text>
              )}
            </g>
          )}

          {/* relay latest slot */}
          {v1U > 0 && (
            <g>
              <text x={SLOT.x} y={SLOT.y - 14} fill={colors.MUTED} fontSize={12} fontFamily="monospace" opacity={v1U}>
                relay · latest for this address
              </text>
              {/* v1 slides up-out as v2 replaces */}
              <g transform={`translate(0, ${-editU * 26})`}>
                <VersionCard x={SLOT.x} y={SLOT.y} v={V1} label="version 1" color={editU > 0.5 ? colors.NEGATIVE : colors.POSITIVE} op={v1U * (1 - 0.82 * editU)} />
              </g>
              <VersionCard x={SLOT.x} y={SLOT.y} v={V2} label="version 2 — current" color={colors.POSITIVE} op={clamp01(editU * 1.4 - 0.2)} />
              {editU > 0.5 && (
                <text x={SLOT.x + SLOT.w + 16} y={SLOT.y + 10} fill={colors.NEGATIVE} fontSize={12} opacity={clamp01(editU * 2 - 1)}>
                  v1 evicted
                </text>
              )}
            </g>
          )}

          {/* naddr link → coordinate → current */}
          {naddrU > 0 && (
            <g opacity={naddrU}>
              <rect x={NADDR.x} y={NADDR.y} width={300} height={54} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={NADDR.x + 16} y={NADDR.y + 24} fill={colors.ACCENT} fontSize={13} fontWeight={600}>naddr… — the address</text>
              <text x={NADDR.x + 16} y={NADDR.y + 44} fill={colors.MUTED} fontSize={11} fontFamily="monospace">resolves to whatever is current</text>
              {naddrHitU > 0 && (
                <path
                  d={`M${NADDR.x} ${NADDR.y + 27} Q ${SLOT.x + SLOT.w + 90} ${NADDR.y - 30} ${SLOT.x + SLOT.w + 4} ${SLOT.y + 40}`}
                  fill="none"
                  stroke={colors.POSITIVE}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  opacity={naddrHitU}
                  pathLength={1}
                  strokeDashoffset={0}
                />
              )}
              {naddrHitU >= 1 && (
                <text x={NADDR.x + 150} y={NADDR.y - 12} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>→ version 2 ✓</text>
              )}
            </g>
          )}

          {/* nevent link → frozen id */}
          {neventU > 0 && (
            <g opacity={neventU}>
              <rect x={NEVENT.x} y={NEVENT.y} width={300} height={54} rx={10} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={NEVENT.x + 16} y={NEVENT.y + 24} fill={colors.WARM} fontSize={13} fontWeight={600}>nevent… — a fixed hash</text>
              <text x={NEVENT.x + 16} y={NEVENT.y + 44} fill={colors.MUTED} fontSize={11} fontFamily="monospace">frozen on id {V1.id}…</text>
              {neventHitU > 0 && (
                <text x={NEVENT.x + 150} y={NEVENT.y + 78} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} opacity={neventHitU}>
                  version 1 — superseded, maybe gone
                </text>
              )}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The address is a living pointer
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            kind:pubkey:d holds one current version · a fixed hash freezes one
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-23 · addressable (kind 30000–39999) — newest replaces
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
