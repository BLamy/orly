import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExpertPlacement } from './ExpertPlacement';

/** Serving the Mixture — arXiv:2607.12696 / 2607.08782 / 2607.13068. */
const meta: Meta<typeof ExpertPlacement> = {
  title: 'Explainers/Expert Placement',
  component: ExpertPlacement,
};
export default meta;

export const Explainer: StoryObj<typeof ExpertPlacement> = {};
