import type { Meta, StoryObj } from '@storybook/react-vite';
import { Vae } from './Vae';

/**
 * The VAE — a latent space you can walk.
 * A real linear variational autoencoder trained on the closed-form
 * reconstruction + KL objective: codes pack under the standard-normal prior
 * (0.82² + 0.57² ≈ 1), then a latent walk and a true latent interpolation.
 */
const meta: Meta<typeof Vae> = {
  title: 'Explainers/The VAE',
  component: Vae,
};
export default meta;

export const Explainer: StoryObj<typeof Vae> = {};
