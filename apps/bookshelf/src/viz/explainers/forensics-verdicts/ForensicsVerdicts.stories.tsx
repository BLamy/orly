import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForensicsVerdicts } from './ForensicsVerdicts';

/** arXiv:2606.26071 — Model Forensics, chapter 4: six verdicts. */
const meta: Meta<typeof ForensicsVerdicts> = {
  title: 'Explainers/Forensics Verdicts',
  component: ForensicsVerdicts,
};
export default meta;

export const Explainer: StoryObj<typeof ForensicsVerdicts> = {};
