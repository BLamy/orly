// The Evidence Must Be New
//
// Backed by: scripts/record-two-replays.mjs — listRecordings() snapshots
// `replayio list --json` BEFORE the run, re-lists AFTER, computes
// created = after minus beforeIds, throws unless created.length >= 2
// ("Expected at least 2 new Replay recordings"), then explicitly runs
// `replayio upload <id>` per new recording (the reporter is configured with
// upload:false in replay.playwright.config.mjs), scrapes each
// app.replay.io/recording URL, and writes the summary to
// recordings/latest.json.
//
// Machine: set difference as animation. A ledger of old recordings; the run
// appends rows; the after-list is held against the before-set and only the
// rows with no match glow as CREATED. The gate demands two of them. Then the
// new rows physically travel to the upload service and their URLs land in
// the latest.json card.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ServiceNode } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const LEDGER = { x: 110, y: 130, w: 360, rowH: 34 };
const GATE = { x: 620, y: 210, w: 300, h: 96 };
const CLOUD = { x: 1060, y: 180 };
const JSON_CARD = { x: 560, y: 360, w: 560, h: 210 };

const CAM_LEDGER: CameraState = { x: 340, y: 300, k: 1.28 };
const CAM_GATE: CameraState = { x: 690, y: 280, k: 1.22 };
const CAM_JSON: CameraState = { x: 780, y: 400, k: 1.16 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/* ------------------------------------------------------------------ data */
/** The local recording ledger — three pre-existing entries, two new ones. */
const OLD_ROWS = ['9f21c4a0-…', '4be07d13-…', 'c58a91f6-…'];
const NEW_ROWS = [
  { id: 'a7d34e02-…', who: 'Ada records the shared room' },
  { id: '61f9b8c5-…', who: 'Linus records the shared room' },
];

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ledgerU = tl.channel('ledgerU', 0); // the before-list
  const snapU = tl.channel('snapU', 0); // the before-set bracket
  const newU = tl.channel('newU', 0); // the run appends two rows
  const diffU = tl.channel('diffU', 0); // after − before highlight sweep
  const gateU = tl.channel('gateU', 0); // the >= 2 gate card
  const gateRed = tl.channel('gateRed', 0); // the throw branch, shown first
  const gatePass = tl.channel('gatePass', 0);
  const uploadU = tl.channel('uploadU', 0); // 0..2 rows travel to app.replay.io
  const jsonU = tl.channel('jsonU', 0); // latest.json card
  const urlU = tl.channel('urlU', 0); // URLs land in the card
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the trap this chapter avoids — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Here is a quiet failure mode: the test passes, you grab a recording, and it turns out to be last week’s. Stale evidence is worse than none, because it convinces you.',
  });
  tl.tween(cam, CAM_LEDGER, { at: t - 5.4, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · snapshot before — */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'So before anything runs, the script lists every recording already on this machine and remembers their identifiers. This is the before set — the world as it was.',
  });
  tl.tween(ledgerU, 1, { at: t - 5.2, dur: 1.4, ease: ease.enter });
  tl.tween(snapU, 1, { at: t - 2.6, dur: 1.0, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the run appends — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'Then chapter two happens: two witnesses, one conversation. When the workers exit, the ledger has grown.',
  });
  tl.tween(newU, 1, { at: t - 3.6, dur: 1.6, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the diff — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The script lists again and holds the after list against the before set. Anything with a remembered identifier is old news. Only the rows with no match count as created.',
  });
  tl.tween(diffU, 1, { at: t - 5.0, dur: 2.8, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the gate — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'And here is the gate: at least two new recordings, or the whole script throws. One witness could be a fluke of caching. Zero means the run proved nothing at all.',
  });
  tl.tween(cam, CAM_GATE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(gateU, 1, { at: t - 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(gateRed, 1, { at: t - 3.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the gate passes — */
  t = tl.caption({
    at: t,
    dur: 4.8,
    text: 'This run clears it: two fresh recordings, one per seat, both born in the last few seconds.',
  });
  tl.tween(gateRed, 0, { at: t - 4.4, dur: 0.6, ease: ease.move });
  tl.tween(gatePass, 1, { at: t - 3.8, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 7 · upload, explicitly — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Uploading is deliberate, not automatic. The reporter is told not to upload; the script does it itself, one recording at a time, so nothing ships unless the gate already passed.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(uploadU, 2, { at: t - 4.8, dur: 4.0, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 8 · latest.json — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Each upload comes back with a shareable address, and everything lands in one summary file: the room, the emulator endpoints, both recording links, and the path to the film.',
  });
  tl.tween(cam, CAM_JSON, { at: t - 5.6, dur: 1.4, ease: ease.move });
  tl.tween(jsonU, 1, { at: t - 5.0, dur: 0.8, ease: ease.enter });
  tl.tween(urlU, 1, { at: t - 3.6, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 9 · close — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'That summary is the run’s receipt. Anyone who doubts the claim does not ask the author — they open the links and interrogate the evidence themselves.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: t - 4.8, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.2, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, ledgerU, snapU, newU, diffU, gateU, gateRed, gatePass, uploadU, jsonU, urlU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function Ledger({
  u,
  snap,
  newRows,
  diff,
  upload,
  dim,
}: {
  u: number;
  snap: number;
  newRows: number;
  diff: number;
  upload: number;
  dim: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, rowH } = LEDGER;
  const total = OLD_ROWS.length + NEW_ROWS.length;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={1 - 0.8 * clamp01(dim)}>
      <text y={-32} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
        replayio list --json
      </text>
      {/* before-set bracket */}
      {clamp01(snap) > 0 && (
        <g opacity={clamp01(snap)}>
          <path
            d={`M -14 ${-8} h -8 v ${OLD_ROWS.length * rowH + 4} h 8`}
            fill="none"
            stroke={colors.MUTED}
            strokeWidth={1.6}
          />
          <text x={-30} y={(OLD_ROWS.length * rowH) / 2} textAnchor="end" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
            before
          </text>
        </g>
      )}
      {OLD_ROWS.map((id, i) => {
        const ru = clamp01(uu * (OLD_ROWS.length + 1) - i);
        if (ru <= 0) return null;
        const dimmed = clamp01(diff); // the diff dims the matched rows
        return (
          <g key={id} transform={`translate(0, ${i * rowH})`} opacity={ru * (1 - 0.6 * dimmed)}>
            <rect width={w} height={rowH - 8} rx={7} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={12} y={17} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              {id}
            </text>
            {dimmed > 0.5 && (
              <text x={w - 12} y={17} textAnchor="end" fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
                in before set
              </text>
            )}
          </g>
        );
      })}
      {NEW_ROWS.map((r, i) => {
        const idx = OLD_ROWS.length + i;
        const ru = clamp01(clamp01(newRows) * 2.4 - i);
        if (ru <= 0) return null;
        const lit = clamp01(diff * 2 - 0.6 - i * 0.2);
        // upload travel: row slides toward the cloud as its turn comes
        const tu = ease.move(clamp01(upload - i));
        const tx = tu * (CLOUD.x - 130 - (LEDGER.x + w));
        const ty = tu * (CLOUD.y + (i - 0.5) * 26 - (LEDGER.y + idx * rowH));
        const col = lit > 0.5 ? colors.POSITIVE : colors.TEXT;
        return (
          <g key={r.id} transform={`translate(${tx}, ${idx * rowH + (1 - ru) * 8 + ty})`} opacity={ru}>
            <rect
              width={w}
              height={rowH - 8}
              rx={7}
              fill={lit > 0.5 ? colors.POSITIVE : colors.PANEL}
              fillOpacity={lit > 0.5 ? 0.12 : 1}
              stroke={lit > 0.5 ? colors.POSITIVE : colors.GRID}
              strokeWidth={1.4}
            />
            <text x={12} y={17} fill={col} fontSize={12} fontFamily={MONO}>
              {r.id}
            </text>
            <text x={w - 12} y={17} textAnchor="end" fill={lit > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {lit > 0.5 ? 'CREATED' : r.who.split(' ')[0]}
            </text>
            {tu > 0.05 && tu < 0.98 && (
              <text x={w + 10} y={17} fill={colors.WARM} fontSize={10.5} fontFamily={MONO}>
                replayio upload {r.id.slice(0, 8)}
              </text>
            )}
          </g>
        );
      })}
      {uu >= 0.999 && total > 0 && null}
    </g>
  );
}

function GateCard({ u, red, pass, dim }: { u: number; red: number; pass: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const r = clamp01(red);
  const p = clamp01(pass);
  const { x, y, w, h } = GATE;
  const border = p > 0.5 ? colors.POSITIVE : r > 0.5 ? colors.NEGATIVE : colors.GRID;
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 10})`} opacity={uu * (1 - 0.8 * clamp01(dim))}>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={border} strokeWidth={1.8} />
      <text x={18} y={28} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        the gate
      </text>
      <text x={18} y={54} fill={colors.TEXT} fontSize={15} fontFamily={MONO} fontWeight={700}>
        created.length &gt;= 2
      </text>
      {r > 0.05 && p < 0.5 && (
        <text x={18} y={78} fill={colors.NEGATIVE} fontSize={11.5} fontFamily={MONO} opacity={r}>
          else: throw "Expected at least 2 new…"
        </text>
      )}
      {p > 0.05 && (
        <text x={18} y={78} fill={colors.POSITIVE} fontSize={12.5} fontFamily={MONO} opacity={p}>
          found 2 — pass ✓
        </text>
      )}
    </g>
  );
}

function LatestJson({ u, urls, dim }: { u: number; urls: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const { x, y, w, h } = JSON_CARD;
  const lines: [string, number][] = [
    ['{', 0],
    ['  "room": "replay-<timestamp>",', 0],
    ['  "appBaseUrl": "http://127.0.0.1:5175",', 0],
    ['  "recordings": [', 0],
    ['    { "url": "https://app.replay.io/recording/…" },   // Ada', 1],
    ['    { "url": "https://app.replay.io/recording/…" }    // Linus', 2],
    ['  ],', 0],
    ['  "mp4Path": "recordings/replay-<timestamp>.mp4"', 0],
    ['}', 0],
  ];
  return (
    <g transform={`translate(${x}, ${y + (1 - uu) * 12})`} opacity={uu * (1 - 0.3 * clamp01(dim))}>
      <text y={-10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
        recordings/latest.json — the run's receipt
      </text>
      <rect width={w} height={h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
      {lines.map(([text, urlIdx], i) => {
        const isUrl = urlIdx > 0;
        const lu = isUrl ? clamp01(clamp01(urls) * 2.4 - (urlIdx - 1)) : 1;
        if (lu <= 0) return null;
        return (
          <text
            key={i}
            x={18}
            y={26 + i * 20}
            fill={isUrl ? colors.ACCENT : colors.MUTED}
            fontSize={11.5}
            fontFamily={MONO}
            opacity={lu}
            fontWeight={isUrl ? 700 : 400}
          >
            {text}
          </text>
        );
      })}
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${170 + (1 - uu) * 12})`} opacity={uu}>
      <rect x={-330} y={-52} width={660} height={104} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-10} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
        Fresh evidence, or the run throws.
      </text>
      <text y={24} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily={MONO}>
        created = after − before · created.length ≥ 2 · replayio upload
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  return (
    <>
      <Ledger
        u={s.get(scene.ledgerU)}
        snap={s.get(scene.snapU)}
        newRows={s.get(scene.newU)}
        diff={s.get(scene.diffU)}
        upload={s.get(scene.uploadU)}
        dim={dim}
      />
      <GateCard u={s.get(scene.gateU)} red={s.get(scene.gateRed)} pass={s.get(scene.gatePass)} dim={dim} />
      <ServiceNode
        x={CLOUD.x}
        y={CLOUD.y}
        kind="external"
        label="app.replay.io"
        sublabel="replayio upload <id>"
        u={clamp01(s.get(scene.uploadU) * 3)}
        glow={clamp01(s.get(scene.uploadU) - 1.6)}
        dim={0.6 * dim}
      />
      <LatestJson u={s.get(scene.jsonU)} urls={s.get(scene.urlU)} dim={dim} />
      <ClosingCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
