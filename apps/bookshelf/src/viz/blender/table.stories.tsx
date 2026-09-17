import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../books/kitchen-side-table/chapter-4';
import url from './assets/table.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"table",title:"Hold the top down. Let it move.",subtitle:"An enlarged joint cutaway",url,window:[59.1, 73.2],lines:["Amber tongue enters the slot", "Screw holds button to top", "Apron supports the tongue", "Seasonal movement stays free"],note:"Enlarged schematic of the cabinetmaker\u2019s button. Transparent tabletop exposes the fastener and sliding clearance.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/05 Tabletop button",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
