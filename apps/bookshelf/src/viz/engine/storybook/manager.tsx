// default React import required: the Storybook manager builder compiles JSX
// to React.createElement (classic runtime), unlike Vite's automatic runtime
import React, { useRef, useState } from 'react';
import { addons, types, useChannel } from 'storybook/manager-api';
import { TimelineEditor } from './TimelineEditor';
import { DEFAULT_SAVE_ENDPOINT, EVT_DOC, EVT_OP, EVT_TIME } from './protocol';
import type { MotionDoc, MotionOp, MotionTime } from './protocol';
import './editor.css';

const ADDON_ID = 'viz-motion';

let saveEndpoint: string = DEFAULT_SAVE_ENDPOINT;

/**
 * Point the panel's "save to source" button at a different dev-server
 * endpoint (must match the `endpoint` you gave `motionSaveEndpointPlugin`).
 * Call before or after `registerMotionAddon` — the URL is read per save.
 */
export function setMotionSaveEndpoint(url: string): void {
  saveEndpoint = url;
}

export function getMotionSaveEndpoint(): string {
  return saveEndpoint;
}

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

export function MotionPanel({ active }: { active: boolean }): React.ReactNode {
  const [doc, setDoc] = useState<MotionDoc | null>(null);
  const [time, setTime] = useState<MotionTime>({ t: 0, playing: false, looping: false });
  const [voiceOn, setVoiceOn] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  // last-saved overrides per file, to show the unsaved-changes dot
  const savedRef = useRef<Record<string, string>>({});

  const emit = useChannel({
    [EVT_DOC]: (d: MotionDoc | null) => {
      setDoc(d);
      if (d?.file && !(d.file in savedRef.current)) {
        savedRef.current[d.file] = JSON.stringify(d.overrides);
      }
    },
    [EVT_TIME]: (tm: MotionTime) => setTime(tm),
  });

  if (!active) return null;
  if (!doc) {
    return (
      <div className="viz-mp viz-mp-empty">
        No motion timeline here — stories expose one via{' '}
        <code>&lt;Player motion=&#123;&#123; file, slug &#125;&#125;&gt;</code>.
      </div>
    );
  }

  const op = (o: MotionOp) => emit(EVT_OP, o);
  const dirty = doc.file ? savedRef.current[doc.file] !== JSON.stringify(doc.overrides) : false;

  const save = async () => {
    if (!doc.file) return;
    try {
      const res = await fetch(saveEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: doc.file, overrides: doc.overrides }),
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error ?? 'save failed');
      savedRef.current[doc.file] = JSON.stringify(doc.overrides);
      setSaveMsg(`saved → ${doc.file.split('/').slice(-2).join('/')}`);
    } catch (e) {
      setSaveMsg(`✗ ${e instanceof Error ? e.message : String(e)}`);
    }
    window.setTimeout(() => setSaveMsg(''), 3500);
  };

  const downloadNarration = () => {
    const script = { slug: doc.slug, lines: doc.narration };
    const blob = new Blob([JSON.stringify(script, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.slug}.narration.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="viz-mp">
      <div className="viz-mp-toolbar">
        <button onClick={() => op({ op: 'toggle' })} title="Play/pause the story">
          {time.playing ? '❚❚' : '▶'}
        </button>
        <span className="viz-player-time">
          {fmt(time.t)} / {fmt(doc.duration)}
        </span>
        <button
          className={time.looping ? 'viz-active' : ''}
          onClick={() => op({ op: 'loop', on: !time.looping })}
          title="Loop"
        >
          ⟳
        </button>
        <button
          className={voiceOn ? 'viz-active' : ''}
          onClick={() => {
            const on = !voiceOn;
            setVoiceOn(on);
            op({ op: 'voice', on });
          }}
          title="Narrate captions with the in-browser voice while playing (baked narration is publish-only)"
        >
          {voiceOn ? '🔊 voice' : '🔇 voice'}
        </button>
        <span className="viz-mp-spacer" />
        <span className="viz-mp-msg">{saveMsg}</span>
        <button onClick={downloadNarration} title="Export the caption script for your narration pipeline">
          narration ⬇
        </button>
        <button onClick={() => op({ op: 'reset' })} title="Discard all edits (back to the authored scene)">
          reset
        </button>
        <button
          className={dirty ? 'viz-mp-save viz-mp-dirty' : 'viz-mp-save'}
          onClick={save}
          disabled={!doc.file}
          title={doc.file ? `Write edits to ${doc.file}` : 'Story has no motion.file'}
        >
          {dirty ? '● save to source' : 'save to source'}
        </button>
      </div>
      <TimelineEditor
        doc={doc}
        duration={doc.duration}
        t={time.t}
        onSeek={(t) => op({ op: 'seek', t })}
        onKeyframe={(id, patch) => op({ op: 'kf', id, patch })}
        onCaption={(id, patch) => op({ op: 'cap', id, patch })}
      />
    </div>
  );
}

export interface RegisterMotionAddonOptions {
  /** POST target for "save to source" (default: DEFAULT_SAVE_ENDPOINT) */
  saveEndpoint?: string;
  /** addon id (default: 'viz-motion') */
  addonId?: string;
  /** panel tab title (default: 'Motion') */
  title?: string;
}

/**
 * Register the Motion panel with the Storybook manager. Call this from a
 * manager entry (e.g. `.storybook/manager.ts` or a file listed in
 * `managerEntries`):
 *
 *   import { registerMotionAddon } from '3b1bd3/storybook';
 *   registerMotionAddon();
 */
export function registerMotionAddon(options: RegisterMotionAddonOptions = {}): void {
  if (options.saveEndpoint) setMotionSaveEndpoint(options.saveEndpoint);
  const id = options.addonId ?? ADDON_ID;
  addons.register(id, () => {
    addons.add(`${id}/panel`, {
      type: types.PANEL,
      title: options.title ?? 'Motion',
      match: ({ viewMode }) => viewMode === 'story',
      render: ({ active }) => <MotionPanel active={!!active} />,
    });
  });
}
