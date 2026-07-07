import type { Meta, StoryObj } from '@storybook/react-vite';
import { Entropy } from './Entropy';

const meta: Meta<typeof Entropy> = {
  title: 'Explainers/Entropy',
  component: Entropy,
};
export default meta;

export const CountingSurprise: StoryObj<typeof Entropy> = {};
