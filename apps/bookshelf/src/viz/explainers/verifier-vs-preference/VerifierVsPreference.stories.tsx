import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerifierVsPreference } from './VerifierVsPreference';

/**
 * Verifier vs Preference — best-of-n against a preference judge (peaks 0.62,
 * collapses to 0.02 as loopholes win 98%) vs an executable check (hits 1.00
 * by n=16). The opening argument for verifiable rewards.
 */
const meta: Meta<typeof VerifierVsPreference> = {
  title: 'Explainers/Verifier vs Preference',
  component: VerifierVsPreference,
};
export default meta;

export const Explainer: StoryObj<typeof VerifierVsPreference> = {};
