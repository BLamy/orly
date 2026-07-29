import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoeMemoryWall } from './MoeMemoryWall';

/** Serving the Mixture — arXiv:2607.12696 / 2607.08782 / 2607.13068. */
const meta: Meta<typeof MoeMemoryWall> = {
  title: 'Explainers/Moe Memory Wall',
  component: MoeMemoryWall,
};
export default meta;

export const Explainer: StoryObj<typeof MoeMemoryWall> = {};
