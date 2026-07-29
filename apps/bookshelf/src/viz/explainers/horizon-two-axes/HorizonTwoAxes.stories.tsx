import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizonTwoAxes } from './HorizonTwoAxes';

/** arXiv:2606.30616 — Scaling the Horizon, chapter 1: two axes. */
const meta: Meta<typeof HorizonTwoAxes> = {
  title: 'Explainers/Horizon Two Axes',
  component: HorizonTwoAxes,
};
export default meta;

export const Explainer: StoryObj<typeof HorizonTwoAxes> = {};
