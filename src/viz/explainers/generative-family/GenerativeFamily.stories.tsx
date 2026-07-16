import type { Meta, StoryObj } from '@storybook/react-vite';
import { GenerativeFamily } from './GenerativeFamily';

/**
 * Diffusion, Revisited From Here — the generative family tree.
 * The exact closed-form forward-noising of diffusion melting (and re-forming)
 * a seeded spiral, then VAE / GAN / autoregressive / diffusion placed on one
 * map by where each spends its compute.
 */
const meta: Meta<typeof GenerativeFamily> = {
  title: 'Explainers/The Generative Family',
  component: GenerativeFamily,
};
export default meta;

export const Explainer: StoryObj<typeof GenerativeFamily> = {};
