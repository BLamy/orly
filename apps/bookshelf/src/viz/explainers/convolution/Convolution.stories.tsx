import type { Meta, StoryObj } from '@storybook/react-vite';
import { Convolution } from './Convolution';

const meta: Meta<typeof Convolution> = {
  title: 'Explainers/Convolution',
  component: Convolution,
};
export default meta;

export const SlidingWindowsThatSee: StoryObj<typeof Convolution> = {};
