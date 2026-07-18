import type { Meta, StoryObj } from '@storybook/react-vite';
import { InferenceKvCache } from './InferenceKvCache';

/**
 * The KV Cache — Explained: Inference, chapter 2.
 * A real toy attention layer fills its key/value cache on screen; then the
 * honest 7B arithmetic: 512 KB/token, 2 GB per 4k stream, 64 GB at batch 32
 * (4.6× the weights), 128 KB/token under GQA.
 */
const meta: Meta<typeof InferenceKvCache> = {
  title: 'Explainers/Inference KV Cache',
  component: InferenceKvCache,
};
export default meta;
export const Explainer: StoryObj<typeof InferenceKvCache> = {};
