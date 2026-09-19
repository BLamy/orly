import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlenderStudy } from './BlenderStudy';
import { Render, vizScene } from '../explainers/svm/Svm';
import url from './assets/svm.glb?url';
const scene=vizScene();
function Study() { return <BlenderStudy study={{id:"svm",title:"A separating plane upstairs",subtitle:"One quadratic feature: x \u00d7 y",url,window:[41, 53],lines:["Keep x and y", "Add height = x \u00d7 y", "Matching signs rise", "Opposite signs descend"],note:"Illustrative 3D slice of the quadratic feature map, not its full dimensionality. Kernel computation does not physically lift data.",timeline:scene.tl,Original:Render}}/>; }
const meta:Meta<typeof Study>={title:"Blender 3D/07 Lift XOR",component:Study};
export default meta;
export const Scene:StoryObj<typeof Study>={};
