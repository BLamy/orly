import type { Meta, StoryObj } from '@storybook/react-vite';
import { SandboxArchitecture } from './SandboxArchitecture';

/** Explained: The Sandbox — grounded in the real almostnode code at ~/Dev/almostnode. */
const meta: Meta<typeof SandboxArchitecture> = {
  title: 'Explainers/SandboxArchitecture',
  component: SandboxArchitecture,
};
export default meta;
export const Explainer: StoryObj<typeof SandboxArchitecture> = {};
