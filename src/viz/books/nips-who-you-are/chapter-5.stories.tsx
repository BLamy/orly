import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chapter5 } from './chapter-5';

const meta: Meta<typeof Chapter5> = {
  title: 'Books/Who You Are/Chapter 5',
  component: Chapter5,
};
export default meta;

export const ProofsNotPasswords: StoryObj<typeof Chapter5> = {};
