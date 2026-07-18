import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatentmoeResults } from './LatentmoeResults';

/** arXiv:2601.18089 — LatentMoE. */
const meta: Meta<typeof LatentmoeResults> = {
  title: 'Explainers/LatentmoeResults',
  component: LatentmoeResults,
};
export default meta;

export const Explainer: StoryObj<typeof LatentmoeResults> = {};
