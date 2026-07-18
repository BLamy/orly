import type { Meta, StoryObj } from '@storybook/react-vite';
import { RulesVsPreferences } from './RulesVsPreferences';

/**
 * Rules vs Learned Preferences — a real Bradley-Terry reward fit from 240
 * noisy pairwise votes (9.4% of pairs end up misranked) beside a written
 * rule: exact on its domain, silent off it.
 */
const meta: Meta<typeof RulesVsPreferences> = {
  title: 'Explainers/Rules vs Preferences',
  component: RulesVsPreferences,
};
export default meta;

export const Explainer: StoryObj<typeof RulesVsPreferences> = {};
