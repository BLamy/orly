import type { Meta, StoryObj } from '@storybook/react-vite';
import { ValueIteration } from './ValueIteration';

/**
 * The Value of a State — value iteration on a 6×6 gridworld with walls.
 * Every Bellman sweep is computed and recorded at module scope; the heat you
 * watch spreading from the reward square is the real fixed-point computation,
 * and the closing policy arrows and greedy path derive from the true values.
 */
const meta: Meta<typeof ValueIteration> = {
  title: 'Explainers/The Value of a State',
  component: ValueIteration,
};
export default meta;

export const Explainer: StoryObj<typeof ValueIteration> = {};
