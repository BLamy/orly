import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chapter2 } from './chapter-2';

const meta: Meta<typeof Chapter2> = {
  title: 'Books/Sealed and Wrapped/Chapter 2',
  component: Chapter2,
};
export default meta;

export const OneSharedSecret: StoryObj<typeof Chapter2> = {};
