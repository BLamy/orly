import type { Meta, StoryObj } from '@storybook/react-vite';
import { NostrEventAnatomy } from '../../explainers/nostr-event-anatomy/NostrEventAnatomy';

const meta: Meta<typeof NostrEventAnatomy> = {
  title: 'Books/The Event/Chapter 1',
  component: NostrEventAnatomy,
};
export default meta;

export const AnatomyOfAnEvent: StoryObj<typeof NostrEventAnatomy> = {};
