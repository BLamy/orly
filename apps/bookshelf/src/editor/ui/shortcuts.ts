/**
 * Film editor: the command set and its Vegas keymap.
 *
 *   const cmds: Commands = { playStop: () => …, split: () => …, … }   // built by Editor.tsx
 *   useShortcuts(cmds, { enabled: !dialogOpen })                        // one window keydown listener
 *   keyLabel('split') -> 'S'                                            // menu / tooltip hints
 *   SHORTCUTS                                                           // the table (Help ▸ Keyboard shortcuts)
 *
 * Scoping: while focus is in a text input, textarea, select or contenteditable, only the `global`
 * bindings (save, new text, render) fire, so typing a label never splits an event. Undo/redo in a field first
 * blur it (committing and sealing the field's edit) and then undo it: the editor's fields are controlled, so they
 * have no native undo history of their own. Bare keys (S, M, Q …) never fire with a modifier held; mod-bindings
 * accept Ctrl or ⌘. Editor.tsx disables the map while a modal dialog is open (dialogs handle their own Esc/Enter);
 * under the non-modal Pan/Crop window only the transport stays live (`only`).
 * Key repeat is honoured only for bindings marked `repeat` (frame step, shuttle, zoom).
 */
import { useEffect, useRef } from 'react';

export type CommandId =
  | 'playStop'
  | 'playPause'
  | 'shuttleReverse'
  | 'shuttlePause'
  | 'shuttleForward'
  | 'frameBack'
  | 'frameForward'
  | 'prevEdit'
  | 'nextEdit'
  | 'gotoStart'
  | 'gotoEnd'
  | 'split'
  | 'delete'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'undo'
  | 'redo'
  | 'selectAll'
  | 'deselect'
  | 'marker'
  | 'region'
  | 'toggleLoop'
  | 'loopIn'
  | 'loopOut'
  | 'toggleSnap'
  | 'cycleRipple'
  | 'save'
  | 'newText'
  | 'panCrop'
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomFit'
  | 'render'
  | 'gotoMarker'
  | 'cycleTool'
  | 'pasteInsert'
  | 'trimStartToCursor'
  | 'trimEndToCursor'
  | 'trackVolumeEnvelope'
  | 'trackPanEnvelope'
  | 'toggleGroups';

/** a command; keyboard-bound commands get the KeyboardEvent (gotoMarker reads its digit) */
export type Commands = Record<CommandId, (e?: KeyboardEvent) => void>;

/** the transport commands (they stay live while the non-modal Pan/Crop window is open) */
export const TRANSPORT: readonly CommandId[] = ['playStop', 'playPause', 'shuttleReverse', 'shuttlePause', 'shuttleForward', 'frameBack', 'frameForward', 'prevEdit', 'nextEdit', 'gotoStart', 'gotoEnd', 'gotoMarker', 'toggleLoop'];

