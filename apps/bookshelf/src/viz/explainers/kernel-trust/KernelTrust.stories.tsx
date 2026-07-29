import type { Meta, StoryObj } from '@storybook/react-vite';
import { KernelTrust } from './KernelTrust';

/**
 * A Judge You Cannot Charm — Explained: Proof or It Didn't Happen, ch. 4.
 * A style-reading judge optimized against (false accepts 10.6% → 79.3%,
 * measured over 10 pressure steps × 2,000 seeded flawed proofs) vs the
 * kernel's flat 0% — the trusted-core argument.
 */
const meta: Meta<typeof KernelTrust> = {
  title: 'Explainers/Kernel Trust',
  component: KernelTrust,
};
export default meta;
export const Explainer: StoryObj<typeof KernelTrust> = {};
