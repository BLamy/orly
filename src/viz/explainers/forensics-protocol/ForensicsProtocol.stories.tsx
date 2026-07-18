import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForensicsProtocol } from './ForensicsProtocol';

/** arXiv:2606.26071 — Model Forensics, chapter 2: the two-step protocol. */
const meta: Meta<typeof ForensicsProtocol> = {
  title: 'Explainers/Forensics Protocol',
  component: ForensicsProtocol,
};
export default meta;

export const Explainer: StoryObj<typeof ForensicsProtocol> = {};
