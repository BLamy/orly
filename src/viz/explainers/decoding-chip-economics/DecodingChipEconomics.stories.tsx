import type { Meta, StoryObj } from '@storybook/react-vite';
import { DecodingChipEconomics } from './DecodingChipEconomics';

/** Serving the Mixture — arXiv:2607.12696 / 2607.08782 / 2607.13068. */
const meta: Meta<typeof DecodingChipEconomics> = {
  title: 'Explainers/Decoding Chip Economics',
  component: DecodingChipEconomics,
};
export default meta;

export const Explainer: StoryObj<typeof DecodingChipEconomics> = {};
