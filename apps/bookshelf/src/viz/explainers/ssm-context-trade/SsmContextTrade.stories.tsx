import type { Meta, StoryObj } from '@storybook/react-vite';
import { SsmContextTrade } from './SsmContextTrade';

/**
 * The Long-Context Trade — Explained: State-Space Models, chapter 4.
 * Honest fp16 memory arithmetic: 512 KiB of KV cache per token (32 layers,
 * d_model 4096) → 2/16/64 GiB at 4k/32k/128k, vs a flat 64 MiB Mamba-2-style
 * state — 1024× smaller at 128k. All numbers computed at module scope.
 */
const meta: Meta<typeof SsmContextTrade> = {
  title: 'Explainers/SSM Context Trade',
  component: SsmContextTrade,
};
export default meta;

export const Explainer: StoryObj<typeof SsmContextTrade> = {};
