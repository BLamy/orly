import type { Meta, StoryObj } from '@storybook/react-vite';
import { CtcBeam } from './CtcBeam';

/**
 * CTC and Beam Search — an exactly-enumerated 729-path CTC lattice where
 * greedy decodes silence (p 0.007) but the summed best transcript is "AB"
 * (p 0.128); a real width-3 prefix beam search finds it.
 */
const meta: Meta<typeof CtcBeam> = {
  title: 'Explainers/CTC and Beam Search',
  component: CtcBeam,
};
export default meta;

export const Explainer: StoryObj<typeof CtcBeam> = {};
