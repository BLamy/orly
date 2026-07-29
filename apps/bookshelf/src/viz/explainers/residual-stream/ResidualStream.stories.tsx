import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResidualStream } from './ResidualStream';

/**
 * The Residual Stream — a highway with editors.
 * A 6-dimensional hidden state rides a highway through four transformer
 * blocks; each block reads the stream, computes a real tanh(Wx) update, and
 * adds it back. The intro contrasts replace (norm decays under a contractive
 * map) with add (norm survives).
 */
const meta: Meta<typeof ResidualStream> = {
  title: 'Explainers/The Residual Stream',
  component: ResidualStream,
};
export default meta;

export const Explainer: StoryObj<typeof ResidualStream> = {};
