import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphTasks } from './GraphTasks';

/**
 * Graph Tasks — real label propagation from two seeds (bridge node settles
 * at 0.72 red) and real common-neighbor link prediction (0–3 and 5–8 tie
 * at three shared neighbors).
 */
const meta: Meta<typeof GraphTasks> = {
  title: 'Explainers/Graph Tasks',
  component: GraphTasks,
};
export default meta;

export const Explainer: StoryObj<typeof GraphTasks> = {};
