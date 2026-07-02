import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConsistentHashing } from './ConsistentHashing';

const meta: Meta<typeof ConsistentHashing> = {
  title: 'Explainers/Consistent Hashing',
  component: ConsistentHashing,
};
export default meta;

export const TheRingThatBarelyMoves: StoryObj<typeof ConsistentHashing> = {};
