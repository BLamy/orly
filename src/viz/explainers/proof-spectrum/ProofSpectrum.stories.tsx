import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProofSpectrum } from './ProofSpectrum';

/**
 * Tests Sample, Proofs Cover — Explained: Proof or It Didn't Happen, ch. 1.
 * A 60/60-green test suite over avg8(a,b) = ((a+b)&0xff)>>1, and the 32,640
 * wrapping pairs (half the space) it never touched — all computed exhaustively.
 */
const meta: Meta<typeof ProofSpectrum> = {
  title: 'Explainers/Proof Spectrum',
  component: ProofSpectrum,
};
export default meta;
export const Explainer: StoryObj<typeof ProofSpectrum> = {};
