import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fourier } from './Fourier';

const meta: Meta<typeof Fourier> = {
  title: 'Explainers/Fourier Series',
  component: Fourier,
};
export default meta;

export const DrawingWithCircles: StoryObj<typeof Fourier> = {};
