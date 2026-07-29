import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForensicsCaughtAction } from './ForensicsCaughtAction';

/** arXiv:2606.26071 — Model Forensics, chapter 1: the caught action. */
const meta: Meta<typeof ForensicsCaughtAction> = {
  title: 'Explainers/Forensics Caught Action',
  component: ForensicsCaughtAction,
};
export default meta;

export const Explainer: StoryObj<typeof ForensicsCaughtAction> = {};
