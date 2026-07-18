import type { Meta, StoryObj } from '@storybook/react-vite';
import { HoneypotAudit } from './HoneypotAudit';

/** Explained: AI Control — untrusted-monitor protocols, computed + reported. */
const meta: Meta<typeof HoneypotAudit> = { title: 'Explainers/HoneypotAudit', component: HoneypotAudit };
export default meta;
export const Explainer: StoryObj<typeof HoneypotAudit> = {};
