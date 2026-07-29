import type { Meta, StoryObj } from '@storybook/react-vite';
import { WordEmbeddings } from './WordEmbeddings';

/**
 * Word Embeddings — words become directions.
 * Sixteen hand-built 4-D feature vectors condense from a scatter into a 2-D
 * projection: similar words cluster, cosines measure similarity, and real
 * vector arithmetic (king − man + woman ≈ queen; dog − puppy + kitten ≈ cat)
 * shows that directions carry meaning.
 */
const meta: Meta<typeof WordEmbeddings> = {
  title: 'Explainers/Embeddings',
  component: WordEmbeddings,
};
export default meta;

export const Explainer: StoryObj<typeof WordEmbeddings> = {};
