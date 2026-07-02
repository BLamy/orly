import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReplayCritic } from './ReplayCritic';

const meta: Meta<typeof ReplayCritic> = {
  title: 'Explainers/Replay — Agents That Prove Their Work',
  component: ReplayCritic,
};
export default meta;

export const AdversarialVerification: StoryObj<typeof ReplayCritic> = {};
