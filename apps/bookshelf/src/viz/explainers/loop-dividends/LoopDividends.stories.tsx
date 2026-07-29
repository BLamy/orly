import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoopDividends } from './LoopDividends';

/**
 * What Looping Buys — arXiv:2607.13491, chapter 4.
 * The paper's reported GPT-2-scale results (Tables 1–2), replotted and
 * labeled "reported, not re-run": neutrality at R = 1, widening gains at
 * R = 7, downstream lifts.
 */
const meta: Meta<typeof LoopDividends> = {
  title: 'Explainers/Loop Dividends',
  component: LoopDividends,
};
export default meta;

export const Explainer: StoryObj<typeof LoopDividends> = {};
