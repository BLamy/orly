import type { Meta, StoryObj } from '@storybook/react-vite';
import { SameOriginWall } from './SameOriginWall';

/** Explained: The Sandbox — grounded in the real almostnode code at ~/Dev/almostnode. */
const meta: Meta<typeof SameOriginWall> = {
  title: 'Explainers/SameOriginWall',
  component: SameOriginWall,
};
export default meta;
export const Explainer: StoryObj<typeof SameOriginWall> = {};
