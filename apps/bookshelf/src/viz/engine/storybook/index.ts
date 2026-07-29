// The Storybook Motion addon: a Figma-style timeline editor panel wired to
// the story's live Timeline over Storybook's channel. Three pieces:
//   preview  — wrap stories in <MotionBridge> (a global decorator)
//   manager  — call registerMotionAddon() from a manager entry
//   dev server — add motionSaveEndpointPlugin() so "save to source" works
// This entry is the ONLY one that imports 'storybook/*'.
export { TimelineEditor } from './TimelineEditor';
export type { TimelineEditorDoc } from './TimelineEditor';
export { MotionBridge } from './bridge';
export { EVT_DOC, EVT_TIME, EVT_OP, DEFAULT_SAVE_ENDPOINT } from './protocol';
export type { MotionDoc, MotionTime, MotionOp } from './protocol';
export {
  MotionPanel,
  registerMotionAddon,
  setMotionSaveEndpoint,
  getMotionSaveEndpoint,
} from './manager';
export type { RegisterMotionAddonOptions } from './manager';
export { motionSaveEndpointPlugin } from './save-endpoint';
export type { MotionSaveEndpointOptions } from './save-endpoint';
