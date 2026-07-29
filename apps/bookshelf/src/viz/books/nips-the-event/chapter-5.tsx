// The Event (NIPs series №1), chapter 5 — kind ranges.
// The kind number decides an event's storage fate on a relay. Grounded in
// NIP-01: regular (1000≤n<10000, 4≤n<45, n=1,2) stored; replaceable
// (10000≤n<20000, n=0,3) latest per (pubkey,kind), lowest id wins ties;
// ephemeral (20000≤n<30000) never stored; addressable (30000≤n<40000)
// latest per (kind,pubkey,d-tag). The persistent object is the relay's
// shelf: events drop from the kind band and the shelf enforces each rule.
import {
  CAMERA_HOME, Camera, Player, STAGE_H, STAGE_W, Timeline,
  cameraInterp, colors, ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState, TimelineOverrides } from '../../core';
import overrides from './chapter-5.overrides.json';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The kind band (segments) and the shelf (four zones).
// ---------------------------------------------------------------------------
const BAND_Y = 150;
const SEGS: Array<{ label: string; range: string; x: number; w2: number; color: string }> = [
  { label: 'regular', range: '1·2 · 4–44 · 1k–10k', x: 120, w2: 250, color: colors.ACCENT },
  { label: 'replaceable', range: '0 · 3 · 10k–20k', x: 400, w2: 250, color: colors.WARM },
  { label: 'ephemeral', range: '20k–30k', x: 680, w2: 220, color: colors.NEGATIVE },
  { label: 'addressable', range: '30k–40k', x: 930, w2: 230, color: colors.SECONDARY },
];

const SHELF_Y = 430;
const zoneX = (i: number) => SEGS[i].x + SEGS[i].w2 / 2;

