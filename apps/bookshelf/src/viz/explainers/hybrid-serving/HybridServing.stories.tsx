import type { Meta, StoryObj } from '@storybook/react-vite';
import { HybridServing } from './HybridServing';

/**
 * The Serve-Time Payoff — Explained: Hybrid Attention, chapter 5.
 * KV-budget arithmetic: 192 KiB/token → 24 GiB per 128k sequence under full
 * attention vs 3 GiB hybrid; on an 80 GiB card with 24 GiB of weights that
 * is 2 sequences vs 18 — a 9x concurrency win.
 */
const meta: Meta<typeof HybridServing> = {
  title: 'Explainers/Hybrid Serving',
  component: HybridServing,
};
export default meta;

export const Explainer: StoryObj<typeof HybridServing> = {};
