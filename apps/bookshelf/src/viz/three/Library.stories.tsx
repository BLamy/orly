import type {Meta,StoryObj} from '@storybook/react-vite';
import {ThreeLibrary} from './ThreeLibrary';
import {alexNet,convolution,mathGallery,neuralNetwork} from './examples/compositions';
const meta:Meta<typeof ThreeLibrary>={title:'3D Library/Compositions',component:ThreeLibrary};
export default meta;
export const AlexNet:StoryObj<typeof ThreeLibrary>={args:{factory:alexNet}};
export const Convolution:StoryObj<typeof ThreeLibrary>={args:{factory:convolution}};
export const MathPrimitives:StoryObj<typeof ThreeLibrary>={args:{factory:mathGallery}};

export const NeuralNetwork:StoryObj<typeof ThreeLibrary>={args:{factory:neuralNetwork}};
