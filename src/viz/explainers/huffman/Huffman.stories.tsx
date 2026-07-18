import type { Meta, StoryObj } from '@storybook/react-vite';
import { Huffman } from './Huffman';

/**
 * Huffman Codes — shorter words for common things.
 * The real Huffman merge sequence building the tree live on eight letters,
 * codes read off as directions, and expected length 2.800 bits against the
 * entropy floor of 2.771.
 */
const meta: Meta<typeof Huffman> = {
  title: 'Explainers/Huffman Codes',
  component: Huffman,
};
export default meta;

export const Explainer: StoryObj<typeof Huffman> = {};
