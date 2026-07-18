import type { Meta, StoryObj } from '@storybook/react-vite';
import { AeiTaxonomyOne } from './AeiTaxonomyOne';

/** SSRN 6325939 — Adversarial Epistemic Incoherence (AEI): Taxonomy One. */
const meta: Meta<typeof AeiTaxonomyOne> = {
  title: 'Explainers/AEI Taxonomy One',
  component: AeiTaxonomyOne,
};
export default meta;

export const Explainer: StoryObj<typeof AeiTaxonomyOne> = {};
