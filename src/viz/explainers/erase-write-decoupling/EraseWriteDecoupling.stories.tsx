import type { Meta, StoryObj } from '@storybook/react-vite';
import { EraseWriteDecoupling } from './EraseWriteDecoupling';

/**
 * Erase, Then Write — the core move of arXiv:2605.22791 (Gated DeltaNet-2).
 * A computed toy: the coupled scalar update clobbers an overlapping memory
 * (recall 1.00 -> 0.50); the best scalar compromise caps both recalls at
 * 0.86; hand-set channel-wise erase/write gates reach 0.95 / 1.00.
 */
const meta: Meta<typeof EraseWriteDecoupling> = {
  title: 'Explainers/Erase Write Decoupling',
  component: EraseWriteDecoupling,
};
export default meta;

export const Explainer: StoryObj<typeof EraseWriteDecoupling> = {};
