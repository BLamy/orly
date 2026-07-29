import type { Meta, StoryObj } from '@storybook/react-vite';
import { NostrKeys } from '../../explainers/nostr-keys/NostrKeys';

const meta: Meta<typeof NostrKeys> = {
  title: 'Books/The Event/Chapter 2',
  component: NostrKeys,
};
export default meta;

export const KeysAndSignatures: StoryObj<typeof NostrKeys> = {};
