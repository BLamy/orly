// The Month's Verdict: spending by category, and the tap on the shoulder
//
// Backed by: solutions/system_design/mint/README.md — the SpendingByCategory
// MapReduce job over the raw transaction log files (sample line, tab
// delimited: user_id, timestamp, seller, amount): the mapper categorizes each
// seller, keeps only the current year and month, and emits
// (user_id, 2016-01, category), amount — e.g. shopping 25 and 100, gas 50;
// the reducer sums to (user_id, 2016-01, shopping), 125 and gas, 50;
// handle_budget_notifications calls the notification API if the total is
// nearing or exceeding the budget; results update the monthly_spending table;
// notifications go out asynchronously via a queue (amazon SES texts/emails);
// running analyses on the files reduces load on the database.
//
// ONE machine: the month as a set of category meters. Keyed amounts from the
// mapper pour into the meters; the reducer's totals rise against the budget
// lines from chapter two; the shopping meter crosses its line, the
// notification fires through the queue, and the phone buzzes.
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
import { Packet } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// The README's worked pairs, plus meters.
// ---------------------------------------------------------------------------

const LOGS = [
  { line: 'user_id · 2016-01-08 · Target · 25', cat: 0, amt: 25, keep: true },
  { line: 'user_id · 2016-01-16 · Target · 100', cat: 0, amt: 100, keep: true },
  { line: 'user_id · 2016-01-21 · Exxon · 50', cat: 1, amt: 50, keep: true },
  { line: 'user_id · 2015-12-30 · Grocer · 40', cat: -1, amt: 40, keep: false }, // wrong month
] as const;

const KEYED = [
  '(user_id, 2016-01, shopping), 25',
  '(user_id, 2016-01, shopping), 100',
  '(user_id, 2016-01, gas), 50',
] as const;

// meters: budget from the chapter-2 template (income $1,000/mo example scale)
const METERS = [
  { name: 'shopping', budget: 120, total: 125, color: colors.SECONDARY },
  { name: 'gas', budget: 100, total: 50, color: colors.WARM },
] as const;

const SRC = { x: 90, y0: 180, rowH: 54, w: 330 } as const;
const MID = { x: 480, y0: 180, rowH: 54, w: 330 } as const;
const MET = { x: 900, y0: 170, w: 300, h: 92, gap: 40 } as const;
const NOTIF = { qx: 900, qy: 470, px: 1140, py: 470 } as const;

