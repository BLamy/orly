import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageRank } from './PageRank';

const meta: Meta<typeof PageRank> = {
  title: 'Explainers/PageRank',
  component: PageRank,
};
export default meta;

export const TheRandomSurfer: StoryObj<typeof PageRank> = {};
