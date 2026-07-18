import type { Meta, StoryObj } from '@storybook/react-vite';
import { FixedStateMemory } from './FixedStateMemory';

/**
 * The Fixed-State Problem — arXiv:2605.22791, chapter 1.
 * A growing key-value cache vs one fixed matrix state; the interference
 * curve (recall of the first stored value decaying under later writes) is
 * genuinely computed at d = 8 with seeded random unit vectors.
 */
const meta: Meta<typeof FixedStateMemory> = {
  title: 'Explainers/Fixed State Memory',
  component: FixedStateMemory,
};
export default meta;

export const Explainer: StoryObj<typeof FixedStateMemory> = {};
