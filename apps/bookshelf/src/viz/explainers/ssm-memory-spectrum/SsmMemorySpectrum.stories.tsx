import type { Meta, StoryObj } from '@storybook/react-vite';
import { SsmMemorySpectrum } from './SsmMemorySpectrum';

/**
 * Where This Sits — Explained: State-Space Models, chapter 5.
 * Attention vs accumulate vs delta rule on a real rewrite-the-same-key test
 * (d = 16, computed): accumulation reads back a 0.65/0.65 blend; the delta
 * rule reads the new value at 1.00 and the old at −0.16.
 */
const meta: Meta<typeof SsmMemorySpectrum> = {
  title: 'Explainers/SSM Memory Spectrum',
  component: SsmMemorySpectrum,
};
export default meta;

export const Explainer: StoryObj<typeof SsmMemorySpectrum> = {};
