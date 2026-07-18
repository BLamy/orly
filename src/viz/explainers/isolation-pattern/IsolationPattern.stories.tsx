import type { Meta, StoryObj } from '@storybook/react-vite';
import { IsolationPattern } from './IsolationPattern';

/** Explained: The Sandbox — grounded in the real almostnode code at ~/Dev/almostnode. */
const meta: Meta<typeof IsolationPattern> = {
  title: 'Explainers/IsolationPattern',
  component: IsolationPattern,
};
export default meta;
export const Explainer: StoryObj<typeof IsolationPattern> = {};
