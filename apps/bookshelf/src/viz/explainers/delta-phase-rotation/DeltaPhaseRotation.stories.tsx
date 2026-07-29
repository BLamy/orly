import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaPhaseRotation } from './DeltaPhaseRotation';

/**
 * Phase — Explained: The Delta Rule, chapter 4 (SFDA, arXiv:2607.11897).
 * The paper's constructed mod-5 counter recreated for real: 200 random
 * increments, rotation decodes exactly at norm 1.0; real decay collapses
 * to 2.3e-3.
 */
const meta: Meta<typeof DeltaPhaseRotation> = {
  title: 'Explainers/Delta Phase Rotation',
  component: DeltaPhaseRotation,
};
export default meta;
export const Explainer: StoryObj<typeof DeltaPhaseRotation> = {};
