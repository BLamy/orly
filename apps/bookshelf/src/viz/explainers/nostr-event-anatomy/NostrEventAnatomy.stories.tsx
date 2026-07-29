import type { Meta, StoryObj } from '@storybook/react-vite';
import { NostrEventAnatomy } from './NostrEventAnatomy';

const meta: Meta<typeof NostrEventAnatomy> = {
  title: 'Explainers/Nostr — Anatomy of an Event',
  component: NostrEventAnatomy,
};
export default meta;

export const Nip01: StoryObj<typeof NostrEventAnatomy> = {};
