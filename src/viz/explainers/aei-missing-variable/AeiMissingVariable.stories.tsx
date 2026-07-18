import type { Meta, StoryObj } from '@storybook/react-vite';
import { AeiMissingVariable } from './AeiMissingVariable';

/** SSRN 6325939 — Adversarial Epistemic Incoherence (AEI): Missing Variable. */
const meta: Meta<typeof AeiMissingVariable> = {
  title: 'Explainers/AEI Missing Variable',
  component: AeiMissingVariable,
};
export default meta;

export const Explainer: StoryObj<typeof AeiMissingVariable> = {};
