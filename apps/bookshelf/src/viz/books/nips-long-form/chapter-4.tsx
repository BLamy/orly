// Inline and On-Screen — NIP-92 imeta + NIP-71 video, chapter 4.
//
// Grounded in NIP-92: an `imeta` tag is variadic space-delimited key/value
// pairs (`["imeta", "url …", "m …", "x …", "dim …", "alt …", "blurhash …"]`)
// that SHOULD match a URL in the content; a client uses it to replace the bare
// link with a rich, accessible preview (blurhash placeholder → image). And
// NIP-71: video events (kind 21 normal / 22 short) carry ONE imeta per variant
// (resolutions), so a player picks by bandwidth. imeta reuses NIP-94 fields.
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
import { TokenFlight } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// the note (left) — a bare url sits inside the content string
const NOTE = { x: 120, y: 150, w: 380, h: 150 };
const URL_TEXT = 'https://cdn.example/sunset.jpg';

// the imeta tag fields (right)
const IMETA = { x: 620, y: 150 };
const IMETA_FIELDS = [
  { k: 'url', v: 'https://cdn.example/sunset.jpg' },
  { k: 'm', v: 'image/jpeg' },
  { k: 'x', v: '3a1f…9e2c' },
  { k: 'dim', v: '3024x4032' },
  { k: 'alt', v: 'sun setting over water' },
  { k: 'blurhash', v: 'LKO2:N…' },
];

// preview card (center, replaces the url)
const CARD = { x: 120, y: 340, w: 380, h: 210 };

// video variants (later beat) — one imeta each
const VARIANTS = [
  { label: '1080p', m: 'video/mp4', dim: '1920x1080', y: 150 },
  { label: '720p', m: 'video/mp4', dim: '1280x720', y: 250 },
  { label: '360p', m: 'video/mp4', dim: '640x360', y: 350 },
];

