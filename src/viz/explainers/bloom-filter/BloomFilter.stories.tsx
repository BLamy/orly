import type { Meta, StoryObj } from '@storybook/react-vite';
import { BloomFilter } from './BloomFilter';

const meta: Meta<typeof BloomFilter> = {
  title: 'Explainers/Bloom Filters',
  component: BloomFilter,
};
export default meta;

export const CertaintyAboutAbsence: StoryObj<typeof BloomFilter> = {};
