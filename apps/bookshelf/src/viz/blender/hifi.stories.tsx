import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/hifi-umi/chapter-2';
import url from './assets/hifi.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"hifi",title:"Both hands, one reference frame",subtitle:"Shared head-camera frame",url,window:[19.5, 38.5],lines:["Violet: left gripper", "Amber: right gripper", "Mint: relative hand pose", "Axes: local x / y / z"],note:"Schematic camera and marker geometry, not measured device dimensions. Both observations share one camera origin.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/02 Reconstruct the hands",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
