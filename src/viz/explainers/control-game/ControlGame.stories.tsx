import type { Meta, StoryObj } from '@storybook/react-vite';
import { ControlGame } from './ControlGame';

/** Explained: AI Control — untrusted-monitor protocols, computed + reported. */
const meta: Meta<typeof ControlGame> = { title: 'Explainers/ControlGame', component: ControlGame };
export default meta;
export const Explainer: StoryObj<typeof ControlGame> = {};
