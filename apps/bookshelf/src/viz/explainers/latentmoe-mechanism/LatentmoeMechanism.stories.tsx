import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatentmoeMechanism } from './LatentmoeMechanism';

/** arXiv:2601.18089 — LatentMoE. */
const meta: Meta<typeof LatentmoeMechanism> = {
  title: 'Explainers/LatentmoeMechanism',
  component: LatentmoeMechanism,
};
export default meta;

export const Explainer: StoryObj<typeof LatentmoeMechanism> = {};
