import type { Meta, StoryObj } from '@storybook/react-vite';
import { HonestOversight } from './HonestOversight';

/**
 * Honest Oversight — passive vs audited selection under rising pressure:
 * passive truth collapses to 0.34 while an adversarial audit holds 0.92 at
 * n=64 — and honestly sags itself at extreme pressure.
 */
const meta: Meta<typeof HonestOversight> = {
  title: 'Explainers/Honest Oversight',
  component: HonestOversight,
};
export default meta;

export const Explainer: StoryObj<typeof HonestOversight> = {};
