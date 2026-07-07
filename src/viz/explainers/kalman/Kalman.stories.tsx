import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kalman } from './Kalman';

const meta: Meta<typeof Kalman> = {
  title: 'Explainers/Kalman Filter',
  component: Kalman,
};
export default meta;

export const TrustWeighted: StoryObj<typeof Kalman> = {};
