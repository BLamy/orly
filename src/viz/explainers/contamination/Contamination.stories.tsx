import type { Meta, StoryObj } from '@storybook/react-vite';
import { Contamination } from './Contamination';

/**
 * Train/Test Contamination — a real degree-11 interpolating fit scoring
 * perfectly on leaked questions (train mse 4e-18) and 3.72 on fresh ones,
 * beside a degree-3 model whose score travels.
 */
const meta: Meta<typeof Contamination> = {
  title: 'Explainers/Contamination',
  component: Contamination,
};
export default meta;

export const Explainer: StoryObj<typeof Contamination> = {};
