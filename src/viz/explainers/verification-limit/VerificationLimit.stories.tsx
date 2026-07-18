import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerificationLimit } from './VerificationLimit';

/**
 * The Unnegotiable Verifier — Explained: Proof or It Didn't Happen, ch. 5.
 * The shelf's ladder of verifiers on one axis — how much the verified party
 * can negotiate with the verdict — closing at the kernel: the limit case of
 * the loop books' thesis.
 */
const meta: Meta<typeof VerificationLimit> = {
  title: 'Explainers/Verification Limit',
  component: VerificationLimit,
};
export default meta;
export const Explainer: StoryObj<typeof VerificationLimit> = {};
