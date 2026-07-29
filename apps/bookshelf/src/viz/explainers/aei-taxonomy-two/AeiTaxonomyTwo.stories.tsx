import type { Meta, StoryObj } from '@storybook/react-vite';
import { AeiTaxonomyTwo } from './AeiTaxonomyTwo';

/** SSRN 6325939 — Adversarial Epistemic Incoherence (AEI): Taxonomy Two. */
const meta: Meta<typeof AeiTaxonomyTwo> = {
  title: 'Explainers/AEI Taxonomy Two',
  component: AeiTaxonomyTwo,
};
export default meta;

export const Explainer: StoryObj<typeof AeiTaxonomyTwo> = {};
