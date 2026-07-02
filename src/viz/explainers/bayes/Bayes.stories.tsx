import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bayes } from './Bayes';

const meta: Meta<typeof Bayes> = {
  title: "Explainers/Bayes' Theorem",
  component: Bayes,
};
export default meta;

export const ThinkingInPopulations: StoryObj<typeof Bayes> = {};
