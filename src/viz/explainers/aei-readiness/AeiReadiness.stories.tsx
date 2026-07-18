import type { Meta, StoryObj } from '@storybook/react-vite';
import { AeiReadiness } from './AeiReadiness';

/** SSRN 6325939 — Adversarial Epistemic Incoherence (AEI): Readiness. */
const meta: Meta<typeof AeiReadiness> = {
  title: 'Explainers/AEI Readiness',
  component: AeiReadiness,
};
export default meta;

export const Explainer: StoryObj<typeof AeiReadiness> = {};
