import type { Meta, StoryObj } from '@storybook/react-vite';
import { Crdt } from './Crdt';

const meta: Meta<typeof Crdt> = {
  title: 'Explainers/CRDTs',
  component: Crdt,
};
export default meta;

export const MergingWithoutAsking: StoryObj<typeof Crdt> = {};
