import type { Meta, StoryObj } from '@storybook/react-vite';
import { ZeroSharding } from './ZeroSharding';

/**
 * ZeRO — per-device memory computed exactly as sharding stages turn on:
 * 98 → 34 → 23 → 12 GB for the 6.57B model on 8 devices; the price is ~1.5×
 * communication.
 */
const meta: Meta<typeof ZeroSharding> = {
  title: 'Explainers/ZeRO Sharding',
  component: ZeroSharding,
};
export default meta;

export const Explainer: StoryObj<typeof ZeroSharding> = {};
