import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextRot } from './ContextRot';

/** Context Rot — Explained: Long Context, chapter 4. Needle test, 500 trials per depth: the measured U-shape (98% at the start, 31% mid-document, 96% at the end). */
const meta: Meta<typeof ContextRot> = {
  title: 'Explainers/Context Rot',
  component: ContextRot,
};
export default meta;

export const Explainer: StoryObj<typeof ContextRot> = {};
