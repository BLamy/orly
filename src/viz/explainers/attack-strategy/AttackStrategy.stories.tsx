import type { Meta, StoryObj } from '@storybook/react-vite';
import { AttackStrategy } from './AttackStrategy';

/** Explained: AI Control — untrusted-monitor protocols, computed + reported. */
const meta: Meta<typeof AttackStrategy> = { title: 'Explainers/AttackStrategy', component: AttackStrategy };
export default meta;
export const Explainer: StoryObj<typeof AttackStrategy> = {};
