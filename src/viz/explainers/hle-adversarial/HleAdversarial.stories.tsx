import type { Meta, StoryObj } from '@storybook/react-vite';
import { HleAdversarial } from './HleAdversarial';

/**
 * Humanity's Last Exam: Adversarial Sourcing — a seeded 400-item bank is
 * sieved by a gen-0 model (228 survive at 7.5%); adversarial vs random
 * sampling and their per-generation discrimination, plus the reported
 * 3-9% → ~50% public record.
 */
const meta: Meta<typeof HleAdversarial> = {
  title: 'Explainers/HLE Adversarial',
  component: HleAdversarial,
};
export default meta;

export const Explainer: StoryObj<typeof HleAdversarial> = {};
