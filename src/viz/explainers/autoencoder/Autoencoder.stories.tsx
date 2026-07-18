import type { Meta, StoryObj } from '@storybook/react-vite';
import { Autoencoder } from './Autoencoder';

/**
 * The Autoencoder — compress, then reconstruct.
 * A real linear autoencoder (2→1→2) trained by gradient descent on seeded
 * correlated data: the decoder line swings onto the data's principal axis,
 * reconstruction segments shrink, and the loss stops at the noise floor.
 */
const meta: Meta<typeof Autoencoder> = {
  title: 'Explainers/The Autoencoder',
  component: Autoencoder,
};
export default meta;

export const Explainer: StoryObj<typeof Autoencoder> = {};
