import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../explainers/vision-kernels/VisionKernels';
import url from './assets/vision.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"vision",title:"One image, three feature maps",subtitle:"Channels occupy separate planes",url,window:[30, 52.8],lines:["Base: input image", "Cyan: vertical edges", "Mint: horizontal edges", "Amber: checker texture"],note:"Uses the existing computed convolution maps. Layer spacing shows channel identity, not physical depth in the image.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/10 Stack feature maps",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
