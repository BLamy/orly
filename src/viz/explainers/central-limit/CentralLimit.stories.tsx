import type { Meta, StoryObj } from '@storybook/react-vite';
import { CentralLimit } from './CentralLimit';

const meta: Meta<typeof CentralLimit> = {
  title: 'Explainers/Central Limit Theorem',
  component: CentralLimit,
};
export default meta;

export const OrderFromChaos: StoryObj<typeof CentralLimit> = {};
