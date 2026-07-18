import type { Meta, StoryObj } from '@storybook/react-vite';
import { RopeRelative } from './RopeRelative';

/** Positions as Rotations — Explained: Long Context, chapter 1. Real RoPE: four frequency pairs, base 100; score(5,2) = score(20,17) = score(80,77) = 0.386, and the score-vs-offset kernel computed. */
const meta: Meta<typeof RopeRelative> = {
  title: 'Explainers/Rope Relative',
  component: RopeRelative,
};
export default meta;

export const Explainer: StoryObj<typeof RopeRelative> = {};
