// ---------------------------------------------------------------------------
// Story spec
//
// This is the declarative format the engine renders. A whole slideshow is just
// a `Story` object: a fixed set of nodes/edges (the system) plus an ordered
// list of `Step`s (the narration). Each step describes the *state* of the
// diagram at that point — what's highlighted, what badges show, and which
// message packets animate.
//
// Phase 2 ("point at a repo → generate a slideshow") only has to produce one of
// these objects. The engine never changes.
// ---------------------------------------------------------------------------

export type NodeKind =
  | 'client'
  | 'loadbalancer'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'worker'
  | 'external'
  | 'vault'
  | 'key'
  | 'proxy'
  | 'record';

export interface DiagramNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** position in a 0–100 coordinate space (percent of the stage, top-left origin) */
  x: number;
  y: number;
  sublabel?: string;
  /** Optional icon: an image URL / data-URI / path, OR inline `<svg>…</svg>`
   *  markup. Rendered inside the node. */
  icon?: string;
  /** 'replace' (default) swaps the kind glyph for the icon; 'augment' keeps the
   *  glyph and adds the icon as a small corner emblem. */
  iconMode?: 'replace' | 'augment';
}

export interface DiagramEdge {
  id: string;
  from: string; // node id
  to: string; // node id
  label?: string;
  /** dashed line — good for async / background / optional paths */
  dashed?: boolean;
}

export type MessageKind = 'request' | 'response' | 'data' | 'event';

/** A packet that animates from one node to another while a step is on screen. */
export interface Message {
  from: string; // node id
  to: string; // node id
  label?: string;
  kind?: MessageKind; // controls the packet color; default 'request'
  /** ms to wait before this packet departs — use to chain hops within a step */
  delay?: number;
  /** ms the packet takes to travel; default 950 */
  duration?: number;
  /** Optional icon the packet carries along the arrow (URL/data-URI/path or
   *  inline `<svg>`) instead of the plain dot — e.g. a key for an auth token. */
  icon?: string;
}

export interface Badge {
  node: string; // node id
  text: string;
  tone?: 'ok' | 'warn' | 'info';
}

export interface Step {
  id: string;
  /** section label shown as the eyebrow above the title */
  chapter?: string;
  title?: string;
  /** narration in the bottom panel; supports **bold**, *italic*, and `code` */
  narration: string;
  /** optional plain-text script to *speak* instead of the title + narration —
   *  use it to avoid reading code/symbols literally. When omitted, the narration
   *  is auto-smoothed for speech (see speechify in engine/speech.ts). */
  say?: string;

  /** Title-slide step: shows a big centered headline in the stage instead of a diagram. */
  cover?: boolean;
  /** subtitle shown under the headline on a cover step */
  coverSubtitle?: string;

  /** Node ids that *appear* at this step. Reveals are cumulative across steps,
   *  so the diagram builds up progressively. Edges appear once both ends exist. */
  reveal?: string[];
  /** Node ids to remove at this step (rare; also cumulative). */
  hide?: string[];

  /** node ids to emphasize; every other *visible* node is dimmed. Omit for no focus. */
  highlight?: string[];
  /** edge ids to emphasize (edges carrying a message light up automatically too) */
  activeEdges?: string[];
  badges?: Badge[];
  messages?: Message[];
  /** override the autoplay dwell time for this step (ms) */
  autoAdvanceMs?: number;
  /** For audio-synced chapters: when this step should appear — a phrase to find
   *  in the chapter's narration transcript, or an absolute time in seconds. */
  cue?: string | number;

  /** Render a prebuilt 3b1b-style animated scene (a slug from
   *  `src/viz/scenes.ts` / `generator/viz-catalog.json`) INSTEAD of the D3
   *  diagram while this step is active. The scene's timeline is time-scaled
   *  onto the step's window (its audio cue window, or the dwell time when
   *  muted); the scene's own captions are suppressed — the narration panel
   *  owns the words. */
  viz?: { scene: string };
}

export interface Story {
  title: string;
  subtitle?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: Step[];
}
