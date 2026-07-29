import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaDecayGating } from './DeltaDecayGating';

/**
 * Decay and Gating — Explained: The Delta Rule, chapter 3.
 * KDA-form diagonal decay actually run: α = 1 leaves everything mediocre
 * (recent recall 0.70); α = 0.85 sharpens the recent to 0.96 and melts the old.
 */
const meta: Meta<typeof DeltaDecayGating> = {
  title: 'Explainers/Delta Decay Gating',
  component: DeltaDecayGating,
};
export default meta;
export const Explainer: StoryObj<typeof DeltaDecayGating> = {};