const CAM_NOTE: CameraState = { x: 500, y: 240, k: 1.15 };
const CAM_CARD: CameraState = { x: 310, y: 400, k: 1.2 };
const CAM_VIDEO: CameraState = { x: 720, y: 300, k: 1.15 };

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const noteU = tl.channel('noteU', 0);
  const imetaU = tl.channel('imetaU', 0);
  const bindU = tl.channel('bindU', 0);
  const cardU = tl.channel('cardU', 0);
  const revealImgU = tl.channel('revealImgU', 0); // blurhash → image
  const videoU = tl.channel('videoU', 0);
  const pickU = tl.channel('pickU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — a bare link in a note.
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'A short note can point at an image just by dropping a link into its text. But a bare link is a dead end: no size, no description, nothing to show until it loads.',
  });
  tl.tween(noteU, 1, { at: 0.7, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_NOTE, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.7);

  // Beat 2 — the imeta tag describes it.
  tl.caption({
    at: 6.8,
    dur: 6.2,
    text: 'So the event adds a media tag that matches that link. It reuses the file-metadata fields: the media type, the dimensions, a hash, alt text for a screen reader, and a tiny blurred placeholder to show while the real thing arrives.',
  });
  tl.tween(imetaU, 1, { at: 7.6, dur: 2.4, ease: ease.linear });
  tl.tween(bindU, 1, { at: 9.4, dur: 1.4, ease: ease.move });
  tl.hold(13.0, 0.7);

  // Beat 3 — swap the link for a preview.
  tl.caption({
    at: 13.7,
    dur: 6.0,
    text: 'Now the client can do something better than show a link. It swaps the raw text for a real preview — the blurred placeholder first, then the image — and the alt text rides along for anyone who cannot see it.',
  });
  tl.tween(cam, CAM_CARD, { at: 13.9, dur: 1.4, ease: ease.move });
  tl.tween(cardU, 1, { at: 14.8, dur: 1.0, ease: ease.enter });
  tl.tween(revealImgU, 1, { at: 16.2, dur: 1.6, ease: ease.draw });
  tl.hold(19.7, 0.7);

  // Beat 4 — video: one tag per variant.
  tl.caption({
    at: 20.4,
    dur: 6.2,
    text: 'The same idea scales up to video. A video event carries not one media tag but several — one for each resolution the same clip is available in: full size, medium, and small.',
  });
  tl.tween(cam, CAM_VIDEO, { at: 20.6, dur: 1.4, ease: ease.move });
  tl.tween(videoU, 1, { at: 21.6, dur: 2.0, ease: ease.linear });
  tl.hold(26.6, 0.7);

  // Beat 5 — the player picks.
  tl.caption({
    at: 27.3,
    dur: 6.0,
    text: 'The player reads them like a menu and picks the one that fits the connection. When the network dips it can drop to a smaller variant without cutting the audio — because every variant describes the very same clip.',
  });
  tl.tween(pickU, 1, { at: 28.0, dur: 1.8, ease: ease.move });
  tl.hold(33.3, 0.7);

  // Beat 6 — close.
  tl.caption({
    at: 34.0,
    dur: 5.6,
    text: 'One tagging convention carries a photo inline and a video at any size. Last stop: what happens when a reader wants to lift one sentence out of an article and hand it to someone else.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 34.2, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 34.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 35.4, dur: 1.0, ease: ease.enter });
  tl.hold(39.6, 1.2);

  return { tl, cam, noteU, imetaU, bindU, cardU, revealImgU, videoU, pickU, dimU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const noteU = s.get(scene.noteU);
  const imetaU = s.get(scene.imetaU);
  const bindU = s.get(scene.bindU);
  const cardU = s.get(scene.cardU);
  const revealImgU = s.get(scene.revealImgU);
  const videoU = s.get(scene.videoU);
  const pickU = s.get(scene.pickU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const urlOp = noteU * (1 - 0.9 * clamp01(cardU)); // url fades as the card takes over

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the note with a bare url */}
          {noteU > 0 && videoU < 0.5 && (
            <g opacity={noteU}>
              <rect x={NOTE.x} y={NOTE.y} width={NOTE.w} height={NOTE.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={NOTE.x + 16} y={NOTE.y + 30} fill={colors.MUTED} fontSize={12} fontFamily="monospace">content</text>
              <text x={NOTE.x + 16} y={NOTE.y + 58} fill={colors.TEXT} fontSize={13}>look at this sunset</text>
              <text x={NOTE.x + 16} y={NOTE.y + 84} fill={colors.ACCENT} fontSize={12} fontFamily="monospace" opacity={urlOp}>
                {URL_TEXT}
              </text>
              {bindU > 0 && (
                <line
                  x1={NOTE.x + 16} y1={NOTE.y + 90}
                  x2={NOTE.x + 16 + 210 * clamp01(bindU)} y2={NOTE.y + 90}
                  stroke={colors.SECONDARY} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7 * (1 - clamp01(cardU))}
                />
              )}
            </g>
          )}

          {/* the imeta tag */}
          {imetaU > 0 && videoU < 0.5 && (
            <g opacity={imetaU * (1 - 0.75 * clamp01(cardU))}>
              <text x={IMETA.x} y={IMETA.y - 12} fill={colors.SECONDARY} fontSize={12} fontFamily="monospace">imeta — matches the link</text>
              <rect x={IMETA.x} y={IMETA.y} width={340} height={IMETA_FIELDS.length * 26 + 20} rx={10} fill={colors.PANEL} stroke={colors.SECONDARY} />
              {IMETA_FIELDS.map((f, i) => {
                const u = clamp01(imetaU * IMETA_FIELDS.length - i);
                if (u <= 0) return null;
                return (
                  <g key={f.k} opacity={u}>
                    <text x={IMETA.x + 16} y={IMETA.y + 30 + i * 26} fill={colors.WARM} fontSize={12} fontFamily="monospace">{f.k}</text>
                    <text x={IMETA.x + 96} y={IMETA.y + 30 + i * 26} fill={colors.TEXT} fontSize={12} fontFamily="monospace">{f.v}</text>
                  </g>
                );
              })}
            </g>
          )}
          {bindU > 0 && bindU < 1 && videoU < 0.5 && (
            <TokenFlight
              from={{ x: NOTE.x + 120, y: NOTE.y + 84 }}
              to={{ x: IMETA.x + 40, y: IMETA.y + 30 }}
              u={bindU}
              text="url ↦"
              fill={colors.ACCENT}
              fontSize={12}
              lift={40}
            />
          )}

          {/* preview card (blurhash → image) */}
          {cardU > 0 && videoU < 0.5 && (
            <g opacity={cardU}>
              <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} />
              {/* blurhash placeholder fades to "image" */}
              <rect x={CARD.x + 12} y={CARD.y + 12} width={CARD.w - 24} height={CARD.h - 52} rx={8} fill={colors.SECONDARY} opacity={0.3 * (1 - revealImgU)} />
              <rect x={CARD.x + 12} y={CARD.y + 12} width={CARD.w - 24} height={CARD.h - 52} rx={8} fill={colors.WARM} opacity={0.55 * revealImgU} />
              {revealImgU > 0.4 && (
                <g opacity={clamp01(revealImgU * 2 - 0.8)}>
                  <circle cx={CARD.x + CARD.w - 70} cy={CARD.y + 54} r={22} fill={colors.POSITIVE} opacity={0.85} />
                  <path d={`M${CARD.x + 20} ${CARD.y + CARD.h - 62} L ${CARD.x + 120} ${CARD.y + CARD.h - 120} L ${CARD.x + 200} ${CARD.y + CARD.h - 62} Z`} fill={colors.ACCENT} opacity={0.7} />
                </g>
              )}
              <text x={CARD.x + 16} y={CARD.y + CARD.h - 18} fill={colors.MUTED} fontSize={12}>
                alt: sun setting over water
              </text>
            </g>
          )}

          {/* video variants */}
          {videoU > 0.05 && (
            <g opacity={clamp01(videoU * 1.4)}>
              <text x={640} y={128} fill={colors.MUTED} fontSize={12} fontFamily="monospace">video event · kind 21 — one imeta per variant</text>
              {VARIANTS.map((v, i) => {
                const u = clamp01(videoU * VARIANTS.length - i);
                if (u <= 0) return null;
                const chosen = pickU > 0 && i === 1; // player picks 720p
                return (
                  <g key={v.label} opacity={u}>
                    <rect x={620} y={v.y} width={360} height={70} rx={10} fill={colors.PANEL} stroke={chosen ? colors.POSITIVE : colors.GRID} strokeWidth={chosen ? 2 : 1.4} />
                    <text x={640} y={v.y + 30} fill={chosen ? colors.POSITIVE : colors.TEXT} fontSize={15} fontWeight={600}>{v.label}</text>
                    <text x={640} y={v.y + 52} fill={colors.MUTED} fontSize={12} fontFamily="monospace">{v.m} · {v.dim}</text>
                    {chosen && pickU >= 1 && (
                      <text x={960} y={v.y + 40} textAnchor="end" fill={colors.POSITIVE} fontSize={12}>← chosen for this connection</text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </Camera>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={220} y={240} width={840} height={180} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            One tag turns a link into a preview
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            imeta matches a URL and describes it · video lists one per resolution
          </text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            NIP-92 imeta · NIP-71 video (kind 21/22)
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
