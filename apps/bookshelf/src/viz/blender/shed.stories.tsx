import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/how-to-build-a-shed/chapter-5';
import url from './assets/shed.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"shed",title:"Raising day, in three dimensions",subtitle:"Four walls \u2192 one frame",url,window:[0.5, 20.5],lines:["Back wall first", "Side walls meet the back", "Front wall closes the shell", "Each wall pivots at its base"],note:"Framing cutaway derived from the existing 8-foot shed scene. Sheathing is transparent to expose connections.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/01 Raising the shed",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
