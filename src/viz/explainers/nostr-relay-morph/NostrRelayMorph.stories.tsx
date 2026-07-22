import type { Meta, StoryObj } from '@storybook/react-vite';
import { NostrRelayMorph } from './NostrRelayMorph';

const meta: Meta<typeof NostrRelayMorph> = {
  title: 'Explainers/Nostr — JSON to Picture and Back',
  component: NostrRelayMorph,
};
export default meta;

export const Nip65RelayList: StoryObj<typeof NostrRelayMorph> = {};
