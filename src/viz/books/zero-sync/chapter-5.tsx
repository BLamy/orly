// One Loop, Every Framework
//
// Backing: the whole circuit from chapters 1–4 — mutagen
// (packages/zero-cache/src/services/mutagen/mutagen.ts), the change source +
// replication tape (services/change-source/pg/), the replicator + SQLite
// replica, the view syncer + client view record (services/view-syncer/),
// pokes (zero-protocol/src/poke.ts) — plus the client packages that exist in
// the monorepo: zero-react (useQuery, useZero, ZeroProvider — src/mod.ts),
// zero-solid (createQuery, createZero), zero-react-native
// (expoSQLiteStoreProvider). No other framework bindings are invented.
//
// Machine: the full machine in miniature. ONE tap on one device pulses
// around the loop — push, mutagen, Postgres commit, the tape, the replica,
// the view syncer's stencil — and the resulting poke fans out to three
// devices running three different frameworks, whose UIs flip in the same
// frame. The recap re-traces the journey, naming each stage as it lights.
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
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, Packet, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the loop. Captions own y ≳ 630.
// ---------------------------------------------------------------------------

const PG = { x: 220, y: 180 };
const ZONE = { x: 560, y: 96, w: 560, h: 300 } as const;
const REPLICA = { x: 700, y: 190 };
const VS = { x: 980, y: 190 };
const MUT = { x: 700, y: 330 };

const DEVICES = [
  { x: 330, y: 520, fw: 'React', hook: 'useQuery · ZeroProvider', writer: true },
  { x: 660, y: 520, fw: 'Solid', hook: 'createQuery · createZero', writer: false },
  { x: 990, y: 520, fw: 'React Native', hook: 'expoSQLiteStoreProvider', writer: false },
] as const;

// loop legs (each its own linear channel):
//   l0 device→mutagen · l1 mutagen→postgres · l2 postgres→replica (the tape)
//   l3 replica→view-syncer · fan: view-syncer→each device
const L0 = { from: { x: DEVICES[0].x + 30, y: DEVICES[0].y - 34 }, to: { x: MUT.x - 60, y: MUT.y + 10 } };
const L1 = { from: { x: MUT.x - 60, y: MUT.y - 10 }, to: { x: PG.x + 40, y: PG.y + 40 } };
const L2 = { from: { x: PG.x + 64, y: PG.y }, to: { x: REPLICA.x - 62, y: REPLICA.y } };
const L3 = { from: { x: REPLICA.x + 60, y: REPLICA.y }, to: { x: VS.x - 62, y: VS.y } };

