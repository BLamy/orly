// Sources: pinned charter scope, browser-action invariants 6–8, E8 milestone.
// Synthetic chunks become compact examples; source groups stay together when
// the same cards fan into distinct selection, calibration and final-test bins.
import { interpolateNumber } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Arrow, on, lerp } from './shared/kit';
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
// Two sessions per source share one source header; each card gets its own run letter so IDs stay unique.
const runs = ['A','B','A','B','A','A'];
const bins = [ { name:'TRAIN',color:C.model }, { name:'DEVELOP',color:C.observation }, { name:'CALIBRATE',color:C.pending }, { name:'SEALED TEST',color:C.good } ];
export function buildScene() { return chapter(CAPTIONS); }
const scene = buildScene();
// Stage grid: panel 115–215, source cards 248–378, a 418–474 band for the storage and rebuild
// explanations, bins 384–552 for the split, caption line at 590. Nothing sits below y 600.
const CARD_W=170, cardX=(i:number)=>65+i*190;
function Box({ x, y, w, title, sub, color, subOpacity=1 }: { x:number; y:number; w:number; title:string; sub:string; color:string; subOpacity?:number }) {
  return <g><rect x={x} y={y} width={w} height={56} rx={10} fill='#101a2e' stroke={color}/>
    <Label x={x+w/2} y={y+24} anchor='middle' size={16} color={color}>{title}</Label>
    <g opacity={subOpacity}><Label x={x+w/2} y={y+44} anchor='middle' size={14} color={C.muted}>{sub}</Label></g></g>;
}
export function Render({ s }: { s: SceneState }) {
  const p=s.get(scene.phase), compact=on(p,2), lineage=on(p,3), eligible=on(p,4), group=on(p,5), split=on(p,6), end=on(p,7);
  const exchange=on(p,0)*(1-compact), lanes=compact*(1-lineage);
  return <><Header title='A local workshop for examples'/><Camera {...s.get(scene.cam)}>
    <Panel x={60} y={115} w={1150} h={100} title='Local storage · design choice follows the working prototype'>
      <Label x={80} y={178} size={17}>bounded raw chunks</Label><Label x={488} y={178} size={17} color={C.model}>versioned derived examples</Label><Label x={922} y={178} size={16} color={C.pending}>{eligible>.5?'✓ eligible · masked':'allowed-use manifest'}</Label>
    </Panel>
    <g opacity={exchange}>
      <Box x={170} y={418} w={330} title='Browser extension' sub='may use a browser database' color={C.observation} subOpacity={on(p,1)}/>
      <Box x={780} y={418} w={330} title='Native training process' sub='local database · compressed chunks' color={C.model} subOpacity={on(p,1)}/>
      <Label x={640} y={432} anchor='middle' size={14} color={C.muted}>versioned files</Label>
      <Arrow x1={512} y1={448} x2={768} y2={448} color={C.muted}/>
      <Arrow x1={768} y1={466} x2={512} y2={466} color={C.muted}/>
    </g>
    <g opacity={lanes}>
      <Box x={170} y={418} w={330} title='Raw recordings' sub='kept for a bounded period' color={C.observation}/>
      <Box x={780} y={418} w={330} title='Training examples' sub='compact and reproducible' color={C.model}/>
      <Label x={640} y={450} anchor='middle' size={14} color={C.muted}>kept separately</Label>
    </g>
    {Array.from({length:6},(_,i)=>{
      const b=groups[i], targetX=70+b*290+22+(i%2)*120, targetY=420;
      const cx=interpolateNumber(cardX(i),targetX)(split), cy=lerp(248,targetY,split);
      const width=lerp(CARD_W,96,split), height=lerp(130,60,split);
      return <g key={i} transform={`translate(${cx},${cy})`}>
        {lineage>.01&&<path d={`M${width/2},0 V-26`} stroke={C.muted} fill='none' opacity={lineage*(1-split)}/>}
        <rect width={width} height={height} rx={8} fill='#101a2e' stroke={group>.5?bins[b].color:C.observation} strokeWidth={group>.5?2.5:1}/>
        <Label x={width/2} y={30} anchor='middle' size={14} color={group>.5?bins[b].color:C.observation}>{split>.5?`S${b+1}·${runs[i]}`:`source S${b+1} · run ${runs[i]}`}</Label>
        <g opacity={1-split}><Label x={14} y={76} size={14}>{compact>.5?'state → action':'snapshot + events'}</Label><Label x={14} y={102} size={14} color={C.muted}>{compact>.5?'extractor v1':'compressed chunk'}</Label></g>
      </g>;
    })}
    {[0,1,2,3].map(g=>{
      const idx=groups.flatMap((b,i)=>b===g?[i]:[]);
      const x1=cardX(idx[0]), x2=cardX(idx[idx.length-1])+CARD_W;
      return <path key={g} d={`M${x1},390 V396 H${x2} V390`} fill='none' stroke={bins[g].color} strokeWidth={2} opacity={group*(1-split)}/>;
    })}
    {bins.map((b,i)=><g key={b.name} opacity={split}><rect x={70+i*290} y={384} width={267} height={168} rx={12} fill={b.color} fillOpacity={.035} stroke={b.color} strokeDasharray={i===3?'7 5':undefined}/><Label x={203+i*290} y={536} anchor='middle' color={b.color} size={14}>{b.name}{i===3?' · locked':''}</Label></g>)}
    <g opacity={group*(1-split)}><Label x={640} y={432} anchor='middle' color={C.pending} size={17}>Related sessions and duplicates travel together</Label></g>
    <g opacity={lineage*(1-split)}><rect x={300} y={476} width={680} height={32} rx={8} fill='#0a1120' stroke={C.good}/><Label x={640} y={498} anchor='middle' size={15} color={C.good}>Source correction → rebuild affected examples and artifacts</Label></g>
    <Label x={640} y={590} anchor='middle' size={15} color={C.muted}>{end>.5?'Later sessions and unfamiliar sites test generalization':'Local storage and remote teacher use are separate choices'}</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
