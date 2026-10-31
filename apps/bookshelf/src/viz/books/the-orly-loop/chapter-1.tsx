// The Issue Is the Interface
//
// Backed by: .github/ISSUE_TEMPLATE/new-book.yml (the five-field form) and
// .github/workflows/new-book.yml (the collaborator gate: author_association
// OWNER/MEMBER/COLLABORATOR on `opened`, or a label event — only users with
// triage/write can label at all — plus the ack comment and per-issue
// concurrency). A form fills itself, folds into a book-token, and meets the
// gate; a stranger's token waits until the `build` label drops onto it. The
// closing beat plants the five-station ring the whole book travels.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ProgressRing, RING } from './ring';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — 1280×720 stage; captions own the bottom ~12% (y ≳ 633).
// ---------------------------------------------------------------------------

const FORM = { x: 130, y: 74, w: 400, h: 476 } as const;

/** The real issue-form fields (new-book.yml) with this very book's answers. */
const FIELDS: Array<{ label: string; value: string }> = [
  { label: 'Repo or source', value: 'https://github.com/BLamy/orly' },
  { label: 'What to explain', value: 'this repository itself' },
  { label: 'Cover title', value: 'ORLY Loop' },
  { label: 'Cover animal', value: 'ouroboros snake' },
  { label: 'Model', value: 'Fable 5 (claude-fable-5)' },
];
const FIELD_H = 62;
/** Stranger token sits a full row below the owner's, so its build chip clears the token above. */
const STRANGER_DY = 72;
const fieldY = (i: number) => FORM.y + 64 + i * (FIELD_H + 8);

/** Where the folded form lands: a traveling book-token. */
const TOKEN = { w: 168, h: 50, y: 330 } as const;
const TOKEN_START = { x: FORM.x + FORM.w / 2, y: 320 };
const TOKEN_WAIT_X = 700; // in front of the gate
const TOKEN_DONE_X = 895; // parked in the Actions lane, clear of the panel edge

/** The toll gate: pillar + swinging arm across the token lane. */
const GATE = { x: 800, top: 240, bot: 425, armLen: 150 } as const;

/** Stranger lane: same rail, later in time. */
const STRANGER_WAIT_X = 682;

const ACTIONS = { x: 990, y: 168, w: 270, h: 340 } as const;

