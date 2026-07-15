// Two Homes for One Paste
//
// Backing files: solutions/system_design/pastebin/README.md — the write path
// (Client → Web Server as reverse proxy → Write API → SQL Database `pastes`
// table + Object Store such as Amazon S3), the real `pastes` schema
// (shortlink char(7) PRIMARY KEY, expiration_length_in_minutes, created_at,
// paste_path varchar(255)), the shortlink-primary-key index giving log-time
// lookups instead of full scans, the REST create call and its
// {"shortlink": ...} response, and "4 average paste writes per second should
// be do-able for a single SQL Write Master-Slave".
//
// Centerpiece: the paste physically splits — the feather-light metadata row
// slides into the SQL table while the heavy 1 KB content slab sinks into the
// object store, and the paste_path thread ties the two homes together. Then
// an index race: a scan pointer crawls the table while the primary-key index
// reaches the row in a handful of hops.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout + precomputed table rows (seeded, deterministic).
// ---------------------------------------------------------------------------

const CLIENT = { x: 120, y: 300 } as const;
const WEB = { x: 330, y: 300 } as const;
const WRITE = { x: 555, y: 300 } as const;
const STORE = { x: 1060, y: 170 } as const;

const TABLE = { x: 760, y: 392, w: 460, rowH: 26, rows: 7 } as const;
const SHORTLINK = 'dSUUsvo';
const ALPHA62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const rand = mulberry32(7462);
const mkLink = (): string =>
  Array.from({ length: 7 }, () => ALPHA62[Math.floor(rand() * 62)]).join('');
// existing rows; the new row (index 4, keeps the table visibly ordered-ish)
const EXISTING = Array.from({ length: TABLE.rows - 1 }, () => mkLink());
const NEW_ROW_AT = 4;
const ROW_LINKS: string[] = [
  ...EXISTING.slice(0, NEW_ROW_AT),
  SHORTLINK,
  ...EXISTING.slice(NEW_ROW_AT),
];

const SCHEMA = [
  { field: 'shortlink', type: 'char(7)  PRIMARY KEY' },
  { field: 'expiration_length_in_minutes', type: 'int' },
  { field: 'created_at', type: 'datetime' },
  { field: 'paste_path', type: 'varchar(255)' },
] as const;

const rowY = (i: number): number => TABLE.y + 60 + i * TABLE.rowH;

// index race — the scan pointer visits every row; the index hops log-style
const SCAN_DUR = 1; // in raceU units, scan uses the whole window
const HOPS = [0, 6, 3, 4]; // binary-search style hops ending on the new row

