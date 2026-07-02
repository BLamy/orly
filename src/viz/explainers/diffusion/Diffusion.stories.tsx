import type { Meta, StoryObj } from '@storybook/react-vite';
import { Diffusion } from './Diffusion';

const meta: Meta<typeof Diffusion> = {
  title: 'Explainers/Diffusion',
  component: Diffusion,
};
export default meta;

export const NoiseForwardAndBack: StoryObj<typeof Diffusion> = {};
