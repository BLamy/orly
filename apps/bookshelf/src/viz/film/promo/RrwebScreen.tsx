/**
 * RrwebScreen: a cleaned rrweb recording (tools/promo/rr-clean.mjs) played as live DOM inside a film frame.
 *
 *   dom(s, scene) {
 *     return <RrwebScreen slug="replay-qa-promo" take="overview" at={s.get(scene.tape)}
 *                         box={{ x: 140, y: 90, w: 1000 }} chrome="browser" url="qa.replay.io/projects"
 *                         tilt={{ x: 8, y: -14 }} zoom={{ x: 300, y: 200, scale: 1.8 }} cursor />;
 *   }
 *
 * Frame-exact: `at` (ms of the take) is applied with Replayer.pause(at) in a layout effect, which casts every
 * event before `at` synchronously (forward seeks only cast the new events). Loading (the JSON, the replay
 * iframe's fonts and images) registers with core/pending so the render harness waits before capturing.
 * The replay iframe is sandboxed by rrweb (no scripts), animations are paused (rrweb-paused), and rrweb's own
 * mouse is hidden: the cursor here is drawn from the take's smoothed track, with click pulses.
 *
 * Geometry is in stage px (the dom layer is a 1280×720 box). box.w is the on-stage width of the page (the
 * recording's viewport scaled to fit); chrome adds a browser bar above it. tilt rotates in 3-D about the
 * screen centre (perspective 1800 stage px); zoom magnifies a point of the recording (recording px).
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Replayer } from 'rrweb';
import { trackPending } from '../core/pending';

export interface RrTake {
  take: string;
  viewport: { width: number; height: number };
  duration: number;
  marks: Record<string, number>;
  css: string[];
  cursor: { samples: [number, number, number][]; clicks: [number, number, number][] };
  // rrweb eventWithTime[]
  events: unknown[];
}

const BASE = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const takes = new Map<string, Promise<RrTake>>();
const loaded = new Map<string, RrTake>();

export const rrSrc = (slug: string, take: string) => `${BASE.replace(/\/?$/, '/')}generated/${slug}/rr/${take}.json`;

/** fetch (once) a cleaned take; also usable from build() via the synchronous cache after preload */
export function loadTake(slug: string, take: string): Promise<RrTake> {
  const src = rrSrc(slug, take);
  let p = takes.get(src);
  if (!p) {
    p = fetch(src)
      .then((r) => {
        if (!r.ok) throw new Error(`rrweb take ${take}: HTTP ${r.status}`);
        return r.json() as Promise<RrTake>;
      })
      .then((d) => (loaded.set(src, d), d));
    takes.set(src, trackPending(p));
  }
  return p;
}
export const takeIfLoaded = (slug: string, take: string) => loaded.get(rrSrc(slug, take));

/** a named moment of a take (ms), from its marks; throws on a typo so shots fail loudly in QA */
export function mark(t: RrTake | undefined, name: string, fallback = 0): number {
  if (!t) return fallback;
  const v = t.marks[name];
  if (v == null) throw new Error(`take ${t.take} has no mark "${name}" (have ${Object.keys(t.marks).join(', ')})`);
  return v;
}

function cursorAt(t: RrTake, ms: number): { x: number; y: number } | null {
  const s = t.cursor.samples;
  if (!s.length) return null;
  // samples are 60 Hz from 0
  const f = Math.max(0, Math.min(s.length - 1, (ms / 1000) * 60));
  const i = Math.floor(f), u = f - i;
  const a = s[i], b = s[Math.min(i + 1, s.length - 1)];
  return { x: a[1] + (b[1] - a[1]) * u, y: a[2] + (b[2] - a[2]) * u };
}

async function waitIframeAssets(iframe: HTMLIFrameElement | null) {
  const doc = iframe?.contentDocument;
  if (!doc) return;
  const imgs = [...doc.images].filter((i) => !i.complete);
  await Promise.all([
    doc.fonts?.ready,
    ...imgs.map((i) => new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })),
  ]);
}

export interface RrwebScreenProps {
  slug: string;
  take: string;
  /** ms into the cleaned take */
  at: number;
  /** stage px: top-left of the page area and its on-stage width */
  box: { x: number; y: number; w: number };
  chrome?: 'browser' | 'none';
  url?: string;
  /** 3-D tilt in degrees (x: lean back, y: turn, z: roll) */
  tilt?: { x?: number; y?: number; z?: number };
  /** magnify around a recording-px point */
  zoom?: { x: number; y: number; scale: number };
  cursor?: boolean;
  /** 0..1 */
  opacity?: number;
  radius?: number;
  shadow?: boolean;
  /** crop the recording to a region (recording px) before fitting it to box.w */
  crop?: { x: number; y: number; w: number; h: number };
  style?: CSSProperties;
}

const BAR = 30; // browser bar height, stage px

