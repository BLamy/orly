// Sources: pinned charter browser-action invariants 5–8; rrweb primary guide.
// A recording tape keeps the pre-action cutoff visible as evidence is extracted.
// The right-hand future never feeds the reconstructed page or input features.
import { scaleLinear } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { ProfilePage } from '../next-useful-action/shared/profile-page';
import { C, chapter, Header, Label, Panel, Chip, Arrow, on, lerp } from './shared/kit';
const CAPTIONS = [
  "A browser recording contains evidence of what happened. It does not automatically explain what the person wanted or whether their task succeeded.",
  "An rrweb recording can describe a page through snapshots, changes, and interaction events. Replay recordings require their own adapter to the actual available format.",
  "We should inspect those real sources before claiming what either pipeline captures. The extension linked in our initial research was not available for inspection.",
  "To make one training example, move to the instant just before an action. Reconstruct only the page state and history available at that moment.",
  "Then attach the action that followed as the label. Its later focus changes, updated styles, or success message must not sneak backward into the input.",
  "Otherwise the model can appear excellent by reading clues created by the very action it is supposed to predict. That is a misleading shortcut.",
  "When we know the task, record where that knowledge came from. When we do not, keep the goal unknown instead of inventing an intention.",
  "The result is a careful example of state, available choices, observed action, and evidence about the outcome. That is the material a learning system can use."
] as const;
const events = [ { t: 0, label: 'snapshot', kind: 'state' }, { t: 1, label: 'page change', kind: 'state' }, { t: 2, label: 'typed name', kind: 'state' }, { t: 3, label: 'click Save', kind: 'action' }, { t: 4, label: 'focus / styles', kind: 'future' }, { t: 5, label: 'saved toast', kind: 'future' } ];
const x = scaleLinear().domain([0, 5]).range([115, 1145]);
export function buildScene() { return chapter(CAPTIONS); }
const scene = buildScene();
export function Render({ s }: { s: SceneState }) {
  const p = s.get(scene.phase), cut = on(p, 3), extract = on(p, 4), label = on(p, 5), leak = on(p, 6), goal = on(p, 7);
  const cursor = lerp(x(0), x(2.65), cut);
  return <><Header title='A recording is evidence of what happened' tag='rrweb CONCEPTS · PROPOSED EXTRACTION · SYNTHETIC RECORDING'/><Camera {...s.get(scene.cam)}>
    <ProfilePage place={{x:64,y:115,scale:.69}} typeU={on(p,1)} savedU={0} obsLabel={cut>.5?'before click':'recorded state'} />
    <g opacity={on(p,1)}><Label x={66} y={443} size={14} color={C.observation}>Reconstruct the state available before the label</Label></g>
    <Panel x={525} y={115} w={685} h={165} title='Prediction input' opacity={extract}>
      <Chip x={545} y={163} w={195} text='page + past history'/><Chip x={756} y={163} w={193} text='eligible choices'/>
      <Label x={545} y={225} size={16}>Display name = Brett · Save is enabled</Label>
      <Label x={545} y={252} size={14} color={C.muted}>No saved toast, post-click focus, or later styles</Label>
    </Panel>
    <Panel x={525} y={298} w={685} h={133} title='Label and provenance' color={C.good} opacity={label}>
      <Label x={545} y={353} color={C.good}>Observed action: click Save</Label>
      <Label x={545} y={382} size={15} color={goal>.5?C.pending:C.muted}>{goal>.5?'Goal: unknown unless a reliable source supplies it':'Later outcome is evidence, not an input feature'}</Label>
      <Label x={545} y={411} size={14} color={C.muted}>recording · extraction version · outcome evidence</Label>
    </Panel>
    <g opacity={1-extract}><Label x={525} y={157} color={C.pending}>Evidence ≠ intent ≠ task success</Label><Label x={525} y={201} size={17}>rrweb: snapshots + changes + events</Label><Label x={525} y={235} size={17}>Replay: inspect a separate source adapter</Label><Label x={525} y={272} color={C.muted} size={14}>Linked extension was unavailable in initial research</Label></g>
    <line x1={85} x2={1195} y1={494} y2={494} stroke={C.muted} strokeWidth={3}/>
    {events.map((e,i)=><g key={e.label} opacity={i>2?1-.7*extract:1}><rect x={x(e.t)-13} y={480} width={26} height={28} rx={e.kind==='action'?3:13} fill={i>2?C.pending:C.observation}/><Label x={x(e.t)} y={533} anchor='middle' size={14}>{e.label}</Label></g>)}
    <g opacity={cut}><rect x={cursor} y={457} width={1195-cursor} height={58} fill={C.bad} opacity={.07}/><line x1={cursor} x2={cursor} y1={452} y2={516} stroke={C.good} strokeWidth={3}/><Label x={cursor-14} y={470} anchor='end' size={13} color={C.good}>prediction instant</Label></g>
    <Arrow x1={x(2)} y1={472} x2={525} y2={190} opacity={extract} />
    <g opacity={leak}><path d={`M${x(5)},470 Q1060,390 920,290`} fill='none' stroke={C.bad} strokeWidth={2} strokeDasharray='6 5'/><Chip x={994} y={438} w={205} text='× future cannot enter' color={C.bad}/></g>
  </Camera></>;
}
export const vizScene = () => scene;
