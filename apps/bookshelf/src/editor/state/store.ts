/**
 * Editor store: one external store (useSyncExternalStore) holding the project, undo history and UI state.
 *
 *   const s = useEditor(sel)                 // subscribe to a slice
 *   editor.apply('Split', p => split(p, …))  // project edit: pushes undo, marks dirty, notifies
 *   editor.set({ cursor: 12.5 })             // UI-only state (no undo)
 *   editor.undo() / editor.redo()
 *
 * Project edits are pure functions Project -> Project (editor/model/ops.ts). Consecutive edits with the same
 * `coalesce` key merge into one undo step until the GESTURE ends (dragging a slider, typing in a field): the shell
 * calls `editor.seal()` on pointerup and focusout, so one drag is one step however long it pauses, and two drags
 * are two steps however quickly they follow each other. Undo, redo and load seal too.
 */
import { useSyncExternalStore } from 'react';
import type { Project } from '../model/types';

export type ToolMode = 'normal' | 'envelope' | 'select';

export interface EditorUi {
  /** timeline cursor (s) */
  cursor: number;
  playing: boolean;
  /** loop region (Vegas loop bar) and whether looping is on */
  loop: { start: number; end: number } | null;
  looping: boolean;
  /** selected event ids */
  selection: string[];
  /** selected track id (focus) */
  track: string | null;
  /** timeline zoom: pixels per second, and horizontal scroll (s at the left edge) */
  pxPerSec: number;
  scrollT: number;
  snapping: boolean;
  /** Vegas auto-ripple: off, affected tracks, or all tracks */
  ripple: 'off' | 'tracks' | 'all';
  autoCrossfade: boolean;
  tool: ToolMode;
  /** preview quality: output scale factor (0.25 draft .. 1 best) */
  previewScale: number;
  /** which envelopes are visible */
  showEnvelopes: boolean;
  /** last status message for the status bar */
  status: string;
  /** (timeline) the preview shows this time instead of the cursor while a trim or slip drag is live */
  previewT?: number | null;
  /** (shell) Vegas "Ignore Event Grouping": clicks, drags and deletes act on single events */
  ignoreGroups?: boolean;
  /** (timeline) Vegas default "mouse wheel zooms": plain wheel zooms, Ctrl/⌘+wheel scrolls */
  wheelZoom?: boolean;
}

export interface EditorState {
  project: Project | null;
  ui: EditorUi;
  dirty: boolean;
  savedAt: string | null;
  canUndo: boolean;
  canRedo: boolean;
  undoLabel: string | null;
  redoLabel: string | null;
}

const DEFAULT_UI: EditorUi = {
  cursor: 0,
  playing: false,
  loop: null,
  looping: false,
  selection: [],
  track: null,
  pxPerSec: 40,
  scrollT: 0,
  snapping: true,
  ripple: 'off',
  autoCrossfade: true,
  tool: 'normal',
  previewScale: 0.5,
  showEnvelopes: true,
  status: '',
  previewT: null,
  ignoreGroups: false,
  wheelZoom: false,
};

const MAX_UNDO = 300;

interface Step {
  label: string;
  before: Project;
  after: Project;
  coalesce?: string;
  /** still accepting same-key edits (the gesture that made it has not ended) */
  open: boolean;
}

function createStore() {
  let state: EditorState = {
    project: null,
    ui: DEFAULT_UI,
    dirty: false,
    savedAt: null,
    canUndo: false,
    canRedo: false,
    undoLabel: null,
    redoLabel: null,
  };
  const undo: Step[] = [];
  const redo: Step[] = [];
  const subs = new Set<() => void>();

  const emit = () => {
    state = {
      ...state,
      canUndo: undo.length > 0,
      canRedo: redo.length > 0,
      undoLabel: undo.at(-1)?.label ?? null,
      redoLabel: redo.at(-1)?.label ?? null,
    };
    subs.forEach((f) => f());
  };

  return {
    getState: () => state,
    subscribe(f: () => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
    /** load a project (clears history) */
    load(p: Project, savedAt: string | null = null, opts: { dirty?: boolean } = {}) {
      undo.length = 0;
      redo.length = 0;
      state = { ...state, project: p, dirty: !!opts.dirty, savedAt, ui: { ...state.ui, selection: [], cursor: 0, previewT: null } };
      emit();
    },
    /** apply a project edit with undo */
    apply(label: string, fn: (p: Project) => Project, opts?: { coalesce?: string }) {
      const before = state.project;
      if (!before) return;
      const after = fn(before);
      if (after === before) return;
      const last = undo.at(-1);
      if (opts?.coalesce && last && last.open && last.coalesce === opts.coalesce) {
        last.after = after;
      } else {
        if (last) last.open = false;
        undo.push({ label, before, after, coalesce: opts?.coalesce, open: !!opts?.coalesce });
        if (undo.length > MAX_UNDO) undo.shift();
      }
      redo.length = 0;
      state = { ...state, project: { ...after, updatedAt: new Date().toISOString() }, dirty: true, ui: { ...state.ui, status: label } };
      emit();
    },
    /** end the current gesture: the next edit starts a new undo step even with the same coalesce key */
    seal() {
      const last = undo.at(-1);
      if (last) last.open = false;
    },
    undo() {
      const s = undo.pop();
      if (!s) return;
      s.open = false;
      redo.push(s);
      state = { ...state, project: s.before, dirty: true, ui: { ...state.ui, status: `Undo ${s.label}` } };
      emit();
    },
    redo() {
      const s = redo.pop();
      if (!s) return;
      const last = undo.at(-1);
      if (last) last.open = false;
      undo.push(s);
      state = { ...state, project: s.after, dirty: true, ui: { ...state.ui, status: `Redo ${s.label}` } };
      emit();
    },
    /** UI-only state (no undo) */
    set(patch: Partial<EditorUi>) {
      state = { ...state, ui: { ...state.ui, ...patch } };
      emit();
    },
    markSaved(at: string) {
      state = { ...state, dirty: false, savedAt: at };
      emit();
    },
  };
}

export const editor = createStore();
export type EditorStore = typeof editor;

export function useEditor<T>(sel: (s: EditorState) => T): T {
  return useSyncExternalStore(editor.subscribe, () => sel(editor.getState()));
}
