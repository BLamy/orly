import type { Meta, StoryObj } from '@storybook/react-vite';
import { LrSchedules } from './LrSchedules';

/**
 * Learning-Rate Schedules — big steps to travel, small steps to land.
 * Real stochastic gradient descent on a noisy bowl under three schedules:
 * constant high orbits the minimum in a jitter ball, constant low crawls,
 * cosine decay sprints then settles and beats both; plus warmup vs a
 * diverging cold start on the steep rim.
 */
const meta: Meta<typeof LrSchedules> = {
  title: 'Explainers/Learning-Rate Schedules',
  component: LrSchedules,
};
export default meta;

export const Explainer: StoryObj<typeof LrSchedules> = {};
