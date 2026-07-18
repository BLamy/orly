import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeltaErrorCorrection } from './DeltaErrorCorrection';

/**
 * Error Correction — Explained: The Delta Rule, chapter 2.
 * S = (I − βkkᵀ)S + βkvᵀ actually run vs blind accumulation on a stream of
 * repeated-key updates: latest-value recall 0.59 vs 0.89 (computed).
 */
const meta: Meta<typeof DeltaErrorCorrection> = {
  title: 'Explainers/Delta Error Correction',
  component: DeltaErrorCorrection,
};
export default meta;
export const Explainer: StoryObj<typeof DeltaErrorCorrection> = {};
