import type { Meta, StoryObj } from '@storybook/react-vite';
import { NnScale } from './NnScale';

/**
 * The Nearest-Neighbor Problem at Scale — a real 400-point brute-force scan
 * and the honest N·d arithmetic: 1M docs at d=768 is 77 ms per query.
 */
const meta: Meta<typeof NnScale> = {
  title: 'Explainers/Nearest Neighbors at Scale',
  component: NnScale,
};
export default meta;

export const Explainer: StoryObj<typeof NnScale> = {};