const CAM_ZONE: CameraState = { x: 840, y: 250, k: 1.3 };
const CAM_DEVS: CameraState = { x: 660, y: 470, k: 1.25 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pgU: ChannelRef<number>;
  zoneU: ChannelRef<number>;
  devsU: ChannelRef<number>;
  l0: ChannelRef<number>;
  l1: ChannelRef<number>;
  l2: ChannelRef<number>;
  l3: ChannelRef<number>;
  pgGlow: ChannelRef<number>;
  vsGlow: ChannelRef<number>;
  fanU: ChannelRef<number>;
  flipU: ChannelRef<number>;
  fwU: ChannelRef<number>;
  recapU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pgU = tl.channel('pgU', 0);
  const zoneU = tl.channel('zoneU', 0);
  const devsU = tl.channel('devsU', 0);
  const l0 = tl.channel('l0', 0);
  const l1 = tl.channel('l1', 0);
  const l2 = tl.channel('l2', 0);
  const l3 = tl.channel('l3', 0);
  const pgGlow = tl.channel('pgGlow', 0);
  const vsGlow = tl.channel('vsGlow', 0);
  const fanU = tl.channel('fanU', 0);
  const flipU = tl.channel('flipU', 0);
  const fwU = tl.channel('fwU', 0);
  const recapU = tl.channel('recapU', 0); // one fast re-trace of the whole loop
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the assembled machine —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Every piece you have met, on one stage: your Postgres, the tape, the replica, the view syncer, and the devices below.',
  });
  tl.tween(pgU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(zoneU, 1, { at: 1.4, dur: 1.4, ease: ease.draw });
  tl.tween(devsU, 1, { at: 2.6, dur: 1.2, ease: ease.enter });

  // — Beat 2 · one tap, the whole journey —
  tl.caption({
    at: 6.4,
    dur: 5,
    text: 'Now watch one tap make the entire journey. A user on the left closes an issue.',
  });
  tl.tween(l0, 1, { at: 7.6, dur: 1.6, ease: ease.linear });
  tl.caption({
    at: 11.6,
    dur: 5.5,
    text: 'Mutagen replays the mutation against your Postgres — still the only writer that counts.',
  });
  tl.tween(l1, 1, { at: 12.2, dur: 1.6, ease: ease.linear });
  tl.tween(pgGlow, 1, { at: 13.9, dur: 0.4, ease: ease.pop });
  tl.tween(pgGlow, 0, { at: 14.8, dur: 0.6, ease: ease.enter });

  // — Beat 3 · back along the tape —
  tl.caption({
    at: 17.3,
    dur: 6,
    text: 'The commit lands in the write-ahead log, and the tape carries it into the SQLite replica, like every other change.',
  });
  tl.tween(cam, CAM_ZONE, { at: 17.5, dur: 1.4, ease: ease.move });
  tl.tween(l2, 1, { at: 18.3, dur: 2.0, ease: ease.linear });

  // — Beat 4 · the view syncer —
  tl.caption({
    at: 23.5,
    dur: 6,
    text: 'The view syncer holds every client’s standing queries against the ledger, and works out exactly who this change concerns.',
  });
  tl.tween(l3, 1, { at: 24.1, dur: 1.6, ease: ease.linear });
  tl.tween(vsGlow, 1, { at: 25.8, dur: 0.4, ease: ease.pop });
  tl.tween(vsGlow, 0, { at: 27.2, dur: 0.6, ease: ease.enter });
  tl.hold(29.5, 0.5);

  // — Beat 5 · the fan-out —
  tl.caption({
    at: 30.0,
    dur: 5.5,
    text: 'Then the pokes fan out — one small diff to every device whose query the change touched.',
  });
  tl.tween(cam, CAM_WIDE, { at: 30.2, dur: 1.4, ease: ease.move });
  tl.tween(fanU, 1, { at: 31.0, dur: 2.2, ease: ease.linear });
  tl.tween(flipU, 1, { at: 33.3, dur: 0.5, ease: ease.pop });

  // — Beat 6 · every framework —
  tl.caption({
    at: 35.9,
    dur: 6,
    text: 'On the receiving end, Zero speaks your framework: a hook for React, signals for Solid, and a native store for React Native.',
  });
  tl.tween(cam, CAM_DEVS, { at: 36.1, dur: 1.4, ease: ease.move });
  tl.tween(fwU, 3, { at: 36.7, dur: 1.8, ease: ease.enter });
  tl.caption({
    at: 42.3,
    dur: 4.5,
    text: 'Same poke, same frame: three interfaces, three frameworks, one truth — updated together.',
  });
  tl.hold(46.8, 0.5);

  // — Beat 7 · the recap —
  tl.caption({
    at: 47.3,
    dur: 6.5,
    text: 'So this is Zero. Your own Postgres owns the truth; a replication tape mirrors it into a SQLite replica beside the server.',
  });
  tl.tween(cam, CAM_WIDE, { at: 47.5, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 48.0, dur: 11.5, ease: ease.linear });
  tl.caption({
    at: 54.0,
    dur: 5.5,
    text: 'Queries decide what each device holds; a ledger remembers it; pokes carry the diffs; and the client answers from what it kept.',
  });
  tl.hold(59.7, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 60.2,
    dur: 5.5,
    text: 'Local-first reads, on your own Postgres — not by copying the database, but by syncing the questions you ask of it.',
  });
  tl.tween(dimU, 1, { at: 60.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 61.7, dur: 0.8, ease: ease.enter });
  tl.hold(65.7, 1.4);

  return {
    tl, cam, pgU, zoneU, devsU, l0, l1, l2, l3, pgGlow, vsGlow,
    fanU, flipU, fwU, recapU, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

/** The recap pulse: one dot re-tracing all four legs, then the fan. */
function recapDot(u: number) {
  const legs = [L0, L1, L2, L3];
  const seg = u * 5;
  if (seg < 4) {
    const i = Math.floor(seg);
    const t = seg - i;
    const { from, to } = legs[i];
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, fan: -1 };
  }
  return { x: 0, y: 0, fan: seg - 4 };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pgU = s.get(scene.pgU);
  const zoneU = s.get(scene.zoneU);
  const devsU = s.get(scene.devsU);
  const l0 = s.get(scene.l0);
  const l1 = s.get(scene.l1);
  const l2 = s.get(scene.l2);
  const l3 = s.get(scene.l3);
  const pgGlow = s.get(scene.pgGlow);
  const vsGlow = s.get(scene.vsGlow);
  const fanU = s.get(scene.fanU);
  const flipU = s.get(scene.flipU);
  const fwU = s.get(scene.fwU);
  const recapU = s.get(scene.recapU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const faded = 1 - 0.87 * dimU;
  const recap = recapU > 0 && recapU < 1 ? recapDot(recapU) : null;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={faded}>
          {/* your Postgres */}
          <g opacity={pgU}>
            <ServiceNode x={PG.x} y={PG.y} kind="db" label="your Postgres" sublabel="source of truth" glow={pgGlow + (recap && recapU * 5 > 1 && recapU * 5 < 2 ? 0.5 : 0)} />
          </g>

          {/* zero-cache */}
          <Zone x={ZONE.x} y={ZONE.y} w={ZONE.w} h={ZONE.h} label="zero-cache" u={zoneU} color={colors.ACCENT} />
          <g opacity={zoneU}>
            <ServiceNode x={REPLICA.x} y={REPLICA.y} kind="storage" label="replica" sublabel="zero.db · SQLite" />
            <ServiceNode x={VS.x} y={VS.y} kind="server" label="view syncer" sublabel="queries + ledger" glow={vsGlow} />
            <ServiceNode x={MUT.x} y={MUT.y} kind="fn" label="mutagen" sublabel="replays mutations" />
            <Connection from={L3.from} to={L3.to} u={zoneU} color={colors.GRID} arrow />
          </g>

          {/* the loop wiring */}
          <g opacity={Math.min(zoneU, pgU)}>
            <Connection from={L1.from} to={L1.to} u={zoneU} color={colors.GRID} arrow label="apply upstream" labelSize={10} dim={0.25} />
            <Connection from={L2.from} to={L2.to} u={zoneU} color={colors.GRID} arrow dashed label="the tape · pgoutput" labelSize={10} dim={0.25} />
          </g>
          <g opacity={devsU}>
            <Connection from={L0.from} to={L0.to} u={devsU} color={colors.GRID} arrow label="push" labelSize={10} dim={0.25} />
            {DEVICES.map((d, i) => (
              <Connection key={i} from={{ x: VS.x, y: VS.y + 36 }} to={{ x: d.x, y: d.y - 40 }} u={devsU} color={colors.GRID} dashed dim={0.45} />
            ))}
          </g>

          {/* the devices */}
          {DEVICES.map((d, i) => {
            const chipU = clamp01(fwU - i);
            const flipped = flipU > 0.5;
            return (
              <g key={d.fw} opacity={devsU}>
                <ServiceNode x={d.x} y={d.y} kind={i === 2 ? 'mobile' : 'browser'} label={d.fw} sublabel={flipped ? 'issue 42 · closed' : 'issue 42 · open'} glow={flipped && flipU < 0.9 ? 0.6 : 0} />
                <g opacity={chipU}>
                  <rect x={d.x - 105} y={d.y + 44} width={210} height={26} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.1} />
                  <text x={d.x} y={d.y + 61} textAnchor="middle" fill={colors.ACCENT} fontSize={10} fontFamily="ui-monospace, monospace">
                    {d.hook}
                  </text>
                </g>
              </g>
            );
          })}

          {/* the traveling write */}
          <Packet from={L0.from} to={L0.to} u={l0} r={7} color={colors.WARM} label={l0 > 0.1 && l0 < 0.9 ? 'closeIssue(42)' : undefined} labelSize={10} />
          <Packet from={L1.from} to={L1.to} u={l1} r={7} color={colors.WARM} />
          <Packet from={L2.from} to={L2.to} u={l2} r={7} color={colors.SECONDARY} label={l2 > 0.2 && l2 < 0.8 ? 'commit · update' : undefined} labelSize={10} />
          <Packet from={L3.from} to={L3.to} u={l3} r={7} color={colors.SECONDARY} />
          {/* the fan-out */}
          {fanU > 0 && fanU < 1 &&
            DEVICES.map((d, i) => {
              const u = clamp01(fanU * 1.4 - i * 0.12);
              if (u <= 0 || u >= 1) return null;
              return (
                <Packet
                  key={i}
                  from={{ x: VS.x, y: VS.y + 36 }}
                  to={{ x: d.x, y: d.y - 40 }}
                  u={u}
                  r={5.5}
                  color={colors.POSITIVE}
                  label={i === 0 && u > 0.2 && u < 0.85 ? 'poke · rowsPatch' : undefined}
                  labelSize={10}
                />
              );
            })}

          {/* the recap pulse */}
          {recap && recap.fan < 0 && <circle cx={recap.x} cy={recap.y} r={8} fill={colors.ACCENT} opacity={0.9} />}
          {recap && recap.fan >= 0 && recap.fan < 1 &&
            DEVICES.map((d, i) => {
              const from = { x: VS.x, y: VS.y + 36 };
              const to = { x: d.x, y: d.y - 40 };
              return (
                <circle
                  key={i}
                  cx={from.x + (to.x - from.x) * recap.fan}
                  cy={from.y + (to.y - from.y) * recap.fan}
                  r={6}
                  fill={colors.ACCENT}
                  opacity={0.9}
                />
              );
            })}
        </g>

        {/* closing panel */}
        <g opacity={closeU}>
          <rect x={300} y={200} width={680} height={230} rx={18} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={262} textAnchor="middle" fill={colors.ACCENT} fontSize={26} fontWeight={800} letterSpacing={1}>
            Zero Sync
          </text>
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={16.5}>
            local-first reads, on your own Postgres
          </text>
          <text x={640} y={338} textAnchor="middle" fill={colors.MUTED} fontSize={13.5} fontFamily="ui-monospace, monospace">
            Postgres → tape → replica → queries → pokes → device
          </text>
          <text x={640} y={376} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            React · Solid · React Native
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
