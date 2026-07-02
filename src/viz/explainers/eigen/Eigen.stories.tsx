import type { Meta, StoryObj } from '@storybook/react-vite';
import { Eigen } from './Eigen';

const meta: Meta<typeof Eigen> = {
  title: 'Explainers/Eigenvectors',
  component: Eigen,
};
export default meta;

export const TheAxesThatStay: StoryObj<typeof Eigen> = {};
