import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScalingLaws } from './ScalingLaws';

/**
 * Scaling Laws — the straight line on the log-log plot.
 * The published Kaplan et al. 2020 compute power law: a discouraging elbow on
 * linear axes becomes a straight line on log-log axes, with slope ≈ −0.05,
 * honestly labeled as the published fit.
 */
const meta: Meta<typeof ScalingLaws> = {
  title: 'Explainers/Scaling Laws',
  component: ScalingLaws,
};
export default meta;

export const Explainer: StoryObj<typeof ScalingLaws> = {};
