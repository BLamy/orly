import type { Meta, StoryObj } from '@storybook/react-vite';
import { Gan } from './Gan';

/**
 * The GAN Game — forger versus detective.
 * Two real adversarial training runs on a two-mode 1-D distribution: a
 * flexible generator smears into a blur across both modes; a narrow one
 * commits to a single mode — honest, recorded mode collapse.
 */
const meta: Meta<typeof Gan> = {
  title: 'Explainers/The GAN Game',
  component: Gan,
};
export default meta;

export const Explainer: StoryObj<typeof Gan> = {};