export interface Shortcut {
  id: CommandId;
  /** human label of the key chord, as shown in menus ('Ctrl+Shift+N') */
  keys: string;
  /** what it does (help table) */
  label: string;
  /** fires even while typing in a field */
  global?: boolean;
  /** honour key auto-repeat */
  repeat?: boolean;
  /** inside a text field: blur it, then run (undo / redo of the field's own edit) */
  blurField?: boolean;
  match(e: KeyboardEvent): boolean;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl';

/** Ctrl on Windows/Linux, Ctrl or ⌘ on macOS */
const mod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
/** a bare key: no Ctrl/⌘/Alt (Shift allowed only where the binding says so) */
const bare = (e: KeyboardEvent, shift = false) => !e.ctrlKey && !e.metaKey && !e.altKey && e.shiftKey === shift;
const key = (e: KeyboardEvent, k: string) => e.key.toLowerCase() === k;

export const SHORTCUTS: Shortcut[] = [
  { id: 'playStop', keys: 'Space', label: 'Play / stop (stop returns to where play started)', match: (e) => e.code === 'Space' && bare(e) },
  { id: 'playPause', keys: 'Enter', label: 'Play / pause (pause leaves the cursor)', match: (e) => e.key === 'Enter' && bare(e) },
  { id: 'shuttleReverse', keys: 'J', label: 'Shuttle reverse (repeat for 2×, 4×)', match: (e) => key(e, 'j') && bare(e) },
  { id: 'shuttlePause', keys: 'K', label: 'Shuttle pause', match: (e) => key(e, 'k') && bare(e) },
  { id: 'shuttleForward', keys: 'L', label: 'Shuttle forward (repeat for 2×, 4×)', match: (e) => key(e, 'l') && bare(e) },
  { id: 'frameBack', keys: '←', label: 'Previous frame', repeat: true, match: (e) => e.key === 'ArrowLeft' && bare(e) },
  { id: 'frameForward', keys: '→', label: 'Next frame', repeat: true, match: (e) => e.key === 'ArrowRight' && bare(e) },
  { id: 'prevEdit', keys: `${MOD}+←`, label: 'Previous edit point', repeat: true, match: (e) => e.key === 'ArrowLeft' && mod(e) && !e.shiftKey && !e.altKey },
  { id: 'nextEdit', keys: `${MOD}+→`, label: 'Next edit point', repeat: true, match: (e) => e.key === 'ArrowRight' && mod(e) && !e.shiftKey && !e.altKey },
  { id: 'gotoStart', keys: 'Home', label: 'Go to start', match: (e) => e.key === 'Home' && !e.altKey },
  { id: 'gotoEnd', keys: 'End', label: 'Go to end', match: (e) => e.key === 'End' && !e.altKey },
  { id: 'split', keys: 'S', label: 'Split at the cursor', match: (e) => key(e, 's') && bare(e) },
  { id: 'delete', keys: 'Delete', label: 'Delete the selection', match: (e) => (e.key === 'Delete' || e.key === 'Backspace') && bare(e) },
  { id: 'cut', keys: `${MOD}+X`, label: 'Cut', match: (e) => key(e, 'x') && mod(e) && !e.shiftKey },
  { id: 'copy', keys: `${MOD}+C`, label: 'Copy', match: (e) => key(e, 'c') && mod(e) && !e.shiftKey },
  { id: 'paste', keys: `${MOD}+V`, label: 'Paste at the cursor', match: (e) => key(e, 'v') && mod(e) && !e.shiftKey },
  { id: 'pasteInsert', keys: `${MOD}+Shift+V`, label: 'Paste insert (ripples later material right)', match: (e) => key(e, 'v') && mod(e) && e.shiftKey },
  { id: 'undo', keys: `${MOD}+Z`, label: 'Undo', repeat: true, global: true, blurField: true, match: (e) => key(e, 'z') && mod(e) && !e.shiftKey },
  { id: 'redo', keys: `${MOD}+Shift+Z / ${MOD}+Y`, label: 'Redo', repeat: true, global: true, blurField: true, match: (e) => mod(e) && ((key(e, 'z') && e.shiftKey) || (key(e, 'y') && !e.shiftKey)) },
  { id: 'selectAll', keys: `${MOD}+A`, label: 'Select all events', match: (e) => key(e, 'a') && mod(e) && !e.shiftKey },
  { id: 'deselect', keys: 'Esc', label: 'Clear the selection', match: (e) => e.key === 'Escape' && bare(e) },
  { id: 'marker', keys: 'M', label: 'Insert a marker at the cursor', match: (e) => key(e, 'm') && bare(e) },
  { id: 'region', keys: 'R', label: 'Insert a region from the loop bar', match: (e) => key(e, 'r') && bare(e) },
  { id: 'toggleLoop', keys: 'Q', label: 'Toggle looping', match: (e) => key(e, 'q') && bare(e) },
  { id: 'loopIn', keys: 'I', label: 'Loop in at the cursor', match: (e) => key(e, 'i') && bare(e) },
  { id: 'loopOut', keys: 'O', label: 'Loop out at the cursor', match: (e) => key(e, 'o') && bare(e) },
  { id: 'toggleSnap', keys: 'F8', label: 'Toggle snapping (also F)', match: (e) => (e.key === 'F8' || key(e, 'f')) && bare(e) },
  { id: 'gotoMarker', keys: '0–9', label: 'Go to marker 1–9 (0: marker 10)', match: (e) => /^Digit\d$/.test(e.code) && bare(e) },
  { id: 'cycleTool', keys: 'D', label: 'Cycle edit tools (normal / envelope / selection)', match: (e) => key(e, 'd') && bare(e) },
  { id: 'trimStartToCursor', keys: 'Alt+[', label: 'Trim the selection’s start to the cursor', match: (e) => e.code === 'BracketLeft' && e.altKey && !mod(e) && !e.shiftKey },
  { id: 'trimEndToCursor', keys: 'Alt+]', label: 'Trim the selection’s end to the cursor', match: (e) => e.code === 'BracketRight' && e.altKey && !mod(e) && !e.shiftKey },
  { id: 'trackVolumeEnvelope', keys: 'V', label: 'Insert / remove the focused track’s volume (video: composite level) envelope', match: (e) => key(e, 'v') && bare(e) },
  { id: 'trackPanEnvelope', keys: 'P', label: 'Insert / remove the focused audio track’s pan envelope', match: (e) => key(e, 'p') && bare(e) },
  { id: 'toggleGroups', keys: `${MOD}+Shift+U`, label: 'Ignore event grouping', match: (e) => key(e, 'u') && mod(e) && e.shiftKey },
  { id: 'cycleRipple', keys: `${MOD}+L`, label: 'Cycle ripple mode (off / affected tracks / all tracks)', match: (e) => key(e, 'l') && mod(e) && !e.shiftKey },
  { id: 'save', keys: `${MOD}+S`, label: 'Save the project', global: true, match: (e) => key(e, 's') && mod(e) && !e.shiftKey },
  { id: 'newText', keys: `${MOD}+Shift+N`, label: 'New text event at the cursor', global: true, match: (e) => key(e, 'n') && mod(e) && e.shiftKey },
  { id: 'panCrop', keys: `${MOD}+D`, label: 'Event Pan/Crop', match: (e) => key(e, 'd') && mod(e) && !e.shiftKey },
  { id: 'zoomIn', keys: '+', label: 'Zoom in (around the cursor)', repeat: true, match: (e) => (e.key === '+' || e.key === '=') && !mod(e) && !e.altKey },
  { id: 'zoomOut', keys: '−', label: 'Zoom out (around the cursor)', repeat: true, match: (e) => (e.key === '-' || e.key === '_') && !mod(e) && !e.altKey },
  { id: 'zoomFit', keys: `${MOD}+Shift+F`, label: 'Zoom to fit the project', match: (e) => key(e, 'f') && mod(e) && e.shiftKey },
  { id: 'render', keys: `${MOD}+Shift+R`, label: 'Render As…', global: true, match: (e) => key(e, 'r') && mod(e) && e.shiftKey },
];

const BY_ID = new Map(SHORTCUTS.map((s) => [s.id, s]));

/** the key chord label for a command ('' if it has no binding) */
export function keyLabel(id: CommandId): string {
  return BY_ID.get(id)?.keys ?? '';
}

/** true when keystrokes belong to a text field rather than to the editor */
export function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable) return true;
  if (t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) return true;
  if (t instanceof HTMLInputElement) {
    // checkboxes, radios, ranges and buttons don't take text: the editor keeps its keys there
    return !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'color', 'file'].includes(t.type);
  }
  return false;
}

