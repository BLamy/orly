// Sources: pinned charter mission, explicit modes, E11; W3C focus-order guidance.
// One page persists. Dashed suggestion, solid focus, and activation are distinct.
// Only the accepted focus ring moves; no typing, saving or activation is shown.
import { interpolateObject } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { ProfilePage, FocusRing, SuggestHalo, Keycap, controlRect } from '../next-useful-action/shared/profile-page';
import { C, chapter, Header, Label, Panel, Chip, on, span, lerp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "Now bring the machinery back to the person at the keyboard. They open a familiar page, and the local model recognizes a pattern it has seen before.",
  "It predicts that the name field is the next useful target. A subtle visual suggestion appears, distinct from the focus ring that shows the current keyboard position.",
  "On a site where the person has enabled this behavior, pressing Tab can accept the suggestion and move focus to that field.",
  "Focus is the full action in this assistive mode. It does not click save, submit the form, purchase anything, or silently complete an autonomous workflow.",
  "If the model is unsure or the target has changed, ordinary navigation continues. A weak prediction should not create a fight between the person and the keyboard.",
  "Escape dismisses the suggestion. Reverse navigation and editing shortcuts need to preserve their expected behavior, including in applications with their own use of Tab.",
  "That is why the first version should be opt-in and limited to declared sites and contexts. Compatibility is part of whether the assistance is actually helpful.",
  "The experience we want is simple: the browser offers the next useful place, and the person remains the one who chooses to go there."
] as const;
const page={x:75,y:126,scale:.9};
const initial=controlRect('profile-menu',page),target=controlRect('display-name-field',page),email=controlRect('email-field',page);
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),suggest=span(p,1,4),accepted=on(p,2),ordinary=on(p,4),keys=on(p,5),enabled=on(p,6);
  const focus=interpolateObject(interpolateObject(initial,target)(accepted),email)(ordinary);
  return <><Header title='Anticipation without taking over' tag='PROPOSED OPT-IN FOCUS ASSISTANCE · FICTIONAL PAGE'/><Camera {...s.get(scene.cam)}>
    <ProfilePage place={page} obsLabel='live context' />
    <SuggestHalo rect={target} u={suggest} phase={p} label='suggested target'/>
    <FocusRing rect={focus} u={1}/>
    <Keycap x={598} y={290} label='Tab' u={span(p,2,4)} press={accepted*(1-on(p,3))}/>
    <Panel x={743} y={127} w={467} h={271} title='One suggestion · the person chooses' color={C.model}>
      <rect x={766} y={187} width={42} height={24} rx={8} fill='none' stroke={C.model} strokeWidth={2} strokeDasharray='6 4'/><Label x={831} y={206} size={17}>Prediction is a suggestion</Label>
      <rect x={766} y={239} width={42} height={24} rx={8} fill='none' stroke='#f1f5f9' strokeWidth={2.5}/><Label x={831} y={258} size={17}>Solid ring is actual focus</Label>
      <Label x={766} y={322} color={C.good} size={18}>{accepted>.5?'Accepted Tab moves focus only':'Wait for opt-in acceptance'}</Label>
      <Label x={766} y={361} color={C.muted} size={16}>Save remains unclicked; the form is unchanged</Label>
    </Panel>
    <g opacity={ordinary}><Chip x={744} y={421} w={466} text='Uncertain or stale → ordinary navigation' color={C.pending}/></g>
    <g opacity={keys}><Keycap x={760} y={477} label='Escape' u={1}/><Keycap x={885} y={477} label='Shift-Tab' u={1}/><Keycap x={1038} y={477} label='Editor keys' u={1}/></g>
    <Label x={980} y={550} anchor='middle' size={15} color={C.muted}>{enabled>.5?'Declared sites and contexts · explicit opt-in':'Suggestion, focus and activation stay separate'}</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
