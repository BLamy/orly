import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/cedar-garden-bench/chapter-3';
import url from './assets/bench.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"bench",title:"The stack is the joint",subtitle:"Assembly order in depth",url,window:[0.5, 26.8],lines:["Rail and two legs", "Spacer block", "Next rail", "Leg infill and next spacer"],note:"Spatial course diagram from the original sequence. Exploded spacing is illustrative; this is not a fabrication model.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/03 Stack the bench",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
