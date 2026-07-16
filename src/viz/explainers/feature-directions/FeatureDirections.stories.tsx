import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeatureDirections } from './FeatureDirections';

/**
 * Features as Directions — opening the black box.
 * 240 real activation vectors rotating from arbitrary axes (a blob) into
 * the trained linear probe's basis (two clouds); the probe recovers the
 * planted direction at cosine 0.993.
 */
const meta: Meta<typeof FeatureDirections> = {
  title: 'Explainers/Features as Directions',
  component: FeatureDirections,
};
export default meta;

export const Explainer: StoryObj<typeof FeatureDirections> = {};
