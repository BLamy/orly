import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvoclawQuestion } from './EvoclawQuestion';

/** arXiv:2607.09711 — EvoClawBench. */
const meta: Meta<typeof EvoclawQuestion> = {
  title: 'Explainers/EvoclawQuestion',
  component: EvoclawQuestion,
};
export default meta;

export const Explainer: StoryObj<typeof EvoclawQuestion> = {};
