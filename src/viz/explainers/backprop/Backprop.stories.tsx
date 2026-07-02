import type { Meta, StoryObj } from '@storybook/react-vite';
import { Backprop } from './Backprop';

const meta: Meta<typeof Backprop> = {
  title: 'Explainers/Backpropagation',
  component: Backprop,
};
export default meta;

export const TheChainRuleAlive: StoryObj<typeof Backprop> = {};
