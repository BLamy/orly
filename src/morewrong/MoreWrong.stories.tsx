// MoreWrong v2 — the branching AI-founder game, playable in Storybook.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreWrong } from './MoreWrong';

const meta: Meta<typeof MoreWrong> = {
  title: 'MoreWrong',
  component: MoreWrong,
  parameters: { layout: 'fullscreen' },
};
export default meta;

export const Play: StoryObj<typeof MoreWrong> = { name: 'Play' };