/**
 * Bind the keymap to window. `cmds` may change identity every render; the listener reads the latest
 * through a ref, so it is attached once. Space/Enter on a focused <button> are left to the button
 * (keyboard activation) — except Space, which stays the transport (Vegas muscle memory) unless the
 * focused element is a text field.
 */
export function useShortcuts(cmds: Commands, opts?: { enabled?: boolean; only?: readonly CommandId[] | null }): void {
  const ref = useRef(cmds);
  ref.current = cmds;
  const enabled = opts?.enabled ?? true;
  const only = opts?.only ?? null;
  useEffect(() => {
    if (!enabled) return;
    const allowed = only ? new Set(only) : null;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const typing = isTypingTarget(e.target);
      const onButton = e.target instanceof HTMLButtonElement || (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'menuitem');
      for (const s of SHORTCUTS) {
        if (!s.match(e)) continue;
        if (allowed && !allowed.has(s.id)) return;
        if (typing && !s.global) return;
        if (typing && s.blurField) (e.target as HTMLElement).blur(); // commit + seal the field's edit, then undo it
        if (onButton && e.key === 'Enter') return; // let Enter activate the focused control
        if (e.repeat && !s.repeat) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        if (onButton && e.code === 'Space') (e.target as HTMLElement).blur(); // don't also "click" the button on keyup
        ref.current[s.id](e);
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, only]);
}
