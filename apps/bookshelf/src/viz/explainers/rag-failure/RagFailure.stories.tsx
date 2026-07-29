import type { Meta, StoryObj } from '@storybook/react-vite';
import { RagFailure } from './RagFailure';

/**
 * RAG and Its Failure Modes — real cosine geometry where "how fast is a
 * jaguar" retrieves the sports car (0.9994 vs 0.9781) and the reader
 * confidently answers 300 kph; a query rewrite flips the ranking.
 */
const meta: Meta<typeof RagFailure> = {
  title: 'Explainers/RAG Failure Modes',
  component: RagFailure,
};
export default meta;

export const Explainer: StoryObj<typeof RagFailure> = {};
