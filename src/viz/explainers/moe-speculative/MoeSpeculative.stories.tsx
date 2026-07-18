import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoeSpeculative } from './MoeSpeculative';

/** Serving the Mixture — arXiv:2607.12696 / 2607.08782 / 2607.13068. */
const meta: Meta<typeof MoeSpeculative> = {
  title: 'Explainers/Moe Speculative',
  component: MoeSpeculative,
};
export default meta;

export const Explainer: StoryObj<typeof MoeSpeculative> = {};
