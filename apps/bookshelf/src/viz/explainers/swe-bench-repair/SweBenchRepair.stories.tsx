import type { Meta, StoryObj } from '@storybook/react-vite';
import { SweBenchRepair } from './SweBenchRepair';

/**
 * SWE-bench: A Case Study in Repair — the reported 1.96%→~90% climb, the
 * Verified re-curation (38.3% underspecified / 61.1% unfair tests), and a
 * seeded fixed-vs-rolling pool simulation showing 36.9 points of inflation.
 */
const meta: Meta<typeof SweBenchRepair> = {
  title: 'Explainers/SWE-bench Repair',
  component: SweBenchRepair,
};
export default meta;

export const Explainer: StoryObj<typeof SweBenchRepair> = {};
