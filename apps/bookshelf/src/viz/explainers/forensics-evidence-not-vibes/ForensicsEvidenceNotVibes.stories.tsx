import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForensicsEvidenceNotVibes } from './ForensicsEvidenceNotVibes';

/** arXiv:2606.26071 — Model Forensics, chapter 5: evidence, not vibes. */
const meta: Meta<typeof ForensicsEvidenceNotVibes> = {
  title: 'Explainers/Forensics Evidence Not Vibes',
  component: ForensicsEvidenceNotVibes,
};
export default meta;

export const Explainer: StoryObj<typeof ForensicsEvidenceNotVibes> = {};
