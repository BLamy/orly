import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlFrontier } from './ControlFrontier';

/** Explained: AI Control — untrusted-monitor protocols, computed + reported. */
const meta: Meta<typeof ControlFrontier> = { title: 'Explainers/ControlFrontier', component: ControlFrontier };
export default meta;
export const Explainer: StoryObj<typeof ControlFrontier> = {};
