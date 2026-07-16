import type { Meta, StoryObj } from '@storybook/react-vite';
import { NextToken } from './NextToken';

/**
 * Next-Token Prediction as Compression.
 * A real character bigram model predicts a held-out sentence; each character's
 * bit cost (−log2 p) and the running total are the true numbers — blind 4.81
 * vs bigram 2.28 bits per character.
 */
const meta: Meta<typeof NextToken> = {
  title: 'Explainers/Next-Token Prediction',
  component: NextToken,
};
export default meta;

export const Explainer: StoryObj<typeof NextToken> = {};
