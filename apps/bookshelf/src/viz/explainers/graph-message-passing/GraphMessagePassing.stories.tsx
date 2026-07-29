import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphMessagePassing } from './GraphMessagePassing';

/**
 * Graph Message Passing — one real mean-aggregation layer on the 10-node
 * community graph; the bridge node's update to (0.75, 0.25) is computed.
 */
const meta: Meta<typeof GraphMessagePassing> = {
  title: 'Explainers/Graph Message Passing',
  component: GraphMessagePassing,
};
export default meta;

export const Explainer: StoryObj<typeof GraphMessagePassing> = {};
