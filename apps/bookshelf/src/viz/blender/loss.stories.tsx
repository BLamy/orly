import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../explainers/loss-landscape/LossLandscape';
import url from './assets/loss.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"loss",title:"Give the loss landscape height",subtitle:"Height = mean squared error",url,window:[19, scene.tl.duration + 1],lines:["Two knobs: amplitude / frequency", "Mint: mirror best fits", "Amber: shallow local minimum", "Violet: saddle point"],note:"Surface sampled directly from the existing loss function and seeded data. Vertical scale is 0.75 scene units per loss unit.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/04 Loss as terrain",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
