// Dev-only harness for book scene contact sheets (generator/scene-sheet.mjs): renders one registered scene
// (?scene=books/<slug>/chapter-<n>) on the player's stage at an authored time, with the caption pill the player
// draws over the bottom of the stage, so a frame here is what a viewer sees at that moment.
//   window.__sheet = { ready, duration, captions: [{at, dur, text}], seek(t) -> Promise<void>, error? }
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { Stage } from '../core';
import type { SceneState } from '../core';
import { VIZ_SCENES, type VizSceneEntry } from '../scenes';

declare global {
  interface Window {
    __sheet?: { ready: boolean; duration?: number; captions?: { at: number; dur: number; text: string }[]; seek?: (t: number) => Promise<void>; error?: string };
  }
}

const params = new URLSearchParams(location.search);
const scene = params.get('scene') ?? '';
window.__sheet = { ready: false };

function Sheet() {
  const [entry, setEntry] = useState<VizSceneEntry | null>(null);
  const [state, setState] = useState<SceneState | null>(null);
  useEffect(() => {
    const load = VIZ_SCENES[scene];
    if (!load) {
      window.__sheet = { ready: true, error: `unknown scene '${scene}'` };
      return;
    }
    load().then((e) => {
      const { tl } = e.buildScene();
      const caps = tl.describe().captions.map((c) => ({ at: c.at, dur: c.dur, text: c.text }));
      setEntry(e);
      setState(tl.sample(Number(params.get('t') ?? 0)));
      window.__sheet = {
        ready: true,
        duration: tl.duration,
        captions: caps,
        seek: (t: number) =>
          new Promise<void>((res) => {
            setState(tl.sample(t));
            requestAnimationFrame(() => requestAnimationFrame(() => res()));
          }),
      };
    }, (err) => (window.__sheet = { ready: true, error: String(err) }));
  }, []);
  if (!entry || !state) return null;
  const cap = state.captions?.find((c) => c.u > 0.5);
  return (
    <div className="bp-stage" style={{ width: 1280, height: 720 }}>
      <Stage style={{ height: '100%' }}>{entry.Render({ s: state })}</Stage>
      {cap && (
        <div className="captions" style={{ position: 'absolute', left: 0, right: 0, bottom: 18, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <span style={{ maxWidth: 1000, padding: '8px 16px', borderRadius: 12, background: 'rgba(0,0,0,.72)', color: '#fff', font: '500 20px/1.35 system-ui, sans-serif', textAlign: 'center' }}>{cap.text}</span>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Sheet />);
