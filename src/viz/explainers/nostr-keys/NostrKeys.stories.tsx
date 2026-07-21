import type { Meta, StoryObj } from '@storybook/react-vite';
import { NostrKeys } from './NostrKeys';

const meta: Meta<typeof NostrKeys> = {
  title: 'Explainers/Nostr — Keys and Signatures',
  component: NostrKeys,
};
export default meta;

export const SchnorrSecp256k1: StoryObj<typeof NostrKeys> = {};
