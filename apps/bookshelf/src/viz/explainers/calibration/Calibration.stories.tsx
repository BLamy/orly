import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calibration } from './Calibration';

/**
 * Calibration — a really-trained overconfident logistic classifier (w=24.8
 * from 8 points), its reliability diagram on 4000 fresh points (ECE 0.239),
 * and temperature scaling repairing it to 0.041.
 */
const meta: Meta<typeof Calibration> = {
  title: 'Explainers/Calibration',
  component: Calibration,
};
export default meta;

export const Explainer: StoryObj<typeof Calibration> = {};
