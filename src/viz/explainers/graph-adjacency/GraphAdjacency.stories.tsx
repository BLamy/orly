import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphAdjacency } from './GraphAdjacency';

/**
 * Graph Adjacency — one real 10-node, 15-edge graph shown as node-link and
 * as its adjacency matrix (blocks, bridge cell, degrees, 15/45 sparsity).
 */
const meta: Meta<typeof GraphAdjacency> = {
  title: 'Explainers/Graph Adjacency',
  component: GraphAdjacency,
};
export default meta;

export const Explainer: StoryObj<typeof GraphAdjacency> = {};
