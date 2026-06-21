import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';
import { story, COLORS } from './story';

// ---- timing ----------------------------------------------------------------
// Per-step durations in frames (cover shorter, recap longer) — the same idea as
// the D3 engine's per-slide `estDuration`, just expressed in frames.
const durOf = (id: string, cover?: boolean) =>
  cover ? 80 : id === 'recap' ? 150 : 110;
const DUR = story.steps.map((s) => durOf(s.id, s.cover));
const STARTS = DUR.map((_, i) => DUR.slice(0, i).reduce((a, b) => a + b, 0));
export const TOTAL_FRAMES = DUR.reduce((a, b) => a + b, 0);

// ---- layout ----------------------------------------------------------------
const CW = 1920;
const CH = 1080;
const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const byId = Object.fromEntries(story.nodes.map((n) => [n.id, n]));
const pos = (id: string) => ({
  x: (byId[id].x / 100) * CW,
  y: (byId[id].y / 100) * CH,
});

// First step that reveals each node.
const revealStepOf: Record<string, number> = {};
story.steps.forEach((s, i) => {
  (s.reveal ?? []).forEach((id) => {
    if (revealStepOf[id] === undefined) revealStepOf[id] = i;
  });
});

const revealedAt = (stepIndex: number) =>
  story.nodes.filter(
    (n) => revealStepOf[n.id] !== undefined && revealStepOf[n.id] <= stepIndex
  );

