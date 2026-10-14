// Films on the shelf are VHS tapes, not O'RLY books: a black plastic clamshell
// holding a sleeve in the style of early-'90s educational videotapes — loud
// gradient or space backgrounds, a starburst, a chunky black-outlined title,
// a subject banner, clip-art illustrations, the VHS mark, a publisher strip
// and honest shelf wear. Everything is drawn here, in the browser, so every
// letter is crisp and correct (the parody label only: never the real
// publisher). Deterministic: the slug seeds every random choice.
import type { BookMeta } from './cover';

export type VhsThemeId = 'cosmos' | 'grid' | 'jungle' | 'lab' | 'ocean' | 'sunset';
export type VhsIcon =
  | 'neuron' | 'brain' | 'chip' | 'atom' | 'globe' | 'rocket' | 'lightbulb'
  | 'crt' | 'robot' | 'dna' | 'planet' | 'flask' | 'gear' | 'book' | 'magnifier';

/** Sleeve details a film's library entry may carry (all optional; the slug decides the rest). */
export interface VhsSpec {
  /** the subject banner, e.g. "COMPUTER SCIENCE" */
  subject?: string;
  theme?: VhsThemeId;
  /** clip-art for the illustration, most important first (the first is the hero) */
  icons?: VhsIcon[];
  /** short line under the illustration */
  tagline?: string;
  /** label on the publisher strip (parody only) */
  label?: string;
  vol?: number;
  /** optional illustration image (transparent or white background), drawn instead of clip-art */
  art?: string;
}

export const VHS_LABEL = "O'RLY? EDUCATIONAL VIDEO";
/** A standing clamshell's front: 1 : 1.72 (a real case is about 13.2 × 22.7 cm). */
export const VHS_ASPECT = 13.2 / 22.7;
/** Spine depth relative to the case height (a case is about 3.0 cm deep). */
export const VHS_SPINE_RATIO = 3.0 / 22.7;

const TITLE = "Anton, 'Archivo Black', Impact, 'Arial Narrow Bold', sans-serif";
const BANNER = "'Archivo Black', 'Arial Black', Arial, sans-serif";
const ROUND = "'Bowlby One', 'Archivo Black', 'Arial Black', sans-serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