// camera marks — each frame keeps its subject above the caption band (y ≲ 630)
const CAM_FORM: CameraState = { x: 336, y: 345, k: 1.2 };
const CAM_GATE: CameraState = { x: 700, y: 330, k: 1.5 };
const CAM_ACT: CameraState = { x: 1040, y: 330, k: 1.4 };

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  formU: ChannelRef<number>;
  fill: ChannelRef<number>;
  pressU: ChannelRef<number>;
  foldU: ChannelRef<number>;
  tokX: ChannelRef<number>;
  gateU: ChannelRef<number>;
  gateOpen: ChannelRef<number>;
  passFlash: ChannelRef<number>;
  strangerX: ChannelRef<number>;
  buildDrop: ChannelRef<number>;
  gateOpen2: ChannelRef<number>;
  strangerPass: ChannelRef<number>;
  actU: ChannelRef<number>;
  runP: ChannelRef<number>;
  ackU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  ringU: ChannelRef<number>;
  litU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const formU = tl.channel('formU', 0);
  const fill = tl.channel('fill', 0); // 0..5 — fields typing in, staggered
  const pressU = tl.channel('pressU', 0);
  const foldU = tl.channel('foldU', 0); // form → token
  const tokX = tl.channel('tokX', TOKEN_START.x);
  const gateU = tl.channel('gateU', 0);
  const gateOpen = tl.channel('gateOpen', 0);
  const passFlash = tl.channel('passFlash', 0);
  const strangerX = tl.channel('strangerX', -200);
  const buildDrop = tl.channel('buildDrop', 0);
  const gateOpen2 = tl.channel('gateOpen2', 0);
  const strangerPass = tl.channel('strangerPass', 0);
  const actU = tl.channel('actU', 0);
  const runP = tl.channel('runP', 0);
  const ackU = tl.channel('ackU', 0);
  const dimU = tl.channel('dimU', 0);
  const ringU = tl.channel('ringU', 0);
  const litU = tl.channel('litU', 0);

  // — Beat 1 · the form —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'Nobody edits files to put a book on this shelf. The whole request is a form on the repository — five fields and a submit button.',
  });
  tl.tween(formU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_FORM, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(fill, 2, { at: 1.8, dur: 4.6, ease: ease.linear });

  // — Beat 2 · the fields —
  tl.caption({
    at: 8.0,
    dur: 7,
    text: 'You name a repo, the subsystem to explain, a cover title, even the cover animal. The last field picks which model will write the book.',
  });
  tl.tween(fill, 5, { at: 8.2, dur: 5.6, ease: ease.linear });
  tl.hold(15.2, 0.6);

  // — Beat 3 · submit → issue + label —
  tl.caption({
    at: 15.8,
    dur: 6,
    text: 'Submit, and the form becomes an issue with a label on it. From here on, no human edits a single file.',
  });
  tl.tween(pressU, 1, { at: 16.2, dur: 0.4, ease: ease.pop });
  tl.tween(foldU, 1, { at: 16.9, dur: 1.1, ease: ease.move });
  tl.hold(21.8, 0.6);

  // — Beat 4 · the gate opens for the owner —
  tl.caption({
    at: 22.4,
    dur: 7,
    text: "Anyone can file one. But an issue only starts the machinery if the repo owner opened it — the first thing the pipeline checks is who's asking.",
  });
  tl.tween(cam, CAM_GATE, { at: 22.6, dur: 1.4, ease: ease.move });
  tl.tween(gateU, 1, { at: 23.0, dur: 1.0, ease: ease.draw });
  tl.tween(tokX, TOKEN_WAIT_X, { at: 24.2, dur: 1.4, ease: ease.move });
  tl.tween(gateOpen, 1, { at: 26.2, dur: 0.8, ease: ease.move });
  tl.tween(passFlash, 1, { at: 26.4, dur: 0.5, ease: ease.pop });
  tl.tween(tokX, TOKEN_DONE_X, { at: 27.2, dur: 1.4, ease: ease.move });
  tl.tween(gateOpen, 0, { at: 28.8, dur: 0.7, ease: ease.move });
  tl.tween(passFlash, 0, { at: 27.6, dur: 0.8, ease: ease.move });

  // — Beat 5 · the stranger + the build label —
  tl.caption({
    at: 29.8,
    dur: 7.5,
    text: "A stranger's issue just waits at the gate. When the owner applies one small label — build — that is the approval, and the same machinery starts.",
  });
  tl.tween(strangerX, STRANGER_WAIT_X, { at: 30.0, dur: 1.6, ease: ease.move });
  tl.tween(buildDrop, 1, { at: 33.4, dur: 0.9, ease: ease.pop });
  tl.tween(gateOpen2, 1, { at: 34.8, dur: 0.8, ease: ease.move });
  tl.tween(strangerPass, 1, { at: 35.8, dur: 1.3, ease: ease.move });
  tl.tween(gateOpen2, 0, { at: 37.4, dur: 0.7, ease: ease.move });

  // — Beat 6 · the workflow wakes —
  tl.caption({
    at: 37.9,
    dur: 6.5,
    text: 'On the other side, a workflow wakes up in continuous integration. One run per issue — relabeling cancels the old run and starts fresh.',
  });
  tl.tween(cam, CAM_ACT, { at: 38.1, dur: 1.4, ease: ease.move });
  tl.tween(actU, 1, { at: 38.5, dur: 0.8, ease: ease.enter });
  tl.tween(runP, 3, { at: 39.0, dur: 14, ease: ease.linear });

  // — Beat 7 · the ack comment —
  tl.caption({
    at: 44.9,
    dur: 5.5,
    text: 'The first thing the run does is answer: a comment lands back on the issue, so you can watch the build live.',
  });
  tl.tween(ackU, 1, { at: 45.4, dur: 0.7, ease: ease.pop });
  tl.hold(50.4, 0.6);

  // — Beat 8 · the ring (plant the throughline) —
  tl.caption({
    at: 51.0,
    dur: 7.5,
    text: 'That form was station one. The book you asked for is about to travel a loop — and every station on it is a machine we can watch.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 51.2, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 1, { at: 51.4, dur: 1.2, ease: ease.move });
  tl.tween(ringU, 1, { at: 52.4, dur: 2.2, ease: ease.draw });
  tl.tween(litU, 1, { at: 55.2, dur: 0.8, ease: ease.pop });
  tl.hold(58.5, 1.5);

  return {
    tl, cam, formU, fill, pressU, foldU, tokX, gateU, gateOpen, passFlash,
    strangerX, buildDrop, gateOpen2, strangerPass, actU, runP, ackU, dimU, ringU, litU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

/** One issue-form field; `u` 0..1 types the value in. */
function Field({ i, u }: { i: number; u: number }) {
  const f = FIELDS[i];
  const y = fieldY(i);
  const shown = f.value.slice(0, Math.round(clamp01(u) * f.value.length));
  const active = u > 0 && u < 1;
  return (
    <g>
      <text x={FORM.x + 22} y={y + 14} fill={colors.MUTED} fontSize={14}>
        {f.label}
      </text>
      <rect
        x={FORM.x + 20}
        y={y + 22}
        width={FORM.w - 40}
        height={30}
        rx={7}
        fill={colors.BG}
        stroke={active ? colors.ACCENT : colors.GRID}
        strokeWidth={active ? 1.6 : 1}
      />
      <text x={FORM.x + 32} y={y + 42} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
        {shown}
        {active ? '▏' : ''}
      </text>
      {i === 4 && <text x={FORM.x + FORM.w - 34} y={y + 42} fill={colors.MUTED} fontSize={12}>▾</text>}
    </g>
  );
}

/** The traveling book-token (an issue with its label). */
function BookToken({ x, y, gray, label, labelU = 1, op = 1 }: { x: number; y: number; gray?: boolean; label: string; labelU?: number; op?: number }) {
  if (op <= 0) return null;
  const stroke = gray ? colors.MUTED : colors.ACCENT;
  return (
    <g opacity={op}>
      <rect x={x - TOKEN.w / 2} y={y - TOKEN.h / 2} width={TOKEN.w} height={TOKEN.h} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={1.5} />
      <text x={x - TOKEN.w / 2 + 14} y={y + 6} fontSize={17}>📕</text>
      <text x={x - TOKEN.w / 2 + 40} y={y + 6} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
        {label}
      </text>
      {labelU > 0 && (
        <g opacity={clamp01(labelU)}>
          <rect x={x + TOKEN.w / 2 - 74} y={y - TOKEN.h / 2 - 12} width={80} height={22} rx={11} fill={gray ? colors.WARM : colors.TEAL} opacity={0.92} />
          <text x={x + TOKEN.w / 2 - 34} y={y - TOKEN.h / 2 + 3} textAnchor="middle" fill={colors.BG} fontSize={12} fontFamily={MONO} fontWeight={700}>
            {gray ? 'build' : 'new-book'}
          </text>
        </g>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const formU = s.get(scene.formU);
  const fill = s.get(scene.fill);
  const pressU = s.get(scene.pressU);
  const foldU = s.get(scene.foldU);
  const tokX = s.get(scene.tokX);
  const gateU = s.get(scene.gateU);
  const gateOpen = s.get(scene.gateOpen);
  const passFlash = s.get(scene.passFlash);
  const strangerX = s.get(scene.strangerX);
  const buildDrop = s.get(scene.buildDrop);
  const gateOpen2 = s.get(scene.gateOpen2);
  const strangerPass = s.get(scene.strangerPass);
  const actU = s.get(scene.actU);
  const runP = s.get(scene.runP);
  const ackU = s.get(scene.ackU);
  const dimU = s.get(scene.dimU);
  const ringU = s.get(scene.ringU);
  const litU = s.get(scene.litU);

  const open = Math.max(gateOpen, gateOpen2);
  const armAngle = -78 * open; // degrees; 0 = barring the lane
  // the old form and pipeline fade fully away so the ring finale is drawn on a clean stage
  const worldOp = 1 - dimU;

  // the stranger queues in the lane below the owner's token once through the gate
  const strangerFinalX = strangerX + strangerPass * (TOKEN_DONE_X - STRANGER_WAIT_X);
  // the build chip falls from above and lands straddling the stranger token's top edge, like new-book
  const chipY = -40 + buildDrop * (STRANGER_DY - TOKEN.h / 2 - 12 + 40);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={worldOp}>
          {/* ---- the issue form (folds into the token as foldU rises) ---- */}
          {formU > 0 && foldU < 1 && (
            <g
              opacity={formU * (1 - foldU)}
              transform={`translate(${TOKEN_START.x} ${TOKEN_START.y}) scale(${1 - 0.82 * foldU}) translate(${-TOKEN_START.x} ${-TOKEN_START.y})`}
            >
              <rect x={FORM.x} y={FORM.y} width={FORM.w} height={FORM.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={FORM.x + 22} y={FORM.y + 34} fill={colors.TEXT} fontSize={17} fontWeight={700}>
                📕 New book
              </text>
              <text x={FORM.x + FORM.w - 22} y={FORM.y + 34} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                new-book.yml
              </text>
              {FIELDS.map((_, i) => (
                <Field key={i} i={i} u={clamp01(fill - i)} />
              ))}
              {/* submit */}
              <rect
                x={FORM.x + FORM.w - 118}
                y={FORM.y + FORM.h - 46}
                width={96}
                height={30}
                rx={7}
                fill={pressU > 0.5 ? colors.POSITIVE : colors.ACCENT}
                opacity={0.4 + 0.6 * clamp01(fill / 5)}
              />
              <text x={FORM.x + FORM.w - 70} y={FORM.y + FORM.h - 26} textAnchor="middle" fill={colors.BG} fontSize={13.5} fontWeight={700}>
                Submit
              </text>
            </g>
          )}

          {/* lane hint — drawn under the tokens so the dashes never cut a label */}
          {gateU > 0 && (
            <line x1={560} y1={TOKEN.y} x2={ACTIONS.x - 12} y2={TOKEN.y} stroke={colors.GRID} strokeWidth={1} strokeDasharray="2 8" opacity={0.5 * gateU * (1 - dimU)} />
          )}

          {/* ---- the owner's token ---- */}
          {foldU > 0.5 && <BookToken x={tokX} y={TOKEN.y} label="issue #78" labelU={(foldU - 0.5) * 2} />}

          {/* ---- the stranger's token + falling build label ---- */}
          {strangerX > -100 && (
            <g>
              <BookToken x={strangerFinalX} y={TOKEN.y + STRANGER_DY} gray label="issue #79" labelU={0} />
              <text
                x={strangerFinalX}
                y={TOKEN.y + STRANGER_DY + 42}
                textAnchor="middle"
                fill={colors.MUTED}
                fontSize={14}
                fontStyle="italic"
                opacity={1 - strangerPass}
              >
                opened by a stranger
              </text>
              {buildDrop > 0 && (
                <g opacity={clamp01(buildDrop * 3)}>
                  <rect x={strangerFinalX + TOKEN.w / 2 - 74} y={TOKEN.y + chipY} width={80} height={22} rx={11} fill={colors.WARM} />
                  <text x={strangerFinalX + TOKEN.w / 2 - 34} y={TOKEN.y + chipY + 15} textAnchor="middle" fill={colors.BG} fontSize={12} fontFamily={MONO} fontWeight={700}>
                    build
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ---- the gate ---- */}
          {gateU > 0 && (
            <g opacity={gateU}>
              <line x1={GATE.x} y1={GATE.top - 40} x2={GATE.x} y2={GATE.top + 24} stroke={colors.GRID} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
              <circle cx={GATE.x} cy={GATE.top + 30} r={9} fill={colors.PANEL} stroke={passFlash > 0.1 || open > 0.5 ? colors.POSITIVE : colors.MUTED} strokeWidth={2} />
              <g transform={`rotate(${armAngle} ${GATE.x} ${GATE.top + 30})`}>
                <line
                  x1={GATE.x}
                  y1={GATE.top + 30}
                  x2={GATE.x}
                  y2={GATE.top + 30 + GATE.armLen}
                  stroke={open > 0.5 ? colors.POSITIVE : colors.WARM}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
              </g>
              <line x1={GATE.x} y1={GATE.bot} x2={GATE.x} y2={GATE.bot + 40} stroke={colors.GRID} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
              <text x={GATE.x} y={GATE.top - 54} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                author_association: OWNER | MEMBER | COLLABORATOR
              </text>
              <text x={GATE.x} y={GATE.bot + 62} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontStyle="italic">
                the collaborator gate
              </text>
              {passFlash > 0 && <circle cx={GATE.x} cy={TOKEN.y} r={40} fill={colors.POSITIVE} opacity={0.25 * passFlash} />}
            </g>
          )}

          {/* ---- the Actions panel ---- */}
          {actU > 0 && (
            <g opacity={actU}>
              <rect x={ACTIONS.x} y={ACTIONS.y} width={ACTIONS.w} height={ACTIONS.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={ACTIONS.x + 20} y={ACTIONS.y + 30} fill={colors.TEXT} fontSize={15} fontWeight={700}>
                Actions
              </text>
              <text x={ACTIONS.x + 20} y={ACTIONS.y + 56} fill={colors.MUTED} fontSize={12.5} fontFamily={MONO}>
                Book pipeline (issue → book)
              </text>
              {/* spinner: sweep angle is a pure function of runP */}
              <g transform={`translate(${ACTIONS.x + 30}, ${ACTIONS.y + 84})`}>
                <circle r={9} fill="none" stroke={colors.GRID} strokeWidth={2.5} />
                <circle
                  r={9}
                  fill="none"
                  stroke={colors.WARM}
                  strokeWidth={2.5}
                  pathLength={1}
                  strokeDasharray="0.25 0.75"
                  strokeDashoffset={-runP}
                  strokeLinecap="round"
                />
              </g>
              <text x={ACTIONS.x + 52} y={ACTIONS.y + 89} fill={colors.WARM} fontSize={13}>
                in progress
              </text>
              <text x={ACTIONS.x + 20} y={ACTIONS.y + 118} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                concurrency: book-issue-78
              </text>
              <text x={ACTIONS.x + 20} y={ACTIONS.y + 136} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                cancel-in-progress: true
              </text>
              {/* the ack comment */}
              {ackU > 0 && (
                <g opacity={ackU} transform={`translate(0 ${(1 - ackU) * 14})`}>
                  <rect x={ACTIONS.x + 16} y={ACTIONS.y + 158} width={ACTIONS.w - 32} height={128} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.4} />
                  <circle cx={ACTIONS.x + 40} cy={ACTIONS.y + 184} r={12} fill={colors.PANEL} stroke={colors.GRID} />
                  <text x={ACTIONS.x + 40} y={ACTIONS.y + 189} textAnchor="middle" fontSize={12}>🤖</text>
                  <text x={ACTIONS.x + 60} y={ACTIONS.y + 182} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    github-actions · now
                  </text>
                  <text x={ACTIONS.x + 32} y={ACTIONS.y + 218} fill={colors.TEXT} fontSize={13}>
                    On it — generating in CI.
                  </text>
                  <text x={ACTIONS.x + 32} y={ACTIONS.y + 240} fill={colors.MUTED} fontSize={12}>
                    Track progress in the Actions tab.
                  </text>
                  <text x={ACTIONS.x + 32} y={ACTIONS.y + 268} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                    ▸ issue #78 · comment
                  </text>
                </g>
              )}
            </g>
          )}

        </g>

        {/* ---- the ring finale ---- */}
        <ProgressRing ringU={ringU} lit={1} litU={litU} />
        {litU > 0 && (
          <text x={RING.cx} y={RING.cy + 8} textAnchor="middle" fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={litU}>
            station one of five
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
