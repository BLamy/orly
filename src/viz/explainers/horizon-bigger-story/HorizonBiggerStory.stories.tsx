import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonBiggerStory } from './HorizonBiggerStory';

/** arXiv:2606.30616 — Scaling the Horizon, chapter 5: the close. */
const meta: Meta<typeof HorizonBiggerStory> = {
  title: 'Explainers/Horizon Bigger Story',
  component: HorizonBiggerStory,
};
export default meta;

export const Explainer: StoryObj<typeof HorizonBiggerStory> = {};
