import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chapter1 } from './chapter-1';

const meta: Meta<typeof Chapter1> = {
  title: 'Books/Sealed and Wrapped/Chapter 1',
  component: Chapter1,
};
export default meta;

export const ThePostcardProblem: StoryObj<typeof Chapter1> = {};