const CAM_FLOW: CameraState = { x: 430, y: 300, k: 1.35 };
const CAM_SPLIT: CameraState = { x: 820, y: 330, k: 1.15 };
const CAM_TABLE: CameraState = { x: 940, y: 440, k: 1.35 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  nodesU: ChannelRef<number>;
  reqU: ChannelRef<number>;
  mintU: ChannelRef<number>;
  pasteU: ChannelRef<number>;
  tableU: ChannelRef<number>;
  schemaU: ChannelRef<number>;
  rowU: ChannelRef<number>;
  slabU: ChannelRef<number>;
  threadU: ChannelRef<number>;
  raceU: ChannelRef<number>;
  respU: ChannelRef<number>;
  quietU: ChannelRef<number>;
  meterU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_FLOW, cameraInterp);
  const nodesU = tl.channel('nodesU', 0);
  const reqU = tl.channel('reqU', 0);
  const mintU = tl.channel('mintU', 0);
  const pasteU = tl.channel('pasteU', 0);
  const tableU = tl.channel('tableU', 0);
  const schemaU = tl.channel('schemaU', 0);
  const rowU = tl.channel('rowU', 0);
  const slabU = tl.channel('slabU', 0);
  const threadU = tl.channel('threadU', 0);
  const raceU = tl.channel('raceU', 0);
  const respU = tl.channel('respU', 0);
  const quietU = tl.channel('quietU', 0);
  const meterU = tl.channel('meterU', 0);

  // — Beat 1 · two homes —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Our link has a name. Now the paste itself needs somewhere to live — and it turns out it needs two homes, not one.',
  });
  tl.tween(nodesU, 1, { at: 0.6, dur: 1.2, ease: ease.enter });
  tl.tween(pasteU, 1, { at: 3.6, dur: 0.9, ease: ease.enter });
  tl.hold(6.0, 0.5);

  // — Beat 2 · the write request —
  tl.caption({
    at: 6.6,
    dur: 5.6,
    text: 'The client sends the create request to a web server running as a reverse proxy, and the web server hands it to the write service.',
  });
  tl.tween(reqU, 1, { at: 7.0, dur: 3.6, ease: ease.linear });

  // — Beat 3 · mint + check —
  tl.caption({
    at: 12.6,
    dur: 5.2,
    text: "There, the seven character link is minted exactly like last chapter — and checked against the database, so no two pastes ever share a name.",
  });
  tl.tween(mintU, 1, { at: 13.0, dur: 1.0, ease: ease.pop });

  // — Beat 4 · the split, motivated —
  tl.caption({
    at: 18.2,
    dur: 6.8,
    text: "Here's the split. A relational database makes a fine hash table — but stuffing every kilobyte of content into it would bloat the very table we need to keep fast. So the primer separates the light from the heavy.",
  });
  tl.tween(cam, CAM_SPLIT, { at: 18.4, dur: 1.6, ease: ease.move });
  tl.tween(tableU, 1, { at: 19.4, dur: 1.4, ease: ease.draw });
  tl.hold(25.4, 0.5);

  // — Beat 5 · the metadata row —
  tl.caption({
    at: 26.0,
    dur: 6.6,
    text: 'The light half is the row: the seven byte shortlink as the primary key, an expiration, a created time, and a path of at most two hundred fifty five bytes that points somewhere else.',
  });
  tl.tween(cam, CAM_TABLE, { at: 26.2, dur: 1.4, ease: ease.move });
  tl.tween(schemaU, 1, { at: 26.8, dur: 3.6, ease: ease.move });
  tl.tween(rowU, 1, { at: 30.8, dur: 1.2, ease: ease.move });
  tl.hold(32.8, 0.5);

  // — Beat 6 · the content slab —
  tl.caption({
    at: 33.4,
    dur: 6.4,
    text: "The heavy half — the kilobyte of content — sinks into a managed object store like Amazon's S3. No file servers to babysit. And the path in the row is the thread that ties the two homes together.",
  });
  tl.tween(cam, CAM_SPLIT, { at: 33.6, dur: 1.4, ease: ease.move });
  tl.tween(slabU, 1, { at: 34.4, dur: 1.8, ease: ease.move });
  tl.tween(threadU, 1, { at: 37.4, dur: 1.4, ease: ease.draw });
  tl.hold(39.8, 0.5);

  // — Beat 7 · the index race —
  tl.caption({
    at: 40.4,
    dur: 6.6,
    text: 'Why fuss over the primary key? Because it builds an index. Finding a link becomes a few logarithmic hops instead of a crawl across three hundred sixty million rows — watch the race.',
  });
  tl.tween(cam, CAM_TABLE, { at: 40.6, dur: 1.2, ease: ease.move });
  tl.tween(raceU, 1, { at: 42.0, dur: 4.4, ease: ease.linear });
  tl.hold(47.0, 0.5);

  // — Beat 8 · the response —
  tl.caption({
    at: 47.6,
    dur: 5.2,
    text: 'The write is done — one request, one row, one object. The response carries the short link back to the user.',
  });
  tl.tween(cam, CAM_WIDE, { at: 47.8, dur: 1.4, ease: ease.move });
  tl.tween(respU, 1, { at: 48.6, dur: 3.0, ease: ease.linear });

  // — Beat 9 · the easy half —
  tl.caption({
    at: 53.2,
    dur: 6.6,
    text: 'And the pace? Four writes a second on average. A single write master with a standby replica takes that without breathing hard. The write path is the easy half — the read path is where the fight is.',
  });
  tl.tween(quietU, 1, { at: 53.4, dur: 1.2, ease: ease.move });
  tl.tween(meterU, 1, { at: 54.6, dur: 0.9, ease: ease.enter });
  tl.hold(59.4, 1.5);

  return {
    tl,
    cam,
    nodesU,
    reqU,
    mintU,
    pasteU,
    tableU,
    schemaU,
    rowU,
    slabU,
    threadU,
    raceU,
    respU,
    quietU,
    meterU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const nodesU = s.get(scene.nodesU);
  const reqU = s.get(scene.reqU);
  const mintU = s.get(scene.mintU);
  const pasteU = s.get(scene.pasteU);
  const tableU = s.get(scene.tableU);
  const schemaU = s.get(scene.schemaU);
  const rowU = s.get(scene.rowU);
  const slabU = s.get(scene.slabU);
  const threadU = s.get(scene.threadU);
  const raceU = s.get(scene.raceU);
  const respU = s.get(scene.respU);
  const quietU = s.get(scene.quietU);
  const meterU = s.get(scene.meterU);

  const dim = 1 - quietU * 0.86;

  // the paste card floats beside the write service, then splits
  const cardX = 620;
  const cardY = 150;
  // the content slab travels from the card into the object store
  const slabX = cardX + (STORE.x - 60 - cardX) * slabU;
  const slabY = cardY + 46 + (STORE.y - 10 - cardY - 46) * slabU;

  // index race pointers
  const scanRow = clamp01(raceU / SCAN_DUR) * (TABLE.rows - 1);
  const hopIdx = Math.min(Math.floor(raceU * HOPS.length * 1.6), HOPS.length - 1);
  const scanDone = Math.floor(scanRow) >= NEW_ROW_AT && ROW_LINKS[Math.floor(scanRow)] === SHORTLINK;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the service chain ---- */}
        <g opacity={dim}>
          <ServiceNode x={CLIENT.x} y={CLIENT.y} kind="client" label="Client" u={nodesU} />
          <ServiceNode x={WEB.x} y={WEB.y} kind="gateway" label="Web Server" sublabel="reverse proxy" u={clamp01(nodesU * 1.5 - 0.2)} />
          <ServiceNode
            x={WRITE.x}
            y={WRITE.y}
            kind="server"
            label="Write API"
            u={clamp01(nodesU * 1.5 - 0.5)}
            glow={mintU * (1 - slabU)}
          />
          <Connection from={{ x: CLIENT.x + 46, y: CLIENT.y }} to={{ x: WEB.x - 56, y: WEB.y }} u={nodesU} arrow />
          <Connection from={{ x: WEB.x + 56, y: WEB.y }} to={{ x: WRITE.x - 56, y: WRITE.y }} u={clamp01(nodesU * 1.5 - 0.4)} arrow label="POST /paste" labelSize={10} />
          <RequestFlow
            path={[
              { x: CLIENT.x, y: CLIENT.y },
              { x: WEB.x, y: WEB.y },
              { x: WRITE.x, y: WRITE.y },
            ]}
            u={reqU}
            color={colors.WARM}
            label="create"
            hold={false}
          />
          {mintU > 0 && (
            <g opacity={mintU * (1 - slabU)}>
              <rect x={WRITE.x - 62} y={WRITE.y + 44} width={124} height={26} rx={7} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={WRITE.x} y={WRITE.y + 62} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace">
                /{SHORTLINK}
              </text>
            </g>
          )}
        </g>

        {/* ---- the paste card (metadata + content) ---- */}
        {pasteU > 0 && (
          <g opacity={dim}>
            {/* metadata chip — stays until it becomes the row */}
            {rowU < 1 && (
              <g opacity={pasteU * (1 - rowU)}>
                <rect
                  x={cardX + (TABLE.x + 8 - cardX) * rowU}
                  y={cardY + (rowY(NEW_ROW_AT) - cardY) * rowU}
                  width={200}
                  height={34}
                  rx={7}
                  fill={colors.PANEL}
                  stroke={colors.TEAL}
                  strokeWidth={1.4}
                />
                <text x={cardX + (TABLE.x + 8 - cardX) * rowU + 100} y={cardY + (rowY(NEW_ROW_AT) - cardY) * rowU + 22} textAnchor="middle" fill={colors.TEAL} fontSize={12}>
                  metadata — ~270 B
                </text>
              </g>
            )}
            {/* content slab — sinks into the object store */}
            {slabU < 1 && (
              <g opacity={pasteU * (1 - clamp01(slabU * 1.25 - 0.2))}>
                <rect x={slabX} y={slabY} width={200} height={56} rx={7} fill={colors.ACCENT} opacity={0.4} />
                <rect x={slabX} y={slabY} width={200} height={56} rx={7} fill="none" stroke={colors.ACCENT} strokeWidth={1.4} />
                <text x={slabX + 100} y={slabY + 33} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
                  content — 1 KB
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---- the object store ---- */}
        <g opacity={dim}>
          <ServiceNode
            x={STORE.x}
            y={STORE.y}
            kind="storage"
            label="Object Store"
            sublabel="Amazon S3"
            u={clamp01(tableU * 1.4)}
            glow={clamp01(slabU * 2 - 1) * (1 - raceU)}
          />
          {slabU >= 1 && (
            <text x={STORE.x} y={STORE.y + 52} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              /pastes/{SHORTLINK}
            </text>
          )}
        </g>

        {/* ---- the pastes table ---- */}
        {tableU > 0 && (
          <g opacity={tableU * dim}>
            <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={70 + TABLE.rows * TABLE.rowH} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={TABLE.x + 14} y={TABLE.y + 22} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
              pastes
            </text>
            <text x={TABLE.x + TABLE.w - 14} y={TABLE.y + 22} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              SQL Database · … 360,000,000 rows
            </text>
            {/* header */}
            <text x={TABLE.x + 16} y={TABLE.y + 52} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
              shortlink
            </text>
            <text x={TABLE.x + 130} y={TABLE.y + 52} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
              expiration
            </text>
            <text x={TABLE.x + 230} y={TABLE.y + 52} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
              created_at
            </text>
            <text x={TABLE.x + 340} y={TABLE.y + 52} fill={colors.MUTED} fontSize={10} fontFamily="monospace">
              paste_path
            </text>
            {/* rows */}
            {ROW_LINKS.map((link, i) => {
              const isNew = i === NEW_ROW_AT;
              const visible = isNew ? rowU : clamp01(tableU * 2 - i * 0.12);
              if (visible <= 0) return null;
              const y = rowY(i);
              const scanHere = raceU > 0 && raceU < 1 && Math.floor(scanRow) === i && !scanDone;
              const hopHere = raceU > 0 && HOPS[hopIdx] === i;
              return (
                <g key={i} opacity={visible}>
                  <rect
                    x={TABLE.x + 8}
                    y={y}
                    width={TABLE.w - 16}
                    height={TABLE.rowH - 4}
                    rx={4}
                    fill={isNew ? colors.TEAL : colors.BG}
                    opacity={isNew ? 0.25 : 0.6}
                  />
                  <text x={TABLE.x + 16} y={y + 15} fill={isNew ? colors.TEAL : colors.TEXT} fontSize={11} fontFamily="monospace" fontWeight={isNew ? 700 : 400}>
                    {link}
                  </text>
                  <text x={TABLE.x + 130} y={y + 15} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {isNew ? '60' : '—'}
                  </text>
                  <text x={TABLE.x + 230} y={y + 15} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                    {isNew ? '2016-07-07' : '…'}
                  </text>
                  <text x={TABLE.x + 340} y={y + 15} fill={isNew ? colors.ACCENT : colors.MUTED} fontSize={11} fontFamily="monospace">
                    {isNew ? `/pastes/${SHORTLINK}` : '…'}
                  </text>
                  {/* race pointers */}
                  {scanHere && <circle cx={TABLE.x - 14} cy={y + 11} r={6} fill={colors.NEGATIVE} />}
                  {hopHere && raceU < 1 && <circle cx={TABLE.x + TABLE.w + 14} cy={y + 11} r={6} fill={colors.POSITIVE} />}
                </g>
              );
            })}
            {/* race labels */}
            {raceU > 0 && (
              <g opacity={clamp01(raceU * 3)}>
                <text x={TABLE.x - 14} y={TABLE.y + 24} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10}>
                  scan
                </text>
                <text x={TABLE.x + TABLE.w + 14} y={TABLE.y + 24} textAnchor="middle" fill={colors.POSITIVE} fontSize={10}>
                  index
                </text>
              </g>
            )}
            {raceU > 0.6 && (
              <MathLabel tex={'\\log_2(360\\,\\mathrm{M}) \\approx 28\\ \\text{hops}'} x={TABLE.x + TABLE.w - 150} y={TABLE.y - 24} fontSize={16} color={colors.POSITIVE} opacity={clamp01(raceU * 4 - 2.6)} />
            )}
          </g>
        )}

        {/* ---- schema panel ---- */}
        {schemaU > 0 && (
          <g opacity={clamp01(schemaU * 2) * dim}>
            <rect x={430} y={430} width={300} height={126} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            {SCHEMA.map((f, i) => {
              const u = clamp01(schemaU * 5 - i * 1.0);
              return (
                <g key={f.field} opacity={u}>
                  <text x={444} y={456 + i * 26} fill={colors.TEAL} fontSize={11} fontFamily="monospace">
                    {f.field}
                  </text>
                  <text x={716} y={456 + i * 26} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily="monospace">
                    {f.type}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ---- the paste_path thread: row → object ---- */}
        {threadU > 0 && (
          <g opacity={dim}>
            <Connection
              from={{ x: TABLE.x + TABLE.w - 40, y: rowY(NEW_ROW_AT) + 10 }}
              to={{ x: STORE.x, y: STORE.y + 40 }}
              elbow="v"
              u={threadU}
              color={colors.ACCENT}
              dashed
              arrow
              label="paste_path"
              labelSize={10}
            />
          </g>
        )}

        {/* ---- the response going home ---- */}
        {respU > 0 && (
          <g opacity={dim}>
            <RequestFlow
              path={[
                { x: WRITE.x, y: WRITE.y },
                { x: WEB.x, y: WEB.y },
                { x: CLIENT.x, y: CLIENT.y },
              ]}
              u={respU}
              color={colors.POSITIVE}
              label="201"
              hold={false}
            />
            <g opacity={clamp01(respU * 3 - 1.8)}>
              <rect x={CLIENT.x - 60} y={CLIENT.y - 110} width={260} height={34} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} />
              <text x={CLIENT.x + 70} y={CLIENT.y - 88} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                {'{ "shortlink": "dSUUsvo" }'}
              </text>
            </g>
          </g>
        )}

        {/* ---- quiet close: the easy half ---- */}
        {meterU > 0 && (
          <g opacity={meterU}>
            <rect x={390} y={240} width={500} height={130} rx={16} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={640} y={288} textAnchor="middle" fill={colors.WARM} fontSize={26} fontWeight={700}>
              4 writes / second
            </text>
            <text x={640} y={324} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              one SQL write master + standby handles it
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
