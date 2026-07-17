import type { Meta, StoryObj } from '@storybook/react-vite';
import { LatentmoeTradeoffs } from './LatentmoeTradeoffs';

/** arXiv:2601.18089 — LatentMoE. */
const meta: Meta<typeof LatentmoeTradeoffs> = {
  title: 'Explainers/LatentmoeTradeoffs',
  component: LatentmoeTradeoffs,
};
export default meta;

export const Explainer: StoryObj<typeof LatentmoeTradeoffs> = {};