const CAM_BAND: CameraState = { x: 640, y: 300, k: 1.08 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  bandU: ChannelRef<number>;
  shelfU: ChannelRef<number>;
  regU: ChannelRef<number>;
  rep1U: ChannelRef<number>;
  rep2U: ChannelRef<number>;
  ephU: ChannelRef<number>;
  addr1U: ChannelRef<number>;
  addr2U: ChannelRef<number>;
  addr3U: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const bandU = tl.channel('bandU', 0);
  const shelfU = tl.channel('shelfU', 0);
  const regU = tl.channel('regU', 0);
  const rep1U = tl.channel('rep1U', 0);
  const rep2U = tl.channel('rep2U', 0);
  const ephU = tl.channel('ephU', 0);
  const addr1U = tl.channel('addr1U', 0);
  const addr2U = tl.channel('addr2U', 0);
  const addr3U = tl.channel('addr3U', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the kind number is a contract.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'One field we have not fully honored yet: kind. It does not just say what an event means — its numeric range tells every relay how long the event should live.',
  });
  tl.tween(bandU, 1, { at: 0.7, dur: 2.2, ease: ease.draw });
  tl.tween(cam, CAM_BAND, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(shelfU, 1, { at: 2.8, dur: 1.2, ease: ease.enter });
  tl.hold(6.3, 0.7);

  // Beat 2 — regular: keep every one.
  tl.caption({
    at: 7.0,
    dur: 5.6,
    text: 'Regular events — text notes at kind one, reposts, most of the classic range — are simply kept. Three notes arrive, three notes stay. History accumulates.',
  });
  tl.tween(regU, 1, { at: 7.5, dur: 3.0, ease: ease.linear });
  tl.hold(12.6, 0.7);

  // Beat 3 — replaceable: keep the latest.
  tl.caption({
    at: 13.3,
    dur: 6.2,
    text: 'Replaceable events — your kind-zero profile, your kind-three follow list — keep only the newest per author and kind. Publish a new profile and the old one is allowed to vanish.',
  });
  tl.tween(rep1U, 1, { at: 13.7, dur: 1.6, ease: ease.move });
  tl.tween(rep2U, 1, { at: 16.2, dur: 2.0, ease: ease.move });
  tl.caption({
    at: 19.7,
    dur: 4.6,
    text: 'If two carry the very same timestamp, the tie-break is deliberately boring: the lexically lowest id wins, so every relay agrees without talking.',
  });
  tl.hold(24.3, 0.7);

  // Beat 4 — ephemeral: keep none.
  tl.caption({
    at: 25.0,
    dur: 5.8,
    text: 'Ephemeral events, the twenty-thousands, are never stored at all. They exist for the moment they cross the wire — perfect for typing indicators and auth handshakes — and then they are gone.',
  });
  tl.tween(ephU, 1, { at: 25.6, dur: 2.8, ease: ease.linear });
  tl.hold(30.8, 0.7);

  // Beat 5 — addressable: keep the latest per address.
  tl.caption({
    at: 31.5,
    dur: 6.4,
    text: 'Addressable events, the thirty-thousands, add one more coordinate: a d tag. The relay keeps the newest per author, kind, and d — so a long-form article has a stable address you can edit in place.',
  });
  tl.tween(addr1U, 1, { at: 31.9, dur: 1.6, ease: ease.move });
  tl.tween(addr2U, 1, { at: 34.0, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 38.1,
    dur: 5.0,
    text: 'A different d value is a different address entirely — its own slot, its own history of replacements. Kind, pubkey, d: three numbers that name a living document.',
  });
  tl.tween(addr3U, 1, { at: 38.7, dur: 1.6, ease: ease.move });
  tl.hold(43.1, 0.7);

  // Beat 6 — close.
  tl.caption({
    at: 43.8,
    dur: 6.0,
    text: 'Keep every one. Keep the latest. Keep none. Keep the latest per address. Four retention rules, encoded in nothing but an integer — and that is nip one, the ground every other proposal stands on.',
  });
  tl.tween(dimU, 1, { at: 44.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.2, dur: 1.0, ease: ease.enter });
  tl.hold(49.8, 1.2);

  return {
    tl, cam, bandU, shelfU, regU, rep1U, rep2U, ephU,
    addr1U, addr2U, addr3U, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/books/nips-the-event/chapter-5.overrides.json',
  slug: 'books/nips-the-event/chapter-5',
};

// A falling chip: from the band segment down to a shelf slot.
function Chip({
  seg, u, label, slotX, slotY, replaceOut = 0, evaporate = false, color,
}: {
  seg: number; u: number; label: string; slotX: number; slotY: number;
  replaceOut?: number; evaporate?: boolean; color: string;
}) {
  const t = clamp01(u);
  if (t <= 0) return null;
  const x0 = zoneX(seg);
  const y0 = BAND_Y + 46;
  let x = x0 + (slotX - x0) * t;
  let y = y0 + (slotY - y0) * t;
  let op = 1;
  if (evaporate) {
    // falls through the shelf line and dissolves below it
    const over = clamp01((t - 0.55) / 0.45);
    y = y0 + (SHELF_Y + 55 - y0) * t;
    op = 1 - over;
    x = x0;
  }
  if (replaceOut > 0) {
    x += 120 * replaceOut;
    op *= 1 - replaceOut;
  }
  if (op <= 0) return null;
  return (
    <g opacity={op}>
      <rect x={x - 56} y={y - 14} width={112} height={28} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fill={color} fontSize={11} fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

function Render_({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const bandU = s.get(scene.bandU);
  const shelfU = s.get(scene.shelfU);
  const regU = s.get(scene.regU);
  const rep1U = s.get(scene.rep1U);
  const rep2U = s.get(scene.rep2U);
  const ephU = s.get(scene.ephU);
  const addr1U = s.get(scene.addr1U);
  const addr2U = s.get(scene.addr2U);
  const addr3U = s.get(scene.addr3U);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the kind band */}
          {SEGS.map((seg, i) => {
            const u = clamp01(bandU * SEGS.length - i);
            if (u <= 0) return null;
            return (
              <g key={seg.label} opacity={u}>
                <rect x={seg.x} y={BAND_Y} width={seg.w2 * u} height={34} rx={8}
                  fill={seg.color} opacity={0.16} />
                <rect x={seg.x} y={BAND_Y} width={seg.w2 * u} height={34} rx={8}
                  fill="none" stroke={seg.color} strokeWidth={1.5} />
                <text x={seg.x + 12} y={BAND_Y + 22} fill={seg.color} fontSize={14} fontWeight={600}>
                  {seg.label}
                </text>
                <text x={seg.x + 2} y={BAND_Y - 10} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                  {seg.range}
                </text>
              </g>
            );
          })}

          {/* the shelf */}
          {shelfU > 0 && (
            <g opacity={shelfU}>
              <line x1={100} y1={SHELF_Y + 40} x2={1180} y2={SHELF_Y + 40} stroke={colors.GRID} strokeWidth={2} />
              <text x={100} y={SHELF_Y + 62} fill={colors.MUTED} fontSize={12}>
                the relay's shelf — what survives
              </text>
            </g>
          )}

          {/* regular: three notes stack */}
          {[0, 1, 2].map((k) => (
            <Chip key={k} seg={0} u={clamp01(regU * 3 - k)} label={`kind 1 note ${k + 1}`}
              slotX={zoneX(0)} slotY={SHELF_Y - k * 34} color={colors.ACCENT} />
          ))}

          {/* replaceable: profile v2 replaces v1 */}
          <Chip seg={1} u={rep1U} label="kind 0 · profile v1" slotX={zoneX(1)} slotY={SHELF_Y}
            replaceOut={clamp01(rep2U * 1.4)} color={colors.WARM} />
          <Chip seg={1} u={rep2U} label="kind 0 · profile v2" slotX={zoneX(1)} slotY={SHELF_Y} color={colors.WARM} />
          {rep2U >= 1 && (
            <text x={zoneX(1)} y={SHELF_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace" opacity={0.85}>
              latest per (pubkey, kind)
            </text>
          )}

          {/* ephemeral: passes through */}
          <Chip seg={2} u={ephU} label="kind 20001" slotX={zoneX(2)} slotY={SHELF_Y}
            evaporate color={colors.NEGATIVE} />
          {ephU >= 1 && (
            <text x={zoneX(2)} y={SHELF_Y} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} opacity={0.8}>
              never stored
            </text>
          )}

          {/* addressable: d-tag slots */}
          <Chip seg={3} u={addr1U} label={'30023 · d:"post-a" v1'} slotX={zoneX(3) - 20} slotY={SHELF_Y}
            replaceOut={clamp01(addr2U * 1.4)} color={colors.SECONDARY} />
          <Chip seg={3} u={addr2U} label={'30023 · d:"post-a" v2'} slotX={zoneX(3) - 20} slotY={SHELF_Y} color={colors.SECONDARY} />
          <Chip seg={3} u={addr3U} label={'30023 · d:"post-b"'} slotX={zoneX(3) - 20} slotY={SHELF_Y - 34} color={colors.SECONDARY} />
          {addr2U >= 1 && (
            <text x={zoneX(3) - 20} y={SHELF_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily="monospace" opacity={0.85}>
              latest per (kind, pubkey, d)
            </text>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={218} width={880} height={214} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={600}>
            Four retention rules in one integer
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            keep every one · keep the latest · keep none · keep the latest per address
          </text>
          <text x={640} y={368} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-01 · regular / replaceable / ephemeral / addressable
          </text>
        </g>
      )}
    </>
  );
}

export function Chapter5() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Render_ s={s} />}
      </Player>
    </div>
  );
}

export { Render_ as Render };
export const vizScene = () => scene;
