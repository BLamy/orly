import type { Meta, StoryObj } from '@storybook/react-vite';
import { MultiHeadAttention } from './MultiHeadAttention';

/**
 * Multi-Head Attention — many conversations, one stream.
 * Builds on the single-head attention explainer: the same eight tokens are
 * handed to three heads whose REAL softmax weights find three different
 * relations (position, reference, description), then concatenate and mix.
 */
const meta: Meta<typeof MultiHeadAttention> = {
  title: 'Explainers/Multi-Head Attention',
  component: MultiHeadAttention,
};
export default meta;

export const Explainer: StoryObj<typeof MultiHeadAttention> = {};
