import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetamorphicRelations } from './MetamorphicRelations';

/**
 * Metamorphic Relations — Explained: Testing Without an Oracle, ch. 3.
 * A toy sentiment model with planted position/filler defects, measured over
 * 1,000 seeded sentences: permutation flips 110, synonym swaps 31/842,
 * filler 23 — oracle-free violations that localize their causes.
 */
const meta: Meta<typeof MetamorphicRelations> = {
  title: 'Explainers/Metamorphic Relations',
  component: MetamorphicRelations,
};
export default meta;
export const Explainer: StoryObj<typeof MetamorphicRelations> = {};
