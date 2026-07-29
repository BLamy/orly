import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphSpectral } from './GraphSpectral';

/**
 * Graph Spectral — the Fiedler vector of the community graph, really
 * computed by deflated power iteration (perfect sign split, bridge nodes
 * nearest zero, λ₂ ≈ 0.24).
 */
const meta: Meta<typeof GraphSpectral> = {
  title: 'Explainers/Graph Spectral',
  component: GraphSpectral,
};
export default meta;

export const Explainer: StoryObj<typeof GraphSpectral> = {};
