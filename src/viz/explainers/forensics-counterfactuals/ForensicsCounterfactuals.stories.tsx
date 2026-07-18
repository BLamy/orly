import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForensicsCounterfactuals } from './ForensicsCounterfactuals';

/** arXiv:2606.26071 — Model Forensics, chapter 3: the tedium dial. */
const meta: Meta<typeof ForensicsCounterfactuals> = {
  title: 'Explainers/Forensics Counterfactuals',
  component: ForensicsCounterfactuals,
};
export default meta;

export const Explainer: StoryObj<typeof ForensicsCounterfactuals> = {};
