import type { Meta, StoryObj } from '@storybook/react-vite';
import { BoundaryCost } from './BoundaryCost';

/** Explained: The Sandbox — grounded in the real almostnode code at ~/Dev/almostnode. */
const meta: Meta<typeof BoundaryCost> = {
  title: 'Explainers/BoundaryCost',
  component: BoundaryCost,
};
export default meta;
export const Explainer: StoryObj<typeof BoundaryCost> = {};
