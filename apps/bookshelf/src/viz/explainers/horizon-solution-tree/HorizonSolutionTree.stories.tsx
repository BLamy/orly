import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonSolutionTree } from './HorizonSolutionTree';

/** arXiv:2606.30616 — Scaling the Horizon, chapter 2: the solution tree. */
const meta: Meta<typeof HorizonSolutionTree> = {
  title: 'Explainers/Horizon Solution Tree',
  component: HorizonSolutionTree,
};
export default meta;

export const Explainer: StoryObj<typeof HorizonSolutionTree> = {};
