import type { Meta, StoryObj } from '@storybook/react-vite';
import { DifferentialDataflow } from './DifferentialDataflow';

const meta: Meta<typeof DifferentialDataflow> = {
  title: 'Explainers/Differential Dataflow',
  component: DifferentialDataflow,
};
export default meta;

export const RecomputeNothing: StoryObj<typeof DifferentialDataflow> = {};
