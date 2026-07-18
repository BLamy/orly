import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModelProperties } from './ModelProperties';

/**
 * Properties for AI Systems — Explained: Testing Without an Oracle, ch. 5.
 * Three oracle-free assertion families measured live: schema validity
 * (34/34 malformed calls caught), refusal consistency (16/300 paraphrase
 * pairs wobble), calibration (6.0% ECE) — bridging to durable-evals'
 * verification-based scoring.
 */
const meta: Meta<typeof ModelProperties> = {
  title: 'Explainers/Model Properties',
  component: ModelProperties,
};
export default meta;
export const Explainer: StoryObj<typeof ModelProperties> = {};
