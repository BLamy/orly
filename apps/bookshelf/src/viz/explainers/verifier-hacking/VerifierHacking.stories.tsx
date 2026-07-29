import type { Meta, StoryObj } from '@storybook/react-vite';
import { VerifierHacking } from './VerifierHacking';

/**
 * Hacking the Verifier — a real GRPO run finds the "memorize the public
 * tests" exploit (verifier 99.6% vs truth 3.3%); hidden tests avert it
 * (both curves → 84.6%). The verifier is the new attack surface.
 */
const meta: Meta<typeof VerifierHacking> = {
  title: 'Explainers/Verifier Hacking',
  component: VerifierHacking,
};
export default meta;

export const Explainer: StoryObj<typeof VerifierHacking> = {};
