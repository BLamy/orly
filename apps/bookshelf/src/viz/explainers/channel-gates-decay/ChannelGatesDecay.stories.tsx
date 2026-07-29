import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelGatesDecay } from './ChannelGatesDecay';

/**
 * Gates and Decay — arXiv:2605.22791 Eqs. 11-12, computed.
 * Real sigmoid/softplus gate curves, and real per-channel retention curves
 * alpha^t (half-lives from ~4 to ~420 steps) versus one head-wise scalar.
 */
const meta: Meta<typeof ChannelGatesDecay> = {
  title: 'Explainers/Channel Gates Decay',
  component: ChannelGatesDecay,
};
export default meta;

export const Explainer: StoryObj<typeof ChannelGatesDecay> = {};
