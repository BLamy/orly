import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoeRouting } from './MoeRouting';

/** Serving the Mixture — arXiv:2607.12696 / 2607.08782 / 2607.13068. */
const meta: Meta<typeof MoeRouting> = {
  title: 'Explainers/Moe Routing',
  component: MoeRouting,
};
export default meta;

export const Explainer: StoryObj<typeof MoeRouting> = {};
