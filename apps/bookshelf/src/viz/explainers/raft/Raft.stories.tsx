import type { Meta, StoryObj } from '@storybook/react-vite';
import { Raft } from './Raft';

/**
 * Raft — leader election & log replication, in one ~70s scripted take:
 * election timers race, S3 wins term 2, a write commits on a majority,
 * a partition strands the leader on the small side, S4 wins term 3, and
 * on heal the uncommitted entry rolls back and the logs converge.
 * Scrub it — every frame is a pure function of the slider.
 */
const meta: Meta<typeof Raft> = {
  title: 'Explainers/Raft Consensus',
  component: Raft,
};
export default meta;

export const LeaderElectionAndLogReplication: StoryObj<typeof Raft> = {};
