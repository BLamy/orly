// Sources: pinned charter scope, browser-action invariants 6–8, E8 milestone.
// Synthetic chunks become compact examples; source groups stay together when
// the same cards fan into distinct selection, calibration and final-test bins.
import { interpolateNumber } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, on, lerp } from './shared/kit';
const CAPTIONS = [
  "For a first local experiment, we can keep recordings and examples on the user's machine. The extension and a native training process can exchange versioned files.",
  "The extension might use a browser database, while a native workflow might use a local database with compressed recording chunks. The choice follows the working prototype.",
  "Raw recordings and training examples serve different purposes. We can retain raw data for a bounded period and keep compact, reproducible examples separately.",
  "Each example needs a trail back to its source and the extraction rules. Deleting or correcting a source should tell us which derived artifacts need rebuilding.",
  "Only eligible data belongs in the workshop. Unnecessary private inputs should be masked, and sending examples to a remote teacher must be an explicit choice.",
  "Before training, group related sessions and duplicates so that near-identical behavior cannot appear on both sides of the evaluation boundary.",
  "Keep development and calibration data separate from a sealed final test set. Later sessions and unfamiliar sites help reveal whether the model learned more than memorized layouts.",
  "The value of a large recording collection comes from usable, representative examples. A mountain of unfiltered events is still a mountain of work."
] as const;
const groups = [0,0,1,1,2,3];
const bins = [ { name:'TRAIN',color:C.model }, { name:'DEVELOP',color:C.observation }, { name:'CALIBRATE',color:C.pending }, { name:'SEALED TEST',color:C.good } ];
export function buildScene() { return chapter(CAPTIONS); }
const scene = buildScene();
export function Render({ s }: { s: SceneState }) {
  const p=s.get(scene.phase), compact=on(p,2), lineage=on(p,3), eligible=on(p,4), group=on(p,5), split=on(p,6), end=on(p,7);
  return <><Header title='A local workshop for examples'/><Camera {...s.get(scene.cam)}>
    <Panel x={60} y={115} w={1150} h={100} title='Local storage · design choice follows the working prototype'>
      <Label x={80} y={178} size={17}>bounded raw chunks</Label><Label x={488} y={178} size={17} color={C.model}>versioned derived examples</Label><Label x={922} y={178} size={16} color={C.pending}>{eligible>.5?'✓ eligible · masked':'allowed-use manifest'}</Label>
    </Panel>
    {Array.from({length:6},(_,i)=>{
      const startX=94+i*179, compactX=112+i*174;
      const b=groups[i], targetX=107+b*290+(i%2)*75, targetY=400+(i%2)*58;
      const cx=interpolateNumber(lerp(startX,compactX,compact),targetX)(split), cy=lerp(265,targetY,split);
      const width=lerp(154,64,split), height=lerp(104,44,split);
      return <g key={i} transform={`translate(${cx},${cy})`}>
        {lineage>.01&&<path d={`M${width/2},0 Q${width/2},-28 ${width/2},${-48+split*50}`} stroke={C.muted} fill='none' opacity={lineage*(1-split)}/>}
        <rect width={width} height={height} rx={8} fill='#101a2e' stroke={group>.5?bins[b].color:C.observation} strokeWidth={group>.5?2.5:1}/>
        <Label x={width/2} y={26} anchor='middle' size={13} color={group>.5?bins[b].color:C.observation}>{split>.5?`S${b+1}`:`source S${b+1}`}</Label>
        <g opacity={1-split}><Label x={12} y={54} size={12}>{compact>.5?'state → action':'snapshot + events'}</Label><Label x={12} y={78} size={11} color={C.muted}>{compact>.5?'extractor v1':'compressed chunk'}</Label></g>
      </g>;
    })}
    {bins.map((b,i)=><g key={b.name} opacity={split}><rect x={70+i*290} y={377} width={267} height={156} rx={12} fill={b.color} fillOpacity={.035} stroke={b.color} strokeDasharray={i===3?'7 5':undefined}/><Label x={203+i*290} y={517} anchor='middle' color={b.color} size={14}>{b.name}{i===3?' · locked':''}</Label></g>)}
    <g opacity={group*(1-split)}><Label x={640} y={411} anchor='middle' color={C.pending} size={17}>Related sessions and duplicates travel together</Label></g>
    <g opacity={lineage*(1-split)}><Chip x={353} y={435} w={570} text='Source correction → rebuild affected examples and artifacts' color={C.good}/></g>
    <Label x={640} y={563} anchor='middle' size={15} color={C.muted}>{end>.5?'Later sessions and unfamiliar sites test generalization':'Local storage and remote teacher use are separate choices'}</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
