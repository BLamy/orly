import type { Meta, StoryObj } from '@storybook/react-vite';
import { SparseAutoencoder } from './SparseAutoencoder';

/**
 * Sparse Autoencoders — unmixing the residual stream.
 * A real SAE trained on toy superposed data: decoder directions (training
 * snapshots) locking onto the five planted feature directions, final
 * cosines 0.96–1.00.
 */
const meta: Meta<typeof SparseAutoencoder> = {
  title: 'Explainers/Sparse Autoencoders',
  component: SparseAutoencoder,
};
export default meta;

export const Explainer: StoryObj<typeof SparseAutoencoder> = {};
