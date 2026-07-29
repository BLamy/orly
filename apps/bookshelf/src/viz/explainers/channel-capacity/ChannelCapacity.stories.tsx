import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChannelCapacity } from './ChannelCapacity';

/**
 * Channel Capacity — shouting over noise.
 * A real seeded run through a binary symmetric channel: 13 flips over 120
 * uses, majority vote repairing every damaged triple, and the rate-vs-error
 * chart with the capacity line at 0.531 bits per use.
 */
const meta: Meta<typeof ChannelCapacity> = {
  title: 'Explainers/Channel Capacity',
  component: ChannelCapacity,
};
export default meta;

export const Explainer: StoryObj<typeof ChannelCapacity> = {};
