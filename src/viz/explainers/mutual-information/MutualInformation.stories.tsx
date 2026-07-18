import type { Meta, StoryObj } from '@storybook/react-vite';
import { MutualInformation } from './MutualInformation';

/**
 * Mutual Information — what one thing tells you about another.
 * A real joint table beside its independent twin, and the honest bar
 * accounting where H(X) and H(Y) slide together until the overlap is forced
 * to I = 0.348 bits.
 */
const meta: Meta<typeof MutualInformation> = {
  title: 'Explainers/Mutual Information',
  component: MutualInformation,
};
export default meta;

export const Explainer: StoryObj<typeof MutualInformation> = {};
