import type { Meta, StoryObj } from '@storybook/react-vite';
import { AeiRegime } from './AeiRegime';

/** SSRN 6325939 — Adversarial Epistemic Incoherence (AEI): Regime. */
const meta: Meta<typeof AeiRegime> = {
  title: 'Explainers/AEI Regime',
  component: AeiRegime,
};
export default meta;

export const Explainer: StoryObj<typeof AeiRegime> = {};
