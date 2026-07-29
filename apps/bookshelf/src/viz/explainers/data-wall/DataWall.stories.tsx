import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataWall } from './DataWall';

/**
 * The Data Wall — reported training-set sizes (0.3T → 15T) vs the reported
 * ~300T stock of human text, with a computed log-linear extrapolation
 * crossing ~2028; what verified synthetic pipelines change.
 */
const meta: Meta<typeof DataWall> = {
  title: 'Explainers/Data Wall',
  component: DataWall,
};
export default meta;

export const Explainer: StoryObj<typeof DataWall> = {};
