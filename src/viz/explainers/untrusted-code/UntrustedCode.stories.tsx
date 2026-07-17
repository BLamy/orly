import type { Meta, StoryObj } from '@storybook/react-vite';
import { UntrustedCode } from './UntrustedCode';

/** Explained: The Sandbox — grounded in the real almostnode code at ~/Dev/almostnode. */
const meta: Meta<typeof UntrustedCode> = {
  title: 'Explainers/UntrustedCode',
  component: UntrustedCode,
};
export default meta;
export const Explainer: StoryObj<typeof UntrustedCode> = {};