// ---- camera: fit the revealed nodes into frame (the engine's signature move) -
function cameraFor(stepIndex: number) {
  const ns = revealedAt(stepIndex);
  if (ns.length < 2) return { s: 1, tx: 0, ty: 0 };
  const xs = ns.map((n) => pos(n.id).x);
  const ys = ns.map((n) => pos(n.id).y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 300;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const s = Math.min(CW / w, CH / h, 1.45);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return { s, tx: CW / 2 - s * cx, ty: CH / 2 - s * cy };
}
const CAMS = story.steps.map((_, i) => cameraFor(i));

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const DataFlow = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Current step index.
  let step = 0;
  for (let i = 0; i < STARTS.length; i++) if (frame >= STARTS[i]) step = i;
  const local = frame - STARTS[step];
  const cur = story.steps[step];

  // Camera, eased over the first 30 frames of each step.
  const prevCam = CAMS[Math.max(0, step - 1)];
  const tgtCam = CAMS[step];
  const ct = easeInOut(interpolate(local, [0, 30], [0, 1], clamp));
  const cam = {
    s: lerp(prevCam.s, tgtCam.s, ct),
    tx: lerp(prevCam.tx, tgtCam.tx, ct),
    ty: lerp(prevCam.ty, tgtCam.ty, ct),
  };

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0e1a', fontFamily: FONT }}>
      {/* grid backdrop */}
      <AbsoluteFill
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      {/* world layer with the camera transform */}
      <AbsoluteFill
        style={{
          transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.s})`,
          transformOrigin: '0 0',
        }}
      >
        {/* edges */}
        <svg
          width={CW}
          height={CH}
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {story.edges.map((e) => {
            const rs = Math.max(
              revealStepOf[e.from] ?? 99,
              revealStepOf[e.to] ?? 99
            );
            if (rs > step) return null;
            const a = pos(e.from);
            const b = pos(e.to);
            const t = interpolate(
              frame,
              [STARTS[rs], STARTS[rs] + 20],
              [0, 1],
              clamp
            );
            return (
              <line
                key={e.id}
                x1={a.x}
                y1={a.y}
                x2={lerp(a.x, b.x, t)}
                y2={lerp(a.y, b.y, t)}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={3}
              />
            );
          })}
        </svg>

        {/* packets for the current step */}
        {(cur.messages ?? []).map((m, i) => {
          const a = pos(m.from);
          const b = pos(m.to);
          const start = 14 + i * 12;
          const end = DUR[step] - 16;
          if (local < start) return null;
          const p = interpolate(local, [start, end], [0, 1], clamp);
          const fade = interpolate(
            local,
            [start, start + 8, end - 8, end],
            [0, 1, 1, 0],
            clamp
          );
          const x = lerp(a.x, b.x, p);
          const y = lerp(a.y, b.y, p);
          return (
            <div key={i}>
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: '#fff',
                  boxShadow: '0 0 26px 7px rgba(255,255,255,0.6)',
                  transform: 'translate(-50%,-50%)',
                  opacity: fade,
                }}
              />
              {m.label && (
                <div
                  style={{
                    position: 'absolute',
                    left: x,
                    top: y - 34,
                    transform: 'translate(-50%,-50%)',
                    color: '#cfe9ff',
                    fontSize: 24,
                    fontWeight: 600,
                    opacity: fade,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.label}
                </div>
              )}
            </div>
          );
        })}

        {/* nodes */}
        {story.nodes.map((n) => {
          const rstep = revealStepOf[n.id];
          if (rstep === undefined || rstep > step) return null;
          const rf = STARTS[rstep];
          const appear = spring({
            frame: frame - rf,
            fps,
            config: { damping: 200 },
          });
          const op = interpolate(frame, [rf, rf + 12], [0, 1], clamp);
          const sc = 0.7 + 0.3 * appear;
          const p = pos(n.id);
          const color = COLORS[n.kind];
          const active =
            (cur.reveal ?? []).includes(n.id) ||
            (cur.messages ?? []).some((m) => m.from === n.id || m.to === n.id);
          return (
            <div
              key={n.id}
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y,
                transform: `translate(-50%,-50%) scale(${sc})`,
                opacity: op,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 136,
                  height: 136,
                  borderRadius: 30,
                  background: '#121829',
                  border: `4px solid ${color}`,
                  boxShadow: active
                    ? `0 0 48px 4px ${color}88`
                    : '0 10px 30px rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 15,
                    background: color,
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 16,
                  color: '#fff',
                  fontSize: 31,
                  fontWeight: 700,
                }}
              >
                {n.label}
              </div>
              {n.sub && (
                <div style={{ color: '#8aa3b8', fontSize: 22, marginTop: 4 }}>
                  {n.sub}
                </div>
              )}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* cover title */}
      {cur.cover && (
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: 120,
          }}
        >
          <div
            style={{
              color: '#6cf',
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              opacity: interpolate(local, [0, 20], [0, 1], clamp),
            }}
          >
            The Secret Lives of Data
          </div>
          <div
            style={{
              color: '#fff',
              fontSize: 94,
              fontWeight: 800,
              marginTop: 24,
              opacity: interpolate(local, [6, 28], [0, 1], clamp),
            }}
          >
            {story.title}
          </div>
          <div
            style={{
              color: '#9ab2c8',
              fontSize: 35,
              marginTop: 22,
              maxWidth: 1100,
              opacity: interpolate(local, [14, 36], [0, 1], clamp),
            }}
          >
            {story.subtitle}
          </div>
        </AbsoluteFill>
      )}

      {/* chapter title + caption */}
      {!cur.cover && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 64,
              left: 80,
              color: '#fff',
              fontSize: 31,
              fontWeight: 700,
              opacity: 0.92,
            }}
          >
            <span style={{ color: '#6cf' }}>
              {String(step).padStart(2, '0')}
            </span>
            &nbsp;&nbsp;{cur.title}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '52px 80px 58px',
              background:
                'linear-gradient(to top, rgba(5,8,16,0.97), rgba(5,8,16,0))',
            }}
          >
            <div
              style={{
                color: '#eaf2ff',
                fontSize: 39,
                lineHeight: 1.42,
                maxWidth: 1520,
                opacity: interpolate(local, [4, 24], [0, 1], clamp),
              }}
            >
              {cur.caption}
            </div>
          </div>
        </>
      )}

      {/* progress dots */}
      <div
        style={{
          position: 'absolute',
          top: 72,
          right: 80,
          display: 'flex',
          gap: 12,
        }}
      >
        {story.steps.map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: i === step ? '#6cf' : 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};
