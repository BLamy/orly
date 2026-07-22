// Highlights — NIP-84, chapter 5 (series close).
//
// Grounded in NIP-84: kind 9802; `.content` is the highlighted text itself;
// an `a` (or `e`) tag points at the source event; a `context` tag carries the
// surrounding text so the quote is not stranded; `p` tags attribute the
// author. The highlight points at the ADDRESSABLE article by its coordinate
// (from chapter 2), so it rides the living pointer rather than a frozen id —
// and a highlight is itself an event others can react to. Ties the book shut.
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
import { TokenFlight, shortHex } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const PUBKEY = '8e0d3d3eb2881ec137a11debbcf7f9df8ea3401e976a8fb2ef9ee0e79a5e0ed7';
const COORD = `30023:${shortHex(PUBKEY, 6, 4)}:why-relays`;
const HIGHLIGHT_TEXT = 'A relay is a dumb pipe; the durability lives in the words.';

// article page (left)
const PAGE = { x: 110, y: 130, w: 420, h: 440 };
const BODY_ROWS = 11;
const HL_ROW = 5; // the highlighted line

// the 9802 event (right)
const EV = { x: 660, y: 150, w: 470 };
const EV_FIELDS = [
  { k: 'kind', v: '9802', color: colors.WARM },
  { k: 'content', v: `"${HIGHLIGHT_TEXT}"`, color: colors.POSITIVE },
  { k: 'a', v: COORD, color: colors.ACCENT },
  { k: 'context', v: '…the whole paragraph around it…', color: colors.MUTED },
  { k: 'p', v: `${shortHex(PUBKEY, 6, 4)} · author`, color: colors.SECONDARY },
];

// address plate (recalled from ch2) — the a-tag target
const PLATE = { x: 660, y: 470, w: 470, h: 56 };

