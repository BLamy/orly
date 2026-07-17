import type { Meta, StoryObj } from '@storybook/react-vite';
import { RopeStretching } from './RopeStretching';

/** Stretching the Ruler — Explained: Long Context, chapter 2. Trained window 64: position 256 puts the slow channel at 2.56 rad (never seen). PI/4 restores range but neighbor contrast falls 0.080 to 0.005; NTK (base 488) keeps 0.070. */
const meta: Meta<typeof RopeStretching> = {
  title: 'Explainers/Rope Stretching',
  component: RopeStretching,
};
export default meta;

export const Explainer: StoryObj<typeof RopeStretching> = {};
