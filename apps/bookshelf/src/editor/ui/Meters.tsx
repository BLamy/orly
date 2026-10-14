/**
 * Master meters: L/R peak bars beside the timeline (Vegas "Master Bus" strip).
 *
 *   <Meters audio={audio} />
 *
 * Reads `audio.meters()` (dBFS sample peak per channel) on rAF and paints one canvas, so meter motion
 * never re-renders React. Bars fall back at ~24 dB/s, a peak-hold tick sits for 1.5 s, and a clip lamp
 * (≥ −0.1 dBFS) latches until clicked. Scale: −60..+6 dB with ticks every 6 dB.
 */
import { useEffect, useRef } from 'react';
import type { AudioEngine } from '../model/types';
import { C } from './theme';

const FLOOR = -60;
const TOP = 6;
const FALL_DB_PER_S = 24;
const HOLD_S = 1.5;
const CLIP_DB = -0.1;

/** dB → 0..1 along the meter (linear in dB, which is what Vegas draws) */
const pos = (db: number) => Math.max(0, Math.min(1, (db - FLOOR) / (TOP - FLOOR)));

interface Chan {
  shown: number;
  hold: number;
  holdAt: number;
  clip: boolean;
}

export default function Meters({ audio }: { audio: AudioEngine | null }) {
  const cvRef = useRef<HTMLCanvasElement | null>(null);
  const chans = useRef<[Chan, Chan]>([
    { shown: FLOOR, hold: FLOOR, holdAt: 0, clip: false },
    { shown: FLOOR, hold: FLOOR, holdAt: 0, clip: false },
  ]);
  const readout = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    let raf = 0;
    let prev = performance.now();
    let lastText = '';
    const ro = new ResizeObserver(() => {
      const r = cv.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
    });
    ro.observe(cv);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const m = audio ? audio.meters() : { l: -Infinity, r: -Infinity };
      const levels = [m.l, m.r];
      chans.current.forEach((ch, i) => {
        const db = Number.isFinite(levels[i]) ? levels[i] : -Infinity;
        ch.shown = Math.max(db, ch.shown - FALL_DB_PER_S * dt, FLOOR);
        if (db >= ch.hold || now - ch.holdAt > HOLD_S * 1000) {
          ch.hold = Math.max(db, FLOOR);
          ch.holdAt = now;
        }
        if (db >= CLIP_DB) ch.clip = true;
      });
      paint(cv, chans.current);
      const txt = chans.current.map((c) => (c.hold <= FLOOR ? '-inf' : c.hold.toFixed(1))).join('  ');
      if (readout.current && txt !== lastText) {
        readout.current.textContent = txt;
        lastText = txt;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [audio]);

  return (
    <div className="fe-panel" aria-label="Master meters" style={{ alignItems: 'stretch' }}>
      <div className="fe-group-head" style={{ justifyContent: 'center', position: 'static' }}>
        Master
      </div>
      <canvas
        ref={cvRef}
        title="Master peak (dBFS). Click to reset the clip lamps."
        style={{ flex: 1, minHeight: 0, width: '100%', display: 'block' }}
        onClick={() => chans.current.forEach((c) => ((c.clip = false), (c.hold = FLOOR)))}
      />
      <div ref={readout} className="fe-mono" style={{ textAlign: 'center', fontSize: 9, color: C.dim, padding: '2px 0 3px', whiteSpace: 'nowrap' }}>
        -inf -inf
      </div>
    </div>
  );
}

function paint(cv: HTMLCanvasElement, chans: Chan[]): void {
  const c = cv.getContext('2d');
  if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  const W = cv.width / dpr;
  const H = cv.height / dpr;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.clearRect(0, 0, W, H);
  const top = 12; // clip lamps
  const bottom = 4;
  const scaleW = 18;
  const barW = Math.max(6, (W - scaleW - 8) / 2);
  const h = H - top - bottom;
  const y = (db: number) => top + h * (1 - pos(db));

  // scale ticks
  c.font = '9px ui-monospace, Menlo, monospace';
  c.textAlign = 'right';
  c.textBaseline = 'middle';
  for (let db = TOP; db >= FLOOR; db -= 6) {
    const yy = Math.round(y(db)) + 0.5;
    c.fillStyle = db === 0 ? C.text : C.faint;
    c.fillText(String(Math.abs(db)), scaleW - 2, yy);
    c.fillStyle = '#2a2d33';
    c.fillRect(scaleW, yy, W - scaleW - 2, 1);
  }

  chans.forEach((ch, i) => {
    const x = scaleW + 2 + i * (barW + 3);
    c.fillStyle = '#0c0d0f';
    c.fillRect(x, top, barW, h);
    // the bar: green below −12, amber to −3, red above
    const yTop = y(ch.shown);
    const zones: [number, number, string][] = [
      [FLOOR, -12, '#3fae63'],
      [-12, -3, '#d9b53a'],
      [-3, TOP, '#e2574a'],
    ];
    for (const [lo, hi, col] of zones) {
      const y0 = Math.max(yTop, y(hi));
      const y1 = y(lo);
      if (y1 > y0) {
        c.fillStyle = col;
        c.fillRect(x, y0, barW, y1 - y0);
      }
    }
    // peak hold
    if (ch.hold > FLOOR) {
      c.fillStyle = ch.hold >= -3 ? '#ff8a7a' : '#e8e8e8';
      c.fillRect(x, Math.round(y(ch.hold)), barW, 1.5);
    }
    // clip lamp
    c.fillStyle = ch.clip ? '#ff3b2f' : '#3a1c1a';
    c.fillRect(x, 2, barW, 7);
  });
}
