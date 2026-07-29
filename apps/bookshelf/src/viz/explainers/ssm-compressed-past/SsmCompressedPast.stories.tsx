import type { Meta, StoryObj } from '@storybook/react-vite';
import { SsmCompressedPast } from './SsmCompressedPast';

/**
 * The Compressed Past — Explained: State-Space Models, chapter 1.
 * A real diagonal linear SSM (N = 6) run over a 48-step signal; the fading
 * memory is measured by genuine least-squares reconstruction of the input
 * at lags 0, 4, and 12 (≈2%, ≈17%, ≈33% relative error).
 */
const meta: Meta<typeof SsmCompressedPast> = {
  title: 'Explainers/SSM Compressed Past',
  component: SsmCompressedPast,
};
export default meta;

export const Explainer: StoryObj<typeof SsmCompressedPast> = {};
