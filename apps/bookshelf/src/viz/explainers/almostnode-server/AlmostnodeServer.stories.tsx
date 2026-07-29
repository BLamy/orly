import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlmostnodeServer } from './AlmostnodeServer';

const meta: Meta<typeof AlmostnodeServer> = {
  title: 'Explainers/almostnode — A Server Made of Tab',
  component: AlmostnodeServer,
};
export default meta;

export const AServerMadeOfTab: StoryObj<typeof AlmostnodeServer> = {};
