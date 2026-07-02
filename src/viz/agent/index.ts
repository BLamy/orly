// Agent-harness animation primitives — the visual vocabulary for the
// "build your own AI agent harness" series (tau as the educational
// framework; the code layer is the plain Anthropic TypeScript SDK).
export { MessageCard, ROLE_COLOR, wrapMessage, messageCardHeight } from './message';
export type { MessageRole } from './message';
export { TokenStream } from './token-stream';
export { ToolCard, toolCardHeight } from './tool-card';
export type { ToolSchemaRow } from './tool-card';
export { EventLane, EVENT_COLOR } from './event-lane';
export type { EventKind, LaneEvent } from './event-lane';
export { ContextBar } from './context-bar';
export type { ContextSegment } from './context-bar';
export { LoopRing } from './loop-ring';
// Replay verification — the adversarial worker/critic loop (Replay.io):
// a satisfied worker is a claim; the critic interrogates the recording.
export { RecordingStrip, POINT_COLOR } from './recording-strip';
export type { RecordingPoint, RecordingPointKind, RecordingLink } from './recording-strip';
export { LayerStack, layerStackHeight } from './layer-stack';
export type { LayerRow, LayerConnector } from './layer-stack';
export { PredictionCard, predictionCardHeight } from './prediction-card';
export { DiffLanes, HUNK_COLOR, diffLanesHeight } from './diff-lanes';
export type { DiffHunk, HunkClass } from './diff-lanes';
export { GauntletRail } from './gauntlet-rail';
export type { GauntletGate } from './gauntlet-rail';
