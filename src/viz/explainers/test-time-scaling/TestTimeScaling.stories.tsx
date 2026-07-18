import type { Meta, StoryObj } from '@storybook/react-vite';
import { TestTimeScaling } from './TestTimeScaling';

/**
 * The New Scaling Law — reported test-time results replotted (self-consistency
 * 56.5→74.4%, repeated-sampling coverage 15.9→56%) plus the toy compute
 * trade: small model + verifier beats a 10x-cost big model at equal budget.
 */
const meta: Meta<typeof TestTimeScaling> = {
  title: 'Explainers/Test-Time Scaling',
  component: TestTimeScaling,
};
export default meta;

export const Explainer: StoryObj<typeof TestTimeScaling> = {};
