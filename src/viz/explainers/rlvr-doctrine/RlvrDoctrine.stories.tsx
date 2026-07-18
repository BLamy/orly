import type { Meta, StoryObj } from '@storybook/react-vite';
import { RlvrDoctrine } from './RlvrDoctrine';

/**
 * The Doctrine — 14 real training runs sweeping exploit gameability: a cliff
 * at the best honest pass rate (85%). Below it, a solver (84.6% true);
 * above it, a lock pick (3.3%). The check must be harder to game than the
 * task is to solve.
 */
const meta: Meta<typeof RlvrDoctrine> = {
  title: 'Explainers/RLVR Doctrine',
  component: RlvrDoctrine,
};
export default meta;

export const Explainer: StoryObj<typeof RlvrDoctrine> = {};
