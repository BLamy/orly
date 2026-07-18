import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatentmoeBottleneck } from './LatentmoeBottleneck';

/** arXiv:2601.18089 — LatentMoE. */
const meta: Meta<typeof LatentmoeBottleneck> = {
  title: 'Explainers/LatentmoeBottleneck',
  component: LatentmoeBottleneck,
};
export default meta;

export const Explainer: StoryObj<typeof LatentmoeBottleneck> = {};