const CAM_PAGE: CameraState = { x: 330, y: 340, k: 1.2 };
const CAM_EVENT: CameraState = { x: 830, y: 300, k: 1.12 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pageU = tl.channel('pageU', 0);
  const selectU = tl.channel('selectU', 0);
  const liftU = tl.channel('liftU', 0);
  const evU = tl.channel('evU', 0);
  const aU = tl.channel('aU', 0);
  const plateU = tl.channel('plateU', 0);
  const socialU = tl.channel('socialU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the article, and a reader's selection.
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Back to the article from the start of the book. A reader finds one sentence worth keeping and drags across it. On nostr, even that gesture becomes an event.',
  });
  tl.tween(pageU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_PAGE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(selectU, 1, { at: 2.4, dur: 1.2, ease: ease.move });
  tl.hold(6.3, 0.7);

  // Beat 2 — the highlight event.
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'The selection lifts out into an event of kind nine thousand eight hundred and two. Its content is simply the highlighted text — the exact words, nothing more.',
  });
  tl.tween(cam, CAM_EVENT, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(liftU, 1, { at: 7.8, dur: 1.4, ease: ease.move });
  tl.tween(evU, 1, { at: 9.2, dur: 1.4, ease: ease.linear });
  tl.hold(13.0, 0.7);

  // Beat 3 — the a tag points at the address.
  tl.caption({
    at: 13.7,
    dur: 6.4,
    text: 'But a quote out of context is worthless, so it carries references. An a tag points back at the source — and notice what it points at: the article’s address, the coordinate from earlier, not a frozen hash.',
  });
  tl.tween(aU, 1, { at: 14.6, dur: 1.2, ease: ease.enter });
  tl.tween(plateU, 1, { at: 15.4, dur: 0.9, ease: ease.enter });
  tl.hold(20.1, 0.7);

  // Beat 4 — riding the living pointer + context + attribution.
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'So the highlight rides the living pointer. Edit the article and the quote still resolves to the current piece. A context tag keeps the surrounding sentence, and a p tag credits the author — the highlight can never lose where it came from.',
  });
  tl.tween(aU, 1, { at: 21.0, dur: 1.0, ease: ease.move });
  tl.hold(27.2, 0.7);

  // Beat 5 — the highlight is itself an event.
  tl.caption({
    at: 27.9,
    dur: 6.0,
    text: 'And because the highlight is itself an event, it enters the same web as everything else. Others can reply to it, react to it, even highlight the highlight. The trail of what readers pulled out becomes public data too.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 28.1, dur: 1.4, ease: ease.move });
  tl.tween(socialU, 1, { at: 29.0, dur: 2.0, ease: ease.linear });
  tl.hold(33.9, 0.7);

  // Beat 6 — close the book.
  tl.caption({
    at: 34.6,
    dur: 6.2,
    text: 'An article, its edits, its files, its inline media, and the sentences readers lift from it — every one of them the same small thing: a signed event, addressable, verifiable, and free to travel. That is long-form on nostr.',
  });
  tl.tween(dimU, 1, { at: 35.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.0, dur: 1.0, ease: ease.enter });
  tl.hold(41.0, 1.4);

  return { tl, cam, pageU, selectU, liftU, evU, aU, plateU, socialU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pageU = s.get(scene.pageU);
  const selectU = s.get(scene.selectU);
  const liftU = s.get(scene.liftU);
  const evU = s.get(scene.evU);
  const aU = s.get(scene.aU);
  const plateU = s.get(scene.plateU);
  const socialU = s.get(scene.socialU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const hlY = PAGE.y + 64 + HL_ROW * 30;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* article page */}
          {pageU > 0 && (
            <g opacity={pageU}>
              <rect x={PAGE.x} y={PAGE.y} width={PAGE.w} height={PAGE.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={PAGE.x + 20} y={PAGE.y + 36} fill={colors.TEXT} fontSize={18} fontWeight={700}>Why Relays Matter</text>
              {Array.from({ length: BODY_ROWS }, (_, i) => {
                if (i === HL_ROW) {
                  return (
                    <g key={i}>
                      <rect
                        x={PAGE.x + 20} y={PAGE.y + 52 + i * 30}
                        width={(PAGE.w - 40) * (1 - 0.06 * (i % 3))}
                        height={18} rx={4}
                        fill={colors.WARM}
                        opacity={0.14 + 0.5 * selectU}
                      />
                      <rect
                        x={PAGE.x + 20} y={PAGE.y + 52 + i * 30}
                        width={(PAGE.w - 40) * (1 - 0.06 * (i % 3))}
                        height={18} rx={4}
                        fill="none" stroke={colors.WARM} strokeWidth={1.4}
                        opacity={selectU}
                      />
                    </g>
                  );
                }
                const w = (PAGE.w - 40) * [0.96, 0.9, 0.82, 0.94, 0.7, 1, 0.88, 0.76, 0.92, 0.6, 0.84][i];
                return <rect key={i} x={PAGE.x + 20} y={PAGE.y + 58 + i * 30} width={w} height={9} rx={4} fill={colors.MUTED} opacity={0.28} />;
              })}
            </g>
          )}

          {/* the highlight lifting out */}
          {liftU > 0 && liftU < 1 && (
            <TokenFlight
              from={{ x: PAGE.x + 210, y: hlY + 9 }}
              to={{ x: EV.x + 220, y: EV.y + 60 }}
              u={liftU}
              text={`"${HIGHLIGHT_TEXT.slice(0, 28)}…"`}
              fill={colors.WARM}
              fontSize={12}
              lift={80}
            />
          )}

          {/* the 9802 event */}
          {evU > 0 && (
            <g opacity={evU}>
              <rect x={EV.x} y={EV.y} width={EV.w} height={EV_FIELDS.length * 34 + 20} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              {EV_FIELDS.map((f, i) => {
                const u = clamp01(evU * EV_FIELDS.length - i) * (f.k === 'a' ? clamp01(aU * 2) : 1);
                if (u <= 0) return null;
                return (
                  <g key={f.k} opacity={u}>
                    <text x={EV.x + 16} y={EV.y + 34 + i * 34} fill={f.color} fontSize={13} fontFamily="monospace" fontWeight={600}>{f.k}</text>
                    <text x={EV.x + 96} y={EV.y + 34 + i * 34} fill={colors.TEXT} fontSize={12} fontFamily="monospace">
                      {f.v.length > 44 ? `${f.v.slice(0, 43)}…` : f.v}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* address plate (a-tag target) + connecting arrow */}
          {plateU > 0 && (
            <g opacity={plateU}>
              <rect x={PLATE.x} y={PLATE.y} width={PLATE.w} height={PLATE.h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={PLATE.x + 16} y={PLATE.y + 24} fill={colors.ACCENT} fontSize={12} fontFamily="monospace">{COORD}</text>
              <text x={PLATE.x + 16} y={PLATE.y + 44} fill={colors.MUTED} fontSize={11}>the article's address — a living pointer</text>
              {aU > 0 && (
                <path
                  d={`M${EV.x + 40} ${EV.y + 34 + 2 * 34 + 6} L ${PLATE.x + 40} ${PLATE.y - 4}`}
                  fill="none" stroke={colors.ACCENT} strokeWidth={1.8} strokeDasharray="5 4" opacity={aU}
                />
              )}
            </g>
          )}

          {/* the highlight is itself an event — social orbit */}
          {socialU > 0 && (
            <g opacity={clamp01(socialU * 1.4)}>
              {['reply', 'react', 're-highlight'].map((lbl, i) => {
                const u = clamp01(socialU * 3 - i);
                if (u <= 0) return null;
                const ang = -0.5 + i * 0.6;
                const cx = EV.x + 230 + Math.cos(ang) * 250;
                const cy = EV.y + 90 + Math.sin(ang) * 150;
                return (
                  <g key={lbl} opacity={u}>
                    <line x1={EV.x + 230} y1={EV.y + 90} x2={cx} y2={cy} stroke={colors.GRID} strokeWidth={1} opacity={0.5} />
                    <circle cx={cx} cy={cy} r={7} fill={colors.SECONDARY} opacity={0.85} />
                    <text x={cx} y={cy - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12}>{lbl}</text>
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={230} width={880} height={200} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Everything is the same small thing
          </text>
          <text x={640} y={342} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            article · edits · files · inline media · highlights — all signed events
          </text>
          <text x={640} y={382} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-84 · kind 9802 · content = the quote, a = the source address
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
