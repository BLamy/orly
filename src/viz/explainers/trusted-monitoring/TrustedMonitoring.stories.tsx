import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrustedMonitoring } from './TrustedMonitoring';

/** Explained: AI Control — untrusted-monitor protocols, computed + reported. */
const meta: Meta<typeof TrustedMonitoring> = { title: 'Explainers/TrustedMonitoring', component: TrustedMonitoring };
export default meta;
export const Explainer: StoryObj<typeof TrustedMonitoring> = {};
