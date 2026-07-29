import type { Meta, StoryObj } from '@storybook/react-vite';
import { OneChipWall } from './OneChipWall';

/**
 * Why One Chip Can't — exact memory arithmetic for a 6.57B-parameter toy
 * transformer: 16 bytes of training state per parameter = 98 GB vs an 80 GB
 * accelerator. The wall that forces distributed training.
 */
const meta: Meta<typeof OneChipWall> = {
  title: 'Explainers/One-Chip Wall',
  component: OneChipWall,
};
export default meta;

export const Explainer: StoryObj<typeof OneChipWall> = {};
