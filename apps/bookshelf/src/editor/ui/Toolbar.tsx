/**
 * Toolbar: the Vegas main toolbar — save, undo/redo (with the step's name), clipboard and split, then the timeline
 * modes (snapping, auto-ripple, auto-crossfade, Ignore Event Grouping, edit tool, envelopes) and Render As.
 *
 *   <Toolbar cmds={commands} onRender={…} onHelp={…} canSave />
 *
 * Toggle state is read from the store with primitive selectors; every button runs the same command as its menu
 * item and shortcut, and its tooltip names the shortcut.
 */
import type { ReactNode } from 'react';
import { editor, useEditor, type ToolMode } from '../state/store';
import { keyLabel, type CommandId, type Commands } from './shortcuts';

/** 16×16 stroke icons */
const P: Record<string, string> = {
  save: 'M3 2.5h8l2.5 2.5v8.5h-10.5zM5 2.5v4h5v-4M5 13.5v-4h6v4',
  undo: 'M5.5 4L2.5 7l3 3M2.5 7h7a4 4 0 0 1 0 8H7',
  redo: 'M10.5 4l3 3-3 3M13.5 7h-7a4 4 0 0 0 0 8H9',
  cut: 'M5 11.5a2 2 0 1 1-1 3.7M11 11.5a2 2 0 1 0 1 3.7M5.6 12L12 2M10.4 12L4 2',
  copy: 'M5.5 5.5h8v8h-8zM2.5 10.5v-8h8',
  paste: 'M5 3H3v11h10V3h-2M5.5 1.5h5v3h-5z',
  delete: 'M3 4.5h10M6 4.5V2.5h4v2M4.5 4.5l.7 9h5.6l.7-9',
  split: 'M8 1.5v13M3 5h3.5v6H3M13 5H9.5v6H13',
  snap: 'M4 2.5v6a4 4 0 0 0 8 0v-6M4 5.5h3M9 5.5h3',
  xfade: 'M2 13L14 3M2 3l12 10',
  group: 'M2.5 3.5h5v4h-5zM8.5 8.5h5v4h-5zM5 7.5v3.5h3.5',
  normal: 'M4 2l8 7-3.5.5L10.5 14 9 14.5 7 10l-3 2.5z',
  envelope: 'M1.5 11l4-5 3 3 3-5 3 2',
  select: 'M2.5 2.5h11v11h-11z',
  env: 'M1.5 12h3l3-8 3 8h4',
  render: 'M2 3.5h12v9H2zM6.5 6v4l3.5-2z',
  help: 'M6 6a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.6M8 11.5v.5',
};
function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[name]} />
    </svg>
  );
}

function Btn(props: { icon: string; label: string; onClick: () => void; cmd?: CommandId; on?: boolean; disabled?: boolean; children?: ReactNode; primary?: boolean }) {
  const k = props.cmd ? keyLabel(props.cmd) : '';
  return (
    <button
      className={`fe-icon-btn${props.on ? ' is-on' : ''}${props.primary ? ' is-primary' : ''}`}
      onClick={props.onClick}
      disabled={props.disabled}
      title={k ? `${props.label} (${k})` : props.label}
      aria-label={props.label}
      aria-pressed={props.on}
    >
      <Icon name={props.icon} />
      {props.children}
    </button>
  );
}

const TOOLS: { id: ToolMode; icon: string; label: string }[] = [
  { id: 'normal', icon: 'normal', label: 'Normal edit tool' },
  { id: 'envelope', icon: 'envelope', label: 'Envelope edit tool' },
  { id: 'select', icon: 'select', label: 'Selection (marquee) tool' },
];

