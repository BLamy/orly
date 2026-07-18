import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tokenization } from './Tokenization';

/**
 * Tokenization — byte pair encoding, running on a real string.
 * A real BPE run recorded merge by merge: the most frequent adjacent pair
 * fuses into a new token each step, compressing a 49-character sentence to
 * 13 tokens and discovering "the" as a unit.
 */
const meta: Meta<typeof Tokenization> = {
  title: 'Explainers/Tokenization',
  component: Tokenization,
};
export default meta;

export const Explainer: StoryObj<typeof Tokenization> = {};
