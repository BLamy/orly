import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../explainers/hnsw/Hnsw';
import url from './assets/hnsw.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"hnsw",title:"Search across three levels",subtitle:"The existing computed index",url,window:[18, 35.5],lines:["Amber: sparse top layer", "Violet: middle layer", "Cyan: dense base layer", "Mint: recorded search path"],note:"Exact node membership, neighbor edges and search trace from the original seeded example. Vertical height encodes index level.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/09 Descend the index",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
