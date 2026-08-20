import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApiContractChange } from './ApiContractChange';

const meta: Meta<typeof ApiContractChange> = {
  title: 'Engineering Change/API Contract Change',
  component: ApiContractChange,
};
export default meta;

export const CompatibleEvolution: StoryObj<typeof ApiContractChange> = {};
