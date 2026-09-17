import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/turbovla/chapter-3';
import url from './assets/turbo.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"turbo",title:"One chunk, twelve future poses",subtitle:"Illustrative action sequence",url,window:[25.9, 38.5],lines:["Twelve output slots", "Each is a continuous vector", "Ghost grippers show the order", "One chunk from one pass"],note:"Schematic poses derived from the source\u2019s synthetic actions. Not measured robot motion or a kinematically validated rollout.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/08 Twelve gripper poses",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
