import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToyFillerProbe } from './ToyFillerProbe';

/** arXiv:2607.03502 — Reading Between the Dots. */
const meta: Meta<typeof ToyFillerProbe> = {
  title: 'Explainers/Toy Filler Probe',
  component: ToyFillerProbe,
};
export default meta;

export const Explainer: StoryObj<typeof ToyFillerProbe> = {};
