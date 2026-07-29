import type { Meta, StoryObj } from '@storybook/react-vite';
import { HybridRatio } from './HybridRatio';

/**
 * The Ratio Question — Explained: Hybrid Attention, chapter 3.
 * Real KV arithmetic for a 48-layer model at 128k context: memory falls
 * linearly with the attention fraction (24 GiB → 3 GiB at one in eight),
 * and six published hybrid ratios are replotted as reported.
 */
const meta: Meta<typeof HybridRatio> = {
  title: 'Explainers/Hybrid Ratio',
  component: HybridRatio,
};
export default meta;

export const Explainer: StoryObj<typeof HybridRatio> = {};
