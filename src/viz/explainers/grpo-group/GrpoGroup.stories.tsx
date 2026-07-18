import type { Meta, StoryObj } from '@storybook/react-vite';
import { GrpoGroup } from './GrpoGroup';

/**
 * GRPO at Toy Scale — the group-relative advantage computed on a real sampled
 * group (rewards [0,0,0,0,1,0,0,0] → advantages +2.645 / -0.378) and a real
 * 300-step GRPO run: pass rate 31.5% → 84.6%, no critic.
 */
const meta: Meta<typeof GrpoGroup> = {
  title: 'Explainers/GRPO Group',
  component: GrpoGroup,
};
export default meta;

export const Explainer: StoryObj<typeof GrpoGroup> = {};
