import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chapter3 } from './chapter-3';

const meta: Meta<typeof Chapter3> = {
  title: 'Books/Who You Are/Chapter 3',
  component: Chapter3,
};
export default meta;

export const ANameYouCanSay: StoryObj<typeof Chapter3> = {};