const CAM_SRC: CameraState = { x: 420, y: 300, k: 1.25 };
const CAM_MET: CameraState = { x: 960, y: 260, k: 1.3 };
const CAM_NOTIF: CameraState = { x: 990, y: 420, k: 1.3 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  srcU: ChannelRef<number>;
  mapU: ChannelRef<number>;
  dropU: ChannelRef<number>;
  meterU: ChannelRef<number>;
  fillU: ChannelRef<number>;
  alarmU: ChannelRef<number>;
  queueU: ChannelRef<number>;
  buzzU: ChannelRef<number>;
  tblU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const srcU = tl.channel('srcU', 0); // raw log lines
  const mapU = tl.channel('mapU', 0); // mapper: categorize + keep the month
  const dropU = tl.channel('dropU', 0); // the out-of-month line falls
  const meterU = tl.channel('meterU', 0); // meters + budget lines
  const fillU = tl.channel('fillU', 0); // reducer totals pour in
  const alarmU = tl.channel('alarmU', 0); // shopping crosses the line
  const queueU = tl.channel('queueU', 0); // notification job → queue
  const buzzU = tl.channel('buzzU', 0); // the phone buzzes
  const tblU = tl.channel('tblU', 0); // monthly_spending table stamp
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the raw month —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Once a day, the raw transaction logs get read back, and the app answers the only question a budget cares about: how much did this user spend, in each category, this month.',
  });
  tl.tween(cam, CAM_SRC, { at: 0.7, dur: 1.4, ease: ease.move });
  tl.tween(srcU, 1, { at: 0.9, dur: 2.0, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · the mapper —
  tl.caption({
    at: 7.5,
    dur: 7.5,
    text: 'A map reduce job walks the log files so the database never feels it. The mapper names each line with the categorizer, keeps only the current month, and emits the user, the month, the category, and the amount.',
  });
  tl.tween(mapU, 1, { at: 8.4, dur: 3.0, ease: ease.linear });
  tl.tween(dropU, 1, { at: 11.8, dur: 1.4, ease: ease.move });
  tl.hold(15.5, 0.5);

  // — Beat 3 · december is rejected —
  tl.caption({
    at: 16.0,
    dur: 4.5,
    text: 'The December receipt does not survive the filter. Last month is history. This job is only about now.',
  });
  tl.hold(20.5, 0.5);

  // — Beat 4 · the reducer pours —
  tl.caption({
    at: 21.0,
    dur: 7,
    text: 'The reducer adds everything with the same key. Twenty five and one hundred at the same store become one hundred twenty five of shopping. Fifty stays fifty for gas. Those totals pour into the monthly meters.',
  });
  tl.tween(cam, CAM_MET, { at: 21.2, dur: 1.5, ease: ease.move });
  tl.tween(meterU, 1, { at: 21.4, dur: 1.2, ease: ease.enter });
  tl.tween(fillU, 1, { at: 22.8, dur: 3.4, ease: ease.linear });
  tl.hold(28.5, 0.5);

  // — Beat 5 · the line is crossed —
  tl.caption({
    at: 29.0,
    dur: 6.5,
    text: 'And there it is. The shopping meter climbs past its budget line. The gas meter sits comfortably at half. One of these two facts deserves to interrupt somebody.',
  });
  tl.tween(alarmU, 1, { at: 30.2, dur: 0.8, ease: ease.pop });
  tl.hold(35.5, 0.5);

  // — Beat 6 · the notification —
  tl.caption({
    at: 36.0,
    dur: 7,
    text: 'When a total nears or crosses its budget, the job calls the notification service. The message rides a queue, asynchronously, and arrives as a text or an email: you have exceeded your shopping budget.',
  });
  tl.tween(cam, CAM_NOTIF, { at: 36.2, dur: 1.4, ease: ease.move });
  tl.tween(queueU, 1, { at: 37.2, dur: 2.6, ease: ease.linear });
  tl.tween(buzzU, 1, { at: 40.2, dur: 0.8, ease: ease.pop });
  tl.hold(43.0, 0.5);

  // — Beat 7 · the table —
  tl.caption({
    at: 43.5,
    dur: 6,
    text: 'The totals also land in the monthly spending table, so when the user finally opens the app, the whole month is one indexed read, not five billion rows of arithmetic.',
  });
  tl.tween(tblU, 1, { at: 44.4, dur: 1.2, ease: ease.enter });
  tl.hold(49.5, 0.5);

  // — Beat 8 · recap —
  tl.caption({
    at: 50.0,
    dur: 8,
    text: 'That closes the loop. Link the account once. Queue the slow extraction. Name every transaction with a dictionary the crowd keeps honest. Sum the month with map reduce, and speak up only when a line gets crossed.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 50.2, dur: 1.5, ease: ease.move });
  tl.tween(closeU, 1, { at: 50.8, dur: 1.4, ease: ease.move });
  tl.hold(58.0, 1.5);

  return { tl, cam, srcU, mapU, dropU, meterU, fillU, alarmU, queueU, buzzU, tblU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcU = s.get(scene.srcU);
  const mapU = s.get(scene.mapU);
  const dropU = s.get(scene.dropU);
  const meterU = s.get(scene.meterU);
  const fillU = s.get(scene.fillU);
  const alarmU = s.get(scene.alarmU);
  const queueU = s.get(scene.queueU);
  const buzzU = s.get(scene.buzzU);
  const tblU = s.get(scene.tblU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.88;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- raw log lines ---- */}
        <g opacity={srcU * dimAll}>
          <text x={SRC.x} y={SRC.y0 - 36} fill={colors.TEXT} fontSize={15}>
            the raw month
          </text>
          <text x={SRC.x} y={SRC.y0 - 16} fill={colors.MUTED} fontSize={10.5} fontFamily="ui-monospace, monospace">
            user_id · timestamp · seller · amount
          </text>
          {LOGS.map((l, i) => {
            const appear = clamp01(srcU * 2 - i * 0.2);
            const fall = !l.keep ? dropU : 0;
            return (
              <g key={i} opacity={appear * (1 - fall)}>
                <rect x={SRC.x} y={SRC.y0 + i * SRC.rowH + fall * 80} width={SRC.w} height={SRC.rowH - 14} rx={8} fill={colors.PANEL} stroke={l.keep ? colors.GRID : colors.NEGATIVE} strokeWidth={1.1} />
                <text x={SRC.x + 12} y={SRC.y0 + i * SRC.rowH + 25 + fall * 80} fill={l.keep ? colors.MUTED : colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {l.line}
                </text>
              </g>
            );
          })}
          {dropU > 0.15 && dropU < 1 && (
            <text x={SRC.x + SRC.w / 2} y={SRC.y0 + 4 * SRC.rowH + 60} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace">
              period != current_year_month → skipped
            </text>
          )}
        </g>

        {/* ---- keyed pairs ---- */}
        <g opacity={dimAll}>
          {KEYED.map((k, i) => {
            const u = clamp01(mapU * 2.4 - i * 0.55);
            if (u <= 0) return null;
            const x = lerp(SRC.x + SRC.w, MID.x, u);
            const y = SRC.y0 + i * MID.rowH;
            return (
              <g key={i} opacity={u}>
                <rect x={x} y={y} width={MID.w} height={MID.rowH - 14} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
                <text x={x + 12} y={y + 25} fill={colors.TEXT} fontSize={10.5} fontFamily="ui-monospace, monospace">
                  {k}
                </text>
              </g>
            );
          })}
          {mapU > 0.3 && (
            <text x={MID.x} y={SRC.y0 - 16} fill={colors.ACCENT} fontSize={10.5} fontFamily="ui-monospace, monospace" opacity={clamp01(mapU * 2)}>
              mapper: categorize(seller) · keep current_year_month
            </text>
          )}
        </g>

        {/* ---- the meters ---- */}
        <g opacity={meterU * dimAll}>
          <text x={MET.x} y={MET.y0 - 30} fill={colors.TEXT} fontSize={15}>
            monthly spending vs budget
          </text>
          {METERS.map((m, i) => {
            const y = MET.y0 + i * (MET.h + MET.gap);
            const frac = clamp01((m.total * fillU) / (m.budget * 1.4));
            const over = m.total * fillU > m.budget;
            return (
              <g key={m.name}>
                <text x={MET.x} y={y - 8} fill={m.color} fontSize={12} fontFamily="ui-monospace, monospace">
                  {m.name}
                </text>
                <rect x={MET.x} y={y} width={MET.w} height={30} rx={8} fill={colors.BG} stroke={colors.GRID} />
                <rect x={MET.x} y={y} width={MET.w * frac} height={30} rx={8} fill={m.color} opacity={0.7} />
                {/* budget line */}
                <line x1={MET.x + MET.w * (m.budget / (m.budget * 1.4))} y1={y - 8} x2={MET.x + MET.w * (m.budget / (m.budget * 1.4))} y2={y + 38} stroke={over && alarmU > 0.3 ? colors.NEGATIVE : colors.TEXT} strokeWidth={2} strokeDasharray="5 4" />
                <text x={MET.x + MET.w + 12} y={y + 20} fill={over && alarmU > 0.3 ? colors.NEGATIVE : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                  {Math.round(m.total * fillU)} / {m.budget}
                </text>
                {over && alarmU > 0.3 && (
                  <text x={MET.x + MET.w * 0.5} y={y + 52} fill={colors.NEGATIVE} fontSize={10.5} fontFamily="ui-monospace, monospace" opacity={alarmU}>
                    handle_budget_notifications(key, total)
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* ---- notification queue + phone ---- */}
        <g opacity={clamp01(queueU * 4) * dimAll}>
          <rect x={NOTIF.qx - 90} y={NOTIF.qy - 24} width={180} height={48} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
          <text x={NOTIF.qx} y={NOTIF.qy - 2} textAnchor="middle" fill={colors.SECONDARY} fontSize={11.5}>
            Notification Service
          </text>
          <text x={NOTIF.qx} y={NOTIF.qy + 15} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
            queue · async
          </text>
        </g>
        {queueU > 0 && queueU < 1 && (
          <Packet from={{ x: MET.x + 120, y: MET.y0 + 40 }} to={{ x: NOTIF.qx, y: NOTIF.qy - 26 }} u={queueU} r={6.5} color={colors.NEGATIVE} />
        )}
        <g opacity={buzzU * dimAll}>
          <rect x={NOTIF.px - 34} y={NOTIF.py - 56} width={68} height={112} rx={12} fill={colors.PANEL} stroke={colors.TEXT} strokeWidth={1.5} />
          <rect x={NOTIF.px - 26} y={NOTIF.py - 40} width={52} height={34} rx={5} fill={colors.NEGATIVE} opacity={0.85} />
          <text x={NOTIF.px} y={NOTIF.py - 26} textAnchor="middle" fill={colors.BG} fontSize={7.5} fontFamily="ui-monospace, monospace">
            shopping budget
          </text>
          <text x={NOTIF.px} y={NOTIF.py - 16} textAnchor="middle" fill={colors.BG} fontSize={7.5} fontFamily="ui-monospace, monospace">
            exceeded
          </text>
          <text x={NOTIF.px} y={NOTIF.py + 74} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
            text / email
          </text>
        </g>

        {/* ---- monthly_spending stamp ---- */}
        <g opacity={tblU * dimAll}>
          <rect x={520} y={470} width={300} height={78} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
          <text x={670} y={496} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily="ui-monospace, monospace">
            monthly_spending
          </text>
          <text x={670} y={516} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily="ui-monospace, monospace">
            2016-01 · shopping · 125
          </text>
          <text x={670} y={534} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily="ui-monospace, monospace">
            2016-01 · gas · 50
          </text>
        </g>

        {/* ---- closing panel ---- */}
        <g opacity={closeU}>
          <rect x={265} y={195} width={750} height={280} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={244} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the budget app, closed loop
          </text>
          {[
            ['link', 'accounts table, password hashed'],
            ['extract', 'queued jobs drain the banks daily'],
            ['name', 'dictionary + crowd overrides heap'],
            ['judge', 'map reduce sums the month vs the template'],
            ['speak', 'notification only when a line is crossed'],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x={430} y={290 + i * 36} textAnchor="end" fill={colors.ACCENT} fontSize={13.5} fontFamily="ui-monospace, monospace">
                {k}
              </text>
              <text x={458} y={290 + i * 36} fill={colors.MUTED} fontSize={12.5}>
                {v}
              </text>
            </g>
          ))}
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