// ---------------------------------------------------------------------------
// fonts
// ---------------------------------------------------------------------------
let fontsReady: Promise<void> | null = null;
/** Inject the self-hosted VHS faces (public/fonts/vhs) and wait until they can paint. */
export function loadVhsFonts(base = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'): Promise<void> {
  if (fontsReady) return fontsReady;
  fontsReady = (async () => {
    if (typeof document === 'undefined') return;
    if (![...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => (l as HTMLLinkElement).href.includes('fonts/vhs/vhs.css'))) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${base.replace(/\/?$/, '/')}fonts/vhs/vhs.css`;
      await new Promise<void>((res) => {
        link.onload = () => res();
        link.onerror = () => res();
        document.head.appendChild(link);
      });
    }
    await Promise.all(['64px Anton', '32px "Archivo Black"', '32px "Bowlby One"'].map((f) => document.fonts.load(f).catch(() => [])));
  })();
  return fontsReady;
}

// ---------------------------------------------------------------------------
// seeded randomness
// ---------------------------------------------------------------------------
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// themes
// ---------------------------------------------------------------------------
interface Theme {
  /** paint the sleeve background into (0,0,w,h) */
  bg(c: CanvasRenderingContext2D, w: number, h: number, r: () => number): void;
  title: string; // title fill
  titleShade: string; // the offset "3-D" shadow behind the outline
  burst: [string, string]; // starburst fill, rim
  banner: string; // banner fill
  bannerInk: string;
  strip: string; // publisher strip
  stripInk: string;
  spine: [string, string];
}

const lin = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
};

function starField(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, s = r() < 0.08 ? 1.6 + r() * 1.6 : 0.4 + r() * 0.9;
    c.fillStyle = `rgba(255,255,255,${0.35 + r() * 0.65})`;
    c.beginPath();
    c.arc(x, y, s, 0, Math.PI * 2);
    c.fill();
    if (s > 1.7) sparkle(c, x, y, s * 3.2, 'rgba(255,255,255,0.85)');
  }
}

function sparkle(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 ? s * 0.18 : s;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

const THEMES: Record<VhsThemeId, Theme> = {
  cosmos: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#1a0b3d'], [0.45, '#3b1172'], [0.8, '#1d0d46'], [1, '#07041a']]);
      c.fillRect(0, 0, w, h);
      // spiral galaxy
      const gx = w * (0.25 + r() * 0.5), gy = h * 0.62, R = w * 0.55;
      const g = c.createRadialGradient(gx, gy, 0, gx, gy, R);
      g.addColorStop(0, 'rgba(255,240,200,0.9)');
      g.addColorStop(0.08, 'rgba(255,170,90,0.55)');
      g.addColorStop(0.35, 'rgba(170,70,200,0.28)');
      g.addColorStop(1, 'rgba(60,20,120,0)');
      c.fillStyle = g;
      c.save();
      c.translate(gx, gy);
      c.rotate(-0.4);
      c.scale(1, 0.45);
      c.beginPath();
      c.arc(0, 0, R, 0, Math.PI * 2);
      c.fill();
      c.restore();
      starField(c, w, h, r, Math.round((w * h) / 900));
    },
    title: '#ffe14a', titleShade: '#d4182c', burst: ['#ff9a1f', '#ffe14a'],
    banner: '#ff6a1a', bannerInk: '#fff8e8', strip: '#0b0620', stripInk: '#ffe14a', spine: ['#1a0b3d', '#4a168a'],
  },
  grid: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#09021f'], [0.5, '#2a0a52'], [0.62, '#ff3e9b'], [0.64, '#1a0636'], [1, '#05010f']]);
      c.fillRect(0, 0, w, h);
      // striped sun
      const sx = w / 2, sy = h * 0.62, sr = w * 0.3;
      c.save();
      c.beginPath();
      c.arc(sx, sy, sr, Math.PI, 0);
      c.clip();
      c.fillStyle = lin(c, 0, sy - sr, 0, sy, [[0, '#ffe35a'], [1, '#ff2f7a']]);
      c.fillRect(sx - sr, sy - sr, sr * 2, sr);
      c.fillStyle = '#2a0a52';
      for (let i = 0; i < 6; i++) c.fillRect(sx - sr, sy - sr * (0.42 - i * 0.075), sr * 2, sr * 0.018 * (i + 1));
      c.restore();
      // neon floor grid
      const hz = h * 0.64;
      c.strokeStyle = 'rgba(64,224,255,0.75)';
      c.lineWidth = Math.max(1, w / 320);
      for (let i = -12; i <= 12; i++) {
        c.beginPath();
        c.moveTo(w / 2 + i * w * 0.02, hz);
        c.lineTo(w / 2 + i * w * 0.24, h);
        c.stroke();
      }
      for (let k = 1; k < 12; k++) {
        const y = hz + (h - hz) * Math.pow(k / 11, 2.1);
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
      starField(c, w, hz * 0.95, r, Math.round((w * h) / 2600));
    },
    title: '#5ff2ff', titleShade: '#ff2f9b', burst: ['#ff2f9b', '#ffe35a'],
    banner: '#ffe35a', bannerInk: '#1a0636', strip: '#05010f', stripInk: '#5ff2ff', spine: ['#09021f', '#3a0f6a'],
  },
  jungle: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, w, h, [[0, '#bfe86a'], [0.5, '#5fbf3a'], [1, '#1f7a2e']]);
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 9; i++) leaf(c, r() * w, r() * h, w * (0.28 + r() * 0.3), r() * Math.PI * 2, i % 2 ? '#2e8f34' : '#7ccf45');
    },
    title: '#ffe14a', titleShade: '#1f4fb3', burst: ['#fff36a', '#ffffff'],
    banner: '#1f62c9', bannerInk: '#ffffff', strip: '#16521f', stripInk: '#fff36a', spine: ['#3f9e33', '#1f7a2e'],
  },
  lab: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, w, h, [[0, '#fff04a'], [0.45, '#ffb53a'], [1, '#d23ad6']]);
      c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(80,20,90,0.25)';
      c.lineWidth = Math.max(1, w / 260);
      for (let i = 0; i < 7; i++) hexRing(c, r() * w, r() * h, w * (0.05 + r() * 0.06));
    },
    title: '#e8202e', titleShade: '#ffe14a', burst: ['#ffffff', '#ffe14a'],
    banner: '#ffe14a', bannerInk: '#1a1022', strip: '#6a1477', stripInk: '#fff04a', spine: ['#ffd84a', '#d23ad6'],
  },
  ocean: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#8ff0ff'], [0.4, '#22a6e0'], [1, '#0b3f8f']]);
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const x = r() * w, y = r() * h, s = w * (0.008 + r() * 0.03);
        c.strokeStyle = 'rgba(255,255,255,0.55)';
        c.lineWidth = Math.max(1, s * 0.18);
        c.beginPath();
        c.arc(x, y, s, 0, Math.PI * 2);
        c.stroke();
      }
    },
    title: '#ffe14a', titleShade: '#e8202e', burst: ['#ffffff', '#8ff0ff'],
    banner: '#e8202e', bannerInk: '#ffffff', strip: '#0b2f6f', stripInk: '#ffe14a', spine: ['#22a6e0', '#0b3f8f'],
  },
  sunset: {
    bg(c, w, h, r) {
      c.fillStyle = lin(c, 0, 0, 0, h, [[0, '#ffdf4a'], [0.5, '#ff7a1f'], [1, '#c8122f']]);
      c.fillRect(0, 0, w, h);
      // sun rays
      const cx = w / 2, cy = h * 0.7;
      c.fillStyle = 'rgba(255,255,255,0.18)';
      const n = 18 + Math.floor(r() * 6);
      for (let i = 0; i < n; i += 2) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(cx + Math.cos(a0) * h * 2, cy + Math.sin(a0) * h * 2);
        c.lineTo(cx + Math.cos(a1) * h * 2, cy + Math.sin(a1) * h * 2);
        c.closePath();
        c.fill();
      }
    },
    title: '#ffffff', titleShade: '#7a1fa8', burst: ['#7a1fa8', '#ffdf4a'],
    banner: '#7a1fa8', bannerInk: '#ffffff', strip: '#5a0a1f', stripInk: '#ffdf4a', spine: ['#ff7a1f', '#c8122f'],
  },
};
export const VHS_THEMES = Object.keys(THEMES) as VhsThemeId[];

function leaf(c: CanvasRenderingContext2D, x: number, y: number, s: number, a: number, col: string) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, 0);
  c.bezierCurveTo(s * 0.35, -s * 0.32, s * 0.8, -s * 0.2, s, 0);
  c.bezierCurveTo(s * 0.8, s * 0.2, s * 0.35, s * 0.32, 0, 0);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = s * 0.015;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(s * 0.95, 0);
  c.stroke();
  c.restore();
}

function hexRing(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath();
  for (let i = 0; i < 6; i++) c.lineTo(x + Math.cos((i * Math.PI) / 3) * s, y + Math.sin((i * Math.PI) / 3) * s);
  c.closePath();
  c.stroke();
}

// ---------------------------------------------------------------------------
// clip-art (bold black outline, flat colour, one white highlight — 1993 CD-ROM style)
// ---------------------------------------------------------------------------
type IconFn = (c: CanvasRenderingContext2D, s: number, r: () => number) => void;
const INK = '#14101c';

function outlined(c: CanvasRenderingContext2D, s: number, fill: string, path: () => void, lw = 0.045) {
  c.beginPath();
  path();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = s * lw;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.stroke();
}
function shine(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = -0.6) {
  c.save();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.beginPath();
  c.ellipse(x, y, rx, ry, a, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

const ICONS: Record<VhsIcon, IconFn> = {
  neuron(c, s, r) {
    // dendrites
    const branches = 7;
    c.lineCap = 'round';
    for (let i = 0; i < branches; i++) {
      const a = Math.PI * 0.55 + (i / (branches - 1)) * Math.PI * 1.15 + (r() - 0.5) * 0.2;
      const L = s * (0.32 + r() * 0.12);
      const x1 = Math.cos(a) * L, y1 = Math.sin(a) * L;
      for (const [lw, col] of [[0.085, INK], [0.045, '#ff7ab8']] as const) {
        c.strokeStyle = col;
        c.lineWidth = s * lw;
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(Math.cos(a + 0.3) * L * 0.5, Math.sin(a + 0.3) * L * 0.5, x1, y1);
        c.moveTo(x1 * 0.75, y1 * 0.75);
        c.lineTo(x1 * 0.75 + Math.cos(a - 0.7) * s * 0.12, y1 * 0.75 + Math.sin(a - 0.7) * s * 0.12);
        c.moveTo(x1, y1);
        c.lineTo(x1 + Math.cos(a + 0.6) * s * 0.1, y1 + Math.sin(a + 0.6) * s * 0.1);
        c.stroke();
      }
    }
    // axon with myelin beads to the lower right
    const ax = (u: number) => [u * s * 0.48, u * s * 0.38 + Math.sin(u * 5) * s * 0.03] as const;
    for (const [lw, col] of [[0.075, INK], [0.035, '#ff7ab8']] as const) {
      c.strokeStyle = col;
      c.lineWidth = s * lw;
      c.beginPath();
      for (let u = 0; u <= 1.001; u += 0.05) c.lineTo(...ax(u));
      c.stroke();
    }
    for (let k = 0; k < 3; k++) {
      const [x, y] = ax(0.35 + k * 0.2);
      outlined(c, s, '#ffe14a', () => c.ellipse(x, y, s * 0.06, s * 0.035, 0.67, 0, Math.PI * 2), 0.03);
    }
    const [tx, ty] = ax(1);
    for (let k = -1; k <= 1; k++) outlined(c, s, '#ff7ab8', () => c.arc(tx + k * s * 0.05, ty + s * 0.05 + Math.abs(k) * -s * 0.02, s * 0.03, 0, Math.PI * 2), 0.02);
    // soma
    outlined(c, s, '#ff4f9b', () => c.ellipse(0, 0, s * 0.17, s * 0.15, 0.3, 0, Math.PI * 2));
    outlined(c, s, '#7a1fa8', () => c.arc(s * 0.01, s * 0.01, s * 0.06, 0, Math.PI * 2), 0.03);
    shine(c, -s * 0.07, -s * 0.06, s * 0.04, s * 0.022);
  },
  brain(c, s) {
    outlined(c, s, '#ff8fb8', () => {
      c.moveTo(-s * 0.42, s * 0.05);
      c.bezierCurveTo(-s * 0.48, -s * 0.3, -s * 0.15, -s * 0.42, s * 0.05, -s * 0.36);
      c.bezierCurveTo(s * 0.3, -s * 0.42, s * 0.5, -s * 0.2, s * 0.42, s * 0.05);
      c.bezierCurveTo(s * 0.46, s * 0.25, s * 0.25, s * 0.32, s * 0.08, s * 0.28);
      c.bezierCurveTo(s * 0.06, s * 0.42, -s * 0.05, s * 0.45, -s * 0.08, s * 0.3);
      c.bezierCurveTo(-s * 0.3, s * 0.33, -s * 0.45, s * 0.25, -s * 0.42, s * 0.05);
    });
    c.strokeStyle = INK;
    c.lineWidth = s * 0.03;
    const folds: [number, number, number, number, number, number][] = [
      [-0.3, -0.12, -0.15, -0.25, 0.0, -0.15], [0.05, -0.28, 0.12, -0.1, 0.3, -0.18],
      [-0.32, 0.1, -0.18, -0.02, -0.05, 0.12], [0.05, 0.05, 0.18, 0.18, 0.33, 0.06], [0.0, -0.3, -0.02, 0.0, 0.02, 0.24],
    ];
    for (const [a, b, c1, d, e, f] of folds) {
      c.beginPath();
      c.moveTo(a * s, b * s);
      c.quadraticCurveTo(c1 * s, d * s, e * s, f * s);
      c.stroke();
    }
    shine(c, -s * 0.2, -s * 0.24, s * 0.08, s * 0.03, -0.3);
  },
  chip(c, s) {
    c.lineWidth = s * 0.035;
    c.strokeStyle = INK;
    for (let i = 0; i < 6; i++) {
      const o = -s * 0.25 + i * s * 0.1;
      for (const [x0, y0, x1, y1] of [[o, -s * 0.3, o, -s * 0.44], [o, s * 0.3, o, s * 0.44], [-s * 0.3, o, -s * 0.44, o], [s * 0.3, o, s * 0.44, o]]) {
        c.beginPath();
        c.moveTo(x0, y0);
        c.lineTo(x1, y1);
        c.stroke();
      }
    }
    outlined(c, s, '#3a3f52', () => c.roundRect(-s * 0.32, -s * 0.32, s * 0.64, s * 0.64, s * 0.05));
    outlined(c, s, '#c9a227', () => c.roundRect(-s * 0.16, -s * 0.16, s * 0.32, s * 0.32, s * 0.02), 0.03);
    c.strokeStyle = '#7a5f12';
    c.lineWidth = s * 0.015;
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(-s * 0.16 + i * s * 0.08, -s * 0.16);
      c.lineTo(-s * 0.16 + i * s * 0.08, s * 0.16);
      c.stroke();
    }
    shine(c, -s * 0.2, -s * 0.22, s * 0.07, s * 0.025, -0.2);
  },
  atom(c, s) {
    c.lineWidth = s * 0.04;
    for (let k = 0; k < 3; k++) {
      c.save();
      c.rotate((k * Math.PI) / 3);
      c.strokeStyle = INK;
      c.lineWidth = s * 0.06;
      c.beginPath();
      c.ellipse(0, 0, s * 0.45, s * 0.16, 0, 0, Math.PI * 2);
      c.stroke();
      c.strokeStyle = '#4fb7ff';
      c.lineWidth = s * 0.025;
      c.stroke();
      outlined(c, s, '#4fb7ff', () => c.arc(s * 0.45, 0, s * 0.05, 0, Math.PI * 2), 0.03);
      c.restore();
    }
    outlined(c, s, '#e8202e', () => c.arc(0, 0, s * 0.11, 0, Math.PI * 2));
    shine(c, -s * 0.035, -s * 0.04, s * 0.03, s * 0.018);
  },
  globe(c, s, r) {
    outlined(c, s, '#2f8fe8', () => c.arc(0, 0, s * 0.38, 0, Math.PI * 2));
    c.save();
    c.beginPath();
    c.arc(0, 0, s * 0.38, 0, Math.PI * 2);
    c.clip();
    for (let i = 0; i < 5; i++) {
      const x = (r() - 0.5) * s * 0.6, y = (r() - 0.5) * s * 0.6, rr = s * (0.08 + r() * 0.12);
      outlined(c, s, '#4fcf4a', () => {
        for (let k = 0; k < 9; k++) {
          const a = (k / 9) * Math.PI * 2, q = rr * (0.7 + r() * 0.5);
          c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.8);
        }
        c.closePath();
      }, 0.025);
    }
    c.strokeStyle = 'rgba(255,255,255,0.45)';
    c.lineWidth = s * 0.012;
    for (const k of [-0.2, 0, 0.2]) {
      c.beginPath();
      c.ellipse(0, 0, s * 0.38 * Math.cos(k * 3), s * 0.38, 0, 0, Math.PI * 2);
      c.stroke();
    }
    c.restore();
    c.lineWidth = s * 0.045;
    c.strokeStyle = INK;
    c.beginPath();
    c.arc(0, 0, s * 0.38, 0, Math.PI * 2);
    c.stroke();
    shine(c, -s * 0.16, -s * 0.18, s * 0.08, s * 0.035);
  },
  rocket(c, s) {
    c.save();
    c.rotate(0.6);
    outlined(c, s, '#ff9a1f', () => {
      c.moveTo(-s * 0.08, s * 0.28);
      c.quadraticCurveTo(0, s * 0.62, s * 0.08, s * 0.28);
    }, 0.03);
    outlined(c, s, '#e8202e', () => {
      c.moveTo(-s * 0.1, s * 0.1);
      c.lineTo(-s * 0.22, s * 0.3);
      c.lineTo(-s * 0.1, s * 0.26);
      c.closePath();
      c.moveTo(s * 0.1, s * 0.1);
      c.lineTo(s * 0.22, s * 0.3);
      c.lineTo(s * 0.1, s * 0.26);
      c.closePath();
    });
    outlined(c, s, '#f4f4f8', () => {
      c.moveTo(0, -s * 0.42);
      c.bezierCurveTo(s * 0.15, -s * 0.28, s * 0.12, s * 0.1, s * 0.1, s * 0.28);
      c.lineTo(-s * 0.1, s * 0.28);
      c.bezierCurveTo(-s * 0.12, s * 0.1, -s * 0.15, -s * 0.28, 0, -s * 0.42);
    });
    outlined(c, s, '#4fb7ff', () => c.arc(0, -s * 0.12, s * 0.055, 0, Math.PI * 2), 0.035);
    c.restore();
  },
  lightbulb(c, s) {
    c.strokeStyle = INK;
    c.lineWidth = s * 0.04;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i / 6) * Math.PI;
      c.beginPath();
      c.moveTo(Math.cos(a) * s * 0.34, -s * 0.08 + Math.sin(a) * s * 0.34);
      c.lineTo(Math.cos(a) * s * 0.46, -s * 0.08 + Math.sin(a) * s * 0.46);
      c.stroke();
    }
    outlined(c, s, '#fff36a', () => {
      c.arc(0, -s * 0.08, s * 0.24, Math.PI * 0.8, Math.PI * 0.2);
      c.lineTo(s * 0.09, s * 0.22);
      c.lineTo(-s * 0.09, s * 0.22);
      c.closePath();
    });
    outlined(c, s, '#9aa3b5', () => c.roundRect(-s * 0.1, s * 0.22, s * 0.2, s * 0.14, s * 0.03));
    shine(c, -s * 0.1, -s * 0.16, s * 0.06, s * 0.03);
  },
  crt(c, s) {
    outlined(c, s, '#e8e1cf', () => c.roundRect(-s * 0.4, -s * 0.32, s * 0.8, s * 0.56, s * 0.06));
    outlined(c, s, '#123b20', () => c.roundRect(-s * 0.31, -s * 0.24, s * 0.62, s * 0.4, s * 0.05), 0.035);
    c.fillStyle = '#5bff8a';
    for (let i = 0; i < 4; i++) c.fillRect(-s * 0.25, -s * 0.18 + i * s * 0.08, s * (0.2 + ((i * 37) % 30) / 100), s * 0.03);
    outlined(c, s, '#c9c0a8', () => {
      c.moveTo(-s * 0.15, s * 0.24);
      c.lineTo(s * 0.15, s * 0.24);
      c.lineTo(s * 0.22, s * 0.36);
      c.lineTo(-s * 0.22, s * 0.36);
      c.closePath();
    });
    shine(c, -s * 0.2, -s * 0.18, s * 0.06, s * 0.025, -0.4);
  },
  robot(c, s) {
    c.strokeStyle = INK;
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.moveTo(0, -s * 0.28);
    c.lineTo(0, -s * 0.42);
    c.stroke();
    outlined(c, s, '#e8202e', () => c.arc(0, -s * 0.44, s * 0.05, 0, Math.PI * 2), 0.03);
    outlined(c, s, '#b8c4d8', () => c.roundRect(-s * 0.3, -s * 0.28, s * 0.6, s * 0.48, s * 0.08));
    for (const x of [-0.13, 0.13]) {
      outlined(c, s, '#fff36a', () => c.arc(x * s, -s * 0.07, s * 0.07, 0, Math.PI * 2), 0.03);
      c.fillStyle = INK;
      c.beginPath();
      c.arc(x * s, -s * 0.07, s * 0.025, 0, Math.PI * 2);
      c.fill();
    }
    outlined(c, s, '#3a3f52', () => c.roundRect(-s * 0.15, s * 0.07, s * 0.3, s * 0.07, s * 0.02), 0.03);
    shine(c, -s * 0.2, -s * 0.2, s * 0.06, s * 0.025, -0.2);
  },
  dna(c, s) {
    const N = 9;
    for (let i = 0; i < N; i++) {
      const y = -s * 0.42 + (i / (N - 1)) * s * 0.84, ph = (i / (N - 1)) * Math.PI * 2;
      const x = Math.sin(ph) * s * 0.2;
      c.strokeStyle = INK;
      c.lineWidth = s * 0.05;
      c.beginPath();
      c.moveTo(-x, y);
      c.lineTo(x, y);
      c.stroke();
      c.strokeStyle = ['#e8202e', '#4fb7ff', '#ffe14a', '#4fcf4a'][i % 4];
      c.lineWidth = s * 0.026;
      c.stroke();
    }
    for (const [col, sgn] of [['#7a1fa8', 1], ['#ff6a1a', -1]] as const) {
      c.strokeStyle = INK;
      c.lineWidth = s * 0.085;
      c.beginPath();
      for (let u = 0; u <= 1.001; u += 0.02) c.lineTo(sgn * Math.sin(u * Math.PI * 2) * s * 0.2, -s * 0.42 + u * s * 0.84);
      c.stroke();
      c.strokeStyle = col;
      c.lineWidth = s * 0.045;
      c.stroke();
    }
  },
  planet(c, s) {
    c.save();
    c.rotate(-0.35);
    c.strokeStyle = INK;
    c.lineWidth = s * 0.07;
    c.beginPath();
    c.ellipse(0, 0, s * 0.46, s * 0.12, 0, Math.PI, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#ffd36a';
    c.lineWidth = s * 0.035;
    c.stroke();
    outlined(c, s, '#ff8a3a', () => c.arc(0, 0, s * 0.26, 0, Math.PI * 2));
    c.strokeStyle = 'rgba(160,50,20,0.5)';
    c.lineWidth = s * 0.03;
    for (const y of [-0.1, 0.05]) {
      c.beginPath();
      c.ellipse(0, y * s, s * 0.24, s * 0.04, 0, 0, Math.PI);
      c.stroke();
    }
    c.strokeStyle = INK;
    c.lineWidth = s * 0.07;
    c.beginPath();
    c.ellipse(0, 0, s * 0.46, s * 0.12, 0, 0, Math.PI);
    c.stroke();
    c.strokeStyle = '#ffd36a';
    c.lineWidth = s * 0.035;
    c.stroke();
    shine(c, -s * 0.1, -s * 0.12, s * 0.06, s * 0.03);
    c.restore();
  },
  flask(c, s) {
    outlined(c, s, 'rgba(230,245,255,0.9)', () => {
      c.moveTo(-s * 0.07, -s * 0.38);
      c.lineTo(-s * 0.07, -s * 0.12);
      c.lineTo(-s * 0.3, s * 0.32);
      c.quadraticCurveTo(0, s * 0.42, s * 0.3, s * 0.32);
      c.lineTo(s * 0.07, -s * 0.12);
      c.lineTo(s * 0.07, -s * 0.38);
      c.closePath();
    });
    outlined(c, s, '#e8202e', () => {
      c.moveTo(-s * 0.2, s * 0.13);
      c.lineTo(-s * 0.3, s * 0.32);
      c.quadraticCurveTo(0, s * 0.42, s * 0.3, s * 0.32);
      c.lineTo(s * 0.2, s * 0.13);
      c.closePath();
    }, 0.03);
    for (const [x, y, rr] of [[0.02, 0.0, 0.03], [-0.05, -0.12, 0.022], [0.06, -0.22, 0.03]] as const) outlined(c, s, '#ffb3c0', () => c.arc(x * s, y * s, rr * s, 0, Math.PI * 2), 0.02);
  },
  gear(c, s) {
    outlined(c, s, '#9aa3b5', () => {
      const n = 10;
      for (let i = 0; i < n * 2; i++) {
        const a = (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? s * 0.3 : s * 0.4;
        c.lineTo(Math.cos(a - 0.08) * rr, Math.sin(a - 0.08) * rr);
        c.lineTo(Math.cos(a + 0.08) * rr, Math.sin(a + 0.08) * rr);
      }
      c.closePath();
    });
    outlined(c, s, '#ffe14a', () => c.arc(0, 0, s * 0.11, 0, Math.PI * 2), 0.035);
  },
  book(c, s) {
    outlined(c, s, '#e8202e', () => c.roundRect(-s * 0.3, -s * 0.36, s * 0.56, s * 0.72, s * 0.04));
    outlined(c, s, '#fff8e8', () => c.rect(s * 0.18, -s * 0.33, s * 0.1, s * 0.66), 0.03);
    outlined(c, s, '#ffe14a', () => c.rect(-s * 0.2, -s * 0.2, s * 0.32, s * 0.12), 0.025);
    shine(c, -s * 0.2, -s * 0.28, s * 0.05, s * 0.02, 0);
  },
  magnifier(c, s) {
    c.strokeStyle = INK;
    c.lineWidth = s * 0.13;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(s * 0.14, s * 0.14);
    c.lineTo(s * 0.38, s * 0.38);
    c.stroke();
    c.strokeStyle = '#7a4a1f';
    c.lineWidth = s * 0.08;
    c.stroke();
    outlined(c, s, 'rgba(180,230,255,0.75)', () => c.arc(-s * 0.05, -s * 0.05, s * 0.26, 0, Math.PI * 2), 0.07);
    shine(c, -s * 0.13, -s * 0.15, s * 0.07, s * 0.03);
  },
};
export const VHS_ICONS = Object.keys(ICONS) as VhsIcon[];

function drawIcon(c: CanvasRenderingContext2D, name: VhsIcon, x: number, y: number, s: number, rot: number, r: () => number) {
  const f = ICONS[name] ?? ICONS.lightbulb;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  // a soft drop shadow lifts clip-art off loud backgrounds
  c.shadowColor = 'rgba(0,0,0,0.35)';
  c.shadowBlur = s * 0.06;
  c.shadowOffsetX = s * 0.03;
  c.shadowOffsetY = s * 0.04;
  f(c, s, r);
  c.restore();
}

// ---------------------------------------------------------------------------
// type helpers
// ---------------------------------------------------------------------------
function starburst(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, n: number, fill: string, rim: string, r: () => number) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const k = i % 2 ? 0.72 + r() * 0.06 : 1 + r() * 0.08;
    pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
  }
  c.beginPath();
  pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py)));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = Math.max(2, rx * 0.035);
  c.strokeStyle = INK;
  c.stroke();
  c.lineWidth = Math.max(1, rx * 0.015);
  c.strokeStyle = rim;
  c.stroke();
}

function fitFont(c: CanvasRenderingContext2D, text: string, family: string, maxW: number, start: number, min: number): number {
  let size = start;
  for (; size > min; size -= 1) {
    c.font = `${size}px ${family}`;
    if (c.measureText(text).width <= maxW) break;
  }
  c.font = `${size}px ${family}`;
  return size;
}

function wrapTitle(c: CanvasRenderingContext2D, text: string, family: string, maxW: number, size: number, maxLines: number): { lines: string[]; size: number } {
  for (let s = size; s >= size * 0.4; s -= 1) {
    c.font = `${s}px ${family}`;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (c.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else cur = t;
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines && lines.every((l) => c.measureText(l).width <= maxW)) return { lines, size: s };
  }
  return { lines: [text], size: size * 0.4 };
}

/** Big chunky title: offset "3-D" shade, thick ink outline, bright fill, a hot highlight. */
function chunkyText(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, family: string, fill: string, shade: string, align: CanvasTextAlign = 'center') {
  c.font = `${size}px ${family}`;
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  c.lineJoin = 'round';
  const d = size * 0.07;
  c.lineWidth = size * 0.2;
  c.strokeStyle = INK;
  c.strokeText(text, x + d, y + d);
  c.fillStyle = shade;
  c.fillText(text, x + d, y + d);
  c.strokeText(text, x, y);
  c.fillStyle = fill;
  c.fillText(text, x, y);
  c.save();
  c.globalAlpha = 0.35;
  c.lineWidth = size * 0.035;
  c.strokeStyle = '#ffffff';
  c.strokeText(text, x - size * 0.012, y - size * 0.012);
  c.restore();
}

function vhsMark(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical = false) {
  c.save();
  c.fillStyle = '#ffffff';
  c.strokeStyle = INK;
  c.lineWidth = Math.max(1.5, Math.min(w, h) * 0.06);
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(w, h) * 0.12);
  c.fill();
  c.stroke();
  c.translate(x + w / 2, y + h / 2);
  if (vertical) c.rotate(-Math.PI / 2);
  const L = vertical ? h : w, T = vertical ? w : h;
  c.fillStyle = INK;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fitFont(c, 'VHS', `${TITLE}`, L * 0.82, Math.round(T * 0.8), 6);
  c.fillText('VHS', 0, T * 0.02);
  c.restore();
}

// ---------------------------------------------------------------------------
// wear
// ---------------------------------------------------------------------------
function wear(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, amount = 1) {
  c.save();
  // sun-fade from the top-left (shelf light), very slight
  c.fillStyle = lin(c, 0, 0, w, h, [[0, 'rgba(255,250,235,0.12)'], [0.6, 'rgba(255,250,235,0)']]);
  c.fillRect(0, 0, w, h);
  // scuffs: short pale strokes
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i < 26 * amount; i++) {
    const x = r() * w, y = r() * h, L = (4 + r() * 22) * (w / 300), a = r() * Math.PI;
    c.lineWidth = 0.4 + r() * 1.1;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
    c.stroke();
  }
  // edge chips
  c.fillStyle = 'rgba(255,250,240,0.55)';
  for (let i = 0; i < 18 * amount; i++) {
    const side = Math.floor(r() * 4), u = r(), s = (1 + r() * 3.5) * (w / 300);
    const [x, y] = side === 0 ? [u * w, 0] : side === 1 ? [w, u * h] : side === 2 ? [u * w, h] : [0, u * h];
    c.beginPath();
    c.ellipse(x, y, s * (1 + r()), s, r() * Math.PI, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// public: sleeve front, spine, clamshell
// ---------------------------------------------------------------------------
export function vhsSpecOf(b: BookMeta): Required<Omit<VhsSpec, 'art' | 'tagline'>> & Pick<VhsSpec, 'art' | 'tagline'> {
  const v = (b as BookMeta & { vhs?: VhsSpec }).vhs ?? {};
  const h = hashStr(b.slug);
  return {
    subject: (v.subject ?? 'Educational Series').toUpperCase(),
    theme: v.theme ?? VHS_THEMES[h % VHS_THEMES.length],
    icons: v.icons?.length ? v.icons : (['lightbulb', 'atom', 'book', 'globe'] as VhsIcon[]),
    tagline: v.tagline,
    label: v.label ?? VHS_LABEL,
    vol: v.vol ?? (b.seriesOrder ?? 1),
    art: v.art,
  };
}

function runtimeOf(b: BookMeta): number {
  const film = (b as BookMeta & { runtime?: number }).runtime;
  if (film) return film;
  return (b.chapters ?? []).reduce((s, c) => s + (c.duration ?? 0), 0);
}

/**
 * Paint the sleeve FRONT (inside the clamshell window) into (0,0,W,H).
 * `art` replaces the clip-art illustration when given.
 */
export function drawVhsSleeve(c: CanvasRenderingContext2D, W: number, H: number, b: BookMeta, art?: CanvasImageSource | null) {
  const spec = vhsSpecOf(b);
  const th = THEMES[spec.theme];
  const r = rng(hashStr(b.slug));
  const u = W / 300; // design unit: layout reads at any size

  c.save();
  th.bg(c, W, H, r);

  const stripH = H * 0.06;
  // title block on a starburst
  const tTop = stripH + H * 0.03;
  const titleText = b.title.toUpperCase();
  const tw = wrapTitle(c, titleText, TITLE, W * 0.84, Math.round(66 * u), 3);
  const lineH = tw.size * 0.98;
  const blockH = lineH * tw.lines.length;
  const burstCy = tTop + blockH / 2 + tw.size * 0.12;
  starburst(c, W * 0.5, burstCy, W * 0.5, blockH * 0.62 + 18 * u, 16, th.burst[0], th.burst[1], r);
  c.save();
  c.translate(W * 0.5, 0);
  c.transform(1, 0, -0.12, 1, 0, 0); // the period italic
  tw.lines.forEach((ln, i) => chunkyText(c, ln, 0 + (tTop + lineH * (i + 0.82)) * 0.12, tTop + lineH * (i + 0.82), tw.size, TITLE, th.title, th.titleShade));
  c.restore();

  // publisher strip (top) — painted over the starburst's spikes
  c.fillStyle = th.strip;
  c.fillRect(0, 0, W, stripH);
  c.fillStyle = th.stripInk;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  fitFont(c, spec.label, BANNER, W * 0.66, Math.round(stripH * 0.46), 6);
  c.fillText(spec.label, W * 0.045, stripH * 0.54);
  c.textAlign = 'right';
  fitFont(c, `VOL. ${spec.vol}`, BANNER, W * 0.22, Math.round(stripH * 0.5), 6);
  c.fillText(`VOL. ${spec.vol}`, W * 0.955, stripH * 0.54);

  // subject banner
  const bY = tTop + blockH + H * 0.045;
  const bH = H * 0.06;
  const bW = W * 0.76;
  c.save();
  c.fillStyle = th.banner;
  c.strokeStyle = INK;
  c.lineWidth = Math.max(2, 3 * u);
  c.beginPath();
  c.roundRect(W / 2 - bW / 2, bY, bW, bH, bH * 0.18);
  c.fill();
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = Math.max(1, 1.2 * u);
  c.beginPath();
  c.roundRect(W / 2 - bW / 2 + 4 * u, bY + 4 * u, bW - 8 * u, bH - 8 * u, bH * 0.12);
  c.stroke();
  c.fillStyle = th.bannerInk;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fitFont(c, spec.subject, BANNER, bW * 0.86, Math.round(bH * 0.52), 6);
  c.fillText(spec.subject, W / 2, bY + bH * 0.55);
  c.restore();

  // illustration
  const artTop = bY + bH + H * 0.03;
  const artBot = H * 0.84;
  const artH = artBot - artTop;
  const cx = W / 2;
  const cy = artTop + artH * 0.52;
  if (art) {
    const iw = (art as HTMLImageElement).width || 1, ih = (art as HTMLImageElement).height || 1;
    const k = Math.min((W * 0.9) / iw, artH / ih);
    c.drawImage(art, cx - (iw * k) / 2, cy - (ih * k) / 2, iw * k, ih * k);
  } else {
    // a halo disc behind the hero, then the hero, then satellites around it
    const hero = Math.min(W * 0.62, artH * 0.85);
    const halo = c.createRadialGradient(cx, cy, 0, cx, cy, hero * 0.62);
    halo.addColorStop(0, 'rgba(255,255,255,0.55)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = halo;
    c.beginPath();
    c.arc(cx, cy, hero * 0.62, 0, Math.PI * 2);
    c.fill();
    const sats = spec.icons.slice(1, 4);
    const spots: [number, number, number][] = [
      [cx - W * 0.31, cy - artH * 0.3, -0.25],
      [cx + W * 0.3, cy - artH * 0.24, 0.3],
      [cx + W * 0.28, cy + artH * 0.3, -0.15],
    ];
    sats.forEach((ic, i) => drawIcon(c, ic, spots[i][0], spots[i][1], hero * 0.42, spots[i][2], r));
    drawIcon(c, spec.icons[0], cx, cy, hero, 0, r);
    // a couple of sparkles for that "edutainment" shine
    for (let i = 0; i < 4; i++) sparkle(c, cx + (r() - 0.5) * W * 0.8, artTop + r() * artH, 7 * u + r() * 6 * u, 'rgba(255,255,255,0.9)');
  }

  // tagline
  if (spec.tagline) {
    c.fillStyle = '#ffffff';
    c.strokeStyle = INK;
    c.lineWidth = Math.max(2, 3 * u);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    fitFont(c, spec.tagline, ROUND, W * 0.88, Math.round(15 * u), 6);
    c.strokeText(spec.tagline, W / 2, H * 0.86);
    c.fillText(spec.tagline, W / 2, H * 0.86);
  }

  // footer: runtime + "educational" seal + the VHS mark
  const fY = H * 0.895;
  const mins = Math.max(1, Math.round(runtimeOf(b) / 60));
  c.fillStyle = 'rgba(10,6,20,0.72)';
  c.fillRect(0, fY, W, H - fY);
  c.fillStyle = '#ffffff';
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  fitFont(c, `APPROX. ${mins} MIN · COLOR · STEREO`, BANNER, W * 0.5, Math.round(10 * u), 5);
  c.fillText(`APPROX. ${mins} MIN · COLOR · STEREO`, W * 0.2, fY + (H - fY) * 0.5);
  // seal
  const sx = W * 0.1, sy = fY + (H - fY) * 0.5, sr = (H - fY) * 0.36;
  c.fillStyle = th.burst[0];
  c.strokeStyle = '#ffffff';
  c.lineWidth = Math.max(1, 1.5 * u);
  c.beginPath();
  c.arc(sx, sy, sr, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.fillStyle = INK;
  c.textAlign = 'center';
  fitFont(c, 'EDU', BANNER, sr * 1.5, Math.round(sr * 0.75), 5);
  c.fillText('EDU', sx, sy + sr * 0.05);
  const mW = W * 0.2, mH = (H - fY) * 0.62;
  vhsMark(c, W * 0.955 - mW, fY + (H - fY - mH) / 2, mW, mH);

  wear(c, W, H, r);
  c.restore();
}

/** Paint the spine (a standing tape's narrow face) into (0,0,W,H): title reads bottom → top. */
export function drawVhsSpine(c: CanvasRenderingContext2D, W: number, H: number, b: BookMeta) {
  const spec = vhsSpecOf(b);
  const th = THEMES[spec.theme];
  const r = rng(hashStr(b.slug) ^ 0x5f3759df);
  c.save();
  c.fillStyle = lin(c, 0, 0, W, 0, [[0, th.spine[1]], [0.5, th.spine[0]], [1, th.spine[1]]]);
  c.fillRect(0, 0, W, H);
  // the VHS mark at the head
  const mH = W * 0.86;
  vhsMark(c, W * 0.1, W * 0.12, W * 0.8, mH * 0.6, false);
  // vol at the tail
  c.fillStyle = th.stripInk;
  c.fillRect(0, H - W * 0.9, W, W * 0.9);
  c.fillStyle = th.strip;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fitFont(c, `${spec.vol}`, BANNER, W * 0.7, Math.round(W * 0.5), 6);
  c.fillText(`${spec.vol}`, W / 2, H - W * 0.45);
  // title up the spine
  c.save();
  c.translate(W / 2, H - W * 1.1);
  c.rotate(-Math.PI / 2);
  const maxLen = H - W * 1.1 - W * 0.9;
  const t = b.title.toUpperCase();
  const size = fitFont(c, t, TITLE, maxLen, Math.round(W * 0.62), 6);
  chunkyText(c, t, 0, size * 0.36, size, TITLE, th.title, th.titleShade, 'left');
  c.restore();
  wear(c, W, H, r, 0.5);
  c.restore();
}

/**
 * A whole clamshell front: black plastic case, the sleeve behind its clear
 * window, and a glint across the plastic. Fills (0,0,W,H).
 */
export function drawVhsCase(c: CanvasRenderingContext2D, W: number, H: number, b: BookMeta, art?: CanvasImageSource | null) {
  const m = W * 0.045;
  c.save();
  c.fillStyle = lin(c, 0, 0, W, 0, [[0, '#1c1b20'], [0.5, '#0d0c10'], [1, '#1c1b20']]);
  c.beginPath();
  c.roundRect(0, 0, W, H, W * 0.03);
  c.fill();
  c.save();
  c.beginPath();
  c.rect(m, m, W - 2 * m, H - 2 * m);
  c.clip();
  c.translate(m, m);
  drawVhsSleeve(c, W - 2 * m, H - 2 * m, b, art);
  c.restore();
  // clear-sleeve glint
  c.fillStyle = lin(c, 0, 0, W, H, [[0, 'rgba(255,255,255,0)'], [0.32, 'rgba(255,255,255,0)'], [0.36, 'rgba(255,255,255,0.13)'], [0.44, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']]);
  c.fillRect(m, m, W - 2 * m, H - 2 * m);
  c.strokeStyle = 'rgba(255,255,255,0.08)';
  c.lineWidth = 1;
  c.strokeRect(m + 0.5, m + 0.5, W - 2 * m - 1, H - 2 * m - 1);
  c.restore();
}

const SLEEVE_CACHE = new Map<string, Promise<HTMLCanvasElement>>();
/** Compose a case front once per slug+size (fonts loaded, optional art decoded). */
export function composeVhs(b: BookMeta, W: number, H: number, artUrl?: string | null): Promise<HTMLCanvasElement> {
  const key = `${b.slug}@${W}x${H}`;
  const hit = SLEEVE_CACHE.get(key);
  if (hit) return hit;
  const p = (async () => {
    await loadVhsFonts();
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return cv;
    let img: HTMLImageElement | null = null;
    if (artUrl) {
      img = await new Promise<HTMLImageElement | null>((res) => {
        const im = new Image();
        im.crossOrigin = 'anonymous';
        im.onload = () => res(im);
        im.onerror = () => res(null);
        im.src = artUrl;
      });
    }
    drawVhsCase(ctx, W, H, b, img);
    return cv;
  })();
  SLEEVE_CACHE.set(key, p);
  return p;
}

export const isFilm = (b: Pick<BookMeta, 'slug'> & { kind?: string }) => b.kind === 'film';
