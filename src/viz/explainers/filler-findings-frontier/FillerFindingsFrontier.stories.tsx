import type { Meta, StoryObj } from '@storybook/react-vite';
import { FillerFindingsFrontier } from './FillerFindingsFrontier';

/** arXiv:2607.03502 — Reading Between the Dots. */
const meta: Meta<typeof FillerFindingsFrontier> = {
  title: 'Explainers/Filler Findings Frontier',
  component: FillerFindingsFrontier,
};
export default meta;

export const Explainer: StoryObj<typeof FillerFindingsFrontier> = {};