export function RrwebScreen(p: RrwebScreenProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const rep = useRef<Replayer | null>(null);
  const [take, setTake] = useState<RrTake | undefined>(() => takeIfLoaded(p.slug, p.take));

  useEffect(() => {
    let dead = false;
    if (!take) loadTake(p.slug, p.take).then((t) => !dead && setTake(t));
    return () => {
      dead = true;
    };
  }, [p.slug, p.take, take]);

  // build the replayer once per take
  useLayoutEffect(() => {
    if (!take || !host.current) return;
    const r = new Replayer(take.events as never, {
      root: host.current,
      mouseTail: false,
      skipInactive: false,
      triggerFocus: false,
      showWarning: false,
      pauseAnimation: true,
      // rrweb 2.0.0-alpha.20's virtual-DOM fast-forward drops large folded mutations (e.g. a list of 2,000 nodes added
      // before the take's start): cast against the real DOM instead
      useVirtualDom: false,
      insertStyleRules: take.css,
      UNSAFE_replayCanvas: false,
      speed: 1,
    } as never);
    rep.current = r;
    const iframe = host.current.querySelector('iframe');
    if (iframe) Object.assign(iframe.style, { border: '0', display: 'block', background: '#fff' });
    return () => {
      r.destroy();
      rep.current = null;
    };
  }, [take]);

  // seek every frame (synchronous cast up to `at`), then let the harness wait for late assets
  useLayoutEffect(() => {
    const r = rep.current;
    if (!r || !take) return;
    // offset ≥ 1 ms: events folded onto t = 0 (the state before the take's start) are cast synchronously only when
    // they lie strictly before the seek point
    r.pause(Math.max(1, Math.min(p.at, take.duration)));
    const iframe = host.current?.querySelector('iframe') ?? null;
    const doc = iframe?.contentDocument;
    if (doc && ([...doc.images].some((i) => !i.complete) || doc.fonts?.status === 'loading')) trackPending(waitIframeAssets(iframe));
  }, [p.at, take]);

  const vw = take?.viewport.width ?? 1440;
  const vh = take?.viewport.height ?? 900;
  const crop = p.crop ?? { x: 0, y: 0, w: vw, h: vh };
  const k = p.box.w / crop.w; // recording px → stage px
  const pageH = crop.h * k;
  const bar = p.chrome === 'browser' ? BAR : 0;
  const radius = p.radius ?? 12;
  const z = p.zoom ?? { x: crop.x + crop.w / 2, y: crop.y + crop.h / 2, scale: 1 };
  const tilt = p.tilt ?? {};
  const cur = take && p.cursor ? cursorAt(take, p.at) : null;
  const click = take && p.cursor ? [...take.cursor.clicks].reverse().find((c) => c[0] <= p.at && p.at - c[0] < 520) : undefined;
  const cu = click ? (p.at - click[0]) / 520 : 0;

  // inner transform: zoom about z (recording px), then crop offset, then scale to stage
  const inner = `scale(${k}) translate(${-crop.x}px, ${-crop.y}px) translate(${z.x}px, ${z.y}px) scale(${z.scale}) translate(${-z.x}px, ${-z.y}px)`;

  return (
    <div
      style={{
        position: 'absolute',
        left: p.box.x,
        top: p.box.y - bar,
        width: p.box.w,
        height: pageH + bar,
        opacity: p.opacity ?? 1,
        transformStyle: 'preserve-3d',
        transform: `perspective(1800px) rotateX(${tilt.x ?? 0}deg) rotateY(${tilt.y ?? 0}deg) rotateZ(${tilt.z ?? 0}deg)`,
        transformOrigin: '50% 50%',
        borderRadius: radius,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: p.shadow === false ? 'none' : '0 30px 80px -20px rgba(40,10,60,.45), 0 10px 30px -10px rgba(40,10,60,.30), 0 0 0 1px rgba(255,255,255,.35)',
        ...p.style,
      }}
    >
      {bar > 0 && (
        <div style={{ height: bar, display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', background: '#f3f1f5', borderBottom: '1px solid #e4e0e8', boxSizing: 'border-box' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: 5, background: c, display: 'inline-block' }} />
          ))}
          <span style={{ marginLeft: 14, flex: 1, maxWidth: '60%', height: 22, borderRadius: 11, background: '#fff', border: '1px solid #e4e0e8', font: '500 14px "Promo Sans", system-ui', color: '#6b6475', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {p.url ?? ''}
          </span>
        </div>
      )}
      <div style={{ position: 'relative', width: p.box.w, height: pageH, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: vw, height: vh, transformOrigin: '0 0', transform: inner }}>
          <div ref={host} style={{ width: vw, height: vh, position: 'relative', pointerEvents: 'none' }} />
          {cur && (
            <svg width={vw} height={vh} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
              {click && (
                <circle cx={click[1]} cy={click[2]} r={10 + 26 * Math.sin((cu * Math.PI) / 2)} fill="rgba(244,28,82,.18)" stroke="rgba(244,28,82,.75)" strokeWidth={2.5 * (1 - cu)} opacity={1 - cu} />
              )}
              <g transform={`translate(${cur.x} ${cur.y}) scale(${click && cu < 0.25 ? 0.88 : 1})`}>
                <path d="M0 0 L0 22 L6 16.5 L10.5 26 L14 24.4 L9.6 15.2 L17.5 15.2 Z" fill="#111" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
              </g>
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default RrwebScreen;
