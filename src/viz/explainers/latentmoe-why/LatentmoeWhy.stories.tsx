import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatentmoeWhy } from './LatentmoeWhy';

/** arXiv:2601.18089 — LatentMoE. */
const meta: Meta<typeof LatentmoeWhy> = {
  title: 'Explainers/LatentmoeWhy',
  component: LatentmoeWhy,
};
export default meta;

export const Explainer: StoryObj<typeof LatentmoeWhy> = {};