export default function Toolbar({ cmds, onRender, onHelp, canSave }: { cmds: Commands; onRender: () => void; onHelp: () => void; canSave: boolean }) {
  const dirty = useEditor((s) => s.dirty);
  const canUndo = useEditor((s) => s.canUndo);
  const canRedo = useEditor((s) => s.canRedo);
  const undoLabel = useEditor((s) => s.undoLabel);
  const redoLabel = useEditor((s) => s.redoLabel);
  const hasSel = useEditor((s) => s.ui.selection.length > 0);
  const snapping = useEditor((s) => s.ui.snapping);
  const ripple = useEditor((s) => s.ui.ripple);
  const autoX = useEditor((s) => s.ui.autoCrossfade);
  const tool = useEditor((s) => s.ui.tool);
  const envelopes = useEditor((s) => s.ui.showEnvelopes);
  const ignoreGroups = useEditor((s) => !!s.ui.ignoreGroups);

  return (
    <div className="fe-toolbar" role="toolbar" aria-label="Main toolbar">
      <Btn icon="save" label={canSave ? (dirty ? 'Save (unsaved changes)' : 'Save') : 'Save (needs the dev server)'} cmd="save" onClick={cmds.save} disabled={!canSave} on={dirty && canSave} />
      <span className="fe-tb-sep" />
      <Btn icon="undo" label={undoLabel ? `Undo ${undoLabel}` : 'Undo'} cmd="undo" onClick={cmds.undo} disabled={!canUndo} />
      <Btn icon="redo" label={redoLabel ? `Redo ${redoLabel}` : 'Redo'} cmd="redo" onClick={cmds.redo} disabled={!canRedo} />
      <span className="fe-tb-sep" />
      <Btn icon="cut" label="Cut" cmd="cut" onClick={cmds.cut} disabled={!hasSel} />
      <Btn icon="copy" label="Copy" cmd="copy" onClick={cmds.copy} disabled={!hasSel} />
      <Btn icon="paste" label="Paste at the cursor" cmd="paste" onClick={cmds.paste} />
      <Btn icon="delete" label="Delete" cmd="delete" onClick={cmds.delete} disabled={!hasSel} />
      <Btn icon="split" label="Split at the cursor" cmd="split" onClick={cmds.split} />
      <span className="fe-tb-sep" />
      <Btn icon="snap" label={`Snapping ${snapping ? 'on' : 'off'}`} cmd="toggleSnap" onClick={cmds.toggleSnap} on={snapping} />
      <label className="fe-dim" htmlFor="fe-ripple" style={{ padding: '0 4px 0 6px' }} title={`Auto ripple (${keyLabel('cycleRipple')} cycles)`}>
        Ripple
      </label>
      <select
        id="fe-ripple"
        className="fe-select"
        style={{ width: 'auto', height: 22, borderColor: ripple !== 'off' ? '#6b5530' : undefined, color: ripple !== 'off' ? 'var(--fe-accent)' : undefined }}
        value={ripple}
        onChange={(e) => {
          editor.set({ ripple: e.target.value as typeof ripple, status: `Ripple: ${e.target.value}` });
          e.currentTarget.blur(); // hand the keyboard back to the editor
        }}
      >
        <option value="off">Off</option>
        <option value="tracks">Affected tracks</option>
        <option value="all">All tracks</option>
      </select>
      <Btn icon="xfade" label={`Automatic crossfades ${autoX ? 'on' : 'off'}`} onClick={() => editor.set({ autoCrossfade: !autoX })} on={autoX} />
      <Btn icon="group" label={ignoreGroups ? 'Ignoring event grouping (shots and their narration move separately)' : 'Ignore event grouping'} cmd="toggleGroups" onClick={cmds.toggleGroups} on={ignoreGroups} />
      <span className="fe-tb-sep" />
      {TOOLS.map((t) => (
        <Btn key={t.id} icon={t.icon} label={t.label} onClick={() => editor.set({ tool: t.id })} on={tool === t.id} />
      ))}
      <Btn icon="env" label={`${envelopes ? 'Hide' : 'Show'} envelopes`} onClick={() => editor.set({ showEnvelopes: !envelopes })} on={envelopes} />
      <span style={{ flex: 1 }} />
      <Btn icon="render" label="Render As…" cmd="render" onClick={onRender} disabled={!canSave} primary>
        Render
      </Btn>
      <Btn icon="help" label="Keyboard shortcuts" onClick={onHelp} />
    </div>
  );
}
