import type { Meta, StoryObj } from '@storybook/react-vite';
import { FillerTokensQuestion } from './FillerTokensQuestion';

/** arXiv:2607.03502 — Reading Between the Dots. */
const meta: Meta<typeof FillerTokensQuestion> = {
  title: 'Explainers/Filler Tokens Question',
  component: FillerTokensQuestion,
};
export default meta;

export const Explainer: StoryObj<typeof FillerTokensQuestion> = {};
