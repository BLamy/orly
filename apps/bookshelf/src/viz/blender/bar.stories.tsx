import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/pallet-backyard-bar/chapter-3';
import url from './assets/bar.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"bar",title:"A screw needs something to grip",subtitle:"Look below the shelf",url,window:[34.5, 42.1],lines:["Transparent top", "Mint screw: into a stringer", "Coral screw: into a gap", "Follow the whole fastener"],note:"The original pallet footprint becomes a cutaway. Fastener size and insertion motion are exaggerated for visibility.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/06 See through the bar top",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
